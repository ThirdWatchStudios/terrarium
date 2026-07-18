import { describe, expect, it } from 'vitest';

import {
  EXPORT_SCALES,
  groundLayerManifest,
  groundOverlayAtlas,
  propLayerManifest,
} from '../src/core/exporter';
import { facilityCatalogJson } from '../src/core/layout';
import { projectWithLook } from '../src/core/look';
import {
  DEFAULT_GROUND,
  DEFAULT_PROPS,
  DEFAULT_STYLE,
  defaultGoldenProject,
} from '../src/data/defaults';
import {
  NATURE_PROP_TEMPLATE_IDS,
  PROP_TEMPLATES,
  QUAD_GROUND_DETAIL_TEMPLATE_IDS,
} from '../src/props/templates';
import { NB } from '../src/tiles/blob';
import {
  GROUND_OVERLAY_BUILDERS,
  buildPondShore,
  deriveGroundOverlays,
} from '../src/tiles/groundOverlays';
import {
  FLOOR_TEMPLATES,
  GROUND_TEMPLATE_IDS,
  NATURAL_GROUND_TEMPLATE_IDS,
  PAVED_GROUND_TEMPLATE_IDS,
  WATER_TEMPLATE_IDS,
} from '../src/tiles/templates';

const DECAL_CONTRACT = {
  'ground-detail-rake-arc-a': { projection: 'plan', gridFootprint: { w: 1, h: 1 } },
  'ground-detail-rake-arc-b': { projection: 'plan', gridFootprint: { w: 1, h: 1 } },
  'ground-detail-rake-arc-c': { projection: 'plan', gridFootprint: { w: 1, h: 1 } },
  'ground-detail-lilypad-a': { projection: 'plan', gridFootprint: { w: 1, h: 1 } },
  'ground-detail-lilypad-b': { projection: 'plan', gridFootprint: { w: 1, h: 1 } },
  'ground-detail-stepping-stone-a': { projection: 'plan', gridFootprint: { w: 1, h: 1 } },
  'ground-detail-stepping-stone-b': { projection: 'plan', gridFootprint: { w: 1, h: 1 } },
} as const;

const PROP_CONTRACT = {
  'park-bench': { projection: 'elevation', gridFootprint: { w: 2, h: 1 } },
  'picnic-table': { projection: 'plan', gridFootprint: { w: 3, h: 2 } },
  'stone-lantern': { projection: 'elevation', gridFootprint: { w: 1, h: 1 } },
  'boulder-arrangement': { projection: 'plan', gridFootprint: { w: 2, h: 1 } },
  'reeds-cluster': { projection: 'elevation', gridFootprint: { w: 1, h: 1 } },
} as const;

const QUAD_PROP_IDS = [...Object.keys(DECAL_CONTRACT), ...Object.keys(PROP_CONTRACT)];

const propTemplate = (templateId: string) => {
  const found = PROP_TEMPLATES.find(({ id }) => id === templateId);
  if (!found) throw new Error(`Missing prop template ${templateId}`);
  return found;
};

const defaultProp = (templateId: string) => {
  const found = DEFAULT_PROPS.find((candidate) => candidate.templateId === templateId);
  if (!found) throw new Error(`Missing default prop for ${templateId}`);
  return found;
};

const maxFrameExtent = (frames: Record<string, { x: number; y: number; w: number; h: number }>) => ({
  width: Math.max(...Object.values(frames).map(({ x, w }) => x + w)),
  height: Math.max(...Object.values(frames).map(({ y, h }) => y + h)),
});

describe('campus Bundle 3 — quad, pond, and reflection garden (CE-23/24)', () => {
  it('ships pond-water as a third ground family and gravel as paved ground', () => {
    expect(WATER_TEMPLATE_IDS).toEqual(['pond-water']);
    expect(PAVED_GROUND_TEMPLATE_IDS).toEqual(['asphalt', 'sidewalk', 'gravel']);
    expect(GROUND_TEMPLATE_IDS).toEqual([
      ...NATURAL_GROUND_TEMPLATE_IDS,
      ...PAVED_GROUND_TEMPLATE_IDS,
      ...WATER_TEMPLATE_IDS,
    ]);

    for (const id of ['gravel', 'pond-water']) {
      expect(FLOOR_TEMPLATES.filter(({ id: candidate }) => candidate === id), `${id} floor template`).toHaveLength(1);
      expect(DEFAULT_GROUND.filter(({ templateId }) => templateId === id), `${id} ground default`).toHaveLength(1);
      expect(PROP_TEMPLATES.some(({ id: candidate }) => candidate === id), `${id} became a prop`).toBe(false);
    }
  });

  it('keeps both new ground tiles static, deterministic, flat, and re-tintable under 8192px', () => {
    for (const id of ['gravel', 'pond-water']) {
      const ground = DEFAULT_GROUND.find(({ templateId }) => templateId === id)!;
      const template = FLOOR_TEMPLATES.find(({ id: candidate }) => candidate === id)!;
      const first = template.build(ground.params, ground.palette);
      const second = template.build(ground.params, ground.palette);
      expect(first, `${id} is not deterministic`).toEqual(second);
      expect(first.length, `${id} has no geometry`).toBeGreaterThan(0);
      expect(first.every(({ silhouette }) => silhouette === false), `${id} casts a silhouette`).toBe(true);

      for (const scale of EXPORT_SCALES) {
        const extent = maxFrameExtent(groundLayerManifest(ground, DEFAULT_STYLE, scale).frames);
        expect(extent.width, `${id}@${scale}x width`).toBeLessThanOrEqual(8192);
        expect(extent.height, `${id}@${scale}x height`).toBeLessThanOrEqual(8192);
      }
    }
  });

  it('ships pond-shore on the shared cardinal 47-blob art contract', () => {
    expect(GROUND_OVERLAY_BUILDERS['pond-shore']).toBe(buildPondShore);
    expect(buildPondShore(NB.N)).not.toHaveLength(0);
    expect(buildPondShore(NB.N | NB.NE)).toEqual(buildPondShore(NB.N));
    expect(buildPondShore(NB.NE)).toEqual([]);

    const overlays = deriveGroundOverlays(defaultGoldenProject().ground);
    expect(overlays.map(({ templateId }) => templateId)).toEqual(['grass-fringe', 'curb-edge', 'pond-shore']);
    const shore = overlays.find(({ templateId }) => templateId === 'pond-shore')!;
    expect(shore).toMatchObject({ id: 'overlay-pond-shore', name: 'Pond shore' });
    expect(shore.palette).toEqual(DEFAULT_GROUND.find(({ templateId }) => templateId === 'dirt')!.palette);

    for (const scale of EXPORT_SCALES) {
      const atlas = groundOverlayAtlas(shore, DEFAULT_STYLE, scale);
      expect(atlas).toMatchObject({
        kind: 'ground-overlay',
        meta: {
          autotile: '8-neighbor blob (47)',
          maskSemantics: 'bit set = neighbour is non-water ground; drawn on the pond-water receiving cell',
        },
      });
      expect(Object.keys(atlas.frames)).toHaveLength(47);
      const extent = maxFrameExtent(atlas.frames);
      expect(extent.width, `pond-shore@${scale}x width`).toBeLessThanOrEqual(8192);
      expect(extent.height, `pond-shore@${scale}x height`).toBeLessThanOrEqual(8192);
    }
  });

  it('ships seven exact flat decals as non-placeable ground detail', () => {
    expect(QUAD_GROUND_DETAIL_TEMPLATE_IDS).toEqual(Object.keys(DECAL_CONTRACT));
    const facilities = new Set(facilityCatalogJson().facilities.map(({ propId }) => propId));
    for (const [id, contract] of Object.entries(DECAL_CONTRACT)) {
      expect(propTemplate(id), id).toMatchObject(contract);
      expect(DEFAULT_PROPS.filter(({ templateId }) => templateId === id), `${id} default count`).toHaveLength(1);
      const shapes = propTemplate(id).build({}, defaultProp(id).palette);
      expect(shapes.length, `${id} has no geometry`).toBeGreaterThan(0);
      expect(shapes.every(({ silhouette }) => silhouette === false), `${id} casts a silhouette`).toBe(true);
      expect(facilities.has(id), `${id} leaked into the facility catalog`).toBe(false);
    }
  });

  it('ships the exact five props with only shoreline reeds non-placeable and nature-exempt', () => {
    const facilities = new Set(facilityCatalogJson().facilities.map(({ propId }) => propId));
    const nature = new Set<string>(NATURE_PROP_TEMPLATE_IDS);
    for (const [id, contract] of Object.entries(PROP_CONTRACT)) {
      expect(propTemplate(id), id).toMatchObject(contract);
      expect(DEFAULT_PROPS.filter(({ templateId }) => templateId === id), `${id} default count`).toHaveLength(1);
      expect(facilities.has(id), `${id} facility classification`).toBe(id !== 'reeds-cluster');
      expect(nature.has(id), `${id} nature classification`).toBe(id === 'reeds-cluster');
    }
    for (const id of QUAD_GROUND_DETAIL_TEMPLATE_IDS) expect(nature.has(id), `${id} became wild nature`).toBe(false);
  });

  it('exempts pond and reeds while draining certified gravel, decals, and placed props', () => {
    const raw = defaultGoldenProject();
    raw.look = 'clinical';
    const clinical = projectWithLook(raw);
    const ground = (project: typeof raw, templateId: string) => project.ground!.find((item) => item.templateId === templateId)!.palette;
    const prop = (project: typeof raw, templateId: string) => project.props.find((item) => item.templateId === templateId)!.palette;

    expect(ground(clinical, 'pond-water')).toEqual(ground(raw, 'pond-water'));
    expect(ground(clinical, 'gravel')).not.toEqual(ground(raw, 'gravel'));
    expect(prop(clinical, 'reeds-cluster')).toEqual(prop(raw, 'reeds-cluster'));
    for (const id of [...QUAD_GROUND_DETAIL_TEMPLATE_IDS, 'park-bench', 'picnic-table', 'stone-lantern', 'boulder-arrangement']) {
      expect(prop(clinical, id), `${id} did not drain`).not.toEqual(prop(raw, id));
    }
  });

  it('keeps every quad prop re-tint atlas under the Unity 8192px ceiling', () => {
    for (const id of QUAD_PROP_IDS) {
      for (const scale of EXPORT_SCALES) {
        const extent = maxFrameExtent(propLayerManifest(defaultProp(id), DEFAULT_STYLE, scale).frames);
        expect(extent.width, `${id}@${scale}x width`).toBeLessThanOrEqual(8192);
        expect(extent.height, `${id}@${scale}x height`).toBeLessThanOrEqual(8192);
      }
    }
  });

  it('adds no fish or koi asset', () => {
    for (const forbidden of ['fish', 'koi', 'koi-fish']) {
      expect(PROP_TEMPLATES.some(({ id }) => id === forbidden), `${forbidden} template`).toBe(false);
      expect(DEFAULT_PROPS.some(({ templateId }) => templateId === forbidden), `${forbidden} default`).toBe(false);
    }
  });
});
