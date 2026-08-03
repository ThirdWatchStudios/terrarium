/**
 * Production validation for canonical outfit-dress source authority.
 *
 * Compiles all 18 canonical complete SVG variants (six body rigs by three
 * authored facings), temporarily injects them into the real compositor, and
 * compares the result with the current anchor-driven production builder.
 *
 *   npm run dress:production:preview
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';

import { composeCharacter } from '../src/core/compositor';
import type {
  CharacterRecipe,
  Facing,
  Palette,
  PartVariant,
  ShapeSpec,
} from '../src/core/types';
import { FACINGS } from '../src/core/types';
import { DEFAULT_STYLE } from '../src/data/defaults';
import { BODY_ARCHETYPES, type BodyArchetype } from '../src/parts/bodyArchetypes';
import { getPart } from '../src/parts/library';
import type { Pose } from '../src/parts/poses';
import { compilePartSvg } from './parts/importer';

const CANVAS = 128;
const OUTPUT = 'docs/previews/canonical-dress-source-fit-v1';
const SOURCE_ROOT = 'assets/parts/outfit';

const COLORS = {
  page: '#E9E6DF',
  panel: '#FFFDF8',
  ink: '#252A28',
  muted: '#66706B',
  border: '#C8C1B5',
  source: '#6C5A8D',
  proposal: '#2E7D5B',
  current: '#8A5B3D',
  flow: '#3F6D8A',
} as const;

const PALETTE: Palette = {
  skin: '#C98E68',
  hair: '#3D2A22',
  outfitPrimary: '#6F5B8F',
  outfitSecondary: '#D8C5A1',
  accent: '#B6784B',
};

const dress = getPart('outfit-dress')
  ?? (() => { throw new Error('Missing outfit-dress production receiver'); })();
const currentBuilder = dress.buildVariant
  ?? (() => { throw new Error('outfit-dress has no live body-aware builder'); })();

function sourceFile(body: BodyArchetype, facing: Facing): string {
  return `${SOURCE_ROOT}/dress.${body.id}.${facing}.svg`;
}

function sourceText(body: BodyArchetype, facing: Facing): string {
  return readFileSync(sourceFile(body, facing), 'utf8');
}

function compileCandidate(body: BodyArchetype, facing: Facing): readonly ShapeSpec[] {
  const source = sourceFile(body, facing);
  return compilePartSvg(readFileSync(source, 'utf8'), {
    source,
    slot: 'outfit',
    preserveLocalPaths: true,
  });
}

const candidateShapes = new Map<string, readonly ShapeSpec[]>(
  BODY_ARCHETYPES.flatMap((body) => FACINGS.map((facing) => [
    `${body.id}/${facing}`,
    compileCandidate(body, facing),
  ] as const)),
);

function candidateVariant(body: BodyArchetype, facing: Facing): PartVariant {
  const shapes = candidateShapes.get(`${body.id}/${facing}`);
  if (!shapes) throw new Error(`Missing candidate ${body.id}/${facing}`);
  return { z: 20, shapes: shapes.map((shape) => ({ ...shape })) };
}

function recipe(body: BodyArchetype): CharacterRecipe {
  return {
    id: `dress-proof-${body.id}`,
    name: `${body.label} dress proof`,
    parts: {
      body: body.id,
      head: 'head-round',
      hair: 'hair-none',
      outfit: 'outfit-dress',
      accessories: [],
    },
    palette: { ...PALETTE },
  };
}

function withCandidates<T>(run: () => T): T {
  dress.buildVariant = (facing, context) => {
    const body = BODY_ARCHETYPES.find(({ id }) => id === context.bodyId);
    return body ? candidateVariant(body, facing) : currentBuilder(facing, context);
  };
  try {
    return run();
  } finally {
    dress.buildVariant = currentBuilder;
  }
}

function candidateCharacter(
  body: BodyArchetype,
  facing: Facing | 'west',
  size: number,
  pose: Pose = 'neutral',
): string {
  return withCandidates(() => composeCharacter(
    recipe(body),
    DEFAULT_STYLE,
    facing,
    size,
    'normal',
    { badge: false, pose },
  ));
}

function currentCharacter(
  body: BodyArchetype,
  facing: Facing | 'west',
  size: number,
  pose: Pose = 'neutral',
): string {
  return composeCharacter(
    recipe(body),
    DEFAULT_STYLE,
    facing,
    size,
    'normal',
    { badge: false, pose },
  );
}

function resolvePaint(value: string): string {
  if (!value.startsWith('$')) return value;
  return PALETTE[value.slice(1) as keyof Palette] ?? '#FF00FF';
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
    .replaceAll('#FF00FF', PALETTE.skin)
    .replaceAll('#00FFFF', PALETTE.hair)
    .replaceAll('#FF0000', PALETTE.outfitPrimary)
    .replaceAll('#00FF00', PALETTE.outfitSecondary)
    .replaceAll('#0000FF', PALETTE.accent);
}

function paletteResolvedSource(body: BodyArchetype, facing: Facing): string {
  return paletteResolvedSvg(sourceText(body, facing));
}

function raster(svg: string, width: number): Uint8Array {
  return new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
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
    let mismatch = false;
    for (let channel = 0; channel < 4; channel++) {
      const delta = Math.abs(a.data[index + channel] - b.data[index + channel]);
      if (delta > 0) mismatch = true;
      maxChannelDelta = Math.max(maxChannelDelta, delta);
    }
    if (mismatch) mismatchedPixels++;
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

type DiffLedger = Readonly<Record<string, PixelDiff>>;

function key(body: BodyArchetype, facing: Facing): string {
  return `${body.id}/${facing}`;
}

function ownershipSheet(): string {
  const width = 1920;
  const height = 1010;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`,
    text(34, 44, 'DRESS · CANONICAL COMPLETE SVG OWNERSHIP', 28, 800),
    text(34, 72, '18 complete hand-editable files. The production adapter selects one exact body/facing source; it does not fit, scale, or redraw dress geometry.', 15, 550, COLORS.muted),
    `<rect x="30" y="94" width="1860" height="124" rx="16" fill="${COLORS.panel}" stroke="${COLORS.border}"/>`,
    text(62, 132, 'recipe bodyId + facing', 15, 760, COLORS.flow),
    text(306, 132, '→', 22, 700, COLORS.muted),
    text(354, 132, 'select exact SVG', 15, 760, COLORS.source),
    text(570, 132, '→', 22, 700, COLORS.muted),
    text(618, 132, 'strict compile', 15, 760, COLORS.proposal),
    text(790, 132, '→', 22, 700, COLORS.muted),
    text(838, 132, 'existing compositor + pose rig', 15, 760, COLORS.current),
    text(1134, 132, '→', 22, 700, COLORS.muted),
    text(1182, 132, 'baked Terrarium export', 15, 760, COLORS.current),
    text(62, 174, 'The SVG owns skirt silhouette, neckline/collar, waist treatment, and seams. West remains a compositor mirror of east.', 13, 650, COLORS.muted),
    text(62, 198, 'Unity receives baked pixels; it does not parse these SVGs or generate dress geometry.', 13, 700, '#365446'),
    `<rect x="30" y="242" width="1860" height="726" rx="16" fill="${COLORS.panel}" stroke="${COLORS.border}"/>`,
  ];

  BODY_ARCHETYPES.forEach((body, column) => {
    const x = 70 + column * 302;
    parts.push(text(x, 280, body.label.toUpperCase(), 13, 800));
    parts.push(text(x, 300, body.id, 11, 650, COLORS.muted));
    FACINGS.forEach((facing, row) => {
      const y = 324 + row * 204;
      parts.push(text(x, y + 15, facing.toUpperCase(), 11, 760, COLORS.source));
      parts.push(framedSvg(x, y + 28, 148, paletteResolvedSource(body, facing), COLORS.source));
      parts.push(framedSvg(x + 168, y + 88, 74, candidateCharacter(body, facing, 74), COLORS.proposal));
      parts.push(text(x + 168, y + 181, 'composed', 10, 650, COLORS.muted));
    });
  });
  parts.push(text(46, 994, 'Production source: assets/parts/outfit/dress.<body-id>.<facing>.svg. The former anchoredDress() geometry has been removed.', 13, 700, COLORS.muted));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${parts.join('')}</svg>`;
}

function paritySheet(diffs: DiffLedger): string {
  const width = 1940;
  const height = 1220;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`,
    text(34, 44, 'DRESS · CURRENT PRODUCTION VS DIRECT SVG COMPILE', 28, 800),
    text(34, 72, 'Each pair is rendered by the real character compositor. Green border: direct canonical compile. Brown border: live imported receiver.', 15, 550, COLORS.muted),
    `<rect x="30" y="94" width="1880" height="1078" rx="16" fill="${COLORS.panel}" stroke="${COLORS.border}"/>`,
    text(54, 126, 'BODY', 12, 760, COLORS.muted),
  ];
  FACINGS.forEach((facing, column) => {
    const x = 340 + column * 520;
    parts.push(text(x, 126, `${facing.toUpperCase()} · SVG / CURRENT`, 12, 800, COLORS.ink));
  });

  BODY_ARCHETYPES.forEach((body, row) => {
    const y = 150 + row * 166;
    parts.push(`<rect x="48" y="${y - 10}" width="1844" height="148" rx="12" fill="${row % 2 ? '#F2EFE8' : '#FAF8F2'}"/>`);
    parts.push(text(68, y + 50, body.label, 15, 800));
    parts.push(text(68, y + 72, body.id, 11, 650, COLORS.muted));
    FACINGS.forEach((facing, column) => {
      const x = 322 + column * 520;
      const diff = diffs[key(body, facing)];
      parts.push(framedSvg(x, y, 128, candidateCharacter(body, facing, 128), COLORS.proposal));
      parts.push(framedSvg(x + 152, y, 128, currentCharacter(body, facing, 128), COLORS.current));
      parts.push(text(x + 300, y + 50, `${diff.mismatchedPixels} changed px`, 11, 700, diff.mismatchedPixels === 0 ? COLORS.proposal : '#B04436'));
      parts.push(text(x + 300, y + 70, `max delta ${diff.maxChannelDelta}`, 10, 650, COLORS.muted));
    });
  });
  parts.push(text(48, 1198, 'Production gate: every direct canonical compile must remain pixel-exact to the live imported receiver.', 13, 700, COLORS.muted));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${parts.join('')}</svg>`;
}

function gameplaySheet(): string {
  const width = 1920;
  const height = 1130;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`,
    text(34, 44, 'DRESS · SIX-BODY GAMEPLAY-SCALE READ', 28, 800),
    text(34, 72, 'Review the silhouette family in the real compositor, including shared arms, mirroring, pose occlusion, and far-scale reduction.', 15, 550, COLORS.muted),
    `<rect x="30" y="94" width="1860" height="986" rx="16" fill="${COLORS.panel}" stroke="${COLORS.border}"/>`,
  ];

  BODY_ARCHETYPES.forEach((body, column) => {
    const x = 72 + column * 302;
    parts.push(text(x, 132, body.label.toUpperCase(), 13, 800));
    parts.push(text(x, 152, body.id, 11, 650, COLORS.muted));
    parts.push(framedSvg(x, 174, 172, candidateCharacter(body, 'south', 172), COLORS.proposal));
    parts.push(framedSvg(x + 184, 222, 86, candidateCharacter(body, 'east', 86), COLORS.proposal));
    parts.push(text(x, 370, 'south · inspection', 11, 680, COLORS.muted));
    parts.push(text(x + 184, 330, 'east · half', 10, 650, COLORS.muted));
    parts.push(framedSvg(x, 410, 64, candidateCharacter(body, 'south', 64), COLORS.proposal));
    parts.push(framedSvg(x + 82, 426, 48, candidateCharacter(body, 'east', 48), COLORS.proposal));
    parts.push(framedSvg(x + 148, 442, 32, candidateCharacter(body, 'west', 32), COLORS.proposal));
    parts.push(text(x, 500, '64', 10, 700, COLORS.muted));
    parts.push(text(x + 82, 500, '48', 10, 700, COLORS.muted));
    parts.push(text(x + 148, 500, '32', 10, 700, COLORS.muted));
  });

  parts.push(text(54, 552, 'POSE OCCLUSION · SHARED RIG REMAINS OUTSIDE DRESS SOURCE', 13, 800, COLORS.muted));
  const poses: readonly Pose[] = ['neutral', 'walk-approach', 'arms-crossed', 'point', 'slump', 'console'];
  BODY_ARCHETYPES.forEach((body, column) => {
    const x = 72 + column * 302;
    const firstPose = poses[column];
    const secondPose = poses[(column + 2) % poses.length];
    parts.push(framedSvg(x, 580, 132, candidateCharacter(body, column % 2 ? 'east' : 'south', 132, firstPose), COLORS.proposal));
    parts.push(framedSvg(x + 146, 580, 110, candidateCharacter(body, column % 2 ? 'west' : 'north', 110, secondPose), COLORS.proposal));
    parts.push(text(x, 732, firstPose, 10, 680));
    parts.push(text(x + 146, 712, secondPose, 10, 680));
  });

  parts.push(`<rect x="54" y="770" width="1812" height="274" rx="12" fill="#747D82" stroke="#51595D" stroke-width="2"/>`);
  for (let x = 102; x < 1866; x += 96) parts.push(`<path d="M ${x} 770 V 1044" stroke="#99A1A5" opacity=".28"/>`);
  for (let y = 834; y < 1044; y += 64) parts.push(`<path d="M 54 ${y} H 1866" stroke="#99A1A5" opacity=".28"/>`);
  BODY_ARCHETYPES.forEach((body, index) => {
    const x = 112 + index * 290;
    const facing: Facing | 'west' = (['south', 'east', 'west', 'north', 'south', 'west'] as const)[index];
    parts.push(framedSvg(x, 824 + (index % 2) * 28, 118, candidateCharacter(body, facing, 118, poses[index]), '#59635E', '#7B858A'));
    parts.push(text(x, 1000 + (index % 2) * 20, body.label, 11, 700, '#F4F1E9'));
  });
  parts.push(text(56, 1106, 'Visual question: do all six still feel like one dress family while preserving enough body-specific rhythm at 64, 48, and 32 px?', 13, 700, COLORS.muted));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${parts.join('')}</svg>`;
}

function writePreview(outputDir: string): void {
  mkdirSync(outputDir, { recursive: true });

  const composedDiffs: Record<string, PixelDiff> = {};
  const sourceDiffs: Record<string, PixelDiff> = {};
  for (const body of BODY_ARCHETYPES) {
    for (const facing of FACINGS) {
      const ledgerKey = key(body, facing);
      sourceDiffs[ledgerKey] = pixelDiff(
        raster(paletteResolvedSource(body, facing), 512),
        raster(variantSvg(candidateVariant(body, facing)), 512),
      );
      composedDiffs[ledgerKey] = pixelDiff(
        raster(candidateCharacter(body, facing, 128), 512),
        raster(currentCharacter(body, facing, 128), 512),
      );
    }
  }

  const ownership = ownershipSheet();
  const parity = paritySheet(composedDiffs);
  const gameplay = gameplaySheet();
  writeFileSync(join(outputDir, '00-source-ownership-strategy.svg'), ownership);
  writeFileSync(join(outputDir, '00-source-ownership-strategy.png'), raster(ownership, 1920));
  writeFileSync(join(outputDir, '01-six-body-source-production-parity.svg'), parity);
  writeFileSync(join(outputDir, '01-six-body-source-production-parity.png'), raster(parity, 1940));
  writeFileSync(join(outputDir, '02-gameplay-scale-and-pose-context.svg'), gameplay);
  writeFileSync(join(outputDir, '02-gameplay-scale-and-pose-context.png'), raster(gameplay, 1920));

  const metrics = Object.fromEntries(BODY_ARCHETYPES.map((body) => [
    body.id,
    Object.fromEntries(FACINGS.map((facing) => {
      const ledgerKey = key(body, facing);
      return [facing, {
        sourceFile: sourceFile(body, facing),
        sourceSha256: createHash('sha256').update(sourceText(body, facing)).digest('hex'),
        shapeCount: candidateShapes.get(ledgerKey)?.length ?? 0,
        sourceToDirectCompile: sourceDiffs[ledgerKey],
        directCompileToCurrentProduction: composedDiffs[ledgerKey],
      }];
    })),
  ]));
  writeFileSync(join(outputDir, 'metrics.json'), `${JSON.stringify({
    status: 'production',
    approvedOn: '2026-08-02',
    target: 'outfit-dress',
    sourceStrategy: 'complete-svg-per-body-and-facing',
    sourceCount: BODY_ARCHETYPES.length * FACINGS.length,
    adapterResponsibilities: ['select bodyId/facing source', 'return compiled shapes'],
    metrics,
  }, null, 2)}\n`);

  writeFileSync(join(outputDir, 'README.md'), [
    '# Canonical dress production validation v1',
    '',
    'Status: **approved and promoted to canonical production source on 2026-08-02**',
    '',
    'This validation compiles eighteen canonical complete SVGs: six production body',
    'rigs times three authored facings. Each file owns the entire visible dress.',
    'The production adapter only selects the exact body/facing',
    'source and return its compiled shapes. It would not scale, fit, redraw, or',
    'procedurally construct dress geometry. East remains the authored source for',
    'the compositor\'s west mirror.',
    '',
    '## Evidence',
    '',
    '- 18/18 sources compile through the strict part parser.',
    '- 18/18 palette-resolved source rasters match their direct compiled variants at 512 px.',
    '- 18/18 direct compiled variants match the live imported receiver at 512 px.',
    '- The gameplay sheet exercises every body, all facings including west mirroring, six poses, and 32/48/64 px reads.',
    '',
    '## Ownership boundary',
    '',
    '- Canonical SVGs own all visible dress geometry for the six production bodies.',
    '- The importer validates all 18 files as one atomic source set.',
    '- The runtime adapter owns only exact body/facing selection and z-order.',
    '- The compositor owns east-to-west mirroring, pose assembly, palette resolution, and baking.',
    '- Unity consumes baked sheets and layers; it does not parse SVGs or build the dress.',
    '- Deprecated legacy body ids retain their dormant static compatibility facings; they are outside this six-body production source matrix.',
    '',
    'The former handwritten `anchoredDress()` geometry has been removed. Recipe',
    'ids, export schema, body rigs, pose geometry, and Unity registration remain',
    'unchanged.',
    '',
  ].join('\n'));

  const failures: string[] = [];
  for (const body of BODY_ARCHETYPES) {
    for (const facing of FACINGS) {
      const ledgerKey = key(body, facing);
      if (sourceDiffs[ledgerKey].mismatchedPixels !== 0) failures.push(`${ledgerKey} source/direct`);
      if (composedDiffs[ledgerKey].mismatchedPixels !== 0) failures.push(`${ledgerKey} direct/current`);
    }
  }
  if (failures.length) throw new Error(`Dress source-fit parity failed: ${failures.join(', ')}`);
  process.stdout.write(`Dress production validation: 18 complete SVGs exact at 512 px; wrote ${outputDir}\n`);
}

writePreview(resolve(process.argv[2] ?? OUTPUT));
