import { describe, expect, it } from 'vitest';

import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import { PROP_TEMPLATES } from '../src/props/templates';
import {
  ACCEPTED_MOBILITY_LIGHTING_REVISIONS,
  SELECTED_OUTDOOR_HYBRID_DECISIONS,
  SELECTED_SYSTEM_CANDIDATE_IDS,
  validateOutdoorHybridConsolidation,
} from '../scripts/quotaCoOutdoorHybridConsolidationPreview';

describe('review-only exterior hybrid consolidation', () => {
  it('consolidates eight live carriers and four system concepts', () => {
    expect(validateOutdoorHybridConsolidation()).toEqual({
      existingCarrierCount: 8,
      systemCandidateCount: 4,
    });
    expect(SELECTED_OUTDOOR_HYBRID_DECISIONS.map(({ id }) => id)).toEqual([
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

  it('uses only bounded accepted direction influences', () => {
    const directions = new Set(
      SELECTED_OUTDOOR_HYBRID_DECISIONS.map(({ direction }) => direction),
    );
    expect([...directions].sort()).toEqual([
      'institutional-site-kit',
      'lived-campus',
      'service-coded-edge',
    ]);
  });

  it('locks the accepted second-pass rack and street-light revisions', () => {
    expect(ACCEPTED_MOBILITY_LIGHTING_REVISIONS).toEqual({
      bikeRack: 'rack-low-staple',
      lampPost: 'light-offset-arm',
    });
  });

  it('keeps existing carriers live and systems candidates review-only', () => {
    for (const { id } of SELECTED_OUTDOOR_HYBRID_DECISIONS) {
      expect(PROP_TEMPLATES.some((template) => template.id === id), id).toBe(true);
    }
    for (const id of SELECTED_SYSTEM_CANDIDATE_IDS) {
      expect(PROP_TEMPLATES.some((template) => template.id === id), id).toBe(false);
    }
  });

  it('holds the current export schema', () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(21);
  });
});
