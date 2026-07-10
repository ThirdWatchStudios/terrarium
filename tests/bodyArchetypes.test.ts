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
import { appearanceSignature, generateEmployee, type EmployeeDefinition } from '../src/core/employee';
import { mulberry32, randomCharacter } from '../src/core/random';
import { normalizeCharacterRecipe } from '../src/core/recipe';
import { unitRecipe, unitRenderingSpec } from '../src/core/renderings';
import type { CharacterRecipe, Facing } from '../src/core/types';
import { CURRENT_SCHEMA_VERSION, FACINGS } from '../src/core/types';
import { DEFAULT_CAST, DEFAULT_STYLE, DEFAULT_STYLE_PRESETS, defaultGoldenProject } from '../src/data/defaults';
import {
  BODY_ARCHETYPES,
  BODY_ARCHETYPE_PARTS,
  type BodyArchetypeId,
} from '../src/parts/bodyArchetypes';
import { getPart, partsForSlot } from '../src/parts/library';
import { getPose, POSES, poseVariantFor, type Pose } from '../src/parts/poses';

const EXPECTED_IDS: BodyArchetypeId[] = [
  'body-compact',
  'body-balanced',
  'body-large-frame',
  'body-tall',
  'body-soft',
];
const LEGACY_IDS = ['body-standard', 'body-slim', 'body-broad'];
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

describe('production body archetypes', () => {
  it('defines the exact production body order with matching part ids', () => {
    expect(BODY_ARCHETYPES.map((archetype) => archetype.id)).toEqual(EXPECTED_IDS);
    expect(BODY_ARCHETYPES.map((archetype) => archetype.part.id)).toEqual(EXPECTED_IDS);
    expect(BODY_ARCHETYPE_PARTS.map((part) => part.id)).toEqual(EXPECTED_IDS);
    expect(partsForSlot('body').map((part) => part.id)).toEqual(EXPECTED_IDS);
  });

  it('resolves production and legacy bodies while selecting only production bodies', () => {
    const selectableParts = partsForSlot('body');
    const selectable = new Set(selectableParts.map((part) => part.id));
    for (const [index, archetype] of BODY_ARCHETYPES.entries()) {
      expect(getPart(archetype.part.id)).toBe(archetype.part);
      expect(BODY_ARCHETYPE_PARTS[index]).toBe(archetype.part);
      expect(selectableParts[index]).toBe(archetype.part);
      expect(archetype.part.bodyAnchors).toBe(archetype.anchors);
      expect(selectable.has(archetype.part.id)).toBe(true);
    }
    for (const legacyId of LEGACY_IDS) {
      expect(getPart(legacyId)?.slot).toBe('body');
      expect(selectable.has(legacyId)).toBe(false);
    }
  });

  it('keeps the named default cast on its legacy bodies without migration', () => {
    expect(DEFAULT_CAST.map(({ id, parts }) => [id, parts.body])).toEqual([
      ['janice', 'body-standard'],
      ['carl', 'body-broad'],
      ['linda', 'body-standard'],
      ['manager', 'body-broad'],
    ]);
    expect(CURRENT_SCHEMA_VERSION).toBe(18);
  });

  it('keeps seeded random and employee generation deterministic and production-only', () => {
    const allowed = new Set<string>(EXPECTED_IDS);
    const randomBodies = new Set<string>();
    const employeeBodies = new Set<string>();
    const randomSequence: string[] = [];
    const employeeSequence: string[] = [];

    for (let seed = 0; seed < 256; seed++) {
      const firstRandom = randomCharacter(DEFAULT_STYLE, mulberry32(seed));
      const secondRandom = randomCharacter(DEFAULT_STYLE, mulberry32(seed));
      expect({ name: firstRandom.name, parts: firstRandom.parts, palette: firstRandom.palette })
        .toEqual({ name: secondRandom.name, parts: secondRandom.parts, palette: secondRandom.palette });
      expect(allowed.has(firstRandom.parts.body)).toBe(true);
      randomBodies.add(firstRandom.parts.body);
      randomSequence.push(firstRandom.parts.body);

      const firstEmployee = generateEmployee(`BODY-${seed}`, 'random', DEFAULT_STYLE);
      const secondEmployee = generateEmployee(`BODY-${seed}`, 'random', DEFAULT_STYLE);
      expect(firstEmployee).toEqual(secondEmployee);
      expect(allowed.has(firstEmployee.recipe.parts.body)).toBe(true);
      employeeBodies.add(firstEmployee.recipe.parts.body);
      employeeSequence.push(firstEmployee.recipe.parts.body);
    }

    expect([...randomBodies].sort()).toEqual([...EXPECTED_IDS].sort());
    expect([...employeeBodies].sort()).toEqual([...EXPECTED_IDS].sort());
    expect(createHash('sha256').update(randomSequence.join('\n')).digest('hex'))
      .toBe('a407def15f4161e7042d571e97aa2527668e32cab1312d4bd1fceed523d332a0');
    expect(createHash('sha256').update(employeeSequence.join('\n')).digest('hex'))
      .toBe('c406062a69ed4f107a68d8334cd85444ef368ede8d88077c14d4f9a32cccb47d');
  });

  it('authors a nonempty, tintable silhouette for every source facing', () => {
    for (const archetype of BODY_ARCHETYPES) {
      for (const facing of FACINGS) {
        const variant = archetype.part.facings[facing];
        expect(variant, `${archetype.id}/${facing} is missing`).toBeTruthy();
        expect(variant!.shapes.length, `${archetype.id}/${facing} has no geometry`).toBeGreaterThan(0);
        expect(variant!.shapes[0].fill, `${archetype.id}/${facing} base is not tintable`).toBe('$outfitPrimary');
        expect(variant!.shapes[0].silhouette).not.toBe(false);
      }
    }
  });

  it('keeps the production silhouettes pairwise distinct', () => {
    for (const facing of FACINGS) {
      const paths = BODY_ARCHETYPES.map((archetype) => archetype.part.facings[facing]!.shapes[0].d);
      expect(new Set(paths).size, `${facing} silhouettes collapsed together`).toBe(BODY_ARCHETYPES.length);
    }
  });

  it('records finite, ordered body-local anchors for every facing', () => {
    const points = (facing: Facing, archetypeIndex: number) => {
      const g = BODY_ARCHETYPES[archetypeIndex].anchors[facing];
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

    for (let i = 0; i < BODY_ARCHETYPES.length; i++) {
      for (const facing of FACINGS) {
        const anchors = BODY_ARCHETYPES[i].anchors[facing];
        for (const p of points(facing, i)) {
          expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
          expect(p.x).toBeGreaterThanOrEqual(-48);
          expect(p.x).toBeLessThanOrEqual(48);
          expect(p.y).toBeGreaterThanOrEqual(-86);
          expect(p.y).toBeLessThanOrEqual(36);
        }
        expect(anchors.aboveHead.y).toBe(anchors.headCenter.y - 32);
        expect(anchors.shoulders.left.x).toBeLessThan(anchors.shoulders.right.x);
        expect(anchors.waist.left.x).toBeLessThan(anchors.waist.right.x);
        expect(anchors.hem.left.x).toBeLessThan(anchors.hem.right.x);
      }
    }
  });

  it('binds every production part to its documented body-owned rig', () => {
    for (const archetype of BODY_ARCHETYPES) {
      expect(archetype.part.bodyAnchors).toBe(archetype.anchors);
      expect(archetype.part.bodyAnchors).toEqual({
        south: archetype.anchors.south,
        east: archetype.anchors.east,
        north: archetype.anchors.north,
      });
    }
  });

  it('moves the full head stack, portrait crops, and layers with the active body rig', () => {
    const tall = recipe('body-tall');
    const svg = composeCharacter(tall, DEFAULT_STYLE, 'south', 128, 'normal', { badge: false });
    expect(svg).toContain('translate(64 39)');
    expect(svg).toContain('translate(64 53) scale(1)');
    expect(composePortrait(tall, DEFAULT_STYLE, 128)).toContain('viewBox="24 -3 80 80"');
    expect(employeePortraitCrop(tall)).toEqual({ x: 24, y: 9, w: 80, h: 80 });

    const layers = characterLayers(tall, DEFAULT_STYLE);
    expect(layers.find((layer) => layer.partId === 'head-soft-square')?.markup.south).toContain('translate(64 39)');
    expect(layers.find((layer) => layer.key === 'outfit-tee__outfitSecondary')?.markup.south).toContain('M0-34');
    expect(layers.find((layer) => layer.key === 'outfit-tee__skin')?.markup.south).toContain('M0-33.3');
    expect(layers.find((layer) => layer.key === 'neck-shadow__literal')?.markup.south).toContain('-27');
  });

  it('exports exact per-body overhead and pose anchors, including the unit rendering', () => {
    const tall = recipe('body-tall');
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
    const tall = recipe('body-tall');
    const compact = recipe('body-compact');
    const svg = composeConversation(tall, compact, defaultGoldenProject());
    expect(svg).toContain('M 67 1 Q');
    expect(svg).toContain('189 11');
  });

  it('renders deterministically at game-scale facings without missing-token magenta', () => {
    for (const archetype of BODY_ARCHETYPES) {
      const r = recipe(archetype.part.id);
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

    for (const archetype of BODY_ARCHETYPES) {
      const r = recipe(archetype.part.id);
      for (const pose of POSES) {
        for (const facing of facings) {
          const actual: Facing = facing === 'west' ? 'east' : facing;
          const variant = poseVariantFor(pose, actual, archetype.anchors[actual]);
          const label = `${archetype.id}/${pose}/${facing}`;
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
    const large = BODY_ARCHETYPES.find((archetype) => archetype.id === 'body-large-frame')!;
    expect(poseVariantFor('neutral', 'south', large.anchors.south)?.attachments).toEqual({
      handLeft: { x: -37, y: 13 },
      handRight: { x: 37, y: 13 },
      carryHand: 'right',
    });
    expect(poseVariantFor('point', 'south', large.anchors.south)?.attachments).toEqual({
      handLeft: { x: -37, y: 13 },
      handRight: { x: 47, y: -29 },
      carryHand: 'none',
    });
    expect(poseVariantFor('slump', 'south', large.anchors.south)?.attachments).toEqual({
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

    for (const archetype of BODY_ARCHETYPES) {
      for (const accessory of handAccessories) {
        const withAccessory = recipe(archetype.part.id, 'outfit-tee', [accessory]);
        const withoutAccessory = recipe(archetype.part.id);
        const isWatch = accessory === 'acc-watch';
        for (const pose of POSES) {
          for (const facing of facings) {
            const label = `${archetype.id}/${accessory}/${pose}/${facing}`;
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
      for (const archetype of BODY_ARCHETYPES) {
        for (const pose of POSES) {
          for (const facing of facings) {
            poseCells.push({
              label: `${preset.id}/${archetype.id}/${pose}/${facing}`,
              svg: composeCharacter(recipe(archetype.part.id), preset.style, facing, 128, 'normal', { badge: false, pose }),
            });
          }
        }
        for (const accessory of handAccessories) {
          const r = recipe(archetype.part.id, 'outfit-tee', [accessory]);
          for (const pose of POSES) {
            for (const facing of facings) {
              handCells.push({
                label: `${preset.id}/${archetype.id}/${accessory}/${pose}/${facing}`,
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
    const compactMug = recipe('body-compact', 'outfit-tee', ['acc-mug']);
    expect(composeCharacter(compactMug, DEFAULT_STYLE, 'south', 128, 'normal', { badge: false })).toContain('translate(94 100)');
    expect(characterLayers(compactMug, DEFAULT_STYLE).find((layer) => layer.partId === 'acc-mug')?.markup.south)
      .toContain('translate(94 100)');

    const riggedStack = recipe('body-compact', 'outfit-tee', ['acc-mug', 'acc-watch', 'acc-clipboard']);
    const riggedAllowed = recipe('body-compact', 'outfit-tee', ['acc-mug', 'acc-watch']);
    expect(normalizeCharacterRecipe(riggedStack).parts.accessories).toEqual(['acc-mug', 'acc-watch']);
    expect(composeCharacter(riggedStack, DEFAULT_STYLE, 'south', 128, 'normal', { badge: false }))
      .toBe(composeCharacter(riggedAllowed, DEFAULT_STYLE, 'south', 128, 'normal', { badge: false }));

    const pointWithMug = composeCharacter(compactMug, DEFAULT_STYLE, 'south', 128, 'normal', { badge: false, pose: 'point' });
    const pointWithoutMug = composeCharacter(recipe('body-compact'), DEFAULT_STYLE, 'south', 128, 'normal', { badge: false, pose: 'point' });
    expect(pointWithMug).toBe(pointWithoutMug);

    const legacy = recipe('body-standard', 'outfit-tee', ['acc-mug']);
    const legacyPoint = composeCharacter(legacy, DEFAULT_STYLE, 'south', 128, 'normal', { badge: false, pose: 'point' });
    expect(legacyPoint).toContain('translate(89 99)');
    expect(legacyPoint).not.toBe(composeCharacter(recipe('body-standard'), DEFAULT_STYLE, 'south', 128, 'normal', { badge: false, pose: 'point' }));

    const legacyStack = recipe('body-standard', 'outfit-tee', ['acc-mug', 'acc-clipboard']);
    expect(normalizeCharacterRecipe(legacyStack)).toBe(legacyStack);
  });

  it('round-trips every production body id without leaking private rig metadata', async () => {
    const stacked = recipe('body-compact', 'outfit-tee', ['acc-mug', 'acc-watch', 'acc-clipboard']);
    const allowed = recipe('body-compact', 'outfit-tee', ['acc-mug', 'acc-watch']);
    const reversed = recipe('body-compact', 'outfit-tee', ['acc-clipboard', 'acc-watch', 'acc-mug']);
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
    const productionRecipes = EXPECTED_IDS.map((bodyId, index) => {
      const generated = index === 0 ? stacked : recipe(bodyId);
      return {
        ...generated,
        id: `production-body-${index}`,
        name: `Production body ${index}`,
      };
    });
    project.characters.push(...productionRecipes);
    const json = new Map<string, string>();
    const sink: ExportSink = {
      file: (path, data) => {
        if (typeof data === 'string') json.set(path, data);
      },
    };
    const rasterizer: Rasterizer = { rasterizeSheet: async () => new Uint8Array() };
    await exportAll(project, { sink, rasterizer });

    const projectArtifact = JSON.parse(json.get('project.json')!);
    for (const [index, source] of productionRecipes.entries()) {
      const projectRecipe = projectArtifact.characters.find((character: CharacterRecipe) => character.id === source.id);
      const characterRecipe = JSON.parse(json.get(`characters/${source.id}/recipe.json`)!);
      const layerRecipe = JSON.parse(json.get(`character-layers/${source.id}/recipe.json`)!);
      const layerManifest = JSON.parse(json.get(`character-layers/${source.id}/manifest@1x.json`)!);

      expect(projectRecipe.parts.body).toBe(EXPECTED_IDS[index]);
      expect(characterRecipe.parts.body).toBe(EXPECTED_IDS[index]);
      expect(layerRecipe.parts.body).toBe(EXPECTED_IDS[index]);
      expect(layerManifest.layers.some((layer: { partId: string }) => layer.partId === EXPECTED_IDS[index])).toBe(true);
    }

    const expectedAccessories = ['acc-mug', 'acc-watch'];
    const compactId = productionRecipes[0].id;
    expect(projectArtifact.characters.find((character: CharacterRecipe) => character.id === compactId).parts.accessories)
      .toEqual(expectedAccessories);
    expect(JSON.parse(json.get(`characters/${compactId}/recipe.json`)!).parts.accessories).toEqual(expectedAccessories);
    expect(JSON.parse(json.get(`character-layers/${compactId}/recipe.json`)!).parts.accessories).toEqual(expectedAccessories);

    const serializedCharacterArtifacts = [...json.entries()]
      .filter(([path]) => path === 'project.json' || path.startsWith('characters/') || path.startsWith('character-layers/'))
      .map(([, data]) => data)
      .join('\n');
    expect(serializedCharacterArtifacts).not.toMatch(
      /rigBodyId|bodyAnchors|buildVariant|handAttachmentRole|sourceKind|sourceFiles|assets\/parts\/body|"guides"/,
    );
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
        // Keep this legacy-body control independent of the remaining authored
        // head promotions. Round is the already-approved stable head fixture.
        r.parts.head = 'head-round';
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
    expect(digest.digest('hex')).toBe('870140303fd8fb03e66912ae7e97379c84545418eedc593431265c30fb38804e');
  });

  it('keeps the original garment vertical slice deterministic and unclipped', () => {
    const outfits = ['outfit-tee', 'outfit-blazer'];
    const poses = ['neutral', 'point', 'slump'] as const;
    const facings = [...FACINGS, 'west'] as const;
    const cells: RenderCell[] = [];

    for (const archetype of BODY_ARCHETYPES) {
      for (const outfit of outfits) {
        const r = recipe(archetype.part.id, outfit, ['acc-lanyard']);
        for (const pose of poses) {
          for (const facing of facings) {
            const first = composeCharacter(r, DEFAULT_STYLE, facing, 128, 'normal', { badge: false, pose });
            const second = composeCharacter(r, DEFAULT_STYLE, facing, 128, 'normal', { badge: false, pose });
            const label = `${archetype.id}/${outfit}/${pose}/${facing}`;
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
      for (const archetype of BODY_ARCHETYPES) {
        for (const outfit of HUMAN_OUTFITS) {
          const variant = getPart(outfit)?.buildVariant?.(facing, {
            bodyAnchors: archetype.anchors[facing],
            bodyId: archetype.part.id,
          });
          expect(variant, `${archetype.id}/${outfit}/${facing} did not build`).toBeTruthy();
          expect(variant?.z).toBe(20);
          const silhouetteShapes = variant?.shapes.filter((shape) => shape.silhouette !== false) ?? [];
          if (outfit === 'outfit-dress') {
            expect(silhouetteShapes, `${archetype.id}/${facing} dress has no silhouette`).toHaveLength(1);
            dressPaths.push(silhouetteShapes[0].d);
          } else {
            expect(silhouetteShapes, `${archetype.id}/${outfit}/${facing} unexpectedly alters the body`).toEqual([]);
          }
        }
      }
      expect(new Set(dressPaths).size, `${facing} dress silhouettes are not body-specific`).toBe(BODY_ARCHETYPES.length);
    }

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

    for (const archetype of BODY_ARCHETYPES) {
      for (const outfit of fittedOutfits) {
        for (const facing of FACINGS) {
          const label = `${archetype.id}/${outfit}/${facing}`;
          const bare = recipe(archetype.part.id, '__fit-none__');
          bare.parts.head = '__fit-none__';
          bare.parts.hair = '__fit-none__';
          const dressed = recipe(archetype.part.id, outfit);
          dressed.parts.head = '__fit-none__';
          dressed.parts.hair = '__fit-none__';
          baseCells.push({ label, svg: composeCharacter(bare, style, facing, 128, 'normal', { badge: false }) });
          fittedCells.push({ label, svg: composeCharacter(dressed, style, facing, 128, 'normal', { badge: false }) });
        }
      }
      for (const facing of FACINGS) {
        const label = `${archetype.id}/outfit-dress/${facing}`;
        const bare = recipe(archetype.part.id, '__fit-none__');
        bare.parts.head = '__fit-none__';
        bare.parts.hair = '__fit-none__';
        const dressed = recipe(archetype.part.id, 'outfit-dress');
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
      for (const archetype of BODY_ARCHETYPES) {
        for (const outfit of HUMAN_OUTFITS) {
          const r = recipe(archetype.part.id, outfit, ['acc-lanyard', 'acc-watch']);
          for (const pose of POSES) {
            for (const facing of facings) {
              const label = `${preset.id}/${archetype.id}/${outfit}/${pose}/${facing}`;
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
      const dressed = recipe('body-soft', outfit, ['acc-lanyard', 'acc-watch', 'acc-mug']);
      const neutral = composeCharacter(dressed, DEFAULT_STYLE, 'south', 128, 'normal', { badge: false, pose: 'neutral' });
      const point = composeCharacter(dressed, DEFAULT_STYLE, 'south', 128, 'normal', { badge: false, pose: 'point' });
      const pointWithoutMug = composeCharacter(
        recipe('body-soft', outfit, ['acc-lanyard', 'acc-watch']),
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
