import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import { composeCharacter } from '../src/core/compositor';
import type { CharacterRecipe, Facing } from '../src/core/types';
import { FACINGS } from '../src/core/types';
import { DEFAULT_STYLE, DEFAULT_STYLE_PRESETS } from '../src/data/defaults';
import { BODY_ARCHETYPES } from '../src/parts/bodyArchetypes';
import { IMPORTED_PART_PROVENANCE } from '../src/parts/generated/importedPartArt';
import { getPart, partsForSlot } from '../src/parts/library';

const CANONICAL_HAIRS = [
  ['hair-short', 'short', [1, 2, 1]],
  ['hair-bob', 'bob', [2, 2, 2]],
  ['hair-long-straight', 'long-straight', [1, 1, 1]],
  ['hair-curly', 'curly', [6, 5, 4]],
  ['hair-ponytail', 'ponytail', [3, 4, 3]],
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
  return Uint8Array.from(
    { length: image.pixels.length / 4 },
    (_, index) => image.pixels[index * 4 + 3] >= 128 ? 1 : 0,
  );
}

describe('canonical production hair families', () => {
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
  });

  it('renders the 2,160-cell hair, body, head, facing, and style matrix deterministically without clipping', () => {
    let count = 0;
    const nondeterministic: string[] = [];
    const invalidGeometry: string[] = [];
    const unresolvedPaint: string[] = [];
    const outOfCanvasBounds: string[] = [];

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
              }
              count++;
            }
          }
        }
      }
    }

    expect(count).toBe(2160);
    expect(nondeterministic).toEqual([]);
    expect(invalidGeometry).toEqual([]);
    expect(unresolvedPaint).toEqual([]);
    expect(outOfCanvasBounds).toEqual([]);
  });

  it('keeps every canonical family pair distinct by at least 64 pixels across 32px source facings', () => {
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
        expect(changed, `${leftId}/${rightId}`).toBeGreaterThanOrEqual(64);
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
