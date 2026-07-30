/**
 * Composes the accepted outdoor-direction proof and the systems-first gap proof
 * into one review board without modifying either source artifact.
 *
 *   node --import tsx scripts/quotaCoOutdoorSystemsCombinedPreview.ts
 *   node --import tsx scripts/quotaCoOutdoorSystemsCombinedPreview.ts --out docs/previews
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';

const WIDTH = 3600;
const HEADER_HEIGHT = 108;
const OUTDOOR_WIDTH = 3600;
const OUTDOOR_HEIGHT = 2530;
const SYSTEMS_SOURCE_WIDTH = 3200;
const SYSTEMS_SOURCE_HEIGHT = 2240;
const SYSTEMS_SCALE = WIDTH / SYSTEMS_SOURCE_WIDTH;
const SYSTEMS_HEIGHT = SYSTEMS_SOURCE_HEIGHT * SYSTEMS_SCALE;
const DIVIDER_HEIGHT = 76;
const FOOTER_HEIGHT = 58;
const GAP = 18;
const OUTDOOR_Y = HEADER_HEIGHT;
const DIVIDER_Y = OUTDOOR_Y + OUTDOOR_HEIGHT + GAP;
const SYSTEMS_Y = DIVIDER_Y + DIVIDER_HEIGHT;
const HEIGHT = SYSTEMS_Y + SYSTEMS_HEIGHT + FOOTER_HEIGHT;

const PAGE = '#E7E1D2';
const PANEL_ALT = '#ECE5D7';
const INK = '#292C2A';
const MUTED = '#626861';
const GREEN = '#355647';
const CORAL = '#B65F4D';
const RULE = '#A39B8B';

export const COMBINED_REVIEW_SECTIONS = [
  {
    id: 'outdoor-direction-calibration',
    file: 'quota-co-outdoor-construction-calibration-v1.svg',
    sourceWidth: OUTDOOR_WIDTH,
    sourceHeight: OUTDOOR_HEIGHT,
    renderedWidth: WIDTH,
    renderedHeight: OUTDOOR_HEIGHT,
  },
  {
    id: 'systems-first-gap-proof',
    file: 'quota-co-gameplay-systems-prop-gap-v1.svg',
    sourceWidth: SYSTEMS_SOURCE_WIDTH,
    sourceHeight: SYSTEMS_SOURCE_HEIGHT,
    renderedWidth: WIDTH,
    renderedHeight: SYSTEMS_HEIGHT,
  },
] as const;

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
  weight = 560,
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

function stripSvgShell(source: string): string {
  return source
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
}

function nestedSvg(
  inner: string,
  y: number,
  sourceWidth: number,
  sourceHeight: number,
  renderedHeight: number,
): string {
  return (
    `<svg x="0" y="${y}" width="${WIDTH}" height="${renderedHeight}" ` +
    `viewBox="0 0 ${sourceWidth} ${sourceHeight}" preserveAspectRatio="xMidYMin meet" ` +
    `overflow="hidden">${inner}</svg>`
  );
}

function combinedSheet(outdoor: string, systems: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" ` +
    `viewBox="0 0 ${WIDTH} ${HEIGHT}">` +
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAGE}"/>` +
    text(36, 42, 'QuotaCo outdoor prop program · combined review', 30, 880) +
    text(
      36,
      76,
      'Accepted exterior hybrid direction + systems-first candidate additions',
      15,
      800,
      CORAL,
    ) +
    text(
      WIDTH - 36,
      42,
      'REVIEW ONLY · source proofs unchanged',
      12,
      800,
      GREEN,
      'end',
    ) +
    text(
      WIDTH - 36,
      72,
      'visual scope first · production SVG and integration remain separate',
      11,
      650,
      MUTED,
      'end',
    ) +
    nestedSvg(
      stripSvgShell(outdoor),
      OUTDOOR_Y,
      OUTDOOR_WIDTH,
      OUTDOOR_HEIGHT,
      OUTDOOR_HEIGHT,
    ) +
    `<rect x="36" y="${DIVIDER_Y}" width="${WIDTH - 72}" height="${DIVIDER_HEIGHT - 10}" ` +
    `rx="10" fill="${PANEL_ALT}" stroke="${RULE}" stroke-width="1.5"/>` +
    text(
      60,
      DIVIDER_Y + 29,
      'SYSTEMS-FIRST EXTENSION',
      14,
      880,
      GREEN,
    ) +
    text(
      60,
      DIVIDER_Y + 52,
      'Only props with a named receiver, visible state, human consequence, and floor consequence proceed.',
      11,
      650,
      MUTED,
    ) +
    text(
      WIDTH - 60,
      DIVIDER_Y + 39,
      'HVAC · surveillance camera · sensor · privacy hedge',
      12,
      800,
      CORAL,
      'end',
    ) +
    nestedSvg(
      stripSvgShell(systems),
      SYSTEMS_Y,
      SYSTEMS_SOURCE_WIDTH,
      SYSTEMS_SOURCE_HEIGHT,
      SYSTEMS_HEIGHT,
    ) +
    text(
      36,
      HEIGHT - 22,
      'Combined for review only · neither proof is promoted, registered, exported, imported, or committed by this composition.',
      10.5,
      700,
      MUTED,
    ) +
    '</svg>'
  );
}

function sha256(source: string): string {
  return createHash('sha256').update(source).digest('hex');
}

export async function renderQuotaCoOutdoorSystemsCombinedPreview(
  output: string,
): Promise<{
  svgPath: string;
  pngPath: string;
  metricsPath: string;
}> {
  const sourceDirectory = path.resolve('docs/previews');
  const outdoorPath = path.join(
    sourceDirectory,
    COMBINED_REVIEW_SECTIONS[0].file,
  );
  const systemsPath = path.join(
    sourceDirectory,
    COMBINED_REVIEW_SECTIONS[1].file,
  );
  const [outdoor, systems] = await Promise.all([
    readFile(outdoorPath, 'utf8'),
    readFile(systemsPath, 'utf8'),
  ]);
  const source = combinedSheet(outdoor, systems);
  const png = new Resvg(source, {
    font: { loadSystemFonts: true },
  }).render().asPng();

  await mkdir(output, { recursive: true });
  const base = 'quota-co-outdoor-systems-combined-review-v2';
  const svgPath = path.join(output, `${base}.svg`);
  const pngPath = path.join(output, `${base}.png`);
  const metricsPath = path.join(output, `${base}-metrics.json`);
  await writeFile(svgPath, source, 'utf8');
  await writeFile(pngPath, png);
  await writeFile(
    metricsPath,
    `${JSON.stringify({
      status: 'combined-review-only',
      width: WIDTH,
      height: HEIGHT,
      sourceProofsModified: false,
      sections: [
        {
          ...COMBINED_REVIEW_SECTIONS[0],
          sha256: sha256(outdoor),
        },
        {
          ...COMBINED_REVIEW_SECTIONS[1],
          sha256: sha256(systems),
        },
      ],
      mutationsPerformed: {
        productionSvgSources: false,
        templates: false,
        exporter: false,
        schema: false,
        unityRegistration: false,
        commit: false,
      },
    }, null, 2)}\n`,
    'utf8',
  );
  return { svgPath, pngPath, metricsPath };
}

interface CliOptions {
  readonly output: string;
}

function parseArgs(args: readonly string[]): CliOptions {
  let output = path.resolve('docs/previews');
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--out') {
      const value = args[++index];
      if (!value) throw new Error('--out requires a path');
      output = path.resolve(value);
      continue;
    }
    throw new Error(`Unknown argument ${argument}`);
  }
  return { output };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const result = await renderQuotaCoOutdoorSystemsCombinedPreview(
    options.output,
  );
  process.stdout.write(
    'Wrote combined QuotaCo outdoor systems review:\n' +
    `${result.svgPath}\n` +
    `${result.pngPath}\n` +
    `${result.metricsPath}\n`,
  );
}

if (
  process.argv[1]?.endsWith('quotaCoOutdoorSystemsCombinedPreview.ts')
) {
  main().catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
