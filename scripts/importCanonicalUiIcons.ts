import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  compileCanonicalUiIconArt,
  DEPARTMENT_UI_ICON_FAMILY,
  emitCanonicalUiIconArt,
  SHARED_UI_ICON_FAMILY,
} from './ui/canonicalUiIconImporter';

interface Options {
  readonly check: boolean;
  readonly output: string;
}

function parseArgs(argv: readonly string[]): Options {
  let check = false;
  let output = path.resolve('src/parts/generated/canonicalUiIconArt.ts');
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--check') check = true;
    else if (argument === '--write') check = false;
    else if (argument === '--out') {
      const value = argv[++index];
      if (!value) throw new Error(`${argument} requires a path`);
      output = path.resolve(value);
    } else if (argument === '--help' || argument === '-h') {
      process.stdout.write('Usage: tsx scripts/importCanonicalUiIcons.ts [--check|--write] [--out <file>]\n');
      process.exit(0);
    } else throw new Error(`Unknown argument ${argument}`);
  }
  return { check, output };
}

const SOURCE_FAMILIES = [
  {
    input: 'assets/ui/canonical-shared-primitives-v1',
    contract: SHARED_UI_ICON_FAMILY,
  },
  {
    input: 'assets/ui/canonical-department-glyphs-v1',
    contract: DEPARTMENT_UI_ICON_FAMILY,
  },
] as const;

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const imported = (await Promise.all(SOURCE_FAMILIES.map(async ({ input, contract }) => {
    const directory = path.resolve(input);
    const prefix = path.relative(process.cwd(), directory).replaceAll(path.sep, '/');
    return compileCanonicalUiIconArt(directory, prefix, contract);
  }))).flat().sort((left, right) => left.id.localeCompare(right.id));
  const expected = emitCanonicalUiIconArt(imported);
  const current = await readFile(options.output, 'utf8').catch(() => undefined);
  if (options.check) {
    if (current !== expected) {
      throw new Error(`${path.relative(process.cwd(), options.output)} is stale; run npm run ui-shared:import`);
    }
    process.stdout.write(`Canonical UI icon import is current (${imported.length} sources).\n`);
    return;
  }
  if (current === expected) {
    process.stdout.write(`Canonical UI icon import unchanged (${imported.length} sources).\n`);
    return;
  }
  await mkdir(path.dirname(options.output), { recursive: true });
  const temporary = `${options.output}.tmp-${process.pid}`;
  await writeFile(temporary, expected, 'utf8');
  await rename(temporary, options.output);
  process.stdout.write(`Imported ${imported.length} canonical UI icons into ${path.relative(process.cwd(), options.output)}.\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
