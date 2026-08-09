import { describe, expect, it } from 'vitest';

import {
  CORRECTED_DOOR_MATERIALS,
  QUIET_WALL_DOOR_RUNTIME_CORRECTION,
  correctedQuietWallDoorSvg,
  renderDoorRuntimeCorrectionComparisonSvg,
  renderDoorRuntimeCorrectionGameplaySvg,
  renderDoorRuntimeCorrectionMaterialsSvg,
} from '../scripts/quietWallDoorRuntimeCorrectionPreview';

describe('quiet wall door runtime correction proof', () => {
  it('widens the aperture without changing the runtime envelope or source compensation', () => {
    expect(QUIET_WALL_DOOR_RUNTIME_CORRECTION).toMatchObject({
      retainedRuntimeEnvelope: 'one-0.5-world-unit-wall-cell',
      retainedSourceCompensation: 0.5,
      horizontalOuterApertureBefore: 58,
      horizontalOuterApertureAfter: 88,
      horizontalOpenPassageBefore: 28,
      horizontalOpenPassageAfter: 52,
    });
  });

  it('records the production wall-plane mapping used by the corrected sockets', () => {
    expect(QUIET_WALL_DOOR_RUNTIME_CORRECTION.correctedHorizontalSocketPlanes).toEqual({
      contour: 'y2..126',
      primary: 'y8..120',
      northLipAccent: 'y8..16',
      southFrontSecondary: 'y76..120',
    });
    expect(QUIET_WALL_DOOR_RUNTIME_CORRECTION.correctedVerticalSocketPlanes).toEqual({
      contour: 'x2..126',
      primary: 'x8..120',
      sideReturnAccent: ['x8..38', 'x90..120'],
      straightRunSecondaryPlane: false,
    });
  });

  it('keeps all four states transparent and material-owned across the retained five-wall set', () => {
    expect(CORRECTED_DOOR_MATERIALS.map(({ id }) => id)).toEqual([
      'office-wall',
      'brick-wall',
      'panel-wall',
      'cubicle-partition',
      'slat-wall',
    ]);
    for (const spec of CORRECTED_DOOR_MATERIALS) {
      for (const axis of ['horizontal', 'vertical'] as const) {
        for (const state of ['closed', 'open'] as const) {
          const svg = correctedQuietWallDoorSvg(spec.id, axis, state);
          expect(svg).toContain(`data-axis="${axis}"`);
          expect(svg).toContain(`data-state="${state}"`);
          expect(svg).toContain(spec.primary);
          expect(svg).toContain(spec.accent);
          expect(svg).not.toContain('<rect width="128" height="128"');
        }
      }
    }
  });

  it('leaves every production and handoff gate untouched', () => {
    expect(QUIET_WALL_DOOR_RUNTIME_CORRECTION).toMatchObject({
      status: 'review-only-runtime-correction-awaiting-visual-approval',
      canonicalSvgMutation: false,
      generatedRegistryMutation: false,
      productionTemplateMutation: false,
      exporterMutation: false,
      unityMutation: false,
      browserExport: false,
      unityImport: false,
      staging: false,
      commit: false,
    });
  });

  it('renders the comparison, complete material bank, and gameplay-scale proof', () => {
    expect(renderDoorRuntimeCorrectionComparisonSvg()).toContain('45% → 69% outer aperture');
    expect(renderDoorRuntimeCorrectionMaterialsSvg()).toContain('FIVE WALL MATERIALS');
    expect(renderDoorRuntimeCorrectionGameplaySvg()).toContain('48 px and 30 px wall-cell tests');
  });
});
