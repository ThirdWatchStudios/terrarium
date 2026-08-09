import { describe, expect, it } from 'vitest';

import { BLOB_CONFIGS } from '../src/tiles/blob';
import {
  QUIET_WALL_FAMILIES,
  QUIET_WALL_FAMILY_REVIEW,
  proposedWallShapes,
  proposedWallSvg,
  renderQuietWallFamilyComparisonSvg,
  renderQuietWallFamilyGameplaySvg,
  renderQuietWallFamilyTopologySvg,
} from '../scripts/quietWallFamilyRefinementPreview';

describe('quiet wall-family refinement proof', () => {
  it('narrows the production build vocabulary to five useful wall identities', () => {
    expect(QUIET_WALL_FAMILIES.map(({ id }) => id)).toEqual([
      'office-wall',
      'brick-wall',
      'panel-wall',
      'cubicle-partition',
      'slat-wall',
    ]);
    expect(QUIET_WALL_FAMILY_REVIEW.familyCount).toBe(5);
    expect(QUIET_WALL_FAMILY_REVIEW.retiredFromNewBuildVocabulary).toEqual([
      'glass-partition',
      'curtain-wall',
      'demising-wall',
      'living-wall',
      'branded-wall',
    ]);
  });

  it('records the production promotion without conflating browser or Unity gates', () => {
    expect(QUIET_WALL_FAMILY_REVIEW).toMatchObject({
      status: 'production-promoted-awaiting-browser-export-and-unity-review',
      candidateArtLocalToPreview: false,
      canonicalSvgMutation: false,
      productionTemplateMutation: true,
      compositorMutation: true,
      exporterMutation: true,
      schemaMutation: false,
      unityMutation: false,
      browserExport: false,
      unityImport: false,
      staging: false,
      commit: false,
    });
  });

  it('renders every material through every canonical 47-blob mask', () => {
    expect(BLOB_CONFIGS).toHaveLength(47);
    for (const family of QUIET_WALL_FAMILIES) {
      for (const neighbors of BLOB_CONFIGS) {
        const shapes = proposedWallShapes(family.id, neighbors);
        expect(shapes.length).toBeGreaterThan(0);
        const svg = proposedWallSvg(family.id, neighbors);
        expect(svg).toContain('viewBox="0 0 128 128"');
        expect(svg).not.toContain('#B65F4D');
      }
    }
  });

  it('reduces the highest-frequency material motifs', () => {
    expect(proposedWallShapes('slat-wall', 0).filter(({ stroke }) => stroke === '#503E33')).toHaveLength(9);
    expect(proposedWallShapes('panel-wall', 0).some(({ stroke }) => stroke === '$accent')).toBe(false);
  });

  it('owns material in the cap, front, return, and corner planes rather than a top mask', () => {
    for (const id of ['office-wall', 'brick-wall', 'panel-wall', 'cubicle-partition', 'slat-wall'] as const) {
      const shapes = proposedWallShapes(id, 0);
      expect(shapes[1].fill).toBe('$primary');
      expect(shapes.some(({ fill }) => fill === '$secondary')).toBe(true);
      expect(shapes.some(({ fill }) => fill === '$accent')).toBe(true);
    }
    const brick = proposedWallShapes('brick-wall', 0);
    expect(brick.some(({ d }) => d.includes(' 98 '))).toBe(true);
    expect(brick.some(({ d }) => d.includes(' 43 '))).toBe(false);
  });

  it('renders family, gameplay-scale, and topology review surfaces', () => {
    const family = renderQuietWallFamilyComparisonSvg();
    expect(family).toContain('FIVE-WALL CORE SET');
    expect(family).toContain('BRICK WALL');
    expect(family).not.toContain('CURTAIN WALL');
    expect(family).not.toContain('LIVING WALL');
    expect(family).toContain('SAME PRODUCTION · FACE DETAIL CHECK');

    const gameplay = renderQuietWallFamilyGameplaySvg();
    expect(gameplay).toContain('48 PX / CELL');
    expect(gameplay).toContain('30 PX / CELL');
    expect(gameplay).toContain('OBJECTS AND FIXTURES CARRY QUOTACO PRODUCT DESIGN');

    const topology = renderQuietWallFamilyTopologySvg();
    expect(topology).toContain('FIVE-WALL TOPOLOGY CHECK');
    expect(topology).toContain('NO ROOM-SIDE INPUT');
  });
});
