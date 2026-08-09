import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import {
  ACTION_CURSOR_UI_ICON_FAMILY,
  compileCanonicalUiIconArt,
  DEPARTMENT_UI_ICON_FAMILY,
  emitCanonicalUiIconArt,
  SHARED_UI_ICON_FAMILY,
} from '../scripts/ui/canonicalUiIconImporter';
import { composeIcon } from '../src/core/compositor';
import { getIcon } from '../src/parts/icons';
import { CANONICAL_UI_ICON_ART } from '../src/parts/generated/canonicalUiIconArt';

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, 'assets/ui/canonical-shared-primitives-v1');
const SOURCE_PREFIX = 'assets/ui/canonical-shared-primitives-v1';
const DEPARTMENT_SOURCE_DIR = path.join(ROOT, 'assets/ui/canonical-department-glyphs-v1');
const DEPARTMENT_SOURCE_PREFIX = 'assets/ui/canonical-department-glyphs-v1';
const ACTION_CURSOR_SOURCE_DIR = path.join(ROOT, 'assets/ui/canonical-action-cursor-marks-v1');
const ACTION_CURSOR_SOURCE_PREFIX = 'assets/ui/canonical-action-cursor-marks-v1';
const GENERATED_FILE = path.join(ROOT, 'src/parts/generated/canonicalUiIconArt.ts');
const APPROVED_CANDIDATE_DIR = path.join(
  ROOT,
  'docs/previews/ui-e1a-source-fit-font-pilot-v1/candidate-svg-review-only',
);

const EXPECTED = [
  { id: 'iris-mark', mode: 'tintable', decision: 'exact-authority-inversion', sizes: [18, 20, 24, 32] },
  { id: 'quotaco-mark', mode: 'literal', decision: 'exact-authority-inversion', sizes: [24, 32, 42, 48] },
  { id: 'ui-corner', mode: 'tintable', decision: 'approved-redesign', sizes: [16, 20, 24, 32] },
  { id: 'ui-divider', mode: 'tintable', decision: 'exact-authority-inversion', sizes: [16, 20, 24, 32] },
  { id: 'ui-focus', mode: 'tintable', decision: 'approved-redesign', sizes: [16, 20, 24, 32] },
] as const;

const DEPARTMENT_EXPECTED = DEPARTMENT_UI_ICON_FAMILY.expectedIds.map((id) => ({
  id,
  mode: 'tintable' as const,
  decision: 'approved-redesign' as const,
  sizes: [16, 20, 24, 32, 42] as const,
}));

const ACTION_REVIEW_PATHS = {
  'action-rotate': ['M5 13A7 7 0 0117 7', 'M17 3V8H12', 'M19 11A7 7 0 017 17'],
  'action-undo': ['M9 5L4 10L9 15M4 10H15A5 5 0 0120 15A5 5 0 0115 20H11'],
  'action-redo': ['M15 5L20 10L15 15M20 10H9A5 5 0 004 15A5 5 0 009 20H13'],
  'action-move': ['M12 2V22M2 12H22M12 2L8 6M12 2L16 6M12 22L8 18M12 22L16 18M2 12L6 8M2 12L6 16M22 12L18 8M22 12L18 16'],
  'action-delete': ['M5 7H19M9 7V4H15V7M7 7L8 21H16L17 7M10 10V18M14 10V18'],
  'world-facing': ['M12 3L20 13H15V21H9V13H4Z'],
} as const;

const ACTION_EXPECTED = Object.keys(ACTION_REVIEW_PATHS).map((id) => ({
  id,
  mode: 'tintable' as const,
  decision: 'approved-redesign' as const,
  sizes: [16, 20, 24, 32, 42] as const,
}));

interface LegacyCursorShape {
  readonly d: string;
  readonly fill?: string;
  readonly stroke?: string;
  readonly strokeWidth?: number;
}

const CURSOR_INK = '#2C2C2A';
const CURSOR_HALO = '#FFFFFF';
const cursorFill = (d: string): LegacyCursorShape[] => [
  { d, fill: CURSOR_HALO, stroke: CURSOR_HALO, strokeWidth: 7 },
  { d, fill: CURSOR_INK },
];
const cursorStroke = (d: string, strokeWidth = 7): LegacyCursorShape[] => [
  { d, stroke: CURSOR_HALO, strokeWidth: strokeWidth + 6 },
  { d, stroke: CURSOR_INK, strokeWidth },
];
const cursorCircle = (radius: number): string =>
  `M -${radius} 0 a ${radius} ${radius} 0 1 0 ${radius * 2} 0 a ${radius} ${radius} 0 1 0 -${radius * 2} 0 Z`;

const LEGACY_CURSORS = {
  'cursor-default': {
    hotspot: { x: 42 / 128, y: 38 / 128 },
    shapes: cursorFill('M -22 -26 L -22 14 L -12 4 L -4 22 L 2 19 L -6 2 L 8 2 Z'),
  },
  'cursor-grab': {
    hotspot: { x: 0.5, y: 0.5 },
    shapes: [
      ...cursorStroke('M 0 -28 L 0 28', 6),
      ...cursorStroke('M -28 0 L 28 0', 6),
      ...cursorFill('M 0 -30 L 8 -20 L -8 -20 Z'),
      ...cursorFill('M 0 30 L 8 20 L -8 20 Z'),
      ...cursorFill('M -30 0 L -20 -8 L -20 8 Z'),
      ...cursorFill('M 30 0 L 20 -8 L 20 8 Z'),
    ],
  },
  'cursor-place': {
    hotspot: { x: 0.5, y: 0.5 },
    shapes: [
      ...cursorStroke('M 0 -26 L 0 -8'),
      ...cursorStroke('M 0 8 L 0 26'),
      ...cursorStroke('M -26 0 L -8 0'),
      ...cursorStroke('M 8 0 L 26 0'),
      ...cursorFill(cursorCircle(4)),
    ],
  },
  'cursor-invalid': {
    hotspot: { x: 0.5, y: 0.5 },
    shapes: [...cursorStroke(cursorCircle(24)), ...cursorStroke('M -17 -17 L 17 17')],
  },
} as const;

const CURSOR_EXPECTED = Object.keys(LEGACY_CURSORS).map((id) => ({
  id,
  mode: 'literal' as const,
  decision: 'exact-authority-inversion' as const,
  sizes: [24, 32, 48] as const,
}));

function pixels(svg: string, width: number): Buffer {
  return Buffer.from(new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { loadSystemFonts: false },
  }).render().pixels);
}

function pixelDelta(left: Buffer, right: Buffer): { readonly max: number; readonly channels: number } {
  let max = 0;
  let channels = 0;
  for (let index = 0; index < left.length; index += 1) {
    const delta = Math.abs(left[index] - right[index]);
    if (delta > 0) channels += 1;
    max = Math.max(max, delta);
  }
  return { max, channels };
}

function acceptedActionSvg(id: keyof typeof ACTION_REVIEW_PATHS): string {
  const paths = ACTION_REVIEW_PATHS[id]
    .map((d) => `<path d="${d}" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">${paths}</svg>`;
}

function legacyCursorSvg(id: keyof typeof LEGACY_CURSORS): string {
  const paths = LEGACY_CURSORS[id].shapes.map((shape) => {
    const attributes = [`d="${shape.d}"`, `fill="${shape.fill ?? 'none'}"`];
    if (shape.stroke) {
      attributes.push(`stroke="${shape.stroke}"`);
      attributes.push(`stroke-width="${shape.strokeWidth}"`);
      attributes.push('stroke-linecap="round" stroke-linejoin="round"');
    }
    return `<path ${attributes.join(' ')}/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><g transform="translate(64 64)">${paths}</g></svg>`;
}

describe('canonical UI shared primitive sources', () => {
  it('keeps the checked-in generated receiver current and deterministic', async () => {
    const [shared, department, actionCursor] = await Promise.all([
      compileCanonicalUiIconArt(SOURCE_DIR, SOURCE_PREFIX, SHARED_UI_ICON_FAMILY),
      compileCanonicalUiIconArt(
        DEPARTMENT_SOURCE_DIR,
        DEPARTMENT_SOURCE_PREFIX,
        DEPARTMENT_UI_ICON_FAMILY,
      ),
      compileCanonicalUiIconArt(
        ACTION_CURSOR_SOURCE_DIR,
        ACTION_CURSOR_SOURCE_PREFIX,
        ACTION_CURSOR_UI_ICON_FAMILY,
      ),
    ]);
    const compiled = [...shared, ...department, ...actionCursor].sort((left, right) => left.id.localeCompare(right.id));
    const current = await readFile(GENERATED_FILE, 'utf8');

    expect(emitCanonicalUiIconArt(compiled)).toBe(current);
    expect(compiled).toEqual(CANONICAL_UI_ICON_ART);
    expect(compiled.map(({ id, mode, decision, literalReviewSizes }) => ({
      id,
      mode,
      decision,
      sizes: literalReviewSizes,
    }))).toEqual([
      ...EXPECTED,
      ...DEPARTMENT_EXPECTED,
      ...ACTION_EXPECTED,
      ...CURSOR_EXPECTED,
    ].sort((left, right) => left.id.localeCompare(right.id)));
  });

  it.each(DEPARTMENT_EXPECTED)('$id preserves its canonical source pixels through the live stable id', async ({ id, sizes }) => {
    const canonical = await readFile(path.join(DEPARTMENT_SOURCE_DIR, `${id}.svg`), 'utf8');
    const live = getIcon(id);

    expect(live).toBeDefined();
    expect(live?.id).toBe(id);
    expect(live?.mode).toBe('tintable');
    for (const size of sizes) {
      expect(pixels(composeIcon(id, size), size), `live receiver at ${size}px`).toEqual(
        pixels(canonical, size),
      );
    }
  });

  it.each(EXPECTED)('$id preserves the approved review pixels through the live stable id', async ({ id, sizes }) => {
    const approved = await readFile(path.join(APPROVED_CANDIDATE_DIR, `${id}.candidate.svg`), 'utf8');
    const canonical = await readFile(path.join(SOURCE_DIR, `${id}.svg`), 'utf8');
    const live = getIcon(id);

    expect(live).toBeDefined();
    expect(live?.id).toBe(id);
    for (const size of sizes) {
      const acceptedPixels = pixels(approved, size);
      expect(pixels(canonical, size), `canonical source at ${size}px`).toEqual(acceptedPixels);
      expect(pixels(composeIcon(id, size), size), `live receiver at ${size}px`).toEqual(acceptedPixels);
    }
  });

  it.each(ACTION_EXPECTED)('$id preserves its approved literal-size review pixels through the live stable id', async ({ id, sizes }) => {
    const canonical = await readFile(path.join(ACTION_CURSOR_SOURCE_DIR, `${id}.svg`), 'utf8');
    const live = getIcon(id);

    expect(live).toBeDefined();
    expect(live?.id).toBe(id);
    expect(live?.mode).toBe('tintable');
    for (const size of sizes) {
      const acceptedPixels = pixels(acceptedActionSvg(id as keyof typeof ACTION_REVIEW_PATHS), size);
      const canonicalPixels = pixels(canonical, size);
      // The 24-to-128 arc conversion can differ at a few low-coverage samples
      // on the two return arrows; all other action pixels are byte-exact.
      const delta = pixelDelta(canonicalPixels, acceptedPixels);
      expect(delta.max, `maximum approved-source delta at ${size}px`).toBeLessThanOrEqual(48);
      expect(delta.channels, `changed approved-source channels at ${size}px`).toBeLessThanOrEqual(28);
      expect(pixels(composeIcon(id, size), size), `live receiver at ${size}px`).toEqual(canonicalPixels);
    }
  });

  it.each(CURSOR_EXPECTED)('$id preserves its legacy pixels and normalized hotspot through the canonical receiver', async ({ id, sizes }) => {
    const cursorId = id as keyof typeof LEGACY_CURSORS;
    const canonical = await readFile(path.join(ACTION_CURSOR_SOURCE_DIR, `${id}.svg`), 'utf8');
    const live = getIcon(id);

    expect(live).toBeDefined();
    expect(live?.id).toBe(id);
    expect(live?.mode).toBe('literal');
    expect(live && 'hotspot' in live ? live.hotspot : undefined).toEqual(LEGACY_CURSORS[cursorId].hotspot);
    for (const size of sizes) {
      const legacyPixels = pixels(legacyCursorSvg(cursorId), size);
      expect(pixels(canonical, size), `canonical source at ${size}px`).toEqual(legacyPixels);
      expect(pixels(composeIcon(id, size), size), `live receiver at ${size}px`).toEqual(legacyPixels);
    }
  });

  it('adds a read-only freshness check to ordinary asset verification', async () => {
    const packageJson = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts['ui-shared:import']).toContain('--write');
    expect(packageJson.scripts['ui-shared:import:check']).toContain('--check');
    expect(packageJson.scripts['assets:check']).toContain('npm run ui-shared:import:check');
    expect(packageJson.scripts['assets:check']).not.toContain('npm run ui-shared:import ');
  });
});
