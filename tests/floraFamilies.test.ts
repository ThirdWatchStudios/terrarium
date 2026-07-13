import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import {
  composeFloorTile,
  composeProp,
  propLayers,
} from '../src/core/compositor';
import {
  EXPORT_SCALES,
  propAtlas,
  propLayerManifest,
} from '../src/core/exporter';
import { facilityCatalogJson } from '../src/core/layout';
import { projectWithLook } from '../src/core/look';
import type { PropInstance, ShapeSpec } from '../src/core/types';
import {
  DEFAULT_GROUND,
  DEFAULT_PROPS,
  DEFAULT_STYLE,
  defaultGoldenProject,
} from '../src/data/defaults';
import {
  NATURE_PROP_TEMPLATE_IDS,
  PROP_TEMPLATES,
} from '../src/props/templates';
import { NATURAL_GROUND_TEMPLATE_IDS } from '../src/tiles/templates';

const FLORA_IDS = [
  'prop-tree',
  'prop-tree-b',
  'prop-tree-upright',
  'prop-tree-conifer',
  'prop-tree-sapling',
  'prop-tree-sapling-b',
  'prop-bush-cluster',
  'prop-bush-bramble',
  'prop-bush-low',
  'prop-wildflower-patch',
  'prop-tall-grass-clump',
  'prop-bracken-patch',
] as const;

const FLORA_TEMPLATE_IDS = [
  'tree-canopy',
  'tree-sapling',
  'bush-cluster',
  'wildflower-patch',
  'tall-grass-clump',
  'bracken-patch',
] as const;

const SILHOUETTE_FAMILIES = [
  ['prop-tree', 'prop-tree-b', 'prop-tree-upright', 'prop-tree-conifer'],
  ['prop-tree-sapling', 'prop-tree-sapling-b'],
  ['prop-bush-cluster', 'prop-bush-bramble', 'prop-bush-low'],
  ['prop-wildflower-patch', 'prop-tall-grass-clump', 'prop-bracken-patch'],
] as const;

const NATURAL_GROUND_IDS = [
  'ground-grass',
  'ground-grass-b',
  'ground-grass-c',
  'ground-meadow',
  'ground-meadow-b',
  'ground-dirt',
] as const;

const FLORA_FOOTPRINTS: Record<(typeof FLORA_IDS)[number], { w: number; h: number }> = {
  'prop-tree': { w: 3, h: 3 },
  'prop-tree-b': { w: 3, h: 3 },
  'prop-tree-upright': { w: 3, h: 3 },
  'prop-tree-conifer': { w: 3, h: 3 },
  'prop-tree-sapling': { w: 2, h: 2 },
  'prop-tree-sapling-b': { w: 2, h: 2 },
  'prop-bush-cluster': { w: 2, h: 1 },
  'prop-bush-bramble': { w: 2, h: 1 },
  'prop-bush-low': { w: 2, h: 1 },
  'prop-wildflower-patch': { w: 2, h: 2 },
  'prop-tall-grass-clump': { w: 1, h: 1 },
  'prop-bracken-patch': { w: 2, h: 1 },
};

const ELEVATION_TREE_IDS = new Set<(typeof FLORA_IDS)[number]>([
  'prop-tree',
  'prop-tree-b',
  'prop-tree-upright',
  'prop-tree-conifer',
  'prop-tree-sapling',
  'prop-tree-sapling-b',
]);

function defaultProp(id: (typeof FLORA_IDS)[number]): PropInstance {
  const prop = DEFAULT_PROPS.find((candidate) => candidate.id === id);
  if (!prop) throw new Error(`Missing default flora prop ${id}`);
  return prop;
}

function templateFor(prop: PropInstance) {
  const template = PROP_TEMPLATES.find((candidate) => candidate.id === prop.templateId);
  if (!template) throw new Error(`Missing flora template ${prop.templateId}`);
  return template;
}

function pathMarkup(shape: ShapeSpec): string {
  const fill = shape.fill ? '#000000' : 'none';
  const stroke = shape.stroke ? '#000000' : 'none';
  return (
    `<path d="${shape.d}" fill="${fill}" stroke="${stroke}" ` +
    `stroke-width="${shape.strokeWidth ?? 1.5}" opacity="${shape.opacity ?? 1}" ` +
    'stroke-linecap="round" stroke-linejoin="round"/>'
  );
}

/** Binary alpha mask of the complete visible mass at gameplay size. Plan decals
 * (notably wildflowers) intentionally opt out of the compositor outline, so
 * readability is measured from their full authored shape rather than outline roles. */
function visibleMask(prop: PropInstance): Uint8Array {
  const shapes = templateFor(prop).build(prop.params, prop.palette);
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="32" height="32">',
    ...shapes.map(pathMarkup),
    '</svg>',
  ].join('');
  const pixels = new Resvg(svg, { font: { loadSystemFonts: false } }).render().pixels;
  return Uint8Array.from(
    { length: pixels.length / 4 },
    (_, index) => pixels[index * 4 + 3] >= 32 ? 1 : 0,
  );
}

function changedPixels(left: Uint8Array, right: Uint8Array): number {
  let changed = 0;
  for (let index = 0; index < left.length; index++) {
    if (left[index] !== right[index]) changed++;
  }
  return changed;
}

function renderDiagnostics(svg: string): { width: number; height: number; exceedsCanvas: boolean } {
  const renderer = new Resvg(svg, { font: { loadSystemFonts: false } });
  const bounds = renderer.getBBox();
  const raster = renderer.render();
  if (!bounds) return { width: raster.width, height: raster.height, exceedsCanvas: true };
  const epsilon = 0.001;
  return {
    width: raster.width,
    height: raster.height,
    exceedsCanvas:
      bounds.x < -epsilon ||
      bounds.y < -epsilon ||
      bounds.x + bounds.width > 128 + epsilon ||
      bounds.y + bounds.height > 128 + epsilon,
  };
}

describe('production wild-field flora families', () => {
  it('keeps the exact twelve-silhouette production inventory in stable order', () => {
    const floraTemplates = new Set<string>(FLORA_TEMPLATE_IDS);
    expect(
      DEFAULT_PROPS
        .filter((prop) => floraTemplates.has(prop.templateId))
        .map(({ id }) => id),
    ).toEqual(FLORA_IDS);

    for (const id of FLORA_IDS) {
      expect(defaultProp(id).params.seed, `${id} has no curated seed`).toEqual(
        expect.any(Number),
      );
    }
  });

  it('keeps every silhouette family materially distinct at 32px', () => {
    for (const family of SILHOUETTE_FAMILIES) {
      const masks = family.map((id) => [id, visibleMask(defaultProp(id))] as const);
      for (const [id, mask] of masks) {
        const painted = mask.reduce((sum, pixel) => sum + pixel, 0);
        expect(painted, `${id} has no gameplay-scale visible mass`).toBeGreaterThan(4);
      }
      for (let left = 0; left < masks.length; left++) {
        for (let right = left + 1; right < masks.length; right++) {
          const [leftId, leftMask] = masks[left];
          const [rightId, rightMask] = masks[right];
          expect(
            changedPixels(leftMask, rightMask),
            `${leftId} and ${rightId} collapse to the same 32px silhouette`,
          ).toBeGreaterThanOrEqual(8);
        }
      }
    }
  });

  it('keeps curated seeds deterministic and visually effective', () => {
    for (const id of FLORA_IDS) {
      const prop = defaultProp(id);
      const template = templateFor(prop);
      const first = template.build(prop.params, prop.palette);
      const second = template.build({ ...prop.params }, prop.palette);
      expect(second, `${id} seed is nondeterministic`).toEqual(first);
      expect(composeProp(prop, DEFAULT_STYLE, 64), `${id} compositor is nondeterministic`)
        .toBe(composeProp(structuredClone(prop), DEFAULT_STYLE, 64));

      const seed = prop.params.seed;
      expect(seed, `${id} is missing its seed parameter`).toEqual(expect.any(Number));
      const alternateSeed = ((seed as number) % 9) + 1;
      expect(
        template.build({ ...prop.params, seed: alternateSeed }, prop.palette),
        `${id} ignores its seed parameter`,
      ).not.toEqual(first);
    }
  });

  it('preserves the pre-kit warm tree as the spreading elevation crown', () => {
    const warm = defaultProp('prop-tree-b');
    const template = templateFor(warm);
    expect(template.build({ lobes: 6, seed: 7 }, warm.palette))
      .toEqual(template.build({ habit: 1, lobes: 6, seed: 7 }, warm.palette));
  });

  it('renders all flora at 32, 64, and 128px without invalid geometry or clipping', () => {
    for (const id of FLORA_IDS) {
      const prop = defaultProp(id);
      for (const size of [32, 64, 128]) {
        const svg = composeProp(prop, DEFAULT_STYLE, size);
        expect(svg, `${id}@${size} invalid geometry`).not.toMatch(/NaN|Infinity|undefined/);
        expect(svg, `${id}@${size} unresolved palette token`).not.toContain('#FF00FF');
        const render = renderDiagnostics(svg);
        expect([render.width, render.height], `${id}@${size} raster dimensions`).toEqual([size, size]);
        expect(render.exceedsCanvas, `${id}@${size} exceeds the export canvas`).toBe(false);
      }
    }
  });

  it('keeps trees elevation-projected, low flora plan-projected, and exact footprints', () => {
    for (const id of FLORA_IDS) {
      const prop = defaultProp(id);
      const template = templateFor(prop);
      const elevation = ELEVATION_TREE_IDS.has(id);
      const projection = elevation ? 'elevation' : 'plan';
      expect(template.projection, id).toBe(projection);
      expect(template.gridFootprint, `${id} grid footprint`).toEqual(FLORA_FOOTPRINTS[id]);
      expect(propAtlas(prop, DEFAULT_STYLE, 1), id).toMatchObject({
        projection,
        gridFootprint: FLORA_FOOTPRINTS[id],
        pivot: elevation ? { x: 0.5, y: 0.09 } : { x: 0.5, y: 0.5 },
        meta: {
          sorting: elevation ? 'y-sort' : 'floor-layer',
          rotatable: !elevation,
        },
      });
    }
  });

  it('keeps every flora template clinical-exempt and out of the placeable catalog', () => {
    const natureTemplates = new Set<string>(NATURE_PROP_TEMPLATE_IDS);
    for (const templateId of FLORA_TEMPLATE_IDS) {
      expect(natureTemplates.has(templateId), `${templateId} is not clinical-exempt`).toBe(true);
    }

    const raw = defaultGoldenProject();
    raw.look = 'clinical';
    const lensed = projectWithLook(raw);
    for (const id of FLORA_IDS) {
      const rawProp = raw.props.find((candidate) => candidate.id === id)!;
      const lensedProp = lensed.props.find((candidate) => candidate.id === id)!;
      expect(lensedProp.palette, `${id} drained under the clinical look`).toEqual(rawProp.palette);
    }

    const placeable = new Set(facilityCatalogJson().facilities.map(({ propId }) => propId));
    for (const templateId of FLORA_TEMPLATE_IDS) {
      expect(placeable.has(templateId), `${templateId} leaked into the facility catalog`).toBe(false);
    }
  });

  it('keeps every flora layer atlas under Unity texture limits at every export scale', () => {
    const limit = 8192;
    for (const id of FLORA_IDS) {
      const prop = defaultProp(id);
      const layers = propLayers(prop, DEFAULT_STYLE);
      expect(layers.length, `${id} emitted no compositor layers`).toBeGreaterThan(0);
      for (const scale of EXPORT_SCALES) {
        const manifest = propLayerManifest(prop, DEFAULT_STYLE, scale);
        const frames = Object.values(manifest.frames);
        const width = Math.max(0, ...frames.map(({ x, w }) => x + w));
        const height = Math.max(0, ...frames.map(({ y, h }) => y + h));
        expect(width, `${id}@${scale}x layer atlas width`).toBeLessThanOrEqual(limit);
        expect(height, `${id}@${scale}x layer atlas height`).toBeLessThanOrEqual(limit);
      }
    }
  });
});

describe('mixed natural-ground cadence', () => {
  it('keeps three grass and two meadow tiles in stable default order', () => {
    const naturalTemplates = new Set<string>(NATURAL_GROUND_TEMPLATE_IDS);
    expect(
      DEFAULT_GROUND
        .filter((ground) => naturalTemplates.has(ground.templateId))
        .map(({ id }) => id),
    ).toEqual(NATURAL_GROUND_IDS);

    for (const templateId of ['grass', 'meadow']) {
      const variants = DEFAULT_GROUND.filter((ground) => ground.templateId === templateId);
      expect(new Set(variants.map(({ params }) => params.seed)).size, templateId)
        .toBe(variants.length);
      const renders = variants.map((ground) => composeFloorTile(ground, DEFAULT_STYLE, 32));
      expect(new Set(renders).size, `${templateId} variants collapsed`).toBe(variants.length);
      for (const [index, ground] of variants.entries()) {
        expect(composeFloorTile(ground, DEFAULT_STYLE, 32), `${ground.id} is nondeterministic`)
          .toBe(renders[index]);
      }
    }

    const fieldVariants = DEFAULT_GROUND.filter(({ templateId }) =>
      templateId === 'grass' || templateId === 'meadow',
    );
    expect(new Set(fieldVariants.map(({ palette }) => palette.primary)), 'field base seams')
      .toEqual(new Set(['#4E9A3C']));
  });
});
