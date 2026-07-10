import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';

import { composeCharacter, composePortrait } from '../src/core/compositor';
import type { CharacterRecipe, Facing } from '../src/core/types';
import { FACINGS } from '../src/core/types';
import { DEFAULT_STYLE, DEFAULT_STYLE_PRESETS } from '../src/data/defaults';
import { BODY_ARCHETYPES } from '../src/parts/bodyArchetypes';
import { IMPORTED_PART_PROVENANCE } from '../src/parts/generated/importedPartArt';
import { getPart, partsForSlot } from '../src/parts/library';

const HUMAN_HEADS = [
  ['head-round', 'round'],
  ['head-oval', 'oval'],
  ['head-boxy', 'boxy'],
  ['head-long', 'long'],
  ['head-angular', 'angular'],
  ['head-soft-square', 'soft-square'],
] as const;

const HEAD_ACCESSORY_SETS = [
  [],
  ['acc-glasses'],
  ['acc-headset'],
  ['acc-hard-hat'],
  ['acc-earbuds'],
] as const;

const ALL_FACINGS = [...FACINGS, 'west'] as const;
const SKIN_PALETTES = ['#FFE1BD', '#C68B59', '#6B3F27'] as const;

function recipe(
  head: string,
  hair: string,
  accessories: readonly string[] = [],
  body = 'body-balanced',
): CharacterRecipe {
  return {
    id: `head-family-${head}-${hair}`,
    name: 'Head silhouette QA',
    parts: {
      body,
      head,
      hair,
      outfit: 'outfit-tee',
      accessories: [...accessories],
    },
    palette: {
      skin: '#C68B59',
      hair: '#4A3325',
      outfitPrimary: '#2E4057',
      outfitSecondary: '#F5F2EA',
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

/** Rasterize a QA matrix once and report cells painting their outermost pixel. */
function clippedCells(cells: readonly RenderCell[], cellSize: number, cols: number): string[] {
  const gap = 2;
  const rows = Math.ceil(cells.length / cols);
  const width = cols * (cellSize + gap) + gap;
  const height = rows * (cellSize + gap) + gap;
  const body = cells.map((cell, index) => {
    const x = gap + (index % cols) * (cellSize + gap);
    const y = gap + Math.floor(index / cols) * (cellSize + gap);
    return `<g transform="translate(${x} ${y}) scale(${cellSize / 128})">${svgInner(cell.svg)}</g>`;
  }).join('');
  const png = PNG.sync.read(new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`,
  ).render().asPng());
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

function headMask(id: string, facing: Facing): Uint8Array {
  const silhouette = getPart(id)?.facings[facing]?.shapes.find((shape) => shape.silhouette !== false);
  if (!silhouette) throw new Error(`${id}/${facing} has no silhouette`);
  const image = new Resvg([
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="32 12 64 64" width="32" height="32">',
    `<path transform="translate(64 44)" d="${silhouette.d}" fill="#000000"/>`,
    '</svg>',
  ].join('')).render();
  return Uint8Array.from(
    { length: image.pixels.length / 4 },
    (_, index) => image.pixels[index * 4 + 3] >= 128 ? 1 : 0,
  );
}

interface PortraitCell extends RenderCell {
  size: number;
}

/** Batch all portrait viewports into one raster and report unexpectedly empty cells. */
function blankPortraitCells(cells: readonly PortraitCell[]): string[] {
  const cols = 12;
  const stride = 100;
  const gap = 2;
  const rows = Math.ceil(cells.length / cols);
  const width = cols * stride + gap;
  const height = rows * stride + gap;
  const nested = cells.map((cell, index) => {
    const x = gap + (index % cols) * stride;
    const y = gap + Math.floor(index / cols) * stride;
    return cell.svg.replace('<svg ', `<svg x="${x}" y="${y}" `);
  }).join('');
  const png = PNG.sync.read(new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${nested}</svg>`,
  ).render().asPng());
  const blank: string[] = [];

  cells.forEach((cell, index) => {
    const x0 = gap + (index % cols) * stride;
    const y0 = gap + Math.floor(index / cols) * stride;
    let painted = false;
    for (let y = y0; y < y0 + cell.size && !painted; y++) {
      for (let x = x0; x < x0 + cell.size; x++) {
        if (png.data[(y * png.width + x) * 4 + 3] > 0) {
          painted = true;
          break;
        }
      }
    }
    if (!painted) blank.push(cell.label);
  });
  return blank;
}

describe('production human head silhouettes', () => {
  it('keeps exact picker order, authored provenance, and facing paint semantics', () => {
    expect(partsForSlot('head').map(({ id }) => id)).toEqual([
      ...HUMAN_HEADS.map(([id]) => id),
      'head-fab',
    ]);

    for (const [id, slug] of HUMAN_HEADS) {
      const head = getPart(id);
      expect(head?.facings.south?.shapes, `${id}/south`).toHaveLength(3);
      expect(head?.facings.east?.shapes, `${id}/east`).toHaveLength(2);
      expect(head?.facings.north?.shapes, `${id}/north`).toHaveLength(1);

      for (const facing of FACINGS) {
        const shapes = head?.facings[facing]?.shapes ?? [];
        expect(shapes[0], `${id}/${facing} silhouette`).toMatchObject({ fill: '$skin' });
        expect(shapes[0]?.silhouette, `${id}/${facing} silhouette role`).not.toBe(false);
        for (const eye of shapes.slice(1)) {
          expect(eye, `${id}/${facing} eye`).toMatchObject({
            fill: '#2C2C2A',
            silhouette: false,
          });
        }
      }

      expect(IMPORTED_PART_PROVENANCE.find((entry) => entry.id === id)).toEqual({
        id,
        sourceKind: 'authored',
        sourceFiles: [
          `assets/parts/head/${slug}.east.svg`,
          `assets/parts/head/${slug}.north.svg`,
          `assets/parts/head/${slug}.south.svg`,
        ],
      });
    }
  });

  it('keeps all six silhouettes distinct in every authored facing', () => {
    for (const facing of FACINGS) {
      const silhouettes = HUMAN_HEADS.map(([id]) => {
        const shape = getPart(id)?.facings[facing]?.shapes.find(({ silhouette }) => silhouette !== false);
        expect(shape, `${id}/${facing} has no silhouette`).toBeTruthy();
        return shape!.d;
      });
      expect(new Set(silhouettes).size, `${facing} silhouettes collapsed`).toBe(HUMAN_HEADS.length);
    }
  });

  it('keeps even the closest silhouette pair materially distinct at 32px', () => {
    for (const facing of FACINGS) {
      const masks = new Map(HUMAN_HEADS.map(([id]) => [id, headMask(id, facing)]));
      let closest = { changed: Number.POSITIVE_INFINITY, pair: '' };
      for (let leftIndex = 0; leftIndex < HUMAN_HEADS.length; leftIndex++) {
        for (let rightIndex = leftIndex + 1; rightIndex < HUMAN_HEADS.length; rightIndex++) {
          const leftId = HUMAN_HEADS[leftIndex][0];
          const rightId = HUMAN_HEADS[rightIndex][0];
          const left = masks.get(leftId)!;
          const right = masks.get(rightId)!;
          let changed = 0;
          for (let pixel = 0; pixel < left.length; pixel++) {
            if (left[pixel] !== right[pixel]) changed++;
          }
          if (changed < closest.changed) closest = { changed, pair: `${leftId}/${rightId}` };
        }
      }
      expect(
        closest.changed,
        `${facing} closest pair ${closest.pair} collapses at 32px`,
      ).toBeGreaterThanOrEqual(12);
    }
  });

  it('keeps west as a compositor mirror of each authored east profile', () => {
    for (const [id] of HUMAN_HEADS) {
      const source = recipe(id, 'hair-none');
      const east = composeCharacter(source, DEFAULT_STYLE, 'east', 128, 'normal', { badge: false });
      const west = composeCharacter(source, DEFAULT_STYLE, 'west', 128, 'normal', { badge: false });
      const eastSilhouette = getPart(id)?.facings.east?.shapes[0].d;

      expect(eastSilhouette, `${id}/east silhouette`).toBeTruthy();
      expect(east, `${id}/east`).not.toContain('translate(128 0) scale(-1 1)');
      expect(east, `${id}/east source`).toContain(eastSilhouette);
      expect(west, `${id}/west mirror`).toContain('translate(128 0) scale(-1 1)');
      expect(west, `${id}/west source`).toContain(eastSilhouette);
    }
  });

  it('renders the complete 3,960-cell head, hair, head-accessory, facing, and style matrix deterministically', () => {
    const nondeterministic: string[] = [];
    const invalidGeometry: string[] = [];
    const unresolvedPaint: string[] = [];
    const highContrastCells: RenderCell[] = [];
    let count = 0;

    for (const preset of DEFAULT_STYLE_PRESETS) {
      for (const [head] of HUMAN_HEADS) {
        for (const hair of partsForSlot('hair')) {
          for (const accessories of HEAD_ACCESSORY_SETS) {
            for (const facing of ALL_FACINGS) {
              const label = [
                preset.id,
                head,
                hair.id,
                accessories.join('+') || 'none',
                facing,
              ].join('/');
              const source = recipe(head, hair.id, accessories);
              const first = composeCharacter(source, preset.style, facing, 128, 'normal', { badge: false });
              const second = composeCharacter(source, preset.style, facing, 128, 'normal', { badge: false });

              if (first !== second) nondeterministic.push(label);
              if (/NaN|undefined/.test(first)) invalidGeometry.push(label);
              if (
                /\$(?:skin|hair|outfitPrimary|outfitSecondary|accent)\b/.test(first) ||
                first.toUpperCase().includes('#FF00FF')
              ) {
                unresolvedPaint.push(label);
              }
              if (preset.id === 'preset-high-contrast') {
                highContrastCells.push({ label, svg: first });
              }
              count++;
            }
          }
        }
      }
    }

    expect(count).toBe(3960);
    expect(nondeterministic).toEqual([]);
    expect(invalidGeometry).toEqual([]);
    expect(unresolvedPaint).toEqual([]);

    expect(highContrastCells).toHaveLength(1320);
    const clipped = clippedCells(highContrastCells, 48, 20);
    expect(clipped).toHaveLength(90);
    for (const [head] of HUMAN_HEADS) {
      expect(clipped.filter((label) => label.includes(`/${head}/`)), head).toHaveLength(15);
    }
    expect(clipped.every((label) =>
      label.startsWith('preset-high-contrast/') &&
      (label.includes('/hair-bun/') || label.includes('/hair-ponytail/')),
    )).toBe(true);
  });

  it('renders all 594 head, hair, skin, and portrait-size cells', () => {
    const cellsByHead = new Map<string, PortraitCell[]>(HUMAN_HEADS.map(([id]) => [id, []]));
    const invalid: string[] = [];

    for (const [head] of HUMAN_HEADS) {
      for (const hair of partsForSlot('hair')) {
        for (const skin of SKIN_PALETTES) {
          for (const size of [32, 48, 96] as const) {
            const label = `${head}/${hair.id}/${skin}/${size}`;
            const source = recipe(head, hair.id);
            source.palette.skin = skin;
            const svg = composePortrait(source, DEFAULT_STYLE, size);
            if (
              !svg.includes('viewBox="24 2 80 80"') ||
              !svg.includes(`width="${size}" height="${size}"`) ||
              !svg.includes(skin) ||
              /NaN|undefined|#FF00FF/i.test(svg)
            ) {
              invalid.push(label);
            }
            cellsByHead.get(head)!.push({ label, size, svg });
          }
        }
      }
    }

    expect([...cellsByHead.values()].reduce((total, cells) => total + cells.length, 0)).toBe(594);
    expect(invalid).toEqual([]);
    for (const [head] of HUMAN_HEADS) {
      const headCells = cellsByHead.get(head)!;
      expect(headCells, head).toHaveLength(99);
      expect(blankPortraitCells(headCells), head).toEqual([]);
    }
  });

  it('keeps the 360-cell head and production-body anchor matrix deterministic and unclipped', () => {
    const cells: RenderCell[] = [];
    const nondeterministic: string[] = [];
    const invalid: string[] = [];

    for (const preset of DEFAULT_STYLE_PRESETS) {
      for (const [head] of HUMAN_HEADS) {
        for (const body of BODY_ARCHETYPES) {
          for (const facing of ALL_FACINGS) {
            const label = `${preset.id}/${head}/${body.id}/${facing}`;
            const source = recipe(head, 'hair-none', [], body.id);
            const first = composeCharacter(source, preset.style, facing, 128, 'normal', { badge: false });
            const second = composeCharacter(source, preset.style, facing, 128, 'normal', { badge: false });
            if (first !== second) nondeterministic.push(label);
            if (/NaN|undefined|#FF00FF/i.test(first)) invalid.push(label);
            cells.push({ label, svg: first });
          }
        }
      }
    }

    expect(cells).toHaveLength(360);
    expect(nondeterministic).toEqual([]);
    expect(invalid).toEqual([]);
    expect(clippedCells(cells, 64, 20)).toEqual([]);
  });
});
