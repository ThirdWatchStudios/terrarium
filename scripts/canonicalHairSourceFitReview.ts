import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import { CHARACTER_FRAME_OFFSET_Y, composeCharacter } from '../src/core/compositor';
import type { CharacterRecipe, Facing, PartVariant, ShapeSpec } from '../src/core/types';
import { FACINGS } from '../src/core/types';
import { DEFAULT_STYLE } from '../src/data/defaults';
import { BODY_ARCHETYPES } from '../src/parts/bodyArchetypes';
import {
  fittedHairVariant,
  type FittedHairHeadId,
  type FittedHairId,
} from '../src/parts/hairFitting';
import { getPart } from '../src/parts/library';

const CANVAS = 128;
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
  ?? (() => { throw new Error('Missing body-balanced review carrier'); })();

export interface CanonicalHairSourceFitReviewConfig {
  readonly phase: 'review' | 'production';
  readonly styleName: string;
  readonly hairId: FittedHairId;
  readonly version: number;
  readonly outputDirectory: string;
  readonly sourceFiles: readonly string[];
  readonly headIds: readonly FittedHairHeadId[];
  readonly sourceVariant: (facing: Facing) => PartVariant;
  readonly proposalVariant: (headId: FittedHairHeadId, facing: Facing) => PartVariant;
  readonly directionFocus: string;
  readonly scaleFocus: string;
  readonly method: Readonly<Record<string, string | number>>;
  readonly readmeNote: string;
}

function recipe(
  config: CanonicalHairSourceFitReviewConfig,
  head: FittedHairHeadId,
  hair: FittedHairId | 'hair-none',
): CharacterRecipe {
  return {
    id: `canonical-${config.hairId}-source-fit-${head}-${hair}`,
    name: `Canonical ${config.styleName} source-fit review`,
    parts: { body: body.id, head, hair, outfit: 'outfit-tee', accessories: [] },
    palette: { ...PALETTE },
  };
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
    return `<path d="${shape.d}" fill="${color}" stroke="${color}" stroke-width="${width * 2}" stroke-linejoin="${shape.strokeLinejoin ?? 'round'}" stroke-linecap="${shape.strokeLinecap ?? 'round'}"/>`;
  }
  return `<path d="${shape.d}" fill="none" stroke="${color}" stroke-width="${(shape.strokeWidth ?? 1.5) + width * 2}" stroke-linejoin="${shape.strokeLinejoin ?? 'round'}" stroke-linecap="${shape.strokeLinecap ?? 'round'}"/>`;
}

function proposedCharacter(
  config: CanonicalHairSourceFitReviewConfig,
  headId: FittedHairHeadId,
  facing: Facing,
  size: number,
): string {
  const base = composeCharacter(
    recipe(config, headId, 'hair-none'),
    DEFAULT_STYLE,
    facing,
    size,
    'normal',
    { badge: false },
  );
  const head = getPart(headId)?.facings[facing];
  if (!head) throw new Error(`Missing ${headId}/${facing} head art`);
  const hair = config.proposalVariant(headId, facing);
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
  config: CanonicalHairSourceFitReviewConfig,
  headId: FittedHairHeadId,
  facing: Facing,
  size: number,
): string {
  return composeCharacter(
    recipe(config, headId, config.hairId),
    DEFAULT_STYLE,
    facing,
    size,
    'normal',
    { badge: false },
  );
}

const svgInner = (svg: string): string =>
  svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const escapeText = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

function framedCharacter(x: number, y: number, size: number, svg: string, border: string): string {
  return [
    `<rect x="${x - 3}" y="${y - 3}" width="${size + 6}" height="${size + 6}" rx="6" fill="#FFFFFF" stroke="${border}"/>`,
    `<g transform="translate(${x} ${y}) scale(${size / CANVAS})">${svgInner(svg)}</g>`,
  ].join('');
}

function directionsSheet(config: CanonicalHairSourceFitReviewConfig): string {
  const production = config.phase === 'production';
  const labelWidth = 128;
  const groupWidth = 222;
  const headerHeight = 112;
  const rowHeight = 116;
  const renderSize = 92;
  const width = labelWidth + FACINGS.length * groupWidth + 14;
  const height = headerHeight + config.headIds.length * rowHeight + 12;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`,
    text(18, 30, `Canonical ${config.styleName} — ${production ? 'source-to-production parity' : 'source-fit direction study'}`, 22, 720),
    text(18, 53, production
      ? `PRODUCTION = live resolver · SOURCE = ${config.sourceFiles.length} canonical SVGs + declarative fit frames`
      : `CURRENT = live code builder · SVG FIT = ${config.sourceFiles.length} editable review-source SVGs + declarative fit frames`, 11, 450, COLORS.muted),
    text(18, 73, config.directionFocus, 11, 650, COLORS.proposal),
    `<rect x="18" y="84" width="12" height="12" rx="2" fill="${COLORS.current}"/>`,
    text(36, 94, production ? 'PRODUCTION' : 'CURRENT', 9, 700, COLORS.current),
    `<rect x="100" y="84" width="12" height="12" rx="2" fill="${COLORS.proposal}"/>`,
    text(118, 94, production ? 'SOURCE' : 'SVG FIT', 9, 700, COLORS.proposal),
  ];
  FACINGS.forEach((facing, index) => {
    const x = labelWidth + index * groupWidth;
    parts.push(text(x + groupWidth / 2, 95, facing.toUpperCase(), 10, 750, COLORS.muted, 'text-anchor="middle"'));
  });
  config.headIds.forEach((headId, row) => {
    const y = headerHeight + row * rowHeight;
    parts.push(`<rect x="8" y="${y + 2}" width="${width - 16}" height="${rowHeight - 4}" rx="8" fill="${row % 2 ? COLORS.alternate : COLORS.panel}"/>`);
    parts.push(text(18, y + 40, getPart(headId)?.label ?? headId, 14, 720));
    parts.push(text(18, y + 58, headId, 8.5, 450, COLORS.muted));
    FACINGS.forEach((facing, index) => {
      const groupX = labelWidth + index * groupWidth;
      const currentX = groupX + 7;
      const proposalX = groupX + 116;
      parts.push(framedCharacter(currentX, y + 10, renderSize, currentCharacter(config, headId, facing, CANVAS), COLORS.current));
      parts.push(framedCharacter(proposalX, y + 10, renderSize, proposedCharacter(config, headId, facing, CANVAS), COLORS.proposal));
      parts.push(text(currentX + renderSize / 2, y + 109, production ? 'production' : 'current', 8, 650, COLORS.current, 'text-anchor="middle"'));
      parts.push(text(proposalX + renderSize / 2, y + 109, production ? 'source' : 'SVG fit', 8, 650, COLORS.proposal, 'text-anchor="middle"'));
    });
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function literalCharacter(x: number, y: number, size: 48 | 32, svg: string, border: string): string {
  return [
    `<rect x="${x - 2}" y="${y - 2}" width="${size + 4}" height="${size + 4}" rx="4" fill="#FFFFFF" stroke="${border}"/>`,
    `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 128 128" overflow="hidden">${svgInner(svg)}</svg>`,
  ].join('');
}

function scaleSheet(config: CanonicalHairSourceFitReviewConfig): string {
  const production = config.phase === 'production';
  const labelWidth = 128;
  const groupWidth = 222;
  const headerHeight = 118;
  const rowHeight = 96;
  const width = labelWidth + FACINGS.length * groupWidth + 14;
  const height = headerHeight + config.headIds.length * rowHeight + 12;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`,
    text(18, 30, `Canonical ${config.styleName} — literal ${production ? 'source-to-production parity' : 'gameplay-scale study'}`, 22, 720),
    text(18, 53, production
      ? 'Each render is rasterized at 48 or 32 px; P = production, S = independent source fit'
      : 'Each render is rasterized at 48 or 32 px; C = current code, S = SVG-derived proposal', 11, 450, COLORS.muted),
    text(18, 73, config.scaleFocus, 11, 650, COLORS.proposal),
  ];
  FACINGS.forEach((facing, index) => {
    const x = labelWidth + index * groupWidth;
    parts.push(`<rect x="${x + 3}" y="84" width="${groupWidth - 8}" height="27" rx="5" fill="${COLORS.proposalPale}"/>`);
    parts.push(text(x + groupWidth / 2, 102, facing.toUpperCase(), 10, 750, COLORS.muted, 'text-anchor="middle"'));
  });
  config.headIds.forEach((headId, row) => {
    const y = headerHeight + row * rowHeight;
    parts.push(`<rect x="8" y="${y + 2}" width="${width - 16}" height="${rowHeight - 4}" rx="8" fill="${row % 2 ? COLORS.alternate : COLORS.panel}"/>`);
    parts.push(text(18, y + 36, getPart(headId)?.label ?? headId, 14, 720));
    parts.push(text(18, y + 54, headId, 8.5, 450, COLORS.muted));
    FACINGS.forEach((facing, index) => {
      const x = labelWidth + index * groupWidth + 9;
      parts.push(literalCharacter(x, y + 18, 48, currentCharacter(config, headId, facing, 48), COLORS.current));
      parts.push(literalCharacter(x + 56, y + 18, 48, proposedCharacter(config, headId, facing, 48), COLORS.proposal));
      parts.push(literalCharacter(x + 120, y + 26, 32, currentCharacter(config, headId, facing, 32), COLORS.current));
      parts.push(literalCharacter(x + 160, y + 26, 32, proposedCharacter(config, headId, facing, 32), COLORS.proposal));
      parts.push(text(x + 24, y + 80, production ? '48 P' : '48 C', 8, 650, COLORS.current, 'text-anchor="middle"'));
      parts.push(text(x + 80, y + 80, '48 S', 8, 650, COLORS.proposal, 'text-anchor="middle"'));
      parts.push(text(x + 136, y + 80, production ? '32 P' : '32 C', 8, 650, COLORS.current, 'text-anchor="middle"'));
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

export function writeCanonicalHairSourceFitReview(
  config: CanonicalHairSourceFitReviewConfig,
): void {
  const outDir = resolve(config.outputDirectory);
  mkdirSync(outDir, { recursive: true });
  const deterministic = createHash('sha256');
  const productionDifferences: string[] = [];
  const missingHairAtLiteralScale: string[] = [];
  let variantCount = 0;
  let derivedShapeCount = 0;
  for (const headId of config.headIds) {
    for (const facing of FACINGS) {
      const proposal = config.proposalVariant(headId, facing);
      variantCount++;
      derivedShapeCount += proposal.shapes.length;
      deterministic.update(JSON.stringify(proposal));
      if (JSON.stringify(fittedHairVariant(config.hairId, headId, facing)) !== JSON.stringify(proposal)) {
        productionDifferences.push(`${headId}/${facing}`);
      }
      for (const size of [48, 32] as const) {
        if (!hairPresent(proposedCharacter(config, headId, facing, size))) {
          missingHairAtLiteralScale.push(`${headId}/${facing}/${size}`);
        }
      }
    }
  }
  if (missingHairAtLiteralScale.length > 0) {
    throw new Error(`${config.styleName} disappears in ${missingHairAtLiteralScale.length} literal-scale cells`);
  }
  if (config.phase === 'production' && productionDifferences.length > 0) {
    throw new Error(`${config.styleName} production differs in ${productionDifferences.length} variants`);
  }
  writeSvgAndPng(outDir, '01-six-head-directions', directionsSheet(config));
  writeSvgAndPng(outDir, '02-literal-scale', scaleSheet(config));
  writeFileSync(join(outDir, 'metrics.json'), `${JSON.stringify({
    status: config.phase === 'production'
      ? 'approved-production-source-authority'
      : 'review-only-awaiting-visual-approval',
    sourceFiles: config.sourceFiles,
    productionWiringChanged: config.phase === 'production',
    canonicalSourceSvgChanged: config.phase === 'production',
    reviewSourceSvgAdded: config.phase === 'review',
    perHeadSvgVariantsAdded: 0,
    method: config.method,
    audit: {
      variantCount,
      sourceShapeCount: FACINGS.reduce((count, facing) => count + config.sourceVariant(facing).shapes.length, 0),
      derivedShapeCount,
      missingHairAtLiteralScale,
      productionDifferences,
      deterministicDigest: deterministic.digest('hex'),
    },
  }, null, 2)}\n`);
  const reviewSourceLine = config.phase === 'review'
    ? '- `sources/`: the editable SVG candidates used by this proof.\n'
    : '';
  const boundary = config.phase === 'production'
    ? 'The old code-drawn builder is not part of this route. This validation adds no recipe, export-schema, runtime-fit, animation, or Unity state.'
    : 'No canonical source, importer registration, production resolver, recipe, export schema, Unity asset, snapshot, or production documentation changed for this proof.';
  writeFileSync(join(outDir, 'README.md'), `# Canonical ${config.styleName} ${config.phase === 'production' ? 'production validation' : 'source-fit proof'} v${config.version}\n\n${config.readmeNote}\n\n${reviewSourceLine}- \`01-six-head-directions.png\`: ${config.phase === 'production' ? 'production and independently derived source' : 'current and SVG-derived'} direction reads across all six heads.\n- \`02-literal-scale.png\`: paired renders at literal 48 px and 32 px.\n- \`metrics.json\`: source ownership, transform, coverage, and deterministic audit.\n\n${boundary}\n`);
  console.log(`canonical ${config.styleName} ${config.phase === 'production' ? 'production validation' : 'source-fit proof'}: ${variantCount} variants · ${derivedShapeCount} derived shapes`);
  console.log(`literal-scale missing hair: ${missingHairAtLiteralScale.length}`);
  console.log(`${config.phase === 'production' ? 'production mismatches' : 'expected production differences'}: ${productionDifferences.length}`);
  console.log(`wrote ${config.phase === 'production' ? 'production validation' : 'review proof'} to ${outDir}`);
}
