import { describe, it, expect } from 'vitest';

import { projectWithLook, applyClinicalLook, CLINICAL_INK } from '../src/core/look';
import { defaultGoldenProject } from '../src/data/defaults';
import { DEFAULT_LOOK } from '../src/core/types';
import type { ProjectState } from '../src/core/types';

/**
 * The LOOK is a reproducible, non-destructive lens (core/look.ts) — the fix for a
 * one-time palette sweep silently dropping on every asset refresh. These lock the
 * contract: the flag is persisted, defaults to clinical, and re-derives on export
 * without mutating (or baking into) the authored palettes.
 */

const firstFloor = (p: ProjectState) => p.floors![0].palette.primary;

describe('project look — a reproducible, non-destructive lens', () => {
  it('defaults to clinical when unset (the game canonical floor)', () => {
    expect(DEFAULT_LOOK).toBe('clinical');
    const raw = defaultGoldenProject();
    raw.look = undefined;
    const lensed = projectWithLook(raw);
    // Floors desaturate toward paper; the outline becomes the thin clinical ink.
    expect(lensed.floors![0].palette.primary).not.toBe(raw.floors![0].palette.primary);
    expect(lensed.style.outline.color).toBe(CLINICAL_INK);
  });

  it('does NOT mutate the input — authored palettes stay vivid and editable', () => {
    const raw = defaultGoldenProject();
    const authored = firstFloor(raw);
    const authoredOutline = raw.style.outline.color;
    projectWithLook(raw);
    expect(firstFloor(raw)).toBe(authored);
    expect(raw.style.outline.color).toBe(authoredOutline);
  });

  it('raw look returns the project untouched (the vivid authoring view)', () => {
    const raw = defaultGoldenProject();
    raw.look = 'raw';
    const lensed = projectWithLook(raw);
    expect(firstFloor(lensed)).toBe(firstFloor(raw));
    expect(lensed.style.outline.color).toBe(raw.style.outline.color);
  });

  it('leaves characters untouched — people stay warm (Article VIII)', () => {
    const raw = defaultGoldenProject();
    raw.look = 'clinical';
    const lensed = projectWithLook(raw);
    // The clinical lens desaturates architecture only; recipe palettes are identical.
    expect(lensed.characters.map((c) => c.palette)).toEqual(raw.characters.map((c) => c.palette));
  });

  it('applyClinicalLook still mutates in place (the lens primitive)', () => {
    const p = defaultGoldenProject();
    const before = firstFloor(p);
    applyClinicalLook(p);
    expect(firstFloor(p)).not.toBe(before);
    expect(p.style.outline.color).toBe(CLINICAL_INK);
  });
});
