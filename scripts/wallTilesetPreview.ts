/**
 * Wall-tileset preview sheet — a headless contact sheet for eyeballing wall art
 * (now the 47-tile blob autotile; wall-autotile-47-blob plan Phase 1) WITHOUT
 * the Unity round-trip. For each requested wall it renders the 47 blob tiles in
 * an 8x6 grid AND a COMPLEX room (L-shapes, tees, wall-ends, a 2-thick wall)
 * that exercises every junction type — especially the inside/concave corners the
 * blob's diagonal info exists to fix — against a floor swatch.
 *
 *   npx tsx scripts/wallTilesetPreview.ts [wallId...] [--out DIR]
 *   (default: all eight opaque walls; default DIR docs/previews)
 *
 * Writes one runtime-clipped SVG + 1x PNG per wall and an HTML index. Rendering
 * stays serial so only one 2444×1320 proof is resident at a time.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

import { composeWallTile, composeWallRoom } from '../src/core/compositor';
import { blobTileLabel } from '../src/tiles/templates';
import { BLOB_CONFIGS, BLOB_TILE_COUNT } from '../src/tiles/blob';
import { DEFAULT_STYLE, DEFAULT_WALLS } from '../src/data/defaults';
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
const PALETTE_OVERRIDES: Partial<TileInstance['palette']> = {};

const DEFAULT_OPAQUE_WALLS = [
  'office-wall',
  'cubicle-partition',
  'brick-wall',
  'panel-wall',
  'living-wall',
  'branded-wall',
  'slat-wall',
  'demising-wall',
] as const;

function wallInstance(id: string): TileInstance {
  const source = DEFAULT_WALLS.find((candidate) => candidate.id === id || candidate.templateId === id);
  if (!source) throw new Error(`Unknown shipped wall ${id}`);
  return {
    ...source,
    params: { ...source.params },
    palette: { ...source.palette, ...PALETTE_OVERRIDES },
  };
}

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
    parts.push(
      `<svg x="${cx}" y="${cy}" width="${T}" height="${T}" viewBox="0 0 ${T} ${T}">` +
      `${svgInner(composeWallTile(wall, DEFAULT_STYLE, BLOB_CONFIGS[i], T))}</svg>`,
    );
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
  else if (args[i] === '--primary') PALETTE_OVERRIDES.primary = args[++i];
  else if (args[i] === '--secondary') PALETTE_OVERRIDES.secondary = args[++i];
  else ids.push(args[i]);
}
if (ids.length === 0) ids.push(...DEFAULT_OPAQUE_WALLS);

const dir = resolve(process.cwd(), outDir);
mkdirSync(dir, { recursive: true });
const indexItems: string[] = [];
for (const id of ids) {
  const svg = sheetFor(id);
  const base = `wall-preview-${id}`;
  const svgFile = join(dir, `${base}.svg`);
  const pngFile = join(dir, `${base}.png`);
  writeFileSync(svgFile, svg);
  writeFileSync(pngFile, new Resvg(svg).render().asPng());
  // The SVG intentionally contains one clipped viewport per runtime tile.
  // Fractionally scaling that nested SVG in a browser independently antialiases
  // the viewports and creates false hairline seams. Display the already-composed
  // raster in the review index; retain the SVG as the scalable source/download.
  indexItems.push(
    `<figure><figcaption>${id} · <a href="${base}.svg">SVG source</a></figcaption>` +
    `<img src="${base}.png" loading="lazy" decoding="async" alt="${id} 47-tile and complex-room proof"></figure>`,
  );
  console.log(`wrote ${svgFile}`);
  console.log(`wrote ${pngFile}`);
}

const indexFile = join(dir, 'wall-preview-opaque-walls.html');
writeFileSync(
  indexFile,
  '<!doctype html><meta charset="utf-8"><title>Opaque wall promotion proof</title>' +
  '<style>html{background:#222;color:#eee;font-family:sans-serif}body{margin:24px}' +
  'figure{margin:0 0 32px}figcaption{font-size:20px;margin-bottom:8px}' +
  'a{color:#9ecbff}img{display:block;max-width:100%;height:auto;background:#fff}</style>' +
  indexItems.join(''),
);
console.log(`wrote ${indexFile}`);
