/**
 * Review-only QuotaCo social and lounge furniture family.
 *
 * Seven live templates are compared with one bounded Institutional Comfort
 * System direction. Proposal geometry remains code-owned in this proof. No
 * canonical SVG sources, template wiring, schema, export contract, Unity
 * registration, or commit is changed.
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
import { PROP_NATIVE_FRAME_CELLS } from './quotaCoWorkstationFamilyCalibrationPreview';

const WIDTH = 3380;
const HEIGHT = 2200;
const MARGIN = 34;
const GAP = 16;
const AUTHORING_CANVAS = 128;
const NORMAL_CELL = 68;
const FAR_CELL = 40;
const WALL_DATUM = 112;
const CHARACTER_VISUAL_SCALE = 0.65;
const CHARACTER_FRAME_CELLS = 1.55 * CHARACTER_VISUAL_SCALE;

const PAGE = '#E7E1D2';
const PANEL = '#F6F1E6';
const PANEL_ALT = '#ECE5D7';
const INK = '#292C2A';
const MUTED = '#626861';
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
} as const;

export const SOCIAL_FURNITURE_FAMILY_IDS = [
  'couch',
  'waiting-bench',
  'coffee-table',
  'break-table',
  'lounge-seating',
  'bean-bag',
  'nap-pod',
] as const;

export type SocialFurnitureFamilyId =
  (typeof SOCIAL_FURNITURE_FAMILY_IDS)[number];

export const SOCIAL_FURNITURE_GAMEPLAY_ART_SCALES = {
  couch: 0.9,
  'waiting-bench': 0.9,
  'coffee-table': 0.82,
  'break-table': 0.9,
  'lounge-seating': 0.9,
  'bean-bag': 0.84,
  'nap-pod': 0.9,
} as const;

interface FamilyDecision {
  readonly id: SocialFurnitureFamilyId;
  readonly label: string;
  readonly category: string;
  readonly designRead: string;
}

export const SOCIAL_FURNITURE_FAMILY_DECISIONS:
readonly FamilyDecision[] = [
  {
    id: 'couch',
    label: 'Lobby couch',
    category: 'shared seating',
    designRead: 'full-span molded hull + replaceable cushion deck and clear arms',
  },
  {
    id: 'waiting-bench',
    label: 'Waiting bench',
    category: 'queue seating',
    designRead: 'full-span catalog beam + individually readable seat inserts',
  },
  {
    id: 'coffee-table',
    label: 'Coffee table',
    category: 'low surface',
    designRead: 'low molded tray + magazines and mug as the human-use signal',
  },
  {
    id: 'break-table',
    label: 'Break table',
    category: 'meal surface',
    designRead: 'washable round table + tucked stools and central service caddy',
  },
  {
    id: 'lounge-seating',
    label: 'Lounge seating',
    category: 'conversation set',
    designRead: 'modular bucket shells + a legible shared center table',
  },
  {
    id: 'bean-bag',
    label: 'Beanbag',
    category: 'soft seating',
    designRead: 'squashed wipe-clean floor pod + stitched panels and carry tab',
  },
  {
    id: 'nap-pod',
    label: 'Nap pod',
    category: 'recovery',
    designRead: 'reclined molded cot + upholstered bed, hood, and foot controls',
  },
] as const;

interface ContractSnapshot {
  readonly id: SocialFurnitureFamilyId;
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

function furnitureContract(
  id: SocialFurnitureFamilyId,
  projection: ContractSnapshot['projection'],
  gridFootprint: ContractSnapshot['gridFootprint'],
  contactShadow: ContractSnapshot['contactShadow'],
  params: ContractSnapshot['params'],
  defaultInstanceParams: ContractSnapshot['defaultInstanceParams'],
): ContractSnapshot {
  return {
    id,
    projection,
    gridFootprint,
    contactShadow,
    params,
    defaultInstanceParams,
  };
}

export const EXPECTED_SOCIAL_FURNITURE_CONTRACTS:
readonly ContractSnapshot[] = [
  furnitureContract('couch', 'plan', { w: 2, h: 1 }, null, [
    { key: 'width', min: 62, max: 98, step: 4, default: 82 },
    { key: 'cushions', min: 2, max: 3, step: 1, default: 3 },
  ], { width: 82, cushions: 3 }),
  furnitureContract('waiting-bench', 'plan', { w: 2, h: 1 }, null, [
    { key: 'length', min: 76, max: 112, step: 4, default: 96 },
    { key: 'seats', min: 2, max: 4, step: 1, default: 3 },
  ], { length: 96, seats: 3 }),
  furnitureContract('coffee-table', 'plan', { w: 1, h: 1 }, null, [
    { key: 'width', min: 48, max: 76, step: 4, default: 62 },
    { key: 'decor', min: 0, max: 2, step: 1, default: 2 },
  ], { width: 62, decor: 2 }),
  furnitureContract('break-table', 'plan', { w: 2, h: 2 }, null, [
    { key: 'diameter', min: 40, max: 64, step: 4, default: 52 },
    { key: 'stools', min: 2, max: 4, step: 1, default: 4 },
  ], { diameter: 52, stools: 4 }),
  furnitureContract('lounge-seating', 'plan', { w: 2, h: 2 }, null, [
    { key: 'seats', min: 2, max: 4, step: 1, default: 3 },
  ], { seats: 3 }),
  furnitureContract('bean-bag', 'plan', { w: 1, h: 1 }, null, [
    { key: 'size', min: 34, max: 48, step: 2, default: 42 },
  ], { size: 42 }),
  furnitureContract(
    'nap-pod',
    'elevation',
    { w: 2, h: 1 },
    { cx: 64, cy: 117, rx: 34, ry: 5 },
    [{ key: 'visor', min: 0, max: 1, step: 1, default: 1 }],
    { visor: 1 },
  ),
] as const;

const DEFAULT_PARAMS = Object.fromEntries(
  EXPECTED_SOCIAL_FURNITURE_CONTRACTS.map(({ id, defaultInstanceParams }) => [
    id,
    defaultInstanceParams,
  ]),
) as Record<SocialFurnitureFamilyId, Readonly<Record<string, number>>>;

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
  maxChars: number,
  lineHeight: number,
  size = 12,
  weight = 600,
  fill = MUTED,
): string {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.map((entry, index) =>
    text(x, y + index * lineHeight, entry, size, weight, fill)
  ).join('');
}

function panel(
  x: number,
  y: number,
  width: number,
  height: number,
  fill = PANEL,
): string {
  return (
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="14" ` +
    `fill="${fill}" stroke="#AAA291" stroke-width="1.5"/>`
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
  opacity = 1,
): string {
  return (
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" ` +
    `fill="${fill}" opacity="${opacity}" ` +
    (outline
      ? `stroke="${INK}" stroke-width="${strokeWidth}" stroke-linejoin="round"`
      : 'stroke="none"') +
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
  opacity = 1,
): string {
  return (
    `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${fill}" opacity="${opacity}" ` +
    (outline
      ? `stroke="${INK}" stroke-width="${strokeWidth}"`
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
  strokeWidth = 3,
  opacity = 1,
): string {
  return (
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" opacity="${opacity}" ` +
    (outline
      ? `stroke="${INK}" stroke-width="${strokeWidth}"`
      : 'stroke="none"') +
    '/>'
  );
}

function shapePath(
  d: string,
  fill: string,
  outline = false,
  strokeWidth = 3,
  opacity = 1,
): string {
  return (
    `<path d="${d}" fill="${fill}" opacity="${opacity}" ` +
    (outline
      ? `stroke="${INK}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round"`
      : 'stroke="none"') +
    '/>'
  );
}

function strokePath(
  d: string,
  stroke: string,
  strokeWidth = 2,
  opacity = 1,
): string {
  return (
    `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" ` +
    `opacity="${opacity}" stroke-linejoin="round" stroke-linecap="round"/>`
  );
}

function proposalShell(markup: string): string {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" ' +
    `width="128" height="128">${markup}</svg>`
  );
}

function proposalCouch(params: Readonly<Record<string, number>>): string {
  const width = params.width ?? 82;
  const cushions = Math.round(params.cushions ?? 3);
  const x = 64 - width / 2;
  const top = 43;
  const shellX = x - 15;
  const shellWidth = width + 30;
  const insetX = x + 2;
  const insetW = width - 4;
  let cushionMarkup = '';
  const gap = 2;
  const cushionW = (insetW - gap * (cushions - 1)) / cushions;
  for (let index = 0; index < cushions; index += 1) {
    cushionMarkup += roundedRect(
      insetX + index * (cushionW + gap),
      top + 10,
      cushionW,
      27,
      6,
      index === cushions - 1 ? Q.greenLight : Q.green,
      true,
      1.7,
    );
  }
  return (
    roundedRect(shellX, top - 6, shellWidth, 52, 12, Q.cream, true) +
    roundedRect(x - 7, top - 1, width + 14, 10, 5, Q.creamLight, true, 2) +
    cushionMarkup +
    roundedRect(shellX - 1, top + 5, 14, 35, 6, Q.creamLight, true, 2) +
    roundedRect(shellX + shellWidth - 13, top + 5, 14, 35, 6, Q.creamLight, true, 2) +
    roundedRect(shellX + 10, top + 39, shellWidth - 20, 5, 2, Q.recess) +
    roundedRect(shellX + shellWidth - 18, top + 12, 4, 12, 1, Q.coral) +
    strokePath(`M${x + 11} ${top + 35}Q${x + 21} ${top + 40} ${x + 30} ${top + 35}`, Q.creamShade, 1.4, 0.75)
  );
}

function proposalWaitingBench(params: Readonly<Record<string, number>>): string {
  const length = params.length ?? 96;
  const seats = Math.round(params.seats ?? 3);
  const x = 64 - length / 2;
  const shellX = x - 10;
  const shellLength = length + 20;
  const top = 48;
  const gap = 3;
  const seatW = (length - 4 - gap * (seats - 1)) / seats;
  let seatsMarkup = '';
  for (let index = 0; index < seats; index += 1) {
    seatsMarkup += roundedRect(
      x + 2 + index * (seatW + gap),
      top + 7,
      seatW,
      24,
      6,
      index % 2 === 0 ? Q.green : Q.greenLight,
      true,
      1.6,
    );
  }
  return (
    roundedRect(shellX, top - 7, shellLength, 43, 10, Q.cream, true) +
    roundedRect(x - 6, top - 4, length + 12, 9, 4, Q.creamLight, true, 2) +
    seatsMarkup +
    roundedRect(shellX + 8, top + 32, shellLength - 16, 5, 2, Q.recess) +
    roundedRect(shellX + shellLength - 13, top + 9, 3, 10, 1, Q.coral)
  );
}

function proposalCoffeeTable(params: Readonly<Record<string, number>>): string {
  const width = params.width ?? 62;
  const decor = Math.round(params.decor ?? 2);
  const depth = width * 0.66;
  const x = 64 - width / 2;
  const y = 64 - depth / 2;
  let detail = '';
  if (decor >= 1) {
    detail +=
      roundedRect(x + 9, y + 8, 21, 14, 2, Q.paper, true, 1.2) +
      roundedRect(x + 13, y + 6, 21, 14, 2, Q.coral, true, 1.2);
  }
  if (decor >= 2) {
    detail +=
      circle(x + width - 13, y + 12, 5, Q.creamLight, true, 1.3) +
      circle(x + width - 13, y + 12, 2.7, Q.rust) +
      roundedRect(x + width - 22, y + depth - 17, 9, 9, 2, Q.coral) +
      shapePath(
        `M${x + width - 18} ${y + depth - 16}Q${x + width - 25} ${y + depth - 26} ${x + width - 14} ${y + depth - 26}Q${x + width - 8} ${y + depth - 23} ${x + width - 18} ${y + depth - 16}Z`,
        Q.greenLight,
        true,
        1.2,
      );
  }
  return (
    roundedRect(x, y, width, depth, 10, Q.cream, true) +
    roundedRect(x + 5, y + 5, width - 10, depth - 10, 7, Q.olive, true, 1.6) +
    roundedRect(x + 9, y + depth - 7, width - 18, 4, 2, Q.recess) +
    detail
  );
}

function proposalBreakTable(params: Readonly<Record<string, number>>): string {
  const diameter = params.diameter ?? 52;
  const stools = Math.round(params.stools ?? 4);
  const radius = diameter / 2;
  const ring = radius + 16;
  let markup = '';
  for (let index = 0; index < stools; index += 1) {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / stools;
    const sx = 64 + Math.cos(angle) * ring;
    const sy = 64 + Math.sin(angle) * ring;
    markup +=
      circle(sx, sy, 10, Q.cream, true, 2) +
      circle(sx, sy, 6, index % 2 === 0 ? Q.green : Q.greenLight, true, 1.4) +
      roundedRect(sx - 2, sy + 7, 4, 5, 1, Q.recess);
  }
  return (
    markup +
    circle(64, 64, radius + 3, Q.cream, true) +
    circle(64, 64, radius - 4, Q.olive, true, 1.6) +
    roundedRect(58, 57, 12, 14, 3, Q.coral, true, 1.5) +
    strokePath('M61 61H67M61 65H67', Q.paper, 1.1)
  );
}

function proposalLoungeSeating(params: Readonly<Record<string, number>>): string {
  const seats = Math.round(params.seats ?? 3);
  const ring = 34;
  let markup = '';
  for (let index = 0; index < seats; index += 1) {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / seats;
    const cx = 64 + Math.cos(angle) * ring;
    const cy = 64 + Math.sin(angle) * ring;
    const backX = cx + Math.cos(angle) * 8;
    const backY = cy + Math.sin(angle) * 8;
    markup +=
      roundedRect(cx - 12, cy - 12, 24, 24, 8, Q.cream, true, 2.2) +
      roundedRect(cx - 8, cy - 8, 16, 16, 5, index % 2 === 0 ? Q.green : Q.greenLight, true, 1.5) +
      circle(backX, backY, 4.5, Q.creamLight, true, 1.4) +
      roundedRect(cx + 7, cy - 2, 3, 8, 1, Q.coral);
  }
  return (
    markup +
    circle(64, 64, 16, Q.cream, true, 2.5) +
    circle(64, 64, 11, Q.olive, true, 1.4) +
    roundedRect(60, 59, 8, 10, 2, Q.paper) +
    circle(69, 69, 3, Q.coral)
  );
}

function proposalBeanBag(params: Readonly<Record<string, number>>): string {
  const size = params.size ?? 42;
  const radius = size / 2;
  const d =
    `M${64 - radius} 68` +
    `Q${64 - radius + 1} ${64 - radius * 0.8} ${52} ${48}` +
    `Q64 ${37 - (size - 42) * 0.3} 76 48` +
    `Q${64 + radius - 1} ${64 - radius * 0.7} ${64 + radius} 68` +
    `Q${64 + radius - 2} ${64 + radius} 64 ${64 + radius + 3}` +
    `Q${64 - radius + 2} ${64 + radius} ${64 - radius} 68Z`;
  return (
    shapePath(d, Q.green, true, 2.7) +
    ellipse(64, 70, radius * 0.56, radius * 0.34, Q.recess, false, 0, 0.38) +
    strokePath(`M${64 - radius * 0.72} 60Q64 ${64 + radius * 0.55} ${64 + radius * 0.72} 60`, Q.greenLight, 2, 0.9) +
    strokePath(`M64 ${48}Q69 64 64 ${64 + radius}`, Q.creamShade, 1.5, 0.75) +
    roundedRect(62, 43, 10, 5, 2, Q.creamLight, true, 1.2) +
    roundedRect(70, 79, 4, 9, 1, Q.coral)
  );
}

function proposalNapPod(params: Readonly<Record<string, number>>): string {
  const visor = (params.visor ?? 1) >= 1;
  const shell =
    shapePath('M14 114L16 98Q17 88 28 85L88 82Q103 82 111 94L114 114Z', Q.cream, true) +
    roundedRect(24, 106, 76, 9, 3, Q.recess, true, 1.5) +
    shapePath('M27 101L32 86L81 73Q95 70 102 82L97 99L38 108Z', Q.green, true, 2.2) +
    shapePath('M39 87L67 80L74 98L42 105Z', Q.greenLight, true, 1.5) +
    shapePath('M80 78Q91 72 98 79L96 88L81 91Q76 84 80 78Z', Q.creamLight, true, 1.6) +
    strokePath('M45 91L69 85', Q.creamShade, 1.4, 0.8) +
    roundedRect(17, 87, 15, 20, 5, Q.greenLight, true, 1.7) +
    roundedRect(20, 91, 9, 5, 2, Q.recess) +
    circle(24.5, 100, 2.6, Q.coral) +
    circle(28, 100, 1.3, Q.creamLight);
  const hood = visor
    ? (
      shapePath('M67 88Q78 49 98 51Q114 53 117 70Q120 88 106 102L98 95Q107 83 106 71Q104 61 96 60Q82 61 75 90Z', Q.creamLight, true, 2.7) +
      shapePath('M75 86Q83 61 97 61Q108 63 109 74Q110 87 101 95L95 89Q101 80 99 72Q97 67 91 68Q82 71 78 89Z', Q.blueGlass, true, 1.7, 0.78) +
      strokePath('M104 60Q114 70 111 85', Q.creamShade, 1.6, 0.85)
    )
    : (
      roundedRect(101, 72, 9, 27, 4, Q.creamLight, true, 2) +
      strokePath('M72 87Q88 66 105 73', Q.creamShade, 3.2) +
      strokePath('M78 87Q91 72 103 78', Q.blueGlass, 2.2, 0.8)
    );
  return ellipse(64, 117, 39, 5, '#000000', false, 0, 0.12) + shell + hood;
}

function unscaledProposal(
  id: SocialFurnitureFamilyId,
  params: Readonly<Record<string, number>>,
): string {
  switch (id) {
    case 'couch': return proposalCouch(params);
    case 'waiting-bench': return proposalWaitingBench(params);
    case 'coffee-table': return proposalCoffeeTable(params);
    case 'break-table': return proposalBreakTable(params);
    case 'lounge-seating': return proposalLoungeSeating(params);
    case 'bean-bag': return proposalBeanBag(params);
    case 'nap-pod': return proposalNapPod(params);
  }
}

export function proposalSocialFurnitureSvg(
  id: SocialFurnitureFamilyId,
  params: Readonly<Record<string, number>> = DEFAULT_PARAMS[id],
): string {
  const pivotY = id === 'nap-pod' ? 116 : 64;
  const scale = SOCIAL_FURNITURE_GAMEPLAY_ART_SCALES[id];
  return proposalShell(
    `<g transform="translate(64 ${pivotY}) scale(${scale}) translate(-64 -${pivotY})">` +
    `${unscaledProposal(id, params)}</g>`,
  );
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

class FurnitureRenderer {
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
      render: { ...DEFAULT_STYLE.render, contactShadow: 0.12 },
    };
  }

  template(id: string): PropTemplate {
    const template = PROP_TEMPLATES.find((candidate) => candidate.id === id);
    if (!template) throw new Error(`Missing prop template ${id}`);
    return template;
  }

  current(
    id: string,
    params?: Readonly<Record<string, number>>,
  ): string {
    const key = params
      ? `${id}:${JSON.stringify(Object.entries(params).sort())}`
      : id;
    let source = this.currentCache.get(key);
    if (!source) {
      const instance = this.props.find(({ templateId }) => templateId === id);
      if (!instance) throw new Error(`Default project is missing prop ${id}`);
      source = composeProp(
        params ? { ...instance, params: { ...params } } : instance,
        this.style,
        AUTHORING_CANVAS,
      );
      this.currentCache.set(key, source);
    }
    return source;
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
      `${markup}</svg>`
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
    `<rect x="${x}" y="${y}" width="${columns * cell}" height="${rows * cell}" ` +
    `fill="${FLOOR}" stroke="#56616A" stroke-width="2"/>`,
  );
  for (let column = 1; column < columns; column += 1) {
    parts.push(strokePath(
      `M${x + column * cell} ${y}V${y + rows * cell}`,
      FLOOR_LINE,
      1,
      0.16,
    ));
  }
  for (let row = 1; row < rows; row += 1) {
    parts.push(strokePath(
      `M${x} ${y + row * cell}H${x + columns * cell}`,
      FLOOR_LINE,
      1,
      0.16,
    ));
  }
}

function drawWalls(
  parts: string[],
  renderer: FurnitureRenderer,
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
  parts.push(renderer.wallTile(9, x + (columns - 1) * cell, y + (rows - 1) * cell, cell));
}

function propPlacement(
  renderer: FurnitureRenderer,
  kind: 'current' | 'proposal',
  id: string,
  footprintX: number,
  footprintY: number,
  cell: number,
  occupancy = true,
  params?: Readonly<Record<string, number>>,
): string {
  const template = renderer.template(id);
  const source = kind === 'proposal'
    ? proposalSocialFurnitureSvg(id as SocialFurnitureFamilyId, params)
    : renderer.current(id);
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
      `width="${footprintWidth - 6}" height="${footprintHeight - 6}" rx="5" ` +
      `fill="${OCCUPANCY}" fill-opacity=".08" stroke="${OCCUPANCY}" ` +
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
  renderer: FurnitureRenderer,
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

type RoomKind = 'waiting' | 'lounge' | 'recovery';

function roomDimensions(kind: RoomKind): { columns: number; rows: number } {
  return {
    columns: kind === 'recovery' ? 8 : 10,
    rows: kind === 'recovery' ? 6 : 7,
  };
}

function roomScene(
  renderer: FurnitureRenderer,
  kind: RoomKind,
  x: number,
  y: number,
  cell: number,
  crowded = false,
  socialArt: 'proposal' | 'current' = 'proposal',
): string {
  const { columns, rows } = roomDimensions(kind);
  const parts: string[] = [];
  drawGrid(parts, x, y, columns, rows, cell);
  drawWalls(parts, renderer, x, y, columns, rows, cell, 'back');
  if (kind === 'waiting') {
    parts.push(
      propPlacement(renderer, 'current', 'reception-desk', x + cell, y + cell, cell),
      propPlacement(renderer, socialArt, 'waiting-bench', x + 5 * cell, y + cell, cell),
      propPlacement(renderer, socialArt, 'couch', x + 5 * cell, y + 3 * cell, cell),
      propPlacement(renderer, socialArt, 'coffee-table', x + 7 * cell, y + 4 * cell, cell),
      propPlacement(renderer, 'current', 'office-plant', x + 8 * cell, y + cell, cell),
    );
    const agents: AgentPlacement[] = [
      { recipe: DEFAULT_CAST[0], facing: 'north', x: 2.1, y: 4.2 },
      { recipe: DEFAULT_CAST[1], facing: 'west', x: 6.8, y: 5.25 },
      { recipe: DEFAULT_CAST[2], facing: 'north', x: 5.2, y: 2.7 },
    ];
    if (crowded) {
      agents.push(
        { recipe: DEFAULT_CAST[3], facing: 'east', x: 4.15, y: 5.2 },
        { recipe: DEFAULT_CAST[0], facing: 'south', x: 8.4, y: 4.0 },
      );
    }
    for (const agent of agents) parts.push(agentPlacement(renderer, agent, x, y, cell));
  } else if (kind === 'lounge') {
    parts.push(
      propPlacement(renderer, socialArt, 'lounge-seating', x + cell, y + cell, cell),
      propPlacement(renderer, socialArt, 'break-table', x + 5 * cell, y + cell, cell),
      propPlacement(renderer, socialArt, 'bean-bag', x + 8 * cell, y + 3 * cell, cell),
      propPlacement(renderer, 'current', 'water-cooler', x + 8 * cell, y + cell, cell),
      propPlacement(renderer, socialArt, 'coffee-table', x + 4 * cell, y + 4 * cell, cell),
    );
    const agents: AgentPlacement[] = [
      { recipe: DEFAULT_CAST[2], facing: 'north', x: 2.4, y: 4.3 },
      { recipe: DEFAULT_CAST[0], facing: 'east', x: 6.4, y: 4.45 },
      { recipe: DEFAULT_CAST[1], facing: 'west', x: 8.2, y: 5.3 },
    ];
    if (crowded) {
      agents.push(
        { recipe: DEFAULT_CAST[3], facing: 'south', x: 4.4, y: 5.35 },
        { recipe: DEFAULT_CAST[0], facing: 'west', pose: 'walk-approach', x: 7.45, y: 3.6 },
      );
    }
    for (const agent of agents) parts.push(agentPlacement(renderer, agent, x, y, cell));
  } else {
    parts.push(
      propPlacement(renderer, socialArt, 'nap-pod', x + cell, y + cell, cell),
      propPlacement(renderer, socialArt, 'bean-bag', x + 4 * cell, y + 2 * cell, cell),
      propPlacement(renderer, socialArt, 'coffee-table', x + 4 * cell, y + 4 * cell, cell),
      propPlacement(renderer, 'current', 'office-plant', x + 6 * cell, y + cell, cell),
    );
    const agents: AgentPlacement[] = [
      { recipe: DEFAULT_CAST[3], facing: 'north', x: 2.5, y: 4.15 },
      { recipe: DEFAULT_CAST[1], facing: 'west', x: 5.4, y: 4.65 },
    ];
    if (crowded) {
      agents.push({ recipe: DEFAULT_CAST[0], facing: 'east', x: 6.35, y: 3.45 });
    }
    for (const agent of agents) parts.push(agentPlacement(renderer, agent, x, y, cell));
  }
  drawWalls(parts, renderer, x, y, columns, rows, cell, 'front');
  return parts.join('');
}

function closeComparison(
  renderer: FurnitureRenderer,
  decision: FamilyDecision,
  x: number,
  y: number,
  width: number,
): string {
  const cellSize = 142;
  const leftX = x + 16;
  const rightX = x + width - 16 - cellSize;
  return (
    panel(x, y, width, 390) +
    text(x + 16, y + 27, decision.category.toUpperCase(), 10, 760, Q.green) +
    text(x + 16, y + 51, decision.label, 17, 820, INK) +
    roundedRect(leftX, y + 68, cellSize, cellSize, 10, PANEL_ALT) +
    roundedRect(rightX, y + 68, cellSize, cellSize, 10, PANEL_ALT) +
    placedSvg(renderer.current(decision.id), leftX + 7, y + 75, cellSize - 14) +
    placedSvg(
      proposalSocialFurnitureSvg(decision.id),
      rightX + 7,
      y + 75,
      cellSize - 14,
    ) +
    text(leftX + cellSize / 2, y + 228, 'IMPORTED', 10, 720, MUTED, 'middle') +
    text(rightX + cellSize / 2, y + 228, 'ACCEPTED REFERENCE', 10, 760, Q.coral, 'middle') +
    wrappedText(x + 16, y + 265, decision.designRead, 44, 18, 12, 630, MUTED) +
    text(
      x + 16,
      y + 344,
      `128u source · ${(PROP_NATIVE_FRAME_CELLS * SOCIAL_FURNITURE_GAMEPLAY_ART_SCALES[decision.id]).toFixed(2)}-cell art`,
      10,
      650,
      MUTED,
    ) +
    text(x + width - 16, y + 344, 'contract unchanged', 10, 720, Q.green, 'end')
  );
}

function normalRoomCard(
  renderer: FurnitureRenderer,
  kind: RoomKind,
  x: number,
  y: number,
  width: number,
  label: string,
  note: string,
  socialArt: 'proposal' | 'current' = 'proposal',
): string {
  const { columns } = roomDimensions(kind);
  const roomWidth = columns * NORMAL_CELL;
  const roomX = x + (width - roomWidth) / 2;
  const roomY = y + 80;
  return (
    panel(x, y, width, 568, kind === 'lounge' ? PANEL_ALT : PANEL) +
    text(x + 18, y + 30, label, 18, 820, Q.green) +
    text(x + width - 18, y + 30, '68 px / cell', 10, 760, Q.coral, 'end') +
    text(x + 18, y + 54, note, 11, 610, MUTED) +
    roomScene(renderer, kind, roomX, roomY, NORMAL_CELL, false, socialArt) +
    text(x + 18, y + 542, 'Dashed = preserved occupancy · native 2-cell art frame', 10, 650, MUTED) +
    text(x + width - 18, y + 542, 'characters = production ×0.65', 10, 650, MUTED, 'end')
  );
}

function variantsCard(
  renderer: FurnitureRenderer,
  x: number,
  y: number,
  width: number,
  socialArt: 'proposal' | 'current' = 'proposal',
): string {
  const pairs: readonly [
    SocialFurnitureFamilyId,
    Readonly<Record<string, number>>,
    Readonly<Record<string, number>>,
    string,
  ][] = [
    ['couch', { width: 82, cushions: 2 }, { width: 82, cushions: 3 }, '2 / 3 CUSHIONS'],
    ['waiting-bench', { length: 96, seats: 2 }, { length: 96, seats: 4 }, '2 / 4 SEATS'],
    ['nap-pod', { visor: 0 }, { visor: 1 }, 'VISOR UP / DOWN'],
  ];
  const columnWidth = (width - 36) / 3;
  let content = '';
  pairs.forEach(([id, low, high, label], index) => {
    const columnX = x + 12 + index * columnWidth;
    content +=
      text(columnX + columnWidth / 2, y + 66, label, 10, 780, Q.coral, 'middle') +
      roundedRect(columnX + 8, y + 78, 116, 116, 9, PANEL_ALT) +
      roundedRect(columnX + columnWidth - 124, y + 78, 116, 116, 9, PANEL_ALT) +
      placedSvg(
        socialArt === 'current'
          ? renderer.current(id, low)
          : proposalSocialFurnitureSvg(id, low),
        columnX + 14,
        y + 84,
        104,
      ) +
      placedSvg(
        socialArt === 'current'
          ? renderer.current(id, high)
          : proposalSocialFurnitureSvg(id, high),
        columnX + columnWidth - 118,
        y + 84,
        104,
      ) +
      text(columnX + 66, y + 210, 'LOW', 9, 680, MUTED, 'middle') +
      text(columnX + columnWidth - 66, y + 210, 'HIGH', 9, 720, Q.coral, 'middle');
  });
  return (
    panel(x, y, width, 482) +
    text(x + 18, y + 30, 'PARAMETER READABILITY', 17, 820, Q.green) +
    text(x + 18, y + 52, 'Existing controls change use without changing object identity.', 11, 610, MUTED) +
    content +
    wrappedText(
      x + 18,
      y + 250,
      'Cushion count, seat count, and privacy visor remain obvious at normal zoom while the family shell stays stable.',
      76,
      18,
      12,
      650,
      MUTED,
    ) +
    text(x + 18, y + 454, 'Same IDs · same legal ranges · same occupancy contracts', 10, 720, Q.green)
  );
}

function occlusionCard(
  renderer: FurnitureRenderer,
  x: number,
  y: number,
  width: number,
  socialArt: 'proposal' | 'current' = 'proposal',
): string {
  const cell = 58;
  const roomX = x + (width - 8 * cell) / 2;
  const roomY = y + 68;
  const parts: string[] = [];
  drawGrid(parts, roomX, roomY, 8, 6, cell);
  drawWalls(parts, renderer, roomX, roomY, 8, 6, cell, 'back');
  parts.push(
    propPlacement(renderer, socialArt, 'waiting-bench', roomX + cell, roomY + cell, cell),
    propPlacement(renderer, socialArt, 'couch', roomX + 4 * cell, roomY + cell, cell),
    propPlacement(renderer, socialArt, 'coffee-table', roomX + 3 * cell, roomY + 3 * cell, cell),
    propPlacement(renderer, 'current', 'reception-desk', roomX + 5 * cell, roomY + 3 * cell, cell),
    agentPlacement(renderer, { recipe: DEFAULT_CAST[0], facing: 'north', x: 1.8, y: 4.55 }, roomX, roomY, cell),
    agentPlacement(renderer, { recipe: DEFAULT_CAST[1], facing: 'north', x: 4.8, y: 4.6 }, roomX, roomY, cell),
    agentPlacement(renderer, { recipe: DEFAULT_CAST[2], facing: 'west', x: 6.5, y: 4.9 }, roomX, roomY, cell),
  );
  drawWalls(parts, renderer, roomX, roomY, 8, 6, cell, 'front');
  return (
    panel(x, y, width, 482, PANEL_ALT) +
    text(x + 18, y + 30, 'COUNTER OCCLUSION + SEATING APPROACH', 17, 820, Q.green) +
    text(x + 18, y + 52, 'Seat openings, low surface, and employee roots remain clear.', 11, 610, MUTED) +
    parts.join('') +
    text(x + 18, y + 454, 'No interaction anchor or approach metadata is added by this proof.', 10, 720, Q.green)
  );
}

function crowdedCard(
  renderer: FurnitureRenderer,
  x: number,
  y: number,
  width: number,
  socialArt: 'proposal' | 'current' = 'proposal',
): string {
  const cell = 52;
  const roomWidth = 10 * cell;
  return (
    panel(x, y, width, 482) +
    text(x + 18, y + 30, 'CROWDED LOUNGE', 17, 820, Q.green) +
    text(x + width - 18, y + 30, '52 px / cell', 10, 760, Q.coral, 'end') +
    text(x + 18, y + 52, 'Wall context, furniture separation, and five-person circulation.', 11, 610, MUTED) +
    roomScene(
      renderer,
      'lounge',
      x + (width - roomWidth) / 2,
      y + 66,
      cell,
      true,
      socialArt,
    )
  );
}

function farRoomStrip(
  renderer: FurnitureRenderer,
  x: number,
  y: number,
  socialArt: 'proposal' | 'current' = 'proposal',
  statusNote = 'Review-only: no SVG authoring, template wiring, export/schema change, Unity import, or commit.',
): string {
  const roomY = y + 68;
  const waitingX = x + 24;
  const loungeX = waitingX + 10 * FAR_CELL + 34;
  const recoveryX = loungeX + 10 * FAR_CELL + 34;
  return (
    panel(x, y, WIDTH - MARGIN * 2, 450) +
    text(x + 18, y + 30, 'FAR GAMEPLAY ZOOM', 18, 820, Q.green) +
    text(x + 250, y + 30, '40 px / cell · native 2-cell prop frame · characters ×0.65', 11, 650, MUTED) +
    roomScene(renderer, 'waiting', waitingX, roomY, FAR_CELL, true, socialArt) +
    roomScene(renderer, 'lounge', loungeX, roomY, FAR_CELL, true, socialArt) +
    roomScene(renderer, 'recovery', recoveryX, roomY, FAR_CELL, true, socialArt) +
    text(waitingX, y + 330, 'waiting / reception', 10, 700, MUTED) +
    text(loungeX, y + 330, 'break / lounge', 10, 700, MUTED) +
    text(recoveryX, y + 330, 'quiet / recovery', 10, 700, MUTED) +
    wrappedText(
      recoveryX + 8 * FAR_CELL + 36,
      roomY + 28,
      'Acceptance question: do all seven pieces keep their furniture noun and usable surface without residential warmth or tiny-detail dependence?',
      48,
      19,
      13,
      700,
      INK,
    ) +
    wrappedText(
      recoveryX + 8 * FAR_CELL + 36,
      roomY + 151,
      'Fixed controls: accepted reception desk, plant, water cooler, completed characters, and 112-unit walls.',
      48,
      19,
      12,
      610,
      MUTED,
    ) +
    wrappedText(
      recoveryX + 8 * FAR_CELL + 36,
      roomY + 252,
      statusNote,
      48,
      19,
      12,
      720,
      Q.coral,
    )
  );
}

function calibrationSheet(renderer: FurnitureRenderer): string {
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">`,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAGE}"/>`,
    text(MARGIN, 42, 'QuotaCo social furniture · Institutional Comfort System', 25, 860, INK),
    text(
      MARGIN,
      68,
      'Molded institutional shells softened by replaceable upholstery, use, wear, and employee arrangement.',
      13,
      620,
      MUTED,
    ),
    text(
      WIDTH - MARGIN,
      42,
      'ACCEPTED REFERENCE · SVG SOURCES PRODUCTION WIRED',
      11,
      820,
      Q.coral,
      'end',
    ),
    text(
      WIDTH - MARGIN,
      65,
      '128 authoring · 112 wall · characters ×0.65 · props independently scaled',
      11,
      680,
      Q.green,
      'end',
    ),
  ];
  const closeY = 92;
  const closeWidth = (WIDTH - MARGIN * 2 - GAP * 6) / 7;
  SOCIAL_FURNITURE_FAMILY_DECISIONS.forEach((decision, index) => {
    parts.push(closeComparison(
      renderer,
      decision,
      MARGIN + index * (closeWidth + GAP),
      closeY,
      closeWidth,
    ));
  });
  const roomsY = closeY + 410;
  const roomWidth = (WIDTH - MARGIN * 2 - GAP * 2) / 3;
  parts.push(
    normalRoomCard(
      renderer,
      'waiting',
      MARGIN,
      roomsY,
      roomWidth,
      'WAITING / RECEPTION',
      'Public seating reads beside accepted reception infrastructure.',
    ),
    normalRoomCard(
      renderer,
      'lounge',
      MARGIN + roomWidth + GAP,
      roomsY,
      roomWidth,
      'BREAK / LOUNGE',
      'Shared seating and meal surfaces remain functional, not residential.',
    ),
    normalRoomCard(
      renderer,
      'recovery',
      MARGIN + (roomWidth + GAP) * 2,
      roomsY,
      roomWidth,
      'QUIET / RECOVERY',
      'Nap pod and soft seating remain legible beside characters and walls.',
    ),
  );
  const stressY = roomsY + 588;
  const stressWidth = (WIDTH - MARGIN * 2 - GAP * 2) / 3;
  parts.push(
    variantsCard(renderer, MARGIN, stressY, stressWidth),
    occlusionCard(renderer, MARGIN + stressWidth + GAP, stressY, stressWidth),
    crowdedCard(renderer, MARGIN + (stressWidth + GAP) * 2, stressY, stressWidth),
    farRoomStrip(
      renderer,
      MARGIN,
      stressY + 500,
      'proposal',
      'Accepted reference: canonical SVG authoring and template wiring are complete. Unity import and commit remain deferred.',
    ),
    text(
      MARGIN,
      HEIGHT - 24,
      'Approval gate: noun read, shared family shell, usable surfaces, independent scale, occlusion, and crowd separation.',
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

type SocialFurnitureSourceMap = ReadonlyMap<SocialFurnitureFamilyId, string>;

async function loadSocialFurnitureSources(): Promise<SocialFurnitureSourceMap> {
  return new Map(
    await Promise.all(
      SOCIAL_FURNITURE_FAMILY_IDS.map(async (id) => [
        id,
        await readFile(
          path.join('assets', 'props', 'quota-co-workhorse-v1', `${id}.svg`),
          'utf8',
        ),
      ] as const),
    ),
  );
}

function productionCloseComparison(
  renderer: FurnitureRenderer,
  sources: SocialFurnitureSourceMap,
  decision: FamilyDecision,
  x: number,
  y: number,
  width: number,
): string {
  const canonical = sources.get(decision.id);
  if (!canonical) throw new Error(`Missing canonical SVG ${decision.id}`);
  const cellSize = 142;
  const leftX = x + 16;
  const rightX = x + width - 16 - cellSize;
  return (
    panel(x, y, width, 390) +
    text(x + 16, y + 27, decision.category.toUpperCase(), 10, 760, Q.green) +
    text(x + 16, y + 51, decision.label, 17, 820, INK) +
    roundedRect(leftX, y + 68, cellSize, cellSize, 10, PANEL_ALT) +
    roundedRect(rightX, y + 68, cellSize, cellSize, 10, PANEL_ALT) +
    placedSvg(canonical, leftX + 7, y + 75, cellSize - 14) +
    placedSvg(renderer.current(decision.id), rightX + 7, y + 75, cellSize - 14) +
    text(leftX + cellSize / 2, y + 228, 'CANONICAL SVG', 10, 720, MUTED, 'middle') +
    text(rightX + cellSize / 2, y + 228, 'IMPORTED OUTPUT', 10, 760, Q.coral, 'middle') +
    wrappedText(x + 16, y + 265, decision.designRead, 44, 18, 12, 630, MUTED) +
    text(
      x + 16,
      y + 344,
      `128u source · ${(PROP_NATIVE_FRAME_CELLS * SOCIAL_FURNITURE_GAMEPLAY_ART_SCALES[decision.id]).toFixed(2)}-cell art`,
      10,
      650,
      MUTED,
    ) +
    text(x + width - 16, y + 344, 'source-provenanced', 10, 720, Q.green, 'end')
  );
}

function productionValidationSheet(
  renderer: FurnitureRenderer,
  sources: SocialFurnitureSourceMap,
): string {
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">`,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAGE}"/>`,
    text(MARGIN, 42, 'QuotaCo social furniture · imported-art validation', 25, 860, INK),
    text(
      MARGIN,
      68,
      'Seven canonical artist-editable SVGs beside deterministic Terrarium compositor output.',
      13,
      620,
      MUTED,
    ),
    text(
      WIDTH - MARGIN,
      42,
      'PRODUCTION WIRED · SOURCE VALIDATION',
      11,
      820,
      Q.coral,
      'end',
    ),
    text(
      WIDTH - MARGIN,
      65,
      '128 authoring · 112 wall · characters ×0.65 · props independently scaled',
      11,
      680,
      Q.green,
      'end',
    ),
  ];
  const closeY = 92;
  const closeWidth = (WIDTH - MARGIN * 2 - GAP * 6) / 7;
  SOCIAL_FURNITURE_FAMILY_DECISIONS.forEach((decision, index) => {
    parts.push(productionCloseComparison(
      renderer,
      sources,
      decision,
      MARGIN + index * (closeWidth + GAP),
      closeY,
      closeWidth,
    ));
  });
  const roomsY = closeY + 410;
  const roomWidth = (WIDTH - MARGIN * 2 - GAP * 2) / 3;
  parts.push(
    normalRoomCard(
      renderer,
      'waiting',
      MARGIN,
      roomsY,
      roomWidth,
      'WAITING / RECEPTION',
      'Imported full-span public seating beside accepted reception infrastructure.',
      'current',
    ),
    normalRoomCard(
      renderer,
      'lounge',
      MARGIN + roomWidth + GAP,
      roomsY,
      roomWidth,
      'BREAK / LOUNGE',
      'Imported seating and meal surfaces preserve the approved family read.',
      'current',
    ),
    normalRoomCard(
      renderer,
      'recovery',
      MARGIN + (roomWidth + GAP) * 2,
      roomsY,
      roomWidth,
      'QUIET / RECOVERY',
      'Imported nap pod and soft seating remain legible beside characters.',
      'current',
    ),
  );
  const stressY = roomsY + 588;
  const stressWidth = (WIDTH - MARGIN * 2 - GAP * 2) / 3;
  parts.push(
    variantsCard(renderer, MARGIN, stressY, stressWidth, 'current'),
    occlusionCard(
      renderer,
      MARGIN + stressWidth + GAP,
      stressY,
      stressWidth,
      'current',
    ),
    crowdedCard(
      renderer,
      MARGIN + (stressWidth + GAP) * 2,
      stressY,
      stressWidth,
      'current',
    ),
    farRoomStrip(
      renderer,
      MARGIN,
      stressY + 500,
      'current',
      'Canonical SVGs and deterministic template wiring are present. Schema, Unity import, and commit remain unchanged.',
    ),
    text(
      MARGIN,
      HEIGHT - 24,
      'Validation gate: source fidelity, noun read, parameter response, independent scale, occlusion, and crowd separation.',
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

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function validateSocialFurnitureContracts(): {
  readonly pass: boolean;
  readonly errors: readonly string[];
  readonly contracts: readonly ContractSnapshot[];
} {
  const project = defaultProject();
  const errors: string[] = [];
  const contracts: ContractSnapshot[] = [];
  const facilities = new Map(
    facilityCatalogJson().facilities.map((facility) => [facility.propId, facility]),
  );
  for (const expected of EXPECTED_SOCIAL_FURNITURE_CONTRACTS) {
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
    if (!sameJson(actual, expected)) errors.push(`contract drift for ${expected.id}`);
    const facility = facilities.get(expected.id);
    if (!facility) errors.push(`missing facility catalog entry ${expected.id}`);
    if (facility?.isInteractionAnchor) {
      errors.push(`unexpected interaction anchor ${expected.id}`);
    }
  }
  return { pass: errors.length === 0, errors, contracts };
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
      if (alpha <= 12) continue;
      visiblePixels += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
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

async function metrics(renderer: FurnitureRenderer): Promise<unknown> {
  const contractValidation = validateSocialFurnitureContracts();
  const sourceAssetPresence = Object.fromEntries(
    await Promise.all(
      SOCIAL_FURNITURE_FAMILY_IDS.map(async (id) => {
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
  const protectedSurfaceHashes = Object.fromEntries(
    await Promise.all(
      PROTECTED_SURFACES.map(async (file) => [file, await fileHash(file)] as const),
    ),
  );
  return {
    reviewStatus: 'accepted-direction-reference',
    productionPromotion: true,
    sourceSvgAuthoring: true,
    unityImport: false,
    commitCreated: false,
    exportChanged: true,
    schemaChanged: false,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    invariants: {
      authoringCanvas: AUTHORING_CANVAS,
      acceptedWallDatum: WALL_DATUM,
      characterVisualScale: CHARACTER_VISUAL_SCALE,
      propNativeFrameCells: PROP_NATIVE_FRAME_CELLS,
      propCharacterMultiplierApplied: false,
      gameplayArtScales: SOCIAL_FURNITURE_GAMEPLAY_ART_SCALES,
    },
    contractValidation,
    sourceAssetPresence,
    protectedSurfaceHashes,
    proposalRasterStats: Object.fromEntries(
      SOCIAL_FURNITURE_FAMILY_IDS.map((id) => [
        id,
        {
          close: rasterStats(proposalSocialFurnitureSvg(id), AUTHORING_CANVAS),
          far: rasterStats(proposalSocialFurnitureSvg(id), FAR_CELL),
          currentClose: rasterStats(renderer.current(id), AUTHORING_CANVAS),
        },
      ]),
    ),
  };
}

async function productionMetrics(
  renderer: FurnitureRenderer,
  sources: SocialFurnitureSourceMap,
): Promise<unknown> {
  const contractValidation = validateSocialFurnitureContracts();
  const sourceProvenance = Object.fromEntries(
    SOCIAL_FURNITURE_FAMILY_IDS.map((id) => {
      const source = sources.get(id);
      if (!source) throw new Error(`Missing canonical SVG ${id}`);
      const imported = authoredPropArt(id);
      const sourceSha256 = createHash('sha256').update(source).digest('hex');
      const expectedProjection = id === 'nap-pod' ? 'elevation' : 'plan';
      return [
        id,
        {
          sourceFile: path.join(
            'assets',
            'props',
            'quota-co-workhorse-v1',
            `${id}.svg`,
          ),
          sourceSha256,
          importedSourceSha256: imported?.sourceSha256 ?? null,
          hashMatchesImportedArt: imported?.sourceSha256 === sourceSha256,
          projectionMatches: imported?.projection === expectedProjection,
          canonicalRaster: rasterStats(source, AUTHORING_CANVAS),
          importedRaster: rasterStats(renderer.current(id), AUTHORING_CANVAS),
        },
      ] as const;
    }),
  );
  const importerGeneratedArt = Object.values(sourceProvenance).every(
    ({ hashMatchesImportedArt, projectionMatches }) =>
      hashMatchesImportedArt && projectionMatches,
  );
  return {
    reviewStatus: 'production-wired-source-validation',
    productionPromotion: true,
    sourceSvgAuthoring: true,
    canonicalSvgCount: SOCIAL_FURNITURE_FAMILY_IDS.length,
    importerGeneratedArt,
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
      gameplayArtScales: SOCIAL_FURNITURE_GAMEPLAY_ART_SCALES,
    },
    contractValidation,
    sourceProvenance,
  };
}

function inventoryMarkdown(): string {
  const rows = EXPECTED_SOCIAL_FURNITURE_CONTRACTS.map((contract) => {
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
  return `# QuotaCo social and lounge furniture inventory v1

Status: **accepted direction and production-wired SVG family**. Seven canonical
SVG sources now compile into deterministic parameter variants. No schema,
Unity registration, Unity import, or commit changed.

Fixed calibration controls:

- accepted reception desk
- accepted office plant and water cooler
- completed production characters at visual scale 0.65
- accepted 112-unit office walls

Every prop retains its 128-unit / two-cell source frame. Art envelopes are
noun-specific and never inherit the character multiplier.

Current review envelopes:

- couch 0.90
- waiting bench 0.90
- coffee table 0.82
- break table 0.90
- lounge seating 0.90
- beanbag 0.84
- nap pod 0.90

| Template | Projection | Grid footprint | Contact shadow cx,cy / rx×ry | Parameters |
|---|---:|---:|---:|---|
${rows}

## Institutional Comfort System

- continuous cream molded perimeter shells
- replaceable dark-green and green-grey upholstery inserts
- obvious sitting, eating, low-table, and recovery surfaces
- coral maintenance tabs and small employee-use details
- magazines, mugs, throws, wear, and arrangement provide warmth
- no residential sofa language, wood-forward mid-century styling, diner chrome,
  or generic luxury lounge treatment

## Review gate

Review canonical-source versus imported-output close comparisons,
waiting/reception, break/lounge, quiet/recovery, parameter variants, counter
occlusion, seating approaches, crowded circulation, wall context, and far
gameplay zoom. Unity import remains deferred.
`;
}

interface RenderResult {
  readonly svgPath: string;
  readonly pngPath: string;
  readonly metricsPath: string;
  readonly inventoryPath: string;
}

export async function renderQuotaCoSocialFurnitureFamilyCalibration(
  output = path.join('docs', 'previews'),
): Promise<RenderResult> {
  const renderer = new FurnitureRenderer();
  const source = calibrationSheet(renderer);
  const png = new Resvg(source, {
    font: { loadSystemFonts: true },
  }).render().asPng();
  await mkdir(output, { recursive: true });
  const base = 'quota-co-social-furniture-family-calibration-v1';
  const svgPath = path.join(output, `${base}.svg`);
  const pngPath = path.join(output, `${base}.png`);
  const metricsPath = path.join(output, `${base}-metrics.json`);
  const inventoryPath = path.join(
    output,
    'quota-co-social-furniture-family-inventory-v1.md',
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

interface ProductionRenderResult {
  readonly svgPath: string;
  readonly pngPath: string;
  readonly metricsPath: string;
}

export async function renderQuotaCoSocialFurnitureFamilyProductionValidation(
  output = path.join('docs', 'previews'),
): Promise<ProductionRenderResult> {
  const renderer = new FurnitureRenderer();
  const sources = await loadSocialFurnitureSources();
  const source = productionValidationSheet(renderer, sources);
  const png = new Resvg(source, {
    font: { loadSystemFonts: true },
  }).render().asPng();
  await mkdir(output, { recursive: true });
  const base = 'quota-co-social-furniture-family-production-validation-v2';
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

function parseOutput(argv: readonly string[]): string {
  const outIndex = argv.indexOf('--out');
  return outIndex >= 0 && argv[outIndex + 1]
    ? argv[outIndex + 1]
    : path.join('docs', 'previews');
}

if (process.argv[1]?.endsWith('quotaCoSocialFurnitureFamilyCalibrationPreview.ts')) {
  renderQuotaCoSocialFurnitureFamilyCalibration(
    parseOutput(process.argv.slice(2)),
  ).then((result) => {
    process.stdout.write(
      'Wrote review-only QuotaCo social-furniture family calibration:\n' +
      `${result.svgPath}\n` +
      `${result.pngPath}\n` +
      `${result.metricsPath}\n` +
      `${result.inventoryPath}\n`,
    );
  }).catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
