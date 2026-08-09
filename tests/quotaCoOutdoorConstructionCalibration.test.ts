import { describe, expect, it } from 'vitest';

import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import { PROP_TEMPLATES } from '../src/props/templates';
import {
  OUTDOOR_DIRECTIONS,
  OUTDOOR_INVENTORY_SUBGROUPS,
  OUTDOOR_PROOF_CARRIERS,
  OUTDOOR_PROOF_DECISIONS,
  validateOutdoorConstructionCalibration,
} from '../scripts/quotaCoOutdoorConstructionCalibrationPreview';

describe('review-only QuotaCo outdoor/construction calibration', () => {
  it('covers the existing outdoor inventory exactly once', () => {
    expect(validateOutdoorConstructionCalibration()).toEqual({
      inventoryCount: 38,
      carrierCount: 8,
      directionCount: 4,
    });
    const ids = OUTDOOR_INVENTORY_SUBGROUPS.flatMap(({ ids }) => ids);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps the proof bounded to current art and three redesign directions', () => {
    expect(OUTDOOR_DIRECTIONS.map(({ id }) => id)).toEqual([
      'current',
      'institutional-site-kit',
      'service-coded-edge',
      'lived-campus',
    ]);
    expect(OUTDOOR_PROOF_CARRIERS).toEqual([
      'car',
      'lot-marking-crosswalk',
      'lamp-post',
      'sign-lot',
      'bike-rack',
      'park-bench',
      'picnic-table',
      'tree-canopy',
    ]);
  });

  it('preserves the live projection for every close-read carrier', () => {
    for (const decision of OUTDOOR_PROOF_DECISIONS) {
      const template = PROP_TEMPLATES.find(({ id }) => id === decision.id);
      expect(template?.projection, decision.id).toBe(decision.projection);
    }
  });

  it('holds the current export schema during review', () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(21);
  });
});
