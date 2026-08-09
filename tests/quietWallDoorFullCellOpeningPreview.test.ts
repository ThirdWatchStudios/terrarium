import { describe, expect, it } from 'vitest';

import {
  FULL_CELL_DOOR_MATERIALS,
  QUIET_WALL_DOOR_FULL_CELL_REVIEW,
  fullCellQuietWallDoorSvg,
  renderFullCellDoorFacadeComparisonSvg,
  renderFullCellDoorMaterialsSvg,
  renderFullCellDoorShadingAuditSvg,
  renderFullCellDoorStateComparisonSvg,
} from '../scripts/quietWallDoorFullCellOpeningPreview';

describe('quiet wall full-cell door opening proof', () => {
  it('widens the passage while retaining the proven runtime contract', () => {
    expect(QUIET_WALL_DOOR_FULL_CELL_REVIEW).toMatchObject({
      runtimeFinding: 'receiver-scale-and-centering-confirmed-correct',
      shadingFinding: 'promoted-door-bank-and-exported-wall-use-different-palettes',
      shadingCorrection: 'door-wall-structure-inherits-exported-wall-instance-palette',
      paletteEvidenceSource: 'fresh-unity-import-wall-json',
      retainedRuntimeEnvelope: 'one-0.5-world-unit-wall-cell',
      retainedSourceCompensation: 0.5,
      promotedV2OuterAperture: 88,
      proposedOuterAperture: 120,
      promotedV2OpenPassage: 52,
      proposedOpenPassage: 80,
    });
  });

  it('uses the palettes observed in the fresh Unity wall import', () => {
    expect(FULL_CELL_DOOR_MATERIALS.map(({ primary, secondary, accent }) => ({
      primary,
      secondary,
      accent,
    }))).toEqual([
      { primary: '#B4B2A9', secondary: '#888780', accent: '#5F5E5A' },
      { primary: '#9C5A45', secondary: '#D8C9B8', accent: '#7A4334' },
      { primary: '#6E6A63', secondary: '#9AA0A6', accent: '#185FA5' },
      { primary: '#8A9199', secondary: '#5F5E5A', accent: '#D85A30' },
      { primary: '#A9714B', secondary: '#5F3E22', accent: '#C68B59' },
    ]);
  });

  it('covers all retained materials and fixed-view states without baking a floor', () => {
    expect(FULL_CELL_DOOR_MATERIALS).toHaveLength(5);
    for (const spec of FULL_CELL_DOOR_MATERIALS) {
      for (const axis of ['horizontal', 'vertical'] as const) {
        for (const state of ['closed', 'open'] as const) {
          const svg = fullCellQuietWallDoorSvg(spec.id, axis, state);
          expect(svg).toContain(`data-axis="${axis}"`);
          expect(svg).toContain(`data-state="${state}"`);
          expect(svg).toContain(spec.primary);
          expect(svg).not.toContain('<rect width="128" height="128"');
        }
      }
    }
  });

  it('keeps the candidate outside every promotion and handoff gate', () => {
    expect(QUIET_WALL_DOOR_FULL_CELL_REVIEW).toMatchObject({
      candidateArtLocalToPreview: true,
      canonicalSvgMutation: false,
      generatedRegistryMutation: false,
      exporterMutation: false,
      unityMutation: false,
      browserExport: false,
      unityImport: false,
      staging: false,
      commit: false,
    });
  });

  it('renders the shading, long-wall, four-state, and material-scale review gates', () => {
    expect(renderFullCellDoorShadingAuditSvg()).toContain('TWO COMPETING SHADE SYSTEMS');
    expect(renderFullCellDoorShadingAuditSvg()).toContain('INHERITS EXPORTED WALL.JSON');
    expect(renderFullCellDoorFacadeComparisonSvg()).toContain('LONG-WALL GAMEPLAY CONTEXT');
    expect(renderFullCellDoorStateComparisonSvg()).toContain('FOUR-STATE CONSTRUCTION');
    expect(renderFullCellDoorMaterialsSvg()).toContain('RETAINED MATERIAL CHECK');
  });
});
