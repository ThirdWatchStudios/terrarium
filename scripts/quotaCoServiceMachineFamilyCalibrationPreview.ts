/**
 * QuotaCo employee-service machine family calibration and production proof.
 *
 * The accepted Workhorse System grammar covers seven templates and three
 * failure-state twins. The calibration sheet preserves the accepted code-owned
 * reference; the production sheet compares canonical SVG sources with their
 * deterministic Terrarium compositor output. Unity integration stays out of
 * scope.
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
const NORMAL_CELL = 74;
const FAR_CELL = 40;
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
  error: '#C84E43',
} as const;

export const SERVICE_MACHINE_FAMILY_IDS = [
  'printer',
  'coffee-machine',
  'water-cooler',
  'shredder',
  'microwave',
  'fridge',
  'vending-machine',
] as const;

export type ServiceMachineFamilyId =
  (typeof SERVICE_MACHINE_FAMILY_IDS)[number];

export const SERVICE_MACHINE_FAILURE_IDS = [
  'printer-jammed',
  'coffee-machine-broken',
  'water-cooler-empty',
] as const;

export type ServiceMachineFailureId =
  (typeof SERVICE_MACHINE_FAILURE_IDS)[number];

type ServiceMachineProofId =
  | ServiceMachineFamilyId
  | ServiceMachineFailureId;

export const SERVICE_MACHINE_SOURCE_IDS = [
  ...SERVICE_MACHINE_FAMILY_IDS,
  ...SERVICE_MACHINE_FAILURE_IDS,
] as const;

/**
 * Review-only noun-specific envelopes inside the fixed native two-cell frame.
 * Every elevation prop scales around the accepted y=116 ground pivot. These
 * values do not alter occupancy, collision, anchors, schema, or Unity scale.
 */
export const SERVICE_MACHINE_GAMEPLAY_ART_SCALES = {
  printer: 0.84,
  'printer-jammed': 0.84,
  'coffee-machine': 0.84,
  'coffee-machine-broken': 0.84,
  'water-cooler': 0.86,
  'water-cooler-empty': 0.86,
  shredder: 0.82,
  microwave: 0.85,
  fridge: 0.86,
  'vending-machine': 0.86,
} as const;

interface FamilyDecision {
  readonly id: ServiceMachineFamilyId;
  readonly label: string;
  readonly category: string;
  readonly designRead: string;
}

export const SERVICE_MACHINE_FAMILY_DECISIONS:
readonly FamilyDecision[] = [
  {
    id: 'printer',
    label: 'Printer',
    category: 'paper output',
    designRead: 'molded paper path + visible feed and output bays',
  },
  {
    id: 'coffee-machine',
    label: 'Coffee machine',
    category: 'hot drink',
    designRead: 'brew tower + protected cup interaction bay',
  },
  {
    id: 'water-cooler',
    label: 'Water cooler',
    category: 'cold drink',
    designRead: 'bottle cowl + waist-height service console',
  },
  {
    id: 'shredder',
    label: 'Paper shredder',
    category: 'paper disposal',
    designRead: 'intake visor + legible collection bin',
  },
  {
    id: 'microwave',
    label: 'Microwave',
    category: 'counter appliance',
    designRead: 'washable shell + dark door and control pod',
  },
  {
    id: 'fridge',
    label: 'Break-room fridge',
    category: 'cold storage',
    designRead: 'institutional cabinet softened by notes and magnets',
  },
  {
    id: 'vending-machine',
    label: 'Vending machine',
    category: 'self service',
    designRead: 'catalog window + explicit payment and retrieval spine',
  },
] as const;

interface ContractSnapshot {
  readonly id: ServiceMachineProofId;
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

export const EXPECTED_SERVICE_MACHINE_CONTRACTS:
readonly ContractSnapshot[] = [
  machineContract('printer', { cx: 64, cy: 117, rx: 26, ry: 4 }, [
    { key: 'width', min: 44, max: 72, step: 2, default: 56 },
  ], { width: 56 }),
  machineContract('printer-jammed', { cx: 64, cy: 117, rx: 26, ry: 4 }, [
    { key: 'width', min: 44, max: 72, step: 2, default: 56 },
  ], { width: 56 }),
  machineContract('coffee-machine', { cx: 64, cy: 117, rx: 18, ry: 3.5 }, [
    { key: 'height', min: 40, max: 56, step: 2, default: 48 },
  ], { height: 48 }),
  machineContract('coffee-machine-broken', { cx: 64, cy: 117, rx: 18, ry: 3.5 }, [
    { key: 'height', min: 40, max: 56, step: 2, default: 48 },
  ], { height: 48 }),
  machineContract('water-cooler', { cx: 64, cy: 117, rx: 21, ry: 4 }, [
    { key: 'height', min: 44, max: 68, step: 2, default: 56 },
  ], { height: 56 }),
  machineContract('water-cooler-empty', { cx: 64, cy: 117, rx: 21, ry: 4 }, [
    { key: 'height', min: 44, max: 68, step: 2, default: 56 },
  ], { height: 56 }),
  machineContract('shredder', { cx: 64, cy: 117, rx: 17, ry: 4 }, [
    { key: 'height', min: 34, max: 50, step: 2, default: 42 },
  ], { height: 42 }),
  machineContract('microwave', { cx: 64, cy: 117, rx: 22, ry: 4 }, [
    { key: 'width', min: 38, max: 52, step: 2, default: 44 },
  ], { width: 44 }),
  machineContract('fridge', { cx: 64, cy: 117, rx: 21, ry: 4.5 }, [
    { key: 'height', min: 66, max: 90, step: 2, default: 78 },
  ], { height: 78 }),
  machineContract('vending-machine', { cx: 64, cy: 117, rx: 25, ry: 4.5 }, [
    { key: 'height', min: 70, max: 94, step: 2, default: 84 },
    { key: 'stocked', min: 1, max: 3, step: 1, default: 3 },
  ], { height: 84, stocked: 3 }),
] as const;

function machineContract(
  id: ServiceMachineProofId,
  contactShadow: NonNullable<PropTemplate['footprint']>,
  params: ContractSnapshot['params'],
  defaultInstanceParams: Readonly<Record<string, number>>,
): ContractSnapshot {
  return {
    id,
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    contactShadow,
    params,
    defaultInstanceParams,
  };
}

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
  return lines.map((line, index) =>
    text(x, y + index * lineHeight, line, size, weight, color)).join('');
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
  strokeWidth = 3,
): string {
  return (
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ` +
    (outline
      ? `stroke="${INK}" stroke-width="${strokeWidth}"`
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
  strokeWidth = 3,
): string {
  return (
    `<path d="${d}" fill="${fill}" ` +
    (outline
      ? `stroke="${INK}" stroke-width="${strokeWidth}" ` +
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
    'width="128" height="128">' +
    markup +
    '</svg>'
  );
}

function proposalPrinter(jammed: boolean): string {
  const paper = jammed
    ? (
      pathShape(
        'M43 72L48 60L55 67L63 57L72 67L82 60L87 73Z',
        Q.paper,
        true,
        1.7,
      ) +
      strokePath('M50 64L57 69M66 62L72 68', Q.metal, 1.2)
    )
    : (
      roundedRect(45, 61, 38, 18, 3, Q.paper, true, 1.7) +
      strokePath('M51 67H77M51 72H72', Q.metal, 1.2)
    );
  return proposalShell(
    ellipse(64, 117, 28, 4, '#00000020') +
    roundedRect(32, 72, 64, 44, 11, Q.cream, true) +
    roundedRect(38, 77, 52, 11, 5, Q.green) +
    roundedRect(39, 92, 39, 16, 6, Q.recess, true, 2) +
    roundedRect(45, 96, 31, 12, 3, Q.paper) +
    roundedRect(80, 89, 12, 21, 5, jammed ? Q.error : Q.coral, true, 2) +
    circle(86, 95, 2.3, Q.paper) +
    strokePath('M83 103H89', Q.paper, 1.5) +
    roundedRect(39, 109, 47, 6, 3, Q.creamShade) +
    paper +
    (jammed
      ? circle(86, 95, 5.5, '#C84E4338')
      : circle(40, 82, 4.2, Q.rust, true, 1.8))
  );
}

function proposalCoffeeMachine(broken: boolean): string {
  return proposalShell(
    ellipse(64, 117, 21, 4, broken ? '#6E4A2A55' : '#00000020') +
    roundedRect(41, 53, 46, 63, 11, Q.cream, true) +
    roundedRect(46, 59, 36, 14, 6, Q.green) +
    circle(53, 66, 3.2, broken ? Q.error : Q.coral, true, 1.6) +
    circle(63, 66, 2.6, broken ? Q.error : Q.creamLight) +
    roundedRect(47, 77, 34, 31, 8, Q.recess, true, 2) +
    roundedRect(53, 78, 22, 7, 3, Q.creamShade) +
    roundedRect(54, 90, 20, 15, 5, broken ? '#C9D6E088' : Q.blueGlass, true, 1.7) +
    roundedRect(57, 97, 14, 6, 2, broken ? Q.creamShade : '#6E4A2A') +
    roundedRect(49, 109, 30, 6, 3, Q.greenLight) +
    (broken
      ? (
        strokePath('M57 92L63 98L68 94L72 102', Q.charcoal, 1.3) +
        pathShape('M75 113Q86 109 91 116Q82 120 73 116Z', '#6E4A2A88') +
        roundedRect(45, 48, 28, 9, 3, Q.error, true, 1.5) +
        strokePath('M50 52H68', Q.paper, 1.2)
      )
      : '')
  );
}

function proposalWaterCooler(empty: boolean): string {
  return proposalShell(
    ellipse(64, 117, 23, 4, '#00000020') +
    roundedRect(51, 25, 26, 32, 9, empty ? '#E8EEF288' : Q.blueGlass, true, 2.5) +
    roundedRect(56, 51, 16, 13, 5, Q.creamShade, true, 2) +
    roundedRect(40, 58, 48, 58, 11, Q.cream, true) +
    roundedRect(46, 65, 36, 24, 7, Q.green) +
    roundedRect(50, 70, 28, 14, 5, Q.recess) +
    roundedRect(51, 91, 12, 11, 4, empty ? Q.error : Q.coral, true, 1.8) +
    roundedRect(66, 91, 12, 11, 4, Q.blueGlass, true, 1.8) +
    roundedRect(51, 105, 27, 6, 3, Q.greenLight) +
    (empty
      ? (
        roundedRect(52, 35, 24, 6, 3, Q.creamLight) +
        roundedRect(49, 74, 30, 10, 3, Q.error, true, 1.5) +
        strokePath('M54 79H74', Q.paper, 1.2)
      )
      : (
        ellipse(64, 47, 9, 3.5, '#CDE1E3AA') +
        strokePath('M55 37Q64 33 73 37', Q.creamLight, 2, 0.8)
      ))
  );
}

function proposalShredder(): string {
  return proposalShell(
    ellipse(64, 117, 19, 4, '#00000020') +
    roundedRect(44, 64, 40, 52, 9, Q.cream, true) +
    roundedRect(40, 61, 48, 14, 7, Q.green, true, 2.5) +
    roundedRect(50, 66, 28, 4, 2, Q.recess) +
    roundedRect(49, 80, 30, 29, 6, Q.greenLight) +
    strokePath('M55 85V104M62 84V106M69 84V106M76 85V103', Q.creamShade, 1.5, 0.8) +
    circle(82, 68, 2.5, Q.coral) +
    pathShape('M54 57L59 45L64 55L70 42L75 58Z', Q.paper, true, 1.5)
  );
}

function proposalMicrowave(): string {
  return proposalShell(
    ellipse(64, 117, 25, 4, '#00000018') +
    roundedRect(35, 80, 58, 36, 9, Q.cream, true) +
    roundedRect(40, 85, 36, 25, 6, Q.green, true, 2) +
    roundedRect(44, 88, 28, 19, 5, Q.recess) +
    ellipse(58, 103, 10, 2.5, Q.metal) +
    roundedRect(79, 85, 10, 25, 4, Q.greenLight) +
    roundedRect(81, 88, 6, 6, 2, Q.coral) +
    circle(83, 100, 1.6, Q.creamLight) +
    circle(86, 100, 1.6, Q.creamLight) +
    roundedRect(37, 87, 4, 21, 2, Q.coral)
  );
}

function proposalFridge(): string {
  return proposalShell(
    ellipse(64, 117, 24, 4.5, '#00000020') +
    roundedRect(38, 28, 52, 88, 11, Q.cream, true) +
    roundedRect(43, 34, 42, 24, 7, Q.green) +
    roundedRect(43, 62, 42, 47, 7, Q.greenLight) +
    strokePath('M43 60H85', Q.creamShade, 2) +
    roundedRect(76, 40, 4, 13, 2, Q.coral) +
    roundedRect(76, 70, 4, 22, 2, Q.coral) +
    roundedRect(50, 70, 17, 17, 2, Q.paper, true, 1.2) +
    strokePath('M53 75H64M53 79H61', Q.metal, 1.1) +
    circle(52, 42, 3, Q.coral, true, 1.2) +
    circle(61, 47, 2.7, Q.blueGlass, true, 1.2) +
    roundedRect(44, 109, 40, 6, 3, Q.recess)
  );
}

function proposalVendingMachine(): string {
  let stock = '';
  const colors = [Q.coral, Q.creamLight, Q.blueGlass, Q.rust, Q.cream, Q.greenLight];
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      stock += roundedRect(
        45 + column * 9,
        48 + row * 14,
        6,
        9,
        2,
        colors[(row * 3 + column) % colors.length],
      );
    }
  }
  return proposalShell(
    ellipse(64, 117, 28, 4.5, '#00000020') +
    roundedRect(34, 25, 60, 91, 11, Q.cream, true) +
    roundedRect(40, 34, 38, 58, 7, Q.green, true, 2) +
    roundedRect(43, 39, 32, 48, 5, Q.recess) +
    stock +
    roundedRect(80, 36, 10, 51, 5, Q.greenLight) +
    roundedRect(82, 42, 6, 8, 2, Q.blueGlass) +
    circle(85, 58, 2.5, Q.coral) +
    roundedRect(82, 66, 6, 12, 2, Q.creamLight) +
    roundedRect(43, 97, 38, 12, 5, Q.recess, true, 2) +
    roundedRect(49, 100, 26, 5, 2, Q.charcoal) +
    roundedRect(39, 110, 50, 5, 3, Q.greenLight)
  );
}

function unscaledProposalServiceMachineSvg(id: ServiceMachineProofId): string {
  switch (id) {
    case 'printer': return proposalPrinter(false);
    case 'printer-jammed': return proposalPrinter(true);
    case 'coffee-machine': return proposalCoffeeMachine(false);
    case 'coffee-machine-broken': return proposalCoffeeMachine(true);
    case 'water-cooler': return proposalWaterCooler(false);
    case 'water-cooler-empty': return proposalWaterCooler(true);
    case 'shredder': return proposalShredder();
    case 'microwave': return proposalMicrowave();
    case 'fridge': return proposalFridge();
    case 'vending-machine': return proposalVendingMachine();
  }
}

export function proposalServiceMachineSvg(id: ServiceMachineProofId): string {
  const source = unscaledProposalServiceMachineSvg(id);
  const scale = SERVICE_MACHINE_GAMEPLAY_ART_SCALES[id];
  return proposalShell(
    `<g transform="translate(64 116) scale(${scale}) translate(-64 -116)">` +
    `${stripSvgShell(source)}</g>`,
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

class ServiceMachineRenderer {
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

  proposal(id: ServiceMachineProofId): string {
    return proposalServiceMachineSvg(id);
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
  renderer: ServiceMachineRenderer,
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
  renderer: ServiceMachineRenderer,
  kind: 'current' | 'proposal',
  id: string,
  footprintX: number,
  footprintY: number,
  cell: number,
  occupancy = true,
): string {
  const template = renderer.template(id);
  const source = kind === 'proposal'
    ? renderer.proposal(id as ServiceMachineProofId)
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
  renderer: ServiceMachineRenderer,
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

type RoomKind = 'copy' | 'break' | 'vending';
type ServiceMachineArt = 'current' | 'proposal';

function roomDimensions(kind: RoomKind): { columns: number; rows: number } {
  return {
    columns: kind === 'copy' ? 8 : kind === 'break' ? 9 : 7,
    rows: 6,
  };
}

function roomScene(
  renderer: ServiceMachineRenderer,
  kind: RoomKind,
  x: number,
  y: number,
  cell: number,
  crowded = false,
  familyArt: ServiceMachineArt = 'proposal',
): string {
  const { columns, rows } = roomDimensions(kind);
  const parts: string[] = [];
  drawGrid(parts, x, y, columns, rows, cell);
  drawWalls(parts, renderer, x, y, columns, rows, cell, 'back');

  if (kind === 'copy') {
    parts.push(
      propPlacement(renderer, familyArt, 'printer', x + cell, y + cell, cell),
      propPlacement(renderer, familyArt, 'shredder', x + 3 * cell, y + cell, cell),
      propPlacement(renderer, 'current', 'copier', x + 5 * cell, y + cell, cell),
      propPlacement(renderer, 'current', 'supply-cabinet', x + 6 * cell, y + 3 * cell, cell),
    );
    const agents: AgentPlacement[] = [
      { recipe: DEFAULT_CAST[0], facing: 'north', x: 1.55, y: 3.4 },
      { recipe: DEFAULT_CAST[1], facing: 'west', x: 4.55, y: 3.5 },
    ];
    if (crowded) {
      agents.push(
        { recipe: DEFAULT_CAST[2], facing: 'east', x: 2.8, y: 4.45 },
        { recipe: DEFAULT_CAST[3], facing: 'south', x: 5.75, y: 4.5 },
      );
    }
    for (const agent of agents) parts.push(agentPlacement(renderer, agent, x, y, cell));
  } else if (kind === 'break') {
    parts.push(
      propPlacement(renderer, familyArt, 'coffee-machine', x + cell, y + cell, cell),
      propPlacement(renderer, familyArt, 'water-cooler', x + 3 * cell, y + cell, cell),
      propPlacement(renderer, familyArt, 'microwave', x + 5 * cell, y + cell, cell),
      propPlacement(renderer, familyArt, 'fridge', x + 7 * cell, y + cell, cell),
    );
    const agents: AgentPlacement[] = [
      { recipe: DEFAULT_CAST[2], facing: 'north', x: 1.55, y: 3.35 },
      { recipe: DEFAULT_CAST[0], facing: 'east', x: 4.45, y: 3.45 },
      { recipe: DEFAULT_CAST[1], facing: 'west', x: 6.7, y: 4.45 },
    ];
    if (crowded) {
      agents.push(
        { recipe: DEFAULT_CAST[3], facing: 'south', x: 3.2, y: 4.55 },
        { recipe: DEFAULT_CAST[0], facing: 'west', pose: 'walk-approach', x: 7.7, y: 3.75 },
      );
    }
    for (const agent of agents) parts.push(agentPlacement(renderer, agent, x, y, cell));
  } else {
    parts.push(
      propPlacement(renderer, familyArt, 'vending-machine', x + 1.25 * cell, y + cell, cell),
      propPlacement(renderer, 'current', 'office-plant', x + 4 * cell, y + cell, cell),
      propPlacement(renderer, 'current', 'trash-bin', x + 5 * cell, y + 3 * cell, cell),
    );
    const agents: AgentPlacement[] = [
      { recipe: DEFAULT_CAST[1], facing: 'north', x: 1.75, y: 3.55 },
      { recipe: DEFAULT_CAST[3], facing: 'west', x: 4.75, y: 4.35 },
    ];
    if (crowded) {
      agents.push(
        { recipe: DEFAULT_CAST[0], facing: 'east', x: 3.1, y: 3.7 },
        { recipe: DEFAULT_CAST[2], facing: 'south', x: 5.7, y: 3.25 },
      );
    }
    for (const agent of agents) parts.push(agentPlacement(renderer, agent, x, y, cell));
  }

  drawWalls(parts, renderer, x, y, columns, rows, cell, 'front');
  return parts.join('');
}

function closeComparison(
  renderer: ServiceMachineRenderer,
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
    placedSvg(renderer.proposal(decision.id), rightX + 7, y + 75, cellSize - 14) +
    text(leftX + cellSize / 2, y + 228, 'CURRENT', 10, 720, MUTED, 'middle') +
    text(rightX + cellSize / 2, y + 228, 'SERVICE SYSTEM', 10, 760, Q.coral, 'middle') +
    wrappedText(x + 16, y + 265, decision.designRead, 44, 18, 12, 630, MUTED) +
    text(
      x + 16,
      y + 344,
      `128u source · ${(PROP_NATIVE_FRAME_CELLS * SERVICE_MACHINE_GAMEPLAY_ART_SCALES[decision.id]).toFixed(2)}-cell art`,
      10,
      650,
      MUTED,
    ) +
    text(x + width - 16, y + 344, 'contract unchanged', 10, 720, Q.green, 'end')
  );
}

function normalRoomCard(
  renderer: ServiceMachineRenderer,
  kind: RoomKind,
  x: number,
  y: number,
  width: number,
  label: string,
  note: string,
  familyArt: ServiceMachineArt = 'proposal',
): string {
  const { columns } = roomDimensions(kind);
  const roomWidth = columns * NORMAL_CELL;
  const roomX = x + (width - roomWidth) / 2;
  const roomY = y + 82;
  return (
    panel(x, y, width, 568, kind === 'break' ? PANEL_ALT : PANEL) +
    text(x + 18, y + 30, label, 18, 820, Q.green) +
    text(x + width - 18, y + 30, '74 px / cell', 10, 760, Q.coral, 'end') +
    text(x + 18, y + 54, note, 11, 610, MUTED) +
    roomScene(renderer, kind, roomX, roomY, NORMAL_CELL, false, familyArt) +
    text(x + 18, y + 542, 'Dashed = preserved 1×1 occupancy · native 2-cell frame', 10, 650, MUTED) +
    text(x + width - 18, y + 542, 'characters = production ×0.65', 10, 650, MUTED, 'end')
  );
}

function failureStateCard(
  renderer: ServiceMachineRenderer,
  x: number,
  y: number,
  width: number,
  familyArt: ServiceMachineArt = 'proposal',
): string {
  const pairs = [
    ['printer', 'printer-jammed', 'JAMMED'],
    ['coffee-machine', 'coffee-machine-broken', 'BROKEN'],
    ['water-cooler', 'water-cooler-empty', 'EMPTY'],
  ] as const;
  let content = '';
  const pairWidth = (width - 36) / 3;
  pairs.forEach(([base, failed, label], index) => {
    const px = x + 12 + index * pairWidth;
    content +=
      text(px + pairWidth / 2, y + 66, label, 10, 780, Q.coral, 'middle') +
      roundedRect(px + 8, y + 78, 116, 116, 9, PANEL_ALT) +
      roundedRect(px + pairWidth - 124, y + 78, 116, 116, 9, PANEL_ALT) +
      placedSvg(
        familyArt === 'proposal' ? renderer.proposal(base) : renderer.current(base),
        px + 14,
        y + 84,
        104,
      ) +
      placedSvg(
        familyArt === 'proposal' ? renderer.proposal(failed) : renderer.current(failed),
        px + pairWidth - 118,
        y + 84,
        104,
      ) +
      text(px + 66, y + 210, 'BASE', 9, 680, MUTED, 'middle') +
      text(px + pairWidth - 66, y + 210, 'STATE', 9, 720, Q.coral, 'middle');
  });
  return (
    panel(x, y, width, 482) +
    text(x + 18, y + 30, 'FAILURE-STATE TWINS', 17, 820, Q.green) +
    text(x + 18, y + 52, 'Damage stays subordinate to a stable base silhouette.', 11, 610, MUTED) +
    content +
    wrappedText(
      x + 18,
      y + 250,
      'The jam, leak, empty bottle, red state marker, and service tag must read without changing placement, footprint, or swap identity.',
      76,
      18,
      12,
      650,
      MUTED,
    ) +
    text(x + 18, y + 454, 'Same parameters · same contact shadows · same facility anchors', 10, 720, Q.green)
  );
}

function interactionCard(
  renderer: ServiceMachineRenderer,
  x: number,
  y: number,
  width: number,
  familyArt: ServiceMachineArt = 'proposal',
): string {
  const cell = 64;
  const roomX = x + (width - 7 * cell) / 2;
  const roomY = y + 70;
  const parts: string[] = [];
  drawGrid(parts, roomX, roomY, 7, 5, cell);
  drawWalls(parts, renderer, roomX, roomY, 7, 5, cell, 'back');
  parts.push(
    propPlacement(renderer, familyArt, 'printer', roomX + cell, roomY + cell, cell),
    propPlacement(renderer, familyArt, 'coffee-machine', roomX + 3 * cell, roomY + cell, cell),
    propPlacement(renderer, familyArt, 'vending-machine', roomX + 5 * cell, roomY + cell, cell),
    agentPlacement(renderer, { recipe: DEFAULT_CAST[0], facing: 'north', x: 1.5, y: 3.45 }, roomX, roomY, cell),
    agentPlacement(renderer, { recipe: DEFAULT_CAST[1], facing: 'north', x: 3.5, y: 3.45 }, roomX, roomY, cell),
    agentPlacement(renderer, { recipe: DEFAULT_CAST[2], facing: 'north', x: 5.5, y: 3.45 }, roomX, roomY, cell),
  );
  drawWalls(parts, renderer, roomX, roomY, 7, 5, cell, 'front');
  return (
    panel(x, y, width, 482, PANEL_ALT) +
    text(x + 18, y + 30, 'INTERACTION SURFACES', 17, 820, Q.green) +
    text(x + 18, y + 52, 'Feed, cup bay, payment, and retrieval faces remain clear.', 11, 610, MUTED) +
    parts.join('') +
    text(x + 18, y + 454, 'Approach lanes and character roots remain unchanged.', 10, 720, Q.green)
  );
}

function crowdedBreakCard(
  renderer: ServiceMachineRenderer,
  x: number,
  y: number,
  width: number,
  familyArt: ServiceMachineArt = 'proposal',
): string {
  const cell = 55;
  const roomWidth = 9 * cell;
  return (
    panel(x, y, width, 482) +
    text(x + 18, y + 30, 'CROWDED BREAK ROOM', 17, 820, Q.green) +
    text(x + width - 18, y + 30, '55 px / cell', 10, 760, Q.coral, 'end') +
    text(x + 18, y + 52, 'Wall context, appliance separation, and five-person crowd.', 11, 610, MUTED) +
    roomScene(
      renderer,
      'break',
      x + (width - roomWidth) / 2,
      y + 67,
      cell,
      true,
      familyArt,
    )
  );
}

function farRoomStrip(
  renderer: ServiceMachineRenderer,
  x: number,
  y: number,
  familyArt: ServiceMachineArt = 'proposal',
  statusText =
    'Review-only: no source SVG authoring, template wiring, export/schema change, Unity import, or commit.',
): string {
  const roomY = y + 68;
  const copyX = x + 24;
  const breakX = copyX + 8 * FAR_CELL + 34;
  const vendingX = breakX + 9 * FAR_CELL + 34;
  return (
    panel(x, y, WIDTH - MARGIN * 2, 450) +
    text(x + 18, y + 30, 'FAR GAMEPLAY ZOOM', 18, 820, Q.green) +
    text(x + 250, y + 30, '40 px / cell · props native 2-cell frame · characters ×0.65', 11, 650, MUTED) +
    roomScene(renderer, 'copy', copyX, roomY, FAR_CELL, true, familyArt) +
    roomScene(renderer, 'break', breakX, roomY, FAR_CELL, true, familyArt) +
    roomScene(renderer, 'vending', vendingX, roomY, FAR_CELL, true, familyArt) +
    text(copyX, y + 330, 'copy / records', 10, 700, MUTED) +
    text(breakX, y + 330, 'break room', 10, 700, MUTED) +
    text(vendingX, y + 330, 'vending bay', 10, 700, MUTED) +
    wrappedText(
      vendingX + 7 * FAR_CELL + 36,
      roomY + 28,
      'Acceptance question: do all seven machines keep their noun and interaction read without relying on tiny controls?',
      46,
      19,
      13,
      700,
      INK,
    ) +
    wrappedText(
      vendingX + 7 * FAR_CELL + 36,
      roomY + 132,
      'Fixed controls: accepted copier, office plant, supply cabinet, completed characters, and 112-unit walls.',
      46,
      19,
      12,
      610,
      MUTED,
    ) +
    wrappedText(
      vendingX + 7 * FAR_CELL + 36,
      roomY + 236,
      statusText,
      46,
      19,
      12,
      720,
      Q.coral,
    )
  );
}

function calibrationSheet(renderer: ServiceMachineRenderer): string {
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" ` +
    `width="${WIDTH}" height="${HEIGHT}">`,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAGE}"/>`,
    text(MARGIN, 42, 'QuotaCo employee-service machines · cohesive family pass', 25, 860, INK),
    text(
      MARGIN,
      68,
      'Accepted Workhorse System grammar applied to paper, drink, break-room, and vending equipment.',
      13,
      620,
      MUTED,
    ),
    text(
      WIDTH - MARGIN,
      42,
      'ACCEPTED DIRECTION · SVG SOURCES AUTHORED',
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
  SERVICE_MACHINE_FAMILY_DECISIONS.forEach((decision, index) => {
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
      'copy',
      MARGIN,
      roomsY,
      roomWidth,
      'COPY / RECORDS ROOM',
      'Printer and shredder beside accepted copier and supply storage.',
    ),
    normalRoomCard(
      renderer,
      'break',
      MARGIN + roomWidth + GAP,
      roomsY,
      roomWidth,
      'BREAK ROOM',
      'Drink and food appliances share one institutional service language.',
    ),
    normalRoomCard(
      renderer,
      'vending',
      MARGIN + (roomWidth + GAP) * 2,
      roomsY,
      roomWidth,
      'VENDING BAY',
      'Vending silhouette and retrieval face beside accepted office plant.',
    ),
  );

  const stressY = roomsY + 588;
  const stressWidth = (WIDTH - MARGIN * 2 - GAP * 2) / 3;
  parts.push(
    failureStateCard(renderer, MARGIN, stressY, stressWidth),
    interactionCard(renderer, MARGIN + stressWidth + GAP, stressY, stressWidth),
    crowdedBreakCard(
      renderer,
      MARGIN + (stressWidth + GAP) * 2,
      stressY,
      stressWidth,
    ),
    farRoomStrip(
      renderer,
      MARGIN,
      stressY + 500,
      'proposal',
      'Accepted code reference. Canonical SVG and imported-output validation are recorded on the production sheet.',
    ),
    text(
      MARGIN,
      HEIGHT - 24,
      'Approval gate: noun read, shared family shell, independent scale, interaction face, state readability, and crowd separation.',
      11,
      680,
      MUTED,
    ),
    text(
      WIDTH - MARGIN,
      HEIGHT - 24,
      'Reference sheet · no Unity import and no commit.',
      11,
      780,
      Q.coral,
      'end',
    ),
    '</svg>',
  );
  return parts.join('');
}

type ServiceMachineSourceMap =
  ReadonlyMap<ServiceMachineProofId, string>;

function productionCloseComparison(
  renderer: ServiceMachineRenderer,
  sources: ServiceMachineSourceMap,
  decision: FamilyDecision,
  x: number,
  y: number,
  width: number,
): string {
  const cellSize = 142;
  const leftX = x + 16;
  const rightX = x + width - 16 - cellSize;
  const canonical = sources.get(decision.id);
  if (!canonical) throw new Error(`Missing canonical SVG ${decision.id}`);
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
      `128u source · ${(PROP_NATIVE_FRAME_CELLS * SERVICE_MACHINE_GAMEPLAY_ART_SCALES[decision.id]).toFixed(2)}-cell art`,
      10,
      650,
      MUTED,
    ) +
    text(x + width - 16, y + 344, 'source-provenanced', 10, 720, Q.green, 'end')
  );
}

function productionFailureStateCard(
  renderer: ServiceMachineRenderer,
  sources: ServiceMachineSourceMap,
  x: number,
  y: number,
  width: number,
): string {
  const states = [
    ['printer-jammed', 'JAMMED'],
    ['coffee-machine-broken', 'BROKEN'],
    ['water-cooler-empty', 'EMPTY'],
  ] as const;
  const columnWidth = (width - 36) / 3;
  let content = '';
  states.forEach(([id, label], index) => {
    const columnX = x + 12 + index * columnWidth;
    const canonical = sources.get(id);
    if (!canonical) throw new Error(`Missing canonical SVG ${id}`);
    content +=
      text(columnX + columnWidth / 2, y + 66, label, 10, 780, Q.coral, 'middle') +
      roundedRect(columnX + 8, y + 78, 116, 116, 9, PANEL_ALT) +
      roundedRect(columnX + columnWidth - 124, y + 78, 116, 116, 9, PANEL_ALT) +
      placedSvg(canonical, columnX + 14, y + 84, 104) +
      placedSvg(renderer.current(id), columnX + columnWidth - 118, y + 84, 104) +
      text(columnX + 66, y + 210, 'CANONICAL', 9, 680, MUTED, 'middle') +
      text(columnX + columnWidth - 66, y + 210, 'IMPORTED', 9, 720, Q.coral, 'middle');
  });
  return (
    panel(x, y, width, 482) +
    text(x + 18, y + 30, 'FAILURE-STATE SOURCE FIDELITY', 17, 820, Q.green) +
    text(x + 18, y + 52, 'Each state is a genuine SVG and keeps the accepted base identity.', 11, 610, MUTED) +
    content +
    wrappedText(
      x + 18,
      y + 250,
      'Jammed, broken, and empty states compile from their own editable sources while retaining the base parameters, contact shadow, footprint, and gameplay swap identity.',
      76,
      18,
      12,
      650,
      MUTED,
    ) +
    text(x + 18, y + 454, 'Ten canonical SVG sources · deterministic imported variants', 10, 720, Q.green)
  );
}

function productionValidationSheet(
  renderer: ServiceMachineRenderer,
  sources: ServiceMachineSourceMap,
): string {
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" ` +
    `width="${WIDTH}" height="${HEIGHT}">`,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAGE}"/>`,
    text(MARGIN, 42, 'QuotaCo employee-service machines · imported-art validation', 25, 860, INK),
    text(
      MARGIN,
      68,
      'Ten canonical artist-editable SVGs beside deterministic Terrarium compositor output.',
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
  SERVICE_MACHINE_FAMILY_DECISIONS.forEach((decision, index) => {
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
      'copy',
      MARGIN,
      roomsY,
      roomWidth,
      'COPY / RECORDS ROOM',
      'Imported printer and shredder beside accepted copier and storage.',
      'current',
    ),
    normalRoomCard(
      renderer,
      'break',
      MARGIN + roomWidth + GAP,
      roomsY,
      roomWidth,
      'BREAK ROOM',
      'Imported drink and food appliances share the accepted service language.',
      'current',
    ),
    normalRoomCard(
      renderer,
      'vending',
      MARGIN + (roomWidth + GAP) * 2,
      roomsY,
      roomWidth,
      'VENDING BAY',
      'Imported vending silhouette and retrieval face beside accepted plant.',
      'current',
    ),
  );

  const stressY = roomsY + 588;
  const stressWidth = (WIDTH - MARGIN * 2 - GAP * 2) / 3;
  parts.push(
    productionFailureStateCard(renderer, sources, MARGIN, stressY, stressWidth),
    interactionCard(
      renderer,
      MARGIN + stressWidth + GAP,
      stressY,
      stressWidth,
      'current',
    ),
    crowdedBreakCard(
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
      'Canonical SVGs and Terrarium template wiring are present. Schema and Unity integration remain unchanged.',
    ),
    text(
      MARGIN,
      HEIGHT - 24,
      'Approval gate: canonical fidelity, noun read, scale, interaction face, state readability, and crowd separation.',
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

export function validateServiceMachineContracts(): {
  readonly pass: boolean;
  readonly errors: readonly string[];
  readonly contracts: readonly ContractSnapshot[];
} {
  const project = defaultProject();
  const errors: string[] = [];
  const contracts: ContractSnapshot[] = [];
  for (const expected of EXPECTED_SERVICE_MACHINE_CONTRACTS) {
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

async function metrics(renderer: ServiceMachineRenderer): Promise<unknown> {
  const validation = validateServiceMachineContracts();
  const sourceAssetPresence = Object.fromEntries(
    await Promise.all(
      SERVICE_MACHINE_SOURCE_IDS.map(async (id) => {
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
      gameplayArtScales: SERVICE_MACHINE_GAMEPLAY_ART_SCALES,
    },
    contractValidation: validation,
    sourceAssetPresence,
    protectedSurfaceHashes,
    proposalRasterStats: Object.fromEntries(
      [...SERVICE_MACHINE_FAMILY_IDS, ...SERVICE_MACHINE_FAILURE_IDS].map((id) => [
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
  const rows = EXPECTED_SERVICE_MACHINE_CONTRACTS.map((contract) => {
    const params = contract.params
      .map(({ key, min, max, step, default: defaultValue }) =>
        `${key} ${min}..${max} step ${step} default ${defaultValue}`)
      .join('; ');
    const shadow = contract.contactShadow
      ? `${contract.contactShadow.cx},${contract.contactShadow.cy} / ${contract.contactShadow.rx}×${contract.contactShadow.ry}`
      : 'none';
    return (
      `| \`${contract.id}\` | ${contract.gridFootprint.w}×${contract.gridFootprint.h} | ` +
      `${shadow} | ${params} |`
    );
  }).join('\n');
  return `# QuotaCo employee-service machine inventory v1

Status: **accepted direction and production-wired SVG family**. Ten canonical
SVG sources and deterministic template wiring are present. Schema and Unity
registration remain unchanged; no Unity import or commit has been made.

Accepted controls:

- \`copier\`
- \`office-plant\`
- \`supply-cabinet\`
- completed production characters at visual scale 0.65
- accepted 112-unit office walls

All machines retain their native 128-unit / two-cell source frame. Their art
envelopes are noun-specific, scale around the y=116 ground pivot, and do not
inherit the character multiplier.

Current review envelopes:

- printer 0.84
- coffee machine 0.84
- water cooler 0.86, with a separately reduced bottle
- shredder 0.82
- microwave 0.85
- fridge 0.86
- vending machine 0.86

| Template | Grid footprint | Contact shadow cx,cy / rx×ry | Parameters |
|---|---:|---:|---|
${rows}

## Shared proposal grammar

- broad cream molded service shells
- dark-green feed, cup, product, and retrieval recesses
- coral controls and failure-state markers
- explicit interaction faces before decorative detail
- employee notes, magnets, paper, and wear as the human counterpoint
- stable base silhouettes across jammed, broken, and empty state swaps

## Production validation gate

Review the canonical-source versus imported-output sheet at close, normal, far,
crowded, wall, failure-state, and interaction views. Unity import remains
deferred.
`;
}

interface RenderResult {
  readonly svgPath: string;
  readonly pngPath: string;
  readonly metricsPath: string;
  readonly inventoryPath: string;
}

export async function renderQuotaCoServiceMachineFamilyCalibration(
  output = path.join('docs', 'previews'),
): Promise<RenderResult> {
  const renderer = new ServiceMachineRenderer();
  const source = calibrationSheet(renderer);
  const png = new Resvg(source, {
    font: { loadSystemFonts: true },
  }).render().asPng();
  await mkdir(output, { recursive: true });
  const base = 'quota-co-service-machine-family-calibration-v1';
  const svgPath = path.join(output, `${base}.svg`);
  const pngPath = path.join(output, `${base}.png`);
  const metricsPath = path.join(output, `${base}-metrics.json`);
  const inventoryPath = path.join(
    output,
    'quota-co-service-machine-family-inventory-v1.md',
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

async function loadServiceMachineSources(): Promise<ServiceMachineSourceMap> {
  const entries = await Promise.all(
    SERVICE_MACHINE_SOURCE_IDS.map(async (id) => [
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
  renderer: ServiceMachineRenderer,
  sources: ServiceMachineSourceMap,
): Promise<unknown> {
  const contractValidation = validateServiceMachineContracts();
  const sourceProvenance = Object.fromEntries(
    await Promise.all(
      SERVICE_MACHINE_SOURCE_IDS.map(async (id) => {
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
  const importerGeneratedArt = Object.values(sourceProvenance).every(
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
    canonicalSvgCount: SERVICE_MACHINE_SOURCE_IDS.length,
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
      bakedGameplayArtScales: SERVICE_MACHINE_GAMEPLAY_ART_SCALES,
    },
    contractValidation,
    sourceProvenance,
    protectedSurfaceHashes,
  };
}

interface ProductionRenderResult {
  readonly svgPath: string;
  readonly pngPath: string;
  readonly metricsPath: string;
}

export async function renderQuotaCoServiceMachineFamilyProductionValidation(
  output = path.join('docs', 'previews'),
): Promise<ProductionRenderResult> {
  const renderer = new ServiceMachineRenderer();
  const sources = await loadServiceMachineSources();
  const source = productionValidationSheet(renderer, sources);
  const png = new Resvg(source, {
    font: { loadSystemFonts: true },
  }).render().asPng();
  await mkdir(output, { recursive: true });
  const base = 'quota-co-service-machine-family-production-validation-v2';
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

if (process.argv[1]?.endsWith('quotaCoServiceMachineFamilyCalibrationPreview.ts')) {
  renderQuotaCoServiceMachineFamilyCalibration(
    parseOutput(process.argv.slice(2)),
  ).then((result) => {
    process.stdout.write(
      'Wrote accepted QuotaCo service-machine direction reference:\n' +
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
