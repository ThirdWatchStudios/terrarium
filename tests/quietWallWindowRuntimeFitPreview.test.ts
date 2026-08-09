import { describe, expect, it } from 'vitest';

import {
  faceOwnedQuietWallWindowSvg,
  FULL_CELL_WINDOW_MATERIALS,
  QUIET_WALL_WINDOW_RUNTIME_FIT_REVIEW,
  renderQuietWallWindowFixedViewsSvg,
  renderQuietWallWindowGameplaySvg,
  renderQuietWallWindowMaterialsSvg,
  renderQuietWallWindowPaletteAuditSvg,
} from '../scripts/quietWallWindowRuntimeFitPreview';

describe('quiet wall face-owned window proof', () => {
  it('retains the accepted window identity and runtime contract', () => {
    expect(QUIET_WALL_WINDOW_RUNTIME_FIT_REVIEW).toMatchObject({
      retainedIdentity: [
        'horizontal-integrated-opening',
        'vertical-raised-barrier',
        'partial-blinds',
        'mullion',
        'glazing',
        'sill',
      ],
      shadingCorrection: 'window-wall-structure-inherits-exported-wall-instance-palette',
      paletteEvidenceSource: 'fresh-unity-import-wall-json',
      retainedRuntimeEnvelope: 'one-0.5-world-unit-wall-cell',
      retainedSourceCompensation: 0.5,
      neighborGlass: 'still-deferred',
    });
  });

  it('covers both fixed views across all five retained wall materials', () => {
    expect(FULL_CELL_WINDOW_MATERIALS).toHaveLength(5);
    for (const spec of FULL_CELL_WINDOW_MATERIALS) {
      for (const axis of ['horizontal', 'vertical'] as const) {
        const svg = faceOwnedQuietWallWindowSvg(spec.id, axis);
        expect(svg).toContain(`data-axis="${axis}"`);
        expect(svg).toContain(spec.primary);
        expect(svg).toContain(spec.secondary);
        expect(svg).toContain(spec.accent);
        expect(svg).toContain('#83A9A6');
        expect(svg).not.toContain('<rect width="128" height="128"');
        expect(svg).not.toContain('floor');
      }
    }
  });

  it('removes the retired cream, green, and coral wall shell from every candidate', () => {
    for (const spec of FULL_CELL_WINDOW_MATERIALS) {
      for (const axis of ['horizontal', 'vertical'] as const) {
        const svg = faceOwnedQuietWallWindowSvg(spec.id, axis);
        expect(svg).not.toContain('#D9D0B9');
        expect(svg).not.toContain('#294B3C');
        expect(svg).not.toContain('#B65F4D');
      }
    }
  });

  it('rotates the complete vertical blind assembly into a lengthwise side band', () => {
    const vertical = faceOwnedQuietWallWindowSvg('office-wall', 'vertical');
    expect(vertical).toContain(
      'id="vertical-window-blind-field" d="M68 20H78V108H68Z"',
    );
    expect(vertical).toContain(
      'id="vertical-window-blind-slats" d="M71 21V107M74 21V107M77 21V107"',
    );
    expect(vertical).not.toContain('M50 20H78V44H50Z');
  });

  it('keeps the candidate outside every promotion and handoff gate', () => {
    expect(QUIET_WALL_WINDOW_RUNTIME_FIT_REVIEW).toMatchObject({
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

  it('renders each visual review gate', () => {
    expect(renderQuietWallWindowPaletteAuditSvg()).toContain('WINDOW CARRIES ITS OWN WALL');
    expect(renderQuietWallWindowPaletteAuditSvg()).toContain('WINDOW IS PART OF THIS WALL FACE');
    expect(renderQuietWallWindowFixedViewsSvg()).toContain('TWO FIXED-VIEW CONSTRUCTIONS');
    expect(renderQuietWallWindowMaterialsSvg()).toContain('FIVE RETAINED MATERIALS');
    expect(renderQuietWallWindowGameplaySvg()).toContain('COMPOSED GAMEPLAY-SCALE READ');
  });
});
