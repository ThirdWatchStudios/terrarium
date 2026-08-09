import { describe, expect, it } from 'vitest';

import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import { PROP_TEMPLATES } from '../src/props/templates';
import {
  MOBILITY_LIGHTING_REVISION_DIRECTIONS,
  RECOMMENDED_MOBILITY_LIGHTING_REVISIONS,
  renderMobilityLightingRevisionSvg,
  validateMobilityLightingRevision,
} from '../scripts/quotaCoOutdoorMobilityLightingRevisionPreview';

describe('review-only bike-rack and street-light revision', () => {
  it('offers three bounded directions for each open carrier', () => {
    expect(validateMobilityLightingRevision()).toEqual({
      directionCount: 6,
      liveCarrierCount: 2,
    });
    expect(
      MOBILITY_LIGHTING_REVISION_DIRECTIONS.filter(
        ({ carrier }) => carrier === 'bike-rack',
      ),
    ).toHaveLength(3);
    expect(
      MOBILITY_LIGHTING_REVISION_DIRECTIONS.filter(
        ({ carrier }) => carrier === 'lamp-post',
      ),
    ).toHaveLength(3);
  });

  it('keeps each temporary proposal on the 128u canvas', () => {
    for (const { id } of MOBILITY_LIGHTING_REVISION_DIRECTIONS) {
      expect(renderMobilityLightingRevisionSvg(id), id).toContain(
        'viewBox="0 0 128 128"',
      );
    }
  });

  it('recommends one function-first direction per carrier', () => {
    expect(RECOMMENDED_MOBILITY_LIGHTING_REVISIONS).toEqual({
      bikeRack: 'rack-low-staple',
      lampPost: 'light-offset-arm',
    });
  });

  it('preserves the live projection and footprint contracts', () => {
    const rack = PROP_TEMPLATES.find(({ id }) => id === 'bike-rack');
    const light = PROP_TEMPLATES.find(({ id }) => id === 'lamp-post');
    expect(rack).toMatchObject({
      projection: 'plan',
      gridFootprint: { w: 2, h: 1 },
    });
    expect(light).toMatchObject({
      projection: 'elevation',
      gridFootprint: { w: 1, h: 1 },
    });
  });

  it('holds the current export schema', () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(21);
  });
});
