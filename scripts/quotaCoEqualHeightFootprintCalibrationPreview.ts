/**
 * Render a disposable, review-only footprint comparison for the accepted
 * QuotaCo equal-height wall art. No source SVG, ledger row, export contract,
 * atlas, or Unity registration is changed by this script.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import { composeWallShapes } from '../src/core/compositor';
import { defaultProject } from '../src/data/defaults';
import {
  EQUAL_HEIGHT_FOOTPRINT_BOUNDARY,
  EQUAL_HEIGHT_FOOTPRINT_FRONT_DATUM,
  EQUAL_HEIGHT_FOOTPRINT_PROFILES,
  EQUAL_HEIGHT_FOOTPRINT_PROOF_MASK_AXES,
  EQUAL_HEIGHT_FOOTPRINT_SOURCE_BACK_DATUM,
  calibrateEqualHeightFootprintShapes,
  transformEqualHeightFootprintPoint,
  type EqualHeightFootprintProfile,
} from './highOblique/equalHeightFootprintCalibration';
import {
  compileEqualHeightEvaluationFrames,
  type CompiledEqualHeightFrame,
} from './walls/equalHeightImporter';

const PAGE = '#E7E1D2';
const PANEL = '#F5F0E4';
const PANEL_ALT = '#ECE5D8';
const INK = '#272B29';
const MUTED = '#626A64';
const RULE = '#A39C8D';
const CORAL = '#C7684F';
const GREEN = '#50845B';
const CREAM = '#F4E4BE';
const BLUE = '#294565';
const BLUE_DARK = '#17283B';
const GOLD = '#D2A959';
const WIDTH = 1920;
const HEIGHT = 1330;
const MARGIN = 42;
const GAP = 18;
const CARD_TOP = 126;
const CARD_HEIGHT = 1110;
const CARD_WIDTH = (WIDTH - MARGIN * 2 - GAP * 3) / 4;

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

interface CliOptions {
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
  size = 16,
  weight = 500,
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
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="14" ` +
    `fill="${fill}" stroke="${stroke}"/>`
  );
}

function checker(x: number, y: number, size: number): string {
  return (
    `<rect x="${x}" y="${y}" width="${size}" height="${size}" ` +
    'fill="url(#checker)" stroke="#B8B1A3"/>'
  );
}

function stripSvgShell(source: string): string {
  return source
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
}

function profileAccent(profile: EqualHeightFootprintProfile): string {
  if (profile.role === 'selected-candidate') return GREEN;
  if (profile.role === 'lighter-candidate') return CORAL;
  if (profile.role === 'overscan-control') return BLUE;
  return MUTED;
}

function profileDetail(profile: EqualHeightFootprintProfile): string {
  if (profile.role === 'current') return 'observed in-game · undersized';
  if (profile.role === 'lighter-candidate') return 'credible, but visually light';
  if (profile.role === 'selected-candidate') return 'chosen against locked agent scale';
  return 'clips north/west · blue tile is the reference';
}

class ProofRenderer {
  private readonly byMask: ReadonlyMap<number, CompiledEqualHeightFrame>;
  private readonly cache = new Map<string, string>();
  private readonly wall;
  private readonly style;

  constructor(frames: readonly CompiledEqualHeightFrame[]) {
    this.byMask = new Map(frames.map((frame) => [frame.index, frame]));
    const project = defaultProject();
    const wall = project.walls.find(({ id }) => id === 'wall-office');
    if (!wall) throw new Error('Default project is missing wall-office');
    this.wall = wall;
    this.style = project.style;
  }

  private tileMarkup(
    mask: number,
    profile: EqualHeightFootprintProfile,
  ): string {
    const cacheKey = `${profile.id}:${mask}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;
    const frame = this.byMask.get(mask);
    const axis = EQUAL_HEIGHT_FOOTPRINT_PROOF_MASK_AXES[mask];
    if (!frame || !axis) {
      throw new Error(`Footprint proof has no mapped frame for mask_${mask}`);
    }
    const shapes = calibrateEqualHeightFootprintShapes(
      frame.shapes,
      axis,
      profile,
    );
    const markup = stripSvgShell(
      composeWallShapes(shapes, this.wall, this.style, 128),
    );
    this.cache.set(cacheKey, markup);
    return markup;
  }

  tile(
    mask: number,
    profile: EqualHeightFootprintProfile,
    x: number,
    y: number,
    size: number,
    background = true,
    flipX = false,
  ): string {
    const markup = this.tileMarkup(mask, profile);
    return (
      (background ? checker(x, y, size) : '') +
      `<svg x="${x}" y="${y}" width="${size}" height="${size}" ` +
      'viewBox="0 0 128 128" preserveAspectRatio="none">' +
      (flipX
        ? `<g transform="matrix(-1 0 0 1 128 0)">${markup}</g>`
        : markup) +
      '</svg>' +
      `<rect x="${x}" y="${y}" width="${size}" height="${size}" ` +
      'fill="none" stroke="#807A70" stroke-opacity=".42"/>'
    );
  }
}

function datumOverlay(
  parts: string[],
  profile: EqualHeightFootprintProfile,
  x: number,
  y: number,
  size: number,
): void {
  const sourceBack = transformEqualHeightFootprintPoint(
    {
      x: EQUAL_HEIGHT_FOOTPRINT_SOURCE_BACK_DATUM,
      y: EQUAL_HEIGHT_FOOTPRINT_SOURCE_BACK_DATUM,
    },
    'both',
    profile,
  );
  const back = sourceBack.x * size / 128;
  const front = EQUAL_HEIGHT_FOOTPRINT_FRONT_DATUM * size / 128;
  const accent = profileAccent(profile);
  parts.push(
    `<path d="M ${x + back} ${y + 6} V ${y + size - 6} ` +
      `M ${x + 6} ${y + back} H ${x + size - 6}" ` +
      `stroke="${accent}" stroke-width="2" stroke-dasharray="6 5"/>`,
  );
  parts.push(
    `<path d="M ${x + front} ${y + 6} V ${y + size - 6} ` +
      `M ${x + 6} ${y + front} H ${x + size - 6}" ` +
      `stroke="${INK}" stroke-width="1.5" stroke-dasharray="2 5"/>`,
  );
}

function blueControlTile(x: number, y: number, size: number): string {
  const inset = Math.max(4, size * 0.06);
  return (
    checker(x, y, size) +
    `<rect x="${x + 1}" y="${y + 1}" width="${size - 2}" height="${size - 2}" ` +
    `fill="${BLUE}" stroke="${BLUE_DARK}" stroke-width="${Math.max(3, size * 0.05)}"/>` +
    `<path d="M ${x + inset} ${y + inset * 1.35} H ${x + size - inset}" ` +
    `stroke="${GOLD}" stroke-width="${Math.max(1, size * 0.018)}"/>`
  );
}

function closeStudy(
  parts: string[],
  renderer: ProofRenderer,
  profile: EqualHeightFootprintProfile,
  cardX: number,
): void {
  const size = 240;
  const x = cardX + (CARD_WIDTH - size) / 2;
  const y = CARD_TOP + 106;
  parts.push(text(cardX + 22, y - 14, '240 px · corner envelope', 13, 760));
  parts.push(renderer.tile(6, profile, x, y, size));
  datumOverlay(parts, profile, x, y, size);
  parts.push(
    text(
      cardX + CARD_WIDTH / 2,
      y + size + 21,
      'colored dash = back edge · dark dash = fixed frontage',
      11,
      560,
      MUTED,
      'middle',
    ),
  );
}

function normalStudy(
  parts: string[],
  renderer: ProofRenderer,
  profile: EqualHeightFootprintProfile,
  cardX: number,
): void {
  const y = CARD_TOP + 401;
  const size = 90;
  const startX = cardX + 26;
  const cellGap = 10;
  parts.push(text(cardX + 22, y - 13, '90 px · cross-axis read', 13, 760));
  parts.push(renderer.tile(10, profile, startX, y, size));
  parts.push(renderer.tile(5, profile, startX + size + cellGap, y, size));
  parts.push(
    renderer.tile(
      5,
      profile,
      startX + (size + cellGap) * 2,
      y,
      size,
      true,
      true,
    ),
  );
  parts.push(blueControlTile(startX + (size + cellGap) * 3, y, size));
  parts.push(text(startX + size / 2, y + 106, 'horizontal', 11, 650, MUTED, 'middle'));
  parts.push(
    text(
      startX + size + cellGap + size / 2,
      y + 106,
      'vertical W',
      11,
      650,
      MUTED,
      'middle',
    ),
  );
  parts.push(
    text(
      startX + (size + cellGap) * 2 + size / 2,
      y + 106,
      'vertical E',
      11,
      650,
      MUTED,
      'middle',
    ),
  );
  parts.push(
    text(
      startX + (size + cellGap) * 3 + size / 2,
      y + 106,
      'blue control',
      11,
      650,
      MUTED,
      'middle',
    ),
  );
}

function roomStudy(
  parts: string[],
  renderer: ProofRenderer,
  profile: EqualHeightFootprintProfile,
  cardX: number,
): void {
  const tileSize = 90;
  const roomSize = tileSize * 3;
  const x = cardX + (CARD_WIDTH - roomSize) / 2;
  const y = CARD_TOP + 568;
  parts.push(text(cardX + 22, y - 13, '90 px · installed L / room read', 13, 760));
  parts.push(
    `<rect x="${x}" y="${y}" width="${roomSize}" height="${roomSize}" ` +
    'fill="#74818B" stroke="#5E685F" stroke-width="2"/>',
  );
  for (let index = 1; index < 3; index += 1) {
    parts.push(
      `<path d="M ${x + index * tileSize} ${y} V ${y + roomSize} ` +
      `M ${x} ${y + index * tileSize} H ${x + roomSize}" ` +
      'stroke="#D7D3C7" stroke-opacity=".18"/>',
    );
  }
  parts.push(renderer.tile(6, profile, x, y, tileSize, false));
  parts.push(renderer.tile(10, profile, x + tileSize, y, tileSize, false));
  parts.push(renderer.tile(8, profile, x + tileSize * 2, y, tileSize, false));
  parts.push(renderer.tile(5, profile, x, y + tileSize, tileSize, false));
  parts.push(renderer.tile(1, profile, x, y + tileSize * 2, tileSize, false));

  const personX = x + tileSize * 1.68;
  const personY = y + tileSize * 1.78;
  parts.push(
    `<ellipse cx="${personX}" cy="${personY + 32}" rx="29" ry="11" ` +
      'fill="#35403E" opacity=".22"/>',
  );
  parts.push(
    `<path d="M ${personX - 24} ${personY + 5} ` +
      `Q ${personX} ${personY - 9} ${personX + 24} ${personY + 5} ` +
      `V ${personY + 42} Q ${personX} ${personY + 54} ${personX - 24} ${personY + 42}Z" ` +
      `fill="${CORAL}" stroke="${INK}" stroke-width="4"/>`,
  );
  parts.push(
    `<circle cx="${personX}" cy="${personY - 9}" r="18" ` +
      `fill="${CREAM}" stroke="${INK}" stroke-width="4"/>`,
  );
}

function distanceStudy(
  parts: string[],
  renderer: ProofRenderer,
  profile: EqualHeightFootprintProfile,
  cardX: number,
): void {
  const tileSize = 40;
  const y = CARD_TOP + 903;
  parts.push(text(cardX + 22, y - 14, '40 px · straight seam runs', 13, 760));
  const runs = [1, 3, 6] as const;
  runs.forEach((count, row) => {
    const width = count * tileSize;
    const x = cardX + 67;
    const py = y + row * 50;
    parts.push(text(x - 13, py + 26, `${count}`, 12, 760, MUTED, 'end'));
    for (let index = 0; index < count; index += 1) {
      parts.push(
        renderer.tile(
          10,
          profile,
          x + index * tileSize,
          py,
          tileSize,
        ),
      );
    }
    if (count === 6) {
      parts.push(
        text(
          x + width + 12,
          py + 25,
          'cells',
          10,
          600,
          MUTED,
        ),
      );
    }
  });
}

function reviewSheet(frames: readonly CompiledEqualHeightFrame[]): string {
  const renderer = new ProofRenderer(frames);
  const parts: string[] = [
    '<defs>' +
      '<pattern id="checker" width="16" height="16" patternUnits="userSpaceOnUse">' +
      '<rect width="16" height="16" fill="#D8D3C7"/>' +
      '<path d="M0 0H8V8H0ZM8 8H16V16H8Z" fill="#C9C3B6"/>' +
      '</pattern>' +
      '</defs>',
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAGE}"/>`,
  ];
  parts.push(text(MARGIN, 48, 'QuotaCo equal-height wall · footprint calibration', 31, 800));
  parts.push(
    text(
      MARGIN,
      78,
      'REVIEW ONLY · same 128 px frame, 512 PPU import contract, pivot, renderer scale, palette, and topology',
      15,
      650,
      MUTED,
    ),
  );
  parts.push(
    text(
      MARGIN,
      103,
      'The wall grows north/west; the south/east frontage remains fixed at authored datum 123.5.',
      15,
      560,
      MUTED,
    ),
  );
  parts.push(
    `<path d="M ${MARGIN} 116 H ${WIDTH - MARGIN}" stroke="${RULE}"/>`,
  );

  EQUAL_HEIGHT_FOOTPRINT_PROFILES.forEach((profile, index) => {
    const x = MARGIN + index * (CARD_WIDTH + GAP);
    const accent = profileAccent(profile);
    parts.push(
      panel(
        x,
        CARD_TOP,
        CARD_WIDTH,
        CARD_HEIGHT,
        profile.role === 'selected-candidate' ? '#EEF2E7' : PANEL,
        accent,
      ),
    );
    parts.push(
      `<rect x="${x}" y="${CARD_TOP}" width="${CARD_WIDTH}" height="8" ` +
      `rx="4" fill="${accent}"/>`,
    );
    parts.push(
      text(
        x + CARD_WIDTH / 2,
        CARD_TOP + 42,
        profile.label,
        20,
        800,
        accent,
        'middle',
      ),
    );
    parts.push(
      text(
        x + CARD_WIDTH / 2,
        CARD_TOP + 67,
        profileDetail(profile),
        13,
        600,
        MUTED,
        'middle',
      ),
    );
    closeStudy(parts, renderer, profile, x);
    normalStudy(parts, renderer, profile, x);
    roomStudy(parts, renderer, profile, x);
    distanceStudy(parts, renderer, profile, x);
  });

  parts.push(
    panel(MARGIN, 1255, WIDTH - MARGIN * 2, 48, PANEL_ALT),
    text(
      WIDTH / 2,
      1286,
      'Decision gate: choose the gameplay footprint first. All-47 socket rephasing and a disposable Unity wall lab come only after selection.',
      14,
      700,
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
    '.style-loop/quota-co-wall-footprint-calibration',
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
  const frames = await compileEqualHeightEvaluationFrames({
    sourceRoots: SOURCE_ROOTS,
  });
  const source = reviewSheet(frames);
  const png = new Resvg(source, {
    font: { loadSystemFonts: true },
  }).render().asPng();
  await mkdir(options.output, { recursive: true });
  await writeFile(
    path.join(
      options.output,
      'quota-co-wall-footprint-calibration-review.svg',
    ),
    source,
    'utf8',
  );
  await writeFile(
    path.join(
      options.output,
      'quota-co-wall-footprint-calibration-review.png',
    ),
    png,
  );
  await writeFile(
    path.join(
      options.output,
      'quota-co-wall-footprint-calibration-review.json',
    ),
    `${JSON.stringify({
      boundary: EQUAL_HEIGHT_FOOTPRINT_BOUNDARY,
      sourceFrameSize: 128,
      fixedFrontDatum: EQUAL_HEIGHT_FOOTPRINT_FRONT_DATUM,
      profiles: EQUAL_HEIGHT_FOOTPRINT_PROFILES,
      proofMasks: Object.keys(EQUAL_HEIGHT_FOOTPRINT_PROOF_MASK_AXES)
        .map(Number)
        .sort((left, right) => left - right),
    }, null, 2)}\n`,
    'utf8',
  );
  process.stdout.write(
    `Wrote review-only QuotaCo wall footprint calibration to ${options.output}\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
