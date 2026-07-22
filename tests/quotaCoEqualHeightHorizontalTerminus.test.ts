import { readFileSync } from 'node:fs';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import {
  A1B_AUTHORED_B_SOURCE_INVENTORY,
  loadA1bAuthoredBFamily,
} from '../scripts/highOblique/a1bAuthored';
import {
  EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE,
  equalHeightHorizontalTerminusEvidenceRuns,
  equalHeightHorizontalTerminusRun,
  validateEqualHeightHorizontalTerminusGate,
} from '../scripts/highOblique/equalHeightHorizontalTerminusGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from '../scripts/highOblique/equalHeightMaskLedger';
import { PROMOTED_SOUTH_WALL_REUSE } from '../scripts/highOblique/equalHeightWallDirection';
import { wallAtlas } from '../src/core/exporter';
import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import { DEFAULT_STYLE, DEFAULT_WALLS } from '../src/data/defaults';
import { PROP_TEMPLATES } from '../src/props/templates';
import { BLOB_TILE_COUNT, blobContract, configForIndex } from '../src/tiles/blob';
import { FLOOR_TEMPLATES, WALL_TEMPLATES } from '../src/tiles/templates';

const SOURCE_PREFIX = 'assets/walls/quota-co-building-system';
const SOURCE_DIRECTORY = path.resolve(process.cwd(), SOURCE_PREFIX);
const RASTER_SCALE = 4;

type Layer = 'base' | 'upper' | 'composed';

interface Raster {
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint8Array;
}

const stripSvgShell = (source: string): string =>
  source.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

function sourceMarkup(filename: string): string {
  return stripSvgShell(readFileSync(path.join(SOURCE_DIRECTORY, filename), 'utf8'));
}

function rasterLayer(
  baseFile: string,
  upperFile: string,
  layer: Layer,
  mirrorX = false,
): Raster {
  const content =
    (layer === 'base' || layer === 'composed' ? sourceMarkup(baseFile) : '') +
    (layer === 'upper' || layer === 'composed' ? sourceMarkup(upperFile) : '');
  const transformed = mirrorX
    ? `<g transform="${EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE.terminusSource.mirrorMatrix}">${content}</g>`
    : content;
  const rendered = new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${128 * RASTER_SCALE}" height="${128 * RASTER_SCALE}" ` +
    `viewBox="0 0 128 128">${transformed}</svg>`,
    { font: { loadSystemFonts: false } },
  ).render();
  return { width: rendered.width, height: rendered.height, pixels: rendered.pixels };
}

function regionMismatchCount(
  first: Raster,
  second: Raster,
  startX: number,
  endX: number,
): number {
  expect([first.width, first.height]).toEqual([second.width, second.height]);
  let mismatches = 0;
  for (let y = 0; y < first.height; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      const offset = (y * first.width + x) * 4;
      if ([0, 1, 2, 3].some((channel) => first.pixels[offset + channel] !== second.pixels[offset + channel])) {
        mismatches += 1;
      }
    }
  }
  return mismatches;
}

function mirrorMismatchStats(direct: Raster, mirrored: Raster): {
  readonly pixels: number;
  readonly alphaPixels: number;
  readonly maxChannelDelta: number;
} {
  expect([direct.width, direct.height]).toEqual([mirrored.width, mirrored.height]);
  let pixels = 0;
  let alphaPixels = 0;
  let maxChannelDelta = 0;
  for (let y = 0; y < direct.height; y += 1) {
    for (let x = 0; x < direct.width; x += 1) {
      const directOffset = (y * direct.width + x) * 4;
      const mirroredOffset = (y * mirrored.width + (mirrored.width - 1 - x)) * 4;
      let mismatch = false;
      for (const channel of [0, 1, 2, 3]) {
        const delta = Math.abs(
          direct.pixels[directOffset + channel] - mirrored.pixels[mirroredOffset + channel],
        );
        if (delta > 0) mismatch = true;
        maxChannelDelta = Math.max(maxChannelDelta, delta);
      }
      if (mismatch) pixels += 1;
      if (direct.pixels[directOffset + 3] !== mirrored.pixels[mirroredOffset + 3]) alphaPixels += 1;
    }
  }
  return { pixels, alphaPixels, maxChannelDelta };
}

function productionSignature(): string {
  return JSON.stringify({
    schemaVersion: CURRENT_SCHEMA_VERSION,
    blob: blobContract(),
    walls: WALL_TEMPLATES.map(({ id }) => id),
    floors: FLOOR_TEMPLATES.map(({ id }) => id),
    props: PROP_TEMPLATES.map(({ id }) => id),
    defaults: DEFAULT_WALLS.map(({ id, templateId }) => ({ id, templateId })),
    wallAtlas: wallAtlas(DEFAULT_WALLS[0], DEFAULT_STYLE, 1),
  });
}

const productionBefore = productionSignature();

describe('QuotaCo owner-accepted proof-layer equal-height horizontal terminus gate', () => {
  it('promotes exactly the two canonical horizontal one-link rows', () => {
    expect(EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE).toMatchObject({
      stem: 'equal-height-horizontal-terminus-gate',
      version: 0,
      status: 'owner-accepted-horizontal-terminus-gate',
      contract: false,
      canvas: 128,
      reviewCellSizes: [90, 40],
      bodyRunLengths: [1, 3, 6],
      socketAuditLayers: ['base', 'upper', 'composed'],
      rotationAllowed: false,
      ledgerRowsAccepted: [2, 8],
      productionRegistration: false,
      exportable: false,
    });
    expect(EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE.cases).toEqual([
      expect.objectContaining({
        maskId: 'mask_8', index: 8, canonicalMask: 0x08, connectedEdge: 'w',
        capFacing: 'e', resolution: 'direct-reuse', transform: 'none',
      }),
      expect.objectContaining({
        maskId: 'mask_2', index: 2, canonicalMask: 0x02, connectedEdge: 'e',
        capFacing: 'w', resolution: 'approved-derivation', transform: 'mirror-x',
      }),
    ]);
    expect(configForIndex(8)).toMatchObject({ n: false, e: false, s: false, w: true });
    expect(configForIndex(2)).toMatchObject({ n: false, e: true, s: false, w: false });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[8].resolution).toMatchObject({
      kind: 'direct-reuse',
      status: 'accepted-source-mapping',
      variants: [{
        role: 'east-cap-terminus',
        sourceStem: 'full_terminus',
        baseFile: 'full_terminus-base.svg',
        upperFile: 'full_terminus-upper.svg',
        transform: 'none',
        derivation: 'none',
        facingRule: 'connected west; exposed molded cap faces east',
      }],
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[2].resolution).toMatchObject({
      kind: 'approved-derivation',
      status: 'accepted-source-mapping',
      variants: [{
        role: 'west-cap-terminus',
        sourceStem: 'full_terminus',
        baseFile: 'full_terminus-base.svg',
        upperFile: 'full_terminus-upper.svg',
        transform: 'mirror-x',
        derivation: 'none',
        facingRule: 'connected east; exposed molded cap faces west through the accepted whole-cell X mirror',
      }],
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[8]).toMatchObject({
      topologyClass: 'terminus', connectedEdges: ['w'], exposedEdges: ['n', 'e', 's'],
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[2]).toMatchObject({
      topologyClass: 'terminus', connectedEdges: ['e'], exposedEdges: ['n', 's', 'w'],
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
      'direct-reuse': 4,
      'approved-derivation': 6,
      'synthetic-assembly': 36,
      'unresolved-authored-geometry': 1,
    });
  });

  it('loads the exact existing split source pair and keeps one centered mirror contract', async () => {
    const family = await loadA1bAuthoredBFamily({
      inputDir: SOURCE_DIRECTORY,
      sourcePathPrefix: SOURCE_PREFIX,
    });
    const inventory = A1B_AUTHORED_B_SOURCE_INVENTORY
      .filter(({ stem }) => stem === 'full_terminus')
      .map(({ filename }) => filename);
    expect(inventory).toEqual(['full_terminus-base.svg', 'full_terminus-upper.svg']);
    expect(family.components.filter(({ stem }) => stem === 'full_terminus').map(({ sourceFile }) => sourceFile))
      .toEqual(inventory.map((filename) => `${SOURCE_PREFIX}/${filename}`));
    expect(EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE.terminusSource).toEqual({
      sourceStem: 'full_terminus',
      baseFile: 'full_terminus-base.svg',
      upperFile: 'full_terminus-upper.svg',
      mirrorAxis: 64,
      mirrorMatrix: 'matrix(-1 0 0 1 128 0)',
      pivot: { x: 0.5, y: 0.5 },
    });
  });

  it('locks the approved socket polish and molded cap vocabulary in source', () => {
    const base = readFileSync(
      path.join(SOURCE_DIRECTORY, EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE.terminusSource.baseFile),
      'utf8',
    );
    const upper = readFileSync(
      path.join(SOURCE_DIRECTORY, EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE.terminusSource.upperFile),
      'utf8',
    );
    expect(base).toContain('id="base-contour" d="M 0 95 H 96 V 92 H 102 A 10 10 0 0 1 112 102');
    expect(base).toContain('id="base-field" d="M 0 97 H 96 V 94 H 101 A 8 8 0 0 1 109 102');
    expect(base).toContain('id="base-contact-shade" d="M 0 120 H 96 V 123.5 H 0 Z"');
    for (const id of [
      'upper-contour',
      'upper-shell',
      'upper-end-face-shade',
      'upper-post-green',
      'upper-end-reveal-light',
      'upper-end-divider-seam',
    ]) {
      expect(upper).toContain(`id="${id}"`);
    }
    expect(upper).toContain('id="upper-reveal-light" d="M 0 58 H 102 V 63 H 0 Z"');
    expect(upper).toContain('id="upper-green-handoff" d="M 0 94 H 109 V 97 H 0 Z"');
  });

  it('inherits the accepted horizontal ingress exactly in base, upper, and composed layers', () => {
    const gate = EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE;
    for (const layer of gate.socketAuditLayers) {
      const straight = rasterLayer(
        gate.bodySource.baseFile,
        gate.bodySource.upperFile,
        layer,
      );
      const terminus = rasterLayer(
        gate.terminusSource.baseFile,
        gate.terminusSource.upperFile,
        layer,
      );
      expect(
        regionMismatchCount(straight, terminus, 0, 96 * RASTER_SCALE),
        `${layer} direct west ingress`,
      ).toBe(0);

      const mirroredStraight = rasterLayer(
        gate.bodySource.baseFile,
        gate.bodySource.upperFile,
        layer,
        true,
      );
      const mirroredTerminus = rasterLayer(
        gate.terminusSource.baseFile,
        gate.terminusSource.upperFile,
        layer,
        true,
      );
      expect(
        regionMismatchCount(
          mirroredStraight,
          mirroredTerminus,
          32 * RASTER_SCALE,
          128 * RASTER_SCALE,
        ),
        `${layer} mirrored east ingress`,
      ).toBe(0);
    }
  });

  it('derives the opposite cap as an exact whole-cell X mirror without rotation', () => {
    const gate = EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE;
    for (const layer of gate.socketAuditLayers) {
      const direct = rasterLayer(
        gate.terminusSource.baseFile,
        gate.terminusSource.upperFile,
        layer,
      );
      const mirrored = rasterLayer(
        gate.terminusSource.baseFile,
        gate.terminusSource.upperFile,
        layer,
        true,
      );
      const stats = mirrorMismatchStats(direct, mirrored);
      // Resvg may quantize the two sides of an antialiased curve one 4x sample
      // apart. The transform itself is exact; confine that renderer tolerance
      // to fewer than 25 edge pixels and never more than one 4-bit step.
      expect(stats.pixels, `${layer} mirror antialias footprint`).toBeLessThanOrEqual(24);
      expect(stats.alphaPixels, `${layer} mirror alpha footprint`).toBeLessThanOrEqual(8);
      expect(stats.maxChannelDelta, `${layer} mirror channel delta`).toBeLessThanOrEqual(16);
    }
    const source = readFileSync(
      path.join(SOURCE_DIRECTORY, gate.terminusSource.upperFile),
      'utf8',
    );
    expect(source).not.toMatch(/\brotate\s*\(|matrix\(0\s/i);
  });

  it('covers both handednesses at 1/3/6 body cells and 90/40 pixels', () => {
    const evidence = equalHeightHorizontalTerminusEvidenceRuns();
    expect(evidence).toHaveLength(12);
    expect(new Set(evidence.map(({ maskId, bodyLength, cellSize }) =>
      `${maskId}/${bodyLength}/${cellSize}`)).size).toBe(12);
    for (const run of evidence) {
      expect(run.totalCells).toBe(run.bodyLength + 1);
      expect(run.pixelWidth).toBe((run.bodyLength + 1) * run.cellSize);
      expect(run.pixelHeight).toBe(run.cellSize);
      const cells = equalHeightHorizontalTerminusRun(
        run.maskId === 'mask_8' ? 8 : 2,
        run.bodyLength,
      );
      expect(cells).toHaveLength(run.totalCells);
      expect(cells.filter(({ role }) => role === 'terminus')).toHaveLength(1);
      expect(cells.at(run.order === 'body-then-terminus' ? -1 : 0)).toMatchObject({
        role: 'terminus',
        transform: run.maskId === 'mask_8' ? 'none' : 'mirror-x',
      });
    }
  });

  it('keeps vertical ends owned by their separate gate and preserves every production-facing contract', () => {
    expect(EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE.verticalSuccessors).toEqual([
      { maskId: 'mask_1', index: 1, connectedEdge: 'n', status: 'resolved-by-separate-vertical-gate' },
      { maskId: 'mask_4', index: 4, connectedEdge: 's', status: 'resolved-by-separate-vertical-gate' },
    ]);
    const demoted = structuredClone(EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE) as any;
    demoted.status = 'proof-only-review';
    expect(() => validateEqualHeightHorizontalTerminusGate(demoted)).toThrow(/invalid status/);
    const rotated = structuredClone(EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE) as any;
    rotated.rotationAllowed = true;
    expect(() => validateEqualHeightHorizontalTerminusGate(rotated)).toThrow(/proof-only boundary/);
    validateEqualHeightHorizontalTerminusGate();
    equalHeightHorizontalTerminusEvidenceRuns();
    expect(productionSignature()).toBe(productionBefore);
    expect(CURRENT_SCHEMA_VERSION).toBe(18);
    expect(blobContract()).toMatchObject({ version: 1, tileCount: 47 });
    expect(Object.keys(wallAtlas(DEFAULT_WALLS[0], DEFAULT_STYLE, 1).frames)).toEqual(
      Array.from({ length: BLOB_TILE_COUNT }, (_, index) => `mask_${index}`),
    );
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[0].resolution.kind)
      .toBe('unresolved-authored-geometry');
    expect([1, 4].map((index) => EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution.kind))
      .toEqual(Array(2).fill('approved-derivation'));
  });
});
