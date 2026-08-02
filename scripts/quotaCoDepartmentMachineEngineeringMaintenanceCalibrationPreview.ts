/**
 * Accepted-control Priority 3A QuotaCo department-machine refinement record.
 *
 *   npx tsx scripts/quotaCoDepartmentMachineEngineeringMaintenanceCalibrationPreview.ts
 *   npx tsx scripts/quotaCoDepartmentMachineEngineeringMaintenanceCalibrationPreview.ts --out /tmp/priority3a
 *
 * The renderer recreates the accepted visual record. Production authoring and
 * browser-export parity are performed by the canonical source/import pipeline;
 * schema and Unity remain outside this content-only promotion.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

import { DEPARTMENT_MACHINE_PALETTE } from './quotaCoDepartmentMachineFamilyCalibrationPreview';
import { refinedPriorityOneAssetSvg } from './quotaCoDepartmentMachineReadabilityRefinementPreview';
import { priorityTwoAssetSvg } from './quotaCoDepartmentMachinePhaseASpineCalibrationPreview';
import { PROP_NATIVE_FRAME_CELLS } from './quotaCoWorkstationFamilyCalibrationPreview';

const AUTHORING_CANVAS = 128;
const NORMAL_CELL = 90;
const FAR_CELL = 40;

const PAGE = '#E7E1D2';
const PANEL = '#F6F1E6';
const PANEL_ALT = '#ECE5D7';
const PANEL_COLD = '#E4ECE8';
const INK = '#292C2A';
const MUTED = '#626861';
const RULE = '#A39B8B';
const FLOOR = '#7B8890';
const FLOOR_LINE = '#D9D4C7';
const Q = DEPARTMENT_MACHINE_PALETTE;

export const PRIORITY_THREE_A_ASSET_IDS = [
  'terminal_bank',
  'compiler_press',
  'parts_crib',
  'workbench',
] as const;

export type PriorityThreeAAssetId = (typeof PRIORITY_THREE_A_ASSET_IDS)[number];

export const PRIORITY_THREE_A_WORK_TYPE_STAMPS = [
  'specifications',
  'code',
  'release',
  'repairs',
] as const;

export type PriorityThreeAWorkTypeStamp =
  (typeof PRIORITY_THREE_A_WORK_TYPE_STAMPS)[number];

export interface PriorityThreeAScaleSuggestion {
  readonly id: PriorityThreeAAssetId;
  readonly department: 'Engineering' | 'Maintenance';
  readonly label: string;
  readonly suggestedFootprint: { readonly w: number; readonly h: number };
  readonly nounRead: string;
  readonly pollution: 'heat' | 'noise' | 'quiet';
}

export const PRIORITY_THREE_A_SCALE_SUGGESTIONS:
readonly PriorityThreeAScaleSuggestion[] = [
  {
    id: 'terminal_bank',
    department: 'Engineering',
    label: 'Terminal Bank',
    suggestedFootprint: { w: 3, h: 2 },
    nounRead: 'three deep CRT hoods + three keyboards + one rear thermal spine',
    pollution: 'heat',
  },
  {
    id: 'compiler_press',
    department: 'Engineering',
    label: 'Compiler Press',
    suggestedFootprint: { w: 2, h: 2 },
    nounRead: 'impact hammer bridge + sprocket listing throat + accordion output',
    pollution: 'noise',
  },
  {
    id: 'parts_crib',
    department: 'Maintenance',
    label: 'Parts Crib',
    suggestedFootprint: { w: 2, h: 2 },
    nounRead: 'caged bin wall + controlled issue hatch + standardized drawers',
    pollution: 'quiet',
  },
  {
    id: 'workbench',
    department: 'Maintenance',
    label: 'Workbench',
    suggestedFootprint: { w: 2, h: 2 },
    nounRead: 'heavy service bed + mounted vise + overhead machine yoke',
    pollution: 'quiet',
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
  fill: string = INK,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return `<text x="${x}" y="${y}" font-family="Inter,Arial,sans-serif" ` +
    `font-size="${size}" font-weight="${weight}" fill="${fill}" ` +
    `text-anchor="${anchor}">${escapeText(value)}</text>`;
}

function wrap(value: string, max = 58): string[] {
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
  return lines;
}

function wrappedText(
  x: number,
  y: number,
  value: string,
  max = 58,
  size = 15,
  lineHeight = 22,
  weight = 500,
  fill: string = INK,
): string {
  return wrap(value, max)
    .map((entry, index) => text(x, y + index * lineHeight, entry, size, weight, fill))
    .join('');
}

function panel(
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string = PANEL,
  radius = 14,
): string {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" ` +
    `fill="${fill}" stroke="${RULE}" stroke-width="1.5"/>`;
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
  return `<path d="M ${x1} ${y1} L ${x2} ${y2}" fill="none" stroke="${stroke}" ` +
    `stroke-width="${width}" stroke-linecap="round" opacity="${opacity}"/>`;
}

function assetSvg(markup: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ` +
    `viewBox="0 0 128 128">${markup}</svg>`;
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

function shell(
  x: number,
  y: number,
  width: number,
  height: number,
  shoulder: 'left' | 'right' | 'both' = 'both',
): string {
  const leftTop = shoulder === 'right' ? x + 5 : x + 15;
  const rightTop = shoulder === 'left' ? x + width - 5 : x + width - 15;
  return (
    `<path id="catalog-contour" d="M ${x + 8} ${y + 10} Q ${x + 8} ${y + 3} ${leftTop} ${y + 3} ` +
    `H ${rightTop} Q ${x + width - 8} ${y + 3} ${x + width - 8} ${y + 10} ` +
    `L ${x + width - 3} ${y + 16} V ${y + height - 6} Q ${x + width - 3} ${y + height} ` +
    `${x + width - 9} ${y + height} H ${x + 9} Q ${x + 3} ${y + height} ${x + 3} ${y + height - 6} ` +
    `V ${y + 16} Z" fill="${Q.charcoal}"/>` +
    `<path id="catalog-shell" d="M ${x + 11} ${y + 12} Q ${x + 11} ${y + 8} ${leftTop + 2} ${y + 8} ` +
    `H ${rightTop - 2} Q ${x + width - 11} ${y + 8} ${x + width - 11} ${y + 12} ` +
    `L ${x + width - 8} ${y + 18} V ${y + height - 18} H ${x + 8} V ${y + 18} Z" fill="${Q.cream}"/>` +
    `<path id="top-plane-light" d="M ${leftTop + 3} ${y + 9} H ${rightTop - 3}" ` +
    `stroke="${Q.white}" stroke-width="2" stroke-linecap="round" opacity=".18"/>` +
    `<rect id="stepped-green-base" x="${x + 3}" y="${y + height - 18}" width="${width - 6}" ` +
    `height="14" rx="4" fill="${Q.green}"/>` +
    `<rect id="base-service-register" x="${x + 13}" y="${y + height - 13}" width="${width - 26}" ` +
    `height="3" rx="1.5" fill="${Q.teal}"/>`
  );
}

function paperStack(x: number, y: number, width: number, rows = 3): string {
  return Array.from({ length: rows }, (_, index) =>
    `<path id="paper-${x}-${y}-${index}" d="M ${x + index} ${y - index * 3} H ${x + width + index} ` +
    `L ${x + width - 2 + index} ${y + 9 - index * 3} H ${x - 2 + index} Z" ` +
    `fill="${Q.cream}" stroke="${Q.charcoal}" stroke-width="1.5"/>`,
  ).join('');
}

function terminalBankSvg(): string {
  const parts = [
    shell(4, 24, 120, 95),
    `<g id="rear-thermal-spine">`,
    `<path d="M 12 33 H 116 V 50 H 12 Z" fill="${Q.charcoal}"/>`,
    ...[0, 1, 2].map((index) => {
      const x = 24 + index * 36;
      return `<path d="M ${x} 39 V 15 Q ${x} 11 ${x + 4} 11 H ${x + 8} Q ${x + 12} 11 ${x + 12} 15 V 39 Z" ` +
        `fill="${Q.metal}" stroke="${Q.charcoal}" stroke-width="2.5"/>`;
    }),
    `<path d="M 18 35 H 110" stroke="${Q.teal}" stroke-width="4" opacity=".75"/>`,
    `</g>`,
    `<g id="three-deep-crt-hoods">`,
    ...[0, 1, 2].map((index) => {
      const x = 11 + index * 36;
      return `<path d="M ${x} 49 L ${x + 5} 41 H ${x + 27} L ${x + 34} 49 V 79 H ${x} Z" ` +
        `fill="${Q.charcoal}"/>` +
        `<path d="M ${x + 5} 49 Q ${x + 5} 45 ${x + 9} 45 H ${x + 26} Q ${x + 30} 45 ${x + 30} 49 ` +
        `V 70 Q ${x + 30} 74 ${x + 26} 74 H ${x + 9} Q ${x + 5} 74 ${x + 5} 70 Z" fill="${Q.glass}"/>` +
        `<path d="M ${x + 9} 48 H ${x + 25}" stroke="${Q.white}" stroke-width="2" opacity=".2"/>` +
        `<path d="M ${x + 30} 49 L ${x + 34} 52 V 77 L ${x + 30} 74 Z" fill="${Q.teal}" opacity=".75"/>`;
    }),
    `</g>`,
    `<g id="three-keyboards">`,
    ...[0, 1, 2].map((index) => {
      const x = 12 + index * 36;
      return `<path d="M ${x} 80 H ${x + 32} L ${x + 27} 97 H ${x + 5} Z" fill="${Q.cream}" ` +
        `stroke="${Q.charcoal}" stroke-width="2"/>` +
        `<path d="M ${x + 7} 85 H ${x + 25}" stroke="${Q.metal}" stroke-width="3"/>` +
        [0, 1, 2].map((key) => `<circle cx="${x + 9 + key * 7}" cy="91" r="1.5" fill="${Q.charcoal}"/>`).join('');
    }),
    `</g>`,
    `<path id="shared-cable-trough" d="M 12 101 H 116 V 107 H 12 Z" fill="${Q.teal}"/>`,
  ];
  return assetSvg(parts.join(''));
}

function compilerPressSvg(): string {
  const parts = [
    shell(7, 18, 114, 101, 'right'),
    `<path id="sprocket-listing-throat" d="M 43 29 H 86 V 96 H 43 Z" fill="${Q.charcoal}"/>`,
    `<path id="continuous-listing" d="M 49 31 H 80 V 92 H 49 Z" fill="${Q.cream}"/>`,
    `<g id="listing-sprockets">${[0, 1, 2, 3, 4, 5].map((index) =>
      `<circle cx="53" cy="${38 + index * 8}" r="1.8" fill="${Q.teal}"/>` +
      `<circle cx="76" cy="${38 + index * 8}" r="1.8" fill="${Q.teal}"/>`).join('')}</g>`,
    `<g id="impact-camshaft"><path d="M 19 37 H 108" stroke="${Q.charcoal}" stroke-width="8" ` +
    `stroke-linecap="round"/>${[0, 1, 2, 3, 4].map((index) =>
      `<circle cx="${36 + index * 14}" cy="37" r="6" fill="${Q.metal}" stroke="${Q.charcoal}" stroke-width="2"/>`).join('')}</g>`,
    `<g id="impact-hammer-bridge">`,
    `<path d="M 18 55 H 109 V 69 H 18 Z" fill="${Q.metal}" stroke="${Q.charcoal}" stroke-width="3"/>`,
    ...[0, 1, 2, 3, 4].map((index) =>
      `<path d="M ${36 + index * 14} 42 V 62" stroke="${Q.charcoal}" stroke-width="5" stroke-linecap="round"/>`),
    `</g>`,
    `<circle id="left-feed-wheel" cx="25" cy="76" r="12" fill="${Q.teal}" stroke="${Q.charcoal}" stroke-width="4"/>`,
    `<circle id="right-feed-wheel" cx="103" cy="76" r="12" fill="${Q.teal}" stroke="${Q.charcoal}" stroke-width="4"/>`,
    `<g id="noise-isolation-feet"><rect x="16" y="94" width="22" height="8" rx="3" fill="${Q.metal}"/>` +
    `<rect x="91" y="94" width="22" height="8" rx="3" fill="${Q.metal}"/></g>`,
    `<g id="accordion-output">${paperStack(44, 103, 41, 4)}</g>`,
  ];
  return assetSvg(parts.join(''));
}

function partsCribSvg(): string {
  const parts = [
    shell(7, 15, 114, 104),
    `<path id="caged-bin-wall" d="M 15 28 H 113 V 90 H 15 Z" fill="${Q.charcoal}"/>`,
    `<g id="standardized-parts-bins">`,
    ...[0, 1, 2].flatMap((row) => [0, 1, 2, 3].map((column) => {
      const x = 20 + column * 23;
      const y = 34 + row * 16;
      return `<path d="M ${x} ${y} H ${x + 18} V ${y + 11} H ${x} Z" ` +
        `fill="${(row + column) % 3 === 0 ? Q.teal : Q.cream}"/>`;
    })),
    `</g>`,
    `<g id="orthogonal-security-mesh" fill="none" stroke="${Q.metal}" stroke-width="1.4">` +
    `${[0, 1, 2, 3, 4].map((index) => `<path d="M ${18 + index * 23} 30 V 87" opacity=".75"/>`).join('')}` +
    `${[0, 1, 2, 3].map((index) => `<path d="M 17 ${31 + index * 18} H 111" opacity=".75"/>`).join('')}</g>`,
    `<path id="cage-door-stile" d="M 64 29 V 88" stroke="${Q.cream}" stroke-width="4"/>`,
    `<circle id="controlled-cage-latch" cx="70" cy="61" r="4" fill="${Q.teal}" stroke="${Q.charcoal}" stroke-width="2"/>`,
    `<path id="controlled-issue-hatch" d="M 29 82 H 99 V 104 H 29 Z" fill="${Q.metal}" ` +
    `stroke="${Q.charcoal}" stroke-width="3"/>`,
    `<path d="M 39 91 H 89" stroke="${Q.teal}" stroke-width="5" stroke-linecap="round"/>`,
  ];
  return assetSvg(parts.join(''));
}

function workbenchSvg(): string {
  const parts = [
    shell(8, 23, 112, 96, 'left'),
    `<path id="overhead-machine-yoke" d="M 25 70 V 40 Q 25 31 34 31 H 96 Q 103 31 103 38 V 51" ` +
    `fill="none" stroke="${Q.charcoal}" stroke-width="10" stroke-linecap="round"/>`,
    `<g id="articulated-service-arm"><circle cx="61" cy="38" r="8" fill="${Q.metal}" ` +
    `stroke="${Q.charcoal}" stroke-width="3"/><path d="M 61 45 L 72 56 V 68" fill="none" ` +
    `stroke="${Q.metal}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M 66 67 H 78" stroke="${Q.charcoal}" stroke-width="5" stroke-linecap="round"/></g>`,
    `<path id="service-bed" d="M 16 69 H 112 V 86 H 16 Z" fill="${Q.metal}" ` +
    `stroke="${Q.charcoal}" stroke-width="3"/>`,
    `<g id="mounted-vise"><path d="M 81 54 H 107 V 73 H 81 Z" fill="${Q.teal}" ` +
    `stroke="${Q.charcoal}" stroke-width="3"/><path d="M 85 48 V 61 M 102 48 V 61" ` +
    `stroke="${Q.metal}" stroke-width="6" stroke-linecap="round"/>` +
    `<path d="M 104 64 H 115" stroke="${Q.charcoal}" stroke-width="4" stroke-linecap="round"/>` +
    `<circle cx="116" cy="64" r="4" fill="${Q.metal}" stroke="${Q.charcoal}" stroke-width="2"/></g>`,
    `<g id="service-cradle"><path d="M 34 68 Q 46 49 58 68 V 77 H 34 Z" fill="${Q.charcoal}"/>` +
    `<circle cx="46" cy="61" r="6" fill="${Q.teal}"/></g>`,
    `<g id="standard-drawer-bank"><rect x="24" y="91" width="28" height="12" rx="2" fill="${Q.teal}"/>` +
    `<path id="open-service-bay" d="M 56 90 H 83 V 105 H 56 Z" fill="${Q.charcoal}"/>` +
    `<rect x="88" y="91" width="21" height="12" rx="2" fill="${Q.teal}"/></g>`,
  ];
  return assetSvg(parts.join(''));
}

export function priorityThreeAAssetSvg(id: PriorityThreeAAssetId): string {
  switch (id) {
    case 'terminal_bank': return terminalBankSvg();
    case 'compiler_press': return compilerPressSvg();
    case 'parts_crib': return partsCribSvg();
    case 'workbench': return workbenchSvg();
  }
}

export function priorityThreeAStampOverlaySvg(stamp: PriorityThreeAWorkTypeStamp): string {
  if (stamp === 'specifications') {
    return assetSvg(`<g id="specifications-stamp" fill="none" stroke="${Q.white}" stroke-width="2" ` +
      `stroke-linejoin="round"><path d="M 55 56 H 73 V 73 H 55 Z M 59 60 H 69 M 59 65 H 69 M 59 70 H 66"/>` +
      `<circle cx="72" cy="57" r="3"/></g>`);
  }
  if (stamp === 'code') {
    return assetSvg(`<g id="code-stamp" fill="none" stroke="${Q.white}" stroke-width="2.2" ` +
      `stroke-linecap="round" stroke-linejoin="round"><path d="M 61 57 L 55 64 L 61 71 M 67 57 L 73 64 L 67 71 M 66 55 L 62 73"/></g>`);
  }
  if (stamp === 'release') {
    return assetSvg(`<g id="release-stamp" fill="none" stroke="${Q.white}" stroke-width="2" ` +
      `stroke-linejoin="round"><path d="M 55 58 H 73 V 72 H 55 Z M 59 54 H 69 V 58"/>` +
      `<path d="M 59 63 H 69 M 59 67 H 66"/><circle cx="71" cy="70" r="3"/></g>`);
  }
  return assetSvg(`<g id="repairs-stamp" fill="none" stroke="${Q.white}" stroke-width="2.2" ` +
    `stroke-linecap="round" stroke-linejoin="round"><path d="M 57 57 L 71 71 M 68 55 Q 74 57 72 63 L 66 57 Q 65 55 68 55 Z"/>` +
    `<circle cx="57" cy="71" r="3"/></g>`);
}

function canisterSvg(stamp: PriorityThreeAWorkTypeStamp): string {
  const base = refinedPriorityOneAssetSvg('canister_base')
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
  const overlay = priorityThreeAStampOverlaySvg(stamp)
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
  return assetSvg(`${base}${overlay}`);
}

function familyPage(): string {
  const width = 2460;
  const height = 1180;
  const parts = [
    text(46, 58, 'QUOTACO DEPARTMENT MACHINES · PRIORITY 3A · REFINEMENT V2', 30, 850),
    text(46, 91, 'OWNER ACCEPTED · static production control at 90/40 px · animation contract remains deferred', 15, 750, Q.green),
    text(width - 46, 58, '128u source · 90 px normal · 40 px far', 14, 700, MUTED, 'end'),
  ];
  PRIORITY_THREE_A_SCALE_SUGGESTIONS.forEach((entry, index) => {
    const x = 46 + index * 604;
    const y = 125;
    parts.push(
      panel(x, y, 566, 990, index % 2 ? PANEL_ALT : PANEL),
      text(x + 24, y + 40, entry.department.toUpperCase(), 12, 820, Q.green),
      text(x + 24, y + 69, entry.label, 20, 850, INK),
      text(x + 542, y + 40, `${entry.suggestedFootprint.w}×${entry.suggestedFootprint.h} SUGGESTED`, 11, 750, MUTED, 'end'),
      placedSvg(priorityThreeAAssetSvg(entry.id), x + 75, y + 105, 410),
      panel(x + 55, y + 535, 456, 235, PANEL_COLD, 10),
      text(x + 75, y + 566, 'LITERAL SCALE', 11, 820, MUTED),
      placedSvg(priorityThreeAAssetSvg(entry.id), x + 85, y + 590, NORMAL_CELL * PROP_NATIVE_FRAME_CELLS),
      placedSvg(priorityThreeAAssetSvg(entry.id), x + 335, y + 650, FAR_CELL),
      text(x + 175, y + 751, '90 px/cell', 11, 700, MUTED, 'middle'),
      text(x + 355, y + 711, '40 px', 11, 700, MUTED, 'middle'),
      text(x + 24, y + 815, entry.id, 13, 820, Q.teal),
      wrappedText(x + 24, y + 849, `Noun: ${entry.nounRead}.`, 58, 14, 21, 650, INK),
      wrappedText(
        x + 24,
        y + 914,
        entry.pollution === 'heat'
          ? 'Heat is static construction only: deep CRT backs, vent spine, and chimney fins; no lit glass or glow.'
          : entry.pollution === 'noise'
            ? 'Noise is static construction only: repeated impact hammers, listing throat, and isolation feet; motion remains deferred.'
            : 'Quiet support furniture: standardized storage or service fixtures, with no loose tools, wear, or clutter baked in.',
        59,
        13,
        20,
        600,
        MUTED,
      ),
    );
  });
  return svgPage(width, height, parts.join(''));
}

function differentiationPage(): string {
  const width = 2460;
  const height = 1510;
  const parts = [
    text(46, 58, 'REFINEMENT V2 · ENGINEERING COMPUTES, MAINTENANCE SERVICES', 30, 850),
    text(46, 91, 'Blank CRT glass is physical material, never a UI surface. No meters, readouts, amber/rose, glow, haze, wear, or loose SKU clutter.', 15, 720, Q.green),
    panel(46, 125, 1510, 650, PANEL),
    text(72, 168, 'TERMINAL BANK ≠ COMPILER PRESS', 20, 850, Q.green),
    placedSvg(priorityThreeAAssetSvg('terminal_bank'), 115, 218, 390),
    placedSvg(priorityThreeAAssetSvg('compiler_press'), 805, 218, 390),
    text(310, 636, 'HEAT · THREE STATIONS', 14, 820, Q.teal, 'middle'),
    text(1000, 636, 'NOISE · ONE IMPACT THROAT', 14, 820, Q.teal, 'middle'),
    wrappedText(82, 678, 'Three deep blank CRT hoods and keyboards share one thermal spine. The row reads as occupied compute furniture, not a dashboard.', 59, 14, 21, 600, MUTED),
    wrappedText(772, 678, 'One continuous listing crosses a repeated hammer bridge. The press reads as compiling by percussion, not copying pages.', 59, 14, 21, 600, MUTED),
    panel(1590, 125, 824, 650, PANEL_COLD),
    text(1618, 168, 'ACCEPTED FAMILY CONTROLS', 20, 850, Q.green),
    placedSvg(refinedPriorityOneAssetSvg('keypunch_bank'), 1650, 225, 290),
    placedSvg(priorityTwoAssetSvg('calculating_engine'), 2040, 225, 290),
    text(1795, 548, 'PERCUSSION', 13, 820, Q.teal, 'middle'),
    text(2185, 548, 'THERMAL', 13, 820, Q.teal, 'middle'),
    wrappedText(1622, 592, 'Compiler Press inherits repeated physical impacts without becoming another keypunch row.', 34, 13, 20, 600, MUTED),
    wrappedText(2015, 592, 'Terminal Bank inherits vented mass without becoming another drum engine.', 34, 13, 20, 600, MUTED),
    panel(46, 810, 1510, 650, PANEL_ALT),
    text(72, 853, 'PARTS CRIB ≠ WORKBENCH', 20, 850, Q.green),
    placedSvg(priorityThreeAAssetSvg('parts_crib'), 115, 905, 390),
    placedSvg(priorityThreeAAssetSvg('workbench'), 805, 905, 390),
    text(310, 1322, 'CONTROLLED STORAGE', 14, 820, Q.teal, 'middle'),
    text(1000, 1322, 'FIXED SERVICE BED', 14, 820, Q.teal, 'middle'),
    wrappedText(82, 1362, 'The caged bin wall and issue hatch hold standardized parts. Nothing loose is baked into the stock state.', 59, 14, 21, 600, MUTED),
    wrappedText(772, 1362, 'The heavy bed, mounted vise, and machine yoke are permanent fixtures. Tools, damage, and repair subjects are placed separately.', 59, 14, 21, 600, MUTED),
    panel(1590, 810, 824, 650, PANEL),
    text(1618, 853, 'ONE CANISTER · FOUR STAMPS', 20, 850, Q.green),
  ];
  PRIORITY_THREE_A_WORK_TYPE_STAMPS.forEach((stamp, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 1630 + column * 370;
    const y = 905 + row * 238;
    parts.push(
      panel(x, y, 330, 205, stamp === 'release' ? PANEL_COLD : PANEL_ALT, 10),
      placedSvg(canisterSvg(stamp), x + 18, y + 24, 150),
      text(x + 178, y + 74, stamp.toUpperCase(), 12, 820, Q.teal),
      wrappedText(
        x + 178,
        y + 104,
        stamp === 'specifications'
          ? 'Engineering input'
          : stamp === 'code'
            ? 'Engineering output'
            : stamp === 'release'
              ? 'downstream Documentation control'
              : 'Maintenance output',
        22,
        12,
        18,
        600,
        MUTED,
      ),
    );
  });
  parts.push(
    text(1618, 1398, 'ANIMATION DEFERRED', 12, 820, Q.green),
    wrappedText(1778, 1398, 'Future motion should amplify heat/noise and machine activity; this proof defines no frames, timing, or runtime owner.', 57, 12, 19, 600, MUTED),
  );
  return svgPage(width, height, parts.join(''));
}

function floorGrid(x: number, y: number, cols: number, rows: number, cell: number): string {
  const parts = [`<rect x="${x}" y="${y}" width="${cols * cell}" height="${rows * cell}" fill="${FLOOR}"/>`];
  for (let column = 0; column <= cols; column += 1) {
    parts.push(line(x + column * cell, y, x + column * cell, y + rows * cell, FLOOR_LINE, 1, .45));
  }
  for (let row = 0; row <= rows; row += 1) {
    parts.push(line(x, y + row * cell, x + cols * cell, y + row * cell, FLOOR_LINE, 1, .45));
  }
  return parts.join('');
}

function roomFrame(x: number, y: number, cols: number, rows: number, cell: number): string {
  return `<path d="M ${x} ${y + rows * cell} V ${y} H ${x + cols * cell}" fill="none" ` +
    `stroke="${Q.charcoal}" stroke-width="${Math.max(5, cell * .12)}" stroke-linejoin="round"/>` +
    `<path d="M ${x + 3} ${y + rows * cell - 3} V ${y + 3} H ${x + cols * cell}" fill="none" ` +
    `stroke="${Q.cream}" stroke-width="${Math.max(3, cell * .075)}"/>`;
}

function logicalPlacement(source: string, centerX: number, centerY: number, cell: number): string {
  const size = cell * PROP_NATIVE_FRAME_CELLS;
  return placedSvg(source, centerX - size / 2, centerY - size / 2, size);
}

function engineeringRoom(x: number, y: number, cell: number): string {
  const cols = 7;
  const rows = 5;
  const cx = (column: number) => x + (column + .5) * cell;
  const cy = (row: number) => y + (row + .5) * cell;
  return [
    floorGrid(x, y, cols, rows, cell),
    roomFrame(x, y, cols, rows, cell),
    logicalPlacement(priorityThreeAAssetSvg('terminal_bank'), cx(1.65), cy(1.45), cell),
    logicalPlacement(priorityThreeAAssetSvg('compiler_press'), cx(4.65), cy(1.45), cell),
    logicalPlacement(refinedPriorityOneAssetSvg('intake_tray_small', { state: 'low' }), cx(.35), cy(3.75), cell),
    logicalPlacement(refinedPriorityOneAssetSvg('dispatch_station', { state: 'high' }), cx(6.15), cy(3.75), cell),
    logicalPlacement(canisterSvg('specifications'), cx(2.9), cy(3.45), cell * .66),
    logicalPlacement(canisterSvg('code'), cx(4.0), cy(3.45), cell * .66),
  ].join('');
}

function maintenanceRoom(x: number, y: number, cell: number): string {
  const cols = 6;
  const rows = 5;
  const cx = (column: number) => x + (column + .5) * cell;
  const cy = (row: number) => y + (row + .5) * cell;
  return [
    floorGrid(x, y, cols, rows, cell),
    roomFrame(x, y, cols, rows, cell),
    logicalPlacement(priorityThreeAAssetSvg('parts_crib'), cx(1.55), cy(1.45), cell),
    logicalPlacement(priorityThreeAAssetSvg('workbench'), cx(3.85), cy(1.45), cell),
    logicalPlacement(refinedPriorityOneAssetSvg('intake_tray_small', { state: 'low' }), cx(.35), cy(3.75), cell),
    logicalPlacement(refinedPriorityOneAssetSvg('dispatch_station', { state: 'low' }), cx(5.15), cy(3.75), cell),
    logicalPlacement(canisterSvg('repairs'), cx(3.0), cy(3.45), cell * .66),
  ].join('');
}

function roomsAt(x: number, y: number, cell: number, labels: boolean): string {
  const engineeringWidth = 7 * cell;
  const gap = cell;
  const maintenanceX = x + engineeringWidth + gap;
  return [
    labels ? text(x + engineeringWidth / 2, y - 20, 'ENGINEERING · SPECIFICATIONS → CODE', 13, 820, Q.green, 'middle') : '',
    engineeringRoom(x, y, cell),
    logicalPlacement(refinedPriorityOneAssetSvg('tube_straight'), x + engineeringWidth + gap / 2, y + 4.25 * cell, cell),
    labels ? text(maintenanceX + 3 * cell, y - 20, 'MAINTENANCE · REPAIRS → MACHINES', 13, 820, Q.green, 'middle') : '',
    maintenanceRoom(maintenanceX, y, cell),
  ].join('');
}

function roomPage(): string {
  const width = 2260;
  const height = 1510;
  const parts = [
    text(46, 58, 'PHASE B ROUTING CHOICE · ENGINEERING + MAINTENANCE · REFINEMENT V2', 30, 850),
    text(46, 91, 'Placed objects on the post-rescale grid · hand carry within rooms · tubes between departments', 15, 720, Q.green),
    panel(46, 126, 2168, 770, PANEL),
    text(72, 165, `NORMAL GAMEPLAY READ · ${NORMAL_CELL} PX/CELL`, 13, 820, MUTED),
    roomsAt(180, 245, NORMAL_CELL, true),
    panel(46, 932, 1410, 520, PANEL_ALT),
    text(72, 971, `FAR READ · ${FAR_CELL} PX/CELL`, 13, 820, MUTED),
    roomsAt(120, 1030, FAR_CELL, false),
    panel(1490, 932, 724, 520, PANEL_COLD),
    text(1518, 971, 'READING CHECK', 18, 850, Q.green),
    wrappedText(1518, 1015, 'Engineering is the three-screen thermal row beside one listing-impact press. Maintenance is the caged parts wall beside one fixed service bed.', 56, 15, 23, 650, INK),
    wrappedText(1518, 1136, 'The screens remain blank glass. Parts and tools are not baked clutter. Work identity stays on the standardized canister overlay.', 56, 14, 22, 600, MUTED),
    line(1518, 1250, 2186, 1250, RULE, 1.5),
    text(1518, 1286, 'TERMINAL FOOTPRINT', 11, 820, Q.teal),
    text(1695, 1286, '3×2 owner-selected suggestion; sim retains authority', 12, 600, MUTED),
    text(1518, 1322, 'OTHER FOOTPRINTS', 11, 820, Q.teal),
    text(1695, 1322, '2×2 suggestions only', 12, 600, MUTED),
    text(1518, 1358, 'STATUS', 11, 820, Q.teal),
    text(1695, 1358, 'accepted static control · Terrarium promotion authorized', 12, 700, Q.green),
    text(1518, 1394, 'ANIMATION', 11, 820, Q.teal),
    text(1695, 1394, 'necessary follow-up, still deferred', 12, 700, Q.green),
  ];
  return svgPage(width, height, parts.join(''));
}

export function renderPriorityThreeAFamilySvg(): string {
  return familyPage();
}

export function renderPriorityThreeADifferentiationSvg(): string {
  return differentiationPage();
}

export function renderPriorityThreeARoomSvg(): string {
  return roomPage();
}

function rasterize(svg: string): Uint8Array {
  return new Resvg(svg).render().asPng();
}

export interface PriorityThreeACalibrationResult {
  readonly output: string;
  readonly files: readonly string[];
  readonly metricsPath: string;
  readonly readmePath: string;
}

export async function renderPriorityThreeACalibration(
  output: string,
): Promise<PriorityThreeACalibrationResult> {
  await mkdir(output, { recursive: true });
  const pages = [
    ['01-engineering-maintenance-family', renderPriorityThreeAFamilySvg()],
    ['02-function-and-pollution-gates', renderPriorityThreeADifferentiationSvg()],
    ['03-phase-b-room-routing', renderPriorityThreeARoomSvg()],
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
    reviewStatus: 'owner-accepted-priority-3a-refinement-v2-static-control',
    direction: 'administrative-percussion',
    scope: 'priority-3a-engineering-maintenance-refinement-v2-accepted-static-control',
    productionPromotion: true,
    canonicalSvgAuthoring: true,
    templateRegistration: true,
    defaultsMutation: true,
    departmentManifestMutation: true,
    exportRun: true,
    schemaMutation: false,
    unityImport: false,
    parityClaim: 'terrarium-source-compositor-browser-export-only',
    machineAnimationDeferred: true,
    refinementTargets: {
      terminalBank: 'three deep hoods and three thermal chimneys replace window-row/combed-crown read',
      compilerPress: 'camshaft, descending hammers, feed wheels, and continuous listing replace barred-cabinet read',
      partsCrib: 'orthogonal security mesh, center stile, and cage latch replace diagonal glass-sheen read',
      workbench: 'articulated service arm, dominant vise, cradle, and open service bay strengthen repair gesture',
    },
    assetIds: PRIORITY_THREE_A_ASSET_IDS,
    workTypeStamps: PRIORITY_THREE_A_WORK_TYPE_STAMPS,
    scaleSuggestions: PRIORITY_THREE_A_SCALE_SUGGESTIONS,
    invariants: {
      authoringCanvas: AUTHORING_CANVAS,
      normalGameplayPixelsPerCell: NORMAL_CELL,
      farGameplayPixelsPerCell: FAR_CELL,
      propNativeFrameCells: PROP_NATIVE_FRAME_CELLS,
      releaseIsDownstreamDocumentationControl: true,
      amberUsed: false,
      roseUsed: false,
      bakedUiUsed: false,
      cameraCueUsed: false,
      wearOrClutterBakedIntoSku: false,
      footprintsSuggestedOnly: true,
    },
  };
  const metricsPath = path.join(output, 'metrics.json');
  await writeFile(metricsPath, `${JSON.stringify(metrics, null, 2)}\n`, 'utf8');
  files.push(metricsPath);

  const readme = `# QuotaCo department machines — Engineering + Maintenance refinement v2

Status: **owner accepted; promoted as the Priority 3A static production control on 2026-08-01**

This sheet extends the accepted Administrative Percussion family into Phase B. Engineering converts
specifications into code through a Terminal Bank and Compiler Press. Maintenance produces repairs for
internal machine consumption through a Parts Crib and Workbench. Release is included only as a downstream
Documentation stamp control; it is not presented as Engineering output.

This refinement replaces the Terminal Bank's comb/window read with three deep hoods and three thermal
chimneys; replaces the Compiler Press's barred-cabinet read with a camshaft, descending hammers, feed wheels,
and continuous listing; replaces the Parts Crib's diagonal glass-like marks with orthogonal security mesh,
a center stile, and a cage latch; and gives the Workbench a dominant vise, articulated service arm, repair
cradle, and open service bay.

The intended static pollution reads are physical: the Terminal Bank owns deep CRT bodies and a shared rear
thermal spine; the Compiler Press owns repeated impact hammers, a sprocket listing throat, and isolation feet.
Screens remain blank glass with no baked UI. The Parts Crib and Workbench remain standardized quiet SKUs;
loose inventory, tools, damage, wear, and repair subjects belong to state/placement rather than the product.

Machine animation remains a necessary but explicitly deferred follow-up. This accepted control does not define frame
names, timing, loops, runtime ownership, or export shape.

Footprints remain suggestions only: Terminal Bank is the owner-selected 3×2 suggestion and the other three
machines remain 2×2. The accepted sprites, templates, defaults, department manifest entries, and browser/headless
export inventory are promoted through the shared Terrarium production path. Schema stays v20 and Unity is untouched.

## Acceptance record

The owner accepted the four refined silhouettes, Terminal Bank's 3×2 suggestion, the heat/noise form cues,
and the normal/far room read. Static promotion does not resolve the deferred machine-animation contract.
`;
  const readmePath = path.join(output, 'README.md');
  await writeFile(readmePath, readme, 'utf8');
  files.push(readmePath);
  return { output, files, metricsPath, readmePath };
}

function parseOut(argv: readonly string[]): string {
  const index = argv.indexOf('--out');
  if (index >= 0 && argv[index + 1]) return path.resolve(argv[index + 1]);
  return path.resolve('docs/previews/quota-co-department-machine-engineering-maintenance-refinement-v2');
}

async function main(): Promise<void> {
  const result = await renderPriorityThreeACalibration(parseOut(process.argv.slice(2)));
  process.stdout.write(`Wrote ${result.files.length} accepted-control files to ${result.output}\n`);
}

const isMain = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;
if (isMain) await main();
