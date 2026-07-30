/**
 * Review-only calibration for the next QuotaCo surface-source slice.
 *
 * The current floors and grounds are valid SVG output generated from
 * FloorTemplate code. This sheet inventories that output and compares three
 * bounded redesign directions without creating source assets, changing
 * templates/defaults, exporting a bundle, or touching Unity registration.
 *
 *   node --import tsx scripts/quotaCoFloorGrassSvgCalibrationPreview.ts
 *   node --import tsx scripts/quotaCoFloorGrassSvgCalibrationPreview.ts --out docs/previews
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import { composeFloorTile } from '../src/core/compositor';
import {
  CURRENT_SCHEMA_VERSION,
  type TileInstance,
} from '../src/core/types';
import {
  DEFAULT_CAST,
  DEFAULT_FLOORS,
  DEFAULT_GROUND,
  DEFAULT_STYLE,
} from '../src/data/defaults';
import {
  FLOOR_TEMPLATES,
  GROUND_TEMPLATE_IDS,
} from '../src/tiles/templates';
import { PropCalibrationRenderer } from './quotaCoPropRedesignCalibrationPreview';

const WIDTH = 3200;
const HEIGHT = 2460;
const MARGIN = 28;
const GAP = 14;
const AUTHORING_CANVAS = 128;
const WALL_DATUM = 112;
const CHARACTER_VISUAL_SCALE = 0.65;
const NORMAL_CELL = 50;
const FAR_CELL = 26;

const PAGE = '#E7E1D2';
const PANEL = '#F6F1E6';
const PANEL_ALT = '#ECE5D7';
const GREEN_SOFT = '#DCE9DD';
const INK = '#292C2A';
const MUTED = '#626861';
const RULE = '#A39B8B';
const GREEN = '#355647';
const CORAL = '#B65F4D';
const BLUE = '#294565';

export const FLOOR_GRASS_INTERIOR_IDS = DEFAULT_FLOORS.map(({ id }) => id);
export const FLOOR_GRASS_GROUND_IDS = [
  'ground-grass',
  'ground-grass-b',
  'ground-grass-c',
] as const;

const TARGETS = [
  ...DEFAULT_FLOORS,
  ...FLOOR_GRASS_GROUND_IDS.map((id) => {
    const ground = DEFAULT_GROUND.find((candidate) => candidate.id === id);
    if (!ground) throw new Error(`Missing default grass ground ${id}`);
    return ground;
  }),
];

export const FLOOR_GRASS_DIRECTION_IDS = [
  'institutional-grid',
  'used-campus',
  'maintained-hybrid',
] as const;

export type FloorGrassDirectionId =
  (typeof FLOOR_GRASS_DIRECTION_IDS)[number];

interface Direction {
  readonly id: FloorGrassDirectionId;
  readonly label: string;
  readonly note: string;
  readonly floorRule: string;
  readonly grassRule: string;
  readonly panelFill: string;
}

const DIRECTIONS: readonly Direction[] = [
  {
    id: 'institutional-grid',
    label: 'Institutional Grid',
    note: 'Precise replaceable modules and deliberate service-zone rhythm.',
    floorRule: 'Crisp seams and broad material fields carry the noun.',
    grassRule: 'Maintained mowing cadence; nature stays visually separate.',
    panelFill: PANEL,
  },
  {
    id: 'used-campus',
    label: 'Used Campus',
    note: 'Quieter seams, broad wear, and accumulated employee use.',
    floorRule: 'Traffic wear and softened material variation dominate.',
    grassRule: 'Organic mottle, irregular tufts, and sparse flowers.',
    panelFill: PANEL_ALT,
  },
  {
    id: 'maintained-hybrid',
    label: 'Maintained Hybrid',
    note: 'Institutional substrate with restrained wear and living variation.',
    floorRule: 'Functional seams remain readable without becoming a grid UI.',
    grassRule: 'Low-frequency field masses survive far zoom; detail stays sparse.',
    panelFill: GREEN_SOFT,
  },
];

const REPRESENTATIVE_FLOOR_IDS = [
  'floor-carpet',
  'floor-utility-vinyl',
  'floor-terrazzo',
  'floor-polished-concrete',
  'floor-accent-tile',
  'floor-wood',
] as const;

function esc(value: string): string {
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
    `<text x="${x}" y="${y}" fill="${fill}" ` +
    'font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" ' +
    `font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">` +
    `${esc(value)}</text>`
  );
}

function panel(
  x: number,
  y: number,
  width: number,
  height: number,
  fill = PANEL,
  radius = 12,
): string {
  return (
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" ` +
    `rx="${radius}" fill="${fill}" stroke="${RULE}" stroke-width="1.3"/>`
  );
}

function line(
  d: string,
  stroke = RULE,
  width = 1,
  opacity = 1,
  dash = '',
): string {
  return (
    `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" ` +
    `opacity="${opacity}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`
  );
}

function stripSvg(source: string): string {
  return source
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
}

function placedSvg(
  source: string,
  x: number,
  y: number,
  width: number,
  height = width,
): string {
  return (
    `<svg x="${x}" y="${y}" width="${width}" height="${height}" ` +
    `viewBox="0 0 128 128" overflow="hidden">${stripSvg(source)}</svg>`
  );
}

function repeatSvg(
  source: string,
  x: number,
  y: number,
  columns: number,
  rows: number,
  cell: number,
): string {
  const inner = stripSvg(source);
  const copies: string[] = [
    `<svg x="${x}" y="${y}" width="${columns * cell}" height="${rows * cell}" ` +
      `viewBox="0 0 ${columns * 128} ${rows * 128}" overflow="hidden">`,
  ];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      copies.push(
        `<g transform="translate(${column * 128} ${row * 128})">${inner}</g>`,
      );
    }
  }
  copies.push('</svg>');
  return copies.join('');
}

function currentSource(instance: TileInstance): string {
  return composeFloorTile(instance, DEFAULT_STYLE, AUTHORING_CANVAS);
}

function templateLabel(instance: TileInstance): string {
  return (
    FLOOR_TEMPLATES.find(({ id }) => id === instance.templateId)?.label ??
    instance.templateId
  );
}

function paramsLabel(instance: TileInstance): string {
  const entries = Object.entries(instance.params);
  return entries.length
    ? entries.map(([key, value]) => `${key} ${value}`).join(' · ')
    : 'no parameters';
}

function inventoryCard(
  instance: TileInstance,
  x: number,
  y: number,
  width: number,
): string {
  const source = currentSource(instance);
  const isGround = FLOOR_GRASS_GROUND_IDS.includes(
    instance.id as (typeof FLOOR_GRASS_GROUND_IDS)[number],
  );
  return [
    panel(x, y, width, 168, isGround ? GREEN_SOFT : PANEL),
    text(x + 14, y + 24, instance.name.toUpperCase(), 9.5, 820, GREEN),
    text(
      x + width - 14,
      y + 24,
      isGround ? 'GROUND' : 'FLOOR',
      8,
      780,
      isGround ? GREEN : CORAL,
      'end',
    ),
    placedSvg(source, x + 14, y + 38, 88),
    repeatSvg(source, x + 118, y + 42, 4, 2, 29),
    text(x + 118, y + 116, '4×2 seamless repeat', 7.5, 650, MUTED),
    text(x + 258, y + 54, templateLabel(instance), 9, 760, INK),
    text(x + 258, y + 75, instance.id, 8, 650, BLUE),
    text(x + 258, y + 97, paramsLabel(instance), 7.8, 570, MUTED),
    text(x + 258, y + 121, 'generated in templates.ts', 7.8, 690, CORAL),
    text(x + 14, y + 151, '128u tile · flat · outline-free', 7.5, 620, MUTED),
  ].join('');
}

function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  opacity = 1,
  radius = 0,
): string {
  return (
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" ` +
    `rx="${radius}" fill="${fill}" opacity="${opacity}"/>`
  );
}

function circle(
  x: number,
  y: number,
  radius: number,
  fill: string,
  opacity = 1,
): string {
  return (
    `<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" ` +
    `opacity="${opacity}"/>`
  );
}

function ellipse(
  x: number,
  y: number,
  rx: number,
  ry: number,
  fill: string,
  opacity = 1,
): string {
  return (
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" ` +
    `fill="${fill}" opacity="${opacity}"/>`
  );
}

function tileShell(markup: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ` +
    `viewBox="0 0 128 128">${markup}</svg>`
  );
}

function floorGrid(
  size: number,
  color: string,
  opacity: number,
  offset = 0,
): string {
  const paths: string[] = [];
  for (let value = offset; value <= 128; value += size) {
    paths.push(`M ${value} 0 V 128`, `M 0 ${value} H 128`);
  }
  return line(paths.join(' '), color, 1.4, opacity);
}

function mineralChips(
  secondary: string,
  accent: string,
  opacity: number,
): string {
  const points = [
    [13, 17, 3, 2],
    [37, 11, 2, 4],
    [61, 25, 4, 2],
    [88, 14, 3, 3],
    [112, 28, 4, 2],
    [24, 52, 4, 3],
    [50, 67, 3, 2],
    [79, 49, 2, 4],
    [104, 70, 4, 3],
    [15, 92, 3, 3],
    [42, 111, 4, 2],
    [70, 91, 3, 4],
    [96, 108, 4, 2],
    [119, 94, 2, 3],
  ] as const;
  return points
    .map(([x, y, rx, ry], index) =>
      ellipse(x, y, rx, ry, index % 2 ? secondary : accent, opacity)
    )
    .join('');
}

function surfaceWear(
  direction: FloorGrassDirectionId,
  secondary: string,
  accent: string,
): string {
  if (direction === 'institutional-grid') return '';
  const opacity = direction === 'used-campus' ? 0.18 : 0.09;
  return [
    ellipse(31, 83, 22, 9, secondary, opacity),
    ellipse(101, 38, 18, 7, accent, opacity * 0.8),
    line('M 18 104 Q 39 97 60 103', secondary, 2.2, opacity * 1.8),
    line('M 82 78 Q 99 72 113 79', accent, 1.8, opacity * 1.5),
  ].join('');
}

function proposalFloorSource(
  instance: TileInstance,
  direction: FloorGrassDirectionId,
): string {
  const { primary, secondary, accent } = instance.palette;
  const id = instance.templateId;
  const seamOpacity =
    direction === 'institutional-grid'
      ? 0.26
      : direction === 'used-campus'
        ? 0.09
        : 0.16;
  const shapes: string[] = [rect(0, 0, 128, 128, primary)];

  if (id === 'wood-floor') {
    for (let y = 0; y <= 128; y += 16) {
      shapes.push(line(`M 0 ${y} H 128`, secondary, 1.2, seamOpacity));
      const joint = (y / 16) % 2 ? 40 : 88;
      shapes.push(line(`M ${joint} ${y} V ${y + 16}`, secondary, 1.2, seamOpacity));
    }
    if (direction === 'maintained-hybrid') {
      shapes.push(rect(0, 61, 128, 6, accent, 0.11));
    }
  } else if (id === 'rubber-mat') {
    for (let y = 8; y < 128; y += 16) {
      for (let x = 8; x < 128; x += 16) {
        shapes.push(circle(x, y, 2.4, secondary, 0.46));
      }
    }
  } else if (id === 'terrazzo') {
    shapes.push(mineralChips(secondary, accent, direction === 'used-campus' ? 0.42 : 0.54));
  } else if (id === 'polished-concrete' || id === 'lobby-stone') {
    shapes.push(floorGrid(64, secondary, seamOpacity));
    shapes.push(mineralChips(secondary, accent, 0.18));
  } else if (id === 'accent-tile') {
    shapes.push(floorGrid(32, secondary, seamOpacity));
    if (direction === 'institutional-grid') {
      shapes.push(rect(0, 56, 128, 16, accent, 0.48));
    } else if (direction === 'used-campus') {
      shapes.push(rect(48, 0, 32, 128, accent, 0.21));
    } else {
      shapes.push(rect(0, 58, 128, 12, accent, 0.34));
      shapes.push(rect(58, 0, 12, 128, secondary, 0.18));
    }
  } else if (
    id === 'linoleum' ||
    id === 'utility-vinyl'
  ) {
    const gridSize = direction === 'used-campus' ? 64 : 32;
    shapes.push(floorGrid(gridSize, secondary, seamOpacity));
    if (direction === 'maintained-hybrid') {
      shapes.push(rect(0, 0, 128, 8, accent, 0.11));
    }
  } else if (
    id === 'carpet' ||
    id === 'carpet-tiles' ||
    id === 'quiet-carpet'
  ) {
    const bandOpacity =
      direction === 'institutional-grid'
        ? 0.12
        : direction === 'used-campus'
          ? 0.06
          : 0.09;
    shapes.push(
      rect(0, 0, 64, 64, secondary, bandOpacity),
      rect(64, 64, 64, 64, secondary, bandOpacity),
    );
    if (id !== 'carpet') shapes.push(floorGrid(64, secondary, seamOpacity));
    if (id === 'quiet-carpet') {
      shapes.push(
        line('M -64 0 L 64 128 M 0 0 L 128 128 M 64 0 L 192 128', accent, 1, 0.12),
      );
    }
  } else if (id === 'astroturf') {
    shapes.push(
      rect(32, 0, 32, 128, secondary, 0.22),
      rect(96, 0, 32, 128, secondary, 0.22),
    );
  } else {
    shapes.push(floorGrid(32, secondary, seamOpacity));
  }

  shapes.push(surfaceWear(direction, secondary, accent));
  return tileShell(shapes.join(''));
}

function wrappedFieldPatches(
  shift: number,
  secondary: string,
  accent: string,
  opacity: number,
): string {
  const patches = [
    [18 + shift, 22, 25, 13, secondary],
    [79 + shift, 47, 34, 18, accent],
    [42 + shift, 105, 31, 15, secondary],
    [119 + shift, 91, 22, 13, accent],
  ] as const;
  const output: string[] = [];
  for (const [rawX, y, rx, ry, fill] of patches) {
    const x = ((rawX % 128) + 128) % 128;
    for (const dx of [-128, 0, 128]) {
      output.push(ellipse(x + dx, y, rx, ry, fill, opacity));
    }
  }
  return output.join('');
}

function proposalGrassSource(
  instance: TileInstance,
  direction: FloorGrassDirectionId,
): string {
  const { primary, secondary, accent } = instance.palette;
  const seed = instance.params.seed ?? 1;
  const shift = (seed * 11) % 31;
  const shapes: string[] = [rect(0, 0, 128, 128, primary)];

  if (direction === 'institutional-grid') {
    shapes.push(
      rect(32, 0, 32, 128, secondary, 0.12),
      rect(96, 0, 32, 128, secondary, 0.12),
    );
  } else {
    shapes.push(
      wrappedFieldPatches(
        shift,
        secondary,
        accent,
        direction === 'used-campus' ? 0.2 : 0.14,
      ),
    );
    if (direction === 'maintained-hybrid') {
      shapes.push(
        rect(32, 0, 32, 128, secondary, 0.055),
        rect(96, 0, 32, 128, secondary, 0.055),
      );
    }
  }

  const tuftPoints =
    direction === 'institutional-grid'
      ? [[16, 29], [48, 87], [80, 35], [112, 99]]
      : [[11, 31], [28, 92], [53, 50], [74, 112], [97, 69], [117, 20]];
  for (const [rawX, rawY] of tuftPoints) {
    const x = (rawX + shift) % 128;
    const y = (rawY + shift * 0.4) % 128;
    shapes.push(
      line(`M ${x - 3} ${y + 4} L ${x} ${y - 3} L ${x + 2} ${y + 4}`, secondary, 1.4, 0.62),
      line(`M ${x + 1} ${y + 4} L ${x + 5} ${y - 1}`, accent, 1.2, 0.55),
    );
  }

  if (direction !== 'institutional-grid') {
    const flowerOpacity = direction === 'used-campus' ? 0.86 : 0.58;
    shapes.push(
      circle((23 + shift) % 128, 42, 1.7, '#F2EED8', flowerOpacity),
      circle((86 + shift) % 128, 101, 1.5, '#E8C84A', flowerOpacity),
      circle((108 + shift) % 128, 58, 1.6, '#C08BD6', flowerOpacity),
    );
  }

  return tileShell(shapes.join(''));
}

function instance(id: string): TileInstance {
  const found = [...DEFAULT_FLOORS, ...DEFAULT_GROUND].find(
    (candidate) => candidate.id === id,
  );
  if (!found) throw new Error(`Missing surface instance ${id}`);
  return found;
}

function placedCharacter(
  renderer: PropCalibrationRenderer,
  castIndex: number,
  x: number,
  y: number,
  cell: number,
  facing: 'south' | 'north' | 'east' | 'west' = 'south',
): string {
  const size = cell * 1.55 * CHARACTER_VISUAL_SCALE;
  return placedSvg(
    renderer.character(DEFAULT_CAST[castIndex], facing),
    x - size / 2,
    y - size * 0.86,
    size,
  );
}

function placedProp(
  renderer: PropCalibrationRenderer,
  id: string,
  x: number,
  y: number,
  cell: number,
): string {
  const size = cell * 2;
  return placedSvg(
    renderer.prop('current', id),
    x - size / 2,
    y - size * 0.78,
    size,
  );
}

function roomContext(
  renderer: PropCalibrationRenderer,
  direction: FloorGrassDirectionId,
  x: number,
  y: number,
  cell: number,
): string {
  const floor = proposalFloorSource(instance('floor-utility-vinyl'), direction);
  const columns = 8;
  const rows = 5;
  const parts = [
    repeatSvg(floor, x, y, columns, rows, cell),
    renderer.wallTile(6, x, y, cell),
  ];
  for (let column = 1; column < columns - 1; column += 1) {
    parts.push(renderer.wallTile(10, x + column * cell, y, cell));
  }
  parts.push(renderer.wallTile(12, x + (columns - 1) * cell, y, cell));
  for (let row = 1; row < rows; row += 1) {
    parts.push(
      renderer.wallTile(5, x, y + row * cell, cell),
      renderer.wallTile(5, x + (columns - 1) * cell, y + row * cell, cell, true),
    );
  }
  parts.push(
    placedProp(renderer, 'desk', x + 2.2 * cell, y + 2.3 * cell, cell),
    placedProp(renderer, 'office-chair', x + 3.2 * cell, y + 3.45 * cell, cell),
    placedProp(renderer, 'filing-cabinet', x + 5.7 * cell, y + 2.0 * cell, cell),
    placedCharacter(renderer, 0, x + 3.9 * cell, y + 4.15 * cell, cell, 'south'),
    placedCharacter(renderer, 1, x + 6.2 * cell, y + 3.9 * cell, cell, 'west'),
  );
  return parts.join('');
}

function grassContext(
  renderer: PropCalibrationRenderer,
  direction: FloorGrassDirectionId,
  x: number,
  y: number,
  cell: number,
): string {
  const grass = proposalGrassSource(instance('ground-grass'), direction);
  const parts = [
    repeatSvg(grass, x, y, 7, 5, cell),
    placedProp(renderer, 'tree-canopy', x + 5.7 * cell, y + 3.8 * cell, cell),
    placedProp(renderer, 'park-bench', x + 3.25 * cell, y + 3.7 * cell, cell),
    placedCharacter(renderer, 2, x + 1.9 * cell, y + 3.9 * cell, cell, 'east'),
    placedCharacter(renderer, 3, x + 4.5 * cell, y + 4.15 * cell, cell, 'north'),
  ];
  return parts.join('');
}

function directionPanel(
  renderer: PropCalibrationRenderer,
  direction: Direction,
  x: number,
  y: number,
  width: number,
): string {
  const parts = [
    panel(x, y, width, 1210, direction.panelFill),
    text(x + 18, y + 30, direction.label.toUpperCase(), 16, 880, GREEN),
    text(x + 18, y + 52, direction.note, 9.5, 620, MUTED),
    text(
      x + width - 18,
      y + 30,
      direction.id,
      8.5,
      760,
      CORAL,
      'end',
    ),
    text(x + 18, y + 82, 'CLOSE MATERIAL READ · 128U SOURCE FRAME', 8.5, 790, BLUE),
  ];

  REPRESENTATIVE_FLOOR_IDS.slice(0, 3).forEach((id, index) => {
    const target = instance(id);
    const source = proposalFloorSource(target, direction.id);
    const tileX = x + 18 + index * 155;
    parts.push(
      placedSvg(source, tileX, y + 96, 105),
      text(tileX + 52.5, y + 216, templateLabel(target), 7.5, 650, INK, 'middle'),
    );
  });
  FLOOR_GRASS_GROUND_IDS.forEach((id, index) => {
    const target = instance(id);
    const source = proposalGrassSource(target, direction.id);
    const tileX = x + width - 18 - 105 - (2 - index) * 118;
    parts.push(
      placedSvg(source, tileX, y + 96, 105),
      text(tileX + 52.5, y + 216, target.name, 7.5, 650, INK, 'middle'),
    );
  });

  parts.push(
    text(x + 18, y + 250, 'NORMAL GAMEPLAY CONTEXT · 50 PX / CELL', 8.5, 790, BLUE),
    roomContext(renderer, direction.id, x + 18, y + 266, NORMAL_CELL),
    grassContext(renderer, direction.id, x + width - 18 - 7 * NORMAL_CELL, y + 266, NORMAL_CELL),
    text(x + 18, y + 536, 'OFFICE FLOOR · accepted wall, props, and ×0.65 characters', 7.5, 660, MUTED),
    text(
      x + width - 18,
      y + 536,
      'GRASS GROUND · bench/tree/employee occlusion',
      7.5,
      660,
      MUTED,
      'end',
    ),
    text(x + 18, y + 574, 'FAR GAMEPLAY + SEAM STRESS · 26 PX / CELL', 8.5, 790, BLUE),
  );

  const farFloor = proposalFloorSource(
    instance('floor-polished-concrete'),
    direction.id,
  );
  const farGrass = proposalGrassSource(instance('ground-grass'), direction.id);
  parts.push(
    repeatSvg(farFloor, x + 18, y + 590, 12, 4, FAR_CELL),
    repeatSvg(farGrass, x + width - 18 - 12 * FAR_CELL, y + 590, 12, 4, FAR_CELL),
    text(x + 18, y + 710, '12×4 floor repeat', 7.5, 650, MUTED),
    text(x + width - 18, y + 710, '12×4 grass repeat', 7.5, 650, MUTED, 'end'),
    line(`M ${x + 18} ${y + 736} H ${x + width - 18}`, RULE, 1),
    text(x + 18, y + 768, 'Floor rule', 9.5, 820, BLUE),
    text(x + 18, y + 790, direction.floorRule, 8.8, 610, INK),
    text(x + 18, y + 830, 'Grass rule', 9.5, 820, BLUE),
    text(x + 18, y + 852, direction.grassRule, 8.8, 610, INK),
    text(x + 18, y + 902, 'HELD IN THIS DIRECTION PROOF', 8.5, 820, CORAL),
    text(x + 18, y + 928, 'one-cell 128u tile · flat projection · no outline', 8.3, 620, MUTED),
    text(x + 18, y + 950, 'existing instance palettes and parameter vocabulary', 8.3, 620, MUTED),
    text(x + 18, y + 972, 'floor/ground export separation · grass-fringe contract', 8.3, 620, MUTED),
    text(x + 18, y + 1018, 'REVIEW QUESTIONS', 8.5, 820, GREEN),
    text(x + 18, y + 1044, 'Does the material read before the pattern?', 8.5, 650, INK),
    text(x + 18, y + 1066, 'Does repetition disappear at normal and far zoom?', 8.5, 650, INK),
    text(x + 18, y + 1088, 'Does grass remain living ground rather than green carpet?', 8.5, 650, INK),
    text(
      x + 18,
      y + 1158,
      'proposal pixels only · no source asset or production mutation',
      8.2,
      690,
      CORAL,
    ),
  );
  return parts.join('');
}

function sheet(renderer: PropCalibrationRenderer): string {
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" ` +
      `viewBox="0 0 ${WIDTH} ${HEIGHT}">`,
    rect(0, 0, WIDTH, HEIGHT, PAGE),
    text(MARGIN, 42, 'QuotaCo floors + grass ground · SVG calibration', 24, 900, INK),
    text(
      MARGIN,
      68,
      'READ-ONLY INVENTORY + BOUNDED DIRECTION PROOF · CURRENT OUTPUT IS GENERATED IN CODE',
      10.5,
      760,
      CORAL,
    ),
    text(
      WIDTH - MARGIN,
      40,
      '12 interior floors · 3 grass instances · 0 standalone source SVGs',
      9.5,
      740,
      GREEN,
      'end',
    ),
    text(
      WIDTH - MARGIN,
      65,
      `${AUTHORING_CANVAS}u tiles · ${WALL_DATUM}u wall datum · characters ×${CHARACTER_VISUAL_SCALE} · schema ${CURRENT_SCHEMA_VERSION}`,
      8.5,
      620,
      MUTED,
      'end',
    ),
    panel(MARGIN, 88, WIDTH - MARGIN * 2, 618, PANEL_ALT),
    text(MARGIN + 16, 116, 'CURRENT SOURCE INVENTORY', 13, 840, GREEN),
    text(
      WIDTH - MARGIN - 16,
      116,
      'valid SVG output, but artist edits currently require TypeScript changes',
      8.5,
      680,
      CORAL,
      'end',
    ),
  ];

  const inventoryWidth = WIDTH - MARGIN * 2 - 24;
  const columnGap = 10;
  const cardWidth = (inventoryWidth - columnGap * 4) / 5;
  TARGETS.forEach((target, index) => {
    const column = index % 5;
    const row = Math.floor(index / 5);
    parts.push(
      inventoryCard(
        target,
        MARGIN + 12 + column * (cardWidth + columnGap),
        130 + row * 182,
        cardWidth,
      ),
    );
  });

  parts.push(
    text(MARGIN, 738, 'BOUNDED REDESIGN DIRECTIONS', 14, 860, GREEN),
    text(
      WIDTH - MARGIN,
      738,
      'close · normal · far · repeat seams · wall/prop/character context',
      9,
      690,
      MUTED,
      'end',
    ),
  );
  const directionY = 754;
  const directionWidth = (WIDTH - MARGIN * 2 - GAP * 2) / 3;
  DIRECTIONS.forEach((direction, index) => {
    parts.push(
      directionPanel(
        renderer,
        direction,
        MARGIN + index * (directionWidth + GAP),
        directionY,
        directionWidth,
      ),
    );
  });

  parts.push(
    panel(MARGIN, 1980, WIDTH - MARGIN * 2, 442, '#DAD4C6', 10),
    text(MARGIN + 18, 2015, 'Approval boundary', 17, 880, GREEN),
    text(
      MARGIN + 18,
      2044,
      'Choose none, one direction, or a bounded hybrid. Approval authorizes tighter surface design—not production source creation.',
      10.5,
      680,
      INK,
    ),
    text(MARGIN + 18, 2090, 'Targeted first slice', 10, 820, BLUE),
    text(
      MARGIN + 18,
      2115,
      '12 existing interior floor instances + 3 existing grass instances. Meadow, dirt, paved ground, pond water, and ground-detail props remain context only.',
      9.5,
      610,
      MUTED,
    ),
    text(MARGIN + 18, 2154, 'Held', 10, 820, BLUE),
    text(
      MARGIN + 18,
      2179,
      'template IDs · instance IDs · params · palettes · 128u frame · seamless wrapping · floor/ground export kinds · atlas cells · schema · Unity registration',
      9.5,
      610,
      MUTED,
    ),
    text(MARGIN + 18, 2218, 'Deferred dependency', 10, 820, BLUE),
    text(
      MARGIN + 18,
      2243,
      'The derived 47-frame grass-fringe remains code-owned until the base grass direction is accepted; it must inherit the eventual source palette and seam language.',
      9.5,
      610,
      MUTED,
    ),
    text(MARGIN + 18, 2282, 'Not performed', 10, 820, CORAL),
    text(
      MARGIN + 18,
      2307,
      'no standalone floor/ground SVG files · no template/default changes · no snapshot promotion · no exporter or contract change · no bundle export/import · no Unity change · no commit',
      9.5,
      660,
      MUTED,
    ),
    text(
      WIDTH - MARGIN - 18,
      2394,
      'STOP FOR VISUAL DIRECTION APPROVAL',
      10,
      820,
      CORAL,
      'end',
    ),
    '</svg>',
  );
  return parts.join('');
}

function metrics(): object {
  return {
    status: 'review-only-pre-source',
    currentOwnership: {
      implementation: 'src/tiles/templates.ts',
      compositor: 'composeFloorTile',
      artistEditableStandaloneSvgCount: 0,
      currentOutputFormat: 'generated-svg',
    },
    inventory: {
      floorTemplateCount: FLOOR_TEMPLATES.length,
      interiorFloorInstanceCount: DEFAULT_FLOORS.length,
      groundTemplateCount: GROUND_TEMPLATE_IDS.length,
      groundInstanceCount: DEFAULT_GROUND.length,
      targetInteriorFloorIds: FLOOR_GRASS_INTERIOR_IDS,
      targetGrassGroundIds: FLOOR_GRASS_GROUND_IDS,
      contextualGroundIds: DEFAULT_GROUND
        .map(({ id }) => id)
        .filter(
          (id) =>
            !FLOOR_GRASS_GROUND_IDS.includes(
              id as (typeof FLOOR_GRASS_GROUND_IDS)[number],
            ),
        ),
    },
    directions: DIRECTIONS.map(({ id, label, floorRule, grassRule }) => ({
      id,
      label,
      floorRule,
      grassRule,
    })),
    evaluationContexts: [
      'close-128u-material-read',
      'normal-50px-per-cell-room',
      'normal-50px-per-cell-grass-field',
      'far-26px-per-cell-repeat',
      'wall-prop-character-occlusion',
      'seamless-4x2-and-12x4-repeats',
    ],
    held: {
      authoringCanvas: AUTHORING_CANVAS,
      acceptedWallDatum: WALL_DATUM,
      characterVisualScale: CHARACTER_VISUAL_SCALE,
      floorGroundCharacterMultiplierApplied: false,
      templateIds: true,
      instanceIds: true,
      params: true,
      palettes: true,
      exportKindsAndCells: true,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      schemaMutation: false,
      exporterMutation: false,
      unityRegistrationMutation: false,
      productionSourceCreation: false,
      bundleExportImport: false,
      commitCreated: false,
    },
    deferred: {
      grassFringe: {
        currentOwnership: 'derived-code',
        autotileFrames: 47,
        reason: 'base grass direction must be accepted first',
      },
      nonTargetGroundFamilies: [
        'meadow',
        'dirt',
        'asphalt',
        'sidewalk',
        'gravel',
        'pond-water',
      ],
    },
  };
}

function notes(): string {
  return [
    '# QuotaCo floor and grass SVG calibration',
    '',
    'Status: **review-only; no production source creation**',
    '',
    'The current floor and ground art is SVG output generated from `src/tiles/templates.ts`. There are no standalone artist-editable floor or ground source files.',
    '',
    `- Interior floor instances in the first slice: ${DEFAULT_FLOORS.length}`,
    `- Grass ground instances in the first slice: ${FLOOR_GRASS_GROUND_IDS.length}`,
    `- FloorTemplate implementations in the shared registry: ${FLOOR_TEMPLATES.length}`,
    `- Standalone source SVGs: 0`,
    '',
    'The sheet compares Institutional Grid, Used Campus, and Maintained Hybrid at close, normal, and far gameplay reads. The derived 47-frame grass-fringe remains code-owned context until a base grass direction is accepted.',
    '',
    'No templates, defaults, snapshots, exporter behavior, schema, bundle, Unity registration, or production art changed.',
  ].join('\n');
}

export async function renderQuotaCoFloorGrassSvgCalibration(
  output = path.join('docs', 'previews'),
): Promise<{
  readonly svgPath: string;
  readonly pngPath: string;
  readonly metricsPath: string;
  readonly notesPath: string;
}> {
  const renderer = new PropCalibrationRenderer(new Map());
  const source = sheet(renderer);
  const png = new Resvg(source, {
    font: { loadSystemFonts: true },
  }).render().asPng();
  await mkdir(output, { recursive: true });
  const base = 'quota-co-floor-grass-svg-calibration-v1';
  const svgPath = path.join(output, `${base}.svg`);
  const pngPath = path.join(output, `${base}.png`);
  const metricsPath = path.join(output, `${base}-metrics.json`);
  const notesPath = path.join(output, `${base}.md`);
  await writeFile(svgPath, source, 'utf8');
  await writeFile(pngPath, png);
  await writeFile(metricsPath, `${JSON.stringify(metrics(), null, 2)}\n`, 'utf8');
  await writeFile(notesPath, `${notes()}\n`, 'utf8');
  return { svgPath, pngPath, metricsPath, notesPath };
}

function outputFrom(argv: readonly string[]): string {
  const index = argv.indexOf('--out');
  return index >= 0 && argv[index + 1]
    ? path.resolve(argv[index + 1])
    : path.resolve('docs', 'previews');
}

if (process.argv[1]?.endsWith('quotaCoFloorGrassSvgCalibrationPreview.ts')) {
  renderQuotaCoFloorGrassSvgCalibration(outputFrom(process.argv.slice(2)))
    .then(({ svgPath, pngPath, metricsPath, notesPath }) => {
      process.stdout.write(
        'Wrote QuotaCo floor/grass SVG calibration:\n' +
        `${svgPath}\n${pngPath}\n${metricsPath}\n${notesPath}\n`,
      );
    })
    .catch((error: unknown) => {
      process.stderr.write(
        `${error instanceof Error ? error.message : String(error)}\n`,
      );
      process.exitCode = 1;
    });
}
