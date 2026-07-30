import { readFileSync } from 'node:fs';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import { composeProp, propLayers } from '../src/core/compositor';
import { facilityCatalogJson } from '../src/core/layout';
import type { PropPaletteToken } from '../src/core/types';
import { DEFAULT_PROPS, DEFAULT_STYLE } from '../src/data/defaults';
import {
  authoredPropArt,
  authoredPropShapes,
} from '../src/props/authoredArt';
import { PROP_TEMPLATES } from '../src/props/templates';
import {
  compileQuotaCoWorkhorseProps,
  emitQuotaCoWorkhorsePropArt,
  QUOTA_CO_EXTERIOR_WORKHORSE_PROP_IDS,
  QUOTA_CO_WORKHORSE_PROP_IDS,
} from '../scripts/props/importer';

const SOURCE_DIR = path.resolve('assets/props/quota-co-workhorse-v1');
const SOURCE_PREFIX = 'assets/props/quota-co-workhorse-v1';

const HELD_TEMPLATE_CONTRACTS = {
  printer: {
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 26, ry: 4 },
    params: ['width'],
  },
  'printer-jammed': {
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 26, ry: 4 },
    params: ['width'],
  },
  'coffee-machine': {
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 18, ry: 3.5 },
    params: ['height'],
  },
  'coffee-machine-broken': {
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 18, ry: 3.5 },
    params: ['height'],
  },
  'water-cooler': {
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 21, ry: 4 },
    params: ['height'],
  },
  'water-cooler-empty': {
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 21, ry: 4 },
    params: ['height'],
  },
  shredder: {
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 17, ry: 4 },
    params: ['height'],
  },
  microwave: {
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 22, ry: 4 },
    params: ['width'],
  },
  fridge: {
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 21, ry: 4.5 },
    params: ['height'],
  },
  'vending-machine': {
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 25, ry: 4.5 },
    params: ['height', 'stocked'],
  },
  desk: {
    projection: 'plan',
    gridFootprint: { w: 2, h: 1 },
    footprint: undefined,
    params: ['width', 'monitor'],
  },
  'office-chair': {
    projection: 'plan',
    gridFootprint: { w: 1, h: 1 },
    footprint: undefined,
    params: ['size'],
  },
  'filing-cabinet': {
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 19, ry: 4 },
    params: ['drawers'],
  },
  copier: {
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 24, ry: 4.5 },
    params: ['height'],
  },
  'office-plant': {
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 15, ry: 3.5 },
    params: ['bushiness'],
  },
  'standing-desk': {
    projection: 'plan',
    gridFootprint: { w: 2, h: 1 },
    footprint: undefined,
    params: ['width', 'dual'],
  },
  'cubicle-workstation': {
    projection: 'plan',
    gridFootprint: { w: 2, h: 2 },
    footprint: undefined,
    params: ['openness', 'clutter'],
  },
  'reception-desk': {
    projection: 'plan',
    gridFootprint: { w: 2, h: 2 },
    footprint: undefined,
    params: ['width'],
  },
  'conference-table': {
    projection: 'plan',
    gridFootprint: { w: 3, h: 2 },
    footprint: undefined,
    params: ['width', 'chairs'],
  },
  'supply-cabinet': {
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 22, ry: 4.5 },
    params: ['height'],
  },
  'desk-lamp': {
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 9, ry: 3 },
    params: ['size'],
  },
  'desk-clutter': {
    projection: 'plan',
    gridFootprint: { w: 1, h: 1 },
    footprint: undefined,
    params: ['papers', 'phone'],
  },
  couch: {
    projection: 'plan',
    gridFootprint: { w: 2, h: 1 },
    footprint: undefined,
    params: ['width', 'cushions'],
  },
  'waiting-bench': {
    projection: 'plan',
    gridFootprint: { w: 2, h: 1 },
    footprint: undefined,
    params: ['length', 'seats'],
  },
  'coffee-table': {
    projection: 'plan',
    gridFootprint: { w: 1, h: 1 },
    footprint: undefined,
    params: ['width', 'decor'],
  },
  'break-table': {
    projection: 'plan',
    gridFootprint: { w: 2, h: 2 },
    footprint: undefined,
    params: ['diameter', 'stools'],
  },
  'lounge-seating': {
    projection: 'plan',
    gridFootprint: { w: 2, h: 2 },
    footprint: undefined,
    params: ['seats'],
  },
  'bean-bag': {
    projection: 'plan',
    gridFootprint: { w: 1, h: 1 },
    footprint: undefined,
    params: ['size'],
  },
  'nap-pod': {
    projection: 'elevation',
    gridFootprint: { w: 2, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 34, ry: 5 },
    params: ['visor'],
  },
  bookshelf: {
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 24, ry: 4.5 },
    params: ['shelves', 'fill'],
  },
  lockers: {
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 27, ry: 4.5 },
    params: ['columns', 'height'],
  },
  'open-shelving': {
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 26, ry: 4.5 },
    params: ['shelves', 'fill'],
  },
  'pantry-shelf': {
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 25, ry: 4.5 },
    params: ['shelves'],
  },
  'mail-station': {
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 24, ry: 4.5 },
    params: ['height', 'columns'],
  },
  'server-rack': {
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 21, ry: 4.5 },
    params: ['height', 'units'],
  },
  'coat-rack': {
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 12, ry: 3.5 },
    params: ['hooks'],
  },
  'potted-tree': {
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 17, ry: 4 },
    params: ['height', 'fullness'],
  },
  'hanging-plant': {
    projection: 'plan',
    placement: 'wall-slot',
    gridFootprint: { w: 1, h: 1 },
    footprint: undefined,
    params: ['trail', 'fullness'],
  },
  'floor-lamp': {
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 12, ry: 3.5 },
    params: ['height'],
  },
  'framed-art': {
    projection: 'plan',
    placement: 'wall-slot',
    gridFootprint: { w: 1, h: 1 },
    footprint: undefined,
    params: ['width', 'scene'],
  },
  poster: {
    projection: 'plan',
    placement: 'wall-slot',
    gridFootprint: { w: 1, h: 1 },
    footprint: undefined,
    params: ['lines'],
  },
  'wall-clock': {
    projection: 'plan',
    placement: 'wall-slot',
    gridFootprint: { w: 1, h: 1 },
    footprint: undefined,
    params: ['time'],
  },
  'fish-tank': {
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 24, ry: 4.5 },
    params: ['fish'],
  },
  'string-lights': {
    projection: 'plan',
    placement: 'wall-slot',
    gridFootprint: { w: 1, h: 1 },
    footprint: undefined,
    params: ['bulbs'],
  },
  rug: {
    projection: 'plan',
    gridFootprint: { w: 2, h: 2 },
    footprint: undefined,
    params: ['width', 'pattern'],
  },
  car: {
    projection: 'plan',
    gridFootprint: { w: 4, h: 2 },
    footprint: undefined,
    params: ['trim'],
  },
  'lot-marking-crosswalk': {
    projection: 'plan',
    gridFootprint: { w: 2, h: 2 },
    footprint: undefined,
    params: [],
  },
  'lamp-post': {
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 13, ry: 3.5 },
    params: [],
  },
  'sign-lot': {
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 12, ry: 3.5 },
    params: ['variant'],
  },
  'bike-rack': {
    projection: 'plan',
    gridFootprint: { w: 2, h: 1 },
    footprint: undefined,
    params: [],
  },
  'park-bench': {
    projection: 'elevation',
    gridFootprint: { w: 2, h: 1 },
    footprint: { cx: 64, cy: 117, rx: 44, ry: 5 },
    params: [],
  },
  'picnic-table': {
    projection: 'plan',
    gridFootprint: { w: 3, h: 2 },
    footprint: undefined,
    params: [],
  },
  'tree-canopy': {
    projection: 'elevation',
    gridFootprint: { w: 3, h: 3 },
    footprint: { cx: 64, cy: 117, rx: 42, ry: 6 },
    params: ['habit', 'lobes', 'seed'],
  },
} as const;

const OUTDOOR_AUTHORED_PROP_IDS = new Set(
  QUOTA_CO_EXTERIOR_WORKHORSE_PROP_IDS,
);

function template(id: string) {
  const found = PROP_TEMPLATES.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`Missing prop template ${id}`);
  return found;
}

function defaultParams(id: string): Record<string, number> {
  const found = template(id);
  return Object.fromEntries(found.params.map((parameter) => [
    parameter.key,
    parameter.default,
  ]));
}

function alphaBounds(svg: string): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  const rendered = new Resvg(svg, {
    fitTo: { mode: 'width', value: 128 },
    font: { loadSystemFonts: false },
  }).render();
  const pixels = rendered.pixels;
  let minX = 128;
  let minY = 128;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < 128; y += 1) {
    for (let x = 0; x < 128; x += 1) {
      if (pixels[(y * 128 + x) * 4 + 3] === 0) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < 0) throw new Error('Rendered prop is empty');
  return { minX, minY, maxX, maxY };
}

function renderedPixels(svg: string): Uint8Array {
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: 128 },
    font: { loadSystemFonts: false },
  }).render().pixels;
}

function normalizedPixelDelta(leftSvg: string, rightSvg: string): number {
  const left = renderedPixels(leftSvg);
  const right = renderedPixels(rightSvg);
  let delta = 0;
  for (let index = 0; index < left.length; index += 1) {
    delta += Math.abs(left[index] - right[index]);
  }
  return delta / (left.length * 255);
}

describe('QuotaCo workhorse authored prop import', () => {
  it('retires the duplicate water station while preserving the gameplay water cooler', () => {
    expect(PROP_TEMPLATES.some(({ id }) => id === 'water-station')).toBe(false);
    expect(DEFAULT_PROPS.some(({ templateId }) => templateId === 'water-station')).toBe(false);

    const templates = new Set(PROP_TEMPLATES.map(({ id }) => id));
    expect(templates.has('water-cooler')).toBe(true);
    expect(templates.has('water-cooler-empty')).toBe(true);

    const facilities = facilityCatalogJson().facilities;
    expect(facilities.some(({ id }) => id === 'water_station')).toBe(false);
    expect(facilities.find(({ id }) => id === 'water_cooler')).toMatchObject({
      propId: 'water-cooler',
      kind: 'AnchoredFacility',
      interactionType: 'water_cooler',
      isInteractionAnchor: true,
    });
  });

  it('compiles all fifty-three sources deterministically with source provenance', async () => {
    const first = await compileQuotaCoWorkhorseProps(SOURCE_DIR, SOURCE_PREFIX);
    const second = await compileQuotaCoWorkhorseProps(SOURCE_DIR, SOURCE_PREFIX);

    expect(emitQuotaCoWorkhorsePropArt(first)).toBe(emitQuotaCoWorkhorsePropArt(second));
    expect(first.map(({ id }) => id).sort()).toEqual([...QUOTA_CO_WORKHORSE_PROP_IDS].sort());
    for (const imported of first) {
      expect(imported.sourceFile).toBe(`${SOURCE_PREFIX}/${imported.id}.svg`);
      expect(imported.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(Object.keys(imported.variants).length).toBeGreaterThan(0);
      expect(authoredPropArt(imported.id)?.sourceSha256).toBe(imported.sourceSha256);
    }
  });

  it('replaces appearance without changing placement, projection, or footprints', () => {
    for (const id of QUOTA_CO_WORKHORSE_PROP_IDS) {
      const found = template(id);
      const held = HELD_TEMPLATE_CONTRACTS[id];
      expect(found.projection).toBe(held.projection);
      expect(found.placement ?? 'floor').toBe(
        'placement' in held ? held.placement : 'floor',
      );
      expect(found.gridFootprint).toEqual(held.gridFootprint);
      expect(found.gridPivot).toBeUndefined();
      expect(found.footprint).toEqual(held.footprint);
      expect(found.params.map(({ key }) => key)).toEqual(held.params);
    }
  });

  it('keeps all three palette channels in authored art', () => {
    const tokens = new Set<PropPaletteToken>(['primary', 'secondary', 'accent']);
    for (const id of QUOTA_CO_WORKHORSE_PROP_IDS) {
      const shapes = authoredPropShapes(id, defaultParams(id));
      const present = new Set(
        shapes
          .flatMap(({ fill, stroke }) => [fill, stroke])
          .filter((paint): paint is string => Boolean(paint?.startsWith('$')))
          .map((paint) => paint.slice(1) as PropPaletteToken),
      );
      if (OUTDOOR_AUTHORED_PROP_IDS.has(id)) {
        expect(present.size, id).toBeGreaterThan(0);
        for (const token of present) expect(tokens.has(token), id).toBe(true);
      } else {
        expect(present, id).toEqual(tokens);
      }

      const instance = DEFAULT_PROPS.find(({ templateId }) => templateId === id);
      expect(instance?.palette, id).toEqual(authoredPropArt(id)?.paletteDefaults);
    }
  });

  it('renders canonical SVG art by default without global prop restyling', () => {
    const loudStyle = structuredClone(DEFAULT_STYLE);
    loudStyle.outline = {
      width: 9,
      color: '#FF00FF',
      mode: 'silhouette',
    };
    loudStyle.render.contactShadow = 0.99;

    for (const id of QUOTA_CO_WORKHORSE_PROP_IDS) {
      const instance = DEFAULT_PROPS.find(({ templateId }) => templateId === id);
      if (!instance) throw new Error(`Missing default prop ${id}`);

      const canonical = composeProp(instance, loudStyle, 128);
      expect(canonical, `${id} received the global outline`).not.toContain('#FF00FF');
      expect(propLayers(instance, loudStyle), `${id} default export layers`).toEqual([
        {
          key: 'literal-0',
          tint: null,
          markup: canonical.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, ''),
        },
      ]);

      const restyled = composeProp(instance, loudStyle, 128, {
        restyleAuthoredSvg: true,
      });
      expect(restyled, `${id} explicit restyle did not engage`).toContain('#FF00FF');
      expect(
        propLayers(instance, loudStyle, { restyleAuthoredSvg: true })
          .some(({ key }) => key === 'outline'),
        `${id} explicit outline layer`,
      ).toBe(true);
    }
  });

  it('ignores stale saved palettes unless authored SVG restyling is explicitly enabled', () => {
    const canonicalInstance = DEFAULT_PROPS.find(({ templateId }) => templateId === 'desk');
    const art = authoredPropArt('desk');
    if (!canonicalInstance || !art) throw new Error('Missing authored desk');
    const staleInstance = {
      ...canonicalInstance,
      palette: {
        primary: '#A9714B',
        secondary: '#DCE6EC',
        accent: '#444441',
      },
    };

    const canonical = composeProp(staleInstance, DEFAULT_STYLE, 128);
    const sourceSvg = readFileSync(path.resolve(art.sourceFile), 'utf8');
    expect(normalizedPixelDelta(sourceSvg, canonical)).toBeLessThan(0.002);
    expect(canonical).not.toContain('#A9714B');
    expect(propLayers(staleInstance, DEFAULT_STYLE)).toEqual([
      {
        key: 'literal-0',
        tint: null,
        markup: canonical.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, ''),
      },
    ]);

    const explicitlyRestyled = composeProp(staleInstance, DEFAULT_STYLE, 128, {
      restyleAuthoredSvg: true,
    });
    expect(explicitlyRestyled).toContain('#A9714B');
  });

  it('keeps default imported pixels within source-raster tolerance', () => {
    for (const id of QUOTA_CO_WORKHORSE_PROP_IDS) {
      const instance = DEFAULT_PROPS.find(({ templateId }) => templateId === id);
      const art = authoredPropArt(id);
      if (!instance || !art) throw new Error(`Missing default authored prop ${id}`);
      const sourceSvg = readFileSync(path.resolve(art.sourceFile), 'utf8');
      const importedSvg = composeProp(instance, DEFAULT_STYLE, 128);
      expect(
        normalizedPixelDelta(sourceSvg, importedSvg),
        `${id} drifted from its canonical SVG`,
      ).toBeLessThan(0.002);
    }
  });

  it('retains a visible deterministic response for every existing parameter', () => {
    for (const id of QUOTA_CO_WORKHORSE_PROP_IDS) {
      const found = template(id);
      for (const parameter of found.params) {
        const baseline = defaultParams(id);
        const low = found.build({ ...baseline, [parameter.key]: parameter.min }, {
          primary: '#111111',
          secondary: '#777777',
          accent: '#DD5555',
        });
        const high = found.build({ ...baseline, [parameter.key]: parameter.max }, {
          primary: '#111111',
          secondary: '#777777',
          accent: '#DD5555',
        });
        expect(high, `${id}/${parameter.key} is no longer functional`).not.toEqual(low);
        expect(found.build({ ...baseline, [parameter.key]: parameter.max }, {
          primary: '#FFFFFF',
          secondary: '#FFFFFF',
          accent: '#FFFFFF',
        })).toEqual(high);
      }
    }
  });

  it('keeps every legal parameter extreme inside the 128-unit export cell', () => {
    for (const id of QUOTA_CO_WORKHORSE_PROP_IDS) {
      const found = template(id);
      const instance = DEFAULT_PROPS.find(({ templateId }) => templateId === id);
      if (!instance) throw new Error(`Missing default prop ${id}`);
      for (const parameter of found.params) {
        for (const value of [parameter.min, parameter.max]) {
          const bounds = alphaBounds(composeProp({
            ...instance,
            params: { ...defaultParams(id), [parameter.key]: value },
          }, DEFAULT_STYLE, 128));
          expect(bounds.minX, `${id}/${parameter.key}=${value} left`).toBeGreaterThan(0);
          expect(bounds.minY, `${id}/${parameter.key}=${value} top`).toBeGreaterThan(0);
          expect(bounds.maxX, `${id}/${parameter.key}=${value} right`).toBeLessThan(127);
          expect(bounds.maxY, `${id}/${parameter.key}=${value} bottom`).toBeLessThan(127);
        }
      }
    }
  });

  it('uses the approved four-drawer cabinet as the production default', () => {
    expect(template('filing-cabinet').params[0].default).toBe(4);
    expect(
      DEFAULT_PROPS.find(({ templateId }) => templateId === 'filing-cabinet')?.params.drawers,
    ).toBe(4);
  });
});
