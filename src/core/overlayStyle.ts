/**
 * Floor-overlay style spec (Epic 36 — ui_visual_design.md "Visual Language").
 *
 * The in-world floor overlays (relationship arcs, pressure halos, traveling
 * information packets, belief tints, selection/scan framing) are drawn by the
 * **Shapes** GPU-vector layer in the game, immediate-mode, from sim state every
 * frame — so the tool cannot author them as assets. But ART DIRECTION stays
 * tool-side (the project rule that style stays tweakable post-build): this file
 * is the look spec the Shapes layer reads. Same split as conversation-style.json
 * — tool owns the look, the runtime owns the drawing.
 *
 * Colors reference theme.uss `--wc-*` tokens (see uiPalette.ts) so the floor and
 * the chrome resolve one palette. One channel per concept; the FORM (line vs
 * marker-tint vs halo vs token vs flash vs scan) distinguishes channels, so hues
 * may repeat across them.
 */

export interface OverlayChannel {
  /** Human-readable concept from the Visual Language table. */
  concept: string;
  /** How Shapes draws it. */
  form:
    | 'arc-line'
    | 'marker-tint'
    | 'halo'
    | 'carried-token'
    | 'flash'
    | 'scan-framing';
  /** Motion discipline: stillness encodes state, motion encodes events. */
  motion: 'still' | 'pulse' | 'single-pulse' | 'dash-offset' | 'travels-path' | 'scanline';
  [extra: string]: unknown;
}

/**
 * The default floor-overlay vocabulary. Weights/dashes/motion are the tweakable
 * art direction; `color`/`axis` reference `--wc-*` theme tokens.
 */
export const DEFAULT_OVERLAY_STYLE: Record<string, OverlayChannel> = {
  trust: {
    concept: 'Trust',
    form: 'arc-line',
    color: '--wc-trust',
    motion: 'still',
    weightByStrength: true,
    minWeight: 1.5,
    maxWeight: 6,
    dash: null,
  },
  suspicion: {
    concept: 'Suspicion / conflict',
    form: 'arc-line',
    color: '--wc-suspicion',
    escalateColor: '--wc-hostility',
    motion: 'dash-offset',
    weight: 2.5,
    dash: [6, 4],
  },
  belief: {
    concept: 'Belief drift',
    form: 'marker-tint',
    motion: 'still',
    axis: { truth: '--wc-belief-truth', rumor: '--wc-belief-rumor' },
  },
  pressure: {
    concept: 'Pressure / stress',
    form: 'halo',
    color: '--wc-pressure',
    motion: 'pulse',
    intensity: 'pulse-rate',
    minPulseHz: 0.3,
    maxPulseHz: 1.6,
    maxConcurrentPerAgent: 1,
  },
  information: {
    concept: 'Information possession',
    form: 'carried-token',
    color: '--wc-information',
    motion: 'travels-path',
    tokenRadius: 3,
  },
  change: {
    concept: 'Recent change',
    form: 'flash',
    color: '--wc-change',
    motion: 'single-pulse',
    durationMs: 450,
  },
  surveillance: {
    concept: 'Surveillance attention',
    form: 'scan-framing',
    color: '--wc-surveillance',
    motion: 'scanline',
    alpha: 0.15,
  },
};

/** Exported descriptor — the Shapes floor layer reads this to draw overlays. */
export function overlayStyleJson(channels: Record<string, OverlayChannel> = DEFAULT_OVERLAY_STYLE) {
  return {
    kind: 'floor-overlay-style' as const,
    generator: 'sprite-character-creator',
    schema: 'ui_visual_design.md#visual-language',
    renderer: 'shapes',
    /** Two protective rules from the design doc. */
    rules: {
      motionEncodesEvents: true, // motion = events, stillness = state
      oneDominantPressurePerAgent: true,
    },
    channels,
    meta: {
      note:
        'The Shapes floor layer draws these from sim state each frame; the tool owns the ' +
        'look, not the drawing. Colors reference theme.uss --wc-* tokens so floor and chrome ' +
        'share one palette. One channel per concept; the form distinguishes channels.',
    },
  };
}
