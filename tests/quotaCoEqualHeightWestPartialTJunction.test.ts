import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import {
  A1B_WEST_PARTIAL_T_JUNCTION_PROPOSAL_SOURCE_INVENTORY,
  compileA1bWestPartialTJunctionProposalDirectory,
} from '../scripts/highOblique/a1bWestPartialTJunctionProposal';
import { A1B_AUTHORED_STEMS } from '../scripts/highOblique/a1bAuthoredProof';
import { EQUAL_HEIGHT_MASK_LEDGER } from '../scripts/highOblique/equalHeightMaskLedger';
import {
  EQUAL_HEIGHT_WEST_PARTIAL_T_JUNCTION_GATE,
  validateEqualHeightWestPartialTJunctionGate,
} from '../scripts/highOblique/equalHeightWestPartialTJunctionGate';
import { wallAtlas } from '../src/core/exporter';
import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import { DEFAULT_STYLE, DEFAULT_WALLS } from '../src/data/defaults';
import { PROP_TEMPLATES } from '../src/props/templates';
import {
  BLOB_CONFIGS,
  NB,
  blobContract,
  blobIndex,
  configForIndex,
} from '../src/tiles/blob';
import { FLOOR_TEMPLATES, WALL_TEMPLATES } from '../src/tiles/templates';

const PROPOSAL_PREFIX =
  'assets/walls/quota-co-building-system-proofs/west-partial-t-junction';
const PROPOSAL_DIRECTORY = path.resolve(process.cwd(), PROPOSAL_PREFIX);
const CANONICAL_DIRECTORY = path.resolve(
  process.cwd(),
  'assets/walls/quota-co-building-system',
);
const HORIZONTAL_REPEAT_DIRECTORY = path.resolve(
  process.cwd(),
  'assets/walls/quota-co-building-system-proofs/thick-wall-horizontal-repeat',
);
const THICK_WALL_BLOCK_DIRECTORY = path.resolve(
  process.cwd(),
  'assets/walls/quota-co-building-system-proofs/thick-wall-block',
);

type Matrix = readonly (readonly (number | null)[])[];

const source = (filename: string): string =>
  readFileSync(path.join(PROPOSAL_DIRECTORY, filename), 'utf8');

const sourceAt = (directory: string, filename: string): string =>
  readFileSync(path.join(directory, filename), 'utf8');

const sourceIds = (svg: string): readonly string[] =>
  [...svg.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]);

const pathData = (svg: string, id: string): string | undefined =>
  svg.match(new RegExp(`<path\\b[^>]*\\bid="${id}"[^>]*\\bd="([^"]+)"`))?.[1];

const stripSvgShell = (svg: string): string =>
  svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

interface Raster {
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint8Array;
}

type Edge = 'north' | 'east' | 'south' | 'west';

function rasterPair(
  baseSource: string,
  upperSource: string,
  size = 128,
): Raster {
  const rendered = new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" ` +
      'viewBox="0 0 128 128">' +
      `${stripSvgShell(baseSource)}${stripSvgShell(upperSource)}</svg>`,
    { font: { loadSystemFonts: false } },
  ).render();
  return { width: rendered.width, height: rendered.height, pixels: rendered.pixels };
}

function rasterUpper(upperSource: string): Raster {
  return rasterPair(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"/>',
    upperSource,
  );
}

function rgbaAt(raster: Raster, x: number, y: number): readonly number[] {
  const offset = (y * raster.width + x) * 4;
  return [...raster.pixels.slice(offset, offset + 4)];
}

function edgeProfile(raster: Raster, edge: Edge): readonly (readonly number[])[] {
  return Array.from({ length: 128 }, (_, position) => {
    if (edge === 'north') return rgbaAt(raster, position, 0);
    if (edge === 'east') return rgbaAt(raster, 127, position);
    if (edge === 'south') return rgbaAt(raster, position, 127);
    return rgbaAt(raster, 0, position);
  });
}

const opaqueProfile = (raster: Raster, edge: Edge): readonly boolean[] =>
  edgeProfile(raster, edge).map((rgba) => rgba[3] === 255);

function expectRegisteredSocket(
  actual: readonly (readonly number[])[],
  expected: readonly (readonly number[])[],
  stablePositions: readonly number[],
  label: string,
): void {
  expect(actual.map((rgba) => rgba[3] === 255), `${label} opaque profile`)
    .toEqual(expected.map((rgba) => rgba[3] === 255));
  for (const position of stablePositions) {
    expect(actual[position], `${label} material at ${position}`)
      .toEqual(expected[position]);
  }
}

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

/** Derive every mask index from occupied cells instead of trusting diagram labels. */
function matrixFor(pattern: readonly string[]): Matrix {
  const rows = pattern.length;
  const columns = pattern[0].length;
  expect(pattern.every((row) => row.length === columns)).toBe(true);
  const occupied = (col: number, row: number): boolean =>
    row >= 0 && row < rows && col >= 0 && col < columns && pattern[row][col] === '#';
  return pattern.map((row, rowIndex) => [...row].map((cell, colIndex) => {
    if (cell !== '#') return null;
    let raw = 0;
    for (const [bit, dx, dy] of NEIGHBORS) {
      if (occupied(colIndex + dx, rowIndex + dy)) raw |= bit;
    }
    return blobIndex(raw);
  }));
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

describe('QuotaCo owner-accepted west partial T-junction gate', () => {
  it('locks the state diamond, fixed-light roles, and exact candidate topology', () => {
    expect(EQUAL_HEIGHT_WEST_PARTIAL_T_JUNCTION_GATE).toMatchObject({
      stem: 'equal-height-west-partial-t-junction-gate',
      version: 0,
      status: 'owner-accepted-west-partial-t-junction-gate',
      contract: false,
      topologyClass: 'single-filled-pocket-t-junction-pair',
      stateDiamond: {
        openMaskIndex: 7,
        partialMaskIndices: [17, 21],
        filledMaskIndex: 24,
      },
      maskRowsUnderReview: [],
      maskRowsAccepted: [17, 21],
      acceptedMirrorRows: [36, 27],
      reviewCellSizes: [240, 90, 40],
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
    expect(EQUAL_HEIGHT_WEST_PARTIAL_T_JUNCTION_GATE.candidates).toEqual([
      {
        maskIndex: 17,
        sourceStem: 'open_w_t_filled_ne',
        baseFile: 'open_w_t_filled_ne-base.svg',
        upperFile: 'open_w_t_filled_ne-upper.svg',
        solidDiagonal: 'ne',
        openPocket: 'se',
        fixedLightRole: 'foreground',
        eastSocketControl: 38,
        transform: 'none',
        resolution: 'direct-reuse',
      },
      {
        maskIndex: 21,
        sourceStem: 'open_w_t_filled_se',
        baseFile: 'open_w_t_filled_se-base.svg',
        upperFile: 'open_w_t_filled_se-upper.svg',
        solidDiagonal: 'se',
        openPocket: 'ne',
        fixedLightRole: 'rear',
        eastSocketControl: 31,
        transform: 'none',
        resolution: 'direct-reuse',
      },
    ]);
    expect(BLOB_CONFIGS[17]).toBe(23);
    expect(BLOB_CONFIGS[21]).toBe(39);
    expect(configForIndex(17)).toEqual({
      n: true, e: true, s: true, w: false,
      ne: 'solid', se: 'concave', sw: 'exposed', nw: 'exposed',
    });
    expect(configForIndex(21)).toEqual({
      n: true, e: true, s: true, w: false,
      ne: 'concave', se: 'solid', sw: 'exposed', nw: 'exposed',
    });
    expect(() => validateEqualHeightWestPartialTJunctionGate()).not.toThrow();
  });

  it('derives the declared compact and long matrices from exact occupancy', () => {
    expect(EQUAL_HEIGHT_WEST_PARTIAL_T_JUNCTION_GATE.compactMatrices)
      .toEqual({
        filledNorthEast: matrixFor(['##', '##', '#.']),
        filledSouthEast: matrixFor(['#.', '##', '##']),
      });
    expect(EQUAL_HEIGHT_WEST_PARTIAL_T_JUNCTION_GATE.longMatrices)
      .toEqual({
        filledNorthEast: matrixFor([
          '######',
          '######',
          '#.....',
          '#.....',
          '#.....',
        ]),
        filledSouthEast: matrixFor([
          '#.....',
          '#.....',
          '#.....',
          '######',
          '######',
        ]),
      });

    for (const matrix of [
      ...Object.values(EQUAL_HEIGHT_WEST_PARTIAL_T_JUNCTION_GATE.compactMatrices),
      ...Object.values(EQUAL_HEIGHT_WEST_PARTIAL_T_JUNCTION_GATE.longMatrices),
    ]) {
      for (const index of matrix.flat()) {
        if (index === null || index === 17 || index === 21) continue;
        expect(
          EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution.status,
          `matrix neighbor mask_${index}`,
        ).toBe('accepted-source-mapping');
      }
    }
  });

  it('keeps the west-authored candidates and their accepted east derivations explicit', () => {
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[17]).toMatchObject({
      topologyClass: 't-junction',
      connectedEdges: ['n', 'e', 's'],
      exposedEdges: ['w'],
      pockets: ['se'],
      solidDiagonals: ['ne'],
      resolution: {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [{
          sourceStem: 'open_w_t_filled_ne',
          baseFile: 'open_w_t_filled_ne-base.svg',
          upperFile: 'open_w_t_filled_ne-upper.svg',
          transform: 'none',
          derivation: 'none',
        }],
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[21]).toMatchObject({
      topologyClass: 't-junction',
      connectedEdges: ['n', 'e', 's'],
      exposedEdges: ['w'],
      pockets: ['ne'],
      solidDiagonals: ['se'],
      resolution: {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [{
          sourceStem: 'open_w_t_filled_se',
          baseFile: 'open_w_t_filled_se-base.svg',
          upperFile: 'open_w_t_filled_se-upper.svg',
          transform: 'none',
          derivation: 'none',
        }],
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[36]).toMatchObject({
      pockets: ['sw'], solidDiagonals: ['nw'],
      resolution: {
        kind: 'approved-derivation', status: 'accepted-source-mapping',
        variants: [{
          sourceStem: 'open_w_t_filled_ne', transform: 'mirror-x',
          derivation: 'accepted-southeast-seam-filter',
        }],
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[27]).toMatchObject({
      pockets: ['nw'], solidDiagonals: ['sw'],
      resolution: {
        kind: 'approved-derivation', status: 'accepted-source-mapping',
        variants: [{
          sourceStem: 'open_w_t_filled_se', transform: 'mirror-x', derivation: 'none',
        }],
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[7].resolution.status)
      .toBe('accepted-source-mapping');
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[24].resolution.status)
      .toBe('accepted-source-mapping');
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
    'direct-reuse': 28,
      'approved-derivation': 19,
    'synthetic-assembly': 0,
      'unresolved-authored-geometry': 0,
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries
      .filter(({ resolution }) => resolution.status === 'accepted-source-mapping'))
      .toHaveLength(47);
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries
      .filter(({ resolution }) => resolution.status === 'proof-only-candidate'))
      .toHaveLength(0);
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries
      .filter(({ topologyClass, resolution }) => (
        topologyClass === 't-junction' && resolution.kind === 'synthetic-assembly'
      ))
      .map(({ index }) => index))
      .toEqual([]);
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries
      .filter(({ topologyClass }) => topologyClass === 'cross-junction'))
      .toHaveLength(16);
  });

  it('locks the corrected N/E/S socket profiles and keeps highlight out of mask_17 north', () => {
    const mask17 = rasterPair(
      source('open_w_t_filled_ne-base.svg'),
      source('open_w_t_filled_ne-upper.svg'),
    );
    const mask21 = rasterPair(
      source('open_w_t_filled_se-base.svg'),
      source('open_w_t_filled_se-upper.svg'),
    );
    const mask38 = rasterPair(
      sourceAt(HORIZONTAL_REPEAT_DIRECTORY, 'filled_s_middle-base.svg'),
      sourceAt(HORIZONTAL_REPEAT_DIRECTORY, 'filled_s_middle-upper.svg'),
    );
    const mask31 = rasterPair(
      sourceAt(HORIZONTAL_REPEAT_DIRECTORY, 'filled_n_middle-base.svg'),
      sourceAt(HORIZONTAL_REPEAT_DIRECTORY, 'filled_n_middle-upper.svg'),
    );
    const westVertical = rasterPair(
      sourceAt(CANONICAL_DIRECTORY, 'full_w_straight-base.svg'),
      sourceAt(CANONICAL_DIRECTORY, 'full_w_straight-upper.svg'),
    );
    const mask16 = rasterPair(
      sourceAt(THICK_WALL_BLOCK_DIRECTORY, 'filled_sw_elbow-base.svg'),
      sourceAt(THICK_WALL_BLOCK_DIRECTORY, 'filled_sw_elbow-upper.svg'),
    );

    // Foreground mask_17 owns the mask_38 socket silhouette and every stable
    // interior material phase. The two source-local edge antialias pixels remain
    // intentionally independent.
    const mask17East = edgeProfile(mask17, 'east');
    const mask38West = edgeProfile(mask38, 'west');
    expectRegisteredSocket(
      mask17East,
      mask38West,
      [10, 30, 60, 68, 90, 115, 120],
      'mask_17/mask_38 east-west socket',
    );
    // The continuation's low-alpha contact shade is not silhouette, but every solid
    // pixel of the south socket must register exactly with the accepted west wall.
    expect(opaqueProfile(mask17, 'south')).toEqual(opaqueProfile(westVertical, 'north'));

    // Rear mask_21 keeps the registered silhouette and stable material phases
    // at all three cardinal sockets; subpixel edge ownership stays source-local.
    expectRegisteredSocket(
      edgeProfile(mask21, 'north'),
      edgeProfile(westVertical, 'south'),
      [12, 20, 50, 75, 83, 90, 100, 115, 120],
      'mask_21 north',
    );
    expectRegisteredSocket(
      edgeProfile(mask21, 'east'),
      edgeProfile(mask31, 'west'),
      [12, 30, 60, 90, 115, 120],
      'mask_21 east',
    );
    expectRegisteredSocket(
      edgeProfile(mask21, 'south'),
      edgeProfile(mask16, 'north'),
      [12, 20, 50, 75, 83, 90, 100, 115, 120],
      'mask_21 south',
    );

    // The filled NE quadrant reaches the north socket as plain cream. A lit overlay
    // here would make the transition choose a second perspective at the seam.
    const mask17Upper = rasterUpper(source('open_w_t_filled_ne-upper.svg'));
    const northProfile = edgeProfile(mask17Upper, 'north');
    expect(northProfile.slice(12, 14)).toEqual([
      [37, 42, 40, 255],
      [37, 42, 40, 255],
    ]);
    expect(northProfile.slice(15)).toEqual(
      Array.from({ length: 113 }, () => [217, 208, 185, 255]),
    );
  });

  it('clips the Mask 17 contact shadow around the continuing south socket', () => {
    const baseSource = source('open_w_t_filled_ne-base.svg');
    const upperSource = source('open_w_t_filled_ne-upper.svg');
    expect(pathData(baseSource, 'base-contact-shade-open-se')).toBe(
      'M117.693 69.574L123.5 69.574 123.5 76.211 117.693 76.211ZM117.693 117.693L128 117.693 128 123.5 123.5 123.5 123.5 128 117.693 128Z',
    );

    const direct = rasterPair(baseSource, upperSource);
    expect(rgbaAt(direct, 110, 121)).toEqual([36, 66, 53, 255]);
    expect(rgbaAt(direct, 116, 121)).toEqual([37, 42, 40, 255]);
    expect(rgbaAt(direct, 117, 121)).toEqual([27, 31, 29, 194]);
    expect(rgbaAt(direct, 120, 121)).toEqual([0, 0, 0, 31]);
    expect(rgbaAt(direct, 121, 126)).toEqual([0, 0, 0, 31]);

    const direct40 = rasterPair(baseSource, upperSource, 40);
    expect(rgbaAt(direct40, 34, 38)).toEqual([36, 66, 53, 255]);
    expect(rgbaAt(direct40, 36, 38)).toEqual([27, 31, 29, 194]);
    expect(rgbaAt(direct40, 37, 38)).toEqual([0, 0, 0, 31]);
  });

  it('strictly compiles four external fixed-view sources with distinct socket roles', async () => {
    expect(A1B_WEST_PARTIAL_T_JUNCTION_PROPOSAL_SOURCE_INVENTORY).toEqual([
      {
        id: 'open_w_t_filled_ne-base',
        filename: 'open_w_t_filled_ne-base.svg',
        sourceMaskIndex: 17,
        fixedLightRole: 'foreground-transition',
        layer: 'base',
        semanticGroup: 'detail/base',
      },
      {
        id: 'open_w_t_filled_ne-upper',
        filename: 'open_w_t_filled_ne-upper.svg',
        sourceMaskIndex: 17,
        fixedLightRole: 'foreground-transition',
        layer: 'upper',
        semanticGroup: 'detail/upper',
      },
      {
        id: 'open_w_t_filled_se-base',
        filename: 'open_w_t_filled_se-base.svg',
        sourceMaskIndex: 21,
        fixedLightRole: 'rear-transition',
        layer: 'base',
        semanticGroup: 'detail/base',
      },
      {
        id: 'open_w_t_filled_se-upper',
        filename: 'open_w_t_filled_se-upper.svg',
        sourceMaskIndex: 21,
        fixedLightRole: 'rear-transition',
        layer: 'upper',
        semanticGroup: 'detail/upper',
      },
    ]);
    expect(readdirSync(PROPOSAL_DIRECTORY)
      .filter((filename) => filename.endsWith('.svg')).sort()).toEqual([
      'open_w_t_filled_ne-base.svg',
      'open_w_t_filled_ne-upper.svg',
      'open_w_t_filled_se-base.svg',
      'open_w_t_filled_se-upper.svg',
    ]);

    const compiled = await compileA1bWestPartialTJunctionProposalDirectory({
      inputDir: PROPOSAL_DIRECTORY,
      sourcePathPrefix: PROPOSAL_PREFIX,
    });
    expect(compiled.map(({ sourceFile }) => sourceFile)).toEqual([
      `${PROPOSAL_PREFIX}/open_w_t_filled_ne-base.svg`,
      `${PROPOSAL_PREFIX}/open_w_t_filled_ne-upper.svg`,
      `${PROPOSAL_PREFIX}/open_w_t_filled_se-base.svg`,
      `${PROPOSAL_PREFIX}/open_w_t_filled_se-upper.svg`,
    ]);
    expect(compiled.every(({ shapes }) => shapes.length > 0)).toBe(true);
    expect(compiled.every(({ content }) => (
      /viewBox=["']0 0 128 128["']/.test(content) &&
      !/\btransform\s*=/.test(content)
    ))).toBe(true);

    const foregroundUpper = source('open_w_t_filled_ne-upper.svg');
    const rearUpper = source('open_w_t_filled_se-upper.svg');
    expect(sourceIds(foregroundUpper)).toContain('upper-plane-light-open-se');
    expect(sourceIds(foregroundUpper)).toContain('upper-arris-lip-open-se');
    expect(sourceIds(foregroundUpper)).toContain('upper-south-face-shade');
    expect(foregroundUpper).toContain(
      'id="upper-south-face-shade" d="M89.485 23.115L128 23.115 128 57.959 89.485 57.959Z"',
    );
    expect(foregroundUpper).toContain(
      'id="upper-lip-seam" d="M89.485 62.937L127 62.937"',
    );
    expect(sourceIds(foregroundUpper)).toContain('upper-coral-open-se');
    expect(sourceIds(rearUpper)).toContain('upper-solid-top-highlight');
    expect(sourceIds(rearUpper)).not.toContain('upper-south-face-shade');
  });

  it('keeps accepted proof sources out of canonical templates and authored stems', () => {
    expect(A1B_AUTHORED_STEMS).not.toContain('open_w_t_filled_ne');
    expect(A1B_AUTHORED_STEMS).not.toContain('open_w_t_filled_se');
    expect(WALL_TEMPLATES.map(({ id }) => id)).not.toContain('open_w_t_filled_ne');
    expect(WALL_TEMPLATES.map(({ id }) => id)).not.toContain('open_w_t_filled_se');
  });

  it('rejects demotion, mirroring, and production claims', () => {
    expect(() => validateEqualHeightWestPartialTJunctionGate({
      ...EQUAL_HEIGHT_WEST_PARTIAL_T_JUNCTION_GATE,
      maskRowsUnderReview: [17, 21] as const,
      maskRowsAccepted: [] as const,
    } as unknown as typeof EQUAL_HEIGHT_WEST_PARTIAL_T_JUNCTION_GATE))
      .toThrow(/identity drift/);
    expect(() => validateEqualHeightWestPartialTJunctionGate({
      ...EQUAL_HEIGHT_WEST_PARTIAL_T_JUNCTION_GATE,
      xMirrorAllowed: true,
    } as unknown as typeof EQUAL_HEIGHT_WEST_PARTIAL_T_JUNCTION_GATE))
      .toThrow(/proof-only boundary/);
    expect(() => validateEqualHeightWestPartialTJunctionGate({
      ...EQUAL_HEIGHT_WEST_PARTIAL_T_JUNCTION_GATE,
      productionRegistration: true,
    } as unknown as typeof EQUAL_HEIGHT_WEST_PARTIAL_T_JUNCTION_GATE))
      .toThrow(/proof-only boundary/);
  });

  it('leaves the production catalog and export signature byte-identical', () => {
    expect(productionSignature()).toBe(productionBefore);
  });
});
