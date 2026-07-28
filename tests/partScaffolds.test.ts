import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { afterEach, describe, expect, it } from 'vitest';

import {
  checkPartAuthoringAssets,
  partAuthoringAssetMismatches,
  writePartAuthoringAssets,
} from '../scripts/generatePartScaffolds';
import { PART_IMPORT_TARGETS } from '../scripts/parts/catalog';
import { PART_AUTHORING_ORIGINS, compilePartDirectory, compilePartSvg } from '../scripts/parts/importer';
import {
  encodePartSentinelAse,
  generatePartAuthoringAssets,
  PART_AUTHORING_OWNED_DIRS,
  PART_SCAFFOLD_SPECS,
  partSentinelGpl,
  scaffoldSlotForPath,
} from '../scripts/parts/scaffolds';
import { PART_SENTINEL_SWATCHES } from '../scripts/parts/sentinels';
import type { Facing, ShapeSpec } from '../src/core/types';
import { FACINGS } from '../src/core/types';
import { BODY_ARCHETYPES } from '../src/parts/bodyArchetypes';
import { getPart } from '../src/parts/library';

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

interface DecodedAseSwatch {
  name: string;
  model: string;
  channels: [number, number, number];
  type: number;
}

function decodeAse(buffer: Buffer): DecodedAseSwatch[] {
  expect(buffer.subarray(0, 4).toString('ascii')).toBe('ASEF');
  expect(buffer.readUInt16BE(4)).toBe(1);
  expect(buffer.readUInt16BE(6)).toBe(0);
  const blockCount = buffer.readUInt32BE(8);
  const swatches: DecodedAseSwatch[] = [];
  let offset = 12;

  for (let blockIndex = 0; blockIndex < blockCount; blockIndex++) {
    expect(buffer.readUInt16BE(offset)).toBe(0x0001);
    const payloadLength = buffer.readUInt32BE(offset + 2);
    offset += 6;
    const payloadEnd = offset + payloadLength;
    const codeUnits = buffer.readUInt16BE(offset);
    offset += 2;
    let name = '';
    for (let index = 0; index < codeUnits - 1; index++) {
      name += String.fromCharCode(buffer.readUInt16BE(offset));
      offset += 2;
    }
    expect(buffer.readUInt16BE(offset)).toBe(0);
    offset += 2;
    const model = buffer.subarray(offset, offset + 4).toString('ascii');
    offset += 4;
    const channels: [number, number, number] = [
      buffer.readFloatBE(offset),
      buffer.readFloatBE(offset + 4),
      buffer.readFloatBE(offset + 8),
    ];
    offset += 12;
    const type = buffer.readUInt16BE(offset);
    offset += 2;
    expect(offset).toBe(payloadEnd);
    swatches.push({ name, model, channels, type });
  }
  expect(offset).toBe(buffer.length);
  return swatches;
}

function authoringPaint(value: string | undefined): string | undefined {
  if (!value?.startsWith('$')) return value;
  return PART_SENTINEL_SWATCHES.find(({ token }) => `$${token}` === value)?.color;
}

function renderShapes(
  shapes: readonly ShapeSpec[],
  outlined = false,
  origin: { x: number; y: number } = PART_AUTHORING_ORIGINS.head,
): Buffer {
  const colorMarkup = shapes.map((shape) => {
    const attributes = [
      `d="${shape.d}"`,
      `fill="${authoringPaint(shape.fill) ?? 'none'}"`,
    ];
    const stroke = authoringPaint(shape.stroke);
    if (stroke) {
      attributes.push(`stroke="${stroke}"`);
      attributes.push(`stroke-width="${shape.strokeWidth ?? 1.5}"`);
      attributes.push('stroke-linecap="round" stroke-linejoin="round"');
    }
    if (shape.opacity !== undefined) attributes.push(`opacity="${shape.opacity}"`);
    return `<path ${attributes.join(' ')}/>`;
  }).join('');
  const outlineMarkup = outlined
    ? shapes.filter((shape) => shape.silhouette !== false).map((shape) => {
      const width = shape.fill ? 5 : (shape.strokeWidth ?? 1.5) + 5;
      return `<path d="${shape.d}" fill="${shape.fill ? '#3A342E' : 'none'}" stroke="#3A342E" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }).join('')
    : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128"><g transform="translate(${origin.x} ${origin.y})">${outlineMarkup}${colorMarkup}</g></svg>`;
  return new Resvg(svg, { font: { loadSystemFonts: false } }).render().pixels;
}

function shapeSemantics(shape: ShapeSpec): Omit<ShapeSpec, 'd'> {
  const { d: _d, ...semantics } = shape;
  return semantics;
}

type ScaffoldSlot = 'body' | 'head' | 'hair' | 'outfit';

function scaffoldIdentity(assetPath: string): {
  slot: ScaffoldSlot;
  partId: string;
  facing: Facing;
  componentId?: string;
} {
  const match = /\/scaffolds\/(body|head|hair|outfit)\/([a-z-]+)(?:\.([a-z-]+))?\.(south|east|north)\.svg$/.exec(assetPath);
  if (!match) throw new Error(`Not a scaffold path: ${assetPath}`);
  return {
    slot: match[1] as ScaffoldSlot,
    partId: `${match[1]}-${match[2]}`,
    ...(match[3] ? { componentId: match[3] } : {}),
    facing: match[4] as Facing,
  };
}

function seededShapes(
  slot: ScaffoldSlot,
  partId: string,
  facing: Facing,
  componentId?: string,
): readonly ShapeSpec[] | undefined {
  const part = getPart(partId);
  if (slot !== 'outfit') return part?.facings[facing]?.shapes;
  const balanced = BODY_ARCHETYPES.find(({ id }) => id === 'body-balanced');
  const shapes = balanced && part?.buildVariant?.(facing, {
    bodyAnchors: balanced.anchors[facing],
    bodyId: balanced.id,
  })?.shapes;
  if (!shapes || !componentId) return shapes;
  const target = PART_IMPORT_TARGETS.find(({ id }) => id === partId);
  const components = target?.components ?? [];
  const componentIndex = components.findIndex(({ id }) => id === componentId);
  if (componentIndex < 0) return undefined;
  const count = components[componentIndex].facings[facing]?.shapeCount;
  if (count === undefined) return undefined;
  const offset = components
    .slice(0, componentIndex)
    .reduce((total, component) => total + (component.facings[facing]?.shapeCount ?? 0), 0);
  return shapes.slice(offset, offset + count);
}

describe('part authoring scaffold generation', () => {
  it('generates the exact deterministic body, head, hair, outfit, and palette file set', () => {
    const first = generatePartAuthoringAssets();
    const second = generatePartAuthoringAssets();
    expect(first.map(({ path: assetPath }) => assetPath)).toEqual([
      'assets/part-authoring/palettes/terrarium-part-sentinels.ase',
      'assets/part-authoring/palettes/terrarium-part-sentinels.gpl',
      'assets/part-authoring/palettes/terrarium-part-sentinels.svg',
      'assets/part-authoring/scaffolds/body/balanced.east.svg',
      'assets/part-authoring/scaffolds/body/balanced.north.svg',
      'assets/part-authoring/scaffolds/body/balanced.south.svg',
      'assets/part-authoring/scaffolds/body/compact.east.svg',
      'assets/part-authoring/scaffolds/body/compact.north.svg',
      'assets/part-authoring/scaffolds/body/compact.south.svg',
      'assets/part-authoring/scaffolds/body/large-frame.east.svg',
      'assets/part-authoring/scaffolds/body/large-frame.north.svg',
      'assets/part-authoring/scaffolds/body/large-frame.south.svg',
      'assets/part-authoring/scaffolds/body/pinch.east.svg',
      'assets/part-authoring/scaffolds/body/pinch.north.svg',
      'assets/part-authoring/scaffolds/body/pinch.south.svg',
      'assets/part-authoring/scaffolds/body/soft.east.svg',
      'assets/part-authoring/scaffolds/body/soft.north.svg',
      'assets/part-authoring/scaffolds/body/soft.south.svg',
      'assets/part-authoring/scaffolds/body/tall.east.svg',
      'assets/part-authoring/scaffolds/body/tall.north.svg',
      'assets/part-authoring/scaffolds/body/tall.south.svg',
      'assets/part-authoring/scaffolds/hair/balding.east.svg',
      'assets/part-authoring/scaffolds/hair/balding.north.svg',
      'assets/part-authoring/scaffolds/hair/balding.south.svg',
      'assets/part-authoring/scaffolds/hair/bob.east.svg',
      'assets/part-authoring/scaffolds/hair/bob.north.svg',
      'assets/part-authoring/scaffolds/hair/bob.south.svg',
      'assets/part-authoring/scaffolds/hair/bun.east.svg',
      'assets/part-authoring/scaffolds/hair/bun.north.svg',
      'assets/part-authoring/scaffolds/hair/bun.south.svg',
      'assets/part-authoring/scaffolds/hair/coils.east.svg',
      'assets/part-authoring/scaffolds/hair/coils.north.svg',
      'assets/part-authoring/scaffolds/hair/coils.south.svg',
      'assets/part-authoring/scaffolds/hair/curly.east.svg',
      'assets/part-authoring/scaffolds/hair/curly.north.svg',
      'assets/part-authoring/scaffolds/hair/curly.south.svg',
      'assets/part-authoring/scaffolds/hair/long-straight.east.svg',
      'assets/part-authoring/scaffolds/hair/long-straight.north.svg',
      'assets/part-authoring/scaffolds/hair/long-straight.south.svg',
      'assets/part-authoring/scaffolds/hair/pixie.east.svg',
      'assets/part-authoring/scaffolds/hair/pixie.north.svg',
      'assets/part-authoring/scaffolds/hair/pixie.south.svg',
      'assets/part-authoring/scaffolds/hair/ponytail.east.svg',
      'assets/part-authoring/scaffolds/hair/ponytail.north.svg',
      'assets/part-authoring/scaffolds/hair/ponytail.south.svg',
      'assets/part-authoring/scaffolds/hair/short.east.svg',
      'assets/part-authoring/scaffolds/hair/short.north.svg',
      'assets/part-authoring/scaffolds/hair/short.south.svg',
      'assets/part-authoring/scaffolds/hair/side-part.east.svg',
      'assets/part-authoring/scaffolds/hair/side-part.north.svg',
      'assets/part-authoring/scaffolds/hair/side-part.south.svg',
      'assets/part-authoring/scaffolds/head/angular.east.svg',
      'assets/part-authoring/scaffolds/head/angular.north.svg',
      'assets/part-authoring/scaffolds/head/angular.south.svg',
      'assets/part-authoring/scaffolds/head/boxy.east.svg',
      'assets/part-authoring/scaffolds/head/boxy.north.svg',
      'assets/part-authoring/scaffolds/head/boxy.south.svg',
      'assets/part-authoring/scaffolds/head/fab.east.svg',
      'assets/part-authoring/scaffolds/head/fab.north.svg',
      'assets/part-authoring/scaffolds/head/fab.south.svg',
      'assets/part-authoring/scaffolds/head/long.east.svg',
      'assets/part-authoring/scaffolds/head/long.north.svg',
      'assets/part-authoring/scaffolds/head/long.south.svg',
      'assets/part-authoring/scaffolds/head/oval.east.svg',
      'assets/part-authoring/scaffolds/head/oval.north.svg',
      'assets/part-authoring/scaffolds/head/oval.south.svg',
      'assets/part-authoring/scaffolds/head/round.east.svg',
      'assets/part-authoring/scaffolds/head/round.north.svg',
      'assets/part-authoring/scaffolds/head/round.south.svg',
      'assets/part-authoring/scaffolds/head/soft-square.east.svg',
      'assets/part-authoring/scaffolds/head/soft-square.north.svg',
      'assets/part-authoring/scaffolds/head/soft-square.south.svg',
      'assets/part-authoring/scaffolds/outfit/blazer.buttons.east.svg',
      'assets/part-authoring/scaffolds/outfit/blazer.buttons.south.svg',
      'assets/part-authoring/scaffolds/outfit/blazer.lapels.east.svg',
      'assets/part-authoring/scaffolds/outfit/blazer.lapels.south.svg',
      'assets/part-authoring/scaffolds/outfit/blazer.pocket.east.svg',
      'assets/part-authoring/scaffolds/outfit/blazer.pocket.south.svg',
      'assets/part-authoring/scaffolds/outfit/cardigan.button-line.east.svg',
      'assets/part-authoring/scaffolds/outfit/cardigan.button-line.south.svg',
      'assets/part-authoring/scaffolds/outfit/cardigan.trim.east.svg',
      'assets/part-authoring/scaffolds/outfit/cardigan.trim.south.svg',
      'assets/part-authoring/scaffolds/outfit/polo.collar.east.svg',
      'assets/part-authoring/scaffolds/outfit/polo.collar.south.svg',
      'assets/part-authoring/scaffolds/outfit/polo.placket.east.svg',
      'assets/part-authoring/scaffolds/outfit/polo.placket.south.svg',
      'assets/part-authoring/scaffolds/outfit/shirt-tie.collar.east.svg',
      'assets/part-authoring/scaffolds/outfit/shirt-tie.collar.south.svg',
      'assets/part-authoring/scaffolds/outfit/shirt-tie.tie.east.svg',
      'assets/part-authoring/scaffolds/outfit/shirt-tie.tie.south.svg',
      'assets/part-authoring/scaffolds/outfit/suit-jacket.buttons.east.svg',
      'assets/part-authoring/scaffolds/outfit/suit-jacket.buttons.south.svg',
      'assets/part-authoring/scaffolds/outfit/suit-jacket.lapels.east.svg',
      'assets/part-authoring/scaffolds/outfit/suit-jacket.lapels.south.svg',
      'assets/part-authoring/scaffolds/outfit/suit-jacket.notches.east.svg',
      'assets/part-authoring/scaffolds/outfit/suit-jacket.notches.south.svg',
      'assets/part-authoring/scaffolds/outfit/suit-jacket.pocket-square.east.svg',
      'assets/part-authoring/scaffolds/outfit/suit-jacket.pocket-square.south.svg',
      'assets/part-authoring/scaffolds/outfit/suit-jacket.pocket.east.svg',
      'assets/part-authoring/scaffolds/outfit/suit-jacket.pocket.south.svg',
      'assets/part-authoring/scaffolds/outfit/suit-jacket.tie.east.svg',
      'assets/part-authoring/scaffolds/outfit/suit-jacket.tie.south.svg',
      'assets/part-authoring/scaffolds/outfit/tee.east.svg',
      'assets/part-authoring/scaffolds/outfit/tee.south.svg',
      'assets/part-authoring/scaffolds/outfit/turtleneck.neck-band.east.svg',
      'assets/part-authoring/scaffolds/outfit/turtleneck.neck-band.north.svg',
      'assets/part-authoring/scaffolds/outfit/turtleneck.neck-band.south.svg',
    ]);
    expect(first).toHaveLength(107);
    expect(first.map(({ bytes }) => bytes)).toEqual(second.map(({ bytes }) => bytes));
    expect(PART_SCAFFOLD_SPECS.map(({ slot, referenceId }) => [slot, referenceId])).toEqual([
      ['body', 'body-compact'],
      ['body', 'body-balanced'],
      ['body', 'body-large-frame'],
      ['body', 'body-tall'],
      ['body', 'body-soft'],
      ['body', 'body-pinch'],
      ['head', 'head-round'],
      ['head', 'head-oval'],
      ['head', 'head-boxy'],
      ['head', 'head-long'],
      ['head', 'head-angular'],
      ['head', 'head-soft-square'],
      ['head', 'head-fab'],
      ['hair', 'hair-short'],
      ['hair', 'hair-bob'],
      ['hair', 'hair-curly'],
      ['hair', 'hair-ponytail'],
      ['hair', 'hair-long-straight'],
      ['hair', 'hair-coils'],
      ['hair', 'hair-bun'],
      ['hair', 'hair-balding'],
      ['hair', 'hair-pixie'],
      ['hair', 'hair-side-part'],
      ['outfit', 'outfit-tee'],
      ['outfit', 'outfit-blazer'],
      ['outfit', 'outfit-blazer'],
      ['outfit', 'outfit-blazer'],
      ['outfit', 'outfit-polo'],
      ['outfit', 'outfit-polo'],
      ['outfit', 'outfit-shirt-tie'],
      ['outfit', 'outfit-shirt-tie'],
      ['outfit', 'outfit-turtleneck'],
      ['outfit', 'outfit-cardigan'],
      ['outfit', 'outfit-cardigan'],
      ['outfit', 'outfit-suit-jacket'],
      ['outfit', 'outfit-suit-jacket'],
      ['outfit', 'outfit-suit-jacket'],
      ['outfit', 'outfit-suit-jacket'],
      ['outfit', 'outfit-suit-jacket'],
      ['outfit', 'outfit-suit-jacket'],
    ]);
  });

  it('makes every seeded scaffold importable while excluding all reference and guide art', () => {
    for (const asset of generatePartAuthoringAssets().filter(({ path: assetPath }) => assetPath.includes('/scaffolds/'))) {
      const slot = scaffoldSlotForPath(asset.path);
      expect(slot).toBeTruthy();
      const source = asset.bytes.toString('utf8');
      expect(source).toContain('viewBox="0 0 128 128"');
      expect(source).toContain('id="guide/canvas"');
      expect(source).toContain('id="reference/canvas-background"');
      expect(source).toContain('id="swatches"');
      expect(source).toContain('id="art"');
      expect(source).not.toMatch(/<(?:rect|circle|ellipse|line|polyline|polygon|text)\b/);

      const { slot: scaffoldSlot, partId, facing, componentId } = scaffoldIdentity(asset.path);
      if (scaffoldSlot === 'body') {
        expect(source).toContain(`id="reference/${partId}"`);
        expect(source).toContain('id="guide/head-radius"');
        expect(source).toContain('id="guide/body-rig"');
        expect(source).toContain('id="anchors/headCenter"');
      } else if (scaffoldSlot === 'outfit') {
        expect(source).toContain('id="guide/body-rig"');
        expect(source).toContain('id="reference/body-balanced"');
        expect(source).toContain('id="anchors/neck"');
      } else {
        expect(source).toContain('id="guide/head-radius"');
        expect(source).toContain('id="guide/body-capsule"');
        expect(source).toContain('id="anchors/headCenter"');
      }

      const sourceShapes = seededShapes(scaffoldSlot, partId, facing, componentId);
      expect(sourceShapes, `${asset.path} source part missing`).toBeTruthy();
      const target = PART_IMPORT_TARGETS.find(({ id }) => id === partId);
      const preserveLocalPaths = target?.importMode === 'body-art' || target?.preserveLocalPaths === true;
      const compiled = compilePartSvg(source, {
        source: asset.path,
        slot: slot as ScaffoldSlot,
        preserveLocalPaths,
      });
      expect(compiled.map(shapeSemantics), asset.path).toEqual(sourceShapes!.map(shapeSemantics));
      if (preserveLocalPaths) expect(compiled, `${asset.path} exact local paths`).toEqual(sourceShapes);

      for (const outlined of [false, true]) {
        const origin = PART_AUTHORING_ORIGINS[scaffoldSlot];
        const sourcePixels = renderShapes(sourceShapes!, outlined, origin);
        const compiledPixels = renderShapes(compiled, outlined, origin);
        let changedChannels = 0;
        let maximumDelta = 0;
        for (let index = 0; index < sourcePixels.length; index++) {
          const delta = Math.abs(sourcePixels[index] - compiledPixels[index]);
          if (delta > 0) changedChannels++;
          maximumDelta = Math.max(maximumDelta, delta);
        }
        expect(changedChannels, `${asset.path} visual drift (outline=${outlined})`).toBeLessThanOrEqual(64);
        expect(maximumDelta, `${asset.path} visual drift (outline=${outlined})`).toBeLessThanOrEqual(20);
      }
    }
  });

  it('emits eighteen body starters with the exact eleven typed rig-anchor guides', () => {
    const bodyAssets = generatePartAuthoringAssets()
      .filter(({ path: assetPath }) => assetPath.includes('/scaffolds/body/'));
    expect(bodyAssets).toHaveLength(18);

    const typedRigAnchorIds = [
      'headCenter',
      'aboveHead',
      'neck',
      'chest',
      'hip',
      'shoulders-left',
      'shoulders-right',
      'waist-left',
      'waist-right',
      'hem-left',
      'hem-right',
    ];

    for (const asset of bodyAssets) {
      const source = asset.bytes.toString('utf8');
      const anchorIds = [...source.matchAll(/id="anchors\/([^"]+)"/g)]
        .map((match) => match[1]);
      expect(anchorIds, asset.path).toEqual(['bodyOrigin', ...typedRigAnchorIds]);
      expect(source, asset.path).toContain('id="art" transform="translate(64 87)"');
      expect(source, asset.path).toContain('id="art/silhouette"');
      expect(source, asset.path).toContain('id="guide/body-rig/axis"');
      expect(source, asset.path).toContain('id="guide/body-rig/shoulders"');
      expect(source, asset.path).toContain('id="guide/body-rig/waist"');
      expect(source, asset.path).toContain('id="guide/body-rig/hem"');
      if (asset.path.includes('.north.')) {
        expect(source, asset.path).not.toContain('id="detail/lower-plane"');
      } else {
        expect(source, asset.path).toContain('id="detail/lower-plane"');
      }
    }
  });

  it('keeps the promoted round and refitted bob scaffold bytes frozen', () => {
    const hashes = Object.fromEntries(
      generatePartAuthoringAssets()
        .filter(({ path: assetPath }) =>
          /\/scaffolds\/(?:hair\/bob|head\/round)\./.test(assetPath))
        .map(({ path: assetPath, bytes }) => [assetPath, createHash('sha256').update(bytes).digest('hex')]),
    );
    expect(hashes).toEqual({
      'assets/part-authoring/scaffolds/hair/bob.east.svg': '31e39d5f4be35772a856b0e4af9a3c4f29e6eebdc0dba2406c02d4228566e30e',
      'assets/part-authoring/scaffolds/hair/bob.north.svg': '74b3f63f6cec05fb8ce6e98d43da90d2e5ed41d9430572cd8a798c77eaf6317e',
      'assets/part-authoring/scaffolds/hair/bob.south.svg': 'aa3d3ca0527255a73c15cd4b45e8223118df54ec80580569a4ab5debd919d164',
      'assets/part-authoring/scaffolds/head/round.east.svg': '91f42ff68f06777aa4c672b24eb6df3bff523c2d6bad8a3c3223db014eaf08a5',
      'assets/part-authoring/scaffolds/head/round.north.svg': 'bb91d6d3b35dff35612a92ebd74cbfbdf729cf82f5acb180bd958c8011c1f1bd',
      'assets/part-authoring/scaffolds/head/round.south.svg': '5899b518faa6b65e7df06d443931e63c208ff3225ec1854498eb7ae546fd8b10',
    });
  });

  it('seeds all componentized outfits against body-balanced with the complete outfit rig guide', () => {
    const teeAssets = generatePartAuthoringAssets()
      .filter(({ path: assetPath }) => assetPath.includes('/scaffolds/outfit/tee.'));
    expect(teeAssets.map(({ path: assetPath }) => assetPath)).toEqual([
      'assets/part-authoring/scaffolds/outfit/tee.east.svg',
      'assets/part-authoring/scaffolds/outfit/tee.south.svg',
    ]);
    for (const { bytes } of teeAssets) {
      const source = bytes.toString('utf8');
      expect(source).toContain('on body-balanced</title>');
      expect(source).toContain('id="reference/body-balanced"');
      expect(source).toContain('id="guide/body-rig/axis"');
      expect(source).toContain('id="guide/body-rig/waist"');
      expect(source).toContain('id="guide/body-rig/hem"');
      expect(source).toContain('id="anchors/neck"');
      expect(source).toContain('id="anchors/chest"');
      expect(source).toContain('id="anchors/waist-left"');
      expect(source).toContain('id="anchors/waist-right"');
      expect(source).toContain('id="anchors/hem-left"');
      expect(source).toContain('id="anchors/hem-right"');
      expect(source).toContain('id="detail/neckline/shape-001"');
      expect(source).toContain('id="art" transform="translate(64 87)"');
    }

    const blazerAssets = generatePartAuthoringAssets()
      .filter(({ path: assetPath }) => assetPath.includes('/scaffolds/outfit/blazer.'));
    expect(blazerAssets.map(({ path: assetPath }) => assetPath)).toEqual([
      'assets/part-authoring/scaffolds/outfit/blazer.buttons.east.svg',
      'assets/part-authoring/scaffolds/outfit/blazer.buttons.south.svg',
      'assets/part-authoring/scaffolds/outfit/blazer.lapels.east.svg',
      'assets/part-authoring/scaffolds/outfit/blazer.lapels.south.svg',
      'assets/part-authoring/scaffolds/outfit/blazer.pocket.east.svg',
      'assets/part-authoring/scaffolds/outfit/blazer.pocket.south.svg',
    ]);
    for (const component of ['buttons', 'lapels', 'pocket']) {
      const componentAssets = blazerAssets.filter(({ path: assetPath }) =>
        assetPath.includes(`blazer.${component}.`));
      expect(componentAssets).toHaveLength(2);
      for (const { bytes } of componentAssets) {
        const source = bytes.toString('utf8');
        expect(source).toContain(`outfit-blazer ${component}`);
        expect(source).toContain(`id="detail/${component}/shape-001"`);
        expect(source).toContain('id="reference/body-balanced"');
        expect(source).toContain('id="guide/body-rig/axis"');
      }
    }

    const poloAssets = generatePartAuthoringAssets()
      .filter(({ path: assetPath }) => assetPath.includes('/scaffolds/outfit/polo.'));
    expect(poloAssets.map(({ path: assetPath }) => assetPath)).toEqual([
      'assets/part-authoring/scaffolds/outfit/polo.collar.east.svg',
      'assets/part-authoring/scaffolds/outfit/polo.collar.south.svg',
      'assets/part-authoring/scaffolds/outfit/polo.placket.east.svg',
      'assets/part-authoring/scaffolds/outfit/polo.placket.south.svg',
    ]);
    for (const component of ['collar', 'placket']) {
      const componentAssets = poloAssets.filter(({ path: assetPath }) =>
        assetPath.includes(`polo.${component}.`));
      expect(componentAssets).toHaveLength(2);
      for (const { bytes } of componentAssets) {
        const source = bytes.toString('utf8');
        expect(source).toContain(`outfit-polo ${component}`);
        expect(source).toContain(`id="detail/${component}/shape-001"`);
        expect(source).toContain('id="reference/body-balanced"');
        expect(source).toContain('id="guide/body-rig/axis"');
      }
    }

    const shirtTieAssets = generatePartAuthoringAssets()
      .filter(({ path: assetPath }) => assetPath.includes('/scaffolds/outfit/shirt-tie.'));
    expect(shirtTieAssets.map(({ path: assetPath }) => assetPath)).toEqual([
      'assets/part-authoring/scaffolds/outfit/shirt-tie.collar.east.svg',
      'assets/part-authoring/scaffolds/outfit/shirt-tie.collar.south.svg',
      'assets/part-authoring/scaffolds/outfit/shirt-tie.tie.east.svg',
      'assets/part-authoring/scaffolds/outfit/shirt-tie.tie.south.svg',
    ]);
    for (const component of ['collar', 'tie']) {
      const componentAssets = shirtTieAssets.filter(({ path: assetPath }) =>
        assetPath.includes(`shirt-tie.${component}.`));
      expect(componentAssets).toHaveLength(2);
      for (const { bytes } of componentAssets) {
        const source = bytes.toString('utf8');
        expect(source).toContain(`outfit-shirt-tie ${component}`);
        expect(source).toContain(`id="detail/${component}/shape-001"`);
        expect(source).toContain('id="reference/body-balanced"');
        expect(source).toContain('id="guide/body-rig/axis"');
      }
    }

    const turtleneckAssets = generatePartAuthoringAssets()
      .filter(({ path: assetPath }) => assetPath.includes('/scaffolds/outfit/turtleneck.'));
    expect(turtleneckAssets.map(({ path: assetPath }) => assetPath)).toEqual([
      'assets/part-authoring/scaffolds/outfit/turtleneck.neck-band.east.svg',
      'assets/part-authoring/scaffolds/outfit/turtleneck.neck-band.north.svg',
      'assets/part-authoring/scaffolds/outfit/turtleneck.neck-band.south.svg',
    ]);
    for (const { bytes } of turtleneckAssets) {
      const source = bytes.toString('utf8');
      expect(source).toContain('outfit-turtleneck neck-band');
      expect(source).toContain('id="detail/neck-band/shape-001"');
      expect(source).toContain('id="reference/body-balanced"');
      expect(source).toContain('id="guide/body-rig/axis"');
    }

    const cardiganAssets = generatePartAuthoringAssets()
      .filter(({ path: assetPath }) => assetPath.includes('/scaffolds/outfit/cardigan.'));
    expect(cardiganAssets.map(({ path: assetPath }) => assetPath)).toEqual([
      'assets/part-authoring/scaffolds/outfit/cardigan.button-line.east.svg',
      'assets/part-authoring/scaffolds/outfit/cardigan.button-line.south.svg',
      'assets/part-authoring/scaffolds/outfit/cardigan.trim.east.svg',
      'assets/part-authoring/scaffolds/outfit/cardigan.trim.south.svg',
    ]);
    for (const component of ['trim', 'button-line']) {
      const componentAssets = cardiganAssets.filter(({ path: assetPath }) =>
        assetPath.includes(`cardigan.${component}.`));
      expect(componentAssets).toHaveLength(2);
      for (const { bytes } of componentAssets) {
        const source = bytes.toString('utf8');
        expect(source).toContain(`outfit-cardigan ${component}`);
        expect(source).toContain(`id="detail/${component}/shape-001"`);
        expect(source).toContain('id="reference/body-balanced"');
        expect(source).toContain('id="guide/body-rig/axis"');
      }
    }

    const suitJacketAssets = generatePartAuthoringAssets()
      .filter(({ path: assetPath }) => assetPath.includes('/scaffolds/outfit/suit-jacket.'));
    expect(suitJacketAssets.map(({ path: assetPath }) => assetPath)).toEqual([
      'assets/part-authoring/scaffolds/outfit/suit-jacket.buttons.east.svg',
      'assets/part-authoring/scaffolds/outfit/suit-jacket.buttons.south.svg',
      'assets/part-authoring/scaffolds/outfit/suit-jacket.lapels.east.svg',
      'assets/part-authoring/scaffolds/outfit/suit-jacket.lapels.south.svg',
      'assets/part-authoring/scaffolds/outfit/suit-jacket.notches.east.svg',
      'assets/part-authoring/scaffolds/outfit/suit-jacket.notches.south.svg',
      'assets/part-authoring/scaffolds/outfit/suit-jacket.pocket-square.east.svg',
      'assets/part-authoring/scaffolds/outfit/suit-jacket.pocket-square.south.svg',
      'assets/part-authoring/scaffolds/outfit/suit-jacket.pocket.east.svg',
      'assets/part-authoring/scaffolds/outfit/suit-jacket.pocket.south.svg',
      'assets/part-authoring/scaffolds/outfit/suit-jacket.tie.east.svg',
      'assets/part-authoring/scaffolds/outfit/suit-jacket.tie.south.svg',
    ]);
    for (const component of ['pocket-square', 'lapels', 'buttons', 'pocket', 'tie', 'notches']) {
      const componentAssets = suitJacketAssets.filter(({ path: assetPath }) =>
        assetPath.includes(`suit-jacket.${component}.`));
      expect(componentAssets).toHaveLength(2);
      for (const { bytes } of componentAssets) {
        const source = bytes.toString('utf8');
        expect(source).toContain(`outfit-suit-jacket ${component}`);
        expect(source).toContain(`id="detail/${component}/shape-001"`);
        expect(source).toContain('id="reference/body-balanced"');
        expect(source).toContain('id="guide/body-rig/axis"');
      }
    }
  });

  it('keeps the east body guide narrow and left-shifted relative to the stable head origin', () => {
    const assets = generatePartAuthoringAssets();
    const south = assets.find(({ path: assetPath }) => assetPath.endsWith('/head/round.south.svg'))!.bytes.toString('utf8');
    const east = assets.find(({ path: assetPath }) => assetPath.endsWith('/head/round.east.svg'))!.bytes.toString('utf8');
    expect(south).toContain('id="guide/body-capsule/shape-001" d="M60 58');
    expect(east).toContain('id="guide/body-capsule/shape-001" d="M59 58');
  });

  it('compiles the thirty canonical hair documents as ten complete overlays', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'terrarium-hair-scaffolds-'));
    temporaryRoots.push(root);
    await mkdir(path.join(root, 'hair'), { recursive: true });
    const assets = generatePartAuthoringAssets();
    const canonicalHairs = [
      ['hair-short', 'short'],
      ['hair-bob', 'bob'],
      ['hair-bun', 'bun'],
      ['hair-curly', 'curly'],
      ['hair-balding', 'balding'],
      ['hair-side-part', 'side-part'],
      ['hair-pixie', 'pixie'],
      ['hair-ponytail', 'ponytail'],
      ['hair-long-straight', 'long-straight'],
      ['hair-coils', 'coils'],
    ] as const;
    for (const [, slug] of canonicalHairs) {
      for (const facing of FACINGS) {
        const asset = assets.find(({ path: assetPath }) =>
          assetPath.endsWith(`/hair/${slug}.${facing}.svg`))!;
        await writeFile(path.join(root, 'hair', `${slug}.${facing}.svg`), asset.bytes);
      }
    }
    const imports = await compilePartDirectory({
      inputDir: root,
      sourcePathPrefix: 'assets/parts',
      catalog: PART_IMPORT_TARGETS,
    });
    expect(imports.map(({ id }) => id)).toEqual([
      'hair-balding',
      'hair-bob',
      'hair-bun',
      'hair-coils',
      'hair-curly',
      'hair-long-straight',
      'hair-pixie',
      'hair-ponytail',
      'hair-short',
      'hair-side-part',
    ]);
    for (const [id, slug] of canonicalHairs) {
      const imported = imports.find((candidate) => candidate.id === id)!;
      expect(Object.keys(imported.facings), id).toEqual(FACINGS);
      expect(imported.sourceFiles, id).toEqual([
        `assets/parts/hair/${slug}.east.svg`,
        `assets/parts/hair/${slug}.north.svg`,
        `assets/parts/hair/${slug}.south.svg`,
      ]);
    }
  });
});

describe('part sentinel palette generation', () => {
  it('encodes the canonical 246-byte ASE 1.0 palette', () => {
    const ase = encodePartSentinelAse();
    expect(ase).toHaveLength(246);
    expect(createHash('sha256').update(ase).digest('hex'))
      .toBe('f093bfb1187e3a2db84e022d66c3d498a8675dbfc58c8fb6c7e8485f2137d13f');
    const decoded = decodeAse(ase);
    expect(decoded.map(({ name }) => name)).toEqual([
      '$skin',
      '$hair',
      '$outfitPrimary',
      '$outfitSecondary',
      '$accent',
    ]);
    expect(decoded.map(({ model }) => model)).toEqual(Array(5).fill('RGB '));
    expect(decoded.map(({ type }) => type)).toEqual(Array(5).fill(2));
    expect(decoded.map(({ channels }) => channels)).toEqual([
      [1, 0, 1],
      [0, 1, 1],
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]);
  });

  it('emits the same frozen order in the GPL companion', () => {
    expect(partSentinelGpl()).toBe([
      'GIMP Palette',
      'Name: Terrarium character part sentinels',
      'Columns: 5',
      '#',
      '255   0 255  $skin',
      '  0 255 255  $hair',
      '255   0   0  $outfitPrimary',
      '  0 255   0  $outfitSecondary',
      '  0   0 255  $accent',
      '',
    ].join('\n'));
  });
});

describe('committed part authoring assets', () => {
  it('match generated bytes and the exact machine-owned file set', async () => {
    await expect(checkPartAuthoringAssets(path.resolve('.'))).resolves.toBeUndefined();
  });

  it('detects and repairs missing, modified, and orphaned files', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'terrarium-authoring-assets-'));
    temporaryRoots.push(root);
    const firstWrite = await writePartAuthoringAssets(root);
    expect(firstWrite.updated).toBe(107);
    expect(firstWrite.removed).toBe(0);
    await expect(checkPartAuthoringAssets(root)).resolves.toBeUndefined();

    const generated = generatePartAuthoringAssets();
    const modified = path.join(root, generated[0].path);
    await writeFile(modified, Buffer.from('modified'));
    const missing = path.join(root, generated[1].path);
    await rm(missing);
    const orphan = path.join(root, PART_AUTHORING_OWNED_DIRS[0], 'orphan.svg');
    await mkdir(path.dirname(orphan), { recursive: true });
    await writeFile(orphan, '<svg/>');
    expect(await partAuthoringAssetMismatches(root)).toEqual([
      `modified ${generated[0].path}`,
      `missing ${generated[1].path}`,
      `orphaned ${PART_AUTHORING_OWNED_DIRS[0]}/orphan.svg`,
    ]);

    const repair = await writePartAuthoringAssets(root);
    expect(repair.updated).toBe(2);
    expect(repair.removed).toBe(1);
    await expect(readFile(modified)).resolves.toEqual(generated[0].bytes);
    await expect(checkPartAuthoringAssets(root)).resolves.toBeUndefined();
  });
});
