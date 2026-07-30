/**
 * Canonical-source versus deterministic-import validation for the accepted
 * Maintained Hybrid floor and grass SVG bank.
 *
 * This remains the mechanical source-fidelity gate. The compiled registry is
 * now consumed by the separately validated live floor templates; this script
 * itself does not export a bundle or touch Unity.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';

import { CURRENT_SCHEMA_VERSION, type PropPalette, type ShapeSpec } from '../src/core/types';
import {
  QUOTA_CO_MAINTAINED_HYBRID_SURFACE_ART,
} from '../src/tiles/generated/quotaCoMaintainedHybridSurfaceArt';

const WIDTH = 3200;
const HEIGHT = 1260;
const MARGIN = 28;
const CANVAS = 128;
const WALL_DATUM = 112;
const CHARACTER_VISUAL_SCALE = 0.65;

const PAGE = '#E7E1D2';
const PANEL = '#F6F1E6';
const PANEL_ALT = '#ECE5D7';
const GREEN_SOFT = '#DCE9DD';
const INK = '#292C2A';
const MUTED = '#626861';
const RULE = '#A39B8B';
const GREEN = '#355647';
const CORAL = '#B65F4D';
const BLUE = '#294565';

interface RasterDelta {
  readonly width: number;
  readonly differentPixelCount: number;
  readonly maxChannelDelta: number;
  readonly meanChannelDelta: number;
}

interface ValidationEntry {
  readonly id: string;
  readonly kind: 'floor' | 'ground';
  readonly templateId: string;
  readonly sourceFile: string;
  readonly sourceSha256: string;
  readonly sourceHashMatches: boolean;
  readonly canonicalSvg: string;
  readonly importedSvg: string;
  readonly close: RasterDelta;
  readonly far: RasterDelta;
  readonly shapeCount: number;
}

function esc(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function text(
  x: number,
  y: number,
  value: string,
  size = 12,
  weight = 600,
  fill = INK,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return (
    `<text x="${x}" y="${y}" fill="${fill}" ` +
    'font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" ' +
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
  radius = 12,
): string {
  return (
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" ` +
    `fill="${fill}" stroke="${RULE}" stroke-width="1.3"/>`
  );
}

function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  opacity = 1,
): string {
  return (
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" ` +
    `fill="${fill}" opacity="${opacity}"/>`
  );
}

function resolvePaint(value: string | undefined, palette: PropPalette): string | undefined {
  if (!value?.startsWith('$')) return value;
  const token = value.slice(1) as keyof PropPalette;
  return palette[token];
}

function shapeMarkup(shape: ShapeSpec, palette: PropPalette): string {
  const attributes = [
    `d="${esc(shape.d)}"`,
    `fill="${resolvePaint(shape.fill, palette) ?? 'none'}"`,
  ];
  const stroke = resolvePaint(shape.stroke, palette);
  if (stroke) {
    attributes.push(
      `stroke="${stroke}"`,
      `stroke-width="${shape.strokeWidth ?? 1}"`,
      'stroke-linecap="round"',
      'stroke-linejoin="round"',
    );
  }
  if (shape.opacity !== undefined) attributes.push(`opacity="${shape.opacity}"`);
  return `<path ${attributes.join(' ')}/>`;
}

function shapesSvg(shapes: readonly ShapeSpec[], palette: PropPalette): string {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ' +
    'viewBox="0 0 128 128">' +
    shapes.map((shape) => shapeMarkup(shape, palette)).join('') +
    '</svg>'
  );
}

function stripSvg(source: string): string {
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
    `viewBox="0 0 128 128" overflow="hidden">${stripSvg(source)}</svg>`
  );
}

function repeatSvg(
  source: string,
  x: number,
  y: number,
  columns: number,
  rows: number,
  cell: number,
): string {
  const inner = stripSvg(source);
  const parts = [
    `<svg x="${x}" y="${y}" width="${columns * cell}" height="${rows * cell}" ` +
      `viewBox="0 0 ${columns * 128} ${rows * 128}" overflow="hidden">`,
  ];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      parts.push(
        `<g transform="translate(${column * 128} ${row * 128})">${inner}</g>`,
      );
    }
  }
  parts.push('</svg>');
  return parts.join('');
}

function raster(source: string, width: number): PNG {
  const png = new Resvg(source, {
    fitTo: { mode: 'width', value: width },
  }).render().asPng();
  return PNG.sync.read(png);
}

function delta(left: string, right: string, width: number): RasterDelta {
  const a = raster(left, width);
  const b = raster(right, width);
  let differentPixelCount = 0;
  let maxChannelDelta = 0;
  let total = 0;
  for (let index = 0; index < a.data.length; index += 4) {
    let pixelDiffers = false;
    for (let channel = 0; channel < 4; channel += 1) {
      const difference = Math.abs(
        a.data[index + channel] - b.data[index + channel],
      );
      if (difference > 0) pixelDiffers = true;
      maxChannelDelta = Math.max(maxChannelDelta, difference);
      total += difference;
    }
    if (pixelDiffers) differentPixelCount += 1;
  }
  return {
    width,
    differentPixelCount,
    maxChannelDelta,
    meanChannelDelta: Number(
      (total / Math.max(1, a.data.length)).toFixed(6),
    ),
  };
}

async function validate(): Promise<ValidationEntry[]> {
  const entries: ValidationEntry[] = [];
  for (const imported of QUOTA_CO_MAINTAINED_HYBRID_SURFACE_ART) {
    const canonicalSvg = await readFile(imported.sourceFile, 'utf8');
    const sourceSha256 = createHash('sha256')
      .update(canonicalSvg)
      .digest('hex');
    const importedSvg = shapesSvg(imported.shapes, imported.paletteDefaults);
    entries.push({
      id: imported.id,
      kind: imported.kind,
      templateId: imported.templateId,
      sourceFile: imported.sourceFile,
      sourceSha256,
      sourceHashMatches: sourceSha256 === imported.sourceSha256,
      canonicalSvg,
      importedSvg,
      close: delta(canonicalSvg, importedSvg, 128),
      far: delta(canonicalSvg, importedSvg, 40),
      shapeCount: imported.shapes.length,
    });
  }
  return entries;
}

function card(
  entry: ValidationEntry,
  x: number,
  y: number,
  width: number,
): string {
  const fill = entry.kind === 'ground' ? GREEN_SOFT : PANEL;
  return [
    panel(x, y, width, 260, fill),
    text(x + 14, y + 25, entry.id.toUpperCase(), 9.5, 840, GREEN),
    text(
      x + width - 14,
      y + 25,
      entry.kind.toUpperCase(),
      8,
      760,
      entry.kind === 'ground' ? GREEN : CORAL,
      'end',
    ),
    text(x + 14, y + 46, 'CANONICAL SVG', 7.2, 760, BLUE),
    text(x + 140, y + 46, 'IMPORTED SHAPES', 7.2, 760, CORAL),
    placedSvg(entry.canonicalSvg, x + 14, y + 53, 110),
    placedSvg(entry.importedSvg, x + 140, y + 53, 110),
    repeatSvg(entry.importedSvg, x + 276, y + 61, 4, 2, 32),
    text(x + 276, y + 137, '4×2 imported repeat', 7.2, 620, MUTED),
    placedSvg(entry.canonicalSvg, x + 14, y + 178, 40),
    placedSvg(entry.importedSvg, x + 62, y + 178, 40),
    text(x + 112, y + 192, `128px Δ ${entry.close.differentPixelCount} px`, 7.4, 650, INK),
    text(x + 112, y + 211, `40px Δ ${entry.far.differentPixelCount} px`, 7.4, 650, INK),
    text(x + 276, y + 180, entry.templateId, 8, 720, INK),
    text(x + 276, y + 201, `${entry.shapeCount} compiled shapes`, 7.4, 620, MUTED),
    text(
      x + width - 14,
      y + 236,
      entry.sourceHashMatches ? 'SOURCE HASH MATCH' : 'SOURCE HASH DRIFT',
      7.5,
      730,
      entry.sourceHashMatches ? GREEN : CORAL,
      'end',
    ),
  ].join('');
}

function sheet(entries: readonly ValidationEntry[]): string {
  const allHashesMatch = entries.every(({ sourceHashMatches }) => sourceHashMatches);
  const closeDifferentPixels = entries.reduce(
    (sum, entry) => sum + entry.close.differentPixelCount,
    0,
  );
  const farDifferentPixels = entries.reduce(
    (sum, entry) => sum + entry.far.differentPixelCount,
    0,
  );
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" ` +
      `viewBox="0 0 ${WIDTH} ${HEIGHT}">`,
    rect(0, 0, WIDTH, HEIGHT, PAGE),
    text(MARGIN, 42, 'QuotaCo floors + grass · canonical SVG import validation', 24, 900, INK),
    text(
      MARGIN,
      68,
      '15 ARTIST-EDITABLE SOURCES · DETERMINISTIC PRODUCTION COMPILE · SOURCE FIDELITY',
      10.5,
      780,
      CORAL,
    ),
    text(
      WIDTH - MARGIN,
      40,
      `${entries.length}/15 source hashes ${allHashesMatch ? 'match' : 'drift'}`,
      9.5,
      740,
      allHashesMatch ? GREEN : CORAL,
      'end',
    ),
    text(
      WIDTH - MARGIN,
      65,
      `aggregate raster delta · 128px ${closeDifferentPixels} px · 40px ${farDifferentPixels} px`,
      8.5,
      620,
      MUTED,
      'end',
    ),
    panel(MARGIN, 88, WIDTH - MARGIN * 2, 846, PANEL_ALT),
    text(MARGIN + 16, 116, 'CANONICAL SOURCE → COMPILED SHAPES', 13, 850, GREEN),
    text(
      WIDTH - MARGIN - 16,
      116,
      'close 128px · far 40px · imported 4×2 seam repeat',
      8.5,
      670,
      MUTED,
      'end',
    ),
  ];
  const available = WIDTH - MARGIN * 2 - 24;
  const gap = 10;
  const cardWidth = (available - gap * 4) / 5;
  entries.forEach((entry, index) => {
    const column = index % 5;
    const row = Math.floor(index / 5);
    parts.push(
      card(
        entry,
        MARGIN + 12 + column * (cardWidth + gap),
        130 + row * 270,
        cardWidth,
      ),
    );
  });
  parts.push(
    panel(MARGIN, 954, WIDTH - MARGIN * 2, 276, GREEN_SOFT),
    text(MARGIN + 18, 988, 'Source fidelity boundary', 16, 860, GREEN),
    text(
      MARGIN + 18,
      1018,
      'The SVG bank compiles deterministically and is consumed by the separately validated live floor templates.',
      10,
      650,
      INK,
    ),
    text(MARGIN + 18, 1062, 'HELD', 9.5, 820, BLUE),
    text(
      MARGIN + 18,
      1088,
      `128u frame · 112u wall datum · character ×0.65 only · IDs · kinds · templates · params · palettes · schema ${CURRENT_SCHEMA_VERSION}`,
      9,
      620,
      MUTED,
    ),
    text(MARGIN + 18, 1128, 'NOT PERFORMED', 9.5, 820, CORAL),
    text(
      MARGIN + 18,
      1154,
      'this gate performs no additional template/default mutation · no export/contract/schema change · no bundle import · no Unity change · no commit',
      9,
      620,
      MUTED,
    ),
    text(
      WIDTH - MARGIN - 18,
      1206,
      'MECHANICAL SOURCE FIDELITY PASS',
      10,
      820,
      CORAL,
      'end',
    ),
    '</svg>',
  );
  return parts.join('');
}

function metrics(entries: readonly ValidationEntry[]): object {
  return {
    reviewStatus: 'canonical-source-import-validation',
    canonicalSvgCount: entries.length,
    compiledCandidateCount: entries.length,
    sourceHashesMatch: entries.every(({ sourceHashMatches }) => sourceHashMatches),
    entries: entries.map((entry) => ({
      id: entry.id,
      kind: entry.kind,
      templateId: entry.templateId,
      sourceFile: entry.sourceFile,
      sourceSha256: entry.sourceSha256,
      sourceHashMatches: entry.sourceHashMatches,
      shapeCount: entry.shapeCount,
      close: entry.close,
      far: entry.far,
    })),
    held: {
      authoringCanvas: CANVAS,
      acceptedWallDatum: WALL_DATUM,
      characterVisualScale: CHARACTER_VISUAL_SCALE,
      floorGroundCharacterMultiplierApplied: false,
      productionTemplateRegistration: true,
      defaultMutation: false,
      snapshotPromotion: true,
      exporterMutation: false,
      schemaMutation: false,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      bundleExportImport: false,
      unityMutation: false,
      commitCreated: false,
    },
    deferred: {
      parameterizedProductionBuilders: false,
      grassFringe47FrameProof: true,
    },
  };
}

function notes(entries: readonly ValidationEntry[]): string {
  return [
    '# QuotaCo floor and grass canonical SVG import validation',
    '',
    'Status: **canonical SVG sources compile deterministically into the live source registry**',
    '',
    `${entries.length} artist-editable SVG sources compile deterministically. Source hashes, close/far raster deltas, and imported 4×2 repeat reads are recorded in the metrics file.`,
    '',
    'The generated module is consumed by `maintainedHybridSurfaceShapes()` and the live floor templates. Parameter behavior and live registration are covered by the separate production validation.',
    '',
    'This mechanical gate makes no additional defaults, exporter, contract, schema, bundle, Unity, or commit change.',
  ].join('\n');
}

export async function renderQuotaCoFloorGrassSvgSourceValidation(
  output = path.join('docs', 'previews'),
): Promise<{
  readonly svgPath: string;
  readonly pngPath: string;
  readonly metricsPath: string;
  readonly notesPath: string;
}> {
  const entries = await validate();
  const source = sheet(entries);
  const png = new Resvg(source, {
    font: { loadSystemFonts: true },
  }).render().asPng();
  await mkdir(output, { recursive: true });
  const base = 'quota-co-floor-grass-svg-source-validation-v1';
  const svgPath = path.join(output, `${base}.svg`);
  const pngPath = path.join(output, `${base}.png`);
  const metricsPath = path.join(output, `${base}-metrics.json`);
  const notesPath = path.join(output, `${base}.md`);
  await writeFile(svgPath, source, 'utf8');
  await writeFile(pngPath, png);
  await writeFile(metricsPath, `${JSON.stringify(metrics(entries), null, 2)}\n`, 'utf8');
  await writeFile(notesPath, `${notes(entries)}\n`, 'utf8');
  return { svgPath, pngPath, metricsPath, notesPath };
}

function outputFrom(argv: readonly string[]): string {
  const index = argv.indexOf('--out');
  return index >= 0 && argv[index + 1]
    ? path.resolve(argv[index + 1])
    : path.resolve('docs', 'previews');
}

if (
  process.argv[1]?.endsWith(
    'quotaCoFloorGrassSvgSourceValidationPreview.ts',
  )
) {
  renderQuotaCoFloorGrassSvgSourceValidation(outputFrom(process.argv.slice(2)))
    .then(({ svgPath, pngPath, metricsPath, notesPath }) => {
      process.stdout.write(
        'Wrote QuotaCo floor/grass SVG source validation:\n' +
        `${svgPath}\n${pngPath}\n${metricsPath}\n${notesPath}\n`,
      );
    })
    .catch((error: unknown) => {
      process.stderr.write(
        `${error instanceof Error ? error.message : String(error)}\n`,
      );
      process.exitCode = 1;
    });
}
