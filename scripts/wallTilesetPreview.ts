/**
 * Wall-tileset preview sheet — a headless contact sheet for eyeballing wall art
 * (the full-cell-wall re-author, grid-rescale plan Phase 2) WITHOUT the Unity
 * round-trip. For each requested wall it renders the 16 autotile masks in a 4x4
 * grid AND a sample room (DEMO_ROOM) so you can see how the masks tile together
 * — corners, tees, and a doorway — against a floor swatch.
 *
 *   npx tsx scripts/wallTilesetPreview.ts [wallId...] [--out DIR]
 *   (default walls: office-wall branded-wall demising-wall; default DIR docs/previews)
 *
 * Writes wall-preview-<id>.png (4x) per wall.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

import { composeWallTile, composeWallRoom } from '../src/core/compositor';
import { maskName } from '../src/tiles/templates';
import { DEFAULT_STYLE } from '../src/data/defaults';
import type { TileInstance } from '../src/core/types';

// A sample room: outer walls, an interior partition, and a doorway gap (row 4).
const DEMO_ROOM = [
  [1, 1, 1, 1, 1, 1],
  [1, 0, 0, 1, 0, 1],
  [1, 0, 0, 1, 0, 1],
  [1, 1, 0, 1, 1, 1],
  [1, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1],
];

// Floor + chrome swatches so the wall's edge/outline reads against open floor.
const FLOOR = '#6E6A62';
const PANEL = '#ECEFF1';
const LABEL = '#3A464C';
const T = 128; // design units per tile

const wallInstance = (id: string): TileInstance => ({
  id: `preview-${id}`,
  name: id,
  templateId: id,
  // Neutral warm-gray wall so primary/secondary/accent all read distinctly.
  params: {},
  palette: { primary: '#BDB9AF', secondary: '#6F6C64', accent: '#C6603C' },
});

function svgInner(svg: string): string {
  return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

function sheetFor(id: string): string {
  const wall = wallInstance(id);
  const gap = 12;
  const gridW = 4 * T;
  const roomCols = DEMO_ROOM[0].length;
  const roomRows = DEMO_ROOM.length;
  const roomW = roomCols * T;
  const roomH = roomRows * T;
  const contentH = Math.max(4 * T, roomH);
  const W = gridW + gap + roomW;
  const H = contentH + 40; // header strip

  const parts: string[] = [];
  parts.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="${PANEL}"/>`);
  parts.push(`<text x="8" y="26" font-family="sans-serif" font-size="22" font-weight="700" fill="${LABEL}">${id}</text>`);

  const top = 40;
  // Left: 16-mask 4x4 grid on a floor swatch.
  parts.push(`<rect x="0" y="${top}" width="${gridW}" height="${4 * T}" fill="${FLOOR}"/>`);
  for (let mask = 0; mask < 16; mask++) {
    const cx = (mask % 4) * T;
    const cy = top + Math.floor(mask / 4) * T;
    parts.push(`<g transform="translate(${cx} ${cy})">${svgInner(composeWallTile(wall, DEFAULT_STYLE, mask, T))}</g>`);
    parts.push(`<text x="${cx + 3}" y="${cy + 14}" font-family="sans-serif" font-size="11" fill="#FFFFFFCC">${mask} ${maskName(mask)}</text>`);
  }
  // Right: a real room on a floor swatch.
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
