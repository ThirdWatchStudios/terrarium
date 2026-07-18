import { describe, expect, it } from 'vitest';

import { groundOverlayAtlas, propLayerManifest } from '../src/core/exporter';
import { facilityCatalogJson } from '../src/core/layout';
import { projectWithLook } from '../src/core/look';
import { DEFAULT_PROPS, DEFAULT_STYLE, defaultGoldenProject } from '../src/data/defaults';
import { LOT_MARKING_TEMPLATE_IDS, PROP_TEMPLATES } from '../src/props/templates';
import { NB } from '../src/tiles/blob';
import {
  GROUND_OVERLAY_BUILDERS,
  buildCurbEdge,
  deriveGroundOverlays,
} from '../src/tiles/groundOverlays';

const template = (id: string) => {
  const found = PROP_TEMPLATES.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`Missing prop template ${id}`);
  return found;
};

const defaultProp = (templateId: string) => {
  const found = DEFAULT_PROPS.find((candidate) => candidate.templateId === templateId);
  if (!found) throw new Error(`Missing default prop for ${templateId}`);
  return found;
};

describe('campus Bundle 1 — parking (CE-21)', () => {
  it('ships curb-edge on the shared cardinal 47-blob art contract', () => {
    expect(GROUND_OVERLAY_BUILDERS['curb-edge']).toBe(buildCurbEdge);
    expect(buildCurbEdge(NB.N)).not.toHaveLength(0);
    expect(buildCurbEdge(NB.N | NB.NE)).toEqual(buildCurbEdge(NB.N));
    expect(buildCurbEdge(NB.NE)).toEqual([]);
    expect(buildCurbEdge(NB.N | NB.E | NB.S | NB.W)).toHaveLength(16);

    const overlays = deriveGroundOverlays(defaultGoldenProject().ground);
    expect(overlays.map(({ templateId }) => templateId)).toEqual(['grass-fringe', 'curb-edge']);
    expect(overlays.find(({ templateId }) => templateId === 'curb-edge')).toMatchObject({
      id: 'overlay-curb-edge',
      name: 'Curb edge',
    });
    expect(groundOverlayAtlas(
      overlays.find(({ templateId }) => templateId === 'curb-edge')!,
      DEFAULT_STYLE,
      1,
    )).toMatchObject({
      kind: 'ground-overlay',
      meta: {
        autotile: '8-neighbor blob (47)',
        maskSemantics: 'bit set = neighbour is natural ground; drawn on the paved receiving cell',
      },
    });
  });

  it('keeps every lot marking flat, shadowless, and on its exact footprint', () => {
    const footprints = {
      'lot-marking-accessible': { w: 2, h: 2 },
      'lot-marking-arrow': { w: 2, h: 1 },
      'lot-marking-reserved': { w: 2, h: 1 },
      'lot-marking-crosswalk': { w: 2, h: 2 },
    } as const;
    expect(LOT_MARKING_TEMPLATE_IDS).toEqual(Object.keys(footprints));
    for (const id of LOT_MARKING_TEMPLATE_IDS) {
      const propTemplate = template(id);
      expect(propTemplate.projection, id).toBe('plan');
      expect(propTemplate.gridFootprint, id).toEqual(footprints[id]);
      const shapes = propTemplate.build({}, defaultProp(id).palette);
      expect(shapes.length, `${id} has no painted geometry`).toBeGreaterThan(0);
      expect(shapes.every(({ silhouette }) => silhouette === false), `${id} casts a silhouette`).toBe(true);
    }
  });

  it('ships the exact parking fixtures, variants, and vehicle footprint', () => {
    expect(template('lamp-post')).toMatchObject({ projection: 'elevation', gridFootprint: { w: 1, h: 1 } });
    expect(template('sign-lot')).toMatchObject({ projection: 'elevation', gridFootprint: { w: 1, h: 1 } });
    expect(template('car-compact')).toMatchObject({ projection: 'plan', gridFootprint: { w: 3, h: 2 } });
    expect(template('bike-rack')).toMatchObject({ projection: 'plan', gridFootprint: { w: 2, h: 1 } });
    expect(DEFAULT_PROPS.filter(({ templateId }) => templateId === 'sign-lot').map(({ params }) => params.variant))
      .toEqual([0, 1]);
  });

  it('keeps markings and fixtures placeable, cars sim-spawned, and markings walkable', () => {
    const facilities = new Map(facilityCatalogJson().facilities.map((entry) => [entry.propId, entry]));
    for (const id of [...LOT_MARKING_TEMPLATE_IDS, 'lamp-post', 'sign-lot', 'bike-rack']) {
      expect(facilities.has(id), `${id} is absent from the placeable catalog`).toBe(true);
    }
    for (const id of LOT_MARKING_TEMPLATE_IDS) {
      expect(facilities.get(id)?.blocksWalk, `${id} blocks walking`).toBe(false);
    }
    for (const id of ['car', 'car-suv', 'car-compact']) {
      expect(facilities.has(id), `${id} leaked into the placeable catalog`).toBe(false);
    }
  });

  it('keeps all three car bodies re-tintable under the Unity 8192px ceiling', () => {
    for (const id of ['car', 'car-suv', 'car-compact']) {
      const prop = defaultProp(id);
      const manifest = propLayerManifest(prop, DEFAULT_STYLE, 4);
      expect(manifest.layers.some(({ tint }) => tint === 'primary'), `${id} lost its $primary body layer`).toBe(true);
      const frames = Object.values(manifest.frames);
      expect(Math.max(...frames.map(({ x, w }) => x + w)), `${id} layer atlas width`).toBeLessThanOrEqual(8192);
      expect(Math.max(...frames.map(({ y, h }) => y + h)), `${id} layer atlas height`).toBeLessThanOrEqual(8192);
    }
  });

  it('drains the paved-family parking art under the clinical look', () => {
    const raw = defaultGoldenProject();
    raw.look = 'clinical';
    const clinical = projectWithLook(raw);
    for (const templateId of [
      ...LOT_MARKING_TEMPLATE_IDS,
      'lamp-post',
      'sign-lot',
      'car',
      'car-suv',
      'car-compact',
      'bike-rack',
    ]) {
      const rawProp = raw.props.find((candidate) => candidate.templateId === templateId)!;
      const clinicalProp = clinical.props.find((candidate) => candidate.id === rawProp.id)!;
      expect(clinicalProp.palette, `${templateId} did not drain`).not.toEqual(rawProp.palette);
    }
  });
});
