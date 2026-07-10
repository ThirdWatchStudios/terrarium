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
import { compilePartDirectory, compilePartSvg } from '../scripts/parts/importer';
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

function renderShapes(shapes: readonly ShapeSpec[], outlined = false): Buffer {
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
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128"><g transform="translate(64 44)">${outlineMarkup}${colorMarkup}</g></svg>`;
  return new Resvg(svg, { font: { loadSystemFonts: false } }).render().pixels;
}

function shapeSemantics(shape: ShapeSpec): Omit<ShapeSpec, 'd'> {
  const { d: _d, ...semantics } = shape;
  return semantics;
}

function scaffoldIdentity(assetPath: string): { partId: string; facing: Facing } {
  const match = /\/scaffolds\/(head|hair)\/([a-z-]+)\.(south|east|north)\.svg$/.exec(assetPath);
  if (!match) throw new Error(`Not a scaffold path: ${assetPath}`);
  return { partId: `${match[1]}-${match[2]}`, facing: match[3] as Facing };
}

describe('part authoring scaffold generation', () => {
  it('generates the exact deterministic head/hair scaffold and palette file set', () => {
    const first = generatePartAuthoringAssets();
    const second = generatePartAuthoringAssets();
    expect(first.map(({ path: assetPath }) => assetPath)).toEqual([
      'assets/part-authoring/palettes/terrarium-part-sentinels.ase',
      'assets/part-authoring/palettes/terrarium-part-sentinels.gpl',
      'assets/part-authoring/palettes/terrarium-part-sentinels.svg',
      'assets/part-authoring/scaffolds/hair/bob.east.svg',
      'assets/part-authoring/scaffolds/hair/bob.north.svg',
      'assets/part-authoring/scaffolds/hair/bob.south.svg',
      'assets/part-authoring/scaffolds/head/round.east.svg',
      'assets/part-authoring/scaffolds/head/round.north.svg',
      'assets/part-authoring/scaffolds/head/round.south.svg',
    ]);
    expect(first.map(({ bytes }) => bytes)).toEqual(second.map(({ bytes }) => bytes));
    expect(PART_SCAFFOLD_SPECS.map(({ slot, referenceId }) => [slot, referenceId])).toEqual([
      ['head', 'head-round'],
      ['hair', 'hair-bob'],
    ]);
  });

  it('makes every seeded scaffold importable while excluding all reference and guide art', () => {
    for (const asset of generatePartAuthoringAssets().filter(({ path: assetPath }) => assetPath.includes('/scaffolds/'))) {
      const slot = scaffoldSlotForPath(asset.path);
      expect(slot).toBeTruthy();
      const source = asset.bytes.toString('utf8');
      expect(source).toContain('viewBox="0 0 128 128"');
      expect(source).toContain('id="guide/canvas"');
      expect(source).toContain('id="guide/head-radius"');
      expect(source).toContain('id="guide/body-capsule"');
      expect(source).toContain('id="reference/canvas-background"');
      expect(source).toContain('id="anchors/headCenter"');
      expect(source).toContain('id="swatches"');
      expect(source).toContain('id="art"');
      expect(source).not.toMatch(/<(?:rect|circle|ellipse|line|polyline|polygon|text)\b/);

      const { partId, facing } = scaffoldIdentity(asset.path);
      const sourceShapes = getPart(partId)?.facings[facing]?.shapes;
      expect(sourceShapes, `${asset.path} source part missing`).toBeTruthy();
      const compiled = compilePartSvg(source, { source: asset.path, slot: slot as 'head' | 'hair' });
      expect(compiled.map(shapeSemantics), asset.path).toEqual(sourceShapes!.map(shapeSemantics));

      for (const outlined of [false, true]) {
        const sourcePixels = renderShapes(sourceShapes!, outlined);
        const compiledPixels = renderShapes(compiled, outlined);
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

  it('keeps the east body guide narrow and left-shifted relative to the stable head origin', () => {
    const assets = generatePartAuthoringAssets();
    const south = assets.find(({ path: assetPath }) => assetPath.endsWith('/head/round.south.svg'))!.bytes.toString('utf8');
    const east = assets.find(({ path: assetPath }) => assetPath.endsWith('/head/round.east.svg'))!.bytes.toString('utf8');
    expect(south).toContain('id="guide/body-capsule/shape-001" d="M60 58');
    expect(east).toContain('id="guide/body-capsule/shape-001" d="M59 58');
  });

  it('compiles the three seeded bob documents as one complete overlay', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'terrarium-bob-scaffold-'));
    temporaryRoots.push(root);
    await mkdir(path.join(root, 'hair'), { recursive: true });
    const assets = generatePartAuthoringAssets();
    for (const facing of FACINGS) {
      const asset = assets.find(({ path: assetPath }) => assetPath.endsWith(`/hair/bob.${facing}.svg`))!;
      await writeFile(path.join(root, 'hair', `bob.${facing}.svg`), asset.bytes);
    }
    const imports = await compilePartDirectory({
      inputDir: root,
      sourcePathPrefix: 'assets/parts',
      catalog: PART_IMPORT_TARGETS,
    });
    expect(imports).toHaveLength(1);
    expect(imports[0].id).toBe('hair-bob');
    expect(Object.keys(imports[0].facings)).toEqual(FACINGS);
    expect(imports[0].sourceFiles).toEqual([
      'assets/parts/hair/bob.east.svg',
      'assets/parts/hair/bob.north.svg',
      'assets/parts/hair/bob.south.svg',
    ]);
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
    expect(firstWrite.updated).toBe(9);
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
