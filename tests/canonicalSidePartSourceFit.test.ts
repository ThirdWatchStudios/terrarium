import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import type { Facing, PartVariant } from '../src/core/types';
import { FACINGS } from '../src/core/types';
import { fittedHairVariant } from '../src/parts/hairFitting';
import { compilePartSvg } from '../scripts/parts/importer';
import {
  CANONICAL_SIDE_PART_HEAD_IDS,
  canonicalSidePartCapTargetFrame,
  canonicalSidePartMassTargetFrame,
  fitCanonicalSidePartVariant,
} from '../scripts/parts/canonicalSidePartFit';

const SOURCE_PATHS: Record<Facing, string> = {
  south: 'assets/parts/hair/side-part.south.svg',
  east: 'assets/parts/hair/side-part.east.svg',
  north: 'assets/parts/hair/side-part.north.svg',
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
  const shapes = variant.shapes.map((shape) => {
    const fill = shape.fill ? '#34251C' : 'none';
    const stroke = shape.stroke ? '#2C2C2A' : 'none';
    return `<path d="${shape.d}" fill="${fill}" stroke="${stroke}" stroke-width="${shape.strokeWidth ?? 0}"/>`;
  }).join('');
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">',
    `<g transform="translate(64 44)">${shapes}</g>`,
    '</svg>',
  ].join('');
  const bounds = new Resvg(svg, { font: { loadSystemFonts: false } }).getBBox();
  if (!bounds) throw new Error('Canonical Side-part proposal paints no pixels');
  return bounds;
}

describe('canonical Side-part source authority', () => {
  it('derives every head from one editable SVG per facing with a source-owned crease', () => {
    const expectedShapeCounts: Record<Facing, number> = { south: 3, east: 3, north: 2 };
    for (const facing of FACINGS) {
      const source = sourceVariant(facing);
      expect(source.shapes).toHaveLength(expectedShapeCounts[facing]);
      const detail = source.shapes.at(-1)!;
      expect(detail.fill).toBeUndefined();
      expect(detail).toMatchObject({
        stroke: '#00000024',
        strokeWidth: 1.6,
        silhouette: false,
      });
      const variants = CANONICAL_SIDE_PART_HEAD_IDS.map((headId) =>
        fitCanonicalSidePartVariant(source, headId, facing));
      expect(new Set(variants.map((variant) => JSON.stringify(variant.shapes))).size)
        .toBe(CANONICAL_SIDE_PART_HEAD_IDS.length);
      for (const variant of variants) {
        expect(variant.z).toBe(50);
        expect(variant.shapes).toHaveLength(expectedShapeCounts[facing]);
        expect(variant.shapes.at(-1)?.silhouette).toBe(false);
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
        for (const headId of CANONICAL_SIDE_PART_HEAD_IDS) {
          const before = fitCanonicalSidePartVariant(source, headId, facing);
          const after = fitCanonicalSidePartVariant(edited, headId, facing);
          expect(after.shapes[editedIndex].d).not.toBe(before.shapes[editedIndex].d);
        }
      }
    }
  });

  it('keeps every derived cap, mass, and crease inside the 128 canvas', () => {
    for (const headId of CANONICAL_SIDE_PART_HEAD_IDS) {
      for (const facing of FACINGS) {
        const bounds = renderedBounds(fitCanonicalSidePartVariant(
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

  it('records cap and mass fitting as separate declarative frames', () => {
    expect(canonicalSidePartCapTargetFrame('head-oval', 'east')).toEqual({
      x: { low: -27, center: -1.7, high: 19 },
      y: { low: -21, center: -3, high: 10 },
    });
    expect(canonicalSidePartMassTargetFrame('head-long', 'south')).toEqual({
      centerX: 13,
      centerY: 5,
      radiusX: 5,
      radiusY: 10,
    });
  });

  it('routes the production resolver through the approved SVG-derived variants', () => {
    for (const headId of CANONICAL_SIDE_PART_HEAD_IDS) {
      for (const facing of FACINGS) {
        expect(fittedHairVariant('hair-side-part', headId, facing))
          .toEqual(fitCanonicalSidePartVariant(sourceVariant(facing), headId, facing));
      }
    }
  });
});
