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
