import path from 'node:path';

import {
  reconcileEqualHeightProposalPathLocks,
  type EqualHeightProposalPathLockModule,
} from './highOblique/equalHeightProposalPathLocks';

interface CliOptions {
  readonly check: boolean;
  readonly write: boolean;
}

const MODULE_FILENAMES = [
  'a1bDoubleFilledDiagonalCrossJunctionProposal.ts',
  'a1bDoubleFilledEastCrossJunctionProposal.ts',
  'a1bDoubleFilledNorthCrossJunctionProposal.ts',
  'a1bDoubleFilledSouthCrossJunctionProposal.ts',
  'a1bHorizontalOpenPocketTJunctionProposal.ts',
  'a1bOpenPocketCrossJunctionProposal.ts',
  'a1bSingleFilledCrossJunctionProposal.ts',
  'a1bSingleFilledNorthwestCrossJunctionProposal.ts',
  'a1bSingleFilledSoutheastCrossJunctionProposal.ts',
  'a1bSingleOpenNorthwestCrossJunctionProposal.ts',
  'a1bSingleOpenSouthwestCrossJunctionProposal.ts',
] as const;

function usage(): string {
  return [
    'Usage: tsx scripts/reconcileEqualHeightProposalPathLocks.ts [--check | --write]',
    '',
    'No flag performs a read-only dry run.',
    '--check exits nonzero when proposal path locks differ from their source SVGs.',
    '--write updates only the locked d string literals in the proposal modules.',
  ].join('\n');
}

function parseArgs(args: readonly string[]): CliOptions {
  let check = false;
  let write = false;
  for (const argument of args) {
    if (argument === '--check') check = true;
    else if (argument === '--write') write = true;
    else if (argument === '--help' || argument === '-h') {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument ${argument}\n\n${usage()}`);
    }
  }
  if (check && write) {
    throw new Error(`--check and --write are mutually exclusive\n\n${usage()}`);
  }
  return { check, write };
}

const rootDir = process.cwd();
const moduleDir = path.join(rootDir, 'scripts/highOblique');
const modules: readonly EqualHeightProposalPathLockModule[] =
  MODULE_FILENAMES.map((filename) => ({
    moduleFile: path.join(moduleDir, filename),
    ...(filename === 'a1bHorizontalOpenPocketTJunctionProposal.ts'
      ? {
          arraySourceIds: {
            OPEN_S_UPPER_EXACT_PATHS: 'open_s_t_junction-upper',
            OPEN_N_UPPER_EXACT_PATHS: 'open_n_t_junction-upper',
          },
        }
      : {}),
  }));

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const result = await reconcileEqualHeightProposalPathLocks({
    rootDir,
    sourceDir: path.join(
      rootDir,
      'assets/walls/quota-co-building-system-proofs',
    ),
    modules,
    write: options.write,
  });
  const changedModules = new Set(
    result.changes.map(({ moduleFile }) => moduleFile),
  );

  if (result.changes.length === 0) {
    process.stdout.write(
      `Equal-height proposal path locks are current ` +
      `(${result.lockCount} locks across ${result.moduleCount} modules).\n`,
    );
    return;
  }

  for (const moduleFile of [...changedModules].sort()) {
    const count = result.changes.filter(
      (change) => change.moduleFile === moduleFile,
    ).length;
    process.stdout.write(
      `${path.relative(rootDir, moduleFile)}: ${count} stale path lock` +
      `${count === 1 ? '' : 's'}\n`,
    );
  }
  const summary =
    `${result.changes.length} path locks across ${changedModules.size} modules`;
  if (options.write) {
    process.stdout.write(`Reconciled ${summary}.\n`);
    return;
  }
  if (options.check) {
    throw new Error(
      `Equal-height proposal path locks are stale (${summary}); ` +
      'run this command with --write after reviewing the promoted SVGs',
    );
  }
  process.stdout.write(
    `Dry run found ${summary}; no files changed. ` +
    'Use --write to reconcile them.\n',
  );
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
