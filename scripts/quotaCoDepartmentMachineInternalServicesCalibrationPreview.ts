/**
 * Accepted-control Priority 3B QuotaCo department-machine calibration record.
 *
 *   npx tsx scripts/quotaCoDepartmentMachineInternalServicesCalibrationPreview.ts
 *   npx tsx scripts/quotaCoDepartmentMachineInternalServicesCalibrationPreview.ts --out /tmp/priority3b
 *
 * The renderer recreates the accepted visual record. Production authoring and
 * browser-export parity are performed by the canonical source/import pipeline;
 * Unity and the machine-animation contract remain separate follow-ups.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

import { DEPARTMENT_MACHINE_PALETTE } from './quotaCoDepartmentMachineFamilyCalibrationPreview';
import { refinedPriorityOneAssetSvg } from './quotaCoDepartmentMachineReadabilityRefinementPreview';
import { priorityTwoAssetSvg } from './quotaCoDepartmentMachinePhaseASpineCalibrationPreview';
import { priorityThreeAAssetSvg } from './quotaCoDepartmentMachineEngineeringMaintenanceCalibrationPreview';
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

export const PRIORITY_THREE_B_ASSET_IDS = [
  'records_cabinet',
  'badge_press',
  'ledger_engine',
  'envelope_press',
  'requisition_counter',
  'stock_shelving',
] as const;

export type PriorityThreeBAssetId = (typeof PRIORITY_THREE_B_ASSET_IDS)[number];

export const PRIORITY_THREE_B_WORK_TYPE_STAMPS = [
  'personnel_actions',
  'supplies',
] as const;

export type PriorityThreeBWorkTypeStamp =
  (typeof PRIORITY_THREE_B_WORK_TYPE_STAMPS)[number];

export const PRIORITY_THREE_B_HAND_CARRIED_IDS = ['pay_envelope'] as const;
export type PriorityThreeBHandCarriedId = (typeof PRIORITY_THREE_B_HAND_CARRIED_IDS)[number];

export interface PriorityThreeBScaleSuggestion {
  readonly id: PriorityThreeBAssetId;
  readonly department: 'Personnel' | 'Payroll' | 'Supply';
  readonly label: string;
  readonly suggestedFootprint: { readonly w: number; readonly h: number };
  readonly nounRead: string;
  readonly pollution: 'quiet' | 'unassigned';
}

export const PRIORITY_THREE_B_SCALE_SUGGESTIONS:
readonly PriorityThreeBScaleSuggestion[] = [
  {
    id: 'records_cabinet',
    department: 'Personnel',
    label: 'Records Cabinet',
    suggestedFootprint: { w: 2, h: 2 },
    nounRead: 'sealed lateral drawers + index rails + one archive lock spindle',
    pollution: 'quiet',
  },
  {
    id: 'badge_press',
    department: 'Personnel',
    label: 'Badge Press',
    suggestedFootprint: { w: 1, h: 2 },
    nounRead: 'upright punch yoke + card guide + descending badge die',
    pollution: 'unassigned',
  },
  {
    id: 'ledger_engine',
    department: 'Payroll',
    label: 'Ledger Engine',
    suggestedFootprint: { w: 2, h: 2 },
    nounRead: 'twin posting drums + travelling carriage + open folio bed',
    pollution: 'unassigned',
  },
  {
    id: 'envelope_press',
    department: 'Payroll',
    label: 'Envelope Press',
    suggestedFootprint: { w: 1, h: 2 },
    nounRead: 'folding wings + twin seal rollers + unmistakable envelope chute',
    pollution: 'unassigned',
  },
  {
    id: 'requisition_counter',
    department: 'Supply',
    label: 'Requisition Counter',
    suggestedFootprint: { w: 2, h: 2 },
    nounRead: 'staffed service ledge + pass-through drawer + queue-facing counter mass',
    pollution: 'unassigned',
  },
  {
    id: 'stock_shelving',
    department: 'Supply',
    label: 'Stock Shelving',
    suggestedFootprint: { w: 2, h: 2 },
    nounRead: 'open warehouse bays + deep shelf decks + exposed structural uprights',
    pollution: 'unassigned',
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

function recordsCabinetSvg(): string {
  const drawers = [0, 1, 2].flatMap((row) => [0, 1].map((column) => {
    const x = 20 + column * 45;
    const y = 34 + row * 19;
    return `<g id="archive-drawer-${row}-${column}"><rect x="${x}" y="${y}" width="40" height="15" rx="3" ` +
      `fill="${row === 1 ? Q.teal : Q.cream}" stroke="${Q.charcoal}" stroke-width="2"/>` +
      `<path d="M ${x + 12} ${y + 7.5} H ${x + 28}" stroke="${Q.charcoal}" stroke-width="2" ` +
      `stroke-linecap="round"/></g>`;
  }));
  return assetSvg([
    shell(7, 15, 114, 104),
    `<path id="sealed-archive-vault" d="M 15 28 H 113 V 94 H 15 Z" fill="${Q.charcoal}"/>`,
    `<g id="closed-lateral-drawers">${drawers.join('')}</g>`,
    `<path id="central-index-rail" d="M 64 31 V 91" stroke="${Q.metal}" stroke-width="4"/>`,
    `<g id="archive-lock-spindle"><circle cx="64" cy="84" r="7" fill="${Q.green}" ` +
      `stroke="${Q.charcoal}" stroke-width="3"/><path d="M 64 80 V 88" stroke="${Q.metal}" ` +
      `stroke-width="2" stroke-linecap="round"/></g>`,
  ].join(''));
}

function badgePressSvg(): string {
  return assetSvg([
    shell(20, 19, 88, 100),
    `<path id="upright-badge-punch-yoke" d="M 35 82 V 39 Q 35 29 45 29 H 83 Q 93 29 93 39 V 82" ` +
      `fill="none" stroke="${Q.charcoal}" stroke-width="10" stroke-linecap="round"/>`,
    `<path id="descending-badge-die" d="M 58 34 H 70 V 61 H 78 V 75 H 50 V 61 H 58 Z" ` +
      `fill="${Q.metal}" stroke="${Q.charcoal}" stroke-width="3"/>`,
    `<path id="badge-card-guide" d="M 33 77 H 95 L 89 93 H 39 Z" fill="${Q.teal}" ` +
      `stroke="${Q.charcoal}" stroke-width="3"/>`,
    `<path id="blank-badge-card" d="M 52 78 H 76 V 89 H 52 Z" fill="${Q.cream}" ` +
      `stroke="${Q.charcoal}" stroke-width="1.5"/>`,
    `<circle id="badge-die-face" cx="64" cy="68" r="8" fill="${Q.green}" ` +
      `stroke="${Q.charcoal}" stroke-width="3"/>`,
  ].join(''));
}

function ledgerEngineSvg(): string {
  return assetSvg([
    shell(5, 20, 118, 99, 'right'),
    `<path id="posting-carriage-rail" d="M 17 40 H 111" stroke="${Q.charcoal}" stroke-width="9" ` +
      `stroke-linecap="round"/>`,
    `<g id="twin-posting-drums"><circle cx="39" cy="54" r="17" fill="${Q.teal}" ` +
      `stroke="${Q.charcoal}" stroke-width="4"/><circle cx="89" cy="54" r="17" fill="${Q.teal}" ` +
      `stroke="${Q.charcoal}" stroke-width="4"/><path d="M 39 40 V 68 M 89 40 V 68" ` +
      `stroke="${Q.metal}" stroke-width="5" stroke-linecap="round"/></g>`,
    `<g id="travelling-posting-carriage"><path d="M 49 32 H 79 V 59 H 49 Z" fill="${Q.metal}" ` +
      `stroke="${Q.charcoal}" stroke-width="3"/><path d="M 64 57 V 76" stroke="${Q.charcoal}" ` +
      `stroke-width="7" stroke-linecap="round"/></g>`,
    `<path id="open-folio-bed" d="M 23 74 Q 44 69 62 78 Q 81 69 105 74 L 99 97 ` +
      `Q 80 92 62 99 Q 44 92 28 97 Z" fill="${Q.cream}" stroke="${Q.charcoal}" stroke-width="3"/>`,
    `<path id="folio-center-fold" d="M 62 78 V 98" stroke="${Q.teal}" stroke-width="2"/>`,
    `<path id="folio-feed-bar" d="M 30 82 Q 45 78 57 84 M 67 84 Q 83 78 98 82" fill="none" ` +
      `stroke="${Q.metal}" stroke-width="2" stroke-linecap="round"/>`,
  ].join(''));
}

function envelopePressSvg(): string {
  return assetSvg([
    shell(16, 22, 96, 97, 'left'),
    `<g id="folding-wings"><path d="M 25 43 L 51 58 V 76 L 25 61 Z" fill="${Q.cream}" ` +
      `stroke="${Q.charcoal}" stroke-width="3"/><path d="M 103 43 L 77 58 V 76 L 103 61 Z" ` +
      `fill="${Q.cream}" stroke="${Q.charcoal}" stroke-width="3"/></g>`,
    `<g id="twin-seal-rollers"><rect x="36" y="46" width="56" height="14" rx="7" fill="${Q.teal}" ` +
      `stroke="${Q.charcoal}" stroke-width="3"/><rect x="36" y="62" width="56" height="14" rx="7" ` +
      `fill="${Q.teal}" stroke="${Q.charcoal}" stroke-width="3"/>` +
      `<path d="M 43 53 H 85 M 43 69 H 85" stroke="${Q.metal}" stroke-width="3" ` +
      `stroke-linecap="round"/></g>`,
    `<path id="envelope-output-chute" d="M 38 74 H 90 L 98 94 H 30 Z" fill="${Q.metal}" ` +
      `stroke="${Q.charcoal}" stroke-width="3"/>`,
    `<g id="pressed-pay-envelope"><path d="M 43 77 H 85 V 92 H 43 Z" fill="${Q.cream}" ` +
      `stroke="${Q.charcoal}" stroke-width="2"/><path d="M 43 78 L 64 88 L 85 78" fill="none" ` +
      `stroke="${Q.green}" stroke-width="2" stroke-linejoin="round"/></g>`,
  ].join(''));
}

function requisitionCounterSvg(): string {
  return assetSvg([
    `<path id="queue-facing-counter-contour" d="M 8 48 L 18 31 H 110 L 120 48 V 113 ` +
      `Q 120 119 114 119 H 14 Q 8 119 8 113 Z" fill="${Q.charcoal}"/>`,
    `<path id="service-counter-top" d="M 18 35 H 110 L 116 49 H 12 Z" fill="${Q.cream}"/>`,
    `<path id="counter-top-light" d="M 24 38 H 104" stroke="${Q.white}" stroke-width="2" ` +
      `stroke-linecap="round" opacity=".18"/>`,
    `<path id="staff-side-privacy-wings" d="M 15 49 H 34 V 90 H 15 Z M 94 49 H 113 V 90 H 94 Z" ` +
      `fill="${Q.green}"/>`,
    `<path id="requisition-pass-slot" d="M 38 45 H 90 V 58 H 38 Z" fill="${Q.charcoal}"/>`,
    `<path id="pass-through-drawer" d="M 33 62 H 95 V 84 H 33 Z" fill="${Q.metal}" ` +
      `stroke="${Q.charcoal}" stroke-width="3"/>`,
    `<path id="drawer-pull" d="M 54 72 H 74" stroke="${Q.teal}" stroke-width="5" ` +
      `stroke-linecap="round"/>`,
    `<path id="counter-knee-panel" d="M 18 89 H 110 V 111 H 18 Z" fill="${Q.cream}"/>`,
    `<rect id="stepped-green-base" x="8" y="105" width="112" height="14" rx="4" fill="${Q.green}"/>`,
    `<rect id="base-service-register" x="21" y="110" width="86" height="3" rx="1.5" fill="${Q.teal}"/>`,
  ].join(''));
}

function stockShelvingSvg(): string {
  return assetSvg([
    `<path id="warehouse-upright-contour" d="M 9 22 Q 9 15 16 15 H 112 Q 119 15 119 22 ` +
      `V 116 H 9 Z" fill="${Q.charcoal}"/>`,
    `<path id="open-stock-bays" d="M 17 25 H 111 V 101 H 17 Z" fill="${Q.green}"/>`,
    `<g id="deep-shelf-decks">${[45, 67, 89].map((y) =>
      `<path d="M 15 ${y} H 113 L 108 ${y + 7} H 20 Z" fill="${Q.cream}" ` +
      `stroke="${Q.charcoal}" stroke-width="2"/>`).join('')}</g>`,
    `<path id="central-shelf-upright" d="M 64 24 V 101" stroke="${Q.metal}" stroke-width="5"/>`,
    `<path id="left-open-bay-edges" d="M 22 29 H 59 M 22 52 H 59 M 22 74 H 59" ` +
      `stroke="${Q.teal}" stroke-width="3" stroke-linecap="round"/>`,
    `<path id="right-open-bay-edges" d="M 70 29 H 106 M 70 52 H 106 M 70 74 H 106" ` +
      `stroke="${Q.teal}" stroke-width="3" stroke-linecap="round"/>`,
    `<rect id="stepped-green-base" x="9" y="101" width="110" height="18" rx="4" fill="${Q.green}"/>`,
    `<rect id="base-service-register" x="22" y="109" width="84" height="3" rx="1.5" fill="${Q.teal}"/>`,
  ].join(''));
}

export function priorityThreeBAssetSvg(id: PriorityThreeBAssetId): string {
  switch (id) {
    case 'records_cabinet': return recordsCabinetSvg();
    case 'badge_press': return badgePressSvg();
    case 'ledger_engine': return ledgerEngineSvg();
    case 'envelope_press': return envelopePressSvg();
    case 'requisition_counter': return requisitionCounterSvg();
    case 'stock_shelving': return stockShelvingSvg();
  }
}

export function priorityThreeBStampOverlaySvg(stamp: PriorityThreeBWorkTypeStamp): string {
  if (stamp === 'personnel_actions') {
    return assetSvg(`<g id="personnel-actions-stamp" fill="none" stroke="${Q.white}" stroke-width="2" ` +
      `stroke-linecap="round" stroke-linejoin="round"><circle cx="59" cy="59" r="4"/>` +
      `<circle cx="69" cy="59" r="4"/><path d="M 54 71 Q 59 64 64 71 Q 69 64 74 71"/>` +
      `<path d="M 57 76 H 71 M 68 73 L 72 76 L 68 79"/></g>`);
  }
  return assetSvg(`<g id="supplies-stamp" fill="none" stroke="${Q.white}" stroke-width="2" ` +
    `stroke-linecap="round" stroke-linejoin="round"><path d="M 54 60 L 64 54 L 74 60 V 72 ` +
    `L 64 78 L 54 72 Z M 54 60 L 64 66 L 74 60 M 64 66 V 78"/></g>`);
}

export function priorityThreeBHandCarriedSvg(id: PriorityThreeBHandCarriedId): string {
  if (id !== 'pay_envelope') throw new Error(`Unknown Priority 3B hand-carried item: ${id}`);
  return assetSvg(`<g id="hand-carried-pay-envelope"><path d="M 40 51 Q 40 47 44 47 H 84 ` +
    `Q 88 47 88 51 V 80 Q 88 84 84 84 H 44 Q 40 84 40 80 Z" fill="${Q.charcoal}"/>` +
    `<path d="M 44 51 H 84 V 80 H 44 Z" fill="${Q.cream}"/>` +
    `<path id="sealed-payroll-flap" d="M 44 53 L 64 69 L 84 53 V 60 L 64 76 L 44 60 Z" ` +
    `fill="${Q.green}"/>` +
    `<path id="envelope-fold" d="M 44 79 L 57 67 M 84 79 L 71 67" fill="none" ` +
    `stroke="${Q.teal}" stroke-width="2" stroke-linecap="round"/>` +
    `<circle id="payroll-seal" cx="64" cy="69" r="5" fill="${Q.teal}" ` +
    `stroke="${Q.charcoal}" stroke-width="2"/></g>`);
}

function canisterSvg(stamp: PriorityThreeBWorkTypeStamp): string {
  const base = refinedPriorityOneAssetSvg('canister_base')
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
  const overlay = priorityThreeBStampOverlaySvg(stamp)
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
  return assetSvg(`${base}${overlay}`);
}

function familyPage(): string {
  const width = 2540;
  const height = 1810;
  const parts = [
    text(46, 58, 'QUOTACO DEPARTMENT MACHINES · PRIORITY 3B · INTERNAL SERVICES', 30, 850),
    text(46, 91, 'OWNER ACCEPTED · Personnel, Payroll, Supply · 90/40 px · footprints remain suggestions', 15, 750, Q.green),
    text(width - 46, 58, '128u source · Administrative Percussion family', 14, 700, MUTED, 'end'),
  ];
  PRIORITY_THREE_B_SCALE_SUGGESTIONS.forEach((entry, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const x = 46 + column * 830;
    const y = 125 + row * 820;
    parts.push(
      panel(x, y, 790, 775, (column + row) % 2 ? PANEL_ALT : PANEL),
      text(x + 24, y + 38, entry.department.toUpperCase(), 12, 820, Q.green),
      text(x + 24, y + 68, entry.label, 20, 850, INK),
      text(x + 766, y + 38, `${entry.suggestedFootprint.w}×${entry.suggestedFootprint.h} SUGGESTED`, 11, 750, MUTED, 'end'),
      placedSvg(priorityThreeBAssetSvg(entry.id), x + 225, y + 88, 340),
      panel(x + 32, y + 448, 726, 200, PANEL_COLD, 10),
      text(x + 52, y + 478, 'LITERAL SCALE', 11, 820, MUTED),
      placedSvg(priorityThreeBAssetSvg(entry.id), x + 65, y + 494, NORMAL_CELL * PROP_NATIVE_FRAME_CELLS),
      placedSvg(priorityThreeBAssetSvg(entry.id), x + 310, y + 555, FAR_CELL),
      text(x + 155, y + 684, '90 px/cell', 11, 700, MUTED, 'middle'),
      text(x + 330, y + 620, '40 px', 11, 700, MUTED, 'middle'),
      text(x + 397, y + 490, entry.pollution === 'quiet' ? 'QUIET BY CATALOG' : 'POLLUTION UNASSIGNED', 11, 820, Q.teal),
      wrappedText(x + 397, y + 522, `Noun: ${entry.nounRead}.`, 42, 13, 20, 600, INK),
      text(x + 24, y + 729, entry.id, 12, 820, Q.teal),
      text(x + 766, y + 729, 'NO UI · NO AMBER/ROSE · NO BAKED CLUTTER', 10, 750, MUTED, 'end'),
    );
  });
  return svgPage(width, height, parts.join(''));
}

function differentiationPage(): string {
  const width = 2460;
  const height = 1650;
  const parts = [
    text(46, 58, 'PRIORITY 3B · FUNCTION AND COLLISION GATES', 30, 850),
    text(46, 91, 'Recognition comes from physical noun and silhouette; pollution remains unassigned unless the catalog says otherwise.', 15, 720, Q.green),
    panel(46, 125, 1510, 470, PANEL),
    text(72, 166, 'RECORDS CABINET ≠ PARTS CRIB ≠ STOCK SHELVING', 20, 850, Q.green),
    placedSvg(priorityThreeBAssetSvg('records_cabinet'), 100, 205, 300),
    placedSvg(priorityThreeAAssetSvg('parts_crib'), 570, 205, 300),
    placedSvg(priorityThreeBAssetSvg('stock_shelving'), 1040, 205, 300),
    text(250, 522, 'SEALED DRAWERS', 13, 820, Q.teal, 'middle'),
    text(720, 522, 'CAGED CONTROL', 13, 820, Q.teal, 'middle'),
    text(1190, 522, 'OPEN BAYS', 13, 820, Q.teal, 'middle'),
    panel(46, 625, 1510, 430, PANEL_ALT),
    text(72, 666, 'BADGE PRESS ≠ ENVELOPE PRESS', 20, 850, Q.green),
    placedSvg(priorityThreeBAssetSvg('badge_press'), 215, 704, 290),
    placedSvg(priorityThreeBAssetSvg('envelope_press'), 855, 704, 290),
    text(360, 1004, 'VERTICAL PUNCH DIE', 13, 820, Q.teal, 'middle'),
    text(1000, 1004, 'HORIZONTAL FOLD + SEAL', 13, 820, Q.teal, 'middle'),
    panel(46, 1085, 1510, 520, PANEL_COLD),
    text(72, 1126, 'LEDGER ENGINE ≠ CALCULATING ENGINE', 20, 850, Q.green),
    placedSvg(priorityThreeBAssetSvg('ledger_engine'), 205, 1165, 330),
    placedSvg(priorityTwoAssetSvg('calculating_engine'), 850, 1165, 330),
    text(370, 1515, 'POSTING DRUMS + OPEN FOLIO', 13, 820, Q.teal, 'middle'),
    text(1015, 1515, 'THERMAL DRUM + RADIATOR CROWN', 13, 820, Q.teal, 'middle'),
    panel(1590, 125, 824, 1480, PANEL),
    text(1618, 166, 'PAY ENVELOPE ≠ CANISTER', 20, 850, Q.green),
    placedSvg(priorityThreeBHandCarriedSvg('pay_envelope'), 1660, 215, 300),
    placedSvg(canisterSvg('personnel_actions'), 2025, 215, 250),
    text(1810, 522, 'HAND-CARRIED', 13, 820, Q.teal, 'middle'),
    text(2150, 522, 'TUBED', 13, 820, Q.teal, 'middle'),
    panel(1630, 565, 744, 250, PANEL_COLD, 10),
    text(1658, 602, 'ITEM LAW', 12, 820, Q.green),
    wrappedText(1658, 640, 'Pay envelopes are walked to employees. They never receive a canister shell, tube stamp, dispatch route, or pneumatic station treatment.', 58, 15, 23, 650, INK),
    panel(1630, 850, 744, 360, PANEL_ALT, 10),
    text(1658, 890, 'ONE CANISTER · TWO NEW STAMPS', 16, 850, Q.green),
    placedSvg(canisterSvg('personnel_actions'), 1682, 930, 180),
    placedSvg(canisterSvg('supplies'), 2042, 930, 180),
    text(1772, 1132, 'PERSONNEL ACTIONS', 12, 820, Q.teal, 'middle'),
    text(2132, 1132, 'SUPPLIES', 12, 820, Q.teal, 'middle'),
    panel(1630, 1245, 744, 310, PANEL_COLD, 10),
    text(1658, 1285, 'STATIC FEEDBACK BOUNDARY', 16, 850, Q.green),
    wrappedText(1658, 1325, 'No new pollution assignment is invented here. Future animation may clarify activity, but this review defines no frames, timing, loops, glow, meters, or runtime owner.', 59, 14, 22, 600, MUTED),
  ];
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

function personnelRoom(x: number, y: number, cell: number): string {
  const cols = 6;
  const rows = 5;
  const cx = (column: number) => x + (column + .5) * cell;
  const cy = (row: number) => y + (row + .5) * cell;
  return [
    floorGrid(x, y, cols, rows, cell),
    roomFrame(x, y, cols, rows, cell),
    logicalPlacement(priorityThreeBAssetSvg('records_cabinet'), cx(1.35), cy(1.45), cell),
    logicalPlacement(priorityThreeBAssetSvg('badge_press'), cx(3.9), cy(1.45), cell),
    logicalPlacement(refinedPriorityOneAssetSvg('dispatch_station', { state: 'low' }), cx(5.0), cy(3.65), cell),
    logicalPlacement(canisterSvg('personnel_actions'), cx(3.3), cy(3.45), cell * .64),
  ].join('');
}

function payrollRoom(x: number, y: number, cell: number): string {
  const cols = 6;
  const rows = 5;
  const cx = (column: number) => x + (column + .5) * cell;
  const cy = (row: number) => y + (row + .5) * cell;
  return [
    floorGrid(x, y, cols, rows, cell),
    roomFrame(x, y, cols, rows, cell),
    logicalPlacement(priorityThreeBAssetSvg('ledger_engine'), cx(1.35), cy(1.45), cell),
    logicalPlacement(priorityThreeBAssetSvg('envelope_press'), cx(3.9), cy(1.45), cell),
    logicalPlacement(priorityThreeBHandCarriedSvg('pay_envelope'), cx(2.9), cy(3.5), cell * .62),
    logicalPlacement(priorityThreeBHandCarriedSvg('pay_envelope'), cx(4.0), cy(3.65), cell * .46),
    line(cx(2.9), cy(3.9), cx(5.25), cy(3.9), Q.cream, Math.max(2, cell * .04), .8),
  ].join('');
}

function supplyRoom(x: number, y: number, cell: number): string {
  const cols = 6;
  const rows = 5;
  const cx = (column: number) => x + (column + .5) * cell;
  const cy = (row: number) => y + (row + .5) * cell;
  return [
    floorGrid(x, y, cols, rows, cell),
    roomFrame(x, y, cols, rows, cell),
    logicalPlacement(priorityThreeBAssetSvg('requisition_counter'), cx(1.35), cy(1.45), cell),
    logicalPlacement(priorityThreeBAssetSvg('stock_shelving'), cx(3.9), cy(1.45), cell),
    logicalPlacement(refinedPriorityOneAssetSvg('dispatch_station', { state: 'high' }), cx(5.0), cy(3.65), cell),
    logicalPlacement(canisterSvg('supplies'), cx(3.3), cy(3.45), cell * .64),
  ].join('');
}

function roomsAt(x: number, y: number, cell: number, labels: boolean): string {
  const roomWidth = 6 * cell;
  const gap = cell * .6;
  const payrollX = x + roomWidth + gap;
  const supplyX = payrollX + roomWidth + gap;
  return [
    labels ? text(x + roomWidth / 2, y - 20, 'PERSONNEL · PERSONNEL ACTIONS → STAFFING', 13, 820, Q.green, 'middle') : '',
    personnelRoom(x, y, cell),
    labels ? text(payrollX + roomWidth / 2, y - 20, 'PAYROLL · PAY ENVELOPES → EMPLOYEES', 13, 820, Q.green, 'middle') : '',
    payrollRoom(payrollX, y, cell),
    labels ? text(supplyX + roomWidth / 2, y - 20, 'SUPPLY · SUPPLIES → DESKS + MACHINES', 13, 820, Q.green, 'middle') : '',
    supplyRoom(supplyX, y, cell),
  ].join('');
}

function roomPage(): string {
  const width = 2500;
  const height = 1510;
  const parts = [
    text(46, 58, 'PHASE C INTERNAL SERVICES · ROOM IO AND DELIVERY LAW', 30, 850),
    text(46, 91, 'Placed objects on the post-rescale grid · tubes between departments · footsteps and payday within the office', 15, 720, Q.green),
    panel(46, 126, 2408, 750, PANEL),
    text(72, 165, `NORMAL GAMEPLAY READ · ${NORMAL_CELL} PX/CELL`, 13, 820, MUTED),
    roomsAt(245, 245, NORMAL_CELL, true),
    panel(46, 912, 1540, 540, PANEL_ALT),
    text(72, 951, `FAR READ · ${FAR_CELL} PX/CELL`, 13, 820, MUTED),
    roomsAt(112, 1020, FAR_CELL, false),
    panel(1620, 912, 834, 540, PANEL_COLD),
    text(1648, 951, 'ROUTING CHECK', 18, 850, Q.green),
    wrappedText(1648, 995, 'Personnel actions and supplies use the accepted base-canister plus stamp system and may leave through dispatch stations.', 63, 15, 23, 650, INK),
    wrappedText(1648, 1112, 'Payroll has no pneumatic output. The sealed pay envelope is a hand-carried item walked to employees, shown on a floor route rather than beside a tube node.', 63, 15, 23, 650, INK),
    line(1648, 1248, 2426, 1248, RULE, 1.5),
    text(1648, 1285, 'FOOTPRINTS', 11, 820, Q.teal),
    text(1805, 1285, '2×2 except Badge/Envelope Press at 1×2; suggestions only', 12, 600, MUTED),
    text(1648, 1323, 'POLLUTION', 11, 820, Q.teal),
    text(1805, 1323, 'Records Cabinet quiet; no other assignment invented', 12, 600, MUTED),
    text(1648, 1361, 'STATUS', 11, 820, Q.teal),
    text(1805, 1361, 'accepted static control · Terrarium promotion authorized', 12, 700, Q.green),
    text(1648, 1399, 'ANIMATION', 11, 820, Q.teal),
    text(1805, 1399, 'necessary follow-up, still deferred', 12, 700, Q.green),
  ];
  return svgPage(width, height, parts.join(''));
}

export function renderPriorityThreeBFamilySvg(): string {
  return familyPage();
}

export function renderPriorityThreeBDifferentiationSvg(): string {
  return differentiationPage();
}

export function renderPriorityThreeBRoomSvg(): string {
  return roomPage();
}

function rasterize(svg: string): Uint8Array {
  return new Resvg(svg).render().asPng();
}

export interface PriorityThreeBCalibrationResult {
  readonly output: string;
  readonly files: readonly string[];
  readonly metricsPath: string;
  readonly readmePath: string;
}

export async function renderPriorityThreeBCalibration(
  output: string,
): Promise<PriorityThreeBCalibrationResult> {
  await mkdir(output, { recursive: true });
  const pages = [
    ['01-internal-services-family', renderPriorityThreeBFamilySvg()],
    ['02-function-and-collision-gates', renderPriorityThreeBDifferentiationSvg()],
    ['03-phase-c-room-routing', renderPriorityThreeBRoomSvg()],
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
    reviewStatus: 'owner-accepted-priority-3b-internal-services-static-control',
    direction: 'administrative-percussion',
    scope: 'priority-3b-personnel-payroll-supply-accepted-static-control',
    productionPromotion: true,
    canonicalSvgAuthoring: true,
    templateRegistration: true,
    defaultsMutation: true,
    departmentManifestMutation: true,
    exportRun: true,
    schemaMutation: true,
    unityImport: false,
    parityClaim: 'terrarium-source-compositor-browser-export-only',
    machineAnimationDeferred: true,
    schemaVersion: 21,
    departmentAssetManifestVersion: 2,
    assetIds: PRIORITY_THREE_B_ASSET_IDS,
    workTypeStamps: PRIORITY_THREE_B_WORK_TYPE_STAMPS,
    handCarriedItems: PRIORITY_THREE_B_HAND_CARRIED_IDS,
    scaleSuggestions: PRIORITY_THREE_B_SCALE_SUGGESTIONS,
    routingLaw: {
      personnelActions: 'canister-and-tube',
      supplies: 'canister-and-tube',
      payEnvelope: 'hand-carried-not-tubed',
    },
    collisionGates: [
      'records-cabinet-vs-parts-crib-vs-stock-shelving',
      'badge-press-vs-envelope-press',
      'ledger-engine-vs-calculating-engine',
      'pay-envelope-vs-canister',
    ],
    invariants: {
      authoringCanvas: AUTHORING_CANVAS,
      normalGameplayPixelsPerCell: NORMAL_CELL,
      farGameplayPixelsPerCell: FAR_CELL,
      propNativeFrameCells: PROP_NATIVE_FRAME_CELLS,
      recordsCabinetQuietByCatalog: true,
      otherPollutionAssignmentsInvented: false,
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

  const readme = `# QuotaCo department machines — Priority 3B internal services calibration v1

Status: **owner accepted; promoted as the Priority 3B static production control on 2026-08-01**

This sheet extends the accepted Administrative Percussion family into Personnel, Payroll, and Supply.
Personnel produces personnel-action canisters through a Records Cabinet and Badge Press. Supply produces
supplies canisters through a Requisition Counter and Stock Shelving. Payroll uses a Ledger Engine and
Envelope Press, but its pay-envelope output is walked to employees and never enters the pneumatic network.

The four collision gates are explicit: Records Cabinet is sealed lateral storage rather than the Parts
Crib's cage or Stock Shelving's open bays; Badge Press is an upright punch rather than Envelope Press's
horizontal fold-and-seal path; Ledger Engine owns posting drums and an open folio rather than the Calculating
Engine's radiator crown; the pay envelope is a flat hand-carried item rather than a cylindrical canister.

Records Cabinet remains quiet per the owner catalog. No pollution assignment is invented for the other five
machines. Machine animation remains a necessary but explicitly deferred follow-up; this proof defines no
frame names, timing, loops, runtime ownership, or export shape.

Footprints are suggestions only: 2×2 for Records Cabinet, Ledger Engine, Requisition Counter, and Stock
Shelving; 1×2 for Badge Press and Envelope Press. The pay envelope has no facility footprint.

The accepted sprites, templates, defaults, and shared browser/headless export inventory are promoted. The
department-assets manifest advances to v2 and project schema to v21 so the pay envelope can live in an explicit
hand-carried, non-pneumatic category rather than being mislabeled as a facility or canister. No stored project
data migration is needed. Unity remains untouched.

## Acceptance record

The owner accepted the six silhouettes, four collision reads, provisional footprints, pay-envelope hand-carry
distinction, and normal/far room read. Static promotion does not resolve the deferred machine-animation contract.
`;
  const readmePath = path.join(output, 'README.md');
  await writeFile(readmePath, readme, 'utf8');
  files.push(readmePath);
  return { output, files, metricsPath, readmePath };
}

function parseOut(argv: readonly string[]): string {
  const index = argv.indexOf('--out');
  if (index >= 0 && argv[index + 1]) return path.resolve(argv[index + 1]);
  return path.resolve('docs/previews/quota-co-department-machine-internal-services-calibration-v1');
}

async function main(): Promise<void> {
  const result = await renderPriorityThreeBCalibration(parseOut(process.argv.slice(2)));
  process.stdout.write(`Wrote ${result.files.length} accepted-control files to ${result.output}\n`);
}

const isMain = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;
if (isMain) await main();
