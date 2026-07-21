import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { afterEach, describe, expect, it } from 'vitest';

import { tileShapeIsTintImpure } from '../src/core/compositor';
import { EXPORT_SCALES, wallAtlas } from '../src/core/exporter';
import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import { DEFAULT_STYLE, DEFAULT_WALLS } from '../src/data/defaults';
import { PROP_TEMPLATES } from '../src/props/templates';
import { BLOB_TILE_COUNT } from '../src/tiles/blob';
import { FLOOR_TEMPLATES, WALL_TEMPLATES } from '../src/tiles/templates';
import {
  A1A_ATLAS_COLUMNS,
  A1A_ATLAS_PADDING,
  A1A_ATLAS_ROWS,
  A1A_CANVAS,
  A1A_CELL_STRIDE,
  A1A_COMPARISON_STEMS,
  A1A_PALETTE,
  A1A_PROOF_FRAMES,
  A1A_REVIEW_SIZES,
  A1A_RULER,
  A1A_SHARED_FRAME_IDS,
  a1aAtlasDescriptor,
  a1aAtlasSvg,
  a1aComponentLayers,
  a1aFrameMarkup,
  a1aFrameSvg,
  getA1aProofFrame,
  resolveA1aPaint,
  type A1aFrameId,
} from '../scripts/highOblique/a1aProof';
import {
  A1B_AUTHORED_B_COMPONENTS,
  A1B_AUTHORED_B_COMPONENT_IDS,
  A1B_AUTHORED_B_SOURCE_INVENTORY,
  assembleA1bAuthoredBFrames,
  compileA1bAuthoredBDirectory,
  loadA1bAuthoredBFamily,
} from '../scripts/highOblique/a1bAuthored';
import {
  A1B_ATLAS_COLUMNS,
  A1B_ATLAS_PADDING,
  A1B_ATLAS_ROWS,
  A1B_AUTHORED_STEMS,
  A1B_CANVAS,
  A1B_CELL_STRIDE,
  a1bAuthoredAtlasDescriptor,
  a1bAuthoredAtlasSvg,
  a1bAuthoredFrameMarkup,
  buildA1bAuthoredFrames,
} from '../scripts/highOblique/a1bAuthoredProof';
import {
  derivePromotedSoutheastSourcePair,
  PROMOTED_SOUTHEAST_CORNER,
  PROMOTED_SOUTH_WALL_REUSE,
  PROMOTED_SOUTHWEST_CORNER,
} from '../scripts/highOblique/equalHeightWallDirection';

const EXPECTED_SHARED = [
  'shared_floor_flat',
  'shared_floor_transition_straight',
  'shared_floor_transition_corner',
  'shared_floor_threshold',
  'shared_low_s_straight',
  'shared_low_e_straight',
  'shared_low_corner',
  'shared_low_terminus',
  'shared_partition_straight',
  'shared_partition_corner',
  'shared_structure_junction',
] as const;

const EXPECTED_STEMS = [
  'full_n_straight',
  'full_w_straight',
  'full_exterior_corner',
  'full_terminus',
  'transition_n_to_e',
  'transition_w_to_s',
  'door_closed',
  'door_open',
  'window_wide',
] as const;

const A1B_SOURCE_PREFIX = 'assets/walls/quota-co-building-system';
const A1B_SOURCE_DIRECTORY = path.resolve(process.cwd(), A1B_SOURCE_PREFIX);
const temporarySourceRoots: string[] = [];

const EXPECTED_AUTHORED_B_COMPONENTS = EXPECTED_STEMS.flatMap((stem) => [
  {
    id: `b_${stem}/base`,
    frameId: `b_${stem}`,
    stem,
    component: 'base',
    filename: `${stem}-base.svg`,
  },
  {
    id: `b_${stem}/upper`,
    frameId: `b_${stem}`,
    stem,
    component: 'upper',
    filename: `${stem}-upper.svg`,
  },
] as const);

afterEach(async () => {
  await Promise.all(temporarySourceRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function compileAuthoredB(inputDir = A1B_SOURCE_DIRECTORY, sourcePathPrefix = A1B_SOURCE_PREFIX) {
  return compileA1bAuthoredBDirectory({ inputDir, sourcePathPrefix });
}

async function clonedAuthoredBSourceTree(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'terrarium-a1b-authored-'));
  temporarySourceRoots.push(root);
  await Promise.all(A1B_AUTHORED_B_SOURCE_INVENTORY.map(async ({ filename }) => {
    const source = await readFile(path.join(A1B_SOURCE_DIRECTORY, filename), 'utf8');
    await writeFile(path.join(root, filename), source, 'utf8');
  }));
  return root;
}

interface Raster {
  width: number;
  height: number;
  pixels: Uint8Array;
}

function raster(svg: string): Raster {
  const rendered = new Resvg(svg).render();
  return { width: rendered.width, height: rendered.height, pixels: rendered.pixels };
}

function alphaAt(rendered: Raster, x: number, y: number): number {
  return rendered.pixels[(y * rendered.width + x) * 4 + 3];
}

function alphaCounts(rendered: Raster, x: number, y: number, width: number, height: number): {
  painted: number;
  transparent: number;
} {
  let painted = 0;
  let transparent = 0;
  for (let py = y; py < y + height; py++) {
    for (let px = x; px < x + width; px++) {
      if (alphaAt(rendered, px, py) === 0) transparent++;
      else painted++;
    }
  }
  return { painted, transparent };
}

function alphaBounds(id: A1aFrameId): { minX: number; minY: number; maxX: number; maxY: number } {
  const rendered = raster(a1aFrameSvg(id));
  let minX = rendered.width;
  let minY = rendered.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < rendered.height; y++) {
    for (let x = 0; x < rendered.width; x++) {
      if (alphaAt(rendered, x, y) === 0) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return { minX, minY, maxX, maxY };
}

function productionSignature(): string {
  return JSON.stringify({
    schemaVersion: CURRENT_SCHEMA_VERSION,
    wallTemplates: WALL_TEMPLATES.map(({ id }) => id),
    floorTemplates: FLOOR_TEMPLATES.map(({ id }) => id),
    propTemplates: PROP_TEMPLATES.map(({ id }) => id),
    defaultWalls: DEFAULT_WALLS.map(({ id, templateId }) => ({ id, templateId })),
    wallAtlas: wallAtlas(DEFAULT_WALLS[0], DEFAULT_STYLE, 1),
  });
}

describe('QuotaCo high-oblique A1b authored B source family', () => {
  it('promotes south as exact full-north source reuse without another authored stem', () => {
    expect(PROMOTED_SOUTH_WALL_REUSE).toMatchObject({
      role: 'south',
      sourceStem: 'full_n_straight',
      baseFile: 'full_n_straight-base.svg',
      upperFile: 'full_n_straight-upper.svg',
      transform: 'none',
      outerProfile: { start: 56, end: 120 },
      pivot: { x: 0.5, y: 0.5 },
      status: 'owner-accepted-working-contract',
      productionRegistration: false,
    });
    expect(PROMOTED_SOUTH_WALL_REUSE.outerProfile.end - PROMOTED_SOUTH_WALL_REUSE.outerProfile.start)
      .toBe(64);
    expect(A1B_AUTHORED_STEMS).not.toContain('full_s_straight');
  });

  it('promotes the equal-height southwest corner without production registration', () => {
    expect(PROMOTED_SOUTHWEST_CORNER).toEqual({
      role: 'southwest-corner',
      sourceStem: 'transition_w_to_s',
      baseFile: 'transition_w_to_s-base.svg',
      upperFile: 'transition_w_to_s-upper.svg',
      transform: 'none',
      pivot: { x: 0.5, y: 0.5 },
      status: 'owner-accepted-working-contract',
      productionRegistration: false,
    });
    expect(A1B_AUTHORED_STEMS.filter((stem) => stem === 'transition_w_to_s')).toHaveLength(1);
  });

  it('promotes southeast as derived southwest source reuse without another authored stem', () => {
    expect(PROMOTED_SOUTHEAST_CORNER).toEqual({
      role: 'southeast-corner',
      sourceStem: 'transition_w_to_s',
      baseFile: 'transition_w_to_s-base.svg',
      upperFile: 'transition_w_to_s-upper.svg',
      omittedDetailIds: {
        base: ['base-boundary-seam'],
        upper: ['upper-boundary-seam'],
      },
      serviceSeamOwner: 'adjoining-south-cell',
      transform: 'mirror-x',
      mirrorAxis: 64,
      pivot: { x: 0.5, y: 0.5 },
      status: 'owner-accepted-working-contract',
      productionRegistration: false,
    });
    expect(PROMOTED_SOUTHEAST_CORNER.sourceStem).toBe(PROMOTED_SOUTHWEST_CORNER.sourceStem);
    expect(PROMOTED_SOUTHEAST_CORNER.baseFile).toBe(PROMOTED_SOUTHWEST_CORNER.baseFile);
    expect(PROMOTED_SOUTHEAST_CORNER.upperFile).toBe(PROMOTED_SOUTHWEST_CORNER.upperFile);
    expect(A1B_AUTHORED_STEMS).toHaveLength(9);
    expect(A1B_AUTHORED_STEMS.filter((stem) => stem === 'transition_w_to_s')).toHaveLength(1);
    expect(A1B_AUTHORED_STEMS).not.toContain('transition_e_to_s');
  });

  it('derives the promoted southeast sources deterministically and fails if seam ownership drifts', async () => {
    const baseSource = await readFile(
      path.join(A1B_SOURCE_DIRECTORY, PROMOTED_SOUTHEAST_CORNER.baseFile),
      'utf8',
    );
    const upperSource = await readFile(
      path.join(A1B_SOURCE_DIRECTORY, PROMOTED_SOUTHEAST_CORNER.upperFile),
      'utf8',
    );
    const first = derivePromotedSoutheastSourcePair(baseSource, upperSource);
    const second = derivePromotedSoutheastSourcePair(baseSource, upperSource);

    expect(second).toEqual(first);
    expect(baseSource.match(/id="base-boundary-seam"/g)).toHaveLength(1);
    expect(upperSource.match(/id="upper-boundary-seam"/g)).toHaveLength(1);
    expect(first.baseSource).toBe(
      baseSource.replace(/\s*<path\s+id="base-boundary-seam"[^>]*\/>/, ''),
    );
    expect(first.upperSource).toBe(
      upperSource.replace(/\s*<path\s+id="upper-boundary-seam"[^>]*\/>/, ''),
    );
    expect(first.baseSource).not.toContain('base-boundary-seam');
    expect(first.upperSource).not.toContain('upper-boundary-seam');
    expect(() => derivePromotedSoutheastSourcePair(
      baseSource.replace('base-boundary-seam', 'renamed-boundary-seam'),
      upperSource,
    )).toThrow(/missing base-boundary-seam/);
    expect(() => derivePromotedSoutheastSourcePair(
      baseSource,
      upperSource.replace('upper-boundary-seam', 'renamed-boundary-seam'),
    )).toThrow(/missing upper-boundary-seam/);
  });

  it('makes the checked-in 18-file source inventory authoritative and deterministic', async () => {
    expect(A1B_AUTHORED_B_COMPONENTS).toEqual(['base', 'upper']);
    expect(A1B_AUTHORED_B_COMPONENT_IDS).toEqual(EXPECTED_AUTHORED_B_COMPONENTS.map(({ id }) => id));
    expect(A1B_AUTHORED_B_SOURCE_INVENTORY).toEqual(EXPECTED_AUTHORED_B_COMPONENTS);
    expect(new Set(A1B_AUTHORED_B_COMPONENT_IDS).size).toBe(18);

    const first = await compileAuthoredB();
    const second = await compileAuthoredB();
    expect(second).toEqual(first);
    expect(first.map(({ id, frameId, stem, component, sourceFile }) => ({
      id,
      frameId,
      stem,
      component,
      sourceFile,
    }))).toEqual(EXPECTED_AUTHORED_B_COMPONENTS.map((entry) => ({
      ...entry,
      sourceFile: `${A1B_SOURCE_PREFIX}/${entry.filename}`,
    })).map(({ filename: _filename, ...entry }) => entry));

    for (const entry of first) {
      expect(entry.shapes.length, entry.id).toBeGreaterThan(0);
      await expect(readFile(path.resolve(process.cwd(), entry.sourceFile), 'utf8')).resolves.toContain(
        'viewBox="0 0 128 128"',
      );
    }
  });

  it('rejects incomplete, unexpected, and non-path authored source trees', async () => {
    const missingRoot = await clonedAuthoredBSourceTree();
    await rm(path.join(missingRoot, A1B_AUTHORED_B_SOURCE_INVENTORY[0].filename));
    await expect(compileAuthoredB(missingRoot)).rejects.toThrow(/missing/i);

    const unexpectedRoot = await clonedAuthoredBSourceTree();
    await writeFile(
      path.join(unexpectedRoot, 'unexpected.svg'),
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"></svg>',
      'utf8',
    );
    await expect(compileAuthoredB(unexpectedRoot)).rejects.toThrow(/unexpected/i);

    const invalidRoot = await clonedAuthoredBSourceTree();
    const invalidFile = path.join(invalidRoot, A1B_AUTHORED_B_SOURCE_INVENTORY[0].filename);
    const validSource = await readFile(invalidFile, 'utf8');
    await writeFile(
      invalidFile,
      validSource.replace('</svg>', '<rect x="8" y="8" width="16" height="16" fill="#D9D0B9"/></svg>'),
      'utf8',
    );
    await expect(compileAuthoredB(invalidRoot)).rejects.toThrow(/forbidden|convert visible art to paths/i);

    const reservedRoot = await clonedAuthoredBSourceTree();
    const reservedFile = path.join(reservedRoot, A1B_AUTHORED_B_SOURCE_INVENTORY[0].filename);
    const approvedSource = await readFile(reservedFile, 'utf8');
    await writeFile(
      reservedFile,
      approvedSource.replace(A1A_PALETTE.charcoal, '#D69B4B'),
      'utf8',
    );
    await expect(compileAuthoredB(reservedRoot)).rejects.toThrow(/unapproved paint #D69B4B/i);
  });

  it('assembles exactly one authored base and upper source into each split-B frame', async () => {
    const family = await loadA1bAuthoredBFamily({
      inputDir: A1B_SOURCE_DIRECTORY,
      sourcePathPrefix: A1B_SOURCE_PREFIX,
    });
    expect(assembleA1bAuthoredBFrames(family.components)).toEqual(family.frames);
    expect(family.frames.map(({ id }) => id)).toEqual(EXPECTED_STEMS.map((stem) => `b_${stem}`));

    for (const stem of EXPECTED_STEMS) {
      const frameId = `b_${stem}` as const;
      const entries = family.components.filter((entry) => entry.frameId === frameId);
      expect(entries.map(({ component }) => component), frameId).toEqual(['base', 'upper']);
      const base = entries.find(({ component }) => component === 'base')!;
      const upper = entries.find(({ component }) => component === 'upper')!;
      const composedShapes = [...base.shapes, ...upper.shapes];
      const frame = family.frames.find(({ id }) => id === frameId)!;

      expect(base.shapes.every(({ layer }) => layer === 'base'), `${frameId} base layers`).toBe(true);
      expect(upper.shapes.every(({ layer }) => layer === 'upper'), `${frameId} upper layers`).toBe(true);
      expect(frame.shapes, `${frameId} source authority`).toEqual(composedShapes);

      const independent = { ...frame, shapes: composedShapes };
      expect(a1aFrameMarkup(frame), `${frameId} deterministic markup`).toBe(a1aFrameMarkup(independent));
      expect(raster(a1aFrameSvg(frame)).pixels, `${frameId} deterministic pixels`)
        .toEqual(raster(a1aFrameSvg(independent)).pixels);
    }
  });

  it('builds the deterministic 27-frame authored source review order', async () => {
    const components = await compileAuthoredB();
    const frames = buildA1bAuthoredFrames(components);
    const repeated = buildA1bAuthoredFrames(await compileAuthoredB());
    expect(A1B_AUTHORED_STEMS).toEqual(EXPECTED_STEMS);
    expect(repeated).toEqual(frames);
    expect(frames.map(({ id }) => id)).toEqual(EXPECTED_STEMS.flatMap((stem) => [
      `b_${stem}_base`,
      `b_${stem}_upper`,
      `b_${stem}_composed`,
    ]));

    for (const stem of EXPECTED_STEMS) {
      const sourceBase = components.find((entry) => entry.stem === stem && entry.component === 'base')!;
      const sourceUpper = components.find((entry) => entry.stem === stem && entry.component === 'upper')!;
      const [base, upper, composed] = frames.filter((frame) => frame.stem === stem);
      expect([base.kind, upper.kind, composed.kind], stem).toEqual(['base', 'upper', 'composed']);
      expect(base.shapes, `${stem} base source`).toEqual(sourceBase.shapes);
      expect(upper.shapes, `${stem} upper source`).toEqual(sourceUpper.shapes);
      expect(composed.shapes, `${stem} composed source`).toEqual([
        ...sourceBase.shapes,
        ...sourceUpper.shapes,
      ]);
      expect(composed.sourceFiles, `${stem} provenance`).toEqual([
        sourceBase.sourceFile,
        sourceUpper.sourceFile,
      ]);
      expect(a1bAuthoredFrameMarkup(composed), `${stem} paint order`).toBe(
        a1bAuthoredFrameMarkup(base) + a1bAuthoredFrameMarkup(upper),
      );
    }
  });

  // Owner correction 2026-07-20: corner and transitions are authored turns
  // between two distinct axis treatments, so raster transpose identity is no
  // longer a valid contract. The directional geometry gates live in
  // quotaCoHighObliqueEnvelope.test.ts; this suite keeps the frame structure.
  it('keeps corner and transition stems composing base, upper, and composed frames', async () => {
    const frames = buildA1bAuthoredFrames(await compileAuthoredB());
    for (const stem of [
      'full_exterior_corner',
      'transition_n_to_e',
      'transition_w_to_s',
    ] as const) {
      expect(
        frames.filter((frame) => frame.stem === stem).map(({ kind }) => kind),
        `${stem} frame kinds`,
      ).toEqual(['base', 'upper', 'composed']);
    }
  });

  it('grounds each composed turn without exposing the base/upper paint split', async () => {
    const frames = buildA1bAuthoredFrames(await compileAuthoredB());
    const northToEast = frames.find(
      ({ stem, kind }) => stem === 'transition_n_to_e' && kind === 'composed',
    )!;
    const westToSouth = frames.find(
      ({ stem, kind }) => stem === 'transition_w_to_s' && kind === 'composed',
    )!;
    const northToEastRaster = raster(a1aFrameSvg(northToEast));
    const westToSouthRaster = raster(a1aFrameSvg(westToSouth));
    expect(alphaAt(northToEastRaster, 90, 118)).toBeGreaterThan(0);
    expect(alphaAt(northToEastRaster, 110, 118)).toBeGreaterThan(0);
    expect(alphaAt(westToSouthRaster, 118, 90)).toBeGreaterThan(0);
    expect(alphaAt(westToSouthRaster, 118, 110)).toBeGreaterThan(0);
  });

  it('preserves full ingress while north/east stays low and southwest exits full height', async () => {
    const frames = buildA1bAuthoredFrames(await compileAuthoredB());
    const frame = (stem: (typeof EXPECTED_STEMS)[number]) => {
      const source = frames.find(
        (entry) => entry.stem === stem && entry.kind === 'composed',
      )!;
      return raster(a1aFrameSvg(source));
    };
    const fullNorth = frame('full_n_straight');
    const northToEast = frame('transition_n_to_e');
    const fullWest = frame('full_w_straight');
    const westToSouth = frame('transition_w_to_s');

    let northIngressDelta = 0;
    let westIngressDelta = 0;
    let southEgressDelta = 0;
    for (let offset = 0; offset < A1B_CANVAS; offset++) {
      const fullNorthIndex = (offset * fullNorth.width + (fullNorth.width - 1)) * 4;
      const northToEastIndex = offset * northToEast.width * 4;
      const fullWestIndex = ((fullWest.height - 1) * fullWest.width + offset) * 4;
      const westToSouthIndex = offset * 4;
      const promotedSouthIndex = offset * fullNorth.width * 4;
      const southwestExitIndex = (offset * westToSouth.width + (westToSouth.width - 1)) * 4;
      for (let channel = 0; channel < 4; channel++) {
        northIngressDelta = Math.max(
          northIngressDelta,
          Math.abs(
            fullNorth.pixels[fullNorthIndex + channel] -
            northToEast.pixels[northToEastIndex + channel],
          ),
        );
        westIngressDelta = Math.max(
          westIngressDelta,
          Math.abs(
            fullWest.pixels[fullWestIndex + channel] -
            westToSouth.pixels[westToSouthIndex + channel],
          ),
        );
        southEgressDelta = Math.max(
          southEgressDelta,
          Math.abs(
            fullNorth.pixels[promotedSouthIndex + channel] -
            westToSouth.pixels[southwestExitIndex + channel],
          ),
        );
      }
    }
    expect(northIngressDelta, 'full north to north/east ingress').toBeLessThanOrEqual(4);
    expect(westIngressDelta, 'full west to west/south ingress').toBeLessThanOrEqual(4);
    expect(southEgressDelta, 'west/south east edge to promoted full-south west edge')
      .toBeLessThanOrEqual(4);

    // Solid occupancy only: translucent contact shade may overhang the
    // structural band without extending either profile contract.
    const northEgress = Array.from({ length: A1B_CANVAS }, (_, x) => x)
      .filter((x) => alphaAt(northToEast, x, A1B_CANVAS - 1) >= 128);
    const southwestEgress = Array.from({ length: A1B_CANVAS }, (_, y) => y)
      .filter((y) => alphaAt(westToSouth, A1B_CANVAS - 1, y) >= 128);
    expect(northEgress).toEqual(Array.from({ length: 38 }, (_, index) => index + 82));
    expect(southwestEgress).toEqual(Array.from({ length: 64 }, (_, index) => index + 56));
  });

  it('packs a transparent 27-frame 6x5 authored atlas at every export scale', async () => {
    const frames = buildA1bAuthoredFrames(await compileAuthoredB());
    expect([A1B_ATLAS_COLUMNS, A1B_ATLAS_ROWS]).toEqual([6, 5]);

    for (const scale of EXPORT_SCALES) {
      const atlas = a1bAuthoredAtlasDescriptor(frames, scale);
      const stride = A1B_CELL_STRIDE * scale;
      expect(atlas.width).toBe(A1B_ATLAS_COLUMNS * stride);
      expect(atlas.height).toBe(A1B_ATLAS_ROWS * stride);
      expect(atlas.frameSize).toBe(A1B_CANVAS * scale);
      expect(Object.keys(atlas.frames)).toHaveLength(27);
      expect(Math.max(atlas.width, atlas.height), `A1b@${scale}x`).toBeLessThanOrEqual(8192);
      for (const rect of Object.values(atlas.frames)) {
        expect(rect.w).toBe(A1B_CANVAS * scale);
        expect(rect.h).toBe(A1B_CANVAS * scale);
        expect((rect.x - A1B_ATLAS_PADDING * scale) % stride).toBe(0);
        expect((rect.y - A1B_ATLAS_PADDING * scale) % stride).toBe(0);
        expect(rect.x + rect.w).toBeLessThanOrEqual(atlas.width);
        expect(rect.y + rect.h).toBeLessThanOrEqual(atlas.height);
      }
    }

    const atlas = a1bAuthoredAtlasDescriptor(frames, 1);
    expect(atlas).toMatchObject({
      version: 0,
      status: 'authored-source-proof',
      contract: false,
      meta: {
        temporaryFrameIds: true,
        productionRegistration: false,
        completeBlobFamily: false,
        directionalCastShadow: false,
      },
    });
    const source = a1bAuthoredAtlasSvg(frames, 1);
    expect(source).not.toMatch(/<text|checker|panel/i);
    const rendered = raster(source);
    expect([rendered.width, rendered.height]).toEqual([atlas.width, atlas.height]);

    for (let index = 0; index < frames.length; index++) {
      const frame = frames[index];
      const rect = atlas.frames[frame.id];
      const frameCounts = alphaCounts(rendered, rect.x, rect.y, rect.w, rect.h);
      expect(frameCounts.painted, frame.id).toBeGreaterThan(0);
      expect(frameCounts.transparent, `${frame.id} transparent canvas`).toBeGreaterThan(0);

      const cellX = (index % A1B_ATLAS_COLUMNS) * A1B_CELL_STRIDE;
      const cellY = Math.floor(index / A1B_ATLAS_COLUMNS) * A1B_CELL_STRIDE;
      const top = alphaCounts(rendered, cellX, cellY, A1B_CELL_STRIDE, A1B_ATLAS_PADDING);
      const bottom = alphaCounts(
        rendered,
        cellX,
        cellY + A1B_ATLAS_PADDING + A1B_CANVAS,
        A1B_CELL_STRIDE,
        A1B_ATLAS_PADDING,
      );
      const left = alphaCounts(rendered, cellX, cellY, A1B_ATLAS_PADDING, A1B_CELL_STRIDE);
      const right = alphaCounts(
        rendered,
        cellX + A1B_ATLAS_PADDING + A1B_CANVAS,
        cellY,
        A1B_ATLAS_PADDING,
        A1B_CELL_STRIDE,
      );
      expect([top.painted, bottom.painted, left.painted, right.painted], `${frame.id} gutter`)
        .toEqual([0, 0, 0, 0]);
    }

    for (let index = frames.length; index < A1B_ATLAS_COLUMNS * A1B_ATLAS_ROWS; index++) {
      const cellX = (index % A1B_ATLAS_COLUMNS) * A1B_CELL_STRIDE;
      const cellY = Math.floor(index / A1B_ATLAS_COLUMNS) * A1B_CELL_STRIDE;
      expect(
        alphaCounts(rendered, cellX, cellY, A1B_CELL_STRIDE, A1B_CELL_STRIDE).painted,
        `unused cell ${index}`,
      ).toBe(0);
    }
  });

  it('preserves the approved product palette and excludes reserved signal colors at source and compile time', async () => {
    const allowedTokens = new Set(['cream', 'green', 'teal']);
    const allowedLiterals = new Set([
      '#FFFFFF',
      '#000000',
      A1A_PALETTE.coral,
      A1A_PALETTE.charcoal,
      A1A_PALETTE.glass,
      A1A_PALETTE.metal,
    ].map((value) => value.toUpperCase()));
    const forbidden = new Set(['#D69B4B', '#D8638F']);
    const usedTokens = new Set<string>();
    const compiled = await compileAuthoredB();

    for (const inventory of A1B_AUTHORED_B_SOURCE_INVENTORY) {
      const source = (await readFile(path.join(A1B_SOURCE_DIRECTORY, inventory.filename), 'utf8')).toUpperCase();
      for (const reserved of forbidden) expect(source, `${inventory.filename} uses ${reserved}`).not.toContain(reserved);
    }

    for (const entry of compiled) {
      for (const candidate of entry.shapes) {
        expect(candidate.silhouette, `${entry.id} must stay detail-only proof art`).toBe(false);
        expect(tileShapeIsTintImpure(candidate), entry.id).toBe(false);
        for (const paint of [candidate.fill, candidate.stroke]) {
          if (paint === undefined) continue;
          if (paint.startsWith('$')) {
            const token = paint.slice(1);
            usedTokens.add(token);
            expect(allowedTokens.has(token), `${entry.id} token ${token}`).toBe(true);
          } else {
            expect(allowedLiterals.has(paint.toUpperCase()), `${entry.id} literal ${paint}`).toBe(true);
          }
          const resolved = resolveA1aPaint(paint).toUpperCase();
          expect(forbidden.has(resolved), `${entry.id} reserved paint ${resolved}`).toBe(false);
          if (resolved === A1A_PALETTE.coral.toUpperCase()) {
            expect(candidate.silhouette, `${entry.id} coral must remain static detail`).toBe(false);
          }
        }
      }
    }

    // Owner-blessed directional treatments 2026-07-20: the reference shows no
    // teal on low straights, so the root family paints cream/green product
    // fields plus literal coral; the teal service register is retired here.
    expect([...usedTokens].sort()).toEqual(['cream', 'green']);
  });

  it('compiles and composes without mutating production registrations or wall masks', async () => {
    const before = productionSignature();
    const family = await loadA1bAuthoredBFamily({
      inputDir: A1B_SOURCE_DIRECTORY,
      sourcePathPrefix: A1B_SOURCE_PREFIX,
    });
    for (const frame of family.frames) {
      a1aFrameSvg(frame);
    }
    expect(productionSignature()).toBe(before);

    const productionIds = new Set([
      ...WALL_TEMPLATES.map(({ id }) => id),
      ...FLOOR_TEMPLATES.map(({ id }) => id),
      ...PROP_TEMPLATES.map(({ id }) => id),
    ]);
    for (const entry of family.components) {
      expect(productionIds.has(entry.id), entry.id).toBe(false);
      expect(productionIds.has(entry.frameId), entry.frameId).toBe(false);
    }
    expect(a1aAtlasDescriptor(1)).toMatchObject({
      status: 'proof-only',
      contract: false,
      meta: { productionRegistration: false },
    });
  });
});

describe('QuotaCo high-oblique A1a proof isolation', () => {
  it('freezes the approved 29-frame inventory before map construction', () => {
    expect(A1A_SHARED_FRAME_IDS).toEqual(EXPECTED_SHARED);
    expect(A1A_COMPARISON_STEMS).toEqual(EXPECTED_STEMS);

    const expectedIds = [
      ...EXPECTED_SHARED,
      ...EXPECTED_STEMS.map((stem) => `a_${stem}`),
      ...EXPECTED_STEMS.map((stem) => `b_${stem}`),
    ];
    const actualIds = A1A_PROOF_FRAMES.map((frame) => frame.id);
    expect(actualIds).toEqual(expectedIds);
    expect(actualIds).toHaveLength(29);
    expect(new Set(actualIds).size).toBe(actualIds.length);
    expect(actualIds.some((id) => /^mask_\d+$/.test(id))).toBe(false);

    for (const stem of EXPECTED_STEMS) {
      expect(getA1aProofFrame(`a_${stem}`).construction).toBe('a-monolithic');
      expect(getA1aProofFrame(`b_${stem}`).construction).toBe('b-split');
    }
  });

  it('packs every existing export scale into an aligned padded 8x4 atlas', () => {
    expect(EXPORT_SCALES).toEqual([1, 2, 4]);
    for (const scale of EXPORT_SCALES) {
      const atlas = a1aAtlasDescriptor(scale);
      const stride = A1A_CELL_STRIDE * scale;
      expect(atlas.columns).toBe(A1A_ATLAS_COLUMNS);
      expect(atlas.rows).toBe(A1A_ATLAS_ROWS);
      expect(atlas.width).toBe(A1A_ATLAS_COLUMNS * stride);
      expect(atlas.height).toBe(A1A_ATLAS_ROWS * stride);
      expect(Math.max(atlas.width, atlas.height)).toBeLessThanOrEqual(8192);
      expect(Object.keys(atlas.frames)).toHaveLength(29);

      const rects = Object.values(atlas.frames);
      for (const frame of rects) {
        expect(frame.w).toBe(A1A_CANVAS * scale);
        expect(frame.h).toBe(A1A_CANVAS * scale);
        expect((frame.x - A1A_ATLAS_PADDING * scale) % stride).toBe(0);
        expect((frame.y - A1A_ATLAS_PADDING * scale) % stride).toBe(0);
        expect(frame.x + frame.w).toBeLessThanOrEqual(atlas.width);
        expect(frame.y + frame.h).toBeLessThanOrEqual(atlas.height);
      }
      for (let left = 0; left < rects.length; left++) {
        for (let right = left + 1; right < rects.length; right++) {
          const a = rects[left];
          const b = rects[right];
          const overlaps = a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
          expect(overlaps).toBe(false);
        }
      }
    }
  });

  it('renders a genuinely transparent raw atlas with empty gutters and unused cells', () => {
    const descriptor = a1aAtlasDescriptor(1);
    const source = a1aAtlasSvg(1);
    expect(source).not.toMatch(/<text|checker|panel/i);
    const rendered = raster(source);
    expect(rendered.width).toBe(descriptor.width);
    expect(rendered.height).toBe(descriptor.height);

    for (let index = 0; index < A1A_PROOF_FRAMES.length; index++) {
      const frame = A1A_PROOF_FRAMES[index];
      const rect = descriptor.frames[frame.id];
      const counts = alphaCounts(rendered, rect.x, rect.y, rect.w, rect.h);
      expect(counts.painted, frame.id).toBeGreaterThan(0);
      if (!frame.id.startsWith('shared_floor')) {
        expect(counts.transparent, `${frame.id} should retain transparent canvas`).toBeGreaterThan(0);
      }

      const cellX = (index % A1A_ATLAS_COLUMNS) * A1A_CELL_STRIDE;
      const cellY = Math.floor(index / A1A_ATLAS_COLUMNS) * A1A_CELL_STRIDE;
      const top = alphaCounts(rendered, cellX, cellY, A1A_CELL_STRIDE, A1A_ATLAS_PADDING);
      const bottom = alphaCounts(
        rendered,
        cellX,
        cellY + A1A_ATLAS_PADDING + A1A_CANVAS,
        A1A_CELL_STRIDE,
        A1A_ATLAS_PADDING,
      );
      const left = alphaCounts(rendered, cellX, cellY, A1A_ATLAS_PADDING, A1A_CELL_STRIDE);
      const right = alphaCounts(
        rendered,
        cellX + A1A_ATLAS_PADDING + A1A_CANVAS,
        cellY,
        A1A_ATLAS_PADDING,
        A1A_CELL_STRIDE,
      );
      expect([top.painted, bottom.painted, left.painted, right.painted], `${frame.id} gutter`).toEqual([0, 0, 0, 0]);
    }

    for (let index = A1A_PROOF_FRAMES.length; index < A1A_ATLAS_COLUMNS * A1A_ATLAS_ROWS; index++) {
      const cellX = (index % A1A_ATLAS_COLUMNS) * A1A_CELL_STRIDE;
      const cellY = Math.floor(index / A1A_ATLAS_COLUMNS) * A1A_CELL_STRIDE;
      expect(alphaCounts(rendered, cellX, cellY, A1A_CELL_STRIDE, A1A_CELL_STRIDE).painted).toBe(0);
    }
  });

  it('keeps palette fields separate from literal hardware and reserved signals', () => {
    const allowedTokens = new Set(['floor', 'floorAlternate', 'cream', 'green', 'teal']);
    const forbidden = new Set(['#D69B4B', '#D8638F']);
    const usedTokens = new Set<string>();
    const resolvedPaint = new Set<string>();

    for (const frame of A1A_PROOF_FRAMES) {
      expect(frame.shapes.some((shape) => shape.layer === ('shadow' as never)), frame.id).toBe(false);
      for (const candidate of frame.shapes) {
        expect(tileShapeIsTintImpure(candidate), frame.id).toBe(false);
        for (const paint of [candidate.fill, candidate.stroke]) {
          if (paint === undefined) continue;
          if (paint.startsWith('$')) {
            const token = paint.slice(1);
            usedTokens.add(token);
            expect(allowedTokens.has(token), `${frame.id} token ${token}`).toBe(true);
          }
          resolvedPaint.add(resolveA1aPaint(paint).toUpperCase());
        }
        if (candidate.layer === 'literal') {
          expect(candidate.fill?.startsWith('$') ?? false, `${frame.id} literal fill`).toBe(false);
          expect(candidate.stroke?.startsWith('$') ?? false, `${frame.id} literal stroke`).toBe(false);
        }
      }
    }

    expect([...usedTokens].sort()).toEqual(['cream', 'floor', 'floorAlternate', 'green', 'teal']);
    for (const value of Object.values(A1A_PALETTE)) resolvedPaint.add(value.toUpperCase());
    for (const signal of forbidden) expect(resolvedPaint.has(signal)).toBe(false);
  });

  it('makes each split-B frame an exact base-then-upper markup composition', () => {
    for (const stem of EXPECTED_STEMS) {
      const id = `b_${stem}` as const;
      const frame = getA1aProofFrame(id);
      const layers = a1aComponentLayers(frame);
      const base = a1aFrameMarkup(frame, layers.base);
      const upper = a1aFrameMarkup(frame, layers.upper);
      const combined = a1aFrameMarkup(frame);
      expect(base.length, `${id} base`).toBeGreaterThan(0);
      expect(upper.length, `${id} upper`).toBeGreaterThan(0);
      expect(combined).toBe(base + upper);

      const combinedPixels = raster(a1aFrameSvg(frame)).pixels;
      expect(combinedPixels).not.toEqual(raster(a1aFrameSvg(frame, A1A_CANVAS, layers.base)).pixels);
      expect(combinedPixels).not.toEqual(raster(a1aFrameSvg(frame, A1A_CANVAS, layers.upper)).pixels);
    }
  });

  it('enforces the provisional profile and opening ruler in raster space', () => {
    const lowSouth = alphaBounds('shared_low_s_straight');
    const lowEast = alphaBounds('shared_low_e_straight');
    const fullNorth = alphaBounds('a_full_n_straight');
    expect(lowSouth.maxY - lowSouth.minY + 1).toBeLessThanOrEqual(A1A_RULER.lowProfile + 4);
    expect(lowEast.maxX - lowEast.minX + 1).toBeLessThanOrEqual(A1A_RULER.lowProfile + 4);
    expect(lowSouth.maxY - fullNorth.minY + 1).toBeGreaterThanOrEqual(A1A_RULER.fullProfile);

    const openDoor = raster(a1aFrameSvg('a_door_open'));
    const closedDoor = raster(a1aFrameSvg('a_door_closed'));
    expect(alphaAt(openDoor, 64, 80), 'open doorway centre').toBe(0);
    expect(alphaAt(closedDoor, 64, 80), 'closed doorway centre').toBeGreaterThan(0);
  });

  it('uses the approved close, normal, and far review sizes', () => {
    expect(A1A_REVIEW_SIZES).toEqual({ close: 240, normal: 90, far: 40 });
  });

  it('cannot appear in production templates, wall masks, or schema state', () => {
    const productionIds = new Set([
      ...WALL_TEMPLATES.map((template) => template.id),
      ...FLOOR_TEMPLATES.map((template) => template.id),
      ...PROP_TEMPLATES.map((template) => template.id),
    ]);
    for (const frame of A1A_PROOF_FRAMES) expect(productionIds.has(frame.id), frame.id).toBe(false);

    const productionWall = wallAtlas(DEFAULT_WALLS[0], DEFAULT_STYLE, 1);
    expect(Object.keys(productionWall.frames)).toEqual(
      Array.from({ length: BLOB_TILE_COUNT }, (_, index) => `mask_${index}`),
    );
    expect(Object.keys(productionWall.frames).some((id) => id.includes('high-oblique') || id.startsWith('a_') || id.startsWith('b_'))).toBe(false);
    expect(CURRENT_SCHEMA_VERSION).toBe(18);
  });
});
