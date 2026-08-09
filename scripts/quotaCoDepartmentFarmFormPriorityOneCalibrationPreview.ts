/**
 * Owner-accepted QuotaCo farm-form Priority 1 addendum calibration source.
 *
 *   npx tsx scripts/quotaCoDepartmentFarmFormPriorityOneCalibrationPreview.ts
 *   npx tsx scripts/quotaCoDepartmentFarmFormPriorityOneCalibrationPreview.ts --out /tmp/farm-p1
 *
 * This proof owns the accepted SVG markup. Canonical promotion, registration,
 * export, and parity remain separate pipeline steps.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

import { DEPARTMENT_MACHINE_PALETTE } from './quotaCoDepartmentMachineFamilyCalibrationPreview';
import { refinedPriorityOneAssetSvg } from './quotaCoDepartmentMachineReadabilityRefinementPreview';
import { PROP_NATIVE_FRAME_CELLS } from './quotaCoWorkstationFamilyCalibrationPreview';

const AUTHORING_CANVAS = 128;
const NORMAL_CELL = 90;
const FAR_CELL = 40;
const PARTITION_OUTER_PROFILE = 38;

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

export const FARM_FORM_PRIORITY_ONE_ASSET_IDS = [
  'keypunch_console',
  'cubicle_partition_straight',
  'cubicle_partition_corner',
  'cubicle_partition_endcap',
] as const;

export type FarmFormPriorityOneAssetId =
  (typeof FARM_FORM_PRIORITY_ONE_ASSET_IDS)[number];

export type PartitionFacing = 'horizontal' | 'vertical';

export const FARM_FORM_PRIORITY_ONE_SCALE_SUGGESTIONS = [
  {
    id: 'keypunch_console',
    label: 'Keypunch Console',
    suggestedFootprint: { w: 1, h: 1 },
    placement: 'whole-cell',
    note: 'one integrated desk-height punch station per staffed seat',
  },
  {
    id: 'cubicle_partition_straight',
    label: 'Cubicle partition — straight',
    suggestedFootprint: { w: 1, h: 0 },
    placement: 'cell-edge-furniture-slot',
    note: 'one-cell-long acoustic baffle; authored horizontal and vertical views',
  },
  {
    id: 'cubicle_partition_corner',
    label: 'Cubicle partition — corner',
    suggestedFootprint: { w: 1, h: 1 },
    placement: 'cell-corner-furniture-slot',
    note: 'joins two edge slots without becoming a structural wall junction',
  },
  {
    id: 'cubicle_partition_endcap',
    label: 'Cubicle partition — end-cap',
    suggestedFootprint: { w: 1, h: 0 },
    placement: 'cell-edge-furniture-slot',
    note: 'terminates a baffle run with a visible rounded post and freestanding foot',
  },
] as const;

export const FARM_FORM_PRIORITY_ONE_OPEN_QUESTIONS = [
  {
    id: 'partition-identifiers',
    recommendation: 'Use cubicle_partition_straight / corner / endcap as the stable family ids.',
    reason: 'The addendum ratifies the three forms but does not spell their sim-facing ids.',
  },
  {
    id: 'partition-grid-slot',
    recommendation: 'Add a cell-edge furniture slot; do not charge a whole placement cell for a low baffle.',
    reason: 'Whole-cell occupancy would erase farm density, aisle tuning, and adjacency to the protected seat.',
  },
  {
    id: 'partition-facing-export',
    recommendation: 'Export authored horizontal/vertical facing variants under each stable family id.',
    reason: 'Runtime quarter-turns would invert the fixed high-oblique face and violate the owner-locked projection.',
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
  dash = '',
): string {
  return `<path d="M ${x1} ${y1} L ${x2} ${y2}" fill="none" stroke="${stroke}" ` +
    `stroke-width="${width}" stroke-linecap="round" opacity="${opacity}"` +
    `${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
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

function keypunchConsoleSvg(): string {
  const keys = Array.from({ length: 18 }, (_, index) => {
    const row = Math.floor(index / 6);
    const column = index % 6;
    return `<rect id="key-${index}" x="${44 + column * 7}" y="${82 + row * 5}" ` +
      `width="4.5" height="3" rx="1" fill="${Q.metal}"/>`;
  }).join('');
  const punchHoles = Array.from({ length: 8 }, (_, index) =>
    `<circle id="card-hole-${index}" cx="${50 + index * 4}" cy="55" r="1" fill="${Q.teal}"/>`,
  ).join('');
  return assetSvg(
    `<g id="single-seat-keypunch-console">` +
    `<path id="integrated-desk-contour" d="M 36 65 Q 36 58 43 58 H 88 Q 95 58 95 65 ` +
    `V 108 H 91 V 117 H 79 V 108 H 50 V 117 H 38 V 108 H 33 V 72 Q 33 67 36 65 Z" fill="${Q.charcoal}"/>` +
    `<path id="molded-desk-shell" d="M 39 66 Q 39 62 44 62 H 86 Q 91 62 91 67 ` +
    `V 104 H 37 V 72 Q 37 68 39 66 Z" fill="${Q.cream}"/>` +
    `<path id="dark-punch-mechanism-bay" d="M 42 63 H 69 V 79 H 42 Z" fill="${Q.charcoal}"/>` +
    `<path id="punch-card-input-hopper" d="M 47 42 H 84 V 63 H 45 Z" fill="${Q.cream}" ` +
    `stroke="${Q.charcoal}" stroke-width="2" stroke-linejoin="round"/>` +
    `<path id="visible-punch-card" d="M 49 47 H 82 V 59 H 48 Z" fill="${Q.cream}" ` +
    `stroke="${Q.charcoal}" stroke-width="1.5"/>${punchHoles}` +
    `<g id="mechanical-punch-drum"><circle cx="78" cy="70" r="10" fill="${Q.metal}" ` +
    `stroke="${Q.charcoal}" stroke-width="2.5"/><circle cx="78" cy="70" r="3.5" fill="${Q.green}"/></g>` +
    `<path id="key-deck-contour" d="M 39 77 H 88 L 94 101 H 35 Z" fill="${Q.charcoal}"/>` +
    `<path id="key-deck" d="M 43 80 H 85 L 89 97 H 39 Z" fill="${Q.cream}"/>${keys}` +
    `<path id="punched-card-output-slot" d="M 66 101 H 88" stroke="${Q.teal}" stroke-width="4" ` +
    `stroke-linecap="round"/>` +
    `<rect id="stepped-green-plinth" x="34" y="103" width="60" height="8" rx="3" fill="${Q.green}"/>` +
    `<path id="service-register" d="M 45 107 H 82" stroke="${Q.teal}" stroke-width="2.5" ` +
    `stroke-linecap="round"/>` +
    `<path id="top-plane-light" d="M 44 65 H 66" stroke="${Q.white}" stroke-width="2" ` +
    `stroke-linecap="round" opacity=".18"/></g>`,
  );
}

function acousticDots(
  x: number,
  y: number,
  columns: number,
  rows: number,
  dx: number,
  dy: number,
  prefix: string,
): string {
  const dots: string[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      dots.push(`<circle id="${prefix}-${row}-${column}" cx="${x + column * dx}" ` +
        `cy="${y + row * dy}" r="1.15" fill="${Q.green}" opacity=".9"/>`);
    }
  }
  return dots.join('');
}

function horizontalBaffle(kind: 'straight' | 'endcap'): string {
  const right = kind === 'straight' ? 96 : 74;
  const insetRight = right - 5;
  return assetSvg(
    `<g id="freestanding-acoustic-baffle-${kind}-horizontal">` +
    `<path id="baffle-contour" d="M 32 74 Q 32 69 37 69 H ${right - 5} Q ${right} 69 ${right} 74 ` +
    `V 105 H 32 Z" fill="${Q.charcoal}"/>` +
    `<path id="cream-molded-frame" d="M 35 75 Q 35 73 38 73 H ${right - 6} Q ${right - 3} 73 ${right - 3} 76 ` +
    `V 100 H 35 Z" fill="${Q.cream}"/>` +
    `<path id="thick-acoustic-field" d="M 40 78 H ${insetRight} V 96 H 40 Z" fill="${Q.teal}"/>` +
    acousticDots(44, 83, kind === 'straight' ? 8 : 4, 2, 6, 7, 'acoustic-perforation') +
    `<path id="top-cap-light" d="M 39 75 H ${insetRight}" stroke="${Q.white}" stroke-width="2" ` +
    `stroke-linecap="round" opacity=".18"/>` +
    `<rect id="left-shared-support-beam" x="28" y="68" width="8" height="43" rx="3" fill="${Q.green}"/>` +
    `<rect id="right-shared-support-beam" x="${right - 4}" y="68" width="8" height="43" rx="3" fill="${Q.green}"/>` +
    (kind === 'endcap'
      ? `<path id="rounded-terminus-cap" d="M ${right - 4} 69 Q ${right + 7} 71 ${right + 7} 79 ` +
        `V 99 Q ${right + 7} 106 ${right - 4} 108 Z" fill="${Q.cream}" stroke="${Q.charcoal}" stroke-width="2"/>`
      : '') +
    `<path id="left-floor-foot" d="M 25 110 H 40 V 116 H 25 Z" fill="${Q.metal}" ` +
    `stroke="${Q.charcoal}" stroke-width="2"/>` +
    `<path id="right-floor-foot" d="M ${right - 7} 110 H ${right + 8} V 116 H ${right - 7} Z" ` +
    `fill="${Q.metal}" stroke="${Q.charcoal}" stroke-width="2"/></g>`,
  );
}

function verticalBaffle(kind: 'straight' | 'endcap'): string {
  const top = kind === 'straight' ? 52 : 77;
  const frameTop = kind === 'straight' ? 52 : 82;
  const fieldTop = kind === 'straight' ? 52 : 87;
  return assetSvg(
    `<g id="freestanding-acoustic-baffle-${kind}-vertical">` +
    (kind === 'straight'
      ? `<path id="far-underfoot-contour" d="M 48 47 H 82 V 59 H 48 Z" fill="${Q.charcoal}"/>` +
        `<rect id="far-shared-support-under-baffle" x="50" y="49" width="30" height="8" rx="3" ` +
        `fill="${Q.green}"/>` +
        `<path id="far-floor-foot-under-baffle" d="M 49 51 H 81 V 58 H 49 Z" fill="${Q.metal}"/>`
      : '') +
    `<path id="near-underfoot-contour" d="M 48 111 H 82 V 123 H 48 Z" fill="${Q.charcoal}"/>` +
    `<rect id="near-shared-support-under-baffle" x="50" y="113" width="30" height="8" rx="3" ` +
    `fill="${Q.green}"/>` +
    `<path id="near-floor-foot-under-baffle" d="M 49 115 H 81 V 122 H 49 Z" fill="${Q.metal}"/>` +
    `<path id="continuous-topdown-baffle-contour" d="M 52 ${top} H 78 V 116 H 52 Z" fill="${Q.charcoal}"/>` +
    `<path id="continuous-cream-top-plane" d="M 55 ${frameTop} H 75 V 116 H 55 Z" fill="${Q.cream}"/>` +
    `<path id="continuous-acoustic-top-field" d="M 58 ${fieldTop} H 71 V 116 H 58 Z" fill="${Q.teal}"/>` +
    `<path id="continuous-east-side-face" d="M 71 ${fieldTop} H 75 V 116 H 71 Z" fill="${Q.green}"/>` +
    acousticDots(61, kind === 'straight' ? 60 : 91, 2, kind === 'straight' ? 5 : 2,
      6, 11, 'acoustic-perforation') +
    `<path id="longitudinal-top-light" d="M 56 ${frameTop + 2} V 113" stroke="${Q.white}" ` +
    `stroke-width="1.5" stroke-linecap="round" opacity=".18"/>` +
    (kind === 'endcap'
      ? `<path id="rounded-terminus-cap" d="M 52 ${top + 1} Q 65 ${top - 9} 78 ${top + 1} V ${top + 14} H 52 Z" ` +
        `fill="${Q.cream}" stroke="${Q.charcoal}" stroke-width="2"/>`
      : '') +
    `</g>`,
  );
}

function cornerBaffleSvg(): string {
  return assetSvg(
    `<g id="freestanding-acoustic-baffle-corner">` +
    `<path id="far-underfoot-contour" d="M 48 47 H 82 V 59 H 48 Z" fill="${Q.charcoal}"/>` +
    `<rect id="far-shared-support-under-baffle" x="50" y="49" width="30" height="8" rx="3" ` +
    `fill="${Q.green}"/>` +
    `<path id="far-floor-foot-under-baffle" d="M 49 51 H 81 V 58 H 49 Z" fill="${Q.metal}"/>` +
    `<path id="vertical-return-contour" d="M 52 52 H 78 V 91 H 52 Z" fill="${Q.charcoal}"/>` +
    `<path id="vertical-return-top-plane" d="M 55 52 H 75 V 89 H 55 Z" fill="${Q.cream}"/>` +
    `<path id="vertical-return-acoustic-field" d="M 58 52 H 71 V 89 H 58 Z" fill="${Q.teal}"/>` +
    `<path id="vertical-return-side-face" d="M 71 52 H 75 V 89 H 71 Z" fill="${Q.green}"/>` +
    acousticDots(61, 61, 2, 3, 7, 10, 'return-acoustic-perforation') +
    `<path id="horizontal-wing-contour" d="M 32 73 Q 32 69 37 69 H 69 Q 75 69 75 75 V 105 H 32 Z" ` +
    `fill="${Q.charcoal}"/>` +
    `<path id="horizontal-wing-frame" d="M 36 75 H 70 V 101 H 36 Z" fill="${Q.cream}"/>` +
    `<path id="horizontal-wing-field" d="M 41 79 H 66 V 96 H 41 Z" fill="${Q.teal}"/>` +
    acousticDots(44, 84, 4, 2, 6, 7, 'wing-acoustic-perforation') +
    `<path id="rounded-corner-post" d="M 65 66 Q 78 66 78 79 V 108 H 64 V 79 Q 64 74 59 74 H 52 ` +
    `V 66 Z" fill="${Q.green}" stroke="${Q.charcoal}" stroke-width="2"/>` +
    `<rect id="left-shared-support-beam" x="28" y="68" width="8" height="43" rx="3" fill="${Q.green}"/>` +
    `<path id="corner-top-light" d="M 57 52 H 73 M 37 74 H 61" stroke="${Q.white}" stroke-width="2" ` +
    `stroke-linecap="round" opacity=".18"/>` +
    `<path id="wing-floor-foot" d="M 25 110 H 40 V 116 H 25 Z" fill="${Q.metal}" ` +
    `stroke="${Q.charcoal}" stroke-width="2"/>` +
    `<path id="corner-floor-foot" d="M 59 110 H 83 V 117 H 59 Z" fill="${Q.metal}" ` +
    `stroke="${Q.charcoal}" stroke-width="2"/></g>`,
  );
}

export function farmFormPriorityOneAssetSvg(
  id: FarmFormPriorityOneAssetId,
  facing: PartitionFacing = 'horizontal',
): string {
  switch (id) {
    case 'keypunch_console': return keypunchConsoleSvg();
    case 'cubicle_partition_straight':
      return facing === 'vertical' ? verticalBaffle('straight') : horizontalBaffle('straight');
    case 'cubicle_partition_endcap':
      return facing === 'vertical' ? verticalBaffle('endcap') : horizontalBaffle('endcap');
    case 'cubicle_partition_corner': return cornerBaffleSvg();
  }
}

function assetCard(
  id: FarmFormPriorityOneAssetId,
  label: string,
  x: number,
  y: number,
  width: number,
  note: string,
): string {
  const source = farmFormPriorityOneAssetSvg(id);
  return panel(x, y, width, 390, PANEL_ALT, 12) +
    text(x + 18, y + 29, label.toUpperCase(), 12, 820, Q.green) +
    placedSvg(source, x + 26, y + 50, 236) +
    placedSvg(source, x + width - 155, y + 89, 112) +
    placedSvg(source, x + width - 75, y + 145, 40) +
    text(x + 144, y + 310, '128u source', 11, 720, MUTED, 'middle') +
    text(x + width - 99, y + 222, 'normal', 10, 720, MUTED, 'middle') +
    text(x + width - 55, y + 222, 'far', 10, 720, MUTED, 'middle') +
    wrappedText(x + 18, y + 339, note, 54, 12, 18, 590, MUTED);
}

function familyPage(): string {
  const width = 2100;
  const height = 1520;
  const parts = [
    text(36, 48, 'QUOTACO DEPARTMENT MACHINES · FARM-FORM ADDENDUM', 26, 860),
    text(36, 78, 'Priority 1 accepted calibration · Administrative Percussion + low acoustic furniture', 14, 650, MUTED),
    text(width - 36, 48, 'OWNER ACCEPTED · PROMOTED', 12, 840, Q.green, 'end'),
    text(width - 36, 73, 'post-rescale grid · 128u source · 90 / 40 px-per-cell checks', 11, 680, Q.green, 'end'),
    panel(36, 102, width - 72, 188, PANEL_COLD),
    text(58, 137, 'FARM LAW', 12, 840, Q.green),
    text(58, 174, 'ONE STAFFED SEAT = ONE 1×1 CONVERSION STATION', 22, 850),
    wrappedText(58, 209,
      'The Keypunch Console is the per-seat product. Rows of consoles supersede the row-form Keypunch Bank; the Tabulating Machine remains the small shared collector. Baffles protect seats without becoming room walls.',
      118, 14, 22, 620, MUTED),
    text(width - 58, 138, 'PRODUCT FAMILY', 11, 820, MUTED, 'end'),
    text(width - 58, 169, 'cream shoulders · dark mechanism · green plinth', 13, 720, Q.green, 'end'),
    text(width - 58, 194, 'thick teal acoustic field · freestanding metal feet', 13, 720, Q.green, 'end'),
  ];

  parts.push(
    assetCard('keypunch_console', 'Keypunch Console', 36, 314, 990,
      'Integrated desk-height punch station: card hopper, mechanical punch drum, dense key deck, and physical output slot. No screen or readout.'),
    assetCard('cubicle_partition_straight', 'Partition · straight', 1046, 314, 1018,
      'One-cell-long, low acoustic panel. Thick perforated field, rounded frame, posts, and visible feet say furniture and baffle.'),
    assetCard('cubicle_partition_corner', 'Partition · corner', 36, 726, 990,
      'A fixed-view L joint with one rounded furniture post. It joins edge slots; it is not a wall autotile junction.'),
    assetCard('cubicle_partition_endcap', 'Partition · end-cap', 1046, 726, 1018,
      'A short terminating run with a strong rounded cap and floor foot. The termination remains visible at far gameplay scale.'),
    panel(36, 1140, width - 72, 332, PANEL),
    text(58, 1177, 'ROW FORM → PER-SEAT FORM', 13, 840, Q.green),
    placedSvg(refinedPriorityOneAssetSvg('keypunch_bank'), 84, 1207, 230),
    text(199, 1452, 'keypunch_bank', 11, 740, MUTED, 'middle'),
    text(373, 1324, 'SUPERSEDED AS FARM STATION', 11, 830, Q.coral),
    line(337, 1307, 514, 1307, Q.coral, 3),
  );
  [0, 1, 2, 3].forEach((index) => {
    parts.push(placedSvg(farmFormPriorityOneAssetSvg('keypunch_console'), 548 + index * 242, 1194, 222));
  });
  parts.push(
    text(1011, 1452, 'rows of independent 1×1 keypunch_console stations', 11, 740, MUTED, 'middle'),
    placedSvg(refinedPriorityOneAssetSvg('tabulating_machine'), 1544, 1191, 242),
    text(1665, 1452, 'tabulating_machine · shared collector', 11, 740, MUTED, 'middle'),
    text(2010, 1206, 'UNCHANGED', 10, 820, Q.green, 'end'),
  );
  return svgPage(width, height, parts.join(''));
}

function drawGrid(
  x: number,
  y: number,
  columns: number,
  rows: number,
  cell: number,
): string {
  const parts = [
    `<rect x="${x}" y="${y}" width="${columns * cell}" height="${rows * cell}" ` +
    `fill="${FLOOR}" stroke="#56616A" stroke-width="2"/>`,
  ];
  for (let column = 1; column < columns; column += 1) {
    parts.push(line(x + column * cell, y, x + column * cell, y + rows * cell, FLOOR_LINE, 1, .24));
  }
  for (let row = 1; row < rows; row += 1) {
    parts.push(line(x, y + row * cell, x + columns * cell, y + row * cell, FLOOR_LINE, 1, .24));
  }
  return parts.join('');
}

function oneCellPlacement(source: string, x: number, y: number, cell: number, guide = false): string {
  const native = cell * PROP_NATIVE_FRAME_CELLS;
  const spriteX = x - cell * .5;
  const spriteY = y + cell - native * (116 / AUTHORING_CANVAS);
  return (guide
    ? `<rect x="${x + 2}" y="${y + 2}" width="${cell - 4}" height="${cell - 4}" rx="4" ` +
      `fill="${OCCUPANCY}" fill-opacity=".08" stroke="${OCCUPANCY}" stroke-width="1.5" stroke-dasharray="6 5"/>`
    : '') + placedSvg(source, spriteX, spriteY, native);
}

function edgePlacement(
  source: string,
  x: number,
  y: number,
  cell: number,
): string {
  const native = cell * PROP_NATIVE_FRAME_CELLS;
  return placedSvg(source, x - cell * .5, y + cell - native * (116 / AUTHORING_CANVAS), native);
}

function scalePerson(x: number, y: number, scale: number): string {
  return `<g id="employee-scale-marker" transform="translate(${x} ${y}) scale(${scale})">` +
    `<circle cx="0" cy="-31" r="9" fill="#B78365" stroke="${Q.charcoal}" stroke-width="2"/>` +
    `<path d="M -13 -20 Q 0 -28 13 -20 L 10 7 Q 0 13 -10 7 Z" fill="#43627B" ` +
    `stroke="${Q.charcoal}" stroke-width="2"/>` +
    `<path d="M -7 8 L -8 28 M 7 8 L 8 28" stroke="${Q.charcoal}" stroke-width="5" ` +
    `stroke-linecap="round"/></g>`;
}

function gridPage(): string {
  const width = 2100;
  const height = 1550;
  const parts = [
    text(36, 48, 'POST-RESCALE GRID + BAFFLE READABILITY GATES', 26, 860),
    text(36, 78, 'The art proposal is concrete; the edge-slot export contract remains an owner decision.', 14, 650, MUTED),
    panel(36, 104, 1000, 610, PANEL),
    text(58, 139, '1×1 KEYPUNCH STATION · WHOLE-CELL OCCUPANCY', 12, 840, Q.green),
    drawGrid(98, 190, 5, 4, 110),
    oneCellPlacement(farmFormPriorityOneAssetSvg('keypunch_console'), 318, 300, 110, true),
    scalePerson(373, 520, .92),
    text(373, 665, 'console shell stays within the central 64u / one-cell envelope', 12, 650, MUTED, 'middle'),
    text(989, 139, '1×1', 18, 850, Q.green, 'end'),
    panel(1056, 104, 1008, 610, PANEL_ALT),
    text(1078, 139, 'LOW PROFILE · FURNITURE, NOT ARCHITECTURE', 12, 840, Q.green),
    `<rect x="1115" y="190" width="260" height="470" fill="${FLOOR}"/>`,
    `<rect x="1178" y="217" width="74" height="410" rx="5" fill="${Q.charcoal}"/>`,
    `<rect x="1185" y="224" width="60" height="396" rx="3" fill="${Q.cream}"/>`,
    text(1215, 648, '112u ordinary wall datum', 10, 720, MUTED, 'middle'),
    placedSvg(farmFormPriorityOneAssetSvg('cubicle_partition_straight'), 1396, 323, 340),
    line(1426, 603, 1727, 603, Q.green, 2, 1, '7 5'),
    text(1576, 648, '38u low partition envelope + visible freestanding feet', 10, 720, MUTED, 'middle'),
    text(2016, 139, 'LOWER VISUAL WEIGHT', 11, 820, Q.green, 'end'),
  ];

  parts.push(
    panel(36, 738, 1000, 456, PANEL_COLD),
    text(58, 774, 'AUTHORED FACINGS · NO RUNTIME QUARTER-TURN', 12, 840, Q.green),
    placedSvg(farmFormPriorityOneAssetSvg('cubicle_partition_straight', 'horizontal'), 84, 817, 250),
    placedSvg(farmFormPriorityOneAssetSvg('cubicle_partition_straight', 'vertical'), 376, 817, 250),
    placedSvg(farmFormPriorityOneAssetSvg('cubicle_partition_endcap', 'horizontal'), 668, 817, 250),
    text(209, 1110, 'straight · horizontal', 11, 720, MUTED, 'middle'),
    text(501, 1110, 'straight · vertical', 11, 720, MUTED, 'middle'),
    text(793, 1110, 'end-cap · fixed view', 11, 720, MUTED, 'middle'),
    panel(1056, 738, 1008, 456, PANEL),
    text(1078, 774, 'CONTINUITY + TERMINATION · ONE-CELL EDGE SOCKETS', 12, 840, Q.green),
  );
  for (let index = 0; index < 5; index += 1) {
    parts.push(placedSvg(
      farmFormPriorityOneAssetSvg(index === 4 ? 'cubicle_partition_endcap' : 'cubicle_partition_straight'),
      1084 + index * 178,
      848,
      356,
    ));
  }
  parts.push(
    line(1173, 1041, 1885, 1041, Q.coral, 1.5, .72, '8 6'),
    text(1570, 1110, 'unbroken low baffle run; rounded end remains legible', 11, 720, MUTED, 'middle'),
    panel(36, 1218, width - 72, 286, PANEL_WARN),
    text(58, 1254, 'RATIFIED EXPORT DECISIONS', 13, 850, Q.green),
  );
  FARM_FORM_PRIORITY_ONE_OPEN_QUESTIONS.forEach((question, index) => {
    const x = 58 + index * 665;
    parts.push(
      text(x, 1294, `${index + 1}. ${question.id.replaceAll('-', ' ').toUpperCase()}`, 10, 820, Q.coral),
      wrappedText(x, 1324, question.recommendation, 65, 12, 18, 680, INK),
      wrappedText(x, 1400, question.reason, 65, 11, 17, 540, MUTED),
    );
  });
  return svgPage(width, height, parts.join(''));
}

function farmStation(
  x: number,
  y: number,
  cell: number,
  occupied: boolean,
): string {
  const parts = [
    oneCellPlacement(farmFormPriorityOneAssetSvg('keypunch_console'), x, y, cell, true),
    edgePlacement(farmFormPriorityOneAssetSvg('cubicle_partition_straight'), x, y - cell * .46, cell),
    edgePlacement(farmFormPriorityOneAssetSvg('cubicle_partition_straight', 'vertical'), x - cell * .48, y, cell),
  ];
  if (occupied) parts.push(scalePerson(x + cell * .53, y + cell * .84, cell / 110));
  return parts.join('');
}

function machinePlacement(
  source: string,
  x: number,
  y: number,
  footprint: { w: number; h: number },
  cell: number,
): string {
  const native = cell * PROP_NATIVE_FRAME_CELLS;
  const width = footprint.w * cell;
  const height = footprint.h * cell;
  return `<rect x="${x + 3}" y="${y + 3}" width="${width - 6}" height="${height - 6}" rx="6" ` +
    `fill="${OCCUPANCY}" fill-opacity=".07" stroke="${OCCUPANCY}" stroke-width="1.2" stroke-dasharray="6 5"/>` +
    placedSvg(source, x + (width - native) / 2, y + height - native * (116 / 128), native);
}

function roomPage(): string {
  const width = 2200;
  const height = 1530;
  const cell = 82;
  const ox = 185;
  const oy = 176;
  const cols = 12;
  const rows = 10;
  const parts = [
    text(36, 48, 'DATA PROCESSING FARM · NORMAL + FAR GAMEPLAY READ', 26, 860),
    text(36, 78, 'Rows scale with staffed seats; work moves by hand inside the room; only the department boundary is tubed.', 14, 650, MUTED),
    panel(36, 104, 1280, 1038, PANEL),
    drawGrid(ox, oy, cols, rows, cell),
  ];

  const seats = [
    [2, 2, true], [5, 2, true], [8, 2, false],
    [2, 5, true], [5, 5, true], [8, 5, true],
  ] as const;
  seats.forEach(([column, row, occupied]) => {
    parts.push(farmStation(ox + column * cell, oy + row * cell, cell, occupied));
  });
  parts.push(
    machinePlacement(refinedPriorityOneAssetSvg('intake_tray_large', { state: 'high' }),
      ox + .2 * cell, oy + 1.2 * cell, { w: 1, h: 1 }, cell),
    machinePlacement(refinedPriorityOneAssetSvg('tabulating_machine'),
      ox + 9.4 * cell, oy + 1.1 * cell, { w: 3, h: 2 }, cell),
    machinePlacement(refinedPriorityOneAssetSvg('dispatch_station', { state: 'low' }),
      ox + 10.4 * cell, oy + 6.8 * cell, { w: 1, h: 1 }, cell),
    text(ox + .7 * cell, oy + 1.05 * cell, 'IN', 10, 850, Q.cream, 'middle'),
    text(ox + 10.9 * cell, oy + 6.65 * cell, 'OUT', 10, 850, Q.cream, 'middle'),
    text(ox + 10.85 * cell, oy + .9 * cell, 'SHARED COLLECTOR', 10, 820, Q.cream, 'middle'),
    line(ox + 1.1 * cell, oy + 2.2 * cell, ox + 1.7 * cell, oy + 3.2 * cell, Q.cream, 2.5, .85, '8 6'),
    line(ox + 8.9 * cell, oy + 5.8 * cell, ox + 10.4 * cell, oy + 3.4 * cell, Q.cream, 2.5, .85, '8 6'),
    text(ox + 6 * cell, oy + 9.55 * cell, 'FOOTSTEPS WITHIN · BAFFLES BETWEEN · TUBES ONLY BEYOND THE ROOM', 11, 820, Q.cream, 'middle'),
  );

  parts.push(
    panel(1340, 104, 824, 504, PANEL_ALT),
    text(1362, 139, 'FAR ROOM · 40 PX / CELL', 12, 840, Q.green),
    `<g transform="translate(1370 172) scale(${40 / cell})">`,
    drawGrid(0, 0, cols, rows, cell),
  );
  seats.forEach(([column, row, occupied]) => {
    parts.push(farmStation(column * cell, row * cell, cell, occupied));
  });
  parts.push(
    machinePlacement(refinedPriorityOneAssetSvg('intake_tray_large', { state: 'high' }),
      .2 * cell, 1.2 * cell, { w: 1, h: 1 }, cell),
    machinePlacement(refinedPriorityOneAssetSvg('tabulating_machine'),
      9.4 * cell, 1.1 * cell, { w: 3, h: 2 }, cell),
    machinePlacement(refinedPriorityOneAssetSvg('dispatch_station', { state: 'low' }),
      10.4 * cell, 6.8 * cell, { w: 1, h: 1 }, cell),
    `</g>`,
    panel(1340, 632, 824, 510, PANEL_COLD),
    text(1362, 668, 'READABILITY CHECK', 12, 840, Q.green),
    text(1362, 711, 'SEAT', 10, 820, MUTED),
    text(1512, 711, 'key deck + card hopper', 13, 720),
    text(1362, 752, 'BAFFLE', 10, 820, MUTED),
    text(1512, 752, 'low teal acoustic field + feet', 13, 720),
    text(1362, 793, 'COLLECTOR', 10, 820, MUTED),
    text(1512, 793, 'large drums and paper path', 13, 720),
    text(1362, 834, 'EMPTY SEAT', 10, 820, MUTED),
    text(1512, 834, 'machine remains; no employee marker', 13, 720),
    line(1362, 865, 2135, 865, RULE, 1),
    text(1362, 905, 'GRID CONTRACT', 10, 820, Q.green),
    wrappedText(1362, 934,
      'Console: 1×1 whole-cell station. Baffles: one-cell edge/corner furniture slots, with no hidden whole-cell collision. The sim remains free to tune approach cells and attenuation reach.',
      84, 13, 21, 620, INK),
    text(1362, 1043, 'PRODUCTION STATUS', 10, 820, Q.green),
    wrappedText(1362, 1072,
      'Owner accepted. Canonical sources, templates, browser/headless export, and source-to-compositor parity are complete; Approvals farm-form Priority 2 remains next.',
      84, 13, 21, 620, INK),
    panel(36, 1170, width - 72, 306, PANEL_WARN),
    text(58, 1207, 'PRODUCTION BOUNDARY', 13, 850, Q.coral),
    text(58, 1248, 'VERIFIED', 10, 830, Q.green),
    wrappedText(58, 1278,
      'accepted silhouettes · canonical 128u SVGs · registered templates/defaults · manifest v3 · shared browser/headless export · source-to-compositor pixel parity · production composed-office proof',
      112, 13, 21, 620, INK),
    text(1130, 1248, 'DEFERRED / OUT OF SCOPE', 10, 830, Q.coral),
    wrappedText(1130, 1278,
      'no Unity import · no machine animation contract · vertical-foot polish remains refinement debt · Keypunch Bank retained for old-save resolution · no Approvals farm-form Priority 2 art',
      105, 13, 21, 620, INK),
  );
  return svgPage(width, height, parts.join(''));
}

function horizontalStretch(
  startX: number,
  frameY: number,
  segments: number,
  cell: number,
  includeEndcap = false,
): string {
  const native = cell * PROP_NATIVE_FRAME_CELLS;
  const parts: string[] = [];
  for (let index = 0; index < segments; index += 1) {
    const id = includeEndcap && index === segments - 1
      ? 'cubicle_partition_endcap'
      : 'cubicle_partition_straight';
    parts.push(placedSvg(
      farmFormPriorityOneAssetSvg(id),
      startX - cell * .5 + index * cell,
      frameY,
      native,
    ));
  }
  return parts.join('');
}

function verticalStretch(
  centerX: number,
  startY: number,
  segments: number,
  cell: number,
): string {
  const native = cell * PROP_NATIVE_FRAME_CELLS;
  const frameX = centerX - native * (65 / AUTHORING_CANVAS);
  const firstFrameY = startY - native * (52 / AUTHORING_CANVAS);
  return Array.from({ length: segments }, (_, index) => placedSvg(
    farmFormPriorityOneAssetSvg('cubicle_partition_straight', 'vertical'),
    frameX,
    firstFrameY + index * cell,
    native,
  )).join('');
}

function partitionRunsPage(): string {
  const width = 2200;
  const height = 1640;
  const cell = 126;
  const horizontalX = 132;
  const horizontalY = 256;
  const verticalX = 1588;
  const verticalY = 198;
  const parts = [
    text(36, 48, 'PARTITION RUN REFINEMENT · SHARED SUPPORT SOCKETS', 26, 860),
    text(36, 78,
      'Every cell boundary resolves to one coincident support beam; long north/south runs receive their own authored view.',
      14, 650, MUTED),
    text(width - 36, 48, 'FOCUSED CORRECTION', 12, 840, Q.coral, 'end'),
    panel(36, 104, 1070, 782, PANEL),
    text(58, 140, 'HORIZONTAL STRETCH · FIVE ONE-CELL SEGMENTS', 12, 840, Q.green),
    drawGrid(96, 184, 7, 4, cell),
    horizontalStretch(horizontalX, horizontalY, 5, cell, true),
    text(537, 730, 'shared beams land exactly on cell-edge sockets', 12, 720, Q.cream, 'middle'),
  ];
  for (let index = 1; index < 5; index += 1) {
    const socketX = horizontalX + index * cell;
    parts.push(
      `<circle cx="${socketX}" cy="${horizontalY + cell * 1.72}" r="17" fill="none" ` +
      `stroke="${Q.coral}" stroke-width="2" stroke-dasharray="5 4"/>`,
    );
  }

  parts.push(
    panel(1130, 104, 1034, 782, PANEL_ALT),
    text(1152, 140, 'VERTICAL STRETCH · FIVE ONE-CELL SEGMENTS', 12, 840, Q.green),
    drawGrid(1260, 184, 5, 5, cell),
    verticalStretch(verticalX, verticalY, 4, cell),
    text(1855, 812, 'top-down cream/teal strip runs continuously along the floor', 12, 720, MUTED, 'middle'),
    text(1855, 836, 'shared feet are painted underneath; only their wings remain visible', 12, 620, MUTED, 'middle'),
  );
  for (let index = 1; index < 4; index += 1) {
    const socketY = verticalY + index * cell;
    parts.push(
      `<circle cx="${verticalX}" cy="${socketY}" r="18" fill="none" ` +
      `stroke="${Q.coral}" stroke-width="2" stroke-dasharray="5 4"/>`,
    );
  }

  parts.push(
    panel(36, 910, 1070, 472, PANEL_COLD),
    text(58, 947, 'JOINT CLOSE-UP · ONE BEAM, NOT A BUNCHED PAIR', 12, 840, Q.green),
    horizontalStretch(114, 955, 2, 248),
    `<circle cx="362" cy="1289" r="42" fill="none" stroke="${Q.coral}" stroke-width="3"/>`,
    line(404, 1289, 664, 1289, Q.coral, 2),
    text(688, 1283, 'both module endpoints are centered on the same socket', 13, 740, INK),
    text(688, 1310, 'their support beams coincide into one structural upright', 13, 640, MUTED),
    panel(1130, 910, 1034, 472, PANEL),
    text(1152, 947, 'FAR READ · 40 PX / CELL', 12, 840, Q.green),
    `<rect x="1178" y="984" width="420" height="330" rx="8" fill="${FLOOR}"/>`,
    horizontalStretch(1222, 1032, 5, FAR_CELL, true),
    `<rect x="1632" y="984" width="420" height="330" rx="8" fill="${FLOOR}"/>`,
    verticalStretch(1842, 1010, 5, FAR_CELL),
    text(1388, 1340, 'horizontal', 10, 740, MUTED, 'middle'),
    text(1842, 1340, 'vertical', 10, 740, MUTED, 'middle'),
    panel(36, 1406, width - 72, 184, PANEL_WARN),
    text(58, 1443, 'CORRECTED CONNECTION LAW', 12, 850, Q.coral),
    wrappedText(58, 1474,
      'Horizontal modules center their endpoint support on the exact cell-edge socket, so adjacent endpoints overdraw one upright. Vertical modules are authored top-down: the continuous cream and teal strip paints over each shared support and foot, leaving only the footing wings visible beneath the baffle. Corners use the same under-baffle ownership at the vertical socket; end-caps retain one unmistakable terminal post.',
      166, 13, 21, 620, INK),
  );
  return svgPage(width, height, parts.join(''));
}

export function renderFarmFormPriorityOneFamilySvg(): string {
  return familyPage();
}

export function renderFarmFormPriorityOneGridSvg(): string {
  return gridPage();
}

export function renderFarmFormPriorityOneRoomSvg(): string {
  return roomPage();
}

export function renderFarmFormPriorityOnePartitionRunsSvg(): string {
  return partitionRunsPage();
}

function rasterize(svg: string): Uint8Array {
  return new Resvg(svg).render().asPng();
}

export interface FarmFormPriorityOneCalibrationResult {
  readonly output: string;
  readonly files: readonly string[];
  readonly metricsPath: string;
  readonly readmePath: string;
}

export async function renderFarmFormPriorityOneCalibration(
  output: string,
): Promise<FarmFormPriorityOneCalibrationResult> {
  await mkdir(output, { recursive: true });
  const pages = [
    ['01-farm-form-family', renderFarmFormPriorityOneFamilySvg()],
    ['02-grid-and-baffle-gates', renderFarmFormPriorityOneGridSvg()],
    ['03-data-processing-farm', renderFarmFormPriorityOneRoomSvg()],
    ['04-horizontal-and-vertical-partition-runs', renderFarmFormPriorityOnePartitionRunsSvg()],
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
    reviewStatus: 'owner-accepted-farm-form-priority-1-static-control',
    direction: 'administrative-percussion-farm-form',
    scope: 'farm-form-priority-1-addendum-accepted-and-promoted',
    productionPromotion: true,
    canonicalSvgAuthoring: true,
    templateRegistration: true,
    defaultsMutation: true,
    departmentManifestMutation: true,
    departmentAssetManifestVersion: 3,
    exportRun: true,
    parityClaim: 'terrarium-source-compositor-browser-export-only',
    unityImport: false,
    priorityTwoStarted: false,
    keypunchBankRetired: false,
    keypunchBankBuilderPlaceable: false,
    assetIds: FARM_FORM_PRIORITY_ONE_ASSET_IDS,
    scaleSuggestions: FARM_FORM_PRIORITY_ONE_SCALE_SUGGESTIONS,
    ratifiedDecisions: FARM_FORM_PRIORITY_ONE_OPEN_QUESTIONS,
    invariants: {
      authoringCanvas: AUTHORING_CANVAS,
      normalGameplayPixelsPerCell: NORMAL_CELL,
      farGameplayPixelsPerCell: FAR_CELL,
      propNativeFrameCells: PROP_NATIVE_FRAME_CELLS,
      partitionOuterProfileUnits: PARTITION_OUTER_PROFILE,
      amberUsedOnProducts: false,
      roseUsedOnProducts: false,
      bakedUiUsed: false,
      cameraCueUsed: false,
      wearOrClutterBakedIntoSku: false,
      footprintsSuggestedOnly: true,
      authoredPartitionFacingsProposed: true,
      sharedSupportSocketOwnership: true,
      verticalSupportTreatment: 'topdown-baffle-over-shared-underfoot',
      horizontalStretchShown: true,
      verticalStretchShown: true,
    },
  };
  const metricsPath = path.join(output, 'metrics.json');
  await writeFile(metricsPath, `${JSON.stringify(metrics, null, 2)}\n`, 'utf8');
  files.push(metricsPath);

  const readme = `# QuotaCo department machines — farm-form Priority 1 addendum calibration v1

Status: **owner accepted as the farm-form Priority 1 static control; promoted in Terrarium**

This proof records the accepted farm-form Priority 1 direction. The Keypunch Console is a
single-seat 1×1 integrated desk-height station with a card hopper, mechanical punch drum, dense key deck,
and physical output slot. Rows of these consoles supersede the Keypunch Bank as the farm station; the existing
Tabulating Machine remains Data Processing's shared collector.

The cubicle partition family is deliberately low furniture rather than architecture. Straight, corner, and
end-cap forms use a 38-unit outer profile, thick perforated acoustic fields, rounded molded frames, structural
posts, and conspicuous freestanding feet. The accepted contract uses one-cell edge/corner furniture slots and
authored horizontal/vertical views; runtime quarter-turning would violate the fixed high-oblique projection.
The focused refinement centers every connecting endpoint on its exact cell-edge socket, so adjacent pieces
overdraw one shared support beam instead of bunching two supports side-by-side. Vertical modules use a top-down
strip: their continuous cream and teal planes paint over each shared support and foot, leaving only small
footing wings visible underneath the baffle. Dedicated long horizontal and vertical stretch evidence verifies
the rule at normal and 40-pixel-per-cell scale.

The addendum did not spell out exact partition ids; the accepted production ids are
\`cubicle_partition_straight\`, \`cubicle_partition_corner\`, and \`cubicle_partition_endcap\`.

Canonical SVG sources, templates/defaults, department manifest v3, the shared browser/headless exporter,
and exact source-to-production-compositor parity are complete. The Keypunch Bank remains export-resolvable
for old saves but is no longer builder-placeable. Unity import and the Approvals farm-form Priority 2 art are
not part of this promotion; machine animation remains a necessary deferred contract.
`;
  const readmePath = path.join(output, 'README.md');
  await writeFile(readmePath, readme, 'utf8');
  files.push(readmePath);
  return { output, files, metricsPath, readmePath };
}

function parseOut(argv: readonly string[]): string {
  const index = argv.indexOf('--out');
  if (index >= 0 && argv[index + 1]) return path.resolve(argv[index + 1]);
  return path.resolve('docs/previews/quota-co-department-machine-farm-form-priority1-calibration-v1');
}

async function main(): Promise<void> {
  const result = await renderFarmFormPriorityOneCalibration(parseOut(process.argv.slice(2)));
  process.stdout.write(`Wrote ${result.files.length} accepted calibration files to ${result.output}\n`);
}

const isMain = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;
if (isMain) await main();
