import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  equalHeightFootprintPromotionSummary,
  planEqualHeightFootprintSourcePromotion,
  promoteEqualHeightFootprintSources,
  sortEqualHeightFootprintSourceChanges,
} from './highOblique/equalHeightFootprintSourcePromotion';

interface CliOptions {
  readonly write: boolean;
}

function usage(): string {
  return [
    'Usage: tsx scripts/promoteQuotaCoEqualHeightFootprint.ts [--check | --write]',
    '',
    '--check validates that the canonical all-47 source bank is accepted-112.',
    '--write performs the guarded legacy-68 to accepted-112 source migration.',
    'No flag is equivalent to --check.',
  ].join('\n');
}

function parseArgs(args: readonly string[]): CliOptions {
  let write = false;
  for (const argument of args) {
    if (argument === '--check') continue;
    if (argument === '--write') {
      write = true;
      continue;
    }
    if (argument === '--help' || argument === '-h') {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    }
    throw new Error(`Unknown argument ${argument}\n\n${usage()}`);
  }
  if (args.includes('--check') && write) {
    throw new Error(`--check and --write are mutually exclusive\n\n${usage()}`);
  }
  return { write };
}

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const sourceRoots = [
  {
    inputDir: path.join(
      repositoryRoot,
      'assets/walls/quota-co-building-system',
    ),
    sourcePathPrefix: 'assets/walls/quota-co-building-system',
  },
  {
    inputDir: path.join(
      repositoryRoot,
      'assets/walls/quota-co-building-system-proofs',
    ),
    sourcePathPrefix:
      'assets/walls/quota-co-building-system-proofs',
  },
] as const;

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (options.write) {
    const result = await promoteEqualHeightFootprintSources(sourceRoots);
    process.stdout.write(
      `Promoted QuotaCo equal-height footprint: ` +
      `${equalHeightFootprintPromotionSummary(result)}\n`,
    );
    return;
  }
  const result = await planEqualHeightFootprintSourcePromotion(sourceRoots);
  if (result.state !== 'accepted-112') {
    for (const change of sortEqualHeightFootprintSourceChanges(
      result.changes,
    )) {
      process.stdout.write(
        `${change.sourceFile}: ${change.pathCount} paths ` +
        `(owner mask_${change.ownerMask})\n`,
      );
    }
    throw new Error(
      `QuotaCo equal-height footprint requires promotion: ` +
      `${equalHeightFootprintPromotionSummary(result)}; ` +
      'review the plan, then rerun with --write',
    );
  }
  process.stdout.write(
    `QuotaCo equal-height footprint source check passed: ` +
    `${equalHeightFootprintPromotionSummary(result)}\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
