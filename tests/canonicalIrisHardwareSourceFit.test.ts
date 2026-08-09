import { readFileSync, readdirSync } from 'node:fs';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import { composeProp } from '../src/core/compositor';
import { clinicalStyle, clinicalSurfaceColor } from '../src/core/look';
import type { PropInstance, Projection } from '../src/core/types';
import { DEFAULT_PROPS, DEFAULT_STYLE } from '../src/data/defaults';
import { authoredPropArt } from '../src/props/authoredArt';
import { compileStaticPropSource } from '../scripts/props/importer';
import {
  CANONICAL_IRIS_HEIGHTS,
  CANONICAL_IRIS_SOURCE_FILES,
  canonicalIrisHardwareSvg,
  fitCanonicalIrisHardwareSourceSvg,
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

function pixelDelta(left: Buffer, right: Buffer): {
  readonly paintedPixels: number;
  readonly maxChannelDelta: number;
} {
  let paintedPixels = 0;
  let maxChannelDelta = 0;
  for (let offset = 0; offset < left.length; offset += 4) {
    let changed = false;
    for (let channel = 0; channel < 4; channel += 1) {
      const delta = Math.abs(left[offset + channel] - right[offset + channel]);
      if (delta > 0) changed = true;
      maxChannelDelta = Math.max(maxChannelDelta, delta);
    }
    if (changed) paintedPixels += 1;
  }
  return { paintedPixels, maxChannelDelta };
}

describe('canonical IRIS hardware source authority', () => {
  it('keeps three independent, strict-import-compatible canonical SVGs', () => {
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

  it('preserves source parity through the clinical palette lens', () => {
    const style = clinicalStyle(DEFAULT_STYLE);
    for (const id of Object.keys(CANONICAL_IRIS_SOURCE_FILES) as CanonicalIrisHardwareId[]) {
      const heights = id === 'iris-charging-dock' ? [undefined] : [78, 90, 98];
      for (const height of heights) {
        const params = height === undefined ? {} : { height };
        const instance = prop(id, params);
        instance.palette = {
          primary: clinicalSurfaceColor(instance.palette.primary),
          secondary: clinicalSurfaceColor(instance.palette.secondary),
          accent: clinicalSurfaceColor(instance.palette.accent),
        };
        const source = canonicalIrisHardwareSvg(
          id,
          params,
          instance.palette,
          128,
        );
        const delta = pixelDelta(
          pixels(source),
          pixels(composeProp(instance, style, 128)),
        );
        if (id === 'iris-charging-dock') {
          // Arc normalization can move antialiasing by a few channel values;
          // keep that bounded without rewriting the visually approved source.
          expect(delta.paintedPixels, `${id}/clinical/painted-pixels`).toBeLessThanOrEqual(3);
          expect(delta.maxChannelDelta, `${id}/clinical/max-channel`).toBeLessThanOrEqual(4);
        } else {
          expect(delta, `${id}/clinical/${height}`).toEqual({
            paintedPixels: 0,
            maxChannelDelta: 0,
          });
        }
      }
    }
  });

  it('propagates a canonical source edit through every derived installation height', () => {
    const id = 'iris-installation-unit';
    const sourceFile = CANONICAL_IRIS_SOURCE_FILES[id];
    const source = readFileSync(sourceFile, 'utf8');
    const edited = source.replace(
      'M 80 64 H 101 L 108 57 H 113',
      'M 82 64 H 101 L 108 57 H 113',
    );
    expect(edited).not.toBe(source);
    for (const height of CANONICAL_IRIS_HEIGHTS) {
      const palette = prop(id, { height }).palette;
      const current = fitCanonicalIrisHardwareSourceSvg(
        source,
        id,
        { height },
        palette,
      );
      const changed = fitCanonicalIrisHardwareSourceSvg(
        edited,
        id,
        { height },
        palette,
      );
      expect(pixels(changed), `height=${height}`).not.toEqual(pixels(current));
    }
  });

  it('declares checked-in SVG authority without an ordinary source writer', () => {
    const root = 'assets/props/iris-hardware-v1';
    expect(
      readdirSync(root)
        .filter((file) => file.endsWith('.svg'))
        .sort(),
    ).toEqual([
      'iris-charging-dock.svg',
      'iris-installation-unit-dormant.svg',
      'iris-installation-unit.svg',
    ]);
    const manifest = JSON.parse(readFileSync(`${root}/manifest.json`, 'utf8'));
    expect(manifest).toMatchObject({
      authority: 'canonical-svg',
      sourcePolicy: {
        visualAuthority: 'checked-in-svg',
        compiledOutput: 'src/props/generated/irisHardwareArt.ts',
        ordinaryCommandsWriteSources: false,
      },
    });
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(
      Object.values(packageJson.scripts as Record<string, string>)
        .every((command) => !command.includes(root)),
    ).toBe(true);
    const templates = readFileSync('src/props/templates.ts', 'utf8');
    expect(templates).not.toContain('buildIrisUnit');
    expect(templates).not.toContain('IRIS_SPINE');
    expect(templates).toContain("authoredPropShapes('iris-installation-unit', params)");
    expect(templates).toContain("authoredPropShapes('iris-charging-dock', {})");
  });

  it('routes every live receiver through the canonical SVG production registry', () => {
    for (const id of Object.keys(CANONICAL_IRIS_SOURCE_FILES) as CanonicalIrisHardwareId[]) {
      expect(authoredPropArt(id), id).toMatchObject({
        id,
        sourceFile: CANONICAL_IRIS_SOURCE_FILES[id],
      });
    }
  });
});
