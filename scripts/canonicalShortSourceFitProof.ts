/**
 * Production validation that canonical Short SVGs own all fitted geometry.
 *
 *   npm run hair:canonical-short:production-preview
 *
 * Compares an independent source fit with the live production resolver.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import { CHARACTER_FRAME_OFFSET_Y, composeCharacter } from '../src/core/compositor';
import type { CharacterRecipe, Facing, PartVariant, ShapeSpec } from '../src/core/types';
import { FACINGS } from '../src/core/types';
import { DEFAULT_STYLE } from '../src/data/defaults';
import { BODY_ARCHETYPES } from '../src/parts/bodyArchetypes';
import { fittedHairVariant } from '../src/parts/hairFitting';
import { getPart } from '../src/parts/library';
import { compilePartSvg } from './parts/importer';
import {
  CANONICAL_SHORT_HEAD_IDS,
  fitCanonicalShortVariant,
  type CanonicalShortHeadId,
} from './parts/canonicalShortFit';

const CANVAS = 128;
const SOURCE_FILES = [
  'assets/parts/hair/short.south.svg',
  'assets/parts/hair/short.east.svg',
  'assets/parts/hair/short.north.svg',
] as const;

const COLORS = {
  page: '#EEEAE1',
  panel: '#FFFEFA',
  alternate: '#E5E0D6',
  ink: '#2F3538',
  muted: '#68747A',
  current: '#8A5B3D',
  proposal: '#2E7D5B',
  proposalPale: '#DDEBE3',
} as const;

const PALETTE = {
  skin: '#C68B59',
  hair: '#34251C',
  outfitPrimary: '#315A78',
  outfitSecondary: '#E8D6A8',
  accent: '#E4A62A',
} as const;

const body = BODY_ARCHETYPES.find(({ id }) => id === 'body-balanced')
  ?? (() => { throw new Error('Missing body-balanced proof carrier'); })();

function recipe(
  head: CanonicalShortHeadId,
  hair: 'hair-short' | 'hair-none',
): CharacterRecipe {
  return {
    id: `canonical-short-source-fit-${head}-${hair}`,
    name: 'Canonical Short source-fit proof',
    parts: {
      body: body.id,
      head,
      hair,
      outfit: 'outfit-tee',
      accessories: [],
    },
    palette: { ...PALETTE },
  };
}

const SOURCE_VARIANTS = Object.fromEntries(FACINGS.map((facing, index) => {
  const source = SOURCE_FILES[index];
  return [facing, {
    z: 50,
    shapes: compilePartSvg(readFileSync(resolve(source), 'utf8'), {
      source,
      slot: 'hair',
      preserveLocalPaths: true,
    }),
  } satisfies PartVariant];
})) as Record<Facing, PartVariant>;

function sourceVariant(facing: Facing): PartVariant {
  return SOURCE_VARIANTS[facing];
}

function proposalVariant(headId: CanonicalShortHeadId, facing: Facing): PartVariant {
  return fitCanonicalShortVariant(sourceVariant(facing), headId, facing);
}

function resolvePaint(value: string): string {
  if (!value.startsWith('$')) return value;
  return PALETTE[value.slice(1) as keyof typeof PALETTE] ?? '#FF00FF';
}

function emitColorShape(shape: ShapeSpec): string {
  const attributes = [
    `d="${shape.d}"`,
    `fill="${shape.fill ? resolvePaint(shape.fill) : 'none'}"`,
  ];
  if (shape.stroke) {
    attributes.push(`stroke="${resolvePaint(shape.stroke)}"`);
    attributes.push(`stroke-width="${shape.strokeWidth ?? 1.5}"`);
    attributes.push(`stroke-linecap="${shape.strokeLinecap ?? 'round'}"`);
    attributes.push(`stroke-linejoin="${shape.strokeLinejoin ?? 'round'}"`);
  }
  if (shape.opacity !== undefined) attributes.push(`opacity="${shape.opacity}"`);
  return `<path ${attributes.join(' ')}/>`;
}

function emitOutlineShape(shape: ShapeSpec): string {
  const { width, color } = DEFAULT_STYLE.outline;
  if (shape.fill) {
    return [
      `<path d="${shape.d}" fill="${color}" stroke="${color}"`,
      `stroke-width="${width * 2}" stroke-linejoin="${shape.strokeLinejoin ?? 'round'}"`,
      `stroke-linecap="${shape.strokeLinecap ?? 'round'}"/>`,
    ].join(' ');
  }
  return [
    `<path d="${shape.d}" fill="none" stroke="${color}"`,
    `stroke-width="${(shape.strokeWidth ?? 1.5) + width * 2}"`,
    `stroke-linejoin="${shape.strokeLinejoin ?? 'round'}"`,
    `stroke-linecap="${shape.strokeLinecap ?? 'round'}"/>`,
  ].join(' ');
}

function proposedCharacter(
  headId: CanonicalShortHeadId,
  facing: Facing,
  size: number,
): string {
  const base = composeCharacter(
    recipe(headId, 'hair-none'),
    DEFAULT_STYLE,
    facing,
    size,
    'normal',
    { badge: false },
  );
  const head = getPart(headId)?.facings[facing];
  if (!head) throw new Error(`Missing ${headId}/${facing} head art`);
  const hair = proposalVariant(headId, facing);
  const anchor = body.anchors[facing].headCenter;
  const x = 64 + anchor.x;
  const y = 87 + anchor.y + CHARACTER_FRAME_OFFSET_Y;
  const outline = hair.shapes
    .filter(({ silhouette }) => silhouette !== false)
    .map(emitOutlineShape)
    .join('');
  const overlay = [
    `<g transform="translate(${x} ${y})">${outline}</g>`,
    `<g transform="translate(${x} ${y})">${head.shapes.map(emitColorShape).join('')}</g>`,
    `<g transform="translate(${x} ${y})">${hair.shapes.map(emitColorShape).join('')}</g>`,
  ].join('');
  return base.replace('</svg>', `${overlay}</svg>`);
}

function currentCharacter(
  headId: CanonicalShortHeadId,
  facing: Facing,
  size: number,
): string {
  return composeCharacter(
    recipe(headId, 'hair-short'),
    DEFAULT_STYLE,
    facing,
    size,
    'normal',
    { badge: false },
  );
}

function svgInner(svg: string): string {
  return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function text(
  x: number,
  y: number,
  value: string,
  size = 12,
  weight = 400,
  fill: string = COLORS.ink,
  extra = '',
): string {
  return `<text x="${x}" y="${y}" ${extra} font-family="system-ui, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${escapeText(value)}</text>`;
}

function framedCharacter(
  x: number,
  y: number,
  size: number,
  svg: string,
  border: string,
): string {
  return [
    `<rect x="${x - 3}" y="${y - 3}" width="${size + 6}" height="${size + 6}" rx="6" fill="#FFFFFF" stroke="${border}"/>`,
    `<g transform="translate(${x} ${y}) scale(${size / CANVAS})">${svgInner(svg)}</g>`,
  ].join('');
}

function directionsSheet(): string {
  const labelWidth = 128;
  const groupWidth = 222;
  const headerHeight = 112;
  const rowHeight = 116;
  const renderSize = 92;
  const width = labelWidth + FACINGS.length * groupWidth + 14;
  const height = headerHeight + CANONICAL_SHORT_HEAD_IDS.length * rowHeight + 12;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`,
    text(18, 30, 'Canonical Short — source-to-production direction parity', 22, 720),
    text(18, 53, 'PRODUCTION = live resolver · SOURCE = 3 canonical Short SVGs + declarative head frames', 11, 450, COLORS.muted),
    text(18, 73, 'Approved production route · both columns must remain visually identical', 11, 650, COLORS.proposal),
    `<rect x="18" y="84" width="12" height="12" rx="2" fill="${COLORS.current}"/>`,
    text(36, 94, 'PRODUCTION', 9, 700, COLORS.current),
    `<rect x="100" y="84" width="12" height="12" rx="2" fill="${COLORS.proposal}"/>`,
    text(118, 94, 'SOURCE', 9, 700, COLORS.proposal),
  ];

  FACINGS.forEach((facing, facingIndex) => {
    const x = labelWidth + facingIndex * groupWidth;
    parts.push(text(x + groupWidth / 2, 95, facing.toUpperCase(), 10, 750, COLORS.muted, 'text-anchor="middle"'));
  });

  CANONICAL_SHORT_HEAD_IDS.forEach((headId, row) => {
    const y = headerHeight + row * rowHeight;
    const label = getPart(headId)?.label ?? headId;
    parts.push(`<rect x="8" y="${y + 2}" width="${width - 16}" height="${rowHeight - 4}" rx="8" fill="${row % 2 ? COLORS.alternate : COLORS.panel}"/>`);
    parts.push(text(18, y + 40, label, 14, 720));
    parts.push(text(18, y + 58, headId, 8.5, 450, COLORS.muted));

    FACINGS.forEach((facing, facingIndex) => {
      const groupX = labelWidth + facingIndex * groupWidth;
      const currentX = groupX + 7;
      const proposalX = groupX + 116;
      parts.push(framedCharacter(currentX, y + 10, renderSize, currentCharacter(headId, facing, CANVAS), COLORS.current));
      parts.push(framedCharacter(proposalX, y + 10, renderSize, proposedCharacter(headId, facing, CANVAS), COLORS.proposal));
      parts.push(text(currentX + renderSize / 2, y + 109, 'production', 8, 650, COLORS.current, 'text-anchor="middle"'));
      parts.push(text(proposalX + renderSize / 2, y + 109, 'source', 8, 650, COLORS.proposal, 'text-anchor="middle"'));
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function literalCharacter(
  x: number,
  y: number,
  size: 48 | 32,
  svg: string,
  border: string,
): string {
  return [
    `<rect x="${x - 2}" y="${y - 2}" width="${size + 4}" height="${size + 4}" rx="4" fill="#FFFFFF" stroke="${border}"/>`,
    `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 128 128" overflow="hidden">${svgInner(svg)}</svg>`,
  ].join('');
}

function scaleSheet(): string {
  const labelWidth = 128;
  const groupWidth = 222;
  const headerHeight = 118;
  const rowHeight = 96;
  const width = labelWidth + FACINGS.length * groupWidth + 14;
  const height = headerHeight + CANONICAL_SHORT_HEAD_IDS.length * rowHeight + 12;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`,
    text(18, 30, 'Canonical Short — literal source-to-production parity', 22, 720),
    text(18, 53, 'Each render is rasterized at 48 or 32 px; P = production, S = independent source fit', 11, 450, COLORS.muted),
    text(18, 73, 'Silhouette, face opening, profile direction, and textured edge must match in every pair', 11, 650, COLORS.proposal),
  ];

  FACINGS.forEach((facing, facingIndex) => {
    const x = labelWidth + facingIndex * groupWidth;
    parts.push(`<rect x="${x + 3}" y="84" width="${groupWidth - 8}" height="27" rx="5" fill="${COLORS.proposalPale}"/>`);
    parts.push(text(x + groupWidth / 2, 102, facing.toUpperCase(), 10, 750, COLORS.muted, 'text-anchor="middle"'));
  });

  CANONICAL_SHORT_HEAD_IDS.forEach((headId, row) => {
    const y = headerHeight + row * rowHeight;
    const label = getPart(headId)?.label ?? headId;
    parts.push(`<rect x="8" y="${y + 2}" width="${width - 16}" height="${rowHeight - 4}" rx="8" fill="${row % 2 ? COLORS.alternate : COLORS.panel}"/>`);
    parts.push(text(18, y + 36, label, 14, 720));
    parts.push(text(18, y + 54, headId, 8.5, 450, COLORS.muted));

    FACINGS.forEach((facing, facingIndex) => {
      const x = labelWidth + facingIndex * groupWidth + 9;
      parts.push(literalCharacter(x, y + 18, 48, currentCharacter(headId, facing, 48), COLORS.current));
      parts.push(literalCharacter(x + 56, y + 18, 48, proposedCharacter(headId, facing, 48), COLORS.proposal));
      parts.push(literalCharacter(x + 120, y + 26, 32, currentCharacter(headId, facing, 32), COLORS.current));
      parts.push(literalCharacter(x + 160, y + 26, 32, proposedCharacter(headId, facing, 32), COLORS.proposal));
      parts.push(text(x + 24, y + 80, '48 P', 8, 650, COLORS.current, 'text-anchor="middle"'));
      parts.push(text(x + 80, y + 80, '48 S', 8, 650, COLORS.proposal, 'text-anchor="middle"'));
      parts.push(text(x + 136, y + 80, '32 P', 8, 650, COLORS.current, 'text-anchor="middle"'));
      parts.push(text(x + 176, y + 80, '32 S', 8, 650, COLORS.proposal, 'text-anchor="middle"'));
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function writeSvgAndPng(outDir: string, base: string, svg: string): void {
  writeFileSync(join(outDir, `${base}.svg`), svg);
  writeFileSync(join(outDir, `${base}.png`), new Resvg(svg).render().asPng());
}

function hairPresent(svg: string): boolean {
  const pixels = new Resvg(svg, { font: { loadSystemFonts: false } }).render().pixels;
  const target = [0x34, 0x25, 0x1c];
  for (let index = 0; index < pixels.length; index += 4) {
    if (
      pixels[index + 3] >= 128
      && Math.abs(pixels[index] - target[0]) <= 4
      && Math.abs(pixels[index + 1] - target[1]) <= 4
      && Math.abs(pixels[index + 2] - target[2]) <= 4
    ) return true;
  }
  return false;
}

function audit() {
  const deterministic = createHash('sha256');
  const productionDifferences: string[] = [];
  const missingHairAtLiteralScale: string[] = [];
  let variantCount = 0;
  let derivedShapeCount = 0;
  for (const headId of CANONICAL_SHORT_HEAD_IDS) {
    for (const facing of FACINGS) {
      const proposal = proposalVariant(headId, facing);
      variantCount++;
      derivedShapeCount += proposal.shapes.length;
      deterministic.update(JSON.stringify(proposal));
      if (JSON.stringify(fittedHairVariant('hair-short', headId, facing)) !== JSON.stringify(proposal)) {
        productionDifferences.push(`${headId}/${facing}`);
      }
      for (const size of [48, 32] as const) {
        if (!hairPresent(proposedCharacter(headId, facing, size))) {
          missingHairAtLiteralScale.push(`${headId}/${facing}/${size}`);
        }
      }
    }
  }
  return {
    variantCount,
    sourceShapeCount: FACINGS.reduce((count, facing) => count + sourceVariant(facing).shapes.length, 0),
    derivedShapeCount,
    missingHairAtLiteralScale,
    productionDifferences,
    deterministicDigest: deterministic.digest('hex'),
  };
}

export function main(): void {
  const outDir = resolve(process.argv[2] ?? 'docs/previews/canonical-short-production-validation-v3');
  mkdirSync(outDir, { recursive: true });
  const result = audit();
  if (result.missingHairAtLiteralScale.length > 0) {
    throw new Error(`Canonical Short disappears in ${result.missingHairAtLiteralScale.length} literal-scale cells`);
  }
  if (result.productionDifferences.length > 0) {
    throw new Error(`Canonical Short production differs in ${result.productionDifferences.length} variants`);
  }
  writeSvgAndPng(outDir, '01-six-head-directions', directionsSheet());
  writeSvgAndPng(outDir, '02-literal-scale', scaleSheet());
  writeFileSync(join(outDir, 'metrics.json'), `${JSON.stringify({
    status: 'approved-production-source-authority',
    sourceFiles: SOURCE_FILES,
    productionWiringChanged: true,
    canonicalSourceSvgChanged: true,
    perHeadSvgVariantsAdded: 0,
    method: {
      geometryOwner: 'three imported canonical Short SVG facings',
      fitData: 'six shared declarative head envelopes plus Short offsets',
      transform: 'bounded piecewise-linear x/y landmark warp',
      replacementPathBuilders: 0,
    },
    audit: result,
  }, null, 2)}\n`);
  writeFileSync(join(outDir, 'README.md'), `# Canonical Short production validation v3\n\nPost-approval validation for the second source-owned fitted hairstyle. The production resolver (P) must remain identical to an independent fit of the three canonical Short SVG facings (S) through the shared declarative head envelopes.\n\n- \`01-six-head-directions.png\`: production beside independently derived source geometry for all six heads and three facings.\n- \`02-literal-scale.png\`: production and source-derived renders at literal 48 px and 32 px.\n- \`metrics.json\`: source ownership, transform, coverage, parity, and deterministic audit.\n\nThe old code-drawn Short builder is not part of this route. This validation adds no recipe, export-schema, runtime-fit, animation, or Unity state.\n`);

  console.log(`canonical Short production validation: ${result.variantCount} variants · ${result.derivedShapeCount} derived shapes`);
  console.log(`literal-scale missing hair: ${result.missingHairAtLiteralScale.length}`);
  console.log(`production mismatches: ${result.productionDifferences.length}`);
  console.log(`deterministic digest: ${result.deterministicDigest}`);
  console.log(`wrote production validation to ${outDir}`);
}

if (process.argv[1]?.endsWith('canonicalShortSourceFitProof.ts')) main();
