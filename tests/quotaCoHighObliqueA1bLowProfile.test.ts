import { createHash } from 'node:crypto';
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { tileShapeIsTintImpure } from '../src/core/compositor';
import { EXPORT_SCALES, wallAtlas } from '../src/core/exporter';
import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import { DEFAULT_STYLE, DEFAULT_WALLS } from '../src/data/defaults';
import { PROP_TEMPLATES } from '../src/props/templates';
import { BLOB_CONFIGS, blobContract } from '../src/tiles/blob';
import { FLOOR_TEMPLATES, WALL_TEMPLATES } from '../src/tiles/templates';
import { A1A_PALETTE } from '../scripts/highOblique/a1aProof';
import {
  A1B_LOW_CORRECTION_CANVAS,
  A1B_LOW_CORRECTION_COLUMNS,
  A1B_LOW_CORRECTION_FRAME_IDS,
  A1B_LOW_CORRECTION_PADDING,
  A1B_LOW_CORRECTION_ROWS,
  A1B_LOW_CORRECTION_RULER,
  A1B_LOW_CORRECTION_SOURCE_IDS,
  A1B_LOW_CORRECTION_SOURCE_INVENTORY,
  A1B_LOW_CORRECTION_STRIDE,
  a1bLowCorrectionAtlasDescriptor,
  a1bLowCorrectionAtlasSvg,
  a1bLowCorrectionFrameMarkup,
  a1bLowCorrectionFrameSvg,
  buildA1bLowCorrectionFrames,
  compileA1bLowCorrectionDirectory,
  loadA1bLowCorrectionFamily,
  type A1bLowCorrectionFamily,
  type A1bLowCorrectionFrame,
} from '../scripts/highOblique/a1bLowProfileCorrection';
import {
  A1B_TOPOLOGY_KERNELS,
  a1bTopologyFrameSvg,
  loadA1bTopologyFamily,
  type A1bTopologyFamily,
} from '../scripts/highOblique/a1bTopology';

const SOURCE_PREFIX = 'assets/walls/quota-co-building-system/low-profile-correction';
const SOURCE_DIRECTORY = path.resolve(process.cwd(), SOURCE_PREFIX);
const TOPOLOGY_PREFIX = 'assets/walls/quota-co-building-system/topology';
const TOPOLOGY_DIRECTORY = path.resolve(process.cwd(), TOPOLOGY_PREFIX);
const REJECTED_TOPOLOGY_SOURCE_HASH =
  'de4cfd72d030d8bda5aec9d0ebf0da00ebe5dd3d86088dff0d524f7e1ba6d5b9';

const EXPECTED_SOURCES = [
  { id: 'low-s-straight', filename: 'low-s-straight.svg', layer: 'base', semanticGroup: 'detail/low' },
  { id: 'low-e-straight', filename: 'low-e-straight.svg', layer: 'base', semanticGroup: 'detail/low' },
  { id: 'low-se-corner', filename: 'low-se-corner.svg', layer: 'base', semanticGroup: 'detail/low' },
  { id: 'transition-n-to-e-base', filename: 'transition-n-to-e-base.svg', layer: 'base', semanticGroup: 'detail/low' },
  { id: 'transition-n-to-e-upper', filename: 'transition-n-to-e-upper.svg', layer: 'upper', semanticGroup: 'detail/upper' },
] as const;

const temporaryRoots: string[] = [];

interface Raster {
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint8Array;
}

function raster(svg: string): Raster {
  const rendered = new Resvg(svg, { font: { loadSystemFonts: false } }).render();
  return { width: rendered.width, height: rendered.height, pixels: rendered.pixels };
}

function alphaAt(rendered: Raster, x: number, y: number): number {
  return rendered.pixels[(y * rendered.width + x) * 4 + 3];
}

function alphaCounts(
  rendered: Raster,
  x: number,
  y: number,
  width: number,
  height: number,
): { painted: number; transparent: number } {
  let painted = 0;
  let transparent = 0;
  for (let py = y; py < y + height; py += 1) {
    for (let px = x; px < x + width; px += 1) {
      if (alphaAt(rendered, px, py) === 0) transparent += 1;
      else painted += 1;
    }
  }
  return { painted, transparent };
}

function alphaBounds(rendered: Raster, minimumAlpha = 1): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = rendered.width;
  let minY = rendered.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < rendered.height; y += 1) {
    for (let x = 0; x < rendered.width; x += 1) {
      if (alphaAt(rendered, x, y) < minimumAlpha) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return { minX, minY, maxX, maxY };
}

function colorCount(rendered: Raster, hex: string, tolerance = 3): number {
  const target = [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
  let count = 0;
  for (let index = 0; index < rendered.pixels.length; index += 4) {
    if (rendered.pixels[index + 3] === 0) continue;
    if (
      Math.abs(rendered.pixels[index] - target[0]) <= tolerance &&
      Math.abs(rendered.pixels[index + 1] - target[1]) <= tolerance &&
      Math.abs(rendered.pixels[index + 2] - target[2]) <= tolerance
    ) count += 1;
  }
  return count;
}

function frameById(
  family: A1bLowCorrectionFamily,
  id: (typeof A1B_LOW_CORRECTION_FRAME_IDS)[number],
): A1bLowCorrectionFrame {
  const frame = family.frames.find((candidate) => candidate.id === id);
  if (!frame) throw new Error(`Missing test frame ${id}`);
  return frame;
}

async function clonedSourceTree(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'terrarium-low-correction-'));
  temporaryRoots.push(root);
  await Promise.all(EXPECTED_SOURCES.map(async ({ filename }) => {
    await writeFile(
      path.join(root, filename),
      await readFile(path.join(SOURCE_DIRECTORY, filename)),
    );
  }));
  return root;
}

async function topologySourceHash(): Promise<string> {
  const files: string[] = [];
  async function walk(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(absolute);
      else files.push(absolute);
    }
  }
  await walk(TOPOLOGY_DIRECTORY);
  files.sort();
  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(path.relative(TOPOLOGY_DIRECTORY, file));
    hash.update('\0');
    hash.update(await readFile(file));
  }
  return hash.digest('hex');
}

function productionSignature(): string {
  return JSON.stringify({
    schemaVersion: CURRENT_SCHEMA_VERSION,
    blob: blobContract(),
    wallTemplates: WALL_TEMPLATES.map(({ id }) => id),
    floorTemplates: FLOOR_TEMPLATES.map(({ id }) => id),
    propTemplates: PROP_TEMPLATES.map(({ id }) => id),
    defaultWalls: DEFAULT_WALLS.map(({ id, templateId }) => ({ id, templateId })),
    wallAtlas: wallAtlas(DEFAULT_WALLS[0], DEFAULT_STYLE, 1),
  });
}

const productionBefore = productionSignature();
let family: A1bLowCorrectionFamily;
let topology: A1bTopologyFamily;

beforeAll(async () => {
  [family, topology] = await Promise.all([
    loadA1bLowCorrectionFamily({
      inputDir: SOURCE_DIRECTORY,
      sourcePathPrefix: SOURCE_PREFIX,
    }),
    loadA1bTopologyFamily({
      inputDir: TOPOLOGY_DIRECTORY,
      sourcePathPrefix: TOPOLOGY_PREFIX,
    }),
  ]);
});

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe('QuotaCo A1b low-profile corrective mini-strip', () => {
  it('freezes the exact five editable SVG sources and compiles deterministically', async () => {
    expect(A1B_LOW_CORRECTION_SOURCE_IDS).toEqual(EXPECTED_SOURCES.map(({ id }) => id));
    expect(A1B_LOW_CORRECTION_SOURCE_INVENTORY).toEqual(EXPECTED_SOURCES);
    expect(family.sources).toHaveLength(5);
    expect(new Set(family.sources.map(({ id }) => id)).size).toBe(5);

    const repeated = await compileA1bLowCorrectionDirectory({
      inputDir: SOURCE_DIRECTORY,
      sourcePathPrefix: SOURCE_PREFIX,
    });
    expect(repeated).toEqual(family.sources);
    for (const source of family.sources) {
      expect(source.sourceFile).toBe(`${SOURCE_PREFIX}/${source.filename}`);
      expect(source.shapes.length, source.id).toBeGreaterThan(0);
      expect(source.shapes.every(({ layer }) => layer === source.layer), source.id).toBe(true);
      const input = await readFile(path.join(SOURCE_DIRECTORY, source.filename), 'utf8');
      expect(input).toContain('viewBox="0 0 128 128"');
      expect(input).toContain(`id="${source.semanticGroup}"`);
    }
  });

  it('keeps the corrective directory strict about missing and unexpected sources', async () => {
    const missing = await clonedSourceTree();
    await rm(path.join(missing, EXPECTED_SOURCES[0].filename));
    await expect(compileA1bLowCorrectionDirectory({
      inputDir: missing,
      sourcePathPrefix: 'proof/missing',
    })).rejects.toThrow(/missing source/i);

    const unexpected = await clonedSourceTree();
    await writeFile(path.join(unexpected, 'stray.svg'), '<svg viewBox="0 0 128 128"/>');
    await expect(compileA1bLowCorrectionDirectory({
      inputDir: unexpected,
      sourcePathPrefix: 'proof/unexpected',
    })).rejects.toThrow(/unexpected source/i);

    const directory = await clonedSourceTree();
    await mkdir(path.join(directory, 'stray'));
    await expect(compileA1bLowCorrectionDirectory({
      inputDir: directory,
      sourcePathPrefix: 'proof/directory',
    })).rejects.toThrow(/unexpected source/i);
  });

  it('builds the exact six-frame correction and composes transition base before upper', () => {
    expect(A1B_LOW_CORRECTION_FRAME_IDS).toEqual([
      'a1b_low_corrected_s',
      'a1b_low_corrected_e',
      'a1b_low_corrected_se_corner',
      'a1b_low_corrected_transition_base',
      'a1b_low_corrected_transition_upper',
      'a1b_low_corrected_transition_composed',
    ]);
    expect(family.frames.map(({ id }) => id)).toEqual(A1B_LOW_CORRECTION_FRAME_IDS);
    expect(buildA1bLowCorrectionFrames(family.sources)).toEqual(family.frames);

    const base = frameById(family, 'a1b_low_corrected_transition_base');
    const upper = frameById(family, 'a1b_low_corrected_transition_upper');
    const composed = frameById(family, 'a1b_low_corrected_transition_composed');
    expect(composed.sourceIds).toEqual(['transition-n-to-e-base', 'transition-n-to-e-upper']);
    expect(composed.sourceFiles).toEqual([...base.sourceFiles, ...upper.sourceFiles]);
    expect(composed.shapes).toEqual([...base.shapes, ...upper.shapes]);
    expect(a1bLowCorrectionFrameMarkup(composed)).toBe(
      a1bLowCorrectionFrameMarkup(base) + a1bLowCorrectionFrameMarkup(upper),
    );
    for (const frame of family.frames) {
      expect(frame.pivot).toEqual({ x: 0.5, y: 0.5 });
      expect(frame.bounds).toEqual({ x: 0, y: 0, w: 128, h: 128 });
    }
  });

  it('replaces the 22-unit chassis read with a substantial finished low wall', () => {
    expect(A1B_LOW_CORRECTION_RULER).toEqual({
      outerStart: 82,
      outerEnd: 120,
      outerProfile: 38,
      materialProfile: 34,
      south: {
        shellStart: 84,
        revealEnd: 88,
        creamEnd: 97,
        coralEnd: 102,
        greenEnd: 117,
        contactStart: 120,
        contactEnd: 123.5,
      },
      east: {
        contactStart: 78.5,
        contactEnd: 82,
        greenStart: 85,
        coralStart: 92,
        creamStart: 96,
        copingLipStart: 98.5,
        topPlaneStart: 100,
        shellEnd: 118,
        mirrorAxis: 101,
      },
    });
    expect(A1B_TOPOLOGY_KERNELS.base).toMatchObject({
      outerStart: 94,
      innerStart: 96,
      innerEnd: 118,
      outerEnd: 120,
    });

    const oldSouth = topology.evidenceFrames.find(({ id }) => id === 'a1b_evidence_low_10')!;
    const oldEast = topology.evidenceFrames.find(({ id }) => id === 'a1b_evidence_low_05')!;
    const newSouth = frameById(family, 'a1b_low_corrected_s');
    const newEast = frameById(family, 'a1b_low_corrected_e');
    const oldSouthBounds = alphaBounds(raster(a1bTopologyFrameSvg(oldSouth)));
    const oldEastBounds = alphaBounds(raster(a1bTopologyFrameSvg(oldEast)));
    const newSouthBounds = alphaBounds(raster(a1bLowCorrectionFrameSvg(newSouth)));
    const newEastBounds = alphaBounds(raster(a1bLowCorrectionFrameSvg(newEast)));
    const newEastSolidBounds = alphaBounds(raster(a1bLowCorrectionFrameSvg(newEast)), 128);
    const oldSouthDepth = oldSouthBounds.maxY - oldSouthBounds.minY + 1;
    const oldEastDepth = oldEastBounds.maxX - oldEastBounds.minX + 1;
    const newSouthDepth = newSouthBounds.maxY - newSouthBounds.minY + 1;
    const newEastDepth = newEastBounds.maxX - newEastBounds.minX + 1;
    expect([oldSouthDepth, oldEastDepth]).toEqual([26, 26]);
    // 38-unit solid wall band plus the 3.5-unit translucent contact shade
    // overhanging onto the floor (owner-blessed depth overlays, 2026-07-20).
    expect([newSouthDepth, newEastDepth]).toEqual([42, 42]);
    expect(newEastBounds).toMatchObject({ minX: 78, maxX: 119 });
    expect(newEastSolidBounds).toMatchObject({ minX: 82, maxX: 119 });
    expect(newSouthDepth - oldSouthDepth).toBeGreaterThanOrEqual(10);
    expect(newEastDepth - oldEastDepth).toBeGreaterThanOrEqual(10);

    for (const frame of [newSouth, newEast]) {
      const paints = new Set(frame.shapes.map(({ fill }) => fill).filter(Boolean));
      expect(paints.has('$cream'), `${frame.id} cream coping`).toBe(true);
      expect(paints.has('$green'), `${frame.id} green face`).toBe(true);
      // The teal service band is retired: the reference shows no teal on low
      // straights (owner-blessed directional treatments, 2026-07-20).
      expect(paints.has('$teal'), `${frame.id} retired teal service band`).toBe(false);
    }
    expect(new Set(oldSouth.shapes.map(({ fill }) => fill)).has('$cream')).toBe(false);
    expect(new Set(oldEast.shapes.map(({ fill }) => fill)).has('$cream')).toBe(false);
  });

  it('keeps cream coping and green face visible at normal and far gameplay sizes', () => {
    const frames = [
      frameById(family, 'a1b_low_corrected_s'),
      frameById(family, 'a1b_low_corrected_e'),
      frameById(family, 'a1b_low_corrected_se_corner'),
      frameById(family, 'a1b_low_corrected_transition_composed'),
    ];
    for (const frame of frames) {
      for (const size of [90, 40]) {
        const rendered = raster(a1bLowCorrectionFrameSvg(frame, size));
        expect(colorCount(rendered, A1A_PALETTE.cream, 25), `${frame.id}@${size} cream`)
          .toBeGreaterThan(2);
        expect(colorCount(rendered, A1A_PALETTE.green, 25), `${frame.id}@${size} green`)
          .toBeGreaterThan(2);
        const counts = alphaCounts(rendered, 0, 0, size, size);
        expect(counts.painted, `${frame.id}@${size} painted`).toBeGreaterThan(0);
        expect(counts.transparent, `${frame.id}@${size} transparent`).toBeGreaterThan(0);
      }
    }
  });

  it('uses only approved product fields and literal detail with no cast-shadow layer', async () => {
    const allowedTokens = new Set(['cream', 'green', 'teal']);
    const allowedLiterals = new Set([
      '#FFFFFF',
      '#000000',
      A1A_PALETTE.charcoal,
      A1A_PALETTE.coral,
      A1A_PALETTE.glass,
      A1A_PALETTE.metal,
    ].map((paint) => paint.toUpperCase()));
    const forbidden = ['#D69B4B', '#D8638F'];
    const usedTokens = new Set<string>();
    for (const source of family.sources) {
      const sourceText = (await readFile(path.join(SOURCE_DIRECTORY, source.filename), 'utf8'))
        .toUpperCase();
      forbidden.forEach((paint) => expect(sourceText, source.id).not.toContain(paint));
      for (const shape of source.shapes) {
        expect(shape.silhouette, source.id).toBe(false);
        expect(tileShapeIsTintImpure(shape), source.id).toBe(false);
        expect(shape.layer === 'base' || shape.layer === 'upper').toBe(true);
        expect(shape.layer === ('shadow' as never)).toBe(false);
        for (const paint of [shape.fill, shape.stroke]) {
          if (paint === undefined) continue;
          if (paint.startsWith('$')) {
            const token = paint.slice(1);
            usedTokens.add(token);
            expect(allowedTokens.has(token), `${source.id} ${token}`).toBe(true);
          } else {
            expect(allowedLiterals.has(paint.toUpperCase()), `${source.id} ${paint}`).toBe(true);
          }
        }
      }
    }
    expect([...usedTokens].sort()).toEqual(['cream', 'green', 'teal']);
  });

  it('packs a deterministic transparent six-frame atlas at 1x, 2x, and 4x', async () => {
    expect(EXPORT_SCALES).toEqual([1, 2, 4]);
    expect([A1B_LOW_CORRECTION_COLUMNS, A1B_LOW_CORRECTION_ROWS]).toEqual([3, 2]);
    for (const scale of EXPORT_SCALES) {
      const atlas = a1bLowCorrectionAtlasDescriptor(family.frames, scale);
      const stride = A1B_LOW_CORRECTION_STRIDE * scale;
      expect(atlas.width).toBe(A1B_LOW_CORRECTION_COLUMNS * stride);
      expect(atlas.height).toBe(A1B_LOW_CORRECTION_ROWS * stride);
      expect(Object.keys(atlas.frames)).toEqual(A1B_LOW_CORRECTION_FRAME_IDS);
      expect(Math.max(atlas.width, atlas.height)).toBeLessThanOrEqual(8192);
      for (const [index, frame] of Object.values(atlas.frames).entries()) {
        expect(frame.x).toBe(
          (index % A1B_LOW_CORRECTION_COLUMNS) * stride + A1B_LOW_CORRECTION_PADDING * scale,
        );
        expect(frame.y).toBe(
          Math.floor(index / A1B_LOW_CORRECTION_COLUMNS) * stride +
            A1B_LOW_CORRECTION_PADDING * scale,
        );
        expect([frame.w, frame.h]).toEqual([
          A1B_LOW_CORRECTION_CANVAS * scale,
          A1B_LOW_CORRECTION_CANVAS * scale,
        ]);
      }
    }

    const repeated = await loadA1bLowCorrectionFamily({
      inputDir: SOURCE_DIRECTORY,
      sourcePathPrefix: SOURCE_PREFIX,
    });
    expect(repeated).toEqual(family);
    const atlas = a1bLowCorrectionAtlasDescriptor(family.frames, 1);
    expect(atlas).toMatchObject({
      version: 0,
      status: 'corrective-source-proof',
      contract: false,
      pivot: { x: 0.5, y: 0.5 },
      ruler: A1B_LOW_CORRECTION_RULER,
      meta: {
        sourceCount: 5,
        frameCount: 6,
        rejectedControlPreserved: true,
        completeBlobFamily: false,
        transparentPadding: true,
        temporaryFrameIds: true,
        productionRegistration: false,
        schemaChange: false,
        directionalCastShadow: false,
      },
    });
    const source = a1bLowCorrectionAtlasSvg(family.frames, 1);
    expect(a1bLowCorrectionAtlasSvg(repeated.frames, 1)).toBe(source);
    expect(source).not.toMatch(/<text|checker|panel/i);
    const rendered = raster(source);
    expect([rendered.width, rendered.height]).toEqual([atlas.width, atlas.height]);
    for (let index = 0; index < family.frames.length; index += 1) {
      const frame = family.frames[index];
      const rect = atlas.frames[frame.id];
      const counts = alphaCounts(rendered, rect.x, rect.y, rect.w, rect.h);
      expect(counts.painted, frame.id).toBeGreaterThan(0);
      expect(counts.transparent, frame.id).toBeGreaterThan(0);
      const cellX = (index % A1B_LOW_CORRECTION_COLUMNS) * A1B_LOW_CORRECTION_STRIDE;
      const cellY = Math.floor(index / A1B_LOW_CORRECTION_COLUMNS) *
        A1B_LOW_CORRECTION_STRIDE;
      expect(alphaCounts(
        rendered,
        cellX,
        cellY,
        A1B_LOW_CORRECTION_STRIDE,
        A1B_LOW_CORRECTION_PADDING,
      ).painted, `${frame.id} top gutter`).toBe(0);
      expect(alphaCounts(
        rendered,
        cellX,
        cellY + A1B_LOW_CORRECTION_PADDING + A1B_LOW_CORRECTION_CANVAS,
        A1B_LOW_CORRECTION_STRIDE,
        A1B_LOW_CORRECTION_PADDING,
      ).painted, `${frame.id} bottom gutter`).toBe(0);
      expect(alphaCounts(
        rendered,
        cellX,
        cellY,
        A1B_LOW_CORRECTION_PADDING,
        A1B_LOW_CORRECTION_STRIDE,
      ).painted, `${frame.id} left gutter`).toBe(0);
      expect(alphaCounts(
        rendered,
        cellX + A1B_LOW_CORRECTION_PADDING + A1B_LOW_CORRECTION_CANVAS,
        cellY,
        A1B_LOW_CORRECTION_PADDING,
        A1B_LOW_CORRECTION_STRIDE,
      ).painted, `${frame.id} right gutter`).toBe(0);
    }
  });

  it('preserves the rejected 47-bank control and all production contracts', async () => {
    expect(await topologySourceHash()).toBe(REJECTED_TOPOLOGY_SOURCE_HASH);
    expect(productionSignature()).toBe(productionBefore);
    expect(CURRENT_SCHEMA_VERSION).toBe(21);
    expect(blobContract()).toMatchObject({ version: 1, tileCount: 47 });
    expect(blobContract().configs).toEqual(BLOB_CONFIGS);
    const productionIds = new Set([
      ...WALL_TEMPLATES.map(({ id }) => id),
      ...FLOOR_TEMPLATES.map(({ id }) => id),
      ...PROP_TEMPLATES.map(({ id }) => id),
    ]);
    for (const id of [...A1B_LOW_CORRECTION_SOURCE_IDS, ...A1B_LOW_CORRECTION_FRAME_IDS]) {
      expect(productionIds.has(id), id).toBe(false);
    }
    const productionWall = wallAtlas(DEFAULT_WALLS[0], DEFAULT_STYLE, 1);
    expect(Object.keys(productionWall.frames)).toEqual(
      Array.from({ length: 47 }, (_, index) => `mask_${index}`),
    );
    expect(JSON.stringify(productionWall)).not.toMatch(/low_corrected|low-profile-correction/i);
    expect(a1bLowCorrectionAtlasDescriptor(family.frames, 1)).toMatchObject({
      contract: false,
      meta: {
        completeBlobFamily: false,
        productionRegistration: false,
        schemaChange: false,
      },
    });
  });
});
