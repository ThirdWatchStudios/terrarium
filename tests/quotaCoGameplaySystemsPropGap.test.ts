import { describe, expect, it } from 'vitest';

import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import { PROP_TEMPLATES } from '../src/props/templates';
import {
  DEFERRED_NON_SYSTEM_GAPS,
  EXISTING_SYSTEM_REUSE_IDS,
  GAMEPLAY_GAP_CANDIDATES,
  validateGameplaySystemsPropGap,
} from '../scripts/quotaCoGameplaySystemsPropGapPreview';

describe('review-only systems-first exterior prop gap', () => {
  it('keeps the first systems proof bounded to four new concepts', () => {
    expect(validateGameplaySystemsPropGap()).toEqual({
      candidateCount: 4,
      existingReuseCount: 5,
      deferredCount: 5,
    });
    expect(GAMEPLAY_GAP_CANDIDATES.map(({ id }) => id)).toEqual([
      'hvac-condenser',
      'surveillance-camera',
      'surveillance-sensor',
      'privacy-hedge',
    ]);
  });

  it('requires a receiver and observable floor and human consequences', () => {
    for (const candidate of GAMEPLAY_GAP_CANDIDATES) {
      expect(candidate.systemReceiver.length, candidate.id).toBeGreaterThan(10);
      expect(candidate.floorConsequence.length, candidate.id).toBeGreaterThan(10);
      expect(candidate.humanConsequence.length, candidate.id).toBeGreaterThan(10);
      expect(candidate.visibleStates, candidate.id).toHaveLength(3);
    }
  });

  it('does not collide with live prop ids and reuses only live assets', () => {
    for (const { id } of GAMEPLAY_GAP_CANDIDATES) {
      expect(PROP_TEMPLATES.some((template) => template.id === id)).toBe(false);
    }
    for (const id of EXISTING_SYSTEM_REUSE_IDS) {
      expect(PROP_TEMPLATES.some((template) => template.id === id), id).toBe(true);
    }
    expect(DEFERRED_NON_SYSTEM_GAPS).toContain('bulldozer or excavator');
  });

  it('holds the export schema during review', () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(19);
  });
});
