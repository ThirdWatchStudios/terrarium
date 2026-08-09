import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  compileQuotaCoDoorArt,
  emitQuotaCoDoorArt,
} from './props/doorImporter';
import { QUOTA_CO_DOOR_SOURCE_DEFINITIONS } from '../src/props/doorManifest';

interface Options {
  readonly check: boolean;
  readonly input: string;
  readonly output: string;
}

function parseArgs(argv: readonly string[]): Options {
  let check = false;
  let input = path.resolve('assets/walls/quota-co-building-openings-v2');
  let output = path.resolve('src/props/generated/quotaCoDoorArt.ts');
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--check') check = true;
    else if (argument === '--write') check = false;
    else if (argument === '--input' || argument === '--out') {
      const value = argv[++index];
      if (!value) throw new Error(`${argument} requires a path`);
      if (argument === '--input') input = path.resolve(value);
      else output = path.resolve(value);
    } else if (argument === '--help' || argument === '-h') {
      process.stdout.write('Usage: tsx scripts/importQuotaCoDoors.ts [--check|--write] [--input <dir>] [--out <file>]\n');
      process.exit(0);
    } else throw new Error(`Unknown argument ${argument}`);
  }
  return { check, input, output };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const prefix = path.relative(process.cwd(), options.input).replaceAll(path.sep, '/');
  const imports = await compileQuotaCoDoorArt(options.input, prefix);
  const expected = emitQuotaCoDoorArt(imports);
  const current = await readFile(options.output, 'utf8').catch(() => undefined);
  if (options.check) {
    if (current !== expected) {
      throw new Error(`${path.relative(process.cwd(), options.output)} is stale; run npm run doors:import`);
    }
    process.stdout.write(
      `QuotaCo door import is current (${QUOTA_CO_DOOR_SOURCE_DEFINITIONS.length} canonical material/fixed-view states).\n`,
    );
    return;
  }
  if (current === expected) {
    process.stdout.write(
      `QuotaCo door import unchanged (${QUOTA_CO_DOOR_SOURCE_DEFINITIONS.length} canonical material/fixed-view states).\n`,
    );
    return;
  }
  await mkdir(path.dirname(options.output), { recursive: true });
  const temporary = `${options.output}.tmp-${process.pid}`;
  await writeFile(temporary, expected, 'utf8');
  await rename(temporary, options.output);
  process.stdout.write(
    `Imported ${QUOTA_CO_DOOR_SOURCE_DEFINITIONS.length} QuotaCo door states into ` +
    `${path.relative(process.cwd(), options.output)}.\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
