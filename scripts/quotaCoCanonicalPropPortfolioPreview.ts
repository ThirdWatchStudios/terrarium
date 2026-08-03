/**
 * Consolidated visual-acceptance proof for the canonical QuotaCo interior
 * workhorse SVG bank.
 *
 * This sheet renders the genuine source SVG beside Terrarium's default
 * compositor output for every interior authored prop, then exercises representative
 * nouns in literal gameplay-scale rooms. Handheld remains character-relative;
 * the later eight-source exterior family remains visible as separately gated
 * context and is not counted in the interior proof.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';

import {
  propLayers,
} from '../src/core/compositor';
import {
  CURRENT_SCHEMA_VERSION,
  type CharacterRecipe,
  type Facing,
} from '../src/core/types';
import {
  DEFAULT_CAST,
  DEFAULT_STYLE,
  defaultProject,
} from '../src/data/defaults';
import { authoredPropArt } from '../src/props/authoredArt';
import type { Pose } from '../src/parts/poses';
import {
  PROP_REDESIGN_INVENTORY_GROUPS,
  PropCalibrationRenderer,
} from './quotaCoPropRedesignCalibrationPreview';
import {
  PROP_NATIVE_FRAME_CELLS,
} from './quotaCoWorkstationFamilyCalibrationPreview';
import {
  QUOTA_CO_EXTERIOR_WORKHORSE_PROP_IDS,
  QUOTA_CO_INTERIOR_WORKHORSE_PROP_IDS,
  type QuotaCoWorkhorsePropId,
} from './props/importer';

const WIDTH = 3560;
const HEIGHT = 2910;
const MARGIN = 34;
const GAP = 16;
const AUTHORING_CANVAS = 128;
const WALL_DATUM = 112;
const CHARACTER_VISUAL_SCALE = 0.65;
const LEGACY_CHARACTER_FRAME_CELLS = 1.55;
const CHARACTER_FRAME_CELLS =
  LEGACY_CHARACTER_FRAME_CELLS * CHARACTER_VISUAL_SCALE;
const NORMAL_CELL = 68;
const FAR_CELL = 40;
const INTERIOR_CANONICAL_COUNT = QUOTA_CO_INTERIOR_WORKHORSE_PROP_IDS.length;

const PAGE = '#E7E1D2';
const PANEL = '#F6F1E6';
const PANEL_ALT = '#ECE5D7';
const PANEL_GREEN = '#DCE9DD';
const INK = '#292C2A';
const MUTED = '#626861';
const RULE = '#A39B8B';
const FLOOR = '#7B8890';
const FLOOR_LINE = '#D9D4C7';
const OCCUPANCY = '#D7CFAF';
const GREEN = '#355647';
const CORAL = '#B65F4D';
const BLUE = '#294565';

const GROUP_ORDER = [
  'handheld-character-relative',
  'desk-work-surface',
  'furniture',
  'facilities-machines',
  'wall-mounted-decorative',
  'outdoor-construction',
] as const;

export interface CanonicalPortfolioGroup {
  readonly id: (typeof GROUP_ORDER)[number];
  readonly label: string;
  readonly note: string;
  readonly authoredIds: readonly QuotaCoWorkhorsePropId[];
  readonly carryoverIds: readonly string[];
}

const CARRYOVER_IDS: Readonly<Record<
  CanonicalPortfolioGroup['id'],
  readonly string[]
>> = {
  'handheld-character-relative': ['acc-clipboard'],
  'desk-work-surface': [],
  furniture: [],
  'facilities-machines': [],
  'wall-mounted-decorative': [],
  'outdoor-construction': QUOTA_CO_EXTERIOR_WORKHORSE_PROP_IDS,
};

const INTERIOR_AUTHORED_ID_SET = new Set<string>(
  QUOTA_CO_INTERIOR_WORKHORSE_PROP_IDS,
);

export const CANONICAL_PROP_PORTFOLIO_GROUPS:
readonly CanonicalPortfolioGroup[] = GROUP_ORDER.map((id) => {
  const inventory = PROP_REDESIGN_INVENTORY_GROUPS.find(
    (candidate) => candidate.id === id,
  );
  if (!inventory) throw new Error(`Missing inventory group ${id}`);
  return {
    id,
    label: inventory.label,
    note: inventory.note,
    authoredIds: inventory.propIds.filter(
      (propId): propId is QuotaCoWorkhorsePropId =>
        INTERIOR_AUTHORED_ID_SET.has(propId),
    ),
    carryoverIds: CARRYOVER_IDS[id],
  };
});

type SourceMap = ReadonlyMap<QuotaCoWorkhorsePropId, string>;

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function text(
  x: number,
  y: number,
  value: string,
  size: number,
  weight = 600,
  fill = INK,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return (
    `<text x="${x}" y="${y}" fill="${fill}" font-family="Inter,Arial,sans-serif" ` +
    `font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">` +
    `${esc(value)}</text>`
  );
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
    `fill="${fill}" stroke="${RULE}" stroke-width="1.4"/>`
  );
}

function line(d: string, stroke = RULE, width = 1, opacity = 1): string {
  return (
    `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" ` +
    `opacity="${opacity}"/>`
  );
}

function innerSvg(source: string): string {
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
  return (
    `<svg x="${x}" y="${y}" width="${width}" height="${height}" ` +
    `viewBox="0 0 128 128" overflow="visible">${innerSvg(source)}</svg>`
  );
}

function alphaStats(source: string, size: number): {
  readonly visiblePixels: number;
  readonly bounds: {
    readonly minX: number;
    readonly minY: number;
    readonly maxX: number;
    readonly maxY: number;
  } | null;
} {
  const png = PNG.sync.read(
    new Resvg(source, {
      fitTo: { mode: 'width', value: size },
      font: { loadSystemFonts: false },
    }).render().asPng(),
  );
  let visiblePixels = 0;
  let minX = png.width;
  let minY = png.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      if (png.data[(y * png.width + x) * 4 + 3] <= 12) continue;
      visiblePixels += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return {
    visiblePixels,
    bounds: visiblePixels > 0 ? { minX, minY, maxX, maxY } : null,
  };
}

function normalizedPixelDelta(leftSvg: string, rightSvg: string): number {
  const pixels = (source: string) =>
    new Resvg(source, {
      fitTo: { mode: 'width', value: AUTHORING_CANVAS },
      font: { loadSystemFonts: false },
    }).render().pixels;
  const left = pixels(leftSvg);
  const right = pixels(rightSvg);
  let delta = 0;
  for (let index = 0; index < left.length; index += 1) {
    delta += Math.abs(left[index] - right[index]);
  }
  return delta / (left.length * 255);
}

async function loadSources(): Promise<Map<QuotaCoWorkhorsePropId, string>> {
  return new Map(
    await Promise.all(
      QUOTA_CO_INTERIOR_WORKHORSE_PROP_IDS.map(async (id) => {
        const art = authoredPropArt(id);
        if (!art) throw new Error(`Missing imported art ${id}`);
        return [id, await readFile(art.sourceFile, 'utf8')] as const;
      }),
    ),
  );
}

function authoredGroupPanel(
  renderer: PropCalibrationRenderer,
  sources: SourceMap,
  group: CanonicalPortfolioGroup,
  x: number,
  y: number,
  width: number,
  height: number,
): string {
  const ids = group.authoredIds;
  const headerHeight = 62;
  const columnWidth = width / Math.max(1, ids.length);
  const artSize = Math.min(78, columnWidth * 0.36);
  const parts = [
    panel(x, y, width, height, PANEL),
    text(x + 18, y + 27, group.label.toUpperCase(), 13, 760, GREEN),
    text(
      x + width - 18,
      y + 27,
      `${ids.length} canonical SVG${ids.length === 1 ? '' : 's'}`,
      10,
      700,
      CORAL,
      'end',
    ),
    text(x + 18, y + 47, group.note, 9, 520, MUTED),
  ];
  ids.forEach((id, index) => {
    const source = sources.get(id);
    if (!source) throw new Error(`Missing canonical source ${id}`);
    const left = x + index * columnWidth;
    const center = left + columnWidth / 2;
    const label = renderer.template(id).label;
    const artY = y + headerHeight + 23;
    if (index > 0) {
      parts.push(line(`M ${left} ${y + headerHeight} V ${y + height - 16}`, RULE, 0.8, 0.55));
    }
    parts.push(
      text(center, y + headerHeight + 8, label.toUpperCase(), 8.5, 700, INK, 'middle'),
      placedSvg(source, center - artSize - 7, artY, artSize),
      placedSvg(renderer.prop('current', id), center + 7, artY, artSize),
      text(center - artSize / 2 - 7, artY + artSize + 13, 'SVG', 7.5, 600, MUTED, 'middle'),
      text(center + artSize / 2 + 7, artY + artSize + 13, 'OUT', 7.5, 700, CORAL, 'middle'),
      text(center, y + height - 18, id, 8, 580, BLUE, 'middle'),
    );
  });
  return parts.join('');
}

function withAccessories(
  recipe: CharacterRecipe,
  accessories: readonly string[],
  suffix: string,
): CharacterRecipe {
  return {
    ...recipe,
    id: `${recipe.id}-${suffix}`,
    parts: {
      ...recipe.parts,
      accessories: [...accessories],
    },
  };
}

interface AgentSpec {
  readonly recipe: CharacterRecipe;
  readonly facing: Facing | 'west';
  readonly pose?: Pose;
  readonly x: number;
  readonly y: number;
}

function agent(
  renderer: PropCalibrationRenderer,
  spec: AgentSpec,
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

function drawRoom(
  renderer: PropCalibrationRenderer,
  x: number,
  y: number,
  columns: number,
  rows: number,
  cell: number,
  placements: readonly {
    readonly id: string;
    readonly x: number;
    readonly y: number;
    readonly occupancy?: boolean;
  }[],
  agents: readonly AgentSpec[],
): string {
  const parts = [
    `<rect x="${x}" y="${y}" width="${columns * cell}" height="${rows * cell}" ` +
      `fill="${FLOOR}" stroke="#56616A" stroke-width="2"/>`,
  ];
  for (let column = 1; column < columns; column += 1) {
    parts.push(
      line(
        `M ${x + column * cell} ${y} V ${y + rows * cell}`,
        FLOOR_LINE,
        1,
        0.16,
      ),
    );
  }
  for (let row = 1; row < rows; row += 1) {
    parts.push(
      line(
        `M ${x} ${y + row * cell} H ${x + columns * cell}`,
        FLOOR_LINE,
        1,
        0.16,
      ),
    );
  }
  parts.push(renderer.wallTile(6, x, y, cell));
  for (let column = 1; column < columns - 1; column += 1) {
    parts.push(renderer.wallTile(10, x + column * cell, y, cell));
  }
  parts.push(renderer.wallTile(12, x + (columns - 1) * cell, y, cell));
  for (let row = 1; row < rows - 1; row += 1) {
    parts.push(
      renderer.wallTile(5, x, y + row * cell, cell),
      renderer.wallTile(5, x + (columns - 1) * cell, y + row * cell, cell, true),
    );
  }

  for (const placement of placements) {
    const template = renderer.template(placement.id);
    const footprintWidth = template.gridFootprint.w * cell;
    const footprintHeight = template.gridFootprint.h * cell;
    // Unity's 128px prop frame spans two gameplay cells. The first portfolio
    // draft accidentally rendered that frame as one cell, halving every prop
    // relative to the correctly scaled characters and room grid.
    const spriteSize = cell * PROP_NATIVE_FRAME_CELLS;
    const propX = x + placement.x * cell;
    const propY = y + placement.y * cell;
    const spriteX = propX + (footprintWidth - spriteSize) / 2;
    const spriteY = template.projection === 'plan'
      ? propY + (footprintHeight - spriteSize) / 2
      : propY + footprintHeight - spriteSize * (116 / AUTHORING_CANVAS);
    if (placement.occupancy !== false) {
      parts.push(
        `<rect x="${propX + 3}" y="${propY + 3}" width="${footprintWidth - 6}" ` +
        `height="${footprintHeight - 6}" rx="5" fill="${OCCUPANCY}" fill-opacity=".08" ` +
        `stroke="${OCCUPANCY}" stroke-width="1.3" stroke-dasharray="5 4"/>`,
      );
    }
    parts.push(
      placedSvg(renderer.prop('current', placement.id), spriteX, spriteY, spriteSize),
    );
  }
  for (const spec of agents) parts.push(agent(renderer, spec, x, y, cell));

  parts.push(renderer.wallTile(3, x, y + (rows - 1) * cell, cell));
  for (let column = 1; column < columns - 1; column += 1) {
    parts.push(renderer.wallTile(10, x + column * cell, y + (rows - 1) * cell, cell));
  }
  parts.push(renderer.wallTile(9, x + (columns - 1) * cell, y + (rows - 1) * cell, cell));
  return parts.join('');
}

const CLIPBOARD_EMPLOYEE = withAccessories(
  DEFAULT_CAST[0],
  ['acc-clipboard'],
  'canonical-portfolio',
);

function roomPanel(
  renderer: PropCalibrationRenderer,
  title: string,
  subtitle: string,
  x: number,
  y: number,
  width: number,
  placements: Parameters<typeof drawRoom>[6],
  agents: readonly AgentSpec[],
): string {
  const roomWidth = 9 * NORMAL_CELL;
  const roomX = x + (width - roomWidth) / 2;
  const roomY = y + 72;
  return [
    panel(x, y, width, 560, PANEL),
    text(x + 18, y + 28, title, 14, 760, GREEN),
    text(x + 18, y + 48, subtitle, 9.5, 540, MUTED),
    text(x + width - 18, y + 28, `${NORMAL_CELL} px / cell`, 9, 680, CORAL, 'end'),
    drawRoom(renderer, roomX, roomY, 9, 7, NORMAL_CELL, placements, agents),
    text(
      x + width - 18,
      y + 543,
      `characters ×0.65 · props native ${PROP_NATIVE_FRAME_CELLS}-cell frames · occupancy dashed`,
      8.5,
      560,
      MUTED,
      'end',
    ),
  ].join('');
}

function carryoverPanel(
  renderer: PropCalibrationRenderer,
  x: number,
  y: number,
  width: number,
): string {
  const character = renderer.character(
    CLIPBOARD_EMPLOYEE,
    'south',
    'neutral',
  );
  const propIds = ['car', 'lamp-post', 'bike-rack'];
  const columnWidth = (width - 430) / propIds.length;
  const parts = [
    panel(x, y, width, 220, PANEL_ALT),
    text(x + 18, y + 28, `SEPARATELY GATED CONTEXT · OUTSIDE THE INTERIOR ${INTERIOR_CANONICAL_COUNT}-SVG PROOF`, 13, 760, GREEN),
    text(
      x + 18,
      y + 49,
      'Handheld remains character-relative; exterior carriers are production SVGs validated in their dedicated proof.',
      9.5,
      540,
      MUTED,
    ),
    text(x + 40, y + 76, 'HANDHELD AND CHARACTER-RELATIVE ITEMS', 9, 700, GREEN),
    text(x + 430, y + 76, 'OUTDOOR AND CONSTRUCTION-SITE PROPS', 9, 700, GREEN),
    placedSvg(character, x + 40, y + 82, 104 * CHARACTER_FRAME_CELLS),
    text(x + 106, y + 202, 'clipboard · character ×0.65', 8.5, 640, BLUE, 'middle'),
    text(
      x + width - 18,
      y + 49,
      'not counted in this interior canonicalSvgCount',
      8,
      620,
      CORAL,
      'end',
    ),
  ];
  propIds.forEach((id, index) => {
    const center = x + 430 + columnWidth * (index + 0.5);
    parts.push(
      placedSvg(renderer.prop('current', id), center - 50, y + 84, 100),
      text(center, y + 202, renderer.template(id).label, 8.5, 640, BLUE, 'middle'),
    );
  });
  return parts.join('');
}

function farStressPanel(
  renderer: PropCalibrationRenderer,
  x: number,
  y: number,
  width: number,
): string {
  const placements = [
    { id: 'desk', x: 1, y: 2 },
    { id: 'office-chair', x: 2, y: 3 },
    { id: 'filing-cabinet', x: 1, y: 1 },
    { id: 'copier', x: 3, y: 1 },
    { id: 'water-cooler', x: 5, y: 1 },
    { id: 'potted-tree', x: 7, y: 1 },
    { id: 'waiting-bench', x: 5, y: 3 },
  ] as const;
  const agents: readonly AgentSpec[] = [
    { recipe: CLIPBOARD_EMPLOYEE, facing: 'south', x: 2.8, y: 4.4 },
    { recipe: DEFAULT_CAST[1], facing: 'west', x: 4.2, y: 3.8 },
    { recipe: DEFAULT_CAST[2], facing: 'north', x: 6.1, y: 4.7 },
    { recipe: DEFAULT_CAST[3], facing: 'east', x: 7.2, y: 3.7 },
  ];
  const roomWidth = 9 * FAR_CELL;
  const roomY = y + 62;
  const starts = [
    x + 34,
    x + (width - roomWidth) / 2,
    x + width - roomWidth - 34,
  ];
  return [
    panel(x, y, width, 380, PANEL_GREEN),
    text(x + 18, y + 28, 'FAR GAMEPLAY STRESS · 40 PX / CELL', 13, 760, GREEN),
    text(
      x + width - 18,
      y + 28,
      'crowd · wall context · desk occlusion · interaction approach',
      9,
      600,
      CORAL,
      'end',
    ),
    ...starts.map((roomX) =>
      drawRoom(renderer, roomX, roomY, 9, 7, FAR_CELL, placements, agents)
    ),
    text(starts[0], y + 365, 'WORKSTATION', 8.5, 650, BLUE),
    text(starts[1], y + 365, 'CROWDED', 8.5, 650, BLUE),
    text(starts[2], y + 365, 'INTERACTION', 8.5, 650, BLUE),
  ].join('');
}

function portfolioSheet(
  renderer: PropCalibrationRenderer,
  sources: SourceMap,
): string {
  const parts = [
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAGE}"/>`,
    text(MARGIN, 43, 'QUOTACO CANONICAL PROP PORTFOLIO · ACCEPTED', 25, 820, GREEN),
    text(
      MARGIN,
      67,
      `All ${INTERIOR_CANONICAL_COUNT} interior artist-editable SVGs promoted as Terrarium production sources · automatic prop styling disabled`,
      11,
      600,
      MUTED,
    ),
    text(
      WIDTH - MARGIN,
      42,
      'TERRARIUM PRODUCTION SOURCE · UNITY IMPORTED',
      10,
      760,
      CORAL,
      'end',
    ),
    text(
      WIDTH - MARGIN,
      64,
      `128u authoring · ${WALL_DATUM}u walls · characters ×${CHARACTER_VISUAL_SCALE} · schema ${CURRENT_SCHEMA_VERSION}`,
      9,
      620,
      MUTED,
      'end',
    ),
  ];

  const authoredGroups = CANONICAL_PROP_PORTFOLIO_GROUPS.filter(
    ({ authoredIds }) => authoredIds.length > 0,
  );
  const groupY = [90, 372, 654, 936];
  authoredGroups.forEach((group, index) => {
    parts.push(
      authoredGroupPanel(
        renderer,
        sources,
        group,
        MARGIN,
        groupY[index],
        WIDTH - MARGIN * 2,
        264,
      ),
    );
  });

  parts.push(carryoverPanel(renderer, MARGIN, 1218, WIDTH - MARGIN * 2));

  const roomsY = 1456;
  const roomWidth = (WIDTH - MARGIN * 2 - GAP * 2) / 3;
  const commonAgents: readonly AgentSpec[] = [
    { recipe: CLIPBOARD_EMPLOYEE, facing: 'south', x: 2.8, y: 5.0 },
    { recipe: DEFAULT_CAST[1], facing: 'west', x: 5.2, y: 4.4 },
    { recipe: DEFAULT_CAST[2], facing: 'north', x: 7.1, y: 5.0 },
  ];
  parts.push(
    roomPanel(
      renderer,
      'WORKSTATION + SERVICE',
      'Desk occlusion, seating, storage, printer, water, plant, and clipboard.',
      MARGIN,
      roomsY,
      roomWidth,
      [
        { id: 'desk', x: 1, y: 2 },
        { id: 'office-chair', x: 2, y: 3 },
        { id: 'filing-cabinet', x: 1, y: 1 },
        { id: 'printer', x: 4, y: 1 },
        { id: 'water-cooler', x: 6, y: 1 },
        { id: 'office-plant', x: 7, y: 2 },
      ],
      commonAgents,
    ),
    roomPanel(
      renderer,
      'MEETING + LOUNGE',
      'Plan furniture, low seating, lighting, wall décor, and living display.',
      MARGIN + roomWidth + GAP,
      roomsY,
      roomWidth,
      [
        { id: 'conference-table', x: 2, y: 2 },
        { id: 'couch', x: 1, y: 4 },
        { id: 'lounge-seating', x: 5, y: 4 },
        { id: 'floor-lamp', x: 1, y: 1 },
        { id: 'fish-tank', x: 7, y: 1 },
        { id: 'framed-art', x: 4, y: 0, occupancy: false },
      ],
      [
        { recipe: DEFAULT_CAST[0], facing: 'east', x: 2.0, y: 5.1 },
        { recipe: DEFAULT_CAST[1], facing: 'west', x: 6.8, y: 5.0 },
        { recipe: DEFAULT_CAST[3], facing: 'south', x: 4.5, y: 4.7 },
      ],
    ),
    roomPanel(
      renderer,
      'STORAGE + MACHINE BAY',
      'Dense service silhouettes, access faces, storage, and employee approach.',
      MARGIN + (roomWidth + GAP) * 2,
      roomsY,
      roomWidth,
      [
        { id: 'open-shelving', x: 1, y: 1 },
        { id: 'lockers', x: 2, y: 1 },
        { id: 'server-rack', x: 4, y: 1 },
        { id: 'mail-station', x: 5, y: 1 },
        { id: 'vending-machine', x: 7, y: 1 },
        { id: 'copier', x: 2, y: 3 },
        { id: 'fridge', x: 6, y: 3 },
      ],
      [
        { recipe: DEFAULT_CAST[2], facing: 'north', x: 3.6, y: 5.3 },
        { recipe: DEFAULT_CAST[3], facing: 'west', x: 6.0, y: 5.0 },
      ],
    ),
  );

  parts.push(
    farStressPanel(renderer, MARGIN, 2034, WIDTH - MARGIN * 2),
    panel(MARGIN, 2432, WIDTH - MARGIN * 2, 420, PANEL_ALT),
    text(MARGIN + 18, 2463, 'ACCEPTANCE BOUNDARY', 14, 780, GREEN),
    text(MARGIN + 18, 2490, 'Locked', 10, 720, BLUE),
    text(
      MARGIN + 18,
      2513,
      `${INTERIOR_CANONICAL_COUNT} canonical SVG sources · source paint order · 128u canvas · 112u walls · character ×0.65 · gameplay footprints · pivots · anchors · schema · Unity registration`,
      9.5,
      540,
      INK,
    ),
    text(MARGIN + 18, 2550, 'Default authored-prop policy', 10, 720, BLUE),
    text(
      MARGIN + 18,
      2573,
      'One resolved tint:null export layer · no global prop outline · no compositor contact shadow · explicit restyleAuthoredSvg opt-in retained',
      9.5,
      540,
      INK,
    ),
    text(MARGIN + 18, 2610, 'Accepted visual target', 10, 720, BLUE),
    text(
      MARGIN + 18,
      2633,
      'Noun readability and literal gameplay-scale relationships accepted. Future art corrections belong in the individual SVG source.',
      9.5,
      540,
      INK,
    ),
    text(MARGIN + 18, 2670, 'Deferred', 10, 720, CORAL),
    text(
      MARGIN + 18,
      2693,
      'In-game facility visibility · gameplay-scale visual acceptance · commit',
      9.5,
      560,
      MUTED,
    ),
    line(`M ${MARGIN + 18} 2724 H ${WIDTH - MARGIN - 18}`, RULE, 1),
    text(
      MARGIN + 18,
      2753,
      'Accepted gate: close source/output pairs + three normal rooms + three far rooms.',
      9,
      620,
      MUTED,
    ),
    text(
      WIDTH - MARGIN - 18,
      2753,
      'BROWSER EXPORT + UNITY IMPORT COMPLETE · RUNTIME VISUAL DEFERRED · NO COMMIT',
      9.5,
      760,
      CORAL,
      'end',
    ),
    '</svg>',
  );
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" ` +
    `viewBox="0 0 ${WIDTH} ${HEIGHT}">${parts.join('')}`
  );
}

async function portfolioMetrics(
  renderer: PropCalibrationRenderer,
  sources: SourceMap,
): Promise<unknown> {
  const project = defaultProject();
  const sourceValidation = Object.fromEntries(
    QUOTA_CO_INTERIOR_WORKHORSE_PROP_IDS.map((id) => {
      const source = sources.get(id);
      const art = authoredPropArt(id);
      const instance = project.props.find(({ templateId }) => templateId === id);
      if (!source || !art || !instance) throw new Error(`Missing portfolio input ${id}`);
      const output = renderer.prop('current', id);
      const layers = propLayers(instance, DEFAULT_STYLE);
      return [
        id,
        {
          sourceFile: art.sourceFile,
          sourceSha256: createHash('sha256').update(source).digest('hex'),
          importedSourceSha256: art.sourceSha256,
          sourceHashMatches: createHash('sha256').update(source).digest('hex')
            === art.sourceSha256,
          normalizedPixelDelta: normalizedPixelDelta(source, output),
          close: alphaStats(output, AUTHORING_CANVAS),
          far: alphaStats(output, FAR_CELL),
          defaultLayerCount: layers.length,
          defaultLayerTints: layers.map(({ tint }) => tint),
        },
      ] as const;
    }),
  );
  return {
    reviewStatus: 'canonical-portfolio-unity-imported-runtime-deferred',
    canonicalSvgCount: QUOTA_CO_INTERIOR_WORKHORSE_PROP_IDS.length,
    sourceSvgAuthoring: true,
    productionPromotion: true,
    bundleExportPerformed: true,
    unityImport: true,
    runtimeVisualAcceptance: false,
    runtimeVisualAcceptanceDeferred: true,
    runtimeVisualAcceptanceReason:
      'The cafeteria facilities do not yet have a viable in-game path.',
    commitCreated: false,
    exportContractMutation: false,
    schemaMutation: false,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    invariants: {
      authoringCanvas: AUTHORING_CANVAS,
      acceptedWallDatum: WALL_DATUM,
      characterVisualScale: CHARACTER_VISUAL_SCALE,
      propCharacterMultiplierApplied: false,
      nativePropFrameCells: PROP_NATIVE_FRAME_CELLS,
      gameplayRootsAndFootprintsPreserved: true,
    },
    authoredSvgStylePolicy: {
      globalRestylingDefault: false,
      compositorOutlineDefault: false,
      compositorContactShadowDefault: false,
      exportLayerMode: 'single-resolved-untinted',
      explicitOptIn: 'restyleAuthoredSvg',
    },
    groups: CANONICAL_PROP_PORTFOLIO_GROUPS.map((group) => ({
      id: group.id,
      label: group.label,
      authoredIds: group.authoredIds,
      carryoverIds: group.carryoverIds,
    })),
    sourceValidation,
    evaluationContexts: [
      'close-canonical-svg-versus-terrarium-output',
      'normal-workstation-service',
      'normal-meeting-lounge',
      'normal-storage-machine-bay',
      'far-workstation',
      'far-crowded-room',
      'far-interaction-approach',
      'wall-context',
      'desk-occlusion',
      'character-relative-handheld',
      'separately-gated-outdoor-carriers',
    ],
    protectedCounts: {
      defaultCharacters: project.characters.length,
      defaultProps: project.props.length,
      defaultWalls: project.walls.length,
    },
  };
}

export async function renderQuotaCoCanonicalPropPortfolio(
  output = path.join('docs', 'previews'),
): Promise<{
  readonly svgPath: string;
  readonly pngPath: string;
  readonly metricsPath: string;
}> {
  const sources = await loadSources();
  const renderer = new PropCalibrationRenderer(new Map());
  const source = portfolioSheet(renderer, sources);
  const png = new Resvg(source, {
    font: { loadSystemFonts: true },
  }).render().asPng();
  await mkdir(output, { recursive: true });
  const base = 'quota-co-canonical-prop-portfolio-v1';
  const svgPath = path.join(output, `${base}.svg`);
  const pngPath = path.join(output, `${base}.png`);
  const metricsPath = path.join(output, `${base}-metrics.json`);
  await writeFile(svgPath, source, 'utf8');
  await writeFile(pngPath, png);
  await writeFile(
    metricsPath,
    `${JSON.stringify(await portfolioMetrics(renderer, sources), null, 2)}\n`,
    'utf8',
  );
  return { svgPath, pngPath, metricsPath };
}

function parseOutput(argv: readonly string[]): string {
  const index = argv.indexOf('--out');
  return index >= 0 && argv[index + 1]
    ? path.resolve(argv[index + 1])
    : path.resolve('docs', 'previews');
}

if (process.argv[1]?.endsWith('quotaCoCanonicalPropPortfolioPreview.ts')) {
  renderQuotaCoCanonicalPropPortfolio(parseOutput(process.argv.slice(2)))
    .then((result) => {
      process.stdout.write(
        'Wrote QuotaCo canonical prop portfolio:\n' +
        `${result.svgPath}\n${result.pngPath}\n${result.metricsPath}\n`,
      );
    })
    .catch((error: unknown) => {
      process.stderr.write(
        `${error instanceof Error ? error.message : String(error)}\n`,
      );
      process.exitCode = 1;
    });
}
