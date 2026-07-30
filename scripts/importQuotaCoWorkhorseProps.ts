import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  compileQuotaCoWorkhorseProps,
  emitQuotaCoWorkhorsePropArt,
} from './props/importer';

interface CliOptions {
  check: boolean;
  input: string;
  output: string;
}

function defaultInput(root: string): string {
  return path.join(root, 'assets/props/quota-co-workhorse-v1');
}

function defaultOutput(root: string): string {
  return path.join(root, 'src/props/generated/quotaCoWorkhorseArt.ts');
}

function usage(): string {
  return [
    'Usage: tsx scripts/importQuotaCoWorkhorseProps.ts [--check] [--input <dir>] [--out <file>]',
    '',
    'Defaults:',
    '  --input assets/props/quota-co-workhorse-v1',
    '  --out   src/props/generated/quotaCoWorkhorseArt.ts',
  ].join('\n');
}

function parseArgs(args: string[], root: string): CliOptions {
  const options: CliOptions = {
    check: false,
    input: defaultInput(root),
    output: defaultOutput(root),
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
  const imports = await compileQuotaCoWorkhorseProps(options.input, prefix);
  const expected = emitQuotaCoWorkhorsePropArt(imports);
  const current = await readFile(options.output, 'utf8').catch(() => undefined);

  if (options.check) {
    if (current !== expected) {
      throw new Error(
        `${path.relative(root, options.output)} is stale; run npm run props:import`,
      );
    }
    process.stdout.write(`Prop import is current (${imports.length} SVG sources).\n`);
    return;
  }

  if (current === expected) {
    process.stdout.write(`Prop import unchanged (${imports.length} SVG sources).\n`);
    return;
  }

  await mkdir(path.dirname(options.output), { recursive: true });
  const temporary = `${options.output}.tmp-${process.pid}`;
  await writeFile(temporary, expected, 'utf8');
  await rename(temporary, options.output);
  process.stdout.write(
    `Imported ${imports.length} prop SVG sources into ${path.relative(root, options.output)}.\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
