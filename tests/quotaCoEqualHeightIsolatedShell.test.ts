import { readFileSync } from 'node:fs';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import {
  A1B_ISOLATED_SHELL_PROPOSAL_SOURCE_INVENTORY,
  compileA1bIsolatedShellProposalDirectory,
} from '../scripts/highOblique/a1bIsolatedShellProposal';
import { A1B_AUTHORED_STEMS } from '../scripts/highOblique/a1bAuthoredProof';
import {
  EQUAL_HEIGHT_ISOLATED_SHELL_GATE,
  validateEqualHeightIsolatedShellGate,
} from '../scripts/highOblique/equalHeightIsolatedShellGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from '../scripts/highOblique/equalHeightMaskLedger';
import { wallAtlas } from '../src/core/exporter';
import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import { DEFAULT_STYLE, DEFAULT_WALLS } from '../src/data/defaults';
import { PROP_TEMPLATES } from '../src/props/templates';
import { BLOB_CONFIGS, BLOB_TILE_COUNT, blobContract, configForIndex } from '../src/tiles/blob';
import { FLOOR_TEMPLATES, WALL_TEMPLATES } from '../src/tiles/templates';

const PROPOSAL_PREFIX = 'assets/walls/quota-co-building-system-proofs/isolated-shell';
const PROPOSAL_DIRECTORY = path.resolve(process.cwd(), PROPOSAL_PREFIX);

interface Raster {
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint8Array;
}

const stripSvgShell = (source: string): string =>
  source.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

function sourceMarkup(filename: string): string {
  return stripSvgShell(readFileSync(path.join(PROPOSAL_DIRECTORY, filename), 'utf8'));
}

function rasterComposed(size: number): Raster {
  const gate = EQUAL_HEIGHT_ISOLATED_SHELL_GATE;
  const source =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">` +
    sourceMarkup(gate.baseFile) + sourceMarkup(gate.upperFile) + '</svg>';
  const rendered = new Resvg(source, {
    fitTo: { mode: 'width', value: size },
    font: { loadSystemFonts: false },
  }).render();
  return { width: rendered.width, height: rendered.height, pixels: rendered.pixels };
}

function alphaBounds(raster: Raster): {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
} {
  let minX = raster.width;
  let minY = raster.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < raster.height; y += 1) {
    for (let x = 0; x < raster.width; x += 1) {
      if (raster.pixels[(y * raster.width + x) * 4 + 3] > 0) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

function opaqueComponents(raster: Raster): number {
  const occupied = new Set<number>();
  for (let y = 0; y < raster.height; y += 1) {
    for (let x = 0; x < raster.width; x += 1) {
      const index = y * raster.width + x;
      if (raster.pixels[index * 4 + 3] >= 24) occupied.add(index);
    }
  }
  let components = 0;
  while (occupied.size > 0) {
    components += 1;
    const first = occupied.values().next().value as number;
    const queue = [first];
    occupied.delete(first);
    while (queue.length > 0) {
      const index = queue.pop()!;
      const x = index % raster.width;
      const y = Math.floor(index / raster.width);
      for (const [nextX, nextY] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nextX < 0 || nextY < 0 || nextX >= raster.width || nextY >= raster.height) continue;
        const next = nextY * raster.width + nextX;
        if (occupied.delete(next)) queue.push(next);
      }
    }
  }
  return components;
}

function exactColorCount(raster: Raster, rgb: readonly [number, number, number]): number {
  let count = 0;
  for (let offset = 0; offset < raster.pixels.length; offset += 4) {
    if (
      raster.pixels[offset] === rgb[0] &&
      raster.pixels[offset + 1] === rgb[1] &&
      raster.pixels[offset + 2] === rgb[2] &&
      raster.pixels[offset + 3] === 255
    ) count += 1;
  }
  return count;
}

function nearbyColorCount(
  raster: Raster,
  rgb: readonly [number, number, number],
  tolerance = 20,
): number {
  let count = 0;
  for (let offset = 0; offset < raster.pixels.length; offset += 4) {
    if (
      Math.abs(raster.pixels[offset] - rgb[0]) <= tolerance &&
      Math.abs(raster.pixels[offset + 1] - rgb[1]) <= tolerance &&
      Math.abs(raster.pixels[offset + 2] - rgb[2]) <= tolerance &&
      raster.pixels[offset + 3] >= 220
    ) count += 1;
  }
  return count;
}

function productionSignature(): string {
  return JSON.stringify({
    schemaVersion: CURRENT_SCHEMA_VERSION,
    blob: blobContract(),
    blobConfigs: BLOB_CONFIGS,
    wallStems: A1B_AUTHORED_STEMS,
    walls: WALL_TEMPLATES.map(({ id }) => id),
    floors: FLOOR_TEMPLATES.map(({ id }) => id),
    props: PROP_TEMPLATES.map(({ id }) => id),
    defaults: DEFAULT_WALLS.map(({ id, templateId }) => ({ id, templateId })),
    wallAtlas: wallAtlas(DEFAULT_WALLS[0], DEFAULT_STYLE, 1),
  });
}

const productionBefore = productionSignature();

describe('QuotaCo owner-accepted proof-layer equal-height isolated shell', () => {
  it('keeps one strict two-layer source pair outside the canonical source bank', async () => {
    expect(A1B_ISOLATED_SHELL_PROPOSAL_SOURCE_INVENTORY).toEqual([
      {
        id: 'isolated_shell-base', filename: 'isolated_shell-base.svg',
        layer: 'base', semanticGroup: 'detail/base',
      },
      {
        id: 'isolated_shell-upper', filename: 'isolated_shell-upper.svg',
        layer: 'upper', semanticGroup: 'detail/upper',
      },
    ]);
    const compiled = await compileA1bIsolatedShellProposalDirectory({
      inputDir: PROPOSAL_DIRECTORY,
      sourcePathPrefix: PROPOSAL_PREFIX,
    });
    expect(compiled.map(({ sourceFile }) => sourceFile)).toEqual([
      `${PROPOSAL_PREFIX}/isolated_shell-base.svg`,
      `${PROPOSAL_PREFIX}/isolated_shell-upper.svg`,
    ]);
    expect(compiled.every(({ shapes }) => shapes.length > 0)).toBe(true);
    expect(A1B_AUTHORED_STEMS).not.toContain('isolated_shell');
    for (const { content } of compiled) {
      expect(content).not.toMatch(/\btransform\s*=|\brotate\s*\(/i);
    }
  });

  it('accepts canonical mask_0 as one direct external proof source', () => {
    expect(EQUAL_HEIGHT_ISOLATED_SHELL_GATE).toMatchObject({
      stem: 'equal-height-isolated-shell-gate',
      status: 'owner-accepted-isolated-shell-gate',
      maskId: 'mask_0',
      index: 0,
      canonicalMask: 0x00,
      topologyClass: 'isolated',
      connectedEdges: [],
      exposedEdges: ['n', 'e', 's', 'w'],
      reviewCellSizes: [240, 90, 40],
      ledgerRowsUnderReview: [],
      ledgerRowsAccepted: [0],
      rotationAllowed: false,
      xMirrorAllowed: false,
      yMirrorAllowed: false,
      productionRegistration: false,
      exportable: false,
    });
    expect(configForIndex(0)).toMatchObject({ n: false, e: false, s: false, w: false });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[0]).toMatchObject({
      id: 'mask_0',
      topologyClass: 'isolated',
      connectedEdges: [],
      resolution: {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [{
          role: 'isolated-shell',
          sourceStem: 'isolated_shell',
          baseFile: 'isolated_shell-base.svg',
          upperFile: 'isolated_shell-upper.svg',
          transform: 'none',
          derivation: 'none',
        }],
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
      'direct-reuse': 21,
      'approved-derivation': 16,
      'synthetic-assembly': 10,
      'unresolved-authored-geometry': 0,
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries
      .filter(({ resolution }) => resolution.status === 'unresolved')).toEqual([]);
    expect(BLOB_TILE_COUNT).toBe(47);
    expect(() => validateEqualHeightIsolatedShellGate()).not.toThrow();
  });

  it('renders one contained, connected, near-square zero-socket housing', () => {
    const raster = rasterComposed(512);
    const bounds = alphaBounds(raster);
    expect(bounds.minX).toBeGreaterThanOrEqual(55 * 4);
    expect(bounds.minY).toBeGreaterThanOrEqual(55 * 4);
    expect(bounds.maxX).toBeLessThan(124 * 4);
    expect(bounds.maxY).toBeLessThan(124 * 4);
    expect(bounds.maxX - bounds.minX).toBeGreaterThanOrEqual(64 * 4);
    expect(bounds.maxY - bounds.minY).toBeGreaterThanOrEqual(64 * 4);
    expect(Math.abs((bounds.maxX - bounds.minX) - (bounds.maxY - bounds.minY))).toBeLessThanOrEqual(2);
    expect(opaqueComponents(raster)).toBe(1);
    for (let pixel = 0; pixel < raster.width; pixel += 1) {
      expect(raster.pixels[pixel * 4 + 3]).toBe(0);
      expect(raster.pixels[((raster.height - 1) * raster.width + pixel) * 4 + 3]).toBe(0);
      expect(raster.pixels[(pixel * raster.width) * 4 + 3]).toBe(0);
      expect(raster.pixels[(pixel * raster.width + raster.width - 1) * 4 + 3]).toBe(0);
    }
  });

  it('keeps the full tri-tone wall hierarchy legible at 40 px', () => {
    const raster = rasterComposed(40);
    const bounds = alphaBounds(raster);
    expect(bounds.maxX - bounds.minX + 1).toBeGreaterThanOrEqual(20);
    expect(bounds.maxY - bounds.minY + 1).toBeGreaterThanOrEqual(20);
    expect(exactColorCount(raster, [217, 208, 185])).toBeGreaterThan(12); // cream
    expect(nearbyColorCount(raster, [182, 95, 77])).toBeGreaterThan(4); // coral
    expect(exactColorCount(raster, [41, 75, 60])).toBeGreaterThan(18); // green
    expect(nearbyColorCount(raster, [37, 42, 40])).toBeGreaterThan(4); // charcoal
  });

  it('uses one front-facing perspective without prop or fitting details', () => {
    const base = readFileSync(path.join(PROPOSAL_DIRECTORY, 'isolated_shell-base.svg'), 'utf8');
    const upper = readFileSync(path.join(PROPOSAL_DIRECTORY, 'isolated_shell-upper.svg'), 'utf8');
    expect(base).toContain('id="base-green-housing"');
    for (const id of [
      'upper-front-cream-face',
      'upper-front-coral-wrap',
      'upper-front-green-handoff',
      'upper-reveal-light',
      'upper-arris-seam',
    ]) {
      expect(upper).toContain(`id="${id}"`);
    }
    expect(upper).toContain('d="M58 63H117V88H58Z"');
    expect(upper).toContain('d="M58 88H117V94H58Z"');
    expect(upper).toContain('d="M58 94H117V97H58Z"');
    expect(upper).toContain('d="M59 63H116"');
    expect(upper).not.toMatch(/id="upper-east-|id="upper-arris-lip|M97 58H102|M102 58H117|V71/);
    const shapeIds = [...`${base}\n${upper}`.matchAll(/\bid="([^"]+)"/g)]
      .map((match) => match[1])
      .join('\n');
    expect(shapeIds).not.toMatch(
      /terminal|cap-|collar|flange|nose|face-panel|divider|boundary-seam|vent|badge|handle|control/i,
    );
  });

  it('keeps compact single and diagonal-pair evidence explicit', () => {
    expect(EQUAL_HEIGHT_ISOLATED_SHELL_GATE.contexts).toEqual([
      expect.objectContaining({
        id: 'single-3x3', columns: 3, rows: 3,
        positions: [[1, 1]], cellSizes: [90, 40],
      }),
      expect.objectContaining({
        id: 'diagonal-pair-2x2', columns: 2, rows: 2,
        positions: [[0, 0], [1, 1]], cellSizes: [90, 40],
      }),
    ]);
  });

  it('rejects demotion and leaves production signatures unchanged after source compilation', async () => {
    await compileA1bIsolatedShellProposalDirectory({
      inputDir: PROPOSAL_DIRECTORY,
      sourcePathPrefix: PROPOSAL_PREFIX,
    });
    const demoted = structuredClone(EQUAL_HEIGHT_ISOLATED_SHELL_GATE) as any;
    demoted.status = 'proof-only-review';
    expect(() => validateEqualHeightIsolatedShellGate(demoted)).toThrow(/identity drift/);
    const overclaimed = structuredClone(EQUAL_HEIGHT_ISOLATED_SHELL_GATE) as any;
    overclaimed.productionRegistration = true;
    expect(() => validateEqualHeightIsolatedShellGate(overclaimed)).toThrow(/production boundary/);
    validateEqualHeightIsolatedShellGate();
    expect(productionSignature()).toBe(productionBefore);
  });
});
