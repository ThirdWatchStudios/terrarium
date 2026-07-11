import {
  mkdir,
  readFile,
  readdir,
  rename,
  unlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  generatePartAuthoringAssets,
  PART_AUTHORING_OWNED_DIRS,
  type GeneratedPartAuthoringAsset,
} from './parts/scaffolds';

interface CliOptions {
  check: boolean;
  root: string;
}

function usage(): string {
  return [
    'Usage: tsx scripts/generatePartScaffolds.ts [--check] [--root <repo-root>]',
    '',
    'Generates committed body/head/hair/outfit SVG scaffolds plus ASE/GPL/SVG sentinel palettes.',
  ].join('\n');
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = { check: false, root: process.cwd() };
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === '--check') options.check = true;
    else if (argument === '--root') {
      const value = args[++index];
      if (!value) throw new Error(`--root requires a path\n\n${usage()}`);
      options.root = path.resolve(value);
    } else if (argument === '--help' || argument === '-h') {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument ${argument}\n\n${usage()}`);
    }
  }
  return options;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

async function filesBelow(directory: string): Promise<string[]> {
  const files: string[] = [];
  const visit = async (current: string): Promise<void> => {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw error;
    }
    entries.sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else if (entry.isFile()) files.push(absolute);
    }
  };
  await visit(directory);
  return files;
}

async function actualOwnedPaths(root: string): Promise<string[]> {
  const paths: string[] = [];
  for (const ownedDirectory of PART_AUTHORING_OWNED_DIRS) {
    for (const absolute of await filesBelow(path.join(root, ownedDirectory))) {
      paths.push(path.relative(root, absolute).replaceAll(path.sep, '/'));
    }
  }
  return paths.sort(compareText);
}

function expectedMap(): Map<string, GeneratedPartAuthoringAsset> {
  return new Map(generatePartAuthoringAssets().map((asset) => [asset.path, asset]));
}

export function generatedPartAuthoringAssetCount(): number {
  return expectedMap().size;
}

export async function partAuthoringAssetMismatches(root: string): Promise<string[]> {
  const expected = expectedMap();
  const actual = await actualOwnedPaths(root);
  const actualSet = new Set(actual);
  const mismatches: string[] = [];

  for (const [relativePath, asset] of expected) {
    if (!actualSet.has(relativePath)) {
      mismatches.push(`missing ${relativePath}`);
      continue;
    }
    const bytes = await readFile(path.join(root, relativePath));
    if (!bytes.equals(asset.bytes)) mismatches.push(`modified ${relativePath}`);
  }
  for (const relativePath of actual) {
    if (!expected.has(relativePath)) mismatches.push(`orphaned ${relativePath}`);
  }
  return mismatches;
}

export async function checkPartAuthoringAssets(root: string): Promise<void> {
  const mismatches = await partAuthoringAssetMismatches(root);
  if (mismatches.length > 0) {
    throw new Error(
      `Part authoring assets are stale; run npm run parts:scaffolds\n${mismatches.map((item) => `- ${item}`).join('\n')}`,
    );
  }
}

export async function writePartAuthoringAssets(root: string): Promise<{ updated: number; removed: number }> {
  const expected = expectedMap();
  const actual = await actualOwnedPaths(root);
  let updated = 0;

  for (const [relativePath, asset] of expected) {
    const absolute = path.join(root, relativePath);
    const current = await readFile(absolute).catch(() => undefined);
    if (current?.equals(asset.bytes)) continue;
    await mkdir(path.dirname(absolute), { recursive: true });
    const temporary = `${absolute}.tmp-${process.pid}`;
    await writeFile(temporary, asset.bytes);
    await rename(temporary, absolute);
    updated++;
  }

  let removed = 0;
  for (const relativePath of actual) {
    if (expected.has(relativePath)) continue;
    await unlink(path.join(root, relativePath));
    removed++;
  }
  return { updated, removed };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (options.check) {
    await checkPartAuthoringAssets(options.root);
    process.stdout.write(`Part authoring assets are current (${expectedMap().size} files).\n`);
    return;
  }
  const result = await writePartAuthoringAssets(options.root);
  process.stdout.write(
    `Generated ${expectedMap().size} part authoring assets (${result.updated} updated, ${result.removed} removed).\n`,
  );
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : undefined;
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
