/**
 * Production source-authority validation for the cafeteria service uniform.
 *
 *   npm run cafeteria-uniform:source-fit:preview
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';

import { composeCharacter } from '../src/core/compositor';
import type { CharacterRecipe, Facing, Palette, PartVariant, ShapeSpec } from '../src/core/types';
import { FACINGS } from '../src/core/types';
import { DEFAULT_STYLE, KITCHEN_STAFF } from '../src/data/defaults';
import { BODY_ARCHETYPES, type BodyArchetype } from '../src/parts/bodyArchetypes';
import { getPart } from '../src/parts/library';
import type { Pose } from '../src/parts/poses';
import { compileAuthoredSvg, compilePartSvg } from './parts/importer';

const CANVAS = 128;
const SOURCE_ROOT = 'assets/parts';
const OUTPUT = 'docs/previews/canonical-cafeteria-uniform-source-fit-v1';
const PALETTE: Palette = { ...KITCHEN_STAFF[0].palette };
const HAIR_IDS = ['hair-bob', 'hair-short', 'hair-bun', 'hair-ponytail', 'hair-curly', 'hair-coils'] as const;

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

const apron = getPart('outfit-service-apron')
  ?? (() => { throw new Error('Missing outfit-service-apron'); })();
const hairnet = getPart('acc-hairnet')
  ?? (() => { throw new Error('Missing acc-hairnet'); })();
const currentApronBuilder = apron.buildVariant
  ?? (() => { throw new Error('outfit-service-apron has no body-aware builder'); })();
const currentHairnet = Object.fromEntries(FACINGS.map((facing) => {
  const variant = hairnet.facings[facing];
  if (!variant) throw new Error(`Missing current hairnet ${facing}`);
  return [facing, { ...variant, shapes: variant.shapes.map((shape) => ({ ...shape })) }];
})) as Record<Facing, PartVariant>;

function apronSourceFile(body: BodyArchetype, facing: Facing): string {
  return `${SOURCE_ROOT}/outfit/service-apron.${body.id}.${facing}.svg`;
}

function hairnetSourceFile(facing: Facing): string {
  return `${SOURCE_ROOT}/accessory/hairnet.${facing}.svg`;
}

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

function compileLayeredApronSource(source: string): readonly ShapeSpec[] {
  return compilePartSvg(read(source), {
    source,
    slot: 'outfit',
    preserveLocalPaths: true,
    preservePaintRuns: true,
  });
}

const apronShapes = new Map<string, readonly ShapeSpec[]>(
  BODY_ARCHETYPES.flatMap((body) => FACINGS.map((facing) => {
    const source = apronSourceFile(body, facing);
    return [`${body.id}/${facing}`, compileLayeredApronSource(source)] as const;
  })),
);

const hairnetShapes = Object.fromEntries(FACINGS.map((facing) => {
  const source = hairnetSourceFile(facing);
  return [facing, compileAuthoredSvg(read(source), {
    source,
    origin: { x: 64, y: 44 },
    preserveLocalPaths: true,
    canonicalTransformLabel: 'head-center accessory',
  })];
})) as unknown as Record<Facing, readonly ShapeSpec[]>;

function apronVariant(body: BodyArchetype, facing: Facing): PartVariant {
  const shapes = apronShapes.get(`${body.id}/${facing}`);
  if (!shapes) throw new Error(`Missing candidate apron ${body.id}/${facing}`);
  return { z: 20, shapes: shapes.map((shape) => ({ ...shape })) };
}

function hairnetVariant(facing: Facing): PartVariant {
  return { z: 60, shapes: hairnetShapes[facing].map((shape) => ({ ...shape })) };
}

function recipe(body: BodyArchetype, hairId = 'hair-bun'): CharacterRecipe {
  return {
    ...KITCHEN_STAFF[0],
    id: `cafeteria-source-fit-${body.id}-${hairId}`,
    parts: {
      ...KITCHEN_STAFF[0].parts,
      body: body.id,
      hair: hairId,
      outfit: 'outfit-service-apron',
      accessories: ['acc-hairnet'],
    },
    palette: { ...PALETTE },
  };
}

function withCandidates<T>(run: () => T): T {
  apron.buildVariant = (facing, context) => {
    const body = BODY_ARCHETYPES.find(({ id }) => id === context.bodyId);
    return body ? apronVariant(body, facing) : currentApronBuilder(facing, context);
  };
  for (const facing of FACINGS) hairnet.facings[facing] = hairnetVariant(facing);
  try {
    return run();
  } finally {
    apron.buildVariant = currentApronBuilder;
    for (const facing of FACINGS) hairnet.facings[facing] = currentHairnet[facing];
  }
}

function candidateCharacter(
  body: BodyArchetype,
  facing: Facing | 'west',
  size: number,
  pose: Pose = 'neutral',
  hairId = 'hair-bun',
): string {
  return withCandidates(() => composeCharacter(
    recipe(body, hairId),
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
  hairId = 'hair-bun',
): string {
  return composeCharacter(
    recipe(body, hairId),
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
  const attrs = [`d="${shape.d}"`, `fill="${shape.fill ? resolvePaint(shape.fill) : 'none'}"`];
  if (shape.stroke) {
    attrs.push(`stroke="${resolvePaint(shape.stroke)}"`);
    attrs.push(`stroke-width="${shape.strokeWidth ?? 1.5}"`);
    attrs.push(`stroke-linecap="${shape.strokeLinecap ?? 'round'}"`);
    attrs.push(`stroke-linejoin="${shape.strokeLinejoin ?? 'round'}"`);
  }
  if (shape.opacity !== undefined) attrs.push(`opacity="${shape.opacity}"`);
  return `<path ${attrs.join(' ')}/>`;
}

function variantSvg(variant: PartVariant, origin: { x: number; y: number }): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128"><g transform="translate(${origin.x} ${origin.y})">${variant.shapes.map(emitShape).join('')}</g></svg>`;
}

function paletteResolvedSvg(source: string): string {
  return source
    .replaceAll('#FF00FF', PALETTE.skin)
    .replaceAll('#00FFFF', PALETTE.hair)
    .replaceAll('#FF0000', PALETTE.outfitPrimary)
    .replaceAll('#00FF00', PALETTE.outfitSecondary)
    .replaceAll('#0000FF', PALETTE.accent);
}

function raster(svg: string, width: number): Uint8Array {
  return new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
}

interface PixelDiff { mismatchedPixels: number; maxChannelDelta: number }

function pixelDiff(left: Uint8Array, right: Uint8Array): PixelDiff {
  const a = PNG.sync.read(Buffer.from(left));
  const b = PNG.sync.read(Buffer.from(right));
  if (a.width !== b.width || a.height !== b.height) throw new Error('Raster dimensions differ');
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

function text(x: number, y: number, value: string, size = 14, weight = 500, fill: string = COLORS.ink): string {
  return `<text x="${x}" y="${y}" font-family="system-ui,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${escapeText(value)}</text>`;
}

function svgInner(svg: string): string {
  return svg.replace(/^<svg[^>]*>/, '').replace(/<title>.*?<\/title>/s, '').replace(/<desc>.*?<\/desc>/s, '')
    .replace(/<metadata>.*?<\/metadata>/s, '').replace(/<\/svg>\s*$/, '').replace(/^[ \t]+$/gm, '');
}

function framedSvg(
  x: number,
  y: number,
  size: number,
  svg: string,
  border: string = COLORS.border,
  fill: string = '#FFFFFF',
): string {
  return `<rect x="${x - 4}" y="${y - 4}" width="${size + 8}" height="${size + 8}" rx="8" fill="${fill}" stroke="${border}" stroke-width="2"/><g transform="translate(${x} ${y}) scale(${size / CANVAS})">${svgInner(svg)}</g>`;
}

function key(body: BodyArchetype, facing: Facing): string {
  return `${body.id}/${facing}`;
}

function ownershipSheet(): string {
  const width = 1920;
  const height = 1190;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`,
    text(34, 44, 'CAFETERIA UNIFORM · CANONICAL SOURCE OWNERSHIP', 28, 800),
    text(34, 72, '21 hand-editable files: 18 complete body-specific apron overlays plus 3 complete head-center hairnet overlays.', 15, 550, COLORS.muted),
    `<rect x="30" y="94" width="1860" height="124" rx="16" fill="${COLORS.panel}" stroke="${COLORS.border}"/>`,
    text(62, 132, 'recipe bodyId + facing', 15, 760, COLORS.flow), text(306, 132, '→', 22, 700, COLORS.muted),
    text(354, 132, 'select apron + hairnet SVGs', 15, 760, COLORS.source), text(622, 132, '→', 22, 700, COLORS.muted),
    text(670, 132, 'strict compile', 15, 760, COLORS.proposal), text(838, 132, '→', 22, 700, COLORS.muted),
    text(886, 132, 'existing compositor + pose rig', 15, 760, COLORS.current), text(1184, 132, '→', 22, 700, COLORS.muted),
    text(1232, 132, 'baked Terrarium export', 15, 760, COLORS.current),
    text(62, 174, 'Body SVG owns the person silhouette · apron SVG owns tee field, bib, skirt, straps, pocket, and waist seam · hairnet SVG owns cap and mesh.', 13, 650, COLORS.muted),
    text(62, 198, 'Shared hair, face, arms, poses, and mirroring remain compositor concerns. Ordered tint runs preserve the apron pocket paint order.', 13, 700, '#365446'),
    `<rect x="30" y="242" width="1860" height="718" rx="16" fill="${COLORS.panel}" stroke="${COLORS.border}"/>`,
  ];

  BODY_ARCHETYPES.forEach((body, column) => {
    const x = 70 + column * 302;
    parts.push(text(x, 280, body.label.toUpperCase(), 13, 800));
    parts.push(text(x, 300, body.id, 11, 650, COLORS.muted));
    FACINGS.forEach((facing, row) => {
      const y = 324 + row * 204;
      parts.push(text(x, y + 15, facing.toUpperCase(), 11, 760, COLORS.source));
      parts.push(framedSvg(x, y + 28, 148, paletteResolvedSvg(read(apronSourceFile(body, facing))), COLORS.source));
      parts.push(framedSvg(x + 168, y + 88, 74, candidateCharacter(body, facing, 74, 'neutral', HAIR_IDS[column]), COLORS.proposal));
      parts.push(text(x + 168, y + 181, 'full kit', 10, 650, COLORS.muted));
    });
  });

  parts.push(`<rect x="30" y="984" width="1860" height="160" rx="16" fill="${COLORS.panel}" stroke="${COLORS.border}"/>`);
  parts.push(text(54, 1018, 'HAIRNET · THREE COMPLETE HEAD-CENTER SOURCES', 13, 800, COLORS.muted));
  FACINGS.forEach((facing, index) => {
    const x = 430 + index * 430;
    parts.push(text(x, 1044, facing.toUpperCase(), 11, 760, COLORS.source));
    parts.push(framedSvg(x, 1058, 72, paletteResolvedSvg(read(hairnetSourceFile(facing))), COLORS.source));
    parts.push(framedSvg(x + 96, 1058, 72, candidateCharacter(BODY_ARCHETYPES[index + 1], facing, 72, 'neutral', HAIR_IDS[index + 2]), COLORS.proposal));
  });
  parts.push(text(46, 1174, 'Production sources live under assets/parts; generated receiver geometry is rebuilt by the part importer.', 13, 700, COLORS.muted));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${parts.join('')}</svg>`;
}

function paritySheet(diffs: Readonly<Record<string, PixelDiff>>): string {
  const width = 1940;
  const height = 1220;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`,
    text(34, 44, 'CAFETERIA UNIFORM · CURRENT PRODUCTION VS DIRECT SVG COMPILE', 28, 800),
    text(34, 72, 'Green: canonical apron + hairnet SVGs compiled directly. Brown: live imported receivers. Every pair uses the real compositor.', 15, 550, COLORS.muted),
    `<rect x="30" y="94" width="1880" height="1078" rx="16" fill="${COLORS.panel}" stroke="${COLORS.border}"/>`,
    text(54, 126, 'BODY', 12, 760, COLORS.muted),
  ];
  FACINGS.forEach((facing, column) => parts.push(text(340 + column * 520, 126, `${facing.toUpperCase()} · SVG / CURRENT`, 12, 800)));
  BODY_ARCHETYPES.forEach((body, row) => {
    const y = 150 + row * 166;
    parts.push(`<rect x="48" y="${y - 10}" width="1844" height="148" rx="12" fill="${row % 2 ? '#F2EFE8' : '#FAF8F2'}"/>`);
    parts.push(text(68, y + 50, body.label, 15, 800));
    parts.push(text(68, y + 72, body.id, 11, 650, COLORS.muted));
    FACINGS.forEach((facing, column) => {
      const x = 322 + column * 520;
      const diff = diffs[key(body, facing)];
      const hairId = HAIR_IDS[row];
      parts.push(framedSvg(x, y, 128, candidateCharacter(body, facing, 128, 'neutral', hairId), COLORS.proposal));
      parts.push(framedSvg(x + 152, y, 128, currentCharacter(body, facing, 128, 'neutral', hairId), COLORS.current));
      parts.push(text(x + 300, y + 50, `${diff.mismatchedPixels} changed px`, 11, 700, diff.mismatchedPixels === 0 ? COLORS.proposal : '#B04436'));
      parts.push(text(x + 300, y + 70, `max delta ${diff.maxChannelDelta}`, 10, 650, COLORS.muted));
    });
  });
  parts.push(text(48, 1198, 'Source-authority gate: canonical sources must remain pixel-exact to their live imported receivers.', 13, 700, COLORS.muted));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${parts.join('')}</svg>`;
}

function gameplaySheet(): string {
  const width = 1920;
  const height = 1130;
  const poses: readonly Pose[] = ['neutral', 'walk-approach', 'arms-crossed', 'point', 'slump', 'console'];
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`,
    text(34, 44, 'CAFETERIA UNIFORM · GAMEPLAY SCALE, HAIR, AND POSE READ', 28, 800),
    text(34, 72, 'Six canonical body rigs, six fitted hairstyles beneath the hairnet, shared pose occlusion, mirroring, and 64/48/32 px reduction.', 15, 550, COLORS.muted),
    `<rect x="30" y="94" width="1860" height="986" rx="16" fill="${COLORS.panel}" stroke="${COLORS.border}"/>`,
  ];
  BODY_ARCHETYPES.forEach((body, column) => {
    const x = 72 + column * 302;
    const hairId = HAIR_IDS[column];
    parts.push(text(x, 132, body.label.toUpperCase(), 13, 800));
    parts.push(text(x, 152, hairId, 11, 650, COLORS.muted));
    parts.push(framedSvg(x, 174, 172, candidateCharacter(body, 'south', 172, 'neutral', hairId), COLORS.proposal));
    parts.push(framedSvg(x + 184, 222, 86, candidateCharacter(body, 'east', 86, 'neutral', hairId), COLORS.proposal));
    parts.push(framedSvg(x, 410, 64, candidateCharacter(body, 'south', 64, 'neutral', hairId), COLORS.proposal));
    parts.push(framedSvg(x + 82, 426, 48, candidateCharacter(body, 'east', 48, 'neutral', hairId), COLORS.proposal));
    parts.push(framedSvg(x + 148, 442, 32, candidateCharacter(body, 'west', 32, 'neutral', hairId), COLORS.proposal));
    parts.push(text(x, 500, '64', 10, 700, COLORS.muted));
    parts.push(text(x + 82, 500, '48', 10, 700, COLORS.muted));
    parts.push(text(x + 148, 500, '32', 10, 700, COLORS.muted));
  });
  parts.push(text(54, 552, 'POSE OCCLUSION · SHARED RIG REMAINS OUTSIDE BOTH SOURCES', 13, 800, COLORS.muted));
  BODY_ARCHETYPES.forEach((body, column) => {
    const x = 72 + column * 302;
    parts.push(framedSvg(x, 580, 132, candidateCharacter(body, column % 2 ? 'east' : 'south', 132, poses[column], HAIR_IDS[column]), COLORS.proposal));
    parts.push(framedSvg(x + 146, 580, 110, candidateCharacter(body, column % 2 ? 'west' : 'north', 110, poses[(column + 2) % poses.length], HAIR_IDS[column]), COLORS.proposal));
    parts.push(text(x, 732, poses[column], 10, 680));
  });
  parts.push(`<rect x="54" y="770" width="1812" height="274" rx="12" fill="#747D82" stroke="#51595D" stroke-width="2"/>`);
  for (let x = 102; x < 1866; x += 96) parts.push(`<path d="M ${x} 770 V 1044" stroke="#99A1A5" opacity=".28"/>`);
  for (let y = 834; y < 1044; y += 64) parts.push(`<path d="M 54 ${y} H 1866" stroke="#99A1A5" opacity=".28"/>`);
  BODY_ARCHETYPES.forEach((body, index) => {
    const x = 112 + index * 290;
    const facing = (['south', 'east', 'west', 'north', 'south', 'west'] as const)[index];
    parts.push(framedSvg(x, 824 + (index % 2) * 28, 118, candidateCharacter(body, facing, 118, poses[index], HAIR_IDS[index]), '#59635E', '#7B858A'));
    parts.push(text(x, 1000 + (index % 2) * 20, body.label, 11, 700, '#F4F1E9'));
  });
  parts.push(text(56, 1106, 'Visual question: does this read as one practical service uniform, with apron and translucent hairnet still clear at gameplay scale?', 13, 700, COLORS.muted));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${parts.join('')}</svg>`;
}

function writePreview(outputDir: string): void {
  mkdirSync(outputDir, { recursive: true });
  const apronSourceDiffs: Record<string, PixelDiff> = {};
  const hairnetSourceDiffs: Partial<Record<Facing, PixelDiff>> = {};
  const composedDiffs: Record<string, PixelDiff> = {};

  for (const body of BODY_ARCHETYPES) {
    for (const facing of FACINGS) {
      const ledgerKey = key(body, facing);
      apronSourceDiffs[ledgerKey] = pixelDiff(
        raster(paletteResolvedSvg(read(apronSourceFile(body, facing))), 512),
        raster(variantSvg(apronVariant(body, facing), { x: 64, y: 87 }), 512),
      );
      composedDiffs[ledgerKey] = pixelDiff(
        raster(candidateCharacter(body, facing, 128, 'neutral', HAIR_IDS[BODY_ARCHETYPES.indexOf(body)]), 512),
        raster(currentCharacter(body, facing, 128, 'neutral', HAIR_IDS[BODY_ARCHETYPES.indexOf(body)]), 512),
      );
    }
  }
  for (const facing of FACINGS) {
    hairnetSourceDiffs[facing] = pixelDiff(
      raster(paletteResolvedSvg(read(hairnetSourceFile(facing))), 512),
      raster(variantSvg(hairnetVariant(facing), { x: 64, y: 44 }), 512),
    );
  }

  const ownership = ownershipSheet();
  const parity = paritySheet(composedDiffs);
  const gameplay = gameplaySheet();
  writeFileSync(join(outputDir, '00-source-ownership-strategy.svg'), ownership);
  writeFileSync(join(outputDir, '00-source-ownership-strategy.png'), raster(ownership, 1920));
  writeFileSync(join(outputDir, '01-six-body-source-production-parity.svg'), parity);
  writeFileSync(join(outputDir, '01-six-body-source-production-parity.png'), raster(parity, 1940));
  writeFileSync(join(outputDir, '02-gameplay-scale-hair-and-pose-context.svg'), gameplay);
  writeFileSync(join(outputDir, '02-gameplay-scale-hair-and-pose-context.png'), raster(gameplay, 1920));

  writeFileSync(join(outputDir, 'metrics.json'), `${JSON.stringify({
    status: 'production',
    approvedOn: '2026-08-02',
    downstreamHandoff: 'normal browser export and fresh Unity import completed 2026-08-02',
    downstreamVisualGate: 'deferred until the sim can surface cafeteria workers in action',
    targets: ['outfit-service-apron', 'acc-hairnet'],
    sourceStrategy: 'complete-apron-overlay-per-body-facing-plus-complete-hairnet-per-facing',
    sourceCount: 21,
    orderedTintRuns: 'secondary tee, primary apron, then secondary pocket',
    apron: Object.fromEntries(BODY_ARCHETYPES.map((body) => [body.id, Object.fromEntries(FACINGS.map((facing) => {
      const source = apronSourceFile(body, facing);
      return [facing, { sourceFile: source, sourceSha256: createHash('sha256').update(read(source)).digest('hex'), sourceToDirectCompile: apronSourceDiffs[key(body, facing)], fullKitToCurrentProduction: composedDiffs[key(body, facing)] }];
    }))])),
    hairnet: Object.fromEntries(FACINGS.map((facing) => {
      const source = hairnetSourceFile(facing);
      return [facing, { sourceFile: source, sourceSha256: createHash('sha256').update(read(source)).digest('hex'), sourceToDirectCompile: hairnetSourceDiffs[facing] }];
    })),
  }, null, 2)}\n`);

  writeFileSync(join(outputDir, 'README.md'), [
    '# Canonical cafeteria-uniform source validation v1',
    '',
    'Status: **Direction A approved and promoted on 2026-08-02**',
    '',
    'This proof compiles 21 complete editable overlays: 18 body/facing service-apron',
    'SVGs and three head-center hairnet SVGs. The apron files own the tee field, bib,',
    'skirt, straps, pocket, and waist seam. The hairnet files own the translucent cap',
    'and mesh. Existing body and hair SVGs retain their own silhouettes.',
    '',
    'The apron uses two separated `$outfitSecondary` runs: tee beneath the primary',
    'apron and pocket above it. Character-layer export preserves those ordered tint',
    'runs instead of collapsing equal-tint shapes into one layer.',
    '',
    'The handwritten apron builder and static hairnet geometry were removed. The normal',
    'Terrarium browser export and fresh Unity import completed on 2026-08-02.',
    'In-action Unity visual inspection is explicitly deferred until the sim can surface',
    'cafeteria workers; import completion is not being presented as that visual gate.',
    '',
  ].join('\n'));

  const failures = [
    ...Object.entries(apronSourceDiffs).filter(([, diff]) => diff.mismatchedPixels).map(([id]) => `${id} apron source/direct`),
    ...Object.entries(hairnetSourceDiffs).filter(([, diff]) => diff?.mismatchedPixels).map(([id]) => `${id} hairnet source/direct`),
    ...Object.entries(composedDiffs).filter(([, diff]) => diff.mismatchedPixels).map(([id]) => `${id} full-kit/current`),
  ];
  if (failures.length) throw new Error(`Cafeteria-uniform parity failed: ${failures.join(', ')}`);
  process.stdout.write(`Cafeteria-uniform production validation: 21 sources and 18 full-kit compositions exact at 512 px; wrote ${outputDir}\n`);
}

writePreview(resolve(process.argv[2] ?? OUTPUT));
