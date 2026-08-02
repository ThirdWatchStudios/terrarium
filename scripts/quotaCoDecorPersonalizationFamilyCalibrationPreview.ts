/**
 * Accepted QuotaCo wall-decor and employee-personalization calibration.
 *
 * Nine genuine SVG sources compile into the existing templates while their
 * gameplay contracts remain fixed. Unity import and commit remain deferred.
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
  propLayers,
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

const WIDTH = 3560;
const HEIGHT = 1850;
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
  coral: '#B65F4D',
  rust: '#98513F',
  charcoal: '#262B29',
  recess: '#18211E',
  paper: '#F4F0E4',
  blueGlass: '#8FB7C0',
  amber: '#E1B464',
  leaf: '#3F7250',
  leafLight: '#648867',
} as const;

export const DECOR_PERSONALIZATION_FAMILY_IDS = [
  'potted-tree',
  'hanging-plant',
  'floor-lamp',
  'framed-art',
  'poster',
  'wall-clock',
  'fish-tank',
  'string-lights',
  'rug',
] as const;

export type DecorPersonalizationFamilyId =
  (typeof DECOR_PERSONALIZATION_FAMILY_IDS)[number];

export const DECOR_PERSONALIZATION_GAMEPLAY_ART_SCALES = {
  'potted-tree': 0.78,
  'hanging-plant': 0.86,
  'floor-lamp': 0.76,
  'framed-art': 0.92,
  poster: 0.74,
  'wall-clock': 0.72,
  'fish-tank': 0.82,
  'string-lights': 1,
  rug: 0.94,
} as const;

interface FamilyDecision {
  readonly id: DecorPersonalizationFamilyId;
  readonly label: string;
  readonly category: string;
  readonly designRead: string;
}

export const DECOR_PERSONALIZATION_FAMILY_DECISIONS:
readonly FamilyDecision[] = [
  {
    id: 'potted-tree',
    label: 'Potted tree',
    category: 'floor greenery',
    designRead: 'umbrella canopy + molded service planter + employee care tag',
  },
  {
    id: 'hanging-plant',
    label: 'Hanging plant',
    category: 'wall greenery',
    designRead: 'catalog wall rail + planter capsule + three readable trailing vines',
  },
  {
    id: 'floor-lamp',
    label: 'Floor lamp',
    category: 'local lighting',
    designRead: 'institutional task standard + broad warm shade + service control',
  },
  {
    id: 'framed-art',
    label: 'Framed art',
    category: 'employee art',
    designRead: 'deep catalog frame + generous mat + unmistakable landscape image',
  },
  {
    id: 'poster',
    label: 'Poster',
    category: 'paper graphic',
    designRead: 'molded clip rail + loose paper + bold employee-made graphic',
  },
  {
    id: 'wall-clock',
    label: 'Wall clock',
    category: 'time fixture',
    designRead: 'rounded service backplate + circular face + clear hands and ticks',
  },
  {
    id: 'fish-tank',
    label: 'Fish tank',
    category: 'living display',
    designRead: 'broad glass bay + molded service plinth + visible fish and plants',
  },
  {
    id: 'string-lights',
    label: 'String lights',
    category: 'employee lighting',
    designRead: 'simple dark cable + cream mounting clips + warm personal bulbs',
  },
  {
    id: 'rug',
    label: 'Office rug',
    category: 'floor personalization',
    designRead: 'soft zone-defining mat + broad institutional bands + repair patch',
  },
] as const;

interface ContractSnapshot {
  readonly id: DecorPersonalizationFamilyId;
  readonly projection: 'plan' | 'elevation';
  readonly placement: NonNullable<PropTemplate['placement']>;
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

function contract(
  id: DecorPersonalizationFamilyId,
  projection: ContractSnapshot['projection'],
  placement: ContractSnapshot['placement'],
  gridFootprint: ContractSnapshot['gridFootprint'],
  contactShadow: ContractSnapshot['contactShadow'],
  params: ContractSnapshot['params'],
  defaultInstanceParams: ContractSnapshot['defaultInstanceParams'],
): ContractSnapshot {
  return {
    id,
    projection,
    placement,
    gridFootprint,
    contactShadow,
    params,
    defaultInstanceParams,
  };
}

export const EXPECTED_DECOR_PERSONALIZATION_CONTRACTS:
readonly ContractSnapshot[] = [
  contract('potted-tree', 'elevation', 'floor', { w: 1, h: 1 }, {
    cx: 64, cy: 117, rx: 17, ry: 4,
  }, [
    { key: 'height', min: 74, max: 100, step: 2, default: 90 },
    { key: 'fullness', min: 1, max: 3, step: 1, default: 2 },
  ], { height: 90, fullness: 2 }),
  contract('hanging-plant', 'plan', 'wall-slot', { w: 1, h: 1 }, null, [
    { key: 'trail', min: 14, max: 34, step: 2, default: 24 },
    { key: 'fullness', min: 1, max: 3, step: 1, default: 2 },
  ], { trail: 24, fullness: 2 }),
  contract('floor-lamp', 'elevation', 'floor', { w: 1, h: 1 }, {
    cx: 64, cy: 117, rx: 12, ry: 3.5,
  }, [
    { key: 'height', min: 78, max: 104, step: 2, default: 92 },
  ], { height: 92 }),
  contract('framed-art', 'plan', 'wall-slot', { w: 1, h: 1 }, null, [
    { key: 'width', min: 28, max: 46, step: 2, default: 36 },
    { key: 'scene', min: 0, max: 2, step: 1, default: 1 },
  ], { width: 36, scene: 1 }),
  contract('poster', 'plan', 'wall-slot', { w: 1, h: 1 }, null, [
    { key: 'lines', min: 1, max: 3, step: 1, default: 2 },
  ], { lines: 2 }),
  contract('wall-clock', 'plan', 'wall-slot', { w: 1, h: 1 }, null, [
    { key: 'time', min: 0, max: 11, step: 1, default: 10 },
  ], { time: 10 }),
  contract('fish-tank', 'elevation', 'floor', { w: 1, h: 1 }, {
    cx: 64, cy: 117, rx: 24, ry: 4.5,
  }, [
    { key: 'fish', min: 1, max: 4, step: 1, default: 3 },
  ], { fish: 3 }),
  contract('string-lights', 'plan', 'wall-slot', { w: 1, h: 1 }, null, [
    { key: 'bulbs', min: 4, max: 8, step: 1, default: 6 },
  ], { bulbs: 6 }),
  contract('rug', 'plan', 'floor', { w: 2, h: 2 }, null, [
    { key: 'width', min: 72, max: 112, step: 4, default: 96 },
    { key: 'pattern', min: 0, max: 2, step: 1, default: 1 },
  ], { width: 96, pattern: 1 }),
] as const;

const DEFAULT_PARAMS = Object.fromEntries(
  EXPECTED_DECOR_PERSONALIZATION_CONTRACTS.map(
    ({ id, defaultInstanceParams }) => [id, defaultInstanceParams],
  ),
) as Record<
  DecorPersonalizationFamilyId,
  Readonly<Record<string, number>>
>;

const WALL_MOUNTED_IDS = new Set<DecorPersonalizationFamilyId>([
  'hanging-plant',
  'framed-art',
  'poster',
  'wall-clock',
  'string-lights',
]);

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
    `<text x="${x}" y="${y}" fill="${fill}" ` +
    'font-family="Inter, Arial, sans-serif" ' +
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

function rr(
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
    `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${fill}" ` +
    `opacity="${opacity}" ` +
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
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ` +
    `opacity="${opacity}" ` +
    (outline
      ? `stroke="${INK}" stroke-width="${strokeWidth}"`
      : 'stroke="none"') +
    '/>'
  );
}

function shape(
  d: string,
  fill: string,
  outline = false,
  strokeWidth = 3,
  opacity = 1,
): string {
  return (
    `<path d="${d}" fill="${fill}" opacity="${opacity}" ` +
    (outline
      ? `stroke="${INK}" stroke-width="${strokeWidth}" ` +
        'stroke-linejoin="round" stroke-linecap="round"'
      : 'stroke="none"') +
    '/>'
  );
}

function stroke(
  d: string,
  color: string,
  strokeWidth = 2,
  opacity = 1,
  dash = '',
): string {
  return (
    `<path d="${d}" fill="none" stroke="${color}" ` +
    `stroke-width="${strokeWidth}" opacity="${opacity}" ` +
    'stroke-linejoin="round" stroke-linecap="round" ' +
    (dash ? `stroke-dasharray="${dash}"` : '') +
    '/>'
  );
}

function shell(markup: string): string {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" ' +
    `width="128" height="128">${markup}</svg>`
  );
}

function proposalPottedTree(
  params: Readonly<Record<string, number>>,
): string {
  const requestedHeight = params.height ?? 90;
  const fullness = Math.round(params.fullness ?? 2);
  const top = 116 - requestedHeight;
  const crownY = top + 22;
  const extra = fullness - 2;
  return (
    ellipse(64, 116, 20, 4, Q.charcoal, false, 0, 0.22) +
    rr(45, 89, 38, 28, 8, Q.cream, true) +
    rr(49, 93, 30, 17, 5, Q.green, true, 2) +
    rr(52, 110, 24, 4, 2, Q.recess) +
    rr(77, 98, 4, 10, 1.5, Q.coral, true, 1.4) +
    rr(53, 96, 13, 7, 2, Q.paper, false) +
    stroke('M56 99H63', Q.charcoal, 1.3) +
    shape('M61 91C60 76 58 64 59 48C62 46 66 46 69 48C70 63 68 76 67 91Z', '#72513A', true, 2) +
    ellipse(63, crownY + 17, 23 + extra * 2, 18 + extra, Q.leaf, true, 2.8) +
    ellipse(49 - extra, crownY + 12, 16 + extra, 14 + extra, Q.leafLight, true, 2.4) +
    ellipse(78 + extra, crownY + 11, 17 + extra, 15 + extra, Q.leaf, true, 2.4) +
    ellipse(64, crownY, 22 + extra * 2, 18 + extra, Q.leafLight, true, 2.8) +
    stroke(
      `M50 ${crownY + 6} Q64 ${crownY + 15} 78 ${crownY + 4}`,
      Q.green,
      2,
      0.75,
    )
  );
}

function proposalHangingPlant(
  params: Readonly<Record<string, number>>,
): string {
  const trail = params.trail ?? 24;
  const fullness = Math.round(params.fullness ?? 2);
  const vines = Math.min(4, fullness + 1);
  let markup =
    rr(39, 35, 50, 13, 6, Q.cream, true) +
    rr(44, 39, 40, 7, 3, Q.green, true, 1.7) +
    rr(82, 39, 4, 7, 1.5, Q.coral) +
    stroke('M48 48L53 56M80 48L75 56', Q.charcoal, 2) +
    shape('M48 55H80L76 69Q64 74 52 69Z', Q.cream, true, 2.5) +
    rr(52, 56, 24, 7, 3, Q.green, false);
  const starts = [54, 61, 68, 75];
  for (let index = 0; index < vines; index += 1) {
    const x = starts[index];
    const sway = index % 2 ? 1 : -1;
    const length = trail * (0.82 + index * 0.08);
    markup += stroke(
      `M${x} 65Q${x + sway * 7} ${65 + length * 0.45} ` +
      `${x + sway * 2} ${65 + length}`,
      Q.leaf,
      2.3,
    );
    for (let leaf = 1; leaf <= 3; leaf += 1) {
      const y = 65 + length * (leaf / 4);
      const leafX = x + sway * (leaf % 2 ? 4 : 1);
      markup += ellipse(
        leafX + (leaf % 2 ? 3 : -3),
        y,
        3.5,
        5,
        leaf % 2 ? Q.leafLight : Q.leaf,
        true,
        1.2,
      );
    }
  }
  return markup;
}

function proposalFloorLamp(
  params: Readonly<Record<string, number>>,
): string {
  const requestedHeight = params.height ?? 92;
  const top = 116 - requestedHeight;
  const shadeBottom = top + 28;
  return (
    ellipse(61, 116, 16, 4, Q.charcoal, false, 0, 0.22) +
    rr(47, 108, 28, 8, 4, Q.cream, true) +
    rr(51, 110, 20, 3, 1.5, Q.green) +
    rr(68, 109, 4, 6, 1.5, Q.coral, true, 1.2) +
    stroke(`M59 108V${shadeBottom + 2}Q59 ${top + 12} 72 ${top + 12}`, Q.charcoal, 5) +
    stroke(`M59 108V${shadeBottom + 2}Q59 ${top + 12} 72 ${top + 12}`, Q.green, 2.2) +
    shape(
      `M61 ${top + 10} Q73 ${top + 3} 86 ${top + 11} L92 ${shadeBottom}` +
      ` Q76 ${shadeBottom + 6} 58 ${shadeBottom} Z`,
      Q.cream,
      true,
      2.8,
    ) +
    rr(62, shadeBottom - 4, 27, 5, 2, Q.amber, true, 1.5) +
    ellipse(76, shadeBottom + 5, 22, 8, Q.amber, false, 0, 0.2) +
    circle(75, top + 15, 4, Q.paper, false)
  );
}

function proposalFramedArt(
  params: Readonly<Record<string, number>>,
): string {
  const width = params.width ?? 36;
  const scene = Math.round(params.scene ?? 1);
  const w = width + 12;
  const h = Math.round(w * 0.72);
  const x = 64 - w / 2;
  const y = 64 - h / 2;
  const innerX = x + 8;
  const innerY = y + 8;
  const innerW = w - 16;
  const innerH = h - 16;
  let image =
    rr(innerX, innerY, innerW, innerH, 1.5, Q.blueGlass, false) +
    circle(innerX + innerW * 0.75, innerY + innerH * 0.28, 4.5, Q.amber) +
    shape(
      `M${innerX} ${innerY + innerH}L${innerX} ${innerY + innerH * 0.62}` +
      `L${innerX + innerW * 0.42} ${innerY + innerH * 0.35}` +
      `L${innerX + innerW * 0.7} ${innerY + innerH * 0.66}` +
      `L${innerX + innerW} ${innerY + innerH * 0.48}` +
      `V${innerY + innerH}Z`,
      scene === 2 ? Q.coral : Q.leaf,
    );
  if (scene >= 1) {
    image += shape(
      `M${innerX} ${innerY + innerH}Q${innerX + innerW / 2} ` +
      `${innerY + innerH * 0.7} ${innerX + innerW} ${innerY + innerH * 0.82}` +
      `V${innerY + innerH}Z`,
      Q.green,
    );
  }
  return (
    rr(x - 4, y - 4, w + 8, h + 8, 7, Q.cream, true) +
    rr(x + 1, y + 1, w - 2, h - 2, 3, Q.green, true, 2) +
    rr(x + 5, y + 5, w - 10, h - 10, 2, Q.paper, false) +
    image +
    rr(x + w - 3, y + h - 13, 4, 9, 1.5, Q.coral, true, 1.2)
  );
}

function proposalPoster(
  params: Readonly<Record<string, number>>,
): string {
  const lines = Math.round(params.lines ?? 2);
  let lineMarkup = '';
  for (let index = 0; index < lines; index += 1) {
    lineMarkup += rr(
      52,
      79 + index * 5,
      25 - index * 3,
      2.4,
      1,
      Q.charcoal,
      false,
      0,
      0.66,
    );
  }
  return (
    rr(44, 36, 40, 12, 5, Q.cream, true) +
    rr(49, 40, 27, 4, 2, Q.green) +
    rr(77, 39, 4, 6, 1.5, Q.coral, true, 1.2) +
    shape('M47 47H81V94L74 100H47Z', Q.paper, true, 2.2) +
    shape('M74 94H81L74 100Z', Q.creamShade, false) +
    circle(64, 61, 9, Q.coral, false) +
    shape('M51 73L61 57L68 68L74 60L78 73Z', Q.green, false) +
    rr(51, 76, 26, 4, 2, Q.green, false) +
    lineMarkup
  );
}

function proposalWallClock(
  params: Readonly<Record<string, number>>,
): string {
  const hour = Math.round(params.time ?? 10);
  const angle = (hour / 12) * Math.PI * 2;
  const cx = 64;
  const cy = 63;
  let ticks = '';
  for (let index = 0; index < 12; index += 1) {
    const a = (index / 12) * Math.PI * 2;
    ticks += circle(
      cx + Math.sin(a) * 13,
      cy - Math.cos(a) * 13,
      index % 3 === 0 ? 1.4 : 0.8,
      Q.charcoal,
    );
  }
  return (
    rr(42, 40, 44, 46, 11, Q.cream, true) +
    rr(47, 45, 34, 35, 8, Q.green, true, 2) +
    circle(cx, cy, 15, Q.paper, true, 2) +
    ticks +
    stroke(
      `M${cx} ${cy}L${cx + Math.sin(angle) * 8} ` +
      `${cy - Math.cos(angle) * 8}`,
      Q.charcoal,
      2.6,
    ) +
    stroke(`M${cx} ${cy}L${cx} ${cy - 11}`, Q.charcoal, 1.8) +
    circle(cx, cy, 2, Q.coral) +
    rr(78, 55, 4, 12, 1.5, Q.coral, true, 1.2)
  );
}

function proposalFishTank(
  params: Readonly<Record<string, number>>,
): string {
  const fish = Math.round(params.fish ?? 3);
  let fishMarkup = '';
  const colors = [Q.coral, Q.amber, Q.paper, Q.rust];
  for (let index = 0; index < fish; index += 1) {
    const x = 43 + index * 17;
    const y = 55 + (index % 2) * 10;
    const dir = index % 2 ? -1 : 1;
    fishMarkup +=
      ellipse(x, y, 5, 3, colors[index % colors.length], true, 1.2) +
      shape(
        `M${x - dir * 5} ${y}L${x - dir * 10} ${y - 4}` +
        `V${y + 4}Z`,
        colors[index % colors.length],
        true,
        1,
      ) +
      circle(x + dir * 2.2, y - 0.5, 0.8, Q.charcoal);
  }
  return (
    ellipse(64, 116, 29, 4, Q.charcoal, false, 0, 0.22) +
    rr(22, 38, 84, 46, 7, Q.green, true) +
    rr(27, 43, 74, 35, 3, Q.blueGlass, true, 1.7) +
    rr(29, 45, 70, 4, 2, '#C9E2E2', false, 0, 0.8) +
    rr(25, 35, 78, 8, 4, Q.cream, true, 2) +
    rr(31, 38, 48, 3, 1.5, Q.green, false) +
    rr(84, 37, 13, 4, 1.5, Q.coral, false) +
    shape('M28 74Q45 68 60 73T100 69V78H28Z', '#8B7A60', false) +
    stroke('M35 73Q31 58 37 50M43 73Q49 61 45 53', Q.leaf, 2.2) +
    circle(88, 54, 1.5, Q.paper, false, 0, 0.65) +
    circle(91, 49, 1, Q.paper, false, 0, 0.55) +
    fishMarkup +
    rr(36, 83, 56, 34, 7, Q.cream, true) +
    rr(42, 89, 44, 19, 4, Q.green, true, 2) +
    rr(46, 93, 22, 10, 2, Q.recess, false) +
    rr(72, 93, 9, 10, 2, Q.paper, false) +
    circle(76.5, 98, 1.7, Q.coral) +
    rr(85, 91, 4, 14, 1.5, Q.coral, true, 1.2) +
    rr(43, 111, 42, 4, 2, Q.recess)
  );
}

function proposalStringLights(
  params: Readonly<Record<string, number>>,
): string {
  const bulbs = Math.round(params.bulbs ?? 6);
  const y0 = 49;
  const sag = 13;
  let markup =
    rr(3, 43, 12, 13, 5, Q.cream, true, 1.8) +
    rr(113, 43, 12, 13, 5, Q.cream, true, 1.8) +
    rr(7, 47, 5, 5, 2, Q.green) +
    rr(116, 47, 5, 5, 2, Q.coral) +
    stroke(`M12 ${y0} Q64 ${y0 + sag} 116 ${y0}`, Q.charcoal, 2.4);
  for (let index = 0; index < bulbs; index += 1) {
    const t = (index + 0.5) / bulbs;
    const x = 12 + t * 104;
    const y = y0 + Math.sin(t * Math.PI) * sag;
    markup +=
      stroke(`M${x} ${y}V${y + 5}`, Q.charcoal, 1.6) +
      circle(x, y + 9, 6.5, Q.amber, false, 0, 0.2) +
      ellipse(x, y + 8, 3.6, 4.5, Q.amber, true, 1.2) +
      stroke(`M${x - 1} ${y + 7}Q${x} ${y + 10} ${x + 1} ${y + 7}`, Q.paper, 0.9);
  }
  return markup;
}

function proposalRug(
  params: Readonly<Record<string, number>>,
): string {
  const width = params.width ?? 96;
  const pattern = Math.round(params.pattern ?? 1);
  const x = 64 - width / 2;
  const y = 37;
  const h = 54;
  let patternMarkup =
    rr(x + 8, y + 8, width - 16, h - 16, 10, Q.green, false) +
    stroke(
      `M${x + 15} ${y + h / 2}H${x + width - 15}`,
      Q.creamLight,
      7,
      0.8,
    );
  if (pattern >= 1) {
    patternMarkup +=
      circle(64, y + h / 2, 11, Q.coral, false, 0, 0.75) +
      circle(64, y + h / 2, 5, Q.creamLight, false);
  }
  if (pattern >= 2) {
    patternMarkup +=
      stroke(`M${x + 18} ${y + 12}L${x + 30} ${y + h - 12}`, Q.greenLight, 4) +
      stroke(`M${x + width - 18} ${y + 12}L${x + width - 30} ${y + h - 12}`, Q.greenLight, 4);
  }
  return (
    rr(x, y, width, h, 15, Q.cream, true, 2.6) +
    patternMarkup +
    rr(x + width - 18, y + h - 12, 13, 7, 3, Q.rust, true, 1.2)
  );
}

function unscaledProposal(
  id: DecorPersonalizationFamilyId,
  params: Readonly<Record<string, number>>,
): string {
  switch (id) {
    case 'potted-tree': return proposalPottedTree(params);
    case 'hanging-plant': return proposalHangingPlant(params);
    case 'floor-lamp': return proposalFloorLamp(params);
    case 'framed-art': return proposalFramedArt(params);
    case 'poster': return proposalPoster(params);
    case 'wall-clock': return proposalWallClock(params);
    case 'fish-tank': return proposalFishTank(params);
    case 'string-lights': return proposalStringLights(params);
    case 'rug': return proposalRug(params);
  }
}

export function proposalDecorPersonalizationSvg(
  id: DecorPersonalizationFamilyId,
  params: Readonly<Record<string, number>> = DEFAULT_PARAMS[id],
): string {
  const pivotY = WALL_MOUNTED_IDS.has(id) || id === 'rug' ? 64 : 116;
  const scale = DECOR_PERSONALIZATION_GAMEPLAY_ART_SCALES[id];
  return shell(
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

class DecorRenderer {
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
    `<rect x="${x}" y="${y}" width="${columns * cell}" ` +
    `height="${rows * cell}" fill="${FLOOR}" ` +
    'stroke="#56616A" stroke-width="2"/>',
  );
  for (let column = 1; column < columns; column += 1) {
    parts.push(stroke(
      `M${x + column * cell} ${y}V${y + rows * cell}`,
      FLOOR_LINE,
      1,
      0.16,
    ));
  }
  for (let row = 1; row < rows; row += 1) {
    parts.push(stroke(
      `M${x} ${y + row * cell}H${x + columns * cell}`,
      FLOOR_LINE,
      1,
      0.16,
    ));
  }
}

function drawWalls(
  parts: string[],
  renderer: DecorRenderer,
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
    parts.push(
      renderer.wallTile(10, x + column * cell, y + (rows - 1) * cell, cell),
    );
  }
  parts.push(
    renderer.wallTile(
      9,
      x + (columns - 1) * cell,
      y + (rows - 1) * cell,
      cell,
    ),
  );
}

function propPlacement(
  renderer: DecorRenderer,
  kind: 'current' | 'proposal',
  id: string,
  footprintX: number,
  footprintY: number,
  cell: number,
  occupancy = true,
  params?: Readonly<Record<string, number>>,
): string {
  const template = renderer.template(id);
  const source = kind === 'proposal' &&
      DECOR_PERSONALIZATION_FAMILY_IDS.includes(
        id as DecorPersonalizationFamilyId,
      )
    ? proposalDecorPersonalizationSvg(
        id as DecorPersonalizationFamilyId,
        params,
      )
    : renderer.current(id, params);
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

function wallPlacement(
  renderer: DecorRenderer,
  kind: 'current' | 'proposal',
  id: DecorPersonalizationFamilyId,
  cellX: number,
  wallY: number,
  cell: number,
  params?: Readonly<Record<string, number>>,
): string {
  const source = kind === 'proposal'
    ? proposalDecorPersonalizationSvg(id, params)
    : renderer.current(id, params);
  const spriteSize = cell * PROP_NATIVE_FRAME_CELLS;
  return placedSvg(
    source,
    cellX + cell / 2 - spriteSize / 2,
    wallY + cell / 2 - spriteSize / 2,
    spriteSize,
  );
}

interface AgentPlacement {
  readonly recipe: CharacterRecipe;
  readonly facing: Facing | 'west';
  readonly pose?: Pose;
  readonly x: number;
  readonly y: number;
}

function agentPlacement(
  renderer: DecorRenderer,
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

type RoomKind = 'lounge' | 'gallery' | 'quiet';

function roomDimensions(kind: RoomKind): { columns: number; rows: number } {
  return {
    columns: kind === 'gallery' ? 10 : 9,
    rows: kind === 'gallery' ? 5 : 7,
  };
}

function roomScene(
  renderer: DecorRenderer,
  kind: RoomKind,
  x: number,
  y: number,
  cell: number,
  crowded = false,
  decorArt: 'current' | 'proposal' = 'proposal',
): string {
  const { columns, rows } = roomDimensions(kind);
  const parts: string[] = [];
  drawGrid(parts, x, y, columns, rows, cell);

  if (kind === 'lounge') {
    parts.push(
      propPlacement(renderer, decorArt, 'rug', x + 3 * cell, y + 2 * cell, cell, false),
    );
  } else if (kind === 'quiet') {
    parts.push(
      propPlacement(renderer, decorArt, 'rug', x + 2 * cell, y + 2 * cell, cell, false),
    );
  }

  drawWalls(parts, renderer, x, y, columns, rows, cell, 'back');

  if (kind === 'lounge') {
    parts.push(
      wallPlacement(renderer, decorArt, 'string-lights', x + 1.1 * cell, y, cell),
      wallPlacement(renderer, decorArt, 'framed-art', x + 4 * cell, y, cell),
      wallPlacement(renderer, decorArt, 'wall-clock', x + 6.8 * cell, y, cell),
      propPlacement(renderer, 'current', 'couch', x + cell, y + 2 * cell, cell),
      propPlacement(renderer, 'current', 'coffee-table', x + 4 * cell, y + 3.2 * cell, cell),
      propPlacement(renderer, decorArt, 'potted-tree', x + 7.1 * cell, y + cell, cell),
      propPlacement(renderer, decorArt, 'floor-lamp', x + 6 * cell, y + 2.2 * cell, cell),
    );
    const agents: AgentPlacement[] = [
      { recipe: DEFAULT_CAST[0], facing: 'north', x: 2.1, y: 5.3 },
      { recipe: DEFAULT_CAST[1], facing: 'west', x: 5.2, y: 5.4 },
      { recipe: DEFAULT_CAST[2], facing: 'east', x: 6.8, y: 4.6 },
    ];
    if (crowded) {
      agents.push(
        { recipe: DEFAULT_CAST[3], facing: 'south', x: 4.1, y: 5.65 },
        { recipe: DEFAULT_CAST[0], facing: 'west', pose: 'walk-approach', x: 7.45, y: 5.6 },
      );
    }
    for (const agent of agents) {
      parts.push(agentPlacement(renderer, agent, x, y, cell));
    }
  } else if (kind === 'gallery') {
    parts.push(
      wallPlacement(renderer, decorArt, 'poster', x + 1.25 * cell, y, cell),
      wallPlacement(renderer, decorArt, 'framed-art', x + 3.3 * cell, y, cell),
      wallPlacement(renderer, decorArt, 'hanging-plant', x + 5.2 * cell, y, cell),
      wallPlacement(renderer, decorArt, 'wall-clock', x + 7 * cell, y, cell),
      wallPlacement(renderer, decorArt, 'poster', x + 8.35 * cell, y, cell, { lines: 3 }),
      propPlacement(renderer, 'current', 'waiting-bench', x + 2 * cell, y + 2 * cell, cell),
      propPlacement(renderer, decorArt, 'potted-tree', x + 7.7 * cell, y + cell, cell),
    );
    const agents: AgentPlacement[] = [
      { recipe: DEFAULT_CAST[2], facing: 'east', x: 1.7, y: 3.7 },
      { recipe: DEFAULT_CAST[0], facing: 'west', x: 5.2, y: 3.8 },
      { recipe: DEFAULT_CAST[3], facing: 'north', x: 8.2, y: 3.6 },
    ];
    if (crowded) {
      agents.push({ recipe: DEFAULT_CAST[1], facing: 'south', x: 6.5, y: 4.1 });
    }
    for (const agent of agents) {
      parts.push(agentPlacement(renderer, agent, x, y, cell));
    }
  } else {
    parts.push(
      wallPlacement(renderer, decorArt, 'framed-art', x + 1.2 * cell, y, cell, { width: 44, scene: 2 }),
      wallPlacement(renderer, decorArt, 'hanging-plant', x + 4 * cell, y, cell, { trail: 32, fullness: 3 }),
      wallPlacement(renderer, decorArt, 'string-lights', x + 6.3 * cell, y, cell, { bulbs: 5 }),
      propPlacement(renderer, decorArt, 'fish-tank', x + 6.6 * cell, y + cell, cell),
      propPlacement(renderer, decorArt, 'floor-lamp', x + 1.1 * cell, y + 2.1 * cell, cell),
      propPlacement(renderer, 'current', 'lounge-seating', x + 2.2 * cell, y + 2 * cell, cell),
      propPlacement(renderer, 'current', 'coffee-table', x + 4.1 * cell, y + 4 * cell, cell),
    );
    const agents: AgentPlacement[] = [
      { recipe: DEFAULT_CAST[1], facing: 'north', x: 2.8, y: 5.1 },
      { recipe: DEFAULT_CAST[3], facing: 'west', x: 5.65, y: 5.45 },
    ];
    if (crowded) {
      agents.push(
        { recipe: DEFAULT_CAST[0], facing: 'east', x: 6.9, y: 4.55 },
        { recipe: DEFAULT_CAST[2], facing: 'south', x: 4.55, y: 5.8 },
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
  renderer: DecorRenderer,
  decision: FamilyDecision,
  x: number,
  y: number,
  width: number,
): string {
  const wallMounted = WALL_MOUNTED_IDS.has(decision.id);
  const half = (width - 10) / 2;
  const artSize = Math.min(150, half - 12);
  const leftX = x + 5;
  const rightX = x + half + 10;
  const artY = y + 83;
  const background = wallMounted ? '#D8D0BF' : FLOOR;
  const backgroundY = wallMounted ? artY + 20 : artY + artSize * 0.63;
  const backgroundHeight = wallMounted ? artSize - 32 : artSize * 0.37;
  return (
    panel(x, y, width, 356) +
    text(x + 14, y + 27, decision.label.toUpperCase(), 11, 780, Q.green) +
    text(x + 14, y + 47, decision.category, 10, 650, MUTED) +
    rr(leftX, artY, artSize, artSize, 7, PANEL_ALT) +
    rr(rightX, artY, artSize, artSize, 7, PANEL_ALT) +
    rr(leftX, backgroundY, artSize, backgroundHeight, 0, background) +
    rr(rightX, backgroundY, artSize, backgroundHeight, 0, background) +
    placedSvg(renderer.current(decision.id), leftX, artY, artSize) +
    placedSvg(
      proposalDecorPersonalizationSvg(decision.id),
      rightX,
      artY,
      artSize,
    ) +
    text(leftX + artSize / 2, artY + artSize + 18, 'IMPORTED', 9, 700, MUTED, 'middle') +
    text(rightX + artSize / 2, artY + artSize + 18, 'ACCEPTED', 9, 780, Q.coral, 'middle') +
    wrappedText(
      x + 14,
      y + 282,
      decision.designRead,
      38,
      14,
      10,
      560,
      MUTED,
    ) +
    text(
      x + width - 12,
      y + 339,
      `${DECOR_PERSONALIZATION_GAMEPLAY_ART_SCALES[decision.id].toFixed(2)} art`,
      9,
      680,
      Q.green,
      'end',
    )
  );
}

function roomCard(
  renderer: DecorRenderer,
  kind: RoomKind,
  title: string,
  subtitle: string,
  x: number,
  y: number,
  width: number,
  decorArt: 'current' | 'proposal' = 'proposal',
): string {
  const { columns } = roomDimensions(kind);
  const roomWidth = columns * NORMAL_CELL;
  const roomX = x + (width - roomWidth) / 2;
  const roomY = y + 78;
  return (
    panel(x, y, width, 580) +
    text(x + 18, y + 28, title, 14, 780, Q.green) +
    text(x + 18, y + 49, subtitle, 10, 560, MUTED) +
    roomScene(renderer, kind, roomX, roomY, NORMAL_CELL, false, decorArt) +
    text(
      x + width - 18,
      y + 563,
      `${NORMAL_CELL} px / cell · characters ×0.65 · props independently scaled`,
      9,
      650,
      MUTED,
      'end',
    )
  );
}

function wallRegisterCard(
  renderer: DecorRenderer,
  x: number,
  y: number,
  width: number,
  decorArt: 'current' | 'proposal' = 'proposal',
): string {
  const cell = 60;
  const columns = 8;
  const roomX = x + 24;
  const roomY = y + 74;
  const parts: string[] = [];
  drawGrid(parts, roomX, roomY, columns, 3, cell);
  drawWalls(parts, renderer, roomX, roomY, columns, 3, cell, 'back');
  parts.push(
    wallPlacement(renderer, decorArt, 'poster', roomX + 0.7 * cell, roomY, cell),
    wallPlacement(renderer, decorArt, 'framed-art', roomX + 2.2 * cell, roomY, cell),
    wallPlacement(renderer, decorArt, 'hanging-plant', roomX + 4 * cell, roomY, cell),
    wallPlacement(renderer, decorArt, 'wall-clock', roomX + 5.4 * cell, roomY, cell),
    wallPlacement(renderer, decorArt, 'string-lights', roomX + 6.3 * cell, roomY, cell),
  );
  drawWalls(parts, renderer, roomX, roomY, columns, 3, cell, 'front');
  return (
    panel(x, y, width, 338) +
    text(x + 18, y + 28, 'WALL REGISTER + SLOT CONTEXT', 13, 780, Q.green) +
    text(
      x + 18,
      y + 49,
      'One mounting grammar; five distinct nouns; no projection or wall datum change.',
      10,
      560,
      MUTED,
    ) +
    parts.join('') +
    text(
      x + width - 18,
      y + 322,
      `accepted wall datum ${WALL_DATUM}u`,
      9,
      680,
      Q.coral,
      'end',
    )
  );
}

function occlusionCard(
  renderer: DecorRenderer,
  x: number,
  y: number,
  width: number,
  decorArt: 'current' | 'proposal' = 'proposal',
): string {
  const cell = 62;
  const roomX = x + 24;
  const roomY = y + 74;
  const parts: string[] = [];
  drawGrid(parts, roomX, roomY, 8, 4, cell);
  drawWalls(parts, renderer, roomX, roomY, 8, 4, cell, 'back');
  parts.push(
    propPlacement(renderer, decorArt, 'potted-tree', roomX + 0.8 * cell, roomY + cell, cell),
    propPlacement(renderer, decorArt, 'floor-lamp', roomX + 2 * cell, roomY + cell, cell),
    propPlacement(renderer, decorArt, 'fish-tank', roomX + 6.1 * cell, roomY + cell, cell),
    propPlacement(renderer, 'current', 'desk', roomX + 2.8 * cell, roomY + 1.5 * cell, cell),
    agentPlacement(
      renderer,
      { recipe: DEFAULT_CAST[0], facing: 'north', x: 4.2, y: 3.3 },
      roomX,
      roomY,
      cell,
    ),
  );
  drawWalls(parts, renderer, roomX, roomY, 8, 4, cell, 'front');
  return (
    panel(x, y, width, 338) +
    text(x + 18, y + 28, 'DESK OCCLUSION + CHARACTER SCALE', 13, 780, Q.green) +
    text(
      x + 18,
      y + 49,
      'Tree, lamp, and tank remain legible around an accepted desk and locked employee.',
      10,
      560,
      MUTED,
    ) +
    parts.join('') +
    text(
      x + width - 18,
      y + 322,
      'props do not inherit ×0.65',
      9,
      680,
      Q.coral,
      'end',
    )
  );
}

function crowdedCard(
  renderer: DecorRenderer,
  x: number,
  y: number,
  width: number,
  decorArt: 'current' | 'proposal' = 'proposal',
): string {
  const cell = 48;
  return (
    panel(x, y, width, 338) +
    text(x + 18, y + 28, 'CROWDED PERSONAL LOUNGE', 13, 780, Q.green) +
    text(
      x + 18,
      y + 49,
      'Warm details stay subordinate to furniture, circulation, and employee silhouettes.',
      10,
      560,
      MUTED,
    ) +
    roomScene(renderer, 'lounge', x + 25, y + 68, cell, true, decorArt) +
    text(
      x + width - 18,
      y + 322,
      'crowd + wall context + silhouette separation',
      9,
      680,
      MUTED,
      'end',
    )
  );
}

function farStrip(
  renderer: DecorRenderer,
  x: number,
  y: number,
  width: number,
  decorArt: 'current' | 'proposal' = 'proposal',
): string {
  const cardHeight = 388;
  const roomY = y + 72;
  const loungeWidth = roomDimensions('lounge').columns * FAR_CELL;
  const galleryWidth = roomDimensions('gallery').columns * FAR_CELL;
  const quietWidth = roomDimensions('quiet').columns * FAR_CELL;
  const total = loungeWidth + galleryWidth + quietWidth + 44;
  const startX = x + (width - total) / 2;
  const galleryX = startX + loungeWidth + 22;
  const quietX = galleryX + galleryWidth + 22;
  return (
    panel(x, y, width, cardHeight, PANEL_ALT) +
    text(x + 18, y + 29, 'FAR GAMEPLAY ZOOM · 40 PX / CELL', 13, 780, Q.green) +
    text(
      x + 18,
      y + 50,
      'Does personalization survive as warm landmarks without becoming visual noise?',
      10,
      560,
      MUTED,
    ) +
    roomScene(renderer, 'lounge', startX, roomY, FAR_CELL, true, decorArt) +
    roomScene(renderer, 'gallery', galleryX, roomY, FAR_CELL, true, decorArt) +
    roomScene(renderer, 'quiet', quietX, roomY, FAR_CELL, true, decorArt) +
    text(startX, y + cardHeight - 18, 'LOUNGE', 9, 720, Q.green) +
    text(galleryX, y + cardHeight - 18, 'GALLERY', 9, 720, Q.green) +
    text(quietX, y + cardHeight - 18, 'QUIET NOOK', 9, 720, Q.green) +
    text(
      x + width - 18,
      y + cardHeight - 18,
      decorArt === 'current'
        ? 'imported SVG output · Unity deferred'
        : 'accepted proposal reference',
      9,
      720,
      Q.coral,
      'end',
    )
  );
}

function calibrationSheet(renderer: DecorRenderer): string {
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" ` +
    `height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">`,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAGE}"/>`,
    text(MARGIN, 46, 'QUOTACO DECOR + PERSONALIZATION FAMILY', 25, 820, Q.green),
    text(
      MARGIN,
      70,
      'Accepted Catalog Personalization System · imported templates versus accepted reference',
      12,
      600,
      MUTED,
    ),
    text(
      WIDTH - MARGIN,
      45,
      '128u authoring · 112u walls · characters ×0.65',
      11,
      720,
      Q.coral,
      'end',
    ),
    text(
      WIDTH - MARGIN,
      67,
      'props independently scaled · contracts unchanged',
      10,
      620,
      MUTED,
      'end',
    ),
  ];

  const closeY = 92;
  const closeWidth = (WIDTH - MARGIN * 2 - GAP * 8) / 9;
  DECOR_PERSONALIZATION_FAMILY_DECISIONS.forEach((decision, index) => {
    parts.push(closeComparison(
      renderer,
      decision,
      MARGIN + index * (closeWidth + GAP),
      closeY,
      closeWidth,
    ));
  });

  const roomsY = closeY + 374;
  const roomWidth = (WIDTH - MARGIN * 2 - GAP * 2) / 3;
  parts.push(
    roomCard(
      renderer,
      'lounge',
      'EMPLOYEE LOUNGE',
      'Accepted furniture carries the room; décor adds specific lived-in warmth.',
      MARGIN,
      roomsY,
      roomWidth,
    ),
    roomCard(
      renderer,
      'gallery',
      'HALLWAY GALLERY',
      'Wall-slot scale and noun separation against the accepted wall system.',
      MARGIN + roomWidth + GAP,
      roomsY,
      roomWidth,
    ),
    roomCard(
      renderer,
      'quiet',
      'QUIET NOOK',
      'Living display, local light, greenery, and employee graphics in one room.',
      MARGIN + (roomWidth + GAP) * 2,
      roomsY,
      roomWidth,
    ),
  );

  const stressY = roomsY + 598;
  const stressWidth = (WIDTH - MARGIN * 2 - GAP * 2) / 3;
  parts.push(
    wallRegisterCard(renderer, MARGIN, stressY, stressWidth),
    occlusionCard(renderer, MARGIN + stressWidth + GAP, stressY, stressWidth),
    crowdedCard(
      renderer,
      MARGIN + (stressWidth + GAP) * 2,
      stressY,
      stressWidth,
    ),
    farStrip(renderer, MARGIN, stressY + 356, WIDTH - MARGIN * 2),
    text(
      MARGIN,
      HEIGHT - 24,
      'Approval gate: noun read, one mounting grammar, employee warmth, independent scale, wall register, occlusion, and far separation.',
      11,
      680,
      MUTED,
    ),
    text(
      WIDTH - MARGIN,
      HEIGHT - 24,
      'SVG sources and Terrarium templates wired · no Unity import or commit.',
      11,
      780,
      Q.coral,
      'end',
    ),
    '</svg>',
  );
  return parts.join('');
}

type DecorSourceMap = ReadonlyMap<DecorPersonalizationFamilyId, string>;

async function loadDecorSources(): Promise<DecorSourceMap> {
  return new Map(
    await Promise.all(
      DECOR_PERSONALIZATION_FAMILY_IDS.map(async (id) => [
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
  renderer: DecorRenderer,
  sources: DecorSourceMap,
  decision: FamilyDecision,
  x: number,
  y: number,
  width: number,
): string {
  const canonical = sources.get(decision.id);
  if (!canonical) throw new Error(`Missing canonical SVG ${decision.id}`);
  const wallMounted = WALL_MOUNTED_IDS.has(decision.id);
  const half = (width - 10) / 2;
  const artSize = Math.min(150, half - 12);
  const leftX = x + 5;
  const rightX = x + half + 10;
  const artY = y + 83;
  const background = wallMounted ? '#D8D0BF' : FLOOR;
  const backgroundY = wallMounted ? artY + 20 : artY + artSize * 0.63;
  const backgroundHeight = wallMounted ? artSize - 32 : artSize * 0.37;
  return (
    panel(x, y, width, 356) +
    text(x + 14, y + 27, decision.label.toUpperCase(), 11, 780, Q.green) +
    text(x + 14, y + 47, decision.category, 10, 650, MUTED) +
    rr(leftX, artY, artSize, artSize, 7, PANEL_ALT) +
    rr(rightX, artY, artSize, artSize, 7, PANEL_ALT) +
    rr(leftX, backgroundY, artSize, backgroundHeight, 0, background) +
    rr(rightX, backgroundY, artSize, backgroundHeight, 0, background) +
    placedSvg(canonical, leftX, artY, artSize) +
    placedSvg(renderer.current(decision.id), rightX, artY, artSize) +
    text(
      leftX + artSize / 2,
      artY + artSize + 18,
      'CANONICAL SVG',
      9,
      700,
      MUTED,
      'middle',
    ) +
    text(
      rightX + artSize / 2,
      artY + artSize + 18,
      'IMPORTED OUTPUT',
      9,
      780,
      Q.coral,
      'middle',
    ) +
    wrappedText(
      x + 14,
      y + 282,
      decision.designRead,
      38,
      14,
      10,
      560,
      MUTED,
    ) +
    text(
      x + width - 12,
      y + 339,
      `${DECOR_PERSONALIZATION_GAMEPLAY_ART_SCALES[decision.id].toFixed(2)} art · source-provenanced`,
      9,
      680,
      Q.green,
      'end',
    )
  );
}

function productionValidationSheet(
  renderer: DecorRenderer,
  sources: DecorSourceMap,
): string {
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" ` +
    `height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">`,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAGE}"/>`,
    text(MARGIN, 46, 'QUOTACO DECOR + PERSONALIZATION · CANONICAL IMPORT', 25, 820, Q.green),
    text(
      MARGIN,
      70,
      'Nine artist-editable SVGs beside Terrarium output with automatic prop styling disabled',
      12,
      600,
      MUTED,
    ),
    text(
      WIDTH - MARGIN,
      45,
      'CANONICAL STROKES · GLOBAL PROP STYLE OFF',
      11,
      780,
      Q.coral,
      'end',
    ),
    text(
      WIDTH - MARGIN,
      67,
      '128u authoring · 112u walls · characters ×0.65 · props independently scaled',
      10,
      620,
      MUTED,
      'end',
    ),
  ];

  const closeY = 92;
  const closeWidth = (WIDTH - MARGIN * 2 - GAP * 8) / 9;
  DECOR_PERSONALIZATION_FAMILY_DECISIONS.forEach((decision, index) => {
    parts.push(productionCloseComparison(
      renderer,
      sources,
      decision,
      MARGIN + index * (closeWidth + GAP),
      closeY,
      closeWidth,
    ));
  });

  const roomsY = closeY + 374;
  const roomWidth = (WIDTH - MARGIN * 2 - GAP * 2) / 3;
  parts.push(
    roomCard(
      renderer,
      'lounge',
      'EMPLOYEE LOUNGE',
      'Imported décor remains subordinate to accepted furniture and employee silhouettes.',
      MARGIN,
      roomsY,
      roomWidth,
      'current',
    ),
    roomCard(
      renderer,
      'gallery',
      'HALLWAY GALLERY',
      'Imported wall-slot art preserves noun separation against accepted walls.',
      MARGIN + roomWidth + GAP,
      roomsY,
      roomWidth,
      'current',
    ),
    roomCard(
      renderer,
      'quiet',
      'QUIET NOOK',
      'Imported tank, light, greenery, and graphics retain the approved room read.',
      MARGIN + (roomWidth + GAP) * 2,
      roomsY,
      roomWidth,
      'current',
    ),
  );

  const stressY = roomsY + 598;
  const stressWidth = (WIDTH - MARGIN * 2 - GAP * 2) / 3;
  parts.push(
    wallRegisterCard(renderer, MARGIN, stressY, stressWidth, 'current'),
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
    farStrip(
      renderer,
      MARGIN,
      stressY + 356,
      WIDTH - MARGIN * 2,
      'current',
    ),
    text(
      MARGIN,
      HEIGHT - 24,
      'Validation gate: canonical paint order, source fidelity, noun read, independent scale, wall register, occlusion, crowding, and far separation.',
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

export function validateDecorPersonalizationContracts(): {
  readonly pass: boolean;
  readonly errors: readonly string[];
  readonly contracts: readonly ContractSnapshot[];
} {
  const project = defaultProject();
  const errors: string[] = [];
  const contracts: ContractSnapshot[] = [];
  const facilities = new Map(
    facilityCatalogJson().facilities.map(
      (facility) => [facility.propId, facility],
    ),
  );
  for (const expected of EXPECTED_DECOR_PERSONALIZATION_CONTRACTS) {
    const template = PROP_TEMPLATES.find(({ id }) => id === expected.id);
    const instance = project.props.find(
      ({ templateId }) => templateId === expected.id,
    );
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
      placement: template.placement ?? 'floor',
      gridFootprint: { ...template.gridFootprint },
      contactShadow: template.footprint ? { ...template.footprint } : null,
      params: template.params.map(
        ({ key, min, max, step, default: defaultValue }) => ({
          key,
          min,
          max,
          step,
          default: defaultValue,
        }),
      ),
      defaultInstanceParams: { ...instance.params },
    };
    contracts.push(actual);
    if (!sameJson(actual, expected)) {
      errors.push(`contract drift for ${expected.id}`);
    }
    if (!facilities.has(expected.id)) {
      errors.push(`missing facility catalog entry ${expected.id}`);
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

async function metrics(renderer: DecorRenderer): Promise<unknown> {
  const contractValidation = validateDecorPersonalizationContracts();
  const sourceAssetPresence = Object.fromEntries(
    await Promise.all(
      DECOR_PERSONALIZATION_FAMILY_IDS.map(async (id) => {
        const file = path.join(
          'assets',
          'props',
          'quota-co-workhorse-v1',
          `${id}.svg`,
        );
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
      PROTECTED_SURFACES.map(
        async (file) => [file, await fileHash(file)] as const,
      ),
    ),
  );
  return {
    reviewStatus: 'accepted-direction-reference',
    productionPromotion: true,
    sourceSvgAuthoring: true,
    templateMutation: true,
    defaultMutation: true,
    unityImport: false,
    commitCreated: false,
    exportContractMutation: false,
    schemaMutation: false,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    authoringCanvas: AUTHORING_CANVAS,
    acceptedWallDatum: WALL_DATUM,
    characterVisualScale: CHARACTER_VISUAL_SCALE,
    propScalePolicy: 'independent-per-noun',
    familyDirection: 'catalog-personalization-system',
    decisions: DECOR_PERSONALIZATION_FAMILY_DECISIONS,
    gameplayArtScales: DECOR_PERSONALIZATION_GAMEPLAY_ART_SCALES,
    contractValidation,
    sourceAssetPresence,
    protectedSurfaceHashes,
    rasterStats: Object.fromEntries(
      DECOR_PERSONALIZATION_FAMILY_IDS.map((id) => [
        id,
        {
          close: rasterStats(
            proposalDecorPersonalizationSvg(id),
            AUTHORING_CANVAS,
          ),
          far: rasterStats(proposalDecorPersonalizationSvg(id), FAR_CELL),
          currentClose: rasterStats(renderer.current(id), AUTHORING_CANVAS),
        },
      ]),
    ),
    evaluationContexts: [
      'close-current-versus-proposal',
      'normal-employee-lounge',
      'normal-hallway-gallery',
      'normal-quiet-nook',
      'wall-slot-register',
      'desk-occlusion',
      'crowded-lounge',
      'far-gameplay-strip',
    ],
  };
}

async function productionMetrics(
  renderer: DecorRenderer,
  sources: DecorSourceMap,
): Promise<unknown> {
  const contractValidation = validateDecorPersonalizationContracts();
  const props = defaultProject().props;
  const sourceProvenance = Object.fromEntries(
    DECOR_PERSONALIZATION_FAMILY_IDS.map((id) => {
      const source = sources.get(id);
      if (!source) throw new Error(`Missing canonical SVG ${id}`);
      const imported = authoredPropArt(id);
      const instance = props.find(({ templateId }) => templateId === id);
      if (!instance) throw new Error(`Missing default instance ${id}`);
      const sourceSha256 = createHash('sha256').update(source).digest('hex');
      const expected = EXPECTED_DECOR_PERSONALIZATION_CONTRACTS.find(
        (contract) => contract.id === id,
      );
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
          projectionMatches: imported?.projection === expected?.projection,
          defaultExportLayerCount: propLayers(instance, DEFAULT_STYLE).length,
          defaultExportTints: propLayers(instance, DEFAULT_STYLE)
            .map(({ tint }) => tint),
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
    canonicalSvgCount: DECOR_PERSONALIZATION_FAMILY_IDS.length,
    importerGeneratedArt,
    authoredSvgStylePolicy: {
      globalRestylingDefault: false,
      compositorOutlineDefault: false,
      compositorContactShadowDefault: false,
      exportLayerMode: 'single-resolved-untinted',
      explicitOptIn: 'restyleAuthoredSvg',
    },
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
      gameplayArtScales: DECOR_PERSONALIZATION_GAMEPLAY_ART_SCALES,
    },
    contractValidation,
    sourceProvenance,
  };
}

function inventoryMarkdown(): string {
  const rows = EXPECTED_DECOR_PERSONALIZATION_CONTRACTS.map((entry) => {
    const scale = DECOR_PERSONALIZATION_GAMEPLAY_ART_SCALES[entry.id];
    const params = entry.params
      .map((param) =>
        `${param.key} ${param.min}–${param.max} step ${param.step} default ${param.default}`
      )
      .join('; ');
    const shadow = entry.contactShadow
      ? `${entry.contactShadow.rx}×${entry.contactShadow.ry} @ ` +
        `${entry.contactShadow.cx},${entry.contactShadow.cy}`
      : 'none';
    return (
      `| ${entry.id} | ${entry.projection} / ${entry.placement} | ` +
      `${entry.gridFootprint.w}×${entry.gridFootprint.h} | ${shadow} | ` +
      `${scale} | ${params} |`
    );
  }).join('\n');
  return `# QuotaCo decor + personalization family · accepted inventory

Status: **accepted direction and production-wired SVG family**. Nine canonical
SVG sources now compile into deterministic parameter variants through the
existing templates. No export-contract, schema, Unity registration, Unity
import, or commit changed.

## Locked contracts

| Prop | Projection / placement | Grid | Contact shadow | Review art scale | Parameters |
| --- | --- | --- | --- | --- | --- |
${rows}

## Accepted family rule

- Cream molded mounts, rails, planter shells, frames, and service plinths provide
  the QuotaCo institutional grammar.
- Dark-green bays, backplates, and supports make mounting and maintenance explicit.
- Coral is reserved for latches, controls, repair patches, and service access.
- Employee warmth lives inside or on top of that infrastructure: actual landscape
  art, loose poster paper, plant care tags, fish, warm bulbs, and a repaired rug.
- Every noun keeps a distinct silhouette and an obvious use surface.
- Plan/elevation projection, wall-slot placement, footprints, pivots, navigation,
  parameters, interaction metadata, export cells, and Unity registration stay fixed.
- The character 0.65 multiplier is not applied to props; each review art scale is
  chosen independently.

## Review gate

Review canonical-source versus imported-output close comparisons, accepted-wall
register, literal normal rooms, desk occlusion, employee interaction, crowded
circulation, and far gameplay zoom. Unity import remains deferred.
`;
}

interface RenderResult {
  readonly svgPath: string;
  readonly pngPath: string;
  readonly metricsPath: string;
  readonly inventoryPath: string;
}

export async function renderQuotaCoDecorPersonalizationFamilyCalibration(
  output = path.join('docs', 'previews'),
): Promise<RenderResult> {
  const renderer = new DecorRenderer();
  const source = calibrationSheet(renderer);
  const png = new Resvg(source, {
    font: { loadSystemFonts: true },
  }).render().asPng();
  await mkdir(output, { recursive: true });
  const base = 'quota-co-decor-personalization-family-calibration-v1';
  const svgPath = path.join(output, `${base}.svg`);
  const pngPath = path.join(output, `${base}.png`);
  const metricsPath = path.join(output, `${base}-metrics.json`);
  const inventoryPath = path.join(
    output,
    'quota-co-decor-personalization-family-inventory-v1.md',
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

export async function renderQuotaCoDecorPersonalizationFamilyProductionValidation(
  output = path.join('docs', 'previews'),
): Promise<ProductionRenderResult> {
  const renderer = new DecorRenderer();
  const sources = await loadDecorSources();
  const source = productionValidationSheet(renderer, sources);
  const png = new Resvg(source, {
    font: { loadSystemFonts: true },
  }).render().asPng();
  await mkdir(output, { recursive: true });
  const base = 'quota-co-decor-personalization-family-production-validation-v2';
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

if (
  process.argv[1]?.endsWith(
    'quotaCoDecorPersonalizationFamilyCalibrationPreview.ts',
  )
) {
  renderQuotaCoDecorPersonalizationFamilyCalibration(
    parseOutput(process.argv.slice(2)),
  ).then((result) => {
    process.stdout.write(
      'Wrote accepted QuotaCo decor/personalization calibration:\n' +
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
