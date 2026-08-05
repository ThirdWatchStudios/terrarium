import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';

import { composeProp } from '../src/core/compositor';
import { composeSceneSvg, type SceneState } from '../src/core/scene';
import { DEFAULT_PROPS, defaultProject } from '../src/data/defaults';
import { authoredPropArt, authoredPropSvg } from '../src/props/authoredArt';
import { QUOTA_CO_DOOR_SOURCE_DEFINITIONS } from '../src/props/doorManifest';
import { PROP_TEMPLATES } from '../src/props/templates';
import {
  compileQuotaCoDoorArt,
  emitQuotaCoDoorArt,
} from '../scripts/props/doorImporter';

const SOURCE_ROOT = path.resolve('assets/walls/quota-co-building-openings-v2');
const SOURCE_PREFIX = 'assets/walls/quota-co-building-openings-v2';

function raster(svg: string, width = 128): Buffer {
  return Buffer.from(
    new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng(),
  );
}

function alphaAt(svg: string, x: number, y: number): number {
  const png = PNG.sync.read(raster(svg));
  return png.data[(y * png.width + x) * 4 + 3];
}

function alphaBounds(svg: string): { minX: number; minY: number; maxX: number; maxY: number } {
  const png = PNG.sync.read(raster(svg));
  let minX = png.width;
  let minY = png.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      if (png.data[(y * png.width + x) * 4 + 3] === 0) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return { minX, minY, maxX, maxY };
}

describe('QuotaCo sliding auto-door production promotion', () => {
  it('keeps the generated registry current with all four canonical fixed-view sources', async () => {
    const imports = await compileQuotaCoDoorArt(SOURCE_ROOT, SOURCE_PREFIX);
    const expected = emitQuotaCoDoorArt(imports);
    const current = await readFile('src/props/generated/quotaCoDoorArt.ts', 'utf8');
    expect(current).toBe(expected);
    expect(imports).toHaveLength(1);
    expect(imports[0].sourceFiles).toEqual(
      QUOTA_CO_DOOR_SOURCE_DEFINITIONS.map(({ sourceFile }) => `${SOURCE_PREFIX}/${sourceFile}`),
    );
    expect(Object.keys(imports[0].variants)).toEqual(
      QUOTA_CO_DOOR_SOURCE_DEFINITIONS.map(({ key }) => key),
    );
  });

  it('registers the stable door template as four authored open and facing variants', () => {
    const template = PROP_TEMPLATES.find(({ id }) => id === 'door');
    expect(template).toMatchObject({
      label: 'Sliding auto-door',
      projection: 'plan',
      placement: 'wall-slot',
      gridFootprint: { w: 1, h: 1 },
    });
    expect(template?.params.map(({ key }) => key)).toEqual(['open', 'facing']);
    expect(authoredPropArt('door')).toMatchObject({
      id: 'door',
      projection: 'plan',
      sourceFile: SOURCE_PREFIX,
    });
    for (const { key, open, facing } of QUOTA_CO_DOOR_SOURCE_DEFINITIONS) {
      expect(authoredPropSvg('door', { open, facing }), key).toContain('data-prop-id="door"');
      expect(template?.build({ open, facing }, authoredPropArt('door')!.paletteDefaults).length, key)
        .toBeGreaterThan(0);
    }
  });

  it('renders every default production instance source-exact at authoring and gameplay scales', async () => {
    const project = defaultProject();
    for (const definition of QUOTA_CO_DOOR_SOURCE_DEFINITIONS) {
      const id = definition.facing === 0
        ? definition.open === 0 ? 'prop-door' : 'prop-open-door'
        : definition.open === 0 ? 'prop-door-vertical' : 'prop-open-door-vertical';
      const prop = DEFAULT_PROPS.find((candidate) => candidate.id === id);
      expect(prop, id).toBeDefined();
      expect(prop?.params, id).toEqual({ open: definition.open, facing: definition.facing });
      const source = await readFile(path.join(SOURCE_ROOT, definition.sourceFile), 'utf8');
      for (const size of [128, 90, 40]) {
        expect(raster(composeProp(prop!, project.style, size), size).equals(raster(source, size)), `${id}@${size}`)
          .toBe(true);
      }
    }
  });

  it('keeps both open passages transparent and keeps vertical art separately authored', () => {
    const horizontalOpen = authoredPropSvg('door', { open: 1, facing: 0 })!;
    const verticalOpen = authoredPropSvg('door', { open: 1, facing: 1 })!;
    expect(alphaAt(horizontalOpen, 64, 80)).toBe(0);
    expect(alphaAt(verticalOpen, 63, 64)).toBe(0);
    expect(verticalOpen).toContain('vertical-door-top-oblique-open-leaves');
    expect(horizontalOpen).not.toContain('vertical-door-top-oblique-open-leaves');
  });

  it('pre-compensates every door source into the centered live wall slot', () => {
    for (const { key, open, facing } of QUOTA_CO_DOOR_SOURCE_DEFINITIONS) {
      const source = authoredPropSvg('door', { open, facing })!;
      expect(source, key).toContain('data-runtime-grid-scale="0.5"');
      expect(source, key).toContain('transform="translate(32 32) scale(.5)"');
      const bounds = alphaBounds(source);
      expect(bounds.minY, key).toBeGreaterThanOrEqual(31);
      expect(bounds.maxY, key).toBeLessThanOrEqual(97);
      expect(bounds.minX, key).toBeGreaterThanOrEqual(31);
      expect(bounds.maxX, key).toBeLessThanOrEqual(97);
    }
  });

  it('selects the vertical source for a rotated wall placement without rotating horizontal pixels', () => {
    const project = defaultProject();
    const scene: SceneState = {
      cols: 1,
      rows: 1,
      floorIds: [[null]],
      wallIds: [[null]],
      entities: [{
        id: 'vertical-door-placement',
        kind: 'prop',
        x: 0,
        y: 0,
        refId: 'prop-door',
        facing: 'south',
        mood: 'normal',
        rotation: 90,
      }],
      source: 'hand-authored',
    };
    const rendered = composeSceneSvg(scene, project, 128);
    expect(rendered).toContain('vertical-door-top-oblique-closed-leaves');
    expect(rendered).not.toContain('rotate(90 64 64)');
  });
});
