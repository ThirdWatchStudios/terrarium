import { describe, it, expect } from 'vitest';

import { projectWithLook, applyClinicalLook, CLINICAL_INK } from '../src/core/look';
import { defaultGoldenProject } from '../src/data/defaults';
import { DEFAULT_LOOK } from '../src/core/types';
import type { ProjectState } from '../src/core/types';

/**
 * The LOOK is a reproducible, non-destructive lens (core/look.ts) — the fix for a
 * one-time palette sweep silently dropping on every asset refresh. These lock the
 * contract: the flag is persisted, defaults to RAW (the office ships warm and the
 * sim drives the drain at runtime — the office-builder palette lever), and the
 * clinical lens re-derives on export without mutating the authored palettes.
 */

const firstFloor = (p: ProjectState) => p.floors![0].palette.primary;

describe('project look — a reproducible, non-destructive lens', () => {
  it('defaults to raw when unset — the office ships warm; the sim drains at runtime', () => {
    expect(DEFAULT_LOOK).toBe('raw');
    const raw = defaultGoldenProject();
    raw.look = undefined;
    const lensed = projectWithLook(raw);
    // Untouched: warm authored floors + the authored outline (no baked clinical ink).
    expect(lensed.floors![0].palette.primary).toBe(raw.floors![0].palette.primary);
    expect(lensed.style.outline.color).toBe(raw.style.outline.color);
    expect(lensed.style.outline.color).not.toBe(CLINICAL_INK);
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

  it('leaves NATURAL ground vivid while PAVED ground drains (D2 amended — nature stays warm)', () => {
    const raw = defaultGoldenProject();
    raw.look = 'clinical';
    const lensed = projectWithLook(raw);
    const ground = (p: ProjectState, id: string) => p.ground!.find((g) => g.id === id)!.palette;
    // Nature is TRUTH: grass / meadow / dirt keep their saturated authored palettes.
    for (const id of [
      'ground-grass',
      'ground-grass-b',
      'ground-grass-c',
      'ground-meadow',
      'ground-meadow-b',
      'ground-dirt',
      'ground-pond-water',
    ]) {
      expect(ground(lensed, id), `natural ground "${id}" must not drain`).toEqual(ground(raw, id));
    }
    // The paved lot is the focus-grouped output and drains with the building.
    for (const id of ['ground-asphalt', 'ground-sidewalk', 'ground-gravel']) {
      expect(ground(lensed, id).primary, `paved ground "${id}" must drain`).not.toBe(ground(raw, id).primary);
    }
  });

  it('leaves nature decor props vivid while ordinary props drain (D2 amended)', () => {
    const raw = defaultGoldenProject();
    raw.look = 'clinical';
    const lensed = projectWithLook(raw);
    const prop = (p: ProjectState, id: string) => p.props.find((x) => x.id === id)!.palette;
    // Trees / bushes / flowers / boulders are nature — TRUTH, exempt like people.
    for (const id of [
      'prop-tree',
      'prop-tree-b',
      'prop-tree-upright',
      'prop-tree-conifer',
      'prop-tree-sapling',
      'prop-tree-sapling-b',
      'prop-bush-cluster',
      'prop-bush-bramble',
      'prop-bush-low',
      'prop-wildflower-patch',
      'prop-tall-grass-clump',
      'prop-bracken-patch',
      'prop-boulder',
      'prop-reeds-cluster',
    ]) {
      expect(prop(lensed, id), `nature prop "${id}" must not drain`).toEqual(prop(raw, id));
    }
    // The cars are the office's world and drain like any other prop.
    expect(prop(lensed, 'prop-car').primary).not.toBe(prop(raw, 'prop-car').primary);
  });
});
