import { describe, expect, it } from 'vitest';

import { addBuildingSurround } from '../src/core/buildingSurround';
import { composeWallShapes, composeWallTile } from '../src/core/compositor';
import { CATEGORY_THEMES } from '../src/core/department';
import { wallAtlas } from '../src/core/exporter';
import { facilityCatalogJson } from '../src/core/layout';
import { migrateProject } from '../src/core/migrations';
import { createDefaultScene } from '../src/core/scene';
import {
  CORE_WALLS,
  DEFAULT_STYLE,
  DEFAULT_WALLS,
  RETIRED_WALLS,
  defaultProject,
} from '../src/data/defaults';
import { BLOB_CONFIGS } from '../src/tiles/blob';
import {
  CORE_WALL_TEMPLATE_IDS,
  CORE_WALL_TEMPLATES,
  RETIRED_WALL_TEMPLATE_IDS,
} from '../src/tiles/templates';

const CORE_INSTANCE_IDS = [
  'wall-office',
  'wall-cubicle',
  'wall-brick',
  'wall-panel',
  'wall-slat',
];

const RETIRED_INSTANCE_IDS = [
  'wall-glass',
  'wall-demising',
  'wall-curtain',
  'wall-living',
  'wall-branded',
];

function usedWalls(wallIds: Array<Array<string | null>>): Set<string> {
  return new Set(wallIds.flat().filter((id): id is string => id !== null));
}

describe('quiet wall production promotion', () => {
  it('ships five core walls while retaining the retired registry for legacy reads', () => {
    expect(CORE_WALL_TEMPLATE_IDS).toEqual([
      'office-wall',
      'brick-wall',
      'panel-wall',
      'cubicle-partition',
      'slat-wall',
    ]);
    expect(CORE_WALL_TEMPLATES.map(({ id }) => id)).toEqual(CORE_WALL_TEMPLATE_IDS);
    expect(RETIRED_WALL_TEMPLATE_IDS).toEqual([
      'glass-partition',
      'curtain-wall',
      'demising-wall',
      'living-wall',
      'branded-wall',
    ]);
    expect(CORE_WALLS.map(({ id }) => id)).toEqual(CORE_INSTANCE_IDS);
    expect(RETIRED_WALLS.map(({ id }) => id)).toEqual(RETIRED_INSTANCE_IDS);
    expect(DEFAULT_WALLS).toHaveLength(10);
  });

  it('uses the approved palettes in the normal new-project inventory', () => {
    expect(Object.fromEntries(CORE_WALLS.map(({ id, palette }) => [id, palette])))
      .toEqual({
        'wall-office': { primary: '#85867F', secondary: '#B0AEA5', accent: '#999A92' },
        'wall-cubicle': { primary: '#6D777D', secondary: '#99A3A8', accent: '#808A90' },
        'wall-brick': { primary: '#745146', secondary: '#A86D5A', accent: '#8D5E50' },
        'wall-panel': { primary: '#66655F', secondary: '#94928A', accent: '#7D7C75' },
        'wall-slat': { primary: '#705643', secondary: '#9C7658', accent: '#83654E' },
      });
    expect(defaultProject().walls.map(({ id }) => id)).toEqual(CORE_INSTANCE_IDS);
  });

  it('routes all 47 masks through topology-only material face construction', () => {
    const scaledStyle = {
      ...DEFAULT_STYLE,
      outline: {
        ...DEFAULT_STYLE.outline,
        width: DEFAULT_STYLE.outline.width * 0.7,
      },
    };
    for (const wall of CORE_WALLS) {
      const template = CORE_WALL_TEMPLATES.find(({ id }) => id === wall.templateId)!;
      for (const mask of BLOB_CONFIGS) {
        const shapes = template.build(mask, wall.params, wall.palette);
        expect(shapes[0]).toMatchObject({ fill: '#323431' });
        expect(shapes[1]).toMatchObject({ fill: '$primary', silhouette: false });
        expect(composeWallTile(wall, DEFAULT_STYLE, mask, 128)).toBe(
          composeWallShapes(shapes, wall, scaledStyle, 128),
        );
      }
    }
  });

  it('emits topology-only atlases with no contextual inside-facing metadata', () => {
    for (const wall of CORE_WALLS) {
      const atlas = wallAtlas(wall, DEFAULT_STYLE, 1);
      expect(atlas.meta).toMatchObject({ orientation: 'topology-only' });
      expect(atlas.meta).not.toHaveProperty('contextualFacing');
    }
  });

  it('keeps retired walls out of starter scenes, generated surrounds, and department themes', () => {
    const project = defaultProject();
    expect([...usedWalls(project.scene!.wallIds)].some((id) => RETIRED_INSTANCE_IDS.includes(id)))
      .toBe(false);

    const starter = createDefaultScene(project);
    const surrounded = addBuildingSurround(starter, project);
    expect([...usedWalls(surrounded.wallIds)].some((id) => RETIRED_INSTANCE_IDS.includes(id)))
      .toBe(false);

    const generatedThemeWalls = Object.values(CATEGORY_THEMES)
      .map(({ wall }) => wall)
      .filter((wall): wall is string => wall !== undefined);
    expect(generatedThemeWalls.some((id) => RETIRED_INSTANCE_IDS.includes(id))).toBe(false);

    const buildableWalls = facilityCatalogJson().facilities
      .filter(({ kind }) => kind === 'Wall')
      .map(({ propId }) => propId);
    expect(buildableWalls).toEqual(CORE_WALL_TEMPLATE_IDS);
  });

  it('backfills only the core set without deleting legacy wall instances', () => {
    const project = defaultProject();
    project.walls = [structuredClone(RETIRED_WALLS[0])];
    const migrated = migrateProject(project);
    expect(migrated).not.toBeNull();
    expect(migrated!.walls.map(({ id }) => id)).toEqual([
      'wall-glass',
      ...CORE_INSTANCE_IDS,
    ]);
  });
});
