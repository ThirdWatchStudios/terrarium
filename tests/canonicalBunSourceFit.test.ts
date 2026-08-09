import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import type { Facing, PartVariant } from '../src/core/types';
import { FACINGS } from '../src/core/types';
import { fittedHairVariant } from '../src/parts/hairFitting';
import { compilePartSvg } from '../scripts/parts/importer';
import {
  CANONICAL_BUN_HEAD_IDS,
  canonicalBunCapTargetFrame,
  canonicalBunKnotTargetFrame,
  fitCanonicalBunVariant,
} from '../scripts/parts/canonicalBunFit';

const SOURCE_PATHS: Record<Facing, string> = {
  south: 'assets/parts/hair/bun.south.svg',
  east: 'assets/parts/hair/bun.east.svg',
  north: 'assets/parts/hair/bun.north.svg',
};

function sourceVariant(facing: Facing): PartVariant {
  const source = SOURCE_PATHS[facing];
  return {
    z: 50,
    shapes: compilePartSvg(readFileSync(resolve(source), 'utf8'), {
      source,
      slot: 'hair',
    }),
  };
}

function renderedBounds(variant: PartVariant): NonNullable<ReturnType<Resvg['getBBox']>> {
  const shapes = variant.shapes
    .map(({ d, fill }) => `<path d="${d}" fill="${fill ? '#34251C' : 'none'}"/>`)
    .join('');
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">',
    `<g transform="translate(64 44)">${shapes}</g>`,
    '</svg>',
  ].join('');
  const bounds = new Resvg(svg, { font: { loadSystemFonts: false } }).getBBox();
  if (!bounds) throw new Error('Canonical Bun proposal paints no pixels');
  return bounds;
}

describe('canonical Bun source authority', () => {
  it('retains the authored cap and disconnected knot across all six heads', () => {
    for (const facing of FACINGS) {
      const source = sourceVariant(facing);
      expect(source.shapes).toHaveLength(2);
      const variants = CANONICAL_BUN_HEAD_IDS.map((headId) =>
        fitCanonicalBunVariant(source, headId, facing));
      expect(new Set(variants.map((variant) => JSON.stringify(variant.shapes))).size)
        .toBe(CANONICAL_BUN_HEAD_IDS.length);
      for (const variant of variants) {
        expect(variant.z).toBe(50);
        expect(variant.shapes).toHaveLength(2);
        expect(variant.shapes.every(({ fill }) => fill === '$hair')).toBe(true);
      }
    }
  });

  it('flows cap and knot SVG edits through every derived head', () => {
    for (const facing of FACINGS) {
      const source = sourceVariant(facing);
      for (const editedShapeIndex of [0, 1]) {
        const edited: PartVariant = {
          ...source,
          shapes: source.shapes.map((shape, index) => index === editedShapeIndex
            ? {
              ...shape,
              d: shape.d.replace(
                /M\s*(-?\d+(?:\.\d+)?)/,
                (_match, coordinate: string) => `M ${Number(coordinate) + 0.5}`,
              ),
            }
            : { ...shape }),
        };
        for (const headId of CANONICAL_BUN_HEAD_IDS) {
          const before = fitCanonicalBunVariant(source, headId, facing);
          const after = fitCanonicalBunVariant(edited, headId, facing);
          expect(after.shapes[editedShapeIndex].d, `${headId}/${facing}/${editedShapeIndex}`)
            .not.toBe(before.shapes[editedShapeIndex].d);
        }
      }
    }
  });

  it('keeps every derived cap and knot inside the 128 canvas', () => {
    for (const headId of CANONICAL_BUN_HEAD_IDS) {
      for (const facing of FACINGS) {
        const bounds = renderedBounds(fitCanonicalBunVariant(sourceVariant(facing), headId, facing));
        expect(bounds.x, `${headId}/${facing} left`).toBeGreaterThanOrEqual(0);
        expect(bounds.y, `${headId}/${facing} top`).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width, `${headId}/${facing} right`).toBeLessThanOrEqual(128);
        expect(bounds.y + bounds.height, `${headId}/${facing} bottom`).toBeLessThanOrEqual(128);
      }
    }
  });

  it('records cap and knot fitting as separate declarative frames', () => {
    expect(canonicalBunCapTargetFrame('head-oval', 'east')).toEqual({
      x: { low: -27, center: -2, high: 17 },
      y: { low: -21, center: -1, high: 7 },
    });
    expect(canonicalBunKnotTargetFrame('head-long', 'south')).toEqual({
      centerX: -9.1,
      centerY: -19,
      radiusX: 6,
      radiusY: 5.5,
    });
  });

  it('routes the production resolver through the approved SVG-derived variants', () => {
    for (const headId of CANONICAL_BUN_HEAD_IDS) {
      for (const facing of FACINGS) {
        expect(fittedHairVariant('hair-bun', headId, facing))
          .toEqual(fitCanonicalBunVariant(sourceVariant(facing), headId, facing));
      }
    }
  });
});
