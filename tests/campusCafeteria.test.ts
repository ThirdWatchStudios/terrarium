import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import { characterLayers, composeCharacter } from '../src/core/compositor';
import { generateEmployee, generationProfiles } from '../src/core/employee';
import { EXPORT_SCALES, propLayerManifest } from '../src/core/exporter';
import { facilityCatalogJson, INTERACTION_PROP_TYPES } from '../src/core/layout';
import { projectWithLook } from '../src/core/look';
import { mulberry32, randomCharacter } from '../src/core/random';
import { CANVAS, FACINGS } from '../src/core/types';
import {
  DEFAULT_CAST,
  DEFAULT_PROPS,
  DEFAULT_STYLE,
  DEFAULT_STYLE_PRESETS,
  KITCHEN_STAFF,
  defaultGoldenProject,
} from '../src/data/defaults';
import { getPart, partsForSlot } from '../src/parts/library';
import { BODY_ARCHETYPES } from '../src/parts/bodyArchetypes';
import { POSES } from '../src/parts/poses';
import { PROP_TEMPLATES } from '../src/props/templates';

const PROP_CONTRACT = {
  'serving-line': { projection: 'elevation', gridFootprint: { w: 4, h: 1 } },
  'service-scanner': { projection: 'elevation', gridFootprint: { w: 1, h: 1 } },
  'commercial-range': { projection: 'elevation', gridFootprint: { w: 2, h: 1 } },
  'prep-table': { projection: 'plan', gridFootprint: { w: 2, h: 1 } },
  'dish-return': { projection: 'elevation', gridFootprint: { w: 2, h: 1 } },
  'walk-in-front': { projection: 'elevation', gridFootprint: { w: 2, h: 1 } },
  'dining-carrel': { projection: 'plan', gridFootprint: { w: 1, h: 1 } },
  'cafeteria-table': { projection: 'plan', gridFootprint: { w: 4, h: 2 } },
  'tray-stack': { projection: 'plan', gridFootprint: { w: 1, h: 1 } },
} as const;

const CAFETERIA_PROP_IDS = Object.keys(PROP_CONTRACT);
const RECIPE_ONLY_PART_IDS = ['outfit-service-apron', 'acc-hairnet'] as const;
const IRIS_GREEN = '#5BE08A';

const defaultProp = (templateId: string) => {
  const found = DEFAULT_PROPS.find((candidate) => candidate.templateId === templateId);
  if (!found) throw new Error(`Missing default prop for ${templateId}`);
  return found;
};

const propTemplate = (templateId: string) => {
  const found = PROP_TEMPLATES.find((candidate) => candidate.id === templateId);
  if (!found) throw new Error(`Missing template ${templateId}`);
  return found;
};

function expectInsideCanvas(svg: string, label: string, overflowBudget = 0) {
  const renderer = new Resvg(svg, { font: { loadSystemFonts: false } });
  const bounds = renderer.getBBox();
  expect(bounds, `${label} has no painted bounds`).toBeTruthy();
  const epsilon = 0.001;
  expect(bounds!.x, `${label} clips left`).toBeGreaterThanOrEqual(-overflowBudget - epsilon);
  expect(bounds!.y, `${label} clips top`).toBeGreaterThanOrEqual(-overflowBudget - epsilon);
  expect(bounds!.x + bounds!.width, `${label} clips right`).toBeLessThanOrEqual(CANVAS + overflowBudget + epsilon);
  expect(bounds!.y + bounds!.height, `${label} clips bottom`).toBeLessThanOrEqual(CANVAS + overflowBudget + epsilon);
}

function expectNoAdditionalCanvasOverflow(svg: string, baselineSvg: string, label: string) {
  const bounds = new Resvg(svg, { font: { loadSystemFonts: false } }).getBBox();
  const baseline = new Resvg(baselineSvg, { font: { loadSystemFonts: false } }).getBBox();
  expect(bounds, `${label} has no painted bounds`).toBeTruthy();
  expect(baseline, `${label} has no baseline bounds`).toBeTruthy();
  const epsilon = 0.001;
  expect(bounds!.x, `${label} adds left overflow`).toBeGreaterThanOrEqual(Math.min(0, baseline!.x) - epsilon);
  expect(bounds!.y, `${label} adds top overflow`).toBeGreaterThanOrEqual(Math.min(0, baseline!.y) - epsilon);
  expect(bounds!.x + bounds!.width, `${label} adds right overflow`)
    .toBeLessThanOrEqual(Math.max(CANVAS, baseline!.x + baseline!.width) + epsilon);
  expect(bounds!.y + bounds!.height, `${label} adds bottom overflow`)
    .toBeLessThanOrEqual(Math.max(CANVAS, baseline!.y + baseline!.height) + epsilon);
}

describe('campus Bundle 2 — cafeteria and kitchen (CE-22)', () => {
  it('ships the exact nine required props with stable projections and footprints', () => {
    for (const [id, expected] of Object.entries(PROP_CONTRACT)) {
      expect(propTemplate(id), id).toMatchObject(expected);
      expect(DEFAULT_PROPS.filter(({ templateId }) => templateId === id), `${id} default count`).toHaveLength(1);
    }
    expect(DEFAULT_PROPS.some(({ templateId }) => templateId === 'condiment-station')).toBe(false);
    expect(DEFAULT_PROPS.some(({ templateId }) => templateId === 'serving-line-end')).toBe(false);
  });

  it('keeps all cafeteria props placeable and only the scanner interaction-anchored', () => {
    expect(INTERACTION_PROP_TYPES['service-scanner']).toBe('service_scanner');
    const facilities = new Map(facilityCatalogJson().facilities.map((entry) => [entry.propId, entry]));
    for (const id of CAFETERIA_PROP_IDS) {
      const facility = facilities.get(id);
      expect(facility, `${id} is absent from the facility catalog`).toBeTruthy();
      expect(facility?.blocksWalk, `${id} should be a blocking interior prop`).toBe(true);
      if (id === 'service-scanner') {
        expect(facility).toMatchObject({
          kind: 'AnchoredFacility',
          isInteractionAnchor: true,
          interactionType: 'service_scanner',
        });
      } else {
        expect(facility?.isInteractionAnchor, `${id} unexpectedly became an anchor`).toBe(false);
      }
    }
  });

  it('keeps the service scanner tied to the literal IRIS-green optic', () => {
    const scanner = propTemplate('service-scanner').build({}, defaultProp('service-scanner').palette);
    expect(JSON.stringify(scanner).toUpperCase()).toContain(IRIS_GREEN);
    expect(scanner.some(({ fill, stroke }) => fill === IRIS_GREEN || stroke === IRIS_GREEN)).toBe(true);
  });

  it('drains every cafeteria prop under the clinical look', () => {
    const raw = defaultGoldenProject();
    raw.look = 'clinical';
    const clinical = projectWithLook(raw);
    for (const id of CAFETERIA_PROP_IDS) {
      const rawProp = raw.props.find(({ templateId }) => templateId === id)!;
      const clinicalProp = clinical.props.find(({ id: candidateId }) => candidateId === rawProp.id)!;
      expect(clinicalProp.palette, `${id} did not drain`).not.toEqual(rawProp.palette);
    }
  });

  it('keeps every cafeteria prop re-tint atlas beneath Unity 8192px at every scale', () => {
    for (const id of CAFETERIA_PROP_IDS) {
      const prop = defaultProp(id);
      for (const scale of EXPORT_SCALES) {
        const manifest = propLayerManifest(prop, DEFAULT_STYLE, scale);
        const frames = Object.values(manifest.frames);
        expect(Math.max(...frames.map(({ x, w }) => x + w)), `${id}@${scale}x width`).toBeLessThanOrEqual(8192);
        expect(Math.max(...frames.map(({ y, h }) => y + h)), `${id}@${scale}x height`).toBeLessThanOrEqual(8192);
      }
    }
  });

  it('keeps the apron and hairnet resolvable but out of all ordinary generation paths', () => {
    expect(getPart('outfit-service-apron')).toMatchObject({ slot: 'outfit', anchor: 'body' });
    expect(getPart('acc-hairnet')).toMatchObject({ slot: 'accessory', anchor: 'headCenter' });
    expect(partsForSlot('outfit').map(({ id }) => id)).not.toContain('outfit-service-apron');
    expect(partsForSlot('accessory').map(({ id }) => id)).not.toContain('acc-hairnet');

    for (let seed = 0; seed < 128; seed++) {
      const random = randomCharacter(DEFAULT_STYLE, mulberry32(seed));
      expect(RECIPE_ONLY_PART_IDS).not.toContain(random.parts.outfit as (typeof RECIPE_ONLY_PART_IDS)[number]);
      expect(random.parts.accessories).not.toContain('acc-hairnet');
    }
    for (const profile of generationProfiles()) {
      for (let seed = 0; seed < 16; seed++) {
        const generated = generateEmployee(`service-staff-leak-${profile.id}-${seed}`, profile.id, DEFAULT_STYLE);
        expect(generated.recipe.parts.outfit).not.toBe('outfit-service-apron');
        expect(generated.recipe.parts.accessories).not.toContain('acc-hairnet');
      }
    }
  });

  it('wires one non-desk kitchen-worker recipe and renders every existing pose without adding hairnet overflow', () => {
    expect(KITCHEN_STAFF).toHaveLength(1);
    expect(KITCHEN_STAFF[0]).toMatchObject({
      id: 'kitchen-worker',
      palette: {
        outfitPrimary: '#E7E1D5',
        outfitSecondary: '#657A82',
      },
      parts: {
        outfit: 'outfit-service-apron',
        accessories: ['acc-hairnet'],
      },
    });
    expect(DEFAULT_CAST.map(({ id }) => id)).not.toContain('kitchen-worker');

    for (const preset of DEFAULT_STYLE_PRESETS) {
      for (const pose of POSES) {
        for (const facing of [...FACINGS, 'west'] as const) {
          const label = `${preset.id}/${pose}/${facing}`;
          const svg = composeCharacter(KITCHEN_STAFF[0], preset.style, facing, CANVAS, 'normal', {
            badge: false,
            pose,
          });
          const baseline = composeCharacter({
            ...KITCHEN_STAFF[0],
            parts: { ...KITCHEN_STAFF[0].parts, accessories: [] },
          }, preset.style, facing, CANVAS, 'normal', {
            badge: false,
            pose,
          });
          expect(svg, `${label} has invalid geometry`).not.toMatch(/NaN|Infinity|undefined|#FF00FF/i);
          if (preset.id === 'preset-high-contrast') {
            // This preset's 1.12 head scale and four-unit per-part outline are
            // already recorded character-frame debt. Keep a hard source-unit
            // ceiling until that style receives its dedicated calibration.
            expectInsideCanvas(svg, label, 10);
          } else {
            expectNoAdditionalCanvasOverflow(svg, baseline, label);
          }
        }
      }
    }
  });

  it('uses canonical SVG receivers for every apron body/facing and each hairnet facing', () => {
    const apron = getPart('outfit-service-apron')!;
    const hairnet = getPart('acc-hairnet')!;
    expect(apron.preservePaintRuns).toBe(true);
    expect(apron.buildVariant).toBeTypeOf('function');
    for (const body of BODY_ARCHETYPES) {
      for (const facing of FACINGS) {
        const variant = apron.buildVariant?.(facing, { bodyId: body.id });
        expect(variant?.z, `${body.id}/${facing}`).toBe(20);
        expect(variant?.shapes.length, `${body.id}/${facing}`).toBeGreaterThan(0);
        expect(variant?.shapes.every(({ silhouette }) => silhouette === false), `${body.id}/${facing}`)
          .toBe(true);
      }
    }
    expect(apron.buildVariant?.('south', { bodyId: 'body-future' })).toBeUndefined();
    for (const facing of FACINGS) {
      expect(hairnet.facings[facing]?.shapes.length, facing).toBeGreaterThan(0);
      expect(hairnet.facings[facing]?.shapes.every(({ silhouette }) => silhouette === false), facing)
        .toBe(true);
    }
  });

  it('preserves the apron pocket paint run and reconstructs flat cafeteria sprites exactly', () => {
    const style = structuredClone(DEFAULT_STYLE);
    style.render.contactShadow = 0;
    const layers = characterLayers(KITCHEN_STAFF[0], style);
    for (const facing of ['south', 'east', 'west'] as const) {
      expect(layers.find(({ key }) => key === 'outfit-service-apron__outfitSecondary')?.markup[facing])
        .not.toBe('');
      expect(layers.find(({ key }) => key === 'outfit-service-apron__outfitPrimary')?.markup[facing])
        .not.toBe('');
      expect(layers.find(({ key }) => key === 'outfit-service-apron__outfitSecondary__run2')?.markup[facing])
        .not.toBe('');
    }
    expect(layers.find(({ key }) => key === 'outfit-service-apron__outfitSecondary__run2')?.markup.north)
      .toBe('');

    for (const facing of [...FACINGS, 'west'] as const) {
      const flat = composeCharacter(KITCHEN_STAFF[0], style, facing, CANVAS, 'normal', { badge: false });
      const markup = layers
        .filter(({ mood }) => mood === null)
        .map((layer) => layer.tint
          ? layer.markup[facing].replaceAll('#FFFFFF', KITCHEN_STAFF[0].palette[layer.tint])
          : layer.markup[facing])
        .join('');
      const reconstructed = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">${markup}</svg>`;
      expect(
        Buffer.compare(new Resvg(flat).render().asPng(), new Resvg(reconstructed).render().asPng()),
        `${facing} layer reconstruction diverged from the flat cafeteria sprite`,
      ).toBe(0);
    }
  });

  it('keeps the translucent hairnet silhouette-free over every selectable hairstyle', () => {
    const hairnet = getPart('acc-hairnet')!;
    for (const variant of Object.values(hairnet.facings)) {
      expect(variant?.shapes.every(({ silhouette }) => silhouette === false)).toBe(true);
    }
    for (const hair of partsForSlot('hair')) {
      for (const facing of [...FACINGS, 'west'] as const) {
        const recipe = {
          ...KITCHEN_STAFF[0],
          parts: { ...KITCHEN_STAFF[0].parts, hair: hair.id, accessories: ['acc-hairnet'] },
        };
        const svg = composeCharacter(recipe, DEFAULT_STYLE, facing, CANVAS, 'normal', { badge: false });
        const baseline = composeCharacter({
          ...recipe,
          parts: { ...recipe.parts, accessories: [] },
        }, DEFAULT_STYLE, facing, CANVAS, 'normal', { badge: false });
        expectNoAdditionalCanvasOverflow(svg, baseline, `${hair.id}/${facing}`);
      }
    }
  });
});
