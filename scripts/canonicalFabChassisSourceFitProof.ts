/**
 * Production validation for the canonical outfit-fab-chassis SVGs.
 *
 * Compiles the canonical sources directly through the strict parser, temporarily
 * substitutes those shapes into the real compositor, and compares those pixels
 * with the live generated fixed-body-art receiver.
 *
 *   npm run fab-chassis:production:preview
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';

import { composeCharacter, composeProp } from '../src/core/compositor';
import type { CharacterRecipe, Facing, PartVariant, ShapeSpec } from '../src/core/types';
import { FACINGS } from '../src/core/types';
import {
  CONSTRUCTION_CREW,
  defaultProject,
  DEFAULT_STYLE,
  IRIS_UNIT_PALETTE,
} from '../src/data/defaults';
import { BODY_ARCHETYPES } from '../src/parts/bodyArchetypes';
import { getPart } from '../src/parts/library';
import type { Pose } from '../src/parts/poses';
import { poseVariantFor } from '../src/parts/poses';
import { compilePartSvg } from './parts/importer';

const CANVAS = 128;
const SOURCE_FILES: Readonly<Record<Facing, string>> = {
  south: 'assets/parts/outfit/fab-chassis.south.svg',
  east: 'assets/parts/outfit/fab-chassis.east.svg',
  north: 'assets/parts/outfit/fab-chassis.north.svg',
};
const BODY_SOURCE_FILES: Readonly<Record<Facing, string>> = {
  south: 'assets/parts/body/large-frame.south.svg',
  east: 'assets/parts/body/large-frame.east.svg',
  north: 'assets/parts/body/large-frame.north.svg',
};
const HEAD_SOURCE_FILES: Readonly<Record<Facing, string>> = {
  south: 'assets/parts/head/fab.south.svg',
  east: 'assets/parts/head/fab.east.svg',
  north: 'assets/parts/head/fab.north.svg',
};
const OUTPUT = 'docs/previews/canonical-fab-chassis-source-fit-v1';

const COLORS = {
  page: '#E9E6DF',
  panel: '#FFFDF8',
  ink: '#252A28',
  muted: '#66706B',
  border: '#C8C1B5',
  source: '#6C5A8D',
  proposal: '#2E7D5B',
  current: '#8A5B3D',
  procedural: '#3F6D8A',
  floor: '#727D83',
  floorLine: '#939DA1',
} as const;

const body = BODY_ARCHETYPES.find(({ id }) => id === 'body-large-frame')
  ?? (() => { throw new Error('Missing body-large-frame proof carrier'); })();
const chassis = getPart('outfit-fab-chassis')
  ?? (() => { throw new Error('Missing outfit-fab-chassis production receiver'); })();
if (!chassis.buildVariant) throw new Error('outfit-fab-chassis has no production SVG receiver');

const recipe: CharacterRecipe = {
  ...CONSTRUCTION_CREW[0],
  palette: { ...IRIS_UNIT_PALETTE },
};

function sourceText(facing: Facing): string {
  return readFileSync(SOURCE_FILES[facing], 'utf8');
}

function compileCandidateFacing(facing: Facing): readonly ShapeSpec[] {
  return compilePartSvg(sourceText(facing), {
    source: SOURCE_FILES[facing],
    slot: 'outfit',
    preserveLocalPaths: true,
  });
}

const candidateShapes: Readonly<Record<Facing, readonly ShapeSpec[]>> = {
  south: compileCandidateFacing('south'),
  east: compileCandidateFacing('east'),
  north: compileCandidateFacing('north'),
};

function candidateVariant(facing: Facing): PartVariant {
  return { z: 20, shapes: candidateShapes[facing].map((shape) => ({ ...shape })) };
}

function withCandidate<T>(run: () => T): T {
  const currentBuilder = chassis.buildVariant;
  chassis.buildVariant = (facing, context) => {
    if (context.bodyId !== body.id) return currentBuilder?.(facing, context);
    return candidateVariant(facing);
  };
  try {
    return run();
  } finally {
    chassis.buildVariant = currentBuilder;
  }
}

function candidateCharacter(
  facing: Facing | 'west',
  size: number,
  pose: Pose = 'neutral',
): string {
  return withCandidate(() => composeCharacter(
    recipe,
    DEFAULT_STYLE,
    facing,
    size,
    'normal',
    { badge: false, pose },
  ));
}

function currentCharacter(
  facing: Facing | 'west',
  size: number,
  pose: Pose = 'neutral',
): string {
  return composeCharacter(
    recipe,
    DEFAULT_STYLE,
    facing,
    size,
    'normal',
    { badge: false, pose },
  );
}

function resolvePaint(value: string): string {
  if (!value.startsWith('$')) return value;
  return recipe.palette[value.slice(1) as keyof CharacterRecipe['palette']] ?? '#FF00FF';
}

function emitShape(shape: ShapeSpec): string {
  const attrs = [
    `d="${shape.d}"`,
    `fill="${shape.fill ? resolvePaint(shape.fill) : 'none'}"`,
  ];
  if (shape.stroke) {
    attrs.push(`stroke="${resolvePaint(shape.stroke)}"`);
    attrs.push(`stroke-width="${shape.strokeWidth ?? 1.5}"`);
    attrs.push(`stroke-linecap="${shape.strokeLinecap ?? 'round'}"`);
    attrs.push(`stroke-linejoin="${shape.strokeLinejoin ?? 'round'}"`);
  }
  if (shape.opacity !== undefined) attrs.push(`opacity="${shape.opacity}"`);
  return `<path ${attrs.join(' ')}/>`;
}

function variantSvg(variant: PartVariant, size = CANVAS): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="${size}" height="${size}"><g transform="translate(64 87)">${variant.shapes.map(emitShape).join('')}</g></svg>`;
}

function paletteResolvedSvg(source: string): string {
  return source
    .replaceAll('#FF00FF', recipe.palette.skin)
    .replaceAll('#00FFFF', recipe.palette.hair)
    .replaceAll('#FF0000', recipe.palette.outfitPrimary)
    .replaceAll('#00FF00', recipe.palette.outfitSecondary)
    .replaceAll('#0000FF', recipe.palette.accent);
}

function paletteResolvedSource(facing: Facing): string {
  return paletteResolvedSvg(sourceText(facing));
}

function paletteResolvedFile(path: string): string {
  return paletteResolvedSvg(readFileSync(path, 'utf8'));
}

function poseLayerSvg(facing: Facing, pose: Pose = 'neutral'): string {
  const variant = poseVariantFor(pose, facing, body.anchors[facing]);
  if (!variant) throw new Error(`Missing ${pose}/${facing} pose layer`);
  const shapes = [...(variant.back ?? []), ...variant.front];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128"><g transform="translate(64 87)">${shapes.map(emitShape).join('')}</g></svg>`;
}

function raster(svg: string, width: number): Uint8Array {
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
  }).render().asPng();
}

interface PixelDiff {
  mismatchedPixels: number;
  maxChannelDelta: number;
}

function pixelDiff(left: Uint8Array, right: Uint8Array): PixelDiff {
  const a = PNG.sync.read(Buffer.from(left));
  const b = PNG.sync.read(Buffer.from(right));
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error(`Raster dimensions differ: ${a.width}x${a.height} vs ${b.width}x${b.height}`);
  }
  let mismatchedPixels = 0;
  let maxChannelDelta = 0;
  for (let index = 0; index < a.data.length; index += 4) {
    let pixelMismatch = false;
    for (let channel = 0; channel < 4; channel++) {
      const delta = Math.abs(a.data[index + channel] - b.data[index + channel]);
      if (delta > 0) pixelMismatch = true;
      maxChannelDelta = Math.max(maxChannelDelta, delta);
    }
    if (pixelMismatch) mismatchedPixels++;
  }
  return { mismatchedPixels, maxChannelDelta };
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function text(
  x: number,
  y: number,
  value: string,
  size = 14,
  weight = 500,
  fill: string = COLORS.ink,
  extra = '',
): string {
  return `<text x="${x}" y="${y}" font-family="system-ui,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" ${extra}>${escapeText(value)}</text>`;
}

function svgInner(svg: string): string {
  return svg
    .replace(/^<svg[^>]*>/, '')
    .replace(/<title>.*?<\/title>/s, '')
    .replace(/<desc>.*?<\/desc>/s, '')
    .replace(/<metadata>.*?<\/metadata>/s, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/^[ \t]+$/gm, '');
}

function framedSvg(
  x: number,
  y: number,
  size: number,
  svg: string,
  border: string = COLORS.border,
  fill: string = '#FFFFFF',
): string {
  return [
    `<rect x="${x - 4}" y="${y - 4}" width="${size + 8}" height="${size + 8}" rx="8" fill="${fill}" stroke="${border}" stroke-width="2"/>`,
    `<g transform="translate(${x} ${y}) scale(${size / CANVAS})">${svgInner(svg)}</g>`,
  ].join('');
}

function directionSheet(diffs: Readonly<Record<Facing, PixelDiff>>): string {
  const width = 1460;
  const height = 760;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`,
    text(34, 42, 'FAB CHASSIS · CANONICAL SOURCE VALIDATION', 28, 800),
    text(34, 70, 'This page isolates the chassis source. Body, head, and shared pose ownership are shown separately on the ownership-stack sheet.', 15, 550, COLORS.muted),
    `<rect x="30" y="92" width="1400" height="620" rx="16" fill="${COLORS.panel}" stroke="${COLORS.border}"/>`,
    text(58, 126, 'FACING', 12, 760, COLORS.muted),
    text(250, 126, 'CHASSIS SVG ONLY', 12, 760, COLORS.source),
    text(650, 126, 'DIRECT SOURCE COMPILE', 12, 760, COLORS.proposal),
    text(1050, 126, 'LIVE PRODUCTION', 12, 760, COLORS.current),
  ];
  FACINGS.forEach((facing, row) => {
    const y = 154 + row * 180;
    const diff = diffs[facing];
    parts.push(`<rect x="48" y="${y - 12}" width="1364" height="162" rx="12" fill="${row % 2 ? '#F2EFE8' : '#FAF8F2'}"/>`);
    parts.push(text(68, y + 70, facing.toUpperCase(), 16, 800));
    parts.push(framedSvg(230, y, 136, paletteResolvedSource(facing), COLORS.source));
    parts.push(framedSvg(630, y, 136, candidateCharacter(facing, 136), COLORS.proposal));
    parts.push(framedSvg(1030, y, 136, currentCharacter(facing, 136), COLORS.current));
    parts.push(text(380, y + 48, 'source file', 12, 650, COLORS.source));
    parts.push(text(780, y + 48, 'real compositor', 12, 650, COLORS.proposal));
    parts.push(text(1180, y + 48, 'fixed-body-art receiver', 12, 650, COLORS.current));
    parts.push(text(1180, y + 76, `${diff.mismatchedPixels} changed px · max Δ ${diff.maxChannelDelta}`, 12, 650, diff.mismatchedPixels === 0 ? COLORS.proposal : '#B04436'));
  });
  parts.push(text(48, 738, 'Production gate: canonical source, direct compile, and live imported receiver must remain pixel-exact.', 13, 680, COLORS.muted));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${parts.join('')}</svg>`;
}

function ownershipSheet(): string {
  const width = 1760;
  const height = 850;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`,
    text(34, 42, 'FAB UNIT · COMPLETE SOURCE-OWNERSHIP STACK', 28, 800),
    text(34, 70, 'Every column is one real composition layer. Only pose selection and shared arm geometry remain intentionally procedural.', 15, 550, COLORS.muted),
    `<rect x="30" y="94" width="1700" height="674" rx="16" fill="${COLORS.panel}" stroke="${COLORS.border}"/>`,
    text(58, 130, 'FACING', 12, 760, COLORS.muted),
    text(210, 130, 'BODY HULL SVG', 12, 780, COLORS.source),
    text(510, 130, 'CHASSIS SVG', 12, 780, COLORS.proposal),
    text(810, 130, 'FAB HEAD SVG', 12, 780, COLORS.source),
    text(1110, 130, 'SHARED POSE LAYER', 12, 780, COLORS.procedural),
    text(1430, 130, 'BAKED COMPOSITION', 12, 780, COLORS.current),
  ];
  FACINGS.forEach((facing, row) => {
    const y = 154 + row * 198;
    parts.push(`<rect x="48" y="${y - 12}" width="1664" height="180" rx="12" fill="${row % 2 ? '#F2EFE8' : '#FAF8F2'}"/>`);
    parts.push(text(68, y + 72, facing.toUpperCase(), 16, 800));
    parts.push(framedSvg(188, y, 136, paletteResolvedFile(BODY_SOURCE_FILES[facing]), COLORS.source));
    parts.push(framedSvg(488, y, 136, paletteResolvedSource(facing), COLORS.proposal));
    parts.push(framedSvg(788, y, 136, paletteResolvedFile(HEAD_SOURCE_FILES[facing]), COLORS.source));
    parts.push(framedSvg(1088, y, 136, poseLayerSvg(facing), COLORS.procedural));
    parts.push(framedSvg(1408, y, 136, candidateCharacter(facing, 136), COLORS.current));
    parts.push(text(188, y + 158, 'canonical · assets/parts/body', 11, 650, COLORS.source));
    parts.push(text(488, y + 158, 'canonical · assets/parts/outfit', 11, 650, COLORS.proposal));
    parts.push(text(788, y + 158, 'canonical · assets/parts/head', 11, 650, COLORS.source));
    parts.push(text(1088, y + 158, 'code · rig/attachments', 11, 650, COLORS.procedural));
    parts.push(text(1408, y + 158, 'Terrarium export pixels', 11, 650, COLORS.current));
    for (const x of [420, 720, 1020, 1340]) {
      parts.push(text(x, y + 72, '→', 24, 700, COLORS.muted));
    }
  });
  parts.push(`<rect x="30" y="790" width="1700" height="42" rx="10" fill="#DDE7E1" stroke="#AABBB1"/>`);
  parts.push(text(54, 817, 'Unity receives the baked sheet/layer atlases. It does not parse these SVGs or generate the chassis, body, head, or arms from vector geometry at runtime.', 13, 700, '#365446'));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${parts.join('')}</svg>`;
}

function gameplaySheet(): string {
  const width = 1600;
  const height = 1120;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`,
    text(34, 42, 'FAB CHASSIS · GAMEPLAY SCALE, POSE, AND SITE READ', 28, 800),
    text(34, 70, 'Canonical body SVG + canonical chassis SVG + canonical FAB-head SVG + intentionally procedural shared pose layer.', 15, 550, COLORS.muted),
  ];

  parts.push(`<rect x="30" y="94" width="1540" height="300" rx="16" fill="${COLORS.panel}" stroke="${COLORS.border}"/>`);
  parts.push(text(54, 128, 'DIRECTION + SCALE', 13, 800, COLORS.muted));
  const directions: Array<Facing | 'west'> = ['south', 'east', 'north', 'west'];
  directions.forEach((facing, index) => {
    const x = 86 + index * 366;
    parts.push(text(x, 165, facing.toUpperCase(), 13, 760));
    parts.push(framedSvg(x, 180, 152, candidateCharacter(facing, 152), COLORS.proposal));
    parts.push(framedSvg(x + 190, 240, 76, candidateCharacter(facing, 76), COLORS.proposal, '#6F7A80'));
    parts.push(text(x + 190, 335, 'far read', 11, 650, COLORS.muted));
  });

  parts.push(`<rect x="30" y="418" width="1540" height="290" rx="16" fill="${COLORS.panel}" stroke="${COLORS.border}"/>`);
  parts.push(text(54, 452, 'POSE OCCLUSION', 13, 800, COLORS.muted));
  const poses: readonly Pose[] = ['neutral', 'walk-approach', 'arms-crossed', 'point', 'slump', 'console'];
  poses.forEach((pose, index) => {
    const x = 74 + index * 248;
    parts.push(framedSvg(x, 474, 168, candidateCharacter(index % 2 ? 'east' : 'south', 168, pose), COLORS.proposal));
    parts.push(text(x, 670, pose, 12, 680));
  });

  parts.push(`<rect x="30" y="732" width="1540" height="338" rx="16" fill="#D9D4C8" stroke="${COLORS.border}"/>`);
  parts.push(text(54, 766, 'CROWDED BUILD-SITE CONTROL', 13, 800, COLORS.muted));
  parts.push(`<rect x="54" y="790" width="1492" height="250" fill="${COLORS.floor}" stroke="#51595D" stroke-width="2"/>`);
  for (let x = 118; x < 1546; x += 96) parts.push(`<path d="M ${x} 790 V 1040" stroke="${COLORS.floorLine}" opacity=".32"/>`);
  for (let y = 854; y < 1040; y += 64) parts.push(`<path d="M 54 ${y} H 1546" stroke="${COLORS.floorLine}" opacity=".32"/>`);

  const project = defaultProject();
  const installation = project.props.find(({ templateId }) => templateId === 'iris-installation-unit');
  const dock = project.props.find(({ templateId }) => templateId === 'iris-charging-dock');
  if (installation) parts.push(framedSvg(90, 818, 188, composeProp(installation, DEFAULT_STYLE, 188), '#58635E', '#78838A'));
  if (dock) parts.push(framedSvg(310, 892, 100, composeProp(dock, DEFAULT_STYLE, 100), '#58635E', '#78838A'));
  const crowd: Array<{ x: number; y: number; facing: Facing | 'west'; pose: Pose }> = [
    { x: 470, y: 842, facing: 'south', pose: 'walk-approach' },
    { x: 650, y: 858, facing: 'east', pose: 'point' },
    { x: 825, y: 826, facing: 'west', pose: 'console' },
    { x: 1000, y: 864, facing: 'north', pose: 'neutral' },
    { x: 1172, y: 834, facing: 'south', pose: 'arms-crossed' },
    { x: 1350, y: 858, facing: 'west', pose: 'walk-away' },
  ];
  crowd.forEach(({ x, y, facing, pose }) => parts.push(framedSvg(x, y, 118, candidateCharacter(facing, 118, pose), '#5A655F', '#7B868B')));
  parts.push(text(56, 1096, 'Check: one broad chassis wedge, dark structural panels, and a single green core survive arms, overlap, floor grid, apparatus, and dock context.', 13, 680, COLORS.muted));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${parts.join('')}</svg>`;
}

function writePreview(outputDir: string): void {
  mkdirSync(outputDir, { recursive: true });
  const diffs = Object.fromEntries(FACINGS.map((facing) => [
    facing,
    pixelDiff(raster(candidateCharacter(facing, 128), 512), raster(currentCharacter(facing, 128), 512)),
  ])) as Record<Facing, PixelDiff>;
  const sourceDiffs = Object.fromEntries(FACINGS.map((facing) => [
    facing,
    pixelDiff(raster(paletteResolvedSource(facing), 512), raster(variantSvg(candidateVariant(facing)), 512)),
  ])) as Record<Facing, PixelDiff>;

  const ownership = ownershipSheet();
  const direction = directionSheet(diffs);
  const gameplay = gameplaySheet();
  writeFileSync(join(outputDir, '00-source-ownership-stack.svg'), ownership);
  writeFileSync(join(outputDir, '00-source-ownership-stack.png'), raster(ownership, 1760));
  writeFileSync(join(outputDir, '01-source-production-parity.svg'), direction);
  writeFileSync(join(outputDir, '01-source-production-parity.png'), raster(direction, 1460));
  writeFileSync(join(outputDir, '02-gameplay-scale-and-context.svg'), gameplay);
  writeFileSync(join(outputDir, '02-gameplay-scale-and-context.png'), raster(gameplay, 1600));

  const sourceHashes = FACINGS.map((facing) => `${facing}: ${createHash('sha256').update(sourceText(facing)).digest('hex')}`);
  const metrics = FACINGS.map((facing) => `${facing}: source/direct-compile ${sourceDiffs[facing].mismatchedPixels}px; direct/live ${diffs[facing].mismatchedPixels}px (max delta ${diffs[facing].maxChannelDelta})`);
  writeFileSync(join(outputDir, 'README.md'), [
    '# Canonical FAB chassis production validation v1',
    '',
    'Status: **approved and promoted to canonical production source on 2026-08-02**',
    '',
    'This validation independently compiles the three canonical SVGs through the',
    'strict part parser and compares them with the generated `fixed-body-art`',
    'receiver used by the real construction-worker compositor.',
    '',
    '## Ownership boundary',
    '',
    '- `body-large-frame`: canonical SVG body hull.',
    '- `outfit-fab-chassis`: canonical SVG chassis, fixed to `body-large-frame`.',
    '- `head-fab`: canonical SVG machine head.',
    '- pose/arm layer: intentionally procedural shared rig geometry and attachments.',
    '- Terrarium compositor: assembly, z-order, palette resolution, mirroring, and baking.',
    '- Unity: consumes baked sheets/layers; no SVG parsing or shape generation.',
    '',
    '## Pixel evidence (512 px)',
    '',
    ...metrics.map((line) => `- ${line}`),
    '',
    '## Source SHA-256',
    '',
    ...sourceHashes.map((line) => `- ${line}`),
    '',
    'The former handwritten `anchoredFabChassis()` geometry has been removed.',
    'This promotion changes character source authority only; recipe ids, export',
    'schema, Unity registration, shared body rig, and procedural pose/arm layers',
    'remain unchanged.',
    '',
  ].join('\n'));

  writeFileSync(join(outputDir, 'metrics.json'), `${JSON.stringify({
    status: 'production',
    approvedOn: '2026-08-02',
    target: 'outfit-fab-chassis',
    bodyId: 'body-large-frame',
    sourceFiles: SOURCE_FILES,
    sourceHashes: Object.fromEntries(FACINGS.map((facing) => [
      facing,
      createHash('sha256').update(sourceText(facing)).digest('hex'),
    ])),
    pixelParity512: Object.fromEntries(FACINGS.map((facing) => [facing, {
      sourceToDirectCompile: sourceDiffs[facing],
      directCompileToLiveProduction: diffs[facing],
    }])),
  }, null, 2)}\n`);

  const failed = FACINGS.flatMap((facing) => [
    ...(sourceDiffs[facing].mismatchedPixels === 0 ? [] : [`${facing} source/compiled differs`]),
    ...(diffs[facing].mismatchedPixels === 0 ? [] : [`${facing} direct/live differs`]),
  ]);
  if (failed.length) throw new Error(`FAB chassis source-fit parity failed: ${failed.join(', ')}`);
  process.stdout.write(`FAB chassis production validation: 3 facings exact at 512 px; wrote ${outputDir}\n`);
}

writePreview(resolve(process.argv[2] ?? OUTPUT));
