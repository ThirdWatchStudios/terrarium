import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import type { Facing, PartVariant } from '../src/core/types';
import { FACINGS } from '../src/core/types';
import { fittedHairVariant } from '../src/parts/hairFitting';
import { compilePartSvg } from '../scripts/parts/importer';
import {
  CANONICAL_PIXIE_HEAD_IDS,
  canonicalPixieCapTargetFrame,
  canonicalPixieTuftTargetFrame,
  fitCanonicalPixieVariant,
} from '../scripts/parts/canonicalPixieFit';

const SOURCE_PATHS: Record<Facing, string> = {
  south: 'assets/parts/hair/pixie.south.svg',
  east: 'assets/parts/hair/pixie.east.svg',
  north: 'assets/parts/hair/pixie.north.svg',
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
  if (!bounds) throw new Error('Canonical Pixie proposal paints no pixels');
  return bounds;
}

describe('canonical Pixie source authority', () => {
  it('derives every head from one editable SVG per facing', () => {
    const expectedShapeCounts: Record<Facing, number> = { south: 3, east: 3, north: 2 };
    for (const facing of FACINGS) {
      const source = sourceVariant(facing);
      expect(source.shapes).toHaveLength(expectedShapeCounts[facing]);
      const variants = CANONICAL_PIXIE_HEAD_IDS.map((headId) =>
        fitCanonicalPixieVariant(source, headId, facing));
      expect(new Set(variants.map((variant) => JSON.stringify(variant.shapes))).size)
        .toBe(CANONICAL_PIXIE_HEAD_IDS.length);
      for (const variant of variants) {
        expect(variant.z).toBe(50);
        expect(variant.shapes).toHaveLength(expectedShapeCounts[facing]);
        expect(variant.shapes.every(({ fill }) => fill === '$hair')).toBe(true);
      }
    }
  });

  it('flows every source-path edit through every derived head', () => {
    for (const facing of FACINGS) {
      const source = sourceVariant(facing);
      for (let editedIndex = 0; editedIndex < source.shapes.length; editedIndex++) {
        const edited: PartVariant = {
          ...source,
          shapes: source.shapes.map((shape, index) => index === editedIndex
            ? {
              ...shape,
              d: shape.d.replace(
                /M\s*(-?\d+(?:\.\d+)?)/,
                (_match, coordinate: string) => `M ${Number(coordinate) + 0.5}`,
              ),
            }
            : { ...shape }),
        };
        for (const headId of CANONICAL_PIXIE_HEAD_IDS) {
          const before = fitCanonicalPixieVariant(source, headId, facing);
          const after = fitCanonicalPixieVariant(edited, headId, facing);
          expect(after.shapes[editedIndex].d).not.toBe(before.shapes[editedIndex].d);
        }
      }
    }
  });

  it('keeps every derived cap and tuft inside the 128 canvas', () => {
    for (const headId of CANONICAL_PIXIE_HEAD_IDS) {
      for (const facing of FACINGS) {
        const bounds = renderedBounds(fitCanonicalPixieVariant(
          sourceVariant(facing),
          headId,
          facing,
        ));
        expect(bounds.x, `${headId}/${facing} left`).toBeGreaterThanOrEqual(0);
        expect(bounds.y, `${headId}/${facing} top`).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width, `${headId}/${facing} right`).toBeLessThanOrEqual(128);
        expect(bounds.y + bounds.height, `${headId}/${facing} bottom`).toBeLessThanOrEqual(128);
      }
    }
  });

  it('records cap and tuft fitting as separate declarative frames', () => {
    expect(canonicalPixieCapTargetFrame('head-oval', 'east')).toEqual({
      x: { low: -27, center: -2, high: 18 },
      y: { low: -21, center: 0, high: 4 },
    });
    expect(canonicalPixieTuftTargetFrame('head-long', 'south')).toEqual({
      centerX: -17,
      centerY: 0,
      radiusX: 3,
      radiusY: 5,
    });
  });

  it('routes the production resolver through the approved SVG-derived variants', () => {
    for (const headId of CANONICAL_PIXIE_HEAD_IDS) {
      for (const facing of FACINGS) {
        expect(fittedHairVariant('hair-pixie', headId, facing))
          .toEqual(fitCanonicalPixieVariant(sourceVariant(facing), headId, facing));
      }
    }
  });
});
