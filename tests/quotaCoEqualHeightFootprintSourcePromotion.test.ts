import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  planEqualHeightFootprintSourcePromotion,
  promoteEqualHeightFootprintSources,
  replaceEqualHeightSvgPathData,
} from '../scripts/highOblique/equalHeightFootprintSourcePromotion';

const SOURCE_ROOTS = [
  {
    inputDir: path.resolve('assets/walls/quota-co-building-system'),
    sourcePathPrefix: 'assets/walls/quota-co-building-system',
  },
  {
    inputDir: path.resolve(
      'assets/walls/quota-co-building-system-proofs',
    ),
    sourcePathPrefix:
      'assets/walls/quota-co-building-system-proofs',
  },
] as const;

describe('QuotaCo accepted 112 source promotion', () => {
  it('replaces only ordered path d attributes', () => {
    const source =
      '<svg><title>keep me</title><g id="detail/base">\n' +
      '  <path id="one" d="M0 0H1" fill="#252A28"/>\n' +
      "  <path fill='#294B3C' d='M1 1V2' id='two'/>\n" +
      '</g></svg>';
    expect(
      replaceEqualHeightSvgPathData(
        source,
        ['M0 0L2 0', 'M1 1L1 3'],
        'fixture.svg',
      ),
    ).toBe(
      '<svg><title>keep me</title><g id="detail/base">\n' +
      '  <path id="one" d="M0 0L2 0" fill="#252A28"/>\n' +
      "  <path fill='#294B3C' d='M1 1L1 3' id='two'/>\n" +
      '</g></svg>',
    );
    expect(() =>
      replaceEqualHeightSvgPathData(source, ['M0 0'], 'fixture.svg'),
    ).toThrow(/extra paths/);
  });

  it('plans all 31 direct owners without mutating canonical sources', async () => {
    const sample = path.join(
      SOURCE_ROOTS[0].inputDir,
      'full_w_straight-base.svg',
    );
    const before = await readFile(sample, 'utf8');
    const plan = await planEqualHeightFootprintSourcePromotion(
      SOURCE_ROOTS,
    );
    expect(plan.ownerCount).toBe(31);
    expect(plan.sourceCount).toBe(62);
    expect(plan.pathCount).toBe(479);
    expect(plan.state).toBe('accepted-112');
    expect(plan.changes).toEqual([]);
    expect(await readFile(sample, 'utf8')).toBe(before);
  }, 30_000);

  it('refuses to apply the 112 migration to an already accepted bank', async () => {
    await expect(
      promoteEqualHeightFootprintSources(SOURCE_ROOTS),
    ).rejects.toThrow(/already accepted-112/);
  }, 30_000);
});
