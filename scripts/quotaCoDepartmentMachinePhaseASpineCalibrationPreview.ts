/**
 * Accepted Priority 2 QuotaCo department-machine calibration record.
 *
 *   npx tsx scripts/quotaCoDepartmentMachinePhaseASpineCalibrationPreview.ts
 *   npx tsx scripts/quotaCoDepartmentMachinePhaseASpineCalibrationPreview.ts --out /tmp/phase-a-spine
 *
 * This proof carries the owner-accepted Administrative Percussion family into
 * Analysis, Documentation, Audit, and Dispatch. This renderer itself writes
 * proof files only; canonical source and production wiring remain in the
 * dedicated promotion/import/export pipeline.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

import { composeProp } from '../src/core/compositor';
import { DEFAULT_STYLE, defaultProject } from '../src/data/defaults';
import { PROP_NATIVE_FRAME_CELLS } from './quotaCoWorkstationFamilyCalibrationPreview';
import {
  DEPARTMENT_MACHINE_PALETTE,
  type FillState,
  type PriorityOneAssetId,
} from './quotaCoDepartmentMachineFamilyCalibrationPreview';
import { refinedPriorityOneAssetSvg } from './quotaCoDepartmentMachineReadabilityRefinementPreview';

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

export const PRIORITY_TWO_ASSET_IDS = [
  'calculating_engine',
  'comparator',
  'rotary_duplicator',
  'binding_press',
  'verification_comparator',
  'manifest_press',
] as const;

export type PriorityTwoAssetId = (typeof PRIORITY_TWO_ASSET_IDS)[number];

export const PRIORITY_TWO_WORK_TYPE_STAMPS = [
  'findings',
  'reports',
  'requirements',
] as const;

export type PriorityTwoWorkTypeStamp =
  (typeof PRIORITY_TWO_WORK_TYPE_STAMPS)[number];

export interface PriorityTwoScaleSuggestion {
  readonly id: PriorityTwoAssetId;
  readonly department: 'Analysis' | 'Documentation' | 'Audit' | 'Dispatch';
  readonly label: string;
  readonly suggestedFootprint: { readonly w: number; readonly h: number };
  readonly nounRead: string;
  readonly pollution: 'heat' | 'fumes' | 'quiet';
}

export const PRIORITY_TWO_SCALE_SUGGESTIONS:
readonly PriorityTwoScaleSuggestion[] = [
  {
    id: 'calculating_engine',
    department: 'Analysis',
    label: 'Calculating Engine',
    suggestedFootprint: { w: 2, h: 2 },
    nounRead: 'radiator crown + exposed arithmetic drum bank',
    pollution: 'heat',
  },
  {
    id: 'comparator',
    department: 'Analysis',
    label: 'Comparator',
    suggestedFootprint: { w: 2, h: 2 },
    nounRead: 'two equal paper feeds meet one mechanical balance bridge',
    pollution: 'quiet',
  },
  {
    id: 'rotary_duplicator',
    department: 'Documentation',
    label: 'Rotary Duplicator',
    suggestedFootprint: { w: 2, h: 2 },
    nounRead: 'dominant ink drum + wrapped paper path + drying fingers',
    pollution: 'fumes',
  },
  {
    id: 'binding_press',
    department: 'Documentation',
    label: 'Binding Press',
    suggestedFootprint: { w: 1, h: 2 },
    nounRead: 'open-throat platen, hand wheel, and compressed report stack',
    pollution: 'quiet',
  },
  {
    id: 'verification_comparator',
    department: 'Audit',
    label: 'Verification Comparator',
    suggestedFootprint: { w: 2, h: 2 },
    nounRead: 'dual audit towers feed one certification jaw',
    pollution: 'quiet',
  },
  {
    id: 'manifest_press',
    department: 'Dispatch',
    label: 'Manifest Press',
    suggestedFootprint: { w: 1, h: 2 },
    nounRead: 'lever press + fanfold manifest + canister cradle',
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
  return `<text x="${x}" y="${y}" font-family="Inter, Arial, sans-serif" ` +
    `font-size="${size}" font-weight="${weight}" fill="${fill}" ` +
    `text-anchor="${anchor}">${escapeText(value)}</text>`;
}

function wrap(value: string, max = 58): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of value.split(/\s+/)) {
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
    .map((line, index) => text(x, y + index * lineHeight, line, size, weight, fill))
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
  return `<path d="M ${x1} ${y1} L ${x2} ${y2}" ` +
    `stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" opacity="${opacity}"/>`;
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

function calculatingEngineSvg(): string {
  const parts = [
    shell(8, 17, 112, 102),
    `<g id="heat-radiator-crown">`,
    ...[0, 1, 2, 3, 4, 5].map((index) =>
      `<rect x="${28 + index * 13}" y="${10 + (index % 2) * 2}" width="7" height="24" rx="2" ` +
      `fill="${Q.metal}" stroke="${Q.charcoal}" stroke-width="2"/>`),
    `</g>`,
    `<rect id="arithmetic-bay" x="29" y="37" width="70" height="52" rx="9" fill="${Q.charcoal}"/>`,
    `<path id="mechanism-bridge" d="M 34 44 H 94 V 81 H 34 Z" fill="${Q.black}" opacity=".28"/>`,
    ...[0, 1, 2].map((index) =>
      `<g id="arithmetic-drum-${index}"><circle cx="${46 + index * 19}" cy="61" r="10" fill="${Q.metal}"/>` +
      `<circle cx="${46 + index * 19}" cy="61" r="6" fill="${Q.teal}"/>` +
      `<path d="M ${46 + index * 19} 53 V 69 M ${38 + index * 19} 61 H ${54 + index * 19}" ` +
      `stroke="${Q.charcoal}" stroke-width="1.5"/></g>`),
    `<g id="heat-exhaust-louvers">${[0, 1, 2, 3].map((index) =>
      line(17, 43 + index * 10, 25, 43 + index * 10, Q.charcoal, 2)).join('')}</g>`,
    `<g id="paper-feed">${paperStack(12, 84, 20, 2)}${paperStack(96, 82, 18, 2)}</g>`,
    `<rect id="service-door" x="43" y="92" width="42" height="10" rx="3" fill="${Q.teal}"/>`,
  ];
  return assetSvg(parts.join(''));
}

function comparatorSvg(): string {
  const parts = [
    shell(7, 27, 114, 92),
    `<g id="equal-paper-feeds">${paperStack(10, 55, 27, 3)}${paperStack(91, 55, 27, 3)}</g>`,
    `<rect id="left-feed-well" x="15" y="38" width="31" height="45" rx="7" fill="${Q.charcoal}"/>`,
    `<rect id="right-feed-well" x="82" y="38" width="31" height="45" rx="7" fill="${Q.charcoal}"/>`,
    `<path id="balance-bridge" d="M 39 47 H 89 L 82 59 H 46 Z" fill="${Q.metal}" ` +
    `stroke="${Q.charcoal}" stroke-width="2" stroke-linejoin="round"/>`,
    `<circle id="balance-pivot" cx="64" cy="54" r="7" fill="${Q.teal}" stroke="${Q.charcoal}" stroke-width="2"/>`,
    `<path id="paired-calipers" d="M 29 48 V 71 M 99 48 V 71 M 29 61 H 52 M 76 61 H 99" ` +
    `fill="none" stroke="${Q.metal}" stroke-width="4" stroke-linecap="round"/>`,
    `<path id="mechanical-comparison-gate" d="M 53 66 H 75 V 91 H 53 Z" fill="${Q.charcoal}"/>`,
    `<path d="M 58 72 H 70 M 58 78 H 70 M 58 84 H 70" stroke="${Q.teal}" stroke-width="2"/>`,
    `<rect id="shared-result-tray" x="46" y="94" width="36" height="8" rx="3" fill="${Q.metal}"/>`,
  ];
  return assetSvg(parts.join(''));
}

function rotaryDuplicatorSvg(): string {
  const parts = [
    shell(7, 22, 114, 97, 'right'),
    `<rect id="ink-reservoir" x="14" y="39" width="20" height="53" rx="8" fill="${Q.teal}" ` +
    `stroke="${Q.charcoal}" stroke-width="2"/>`,
    `<circle id="dominant-ink-drum" cx="65" cy="59" r="29" fill="${Q.charcoal}"/>`,
    `<circle id="drum-roller" cx="65" cy="59" r="22" fill="${Q.teal}"/>`,
    `<circle id="drum-hub" cx="65" cy="59" r="8" fill="${Q.metal}" stroke="${Q.charcoal}" stroke-width="2"/>`,
    `<path id="wrapped-paper-path" d="M 36 41 C 50 28 83 29 94 47 C 100 58 95 76 84 82" ` +
    `fill="none" stroke="${Q.cream}" stroke-width="8" stroke-linecap="round"/>`,
    `<g id="drying-fingers">${[0, 1, 2, 3].map((index) =>
      line(92 + index * 5, 70 + index * 2, 105 + index * 4, 92 + index * 2, Q.metal, 2)).join('')}</g>`,
    `<path id="fume-hood-form" d="M 42 28 Q 65 17 88 28 L 84 34 Q 65 25 46 34 Z" fill="${Q.metal}"/>`,
    `<rect id="output-shelf" x="80" y="96" width="31" height="7" rx="3" fill="${Q.cream}" ` +
    `stroke="${Q.charcoal}" stroke-width="1.5"/>`,
  ];
  return assetSvg(parts.join(''));
}

function bindingPressSvg(): string {
  const parts = [
    shell(19, 20, 90, 99),
    `<path id="press-frame" d="M 31 89 V 38 Q 31 31 38 31 H 90 Q 97 31 97 38 V 89" ` +
    `fill="none" stroke="${Q.charcoal}" stroke-width="11" stroke-linecap="round"/>`,
    `<path id="open-throat" d="M 39 42 H 89 V 85 H 39 Z" fill="${Q.black}" opacity=".35"/>`,
    `<circle id="hand-wheel" cx="64" cy="28" r="13" fill="${Q.metal}" stroke="${Q.charcoal}" stroke-width="3"/>`,
    `<circle cx="64" cy="28" r="4" fill="${Q.teal}"/>`,
    `<path id="press-screw" d="M 64 32 V 54" stroke="${Q.metal}" stroke-width="6" stroke-linecap="round"/>`,
    `<rect id="platen" x="42" y="51" width="44" height="10" rx="3" fill="${Q.metal}" ` +
    `stroke="${Q.charcoal}" stroke-width="2"/>`,
    `<g id="compressed-report-stack">${paperStack(44, 75, 40, 4)}</g>`,
    `<rect id="press-bed" x="37" y="86" width="54" height="9" rx="3" fill="${Q.teal}" ` +
    `stroke="${Q.charcoal}" stroke-width="2"/>`,
  ];
  return assetSvg(parts.join(''));
}

function verificationComparatorSvg(): string {
  const parts = [
    shell(6, 17, 116, 102),
    `<g id="dual-audit-towers">`,
    `<path d="M 14 35 Q 14 28 21 28 H 43 Q 50 28 50 35 V 91 H 14 Z" fill="${Q.charcoal}"/>`,
    `<path d="M 78 35 Q 78 28 85 28 H 107 Q 114 28 114 35 V 91 H 78 Z" fill="${Q.charcoal}"/>`,
    `<path d="M 21 40 H 43 V 79 H 21 Z M 85 40 H 107 V 79 H 85 Z" fill="${Q.teal}"/>`,
    `${[0, 1, 2, 3].map((index) => line(24, 47 + index * 8, 40, 47 + index * 8, Q.metal, 1.5)).join('')}`,
    `${[0, 1, 2, 3].map((index) => line(88, 47 + index * 8, 104, 47 + index * 8, Q.metal, 1.5)).join('')}`,
    `</g>`,
    `<path id="certification-jaw" d="M 50 45 H 78 V 82 Q 78 91 69 91 H 59 Q 50 91 50 82 Z" ` +
    `fill="${Q.metal}" stroke="${Q.charcoal}" stroke-width="3"/>`,
    `<path id="certification-comb" d="M 56 56 V 70 M 62 56 V 70 M 68 56 V 70 M 74 56 V 70" ` +
    `stroke="${Q.charcoal}" stroke-width="2"/>`,
    `<g id="audit-input-dossiers">${paperStack(12, 92, 27, 2)}${paperStack(89, 92, 27, 2)}</g>`,
    `<g id="certified-output">${paperStack(50, 96, 28, 3)}</g>`,
    `<circle id="physical-certification-seal" cx="64" cy="82" r="6" fill="${Q.green}" ` +
    `stroke="${Q.cream}" stroke-width="2"/>`,
  ];
  return assetSvg(parts.join(''));
}

function manifestPressSvg(): string {
  const parts = [
    shell(16, 31, 96, 88, 'left'),
    `<path id="lever-arm" d="M 70 65 L 95 25" stroke="${Q.charcoal}" stroke-width="8" ` +
    `stroke-linecap="round"/>`,
    `<circle id="lever-grip" cx="98" cy="22" r="8" fill="${Q.teal}" stroke="${Q.charcoal}" stroke-width="2"/>`,
    `<path id="press-head" d="M 55 47 H 79 V 76 H 55 Z" fill="${Q.metal}" ` +
    `stroke="${Q.charcoal}" stroke-width="3"/>`,
    `<circle id="manifest-seal-die" cx="67" cy="67" r="7" fill="${Q.green}" ` +
    `stroke="${Q.charcoal}" stroke-width="2"/>`,
    `<g id="fanfold-manifest">${paperStack(22, 58, 26, 4)}` +
    `${[0, 1, 2].map((index) => line(25, 59 - index * 3, 43, 59 - index * 3, Q.charcoal, 1)).join('')}</g>`,
    `<path id="canister-cradle" d="M 78 84 Q 91 73 104 84 V 96 H 78 Z" fill="${Q.charcoal}"/>`,
    `<path d="M 84 86 Q 91 81 98 86" fill="none" stroke="${Q.metal}" stroke-width="5" ` +
    `stroke-linecap="round"/>`,
    `<rect id="press-bed" x="45" y="82" width="36" height="11" rx="3" fill="${Q.teal}" ` +
    `stroke="${Q.charcoal}" stroke-width="2"/>`,
  ];
  return assetSvg(parts.join(''));
}

export function priorityTwoAssetSvg(id: PriorityTwoAssetId): string {
  switch (id) {
    case 'calculating_engine': return calculatingEngineSvg();
    case 'comparator': return comparatorSvg();
    case 'rotary_duplicator': return rotaryDuplicatorSvg();
    case 'binding_press': return bindingPressSvg();
    case 'verification_comparator': return verificationComparatorSvg();
    case 'manifest_press': return manifestPressSvg();
  }
}

export function priorityTwoStampOverlaySvg(stamp: PriorityTwoWorkTypeStamp): string {
  if (stamp === 'findings') {
    return assetSvg(
      `<g id="findings-stamp" fill="none" stroke="${Q.white}" stroke-width="2" ` +
      `stroke-linecap="round" stroke-linejoin="round"><circle cx="62" cy="62" r="7"/>` +
      `<path d="M 67 67 L 73 73 M 58 61 H 66 M 58 65 H 63"/></g>`,
    );
  }
  if (stamp === 'reports') {
    return assetSvg(
      `<g id="reports-stamp" fill="none" stroke="${Q.white}" stroke-width="2" ` +
      `stroke-linejoin="round"><path d="M 57 57 H 70 V 72 H 57 Z M 61 53 H 74 V 68"/>` +
      `<path d="M 60 62 H 67 M 60 66 H 67"/></g>`,
    );
  }
  return assetSvg(
    `<g id="requirements-stamp" fill="none" stroke="${Q.white}" stroke-width="2" ` +
    `stroke-linecap="round" stroke-linejoin="round"><path d="M 55 57 H 62 L 65 54 H 75 V 73 H 55 Z"/>` +
    `<path d="M 59 62 H 71 M 59 67 H 69"/></g>`,
  );
}

function canisterSvg(stamp: PriorityTwoWorkTypeStamp): string {
  const stampBody = priorityTwoStampOverlaySvg(stamp)
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
  return assetSvg(
    `<g id="standard-canister"><rect x="46" y="54" width="36" height="25" rx="12" ` +
    `fill="${Q.charcoal}"/><rect x="50" y="57" width="28" height="19" rx="9" fill="${Q.teal}"/>` +
    `<rect x="44" y="60" width="6" height="13" rx="3" fill="${Q.metal}"/>` +
    `<rect x="78" y="60" width="6" height="13" rx="3" fill="${Q.metal}"/>${stampBody}</g>`,
  );
}

function machineFamilyPage(): string {
  const width = 2460;
  const height = 1810;
  const parts = [
    text(46, 58, 'QUOTACO DEPARTMENT MACHINES · PHASE A SPINE', 30, 850),
    text(46, 91, 'OWNER ACCEPTED · static promotion · machine animation contract explicitly deferred', 15, 750, Q.green),
    text(width - 46, 58, '128u source · 90 px normal · 40 px far', 14, 700, MUTED, 'end'),
  ];

  PRIORITY_TWO_SCALE_SUGGESTIONS.forEach((entry, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const x = 46 + column * 806;
    const y = 125 + row * 790;
    parts.push(
      panel(x, y, 760, 748, row === 0 ? PANEL : PANEL_ALT),
      text(x + 24, y + 38, `${entry.department.toUpperCase()} · ${entry.label}`, 18, 820, Q.green),
      text(x + 736, y + 38, `${entry.suggestedFootprint.w}×${entry.suggestedFootprint.h} SUGGESTED`, 12, 750, MUTED, 'end'),
      placedSvg(priorityTwoAssetSvg(entry.id), x + 55, y + 75, 330),
      panel(x + 430, y + 98, 280, 280, PANEL_COLD, 10),
      text(x + 452, y + 128, 'LITERAL SCALE', 11, 800, MUTED),
      placedSvg(priorityTwoAssetSvg(entry.id), x + 452, y + 153, NORMAL_CELL * PROP_NATIVE_FRAME_CELLS),
      placedSvg(priorityTwoAssetSvg(entry.id), x + 617, y + 252, FAR_CELL, FAR_CELL),
      text(x + 543, y + 345, '90 px/cell', 11, 700, MUTED, 'middle'),
      text(x + 637, y + 345, '40 px', 11, 700, MUTED, 'middle'),
      text(x + 28, y + 449, entry.id, 13, 800, Q.teal),
      wrappedText(x + 28, y + 484, `Noun: ${entry.nounRead}.`, 66, 14, 21, 600, INK),
      wrappedText(
        x + 28,
        y + 548,
        entry.pollution === 'heat'
          ? 'Heat is form-only: radiator crown, louvers, and breathing clearances; no glow or baked effect.'
          : entry.pollution === 'fumes'
            ? 'Fumes are form-only: enclosed ink reservoir, drum hood, and drying path; no haze baked into the SKU.'
            : 'Quiet family member: function comes from mechanical paper handling, not lights or screens.',
        66,
        14,
        21,
        600,
        MUTED,
      ),
      line(x + 28, y + 662, x + 732, y + 662, RULE, 1.5),
      text(x + 28, y + 696, 'STANDARD SKU', 11, 820, Q.green),
      text(x + 160, y + 696, 'cream shoulders · dark core · stepped green plinth', 12, 600, MUTED),
    );
  });
  return svgPage(width, height, parts.join(''));
}

function differentiationPage(): string {
  const width = 2460;
  const height = 1630;
  const parts = [
    text(46, 58, 'PHYSICAL-NOUN GATES · THE MACHINES MUST DIFFER BEFORE LABELS', 30, 850),
    text(46, 91, 'No screens, meters, glow, baked UI, amber/rose product accents, camera cues, wear, or SKU clutter.', 15, 720, Q.green),
    panel(46, 125, 1500, 690, PANEL),
    text(72, 166, 'COMPARATOR ≠ VERIFICATION COMPARATOR', 20, 850, Q.green),
    placedSvg(priorityTwoAssetSvg('comparator'), 105, 208, 430),
    placedSvg(priorityTwoAssetSvg('verification_comparator'), 790, 208, 430),
    text(320, 655, 'ANALYSIS · BALANCE', 14, 820, Q.teal, 'middle'),
    text(1005, 655, 'AUDIT · CERTIFY', 14, 820, Q.teal, 'middle'),
    wrappedText(92, 694, 'Two equal feeds meet a horizontal balance bridge and paired calipers. The output is a comparison result.', 54, 14, 21, 600, MUTED),
    wrappedText(775, 694, 'Two audit towers descend into a vertical certification jaw and physical seal. The output is certified—or bounced.', 54, 14, 21, 600, MUTED),
    panel(1580, 125, 834, 690, PANEL_COLD),
    text(1606, 166, 'POLLUTION AS CONSTRUCTION', 20, 850, Q.green),
    placedSvg(priorityTwoAssetSvg('calculating_engine'), 1634, 214, 300),
    placedSvg(priorityTwoAssetSvg('rotary_duplicator'), 2050, 214, 300),
    text(1784, 560, 'HEAT', 14, 820, Q.teal, 'middle'),
    text(2200, 560, 'FUMES', 14, 820, Q.teal, 'middle'),
    wrappedText(1615, 606, 'Open radiator crown, exhaust louvers, and breathing gaps. Nothing emits light.', 35, 13, 20, 600, MUTED),
    wrappedText(2028, 606, 'Ink reservoir, wrapped rotary drum, fume hood, and drying fingers. Nothing emits haze.', 35, 13, 20, 600, MUTED),
    panel(46, 850, 1500, 720, PANEL_ALT),
    text(72, 891, 'DOCUMENTATION LINE · REPRODUCE, THEN FINISH', 20, 850, Q.green),
    placedSvg(priorityTwoAssetSvg('rotary_duplicator'), 105, 960, 330),
    placedSvg(canisterSvg('reports'), 585, 1045, 130),
    placedSvg(priorityTwoAssetSvg('binding_press'), 850, 960, 330),
    line(440, 1125, 585, 1125, Q.metal, 10),
    line(715, 1125, 845, 1125, Q.metal, 10),
    text(270, 1346, 'ROTARY DRUM', 13, 820, Q.teal, 'middle'),
    text(1015, 1346, 'OPEN-THROAT PRESS', 13, 820, Q.teal, 'middle'),
    wrappedText(92, 1390, 'Duplicator owns the repeated-page gesture; Binding Press owns the compressed stack and physical finishing gesture.', 95, 15, 23, 600, MUTED),
    panel(1580, 850, 834, 720, PANEL),
    text(1606, 891, 'ONE CANISTER, THREE NEW STAMPS', 20, 850, Q.green),
  ];

  PRIORITY_TWO_WORK_TYPE_STAMPS.forEach((stamp, index) => {
    const x = 1625 + index * 252;
    parts.push(
      panel(x, 955, 214, 350, index === 2 ? PANEL_COLD : PANEL_ALT, 10),
      placedSvg(canisterSvg(stamp), x + 26, 992, 162),
      text(x + 107, 1191, stamp.replace('_', ' ').toUpperCase(), 12, 820, Q.teal, 'middle'),
      text(x + 107, 1220, stamp === 'requirements' ? 'also SOW dossier' : 'overlay only', 11, 600, MUTED, 'middle'),
    );
  });
  parts.push(
    placedSvg(priorityTwoAssetSvg('manifest_press'), 1815, 1300, 230),
    text(1930, 1540, 'Manifest Press · lever / seal / cradle', 13, 760, MUTED, 'middle'),
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

function p1(
  id: PriorityOneAssetId,
  centerX: number,
  centerY: number,
  cell: number,
  state: FillState = 'empty',
): string {
  return logicalPlacement(refinedPriorityOneAssetSvg(id, { state }), centerX, centerY, cell);
}

function reviewTableSvg(): string {
  const project = defaultProject();
  const table = project.props.find(({ templateId }) => templateId === 'conference-table');
  if (!table) throw new Error('Default project is missing the existing Review Table carrier');
  return composeProp(table, DEFAULT_STYLE, AUTHORING_CANVAS);
}

function departmentRoom(
  originX: number,
  originY: number,
  cell: number,
  department: 'Analysis' | 'Documentation' | 'Audit' | 'Dispatch',
): string {
  const cols = 5;
  const rows = 5;
  const parts = [
    floorGrid(originX, originY, cols, rows, cell),
    roomFrame(originX, originY, cols, rows, cell),
  ];
  const cx = (column: number) => originX + (column + .5) * cell;
  const cy = (row: number) => originY + (row + .5) * cell;
  parts.push(
    p1('intake_tray_small', cx(.35), cy(3.75), cell, department === 'Dispatch' ? 'high' : 'low'),
    p1('dispatch_station', cx(4.15), cy(3.75), cell, department === 'Documentation' ? 'overflowing' : 'low'),
  );
  if (department === 'Analysis') {
    parts.push(
      logicalPlacement(priorityTwoAssetSvg('calculating_engine'), cx(1.65), cy(1.45), cell),
      logicalPlacement(priorityTwoAssetSvg('comparator'), cx(3.55), cy(1.55), cell),
      logicalPlacement(canisterSvg('findings'), cx(2.65), cy(3.5), cell * .66),
    );
  } else if (department === 'Documentation') {
    parts.push(
      logicalPlacement(priorityTwoAssetSvg('rotary_duplicator'), cx(1.55), cy(1.5), cell),
      logicalPlacement(priorityTwoAssetSvg('binding_press'), cx(3.55), cy(1.55), cell),
      logicalPlacement(canisterSvg('reports'), cx(2.65), cy(3.5), cell * .66),
    );
  } else if (department === 'Audit') {
    parts.push(
      logicalPlacement(reviewTableSvg(), cx(1.55), cy(1.55), cell),
      logicalPlacement(priorityTwoAssetSvg('verification_comparator'), cx(3.55), cy(1.55), cell),
      logicalPlacement(canisterSvg('reports'), cx(2.65), cy(3.5), cell * .66),
    );
  } else {
    parts.push(
      logicalPlacement(priorityTwoAssetSvg('manifest_press'), cx(1.65), cy(1.55), cell),
      p1('pneumatic_dispatch_node', cx(3.4), cy(1.55), cell),
      p1('delivery_uplink', cx(3.8), cy(3.25), cell),
      logicalPlacement(canisterSvg('requirements'), cx(2.55), cy(3.5), cell * .66),
    );
  }
  return parts.join('');
}

function composedSpine(
  x: number,
  y: number,
  cell: number,
  annotated: boolean,
): string {
  const departments = ['Analysis', 'Documentation', 'Audit', 'Dispatch'] as const;
  const roomWidth = 5 * cell;
  const gap = cell;
  const parts: string[] = [];
  departments.forEach((department, index) => {
    const roomX = x + index * (roomWidth + gap);
    parts.push(departmentRoom(roomX, y, cell, department));
    if (annotated) {
      parts.push(text(roomX + roomWidth / 2, y - 18, department.toUpperCase(), 13, 820, Q.green, 'middle'));
    }
    if (index < departments.length - 1) {
      const routeY = y + 4.25 * cell;
      parts.push(
        p1('tube_straight', roomX + roomWidth + gap * .5, routeY, cell),
      );
    }
  });
  return parts.join('');
}

function roomSpinePage(): string {
  const width = 2860;
  const height = 1700;
  const parts = [
    text(46, 58, 'PHASE A DEPARTMENT SPINE · PLACED OBJECTS, NOT LABEL DEPENDENCE', 30, 850),
    text(46, 91, 'Analysis → Documentation → optional Audit → Dispatch · accepted tubes/stations reused as controls', 15, 720, Q.green),
    panel(46, 126, 2768, 935, PANEL),
    text(72, 165, `NORMAL GAMEPLAY READ · ${NORMAL_CELL} PX/CELL`, 13, 820, MUTED),
    composedSpine(300, 245, NORMAL_CELL, true),
    panel(46, 1096, 1740, 548, PANEL_ALT),
    text(72, 1135, `FAR READ · ${FAR_CELL} PX/CELL`, 13, 820, MUTED),
    composedSpine(180, 1195, FAR_CELL, false),
    panel(1820, 1096, 994, 548, PANEL_COLD),
    text(1848, 1135, 'READING CHECK', 18, 850, Q.green),
    wrappedText(1848, 1180, 'Analysis is the radiator-and-balance room. Documentation is the drum-and-press room. Audit adds the existing Review Table and the tall certification jaw. Dispatch ends at lever press, powered node, and uplink.', 78, 15, 23, 600, INK),
    wrappedText(1848, 1325, 'Stations and tubes remain accepted Priority 1 controls. Work still moves by hand inside each room and by tube only between departments.', 78, 15, 23, 600, MUTED),
    line(1848, 1435, 2786, 1435, RULE, 1.5),
    text(1848, 1472, 'REVIEW TABLE', 12, 820, Q.teal),
    text(1990, 1472, 'exact existing conference_table art; no replacement SKU', 13, 600, MUTED),
    text(1848, 1510, 'FOOTPRINTS', 12, 820, Q.teal),
    text(1990, 1510, 'suggested only; room proof does not lock occupancy', 13, 600, MUTED),
    text(1848, 1548, 'STATUS', 12, 820, Q.teal),
    text(1990, 1548, 'accepted static control · Terrarium promotion authorized', 13, 700, Q.green),
  ];
  return svgPage(width, height, parts.join(''));
}

export function renderPriorityTwoMachineFamilySvg(): string {
  return machineFamilyPage();
}

export function renderPriorityTwoDifferentiationSvg(): string {
  return differentiationPage();
}

export function renderPriorityTwoRoomSpineSvg(): string {
  return roomSpinePage();
}

function rasterize(svg: string): Uint8Array {
  return new Resvg(svg).render().asPng();
}

export interface PhaseASpineCalibrationResult {
  readonly output: string;
  readonly files: readonly string[];
  readonly metricsPath: string;
  readonly readmePath: string;
}

export async function renderPhaseASpineCalibration(
  output: string,
): Promise<PhaseASpineCalibrationResult> {
  await mkdir(output, { recursive: true });
  const pages = [
    ['01-phase-a-machine-family', renderPriorityTwoMachineFamilySvg()],
    ['02-function-and-difference-gates', renderPriorityTwoDifferentiationSvg()],
    ['03-phase-a-room-spine', renderPriorityTwoRoomSpineSvg()],
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
    reviewStatus: 'owner-accepted-priority-2-static-control',
    direction: 'administrative-percussion',
    scope: 'priority-2-phase-a-spine-plus-audit-accepted-static-control',
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
    assetIds: PRIORITY_TWO_ASSET_IDS,
    workTypeStamps: PRIORITY_TWO_WORK_TYPE_STAMPS,
    scaleSuggestions: PRIORITY_TWO_SCALE_SUGGESTIONS,
    invariants: {
      authoringCanvas: AUTHORING_CANVAS,
      normalGameplayPixelsPerCell: NORMAL_CELL,
      farGameplayPixelsPerCell: FAR_CELL,
      propNativeFrameCells: PROP_NATIVE_FRAME_CELLS,
      reviewTableReused: true,
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

  const readme = `# QuotaCo department machines — Phase A spine calibration v1

Status: **owner accepted as the Priority 2 static control; promoted in Terrarium**

This sheet carries the accepted Administrative Percussion product language into Analysis,
Documentation, Audit, and Dispatch. It covers Calculating Engine, Comparator, Rotary Duplicator,
Binding Press, Verification Comparator, Manifest Press, and the findings/reports/requirements
canister stamps. The existing conference-table art is reused as Audit’s Review Table.

The intended reads are physical: radiator fins and louvers make the Calculating Engine heat-adjacent;
the Rotary Duplicator owns a hooded ink drum and drying fingers; the Analysis Comparator balances two
equal feeds while the Verification Comparator sends dual audit towers through one certification jaw.
No product carries a screen, meter, glow, baked UI, amber/rose accent, camera cue, wear, or clutter.

Footprints on the sheet are suggestions only. The accepted promotion adds canonical sources,
PropTemplates, defaults, department-manifest entries, and browser-export inventory without changing
schema v20 or touching the Unity project.

The pollution read remains deliberately modest in these static sprites. Owner review identified machine
animation as a necessary follow-up; frame vocabulary, timing, runtime ownership, and export shape remain
explicitly deferred. This promotion does not infer or bake an animation contract, glow, heat haze, fumes,
or UI feedback into the SKU.

## Acceptance record

Accepted on 2026-08-01 for static promotion. Canonical SVG authoring, production registration, browser
export, and Terrarium source/compositor/export parity proceed from these exact pixels. Unity import and
the deferred animation conversation remain outside this promotion.
`;
  const readmePath = path.join(output, 'README.md');
  await writeFile(readmePath, readme, 'utf8');
  files.push(readmePath);
  return { output, files, metricsPath, readmePath };
}

function parseOut(argv: readonly string[]): string {
  const index = argv.indexOf('--out');
  if (index >= 0 && argv[index + 1]) return path.resolve(argv[index + 1]);
  return path.resolve('docs/previews/quota-co-department-machine-phase-a-spine-calibration-v1');
}

async function main(): Promise<void> {
  const result = await renderPhaseASpineCalibration(parseOut(process.argv.slice(2)));
  process.stdout.write(`Wrote ${result.files.length} accepted-control files to ${result.output}\n`);
}

const isMain = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;
if (isMain) await main();
