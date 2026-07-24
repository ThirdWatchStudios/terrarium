import { readFileSync } from 'node:fs';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import {
  A1B_VERTICAL_TERMINUS_PROPOSAL_SOURCE_INVENTORY,
  compileA1bVerticalTerminusProposalDirectory,
} from '../scripts/highOblique/a1bVerticalTerminusProposal';
import {
  EQUAL_HEIGHT_VERTICAL_TERMINUS_GATE,
  equalHeightVerticalTerminusEvidenceRuns,
  equalHeightVerticalTerminusMinimumSegment,
  equalHeightVerticalTerminusRun,
  validateEqualHeightVerticalTerminusGate,
  type EqualHeightVerticalTerminusLayer,
} from '../scripts/highOblique/equalHeightVerticalTerminusGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from '../scripts/highOblique/equalHeightMaskLedger';
import { wallAtlas } from '../src/core/exporter';
import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import { DEFAULT_STYLE, DEFAULT_WALLS } from '../src/data/defaults';
import { PROP_TEMPLATES } from '../src/props/templates';
import { BLOB_TILE_COUNT, blobContract, configForIndex } from '../src/tiles/blob';
import { FLOOR_TEMPLATES, WALL_TEMPLATES } from '../src/tiles/templates';

const CANONICAL_PREFIX = 'assets/walls/quota-co-building-system';
const CANONICAL_DIRECTORY = path.resolve(process.cwd(), CANONICAL_PREFIX);
const PROPOSAL_PREFIX = 'assets/walls/quota-co-building-system-proofs/vertical-terminus';
const PROPOSAL_DIRECTORY = path.resolve(process.cwd(), PROPOSAL_PREFIX);
const RASTER_SCALE = 4;

interface Raster {
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint8Array;
}

const stripSvgShell = (source: string): string =>
  source.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

function sourceMarkup(directory: string, filename: string): string {
  return stripSvgShell(readFileSync(path.join(directory, filename), 'utf8'));
}

function pathDataForId(source: string, id: string): string {
  const match = source.match(new RegExp(`id="${id}"\\s+d="([^"]+)"`));
  if (!match) throw new Error(`Missing SVG path ${id}`);
  return match[1];
}

function rasterLayer(
  baseDirectory: string,
  baseFile: string,
  upperDirectory: string,
  upperFile: string,
  layer: EqualHeightVerticalTerminusLayer,
): Raster {
  const content =
    (layer === 'base' || layer === 'composed' ? sourceMarkup(baseDirectory, baseFile) : '') +
    (layer === 'upper' || layer === 'composed' ? sourceMarkup(upperDirectory, upperFile) : '');
  const rendered = new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${128 * RASTER_SCALE}" height="${128 * RASTER_SCALE}" ` +
    `viewBox="0 0 128 128">${content}</svg>`,
    { font: { loadSystemFonts: false } },
  ).render();
  return { width: rendered.width, height: rendered.height, pixels: rendered.pixels };
}

function regionMismatchCount(
  first: Raster,
  second: Raster,
  startY: number,
  endY: number,
): number {
  expect([first.width, first.height]).toEqual([second.width, second.height]);
  let mismatches = 0;
  for (let y = startY; y < endY; y += 1) {
    for (let x = 0; x < first.width; x += 1) {
      const offset = (y * first.width + x) * 4;
      if ([0, 1, 2, 3].some((channel) =>
        first.pixels[offset + channel] !== second.pixels[offset + channel])) {
        mismatches += 1;
      }
    }
  }
  return mismatches;
}

function alphaBounds(raster: Raster): { readonly minX: number; readonly maxX: number } {
  let minX = raster.width;
  let maxX = -1;
  for (let y = 0; y < raster.height; y += 1) {
    for (let x = 0; x < raster.width; x += 1) {
      if (raster.pixels[(y * raster.width + x) * 4 + 3] > 0) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
    }
  }
  return { minX, maxX };
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

describe('QuotaCo owner-accepted proof-layer equal-height vertical terminus family', () => {
  it('keeps two accepted authored directions in a strict external proof bank', async () => {
    expect(A1B_VERTICAL_TERMINUS_PROPOSAL_SOURCE_INVENTORY).toEqual([
      {
        id: 'vertical_s_terminus-base', filename: 'vertical_s_terminus-base.svg',
        capFacing: 'south', layer: 'base', semanticGroup: 'detail/base',
      },
      {
        id: 'vertical_s_terminus-upper', filename: 'vertical_s_terminus-upper.svg',
        capFacing: 'south', layer: 'upper', semanticGroup: 'detail/upper',
      },
      {
        id: 'vertical_n_terminus-base', filename: 'vertical_n_terminus-base.svg',
        capFacing: 'north', layer: 'base', semanticGroup: 'detail/base',
      },
      {
        id: 'vertical_n_terminus-upper', filename: 'vertical_n_terminus-upper.svg',
        capFacing: 'north', layer: 'upper', semanticGroup: 'detail/upper',
      },
    ]);
    const compiled = await compileA1bVerticalTerminusProposalDirectory({
      inputDir: PROPOSAL_DIRECTORY,
      sourcePathPrefix: PROPOSAL_PREFIX,
    });
    expect(compiled.map(({ sourceFile }) => sourceFile)).toEqual(
      A1B_VERTICAL_TERMINUS_PROPOSAL_SOURCE_INVENTORY.map(
        ({ filename }) => `${PROPOSAL_PREFIX}/${filename}`,
      ),
    );
    expect(compiled.every(({ shapes }) => shapes.length > 0)).toBe(true);
    for (const { content } of compiled) {
      expect(content).not.toMatch(/\btransform\s*=|\brotate\s*\(/i);
    }
  });

  it('accepts canonical mask_1 and mask_4 with explicit west and east provenance', () => {
    expect(EQUAL_HEIGHT_VERTICAL_TERMINUS_GATE).toMatchObject({
      stem: 'equal-height-vertical-terminus-gate',
      version: 0,
      status: 'owner-accepted-vertical-terminus-gate',
      contract: false,
      canvas: 128,
      reviewCellSizes: [90, 40],
      bodyRunLengths: [1, 3, 6],
      minimumSegmentBodyLengths: [0, 1],
      ledgerRowsUnderReview: [],
      ledgerRowsAccepted: [1, 4],
      rotationAllowed: false,
      yMirrorAllowed: false,
      xMirrorAccepted: true,
      productionRegistration: false,
      exportable: false,
    });
    expect(EQUAL_HEIGHT_VERTICAL_TERMINUS_GATE.cases).toEqual([
      expect.objectContaining({
        maskId: 'mask_1', index: 1, canonicalMask: 0x01, connectedEdge: 'n',
        capFacing: 's', sourceStem: 'vertical_s_terminus',
        projectedRead: 'foreground-wall-rollover',
      }),
      expect.objectContaining({
        maskId: 'mask_4', index: 4, canonicalMask: 0x04, connectedEdge: 's',
        capFacing: 'n', sourceStem: 'vertical_n_terminus',
        projectedRead: 'rear-wall-rollover',
      }),
    ]);
    expect(configForIndex(1)).toMatchObject({ n: true, e: false, s: false, w: false });
    expect(configForIndex(4)).toMatchObject({ n: false, e: false, s: true, w: false });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[1]).toMatchObject({
      topologyClass: 'terminus',
      resolution: {
        kind: 'approved-derivation',
        status: 'accepted-source-mapping',
        variants: [
          { role: 'west-south-terminus', sourceStem: 'vertical_s_terminus', transform: 'none' },
          { role: 'east-south-terminus', sourceStem: 'vertical_s_terminus', transform: 'mirror-x' },
        ],
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[4]).toMatchObject({
      topologyClass: 'terminus',
      resolution: {
        kind: 'approved-derivation',
        status: 'accepted-source-mapping',
        variants: [
          { role: 'west-north-terminus', sourceStem: 'vertical_n_terminus', transform: 'none' },
          { role: 'east-north-terminus', sourceStem: 'vertical_n_terminus', transform: 'mirror-x' },
        ],
      },
    });
  });

  it('folds the existing tri-tone wall registers through two wall-owned closures', () => {
    const southUpper = readFileSync(path.join(PROPOSAL_DIRECTORY, 'vertical_s_terminus-upper.svg'), 'utf8');
    const northUpper = readFileSync(path.join(PROPOSAL_DIRECTORY, 'vertical_n_terminus-upper.svg'), 'utf8');
    for (const source of [southUpper, northUpper]) {
      for (const id of [
        'upper-cream-rollover-light',
        'upper-coral-wrap',
        'upper-green-wrap',
      ]) {
        expect(source).toContain(`id="${id}"`);
      }
      expect(source).not.toMatch(/terminal-|nose-|face-panel|face-seam|service-lines|collar|plinth/i);
    }

    const northCoral = pathDataForId(northUpper, 'upper-coral-wrap');
    const northGreen = pathDataForId(northUpper, 'upper-green-wrap');
    expect(northCoral).toMatch(/^M97\b/);
    expect(northGreen).toMatch(/^M102\b/);
    for (const register of [northCoral, northGreen]) {
      expect(register).not.toMatch(/\bM58\b|\bH117\b/);
      expect(register).toContain('V128');
    }
  });

  it('never widens either end beyond the ordinary wall cross-section', () => {
    const gate = EQUAL_HEIGHT_VERTICAL_TERMINUS_GATE;
    const straight = rasterLayer(
      CANONICAL_DIRECTORY,
      gate.bodySource.baseFile,
      CANONICAL_DIRECTORY,
      gate.bodySource.upperFile,
      'composed',
    );
    const straightBounds = alphaBounds(straight);
    for (const candidate of gate.cases) {
      const closure = rasterLayer(
        PROPOSAL_DIRECTORY,
        candidate.baseFile,
        PROPOSAL_DIRECTORY,
        candidate.upperFile,
        'composed',
      );
      const closureBounds = alphaBounds(closure);
      expect(closureBounds.minX, `${candidate.maskId} left envelope`).toBeGreaterThanOrEqual(
        straightBounds.minX,
      );
      expect(closureBounds.maxX, `${candidate.maskId} right envelope`).toBeLessThanOrEqual(
        straightBounds.maxX,
      );
    }
  });

  it('inherits exact body pixels at each connected socket in every layer', () => {
    const gate = EQUAL_HEIGHT_VERTICAL_TERMINUS_GATE;
    for (const layer of gate.socketAuditLayers) {
      const straight = rasterLayer(
        CANONICAL_DIRECTORY,
        gate.bodySource.baseFile,
        CANONICAL_DIRECTORY,
        gate.bodySource.upperFile,
        layer,
      );
      const southCap = gate.cases[0];
      const south = rasterLayer(
        PROPOSAL_DIRECTORY,
        southCap.baseFile,
        PROPOSAL_DIRECTORY,
        southCap.upperFile,
        layer,
      );
      expect(
        regionMismatchCount(straight, south, 0, 80 * RASTER_SCALE),
        `${layer} mask_1 north ingress`,
      ).toBe(0);

      const northCap = gate.cases[1];
      const north = rasterLayer(
        PROPOSAL_DIRECTORY,
        northCap.baseFile,
        PROPOSAL_DIRECTORY,
        northCap.upperFile,
        layer,
      );
      expect(
        regionMismatchCount(straight, north, 45 * RASTER_SCALE, 128 * RASTER_SCALE),
        `${layer} mask_4 south ingress`,
      ).toBe(0);
    }
  });

  it('covers both wall sides at 1/3/6 body cells and 90/40 pixels', () => {
    const evidence = equalHeightVerticalTerminusEvidenceRuns();
    expect(evidence).toHaveLength(24);
    expect(new Set(evidence.map(({ maskId, wallSide, bodyLength, cellSize }) =>
      `${maskId}/${wallSide}/${bodyLength}/${cellSize}`)).size).toBe(24);
    for (const run of evidence) {
      expect(run.totalCells).toBe(run.bodyLength + 1);
      expect(run.pixelWidth).toBe(run.cellSize);
      expect(run.pixelHeight).toBe((run.bodyLength + 1) * run.cellSize);
      const index = run.maskId === 'mask_1' ? 1 : 4;
      const cells = equalHeightVerticalTerminusRun(index, run.bodyLength, run.wallSide);
      expect(cells).toHaveLength(run.totalCells);
      expect(cells.filter(({ role }) => role === 'terminus')).toHaveLength(1);
      expect(cells.at(run.order === 'body-then-terminus' ? -1 : 0)).toMatchObject({
        role: 'terminus',
        transform: run.wallSide === 'west' ? 'none' : 'mirror-x',
      });
    }
  });

  it('includes decisive two-cell and three-cell minimum segments', () => {
    for (const wallSide of ['west', 'east'] as const) {
      const twoCell = equalHeightVerticalTerminusMinimumSegment(0, wallSide);
      const threeCell = equalHeightVerticalTerminusMinimumSegment(1, wallSide);
      expect(twoCell.map(({ role }) => role)).toEqual(['terminus', 'terminus']);
      expect(threeCell.map(({ role }) => role)).toEqual(['terminus', 'body', 'terminus']);
      expect(twoCell.map(({ position }) => position)).toEqual([0, 1]);
      expect(threeCell.map(({ position }) => position)).toEqual([0, 1, 2]);
      expect(twoCell.every(({ transform }) => transform === (wallSide === 'west' ? 'none' : 'mirror-x')))
        .toBe(true);
      expect(twoCell[0].baseFile).toBe('vertical_n_terminus-base.svg');
      expect(twoCell[1].baseFile).toBe('vertical_s_terminus-base.svg');
    }
  });

  it('fails demotion or production overclaims and preserves every production-facing contract', () => {
    const demoted = structuredClone(EQUAL_HEIGHT_VERTICAL_TERMINUS_GATE) as any;
    demoted.status = 'proof-only-review';
    expect(() => validateEqualHeightVerticalTerminusGate(demoted)).toThrow(/invalid status/);
    const rotated = structuredClone(EQUAL_HEIGHT_VERTICAL_TERMINUS_GATE) as any;
    rotated.rotationAllowed = true;
    expect(() => validateEqualHeightVerticalTerminusGate(rotated)).toThrow(/proof-only production boundary/);
    validateEqualHeightVerticalTerminusGate();
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
      'direct-reuse': 24,
      'approved-derivation': 16,
      'synthetic-assembly': 7,
      'unresolved-authored-geometry': 0,
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries
      .filter(({ resolution }) => resolution.status === 'unresolved')
      .map(({ index }) => index)).toEqual([]);
    expect(productionSignature()).toBe(productionBefore);
    expect(CURRENT_SCHEMA_VERSION).toBe(18);
    expect(blobContract()).toMatchObject({ version: 1, tileCount: 47 });
    expect(Object.keys(wallAtlas(DEFAULT_WALLS[0], DEFAULT_STYLE, 1).frames)).toEqual(
      Array.from({ length: BLOB_TILE_COUNT }, (_, index) => `mask_${index}`),
    );
  });
});
