/**
 * Review-only proof for moving IRIS apparatus geometry into three SVG sources.
 *
 *   npx tsx scripts/canonicalIrisHardwareSourceFitProof.ts [outDir]
 *
 * The live PropTemplates remain untouched. The green column is rendered from
 * the proposal SVGs plus declared height-role transforms.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import { composeCharacter, composeProp } from '../src/core/compositor';
import type { CharacterRecipe, PropInstance } from '../src/core/types';
import { CONSTRUCTION_CREW, DEFAULT_PROPS, DEFAULT_STYLE } from '../src/data/defaults';
import {
  CANONICAL_IRIS_HEIGHTS,
  CANONICAL_IRIS_SOURCE_FILES,
  canonicalIrisHardwareSvg,
  type CanonicalIrisHardwareId,
  type CanonicalIrisInstallationId,
} from './props/canonicalIrisHardwareFit';

const WIDTH = 1400;
const COLORS = {
  page: '#E7EBEA',
  panel: '#F9FAF8',
  panelAlt: '#EEF2EF',
  floor: '#898478',
  floorLine: '#777166',
  ink: '#27312D',
  muted: '#66736D',
  line: '#CAD2CE',
  current: '#8A5B3D',
  source: '#2E7D5B',
  sourcePale: '#DDEBE3',
} as const;

function prop(id: CanonicalIrisHardwareId, params: Record<string, number> = {}): PropInstance {
  const source = DEFAULT_PROPS.find(({ templateId }) => templateId === id);
  if (!source) throw new Error(`Missing default ${id}`);
  return { ...structuredClone(source), params };
}

function crew(): CharacterRecipe {
  const source = CONSTRUCTION_CREW[0];
  if (!source) throw new Error('Missing construction crew');
  return structuredClone(source);
}

function currentSvg(id: CanonicalIrisHardwareId, params: Record<string, number>, size = 128): string {
  return composeProp(prop(id, params), DEFAULT_STYLE, size);
}

function sourceSvg(id: CanonicalIrisHardwareId, params: Record<string, number>, size = 128): string {
  const instance = prop(id, params);
  return canonicalIrisHardwareSvg(id, params, instance.palette, size);
}

function inner(svg: string): string {
  return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

function nested(svg: string, x: number, y: number, size: number): string {
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 128 128">${inner(svg)}</svg>`;
}

function text(
  x: number,
  y: number,
  value: string,
  size = 13,
  weight = 450,
  fill: string = COLORS.ink,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="system-ui,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${value}</text>`;
}

function header(parts: string[], title: string, subtitle: string, page: string): void {
  parts.push(
    `<rect width="${WIDTH}" height="100%" fill="${COLORS.page}"/>`,
    text(28, 38, title, 25, 750),
    text(28, 62, subtitle, 12, 480, COLORS.muted),
    `<rect x="1190" y="24" width="182" height="32" rx="16" fill="${COLORS.sourcePale}"/>`,
    text(1281, 45, page, 10, 720, COLORS.source, 'middle'),
  );
}

function comparisonCard(
  parts: string[],
  id: CanonicalIrisInstallationId,
  height: number,
  x: number,
  y: number,
): void {
  const width = 428;
  parts.push(
    `<rect x="${x}" y="${y}" width="${width}" height="276" rx="10" fill="${COLORS.panel}" stroke="${COLORS.line}"/>`,
    text(x + 18, y + 28, `HEIGHT ${height}`, 12, 750),
    text(x + 18, y + 48, 'same 2x1 footprint + centered console', 10, 450, COLORS.muted),
    text(x + 110, y + 74, 'PRODUCTION', 9, 720, COLORS.current, 'middle'),
    text(x + 318, y + 74, 'SVG SOURCE', 9, 720, COLORS.source, 'middle'),
    `<rect x="${x + 35}" y="${y + 84}" width="150" height="150" rx="8" fill="#FFFFFF" stroke="${COLORS.current}"/>`,
    `<rect x="${x + 243}" y="${y + 84}" width="150" height="150" rx="8" fill="#FFFFFF" stroke="${COLORS.source}"/>`,
    nested(currentSvg(id, { height }), x + 46, y + 95, 128),
    nested(sourceSvg(id, { height }), x + 254, y + 95, 128),
    nested(currentSvg(id, { height }, 32), x + 91, y + 232, 32),
    nested(sourceSvg(id, { height }, 32), x + 299, y + 232, 32),
    text(x + 110, y + 270, '32 px', 9, 600, COLORS.muted, 'middle'),
    text(x + 318, y + 270, '32 px', 9, 600, COLORS.muted, 'middle'),
  );
}

function paritySheet(): string {
  const HEIGHT = 860;
  const parts: string[] = [];
  header(
    parts,
    'Canonical IRIS hardware — source / production parity',
    'Review only: three editable SVG proposals; live templates, exporter, catalog, and Unity remain unchanged.',
    '1 / SOURCE FIT',
  );
  const heights = [78, 90, 98];
  (['iris-installation-unit', 'iris-installation-unit-dormant'] as const).forEach((id, row) => {
    const y = 112 + row * 338;
    parts.push(
      text(28, y + 18, id === 'iris-installation-unit' ? 'LIVE' : 'DORMANT', 14, 780, id === 'iris-installation-unit' ? COLORS.source : COLORS.ink),
      text(124, y + 18, id, 10, 480, COLORS.muted),
    );
    heights.forEach((height, column) => comparisonCard(parts, id, height, 28 + column * 448, y + 30));
  });

  const dockY = 794;
  parts.push(
    text(28, dockY, 'DOCK', 12, 780),
    text(82, dockY, 'static 1x1 plan source is also pixel-identical', 10, 480, COLORS.muted),
    nested(currentSvg('iris-charging-dock', {}), 360, dockY - 46, 64),
    text(392, dockY + 30, 'production', 9, 650, COLORS.current, 'middle'),
    nested(sourceSvg('iris-charging-dock', {}), 470, dockY - 46, 64),
    text(502, dockY + 30, 'SVG source', 9, 650, COLORS.source, 'middle'),
    text(WIDTH - 28, HEIGHT - 18, 'stop for visual source-fit approval', 10, 720, COLORS.source, 'end'),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">${parts.join('')}</svg>`;
}

function floorGrid(parts: string[], x: number, y: number, width: number, height: number): void {
  parts.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="9" fill="${COLORS.floor}"/>`);
  for (let gx = x + 32; gx < x + width; gx += 32) {
    parts.push(`<path d="M ${gx} ${y} V ${y + height}" stroke="${COLORS.floorLine}" opacity=".35"/>`);
  }
  for (let gy = y + 32; gy < y + height; gy += 32) {
    parts.push(`<path d="M ${x} ${gy} H ${x + width}" stroke="${COLORS.floorLine}" opacity=".35"/>`);
  }
}

function contextPanel(parts: string[], x: number, y: number, useSource: boolean): void {
  const width = 650;
  const height = 550;
  parts.push(
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="12" fill="${COLORS.panel}" stroke="${useSource ? COLORS.source : COLORS.current}"/>`,
    text(x + 20, y + 32, useSource ? 'SVG SOURCE FAMILY' : 'CURRENT PRODUCTION', 13, 780, useSource ? COLORS.source : COLORS.current),
    text(x + 20, y + 54, 'literal prop scale; fabrication units remain at game character scale', 10, 450, COLORS.muted),
  );
  const floorX = x + 18;
  const floorY = y + 76;
  floorGrid(parts, floorX, floorY, width - 36, height - 96);

  const hardware = (id: CanonicalIrisHardwareId, params: Record<string, number>) =>
    useSource ? sourceSvg(id, params) : currentSvg(id, params);
  const crewSvg = composeCharacter(crew(), DEFAULT_STYLE, 'south', 128, 'normal', { badge: false });
  const crewEast = composeCharacter(crew(), DEFAULT_STYLE, 'east', 128, 'normal', { badge: false });
  parts.push(
    nested(hardware('iris-installation-unit', { height: 90 }), floorX + 18, floorY + 258, 128),
    nested(hardware('iris-charging-dock', {}), floorX + 222, floorY + 296, 96),
    nested(crewSvg, floorX + 228, floorY + 278, 83),
    nested(hardware('iris-charging-dock', {}), floorX + 386, floorY + 296, 96),
    nested(crewEast, floorX + 392, floorY + 278, 83),
    nested(hardware('iris-charging-dock', {}), floorX + 500, floorY + 296, 96),
    text(floorX + 24, floorY + 34, '2x1 apparatus', 10, 700, '#F4F1E8'),
    text(floorX + width - 52, floorY + 34, '1x1 bays', 10, 700, '#F4F1E8', 'end'),
  );
}

function contextSheet(): string {
  const HEIGHT = 730;
  const parts: string[] = [];
  header(
    parts,
    'Canonical IRIS hardware — literal context',
    'The proposal preserves the approved asymmetry, sparse live register, dock relationship, and gameplay-scale hierarchy.',
    '2 / CONTEXT',
  );
  contextPanel(parts, 28, 118, false);
  contextPanel(parts, 722, 118, true);
  parts.push(
    text(28, HEIGHT - 22, 'review-only SVG proposals · no source registration, production replacement, export, bundle, or Unity change', 10, 680, COLORS.current),
    text(WIDTH - 28, HEIGHT - 22, 'visual approval required before promotion', 10, 720, COLORS.source, 'end'),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">${parts.join('')}</svg>`;
}

function pixels(svg: string): Buffer {
  return Buffer.from(new Resvg(svg, { font: { loadSystemFonts: false } }).render().pixels);
}

function pixelParity(): { cases: number; mismatches: string[]; digest: string } {
  const mismatches: string[] = [];
  const digests: Buffer[] = [];
  for (const id of ['iris-installation-unit', 'iris-installation-unit-dormant'] as const) {
    for (const height of CANONICAL_IRIS_HEIGHTS) {
      const current = pixels(currentSvg(id, { height }));
      const source = pixels(sourceSvg(id, { height }));
      if (!current.equals(source)) mismatches.push(`${id}/height=${height}`);
      digests.push(source);
    }
  }
  const currentDock = pixels(currentSvg('iris-charging-dock', {}));
  const sourceDock = pixels(sourceSvg('iris-charging-dock', {}));
  if (!currentDock.equals(sourceDock)) mismatches.push('iris-charging-dock');
  digests.push(sourceDock);
  return {
    cases: digests.length,
    mismatches,
    digest: createHash('sha256').update(Buffer.concat(digests)).digest('hex'),
  };
}

const outDir = resolve(process.argv[2] ?? 'docs/previews/canonical-iris-hardware-source-fit-v1');
mkdirSync(outDir, { recursive: true });
const sheets = [
  ['01-source-production-parity', paritySheet()],
  ['02-literal-context', contextSheet()],
] as const;
for (const [name, svg] of sheets) {
  writeFileSync(join(outDir, `${name}.svg`), svg);
  writeFileSync(join(outDir, `${name}.png`), new Resvg(svg).render().asPng());
}

const parity = pixelParity();
const metrics = {
  status: 'review-only-source-authority-proof',
  sourceFiles: Object.values(CANONICAL_IRIS_SOURCE_FILES),
  productionWiringChanged: false,
  productionBuilderChanged: false,
  exportOrUnityChanged: false,
  method: {
    geometryOwner: 'three directly inspectable SVG proposals',
    installationVariants: 'live and dormant each remain independently inspectable',
    heightDerivation: 'eight declared SVG element roles; no replacement path builder',
    chargingDock: 'static source',
  },
  audit: {
    installationHeightCount: CANONICAL_IRIS_HEIGHTS.length,
    pixelParityCases: parity.cases,
    pixelMismatches: parity.mismatches,
    deterministicDigest: parity.digest,
  },
};
writeFileSync(join(outDir, 'metrics.json'), `${JSON.stringify(metrics, null, 2)}\n`);

const readme = `# Canonical IRIS hardware source-fit proof v1

Review-only gate for replacing the code-owned IRIS installation-unit and
charging-dock builders with three directly inspectable SVG sources.

- \`01-source-production-parity.png\`: live and dormant at the 78, 90, and 98
  rack-height boundaries, plus the static dock, beside current production.
- \`02-literal-context.png\`: current and source-derived families at literal
  prop and game-character scale.
- \`metrics.json\`: all ${parity.cases} live/dormant height and dock cases are
  checked for exact raster parity.
- \`sources/\`: the proposed editable live, dormant, and dock SVG files.

The declared adapter changes only source element paths tagged with one of eight
height roles. It does not redraw any replacement geometry. Production templates,
export, bundle generation, facility registration, and Unity remain unchanged
until explicit visual approval.
`;
writeFileSync(join(outDir, 'README.md'), readme);

for (const path of Object.values(CANONICAL_IRIS_SOURCE_FILES)) {
  if (!readFileSync(resolve(path), 'utf8').includes('data-prop-id=')) {
    throw new Error(`Malformed IRIS proposal source ${path}`);
  }
}
process.stdout.write(
  `Wrote canonical IRIS source-fit proof to ${outDir}\n` +
  `Pixel parity: ${parity.cases - parity.mismatches.length}/${parity.cases}\n`,
);
