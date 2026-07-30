import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  compileQuotaCoMaintainedHybridSurfaces,
  emitQuotaCoMaintainedHybridSurfaceArt,
} from './tiles/importer';

interface CliOptions {
  readonly check: boolean;
  readonly input: string;
  readonly output: string;
}

function defaultInput(root: string): string {
  return path.join(
    root,
    'assets',
    'tiles',
    'quota-co-maintained-hybrid-v1',
  );
}

function defaultOutput(root: string): string {
  return path.join(
    root,
    'src',
    'tiles',
    'generated',
    'quotaCoMaintainedHybridSurfaceArt.ts',
  );
}

function usage(): string {
  return [
    'Usage: tsx scripts/importQuotaCoMaintainedHybridSurfaces.ts [--check] [--input <dir>] [--out <file>]',
    '',
    'Defaults:',
    '  --input assets/tiles/quota-co-maintained-hybrid-v1',
    '  --out   src/tiles/generated/quotaCoMaintainedHybridSurfaceArt.ts',
  ].join('\n');
}

function parseArgs(args: readonly string[], root: string): CliOptions {
  let check = false;
  let input = defaultInput(root);
  let output = defaultOutput(root);
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--check') {
      check = true;
    } else if (argument === '--input' || argument === '--out') {
      const value = args[++index];
      if (!value) throw new Error(`${argument} requires a path\n\n${usage()}`);
      if (argument === '--input') input = path.resolve(root, value);
      else output = path.resolve(root, value);
    } else if (argument === '--help' || argument === '-h') {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument ${argument}\n\n${usage()}`);
    }
  }
  return { check, input, output };
}

async function main(): Promise<void> {
  const root = process.cwd();
  const options = parseArgs(process.argv.slice(2), root);
  const prefix = path.relative(root, options.input).replaceAll(path.sep, '/');
  const imports = await compileQuotaCoMaintainedHybridSurfaces(
    options.input,
    prefix,
  );
  const expected = emitQuotaCoMaintainedHybridSurfaceArt(imports);
  const current = await readFile(options.output, 'utf8').catch(() => undefined);

  if (options.check) {
    if (current !== expected) {
      throw new Error(
        `${path.relative(root, options.output)} is stale; run npm run surfaces:import`,
      );
    }
    process.stdout.write(
      `Surface import is current (${imports.length} live SVG sources).\n`,
    );
    return;
  }
  if (current === expected) {
    process.stdout.write(
      `Surface import unchanged (${imports.length} live SVG sources).\n`,
    );
    return;
  }

  await mkdir(path.dirname(options.output), { recursive: true });
  const temporary = `${options.output}.tmp-${process.pid}`;
  await writeFile(temporary, expected, 'utf8');
  await rename(temporary, options.output);
  process.stdout.write(
    `Imported ${imports.length} surface SVG sources into ` +
    `${path.relative(root, options.output)} (live source registry).\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
