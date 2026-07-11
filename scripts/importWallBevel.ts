import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  compileWallBevelDirectory,
  emitWallBevelRegistry,
} from './walls/importer';

interface CliOptions {
  check: boolean;
  input: string;
  output: string;
}

function defaults(root: string): CliOptions {
  return {
    check: false,
    input: path.join(root, 'assets/walls/bevel'),
    output: path.join(root, 'src/tiles/generated/importedWallBevelArt.ts'),
  };
}

function usage(): string {
  return [
    'Usage: tsx scripts/importWallBevel.ts [--check] [--input <dir>] [--out <file>]',
    '',
    'Defaults:',
    '  --input assets/walls/bevel',
    '  --out   src/tiles/generated/importedWallBevelArt.ts',
  ].join('\n');
}

function parseArgs(args: string[], root: string): CliOptions {
  const options = defaults(root);
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === '--check') options.check = true;
    else if (argument === '--input' || argument === '--out') {
      const value = args[++index];
      if (!value) throw new Error(`${argument} requires a path\n\n${usage()}`);
      if (argument === '--input') options.input = path.resolve(root, value);
      else options.output = path.resolve(root, value);
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
  const sourcePathPrefix = path.relative(root, options.input).replaceAll(path.sep, '/');
  const pieces = await compileWallBevelDirectory({
    inputDir: options.input,
    sourcePathPrefix,
  });
  const expected = emitWallBevelRegistry(pieces);
  const current = await readFile(options.output, 'utf8').catch(() => undefined);

  if (options.check) {
    if (current !== expected) {
      throw new Error(`${path.relative(root, options.output)} is stale; run npm run walls:import`);
    }
    process.stdout.write(`Wall bevel import is current (${pieces.length} pieces).\n`);
    return;
  }

  if (current === expected) {
    process.stdout.write(`Wall bevel import unchanged (${pieces.length} pieces).\n`);
    return;
  }

  await mkdir(path.dirname(options.output), { recursive: true });
  const temporary = `${options.output}.tmp-${process.pid}`;
  await writeFile(temporary, expected, 'utf8');
  await rename(temporary, options.output);
  process.stdout.write(
    `Imported ${pieces.length} wall bevel pieces into ${path.relative(root, options.output)}.\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
