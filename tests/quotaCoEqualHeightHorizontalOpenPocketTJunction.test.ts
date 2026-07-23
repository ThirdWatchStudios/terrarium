import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import {
  A1B_HORIZONTAL_OPEN_POCKET_T_JUNCTION_PROPOSAL_SOURCE_INVENTORY,
  compileA1bHorizontalOpenPocketTJunctionProposalDirectory,
} from '../scripts/highOblique/a1bHorizontalOpenPocketTJunctionProposal';
import { A1B_AUTHORED_STEMS } from '../scripts/highOblique/a1bAuthoredProof';
import {
  EQUAL_HEIGHT_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE,
  validateEqualHeightHorizontalOpenPocketTJunctionGate,
} from '../scripts/highOblique/equalHeightHorizontalOpenPocketTJunctionGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from '../scripts/highOblique/equalHeightMaskLedger';
import { wallAtlas } from '../src/core/exporter';
import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import { DEFAULT_STYLE, DEFAULT_WALLS } from '../src/data/defaults';
import { PROP_TEMPLATES } from '../src/props/templates';
import { BLOB_CONFIGS, blobContract, configForIndex } from '../src/tiles/blob';
import { FLOOR_TEMPLATES, WALL_TEMPLATES } from '../src/tiles/templates';

const CANONICAL_DIRECTORY = path.resolve(
  process.cwd(),
  'assets/walls/quota-co-building-system',
);
const VERTICAL_TERMINUS_DIRECTORY = path.resolve(
  process.cwd(),
  'assets/walls/quota-co-building-system-proofs/vertical-terminus',
);
const PROPOSAL_PREFIX =
  'assets/walls/quota-co-building-system-proofs/horizontal-open-pocket-t-junction';
const PROPOSAL_DIRECTORY = path.resolve(process.cwd(), PROPOSAL_PREFIX);

type BranchSide = 'west' | 'east';
type Opening = 'openSouth' | 'openNorth';
type MatrixMask = 1 | 2 | 4 | 5 | 8 | 10 | 11 | 14;
type Matrix = readonly (readonly (MatrixMask | null)[])[];

interface Raster {
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint8Array;
}

interface SourcePair {
  readonly baseSource: string;
  readonly upperSource: string;
  readonly mirrorX: boolean;
}

const source = (directory: string, filename: string): string =>
  readFileSync(path.join(directory, filename), 'utf8');

const stripSvgShell = (svg: string): string =>
  svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

const sourceIds = (svg: string): readonly string[] =>
  [...svg.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);

function sourcePair(maskIndex: MatrixMask, branchSide: BranchSide): SourcePair {
  if (maskIndex === 11 || maskIndex === 14) {
    const stem = maskIndex === 11 ? 'open_s_t_junction' : 'open_n_t_junction';
    return {
      baseSource: source(PROPOSAL_DIRECTORY, `${stem}-base.svg`),
      upperSource: source(PROPOSAL_DIRECTORY, `${stem}-upper.svg`),
      mirrorX: false,
    };
  }
  if (maskIndex === 1 || maskIndex === 4) {
    const stem = maskIndex === 1 ? 'vertical_s_terminus' : 'vertical_n_terminus';
    return {
      baseSource: source(VERTICAL_TERMINUS_DIRECTORY, `${stem}-base.svg`),
      upperSource: source(VERTICAL_TERMINUS_DIRECTORY, `${stem}-upper.svg`),
      mirrorX: branchSide === 'east',
    };
  }
  if (maskIndex === 5) {
    return {
      baseSource: source(CANONICAL_DIRECTORY, 'full_w_straight-base.svg'),
      upperSource: source(CANONICAL_DIRECTORY, 'full_w_straight-upper.svg'),
      mirrorX: branchSide === 'east',
    };
  }
  if (maskIndex === 2 || maskIndex === 8) {
    return {
      baseSource: source(CANONICAL_DIRECTORY, 'full_terminus-base.svg'),
      upperSource: source(CANONICAL_DIRECTORY, 'full_terminus-upper.svg'),
      mirrorX: maskIndex === 2,
    };
  }
  return {
    baseSource: source(CANONICAL_DIRECTORY, 'full_n_straight-base.svg'),
    upperSource: source(CANONICAL_DIRECTORY, 'full_n_straight-upper.svg'),
    mirrorX: false,
  };
}

function rasterMatrix(
  matrix: Matrix,
  branchSide: BranchSide,
  cellPixels: number,
): Raster {
  const rows = matrix.length;
  const columns = matrix[0].length;
  const basePass: string[] = [];
  const upperPass: string[] = [];
  for (const [row, masks] of matrix.entries()) {
    for (const [col, maskIndex] of masks.entries()) {
      if (maskIndex === null) continue;
      const pair = sourcePair(maskIndex, branchSide);
      const cell = (content: string): string => (
        `<svg x="${col * 128}" y="${row * 128}" width="128" height="128" ` +
        'viewBox="0 0 128 128">' +
        (pair.mirrorX
          ? `<g transform="matrix(-1 0 0 1 128 0)">${stripSvgShell(content)}</g>`
          : stripSvgShell(content)) +
        '</svg>'
      );
      basePass.push(cell(pair.baseSource));
      upperPass.push(cell(pair.upperSource));
    }
  }
  const rendered = new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${columns * 128}" ` +
    `height="${rows * 128}" viewBox="0 0 ${columns * 128} ${rows * 128}">` +
    `${basePass.join('')}${upperPass.join('')}</svg>`,
    {
      fitTo: { mode: 'width', value: columns * cellPixels },
      font: { loadSystemFonts: false },
    },
  ).render();
  return { width: rendered.width, height: rendered.height, pixels: rendered.pixels };
}

const alphaAt = (raster: Raster, x: number, y: number): number =>
  raster.pixels[(y * raster.width + x) * 4 + 3];

function longMatrix(opening: Opening): Matrix {
  const rows: (MatrixMask | null)[][] = Array.from(
    { length: 6 },
    () => Array<MatrixMask | null>(6).fill(null),
  );
  const horizontal = EQUAL_HEIGHT_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE
    .longHorizontalRows[opening];
  const vertical = EQUAL_HEIGHT_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE
    .longVerticalColumns[opening];
  const horizontalRow = opening === 'openSouth' ? 5 : 0;
  for (const [col, mask] of horizontal.entries()) rows[horizontalRow][col] = mask;
  for (const [row, mask] of vertical.entries()) rows[row][2] = mask;
  return rows;
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

describe('QuotaCo owner-accepted horizontal-spine open-pocket T-junction gate', () => {
  it('locks the accepted identity, exact matrices, and separately authored topologies', () => {
    expect(EQUAL_HEIGHT_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE).toMatchObject({
      stem: 'equal-height-horizontal-open-pocket-t-junction-gate',
      version: 0,
      status: 'owner-accepted-horizontal-open-pocket-t-junction-gate',
      contract: false,
      topologyClass: 'horizontal-open-pocket-t-junction-family',
      compactMatrices: {
        openSouth: [[null, 4, null], [2, 11, 8], [null, null, null]],
        openNorth: [[null, null, null], [2, 14, 8], [null, 1, null]],
      },
      longHorizontalRows: {
        openSouth: [2, 10, 11, 10, 10, 8],
        openNorth: [2, 10, 14, 10, 10, 8],
      },
      longVerticalColumns: {
        openSouth: [4, 5, 5, 5, 5, 11],
        openNorth: [14, 5, 5, 5, 5, 1],
      },
      baselineMaskRows: [1, 2, 4, 5, 8, 10],
      maskRowsUnderReview: [],
      maskRowsAccepted: [11, 14],
      reviewCellSizes: [240, 90, 40],
      reviewArmLengths: [1, 3, 6],
      rotationAllowed: false,
      xMirrorAllowed: false,
      yMirrorAllowed: false,
      productionRegistration: false,
      productionTopologyMutation: false,
      schemaChange: false,
      exportable: false,
      committedAtlas: false,
    });
    expect(EQUAL_HEIGHT_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE.candidates).toEqual([
      expect.objectContaining({
        opening: 'south', fixedLightRole: 'foreground', maskIndex: 11,
        sourceMaskIndex: 11, sourceStem: 'open_s_t_junction', transform: 'none',
        derivation: 'none', resolution: 'direct-reuse',
      }),
      expect.objectContaining({
        opening: 'north', fixedLightRole: 'rear', maskIndex: 14,
        sourceMaskIndex: 14, sourceStem: 'open_n_t_junction', transform: 'none',
        derivation: 'none', resolution: 'direct-reuse',
      }),
    ]);
    expect(configForIndex(11)).toEqual({
      n: true, e: true, s: false, w: true,
      ne: 'concave', se: 'exposed', sw: 'exposed', nw: 'concave',
    });
    expect(configForIndex(14)).toEqual({
      n: false, e: true, s: true, w: true,
      ne: 'exposed', se: 'concave', sw: 'concave', nw: 'exposed',
    });
    expect(() => validateEqualHeightHorizontalOpenPocketTJunctionGate()).not.toThrow();
  });

  it('promotes both authored rows to direct source mappings and updates the ledger counts', () => {
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[11]).toMatchObject({
      topologyClass: 't-junction',
      connectedEdges: ['n', 'e', 'w'],
      exposedEdges: ['s'],
      pockets: ['ne', 'nw'],
      solidDiagonals: [],
      resolution: {
        kind: 'direct-reuse', status: 'accepted-source-mapping',
        variants: [{
          role: 'open-south-t-junction', sourceStem: 'open_s_t_junction',
          baseFile: 'open_s_t_junction-base.svg', upperFile: 'open_s_t_junction-upper.svg',
          transform: 'none', derivation: 'none',
        }],
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[14]).toMatchObject({
      topologyClass: 't-junction',
      connectedEdges: ['e', 's', 'w'],
      exposedEdges: ['n'],
      pockets: ['se', 'sw'],
      solidDiagonals: [],
      resolution: {
        kind: 'direct-reuse', status: 'accepted-source-mapping',
        variants: [{
          role: 'open-north-t-junction', sourceStem: 'open_n_t_junction',
          baseFile: 'open_n_t_junction-base.svg', upperFile: 'open_n_t_junction-upper.svg',
          transform: 'none', derivation: 'none',
        }],
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
      'direct-reuse': 17,
      'approved-derivation': 14,
      'synthetic-assembly': 16,
      'unresolved-authored-geometry': 0,
    });
  });

  it('compiles exactly four distinct fixed-view proof sources with locked semantic groups', async () => {
    expect(A1B_HORIZONTAL_OPEN_POCKET_T_JUNCTION_PROPOSAL_SOURCE_INVENTORY).toEqual([
      {
        id: 'open_s_t_junction-base', filename: 'open_s_t_junction-base.svg',
        sourceMaskIndex: 11, boundaryRole: 'foreground-open-t-hub',
        layer: 'base', semanticGroup: 'detail/base',
      },
      {
        id: 'open_s_t_junction-upper', filename: 'open_s_t_junction-upper.svg',
        sourceMaskIndex: 11, boundaryRole: 'foreground-open-t-hub',
        layer: 'upper', semanticGroup: 'detail/upper',
      },
      {
        id: 'open_n_t_junction-base', filename: 'open_n_t_junction-base.svg',
        sourceMaskIndex: 14, boundaryRole: 'rear-open-t-hub',
        layer: 'base', semanticGroup: 'detail/base',
      },
      {
        id: 'open_n_t_junction-upper', filename: 'open_n_t_junction-upper.svg',
        sourceMaskIndex: 14, boundaryRole: 'rear-open-t-hub',
        layer: 'upper', semanticGroup: 'detail/upper',
      },
    ]);
    expect(readdirSync(PROPOSAL_DIRECTORY).filter((filename) => filename.endsWith('.svg')).sort())
      .toEqual([
        'open_n_t_junction-base.svg',
        'open_n_t_junction-upper.svg',
        'open_s_t_junction-base.svg',
        'open_s_t_junction-upper.svg',
      ]);
    const compiled = await compileA1bHorizontalOpenPocketTJunctionProposalDirectory({
      inputDir: PROPOSAL_DIRECTORY,
      sourcePathPrefix: PROPOSAL_PREFIX,
    });
    expect(compiled.map(({ sourceFile }) => sourceFile)).toEqual(
      A1B_HORIZONTAL_OPEN_POCKET_T_JUNCTION_PROPOSAL_SOURCE_INVENTORY.map(
        ({ filename }) => `${PROPOSAL_PREFIX}/${filename}`,
      ),
    );
    expect(compiled.every(({ shapes, content }) =>
      shapes.length > 0 && !content.includes('transform='))).toBe(true);
    expect(sourceIds(compiled[0].content)).toContain('detail/base');
    expect(sourceIds(compiled[1].content)).toContain('upper-cream-bridge');
    expect(sourceIds(compiled[2].content)).toContain('base-south-service-seam');
    expect(sourceIds(compiled[3].content)).toContain('upper-branch-coral-band');
    expect(compiled[0].content).not.toBe(compiled[2].content);
    expect(compiled[1].content).not.toBe(compiled[3].content);
    expect(A1B_AUTHORED_STEMS).not.toContain('open_s_t_junction');
    expect(A1B_AUTHORED_STEMS).not.toContain('open_n_t_junction');
  });

  it('keeps the horizontal spine continuous through every compact review context', () => {
    for (const opening of ['openSouth', 'openNorth'] as const) {
      for (const side of ['west', 'east'] as const) {
        const raster = rasterMatrix(
          EQUAL_HEIGHT_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE.compactMatrices[opening],
          side,
          128,
        );
        expect([raster.width, raster.height]).toEqual([384, 384]);
        for (const boundary of [128, 256]) {
          for (const x of [boundary - 2, boundary - 1, boundary, boundary + 1, boundary + 2]) {
            for (const y of [198, 208, 220, 236]) {
              expect(alphaAt(raster, x, y), `${opening}/${side} spine at ${x},${y}`)
                .toBe(255);
            }
          }
        }
      }
    }
  });

  it('renders both branch facings without mirroring either candidate', () => {
    expect(EQUAL_HEIGHT_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE.branchFacingEvidence)
      .toEqual([
        { side: 'west', bodyMaskIndex: 5, transform: 'none' },
        { side: 'east', bodyMaskIndex: 5, transform: 'mirror-x' },
      ]);
    for (const opening of ['openSouth', 'openNorth'] as const) {
      for (const side of ['west', 'east'] as const) {
        const raster = rasterMatrix(longMatrix(opening), side, 40);
        expect([raster.width, raster.height]).toEqual([240, 240]);
      }
    }
    expect(sourcePair(11, 'west').mirrorX).toBe(false);
    expect(sourcePair(11, 'east').mirrorX).toBe(false);
    expect(sourcePair(14, 'west').mirrorX).toBe(false);
    expect(sourcePair(14, 'east').mirrorX).toBe(false);
  });

  it('holds the six-cell horizontal extent and authored west branch at 40 pixels', () => {
    for (const opening of ['openSouth', 'openNorth'] as const) {
      const raster = rasterMatrix(longMatrix(opening), 'west', 40);
      const horizontalY = (opening === 'openSouth' ? 5 : 0) * 40 + 29;
      for (const boundary of [40, 80, 120, 160, 200]) {
        for (const x of [boundary - 1, boundary, boundary + 1]) {
          expect(alphaAt(raster, x, horizontalY), `${opening} horizontal ${x}`)
            .toBe(255);
        }
      }
      const verticalX = 2 * 40 + 25;
      for (const boundary of [40, 80, 120, 160, 200]) {
        for (const y of [boundary - 1, boundary, boundary + 1]) {
          expect(alphaAt(raster, verticalX, y), `${opening} vertical ${y}`)
            .toBe(255);
        }
      }
    }
  });

  it('rejects demotion, mirroring, and every production claim', () => {
    expect(() => validateEqualHeightHorizontalOpenPocketTJunctionGate({
      ...EQUAL_HEIGHT_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE,
      maskRowsUnderReview: [11],
    } as unknown as typeof EQUAL_HEIGHT_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE))
      .toThrow(/evidence boundary drift/);
    expect(() => validateEqualHeightHorizontalOpenPocketTJunctionGate({
      ...EQUAL_HEIGHT_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE,
      maskRowsAccepted: [11],
    } as unknown as typeof EQUAL_HEIGHT_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE))
      .toThrow(/evidence boundary drift/);
    expect(() => validateEqualHeightHorizontalOpenPocketTJunctionGate({
      ...EQUAL_HEIGHT_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE,
      xMirrorAllowed: true,
    } as unknown as typeof EQUAL_HEIGHT_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE))
      .toThrow(/proof-only production boundary/);
    expect(() => validateEqualHeightHorizontalOpenPocketTJunctionGate({
      ...EQUAL_HEIGHT_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE,
      productionRegistration: true,
    } as unknown as typeof EQUAL_HEIGHT_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE))
      .toThrow(/proof-only production boundary/);
  });

  it('leaves production export and registration signatures byte-identical', () => {
    expect(productionSignature()).toBe(productionBefore);
  });
});
