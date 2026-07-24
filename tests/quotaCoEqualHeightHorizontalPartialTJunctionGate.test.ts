import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import {
  A1B_HORIZONTAL_PARTIAL_T_JUNCTION_PROPOSAL_SOURCE_INVENTORY,
  compileA1bHorizontalPartialTJunctionProposalDirectory,
} from '../scripts/highOblique/a1bHorizontalPartialTJunctionProposal';
import { A1B_AUTHORED_STEMS } from '../scripts/highOblique/a1bAuthoredProof';
import {
  EQUAL_HEIGHT_HORIZONTAL_PARTIAL_T_JUNCTION_GATE,
  type EqualHeightHorizontalPartialTJunctionMask,
  validateEqualHeightHorizontalPartialTJunctionGate,
} from '../scripts/highOblique/equalHeightHorizontalPartialTJunctionGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from '../scripts/highOblique/equalHeightMaskLedger';
import { derivePromotedSoutheastSourcePair } from '../scripts/highOblique/equalHeightWallDirection';
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

const SOURCE_PREFIX =
  'assets/walls/quota-co-building-system-proofs/horizontal-partial-t-junction';
const SOURCE_DIRECTORY = path.resolve(process.cwd(), SOURCE_PREFIX);

type Matrix = readonly (readonly (number | null)[])[];

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

const source = (filename: string): string =>
  readFileSync(path.join(SOURCE_DIRECTORY, filename), 'utf8');

const stripSvgShell = (svg: string): string =>
  svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

const sourceIds = (svg: string): readonly string[] =>
  [...svg.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]);

function rasterPair(
  pair: SourcePair,
  cellPixels: number,
): Raster {
  const content = `${stripSvgShell(pair.baseSource)}${stripSvgShell(pair.upperSource)}`;
  const body = pair.mirrorX
    ? `<g transform="matrix(-1 0 0 1 128 0)">${content}</g>`
    : content;
  const rendered = new Resvg(
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ' +
      `viewBox="0 0 128 128">${body}</svg>`,
    {
      fitTo: { mode: 'width', value: cellPixels },
      font: { loadSystemFonts: false },
    },
  ).render();
  return { width: rendered.width, height: rendered.height, pixels: rendered.pixels };
}

function candidateSourcePair(
  maskIndex: EqualHeightHorizontalPartialTJunctionMask,
): SourcePair {
  const candidate = EQUAL_HEIGHT_HORIZONTAL_PARTIAL_T_JUNCTION_GATE
    .candidates.find(({ maskIndex: index }) => index === maskIndex);
  if (!candidate) throw new Error(`Missing horizontal partial candidate mask_${maskIndex}`);
  const baseSource = source(candidate.baseFile);
  const upperSource = source(candidate.upperFile);
  const derived = candidate.derivation === 'accepted-southeast-seam-filter'
    ? derivePromotedSoutheastSourcePair(baseSource, upperSource)
    : { baseSource, upperSource };
  return {
    ...derived,
    mirrorX: candidate.transform === 'mirror-x',
  };
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

/** Derive every mask from literal occupied cells rather than trusting labels. */
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

describe('QuotaCo owner-accepted horizontal partial T-junction gate', () => {
  it('locks both state diamonds, all four accepted mappings, and the exact review matrices', () => {
    expect(EQUAL_HEIGHT_HORIZONTAL_PARTIAL_T_JUNCTION_GATE).toMatchObject({
      stem: 'equal-height-horizontal-partial-t-junction-gate',
      version: 0,
      status: 'owner-accepted-horizontal-partial-t-junction-gate',
      contract: false,
      topologyClass: 'horizontal-single-filled-pocket-t-junction-family',
      stateDiamonds: {
        openSouth: {
          openMaskIndex: 11,
          partialMaskIndices: [18, 35],
          filledMaskIndex: 38,
        },
        openNorth: {
          openMaskIndex: 14,
          partialMaskIndices: [22, 28],
          filledMaskIndex: 31,
        },
      },
      compactMatrices: {
        mask18: [[null, 20, 26], [2, 18, 34], [null, null, null]],
        mask35: [[20, 26, null], [16, 35, 8], [null, null, null]],
        mask22: [[null, null, null], [2, 22, 26], [null, 16, 34]],
        mask28: [[null, null, null], [20, 28, 8], [16, 34, null]],
      },
      longMatrices: {
        mask18: [
          [null, null, null, null, 4, null, null, null, null, null],
          [null, null, null, null, 5, null, null, null, null, null],
          [null, null, null, null, 5, null, null, null, null, null],
          [null, null, null, null, 21, 31, 31, 31, 31, 26],
          [2, 10, 10, 10, 18, 38, 38, 38, 38, 34],
        ],
        mask35: [
          [null, null, null, null, null, 4, null, null, null, null],
          [null, null, null, null, null, 5, null, null, null, null],
          [null, null, null, null, null, 5, null, null, null, null],
          [20, 31, 31, 31, 31, 27, null, null, null, null],
          [16, 38, 38, 38, 38, 35, 10, 10, 10, 8],
        ],
        mask22: [
          [2, 10, 10, 10, 22, 31, 31, 31, 31, 26],
          [null, null, null, null, 17, 38, 38, 38, 38, 34],
          [null, null, null, null, 5, null, null, null, null, null],
          [null, null, null, null, 5, null, null, null, null, null],
          [null, null, null, null, 1, null, null, null, null, null],
        ],
        mask28: [
          [20, 31, 31, 31, 31, 28, 10, 10, 10, 8],
          [16, 38, 38, 38, 38, 36, null, null, null, null],
          [null, null, null, null, null, 5, null, null, null, null],
          [null, null, null, null, null, 5, null, null, null, null],
          [null, null, null, null, null, 1, null, null, null, null],
        ],
      },
      maskRowsUnderReview: [],
      maskRowsAccepted: [18, 35, 22, 28],
      reviewCellSizes: [240, 90, 40],
      reviewArmLengths: [1, 3, 6],
      xMirrorAllowed: true,
      yMirrorAllowed: false,
      rotationAllowed: false,
      productionRegistration: false,
      productionTopologyMutation: false,
      schemaChange: false,
      exportable: false,
      committedAtlas: false,
      temporaryFrameIds: true,
    });
    expect(EQUAL_HEIGHT_HORIZONTAL_PARTIAL_T_JUNCTION_GATE.candidates).toEqual([
      {
        maskIndex: 18, sourceMaskIndex: 18, sourceStem: 'open_s_t_filled_ne',
        baseFile: 'open_s_t_filled_ne-base.svg',
        upperFile: 'open_s_t_filled_ne-upper.svg',
        opening: 'south', fixedLightRole: 'foreground',
        solidDiagonal: 'ne', openPocket: 'nw', transform: 'none',
        derivation: 'none', resolution: 'direct-reuse',
      },
      {
        maskIndex: 35, sourceMaskIndex: 18, sourceStem: 'open_s_t_filled_ne',
        baseFile: 'open_s_t_filled_ne-base.svg',
        upperFile: 'open_s_t_filled_ne-upper.svg',
        opening: 'south', fixedLightRole: 'foreground',
        solidDiagonal: 'nw', openPocket: 'ne', transform: 'mirror-x',
        derivation: 'accepted-southeast-seam-filter',
        resolution: 'approved-derivation',
      },
      {
        maskIndex: 22, sourceMaskIndex: 22, sourceStem: 'open_n_t_filled_se',
        baseFile: 'open_n_t_filled_se-base.svg',
        upperFile: 'open_n_t_filled_se-upper.svg',
        opening: 'north', fixedLightRole: 'rear',
        solidDiagonal: 'se', openPocket: 'sw', transform: 'none',
        derivation: 'none', resolution: 'direct-reuse',
      },
      {
        maskIndex: 28, sourceMaskIndex: 22, sourceStem: 'open_n_t_filled_se',
        baseFile: 'open_n_t_filled_se-base.svg',
        upperFile: 'open_n_t_filled_se-upper.svg',
        opening: 'north', fixedLightRole: 'rear',
        solidDiagonal: 'sw', openPocket: 'se', transform: 'mirror-x',
        derivation: 'none', resolution: 'approved-derivation',
      },
    ]);
    expect(configForIndex(18)).toEqual({
      n: true, e: true, s: false, w: true,
      ne: 'solid', se: 'exposed', sw: 'exposed', nw: 'concave',
    });
    expect(configForIndex(35)).toEqual({
      n: true, e: true, s: false, w: true,
      ne: 'concave', se: 'exposed', sw: 'exposed', nw: 'solid',
    });
    expect(configForIndex(22)).toEqual({
      n: false, e: true, s: true, w: true,
      ne: 'exposed', se: 'solid', sw: 'concave', nw: 'exposed',
    });
    expect(configForIndex(28)).toEqual({
      n: false, e: true, s: true, w: true,
      ne: 'exposed', se: 'concave', sw: 'solid', nw: 'exposed',
    });
    expect(() => validateEqualHeightHorizontalPartialTJunctionGate()).not.toThrow();
  });

  it('mechanically recomputes every compact and long mask from occupied cells', () => {
    expect(EQUAL_HEIGHT_HORIZONTAL_PARTIAL_T_JUNCTION_GATE.compactMatrices)
      .toEqual({
        mask18: matrixFor(['.##', '###', '...']),
        mask35: matrixFor(['##.', '###', '...']),
        mask22: matrixFor(['...', '###', '.##']),
        mask28: matrixFor(['...', '###', '##.']),
      });
    expect(EQUAL_HEIGHT_HORIZONTAL_PARTIAL_T_JUNCTION_GATE.longMatrices)
      .toEqual({
        mask18: matrixFor([
          '....#.....',
          '....#.....',
          '....#.....',
          '....######',
          '##########',
        ]),
        mask35: matrixFor([
          '.....#....',
          '.....#....',
          '.....#....',
          '######....',
          '##########',
        ]),
        mask22: matrixFor([
          '##########',
          '....######',
          '....#.....',
          '....#.....',
          '....#.....',
        ]),
        mask28: matrixFor([
          '##########',
          '######....',
          '.....#....',
          '.....#....',
          '.....#....',
        ]),
      });

    for (const matrix of [
      ...Object.values(EQUAL_HEIGHT_HORIZONTAL_PARTIAL_T_JUNCTION_GATE.compactMatrices),
      ...Object.values(EQUAL_HEIGHT_HORIZONTAL_PARTIAL_T_JUNCTION_GATE.longMatrices),
    ]) {
      for (const index of matrix.flat()) {
        if (index === null || [18, 35, 22, 28].includes(index)) continue;
        expect(
          EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution.status,
          `matrix neighbor mask_${index}`,
        ).toBe('accepted-source-mapping');
      }
    }
  });

  it('locks all four rows as accepted mappings and leaves only cross-junctions synthetic', () => {
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
    'direct-reuse': 25,
      'approved-derivation': 17,
    'synthetic-assembly': 5,
      'unresolved-authored-geometry': 0,
    });
    for (const maskIndex of [18, 35, 22, 28] as const) {
      expect(EQUAL_HEIGHT_MASK_LEDGER.entries[maskIndex]).toMatchObject({
        topologyClass: 't-junction',
        resolution: {
          kind: [18, 22].includes(maskIndex) ? 'direct-reuse' : 'approved-derivation',
          status: 'accepted-source-mapping',
        },
      });
    }
    expect(EQUAL_HEIGHT_HORIZONTAL_PARTIAL_T_JUNCTION_GATE.acceptedLedgerCounts)
      .toEqual(EQUAL_HEIGHT_MASK_LEDGER.counts);
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries
      .filter(({ resolution }) => resolution.status === 'accepted-source-mapping'))
      .toHaveLength(42);
    const synthetic = EQUAL_HEIGHT_MASK_LEDGER.entries
      .filter(({ resolution }) => resolution.status === 'proof-only-candidate');
    expect(synthetic).toHaveLength(5);
    expect(synthetic.every(({ topologyClass }) => topologyClass === 'cross-junction'))
      .toBe(true);
  });

  it('compiles exactly four fixed-view sources with the locked semantic inventory', async () => {
    expect(A1B_HORIZONTAL_PARTIAL_T_JUNCTION_PROPOSAL_SOURCE_INVENTORY).toEqual([
      {
        id: 'open_s_t_filled_ne-base', filename: 'open_s_t_filled_ne-base.svg',
        sourceMaskIndex: 18, fixedLightRole: 'foreground-transition',
        layer: 'base', semanticGroup: 'detail/base',
      },
      {
        id: 'open_s_t_filled_ne-upper', filename: 'open_s_t_filled_ne-upper.svg',
        sourceMaskIndex: 18, fixedLightRole: 'foreground-transition',
        layer: 'upper', semanticGroup: 'detail/upper',
      },
      {
        id: 'open_n_t_filled_se-base', filename: 'open_n_t_filled_se-base.svg',
        sourceMaskIndex: 22, fixedLightRole: 'rear-transition',
        layer: 'base', semanticGroup: 'detail/base',
      },
      {
        id: 'open_n_t_filled_se-upper', filename: 'open_n_t_filled_se-upper.svg',
        sourceMaskIndex: 22, fixedLightRole: 'rear-transition',
        layer: 'upper', semanticGroup: 'detail/upper',
      },
    ]);
    expect(readdirSync(SOURCE_DIRECTORY).sort()).toEqual([
      'README.md',
      'open_n_t_filled_se-base.svg',
      'open_n_t_filled_se-upper.svg',
      'open_s_t_filled_ne-base.svg',
      'open_s_t_filled_ne-upper.svg',
    ]);

    const compiled = await compileA1bHorizontalPartialTJunctionProposalDirectory({
      inputDir: SOURCE_DIRECTORY,
      sourcePathPrefix: SOURCE_PREFIX,
    });
    expect(compiled.map(({ sourceFile }) => sourceFile)).toEqual(
      A1B_HORIZONTAL_PARTIAL_T_JUNCTION_PROPOSAL_SOURCE_INVENTORY.map(
        ({ filename }) => `${SOURCE_PREFIX}/${filename}`,
      ),
    );
    expect(compiled.map(({ content }) => sourceIds(content))).toEqual([
      [
        'detail/base', 'base-buried-ne-underlay', 'base-contour',
        'base-green-open-nw', 'base-contact-shade-open-nw', 'base-boundary-seam',
      ],
      [
        'detail/upper', 'upper-contour', 'upper-shell', 'upper-reveal-open-nw',
        'upper-south-face-shade', 'upper-coral-open-nw', 'upper-band-light',
        'upper-green-open-nw', 'upper-plinth', 'upper-arris-seam',
        'upper-band-seam', 'upper-boundary-seam',
      ],
      [
        'detail/base', 'base-buried-se-underlay', 'base-contour-open-sw',
        'base-green-open-sw', 'base-face-shade-open-sw',
        'base-contact-shade-open-sw',
      ],
      [
        'detail/upper', 'upper-contour', 'upper-shell',
        'upper-plane-light-open-sw', 'upper-coral-open-sw', 'upper-band-light',
        'upper-green-open-sw', 'upper-face-shade-open-sw',
        'upper-solid-top-highlight', 'upper-arris-seam', 'upper-band-seam',
      ],
    ]);
    for (const compiledSource of compiled) {
      expect(compiledSource.shapes.length).toBeGreaterThan(0);
      expect(compiledSource.shapes.every(({ silhouette }) => silhouette === false)).toBe(true);
      expect(compiledSource.content).toMatch(/viewBox="0 0 128 128"/);
      expect(compiledSource.content).not.toMatch(/\btransform\s*=|\brotate\s*\(/i);
      expect(compiledSource.content).not.toMatch(
        /\bid=["'][^"']*(?:cap|post|pylon|rollover|four-way|overlay|patch)/i,
      );
    }
    expect(A1B_AUTHORED_STEMS).not.toContain('open_s_t_filled_ne');
    expect(A1B_AUTHORED_STEMS).not.toContain('open_n_t_filled_se');
  });

  it('rasterizes every candidate at 240, 90, and 40 pixels without empty output', () => {
    for (const maskIndex of [18, 35, 22, 28] as const) {
      for (const cellPixels of [240, 90, 40] as const) {
        const raster = rasterPair(candidateSourcePair(maskIndex), cellPixels);
        expect([raster.width, raster.height], `mask_${maskIndex} at ${cellPixels}px`)
          .toEqual([cellPixels, cellPixels]);
        expect(
          raster.pixels.some((channel, offset) => offset % 4 === 3 && channel > 0),
          `mask_${maskIndex} alpha at ${cellPixels}px`,
        ).toBe(true);
      }
    }
  });

  it('filters mask_35 boundary seams before mirror-X and keeps mask_28 a raw mirror', () => {
    const southBase = source('open_s_t_filled_ne-base.svg');
    const southUpper = source('open_s_t_filled_ne-upper.svg');
    const filteredSouth = derivePromotedSoutheastSourcePair(southBase, southUpper);
    expect(southBase).toContain('id="base-boundary-seam"');
    expect(southUpper).toContain('id="upper-boundary-seam"');
    expect(filteredSouth.baseSource).not.toContain('base-boundary-seam');
    expect(filteredSouth.upperSource).not.toContain('upper-boundary-seam');
    expect(sourceIds(filteredSouth.baseSource)).toEqual(
      sourceIds(southBase).filter((id) => id !== 'base-boundary-seam'),
    );
    expect(sourceIds(filteredSouth.upperSource)).toEqual(
      sourceIds(southUpper).filter((id) => id !== 'upper-boundary-seam'),
    );

    const filteredMask35 = rasterPair({ ...filteredSouth, mirrorX: true }, 240);
    const rawMask35 = rasterPair({
      baseSource: southBase,
      upperSource: southUpper,
      mirrorX: true,
    }, 240);
    expect(Buffer.from(candidateSourcePair(35).baseSource))
      .toEqual(Buffer.from(filteredSouth.baseSource));
    expect(Buffer.from(candidateSourcePair(35).upperSource))
      .toEqual(Buffer.from(filteredSouth.upperSource));
    expect(Buffer.from(filteredMask35.pixels).equals(Buffer.from(rawMask35.pixels)))
      .toBe(false);

    const northBase = source('open_n_t_filled_se-base.svg');
    const northUpper = source('open_n_t_filled_se-upper.svg');
    expect(northBase).not.toContain('base-boundary-seam');
    expect(northUpper).not.toContain('upper-boundary-seam');
    expect(candidateSourcePair(28)).toEqual({
      baseSource: northBase,
      upperSource: northUpper,
      mirrorX: true,
    });
    for (const cellPixels of [240, 90, 40] as const) {
      const candidate28 = rasterPair(candidateSourcePair(28), cellPixels);
      const rawMirror = rasterPair({
        baseSource: northBase,
        upperSource: northUpper,
        mirrorX: true,
      }, cellPixels);
      expect(Buffer.from(candidate28.pixels).equals(Buffer.from(rawMirror.pixels)))
        .toBe(true);
    }
  });

  it('rejects gate drift and leaves the production signature byte-identical', () => {
    expect(() => validateEqualHeightHorizontalPartialTJunctionGate({
      ...EQUAL_HEIGHT_HORIZONTAL_PARTIAL_T_JUNCTION_GATE,
      maskRowsAccepted: [18],
    } as unknown as typeof EQUAL_HEIGHT_HORIZONTAL_PARTIAL_T_JUNCTION_GATE))
      .toThrow(/identity drift/);
    expect(() => validateEqualHeightHorizontalPartialTJunctionGate({
      ...EQUAL_HEIGHT_HORIZONTAL_PARTIAL_T_JUNCTION_GATE,
      productionRegistration: true,
    } as unknown as typeof EQUAL_HEIGHT_HORIZONTAL_PARTIAL_T_JUNCTION_GATE))
      .toThrow(/proof-only boundary/);
    expect(productionSignature()).toBe(productionBefore);
  });
});
