/**
 * Render the proof-only QuotaCo high-oblique A1a A/B atlas and review sheet.
 *
 *   npm run high-oblique:a1a:preview
 *   npm run high-oblique:a1a:preview -- --out /tmp/quota-co-a1a
 *
 * The raw atlas is transparent and contains only real frame pixels. The labeled
 * sheet embeds those raster pixels; its panels, labels, checker, and guides are
 * presentation-only and never enter a Terrarium bundle.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import { EXPORT_SCALES } from '../src/core/exporter';
import {
  A1A_ATLAS_COLUMNS,
  A1A_ATLAS_ROWS,
  A1A_CANVAS,
  A1A_COMPARISON_STEMS,
  A1A_PALETTE,
  A1A_PROOF_FRAMES,
  A1A_REVIEW_SIZES,
  A1A_RULER,
  A1A_SHARED_FRAME_IDS,
  a1aAtlasDescriptor,
  a1aAtlasSvg,
  a1aComponentLayers,
  a1aFrameSvg,
  getA1aProofFrame,
  type A1aAtlasDescriptor,
  type A1aFrameId,
  type A1aLayer,
} from './highOblique/a1aProof';

const PAGE = '#E8E4D8';
const PANEL = '#F6F1E5';
const INK = '#252A28';
const MUTED = '#606A64';
const RULE = '#A59E8F';
const WIDTH = 1920;
const MARGIN = 48;
const GAP = 24;

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
  size = 18,
  weight = 400,
  color = INK,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return (
    `<text x="${x}" y="${y}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" ` +
    `font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">` +
    `${escapeText(value)}</text>`
  );
}

function panel(x: number, y: number, width: number, height: number, fill = PANEL, radius = 12): string {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}"/>`;
}

function checker(x: number, y: number, width: number, height: number): string {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="6" fill="url(#checker)"/>`;
}

function sectionTitle(parts: string[], y: number, title: string, detail: string): number {
  parts.push(text(MARGIN, y + 28, title, 27, 750));
  parts.push(text(MARGIN, y + 55, detail, 15, 450, MUTED));
  parts.push(`<path d="M ${MARGIN} ${y + 70} H ${WIDTH - MARGIN}" stroke="${RULE}" stroke-width="1"/>`);
  return y + 90;
}

function pngDataUri(bytes: Uint8Array): string {
  return `data:image/png;base64,${Buffer.from(bytes).toString('base64')}`;
}

function atlasFrame(
  atlas: A1aAtlasDescriptor,
  _atlasDataUri: string,
  id: A1aFrameId,
  x: number,
  y: number,
  size: number,
): string {
  const frame = atlas.frames[id];
  return (
    `<svg x="${x}" y="${y}" width="${size}" height="${size}" ` +
    `viewBox="${frame.x} ${frame.y} ${frame.w} ${frame.h}" preserveAspectRatio="none">` +
    '<use href="#atlasPixels"/>' +
    '</svg>'
  );
}

function frameWithChecker(
  atlas: A1aAtlasDescriptor,
  atlasDataUri: string,
  id: A1aFrameId,
  x: number,
  y: number,
  size: number,
): string {
  return checker(x, y, size, size) + atlasFrame(atlas, atlasDataUri, id, x, y, size);
}

function sharedFrames(parts: string[], y: number, atlas: A1aAtlasDescriptor, atlasDataUri: string): number {
  const cell = 132;
  const cols = 11;
  const startX = MARGIN + (WIDTH - MARGIN * 2 - cols * cell) / 2;
  for (let index = 0; index < A1A_SHARED_FRAME_IDS.length; index++) {
    const id = A1A_SHARED_FRAME_IDS[index];
    const frame = getA1aProofFrame(id);
    const x = startX + index * cell;
    parts.push(frameWithChecker(atlas, atlasDataUri, id, x, y, 118));
    const words = frame.label.replace(' — ', '\n').split('\n');
    parts.push(text(x + 59, y + 137, words[0], 11, 700, INK, 'middle'));
    if (words[1]) parts.push(text(x + 59, y + 151, words[1], 10, 500, MUTED, 'middle'));
  }
  return y + 170;
}

function comparisonGrid(parts: string[], y: number, atlas: A1aAtlasDescriptor, atlasDataUri: string): number {
  const cols = 3;
  const cardWidth = (WIDTH - MARGIN * 2 - GAP * (cols - 1)) / cols;
  const cardHeight = 248;
  const image = 166;
  const rows = Math.ceil(A1A_COMPARISON_STEMS.length / cols);
  for (let index = 0; index < A1A_COMPARISON_STEMS.length; index++) {
    const stem = A1A_COMPARISON_STEMS[index];
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = MARGIN + col * (cardWidth + GAP);
    const py = y + row * (cardHeight + GAP);
    const aId = `a_${stem}` as const;
    const bId = `b_${stem}` as const;
    parts.push(panel(x, py, cardWidth, cardHeight));
    parts.push(text(x + 20, py + 30, getA1aProofFrame(aId).label, 17, 750));
    const ax = x + 60;
    const bx = x + cardWidth - 60 - image;
    parts.push(frameWithChecker(atlas, atlasDataUri, aId, ax, py + 48, image));
    parts.push(frameWithChecker(atlas, atlasDataUri, bId, bx, py + 48, image));
    parts.push(text(ax + image / 2, py + 232, 'A · MONOLITHIC', 12, 750, A1A_PALETTE.coral, 'middle'));
    parts.push(text(bx + image / 2, py + 232, 'B · SPLIT COMPOSED', 12, 750, A1A_PALETTE.teal, 'middle'));
    parts.push(`<path d="M ${x + cardWidth / 2} ${py + 54} V ${py + cardHeight - 18}" stroke="${RULE}" stroke-width="1" stroke-dasharray="3 5"/>`);
  }
  return y + rows * cardHeight + (rows - 1) * GAP;
}

function componentRaster(id: A1aFrameId, layers: readonly A1aLayer[]): Uint8Array {
  return new Resvg(a1aFrameSvg(id, A1A_CANVAS, layers)).render().asPng();
}

function componentImage(dataUri: string, x: number, y: number, size: number): string {
  return checker(x, y, size, size) +
    `<image x="${x}" y="${y}" width="${size}" height="${size}" href="${dataUri}"/>`;
}

function splitDiagnostic(parts: string[], y: number, atlas: A1aAtlasDescriptor, atlasDataUri: string): number {
  const id: A1aFrameId = 'b_full_exterior_corner';
  const frame = getA1aProofFrame(id);
  const layers = a1aComponentLayers(frame);
  const baseUri = pngDataUri(componentRaster(id, layers.base));
  const upperUri = pngDataUri(componentRaster(id, layers.upper));
  const size = 230;
  const cardWidth = 330;
  const totalWidth = cardWidth * 3 + GAP * 2;
  const startX = (WIDTH - totalWidth) / 2;
  const entries = [
    { label: 'B BASE ONLY', detail: 'Finished low structural profile', uri: baseUri },
    { label: 'B UPPER ONLY', detail: 'Optional full-height shell delta', uri: upperUri },
    { label: 'B COMPOSED', detail: 'Review and atlas pixels', uri: undefined },
  ] as const;
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index];
    const x = startX + index * (cardWidth + GAP);
    parts.push(panel(x, y, cardWidth, 322, index === 2 ? '#E2E8DE' : PANEL));
    const ix = x + (cardWidth - size) / 2;
    if (entry.uri) parts.push(componentImage(entry.uri, ix, y + 44, size));
    else parts.push(frameWithChecker(atlas, atlasDataUri, id, ix, y + 44, size));
    parts.push(text(x + cardWidth / 2, y + 294, entry.label, 13, 800, index === 2 ? A1A_PALETTE.green : MUTED, 'middle'));
    parts.push(text(x + cardWidth / 2, y + 314, entry.detail, 11, 500, MUTED, 'middle'));
  }
  parts.push(text(WIDTH / 2, y + 354, 'B survives only if the composed seam reads as deliberate construction and the base remains complete by itself.', 15, 600, INK, 'middle'));
  return y + 374;
}

function distanceProof(parts: string[], y: number, atlas: A1aAtlasDescriptor, atlasDataUri: string): number {
  const ids: readonly A1aFrameId[] = [
    'a_full_exterior_corner',
    'b_full_exterior_corner',
    'shared_low_corner',
    'a_door_open',
    'b_door_open',
  ];
  const labels = ['A corner', 'B corner', 'Low corner', 'A open door', 'B open door'];
  const cardWidth = (WIDTH - MARGIN * 2 - GAP * (ids.length - 1)) / ids.length;
  const maxSize = A1A_REVIEW_SIZES.close;
  for (let index = 0; index < ids.length; index++) {
    const x = MARGIN + index * (cardWidth + GAP);
    parts.push(panel(x, y, cardWidth, 398));
    parts.push(text(x + cardWidth / 2, y + 28, labels[index], 15, 750, INK, 'middle'));
    const closeX = x + (cardWidth - maxSize) / 2;
    parts.push(frameWithChecker(atlas, atlasDataUri, ids[index], closeX, y + 44, maxSize));
    parts.push(text(x + cardWidth / 2, y + 300, `${A1A_REVIEW_SIZES.close}px · close`, 11, 600, MUTED, 'middle'));
    const normalX = x + 34;
    const farX = x + cardWidth - 34 - A1A_REVIEW_SIZES.far;
    parts.push(frameWithChecker(atlas, atlasDataUri, ids[index], normalX, y + 318, A1A_REVIEW_SIZES.normal));
    parts.push(frameWithChecker(atlas, atlasDataUri, ids[index], farX, y + 343, A1A_REVIEW_SIZES.far));
    parts.push(text(normalX + A1A_REVIEW_SIZES.normal / 2, y + 390, `${A1A_REVIEW_SIZES.normal}px`, 10, 600, MUTED, 'middle'));
    parts.push(text(farX + A1A_REVIEW_SIZES.far / 2, y + 390, `${A1A_REVIEW_SIZES.far}px`, 10, 600, MUTED, 'middle'));
  }
  return y + 398;
}

function paletteAndGates(parts: string[], y: number): number {
  const cardWidth = (WIDTH - MARGIN * 2 - GAP) / 2;
  parts.push(panel(MARGIN, y, cardWidth, 238));
  parts.push(text(MARGIN + 24, y + 34, 'QuotaCo Building System palette', 20, 750));
  const swatches = [
    ['AGED CREAM', A1A_PALETTE.cream],
    ['DEEP GREEN', A1A_PALETTE.green],
    ['OXIDIZED TEAL', A1A_PALETTE.teal],
    ['CORAL HARDWARE', A1A_PALETTE.coral],
    ['CHARCOAL RECESS', A1A_PALETTE.charcoal],
  ] as const;
  for (let index = 0; index < swatches.length; index++) {
    const [label, color] = swatches[index];
    const sx = MARGIN + 24 + index * 145;
    parts.push(`<rect x="${sx}" y="${y + 58}" width="120" height="64" rx="8" fill="${color}"/>`);
    parts.push(text(sx + 60, y + 143, label, 10, 750, MUTED, 'middle'));
  }
  parts.push(text(MARGIN + 24, y + 180, 'Reserved signals absent: capture amber and emotion rose.', 14, 650, INK));
  parts.push(text(MARGIN + 24, y + 205, 'No directional cast shadow; white/black overlays describe faces only.', 14, 500, MUTED));

  const rightX = MARGIN + cardWidth + GAP;
  parts.push(panel(rightX, y, cardWidth, 238, '#E2E8DE'));
  parts.push(text(rightX + 24, y + 34, 'A1a decision gate', 20, 750));
  const gates = [
    'Flat floors never become product plinths.',
    'Low profiles preserve the interaction/feet clearance zone.',
    'Doors remain visibly walkable when open.',
    'Cream, green, and teal bands turn without jumps.',
    'B loses on a visual tie or any extra profile state.',
    'No mask_*, schema, importer, or production-scene claim.',
  ];
  for (let index = 0; index < gates.length; index++) {
    const gy = y + 65 + index * 27;
    parts.push(`<circle cx="${rightX + 31}" cy="${gy - 5}" r="4" fill="${A1A_PALETTE.green}"/>`);
    parts.push(text(rightX + 45, gy, gates[index], 14, index === 4 ? 700 : 500, index === 4 ? INK : MUTED));
  }
  return y + 238;
}

function reviewSheet(atlas: A1aAtlasDescriptor, atlasPng: Uint8Array): string {
  const atlasUri = pngDataUri(atlasPng);
  const parts: string[] = [
    `<defs><pattern id="checker" width="16" height="16" patternUnits="userSpaceOnUse">` +
      '<rect width="16" height="16" fill="#B9B9B2"/>' +
      '<rect width="8" height="8" fill="#D6D5CC"/><rect x="8" y="8" width="8" height="8" fill="#D6D5CC"/>' +
      `</pattern><image id="atlasPixels" x="0" y="0" width="${atlas.width}" height="${atlas.height}" ` +
      `href="${atlasUri}" image-rendering="auto"/></defs>`,
    `<rect width="${WIDTH}" height="5000" fill="${PAGE}"/>`,
  ];
  let y = 42;
  parts.push(text(MARGIN, y + 36, 'QuotaCo Building System · A1a high-oblique A/B strip', 34, 800));
  parts.push(text(MARGIN, y + 69, 'Proof-only raster frames · fixed orthographic rectangular grid · flat floors · no baked cast shadow', 17, 500, MUTED));
  parts.push(text(WIDTH - MARGIN, y + 35, '29 FRAMES · 128-UNIT CANVAS', 14, 800, A1A_PALETTE.green, 'end'));
  parts.push(text(WIDTH - MARGIN, y + 61, `${A1A_ATLAS_COLUMNS}×${A1A_ATLAS_ROWS} PADDED ATLAS · TEMPORARY IDS`, 12, 650, MUTED, 'end'));
  y += 102;

  y = sectionTitle(parts, y, 'Shared projection context', `Provisional ruler: full ${A1A_RULER.fullProfile} · low ${A1A_RULER.lowProfile} · cap ${A1A_RULER.capPlane} · doorway clear ${A1A_RULER.doorwayClear} design units`);
  y = sharedFrames(parts, y, atlas, atlasUri) + 16;

  y = sectionTitle(parts, y, 'Same nine situations, two constructions', 'A is one authored shell; B is a finished low base plus an optional upper shell. Neither is a production contract.');
  y = comparisonGrid(parts, y, atlas, atlasUri) + 24;

  y = sectionTitle(parts, y, 'Split-construction diagnostic', 'The component views are proof rasters; the composed cell is the exact frame stored in the transparent atlas.');
  y = splitDiagnostic(parts, y, atlas, atlasUri) + 8;

  y = sectionTitle(parts, y, 'Gameplay-distance proof', 'Calculated 720p targets: 240px close · 90px person-readable · 40px full-office/far. Final acceptance remains Unity-owned.');
  y = distanceProof(parts, y, atlas, atlasUri) + 24;

  y = sectionTitle(parts, y, 'Material and rejection rules', 'QuotaCo provenance must survive without labels; the raw atlas contains none of this presentation chrome.');
  y = paletteAndGates(parts, y) + MARGIN;

  const height = Math.ceil(y);
  parts[1] = `<rect width="${WIDTH}" height="${height}" fill="${PAGE}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}">${parts.join('')}</svg>`;
}

function outputDirectory(args: string[]): string {
  let output = 'docs/previews';
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument !== '--out') throw new Error(`Unknown argument ${argument}`);
    const value = args[++index];
    if (!value) throw new Error('--out requires a directory');
    output = value;
  }
  return resolve(process.cwd(), output);
}

function main(): void {
  const directory = outputDirectory(process.argv.slice(2));
  mkdirSync(directory, { recursive: true });

  const atlasPngs = new Map<number, Uint8Array>();
  for (const scale of EXPORT_SCALES) {
    const descriptor = a1aAtlasDescriptor(scale);
    const source = a1aAtlasSvg(scale);
    const bytes = new Resvg(source).render().asPng();
    atlasPngs.set(scale, bytes);
    writeFileSync(join(directory, `quota-co-high-oblique-a1a-atlas@${scale}x.png`), bytes);
    writeFileSync(
      join(directory, `quota-co-high-oblique-a1a-atlas@${scale}x.json`),
      `${JSON.stringify(descriptor, null, 2)}\n`,
    );
    if (scale === 1) writeFileSync(join(directory, 'quota-co-high-oblique-a1a-atlas.svg'), source);
  }

  const oneX = atlasPngs.get(1);
  if (!oneX) throw new Error('A1a 1x atlas was not rendered');
  const reviewSvg = reviewSheet(a1aAtlasDescriptor(1), oneX);
  const reviewPng = new Resvg(reviewSvg).render().asPng();
  writeFileSync(join(directory, 'quota-co-high-oblique-a1a-review.svg'), reviewSvg);
  writeFileSync(join(directory, 'quota-co-high-oblique-a1a-review.png'), reviewPng);
  writeFileSync(
    join(directory, 'quota-co-high-oblique-a1a-review.html'),
    '<!doctype html><meta charset="utf-8"><title>QuotaCo high-oblique A1a A/B strip</title>' +
      '<style>html{background:#252a28;color:#f6f1e5;font-family:sans-serif}body{margin:24px}' +
      'img{display:block;max-width:100%;height:auto;margin-bottom:20px}a{color:#83a9a6;margin-right:16px}</style>' +
      '<h1>QuotaCo high-oblique A1a A/B strip</h1>' +
      '<p>Proof-only review output. No production bundle or schema claim.</p>' +
      '<img src="quota-co-high-oblique-a1a-review.png" alt="QuotaCo high-oblique A1a monolithic versus split construction review">' +
      EXPORT_SCALES.map((scale) =>
        `<a href="quota-co-high-oblique-a1a-atlas@${scale}x.png">transparent atlas ${scale}×</a>`).join('') +
      '<a href="quota-co-high-oblique-a1a-atlas@1x.json">proof manifest</a>',
  );

  process.stdout.write(
    `Wrote QuotaCo high-oblique A1a proof (${A1A_PROOF_FRAMES.length} frames, ` +
    `${A1A_ATLAS_COLUMNS}x${A1A_ATLAS_ROWS}, scales ${EXPORT_SCALES.join('/')}) to ${directory}\n`,
  );
}

main();
