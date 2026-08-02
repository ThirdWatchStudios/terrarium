import { readFileSync } from 'node:fs';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import { composeProp } from '../src/core/compositor';
import type { PropInstance, Projection } from '../src/core/types';
import { DEFAULT_PROPS, DEFAULT_STYLE } from '../src/data/defaults';
import { authoredPropArt } from '../src/props/authoredArt';
import { compileStaticPropSource } from '../scripts/props/importer';
import {
  CANONICAL_IRIS_HEIGHTS,
  CANONICAL_IRIS_SOURCE_FILES,
  canonicalIrisHardwareSvg,
  type CanonicalIrisHardwareId,
} from '../scripts/props/canonicalIrisHardwareFit';

function prop(id: CanonicalIrisHardwareId, params: Record<string, number> = {}): PropInstance {
  const source = DEFAULT_PROPS.find(({ templateId }) => templateId === id);
  if (!source) throw new Error(`Missing default ${id}`);
  return { ...structuredClone(source), params };
}

function pixels(svg: string): Buffer {
  return Buffer.from(new Resvg(svg, { font: { loadSystemFonts: false } }).render().pixels);
}

describe('canonical IRIS hardware source-fit proof', () => {
  it('keeps three independent, strict-import-compatible SVG proposals', () => {
    const expected = [
      ['iris-installation-unit', 'elevation', 33],
      ['iris-installation-unit-dormant', 'elevation', 33],
      ['iris-charging-dock', 'plan', 17],
    ] as const;
    for (const [id, projection, shapeCount] of expected) {
      const sourceFile = CANONICAL_IRIS_SOURCE_FILES[id];
      const instance = prop(id);
      const shapes = compileStaticPropSource(sourceFile, readFileSync(sourceFile, 'utf8'), {
        id,
        projection: projection as Projection,
        paletteDefaults: instance.palette,
      });
      expect(shapes, id).toHaveLength(shapeCount);
    }
  });

  it('matches every production installation height pixel-for-pixel', () => {
    for (const id of ['iris-installation-unit', 'iris-installation-unit-dormant'] as const) {
      for (const height of CANONICAL_IRIS_HEIGHTS) {
        const instance = prop(id, { height });
        const current = composeProp(instance, DEFAULT_STYLE, 128);
        const source = canonicalIrisHardwareSvg(id, { height }, instance.palette, 128);
        expect(pixels(source), `${id}/height=${height}`).toEqual(pixels(current));
      }
    }
  });

  it('matches the production dock pixel-for-pixel', () => {
    const instance = prop('iris-charging-dock');
    expect(pixels(canonicalIrisHardwareSvg(
      'iris-charging-dock',
      {},
      instance.palette,
      128,
    ))).toEqual(pixels(composeProp(instance, DEFAULT_STYLE, 128)));
  });

  it('remains review-only and leaves all live authored-prop receivers unregistered', () => {
    for (const id of Object.keys(CANONICAL_IRIS_SOURCE_FILES) as CanonicalIrisHardwareId[]) {
      expect(authoredPropArt(id), id).toBeUndefined();
    }
  });
});
