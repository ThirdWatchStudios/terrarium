import { describe, expect, it } from 'vitest';
import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';

import {
  characterLayers,
  composeCharacter,
  composePortrait,
  employeePortraitCrop,
  overheadAnchor,
  poseRigAnchors,
} from '../src/core/compositor';
import { composeConversation } from '../src/core/conversation';
import { activityBadgesAtlas, characterAtlas, posesAtlas, unitAtlas, unitPosesAtlas } from '../src/core/exporter';
import { unitRecipe, unitRenderingSpec } from '../src/core/renderings';
import type { CharacterRecipe, Facing } from '../src/core/types';
import { FACINGS } from '../src/core/types';
import { DEFAULT_STYLE, defaultGoldenProject } from '../src/data/defaults';
import { BODY_ARCHETYPE_TRIALS } from '../src/parts/bodyArchetypeTrials';
import { getPart, partsForSlot } from '../src/parts/library';

const EXPECTED_IDS = ['compact', 'average', 'large-frame', 'tall', 'soft'];

function recipe(bodyId: string, outfit = 'outfit-tee', accessories: string[] = []): CharacterRecipe {
  return {
    id: `test-${bodyId}`,
    name: bodyId,
    parts: {
      body: bodyId,
      head: 'head-soft-square',
      hair: 'hair-side-part',
      outfit,
      accessories,
    },
    palette: {
      skin: '#C68B59',
      hair: '#2B211D',
      outfitPrimary: '#315A78',
      outfitSecondary: '#E8E4D8',
      accent: '#D85A30',
    },
  };
}

function edgeAlphaMax(svg: string): number {
  const png = PNG.sync.read(new Resvg(svg).render().asPng());
  let max = 0;
  const alphaAt = (x: number, y: number) => png.data[(y * png.width + x) * 4 + 3];
  for (let x = 0; x < png.width; x++) {
    max = Math.max(max, alphaAt(x, 0), alphaAt(x, png.height - 1));
  }
  for (let y = 0; y < png.height; y++) {
    max = Math.max(max, alphaAt(0, y), alphaAt(png.width - 1, y));
  }
  return max;
}

describe('body archetype silhouette trials', () => {
  it('defines the five documented candidates with unique render-only ids', () => {
    expect(BODY_ARCHETYPE_TRIALS.map((trial) => trial.id)).toEqual(EXPECTED_IDS);
    expect(new Set(BODY_ARCHETYPE_TRIALS.map((trial) => trial.part.id)).size).toBe(EXPECTED_IDS.length);
    expect(BODY_ARCHETYPE_TRIALS.every((trial) => trial.provenance === 'generated')).toBe(true);
    expect(BODY_ARCHETYPE_TRIALS.every((trial) => trial.status === 'candidate')).toBe(true);
  });

  it('resolves explicitly through the compositor registry but stays out of production selection', () => {
    const selectable = new Set(partsForSlot('body').map((part) => part.id));
    for (const trial of BODY_ARCHETYPE_TRIALS) {
      expect(getPart(trial.part.id)).toBe(trial.part);
      expect(selectable.has(trial.part.id)).toBe(false);
    }
  });

  it('authors a nonempty, tintable silhouette for every source facing', () => {
    for (const trial of BODY_ARCHETYPE_TRIALS) {
      for (const facing of FACINGS) {
        const variant = trial.part.facings[facing];
        expect(variant, `${trial.id}/${facing} is missing`).toBeTruthy();
        expect(variant!.shapes.length, `${trial.id}/${facing} has no geometry`).toBeGreaterThan(0);
        expect(variant!.shapes[0].fill, `${trial.id}/${facing} base is not tintable`).toBe('$outfitPrimary');
        expect(variant!.shapes[0].silhouette).not.toBe(false);
      }
    }
  });

  it('keeps the candidate silhouettes pairwise distinct', () => {
    for (const facing of FACINGS) {
      const paths = BODY_ARCHETYPE_TRIALS.map((trial) => trial.part.facings[facing]!.shapes[0].d);
      expect(new Set(paths).size, `${facing} silhouettes collapsed together`).toBe(BODY_ARCHETYPE_TRIALS.length);
    }
  });

  it('records finite, ordered intended body-local guides for every facing', () => {
    const points = (facing: Facing, trialIndex: number) => {
      const g = BODY_ARCHETYPE_TRIALS[trialIndex].guides[facing];
      return [
        g.headCenter,
        g.aboveHead,
        g.neck,
        g.chest,
        g.hip,
        g.shoulders.left,
        g.shoulders.right,
        g.waist.left,
        g.waist.right,
        g.hem.left,
        g.hem.right,
      ];
    };

    for (let i = 0; i < BODY_ARCHETYPE_TRIALS.length; i++) {
      for (const facing of FACINGS) {
        const guide = BODY_ARCHETYPE_TRIALS[i].guides[facing];
        for (const p of points(facing, i)) {
          expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
          expect(p.x).toBeGreaterThanOrEqual(-48);
          expect(p.x).toBeLessThanOrEqual(48);
          expect(p.y).toBeGreaterThanOrEqual(-86);
          expect(p.y).toBeLessThanOrEqual(36);
        }
        expect(guide.aboveHead.y).toBe(guide.headCenter.y - 32);
        expect(guide.shoulders.left.x).toBeLessThan(guide.shoulders.right.x);
        expect(guide.waist.left.x).toBeLessThan(guide.waist.right.x);
        expect(guide.hem.left.x).toBeLessThan(guide.hem.right.x);
      }
    }
  });

  it('binds every candidate part to its documented body-owned rig', () => {
    for (const trial of BODY_ARCHETYPE_TRIALS) {
      expect(trial.part.bodyAnchors).toBe(trial.guides);
      expect(trial.part.bodyAnchors).toEqual({
        south: trial.guides.south,
        east: trial.guides.east,
        north: trial.guides.north,
      });
    }
  });

  it('moves the full head stack, portrait crops, and layers with the active body rig', () => {
    const tall = recipe('trial-body-tall');
    const svg = composeCharacter(tall, DEFAULT_STYLE, 'south', 128, 'normal', { badge: false });
    expect(svg).toContain('translate(64 39)');
    expect(svg).toContain('translate(64 53) scale(1)');
    expect(composePortrait(tall, DEFAULT_STYLE, 128)).toContain('viewBox="24 -3 80 80"');
    expect(employeePortraitCrop(tall)).toEqual({ x: 24, y: 9, w: 80, h: 80 });

    const layers = characterLayers(tall, DEFAULT_STYLE);
    expect(layers.find((layer) => layer.partId === 'head-soft-square')?.markup.south).toContain('translate(64 39)');
    expect(layers.find((layer) => layer.key === 'outfit-tee__skin')?.markup.south).toContain('-34');
    expect(layers.find((layer) => layer.key === 'neck-shadow__literal')?.markup.south).toContain('-27');
  });

  it('exports exact per-body overhead and pose anchors, including the unit rendering', () => {
    const tall = recipe('trial-body-tall');
    expect(overheadAnchor('south', tall)).toEqual({ x: 64, y: 7 });
    expect(poseRigAnchors('south', tall)).toEqual({
      shoulderLeft: { x: 41, y: 62 },
      shoulderRight: { x: 87, y: 62 },
      hip: { x: 64, y: 99 },
    });
    expect(poseRigAnchors('west', tall)).toEqual({
      shoulderLeft: { x: 59, y: 62 },
      shoulderRight: { x: 67, y: 62 },
      hip: { x: 63, y: 99 },
    });

    const atlas = characterAtlas(tall, DEFAULT_STYLE, 1);
    const poseAtlas = posesAtlas(tall, DEFAULT_STYLE, 1);
    expect(atlas.anchors.aboveHead.south).toEqual({ x: 0.5, y: 0.9453125 });
    expect(poseAtlas.anchors.south).toEqual({
      shoulderLeft: { x: 0.3203125, y: 0.515625 },
      shoulderRight: { x: 0.6796875, y: 0.515625 },
      hip: { x: 0.5, y: 0.2265625 },
    });
    expect(unitAtlas(tall, DEFAULT_STYLE, 1).anchors).toEqual(atlas.anchors);
    expect(unitPosesAtlas(tall, DEFAULT_STYLE, 1).anchors).toEqual(poseAtlas.anchors);

    const unit = unitRecipe(tall);
    expect(unit.rigBodyId).toBe(tall.parts.body);
    expect(composeCharacter(unit, DEFAULT_STYLE, 'south', 128, 'normal', { badge: false })).toContain('translate(64 39)');
    expect(characterLayers(unit, DEFAULT_STYLE).find((layer) => layer.partId === 'head-unit')?.markup.south).toContain('translate(64 39)');
    expect(JSON.stringify(unitRenderingSpec(tall))).not.toContain('rigBodyId');
    expect(JSON.stringify({ atlas, poseAtlas })).not.toContain('rigBodyId');

    // Shared badge art remains character-independent; consumers hang it from
    // the per-character atlas value above rather than rewriting the shared file.
    expect(activityBadgesAtlas(DEFAULT_STYLE, 1).attach.normalizedSouth).toEqual({ x: 0.5, y: 0.90625 });
  });

  it('keeps legacy recipes on the byte-stable fallback anchors and crops', () => {
    const legacy = defaultGoldenProject().characters[0];
    expect(overheadAnchor('south', legacy)).toEqual(overheadAnchor('south'));
    expect(poseRigAnchors('east', legacy)).toEqual(poseRigAnchors('east'));
    expect(employeePortraitCrop(legacy)).toEqual({ x: 24, y: 14, w: 80, h: 80 });
    expect(composePortrait(legacy, DEFAULT_STYLE, 128)).toContain('viewBox="24 2 80 80"');
  });

  it('attaches a conversation link to each participant body rather than the global fallback', () => {
    const tall = recipe('trial-body-tall');
    const compact = recipe('trial-body-compact');
    const svg = composeConversation(tall, compact, defaultGoldenProject());
    expect(svg).toContain('M 67 1 Q');
    expect(svg).toContain('189 11');
  });

  it('renders deterministically at game-scale facings without missing-token magenta', () => {
    for (const trial of BODY_ARCHETYPE_TRIALS) {
      const r = recipe(trial.part.id);
      for (const facing of [...FACINGS, 'west'] as const) {
        const first = composeCharacter(r, DEFAULT_STYLE, facing, 32, 'normal', { badge: false });
        const second = composeCharacter(r, DEFAULT_STYLE, facing, 32, 'normal', { badge: false });
        expect(first).toBe(second);
        expect(first).toContain('width="32" height="32"');
        expect(first.toUpperCase()).not.toContain('#FF00FF');
      }
    }
  });

  it('renders the 120-cell garment/pose/facing matrix deterministically without clipping', () => {
    const outfits = ['outfit-tee', 'outfit-blazer'];
    const poses = ['neutral', 'point', 'slump'] as const;
    const facings = [...FACINGS, 'west'] as const;
    let rendered = 0;

    for (const trial of BODY_ARCHETYPE_TRIALS) {
      for (const outfit of outfits) {
        const r = recipe(trial.part.id, outfit, ['acc-lanyard']);
        for (const pose of poses) {
          for (const facing of facings) {
            const first = composeCharacter(r, DEFAULT_STYLE, facing, 128, 'normal', { badge: false, pose });
            const second = composeCharacter(r, DEFAULT_STYLE, facing, 128, 'normal', { badge: false, pose });
            const label = `${trial.id}/${outfit}/${pose}/${facing}`;
            expect(first, `${label} is nondeterministic`).toBe(second);
            expect(first, `${label} has invalid geometry`).not.toMatch(/NaN|undefined/);
            expect(first.toUpperCase(), `${label} has an unresolved palette token`).not.toContain('#FF00FF');
            expect(edgeAlphaMax(first), `${label} touches the canvas edge`).toBe(0);
            rendered++;
          }
        }
      }
    }
    expect(rendered).toBe(120);
  });
});
