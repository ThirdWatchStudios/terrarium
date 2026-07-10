import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
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
import {
  activityBadgesAtlas,
  characterAtlas,
  exportAll,
  posesAtlas,
  unitAtlas,
  unitPosesAtlas,
  type ExportSink,
  type Rasterizer,
} from '../src/core/exporter';
import { appearanceSignature, type EmployeeDefinition } from '../src/core/employee';
import { normalizeCharacterRecipe } from '../src/core/recipe';
import { unitRecipe, unitRenderingSpec } from '../src/core/renderings';
import type { CharacterRecipe, Facing } from '../src/core/types';
import { FACINGS } from '../src/core/types';
import { DEFAULT_STYLE, DEFAULT_STYLE_PRESETS, defaultGoldenProject } from '../src/data/defaults';
import { BODY_ARCHETYPE_TRIALS } from '../src/parts/bodyArchetypeTrials';
import { getPart, partsForSlot } from '../src/parts/library';
import { getPose, POSES, poseVariantFor, type Pose } from '../src/parts/poses';

const EXPECTED_IDS = ['compact', 'average', 'large-frame', 'tall', 'soft'];
const HUMAN_OUTFITS = [
  'outfit-tee',
  'outfit-polo',
  'outfit-shirt-tie',
  'outfit-turtleneck',
  'outfit-cardigan',
  'outfit-blazer',
  'outfit-suit-jacket',
  'outfit-hoodie',
  'outfit-vest',
  'outfit-hi-vis',
  'outfit-dress',
] as const;

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

interface RenderCell {
  label: string;
  svg: string;
}

function svgInner(svg: string): string {
  return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

function rasterGrid(cells: RenderCell[], cellSize: number, cols: number): { png: PNG; gap: number } {
  const gap = 2;
  const rows = Math.ceil(cells.length / cols);
  const width = cols * (cellSize + gap) + gap;
  const height = rows * (cellSize + gap) + gap;
  const body = cells.map((cell, index) => {
    const x = gap + (index % cols) * (cellSize + gap);
    const y = gap + Math.floor(index / cols) * (cellSize + gap);
    return `<g transform="translate(${x} ${y}) scale(${cellSize / 128})">${svgInner(cell.svg)}</g>`;
  }).join('');
  const grid = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;
  const png = PNG.sync.read(new Resvg(grid).render().asPng());
  return { png, gap };
}

/** Rasterize a whole QA matrix once, then report cells painting their outermost pixel. */
function clippedCells(cells: RenderCell[], cellSize: number, cols: number): string[] {
  const { png, gap } = rasterGrid(cells, cellSize, cols);
  const alphaAt = (x: number, y: number) => png.data[(y * png.width + x) * 4 + 3];
  const clipped: string[] = [];

  cells.forEach((cell, index) => {
    const x0 = gap + (index % cols) * (cellSize + gap);
    const y0 = gap + Math.floor(index / cols) * (cellSize + gap);
    const x1 = x0 + cellSize - 1;
    const y1 = y0 + cellSize - 1;
    let touches = false;
    for (let x = x0; x <= x1 && !touches; x++) touches = alphaAt(x, y0) > 0 || alphaAt(x, y1) > 0;
    for (let y = y0; y <= y1 && !touches; y++) touches = alphaAt(x0, y) > 0 || alphaAt(x1, y) > 0;
    if (touches) clipped.push(cell.label);
  });
  return clipped;
}

/** Strong pixels added where the bare body is transparent, grouped by QA cell. */
function outsidePaintCounts(baseCells: RenderCell[], dressedCells: RenderCell[], cellSize: number, cols: number) {
  expect(dressedCells.map((cell) => cell.label)).toEqual(baseCells.map((cell) => cell.label));
  const base = rasterGrid(baseCells, cellSize, cols);
  const dressed = rasterGrid(dressedCells, cellSize, cols);
  const counts: Array<{ label: string; count: number }> = [];

  baseCells.forEach((cell, index) => {
    const x0 = base.gap + (index % cols) * (cellSize + base.gap);
    const y0 = base.gap + Math.floor(index / cols) * (cellSize + base.gap);
    let count = 0;
    for (let y = y0; y < y0 + cellSize; y++) {
      for (let x = x0; x < x0 + cellSize; x++) {
        const offset = (y * base.png.width + x) * 4 + 3;
        if (base.png.data[offset] <= 8 && dressed.png.data[offset] > 32) count++;
      }
    }
    counts.push({ label: cell.label, count });
  });
  return counts;
}

describe('body archetype silhouette trials', () => {
  it('defines the five documented candidates with unique render-only ids', () => {
    expect(BODY_ARCHETYPE_TRIALS.map((trial) => trial.id)).toEqual(EXPECTED_IDS);
    expect(new Set(BODY_ARCHETYPE_TRIALS.map((trial) => trial.part.id)).size).toBe(EXPECTED_IDS.length);
    expect(BODY_ARCHETYPE_TRIALS.every((trial) => trial.provenance === 'generated')).toBe(true);
    expect(BODY_ARCHETYPE_TRIALS.every((trial) => trial.status === 'silhouette-approved')).toBe(true);
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

  it('generates body-owned wrists for all 15 poses and renders the 300-cell pose matrix cleanly', () => {
    const facings = [...FACINGS, 'west'] as const;
    const cells: RenderCell[] = [];

    for (const trial of BODY_ARCHETYPE_TRIALS) {
      const r = recipe(trial.part.id);
      for (const pose of POSES) {
        for (const facing of facings) {
          const actual: Facing = facing === 'west' ? 'east' : facing;
          const variant = poseVariantFor(pose, actual, trial.guides[actual]);
          const label = `${trial.id}/${pose}/${facing}`;
          expect(variant?.attachments?.handRight, `${label} has no right wrist`).toBeTruthy();
          expect(variant?.attachments?.carryHand, `${label} has no carry policy`).toMatch(/^(left|right|none)$/);
          const carryHand = variant?.attachments?.carryHand;
          if (carryHand && carryHand !== 'none') {
            const carryPoint = carryHand === 'left'
              ? variant.attachments?.handLeft
              : variant.attachments?.handRight;
            expect(carryPoint, `${label} declares a missing ${carryHand} carry wrist`).toBeTruthy();
          }
          for (const point of [variant?.attachments?.handLeft, variant?.attachments?.handRight].filter(Boolean)) {
            expect(Number.isFinite(point!.x) && Number.isFinite(point!.y), `${label} has an invalid wrist`).toBe(true);
          }

          const first = composeCharacter(r, DEFAULT_STYLE, facing, 128, 'normal', { badge: false, pose });
          const second = composeCharacter(r, DEFAULT_STYLE, facing, 128, 'normal', { badge: false, pose });
          expect(first, `${label} is nondeterministic`).toBe(second);
          expect(first, `${label} has invalid geometry`).not.toMatch(/NaN|undefined/);
          expect(first.toUpperCase(), `${label} has an unresolved palette token`).not.toContain('#FF00FF');
          cells.push({ label, svg: first });
        }
      }
    }

    expect(cells).toHaveLength(300);
    expect(clippedCells(cells, 128, 20)).toEqual([]);
  });

  it('keeps representative wrist coordinates and carry policy stable', () => {
    const large = BODY_ARCHETYPE_TRIALS.find((trial) => trial.id === 'large-frame')!;
    expect(poseVariantFor('neutral', 'south', large.guides.south)?.attachments).toEqual({
      handLeft: { x: -37, y: 13 },
      handRight: { x: 37, y: 13 },
      carryHand: 'right',
    });
    expect(poseVariantFor('point', 'south', large.guides.south)?.attachments).toEqual({
      handLeft: { x: -37, y: 13 },
      handRight: { x: 47, y: -29 },
      carryHand: 'none',
    });
    expect(poseVariantFor('slump', 'south', large.guides.south)?.attachments).toEqual({
      handLeft: { x: -28, y: 15 },
      handRight: { x: 28, y: 15 },
      carryHand: 'right',
    });
  });

  it('places or suppresses all five hand accessories according to the 1,500-cell compatibility policy', () => {
    const handAccessories = ['acc-mug', 'acc-watch', 'acc-clipboard', 'acc-coffee-tray', 'acc-paper-stack'];
    const carryPoses = new Set<Pose>(['neutral', 'walk-approach', 'notice', 'slump', 'walk-away']);
    const facings = [...FACINGS, 'west'] as const;
    const cells: RenderCell[] = [];

    for (const trial of BODY_ARCHETYPE_TRIALS) {
      for (const accessory of handAccessories) {
        const withAccessory = recipe(trial.part.id, 'outfit-tee', [accessory]);
        const withoutAccessory = recipe(trial.part.id);
        const isWatch = accessory === 'acc-watch';
        for (const pose of POSES) {
          for (const facing of facings) {
            const label = `${trial.id}/${accessory}/${pose}/${facing}`;
            const actual: Facing = facing === 'west' ? 'east' : facing;
            const hasFacing = Boolean(getPart(accessory)?.facings[actual]);
            const svg = composeCharacter(withAccessory, DEFAULT_STYLE, facing, 128, 'normal', { badge: false, pose });
            const base = composeCharacter(withoutAccessory, DEFAULT_STYLE, facing, 128, 'normal', { badge: false, pose });
            if (hasFacing && (isWatch || carryPoses.has(pose))) {
              expect(svg, `${label} should show the accessory`).not.toBe(base);
            } else {
              expect(svg, `${label} should suppress the occupied-hand prop`).toBe(base);
            }
            expect(svg, `${label} has invalid geometry`).not.toMatch(/NaN|undefined/);
            cells.push({ label, svg });
          }
        }
      }
    }

    expect(cells).toHaveLength(1500);
    expect(clippedCells(cells, 64, 30)).toEqual([]);
  });

  it('keeps the 5,400-cell pose and hand matrix inside the canvas across every built-in style preset', () => {
    const handAccessories = ['acc-mug', 'acc-watch', 'acc-clipboard', 'acc-coffee-tray', 'acc-paper-stack'];
    const facings = [...FACINGS, 'west'] as const;

    for (const preset of DEFAULT_STYLE_PRESETS) {
      const poseCells: RenderCell[] = [];
      const handCells: RenderCell[] = [];
      for (const trial of BODY_ARCHETYPE_TRIALS) {
        for (const pose of POSES) {
          for (const facing of facings) {
            poseCells.push({
              label: `${preset.id}/${trial.id}/${pose}/${facing}`,
              svg: composeCharacter(recipe(trial.part.id), preset.style, facing, 128, 'normal', { badge: false, pose }),
            });
          }
        }
        for (const accessory of handAccessories) {
          const r = recipe(trial.part.id, 'outfit-tee', [accessory]);
          for (const pose of POSES) {
            for (const facing of facings) {
              handCells.push({
                label: `${preset.id}/${trial.id}/${accessory}/${pose}/${facing}`,
                svg: composeCharacter(r, preset.style, facing, 128, 'normal', { badge: false, pose }),
              });
            }
          }
        }
      }
      expect(poseCells).toHaveLength(300);
      expect(handCells).toHaveLength(1500);
      expect(clippedCells(poseCells, 128, 20), `${preset.id} pose clipping`).toEqual([]);
      expect(clippedCells(handCells, 64, 30), `${preset.id} hand clipping`).toEqual([]);
    }
  });

  it('uses Neutral wrists for base/layer art, limits rigged bodies to one held prop, and preserves legacy behavior', () => {
    const compactMug = recipe('trial-body-compact', 'outfit-tee', ['acc-mug']);
    expect(composeCharacter(compactMug, DEFAULT_STYLE, 'south', 128, 'normal', { badge: false })).toContain('translate(94 100)');
    expect(characterLayers(compactMug, DEFAULT_STYLE).find((layer) => layer.partId === 'acc-mug')?.markup.south)
      .toContain('translate(94 100)');

    const riggedStack = recipe('trial-body-compact', 'outfit-tee', ['acc-mug', 'acc-watch', 'acc-clipboard']);
    const riggedAllowed = recipe('trial-body-compact', 'outfit-tee', ['acc-mug', 'acc-watch']);
    expect(normalizeCharacterRecipe(riggedStack).parts.accessories).toEqual(['acc-mug', 'acc-watch']);
    expect(composeCharacter(riggedStack, DEFAULT_STYLE, 'south', 128, 'normal', { badge: false }))
      .toBe(composeCharacter(riggedAllowed, DEFAULT_STYLE, 'south', 128, 'normal', { badge: false }));

    const pointWithMug = composeCharacter(compactMug, DEFAULT_STYLE, 'south', 128, 'normal', { badge: false, pose: 'point' });
    const pointWithoutMug = composeCharacter(recipe('trial-body-compact'), DEFAULT_STYLE, 'south', 128, 'normal', { badge: false, pose: 'point' });
    expect(pointWithMug).toBe(pointWithoutMug);

    const legacy = recipe('body-standard', 'outfit-tee', ['acc-mug']);
    const legacyPoint = composeCharacter(legacy, DEFAULT_STYLE, 'south', 128, 'normal', { badge: false, pose: 'point' });
    expect(legacyPoint).toContain('translate(89 99)');
    expect(legacyPoint).not.toBe(composeCharacter(recipe('body-standard'), DEFAULT_STYLE, 'south', 128, 'normal', { badge: false, pose: 'point' }));

    const legacyStack = recipe('body-standard', 'outfit-tee', ['acc-mug', 'acc-clipboard']);
    expect(normalizeCharacterRecipe(legacyStack)).toBe(legacyStack);
  });

  it('normalizes rigged identity, signatures, and exported recipes to the same effective accessory set', async () => {
    const stacked = recipe('trial-body-compact', 'outfit-tee', ['acc-mug', 'acc-watch', 'acc-clipboard']);
    const allowed = recipe('trial-body-compact', 'outfit-tee', ['acc-mug', 'acc-watch']);
    const reversed = recipe('trial-body-compact', 'outfit-tee', ['acc-clipboard', 'acc-watch', 'acc-mug']);
    const asEmployee = (r: CharacterRecipe): EmployeeDefinition => ({
      visualSeed: 'BODY01',
      profile: 'random',
      name: r.name,
      recipe: { parts: r.parts, palette: r.palette },
      metadata: { department: '', role: '', agentId: '', displayName: r.name },
    });

    expect(appearanceSignature(asEmployee(stacked))).toBe(appearanceSignature(asEmployee(allowed)));
    expect(appearanceSignature(asEmployee(reversed))).not.toBe(appearanceSignature(asEmployee(allowed)));
    expect(composeCharacter(reversed, DEFAULT_STYLE, 'south', 128, 'normal', { badge: false }))
      .not.toBe(composeCharacter(allowed, DEFAULT_STYLE, 'south', 128, 'normal', { badge: false }));

    const project = defaultGoldenProject();
    const source = project.characters[0];
    project.characters[0] = { ...stacked, id: source.id, name: source.name };
    const json = new Map<string, string>();
    const sink: ExportSink = {
      file: (path, data) => {
        if (typeof data === 'string') json.set(path, data);
      },
    };
    const rasterizer: Rasterizer = { rasterizeSheet: async () => new Uint8Array() };
    await exportAll(project, { sink, rasterizer });

    const expected = ['acc-mug', 'acc-watch'];
    expect(JSON.parse(json.get('project.json')!).characters[0].parts.accessories).toEqual(expected);
    expect(JSON.parse(json.get(`characters/${source.id}/recipe.json`)!).parts.accessories).toEqual(expected);
    expect(JSON.parse(json.get(`character-layers/${source.id}/recipe.json`)!).parts.accessories).toEqual(expected);
  });

  it('pins the complete legacy body, pose, facing, garment, and hand-accessory matrix', () => {
    const bodies = ['body-standard', 'body-slim', 'body-broad'];
    const accessorySets = [
      [],
      ['acc-mug'],
      ['acc-watch'],
      ['acc-clipboard', 'acc-lanyard'],
    ] as const;
    const facings = [...FACINGS, 'west'] as const;
    const digest = createHash('sha256');
    let count = 0;

    for (const body of bodies) {
      for (const [outfitIndex, outfit] of HUMAN_OUTFITS.entries()) {
        const accessories = accessorySets[outfitIndex % accessorySets.length];
        const r = recipe(body, outfit, [...accessories]);
        for (const pose of POSES) {
          for (const facing of facings) {
            const sourceFacing: Facing = facing === 'west' ? 'east' : facing;
            expect(poseVariantFor(pose, sourceFacing)).toBe(getPose(pose)?.facings[sourceFacing]);
            const label = `${body}/${outfit}/${accessories.join('+')}/${pose}/${facing}`;
            digest.update(label).update('\0');
            digest.update(composeCharacter(r, DEFAULT_STYLE, facing, 128, 'normal', { badge: false, pose })).update('\0');
            count++;
          }
        }
      }
    }

    expect(count).toBe(1980);
    expect(digest.digest('hex')).toBe('559fce07e736e0de1075892bb883c3edc927ba5ff755d41e74c1418d6deb2158');
  });

  it('keeps the original garment vertical slice deterministic and unclipped', () => {
    const outfits = ['outfit-tee', 'outfit-blazer'];
    const poses = ['neutral', 'point', 'slump'] as const;
    const facings = [...FACINGS, 'west'] as const;
    const cells: RenderCell[] = [];

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
            cells.push({ label, svg: first });
          }
        }
      }
    }
    expect(cells).toHaveLength(120);
    expect(clippedCells(cells, 128, 20)).toEqual([]);
  });

  it('builds all 11 human garments from the body rig and reserves silhouette expansion for dress', () => {
    for (const outfit of HUMAN_OUTFITS) {
      expect(getPart(outfit)?.buildVariant, `${outfit} has no body-aware builder`).toBeTypeOf('function');
    }

    for (const facing of FACINGS) {
      const dressPaths: string[] = [];
      for (const trial of BODY_ARCHETYPE_TRIALS) {
        for (const outfit of HUMAN_OUTFITS) {
          const variant = getPart(outfit)?.buildVariant?.(facing, {
            bodyAnchors: trial.guides[facing],
            bodyId: trial.part.id,
          });
          expect(variant, `${trial.id}/${outfit}/${facing} did not build`).toBeTruthy();
          expect(variant?.z).toBe(20);
          const silhouetteShapes = variant?.shapes.filter((shape) => shape.silhouette !== false) ?? [];
          if (outfit === 'outfit-dress') {
            expect(silhouetteShapes, `${trial.id}/${facing} dress has no silhouette`).toHaveLength(1);
            dressPaths.push(silhouetteShapes[0].d);
          } else {
            expect(silhouetteShapes, `${trial.id}/${outfit}/${facing} unexpectedly alters the body`).toEqual([]);
          }
        }
      }
      expect(new Set(dressPaths).size, `${facing} dress silhouettes are not body-specific`).toBe(BODY_ARCHETYPE_TRIALS.length);
    }

    const finalIds = ['body-compact', 'body-balanced', 'body-large-frame', 'body-tall', 'body-soft'];
    const dress = getPart('outfit-dress')!;
    BODY_ARCHETYPE_TRIALS.forEach((trial, index) => {
      for (const facing of FACINGS) {
        const trialVariant = dress.buildVariant!(facing, { bodyAnchors: trial.guides[facing], bodyId: trial.part.id });
        const finalVariant = dress.buildVariant!(facing, { bodyAnchors: trial.guides[facing], bodyId: finalIds[index] });
        expect(finalVariant, `${finalIds[index]}/${facing} lost its dress profile`).toEqual(trialVariant);
      }
    });
  });

  it('keeps fitted detail paint inside each body while every dress visibly expands it', () => {
    const style = structuredClone(DEFAULT_STYLE);
    style.outline.width = 0;
    style.render.contactShadow = 0;
    const baseCells: RenderCell[] = [];
    const fittedCells: RenderCell[] = [];
    const dressBaseCells: RenderCell[] = [];
    const dressCells: RenderCell[] = [];
    const fittedOutfits = HUMAN_OUTFITS.filter((outfit) => outfit !== 'outfit-dress');

    for (const trial of BODY_ARCHETYPE_TRIALS) {
      for (const outfit of fittedOutfits) {
        for (const facing of FACINGS) {
          const label = `${trial.id}/${outfit}/${facing}`;
          const bare = recipe(trial.part.id, '__fit-none__');
          bare.parts.head = '__fit-none__';
          bare.parts.hair = '__fit-none__';
          const dressed = recipe(trial.part.id, outfit);
          dressed.parts.head = '__fit-none__';
          dressed.parts.hair = '__fit-none__';
          baseCells.push({ label, svg: composeCharacter(bare, style, facing, 128, 'normal', { badge: false }) });
          fittedCells.push({ label, svg: composeCharacter(dressed, style, facing, 128, 'normal', { badge: false }) });
        }
      }
      for (const facing of FACINGS) {
        const label = `${trial.id}/outfit-dress/${facing}`;
        const bare = recipe(trial.part.id, '__fit-none__');
        bare.parts.head = '__fit-none__';
        bare.parts.hair = '__fit-none__';
        const dressed = recipe(trial.part.id, 'outfit-dress');
        dressed.parts.head = '__fit-none__';
        dressed.parts.hair = '__fit-none__';
        dressBaseCells.push({ label, svg: composeCharacter(bare, style, facing, 128, 'normal', { badge: false }) });
        dressCells.push({ label, svg: composeCharacter(dressed, style, facing, 128, 'normal', { badge: false }) });
      }
    }

    expect(baseCells).toHaveLength(150);
    for (const result of outsidePaintCounts(baseCells, fittedCells, 128, 10)) {
      expect(result.count, `${result.label} paints strongly outside its fitted body`).toBeLessThanOrEqual(4);
    }
    expect(dressCells).toHaveLength(15);
    for (const result of outsidePaintCounts(dressBaseCells, dressCells, 128, 5)) {
      expect(result.count, `${result.label} does not visibly alter the silhouette`).toBeGreaterThanOrEqual(20);
    }
  });

  it('renders the complete 9,900-cell body, outfit, pose, facing, and style matrix cleanly', () => {
    const facings = [...FACINGS, 'west'] as const;
    let total = 0;

    for (const preset of DEFAULT_STYLE_PRESETS) {
      const cells: RenderCell[] = [];
      for (const trial of BODY_ARCHETYPE_TRIALS) {
        for (const outfit of HUMAN_OUTFITS) {
          const r = recipe(trial.part.id, outfit, ['acc-lanyard', 'acc-watch']);
          for (const pose of POSES) {
            for (const facing of facings) {
              const label = `${preset.id}/${trial.id}/${outfit}/${pose}/${facing}`;
              const first = composeCharacter(r, preset.style, facing, 64, 'normal', { badge: false, pose });
              const second = composeCharacter(r, preset.style, facing, 64, 'normal', { badge: false, pose });
              expect(first, `${label} is nondeterministic`).toBe(second);
              expect(first, `${label} has invalid geometry`).not.toMatch(/NaN|undefined/);
              expect(first.toUpperCase(), `${label} has an unresolved palette token`).not.toContain('#FF00FF');
              cells.push({ label, svg: first });
            }
          }
        }
      }
      expect(cells).toHaveLength(3300);
      expect(clippedCells(cells, 64, 40), `${preset.id} outfit matrix clipping`).toEqual([]);
      total += cells.length;
    }

    expect(total).toBe(9900);
  });

  it('keeps outfit layers compatible with body accessories and pose-time held-prop suppression', () => {
    for (const outfit of ['outfit-blazer', 'outfit-dress']) {
      const dressed = recipe('trial-body-soft', outfit, ['acc-lanyard', 'acc-watch', 'acc-mug']);
      const neutral = composeCharacter(dressed, DEFAULT_STYLE, 'south', 128, 'normal', { badge: false, pose: 'neutral' });
      const point = composeCharacter(dressed, DEFAULT_STYLE, 'south', 128, 'normal', { badge: false, pose: 'point' });
      const pointWithoutMug = composeCharacter(
        recipe('trial-body-soft', outfit, ['acc-lanyard', 'acc-watch']),
        DEFAULT_STYLE,
        'south',
        128,
        'normal',
        { badge: false, pose: 'point' },
      );
      expect(neutral).not.toMatch(/NaN|undefined/);
      expect(neutral.toUpperCase()).not.toContain('#FF00FF');
      expect(point).toBe(pointWithoutMug);
      const layers = characterLayers(dressed, DEFAULT_STYLE);
      expect(layers.some((layer) => layer.partId === outfit)).toBe(true);
      expect(layers.some((layer) => layer.partId === 'acc-lanyard')).toBe(true);
      expect(layers.some((layer) => layer.partId === 'acc-watch')).toBe(true);
      expect(layers.some((layer) => layer.partId === 'acc-mug')).toBe(true);
    }
  });
});
