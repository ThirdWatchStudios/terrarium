import { readFileSync } from 'node:fs';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import {
  A1B_THICK_WALL_HORIZONTAL_REPEAT_PROPOSAL_SOURCE_INVENTORY,
  compileA1bThickWallHorizontalRepeatProposalDirectory,
} from '../scripts/highOblique/a1bThickWallHorizontalRepeatProposal';
import {
  EQUAL_HEIGHT_THICK_WALL_HORIZONTAL_REPEAT_GATE,
  validateEqualHeightThickWallHorizontalRepeatGate,
} from '../scripts/highOblique/equalHeightThickWallHorizontalRepeatGate';
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
const PROPOSAL_PREFIX = 'assets/walls/quota-co-building-system-proofs/thick-wall-horizontal-repeat';
const PROPOSAL_DIRECTORY = path.resolve(process.cwd(), PROPOSAL_PREFIX);
const THICK_BLOCK_DIRECTORY = path.resolve(
  process.cwd(),
  'assets/walls/quota-co-building-system-proofs/thick-wall-block',
);
const CANONICAL_DIRECTORY = path.resolve(
  process.cwd(),
  'assets/walls/quota-co-building-system',
);

const source = (directory: string, filename: string): string =>
  readFileSync(path.join(directory, filename), 'utf8');

const stripSvgShell = (svg: string): string =>
  svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

function rasterCandidateBlock(columns: 2 | 3 | 4 | 6, cellPixels = 128): {
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint8Array;
} {
  const rearBase = source(THICK_BLOCK_DIRECTORY, 'filled_nw_elbow-base.svg');
  const rearUpper = source(THICK_BLOCK_DIRECTORY, 'filled_nw_elbow-upper.svg');
  const foregroundBase = source(THICK_BLOCK_DIRECTORY, 'filled_sw_elbow-base.svg');
  const foregroundUpper = source(THICK_BLOCK_DIRECTORY, 'filled_sw_elbow-upper.svg');
  const northBase = source(PROPOSAL_DIRECTORY, 'filled_n_middle-base.svg');
  const northUpper = source(PROPOSAL_DIRECTORY, 'filled_n_middle-upper.svg');
  const southBase = source(PROPOSAL_DIRECTORY, 'filled_s_middle-base.svg');
  const southUpper = source(PROPOSAL_DIRECTORY, 'filled_s_middle-upper.svg');
  const southeast = derivePromotedSoutheastSourcePair(foregroundBase, foregroundUpper);
  const cell = (content: string, col: number, row: number, mirrorX = false): string => (
    `<svg x="${col * 128}" y="${row * 128}" width="128" height="128" viewBox="0 0 128 128">` +
    (mirrorX
      ? `<g transform="matrix(-1 0 0 1 128 0)">${stripSvgShell(content)}</g>`
      : stripSvgShell(content)) +
    '</svg>'
  );
  const last = columns - 1;
  const basePass = [cell(rearBase, 0, 0), cell(foregroundBase, 0, 1)];
  const upperPass = [cell(rearUpper, 0, 0), cell(foregroundUpper, 0, 1)];
  for (let col = 1; col < last; col += 1) {
    basePass.push(cell(northBase, col, 0), cell(southBase, col, 1));
    upperPass.push(cell(northUpper, col, 0), cell(southUpper, col, 1));
  }
  basePass.push(cell(rearBase, last, 0, true), cell(southeast.baseSource, last, 1, true));
  upperPass.push(cell(rearUpper, last, 0, true), cell(southeast.upperSource, last, 1, true));
  const outputWidth = columns * cellPixels;
  const outputHeight = 2 * cellPixels;
  const rendered = new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${columns * 128}" height="256" ` +
    `viewBox="0 0 ${columns * 128} 256">${basePass.join('')}${upperPass.join('')}</svg>`,
    {
      fitTo: { mode: 'width', value: outputWidth },
      font: { loadSystemFonts: false },
    },
  ).render();
  return { width: outputWidth, height: outputHeight, pixels: rendered.pixels };
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

describe('QuotaCo owner-accepted proof-layer N×2 thick-wall horizontal repeat family', () => {
  it('accepts masks 31 and 38 in the exact 3×2 matrix', () => {
    expect(EQUAL_HEIGHT_THICK_WALL_HORIZONTAL_REPEAT_GATE).toMatchObject({
      status: 'owner-accepted-thick-wall-horizontal-repeat-gate',
      topologyClass: 'filled-horizontal-spine-family',
      dimensions: { minimumColumns: 2, rows: 2 },
      referenceMatrix: [[20, 31, 26], [16, 38, 34]],
      baselineMaskRows: [16, 20, 26, 34],
      maskRowsUnderReview: [],
      maskRowsAccepted: [31, 38],
      reviewCellSizes: [240, 90, 40],
      reviewBlockWidths: [2, 3, 4, 6],
      productionRegistration: false,
      productionTopologyMutation: false,
      schemaChange: false,
      exportable: false,
      committedAtlas: false,
    });
    expect(EQUAL_HEIGHT_THICK_WALL_HORIZONTAL_REPEAT_GATE.candidates).toEqual([
      expect.objectContaining({
        row: 'rear', maskIndex: 31, sourceMaskIndex: 31,
        sourceStem: 'filled_n_middle', transform: 'none',
        resolution: 'direct-reuse',
      }),
      expect.objectContaining({
        row: 'foreground', maskIndex: 38, sourceMaskIndex: 38,
        sourceStem: 'filled_s_middle', transform: 'none',
        resolution: 'direct-reuse',
      }),
    ]);
    expect(() => validateEqualHeightThickWallHorizontalRepeatGate()).not.toThrow();
  });

  it('matches two accepted pocket-free horizontal T topologies without a mirror claim', () => {
    expect(configForIndex(31)).toEqual({
      n: false, e: true, s: true, w: true,
      ne: 'exposed', se: 'solid', sw: 'solid', nw: 'exposed',
    });
    expect(configForIndex(38)).toEqual({
      n: true, e: true, s: false, w: true,
      ne: 'solid', se: 'exposed', sw: 'exposed', nw: 'solid',
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[31]).toMatchObject({
      topologyClass: 't-junction',
      pockets: [],
      resolution: {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [{
          role: 'filled-north-middle-spine',
          sourceStem: 'filled_n_middle',
          baseFile: 'filled_n_middle-base.svg',
          upperFile: 'filled_n_middle-upper.svg',
          transform: 'none',
          derivation: 'none',
        }],
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[38]).toMatchObject({
      topologyClass: 't-junction',
      pockets: [],
      resolution: {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [{
          role: 'filled-south-middle-spine',
          sourceStem: 'filled_s_middle',
          baseFile: 'filled_s_middle-base.svg',
          upperFile: 'filled_s_middle-upper.svg',
          transform: 'none',
          derivation: 'none',
        }],
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
      'direct-reuse': 21,
      'approved-derivation': 14,
      'synthetic-assembly': 12,
      'unresolved-authored-geometry': 0,
    });
  });

  it('compiles two fixed-light source pairs outside the production bank', async () => {
    expect(A1B_THICK_WALL_HORIZONTAL_REPEAT_PROPOSAL_SOURCE_INVENTORY).toEqual([
      expect.objectContaining({
        id: 'filled_n_middle-base', sourceMaskIndex: 31,
        boundaryRole: 'rear-middle', layer: 'base',
      }),
      expect.objectContaining({
        id: 'filled_n_middle-upper', sourceMaskIndex: 31,
        boundaryRole: 'rear-middle', layer: 'upper',
      }),
      expect.objectContaining({
        id: 'filled_s_middle-base', sourceMaskIndex: 38,
        boundaryRole: 'foreground-middle', layer: 'base',
      }),
      expect.objectContaining({
        id: 'filled_s_middle-upper', sourceMaskIndex: 38,
        boundaryRole: 'foreground-middle', layer: 'upper',
      }),
    ]);
    const compiled = await compileA1bThickWallHorizontalRepeatProposalDirectory({
      inputDir: PROPOSAL_DIRECTORY,
      sourcePathPrefix: PROPOSAL_PREFIX,
    });
    expect(compiled.map(({ sourceFile }) => sourceFile)).toEqual(
      A1B_THICK_WALL_HORIZONTAL_REPEAT_PROPOSAL_SOURCE_INVENTORY.map(
        ({ filename }) => `${PROPOSAL_PREFIX}/${filename}`,
      ),
    );
    expect(compiled.every(({ shapes }) => shapes.length > 0)).toBe(true);
    expect(A1B_AUTHORED_STEMS).not.toContain('filled_n_middle');
    expect(A1B_AUTHORED_STEMS).not.toContain('filled_s_middle');
  });

  it('preserves fixed-light layer ownership and the accepted foreground base', () => {
    const rear = source(PROPOSAL_DIRECTORY, 'filled_n_middle-upper.svg');
    const foreground = source(PROPOSAL_DIRECTORY, 'filled_s_middle-upper.svg');
    expect(source(PROPOSAL_DIRECTORY, 'filled_s_middle-base.svg')).toBe(
      source(CANONICAL_DIRECTORY, 'full_n_straight-base.svg'),
    );
    expect(rear).toContain('id="upper-contour" d="M0 56H128V128H0Z"');
    expect(rear).toContain('id="upper-solid-top-fill" d="M0 58H128V128H0Z"');
    expect(rear).not.toMatch(/coral|green|shade|plinth|seam|cap|rollover/i);
    expect(foreground).toContain(
      'id="upper-south-face-shade" d="M0 63H128V88H0Z" fill="#000000" opacity="0.08"',
    );
    expect(foreground).toContain('id="upper-south-coral-wrap" d="M0 88H128V94H0Z"');
    expect(foreground).toContain('id="upper-south-green-wrap" d="M0 94H128V117H0Z"');
    expect(foreground).toContain('id="upper-boundary-seam" d="M126 88V96 M126 98V116"');
    expect(foreground).not.toMatch(/\bid=["'][^"']*(?:arris|cap|rollover)/i);
  });

  it('extends the 3×2 mass without a center crack or buried horizontal belt', () => {
    const { pixels, width } = rasterCandidateBlock(3);
    const cream = [217, 208, 185, 255];
    const shadedCream = [200, 191, 170, 255];
    const coral = [182, 95, 77, 255];
    const green = [41, 75, 60, 255];
    for (const x of [127, 128, 129, 255, 256, 257]) {
      expect(rgbaAt(pixels, width, x, 100)).toEqual(cream);
      expect(rgbaAt(pixels, width, x, 127)).toEqual(cream);
      expect(rgbaAt(pixels, width, x, 128)).toEqual(cream);
      expect(rgbaAt(pixels, width, x, 180)).toEqual(cream);
      expect(rgbaAt(pixels, width, x, 203)).toEqual(shadedCream);
      expect(rgbaAt(pixels, width, x, 218)).toEqual(coral);
      expect(rgbaAt(pixels, width, x, 232)).toEqual(green);
    }
  });

  it('survives consecutive middle columns and the literal 40-pixel-per-cell long check', () => {
    const four = rasterCandidateBlock(4);
    const cream = [217, 208, 185, 255];
    for (const x of [127, 128, 129, 255, 256, 257, 383, 384, 385]) {
      expect(rgbaAt(four.pixels, four.width, x, 100)).toEqual(cream);
      expect(rgbaAt(four.pixels, four.width, x, 128)).toEqual(cream);
    }
    const sixFar = rasterCandidateBlock(6, 40);
    expect(sixFar.width).toBe(240);
    expect(sixFar.height).toBe(80);
    for (const x of [60, 80, 100, 120, 140, 160, 180]) {
      const pixel = rgbaAt(sixFar.pixels, sixFar.width, x, 39);
      expect(pixel[3]).toBe(255);
      expect(Math.abs(pixel[0] - cream[0])).toBeLessThanOrEqual(2);
      expect(Math.abs(pixel[1] - cream[1])).toBeLessThanOrEqual(2);
      expect(Math.abs(pixel[2] - cream[2])).toBeLessThanOrEqual(2);
    }
  });

  it('rejects demotion and production claims', () => {
    expect(() => validateEqualHeightThickWallHorizontalRepeatGate({
      ...EQUAL_HEIGHT_THICK_WALL_HORIZONTAL_REPEAT_GATE,
      maskRowsUnderReview: [31],
      maskRowsAccepted: [38],
    } as unknown as typeof EQUAL_HEIGHT_THICK_WALL_HORIZONTAL_REPEAT_GATE)).toThrow(/evidence boundary drift/);
    expect(() => validateEqualHeightThickWallHorizontalRepeatGate({
      ...EQUAL_HEIGHT_THICK_WALL_HORIZONTAL_REPEAT_GATE,
      productionRegistration: true,
    } as unknown as typeof EQUAL_HEIGHT_THICK_WALL_HORIZONTAL_REPEAT_GATE)).toThrow(/proof-only production boundary/);
  });

  it('leaves production export and registration signatures byte-identical', () => {
    expect(productionSignature()).toBe(productionBefore);
  });
});
