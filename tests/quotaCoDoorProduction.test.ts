import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';

import { composeProp } from '../src/core/compositor';
import { propLayers } from '../src/core/compositor';
import { projectWithDoorWallPalettes, propLayerManifest } from '../src/core/exporter';
import { facilityCatalogJson } from '../src/core/layout';
import { composeSceneSvg, type SceneState } from '../src/core/scene';
import {
  DEFAULT_PROPS,
  QUOTA_CO_DOOR_DEFAULT_PROPS,
  defaultProject,
} from '../src/data/defaults';
import { authoredPropArt, authoredPropSvg } from '../src/props/authoredArt';
import {
  QUOTA_CO_DOOR_MATERIALS,
  QUOTA_CO_DOOR_SOURCE_DEFINITIONS,
} from '../src/props/doorManifest';
import { PROP_TEMPLATES } from '../src/props/templates';
import {
  compileQuotaCoDoorArt,
  emitQuotaCoDoorArt,
} from '../scripts/props/doorImporter';
import { fullCellQuietWallDoorSvg } from '../scripts/quietWallDoorFullCellOpeningPreview';

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

describe('QuotaCo sliding auto-door production promotion', () => {
  it('keeps the generated registry current with all twenty canonical material and fixed-view sources', async () => {
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

  it('registers one stable door template over twenty internal material and fixed-view variants', () => {
    const template = PROP_TEMPLATES.find(({ id }) => id === 'door');
    expect(template).toMatchObject({
      label: 'Sliding auto-door',
      projection: 'plan',
      placement: 'wall-slot',
      gridFootprint: { w: 1, h: 1 },
    });
    expect(template?.params.map(({ key }) => key)).toEqual(['open', 'facing', 'material']);
    expect(authoredPropArt('door')).toMatchObject({
      id: 'door',
      projection: 'plan',
      sourceFile: SOURCE_PREFIX,
    });
    expect(QUOTA_CO_DOOR_DEFAULT_PROPS).toHaveLength(20);
    expect(new Set(QUOTA_CO_DOOR_DEFAULT_PROPS.map(({ id }) => id)).size).toBe(20);
    expect(facilityCatalogJson().facilities.filter(({ propId }) => propId === 'door')).toEqual([
      expect.objectContaining({ id: 'door', displayName: 'Sliding auto-door' }),
    ]);
    for (const { key, open, facing, material } of QUOTA_CO_DOOR_SOURCE_DEFINITIONS) {
      expect(authoredPropSvg('door', { open, facing, material }), key).toContain('data-prop-id="door"');
      expect(template?.build({ open, facing, material }, authoredPropArt('door')!.paletteDefaults).length, key)
        .toBeGreaterThan(0);
    }
  });

  it('renders every default production instance source-exact at authoring and gameplay scales', async () => {
    const project = defaultProject();
    for (const definition of QUOTA_CO_DOOR_SOURCE_DEFINITIONS) {
      const id = definition.propId;
      const prop = DEFAULT_PROPS.find((candidate) => candidate.id === id);
      expect(prop, id).toBeDefined();
      expect(prop?.params, id).toEqual({
        open: definition.open,
        facing: definition.facing,
        material: definition.material,
      });
      const source = await readFile(path.join(SOURCE_ROOT, definition.sourceFile), 'utf8');
      expect(composeProp(prop!, project.style, 128), `${id}@128 source`).toBe(source);
      expect(
        raster(composeProp(prop!, project.style, 40), 40).equals(raster(source, 40)),
        `${id}@40 gameplay`,
      ).toBe(true);
    }
  });

  it('keeps both open passages transparent and keeps vertical art separately authored', () => {
    const horizontalOpen = authoredPropSvg('door', { open: 1, facing: 0, material: 0 })!;
    const verticalOpen = authoredPropSvg('door', { open: 1, facing: 1, material: 0 })!;
    expect(alphaAt(horizontalOpen, 64, 80)).toBe(0);
    expect(alphaAt(verticalOpen, 63, 64)).toBe(0);
    expect(verticalOpen).toContain('vertical-door-open-office');
    expect(horizontalOpen).not.toContain('vertical-door-open-office');
  });

  it('inherits the five retained wall palettes without changing the shared door equipment', () => {
    for (const material of QUOTA_CO_DOOR_MATERIALS) {
      const source = authoredPropSvg('door', { open: 0, facing: 0, material: material.material })!;
      expect(source).toContain(`data-wall-material-id="${material.wallIds[1]}"`);
      expect(source).toContain(material.palette.primary);
      expect(source).toContain(material.palette.secondary);
      expect(source).toContain(material.palette.accent);
      expect(source).toContain('#53615E');
      expect(source).toContain('#8CA4A1');
      expect(source).toContain('#B96D52');
    }
  });

  it('inherits each exported wall instance palette without recoloring shared door equipment', () => {
    const project = defaultProject();
    const targetPalettes = [
      { primary: '#102030', secondary: '#405060', accent: '#708090' },
      { primary: '#213141', secondary: '#516171', accent: '#8191A1' },
      { primary: '#324252', secondary: '#627282', accent: '#92A2B2' },
      { primary: '#435363', secondary: '#738393', accent: '#A3B3C3' },
      { primary: '#546474', secondary: '#8494A4', accent: '#B4C4D4' },
    ] as const;
    for (const material of QUOTA_CO_DOOR_MATERIALS) {
      const wall = project.walls.find((candidate) =>
        material.wallIds.includes(candidate.id) || material.wallIds.includes(candidate.templateId));
      expect(wall, material.id).toBeDefined();
      wall!.palette = { ...targetPalettes[material.material] };
    }

    const aligned = projectWithDoorWallPalettes(project);
    for (const definition of QUOTA_CO_DOOR_SOURCE_DEFINITIONS) {
      const prop = aligned.props.find(({ id }) => id === definition.propId);
      const target = targetPalettes[definition.material];
      expect(prop?.palette, definition.key).toEqual(target);
      const rendered = composeProp(prop!, aligned.style, 128);
      expect(rendered, `${definition.key} primary`).toContain(`fill="${target.primary}"`);
      expect(rendered, `${definition.key} secondary`).toContain(`fill="${target.secondary}"`);
      expect(rendered, `${definition.key} accent`).toContain(`fill="${target.accent}"`);
      expect(rendered, `${definition.key} shared leaf`).toContain(
        definition.state === 'open' ? '#6E7C78' : '#53615E',
      );
      expect(rendered, `${definition.key} shared glass`).toContain('#8CA4A1');
      expect(rendered, `${definition.key} shared status`).toContain('#B96D52');
      const layerMarkup = propLayers(prop!, aligned.style).map(({ markup }) => markup).join('');
      expect(layerMarkup, `${definition.key} layer primary`).toContain(target.primary);
      expect(layerMarkup, `${definition.key} layer secondary`).toContain(target.secondary);
      expect(layerMarkup, `${definition.key} layer accent`).toContain(target.accent);
      expect(propLayerManifest(prop!, aligned.style, 1).palette, `${definition.key} metadata`)
        .toEqual(target);
    }
  });

  it('promotes the approved full-cell geometry exactly, adding only source ids and compensation', () => {
    const reviewMaterialId = {
      office: 'office-wall',
      brick: 'brick-wall',
      panel: 'panel-wall',
      cubicle: 'cubicle-partition',
      slat: 'slat-wall',
    } as const;
    for (const definition of QUOTA_CO_DOOR_SOURCE_DEFINITIONS) {
      const source = authoredPropSvg('door', {
        open: definition.open,
        facing: definition.facing,
        material: definition.material,
      })!;
      const material = QUOTA_CO_DOOR_MATERIALS.find(({ id }) => id === definition.materialId)!;
      const approved = fullCellQuietWallDoorSvg(
        reviewMaterialId[definition.materialId],
        definition.axis,
        definition.state,
        material.palette,
      );
      expect(normalizedVisibleElements(source, true), definition.key)
        .toBe(normalizedVisibleElements(approved));
    }
  });

  it('pre-compensates every door source into the centered live wall slot', () => {
    for (const { key, open, facing, material } of QUOTA_CO_DOOR_SOURCE_DEFINITIONS) {
      const source = authoredPropSvg('door', { open, facing, material })!;
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
    expect(rendered).toContain('vertical-door-closed-office');
    expect(rendered).not.toContain('rotate(90 64 64)');
  });
});
