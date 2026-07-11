import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';

import { composeCharacter, propLayers } from '../src/core/compositor';
import { generateEmployee, generationProfiles } from '../src/core/employee';
import { EXPORT_SCALES, propLayerManifest } from '../src/core/exporter';
import { facilityCatalogJson, INTERACTION_PROP_TYPES } from '../src/core/layout';
import { mulberry32, randomCharacter } from '../src/core/random';
import type { PropInstance, ShapeSpec } from '../src/core/types';
import { CANVAS, FACINGS } from '../src/core/types';
import {
  CONSTRUCTION_CREW,
  DEFAULT_PROPS,
  DEFAULT_STYLE,
  DEFAULT_STYLE_PRESETS,
} from '../src/data/defaults';
import { getPart, partsForSlot } from '../src/parts/library';
import { POSES } from '../src/parts/poses';
import { PROP_TEMPLATES } from '../src/props/templates';

const FAB_PART_IDS = ['head-fab', 'outfit-fab-chassis'] as const;
const IRIS_GREEN = '#5BE08A';

function defaultProp(id: string): PropInstance {
  const prop = DEFAULT_PROPS.find((candidate) => candidate.id === id);
  if (!prop) throw new Error(`Missing default prop ${id}`);
  return prop;
}

function propTemplate(id: string) {
  const template = PROP_TEMPLATES.find((candidate) => candidate.id === id);
  if (!template) throw new Error(`Missing prop template ${id}`);
  return template;
}

function silhouette(shapes: ShapeSpec[]): ShapeSpec[] {
  return shapes.filter((shape) => shape.silhouette !== false);
}

interface RenderCell {
  label: string;
  svg: string;
}

function svgInner(svg: string): string {
  return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

/** Rasterize one compact review grid, then report cells that paint the canvas edge. */
function clippedCells(cells: RenderCell[], cellSize: number, cols: number): string[] {
  const gap = 2;
  const rows = Math.ceil(cells.length / cols);
  const width = cols * (cellSize + gap) + gap;
  const height = rows * (cellSize + gap) + gap;
  const body = cells.map((cell, index) => {
    const x = gap + (index % cols) * (cellSize + gap);
    const y = gap + Math.floor(index / cols) * (cellSize + gap);
    return `<g transform="translate(${x} ${y}) scale(${cellSize / CANVAS})">${svgInner(cell.svg)}</g>`;
  }).join('');
  const grid = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;
  const png = PNG.sync.read(new Resvg(grid).render().asPng());
  const alphaAt = (x: number, y: number) => png.data[(y * png.width + x) * 4 + 3];
  const clipped: string[] = [];

  cells.forEach((cell, index) => {
    const x0 = gap + (index % cols) * (cellSize + gap);
    const y0 = gap + Math.floor(index / cols) * (cellSize + gap);
    const x1 = x0 + cellSize - 1;
    const y1 = y0 + cellSize - 1;
    let touches = false;
    for (let x = x0; x <= x1 && !touches; x++) {
      touches = alphaAt(x, y0) > 0 || alphaAt(x, y1) > 0;
    }
    for (let y = y0; y <= y1 && !touches; y++) {
      touches = alphaAt(x0, y) > 0 || alphaAt(x1, y) > 0;
    }
    if (touches) clipped.push(cell.label);
  });

  return clipped;
}

describe('IRIS fabrication parts and construction crew', () => {
  it('keeps fabrication parts resolvable but out of authoring and generation pools', () => {
    expect(getPart('head-fab')).toMatchObject({ slot: 'head', noFace: true });
    expect(getPart('outfit-fab-chassis')).toMatchObject({ slot: 'outfit' });
    expect(partsForSlot('head').map(({ id }) => id)).not.toContain('head-fab');
    expect(partsForSlot('outfit').map(({ id }) => id)).not.toContain('outfit-fab-chassis');
  });

  it('never leaks fabrication-only parts through random or seeded employee generation', () => {
    for (let seed = 0; seed < 256; seed++) {
      const first = randomCharacter(DEFAULT_STYLE, mulberry32(seed));
      const second = randomCharacter(DEFAULT_STYLE, mulberry32(seed));
      expect({ name: first.name, parts: first.parts, palette: first.palette }, `random seed ${seed}`)
        .toEqual({ name: second.name, parts: second.parts, palette: second.palette });
      expect(FAB_PART_IDS, `random seed ${seed} head`).not.toContain(first.parts.head);
      expect(FAB_PART_IDS, `random seed ${seed} outfit`).not.toContain(first.parts.outfit);
    }

    for (const profile of generationProfiles()) {
      for (let seed = 0; seed < 64; seed++) {
        const visualSeed = `iris-leak-${profile.id}-${seed}`;
        const first = generateEmployee(visualSeed, profile.id, DEFAULT_STYLE);
        const second = generateEmployee(visualSeed, profile.id, DEFAULT_STYLE);
        expect(first, `${profile.id}/${seed} employee determinism`).toEqual(second);
        expect(FAB_PART_IDS, `${profile.id}/${seed} employee head`)
          .not.toContain(first.recipe.parts.head);
        expect(FAB_PART_IDS, `${profile.id}/${seed} employee outfit`)
          .not.toContain(first.recipe.parts.outfit);
      }
    }
  });

  it('pins the construction persona to the approved production rig and machine-only parts', () => {
    expect(CONSTRUCTION_CREW).toHaveLength(1);
    expect(CONSTRUCTION_CREW[0]).toMatchObject({
      id: 'construction-worker',
      name: 'IRIS Fabrication Unit',
      parts: {
        body: 'body-large-frame',
        head: 'head-fab',
        hair: 'hair-none',
        outfit: 'outfit-fab-chassis',
        accessories: [],
      },
    });
  });

  it('renders every construction pose and facing deterministically without clipping', () => {
    const facings = [...FACINGS, 'west'] as const;
    for (const preset of DEFAULT_STYLE_PRESETS) {
      const cells: RenderCell[] = [];
      for (const pose of POSES) {
        for (const facing of facings) {
          const label = `${preset.id}/${pose}/${facing}`;
          const first = composeCharacter(
            CONSTRUCTION_CREW[0],
            preset.style,
            facing,
            CANVAS,
            'normal',
            { badge: false, pose },
          );
          const second = composeCharacter(
            CONSTRUCTION_CREW[0],
            preset.style,
            facing,
            CANVAS,
            'normal',
            { badge: false, pose },
          );
          expect(first, `${label} is nondeterministic`).toBe(second);
          expect(first, `${label} has invalid geometry`).not.toMatch(/NaN|undefined/);
          expect(first.toUpperCase(), `${label} has an unresolved palette token`).not.toContain('#FF00FF');
          cells.push({ label, svg: first });
        }
      }
      expect(cells).toHaveLength(POSES.length * facings.length);
      expect(clippedCells(cells, 64, 12), `${preset.id} construction crew clipping`).toEqual([]);
    }
  });
});

describe('IRIS installation unit and charging dock contracts', () => {
  const live = defaultProp('prop-iris-installation-unit');
  const dormant = defaultProp('prop-iris-installation-unit-dormant');
  const dock = defaultProp('prop-iris-charging-dock');
  const liveTemplate = propTemplate('iris-installation-unit');
  const dormantTemplate = propTemplate('iris-installation-unit-dormant');

  it('keeps stable default ids, projections, footprints, catalog role, and interaction id', () => {
    expect([live, dormant, dock].map(({ id, templateId }) => ({ id, templateId }))).toEqual([
      { id: 'prop-iris-installation-unit', templateId: 'iris-installation-unit' },
      { id: 'prop-iris-installation-unit-dormant', templateId: 'iris-installation-unit-dormant' },
      { id: 'prop-iris-charging-dock', templateId: 'iris-charging-dock' },
    ]);

    expect(PROP_TEMPLATES.filter(({ id }) => id.startsWith('iris-')).map((template) => ({
      id: template.id,
      projection: template.projection,
      footprint: template.footprint,
      gridFootprint: template.gridFootprint,
    }))).toEqual([
      {
        id: 'iris-installation-unit',
        projection: 'elevation',
        footprint: { cx: 64, cy: 117, rx: 46, ry: 5 },
        gridFootprint: { w: 2, h: 1 },
      },
      {
        id: 'iris-installation-unit-dormant',
        projection: 'elevation',
        footprint: { cx: 64, cy: 117, rx: 46, ry: 5 },
        gridFootprint: { w: 2, h: 1 },
      },
      {
        id: 'iris-charging-dock',
        projection: 'plan',
        footprint: undefined,
        gridFootprint: { w: 1, h: 1 },
      },
    ]);

    expect(Object.entries(INTERACTION_PROP_TYPES).filter(([id]) => id.startsWith('iris-')))
      .toEqual([['iris-installation-unit', 'iris_console']]);
    const catalog = facilityCatalogJson();
    expect(catalog.facilities.filter(({ propId }) => propId.startsWith('iris-'))).toEqual([
      {
        id: 'iris_installation_unit',
        displayName: 'IRIS installation unit',
        kind: 'AnchoredFacility',
        gridFootprint: { w: 2, h: 1 },
        gridPivot: { x: 0.5, y: 0.5 },
        propId: 'iris-installation-unit',
        placement: 'floor',
        rotatable: false,
        blocksWalk: true,
        isInteractionAnchor: true,
        interactionType: 'iris_console',
        needsSatisfied: null,
      },
    ]);
  });

  it('keeps live and dormant silhouettes identical at every authored rack-height boundary', () => {
    for (const height of [78, 90, 98]) {
      const liveShapes = liveTemplate.build({ height }, live.palette);
      const dormantShapes = dormantTemplate.build({ height }, dormant.palette);
      expect(silhouette(liveShapes), `height ${height} silhouette drift`)
        .toEqual(silhouette(dormantShapes));
      expect(silhouette(liveShapes), `height ${height} silhouette budget`).toHaveLength(4);
      expect(JSON.stringify(liveShapes).toUpperCase(), `height ${height} active state`).toContain(IRIS_GREEN);
      expect(JSON.stringify(dormantShapes).toUpperCase(), `height ${height} dormant state`)
        .not.toContain(IRIS_GREEN);
    }
  });

  it('keeps re-tint layer runs compact and every exported atlas below Unity limits', () => {
    const cases = [
      ...[78, 90, 98].flatMap((height) => [
        { prop: { ...live, params: { height } }, keys: ['shadow', 'outline', 'primary', 'literal-0', 'secondary', 'literal-1'] },
        { prop: { ...dormant, params: { height } }, keys: ['shadow', 'outline', 'primary', 'literal-0', 'secondary', 'literal-1'] },
      ]),
      { prop: dock, keys: ['outline', 'primary', 'secondary', 'literal-0'] },
    ];

    for (const { prop, keys } of cases) {
      const layers = propLayers(prop, DEFAULT_STYLE);
      expect(layers.map(({ key }) => key), `${prop.id} layer runs`).toEqual(keys);
      for (const scale of EXPORT_SCALES) {
        const manifest = propLayerManifest(prop, DEFAULT_STYLE, scale);
        const atlasHeight = Math.max(
          0,
          ...Object.values(manifest.frames).map(({ y, h }) => y + h),
        );
        expect(atlasHeight, `${prop.id}@${scale}x atlas height`)
          .toBe(layers.length * CANVAS * scale);
        expect(atlasHeight, `${prop.id}@${scale}x exceeds Unity's texture ceiling`)
          .toBeLessThanOrEqual(8192);
      }
    }
  });
});
