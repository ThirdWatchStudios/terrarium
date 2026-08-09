/**
 * Review-only source-fit study for the active QuotaCo office window.
 *
 * Candidate geometry stays local to this preview. Neighbor-suite glass is
 * deliberately deferred and is not represented here.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

import { composeProp, composeWallTile } from '../src/core/compositor';
import { DEFAULT_PROPS, DEFAULT_WALLS, defaultProject } from '../src/data/defaults';
import { BLOB_CONFIGS } from '../src/tiles/blob';
import { canonicalSlidingDoorSvg } from './quotaCoBuildingOpeningsWallFixturesAuditPreview';

type Axis = 'horizontal' | 'vertical';

const PAGE = '#E7E1D2';
const PANEL = '#F6F1E6';
const PANEL_ALT = '#ECE5D7';
const PANEL_COLD = '#E3ECE8';
const PANEL_WARN = '#F2E3DC';
const INK = '#292C2A';
const MUTED = '#626861';
const RULE = '#A39B8B';
const FLOOR = '#748088';
const FLOOR_LINE = '#D9D4C7';

const Q = {
  cream: '#D9D0B9',
  creamLight: '#F3EEDA',
  creamShade: '#BEB49F',
  green: '#294B3C',
  teal: '#547B78',
  tealLight: '#83A9A6',
  rust: '#B65F4D',
  charcoal: '#252A28',
  metal: '#979A91',
} as const;

function escapeText(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function text(
  x: number,
  y: number,
  value: string,
  size = 16,
  weight = 560,
  fill = INK,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return `<text x="${x}" y="${y}" font-family="Inter,Arial,sans-serif" font-size="${size}" ` +
    `font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${escapeText(value)}</text>`;
}

function wrappedText(
  x: number,
  y: number,
  value: string,
  max: number,
  size = 14,
  leading = 20,
  weight = 560,
  fill = INK,
): string {
  const lines: string[] = [];
  let current = '';
  for (const word of value.split(/\s+/)) {
    const next = current ? `${current} ${word}` : word;
    if (current && next.length > max) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.map((line, index) => text(x, y + index * leading, line, size, weight, fill)).join('');
}

function page(width: number, height: number, markup: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${PAGE}"/>${markup}</svg>`;
}

function panel(x: number, y: number, width: number, height: number, fill = PANEL): string {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="12" ` +
    `fill="${fill}" stroke="${RULE}" stroke-width="1.5"/>`;
}

function inner(svg: string): string {
  return svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

function placedSvg(source: string, x: number, y: number, size: number): string {
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 128 128" ` +
    `preserveAspectRatio="none" overflow="visible">${inner(source)}</svg>`;
}

function runtimeOneCell(source: string, x: number, y: number, cell: number): string {
  return placedSvg(source, x - cell / 2, y - cell / 2, cell * 2);
}

function currentWindowSvg(): string {
  const prop = DEFAULT_PROPS.find(({ templateId }) => templateId === 'window');
  if (!prop) throw new Error('Missing default window');
  return composeProp(prop, defaultProject().style, 128);
}

function productionWallSvg(axis: Axis): string {
  const wall = DEFAULT_WALLS.find(({ templateId }) => templateId === 'office-wall');
  if (!wall) throw new Error('Missing production office wall');
  return composeWallTile(wall, defaultProject().style, BLOB_CONFIGS[axis === 'horizontal' ? 10 : 5], 128);
}

export function officeWindowSource(axis: Axis): string {
  return readFileSync(
    path.resolve('assets/walls/quota-co-building-openings-v2', `window-${axis}.svg`),
    'utf8',
  );
}

function grid(x: number, y: number, columns: number, rows: number, cell: number): string {
  const parts = [`<rect x="${x}" y="${y}" width="${columns * cell}" height="${rows * cell}" fill="${FLOOR}"/>`];
  for (let column = 1; column < columns; column += 1) {
    parts.push(`<path d="M${x + column * cell} ${y}V${y + rows * cell}" stroke="${FLOOR_LINE}" opacity=".18"/>`);
  }
  for (let row = 1; row < rows; row += 1) {
    parts.push(`<path d="M${x} ${y + row * cell}H${x + columns * cell}" stroke="${FLOOR_LINE}" opacity=".18"/>`);
  }
  return parts.join('');
}

function wallCell(source: string, x: number, y: number, cell: number): string {
  return source.includes('data-runtime-grid-scale="0.5"')
    ? runtimeOneCell(source, x, y, cell)
    : placedSvg(source, x, y, cell);
}

function wallRun(
  x: number,
  y: number,
  cell: number,
  axis: Axis,
  count: number,
  replacements: ReadonlyMap<number, string>,
): string {
  const parts: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const px = axis === 'horizontal' ? x + index * cell : x;
    const py = axis === 'vertical' ? y + index * cell : y;
    parts.push(wallCell(replacements.get(index) ?? productionWallSvg(axis), px, py, cell));
  }
  return parts.join('');
}

function officeRoom(x: number, y: number, cell: number, columns: number, rows: number): string {
  const top = new Map<number, string>([
    [2, officeWindowSource('horizontal')],
    [5, canonicalSlidingDoorSvg('horizontal', 'closed')],
  ]);
  const side = new Map<number, string>([
    [2, officeWindowSource('vertical')],
    [4, canonicalSlidingDoorSvg('vertical', 'closed')],
  ]);
  return grid(x, y, columns, rows, cell) +
    wallRun(x, y, cell, 'horizontal', columns, top) +
    wallRun(x, y, cell, 'vertical', rows, side) +
    `<rect x="${x + 2.1 * cell}" y="${y + 2.7 * cell}" width="${3.5 * cell}" height="${1.25 * cell}" rx="${cell * .06}" fill="${Q.cream}" stroke="${Q.charcoal}" stroke-width="${Math.max(1, cell * .02)}"/>` +
    `<rect x="${x + 2.35 * cell}" y="${y + 2.94 * cell}" width="${1.1 * cell}" height="${.65 * cell}" fill="${Q.green}"/>` +
    `<rect x="${x + 4.15 * cell}" y="${y + 2.94 * cell}" width="${1.1 * cell}" height="${.65 * cell}" fill="${Q.teal}"/>`;
}

export function renderOfficeWindowSourceFitSvg(): string {
  const width = 1920;
  const height = 1240;
  const current = currentWindowSvg();
  const horizontal = officeWindowSource('horizontal');
  const vertical = officeWindowSource('vertical');
  const parts: string[] = [
    text(36, 48, 'OFFICE WINDOW · SOURCE-FIT REVIEW V2', 27, 860),
    text(36, 79, 'Canonical source validation · active prop-window receiver only · neighbor glass deferred until a real surround need exists', 14, 650, MUTED),
    text(width - 36, 48, 'TERRARIUM SOURCE PROMOTED', 12, 860, Q.teal, 'end'),
    panel(36, 108, 1848, 176, PANEL_WARN),
    text(58, 142, 'PRODUCTION TRACE', 12, 840, Q.green),
    text(58, 172, 'prop-window + prop-window-vertical · active interior wall-slot · 1 × 1 logical footprint · two canonical fixed-view SVGs', 13, 620, MUTED),
    text(58, 210, 'APPROVED V2 DIRECTION', 12, 840, Q.green),
    wrappedText(58, 238, 'The vertical state now follows the accepted door construction: wall stubs meet the neighboring cells, while a narrow raised glazed barrier spans the opening. Transparent floor surrounds it; no facade is rotated onto the ground.', 105, 13, 19, 620),
  ];

  const cards = [
    { x: 36, width: 430, label: 'PRODUCTION TEMPLATE OUTPUT', note: 'Stable prop-window resolves the checked-in horizontal source exactly.', source: current, runtime: true, fill: PANEL_ALT },
    { x: 492, width: 670, label: 'HORIZONTAL · FRONT FACE', note: 'Integrated lintel, partial blinds, mullion, sill, and lower wall register.', source: horizontal, runtime: true, fill: PANEL },
    { x: 1188, width: 696, label: 'VERTICAL · RAISED TOP-OBLIQUE', note: 'End stubs plus a narrow glass barrier; floor remains visible on both sides.', source: vertical, runtime: true, fill: PANEL_COLD },
  ];
  cards.forEach((card) => {
    parts.push(
      panel(card.x, 310, card.width, 650, card.fill),
      text(card.x + 22, 346, card.label, 13, 840, Q.green),
      wrappedText(card.x + 22, 374, card.note, Math.floor(card.width / 9), 12, 18, 620, MUTED),
      `<rect x="${card.x + 22}" y="426" width="${card.width - 44}" height="360" rx="8" fill="${FLOOR}"/>`,
      card.runtime
        ? runtimeOneCell(card.source, card.x + (card.width - 320) / 2, 446, 320)
        : placedSvg(productionWallSvg('horizontal'), card.x + (card.width - 256) / 2, 478, 256) + placedSvg(card.source, card.x + (card.width - 256) / 2, 478, 256),
      text(card.x + card.width / 2, 816, card.runtime ? 'ONE-CELL COMPOSED READ' : 'LIVE OVER WALL TILE', 10, 820, MUTED, 'middle'),
    );
    if (card.runtime) {
      parts.push(
        `<rect x="${card.x + 42}" y="842" width="90" height="90" rx="4" fill="${FLOOR}"/>`,
        `<rect x="${card.x + 166}" y="867" width="40" height="40" rx="2" fill="${FLOOR}"/>`,
        runtimeOneCell(card.source, card.x + 42, 842, 90),
        runtimeOneCell(card.source, card.x + 166, 867, 40),
        text(card.x + 87, 948, '90 normal', 10, 720, MUTED, 'middle'),
        text(card.x + 186, 948, '40 far', 10, 720, MUTED, 'middle'),
      );
    }
  });

  parts.push(
    panel(36, 986, 1848, 218, PANEL_ALT),
    text(58, 1022, 'SOURCE / RUNTIME SPLIT', 12, 840, Q.green),
    text(58, 1054, 'Canonical SVG sources', 12, 760),
    text(258, 1054, 'window-horizontal.svg · window-vertical.svg', 12, 700, MUTED),
    text(58, 1090, 'Unity remains responsible for', 12, 760),
    text(258, 1090, 'wall-axis selection · east/west mirroring · replacing exactly one wall cell · preserving the independent floor tile', 12, 700, MUTED),
    text(58, 1126, 'Explicitly deferred', 12, 760, Q.rust),
    text(258, 1126, 'prop-neighbor-glass and every proposed storefront state, until gameplay or building-shell composition demonstrates a need', 12, 700, MUTED),
    text(58, 1162, 'Not part of either source', 12, 760),
    text(258, 1162, 'baked floor · rotated front elevation · UXML / USS · runtime wall geometry', 12, 700, MUTED),
  );
  return page(width, height, parts.join(''));
}

export function renderOfficeWindowLiteralScaleSvg(): string {
  const width = 1280;
  const height = 720;
  const parts: string[] = [
    text(24, 34, 'OFFICE WINDOW V2 · LITERAL GAMEPLAY-SCALE STUDY', 21, 860),
    text(24, 58, '1280 × 720 review frame · exact 90 px normal and 40 px far cells · accepted slider included as facing control', 12, 640, MUTED),
    text(width - 24, 34, 'REVIEW ONLY', 11, 840, Q.rust, 'end'),
    panel(18, 78, 846, 616, PANEL),
    text(38, 110, 'ACTIVE OFFICE · 90 PX / CELL', 12, 840),
    officeRoom(38, 130, 90, 8, 6),
    text(38, 682, 'Both windows replace one wall tile. Floor remains independently visible around the vertical barrier.', 11, 700, MUTED),
    panel(882, 78, 380, 292, PANEL_ALT),
    text(902, 110, 'FAR OFFICE · 40 PX / CELL', 12, 840),
    officeRoom(902, 130, 40, 8, 5),
    text(902, 352, 'Glass and frame remain legible without reading as a floor decal.', 10, 700, MUTED),
    panel(882, 388, 380, 306, PANEL_COLD),
    text(902, 420, 'VERTICAL READ · ISOLATED', 12, 840),
    `<rect x="902" y="444" width="160" height="160" rx="8" fill="${FLOOR}"/>`,
    runtimeOneCell(officeWindowSource('vertical'), 902, 444, 160),
    `<rect x="1092" y="494" width="70" height="70" rx="4" fill="${FLOOR}"/>`,
    runtimeOneCell(officeWindowSource('vertical'), 1092, 494, 70),
    text(982, 626, '160 detail', 10, 720, MUTED, 'middle'),
    text(1127, 586, '70 reduced', 10, 720, MUTED, 'middle'),
    wrappedText(902, 656, 'The pane is a raised barrier between wall seams, not a rotated facade or a transparent doorway.', 46, 11, 17, 620),
  ];
  return page(width, height, parts.join(''));
}

export async function renderOfficeWindowSourceFit(output: string): Promise<readonly string[]> {
  await mkdir(output, { recursive: true });
  const pages = [
    ['01-office-window-source-fit-v2', renderOfficeWindowSourceFitSvg()],
    ['02-literal-gameplay-scale', renderOfficeWindowLiteralScaleSvg()],
  ] as const;
  const files: string[] = [];
  for (const [stem, svg] of pages) {
    const svgPath = path.join(output, `${stem}.svg`);
    const pngPath = path.join(output, `${stem}.png`);
    await writeFile(svgPath, svg, 'utf8');
    await writeFile(pngPath, new Resvg(svg).render().asPng());
    files.push(svgPath, pngPath);
  }
  const metricsPath = path.join(output, 'metrics.json');
  await writeFile(metricsPath, `${JSON.stringify({
    status: 'terrarium-production-promoted-awaiting-browser-export',
    stableIds: ['prop-window', 'prop-window-vertical'],
    footprint: '1x1',
    candidateAxes: ['horizontal-front-face', 'vertical-raised-top-oblique'],
    neighborGlass: 'deferred-until-demonstrated-need',
    candidateGeometryLocalToPreview: false,
    canonicalSvgPromotion: true,
    productionTemplateMutation: true,
    exporterMutation: false,
    browserExport: false,
    unityImport: false,
    staging: false,
    commit: false,
  }, null, 2)}\n`, 'utf8');
  files.push(metricsPath);
  const readmePath = path.join(output, 'README.md');
  await writeFile(readmePath, [
    '# QuotaCo Office Window Source-Fit Review v2',
    '',
    'Status: **visual direction approved; Terrarium canonical source promotion complete**',
    '',
    'This revision narrows the gate to the active `prop-window` family. Neighbor-suite glass is',
    'deferred until gameplay or building-shell composition demonstrates a concrete need for it.',
    '',
    'The horizontal candidate remains an integrated wall opening. The revised vertical candidate',
    'uses the accepted fixed-view door grammar: wall stubs meet neighboring cells and a narrow',
    'top-oblique glazed barrier spans the opening, leaving the separately rendered floor visible',
    'around it. Neither candidate contains floor pixels.',
    '',
    'Canonical source ownership: `window-horizontal.svg` and `window-vertical.svg`. The known',
    'garage-door resemblance in the vertical blinds remains a hand-correction polish note, not a',
    'reason to retain generated geometry as source truth.',
    '',
    'Unity would continue to own axis selection, east/west mirroring, exact one-cell wall replacement,',
    'and preservation of the floor tile below the opening.',
    '',
    'Terrarium source and importer promotion are complete. Browser export, Unity import/runtime work,',
    'staging, and commit remain separate gates and were not performed by this pass.',
    '',
  ].join('\n'), 'utf8');
  files.push(readmePath);
  return files;
}

function outputPath(argv: readonly string[]): string {
  const index = argv.indexOf('--out');
  return index >= 0 && argv[index + 1]
    ? path.resolve(argv[index + 1])
    : path.resolve('docs/previews/quota-co-office-window-source-fit-v2');
}

const isMain = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;
if (isMain) {
  const output = outputPath(process.argv.slice(2));
  const files = await renderOfficeWindowSourceFit(output);
  process.stdout.write(`Wrote ${files.length} review-only office-window files to ${output}\n`);
}
