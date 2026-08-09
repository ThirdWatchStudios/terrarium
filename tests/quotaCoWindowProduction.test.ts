import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';

import { composeProp, propLayers } from '../src/core/compositor';
import {
  projectWithWindowWallPalettes,
  propLayerManifest,
} from '../src/core/exporter';
import { facilityCatalogJson } from '../src/core/layout';
import { composeSceneSvg, type SceneState } from '../src/core/scene';
import {
  DEFAULT_PROPS,
  QUOTA_CO_WINDOW_DEFAULT_PROPS,
  defaultProject,
} from '../src/data/defaults';
import { authoredPropArt, authoredPropSvg } from '../src/props/authoredArt';
import { PROP_TEMPLATES } from '../src/props/templates';
import {
  QUOTA_CO_WINDOW_MATERIALS,
  QUOTA_CO_WINDOW_SOURCE_DEFINITIONS,
} from '../src/props/windowManifest';
import {
  compileQuotaCoWindowArt,
  emitQuotaCoWindowArt,
} from '../scripts/props/windowImporter';
import { faceOwnedQuietWallWindowSvg } from '../scripts/quietWallWindowRuntimeFitPreview';

const SOURCE_ROOT = path.resolve('assets/walls/quota-co-building-openings-v2');
const SOURCE_PREFIX = 'assets/walls/quota-co-building-openings-v2';

function raster(svg: string, width = 128): Buffer {
  return Buffer.from(
    new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng(),
  );
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

function normalizedVisibleElements(svg: string, runtimeWrapped = false): string {
  let body: string;
  if (runtimeWrapped) {
    const transform = 'transform="translate(32 32) scale(.5)"';
    const transformAt = svg.indexOf(transform);
    const bodyStart = svg.indexOf('>', transformAt) + 1;
    body = svg.slice(bodyStart, svg.lastIndexOf('</g>'));
  } else {
    body = svg.slice(svg.indexOf('>') + 1, svg.lastIndexOf('</svg>'));
  }
  return body
    .replace(/\sid="[^"]*"/g, '')
    .replace(/>\s+</g, '><')
    .trim();
}

describe('QuotaCo office-window production promotion', () => {
  it('keeps the generated registry current with all ten material and fixed-view sources', async () => {
    const imports = await compileQuotaCoWindowArt(SOURCE_ROOT, SOURCE_PREFIX);
    const expected = emitQuotaCoWindowArt(imports);
    const current = await readFile('src/props/generated/quotaCoWindowArt.ts', 'utf8');
    expect(current).toBe(expected);
    expect(imports).toHaveLength(1);
    expect(imports[0].sourceFiles).toEqual(
      QUOTA_CO_WINDOW_SOURCE_DEFINITIONS.map(({ sourceFile }) => `${SOURCE_PREFIX}/${sourceFile}`),
    );
    expect(Object.keys(imports[0].variants)).toEqual(
      QUOTA_CO_WINDOW_SOURCE_DEFINITIONS.map(({ key }) => key),
    );
  });

  it('registers one stable Window item over ten internal render SKUs', () => {
    const template = PROP_TEMPLATES.find(({ id }) => id === 'window');
    expect(template).toMatchObject({
      label: 'Office window',
      projection: 'plan',
      placement: 'wall-slot',
      gridFootprint: { w: 1, h: 1 },
    });
    expect(template?.params.map(({ key }) => key)).toEqual(['facing', 'material']);
    expect(authoredPropArt('window')).toMatchObject({
      id: 'window',
      projection: 'plan',
      sourceFile: SOURCE_PREFIX,
    });
    expect(QUOTA_CO_WINDOW_DEFAULT_PROPS).toHaveLength(10);
    expect(new Set(QUOTA_CO_WINDOW_DEFAULT_PROPS.map(({ id }) => id)).size).toBe(10);
    expect(facilityCatalogJson().facilities.filter(({ propId }) => propId === 'window')).toEqual([
      expect.objectContaining({ id: 'window', displayName: 'Office window' }),
    ]);
    for (const { key, facing, material } of QUOTA_CO_WINDOW_SOURCE_DEFINITIONS) {
      expect(authoredPropSvg('window', { facing, material }), key).toContain('data-prop-id="window"');
      expect(template?.build({ facing, material }, authoredPropArt('window')!.paletteDefaults).length, key)
        .toBeGreaterThan(0);
    }
  });

  it('renders every default instance source-exact at authoring and gameplay scales', async () => {
    const project = defaultProject();
    for (const definition of QUOTA_CO_WINDOW_SOURCE_DEFINITIONS) {
      const prop = DEFAULT_PROPS.find((candidate) => candidate.id === definition.propId);
      expect(prop, definition.propId).toBeDefined();
      expect(prop?.params, definition.propId).toEqual({
        facing: definition.facing,
        material: definition.material,
      });
      const source = await readFile(path.join(SOURCE_ROOT, definition.sourceFile), 'utf8');
      expect(composeProp(prop!, project.style, 128), `${definition.propId}@128 source`).toBe(source);
      expect(
        raster(composeProp(prop!, project.style, 40), 40).equals(raster(source, 40)),
        `${definition.propId}@40 gameplay`,
      ).toBe(true);
    }
  });

  it('inherits five wall baselines without changing shared window equipment', () => {
    for (const material of QUOTA_CO_WINDOW_MATERIALS) {
      const source = authoredPropSvg('window', { facing: 0, material: material.material })!;
      expect(source).toContain(`data-wall-material-id="${material.wallIds[1]}"`);
      expect(source).toContain(material.palette.primary);
      expect(source).toContain(material.palette.secondary);
      expect(source).toContain(material.palette.accent);
      expect(source).toContain('#323431');
      expect(source).toContain('#83A9A6');
      expect(source).toContain('#C3C0B6');
    }
  });

  it('inherits each exported wall palette without recoloring frame, glass, or blinds', () => {
    const project = defaultProject();
    const targetPalettes = [
      { primary: '#102030', secondary: '#405060', accent: '#708090' },
      { primary: '#213141', secondary: '#516171', accent: '#8191A1' },
      { primary: '#324252', secondary: '#627282', accent: '#92A2B2' },
      { primary: '#435363', secondary: '#738393', accent: '#A3B3C3' },
      { primary: '#546474', secondary: '#8494A4', accent: '#B4C4D4' },
    ] as const;
    for (const material of QUOTA_CO_WINDOW_MATERIALS) {
      const wall = project.walls.find((candidate) =>
        material.wallIds.includes(candidate.id) || material.wallIds.includes(candidate.templateId));
      expect(wall, material.id).toBeDefined();
      wall!.palette = { ...targetPalettes[material.material] };
    }

    const aligned = projectWithWindowWallPalettes(project);
    for (const definition of QUOTA_CO_WINDOW_SOURCE_DEFINITIONS) {
      const prop = aligned.props.find(({ id }) => id === definition.propId);
      const target = targetPalettes[definition.material];
      expect(prop?.palette, definition.key).toEqual(target);
      const rendered = composeProp(prop!, aligned.style, 128);
      expect(rendered, `${definition.key} primary`).toContain(`fill="${target.primary}"`);
      expect(rendered, `${definition.key} secondary`).toContain(`fill="${target.secondary}"`);
      expect(rendered, `${definition.key} accent`).toContain(`fill="${target.accent}"`);
      expect(rendered, `${definition.key} shared frame`).toContain('#323431');
      expect(rendered, `${definition.key} shared glass`).toContain('#83A9A6');
      expect(rendered, `${definition.key} shared blinds`).toContain('#C3C0B6');
      const layerMarkup = propLayers(prop!, aligned.style).map(({ markup }) => markup).join('');
      expect(layerMarkup, `${definition.key} layer primary`).toContain(target.primary);
      expect(layerMarkup, `${definition.key} layer secondary`).toContain(target.secondary);
      expect(layerMarkup, `${definition.key} layer accent`).toContain(target.accent);
      expect(propLayerManifest(prop!, aligned.style, 1).palette, `${definition.key} metadata`)
        .toEqual(target);
    }
  });

  it('promotes the approved face-owned geometry exactly', () => {
    const reviewMaterialId = {
      office: 'office-wall',
      brick: 'brick-wall',
      panel: 'panel-wall',
      cubicle: 'cubicle-partition',
      slat: 'slat-wall',
    } as const;
    for (const definition of QUOTA_CO_WINDOW_SOURCE_DEFINITIONS) {
      const source = authoredPropSvg('window', {
        facing: definition.facing,
        material: definition.material,
      })!;
      const material = QUOTA_CO_WINDOW_MATERIALS.find(({ id }) => id === definition.materialId)!;
      const approved = faceOwnedQuietWallWindowSvg(
        reviewMaterialId[definition.materialId],
        definition.axis,
        material.palette,
      );
      expect(normalizedVisibleElements(source, true), definition.key)
        .toBe(normalizedVisibleElements(approved));
    }
  });

  it('pre-compensates every source into the centered live wall slot without floor pixels', () => {
    for (const { key, facing, material } of QUOTA_CO_WINDOW_SOURCE_DEFINITIONS) {
      const source = authoredPropSvg('window', { facing, material })!;
      expect(source, key).toContain('data-runtime-grid-scale="0.5"');
      expect(source, key).toContain('transform="translate(32 32) scale(.5)"');
      expect(source, key).not.toContain('floor');
      const bounds = alphaBounds(source);
      expect(bounds.minY, key).toBeGreaterThanOrEqual(31);
      expect(bounds.maxY, key).toBeLessThanOrEqual(97);
      expect(bounds.minX, key).toBeGreaterThanOrEqual(31);
      expect(bounds.maxX, key).toBeLessThanOrEqual(97);
    }
  });

  it('promotes the corrected vertical blind as a complete lengthwise side band', () => {
    const vertical = authoredPropSvg('window', { facing: 1, material: 0 })!;
    expect(vertical).toContain('d="M68 20H78V108H68Z"');
    expect(vertical).toContain('d="M71 21V107M74 21V107M77 21V107"');
    expect(vertical).not.toContain('d="M50 20H78V44H50Z"');
  });

  it('selects the vertical source for a rotated wall placement without rotating pixels', () => {
    const project = defaultProject();
    const scene: SceneState = {
      cols: 1,
      rows: 1,
      floorIds: [[null]],
      wallIds: [[null]],
      entities: [{
        id: 'vertical-window-placement',
        kind: 'prop',
        x: 0,
        y: 0,
        refId: 'prop-window',
        facing: 'south',
        mood: 'normal',
        rotation: 90,
      }],
      source: 'hand-authored',
    };
    const rendered = composeSceneSvg(scene, project, 128);
    expect(rendered).toContain('vertical-window-office');
    expect(rendered).not.toContain('rotate(90 64 64)');
  });

  it('leaves neighbor-suite glass deferred and procedural', () => {
    expect(authoredPropArt('neighbor-glass')).toBeUndefined();
    expect(QUOTA_CO_WINDOW_SOURCE_DEFINITIONS.some(({ sourceFile }) => sourceFile.includes('neighbor')))
      .toBe(false);
  });
});
