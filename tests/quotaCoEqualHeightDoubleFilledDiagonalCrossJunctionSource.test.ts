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

import {
  A1B_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY,
  compileA1bDoubleFilledDiagonalCrossJunctionProposalDirectory,
} from '../scripts/highOblique/a1bDoubleFilledDiagonalCrossJunctionProposal';

const SOURCE_PREFIX =
  'assets/walls/quota-co-building-system-proofs/double-filled-diagonal-cross-junction';
const SOURCE_DIRECTORY = path.resolve(process.cwd(), SOURCE_PREFIX);

const source = (filename: string): string =>
  readFileSync(path.join(SOURCE_DIRECTORY, filename), 'utf8');

const stripSvgShell = (svg: string): string =>
  svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

function rasterCandidate(
  cellPixels: number,
  background: '#A8A28F' | '#252A28',
): ReturnType<Resvg['render']> {
  const body =
    stripSvgShell(source('open_cross_filled_ne_sw-base.svg')) +
    stripSvgShell(source('open_cross_filled_ne_sw-upper.svg'));
  return new Resvg(
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ' +
      `viewBox="0 0 128 128"><rect width="128" height="128" fill="${background}"/>` +
      `${body}</svg>`,
    {
      fitTo: { mode: 'width', value: cellPixels },
      font: { loadSystemFonts: false },
    },
  ).render();
}

function rasterTransparentCandidate(): ReturnType<Resvg['render']> {
  const body =
    stripSvgShell(source('open_cross_filled_ne_sw-base.svg')) +
    stripSvgShell(source('open_cross_filled_ne_sw-upper.svg'));
  return new Resvg(
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ' +
      `viewBox="0 0 128 128">${body}</svg>`,
    {
      fitTo: { mode: 'width', value: 128 },
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

function opaqueRgbAt(
  raster: ReturnType<Resvg['render']>,
  x: number,
  y: number,
): readonly [number, number, number] {
  const offset = (y * raster.width + x) * 4;
  expect(raster.pixels[offset + 3]).toBe(255);
  return [
    raster.pixels[offset],
    raster.pixels[offset + 1],
    raster.pixels[offset + 2],
  ];
}

describe('QuotaCo accepted double-filled diagonal cross-junction source', () => {
  it('strictly compiles the exact flattened two-file mask_30 inventory', async () => {
    expect(readdirSync(SOURCE_DIRECTORY).sort()).toEqual([
      'README.md',
      'open_cross_filled_ne_sw-base.svg',
      'open_cross_filled_ne_sw-upper.svg',
    ]);
    expect(
      A1B_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_PROPOSAL_SOURCE_INVENTORY,
    ).toEqual([
      expect.objectContaining({
        id: 'open_cross_filled_ne_sw-base',
        filename: 'open_cross_filled_ne_sw-base.svg',
        sourceMaskIndex: 30,
        boundaryRole: 'double-filled-diagonal-cross-hub',
        layer: 'base',
        semanticGroup: 'detail/base',
      }),
      expect.objectContaining({
        id: 'open_cross_filled_ne_sw-upper',
        filename: 'open_cross_filled_ne_sw-upper.svg',
        sourceMaskIndex: 30,
        boundaryRole: 'double-filled-diagonal-cross-hub',
        layer: 'upper',
        semanticGroup: 'detail/upper',
      }),
    ]);

    const compiled =
      await compileA1bDoubleFilledDiagonalCrossJunctionProposalDirectory({
        inputDir: SOURCE_DIRECTORY,
        sourcePathPrefix: SOURCE_PREFIX,
      });
    expect(compiled.map(({ filename }) => filename)).toEqual([
      'open_cross_filled_ne_sw-base.svg',
      'open_cross_filled_ne_sw-upper.svg',
    ]);
    for (const candidate of compiled) {
      expect(candidate.shapes.length).toBeGreaterThan(0);
      expect(candidate.content).not.toMatch(
        /\b(?:transform|href|xlink:href)\s*=/,
      );
      expect(
        candidate.shapes.every(({ silhouette }) => silhouette === false),
      ).toBe(true);
    }
  });

  it('locks one S-shaped cream owner with only northwest and southeast open', () => {
    const base = source('open_cross_filled_ne_sw-base.svg');
    expect(base).toContain(
      'id="base-structural-mass" d="M56 0H128V97H82A10 10 0 0 0 72 107V128H0V56H46A10 10 0 0 0 56 46Z"',
    );
    expect(base).not.toMatch(/id="base-buried-(?:ne|sw)-underlay"/);

    const upper = source('open_cross_filled_ne_sw-upper.svg');
    expect(upper).toContain(
      'id="upper-contour" d="M56 0H128V97H82A10 10 0 0 0 72 107V128H0V56H46A10 10 0 0 0 56 46Z"',
    );
    expect(upper).toContain(
      'id="upper-shell" d="M58 0H128V95H80A10 10 0 0 0 70 105V128H0V58H48A10 10 0 0 0 58 48Z"',
    );
    expect(
      [...upper.matchAll(
        /<path\b(?=[^>]*\bid=["']([^"']+)["'])(?=[^>]*\bfill=["']#D9D0B9["'])[^>]*>/gi,
      )].map((match) => match[1]),
    ).toEqual(['upper-shell']);
    expect(upper).not.toMatch(
      /id="[^"]*(?:cap|post|peak|pylon|rollover|overlay|patch|stacked|center-seam)"/i,
    );
  });

  it('hands its south edge to the accepted east-side register without an opaque overhang', () => {
    const raster = rasterTransparentCandidate();
    const alpha = Array.from(
      { length: raster.width },
      (_, x) => raster.pixels[(127 * raster.width + x) * 4 + 3],
    );

    expect(alpha.slice(0, 72).every((value) => value === 255)).toBe(true);
    expect(alpha.slice(72).every((value) => value === 0)).toBe(true);
    expect(alpha.findLastIndex((value) => value === 255)).toBe(71);
  });

  it('keeps coral, green, and frontage shade on the southeast return only', () => {
    const base = source('open_cross_filled_ne_sw-base.svg');
    const upper = source('open_cross_filled_ne_sw-upper.svg');

    expect(
      [...base.matchAll(/\bid="([^"]*(?:green|shade)[^"]*)"/g)]
        .map((match) => match[1]),
    ).toEqual([
      'base-green-se-return',
      'base-face-shade-se-return',
      'base-contact-shade-se-return',
    ]);
    expect(
      [...upper.matchAll(/\bid="([^"]*(?:coral|green|face-shade)[^"]*)"/g)]
        .map((match) => match[1]),
    ).toEqual([
      'upper-se-face-shade',
      'upper-coral-se-return',
      'upper-green-se-return',
      'upper-south-face-shade',
    ]);
    expect(`${base}\n${upper}`).not.toMatch(
      /id="[^"]*(?:coral|green|face-shade)[^"]*-(?:ne|sw)(?:-|")/,
    );
  });

  it('retains the cream, coral, and green read at 240, 90, and 40 pixels', () => {
    for (const cellPixels of [240, 90, 40] as const) {
      for (const background of ['#A8A28F', '#252A28'] as const) {
        const raster = rasterCandidate(cellPixels, background);
        expect([raster.width, raster.height]).toEqual([
          cellPixels,
          cellPixels,
        ]);
        expect(
          hasOpaqueRgb(raster, [217, 208, 185]),
          `cream at ${cellPixels}px on ${background}`,
        ).toBe(true);
        expect(
          hasOpaqueRgb(raster, [182, 95, 77], cellPixels === 40 ? 3 : 0),
          `coral at ${cellPixels}px on ${background}`,
        ).toBe(true);
        expect(
          hasOpaqueRgb(
            raster,
            [41, 75, 60],
            cellPixels === 40 ? 4 : 0,
          ),
          `green at ${cellPixels}px on ${background}`,
        ).toBe(true);
      }
    }

    const raster = rasterCandidate(128, '#A8A28F');
    expect(opaqueRgbAt(raster, 25, 25)).toEqual([168, 162, 143]);
    expect(opaqueRgbAt(raster, 85, 25)).toEqual([217, 208, 185]);
    expect(opaqueRgbAt(raster, 25, 105)).toEqual([191, 183, 163]);
    expect(opaqueRgbAt(raster, 80, 80)).toEqual([200, 191, 170]);
    expect(opaqueRgbAt(raster, 124, 105)).toEqual([41, 75, 60]);
  });

  it('rejects transforms, path drift, duplicate cream owners, and extra files', async () => {
    const temporaryDirectory = mkdtempSync(
      path.join(tmpdir(), 'quota-co-double-filled-diagonal-cross-'),
    );
    const base = source('open_cross_filled_ne_sw-base.svg');
    const upper = source('open_cross_filled_ne_sw-upper.svg');
    const writeInventory = (
      baseSource: string,
      upperSource: string,
    ): void => {
      writeFileSync(
        path.join(temporaryDirectory, 'README.md'),
        'temporary test bank\n',
      );
      writeFileSync(
        path.join(temporaryDirectory, 'open_cross_filled_ne_sw-base.svg'),
        baseSource,
      );
      writeFileSync(
        path.join(temporaryDirectory, 'open_cross_filled_ne_sw-upper.svg'),
        upperSource,
      );
    };
    const compileTemporary = () =>
      compileA1bDoubleFilledDiagonalCrossJunctionProposalDirectory({
        inputDir: temporaryDirectory,
        sourcePathPrefix:
          'assets/walls/quota-co-building-system-proofs/double-filled-diagonal-cross-junction-test',
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
          '</g>',
          '<path id="upper-cream-bridge" d="M0 0H128V20H0Z" fill="#D9D0B9"/></g>',
        ),
      );
      await expect(compileTemporary()).rejects.toThrow(
        /unexpected semantic ids upper-cream-bridge/,
      );

      writeInventory(
        base,
        upper.replace('M58 0H128V95H80', 'M59 0H128V95H80'),
      );
      await expect(compileTemporary()).rejects.toThrow(
        /exact double-filled diagonal geometry for upper-shell/,
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
});
