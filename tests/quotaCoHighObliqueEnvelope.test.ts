import { readFileSync } from 'node:fs';
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
import {
  derivePromotedSoutheastSourcePair,
  PROMOTED_EAST_WALL_REUSE,
  PROMOTED_NORTHEAST_CORNER,
  PROMOTED_SOUTHEAST_CORNER,
  PROMOTED_SOUTHWEST_CORNER,
  PROMOTED_SOUTH_WALL_REUSE,
} from '../scripts/highOblique/equalHeightWallDirection';
import { EQUAL_HEIGHT_CORRIDOR_GATE } from '../scripts/highOblique/equalHeightCorridorGate';

const ROOT_SOURCE_PREFIX = 'assets/walls/quota-co-building-system';
const ROOT_SOURCE_DIRECTORY = path.resolve(process.cwd(), ROOT_SOURCE_PREFIX);
const LOW_SOURCE_PREFIX = `${ROOT_SOURCE_PREFIX}/low-profile-correction`;
const LOW_SOURCE_DIRECTORY = path.resolve(process.cwd(), LOW_SOURCE_PREFIX);
const PROOFS_SOURCE_DIRECTORY = path.resolve(
  process.cwd(),
  'assets/walls/quota-co-building-system-proofs',
);

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

const stripSvgShell = (source: string): string =>
  source.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

function rasterSourcePair(
  baseFile: string,
  upperFile: string,
  options: { readonly mirrorX?: boolean; readonly southeastDerivation?: boolean } = {},
): Raster {
  const baseSource = readFileSync(path.join(ROOT_SOURCE_DIRECTORY, baseFile), 'utf8');
  const upperSource = readFileSync(path.join(ROOT_SOURCE_DIRECTORY, upperFile), 'utf8');
  const sources = options.southeastDerivation
    ? derivePromotedSoutheastSourcePair(baseSource, upperSource)
    : { baseSource, upperSource };
  const content = stripSvgShell(sources.baseSource) + stripSvgShell(sources.upperSource);
  const transformed = options.mirrorX
    ? `<g transform="matrix(-1 0 0 1 128 0)">${content}</g>`
    : content;
  const rendered = new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ` +
    `viewBox="0 0 128 128">${transformed}</svg>`,
    { font: { loadSystemFonts: false } },
  ).render();
  return { width: rendered.width, height: rendered.height, pixels: rendered.pixels };
}

function rasterDifferenceCoordinates(first: Raster, second: Raster): Array<readonly [number, number]> {
  expect([first.width, first.height]).toEqual([second.width, second.height]);
  const differences: Array<readonly [number, number]> = [];
  for (let y = 0; y < first.height; y += 1) {
    for (let x = 0; x < first.width; x += 1) {
      const index = pixelIndex(first, x, y);
      if ([0, 1, 2, 3].some((channel) => first.pixels[index + channel] !== second.pixels[index + channel])) {
        differences.push([x, y]);
      }
    }
  }
  return differences;
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

function isLitCream(rendered: Raster, x: number, y: number): boolean {
  const index = pixelIndex(rendered, x, y);
  if (rendered.pixels[index + 3] < 128) return false;
  if (materialAt(rendered, x, y) !== 'cream') return false;
  const cream = MATERIAL_RGB.cream;
  return (
    rendered.pixels[index] >= cream[0] + 5 &&
    rendered.pixels[index + 1] >= cream[1] + 5 &&
    rendered.pixels[index + 2] >= cream[2] + 5
  );
}

// Walk inward from the outer silhouette edge: past transparency, past the
// charcoal outline, then measure the contiguous white-lit cream run — the
// visible top plane (or reveal) depth of the treatment.
function litCreamRunDepth(rendered: Raster, edge: 'n' | 'e' | 'w', offset: number): number {
  const at = (position: number): readonly [number, number] =>
    edge === 'n'
      ? [offset, position]
      : edge === 'e'
        ? [A1A_CANVAS - 1 - position, offset]
        : [position, offset];
  let position = 0;
  while (position < A1A_CANVAS && alphaAt(rendered, ...at(position)) < 128) position += 1;
  while (position < A1A_CANVAS && materialAt(rendered, ...at(position)) === 'charcoal') position += 1;
  let depth = 0;
  while (position < A1A_CANVAS && isLitCream(rendered, ...at(position))) {
    depth += 1;
    position += 1;
  }
  return depth;
}

function authoredFrame(
  frames: readonly A1bAuthoredFrame[],
  stem: A1bAuthoredStem,
): FrameLike {
  const frame = frames.find((candidate) => candidate.stem === stem && candidate.kind === 'composed');
  if (!frame) throw new Error(`Missing composed authored frame ${stem}`);
  return frame as FrameLike;
}

function lowFrame(
  family: A1bLowCorrectionFamily,
  id: 'a1b_low_corrected_s' | 'a1b_low_corrected_e' | 'a1b_low_corrected_se_corner',
): FrameLike {
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

  it('keeps the legacy north/east turn joined to the real low-east wall', () => {
    const northToEast = rasterFrame(authoredFrame(authoredFrames, 'transition_n_to_e'));
    const lowEast = rasterFrame(lowFrame(low, 'a1b_low_corrected_e'));

    expect(
      edgeAlphaMismatchCount(northToEast, 's', lowEast, 'n'),
      'north-to-east south edge -> low-east north edge occupancy',
    ).toBe(0);
    expect(
      edgeMaterialMismatchCount(northToEast, 's', lowEast, 'n'),
      'north-to-east south edge -> low-east north edge material ownership',
    ).toBe(0);
  });

  it('joins the promoted southwest corner exactly to full west and full south', () => {
    const corner = rasterFrame(authoredFrame(authoredFrames, 'transition_w_to_s'));
    const fullWest = rasterFrame(authoredFrame(authoredFrames, 'full_w_straight'));
    const fullSouth = rasterFrame(authoredFrame(authoredFrames, 'full_n_straight'));

    expect(
      edgeMaxChannelDelta(fullWest, 's', corner, 'n'),
      'full-west south edge -> southwest north edge',
    ).toBeLessThanOrEqual(1);
    expect(
      edgeMaxChannelDelta(corner, 'e', fullSouth, 'w'),
      'southwest east edge -> promoted full-south west edge',
    ).toBeLessThanOrEqual(1);
    expect(edgeAlphaMismatchCount(fullWest, 's', corner, 'n')).toBe(0);
    expect(edgeAlphaMismatchCount(corner, 'e', fullSouth, 'w')).toBe(0);
  });

  it('joins the promoted southeast derivation exactly to full east and full south', () => {
    const corner = rasterSourcePair(
      PROMOTED_SOUTHEAST_CORNER.baseFile,
      PROMOTED_SOUTHEAST_CORNER.upperFile,
      { mirrorX: true, southeastDerivation: true },
    );
    const fullEast = rasterSourcePair(
      'full_w_straight-base.svg',
      'full_w_straight-upper.svg',
      { mirrorX: true },
    );
    const fullSouth = rasterSourcePair(
      'full_n_straight-base.svg',
      'full_n_straight-upper.svg',
    );

    expect(
      edgeMaxChannelDelta(fullEast, 's', corner, 'n'),
      'full-east south edge -> southeast north edge',
    ).toBe(0);
    expect(
      edgeMaxChannelDelta(fullSouth, 'e', corner, 'w'),
      'promoted full-south east edge -> southeast west edge',
    ).toBe(0);
    expect(edgeAlphaMismatchCount(fullEast, 's', corner, 'n')).toBe(0);
    expect(edgeAlphaMismatchCount(fullSouth, 'e', corner, 'w')).toBe(0);
  });

  it('removes only the mirrored southeast service tick owned by the adjoining south cell', () => {
    const unfilteredMirror = rasterSourcePair(
      PROMOTED_SOUTHEAST_CORNER.baseFile,
      PROMOTED_SOUTHEAST_CORNER.upperFile,
      { mirrorX: true },
    );
    const promoted = rasterSourcePair(
      PROMOTED_SOUTHEAST_CORNER.baseFile,
      PROMOTED_SOUTHEAST_CORNER.upperFile,
      { mirrorX: true, southeastDerivation: true },
    );
    const differences = rasterDifferenceCoordinates(unfilteredMirror, promoted);

    expect(differences).toHaveLength(108);
    expect(differences.every(([x, y]) => x >= 1 && x <= 2 && y >= 63 && y <= 116))
      .toBe(true);
  });

  it('keeps the exterior corner sockets continuous with both straight neighbours', () => {
    const corner = rasterFrame(authoredFrame(authoredFrames, 'full_exterior_corner'));
    const fullNorth = rasterFrame(authoredFrame(authoredFrames, 'full_n_straight'));
    const fullWest = rasterFrame(authoredFrame(authoredFrames, 'full_w_straight'));

    expect(
      edgeMaxChannelDelta(corner, 'e', fullNorth, 'w'),
      'corner east edge -> full north west edge',
    ).toBeLessThanOrEqual(1);
    expect(
      edgeMaxChannelDelta(corner, 's', fullWest, 'n'),
      'corner south edge -> full west north edge',
    ).toBeLessThanOrEqual(1);
  });

  it('keeps the low southeast corner sockets continuous with both low-wall neighbours', () => {
    const corner = rasterFrame(lowFrame(low, 'a1b_low_corrected_se_corner'));
    const lowEast = rasterFrame(lowFrame(low, 'a1b_low_corrected_e'));
    const lowSouth = rasterFrame(lowFrame(low, 'a1b_low_corrected_s'));

    expect(
      edgeMaxChannelDelta(lowEast, 's', corner, 'n'),
      'low east south edge -> low southeast north edge',
    ).toBeLessThanOrEqual(1);
    expect(
      edgeMaxChannelDelta(lowSouth, 'e', corner, 'w'),
      'low south east edge -> low southeast west edge',
    ).toBeLessThanOrEqual(1);
  });

  it('keeps the south-facing material stack in front through the southeast heel', () => {
    const corner = rasterFrame(lowFrame(low, 'a1b_low_corrected_se_corner'));
    const lowSouth = rasterFrame(lowFrame(low, 'a1b_low_corrected_s'));

    for (const x of [88, 96, 104, 112]) {
      for (const y of [92, 100, 108]) {
        expect(
          materialAt(corner, x, y),
          `low southeast ownership at (${x}, ${y})`,
        ).toBe(materialAt(lowSouth, 32, y));
      }
    }
  });

  it('keeps the full south-facing material stack in front through the southwest heel', () => {
    const corner = rasterFrame(authoredFrame(authoredFrames, 'transition_w_to_s'));
    const fullSouth = rasterFrame(authoredFrame(authoredFrames, 'full_n_straight'));
    const registers = [90, 100, 108] as const;

    // The curved arris legitimately crosses the cream reveal near x=96; test
    // the uninterrupted reveal on both sides of that local construction seam.
    for (const x of [64, 72, 80, 112]) {
      expect(materialAt(corner, x, 60), `southwest cream wrap at x=${x}`)
        .toBe(materialAt(fullSouth, 32, 60));
    }

    for (const x of [64, 72, 80, 96, 112]) {
      for (const y of registers) {
        expect(
          materialAt(corner, x, y),
          `southwest full-height ownership at (${x}, ${y})`,
        ).toBe(materialAt(fullSouth, 32, y));
      }
    }

    // The foreground span must carry the exact promoted south paint, not a
    // west-side overlay that only happens to classify as the same material.
    for (const x of [72, 80, 96, 112]) {
      for (const y of registers) {
        const cornerIndex = pixelIndex(corner, x, y);
        const fullSouthIndex = pixelIndex(fullSouth, 32, y);
        expect(
          Array.from(corner.pixels.subarray(cornerIndex, cornerIndex + 4)),
          `southwest full-height foreground pixel at (${x}, ${y})`,
        ).toEqual(Array.from(fullSouth.pixels.subarray(fullSouthIndex, fullSouthIndex + 4)));
      }
    }
  });

  it('keeps the full south-facing material stack in front through the southeast heel', () => {
    const corner = rasterSourcePair(
      PROMOTED_SOUTHEAST_CORNER.baseFile,
      PROMOTED_SOUTHEAST_CORNER.upperFile,
      { mirrorX: true, southeastDerivation: true },
    );
    const fullSouth = rasterSourcePair(
      'full_n_straight-base.svg',
      'full_n_straight-upper.svg',
    );
    const registers = [90, 100, 108] as const;

    // The mirrored arris crosses the cream reveal near x=32; sample the
    // uninterrupted face on both sides of that local construction seam.
    for (const x of [16, 24, 48, 56, 64]) {
      expect(materialAt(corner, x, 60), `southeast cream wrap at x=${x}`)
        .toBe(materialAt(fullSouth, 32, 60));
    }

    for (const x of [16, 24, 32, 48, 56, 64]) {
      for (const y of registers) {
        const cornerIndex = pixelIndex(corner, x, y);
        const fullSouthIndex = pixelIndex(fullSouth, 32, y);
        expect(
          Array.from(corner.pixels.subarray(cornerIndex, cornerIndex + 4)),
          `southeast full-height foreground pixel at (${x}, ${y})`,
        ).toEqual(Array.from(fullSouth.pixels.subarray(fullSouthIndex, fullSouthIndex + 4)));
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

    for (const id of [
      'a1b_low_corrected_s',
      'a1b_low_corrected_e',
      'a1b_low_corrected_se_corner',
    ] as const) {
      expect(
        rasterFrame(lowFrame(repeated.low, id)).pixels,
        `${id} repeated raster`,
      ).toEqual(rasterFrame(lowFrame(low, id)).pixels);
    }

    expect(
      rasterSourcePair(
        PROMOTED_SOUTHEAST_CORNER.baseFile,
        PROMOTED_SOUTHEAST_CORNER.upperFile,
        { mirrorX: true, southeastDerivation: true },
      ).pixels,
      'promoted southeast repeated derivation',
    ).toEqual(
      rasterSourcePair(
        PROMOTED_SOUTHEAST_CORNER.baseFile,
        PROMOTED_SOUTHEAST_CORNER.upperFile,
        { mirrorX: true, southeastDerivation: true },
      ).pixels,
    );
  });
});

describe('QuotaCo equal-height narrow-corridor closure gate', () => {
  it('declares the exact 3x8 perimeter around a 1x6 clear aisle', () => {
    expect(EQUAL_HEIGHT_CORRIDOR_GATE).toMatchObject({
      stem: 'equal-height-corridor-gate',
      columns: 3,
      rows: 8,
      clearSpan: { col: 1, row: 1, columns: 1, rows: 6 },
      reviewCellSizes: [90, 40],
      status: 'owner-accepted-system-gate',
      productionRegistration: false,
    });
    expect(EQUAL_HEIGHT_CORRIDOR_GATE.cells).toHaveLength(18);

    const occupied = EQUAL_HEIGHT_CORRIDOR_GATE.cells
      .map(({ col, row }) => `${col},${row}`)
      .sort();
    const expectedPerimeter = [
      ...Array.from({ length: 3 }, (_, col) => `${col},0`),
      ...Array.from({ length: 6 }, (_, index) => `0,${index + 1}`),
      ...Array.from({ length: 6 }, (_, index) => `2,${index + 1}`),
      ...Array.from({ length: 3 }, (_, col) => `${col},7`),
    ].sort();
    expect(occupied).toEqual(expectedPerimeter);

    const clearCells = Array.from({ length: 6 }, (_, index) => `1,${index + 1}`);
    expect(clearCells.every((coordinate) => !occupied.includes(coordinate))).toBe(true);
    expect(
      EQUAL_HEIGHT_CORRIDOR_GATE.cells.reduce<Record<string, number>>((counts, cell) => {
        counts[cell.role] = (counts[cell.role] ?? 0) + 1;
        return counts;
      }, {}),
    ).toEqual({
      'northwest-corner': 1,
      'north-wall': 1,
      'northeast-corner': 1,
      'west-wall': 6,
      'east-wall': 6,
      'southwest-corner': 1,
      'south-wall': 1,
      'southeast-corner': 1,
    });
  });

  it('uses only the accepted source-reuse contracts without a low profile or new identity', () => {
    const byRole = new Map(
      EQUAL_HEIGHT_CORRIDOR_GATE.cells.map((cell) => [cell.role, cell] as const),
    );

    expect(byRole.get('northwest-corner')).toMatchObject({
      baseFile: 'full_exterior_corner-base.svg',
      upperFile: 'full_exterior_corner-upper.svg',
      transform: 'none',
      derivation: 'none',
    });
    expect(byRole.get('north-wall')).toMatchObject({
      baseFile: PROMOTED_SOUTH_WALL_REUSE.baseFile,
      upperFile: PROMOTED_SOUTH_WALL_REUSE.upperFile,
      transform: PROMOTED_SOUTH_WALL_REUSE.transform,
      derivation: 'none',
    });
    expect(byRole.get('northeast-corner')).toMatchObject({
      baseFile: PROMOTED_NORTHEAST_CORNER.baseFile,
      upperFile: PROMOTED_NORTHEAST_CORNER.upperFile,
      transform: PROMOTED_NORTHEAST_CORNER.transform,
      derivation: 'none',
    });
    expect(byRole.get('west-wall')).toMatchObject({
      baseFile: 'full_w_straight-base.svg',
      upperFile: 'full_w_straight-upper.svg',
      transform: 'none',
      derivation: 'none',
    });
    expect(byRole.get('east-wall')).toMatchObject({
      baseFile: PROMOTED_EAST_WALL_REUSE.baseFile,
      upperFile: PROMOTED_EAST_WALL_REUSE.upperFile,
      transform: PROMOTED_EAST_WALL_REUSE.transform,
      derivation: 'none',
    });
    expect(byRole.get('southwest-corner')).toMatchObject({
      baseFile: PROMOTED_SOUTHWEST_CORNER.baseFile,
      upperFile: PROMOTED_SOUTHWEST_CORNER.upperFile,
      transform: PROMOTED_SOUTHWEST_CORNER.transform,
      derivation: 'none',
    });
    expect(byRole.get('south-wall')).toMatchObject({
      baseFile: PROMOTED_SOUTH_WALL_REUSE.baseFile,
      upperFile: PROMOTED_SOUTH_WALL_REUSE.upperFile,
      transform: PROMOTED_SOUTH_WALL_REUSE.transform,
      derivation: 'none',
    });
    expect(byRole.get('southeast-corner')).toMatchObject({
      baseFile: PROMOTED_SOUTHEAST_CORNER.baseFile,
      upperFile: PROMOTED_SOUTHEAST_CORNER.upperFile,
      transform: PROMOTED_SOUTHEAST_CORNER.transform,
      derivation: 'accepted-southeast-seam-filter',
    });

    expect(new Set(EQUAL_HEIGHT_CORRIDOR_GATE.cells.map(({ baseFile }) => baseFile))).toEqual(
      new Set([
        'full_exterior_corner-base.svg',
        'full_n_straight-base.svg',
        'full_w_straight-base.svg',
        'transition_w_to_s-base.svg',
      ]),
    );
    for (const cell of EQUAL_HEIGHT_CORRIDOR_GATE.cells) {
      expect(cell.baseFile).not.toContain('low-profile-correction');
      expect(cell.upperFile).not.toContain('low-profile-correction');
      expect(cell.baseFile).not.toMatch(/full_[se]_straight|transition_e_to_s/);
      expect(cell.upperFile).not.toMatch(/full_[se]_straight|transition_e_to_s/);
    }
  });

  it('keeps repeated side bodies and every accepted turn pixel-continuous', () => {
    const northSouth = rasterSourcePair(
      PROMOTED_SOUTH_WALL_REUSE.baseFile,
      PROMOTED_SOUTH_WALL_REUSE.upperFile,
    );
    const west = rasterSourcePair('full_w_straight-base.svg', 'full_w_straight-upper.svg');
    const east = rasterSourcePair(
      PROMOTED_EAST_WALL_REUSE.baseFile,
      PROMOTED_EAST_WALL_REUSE.upperFile,
      { mirrorX: true },
    );
    const northwest = rasterSourcePair(
      'full_exterior_corner-base.svg',
      'full_exterior_corner-upper.svg',
    );
    const northeast = rasterSourcePair(
      PROMOTED_NORTHEAST_CORNER.baseFile,
      PROMOTED_NORTHEAST_CORNER.upperFile,
      { mirrorX: true },
    );
    const southwest = rasterSourcePair(
      PROMOTED_SOUTHWEST_CORNER.baseFile,
      PROMOTED_SOUTHWEST_CORNER.upperFile,
    );
    const southeast = rasterSourcePair(
      PROMOTED_SOUTHEAST_CORNER.baseFile,
      PROMOTED_SOUTHEAST_CORNER.upperFile,
      { mirrorX: true, southeastDerivation: true },
    );

    const joins: ReadonlyArray<readonly [string, Raster, Edge, Raster, Edge]> = [
      ['northwest -> north', northwest, 'e', northSouth, 'w'],
      ['northwest -> west', northwest, 's', west, 'n'],
      ['north -> northeast', northSouth, 'e', northeast, 'w'],
      ['northeast -> east', northeast, 's', east, 'n'],
      ['west repeat', west, 's', west, 'n'],
      ['east repeat', east, 's', east, 'n'],
      ['west -> southwest', west, 's', southwest, 'n'],
      ['southwest -> south', southwest, 'e', northSouth, 'w'],
      ['east -> southeast', east, 's', southeast, 'n'],
      ['south -> southeast', northSouth, 'e', southeast, 'w'],
    ];

    for (const [label, first, firstEdge, second, secondEdge] of joins) {
      expect(
        edgeAlphaMismatchCount(first, firstEdge, second, secondEdge),
        `${label} occupancy`,
      ).toBe(0);
      expect(
        edgeMaxChannelDelta(first, firstEdge, second, secondEdge),
        `${label} pixels`,
      ).toBeLessThanOrEqual(1);
    }

    expect(edgeMaxChannelDelta(west, 's', west, 'n'), 'west six-cell repeated socket').toBe(0);
    expect(edgeMaxChannelDelta(east, 's', east, 'n'), 'east six-cell repeated socket').toBe(0);
    expect(edgeMaxChannelDelta(east, 's', southeast, 'n'), 'east to derived southeast').toBe(0);
    expect(edgeMaxChannelDelta(northSouth, 'e', southeast, 'w'), 'south to derived southeast').toBe(0);
  });
});

// Owner correction 2026-07-20: profile height and directional plane treatment
// are separate axes. These gates encode the measured reference constants from
// docs/quota-co-recraft-workflow.md and run against the cross-section proofs
// in assets/walls/quota-co-building-system-proofs/; they re-point to the kit
// masters when the blessed treatments are applied to the straights.
describe('QuotaCo directional cross-section law', () => {
  function rasterProof(name: string): Raster {
    const svg = readFileSync(path.join(PROOFS_SOURCE_DIRECTORY, name), 'utf8');
    const rendered = new Resvg(svg, { font: { loadSystemFonts: false } }).render();
    return { width: rendered.width, height: rendered.height, pixels: rendered.pixels };
  }

  let horizontal: Raster;
  let vertical: Raster;

  beforeAll(() => {
    horizontal = rasterProof('proof-horizontal-frontal.svg');
    vertical = rasterProof('proof-vertical-topplane.svg');
  });

  it('keeps the horizontal treatment flat and front-on with only a narrow lit reveal', () => {
    for (const offset of [16, 32, 100]) {
      const depth = litCreamRunDepth(horizontal, 'n', offset);
      expect(depth, `horizontal reveal depth at x=${offset}`).toBeGreaterThanOrEqual(3);
      expect(depth, `horizontal reveal depth at x=${offset}`).toBeLessThanOrEqual(8);
    }
  });

  it('gives the vertical treatment the broad flatter-from-above top plane', () => {
    for (const offset of [16, 32, 100]) {
      expect(
        litCreamRunDepth(vertical, 'w', offset),
        `vertical top-plane depth at y=${offset}`,
      ).toBeGreaterThanOrEqual(28);
    }
  });

  it('separates the two axis treatments by at least the 3x plane ratio', () => {
    expect(
      litCreamRunDepth(vertical, 'w', 32),
      'vertical top plane vs horizontal reveal',
    ).toBeGreaterThanOrEqual(3 * litCreamRunDepth(horizontal, 'n', 32));
  });

  it('holds the directional law on the applied straight masters', () => {
    const fullNorth = rasterFrame(authoredFrame(authoredFrames, 'full_n_straight'));
    const fullWest = rasterFrame(authoredFrame(authoredFrames, 'full_w_straight'));
    const lowSouth = rasterFrame(lowFrame(low, 'a1b_low_corrected_s'));
    const lowEast = rasterFrame(lowFrame(low, 'a1b_low_corrected_e'));

    const northReveal = litCreamRunDepth(fullNorth, 'n', 32);
    const westPlane = litCreamRunDepth(fullWest, 'w', 32);
    expect(northReveal, 'full north reveal depth').toBeGreaterThanOrEqual(3);
    expect(northReveal, 'full north reveal depth').toBeLessThanOrEqual(8);
    expect(westPlane, 'full west top-plane depth').toBeGreaterThanOrEqual(28);
    expect(westPlane, 'axis plane ratio').toBeGreaterThanOrEqual(3 * northReveal);

    const southReveal = litCreamRunDepth(lowSouth, 'n', 32);
    const eastCoping = litCreamRunDepth(lowEast, 'e', 32);
    expect(southReveal, 'low south reveal depth').toBeGreaterThanOrEqual(3);
    expect(southReveal, 'low south reveal depth').toBeLessThanOrEqual(8);
    expect(eastCoping, 'low east coping depth').toBeGreaterThanOrEqual(16);
  });

  it('keeps the east profile reanchored with its face toward the room', () => {
    const lowEast = rasterFrame(lowFrame(low, 'a1b_low_corrected_e'));

    expect(materialAt(lowEast, 86, 32), 'east room-side green face').toBe('green');
    expect(materialAt(lowEast, 93, 32), 'east room-side coral band').toBe('coral');
    expect(materialAt(lowEast, 105, 32), 'east exterior cream plane').toBe('cream');
    expect(isLitCream(lowEast, 105, 32), 'east exterior plane is top-lit').toBe(true);
    expect(alphaAt(lowEast, 79, 32), 'east room-side contact shadow').toBeGreaterThan(0);
    expect(alphaAt(lowEast, 121, 32), 'east exterior must not retain the old contact shadow').toBe(0);
  });

  it('keeps one outside-to-room material hierarchy in the north and west proofs', () => {
    expect(materialAt(horizontal, 32, 74), 'horizontal face field').toBe('cream');
    expect(isLitCream(horizontal, 32, 74), 'horizontal face field is not top-lit').toBe(false);
    expect(materialAt(horizontal, 32, 91), 'horizontal coral band').toBe('coral');
    expect(materialAt(horizontal, 32, 107), 'horizontal green face').toBe('green');
    expect(materialAt(horizontal, 32, 118), 'horizontal plinth').toBe('charcoal');

    expect(materialAt(vertical, 75, 32), 'vertical top plane').toBe('cream');
    expect(isLitCream(vertical, 75, 32), 'vertical top plane is top-lit').toBe(true);
    expect(materialAt(vertical, 94, 32), 'vertical face sliver').toBe('cream');
    expect(materialAt(vertical, 101, 32), 'vertical coral band').toBe('coral');
    expect(materialAt(vertical, 111, 32), 'vertical green face').toBe('green');
    expect(materialAt(vertical, 118, 32), 'vertical plinth').toBe('charcoal');
  });
});
