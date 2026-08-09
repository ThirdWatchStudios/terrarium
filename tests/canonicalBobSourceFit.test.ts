import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import type { Facing, PartVariant } from '../src/core/types';
import { FACINGS } from '../src/core/types';
import { fittedHairVariant } from '../src/parts/hairFitting';
import { getPart } from '../src/parts/library';
import {
  CANONICAL_BOB_HEAD_IDS,
  canonicalBobTargetFrame,
  fitCanonicalBobVariant,
} from '../scripts/parts/canonicalBobFit';

function sourceVariant(facing: Facing): PartVariant {
  const variant = getPart('hair-bob')?.facings[facing];
  if (!variant) throw new Error(`Missing imported canonical Bob ${facing} source`);
  return variant;
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
  if (!bounds) throw new Error('Canonical Bob proposal paints no pixels');
  return bounds;
}

describe('canonical Bob source fitting proof', () => {
  it('fits the three imported SVG facings across all six heads without redrawing shapes', () => {
    for (const facing of FACINGS) {
      const source = sourceVariant(facing);
      expect(source.shapes).toHaveLength(2);
      const variants = CANONICAL_BOB_HEAD_IDS.map((headId) =>
        fitCanonicalBobVariant(source, headId, facing));

      expect(new Set(variants.map((variant) => JSON.stringify(variant.shapes))).size)
        .toBe(CANONICAL_BOB_HEAD_IDS.length);
      for (const variant of variants) {
        expect(variant.z).toBe(source.z);
        expect(variant.shapes).toHaveLength(source.shapes.length);
        expect(variant.shapes[0]).toMatchObject({ fill: '$hair' });
        expect(variant.shapes[1]).toMatchObject({
          stroke: '#00000024',
          strokeWidth: 1.6,
          silhouette: false,
        });
      }
    }
  });

  it('makes a canonical source edit flow through every derived head for that facing', () => {
    for (const facing of FACINGS) {
      const source = sourceVariant(facing);
      const edited: PartVariant = {
        ...source,
        shapes: source.shapes.map((shape, index) => index === 0
          ? { ...shape, d: shape.d.replace('-23', '-22') }
          : { ...shape }),
      };
      expect(edited.shapes[0].d).not.toBe(source.shapes[0].d);

      for (const headId of CANONICAL_BOB_HEAD_IDS) {
        const before = fitCanonicalBobVariant(source, headId, facing);
        const after = fitCanonicalBobVariant(edited, headId, facing);
        expect(after.shapes[0].d, `${headId}/${facing}`).not.toBe(before.shapes[0].d);
      }
    }
  });

  it('keeps every derived facing inside the 128 canvas with its source detail intact', () => {
    for (const headId of CANONICAL_BOB_HEAD_IDS) {
      for (const facing of FACINGS) {
        const bounds = renderedBounds(fitCanonicalBobVariant(sourceVariant(facing), headId, facing));
        expect(bounds.x, `${headId}/${facing} left`).toBeGreaterThanOrEqual(0);
        expect(bounds.y, `${headId}/${facing} top`).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width, `${headId}/${facing} right`).toBeLessThanOrEqual(128);
        expect(bounds.y + bounds.height, `${headId}/${facing} bottom`).toBeLessThanOrEqual(128);
      }
    }
  });

  it('keeps fit differences in declarative frames rather than per-head SVG variants', () => {
    expect(canonicalBobTargetFrame('head-round', 'south')).toEqual({
      x: { low: -24, center: 0, high: 24 },
      y: { low: -23, center: -4, high: 23 },
    });
    expect(canonicalBobTargetFrame('head-oval', 'east')).toEqual({
      x: { low: -29, center: -2, high: 18 },
      y: { low: -22, center: -4, high: 18 },
    });
  });

  it('routes the production resolver through the SVG-derived variants', () => {
    for (const headId of CANONICAL_BOB_HEAD_IDS) {
      for (const facing of FACINGS) {
        expect(fittedHairVariant('hair-bob', headId, facing))
          .toEqual(fitCanonicalBobVariant(sourceVariant(facing), headId, facing));
      }
    }
  });
});
