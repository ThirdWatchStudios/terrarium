import { describe, it, expect } from 'vitest';
import { defaultGoldenProject } from '../src/data/defaults';
import { createDefaultScene, type SceneRoom, type SceneState } from '../src/core/scene';
import { addBuildingSurround, removeBuildingSurround, classifyEdges } from '../src/core/buildingSurround';
import { sceneToLayoutJson, computeInteractionAnchors, insideTenant } from '../src/core/layout';

function baseScene(): { project: ReturnType<typeof defaultGoldenProject>; scene: SceneState } {
  const project = defaultGoldenProject();
  const scene = createDefaultScene(project);
  return { project, scene };
}

describe('building surround — ring generation', () => {
  it('grows the grid by 2*ring and records the tenant rect', () => {
    const { project, scene } = baseScene();
    const out = addBuildingSurround(scene, project, { ring: 2 });
    expect(out.cols).toBe(scene.cols + 4);
    expect(out.rows).toBe(scene.rows + 4);
    expect(out.tenantRect).toEqual({ x: 2, y: 2, cols: scene.cols, rows: scene.rows });
  });

  it('preserves the office content at the offset window', () => {
    const { project, scene } = baseScene();
    const out = addBuildingSurround(scene, project, { ring: 2 });
    for (let y = 0; y < scene.rows; y++) {
      for (let x = 0; x < scene.cols; x++) {
        expect(out.floorIds[y + 2][x + 2]).toBe(scene.floorIds[y][x]);
      }
    }
  });

  it('fills the ring floor with the lobby instance, leaving the exterior side void', () => {
    const { project, scene } = baseScene();
    const out = addBuildingSurround(scene, project, { ring: 2 });
    const { exterior } = classifyEdges(scene);
    // a ring cell on a non-exterior edge has lobby floor
    const lobbyId = 'floor-lobby-stone';
    const interiorRingCells: Array<[number, number]> = [];
    if (exterior !== 'south') interiorRingCells.push([out.cols >> 1, out.rows - 1]);
    if (exterior !== 'north') interiorRingCells.push([out.cols >> 1, 0]);
    for (const [x, y] of interiorRingCells) expect(out.floorIds[y][x]).toBe(lobbyId);
    // the exterior edge's outer row/col is floorless
    if (exterior === 'north') expect(out.floorIds[0][out.cols >> 1]).toBeNull();
    if (exterior === 'south') expect(out.floorIds[out.rows - 1][out.cols >> 1]).toBeNull();
  });

  it('sets a curtain wall on the exterior edge and demising walls elsewhere', () => {
    const { project, scene } = baseScene();
    const out = addBuildingSurround(scene, project, { ring: 2 });
    const { exterior } = classifyEdges(scene);
    const off = 2;
    const tr = out.tenantRect!;
    const perimeterCell = (edge: string): string | null => {
      const midX = off + (tr.cols >> 1);
      const midY = off + (tr.rows >> 1);
      if (edge === 'north') return out.wallIds[off][midX];
      if (edge === 'south') return out.wallIds[off + tr.rows - 1][midX];
      if (edge === 'west') return out.wallIds[midY][off];
      return out.wallIds[midY][off + tr.cols - 1];
    };
    expect(perimeterCell(exterior)).toBe('wall-curtain');
    // a non-exterior, non-corner perimeter cell is demising
    const others = ['north', 'east', 'south', 'west'].filter((e) => e !== exterior);
    expect(others.some((e) => perimeterCell(e) === 'wall-demising')).toBe(true);
  });

  it('adds surround props (incl. an elevator bank) outside the tenant rect', () => {
    const { project, scene } = baseScene();
    const before = scene.entities.length;
    const out = addBuildingSurround(scene, project, { ring: 2 });
    const surroundProps = out.entities.filter((e) => e.id.startsWith('surround-'));
    expect(surroundProps.length).toBeGreaterThan(0);
    expect(surroundProps.some((e) => e.refId === 'prop-elevator-bank')).toBe(true);
    // every surround prop sits in the ring, never inside the tenant rect
    const tr = out.tenantRect!;
    const inTenant = (x: number, y: number) => x >= tr.x && y >= tr.y && x < tr.x + tr.cols && y < tr.y + tr.rows;
    expect(surroundProps.every((e) => !inTenant(e.x, e.y))).toBe(true);
    // original office entities are preserved (shifted by the offset)
    const officeProps = out.entities.filter((e) => !e.id.startsWith('surround-'));
    expect(officeProps.length).toBe(before);
  });

  it('is idempotent — a scene that already has a tenant rect is returned unchanged', () => {
    const { project, scene } = baseScene();
    const once = addBuildingSurround(scene, project);
    const twice = addBuildingSurround(once, project);
    expect(twice).toBe(once);
  });

  it('removeBuildingSurround restores geometry, floors, interior walls and entities', () => {
    const { project, scene } = baseScene();
    const out = addBuildingSurround(scene, project, { ring: 2 });
    const back = removeBuildingSurround(out);
    expect(back.cols).toBe(scene.cols);
    expect(back.rows).toBe(scene.rows);
    expect(back.tenantRect).toBeUndefined();
    // floors round-trip exactly (the pass never overwrites tenant floors)
    expect(back.floorIds).toEqual(scene.floorIds);
    expect(back.entities.length).toBe(scene.entities.length);
    // walls: the pass intentionally restyles the tenant PERIMETER (officeWall →
    // demising/curtain, the building shell), so only the interior round-trips.
    for (let y = 1; y < scene.rows - 1; y++) {
      for (let x = 1; x < scene.cols - 1; x++) {
        expect(back.wallIds[y][x]).toBe(scene.wallIds[y][x]);
      }
    }
  });

  it('classifyEdges: defaults entrance to south, puts the exterior on the long axis', () => {
    const { scene } = baseScene();
    const { entrance, exterior } = classifyEdges(scene);
    expect(entrance).toBe('south');
    // default starter scene is wider than tall → exterior on a north/south edge
    expect(['north', 'south']).toContain(exterior);
    expect(exterior).not.toBe(entrance);
  });

  it('classifyEdges: a reception room pulls the entrance to its nearest edge', () => {
    const { scene } = baseScene();
    const rooms: SceneRoom[] = [{ id: 'reception', label: 'Reception', kind: 'reception', x: 0, y: 0, cols: 3, rows: 3 }];
    const withRoom: SceneState = { ...scene, rooms };
    const { entrance } = classifyEdges(withRoom);
    // reception in the top-left corner → entrance is north or west
    expect(['north', 'west']).toContain(entrance);
  });
});

describe('building surround — export (office-layout v4)', () => {
  it('emits version 4 with the tenant rect and the grown grid', () => {
    const { project, scene } = baseScene();
    const out = addBuildingSurround(scene, project, { ring: 2 });
    const layout = sceneToLayoutJson(out, project);
    expect(layout.version).toBe(4);
    expect(layout.cols).toBe(out.cols);
    expect(layout.rows).toBe(out.rows);
    expect(layout.tenantRect).toEqual({ x: 2, y: 2, cols: scene.cols, rows: scene.rows });
  });

  it('a surround-free scene exports tenantRect: null (whole grid playable)', () => {
    const { project, scene } = baseScene();
    const layout = sceneToLayoutJson(scene, project);
    expect(layout.tenantRect).toBeNull();
  });

  it('insideTenant: no rect ⇒ everywhere playable; with a rect ⇒ only inside', () => {
    const { scene } = baseScene();
    expect(insideTenant(scene, 0, 0)).toBe(true);
    const withRect: SceneState = { ...scene, tenantRect: { x: 2, y: 2, cols: 3, rows: 3 } };
    expect(insideTenant(withRect, 3, 3)).toBe(true); // inside
    expect(insideTenant(withRect, 0, 0)).toBe(false); // ring
    expect(insideTenant(withRect, 5, 5)).toBe(false); // just past the rect
  });

  it('ring props never become interaction anchors, tenant ones still do', () => {
    const { project, scene } = baseScene();
    const out = addBuildingSurround(scene, project, { ring: 2 });
    const tr = out.tenantRect!;
    // place the SAME interaction prop (water cooler) both inside the tenant and in the ring
    const cooler = project.props.find((p) => p.templateId === 'water-cooler')!.id;
    out.entities.push(
      { id: 'cooler-inside', kind: 'prop', x: tr.x + 1, y: tr.y + 1, refId: cooler, facing: 'south', mood: 'normal', rotation: 0 },
      { id: 'cooler-ring', kind: 'prop', x: 0, y: 0, refId: cooler, facing: 'south', mood: 'normal', rotation: 0 },
    );
    const anchors = computeInteractionAnchors(out, project);
    expect(anchors.some((a) => a.id === 'cooler-inside')).toBe(true);
    expect(anchors.some((a) => a.id === 'cooler-ring')).toBe(false);
  });
});
