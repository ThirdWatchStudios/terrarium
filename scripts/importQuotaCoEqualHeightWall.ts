import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { equalHeightAllMaskSourceFootprintState } from './highOblique/equalHeightFootprintAllMaskCalibration';
import {
  compileEqualHeightEvaluationFrames,
  emitQuotaCoEqualHeightWallRegistry,
} from './walls/equalHeightImporter';

interface CliOptions {
  check: boolean;
  output: string;
}

function defaults(root: string): CliOptions {
  return {
    check: false,
    output: path.join(
      root,
      'src/tiles/generated/importedQuotaCoEqualHeightWallArt.ts',
    ),
  };
}

function usage(): string {
  return [
    'Usage: tsx scripts/importQuotaCoEqualHeightWall.ts [--check] [--out <file>]',
    '',
    'Compiles the accepted QuotaCo all-47 SVG and ledger bank into browser-safe',
    'production data used by every normal Terrarium export.',
  ].join('\n');
}

function parseArgs(args: string[], root: string): CliOptions {
  const options = defaults(root);
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--check') {
      options.check = true;
    } else if (argument === '--out') {
      const value = args[++index];
      if (!value) throw new Error(`${argument} requires a path\n\n${usage()}`);
      options.output = path.resolve(root, value);
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
  const frames = await compileEqualHeightEvaluationFrames({
    sourceRoots: [
      {
        inputDir: path.join(root, 'assets/walls/quota-co-building-system'),
        sourcePathPrefix: 'assets/walls/quota-co-building-system',
      },
      {
        inputDir: path.join(
          root,
          'assets/walls/quota-co-building-system-proofs',
        ),
        sourcePathPrefix:
          'assets/walls/quota-co-building-system-proofs',
      },
    ],
  });
  const state = equalHeightAllMaskSourceFootprintState(frames);
  if (state !== 'accepted-112') {
    throw new Error(
      `QuotaCo production wall source bank is ${state}; expected accepted-112`,
    );
  }

  const expected = emitQuotaCoEqualHeightWallRegistry(frames);
  const current = await readFile(options.output, 'utf8').catch(() => undefined);
  if (options.check) {
    if (current !== expected) {
      throw new Error(
        `${path.relative(root, options.output)} is stale; run npm run walls:import`,
      );
    }
    process.stdout.write(
      `QuotaCo equal-height wall production import is current (${frames.length} frames).\n`,
    );
    return;
  }

  if (current === expected) {
    process.stdout.write(
      `QuotaCo equal-height wall production import unchanged (${frames.length} frames).\n`,
    );
    return;
  }

  await mkdir(path.dirname(options.output), { recursive: true });
  const temporary = `${options.output}.tmp-${process.pid}`;
  await writeFile(temporary, expected, 'utf8');
  await rename(temporary, options.output);
  process.stdout.write(
    `Imported ${frames.length} QuotaCo wall frames into ` +
    `${path.relative(root, options.output)}.\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
