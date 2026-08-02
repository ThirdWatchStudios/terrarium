import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import type { Facing, PartVariant } from '../src/core/types';
import { FACINGS } from '../src/core/types';
import { fittedHairVariant } from '../src/parts/hairFitting';
import { compilePartSvg } from '../scripts/parts/importer';
import {
  CANONICAL_CURLY_HEAD_IDS,
  CANONICAL_CURLY_SOURCE_FRAMES,
  canonicalCurlyTargetFrames,
  fitCanonicalCurlyVariant,
} from '../scripts/parts/canonicalCurlyFit';

const SOURCE_PATHS: Record<Facing, string> = {
  south: 'assets/parts/hair/curly.south.svg',
  east: 'assets/parts/hair/curly.east.svg',
  north: 'assets/parts/hair/curly.north.svg',
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
  const shapes = variant.shapes
    .map(({ d, fill }) => `<path d="${d}" fill="${fill ? '#34251C' : 'none'}"/>`)
    .join('');
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">',
    `<g transform="translate(64 44)">${shapes}</g>`,
    '</svg>',
  ].join('');
  const bounds = new Resvg(svg, { font: { loadSystemFonts: false } }).getBBox();
  if (!bounds) throw new Error('Canonical Curly proposal paints no pixels');
  return bounds;
}

describe('canonical Curly source authority', () => {
  it('derives every head from one editable SVG per facing and one frame per lobe', () => {
    const expectedShapeCounts: Record<Facing, number> = { south: 5, east: 4, north: 5 };
    for (const facing of FACINGS) {
      const source = sourceVariant(facing);
      expect(source.shapes).toHaveLength(expectedShapeCounts[facing]);
      expect(CANONICAL_CURLY_SOURCE_FRAMES[facing]).toHaveLength(source.shapes.length);
      const variants = CANONICAL_CURLY_HEAD_IDS.map((headId) =>
        fitCanonicalCurlyVariant(source, headId, facing));
      expect(new Set(variants.map((variant) => JSON.stringify(variant.shapes))).size)
        .toBe(CANONICAL_CURLY_HEAD_IDS.length);
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
        for (const headId of CANONICAL_CURLY_HEAD_IDS) {
          const before = fitCanonicalCurlyVariant(source, headId, facing);
          const after = fitCanonicalCurlyVariant(edited, headId, facing);
          expect(after.shapes[editedIndex].d).not.toBe(before.shapes[editedIndex].d);
        }
      }
    }
  });

  it('keeps every derived lobe inside the 128 canvas', () => {
    for (const headId of CANONICAL_CURLY_HEAD_IDS) {
      for (const facing of FACINGS) {
        const bounds = renderedBounds(fitCanonicalCurlyVariant(
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

  it('records head-specific lobe centers and radii as declarative frames', () => {
    expect(canonicalCurlyTargetFrames('head-oval', 'east')).toEqual([
      { centerX: -24, centerY: 2, radiusX: 9, radiusY: 9 },
      { centerX: -19, centerY: -8, radiusX: 10, radiusY: 10 },
      { centerX: -8, centerY: -13, radiusX: 9, radiusY: 9 },
      { centerX: 12, centerY: -7, radiusX: 9, radiusY: 9 },
    ]);
    expect(canonicalCurlyTargetFrames('head-long', 'south')[2]).toEqual({
      centerX: 0,
      centerY: -15,
      radiusX: 7,
      radiusY: 7,
    });
  });

  it('routes the production resolver through the approved SVG-derived variants', () => {
    for (const headId of CANONICAL_CURLY_HEAD_IDS) {
      for (const facing of FACINGS) {
        expect(fittedHairVariant('hair-curly', headId, facing))
          .toEqual(fitCanonicalCurlyVariant(sourceVariant(facing), headId, facing));
      }
    }
  });
});
