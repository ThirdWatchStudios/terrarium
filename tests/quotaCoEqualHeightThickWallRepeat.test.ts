import { readFileSync } from 'node:fs';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import {
  A1B_THICK_WALL_REPEAT_PROPOSAL_SOURCE_INVENTORY,
  compileA1bThickWallRepeatProposalDirectory,
} from '../scripts/highOblique/a1bThickWallRepeatProposal';
import {
  EQUAL_HEIGHT_THICK_WALL_REPEAT_GATE,
  validateEqualHeightThickWallRepeatGate,
} from '../scripts/highOblique/equalHeightThickWallRepeatGate';
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
const PROPOSAL_PREFIX = 'assets/walls/quota-co-building-system-proofs/thick-wall-repeat';
const PROPOSAL_DIRECTORY = path.resolve(process.cwd(), PROPOSAL_PREFIX);
const THICK_BLOCK_DIRECTORY = path.resolve(
  process.cwd(),
  'assets/walls/quota-co-building-system-proofs/thick-wall-block',
);

const source = (directory: string, filename: string): string =>
  readFileSync(path.join(directory, filename), 'utf8');

const stripSvgShell = (svg: string): string =>
  svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

function rasterCandidateBlock(rows: 2 | 3 | 4 | 6, outputWidth = 256): {
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint8Array;
} {
  const rearBase = source(THICK_BLOCK_DIRECTORY, 'filled_nw_elbow-base.svg');
  const rearUpper = source(THICK_BLOCK_DIRECTORY, 'filled_nw_elbow-upper.svg');
  const foregroundBase = source(THICK_BLOCK_DIRECTORY, 'filled_sw_elbow-base.svg');
  const foregroundUpper = source(THICK_BLOCK_DIRECTORY, 'filled_sw_elbow-upper.svg');
  const middleBase = source(PROPOSAL_DIRECTORY, 'filled_w_middle-base.svg');
  const middleUpper = source(PROPOSAL_DIRECTORY, 'filled_w_middle-upper.svg');
  const southeast = derivePromotedSoutheastSourcePair(foregroundBase, foregroundUpper);
  const cell = (content: string, col: number, row: number, mirrorX = false): string => (
    `<svg x="${col * 128}" y="${row * 128}" width="128" height="128" viewBox="0 0 128 128">` +
    (mirrorX
      ? `<g transform="matrix(-1 0 0 1 128 0)">${stripSvgShell(content)}</g>`
      : stripSvgShell(content)) +
    '</svg>'
  );
  const basePass = [cell(rearBase, 0, 0), cell(rearBase, 1, 0, true)];
  const upperPass = [cell(rearUpper, 0, 0), cell(rearUpper, 1, 0, true)];
  for (let row = 1; row < rows - 1; row += 1) {
    basePass.push(cell(middleBase, 0, row), cell(middleBase, 1, row, true));
    upperPass.push(cell(middleUpper, 0, row), cell(middleUpper, 1, row, true));
  }
  basePass.push(
    cell(foregroundBase, 0, rows - 1),
    cell(southeast.baseSource, 1, rows - 1, true),
  );
  upperPass.push(
    cell(foregroundUpper, 0, rows - 1),
    cell(southeast.upperSource, 1, rows - 1, true),
  );
  const outputHeight = Math.round(outputWidth * rows / 2);
  const rendered = new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="${rows * 128}" ` +
    `viewBox="0 0 256 ${rows * 128}">${basePass.join('')}${upperPass.join('')}</svg>`,
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

describe('QuotaCo accepted proof-layer 2xN thick-wall repeat family', () => {
  it('accepts masks 24 and 42 in the exact 2x3 matrix', () => {
    expect(EQUAL_HEIGHT_THICK_WALL_REPEAT_GATE).toMatchObject({
      status: 'owner-accepted-thick-wall-repeat-gate',
      topologyClass: 'filled-side-spine-family',
      dimensions: { columns: 2, minimumRows: 2 },
      referenceMatrix: [[20, 26], [24, 42], [16, 34]],
      baselineMaskRows: [16, 20, 26, 34],
      maskRowsUnderReview: [],
      maskRowsAccepted: [24, 42],
      reviewCellSizes: [240, 90, 40],
      reviewBlockHeights: [2, 3, 4, 6],
      productionRegistration: false,
      productionTopologyMutation: false,
      schemaChange: false,
      exportable: false,
      committedAtlas: false,
    });
    expect(EQUAL_HEIGHT_THICK_WALL_REPEAT_GATE.candidates).toEqual([
      expect.objectContaining({
        side: 'west', maskIndex: 24, sourceMaskIndex: 24,
        sourceStem: 'filled_w_middle', transform: 'none',
        resolution: 'direct-reuse',
      }),
      expect.objectContaining({
        side: 'east', maskIndex: 42, sourceMaskIndex: 24,
        sourceStem: 'filled_w_middle', transform: 'mirror-x',
        resolution: 'approved-derivation',
      }),
    ]);
    expect(() => validateEqualHeightThickWallRepeatGate()).not.toThrow();
  });

  it('matches the canonical X-mirrored side-spine topology without pockets', () => {
    expect(configForIndex(24)).toEqual({
      n: true, e: true, s: true, w: false,
      ne: 'solid', se: 'solid', sw: 'exposed', nw: 'exposed',
    });
    expect(configForIndex(42)).toEqual({
      n: true, e: false, s: true, w: true,
      ne: 'exposed', se: 'exposed', sw: 'solid', nw: 'solid',
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[24]).toMatchObject({
      topologyClass: 't-junction',
      pockets: [],
      resolution: {
        kind: 'direct-reuse', status: 'accepted-source-mapping',
        variants: [expect.objectContaining({
          role: 'filled-west-middle-spine', sourceStem: 'filled_w_middle',
          transform: 'none', derivation: 'none',
        })],
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries[42]).toMatchObject({
      topologyClass: 't-junction',
      pockets: [],
      resolution: {
        kind: 'approved-derivation', status: 'accepted-source-mapping',
        variants: [expect.objectContaining({
          role: 'filled-east-middle-spine', sourceStem: 'filled_w_middle',
          transform: 'mirror-x', derivation: 'none',
        })],
      },
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
      'direct-reuse': 23,
      'approved-derivation': 16,
      'synthetic-assembly': 8,
      'unresolved-authored-geometry': 0,
    });
  });

  it('compiles one fixed-light west source pair outside the production bank', async () => {
    expect(A1B_THICK_WALL_REPEAT_PROPOSAL_SOURCE_INVENTORY).toEqual([
      expect.objectContaining({
        id: 'filled_w_middle-base', sourceMaskIndex: 24,
        boundaryRole: 'west-middle', layer: 'base',
      }),
      expect.objectContaining({
        id: 'filled_w_middle-upper', sourceMaskIndex: 24,
        boundaryRole: 'west-middle', layer: 'upper',
      }),
    ]);
    const compiled = await compileA1bThickWallRepeatProposalDirectory({
      inputDir: PROPOSAL_DIRECTORY,
      sourcePathPrefix: PROPOSAL_PREFIX,
    });
    expect(compiled.map(({ sourceFile }) => sourceFile)).toEqual(
      A1B_THICK_WALL_REPEAT_PROPOSAL_SOURCE_INVENTORY.map(
        ({ filename }) => `${PROPOSAL_PREFIX}/${filename}`,
      ),
    );
    expect(compiled.every(({ shapes }) => shapes.length > 0)).toBe(true);
    expect(A1B_AUTHORED_STEMS).not.toContain('filled_w_middle');
  });

  it('authors only the open-Y contour and uninterrupted cream top', () => {
    const base = source(PROPOSAL_DIRECTORY, 'filled_w_middle-base.svg');
    const upper = source(PROPOSAL_DIRECTORY, 'filled_w_middle-upper.svg');
    expect(base).toContain('id="base-buried-underlay" d="M56 0H128V128H56Z"');
    expect(upper).toContain('id="upper-contour" d="M56 0H128V128H56Z"');
    expect(upper).toContain('id="upper-solid-top-fill" d="M58 0H128V128H58Z"');
    expect(upper).not.toMatch(/coral|green|shade|plinth|lip|arris|seam|highlight|rollover|cap/i);
  });

  it('extends the 2x3 mass without a center crack or horizontal belt', () => {
    const { pixels, width } = rasterCandidateBlock(3);
    const cream = [217, 208, 185, 255];
    for (const y of [127, 128, 129, 200, 254, 255, 256, 257]) {
      for (const x of [80, 124, 127, 128, 129, 132, 176]) {
        expect(rgbaAt(pixels, width, x, y)).toEqual(cream);
      }
    }
    const coral = '182,95,77,255';
    const green = '41,75,60,255';
    for (let y = 130; y < 254; y += 1) {
      for (let x = 58; x < 198; x += 1) {
        const pixel = rgbaAt(pixels, width, x, y).join(',');
        expect(pixel).not.toBe(coral);
        expect(pixel).not.toBe(green);
      }
    }
  });

  it('survives consecutive middle rows and the 40-pixel-per-cell long check', () => {
    const four = rasterCandidateBlock(4);
    const cream = [217, 208, 185, 255];
    for (const y of [255, 256, 257, 383, 384, 385]) {
      expect(rgbaAt(four.pixels, four.width, 128, y)).toEqual(cream);
    }
    const sixFar = rasterCandidateBlock(6, 80);
    expect(sixFar.height).toBe(240);
    for (const y of [60, 80, 100, 120, 140, 160, 180]) {
      const pixel = rgbaAt(sixFar.pixels, sixFar.width, 40, y);
      expect(pixel[3]).toBe(255);
      expect(Math.abs(pixel[0] - cream[0])).toBeLessThanOrEqual(2);
      expect(Math.abs(pixel[1] - cream[1])).toBeLessThanOrEqual(2);
      expect(Math.abs(pixel[2] - cream[2])).toBeLessThanOrEqual(2);
    }
  });

  it('rejects demotion and production claims after proof-layer acceptance', () => {
    expect(() => validateEqualHeightThickWallRepeatGate({
      ...EQUAL_HEIGHT_THICK_WALL_REPEAT_GATE,
      maskRowsUnderReview: [24],
    } as unknown as typeof EQUAL_HEIGHT_THICK_WALL_REPEAT_GATE)).toThrow(/evidence boundary drift/);
    expect(() => validateEqualHeightThickWallRepeatGate({
      ...EQUAL_HEIGHT_THICK_WALL_REPEAT_GATE,
      productionRegistration: true,
    } as unknown as typeof EQUAL_HEIGHT_THICK_WALL_REPEAT_GATE)).toThrow(/proof-only production boundary/);
  });

  it('leaves production export and registration signatures byte-identical', () => {
    expect(productionSignature()).toBe(productionBefore);
  });
});
