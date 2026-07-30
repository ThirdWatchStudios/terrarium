import { describe, expect, it } from 'vitest';

import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import { PART_LIBRARY } from '../src/parts/library';
import { PROP_TEMPLATES } from '../src/props/templates';
import {
  HYBRID_PROP_DECISIONS,
  HYBRID_PROP_SOURCE_FILES,
  PROP_REDESIGN_DIRECTIONS,
  PROP_REDESIGN_HYBRID_DIRECTION,
  PROP_REDESIGN_INVENTORY_GROUPS,
  REPRESENTATIVE_HANDHELD_ID,
  REPRESENTATIVE_PROP_IDS,
  validateHybridPropRedesignCoverage,
  validateHybridPropSvgSources,
  validatePropRedesignInventoryCoverage,
} from '../scripts/quotaCoPropRedesignCalibrationPreview';

describe('review-only QuotaCo prop redesign calibration', () => {
  it('classifies every live prop template and character accessory exactly once', () => {
    expect(validatePropRedesignInventoryCoverage()).toEqual({
      propCount: PROP_TEMPLATES.length,
      accessoryCount: PART_LIBRARY.filter(({ slot }) => slot === 'accessory')
        .length,
    });
    const propIds = PROP_REDESIGN_INVENTORY_GROUPS.flatMap(
      ({ propIds }) => propIds,
    );
    const accessoryIds = PROP_REDESIGN_INVENTORY_GROUPS.flatMap(
      ({ accessoryIds = [] }) => accessoryIds,
    );
    expect(new Set(propIds).size).toBe(propIds.length);
    expect(new Set(accessoryIds).size).toBe(accessoryIds.length);
  });

  it('keeps the first proof bounded to the requested representative roles', () => {
    expect(REPRESENTATIVE_PROP_IDS).toEqual([
      'desk',
      'office-chair',
      'filing-cabinet',
      'copier',
      'office-plant',
    ]);
    expect(REPRESENTATIVE_HANDHELD_ID).toBe('acc-clipboard');
    expect(PROP_REDESIGN_DIRECTIONS.map(({ id }) => id)).toEqual([
      'current',
      'catalog-shell',
      'service-spine',
      'used-shell',
    ]);
  });

  it('records the current schema as a held review boundary', () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(19);
  });

  it('consolidates the selected hybrid once across every representative prop', () => {
    expect(validateHybridPropRedesignCoverage()).toEqual({
      propCount: REPRESENTATIVE_PROP_IDS.length,
      direction: 'hybrid',
    });
    expect(PROP_REDESIGN_HYBRID_DIRECTION.id).toBe('hybrid');
    expect(HYBRID_PROP_DECISIONS.map(({ propId }) => propId)).toEqual(
      REPRESENTATIVE_PROP_IDS,
    );
    expect(HYBRID_PROP_DECISIONS.map(({ projection }) => projection)).toEqual([
      'plan',
      'plan',
      'elevation',
      'elevation',
      'elevation',
    ]);
    for (const decision of HYBRID_PROP_DECISIONS) {
      expect(
        PROP_TEMPLATES.find(({ id }) => id === decision.propId)?.projection,
      ).toBe(decision.projection);
    }
  });

  it('loads five standalone editable SVG sources with the accepted projections', async () => {
    const validation = await validateHybridPropSvgSources();
    expect(validation.sourceCount).toBe(REPRESENTATIVE_PROP_IDS.length);
    expect(validation.sources.map(({ propId }) => propId)).toEqual(
      REPRESENTATIVE_PROP_IDS,
    );
    expect(validation.sources.map(({ path }) => path)).toEqual(
      HYBRID_PROP_SOURCE_FILES.map(({ path }) => path),
    );
    expect(
      validation.sources.every(({ sha256 }) => /^[a-f0-9]{64}$/.test(sha256)),
    ).toBe(true);
  });
});
