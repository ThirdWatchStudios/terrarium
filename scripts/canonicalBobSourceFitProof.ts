/**
 * Production validation that canonical Bob SVGs own production geometry.
 *
 *   npx tsx scripts/canonicalBobSourceFitProof.ts [outDir]
 *
 * Compares the independently derived source fit with the live production
 * resolver after the approved promotion.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import {
  CHARACTER_FRAME_OFFSET_Y,
  composeCharacter,
} from '../src/core/compositor';
import type {
  CharacterRecipe,
  Facing,
  PartVariant,
  ShapeSpec,
} from '../src/core/types';
import { FACINGS } from '../src/core/types';
import { DEFAULT_STYLE } from '../src/data/defaults';
import { BODY_ARCHETYPES } from '../src/parts/bodyArchetypes';
import { fittedHairVariant } from '../src/parts/hairFitting';
import { getPart } from '../src/parts/library';
import {
  CANONICAL_BOB_HEAD_IDS,
  type CanonicalBobHeadId,
  fitCanonicalBobVariant,
} from './parts/canonicalBobFit';

const CANVAS = 128;
const SOURCE_FILES = [
  'assets/parts/hair/bob.south.svg',
  'assets/parts/hair/bob.east.svg',
  'assets/parts/hair/bob.north.svg',
] as const;

const COLORS = {
  page: '#EEEAE1',
  panel: '#FFFEFA',
  alternate: '#E5E0D6',
  ink: '#2F3538',
  muted: '#68747A',
  border: '#CFC7B9',
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

function recipe(head: CanonicalBobHeadId, hair: 'hair-bob' | 'hair-none'): CharacterRecipe {
  return {
    id: `canonical-bob-source-fit-${head}-${hair}`,
    name: 'Canonical Bob source-fit proof',
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

function sourceVariant(facing: Facing): PartVariant {
  const variant = getPart('hair-bob')?.facings[facing];
  if (!variant) throw new Error(`Missing imported canonical Bob ${facing} source`);
  return variant;
}

function proposalVariant(head: CanonicalBobHeadId, facing: Facing): PartVariant {
  return fitCanonicalBobVariant(sourceVariant(facing), head, facing);
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
  headId: CanonicalBobHeadId,
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
  const hairOutline = hair.shapes
    .filter(({ silhouette }) => silhouette !== false)
    .map(emitOutlineShape)
    .join('');
  const overlay = [
    `<g transform="translate(${x} ${y})">${hairOutline}</g>`,
    `<g transform="translate(${x} ${y})">${head.shapes.map(emitColorShape).join('')}</g>`,
    `<g transform="translate(${x} ${y})">${hair.shapes.map(emitColorShape).join('')}</g>`,
  ].join('');
  return base.replace('</svg>', `${overlay}</svg>`);
}

function currentCharacter(
  headId: CanonicalBobHeadId,
  facing: Facing,
  size: number,
): string {
  return composeCharacter(
    recipe(headId, 'hair-bob'),
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
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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
  const height = headerHeight + CANONICAL_BOB_HEAD_IDS.length * rowHeight + 12;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`,
    text(18, 30, 'Canonical Bob — source-to-production direction parity', 22, 720),
    text(18, 53, 'PRODUCTION = live resolver · SOURCE = the 3 Bob SVGs + declarative head envelopes', 11, 450, COLORS.muted),
    text(18, 73, 'Approved production route · both columns must remain visually identical', 11, 650, COLORS.proposal),
    `<rect x="18" y="84" width="12" height="12" rx="2" fill="${COLORS.current}"/>`,
    text(36, 94, 'PRODUCTION', 9, 700, COLORS.current),
    `<rect x="106" y="84" width="12" height="12" rx="2" fill="${COLORS.proposal}"/>`,
    text(124, 94, 'SOURCE', 9, 700, COLORS.proposal),
  ];

  FACINGS.forEach((facing, facingIndex) => {
    const x = labelWidth + facingIndex * groupWidth;
    parts.push(text(x + groupWidth / 2, 95, facing.toUpperCase(), 10, 750, COLORS.muted, 'text-anchor="middle"'));
  });

  CANONICAL_BOB_HEAD_IDS.forEach((headId, row) => {
    const y = headerHeight + row * rowHeight;
    const label = getPart(headId)?.label ?? headId;
    parts.push(`<rect x="8" y="${y + 2}" width="${width - 16}" height="${rowHeight - 4}" rx="8" fill="${row % 2 ? COLORS.alternate : COLORS.panel}"/>`);
    parts.push(text(18, y + 40, label, 14, 720));
    parts.push(text(18, y + 58, headId, 8.5, 450, COLORS.muted));

    FACINGS.forEach((facing, facingIndex) => {
      const groupX = labelWidth + facingIndex * groupWidth;
      const currentX = groupX + 7;
      const proposalX = groupX + 116;
      parts.push(framedCharacter(
        currentX,
        y + 10,
        renderSize,
        currentCharacter(headId, facing, CANVAS),
        COLORS.current,
      ));
      parts.push(framedCharacter(
        proposalX,
        y + 10,
        renderSize,
        proposedCharacter(headId, facing, CANVAS),
        COLORS.proposal,
      ));
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
  const height = headerHeight + CANONICAL_BOB_HEAD_IDS.length * rowHeight + 12;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`,
    text(18, 30, 'Canonical Bob — literal source-to-production parity', 22, 720),
    text(18, 53, 'Each render is rasterized at the labeled 48 or 32 px size; P = production, S = source', 11, 450, COLORS.muted),
    text(18, 73, 'Silhouette, face opening, profile direction, crown, and parting must match in every pair', 11, 650, COLORS.proposal),
  ];

  FACINGS.forEach((facing, facingIndex) => {
    const x = labelWidth + facingIndex * groupWidth;
    parts.push(`<rect x="${x + 3}" y="84" width="${groupWidth - 8}" height="27" rx="5" fill="${COLORS.proposalPale}"/>`);
    parts.push(text(x + groupWidth / 2, 102, facing.toUpperCase(), 10, 750, COLORS.muted, 'text-anchor="middle"'));
  });

  CANONICAL_BOB_HEAD_IDS.forEach((headId, row) => {
    const y = headerHeight + row * rowHeight;
    const label = getPart(headId)?.label ?? headId;
    parts.push(`<rect x="8" y="${y + 2}" width="${width - 16}" height="${rowHeight - 4}" rx="8" fill="${row % 2 ? COLORS.alternate : COLORS.panel}"/>`);
    parts.push(text(18, y + 36, label, 14, 720));
    parts.push(text(18, y + 54, headId, 8.5, 450, COLORS.muted));

    FACINGS.forEach((facing, facingIndex) => {
      const x = labelWidth + facingIndex * groupWidth + 9;
      const current48 = currentCharacter(headId, facing, 48);
      const source48 = proposedCharacter(headId, facing, 48);
      const current32 = currentCharacter(headId, facing, 32);
      const source32 = proposedCharacter(headId, facing, 32);
      parts.push(literalCharacter(x, y + 18, 48, current48, COLORS.current));
      parts.push(literalCharacter(x + 56, y + 18, 48, source48, COLORS.proposal));
      parts.push(literalCharacter(x + 120, y + 26, 32, current32, COLORS.current));
      parts.push(literalCharacter(x + 160, y + 26, 32, source32, COLORS.proposal));
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
  writeFileSync(
    join(outDir, `${base}.png`),
    new Resvg(svg).render().asPng(),
  );
}

function hairPresent(svg: string): boolean {
  const rendered = new Resvg(svg, { font: { loadSystemFonts: false } }).render();
  const pixels = rendered.pixels;
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

function audit(): {
  variantCount: number;
  sourceShapeCount: number;
  derivedShapeCount: number;
  retainedDetailCount: number;
  missingHairAtLiteralScale: string[];
  productionMismatches: string[];
  deterministicDigest: string;
  currentVsProposalDigest: string;
} {
  const deterministic = createHash('sha256');
  const comparison = createHash('sha256');
  const missingHairAtLiteralScale: string[] = [];
  const productionMismatches: string[] = [];
  let variantCount = 0;
  let derivedShapeCount = 0;
  let retainedDetailCount = 0;
  for (const headId of CANONICAL_BOB_HEAD_IDS) {
    for (const facing of FACINGS) {
      const proposal = proposalVariant(headId, facing);
      variantCount++;
      derivedShapeCount += proposal.shapes.length;
      retainedDetailCount += proposal.shapes.filter(({ silhouette }) => silhouette === false).length;
      deterministic.update(JSON.stringify(proposal));
      const production = fittedHairVariant('hair-bob', headId, facing);
      if (JSON.stringify(production) !== JSON.stringify(proposal)) {
        productionMismatches.push(`${headId}/${facing}`);
      }
      comparison.update(JSON.stringify(production));
      comparison.update(JSON.stringify(proposal));
      for (const size of [48, 32] as const) {
        const svg = proposedCharacter(headId, facing, size);
        if (!hairPresent(svg)) missingHairAtLiteralScale.push(`${headId}/${facing}/${size}`);
      }
    }
  }
  return {
    variantCount,
    sourceShapeCount: FACINGS.reduce((count, facing) => count + sourceVariant(facing).shapes.length, 0),
    derivedShapeCount,
    retainedDetailCount,
    missingHairAtLiteralScale,
    productionMismatches,
    deterministicDigest: deterministic.digest('hex'),
    currentVsProposalDigest: comparison.digest('hex'),
  };
}

export function main(): void {
  const outDir = resolve(
    process.argv[2] ?? 'docs/previews/canonical-bob-production-validation-v2',
  );
  mkdirSync(outDir, { recursive: true });
  const result = audit();
  if (result.missingHairAtLiteralScale.length > 0) {
    throw new Error(`Canonical Bob disappears in ${result.missingHairAtLiteralScale.length} literal-scale cells`);
  }
  if (result.productionMismatches.length > 0) {
    throw new Error(`Canonical Bob production differs in ${result.productionMismatches.length} variants`);
  }

  writeSvgAndPng(outDir, '01-six-head-directions', directionsSheet());
  writeSvgAndPng(outDir, '02-literal-scale', scaleSheet());
  writeFileSync(join(outDir, 'metrics.json'), `${JSON.stringify({
    status: 'approved-production-source-authority',
    sourceFiles: SOURCE_FILES,
    productionWiringChanged: true,
    sourceSvgChanged: false,
    perHeadSvgVariantsAdded: 0,
    method: {
      geometryOwner: 'three imported canonical Bob SVG facings',
      fitData: 'six declarative head envelopes',
      transform: 'bounded piecewise-linear x/y landmark warp',
      replacementPathBuilders: 0,
    },
    audit: result,
  }, null, 2)}\n`);
  writeFileSync(join(outDir, 'README.md'), `# Canonical Bob production validation v2\n\nPost-approval validation for the first source-owned fitted hairstyle. The production resolver (P) must remain identical to an independent fit of the three canonical Bob SVG facings (S) through the six declarative head envelopes.\n\n- \`01-six-head-directions.png\`: production beside independently derived source geometry for all six heads and three authored facings.\n- \`02-literal-scale.png\`: production (P) and source-derived (S) renders at literal 48 px and 32 px.\n- \`metrics.json\`: source ownership, transform, coverage, parity, and deterministic audit.\n\nThe old code-drawn Bob builder is not part of this route. This validation adds no recipe, export-schema, runtime-fit, animation, or Unity state.\n`);

  console.log(`canonical Bob production validation: ${result.variantCount} variants · ${result.derivedShapeCount} derived shapes · ${result.retainedDetailCount} retained details`);
  console.log(`literal-scale missing hair: ${result.missingHairAtLiteralScale.length}`);
  console.log(`production mismatches: ${result.productionMismatches.length}`);
  console.log(`deterministic digest: ${result.deterministicDigest}`);
  console.log(`wrote production validation to ${outDir}`);
}

if (process.argv[1]?.endsWith('canonicalBobSourceFitProof.ts')) main();
