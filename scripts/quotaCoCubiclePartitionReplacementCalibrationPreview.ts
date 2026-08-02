/**
 * Review-only replacement study for the promoted QuotaCo cubicle partitions.
 *
 * Nothing in this file participates in canonical source generation, template/default
 * registration, or export. It exists to make the support-ownership and vertical-run
 * decisions visible before the promoted SKU is replaced.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

import {
  farmFormPriorityOneAssetSvg,
} from './quotaCoDepartmentFarmFormPriorityOneCalibrationPreview';
import { DEPARTMENT_MACHINE_PALETTE } from './quotaCoDepartmentMachineFamilyCalibrationPreview';

const PAGE = '#E7E1D2';
const PANEL = '#F6F1E6';
const PANEL_ALT = '#ECE5D7';
const PANEL_COLD = '#E4ECE8';
const PANEL_WARN = '#F2E4DE';
const FLOOR = '#7B8890';
const FLOOR_LINE = '#D9D4C7';
const INK = '#292C2A';
const MUTED = '#626861';
const WHITE = '#F7F1DF';
const Q = {
  ...DEPARTMENT_MACHINE_PALETTE,
  primary: DEPARTMENT_MACHINE_PALETTE.cream,
  secondary: DEPARTMENT_MACHINE_PALETTE.green,
  accent: DEPARTMENT_MACHINE_PALETTE.teal,
  charcoal: '#292C2A',
  metal: '#6D7774',
  coral: '#B65F4D',
  white: WHITE,
};

export const PARTITION_REPLACEMENT_DIRECTIONS = [
  {
    id: 'b_upholstered_slab',
    label: 'B · Upholstered Slab',
    recommendation: 'recommended',
    read: 'broad acoustic furniture; soft molded shoulders; support hardware subordinate',
  },
  {
    id: 'c_molded_carrier',
    label: 'C · Molded Carrier',
    recommendation: 'alternate',
    read: 'stronger machine-family molding; slimmer acoustic band; more institutional',
  },
] as const;

export type PartitionReplacementDirection =
  (typeof PARTITION_REPLACEMENT_DIRECTIONS)[number]['id'];
export type PartitionReplacementFacing = 'horizontal' | 'vertical';
export type PartitionReplacementPiece = 'body' | 'terminal' | 'support' | 'corner';

export const PARTITION_REPLACEMENT_CONTRACT_QUESTIONS = [
  {
    id: 'connection-state-ownership',
    recommendation: 'Let body tiles own no internal supports; a terminal/corner/support state owns exactly one shared post at each graph vertex.',
  },
  {
    id: 'profile-width',
    recommendation: 'Allow a 44u outer profile so the acoustic mass survives at 40 px per cell.',
  },
  {
    id: 'vertical-presentation',
    recommendation: 'Author north/south bodies as continuous top-down slabs with feet painted first underneath; never add transverse separators per cell.',
  },
] as const;

function escapeText(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function text(
  x: number,
  y: number,
  value: string,
  size = 16,
  weight = 500,
  fill: string = INK,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return `<text x="${x}" y="${y}" font-family="Inter,Arial,sans-serif" font-size="${size}" ` +
    `font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${escapeText(value)}</text>`;
}

function wrappedText(
  x: number,
  y: number,
  value: string,
  max: number,
  size = 14,
  leading = 21,
  weight = 600,
  fill: string = INK,
): string {
  const lines: string[] = [];
  let current = '';
  for (const word of value.split(/\s+/)) {
    const next = current ? `${current} ${word}` : word;
    if (current && next.length > max) {
      lines.push(current);
      current = word;
    } else current = next;
  }
  if (current) lines.push(current);
  return lines.map((line, index) => text(x, y + index * leading, line, size, weight, fill)).join('');
}

function panel(x: number, y: number, width: number, height: number, fill = PANEL): string {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="12" fill="${fill}" ` +
    `stroke="#A39B8B" stroke-width="2"/>`;
}

function svgAsset(markup: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">${markup}</svg>`;
}

function svgPage(width: number, height: number, markup: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${PAGE}"/>${markup}</svg>`;
}

function placedSvg(source: string, x: number, y: number, size: number): string {
  return source
    .replace('<svg ', `<svg x="${x}" y="${y}" overflow="visible" `)
    .replace(/width="[^"]+" height="[^"]+"/, `width="${size}" height="${size}"`);
}

function acousticDots(
  x: number,
  y: number,
  columns: number,
  rows: number,
  dx: number,
  dy: number,
  prefix: string,
): string {
  return Array.from({ length: columns * rows }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    return `<circle id="${prefix}-${row}-${column}" cx="${x + column * dx}" cy="${y + row * dy}" ` +
      `r="1" fill="${Q.green}" opacity=".72"/>`;
  }).join('');
}

function upholsteredBody(facing: PartitionReplacementFacing): string {
  if (facing === 'horizontal') {
    return svgAsset(
      `<g id="b-upholstered-slab-horizontal-connection-free-body">` +
      `<path id="broad-furniture-shadow" d="M 32 72 H 96 V 109 H 32 Z" fill="${Q.charcoal}"/>` +
      `<path id="soft-molded-cream-shoulders" d="M 32 69 H 96 V 104 H 32 Z" fill="${Q.primary}"/>` +
      `<path id="dominant-upholstered-acoustic-field" d="M 32 75 H 96 V 100 H 32 Z" fill="${Q.accent}"/>` +
      acousticDots(35, 82, 10, 2, 6, 8, 'b-acoustic-perforation') +
      `<path id="continuous-top-piping" d="M 32 73 H 96" stroke="${Q.white}" stroke-width="2" opacity=".25"/>` +
      `<path id="recessed-green-floor-rail" d="M 32 102 H 96 V 108 H 32 Z" fill="${Q.secondary}"/>` +
      `</g>`,
    );
  }
  return svgAsset(
    `<g id="b-upholstered-slab-vertical-connection-free-body">` +
    `<path id="vertical-floor-shadow-under-slab" d="M 48 32 H 81 V 96 H 48 Z" fill="${Q.charcoal}"/>` +
    `<path id="continuous-topdown-cream-shoulders" d="M 51 32 H 78 V 96 H 51 Z" fill="${Q.primary}"/>` +
    `<path id="continuous-topdown-upholstered-field" d="M 56 32 H 71 V 96 H 56 Z" fill="${Q.accent}"/>` +
    `<path id="continuous-topdown-green-floor-rail" d="M 71 32 H 78 V 96 H 71 Z" fill="${Q.secondary}"/>` +
    `<path id="longitudinal-piping" d="M 53 32 V 96" stroke="${Q.white}" stroke-width="1.5" opacity=".25"/>` +
    acousticDots(59, 39, 2, 6, 7, 10, 'b-longitudinal-perforation') +
    `</g>`,
  );
}

function moldedCarrierBody(facing: PartitionReplacementFacing): string {
  if (facing === 'horizontal') {
    return svgAsset(
      `<g id="c-molded-carrier-horizontal-connection-free-body">` +
      `<path id="molded-shell-shadow" d="M 32 75 H 96 V 108 H 32 Z" fill="${Q.charcoal}"/>` +
      `<path id="deep-cream-product-shell" d="M 32 73 H 96 V 103 H 32 Z" fill="${Q.primary}"/>` +
      `<path id="inset-acoustic-cartridge" d="M 32 79 H 96 V 96 H 32 Z" fill="${Q.accent}"/>` +
      acousticDots(35, 84, 10, 2, 6, 7, 'c-acoustic-perforation') +
      `<path id="continuous-green-carrier" d="M 32 99 H 96 V 108 H 32 Z" fill="${Q.secondary}"/>` +
      `<path id="cream-crown-light" d="M 36 76 H 92" stroke="${Q.white}" stroke-width="2" opacity=".22"/>` +
      `</g>`,
    );
  }
  return svgAsset(
    `<g id="c-molded-carrier-vertical-connection-free-body">` +
    `<path id="vertical-molded-shell-shadow" d="M 49 32 H 80 V 96 H 49 Z" fill="${Q.charcoal}"/>` +
    `<path id="continuous-topdown-product-shell" d="M 52 32 H 77 V 96 H 52 Z" fill="${Q.primary}"/>` +
    `<path id="continuous-topdown-acoustic-cartridge" d="M 57 32 H 69 V 96 H 57 Z" fill="${Q.accent}"/>` +
    `<path id="continuous-green-carrier-side" d="M 69 32 H 77 V 96 H 69 Z" fill="${Q.secondary}"/>` +
    `<path id="vertical-crown-light" d="M 54 32 V 96" stroke="${Q.white}" stroke-width="1.5" opacity=".22"/>` +
    `</g>`,
  );
}

function supportSvg(direction: PartitionReplacementDirection, facing: PartitionReplacementFacing): string {
  const broad = direction === 'b_upholstered_slab';
  if (facing === 'horizontal') {
    return svgAsset(
      `<g id="${direction}-single-support-node-horizontal">` +
      `<path id="one-support-foot" d="M 50 109 H 78 V 118 H 50 Z" fill="${Q.metal}" stroke="${Q.charcoal}" stroke-width="2"/>` +
      `<rect id="one-shared-support-post" x="${broad ? 59 : 60}" y="66" width="${broad ? 10 : 8}" height="48" rx="3" fill="${Q.secondary}"/>` +
      `<path id="one-post-collar" d="M 56 68 H 72 V 78 H 56 Z" fill="${Q.primary}" stroke="${Q.charcoal}" stroke-width="2"/>` +
      `</g>`,
    );
  }
  return svgAsset(
    `<g id="${direction}-single-support-node-vertical-under-slab">` +
    `<path id="one-under-slab-foot" d="M 52 59 H 77 V 69 H 52 Z" fill="${Q.metal}" stroke="${Q.charcoal}" stroke-width="2"/>` +
    `<rect id="one-under-slab-support" x="54" y="60" width="21" height="8" rx="3" fill="${Q.secondary}"/>` +
    `</g>`,
  );
}

function terminalSvg(
  direction: PartitionReplacementDirection,
  facing: PartitionReplacementFacing,
): string {
  const body = direction === 'b_upholstered_slab' ? upholsteredBody(facing) : moldedCarrierBody(facing);
  const support = supportSvg(direction, facing);
  const cap = facing === 'horizontal'
    ? `<path id="rounded-terminal-cap" d="M 88 69 Q 101 70 101 80 V 101 Q 101 109 92 110 H 88 Z" ` +
      `fill="${Q.primary}" stroke="${Q.charcoal}" stroke-width="2"/>`
    : `<path id="rounded-terminal-cap" d="M 50 32 Q 64 21 79 32 V 46 H 50 Z" ` +
      `fill="${Q.primary}" stroke="${Q.charcoal}" stroke-width="2"/>`;
  return svgAsset(
    `<g id="${direction}-${facing}-terminal">${inner(support)}${inner(body)}${cap}</g>`,
  );
}

function cornerSvg(direction: PartitionReplacementDirection): string {
  const broad = direction === 'b_upholstered_slab';
  return svgAsset(
    `<g id="${direction}-single-owner-corner">` +
    `<path id="corner-foot-under-both-wings" d="M 45 108 H 82 V 119 H 45 Z" fill="${Q.metal}" stroke="${Q.charcoal}" stroke-width="2"/>` +
    `<path id="vertical-wing" d="M 50 32 H ${broad ? 80 : 78} V 82 H 50 Z" fill="${Q.primary}" stroke="${Q.charcoal}" stroke-width="3"/>` +
    `<path id="vertical-acoustic-field" d="M 56 32 H 70 V 79 H 56 Z" fill="${Q.accent}"/>` +
    `<path id="horizontal-wing" d="M 32 72 H 78 V 106 H 32 Z" fill="${Q.primary}" stroke="${Q.charcoal}" stroke-width="3"/>` +
    `<path id="horizontal-acoustic-field" d="M 36 78 H 72 V 99 H 36 Z" fill="${Q.accent}"/>` +
    `<path id="one-corner-support-post" d="M 67 66 Q 80 66 80 79 V 111 H 67 Z" fill="${Q.secondary}"/>` +
    `</g>`,
  );
}

function inner(svg: string): string {
  return svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

export function partitionReplacementAssetSvg(
  direction: PartitionReplacementDirection,
  piece: PartitionReplacementPiece,
  facing: PartitionReplacementFacing = 'horizontal',
): string {
  if (piece === 'support') return supportSvg(direction, facing);
  if (piece === 'terminal') return terminalSvg(direction, facing);
  if (piece === 'corner') return cornerSvg(direction);
  return direction === 'b_upholstered_slab' ? upholsteredBody(facing) : moldedCarrierBody(facing);
}

function run(
  direction: PartitionReplacementDirection,
  facing: PartitionReplacementFacing,
  x: number,
  y: number,
  cells: number,
  cell: number,
): string {
  const native = cell * 2;
  const parts: string[] = [];
  if (facing === 'horizontal') {
    for (let index = 0; index < cells; index += 1) {
      parts.push(placedSvg(partitionReplacementAssetSvg(direction, 'body', 'horizontal'), x - cell + index * cell, y, native));
    }
    for (let index = 0; index <= cells; index += 1) {
      parts.push(placedSvg(supportSvg(direction, 'horizontal'), x - native / 2 - cell / 2 + index * cell, y, native));
    }
  } else {
    for (let index = 0; index <= cells; index += 1) {
      parts.push(placedSvg(supportSvg(direction, 'vertical'), x, y - native / 2 - cell / 2 + index * cell, native));
    }
    for (let index = 0; index < cells; index += 1) {
      parts.push(placedSvg(partitionReplacementAssetSvg(direction, 'body', 'vertical'), x, y - cell + index * cell, native));
    }
  }
  return parts.join('');
}

function grid(x: number, y: number, columns: number, rows: number, cell: number): string {
  const parts = [`<rect x="${x}" y="${y}" width="${columns * cell}" height="${rows * cell}" fill="${FLOOR}"/>`];
  for (let column = 1; column < columns; column += 1) {
    parts.push(`<path d="M ${x + column * cell} ${y} V ${y + rows * cell}" stroke="${FLOOR_LINE}" opacity=".25"/>`);
  }
  for (let row = 1; row < rows; row += 1) {
    parts.push(`<path d="M ${x} ${y + row * cell} H ${x + columns * cell}" stroke="${FLOOR_LINE}" opacity=".25"/>`);
  }
  return parts.join('');
}

function directionPage(): string {
  const width = 2040;
  const height = 1260;
  const parts = [
    text(36, 48, 'CUBICLE PARTITION REPLACEMENT · DIRECTION STUDY', 26, 860),
    text(36, 78, 'Review only · current production remains stable · broader acoustic mass + connection-aware support ownership', 14, 650, MUTED),
    text(width - 36, 48, 'NOT PROMOTED', 12, 840, Q.coral, 'end'),
    panel(36, 108, 612, 1088, PANEL_WARN),
    text(58, 146, 'CURRENT CONTROL · REFINEMENT DEBT', 13, 840, Q.coral),
    placedSvg(farmFormPriorityOneAssetSvg('cubicle_partition_straight'), 82, 180, 300),
    placedSvg(farmFormPriorityOneAssetSvg('cubicle_partition_straight', 'vertical'), 338, 180, 300),
    text(232, 504, 'horizontal', 11, 720, MUTED, 'middle'),
    text(488, 504, 'vertical', 11, 720, MUTED, 'middle'),
    wrappedText(58, 554,
      'The horizontal is serviceable, but both orientations still treat each cell like a self-contained product. Repeated supports and transverse visual events keep the run from reading as one continuous furniture system.',
      62, 14, 22, 620, INK),
    text(58, 738, 'REPLACEMENT REQUIREMENTS', 11, 840, Q.coral),
    wrappedText(58, 776,
      '1. acoustic field dominates at far scale  2. internal body tiles are post-free  3. one graph vertex owns one support  4. vertical body is longitudinal, not stacked  5. corner and terminal hardware are unmistakable',
      62, 14, 22, 620, INK),
  ];
  PARTITION_REPLACEMENT_DIRECTIONS.forEach((direction, index) => {
    const x = 680 + index * 664;
    parts.push(
      panel(x, 108, 632, 1088, index === 0 ? PANEL_COLD : PANEL_ALT),
      text(x + 22, 146, direction.label.toUpperCase(), 13, 840, Q.secondary),
      text(x + 610, 146, direction.recommendation.toUpperCase(), 10, 840, index === 0 ? Q.secondary : MUTED, 'end'),
      placedSvg(partitionReplacementAssetSvg(direction.id, 'body', 'horizontal'), x + 44, 180, 300),
      placedSvg(partitionReplacementAssetSvg(direction.id, 'body', 'vertical'), x + 302, 180, 300),
      text(x + 194, 504, 'post-free body', 11, 720, MUTED, 'middle'),
      text(x + 452, 504, 'continuous vertical', 11, 720, MUTED, 'middle'),
      placedSvg(partitionReplacementAssetSvg(direction.id, 'terminal'), x + 38, 546, 190),
      placedSvg(partitionReplacementAssetSvg(direction.id, 'corner'), x + 220, 546, 190),
      placedSvg(partitionReplacementAssetSvg(direction.id, 'support'), x + 402, 546, 190),
      text(x + 133, 752, 'terminal', 10, 720, MUTED, 'middle'),
      text(x + 315, 752, 'corner', 10, 720, MUTED, 'middle'),
      text(x + 497, 752, 'one support', 10, 720, MUTED, 'middle'),
      placedSvg(partitionReplacementAssetSvg(direction.id, 'body'), x + 64, 792, 80),
      placedSvg(partitionReplacementAssetSvg(direction.id, 'body', 'vertical'), x + 154, 792, 80),
      text(x + 270, 840, '40 px / cell noun read', 11, 740, MUTED),
      wrappedText(x + 22, 914, direction.read, 59, 14, 22, 620, INK),
    );
  });
  return svgPage(width, height, parts.join(''));
}

function connectionPage(): string {
  const width = 2180;
  const height = 1420;
  const direction: PartitionReplacementDirection = 'b_upholstered_slab';
  const cell = 116;
  const parts = [
    text(36, 48, 'RECOMMENDED B · CONNECTION + VERTICAL CONSTRUCTION', 26, 860),
    text(36, 78, 'Supports are graph vertices, not duplicated decoration on every body tile.', 14, 650, MUTED),
    panel(36, 108, 1240, 610, PANEL),
    text(58, 144, 'HORIZONTAL · FIVE POST-FREE BODIES / SIX SINGLE-OWNER SUPPORTS', 12, 840, Q.secondary),
    grid(92, 186, 9, 4, cell),
    run(direction, 'horizontal', 208, 228, 5, cell),
    text(602, 666, 'The slab is visually continuous; supports occur once at actual graph vertices.', 13, 720, Q.white, 'middle'),
    panel(1304, 108, 840, 610, PANEL_ALT),
    text(1326, 144, 'ONE JOIN · PAINT ORDER', 12, 840, Q.secondary),
    placedSvg(upholsteredBody('horizontal'), 1372, 190, 360),
    placedSvg(upholsteredBody('horizontal'), 1552, 190, 360),
    placedSvg(supportSvg(direction, 'horizontal'), 1462, 190, 360),
    `<circle cx="1642" cy="510" r="52" fill="none" stroke="${Q.coral}" stroke-width="3"/>`,
    wrappedText(1326, 594,
      'Two post-free body tiles butt at the cell boundary. One connector paints a single shared beam over that join. There is no pair of endpoint posts to bunch together.',
      78, 14, 22, 620, INK),
    panel(36, 750, 1240, 610, PANEL_COLD),
    text(58, 786, 'VERTICAL · ONE LONGITUDINAL BAFFLE / NO TRANSVERSE SEPARATORS', 12, 840, Q.secondary),
    grid(92, 824, 8, 4, cell),
    run(direction, 'vertical', 436, 940, 4, cell),
    text(838, 1030, 'feet and supports paint first', 13, 740, MUTED),
    text(838, 1062, 'cream + teal slab paints over them', 13, 740, MUTED),
    text(838, 1094, 'only small footing wings remain visible', 13, 740, MUTED),
    text(838, 1126, 'perforations run longitudinally', 13, 740, MUTED),
    text(838, 1180, 'nothing crosses the baffle at cell boundaries', 13, 820, Q.secondary),
    panel(1304, 750, 840, 610, PANEL_WARN),
    text(1326, 786, 'PROPOSED EXPORT CONSEQUENCE', 12, 840, Q.coral),
    wrappedText(1326, 830,
      'The current body/end-cap/corner-only state set cannot express support ownership cleanly. A replacement should add source-owned body, terminal, support, and corner connection states for both authored facings. The sim still chooses graph state; it does not rotate or draw the product.',
      80, 14, 22, 620, INK),
    text(1326, 1024, 'UNCHANGED', 11, 840, Q.secondary),
    wrappedText(1326, 1060,
      '1×1 edge/corner furniture anchors · no hidden whole-cell collision · suggested footprint · elevation sort · Administrative Percussion palette · no product UI · amber and rose reserved',
      80, 14, 22, 620, INK),
  ];
  return svgPage(width, height, parts.join(''));
}

function farmPage(): string {
  const width = 2120;
  const height = 1300;
  const cell = 72;
  const parts = [
    text(36, 48, 'PARTITION REPLACEMENT · FARM-SCALE READ', 26, 860),
    text(36, 78, 'Same 40 px/cell far target, enlarged here for review · machines are the accepted production control.', 14, 650, MUTED),
  ];
  PARTITION_REPLACEMENT_DIRECTIONS.forEach((direction, directionIndex) => {
    const panelX = 36 + directionIndex * 1038;
    const roomX = panelX + 30;
    const roomY = 170;
    parts.push(
      panel(panelX, 108, 1008, 1120, directionIndex === 0 ? PANEL_COLD : PANEL_ALT),
      text(panelX + 22, 146, direction.label.toUpperCase(), 13, 840, Q.secondary),
      grid(roomX, roomY, 13, 10, cell),
    );
    const rows = [0, 1];
    for (const row of rows) {
      const y = roomY + 2.1 * cell + row * 3.5 * cell;
      parts.push(run(direction.id, 'horizontal', roomX + 2.2 * cell, y, 7, cell));
      for (let seat = 0; seat < 3; seat += 1) {
        parts.push(placedSvg(
          farmFormPriorityOneAssetSvg('keypunch_console'),
          roomX + (2.35 + seat * 2.15) * cell - cell,
          y + .15 * cell,
          cell * 2,
        ));
      }
    }
    parts.push(
      run(direction.id, 'vertical', roomX + 8.8 * cell - cell, roomY + 2.1 * cell, 5, cell),
      placedSvg(partitionReplacementAssetSvg(direction.id, 'corner'), roomX + 7.8 * cell, roomY + 1.1 * cell, cell * 2),
      text(panelX + 504, 952, directionIndex === 0
        ? 'broad teal furniture field survives the room read'
        : 'cream carrier dominates; acoustic read is more restrained', 13, 760, Q.white, 'middle'),
      placedSvg(partitionReplacementAssetSvg(direction.id, 'body'), panelX + 244, 1010, 80),
      placedSvg(partitionReplacementAssetSvg(direction.id, 'body', 'vertical'), panelX + 344, 1010, 80),
      text(panelX + 456, 1058, 'actual far sprites · 40 px / cell', 11, 740, MUTED),
      wrappedText(panelX + 22, 1120, direction.read, 90, 13, 20, 620, INK),
    );
  });
  return svgPage(width, height, parts.join(''));
}

export function renderPartitionReplacementDirectionsSvg(): string { return directionPage(); }
export function renderPartitionReplacementConnectionsSvg(): string { return connectionPage(); }
export function renderPartitionReplacementFarmSvg(): string { return farmPage(); }

export interface PartitionReplacementCalibrationResult {
  readonly output: string;
  readonly files: readonly string[];
  readonly metricsPath: string;
  readonly readmePath: string;
}

export async function renderPartitionReplacementCalibration(
  output: string,
): Promise<PartitionReplacementCalibrationResult> {
  await mkdir(output, { recursive: true });
  const pages = [
    ['01-replacement-directions', directionPage()],
    ['02-connection-and-vertical-runs', connectionPage()],
    ['03-farm-scale-read', farmPage()],
  ] as const;
  const files: string[] = [];
  for (const [stem, svg] of pages) {
    const svgPath = path.join(output, `${stem}.svg`);
    const pngPath = path.join(output, `${stem}.png`);
    await writeFile(svgPath, svg, 'utf8');
    await writeFile(pngPath, new Resvg(svg).render().asPng());
    files.push(svgPath, pngPath);
  }
  const metrics = {
    reviewStatus: 'awaiting-owner-partition-replacement-direction',
    scope: 'cubicle-partition-replacement-review-only',
    recommendedDirection: 'b_upholstered_slab',
    directions: PARTITION_REPLACEMENT_DIRECTIONS,
    contractQuestions: PARTITION_REPLACEMENT_CONTRACT_QUESTIONS,
    productionMutation: false,
    canonicalSvgAuthoring: false,
    templateRegistration: false,
    departmentManifestMutation: false,
    exportRun: false,
    parityClaim: false,
    currentProductionSkuStable: true,
    proposedOuterProfileUnits: 44,
    normalGameplayPixelsPerCell: 90,
    farGameplayPixelsPerCell: 40,
    bodyOwnsInternalSupport: false,
    oneGraphVertexOwnsOneSupport: true,
    verticalTransverseSeparators: false,
    unityImport: false,
  };
  const metricsPath = path.join(output, 'metrics.json');
  await writeFile(metricsPath, `${JSON.stringify(metrics, null, 2)}\n`, 'utf8');
  files.push(metricsPath);
  const readmePath = path.join(output, 'README.md');
  await writeFile(readmePath, [
    '# QuotaCo cubicle partition replacement calibration',
    '',
    'Status: **review only; current promoted partition sprites remain unchanged**',
    '',
    'This is a replacement-direction study, not another patch to the current SKU. It compares the',
    'current control with B Upholstered Slab and C Molded Carrier. B is recommended because its broad',
    'teal field reads most clearly as acoustic furniture at 40 pixels per cell.',
    '',
    'Both candidates separate the post-free body from terminal, corner, and support ownership. One',
    'graph vertex therefore creates one support. Vertical bodies are continuous top-down strips with',
    'supports and feet painted underneath; no transverse separator is allowed at a cell boundary.',
    '',
    'Approval would still precede canonical source, template/state, manifest, exporter, or parity work.',
    '',
  ].join('\n'), 'utf8');
  files.push(readmePath);
  return { output, files, metricsPath, readmePath };
}

function outputPath(argv: readonly string[]): string {
  const index = argv.indexOf('--out');
  return index >= 0 && argv[index + 1]
    ? path.resolve(argv[index + 1])
    : path.resolve('docs/previews/quota-co-cubicle-partition-replacement-calibration-v2');
}

const isMain = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;
if (isMain) {
  const result = await renderPartitionReplacementCalibration(outputPath(process.argv.slice(2)));
  process.stdout.write(`Wrote ${result.files.length} review-only partition files to ${result.output}\n`);
}
