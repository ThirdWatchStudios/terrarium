import { PNG } from 'pngjs';
import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import { composeCharacter, composePortrait } from '../src/core/compositor';
import type { CharacterRecipe, Facing } from '../src/core/types';
import { FACINGS } from '../src/core/types';
import { DEFAULT_STYLE, DEFAULT_STYLE_PRESETS } from '../src/data/defaults';
import { IMPORTED_PART_PROVENANCE } from '../src/parts/generated/importedPartArt';
import { getPart, partsForSlot } from '../src/parts/library';

const HEAD_ACCESSORY_SETS = [
  [],
  ['acc-glasses'],
  ['acc-headset'],
  ['acc-hard-hat'],
  ['acc-earbuds'],
] as const;

const SKIN_PALETTES = ['#FFE1BD', '#C68B59', '#6B3F27'] as const;
const ALL_FACINGS = [...FACINGS, 'west'] as const;

function recipe(
  hair: string,
  accessories: readonly string[] = [],
  skin = '#C68B59',
  head = 'head-round',
): CharacterRecipe {
  return {
    id: `head-round-${hair}`,
    name: 'Head round QA',
    parts: {
      body: 'body-balanced',
      head,
      hair,
      outfit: 'outfit-tee',
      accessories: [...accessories],
    },
    palette: {
      skin,
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
  const grid = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;
  const png = PNG.sync.read(new Resvg(grid).render().asPng());
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

describe('production head-round art', () => {
  it('keeps skin silhouette and ink eyes in their stable facing semantics', () => {
    const head = getPart('head-round');
    expect(head?.facings.south?.shapes).toHaveLength(3);
    expect(head?.facings.east?.shapes).toHaveLength(2);
    expect(head?.facings.north?.shapes).toHaveLength(1);
    for (const facing of FACINGS) {
      const shapes = head?.facings[facing]?.shapes ?? [];
      expect(shapes[0]).toMatchObject({ fill: '$skin' });
      expect(shapes[0].silhouette).not.toBe(false);
      for (const eye of shapes.slice(1)) {
        expect(eye).toMatchObject({ fill: '#2C2C2A', silhouette: false });
      }
    }
    expect(IMPORTED_PART_PROVENANCE.find(({ id }) => id === 'head-round')).toEqual({
      id: 'head-round',
      sourceKind: 'authored',
      sourceFiles: [
        'assets/parts/head/round.east.svg',
        'assets/parts/head/round.north.svg',
        'assets/parts/head/round.south.svg',
      ],
    });
  });

  it('adds no clipping across the 660-cell hair, accessory, facing, and style matrix', () => {
    const cells: RenderCell[] = [];
    for (const preset of DEFAULT_STYLE_PRESETS) {
      for (const hair of partsForSlot('hair')) {
        for (const accessories of HEAD_ACCESSORY_SETS) {
          for (const facing of ALL_FACINGS) {
            const label = `${preset.id}/${hair.id}/${accessories.join('+') || 'none'}/${facing}`;
            const svg = composeCharacter(
              recipe(hair.id, accessories),
              preset.style,
              facing,
              128,
              'normal',
              { badge: false },
            );
            expect(svg, label).not.toMatch(/NaN|undefined/);
            cells.push({ label, svg });
          }
        }
      }
    }
    expect(cells).toHaveLength(660);
    const clipped = clippedCells(cells, 48, 20);
    expect(clipped).toHaveLength(15);
    expect(clipped.every((label) =>
      label.startsWith('preset-high-contrast/hair-bun/') ||
      label.startsWith('preset-high-contrast/hair-ponytail/'))).toBe(true);
  });

  it('keeps portraits valid at 32/48/96 px across hair and skin palettes', () => {
    let count = 0;
    for (const hair of partsForSlot('hair')) {
      for (const skin of SKIN_PALETTES) {
        for (const size of [32, 48, 96]) {
          const svg = composePortrait(recipe(hair.id, [], skin), DEFAULT_STYLE, size);
          expect(svg).toContain('viewBox="24 2 80 80"');
          expect(svg).toContain(`width="${size}" height="${size}"`);
          expect(svg).toContain(skin);
          expect(svg).not.toMatch(/NaN|undefined/);
          const png = new Resvg(svg).render();
          expect(png.width).toBe(size);
          expect(png.height).toBe(size);
          count++;
        }
      }
    }
    expect(count).toBe(99);
  });

  it('keeps west as the compositor mirror of the authored east profile', () => {
    const source = recipe('hair-none');
    const east = composeCharacter(source, DEFAULT_STYLE, 'east', 128, 'normal', { badge: false });
    const west = composeCharacter(source, DEFAULT_STYLE, 'west', 128, 'normal', { badge: false });
    expect(east).not.toContain('translate(128 0) scale(-1 1)');
    expect(west).toContain('translate(128 0) scale(-1 1)');
    expect(west).toContain(getPart('head-round')?.facings.east?.shapes[0].d);
  });
});
