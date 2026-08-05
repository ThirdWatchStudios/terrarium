import { describe, expect, it } from 'vitest';
import { PNG } from 'pngjs';
import { Resvg } from '@resvg/resvg-js';

import { PROP_TEMPLATES } from '../src/props/templates';
import {
  SLIDING_DOOR_REFINEMENT,
  WALL_SLOT_AUDIT,
  approvedSlidingDoorGeometrySvg,
  canonicalSlidingDoorSvg,
  capturedSlidingDoorSvg,
  openingProposalSvg,
  renderOpeningDirectionSvg,
  renderOpeningLiteralScaleSvg,
  renderSlidingDoorSourceFitSvg,
  renderWallFixtureInventorySvg,
} from '../scripts/quotaCoBuildingOpeningsWallFixturesAuditPreview';

function raster(svg: string, width: number): Buffer {
  return Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng());
}

function alphaAt(svg: string, x: number, y: number): number {
  const png = PNG.sync.read(raster(svg, 128));
  return png.data[(y * png.width + x) * 4 + 3];
}

describe('building openings and wall fixtures audit', () => {
  it('covers every live code-owned wall-slot receiver identified by the audit', () => {
    expect(WALL_SLOT_AUDIT.map(({ id }) => id)).toEqual([
      'door',
      'window',
      'neighbor-glass',
      'wall-screen',
      'kanban-board',
      'water-fountain',
      'badge-reader',
      'nameplate',
      'hvac-vent',
      'wall-calendar',
      'directory-placard',
      'fire-extinguisher',
    ]);
    for (const { id } of WALL_SLOT_AUDIT) {
      expect(PROP_TEMPLATES.find((template) => template.id === id)?.placement).toBe('wall-slot');
    }
  });

  it('keeps the door and window wall-slot placement contract plan-projected', () => {
    for (const id of ['door', 'window']) {
      const template = PROP_TEMPLATES.find((candidate) => candidate.id === id);
      expect(template?.projection).toBe('plan');
      expect(template?.placement).toBe('wall-slot');
    }
  });

  it('preserves the captured sliding auto-door identity while showing refitted authored axes', () => {
    expect(SLIDING_DOOR_REFINEMENT.identity).toBe('pressure-mat sliding auto-door');
    expect(SLIDING_DOOR_REFINEMENT.preserved).toContain('double retracting leaves');
    expect(SLIDING_DOOR_REFINEMENT.preserved).toContain('no handles');
    expect(capturedSlidingDoorSvg('closed')).toContain('door-leaf-field');
    expect(capturedSlidingDoorSvg('open')).toContain('pocket-leaf-left');
    for (const axis of ['horizontal', 'vertical'] as const) {
      expect(openingProposalSvg('door', axis, 'closed')).toContain('viewBox="0 0 128 128"');
      expect(openingProposalSvg('door', axis, 'open')).toContain('viewBox="0 0 128 128"');
      expect(openingProposalSvg('window', axis)).toContain('viewBox="0 0 128 128"');
    }
    expect(openingProposalSvg('door', 'vertical', 'closed')).toContain('vertical-door-top-oblique-closed-leaves');
    expect(openingProposalSvg('door', 'vertical', 'open')).toContain('vertical-door-top-oblique-open-leaves');
    expect(openingProposalSvg('door', 'vertical', 'closed')).toContain('vertical-door-pressure-mats');
  });

  it('preserves the review sheets and labels the promoted source-fit evidence', () => {
    expect(renderWallFixtureInventorySvg()).toContain('NOT PROMOTED');
    const direction = renderOpeningDirectionSvg();
    expect(direction).toContain('VISUAL DIRECTION APPROVED');
    expect(direction).toContain('SLIDING AUTO-DOOR');
    expect(direction).not.toContain('OFFICE SWING DOOR');
    const literal = renderOpeningLiteralScaleSvg();
    expect(literal).toContain('width="1280" height="720"');
    expect(literal).toContain('REVIEW ONLY');
    expect(literal).toContain('90 PX / CELL');
    expect(literal).toContain('40 PX / CELL');
    const sourceFit = renderSlidingDoorSourceFitSvg();
    expect(sourceFit).toContain('TERRARIUM PRODUCTION SCALE CORRECTED');
    expect(sourceFit).toContain('LIVE SLOT MATCH · 128 / 90 / 40');
  });

  it('keeps all four canonical production sources pixel-identical to the approved geometry', () => {
    for (const axis of ['horizontal', 'vertical'] as const) {
      for (const state of ['closed', 'open'] as const) {
        const approved = approvedSlidingDoorGeometrySvg(axis, state);
        const candidate = canonicalSlidingDoorSvg(axis, state);
        expect(candidate).toContain('<title>');
        expect(candidate).toContain('<desc>');
        expect(candidate).not.toContain('#7B8890');
        expect(candidate).not.toContain('<image');
        for (const size of [128, 90, 40]) {
          expect(raster(candidate, size).equals(raster(approved, size))).toBe(true);
        }
      }
    }
  });

  it('leaves the open passages transparent instead of baking the review floor into source', () => {
    expect(alphaAt(canonicalSlidingDoorSvg('horizontal', 'open'), 64, 80)).toBe(0);
    expect(alphaAt(canonicalSlidingDoorSvg('vertical', 'open'), 63, 64)).toBe(0);
    expect(alphaAt(canonicalSlidingDoorSvg('horizontal', 'closed'), 64, 80)).toBe(255);
    expect(alphaAt(canonicalSlidingDoorSvg('vertical', 'closed'), 72, 64)).toBe(255);
  });
});
