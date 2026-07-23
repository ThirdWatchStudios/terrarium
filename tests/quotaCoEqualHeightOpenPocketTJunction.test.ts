import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import {
  A1B_OPEN_POCKET_T_JUNCTION_PROPOSAL_SOURCE_INVENTORY,
  compileA1bOpenPocketTJunctionProposalDirectory,
} from '../scripts/highOblique/a1bOpenPocketTJunctionProposal';
import { A1B_AUTHORED_STEMS } from '../scripts/highOblique/a1bAuthoredProof';
import {
  EQUAL_HEIGHT_OPEN_POCKET_T_JUNCTION_GATE,
  validateEqualHeightOpenPocketTJunctionGate,
} from '../scripts/highOblique/equalHeightOpenPocketTJunctionGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from '../scripts/highOblique/equalHeightMaskLedger';
import { derivePromotedSoutheastSourcePair } from '../scripts/highOblique/equalHeightWallDirection';
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
const PROPOSAL_PREFIX = 'assets/walls/quota-co-building-system-proofs/open-pocket-t-junction';
const PROPOSAL_DIRECTORY = path.resolve(process.cwd(), PROPOSAL_PREFIX);

type TJunctionSide = 'west' | 'east';
type MatrixMask = 1 | 2 | 4 | 5 | 7 | 8 | 10 | 13;
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

function sourcePair(maskIndex: MatrixMask, side: TJunctionSide): SourcePair {
  if (maskIndex === 7 || maskIndex === 13) {
    const baseSource = source(PROPOSAL_DIRECTORY, 'open_w_t_junction-base.svg');
    const upperSource = source(PROPOSAL_DIRECTORY, 'open_w_t_junction-upper.svg');
    const filtered = maskIndex === 13
      ? derivePromotedSoutheastSourcePair(baseSource, upperSource)
      : { baseSource, upperSource };
    return { ...filtered, mirrorX: maskIndex === 13 };
  }
  if (maskIndex === 1 || maskIndex === 4) {
    const stem = maskIndex === 1 ? 'vertical_s_terminus' : 'vertical_n_terminus';
    return {
      baseSource: source(VERTICAL_TERMINUS_DIRECTORY, `${stem}-base.svg`),
      upperSource: source(VERTICAL_TERMINUS_DIRECTORY, `${stem}-upper.svg`),
      mirrorX: side === 'east',
    };
  }
  if (maskIndex === 2 || maskIndex === 8) {
    return {
      baseSource: source(CANONICAL_DIRECTORY, 'full_terminus-base.svg'),
      upperSource: source(CANONICAL_DIRECTORY, 'full_terminus-upper.svg'),
      mirrorX: maskIndex === 2,
    };
  }
  const stem = maskIndex === 5 ? 'full_w_straight' : 'full_n_straight';
  return {
    baseSource: source(CANONICAL_DIRECTORY, `${stem}-base.svg`),
    upperSource: source(CANONICAL_DIRECTORY, `${stem}-upper.svg`),
    mirrorX: maskIndex === 5 && side === 'east',
  };
}

function rasterMatrix(matrix: Matrix, side: TJunctionSide, cellPixels: number): Raster {
  const rows = matrix.length;
  const columns = matrix[0].length;
  const basePass: string[] = [];
  const upperPass: string[] = [];
  for (const [row, masks] of matrix.entries()) {
    for (const [col, maskIndex] of masks.entries()) {
      if (maskIndex === null) continue;
      const pair = sourcePair(maskIndex, side);
      const cell = (content: string): string => (
        `<svg x="${col * 128}" y="${row * 128}" width="128" height="128" viewBox="0 0 128 128">` +
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
    `<svg xmlns="http://www.w3.org/2000/svg" width="${columns * 128}" height="${rows * 128}" ` +
    `viewBox="0 0 ${columns * 128} ${rows * 128}">${basePass.join('')}${upperPass.join('')}</svg>`,
    {
      fitTo: { mode: 'width', value: columns * cellPixels },
      font: { loadSystemFonts: false },
    },
  ).render();
  return { width: rendered.width, height: rendered.height, pixels: rendered.pixels };
}

const rgbaAt = (
  raster: Raster,
  x: number,
  y: number,
): readonly [number, number, number, number] => {
  const offset = (y * raster.width + x) * 4;
  return [
    raster.pixels[offset],
    raster.pixels[offset + 1],
    raster.pixels[offset + 2],
    raster.pixels[offset + 3],
  ];
};

const LONG_MATRICES: Readonly<Record<TJunctionSide, Matrix>> = {
  west: [
    [4, null, null, null, null, null],
    [5, null, null, null, null, null],
    [7, 10, 10, 10, 10, 8],
    [5, null, null, null, null, null],
    [5, null, null, null, null, null],
    [1, null, null, null, null, null],
  ],
  east: [
    [null, null, null, null, null, 4],
    [null, null, null, null, null, 5],
    [2, 10, 10, 10, 10, 13],
    [null, null, null, null, null, 5],
    [null, null, null, null, null, 5],
    [null, null, null, null, null, 1],
  ],
};

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

describe('QuotaCo owner-accepted proof-layer open-pocket T-junction pair', () => {
  it('locks the accepted gate identity, exact matrices, and mirrored T topologies', () => {
    expect(EQUAL_HEIGHT_OPEN_POCKET_T_JUNCTION_GATE).toMatchObject({
      stem: 'equal-height-open-pocket-t-junction-gate',
      version: 0,
      status: 'owner-accepted-open-pocket-t-junction-gate',
      contract: false,
      topologyClass: 'open-pocket-t-junction-family',
      compactMatrices: {
        west: [[null, 4, null], [null, 7, 8], [null, 1, null]],
        east: [[null, 4, null], [2, 13, null], [null, 1, null]],
      },
      longArmRows: {
        west: [7, 10, 10, 10, 10, 8],
        east: [2, 10, 10, 10, 10, 13],
      },
      baselineMaskRows: [1, 2, 4, 5, 8, 10],
      maskRowsUnderReview: [],
      maskRowsAccepted: [7, 13],
      reviewCellSizes: [240, 90, 40],
      reviewArmLengths: [1, 3, 6],
      rotationAllowed: false,
      yMirrorAllowed: false,
      productionRegistration: false,
      productionTopologyMutation: false,
      schemaChange: false,
      exportable: false,
      committedAtlas: false,
    });
    expect(EQUAL_HEIGHT_OPEN_POCKET_T_JUNCTION_GATE.candidates).toEqual([
      expect.objectContaining({
        side: 'west', maskIndex: 7, sourceMaskIndex: 7,
        sourceStem: 'open_w_t_junction', transform: 'none', derivation: 'none',
        resolution: 'direct-reuse',
      }),
      expect.objectContaining({
        side: 'east', maskIndex: 13, sourceMaskIndex: 7,
        sourceStem: 'open_w_t_junction', transform: 'mirror-x',
        derivation: 'accepted-southeast-seam-filter',
        resolution: 'approved-derivation',
      }),
    ]);
    expect(configForIndex(7)).toEqual({
      n: true, e: true, s: true, w: false,
      ne: 'concave', se: 'concave', sw: 'exposed', nw: 'exposed',
    });
    expect(configForIndex(13)).toEqual({
      n: true, e: false, s: true, w: true,
      ne: 'exposed', se: 'exposed', sw: 'concave', nw: 'concave',
    });
    expect(() => validateEqualHeightOpenPocketTJunctionGate()).not.toThrow();
  });

  it('promotes the direct west source and filtered east derivation without changing topology', () => {
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[7]).toMatchObject({
      topologyClass: 't-junction',
      connectedEdges: ['n', 'e', 's'],
      exposedEdges: ['w'],
      pockets: ['ne', 'se'],
      solidDiagonals: [],
      resolution: {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [{
          role: 'open-west-t-junction',
          sourceStem: 'open_w_t_junction',
          baseFile: 'open_w_t_junction-base.svg',
          upperFile: 'open_w_t_junction-upper.svg',
          transform: 'none',
          derivation: 'none',
        }],
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[13]).toMatchObject({
      topologyClass: 't-junction',
      connectedEdges: ['n', 's', 'w'],
      exposedEdges: ['e'],
      pockets: ['sw', 'nw'],
      solidDiagonals: [],
      resolution: {
        kind: 'approved-derivation',
        status: 'accepted-source-mapping',
        variants: [{
          role: 'open-east-t-junction',
          sourceStem: 'open_w_t_junction',
          baseFile: 'open_w_t_junction-base.svg',
          upperFile: 'open_w_t_junction-upper.svg',
          transform: 'mirror-x',
          derivation: 'accepted-southeast-seam-filter',
        }],
      },
    });
    for (const maskIndex of EQUAL_HEIGHT_OPEN_POCKET_T_JUNCTION_GATE.baselineMaskRows) {
      expect(EQUAL_HEIGHT_MASK_LEDGER.entries[maskIndex].resolution).toMatchObject({
        status: 'accepted-source-mapping',
      });
    }
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
      'direct-reuse': 21,
      'approved-derivation': 14,
      'synthetic-assembly': 12,
      'unresolved-authored-geometry': 0,
    });
  });

  it('compiles exactly two fixed-view sources with the locked semantic IDs', async () => {
    expect(A1B_OPEN_POCKET_T_JUNCTION_PROPOSAL_SOURCE_INVENTORY).toEqual([
      {
        id: 'open_w_t_junction-base', filename: 'open_w_t_junction-base.svg',
        sourceMaskIndex: 7, boundaryRole: 'open-west-t-hub',
        layer: 'base', semanticGroup: 'detail/base',
      },
      {
        id: 'open_w_t_junction-upper', filename: 'open_w_t_junction-upper.svg',
        sourceMaskIndex: 7, boundaryRole: 'open-west-t-hub',
        layer: 'upper', semanticGroup: 'detail/upper',
      },
    ]);
    expect(readdirSync(PROPOSAL_DIRECTORY).filter((filename) => filename.endsWith('.svg')).sort())
      .toEqual(['open_w_t_junction-base.svg', 'open_w_t_junction-upper.svg']);
    const compiled = await compileA1bOpenPocketTJunctionProposalDirectory({
      inputDir: PROPOSAL_DIRECTORY,
      sourcePathPrefix: PROPOSAL_PREFIX,
    });
    expect(compiled.map(({ sourceFile }) => sourceFile)).toEqual([
      `${PROPOSAL_PREFIX}/open_w_t_junction-base.svg`,
      `${PROPOSAL_PREFIX}/open_w_t_junction-upper.svg`,
    ]);
    expect(compiled.every(({ shapes }) => shapes.length > 0)).toBe(true);
    expect(sourceIds(compiled[0].content)).toEqual([
      'detail/base',
      'base-contour',
      'base-green',
      'base-face-shade',
      'base-contact-shade',
      'base-boundary-seam',
      'base-south-service-seam',
    ]);
    expect(sourceIds(compiled[1].content)).toEqual([
      'detail/upper',
      'upper-contour',
      'upper-shell',
      'upper-plane-light',
      'upper-arris-lip',
      'upper-green-handoff',
      'upper-coral-band',
      'upper-band-light',
      'upper-face-shade',
      'upper-cream-bridge',
      'upper-reveal-light',
      'upper-arris-seam',
      'upper-band-seam',
      'upper-boundary-seam',
      'upper-south-service-seam',
    ]);
    expect(A1B_AUTHORED_STEMS).not.toContain('open_w_t_junction');
  });

  it('filters only the mask_13 boundary seams before the whole-cell X mirror', () => {
    const baseSource = source(PROPOSAL_DIRECTORY, 'open_w_t_junction-base.svg');
    const upperSource = source(PROPOSAL_DIRECTORY, 'open_w_t_junction-upper.svg');
    const filtered = derivePromotedSoutheastSourcePair(baseSource, upperSource);
    expect(baseSource).toContain('id="base-boundary-seam"');
    expect(upperSource).toContain('id="upper-boundary-seam"');
    expect(filtered.baseSource).not.toContain('id="base-boundary-seam"');
    expect(filtered.upperSource).not.toContain('id="upper-boundary-seam"');
    expect(filtered.baseSource).toContain('id="base-south-service-seam" d="M106 126H116"');
    expect(filtered.upperSource).toContain('id="upper-south-service-seam" d="M58 126H104"');
    expect(EQUAL_HEIGHT_OPEN_POCKET_T_JUNCTION_GATE.candidates[1]).toMatchObject({
      maskIndex: 13,
      transform: 'mirror-x',
      derivation: 'accepted-southeast-seam-filter',
    });
  });

  it('closes each compact 3x3 socket with accepted end sources and no alpha crack', () => {
    for (const side of ['west', 'east'] as const) {
      const raster = rasterMatrix(
        EQUAL_HEIGHT_OPEN_POCKET_T_JUNCTION_GATE.compactMatrices[side],
        side,
        128,
      );
      expect([raster.width, raster.height]).toEqual([384, 384]);
      const verticalX = side === 'west' ? 208 : 176;
      for (const y of [126, 127, 128, 129, 130, 254, 255, 256, 257, 258]) {
        expect(rgbaAt(raster, verticalX, y)[3], `${side} vertical socket at y=${y}`).toBe(255);
      }
      const branchBoundary = side === 'west' ? 256 : 128;
      for (const x of [branchBoundary - 2, branchBoundary - 1, branchBoundary, branchBoundary + 1, branchBoundary + 2]) {
        for (const y of [198, 208, 220, 236]) {
          expect(rgbaAt(raster, x, y)[3], `${side} horizontal socket at ${x},${y}`).toBe(255);
        }
      }
    }
  });

  it('holds both six-cell arms continuously at the literal 40-pixel game check', () => {
    for (const side of ['west', 'east'] as const) {
      const raster = rasterMatrix(LONG_MATRICES[side], side, 40);
      expect([raster.width, raster.height]).toEqual([240, 240]);
      const verticalX = side === 'west' ? 22 : 218;
      for (const boundary of [40, 80, 120, 160, 200]) {
        for (const y of [boundary - 1, boundary, boundary + 1]) {
          expect(rgbaAt(raster, verticalX, y)[3], `${side} vertical long arm at y=${y}`).toBe(255);
        }
      }
      const horizontalY = 102;
      for (const boundary of [40, 80, 120, 160, 200]) {
        for (const x of [boundary - 1, boundary, boundary + 1]) {
          expect(rgbaAt(raster, x, horizontalY)[3], `${side} horizontal long arm at x=${x}`).toBe(255);
        }
      }
    }
  });

  it('rejects demotion and every production claim', () => {
    expect(() => validateEqualHeightOpenPocketTJunctionGate({
      ...EQUAL_HEIGHT_OPEN_POCKET_T_JUNCTION_GATE,
      maskRowsUnderReview: [7],
      maskRowsAccepted: [13],
    } as unknown as typeof EQUAL_HEIGHT_OPEN_POCKET_T_JUNCTION_GATE)).toThrow(/evidence boundary drift/);
    expect(() => validateEqualHeightOpenPocketTJunctionGate({
      ...EQUAL_HEIGHT_OPEN_POCKET_T_JUNCTION_GATE,
      productionRegistration: true,
    } as unknown as typeof EQUAL_HEIGHT_OPEN_POCKET_T_JUNCTION_GATE)).toThrow(/proof-only production boundary/);
  });

  it('leaves production export and registration signatures byte-identical', () => {
    expect(productionSignature()).toBe(productionBefore);
  });
});
