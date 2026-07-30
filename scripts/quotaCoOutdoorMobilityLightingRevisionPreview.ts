/**
 * Review-only second pass for the two exterior carriers that remained open:
 * bike-rack and lamp-post.
 *
 *   node --import tsx scripts/quotaCoOutdoorMobilityLightingRevisionPreview.ts
 *   node --import tsx scripts/quotaCoOutdoorMobilityLightingRevisionPreview.ts --out docs/previews
 *
 * This sheet generates temporary comparison pixels only. It does not create
 * standalone prop sources, alter templates, or change export/Unity contracts.
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
import { renderOutdoorProposalSvg } from './quotaCoOutdoorConstructionCalibrationPreview';
import { PropCalibrationRenderer } from './quotaCoPropRedesignCalibrationPreview';
import { PROP_NATIVE_FRAME_CELLS } from './quotaCoWorkstationFamilyCalibrationPreview';

const WIDTH = 2400;
const HEIGHT = 1510;
const AUTHORING_CANVAS = 128;
const WALL_DATUM = 112;
const CHARACTER_VISUAL_SCALE = 0.65;
const CHARACTER_FRAME_CELLS = 1.55 * CHARACTER_VISUAL_SCALE;
const NORMAL_CELL = 74;
const FAR_CELL = 40;

const PAGE = '#E7E1D2';
const PANEL = '#F6F1E6';
const PANEL_ALT = '#ECE5D7';
const GREEN_SOFT = '#DCE9DD';
const TEAL_SOFT = '#D8E6E4';
const INK = '#292C2A';
const MUTED = '#626861';
const RULE = '#A39B8B';
const GREEN = '#355647';
const CORAL = '#B65F4D';
const BLUE = '#294565';
const FLOOR_LINE = '#D9D4C7';
const GRASS = '#667A5D';
const WALK = '#C8C2B2';
const OCCUPANCY = '#E7DDAF';

const Q = {
  cream: '#DED5BD',
  creamLight: '#F1ECD9',
  green: '#355247',
  greenLight: '#55756A',
  teal: '#4E7470',
  coral: '#B65F4D',
  charcoal: '#262B29',
  light: '#FFF0B8',
} as const;

export type MobilityLightingRevisionId =
  | 'rack-low-staple'
  | 'rack-wheel-channel'
  | 'rack-docking-rail'
  | 'light-offset-arm'
  | 'light-twin-head'
  | 'light-hooded-lantern';

interface RevisionDirection {
  readonly id: MobilityLightingRevisionId;
  readonly carrier: 'bike-rack' | 'lamp-post';
  readonly label: string;
  readonly cue: string;
  readonly tradeoff: string;
}

export const MOBILITY_LIGHTING_REVISION_DIRECTIONS:
readonly RevisionDirection[] = [
  {
    id: 'rack-low-staple',
    carrier: 'bike-rack',
    label: 'LOW STAPLE BANK',
    cue: 'Three broad inverted-U locking hoops and six explicit ground mounts.',
    tradeoff: 'Strongest conventional rack read with the quietest far silhouette.',
  },
  {
    id: 'rack-wheel-channel',
    carrier: 'bike-rack',
    label: 'WHEEL CHANNELS',
    cue: 'Four plan-projected wheel slots terminate in one service rail.',
    tradeoff: 'Clear parking function up close, but the narrow slots compress at far zoom.',
  },
  {
    id: 'rack-docking-rail',
    carrier: 'bike-rack',
    label: 'DOCKING RAIL',
    cue: 'Three lock posts and approach channels make the interaction face explicit.',
    tradeoff: 'Most QuotaCo-specific, but risks reading as scooter or charging infrastructure.',
  },
  {
    id: 'light-offset-arm',
    carrier: 'lamp-post',
    label: 'OFFSET SERVICE ARM',
    cue: 'One bent mast carries a broad, shielded lamp with a visible luminous underside.',
    tradeoff: 'Most immediate street-light read while retaining a compact 1×1 base.',
  },
  {
    id: 'light-twin-head',
    carrier: 'lamp-post',
    label: 'TWIN PARKING HEAD',
    cue: 'A centered mast and two opposing heads establish parking-lot coverage.',
    tradeoff: 'Strong facility read, though the wide top becomes busier near walls.',
  },
  {
    id: 'light-hooded-lantern',
    carrier: 'lamp-post',
    label: 'HOODED CAMPUS LANTERN',
    cue: 'A low shielded cap and glowing core favor paths and employee spaces.',
    tradeoff: 'Warmest campus character, but less clearly a street light at far zoom.',
  },
];

export const RECOMMENDED_MOBILITY_LIGHTING_REVISIONS = {
  bikeRack: 'rack-low-staple',
  lampPost: 'light-offset-arm',
} as const satisfies {
  readonly bikeRack: MobilityLightingRevisionId;
  readonly lampPost: MobilityLightingRevisionId;
};

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
  size = 12,
  weight = 600,
  fill = INK,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return (
    `<text x="${x}" y="${y}" fill="${fill}" font-family="Inter, Arial, sans-serif" ` +
    `font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">` +
    `${escapeText(value)}</text>`
  );
}

function wrappedText(
  x: number,
  y: number,
  value: string,
  maxCharacters: number,
  lineHeight: number,
  size = 10,
  weight = 560,
  fill = MUTED,
): string {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxCharacters && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return (
    `<text x="${x}" y="${y}" fill="${fill}" font-family="Inter, Arial, sans-serif" ` +
    `font-size="${size}" font-weight="${weight}">` +
    lines
      .map(
        (lineText, index) =>
          `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">` +
          `${escapeText(lineText)}</tspan>`,
      )
      .join('') +
    '</text>'
  );
}

function panel(
  x: number,
  y: number,
  width: number,
  height: number,
  fill = PANEL,
  stroke = RULE,
  radius = 12,
): string {
  return (
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" ` +
    `fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>`
  );
}

function r(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  stroke = false,
  opacity = 1,
): string {
  return (
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" ` +
    `fill="${fill}" opacity="${opacity}"` +
    (stroke
      ? ` stroke="${Q.charcoal}" stroke-width="3" stroke-linejoin="round"`
      : '') +
    '/>'
  );
}

function ellipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fill: string,
  opacity = 1,
): string {
  return (
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ` +
    `fill="${fill}" opacity="${opacity}"/>`
  );
}

function circle(
  cx: number,
  cy: number,
  radius: number,
  fill: string,
  stroke = false,
): string {
  return (
    `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${fill}"` +
    (stroke ? ` stroke="${Q.charcoal}" stroke-width="3"` : '') +
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

function shape(
  d: string,
  fill: string,
  stroke = false,
  opacity = 1,
): string {
  return (
    `<path d="${d}" fill="${fill}" opacity="${opacity}"` +
    (stroke
      ? ` stroke="${Q.charcoal}" stroke-width="3" stroke-linejoin="round"`
      : '') +
    '/>'
  );
}

function spriteSvg(contents: string): string {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ' +
    'viewBox="0 0 128 128">' +
    contents +
    '</svg>'
  );
}

function rackLowStaple(): string {
  const hoops = [34, 64, 94]
    .map(
      (center) =>
        line(
          `M ${center - 11} 82 V 58 Q ${center - 11} 44 ${center} 44 ` +
            `Q ${center + 11} 44 ${center + 11} 58 V 82`,
          Q.cream,
          8,
        ),
    )
    .join('');
  const boots = [23, 45, 53, 75, 83, 105]
    .map((x) => r(x - 4, 78, 8, 12, 3, Q.charcoal))
    .join('');
  return spriteSvg(
    [
      ellipse(64, 96, 52, 7, '#000000', 0.12),
      r(10, 83, 108, 15, 7, Q.green, true),
      r(17, 88, 94, 5, 2.5, Q.teal),
      hoops,
      boots,
      line('M 57 58 Q 64 50 71 58 V 66 H 57 Z', Q.coral, 3),
      circle(64, 62, 3, Q.creamLight),
    ].join(''),
  );
}

function rackWheelChannel(): string {
  const channels = [28, 52, 76, 100]
    .map((x) =>
      [
        r(x - 7, 35, 14, 55, 7, Q.cream, true),
        r(x - 3, 42, 6, 39, 3, Q.charcoal),
        circle(x, 49, 3, Q.coral),
      ].join(''),
    )
    .join('');
  return spriteSvg(
    [
      ellipse(64, 98, 52, 7, '#000000', 0.12),
      channels,
      r(10, 82, 108, 17, 8, Q.green, true),
      r(18, 87, 92, 6, 3, Q.teal),
    ].join(''),
  );
}

function rackDockingRail(): string {
  const docks = [32, 64, 96]
    .map((x) =>
      [
        r(x - 11, 41, 22, 31, 9, Q.cream, true),
        circle(x, 53, 5, Q.coral, true),
        line(`M ${x} 69 V 88`, Q.charcoal, 7),
        line(`M ${x} 72 V 87`, Q.greenLight, 3),
      ].join(''),
    )
    .join('');
  return spriteSvg(
    [
      ellipse(64, 99, 52, 7, '#000000', 0.12),
      r(9, 84, 110, 16, 8, Q.green, true),
      r(17, 89, 94, 5, 2.5, Q.teal),
      docks,
    ].join(''),
  );
}

function lightOffsetArm(): string {
  return spriteSvg(
    [
      ellipse(60, 118, 22, 5, '#000000', 0.14),
      r(43, 106, 34, 12, 6, Q.charcoal, true),
      line('M 60 107 V 39 Q 60 27 72 27 H 98', Q.charcoal, 15),
      line('M 60 104 V 40 Q 60 32 72 32 H 97', Q.green, 9),
      r(84, 20, 34, 19, 8, Q.cream, true),
      r(90, 31, 24, 8, 4, Q.light, true),
      r(51, 69, 18, 24, 7, Q.cream, true),
      r(56, 75, 8, 9, 3, Q.coral),
      line('M 48 111 H 72', Q.coral, 3),
    ].join(''),
  );
}

function lightTwinHead(): string {
  return spriteSvg(
    [
      ellipse(64, 118, 22, 5, '#000000', 0.14),
      r(47, 106, 34, 12, 6, Q.charcoal, true),
      r(57, 35, 14, 75, 7, Q.green, true),
      line('M 35 32 H 93', Q.charcoal, 13),
      line('M 37 32 H 91', Q.green, 7),
      r(16, 20, 37, 20, 8, Q.cream, true),
      r(75, 20, 37, 20, 8, Q.cream, true),
      r(22, 32, 25, 7, 3.5, Q.light, true),
      r(81, 32, 25, 7, 3.5, Q.light, true),
      r(53, 70, 22, 24, 8, Q.cream, true),
      circle(64, 82, 4, Q.coral),
    ].join(''),
  );
}

function lightHoodedLantern(): string {
  return spriteSvg(
    [
      ellipse(64, 118, 22, 5, '#000000', 0.14),
      r(47, 106, 34, 12, 6, Q.charcoal, true),
      r(57, 47, 14, 64, 7, Q.green, true),
      shape('M 35 34 Q 64 12 93 34 L 84 48 H 44 Z', Q.green, true),
      r(45, 34, 38, 22, 10, Q.cream, true),
      r(51, 41, 26, 13, 6, Q.light, true),
      r(53, 76, 22, 20, 7, Q.cream, true),
      r(58, 82, 12, 7, 3, Q.coral),
    ].join(''),
  );
}

export function renderMobilityLightingRevisionSvg(
  id: MobilityLightingRevisionId,
): string {
  switch (id) {
    case 'rack-low-staple':
      return rackLowStaple();
    case 'rack-wheel-channel':
      return rackWheelChannel();
    case 'rack-docking-rail':
      return rackDockingRail();
    case 'light-offset-arm':
      return lightOffsetArm();
    case 'light-twin-head':
      return lightTwinHead();
    case 'light-hooded-lantern':
      return lightHoodedLantern();
  }
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

function directionCard(
  direction: RevisionDirection,
  index: number,
  rowY: number,
): string {
  const x = 618 + index * 574;
  const recommended =
    direction.id === RECOMMENDED_MOBILITY_LIGHTING_REVISIONS.bikeRack ||
    direction.id === RECOMMENDED_MOBILITY_LIGHTING_REVISIONS.lampPost;
  return [
    panel(
      x,
      rowY,
      548,
      265,
      recommended ? GREEN_SOFT : PANEL_ALT,
      recommended ? GREEN : RULE,
      10,
    ),
    text(x + 18, rowY + 28, direction.label, 12, 850, GREEN),
    recommended
      ? text(x + 530, rowY + 28, 'RECOMMENDED', 8.5, 820, CORAL, 'end')
      : '',
    placedSvg(
      renderMobilityLightingRevisionSvg(direction.id),
      x + 194,
      rowY + 35,
      160,
    ),
    wrappedText(x + 18, rowY + 211, direction.cue, 75, 14, 9.5, 680, INK),
    wrappedText(
      x + 18,
      rowY + 244,
      direction.tradeoff,
      82,
      13,
      8.5,
      560,
      MUTED,
    ),
  ].join('');
}

function comparisonRow(
  carrier: 'bike-rack' | 'lamp-post',
  y: number,
): string {
  const directions = MOBILITY_LIGHTING_REVISION_DIRECTIONS.filter(
    (direction) => direction.carrier === carrier,
  );
  const priorDirection =
    carrier === 'bike-rack' ? 'lived-campus' : 'service-coded-edge';
  const title =
    carrier === 'bike-rack'
      ? 'BIKE RACK · restore a plan-projected locking/parking read'
      : 'STREET LIGHT · make the emitting head own the silhouette';
  return [
    panel(36, y, WIDTH - 72, 330, carrier === 'bike-rack' ? PANEL : TEAL_SOFT),
    text(58, y + 34, title, 17, 880, GREEN),
    text(
      WIDTH - 58,
      y + 34,
      carrier === 'bike-rack'
        ? '2×1 footprint · plan projection held'
        : '1×1 footprint · elevation projection held',
      9.5,
      760,
      CORAL,
      'end',
    ),
    panel(58, y + 54, 534, 265, PANEL_ALT, RULE, 10),
    text(76, y + 82, 'ACCEPTED V1', 12, 850, BLUE),
    placedSvg(
      renderOutdoorProposalSvg(priorDirection, carrier),
      245,
      y + 89,
      160,
    ),
    wrappedText(
      76,
      y + 265,
      carrier === 'bike-rack'
        ? 'Repeated pale loops remain, but the hook-like tops and decorative edge compete with the rack noun.'
        : 'The centered cap, stacked coral collars, and short mast read closer to a signal or decorated bollard.',
      69,
      15,
      9.5,
      620,
      MUTED,
    ),
    ...directions.map((direction, index) =>
      directionCard(direction, index, y + 54),
    ),
  ].join('');
}

function drawGrid(
  x: number,
  y: number,
  columns: number,
  rows: number,
  cell: number,
): string {
  const parts = [
    `<rect x="${x}" y="${y}" width="${columns * cell}" height="${rows * cell}" ` +
      `fill="${GRASS}" stroke="#56616A" stroke-width="2"/>`,
    `<rect x="${x}" y="${y + 2.35 * cell}" width="${columns * cell}" ` +
      `height="${0.65 * cell}" fill="${WALK}" opacity=".95"/>`,
  ];
  for (let column = 1; column < columns; column += 1) {
    parts.push(
      line(
        `M ${x + column * cell} ${y} V ${y + rows * cell}`,
        FLOOR_LINE,
        1,
        0.14,
      ),
    );
  }
  for (let row = 1; row < rows; row += 1) {
    parts.push(
      line(
        `M ${x} ${y + row * cell} H ${x + columns * cell}`,
        FLOOR_LINE,
        1,
        0.14,
      ),
    );
  }
  return parts.join('');
}

function facade(
  renderer: PropCalibrationRenderer,
  x: number,
  y: number,
  columns: number,
  cell: number,
): string {
  const parts = [renderer.wallTile(6, x, y, cell)];
  for (let column = 1; column < columns - 1; column += 1) {
    parts.push(renderer.wallTile(10, x + column * cell, y, cell));
  }
  parts.push(renderer.wallTile(12, x + (columns - 1) * cell, y, cell));
  return parts.join('');
}

function occupancyGuide(
  x: number,
  y: number,
  width: number,
  height: number,
): string {
  return (
    `<rect x="${x + 3}" y="${y + 3}" width="${width - 6}" height="${height - 6}" ` +
    `rx="5" fill="${OCCUPANCY}" fill-opacity=".08" stroke="${OCCUPANCY}" ` +
    'stroke-width="1.3" stroke-dasharray="5 4"/>'
  );
}

function propPlacement(
  source: string,
  carrier: 'bike-rack' | 'lamp-post',
  footprintX: number,
  footprintY: number,
  cell: number,
): string {
  const footprintWidth = (carrier === 'bike-rack' ? 2 : 1) * cell;
  const footprintHeight = cell;
  const spriteSize = cell * PROP_NATIVE_FRAME_CELLS;
  const x = footprintX + (footprintWidth - spriteSize) / 2;
  const y =
    carrier === 'bike-rack'
      ? footprintY + (footprintHeight - spriteSize) / 2
      : footprintY + footprintHeight - spriteSize * (116 / AUTHORING_CANVAS);
  return (
    occupancyGuide(
      footprintX,
      footprintY,
      footprintWidth,
      footprintHeight,
    ) + placedSvg(source, x, y, spriteSize)
  );
}

interface CharacterPlacement {
  readonly recipe: CharacterRecipe;
  readonly facing: Facing | 'west';
  readonly x: number;
  readonly y: number;
}

function characterPlacement(
  renderer: PropCalibrationRenderer,
  spec: CharacterPlacement,
  roomX: number,
  roomY: number,
  cell: number,
): string {
  const frame = cell * CHARACTER_FRAME_CELLS;
  return placedSvg(
    renderer.character(spec.recipe, spec.facing, 'neutral'),
    roomX + spec.x * cell - frame / 2,
    roomY + spec.y * cell - frame * 0.86,
    frame,
  );
}

function bicycleContext(x: number, y: number, scale: number): string {
  return [
    circle(x, y, 10 * scale, 'none', true).replace(
      'fill="none"',
      'fill="none"',
    ),
    circle(x + 31 * scale, y, 10 * scale, 'none', true).replace(
      'fill="none"',
      'fill="none"',
    ),
    line(
      `M ${x} ${y} L ${x + 12 * scale} ${y - 18 * scale} ` +
        `L ${x + 23 * scale} ${y} H ${x} ` +
        `M ${x + 12 * scale} ${y - 18 * scale} H ${x + 26 * scale} ` +
        `L ${x + 31 * scale} ${y}`,
      Q.charcoal,
      3 * scale,
    ),
    line(
      `M ${x + 11 * scale} ${y - 20 * scale} L ${x + 8 * scale} ${y - 26 * scale} ` +
        `M ${x + 24 * scale} ${y - 20 * scale} H ${x + 31 * scale}`,
      Q.charcoal,
      2.5 * scale,
    ),
  ].join('');
}

function scene(
  renderer: PropCalibrationRenderer,
  x: number,
  y: number,
  cell: number,
  revised: boolean,
  crowded: boolean,
): string {
  const columns = 8;
  const rows = 4;
  const rackSource = revised
    ? renderMobilityLightingRevisionSvg(
        RECOMMENDED_MOBILITY_LIGHTING_REVISIONS.bikeRack,
      )
    : renderOutdoorProposalSvg('lived-campus', 'bike-rack');
  const lightSource = revised
    ? renderMobilityLightingRevisionSvg(
        RECOMMENDED_MOBILITY_LIGHTING_REVISIONS.lampPost,
      )
    : renderOutdoorProposalSvg('service-coded-edge', 'lamp-post');
  const actors: readonly CharacterPlacement[] = crowded
    ? [
        { recipe: DEFAULT_CAST[0], facing: 'south', x: 3.15, y: 3.55 },
        { recipe: DEFAULT_CAST[1], facing: 'east', x: 4.65, y: 3.25 },
        { recipe: DEFAULT_CAST[2], facing: 'west', x: 6.1, y: 3.65 },
      ]
    : [
        { recipe: DEFAULT_CAST[0], facing: 'east', x: 3.55, y: 3.45 },
        { recipe: DEFAULT_CAST[2], facing: 'west', x: 6.25, y: 3.55 },
      ];
  const lightCenterX = x + 6.45 * cell;
  const lightCenterY = y + 2.15 * cell;
  return [
    drawGrid(x, y, columns, rows, cell),
    facade(renderer, x, y, columns, cell),
    revised
      ? shape(
          `M ${lightCenterX} ${lightCenterY} ` +
            `L ${lightCenterX - 1.1 * cell} ${y + 3.65 * cell} ` +
            `L ${lightCenterX + 0.75 * cell} ${y + 3.65 * cell} Z`,
          Q.light,
          false,
          0.11,
        )
      : '',
    propPlacement(
      rackSource,
      'bike-rack',
      x + 0.65 * cell,
      y + 1.35 * cell,
      cell,
    ),
    revised
      ? bicycleContext(
          x + 1.27 * cell,
          y + 2.35 * cell,
          cell / NORMAL_CELL,
        )
      : '',
    ...actors.map((actor) =>
      characterPlacement(renderer, actor, x, y, cell),
    ),
    propPlacement(
      lightSource,
      'lamp-post',
      x + 6.1 * cell,
      y + 1.35 * cell,
      cell,
    ),
  ].join('');
}

function contextPanel(
  parts: string[],
  renderer: PropCalibrationRenderer,
): void {
  const y = 800;
  parts.push(
    panel(36, y, WIDTH - 72, 570, PANEL_ALT),
    text(58, y + 35, 'Literal gameplay-scale comparison', 18, 880, GREEN),
    text(
      WIDTH - 58,
      y + 35,
      'accepted 112u wall · character ×0.65 · prop multipliers independent',
      9.5,
      760,
      CORAL,
      'end',
    ),
  );

  const roomY = y + 76;
  parts.push(
    text(58, y + 63, 'ACCEPTED V1 · NORMAL', 10, 820, BLUE),
    scene(renderer, 58, roomY, NORMAL_CELL, false, false),
    text(676, y + 63, 'RECOMMENDED PAIR · NORMAL + INTERACTION', 10, 820, GREEN),
    scene(renderer, 676, roomY, NORMAL_CELL, true, false),
    text(1294, y + 63, 'RECOMMENDED PAIR · FAR + CROWDED', 10, 820, GREEN),
    scene(renderer, 1294, roomY, FAR_CELL, true, true),
  );

  const noteX = 1642;
  parts.push(
    panel(noteX, roomY, 696, 395, GREEN_SOFT, 'none', 10),
    text(noteX + 22, roomY + 34, 'Read targets', 15, 850, GREEN),
  );
  const notes = [
    'Rack remains plan-projected and inside its preserved 2×1 occupancy.',
    'Three wide negative spaces survive far zoom; mounts read as ground hardware, not feet.',
    'The context-only bicycle meets a hoop without becoming part of the prop source.',
    'The offset lamp head owns the light silhouette; coral is confined to its access panel.',
    'The 1×1 light base and interaction clearance remain unchanged beside the wall and crowd.',
  ];
  notes.forEach((note, index) => {
    parts.push(
      circle(
        noteX + 26,
        roomY + 76 + index * 59,
        4,
        index < 2 ? GREEN : CORAL,
      ),
      wrappedText(
        noteX + 42,
        roomY + 80 + index * 59,
        note,
        93,
        15,
        10,
        620,
        index < 2 ? INK : MUTED,
      ),
    );
  });

  parts.push(
    text(
      58,
      y + 534,
      'Dashed = preserved occupancy. Bicycle and light cone are evaluation context only.',
      9.5,
      650,
      BLUE,
    ),
    text(
      WIDTH - 58,
      y + 534,
      'No source SVG creation · no template/export/Unity change · no commit',
      9.5,
      720,
      CORAL,
      'end',
    ),
  );
}

function revisionSheet(renderer: PropCalibrationRenderer): string {
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" ` +
      `viewBox="0 0 ${WIDTH} ${HEIGHT}">`,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAGE}"/>`,
    text(
      36,
      44,
      'QuotaCo exterior prop family · bike rack + street light second pass',
      24,
      900,
      INK,
    ),
    text(
      36,
      70,
      'REVIEW ONLY · two open carriers isolated from the otherwise accepted first-pass hybrid',
      11,
      760,
      CORAL,
    ),
    text(
      WIDTH - 36,
      44,
      'functional noun first · hybrid material grammar second',
      10,
      720,
      GREEN,
      'end',
    ),
    text(
      WIDTH - 36,
      70,
      `${AUTHORING_CANVAS}u authoring · ${WALL_DATUM}u wall · character ×${CHARACTER_VISUAL_SCALE} · schema ${CURRENT_SCHEMA_VERSION}`,
      9,
      620,
      MUTED,
      'end',
    ),
    comparisonRow('bike-rack', 90),
    comparisonRow('lamp-post', 435),
  ];
  contextPanel(parts, renderer);
  parts.push(
    text(
      36,
      1455,
      'Approval target: choose or revise one rack and one light direction before updating the consolidated exterior family.',
      12,
      760,
      INK,
    ),
    text(
      36,
      1482,
      'Production pixels, genuine editable SVGs, template registration, exports, and Unity integration remain held.',
      10,
      650,
      CORAL,
    ),
    '</svg>',
  );
  return parts.join('');
}

export function validateMobilityLightingRevision(): {
  readonly directionCount: number;
  readonly liveCarrierCount: number;
} {
  const ids = new Set<MobilityLightingRevisionId>();
  for (const direction of MOBILITY_LIGHTING_REVISION_DIRECTIONS) {
    if (ids.has(direction.id)) {
      throw new Error(`Duplicate revision direction ${direction.id}`);
    }
    ids.add(direction.id);
    const source = renderMobilityLightingRevisionSvg(direction.id);
    if (!source.includes('viewBox="0 0 128 128"')) {
      throw new Error(`${direction.id} does not use the 128u authoring canvas`);
    }
  }
  const expected = [
    {
      id: 'bike-rack',
      projection: 'plan',
      gridFootprint: { w: 2, h: 1 },
    },
    {
      id: 'lamp-post',
      projection: 'elevation',
      gridFootprint: { w: 1, h: 1 },
    },
  ] as const;
  for (const contract of expected) {
    const template = PROP_TEMPLATES.find(({ id }) => id === contract.id);
    if (!template) throw new Error(`Missing live carrier ${contract.id}`);
    if (
      template.projection !== contract.projection ||
      template.gridFootprint.w !== contract.gridFootprint.w ||
      template.gridFootprint.h !== contract.gridFootprint.h
    ) {
      throw new Error(`${contract.id} live contract drifted during review`);
    }
  }
  return {
    directionCount: MOBILITY_LIGHTING_REVISION_DIRECTIONS.length,
    liveCarrierCount: expected.length,
  };
}

function metrics(): object {
  return {
    title: 'QuotaCo bike rack and street light revision',
    status: 'review-only',
    authoringCanvas: AUTHORING_CANVAS,
    wallDatum: WALL_DATUM,
    characterVisualScale: CHARACTER_VISUAL_SCALE,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    gameplayZooms: {
      normalPixelsPerCell: NORMAL_CELL,
      farPixelsPerCell: FAR_CELL,
    },
    heldContracts: {
      bikeRack: {
        templateId: 'bike-rack',
        projection: 'plan',
        gridFootprint: { w: 2, h: 1 },
      },
      lampPost: {
        templateId: 'lamp-post',
        projection: 'elevation',
        gridFootprint: { w: 1, h: 1 },
      },
      roots: 'unchanged',
      collisions: 'unchanged',
      anchors: 'unchanged',
      exports: 'unchanged',
      unityRegistration: 'unchanged',
    },
    directions: MOBILITY_LIGHTING_REVISION_DIRECTIONS,
    recommendations: RECOMMENDED_MOBILITY_LIGHTING_REVISIONS,
    contextOnly: ['parked-bicycle', 'light-cone'],
    productionPromotion: false,
  };
}

function reviewMarkdown(): string {
  return [
    '# QuotaCo bike rack and street light revision',
    '',
    'Status: review only. No genuine prop sources, templates, exports, or Unity registration changed.',
    '',
    '## Recommended pair',
    '',
    '- `rack-low-staple`: three broad conventional locking hoops; plan projection and 2×1 footprint held.',
    '- `light-offset-arm`: shielded offset head makes the light noun dominant; elevation projection and 1×1 footprint held.',
    '',
    '## Approval question',
    '',
    'Choose or revise one bike-rack direction and one street-light direction. Approval updates only the consolidated exterior design decision; genuine editable SVG creation remains the following step.',
  ].join('\n');
}

export async function renderQuotaCoOutdoorMobilityLightingRevision(
  output: string,
): Promise<{
  readonly svgPath: string;
  readonly pngPath: string;
  readonly metricsPath: string;
  readonly notesPath: string;
}> {
  validateMobilityLightingRevision();
  const renderer = new PropCalibrationRenderer(new Map());
  const source = revisionSheet(renderer);
  const png = new Resvg(source, {
    font: { loadSystemFonts: true },
  })
    .render()
    .asPng();
  await mkdir(output, { recursive: true });
  const base = 'quota-co-outdoor-mobility-lighting-revision-v2';
  const svgPath = path.join(output, `${base}.svg`);
  const pngPath = path.join(output, `${base}.png`);
  const metricsPath = path.join(output, `${base}-metrics.json`);
  const notesPath = path.join(output, `${base}.md`);
  await writeFile(svgPath, source, 'utf8');
  await writeFile(pngPath, png);
  await writeFile(
    metricsPath,
    `${JSON.stringify(metrics(), null, 2)}\n`,
    'utf8',
  );
  await writeFile(notesPath, `${reviewMarkdown()}\n`, 'utf8');
  return { svgPath, pngPath, metricsPath, notesPath };
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
  const result = await renderQuotaCoOutdoorMobilityLightingRevision(
    options.output,
  );
  process.stdout.write(
    'Wrote review-only QuotaCo bike-rack/street-light revision:\n' +
      `${result.svgPath}\n` +
      `${result.pngPath}\n` +
      `${result.metricsPath}\n` +
      `${result.notesPath}\n`,
  );
}

if (
  process.argv[1]?.endsWith('quotaCoOutdoorMobilityLightingRevisionPreview.ts')
) {
  main().catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
