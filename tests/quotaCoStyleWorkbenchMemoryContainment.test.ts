import {
  closeSync,
  existsSync,
  openSync,
  readFileSync,
  readSync,
} from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE } from '../scripts/highOblique/equalHeightAllMaskConsistencyGate';
import { renderStyleWorkbenchPage } from '../scripts/highOblique/styleWorkbenchPage';

const ROOT = path.resolve(__dirname, '..');
const STYLE_LOOP_PATH = path.join(ROOT, 'scripts', 'styleLoop.ts');
const PACKAGE_PATH = path.join(ROOT, 'package.json');
const GENERATED_OUTPUT = path.join(ROOT, '.style-loop');
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

function source(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function sourceBetween(
  value: string,
  startMarker: string,
  endMarker: string,
): string {
  const start = value.indexOf(startMarker);
  const end = value.indexOf(endMarker, start + startMarker.length);
  expect(start, `missing source marker: ${startMarker}`).toBeGreaterThanOrEqual(
    0,
  );
  expect(end, `missing source marker: ${endMarker}`).toBeGreaterThan(start);
  return value.slice(start, end);
}

/**
 * Read only the fixed PNG signature and IHDR fields. Never inflate IDAT data:
 * this regression gate must remain safe even when the artifact is enormous.
 */
function pngDimensionsFromHeader(file: string): {
  readonly width: number;
  readonly height: number;
} {
  const descriptor = openSync(file, 'r');
  const header = Buffer.alloc(24);
  try {
    expect(readSync(descriptor, header, 0, header.length, 0)).toBe(
      header.length,
    );
  } finally {
    closeSync(descriptor);
  }
  expect(header.subarray(0, 8).equals(PNG_SIGNATURE)).toBe(true);
  expect(header.toString('ascii', 12, 16)).toBe('IHDR');
  return {
    width: header.readUInt32BE(16),
    height: header.readUInt32BE(20),
  };
}

function imageSources(html: string): readonly string[] {
  return (html.match(/<img\b[^>]*>/g) ?? []).flatMap((tag) => {
    const match = tag.match(/\ssrc="([^"]+)"/);
    return match ? [match[1]] : [];
  });
}

describe('QuotaCo style workbench memory containment', () => {
  it('caps both all-47 rasters and enforces those caps before encoding', () => {
    expect(EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE).toMatchObject({
      stem: 'equal-height-47-mask-consistency-review',
      previewStem: 'equal-height-47-mask-consistency-review-preview',
      fullRasterWidth: 4480,
      previewRasterWidth: 960,
      fullRasterPixelBudget: 45_000_000,
      previewRasterPixelBudget: 2_100_000,
    });

    const styleLoop = readFileSync(STYLE_LOOP_PATH, 'utf8');
    const renderer = sourceBetween(
      styleLoop,
      'async function renderEqualHeightMaskConsistencyReview(',
      'function equalHeightMaskSourceLabel(',
    );
    expect(renderer).toContain('assertRasterPixelBudget(');
    expect(renderer).toContain(
      'EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.fullRasterPixelBudget',
    );
    expect(renderer).toContain(
      'EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.previewRasterPixelBudget',
    );
    expect(renderer).toContain(
      'EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.fullRasterWidth',
    );
    expect(renderer).toContain(
      'EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.previewRasterWidth',
    );
    expect(renderer.indexOf('assertRasterPixelBudget(')).toBeLessThan(
      renderer.indexOf('new Resvg('),
    );
  });

  it('checks existing full and preview artifacts through IHDR only', () => {
    const contracts = [
      {
        stem: EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.stem,
        width: EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.fullRasterWidth,
        budget:
          EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.fullRasterPixelBudget,
      },
      {
        stem: EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.previewStem,
        width: EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.previewRasterWidth,
        budget:
          EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.previewRasterPixelBudget,
      },
    ] as const;

    for (const contract of contracts) {
      const file = path.join(GENERATED_OUTPUT, `${contract.stem}.png`);
      if (!existsSync(file)) continue;
      const dimensions = pngDimensionsFromHeader(file);
      expect(dimensions.width, contract.stem).toBe(contract.width);
      expect(
        dimensions.width * dimensions.height,
        `${contract.stem} decoded pixels`,
      ).toBeLessThanOrEqual(contract.budget);
    }
  });

  it('keeps the generated page within one preview-sized eager decode budget', () => {
    const html = renderStyleWorkbenchPage(['door_closed']);
    const eagerSources = imageSources(html);
    const previewName =
      `${EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.previewStem}.png`;
    const fullName = `${EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.stem}.png`;

    expect(eagerSources).toEqual([previewName]);
    expect(eagerSources).not.toContain(fullName);
    expect(html).toContain(`href="${fullName}"`);
    expect(html).toContain('download');
    expect(html).toContain('data-loadable="true"');

    let decodedPixels = 0;
    for (const url of eagerSources) {
      const filename = path.basename(url.split('?')[0]);
      const file = path.join(GENERATED_OUTPUT, filename);
      if (!existsSync(file)) continue;
      const { width, height } = pngDimensionsFromHeader(file);
      decodedPixels += width * height;
    }
    expect(decodedPixels).toBeLessThanOrEqual(
      EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.previewRasterPixelBudget,
    );
  });

  it('keeps all-47 rendering out of ordinary watch and once paths', () => {
    const styleLoop = readFileSync(STYLE_LOOP_PATH, 'utf8');
    const ordinaryRender = sourceBetween(
      styleLoop,
      'async function render(\n',
      'async function southeastReviewFileOverrides(',
    );
    const contextRender = sourceBetween(
      styleLoop,
      'async function renderContextMocksSafely(',
      'async function renderSafely(',
    );
    expect(ordinaryRender).not.toContain(
      'renderEqualHeightMaskConsistencyReview(',
    );
    expect(contextRender).not.toContain(
      'renderEqualHeightMaskConsistencyReview(',
    );

    const packageJson = JSON.parse(
      readFileSync(PACKAGE_PATH, 'utf8'),
    ) as { scripts: Record<string, string> };
    expect(packageJson.scripts['style:watch']).not.toContain('--consistency');
    expect(packageJson.scripts['style:once']).not.toContain('--consistency');
    expect(packageJson.scripts['style:consistency']).toBe(
      'tsx scripts/styleLoop.ts --consistency',
    );
    expect(packageJson.scripts['style:serve']).toBe(
      'tsx scripts/styleLoop.ts --serve-only',
    );
  });

  it('routes repository-wide Vitest runs through the memory-contained runner', () => {
    const packageJson = JSON.parse(
      readFileSync(PACKAGE_PATH, 'utf8'),
    ) as { scripts: Record<string, string> };
    expect(packageJson.scripts.test).toBe(
      'tsx scripts/runTestsSafely.ts',
    );
    expect(packageJson.scripts['test:update']).toBe(
      'tsx scripts/runTestsSafely.ts --update',
    );
  });

  it('reserves the port before rendering and applies bounded cache policies', () => {
    const styleLoop = source('scripts/styleLoop.ts');
    expect(styleLoop).toContain("'public, max-age=0, must-revalidate'");
    expect(styleLoop).toContain("'no-store'");
    expect(styleLoop).toContain("'cache-control': cacheControl");

    const main = styleLoop.slice(styleLoop.indexOf('async function main()'));
    const reserve = main.indexOf('await reserveWorkbenchServer(');
    const render = main.indexOf('await renderSafely(', reserve);
    expect(reserve).toBeGreaterThanOrEqual(0);
    expect(render).toBeGreaterThan(reserve);
  });
});
