/**
 * Disposable, review-only proof for the selected 112 px QuotaCo equal-height
 * wall footprint. This script reads the accepted source bank, derives the
 * selected review bank in memory, and writes only .style-loop review artifacts.
 *
 * It does not mutate accepted SVGs, the mask ledger, exporter/atlas/schema/blob
 * contracts, or Unity registration.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import {
  composeCharacter,
  composeWallShapes,
} from '../src/core/compositor';
import type {
  CharacterRecipe,
  ShapeSpec,
  StyleSheet,
  TileInstance,
} from '../src/core/types';
import { defaultProject } from '../src/data/defaults';
import { BLOB_CONFIGS, NB, blobIndex } from '../src/tiles/blob';
import {
  EQUAL_HEIGHT_ALL_MASK_REVIEW_BOUNDARY,
  compileSelectedEqualHeightAllMaskFrames,
  type CalibratedEqualHeightFrame,
} from './highOblique/equalHeightFootprintAllMaskCalibration';
import {
  compileEqualHeightEvaluationFrames,
  type CompiledEqualHeightFrame,
} from './walls/equalHeightImporter';

const WIDTH = 2560;
const HEIGHT = 5220;
const MARGIN = 40;
const GAP = 20;

const PAGE = '#E7E1D2';
const PANEL = '#F6F1E6';
const PANEL_ALT = '#ECE5D7';
const INK = '#292C2A';
const MUTED = '#626861';
const RULE = '#A39B8B';
const GREEN = '#4E8059';
const CORAL = '#C96A50';
const BLUE = '#294565';
const FLOOR = '#7B8890';
const FLOOR_LINE = '#D9D4C7';

const SOURCE_ROOTS = [
  {
    inputDir: path.resolve('assets/walls/quota-co-building-system'),
    sourcePathPrefix: 'assets/walls/quota-co-building-system',
  },
  {
    inputDir: path.resolve(
      'assets/walls/quota-co-building-system-proofs',
    ),
    sourcePathPrefix:
      'assets/walls/quota-co-building-system-proofs',
  },
] as const;

type Bank = 'current' | 'selected';

interface CliOptions {
  readonly output: string;
}

interface TileOptions {
  readonly background?: boolean;
  readonly flipX?: boolean;
  readonly frame?: boolean;
  readonly label?: boolean;
}

interface ReviewFrame {
  readonly index: number;
  readonly shapes: readonly ShapeSpec[];
}

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
  weight = 560,
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

function panel(
  x: number,
  y: number,
  width: number,
  height: number,
  fill = PANEL,
  stroke = 'none',
): string {
  return (
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" ` +
    `rx="15" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`
  );
}

function stripSvgShell(source: string): string {
  return source
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
}

function checker(x: number, y: number, size: number): string {
  return (
    `<rect x="${x}" y="${y}" width="${size}" height="${size}" ` +
    'fill="url(#checker)" stroke="#8B857A" stroke-opacity=".62"/>'
  );
}

function maskLabel(index: number): string {
  return `m${String(index).padStart(2, '0')}`;
}

class ReviewRenderer {
  private readonly accepted: ReadonlyMap<number, ReviewFrame>;
  private readonly selected: ReadonlyMap<number, ReviewFrame>;
  private readonly wall: TileInstance;
  private readonly style: StyleSheet;
  private readonly characters: readonly CharacterRecipe[];
  private readonly wallCache = new Map<string, string>();
  private readonly characterCache = new Map<string, string>();

  constructor(
    acceptedFrames: readonly CompiledEqualHeightFrame[],
    selectedFrames: readonly CalibratedEqualHeightFrame[],
  ) {
    this.accepted = new Map(
      acceptedFrames.map((frame) => [frame.index, frame]),
    );
    this.selected = new Map(
      selectedFrames.map((frame) => [frame.index, frame]),
    );
    const project = defaultProject();
    const wall = project.walls.find(({ id }) => id === 'wall-office');
    if (!wall) throw new Error('Default project is missing wall-office');
    this.wall = wall;
    this.style = project.style;
    this.characters = project.characters.slice(0, 4);
    if (this.characters.length < 3) {
      throw new Error('Default project needs three gameplay-scale characters');
    }
  }

  private wallMarkup(mask: number, bank: Bank): string {
    const key = `${bank}:${mask}`;
    const cached = this.wallCache.get(key);
    if (cached) return cached;
    const frame = (bank === 'current' ? this.accepted : this.selected).get(mask);
    if (!frame) throw new Error(`Review bank is missing mask_${mask}`);
    const markup = stripSvgShell(
      composeWallShapes(frame.shapes, this.wall, this.style, 128),
    );
    this.wallCache.set(key, markup);
    return markup;
  }

  tile(
    mask: number,
    bank: Bank,
    x: number,
    y: number,
    size: number,
    options: TileOptions = {},
  ): string {
    const background = options.background ?? true;
    const flipX = options.flipX ?? false;
    const frame = options.frame ?? true;
    const markup = this.wallMarkup(mask, bank);
    return (
      (background ? checker(x, y, size) : '') +
      `<svg x="${x}" y="${y}" width="${size}" height="${size}" ` +
      'viewBox="0 0 128 128" preserveAspectRatio="none" overflow="hidden">' +
      (flipX
        ? `<g transform="matrix(-1 0 0 1 128 0)">${markup}</g>`
        : markup) +
      '</svg>' +
      (frame
        ? `<rect x="${x}" y="${y}" width="${size}" height="${size}" ` +
          'fill="none" stroke="#756F65" stroke-opacity=".48"/>'
        : '') +
      (options.label
        ? text(
            x + size / 2,
            y + size - 6,
            maskLabel(mask),
            Math.max(9, size * 0.12),
            760,
            INK,
            'middle',
          )
        : '')
    );
  }

  character(
    index: number,
    facing: 'south' | 'east' | 'north' | 'west',
    x: number,
    y: number,
    size: number,
  ): string {
    const recipe = this.characters[index % this.characters.length];
    const key = `${recipe.id}:${facing}`;
    let markup = this.characterCache.get(key);
    if (!markup) {
      markup = stripSvgShell(
        composeCharacter(
          recipe,
          this.style,
          facing,
          128,
          'normal',
          { badge: false },
        ),
      );
      this.characterCache.set(key, markup);
    }
    return (
      `<svg x="${x}" y="${y}" width="${size}" height="${size}" ` +
      'viewBox="0 0 128 128" overflow="visible">' +
      markup +
      '</svg>'
    );
  }
}

function defs(): string {
  return (
    '<defs>' +
    '<pattern id="checker" width="12" height="12" patternUnits="userSpaceOnUse">' +
    '<rect width="12" height="12" fill="#D8D2C5"/>' +
    '<path d="M0 0H6V6H0ZM6 6H12V12H6Z" fill="#C8C1B3"/>' +
    '</pattern>' +
    '</defs>'
  );
}

function allMaskBank(
  parts: string[],
  renderer: ReviewRenderer,
  bank: Bank,
  x: number,
  y: number,
  width: number,
  title: string,
  detail: string,
  accent: string,
): void {
  const height = 730;
  parts.push(panel(x, y, width, height, PANEL, accent));
  parts.push(
    `<rect x="${x}" y="${y}" width="${width}" height="9" ` +
      `rx="4" fill="${accent}"/>`,
    text(x + 28, y + 45, title, 24, 820, accent),
    text(x + 28, y + 73, detail, 14, 600, MUTED),
  );

  const tileSize = 76;
  const pitchX = 94;
  const pitchY = 103;
  const gridWidth = pitchX * 7 + tileSize;
  const gridX = x + (width - gridWidth) / 2;
  const gridY = y + 112;
  for (let index = 0; index < 47; index += 1) {
    const column = index % 8;
    const row = Math.floor(index / 8);
    const tileX = gridX + column * pitchX;
    const tileY = gridY + row * pitchY;
    parts.push(
      text(
        tileX + tileSize / 2,
        tileY - 7,
        `mask_${index}`,
        10,
        720,
        MUTED,
        'middle',
      ),
      renderer.tile(index, bank, tileX, tileY, tileSize),
    );
  }
}

function runMasks(
  orientation: 'horizontal' | 'vertical',
  count: 1 | 3 | 6,
): readonly number[] {
  if (count === 1) return [0];
  if (orientation === 'horizontal') {
    return [2, ...Array.from({ length: count - 2 }, () => 10), 8];
  }
  return [4, ...Array.from({ length: count - 2 }, () => 5), 1];
}

function drawRun(
  parts: string[],
  renderer: ReviewRenderer,
  orientation: 'horizontal' | 'vertical',
  count: 1 | 3 | 6,
  x: number,
  y: number,
  size: number,
  flipX = false,
): void {
  runMasks(orientation, count).forEach((mask, index) => {
    parts.push(
      renderer.tile(
        mask,
        'selected',
        x + (orientation === 'horizontal' ? index * size : 0),
        y + (orientation === 'vertical' ? index * size : 0),
        size,
        { flipX },
      ),
    );
  });
}

function gameplayRuns90(
  parts: string[],
  renderer: ReviewRenderer,
  x: number,
  y: number,
): void {
  const width = 980;
  const height = 670;
  const size = 90;
  parts.push(
    panel(x, y, width, height),
    text(x + 26, y + 42, 'Selected 112 · literal 90 px runs', 22, 820, GREEN),
    text(
      x + 26,
      y + 69,
      'Valid termini on 1 / 3 / 6-cell horizontal and vertical installs',
      13,
      600,
      MUTED,
    ),
  );

  const horizontalX = x + 48;
  const horizontalY = y + 120;
  ([1, 3, 6] as const).forEach((count, row) => {
    const runY = horizontalY + row * 128;
    parts.push(
      text(horizontalX - 15, runY + 54, `${count}`, 14, 800, MUTED, 'end'),
    );
    drawRun(
      parts,
      renderer,
      'horizontal',
      count,
      horizontalX,
      runY,
      size,
    );
  });

  const verticalX = x + 650;
  ([1, 3, 6] as const).forEach((count, column) => {
    const runX = verticalX + column * 105;
    parts.push(
      text(
        runX + size / 2,
        y + 105,
        `${count}`,
        14,
        800,
        MUTED,
        'middle',
      ),
    );
    drawRun(
      parts,
      renderer,
      'vertical',
      count,
      runX,
      y + 120,
      size,
    );
  });
}

function verticalFacings90(
  parts: string[],
  renderer: ReviewRenderer,
  x: number,
  y: number,
): void {
  const width = 580;
  const height = 650;
  const size = 90;
  parts.push(
    panel(x, y, width, height),
    text(x + 26, y + 42, 'Vertical facing contract', 22, 820, GREEN),
    text(
      x + 26,
      y + 69,
      'Same candidate geometry; east is Unity SpriteRenderer.flipX',
      13,
      600,
      MUTED,
    ),
  );
  const directX = x + 100;
  const flippedX = x + 375;
  parts.push(
    text(
      directX + size / 2,
      y + 111,
      'west · direct',
      14,
      760,
      MUTED,
      'middle',
    ),
    text(
      flippedX + size / 2,
      y + 111,
      'east · runtime flipX',
      14,
      760,
      MUTED,
      'middle',
    ),
  );
  drawRun(parts, renderer, 'vertical', 3, directX, y + 135, size);
  drawRun(parts, renderer, 'vertical', 3, flippedX, y + 135, size, true);
  parts.push(
    `<path d="M ${x + width / 2} ${y + 104} V ${y + height - 25}" ` +
      `stroke="${RULE}" stroke-dasharray="5 7"/>`,
    text(
      directX + size / 2,
      y + 445,
      'm04 · m05 · m01',
      12,
      700,
      MUTED,
      'middle',
    ),
    text(
      flippedX + size / 2,
      y + 445,
      'same masks, mirrored',
      12,
      700,
      MUTED,
      'middle',
    ),
  );
  parts.push(
    renderer.tile(5, 'selected', directX - 15, y + 490, 120),
    renderer.tile(5, 'selected', flippedX - 15, y + 490, 120, {
      flipX: true,
    }),
  );
}

function bounded40Study(
  parts: string[],
  renderer: ReviewRenderer,
  x: number,
  y: number,
): void {
  const width = 880;
  const height = 650;
  const size = 40;
  parts.push(
    panel(x, y, width, height),
    text(x + 26, y + 42, 'Selected 112 · bounded 40 px', 22, 820, GREEN),
    text(
      x + 26,
      y + 69,
      'Literal cell clipping; outlines and ledges must stay inside each frame',
      13,
      600,
      MUTED,
    ),
  );

  const masks = [
    0, 1, 2, 3, 4, 5, 6, 7,
    8, 9, 10, 11, 12, 13, 14, 15,
    19, 23, 24, 29, 30, 31, 33, 37,
    38, 40, 41, 42, 44, 45, 46,
  ] as const;
  const pitchX = 53;
  const pitchY = 70;
  const startX = x + 32;
  const startY = y + 108;
  masks.forEach((mask, index) => {
    const column = index % 16;
    const row = Math.floor(index / 16);
    const tileX = startX + column * pitchX;
    const tileY = startY + row * pitchY;
    parts.push(
      renderer.tile(mask, 'selected', tileX, tileY, size),
      text(
        tileX + size / 2,
        tileY + size + 13,
        maskLabel(mask),
        9,
        720,
        MUTED,
        'middle',
      ),
    );
  });

  parts.push(
    text(x + 32, y + 292, '40 px seam runs', 14, 780, INK),
  );
  ([1, 3, 6] as const).forEach((count, row) => {
    const runY = y + 315 + row * 63;
    parts.push(
      text(x + 48, runY + 26, `${count}`, 12, 800, MUTED, 'end'),
    );
    drawRun(parts, renderer, 'horizontal', count, x + 62, runY, size);
  });
  ([1, 3, 6] as const).forEach((count, column) => {
    const runX = x + 420 + column * 82;
    parts.push(
      text(
        runX + size / 2,
        y + 314,
        `${count}`,
        12,
        800,
        MUTED,
        'middle',
      ),
    );
    drawRun(
      parts,
      renderer,
      'vertical',
      count,
      runX,
      y + 328,
      size,
    );
  });
}

function maskArray(
  parts: string[],
  renderer: ReviewRenderer,
  label: string,
  masks: readonly number[],
  x: number,
  y: number,
  size: number,
): void {
  parts.push(text(x, y + size / 2 + 5, label, 14, 760, MUTED, 'end'));
  masks.forEach((mask, index) => {
    const tileX = x + 18 + index * (size + 13);
    parts.push(
      renderer.tile(mask, 'selected', tileX, y, size),
      text(
        tileX + size / 2,
        y + size - 7,
        maskLabel(mask),
        10,
        800,
        INK,
        'middle',
      ),
    );
  });
}

function topologyStudy(
  parts: string[],
  renderer: ReviewRenderer,
  x: number,
  y: number,
): void {
  const width = 1580;
  const height = 500;
  const size = 78;
  parts.push(
    panel(x, y, width, height),
    text(x + 26, y + 42, 'Selected topology representatives', 22, 820, GREEN),
    text(
      x + 26,
      y + 69,
      'Corners, T hubs, cross fill progression, and thick diagonal/block families',
      13,
      600,
      MUTED,
    ),
  );
  const labelsX = x + 185;
  maskArray(
    parts,
    renderer,
    'corners',
    [3, 6, 9, 12],
    labelsX,
    y + 98,
    size,
  );
  maskArray(
    parts,
    renderer,
    'T junctions',
    [7, 11, 13, 14],
    labelsX,
    y + 196,
    size,
  );
  maskArray(
    parts,
    renderer,
    'cross progression',
    [15, 19, 25, 33, 46],
    labelsX,
    y + 294,
    size,
  );
  maskArray(
    parts,
    renderer,
    'thick / diagonal',
    [37, 40, 41, 44, 45, 46],
    labelsX,
    y + 392,
    size,
  );

  const noteX = x + 980;
  parts.push(
    panel(noteX, y + 98, 565, 372, PANEL_ALT),
    text(noteX + 26, y + 135, 'Read this bank for', 16, 820, INK),
    text(noteX + 26, y + 172, '• continuous cream lip and dark outer return', 14, 620, MUTED),
    text(noteX + 26, y + 203, '• aligned coral / green / shade phase', 14, 620, MUTED),
    text(noteX + 26, y + 234, '• no pale wedges or hanging tails at joins', 14, 620, MUTED),
    text(noteX + 26, y + 265, '• no doubled turns in dense diagonal masks', 14, 620, MUTED),
    text(noteX + 26, y + 317, 'mask_46 remains the full-cell control.', 14, 760, BLUE),
    text(noteX + 26, y + 348, 'All other masks are derived in memory only.', 14, 620, MUTED),
    text(noteX + 26, y + 411, 'REVIEW ONLY', 18, 840, CORAL),
    text(noteX + 26, y + 439, 'No accepted/source/export/runtime mutation.', 13, 700, MUTED),
  );
}

interface ReviewMaskStudy {
  readonly mask: number;
  readonly caption: string;
}

const REVIEW_MASK_STUDIES: readonly ReviewMaskStudy[] = [
  { mask: 25, caption: 'east slab · local cream reveal' },
  { mask: 43, caption: 'west slab · mirrored reveal' },
  { mask: 30, caption: 'diagonal · mixed register handoff' },
  { mask: 40, caption: 'opposite diagonal · filtered mirror' },
  { mask: 32, caption: 'south slab · centered north spur' },
  { mask: 33, caption: 'single-open northwest crook' },
  { mask: 45, caption: 'single-open northeast crook' },
  { mask: 6, caption: 'representative perimeter corner' },
  { mask: 14, caption: 'representative T hub' },
  { mask: 15, caption: 'representative open cross' },
] as const;

function literalCloseups240(
  parts: string[],
  renderer: ReviewRenderer,
  x: number,
  y: number,
): void {
  const width = WIDTH - MARGIN * 2;
  const height = 720;
  const tileSize = 240;
  const pitchX = 488;
  const pitchY = 293;
  const startX = x + 32;
  const startY = y + 112;
  const cardWidth = 450;
  parts.push(
    panel(x, y, width, height),
    text(x + 26, y + 42, 'Selected 112 · literal 240 px closeups', 22, 820, GREEN),
    text(
      x + 500,
      y + 42,
      'Guide-free candidate pixels · solid neutral field reveals the complete cell silhouette',
      14,
      650,
      MUTED,
    ),
  );

  REVIEW_MASK_STUDIES.forEach(({ mask, caption }, index) => {
    const column = index % 5;
    const row = Math.floor(index / 5);
    const cardX = startX + column * pitchX;
    const tileX = cardX + (cardWidth - tileSize) / 2;
    const tileY = startY + row * pitchY;
    parts.push(
      text(
        cardX + cardWidth / 2,
        tileY - 13,
        `mask_${mask}`,
        14,
        800,
        INK,
        'middle',
      ),
      `<rect x="${tileX}" y="${tileY}" width="${tileSize}" height="${tileSize}" ` +
        'rx="3" fill="#D2CBC0"/>',
      renderer.tile(mask, 'selected', tileX, tileY, tileSize, {
        background: false,
        frame: false,
      }),
      text(
        cardX + cardWidth / 2,
        tileY + tileSize + 23,
        caption,
        12,
        660,
        MUTED,
        'middle',
      ),
    );
  });
}

interface FixtureOffset {
  readonly dx: number;
  readonly dy: number;
  readonly bit: number;
}

const FIXTURE_OFFSETS: readonly FixtureOffset[] = [
  { dx: 0, dy: -1, bit: NB.N },
  { dx: 1, dy: 0, bit: NB.E },
  { dx: 0, dy: 1, bit: NB.S },
  { dx: -1, dy: 0, bit: NB.W },
  { dx: 1, dy: -1, bit: NB.NE },
  { dx: 1, dy: 1, bit: NB.SE },
  { dx: -1, dy: 1, bit: NB.SW },
  { dx: -1, dy: -1, bit: NB.NW },
] as const;

function fixtureKey(column: number, row: number): string {
  return `${column},${row}`;
}

function legalFixtureOccupancy(targetMask: number): ReadonlySet<string> {
  const config = BLOB_CONFIGS[targetMask];
  if (config === undefined) {
    throw new Error(`Missing blob config for mask_${targetMask}`);
  }
  const occupied = new Set<string>([fixtureKey(1, 1)]);
  FIXTURE_OFFSETS.forEach(({ dx, dy, bit }) => {
    if (config & bit) occupied.add(fixtureKey(1 + dx, 1 + dy));
  });
  return occupied;
}

function fixtureMaskAt(
  occupied: ReadonlySet<string>,
  column: number,
  row: number,
): number {
  let raw = 0;
  FIXTURE_OFFSETS.forEach(({ dx, dy, bit }) => {
    if (occupied.has(fixtureKey(column + dx, row + dy))) raw |= bit;
  });
  return blobIndex(raw);
}

function drawLegalFixture(
  parts: string[],
  renderer: ReviewRenderer,
  targetMask: number,
  x: number,
  y: number,
  size: number,
): void {
  const occupied = legalFixtureOccupancy(targetMask);
  const installedCenterMask = fixtureMaskAt(occupied, 1, 1);
  if (installedCenterMask !== targetMask) {
    throw new Error(
      `Legal fixture expected mask_${targetMask}, got mask_${installedCenterMask}`,
    );
  }
  parts.push(
    `<rect x="${x}" y="${y}" width="${size * 3}" height="${size * 3}" ` +
      `rx="4" fill="${FLOOR}"/>`,
  );
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      if (!occupied.has(fixtureKey(column, row))) continue;
      parts.push(
        renderer.tile(
          fixtureMaskAt(occupied, column, row),
          'selected',
          x + column * size,
          y + row * size,
          size,
          { background: false, frame: false },
        ),
      );
    }
  }
}

function installedLegalFixtures(
  parts: string[],
  renderer: ReviewRenderer,
  x: number,
  y: number,
): void {
  const width = WIDTH - MARGIN * 2;
  const height = 900;
  const cellSize = 84;
  const fixtureSize = cellSize * 3;
  const pitchX = 488;
  const pitchY = 390;
  const startX = x + 32;
  const startY = y + 132;
  const cardWidth = 450;
  parts.push(
    panel(x, y, width, height),
    text(x + 26, y + 42, 'Selected 112 · installed legal-neighbor fixtures', 22, 820, GREEN),
    text(
      x + 590,
      y + 42,
      'Each center is derived from its canonical blob config; surrounding masks are recomputed from the same 3×3 occupancy',
      14,
      650,
      MUTED,
    ),
    text(
      x + 26,
      y + 72,
      'No seam grid or per-cell frame is drawn: read only the installed union, shared ledge phase, open crooks, and exposed returns.',
      13,
      620,
      MUTED,
    ),
  );

  REVIEW_MASK_STUDIES.forEach(({ mask, caption }, index) => {
    const column = index % 5;
    const row = Math.floor(index / 5);
    const cardX = startX + column * pitchX;
    const fixtureX = cardX + (cardWidth - fixtureSize) / 2;
    const fixtureY = startY + row * pitchY;
    parts.push(
      text(
        cardX + cardWidth / 2,
        fixtureY - 17,
        `center mask_${mask}`,
        14,
        800,
        INK,
        'middle',
      ),
    );
    drawLegalFixture(
      parts,
      renderer,
      mask,
      fixtureX,
      fixtureY,
      cellSize,
    );
    parts.push(
      text(
        cardX + cardWidth / 2,
        fixtureY + fixtureSize + 25,
        caption,
        12,
        660,
        MUTED,
        'middle',
      ),
    );
  });
}

function roomWallRing(
  parts: string[],
  renderer: ReviewRenderer,
  x: number,
  y: number,
  columns: number,
  rows: number,
  size: number,
  layer: 'back' | 'front',
  showCellFrames = true,
): void {
  if (layer === 'back') {
    parts.push(
      renderer.tile(6, 'selected', x, y, size, {
        background: false,
        frame: showCellFrames,
      }),
    );
    for (let column = 1; column < columns - 1; column += 1) {
      parts.push(
        renderer.tile(
          10,
          'selected',
          x + column * size,
          y,
          size,
          { background: false, frame: showCellFrames },
        ),
      );
    }
    parts.push(
      renderer.tile(
        12,
        'selected',
        x + (columns - 1) * size,
        y,
        size,
        { background: false, frame: showCellFrames },
      ),
    );
    for (let row = 1; row < rows - 1; row += 1) {
      parts.push(
        renderer.tile(
          5,
          'selected',
          x,
          y + row * size,
          size,
          { background: false, frame: showCellFrames },
        ),
        renderer.tile(
          5,
          'selected',
          x + (columns - 1) * size,
          y + row * size,
          size,
          {
            background: false,
            flipX: true,
            frame: showCellFrames,
          },
        ),
      );
    }
    return;
  }

  parts.push(
    renderer.tile(
      3,
      'selected',
      x,
      y + (rows - 1) * size,
      size,
      { background: false, frame: showCellFrames },
    ),
  );
  for (let column = 1; column < columns - 1; column += 1) {
    parts.push(
      renderer.tile(
        10,
        'selected',
        x + column * size,
        y + (rows - 1) * size,
        size,
        { background: false, frame: showCellFrames },
      ),
    );
  }
  parts.push(
    renderer.tile(
      9,
      'selected',
      x + (columns - 1) * size,
      y + (rows - 1) * size,
      size,
      { background: false, frame: showCellFrames },
    ),
  );
}

function compactCorridor(
  parts: string[],
  renderer: ReviewRenderer,
  x: number,
  y: number,
): void {
  const width = WIDTH - MARGIN * 2;
  const height = 700;
  const size = 88;
  const columns = 4;
  const rows = 6;
  const corridorWidth = columns * size;
  const corridorHeight = rows * size;
  const corridorX = x + 120;
  const corridorY = y + 112;
  parts.push(
    panel(x, y, width, height),
    text(x + 26, y + 42, 'Selected 112 · compact gameplay corridor', 22, 820, GREEN),
    text(
      x + 510,
      y + 42,
      '88 px cells · guide-free union · west direct / east runtime flipX · locked agent scale',
      14,
      650,
      MUTED,
    ),
    `<rect x="${corridorX}" y="${corridorY}" width="${corridorWidth}" ` +
      `height="${corridorHeight}" rx="3" fill="${FLOOR}"/>`,
    text(
      corridorX - 18,
      corridorY + 28,
      'west · direct',
      13,
      760,
      MUTED,
      'end',
    ),
    text(
      corridorX + corridorWidth + 18,
      corridorY + 28,
      'east · flipX',
      13,
      760,
      MUTED,
    ),
  );

  roomWallRing(
    parts,
    renderer,
    corridorX,
    corridorY,
    columns,
    rows,
    size,
    'back',
    false,
  );
  const characterSize = size * 1.55;
  parts.push(
    renderer.character(
      0,
      'south',
      corridorX + size * 2 - characterSize / 2,
      corridorY + size * 2.6 - characterSize * 0.86,
      characterSize,
    ),
    renderer.character(
      2,
      'north',
      corridorX + size * 2 - characterSize / 2,
      corridorY + size * 4.35 - characterSize * 0.86,
      characterSize,
    ),
  );
  roomWallRing(
    parts,
    renderer,
    corridorX,
    corridorY,
    columns,
    rows,
    size,
    'front',
    false,
  );

  const noteX = x + 650;
  const noteY = corridorY;
  parts.push(
    panel(noteX, noteY, 1810, corridorHeight, PANEL_ALT),
    text(noteX + 30, noteY + 43, 'Corridor-read gate', 18, 820, INK),
    text(noteX + 30, noteY + 84, '• Both long facings must carry equal visual weight without a second authored east bank.', 15, 650, MUTED),
    text(noteX + 30, noteY + 121, '• Cream, coral, green, shade, and dark return must remain continuous through every hidden cell boundary.', 15, 650, MUTED),
    text(noteX + 30, noteY + 158, '• The 112 px envelope must preserve a navigable floor channel at locked character scale.', 15, 650, MUTED),
    `<path d="M ${noteX + 30} ${noteY + 197} H ${noteX + 1780}" stroke="${RULE}"/>`,
    text(noteX + 30, noteY + 240, 'Installed contract', 18, 820, GREEN),
    text(noteX + 30, noteY + 280, 'West: direct masks m06 / m05 / m03', 14, 650, MUTED),
    text(noteX + 30, noteY + 315, 'East: the same vertical source path through runtime flipX', 14, 650, MUTED),
    text(noteX + 30, noteY + 350, 'Top and foreground closures use the accepted corner and horizontal-run masks.', 14, 650, MUTED),
    text(noteX + 30, noteY + 414, 'REVIEW ONLY', 18, 840, CORAL),
    text(noteX + 30, noteY + 447, 'This corridor changes no accepted source, export, or Unity registration.', 14, 700, MUTED),
  );
}

function compactRoom(
  parts: string[],
  renderer: ReviewRenderer,
  x: number,
  y: number,
): void {
  const width = WIDTH - MARGIN * 2;
  const height = 630;
  const size = 90;
  const columns = 10;
  const rows = 6;
  const roomWidth = columns * size;
  const roomHeight = rows * size;
  const roomX = x + 80;
  const roomY = y + 72;
  parts.push(
    panel(x, y, width, height),
    text(x + 26, y + 42, 'Selected 112 · compact gameplay room', 22, 820, GREEN),
    text(
      x + 500,
      y + 42,
      '90 px cells · locked agent scale · direct west wall / runtime-flipped east wall',
      14,
      650,
      MUTED,
    ),
    `<rect x="${roomX}" y="${roomY}" width="${roomWidth}" ` +
      `height="${roomHeight}" fill="${FLOOR}" stroke="#56616A" stroke-width="2"/>`,
  );
  for (let column = 1; column < columns; column += 1) {
    parts.push(
      `<path d="M ${roomX + column * size} ${roomY} ` +
        `V ${roomY + roomHeight}" stroke="${FLOOR_LINE}" stroke-opacity=".16"/>`,
    );
  }
  for (let row = 1; row < rows; row += 1) {
    parts.push(
      `<path d="M ${roomX} ${roomY + row * size} ` +
        `H ${roomX + roomWidth}" stroke="${FLOOR_LINE}" stroke-opacity=".16"/>`,
    );
  }

  roomWallRing(
    parts,
    renderer,
    roomX,
    roomY,
    columns,
    rows,
    size,
    'back',
  );

  const desk = (
    deskX: number,
    deskY: number,
    deskWidth: number,
  ): string =>
    `<rect x="${deskX}" y="${deskY}" width="${deskWidth}" height="68" ` +
    'rx="13" fill="#895B39" stroke="#372C25" stroke-width="5"/>' +
    `<rect x="${deskX + 24}" y="${deskY + 16}" width="${deskWidth - 48}" ` +
    'height="12" rx="4" fill="#26251F"/>' +
    `<circle cx="${deskX + deskWidth - 26}" cy="${deskY + 22}" r="7" ` +
    `fill="${GREEN}" stroke="#302B25" stroke-width="3"/>`;
  parts.push(
    desk(roomX + size * 2.1, roomY + size * 2.05, size * 2.2),
    desk(roomX + size * 6.1, roomY + size * 2.05, size * 1.9),
    `<rect x="${roomX + size * 4.65}" y="${roomY + size * 3.85}" ` +
      'width="150" height="38" rx="12" fill="#C4B995" stroke="#4A4339" stroke-width="4"/>',
    `<circle cx="${roomX + size * 1.55}" cy="${roomY + size * 2.15}" r="32" ` +
      `fill="${GREEN}" stroke="${INK}" stroke-width="5"/>`,
    `<rect x="${roomX + size * 1.35}" y="${roomY + size * 2.38}" ` +
      'width="36" height="45" fill="#9A623D" stroke="#3B3028" stroke-width="4"/>',
  );

  const characterSize = size * 1.55;
  parts.push(
    renderer.character(
      0,
      'south',
      roomX + size * 2.75 - characterSize / 2,
      roomY + size * 2.88 - characterSize * 0.86,
      characterSize,
    ),
    renderer.character(
      1,
      'west',
      roomX + size * 5.15 - characterSize / 2,
      roomY + size * 4.32 - characterSize * 0.86,
      characterSize,
    ),
    renderer.character(
      2,
      'east',
      roomX + size * 7.25 - characterSize / 2,
      roomY + size * 3.30 - characterSize * 0.86,
      characterSize,
    ),
  );
  roomWallRing(
    parts,
    renderer,
    roomX,
    roomY,
    columns,
    rows,
    size,
    'front',
  );

  const noteX = roomX + roomWidth + 70;
  parts.push(
    panel(noteX, roomY, 1260, roomHeight, PANEL_ALT),
    text(noteX + 30, roomY + 43, 'Room-read questions', 18, 820, INK),
    text(noteX + 30, roomY + 84, '1. Does the wall now carry the same weight as agents and desks?', 15, 650, MUTED),
    text(noteX + 30, roomY + 121, '2. Do inner corners preserve a continuous cream/dark lip?', 15, 650, MUTED),
    text(noteX + 30, roomY + 158, '3. Are direct and flipped vertical facings equally substantial?', 15, 650, MUTED),
    text(noteX + 30, roomY + 195, '4. Do the 90 px fronts stay readable without swallowing the floor?', 15, 650, MUTED),
    `<path d="M ${noteX + 30} ${roomY + 230} H ${noteX + 1230}" stroke="${RULE}"/>`,
    text(noteX + 30, roomY + 270, 'Boundaries held constant', 18, 820, GREEN),
    text(noteX + 30, roomY + 308, '128 px source frame · 512 PPU import · centered pivot · renderer scale', 14, 620, MUTED),
    text(noteX + 30, roomY + 341, 'Accepted source paths · mask topology · Unity selection/registration', 14, 620, MUTED),
    text(noteX + 30, roomY + 398, 'Selected review transform', 18, 820, CORAL),
    text(noteX + 30, roomY + 436, '112 px north/west envelope with the south/east frontage datum fixed.', 14, 650, MUTED),
    text(noteX + 30, roomY + 486, 'PROMOTION GATE', 17, 840, INK),
    text(noteX + 30, roomY + 518, 'Review these pixels before any accepted all-47 source migration.', 14, 720, INK),
  );
}

function reviewSheet(
  acceptedFrames: readonly CompiledEqualHeightFrame[],
  selectedFrames: readonly CalibratedEqualHeightFrame[],
): string {
  const renderer = new ReviewRenderer(acceptedFrames, selectedFrames);
  const parts: string[] = [
    defs(),
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAGE}"/>`,
    text(MARGIN, 52, 'QuotaCo equal-height wall · selected 112 all-47 proof', 31, 840),
    text(
      MARGIN,
      82,
      'REVIEW ONLY · accepted source bank at left, in-memory 112 px candidate at right',
      15,
      760,
      CORAL,
    ),
    text(
      MARGIN,
      108,
      'No accepted SVG, mask ledger, exporter, atlas, schema, blob mapping, or Unity registration is changed.',
      14,
      600,
      MUTED,
    ),
    `<path d="M ${MARGIN} 126 H ${WIDTH - MARGIN}" stroke="${RULE}"/>`,
  ];

  const bankY = 148;
  const bankWidth = (WIDTH - MARGIN * 2 - GAP) / 2;
  allMaskBank(
    parts,
    renderer,
    'current',
    MARGIN,
    bankY,
    bankWidth,
    'Current accepted · observed 68 px footprint',
    'Transport/control bank · unchanged accepted geometry',
    CORAL,
  );
  allMaskBank(
    parts,
    renderer,
    'selected',
    MARGIN + bankWidth + GAP,
    bankY,
    bankWidth,
    'Selected review · 112 px footprint',
    'All 47 masks · coherent north/west material expansion',
    GREEN,
  );

  const studiesY = 898;
  gameplayRuns90(parts, renderer, MARGIN, studiesY);
  verticalFacings90(parts, renderer, MARGIN + 1000, studiesY);
  bounded40Study(parts, renderer, MARGIN + 1600, studiesY);

  topologyStudy(parts, renderer, MARGIN, 1568);
  literalCloseups240(parts, renderer, MARGIN, 2088);
  installedLegalFixtures(parts, renderer, MARGIN, 2828);
  compactCorridor(parts, renderer, MARGIN, 3748);
  compactRoom(parts, renderer, MARGIN, 4468);

  parts.push(
    panel(MARGIN, 5118, WIDTH - MARGIN * 2, 50, PANEL_ALT),
    text(
      WIDTH / 2,
      5150,
      'Decision gate: approve the selected all-47 pixels, then migrate the 112 px envelope through the permanent source-owned path.',
      15,
      780,
      INK,
      'middle',
    ),
  );

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" ` +
    `viewBox="0 0 ${WIDTH} ${HEIGHT}">${parts.join('')}</svg>`
  );
}

function parseArgs(args: readonly string[]): CliOptions {
  let output = path.resolve(
    '.style-loop/quota-co-wall-footprint-all-mask',
  );
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument !== '--out') throw new Error(`Unknown argument ${argument}`);
    const value = args[++index];
    if (!value) throw new Error('--out requires a path');
    output = path.resolve(value);
  }
  return { output };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const acceptedFrames = await compileEqualHeightEvaluationFrames({
    sourceRoots: SOURCE_ROOTS,
  });
  const selectedFrames =
    compileSelectedEqualHeightAllMaskFrames(acceptedFrames);
  const source = reviewSheet(acceptedFrames, selectedFrames);
  const png = new Resvg(source, {
    font: { loadSystemFonts: true },
  }).render().asPng();

  await mkdir(options.output, { recursive: true });
  const svgPath = path.join(
    options.output,
    'quota-co-wall-footprint-all-mask-review.svg',
  );
  const pngPath = path.join(
    options.output,
    'quota-co-wall-footprint-all-mask-review.png',
  );
  await writeFile(svgPath, source, 'utf8');
  await writeFile(pngPath, png);
  process.stdout.write(
    `Wrote review-only selected 112 all-47 proof:\n${svgPath}\n${pngPath}\n` +
      `Boundary: ${JSON.stringify(EQUAL_HEIGHT_ALL_MASK_REVIEW_BOUNDARY)}\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
