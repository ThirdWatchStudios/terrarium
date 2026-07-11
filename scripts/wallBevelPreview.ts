/**
 * Focused authored-wall approval sheet.
 *
 *   npm run walls:preview
 *   npm run walls:preview -- --out /tmp/terrarium-wall-proof
 *
 * Writes one SVG, one PNG, and a tiny HTML wrapper. Rasterization is deliberately
 * single-process so this review surface does not recreate the full export's
 * memory pressure during art iteration.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import {
  composeProceduralOfficeWallTile,
  composeWallTile,
} from '../src/core/compositor';
import type { PropPalette, ShapeSpec, TileInstance } from '../src/core/types';
import { DEFAULT_STYLE } from '../src/data/defaults';
import { BLOB_CONFIGS, BLOB_TILE_COUNT, NB } from '../src/tiles/blob';
import { WALL_BEVEL_ART } from '../src/tiles/generated/importedWallBevelArt';
import { blobTileLabel } from '../src/tiles/templates';
import { WALL_BEVEL_PIECE_IDS } from '../src/tiles/wallBevelContract';

const CANVAS = 128;
const MARGIN = 32;
const GAP = 32;
const PANEL = '#E9EDF0';
const INK = '#26343B';
const MUTED = '#65737A';
const FLOOR = '#8A8478';
const WIDTH = 1664;

const PALETTES: readonly { label: string; value: PropPalette }[] = [
  {
    label: 'Dark slate',
    value: { primary: '#333333', secondary: '#777777', accent: '#C6603C' },
  },
  {
    label: 'Warm wood',
    value: { primary: '#5A4633', secondary: '#A78968', accent: '#CF784A' },
  },
  {
    label: 'Light concrete',
    value: { primary: '#8B8E8D', secondary: '#C1C4C1', accent: '#B25C43' },
  },
];

const DEMO_ROOM = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1],
  [1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
] as const;

type TileRenderer = (wall: TileInstance, neighbors: number, size: number) => string;

const previousTile: TileRenderer = (wall, neighbors, size) =>
  composeProceduralOfficeWallTile(wall, DEFAULT_STYLE, neighbors, size);
const authoredTile: TileRenderer = (wall, neighbors, size) =>
  composeWallTile(wall, DEFAULT_STYLE, neighbors, size);

function wall(palette: PropPalette): TileInstance {
  return {
    id: 'wall-bevel-proof',
    name: 'Office wall bevel proof',
    templateId: 'office-wall',
    params: {},
    palette: { ...palette },
  };
}

function svgInner(svg: string): string {
  return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

function clippedTile(x: number, y: number, size: number, svg: string): string {
  return (
    `<svg x="${x}" y="${y}" width="${size}" height="${size}" ` +
    `viewBox="0 0 ${CANVAS} ${CANVAS}">${svgInner(svg)}</svg>`
  );
}

function shapeMarkup(shape: ShapeSpec): string {
  const attributes = [`d="${shape.d}"`, `fill="${shape.fill ?? 'none'}"`];
  if (shape.stroke) {
    attributes.push(`stroke="${shape.stroke}"`);
    attributes.push(`stroke-width="${shape.strokeWidth ?? 1.5}"`);
    attributes.push('stroke-linecap="round" stroke-linejoin="round"');
  }
  if (shape.opacity !== undefined) attributes.push(`opacity="${shape.opacity}"`);
  return `<path ${attributes.join(' ')}/>`;
}

function text(x: number, y: number, value: string, size = 18, weight = 400, color = INK): string {
  return `<text x="${x}" y="${y}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${value}</text>`;
}

function title(parts: string[], y: number, value: string, detail?: string): number {
  parts.push(text(MARGIN, y + 24, value, 24, 700));
  if (detail) parts.push(text(MARGIN, y + 49, detail, 15, 400, MUTED));
  return y + (detail ? 66 : 42);
}

function pieceAtlas(parts: string[], y: number): number {
  const cell = 96;
  const labelHeight = 22;
  const cols = 6;
  const startX = MARGIN + (WIDTH - MARGIN * 2 - cols * cell) / 2;
  for (let index = 0; index < WALL_BEVEL_PIECE_IDS.length; index++) {
    const id = WALL_BEVEL_PIECE_IDS[index];
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = startX + col * cell;
    const py = y + row * (cell + labelHeight + 12);
    parts.push(`<rect x="${x}" y="${py}" width="${cell}" height="${cell}" rx="4" fill="#5E6167"/>`);
    parts.push(
      `<g transform="translate(${x} ${py}) scale(${cell / CANVAS})">` +
      WALL_BEVEL_ART[id].map(shapeMarkup).join('') +
      '</g>',
    );
    parts.push(text(x + cell / 2, py + cell + 17, id, 11, 600, MUTED).replace('<text ', '<text text-anchor="middle" '));
  }
  return y + 2 * (cell + labelHeight + 12);
}

function tileGrid(
  parts: string[],
  x: number,
  y: number,
  label: string,
  renderer: TileRenderer,
  palette: PropPalette,
): void {
  const cell = 92;
  const cols = 8;
  parts.push(text(x, y - 10, label, 18, 700));
  for (let index = 0; index < BLOB_TILE_COUNT; index++) {
    const cx = x + (index % cols) * cell;
    const cy = y + Math.floor(index / cols) * cell;
    parts.push(`<rect x="${cx}" y="${cy}" width="${cell}" height="${cell}" fill="${FLOOR}"/>`);
    parts.push(clippedTile(cx, cy, cell, renderer(wall(palette), BLOB_CONFIGS[index], CANVAS)));
    parts.push(text(cx + 3, cy + 12, `${index} ${blobTileLabel(index)}`, 8, 600, '#FFFFFFD8'));
  }
}

function roomNeighbors(row: number, col: number): number {
  const at = (r: number, c: number) => DEMO_ROOM[r]?.[c] === 1;
  return (
    (at(row - 1, col) ? NB.N : 0) |
    (at(row, col + 1) ? NB.E : 0) |
    (at(row + 1, col) ? NB.S : 0) |
    (at(row, col - 1) ? NB.W : 0) |
    (at(row - 1, col + 1) ? NB.NE : 0) |
    (at(row + 1, col + 1) ? NB.SE : 0) |
    (at(row + 1, col - 1) ? NB.SW : 0) |
    (at(row - 1, col - 1) ? NB.NW : 0)
  );
}

function room(
  parts: string[],
  x: number,
  y: number,
  label: string,
  renderer: TileRenderer,
  palette: PropPalette,
): void {
  const cell = 62;
  const rows = DEMO_ROOM.length;
  const cols = DEMO_ROOM[0].length;
  parts.push(text(x, y - 10, label, 18, 700));
  parts.push(`<rect x="${x}" y="${y}" width="${cols * cell}" height="${rows * cell}" fill="${FLOOR}"/>`);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (DEMO_ROOM[row][col] !== 1) continue;
      const tx = x + col * cell;
      const ty = y + row * cell;
      parts.push(
        `<svg x="${tx}" y="${ty}" width="${cell}" height="${cell}" viewBox="0 0 ${CANVAS} ${CANVAS}">` +
        svgInner(renderer(wall(palette), roomNeighbors(row, col), CANVAS)) +
        '</svg>',
      );
    }
  }
}

const TOPOLOGY_SAMPLES = [
  { label: 'isolated', mask: 0 },
  { label: 'end', mask: NB.E },
  { label: 'inside', mask: NB.N | NB.E },
  { label: 'filled', mask: NB.N | NB.E | NB.NE },
  { label: '4 notches', mask: NB.N | NB.E | NB.S | NB.W },
  { label: 'interior', mask: 0xff },
] as const;

function paletteRows(parts: string[], y: number): number {
  const cell = 58;
  const setWidth = TOPOLOGY_SAMPLES.length * cell;
  const previousX = MARGIN + 180;
  const authoredX = previousX + setWidth + 70;
  parts.push(text(previousX, y - 10, 'Previous', 16, 700));
  parts.push(text(authoredX, y - 10, 'Authored', 16, 700));
  for (let row = 0; row < PALETTES.length; row++) {
    const palette = PALETTES[row];
    const py = y + row * (cell + 30);
    parts.push(text(MARGIN, py + 34, palette.label, 16, 600));
    for (let sample = 0; sample < TOPOLOGY_SAMPLES.length; sample++) {
      const topology = TOPOLOGY_SAMPLES[sample];
      for (const [baseX, renderer] of [[previousX, previousTile], [authoredX, authoredTile]] as const) {
        const x = baseX + sample * cell;
        parts.push(`<rect x="${x}" y="${py}" width="${cell}" height="${cell}" fill="${FLOOR}"/>`);
        parts.push(clippedTile(x, py, cell, renderer(wall(palette.value), topology.mask, CANVAS)));
      }
      if (row === PALETTES.length - 1) {
        const labelX = previousX + sample * cell + cell / 2;
        parts.push(text(labelX, py + cell + 14, topology.label, 9, 500, MUTED).replace('<text ', '<text text-anchor="middle" '));
        const authoredLabelX = authoredX + sample * cell + cell / 2;
        parts.push(text(authoredLabelX, py + cell + 14, topology.label, 9, 500, MUTED).replace('<text ', '<text text-anchor="middle" '));
      }
    }
  }
  return y + PALETTES.length * (cell + 30) + 8;
}

function distanceStrip(parts: string[], y: number): number {
  const sample = NB.N | NB.E;
  const startX = MARGIN + 220;
  for (const [row, label, renderer] of [
    [0, 'Previous', previousTile],
    [1, 'Authored', authoredTile],
  ] as const) {
    const py = y + row * 150;
    parts.push(text(MARGIN, py + 68, label, 18, 700));
    let x = startX;
    for (const size of [128, 64, 32] as const) {
      parts.push(`<rect x="${x}" y="${py}" width="${size}" height="${size}" fill="${FLOOR}"/>`);
      parts.push(clippedTile(x, py, size, renderer(wall(PALETTES[0].value), sample, CANVAS)));
      parts.push(text(x + size / 2, py + size + 17, `${size}px`, 12, 600, MUTED).replace('<text ', '<text text-anchor="middle" '));
      x += size + 50;
    }
  }
  return y + 300;
}

function sheet(): string {
  const parts: string[] = [];
  let y = MARGIN;
  parts.push(`<rect width="${WIDTH}" height="2700" fill="${PANEL}"/>`);
  parts.push(text(MARGIN, y + 30, 'Office wall — authored 12-piece bevel pilot', 30, 750));
  parts.push(text(MARGIN, y + 58, 'Previous procedural render versus canonical SVG kit; topology, palette, and 47-blob mapping stay fixed while the Office exposed boundary is intentionally inset.', 15, 400, MUTED));
  y += 92;

  y = title(parts, y, 'Canonical source atlas', '4 fixed-light edges · 4 convex corners · 4 concave corners') + 6;
  y = pieceAtlas(parts, y) + GAP;

  y = title(parts, y, 'Complete 47-tile comparison', 'Every canonical blob configuration, including inside-corner states') + 18;
  tileGrid(parts, MARGIN, y, 'Previous procedural bevel', previousTile, PALETTES[0].value);
  tileGrid(parts, MARGIN + 8 * 92 + GAP, y, 'Authored bevel', authoredTile, PALETTES[0].value);
  y += 6 * 92 + 46;

  y = title(parts, y, 'Complex-room assembly', 'L turns, tees, open ends, thick runs, concave pockets, and a doorway-sized gap') + 18;
  room(parts, MARGIN + 100, y, 'Previous', previousTile, PALETTES[0].value);
  room(parts, WIDTH / 2 + 40, y, 'Authored', authoredTile, PALETTES[0].value);
  y += DEMO_ROOM.length * 62 + 46;

  y = title(parts, y, 'Palette and topology proof', 'Lighting art stays neutral white/black and composes over shipped wall colors') + 18;
  y = paletteRows(parts, y) + GAP;

  y = title(parts, y, 'Game-distance proof', 'A concave N/E pocket at literal 128, 64, and 32 pixel sizes') + 18;
  y = distanceStrip(parts, y) + MARGIN;

  const height = Math.ceil(y);
  parts[0] = `<rect width="${WIDTH}" height="${height}" fill="${PANEL}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}">${parts.join('')}</svg>`;
}

function outputDirectory(args: string[]): string {
  let out = 'docs/previews';
  for (let index = 0; index < args.length; index++) {
    if (args[index] !== '--out') throw new Error(`Unknown argument ${args[index]}`);
    const value = args[++index];
    if (!value) throw new Error('--out requires a directory');
    out = value;
  }
  return resolve(process.cwd(), out);
}

const directory = outputDirectory(process.argv.slice(2));
mkdirSync(directory, { recursive: true });
const source = sheet();
const svgPath = join(directory, 'wall-bevel-office-comparison.svg');
const pngPath = join(directory, 'wall-bevel-office-comparison.png');
const htmlPath = join(directory, 'wall-bevel-office-comparison.html');
writeFileSync(svgPath, source);
writeFileSync(pngPath, new Resvg(source).render().asPng());
writeFileSync(
  htmlPath,
  '<!doctype html><meta charset="utf-8"><title>Office wall bevel comparison</title>' +
    '<style>html{background:#222}body{margin:0;text-align:center}img{max-width:100%;height:auto}</style>' +
    '<img src="wall-bevel-office-comparison.svg" alt="Previous and authored Office wall bevel comparison">',
);
process.stdout.write(`Wrote ${svgPath}\nWrote ${pngPath}\nWrote ${htmlPath}\n`);
