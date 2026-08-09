import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import type { Facing, PartVariant } from '../src/core/types';
import { FACINGS } from '../src/core/types';
import { fittedHairVariant } from '../src/parts/hairFitting';
import { compilePartSvg } from '../scripts/parts/importer';
import {
  CANONICAL_PONYTAIL_HEAD_IDS,
  canonicalPonytailAttachmentTargetFrame,
  canonicalPonytailCapTargetFrame,
  fitCanonicalPonytailVariant,
} from '../scripts/parts/canonicalPonytailFit';

const SOURCE_PATHS: Record<Facing, string> = {
  south: 'assets/parts/hair/ponytail.south.svg',
  east: 'assets/parts/hair/ponytail.east.svg',
  north: 'assets/parts/hair/ponytail.north.svg',
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
  if (!bounds) throw new Error('Canonical Ponytail proposal paints no pixels');
  return bounds;
}

describe('canonical Ponytail source authority', () => {
  it('retains the authored cap, tie, and tail across all six heads', () => {
    for (const facing of FACINGS) {
      const source = sourceVariant(facing);
      expect(source.shapes).toHaveLength(3);
      const variants = CANONICAL_PONYTAIL_HEAD_IDS.map((headId) =>
        fitCanonicalPonytailVariant(source, headId, facing));
      expect(new Set(variants.map((variant) => JSON.stringify(variant.shapes))).size)
        .toBe(CANONICAL_PONYTAIL_HEAD_IDS.length);
      for (const variant of variants) {
        expect(variant.z).toBe(50);
        expect(variant.shapes).toHaveLength(3);
        expect(variant.shapes.every(({ fill }) => fill === '$hair')).toBe(true);
      }
    }
  });

  it('flows cap, tie, and tail SVG edits through every derived head', () => {
    for (const facing of FACINGS) {
      const source = sourceVariant(facing);
      for (const editedShapeIndex of [0, 1, 2]) {
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
        for (const headId of CANONICAL_PONYTAIL_HEAD_IDS) {
          const before = fitCanonicalPonytailVariant(source, headId, facing);
          const after = fitCanonicalPonytailVariant(edited, headId, facing);
          expect(after.shapes[editedShapeIndex].d, `${headId}/${facing}/${editedShapeIndex}`)
            .not.toBe(before.shapes[editedShapeIndex].d);
        }
      }
    }
  });

  it('keeps every derived tail inside the 128 canvas', () => {
    for (const headId of CANONICAL_PONYTAIL_HEAD_IDS) {
      for (const facing of FACINGS) {
        const bounds = renderedBounds(fitCanonicalPonytailVariant(sourceVariant(facing), headId, facing));
        expect(bounds.x, `${headId}/${facing} left`).toBeGreaterThanOrEqual(0);
        expect(bounds.y, `${headId}/${facing} top`).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width, `${headId}/${facing} right`).toBeLessThanOrEqual(128);
        expect(bounds.y + bounds.height, `${headId}/${facing} bottom`).toBeLessThanOrEqual(128);
      }
    }
  });

  it('records cap and shared attachment fitting as declarative frames', () => {
    expect(canonicalPonytailCapTargetFrame('head-oval', 'east')).toEqual({
      x: { low: -27, center: -2, high: 17 },
      y: { low: -21, center: -2, high: 9 },
    });
    expect(canonicalPonytailAttachmentTargetFrame('head-long', 'south')).toEqual({
      centerX: 14,
      centerY: -2,
      radiusX: 1,
      radiusY: 1,
    });
  });

  it('routes the production resolver through the approved SVG-derived variants', () => {
    for (const headId of CANONICAL_PONYTAIL_HEAD_IDS) {
      for (const facing of FACINGS) {
        expect(fittedHairVariant('hair-ponytail', headId, facing))
          .toEqual(fitCanonicalPonytailVariant(sourceVariant(facing), headId, facing));
      }
    }
  });
});
