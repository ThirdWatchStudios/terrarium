/**
 * Review-only systems-first exterior prop gap proof.
 *
 *   node --import tsx scripts/quotaCoGameplaySystemsPropGapPreview.ts
 *   node --import tsx scripts/quotaCoGameplaySystemsPropGapPreview.ts --out docs/previews
 *
 * Concept geometry remains code-owned comparison art. No template, SVG source,
 * export contract, facility registration, schema, or Unity integration changes.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import {
  CURRENT_SCHEMA_VERSION,
  type CharacterRecipe,
  type Facing,
} from '../src/core/types';
import { DEFAULT_CAST } from '../src/data/defaults';
import { PROP_TEMPLATES } from '../src/props/templates';
import { PropCalibrationRenderer } from './quotaCoPropRedesignCalibrationPreview';
import { PROP_NATIVE_FRAME_CELLS } from './quotaCoWorkstationFamilyCalibrationPreview';

const WIDTH = 3200;
const HEIGHT = 2240;
const MARGIN = 36;
const GAP = 18;
const NORMAL_CELL = 74;
const FAR_CELL = 40;
const AUTHORING_CANVAS = 128;
const WALL_DATUM = 112;
const CHARACTER_VISUAL_SCALE = 0.65;
const CHARACTER_FRAME_CELLS = 1.55 * CHARACTER_VISUAL_SCALE;

const PAGE = '#E7E1D2';
const PANEL = '#F6F1E6';
const PANEL_ALT = '#ECE5D7';
const INK = '#292C2A';
const MUTED = '#626861';
const RULE = '#A39B8B';
const FLOOR = '#7B8890';
const FLOOR_LINE = '#D9D4C7';
const GRASS = '#667A5D';
const WALK = '#C8C2B2';
const OCCUPANCY = '#E7DDAF';
const GREEN = '#355647';
const GREEN_SOFT = '#DCE9DD';
const TEAL_SOFT = '#D8E6E4';
const CORAL = '#B65F4D';
const CORAL_SOFT = '#F0DDD6';
const BLUE = '#294565';

const Q = {
  creamLight: '#F3EEDA',
  cream: '#DED5BD',
  creamShade: '#C7BDA7',
  green: '#355247',
  greenLight: '#49685A',
  teal: '#4E7470',
  olive: '#77755D',
  coral: '#B65F4D',
  rust: '#98513F',
  charcoal: '#262B29',
  recess: '#18211E',
  blueGlass: '#8FB7C0',
  blueGlassDark: '#668E98',
  foliage: '#527A45',
  foliageLight: '#6D8D57',
  foliageDark: '#355B34',
  metal: '#8E9690',
  yellow: '#D5B85D',
} as const;

export type GameplayGapCandidateId =
  | 'hvac-condenser'
  | 'surveillance-camera'
  | 'surveillance-sensor'
  | 'privacy-hedge';

export type CandidateState = 'rated' | 'degraded' | 'inoperative';

interface GameplayGapCandidate {
  readonly id: GameplayGapCandidateId;
  readonly label: string;
  readonly projection: 'plan' | 'elevation';
  readonly placement: 'floor' | 'wall-slot';
  readonly gridFootprint: { readonly w: number; readonly h: number };
  readonly artEnvelopeCells: number;
  readonly systemReceiver: string;
  readonly floorConsequence: string;
  readonly humanConsequence: string;
  readonly visibleStates: readonly [string, string, string];
  readonly readiness: 'explicit design gap' | 'system design required' | 'existing substrate';
}

export const GAMEPLAY_GAP_CANDIDATES:
readonly GameplayGapCandidate[] = [
  {
    id: 'hvac-condenser',
    label: 'Exterior HVAC condenser',
    projection: 'elevation',
    placement: 'floor',
    gridFootprint: { w: 2, h: 1 },
    artEnvelopeCells: 1.7,
    systemReceiver: 'room climate / air-quality coverage and equipment state',
    floorConsequence: 'rated coverage, equipment noise, and a named outage or degraded zone',
    humanConsequence: 'people seek, avoid, report, or repair a visibly uncomfortable/noisy condition',
    visibleStates: ['RATED', 'DEGRADED — FILTER / LOAD', 'INOPERATIVE'],
    readiness: 'system design required',
  },
  {
    id: 'surveillance-camera',
    label: 'Wall surveillance camera',
    projection: 'elevation',
    placement: 'wall-slot',
    gridFootprint: { w: 1, h: 1 },
    artEnvelopeCells: 0.82,
    systemReceiver: 'camera coverage / IRIS observation',
    floorConsequence: 'visible field of view, blind spots, and occlusion by walls or tall landscape',
    humanConsequence: 'witness exposure and observed behavior change by person and context',
    visibleStates: ['MONITORING', 'BLIND — OCCLUDED', 'OFFLINE / TAMPERED'],
    readiness: 'explicit design gap',
  },
  {
    id: 'surveillance-sensor',
    label: 'Occupancy / access sensor',
    projection: 'elevation',
    placement: 'wall-slot',
    gridFootprint: { w: 1, h: 1 },
    artEnvelopeCells: 0.62,
    systemReceiver: 'presence, access, or badge-event observation',
    floorConsequence: 'a bounded detection zone distinct from camera sight',
    humanConsequence: 'entry and attendance become legible records without pretending to know intent',
    visibleStates: ['ONLINE', 'BLOCKED / MISALIGNED', 'OFFLINE / TAMPERED'],
    readiness: 'explicit design gap',
  },
  {
    id: 'privacy-hedge',
    label: 'Connected privacy hedge',
    projection: 'elevation',
    placement: 'floor',
    gridFootprint: { w: 2, h: 1 },
    artEnvelopeCells: 2,
    systemReceiver: 'pathing, sightline, witness exposure, and camera occlusion',
    floorConsequence: 'blocks movement and divides visible/observed space without becoming a wall',
    humanConsequence: 'creates private paths and outdoor gathering edges while also hiding activity',
    visibleStates: ['MAINTAINED', 'OVERGROWN — NARROW', 'GAPPED / REMOVED'],
    readiness: 'existing substrate',
  },
];

export const EXISTING_SYSTEM_REUSE_IDS = [
  'tree-canopy',
  'park-bench',
  'picnic-table',
  'lamp-post',
  'bike-rack',
] as const;

export const DEFERRED_NON_SYSTEM_GAPS = [
  'bulldozer or excavator',
  'generic construction pallets and cones',
  'decorative mushroom / log / leaf-litter variants',
  'fire hydrant or transformer without a corresponding system',
  'warehouse or conveyor-chain props',
] as const;

function escapeText(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function text(
  x: number,
  y: number,
  value: string,
  size = 16,
  weight = 560,
  color = INK,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return (
    `<text x="${x}" y="${y}" ` +
    'font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" ' +
    `font-size="${size}" font-weight="${weight}" fill="${color}" ` +
    `text-anchor="${anchor}">${escapeText(value)}</text>`
  );
}

function wrappedText(
  x: number,
  y: number,
  value: string,
  maxCharacters: number,
  lineHeight: number,
  size = 16,
  weight = 560,
  color = INK,
): string {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharacters && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines
    .map((lineValue, index) =>
      text(x, y + index * lineHeight, lineValue, size, weight, color),
    )
    .join('');
}

function panel(
  x: number,
  y: number,
  width: number,
  height: number,
  fill = PANEL,
  stroke = RULE,
  radius = 14,
): string {
  return (
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" ` +
    `rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`
  );
}

function r(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  outline = false,
  opacity = 1,
): string {
  return (
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" ` +
    `rx="${radius}" fill="${fill}" opacity="${opacity}" ` +
    (outline
      ? `stroke="${INK}" stroke-width="3" stroke-linejoin="round"`
      : 'stroke="none"') +
    '/>'
  );
}

function e(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fill: string,
  outline = false,
  opacity = 1,
): string {
  return (
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ` +
    `fill="${fill}" opacity="${opacity}" ` +
    (outline ? `stroke="${INK}" stroke-width="3"` : 'stroke="none"') +
    '/>'
  );
}

function c(
  cx: number,
  cy: number,
  radius: number,
  fill: string,
  outline = false,
  opacity = 1,
): string {
  return (
    `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${fill}" ` +
    `opacity="${opacity}" ` +
    (outline ? `stroke="${INK}" stroke-width="3"` : 'stroke="none"') +
    '/>'
  );
}

function p(
  d: string,
  fill: string,
  outline = false,
  opacity = 1,
): string {
  return (
    `<path d="${d}" fill="${fill}" opacity="${opacity}" ` +
    (outline
      ? `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`
      : 'stroke="none"') +
    '/>'
  );
}

function line(
  d: string,
  stroke: string,
  width = 2,
  opacity = 1,
  dash = '',
): string {
  return (
    `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" ` +
    `stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" ` +
    (dash ? `stroke-dasharray="${dash}"` : '') +
    '/>'
  );
}

function svg(markup: string): string {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" ' +
    `width="128" height="128">${markup}</svg>`
  );
}

function placedSvg(
  source: string,
  x: number,
  y: number,
  width: number,
  height = width,
): string {
  return source
    .replace('<svg ', `<svg x="${x}" y="${y}" overflow="visible" `)
    .replace(
      /width="[^"]+" height="[^"]+"/,
      `width="${width}" height="${height}"`,
    );
}

function stateColor(state: CandidateState): string {
  if (state === 'rated') return Q.teal;
  if (state === 'degraded') return Q.coral;
  return Q.charcoal;
}

function hvacSvg(state: CandidateState): string {
  const active = state !== 'inoperative';
  const degraded = state === 'degraded';
  return svg([
    e(64, 113, 49, 6, '#000000', false, 0.13),
    r(13, 39, 102, 73, 13, Q.cream, true),
    r(18, 44, 75, 61, 10, Q.green, true),
    c(55, 74, 25, Q.recess, true),
    c(55, 74, 18, active ? Q.blueGlassDark : Q.charcoal, true),
    c(55, 74, 6, active ? Q.teal : Q.recess, true),
    line(
      'M 55 55 V 93 M 36 74 H 74 M 42 61 L 68 87 M 68 61 L 42 87',
      active ? Q.creamShade : Q.metal,
      3,
      active ? 0.9 : 0.45,
    ),
    r(91, 47, 23, 55, 8, Q.greenLight, true),
    r(96, 54, 13, 22, 4, Q.recess, true),
    r(99, 58, 7, 6, 2, stateColor(state)),
    r(99, 68, 7, 4, 2, Q.creamShade),
    r(97, 84, 11, 9, 3, degraded ? Q.coral : Q.cream, true),
    r(17, 103, 98, 9, 4, Q.charcoal, true),
    ...(degraded
      ? [
          p('M 21 49 H 33 L 29 98 H 18 Z', Q.rust, false, 0.8),
          line('M 91 104 L 113 101', Q.coral, 3),
        ]
      : []),
    ...(state === 'inoperative'
      ? [
          line('M 35 54 L 75 94 M 75 54 L 35 94', Q.coral, 5, 0.8),
          r(96, 82, 13, 13, 3, Q.charcoal, true),
        ]
      : []),
  ].join(''));
}

function cameraSvg(state: CandidateState): string {
  const active = state !== 'inoperative';
  const degraded = state === 'degraded';
  return svg([
    r(52, 26, 24, 15, 7, Q.green, true),
    r(60, 39, 8, 18, 4, Q.green, true),
    p('M 34 51 H 94 L 87 78 Q 64 88 41 78 Z', Q.cream, true),
    r(42, 57, 44, 19, 8, Q.green, true),
    c(64, 67, 9, Q.recess, true),
    c(64, 67, 4, active ? Q.blueGlass : Q.charcoal, true),
    r(83, 58, 8, 9, 3, degraded ? Q.coral : Q.teal, true),
    ...(degraded
      ? [
          p('M 39 75 Q 50 83 64 84 L 58 91 Q 44 86 35 78 Z', Q.rust, false, 0.75),
          line('M 82 54 L 95 45', Q.coral, 3),
        ]
      : []),
    ...(state === 'inoperative'
      ? [line('M 52 56 L 77 79 M 77 56 L 52 79', Q.coral, 4)]
      : []),
  ].join(''));
}

function sensorSvg(state: CandidateState): string {
  const active = state !== 'inoperative';
  const degraded = state === 'degraded';
  return svg([
    e(64, 87, 24, 5, '#000000', false, 0.1),
    r(39, 38, 50, 48, 14, Q.cream, true),
    r(45, 44, 38, 29, 10, Q.green, true),
    e(64, 57, 12, 8, active ? Q.blueGlass : Q.charcoal, true),
    c(64, 57, 4, active ? Q.teal : Q.recess),
    r(51, 76, 26, 7, 3, Q.green, true),
    r(59, 78, 10, 3, 2, degraded ? Q.coral : Q.teal),
    ...(degraded
      ? [
          r(77, 39, 8, 16, 3, Q.coral, true),
          line('M 43 72 L 50 78', Q.rust, 3),
        ]
      : []),
    ...(state === 'inoperative'
      ? [line('M 50 46 L 78 70 M 78 46 L 50 70', Q.coral, 4)]
      : []),
  ].join(''));
}

function hedgeSvg(state: CandidateState): string {
  const degraded = state === 'degraded';
  const inoperative = state === 'inoperative';
  return svg([
    e(64, 113, 54, 6, '#000000', false, 0.11),
    r(8, 101, 112, 15, 6, Q.creamShade, true),
    r(14, 96, 100, 11, 5, Q.green, true),
    ...(!inoperative
      ? [
          p(
            degraded
              ? 'M 11 99 C 5 78 15 60 30 61 C 27 43 43 34 57 43 C 66 27 88 35 88 51 C 107 46 121 62 115 79 C 126 91 113 104 98 99 Z'
              : 'M 11 98 V 59 Q 18 43 35 50 Q 47 29 64 45 Q 81 29 94 50 Q 112 43 117 59 V 98 Z',
            Q.foliage,
            true,
          ),
          p(
            degraded
              ? 'M 19 84 Q 36 66 50 77 Q 65 56 80 73 Q 98 60 109 82 V 98 H 19 Z'
              : 'M 17 76 Q 34 61 49 73 Q 64 53 79 73 Q 96 61 111 76 V 98 H 17 Z',
            Q.foliageDark,
            false,
            0.9,
          ),
          ...(degraded
            ? [
                p('M 22 99 Q 12 109 8 93 Q 19 88 30 99 Z', Q.foliageDark, true),
                p('M 98 98 Q 111 108 121 90 Q 107 86 94 97 Z', Q.foliageLight, true),
              ]
            : []),
        ]
      : [
          p('M 12 99 Q 20 74 38 77 Q 49 95 59 99 Z', Q.foliageDark, true),
          p('M 77 99 Q 85 72 105 78 Q 115 91 116 99 Z', Q.foliage, true),
          line('M 60 101 V 116', Q.coral, 3, 0.8),
        ]),
  ].join(''));
}

export function renderGameplayGapCandidateSvg(
  id: GameplayGapCandidateId,
  state: CandidateState = 'rated',
): string {
  if (id === 'hvac-condenser') return hvacSvg(state);
  if (id === 'surveillance-camera') return cameraSvg(state);
  if (id === 'surveillance-sensor') return sensorSvg(state);
  return hedgeSvg(state);
}

function drawGrid(
  parts: string[],
  x: number,
  y: number,
  columns: number,
  rows: number,
  cell: number,
): void {
  parts.push(
    `<rect x="${x}" y="${y}" width="${columns * cell}" ` +
      `height="${rows * cell}" fill="${FLOOR}" stroke="#56616A" stroke-width="2"/>`,
    `<rect x="${x + 6 * cell}" y="${y}" width="${4 * cell}" ` +
      `height="${rows * cell}" fill="${GRASS}"/>`,
    `<rect x="${x}" y="${y + 2.8 * cell}" width="${10 * cell}" ` +
      `height="${0.7 * cell}" fill="${WALK}" opacity=".94"/>`,
  );
  for (let column = 1; column < columns; column += 1) {
    parts.push(
      line(
        `M ${x + column * cell} ${y} V ${y + rows * cell}`,
        FLOOR_LINE,
        1,
        0.15,
      ),
    );
  }
  for (let row = 1; row < rows; row += 1) {
    parts.push(
      line(
        `M ${x} ${y + row * cell} H ${x + columns * cell}`,
        FLOOR_LINE,
        1,
        0.15,
      ),
    );
  }
}

function drawFacade(
  parts: string[],
  renderer: PropCalibrationRenderer,
  x: number,
  y: number,
  columns: number,
  cell: number,
): void {
  parts.push(renderer.wallTile(6, x, y, cell));
  for (let column = 1; column < columns - 1; column += 1) {
    parts.push(renderer.wallTile(10, x + column * cell, y, cell));
  }
  parts.push(renderer.wallTile(12, x + (columns - 1) * cell, y, cell));
}

function candidatePlacement(
  id: GameplayGapCandidateId,
  state: CandidateState,
  footprintX: number,
  footprintY: number,
  cell: number,
  occupancy = true,
): string {
  const decision = GAMEPLAY_GAP_CANDIDATES.find(
    (candidate) => candidate.id === id,
  );
  if (!decision) throw new Error(`Missing gameplay candidate ${id}`);
  const footprintWidth = decision.gridFootprint.w * cell;
  const footprintHeight = decision.gridFootprint.h * cell;
  const spriteSize = cell * PROP_NATIVE_FRAME_CELLS;
  const x = footprintX + (footprintWidth - spriteSize) / 2;
  const y = decision.placement === 'wall-slot'
    ? footprintY - spriteSize * 0.06
    : footprintY + footprintHeight - spriteSize * (116 / AUTHORING_CANVAS);
  const guide = occupancy
    ? (
      `<rect x="${footprintX + 3}" y="${footprintY + 3}" ` +
      `width="${footprintWidth - 6}" height="${footprintHeight - 6}" ` +
      `rx="5" fill="${OCCUPANCY}" fill-opacity=".08" stroke="${OCCUPANCY}" ` +
      'stroke-width="1.3" stroke-dasharray="5 4"/>'
    )
    : '';
  return guide + placedSvg(
    renderGameplayGapCandidateSvg(id, state),
    x,
    y,
    spriteSize,
  );
}

interface AgentPlacement {
  readonly recipe: CharacterRecipe;
  readonly facing: Facing | 'west';
  readonly x: number;
  readonly y: number;
}

function agentPlacement(
  renderer: PropCalibrationRenderer,
  spec: AgentPlacement,
  roomX: number,
  roomY: number,
  cell: number,
): string {
  const frameSize = cell * CHARACTER_FRAME_CELLS;
  const source = renderer.character(spec.recipe, spec.facing, 'neutral');
  const anchorX = roomX + spec.x * cell;
  const anchorY = roomY + spec.y * cell;
  return placedSvg(
    source,
    anchorX - frameSize / 2,
    anchorY - frameSize * 0.86,
    frameSize,
  );
}

function systemsScene(
  renderer: PropCalibrationRenderer,
  x: number,
  y: number,
  cell: number,
  crowded = false,
): string {
  const parts: string[] = [];
  drawGrid(parts, x, y, 10, 6, cell);
  drawFacade(parts, renderer, x, y, 10, cell);

  const cameraCenterX = x + 3.5 * cell;
  const cameraCenterY = y + 1.25 * cell;
  const hedgeLeft = x + 6.1 * cell;
  parts.push(
    p(
      `M ${cameraCenterX} ${cameraCenterY} ` +
        `L ${x + 1.3 * cell} ${y + 4.6 * cell} ` +
        `L ${x + 6.15 * cell} ${y + 4.6 * cell} Z`,
      Q.blueGlass,
      false,
      0.12,
    ),
    line(
      `M ${cameraCenterX} ${cameraCenterY} ` +
        `L ${x + 1.3 * cell} ${y + 4.6 * cell} ` +
        `M ${cameraCenterX} ${cameraCenterY} ` +
        `L ${x + 6.15 * cell} ${y + 4.6 * cell}`,
      Q.teal,
      1.5,
      0.7,
      '8 6',
    ),
    e(
      x + 5.4 * cell,
      y + 3.55 * cell,
      1.25 * cell,
      0.7 * cell,
      Q.coral,
      false,
      0.08,
    ),
    line(
      `M ${x + 4.1 * cell} ${y + 3.55 * cell} ` +
        `Q ${x + 5.4 * cell} ${y + 2.75 * cell} ${x + 6.7 * cell} ${y + 3.55 * cell}`,
      Q.coral,
      1.5,
      0.65,
      '7 6',
    ),
    candidatePlacement(
      'hvac-condenser',
      'rated',
      x + 0.8 * cell,
      y + 1.55 * cell,
      cell,
    ),
    candidatePlacement(
      'privacy-hedge',
      'rated',
      hedgeLeft,
      y + 3.8 * cell,
      cell,
    ),
  );

  const actors: readonly AgentPlacement[] = crowded
    ? [
        { recipe: DEFAULT_CAST[0], facing: 'south', x: 2.4, y: 4.2 },
        { recipe: DEFAULT_CAST[1], facing: 'east', x: 4.7, y: 3.7 },
        { recipe: DEFAULT_CAST[2], facing: 'west', x: 6.75, y: 4.25 },
        { recipe: DEFAULT_CAST[3], facing: 'north', x: 8.1, y: 5.1 },
        { recipe: DEFAULT_CAST[0], facing: 'east', x: 1.3, y: 5.1 },
      ]
    : [
        { recipe: DEFAULT_CAST[0], facing: 'east', x: 2.8, y: 3.7 },
        { recipe: DEFAULT_CAST[1], facing: 'west', x: 6.75, y: 4.3 },
        { recipe: DEFAULT_CAST[2], facing: 'south', x: 8.25, y: 5.05 },
      ];
  for (const actor of actors) {
    parts.push(agentPlacement(renderer, actor, x, y, cell));
  }

  parts.push(
    candidatePlacement(
      'surveillance-camera',
      'rated',
      x + 3 * cell,
      y + 0.28 * cell,
      cell,
      false,
    ),
    candidatePlacement(
      'surveillance-sensor',
      'rated',
      x + 5 * cell,
      y + 0.35 * cell,
      cell,
      false,
    ),
    `<circle cx="${x + 2.02 * cell}" cy="${y + 3.22 * cell}" r="${cell * 0.12}" ` +
      `fill="none" stroke="${CORAL}" stroke-width="2.5"/>`,
    line(
      `M ${x + 2.02 * cell} ${y + 3.07 * cell} V ${y + 3.37 * cell} ` +
        `M ${x + 1.87 * cell} ${y + 3.22 * cell} H ${x + 2.17 * cell}`,
      CORAL,
      2,
    ),
  );
  return parts.join('');
}

function inclusionGate(parts: string[]): void {
  const y = 100;
  parts.push(
    panel(MARGIN, y, WIDTH - MARGIN * 2, 176, PANEL_ALT),
    text(MARGIN + 22, y + 35, 'The inclusion gate · all four answers must be concrete', 20, 860, GREEN),
    text(
      WIDTH - MARGIN - 22,
      y + 34,
      'A plausible real-world object is not enough.',
      12,
      760,
      CORAL,
      'end',
    ),
  );
  const gate = [
    ['1 · RECEIVER', 'Which named gameplay system reads it?'],
    ['2 · STATE', 'What visible operational state can change?'],
    ['3 · HUMAN', 'What do employees do differently because it exists?'],
    ['4 · FLOOR', 'Why must that consequence be visible in the world?'],
  ] as const;
  gate.forEach(([title, body], index) => {
    const x = MARGIN + 28 + index * 775;
    parts.push(
      index > 0 ? line(`M ${x - 28} ${y + 56} V ${y + 148}`, RULE, 1) : '',
      text(x, y + 82, title, 13, 880, index === 0 ? GREEN : BLUE),
      wrappedText(x, y + 108, body, 62, 19, 11, 630, MUTED),
    );
  });
}

function candidateCards(parts: string[]): void {
  const y = 294;
  const width = (WIDTH - MARGIN * 2 - GAP * 3) / 4;
  GAMEPLAY_GAP_CANDIDATES.forEach((candidate, index) => {
    const x = MARGIN + index * (width + GAP);
    const fill = index === 0
      ? TEAL_SOFT
      : index < 3
        ? GREEN_SOFT
        : CORAL_SOFT;
    parts.push(
      panel(x, y, width, 420, fill),
      text(x + 18, y + 30, candidate.label.toUpperCase(), 14, 870, GREEN),
      text(
        x + width - 18,
        y + 30,
        candidate.readiness,
        9,
        760,
        CORAL,
        'end',
      ),
      placedSvg(
        renderGameplayGapCandidateSvg(candidate.id),
        x + 26,
        y + 54,
        154,
      ),
      text(x + 202, y + 75, `${candidate.projection} · ${candidate.placement}`, 10, 780, BLUE),
      text(
        x + 202,
        y + 96,
        `${candidate.gridFootprint.w}×${candidate.gridFootprint.h} footprint · ${candidate.artEnvelopeCells.toFixed(2)}-cell art`,
        9.5,
        660,
        MUTED,
      ),
      text(x + 202, y + 127, 'SYSTEM RECEIVER', 9.5, 850, CORAL),
      wrappedText(x + 202, y + 149, candidate.systemReceiver, 52, 17, 9.5, 620, INK),
      line(`M ${x + 18} ${y + 220} H ${x + width - 18}`, RULE, 1),
      text(x + 18, y + 245, 'Floor consequence', 10.5, 820, BLUE),
      wrappedText(x + 18, y + 267, candidate.floorConsequence, 76, 17, 9.5, 610, MUTED),
      text(x + 18, y + 327, 'Human consequence', 10.5, 820, BLUE),
      wrappedText(x + 18, y + 349, candidate.humanConsequence, 76, 17, 9.5, 610, MUTED),
    );
  });
}

function systemScenePanel(
  parts: string[],
  renderer: PropCalibrationRenderer,
): void {
  const y = 732;
  const width = 1615;
  const roomX = MARGIN + 38;
  const roomY = y + 78;
  parts.push(
    panel(MARGIN, y, width, 610, PANEL),
    text(MARGIN + 22, y + 32, 'Literal gameplay context · systems compose on the floor', 18, 860, GREEN),
    text(MARGIN + 22, y + 55, 'HVAC approach · camera cone · sensor zone · hedge occlusion', 10.5, 660, MUTED),
    text(MARGIN + width - 22, y + 32, `${NORMAL_CELL} px / cell`, 10, 800, CORAL, 'end'),
    systemsScene(renderer, roomX, roomY, NORMAL_CELL),
    text(
      MARGIN + 22,
      y + 569,
      'Coral cross = service approach · blue = camera coverage · coral ellipse = sensor zone',
      9.5,
      700,
      BLUE,
    ),
    text(
      MARGIN + 22,
      y + 589,
      'No universal prop multiplier; each proposed source owns its envelope inside the 128u frame.',
      9.5,
      650,
      MUTED,
    ),
  );
}

function stateAndFarPanel(
  parts: string[],
  renderer: PropCalibrationRenderer,
): void {
  const x = MARGIN + 1633;
  const y = 732;
  const width = WIDTH - MARGIN - x;
  parts.push(
    panel(x, y, width, 610, PANEL_ALT),
    text(x + 22, y + 32, 'Named states + far/crowded survival', 18, 860, GREEN),
    text(x + width - 22, y + 32, `${FAR_CELL} px / cell`, 10, 800, CORAL, 'end'),
  );
  const stateStartX = x + 22;
  GAMEPLAY_GAP_CANDIDATES.forEach((candidate, row) => {
    const rowY = y + 61 + row * 93;
    parts.push(
      text(stateStartX, rowY + 22, candidate.id, 9.5, 780, BLUE),
    );
    (['rated', 'degraded', 'inoperative'] as const).forEach((state, column) => {
      const spriteX = stateStartX + 170 + column * 115;
      parts.push(
        placedSvg(
          renderGameplayGapCandidateSvg(candidate.id, state),
          spriteX,
          rowY - 7,
          74,
        ),
        text(
          spriteX + 37,
          rowY + 78,
          candidate.visibleStates[column],
          7.2,
          680,
          state === 'rated' ? GREEN : CORAL,
          'middle',
        ),
      );
    });
  });
  const farX = x + 590;
  const farY = y + 70;
  parts.push(
    systemsScene(renderer, farX, farY, FAR_CELL, true),
    text(farX, y + 332, 'FAR CROWD · FIVE ACTORS', 9.5, 800, CORAL),
    wrappedText(
      farX,
      y + 360,
      'The camera and sensor remain reacquirable on the wall; HVAC still reads as a serviceable machine; the hedge remains a living obstruction rather than a green wall tile.',
      72,
      18,
      10,
      640,
      MUTED,
    ),
    text(farX, y + 475, 'Held during proof', 11, 830, BLUE),
    wrappedText(
      farX,
      y + 501,
      'character scale and roots · accepted wall datum · existing projections and footprints · schema · exporter · Unity registration',
      74,
      18,
      9.5,
      640,
      MUTED,
    ),
  );
}

function reusePanel(
  parts: string[],
  renderer: PropCalibrationRenderer,
): void {
  const y = 1360;
  const width = WIDTH - MARGIN * 2;
  parts.push(
    panel(MARGIN, y, width, 314, GREEN_SOFT),
    text(MARGIN + 22, y + 34, 'Existing art can gain mechanics without becoming a new prop', 18, 860, GREEN),
    text(
      WIDTH - MARGIN - 22,
      y + 34,
      'Reuse before expansion',
      11,
      820,
      CORAL,
      'end',
    ),
  );
  const reuse = [
    ['tree-canopy', 'shade / outdoor recovery context'],
    ['park-bench', 'recovery seat + social co-presence'],
    ['picnic-table', 'shared outdoor break venue + capacity'],
    ['lamp-post', 'practical light / safety coverage'],
    ['bike-rack', 'arrival or commute capacity, if that system exists'],
  ] as const;
  reuse.forEach(([id, consequence], index) => {
    const columnWidth = width / reuse.length;
    const center = MARGIN + columnWidth * (index + 0.5);
    parts.push(
      index > 0
        ? line(`M ${MARGIN + columnWidth * index} ${y + 58} V ${y + 286}`, RULE, 1)
        : '',
      placedSvg(renderer.prop('current', id), center - 63, y + 65, 126),
      text(center, y + 211, id, 10.5, 800, BLUE, 'middle'),
      wrappedText(
        center - columnWidth / 2 + 28,
        y + 239,
        consequence,
        43,
        18,
        9.5,
        620,
        MUTED,
      ),
    );
  });
}

function deferredPanel(parts: string[]): void {
  const y = 1692;
  const width = WIDTH - MARGIN * 2;
  parts.push(
    panel(MARGIN, y, width, 206, CORAL_SOFT),
    text(MARGIN + 22, y + 34, 'Deferred until a system earns them', 17, 860, GREEN),
    text(
      WIDTH - MARGIN - 22,
      y + 34,
      'No scenery backlog disguised as systems work.',
      11,
      800,
      CORAL,
      'end',
    ),
  );
  DEFERRED_NON_SYSTEM_GAPS.forEach((item, index) => {
    const columnWidth = width / DEFERRED_NON_SYSTEM_GAPS.length;
    const x = MARGIN + columnWidth * index + 30;
    parts.push(
      index > 0
        ? line(`M ${MARGIN + columnWidth * index} ${y + 58} V ${y + 178}`, RULE, 1)
        : '',
      c(x + 4, y + 82, 4, CORAL),
      wrappedText(
        x + 18,
        y + 87,
        item,
        43,
        20,
        10,
        650,
        INK,
      ),
    );
  });
}

function approvalBoundary(parts: string[]): void {
  const y = 1916;
  parts.push(
    panel(MARGIN, y, WIDTH - MARGIN * 2, 282, '#DAD4C6', 'none', 10),
    text(MARGIN + 24, y + 38, 'Approval boundary', 18, 860, GREEN),
    text(
      MARGIN + 24,
      y + 70,
      'Approve, reject, or narrow these four gameplay candidates. Visual approval still does not create templates or production SVGs.',
      12,
      690,
      INK,
    ),
    text(MARGIN + 24, y + 111, 'If accepted', 12, 840, BLUE),
    wrappedText(
      MARGIN + 24,
      y + 138,
      'The next slice tightens silhouette, state readability, and exact per-object scale. Only after that approval do genuine artist-editable SVG sources and contract-aware registration become eligible.',
      175,
      21,
      11,
      650,
      MUTED,
    ),
    text(MARGIN + 24, y + 213, 'Not performed', 12, 840, CORAL),
    text(
      MARGIN + 24,
      y + 241,
      'no new prop ids · no facility definitions · no gameplay implementation · no exporter/schema change · no Unity integration · no commit',
      10.5,
      720,
      MUTED,
    ),
    panel(WIDTH - MARGIN - 1020, y + 92, 980, 142, PANEL_ALT, 'none', 9),
    text(WIDTH - MARGIN - 994, y + 122, 'SYSTEM DESIGN NOTE', 11, 880, CORAL),
    wrappedText(
      WIDTH - MARGIN - 994,
      y + 150,
      'HVAC is intentionally marked “system design required.” This proof says its floor consequences are promising; it does not silently invent temperature, power, or maintenance simulation.',
      118,
      20,
      10.5,
      650,
      INK,
    ),
  );
}

function sheet(renderer: PropCalibrationRenderer): string {
  const parts: string[] = [
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAGE}"/>`,
    text(MARGIN, 46, 'QuotaCo exterior props · systems-first gap proof v1', 29, 880),
    text(
      MARGIN,
      76,
      'REVIEW ONLY · every candidate must change state, behavior, movement, coverage, or capacity',
      14,
      800,
      CORAL,
    ),
    text(
      WIDTH - MARGIN,
      44,
      'accepted exterior hybrid · literal gameplay scale · no production promotion',
      12,
      760,
      GREEN,
      'end',
    ),
    text(
      WIDTH - MARGIN,
      70,
      `128u authoring · 112u wall · character ×${CHARACTER_VISUAL_SCALE} · schema ${CURRENT_SCHEMA_VERSION}`,
      11.5,
      650,
      MUTED,
      'end',
    ),
  ];
  inclusionGate(parts);
  candidateCards(parts);
  systemScenePanel(parts, renderer);
  stateAndFarPanel(parts, renderer);
  reusePanel(parts, renderer);
  deferredPanel(parts);
  approvalBoundary(parts);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" ` +
    `viewBox="0 0 ${WIDTH} ${HEIGHT}">${parts.join('')}</svg>`
  );
}

function decisionMarkdown(): string {
  const lines = [
    '# QuotaCo systems-first exterior prop gap v1',
    '',
    'Status: review-only. No production ids, templates, sources, facility registrations, exports, schema, gameplay implementation, or Unity integration are changed.',
    '',
    '## Inclusion gate',
    '',
    'A candidate proceeds only when all four answers are concrete:',
    '',
    '1. Which named gameplay system reads it?',
    '2. What visible operational state can change?',
    '3. What do employees do differently because it exists?',
    '4. Why must the consequence be visible on the floor?',
    '',
    '## First candidates',
    '',
    '| Candidate | Receiver | Floor consequence | Human consequence | Readiness |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const candidate of GAMEPLAY_GAP_CANDIDATES) {
    lines.push(
      `| \`${candidate.id}\` | ${candidate.systemReceiver} | ${candidate.floorConsequence} | ${candidate.humanConsequence} | ${candidate.readiness} |`,
    );
  }
  lines.push(
    '',
    '## Existing assets to reuse before adding art',
    '',
    '- `tree-canopy`: shade or outdoor recovery context.',
    '- `park-bench`: recovery seating and social co-presence.',
    '- `picnic-table`: shared outdoor break venue and finite seating capacity.',
    '- `lamp-post`: practical lighting or safety coverage.',
    '- `bike-rack`: arrival/commute capacity if that system is approved.',
    '',
    '## Deferred',
    '',
  );
  for (const item of DEFERRED_NON_SYSTEM_GAPS) lines.push(`- ${item}.`);
  lines.push(
    '',
    'HVAC remains a candidate, not an implied system commitment. Its inclusion says that climate coverage, noise, breakdown, and incident response could produce useful floor consequences. Temperature, power, and maintenance simulation require separate design approval.',
    '',
  );
  return lines.join('\n');
}

function metrics(): object {
  return {
    status: 'review-only-awaiting-systems-and-visual-approval',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    authoringCanvas: AUTHORING_CANVAS,
    wallDatum: WALL_DATUM,
    characterVisualScale: CHARACTER_VISUAL_SCALE,
    propVisualMultiplier: null,
    propNativeFrameCells: PROP_NATIVE_FRAME_CELLS,
    candidateCount: GAMEPLAY_GAP_CANDIDATES.length,
    candidates: GAMEPLAY_GAP_CANDIDATES,
    existingSystemReuseIds: EXISTING_SYSTEM_REUSE_IDS,
    deferredNonSystemGaps: DEFERRED_NON_SYSTEM_GAPS,
    proofGates: [
      'close 128-unit source read',
      `${NORMAL_CELL}px-per-cell literal context`,
      `${FAR_CELL}px-per-cell far crowded context`,
      'wall-slot context',
      'camera and sensor coverage overlays',
      'hedge occlusion',
      'HVAC service approach',
      'rated, degraded, and inoperative state reads',
    ],
    mutationsPerformed: {
      propIds: false,
      templates: false,
      productionSvgSources: false,
      facilityCatalog: false,
      gameplaySystems: false,
      exporter: false,
      schema: false,
      unityRegistration: false,
      commit: false,
    },
  };
}

export function validateGameplaySystemsPropGap(): {
  candidateCount: number;
  existingReuseCount: number;
  deferredCount: number;
} {
  const ids = GAMEPLAY_GAP_CANDIDATES.map(({ id }) => id);
  if (new Set(ids).size !== ids.length) {
    throw new Error('Gameplay prop gap candidates contain duplicate ids');
  }
  for (const id of ids) {
    if (PROP_TEMPLATES.some((template) => template.id === id)) {
      throw new Error(`Review-only candidate already exists as live template ${id}`);
    }
  }
  for (const id of EXISTING_SYSTEM_REUSE_IDS) {
    if (!PROP_TEMPLATES.some((template) => template.id === id)) {
      throw new Error(`Missing existing gameplay reuse prop ${id}`);
    }
  }
  return {
    candidateCount: ids.length,
    existingReuseCount: EXISTING_SYSTEM_REUSE_IDS.length,
    deferredCount: DEFERRED_NON_SYSTEM_GAPS.length,
  };
}

export async function renderGameplaySystemsPropGap(
  output: string,
): Promise<{
  svgPath: string;
  pngPath: string;
  metricsPath: string;
  decisionPath: string;
}> {
  validateGameplaySystemsPropGap();
  const renderer = new PropCalibrationRenderer(new Map());
  const source = sheet(renderer);
  const png = new Resvg(source, {
    font: { loadSystemFonts: true },
  }).render().asPng();
  await mkdir(output, { recursive: true });
  const base = 'quota-co-gameplay-systems-prop-gap-v1';
  const svgPath = path.join(output, `${base}.svg`);
  const pngPath = path.join(output, `${base}.png`);
  const metricsPath = path.join(output, `${base}-metrics.json`);
  const decisionPath = path.join(output, `${base}.md`);
  await writeFile(svgPath, source, 'utf8');
  await writeFile(pngPath, png);
  await writeFile(
    metricsPath,
    `${JSON.stringify(metrics(), null, 2)}\n`,
    'utf8',
  );
  await writeFile(decisionPath, `${decisionMarkdown()}\n`, 'utf8');
  return { svgPath, pngPath, metricsPath, decisionPath };
}

interface CliOptions {
  readonly output: string;
}

function parseArgs(args: readonly string[]): CliOptions {
  let output = path.resolve('docs/previews');
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--out') {
      const value = args[++index];
      if (!value) throw new Error('--out requires a path');
      output = path.resolve(value);
      continue;
    }
    throw new Error(`Unknown argument ${argument}`);
  }
  return { output };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const result = await renderGameplaySystemsPropGap(options.output);
  process.stdout.write(
    'Wrote review-only systems-first exterior prop gap proof:\n' +
      `${result.svgPath}\n` +
      `${result.pngPath}\n` +
      `${result.metricsPath}\n` +
      `${result.decisionPath}\n`,
  );
}

if (
  process.argv[1]?.endsWith('quotaCoGameplaySystemsPropGapPreview.ts')
) {
  main().catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
