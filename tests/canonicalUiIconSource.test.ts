import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import {
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

function pixels(svg: string, width: number): Buffer {
  return Buffer.from(new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { loadSystemFonts: false },
  }).render().pixels);
}

describe('canonical UI shared primitive sources', () => {
  it('keeps the checked-in generated receiver current and deterministic', async () => {
    const [shared, department] = await Promise.all([
      compileCanonicalUiIconArt(SOURCE_DIR, SOURCE_PREFIX, SHARED_UI_ICON_FAMILY),
      compileCanonicalUiIconArt(
        DEPARTMENT_SOURCE_DIR,
        DEPARTMENT_SOURCE_PREFIX,
        DEPARTMENT_UI_ICON_FAMILY,
      ),
    ]);
    const compiled = [...shared, ...department].sort((left, right) => left.id.localeCompare(right.id));
    const current = await readFile(GENERATED_FILE, 'utf8');

    expect(emitCanonicalUiIconArt(compiled)).toBe(current);
    expect(compiled).toEqual(CANONICAL_UI_ICON_ART);
    expect(compiled.map(({ id, mode, decision, literalReviewSizes }) => ({
      id,
      mode,
      decision,
      sizes: literalReviewSizes,
    }))).toEqual([...EXPECTED, ...DEPARTMENT_EXPECTED].sort((left, right) => left.id.localeCompare(right.id)));
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
