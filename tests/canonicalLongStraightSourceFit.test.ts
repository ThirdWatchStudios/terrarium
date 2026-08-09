import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import type { Facing, PartVariant } from '../src/core/types';
import { FACINGS } from '../src/core/types';
import { fittedHairVariant } from '../src/parts/hairFitting';
import { compilePartSvg } from '../scripts/parts/importer';
import {
  CANONICAL_LONG_STRAIGHT_HEAD_IDS,
  canonicalLongStraightTargetFrame,
  fitCanonicalLongStraightVariant,
} from '../scripts/parts/canonicalLongStraightFit';

const SOURCE_PATHS: Record<Facing, string> = {
  south: 'assets/parts/hair/long-straight.south.svg',
  east: 'assets/parts/hair/long-straight.east.svg',
  north: 'assets/parts/hair/long-straight.north.svg',
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
  if (!bounds) throw new Error('Canonical Long straight proposal paints no pixels');
  return bounds;
}

describe('canonical Long straight source authority', () => {
  it('derives every head from one editable SVG per facing', () => {
    const expectedShapeCounts: Record<Facing, number> = { south: 1, east: 2, north: 1 };
    for (const facing of FACINGS) {
      const source = sourceVariant(facing);
      expect(source.shapes).toHaveLength(expectedShapeCounts[facing]);
      const variants = CANONICAL_LONG_STRAIGHT_HEAD_IDS.map((headId) =>
        fitCanonicalLongStraightVariant(source, headId, facing));
      expect(new Set(variants.map((variant) => JSON.stringify(variant.shapes))).size)
        .toBe(CANONICAL_LONG_STRAIGHT_HEAD_IDS.length);
      for (const variant of variants) {
        expect(variant.z).toBe(50);
        expect(variant.shapes).toHaveLength(expectedShapeCounts[facing]);
        expect(variant.shapes.every(({ fill }) => fill === '$hair')).toBe(true);
      }
    }
  });

  it('flows a source-path edit through every derived head', () => {
    for (const facing of FACINGS) {
      const source = sourceVariant(facing);
      const edited: PartVariant = {
        ...source,
        shapes: source.shapes.map((shape) => ({
          ...shape,
          d: shape.d.replace(
            /M\s*(-?\d+(?:\.\d+)?)/,
            (_match, coordinate: string) => `M ${Number(coordinate) + 0.5}`,
          ),
        })),
      };
      for (const headId of CANONICAL_LONG_STRAIGHT_HEAD_IDS) {
        const before = fitCanonicalLongStraightVariant(source, headId, facing);
        const after = fitCanonicalLongStraightVariant(edited, headId, facing);
        for (let index = 0; index < source.shapes.length; index++) {
          expect(after.shapes[index].d).not.toBe(before.shapes[index].d);
        }
      }
    }
  });

  it('keeps every derived curtain inside the 128 canvas', () => {
    for (const headId of CANONICAL_LONG_STRAIGHT_HEAD_IDS) {
      for (const facing of FACINGS) {
        const bounds = renderedBounds(
          fitCanonicalLongStraightVariant(sourceVariant(facing), headId, facing),
        );
        expect(bounds.x, `${headId}/${facing} left`).toBeGreaterThanOrEqual(0);
        expect(bounds.y, `${headId}/${facing} top`).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width, `${headId}/${facing} right`).toBeLessThanOrEqual(128);
        expect(bounds.y + bounds.height, `${headId}/${facing} bottom`).toBeLessThanOrEqual(128);
      }
    }
  });

  it('records tall-hair fitting as declarative frames', () => {
    expect(canonicalLongStraightTargetFrame('head-oval', 'south')).toEqual({
      x: { low: -30, center: 0, high: 30 },
      y: { low: -22, center: -4, high: 30 },
    });
    expect(canonicalLongStraightTargetFrame('head-long', 'east')).toEqual({
      x: { low: -19, center: -2, high: 11 },
      y: { low: -24, center: -5, high: 30 },
    });
  });

  it('routes the production resolver through the approved SVG-derived variants', () => {
    for (const headId of CANONICAL_LONG_STRAIGHT_HEAD_IDS) {
      for (const facing of FACINGS) {
        expect(fittedHairVariant('hair-long-straight', headId, facing))
          .toEqual(fitCanonicalLongStraightVariant(sourceVariant(facing), headId, facing));
      }
    }
  });
});
