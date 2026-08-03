/**
 * Review-only cafeteria facility context gate.
 *
 * Renders the nine current production sprites at authoring, normal gameplay,
 * and far gameplay scales before any canonical SVG source is extracted.
 * This file deliberately does not import or mutate the prop source compiler.
 *
 *   npm run cafeteria-facilities:context:preview
 *   npm run cafeteria-facilities:context:preview -- --out docs/previews/canonical-cafeteria-facility-context-v1
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import {
  composeCharacter,
  composeProp,
  composeWallTile,
} from '../src/core/compositor';
import {
  DEFAULT_CAST,
  DEFAULT_STYLE,
  KITCHEN_STAFF,
  defaultProject,
} from '../src/data/defaults';
import type {
  CharacterRecipe,
  Facing,
  PropInstance,
  PropTemplate,
  StyleSheet,
  TileInstance,
} from '../src/core/types';
import { PROP_TEMPLATES } from '../src/props/templates';
import { BLOB_CONFIGS } from '../src/tiles/blob';

const AUTHORING_CANVAS = 128;
const NORMAL_CELL = 90;
const FAR_CELL = 40;
const CHARACTER_FRAME_CELLS = 1.55 * 0.65;

const PAGE = '#E7E1D2';
const PANEL = '#F6F1E6';
const PANEL_ALT = '#ECE5D7';
const INK = '#292C2A';
const MUTED = '#626861';
const RULE = '#A39B8B';
const GREEN = '#355247';
const CORAL = '#B65F4D';
const BLUE = '#294565';
const FLOOR = '#7B8890';
const FLOOR_LINE = '#D9D4C7';
const OCCUPANCY = '#D7CFAF';

export const CAFETERIA_FACILITY_IDS = [
  'serving-line',
  'service-scanner',
  'commercial-range',
  'prep-table',
  'dish-return',
  'walk-in-front',
  'dining-carrel',
  'cafeteria-table',
  'tray-stack',
] as const;

type CafeteriaFacilityId = (typeof CAFETERIA_FACILITY_IDS)[number];

const PROTECTED_SURFACES = [
  'CONTRACT.md',
  'src/core/exporter.ts',
  'src/core/layout.ts',
  'src/core/types.ts',
  'src/data/defaults.ts',
  'src/props/templates.ts',
  'src/props/generated/quotaCoWorkhorseArt.ts',
] as const;

const escapeText = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

function label(
  x: number,
  y: number,
  value: string,
  size = 16,
  weight = 600,
  color = INK,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return (
    `<text x="${x}" y="${y}" ` +
    'font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" ' +
    `font-size="${size}" font-weight="${weight}" fill="${color}" ` +
    `text-anchor="${anchor}">${escapeText(value)}</text>`
  );
}

function wrappedLabel(
  x: number,
  y: number,
  value: string,
  maxCharacters: number,
  lineHeight: number,
  size = 15,
  weight = 600,
  color = INK,
): string {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharacters && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines
    .map((line, index) => label(x, y + index * lineHeight, line, size, weight, color))
    .join('');
}

function panel(
  x: number,
  y: number,
  width: number,
  height: number,
  fill = PANEL,
  stroke = RULE,
  radius = 14,
): string {
  return (
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" ` +
    `rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`
  );
}

function line(d: string, stroke = RULE, width = 1, opacity = 1): string {
  return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" opacity="${opacity}"/>`;
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

function stripSvgShell(source: string): string {
  return source
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
}

class CurrentCafeteriaRenderer {
  readonly style: StyleSheet;
  readonly wall: TileInstance;
  readonly instances: readonly PropInstance[];
  private readonly propCache = new Map<string, string>();
  private readonly characterCache = new Map<string, string>();
  private readonly wallCache = new Map<string, string>();

  constructor() {
    const project = defaultProject();
    const wall = project.walls.find(({ id }) => id === 'wall-office');
    if (!wall) throw new Error('Default project is missing wall-office');
    this.wall = wall;
    this.instances = project.props;
    this.style = {
      ...structuredClone(DEFAULT_STYLE),
      render: { ...DEFAULT_STYLE.render, contactShadow: 0.12 },
    };
  }

  template(id: string): PropTemplate {
    const template = PROP_TEMPLATES.find(({ id: templateId }) => templateId === id);
    if (!template) throw new Error(`Missing prop template ${id}`);
    return template;
  }

  prop(id: string): string {
    let source = this.propCache.get(id);
    if (source) return source;
    const instance = this.instances.find(({ templateId }) => templateId === id);
    if (!instance) throw new Error(`Default project is missing prop ${id}`);
    source = composeProp(instance, this.style, AUTHORING_CANVAS);
    this.propCache.set(id, source);
    return source;
  }

  character(recipe: CharacterRecipe, facing: Facing): string {
    const key = `${recipe.id}:${facing}`;
    let source = this.characterCache.get(key);
    if (source) return source;
    source = composeCharacter(
      recipe,
      this.style,
      facing,
      AUTHORING_CANVAS,
      'normal',
      { badge: false, pose: 'neutral' },
    );
    this.characterCache.set(key, source);
    return source;
  }

  wallTile(maskIndex: number, x: number, y: number, size: number): string {
    const key = String(maskIndex);
    let markup = this.wallCache.get(key);
    if (!markup) {
      markup = stripSvgShell(
        composeWallTile(
          this.wall,
          this.style,
          BLOB_CONFIGS[maskIndex],
          AUTHORING_CANVAS,
        ),
      );
      this.wallCache.set(key, markup);
    }
    return (
      `<svg x="${x}" y="${y}" width="${size}" height="${size}" ` +
      'viewBox="0 0 128 128" preserveAspectRatio="none" overflow="hidden">' +
      markup +
      '</svg>'
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
    parts.push(line(`M ${x + column * cell} ${y} V ${y + rows * cell}`, FLOOR_LINE, 1, 0.16));
  }
  for (let row = 1; row < rows; row += 1) {
    parts.push(line(`M ${x} ${y + row * cell} H ${x + columns * cell}`, FLOOR_LINE, 1, 0.16));
  }
}

function drawBackWall(
  parts: string[],
  renderer: CurrentCafeteriaRenderer,
  x: number,
  y: number,
  columns: number,
  cell: number,
): void {
  parts.push(renderer.wallTile(6, x, y, cell));
  for (let column = 1; column < columns - 1; column += 1) {
    parts.push(renderer.wallTile(10, x + column * cell, y, cell));
  }
  parts.push(renderer.wallTile(12, x + (columns - 1) * cell, y, cell));
}

function occupancyGuide(
  template: PropTemplate,
  x: number,
  y: number,
  cell: number,
): string {
  return (
    `<rect x="${x + 3}" y="${y + 3}" ` +
    `width="${template.gridFootprint.w * cell - 6}" ` +
    `height="${template.gridFootprint.h * cell - 6}" rx="5" ` +
    `fill="${OCCUPANCY}" fill-opacity=".08" stroke="${OCCUPANCY}" ` +
    'stroke-width="1.5" stroke-dasharray="6 5"/>'
  );
}

function propAt(
  renderer: CurrentCafeteriaRenderer,
  id: string,
  footprintX: number,
  footprintY: number,
  cell: number,
  guide = true,
): string {
  const template = renderer.template(id);
  const footprintWidth = template.gridFootprint.w * cell;
  const footprintHeight = template.gridFootprint.h * cell;
  const x = footprintX + (footprintWidth - cell) / 2;
  const y = template.projection === 'plan'
    ? footprintY + (footprintHeight - cell) / 2
    : footprintY + footprintHeight - cell * (116 / AUTHORING_CANVAS);
  return (
    (guide ? occupancyGuide(template, footprintX, footprintY, cell) : '') +
    placedSvg(renderer.prop(id), x, y, cell)
  );
}

function characterAt(
  renderer: CurrentCafeteriaRenderer,
  recipe: CharacterRecipe,
  facing: Facing,
  roomX: number,
  roomY: number,
  cell: number,
  column: number,
  row: number,
): string {
  const frame = cell * CHARACTER_FRAME_CELLS;
  const anchorX = roomX + column * cell;
  const anchorY = roomY + row * cell;
  return placedSvg(
    renderer.character(recipe, facing),
    anchorX - frame / 2,
    anchorY - frame * 0.86,
    frame,
  );
}

function inventorySheet(renderer: CurrentCafeteriaRenderer): string {
  const width = 3000;
  const height = 1660;
  const margin = 34;
  const gap = 18;
  const cardWidth = (width - margin * 2 - gap * 2) / 3;
  const cardHeight = 485;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${PAGE}"/>`,
    label(margin, 52, 'CAFETERIA FACILITIES · CURRENT PIXEL INVENTORY', 28, 880, GREEN),
    label(margin, 82, 'REVIEW-ONLY GATE · NO SVG SOURCE EXTRACTION · NO PRODUCTION WIRING', 12, 780, CORAL),
    wrappedLabel(
      margin,
      112,
      'Each card shows the real composed production sprite at 220 px, then at the literal 90 px/cell normal scale and 40 px/cell far scale. Dashed boxes are the unchanged gameplay footprints.',
      190,
      21,
      14,
      620,
      MUTED,
    ),
  ];

  CAFETERIA_FACILITY_IDS.forEach((id, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const x = margin + column * (cardWidth + gap);
    const y = 160 + row * (cardHeight + gap);
    const template = renderer.template(id);
    const normalX = x + 300;
    const normalY = y + 126;
    const farX = x + 736;
    const farY = y + 154;
    parts.push(
      panel(x, y, cardWidth, cardHeight, row % 2 === 0 ? PANEL : PANEL_ALT),
      label(x + 24, y + 38, template.label, 20, 850, GREEN),
      label(x + 24, y + 62, id, 11, 720, BLUE),
      label(
        x + cardWidth - 24,
        y + 38,
        `${template.projection.toUpperCase()} · ${template.gridFootprint.w}×${template.gridFootprint.h} CELLS`,
        11,
        800,
        CORAL,
        'end',
      ),
      panel(x + 24, y + 88, 240, 292, '#FFFFFF55', '#C8C0AF', 10),
      label(x + 144, y + 112, 'AUTHORING CLOSE-UP · 220 px', 10, 760, MUTED, 'middle'),
      placedSvg(renderer.prop(id), x + 34, y + 128, 220),
      label(normalX, y + 108, 'NORMAL · 90 px/CELL', 10, 780, MUTED),
      occupancyGuide(template, normalX, normalY, NORMAL_CELL),
      propAt(renderer, id, normalX, normalY, NORMAL_CELL, false),
      label(farX, y + 108, 'FAR · 40 px/CELL', 10, 780, MUTED),
      occupancyGuide(template, farX, farY, FAR_CELL),
      propAt(renderer, id, farX, farY, FAR_CELL, false),
      line(`M ${x + 285} ${y + 88} V ${y + cardHeight - 26}`, '#C8C0AF', 1),
      label(x + 300, y + cardHeight - 60, 'CURRENT AUTHORITY', 10, 820, CORAL),
      label(x + 300, y + cardHeight - 38, 'Handwritten ShapeSpec builder · params: none', 12, 620, MUTED),
    );
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

interface RoomPropPlacement {
  readonly id: CafeteriaFacilityId;
  readonly column: number;
  readonly row: number;
}

const ROOM_PROPS: readonly RoomPropPlacement[] = [
  { id: 'serving-line', column: 1, row: 1 },
  { id: 'service-scanner', column: 5, row: 1 },
  { id: 'commercial-range', column: 6, row: 1 },
  { id: 'prep-table', column: 8, row: 1 },
  { id: 'dish-return', column: 10, row: 1 },
  { id: 'walk-in-front', column: 12, row: 1 },
  { id: 'tray-stack', column: 14, row: 1 },
  { id: 'dining-carrel', column: 12, row: 4 },
  { id: 'cafeteria-table', column: 2, row: 4 },
];

function roomScene(
  renderer: CurrentCafeteriaRenderer,
  x: number,
  y: number,
  cell: number,
): string {
  const parts: string[] = [];
  const columns = 16;
  const rows = 8;
  drawGrid(parts, x, y, columns, rows, cell);
  drawBackWall(parts, renderer, x, y, columns, cell);

  for (const placement of ROOM_PROPS) {
    const template = renderer.template(placement.id);
    parts.push(occupancyGuide(
      template,
      x + placement.column * cell,
      y + placement.row * cell,
      cell,
    ));
  }

  for (const placement of ROOM_PROPS) {
    parts.push(propAt(
      renderer,
      placement.id,
      x + placement.column * cell,
      y + placement.row * cell,
      cell,
      false,
    ));
  }

  const kitchenWorker = KITCHEN_STAFF[0];
  parts.push(
    characterAt(renderer, kitchenWorker, 'north', x, y, cell, 3.0, 3.15),
    characterAt(renderer, kitchenWorker, 'north', x, y, cell, 7.0, 3.15),
    characterAt(renderer, kitchenWorker, 'south', x, y, cell, 10.0, 3.55),
    characterAt(renderer, DEFAULT_CAST[0], 'north', x, y, cell, 3.1, 6.45),
    characterAt(renderer, DEFAULT_CAST[1], 'south', x, y, cell, 5.2, 6.85),
    characterAt(renderer, DEFAULT_CAST[2], 'east', x, y, cell, 8.6, 5.5),
    characterAt(renderer, DEFAULT_CAST[3], 'north', x, y, cell, 12.5, 6.1),
  );
  return parts.join('');
}

function roomContextSheet(renderer: CurrentCafeteriaRenderer): string {
  const width = 3000;
  const height = 1840;
  const margin = 34;
  const normalX = 62;
  const normalY = 190;
  const farX = 1642;
  const farY = 190;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${PAGE}"/>`,
    label(margin, 52, 'CAFETERIA FACILITIES · LITERAL ROOM CONTEXT', 28, 880, GREEN),
    label(margin, 82, 'CURRENT PRODUCTION PIXELS · ACCEPTED CHEF-WHITE + STEEL STAFF FOR SCALE ONLY', 12, 780, CORAL),
    wrappedLabel(
      margin,
      112,
      'The room is deliberately schematic: real office walls, grid, real footprints, real current sprites, and static people for scale. This is not a Unity behavior proof and does not claim cafeteria staff can be surfaced in game yet.',
      190,
      21,
      14,
      620,
      MUTED,
    ),
    panel(34, 150, 1500, 800, PANEL),
    label(62, 180, 'NORMAL GAMEPLAY SCALE · 90 px/CELL', 12, 800, BLUE),
    roomScene(renderer, normalX, normalY, NORMAL_CELL),
    panel(1580, 150, 1386, 800, PANEL_ALT),
    label(farX, 180, 'FAR GAMEPLAY SCALE · 40 px/CELL', 12, 800, BLUE),
    roomScene(renderer, farX, farY, FAR_CELL),
  ];

  const legendX = 1642;
  const legendY = 580;
  parts.push(
    label(legendX, legendY, 'ROOM INVENTORY', 14, 850, GREEN),
    label(legendX, legendY + 32, 'BACK SERVICE WALL', 10, 800, CORAL),
    wrappedLabel(
      legendX,
      legendY + 56,
      'Serving line · attendance scanner · commercial range · prep table · dish return · walk-in cooler · tray stack',
      80,
      20,
      13,
      650,
      INK,
    ),
    label(legendX, legendY + 126, 'DINING FLOOR', 10, 800, CORAL),
    wrappedLabel(
      legendX,
      legendY + 150,
      'Communal table · solitary dining carrel · workers and office cast are static scale references',
      80,
      20,
      13,
      650,
      INK,
    ),
    label(legendX, legendY + 220, 'DASHED BOXES', 10, 800, CORAL),
    wrappedLabel(
      legendX,
      legendY + 244,
      'Existing gameplay footprints. Multi-cell props retain one 128×128 sprite centered or baseline-aligned inside that footprint.',
      80,
      20,
      13,
      650,
      INK,
    ),
  );

  const gateY = 990;
  const columnWidth = 932;
  const gateCards = [
    {
      title: '1 · FUNCTIONAL READ',
      body: 'Do the service line, scanner, range, prep surface, dish return, cooler, carrel, communal table, and tray stack each read without labels at normal scale?',
    },
    {
      title: '2 · FAMILY + PROJECTION',
      body: 'Do the steel food-service pieces feel related, while the plan-projected dining pieces remain coherent beside elevation-projected kitchen equipment?',
    },
    {
      title: '3 · EXTRACTION DECISION',
      body: 'Approval means these exact current pixels become canonical SVG extraction targets. Corrections happen before sources or production wiring are touched.',
    },
  ];
  gateCards.forEach((card, index) => {
    const x = margin + index * (columnWidth + 18);
    parts.push(
      panel(x, gateY, columnWidth, 270, index === 2 ? '#DCE9DD' : PANEL),
      label(x + 26, gateY + 44, card.title, 16, 860, index === 2 ? GREEN : BLUE),
      wrappedLabel(x + 26, gateY + 82, card.body, 80, 24, 14, 650, INK),
    );
  });

  parts.push(
    panel(margin, 1290, width - margin * 2, 500, '#F0DDD6'),
    label(margin + 28, 1334, 'HARD GATE', 18, 880, CORAL),
    wrappedLabel(
      margin + 28,
      1374,
      'Nothing in this review creates assets/props SVGs, changes src/props/templates.ts, runs the prop importer, alters defaults or export contracts, exports a browser bundle, or touches Unity. The next step only begins after an explicit visual approval or a concrete correction list.',
      190,
      24,
      14,
      680,
      INK,
    ),
    line(`M ${margin + 28} 1495 H ${width - margin - 28}`, '#C78576', 1.5),
    label(margin + 28, 1538, 'SOURCE OWNERSHIP AUDIT', 13, 850, BLUE),
    wrappedLabel(
      margin + 28,
      1572,
      'All nine are genuine code-owned gaps today: handwritten ShapeSpec builders with zero parameters and no entries in the QuotaCo Workhorse generated art module. That makes one static canonical SVG per facility the likely later source shape, pending this visual call.',
      190,
      23,
      13,
      640,
      MUTED,
    ),
    label(margin + 28, 1710, 'REVIEW QUESTION', 13, 850, CORAL),
    label(margin + 28, 1742, 'Approve these current pixels as the nine extraction targets, or name the facilities that need redesign first.', 17, 760, INK),
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

async function protectedSurfaceHashes(): Promise<Record<string, string>> {
  return Object.fromEntries(await Promise.all(PROTECTED_SURFACES.map(async (file) => {
    const content = await readFile(path.resolve(file));
    return [file, createHash('sha256').update(content).digest('hex')];
  })));
}

function reviewMarkdown(): string {
  return `# Canonical cafeteria facility context review v1

Status: **review only; stopped before source extraction**

This gate renders the nine current production sprites at their 128 px authoring
canvas, literal 90 px/cell normal gameplay scale, and literal 40 px/cell far
gameplay scale. The room sheet adds real footprints, current office walls, the
accepted chef-white plus steel kitchen uniform, and existing office characters
as static scale references.

## Visual decision

1. Do all nine facilities read by function without their labels at normal scale?
2. Does the steel food-service family cohere across the mixed plan/elevation projections?
3. Are any silhouettes, proportions, or occupancy relationships wrong enough to redesign before extraction?
4. If approved, these exact current pixels become the targets for nine static canonical SVG sources.

Approval here does not authorize production wiring. Candidate sources and exact
source/import parity are a later review gate before the handwritten builders are
removed.
`;
}

interface CliOptions {
  readonly output: string;
}

function parseArgs(args: readonly string[]): CliOptions {
  let output = path.resolve('docs/previews/canonical-cafeteria-facility-context-v1');
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--out') {
      const value = args[++index];
      if (!value) throw new Error('--out requires a path');
      output = path.resolve(value);
      continue;
    }
    throw new Error(`Unknown argument ${argument}`);
  }
  return { output };
}

export async function renderCanonicalCafeteriaFacilityContextReview(
  output: string,
): Promise<{
  inventorySvgPath: string;
  inventoryPngPath: string;
  roomSvgPath: string;
  roomPngPath: string;
  metricsPath: string;
  readmePath: string;
}> {
  const renderer = new CurrentCafeteriaRenderer();
  const inventorySource = inventorySheet(renderer);
  const roomSource = roomContextSheet(renderer);
  const inventoryPng = new Resvg(inventorySource, { font: { loadSystemFonts: true } }).render().asPng();
  const roomPng = new Resvg(roomSource, { font: { loadSystemFonts: true } }).render().asPng();
  const metrics = {
    status: 'review-only-stopped-before-source-extraction',
    authority: 'handwritten ShapeSpec builders in src/props/templates.ts',
    authoringCanvas: AUTHORING_CANVAS,
    literalScales: { normalPixelsPerCell: NORMAL_CELL, farPixelsPerCell: FAR_CELL },
    facilities: Object.fromEntries(CAFETERIA_FACILITY_IDS.map((id) => {
      const template = renderer.template(id);
      return [id, {
        label: template.label,
        projection: template.projection,
        gridFootprint: template.gridFootprint,
        contactShadowFootprint: template.footprint ?? null,
        params: template.params,
        canonicalSvgSource: null,
      }];
    })),
    protectedSurfaceHashes: await protectedSurfaceHashes(),
    prohibitedInThisGate: [
      'canonical SVG source extraction',
      'prop importer changes or execution',
      'production template rewiring',
      'default project or export contract changes',
      'browser bundle export',
      'Unity import or Play Mode claims',
    ],
  };

  await mkdir(output, { recursive: true });
  const inventorySvgPath = path.join(output, '00-current-inventory-scale.svg');
  const inventoryPngPath = path.join(output, '00-current-inventory-scale.png');
  const roomSvgPath = path.join(output, '01-literal-room-context.svg');
  const roomPngPath = path.join(output, '01-literal-room-context.png');
  const metricsPath = path.join(output, 'metrics.json');
  const readmePath = path.join(output, 'README.md');
  await writeFile(inventorySvgPath, inventorySource, 'utf8');
  await writeFile(inventoryPngPath, inventoryPng);
  await writeFile(roomSvgPath, roomSource, 'utf8');
  await writeFile(roomPngPath, roomPng);
  await writeFile(metricsPath, `${JSON.stringify(metrics, null, 2)}\n`, 'utf8');
  await writeFile(readmePath, reviewMarkdown(), 'utf8');
  return {
    inventorySvgPath,
    inventoryPngPath,
    roomSvgPath,
    roomPngPath,
    metricsPath,
    readmePath,
  };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const result = await renderCanonicalCafeteriaFacilityContextReview(options.output);
  process.stdout.write(
    'Wrote review-only cafeteria facility context gate:\n' +
    `${result.inventorySvgPath}\n` +
    `${result.inventoryPngPath}\n` +
    `${result.roomSvgPath}\n` +
    `${result.roomPngPath}\n` +
    `${result.metricsPath}\n` +
    `${result.readmePath}\n`,
  );
}

if (process.argv[1]?.endsWith('canonicalCafeteriaFacilityContextReview.ts')) {
  main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
