/**
 * Review-only calibration for the QuotaCo storage and support family.
 *
 * This file deliberately keeps the redesign code-owned until the visual
 * direction is accepted. It does not author canonical SVG sources, replace
 * production templates, change export/schema surfaces, touch Unity, or commit.
 */
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
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
const HEIGHT = 1980;
const MARGIN = 34;
const GAP = 16;
const AUTHORING_CANVAS = 128;
const NORMAL_CELL = 66;
const FAR_CELL = 40;
const WALL_DATUM = 112;
const CHARACTER_VISUAL_SCALE = 0.65;
const CHARACTER_FRAME_CELLS = 1.55 * CHARACTER_VISUAL_SCALE;
export const STORAGE_SUPPORT_NATIVE_FRAME_CELLS = 2;

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
  blue: '#517A88',
  yellow: '#D5A94B',
  metal: '#8E9690',
  coat: '#9A6846',
} as const;

export const STORAGE_SUPPORT_FAMILY_IDS = [
  'bookshelf',
  'lockers',
  'open-shelving',
  'pantry-shelf',
  'mail-station',
  'server-rack',
  'coat-rack',
] as const;

export type StorageSupportFamilyId =
  (typeof STORAGE_SUPPORT_FAMILY_IDS)[number];

/**
 * Review-only art envelopes inside each prop's unchanged native two-cell frame.
 * Elevation sprites scale around the accepted y=116 ground pivot.
 */
export const STORAGE_SUPPORT_GAMEPLAY_ART_SCALES = {
  bookshelf: 0.8,
  lockers: 0.8,
  'open-shelving': 0.8,
  'pantry-shelf': 0.78,
  'mail-station': 0.8,
  'server-rack': 0.8,
  'coat-rack': 0.72,
} as const;

interface FamilyDecision {
  readonly id: StorageSupportFamilyId;
  readonly label: string;
  readonly category: string;
  readonly designRead: string;
}

export const STORAGE_SUPPORT_FAMILY_DECISIONS:
readonly FamilyDecision[] = [
  {
    id: 'bookshelf',
    label: 'Bookshelf',
    category: 'reference storage',
    designRead: 'closed molded shell; books and one personal plant remain literal',
  },
  {
    id: 'lockers',
    label: 'Lockers',
    category: 'employee storage',
    designRead: 'repeated doors, vents, labels, and front handles carry the noun',
  },
  {
    id: 'open-shelving',
    label: 'Open shelving',
    category: 'supply storage',
    designRead: 'open structural uprights with removable catalog bins',
  },
  {
    id: 'pantry-shelf',
    label: 'Pantry shelf',
    category: 'food storage',
    designRead: 'washable shell; packages, mugs, and caddy distinguish the bay',
  },
  {
    id: 'mail-station',
    label: 'Mail station',
    category: 'mail sorting',
    designRead: 'open pigeonhole matrix over a projecting sort shelf and parcel bays',
  },
  {
    id: 'server-rack',
    label: 'Server rack',
    category: 'technical support',
    designRead: 'exposed rack rails, repeated horizontal servers, cooling, and cable spine',
  },
  {
    id: 'coat-rack',
    label: 'Coat rack',
    category: 'entry support',
    designRead: 'compact molded post and horizontal hook crown; one coat carries use',
  },
] as const;

interface ContractSnapshot {
  readonly id: StorageSupportFamilyId;
  readonly projection: 'elevation';
  readonly gridFootprint: { readonly w: number; readonly h: number };
  readonly contactShadow: NonNullable<PropTemplate['footprint']>;
  readonly params: readonly {
    readonly key: string;
    readonly min: number;
    readonly max: number;
    readonly step: number;
    readonly default: number;
  }[];
  readonly defaultInstanceParams: Readonly<Record<string, number>>;
  readonly blocksWalk: boolean;
  readonly interactionType: string | null;
}

function storageContract(
  id: StorageSupportFamilyId,
  contactShadow: ContractSnapshot['contactShadow'],
  params: ContractSnapshot['params'],
  defaultInstanceParams: Readonly<Record<string, number>>,
  interactionType: string | null = null,
): ContractSnapshot {
  return {
    id,
    projection: 'elevation',
    gridFootprint: { w: 1, h: 1 },
    contactShadow,
    params,
    defaultInstanceParams,
    blocksWalk: true,
    interactionType,
  };
}

export const EXPECTED_STORAGE_SUPPORT_CONTRACTS:
readonly ContractSnapshot[] = [
  storageContract(
    'bookshelf',
    { cx: 64, cy: 117, rx: 24, ry: 4.5 },
    [
      { key: 'shelves', min: 3, max: 5, step: 1, default: 4 },
      { key: 'fill', min: 1, max: 3, step: 1, default: 3 },
    ],
    { shelves: 4, fill: 3 },
  ),
  storageContract(
    'lockers',
    { cx: 64, cy: 117, rx: 27, ry: 4.5 },
    [
      { key: 'columns', min: 2, max: 4, step: 1, default: 3 },
      { key: 'height', min: 72, max: 92, step: 2, default: 84 },
    ],
    { columns: 3, height: 84 },
  ),
  storageContract(
    'open-shelving',
    { cx: 64, cy: 117, rx: 26, ry: 4.5 },
    [
      { key: 'shelves', min: 3, max: 5, step: 1, default: 4 },
      { key: 'fill', min: 1, max: 3, step: 1, default: 3 },
    ],
    { shelves: 4, fill: 3 },
  ),
  storageContract(
    'pantry-shelf',
    { cx: 64, cy: 117, rx: 25, ry: 4.5 },
    [{ key: 'shelves', min: 2, max: 4, step: 1, default: 3 }],
    { shelves: 3 },
  ),
  storageContract(
    'mail-station',
    { cx: 64, cy: 117, rx: 24, ry: 4.5 },
    [
      { key: 'height', min: 48, max: 72, step: 2, default: 60 },
      { key: 'columns', min: 3, max: 5, step: 1, default: 4 },
    ],
    { height: 60, columns: 4 },
    'mail_station',
  ),
  storageContract(
    'server-rack',
    { cx: 64, cy: 117, rx: 21, ry: 4.5 },
    [
      { key: 'height', min: 72, max: 94, step: 2, default: 86 },
      { key: 'units', min: 3, max: 6, step: 1, default: 5 },
    ],
    { height: 86, units: 5 },
  ),
  storageContract(
    'coat-rack',
    { cx: 64, cy: 117, rx: 12, ry: 3.5 },
    [{ key: 'hooks', min: 2, max: 5, step: 1, default: 4 }],
    { hooks: 4 },
  ),
] as const;

const DEFAULT_PARAMS = Object.fromEntries(
  EXPECTED_STORAGE_SUPPORT_CONTRACTS.map(({ id, defaultInstanceParams }) => [
    id,
    defaultInstanceParams,
  ]),
) as Record<StorageSupportFamilyId, Readonly<Record<string, number>>>;

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
    (outline ? `stroke="${INK}" stroke-width="${strokeWidth}"` : 'stroke="none"') +
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
    (outline ? `stroke="${INK}" stroke-width="${strokeWidth}"` : 'stroke="none"') +
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

function bookBlock(
  x: number,
  bottom: number,
  width: number,
  height: number,
  fill: string,
): string {
  return (
    roundedRect(x, bottom - height, width, height, 1.2, fill, true, 1.2) +
    strokePath(`M${x + 2} ${bottom - height + 3}V${bottom - 2}`, Q.paper, 0.8, 0.7)
  );
}

function proposalBookshelf(params: Readonly<Record<string, number>>): string {
  const shelves = Math.round(params.shelves ?? 4);
  const fill = Math.round(params.fill ?? 3);
  const width = 54;
  const height = 82 + (shelves - 4) * 7;
  const x = 64 - width / 2;
  const top = 116 - height;
  const bayX = x + 7;
  const bayY = top + 9;
  const bayW = width - 14;
  const bayH = height - 18;
  const shelfH = bayH / shelves;
  let contents = '';
  const colors = [Q.coral, Q.blue, Q.yellow, Q.olive, Q.paper, Q.greenLight];
  for (let shelf = 0; shelf < shelves; shelf += 1) {
    const bottom = bayY + (shelf + 1) * shelfH - 3;
    contents += roundedRect(bayX + 1, bottom, bayW - 2, 3, 1.5, Q.creamShade);
    const count = Math.max(2, fill + (shelf % 2));
    for (let index = 0; index < count; index += 1) {
      const bw = 4 + ((shelf + index) % 3);
      const bh = Math.min(shelfH - 7, 10 + ((shelf * 3 + index * 2) % 7));
      contents += bookBlock(
        bayX + 4 + index * 8,
        bottom,
        bw,
        bh,
        colors[(shelf + index) % colors.length],
      );
    }
  }
  return (
    ellipse(64, 117, 27, 4.5, '#000000', false, 0, 0.13) +
    roundedRect(x, top, width, height, 9, Q.cream, true) +
    roundedRect(x + 4, top + 4, width - 8, 7, 3, Q.creamLight, true, 1.5) +
    roundedRect(bayX, bayY, bayW, bayH, 4, Q.recess, true, 1.8) +
    contents +
    roundedRect(x + width - 8, top + 19, 4, 16, 2, Q.coral, true, 1.2) +
    roundedRect(x + 5, 111, width - 10, 5, 2, Q.green, true, 1.4) +
    roundedRect(x + 8, top - 4, 18, 5, 2, Q.coral, true, 1.2) +
    roundedRect(x + 10, top - 7, 14, 4, 1.5, Q.blue, true, 1.1) +
    roundedRect(x + width - 17, top - 3, 10, 5, 2, Q.coat, true, 1.1) +
    shapePath(
      `M${x + width - 12} ${top - 3}Q${x + width - 23} ${top - 15} ${x + width - 13} ${top - 16}` +
      `Q${x + width - 3} ${top - 13} ${x + width - 12} ${top - 3}Z`,
      Q.greenLight,
      true,
      1.2,
    )
  );
}

function proposalLockers(params: Readonly<Record<string, number>>): string {
  const columns = Math.round(params.columns ?? 3);
  const height = params.height ?? 84;
  const width = 56;
  const x = 64 - width / 2;
  const top = 116 - height;
  const innerX = x + 6;
  const innerY = top + 9;
  const innerW = width - 12;
  const innerH = height - 17;
  const doorW = innerW / columns;
  let doors = '';
  for (let index = 0; index < columns; index += 1) {
    const dx = innerX + index * doorW;
    doors +=
      roundedRect(dx + 1, innerY, doorW - 2, innerH, 3, index % 2 ? Q.greenLight : Q.green, true, 1.4) +
      roundedRect(dx + 3, innerY + 5, doorW - 6, 5, 1.5, Q.cream, true, 0.9) +
      strokePath(
        `M${dx + 4} ${innerY + 16}H${dx + doorW - 4}M${dx + 4} ${innerY + 20}H${dx + doorW - 4}`,
        Q.recess,
        1.1,
        0.8,
      ) +
      roundedRect(dx + doorW - 6, innerY + innerH * 0.47, 3, 11, 1.2, Q.coral, true, 0.9);
  }
  return (
    ellipse(64, 117, 29, 4.5, '#000000', false, 0, 0.13) +
    roundedRect(x, top, width, height, 9, Q.cream, true) +
    roundedRect(x + 4, top + 4, width - 8, 7, 3, Q.creamLight, true, 1.4) +
    doors +
    roundedRect(x + 5, 111, width - 10, 5, 2, Q.green, true, 1.4) +
    roundedRect(x + width - 8, top + 13, 4, 13, 2, Q.coral, true, 1)
  );
}

function proposalOpenShelving(params: Readonly<Record<string, number>>): string {
  const shelves = Math.round(params.shelves ?? 4);
  const fill = Math.round(params.fill ?? 3);
  const width = 58;
  const height = 82 + (shelves - 4) * 6;
  const x = 64 - width / 2;
  const top = 116 - height;
  const shelfGap = (height - 15) / shelves;
  let markup = '';
  for (let shelf = 0; shelf <= shelves; shelf += 1) {
    const sy = top + 7 + shelf * shelfGap;
    markup += roundedRect(x + 4, sy, width - 8, 5, 2.2, shelf === 0 ? Q.creamLight : Q.cream, true, 1.5);
  }
  const binColors = [Q.green, Q.olive, Q.greenLight, Q.coral];
  for (let shelf = 0; shelf < shelves; shelf += 1) {
    const bottom = top + 7 + (shelf + 1) * shelfGap;
    const count = Math.max(1, Math.min(3, fill - (shelf % 2 === 0 ? 0 : 1)));
    const binW = (width - 17) / 3;
    for (let index = 0; index < count; index += 1) {
      const bx = x + 8 + index * (binW + 2);
      markup +=
        shapePath(
          `M${bx} ${bottom - 17}H${bx + binW}L${bx + binW - 2} ${bottom - 3}` +
          `H${bx + 2}Z`,
          binColors[(shelf + index) % binColors.length],
          true,
          1.3,
        ) +
        roundedRect(bx + 3, bottom - 13, binW - 6, 4, 1, Q.paper, true, 0.8);
    }
  }
  return (
    ellipse(64, 117, 29, 4.5, '#000000', false, 0, 0.12) +
    roundedRect(x, top + 3, 7, height - 3, 3.5, Q.cream, true) +
    roundedRect(x + width - 7, top + 3, 7, height - 3, 3.5, Q.cream, true) +
    roundedRect(x - 1, top, width + 2, 9, 4, Q.creamLight, true) +
    markup +
    roundedRect(x + width - 5, top + 16, 3, 14, 1.5, Q.coral, true, 1)
  );
}

function proposalPantryShelf(params: Readonly<Record<string, number>>): string {
  const shelves = Math.round(params.shelves ?? 3);
  const width = 54;
  const height = 67 + (shelves - 3) * 9;
  const x = 64 - width / 2;
  const top = 116 - height;
  const bayX = x + 7;
  const bayY = top + 11;
  const bayW = width - 14;
  const bayH = height - 21;
  const shelfH = bayH / shelves;
  let contents = '';
  const packageColors = [Q.coral, Q.yellow, Q.blue, Q.paper, Q.greenLight];
  for (let shelf = 0; shelf < shelves; shelf += 1) {
    const bottom = bayY + (shelf + 1) * shelfH - 2;
    contents += roundedRect(bayX + 1, bottom, bayW - 2, 3, 1.2, Q.creamShade);
    const start = shelf === 0 ? 7 : 4;
    for (let index = 0; index < 3; index += 1) {
      const px = bayX + start + index * 10;
      if (shelf === shelves - 1 && index === 2) {
        contents +=
          circle(px + 3, bottom - 6, 5, Q.paper, true, 1.2) +
          circle(px + 3, bottom - 6, 2.2, Q.coral);
      } else {
        const ph = 9 + ((shelf + index) % 3) * 3;
        contents +=
          roundedRect(px, bottom - ph, 7, ph, 1.5, packageColors[(shelf + index) % packageColors.length], true, 1.1) +
          roundedRect(px + 1.5, bottom - ph + 2, 4, 2, 0.7, Q.paper);
      }
    }
  }
  return (
    ellipse(64, 117, 27, 4.5, '#000000', false, 0, 0.12) +
    roundedRect(x, top, width, height, 9, Q.cream, true) +
    roundedRect(x + 4, top + 4, width - 8, 8, 3, Q.creamLight, true, 1.4) +
    roundedRect(bayX, bayY, bayW, bayH, 4, Q.green, true, 1.7) +
    contents +
    roundedRect(x + width - 8, top + 15, 4, 13, 2, Q.coral, true, 1) +
    roundedRect(x + 6, 111, width - 12, 5, 2, Q.green, true, 1.3)
  );
}

function proposalMailStation(params: Readonly<Record<string, number>>): string {
  const height = (params.height ?? 60) + 8;
  const columns = Math.round(params.columns ?? 4);
  const width = 78;
  const x = 64 - width / 2;
  const top = 116 - height;
  const faceX = x + 8;
  const faceY = top + 13;
  const faceW = width - 16;
  const sorterH = Math.max(27, height * 0.51);
  const rows = 3;
  const cellW = faceW / columns;
  const cellH = sorterH / rows;
  let cubbies = '';
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const cx = faceX + column * cellW;
      const cy = faceY + row * cellH;
      cubbies += roundedRect(
        cx + 1,
        cy + 1,
        cellW - 2,
        cellH - 2,
        1.2,
        Q.recess,
        true,
        0.9,
      );
      if (
        (row === 0 && column % 2 === 0) ||
        (row === 1 && column === columns - 1) ||
        (row === 2 && column === 1)
      ) {
        const envelopeY = cy + cellH * 0.35;
        cubbies +=
          roundedRect(
            cx + 2.5,
            envelopeY,
            cellW - 5,
            Math.max(3.5, cellH * 0.48),
            0.8,
            Q.paper,
            true,
            0.7,
          ) +
          strokePath(
            `M${cx + 3} ${envelopeY + 1}L${cx + cellW / 2} ${envelopeY + cellH * 0.33}` +
            `L${cx + cellW - 3} ${envelopeY + 1}`,
            Q.creamShade,
            0.7,
          );
      }
      if (row === 2 && column === columns - 1) {
        cubbies += shapePath(
          `M${cx + 2} ${cy + cellH - 2}L${cx + 5} ${cy + 2}` +
          `H${cx + cellW - 3}L${cx + cellW - 1} ${cy + cellH - 2}Z`,
          Q.paper,
          true,
          0.7,
        );
      }
    }
  }
  const counterY = faceY + sorterH + 2;
  const parcelY = counterY + 8;
  const parcelH = 116 - parcelY - 5;
  const parcelGap = 4;
  const parcelW = (faceW - parcelGap) / 2;
  return (
    ellipse(64, 117, 38, 4.5, '#000000', false, 0, 0.13) +
    roundedRect(x + 2, top + 3, width - 4, height - 3, 8, Q.cream, true) +
    roundedRect(x + 5, top, width - 10, 11, 4, Q.creamLight, true, 1.6) +
    roundedRect(x + 10, top + 3, 18, 5, 1.5, Q.coral, true, 0.9) +
    roundedRect(faceX, faceY, faceW, sorterH, 3, Q.green, true, 1.6) +
    cubbies +
    roundedRect(x - 2, counterY, width + 4, 8, 3, Q.creamLight, true, 1.7) +
    roundedRect(faceX, parcelY, parcelW, parcelH, 3, Q.green, true, 1.3) +
    roundedRect(faceX + parcelW + parcelGap, parcelY, parcelW, parcelH, 3, Q.greenLight, true, 1.3) +
    roundedRect(faceX + 5, parcelY + 4, parcelW - 10, 5, 1.2, Q.coral, true, 0.8) +
    shapePath(
      `M${faceX + parcelW + parcelGap + 4} ${parcelY + parcelH - 3}` +
      `V${parcelY + 5}H${faceX + faceW - 5}V${parcelY + parcelH - 3}Z`,
      Q.paper,
      true,
      0.9,
    ) +
    roundedRect(x + 7, 111, width - 14, 5, 2, Q.green, true, 1.2)
  );
}

function proposalServerRack(params: Readonly<Record<string, number>>): string {
  const height = params.height ?? 86;
  const units = Math.round(params.units ?? 5);
  const width = 58;
  const x = 64 - width / 2;
  const top = 116 - height;
  const bayX = x + 10;
  const bayY = top + 12;
  const bayW = width - 22;
  const bayH = height - 22;
  const unitH = bayH / units;
  let unitsMarkup = '';
  for (let index = 0; index < units; index += 1) {
    const uy = bayY + index * unitH + 1;
    unitsMarkup +=
      roundedRect(
        bayX + 1,
        uy,
        bayW - 2,
        unitH - 2,
        1.3,
        index % 2 ? Q.charcoal : Q.green,
        true,
        1,
      ) +
      roundedRect(bayX + 4, uy + 2, 3, unitH - 6, 1, Q.metal, true, 0.6) +
      roundedRect(bayX + bayW - 7, uy + 2, 3, unitH - 6, 1, Q.metal, true, 0.6) +
      circle(bayX + 11, uy + (unitH - 2) / 2, 1.5, index % 3 === 0 ? Q.yellow : Q.greenLight, true, 0.6) +
      circle(bayX + 15, uy + (unitH - 2) / 2, 1.2, Q.coral, true, 0.6) +
      strokePath(
        `M${bayX + 19} ${uy + unitH * 0.38}H${bayX + bayW - 10}` +
        `M${bayX + 19} ${uy + unitH * 0.66}H${bayX + bayW - 10}`,
        Q.metal,
        0.9,
        0.85,
      );
  }
  let railHoles = '';
  for (let index = 0; index < 7; index += 1) {
    const holeY = bayY + 4 + index * ((bayH - 8) / 6);
    railHoles +=
      circle(x + 7, holeY, 1.1, Q.metal, true, 0.5) +
      circle(x + width - 7, holeY, 1.1, Q.metal, true, 0.5);
  }
  return (
    ellipse(64, 117, 30, 4.5, '#000000', false, 0, 0.15) +
    roundedRect(x + 4, top + 7, width - 8, height - 12, 3, Q.recess, true, 1.8) +
    roundedRect(x, top, width, 11, 4, Q.charcoal, true, 2.4) +
    circle(x + 19, top + 5.5, 3.2, Q.metal, true, 1) +
    circle(x + 29, top + 5.5, 3.2, Q.metal, true, 1) +
    strokePath(`M${x + 16} ${top + 5.5}H${x + 32}`, Q.recess, 0.8, 0.7) +
    roundedRect(x, top + 7, 8, height - 9, 3, Q.charcoal, true, 2) +
    roundedRect(x + width - 8, top + 7, 8, height - 9, 3, Q.charcoal, true, 2) +
    railHoles +
    roundedRect(bayX, bayY, bayW, bayH, 2, Q.recess, true, 1.3) +
    unitsMarkup +
    roundedRect(x + width - 5, top + 19, 6, height - 34, 2.5, Q.green, true, 1.2) +
    strokePath(
      `M${x + width - 2} ${top + 25}Q${x + width + 6} ${top + 34} ${x + width - 2} ${top + 43}` +
      `Q${x + width - 9} ${top + 52} ${x + width - 2} ${top + 61}`,
      Q.coral,
      2,
    ) +
    roundedRect(x - 2, 109, width + 4, 7, 3, Q.charcoal, true, 2) +
    roundedRect(x + 5, 111, width - 10, 4, 1.5, Q.green, true, 1)
  );
}

function proposalCoatRack(params: Readonly<Record<string, number>>): string {
  const hooks = Math.round(params.hooks ?? 4);
  const top = 42;
  const crownWidth = 23 + hooks * 3;
  const crownX = 64 - crownWidth / 2;
  let pegs = '';
  for (let index = 0; index < hooks; index += 1) {
    const px = crownX + 6 + index * ((crownWidth - 12) / Math.max(1, hooks - 1));
    pegs +=
      roundedRect(px - 2, top + 8, 4, 9, 2, Q.cream, true, 1.2) +
      circle(px, top + 17, 2.4, Q.coral, true, 0.8);
  }
  return (
    ellipse(64, 117, 15, 4.5, '#000000', false, 0, 0.14) +
    roundedRect(52, 109, 24, 7, 3.5, Q.green, true, 2) +
    roundedRect(59, top + 8, 10, 68, 5, Q.cream, true, 2.5) +
    roundedRect(crownX, top, crownWidth, 12, 6, Q.creamLight, true, 2.5) +
    pegs +
    roundedRect(61, top + 18, 6, 7, 3, Q.coral, true, 1.2) +
    shapePath(
      `M${64 + crownWidth * 0.25} ${top + 15}` +
      `Q${78 + crownWidth * 0.1} ${top + 28} ${77 + crownWidth * 0.1} ${top + 51}` +
      `L${70 + crownWidth * 0.1} ${top + 61}H${62 + crownWidth * 0.1}` +
      `Q${62 + crownWidth * 0.08} ${top + 36} ${66 + crownWidth * 0.1} ${top + 17}Z`,
      Q.coat,
      true,
      2.1,
    ) +
    roundedRect(69, top + 32, 5, 13, 2, Q.coral, true, 1)
  );
}

function unscaledProposal(
  id: StorageSupportFamilyId,
  params: Readonly<Record<string, number>>,
): string {
  switch (id) {
    case 'bookshelf': return proposalBookshelf(params);
    case 'lockers': return proposalLockers(params);
    case 'open-shelving': return proposalOpenShelving(params);
    case 'pantry-shelf': return proposalPantryShelf(params);
    case 'mail-station': return proposalMailStation(params);
    case 'server-rack': return proposalServerRack(params);
    case 'coat-rack': return proposalCoatRack(params);
  }
}

export function proposalStorageSupportSvg(
  id: StorageSupportFamilyId,
  params: Readonly<Record<string, number>> = DEFAULT_PARAMS[id],
): string {
  const scale = STORAGE_SUPPORT_GAMEPLAY_ART_SCALES[id];
  return proposalShell(
    `<g transform="translate(64 116) scale(${scale}) translate(-64 -116)">` +
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

class StorageRenderer {
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
  renderer: StorageRenderer,
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
  renderer: StorageRenderer,
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
    ? proposalStorageSupportSvg(id as StorageSupportFamilyId, params)
    : renderer.current(id, params);
  const footprintWidth = template.gridFootprint.w * cell;
  const footprintHeight = template.gridFootprint.h * cell;
  const spriteSize = cell * STORAGE_SUPPORT_NATIVE_FRAME_CELLS;
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
  renderer: StorageRenderer,
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

type RoomKind = 'records' | 'mail' | 'it';

function roomDimensions(kind: RoomKind): { columns: number; rows: number } {
  return {
    columns: kind === 'it' ? 8 : 10,
    rows: 6,
  };
}

function roomScene(
  renderer: StorageRenderer,
  kind: RoomKind,
  x: number,
  y: number,
  cell: number,
  crowded = false,
  storageArt: 'proposal' | 'current' = 'proposal',
): string {
  const { columns, rows } = roomDimensions(kind);
  const parts: string[] = [];
  drawGrid(parts, x, y, columns, rows, cell);
  drawWalls(parts, renderer, x, y, columns, rows, cell, 'back');
  if (kind === 'records') {
    parts.push(
      propPlacement(renderer, storageArt, 'bookshelf', x + cell, y + cell, cell),
      propPlacement(renderer, storageArt, 'lockers', x + 3.2 * cell, y + cell, cell),
      propPlacement(renderer, storageArt, 'open-shelving', x + 5.4 * cell, y + cell, cell),
      propPlacement(renderer, 'current', 'supply-cabinet', x + 7.6 * cell, y + cell, cell),
      propPlacement(renderer, 'current', 'filing-cabinet', x + 1.2 * cell, y + 3.1 * cell, cell),
      agentPlacement(renderer, { recipe: DEFAULT_CAST[0], facing: 'north', x: 4.8, y: 4.8 }, x, y, cell),
      agentPlacement(renderer, { recipe: DEFAULT_CAST[2], facing: 'west', x: 7.1, y: 4.35 }, x, y, cell),
    );
  } else if (kind === 'mail') {
    parts.push(
      propPlacement(renderer, storageArt, 'pantry-shelf', x + cell, y + cell, cell),
      propPlacement(renderer, storageArt, 'mail-station', x + 3.2 * cell, y + cell, cell),
      propPlacement(renderer, 'current', 'fridge', x + 5.4 * cell, y + cell, cell),
      propPlacement(renderer, 'current', 'water-cooler', x + 7.6 * cell, y + cell, cell),
      agentPlacement(renderer, { recipe: DEFAULT_CAST[1], facing: 'north', x: 4.05, y: 3.35 }, x, y, cell),
      agentPlacement(renderer, { recipe: DEFAULT_CAST[3], facing: 'west', x: 7.15, y: 4.55 }, x, y, cell),
    );
  } else {
    parts.push(
      propPlacement(renderer, storageArt, 'server-rack', x + 1.1 * cell, y + cell, cell),
      propPlacement(renderer, storageArt, 'coat-rack', x + 4.2 * cell, y + cell, cell),
      propPlacement(renderer, 'current', 'office-plant', x + 6 * cell, y + cell, cell),
      agentPlacement(renderer, { recipe: DEFAULT_CAST[2], facing: 'north', x: 2.1, y: 4.65 }, x, y, cell),
      agentPlacement(renderer, { recipe: DEFAULT_CAST[0], facing: 'west', x: 4.9, y: 4.1 }, x, y, cell),
    );
  }
  if (crowded) {
    parts.push(
      propPlacement(renderer, storageArt, 'mail-station', x + 2.1 * cell, y + 3.15 * cell, cell),
      propPlacement(renderer, storageArt, 'open-shelving', x + 5.8 * cell, y + 3.1 * cell, cell),
      agentPlacement(renderer, { recipe: DEFAULT_CAST[1], facing: 'north', x: 3.95, y: 5.05 }, x, y, cell),
      agentPlacement(renderer, { recipe: DEFAULT_CAST[2], facing: 'west', x: 6.6, y: 4.8 }, x, y, cell),
    );
  }
  drawWalls(parts, renderer, x, y, columns, rows, cell, 'front');
  return parts.join('');
}

function closeComparison(
  renderer: StorageRenderer,
  decision: FamilyDecision,
  x: number,
  y: number,
  width: number,
): string {
  const artSize = 144;
  const leftX = x + 12;
  const rightX = x + width - artSize - 12;
  return (
    panel(x, y, width, 392) +
    text(x + 14, y + 26, decision.category.toUpperCase(), 9, 760, Q.green) +
    text(x + 14, y + 49, decision.label, 17, 820, INK) +
    roundedRect(leftX, y + 67, artSize, artSize, 10, PANEL_ALT) +
    roundedRect(rightX, y + 67, artSize, artSize, 10, PANEL_ALT) +
    placedSvg(renderer.current(decision.id), leftX + 5, y + 72, artSize - 10) +
    placedSvg(proposalStorageSupportSvg(decision.id), rightX + 5, y + 72, artSize - 10) +
    text(leftX + artSize / 2, y + 226, 'CURRENT', 9, 700, MUTED, 'middle') +
    text(rightX + artSize / 2, y + 226, 'PROPOSAL', 9, 780, Q.coral, 'middle') +
    wrappedText(x + 14, y + 263, decision.designRead, 47, 17, 11, 620, MUTED) +
    text(
      x + 14,
      y + 357,
      `128u · ${(STORAGE_SUPPORT_NATIVE_FRAME_CELLS * STORAGE_SUPPORT_GAMEPLAY_ART_SCALES[decision.id]).toFixed(2)}-cell art`,
      9,
      680,
      MUTED,
    ) +
    text(x + width - 14, y + 357, 'elevation locked', 9, 720, Q.green, 'end')
  );
}

function normalRoomCard(
  renderer: StorageRenderer,
  kind: RoomKind,
  x: number,
  y: number,
  width: number,
  title: string,
  note: string,
  storageArt: 'proposal' | 'current' = 'proposal',
): string {
  const { columns } = roomDimensions(kind);
  const roomWidth = columns * NORMAL_CELL;
  return (
    panel(x, y, width, 535) +
    text(x + 16, y + 30, title, 18, 820, Q.green) +
    text(x + 16, y + 53, note, 11, 620, MUTED) +
    text(x + width - 16, y + 30, `${NORMAL_CELL} px / cell`, 10, 720, Q.coral, 'end') +
    roomScene(
      renderer,
      kind,
      x + (width - roomWidth) / 2,
      y + 72,
      NORMAL_CELL,
      false,
      storageArt,
    ) +
    text(
      x + 16,
      y + 511,
      kind === 'mail'
        ? 'mail_station interaction face and 1×1 occupancy remain unchanged'
        : 'dashed = preserved 1×1 occupancy · sprite = independent 2-cell frame',
      10,
      650,
      MUTED,
    )
  );
}

function miniPair(
  renderer: StorageRenderer,
  kind: 'proposal' | 'current',
  id: StorageSupportFamilyId,
  low: Readonly<Record<string, number>>,
  high: Readonly<Record<string, number>>,
  x: number,
  y: number,
  width: number,
): string {
  const size = 76;
  const lowSource = kind === 'proposal'
    ? proposalStorageSupportSvg(id, low)
    : renderer.current(id, low);
  const highSource = kind === 'proposal'
    ? proposalStorageSupportSvg(id, high)
    : renderer.current(id, high);
  return (
    roundedRect(x, y, width, 113, 9, PANEL_ALT, true, 1.1) +
    text(x + 8, y + 17, id, 9, 740, Q.green) +
    placedSvg(lowSource, x + 5, y + 23, size) +
    placedSvg(highSource, x + width - size - 5, y + 23, size) +
    text(x + 10, y + 104, 'MIN', 8, 680, MUTED) +
    text(x + width - 10, y + 104, 'MAX', 8, 680, MUTED, 'end')
  );
}

function variantsCard(
  renderer: StorageRenderer,
  x: number,
  y: number,
  width: number,
  kind: 'proposal' | 'current' = 'proposal',
): string {
  const itemWidth = (width - 48) / 4;
  const pairs = EXPECTED_STORAGE_SUPPORT_CONTRACTS.map((contract) => {
    const low = Object.fromEntries(contract.params.map((param) => [param.key, param.min]));
    const high = Object.fromEntries(contract.params.map((param) => [param.key, param.max]));
    return { id: contract.id, low, high };
  });
  return (
    panel(x, y, width, 426) +
    text(x + 16, y + 29, 'PARAMETER RANGE', 18, 820, Q.green) +
    text(x + 16, y + 51, 'Each existing authoring control remains visibly active.', 11, 620, MUTED) +
    pairs.map((pair, index) => {
      const column = index % 4;
      const row = Math.floor(index / 4);
      return miniPair(
        renderer,
        kind,
        pair.id,
        pair.low,
        pair.high,
        x + 12 + column * (itemWidth + 8),
        y + 69 + row * 126,
        itemWidth,
      );
    }).join('') +
    text(
      x + 16,
      y + 407,
      'Counts change bays, doors, shelves, rack units, and hook positions—not camera or footprint.',
      10,
      650,
      MUTED,
    )
  );
}

function interactionCard(
  renderer: StorageRenderer,
  x: number,
  y: number,
  width: number,
  storageArt: 'proposal' | 'current' = 'proposal',
): string {
  const cell = 62;
  const roomX = x + 28;
  const roomY = y + 76;
  const parts: string[] = [];
  drawGrid(parts, roomX, roomY, 7, 5, cell);
  drawWalls(parts, renderer, roomX, roomY, 7, 5, cell, 'back');
  parts.push(
    propPlacement(renderer, storageArt, 'mail-station', roomX + 2 * cell, roomY + cell, cell),
    propPlacement(renderer, 'current', 'reception-desk', roomX + 4.2 * cell, roomY + cell, cell),
    agentPlacement(renderer, { recipe: DEFAULT_CAST[1], facing: 'north', x: 2.5, y: 3.45 }, roomX, roomY, cell),
    `<path d="M${roomX + 2.1 * cell} ${roomY + 2.3 * cell}H${roomX + 3.05 * cell}" ` +
      `stroke="${Q.coral}" stroke-width="3" stroke-dasharray="7 5"/>`,
    circle(roomX + 2.57 * cell, roomY + 2.3 * cell, 5, Q.paper, true, 1.5),
  );
  drawWalls(parts, renderer, roomX, roomY, 7, 5, cell, 'front');
  return (
    panel(x, y, width, 426) +
    text(x + 16, y + 29, 'MAIL APPROACH + OCCLUSION', 18, 820, Q.green) +
    text(x + 16, y + 51, 'Front service edge stays readable beside a counter and approaching employee.', 11, 620, MUTED) +
    parts.join('') +
    wrappedText(
      roomX + 7 * cell + 24,
      roomY + 25,
      'Coral dash marks the unchanged mail_station approach face. The employee can occlude the lower parcel bay without erasing the pigeonhole noun.',
      42,
      19,
      12,
      650,
      MUTED,
    )
  );
}

function crowdedCard(
  renderer: StorageRenderer,
  x: number,
  y: number,
  width: number,
  storageArt: 'proposal' | 'current' = 'proposal',
): string {
  const cell = 52;
  const roomWidth = 8 * cell;
  return (
    panel(x, y, width, 426) +
    text(x + 16, y + 29, 'CROWDED SUPPORT ROOM', 18, 820, Q.green) +
    text(x + 16, y + 51, 'Silhouettes separate under wall, prop, and employee overlap.', 11, 620, MUTED) +
    roomScene(renderer, 'it', x + 26, y + 76, cell, true, storageArt) +
    wrappedText(
      x + 26 + roomWidth + 25,
      y + 103,
      'The coat rack stays narrow, the server rack stays technical, and mail/open shelving still differ through face organization rather than decorative detail.',
      39,
      19,
      12,
      650,
      MUTED,
    ) +
    text(x + width - 16, y + 404, `${cell} px / cell`, 10, 720, Q.coral, 'end')
  );
}

function farRoomStrip(
  renderer: StorageRenderer,
  x: number,
  y: number,
  storageArt: 'proposal' | 'current' = 'proposal',
  statusNote = 'Accepted source and Terrarium wiring are complete. Unity import and commit remain deferred.',
): string {
  const roomY = y + 70;
  const recordsX = x + 24;
  const mailX = recordsX + 10 * FAR_CELL + 30;
  const itX = mailX + 10 * FAR_CELL + 30;
  return (
    panel(x, y, WIDTH - MARGIN * 2, 416) +
    text(x + 18, y + 30, 'FAR GAMEPLAY ZOOM', 18, 820, Q.green) +
    text(x + 248, y + 30, '40 px / cell · existing elevation perspective · characters ×0.65', 11, 650, MUTED) +
    roomScene(renderer, 'records', recordsX, roomY, FAR_CELL, false, storageArt) +
    roomScene(renderer, 'mail', mailX, roomY, FAR_CELL, false, storageArt) +
    roomScene(renderer, 'it', itX, roomY, FAR_CELL, false, storageArt) +
    text(recordsX, y + 330, 'records / supply', 10, 700, MUTED) +
    text(mailX, y + 330, 'break / mail', 10, 700, MUTED) +
    text(itX, y + 330, 'IT / entry', 10, 700, MUTED) +
    wrappedText(
      itX + 8 * FAR_CELL + 35,
      roomY + 22,
      'Acceptance question: do all seven props preserve their noun at far zoom while reading as one institutional family?',
      44,
      20,
      13,
      720,
      INK,
    ) +
    wrappedText(
      itX + 8 * FAR_CELL + 35,
      roomY + 142,
      'Fixed controls: completed characters, accepted 112-unit walls, supply cabinet, filing cabinet, fridge, water cooler, reception desk, and plant.',
      44,
      19,
      12,
      620,
      MUTED,
    ) +
    wrappedText(
      itX + 8 * FAR_CELL + 35,
      roomY + 272,
      statusNote,
      44,
      19,
      12,
      760,
      Q.coral,
    )
  );
}

function calibrationSheet(renderer: StorageRenderer): string {
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">`,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAGE}"/>`,
    text(MARGIN, 42, 'QuotaCo storage + support · Catalog Storage Spine', 25, 860, INK),
    text(
      MARGIN,
      68,
      'Molded institutional infrastructure, differentiated by literal contents, access faces, and employee use.',
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
  STORAGE_SUPPORT_FAMILY_DECISIONS.forEach((decision, index) => {
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
      'records',
      MARGIN,
      roomsY,
      roomWidth,
      'RECORDS / SUPPLY',
      'Closed storage, open bins, and accepted cabinet controls share one wall.',
    ),
    normalRoomCard(
      renderer,
      'mail',
      MARGIN + roomWidth + GAP,
      roomsY,
      roomWidth,
      'BREAK / MAIL',
      'Food, correspondence, and accepted service machines remain distinct.',
    ),
    normalRoomCard(
      renderer,
      'it',
      MARGIN + (roomWidth + GAP) * 2,
      roomsY,
      roomWidth,
      'IT / ENTRY SUPPORT',
      'Technical rack and employee coat storage retain separate silhouettes.',
    ),
  );
  const stressY = roomsY + 553;
  const stressWidth = (WIDTH - MARGIN * 2 - GAP * 2) / 3;
  parts.push(
    variantsCard(renderer, MARGIN, stressY, stressWidth),
    interactionCard(renderer, MARGIN + stressWidth + GAP, stressY, stressWidth),
    crowdedCard(renderer, MARGIN + (stressWidth + GAP) * 2, stressY, stressWidth),
    farRoomStrip(
      renderer,
      MARGIN,
      stressY + 444,
      'proposal',
      'Accepted reference: canonical SVG authoring and Terrarium template wiring are complete. Unity import and commit remain deferred.',
    ),
    text(
      MARGIN,
      HEIGHT - 24,
      'Approval gate: noun read, family shell, scale relationship, access face, occlusion, crowd separation, and parameter response.',
      11,
      680,
      MUTED,
    ),
    text(
      WIDTH - MARGIN,
      HEIGHT - 24,
      'SVG sources authored · Terrarium wired · no Unity import · no commit.',
      11,
      780,
      Q.coral,
      'end',
    ),
    '</svg>',
  );
  return parts.join('');
}

type StorageSupportSourceMap =
  ReadonlyMap<StorageSupportFamilyId, string>;

async function loadStorageSupportSources(): Promise<StorageSupportSourceMap> {
  return new Map(
    await Promise.all(
      STORAGE_SUPPORT_FAMILY_IDS.map(async (id) => [
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
  renderer: StorageRenderer,
  sources: StorageSupportSourceMap,
  decision: FamilyDecision,
  x: number,
  y: number,
  width: number,
): string {
  const canonical = sources.get(decision.id);
  if (!canonical) throw new Error(`Missing canonical SVG ${decision.id}`);
  const artSize = 144;
  const leftX = x + 12;
  const rightX = x + width - artSize - 12;
  return (
    panel(x, y, width, 392) +
    text(x + 14, y + 26, decision.category.toUpperCase(), 9, 760, Q.green) +
    text(x + 14, y + 49, decision.label, 17, 820, INK) +
    roundedRect(leftX, y + 67, artSize, artSize, 10, PANEL_ALT) +
    roundedRect(rightX, y + 67, artSize, artSize, 10, PANEL_ALT) +
    placedSvg(canonical, leftX + 5, y + 72, artSize - 10) +
    placedSvg(renderer.current(decision.id), rightX + 5, y + 72, artSize - 10) +
    text(leftX + artSize / 2, y + 226, 'CANONICAL SVG', 9, 700, MUTED, 'middle') +
    text(rightX + artSize / 2, y + 226, 'IMPORTED OUTPUT', 9, 780, Q.coral, 'middle') +
    wrappedText(x + 14, y + 263, decision.designRead, 47, 17, 11, 620, MUTED) +
    text(
      x + 14,
      y + 357,
      `128u · ${(STORAGE_SUPPORT_NATIVE_FRAME_CELLS * STORAGE_SUPPORT_GAMEPLAY_ART_SCALES[decision.id]).toFixed(2)}-cell art`,
      9,
      680,
      MUTED,
    ) +
    text(x + width - 14, y + 357, 'source-provenanced', 9, 720, Q.green, 'end')
  );
}

function productionValidationSheet(
  renderer: StorageRenderer,
  sources: StorageSupportSourceMap,
): string {
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">`,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAGE}"/>`,
    text(MARGIN, 42, 'QuotaCo storage + support · imported-art validation', 25, 860, INK),
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
  STORAGE_SUPPORT_FAMILY_DECISIONS.forEach((decision, index) => {
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
      'records',
      MARGIN,
      roomsY,
      roomWidth,
      'RECORDS / SUPPLY',
      'Imported closed storage and open bins share the accepted wall context.',
      'current',
    ),
    normalRoomCard(
      renderer,
      'mail',
      MARGIN + roomWidth + GAP,
      roomsY,
      roomWidth,
      'BREAK / MAIL',
      'Imported mail sorting remains distinct from accepted service machines.',
      'current',
    ),
    normalRoomCard(
      renderer,
      'it',
      MARGIN + (roomWidth + GAP) * 2,
      roomsY,
      roomWidth,
      'IT / ENTRY SUPPORT',
      'Imported rack rails and compact coat storage retain separate silhouettes.',
      'current',
    ),
  );
  const stressY = roomsY + 553;
  const stressWidth = (WIDTH - MARGIN * 2 - GAP * 2) / 3;
  parts.push(
    variantsCard(renderer, MARGIN, stressY, stressWidth, 'current'),
    interactionCard(
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
      stressY + 444,
      'current',
      'Canonical SVGs and deterministic template wiring are present. Schema, Unity import, and commit remain unchanged.',
    ),
    text(
      MARGIN,
      HEIGHT - 24,
      'Validation gate: source fidelity, noun read, parameter response, scale relationship, interaction, crowd separation, and far zoom.',
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

export function validateStorageSupportContracts(): {
  readonly pass: boolean;
  readonly errors: readonly string[];
  readonly contracts: readonly ContractSnapshot[];
} {
  const project = defaultProject();
  const facilities = new Map(
    facilityCatalogJson().facilities.map((facility) => [facility.propId, facility]),
  );
  const errors: string[] = [];
  const contracts: ContractSnapshot[] = [];
  for (const expected of EXPECTED_STORAGE_SUPPORT_CONTRACTS) {
    const template = PROP_TEMPLATES.find(({ id }) => id === expected.id);
    const instance = project.props.find(({ templateId }) => templateId === expected.id);
    const facility = facilities.get(expected.id);
    if (!template) {
      errors.push(`missing template ${expected.id}`);
      continue;
    }
    if (!instance) {
      errors.push(`missing default instance ${expected.id}`);
      continue;
    }
    if (!facility) {
      errors.push(`missing facility registration ${expected.id}`);
      continue;
    }
    const actual: ContractSnapshot = {
      id: expected.id,
      projection: template.projection as 'elevation',
      gridFootprint: template.gridFootprint,
      contactShadow: template.footprint as ContractSnapshot['contactShadow'],
      params: template.params.map(({ key, min, max, step, default: defaultValue }) => ({
        key,
        min,
        max,
        step,
        default: defaultValue,
      })),
      defaultInstanceParams: instance.params,
      blocksWalk: facility.blocksWalk,
      interactionType: facility.isInteractionAnchor
        ? facility.interactionType ?? null
        : null,
    };
    contracts.push(actual);
    if (!sameJson(actual, expected)) {
      errors.push(`${expected.id} contract drifted`);
    }
  }
  return { pass: errors.length === 0, errors, contracts };
}

function rasterStats(source: string, width: number): {
  readonly width: number;
  readonly height: number;
  readonly nonTransparentPixels: number;
} {
  const rendered = new Resvg(source, {
    fitTo: { mode: 'width', value: width },
  }).render();
  const png = PNG.sync.read(rendered.asPng());
  let nonTransparentPixels = 0;
  for (let index = 3; index < png.data.length; index += 4) {
    if (png.data[index] > 0) nonTransparentPixels += 1;
  }
  return {
    width: png.width,
    height: png.height,
    nonTransparentPixels,
  };
}

async function sourcePresence(): Promise<Record<StorageSupportFamilyId, boolean>> {
  const entries = await Promise.all(
    STORAGE_SUPPORT_FAMILY_IDS.map(async (id) => {
      try {
        await access(path.join('assets', 'props', 'quota-co-workhorse-v1', `${id}.svg`));
        return [id, true] as const;
      } catch {
        return [id, false] as const;
      }
    }),
  );
  return Object.fromEntries(entries) as Record<StorageSupportFamilyId, boolean>;
}

async function productionMetrics(
  sources: StorageSupportSourceMap,
): Promise<Record<string, unknown>> {
  const validation = validateStorageSupportContracts();
  const sourceProvenance = Object.fromEntries(
    STORAGE_SUPPORT_FAMILY_IDS.map((id) => {
      const source = sources.get(id);
      const imported = authoredPropArt(id);
      if (!source) throw new Error(`Missing canonical SVG ${id}`);
      return [
        id,
        {
          sourceFile: imported?.sourceFile ?? null,
          sourceSha256: createHash('sha256').update(source).digest('hex'),
          importedSha256: imported?.sourceSha256 ?? null,
          hashMatchesImportedArt:
            createHash('sha256').update(source).digest('hex')
            === imported?.sourceSha256,
          projectionMatches: imported?.projection === 'elevation',
          variantCount: imported ? Object.keys(imported.variants).length : 0,
        },
      ];
    }),
  );
  return {
    reviewStatus: 'production-wired-awaiting-final-family-closeout',
    productionPromotion: true,
    canonicalSvgCount: STORAGE_SUPPORT_FAMILY_IDS.length,
    importerGeneratedArt: true,
    unityImport: false,
    commitCreated: false,
    exportContractMutation: false,
    schemaMutation: false,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    contractValidation: validation,
    sourceProvenance,
    invariants: {
      authoringCanvas: AUTHORING_CANVAS,
      acceptedWallDatum: WALL_DATUM,
      characterVisualScale: CHARACTER_VISUAL_SCALE,
      propNativeFrameCells: STORAGE_SUPPORT_NATIVE_FRAME_CELLS,
      propCharacterMultiplierApplied: false,
      projection: 'elevation',
      groundPivotY: 116,
    },
  };
}

function inventoryMarkdown(
  validation: ReturnType<typeof validateStorageSupportContracts>,
  sources: Record<StorageSupportFamilyId, boolean>,
): string {
  const rows = EXPECTED_STORAGE_SUPPORT_CONTRACTS.map((contract) => {
    const params = contract.params
      .map(({ key, min, max, step, default: defaultValue }) =>
        `${key} ${min}–${max} step ${step} default ${defaultValue}`)
      .join('; ');
    return (
      `| ${contract.id} | ${contract.projection} | 1×1 | ` +
      `${contract.contactShadow.rx}×${contract.contactShadow.ry} @ ${contract.contactShadow.cx},${contract.contactShadow.cy} | ` +
      `${STORAGE_SUPPORT_GAMEPLAY_ART_SCALES[contract.id]} | ${params} | ` +
      `${contract.interactionType ?? 'none'} | ${sources[contract.id] ? 'present' : 'absent'} |`
    );
  }).join('\n');
  return `# QuotaCo storage + support family · review inventory

Status: accepted visual direction; canonical SVG sources and Terrarium production wiring complete.

## Locked contracts

| Prop | Projection | Grid | Contact shadow | Review art scale | Parameters | Interaction | Canonical SVG |
| --- | --- | --- | --- | --- | --- | --- | --- |
${rows}

## Proposed family rule

- Thick cream molded perimeter shells and standardized dark-green catalog bays.
- Coral marks service, maintenance, or access edges rather than generic decoration.
- Literal contents differentiate use: books, locker doors, supply bins, food packages,
  pigeonholes, server units, and a hanging coat.
- Employee warmth comes from labels, paper, mugs, plant, coat, and wear; no wood-forward
  residential or executive furniture language.
- Every proposal remains elevation-projected on the accepted y=116 ground pivot.
- The character 0.65 visual multiplier is not applied to props; the review scales are
  independently chosen per noun.

## Review boundary

- Production promotion: yes
- Canonical SVG source authoring: yes
- Template/default mutation: yes
- Export contract/schema mutation: no
- Unity registration/import: no
- Commit: no
- Contract validation: ${validation.pass ? 'pass' : `fail (${validation.errors.join(', ')})`}
`;
}

export async function renderQuotaCoStorageSupportFamilyCalibration(
  outputDir = path.join('docs', 'previews'),
): Promise<{
  readonly svgPath: string;
  readonly pngPath: string;
  readonly metricsPath: string;
  readonly inventoryPath: string;
}> {
  const renderer = new StorageRenderer();
  const validation = validateStorageSupportContracts();
  if (!validation.pass) {
    throw new Error(`Storage/support contract validation failed: ${validation.errors.join('; ')}`);
  }
  const svg = calibrationSheet(renderer);
  const rendered = new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH },
  }).render();
  const png = rendered.asPng();
  const sources = await sourcePresence();
  const metrics = {
    reviewStatus: 'accepted-direction-reference',
    productionPromotion: true,
    sourceSvgAuthoring: true,
    templateMutation: true,
    exportContractMutation: false,
    schemaMutation: false,
    unityIntegrationMutation: false,
    unityImport: false,
    commitCreated: false,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    sourceAssetsPresent: sources,
    contractValidation: validation,
    invariants: {
      authoringCanvas: AUTHORING_CANVAS,
      acceptedWallDatum: WALL_DATUM,
      characterVisualScale: CHARACTER_VISUAL_SCALE,
      propNativeFrameCells: STORAGE_SUPPORT_NATIVE_FRAME_CELLS,
      propCharacterMultiplierApplied: false,
      projection: 'elevation',
      groundPivotY: 116,
    },
    gameplayArtScales: STORAGE_SUPPORT_GAMEPLAY_ART_SCALES,
    rasterRead: Object.fromEntries(
      STORAGE_SUPPORT_FAMILY_IDS.map((id) => [
        id,
        {
          close: rasterStats(proposalStorageSupportSvg(id), AUTHORING_CANVAS),
          far: rasterStats(proposalStorageSupportSvg(id), FAR_CELL),
        },
      ]),
    ),
  };
  await mkdir(outputDir, { recursive: true });
  const svgPath = path.join(
    outputDir,
    'quota-co-storage-support-family-calibration-v1.svg',
  );
  const pngPath = path.join(
    outputDir,
    'quota-co-storage-support-family-calibration-v1.png',
  );
  const metricsPath = path.join(
    outputDir,
    'quota-co-storage-support-family-calibration-v1-metrics.json',
  );
  const inventoryPath = path.join(
    outputDir,
    'quota-co-storage-support-family-inventory-v1.md',
  );
  await Promise.all([
    writeFile(svgPath, svg),
    writeFile(pngPath, png),
    writeFile(metricsPath, `${JSON.stringify(metrics, null, 2)}\n`),
    writeFile(inventoryPath, inventoryMarkdown(validation, sources)),
  ]);
  return { svgPath, pngPath, metricsPath, inventoryPath };
}

export async function renderQuotaCoStorageSupportFamilyProductionValidation(
  outputDir = path.join('docs', 'previews'),
): Promise<{
  readonly svgPath: string;
  readonly pngPath: string;
  readonly metricsPath: string;
}> {
  const renderer = new StorageRenderer();
  const sources = await loadStorageSupportSources();
  const source = productionValidationSheet(renderer, sources);
  const png = new Resvg(source, {
    font: { loadSystemFonts: true },
  }).render().asPng();
  await mkdir(outputDir, { recursive: true });
  const base = 'quota-co-storage-support-family-production-validation-v2';
  const svgPath = path.join(outputDir, `${base}.svg`);
  const pngPath = path.join(outputDir, `${base}.png`);
  const metricsPath = path.join(outputDir, `${base}-metrics.json`);
  await Promise.all([
    writeFile(svgPath, source, 'utf8'),
    writeFile(pngPath, png),
    writeFile(
      metricsPath,
      `${JSON.stringify(await productionMetrics(sources), null, 2)}\n`,
      'utf8',
    ),
  ]);
  return { svgPath, pngPath, metricsPath };
}

async function main(): Promise<void> {
  const result = await renderQuotaCoStorageSupportFamilyCalibration();
  process.stdout.write(
    `Wrote ${result.svgPath}\n` +
    `Wrote ${result.pngPath}\n` +
    `Wrote ${result.metricsPath}\n` +
    `Wrote ${result.inventoryPath}\n`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
