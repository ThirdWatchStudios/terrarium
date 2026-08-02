/**
 * Review-only QuotaCo department-machine family calibration.
 *
 *   npx tsx scripts/quotaCoDepartmentMachineFamilyCalibrationPreview.ts
 *   npx tsx scripts/quotaCoDepartmentMachineFamilyCalibrationPreview.ts --out /tmp/department-machines
 *
 * This file owns temporary SVG studies only. It deliberately does not register
 * PropTemplates, add canonical SVG sources, change defaults, mutate the export
 * contract/schema, create a bundle, touch Unity, or claim parity. Production
 * promotion begins only after the owner accepts a direction and resolves the
 * grid/export questions printed on the proof.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

import {
  composeCharacter,
  composeWallTile,
} from '../src/core/compositor';
import {
  type CharacterRecipe,
  type Facing,
  type StyleSheet,
  type TileInstance,
} from '../src/core/types';
import {
  DEFAULT_CAST,
  DEFAULT_STYLE,
  defaultProject,
} from '../src/data/defaults';
import type { Pose } from '../src/parts/poses';
import { BLOB_CONFIGS } from '../src/tiles/blob';
import { PROP_NATIVE_FRAME_CELLS } from './quotaCoWorkstationFamilyCalibrationPreview';

const AUTHORING_CANVAS = 128;
const CHARACTER_VISUAL_SCALE = 0.65;
const CHARACTER_FRAME_CELLS = 1.55 * CHARACTER_VISUAL_SCALE;
const FAR_CELL = 40;

const PAGE = '#E7E1D2';
const PANEL = '#F6F1E6';
const PANEL_ALT = '#ECE5D7';
const PANEL_COLD = '#E4ECE8';
const PANEL_WARN = '#F2E4DE';
const INK = '#292C2A';
const MUTED = '#626861';
const RULE = '#A39B8B';
const FLOOR = '#7B8890';
const FLOOR_LINE = '#D9D4C7';
const OCCUPANCY = '#D7CFAF';

/** The owner-locked QuotaCo authored-art paints. */
export const DEPARTMENT_MACHINE_PALETTE = {
  charcoal: '#252A28',
  cream: '#D9D0B9',
  green: '#294B3C',
  teal: '#4E7D79',
  metal: '#979A91',
  glass: '#83A9A6',
  coral: '#B65F4D',
  white: '#FFFFFF',
  black: '#000000',
} as const;

const Q = DEPARTMENT_MACHINE_PALETTE;

export const PRIORITY_ONE_ASSET_IDS = [
  'loading_dock',
  'sorting_frame',
  'franking_machine',
  'keypunch_bank',
  'tabulating_machine',
  'intake_tray_small',
  'intake_tray_large',
  'dispatch_station',
  'pneumatic_dispatch_node',
  'tube_straight',
  'tube_corner',
  'tube_wallpass',
  'tube_riser',
  'canister_base',
  'delivery_uplink',
] as const;

export type PriorityOneAssetId = (typeof PRIORITY_ONE_ASSET_IDS)[number];

export const PRIORITY_ONE_WORK_TYPE_STAMPS = [
  'raw_records',
  'structured_data',
] as const;

export type PriorityOneWorkTypeStamp =
  (typeof PRIORITY_ONE_WORK_TYPE_STAMPS)[number];

export const PRIORITY_ONE_FILL_STATES = {
  loading_dock: ['empty', 'low', 'high'],
  intake_tray_small: ['empty', 'low', 'high', 'overflowing'],
  intake_tray_large: ['empty', 'low', 'high', 'overflowing'],
  dispatch_station: ['empty', 'low', 'high', 'overflowing'],
} as const;

export type FillState = 'empty' | 'low' | 'high' | 'overflowing';

export type DepartmentMachineDirectionId =
  | 'registry-shell'
  | 'percussion-line'
  | 'certified-gallery';

interface DepartmentMachineDirection {
  readonly id: DepartmentMachineDirectionId;
  readonly label: string;
  readonly thesis: string;
  readonly familyRule: string;
  readonly strength: string;
  readonly risk: string;
  readonly recommended: boolean;
}

export const DEPARTMENT_MACHINE_DIRECTIONS:
readonly DepartmentMachineDirection[] = [
  {
    id: 'registry-shell',
    label: 'A · REGISTRY SHELL',
    thesis: 'Cream catalog housings organize each noun around one obvious paper or canister path.',
    familyRule: 'Broad molded lid · green plinth · teal service band · shallow charcoal wells.',
    strength: 'Closest to the existing Workhorse office family and easiest to expand cleanly.',
    risk: 'The biggest machines can collapse into copier, credenza, or storage-cabinet reads.',
    recommended: false,
  },
  {
    id: 'percussion-line',
    label: 'B · ADMINISTRATIVE PERCUSSION',
    thesis: 'Period office machinery: enclosing cream shoulders around dark mechanical cores and loud feed paths.',
    familyRule: 'Asymmetric shell · deep mechanism bay · stepped base · one unmistakable input/output gesture.',
    strength: 'Best noun separation at far zoom; Keypunch and Tabulator read as a coordinated production line.',
    risk: 'Dark cores must stay mechanical and period-office, never become sci-fi screens or glowing reactors.',
    recommended: true,
  },
  {
    id: 'certified-gallery',
    label: 'C · CERTIFIED GALLERY',
    thesis: 'Tall repeated bays make each machine feel inspected, serviceable, and issued from one procurement wall.',
    familyRule: 'Vertical registers · repeated access doors · cream caps · green structural uprights.',
    strength: 'Strong catalog provenance and a clean bridge to Sorting Frame and Delivery Uplink.',
    risk: 'Rows can read as lockers, server racks, or generic storage instead of working machinery.',
    recommended: false,
  },
] as const;

export interface PriorityOneScaleSuggestion {
  readonly id: PriorityOneAssetId;
  readonly label: string;
  readonly projection: 'plan' | 'elevation' | 'overlay';
  readonly gridFootprint: { readonly w: number; readonly h: number } | null;
  readonly status: 'suggested' | 'open-contract';
  readonly note: string;
}

/**
 * Review values only. They are intentionally not PropTemplates and do not lock
 * facility occupancy. Open-contract rows are the decisions surfaced on page 2.
 */
export const PRIORITY_ONE_SCALE_SUGGESTIONS:
readonly PriorityOneScaleSuggestion[] = [
  {
    id: 'loading_dock', label: 'Loading dock', projection: 'elevation',
    gridFootprint: { w: 3, h: 2 }, status: 'open-contract',
    note: 'apron wants walkable cells while pallet cells block',
  },
  {
    id: 'sorting_frame', label: 'Sorting Frame', projection: 'elevation',
    gridFootprint: { w: 2, h: 2 }, status: 'suggested',
    note: 'pigeonhole wall + clerk approach',
  },
  {
    id: 'franking_machine', label: 'Franking Machine', projection: 'elevation',
    gridFootprint: { w: 1, h: 1 }, status: 'open-contract',
    note: 'standalone exception unless tabletop attachment exists',
  },
  {
    id: 'keypunch_bank', label: 'Keypunch Bank', projection: 'elevation',
    gridFootprint: { w: 2, h: 2 }, status: 'suggested',
    note: 'three consoles compressed into one loud bank',
  },
  {
    id: 'tabulating_machine', label: 'Tabulating Machine', projection: 'elevation',
    gridFootprint: { w: 3, h: 2 }, status: 'open-contract',
    note: 'three-cell row may need wider or multi-frame art',
  },
  {
    id: 'intake_tray_small', label: 'Intake tray — small', projection: 'elevation',
    gridFootprint: { w: 1, h: 1 }, status: 'suggested',
    note: 'four explicit fill sprites',
  },
  {
    id: 'intake_tray_large', label: 'Intake tray — large', projection: 'elevation',
    gridFootprint: { w: 1, h: 1 }, status: 'suggested',
    note: 'same footprint, taller capacity read',
  },
  {
    id: 'dispatch_station', label: 'Dispatch station', projection: 'elevation',
    gridFootprint: { w: 1, h: 1 }, status: 'open-contract',
    note: 'queue furniture paired with powered node?',
  },
  {
    id: 'pneumatic_dispatch_node', label: 'Pneumatic dispatch node', projection: 'elevation',
    gridFootprint: { w: 1, h: 1 }, status: 'open-contract',
    note: 'separate powered feeder in this proof',
  },
  {
    id: 'tube_straight', label: 'Tube — straight', projection: 'plan',
    gridFootprint: { w: 1, h: 1 }, status: 'suggested',
    note: 'floor-run cell blocks walking',
  },
  {
    id: 'tube_corner', label: 'Tube — corner', projection: 'plan',
    gridFootprint: { w: 1, h: 1 }, status: 'suggested',
    note: 'mechanical quarter-turn rotation only',
  },
  {
    id: 'tube_wallpass', label: 'Tube — wall pass', projection: 'elevation',
    gridFootprint: { w: 1, h: 1 }, status: 'open-contract',
    note: 'wall-slot recommended; route still occupies wall cell',
  },
  {
    id: 'tube_riser', label: 'Tube — station riser', projection: 'elevation',
    gridFootprint: { w: 1, h: 1 }, status: 'suggested',
    note: 'route-to-station vertical handoff',
  },
  {
    id: 'canister_base', label: 'Work canister — base', projection: 'overlay',
    gridFootprint: null, status: 'open-contract',
    note: 'item + independent work-type stamp overlay',
  },
  {
    id: 'delivery_uplink', label: 'Delivery uplink', projection: 'elevation',
    gridFootprint: { w: 2, h: 2 }, status: 'suggested',
    note: 'IRIS sibling mass; mechanical outbound hatch, no screen',
  },
] as const;

export const PRIORITY_ONE_OPEN_QUESTIONS = [
  {
    id: 'state-identity',
    label: 'STATE EXPORT IDENTITY',
    recommendation: 'One stable facility id plus explicit named baked variant entries in a small state manifest.',
    reason: 'The current bundle exports independent PropInstances but has no general state-family discovery contract.',
  },
  {
    id: 'dock-occupancy',
    label: 'LOADING-DOCK OCCUPANCY',
    recommendation: 'Keep one loading_dock visual family, but let the sim declare a mixed walkable apron / blocking pallet mask.',
    reason: 'The current facility catalog has one blocksWalk boolean for the whole rectangular footprint.',
  },
  {
    id: 'franking-form',
    label: 'FRANKING FORM',
    recommendation: 'Use a dedicated 1×1 certified stand as the bounded exception.',
    reason: 'Terrarium has no prop-on-prop attachment contract for a tabletop-only stamper.',
  },
  {
    id: 'three-cell-art',
    label: 'THREE-CELL ROW ART',
    recommendation: 'Confirm whether 3×2 is only clearance; otherwise add a deliberate wide/multi-frame prop path.',
    reason: 'A native 128u prop frame spans two post-rescale cells, so three-cell art cannot be silently inferred.',
  },
  {
    id: 'station-node-split',
    label: 'STATION / NODE SPLIT',
    recommendation: 'Keep dispatch_station as the visible queue and pneumatic_dispatch_node as the powered feeder.',
    reason: 'Both requested ids then have distinct nouns and the riser has one unambiguous attachment target.',
  },
  {
    id: 'wallpass',
    label: 'WALL-PASS SEMANTICS',
    recommendation: 'Author tube_wallpass as a wall-slot visual; the tube route owns continuity through the wall cell.',
    reason: 'Treating it as another floor blocker would double-charge the already non-walkable full-cell wall.',
  },
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
  weight = 500,
  fill = INK,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return `<text x="${x}" y="${y}" font-family="Inter, Arial, sans-serif" ` +
    `font-size="${size}" font-weight="${weight}" fill="${fill}" ` +
    `text-anchor="${anchor}">${escapeText(value)}</text>`;
}

function multilineText(
  x: number,
  y: number,
  lines: readonly string[],
  size = 15,
  lineHeight = 22,
  weight = 500,
  fill = INK,
): string {
  return lines.map((line, index) =>
    text(x, y + index * lineHeight, line, size, weight, fill)).join('');
}

function wrap(value: string, max = 62): string[] {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundedRect(
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 12,
  fill = PANEL,
  stroke = RULE,
): string {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" ` +
    `rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
}

function line(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stroke: string = Q.charcoal,
  width = 2,
  opacity = 1,
): string {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ` +
    `stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" ` +
    `opacity="${opacity}"/>`;
}

function assetSvg(markup: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ` +
    `viewBox="0 0 128 128">${markup}</svg>`;
}

function stripSvgShell(source: string): string {
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
  return source
    .replace('<svg ', `<svg x="${x}" y="${y}" overflow="visible" `)
    .replace(/width="[^"]+" height="[^"]+"/, `width="${width}" height="${height}"`);
}

function directionFields(direction: DepartmentMachineDirectionId): {
  shell: string;
  structure: string;
  service: string;
  recess: string;
  shellRatio: number;
} {
  if (direction === 'registry-shell') {
    return {
      shell: Q.cream,
      structure: Q.green,
      service: Q.teal,
      recess: Q.charcoal,
      shellRatio: 0.72,
    };
  }
  if (direction === 'certified-gallery') {
    return {
      shell: Q.cream,
      structure: Q.green,
      service: Q.metal,
      recess: Q.teal,
      shellRatio: 0.54,
    };
  }
  return {
    shell: Q.cream,
    structure: Q.charcoal,
    service: Q.teal,
    recess: Q.green,
    shellRatio: 0.58,
  };
}

function machineBase(
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 9,
): string {
  return `<rect x="${x - 2}" y="${y - 2}" width="${width + 4}" ` +
    `height="${height + 4}" rx="${radius + 2}" fill="${Q.charcoal}"/>` +
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" ` +
    `rx="${radius}" fill="${Q.cream}"/>` +
    `<path d="M ${x + radius} ${y + 1} H ${x + width - radius} ` +
    `Q ${x + width - 2} ${y + 1} ${x + width - 1} ${y + radius}" ` +
    `fill="none" stroke="${Q.white}" stroke-width="2" opacity=".18"/>`;
}

function serviceSeam(x1: number, y1: number, x2: number, y2: number): string {
  return line(x1, y1, x2, y2, Q.charcoal, 1.5);
}

function physicalKeyGrid(x: number, y: number, columns: number, rows: number): string {
  const cells: string[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      cells.push(
        `<rect x="${x + column * 4}" y="${y + row * 3.5}" width="2.5" ` +
        `height="2" rx=".7" fill="${Q.metal}"/>`,
      );
    }
  }
  return cells.join('');
}

function sortingFrameSvg(direction: DepartmentMachineDirectionId): string {
  const f = directionFields(direction);
  const cells: string[] = [];
  const x = direction === 'certified-gallery' ? 20 : 16;
  const width = direction === 'certified-gallery' ? 88 : 96;
  cells.push(
    machineBase(x, 20, width, 98, 8),
    `<rect x="${x + 4}" y="28" width="${width - 8}" height="78" rx="5" fill="${f.recess}"/>`,
  );
  const columns = direction === 'certified-gallery' ? 4 : 5;
  const rows = 5;
  const gap = 3;
  const innerWidth = width - 16;
  const cellWidth = (innerWidth - gap * (columns - 1)) / columns;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const px = x + 8 + column * (cellWidth + gap);
      const py = 34 + row * 13.5;
      cells.push(
        `<rect x="${px}" y="${py}" width="${cellWidth}" height="10" rx="2.5" ` +
        `fill="${row === 4 ? f.service : Q.cream}" stroke="${Q.charcoal}" stroke-width="1.5"/>`,
        `<rect x="${px + 3}" y="${py + 3}" width="${Math.max(3, cellWidth - 6)}" height="2" ` +
        `rx="1" fill="${Q.teal}"/>`,
      );
    }
  }
  cells.push(
    `<rect x="${x - 3}" y="106" width="${width + 6}" height="12" rx="4" fill="${f.structure}"/>`,
    `<rect x="${x + 6}" y="109" width="${width - 12}" height="3" rx="1.5" fill="${f.service}"/>`,
  );
  if (direction === 'percussion-line') {
    cells.push(
      `<rect x="${x + width - 21}" y="24" width="15" height="78" rx="4" fill="${Q.charcoal}"/>`,
      `<rect x="${x + width - 17}" y="31" width="7" height="47" rx="2" fill="${Q.green}"/>`,
      `<circle cx="${x + width - 13.5}" cy="91" r="3" fill="${Q.coral}"/>`,
    );
  }
  return assetSvg(cells.join(''));
}

function frankingMachineSvg(direction: DepartmentMachineDirectionId): string {
  const f = directionFields(direction);
  const cells: string[] = [];
  cells.push(
    machineBase(36, 66, 58, 48, 8),
    `<rect x="42" y="75" width="36" height="23" rx="5" fill="${f.recess}"/>`,
    `<path d="M 46 86 H 73 L 80 91 H 46 Z" fill="${Q.cream}" stroke="${Q.charcoal}" stroke-width="2"/>`,
    `<rect x="52" y="58" width="28" height="12" rx="5" fill="${f.structure}" stroke="${Q.charcoal}" stroke-width="2"/>`,
    `<path d="M 66 58 V 45 H 81" fill="none" stroke="${Q.charcoal}" stroke-width="6" stroke-linecap="round"/>`,
    `<path d="M 66 58 V 45 H 81" fill="none" stroke="${f.service}" stroke-width="2.5" stroke-linecap="round"/>`,
    `<rect x="42" y="104" width="46" height="7" rx="3" fill="${Q.green}"/>`,
    `<circle cx="84" cy="79" r="3" fill="${Q.coral}"/>`,
  );
  return assetSvg(cells.join(''));
}

function keypunchBankSvg(direction: DepartmentMachineDirectionId): string {
  const f = directionFields(direction);
  const cells: string[] = [];
  cells.push(
    `<path d="M 7 44 Q 7 34 17 34 H 111 Q 121 34 121 44 V 111 Q 121 118 114 118 H 14 Q 7 118 7 111 Z" ` +
    `fill="${Q.charcoal}"/>`,
    `<rect x="10" y="37" width="108" height="77" rx="8" fill="${f.shell}"/>`,
  );
  const bayWidths = direction === 'certified-gallery' ? [26, 26, 26] : [29, 29, 29];
  const startX = direction === 'certified-gallery' ? 19 : 14;
  bayWidths.forEach((bayWidth, index) => {
    const x = startX + index * (bayWidth + 7);
    const asymmetric = direction === 'percussion-line' && index === 0;
    cells.push(
      `<rect x="${x}" y="45" width="${bayWidth}" height="60" rx="5" fill="${asymmetric ? Q.charcoal : f.structure}"/>`,
      `<rect x="${x + 4}" y="49" width="${bayWidth - 8}" height="18" rx="3" fill="${f.recess}"/>`,
      `<path d="M ${x + 2} 72 H ${x + bayWidth - 2} L ${x + bayWidth + 2} 88 H ${x - 2} Z" ` +
      `fill="${Q.cream}" stroke="${Q.charcoal}" stroke-width="1.5"/>`,
      physicalKeyGrid(x + 5, 76, 4, 3),
      `<rect x="${x + 6}" y="96" width="${bayWidth - 12}" height="6" rx="2" fill="${f.service}"/>`,
    );
  });
  cells.push(
    `<rect x="7" y="108" width="114" height="10" rx="4" fill="${Q.green}"/>`,
    `<rect x="14" y="110" width="100" height="2.5" rx="1" fill="${Q.teal}"/>`,
  );
  if (direction === 'percussion-line') {
    cells.push(
      `<path d="M 12 42 H 42 V 106 H 12 Z" fill="${Q.black}" opacity=".10"/>`,
      `<rect x="108" y="43" width="6" height="56" rx="2" fill="${Q.teal}"/>`,
    );
  }
  return assetSvg(cells.join(''));
}

function tabulatingMachineSvg(direction: DepartmentMachineDirectionId): string {
  const f = directionFields(direction);
  const cells: string[] = [];
  const left = direction === 'percussion-line' ? 8 : 12;
  const right = direction === 'percussion-line' ? 120 : 116;
  cells.push(
    machineBase(left, 17, right - left, 101, 9),
    `<rect x="${left + 5}" y="25" width="${right - left - 10}" height="75" rx="6" fill="${f.structure}"/>`,
  );
  if (direction === 'registry-shell') {
    cells.push(
      `<rect x="20" y="31" width="30" height="60" rx="5" fill="${f.recess}"/>`,
      `<rect x="55" y="31" width="53" height="34" rx="5" fill="${Q.cream}"/>`,
      `<rect x="55" y="70" width="53" height="21" rx="4" fill="${f.recess}"/>`,
    );
  } else if (direction === 'certified-gallery') {
    for (let index = 0; index < 4; index += 1) {
      cells.push(
        `<rect x="${19 + index * 23}" y="29" width="18" height="62" rx="4" fill="${index % 2 ? Q.cream : f.recess}"/>`,
        serviceSeam(28 + index * 23, 34, 28 + index * 23, 84),
      );
    }
  } else {
    cells.push(
      `<rect x="14" y="25" width="35" height="72" rx="5" fill="${Q.charcoal}"/>`,
      `<rect x="53" y="25" width="59" height="43" rx="5" fill="${Q.green}"/>`,
      `<rect x="53" y="72" width="59" height="25" rx="4" fill="${Q.charcoal}"/>`,
    );
  }
  cells.push(
    `<circle cx="32" cy="57" r="14" fill="${Q.metal}" stroke="${Q.charcoal}" stroke-width="2"/>`,
    `<circle cx="32" cy="57" r="6" fill="${Q.teal}"/>`,
    `<path d="M 52 37 H 101 V 47 H 74 V 55 H 107" fill="none" stroke="${Q.cream}" stroke-width="7" stroke-linejoin="round"/>`,
    `<path d="M 52 37 H 101 V 47 H 74 V 55 H 107" fill="none" stroke="${Q.teal}" stroke-width="2" stroke-linejoin="round"/>`,
    `<rect x="58" y="78" width="42" height="10" rx="3" fill="${Q.cream}"/>`,
    `<path d="M 63 81 H 95 M 63 85 H 92" stroke="${Q.charcoal}" stroke-width="1.5"/>`,
    `<rect x="${left - 3}" y="102" width="${right - left + 6}" height="16" rx="5" fill="${Q.green}"/>`,
    `<rect x="${left + 6}" y="106" width="${right - left - 12}" height="3" rx="1.5" fill="${Q.teal}"/>`,
  );
  return assetSvg(cells.join(''));
}

function canisterMarkup(
  x: number,
  y: number,
  scale = 1,
  stamp?: PriorityOneWorkTypeStamp,
): string {
  const width = 28 * scale;
  const height = 15 * scale;
  const parts = [
    `<g>`,
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${height / 2}" fill="${Q.charcoal}"/>`,
    `<rect x="${x + 2 * scale}" y="${y + 2 * scale}" width="${width - 4 * scale}" height="${height - 4 * scale}" ` +
    `rx="${(height - 4 * scale) / 2}" fill="${Q.cream}"/>`,
    `<rect x="${x + 7 * scale}" y="${y + 1.5 * scale}" width="${12 * scale}" height="${height - 3 * scale}" ` +
    `rx="${2 * scale}" fill="${Q.teal}"/>`,
    `<rect x="${x + 2 * scale}" y="${y + 5.5 * scale}" width="${3 * scale}" height="${4 * scale}" rx="${1 * scale}" fill="${Q.metal}"/>`,
    `<rect x="${x + width - 5 * scale}" y="${y + 5.5 * scale}" width="${3 * scale}" height="${4 * scale}" rx="${1 * scale}" fill="${Q.metal}"/>`,
  ];
  if (stamp === 'raw_records') {
    parts.push(
      `<path d="M ${x + 9 * scale} ${y + 5 * scale} H ${x + 17 * scale} ` +
      `M ${x + 9 * scale} ${y + 8 * scale} H ${x + 15 * scale} ` +
      `M ${x + 9 * scale} ${y + 11 * scale} H ${x + 17 * scale}" ` +
      `stroke="${Q.white}" stroke-width="${1.4 * scale}" stroke-linecap="round"/>`,
    );
  } else if (stamp === 'structured_data') {
    for (let row = 0; row < 2; row += 1) {
      for (let column = 0; column < 3; column += 1) {
        parts.push(
          `<circle cx="${x + (10 + column * 3.5) * scale}" ` +
          `cy="${y + (6 + row * 4) * scale}" r="${.9 * scale}" fill="${Q.white}"/>`,
        );
      }
    }
  }
  parts.push('</g>');
  return parts.join('');
}

function traySvg(
  large: boolean,
  state: FillState,
  direction: DepartmentMachineDirectionId,
): string {
  const f = directionFields(direction);
  const x = large ? 34 : 38;
  const width = large ? 60 : 52;
  const top = large ? 55 : 67;
  const bottom = 116;
  const parts: string[] = [
    `<path d="M ${x} ${top + 13} Q ${x} ${top + 5} ${x + 8} ${top + 5} ` +
    `H ${x + width - 8} Q ${x + width} ${top + 5} ${x + width} ${top + 13} ` +
    `V ${bottom - 7} Q ${x + width} ${bottom} ${x + width - 7} ${bottom} ` +
    `H ${x + 7} Q ${x} ${bottom} ${x} ${bottom - 7} Z" fill="${Q.charcoal}"/>`,
    `<path d="M ${x + 3} ${top + 15} Q ${x + 3} ${top + 9} ${x + 9} ${top + 9} ` +
    `H ${x + width - 9} Q ${x + width - 3} ${top + 9} ${x + width - 3} ${top + 15} ` +
    `V ${bottom - 9} H ${x + 3} Z" fill="${f.shell}"/>`,
    `<rect x="${x + 8}" y="${top + 15}" width="${width - 16}" height="${bottom - top - 25}" ` +
    `rx="5" fill="${f.recess}"/>`,
    `<rect x="${x + 3}" y="${bottom - 11}" width="${width - 6}" height="8" rx="3" fill="${Q.green}"/>`,
  ];
  const count = state === 'empty' ? 0 : state === 'low' ? 1 : state === 'high' ? (large ? 4 : 3) : (large ? 6 : 5);
  for (let index = 0; index < count; index += 1) {
    const row = Math.floor(index / 2);
    const column = index % 2;
    const canX = x + 8 + column * (large ? 24 : 21);
    const canY = bottom - 25 - row * 12;
    parts.push(canisterMarkup(canX, canY, large ? .78 : .68, index % 2 ? 'structured_data' : 'raw_records'));
  }
  if (state === 'overflowing') {
    parts.push(
      canisterMarkup(x - 7, bottom - 12, .7, 'raw_records'),
      canisterMarkup(x + width - 13, bottom - 6, .7, 'structured_data'),
    );
  }
  return assetSvg(parts.join(''));
}

function dispatchStationSvg(
  state: FillState,
  direction: DepartmentMachineDirectionId,
): string {
  const f = directionFields(direction);
  const parts: string[] = [
    machineBase(37, 48, 55, 68, 8),
    `<rect x="42" y="56" width="31" height="28" rx="5" fill="${f.recess}"/>`,
    `<path d="M 43 87 H 75 L 83 96 H 43 Z" fill="${Q.cream}" stroke="${Q.charcoal}" stroke-width="2"/>`,
    `<rect x="77" y="54" width="10" height="47" rx="4" fill="${f.service}"/>`,
    `<circle cx="82" cy="61" r="3" fill="${Q.metal}"/>`,
    `<rect x="40" y="105" width="49" height="9" rx="3" fill="${Q.green}"/>`,
  ];
  const count = state === 'empty' ? 0 : state === 'low' ? 1 : state === 'high' ? 3 : 5;
  for (let index = 0; index < count; index += 1) {
    parts.push(canisterMarkup(44 + (index % 2) * 17, 82 - Math.floor(index / 2) * 10, .58,
      index % 2 ? 'structured_data' : 'raw_records'));
  }
  if (state === 'overflowing') {
    parts.push(canisterMarkup(28, 103, .62, 'structured_data'));
  }
  return assetSvg(parts.join(''));
}

function dispatchNodeSvg(direction: DepartmentMachineDirectionId): string {
  const f = directionFields(direction);
  return assetSvg(
    machineBase(37, 31, 54, 85, 9) +
    `<rect x="43" y="39" width="42" height="36" rx="6" fill="${f.recess}"/>` +
    `<circle cx="64" cy="57" r="13" fill="${Q.metal}" stroke="${Q.charcoal}" stroke-width="2"/>` +
    `<circle cx="64" cy="57" r="6" fill="${Q.teal}"/>` +
    `<path d="M 64 31 V 16 H 87" fill="none" stroke="${Q.charcoal}" stroke-width="10" stroke-linecap="round"/>` +
    `<path d="M 64 31 V 16 H 87" fill="none" stroke="${Q.metal}" stroke-width="5" stroke-linecap="round"/>` +
    `<rect x="45" y="82" width="38" height="20" rx="4" fill="${Q.cream}"/>` +
    serviceSeam(51, 88, 77, 88) +
    serviceSeam(51, 94, 70, 94) +
    `<rect x="37" y="105" width="54" height="11" rx="4" fill="${Q.green}"/>`,
  );
}

function loadingDockSvg(state: FillState): string {
  const parts: string[] = [
    `<path d="M 9 74 H 119 V 116 H 9 Z" fill="${Q.charcoal}"/>`,
    `<path d="M 13 77 H 115 V 112 H 13 Z" fill="${Q.metal}"/>`,
    `<path d="M 13 77 H 115 V 88 H 13 Z" fill="${Q.cream}"/>`,
    `<path d="M 19 92 H 107" stroke="${Q.charcoal}" stroke-width="3" stroke-dasharray="9 7"/>`,
    `<rect x="12" y="108" width="104" height="8" fill="${Q.green}"/>`,
    `<rect x="17" y="110" width="94" height="2.5" fill="${Q.teal}"/>`,
  ];
  const count = state === 'empty' ? 0 : state === 'low' ? 2 : 5;
  for (let index = 0; index < count; index += 1) {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const x = 18 + column * 27;
    const y = 70 - row * 22;
    parts.push(
      `<rect x="${x}" y="${y}" width="22" height="19" rx="2" fill="${Q.charcoal}"/>`,
      `<rect x="${x + 2}" y="${y + 2}" width="18" height="15" rx="1" fill="${Q.cream}"/>`,
      `<path d="M ${x + 4} ${y + 5} H ${x + 18} M ${x + 4} ${y + 12} H ${x + 18}" ` +
      `stroke="${Q.teal}" stroke-width="1.5"/>`,
    );
  }
  return assetSvg(parts.join(''));
}

function tubeSvg(id: Extract<PriorityOneAssetId,
  'tube_straight' | 'tube_corner' | 'tube_wallpass' | 'tube_riser'>): string {
  if (id === 'tube_straight') {
    return assetSvg(
      `<path d="M 32 64 H 96" stroke="${Q.charcoal}" stroke-width="16" stroke-linecap="round"/>` +
      `<path d="M 32 64 H 96" stroke="${Q.metal}" stroke-width="9" stroke-linecap="round"/>` +
      `<path d="M 43 58 V 70 M 64 58 V 70 M 85 58 V 70" stroke="${Q.teal}" stroke-width="2"/>`,
    );
  }
  if (id === 'tube_corner') {
    return assetSvg(
      `<path d="M 32 64 H 57 Q 64 64 64 71 V 96" fill="none" stroke="${Q.charcoal}" ` +
      `stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="M 32 64 H 57 Q 64 64 64 71 V 96" fill="none" stroke="${Q.metal}" ` +
      `stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="M 43 58 V 70 M 58 58 V 70 M 58 85 H 70" stroke="${Q.teal}" stroke-width="2"/>`,
    );
  }
  if (id === 'tube_wallpass') {
    return assetSvg(
      `<rect x="38" y="34" width="52" height="60" rx="10" fill="${Q.charcoal}"/>` +
      `<rect x="43" y="39" width="42" height="50" rx="7" fill="${Q.cream}"/>` +
      `<circle cx="64" cy="64" r="17" fill="${Q.charcoal}"/>` +
      `<circle cx="64" cy="64" r="10" fill="${Q.metal}"/>` +
      `<path d="M 32 64 H 54 M 74 64 H 96" stroke="${Q.charcoal}" stroke-width="15" stroke-linecap="round"/>` +
      `<path d="M 32 64 H 54 M 74 64 H 96" stroke="${Q.metal}" stroke-width="8" stroke-linecap="round"/>` +
      `<rect x="48" y="84" width="32" height="4" rx="2" fill="${Q.teal}"/>`,
    );
  }
  return assetSvg(
    `<path d="M 64 101 V 52 Q 64 42 74 42 H 92" fill="none" stroke="${Q.charcoal}" ` +
    `stroke-width="17" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M 64 101 V 52 Q 64 42 74 42 H 92" fill="none" stroke="${Q.metal}" ` +
    `stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<rect x="48" y="100" width="32" height="12" rx="4" fill="${Q.green}" stroke="${Q.charcoal}" stroke-width="2"/>` +
    `<path d="M 58 79 H 70 M 58 61 H 70" stroke="${Q.teal}" stroke-width="2"/>`,
  );
}

function deliveryUplinkSvg(direction: DepartmentMachineDirectionId): string {
  const f = directionFields(direction);
  const parts: string[] = [
    `<path d="M 9 31 Q 9 23 17 23 H 49 L 58 14 H 113 Q 120 14 120 21 V 112 ` +
    `Q 120 118 114 118 H 14 Q 8 118 8 112 Z" fill="${Q.charcoal}"/>`,
    `<path d="M 13 33 Q 13 27 19 27 H 51 L 60 18 H 111 Q 116 18 116 23 V 105 H 13 Z" fill="${f.shell}"/>`,
    `<rect x="13" y="33" width="34" height="72" rx="5" fill="${f.structure}"/>`,
    `<rect x="81" y="25" width="28" height="80" rx="5" fill="${Q.cream}"/>`,
    `<rect x="49" y="29" width="30" height="72" rx="5" fill="${direction === 'percussion-line' ? Q.charcoal : f.recess}"/>`,
    `<circle cx="64" cy="51" r="13" fill="${Q.green}" stroke="${Q.charcoal}" stroke-width="3"/>`,
    `<circle cx="64" cy="51" r="7" fill="${Q.metal}"/>`,
    `<path d="M 55 73 H 73 L 79 80 L 73 87 H 55 L 49 80 Z" fill="${Q.cream}" stroke="${Q.charcoal}" stroke-width="2"/>`,
    `<rect x="56" y="77" width="16" height="6" rx="3" fill="${Q.teal}"/>`,
    `<path d="M 88 36 V 94 M 96 36 V 94" stroke="${Q.charcoal}" stroke-width="1.5"/>`,
    `<path d="M 30 41 V 91" stroke="${Q.black}" stroke-width="5" opacity=".18"/>`,
    `<rect x="8" y="104" width="112" height="14" rx="4" fill="${Q.green}"/>`,
    `<rect x="17" y="108" width="94" height="3" rx="1.5" fill="${Q.teal}"/>`,
  ];
  return assetSvg(parts.join(''));
}

export interface PriorityOneAssetOptions {
  readonly direction?: DepartmentMachineDirectionId;
  readonly state?: FillState;
  readonly stamp?: PriorityOneWorkTypeStamp;
}

export function priorityOneAssetSvg(
  id: PriorityOneAssetId,
  options: PriorityOneAssetOptions = {},
): string {
  const direction = options.direction ?? 'percussion-line';
  const state = options.state ?? 'empty';
  switch (id) {
    case 'loading_dock': return loadingDockSvg(state);
    case 'sorting_frame': return sortingFrameSvg(direction);
    case 'franking_machine': return frankingMachineSvg(direction);
    case 'keypunch_bank': return keypunchBankSvg(direction);
    case 'tabulating_machine': return tabulatingMachineSvg(direction);
    case 'intake_tray_small': return traySvg(false, state, direction);
    case 'intake_tray_large': return traySvg(true, state, direction);
    case 'dispatch_station': return dispatchStationSvg(state, direction);
    case 'pneumatic_dispatch_node': return dispatchNodeSvg(direction);
    case 'tube_straight':
    case 'tube_corner':
    case 'tube_wallpass':
    case 'tube_riser':
      return tubeSvg(id);
    case 'canister_base':
      return assetSvg(canisterMarkup(48, 56, 1.15, options.stamp));
    case 'delivery_uplink': return deliveryUplinkSvg(direction);
  }
}

export function workTypeStampOverlaySvg(stamp: PriorityOneWorkTypeStamp): string {
  if (stamp === 'raw_records') {
    return assetSvg(
      `<g fill="none" stroke="${Q.white}" stroke-width="2" stroke-linecap="round">` +
      '<path d="M 58 60 H 72 M 58 65 H 69 M 58 70 H 72"/></g>',
    );
  }
  return assetSvg(
    `<g fill="${Q.white}">` +
    '<circle cx="59" cy="61" r="1.5"/><circle cx="65" cy="61" r="1.5"/>' +
    '<circle cx="71" cy="61" r="1.5"/><circle cx="59" cy="68" r="1.5"/>' +
    '<circle cx="65" cy="68" r="1.5"/><circle cx="71" cy="68" r="1.5"/></g>',
  );
}

class ProofRenderer {
  private readonly style: StyleSheet;
  private readonly wall: TileInstance;
  private readonly wallCache = new Map<string, string>();
  private readonly characterCache = new Map<string, string>();

  constructor() {
    const project = defaultProject();
    const wall = project.walls.find(({ id }) => id === 'wall-office');
    if (!wall) throw new Error('Default project is missing wall-office');
    this.wall = wall;
    this.style = structuredClone(DEFAULT_STYLE);
  }

  character(
    recipe: CharacterRecipe,
    facing: Facing | 'west',
    pose: Pose = 'neutral',
  ): string {
    const key = `${recipe.id}:${facing}:${pose}`;
    let source = this.characterCache.get(key);
    if (!source) {
      source = composeCharacter(
        recipe,
        this.style,
        facing,
        AUTHORING_CANVAS,
        'normal',
        { badge: false, pose },
      );
      this.characterCache.set(key, source);
    }
    return source;
  }

  wallTile(
    maskIndex: number,
    x: number,
    y: number,
    size: number,
    flipX = false,
  ): string {
    const key = `${maskIndex}:${flipX}`;
    let markup = this.wallCache.get(key);
    if (!markup) {
      const source = composeWallTile(
        this.wall,
        this.style,
        BLOB_CONFIGS[maskIndex],
        AUTHORING_CANVAS,
      );
      const inner = stripSvgShell(source);
      markup = flipX
        ? `<g transform="matrix(-1 0 0 1 128 0)">${inner}</g>`
        : inner;
      this.wallCache.set(key, markup);
    }
    return `<svg x="${x}" y="${y}" width="${size}" height="${size}" ` +
      `viewBox="0 0 128 128" preserveAspectRatio="none" overflow="hidden">${markup}</svg>`;
  }
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
    `<rect x="${x}" y="${y}" width="${columns * cell}" height="${rows * cell}" ` +
    `fill="${FLOOR}" stroke="#56616A" stroke-width="2"/>`,
  );
  for (let column = 1; column < columns; column += 1) {
    parts.push(line(x + column * cell, y, x + column * cell, y + rows * cell, FLOOR_LINE, 1, .18));
  }
  for (let row = 1; row < rows; row += 1) {
    parts.push(line(x, y + row * cell, x + columns * cell, y + row * cell, FLOOR_LINE, 1, .18));
  }
}

function drawWalls(
  parts: string[],
  renderer: ProofRenderer,
  x: number,
  y: number,
  columns: number,
  rows: number,
  cell: number,
  layer: 'back' | 'front',
): void {
  if (layer === 'back') {
    parts.push(renderer.wallTile(6, x, y, cell));
    for (let column = 1; column < columns - 1; column += 1) {
      parts.push(renderer.wallTile(10, x + column * cell, y, cell));
    }
    parts.push(renderer.wallTile(12, x + (columns - 1) * cell, y, cell));
    for (let row = 1; row < rows - 1; row += 1) {
      parts.push(
        renderer.wallTile(5, x, y + row * cell, cell),
        renderer.wallTile(5, x + (columns - 1) * cell, y + row * cell, cell, true),
      );
    }
    return;
  }
  parts.push(renderer.wallTile(3, x, y + (rows - 1) * cell, cell));
  for (let column = 1; column < columns - 1; column += 1) {
    parts.push(renderer.wallTile(10, x + column * cell, y + (rows - 1) * cell, cell));
  }
  parts.push(renderer.wallTile(9, x + (columns - 1) * cell, y + (rows - 1) * cell, cell));
}

function scaleSuggestion(id: PriorityOneAssetId): PriorityOneScaleSuggestion {
  const suggestion = PRIORITY_ONE_SCALE_SUGGESTIONS.find((entry) => entry.id === id);
  if (!suggestion) throw new Error(`Missing scale suggestion for ${id}`);
  return suggestion;
}

function assetPlacement(
  id: PriorityOneAssetId,
  x: number,
  y: number,
  cell: number,
  options: PriorityOneAssetOptions = {},
  showOccupancy = true,
): string {
  const suggestion = scaleSuggestion(id);
  const footprint = suggestion.gridFootprint ?? { w: 1, h: 1 };
  const width = footprint.w * cell;
  const height = footprint.h * cell;
  const nativeSize = cell * PROP_NATIVE_FRAME_CELLS;
  const spriteX = x + (width - nativeSize) / 2;
  const spriteY = suggestion.projection === 'plan'
    ? y + (height - nativeSize) / 2
    : y + height - nativeSize * (116 / AUTHORING_CANVAS);
  const guide = showOccupancy && suggestion.gridFootprint
    ? `<rect x="${x + 3}" y="${y + 3}" width="${Math.max(4, width - 6)}" ` +
      `height="${Math.max(4, height - 6)}" rx="5" fill="${OCCUPANCY}" fill-opacity=".07" ` +
      `stroke="${suggestion.status === 'open-contract' ? Q.coral : OCCUPANCY}" ` +
      `stroke-width="1.5" stroke-dasharray="6 5"/>`
    : '';
  return guide + placedSvg(priorityOneAssetSvg(id, options), spriteX, spriteY, nativeSize);
}

function characterPlacement(
  renderer: ProofRenderer,
  recipe: CharacterRecipe,
  facing: Facing | 'west',
  x: number,
  y: number,
  cell: number,
  pose: Pose = 'neutral',
): string {
  const frame = cell * CHARACTER_FRAME_CELLS;
  return placedSvg(renderer.character(recipe, facing, pose), x - frame / 2, y - frame * .86, frame);
}

function svgPage(width: number, height: number, markup: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${PAGE}"/>${markup}</svg>`;
}

function directionAssetCard(
  id: PriorityOneAssetId,
  label: string,
  direction: DepartmentMachineDirectionId,
  x: number,
  y: number,
  width: number,
  size: number,
): string {
  return roundedRect(x, y, width, size + 82, 10, PANEL_ALT) +
    text(x + 16, y + 25, label.toUpperCase(), 12, 760, MUTED) +
    placedSvg(priorityOneAssetSvg(id, {
      direction,
      state: id.includes('tray') ? 'high' : undefined,
    }), x + (width - size) / 2, y + 35, size) +
    text(x + width / 2, y + size + 64, id, 11, 600, MUTED, 'middle');
}

export function renderDirectionComparisonSvg(): string {
  const width = 3400;
  const height = 2040;
  const parts: string[] = [
    text(42, 55, 'QUOTACO DEPARTMENT MACHINES · PRODUCT-FAMILY DIRECTIONS', 30, 760, Q.green),
    text(42, 87, 'Review only · Priority 1 · post-rescale grid · no production source, template, export, schema, or Unity mutation', 15, 620, MUTED),
    text(width - 42, 55, 'OWNER GATE · CHOOSE / CORRECT ONE DIRECTION', 13, 760, Q.coral, 'end'),
  ];
  const panelWidth = 1080;
  const panelY = 116;
  const panelHeight = 1740;
  DEPARTMENT_MACHINE_DIRECTIONS.forEach((direction, index) => {
    const x = 34 + index * (panelWidth + 26);
    parts.push(
      roundedRect(x, panelY, panelWidth, panelHeight, 16,
        direction.recommended ? PANEL_COLD : PANEL),
      text(x + 24, panelY + 43, direction.label, 22, 780,
        direction.recommended ? Q.green : INK),
      text(x + panelWidth - 24, panelY + 42,
        direction.recommended ? 'RECOMMENDED CONTROL' : 'BOUNDED ALTERNATIVE',
        11, 760, direction.recommended ? Q.green : MUTED, 'end'),
      multilineText(x + 24, panelY + 78, wrap(direction.thesis, 82), 15, 22, 560, INK),
      multilineText(x + 24, panelY + 143, wrap(direction.familyRule, 82), 14, 20, 650, MUTED),
    );
    const cards = [
      ['sorting_frame', 'Sorting Frame'],
      ['keypunch_bank', 'Keypunch Bank'],
      ['tabulating_machine', 'Tabulating Machine'],
      ['intake_tray_large', 'Large tray · high'],
      ['delivery_uplink', 'Delivery uplink'],
    ] as const;
    cards.forEach(([id, label], cardIndex) => {
      const cardWidth = cardIndex < 3 ? 324 : 486;
      const cardX = cardIndex < 3
        ? x + 24 + cardIndex * 342
        : x + 24 + (cardIndex - 3) * 510;
      const cardY = cardIndex < 3 ? panelY + 230 : panelY + 690;
      parts.push(directionAssetCard(id, label, direction.id, cardX, cardY, cardWidth,
        cardIndex < 3 ? 300 : 330));
    });
    parts.push(
      roundedRect(x + 24, panelY + 1132, panelWidth - 48, 236, 10, PANEL_ALT),
      text(x + 44, panelY + 1164, 'FAMILY READ', 12, 760, MUTED),
      multilineText(x + 44, panelY + 1200, wrap(direction.strength, 94), 15, 23, 560, INK),
      text(x + 44, panelY + 1274, 'WATCH', 12, 760, Q.coral),
      multilineText(x + 44, panelY + 1308, wrap(direction.risk, 94), 15, 23, 560, INK),
      roundedRect(x + 24, panelY + 1390, panelWidth - 48, 306, 10,
        direction.recommended ? '#DCE8E2' : '#EEE9DE'),
      text(x + 44, panelY + 1426, 'CLOSE / NORMAL / FAR SILHOUETTE CHECK', 12, 760, MUTED),
    );
    const sizes = [180, 104, 58];
    sizes.forEach((size, sizeIndex) => {
      const px = x + 80 + sizeIndex * 306;
      parts.push(
        placedSvg(priorityOneAssetSvg('tabulating_machine', { direction: direction.id }),
          px, panelY + 1460 + (180 - size), size),
        text(px + size / 2, panelY + 1670,
          sizeIndex === 0 ? '128u source' : sizeIndex === 1 ? 'normal room' : '40 px/cell read',
          11, 620, MUTED, 'middle'),
      );
    });
  });
  parts.push(
    roundedRect(34, 1880, width - 68, 122, 12, PANEL_ALT),
    text(58, 1916, 'Recommendation', 13, 760, Q.green),
    multilineText(58, 1946, [
      'Carry B forward: it makes the keypunch bank and tabulator loud without borrowing science-fiction display language.',
      'Use A as the quiet furniture control and C only where a wall/rack noun genuinely earns the vertical register.',
    ], 15, 24, 560, INK),
    text(width - 58, 1977, 'No wear · no clutter · no baked UI · no amber/rose · no camera cues', 13, 720, Q.coral, 'end'),
  );
  return svgPage(width, height, parts.join(''));
}

function assetInventoryCard(
  entry: PriorityOneScaleSuggestion,
  x: number,
  y: number,
  width: number,
  height: number,
): string {
  const state: FillState = entry.id === 'loading_dock' ? 'high'
    : entry.id.includes('tray') || entry.id === 'dispatch_station' ? 'high'
      : 'empty';
  const spriteSize = 190;
  const footprintLabel = entry.gridFootprint
    ? `${entry.gridFootprint.w}×${entry.gridFootprint.h} suggested`
    : 'item overlay · no facility footprint';
  return roundedRect(x, y, width, height, 10,
    entry.status === 'open-contract' ? PANEL_WARN : PANEL) +
    text(x + 16, y + 25, entry.label.toUpperCase(), 11, 760, MUTED) +
    text(x + width - 16, y + 25, entry.status === 'open-contract' ? 'OPEN' : 'SUGGEST',
      10, 760, entry.status === 'open-contract' ? Q.coral : Q.green, 'end') +
    placedSvg(priorityOneAssetSvg(entry.id, { state, direction: 'percussion-line' }),
      x + (width - spriteSize) / 2, y + 38, spriteSize) +
    text(x + 16, y + 250, entry.id, 12, 700, INK) +
    text(x + 16, y + 273, `${footprintLabel} · ${entry.projection}`, 11, 620, MUTED) +
    multilineText(x + 16, y + 300, wrap(entry.note, 46), 11, 17, 520, MUTED);
}

function stateStrip(
  id: 'loading_dock' | 'intake_tray_small' | 'intake_tray_large' | 'dispatch_station',
  states: readonly FillState[],
  x: number,
  y: number,
  width: number,
  label: string,
): string {
  const parts = [
    roundedRect(x, y, width, 300, 10, PANEL_ALT),
    text(x + 18, y + 29, label.toUpperCase(), 12, 760, MUTED),
    text(x + width - 18, y + 29, 'EXPLICIT SPRITE VARIANTS · NEVER RUNTIME TINT', 10, 720, Q.coral, 'end'),
  ];
  const slot = (width - 36) / states.length;
  states.forEach((state, index) => {
    const size = id === 'loading_dock' ? 178 : 150;
    const px = x + 18 + index * slot + (slot - size) / 2;
    parts.push(
      placedSvg(priorityOneAssetSvg(id, { state, direction: 'percussion-line' }), px, y + 52, size),
      text(x + 18 + index * slot + slot / 2, y + 238, state.toUpperCase(), 11, 720,
        state === 'overflowing' ? Q.coral : INK, 'middle'),
      placedSvg(priorityOneAssetSvg(id, { state, direction: 'percussion-line' }),
        x + 18 + index * slot + (slot - 52) / 2, y + 246, 52),
    );
  });
  return parts.join('');
}

export function renderScaleAndStatesSvg(): string {
  const width = 3400;
  const height = 2940;
  const parts: string[] = [
    text(42, 55, 'PRIORITY 1 · POST-RESCALE SCALE / FOOTPRINT / STATE STUDY', 30, 760, Q.green),
    text(42, 87, '128u prop frame = two gameplay cells · character frame ≈ one cell · coral dashed/open labels are questions, not locks', 15, 620, MUTED),
    text(width - 42, 55, 'REVIEW ONLY · SUGGEST, DO NOT LOCK', 13, 760, Q.coral, 'end'),
  ];
  const columns = 5;
  const cardWidth = 650;
  const cardHeight = 356;
  PRIORITY_ONE_SCALE_SUGGESTIONS.forEach((entry, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    parts.push(assetInventoryCard(entry, 32 + column * 672, 116 + row * 376, cardWidth, cardHeight));
  });
  parts.push(
    stateStrip('loading_dock', PRIORITY_ONE_FILL_STATES.loading_dock, 32, 1272, 1000, 'Loading dock stack'),
    stateStrip('intake_tray_small', PRIORITY_ONE_FILL_STATES.intake_tray_small, 1054, 1272, 1136, 'Small intake tray'),
    stateStrip('intake_tray_large', PRIORITY_ONE_FILL_STATES.intake_tray_large, 2212, 1272, 1156, 'Large intake tray'),
    stateStrip('dispatch_station', PRIORITY_ONE_FILL_STATES.dispatch_station, 32, 1594, 1280, 'Dispatch queue'),
  );
  parts.push(
    roundedRect(1334, 1594, 990, 300, 10, PANEL_ALT),
    text(1352, 1623, 'CANISTER BASE + WORK-TYPE OVERLAYS', 12, 760, MUTED),
    text(2306, 1623, 'ONE BODY · N STAMPS', 10, 760, Q.green, 'end'),
    placedSvg(priorityOneAssetSvg('canister_base'), 1390, 1645, 180),
    text(1480, 1848, 'BASE', 11, 720, MUTED, 'middle'),
    text(1625, 1732, '+', 30, 500, MUTED, 'middle'),
    placedSvg(priorityOneAssetSvg('canister_base', { stamp: 'raw_records' }), 1680, 1645, 180),
    text(1770, 1848, 'RAW RECORDS', 11, 720, MUTED, 'middle'),
    placedSvg(priorityOneAssetSvg('canister_base', { stamp: 'structured_data' }), 2010, 1645, 180),
    text(2100, 1848, 'STRUCTURED DATA', 11, 720, MUTED, 'middle'),
    roundedRect(2346, 1594, 1022, 300, 10, PANEL_ALT),
    text(2364, 1623, 'TUBE KIT · ONE-CELL FLOOR RUNS', 12, 760, MUTED),
  );
  const tubeIds = ['tube_straight', 'tube_corner', 'tube_wallpass', 'tube_riser'] as const;
  tubeIds.forEach((id, index) => {
    parts.push(
      placedSvg(priorityOneAssetSvg(id), 2375 + index * 238, 1642, 160),
      text(2455 + index * 238, 1848, id.replace('tube_', '').toUpperCase(), 10, 720,
        id === 'tube_wallpass' ? Q.coral : MUTED, 'middle'),
    );
  });
  parts.push(
    roundedRect(32, 1918, width - 64, 980, 12, PANEL),
    text(54, 1953, 'CONTRACT QUESTIONS TO RESOLVE BEFORE PRODUCTION', 16, 780, Q.coral),
    text(width - 54, 1953, 'The art can proceed only after the nouns and grid consequences are explicit.', 12, 620, MUTED, 'end'),
  );
  PRIORITY_ONE_OPEN_QUESTIONS.forEach((question, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 54 + column * 1658;
    const y = 1984 + row * 286;
    parts.push(
      roundedRect(x, y, 1630, 264, 10, index % 2 ? PANEL_ALT : '#F3EEE3'),
      text(x + 18, y + 30, question.label, 12, 780, Q.coral),
      text(x + 18, y + 62, 'RECOMMENDATION', 10, 760, MUTED),
      multilineText(x + 18, y + 87, wrap(question.recommendation, 94), 14, 21, 620, INK),
      text(x + 18, y + 158, 'WHY THIS IS OPEN', 10, 760, MUTED),
      multilineText(x + 18, y + 183, wrap(question.reason, 94), 13, 20, 520, MUTED),
    );
  });
  return svgPage(width, height, parts.join(''));
}

function minimalChainScene(
  renderer: ProofRenderer,
  originX: number,
  originY: number,
  cell: number,
): string {
  const parts: string[] = [];
  const roomCols = 7;
  const roomRows = 7;
  const gap = cell * 2;
  const intakeX = originX;
  const dataX = originX + roomCols * cell + gap;
  drawGrid(parts, intakeX, originY, roomCols, roomRows, cell);
  drawGrid(parts, dataX, originY, roomCols, roomRows, cell);
  drawWalls(parts, renderer, intakeX, originY, roomCols, roomRows, cell, 'back');
  drawWalls(parts, renderer, dataX, originY, roomCols, roomRows, cell, 'back');

  parts.push(
    assetPlacement('loading_dock', intakeX - 3.4 * cell, originY + 1.5 * cell, cell,
      { state: 'high' }, true),
    assetPlacement('sorting_frame', intakeX + cell, originY + cell, cell, {}, true),
    assetPlacement('franking_machine', intakeX + 4 * cell, originY + 2 * cell, cell, {}, true),
    assetPlacement('intake_tray_large', intakeX + 4.6 * cell, originY + 4.6 * cell, cell,
      { state: 'overflowing' }, true),
    assetPlacement('dispatch_station', intakeX + 1.2 * cell, originY + 4.6 * cell, cell,
      { state: 'high' }, true),
    assetPlacement('pneumatic_dispatch_node', intakeX + 2.3 * cell, originY + 4.6 * cell, cell, {}, true),
    assetPlacement('keypunch_bank', dataX + cell, originY + cell, cell, {}, true),
    assetPlacement('tabulating_machine', dataX + 3.6 * cell, originY + cell, cell, {}, true),
    assetPlacement('intake_tray_small', dataX + 1.2 * cell, originY + 4.6 * cell, cell,
      { state: 'high' }, true),
    assetPlacement('dispatch_station', dataX + 3.3 * cell, originY + 4.6 * cell, cell,
      { state: 'low' }, true),
    assetPlacement('delivery_uplink', dataX + 4.5 * cell, originY + 3.7 * cell, cell, {}, true),
  );

  const tubeY = originY + 5.5 * cell;
  parts.push(
    assetPlacement('tube_riser', intakeX + 2.3 * cell, originY + 4.6 * cell, cell, {}, false),
    assetPlacement('tube_straight', intakeX + 3.25 * cell, tubeY - .5 * cell, cell, {}, true),
    assetPlacement('tube_straight', intakeX + 4.25 * cell, tubeY - .5 * cell, cell, {}, true),
    assetPlacement('tube_straight', intakeX + 5.25 * cell, tubeY - .5 * cell, cell, {}, true),
    assetPlacement('tube_wallpass', intakeX + 6.25 * cell, tubeY - .5 * cell, cell, {}, true),
    assetPlacement('tube_straight', intakeX + 7.25 * cell, tubeY - .5 * cell, cell, {}, true),
    assetPlacement('tube_wallpass', dataX - .75 * cell, tubeY - .5 * cell, cell, {}, true),
    assetPlacement('tube_straight', dataX + .25 * cell, tubeY - .5 * cell, cell, {}, true),
    assetPlacement('tube_riser', dataX + 1.2 * cell, originY + 4.6 * cell, cell, {}, false),
  );

  parts.push(
    characterPlacement(renderer, DEFAULT_CAST[0], 'south', intakeX + 3.4 * cell, originY + 4.3 * cell, cell),
    characterPlacement(renderer, DEFAULT_CAST[1], 'west', intakeX + 5.2 * cell, originY + 3.8 * cell, cell),
    characterPlacement(renderer, DEFAULT_CAST[2], 'south', dataX + 3.2 * cell, originY + 4.2 * cell, cell),
    characterPlacement(renderer, DEFAULT_CAST[3], 'east', dataX + 5.4 * cell, originY + 3.4 * cell, cell),
    characterPlacement(renderer, DEFAULT_CAST[2], 'east', intakeX + 2.6 * cell, originY + 3.1 * cell, cell, 'walk-approach'),
    characterPlacement(renderer, DEFAULT_CAST[0], 'west', dataX + 4.5 * cell, originY + 4.7 * cell, cell, 'walk-approach'),
    placedSvg(priorityOneAssetSvg('canister_base', { stamp: 'raw_records' }),
      intakeX + .35 * cell, originY + 3.6 * cell, cell * 1.1),
    placedSvg(priorityOneAssetSvg('canister_base', { stamp: 'structured_data' }),
      dataX + 2.55 * cell, originY + 4.35 * cell, cell * 1.1),
  );

  drawWalls(parts, renderer, intakeX, originY, roomCols, roomRows, cell, 'front');
  drawWalls(parts, renderer, dataX, originY, roomCols, roomRows, cell, 'front');

  parts.push(
    text(intakeX + roomCols * cell / 2, originY - 16, 'INTAKE', Math.max(10, cell * .18), 780, Q.green, 'middle'),
    text(dataX + roomCols * cell / 2, originY - 16, 'DATA PROCESSING', Math.max(10, cell * .18), 780, Q.green, 'middle'),
    text(intakeX - 1.9 * cell, originY + 1.25 * cell, 'INBOUND DOCK', Math.max(9, cell * .13), 760, MUTED, 'middle'),
  );
  return parts.join('');
}

export function renderMinimalChainRoomFlowSvg(): string {
  const width = 3400;
  const height = 2260;
  const renderer = new ProofRenderer();
  const parts: string[] = [
    text(42, 55, 'MINIMAL CHAIN · COMPOSED-OFFICE READABILITY PROOF', 30, 760, Q.green),
    text(42, 87, 'Intake → Data Processing → delivery · people carry within rooms · one-cell tube run crosses department boundary', 15, 620, MUTED),
    text(width - 42, 55, 'ART PROOF · NOT AN EXPORTED OFFICE OR PARITY CLAIM', 13, 760, Q.coral, 'end'),
    roundedRect(32, 116, width - 64, 1120, 14, PANEL),
    text(54, 151, 'CLOSE COMPOSED READ · 122 PX / CELL REVIEW ENLARGEMENT', 13, 760, MUTED),
    minimalChainScene(renderer, 630, 260, 122),
    text(2785, 270, 'FLOW LAW', 13, 780, MUTED),
    multilineText(2785, 310, [
      'Dock → tray → desks → machine',
      'moves by hand inside Intake.',
      '',
      'Only the tube crosses the',
      'department boundary.',
      '',
      'The physical floor run claims',
      'the corridor cells it crosses.',
    ], 14, 24, 560, INK),
    roundedRect(32, 1260, 1450, 930, 14, PANEL_COLD),
    text(54, 1295, 'FAR GAMEPLAY SCALE · 40 PX / CELL', 13, 760, MUTED),
    minimalChainScene(renderer, 190, 1382, FAR_CELL),
    text(72, 1862, 'FAR-READ BUFFER STATES', 11, 760, MUTED),
    placedSvg(priorityOneAssetSvg('intake_tray_large', { state: 'empty' }), 92, 1882, 108),
    placedSvg(priorityOneAssetSvg('intake_tray_large', { state: 'low' }), 232, 1882, 108),
    placedSvg(priorityOneAssetSvg('intake_tray_large', { state: 'high' }), 372, 1882, 108),
    placedSvg(priorityOneAssetSvg('intake_tray_large', { state: 'overflowing' }), 512, 1882, 108),
    text(146, 2010, 'EMPTY', 10, 700, MUTED, 'middle'),
    text(286, 2010, 'LOW', 10, 700, MUTED, 'middle'),
    text(426, 2010, 'HIGH', 10, 700, MUTED, 'middle'),
    text(566, 2010, 'OVERFLOW', 10, 700, Q.coral, 'middle'),
    roundedRect(1506, 1260, 1862, 930, 14, PANEL_ALT),
    text(1530, 1295, 'READABILITY CALLS', 13, 780, MUTED),
  ];
  const calls = [
    'Large vs small tray separates by capacity silhouette, not footprint inflation.',
    'Empty / low / high / overflowing remains visible without a meter or colored UI bar.',
    'Keypunch is a row of human consoles; Tabulator is one heavy percussion machine.',
    'Floor-run tube reads as a physical obstruction, not a painted route overlay.',
    'Delivery uplink borrows IRIS weighted mass but replaces optics/screens with a mechanical outbound hatch.',
    'People and placed canisters supply all wear, clutter, and personality; every SKU stays standardized.',
  ];
  calls.forEach((call, index) => {
    const y = 1340 + index * 112;
    parts.push(
      `<circle cx="1549" cy="${y - 5}" r="5" fill="${index < 5 ? Q.green : Q.coral}"/>`,
      multilineText(1566, y, wrap(call, 118), 14, 21, 560, INK),
    );
  });
  parts.push(
    roundedRect(1530, 2035, 1814, 122, 10, PANEL_WARN),
    multilineText(1550, 2067, [
      'This page tests composed pixels only.',
      'It does not resolve state manifests, mixed dock occupancy, three-cell art, wall-pass routing, or Unity import.',
    ], 13, 22, 650, Q.coral),
  );
  return svgPage(width, height, parts.join(''));
}

function rasterize(svg: string): Uint8Array {
  return new Resvg(svg).render().asPng();
}

export interface DepartmentMachineCalibrationResult {
  readonly output: string;
  readonly files: readonly string[];
  readonly metricsPath: string;
  readonly readmePath: string;
}

export async function renderDepartmentMachineFamilyCalibration(
  output: string,
): Promise<DepartmentMachineCalibrationResult> {
  await mkdir(output, { recursive: true });
  const pages = [
    ['01-product-family-directions', renderDirectionComparisonSvg()],
    ['02-priority1-scale-and-states', renderScaleAndStatesSvg()],
    ['03-minimal-chain-room-flow', renderMinimalChainRoomFlowSvg()],
  ] as const;
  const files: string[] = [];
  for (const [stem, svg] of pages) {
    const svgPath = path.join(output, `${stem}.svg`);
    const pngPath = path.join(output, `${stem}.png`);
    await writeFile(svgPath, svg, 'utf8');
    await writeFile(pngPath, rasterize(svg));
    files.push(svgPath, pngPath);
  }

  const metrics = {
    reviewStatus: 'awaiting-owner-direction-and-grid-decisions',
    productionPromotion: false,
    canonicalSvgAuthoring: false,
    templateRegistration: false,
    defaultsMutation: false,
    exportRun: false,
    schemaMutation: false,
    unityImport: false,
    parityClaim: false,
    scope: 'priority-1-only',
    recommendedDirection: 'percussion-line',
    assetIds: PRIORITY_ONE_ASSET_IDS,
    workTypeStamps: PRIORITY_ONE_WORK_TYPE_STAMPS,
    fillStates: PRIORITY_ONE_FILL_STATES,
    invariants: {
      authoringCanvas: AUTHORING_CANVAS,
      propNativeFrameCells: PROP_NATIVE_FRAME_CELLS,
      characterVisualScale: CHARACTER_VISUAL_SCALE,
      characterFrameCells: CHARACTER_FRAME_CELLS,
      amberUsed: false,
      roseUsed: false,
      bakedUiUsed: false,
      cameraCueUsed: false,
      standardizedSku: true,
    },
    scaleSuggestions: PRIORITY_ONE_SCALE_SUGGESTIONS,
    openQuestions: PRIORITY_ONE_OPEN_QUESTIONS,
  };
  const metricsPath = path.join(output, 'metrics.json');
  await writeFile(metricsPath, `${JSON.stringify(metrics, null, 2)}\n`, 'utf8');
  files.push(metricsPath);

  const readme = `# QuotaCo department-machine family calibration v1

Status: **review-only; awaiting owner direction and grid/export decisions**

This proof covers Priority 1 only. It compares three bounded product-family directions, recommends
**B — Administrative Percussion**, inventories every requested Priority 1 id, proves explicit fill/queue
sprites and canister stamp overlays, and places the proposed family in a literal post-rescale two-room chain.

It intentionally changes no production SVG, PropTemplate, default instance, exporter, schema, bundle,
Unity import, parity baseline, or commit. Priority 2 has not started.

## Owner gate

1. Choose/correct the product-family direction.
2. Resolve the six contract questions printed on page 2.
3. Approve or correct the composed normal/far room read.

Only then promote Priority 1 through canonical SVG authoring, deterministic import, template/default/state
registration, facility/export manifests, a fresh composed-office bundle, sim import, and parity checks.
`;
  const readmePath = path.join(output, 'README.md');
  await writeFile(readmePath, readme, 'utf8');
  files.push(readmePath);

  return { output, files, metricsPath, readmePath };
}

function parseOut(argv: readonly string[]): string {
  const index = argv.indexOf('--out');
  if (index >= 0 && argv[index + 1]) return path.resolve(argv[index + 1]);
  return path.resolve('docs/previews/quota-co-department-machine-family-calibration-v1');
}

async function main(): Promise<void> {
  const result = await renderDepartmentMachineFamilyCalibration(parseOut(process.argv.slice(2)));
  process.stdout.write(`Wrote ${result.files.length} review-only files to ${result.output}\n`);
}

const isMain = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;
if (isMain) {
  await main();
}
