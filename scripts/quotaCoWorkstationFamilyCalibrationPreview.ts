/**
 * Review-only QuotaCo workstation-family calibration.
 *
 *   node --import tsx scripts/quotaCoWorkstationFamilyCalibrationPreview.ts
 *
 * This proof deliberately owns temporary SVG markup in code. It does not add
 * source assets, route templates through authoredPropShapes, change defaults,
 * alter the export/schema contract, or touch Unity registration. Artist-editable
 * SVG sources are the next slice only after this sheet is visually accepted.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';

import {
  composeCharacter,
  composeProp,
  composeWallTile,
} from '../src/core/compositor';
import { facilityCatalogJson } from '../src/core/layout';
import {
  CURRENT_SCHEMA_VERSION,
  type CharacterRecipe,
  type Facing,
  type PropInstance,
  type PropTemplate,
  type StyleSheet,
  type TileInstance,
} from '../src/core/types';
import {
  DEFAULT_CAST,
  DEFAULT_STYLE,
  defaultProject,
} from '../src/data/defaults';
import type { Pose } from '../src/parts/poses';
import { authoredPropArt } from '../src/props/authoredArt';
import { PROP_TEMPLATES } from '../src/props/templates';
import { BLOB_CONFIGS } from '../src/tiles/blob';

const WIDTH = 3380;
const HEIGHT = 2020;
const MARGIN = 34;
const GAP = 16;
const AUTHORING_CANVAS = 128;
const NORMAL_CELL = 74;
const FAR_CELL = 40;
const WALL_DATUM = 112;
const CHARACTER_VISUAL_SCALE = 0.65;
const CHARACTER_FRAME_CELLS = 1.55 * CHARACTER_VISUAL_SCALE;
// Unity imports every 128px prop frame at 128 PPU while the person-scaled
// office grid uses tileSize 0.5. The native prop frame is therefore two
// gameplay cells on each axis. Individual silhouettes occupy different
// portions of that frame; they do not inherit the character's 0.65 multiplier.
export const PROP_NATIVE_FRAME_CELLS = 2;

const PAGE = '#E7E1D2';
const PANEL = '#F6F1E6';
const PANEL_ALT = '#ECE5D7';
const INK = '#292C2A';
const MUTED = '#626861';
const RULE = '#A39B8B';
const FLOOR = '#7B8890';
const FLOOR_LINE = '#D9D4C7';
const OCCUPANCY = '#D7CFAF';

const Q = {
  creamLight: '#F3EEDA',
  cream: '#DED5BD',
  creamShade: '#C7BDA7',
  green: '#355247',
  greenLight: '#49685A',
  olive: '#77755D',
  coral: '#B65F4D',
  rust: '#98513F',
  charcoal: '#262B29',
  recess: '#18211E',
  paper: '#F4F0E4',
  blueGlass: '#8FB7C0',
  metal: '#8E9690',
} as const;

export const WORKSTATION_FAMILY_PROP_IDS = [
  'standing-desk',
  'cubicle-workstation',
  'reception-desk',
  'conference-table',
  'supply-cabinet',
  'desk-lamp',
  'desk-clutter',
] as const;

export type WorkstationFamilyPropId =
  (typeof WORKSTATION_FAMILY_PROP_IDS)[number];

export const WORKSTATION_CALIBRATION_CONTROL_IDS = [
  'desk',
  'office-chair',
  'filing-cabinet',
] as const;

/**
 * Review-only internal art envelopes inside the fixed native two-cell frame.
 * Plan props scale around their center; elevation props scale around the
 * unchanged y=116 grounded pivot. These are visual calibration values, not
 * production transform, export, schema, collision, or Unity changes.
 */
export const WORKSTATION_GAMEPLAY_ART_SCALES = {
  'office-chair': 0.72,
  'filing-cabinet': 0.76,
  'supply-cabinet': 0.76,
  'desk-lamp': 0.58,
} as const;

interface FamilyDecision {
  readonly id: WorkstationFamilyPropId;
  readonly label: string;
  readonly category: string;
  readonly designRead: string;
}

export const WORKSTATION_FAMILY_DECISIONS: readonly FamilyDecision[] = [
  {
    id: 'standing-desk',
    label: 'Standing desk',
    category: 'work surface',
    designRead: 'lift-control pod + rear equipment rail',
  },
  {
    id: 'cubicle-workstation',
    label: 'Cubicle workstation',
    category: 'workstation',
    designRead: 'one continuous molded privacy shell',
  },
  {
    id: 'reception-desk',
    label: 'Reception desk',
    category: 'public interface',
    designRead: 'single molded L-shell + public service ledge',
  },
  {
    id: 'conference-table',
    label: 'Conference table',
    category: 'meeting',
    designRead: 'broad capsule + central cable/service spine',
  },
  {
    id: 'supply-cabinet',
    label: 'Supply cabinet',
    category: 'storage',
    designRead: 'catalog bay + labeled double-door base',
  },
  {
    id: 'desk-lamp',
    label: 'Desk lamp',
    category: 'task light',
    designRead: 'molded task hood + weighted service base',
  },
  {
    id: 'desk-clutter',
    label: 'Desk clutter',
    category: 'personalization',
    designRead: 'one organized paperwork island',
  },
] as const;

interface ContractSnapshot {
  readonly id: WorkstationFamilyPropId;
  readonly projection: 'plan' | 'elevation';
  readonly gridFootprint: { readonly w: number; readonly h: number };
  readonly contactShadow: PropTemplate['footprint'] | null;
  readonly params: readonly {
    readonly key: string;
    readonly min: number;
    readonly max: number;
    readonly step: number;
    readonly default: number;
  }[];
  readonly defaultInstanceParams: Readonly<Record<string, number>>;
}

export const EXPECTED_WORKSTATION_FAMILY_CONTRACTS:
readonly ContractSnapshot[] = [
  {
    id: 'standing-desk',
    projection: 'plan',
    gridFootprint: { w: 2, h: 1 },
    contactShadow: null,
    params: [
      { key: 'width', min: 84, max: 116, step: 4, default: 100 },
      { key: 'dual', min: 0, max: 1, step: 1, default: 0 },
    ],
    defaultInstanceParams: { width: 100, dual: 0 },
  },
  {
    id: 'cubicle-workstation',
    projection: 'plan',
    gridFootprint: { w: 2, h: 2 },
    contactShadow: null,
    params: [
      { key: 'openness', min: 0, max: 3, step: 1, default: 0 },
      { key: 'clutter', min: 0, max: 2, step: 1, default: 1 },
    ],
    defaultInstanceParams: { openness: 0, clutter: 1 },
  },
  {
    id: 'reception-desk',
    projection: 'plan',
    gridFootprint: { w: 2, h: 2 },
    contactShadow: null,
    params: [
      { key: 'width', min: 72, max: 104, step: 4, default: 88 },
    ],
    defaultInstanceParams: { width: 88 },
  },
  {
    id: 'conference-table',
    projection: 'plan',
    gridFootprint: { w: 3, h: 2 },
    contactShadow: null,
    params: [
      { key: 'width', min: 84, max: 120, step: 4, default: 110 },
      { key: 'chairs', min: 0, max: 8, step: 1, default: 6 },
    ],
    defaultInstanceParams: { width: 110, chairs: 6 },
  },
  {
    id: 'supply-cabinet',
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    contactShadow: { cx: 64, cy: 117, rx: 22, ry: 4.5 },
    params: [
      { key: 'height', min: 60, max: 84, step: 2, default: 72 },
    ],
    defaultInstanceParams: { height: 72 },
  },
  {
    id: 'desk-lamp',
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    contactShadow: { cx: 64, cy: 117, rx: 9, ry: 3 },
    params: [
      { key: 'size', min: 26, max: 40, step: 2, default: 32 },
    ],
    defaultInstanceParams: { size: 32 },
  },
  {
    id: 'desk-clutter',
    projection: 'plan',
    gridFootprint: { w: 1, h: 1 },
    contactShadow: null,
    params: [
      { key: 'papers', min: 1, max: 4, step: 1, default: 3 },
      { key: 'phone', min: 0, max: 1, step: 1, default: 1 },
    ],
    defaultInstanceParams: { papers: 3, phone: 1 },
  },
] as const;

const PROTECTED_SURFACES = [
  'CONTRACT.md',
  'src/core/exporter.ts',
  'src/core/layout.ts',
  'src/core/types.ts',
  'src/data/defaults.ts',
  'src/props/templates.ts',
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
  size = 15,
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
  size = 13,
  weight = 560,
  color = MUTED,
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
      text(x, y + index * lineHeight, lineValue, size, weight, color))
    .join('');
}

function panel(
  x: number,
  y: number,
  width: number,
  height: number,
  fill = PANEL,
  radius = 14,
): string {
  return (
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" ` +
    `rx="${radius}" fill="${fill}" stroke="${RULE}" stroke-width="1.5"/>`
  );
}

function roundedRect(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  outline = false,
  strokeWidth = 3,
): string {
  return (
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" ` +
    `rx="${radius}" fill="${fill}" ` +
    (outline
      ? `stroke="${INK}" stroke-width="${strokeWidth}" stroke-linejoin="round"`
      : 'stroke="none"') +
    '/>'
  );
}

function ellipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fill: string,
  outline = false,
): string {
  return (
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ` +
    (outline ? `stroke="${INK}" stroke-width="3"` : 'stroke="none"') +
    '/>'
  );
}

function circle(
  cx: number,
  cy: number,
  radius: number,
  fill: string,
  outline = false,
  strokeWidth = 3,
): string {
  return (
    `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${fill}" ` +
    (outline
      ? `stroke="${INK}" stroke-width="${strokeWidth}"`
      : 'stroke="none"') +
    '/>'
  );
}

function pathShape(
  d: string,
  fill: string,
  outline = false,
  stroke = INK,
  strokeWidth = 3,
): string {
  return (
    `<path d="${d}" fill="${fill}" ` +
    (outline
      ? `stroke="${stroke}" stroke-width="${strokeWidth}" ` +
        'stroke-linecap="round" stroke-linejoin="round"'
      : 'stroke="none"') +
    '/>'
  );
}

function strokePath(
  d: string,
  stroke: string,
  strokeWidth = 3,
  opacity = 1,
): string {
  return (
    `<path d="${d}" fill="none" stroke="${stroke}" ` +
    `stroke-width="${strokeWidth}" opacity="${opacity}" ` +
    'stroke-linecap="round" stroke-linejoin="round"/>'
  );
}

function proposalShell(markup: string): string {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" ' +
    `width="${AUTHORING_CANVAS}" height="${AUTHORING_CANVAS}">` +
    markup +
    '</svg>'
  );
}

function proposalStandingDesk(
  params: Readonly<Record<string, number>>,
): string {
  const width = params.width ?? 100;
  const x = 64 - width / 2;
  const dual = (params.dual ?? 0) >= 1;
  const monitorMarkup = dual
    ? (
      roundedRect(39, 41, 22, 9, 3, Q.charcoal, true, 2) +
      roundedRect(67, 41, 22, 9, 3, Q.charcoal, true, 2)
    )
    : roundedRect(48, 41, 32, 10, 3, Q.charcoal, true, 2);
  return (
    roundedRect(x, 32, width, 62, 13, Q.cream, true) +
    roundedRect(x + 6, 38, width - 12, 14, 7, Q.green) +
    roundedRect(x + 7, 54, width - 14, 32, 7, Q.olive) +
    strokePath(
      `M ${x + 13} 78 H ${x + width - 13}`,
      Q.creamShade,
      2,
      0.75,
    ) +
    monitorMarkup +
    roundedRect(58, 50, 12, 5, 2, Q.recess) +
    roundedRect(48, 66, 32, 10, 3, Q.paper) +
    strokePath('M 52 70 H 76', Q.metal, 1.5) +
    roundedRect(x + width - 11, 61, 13, 21, 6, Q.coral, true, 2) +
    circle(x + width - 4.5, 67, 2.2, Q.paper) +
    strokePath(
      `M ${x + width - 7.5} 76 l 3 -3 l 3 3`,
      Q.paper,
      1.4,
    ) +
    circle(x + 13, 45, 4.5, Q.rust, true, 2) +
    circle(x + 13, 45, 2, Q.paper)
  );
}

function proposalCubicle(
  params: Readonly<Record<string, number>>,
): string {
  const openness = Math.max(0, Math.min(3, params.openness ?? 0));
  const clutter = Math.max(0, Math.min(2, params.clutter ?? 1));
  const rotation = openness * 90;
  const papers = clutter >= 1
    ? roundedRect(41, 57, 23, 9, 2, Q.paper)
    : '';
  const mug = clutter >= 2
    ? circle(78, 60, 4.2, Q.coral, true, 1.8)
    : '';
  const body =
    pathShape(
      'M 23 14 H 105 Q 113 14 113 22 V 108 H 96 V 35 H 32 V 108 H 15 V 22 Q 15 14 23 14 Z',
      Q.cream,
      true,
    ) +
    roundedRect(26, 20, 76, 9, 4, Q.green) +
    roundedRect(20, 28, 8, 67, 4, Q.greenLight) +
    roundedRect(100, 28, 8, 67, 4, Q.greenLight) +
    roundedRect(36, 35, 56, 36, 8, Q.olive, true, 2.5) +
    roundedRect(48, 40, 32, 9, 3, Q.charcoal, true, 2) +
    roundedRect(59, 48, 10, 5, 2, Q.recess) +
    papers +
    mug +
    pathShape(
      'M 49 89 Q 49 80 58 78 H 70 Q 79 80 79 89 V 99 Q 76 106 64 108 Q 52 106 49 99 Z',
      Q.cream,
      true,
    ) +
    roundedRect(55, 84, 18, 15, 6, Q.green) +
    roundedRect(59, 102, 10, 5, 2, Q.coral);
  return (
    `<g transform="rotate(${rotation} 64 64)">` +
    body +
    '</g>'
  );
}

function proposalReception(
  params: Readonly<Record<string, number>>,
): string {
  const width = params.width ?? 88;
  const x = 64 - width / 2;
  const right = x + width;
  return (
    pathShape(
      `M ${x + 8} 20 H ${right - 8} Q ${right} 20 ${right} 28 ` +
      `V 49 H ${x + 34} V 105 Q ${x + 34} 111 ${x + 28} 111 ` +
      `H ${x + 8} Q ${x} 111 ${x} 103 V 28 Q ${x} 20 ${x + 8} 20 Z`,
      Q.cream,
      true,
    ) +
    roundedRect(x + 7, 27, width - 14, 15, 7, Q.green) +
    roundedRect(x + 7, 48, 20, 52, 7, Q.greenLight) +
    roundedRect(x + 12, 56, 10, 30, 4, Q.olive) +
    roundedRect(x + 12, 65, 12, 22, 3, Q.charcoal, true, 2) +
    roundedRect(x + 16, 60, 4, 6, 2, Q.recess) +
    circle(right - 17, 34, 5, Q.coral, true, 2) +
    circle(right - 17, 31, 2.1, Q.paper) +
    roundedRect(x + 35, 43, width - 42, 8, 4, Q.creamShade) +
    strokePath(`M ${x + 42} 47 H ${right - 14}`, Q.olive, 2) +
    roundedRect(x - 2, 83, 9, 16, 4, Q.coral, true, 2)
  );
}

function conferenceChair(cx: number, cy: number, away: 1 | -1): string {
  const top = away < 0 ? cy - 7 : cy - 2;
  return (
    pathShape(
      `M ${cx - 9} ${top + 3} Q ${cx - 9} ${top - 3} ${cx - 3} ${top - 5} ` +
      `H ${cx + 3} Q ${cx + 9} ${top - 3} ${cx + 9} ${top + 3} ` +
      `V ${top + 12} Q ${cx} ${top + 18} ${cx - 9} ${top + 12} Z`,
      Q.cream,
      true,
      INK,
      2,
    ) +
    roundedRect(cx - 5, top + 4, 10, 8, 3, Q.green)
  );
}

function proposalConference(
  params: Readonly<Record<string, number>>,
): string {
  const width = params.width ?? 110;
  const x = 64 - width / 2;
  const chairs = Math.max(0, Math.min(8, params.chairs ?? 6));
  const topCount = Math.ceil(chairs / 2);
  const bottomCount = chairs - topCount;
  let chairMarkup = '';
  for (let index = 0; index < topCount; index += 1) {
    chairMarkup += conferenceChair(
      x + ((index + 1) * width) / (topCount + 1),
      34,
      -1,
    );
  }
  for (let index = 0; index < bottomCount; index += 1) {
    chairMarkup += conferenceChair(
      x + ((index + 1) * width) / (bottomCount + 1),
      91,
      1,
    );
  }
  return (
    chairMarkup +
    roundedRect(x, 37, width, 54, 25, Q.cream, true) +
    roundedRect(x + 8, 45, width - 16, 38, 18, Q.olive) +
    roundedRect(54, 42, 20, 44, 10, Q.green, true, 2) +
    roundedRect(58, 52, 12, 10, 5, Q.recess) +
    circle(64, 57, 2.4, Q.coral) +
    roundedRect(58, 68, 12, 8, 4, Q.creamLight) +
    strokePath(`M ${x + 17} 63 H 49 M 79 63 H ${x + width - 17}`, Q.creamShade, 2)
  );
}

function proposalSupplyCabinet(
  params: Readonly<Record<string, number>>,
): string {
  const height = params.height ?? 72;
  const top = 116 - height;
  const x = 37;
  const width = 54;
  const bayHeight = Math.max(19, Math.round(height * 0.33));
  const doorsTop = top + bayHeight + 12;
  const doorsHeight = 112 - doorsTop;
  return (
    ellipse(64, 117, 25, 4.5, '#00000024') +
    roundedRect(x, top, width, height, 10, Q.cream, true) +
    roundedRect(x + 7, top + 7, width - 14, bayHeight, 6, Q.green, true, 2) +
    roundedRect(x + 11, top + 12, 13, 7, 2, Q.paper) +
    roundedRect(x + 26, top + 11, 9, 8, 2, Q.coral) +
    roundedRect(x + 37, top + 9, 6, 10, 2, Q.blueGlass) +
    roundedRect(x + 7, doorsTop, 18, doorsHeight, 5, Q.greenLight, true, 2) +
    roundedRect(x + 29, doorsTop, 18, doorsHeight, 5, Q.greenLight, true, 2) +
    roundedRect(x + 11, doorsTop + 7, 10, 5, 2, Q.creamLight) +
    roundedRect(x + 33, doorsTop + 7, 10, 5, 2, Q.creamLight) +
    roundedRect(60, doorsTop + doorsHeight / 2 - 4, 3, 9, 1.5, Q.coral) +
    roundedRect(65, doorsTop + doorsHeight / 2 - 4, 3, 9, 1.5, Q.coral) +
    roundedRect(x + 5, 110, width - 10, 7, 3, Q.recess, true, 2)
  );
}

function proposalDeskLamp(
  params: Readonly<Record<string, number>>,
): string {
  const size = params.size ?? 32;
  const hoodY = 112 - size;
  return (
    ellipse(64, 117, 17, 3.5, '#00000020') +
    roundedRect(48, 108, 32, 8, 4, Q.green, true, 2.5) +
    roundedRect(53, 103, 22, 7, 3, Q.creamShade, true, 2) +
    strokePath(
      `M 64 104 V ${hoodY + 10} Q 64 ${hoodY + 4} 58 ${hoodY + 4}`,
      Q.green,
      5,
    ) +
    pathShape(
      `M 43 ${hoodY + 8} Q 43 ${hoodY} 51 ${hoodY - 5} ` +
      `Q 64 ${hoodY - 12} 77 ${hoodY - 5} Q 85 ${hoodY} 85 ${hoodY + 8} Z`,
      Q.cream,
      true,
    ) +
    strokePath(`M 49 ${hoodY + 5} H 79`, Q.olive, 3) +
    ellipse(64, hoodY + 9, 13, 3, '#FFE7A0') +
    circle(74, 112, 3.5, Q.coral, true, 1.7) +
    circle(74, 112, 1.2, Q.paper)
  );
}

function proposalDeskClutter(
  params: Readonly<Record<string, number>>,
): string {
  const papers = Math.max(1, Math.min(4, params.papers ?? 3));
  const hasPhone = (params.phone ?? 1) >= 1;
  const paperPositions = [
    [34, 43],
    [40, 50],
    [46, 57],
    [39, 64],
  ] as const;
  let paperMarkup = '';
  for (let index = 0; index < papers; index += 1) {
    const [x, y] = paperPositions[index];
    paperMarkup +=
      roundedRect(x, y, 30, 17, 3, Q.paper, true, 1.7) +
      strokePath(`M ${x + 5} ${y + 6} H ${x + 24} M ${x + 5} ${y + 11} H ${x + 19}`, Q.metal, 1.2);
  }
  const phone = hasPhone
    ? (
      roundedRect(73, 47, 25, 28, 7, Q.green, true, 2.5) +
      pathShape(
        'M 77 52 Q 84 46 94 52 L 91 58 Q 84 55 79 59 Z',
        Q.cream,
        true,
        INK,
        1.7,
      ) +
      circle(79, 68, 2, Q.coral)
    )
    : '';
  return (
    roundedRect(21, 33, 86, 59, 13, Q.cream, true) +
    roundedRect(27, 39, 74, 47, 9, Q.olive) +
    roundedRect(29, 41, 39, 39, 7, Q.green) +
    paperMarkup +
    phone +
    circle(94, 82, 7, Q.coral, true, 2) +
    circle(94, 82, 3, Q.recess) +
    roundedRect(26, 81, 51, 6, 3, Q.creamShade)
  );
}

export function proposalWorkstationPropSvg(
  id: WorkstationFamilyPropId,
  params: Readonly<Record<string, number>> = {},
): string {
  let markup: string;
  switch (id) {
    case 'standing-desk':
      markup = proposalStandingDesk(params);
      break;
    case 'cubicle-workstation':
      markup = proposalCubicle(params);
      break;
    case 'reception-desk':
      markup = proposalReception(params);
      break;
    case 'conference-table':
      markup = proposalConference(params);
      break;
    case 'supply-cabinet':
      markup = proposalSupplyCabinet(params);
      break;
    case 'desk-lamp':
      markup = proposalDeskLamp(params);
      break;
    case 'desk-clutter':
      markup = proposalDeskClutter(params);
      break;
  }
  return proposalShell(markup);
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
    .replace(
      /width="[^"]+" height="[^"]+"/,
      `width="${width}" height="${height}"`,
    );
}

function gameplayArtScale(id: string): number {
  return (
    WORKSTATION_GAMEPLAY_ART_SCALES[
      id as keyof typeof WORKSTATION_GAMEPLAY_ART_SCALES
    ] ?? 1
  );
}

function withGameplayArtEnvelope(
  source: string,
  id: string,
  projection: 'plan' | 'elevation',
): string {
  const scale = gameplayArtScale(id);
  if (scale === 1) return source;
  const pivotY = projection === 'plan' ? 64 : 116;
  return proposalShell(
    `<g transform="translate(64 ${pivotY}) scale(${scale}) ` +
    `translate(-64 -${pivotY})">${stripSvgShell(source)}</g>`,
  );
}

class WorkstationRenderer {
  private readonly style: StyleSheet;
  private readonly wall: TileInstance;
  private readonly props: readonly PropInstance[];
  private readonly currentCache = new Map<string, string>();
  private readonly wallCache = new Map<string, string>();
  private readonly characterCache = new Map<string, string>();

  constructor() {
    const project = defaultProject();
    const wall = project.walls.find(({ id }) => id === 'wall-office');
    if (!wall) throw new Error('Default project is missing wall-office');
    this.wall = wall;
    this.props = project.props;
    this.style = {
      ...structuredClone(DEFAULT_STYLE),
      render: {
        ...DEFAULT_STYLE.render,
        contactShadow: 0.12,
      },
    };
  }

  template(id: string): PropTemplate {
    const template = PROP_TEMPLATES.find((candidate) => candidate.id === id);
    if (!template) throw new Error(`Missing prop template ${id}`);
    return template;
  }

  current(id: string): string {
    let source = this.currentCache.get(id);
    if (!source) {
      const instance = this.props.find(({ templateId }) => templateId === id);
      if (!instance) throw new Error(`Default project is missing prop ${id}`);
      source = composeProp(instance, this.style, AUTHORING_CANVAS);
      this.currentCache.set(id, source);
    }
    return source;
  }

  proposal(id: WorkstationFamilyPropId): string {
    const contract = EXPECTED_WORKSTATION_FAMILY_CONTRACTS.find(
      (candidate) => candidate.id === id,
    );
    if (!contract) throw new Error(`Missing proposal contract ${id}`);
    return proposalWorkstationPropSvg(id, contract.defaultInstanceParams);
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
    return (
      `<svg x="${x}" y="${y}" width="${size}" height="${size}" ` +
      'viewBox="0 0 128 128" preserveAspectRatio="none" overflow="hidden">' +
      markup +
      '</svg>'
    );
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
    `<rect x="${x}" y="${y}" width="${columns * cell}" ` +
    `height="${rows * cell}" fill="${FLOOR}" stroke="#56616A" stroke-width="2"/>`,
  );
  for (let column = 1; column < columns; column += 1) {
    parts.push(
      strokePath(
        `M ${x + column * cell} ${y} V ${y + rows * cell}`,
        FLOOR_LINE,
        1,
        0.16,
      ),
    );
  }
  for (let row = 1; row < rows; row += 1) {
    parts.push(
      strokePath(
        `M ${x} ${y + row * cell} H ${x + columns * cell}`,
        FLOOR_LINE,
        1,
        0.16,
      ),
    );
  }
}

function drawWalls(
  parts: string[],
  renderer: WorkstationRenderer,
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
        renderer.wallTile(
          5,
          x + (columns - 1) * cell,
          y + row * cell,
          cell,
          true,
        ),
      );
    }
    return;
  }
  parts.push(renderer.wallTile(3, x, y + (rows - 1) * cell, cell));
  for (let column = 1; column < columns - 1; column += 1) {
    parts.push(renderer.wallTile(10, x + column * cell, y + (rows - 1) * cell, cell));
  }
  parts.push(
    renderer.wallTile(9, x + (columns - 1) * cell, y + (rows - 1) * cell, cell),
  );
}

function propPlacement(
  renderer: WorkstationRenderer,
  kind: 'current' | 'proposal',
  id: string,
  footprintX: number,
  footprintY: number,
  cell: number,
  occupancy = true,
): string {
  const template = renderer.template(id);
  const unscaledSource = kind === 'proposal'
    ? renderer.proposal(id as WorkstationFamilyPropId)
    : renderer.current(id);
  // Proposal markup still needs the accepted review envelope. Production
  // artwork already carries that envelope in its canonical SVG geometry.
  const source = kind === 'proposal'
    ? withGameplayArtEnvelope(unscaledSource, id, template.projection)
    : unscaledSource;
  const footprintWidth = template.gridFootprint.w * cell;
  const footprintHeight = template.gridFootprint.h * cell;
  const spriteSize = cell * PROP_NATIVE_FRAME_CELLS;
  const x = footprintX + (footprintWidth - spriteSize) / 2;
  const y = template.projection === 'plan'
    ? footprintY + (footprintHeight - spriteSize) / 2
    : footprintY + footprintHeight - spriteSize * (116 / AUTHORING_CANVAS);
  const guide = occupancy
    ? (
      `<rect x="${footprintX + 3}" y="${footprintY + 3}" ` +
      `width="${footprintWidth - 6}" height="${footprintHeight - 6}" ` +
      `rx="5" fill="${OCCUPANCY}" fill-opacity=".08" stroke="${OCCUPANCY}" ` +
      'stroke-width="1.5" stroke-dasharray="6 5"/>'
    )
    : '';
  return guide + placedSvg(source, x, y, spriteSize);
}

interface AgentPlacement {
  readonly recipe: CharacterRecipe;
  readonly facing: Facing | 'west';
  readonly pose?: Pose;
  readonly x: number;
  readonly y: number;
}

function agentPlacement(
  renderer: WorkstationRenderer,
  spec: AgentPlacement,
  roomX: number,
  roomY: number,
  cell: number,
): string {
  const frameSize = cell * CHARACTER_FRAME_CELLS;
  const source = renderer.character(
    spec.recipe,
    spec.facing,
    spec.pose ?? 'neutral',
  );
  const anchorX = roomX + spec.x * cell;
  const anchorY = roomY + spec.y * cell;
  return placedSvg(
    source,
    anchorX - frameSize / 2,
    anchorY - frameSize * 0.86,
    frameSize,
  );
}

type RoomKind = 'workstation' | 'reception' | 'conference';

function roomScene(
  renderer: WorkstationRenderer,
  kind: RoomKind,
  x: number,
  y: number,
  cell: number,
  crowded = false,
  familyArt: 'current' | 'proposal' = 'proposal',
): string {
  const parts: string[] = [];
  const columns = kind === 'reception' ? 7 : 9;
  const rows = 6;
  drawGrid(parts, x, y, columns, rows, cell);
  drawWalls(parts, renderer, x, y, columns, rows, cell, 'back');

  if (kind === 'workstation') {
    parts.push(
      propPlacement(renderer, familyArt, 'standing-desk', x + cell, y + cell, cell),
      propPlacement(renderer, familyArt, 'cubicle-workstation', x + 4 * cell, y + cell, cell),
      propPlacement(renderer, familyArt, 'supply-cabinet', x + 7 * cell, y + cell, cell),
      propPlacement(renderer, 'current', 'desk', x + cell, y + 3 * cell, cell),
      propPlacement(renderer, 'current', 'office-chair', x + 2 * cell, y + 4 * cell, cell),
      propPlacement(renderer, 'current', 'filing-cabinet', x + 7 * cell, y + 3 * cell, cell),
    );
    const agents: AgentPlacement[] = [
      { recipe: DEFAULT_CAST[0], facing: 'south', x: 3.1, y: 4.35 },
      { recipe: DEFAULT_CAST[1], facing: 'west', x: 6.45, y: 3.7 },
      { recipe: DEFAULT_CAST[2], facing: 'east', x: 3.65, y: 2.8 },
    ];
    if (crowded) {
      agents.push(
        { recipe: DEFAULT_CAST[3], facing: 'north', x: 5.8, y: 4.55 },
        { recipe: DEFAULT_CAST[0], facing: 'west', pose: 'walk-approach', x: 7.2, y: 4.6 },
      );
    }
    for (const agent of agents) {
      parts.push(agentPlacement(renderer, agent, x, y, cell));
    }
  } else if (kind === 'reception') {
    parts.push(
      propPlacement(renderer, familyArt, 'reception-desk', x + 2 * cell, y + cell, cell),
      propPlacement(renderer, 'current', 'office-chair', x + 3 * cell, y + 3 * cell, cell),
      propPlacement(renderer, 'current', 'filing-cabinet', x + 5 * cell, y + cell, cell),
    );
    const agents: AgentPlacement[] = [
      { recipe: DEFAULT_CAST[1], facing: 'south', x: 3.5, y: 2.65 },
      { recipe: DEFAULT_CAST[0], facing: 'north', x: 3.8, y: 4.5 },
    ];
    if (crowded) {
      agents.push(
        { recipe: DEFAULT_CAST[2], facing: 'east', x: 1.75, y: 4.45 },
        { recipe: DEFAULT_CAST[3], facing: 'west', x: 5.55, y: 4.35 },
      );
    }
    for (const agent of agents) {
      parts.push(agentPlacement(renderer, agent, x, y, cell));
    }
  } else {
    parts.push(
      propPlacement(renderer, familyArt, 'conference-table', x + 3 * cell, y + 1.5 * cell, cell),
      propPlacement(renderer, 'current', 'filing-cabinet', x + 7 * cell, y + cell, cell),
    );
    const agents: AgentPlacement[] = [
      { recipe: DEFAULT_CAST[0], facing: 'south', x: 3.35, y: 2.6 },
      { recipe: DEFAULT_CAST[1], facing: 'south', x: 5.05, y: 2.55 },
      { recipe: DEFAULT_CAST[2], facing: 'north', x: 3.6, y: 4.65 },
      { recipe: DEFAULT_CAST[3], facing: 'north', x: 5.3, y: 4.65 },
    ];
    if (crowded) {
      agents.push(
        { recipe: DEFAULT_CAST[0], facing: 'east', x: 2.0, y: 3.65 },
        { recipe: DEFAULT_CAST[1], facing: 'west', x: 7.0, y: 3.7 },
      );
    }
    for (const agent of agents) {
      parts.push(agentPlacement(renderer, agent, x, y, cell));
    }
  }

  drawWalls(parts, renderer, x, y, columns, rows, cell, 'front');
  return parts.join('');
}

function closeComparison(
  renderer: WorkstationRenderer,
  decision: FamilyDecision,
  x: number,
  y: number,
  width: number,
): string {
  const cellSize = 142;
  const leftX = x + 16;
  const rightX = x + width - 16 - cellSize;
  return (
    panel(x, y, width, 394) +
    text(x + 16, y + 27, decision.category.toUpperCase(), 10, 760, Q.green) +
    text(x + 16, y + 51, decision.label, 17, 820, INK) +
    roundedRect(leftX, y + 68, cellSize, cellSize, 10, PANEL_ALT) +
    roundedRect(rightX, y + 68, cellSize, cellSize, 10, PANEL_ALT) +
    placedSvg(renderer.current(decision.id), leftX + 7, y + 75, cellSize - 14) +
    placedSvg(renderer.proposal(decision.id), rightX + 7, y + 75, cellSize - 14) +
    text(leftX + cellSize / 2, y + 228, 'CURRENT', 10, 720, MUTED, 'middle') +
    text(rightX + cellSize / 2, y + 228, 'WORKHORSE SYSTEM', 10, 760, Q.coral, 'middle') +
    wrappedText(x + 16, y + 265, decision.designRead, 44, 18, 12, 630, MUTED) +
    text(
      x + 16,
      y + 348,
      gameplayArtScale(decision.id) === 1
        ? '128u source · 2-cell frame'
        : `128u source · ${(PROP_NATIVE_FRAME_CELLS * gameplayArtScale(decision.id)).toFixed(2)}-cell art`,
      10,
      650,
      MUTED,
    ) +
    text(x + width - 16, y + 348, 'contract unchanged', 10, 720, Q.green, 'end')
  );
}

function normalRoomCard(
  renderer: WorkstationRenderer,
  kind: RoomKind,
  x: number,
  y: number,
  width: number,
  label: string,
  note: string,
  familyArt: 'current' | 'proposal' = 'proposal',
): string {
  const columns = kind === 'reception' ? 7 : 9;
  const roomWidth = columns * NORMAL_CELL;
  const roomX = x + (width - roomWidth) / 2;
  const roomY = y + 82;
  return (
    panel(x, y, width, 568, kind === 'reception' ? PANEL_ALT : PANEL) +
    text(x + 18, y + 30, label, 18, 820, Q.green) +
    text(x + width - 18, y + 30, '74 px / cell', 10, 760, Q.coral, 'end') +
    text(x + 18, y + 54, note, 11, 610, MUTED) +
    roomScene(renderer, kind, roomX, roomY, NORMAL_CELL, false, familyArt) +
    text(x + 18, y + 542, 'Dashed = occupancy · fixed 2-cell source frame', 10, 650, MUTED) +
    text(x + width - 18, y + 542, 'characters = production ×0.65', 10, 650, MUTED, 'end')
  );
}

function deskOcclusionStress(
  renderer: WorkstationRenderer,
  x: number,
  y: number,
  width: number,
  familyArt: 'current' | 'proposal' = 'proposal',
): string {
  const parts: string[] = [];
  const cell = 86;
  const roomX = x + 22;
  const roomY = y + 70;
  drawGrid(parts, roomX, roomY, 5, 4, cell);
  drawWalls(parts, renderer, roomX, roomY, 5, 4, cell, 'back');
  parts.push(
    propPlacement(renderer, familyArt, 'standing-desk', roomX + 1.5 * cell, roomY + cell, cell),
    agentPlacement(
      renderer,
      { recipe: DEFAULT_CAST[0], facing: 'south', x: 2.95, y: 2.72 },
      roomX,
      roomY,
      cell,
    ),
    propPlacement(renderer, familyArt, 'desk-lamp', roomX + 0.35 * cell, roomY + 2.15 * cell, cell, false),
    propPlacement(renderer, familyArt, 'desk-clutter', roomX + 3.65 * cell, roomY + 2.05 * cell, cell, false),
  );
  drawWalls(parts, renderer, roomX, roomY, 5, 4, cell, 'front');
  return (
    panel(x, y, width, 496) +
    text(x + 18, y + 30, 'DESK OCCLUSION + INTERACTION', 17, 820, Q.green) +
    text(x + 18, y + 53, 'Plan-layer desk stays behind the approaching character; accessories remain literal.', 11, 610, MUTED) +
    parts.join('') +
    text(x + 18, y + 474, 'Review target: face and approach stay clear; no accessory is silently miniaturized.', 10, 650, MUTED)
  );
}

function crowdStress(
  renderer: WorkstationRenderer,
  kind: RoomKind,
  x: number,
  y: number,
  width: number,
  label: string,
  familyArt: 'current' | 'proposal' = 'proposal',
): string {
  const cell = kind === 'reception' ? 60 : 55;
  const columns = kind === 'reception' ? 7 : 9;
  const roomWidth = columns * cell;
  const roomX = x + (width - roomWidth) / 2;
  const roomY = y + 67;
  return (
    panel(x, y, width, 496, PANEL_ALT) +
    text(x + 18, y + 30, label, 17, 820, Q.green) +
    text(x + width - 18, y + 30, `${cell} px / cell`, 10, 760, Q.coral, 'end') +
    text(x + 18, y + 52, 'Crowd, wall context, and silhouette separation.', 11, 610, MUTED) +
    roomScene(renderer, kind, roomX, roomY, cell, true, familyArt)
  );
}

function farRoomStrip(
  renderer: WorkstationRenderer,
  x: number,
  y: number,
  familyArt: 'current' | 'proposal' = 'proposal',
  statusText =
    'Review-only: no source SVG assets, template wiring, export, schema, or Unity changes.',
): string {
  const roomY = y + 68;
  const workstationX = x + 24;
  const receptionX = workstationX + 9 * FAR_CELL + 34;
  const conferenceX = receptionX + 7 * FAR_CELL + 34;
  return (
    panel(x, y, WIDTH - MARGIN * 2, 350) +
    text(x + 18, y + 30, 'FAR GAMEPLAY ZOOM', 18, 820, Q.green) +
    text(x + 262, y + 30, '40 px / cell · props native 2-cell frame · characters ×0.65', 11, 650, MUTED) +
    roomScene(renderer, 'workstation', workstationX, roomY, FAR_CELL, true, familyArt) +
    roomScene(renderer, 'reception', receptionX, roomY, FAR_CELL, true, familyArt) +
    roomScene(renderer, 'conference', conferenceX, roomY, FAR_CELL, true, familyArt) +
    text(workstationX, y + 330, 'workstation', 10, 700, MUTED) +
    text(receptionX, y + 330, 'reception', 10, 700, MUTED) +
    text(conferenceX, y + 330, 'meeting', 10, 700, MUTED) +
    wrappedText(
      conferenceX + 9 * FAR_CELL + 36,
      roomY + 20,
      'Acceptance question: do all seven objects retain their noun read without detail dependence?',
      41,
      18,
      13,
      700,
      INK,
    ) +
    wrappedText(
      conferenceX + 9 * FAR_CELL + 36,
      roomY + 108,
      'Fixed controls: accepted desk, chair, filing cabinet, completed characters, and 112-unit walls.',
      41,
      18,
      12,
      610,
      MUTED,
    ) +
    wrappedText(
      conferenceX + 9 * FAR_CELL + 36,
      roomY + 190,
      statusText,
      41,
      18,
      12,
      720,
      Q.coral,
    )
  );
}

function calibrationSheet(renderer: WorkstationRenderer): string {
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" ` +
    `width="${WIDTH}" height="${HEIGHT}">`,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAGE}"/>`,
    text(MARGIN, 42, 'QuotaCo workstation ecosystem · cohesive family pass', 25, 860, INK),
    text(
      MARGIN,
      68,
      'One bounded Workhorse System direction; existing production art remains untouched.',
      13,
      620,
      MUTED,
    ),
    text(
      WIDTH - MARGIN,
      42,
      'REVIEW ONLY · STOP BEFORE SVG AUTHORING',
      11,
      820,
      Q.coral,
      'end',
    ),
    text(
      WIDTH - MARGIN,
      65,
      '128 authoring · 112 wall · characters ×0.65 · prop envelopes calibrated',
      11,
      680,
      Q.green,
      'end',
    ),
  ];

  const closeY = 92;
  const closeWidth = (WIDTH - MARGIN * 2 - GAP * 6) / 7;
  WORKSTATION_FAMILY_DECISIONS.forEach((decision, index) => {
    parts.push(
      closeComparison(
        renderer,
        decision,
        MARGIN + index * (closeWidth + GAP),
        closeY,
        closeWidth,
      ),
    );
  });

  const roomsY = closeY + 414;
  const roomWidth = (WIDTH - MARGIN * 2 - GAP * 2) / 3;
  parts.push(
    normalRoomCard(
      renderer,
      'workstation',
      MARGIN,
      roomsY,
      roomWidth,
      'WORKSTATION ROOM',
      'Accepted controls beside standing desk, cubicle, and supply storage.',
    ),
    normalRoomCard(
      renderer,
      'reception',
      MARGIN + roomWidth + GAP,
      roomsY,
      roomWidth,
      'RECEPTION / ADMIN',
      'Public counter reads before the monitor, bell, or personalization.',
    ),
    normalRoomCard(
      renderer,
      'conference',
      MARGIN + (roomWidth + GAP) * 2,
      roomsY,
      roomWidth,
      'MEETING ROOM',
      'Native two-cell prop frame sits inside the preserved 3×2 clearance footprint.',
    ),
  );

  const stressY = roomsY + 588;
  const stressWidth = (WIDTH - MARGIN * 2 - GAP * 2) / 3;
  parts.push(
    deskOcclusionStress(renderer, MARGIN, stressY, stressWidth),
    crowdStress(
      renderer,
      'workstation',
      MARGIN + stressWidth + GAP,
      stressY,
      stressWidth,
      'CROWDED WORKSTATION',
    ),
    crowdStress(
      renderer,
      'conference',
      MARGIN + (stressWidth + GAP) * 2,
      stressY,
      stressWidth,
      'CROWDED MEETING',
    ),
  );

  parts.push(farRoomStrip(renderer, MARGIN, stressY + 516));
  parts.push(
    text(
      MARGIN,
      HEIGHT - 24,
      'Approval gate: silhouette, noun read, family cohesion, interaction surface, scale, occlusion.',
      11,
      680,
      MUTED,
    ),
    text(
      WIDTH - MARGIN,
      HEIGHT - 24,
      'No production promotion in this slice.',
      11,
      780,
      Q.coral,
      'end',
    ),
    '</svg>',
  );
  return parts.join('');
}

type WorkstationSourceMap = ReadonlyMap<WorkstationFamilyPropId, string>;

function productionCloseComparison(
  renderer: WorkstationRenderer,
  sources: WorkstationSourceMap,
  decision: FamilyDecision,
  x: number,
  y: number,
  width: number,
): string {
  const cellSize = 142;
  const leftX = x + 16;
  const rightX = x + width - 16 - cellSize;
  const canonicalSource = sources.get(decision.id);
  if (!canonicalSource) throw new Error(`Missing canonical SVG ${decision.id}`);
  return (
    panel(x, y, width, 394) +
    text(x + 16, y + 27, decision.category.toUpperCase(), 10, 760, Q.green) +
    text(x + 16, y + 51, decision.label, 17, 820, INK) +
    roundedRect(leftX, y + 68, cellSize, cellSize, 10, PANEL_ALT) +
    roundedRect(rightX, y + 68, cellSize, cellSize, 10, PANEL_ALT) +
    placedSvg(canonicalSource, leftX + 7, y + 75, cellSize - 14) +
    placedSvg(renderer.current(decision.id), rightX + 7, y + 75, cellSize - 14) +
    text(leftX + cellSize / 2, y + 228, 'CANONICAL SVG', 10, 720, MUTED, 'middle') +
    text(rightX + cellSize / 2, y + 228, 'IMPORTED OUTPUT', 10, 760, Q.coral, 'middle') +
    wrappedText(x + 16, y + 265, decision.designRead, 44, 18, 12, 630, MUTED) +
    text(
      x + 16,
      y + 348,
      gameplayArtScale(decision.id) === 1
        ? '128u source · native 2-cell frame'
        : `128u source · ${(PROP_NATIVE_FRAME_CELLS * gameplayArtScale(decision.id)).toFixed(2)}-cell art`,
      10,
      650,
      MUTED,
    ) +
    text(x + width - 16, y + 348, 'source-provenanced', 10, 720, Q.green, 'end')
  );
}

function productionValidationSheet(
  renderer: WorkstationRenderer,
  sources: WorkstationSourceMap,
): string {
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" ` +
    `width="${WIDTH}" height="${HEIGHT}">`,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAGE}"/>`,
    text(MARGIN, 42, 'QuotaCo workstation ecosystem · imported-art validation', 25, 860, INK),
    text(
      MARGIN,
      68,
      'Canonical artist-editable SVGs beside their deterministic compositor output.',
      13,
      620,
      MUTED,
    ),
    text(
      WIDTH - MARGIN,
      42,
      'PRODUCTION WIRED · AWAITING VISUAL APPROVAL',
      11,
      820,
      Q.coral,
      'end',
    ),
    text(
      WIDTH - MARGIN,
      65,
      '128 authoring · 112 wall · characters ×0.65 · props use independent envelopes',
      11,
      680,
      Q.green,
      'end',
    ),
  ];

  const closeY = 92;
  const closeWidth = (WIDTH - MARGIN * 2 - GAP * 6) / 7;
  WORKSTATION_FAMILY_DECISIONS.forEach((decision, index) => {
    parts.push(
      productionCloseComparison(
        renderer,
        sources,
        decision,
        MARGIN + index * (closeWidth + GAP),
        closeY,
        closeWidth,
      ),
    );
  });

  const roomsY = closeY + 414;
  const roomWidth = (WIDTH - MARGIN * 2 - GAP * 2) / 3;
  parts.push(
    normalRoomCard(
      renderer,
      'workstation',
      MARGIN,
      roomsY,
      roomWidth,
      'WORKSTATION ROOM',
      'Imported standing desk, cubicle, and supply storage beside accepted controls.',
      'current',
    ),
    normalRoomCard(
      renderer,
      'reception',
      MARGIN + roomWidth + GAP,
      roomsY,
      roomWidth,
      'RECEPTION / ADMIN',
      'Imported public counter with accepted chair and filing controls.',
      'current',
    ),
    normalRoomCard(
      renderer,
      'conference',
      MARGIN + (roomWidth + GAP) * 2,
      roomsY,
      roomWidth,
      'MEETING ROOM',
      'Imported table remains inside the preserved 3×2 clearance footprint.',
      'current',
    ),
  );

  const stressY = roomsY + 588;
  const stressWidth = (WIDTH - MARGIN * 2 - GAP * 2) / 3;
  parts.push(
    deskOcclusionStress(renderer, MARGIN, stressY, stressWidth, 'current'),
    crowdStress(
      renderer,
      'workstation',
      MARGIN + stressWidth + GAP,
      stressY,
      stressWidth,
      'CROWDED WORKSTATION',
      'current',
    ),
    crowdStress(
      renderer,
      'conference',
      MARGIN + (stressWidth + GAP) * 2,
      stressY,
      stressWidth,
      'CROWDED MEETING',
      'current',
    ),
  );

  parts.push(
    farRoomStrip(
      renderer,
      MARGIN,
      stressY + 516,
      'current',
      'Production SVGs and template wiring are present. Export contract, schema, and Unity integration remain unchanged.',
    ),
    text(
      MARGIN,
      HEIGHT - 24,
      'Approval gate: canonical source fidelity, noun read, scale, occlusion, interaction, and family cohesion.',
      11,
      680,
      MUTED,
    ),
    text(
      WIDTH - MARGIN,
      HEIGHT - 24,
      'No Unity import and no commit.',
      11,
      780,
      Q.coral,
      'end',
    ),
    '</svg>',
  );
  return parts.join('');
}

function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function validateWorkstationFamilyContracts(): {
  readonly pass: boolean;
  readonly errors: readonly string[];
  readonly contracts: readonly ContractSnapshot[];
} {
  const project = defaultProject();
  const errors: string[] = [];
  const contracts: ContractSnapshot[] = [];
  for (const expected of EXPECTED_WORKSTATION_FAMILY_CONTRACTS) {
    const template = PROP_TEMPLATES.find(({ id }) => id === expected.id);
    const instance = project.props.find(({ templateId }) => templateId === expected.id);
    if (!template) {
      errors.push(`missing template ${expected.id}`);
      continue;
    }
    if (!instance) {
      errors.push(`missing default instance ${expected.id}`);
      continue;
    }
    const actual: ContractSnapshot = {
      id: expected.id,
      projection: template.projection,
      gridFootprint: { ...template.gridFootprint },
      contactShadow: template.footprint ? { ...template.footprint } : null,
      params: template.params.map(({ key, min, max, step, default: defaultValue }) => ({
        key,
        min,
        max,
        step,
        default: defaultValue,
      })),
      defaultInstanceParams: { ...instance.params },
    };
    contracts.push(actual);
    if (!sameJson(actual, expected)) {
      errors.push(`contract drift for ${expected.id}`);
    }
  }
  return {
    pass: errors.length === 0,
    errors,
    contracts,
  };
}

interface RasterStats {
  readonly width: number;
  readonly height: number;
  readonly visiblePixels: number;
  readonly bounds: {
    readonly minX: number;
    readonly minY: number;
    readonly maxX: number;
    readonly maxY: number;
  } | null;
}

function rasterStats(svg: string, size: number): RasterStats {
  const png = PNG.sync.read(
    new Resvg(svg, {
      fitTo: { mode: 'width', value: size },
    }).render().asPng(),
  );
  let visiblePixels = 0;
  let minX = png.width;
  let minY = png.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const alpha = png.data[(y * png.width + x) * 4 + 3];
      if (alpha > 12) {
        visiblePixels += 1;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  return {
    width: png.width,
    height: png.height,
    visiblePixels,
    bounds: visiblePixels > 0 ? { minX, minY, maxX, maxY } : null,
  };
}

async function fileHash(file: string): Promise<string> {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}

async function metrics(renderer: WorkstationRenderer): Promise<unknown> {
  const validation = validateWorkstationFamilyContracts();
  const protectedSurfaceHashes = Object.fromEntries(
    await Promise.all(
      PROTECTED_SURFACES.map(async (file) => [file, await fileHash(file)] as const),
    ),
  );
  const sourceAssetPresence = Object.fromEntries(
    await Promise.all(
      WORKSTATION_FAMILY_PROP_IDS.map(async (id) => {
        const file = path.join('assets', 'props', 'quota-co-workhorse-v1', `${id}.svg`);
        try {
          await readFile(file);
          return [id, true] as const;
        } catch {
          return [id, false] as const;
        }
      }),
    ),
  );
  return {
    reviewStatus: 'visual-calibration-only',
    productionPromotion: false,
    sourceSvgAuthoring: false,
    unityImport: false,
    exportChanged: false,
    schemaChanged: false,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    invariants: {
      authoringCanvas: AUTHORING_CANVAS,
      acceptedWallDatum: WALL_DATUM,
      characterVisualScale: CHARACTER_VISUAL_SCALE,
      propNativeFrameCells: PROP_NATIVE_FRAME_CELLS,
      propCharacterMultiplierApplied: false,
      gameplayArtScales: WORKSTATION_GAMEPLAY_ART_SCALES,
    },
    contractValidation: validation,
    sourceAssetPresence,
    supplyCabinetFacilityContractPresent:
      JSON.stringify(facilityCatalogJson()).includes('"supply-cabinet"'),
    protectedSurfaceHashes,
    proposalRasterStats: Object.fromEntries(
      WORKSTATION_FAMILY_PROP_IDS.map((id) => [
        id,
        {
          close: rasterStats(renderer.proposal(id), AUTHORING_CANVAS),
          far: rasterStats(renderer.proposal(id), FAR_CELL),
        },
      ]),
    ),
  };
}

function inventoryMarkdown(): string {
  const rows = EXPECTED_WORKSTATION_FAMILY_CONTRACTS.map((contract) => {
    const params = contract.params
      .map(({ key, min, max, step, default: defaultValue }) =>
        `${key} ${min}..${max} step ${step} default ${defaultValue}`)
      .join('; ');
    const shadow = contract.contactShadow
      ? `${contract.contactShadow.cx},${contract.contactShadow.cy} / ${contract.contactShadow.rx}×${contract.contactShadow.ry}`
      : 'none';
    return (
      `| \`${contract.id}\` | ${contract.projection} | ` +
      `${contract.gridFootprint.w}×${contract.gridFootprint.h} | ${shadow} | ${params} |`
    );
  }).join('\n');
  return `# QuotaCo workstation-family inventory v1

Status: **review-only calibration**. No production art, source SVGs, template
wiring, exports, schema, or Unity registration changed for this family.

Fixed calibration controls:

- \`desk\`
- \`office-chair\`
- \`filing-cabinet\`
- completed production characters at visual scale 0.65
- accepted 112-unit office walls

Scale calibration:

- every 128-unit prop source frame is two gameplay cells at the current Unity
  128 PPU / 0.5 tile-size relationship
- each prop silhouette occupies a noun-specific portion of that frame
- current review envelopes: office chair 0.72, filing cabinet 0.76, supply
  cabinet 0.76, desk lamp 0.58; all others remain 1.0
- props do not inherit the character visual multiplier
- grid occupancy, collision, pivots, and interaction anchors remain independent
  from the visual frame

| Template | Projection | Grid footprint | Contact shadow cx,cy / rx×ry | Parameters |
|---|---:|---:|---:|---|
${rows}

## Shared proposal grammar

- broad cream molded catalog shells
- dark-green service recesses and structural inserts
- olive writing and interaction surfaces
- coral controls, handles, bells, and employee-use tells
- continuous silhouettes before equipment detail
- personalization grouped into a subordinate, editable layer

## Review gate

Review the close comparisons, normal rooms, crowded rooms, wall context, desk
occlusion, character interaction, and far gameplay strip. If the family is
accepted, author seven standalone SVG sources and only then wire them through
the existing prop-source importer. Unity import remains deferred.
`;
}

interface RenderResult {
  readonly svgPath: string;
  readonly pngPath: string;
  readonly metricsPath: string;
  readonly inventoryPath: string;
}

export async function renderQuotaCoWorkstationFamilyCalibration(
  output = path.join('docs', 'previews'),
): Promise<RenderResult> {
  const renderer = new WorkstationRenderer();
  const source = calibrationSheet(renderer);
  const png = new Resvg(source, {
    font: { loadSystemFonts: true },
  }).render().asPng();
  await mkdir(output, { recursive: true });
  const base = 'quota-co-workstation-family-calibration-v1';
  const svgPath = path.join(output, `${base}.svg`);
  const pngPath = path.join(output, `${base}.png`);
  const metricsPath = path.join(output, `${base}-metrics.json`);
  const inventoryPath = path.join(
    output,
    'quota-co-workstation-family-inventory-v1.md',
  );
  await writeFile(svgPath, source, 'utf8');
  await writeFile(pngPath, png);
  await writeFile(
    metricsPath,
    `${JSON.stringify(await metrics(renderer), null, 2)}\n`,
    'utf8',
  );
  await writeFile(inventoryPath, inventoryMarkdown(), 'utf8');
  return { svgPath, pngPath, metricsPath, inventoryPath };
}

async function loadWorkstationSources(): Promise<Map<WorkstationFamilyPropId, string>> {
  const entries = await Promise.all(
    WORKSTATION_FAMILY_PROP_IDS.map(async (id) => [
      id,
      await readFile(
        path.join('assets', 'props', 'quota-co-workhorse-v1', `${id}.svg`),
        'utf8',
      ),
    ] as const),
  );
  return new Map(entries);
}

async function productionMetrics(
  renderer: WorkstationRenderer,
  sources: WorkstationSourceMap,
): Promise<unknown> {
  const validation = validateWorkstationFamilyContracts();
  const sourceProvenance = Object.fromEntries(
    await Promise.all(
      WORKSTATION_FAMILY_PROP_IDS.map(async (id) => {
        const source = sources.get(id);
        if (!source) throw new Error(`Missing canonical SVG ${id}`);
        const sourceSha256 = createHash('sha256').update(source).digest('hex');
        const imported = authoredPropArt(id);
        return [id, {
          sourceFile: path.posix.join(
            'assets',
            'props',
            'quota-co-workhorse-v1',
            `${id}.svg`,
          ),
          sourceSha256,
          importedSourceFile: imported?.sourceFile ?? null,
          importedSourceSha256: imported?.sourceSha256 ?? null,
          hashMatchesImportedArt: imported?.sourceSha256 === sourceSha256,
          projectionMatches:
            imported?.projection === renderer.template(id).projection,
          rasterStats: {
            canonicalSource: {
              close: rasterStats(source, AUTHORING_CANVAS),
              far: rasterStats(source, FAR_CELL),
            },
            importedOutput: {
              close: rasterStats(renderer.current(id), AUTHORING_CANVAS),
              far: rasterStats(renderer.current(id), FAR_CELL),
            },
          },
        }] as const;
      }),
    ),
  );
  const allSourceHashesMatch = Object.values(sourceProvenance).every(
    ({ hashMatchesImportedArt, projectionMatches }) =>
      hashMatchesImportedArt && projectionMatches,
  );
  const protectedSurfaceHashes = Object.fromEntries(
    await Promise.all(
      PROTECTED_SURFACES.map(async (file) => [file, await fileHash(file)] as const),
    ),
  );
  return {
    reviewStatus: 'production-wired-awaiting-visual-approval',
    productionPromotion: true,
    canonicalSvgCount: WORKSTATION_FAMILY_PROP_IDS.length,
    importerGeneratedArt: allSourceHashesMatch,
    unityImport: false,
    commitCreated: false,
    exportContractMutation: false,
    schemaMutation: false,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    invariants: {
      authoringCanvas: AUTHORING_CANVAS,
      acceptedWallDatum: WALL_DATUM,
      characterVisualScale: CHARACTER_VISUAL_SCALE,
      propNativeFrameCells: PROP_NATIVE_FRAME_CELLS,
      propCharacterMultiplierApplied: false,
      bakedGameplayArtScales: WORKSTATION_GAMEPLAY_ART_SCALES,
    },
    contractValidation: validation,
    sourceProvenance,
    protectedSurfaceHashes,
  };
}

interface ProductionRenderResult {
  readonly svgPath: string;
  readonly pngPath: string;
  readonly metricsPath: string;
}

export async function renderQuotaCoWorkstationFamilyProductionValidation(
  output = path.join('docs', 'previews'),
): Promise<ProductionRenderResult> {
  const renderer = new WorkstationRenderer();
  const sources = await loadWorkstationSources();
  const source = productionValidationSheet(renderer, sources);
  const png = new Resvg(source, {
    font: { loadSystemFonts: true },
  }).render().asPng();
  await mkdir(output, { recursive: true });
  const base = 'quota-co-workstation-family-production-validation-v2';
  const svgPath = path.join(output, `${base}.svg`);
  const pngPath = path.join(output, `${base}.png`);
  const metricsPath = path.join(output, `${base}-metrics.json`);
  await writeFile(svgPath, source, 'utf8');
  await writeFile(pngPath, png);
  await writeFile(
    metricsPath,
    `${JSON.stringify(await productionMetrics(renderer, sources), null, 2)}\n`,
    'utf8',
  );
  return { svgPath, pngPath, metricsPath };
}

function parseArgs(argv: readonly string[]): { readonly output: string } {
  const outIndex = argv.indexOf('--out');
  return {
    output: outIndex >= 0 && argv[outIndex + 1]
      ? argv[outIndex + 1]
      : path.join('docs', 'previews'),
  };
}

async function main(): Promise<void> {
  const { output } = parseArgs(process.argv.slice(2));
  const result = await renderQuotaCoWorkstationFamilyCalibration(output);
  process.stdout.write(
    'Wrote review-only QuotaCo workstation-family calibration:\n' +
    `${result.svgPath}\n` +
    `${result.pngPath}\n` +
    `${result.metricsPath}\n` +
    `${result.inventoryPath}\n`,
  );
}

if (
  process.argv[1]?.endsWith('quotaCoWorkstationFamilyCalibrationPreview.ts')
) {
  main().catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
