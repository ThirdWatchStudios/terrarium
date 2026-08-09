/**
 * Production validation for the quieter, material-complete wall family.
 *
 * This narrows the accepted RimWorld-inspired topology direction to the five
 * wall materials that still add useful build vocabulary. It renders through the
 * normal production templates and compositor; browser export and Unity remain
 * separate review gates.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

import { composeWallTile } from '../src/core/compositor';
import type { ShapeSpec, TileInstance } from '../src/core/types';
import { CORE_WALLS, DEFAULT_STYLE } from '../src/data/defaults';
import { NB } from '../src/tiles/blob';
import { WALL_TEMPLATES } from '../src/tiles/templates';

export type QuietWallFamilyId =
  | 'office-wall'
  | 'brick-wall'
  | 'panel-wall'
  | 'cubicle-partition'
  | 'slat-wall';

type ReviewState = 'existing-material' | 'quiet-family';

interface FamilySpec {
  id: QuietWallFamilyId;
  label: string;
  role: string;
  refinement: string;
  palette: TileInstance['palette'];
  detail: string;
}

const PAGE = '#E8E5DC';
const PANEL = '#F4F1E9';
const PANEL_ALT = '#ECE9E0';
const INK = '#2C302D';
const MUTED = '#666B67';
const RULE = '#A5A49D';
const FLOOR = '#9B795E';
const FLOOR_LINE = '#765C49';
const OUTSIDE = '#62715B';
const REVIEW_RED = '#A95546';
const PROPOSED = '#526E68';
const CONTOUR = '#323431';

export const QUIET_WALL_FAMILIES: readonly FamilySpec[] = [
  {
    id: 'office-wall',
    label: 'Office wall',
    role: 'default shell and ordinary partitions',
    refinement: 'plain cap and material-colored front/return faces',
    palette: { primary: '#85867F', secondary: '#B0AEA5', accent: '#999A92' },
    detail: '#777872',
  },
  {
    id: 'brick-wall',
    label: 'Brick wall',
    role: 'older retained structure and service areas',
    refinement: 'masonry belongs to the front and returns, not the cap',
    palette: { primary: '#745146', secondary: '#A86D5A', accent: '#8D5E50' },
    detail: '#D2AA97',
  },
  {
    id: 'panel-wall',
    label: 'Panel wall',
    role: 'manufactured interior wall system',
    refinement: 'panel joints are constructed into the visible faces',
    palette: { primary: '#66655F', secondary: '#94928A', accent: '#7D7C75' },
    detail: '#B5B0A5',
  },
  {
    id: 'cubicle-partition',
    label: 'Cubicle partition',
    role: 'fabric workplace dividers',
    refinement: 'fabric color steps with a face-owned lower reveal',
    palette: { primary: '#6D777D', secondary: '#99A3A8', accent: '#808A90' },
    detail: '#5D676C',
  },
  {
    id: 'slat-wall',
    label: 'Wood slat wall',
    role: 'warm acoustic feature surface',
    refinement: 'slat reveals are cut into the front and return faces',
    palette: { primary: '#705643', secondary: '#9C7658', accent: '#83654E' },
    detail: '#503E33',
  },
] as const;

export const QUIET_WALL_FAMILY_REVIEW = {
  status: 'production-promoted-awaiting-browser-export-and-unity-review',
  topology: 'existing-authored-12-piece-47-blob-wall-grammar',
  familyCount: QUIET_WALL_FAMILIES.length,
  familyIds: QUIET_WALL_FAMILIES.map(({ id }) => id),
  retiredFromNewBuildVocabulary: [
    'glass-partition',
    'curtain-wall',
    'demising-wall',
    'living-wall',
    'branded-wall',
  ],
  sharedChanges: [
    'narrower-common-outline',
    'material-owned-cap-front-return-and-corner-faces',
    'plain-unmasked-cap-surface',
    'no-interior-crease-strokes',
    'no-room-side-or-inside-semantics',
    'low-frequency-material-cues',
  ],
  candidateArtLocalToPreview: false,
  canonicalSvgMutation: false,
  productionTemplateMutation: true,
  compositorMutation: true,
  exporterMutation: true,
  schemaMutation: false,
  unityMutation: false,
  browserExport: false,
  unityImport: false,
  staging: false,
  commit: false,
} as const;

function familySpec(id: QuietWallFamilyId): FamilySpec {
  const family = QUIET_WALL_FAMILIES.find((candidate) => candidate.id === id);
  if (!family) throw new Error(`Unknown quiet wall family ${id}`);
  return family;
}

function productionWall(id: QuietWallFamilyId): TileInstance {
  const wall = CORE_WALLS.find(({ templateId }) => templateId === id);
  if (!wall) throw new Error(`Missing shipped wall family ${id}`);
  return wall;
}

function proposedWall(id: QuietWallFamilyId): TileInstance {
  const source = productionWall(id);
  return { ...source, palette: { ...familySpec(id).palette } };
}

function templateShapes(id: QuietWallFamilyId, neighbors: number): readonly ShapeSpec[] {
  const wall = productionWall(id);
  const template = WALL_TEMPLATES.find(({ id: templateId }) => templateId === id);
  if (!template) throw new Error(`Missing wall template ${id}`);
  return template.build(neighbors, wall.params, wall.palette);
}

export function proposedWallShapes(id: QuietWallFamilyId, neighbors: number): readonly ShapeSpec[] {
  return templateShapes(id, neighbors);
}

function baselineWallSvg(id: QuietWallFamilyId, neighbors: number): string {
  return composeWallTile(productionWall(id), DEFAULT_STYLE, neighbors, 128);
}

export function proposedWallSvg(id: QuietWallFamilyId, neighbors: number): string {
  return composeWallTile(proposedWall(id), DEFAULT_STYLE, neighbors, 128);
}

function escapeText(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function text(
  x: number,
  y: number,
  value: string,
  size = 15,
  weight = 600,
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
  max = 45,
  size = 11,
  leading = 16,
  fill = MUTED,
): string {
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
  return lines.map((lineText, index) => text(x, y + index * leading, lineText, size, 580, fill)).join('');
}

function page(width: number, height: number, content: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${PAGE}"/>${content}</svg>`;
}

function panel(x: number, y: number, width: number, height: number, fill = PANEL): string {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="10" ` +
    `fill="${fill}" stroke="${RULE}" stroke-width="1.4"/>`;
}

function inner(svg: string): string {
  return svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

function placedSvg(source: string, x: number, y: number, size: number): string {
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 128 128">${inner(source)}</svg>`;
}

function key(column: number, row: number): string {
  return `${column},${row}`;
}

function neighborsFor(cells: ReadonlySet<string>, column: number, row: number): number {
  const at = (x: number, y: number) => cells.has(key(x, y));
  return (
    (at(column, row - 1) ? NB.N : 0) |
    (at(column + 1, row) ? NB.E : 0) |
    (at(column, row + 1) ? NB.S : 0) |
    (at(column - 1, row) ? NB.W : 0) |
    (at(column + 1, row - 1) ? NB.NE : 0) |
    (at(column + 1, row + 1) ? NB.SE : 0) |
    (at(column - 1, row + 1) ? NB.SW : 0) |
    (at(column - 1, row - 1) ? NB.NW : 0)
  );
}

function wallSvg(id: QuietWallFamilyId, state: ReviewState, neighbors: number): string {
  return state === 'existing-material' ? baselineWallSvg(id, neighbors) : proposedWallSvg(id, neighbors);
}

function wallCell(
  id: QuietWallFamilyId,
  state: ReviewState,
  neighbors: number,
  x: number,
  y: number,
  cell: number,
): string {
  return placedSvg(wallSvg(id, state, neighbors), x, y, cell);
}

function materialRoom(id: QuietWallFamilyId, state: ReviewState, x: number, y: number, cell: number): string {
  const columns = 5;
  const rows = 4;
  const cells = new Set<string>();
  for (let column = 0; column < columns; column += 1) {
    cells.add(key(column, 0));
    cells.add(key(column, rows - 1));
  }
  for (let row = 0; row < rows; row += 1) {
    cells.add(key(0, row));
    cells.add(key(columns - 1, row));
  }
  cells.delete(key(3, rows - 1));
  const parts = [
    `<rect x="${x}" y="${y}" width="${columns * cell}" height="${rows * cell}" fill="${OUTSIDE}"/>`,
    `<rect x="${x + cell}" y="${y + cell}" width="${(columns - 2) * cell}" height="${(rows - 2) * cell}" fill="${FLOOR}"/>`,
  ];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      if (!cells.has(key(column, row))) continue;
      parts.push(wallCell(id, state, neighborsFor(cells, column, row), x + column * cell, y + row * cell, cell));
    }
  }
  return parts.join('');
}

function materialTopologyStrip(id: QuietWallFamilyId, x: number, y: number): string {
  const cell = 72;
  const gap = 18;
  const masks = [0, NB.N | NB.E, NB.N | NB.E | NB.S] as const;
  return masks.map((neighbors, index) => {
    const px = x + index * (cell + gap);
    return `<rect x="${px}" y="${y}" width="${cell}" height="${cell}" rx="3" fill="${OUTSIDE}"/>` +
      wallCell(id, 'quiet-family', neighbors, px, y, cell);
  }).join('');
}

export function renderQuietWallFamilyComparisonSvg(): string {
  const width = 1880;
  const height = 744;
  const cardWidth = 352;
  const cardHeight = 620;
  const parts: string[] = [
    text(28, 42, 'QUIET WALL SYSTEM · FIVE-WALL CORE SET', 25, 860),
    text(28, 69, 'Office · Brick · Panel · Cubicle · Wood Slat · plain caps with material-built faces', 13, 640, MUTED),
    text(width - 28, 42, 'PRODUCTION SOURCE · EXPORT NOT YET RUN', 11, 840, PROPOSED, 'end'),
  ];
  QUIET_WALL_FAMILIES.forEach((family, index) => {
    const column = index % 5;
    const x = 24 + column * 368;
    const y = 94;
    parts.push(
      panel(x, y, cardWidth, cardHeight, PANEL),
      text(x + 18, y + 29, family.label.toUpperCase(), 14, 830),
      text(x + 18, y + 49, family.role, 10, 600, MUTED),
      text(x + 18, y + 76, 'PRODUCTION ROOM READ', 9, 800, PROPOSED),
      materialRoom(family.id, 'existing-material', x + 56, y + 86, 48),
      text(x + 18, y + 306, 'SAME PRODUCTION · FACE DETAIL CHECK', 9, 800, PROPOSED),
      materialTopologyStrip(family.id, x + 48, y + 340),
      wrappedText(x + 18, y + 544, family.refinement, 49, 11, 16, INK),
    );
  });
  return page(width, height, parts.join(''));
}

function mixedWallMap(): Map<string, QuietWallFamilyId> {
  const columns = 15;
  const rows = 9;
  const cells = new Map<string, QuietWallFamilyId>();
  for (let column = 0; column < columns; column += 1) {
    cells.set(key(column, 0), 'office-wall');
    cells.set(key(column, rows - 1), column >= 5 && column <= 8 ? 'slat-wall' : 'office-wall');
  }
  for (let row = 0; row < rows; row += 1) {
    cells.set(key(0, row), row >= 2 && row <= 5 ? 'brick-wall' : 'office-wall');
    cells.set(key(columns - 1, row), 'office-wall');
  }
  for (let row = 1; row < rows - 1; row += 1) {
    if (row !== 4) cells.set(key(4, row), 'panel-wall');
    if (row !== 5) cells.set(key(9, row), 'brick-wall');
  }
  for (let column = 5; column < 9; column += 1) cells.set(key(column, 4), 'panel-wall');
  for (let column = 1; column < 4; column += 1) cells.set(key(column, 6), 'cubicle-partition');
  cells.set(key(3, 7), 'cubicle-partition');
  return cells;
}

function mixedPlan(state: ReviewState, x: number, y: number, cell: number): string {
  const columns = 15;
  const rows = 9;
  const walls = mixedWallMap();
  const occupied = new Set(walls.keys());
  const parts = [
    `<rect x="${x}" y="${y}" width="${columns * cell}" height="${rows * cell}" fill="${OUTSIDE}"/>`,
    `<rect x="${x + cell}" y="${y + cell}" width="${(columns - 2) * cell}" height="${(rows - 2) * cell}" fill="${FLOOR}"/>`,
  ];
  for (let column = 2; column < columns - 1; column += 2) {
    parts.push(`<path d="M ${x + column * cell} ${y + cell} V ${y + (rows - 1) * cell}" stroke="${FLOOR_LINE}" opacity=".1"/>`);
  }
  for (const [location, familyId] of walls) {
    const [column, row] = location.split(',').map(Number);
    parts.push(wallCell(
      familyId,
      state,
      neighborsFor(occupied, column, row),
      x + column * cell,
      y + row * cell,
      cell,
    ));
  }
  const labelSize = Math.max(6, cell * 0.16);
  const planLabels = [
    [2.3, 2.6, 'RECORDS'], [6.8, 2.6, 'OFFICE'], [11.7, 3.1, 'RECEPTION'],
    [2.4, 7.35, 'WORK BAY'], [6.8, 6.3, 'MEETING'], [11.8, 6.5, 'SERVICE'],
  ] as const;
  for (const [column, row, label] of planLabels) {
    parts.push(text(x + column * cell, y + row * cell, label, labelSize, 760, '#514033', 'middle'));
  }
  return parts.join('');
}

function legend(x: number, y: number, columns = 5): string {
  return QUIET_WALL_FAMILIES.map((family, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const px = x + column * 285;
    const py = y + row * 30;
    return `<rect x="${px}" y="${py - 12}" width="18" height="18" rx="2" fill="${family.palette.primary}" stroke="${CONTOUR}"/>` +
      text(px + 27, py + 2, family.label, 11, 650, MUTED);
  }).join('');
}

export function renderQuietWallFamilyGameplaySvg(): string {
  const width = 1620;
  const height = 1160;
  const parts = [
    text(28, 42, 'QUIET WALL SYSTEM · MIXED BRANCH GAMEPLAY READ', 25, 860),
    text(28, 69, 'Only the five core walls in one plan · cap/face construction · no semantic inside-facing', 13, 640, MUTED),
    text(width - 28, 42, 'PRODUCTION SOURCE · UNITY PENDING', 11, 840, PROPOSED, 'end'),
    panel(24, 94, 772, 512),
    panel(824, 94, 772, 512, PANEL_ALT),
    text(42, 121, 'PRODUCTION FAMILY READ · 48 PX / CELL', 10, 820, PROPOSED),
    text(842, 121, 'PRODUCTION TOPOLOGY READ · 48 PX / CELL', 10, 820, PROPOSED),
    mixedPlan('existing-material', 50, 144, 48),
    mixedPlan('quiet-family', 850, 144, 48),
    panel(24, 630, 772, 330),
    panel(824, 630, 772, 330, PANEL_ALT),
    text(42, 657, 'PRODUCTION FAMILY READ · 30 PX / CELL', 10, 820, PROPOSED),
    text(842, 657, 'PRODUCTION TOPOLOGY READ · 30 PX / CELL', 10, 820, PROPOSED),
    mixedPlan('existing-material', 178, 684, 30),
    mixedPlan('quiet-family', 978, 684, 30),
    text(28, 1002, 'PRODUCTION MATERIAL KEY', 10, 820, PROPOSED),
    legend(28, 1026),
    text(width - 28, 1126, 'WALLS ORGANIZE SPACE · OBJECTS AND FIXTURES CARRY QUOTACO PRODUCT DESIGN', 10, 820, MUTED, 'end'),
  ];
  return page(width, height, parts.join(''));
}

const TOPOLOGY_CASES = [
  { label: 'ISOLATED', neighbors: 0 },
  { label: 'END', neighbors: NB.N },
  { label: 'CORNER', neighbors: NB.N | NB.E },
  { label: 'T', neighbors: NB.N | NB.E | NB.S },
  { label: 'CROSS', neighbors: NB.N | NB.E | NB.S | NB.W },
] as const;

function topologyFamily(family: FamilySpec, x: number, y: number): string {
  const cell = 64;
  const gap = 8;
  const parts = [text(x, y + 28, family.label, 12, 780)];
  TOPOLOGY_CASES.forEach(({ neighbors }, index) => {
    const px = x + 156 + index * (cell + gap);
    parts.push(
      `<rect x="${px}" y="${y}" width="${cell}" height="${cell}" rx="3" fill="${OUTSIDE}"/>`,
      wallCell(family.id, 'quiet-family', neighbors, px, y, cell),
    );
  });
  return parts.join('');
}

export function renderQuietWallFamilyTopologySvg(): string {
  const width = 800;
  const height = 690;
  const parts: string[] = [
    text(28, 42, 'QUIET WALL SYSTEM · FIVE-WALL TOPOLOGY CHECK', 21, 860),
    text(28, 69, 'Plain cap + material fronts/returns/corners · all 47 masks rendered in the automated review gate', 13, 640, MUTED),
    text(width - 28, 42, 'NO ROOM-SIDE INPUT', 11, 840, PROPOSED, 'end'),
  ];
  for (let index = 0; index < 5; index += 1) {
    const x = 28 + 156 + index * 72 + 32;
    parts.push(text(x, 102, TOPOLOGY_CASES[index].label, 9, 780, MUTED, 'middle'));
  }
  QUIET_WALL_FAMILIES.forEach((family, index) => {
    parts.push(topologyFamily(family, 28, 126 + index * 102));
  });
  parts.push(
    text(28, 658, 'UNFINISHED GATE · browser ZIP export, fresh Unity import, and composed Play Mode review remain separate', 11, 800, REVIEW_RED),
  );
  return page(width, height, parts.join(''));
}

export async function renderQuietWallFamilyPreview(output: string): Promise<readonly string[]> {
  await mkdir(output, { recursive: true });
  const pages = [
    ['01-all-materials-current-proposed', renderQuietWallFamilyComparisonSvg()],
    ['02-mixed-branch-gameplay-scale', renderQuietWallFamilyGameplaySvg()],
    ['03-material-topology-stress', renderQuietWallFamilyTopologySvg()],
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
    ...QUIET_WALL_FAMILY_REVIEW,
    families: QUIET_WALL_FAMILIES,
  }, null, 2)}\n`, 'utf8');
  files.push(metricsPath);
  const readmePath = path.join(output, 'README.md');
  await writeFile(readmePath, [
    '# Quiet Wall Family Production Validation',
    '',
    'Status: **production source promoted; browser export and Unity review pending**',
    '',
    'This promotes the face-owned wall system around the five materials that still add useful',
    'build vocabulary:',
    '',
    '- Office, Brick, Panel, Cubicle, and Wood Slat are the new-project core set.',
    '- Glass, Curtain, Demising, Living, and Branded are retired from new-build selection and generation.',
    '- Their templates and ids remain readable for legacy projects; old projects are not destructively rewritten.',
    '- The existing authored 12-piece / 47-blob topology is unchanged.',
    '- The cap stays plain; front faces, returns, and corners are constructed from the material palette.',
    '- Mortar, panel joints, cubicle reveals, and slat cuts appear only on their visible wall faces.',
    '- Ordinary walls receive no repeating QuotaCo bands or product-like decoration.',
    '- No core wall requires a room-side or semantic “inside” input.',
    '',
    'The cubicle entry here reviews only its material treatment. Partition height and footprint remain',
    'a separate composed-gameplay gate because they are not ordinary full-height wall concerns.',
    '',
    'The sheets render the normal production templates through the production compositor.',
    'The source promotion changes no Unity content directly and does not run the browser ZIP export,',
    'fresh Unity import, staging, or commit.',
    '',
    'The unfinished gates are browser export, fresh Unity import, and composed Play Mode review.',
    '',
  ].join('\n'), 'utf8');
  files.push(readmePath);
  return files;
}

function outputPath(argv: readonly string[]): string {
  const index = argv.indexOf('--out');
  return index >= 0 && argv[index + 1]
    ? path.resolve(argv[index + 1])
    : path.resolve('docs/previews/quiet-wall-core-set-v4');
}

const isMain = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;

if (isMain) {
  const output = outputPath(process.argv.slice(2));
  const files = await renderQuietWallFamilyPreview(output);
  process.stdout.write(`Wrote ${files.length} quiet wall-family review files to ${output}\n`);
}
