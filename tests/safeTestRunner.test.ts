import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  SAFE_TEST_RSS_EMERGENCY_CEILING_KIB,
  SAFE_TEST_RSS_SAMPLE_INTERVAL_MS,
  SAFE_TEST_RSS_TERMINATION_KIB,
  discoverTestFiles,
  parseProcessTable,
  parseSafeTestRunnerArgs,
  processTreeRssKiB,
  selectTestFiles,
  vitestInvocationForFile,
} from '../scripts/runTestsSafely';

const ROOT = path.resolve(__dirname, '..');

describe('memory-contained Vitest runner', () => {
  it('discovers test files deterministically and preserves positional filters', () => {
    const files = discoverTestFiles(ROOT);
    expect(files).toEqual([...files].sort((left, right) =>
      left.localeCompare(right)));
    expect(files).toContain('tests/safeTestRunner.test.ts');
    expect(files.every((file) => /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(file)))
      .toBe(true);
    expect(
      selectTestFiles(
        files,
        ['quotaCoStyleWorkbenchMemoryContainment'],
        ROOT,
      ),
    ).toEqual(['tests/quotaCoStyleWorkbenchMemoryContainment.test.ts']);
  });

  it('accepts only snapshot updates and filename filters', () => {
    expect(
      parseSafeTestRunnerArgs([
        '--update',
        'tests/blob.test.ts',
        'behavior',
      ]),
    ).toEqual({
      updateSnapshots: true,
      filters: ['tests/blob.test.ts', 'behavior'],
    });
    expect(() => parseSafeTestRunnerArgs(['--maxWorkers=8'])).toThrow(
      /Unsupported safe-test option/,
    );
  });

  it('builds one serial Vitest invocation for exactly one file', () => {
    const invocation = vitestInvocationForFile(
      ROOT,
      'tests/blob.test.ts',
      true,
    );
    expect(invocation.command).toBe(process.execPath);
    expect(invocation.args).toEqual([
      path.join(ROOT, 'node_modules', 'vitest', 'vitest.mjs'),
      'run',
      '--no-file-parallelism',
      '--update',
      'tests/blob.test.ts',
    ]);
  });

  it('sums the complete descendant tree without charging unrelated processes', () => {
    const rows = parseProcessTable(
      [
        '100 1 1000',
        '101 100 500',
        '102 101 250',
        '200 1 9000',
        '',
      ].join('\n'),
    );
    expect(processTreeRssKiB(rows, 100)).toBe(1750);
  });

  it('keeps a deterministic safety margin below the emergency ceiling', () => {
    expect(SAFE_TEST_RSS_EMERGENCY_CEILING_KIB).toBe(3 * 1024 * 1024);
    expect(SAFE_TEST_RSS_TERMINATION_KIB).toBe(2 * 1024 * 1024);
    expect(SAFE_TEST_RSS_TERMINATION_KIB)
      .toBeLessThan(SAFE_TEST_RSS_EMERGENCY_CEILING_KIB);
    expect(SAFE_TEST_RSS_SAMPLE_INTERVAL_MS).toBe(100);
  });
});
