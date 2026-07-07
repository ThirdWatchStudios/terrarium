/**
 * Wall-tileset preview sheet — a headless contact sheet for eyeballing wall art
 * (now the 47-tile blob autotile; wall-autotile-47-blob plan Phase 1) WITHOUT
 * the Unity round-trip. For each requested wall it renders the 47 blob tiles in
 * an 8x6 grid AND a COMPLEX room (L-shapes, tees, wall-ends, a 2-thick wall)
 * that exercises every junction type — especially the inside/concave corners the
 * blob's diagonal info exists to fix — against a floor swatch.
 *
 *   npx tsx scripts/wallTilesetPreview.ts [wallId...] [--out DIR]
 *   (default walls: office-wall branded-wall demising-wall; default DIR docs/previews)
 *
 * Writes wall-preview-<id>.png (1.5x) per wall.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

import { composeWallTile, composeWallRoom } from '../src/core/compositor';
import { blobTileLabel } from '../src/tiles/templates';
import { BLOB_CONFIGS, BLOB_TILE_COUNT } from '../src/tiles/blob';
import { DEFAULT_STYLE } from '../src/data/defaults';
import type { TileInstance } from '../src/core/types';

// A COMPLEX room exercising every junction type the 47-blob exists for:
// - the outer ring's four inside corners (concave, pockets facing in),
// - an L-shaped interior wall (rows 1-3) with inside corners on both faces,
// - tees into the outer ring and a free-standing wall-end (col 2, rows 5-6),
// - a 2-cell-thick wall slab (rows 7-8) — interior cells must stay flat, its
//   step corners concave, and its junction into the outer ring clean,
// - a doorway-sized gap (row 4) between runs.
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
];

// Floor + chrome swatches so the wall's edge/outline reads against open floor.
// Floor sits LIGHTER than the wall top, like the game (RimWorld rooms are light
// floors ringed by dark wall mass).
const FLOOR = '#8A8478';
const PANEL = '#ECEFF1';
const LABEL = '#3A464C';
const T = 128; // design units per tile

// Overridable via --primary/--secondary (hex) to judge other material tones —
// e.g. RimWorld's dark wood (--primary '#5A4633').
const PALETTE = {
  // RimWorld-valued slate: the TOP surface reads dark (you look down onto the
  // mass) and the white-overlay front face lands near RimWorld's lit stone.
  primary: '#5E6167',
  secondary: '#8E9196',
  accent: '#C6603C',
};

const wallInstance = (id: string): TileInstance => ({
  id: `preview-${id}`,
  name: id,
  templateId: id,
  params: {},
  palette: { ...PALETTE },
});

function svgInner(svg: string): string {
  return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

function sheetFor(id: string): string {
  const wall = wallInstance(id);
  const gap = 12;
  const gridCols = 8;
  const gridRows = Math.ceil(BLOB_TILE_COUNT / gridCols);
  const gridW = gridCols * T;
  const gridH = gridRows * T;
  const roomCols = DEMO_ROOM[0].length;
  const roomRows = DEMO_ROOM.length;
  const roomW = roomCols * T;
  const roomH = roomRows * T;
  const contentH = Math.max(gridH, roomH);
  const W = gridW + gap + roomW;
  const H = contentH + 40; // header strip

  const parts: string[] = [];
  parts.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="${PANEL}"/>`);
  parts.push(`<text x="8" y="26" font-family="sans-serif" font-size="22" font-weight="700" fill="${LABEL}">${id} — 47-blob</text>`);

  const top = 40;
  // Left: the 47-tile blob catalog (8x6) on a floor swatch.
  parts.push(`<rect x="0" y="${top}" width="${gridW}" height="${gridH}" fill="${FLOOR}"/>`);
  for (let i = 0; i < BLOB_TILE_COUNT; i++) {
    const cx = (i % gridCols) * T;
    const cy = top + Math.floor(i / gridCols) * T;
    parts.push(`<g transform="translate(${cx} ${cy})">${svgInner(composeWallTile(wall, DEFAULT_STYLE, BLOB_CONFIGS[i], T))}</g>`);
    parts.push(`<text x="${cx + 3}" y="${cy + 14}" font-family="sans-serif" font-size="11" fill="#FFFFFFCC">${i} ${blobTileLabel(i)}</text>`);
  }
  // Right: the complex room on a floor swatch (composeWallRoom computes the
  // 8-neighbor blob config per cell from the grid, diagonals included).
  const rx = gridW + gap;
  parts.push(`<rect x="${rx}" y="${top}" width="${roomW}" height="${roomH}" fill="${FLOOR}"/>`);
  parts.push(`<g transform="translate(${rx} ${top})">${svgInner(composeWallRoom(wall, DEFAULT_STYLE, DEMO_ROOM, T))}</g>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts.join('')}</svg>`;
}

const args = process.argv.slice(2);
let outDir = 'docs/previews';
const ids: string[] = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out') outDir = args[++i];
  else if (args[i] === '--primary') PALETTE.primary = args[++i];
  else if (args[i] === '--secondary') PALETTE.secondary = args[++i];
  else ids.push(args[i]);
}
if (ids.length === 0) ids.push('office-wall', 'branded-wall', 'demising-wall');

const dir = resolve(process.cwd(), outDir);
mkdirSync(dir, { recursive: true });
for (const id of ids) {
  const svg = sheetFor(id);
  const png = new Resvg(svg, { fitTo: { mode: 'zoom', value: 1.5 } }).render().asPng();
  const file = join(dir, `wall-preview-${id}.png`);
  writeFileSync(file, png);
  console.log(`wrote ${file}`);
}
