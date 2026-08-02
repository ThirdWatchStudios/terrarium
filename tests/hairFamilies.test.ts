import { createHash } from 'node:crypto';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import { characterLayers, composeCharacter } from '../src/core/compositor';
import type { CharacterRecipe, Facing } from '../src/core/types';
import { FACINGS } from '../src/core/types';
import { DEFAULT_STYLE, DEFAULT_STYLE_PRESETS } from '../src/data/defaults';
import { BODY_ARCHETYPES } from '../src/parts/bodyArchetypes';
import { IMPORTED_PART_PROVENANCE } from '../src/parts/generated/importedPartArt';
import {
  FITTED_HAIR_HEAD_IDS,
  FITTED_HAIR_IDS,
  fittedHairVariant,
} from '../src/parts/hairFitting';
import { getPart, partsForSlot } from '../src/parts/library';

const CANONICAL_HAIRS = [
  ['hair-short', 'short', [1, 1, 1]],
  ['hair-bob', 'bob', [2, 2, 2]],
  ['hair-bun', 'bun', [2, 3, 2]],
  ['hair-curly', 'curly', [6, 5, 4]],
  ['hair-balding', 'balding', [2, 1, 1]],
  ['hair-side-part', 'side-part', [3, 4, 2]],
  ['hair-pixie', 'pixie', [2, 3, 1]],
  ['hair-ponytail', 'ponytail', [3, 4, 3]],
  ['hair-long-straight', 'long-straight', [1, 1, 1]],
  ['hair-coils', 'coils', [1, 1, 1]],
] as const;

const HUMAN_HEADS = [
  'head-round',
  'head-oval',
  'head-boxy',
  'head-long',
  'head-angular',
  'head-soft-square',
] as const;

const ALL_FACINGS = [...FACINGS, 'west'] as const;

const BROAD_SILHOUETTE_HAIRS = new Set([
  'hair-short',
  'hair-bob',
  'hair-curly',
  'hair-ponytail',
  'hair-long-straight',
  'hair-coils',
]);

function recipe(body: string, head: string, hair: string): CharacterRecipe {
  return {
    id: `${body}-${head}-${hair}`,
    name: 'Representative hair QA',
    parts: {
      body,
      head,
      hair,
      outfit: 'outfit-tee',
      accessories: [],
    },
    palette: {
      skin: '#C68B59',
      hair: '#34251C',
      outfitPrimary: '#315A78',
      outfitSecondary: '#E8D6A8',
      accent: '#D85A30',
    },
  };
}

function hairMask(id: string, facing: Facing): Uint8Array {
  const part = getPart(id);
  const shapes = part?.facings[facing]?.shapes.filter(({ silhouette }) => silhouette !== false) ?? [];
  const paths = shapes.map(({ d }) => `<path d="${d}" fill="#000000"/>`).join('');
  const image = new Resvg([
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="32" height="32">',
    `<g transform="translate(64 44)">${paths}</g>`,
    '</svg>',
  ].join(''), { font: { loadSystemFonts: false } }).render();
  const pixels = image.pixels;
  return Uint8Array.from(
    { length: pixels.length / 4 },
    (_, index) => pixels[index * 4 + 3] >= 128 ? 1 : 0,
  );
}

function fittedHairMask(id: string, head: string, facing: Facing): Uint8Array {
  const variant = fittedHairVariant(id, head, facing);
  const paths = variant?.shapes
    .filter(({ silhouette }) => silhouette !== false)
    .map(({ d }) => `<path d="${d}" fill="#000000"/>`)
    .join('') ?? '';
  const image = new Resvg([
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="32" height="32">',
    `<g transform="translate(64 44)">${paths}</g>`,
    '</svg>',
  ].join(''), { font: { loadSystemFonts: false } }).render();
  const pixels = image.pixels;
  return Uint8Array.from(
    { length: pixels.length / 4 },
    (_, index) => pixels[index * 4 + 3] >= 128 ? 1 : 0,
  );
}

describe('canonical production hair families', () => {
  it('resolves all ten promoted hairstyles deterministically against every production head', () => {
    for (const hair of FITTED_HAIR_IDS) {
      for (const head of FITTED_HAIR_HEAD_IDS) {
        for (const facing of FACINGS) {
          const first = fittedHairVariant(hair, head, facing);
          const second = fittedHairVariant(hair, head, facing);
          expect(first, `${hair}/${head}/${facing}`).toBeTruthy();
          expect(second, `${hair}/${head}/${facing}`).toBe(first);
          expect(first?.z, `${hair}/${head}/${facing}`).toBe(50);
          expect(first?.shapes.length, `${hair}/${head}/${facing}`).toBeGreaterThan(0);
          expect(
            first?.shapes
              .filter(({ silhouette }) => silhouette !== false)
              .every(({ fill }) => fill === '$hair'),
            `${hair}/${head}/${facing}`,
          ).toBe(true);
        }
      }
      for (const facing of FACINGS) {
        const fittedPaths = FITTED_HAIR_HEAD_IDS.map((head) =>
          fittedHairVariant(hair, head, facing)?.shapes.map(({ d }) => d).join('|'));
        expect(new Set(fittedPaths).size, `${hair}/${facing} does not adapt to all six heads`)
          .toBe(FITTED_HAIR_HEAD_IDS.length);
      }
    }

    expect(fittedHairVariant('hair-none', 'head-round', 'south')).toBeUndefined();
    expect(fittedHairVariant('hair-short', 'head-fab', 'south')).toBeUndefined();
  });

  it('locks the approved source-fitted Short and Bob with the preserved Ponytail carrier', () => {
    const approved = ['hair-short', 'hair-bob', 'hair-ponytail'];
    const payload = approved.flatMap((hair) =>
      FITTED_HAIR_HEAD_IDS.flatMap((head) =>
        FACINGS.map((facing) => fittedHairVariant(hair, head, facing))));
    expect(createHash('sha256').update(JSON.stringify(payload)).digest('hex'))
      .toBe('888f7544bd8de17d899a36c613dfe1fc231ef09f5559d3120180cbdd2fe62f0f');
  });

  it('uses the same fitted geometry in flat and reconstructable production output', () => {
    for (const hair of FITTED_HAIR_IDS) {
      for (const head of FITTED_HAIR_HEAD_IDS) {
        const source = recipe('body-compact', head, hair);
        const layers = characterLayers(source, DEFAULT_STYLE);
        const hairLayer = layers.find(({ key }) => key === `${hair}__hair`);
        const partLayers = layers.filter(({ partId }) => partId === hair);
        expect(hairLayer, `${hair}/${head} has no reconstructable hair layer`).toBeTruthy();

        for (const facing of FACINGS) {
          const fitted = fittedHairVariant(hair, head, facing)!;
          const flat = composeCharacter(source, DEFAULT_STYLE, facing, 128, 'normal', { badge: false });
          for (const shape of fitted.shapes) {
            expect(flat, `${hair}/${head}/${facing} flat`).toContain(`d="${shape.d}"`);
            expect(
              partLayers.some((layer) => layer.markup[facing].includes(`d="${shape.d}"`)),
              `${hair}/${head}/${facing} layer`,
            ).toBe(true);
          }
        }
      }
    }
  });

  it('keeps every fitted hairstyle pair distinct at 32px across the three authored facings', () => {
    for (let leftIndex = 0; leftIndex < FITTED_HAIR_IDS.length; leftIndex++) {
      for (let rightIndex = leftIndex + 1; rightIndex < FITTED_HAIR_IDS.length; rightIndex++) {
        const leftId = FITTED_HAIR_IDS[leftIndex];
        const rightId = FITTED_HAIR_IDS[rightIndex];
        let changed = 0;
        for (const facing of FACINGS) {
          const left = fittedHairMask(leftId, 'head-round', facing);
          const right = fittedHairMask(rightId, 'head-round', facing);
          for (let pixel = 0; pixel < left.length; pixel++) {
            if (left[pixel] !== right[pixel]) changed++;
          }
        }
        expect(changed, `${leftId}/${rightId}`).toBeGreaterThanOrEqual(24);
      }
    }
  });

  it('keeps exact picker order, canonical provenance, and facing semantics', () => {
    expect(partsForSlot('hair').map(({ id }) => id)).toEqual([
      'hair-none',
      'hair-short',
      'hair-bob',
      'hair-bun',
      'hair-curly',
      'hair-balding',
      'hair-side-part',
      'hair-pixie',
      'hair-ponytail',
      'hair-long-straight',
      'hair-coils',
    ]);

    for (const [id, slug, counts] of CANONICAL_HAIRS) {
      const part = getPart(id);
      expect(part?.anchor, id).toBe('headCenter');
      expect(FACINGS.map((facing) => part?.facings[facing]?.shapes.length), id)
        .toEqual(counts);
      expect(IMPORTED_PART_PROVENANCE.find((entry) => entry.id === id)).toEqual({
        id,
        sourceKind: 'authored',
        sourceFiles: [
          `assets/parts/hair/${slug}.east.svg`,
          `assets/parts/hair/${slug}.north.svg`,
          `assets/parts/hair/${slug}.south.svg`,
        ],
      });

      for (const facing of FACINGS) {
        const shapes = part?.facings[facing]?.shapes ?? [];
        expect(shapes[0], `${id}/${facing}`).toMatchObject({ fill: '$hair' });
        expect(shapes[0]?.silhouette, `${id}/${facing}`).not.toBe(false);
      }
    }

    const bob = getPart('hair-bob')!;
    for (const facing of FACINGS) {
      expect(bob.facings[facing]?.shapes[1]).toMatchObject({
        stroke: '#00000024',
        strokeWidth: 1.6,
        silhouette: false,
      });
    }

    const sidePart = getPart('hair-side-part')!;
    for (const facing of FACINGS) {
      expect(sidePart.facings[facing]?.shapes.at(-1)).toMatchObject({
        stroke: '#00000024',
        strokeWidth: 1.6,
        silhouette: false,
      });
    }
  });

  it('renders the 4,320-cell hair matrix deterministically with bounded known top-frame debt', () => {
    let count = 0;
    const nondeterministic: string[] = [];
    const invalidGeometry: string[] = [];
    const unresolvedPaint: string[] = [];
    const outOfCanvasBounds: string[] = [];
    const nonTopOverflow: string[] = [];
    const overflowByPreset = new Map<string, number>();
    let maxTopOverflow = 0;

    for (const preset of DEFAULT_STYLE_PRESETS) {
      for (const [hair] of CANONICAL_HAIRS) {
        for (const body of BODY_ARCHETYPES) {
          for (const head of HUMAN_HEADS) {
            for (const facing of ALL_FACINGS) {
              const label = `${preset.id}/${hair}/${body.id}/${head}/${facing}`;
              const source = recipe(body.id, head, hair);
              const first = composeCharacter(source, preset.style, facing, 128, 'normal', { badge: false });
              const second = composeCharacter(source, preset.style, facing, 128, 'normal', { badge: false });
              if (first !== second) nondeterministic.push(label);
              if (/NaN|Infinity|undefined/.test(first)) invalidGeometry.push(label);
              if (/\$(?:skin|hair|outfitPrimary|outfitSecondary|accent)\b/.test(first)) {
                unresolvedPaint.push(label);
              }
              const bounds = new Resvg(first, { font: { loadSystemFonts: false } }).getBBox();
              if (
                !bounds ||
                bounds.x < -0.0001 ||
                bounds.y < -0.0001 ||
                bounds.x + bounds.width > 128.0001 ||
                bounds.y + bounds.height > 128.0001
              ) {
                outOfCanvasBounds.push(label);
                overflowByPreset.set(preset.id, (overflowByPreset.get(preset.id) ?? 0) + 1);
              }
              if (bounds) {
                maxTopOverflow = Math.max(maxTopOverflow, -bounds.y);
                if (
                  bounds.x < -0.0001 ||
                  bounds.x + bounds.width > 128.0001 ||
                  bounds.y + bounds.height > 128.0001
                ) {
                  nonTopOverflow.push(label);
                }
              }
              count++;
            }
          }
        }
      }
    }

    expect(count).toBe(4320);
    expect(nondeterministic).toEqual([]);
    expect(invalidGeometry).toEqual([]);
    expect(unresolvedPaint).toEqual([]);
    // The promoted heads sit higher in the static 128px frame. The fitted set
    // removes the old tall-hair extremes; keep the remaining preset-driven
    // top debt exact, top-only, and bounded.
    expect(outOfCanvasBounds).toHaveLength(467);
    expect(Object.fromEntries(overflowByPreset)).toEqual({
      'preset-high-contrast': 467,
    });
    expect(nonTopOverflow).toEqual([]);
    expect(maxTopOverflow).toBeLessThanOrEqual(10.321);
  });

  it('keeps every canonical family pair distinct at 32px while preserving the broad-family distance gate', () => {
    for (let leftIndex = 0; leftIndex < CANONICAL_HAIRS.length; leftIndex++) {
      for (let rightIndex = leftIndex + 1; rightIndex < CANONICAL_HAIRS.length; rightIndex++) {
        const leftId = CANONICAL_HAIRS[leftIndex][0];
        const rightId = CANONICAL_HAIRS[rightIndex][0];
        let changed = 0;
        for (const facing of FACINGS) {
          const left = hairMask(leftId, facing);
          const right = hairMask(rightId, facing);
          for (let pixel = 0; pixel < left.length; pixel++) {
            if (left[pixel] !== right[pixel]) changed++;
          }
        }
        // Close-cropped variants intentionally carry subtler differences than
        // the broad silhouette families, but must still differ visibly across
        // the three authored source facings.
        const minimum = BROAD_SILHOUETTE_HAIRS.has(leftId) && BROAD_SILHOUETTE_HAIRS.has(rightId)
          ? 64
          : 24;
        expect(changed, `${leftId}/${rightId}`).toBeGreaterThanOrEqual(minimum);
      }
    }
  });

  it('keeps Ponytail directional and Coils visibly separate from Curly at 32px', () => {
    const ponytailSouth = hairMask('hair-ponytail', 'south');
    const ponytailEast = hairMask('hair-ponytail', 'east');
    const coilsSouth = hairMask('hair-coils', 'south');
    const coilsEast = hairMask('hair-coils', 'east');
    const curlySouth = hairMask('hair-curly', 'south');
    let ponytailTurnPixels = 0;
    let coilsTurnPixels = 0;
    let coilsCurlyPixels = 0;

    for (let pixel = 0; pixel < ponytailSouth.length; pixel++) {
      if (ponytailSouth[pixel] !== ponytailEast[pixel]) ponytailTurnPixels++;
      if (coilsSouth[pixel] !== coilsEast[pixel]) coilsTurnPixels++;
      if (coilsSouth[pixel] !== curlySouth[pixel]) coilsCurlyPixels++;
    }

    expect(ponytailTurnPixels).toBeGreaterThanOrEqual(48);
    expect(coilsTurnPixels).toBeGreaterThanOrEqual(16);
    expect(coilsCurlyPixels).toBeGreaterThanOrEqual(20);
  });

  it('keeps the Long straight east profile distinct from its centered south curtain', () => {
    const south = hairMask('hair-long-straight', 'south');
    const east = hairMask('hair-long-straight', 'east');
    let changedPixels = 0;
    let eastRearPixels = 0;
    let eastFacingPixels = 0;

    for (let pixel = 0; pixel < south.length; pixel++) {
      if (south[pixel] !== east[pixel]) changedPixels++;
      if (!east[pixel]) continue;
      if (pixel % 32 < 16) eastRearPixels++;
      else eastFacingPixels++;
    }

    expect(changedPixels).toBeGreaterThanOrEqual(32);
    expect(eastRearPixels - eastFacingPixels).toBeGreaterThanOrEqual(12);
  });

  it('keeps the Long straight east profile face and eye visibly open on every production head', () => {
    for (const head of HUMAN_HEADS) {
      const source = recipe('body-balanced', head, 'hair-long-straight');
      const pixels = new Resvg(
        composeCharacter(source, DEFAULT_STYLE, 'east', 128, 'normal', { badge: false }),
        { font: { loadSystemFonts: false } },
      ).render().pixels;
      let skinPixels = 0;
      let eyePixels = 0;
      for (let y = 12; y < 70; y++) {
        for (let x = 35; x < 105; x++) {
          const offset = (y * 128 + x) * 4;
          if (
            pixels[offset] === 198 &&
            pixels[offset + 1] === 139 &&
            pixels[offset + 2] === 89 &&
            pixels[offset + 3] === 255
          ) skinPixels++;
          if (
            pixels[offset] === 44 &&
            pixels[offset + 1] === 44 &&
            pixels[offset + 2] === 42 &&
            pixels[offset + 3] === 255
          ) eyePixels++;
        }
      }
      expect(skinPixels, `${head} visible profile skin`).toBeGreaterThan(450);
      expect(eyePixels, `${head} visible profile eye`).toBeGreaterThanOrEqual(8);
    }
  });
});
