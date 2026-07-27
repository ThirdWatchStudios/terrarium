import {
  readFileSync,
  readdirSync,
} from 'node:fs';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import {
  A1B_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY,
  compileA1bSingleFilledSoutheastCrossJunctionProposalDirectory,
} from '../scripts/highOblique/a1bSingleFilledSoutheastCrossJunctionProposal';
import { A1B_AUTHORED_STEMS } from '../scripts/highOblique/a1bAuthoredProof';
import {
  EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE,
  validateEqualHeightSingleFilledSoutheastCrossJunctionGate,
  type EqualHeightSingleFilledSoutheastCrossJunctionMatrix,
} from '../scripts/highOblique/equalHeightSingleFilledSoutheastCrossJunctionGate';
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
  'assets/walls/quota-co-building-system-proofs/single-filled-southeast-cross-junction';
const SOURCE_DIRECTORY = path.resolve(process.cwd(), SOURCE_PREFIX);
const OPEN_CROSS_DIRECTORY = path.resolve(
  process.cwd(),
  'assets/walls/quota-co-building-system-proofs/open-pocket-cross-junction',
);
const WEST_PARTIAL_T_JUNCTION_DIRECTORY = path.resolve(
  process.cwd(),
  'assets/walls/quota-co-building-system-proofs/west-partial-t-junction',
);
const HORIZONTAL_PARTIAL_T_JUNCTION_DIRECTORY = path.resolve(
  process.cwd(),
  'assets/walls/quota-co-building-system-proofs/horizontal-partial-t-junction',
);

const source = (filename: string): string =>
  readFileSync(path.join(SOURCE_DIRECTORY, filename), 'utf8');

const stripSvgShell = (svg: string): string =>
  svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

function rasterSourcePair(
  directory: string,
  stem: string,
): ReturnType<Resvg['render']> {
  const body =
    stripSvgShell(readFileSync(path.join(directory, `${stem}-base.svg`), 'utf8')) +
    stripSvgShell(readFileSync(path.join(directory, `${stem}-upper.svg`), 'utf8'));
  return new Resvg(
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ' +
      `viewBox="0 0 128 128">${body}</svg>`,
    { font: { loadSystemFonts: false } },
  ).render();
}

function rasterCandidate(cellPixels: number): ReturnType<Resvg['render']> {
  const body =
    stripSvgShell(source('open_cross_filled_se-base.svg')) +
    stripSvgShell(source('open_cross_filled_se-upper.svg'));
  return new Resvg(
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ' +
      `viewBox="0 0 128 128">${body}</svg>`,
    {
      fitTo: { mode: 'width', value: cellPixels },
      font: { loadSystemFonts: false },
    },
  ).render();
}

function alphaRowSpan(
  raster: ReturnType<Resvg['render']>,
  row: number,
): readonly [number, number] {
  const occupied: number[] = [];
  const pixels = raster.pixels;
  for (let column = 0; column < raster.width; column += 1) {
    if (pixels[(row * raster.width + column) * 4 + 3] > 0) {
      occupied.push(column);
    }
  }
  if (occupied.length === 0) throw new Error(`No alpha at raster row ${row}`);
  return [occupied[0], occupied[occupied.length - 1]];
}

function alphaColumnSpan(
  raster: ReturnType<Resvg['render']>,
  column: number,
): readonly [number, number] {
  const occupied: number[] = [];
  const pixels = raster.pixels;
  for (let row = 0; row < raster.height; row += 1) {
    if (pixels[(row * raster.width + column) * 4 + 3] > 0) {
      occupied.push(row);
    }
  }
  if (occupied.length === 0) throw new Error(`No alpha at raster column ${column}`);
  return [occupied[0], occupied[occupied.length - 1]];
}

const rgbaRow = (
  raster: ReturnType<Resvg['render']>,
  row: number,
): readonly number[] =>
  [...raster.pixels.slice(row * raster.width * 4, (row + 1) * raster.width * 4)];

const rgbaColumn = (
  raster: ReturnType<Resvg['render']>,
  column: number,
): readonly number[] => {
  const values: number[] = [];
  const pixels = raster.pixels;
  for (let row = 0; row < raster.height; row += 1) {
    const offset = (row * raster.width + column) * 4;
    values.push(...pixels.slice(offset, offset + 4));
  }
  return values;
};

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

/** Derive canonical mask indices from literal occupied cells. */
function matrixFor(
  pattern: readonly string[],
): EqualHeightSingleFilledSoutheastCrossJunctionMatrix {
  const rows = pattern.length;
  const columns = pattern[0].length;
  expect(pattern.every((row) => row.length === columns)).toBe(true);
  const occupied = (column: number, row: number): boolean =>
    row >= 0 && row < rows && column >= 0 && column < columns &&
    pattern[row][column] === '#';
  return pattern.map((row, rowIndex) => [...row].map((cell, columnIndex) => {
    if (cell !== '#') return null;
    let raw = 0;
    for (const [bit, dx, dy] of NEIGHBORS) {
      if (occupied(columnIndex + dx, rowIndex + dy)) raw |= bit;
    }
    return blobIndex(raw);
  })) as EqualHeightSingleFilledSoutheastCrossJunctionMatrix;
}

const singleFilledSoutheastCrossPattern = (
  armLength: number,
): readonly string[] => {
  const size = armLength * 2 + 1;
  return Array.from({ length: size }, (_, row) => (
    Array.from({ length: size }, (_, column) => (
      column === armLength ||
      row === armLength ||
      (column === armLength + 1 && row === armLength + 1)
        ? '#'
        : '.'
    )).join('')
  ));
};

describe('QuotaCo accepted single-filled southeast cross-junction gate', () => {
  it('strictly compiles the separate two-file mask_23 proof-source inventory', async () => {
    expect(readdirSync(SOURCE_DIRECTORY).sort()).toEqual([
      'README.md',
      'open_cross_filled_se-base.svg',
      'open_cross_filled_se-upper.svg',
    ]);
    expect(A1B_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY)
      .toEqual([
        expect.objectContaining({
          id: 'open_cross_filled_se-base',
          filename: 'open_cross_filled_se-base.svg',
          sourceMaskIndex: 23,
          boundaryRole: 'southeast-filled-cross-hub',
          layer: 'base',
          semanticGroup: 'detail/base',
        }),
        expect.objectContaining({
          id: 'open_cross_filled_se-upper',
          filename: 'open_cross_filled_se-upper.svg',
          sourceMaskIndex: 23,
          boundaryRole: 'southeast-filled-cross-hub',
          layer: 'upper',
          semanticGroup: 'detail/upper',
        }),
      ]);
    const compiled =
      await compileA1bSingleFilledSoutheastCrossJunctionProposalDirectory({
        inputDir: SOURCE_DIRECTORY,
        sourcePathPrefix: SOURCE_PREFIX,
      });
    expect(compiled.map(({ filename }) => filename)).toEqual([
      'open_cross_filled_se-base.svg',
      'open_cross_filled_se-upper.svg',
    ]);
    for (const candidate of compiled) {
      expect(candidate.shapes.length).toBeGreaterThan(0);
      expect(candidate.content).not.toMatch(/\b(?:transform|href|xlink:href)\s*=/);
      expect(candidate.shapes.every(({ silhouette }) => silhouette === false)).toBe(true);
    }
  });

  it('keeps one synchronized shared turn and all four accepted socket registers', () => {
    expect(source('open_cross_filled_se-base.svg'))
      .toContain('id="base-buried-se-underlay"');
    const upper = source('open_cross_filled_se-upper.svg');
    expect(upper).toContain('id="upper-shell"');
    expect(upper).not.toMatch(
      /id="(?:upper-se-solid-top|upper-cream-bridge|upper-secondary-cream)"/,
    );
    expect(upper).toContain(
      'id="upper-plane-light-open-ne" d="M14.819 0L68.744 0 68.744 9.036C68.744 10.397 77.66 11.5 88.656 11.5L14.819 11.5Z"',
    );
    expect(upper).toContain(
      'id="upper-arris-lip-open-ne" d="M68.744 0L71.233 0 71.233 9.036C71.233 10.397 80.149 11.5 91.144 11.5L88.656 11.5C77.66 11.5 68.744 10.397 68.744 9.036Z"',
    );
    expect(upper).toContain(
      'id="upper-green-open-ne" d="M87.826 0L92.804 0 92.804 9.036C92.804 10.397 101.719 11.5 112.715 11.5L107.737 11.5C96.741 11.5 87.826 10.397 87.826 9.036Z"',
    );
    expect(upper).toContain(
      'id="upper-coral-open-ne" d="M79.53 0L87.826 0 87.826 9.036C87.826 10.397 96.741 11.5 107.737 11.5L99.441 11.5C88.445 11.5 79.53 10.397 79.53 9.036Z"',
    );
    expect(upper).toContain(
      'id="upper-face-shade-open-ne" d="M71.233 0L92.804 0 92.804 9.036C92.804 10.397 101.719 11.5 112.715 11.5L91.144 11.5C80.149 11.5 71.233 10.397 71.233 9.036Z"',
    );
    expect(upper).toContain(
      'id="upper-arris-seam" d="M71.233 0.75L71.233 9.036C71.233 10.397 80.149 11.5 91.144 11.5L111.056 11.5M0.75 23.115L126 23.115"',
    );
    expect(upper).toContain(
      'id="upper-band-seam" d="M87.826 0.75L87.826 9.036C87.826 10.397 96.741 11.5 107.737 11.5M0.75 74.552L9.857 74.552"',
    );
    expect(
      [...upper.matchAll(
        /<path\b(?=[^>]*\bid=["']([^"']+)["'])(?=[^>]*\bfill=["']#D9D0B9["'])[^>]*>/gi,
      )].map((match) => match[1]),
    ).toEqual(['upper-shell']);

    for (const cellPixels of [240, 90, 40] as const) {
      const raster = rasterCandidate(cellPixels);
      expect([raster.width, raster.height]).toEqual([cellPixels, cellPixels]);
      expect(
        raster.pixels.some((channel, offset) => offset % 4 === 3 && channel > 0),
        `mask_23 alpha at ${cellPixels}px`,
      ).toBe(true);
    }

    const candidate = rasterCandidate(128);
    const mask15 = rasterSourcePair(OPEN_CROSS_DIRECTORY, 'open_cross_junction');
    const mask21 = rasterSourcePair(
      WEST_PARTIAL_T_JUNCTION_DIRECTORY,
      'open_w_t_filled_se',
    );
    const mask22 = rasterSourcePair(
      HORIZONTAL_PARTIAL_T_JUNCTION_DIRECTORY,
      'open_n_t_filled_se',
    );

    expect(alphaRowSpan(candidate, 0)).toEqual([11, 123]);
    expect(alphaRowSpan(candidate, 0)).toEqual(alphaRowSpan(mask21, 0));
    expect(rgbaRow(candidate, 0)).toEqual(rgbaRow(mask21, 0));
    expect(alphaRowSpan(candidate, 127)).toEqual([9, 127]);
    expect(alphaRowSpan(candidate, 127)).toEqual(alphaRowSpan(mask22, 127));
    expect(rgbaRow(candidate, 127)).toEqual(rgbaRow(mask22, 127));
    expect(alphaColumnSpan(candidate, 0)).toEqual([11, 123]);
    expect(alphaColumnSpan(candidate, 0)).toEqual(alphaColumnSpan(mask15, 0));
    expect(rgbaColumn(candidate, 0)).not.toEqual(rgbaColumn(mask22, 0));
    expect(alphaColumnSpan(candidate, 127)).toEqual([11, 127]);
    expect(alphaColumnSpan(candidate, 127)).toEqual(alphaColumnSpan(mask21, 127));
    expect(rgbaColumn(candidate, 127)).toEqual(rgbaColumn(mask21, 127));
  });

  it('locks mask_23 as one accepted direct proof source', () => {
    expect(EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE)
      .toMatchObject({
        stem: 'equal-height-single-filled-southeast-cross-junction-gate',
        version: 0,
        status: 'owner-accepted-single-filled-southeast-cross-junction-gate',
        contract: false,
        topologyClass: 'single-filled-southeast-cross-junction',
        candidate: {
          maskIndex: 23,
          sourceMaskIndex: 23,
          sourceStem: 'open_cross_filled_se',
          baseFile: 'open_cross_filled_se-base.svg',
          upperFile: 'open_cross_filled_se-upper.svg',
          connectedEdges: ['n', 'e', 's', 'w'],
          openPockets: ['ne', 'sw', 'nw'],
          solidDiagonals: ['se'],
          fixedLightRole: 'rear-southeast-filled-four-way-hub',
          transform: 'none',
          derivation: 'none',
          resolution: 'direct-reuse',
        },
        baselineMaskRows: [15, 21, 22],
        maskRowsUnderReview: [],
        maskRowsAccepted: [23],
        reviewCellSizes: [240, 90, 40],
        reviewArmLengths: [1, 3, 6],
        renderingDecision: {
          shadePolicy:
            'phase the northeast cream plane, light arris, dimensional shade, coral, green, and both seams through one nested R12 turn inherited unchanged by the plain-X mask_29 companion; preserve every full-resolution socket pixel',
        },
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
    expect(BLOB_CONFIGS[23]).toBe(0x2f);
    expect(configForIndex(23)).toEqual({
      n: true, e: true, s: true, w: true,
      ne: 'concave', se: 'solid', sw: 'concave', nw: 'concave',
    });
    expect(
      () => validateEqualHeightSingleFilledSoutheastCrossJunctionGate(),
    ).not.toThrow();
  });

  it('derives the compact and 1/3/6-arm evidence from one occupied southeast cell', () => {
    expect(singleFilledSoutheastCrossPattern(1)).toEqual(['.#.', '###', '.##']);
    expect(EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE.compactMatrix)
      .toEqual(matrixFor(singleFilledSoutheastCrossPattern(1)));
    expect(
      EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE.threeCellArmMatrix,
    ).toEqual(matrixFor(singleFilledSoutheastCrossPattern(3)));
    expect(
      EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE.sixCellArmMatrix,
    ).toEqual(matrixFor(singleFilledSoutheastCrossPattern(6)));
    expect(EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE.compactMatrix)
      .toEqual([
        [null, 4, null],
        [2, 23, 26],
        [null, 16, 34],
      ]);
    expect(
      EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE.threeCellArmMatrix,
    ).toEqual([
      [null, null, null, 4, null, null, null],
      [null, null, null, 5, null, null, null],
      [null, null, null, 5, null, null, null],
      [2, 10, 10, 23, 28, 10, 8],
      [null, null, null, 17, 34, null, null],
      [null, null, null, 5, null, null, null],
      [null, null, null, 1, null, null, null],
    ]);
    expect(
      EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE.sixCellArmMatrix[6],
    ).toEqual([2, 10, 10, 10, 10, 10, 23, 28, 10, 10, 10, 10, 8]);
    expect(
      EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE.sixCellArmMatrix[7],
    ).toEqual([null, null, null, null, null, null, 17, 34, null, null, null, null, null]);

    const installedMasks = new Set(
      EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE.sixCellArmMatrix
        .flat()
        .filter((index): index is number => index !== null),
    );
    expect([...installedMasks].sort((left, right) => left - right)).toEqual([
      1, 2, 4, 5, 8, 10, 17, 23, 28, 34,
    ]);
    for (const index of installedMasks) {
      if (index === 23) continue;
      expect(
        EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution.status,
        `mask_${index}`,
      ).toBe('accepted-source-mapping');
    }
  });

  it('keeps accepted controls explicit while recording mask_23 direct provenance', () => {
    expect(
      EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE.baselineMaskRows,
    ).toEqual([15, 21, 22]);
    expect(
      EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE
        .renderingDecision.acceptedControlSources,
    ).toEqual([
      {
        maskIndex: 15,
        sourceStem: 'open_cross_junction',
        baseFile: 'open_cross_junction-base.svg',
        upperFile: 'open_cross_junction-upper.svg',
      },
      {
        maskIndex: 21,
        sourceStem: 'open_w_t_filled_se',
        baseFile: 'open_w_t_filled_se-base.svg',
        upperFile: 'open_w_t_filled_se-upper.svg',
      },
      {
        maskIndex: 22,
        sourceStem: 'open_n_t_filled_se',
        baseFile: 'open_n_t_filled_se-base.svg',
        upperFile: 'open_n_t_filled_se-upper.svg',
      },
    ]);
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[23]).toMatchObject({
      id: 'mask_23',
      topologyClass: 'cross-junction',
      connectedEdges: ['n', 'e', 's', 'w'],
      exposedEdges: [],
      pockets: ['ne', 'sw', 'nw'],
      solidDiagonals: ['se'],
      resolution: {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [
          {
            role: 'single-filled-southeast-cross-junction',
            sourceStem: 'open_cross_filled_se',
            baseFile: 'open_cross_filled_se-base.svg',
            upperFile: 'open_cross_filled_se-upper.svg',
            transform: 'none',
            derivation: 'none',
          },
        ],
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
    'direct-reuse': 28,
      'approved-derivation': 19,
    'synthetic-assembly': 0,
      'unresolved-authored-geometry': 0,
    });
    expect(
      EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE
        .acceptedLedgerCounts,
    ).toEqual(EQUAL_HEIGHT_MASK_LEDGER.counts);
    const acceptedStems = EQUAL_HEIGHT_MASK_LEDGER.entries.flatMap(({ resolution }) =>
      resolution.kind === 'direct-reuse' || resolution.kind === 'approved-derivation'
        ? resolution.variants.map(({ sourceStem }) => sourceStem)
        : []);
    expect(acceptedStems).toContain('open_cross_filled_se');
  });

  it('rejects demotion, matrix drift, and production-boundary drift', () => {
    expect(() => validateEqualHeightSingleFilledSoutheastCrossJunctionGate({
      ...EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE,
      maskRowsUnderReview: [23] as const,
      maskRowsAccepted: [] as const,
    } as unknown as typeof EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE))
      .toThrow(/identity drift/);
    expect(() => validateEqualHeightSingleFilledSoutheastCrossJunctionGate({
      ...EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE,
      candidate: {
        ...EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE.candidate,
        resolution: 'synthetic-assembly',
      },
    } as unknown as typeof EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE))
      .toThrow(/identity drift/);
    expect(() => validateEqualHeightSingleFilledSoutheastCrossJunctionGate({
      ...EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE,
      compactMatrix: [[23]] as const,
    } as unknown as typeof EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE))
      .toThrow(/compact matrix must be 3x3/);
    expect(() => validateEqualHeightSingleFilledSoutheastCrossJunctionGate({
      ...EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE,
      xMirrorAllowed: true,
    } as unknown as typeof EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE))
      .toThrow(/proof-only boundary/);
    expect(() => validateEqualHeightSingleFilledSoutheastCrossJunctionGate({
      ...EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE,
      productionRegistration: true,
    } as unknown as typeof EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE))
      .toThrow(/proof-only boundary/);
  });

  it('does not register the accepted proof source with production-facing authored surfaces', () => {
    expect(A1B_AUTHORED_STEMS).not.toContain('open_cross_filled_se');
    expect(WALL_TEMPLATES.map(({ id }) => id)).not.toContain('open_cross_filled_se');
    expect(
      Object.keys(wallAtlas(DEFAULT_WALLS[0], DEFAULT_STYLE, 1).frames),
    ).toEqual(
      Array.from({ length: BLOB_TILE_COUNT }, (_, index) => `mask_${index}`),
    );
  });

  it('keeps the accepted external source available to the ledger renderer and watcher', () => {
    const styleLoop = readFileSync(
      path.resolve(process.cwd(), 'scripts/styleLoop.ts'),
      'utf8',
    );
    expect(styleLoop).toMatch(
      /renderEqualHeightMaskLedger[\s\S]*singleFilledSoutheastCrossJunctionProposalFileOverrides/,
    );
    expect(styleLoop).toContain(
      "normalizedProofFile.startsWith('single-filled-southeast-cross-junction/')",
    );
  });
});
