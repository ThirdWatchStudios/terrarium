import svgpath from 'svgpath';

import type { BodyFacingAnchors, Facing, PaletteToken, PartDef, ShapeSpec, Slot } from '../../src/core/types';
import { FACINGS } from '../../src/core/types';
import { circle } from '../../src/core/geometry';
import { BODY_ARCHETYPES, type BodyArchetypeId } from '../../src/parts/bodyArchetypes';
import { getPart } from '../../src/parts/library';
import { PART_AUTHORING_ORIGINS } from './importer';
import { PART_IMPORT_TARGETS } from './catalog';
import {
  PART_SENTINEL_COLORS,
  PART_SENTINEL_SWATCHES,
} from './sentinels';

export const PART_AUTHORING_SCAFFOLD_DIR = 'assets/part-authoring/scaffolds';
export const PART_AUTHORING_PALETTE_DIR = 'assets/part-authoring/palettes';
export const PART_AUTHORING_OWNED_DIRS = [
  PART_AUTHORING_SCAFFOLD_DIR,
  PART_AUTHORING_PALETTE_DIR,
] as const;

export const PART_SCAFFOLD_SPECS = [
  { slot: 'body', referenceId: 'body-compact', slug: 'compact', facings: FACINGS },
  { slot: 'body', referenceId: 'body-balanced', slug: 'balanced', facings: FACINGS },
  { slot: 'body', referenceId: 'body-large-frame', slug: 'large-frame', facings: FACINGS },
  { slot: 'body', referenceId: 'body-tall', slug: 'tall', facings: FACINGS },
  { slot: 'body', referenceId: 'body-soft', slug: 'soft', facings: FACINGS },
  { slot: 'head', referenceId: 'head-round', slug: 'round', facings: FACINGS },
  { slot: 'head', referenceId: 'head-oval', slug: 'oval', facings: FACINGS },
  { slot: 'head', referenceId: 'head-boxy', slug: 'boxy', facings: FACINGS },
  { slot: 'head', referenceId: 'head-long', slug: 'long', facings: FACINGS },
  { slot: 'head', referenceId: 'head-angular', slug: 'angular', facings: FACINGS },
  { slot: 'head', referenceId: 'head-soft-square', slug: 'soft-square', facings: FACINGS },
  { slot: 'hair', referenceId: 'hair-bob', slug: 'bob', facings: FACINGS },
  {
    slot: 'outfit',
    referenceId: 'outfit-tee',
    referenceBodyId: 'body-balanced',
    slug: 'tee',
    facings: ['south', 'east'],
  },
] as const satisfies readonly {
  slot: 'body' | 'head' | 'hair' | 'outfit';
  referenceId: string;
  referenceBodyId?: BodyArchetypeId;
  slug: string;
  facings: readonly Facing[];
}[];

export interface GeneratedPartAuthoringAsset {
  readonly path: string;
  readonly bytes: Buffer;
}

const GUIDE_COLORS = {
  minor: '#DCE2E3',
  major: '#BCC7CA',
  safe: '#D68B35',
  head: '#4F91A8',
  body: '#9C7AB8',
  anchor: '#C84D6F',
  reference: '#66747A',
  canvas: '#7E898E',
} as const;

function fail(message: string): never {
  throw new Error(`Part scaffold generation: ${message}`);
}

function xml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function paintForAuthoring(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (!value.startsWith('$')) return value.toUpperCase();
  const token = value.slice(1) as PaletteToken;
  return PART_SENTINEL_COLORS[token] ?? fail(`unknown palette token ${value}`);
}

function pathElement(
  id: string,
  shape: ShapeSpec,
  paint: 'authoring' | 'reference' = 'authoring',
): string {
  const fill = shape.fill
    ? paint === 'reference' ? GUIDE_COLORS.reference : paintForAuthoring(shape.fill)
    : undefined;
  const stroke = shape.stroke
    ? paint === 'reference' ? GUIDE_COLORS.reference : paintForAuthoring(shape.stroke)
    : undefined;
  const attributes = [
    `id="${xml(id)}"`,
    `d="${xml(shape.d)}"`,
    `fill="${fill ?? 'none'}"`,
  ];
  if (fill) attributes.push('fill-rule="nonzero"');
  if (stroke) {
    attributes.push(`stroke="${stroke}"`);
    attributes.push(`stroke-width="${shape.strokeWidth ?? 1.5}"`);
    attributes.push('stroke-linecap="round"');
    attributes.push('stroke-linejoin="round"');
  }
  if (shape.opacity !== undefined) attributes.push(`opacity="${shape.opacity}"`);
  return `    <path ${attributes.join(' ')}/>`;
}

function guidePath(id: string, d: string, stroke: string, width: number, opacity?: number): string {
  const attributes = [
    `id="${xml(id)}"`,
    `d="${xml(d)}"`,
    'fill="none"',
    `stroke="${stroke}"`,
    `stroke-width="${width}"`,
    'stroke-linecap="round"',
    'stroke-linejoin="round"',
  ];
  if (opacity !== undefined) attributes.push(`opacity="${opacity}"`);
  return `    <path ${attributes.join(' ')}/>`;
}

function gridPath(step: number): string {
  const segments: string[] = [];
  for (let coordinate = step; coordinate < 128; coordinate += step) {
    segments.push(`M ${coordinate} 0 V 128`, `M 0 ${coordinate} H 128`);
  }
  return segments.join(' ');
}

function bodyGuide(facing: Facing): string {
  const body = getPart('body-standard') ?? fail('missing legacy body-standard guide source');
  const variant = body.facings[facing] ?? fail(`body-standard/${facing} has no guide geometry`);
  // East runtime places the head 3 units right of the body. Scaffolds keep the
  // authored head at x=64, so the body shifts left to preserve that relation.
  const bodyX = facing === 'east' ? 61 : 64;
  const paths = variant.shapes
    .filter((shape) => shape.silhouette !== false)
    .map((shape, index) => {
      const d = svgpath(shape.d).translate(bodyX, 87).round(3).toString();
      return guidePath(
        `guide/body-capsule/shape-${String(index + 1).padStart(3, '0')}`,
        d,
        GUIDE_COLORS.body,
        0.8,
        0.65,
      );
    });
  return ['  <g id="guide/body-capsule">', ...paths, '  </g>'].join('\n');
}

function referenceGroup(id: string, part: PartDef, facing: Facing, opacity: number): string {
  const variant = part.facings[facing] ?? fail(`${part.id}/${facing} has no reference geometry`);
  const origin = PART_AUTHORING_ORIGINS[part.slot as 'head' | 'hair'];
  const paths = variant.shapes.map((shape, index) =>
    pathElement(`reference/${id}/shape-${String(index + 1).padStart(3, '0')}`, shape, 'reference'));
  return [
    `  <g id="reference/${xml(id)}" opacity="${opacity}" transform="translate(${origin.x} ${origin.y})">`,
    ...paths,
    '  </g>',
  ].join('\n');
}

function activeArt(part: PartDef, facing: Facing): string {
  const variant = part.facings[facing] ?? fail(`${part.id}/${facing} has no source geometry`);
  const origin = PART_AUTHORING_ORIGINS[part.slot as 'head' | 'hair'];
  const paths = variant.shapes.map((shape, index) => {
    const role = shape.silhouette === false ? 'detail' : 'art';
    return pathElement(`${role}/shape-${String(index + 1).padStart(3, '0')}`, shape);
  });
  return [
    `  <g id="art" transform="translate(${origin.x} ${origin.y})">`,
    ...paths,
    '  </g>',
  ].join('\n');
}

function bodyReferenceGroup(id: BodyArchetypeId, facing: Facing, opacity: number): string {
  const archetype = BODY_ARCHETYPES.find(({ id: candidate }) => candidate === id)
    ?? fail(`unknown body reference ${id}`);
  const variant = archetype.part.facings[facing]
    ?? fail(`${id}/${facing} has no body reference geometry`);
  const origin = PART_AUTHORING_ORIGINS.outfit;
  const paths = variant.shapes.map((shape, index) =>
    pathElement(`reference/${id}/shape-${String(index + 1).padStart(3, '0')}`, shape, 'reference'));
  return [
    `  <g id="reference/${xml(id)}" opacity="${opacity}" transform="translate(${origin.x} ${origin.y})">`,
    ...paths,
    '  </g>',
  ].join('\n');
}

function activeBodyArt(part: PartDef, facing: Facing): string {
  const variant = part.facings[facing] ?? fail(`${part.id}/${facing} has no source geometry`);
  if (variant.shapes.length === 0) fail(`${part.id}/${facing} has no source shapes`);
  if (variant.shapes[0].silhouette === false) {
    fail(`${part.id}/${facing} does not begin with its silhouette`);
  }
  const origin = PART_AUTHORING_ORIGINS.body;
  const paths = variant.shapes.map((shape, index) => {
    const id = index === 0
      ? 'art/silhouette'
      : shape.silhouette === false
        ? index === 1 ? 'detail/lower-plane' : `detail/shape-${String(index + 1).padStart(3, '0')}`
        : `art/shape-${String(index + 1).padStart(3, '0')}`;
    return pathElement(id, shape);
  });
  return [
    `  <g id="art" transform="translate(${origin.x} ${origin.y})">`,
    ...paths,
    '  </g>',
  ].join('\n');
}

function canvasPoint(point: { x: number; y: number }): { x: number; y: number } {
  const origin = PART_AUTHORING_ORIGINS.outfit;
  return { x: origin.x + point.x, y: origin.y + point.y };
}

function pointMarker(id: string, point: { x: number; y: number }, radius = 3): string {
  const canvas = canvasPoint(point);
  return guidePath(
    id,
    `M ${canvas.x - radius} ${canvas.y} H ${canvas.x + radius} M ${canvas.x} ${canvas.y - radius} V ${canvas.y + radius}`,
    GUIDE_COLORS.anchor,
    1.1,
  );
}

function spanGuide(
  id: string,
  span: BodyFacingAnchors['waist'],
  opacity = 0.8,
): string {
  const left = canvasPoint(span.left);
  const right = canvasPoint(span.right);
  return guidePath(id, `M ${left.x} ${left.y} L ${right.x} ${right.y}`, GUIDE_COLORS.body, 0.9, opacity);
}

function outfitRigGuides(anchors: BodyFacingAnchors): string {
  const neck = canvasPoint(anchors.neck);
  const chest = canvasPoint(anchors.chest);
  const hemCenter = canvasPoint({
    x: (anchors.hem.left.x + anchors.hem.right.x) / 2,
    y: (anchors.hem.left.y + anchors.hem.right.y) / 2,
  });
  return [
    '  <g id="guide/body-rig">',
    guidePath('guide/body-rig/axis', `M ${neck.x} ${neck.y} L ${chest.x} ${chest.y} L ${hemCenter.x} ${hemCenter.y}`, GUIDE_COLORS.body, 0.8, 0.75),
    spanGuide('guide/body-rig/shoulders', anchors.shoulders, 0.65),
    spanGuide('guide/body-rig/waist', anchors.waist),
    spanGuide('guide/body-rig/hem', anchors.hem),
    '  </g>',
    '  <g id="anchors">',
    pointMarker('anchors/bodyOrigin', { x: 0, y: 0 }, 2.5),
    pointMarker('anchors/neck', anchors.neck),
    pointMarker('anchors/chest', anchors.chest),
    pointMarker('anchors/waist-left', anchors.waist.left, 2.5),
    pointMarker('anchors/waist-right', anchors.waist.right, 2.5),
    pointMarker('anchors/hem-left', anchors.hem.left, 2.5),
    pointMarker('anchors/hem-right', anchors.hem.right, 2.5),
    '  </g>',
  ].join('\n');
}

function bodyHeadRadiusGuide(anchors: BodyFacingAnchors): string {
  const headCenter = canvasPoint(anchors.headCenter);
  return [
    '  <g id="guide/head-radius">',
    guidePath(
      'guide/head-radius/path',
      circle(headCenter.x, headCenter.y, 21),
      GUIDE_COLORS.head,
      0.9,
      0.8,
    ),
    '  </g>',
  ].join('\n');
}

function bodyRigGuides(anchors: BodyFacingAnchors): string {
  const axis = [
    anchors.aboveHead,
    anchors.headCenter,
    anchors.neck,
    anchors.chest,
    anchors.hip,
    {
      x: (anchors.hem.left.x + anchors.hem.right.x) / 2,
      y: (anchors.hem.left.y + anchors.hem.right.y) / 2,
    },
  ].map(canvasPoint);
  const axisPath = axis
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  return [
    '  <g id="guide/body-rig">',
    guidePath('guide/body-rig/axis', axisPath, GUIDE_COLORS.body, 0.8, 0.75),
    spanGuide('guide/body-rig/shoulders', anchors.shoulders, 0.65),
    spanGuide('guide/body-rig/waist', anchors.waist),
    spanGuide('guide/body-rig/hem', anchors.hem),
    '  </g>',
    '  <g id="anchors">',
    pointMarker('anchors/bodyOrigin', { x: 0, y: 0 }, 2.5),
    pointMarker('anchors/headCenter', anchors.headCenter),
    pointMarker('anchors/aboveHead', anchors.aboveHead, 2.5),
    pointMarker('anchors/neck', anchors.neck),
    pointMarker('anchors/chest', anchors.chest),
    pointMarker('anchors/hip', anchors.hip),
    pointMarker('anchors/shoulders-left', anchors.shoulders.left, 2.5),
    pointMarker('anchors/shoulders-right', anchors.shoulders.right, 2.5),
    pointMarker('anchors/waist-left', anchors.waist.left, 2.5),
    pointMarker('anchors/waist-right', anchors.waist.right, 2.5),
    pointMarker('anchors/hem-left', anchors.hem.left, 2.5),
    pointMarker('anchors/hem-right', anchors.hem.right, 2.5),
    '  </g>',
  ].join('\n');
}

function activeOutfitArt(
  part: PartDef,
  bodyId: BodyArchetypeId,
  facing: Facing,
  anchors: BodyFacingAnchors,
): string {
  const variant = part.buildVariant?.(facing, { bodyAnchors: anchors, bodyId })
    ?? fail(`${part.id}/${bodyId}/${facing} has no body-aware source geometry`);
  if (variant.shapes.length === 0) fail(`${part.id}/${bodyId}/${facing} has no detail shapes`);
  if (variant.shapes.some((shape) => shape.silhouette !== false)) {
    fail(`${part.id}/${bodyId}/${facing} is not a fitted detail-only kit`);
  }
  const origin = PART_AUTHORING_ORIGINS.outfit;
  const paths = variant.shapes.map((shape, index) =>
    pathElement(`detail/neckline/shape-${String(index + 1).padStart(3, '0')}`, shape));
  return [
    `  <g id="art" transform="translate(${origin.x} ${origin.y})">`,
    ...paths,
    '  </g>',
  ].join('\n');
}

function swatchPaths(): string {
  return PART_SENTINEL_SWATCHES.map(({ token, color }, index) => {
    const x = 4;
    const y = 4 + index * 10;
    const d = `M ${x} ${y} H ${x + 8} V ${y + 8} H ${x} Z`;
    return `    <path id="swatches/${token}" d="${d}" fill="${color}" fill-rule="nonzero" stroke="#FFFFFF" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join('\n');
}

function scaffoldSvg(slot: 'head' | 'hair', referenceId: string, facing: Facing): string {
  const part = getPart(referenceId) ?? fail(`unknown reference ${referenceId}`);
  if (part.slot !== slot) fail(`${referenceId} is ${part.slot}, not ${slot}`);
  if (!PART_IMPORT_TARGETS.some((target) => target.id === referenceId)) {
    fail(`${referenceId} is not an allowed static import target`);
  }
  const contextHead = getPart('head-round') ?? fail('missing head-round context reference');
  const context = slot === 'hair'
    ? `${referenceGroup('context-head-round', contextHead, facing, 0.12)}\n`
    : '';

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">',
    `  <title>Terrarium ${referenceId} ${facing} authoring scaffold</title>`,
    '  <desc>The importer ignores guide, reference, anchor, and swatch groups. Edit art/detail paths; preserve unique ids, sentinel paint, and nonzero fill.</desc>',
    '  <path id="reference/canvas-background" d="M 0 0 H 128 V 128 H 0 Z" fill="#FFFEFA" fill-rule="nonzero"/>',
    '  <g id="guide/grid-minor">',
    guidePath('guide/grid-minor/path', gridPath(8), GUIDE_COLORS.minor, 0.35),
    '  </g>',
    '  <g id="guide/grid-major">',
    guidePath('guide/grid-major/path', gridPath(16), GUIDE_COLORS.major, 0.6),
    '  </g>',
    '  <g id="guide/canvas">',
    guidePath('guide/canvas/border', 'M 0.5 0.5 H 127.5 V 127.5 H 0.5 Z', GUIDE_COLORS.canvas, 1),
    guidePath('guide/canvas/outline-safe-area', 'M 4 4 H 124 V 124 H 4 Z', GUIDE_COLORS.safe, 0.8, 0.9),
    '  </g>',
    bodyGuide(facing),
    '  <g id="guide/head-radius">',
    guidePath('guide/head-radius/path', circle(64, 44, 21), GUIDE_COLORS.head, 0.9, 0.8),
    '  </g>',
    context.trimEnd(),
    referenceGroup(referenceId, part, facing, 0.22),
    activeArt(part, facing),
    '  <g id="swatches">',
    swatchPaths(),
    '  </g>',
    '  <g id="anchors">',
    guidePath('anchors/headCenter', 'M 58 44 H 70 M 64 38 V 50', GUIDE_COLORS.anchor, 1.2),
    '  </g>',
    '</svg>',
    '',
  ].filter((line) => line !== '').join('\n') + '\n';
}

function bodyScaffoldSvg(referenceId: BodyArchetypeId, facing: Facing): string {
  const archetype = BODY_ARCHETYPES.find(({ id }) => id === referenceId)
    ?? fail(`unknown body reference ${referenceId}`);
  const part = getPart(referenceId) ?? fail(`unknown reference ${referenceId}`);
  if (part.slot !== 'body') fail(`${referenceId} is ${part.slot}, not body`);
  const target = PART_IMPORT_TARGETS.find(({ id }) => id === referenceId);
  if (!target || target.slot !== 'body') {
    fail(`${referenceId} is not an allowed body import target`);
  }
  if (target.facings[facing] === undefined) {
    fail(`${referenceId}/${facing} is not an authored target facing`);
  }
  const anchors = archetype.anchors[facing];

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">',
    `  <title>Terrarium ${referenceId} ${facing} authoring scaffold</title>`,
    '  <desc>The importer ignores guide, reference, anchor, and swatch groups. Rig guides are generated from TypeScript-owned anchors; edit art/detail paths only.</desc>',
    '  <path id="reference/canvas-background" d="M 0 0 H 128 V 128 H 0 Z" fill="#FFFEFA" fill-rule="nonzero"/>',
    '  <g id="guide/grid-minor">',
    guidePath('guide/grid-minor/path', gridPath(8), GUIDE_COLORS.minor, 0.35),
    '  </g>',
    '  <g id="guide/grid-major">',
    guidePath('guide/grid-major/path', gridPath(16), GUIDE_COLORS.major, 0.6),
    '  </g>',
    '  <g id="guide/canvas">',
    guidePath('guide/canvas/border', 'M 0.5 0.5 H 127.5 V 127.5 H 0.5 Z', GUIDE_COLORS.canvas, 1),
    guidePath('guide/canvas/outline-safe-area', 'M 4 4 H 124 V 124 H 4 Z', GUIDE_COLORS.safe, 0.8, 0.9),
    '  </g>',
    bodyReferenceGroup(referenceId, facing, 0.22),
    activeBodyArt(part, facing),
    bodyHeadRadiusGuide(anchors),
    bodyRigGuides(anchors),
    '  <g id="swatches">',
    swatchPaths(),
    '  </g>',
    '</svg>',
    '',
  ].join('\n');
}

function outfitScaffoldSvg(
  referenceId: string,
  referenceBodyId: BodyArchetypeId,
  facing: Facing,
): string {
  const part = getPart(referenceId) ?? fail(`unknown reference ${referenceId}`);
  if (part.slot !== 'outfit') fail(`${referenceId} is ${part.slot}, not outfit`);
  const target = PART_IMPORT_TARGETS.find(({ id }) => id === referenceId);
  if (!target || target.slot !== 'outfit' || target.importMode !== 'anchored-detail') {
    fail(`${referenceId} is not an allowed anchored-detail import target`);
  }
  if (target.referenceBodyId !== referenceBodyId) {
    fail(`${referenceId} scaffold body ${referenceBodyId} does not match target body ${target.referenceBodyId ?? 'none'}`);
  }
  if (target.facings[facing] === undefined) {
    fail(`${referenceId}/${facing} is not an authored target facing`);
  }
  const archetype = BODY_ARCHETYPES.find(({ id }) => id === referenceBodyId)
    ?? fail(`unknown body reference ${referenceBodyId}`);
  const anchors = archetype.anchors[facing];

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">',
    `  <title>Terrarium ${referenceId} ${facing} authoring scaffold on ${referenceBodyId}</title>`,
    '  <desc>The importer ignores guide, reference, anchor, and swatch groups. Edit detail paths; preserve unique ids, sentinel paint, and nonzero fill.</desc>',
    '  <path id="reference/canvas-background" d="M 0 0 H 128 V 128 H 0 Z" fill="#FFFEFA" fill-rule="nonzero"/>',
    '  <g id="guide/grid-minor">',
    guidePath('guide/grid-minor/path', gridPath(8), GUIDE_COLORS.minor, 0.35),
    '  </g>',
    '  <g id="guide/grid-major">',
    guidePath('guide/grid-major/path', gridPath(16), GUIDE_COLORS.major, 0.6),
    '  </g>',
    '  <g id="guide/canvas">',
    guidePath('guide/canvas/border', 'M 0.5 0.5 H 127.5 V 127.5 H 0.5 Z', GUIDE_COLORS.canvas, 1),
    guidePath('guide/canvas/outline-safe-area', 'M 4 4 H 124 V 124 H 4 Z', GUIDE_COLORS.safe, 0.8, 0.9),
    '  </g>',
    bodyReferenceGroup(referenceBodyId, facing, 0.22),
    outfitRigGuides(anchors),
    activeOutfitArt(part, referenceBodyId, facing, anchors),
    '  <g id="swatches">',
    swatchPaths(),
    '  </g>',
    '</svg>',
    '',
  ].join('\n');
}

function utf16BeNullTerminated(value: string): Buffer {
  const buffer = Buffer.alloc((value.length + 1) * 2);
  for (let index = 0; index < value.length; index++) {
    buffer.writeUInt16BE(value.charCodeAt(index), index * 2);
  }
  return buffer;
}

function rgbChannels(hex: string): readonly [number, number, number] {
  if (!/^#[0-9A-F]{6}$/.test(hex)) fail(`ASE color must be #RRGGBB, received ${hex}`);
  return [
    Number.parseInt(hex.slice(1, 3), 16) / 255,
    Number.parseInt(hex.slice(3, 5), 16) / 255,
    Number.parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

/** Encode the de-facto Adobe Swatch Exchange 1.0 solid-RGB layout. */
export function encodePartSentinelAse(): Buffer {
  const blocks = PART_SENTINEL_SWATCHES.map(({ token, color }) => {
    const name = utf16BeNullTerminated(`$${token}`);
    const payload = Buffer.alloc(2 + name.length + 4 + 12 + 2);
    let offset = 0;
    payload.writeUInt16BE(token.length + 2, offset); // '$token' code units plus NUL
    offset += 2;
    name.copy(payload, offset);
    offset += name.length;
    payload.write('RGB ', offset, 4, 'ascii');
    offset += 4;
    for (const channel of rgbChannels(color)) {
      payload.writeFloatBE(channel, offset);
      offset += 4;
    }
    payload.writeUInt16BE(2, offset); // normal/process swatch

    const block = Buffer.alloc(6 + payload.length);
    block.writeUInt16BE(0x0001, 0);
    block.writeUInt32BE(payload.length, 2);
    payload.copy(block, 6);
    return block;
  });
  const header = Buffer.alloc(12);
  header.write('ASEF', 0, 4, 'ascii');
  header.writeUInt16BE(1, 4);
  header.writeUInt16BE(0, 6);
  header.writeUInt32BE(blocks.length, 8);
  return Buffer.concat([header, ...blocks]);
}

export function partSentinelGpl(): string {
  const rows = PART_SENTINEL_SWATCHES.map(({ token, color }) => {
    const [red, green, blue] = rgbChannels(color).map((channel) => Math.round(channel * 255));
    return `${String(red).padStart(3)} ${String(green).padStart(3)} ${String(blue).padStart(3)}  $${token}`;
  });
  return ['GIMP Palette', 'Name: Terrarium character part sentinels', 'Columns: 5', '#', ...rows, ''].join('\n');
}

export function partSentinelPreviewSvg(): string {
  const width = 760;
  const height = 188;
  const cells = PART_SENTINEL_SWATCHES.map(({ token, color }, index) => {
    const x = 24 + index * 144;
    return [
      `<g transform="translate(${x} 58)">`,
      `<rect width="120" height="72" rx="8" fill="${color}" stroke="#2F3538" stroke-width="2"/>`,
      `<text x="0" y="94" font-family="system-ui, sans-serif" font-size="15" font-weight="700" fill="#2F3538">$${token}</text>`,
      `<text x="0" y="114" font-family="ui-monospace, monospace" font-size="12" fill="#66747A">${color}</text>`,
      '</g>',
    ].join('');
  }).join('');
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
    `<rect width="${width}" height="${height}" fill="#F4F1E9"/>`,
    '<text x="24" y="30" font-family="system-ui, sans-serif" font-size="20" font-weight="700" fill="#2F3538">Terrarium character-part sentinel palette</text>',
    '<text x="24" y="48" font-family="system-ui, sans-serif" font-size="11" fill="#66747A">Authoring markers only — the compositor replaces these with recipe palette colors.</text>',
    cells,
    '</svg>',
    '',
  ].join('\n');
}

export function generatePartAuthoringAssets(): GeneratedPartAuthoringAsset[] {
  const assets: GeneratedPartAuthoringAsset[] = [];
  for (const spec of PART_SCAFFOLD_SPECS) {
    for (const facing of spec.facings) {
      const source = spec.slot === 'outfit'
        ? outfitScaffoldSvg(
          spec.referenceId,
          spec.referenceBodyId ?? fail(`${spec.referenceId} has no reference body`),
          facing,
        )
        : spec.slot === 'body'
          ? bodyScaffoldSvg(spec.referenceId, facing)
          : scaffoldSvg(spec.slot, spec.referenceId, facing);
      assets.push({
        path: `${PART_AUTHORING_SCAFFOLD_DIR}/${spec.slot}/${spec.slug}.${facing}.svg`,
        bytes: Buffer.from(source, 'utf8'),
      });
    }
  }
  assets.push(
    {
      path: `${PART_AUTHORING_PALETTE_DIR}/terrarium-part-sentinels.ase`,
      bytes: encodePartSentinelAse(),
    },
    {
      path: `${PART_AUTHORING_PALETTE_DIR}/terrarium-part-sentinels.gpl`,
      bytes: Buffer.from(partSentinelGpl(), 'utf8'),
    },
    {
      path: `${PART_AUTHORING_PALETTE_DIR}/terrarium-part-sentinels.svg`,
      bytes: Buffer.from(partSentinelPreviewSvg(), 'utf8'),
    },
  );
  return assets.sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
}

export function scaffoldSlotForPath(assetPath: string): Slot | undefined {
  const match = /\/scaffolds\/(body|head|hair|outfit)\//.exec(assetPath);
  return match?.[1] as Slot | undefined;
}
