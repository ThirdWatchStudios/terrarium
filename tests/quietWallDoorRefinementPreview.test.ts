import { describe, expect, it } from 'vitest';

import {
  QUIET_WALL_DOOR_MATERIALS,
  QUIET_WALL_DOOR_REVIEW,
  quietWallDoorCandidateSvg,
  renderQuietWallDoorComparisonSvg,
  renderQuietWallDoorGameplaySvg,
  renderQuietWallDoorMaterialsSvg,
} from '../scripts/quietWallDoorRefinementPreview';

describe('quiet wall door refinement proof', () => {
  it('covers the retained five-wall core without adding a door-only wall palette', () => {
    expect(QUIET_WALL_DOOR_MATERIALS.map(({ id }) => id)).toEqual([
      'office-wall',
      'brick-wall',
      'panel-wall',
      'cubicle-partition',
      'slat-wall',
    ]);
    for (const spec of QUIET_WALL_DOOR_MATERIALS) {
      const svg = quietWallDoorCandidateSvg(spec.id, 'horizontal', 'closed');
      expect(svg).toContain(spec.primary);
      expect(svg).toContain(spec.secondary);
      expect(svg).toContain(spec.accent);
    }
  });

  it('keeps all four stable sliding-door states and an open transparent passage', () => {
    expect(QUIET_WALL_DOOR_REVIEW.stableStates).toEqual([
      'horizontal-closed',
      'horizontal-open',
      'vertical-closed',
      'vertical-open',
    ]);
    for (const axis of ['horizontal', 'vertical'] as const) {
      const closed = quietWallDoorCandidateSvg('office-wall', axis, 'closed');
      const open = quietWallDoorCandidateSvg('office-wall', axis, 'open');
      expect(closed).toContain('data-state="closed"');
      expect(open).toContain('data-state="open"');
      expect(open.length).toBeLessThan(closed.length);
      expect(open).not.toContain('pressure');
    }
  });

  it('records a review-only candidate without mutating a later handoff gate', () => {
    expect(QUIET_WALL_DOOR_REVIEW).toMatchObject({
      status: 'review-only-candidate-awaiting-composed-visual-approval',
      stableTemplateId: 'door',
      candidateArtLocalToPreview: true,
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
    expect(QUIET_WALL_DOOR_REVIEW).toMatchObject({
      proofWallSource: 'production-composeWallTile',
      proofCellComposition: 'flattened-clipped-wall-cells',
    });
    expect(QUIET_WALL_DOOR_REVIEW.removedFromCandidate).toContain('oversized-pressure-mats');
    expect(QUIET_WALL_DOOR_REVIEW.retainedDoorCues).toContain('subtle-pressure-threshold');
  });

  it('renders comparison, material inheritance, and gameplay-scale review surfaces', () => {
    const comparison = renderQuietWallDoorComparisonSvg();
    expect(comparison).toContain('CURRENT · self-contained wall kit');
    expect(comparison).toContain('PROPOSED · opening belongs to the wall');

    const materials = renderQuietWallDoorMaterialsSvg();
    expect(materials).toContain('FIVE-WALL CORE SET');
    expect(materials).toContain('WOOD SLAT WALL');
    expect(materials).toContain('NO DOOR-SPECIFIC WALL PALETTE');

    const gameplay = renderQuietWallDoorGameplaySvg();
    expect(gameplay).toContain('48 PX + 30 PX / CELL');
    expect(gameplay).toContain('shared sliding leaf stays secondary');
  });
});
