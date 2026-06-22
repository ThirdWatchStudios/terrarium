import type { ProjectState } from './types';
import type { SceneEntity, SceneRoom, SceneState, SceneRotation } from './scene';

/**
 * Building surround — the "floor in a tower" non-playable border.
 * See docs/building-surround-model.md.
 *
 * `addBuildingSurround` is a pure transform: it grows a tenant office's grid by a
 * ring of "building" cells (shared elevator lobby / neighbor suites / service
 * spine) and records the playable `tenantRect`. The ring renders through the same
 * floor/wall/prop pipeline as the office, but carries no rooms/wings/anchors and
 * sits outside `tenantRect`, so the sim treats it as inert (the one exception is
 * walkability, which is floor-based — the sim clamps to `tenantRect`).
 *
 * The kit it places lives in src/tiles/templates.ts and src/props/templates.ts;
 * default instances are seeded in src/data/defaults.ts. Instance ids are resolved
 * with graceful fallback, so the pass degrades rather than throwing if the kit is
 * absent from a project.
 */

export type Edge = 'north' | 'east' | 'south' | 'west';

export interface SurroundInstances {
  demisingWallId: string;
  curtainWallId: string;
  lobbyFloorId: string;
  elevatorPropId: string;
  exitPropId: string;
  neighborGlassId: string;
  directoryPropId: string;
  fountainPropId: string;
  plantPropId: string;
  extinguisherPropId: string;
}

export interface SurroundOptions {
  /** Ring width in cells on every side (signed off at a fixed 2 — see the spec). */
  ring?: number;
  /** Override resolved instance ids (each falls back to the seeded default, then
   *  to the first instance of the right template, then is skipped). */
  instances?: Partial<SurroundInstances>;
}

const DEFAULT_RING = 2;

const DEFAULT_INSTANCES: SurroundInstances = {
  demisingWallId: 'wall-demising',
  curtainWallId: 'wall-curtain',
  lobbyFloorId: 'floor-lobby-stone',
  elevatorPropId: 'prop-elevator-bank',
  exitPropId: 'prop-exit-sign',
  neighborGlassId: 'prop-neighbor-glass',
  directoryPropId: 'prop-directory-placard',
  fountainPropId: 'prop-water-fountain',
  plantPropId: 'prop-office-plant',
  extinguisherPropId: 'prop-fire-extinguisher',
};

/** Resolve a wall/floor instance id, preferring `id`, then the first instance
 *  built from `templateId`, else null. */
function resolveTile(project: ProjectState, kind: 'walls' | 'floors', id: string, templateId: string): string | null {
  const pool = project[kind];
  return pool.find((t) => t.id === id)?.id ?? pool.find((t) => t.templateId === templateId)?.id ?? null;
}

function resolveProp(project: ProjectState, id: string, templateId: string): string | null {
  return project.props.find((p) => p.id === id)?.id ?? project.props.find((p) => p.templateId === templateId)?.id ?? null;
}

const grid = <T,>(cols: number, rows: number, value: T): T[][] =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => value));

/** Which tenant edge a room's centre sits closest to. */
function nearestEdge(room: SceneRoom, cols: number, rows: number): Edge {
  const cx = room.x + room.cols / 2;
  const cy = room.y + room.rows / 2;
  const d: Record<Edge, number> = {
    west: cx,
    east: cols - cx,
    north: cy,
    south: rows - cy,
  };
  return (Object.keys(d) as Edge[]).reduce((a, b) => (d[b] < d[a] ? b : a));
}

/**
 * Pick the entrance edge (where the elevator lobby goes) and the exterior edge
 * (where the curtain wall / skyline peek goes). Entrance = the edge nearest the
 * reception room (defaults to south); exterior = the longest edge that isn't the
 * entrance, so window offices line the building perimeter.
 */
export function classifyEdges(scene: SceneState): { entrance: Edge; exterior: Edge } {
  const reception = scene.rooms?.find((r) => (r.kind ?? r.id) === 'reception');
  const entrance: Edge = reception ? nearestEdge(reception, scene.cols, scene.rows) : 'south';
  const horizontalLonger = scene.cols >= scene.rows;
  // longest-axis edges, minus the entrance
  const longCandidates: Edge[] = horizontalLonger ? ['north', 'south'] : ['east', 'west'];
  const exterior = longCandidates.find((e) => e !== entrance) ?? (longCandidates[0] === entrance ? longCandidates[1] : longCandidates[0]) ?? 'north';
  return { entrance, exterior };
}

/**
 * Grow `scene` by a building-surround ring and return a NEW scene (the input is
 * not mutated). Idempotent guard: a scene that already has a `tenantRect` is
 * returned unchanged.
 */
export function addBuildingSurround(scene: SceneState, project: ProjectState, opts: SurroundOptions = {}): SceneState {
  if (scene.tenantRect) return scene;

  const ring = Math.max(1, Math.floor(opts.ring ?? DEFAULT_RING));
  const ids = { ...DEFAULT_INSTANCES, ...opts.instances };

  const demising = resolveTile(project, 'walls', ids.demisingWallId, 'demising-wall');
  const curtain = resolveTile(project, 'walls', ids.curtainWallId, 'curtain-wall') ?? demising;
  const lobby = resolveTile(project, 'floors', ids.lobbyFloorId, 'lobby-stone');

  const { cols: tCols, rows: tRows } = scene;
  const off = ring;
  const cols = tCols + 2 * ring;
  const rows = tRows + 2 * ring;

  // 1) allocate grown grids and copy the tenant office into the offset window
  const floorIds = grid<string | null>(cols, rows, null);
  const wallIds = grid<string | null>(cols, rows, null);
  for (let y = 0; y < tRows; y++) {
    for (let x = 0; x < tCols; x++) {
      floorIds[y + off][x + off] = scene.floorIds[y][x] ?? null;
      wallIds[y + off][x + off] = scene.wallIds[y][x] ?? null;
    }
  }

  // 2) shift entities, rooms, and the room-id grid into the offset window
  const entities: SceneEntity[] = scene.entities.map((e) => ({ ...e, x: e.x + off, y: e.y + off }));
  const rooms = scene.rooms?.map((r) => ({ ...r, x: r.x + off, y: r.y + off }));
  let roomIds: Array<Array<string | null>> | undefined;
  if (scene.roomIds) {
    roomIds = grid<string | null>(cols, rows, null);
    for (let y = 0; y < tRows; y++) for (let x = 0; x < tCols; x++) roomIds[y + off][x + off] = scene.roomIds[y][x] ?? null;
  }

  const tenantRect = { x: off, y: off, cols: tCols, rows: tRows };
  const { entrance, exterior } = classifyEdges(scene);

  // 3) tenant perimeter walls: exterior edge → curtain wall (the skyline peek);
  //    every other perimeter edge → demising wall. Kept solid (no functional
  //    suite door) so NPCs can't path into the ring even before the sim's
  //    tenantRect walkability clamp lands.
  const setPerimeter = (edge: Edge, wall: string | null) => {
    if (!wall) return;
    if (edge === 'north') for (let x = 0; x < tCols; x++) wallIds[off][x + off] = wall;
    if (edge === 'south') for (let x = 0; x < tCols; x++) wallIds[off + tRows - 1][x + off] = wall;
    if (edge === 'west') for (let y = 0; y < tRows; y++) wallIds[y + off][off] = wall;
    if (edge === 'east') for (let y = 0; y < tRows; y++) wallIds[y + off][off + tCols - 1] = wall;
  };
  for (const edge of ['north', 'east', 'south', 'west'] as Edge[]) {
    setPerimeter(edge, edge === exterior ? curtain : demising);
  }

  // 4) ring floors. Interior edges (lobby/neighbors) get lobby stone; the
  //    exterior edge is left floorless — beyond a curtain wall is outside the
  //    building (the dark void reads as "we're up high"). Corners follow their
  //    interior neighbours.
  const inRing = (x: number, y: number) => x < off || y < off || x >= off + tCols || y >= off + tRows;
  if (lobby) {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (!inRing(x, y)) continue;
        // skip the exterior side so it stays void
        if (exterior === 'north' && y < off) continue;
        if (exterior === 'south' && y >= off + tRows) continue;
        if (exterior === 'west' && x < off) continue;
        if (exterior === 'east' && x >= off + tCols) continue;
        floorIds[y][x] = lobby;
      }
    }
  }

  // 5) ring props, placed one cell outside the tenant edge facing the office.
  const addProp = (refId: string | null, x: number, y: number, rotation: SceneRotation = 0) => {
    if (!refId) return;
    entities.push({ id: `surround-${refId}-${x}-${y}`, kind: 'prop', x, y, refId, facing: 'south', mood: 'normal', rotation });
  };
  const elevator = resolveProp(project, ids.elevatorPropId, 'elevator-bank');
  const directory = resolveProp(project, ids.directoryPropId, 'directory-placard');
  const exit = resolveProp(project, ids.exitPropId, 'exit-sign');
  const neighbor = resolveProp(project, ids.neighborGlassId, 'neighbor-glass');
  const fountain = resolveProp(project, ids.fountainPropId, 'water-fountain');
  const plant = resolveProp(project, ids.plantPropId, 'office-plant');
  const extinguisher = resolveProp(project, ids.extinguisherPropId, 'fire-extinguisher');

  // the ring cell row/col just outside each tenant edge, and its rotation so
  // wall-slot props (plan) read as mounted on that edge
  const outside: Record<Edge, { fixed: number; rot: SceneRotation; horizontal: boolean }> = {
    north: { fixed: off - 1, rot: 180, horizontal: true },
    south: { fixed: off + tRows, rot: 0, horizontal: true },
    west: { fixed: off - 1, rot: 270, horizontal: false },
    east: { fixed: off + tCols, rot: 90, horizontal: false },
  };

  // entrance edge: elevator bank centred + a directory placard beside it
  const ent = outside[entrance];
  if (ent.horizontal) {
    const midX = off + Math.floor(tCols / 2);
    addProp(elevator, midX, ent.fixed, ent.rot);
    addProp(directory, Math.min(off + tCols - 1, midX + 2), ent.fixed, ent.rot);
  } else {
    const midY = off + Math.floor(tRows / 2);
    addProp(elevator, ent.fixed, midY, ent.rot);
    addProp(directory, ent.fixed, Math.min(off + tRows - 1, midY + 2), ent.rot);
  }

  // other interior edges: sprinkle neighbor glass / exit / service props along them
  const servicePalette = [neighbor, exit, fountain, plant, extinguisher];
  for (const edge of ['north', 'east', 'south', 'west'] as Edge[]) {
    if (edge === entrance || edge === exterior) continue;
    const o = outside[edge];
    const span = o.horizontal ? tCols : tRows;
    // place every ~3 cells, skipping the very corners
    let k = 0;
    for (let i = 1; i < span - 1; i += 3) {
      const refId = servicePalette[k % servicePalette.length];
      k++;
      if (o.horizontal) addProp(refId, off + i, o.fixed, o.rot);
      else addProp(refId, o.fixed, off + i, o.rot);
    }
  }

  return {
    ...scene,
    cols,
    rows,
    floorIds,
    wallIds,
    entities,
    rooms,
    roomIds,
    tenantRect,
  };
}

/** Remove a previously-added surround, returning the tenant office to its
 *  original extent. No-op if the scene has no `tenantRect`. Restores geometry,
 *  floors, interior walls and office entities; the tenant PERIMETER walls keep
 *  their building-shell styling (the pass overwrote them in place), so an
 *  add→remove cycle is lossless except for the outer wall material. */
export function removeBuildingSurround(scene: SceneState): SceneState {
  const tr = scene.tenantRect;
  if (!tr) return scene;
  const { x: off, y: offY, cols: tCols, rows: tRows } = tr;
  const floorIds = Array.from({ length: tRows }, (_, y) => scene.floorIds[y + offY].slice(off, off + tCols));
  const wallIds = Array.from({ length: tRows }, (_, y) => scene.wallIds[y + offY].slice(off, off + tCols));
  const inTenant = (x: number, y: number) => x >= off && y >= offY && x < off + tCols && y < offY + tRows;
  const entities = scene.entities
    .filter((e) => !e.id.startsWith('surround-') && inTenant(e.x, e.y))
    .map((e) => ({ ...e, x: e.x - off, y: e.y - offY }));
  const rooms = scene.rooms?.map((r) => ({ ...r, x: r.x - off, y: r.y - offY }));
  const roomIds = scene.roomIds
    ? Array.from({ length: tRows }, (_, y) => scene.roomIds![y + offY].slice(off, off + tCols))
    : undefined;
  const next: SceneState = { ...scene, cols: tCols, rows: tRows, floorIds, wallIds, entities, rooms, roomIds };
  delete next.tenantRect;
  return next;
}
