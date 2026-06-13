import type { CharacterRecipe, Mood, ProjectState, PropInstance } from './types';
import type { SceneFacing, SceneRoom, SceneRotation, SceneState } from './scene';
import { WALL_BITS } from './types';
import type { Rng } from './random';
import { mulberry32, randomCharacter } from './random';
import { PROP_TEMPLATES } from '../props/templates';

export const GENERATED_COWORKER_PREFIX = 'layout-coworker-';

type RoomId = 'reception' | 'manager-office' | 'break-room' | 'conference-room' | 'cubicle-farm' | 'hallway';

interface RoomSpec extends SceneRoom {
  id: RoomId;
}

interface LayoutTemplate {
  id: string;
  label: string;
  rooms: RoomSpec[];
  doors: Array<[number, number]>;
}

export interface GeneratedOfficeLayout {
  scene: SceneState;
  coworkers: CharacterRecipe[];
  seed: number;
  templateId: string;
}

export interface SceneLayoutJson {
  version: 1;
  source: SceneState['source'];
  generated: { templateId: string; seed: number } | null;
  cols: number;
  rows: number;
  rooms: SceneRoom[];
  roomGrid: Array<Array<string | null>>;
  floors: Array<Array<string | null>>;
  walls: {
    grid: Array<Array<string | null>>;
    cells: Array<{ x: number; y: number; wallId: string; mask: number }>;
  };
  props: Array<{
    id: string;
    propId: string;
    templateId: string | null;
    name: string;
    x: number;
    y: number;
    rotation: SceneRotation;
    projection: 'plan' | 'elevation';
  }>;
  characterSpawns: Array<{
    id: string;
    characterId: string;
    name: string;
    x: number;
    y: number;
    facing: SceneFacing;
    mood: Mood;
    generatedCoworker: boolean;
  }>;
}

const COLS = 22;
const ROWS = 14;

/**
 * Layout templates use INCLUSIVE shared-edge rects: adjacent rooms overlap by
 * one tile on their boundary, so both draw their perimeter onto the SAME wall
 * line. Never leave a one-tile gap between rooms — that's how double walls
 * happen.
 */
const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    id: 'cross-hall',
    label: 'Cross hall',
    rooms: [
      { id: 'reception', label: 'Reception', x: 0, y: 0, cols: 7, rows: 7 },
      { id: 'cubicle-farm', label: 'Cubicle farm', x: 6, y: 0, cols: 10, rows: 7 },
      { id: 'manager-office', label: 'Manager office', x: 15, y: 0, cols: 7, rows: 7 },
      { id: 'hallway', label: 'Hallway', x: 0, y: 6, cols: 22, rows: 4 },
      { id: 'break-room', label: 'Break room', x: 0, y: 9, cols: 9, rows: 5 },
      { id: 'conference-room', label: 'Conference room', x: 8, y: 9, cols: 14, rows: 5 },
    ],
    doors: [
      [3, 6],
      [10, 6],
      [18, 6],
      [4, 9],
      [14, 9],
      [6, 3],
    ],
  },
  {
    id: 'vertical-core',
    label: 'Vertical core',
    rooms: [
      { id: 'reception', label: 'Reception', x: 0, y: 0, cols: 8, rows: 8 },
      { id: 'hallway', label: 'Hallway', x: 7, y: 0, cols: 5, rows: 14 },
      { id: 'cubicle-farm', label: 'Cubicle farm', x: 11, y: 0, cols: 11, rows: 9 },
      { id: 'break-room', label: 'Break room', x: 0, y: 7, cols: 8, rows: 7 },
      { id: 'conference-room', label: 'Conference room', x: 11, y: 8, cols: 6, rows: 6 },
      { id: 'manager-office', label: 'Manager office', x: 16, y: 8, cols: 6, rows: 6 },
    ],
    doors: [
      [7, 3],
      [11, 4],
      [7, 10],
      [11, 11],
      [16, 11],
      [14, 8],
    ],
  },
  {
    id: 'north-suite',
    label: 'North suite',
    rooms: [
      { id: 'reception', label: 'Reception', x: 0, y: 0, cols: 8, rows: 8 },
      { id: 'manager-office', label: 'Manager office', x: 7, y: 0, cols: 7, rows: 8 },
      { id: 'break-room', label: 'Break room', x: 13, y: 0, cols: 9, rows: 8 },
      { id: 'hallway', label: 'Hallway', x: 0, y: 7, cols: 22, rows: 3 },
      { id: 'cubicle-farm', label: 'Cubicle farm', x: 0, y: 9, cols: 14, rows: 5 },
      { id: 'conference-room', label: 'Conference room', x: 13, y: 9, cols: 9, rows: 5 },
    ],
    doors: [
      [3, 7],
      [10, 7],
      [17, 7],
      [5, 9],
      [11, 9],
      [17, 9],
    ],
  },
  {
    id: 'wide-front',
    label: 'Wide front',
    rooms: [
      { id: 'reception', label: 'Reception', x: 0, y: 0, cols: 10, rows: 7 },
      { id: 'cubicle-farm', label: 'Cubicle farm', x: 9, y: 0, cols: 9, rows: 7 },
      { id: 'break-room', label: 'Break room', x: 17, y: 0, cols: 5, rows: 7 },
      { id: 'hallway', label: 'Hallway', x: 0, y: 6, cols: 22, rows: 4 },
      { id: 'conference-room', label: 'Conference room', x: 0, y: 9, cols: 12, rows: 5 },
      { id: 'manager-office', label: 'Manager office', x: 11, y: 9, cols: 11, rows: 5 },
    ],
    doors: [
      [4, 6],
      [13, 6],
      [19, 6],
      [6, 9],
      [16, 9],
      [9, 3],
    ],
  },
];

const COWORKER_DEPARTMENTS = ['Accounting', 'HR', 'Facilities', 'Operations', 'Sales', 'IT'];
const ROTATIONS: SceneRotation[] = [0, 90, 180, 270];
const FACINGS: SceneFacing[] = ['south', 'east', 'north', 'west'];
const AMBIENT_MOODS: Mood[] = ['normal', 'confused', 'curious', 'suspicious'];

function grid<T>(cols: number, rows: number, value: T): T[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => value));
}

function byPreferredId<T extends { id: string }>(items: T[], preferred: string, fallbackIndex = 0): T | undefined {
  return items.find((item) => item.id === preferred) ?? items[fallbackIndex];
}

function pick<T>(rng: Rng, items: T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function chance(rng: Rng, probability: number): boolean {
  return rng() < probability;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function propBy(project: ProjectState, preferredId: string, templateId: string): PropInstance | undefined {
  return project.props.find((prop) => prop.id === preferredId) ?? project.props.find((prop) => prop.templateId === templateId);
}

function propProjection(prop: PropInstance | undefined): 'plan' | 'elevation' {
  return PROP_TEMPLATES.find((template) => template.id === prop?.templateId)?.projection ?? 'elevation';
}

function roomGrid(rooms: RoomSpec[]): Array<Array<string | null>> {
  const cells = grid<string | null>(COLS, ROWS, null);
  for (const room of rooms) {
    for (let y = room.y; y < room.y + room.rows; y++) {
      for (let x = room.x; x < room.x + room.cols; x++) cells[y][x] = room.id;
    }
  }
  return cells;
}

function fillFloor(scene: SceneState, roomId: RoomId, floorId: string | null): void {
  if (!floorId) return;
  for (let y = 0; y < scene.rows; y++) {
    for (let x = 0; x < scene.cols; x++) {
      if (scene.roomIds?.[y]?.[x] === roomId) scene.floorIds[y][x] = floorId;
    }
  }
}

function setWall(scene: SceneState, x: number, y: number, wallId: string | null): void {
  if (!wallId || x < 0 || y < 0 || x >= scene.cols || y >= scene.rows) return;
  scene.wallIds[y][x] = wallId;
}

function wallLine(scene: SceneState, x1: number, y1: number, x2: number, y2: number, wallId: string | null): void {
  const dx = Math.sign(x2 - x1);
  const dy = Math.sign(y2 - y1);
  let x = x1;
  let y = y1;
  setWall(scene, x, y, wallId);
  while (x !== x2 || y !== y2) {
    x += dx;
    y += dy;
    setWall(scene, x, y, wallId);
  }
}

function clearWall(scene: SceneState, x: number, y: number): void {
  if (scene.wallIds[y]?.[x]) scene.wallIds[y][x] = null;
}

function wallAt(scene: SceneState, x: number, y: number): boolean {
  return Boolean(scene.wallIds[y]?.[x]);
}

function roomById(rooms: RoomSpec[], id: RoomId): RoomSpec {
  return rooms.find((room) => room.id === id)!;
}

function wallForRoom(room: RoomSpec, officeWall: string | null, glassWall: string | null): string | null {
  if (room.id === 'manager-office' || room.id === 'conference-room') return glassWall ?? officeWall;
  return officeWall;
}

function drawRoomWalls(
  scene: SceneState,
  rooms: RoomSpec[],
  officeWall: string | null,
  glassWall: string | null,
): void {
  wallLine(scene, 0, 0, COLS - 1, 0, officeWall);
  wallLine(scene, 0, ROWS - 1, COLS - 1, ROWS - 1, officeWall);
  wallLine(scene, 0, 0, 0, ROWS - 1, officeWall);
  wallLine(scene, COLS - 1, 0, COLS - 1, ROWS - 1, officeWall);

  for (const room of rooms) {
    const wall = wallForRoom(room, officeWall, glassWall);
    wallLine(scene, room.x, room.y, room.x + room.cols - 1, room.y, wall);
    wallLine(scene, room.x, room.y + room.rows - 1, room.x + room.cols - 1, room.y + room.rows - 1, wall);
    wallLine(scene, room.x, room.y, room.x, room.y + room.rows - 1, wall);
    wallLine(scene, room.x + room.cols - 1, room.y, room.x + room.cols - 1, room.y + room.rows - 1, wall);
  }
}

function clearDoorways(scene: SceneState, template: LayoutTemplate, rng: Rng): void {
  for (const [x, y] of template.doors) {
    clearWall(scene, x, y);
    if (!chance(rng, 0.35)) continue;
    // widen along the wall run, never across it, and never into a junction
    const widen = (tx: number, ty: number, horizontal: boolean) => {
      const perpClear = horizontal ? !wallAt(scene, tx, ty - 1) && !wallAt(scene, tx, ty + 1) : !wallAt(scene, tx - 1, ty) && !wallAt(scene, tx + 1, ty);
      if (wallAt(scene, tx, ty) && perpClear) clearWall(scene, tx, ty);
    };
    if (wallAt(scene, x - 1, y) && wallAt(scene, x + 1, y)) widen(x + (chance(rng, 0.5) ? -1 : 1), y, true);
    else if (wallAt(scene, x, y - 1) && wallAt(scene, x, y + 1)) widen(x, y + (chance(rng, 0.5) ? -1 : 1), false);
  }
}

function wallMask(scene: SceneState, x: number, y: number): number {
  return (
    (wallAt(scene, x, y - 1) ? WALL_BITS.N : 0) |
    (wallAt(scene, x + 1, y) ? WALL_BITS.E : 0) |
    (wallAt(scene, x, y + 1) ? WALL_BITS.S : 0) |
    (wallAt(scene, x - 1, y) ? WALL_BITS.W : 0)
  );
}

function entityAt(scene: SceneState, x: number, y: number): boolean {
  return scene.entities.some((entity) => entity.x === x && entity.y === y);
}

function isBlocked(scene: SceneState, x: number, y: number): boolean {
  return wallAt(scene, x, y) || entityAt(scene, x, y);
}

function interior(room: RoomSpec): { x0: number; x1: number; y0: number; y1: number } {
  return {
    x0: room.x + 1,
    x1: room.x + room.cols - 2,
    y0: room.y + 1,
    y1: room.y + room.rows - 2,
  };
}

function cellAt(room: RoomSpec, rx: number, ry: number): { x: number; y: number } {
  const box = interior(room);
  return {
    x: clamp(Math.round(box.x0 + (box.x1 - box.x0) * rx), box.x0, box.x1),
    y: clamp(Math.round(box.y0 + (box.y1 - box.y0) * ry), box.y0, box.y1),
  };
}

function findOpenNear(
  scene: SceneState,
  room: RoomSpec,
  origin: { x: number; y: number },
  rng: Rng,
  radius = 2,
): { x: number; y: number } | undefined {
  const box = interior(room);
  const candidates: Array<{ x: number; y: number }> = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const x = clamp(origin.x + dx, box.x0, box.x1);
      const y = clamp(origin.y + dy, box.y0, box.y1);
      if (!candidates.some((cell) => cell.x === x && cell.y === y) && !isBlocked(scene, x, y)) {
        candidates.push({ x, y });
      }
    }
  }
  if (candidates.length === 0) return undefined;
  candidates.sort((a, b) => Math.abs(a.x - origin.x) + Math.abs(a.y - origin.y) - (Math.abs(b.x - origin.x) + Math.abs(b.y - origin.y)));
  const top = candidates.slice(0, Math.min(4, candidates.length));
  return pick(rng, top);
}

function addProp(
  scene: SceneState,
  project: ProjectState,
  key: string,
  preferredId: string,
  templateId: string,
  x: number,
  y: number,
  rotation: SceneRotation = 0,
): void {
  const prop = propBy(project, preferredId, templateId);
  if (!prop || isBlocked(scene, x, y)) return;
  scene.entities.push({
    id: `generated-prop-${key}-${x}-${y}`,
    kind: 'prop',
    x,
    y,
    refId: prop.id,
    facing: 'south',
    mood: 'normal',
    rotation,
  });
}

function addPropNear(
  scene: SceneState,
  project: ProjectState,
  room: RoomSpec,
  key: string,
  preferredId: string,
  templateId: string,
  rx: number,
  ry: number,
  rng: Rng,
  rotation: SceneRotation = 0,
): void {
  const cell = findOpenNear(scene, room, cellAt(room, rx, ry), rng);
  if (cell) addProp(scene, project, key, preferredId, templateId, cell.x, cell.y, rotation);
}

/** Place a character. Seats (office chairs) are allowed; other props block. */
function addCharacter(
  scene: SceneState,
  project: ProjectState,
  recipe: CharacterRecipe | undefined,
  x: number,
  y: number,
  mood: Mood,
  facing: SceneFacing,
): void {
  if (!recipe || wallAt(scene, x, y)) return;
  const occupant = scene.entities.find((entity) => entity.x === x && entity.y === y);
  if (occupant?.kind === 'character') return;
  if (occupant && project.props.find((p) => p.id === occupant.refId)?.templateId !== 'office-chair') return;
  scene.entities.push({
    id: `generated-character-${recipe.id}-${x}-${y}`,
    kind: 'character',
    x,
    y,
    refId: recipe.id,
    facing,
    mood,
    rotation: 0,
  });
}

function openCells(scene: SceneState): Array<{ x: number; y: number }> {
  const cells: Array<{ x: number; y: number }> = [];
  for (let y = 1; y < scene.rows - 1; y++) {
    for (let x = 1; x < scene.cols - 1; x++) {
      if (!isBlocked(scene, x, y)) cells.push({ x, y });
    }
  }
  return cells;
}

/**
 * Pick a spawn cell: open floor in the preferred room, then any open floor,
 * then an unoccupied office chair (sitting). Never deletes furniture.
 */
function pickSpawnCell(
  scene: SceneState,
  project: ProjectState,
  rng: Rng,
  preferredRoom?: RoomId,
): { x: number; y: number } | undefined {
  const open = openCells(scene);
  const inRoom = open.filter((cell) => !preferredRoom || scene.roomIds?.[cell.y]?.[cell.x] === preferredRoom);
  if (inRoom.length > 0) return pick(rng, inRoom);
  if (open.length > 0) return pick(rng, open);

  const seats = scene.entities.filter(
    (entity) =>
      entity.kind === 'prop' &&
      project.props.find((p) => p.id === entity.refId)?.templateId === 'office-chair' &&
      !scene.entities.some((other) => other.kind === 'character' && other.x === entity.x && other.y === entity.y),
  );
  return seats.length > 0 ? pick(rng, seats) : undefined;
}

function spawnCharacter(
  scene: SceneState,
  project: ProjectState,
  recipe: CharacterRecipe | undefined,
  preferredRoom: RoomId,
  mood: Mood,
  facing: SceneFacing,
  rng: Rng,
): void {
  const cell = pickSpawnCell(scene, project, rng, preferredRoom);
  if (cell) addCharacter(scene, project, recipe, cell.x, cell.y, mood, facing);
}

function createGeneratedCoworkers(project: ProjectState, count: number, rng: Rng, seed: number): CharacterRecipe[] {
  return Array.from({ length: Math.max(0, Math.min(12, Math.floor(count))) }, (_, index) => {
    const recipe = randomCharacter(project.style, rng);
    const department = COWORKER_DEPARTMENTS[index % COWORKER_DEPARTMENTS.length];
    return {
      ...recipe,
      id: `${GENERATED_COWORKER_PREFIX}${seed.toString(36)}-${index + 1}`,
      name: `${recipe.name} from ${department}`,
    };
  });
}

function furnishReception(scene: SceneState, project: ProjectState, room: RoomSpec, rng: Rng): void {
  addPropNear(scene, project, room, 'reception-desk', 'prop-reception-desk', 'reception-desk', 0.3, 0.4, rng, pick(rng, ROTATIONS));
  if (chance(rng, 0.8)) addPropNear(scene, project, room, 'reception-plant', 'prop-office-plant', 'office-plant', 0.85, 0.2, rng);
  if (chance(rng, 0.45)) addPropNear(scene, project, room, 'reception-printer', 'prop-printer', 'printer', 0.75, 0.8, rng);
}

function furnishManagerOffice(scene: SceneState, project: ProjectState, room: RoomSpec, rng: Rng): SeatCell | undefined {
  const box = interior(room);
  // desk against the top wall, monitor facing into the room; the chair sits
  // south of the desk, so its backrest stays south (rotation 0), occupant faces north
  const deskX = clamp(Math.round((box.x0 + box.x1) / 2), box.x0, box.x1);
  addProp(scene, project, 'manager-desk', 'prop-desk', 'desk', deskX, box.y0, 180);
  addProp(scene, project, 'manager-chair', 'prop-office-chair', 'office-chair', deskX, box.y0 + 1, 0);
  if (chance(rng, 0.72)) addPropNear(scene, project, room, 'manager-files', 'prop-filing-cabinet', 'filing-cabinet', 0.9, 0.2, rng);
  if (chance(rng, 0.5)) addPropNear(scene, project, room, 'manager-plant', 'prop-office-plant', 'office-plant', 0.1, 0.2, rng);
  return { x: deskX, y: box.y0 + 1, facing: 'north' };
}

function furnishBreakRoom(scene: SceneState, project: ProjectState, room: RoomSpec, rng: Rng): void {
  const appliances = [
    ['fridge', 'prop-fridge', 'fridge'] as const,
    ['coffee-machine', 'prop-coffee-machine', 'coffee-machine'] as const,
    ['water-cooler', 'prop-water-cooler', 'water-cooler'] as const,
  ].sort(() => rng() - 0.5);
  // appliances line the top wall, elevation sprites against architecture
  const slots = [0.15, 0.5, 0.85];
  for (let i = 0; i < appliances.length; i++) {
    const [key, preferredId, templateId] = appliances[i];
    addPropNear(scene, project, room, key, preferredId, templateId, slots[i], 0.05, rng);
  }
  if (chance(rng, 0.55)) addPropNear(scene, project, room, 'break-table', 'prop-desk', 'desk', 0.5, 0.75, rng, pick(rng, [0, 90] as SceneRotation[]));
}

function furnishConferenceRoom(scene: SceneState, project: ProjectState, room: RoomSpec, rng: Rng): void {
  addPropNear(scene, project, room, 'conference-table', 'prop-conference-table', 'conference-table', 0.5, 0.5, rng, pick(rng, [0, 90] as SceneRotation[]));
  addPropNear(scene, project, room, 'conference-whiteboard', 'prop-whiteboard', 'whiteboard', 0.9, 0.1, rng);
  if (chance(rng, 0.55)) addPropNear(scene, project, room, 'conference-plant', 'prop-office-plant', 'office-plant', 0.1, 0.8, rng);
}

interface SeatCell {
  x: number;
  y: number;
  facing: SceneFacing;
}

/**
 * Build the cubicle farm as a classic comb: partition spines every 3 columns
 * with a back run, one desk + chair per pod, opening onto an aisle. Uses the
 * autotile cubicle walls + the regular desk/chair props, so pods stay readable
 * at any zoom. Returns the seat cells so coworkers can be spawned sitting.
 */
function buildCubicleComb(scene: SceneState, project: ProjectState, room: RoomSpec, rng: Rng): SeatCell[] {
  const seats: SeatCell[] = [];
  const cubicleWall =
    byPreferredId(project.walls, 'wall-cubicle')?.id ?? byPreferredId(project.walls, 'wall-office')?.id ?? null;
  const box = interior(room);
  const width = box.x1 - box.x0 + 1;
  const height = box.y1 - box.y0 + 1;
  if (!cubicleWall || width < 4 || height < 3) return seats;

  // one comb against the top; a mirrored second comb when the room is deep
  const combs: Array<{ backY: number | null; deskY: number; chairY: number; flipped: boolean }> = [];
  if (height >= 4) combs.push({ backY: box.y0, deskY: box.y0 + 1, chairY: box.y0 + 2, flipped: false });
  else combs.push({ backY: null, deskY: box.y0, chairY: box.y0 + 1, flipped: false });
  if (height >= 7) combs.push({ backY: box.y1, deskY: box.y1 - 1, chairY: box.y1 - 2, flipped: true });

  const podCount = Math.floor((width - 1) / 3);
  for (const comb of combs) {
    const spineRows = comb.backY === null ? [comb.deskY, comb.chairY] : [comb.backY, comb.deskY, comb.chairY];
    const lastSpineX = box.x0 + podCount * 3;
    for (let p = 0; p <= podCount; p++) {
      const sx = box.x0 + p * 3;
      if (sx > box.x1) break;
      for (const y of spineRows) setWall(scene, sx, y, cubicleWall);
    }
    if (comb.backY !== null) {
      for (let x = box.x0; x <= Math.min(lastSpineX, box.x1); x++) setWall(scene, x, comb.backY, cubicleWall);
    }

    for (let p = 0; p < podCount; p++) {
      const deskX = box.x0 + p * 3 + 1;
      const entryX = deskX + 1;
      if (chance(rng, 0.12)) continue; // the vacant cubicle sells the office
      const rotation: SceneRotation = comb.flipped ? 180 : 0;
      addProp(scene, project, `cubicle-desk-${comb.deskY}-${p}`, 'prop-desk', 'desk', deskX, comb.deskY, rotation);
      addProp(scene, project, `cubicle-chair-${comb.chairY}-${p}`, 'prop-office-chair', 'office-chair', deskX, comb.chairY, rotation);
      seats.push({ x: deskX, y: comb.chairY, facing: comb.flipped ? 'south' : 'north' });
      if (chance(rng, 0.25)) {
        addProp(scene, project, `cubicle-files-${comb.deskY}-${p}`, 'prop-filing-cabinet', 'filing-cabinet', entryX, comb.deskY, 0);
      }
    }
  }

  // shared printer at the end of the aisle
  if (chance(rng, 0.5)) {
    const aisleY = combs.length === 2 ? Math.floor((box.y0 + box.y1) / 2) : Math.min(combs[0].chairY + 1, box.y1);
    if (!isBlocked(scene, box.x1, aisleY)) {
      addProp(scene, project, 'cubicle-printer', 'prop-printer', 'printer', box.x1, aisleY, 0);
    }
  }
  return seats;
}

function furnishHallway(scene: SceneState, project: ProjectState, room: RoomSpec, rng: Rng): void {
  addPropNear(scene, project, room, 'hall-badge-reader', 'prop-badge-reader', 'badge-reader', 0.8, 0.5, rng);
  if (chance(rng, 0.5)) addPropNear(scene, project, room, 'hall-plant', 'prop-office-plant', 'office-plant', 0.1, 0.5, rng);
}

export function generateOfficeLayout(
  project: ProjectState,
  coworkerCount: number,
  seed?: number,
): GeneratedOfficeLayout {
  const actualSeed = seed ?? Math.floor(Math.random() * 0x7fffffff);
  const rng = mulberry32(actualSeed);

  const template = pick(rng, LAYOUT_TEMPLATES);
  const rooms = template.rooms.map((room) => ({ ...room }));
  const officeWall = byPreferredId(project.walls, 'wall-office')?.id ?? null;
  const glassWall = byPreferredId(project.walls, 'wall-glass')?.id ?? officeWall;
  const carpet = byPreferredId(project.floors, 'floor-carpet')?.id ?? null;
  const lobby = byPreferredId(project.floors, 'floor-carpet-tiles')?.id ?? carpet;
  const wood = byPreferredId(project.floors, 'floor-wood')?.id ?? carpet;
  const linoleum = byPreferredId(project.floors, 'floor-linoleum')?.id ?? carpet;

  const scene: SceneState = {
    cols: COLS,
    rows: ROWS,
    floorIds: grid(COLS, ROWS, carpet),
    wallIds: grid<string | null>(COLS, ROWS, null),
    entities: [],
    rooms,
    roomIds: roomGrid(rooms),
    source: 'generated',
    generated: { templateId: template.id, seed: actualSeed },
  };

  // hallway fills LAST so shared boundary tiles show hallway carpet — reads as
  // a consistent corridor border instead of random floor strips under walls
  fillFloor(scene, 'reception', lobby);
  fillFloor(scene, 'manager-office', wood);
  fillFloor(scene, 'break-room', linoleum);
  fillFloor(scene, 'conference-room', wood);
  fillFloor(scene, 'cubicle-farm', carpet);
  fillFloor(scene, 'hallway', carpet);

  drawRoomWalls(scene, rooms, officeWall, glassWall);
  clearDoorways(scene, template, rng);

  furnishReception(scene, project, roomById(rooms, 'reception'), rng);
  const managerSeat = furnishManagerOffice(scene, project, roomById(rooms, 'manager-office'), rng);
  furnishBreakRoom(scene, project, roomById(rooms, 'break-room'), rng);
  furnishConferenceRoom(scene, project, roomById(rooms, 'conference-room'), rng);
  const seats = buildCubicleComb(scene, project, roomById(rooms, 'cubicle-farm'), rng);
  furnishHallway(scene, project, roomById(rooms, 'hallway'), rng);

  const baseCast = project.characters.filter((recipe) => !recipe.id.startsWith(GENERATED_COWORKER_PREFIX));
  const coworkers = createGeneratedCoworkers(project, coworkerCount, rng, actualSeed);
  spawnCharacter(scene, project, baseCast.find((r) => r.id === 'janice') ?? baseCast[0], 'hallway', 'suspicious', pick(rng, FACINGS), rng);
  spawnCharacter(scene, project, baseCast.find((r) => r.id === 'carl') ?? baseCast[1], chance(rng, 0.5) ? 'break-room' : 'cubicle-farm', 'curious', pick(rng, FACINGS), rng);
  spawnCharacter(scene, project, baseCast.find((r) => r.id === 'linda') ?? baseCast[2], chance(rng, 0.5) ? 'conference-room' : 'cubicle-farm', 'defensive', pick(rng, FACINGS), rng);
  const manager = baseCast.find((r) => r.id === 'the-manager') ?? baseCast[3];
  if (managerSeat) addCharacter(scene, project, manager, managerSeat.x, managerSeat.y, 'hostile', managerSeat.facing);
  else spawnCharacter(scene, project, manager, 'manager-office', 'hostile', pick(rng, FACINGS), rng);

  const coworkerRooms: RoomId[] = ['cubicle-farm', 'hallway', 'break-room', 'conference-room'];
  const freeSeats = [...seats];
  for (const coworker of coworkers) {
    // most coworkers sit at their cubicle, facing the desk
    if (freeSeats.length > 0 && chance(rng, 0.7)) {
      const seat = freeSeats.splice(Math.floor(rng() * freeSeats.length), 1)[0];
      addCharacter(scene, project, coworker, seat.x, seat.y, pick(rng, AMBIENT_MOODS), seat.facing);
      continue;
    }
    const cell = pickSpawnCell(scene, project, rng, pick(rng, coworkerRooms));
    if (cell) addCharacter(scene, project, coworker, cell.x, cell.y, pick(rng, AMBIENT_MOODS), pick(rng, FACINGS));
  }

  return { scene, coworkers, seed: actualSeed, templateId: template.id };
}

export function sceneToLayoutJson(scene: SceneState, project: ProjectState): SceneLayoutJson {
  const wallCells: SceneLayoutJson['walls']['cells'] = [];
  for (let y = 0; y < scene.rows; y++) {
    for (let x = 0; x < scene.cols; x++) {
      const wallId = scene.wallIds[y][x];
      if (wallId) wallCells.push({ x, y, wallId, mask: wallMask(scene, x, y) });
    }
  }

  return {
    version: 1,
    source: scene.source,
    generated: scene.generated ?? null,
    cols: scene.cols,
    rows: scene.rows,
    rooms: scene.rooms ?? [],
    roomGrid: scene.roomIds ?? grid<string | null>(scene.cols, scene.rows, null),
    floors: scene.floorIds,
    walls: {
      grid: scene.wallIds,
      cells: wallCells,
    },
    props: scene.entities
      .filter((entity) => entity.kind === 'prop')
      .map((entity) => {
        const prop = project.props.find((item) => item.id === entity.refId);
        return {
          id: entity.id,
          propId: entity.refId,
          templateId: prop?.templateId ?? null,
          name: prop?.name ?? 'Missing prop',
          x: entity.x,
          y: entity.y,
          rotation: entity.rotation,
          projection: propProjection(prop),
        };
      }),
    characterSpawns: scene.entities
      .filter((entity) => entity.kind === 'character')
      .map((entity) => {
        const recipe = project.characters.find((item) => item.id === entity.refId);
        return {
          id: entity.id,
          characterId: entity.refId,
          name: recipe?.name ?? 'Missing character',
          x: entity.x,
          y: entity.y,
          facing: entity.facing,
          mood: entity.mood,
          generatedCoworker: entity.refId.startsWith(GENERATED_COWORKER_PREFIX),
        };
      }),
  };
}
