/** Render the rejected-versus-corrected A1b low-profile mini-strip. */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import { EXPORT_SCALES } from '../src/core/exporter';
import { A1A_PALETTE, A1A_REVIEW_SIZES } from './highOblique/a1aProof';
import {
  A1B_LOW_CORRECTION_COLUMNS,
  A1B_LOW_CORRECTION_FRAME_IDS,
  A1B_LOW_CORRECTION_ROWS,
  A1B_LOW_CORRECTION_RULER,
  a1bLowCorrectionAtlasDescriptor,
  a1bLowCorrectionAtlasSvg,
  loadA1bLowCorrectionFamily,
  type A1bLowCorrectionAtlasDescriptor,
  type A1bLowCorrectionFrameId,
} from './highOblique/a1bLowProfileCorrection';
import {
  a1bTopologyAtlasDescriptor,
  a1bTopologyAtlasSvg,
  loadA1bTopologyFamily,
  type A1bTopologyAtlasDescriptor,
  type A1bTopologyEvidenceFrameId,
} from './highOblique/a1bTopology';

const PAGE = '#E8E4D8';
const PANEL = '#F6F1E5';
const REJECTED_PANEL = '#E8DED2';
const CORRECTED_PANEL = '#E2E8DE';
const INK = '#252A28';
const MUTED = '#606A64';
const RULE = '#A59E8F';
const WIDTH = 1760;
const MARGIN = 46;
const GAP = 22;

interface CliOptions {
  readonly correctionInput: string;
  readonly topologyInput: string;
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
  parts.push(text(MARGIN, y + 28, title, 27, 760));
  parts.push(text(MARGIN, y + 55, detail, 15, 450, MUTED));
  parts.push(`<path d="M ${MARGIN} ${y + 70} H ${WIDTH - MARGIN}" stroke="${RULE}"/>`);
  return y + 90;
}

function oldFrame(
  atlas: A1bTopologyAtlasDescriptor,
  id: A1bTopologyEvidenceFrameId,
  x: number,
  y: number,
  size: number,
): string {
  const frame = atlas.frames[id];
  if (!frame) throw new Error(`Missing rejected control frame ${id}`);
  return (
    checker(x, y, size, size) +
    `<svg x="${x}" y="${y}" width="${size}" height="${size}" ` +
    `viewBox="${frame.x} ${frame.y} ${frame.w} ${frame.h}" preserveAspectRatio="none">` +
    '<use href="#oldPixels"/></svg>'
  );
}

function correctedFrame(
  atlas: A1bLowCorrectionAtlasDescriptor,
  id: A1bLowCorrectionFrameId,
  x: number,
  y: number,
  size: number,
): string {
  const frame = atlas.frames[id];
  if (!frame) throw new Error(`Missing corrected frame ${id}`);
  return (
    checker(x, y, size, size) +
    `<svg x="${x}" y="${y}" width="${size}" height="${size}" ` +
    `viewBox="${frame.x} ${frame.y} ${frame.w} ${frame.h}" preserveAspectRatio="none">` +
    '<use href="#newPixels"/></svg>'
  );
}

interface ComparisonCase {
  readonly title: string;
  readonly oldId: A1bTopologyEvidenceFrameId;
  readonly newId: A1bLowCorrectionFrameId;
}

const COMPARISON_CASES: readonly ComparisonCase[] = [
  { title: 'LOW SOUTH · STRAIGHT', oldId: 'a1b_evidence_low_10', newId: 'a1b_low_corrected_s' },
  { title: 'LOW EAST · STRAIGHT', oldId: 'a1b_evidence_low_05', newId: 'a1b_low_corrected_e' },
  { title: 'LOW SOUTH/EAST · CORNER', oldId: 'a1b_evidence_low_09', newId: 'a1b_low_corrected_se_corner' },
  { title: 'FULL NORTH → LOW EAST', oldId: 'a1b_evidence_transition_n_to_e', newId: 'a1b_low_corrected_transition_composed' },
];

function comparisonCards(
  parts: string[],
  y: number,
  oldAtlas: A1bTopologyAtlasDescriptor,
  newAtlas: A1bLowCorrectionAtlasDescriptor,
): number {
  const columns = 2;
  const cardWidth = (WIDTH - MARGIN * 2 - GAP) / columns;
  const cardHeight = 392;
  const closeSize = 198;
  for (let index = 0; index < COMPARISON_CASES.length; index += 1) {
    const entry = COMPARISON_CASES[index];
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = MARGIN + column * (cardWidth + GAP);
    const py = y + row * (cardHeight + GAP);
    parts.push(panel(x, py, cardWidth, cardHeight));
    parts.push(text(x + cardWidth / 2, py + 28, entry.title, 15, 800, INK, 'middle'));
    const half = cardWidth / 2;
    const oldX = x + (half - closeSize) / 2;
    const newX = x + half + (half - closeSize) / 2;
    parts.push(panel(x + 16, py + 44, half - 24, 330, REJECTED_PANEL));
    parts.push(panel(x + half + 8, py + 44, half - 24, 330, CORRECTED_PANEL));
    parts.push(text(x + half / 2, py + 66, 'REJECTED · LOWER CHASSIS', 11, 800, A1A_PALETTE.coral, 'middle'));
    parts.push(text(x + half + half / 2, py + 66, 'CORRECTED · FINISHED LOW WALL', 11, 800, A1A_PALETTE.green, 'middle'));
    parts.push(oldFrame(oldAtlas, entry.oldId, oldX, py + 78, closeSize));
    parts.push(correctedFrame(newAtlas, entry.newId, newX, py + 78, closeSize));

    const oldNormalX = x + 34;
    const oldFarX = x + half - 58;
    const newNormalX = x + half + 26;
    const newFarX = x + cardWidth - 66;
    parts.push(oldFrame(oldAtlas, entry.oldId, oldNormalX, py + 286, A1A_REVIEW_SIZES.normal));
    parts.push(oldFrame(oldAtlas, entry.oldId, oldFarX, py + 311, A1A_REVIEW_SIZES.far));
    parts.push(correctedFrame(newAtlas, entry.newId, newNormalX, py + 286, A1A_REVIEW_SIZES.normal));
    parts.push(correctedFrame(newAtlas, entry.newId, newFarX, py + 311, A1A_REVIEW_SIZES.far));
    parts.push(text(oldNormalX + 45, py + 385, '90px', 9, 700, MUTED, 'middle'));
    parts.push(text(oldFarX + 20, py + 365, '40px', 9, 700, MUTED, 'middle'));
    parts.push(text(newNormalX + 45, py + 385, '90px', 9, 700, MUTED, 'middle'));
    parts.push(text(newFarX + 20, py + 365, '40px', 9, 700, MUTED, 'middle'));
  }
  return y + cardHeight * 2 + GAP;
}

function transitionSeparation(
  parts: string[],
  y: number,
  atlas: A1bLowCorrectionAtlasDescriptor,
): number {
  type TransitionFrameId =
    | 'a1b_low_corrected_transition_base'
    | 'a1b_low_corrected_transition_upper'
    | 'a1b_low_corrected_transition_composed';
  const entries: readonly { id: TransitionFrameId; title: string; detail: string }[] = [
    { id: 'a1b_low_corrected_transition_base', title: 'FINISHED LOW BASE', detail: 'persistent capped south/east member' },
    { id: 'a1b_low_corrected_transition_upper', title: 'OPTIONAL UPPER', detail: 'full north extension only' },
    { id: 'a1b_low_corrected_transition_composed', title: 'COMPOSED TRANSITION', detail: 'base first · upper second' },
  ];
  const cardWidth = (WIDTH - MARGIN * 2 - GAP * 2) / 3;
  const size = 226;
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const x = MARGIN + index * (cardWidth + GAP);
    parts.push(panel(x, y, cardWidth, 316, index === 2 ? CORRECTED_PANEL : PANEL));
    parts.push(text(x + cardWidth / 2, y + 28, entry.title, 14, 800, INK, 'middle'));
    parts.push(text(x + cardWidth / 2, y + 47, entry.detail, 11, 550, MUTED, 'middle'));
    parts.push(correctedFrame(atlas, entry.id, x + (cardWidth - size) / 2, y + 61, size));
    parts.push(text(x + cardWidth / 2, y + 302, A1B_LOW_CORRECTION_SOURCE_INVENTORY_NOTE[entry.id], 10, 650, MUTED, 'middle'));
  }
  return y + 316;
}

const A1B_LOW_CORRECTION_SOURCE_INVENTORY_NOTE: Readonly<Record<
  'a1b_low_corrected_transition_base' | 'a1b_low_corrected_transition_upper' | 'a1b_low_corrected_transition_composed',
  string
>> = {
  a1b_low_corrected_transition_base: 'transition-n-to-e-base.svg',
  a1b_low_corrected_transition_upper: 'transition-n-to-e-upper.svg',
  a1b_low_corrected_transition_composed: 'two editable sources · no baked rotation',
};

function boundaryAndRuler(parts: string[], y: number): number {
  const cardWidth = (WIDTH - MARGIN * 2 - GAP) / 2;
  parts.push(panel(MARGIN, y, cardWidth, 248, CORRECTED_PANEL));
  parts.push(text(MARGIN + 24, y + 34, 'Corrective material stack', 20, 760));
  const stackX = MARGIN + 34;
  const stackY = y + 66;
  const scale = 4;
  const bands = [
    { from: 82, to: 84, color: A1A_PALETTE.charcoal, label: 'charcoal outline' },
    { from: 84, to: 92, color: '#EEE8D7', label: 'light top plane · 8' },
    { from: 92, to: 100, color: A1A_PALETTE.cream, label: 'cream coping/lip · 8' },
    { from: 100, to: 118, color: A1A_PALETTE.green, label: 'green/teal face · 18' },
    { from: 118, to: 120, color: A1A_PALETTE.charcoal, label: 'grounded toe' },
  ] as const;
  let bx = stackX;
  for (const band of bands) {
    const width = (band.to - band.from) * scale;
    parts.push(`<rect x="${bx}" y="${stackY}" width="${width}" height="70" fill="${band.color}"/>`);
    bx += width;
  }
  parts.push(`<rect x="${stackX}" y="${stackY}" width="${38 * scale}" height="70" rx="5" fill="none" stroke="${INK}" stroke-width="2"/>`);
  for (let index = 0; index < bands.length; index += 1) {
    const band = bands[index];
    parts.push(text(stackX + 180, y + 159 + index * 17, band.label, 11, 650, index === 2 ? INK : MUTED));
  }
  parts.push(text(MARGIN + cardWidth - 24, y + 225, '38 outer · 34 material · prior material field was 22', 12, 800, A1A_PALETTE.green, 'end'));

  const rightX = MARGIN + cardWidth + GAP;
  parts.push(panel(rightX, y, cardWidth, 248));
  parts.push(text(rightX + 24, y + 34, 'Scope boundary', 20, 760));
  const facts = [
    'Five editable SVG sources; the transparent atlas is generated evidence.',
    'South and east fixed-light planes are authored separately, never rotated.',
    'The rejected 47-mask source bank remains byte-for-byte outside this lane.',
    'No production registration, exporter, schema, CONTRACT, or Unity change.',
    'Approval unlocks propagation through the same existing 47-blob table.',
  ];
  for (let index = 0; index < facts.length; index += 1) {
    const fy = y + 72 + index * 33;
    parts.push(`<circle cx="${rightX + 31}" cy="${fy - 5}" r="4" fill="${index === 4 ? A1A_PALETTE.teal : A1A_PALETTE.green}"/>`);
    parts.push(text(rightX + 45, fy, facts[index], 13, index === 4 ? 750 : 520, index === 4 ? INK : MUTED));
  }
  return y + 248;
}

function pngDataUri(bytes: Uint8Array): string {
  return `data:image/png;base64,${Buffer.from(bytes).toString('base64')}`;
}

function reviewSheet(
  oldAtlas: A1bTopologyAtlasDescriptor,
  oldPng: Uint8Array,
  newAtlas: A1bLowCorrectionAtlasDescriptor,
  newPng: Uint8Array,
): string {
  const parts: string[] = [
    `<defs><pattern id="checker" width="16" height="16" patternUnits="userSpaceOnUse">` +
      '<rect width="16" height="16" fill="#B9B9B2"/>' +
      '<rect width="8" height="8" fill="#D6D5CC"/><rect x="8" y="8" width="8" height="8" fill="#D6D5CC"/>' +
      `</pattern><image id="oldPixels" x="0" y="0" width="${oldAtlas.width}" height="${oldAtlas.height}" href="${pngDataUri(oldPng)}"/>` +
      `<image id="newPixels" x="0" y="0" width="${newAtlas.width}" height="${newAtlas.height}" href="${pngDataUri(newPng)}"/></defs>`,
    `<rect width="${WIDTH}" height="2400" fill="${PAGE}"/>`,
  ];
  let y = 40;
  parts.push(text(MARGIN, y + 36, 'QuotaCo Building System · low-profile corrective mini-strip', 33, 820));
  parts.push(text(MARGIN, y + 69, 'Finished capped cutaway volumes · rejected 47-bank retained as control · no propagation yet', 16, 520, MUTED));
  parts.push(text(WIDTH - MARGIN, y + 34, '5 EDITABLE SOURCES · 6 PROOF FRAMES', 14, 820, A1A_PALETTE.green, 'end'));
  parts.push(text(WIDTH - MARGIN, y + 60, `${A1B_LOW_CORRECTION_COLUMNS}×${A1B_LOW_CORRECTION_ROWS} TRANSPARENT ATLAS · 1×/2×/4×`, 12, 700, MUTED, 'end'));
  y += 104;

  y = sectionTitle(parts, y, 'The rejected read—and the correction', 'The old low frame was only the green lower chassis. The correction restores a complete cream-capped low product at close and gameplay sizes.');
  y = comparisonCards(parts, y, oldAtlas, newAtlas) + 24;

  y = sectionTitle(parts, y, 'Does split-B still work?', 'The persistent low member is now finished on its own; the optional upper extends only the full north run.');
  y = transitionSeparation(parts, y, newAtlas) + 24;

  y = sectionTitle(parts, y, 'Corrective ruler and propagation boundary', 'Concept proportions guide the family relationship; this real 128-unit strip settles the exact low-wall read.');
  y = boundaryAndRuler(parts, y) + MARGIN;

  const height = Math.ceil(y);
  parts[1] = `<rect width="${WIDTH}" height="${height}" fill="${PAGE}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}">${parts.join('')}</svg>`;
}

function parseArgs(args: string[], root: string): CliOptions {
  let correctionInput = path.join(root, 'assets/walls/quota-co-building-system/low-profile-correction');
  let topologyInput = path.join(root, 'assets/walls/quota-co-building-system/topology');
  let output = path.join(root, 'docs/previews');
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!['--input', '--topology-input', '--out'].includes(argument)) {
      throw new Error(`Unknown argument ${argument}`);
    }
    const value = args[++index];
    if (!value) throw new Error(`${argument} requires a path`);
    if (argument === '--input') correctionInput = path.resolve(root, value);
    else if (argument === '--topology-input') topologyInput = path.resolve(root, value);
    else output = path.resolve(root, value);
  }
  return { correctionInput, topologyInput, output };
}

async function main(): Promise<void> {
  const root = process.cwd();
  const options = parseArgs(process.argv.slice(2), root);
  const correctionPrefix = path.relative(root, options.correctionInput).replaceAll(path.sep, '/');
  const topologyPrefix = path.relative(root, options.topologyInput).replaceAll(path.sep, '/');
  const correction = await loadA1bLowCorrectionFamily({
    inputDir: options.correctionInput,
    sourcePathPrefix: correctionPrefix,
  });
  const topology = await loadA1bTopologyFamily({
    inputDir: options.topologyInput,
    sourcePathPrefix: topologyPrefix,
  });
  await mkdir(options.output, { recursive: true });

  let oneX: Uint8Array | undefined;
  for (const scale of EXPORT_SCALES) {
    const descriptor = a1bLowCorrectionAtlasDescriptor(correction.frames, scale);
    const source = a1bLowCorrectionAtlasSvg(correction.frames, scale);
    const bytes = new Resvg(source).render().asPng();
    await writeFile(
      path.join(options.output, `quota-co-high-oblique-a1b-low-profile-atlas@${scale}x.png`),
      bytes,
    );
    await writeFile(
      path.join(options.output, `quota-co-high-oblique-a1b-low-profile-atlas@${scale}x.json`),
      `${JSON.stringify(descriptor, null, 2)}\n`,
      'utf8',
    );
    if (scale === 1) {
      oneX = bytes;
      await writeFile(
        path.join(options.output, 'quota-co-high-oblique-a1b-low-profile-atlas.svg'),
        source,
        'utf8',
      );
    }
  }

  if (!oneX) throw new Error('A1b low-profile 1x atlas was not rendered');
  const oldDescriptor = a1bTopologyAtlasDescriptor(topology.evidenceFrames, 1);
  const oldPng = new Resvg(a1bTopologyAtlasSvg(topology.evidenceFrames, 1)).render().asPng();
  const newDescriptor = a1bLowCorrectionAtlasDescriptor(correction.frames, 1);
  const reviewSvg = reviewSheet(oldDescriptor, oldPng, newDescriptor, oneX);
  const reviewPng = new Resvg(reviewSvg).render().asPng();
  await writeFile(
    path.join(options.output, 'quota-co-high-oblique-a1b-low-profile-review.svg'),
    reviewSvg,
    'utf8',
  );
  await writeFile(
    path.join(options.output, 'quota-co-high-oblique-a1b-low-profile-review.png'),
    reviewPng,
  );
  await writeFile(
    path.join(options.output, 'quota-co-high-oblique-a1b-low-profile-review.html'),
    '<!doctype html><meta charset="utf-8"><title>QuotaCo A1b low-profile correction</title>' +
      '<style>html{background:#252a28;color:#f6f1e5;font-family:sans-serif}body{margin:24px}' +
      'img{display:block;max-width:100%;height:auto;margin-bottom:20px}a{color:#83a9a6;margin-right:16px}</style>' +
      '<h1>QuotaCo A1b low-profile corrective mini-strip</h1>' +
      '<p>Rejected control versus five-source corrective art. No 47-mask propagation or production registration.</p>' +
      '<img src="quota-co-high-oblique-a1b-low-profile-review.png" alt="QuotaCo rejected and corrected low wall comparison">' +
      EXPORT_SCALES.map((scale) =>
        `<a href="quota-co-high-oblique-a1b-low-profile-atlas@${scale}x.png">transparent atlas ${scale}×</a>`).join(''),
    'utf8',
  );
  process.stdout.write(
    `Wrote A1b low-profile correction (${correction.sources.length} sources, ` +
    `${A1B_LOW_CORRECTION_FRAME_IDS.length} frames, ruler ${A1B_LOW_CORRECTION_RULER.outerProfile}) ` +
    `to ${options.output}\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
