import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { PART_IMPORT_TARGETS } from './parts/catalog';
import { compilePartDirectory, emitImportedPartArt } from './parts/importer';

interface CliOptions {
  check: boolean;
  input: string;
  output: string;
}

function usage(): string {
  return [
    'Usage: tsx scripts/importParts.ts [--check] [--input <dir>] [--out <file>]',
    '',
    'Defaults:',
    '  --input assets/parts',
    '  --out   src/parts/generated/importedPartArt.ts',
  ].join('\n');
}

function parseArgs(args: string[], root: string): CliOptions {
  const options: CliOptions = {
    check: false,
    input: path.join(root, 'assets/parts'),
    output: path.join(root, 'src/parts/generated/importedPartArt.ts'),
  };
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === '--check') options.check = true;
    else if (argument === '--input' || argument === '--out') {
      const value = args[++index];
      if (!value) throw new Error(`${argument} requires a path\n\n${usage()}`);
      const resolved = path.resolve(root, value);
      if (argument === '--input') options.input = resolved;
      else options.output = resolved;
    } else if (argument === '--help' || argument === '-h') {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument ${argument}\n\n${usage()}`);
    }
  }
  return options;
}

async function main(): Promise<void> {
  const root = process.cwd();
  const options = parseArgs(process.argv.slice(2), root);
  const prefix = path.relative(root, options.input).replaceAll(path.sep, '/');
  const imports = await compilePartDirectory({
    inputDir: options.input,
    sourcePathPrefix: prefix,
    catalog: PART_IMPORT_TARGETS,
  });
  const expected = emitImportedPartArt(imports);
  const current = await readFile(options.output, 'utf8').catch(() => undefined);

  if (options.check) {
    if (current !== expected) {
      throw new Error(
        `${path.relative(root, options.output)} is stale; run npm run parts:import`,
      );
    }
    process.stdout.write(`Part import is current (${imports.length} part${imports.length === 1 ? '' : 's'}).\n`);
    return;
  }

  if (current === expected) {
    process.stdout.write(`Part import unchanged (${imports.length} part${imports.length === 1 ? '' : 's'}).\n`);
    return;
  }

  await mkdir(path.dirname(options.output), { recursive: true });
  const temporary = `${options.output}.tmp-${process.pid}`;
  await writeFile(temporary, expected, 'utf8');
  await rename(temporary, options.output);
  process.stdout.write(`Imported ${imports.length} part${imports.length === 1 ? '' : 's'} into ${path.relative(root, options.output)}.\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
