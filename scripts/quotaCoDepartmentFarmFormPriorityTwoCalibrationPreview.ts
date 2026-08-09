/**
 * Owner-accepted QuotaCo farm-form Priority 2 addendum calibration.
 *
 * Promotion freezes these pixels through the canonical-source and shared browser/headless
 * export flow. The proof remains separate from the production composed-office validation.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

import { DEPARTMENT_MACHINE_PALETTE } from './quotaCoDepartmentMachineFamilyCalibrationPreview';
import { refinedPriorityOneAssetSvg } from './quotaCoDepartmentMachineReadabilityRefinementPreview';
import { farmFormPriorityOneAssetSvg } from './quotaCoDepartmentFarmFormPriorityOneCalibrationPreview';

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
const Q = DEPARTMENT_MACHINE_PALETTE;

export const FARM_FORM_PRIORITY_TWO_ASSET_IDS = [
  'adjudication_desk_set',
  'docket_rack',
] as const;

export const FARM_FORM_PRIORITY_TWO_WORK_TYPE_STAMPS = [
  'applications',
  'determinations',
] as const;

export type FarmFormPriorityTwoAssetId =
  (typeof FARM_FORM_PRIORITY_TWO_ASSET_IDS)[number];
export type FarmFormPriorityTwoWorkTypeStamp =
  (typeof FARM_FORM_PRIORITY_TWO_WORK_TYPE_STAMPS)[number];
export type DocketFillState = 'empty' | 'low' | 'high' | 'overflowing';

export const FARM_FORM_PRIORITY_TWO_SCALE_SUGGESTIONS = [
  {
    id: 'adjudication_desk_set',
    suggestedFootprint: { w: 1, h: 1 },
    role: 'per-seat conversion station',
    nounRead: 'stamp rack + date-punch + guided form bed + twin decision chutes',
  },
  {
    id: 'docket_rack',
    suggestedFootprint: { w: 1, h: 1 },
    role: 'small shared collector',
    nounRead: 'open backlog cage + indexed docket folios + collection plinth',
  },
] as const;

export const FARM_FORM_PRIORITY_TWO_OPEN_QUESTIONS = [
  {
    id: 'approvals-identifiers',
    recommendation: 'Use adjudication_desk_set and docket_rack as stable facility ids.',
  },
  {
    id: 'docket-rack-footprint',
    recommendation: 'Keep the Docket Rack at 1×1 so the shared collector does not dominate the farm.',
  },
  {
    id: 'docket-fill-states',
    recommendation: 'Bake empty/low/high/overflowing variants; the backlog cage is Approvals saturation read.',
  },
] as const;

function escapeText(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
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
  return `<text x="${x}" y="${y}" font-family="Inter,Arial,sans-serif" font-size="${size}" ` +
    `font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${escapeText(value)}</text>`;
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
  size = 14,
  lineHeight = 21,
  weight = 560,
  fill: string = INK,
): string {
  return wrap(value, max)
    .map((entry, index) => text(x, y + index * lineHeight, entry, size, weight, fill))
    .join('');
}

function panel(x: number, y: number, width: number, height: number, fill = PANEL): string {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="14" ` +
    `fill="${fill}" stroke="${RULE}" stroke-width="1.5"/>`;
}

function assetSvg(markup: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ` +
    `viewBox="0 0 128 128">${markup}</svg>`;
}

function inner(svg: string): string {
  return svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

function placedSvg(source: string, x: number, y: number, size: number): string {
  return source
    .replace('<svg ', `<svg x="${x}" y="${y}" overflow="visible" `)
    .replace(/width="[^"]+" height="[^"]+"/, `width="${size}" height="${size}"`);
}

function svgPage(width: number, height: number, markup: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${PAGE}"/>${markup}</svg>`;
}

function adjudicationDeskSetSvg(): string {
  const formRules = Array.from({ length: 5 }, (_, index) =>
    `<path id="form-rule-${index}" d="M 45 ${78 + index * 4} H ${72 + (index % 2) * 5}" ` +
    `stroke="${Q.teal}" stroke-width="1.4" stroke-linecap="round"/>`,
  ).join('');
  return assetSvg(
    `<g id="single-seat-adjudication-desk-set">` +
    `<path id="desk-contour" d="M 34 61 Q 34 56 40 56 H 92 Q 97 56 97 62 V 108 ` +
    `H 92 V 117 H 80 V 108 H 49 V 117 H 37 V 108 H 31 V 68 Q 31 64 34 61 Z" fill="${Q.charcoal}"/>` +
    `<path id="molded-desk-shell" d="M 38 62 Q 38 60 42 60 H 89 Q 93 60 93 64 V 103 H 35 V 68 ` +
    `Q 35 64 38 62 Z" fill="${Q.cream}"/>` +
    `<path id="stamp-rack-back" d="M 39 43 H 70 V 64 H 39 Z" fill="${Q.charcoal}"/>` +
    `<path id="stamp-rack-rail" d="M 42 48 H 67" stroke="${Q.metal}" stroke-width="4" stroke-linecap="round"/>` +
    `<g id="three-decision-stamps">` +
    `<path d="M 44 34 H 50 V 52 H 44 Z M 53 31 H 59 V 52 H 53 Z M 62 36 H 68 V 52 H 62 Z" fill="${Q.green}"/>` +
    `<path d="M 42 51 H 52 V 56 H 42 Z M 51 51 H 61 V 56 H 51 Z M 60 51 H 70 V 56 H 60 Z" fill="${Q.metal}"/>` +
    `</g>` +
    `<path id="guided-form-bed" d="M 39 70 H 79 L 84 97 H 36 Z" fill="${Q.charcoal}"/>` +
    `<path id="application-form" d="M 43 73 H 75 L 78 93 H 40 Z" fill="${Q.cream}"/>${formRules}` +
    `<path id="left-form-guide" d="M 39 69 L 36 97" stroke="${Q.metal}" stroke-width="3"/>` +
    `<path id="right-form-guide" d="M 79 69 L 84 97" stroke="${Q.metal}" stroke-width="3"/>` +
    `<g id="mechanical-date-punch"><circle cx="84" cy="70" r="11" fill="${Q.metal}" ` +
    `stroke="${Q.charcoal}" stroke-width="2.5"/><path d="M 84 61 V 79 M 77 70 H 91" ` +
    `stroke="${Q.green}" stroke-width="2"/></g>` +
    `<path id="twin-decision-chutes" d="M 39 98 H 61 V 106 H 39 Z M 66 98 H 88 V 106 H 66 Z" ` +
    `fill="${Q.teal}" stroke="${Q.charcoal}" stroke-width="2"/>` +
    `<rect id="stepped-green-plinth" x="33" y="104" width="62" height="8" rx="3" fill="${Q.green}"/>` +
    `<path id="top-plane-light" d="M 41 62 H 76" stroke="${Q.white}" stroke-width="2" ` +
    `stroke-linecap="round" opacity=".18"/></g>`,
  );
}

function docketFolios(count: number): string {
  return Array.from({ length: count }, (_, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const x = 43 + column * 14;
    const y = 91 - row * 17;
    return `<path id="docket-${index}" d="M ${x} ${y} H ${x + 11} V ${y + 15} H ${x} Z" ` +
      `fill="${Q.cream}" stroke="${Q.charcoal}" stroke-width="1.5"/>` +
      `<path d="M ${x + 3} ${y + 5} H ${x + 8} M ${x + 3} ${y + 9} H ${x + 7}" ` +
      `stroke="${Q.teal}" stroke-width="1"/>`;
  }).join('');
}

function docketRackSvg(state: DocketFillState): string {
  const counts: Record<DocketFillState, number> = { empty: 0, low: 2, high: 6, overflowing: 9 };
  const overflow = state === 'overflowing'
    ? `<g id="overflow-dockets"><path d="M 82 55 H 96 V 79 H 82 Z" fill="${Q.cream}" ` +
      `stroke="${Q.charcoal}" stroke-width="2"/><path d="M 86 61 H 92 M 86 66 H 92" ` +
      `stroke="${Q.teal}" stroke-width="1.5"/></g>`
    : '';
  return assetSvg(
    `<g id="shared-docket-rack-${state}">` +
    `<path id="collector-contour" d="M 31 40 Q 31 34 38 34 H 88 Q 96 34 96 42 V 108 ` +
    `H 91 V 117 H 79 V 108 H 49 V 117 H 37 V 108 H 31 Z" fill="${Q.charcoal}"/>` +
    `<path id="cream-rack-shell" d="M 35 42 Q 35 38 40 38 H 86 Q 92 38 92 44 V 101 H 35 Z" fill="${Q.cream}"/>` +
    `<path id="open-backlog-cage" d="M 39 48 H 84 V 98 H 39 Z" fill="${Q.green}"/>` +
    `<path id="cage-bars" d="M 50 48 V 98 M 63 48 V 98 M 76 48 V 98 M 39 72 H 84" ` +
    `stroke="${Q.metal}" stroke-width="2.5"/>` +
    docketFolios(counts[state]) + overflow +
    `<path id="index-crest" d="M 45 29 H 80 V 43 H 45 Z" fill="${Q.cream}" ` +
    `stroke="${Q.charcoal}" stroke-width="2"/>` +
    `<path id="index-slots" d="M 50 34 H 59 M 64 34 H 75" stroke="${Q.teal}" stroke-width="2"/>` +
    `<rect id="collector-plinth" x="32" y="101" width="63" height="12" rx="4" fill="${Q.green}"/>` +
    `<path id="service-register" d="M 43 106 H 84" stroke="${Q.teal}" stroke-width="2.5" ` +
    `stroke-linecap="round"/></g>`,
  );
}

export function farmFormPriorityTwoAssetSvg(
  id: FarmFormPriorityTwoAssetId,
  state: DocketFillState = 'high',
): string {
  return id === 'adjudication_desk_set' ? adjudicationDeskSetSvg() : docketRackSvg(state);
}

export function farmFormPriorityTwoStampOverlaySvg(
  id: FarmFormPriorityTwoWorkTypeStamp,
): string {
  if (id === 'applications') {
    return assetSvg(
      `<g id="applications-stamp"><path d="M 48 57 H 70 V 76 H 48 Z" fill="${Q.teal}"/>` +
      `<path d="M 53 53 H 75 V 72 H 53 Z" fill="${Q.cream}" stroke="${Q.green}" stroke-width="2"/>` +
      `<path d="M 57 58 H 70 M 57 63 H 68 M 57 68 H 71" stroke="${Q.green}" stroke-width="1.5"/></g>`,
    );
  }
  return assetSvg(
    `<g id="determinations-stamp"><circle cx="64" cy="64" r="13" fill="${Q.cream}" ` +
    `stroke="${Q.green}" stroke-width="3"/><path d="M 57 64 L 62 69 L 72 57" fill="none" ` +
    `stroke="${Q.teal}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M 52 78 H 76" stroke="${Q.green}" stroke-width="3" stroke-linecap="round"/></g>`,
  );
}

function stampedCanister(id: FarmFormPriorityTwoWorkTypeStamp): string {
  return assetSvg(inner(refinedPriorityOneAssetSvg('canister_base')) + inner(farmFormPriorityTwoStampOverlaySvg(id)));
}

function drawGrid(x: number, y: number, columns: number, rows: number, cell: number): string {
  const parts = [`<rect x="${x}" y="${y}" width="${columns * cell}" height="${rows * cell}" ` +
    `fill="${FLOOR}" stroke="#56616A" stroke-width="2"/>`];
  for (let column = 1; column < columns; column += 1) {
    parts.push(`<path d="M ${x + column * cell} ${y} V ${y + rows * cell}" stroke="${FLOOR_LINE}" opacity=".24"/>`);
  }
  for (let row = 1; row < rows; row += 1) {
    parts.push(`<path d="M ${x} ${y + row * cell} H ${x + columns * cell}" stroke="${FLOOR_LINE}" opacity=".24"/>`);
  }
  return parts.join('');
}

function familyPage(): string {
  const width = 1960;
  const height = 1160;
  const states: DocketFillState[] = ['empty', 'low', 'high', 'overflowing'];
  const parts = [
    text(36, 48, 'QUOTACO APPROVALS FARM · PRIORITY 2 ADDENDUM', 26, 860),
    text(36, 78, 'Owner-accepted calibration · applications → determinations · Administrative Percussion', 14, 650, MUTED),
    text(width - 36, 48, 'OWNER ACCEPTED · PROMOTED', 12, 840, Q.green, 'end'),
    panel(36, 104, 905, 560, PANEL_ALT),
    text(58, 140, 'PER-SEAT MACHINE · ADJUDICATION DESK SET', 13, 840, Q.green),
    placedSvg(adjudicationDeskSetSvg(), 104, 170, 360),
    placedSvg(adjudicationDeskSetSvg(), 530, 232, 180),
    placedSvg(adjudicationDeskSetSvg(), 754, 300, 80),
    text(284, 570, '128u source', 12, 720, MUTED, 'middle'),
    text(620, 450, 'normal', 11, 720, MUTED, 'middle'),
    text(794, 408, 'far', 11, 720, MUTED, 'middle'),
    wrappedText(58, 616,
      'Stamp rack, date-punch, guided form bed, and twin physical decision chutes. No key deck, screen, meter, or baked approve/deny UI.',
      98, 13, 20, 600, MUTED),
    panel(969, 104, 955, 560, PANEL_ALT),
    text(991, 140, 'SHARED COLLECTOR · DOCKET RACK', 13, 840, Q.green),
  ];
  states.forEach((state, index) => {
    const x = 1001 + index * 225;
    parts.push(
      placedSvg(docketRackSvg(state), x, 184, 210),
      text(x + 105, 430, state, 11, 740, MUTED, 'middle'),
      placedSvg(docketRackSvg(state), x + 55, 462, 72),
    );
  });
  parts.push(
    wrappedText(991, 600,
      'The open backlog cage changes physically across four baked fill states. At far scale the paper mass, not a status lamp, carries saturation.',
      104, 13, 20, 600, MUTED),
    panel(36, 692, width - 72, 420, PANEL),
    text(58, 730, 'CANISTER IDENTITY · ONE BASE, TWO NEW STAMPS', 13, 840, Q.green),
    placedSvg(stampedCanister('applications'), 126, 770, 250),
    placedSvg(stampedCanister('applications'), 418, 846, 100),
    text(252, 1056, 'applications · stacked incoming forms', 12, 720, MUTED, 'middle'),
    placedSvg(stampedCanister('determinations'), 760, 770, 250),
    placedSvg(stampedCanister('determinations'), 1052, 846, 100),
    text(886, 1056, 'determinations · sealed decision mark', 12, 720, MUTED, 'middle'),
    text(1338, 794, 'STAMP LAW', 11, 840, Q.coral),
    wrappedText(1338, 830,
      'Transparent overlays only. The canister body, clearance, tube sockets, and product color reservations remain unchanged.',
      60, 14, 22, 620, INK),
  );
  return svgPage(width, height, parts.join(''));
}

function roomPage(): string {
  const width = 2040;
  const height = 1320;
  const normal = { x: 52, y: 150, cell: 88 };
  const parts = [
    text(36, 48, 'APPROVALS FARM · ROOM IO + GAMEPLAY READ', 26, 860),
    text(36, 78, 'Applications enter by tube; adjudicators convert one unit per seat; determinations aggregate at the Docket Rack.', 14, 650, MUTED),
    panel(36, 108, 1320, 1010, PANEL),
    drawGrid(normal.x, normal.y, 13, 9, normal.cell),
    text(78, 186, 'APPLICATIONS IN', 11, 820, Q.cream),
    placedSvg(refinedPriorityOneAssetSvg('intake_tray_large', { state: 'high' }), 74, 194, 176),
  ];
  const seats = [
    [300, 246], [550, 246], [800, 246],
    [300, 554], [550, 554], [800, 554],
  ];
  for (const [x, y] of seats) {
    parts.push(
      placedSvg(farmFormPriorityOneAssetSvg('cubicle_partition_straight'), x - 38, y - 84, 176),
      placedSvg(farmFormPriorityOneAssetSvg('cubicle_partition_straight', 'vertical'), x - 84, y - 10, 176),
      placedSvg(adjudicationDeskSetSvg(), x, y, 176),
    );
  }
  parts.push(
    placedSvg(docketRackSvg('high'), 1030, 286, 224),
    text(1142, 544, 'SHARED COLLECTOR', 11, 820, Q.cream, 'middle'),
    placedSvg(refinedPriorityOneAssetSvg('dispatch_station', { state: 'high' }), 1038, 656, 176),
    placedSvg(refinedPriorityOneAssetSvg('pneumatic_dispatch_node'), 1150, 656, 176),
    text(1150, 860, 'DETERMINATIONS OUT', 11, 820, Q.cream, 'middle'),
    text(688, 1056, 'FOOTSTEPS WITHIN · TUBES ONLY AT THE ROOM EDGE', 12, 780, Q.cream, 'middle'),
    panel(1384, 108, 620, 1010, PANEL_COLD),
    text(1408, 148, 'FAR ROOM · 40 PX / CELL', 12, 840, Q.green),
    drawGrid(1440, 190, 11, 8, 40),
  );
  const farSeats = [[1490, 230], [1610, 230], [1730, 230], [1490, 390], [1610, 390], [1730, 390]];
  for (const [x, y] of farSeats) parts.push(placedSvg(adjudicationDeskSetSvg(), x, y, 80));
  parts.push(
    placedSvg(docketRackSvg('high'), 1870, 288, 80),
    placedSvg(refinedPriorityOneAssetSvg('intake_tray_large', { state: 'high' }), 1448, 530, 80),
    placedSvg(refinedPriorityOneAssetSvg('dispatch_station', { state: 'high' }), 1860, 530, 80),
    text(1408, 694, 'READABILITY TARGETS', 11, 840, Q.green),
    wrappedText(1408, 730,
      'Seat: tall stamp rack over a guided paper bed. Collector: open cage and a larger paper mass. Flow: one intake, rows of seats, one collector, one dispatch edge.',
      65, 14, 22, 620, INK),
    text(1408, 906, 'ROOM IO', 11, 840, Q.green),
    wrappedText(1408, 942,
      'applications → Adjudication Desk Set → determinations → Docket Rack → dispatch station',
      61, 14, 22, 700, INK),
    text(1408, 1044, 'No tube routing inside the farm.', 13, 720, Q.coral),
    panel(36, 1144, width - 72, 132, PANEL_WARN),
    text(58, 1182, 'PRODUCTION BOUNDARY', 12, 840, Q.coral),
    wrappedText(58, 1214,
      'Canonical source, templates/defaults, manifest v3, browser/headless export, and source/compositor parity are included. Unity and animation remain out of scope.',
      150, 13, 20, 620, INK),
  );
  return svgPage(width, height, parts.join(''));
}

function contractPage(): string {
  const width = 1880;
  const height = 1060;
  const parts = [
    text(36, 48, 'APPROVALS FARM · DIFFERENCE + CONTRACT GATES', 26, 860),
    text(36, 78, 'Accepted noun reads and ratified export decisions carried into production.', 14, 650, MUTED),
    panel(36, 108, 880, 480, PANEL_ALT),
    text(58, 146, 'KEYPUNCH CONSOLE ≠ ADJUDICATION DESK SET', 13, 840, Q.green),
    placedSvg(farmFormPriorityOneAssetSvg('keypunch_console'), 120, 188, 280),
    placedSvg(adjudicationDeskSetSvg(), 514, 188, 280),
    text(260, 508, 'keys + punch drum', 12, 720, MUTED, 'middle'),
    text(654, 508, 'stamp rack + date-punch', 12, 720, MUTED, 'middle'),
    panel(944, 108, 900, 480, PANEL_ALT),
    text(966, 146, 'TABULATOR ≠ DOCKET RACK', 13, 840, Q.green),
    placedSvg(refinedPriorityOneAssetSvg('tabulating_machine'), 1010, 188, 280),
    placedSvg(docketRackSvg('high'), 1414, 188, 280),
    text(1150, 508, 'drums + paper path', 12, 720, MUTED, 'middle'),
    text(1554, 508, 'open cage + indexed folios', 12, 720, MUTED, 'middle'),
    panel(36, 616, width - 72, 396, PANEL_WARN),
    text(58, 656, 'RATIFIED EXPORT DECISIONS', 13, 850, Q.green),
  ];
  FARM_FORM_PRIORITY_TWO_OPEN_QUESTIONS.forEach((question, index) => {
    const x = 58 + index * 595;
    parts.push(
      text(x, 704, `${index + 1}. ${question.id.replaceAll('-', ' ').toUpperCase()}`, 11, 820, Q.coral),
      wrappedText(x, 742, question.recommendation, 58, 14, 22, 640, INK),
    );
  });
  parts.push(
    text(58, 920, 'UNCHANGED CONTRACTS', 11, 840, Q.green),
    wrappedText(58, 950,
      '1×1 seat station · accepted cubicle baffles · hand distribution within room · base-plus-stamp canisters · amber/rose reserved · static machines until animation is separately ratified',
      158, 13, 20, 620, INK),
  );
  return svgPage(width, height, parts.join(''));
}

export function renderFarmFormPriorityTwoFamilySvg(): string { return familyPage(); }
export function renderFarmFormPriorityTwoRoomSvg(): string { return roomPage(); }
export function renderFarmFormPriorityTwoContractSvg(): string { return contractPage(); }

export interface FarmFormPriorityTwoCalibrationResult {
  readonly output: string;
  readonly files: readonly string[];
  readonly metricsPath: string;
  readonly readmePath: string;
}

export async function renderFarmFormPriorityTwoCalibration(
  output: string,
): Promise<FarmFormPriorityTwoCalibrationResult> {
  await mkdir(output, { recursive: true });
  const pages = [
    ['01-approvals-farm-family', familyPage()],
    ['02-approvals-room-io', roomPage()],
    ['03-difference-and-contract-gates', contractPage()],
  ] as const;
  const files: string[] = [];
  for (const [stem, svg] of pages) {
    const svgPath = path.join(output, `${stem}.svg`);
    const pngPath = path.join(output, `${stem}.png`);
    await writeFile(svgPath, svg, 'utf8');
    await writeFile(pngPath, new Resvg(svg).render().asPng());
    files.push(svgPath, pngPath);
  }
  const metrics = {
    reviewStatus: 'owner-accepted-farm-form-priority-2-static-control',
    direction: 'administrative-percussion-approvals-farm',
    scope: 'farm-form-priority-2-addendum-accepted-and-promoted',
    productionPromotion: true,
    canonicalSvgAuthoring: true,
    templateRegistration: true,
    departmentManifestMutation: true,
    departmentAssetManifestVersion: 3,
    exportRun: true,
    parityClaim: 'terrarium-source-compositor-browser-export-only',
    unityImport: false,
    assetIds: FARM_FORM_PRIORITY_TWO_ASSET_IDS,
    workTypeStamps: FARM_FORM_PRIORITY_TWO_WORK_TYPE_STAMPS,
    scaleSuggestions: FARM_FORM_PRIORITY_TWO_SCALE_SUGGESTIONS,
    openQuestions: FARM_FORM_PRIORITY_TWO_OPEN_QUESTIONS,
    docketFillStatesRatified: ['empty', 'low', 'high', 'overflowing'],
    machineAnimationDeferred: true,
  };
  const metricsPath = path.join(output, 'metrics.json');
  await writeFile(metricsPath, `${JSON.stringify(metrics, null, 2)}\n`, 'utf8');
  files.push(metricsPath);
  const readmePath = path.join(output, 'README.md');
  await writeFile(readmePath, [
    '# QuotaCo department machines — farm-form Priority 2 addendum calibration v1',
    '',
    'Status: **owner accepted and promoted through the Terrarium browser/headless export path**',
    '',
    'This proof covers the Approvals farm only: one 1×1 Adjudication Desk Set per staffed seat,',
    'a 1×1 Docket Rack shared collector, and applications/determinations canister stamps.',
    'The Docket Rack uses baked empty/low/high/overflowing states so the backlog cage',
    'carries the department saturation read without a lamp, meter, or other product UI.',
    '',
    'Canonical source, production registration, manifest v3, and shared browser/headless export',
    'are included. Unity work and a machine-animation contract remain deferred.',
    '',
  ].join('\n'), 'utf8');
  files.push(readmePath);
  return { output, files, metricsPath, readmePath };
}

function outputPath(argv: readonly string[]): string {
  const index = argv.indexOf('--out');
  return index >= 0 && argv[index + 1]
    ? path.resolve(argv[index + 1])
    : path.resolve('docs/previews/quota-co-department-machine-farm-form-priority2-calibration-v1');
}

const isMain = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;
if (isMain) {
  const result = await renderFarmFormPriorityTwoCalibration(outputPath(process.argv.slice(2)));
  process.stdout.write(`Wrote ${result.files.length} accepted calibration files to ${result.output}\n`);
}
