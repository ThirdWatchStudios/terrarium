import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  loadA1bAuthoredBFamily,
  type A1bAuthoredBFamily,
} from '../scripts/highOblique/a1bAuthored';
import {
  a1bAuthoredShapeMarkup,
  buildA1bAuthoredFrames,
  type A1bAuthoredFrame,
  type A1bAuthoredStem,
} from '../scripts/highOblique/a1bAuthoredProof';
import {
  loadA1bLowCorrectionFamily,
  type A1bLowCorrectionFamily,
  type A1bLowCorrectionFrame,
} from '../scripts/highOblique/a1bLowProfileCorrection';
import {
  A1A_CANVAS,
  A1A_PALETTE,
  type A1aShape,
} from '../scripts/highOblique/a1aProof';

const ROOT_SOURCE_PREFIX = 'assets/walls/quota-co-building-system';
const ROOT_SOURCE_DIRECTORY = path.resolve(process.cwd(), ROOT_SOURCE_PREFIX);
const LOW_SOURCE_PREFIX = `${ROOT_SOURCE_PREFIX}/low-profile-correction`;
const LOW_SOURCE_DIRECTORY = path.resolve(process.cwd(), LOW_SOURCE_PREFIX);

type Edge = 'n' | 'e' | 's' | 'w';
type Axis = 'row' | 'column';
type Material = 'cream' | 'green' | 'teal' | 'coral' | 'charcoal';

interface Raster {
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint8Array;
}

interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface FrameLike {
  readonly id: string;
  readonly shapes: readonly A1aShape[];
}

const MATERIAL_RGB: Readonly<Record<Material, readonly [number, number, number]>> = {
  cream: rgb(A1A_PALETTE.cream),
  green: rgb(A1A_PALETTE.green),
  teal: rgb(A1A_PALETTE.teal),
  coral: rgb(A1A_PALETTE.coral),
  charcoal: rgb(A1A_PALETTE.charcoal),
};

const MATERIAL_PAINT: Readonly<Record<Material, string>> = {
  cream: '$cream',
  green: '$green',
  teal: '$teal',
  coral: A1A_PALETTE.coral,
  charcoal: A1A_PALETTE.charcoal,
};

function rgb(hex: string): readonly [number, number, number] {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function frameSvg(frame: FrameLike): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${A1A_CANVAS}" height="${A1A_CANVAS}" ` +
    `viewBox="0 0 ${A1A_CANVAS} ${A1A_CANVAS}">` +
    frame.shapes.map(a1bAuthoredShapeMarkup).join('') +
    '</svg>'
  );
}

function rasterFrame(frame: FrameLike): Raster {
  const rendered = new Resvg(frameSvg(frame), { font: { loadSystemFonts: false } }).render();
  return { width: rendered.width, height: rendered.height, pixels: rendered.pixels };
}

function pixelIndex(rendered: Raster, x: number, y: number): number {
  return (y * rendered.width + x) * 4;
}

function alphaAt(rendered: Raster, x: number, y: number): number {
  return rendered.pixels[pixelIndex(rendered, x, y) + 3];
}

function maxChannelDeltaInRect(first: Raster, second: Raster, rect: Rect): number {
  expect([first.width, first.height]).toEqual([second.width, second.height]);
  let maxDelta = 0;
  for (let y = rect.y; y < rect.y + rect.height; y += 1) {
    for (let x = rect.x; x < rect.x + rect.width; x += 1) {
      const index = pixelIndex(first, x, y);
      for (let channel = 0; channel < 4; channel += 1) {
        maxDelta = Math.max(
          maxDelta,
          Math.abs(first.pixels[index + channel] - second.pixels[index + channel]),
        );
      }
    }
  }
  return maxDelta;
}

function pixelForEdge(rendered: Raster, edge: Edge, offset: number): number {
  const x = edge === 'w' ? 0 : edge === 'e' ? rendered.width - 1 : offset;
  const y = edge === 'n' ? 0 : edge === 's' ? rendered.height - 1 : offset;
  return pixelIndex(rendered, x, y);
}

function edgeMaxChannelDelta(
  first: Raster,
  firstEdge: Edge,
  second: Raster,
  secondEdge: Edge,
): number {
  let maxDelta = 0;
  for (let offset = 0; offset < A1A_CANVAS; offset += 1) {
    const firstIndex = pixelForEdge(first, firstEdge, offset);
    const secondIndex = pixelForEdge(second, secondEdge, offset);
    for (let channel = 0; channel < 4; channel += 1) {
      maxDelta = Math.max(
        maxDelta,
        Math.abs(first.pixels[firstIndex + channel] - second.pixels[secondIndex + channel]),
      );
    }
  }
  return maxDelta;
}

function edgeAlphaMismatchCount(
  first: Raster,
  firstEdge: Edge,
  second: Raster,
  secondEdge: Edge,
): number {
  let mismatches = 0;
  for (let offset = 0; offset < A1A_CANVAS; offset += 1) {
    const firstAlpha = first.pixels[pixelForEdge(first, firstEdge, offset) + 3] >= 128;
    const secondAlpha = second.pixels[pixelForEdge(second, secondEdge, offset) + 3] >= 128;
    if (firstAlpha !== secondAlpha) mismatches += 1;
  }
  return mismatches;
}

function materialAt(rendered: Raster, x: number, y: number): Material | 'transparent' {
  const index = pixelIndex(rendered, x, y);
  if (rendered.pixels[index + 3] < 128) return 'transparent';
  let nearest: Material = 'charcoal';
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const [material, target] of Object.entries(MATERIAL_RGB) as Array<
    [Material, readonly [number, number, number]]
  >) {
    const red = rendered.pixels[index] - target[0];
    const green = rendered.pixels[index + 1] - target[1];
    const blue = rendered.pixels[index + 2] - target[2];
    const distance = red * red + green * green + blue * blue;
    if (distance < nearestDistance) {
      nearest = material;
      nearestDistance = distance;
    }
  }
  return nearest;
}

function materialForEdge(rendered: Raster, edge: Edge, offset: number): Material | 'transparent' {
  const x = edge === 'w' ? 0 : edge === 'e' ? rendered.width - 1 : offset;
  const y = edge === 'n' ? 0 : edge === 's' ? rendered.height - 1 : offset;
  return materialAt(rendered, x, y);
}

function edgeMaterialMismatchCount(
  first: Raster,
  firstEdge: Edge,
  second: Raster,
  secondEdge: Edge,
): number {
  let mismatches = 0;
  for (let offset = 0; offset < A1A_CANVAS; offset += 1) {
    if (materialForEdge(first, firstEdge, offset) !== materialForEdge(second, secondEdge, offset)) {
      mismatches += 1;
    }
  }
  return mismatches;
}

function nearOpaqueCharcoal(rendered: Raster, x: number, y: number): boolean {
  const index = pixelIndex(rendered, x, y);
  if (rendered.pixels[index + 3] < 250) return false;
  const charcoal = MATERIAL_RGB.charcoal;
  return (
    Math.abs(rendered.pixels[index] - charcoal[0]) <= 4 &&
    Math.abs(rendered.pixels[index + 1] - charcoal[1]) <= 4 &&
    Math.abs(rendered.pixels[index + 2] - charcoal[2]) <= 4
  );
}

function broadCharcoalLines(
  rendered: Raster,
  axis: Axis,
  lineStart: number,
  lineEnd: number,
  spanStart: number,
  spanEnd: number,
  maximumCoverage = 0.7,
): number[] {
  const lines: number[] = [];
  const spanLength = spanEnd - spanStart + 1;
  for (let line = lineStart; line <= lineEnd; line += 1) {
    let charcoalPixels = 0;
    for (let span = spanStart; span <= spanEnd; span += 1) {
      const x = axis === 'row' ? span : line;
      const y = axis === 'row' ? line : span;
      if (nearOpaqueCharcoal(rendered, x, y)) charcoalPixels += 1;
    }
    if (charcoalPixels / spanLength > maximumCoverage) lines.push(line);
  }
  return lines;
}

function transposeMaskMismatchCount(
  first: Raster,
  second: Raster,
  mask: 'alpha' | Material,
): number {
  expect([first.width, first.height]).toEqual([second.height, second.width]);
  let mismatches = 0;
  for (let y = 0; y < first.height; y += 1) {
    for (let x = 0; x < first.width; x += 1) {
      const firstValue = mask === 'alpha'
        ? alphaAt(first, x, y) >= 128
        : materialAt(first, x, y) === mask;
      const secondValue = mask === 'alpha'
        ? alphaAt(second, y, x) >= 128
        : materialAt(second, y, x) === mask;
      if (firstValue !== secondValue) mismatches += 1;
    }
  }
  return mismatches;
}

function materialMaskFrame(frame: FrameLike, material: Material): FrameLike {
  const paint = MATERIAL_PAINT[material];
  const shapes = frame.shapes.flatMap((shape): A1aShape[] => {
    const fillMatches = shape.fill === paint;
    const strokeMatches = shape.stroke === paint;
    if (!fillMatches && !strokeMatches) return [];
    return [{
      d: shape.d,
      layer: shape.layer,
      silhouette: false,
      ...(fillMatches ? { fill: '#FFFFFF' } : {}),
      ...(strokeMatches
        ? { stroke: '#FFFFFF', strokeWidth: shape.strokeWidth ?? 1.5 }
        : {}),
    }];
  });
  return { id: `${frame.id}-${material}-mask`, shapes };
}

function authoredFrame(
  frames: readonly A1bAuthoredFrame[],
  stem: A1bAuthoredStem,
): FrameLike {
  const frame = frames.find((candidate) => candidate.stem === stem && candidate.kind === 'composed');
  if (!frame) throw new Error(`Missing composed authored frame ${stem}`);
  return frame as FrameLike;
}

function lowFrame(family: A1bLowCorrectionFamily, id: 'a1b_low_corrected_s' | 'a1b_low_corrected_e'): FrameLike {
  const frame = family.frames.find((candidate): candidate is A1bLowCorrectionFrame => candidate.id === id);
  if (!frame) throw new Error(`Missing low-profile frame ${id}`);
  return frame;
}

async function loadFamilies(): Promise<{
  readonly authored: A1bAuthoredBFamily;
  readonly low: A1bLowCorrectionFamily;
}> {
  const [authored, low] = await Promise.all([
    loadA1bAuthoredBFamily({
      inputDir: ROOT_SOURCE_DIRECTORY,
      sourcePathPrefix: ROOT_SOURCE_PREFIX,
    }),
    loadA1bLowCorrectionFamily({
      inputDir: LOW_SOURCE_DIRECTORY,
      sourcePathPrefix: LOW_SOURCE_PREFIX,
    }),
  ]);
  return { authored, low };
}

let authored: A1bAuthoredBFamily;
let low: A1bLowCorrectionFamily;
let authoredFrames: readonly A1bAuthoredFrame[];

beforeAll(async () => {
  ({ authored, low } = await loadFamilies());
  authoredFrames = buildA1bAuthoredFrames(authored.components);
});

describe('QuotaCo unified wall-envelope visual contract', () => {
  it('hides the base top-light rather than exposing a shelf beneath the full shell', () => {
    const cases: ReadonlyArray<{
      readonly stem: A1bAuthoredStem;
      readonly corridor: Rect;
    }> = [
      { stem: 'full_n_straight', corridor: { x: 8, y: 98, width: 112, height: 8 } },
      { stem: 'full_w_straight', corridor: { x: 98, y: 8, width: 8, height: 112 } },
      { stem: 'transition_n_to_e', corridor: { x: 8, y: 98, width: 74, height: 8 } },
      { stem: 'transition_w_to_s', corridor: { x: 98, y: 8, width: 8, height: 74 } },
    ];

    for (const { stem, corridor } of cases) {
      const frame = authoredFrame(authoredFrames, stem);
      const withoutBaseTopLight: FrameLike = {
        id: `${frame.id}-without-base-white-overlay`,
        shapes: frame.shapes.filter(
          (shape) => !(shape.layer === 'base' && shape.fill?.toUpperCase() === '#FFFFFF'),
        ),
      };
      expect(
        maxChannelDeltaInRect(rasterFrame(frame), rasterFrame(withoutBaseTopLight), corridor),
        `${stem} exposes a base-owned white top-plane cue inside the full-wall envelope`,
      ).toBeLessThanOrEqual(1);
    }
  });

  it('has no broad charcoal contour at the former base and upper join', () => {
    const cases: ReadonlyArray<{
      readonly stem: A1bAuthoredStem;
      readonly axis: Axis;
      readonly lineStart: number;
      readonly lineEnd: number;
      readonly spanStart: number;
      readonly spanEnd: number;
    }> = [
      { stem: 'full_n_straight', axis: 'row', lineStart: 65, lineEnd: 116, spanStart: 8, spanEnd: 119 },
      { stem: 'full_w_straight', axis: 'column', lineStart: 65, lineEnd: 116, spanStart: 8, spanEnd: 119 },
      { stem: 'transition_n_to_e', axis: 'row', lineStart: 65, lineEnd: 116, spanStart: 8, spanEnd: 81 },
      { stem: 'transition_w_to_s', axis: 'column', lineStart: 65, lineEnd: 116, spanStart: 8, spanEnd: 81 },
    ];

    for (const { stem, axis, lineStart, lineEnd, spanStart, spanEnd } of cases) {
      expect(
        broadCharcoalLines(
          rasterFrame(authoredFrame(authoredFrames, stem)),
          axis,
          lineStart,
          lineEnd,
          spanStart,
          spanEnd,
        ),
        `${stem} contains a second silhouette across the wall interior`,
      ).toEqual([]);
    }
  });

  it('keeps full-wall ingress pixels continuous into both profile transitions', () => {
    const fullNorth = rasterFrame(authoredFrame(authoredFrames, 'full_n_straight'));
    const northToEast = rasterFrame(authoredFrame(authoredFrames, 'transition_n_to_e'));
    const fullWest = rasterFrame(authoredFrame(authoredFrames, 'full_w_straight'));
    const westToSouth = rasterFrame(authoredFrame(authoredFrames, 'transition_w_to_s'));

    expect(
      edgeMaxChannelDelta(fullNorth, 'e', northToEast, 'w'),
      'full north east edge -> north-to-east west edge',
    ).toBeLessThanOrEqual(1);
    expect(
      edgeMaxChannelDelta(fullWest, 's', westToSouth, 'n'),
      'full west south edge -> west-to-south north edge',
    ).toBeLessThanOrEqual(1);
  });

  it('hands each transition to the real low wall with matching occupancy and material registers', () => {
    const northToEast = rasterFrame(authoredFrame(authoredFrames, 'transition_n_to_e'));
    const lowEast = rasterFrame(lowFrame(low, 'a1b_low_corrected_e'));
    const westToSouth = rasterFrame(authoredFrame(authoredFrames, 'transition_w_to_s'));
    const lowSouth = rasterFrame(lowFrame(low, 'a1b_low_corrected_s'));

    expect(
      edgeAlphaMismatchCount(northToEast, 's', lowEast, 'n'),
      'north-to-east south edge -> low-east north edge occupancy',
    ).toBe(0);
    expect(
      edgeMaterialMismatchCount(northToEast, 's', lowEast, 'n'),
      'north-to-east south edge -> low-east north edge material ownership',
    ).toBe(0);
    expect(
      edgeAlphaMismatchCount(westToSouth, 'e', lowSouth, 'w'),
      'west-to-south east edge -> low-south west edge occupancy',
    ).toBe(0);
    expect(
      edgeMaterialMismatchCount(westToSouth, 'e', lowSouth, 'w'),
      'west-to-south east edge -> low-south west edge material ownership',
    ).toBe(0);
  });

  it('keeps paired facings transpose-identical in silhouette and material masks', () => {
    const pairs: ReadonlyArray<readonly [string, FrameLike, FrameLike]> = [
      [
        'full straight',
        authoredFrame(authoredFrames, 'full_n_straight'),
        authoredFrame(authoredFrames, 'full_w_straight'),
      ],
      [
        'profile transition',
        authoredFrame(authoredFrames, 'transition_n_to_e'),
        authoredFrame(authoredFrames, 'transition_w_to_s'),
      ],
      [
        'low straight',
        lowFrame(low, 'a1b_low_corrected_s'),
        lowFrame(low, 'a1b_low_corrected_e'),
      ],
    ];
    const masks = ['alpha', 'cream', 'green', 'teal', 'coral', 'charcoal'] as const;

    for (const [label, firstFrame, secondFrame] of pairs) {
      const first = rasterFrame(firstFrame);
      const second = rasterFrame(secondFrame);
      for (const mask of masks) {
        const firstMask = mask === 'alpha'
          ? first
          : rasterFrame(materialMaskFrame(firstFrame, mask));
        const secondMask = mask === 'alpha'
          ? second
          : rasterFrame(materialMaskFrame(secondFrame, mask));
        expect(
          transposeMaskMismatchCount(firstMask, secondMask, 'alpha'),
          `${label} ${mask} mask`,
          // Resvg may choose the adjacent coverage pixel at one or two arc cusps;
          // a larger disagreement is authored geometry drift, not antialiasing.
        ).toBeLessThanOrEqual(2);
      }
    }
  });

  it('recompiles the focused envelope evidence to byte-identical rasters', async () => {
    const repeated = await loadFamilies();
    const repeatedAuthoredFrames = buildA1bAuthoredFrames(repeated.authored.components);

    for (const stem of [
      'full_n_straight',
      'full_w_straight',
      'transition_n_to_e',
      'transition_w_to_s',
    ] as const) {
      expect(
        rasterFrame(authoredFrame(repeatedAuthoredFrames, stem)).pixels,
        `${stem} repeated raster`,
      ).toEqual(rasterFrame(authoredFrame(authoredFrames, stem)).pixels);
    }

    for (const id of ['a1b_low_corrected_s', 'a1b_low_corrected_e'] as const) {
      expect(
        rasterFrame(lowFrame(repeated.low, id)).pixels,
        `${id} repeated raster`,
      ).toEqual(rasterFrame(lowFrame(low, id)).pixels);
    }
  });
});
