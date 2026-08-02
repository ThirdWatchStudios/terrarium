import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import type { Facing, PartVariant } from '../src/core/types';
import { FACINGS } from '../src/core/types';
import { fittedHairVariant } from '../src/parts/hairFitting';
import { compilePartSvg } from '../scripts/parts/importer';
import {
  CANONICAL_SHORT_HEAD_IDS,
  canonicalShortTargetFrame,
  fitCanonicalShortVariant,
} from '../scripts/parts/canonicalShortFit';

const SOURCE_PATHS: Record<Facing, string> = {
  south: 'assets/parts/hair/short.south.svg',
  east: 'assets/parts/hair/short.east.svg',
  north: 'assets/parts/hair/short.north.svg',
};

function sourceVariant(facing: Facing): PartVariant {
  const source = SOURCE_PATHS[facing];
  return {
    z: 50,
    shapes: compilePartSvg(readFileSync(resolve(source), 'utf8'), {
      source,
      slot: 'hair',
      preserveLocalPaths: true,
    }),
  };
}

function renderedBounds(variant: PartVariant): NonNullable<ReturnType<Resvg['getBBox']>> {
  const shapes = variant.shapes.map((shape) => [
    `<path d="${shape.d}"`,
    `fill="${shape.fill ? '#34251C' : 'none'}"`,
    shape.stroke ? `stroke="${shape.stroke}"` : '',
    shape.strokeWidth ? `stroke-width="${shape.strokeWidth}"` : '',
    '/>',
  ].filter(Boolean).join(' ')).join('');
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">',
    `<g transform="translate(64 44)">${shapes}</g>`,
    '</svg>',
  ].join('');
  const bounds = new Resvg(svg, { font: { loadSystemFonts: false } }).getBBox();
  if (!bounds) throw new Error('Canonical Short proposal paints no pixels');
  return bounds;
}

describe('canonical Short source authority', () => {
  it('fits all six heads while retaining each authored facing shape-for-shape', () => {
    const expectedShapeCounts: Record<Facing, number> = { south: 1, east: 1, north: 1 };
    for (const facing of FACINGS) {
      const source = sourceVariant(facing);
      expect(source.shapes).toHaveLength(expectedShapeCounts[facing]);
      const variants = CANONICAL_SHORT_HEAD_IDS.map((headId) =>
        fitCanonicalShortVariant(source, headId, facing));

      expect(new Set(variants.map((variant) => JSON.stringify(variant.shapes))).size)
        .toBe(CANONICAL_SHORT_HEAD_IDS.length);
      for (const variant of variants) {
        expect(variant.z).toBe(source.z);
        expect(variant.shapes).toHaveLength(source.shapes.length);
        expect(variant.shapes.every(({ fill }) => fill === '$hair')).toBe(true);
      }
    }
  });

  it('makes an SVG path edit flow through every derived head for that facing', () => {
    for (const facing of FACINGS) {
      const source = sourceVariant(facing);
      const edited: PartVariant = {
        ...source,
        shapes: source.shapes.map((shape, index) => index === 0
          ? {
            ...shape,
            d: shape.d.replace(
              /M\s*(-?\d+(?:\.\d+)?)/,
              (_match, coordinate: string) => `M ${Number(coordinate) + 1}`,
            ),
          }
          : { ...shape }),
      };
      expect(edited.shapes[0].d).not.toBe(source.shapes[0].d);

      for (const headId of CANONICAL_SHORT_HEAD_IDS) {
        const before = fitCanonicalShortVariant(source, headId, facing);
        const after = fitCanonicalShortVariant(edited, headId, facing);
        expect(after.shapes[0].d, `${headId}/${facing}`).not.toBe(before.shapes[0].d);
      }
    }
  });

  it('keeps every derived facing inside the 128 canvas', () => {
    for (const headId of CANONICAL_SHORT_HEAD_IDS) {
      for (const facing of FACINGS) {
        const bounds = renderedBounds(fitCanonicalShortVariant(sourceVariant(facing), headId, facing));
        expect(bounds.x, `${headId}/${facing} left`).toBeGreaterThanOrEqual(0);
        expect(bounds.y, `${headId}/${facing} top`).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width, `${headId}/${facing} right`).toBeLessThanOrEqual(128);
        expect(bounds.y + bounds.height, `${headId}/${facing} bottom`).toBeLessThanOrEqual(128);
      }
    }
  });

  it('records fit differences as declarative target frames', () => {
    expect(canonicalShortTargetFrame('head-round', 'south')).toEqual({
      x: { low: -22, center: 0, high: 22 },
      y: { low: -20, center: -3, high: 7 },
    });
    expect(canonicalShortTargetFrame('head-oval', 'east')).toEqual({
      x: { low: -27, center: -2, high: 17 },
      y: { low: -21, center: -1, high: 6 },
    });
  });

  it('routes the production resolver through the approved SVG-derived variants', () => {
    for (const headId of CANONICAL_SHORT_HEAD_IDS) {
      for (const facing of FACINGS) {
        expect(fittedHairVariant('hair-short', headId, facing))
          .toEqual(fitCanonicalShortVariant(sourceVariant(facing), headId, facing));
      }
    }
  });
});
