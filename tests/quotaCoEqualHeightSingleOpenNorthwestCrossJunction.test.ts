import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import { A1B_AUTHORED_STEMS } from '../scripts/highOblique/a1bAuthoredProof';
import {
  A1B_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY,
  compileA1bSingleOpenNorthwestCrossJunctionProposalDirectory,
} from '../scripts/highOblique/a1bSingleOpenNorthwestCrossJunctionProposal';
import {
  EQUAL_HEIGHT_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_GATE,
  validateEqualHeightSingleOpenNorthwestCrossJunctionGate,
  type EqualHeightSingleOpenNorthwestCrossJunctionMatrix,
} from '../scripts/highOblique/equalHeightSingleOpenNorthwestCrossJunctionGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from '../scripts/highOblique/equalHeightMaskLedger';
import { wallAtlas } from '../src/core/exporter';
import { DEFAULT_STYLE, DEFAULT_WALLS } from '../src/data/defaults';
import {
  BLOB_CONFIGS,
  BLOB_TILE_COUNT,
  NB,
  blobIndex,
  configForIndex,
} from '../src/tiles/blob';
import { WALL_TEMPLATES } from '../src/tiles/templates';

const SOURCE_PREFIX =
  'assets/walls/quota-co-building-system-proofs/single-open-northwest-cross-junction';
const SOURCE_DIRECTORY = path.resolve(process.cwd(), SOURCE_PREFIX);

const source = (filename: string): string =>
  readFileSync(path.join(SOURCE_DIRECTORY, filename), 'utf8');

const stripSvgShell = (svg: string): string =>
  svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

const NEIGHBORS = [
  [NB.N, 0, -1],
  [NB.E, 1, 0],
  [NB.S, 0, 1],
  [NB.W, -1, 0],
  [NB.NE, 1, -1],
  [NB.SE, 1, 1],
  [NB.SW, -1, 1],
  [NB.NW, -1, -1],
] as const;

function matrixFor(
  pattern: readonly string[],
): EqualHeightSingleOpenNorthwestCrossJunctionMatrix {
  const rows = pattern.length;
  const columns = pattern[0].length;
  const occupied = (column: number, row: number): boolean =>
    row >= 0 &&
    row < rows &&
    column >= 0 &&
    column < columns &&
    pattern[row][column] === '#';
  return pattern.map((row, rowIndex) =>
    [...row].map((cell, columnIndex) => {
      if (cell !== '#') return null;
      let raw = 0;
      for (const [bit, dx, dy] of NEIGHBORS) {
        if (occupied(columnIndex + dx, rowIndex + dy)) raw |= bit;
      }
      return blobIndex(raw);
    })) as EqualHeightSingleOpenNorthwestCrossJunctionMatrix;
}

const patternFor = (armLength: number): readonly string[] => {
  const size = armLength * 2 + 1;
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) =>
      column === armLength ||
      row === armLength ||
      (row === armLength - 1 && column === armLength + 1) ||
      (row === armLength + 1 &&
        (column === armLength - 1 || column === armLength + 1))
        ? '#'
        : '.',
    ).join(''),
  );
};

function rasterCandidate(
  cellPixels: number,
  background: '#A8A28F' | '#252A28',
): ReturnType<Resvg['render']> {
  const body =
    stripSvgShell(source('open_cross_filled_ne_se_sw-base.svg')) +
    stripSvgShell(source('open_cross_filled_ne_se_sw-upper.svg'));
  return new Resvg(
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ' +
      `viewBox="0 0 128 128"><rect width="128" height="128" fill="${background}"/>${body}</svg>`,
    {
      fitTo: { mode: 'width', value: cellPixels },
      font: { loadSystemFonts: false },
    },
  ).render();
}

function hasOpaqueRgb(
  raster: ReturnType<Resvg['render']>,
  expected: readonly [number, number, number],
  tolerance = 0,
): boolean {
  for (let offset = 0; offset < raster.pixels.length; offset += 4) {
    if (
      Math.abs(raster.pixels[offset] - expected[0]) <= tolerance &&
      Math.abs(raster.pixels[offset + 1] - expected[1]) <= tolerance &&
      Math.abs(raster.pixels[offset + 2] - expected[2]) <= tolerance &&
      raster.pixels[offset + 3] === 255
    ) {
      return true;
    }
  }
  return false;
}

describe('QuotaCo owner-accepted single-open northwest cross-junction gate', () => {
  it('locks mask_33 as one accepted fixed-view direct source', () => {
    expect(
      EQUAL_HEIGHT_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_GATE,
    ).toMatchObject({
      stem: 'equal-height-single-open-northwest-cross-junction-gate',
      status: 'owner-accepted-single-open-northwest-cross-junction-gate',
      contract: false,
      candidate: {
        maskIndex: 33,
        sourceMaskIndex: 33,
        sourceStem: 'open_cross_filled_ne_se_sw',
        connectedEdges: ['n', 'e', 's', 'w'],
        openPockets: ['nw'],
        solidDiagonals: ['ne', 'se', 'sw'],
        transform: 'none',
        derivation: 'none',
        resolution: 'direct-reuse',
      },
      baselineMaskRows: [25, 32, 30],
      maskRowsUnderReview: [],
      maskRowsAccepted: [33],
      reviewCellSizes: [240, 90, 40],
      reviewArmLengths: [1, 3, 6],
      directSourceAccepted: true,
      xMirrorAllowed: false,
      yMirrorAllowed: false,
      rotationAllowed: false,
      productionRegistration: false,
      productionTopologyMutation: false,
      schemaChange: false,
      exportable: false,
      committedAtlas: false,
      temporaryFrameIds: true,
    });
    expect(BLOB_CONFIGS[33]).toBe(0x7f);
    expect(configForIndex(33)).toEqual({
      n: true,
      e: true,
      s: true,
      w: true,
      ne: 'solid',
      se: 'solid',
      sw: 'solid',
      nw: 'concave',
    });
    expect(
      () => validateEqualHeightSingleOpenNorthwestCrossJunctionGate(),
    ).not.toThrow();
  });

  it('derives compact and 3/6-cell evidence from literal occupancy', () => {
    const gate =
      EQUAL_HEIGHT_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_GATE;
    expect(patternFor(1)).toEqual(['.##', '###', '###']);
    expect(gate.compactMatrix).toEqual(matrixFor(patternFor(1)));
    expect(gate.threeCellArmMatrix).toEqual(matrixFor(patternFor(3)));
    expect(gate.sixCellArmMatrix).toEqual(matrixFor(patternFor(6)));
    expect(gate.compactMatrix).toEqual([
      [null, 20, 26],
      [20, 33, 42],
      [16, 38, 34],
    ]);
  });

  it('promotes row 33 to one direct source while retaining accepted controls and neighbors', () => {
    const gate =
      EQUAL_HEIGHT_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_GATE;
    const installed = new Set([
      ...gate.compactMatrix.flat(),
      ...gate.threeCellArmMatrix.flat(),
      ...gate.sixCellArmMatrix.flat(),
    ].filter((index): index is number => index !== null));
    installed.delete(33);
    expect([...installed].sort((left, right) => left - right)).toEqual([
      1, 2, 4, 5, 8, 10, 16, 20, 21, 22, 26, 34, 38, 39, 42, 43,
    ]);
    for (const index of [
      ...gate.baselineMaskRows,
      ...installed,
    ]) {
      expect(
        EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution.status,
        `mask_${index}`,
      ).toBe('accepted-source-mapping');
    }
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[33]).toMatchObject({
      id: 'mask_33',
      canonicalMask: 0x7f,
      pockets: ['nw'],
      solidDiagonals: ['ne', 'se', 'sw'],
      resolution: {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [{
          role: 'single-open-northwest-cross-junction',
          sourceStem: 'open_cross_filled_ne_se_sw',
          baseFile: 'open_cross_filled_ne_se_sw-base.svg',
          upperFile: 'open_cross_filled_ne_se_sw-upper.svg',
          transform: 'none',
          derivation: 'none',
        }],
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
      'direct-reuse': 27,
      'approved-derivation': 19,
      'synthetic-assembly': 1,
      'unresolved-authored-geometry': 0,
    });
    expect(gate.acceptedLedgerCounts).toEqual(EQUAL_HEIGHT_MASK_LEDGER.counts);
  });

  it('locks authored controls without claiming stacked or Y-mirror provenance', () => {
    expect(
      EQUAL_HEIGHT_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_GATE
        .renderingDecision,
    ).toMatchObject({
      kind: 'one-accepted-authored-single-open-northwest-four-way-hub',
      scope: 'external-proof-source-bank',
      authoredSourceFiles: [
        'open_cross_filled_ne_se_sw-base.svg',
        'open_cross_filled_ne_se_sw-upper.svg',
      ],
      geometryCueMaskIndices: [25, 32],
      northwestReturnControlMaskIndex: 30,
      northwestReturnControlPolicy:
        'accepted mask_30 constrains the exposed northwest reveal and arris only; it is not geometry or source provenance',
      sourceRelationship:
        'authored-cues-only-no-derived-provenance',
    });
    for (const index of [25, 32, 30]) {
      expect(EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution).toMatchObject({
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
      });
    }
  });

  it('rejects demotion, matrix, transform, and production-boundary drift', () => {
    const gate =
      EQUAL_HEIGHT_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_GATE;
    expect(() =>
      validateEqualHeightSingleOpenNorthwestCrossJunctionGate({
        ...gate,
        maskRowsUnderReview: [33] as const,
        maskRowsAccepted: [] as const,
        directSourceAccepted: false,
      } as unknown as typeof gate),
    ).toThrow(/gate identity drift/);
    expect(() =>
      validateEqualHeightSingleOpenNorthwestCrossJunctionGate({
        ...gate,
        candidate: {
          ...gate.candidate,
          transform: 'mirror-y',
        },
      } as unknown as typeof gate),
    ).toThrow(/gate identity drift/);
    expect(() =>
      validateEqualHeightSingleOpenNorthwestCrossJunctionGate({
        ...gate,
        compactMatrix: [[33]] as const,
      } as unknown as typeof gate),
    ).toThrow(/compact matrix must be 3x3/);
    expect(() =>
      validateEqualHeightSingleOpenNorthwestCrossJunctionGate({
        ...gate,
        productionRegistration: true,
      } as unknown as typeof gate),
    ).toThrow(/accepted proof boundary/);
  });

  it('strictly compiles one flattened two-file accepted inventory', async () => {
    expect(readdirSync(SOURCE_DIRECTORY).sort()).toEqual([
      'README.md',
      'open_cross_filled_ne_se_sw-base.svg',
      'open_cross_filled_ne_se_sw-upper.svg',
    ]);
    expect(
      A1B_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY,
    ).toEqual([
      expect.objectContaining({
        sourceMaskIndex: 33,
        boundaryRole: 'single-open-northwest-cross-hub',
        layer: 'base',
      }),
      expect.objectContaining({
        sourceMaskIndex: 33,
        boundaryRole: 'single-open-northwest-cross-hub',
        layer: 'upper',
      }),
    ]);
    const compiled =
      await compileA1bSingleOpenNorthwestCrossJunctionProposalDirectory({
        inputDir: SOURCE_DIRECTORY,
        sourcePathPrefix: SOURCE_PREFIX,
      });
    expect(compiled.map(({ filename }) => filename)).toEqual([
      'open_cross_filled_ne_se_sw-base.svg',
      'open_cross_filled_ne_se_sw-upper.svg',
    ]);
    expect(compiled.every(({ shapes }) => shapes.length > 0)).toBe(true);
    expect(
      compiled.every(({ shapes }) =>
        shapes.every(({ silhouette }) => silhouette === false)),
    ).toBe(true);
    expect(compiled.map(({ content }) => content).join('\n')).not.toMatch(
      /\b(?:transform|href|xlink:href)\s*=/,
    );
  });

  it('keeps one cream owner, no buried color belts, and a clean distance read', () => {
    const upper = source('open_cross_filled_ne_se_sw-upper.svg');
    expect(
      [...upper.matchAll(
        /<path\b(?=[^>]*\bid=["']([^"']+)["'])(?=[^>]*\bfill=["']#D9D0B9["'])[^>]*>/gi,
      )].map((match) => match[1]),
    ).toEqual(['upper-shell']);
    expect(upper).toContain(
      'id="upper-shell" d="M58 0H128V128H0V58H48A10 10 0 0 0 58 48Z"',
    );
    expect(upper).toContain(
      '<path id="upper-nw-reveal-light" d="M0 58H48A10 10 0 0 0 58 48V63H0Z" fill="#FFFFFF" opacity="0.30"/>',
    );
    expect(upper).toContain(
      '<path id="upper-arris-seam" d="M1 63H46A12 12 0 0 0 58 51V1" fill="none" stroke="#252A28" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.45"/>',
    );
    expect(
      source('open_cross_filled_ne_se_sw-base.svg') + upper,
    ).not.toMatch(/#B65F4D|#294B3C/i);
    expect(upper).not.toMatch(
      /id="[^"]*(?:cap|post|peak|pylon|rollover|overlay|patch|stacked|bridge|center-seam)"/i,
    );
    for (const cellPixels of [240, 90, 40] as const) {
      for (const background of ['#A8A28F', '#252A28'] as const) {
        const raster = rasterCandidate(cellPixels, background);
        expect([raster.width, raster.height]).toEqual([
          cellPixels,
          cellPixels,
        ]);
        expect(hasOpaqueRgb(raster, [217, 208, 185])).toBe(true);
      }
    }
  });

  it('rejects transforms, path drift, buried belts, anonymous drawables, and extra files', async () => {
    const temporaryDirectory = mkdtempSync(
      path.join(tmpdir(), 'quota-co-single-open-nw-cross-'),
    );
    const base = source('open_cross_filled_ne_se_sw-base.svg');
    const upper = source('open_cross_filled_ne_se_sw-upper.svg');
    const writeInventory = (
      baseSource: string,
      upperSource: string,
    ): void => {
      writeFileSync(path.join(temporaryDirectory, 'README.md'), 'test\n');
      writeFileSync(
        path.join(
          temporaryDirectory,
          'open_cross_filled_ne_se_sw-base.svg',
        ),
        baseSource,
      );
      writeFileSync(
        path.join(
          temporaryDirectory,
          'open_cross_filled_ne_se_sw-upper.svg',
        ),
        upperSource,
      );
    };
    const compileTemporary = () =>
      compileA1bSingleOpenNorthwestCrossJunctionProposalDirectory({
        inputDir: temporaryDirectory,
        sourcePathPrefix:
          'assets/walls/quota-co-building-system-proofs/single-open-northwest-cross-junction-test',
      });

    try {
      writeInventory(
        base,
        upper.replace(
          '<g id="detail/upper">',
          '<g id="detail/upper" transform="translate(0 0)">',
        ),
      );
      await expect(compileTemporary()).rejects.toThrow(/without transforms/);

      writeInventory(
        base,
        upper.replace(
          'M58 0H128V128H0V58',
          'M59 0H128V128H0V58',
        ),
      );
      await expect(compileTemporary()).rejects.toThrow(
        /exact single-open northwest geometry for upper-shell/,
      );

      writeInventory(
        base,
        upper.replace(
          'id="upper-nw-reveal-light" d="M0 58H48A10 10 0 0 0 58 48V63H0Z" fill="#FFFFFF"',
          'id="upper-nw-reveal-light" d="M0 58H48A10 10 0 0 0 58 48V63H0Z" fill="#B65F4D"',
        ),
      );
      await expect(compileTemporary()).rejects.toThrow(
        /must not repaint coral or green/,
      );

      writeInventory(
        base,
        upper.replace('opacity="0.30"', 'opacity="0.50"'),
      );
      await expect(compileTemporary()).rejects.toThrow(
        /exact fixed-light presentation for upper-nw-reveal-light/,
      );

      writeInventory(
        base,
        upper.replace(
          '</g>',
          '<path d="M0 0H8V8H0Z" fill="#D9D0B9"/></g>',
        ),
      );
      await expect(compileTemporary()).rejects.toThrow(
        /anonymous drawable <path>/,
      );

      writeInventory(base, upper);
      writeFileSync(
        path.join(temporaryDirectory, 'unexpected.svg'),
        '<svg xmlns="http://www.w3.org/2000/svg"/>',
      );
      await expect(compileTemporary()).rejects.toThrow(
        /unexpected source unexpected.svg/,
      );
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  });

  it('does not register the review source with production-facing authored surfaces', () => {
    const sourceStem =
      EQUAL_HEIGHT_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_GATE
        .candidate.sourceStem;
    expect(BLOB_TILE_COUNT).toBe(47);
    expect(BLOB_CONFIGS).toHaveLength(47);
    expect(BLOB_CONFIGS[33]).toBe(0x7f);
    expect(A1B_AUTHORED_STEMS).not.toContain(sourceStem);
    expect(WALL_TEMPLATES.map(({ id }) => id)).not.toContain(sourceStem);
    expect(
      Object.keys(wallAtlas(DEFAULT_WALLS[0], DEFAULT_STYLE, 1).frames),
    ).toEqual(
      Array.from({ length: BLOB_TILE_COUNT }, (_, index) => `mask_${index}`),
    );
  });
});
