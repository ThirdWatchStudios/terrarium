/**
 * Render the first editable-SVG QuotaCo Building System B pass.
 *
 *   npm run high-oblique:a1b:preview
 *   npm run high-oblique:a1b:preview -- --out /tmp/quota-co-a1b
 *
 * The transparent atlas contains only compiled source pixels. Labels,
 * checkerboards, and status notes exist solely on the review sheet.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import { EXPORT_SCALES } from '../src/core/exporter';
import { A1A_PALETTE, A1A_REVIEW_SIZES } from './highOblique/a1aProof';
import { loadA1bAuthoredBFamily } from './highOblique/a1bAuthored';
import {
  A1B_ATLAS_COLUMNS,
  A1B_ATLAS_ROWS,
  A1B_AUTHORED_STEMS,
  a1bAuthoredAtlasDescriptor,
  a1bAuthoredAtlasSvg,
  buildA1bAuthoredFrames,
  type A1bAuthoredAtlasDescriptor,
  type A1bAuthoredFrameId,
  type A1bAuthoredFrameKind,
  type A1bAuthoredStem,
} from './highOblique/a1bAuthoredProof';

const PAGE = '#E8E4D8';
const PANEL = '#F6F1E5';
const COMPOSED_PANEL = '#E2E8DE';
const INK = '#252A28';
const MUTED = '#606A64';
const RULE = '#A59E8F';
const WIDTH = 1920;
const MARGIN = 48;
const GAP = 24;

const STEM_LABELS: Readonly<Record<A1bAuthoredStem, string>> = {
  full_n_straight: 'Full north wall — straight',
  full_w_straight: 'Full west wall — straight',
  full_exterior_corner: 'Full wall — exterior corner',
  full_terminus: 'Full wall — terminus',
  transition_n_to_e: 'Full north → low east',
  transition_w_to_s: 'Full west → full south (promoted SW)',
  door_closed: 'Directional door — closed',
  door_open: 'Directional door — open',
  window_wide: 'Full wall — wide window',
};

interface CliOptions {
  readonly input: string;
  readonly output: string;
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

function panel(x: number, y: number, width: number, height: number, fill = PANEL): string {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="12" fill="${fill}"/>`;
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

function frameId(stem: A1bAuthoredStem, kind: A1bAuthoredFrameKind): A1bAuthoredFrameId {
  return `b_${stem}_${kind}`;
}

function atlasFrame(
  atlas: A1bAuthoredAtlasDescriptor,
  id: A1bAuthoredFrameId,
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
  atlas: A1bAuthoredAtlasDescriptor,
  id: A1bAuthoredFrameId,
  x: number,
  y: number,
  size: number,
): string {
  return checker(x, y, size, size) + atlasFrame(atlas, id, x, y, size);
}

function sourceCards(parts: string[], y: number, atlas: A1bAuthoredAtlasDescriptor): number {
  const columns = 3;
  const cardWidth = (WIDTH - MARGIN * 2 - GAP * (columns - 1)) / columns;
  const cardHeight = 252;
  const imageSize = 150;
  const imageGap = 30;
  const imageBlockWidth = imageSize * 3 + imageGap * 2;
  const rows = Math.ceil(A1B_AUTHORED_STEMS.length / columns);

  for (let index = 0; index < A1B_AUTHORED_STEMS.length; index++) {
    const stem = A1B_AUTHORED_STEMS[index];
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = MARGIN + column * (cardWidth + GAP);
    const py = y + row * (cardHeight + GAP);
    const startX = x + (cardWidth - imageBlockWidth) / 2;
    parts.push(panel(x, py, cardWidth, cardHeight));
    parts.push(text(x + 18, py + 28, STEM_LABELS[stem], 16, 750));

    for (const [kindIndex, kind] of (['base', 'upper', 'composed'] as const).entries()) {
      const ix = startX + kindIndex * (imageSize + imageGap);
      if (kind === 'composed') {
        parts.push(`<rect x="${ix - 5}" y="${py + 39}" width="${imageSize + 10}" height="${imageSize + 35}" rx="9" fill="${COMPOSED_PANEL}"/>`);
      }
      parts.push(frameWithChecker(atlas, frameId(stem, kind), ix, py + 44, imageSize));
      parts.push(text(
        ix + imageSize / 2,
        py + 213,
        kind.toUpperCase(),
        11,
        800,
        kind === 'composed' ? A1A_PALETTE.green : MUTED,
        'middle',
      ));
    }
    parts.push(text(
      x + cardWidth / 2,
      py + 238,
      `${stem}-base.svg  +  ${stem}-upper.svg`,
      10,
      500,
      MUTED,
      'middle',
    ));
  }
  return y + rows * cardHeight + (rows - 1) * GAP;
}

function distanceProof(parts: string[], y: number, atlas: A1bAuthoredAtlasDescriptor): number {
  const stems: readonly A1bAuthoredStem[] = [
    'full_exterior_corner',
    'transition_n_to_e',
    'transition_w_to_s',
    'door_open',
    'window_wide',
  ];
  const cardWidth = (WIDTH - MARGIN * 2 - GAP * (stems.length - 1)) / stems.length;
  const closeSize = 230;
  for (let index = 0; index < stems.length; index++) {
    const stem = stems[index];
    const id = frameId(stem, 'composed');
    const x = MARGIN + index * (cardWidth + GAP);
    parts.push(panel(x, y, cardWidth, 390));
    parts.push(text(x + cardWidth / 2, y + 28, STEM_LABELS[stem], 14, 750, INK, 'middle'));
    const closeX = x + (cardWidth - closeSize) / 2;
    parts.push(frameWithChecker(atlas, id, closeX, y + 43, closeSize));
    parts.push(text(x + cardWidth / 2, y + 290, `${A1A_REVIEW_SIZES.close}px target · source shown at 230px`, 10, 600, MUTED, 'middle'));
    const normalX = x + 30;
    const farX = x + cardWidth - 30 - A1A_REVIEW_SIZES.far;
    parts.push(frameWithChecker(atlas, id, normalX, y + 306, A1A_REVIEW_SIZES.normal));
    parts.push(frameWithChecker(atlas, id, farX, y + 331, A1A_REVIEW_SIZES.far));
    parts.push(text(normalX + A1A_REVIEW_SIZES.normal / 2, y + 382, `${A1A_REVIEW_SIZES.normal}px`, 10, 650, MUTED, 'middle'));
    parts.push(text(farX + A1A_REVIEW_SIZES.far / 2, y + 382, `${A1A_REVIEW_SIZES.far}px`, 10, 650, MUTED, 'middle'));
  }
  return y + 390;
}

function boundaryAndPalette(parts: string[], y: number): number {
  const cardWidth = (WIDTH - MARGIN * 2 - GAP) / 2;
  parts.push(panel(MARGIN, y, cardWidth, 254));
  parts.push(text(MARGIN + 24, y + 34, 'Editable source authority', 20, 750));
  const facts = [
    '18 strict 128×128 SVGs: one base and one upper per approved B case.',
    'Literal editor colors compile to cream / green / teal proof tokens.',
    'Charcoal, coral, glass, metal, and face overlays remain literal detail.',
    'Gradients, masks, filters, images, text, stray files, and unknown paint fail.',
    'Atlas pixels are deterministic products; edit the SVGs, never the atlas.',
  ];
  for (let index = 0; index < facts.length; index++) {
    const fy = y + 68 + index * 32;
    parts.push(`<circle cx="${MARGIN + 31}" cy="${fy - 5}" r="4" fill="${A1A_PALETTE.green}"/>`);
    parts.push(text(MARGIN + 45, fy, facts[index], 14, index === 4 ? 700 : 500, index === 4 ? INK : MUTED));
  }

  const rightX = MARGIN + cardWidth + GAP;
  parts.push(panel(rightX, y, cardWidth, 254, COMPOSED_PANEL));
  parts.push(text(rightX + 24, y + 34, 'Scope gate before topology expansion', 20, 750));
  const boundaries = [
    'This is the first authored appearance pass, not the complete 47 family.',
    'Existing mask_0…mask_46 connectivity and the bevel fallback are unchanged.',
    'No template registration, bundle replacement, export field, or schema bump.',
    'No Unity composition, cutaway, sorting, lighting, or production-scene claim.',
    'Next gate: approve source appearance, then compile shared pieces across 47.',
  ];
  for (let index = 0; index < boundaries.length; index++) {
    const by = y + 68 + index * 32;
    parts.push(`<circle cx="${rightX + 31}" cy="${by - 5}" r="4" fill="${A1A_PALETTE.teal}"/>`);
    parts.push(text(rightX + 45, by, boundaries[index], 14, index === 4 ? 700 : 500, index === 4 ? INK : MUTED));
  }
  return y + 254;
}

function paletteStrip(parts: string[], y: number): number {
  const entries = [
    ['AGED CREAM', A1A_PALETTE.cream],
    ['DEEP GREEN', A1A_PALETTE.green],
    ['OXIDIZED TEAL', A1A_PALETTE.teal],
    ['CORAL / RUST', A1A_PALETTE.coral],
    ['CHARCOAL', A1A_PALETTE.charcoal],
    ['GLASS', A1A_PALETTE.glass],
    ['METAL', A1A_PALETTE.metal],
  ] as const;
  parts.push(panel(MARGIN, y, WIDTH - MARGIN * 2, 132));
  parts.push(text(MARGIN + 24, y + 32, 'QuotaCo Building System source palette', 18, 750));
  const swatchWidth = 156;
  const swatchGap = 72;
  const total = entries.length * swatchWidth + (entries.length - 1) * swatchGap;
  const startX = (WIDTH - total) / 2;
  for (let index = 0; index < entries.length; index++) {
    const [label, color] = entries[index];
    const x = startX + index * (swatchWidth + swatchGap);
    parts.push(`<rect x="${x}" y="${y + 48}" width="${swatchWidth}" height="48" rx="7" fill="${color}"/>`);
    parts.push(text(x + swatchWidth / 2, y + 116, label, 10, 750, MUTED, 'middle'));
  }
  return y + 132;
}

function pngDataUri(bytes: Uint8Array): string {
  return `data:image/png;base64,${Buffer.from(bytes).toString('base64')}`;
}

function reviewSheet(atlas: A1bAuthoredAtlasDescriptor, atlasPng: Uint8Array): string {
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
  parts.push(text(MARGIN, y + 36, 'QuotaCo Building System · A1b authored B source pass', 34, 800));
  parts.push(text(MARGIN, y + 69, 'Editable SVG art authority · deterministic transparent proof pixels · existing production family untouched', 17, 500, MUTED));
  parts.push(text(WIDTH - MARGIN, y + 35, '18 SOURCES · 9 PAIRS · 27 PROOF FRAMES', 14, 800, A1A_PALETTE.green, 'end'));
  parts.push(text(WIDTH - MARGIN, y + 61, `${A1B_ATLAS_COLUMNS}×${A1B_ATLAS_ROWS} PADDED ATLAS · TEMPORARY IDS`, 12, 650, MUTED, 'end'));
  y += 102;

  y = sectionTitle(parts, y, 'Base + upper source pairs', 'Each column is compiled directly from the named SVGs; composed pixels are base first, upper second.');
  y = sourceCards(parts, y, atlas) + 24;

  y = sectionTitle(parts, y, 'Gameplay-distance proof', 'The authored composed frames at close, normal, and far review sizes. Final scene acceptance remains Unity-owned.');
  y = distanceProof(parts, y, atlas) + 24;

  y = sectionTitle(parts, y, 'What this pass proves—and deliberately does not', 'The source workflow is now real; production topology and contracts stay behind the next visual gate.');
  y = boundaryAndPalette(parts, y) + 20;
  y = paletteStrip(parts, y) + MARGIN;

  const height = Math.ceil(y);
  parts[1] = `<rect width="${WIDTH}" height="${height}" fill="${PAGE}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}">${parts.join('')}</svg>`;
}

function parseArgs(args: string[], root: string): CliOptions {
  let input = path.join(root, 'assets/walls/quota-co-building-system');
  let output = path.join(root, 'docs/previews');
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument !== '--input' && argument !== '--out') throw new Error(`Unknown argument ${argument}`);
    const value = args[++index];
    if (!value) throw new Error(`${argument} requires a path`);
    if (argument === '--input') input = path.resolve(root, value);
    else output = path.resolve(root, value);
  }
  return { input, output };
}

async function main(): Promise<void> {
  const root = process.cwd();
  const options = parseArgs(process.argv.slice(2), root);
  const sourcePathPrefix = path.relative(root, options.input).replaceAll(path.sep, '/');
  const family = await loadA1bAuthoredBFamily({
    inputDir: options.input,
    sourcePathPrefix,
  });
  const frames = buildA1bAuthoredFrames(family.components);
  await mkdir(options.output, { recursive: true });

  const atlasPngs = new Map<number, Uint8Array>();
  for (const scale of EXPORT_SCALES) {
    const descriptor = a1bAuthoredAtlasDescriptor(frames, scale);
    const source = a1bAuthoredAtlasSvg(frames, scale);
    const bytes = new Resvg(source).render().asPng();
    atlasPngs.set(scale, bytes);
    await writeFile(
      path.join(options.output, `quota-co-high-oblique-a1b-authored-atlas@${scale}x.png`),
      bytes,
    );
    await writeFile(
      path.join(options.output, `quota-co-high-oblique-a1b-authored-atlas@${scale}x.json`),
      `${JSON.stringify(descriptor, null, 2)}\n`,
      'utf8',
    );
    if (scale === 1) {
      await writeFile(
        path.join(options.output, 'quota-co-high-oblique-a1b-authored-atlas.svg'),
        source,
        'utf8',
      );
    }
  }

  const oneX = atlasPngs.get(1);
  if (!oneX) throw new Error('A1b 1x authored atlas was not rendered');
  const reviewSvg = reviewSheet(a1bAuthoredAtlasDescriptor(frames, 1), oneX);
  const reviewPng = new Resvg(reviewSvg).render().asPng();
  await writeFile(path.join(options.output, 'quota-co-high-oblique-a1b-authored-review.svg'), reviewSvg, 'utf8');
  await writeFile(path.join(options.output, 'quota-co-high-oblique-a1b-authored-review.png'), reviewPng);
  await writeFile(
    path.join(options.output, 'quota-co-high-oblique-a1b-authored-review.html'),
    '<!doctype html><meta charset="utf-8"><title>QuotaCo A1b authored B source pass</title>' +
      '<style>html{background:#252a28;color:#f6f1e5;font-family:sans-serif}body{margin:24px}' +
      'img{display:block;max-width:100%;height:auto;margin-bottom:20px}a{color:#83a9a6;margin-right:16px}</style>' +
      '<h1>QuotaCo A1b authored B source pass</h1>' +
      '<p>Editable-SVG appearance proof. No production bundle, complete 47-family, or schema claim.</p>' +
      '<img src="quota-co-high-oblique-a1b-authored-review.png" alt="QuotaCo authored B base upper and composed source review">' +
      EXPORT_SCALES.map((scale) =>
        `<a href="quota-co-high-oblique-a1b-authored-atlas@${scale}x.png">transparent atlas ${scale}×</a>`).join('') +
      '<a href="quota-co-high-oblique-a1b-authored-atlas@1x.json">proof manifest</a>',
    'utf8',
  );

  process.stdout.write(
    `Wrote QuotaCo A1b authored source proof (${family.components.length} SVG components, ` +
    `${frames.length} frames, scales ${EXPORT_SCALES.join('/')}) to ${options.output}\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
