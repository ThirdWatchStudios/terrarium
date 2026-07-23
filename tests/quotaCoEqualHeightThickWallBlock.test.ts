import { readFileSync } from 'node:fs';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import {
  A1B_THICK_WALL_BLOCK_PROPOSAL_SOURCE_INVENTORY,
  compileA1bThickWallBlockProposalDirectory,
} from '../scripts/highOblique/a1bThickWallBlockProposal';
import {
  EQUAL_HEIGHT_THICK_WALL_BLOCK_GATE,
  validateEqualHeightThickWallBlockGate,
} from '../scripts/highOblique/equalHeightThickWallBlockGate';
import { derivePromotedSoutheastSourcePair } from '../scripts/highOblique/equalHeightWallDirection';
import { EQUAL_HEIGHT_MASK_LEDGER } from '../scripts/highOblique/equalHeightMaskLedger';
import { A1B_AUTHORED_STEMS } from '../scripts/highOblique/a1bAuthoredProof';
import { wallAtlas } from '../src/core/exporter';
import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import { DEFAULT_STYLE, DEFAULT_WALLS } from '../src/data/defaults';
import { PROP_TEMPLATES } from '../src/props/templates';
import { BLOB_CONFIGS, blobContract, configForIndex } from '../src/tiles/blob';
import { FLOOR_TEMPLATES, WALL_TEMPLATES } from '../src/tiles/templates';

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

const CANONICAL_DIRECTORY = path.resolve(
  process.cwd(),
  'assets/walls/quota-co-building-system',
);
const PROPOSAL_PREFIX = 'assets/walls/quota-co-building-system-proofs/thick-wall-block';
const PROPOSAL_DIRECTORY = path.resolve(process.cwd(), PROPOSAL_PREFIX);

const source = (directory: string, filename: string): string =>
  readFileSync(path.join(directory, filename), 'utf8');

const stripSvgShell = (svg: string): string =>
  svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

function rasterCandidateBlock(outputWidth = 256): Uint8Array {
  const rearBase = source(PROPOSAL_DIRECTORY, 'filled_nw_elbow-base.svg');
  const rearUpper = source(PROPOSAL_DIRECTORY, 'filled_nw_elbow-upper.svg');
  const foregroundBase = source(PROPOSAL_DIRECTORY, 'filled_sw_elbow-base.svg');
  const foregroundUpper = source(PROPOSAL_DIRECTORY, 'filled_sw_elbow-upper.svg');
  const southeast = derivePromotedSoutheastSourcePair(foregroundBase, foregroundUpper);
  const cell = (
    content: string,
    col: number,
    row: number,
    mirrorX = false,
  ): string => (
    `<svg x="${col * 128}" y="${row * 128}" width="128" height="128" viewBox="0 0 128 128">` +
    (mirrorX
      ? `<g transform="matrix(-1 0 0 1 128 0)">${stripSvgShell(content)}</g>`
      : stripSvgShell(content)) +
    '</svg>'
  );
  const basePass = [
    cell(rearBase, 0, 0),
    cell(rearBase, 1, 0, true),
    cell(foregroundBase, 0, 1),
    cell(southeast.baseSource, 1, 1, true),
  ].join('');
  const upperPass = [
    cell(rearUpper, 0, 0),
    cell(rearUpper, 1, 0, true),
    cell(foregroundUpper, 0, 1),
    cell(southeast.upperSource, 1, 1, true),
  ].join('');
  return new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" ` +
    `viewBox="0 0 256 256">${basePass}${upperPass}</svg>`,
    {
      fitTo: { mode: 'width', value: outputWidth },
      font: { loadSystemFonts: false },
    },
  ).render().pixels;
}

const rgbaAt = (
  pixels: Uint8Array,
  width: number,
  x: number,
  y: number,
): readonly [number, number, number, number] => {
  const offset = (y * width + x) * 4;
  return [pixels[offset], pixels[offset + 1], pixels[offset + 2], pixels[offset + 3]];
};

describe('QuotaCo accepted proof-layer 2x2 thick-wall block', () => {
  it('accepts the four filled-corner rows as one source family', () => {
    expect(EQUAL_HEIGHT_THICK_WALL_BLOCK_GATE).toMatchObject({
      status: 'owner-accepted-thick-wall-block-gate',
      topologyClass: 'filled-elbow-family',
      dimensions: { columns: 2, rows: 2 },
      maskRowsUnderReview: [],
      maskRowsAccepted: [16, 20, 26, 34],
      reviewCellSizes: [240, 90, 40],
      renderingDecision: {
        kind: 'two-authored-fixed-light-source-pairs',
        scope: 'external-proof-source-bank',
        sourceDirectory: PROPOSAL_PREFIX,
        authoredSourceFiles: [
          'filled_nw_elbow-base.svg',
          'filled_nw_elbow-upper.svg',
          'filled_sw_elbow-base.svg',
          'filled_sw_elbow-upper.svg',
        ],
        foregroundPlaneBreak: {
          sourceMaskIndex: 16,
          mirroredMaskIndex: 34,
          yStart: 63,
          yEnd: 88,
          paint: '#000000',
          opacity: 0.08,
          kind: 'south-facing-material-shade',
        },
      },
      productionRegistration: false,
      exportable: false,
    });
    expect(EQUAL_HEIGHT_THICK_WALL_BLOCK_GATE.cells).toEqual([
      expect.objectContaining({
        quadrant: 'northwest', col: 0, row: 0, maskIndex: 20, controlMaskIndex: 6,
        sourceStem: 'filled_nw_elbow', transform: 'none',
        resolution: 'direct-reuse', derivation: 'none',
      }),
      expect.objectContaining({
        quadrant: 'northeast', col: 1, row: 0, maskIndex: 26, controlMaskIndex: 12,
        sourceStem: 'filled_nw_elbow', transform: 'mirror-x',
        resolution: 'approved-derivation', derivation: 'none',
      }),
      expect.objectContaining({
        quadrant: 'southwest', col: 0, row: 1, maskIndex: 16, controlMaskIndex: 3,
        sourceStem: 'filled_sw_elbow', transform: 'none',
        resolution: 'direct-reuse', derivation: 'none',
      }),
      expect.objectContaining({
        quadrant: 'southeast', col: 1, row: 1, maskIndex: 34, controlMaskIndex: 9,
        sourceStem: 'filled_sw_elbow', transform: 'mirror-x',
        resolution: 'approved-derivation', derivation: 'accepted-southeast-seam-filter',
        seamPolicy: 'accepted-southeast-boundary-seam-omission',
      }),
    ]);
    expect(() => validateEqualHeightThickWallBlockGate()).not.toThrow();
  });

  it('maps every occupied quadrant to an accepted solid-diagonal source', () => {
    const expected = {
      16: { n: true, e: true, s: false, w: false, ne: 'solid' },
      20: { n: false, e: true, s: true, w: false, se: 'solid' },
      26: { n: false, e: false, s: true, w: true, sw: 'solid' },
      34: { n: true, e: false, s: false, w: true, nw: 'solid' },
    } as const;
    const accepted = {
      16: { kind: 'direct-reuse', role: 'filled-southwest-elbow', sourceStem: 'filled_sw_elbow', transform: 'none', derivation: 'none' },
      20: { kind: 'direct-reuse', role: 'filled-northwest-elbow', sourceStem: 'filled_nw_elbow', transform: 'none', derivation: 'none' },
      26: { kind: 'approved-derivation', role: 'filled-northeast-elbow', sourceStem: 'filled_nw_elbow', transform: 'mirror-x', derivation: 'none' },
      34: { kind: 'approved-derivation', role: 'filled-southeast-elbow', sourceStem: 'filled_sw_elbow', transform: 'mirror-x', derivation: 'accepted-southeast-seam-filter' },
    } as const;
    for (const index of [16, 20, 26, 34] as const) {
      expect(configForIndex(index)).toMatchObject(expected[index]);
      expect(EQUAL_HEIGHT_MASK_LEDGER.entries[index]).toMatchObject({
        topologyClass: 'filled-elbow',
        resolution: {
          kind: accepted[index].kind,
          status: 'accepted-source-mapping',
          variants: [expect.objectContaining({
            role: accepted[index].role,
            sourceStem: accepted[index].sourceStem,
            transform: accepted[index].transform,
            derivation: accepted[index].derivation,
          })],
        },
      });
    }
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
      'direct-reuse': 15,
      'approved-derivation': 12,
      'synthetic-assembly': 20,
      'unresolved-authored-geometry': 0,
    });
  });

  it('compiles exactly two fixed-light proof pairs outside the production source bank', async () => {
    expect(A1B_THICK_WALL_BLOCK_PROPOSAL_SOURCE_INVENTORY).toEqual([
      expect.objectContaining({
        id: 'filled_nw_elbow-base', sourceMaskIndex: 20,
        boundaryRole: 'rear-west', layer: 'base',
      }),
      expect.objectContaining({
        id: 'filled_nw_elbow-upper', sourceMaskIndex: 20,
        boundaryRole: 'rear-west', layer: 'upper',
      }),
      expect.objectContaining({
        id: 'filled_sw_elbow-base', sourceMaskIndex: 16,
        boundaryRole: 'foreground-west', layer: 'base',
      }),
      expect.objectContaining({
        id: 'filled_sw_elbow-upper', sourceMaskIndex: 16,
        boundaryRole: 'foreground-west', layer: 'upper',
      }),
    ]);
    const compiled = await compileA1bThickWallBlockProposalDirectory({
      inputDir: PROPOSAL_DIRECTORY,
      sourcePathPrefix: PROPOSAL_PREFIX,
    });
    expect(compiled.map(({ sourceFile }) => sourceFile)).toEqual(
      A1B_THICK_WALL_BLOCK_PROPOSAL_SOURCE_INVENTORY.map(
        ({ filename }) => `${PROPOSAL_PREFIX}/${filename}`,
      ),
    );
    expect(compiled.every(({ shapes }) => shapes.length > 0)).toBe(true);
    expect(A1B_AUTHORED_STEMS).not.toContain('filled_nw_elbow');
    expect(A1B_AUTHORED_STEMS).not.toContain('filled_sw_elbow');
  });

  it('recuts the buried pocket structurally while preserving both accepted bases', () => {
    expect(source(PROPOSAL_DIRECTORY, 'filled_nw_elbow-base.svg')).toBe(
      source(CANONICAL_DIRECTORY, 'full_exterior_corner-base.svg'),
    );
    expect(source(PROPOSAL_DIRECTORY, 'filled_sw_elbow-base.svg')).toBe(
      source(CANONICAL_DIRECTORY, 'transition_w_to_s-base.svg'),
    );
    const rearUpper = source(PROPOSAL_DIRECTORY, 'filled_nw_elbow-upper.svg');
    const foregroundUpper = source(PROPOSAL_DIRECTORY, 'filled_sw_elbow-upper.svg');
    expect(rearUpper).toContain('id="upper-solid-top-fill"');
    expect(rearUpper).toContain('d="M66 56H128V128H56V66A10 10 0 0 1 66 56Z"');
    expect(rearUpper).not.toMatch(/upper-coral|upper-green|upper-face-shade|upper-arris-seam/);
    expect(foregroundUpper).toContain('d="M56 0H128V97H66A10 10 0 0 1 56 87Z"');
    expect(foregroundUpper).toContain('id="upper-south-coral-wrap"');
    expect(foregroundUpper).toContain('id="upper-south-green-wrap"');
    expect(foregroundUpper).toContain(
      'id="upper-south-face-shade" d="M58 63H128V88H58Z" fill="#000000" opacity="0.08"',
    );
    expect(foregroundUpper).not.toMatch(/upper-west-|upper-south-reveal-light|upper-arris-seam/);
    const derivedSoutheast = derivePromotedSoutheastSourcePair(
      source(PROPOSAL_DIRECTORY, 'filled_sw_elbow-base.svg'),
      foregroundUpper,
    );
    expect(derivedSoutheast.baseSource).not.toContain('base-boundary-seam');
    expect(derivedSoutheast.upperSource).not.toContain('upper-boundary-seam');
  });

  it('assembles one cream top and one uninterrupted foreground fascia without a proxy', () => {
    const pixels = rasterCandidateBlock();
    const cream = [217, 208, 185, 255];
    const shadedCream = [200, 191, 170, 255];
    const coral = [182, 95, 77, 255];
    const green = [41, 75, 60, 255];
    for (const [x, y] of [
      [124, 124], [128, 124], [132, 124],
      [124, 128], [128, 128], [132, 128],
      [124, 180], [128, 180], [132, 180],
    ]) {
      expect(rgbaAt(pixels, 256, x, y)).toEqual(cream);
    }
    for (const x of [80, 124, 128, 132, 176]) {
      expect(rgbaAt(pixels, 256, x, 200)).toEqual(shadedCream);
    }
    for (const x of [80, 124, 128, 132, 176]) {
      expect(rgbaAt(pixels, 256, x, 220)).toEqual(coral);
      expect(rgbaAt(pixels, 256, x, 230)).toEqual(green);
    }

    const farPixels = rasterCandidateBlock(80);
    expect(rgbaAt(farPixels, 80, 40, 40)).toEqual(cream);
    const farCoral = rgbaAt(farPixels, 80, 40, 69);
    const farGreen = rgbaAt(farPixels, 80, 40, 72);
    expect(farCoral[3]).toBeGreaterThan(100);
    expect(farCoral[0]).toBeGreaterThan(farCoral[1]);
    expect(farGreen[3]).toBe(255);
    expect(farGreen[1]).toBeGreaterThan(farGreen[0]);
  });

  it('rejects source-bank drift, demotion claims, and production claims', () => {
    expect(() => validateEqualHeightThickWallBlockGate({
      ...EQUAL_HEIGHT_THICK_WALL_BLOCK_GATE,
      maskRowsUnderReview: [16],
    } as unknown as typeof EQUAL_HEIGHT_THICK_WALL_BLOCK_GATE)).toThrow(/evidence boundary drift/);
    expect(() => validateEqualHeightThickWallBlockGate({
      ...EQUAL_HEIGHT_THICK_WALL_BLOCK_GATE,
      renderingDecision: {
        ...EQUAL_HEIGHT_THICK_WALL_BLOCK_GATE.renderingDecision,
        authoredSourceFiles: ['filled_nw_elbow-base.svg'],
      },
    } as unknown as typeof EQUAL_HEIGHT_THICK_WALL_BLOCK_GATE)).toThrow(/evidence boundary drift/);
    expect(() => validateEqualHeightThickWallBlockGate({
      ...EQUAL_HEIGHT_THICK_WALL_BLOCK_GATE,
      productionRegistration: true,
    } as unknown as typeof EQUAL_HEIGHT_THICK_WALL_BLOCK_GATE)).toThrow(/proof-only production boundary/);
  });

  it('leaves production export and registration signatures byte-identical', () => {
    expect(productionSignature()).toBe(productionBefore);
  });
});
