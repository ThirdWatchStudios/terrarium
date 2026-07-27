/**
 * Memory-contained repository test runner.
 *
 * Vitest's normal worker pool can retain native raster allocations across test
 * files. Run each file in a fresh Vitest subprocess, one at a time, and watch
 * the resident memory of the complete subprocess tree.
 *
 * Positional arguments keep Vitest's common filename-filter workflow:
 *   npm test -- quotaCoStyleWorkbench
 *   npm test -- tests/blob.test.ts tests/behavior.test.ts
 *
 * Snapshot updates use the same containment:
 *   npm run test:update -- tests/blob.test.ts
 */
import {
  readdirSync,
} from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SAFE_TEST_RSS_EMERGENCY_CEILING_KIB = 3 * 1024 * 1024;
export const SAFE_TEST_RSS_TERMINATION_KIB = 2 * 1024 * 1024;
export const SAFE_TEST_RSS_SAMPLE_INTERVAL_MS = 100;

const TEST_FILE_PATTERN = /\.(?:test|spec)\.[cm]?[jt]sx?$/;

export interface SafeTestRunnerRequest {
  readonly updateSnapshots: boolean;
  readonly filters: readonly string[];
}

export interface ProcessTableRow {
  readonly pid: number;
  readonly parentPid: number;
  readonly rssKiB: number;
}

export interface VitestInvocation {
  readonly command: string;
  readonly args: readonly string[];
}

export interface SafeTestFileResult {
  readonly exitCode: number;
  readonly signal: NodeJS.Signals | null;
  readonly peakTreeRssKiB: number;
  readonly memoryTerminated: boolean;
  readonly interrupted: boolean;
}

export function parseSafeTestRunnerArgs(
  args: readonly string[],
): SafeTestRunnerRequest {
  const filters: string[] = [];
  let updateSnapshots = false;
  for (const argument of args) {
    if (argument === '--') continue;
    if (argument === '-u' || argument === '--update') {
      updateSnapshots = true;
      continue;
    }
    if (argument.startsWith('-')) {
      throw new Error(
        `Unsupported safe-test option "${argument}". ` +
          'Only positional file filters and -u/--update are supported.',
      );
    }
    filters.push(argument);
  }
  return { updateSnapshots, filters };
}

function normalizeFilter(filter: string, repoRoot: string): string {
  const relative = path.isAbsolute(filter)
    ? path.relative(repoRoot, filter)
    : filter;
  return relative.replaceAll(path.sep, '/').replace(/^\.\//, '');
}

export function discoverTestFiles(repoRoot: string): readonly string[] {
  const testsRoot = path.join(repoRoot, 'tests');
  const discovered: string[] = [];
  const visit = (directory: string): void => {
    const entries = readdirSync(directory, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(absolute);
      } else if (entry.isFile() && TEST_FILE_PATTERN.test(entry.name)) {
        discovered.push(
          path.relative(repoRoot, absolute).replaceAll(path.sep, '/'),
        );
      }
    }
  };
  visit(testsRoot);
  return discovered.sort((left, right) => left.localeCompare(right));
}

export function selectTestFiles(
  files: readonly string[],
  filters: readonly string[],
  repoRoot: string,
): readonly string[] {
  if (filters.length === 0) return [...files];
  const normalizedFilters = filters.map((filter) =>
    normalizeFilter(filter, repoRoot),
  );
  const selected = files.filter((file) =>
    normalizedFilters.some(
      (filter) =>
        file.includes(filter) || path.posix.basename(file).includes(filter),
    ),
  );
  if (selected.length === 0) {
    throw new Error(
      `No test files matched: ${normalizedFilters.join(', ')}`,
    );
  }
  return selected;
}

export function vitestInvocationForFile(
  repoRoot: string,
  testFile: string,
  updateSnapshots: boolean,
): VitestInvocation {
  return {
    command: process.execPath,
    args: [
      path.join(repoRoot, 'node_modules', 'vitest', 'vitest.mjs'),
      'run',
      '--no-file-parallelism',
      ...(updateSnapshots ? ['--update'] : []),
      testFile,
    ],
  };
}

export function parseProcessTable(output: string): readonly ProcessTableRow[] {
  return output
    .split(/\r?\n/)
    .flatMap((line) => {
      const match = line.trim().match(/^(\d+)\s+(\d+)\s+(\d+)$/);
      if (!match) return [];
      return [{
        pid: Number(match[1]),
        parentPid: Number(match[2]),
        rssKiB: Number(match[3]),
      }];
    });
}

export function processTreeRssKiB(
  rows: readonly ProcessTableRow[],
  rootPid: number,
): number {
  const children = new Map<number, number[]>();
  for (const row of rows) {
    const siblings = children.get(row.parentPid) ?? [];
    siblings.push(row.pid);
    children.set(row.parentPid, siblings);
  }
  const included = new Set<number>();
  const pending = [rootPid];
  while (pending.length > 0) {
    const pid = pending.pop();
    if (pid === undefined || included.has(pid)) continue;
    included.add(pid);
    pending.push(...(children.get(pid) ?? []));
  }
  return rows.reduce(
    (total, row) => total + (included.has(row.pid) ? row.rssKiB : 0),
    0,
  );
}

async function processTable(): Promise<readonly ProcessTableRow[]> {
  const output = await new Promise<string>((resolve, reject) => {
    const ps = spawn('ps', ['-axo', 'pid=,ppid=,rss='], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    ps.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
    ps.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));
    ps.once('error', reject);
    ps.once('close', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(stdout).toString('utf8'));
      } else {
        reject(
          new Error(
            `ps failed with exit ${String(code)}: ` +
              Buffer.concat(stderr).toString('utf8').trim(),
          ),
        );
      }
    });
  });
  return parseProcessTable(output);
}

function terminateProcessTree(pid: number): void {
  if (!Number.isSafeInteger(pid) || pid <= 0) return;
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(pid), '/t', '/f'], {
      detached: true,
      stdio: 'ignore',
    }).unref();
    return;
  }
  try {
    process.kill(-pid, 'SIGKILL');
  } catch {
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      // The process may have exited between the RSS sample and termination.
    }
  }
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function formatMiB(rssKiB: number): string {
  return `${(rssKiB / 1024).toFixed(0)} MiB`;
}

async function runTestFile(
  repoRoot: string,
  testFile: string,
  updateSnapshots: boolean,
): Promise<SafeTestFileResult> {
  const invocation = vitestInvocationForFile(
    repoRoot,
    testFile,
    updateSnapshots,
  );
  const child = spawn(invocation.command, invocation.args, {
    cwd: repoRoot,
    detached: process.platform !== 'win32',
    env: process.env,
    stdio: 'inherit',
  });
  let closed = false;
  let peakTreeRssKiB = 0;
  let memoryTerminated = false;
  let interrupted = false;
  let monitorError: Error | undefined;
  const interrupt = (): void => {
    interrupted = true;
    terminateProcessTree(child.pid ?? -1);
  };
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);

  const completion = new Promise<{
    readonly exitCode: number;
    readonly signal: NodeJS.Signals | null;
  }>((resolve) => {
    child.once('error', (error) => {
      monitorError = error;
    });
    child.once('close', (code, signal) => {
      closed = true;
      resolve({ exitCode: code ?? 1, signal });
    });
  });

  const watchdog = (async (): Promise<void> => {
    while (!closed) {
      try {
        const rssKiB = processTreeRssKiB(await processTable(), child.pid ?? -1);
        peakTreeRssKiB = Math.max(peakTreeRssKiB, rssKiB);
        if (rssKiB >= SAFE_TEST_RSS_TERMINATION_KIB) {
          memoryTerminated = true;
          process.stderr.write(
            `\n[safe-test] ${testFile} reached ${formatMiB(rssKiB)} tree RSS; ` +
              `terminating at the ${formatMiB(SAFE_TEST_RSS_TERMINATION_KIB)} ` +
              `watchdog threshold before the ` +
              `${formatMiB(SAFE_TEST_RSS_EMERGENCY_CEILING_KIB)} ` +
              `emergency ceiling.\n`,
          );
          terminateProcessTree(child.pid ?? -1);
          return;
        }
      } catch (error: unknown) {
        monitorError =
          error instanceof Error ? error : new Error(String(error));
        process.stderr.write(
          `\n[safe-test] RSS watchdog failed for ${testFile}: ` +
            `${monitorError.message}; terminating unmonitored test tree.\n`,
        );
        terminateProcessTree(child.pid ?? -1);
        return;
      }
      await delay(SAFE_TEST_RSS_SAMPLE_INTERVAL_MS);
    }
  })();

  const result = await completion;
  await watchdog;
  process.off('SIGINT', interrupt);
  process.off('SIGTERM', interrupt);
  if (monitorError) {
    return {
      exitCode: 1,
      signal: result.signal,
      peakTreeRssKiB,
      memoryTerminated,
      interrupted,
    };
  }
  return {
    ...result,
    exitCode: memoryTerminated || interrupted ? 1 : result.exitCode,
    peakTreeRssKiB,
    memoryTerminated,
    interrupted,
  };
}

export async function runSafeTestSuite(
  repoRoot: string,
  request: SafeTestRunnerRequest,
): Promise<number> {
  // Fail closed before launching tests if this host cannot provide RSS data.
  await processTable();
  const allFiles = discoverTestFiles(repoRoot);
  const selectedFiles = selectTestFiles(allFiles, request.filters, repoRoot);
  process.stdout.write(
    `[safe-test] ${selectedFiles.length} file${selectedFiles.length === 1 ? '' : 's'}; ` +
      `fresh subprocess per file; ${formatMiB(SAFE_TEST_RSS_TERMINATION_KIB)} ` +
      `watchdog / ${formatMiB(SAFE_TEST_RSS_EMERGENCY_CEILING_KIB)} ` +
      `emergency ceiling.\n`,
  );

  let failedFiles = 0;
  let interrupted = false;
  for (const [index, testFile] of selectedFiles.entries()) {
    process.stdout.write(
      `\n[safe-test] ${index + 1}/${selectedFiles.length} ${testFile}\n`,
    );
    const result = await runTestFile(
      repoRoot,
      testFile,
      request.updateSnapshots,
    );
    process.stdout.write(
      `[safe-test] ${testFile} peak tree RSS: ` +
        `${formatMiB(result.peakTreeRssKiB)}\n`,
    );
    if (result.exitCode !== 0) {
      failedFiles += 1;
      if (result.memoryTerminated || result.interrupted) {
        interrupted = result.interrupted;
        process.stderr.write(
          `[safe-test] stopped after ${
            result.memoryTerminated ? 'memory containment failure' : 'interrupt'
          } in ${testFile}.\n`,
        );
        break;
      }
    }
  }
  if (failedFiles > 0) {
    process.stderr.write(
      `[safe-test] ${failedFiles} test file${failedFiles === 1 ? '' : 's'} failed.\n`,
    );
    return interrupted ? 130 : 1;
  }
  process.stdout.write(
    `\n[safe-test] ${selectedFiles.length} test file${selectedFiles.length === 1 ? '' : 's'} passed.\n`,
  );
  return 0;
}

async function main(): Promise<void> {
  const repoRoot = process.cwd();
  const request = parseSafeTestRunnerArgs(process.argv.slice(2));
  process.exitCode = await runSafeTestSuite(repoRoot, request);
}

const entrypoint = process.argv[1];
if (
  entrypoint !== undefined &&
  path.resolve(entrypoint) === fileURLToPath(import.meta.url)
) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`[safe-test] ${message}\n`);
    process.exitCode = 1;
  });
}
