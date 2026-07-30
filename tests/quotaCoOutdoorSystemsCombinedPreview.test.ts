import { describe, expect, it } from 'vitest';

import { COMBINED_REVIEW_SECTIONS } from '../scripts/quotaCoOutdoorSystemsCombinedPreview';

describe('combined outdoor and systems review board', () => {
  it('keeps both source proofs in order without replacing either artifact', () => {
    expect(COMBINED_REVIEW_SECTIONS.map(({ id }) => id)).toEqual([
      'outdoor-direction-calibration',
      'systems-first-gap-proof',
    ]);
    expect(COMBINED_REVIEW_SECTIONS.map(({ file }) => file)).toEqual([
      'quota-co-outdoor-construction-calibration-v1.svg',
      'quota-co-gameplay-systems-prop-gap-v1.svg',
    ]);
  });

  it('renders both sections at the same review width', () => {
    expect(
      COMBINED_REVIEW_SECTIONS.map(({ renderedWidth }) => renderedWidth),
    ).toEqual([3600, 3600]);
  });
});
