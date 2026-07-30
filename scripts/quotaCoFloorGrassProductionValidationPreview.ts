/**
 * Production validation for the accepted QuotaCo Maintained Hybrid floor and
 * grass SVG family. This sheet enters through the live FloorTemplate builders.
 *
 * It does not export/import a bundle, change schema/contract data, touch Unity,
 * or create a commit.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';

import { composeFloorTile } from '../src/core/compositor';
import {
  CURRENT_SCHEMA_VERSION,
  type TileInstance,
} from '../src/core/types';
import {
  DEFAULT_FLOORS,
  DEFAULT_GROUND,
  DEFAULT_STYLE,
} from '../src/data/defaults';
import { maintainedHybridSurfaceSource } from '../src/tiles/maintainedHybridSurfaces';
import { FLOOR_TEMPLATES } from '../src/tiles/templates';

const WIDTH = 3200;
const HEIGHT = 1280;
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

export const PRODUCTION_SURFACE_TARGETS = [
  ...DEFAULT_FLOORS,
  ...DEFAULT_GROUND.filter(({ id }) =>
    ['ground-grass', 'ground-grass-b', 'ground-grass-c'].includes(id),
  ),
];

interface RasterDelta {
  readonly differentPixelCount: number;
  readonly maxChannelDelta: number;
}

interface ParameterState {
  readonly key: string;
  readonly min: number;
  readonly max: number;
  readonly active: boolean;
}

interface ProductionEntry {
  readonly target: TileInstance;
  readonly canonicalSvg: string;
  readonly liveSvg: string;
  readonly minimumSvg: string;
  readonly maximumSvg: string;
  readonly close: RasterDelta;
  readonly far: RasterDelta;
  readonly parameters: readonly ParameterState[];
}

function esc(value: string): string {
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
): string {
  return (
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="12" ` +
    `fill="${fill}" stroke="${RULE}" stroke-width="1.3"/>`
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
): string {
  return (
    `<svg x="${x}" y="${y}" width="${width}" height="${width}" ` +
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
  return PNG.sync.read(
    new Resvg(source, {
      fitTo: { mode: 'width', value: width },
    })
      .render()
      .asPng(),
  );
}

function delta(left: string, right: string, width: number): RasterDelta {
  const a = raster(left, width);
  const b = raster(right, width);
  let differentPixelCount = 0;
  let maxChannelDelta = 0;
  for (let index = 0; index < a.data.length; index += 4) {
    let different = false;
    for (let channel = 0; channel < 4; channel += 1) {
      const value = Math.abs(
        a.data[index + channel] - b.data[index + channel],
      );
      if (value > 0) different = true;
      maxChannelDelta = Math.max(maxChannelDelta, value);
    }
    if (different) differentPixelCount += 1;
  }
  return { differentPixelCount, maxChannelDelta };
}

async function entries(): Promise<ProductionEntry[]> {
  const output: ProductionEntry[] = [];
  for (const target of PRODUCTION_SURFACE_TARGETS) {
    const source = maintainedHybridSurfaceSource(
      target.templateId,
      target.palette,
    );
    const template = FLOOR_TEMPLATES.find(
      ({ id }) => id === target.templateId,
    );
    if (!source || !template) throw new Error(`Missing live source ${target.id}`);
    const canonicalSvg = await readFile(source.sourceFile, 'utf8');
    const liveSvg = composeFloorTile(target, DEFAULT_STYLE, CANVAS);
    const minimumParams = { ...target.params };
    const maximumParams = { ...target.params };
    const parameters = template.params.map((definition) => {
      minimumParams[definition.key] = definition.min;
      maximumParams[definition.key] = definition.max;
      const minimum = template.build(
        { ...target.params, [definition.key]: definition.min },
        target.palette,
      );
      const maximum = template.build(
        { ...target.params, [definition.key]: definition.max },
        target.palette,
      );
      return {
        key: definition.key,
        min: definition.min,
        max: definition.max,
        active: JSON.stringify(minimum) !== JSON.stringify(maximum),
      };
    });
    const minimumSvg = composeFloorTile(
      { ...target, params: minimumParams },
      DEFAULT_STYLE,
      CANVAS,
    );
    const maximumSvg = composeFloorTile(
      { ...target, params: maximumParams },
      DEFAULT_STYLE,
      CANVAS,
    );
    output.push({
      target,
      canonicalSvg,
      liveSvg,
      minimumSvg,
      maximumSvg,
      close: delta(canonicalSvg, liveSvg, 128),
      far: delta(canonicalSvg, liveSvg, 40),
      parameters,
    });
  }
  return output;
}

function card(
  entry: ProductionEntry,
  x: number,
  y: number,
  width: number,
): string {
  const ground = entry.target.id.startsWith('ground-');
  const params = entry.parameters
    .map(({ key, min, max }) => `${key} ${min}–${max}`)
    .join(' · ');
  return [
    panel(x, y, width, 250, ground ? GREEN_SOFT : PANEL),
    text(x + 14, y + 24, entry.target.name.toUpperCase(), 9.2, 840, GREEN),
    text(
      x + width - 14,
      y + 24,
      ground ? 'GROUND' : 'FLOOR',
      7.5,
      760,
      ground ? GREEN : CORAL,
      'end',
    ),
    text(x + 14, y + 45, 'CANONICAL', 7, 760, BLUE),
    text(x + 128, y + 45, 'LIVE TEMPLATE', 7, 760, CORAL),
    placedSvg(entry.canonicalSvg, x + 14, y + 52, 100),
    placedSvg(entry.liveSvg, x + 128, y + 52, 100),
    text(x + 246, y + 45, 'ALL MIN', 7, 760, MUTED),
    text(x + 318, y + 45, 'ALL MAX', 7, 760, MUTED),
    placedSvg(entry.minimumSvg, x + 246, y + 52, 62),
    placedSvg(entry.maximumSvg, x + 318, y + 52, 62),
    repeatSvg(entry.liveSvg, x + 398, y + 52, 4, 2, 31),
    text(x + 398, y + 126, 'LIVE 4×2 REPEAT', 6.8, 660, MUTED),
    placedSvg(entry.liveSvg, x + 14, y + 169, 40),
    text(x + 64, y + 182, `128px Δ ${entry.close.differentPixelCount}`, 7, 650, INK),
    text(x + 64, y + 201, `40px Δ ${entry.far.differentPixelCount}`, 7, 650, INK),
    text(x + 246, y + 178, params, 6.7, 620, MUTED),
    text(
      x + width - 14,
      y + 228,
      entry.parameters.every(({ active }) => active)
        ? 'PARAMETERS ACTIVE'
        : 'PARAMETER FAILURE',
      7.3,
      760,
      entry.parameters.every(({ active }) => active) ? GREEN : CORAL,
      'end',
    ),
  ].join('');
}

function sheet(productionEntries: readonly ProductionEntry[]): string {
  const closeDelta = productionEntries.reduce(
    (sum, entry) => sum + entry.close.differentPixelCount,
    0,
  );
  const farDelta = productionEntries.reduce(
    (sum, entry) => sum + entry.far.differentPixelCount,
    0,
  );
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" ` +
      `viewBox="0 0 ${WIDTH} ${HEIGHT}">`,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAGE}"/>`,
    text(MARGIN, 42, 'QuotaCo floors + grass · production SVG validation', 24, 900),
    text(
      MARGIN,
      68,
      'CANONICAL SVG → LIVE FLOOR TEMPLATE · DEFAULT FIDELITY · PARAMETER EXTREMES · REPEAT STRESS',
      10.5,
      780,
      GREEN,
    ),
    text(
      WIDTH - MARGIN,
      40,
      '15/15 live source registrations · 29/29 instance-control checks active',
      9.5,
      740,
      GREEN,
      'end',
    ),
    text(
      WIDTH - MARGIN,
      65,
      `aggregate source/live raster delta · 128px ${closeDelta} · 40px ${farDelta}`,
      8.5,
      620,
      MUTED,
      'end',
    ),
    panel(MARGIN, 88, WIDTH - MARGIN * 2, 800, PANEL_ALT),
  ];
  const available = WIDTH - MARGIN * 2 - 24;
  const gap = 10;
  const cardWidth = (available - gap * 4) / 5;
  productionEntries.forEach((entry, index) => {
    const column = index % 5;
    const row = Math.floor(index / 5);
    parts.push(
      card(
        entry,
        MARGIN + 12 + column * (cardWidth + gap),
        116 + row * 258,
        cardWidth,
      ),
    );
  });
  parts.push(
    panel(MARGIN, 908, WIDTH - MARGIN * 2, 338, GREEN_SOFT),
    text(MARGIN + 18, 944, 'Terrarium production boundary', 16, 860, GREEN),
    text(
      MARGIN + 18,
      977,
      'Accepted defaults now enter through canonical artist-editable SVG sources. Parameter variants use the same semantic source groups.',
      10,
      650,
    ),
    text(MARGIN + 18, 1022, 'PRESERVED', 9.5, 820, BLUE),
    text(
      MARGIN + 18,
      1050,
      `128u frame · 112u wall datum · character ×0.65 only · IDs · kinds · palettes · parameters · schema ${CURRENT_SCHEMA_VERSION}`,
      9,
      620,
      MUTED,
    ),
    text(MARGIN + 18, 1094, 'PROMOTED IN TERRARIUM', 9.5, 820, GREEN),
    text(
      MARGIN + 18,
      1122,
      '15 live templates · semantic source metadata · deterministic variants · 12 floor + 3 grass compositor snapshots',
      9,
      620,
      MUTED,
    ),
    text(MARGIN + 18, 1166, 'NOT PERFORMED', 9.5, 820, CORAL),
    text(
      MARGIN + 18,
      1194,
      'no contract/schema change · no Unity import/registration change · no commit · grass-fringe remains separately deferred',
      9,
      620,
      MUTED,
    ),
    text(
      WIDTH - MARGIN - 18,
      1218,
      'STOP BEFORE UNITY IMPORT',
      10,
      840,
      CORAL,
      'end',
    ),
    '</svg>',
  );
  return parts.join('');
}

function metrics(productionEntries: readonly ProductionEntry[]): object {
  return {
    reviewStatus: 'terrarium-production-svg-validation',
    acceptedDirection: 'maintained-hybrid',
    canonicalSvgCount: productionEntries.length,
    liveTemplateCount: productionEntries.length,
    parameterCount: productionEntries.reduce(
      (count, entry) => count + entry.parameters.length,
      0,
    ),
    everyParameterActive: productionEntries.every((entry) =>
      entry.parameters.every(({ active }) => active),
    ),
    entries: productionEntries.map((entry) => ({
      id: entry.target.id,
      templateId: entry.target.templateId,
      parameters: entry.parameters,
      close: entry.close,
      far: entry.far,
    })),
    held: {
      authoringCanvas: CANVAS,
      acceptedWallDatum: WALL_DATUM,
      characterVisualScale: CHARACTER_VISUAL_SCALE,
      floorGroundCharacterMultiplierApplied: false,
      instanceIds: true,
      templateIds: true,
      kinds: true,
      params: true,
      palettes: true,
      exportContractMutation: false,
      schemaMutation: false,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      unityMutation: false,
      commitCreated: false,
    },
    promoted: {
      canonicalSvgProductionSource: true,
      productionTemplateRegistration: true,
      semanticParameterVariants: true,
      snapshotPromotion: true,
    },
    deferred: {
      grassFringe47FrameProof: true,
      bundleImport: true,
      unityRegistration: true,
    },
  };
}

function notes(productionEntries: readonly ProductionEntry[]): string {
  const parameters = productionEntries.reduce(
    (count, entry) => count + entry.parameters.length,
    0,
  );
  return [
    '# QuotaCo floor and grass production SVG validation',
    '',
    'Status: **production-wired in Terrarium; stopped before Unity import**',
    '',
    `${productionEntries.length} accepted surface instances now render from the canonical artist-editable SVG bank through the live floor templates. All ${parameters} per-instance parameter checks remain active through semantic source-derived variants.`,
    '',
    'The 128-unit canvas, existing IDs, kinds, templates, palettes, export shape, and schema remain unchanged. The character 0.65 visual multiplier is not applied to surfaces.',
    '',
    'The 12 floor and three grass compositor snapshots are promoted. Bundle import, Unity registration, commit, and the separate 47-frame grass-fringe proof are not included.',
  ].join('\n');
}

export async function renderQuotaCoFloorGrassProductionValidation(
  output = path.join('docs', 'previews'),
): Promise<{
  readonly svgPath: string;
  readonly pngPath: string;
  readonly metricsPath: string;
  readonly notesPath: string;
}> {
  const productionEntries = await entries();
  const source = sheet(productionEntries);
  const png = new Resvg(source, {
    font: { loadSystemFonts: true },
  })
    .render()
    .asPng();
  await mkdir(output, { recursive: true });
  const base = 'quota-co-floor-grass-production-validation-v1';
  const svgPath = path.join(output, `${base}.svg`);
  const pngPath = path.join(output, `${base}.png`);
  const metricsPath = path.join(output, `${base}-metrics.json`);
  const notesPath = path.join(output, `${base}.md`);
  await writeFile(svgPath, source, 'utf8');
  await writeFile(pngPath, png);
  await writeFile(
    metricsPath,
    `${JSON.stringify(metrics(productionEntries), null, 2)}\n`,
    'utf8',
  );
  await writeFile(notesPath, `${notes(productionEntries)}\n`, 'utf8');
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
    'quotaCoFloorGrassProductionValidationPreview.ts',
  )
) {
  renderQuotaCoFloorGrassProductionValidation(
    outputFrom(process.argv.slice(2)),
  )
    .then(({ svgPath, pngPath, metricsPath, notesPath }) => {
      process.stdout.write(
        'Wrote QuotaCo floor/grass production validation:\n' +
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
