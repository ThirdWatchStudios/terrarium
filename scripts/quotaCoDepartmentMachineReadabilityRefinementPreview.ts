/**
 * Review-only refinement of the accepted QuotaCo Administrative Percussion
 * department-machine direction.
 *
 *   npx tsx scripts/quotaCoDepartmentMachineReadabilityRefinementPreview.ts
 *   npx tsx scripts/quotaCoDepartmentMachineReadabilityRefinementPreview.ts --out /tmp/department-refinement
 *
 * This file is deliberately outside every production registration/export path.
 * It proves tube/canister clearance, exact grid-edge sockets, continuous joins,
 * station transitions, buffer states, and the weakest Priority 1 machine nouns
 * before any accepted pixels are promoted.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

import { composeCharacter, composeWallTile } from '../src/core/compositor';
import type {
  CharacterRecipe,
  Facing,
  StyleSheet,
  TileInstance,
} from '../src/core/types';
import { DEFAULT_CAST, DEFAULT_STYLE, defaultProject } from '../src/data/defaults';
import type { Pose } from '../src/parts/poses';
import { BLOB_CONFIGS } from '../src/tiles/blob';
import { PROP_NATIVE_FRAME_CELLS } from './quotaCoWorkstationFamilyCalibrationPreview';
import {
  DEPARTMENT_MACHINE_PALETTE,
  type FillState,
  type PriorityOneAssetId,
  type PriorityOneWorkTypeStamp,
  priorityOneAssetSvg,
} from './quotaCoDepartmentMachineFamilyCalibrationPreview';

const AUTHORING_CANVAS = 128;
const FAR_CELL = 40;
const CHARACTER_VISUAL_SCALE = 0.65;
const CHARACTER_FRAME_CELLS = 1.55 * CHARACTER_VISUAL_SCALE;

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
const Q = DEPARTMENT_MACHINE_PALETTE;

/** Exact source-space route contract for one logical post-rescale cell. */
export const REFINED_TUBE_GEOMETRY = {
  sourceCanvas: AUTHORING_CANVAS,
  logicalCellSourceMin: 32,
  logicalCellSourceMax: 96,
  westSocket: { x: 32, y: 64 },
  eastSocket: { x: 96, y: 64 },
  southSocket: { x: 64, y: 96 },
  outerDiameter: 28,
  linerDiameter: 22,
  lumenDiameter: 16,
  canisterDiameter: 10,
  radialClearance: 3,
} as const;

export const REFINED_ASSET_IDS = [
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
] as const satisfies readonly PriorityOneAssetId[];

const TRANSPORT_IDS = [
  'tube_straight',
  'tube_corner',
  'tube_wallpass',
  'tube_riser',
] as const;

type RefinedTubeId = (typeof TRANSPORT_IDS)[number];

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

function wrap(value: string, max = 68): string[] {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && next.length > max) {
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
  linecap: 'round' | 'butt' = 'round',
): string {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ` +
    `stroke="${stroke}" stroke-width="${width}" stroke-linecap="${linecap}" ` +
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

function svgPage(width: number, height: number, markup: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${PAGE}"/>${markup}</svg>`;
}

function machineBase(x: number, y: number, width: number, height: number, radius = 8): string {
  return `<rect x="${x - 2}" y="${y - 2}" width="${width + 4}" height="${height + 4}" ` +
    `rx="${radius + 2}" fill="${Q.charcoal}"/>` +
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${Q.cream}"/>` +
    `<path d="M ${x + radius} ${y + 1} H ${x + width - radius}" fill="none" ` +
    `stroke="${Q.white}" stroke-width="2" opacity=".18"/>`;
}

function canisterMarkup(
  x: number,
  y: number,
  scale = 1,
  stamp?: PriorityOneWorkTypeStamp,
  angle = 0,
): string {
  const width = 30 * scale;
  const height = REFINED_TUBE_GEOMETRY.canisterDiameter * scale;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const rotate = angle ? ` transform="rotate(${angle} ${cx} ${cy})"` : '';
  const parts = [
    `<g${rotate}>`,
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${height / 2}" fill="${Q.charcoal}"/>`,
    `<rect x="${x + 1.5 * scale}" y="${y + 1.5 * scale}" width="${width - 3 * scale}" ` +
    `height="${height - 3 * scale}" rx="${(height - 3 * scale) / 2}" fill="${Q.cream}"/>`,
    `<rect x="${x + 8 * scale}" y="${y + 1.5 * scale}" width="${12 * scale}" ` +
    `height="${height - 3 * scale}" rx="${1.8 * scale}" fill="${Q.teal}"/>`,
    `<rect x="${x + 3 * scale}" y="${y + 3.6 * scale}" width="${2.6 * scale}" height="${2.8 * scale}" rx="${.8 * scale}" fill="${Q.metal}"/>`,
    `<rect x="${x + width - 5.6 * scale}" y="${y + 3.6 * scale}" width="${2.6 * scale}" height="${2.8 * scale}" rx="${.8 * scale}" fill="${Q.metal}"/>`,
  ];
  if (stamp === 'raw_records') {
    parts.push(
      `<path d="M ${x + 10 * scale} ${y + 3.3 * scale} H ${x + 18 * scale} ` +
      `M ${x + 10 * scale} ${y + 5.3 * scale} H ${x + 16.5 * scale} ` +
      `M ${x + 10 * scale} ${y + 7.3 * scale} H ${x + 18 * scale}" ` +
      `stroke="${Q.white}" stroke-width="${1.1 * scale}" stroke-linecap="round"/>`,
    );
  } else if (stamp === 'structured_data') {
    for (let row = 0; row < 2; row += 1) {
      for (let column = 0; column < 3; column += 1) {
        parts.push(`<circle cx="${x + (11 + column * 3) * scale}" ` +
          `cy="${y + (3.6 + row * 3) * scale}" r="${.75 * scale}" fill="${Q.white}"/>`);
      }
    }
  }
  parts.push('</g>');
  return parts.join('');
}

function pipePath(d: string, cap: 'butt' | 'round' = 'butt'): string {
  return `<path d="${d}" fill="none" stroke="${Q.charcoal}" ` +
    `stroke-width="${REFINED_TUBE_GEOMETRY.outerDiameter}" stroke-linecap="${cap}" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${Q.metal}" ` +
    `stroke-width="${REFINED_TUBE_GEOMETRY.linerDiameter}" stroke-linecap="${cap}" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${Q.teal}" stroke-opacity=".82" ` +
    `stroke-width="${REFINED_TUBE_GEOMETRY.lumenDiameter}" stroke-linecap="${cap}" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${Q.white}" stroke-opacity=".24" ` +
    `stroke-width="3" stroke-linecap="${cap}" stroke-linejoin="round"/>`;
}

function socketCollar(x: number, y: number, vertical = true): string {
  return vertical
    ? `<rect x="${x - 3}" y="${y - 15}" width="6" height="30" rx="2" fill="${Q.green}" stroke="${Q.charcoal}" stroke-width="1.5"/>`
    : `<rect x="${x - 15}" y="${y - 3}" width="30" height="6" rx="2" fill="${Q.green}" stroke="${Q.charcoal}" stroke-width="1.5"/>`;
}

function tubeSvg(id: RefinedTubeId, canister = false): string {
  if (id === 'tube_straight') {
    return assetSvg(
      pipePath('M 32 64 H 96') +
      socketCollar(50, 64) + socketCollar(78, 64) +
      (canister ? canisterMarkup(49, 59, .82, 'structured_data') : ''),
    );
  }
  if (id === 'tube_corner') {
    return assetSvg(
      pipePath('M 32 64 H 52 Q 64 64 64 76 V 96') +
      socketCollar(45, 64) + socketCollar(64, 83, false) +
      (canister ? canisterMarkup(47, 67, .72, 'raw_records', 90) : ''),
    );
  }
  if (id === 'tube_wallpass') {
    return assetSvg(
      pipePath('M 32 64 H 96') +
      `<rect x="47" y="32" width="34" height="64" rx="8" fill="${Q.charcoal}"/>` +
      `<rect x="52" y="37" width="24" height="54" rx="6" fill="${Q.cream}"/>` +
      `<circle cx="64" cy="64" r="18" fill="${Q.charcoal}"/>` +
      `<circle cx="64" cy="64" r="13" fill="${Q.metal}"/>` +
      `<circle cx="64" cy="64" r="8" fill="${Q.teal}"/>` +
      `<path d="M 32 64 H 96" stroke="${Q.white}" stroke-width="3" opacity=".24" stroke-linecap="butt"/>` +
      `<rect x="54" y="84" width="20" height="4" rx="2" fill="${Q.green}"/>` +
      (canister ? canisterMarkup(49, 59, .82, 'raw_records') : ''),
    );
  }
  return assetSvg(
    pipePath('M 32 64 H 42 Q 52 64 52 54 V 45 Q 52 36 61 36 H 67 Q 76 36 76 45 V 54 Q 76 64 86 64 H 96') +
    `<path d="M 43 83 H 85 L 79 103 H 49 Z" fill="${Q.charcoal}"/>` +
    `<path d="M 49 82 H 79 L 75 97 H 53 Z" fill="${Q.green}"/>` +
    `<rect x="55" y="88" width="18" height="4" rx="2" fill="${Q.teal}"/>` +
    socketCollar(43, 64) + socketCollar(85, 64) +
    (canister ? canisterMarkup(49, 31, .82, 'structured_data') : ''),
  );
}

function sortingFrameSvg(): string {
  const parts = [
    machineBase(14, 17, 100, 101, 7),
    `<rect x="19" y="24" width="90" height="73" rx="4" fill="${Q.charcoal}"/>`,
  ];
  const columns = 5;
  const rows = 4;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = 23 + column * 17;
      const y = 29 + row * 16;
      parts.push(
        `<path d="M ${x} ${y} H ${x + 14} V ${y + 12} H ${x} Z" fill="${Q.green}" stroke="${Q.metal}" stroke-width="1.3"/>`,
        `<path d="M ${x + 2} ${y + 3} H ${x + 12} V ${y + 10} H ${x + 2} Z" fill="${Q.black}" opacity=".42"/>`,
      );
      if ((row + column) % 4 === 1) {
        parts.push(`<rect x="${x + 3}" y="${y + 7}" width="${9 - (column % 2) * 2}" height="3" rx=".8" fill="${Q.cream}"/>`);
      }
    }
  }
  parts.push(
    `<path d="M 10 96 H 118 L 108 110 H 20 Z" fill="${Q.cream}" stroke="${Q.charcoal}" stroke-width="2.5"/>`,
    `<rect x="20" y="107" width="88" height="11" rx="3" fill="${Q.green}"/>`,
    `<path d="M 28 101 H 86" stroke="${Q.teal}" stroke-width="3" stroke-linecap="round"/>`,
    `<rect x="100" y="27" width="7" height="64" rx="2" fill="${Q.teal}"/>`,
  );
  return assetSvg(parts.join(''));
}

function frankingMachineSvg(): string {
  return assetSvg(
    machineBase(29, 69, 70, 47, 7) +
    `<rect x="36" y="78" width="50" height="19" rx="3" fill="${Q.charcoal}"/>` +
    `<path d="M 19 90 H 77 L 88 98 H 27 Z" fill="${Q.cream}" stroke="${Q.charcoal}" stroke-width="2"/>` +
    `<path d="M 29 92 H 71" stroke="${Q.teal}" stroke-width="2"/>` +
    `<rect x="52" y="58" width="25" height="18" rx="5" fill="${Q.green}" stroke="${Q.charcoal}" stroke-width="2"/>` +
    `<rect x="58" y="72" width="13" height="12" rx="3" fill="${Q.metal}" stroke="${Q.charcoal}" stroke-width="2"/>` +
    `<path d="M 66 59 V 43 H 91 V 48" fill="none" stroke="${Q.charcoal}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M 66 59 V 43 H 91 V 48" fill="none" stroke="${Q.teal}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="91" cy="50" r="5" fill="${Q.coral}" stroke="${Q.charcoal}" stroke-width="2"/>` +
    `<rect x="35" y="106" width="58" height="10" rx="3" fill="${Q.green}"/>`,
  );
}

function keypunchBankSvg(): string {
  const parts = [
    `<path d="M 6 45 Q 6 35 16 35 H 112 Q 122 35 122 45 V 112 Q 122 118 116 118 H 12 Q 6 118 6 112 Z" fill="${Q.charcoal}"/>`,
    `<rect x="9" y="38" width="110" height="76" rx="7" fill="${Q.cream}"/>`,
  ];
  for (let index = 0; index < 3; index += 1) {
    const x = 13 + index * 36;
    parts.push(
      `<rect x="${x}" y="47" width="30" height="57" rx="5" fill="${index === 0 ? Q.charcoal : Q.green}"/>`,
      `<path d="M ${x + 6} 42 H ${x + 24} V 60 H ${x + 6} Z" fill="${Q.cream}" stroke="${Q.charcoal}" stroke-width="1.8"/>`,
      `<path d="M ${x + 9} 47 H ${x + 21} M ${x + 9} 51 H ${x + 21} M ${x + 9} 55 H ${x + 18}" stroke="${Q.teal}" stroke-width="1.4"/>`,
      `<circle cx="${x + 15}" cy="67" r="7" fill="${Q.metal}" stroke="${Q.charcoal}" stroke-width="2"/>`,
      `<circle cx="${x + 15}" cy="67" r="2.5" fill="${Q.teal}"/>`,
      `<path d="M ${x + 2} 76 H ${x + 28} L ${x + 32} 94 H ${x - 2} Z" fill="${Q.cream}" stroke="${Q.charcoal}" stroke-width="1.7"/>`,
    );
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 5; column += 1) {
        parts.push(`<rect x="${x + 3 + column * 5}" y="${80 + row * 4}" width="3.2" height="2.5" rx=".7" fill="${Q.metal}"/>`);
      }
    }
    parts.push(`<rect x="${x + 5}" y="97" width="20" height="5" rx="1.5" fill="${Q.teal}"/>`);
  }
  parts.push(
    `<rect x="6" y="106" width="116" height="12" rx="4" fill="${Q.green}"/>`,
    `<rect x="14" y="110" width="100" height="3" rx="1.5" fill="${Q.teal}"/>`,
  );
  return assetSvg(parts.join(''));
}

function tabulatingMachineSvg(): string {
  return assetSvg(
    machineBase(7, 15, 114, 103, 9) +
    `<rect x="12" y="23" width="104" height="78" rx="6" fill="${Q.charcoal}"/>` +
    `<path d="M 16 20 H 45 V 50 H 16 Z" fill="${Q.cream}" stroke="${Q.charcoal}" stroke-width="2"/>` +
    `<path d="M 21 27 H 39 M 21 33 H 39 M 21 39 H 36" stroke="${Q.teal}" stroke-width="2"/>` +
    `<circle cx="41" cy="69" r="21" fill="${Q.metal}" stroke="${Q.cream}" stroke-width="4"/>` +
    `<circle cx="41" cy="69" r="12" fill="${Q.green}" stroke="${Q.charcoal}" stroke-width="3"/>` +
    `<circle cx="41" cy="69" r="4" fill="${Q.teal}"/>` +
    `<circle cx="76" cy="54" r="12" fill="${Q.metal}" stroke="${Q.cream}" stroke-width="3"/>` +
    `<circle cx="76" cy="54" r="4" fill="${Q.teal}"/>` +
    `<path d="M 41 46 H 76 V 40 H 105" fill="none" stroke="${Q.cream}" stroke-width="7" stroke-linejoin="round"/>` +
    `<path d="M 41 46 H 76 V 40 H 105" fill="none" stroke="${Q.teal}" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="M 82 67 H 110 V 94 H 82 Z" fill="${Q.cream}" stroke="${Q.charcoal}" stroke-width="2"/>` +
    `<path d="M 87 72 H 105 M 87 78 H 105 M 87 84 H 102 M 87 90 H 105" stroke="${Q.green}" stroke-width="1.8"/>` +
    `<path d="M 16 94 H 73" stroke="${Q.teal}" stroke-width="7" stroke-linecap="round"/>` +
    `<rect x="7" y="102" width="114" height="16" rx="5" fill="${Q.green}"/>` +
    `<rect x="16" y="107" width="96" height="3" rx="1.5" fill="${Q.teal}"/>`,
  );
}

function loadingDockSvg(state: FillState): string {
  const parts = [
    `<path d="M 8 83 L 24 67 H 112 L 121 77 V 116 H 8 Z" fill="${Q.charcoal}"/>`,
    `<path d="M 13 84 L 28 72 H 108 L 116 80 V 108 H 13 Z" fill="${Q.metal}"/>`,
    `<path d="M 13 84 H 116 V 94 H 13 Z" fill="${Q.cream}"/>`,
    `<path d="M 20 102 H 109" stroke="${Q.charcoal}" stroke-width="3" stroke-dasharray="13 7"/>`,
    `<rect x="8" y="108" width="113" height="10" rx="2" fill="${Q.green}"/>`,
    `<path d="M 18 111 H 111" stroke="${Q.teal}" stroke-width="3"/>`,
    `<path d="M 18 83 L 28 75 M 101 75 L 111 83" stroke="${Q.charcoal}" stroke-width="3"/>`,
  ];
  const count = state === 'empty' ? 0 : state === 'low' ? 2 : 5;
  for (let index = 0; index < count; index += 1) {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const x = 21 + column * 28;
    const y = 67 - row * 21;
    parts.push(
      `<rect x="${x - 2}" y="${y + 17}" width="26" height="4" rx="1" fill="${Q.green}"/>`,
      `<rect x="${x}" y="${y}" width="22" height="18" rx="2" fill="${Q.charcoal}"/>`,
      `<rect x="${x + 2}" y="${y + 2}" width="18" height="14" rx="1" fill="${Q.cream}"/>`,
      `<path d="M ${x + 5} ${y + 5} H ${x + 17} M ${x + 5} ${y + 11} H ${x + 17}" stroke="${Q.teal}" stroke-width="1.5"/>`,
    );
  }
  return assetSvg(parts.join(''));
}

function traySvg(large: boolean, state: FillState): string {
  const parts: string[] = [];
  if (large) {
    parts.push(
      `<path d="M 33 48 H 96 V 116 H 33 Z" fill="${Q.charcoal}"/>`,
      `<path d="M 38 53 H 91 V 109 H 38 Z" fill="${Q.green}"/>`,
      `<rect x="43" y="58" width="43" height="43" rx="5" fill="${Q.black}" opacity=".42"/>`,
      `<path d="M 33 58 H 20 Q 14 58 14 64 Q 14 70 20 70 H 38" fill="none" stroke="${Q.charcoal}" stroke-width="28" stroke-linecap="butt"/>`,
      `<path d="M 32 58 H 20 Q 14 58 14 64 Q 14 70 20 70 H 38" fill="none" stroke="${Q.metal}" stroke-width="20" stroke-linecap="butt"/>`,
      `<path d="M 32 58 H 20 Q 14 58 14 64 Q 14 70 20 70 H 38" fill="none" stroke="${Q.teal}" stroke-width="14" stroke-linecap="butt"/>`,
      `<rect x="33" y="105" width="63" height="13" rx="4" fill="${Q.green}"/>`,
    );
  } else {
    parts.push(
      `<path d="M 31 76 H 98 V 116 H 31 Z" fill="${Q.charcoal}"/>`,
      `<path d="M 37 82 H 92 V 108 H 37 Z" fill="${Q.green}"/>`,
      `<rect x="42" y="86" width="45" height="15" rx="4" fill="${Q.black}" opacity=".42"/>`,
      `<path d="M 32 64 H 46 V 88" fill="none" stroke="${Q.charcoal}" stroke-width="28" stroke-linecap="butt" stroke-linejoin="round"/>`,
      `<path d="M 32 64 H 46 V 88" fill="none" stroke="${Q.metal}" stroke-width="20" stroke-linecap="butt" stroke-linejoin="round"/>`,
      `<path d="M 32 64 H 46 V 88" fill="none" stroke="${Q.teal}" stroke-width="14" stroke-linecap="butt" stroke-linejoin="round"/>`,
      `<rect x="31" y="106" width="67" height="12" rx="4" fill="${Q.green}"/>`,
    );
  }
  const count = state === 'empty' ? 0 : state === 'low' ? 1 : state === 'high' ? (large ? 4 : 2) : (large ? 6 : 4);
  for (let index = 0; index < count; index += 1) {
    const row = Math.floor(index / 2);
    const column = index % 2;
    const x = 44 + column * 21;
    const y = (large ? 91 : 97) - row * 10;
    parts.push(canisterMarkup(x, y, .63, index % 2 ? 'structured_data' : 'raw_records'));
  }
  if (state === 'overflowing') {
    parts.push(canisterMarkup(79, 108, .66, 'structured_data', 8));
  }
  return assetSvg(parts.join(''));
}

function dispatchStationSvg(state: FillState): string {
  const parts = [
    machineBase(27, 51, 69, 65, 8),
    `<rect x="34" y="59" width="39" height="39" rx="5" fill="${Q.green}"/>`,
    `<rect x="39" y="65" width="29" height="27" rx="4" fill="${Q.black}" opacity=".42"/>`,
    `<path d="M 65 64 H 96" fill="none" stroke="${Q.charcoal}" stroke-width="28" stroke-linecap="butt"/>`,
    `<path d="M 65 64 H 96" fill="none" stroke="${Q.metal}" stroke-width="20" stroke-linecap="butt"/>`,
    `<path d="M 65 64 H 96" fill="none" stroke="${Q.teal}" stroke-width="14" stroke-linecap="butt"/>`,
    `<path d="M 35 100 H 86 L 92 108 H 35 Z" fill="${Q.cream}" stroke="${Q.charcoal}" stroke-width="2"/>`,
    `<rect x="27" y="106" width="69" height="12" rx="4" fill="${Q.green}"/>`,
  ];
  const count = state === 'empty' ? 0 : state === 'low' ? 1 : state === 'high' ? 3 : 5;
  for (let index = 0; index < count; index += 1) {
    parts.push(canisterMarkup(40 + (index % 2) * 18, 87 - Math.floor(index / 2) * 9,
      .56, index % 2 ? 'structured_data' : 'raw_records'));
  }
  if (state === 'overflowing') parts.push(canisterMarkup(16, 105, .62, 'structured_data', -8));
  return assetSvg(parts.join(''));
}

function dispatchNodeSvg(): string {
  return assetSvg(
    pipePath('M 32 64 H 96') +
    machineBase(35, 30, 58, 87, 9) +
    `<rect x="41" y="38" width="46" height="51" rx="7" fill="${Q.charcoal}"/>` +
    `<circle cx="64" cy="64" r="17" fill="${Q.metal}" stroke="${Q.cream}" stroke-width="4"/>` +
    `<circle cx="64" cy="64" r="8" fill="${Q.teal}"/>` +
    `<path d="M 32 64 H 96" stroke="${Q.white}" stroke-width="3" opacity=".24" stroke-linecap="butt"/>` +
    `<rect x="43" y="92" width="42" height="14" rx="3" fill="${Q.cream}"/>` +
    `<path d="M 49 97 H 79 M 49 102 H 70" stroke="${Q.charcoal}" stroke-width="1.5"/>` +
    `<rect x="35" y="106" width="58" height="12" rx="4" fill="${Q.green}"/>`,
  );
}

function deliveryUplinkSvg(): string {
  return assetSvg(
    `<path d="M 7 30 Q 7 22 15 22 H 41 L 52 14 H 113 Q 121 14 121 22 V 111 Q 121 119 113 119 H 15 Q 7 119 7 111 Z" fill="${Q.charcoal}"/>` +
    `<path d="M 12 33 Q 12 27 18 27 H 44 L 55 19 H 111 Q 116 19 116 24 V 105 H 12 Z" fill="${Q.cream}"/>` +
    `<path d="M 14 35 H 46 V 105 H 14 Z" fill="${Q.green}"/>` +
    `<path d="M 82 26 H 110 V 105 H 82 Z" fill="${Q.green}"/>` +
    `<path d="M 47 28 H 81 V 103 H 47 Z" fill="${Q.charcoal}"/>` +
    `<path d="M 54 33 H 74 V 49 Q 74 57 64 61 Q 54 57 54 49 Z" fill="${Q.metal}" stroke="${Q.cream}" stroke-width="2"/>` +
    `<rect x="54" y="61" width="20" height="25" rx="9" fill="${Q.black}" opacity=".42"/>` +
    `<path d="M 55 74 H 73" stroke="${Q.teal}" stroke-width="8" stroke-linecap="round"/>` +
    `<path d="M 64 28 V 14 H 96" fill="none" stroke="${Q.charcoal}" stroke-width="14" stroke-linecap="butt" stroke-linejoin="round"/>` +
    `<path d="M 64 28 V 14 H 96" fill="none" stroke="${Q.metal}" stroke-width="8" stroke-linecap="butt" stroke-linejoin="round"/>` +
    `<path d="M 22 43 V 93 M 30 43 V 93 M 94 37 V 95 M 102 37 V 95" stroke="${Q.charcoal}" stroke-width="2"/>` +
    `<path d="M 50 92 H 78 L 73 101 H 55 Z" fill="${Q.cream}" stroke="${Q.charcoal}" stroke-width="2"/>` +
    `<rect x="7" y="104" width="114" height="15" rx="4" fill="${Q.green}"/>` +
    `<rect x="17" y="109" width="94" height="3" rx="1.5" fill="${Q.teal}"/>`,
  );
}

export interface RefinedAssetOptions {
  readonly state?: FillState;
  readonly stamp?: PriorityOneWorkTypeStamp;
  readonly canisterInTube?: boolean;
}

export function refinedPriorityOneAssetSvg(
  id: PriorityOneAssetId,
  options: RefinedAssetOptions = {},
): string {
  const state = options.state ?? 'empty';
  switch (id) {
    case 'loading_dock': return loadingDockSvg(state);
    case 'sorting_frame': return sortingFrameSvg();
    case 'franking_machine': return frankingMachineSvg();
    case 'keypunch_bank': return keypunchBankSvg();
    case 'tabulating_machine': return tabulatingMachineSvg();
    case 'intake_tray_small': return traySvg(false, state);
    case 'intake_tray_large': return traySvg(true, state);
    case 'dispatch_station': return dispatchStationSvg(state);
    case 'pneumatic_dispatch_node': return dispatchNodeSvg();
    case 'tube_straight':
    case 'tube_corner':
    case 'tube_wallpass':
    case 'tube_riser':
      return tubeSvg(id, options.canisterInTube);
    case 'canister_base': return assetSvg(canisterMarkup(49, 59, 1, options.stamp));
    case 'delivery_uplink': return deliveryUplinkSvg();
  }
}

function logicalCellPlacement(source: string, x: number, y: number, cell: number): string {
  const nativeSize = cell * PROP_NATIVE_FRAME_CELLS;
  return placedSvg(source, x - cell / 2, y - cell / 2, nativeSize);
}

export function renderContinuousTubeRouteSvg(): string {
  const cell = 64;
  const ids = ['tube_straight', 'tube_wallpass', 'tube_riser', 'tube_straight'] as const;
  const body = ids.map((id, index) => logicalCellPlacement(
    refinedPriorityOneAssetSvg(id, { canisterInTube: index === 2 }),
    index * cell,
    0,
    cell,
  )).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ids.length * cell}" height="128" ` +
    `viewBox="0 0 ${ids.length * cell} 128">` +
    `<g transform="translate(0 32)">${body}</g></svg>`;
}

function engineeringTile(
  id: RefinedTubeId,
  x: number,
  y: number,
  size: number,
  canister = false,
): string {
  return roundedRect(x, y, size + 34, size + 78, 10, PANEL_ALT) +
    placedSvg(refinedPriorityOneAssetSvg(id, { canisterInTube: canister }), x + 17, y + 28, size) +
    text(x + 17 + size / 2, y + size + 54, id.replace('tube_', '').toUpperCase(), 11, 760, MUTED, 'middle');
}

export function renderTubeCanisterEngineeringSvg(): string {
  const width = 3200;
  const height = 2140;
  const parts: string[] = [
    text(42, 55, 'ADMINISTRATIVE PERCUSSION · TUBE / CANISTER REFINEMENT', 30, 780, Q.green),
    text(42, 87, 'Accepted B control held · exact post-rescale sockets · transport first · review only', 15, 620, MUTED),
    text(width - 42, 55, 'NO PRODUCTION / EXPORT / UNITY MUTATION', 13, 760, Q.coral, 'end'),
    roundedRect(32, 116, 1020, 760, 14, PANEL),
    text(56, 153, '1 · LITERAL CLEARANCE, NOT IMPLIED SCALE', 14, 780, MUTED),
    text(56, 183, 'Cross-section through the transparent centerline', 12, 560, MUTED),
  ];

  parts.push(
    `<circle cx="540" cy="470" r="210" fill="${Q.charcoal}"/>`,
    `<circle cx="540" cy="470" r="165" fill="${Q.metal}"/>`,
    `<circle cx="540" cy="470" r="120" fill="${Q.teal}"/>`,
    `<rect x="402" y="433" width="276" height="74" rx="37" fill="${Q.charcoal}"/>`,
    `<rect x="413" y="444" width="254" height="52" rx="26" fill="${Q.cream}"/>`,
    `<rect x="482" y="444" width="110" height="52" rx="12" fill="${Q.green}"/>`,
    line(310, 470, 770, 470, Q.white, 2, .32),
    line(540, 236, 540, 704, Q.white, 2, .32),
    line(790, 350, 790, 590, Q.coral, 3),
    line(780, 350, 800, 350, Q.coral, 3),
    line(780, 590, 800, 590, Q.coral, 3),
    text(818, 458, '16u LUMEN', 15, 780, Q.green),
    text(818, 484, '10u CANISTER', 15, 780, INK),
    text(818, 510, '3u RADIAL CLEARANCE', 15, 780, Q.coral),
    text(540, 748, '28u outer pipe · 22u liner · visible canister fits inside the lumen', 14, 640, MUTED, 'middle'),
  );

  parts.push(
    roundedRect(1076, 116, 2092, 760, 14, PANEL_COLD),
    text(1100, 153, '2 · EXACT ONE-CELL SOCKET GRAMMAR', 14, 780, MUTED),
    text(3144, 153, 'SOURCE CELL = x/y 32…96 INSIDE THE 128u TWO-CELL FRAME', 11, 760, Q.green, 'end'),
  );
  TRANSPORT_IDS.forEach((id, index) => {
    parts.push(engineeringTile(id, 1100 + index * 500, 198, 390, index === 0 || index === 3));
  });
  parts.push(
    text(1100, 724, 'Every butt socket lands at W (32,64), E (96,64), or S (64,96). Rounded endcaps never sit on a segment boundary.', 14, 640, INK),
    text(1100, 758, 'Couplers live inside the cell; wall collar and riser hardware wrap one uninterrupted centerline.', 14, 640, INK),
  );

  parts.push(
    roundedRect(32, 900, 3136, 532, 14, PANEL),
    text(56, 937, '3 · FOUR CELLS, ONE PIPE', 14, 780, MUTED),
    text(3144, 937, 'STRAIGHT → WALL PASS → RISER → STRAIGHT', 11, 760, Q.green, 'end'),
  );
  const routeSource = renderContinuousTubeRouteSvg();
  parts.push(
    placedSvg(routeSource, 180, 955, 900, 450),
    line(405, 985, 405, 1375, Q.coral, 2, .38, 'butt'),
    line(630, 985, 630, 1375, Q.coral, 2, .38, 'butt'),
    line(855, 985, 855, 1375, Q.coral, 2, .38, 'butt'),
    text(1165, 1030, 'CLOSE JOIN AUDIT', 12, 760, Q.coral),
    multilineText(1165, 1065, [
      'Cell-edge guides cross painted pipe at',
      'all three seams. The wall collar and riser',
      'wrap the centerline instead of replacing it.',
    ], 14, 24, 620, INK),
    placedSvg(routeSource, 1860, 1030, 600, 300),
    text(2160, 1365, 'FAR ROUTE STRIP · SAME COMPOSED SVG', 11, 760, MUTED, 'middle'),
    text(3040, 1085, 'Cell joins', 12, 760, Q.coral, 'end'),
    text(3040, 1115, 'remain painted', 12, 760, Q.coral, 'end'),
    text(3040, 1145, 'through the seam', 12, 760, Q.coral, 'end'),
  );

  parts.push(
    roundedRect(32, 1458, 2018, 630, 14, PANEL_ALT),
    text(56, 1495, '4 · STATION → NODE → RISER → ROUTE', 14, 780, MUTED),
    text(2026, 1495, 'SEPARATE NOUNS, ONE PHYSICAL ASSEMBLY', 11, 760, Q.green, 'end'),
  );
  const assemblyCell = 156;
  const assemblyX = 220;
  const assemblyY = 1640;
  const assembly = [
    refinedPriorityOneAssetSvg('dispatch_station', { state: 'high' }),
    refinedPriorityOneAssetSvg('pneumatic_dispatch_node'),
    refinedPriorityOneAssetSvg('tube_riser', { canisterInTube: true }),
    refinedPriorityOneAssetSvg('tube_straight'),
  ];
  assembly.forEach((source, index) => {
    parts.push(
      `<rect x="${assemblyX + index * assemblyCell}" y="${assemblyY}" width="${assemblyCell}" height="${assemblyCell}" fill="${FLOOR}" stroke="${FLOOR_LINE}" stroke-opacity=".35"/>`,
      logicalCellPlacement(source, assemblyX + index * assemblyCell, assemblyY, assemblyCell),
    );
  });
  parts.push(
    text(assemblyX + assemblyCell * .5, 1985, 'QUEUE', 11, 760, MUTED, 'middle'),
    text(assemblyX + assemblyCell * 1.5, 1985, 'FEEDER', 11, 760, MUTED, 'middle'),
    text(assemblyX + assemblyCell * 2.5, 1985, 'RISER', 11, 760, MUTED, 'middle'),
    text(assemblyX + assemblyCell * 3.5, 1985, 'FLOOR RUN', 11, 760, MUTED, 'middle'),
    text(assemblyX, 2032, 'Canisters remain discrete objects; the route remains a pipe, never a UI line or conveyor belt.', 13, 620, INK),
  );

  parts.push(
    roundedRect(2074, 1458, 1094, 630, 14, PANEL_WARN),
    text(2098, 1495, 'FAR-SCALE FAILURE CHECK · 40 PX / CELL', 14, 780, MUTED),
  );
  const farX = 2200;
  const farY = 1660;
  assembly.forEach((source, index) => {
    parts.push(
      `<rect x="${farX + index * FAR_CELL}" y="${farY}" width="${FAR_CELL}" height="${FAR_CELL}" fill="${FLOOR}"/>`,
      logicalCellPlacement(source, farX + index * FAR_CELL, farY, FAR_CELL),
    );
  });
  parts.push(
    multilineText(2098, 1810, [
      'Pass condition:',
      '• canister is narrower than the lumen',
      '• joins read as one uninterrupted pipe',
      '• station / node / riser remain separable nouns',
      '• no meters, routing arrows, or baked status color',
    ], 14, 25, 620, INK),
  );
  return svgPage(width, height, parts.join(''));
}

function comparisonCard(
  id: PriorityOneAssetId,
  label: string,
  x: number,
  y: number,
  width: number,
  state: FillState = 'empty',
): string {
  const size = 250;
  return roundedRect(x, y, width, 430, 10, PANEL_ALT) +
    text(x + 16, y + 27, label.toUpperCase(), 12, 780, MUTED) +
    text(x + width / 4, y + 55, 'B CONTROL', 10, 760, Q.coral, 'middle') +
    text(x + width * .75, y + 55, 'FOCUSED PASS', 10, 760, Q.green, 'middle') +
    placedSvg(priorityOneAssetSvg(id, { direction: 'percussion-line', state }), x + width / 4 - size / 2, y + 68, size) +
    placedSvg(refinedPriorityOneAssetSvg(id, { state }), x + width * .75 - size / 2, y + 68, size) +
    placedSvg(priorityOneAssetSvg(id, { direction: 'percussion-line', state }), x + width / 4 - 34, y + 333, 68) +
    placedSvg(refinedPriorityOneAssetSvg(id, { state }), x + width * .75 - 34, y + 333, 68);
}

export function renderMachineNounRefinementSvg(): string {
  const width = 3200;
  const height = 2330;
  const parts: string[] = [
    text(42, 55, 'ADMINISTRATIVE PERCUSSION · MACHINE-NOUN REFINEMENT', 30, 780, Q.green),
    text(42, 87, 'Accepted product family held · functional silhouette and period-office mechanism strengthened', 15, 620, MUTED),
    text(width - 42, 55, 'CLOSE + 40 PX/CELL READ · REVIEW ONLY', 13, 760, Q.coral, 'end'),
  ];
  const cards = [
    ['sorting_frame', 'Sorting Frame'],
    ['franking_machine', 'Franking Machine'],
    ['keypunch_bank', 'Keypunch Bank'],
    ['tabulating_machine', 'Tabulating Machine'],
    ['loading_dock', 'Loading dock · high', 'high'],
    ['delivery_uplink', 'Delivery uplink'],
  ] as const;
  cards.forEach(([id, label, state], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    parts.push(comparisonCard(id, label, 32 + column * 1584, 116 + row * 452, 1552, state ?? 'empty'));
  });

  parts.push(
    roundedRect(32, 1492, 2010, 790, 14, PANEL_COLD),
    text(56, 1529, 'BUFFER SILHOUETTES + EXPLICIT STATES', 14, 780, MUTED),
    text(2018, 1529, 'ONE-CELL FURNITURE · NO RUNTIME TINT', 11, 760, Q.green, 'end'),
  );
  const states: FillState[] = ['empty', 'low', 'high', 'overflowing'];
  states.forEach((state, index) => {
    const x = 72 + index * 480;
    parts.push(
      placedSvg(refinedPriorityOneAssetSvg('intake_tray_small', { state }), x, 1570, 190),
      placedSvg(refinedPriorityOneAssetSvg('intake_tray_large', { state }), x + 205, 1570, 190),
      text(x + 95, 1782, 'SMALL', 10, 760, MUTED, 'middle'),
      text(x + 300, 1782, 'LARGE', 10, 760, MUTED, 'middle'),
      text(x + 198, 1812, state.toUpperCase(), 12, 780, state === 'overflowing' ? Q.coral : INK, 'middle'),
      placedSvg(refinedPriorityOneAssetSvg('intake_tray_small', { state }), x + 64, 1842, 66),
      placedSvg(refinedPriorityOneAssetSvg('intake_tray_large', { state }), x + 242, 1842, 66),
    );
  });
  parts.push(
    multilineText(70, 2030, [
      'Small = low receiving cradle. Large = tall vertical magazine. Both keep the same suggested 1×1 footprint.',
      'Fill reads by occupied volume and silhouette. Overflow leaves the SKU and lands as a placed canister.',
    ], 14, 25, 620, INK),
  );

  parts.push(
    roundedRect(2066, 1492, 1102, 790, 14, PANEL_WARN),
    text(2090, 1529, 'WHAT CHANGED', 14, 780, MUTED),
  );
  const calls = [
    'Sorting: dark open pigeonholes plus a projecting sorting ledge; no keypad/vending front.',
    'Franking: envelope feed, platen, stamp head, and hand lever replace the coffee-appliance read.',
    'Keypunch: card hoppers, punch drums, and physical key decks replace screen-like bays.',
    'Tabulator: exposed drum, roller, card hopper, and fanfold output replace the large green display.',
    'Dock: apron/ramp, bumpers, pallet slats, and crate stacks separate it from a table.',
    'Uplink: unequal IRIS-like shoulders frame a canister elevator/throat, never an optic or screen.',
  ];
  calls.forEach((call, index) => {
    const y = 1582 + index * 104;
    parts.push(
      `<circle cx="2098" cy="${y - 5}" r="5" fill="${index < 5 ? Q.green : Q.coral}"/>`,
      multilineText(2116, y, wrap(call, 90), 14, 22, 590, INK),
    );
  });
  return svgPage(width, height, parts.join(''));
}

class ComposedProofRenderer {
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

  character(recipe: CharacterRecipe, facing: Facing | 'west', pose: Pose = 'neutral'): string {
    const key = `${recipe.id}:${facing}:${pose}`;
    let source = this.characterCache.get(key);
    if (!source) {
      source = composeCharacter(recipe, this.style, facing, AUTHORING_CANVAS, 'normal', { badge: false, pose });
      this.characterCache.set(key, source);
    }
    return source;
  }

  wallTile(maskIndex: number, x: number, y: number, size: number, flipX = false): string {
    const key = `${maskIndex}:${flipX}`;
    let markup = this.wallCache.get(key);
    if (!markup) {
      const source = composeWallTile(this.wall, this.style, BLOB_CONFIGS[maskIndex], AUTHORING_CANVAS);
      const inner = stripSvgShell(source);
      markup = flipX ? `<g transform="matrix(-1 0 0 1 128 0)">${inner}</g>` : inner;
      this.wallCache.set(key, markup);
    }
    return `<svg x="${x}" y="${y}" width="${size}" height="${size}" ` +
      `viewBox="0 0 128 128" preserveAspectRatio="none" overflow="hidden">${markup}</svg>`;
  }
}

function drawGrid(parts: string[], x: number, y: number, columns: number, rows: number, cell: number): void {
  parts.push(`<rect x="${x}" y="${y}" width="${columns * cell}" height="${rows * cell}" ` +
    `fill="${FLOOR}" stroke="#56616A" stroke-width="2"/>`);
  for (let column = 1; column < columns; column += 1) {
    parts.push(line(x + column * cell, y, x + column * cell, y + rows * cell, FLOOR_LINE, 1, .18, 'butt'));
  }
  for (let row = 1; row < rows; row += 1) {
    parts.push(line(x, y + row * cell, x + columns * cell, y + row * cell, FLOOR_LINE, 1, .18, 'butt'));
  }
}

function drawOuterWalls(
  parts: string[],
  renderer: ComposedProofRenderer,
  x: number,
  y: number,
  columns: number,
  rows: number,
  cell: number,
  layer: 'back' | 'front',
): void {
  if (layer === 'back') {
    parts.push(renderer.wallTile(6, x, y, cell));
    for (let column = 1; column < columns - 1; column += 1) parts.push(renderer.wallTile(10, x + column * cell, y, cell));
    parts.push(renderer.wallTile(12, x + (columns - 1) * cell, y, cell));
    for (let row = 1; row < rows - 1; row += 1) {
      parts.push(renderer.wallTile(5, x, y + row * cell, cell));
      parts.push(renderer.wallTile(5, x + (columns - 1) * cell, y + row * cell, cell, true));
    }
    return;
  }
  parts.push(renderer.wallTile(3, x, y + (rows - 1) * cell, cell));
  for (let column = 1; column < columns - 1; column += 1) parts.push(renderer.wallTile(10, x + column * cell, y + (rows - 1) * cell, cell));
  parts.push(renderer.wallTile(9, x + (columns - 1) * cell, y + (rows - 1) * cell, cell));
}

function assetFootprint(id: PriorityOneAssetId): { w: number; h: number } {
  switch (id) {
    case 'loading_dock': return { w: 3, h: 2 };
    case 'sorting_frame':
    case 'keypunch_bank':
    case 'tabulating_machine':
    case 'delivery_uplink': return { w: 2, h: 2 };
    default: return { w: 1, h: 1 };
  }
}

function assetPlacement(
  id: PriorityOneAssetId,
  x: number,
  y: number,
  cell: number,
  options: RefinedAssetOptions = {},
  showOccupancy = false,
): string {
  const footprint = assetFootprint(id);
  const width = footprint.w * cell;
  const height = footprint.h * cell;
  const nativeSize = cell * PROP_NATIVE_FRAME_CELLS;
  const spriteX = x + (width - nativeSize) / 2;
  const plan = TRANSPORT_IDS.includes(id as RefinedTubeId);
  const spriteY = plan ? y + (height - nativeSize) / 2 : y + height - nativeSize * (116 / AUTHORING_CANVAS);
  const guide = showOccupancy
    ? `<rect x="${x + 3}" y="${y + 3}" width="${Math.max(4, width - 6)}" height="${Math.max(4, height - 6)}" ` +
      `rx="5" fill="${OCCUPANCY}" fill-opacity=".06" stroke="${OCCUPANCY}" stroke-width="1.2" stroke-dasharray="6 5"/>`
    : '';
  return guide + placedSvg(refinedPriorityOneAssetSvg(id, options), spriteX, spriteY, nativeSize);
}

function characterPlacement(
  renderer: ComposedProofRenderer,
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

function refinedMinimalChainScene(
  renderer: ComposedProofRenderer,
  originX: number,
  originY: number,
  cell: number,
): string {
  const parts: string[] = [];
  const columns = 16;
  const rows = 7;
  const dividerColumn = 8;
  drawGrid(parts, originX, originY, columns, rows, cell);
  drawOuterWalls(parts, renderer, originX, originY, columns, rows, cell, 'back');
  for (let row = 1; row < rows - 1; row += 1) {
    parts.push(renderer.wallTile(5, originX + dividerColumn * cell, originY + row * cell, cell));
  }

  parts.push(
    assetPlacement('loading_dock', originX - 3.1 * cell, originY + 1.4 * cell, cell, { state: 'high' }, true),
    assetPlacement('sorting_frame', originX + .8 * cell, originY + .8 * cell, cell, {}, true),
    assetPlacement('franking_machine', originX + 4.6 * cell, originY + 2.0 * cell, cell),
    assetPlacement('keypunch_bank', originX + 9.2 * cell, originY + .8 * cell, cell, {}, true),
    assetPlacement('tabulating_machine', originX + 12.1 * cell, originY + .8 * cell, cell, {}, true),
    assetPlacement('delivery_uplink', originX + 13.5 * cell, originY + 3.6 * cell, cell, {}, true),
  );

  const routeRow = 5;
  const routeY = originY + routeRow * cell;
  const route = [
    ['dispatch_station', 2, { state: 'high' }],
    ['pneumatic_dispatch_node', 3, {}],
    ['tube_riser', 4, { canisterInTube: true }],
    ['tube_straight', 5, {}],
    ['tube_straight', 6, { canisterInTube: true }],
    ['tube_straight', 7, {}],
    ['tube_wallpass', 8, { canisterInTube: true }],
    ['tube_straight', 9, {}],
    ['tube_riser', 10, {}],
    ['intake_tray_large', 11, { state: 'overflowing' }],
  ] as const;
  route.forEach(([id, column, options]) => {
    parts.push(assetPlacement(id, originX + column * cell, routeY, cell, options, false));
  });

  parts.push(
    assetPlacement('dispatch_station', originX + 12.3 * cell, originY + 4.8 * cell, cell, { state: 'low' }),
    characterPlacement(renderer, DEFAULT_CAST[0], 'south', originX + 3.4 * cell, originY + 4.25 * cell, cell),
    characterPlacement(renderer, DEFAULT_CAST[1], 'west', originX + 5.45 * cell, originY + 3.55 * cell, cell),
    characterPlacement(renderer, DEFAULT_CAST[2], 'east', originX + 2.7 * cell, originY + 3.0 * cell, cell, 'walk-approach'),
    characterPlacement(renderer, DEFAULT_CAST[3], 'south', originX + 10.6 * cell, originY + 3.9 * cell, cell),
    characterPlacement(renderer, DEFAULT_CAST[2], 'east', originX + 12.0 * cell, originY + 4.2 * cell, cell),
    characterPlacement(renderer, DEFAULT_CAST[0], 'west', originX + 14.4 * cell, originY + 3.2 * cell, cell, 'walk-approach'),
    placedSvg(refinedPriorityOneAssetSvg('canister_base', { stamp: 'raw_records' }), originX + .1 * cell, originY + 3.6 * cell, cell),
    placedSvg(refinedPriorityOneAssetSvg('canister_base', { stamp: 'structured_data' }), originX + 11.8 * cell, originY + 3.65 * cell, cell),
  );

  drawOuterWalls(parts, renderer, originX, originY, columns, rows, cell, 'front');
  parts.push(
    text(originX + 4.2 * cell, originY - 16, 'INTAKE', Math.max(10, cell * .18), 780, Q.green, 'middle'),
    text(originX + 12.1 * cell, originY - 16, 'DATA PROCESSING', Math.max(10, cell * .18), 780, Q.green, 'middle'),
    text(originX + dividerColumn * cell + cell / 2, originY + 1.4 * cell, 'WALL PASS', Math.max(8, cell * .11), 760, MUTED, 'middle'),
  );
  return parts.join('');
}

export function renderRefinedMinimalChainRoomSvg(): string {
  const width = 3400;
  const height = 2320;
  const renderer = new ComposedProofRenderer();
  const parts: string[] = [
    text(42, 55, 'MINIMAL CHAIN · FOCUSED READABILITY PASS', 30, 780, Q.green),
    text(42, 87, 'Intake → Data Processing → delivery · accepted B family · corrected physical transport grammar', 15, 620, MUTED),
    text(width - 42, 55, 'COMPOSED PIXELS · NOT EXPORT / PARITY', 13, 760, Q.coral, 'end'),
    roundedRect(32, 116, width - 64, 1190, 14, PANEL),
    text(56, 153, 'CLOSE COMPOSED READ · 112 PX / CELL', 13, 760, MUTED),
    refinedMinimalChainScene(renderer, 720, 260, 112),
    multilineText(2700, 265, [
      'Transport read:',
      'queue → feeder → riser',
      '→ continuous floor run',
      '→ wall collar → receiving',
      'riser → large intake tray.',
      '',
      'The canister is visibly',
      'contained by the route.',
    ], 14, 24, 620, INK),
  ];
  parts.push(
    roundedRect(32, 1330, 2020, 930, 14, PANEL_COLD),
    text(56, 1367, 'FAR GAMEPLAY SCALE · 40 PX / CELL', 13, 760, MUTED),
    refinedMinimalChainScene(renderer, 370, 1465, FAR_CELL),
    text(70, 1950, 'FAR STATE READ', 11, 760, MUTED),
  );
  const states: FillState[] = ['empty', 'low', 'high', 'overflowing'];
  states.forEach((state, index) => {
    const x = 84 + index * 225;
    parts.push(
      placedSvg(refinedPriorityOneAssetSvg('intake_tray_small', { state }), x, 1980, 92),
      placedSvg(refinedPriorityOneAssetSvg('intake_tray_large', { state }), x + 92, 1980, 92),
      text(x + 92, 2090, state.toUpperCase(), 10, 760, state === 'overflowing' ? Q.coral : MUTED, 'middle'),
    );
  });
  parts.push(
    roundedRect(2076, 1330, 1292, 930, 14, PANEL_ALT),
    text(2100, 1367, 'READABILITY QUESTIONS FOR THIS GATE', 13, 780, MUTED),
  );
  const questions = [
    'Does the tube now read as physically capable of carrying the canister?',
    'Do straight / wall-pass / riser joins read as one continuous route at normal and far scale?',
    'Does the station → node → riser assembly read as a queue feeding a powered pneumatic route?',
    'Do Sorting, Franking, Keypunch, and Tabulator now separate by mechanical noun without screen language?',
    'Do small / large and empty / low / high / overflowing buffers survive the room context?',
    'Does the Delivery Uplink feel like an IRIS sibling with an outbound canister throat, not an appliance?',
  ];
  questions.forEach((question, index) => {
    const y = 1422 + index * 119;
    parts.push(
      `<circle cx="2110" cy="${y - 5}" r="5" fill="${index < 5 ? Q.green : Q.coral}"/>`,
      multilineText(2129, y, wrap(question, 96), 14, 22, 590, INK),
    );
  });
  parts.push(
    roundedRect(2100, 2150, 1244, 82, 9, PANEL_WARN),
    text(2120, 2183, 'Still standardized SKU art: no wear, clutter, UI, amber/rose, or camera cues.', 13, 650, Q.coral),
  );
  return svgPage(width, height, parts.join(''));
}

function rasterize(svg: string): Uint8Array {
  return new Resvg(svg).render().asPng();
}

export interface DepartmentMachineRefinementResult {
  readonly output: string;
  readonly files: readonly string[];
  readonly metricsPath: string;
  readonly readmePath: string;
}

export async function renderDepartmentMachineReadabilityRefinement(
  output: string,
): Promise<DepartmentMachineRefinementResult> {
  await mkdir(output, { recursive: true });
  const pages = [
    ['01-tube-canister-engineering', renderTubeCanisterEngineeringSvg()],
    ['02-machine-noun-refinement', renderMachineNounRefinementSvg()],
    ['03-refined-minimal-chain-room', renderRefinedMinimalChainRoomSvg()],
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
    reviewStatus: 'awaiting-owner-focused-readability-approval',
    acceptedDirection: 'percussion-line',
    acceptedContractDecisionsHeld: true,
    productionPromotion: false,
    canonicalSvgAuthoring: false,
    templateRegistration: false,
    defaultsMutation: false,
    exportRun: false,
    schemaMutation: false,
    unityImport: false,
    parityClaim: false,
    scope: 'priority-1-focused-refinement-only',
    tubeGeometry: REFINED_TUBE_GEOMETRY,
    assetIds: REFINED_ASSET_IDS,
    invariants: {
      authoringCanvas: AUTHORING_CANVAS,
      propNativeFrameCells: PROP_NATIVE_FRAME_CELLS,
      farGameplayPixelsPerCell: FAR_CELL,
      amberUsed: false,
      roseUsed: false,
      bakedUiUsed: false,
      cameraCueUsed: false,
      standardizedSku: true,
    },
  };
  const metricsPath = path.join(output, 'metrics.json');
  await writeFile(metricsPath, `${JSON.stringify(metrics, null, 2)}\n`, 'utf8');
  files.push(metricsPath);

  const readme = `# QuotaCo department-machine readability refinement v2

Status: **review-only; awaiting focused readability approval**

Direction B — Administrative Percussion — and the accepted contract decisions are held. This pass
corrects the transport scale and join grammar first, then tightens the weakest Priority 1 machine nouns.

The tube proof uses exact post-rescale logical-cell sockets inside the 128u two-cell frame: W (32,64),
E (96,64), S (64,96). The pipe is 28u outside / 16u lumen and the canister is 10u thick, leaving 3u
radial clearance. Straight, wall-pass, and riser pieces share one uninterrupted centerline.

It intentionally changes no production SVG, PropTemplate, defaults, exporter, schema, bundle, Unity
import, parity baseline, or commit. Priority 2 has not started.

## Owner gate

Approve or correct the three pages: physical transport, machine nouns, and composed close/far room read.
Only accepted pixels move into the established canonical authoring → composed-office export → sim import
→ parity flow.
`;
  const readmePath = path.join(output, 'README.md');
  await writeFile(readmePath, readme, 'utf8');
  files.push(readmePath);
  return { output, files, metricsPath, readmePath };
}

function parseOut(argv: readonly string[]): string {
  const index = argv.indexOf('--out');
  if (index >= 0 && argv[index + 1]) return path.resolve(argv[index + 1]);
  return path.resolve('docs/previews/quota-co-department-machine-readability-refinement-v2');
}

async function main(): Promise<void> {
  const result = await renderDepartmentMachineReadabilityRefinement(parseOut(process.argv.slice(2)));
  process.stdout.write(`Wrote ${result.files.length} review-only files to ${result.output}\n`);
}

const isMain = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;
if (isMain) await main();
