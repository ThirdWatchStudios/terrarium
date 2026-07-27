/**
 * Review-only hair silhouette vocabulary proof.
 *
 *   npx tsx scripts/characterHairSilhouettePreview.ts [outDir]
 *
 * Six rigid hair candidates are installed on one registered carrier only for
 * the duration of each render. They use the accepted six body candidates, the
 * proposed v4 head hulls, the one-row body-air datum, and the production
 * compositor/pose mirror. Canonical art and exports remain untouched.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';

import { circle, ellipse } from '../src/core/geometry';
import type {
  CharacterRecipe,
  Facing,
  PartVariant,
  ShapeSpec,
} from '../src/core/types';
import { getPart } from '../src/parts/library';
import { POSES, type Pose } from '../src/parts/poses';
import {
  ALL_BODIES,
  HEADS,
  analyzeGap,
  renderCharacter,
  renderPortrait,
  type HeadCandidate,
} from './characterHeadGapPreview';
import type { BodyCandidate } from './characterPawnPlusPreview';

type ReviewFacing = Facing | 'west';

export interface HairCandidate {
  id: string;
  label: string;
  axis: string;
  gapPolicy: 'preserve' | 'may-bridge';
  facingsFor: (fit: HeadHairFit) => Record<Facing, PartVariant>;
}

interface HeadHairFit {
  southHalf: number;
  northHalf: number;
  crownY: number;
  eastBack: number;
  eastFront: number;
}

interface Raster {
  width: number;
  height: number;
  mask: Uint8Array;
}

interface RasterFrame {
  width: number;
  height: number;
  data: Uint8Array;
}

interface PixelBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

interface HairStressFinding {
  hair: string;
  body: string;
  head: string;
  facing: ReviewFacing;
  size: number;
}

const HAIR_CARRIER = 'hair-short';
const NO_OUTFIT = '__hair-silhouette-proof-no-outfit__';
const CURRENT_ANALOGS = [
  'hair-short',
  'hair-side-part',
  'hair-bob',
  'hair-bun',
  'hair-ponytail',
  'hair-coils',
] as const;

const COLORS = {
  page: '#F2EFE7',
  panel: '#FFFEFA',
  panelAlt: '#E7E1D5',
  selected: '#DFEBE4',
  selectedStrong: '#C9DED1',
  warning: '#F0DDD6',
  ink: '#29302E',
  muted: '#69736F',
  grid: '#CCC4B6',
  green: '#345749',
  greenMid: '#739489',
  coral: '#B75E4B',
  cream: '#D9D0B9',
  floor: '#B8B09A',
  floorDark: '#9D9582',
  desk: '#C9B89A',
  deskDark: '#756D61',
} as const;

const PALETTE = {
  skin: '#C88E65',
  hair: '#3B2921',
  outfitPrimary: COLORS.greenMid,
  outfitSecondary: COLORS.cream,
  accent: COLORS.coral,
};

const BODY_LIFTS: Record<string, Record<Facing, number>> = {
  Column: { south: 21, east: 21, north: 21 },
  Block: { south: 18, east: 18, north: 18 },
  Wedge: { south: 19, east: 19, north: 19 },
  Barrel: { south: 20, east: 20, north: 20 },
  Bell: { south: 20, east: 20, north: 20 },
  Pinch: { south: 20, east: 20, north: 20 },
};

function liftsFor(body: BodyCandidate): Record<Facing, number> {
  const lifts = BODY_LIFTS[body.label];
  if (!lifts) throw new Error(`Missing v4 head-gap lifts for ${body.label}`);
  return lifts;
}

const hairShape = (d: string): ShapeSpec => ({ d, fill: '$hair' });
const hairVariant = (...shapes: ShapeSpec[]): PartVariant => ({ z: 50, shapes });

/**
 * Hair fitting follows the head's crown and profile, not its widest jaw.
 * East faces screen-right: eastBack is the rear of the skull and eastFront
 * stops before the face/nose. These remain review-only bake parameters.
 */
const HEAD_HAIR_FITS: Record<string, HeadHairFit> = {
  round: {
    southHalf: 21,
    northHalf: 21,
    crownY: -21,
    eastBack: -21,
    eastFront: 14,
  },
  broad: {
    southHalf: 27,
    northHalf: 27,
    crownY: -20,
    eastBack: -26,
    eastFront: 17,
  },
  long: {
    southHalf: 14,
    northHalf: 14,
    crownY: -22,
    eastBack: -16,
    eastFront: 10,
  },
  block: {
    southHalf: 20,
    northHalf: 20,
    crownY: -21,
    eastBack: -20,
    eastFront: 14,
  },
  point: {
    southHalf: 23,
    northHalf: 23,
    crownY: -21,
    eastBack: -21,
    eastFront: 16,
  },
  lantern: {
    southHalf: 15,
    northHalf: 15,
    crownY: -21,
    eastBack: -22,
    eastFront: 10,
  },
};

function fitForHead(head: HeadCandidate): HeadHairFit {
  const fit = HEAD_HAIR_FITS[head.id];
  if (!fit) throw new Error(`Missing hair fit envelope for head ${head.id}`);
  return fit;
}

function compact(value: number): number {
  return Number(value.toFixed(1));
}

function fittedCap(
  half: number,
  crownY: number,
  hairlineY: number,
  broken = false,
): ShapeSpec {
  const w = compact(half + 1);
  const crown = compact(crownY - 1);
  const base = broken
    ? `L ${compact(w * 0.68)} ${hairlineY} L ${compact(w * 0.38)} ${hairlineY - 4} L ${compact(w * 0.08)} ${hairlineY} L ${compact(-w * 0.25)} ${hairlineY - 4} L ${compact(-w * 0.62)} ${hairlineY}`
    : `L ${compact(w * 0.58)} ${hairlineY} C ${compact(w * 0.25)} ${hairlineY - 5} ${compact(-w * 0.22)} ${hairlineY - 5} ${compact(-w * 0.6)} ${hairlineY}`;
  return hairShape(
    `M ${-w} ${hairlineY - 3} C ${compact(-w * 0.92)} ${compact(crown + 6)} ${compact(-w * 0.48)} ${crown} 0 ${crown} C ${compact(w * 0.5)} ${crown} ${compact(w * 0.92)} ${compact(crown + 6)} ${w} ${hairlineY - 3} ${base} Z`,
  );
}

function profileCap(
  fit: HeadHairFit,
  options: { hairlineY?: number; backDrop?: number; sweep?: number } = {},
): ShapeSpec {
  const hairlineY = options.hairlineY ?? -2;
  const backDrop = options.backDrop ?? 7;
  const sweep = options.sweep ?? 0;
  const back = compact(fit.eastBack - 1);
  const front = compact(fit.eastFront + sweep);
  const crown = compact(fit.crownY - 1);
  return hairShape(
    `M ${back} ${hairlineY} C ${compact(back + 2)} ${compact(crown + 6)} ${compact(back * 0.48)} ${crown} ${compact(-2 + sweep * 0.15)} ${crown} C ${compact(front - 5)} ${crown} ${front} ${compact(crown + 7)} ${front} ${hairlineY - 5} L ${compact(front - 4)} ${hairlineY} L ${compact(front - 10)} ${hairlineY + 3} L ${compact(front - 16)} ${hairlineY} C ${compact(front - 21)} ${hairlineY - 3} ${compact(back + 8)} ${hairlineY - 1} ${compact(back + 5)} ${hairlineY + 3} L ${back} ${backDrop} Z`,
  );
}

/**
 * Six construction families, not personality or gender labels. Height is kept
 * deliberately compact enough to test the current cell; the old tall Bun
 * remains beside Knot as the honest height-debt control.
 */
export const HAIR: HairCandidate[] = [
  {
    id: 'crop',
    label: 'Crop',
    axis: 'tight broken cap',
    gapPolicy: 'preserve',
    facingsFor: (fit) => ({
      south: hairVariant(fittedCap(fit.southHalf, fit.crownY + 2, 0, true)),
      east: hairVariant(profileCap(fit, { hairlineY: -1, backDrop: 6 })),
      north: hairVariant(
        fittedCap(fit.northHalf, fit.crownY + 2, 7, true),
      ),
    }),
  },
  {
    id: 'sweep',
    label: 'Sweep',
    axis: 'one-sided diagonal mass',
    gapPolicy: 'preserve',
    facingsFor: (fit) => {
      const southW = compact(fit.southHalf + 2);
      const northW = compact(fit.northHalf + 2);
      const crown = compact(fit.crownY - 1);
      const back = compact(fit.eastBack - 2);
      return {
        south: hairVariant(
          hairShape(
            `M ${-southW} -3 C ${compact(-southW * 0.85)} ${compact(crown + 5)} ${compact(-southW * 0.35)} ${crown} 3 ${crown} C ${compact(southW * 0.58)} ${crown} ${southW} ${compact(crown + 7)} ${southW} -4 L ${compact(southW * 0.66)} 3 C ${compact(southW * 0.24)} -5 ${compact(-southW * 0.2)} -7 ${compact(-southW * 0.62)} 1 L ${compact(-southW * 0.88)} 9 Z`,
          ),
          hairShape(ellipse(compact(southW - 3), 5, 5, 10)),
        ),
        east: hairVariant(
          profileCap(fit, { hairlineY: -3, backDrop: 10, sweep: 2 }),
          hairShape(
            `M ${back} -3 C ${compact(back - 8)} 1 ${compact(back - 8)} 12 ${compact(back - 1)} 17 C ${compact(back + 6)} 14 ${compact(back + 7)} 6 ${compact(back + 4)} 0 Z`,
          ),
        ),
        north: hairVariant(
          hairShape(
            `M ${-northW} -3 C ${compact(-northW * 0.85)} ${compact(crown + 5)} ${compact(-northW * 0.32)} ${crown} 4 ${crown} C ${compact(northW * 0.62)} ${crown} ${northW} ${compact(crown + 7)} ${northW} -3 L ${compact(northW * 0.9)} 11 H ${compact(-northW * 0.72)} L ${-northW} 6 Z`,
          ),
        ),
      };
    },
  },
  {
    id: 'bob',
    label: 'Bob',
    axis: 'smooth jaw-level width',
    gapPolicy: 'may-bridge',
    facingsFor: (fit) => {
      const southW = compact(fit.southHalf + 3);
      const northW = compact(fit.northHalf + 3);
      const opening = compact(Math.max(8, fit.southHalf * 0.58));
      const crown = compact(fit.crownY - 2);
      const back = compact(fit.eastBack - 3);
      const front = compact(fit.eastFront + 1);
      return {
        south: hairVariant(hairShape(
          `M ${-southW} -4 C ${compact(-southW * 0.9)} ${compact(crown + 6)} ${compact(-southW * 0.45)} ${crown} 0 ${crown} C ${compact(southW * 0.48)} ${crown} ${compact(southW * 0.92)} ${compact(crown + 6)} ${southW} -4 L ${compact(southW - 1)} 17 L ${compact(opening + 3)} 23 L ${opening} -1 C ${compact(opening * 0.62)} -8 ${compact(-opening * 0.62)} -8 ${-opening} -1 L ${compact(-opening - 3)} 23 L ${compact(-southW + 1)} 17 Z`,
        )),
        east: hairVariant(
          hairShape(
            `M ${back} 18 L ${back} -3 C ${compact(back + 2)} ${compact(crown + 7)} ${compact(back * 0.45)} ${crown} -2 ${crown} C ${compact(front - 5)} ${crown} ${front} ${compact(crown + 8)} ${front} -5 L ${compact(front - 4)} 0 C ${compact(front - 11)} -5 ${compact(front - 19)} -5 ${compact(back + 8)} 1 L ${compact(back + 8)} 18 Z`,
          ),
          hairShape(
            `M ${compact(front - 10)} -1 C ${compact(front - 7)} 5 ${compact(front - 9)} 13 ${compact(front - 12)} 18 L ${compact(front - 16)} 17 L ${compact(front - 14)} 2 Z`,
          ),
        ),
        north: hairVariant(hairShape(
          `M ${-northW} -4 C ${compact(-northW * 0.9)} ${compact(crown + 6)} ${compact(-northW * 0.45)} ${crown} 0 ${crown} C ${compact(northW * 0.48)} ${crown} ${compact(northW * 0.92)} ${compact(crown + 6)} ${northW} -4 L ${compact(northW - 1)} 22 H ${compact(-northW + 1)} Z`,
        )),
      };
    },
  },
  {
    id: 'knot',
    label: 'Knot',
    axis: 'offset compact knot',
    gapPolicy: 'preserve',
    facingsFor: (fit) => {
      const knotY = compact(fit.crownY + 4);
      const southKnotX = compact(-fit.southHalf * 0.55);
      const northKnotX = compact(fit.northHalf * 0.55);
      const profileKnotX = compact(fit.eastBack + 1);
      const knotRadiusX = Math.max(6, compact(fit.southHalf * 0.32));
      return {
        south: hairVariant(
          fittedCap(fit.southHalf, fit.crownY, 1),
          hairShape(ellipse(southKnotX, knotY, knotRadiusX, 5.2)),
        ),
        east: hairVariant(
          profileCap(fit, { hairlineY: -1, backDrop: 7 }),
          hairShape(ellipse(profileKnotX, knotY, Math.max(6, knotRadiusX * 0.85), 5.2)),
        ),
        north: hairVariant(
          fittedCap(fit.northHalf, fit.crownY, 9),
          hairShape(ellipse(northKnotX, knotY, knotRadiusX, 5.2)),
        ),
      };
    },
  },
  {
    id: 'tail',
    label: 'Tail',
    axis: 'rear directional drop',
    gapPolicy: 'may-bridge',
    facingsFor: (fit) => {
      const southW = compact(fit.southHalf + 1);
      const northW = compact(fit.northHalf + 1);
      const back = compact(fit.eastBack - 1);
      return {
        south: hairVariant(
          fittedCap(fit.southHalf, fit.crownY, 1),
          hairShape(circle(compact(southW - 1), -2, 5)),
          hairShape(
            `M ${compact(southW - 1)} -7 C ${compact(southW + 10)} -10 ${compact(southW + 15)} -1 ${compact(southW + 9)} 6 C ${compact(southW + 14)} 13 ${compact(southW + 9)} 23 ${southW} 27 C ${compact(southW - 6)} 21 ${compact(southW - 5)} 13 ${southW} 6 C ${compact(southW - 5)} 2 ${compact(southW - 5)} -3 ${compact(southW - 1)} -7 Z`,
          ),
        ),
        east: hairVariant(
          profileCap(fit, { hairlineY: -2, backDrop: 9 }),
          hairShape(circle(back, -3, 5)),
          hairShape(
            `M ${back} -8 C ${compact(back - 13)} -12 ${compact(back - 18)} -2 ${compact(back - 11)} 5 C ${compact(back - 18)} 13 ${compact(back - 12)} 25 ${compact(back - 2)} 29 C ${compact(back + 5)} 23 ${compact(back + 4)} 14 ${compact(back - 2)} 7 C ${compact(back + 4)} 2 ${compact(back + 4)} -4 ${back} -8 Z`,
          ),
        ),
        north: hairVariant(
          fittedCap(fit.northHalf, fit.crownY, 9),
          hairShape(circle(compact(northW - 2), -3, 5)),
          hairShape(
            `M ${compact(northW - 2)} -8 C ${compact(northW + 10)} -12 ${compact(northW + 14)} -2 ${compact(northW + 8)} 5 C ${compact(northW + 13)} 13 ${compact(northW + 8)} 24 ${compact(northW - 1)} 28 C ${compact(northW - 7)} 22 ${compact(northW - 5)} 14 ${northW} 7 C ${compact(northW - 5)} 2 ${compact(northW - 5)} -4 ${compact(northW - 2)} -8 Z`,
          ),
        ),
      };
    },
  },
  {
    id: 'cloud',
    label: 'Cloud',
    axis: 'broad scalloped halo',
    gapPolicy: 'preserve',
    facingsFor: (fit) => {
      const southW = fit.southHalf + 4;
      const northW = fit.northHalf + 4;
      const crown = fit.crownY + 3;
      const back = fit.eastBack;
      const front = fit.eastFront;
      const radius = Math.max(6, Math.min(9, compact(fit.southHalf * 0.36)));
      return {
        south: hairVariant(
          hairShape(circle(compact(-southW), 0, radius)),
          hairShape(circle(compact(-southW * 0.72), compact(crown + 9), radius + 1)),
          hairShape(circle(compact(-southW * 0.3), compact(crown + 5), radius)),
          hairShape(circle(compact(southW * 0.18), compact(crown + 5), radius)),
          hairShape(circle(compact(southW * 0.64), compact(crown + 9), radius + 1)),
          hairShape(circle(compact(southW), 0, radius)),
          hairShape(circle(compact(-southW), 8, Math.max(6, radius - 1))),
          hairShape(circle(compact(southW), 8, Math.max(6, radius - 1))),
        ),
        east: hairVariant(
          hairShape(circle(compact(back), 0, radius)),
          hairShape(circle(compact(back + 5), compact(crown + 9), radius + 1)),
          hairShape(circle(compact(back + 15), compact(crown + 4), radius)),
          hairShape(circle(compact(back + 26), compact(crown + 5), radius)),
          hairShape(circle(compact(front - 2), compact(crown + 10), Math.max(6, radius - 1))),
          hairShape(circle(compact(back - 1), 10, Math.max(6, radius - 1))),
        ),
        north: hairVariant(
          hairShape(circle(compact(-northW), 0, radius)),
          hairShape(circle(compact(-northW * 0.72), compact(crown + 9), radius + 1)),
          hairShape(circle(compact(-northW * 0.3), compact(crown + 5), radius)),
          hairShape(circle(compact(northW * 0.18), compact(crown + 5), radius)),
          hairShape(circle(compact(northW * 0.64), compact(crown + 9), radius + 1)),
          hairShape(circle(compact(northW), 0, radius)),
          hairShape(circle(compact(-northW), 9, Math.max(6, radius - 1))),
          hairShape(circle(compact(northW), 9, Math.max(6, radius - 1))),
        ),
      };
    },
  },
];

const hairCarrier = getPart(HAIR_CARRIER)!;
if (!hairCarrier) throw new Error(`Missing proof hair carrier ${HAIR_CARRIER}`);

function withCandidateHair<T>(
  candidate: HairCandidate,
  head: HeadCandidate,
  run: () => T,
): T {
  const priorFacings = hairCarrier.facings;
  try {
    hairCarrier.facings = candidate.facingsFor(fitForHead(head));
    return run();
  } finally {
    hairCarrier.facings = priorFacings;
  }
}

export function renderCandidate(
  body: BodyCandidate,
  head: HeadCandidate,
  hair: HairCandidate,
  facing: ReviewFacing,
  size: number,
  options: {
    black?: boolean;
    pose?: Pose;
    outfit?: string;
    accessories?: string[];
  } = {},
): string {
  return withCandidateHair(hair, head, () => renderCharacter(
    body,
    liftsFor(body),
    head,
    facing,
    size,
    {
      hair: HAIR_CARRIER,
      black: options.black,
      pose: options.pose,
      outfit: options.outfit,
      accessories: options.accessories,
    },
  ));
}

function portraitCandidate(
  body: BodyCandidate,
  head: HeadCandidate,
  hair: HairCandidate,
  size: number,
): string {
  return withCandidateHair(hair, head, () => renderPortrait(
    body,
    liftsFor(body),
    head,
    size,
    { hair: HAIR_CARRIER },
  ));
}

function renderCurrent(
  body: BodyCandidate,
  head: HeadCandidate,
  hairId: string,
  facing: ReviewFacing,
  size: number,
  black = false,
): string {
  return renderCharacter(body, liftsFor(body), head, facing, size, { hair: hairId, black });
}

function portraitCurrent(
  body: BodyCandidate,
  head: HeadCandidate,
  hairId: string,
  size: number,
): string {
  return renderPortrait(body, liftsFor(body), head, size, { hair: hairId });
}

function raster(svg: string): Raster {
  const png = PNG.sync.read(new Resvg(svg).render().asPng());
  const mask = new Uint8Array(png.width * png.height);
  for (let index = 0; index < mask.length; index++) {
    mask[index] = png.data[index * 4 + 3] >= 128 ? 1 : 0;
  }
  return { width: png.width, height: png.height, mask };
}

function rasterFrame(svg: string): RasterFrame {
  const png = PNG.sync.read(new Resvg(svg).render().asPng());
  return {
    width: png.width,
    height: png.height,
    data: png.data,
  };
}

function rgb(value: string): [number, number, number] {
  const normalized = value.replace('#', '');
  if (normalized.length !== 6) throw new Error(`Expected six-digit color: ${value}`);
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function colorRaster(
  frame: RasterFrame,
  target: [number, number, number],
  tolerance = 3,
): Raster {
  const mask = new Uint8Array(frame.width * frame.height);
  for (let index = 0; index < mask.length; index++) {
    const offset = index * 4;
    mask[index] = (
      frame.data[offset + 3] >= 128
      && Math.abs(frame.data[offset] - target[0]) <= tolerance
      && Math.abs(frame.data[offset + 1] - target[1]) <= tolerance
      && Math.abs(frame.data[offset + 2] - target[2]) <= tolerance
    ) ? 1 : 0;
  }
  return { width: frame.width, height: frame.height, mask };
}

function pixelBounds(rasterValue: Raster): PixelBounds | null {
  let minX = rasterValue.width;
  let minY = rasterValue.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < rasterValue.height; y++) {
    for (let x = 0; x < rasterValue.width; x++) {
      if (!rasterValue.mask[y * rasterValue.width + x]) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) return null;
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

function countPixelsFromX(rasterValue: Raster, minX: number): number {
  let count = 0;
  for (let y = 0; y < rasterValue.height; y++) {
    for (let x = Math.max(0, minX); x < rasterValue.width; x++) {
      count += rasterValue.mask[y * rasterValue.width + x];
    }
  }
  return count;
}

function externalHairMask(hairSvg: string, bareSvg: string): Uint8Array {
  const hair = raster(hairSvg);
  const bare = raster(bareSvg);
  if (hair.width !== bare.width || hair.height !== bare.height) {
    throw new Error('Hair contribution masks use mismatched raster sizes');
  }
  const mask = new Uint8Array(hair.mask.length);
  const upperLimit = Math.floor(hair.height * 0.72);
  for (let y = 0; y < upperLimit; y++) {
    for (let x = 0; x < hair.width; x++) {
      const index = y * hair.width + x;
      mask[index] = hair.mask[index] && !bare.mask[index] ? 1 : 0;
    }
  }
  return mask;
}

function iou(left: Uint8Array, right: Uint8Array): number {
  let intersection = 0;
  let union = 0;
  for (let index = 0; index < left.length; index++) {
    if (left[index] || right[index]) union++;
    if (left[index] && right[index]) intersection++;
  }
  return union === 0 ? 1 : intersection / union;
}

function countPixels(mask: Uint8Array): number {
  let count = 0;
  for (const value of mask) count += value;
  return count;
}

function pairwiseMetrics(
  entries: Array<{ id: string; svg: string; bare: string }>,
): Array<{ pair: [string, string]; iou: number; externalPixels: [number, number] }> {
  const masks = entries.map((entry) => {
    const mask = externalHairMask(entry.svg, entry.bare);
    return { id: entry.id, mask, pixels: countPixels(mask) };
  });
  const rows: Array<{ pair: [string, string]; iou: number; externalPixels: [number, number] }> = [];
  for (let left = 0; left < masks.length; left++) {
    for (let right = left + 1; right < masks.length; right++) {
      rows.push({
        pair: [masks[left].id, masks[right].id],
        iou: Number(iou(masks[left].mask, masks[right].mask).toFixed(3)),
        externalPixels: [masks[left].pixels, masks[right].pixels],
      });
    }
  }
  return rows.sort((a, b) => b.iou - a.iou);
}

function hairMetrics() {
  const block = ALL_BODIES.find((body) => body.label === 'Block')!;
  const round = HEADS.find((head) => head.id === 'round')!;
  return Object.fromEntries((['south', 'east'] as const).map((facing) => {
    const bare = renderCurrent(block, round, 'hair-none', facing, 40, true);
    const current = pairwiseMetrics(CURRENT_ANALOGS.map((id) => ({
      id,
      bare,
      svg: renderCurrent(block, round, id, facing, 40, true),
    })));
    const proposed = pairwiseMetrics(HAIR.map((hair) => ({
      id: hair.id,
      bare,
      svg: renderCandidate(block, round, hair, facing, 40, { black: true }),
    })));
    return [facing, { current, proposed }];
  }));
}

function profileFitMetrics() {
  const block = ALL_BODIES.find((body) => body.label === 'Block')!;
  const hairRgb = rgb(PALETTE.hair);
  const skinRgb = rgb(PALETTE.skin);
  const bareFrames = new Map<string, { south: RasterFrame; east: RasterFrame }>();
  const rows: Array<{
    hair: string;
    head: string;
    size: number;
    southEastHairIou: number;
    eastSkinRetention: number;
    crownTopDelta: number;
    southHairBounds: PixelBounds;
    eastHairBounds: PixelBounds;
  }> = [];

  for (const head of HEADS) {
    for (const size of [40, 48] as const) {
      const key = `${head.id}:${size}`;
      bareFrames.set(key, {
        south: rasterFrame(renderCurrent(block, head, 'hair-none', 'south', size)),
        east: rasterFrame(renderCurrent(block, head, 'hair-none', 'east', size)),
      });
      const bare = bareFrames.get(key)!;
      const bareSouthSkin = colorRaster(bare.south, skinRgb);
      const bareEastSkin = colorRaster(bare.east, skinRgb);
      const bareSouthSkinBounds = pixelBounds(bareSouthSkin);
      const bareEastSkinBounds = pixelBounds(bareEastSkin);
      if (!bareSouthSkinBounds || !bareEastSkinBounds) {
        throw new Error(`Missing bare skin pixels for ${head.label} at ${size}`);
      }
      const faceStartX = Math.floor(
        bareEastSkinBounds.minX + bareEastSkinBounds.width * 0.55,
      );

      for (const hair of HAIR) {
        const southFrame = rasterFrame(renderCandidate(block, head, hair, 'south', size));
        const eastFrame = rasterFrame(renderCandidate(block, head, hair, 'east', size));
        const southHair = colorRaster(southFrame, hairRgb);
        const eastHair = colorRaster(eastFrame, hairRgb);
        const southHairBounds = pixelBounds(southHair);
        const eastHairBounds = pixelBounds(eastHair);
        if (!southHairBounds || !eastHairBounds) {
          throw new Error(`Missing fitted hair pixels for ${hair.label}/${head.label} at ${size}`);
        }
        const eastSkin = colorRaster(eastFrame, skinRgb);
        const bareEastFacePixels = countPixelsFromX(bareEastSkin, faceStartX);
        rows.push({
          hair: hair.label,
          head: head.label,
          size,
          southEastHairIou: Number(iou(southHair.mask, eastHair.mask).toFixed(3)),
          eastSkinRetention: Number((
            bareEastFacePixels === 0
              ? 0
              : countPixelsFromX(eastSkin, faceStartX) / bareEastFacePixels
          ).toFixed(3)),
          crownTopDelta: southHairBounds.minY - bareSouthSkinBounds.minY,
          southHairBounds,
          eastHairBounds,
        });
      }
    }
  }

  const profileFindings = rows.filter((row) => (
    row.southEastHairIou > 0.82
    || row.eastSkinRetention < 0.32
    || row.crownTopDelta > 2
  ));
  const adaptation = HAIR.map((hair) => {
    const broad = rows.find((row) => row.hair === hair.label && row.head === 'Broad' && row.size === 48)!;
    const long = rows.find((row) => row.hair === hair.label && row.head === 'Long' && row.size === 48)!;
    const southWidthDelta = broad.southHairBounds.width - long.southHairBounds.width;
    const eastWidthDelta = broad.eastHairBounds.width - long.eastHairBounds.width;
    return {
      hair: hair.label,
      broadSouthWidth: broad.southHairBounds.width,
      longSouthWidth: long.southHairBounds.width,
      southWidthDelta,
      broadEastWidth: broad.eastHairBounds.width,
      longEastWidth: long.eastHairBounds.width,
      eastWidthDelta,
      adaptsToHead: southWidthDelta >= 3 && eastWidthDelta >= 2,
    };
  });

  return {
    note:
      'Profile findings flag south/east hair IoU above 0.82, forward-profile skin retention below 0.32, or a crown starting more than two raster rows below the bare head top. Adaptation requires Broad hair to render wider than Long hair.',
    rows,
    profileFindings,
    adaptation,
    adaptationFindings: adaptation.filter((row) => !row.adaptsToHead),
  };
}

function stressAudit() {
  const bodyFindings: HairStressFinding[] = [];
  const headFindings: HairStressFinding[] = [];
  const gapFindings: HairStressFinding[] = [];
  let bodyRenders = 0;
  let headRenders = 0;

  const round = HEADS.find((head) => head.id === 'round')!;
  const block = ALL_BODIES.find((body) => body.label === 'Block')!;
  for (const hair of HAIR) {
    for (const body of ALL_BODIES) {
      for (const facing of ['south', 'east', 'north', 'west'] as const) {
        for (const size of [40, 48] as const) {
          const svg = renderCandidate(body, round, hair, facing, size, { black: true });
          const stats = analyzeGap(svg);
          bodyRenders++;
          if (stats.edgeContact) bodyFindings.push({ hair: hair.label, body: body.label, head: round.label, facing, size });
          if (hair.gapPolicy === 'preserve' && stats.gapRows < 1) {
            gapFindings.push({ hair: hair.label, body: body.label, head: round.label, facing, size });
          }
        }
      }
    }
    for (const head of HEADS) {
      for (const facing of ['south', 'east', 'north', 'west'] as const) {
        for (const size of [40, 48] as const) {
          const svg = renderCandidate(block, head, hair, facing, size, { black: true });
          const stats = analyzeGap(svg);
          headRenders++;
          if (stats.edgeContact) headFindings.push({ hair: hair.label, body: block.label, head: head.label, facing, size });
          if (hair.gapPolicy === 'preserve' && stats.gapRows < 1) {
            gapFindings.push({ hair: hair.label, body: block.label, head: head.label, facing, size });
          }
        }
      }
    }
  }

  const poseFindings: Array<{ hair: string; body: string; head: string; pose: Pose; facing: ReviewFacing }> = [];
  const baselinePoseFindings: Array<{ hair: string; body: string; head: string; pose: Pose; facing: ReviewFacing }> = [];
  let poseRenders = 0;
  let tokenFailures = 0;
  for (let index = 0; index < HAIR.length; index++) {
    const hair = HAIR[index];
    const body = ALL_BODIES[index];
    const head = HEADS[index];
    for (const pose of POSES) {
      for (const facing of ['south', 'east', 'north', 'west'] as const) {
        const svg = renderCandidate(body, head, hair, facing, 48, { pose });
        poseRenders++;
        if (svg.includes('$')) tokenFailures++;
        const candidateTouchesEdge = analyzeGap(svg).edgeContact;
        if (candidateTouchesEdge) {
          const bareSvg = renderCharacter(
            body,
            liftsFor(body),
            head,
            facing,
            48,
            { hair: 'hair-none', black: true, pose },
          );
          if (analyzeGap(bareSvg).edgeContact) {
            baselinePoseFindings.push({ hair: hair.label, body: body.label, head: head.label, pose, facing });
          } else {
            poseFindings.push({ hair: hair.label, body: body.label, head: head.label, pose, facing });
          }
        }
      }
    }
  }

  return {
    note:
      'Preserve styles must retain one neutral raster row at 40/48. Bob and Tail may bridge laterally by construction. Cell-edge contact remains a static fitting failure.',
    bodies: { renders: bodyRenders, edgeFindings: bodyFindings },
    heads: { renders: headRenders, edgeFindings: headFindings },
    gapPolicy: { findings: gapFindings },
    poses: {
      renders: poseRenders,
      tokenFailures,
      edgeFindings: poseFindings,
      baselineEdgeFindings: baselinePoseFindings,
      note:
        'Hair remains rigid in the existing head group; no secondary motion is generated. Candidate edge findings exclude contacts already present in the hairless body/head pose.',
    },
  };
}

function esc(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function text(
  x: number,
  y: number,
  value: string,
  size = 12,
  weight = 500,
  fill: string = COLORS.ink,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return `<text x="${x}" y="${y}" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(value)}</text>`;
}

function panel(
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string = COLORS.panel,
  radius = 10,
): string {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" stroke="${COLORS.grid}"/>`;
}

function nestedSvg(svg: string, x: number, y: number, size: number): string {
  return svg
    .replace('<svg ', `<svg x="${x}" y="${y}" `)
    .replace(/width="[^"]+" height="[^"]+"/, `width="${size}" height="${size}"`);
}

function checker(x: number, y: number, size: number, cell = 8): string {
  const parts = [`<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="5" fill="#F7F5EF"/>`];
  for (let row = 0; row < Math.ceil(size / cell); row++) {
    for (let column = 0; column < Math.ceil(size / cell); column++) {
      if ((row + column) % 2 === 0) continue;
      parts.push(`<rect x="${x + column * cell}" y="${y + row * cell}" width="${Math.min(cell, size - column * cell)}" height="${Math.min(cell, size - row * cell)}" fill="#E4E0D7"/>`);
    }
  }
  return parts.join('');
}

function statCard(
  x: number,
  y: number,
  width: number,
  value: string,
  label: string,
  note: string,
  fill: string = COLORS.panel,
): string {
  return [
    panel(x, y, width, 76, fill, 8),
    text(x + 16, y + 29, value, 21, 740, COLORS.green),
    text(x + 16, y + 49, label, 10, 700),
    text(x + 16, y + 65, note, 8, 500, COLORS.muted),
  ].join('');
}

function primarySheet(
  metrics: ReturnType<typeof hairMetrics>,
  audit: ReturnType<typeof stressAudit>,
  profileFit: ReturnType<typeof profileFitMetrics>,
): string {
  const width = 1600;
  const height = 1210;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`,
    text(28, 40, 'Hair silhouette vocabulary · direction proof v5', 22, 760),
    text(28, 63, 'REVIEW ONLY · rigid head-group art · current one-row body air and y−5 cell reframe retained', 10, 700, COLORS.coral),
  ];

  const currentMax = Math.max(metrics.south.current[0]?.iou ?? 0, metrics.east.current[0]?.iou ?? 0);
  const proposedMax = Math.max(metrics.south.proposed[0]?.iou ?? 0, metrics.east.proposed[0]?.iou ?? 0);
  const maxProfileIou = Math.max(...profileFit.rows.map((row) => row.southEastHairIou));
  const edgeCount = audit.bodies.edgeFindings.length + audit.heads.edgeFindings.length;
  parts.push(statCard(28, 82, 285, '6', 'structural hair anchors', 'crop · sweep · bob · knot · tail · cloud', COLORS.selected));
  parts.push(statCard(326, 82, 285, `${currentMax.toFixed(3)} → ${proposedMax.toFixed(3)}`, 'closest external-hair IoU', 'literal 40 px · head/body pixels subtracted'));
  parts.push(statCard(
    624,
    82,
    285,
    maxProfileIou.toFixed(3),
    'worst south/east hair IoU',
    '72 head/style checks · 40/48 px · ≤ 0.82 target',
    maxProfileIou > 0.82 ? COLORS.warning : COLORS.selected,
  ));
  parts.push(statCard(922, 82, 285, '0', 'new animation frames', 'rigid head group · west remains mirrored', COLORS.selected));
  parts.push(statCard(1220, 82, 352, `${edgeCount}`, 'cell-fit findings', 'all bodies + all heads · 40/48 · four facings', edgeCount > 0 ? COLORS.warning : COLORS.panel));

  parts.push(text(28, 184, 'A · same head, same body: current analogs vs. stronger silhouette anchors', 15, 740));
  parts.push(text(28, 203, 'Portrait shows the construction; 40 px black south/east figures decide whether it changes the gameplay silhouette.', 10, 500, COLORS.muted));
  const block = ALL_BODIES.find((body) => body.label === 'Block')!;
  const round = HEADS.find((head) => head.id === 'round')!;
  for (const [groupIndex, group] of [
    { title: 'Current analogs', entries: [...CURRENT_ANALOGS], proposed: false },
    { title: 'Proposed anchors', entries: HAIR, proposed: true },
  ].entries()) {
    const x = 28 + groupIndex * 772;
    parts.push(panel(x, 220, 758, 326, group.proposed ? COLORS.selected : COLORS.panel));
    parts.push(text(x + 16, 247, group.title, 13, 730, group.proposed ? COLORS.green : COLORS.ink));
    parts.push(text(
      x + 16,
      265,
      group.proposed ? 'Outer mass first; strand texture remains a later surface pass.' : 'Several current styles differ internally but share the same outer cap.',
      9,
      500,
      COLORS.muted,
    ));
    group.entries.forEach((entry, index) => {
      const cellX = x + 12 + index * 122;
      const label = typeof entry === 'string'
        ? entry.replace('hair-', '').replace('-', ' ')
        : entry.label;
      const portrait = typeof entry === 'string'
        ? portraitCurrent(block, round, entry, 72)
        : portraitCandidate(block, round, entry, 72);
      const south = typeof entry === 'string'
        ? renderCurrent(block, round, entry, 'south', 40, true)
        : renderCandidate(block, round, entry, 'south', 40, { black: true });
      const east = typeof entry === 'string'
        ? renderCurrent(block, round, entry, 'east', 40, true)
        : renderCandidate(block, round, entry, 'east', 40, { black: true });
      parts.push(checker(cellX + 22, 278, 72, 9));
      parts.push(nestedSvg(portrait, cellX + 22, 278, 72));
      parts.push(text(cellX + 58, 365, label, 9, 700, group.proposed ? COLORS.green : COLORS.ink, 'middle'));
      parts.push(nestedSvg(south, cellX + 16, 378, 40));
      parts.push(nestedSvg(east, cellX + 64, 378, 40));
      parts.push(text(cellX + 36, 430, 'S', 8, 650, COLORS.muted, 'middle'));
      parts.push(text(cellX + 84, 430, 'E', 8, 650, COLORS.muted, 'middle'));
      if (typeof entry !== 'string') {
        parts.push(text(cellX + 58, 454, entry.axis, 8, 560, COLORS.muted, 'middle'));
        parts.push(text(
          cellX + 58,
          470,
          entry.gapPolicy === 'preserve' ? 'keeps air' : 'may bridge',
          8,
          650,
          entry.gapPolicy === 'preserve' ? COLORS.green : COLORS.coral,
          'middle',
        ));
      }
      const large = typeof entry === 'string'
        ? renderCurrent(block, round, entry, 'south', 56)
        : renderCandidate(block, round, entry, 'south', 56);
      parts.push(nestedSvg(large, cellX + 30, 478, 56));
    });
  }

  parts.push(text(28, 585, 'B · multiplicative check: one Sweep across all six head hulls', 15, 740));
  parts.push(text(28, 604, 'The hair supplies directional asymmetry; the lower face should continue to identify Round, Broad, Long, Block, Point, and Lantern.', 10, 500, COLORS.muted));
  const sweep = HAIR.find((hair) => hair.id === 'sweep')!;
  HEADS.forEach((head, index) => {
    const x = 28 + index * 257;
    parts.push(panel(x, 622, 245, 198, index % 2 === 0 ? COLORS.panel : COLORS.panelAlt));
    parts.push(text(x + 14, 648, `${head.label} + Sweep`, 10, 730));
    parts.push(nestedSvg(renderCandidate(block, head, sweep, 'south', 64), x + 20, 665, 64));
    parts.push(nestedSvg(renderCandidate(block, head, sweep, 'east', 64), x + 91, 665, 64));
    parts.push(checker(x + 166, 671, 52, 7));
    parts.push(nestedSvg(renderCandidate(block, head, sweep, 'south', 40, { black: true }), x + 172, 677, 40));
    parts.push(text(x + 52, 748, 'south', 8, 600, COLORS.muted, 'middle'));
    parts.push(text(x + 123, 748, 'east', 8, 600, COLORS.muted, 'middle'));
    parts.push(text(x + 192, 733, '40', 8, 650, COLORS.muted, 'middle'));
    parts.push(text(x + 14, 799, head.axis, 8, 560, COLORS.muted));
  });

  parts.push(text(28, 860, 'C · one static system: six hair anchors paired with six heads and six bodies', 15, 740));
  parts.push(text(28, 879, 'Hair is independent presentation: none of these pairings assigns a body, gender, job, or temperament.', 10, 500, COLORS.muted));
  HAIR.forEach((hair, index) => {
    const body = ALL_BODIES[index];
    const head = HEADS[index];
    const x = 28 + index * 257;
    const cells = (['south', 'east', 'north', 'west'] as const).flatMap((facing) => (
      [40, 48].map((size) => analyzeGap(renderCandidate(body, head, hair, facing, size, { black: true })))
    ));
    const edge = cells.some((cell) => cell.edgeContact);
    parts.push(panel(x, 897, 245, 242, edge ? COLORS.warning : (index % 2 === 0 ? COLORS.panel : COLORS.panelAlt)));
    parts.push(text(x + 14, 923, `${body.label} · ${head.label} · ${hair.label}`, 10, 730));
    parts.push(text(x + 14, 940, hair.axis, 8, 560, COLORS.muted));
    parts.push(nestedSvg(renderCandidate(body, head, hair, 'south', 64), x + 14, 955, 64));
    parts.push(nestedSvg(renderCandidate(body, head, hair, 'east', 64), x + 82, 955, 64));
    parts.push(nestedSvg(renderCandidate(body, head, hair, 'north', 48), x + 154, 963, 48));
    parts.push(nestedSvg(renderCandidate(body, head, hair, 'west', 40, { black: true }), x + 194, 1018, 40));
    parts.push(text(x + 46, 1031, 'S', 8, 650, COLORS.muted, 'middle'));
    parts.push(text(x + 114, 1031, 'E', 8, 650, COLORS.muted, 'middle'));
    parts.push(text(x + 178, 1024, 'N', 8, 650, COLORS.muted, 'middle'));
    parts.push(text(x + 214, 1071, 'W · 40', 8, 650, COLORS.muted, 'middle'));
    const central = analyzeGap(renderCandidate(body, head, hair, 'south', 40, { black: true }));
    parts.push(text(
      x + 14,
      1117,
      edge
        ? 'cell fit finding · static recut/reframe'
        : (hair.gapPolicy === 'may-bridge' ? 'side bridge permitted' : `${central.gapRows} central air row${central.gapRows === 1 ? '' : 's'}`),
      8,
      650,
      edge ? COLORS.coral : COLORS.muted,
    ));
  });

  parts.push(panel(28, 1158, 1544, 34, COLORS.selectedStrong, 7));
  parts.push(text(
    44,
    1180,
    'Direction read: vary lateral reach, vertical interruption, rear mass, and edge rhythm; keep every style rigid with the existing head group.',
    10,
    700,
    COLORS.green,
  ));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function contextSheet(audit: ReturnType<typeof stressAudit>): string {
  const width = 1600;
  const height = 1130;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`,
    text(28, 40, 'Hair silhouette vocabulary · facings and gameplay context v5', 22, 760),
    text(28, 63, 'REVIEW ONLY · literal 48/40 px · close-hanging arms · rigid hair under existing head transforms', 10, 700, COLORS.coral),
  ];

  parts.push(text(28, 103, 'Four-facing confirmation: silhouette anchors must survive the real east-to-west mirror', 15, 740));
  parts.push(text(28, 122, 'Knot interrupts the rear crown without increasing cell height; the taller production Bun remains a height-debt control.', 10, 500, COLORS.muted));
  HAIR.forEach((hair, index) => {
    const body = ALL_BODIES[index];
    const head = HEADS[index];
    const x = 28 + index * 257;
    const relatedFindings = [
      ...audit.bodies.edgeFindings,
      ...audit.heads.edgeFindings,
    ].filter((finding) => finding.hair === hair.label);
    parts.push(panel(x, 141, 245, 230, relatedFindings.length > 0 ? COLORS.warning : (index % 2 === 0 ? COLORS.panel : COLORS.panelAlt)));
    parts.push(text(x + 14, 167, hair.label, 11, 730));
    parts.push(text(x + 14, 184, hair.axis, 8, 560, COLORS.muted));
    (['south', 'east', 'north', 'west'] as const).forEach((facing, facingIndex) => {
      const px = x + 10 + facingIndex * 57;
      parts.push(nestedSvg(renderCandidate(body, head, hair, facing, 48), px, 199, 48));
      parts.push(text(px + 24, 259, facing[0].toUpperCase(), 8, 650, COLORS.muted, 'middle'));
      parts.push(nestedSvg(renderCandidate(body, head, hair, facing, 40, { black: true }), px + 4, 277, 40));
    });
    parts.push(text(
      x + 14,
      349,
      relatedFindings.length > 0 ? `${relatedFindings.length} fit findings` : (hair.gapPolicy === 'preserve' ? 'air-preserving' : 'side bridge permitted'),
      8,
      650,
      relatedFindings.length > 0 ? COLORS.coral : COLORS.muted,
    ));
  });

  parts.push(text(28, 410, 'Pose stress: hair rides the same rigid head transform; it does not receive secondary motion', 15, 740));
  parts.push(text(28, 429, 'Tail remains a held rear mass. Recoil retains the existing body-foot frame contact but adds no hair contact.', 10, 500, COLORS.muted));
  const poseHair = HAIR.find((hair) => hair.id === 'tail')!;
  const poseBody = ALL_BODIES.find((body) => body.label === 'Barrel')!;
  const poseHead = HEADS.find((head) => head.id === 'point')!;
  const poseCards: Array<{ pose: Pose; label: string; note: string }> = [
    { pose: 'neutral', label: 'Neutral', note: 'rigid datum' },
    { pose: 'slump', label: 'Slump', note: '+7 head drop' },
    { pose: 'glance-back', label: 'Glance back', note: '−14° tilt' },
    { pose: 'recoil', label: 'Recoil', note: 'profile lean + tilt' },
  ];
  poseCards.forEach((entry, index) => {
    const x = 28 + index * 386;
    const finding = audit.poses.edgeFindings.some((row) => row.pose === entry.pose);
    parts.push(panel(x, 448, 374, 190, finding ? COLORS.warning : (entry.pose === 'neutral' ? COLORS.selected : COLORS.panel)));
    parts.push(text(x + 16, 474, entry.label, 11, 730));
    parts.push(text(x + 16, 492, entry.note, 8, 560, COLORS.muted));
    parts.push(nestedSvg(renderCandidate(poseBody, poseHead, poseHair, 'south', 72, { pose: entry.pose }), x + 50, 505, 72));
    parts.push(nestedSvg(renderCandidate(poseBody, poseHead, poseHair, 'east', 72, { pose: entry.pose }), x + 140, 505, 72));
    parts.push(nestedSvg(renderCandidate(poseBody, poseHead, poseHair, 'west', 48, { pose: entry.pose, black: true }), x + 250, 518, 48));
    parts.push(text(x + 86, 592, 'S', 8, 650, COLORS.muted, 'middle'));
    parts.push(text(x + 176, 592, 'E', 8, 650, COLORS.muted, 'middle'));
    parts.push(text(x + 274, 579, 'W · 48', 8, 650, COLORS.muted, 'middle'));
  });

  parts.push(text(28, 678, 'Gameplay context: reacquire the hair anchor above a desk before relying on color or name', 15, 740));
  parts.push(text(28, 697, 'Mixed 48/40 px figures. The front desk hides the body; the rear row tests the complete combinatorial pawn.', 10, 500, COLORS.muted));
  parts.push(panel(28, 716, 1544, 326, '#D7D0BE'));
  for (let row = 0; row < 5; row++) {
    parts.push(`<path d="M 28 ${746 + row * 62} H 1572" stroke="#AAA18C" stroke-width="1" opacity="0.55"/>`);
  }
  for (let column = 0; column < 12; column++) {
    parts.push(`<path d="M ${70 + column * 128} 716 V 1042" stroke="#B2A993" stroke-width="1" opacity="0.35"/>`);
  }

  const crowd = [
    { x: 76, y: 818, size: 48, body: 0, head: 5, hair: 0, facing: 'south' as ReviewFacing },
    { x: 188, y: 813, size: 48, body: 1, head: 4, hair: 1, facing: 'east' as ReviewFacing },
    { x: 305, y: 821, size: 48, body: 2, head: 3, hair: 2, facing: 'west' as ReviewFacing },
    { x: 432, y: 809, size: 48, body: 3, head: 2, hair: 3, facing: 'south' as ReviewFacing },
    { x: 552, y: 817, size: 48, body: 4, head: 1, hair: 4, facing: 'east' as ReviewFacing },
    { x: 671, y: 812, size: 48, body: 5, head: 0, hair: 5, facing: 'west' as ReviewFacing },
    { x: 820, y: 892, size: 40, body: 2, head: 0, hair: 5, facing: 'south' as ReviewFacing },
    { x: 940, y: 899, size: 40, body: 0, head: 1, hair: 4, facing: 'east' as ReviewFacing },
    { x: 1062, y: 891, size: 40, body: 5, head: 2, hair: 3, facing: 'west' as ReviewFacing },
    { x: 1180, y: 897, size: 40, body: 1, head: 5, hair: 2, facing: 'south' as ReviewFacing },
    { x: 1310, y: 889, size: 40, body: 3, head: 4, hair: 1, facing: 'east' as ReviewFacing },
    { x: 1430, y: 895, size: 40, body: 4, head: 3, hair: 0, facing: 'west' as ReviewFacing },
  ];
  crowd.forEach((entry) => {
    parts.push(nestedSvg(
      renderCandidate(
        ALL_BODIES[entry.body],
        HEADS[entry.head],
        HAIR[entry.hair],
        entry.facing,
        entry.size,
      ),
      entry.x,
      entry.y,
      entry.size,
    ));
  });
  for (const desk of [
    { x: 66, y: 852, w: 650 },
    { x: 790, y: 924, w: 700 },
  ]) {
    parts.push(`<rect x="${desk.x}" y="${desk.y}" width="${desk.w}" height="42" rx="8" fill="${COLORS.desk}" stroke="${COLORS.deskDark}" stroke-width="3"/>`);
    parts.push(`<rect x="${desk.x + 18}" y="${desk.y + 42}" width="12" height="71" fill="${COLORS.deskDark}"/>`);
    parts.push(`<rect x="${desk.x + desk.w - 30}" y="${desk.y + 42}" width="12" height="71" fill="${COLORS.deskDark}"/>`);
  }
  parts.push(`<rect x="28" y="1024" width="1544" height="18" fill="${COLORS.floorDark}" opacity="0.55"/>`);

  parts.push(panel(28, 1060, 1544, 50, COLORS.selectedStrong, 8));
  parts.push(text(44, 1083, 'Scope lock', 10, 740, COLORS.green));
  parts.push(text(116, 1083, 'six rigid facing shapes · existing head transform · no hair physics or authored west', 10, 620));
  parts.push(text(44, 1100, 'Height rule', 10, 740, COLORS.coral));
  parts.push(text(116, 1100, 'offset Knot stays in the current cell; a genuinely tall style requires a later static framing decision', 10, 620, COLORS.muted));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function fitMatrixSheet(
  profileFit: ReturnType<typeof profileFitMetrics>,
): string {
  const width = 1600;
  const height = 1110;
  const startX = 92;
  const startY = 148;
  const columnWidth = 248;
  const rowHeight = 148;
  const block = ALL_BODIES.find((body) => body.label === 'Block')!;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`,
    text(28, 40, 'Hair/head fit matrix · true profile correction v5.1', 22, 760),
    text(28, 63, 'REVIEW ONLY · every style fitted to every head · south/east at literal 48 px · east silhouette repeated at 40 px', 10, 700, COLORS.coral),
    text(28, 101, 'The same hair family changes crown width and profile reach with the head; east mass must stop before the face and sit behind the skull.', 13, 700),
  ];

  HAIR.forEach((hair, column) => {
    const x = startX + column * columnWidth;
    parts.push(text(x + 118, 132, hair.label, 11, 740, COLORS.green, 'middle'));
  });

  HEADS.forEach((head, row) => {
    const y = startY + row * rowHeight;
    const fit = fitForHead(head);
    parts.push(text(18, y + 28, head.label, 10, 740));
    parts.push(text(18, y + 46, `S ±${fit.southHalf}`, 8, 560, COLORS.muted));
    parts.push(text(18, y + 62, `E ${fit.eastBack}/${fit.eastFront}`, 8, 560, COLORS.muted));

    HAIR.forEach((hair, column) => {
      const x = startX + column * columnWidth;
      const metric = profileFit.rows.find((entry) => (
        entry.hair === hair.label
        && entry.head === head.label
        && entry.size === 48
      ))!;
      const finding = profileFit.profileFindings.includes(metric);
      parts.push(panel(
        x,
        y,
        236,
        134,
        finding ? COLORS.warning : ((row + column) % 2 === 0 ? COLORS.panel : COLORS.panelAlt),
        8,
      ));
      parts.push(nestedSvg(renderCandidate(block, head, hair, 'south', 48), x + 14, y + 14, 48));
      parts.push(nestedSvg(renderCandidate(block, head, hair, 'east', 48), x + 76, y + 14, 48));
      parts.push(nestedSvg(renderCandidate(block, head, hair, 'east', 40, { black: true }), x + 146, y + 18, 40));
      parts.push(text(x + 38, y + 75, 'S · 48', 8, 650, COLORS.muted, 'middle'));
      parts.push(text(x + 100, y + 75, 'E · 48', 8, 650, COLORS.muted, 'middle'));
      parts.push(text(x + 166, y + 75, 'E · 40', 8, 650, COLORS.muted, 'middle'));
      parts.push(text(
        x + 14,
        y + 104,
        `hair width S ${metric.southHairBounds.width} · E ${metric.eastHairBounds.width}`,
        8,
        600,
        COLORS.muted,
      ));
      parts.push(text(
        x + 14,
        y + 120,
        `profile IoU ${metric.southEastHairIou.toFixed(3)} · face ${Math.round(metric.eastSkinRetention * 100)}%`,
        8,
        650,
        finding ? COLORS.coral : COLORS.green,
      ));
    });
  });

  const adaptationText = profileFit.adaptation
    .map((row) => `${row.hair} +${row.southWidthDelta}/${row.eastWidthDelta}`)
    .join(' · ');
  parts.push(panel(28, 1040, 1544, 48, COLORS.selectedStrong, 8));
  parts.push(text(44, 1062, 'Broad − Long width deltas', 9, 740, COLORS.green));
  parts.push(text(183, 1062, adaptationText, 9, 620));
  parts.push(text(44, 1079, 'Gate', 9, 740, COLORS.coral));
  parts.push(text(
    82,
    1079,
    `${profileFit.profileFindings.length} profile findings · ${profileFit.adaptationFindings.length} head-adaptation findings`,
    9,
    620,
    profileFit.profileFindings.length + profileFit.adaptationFindings.length > 0 ? COLORS.coral : COLORS.muted,
  ));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function writeSvgAndPng(outDir: string, base: string, svg: string): void {
  writeFileSync(join(outDir, `${base}.svg`), svg);
  writeFileSync(
    join(outDir, `${base}.png`),
    new Resvg(svg, { fitTo: { mode: 'zoom', value: 1 } }).render().asPng(),
  );
}

function productionSentinel(): CharacterRecipe {
  return {
    id: 'hair-proof-restoration-sentinel',
    name: 'Hair proof restoration sentinel',
    parts: {
      body: 'body-balanced',
      head: 'head-round',
      hair: 'hair-short',
      outfit: 'outfit-blazer',
      accessories: [],
    },
    palette: PALETTE,
  };
}

export function main(): void {
  if (getPart(NO_OUTFIT)) throw new Error(`Proof outfit sentinel unexpectedly resolves: ${NO_OUTFIT}`);
  const outDir = resolve(process.argv[2] ?? 'docs/previews');
  mkdirSync(outDir, { recursive: true });

  const sentinel = productionSentinel();
  const sentinelNeutralBefore = renderCharacter(
    ALL_BODIES[3],
    liftsFor(ALL_BODIES[3]),
    HEADS[0],
    'south',
    48,
    { hair: 'hair-short', pose: 'neutral' },
  );
  const sentinelPoseBefore = renderCharacter(
    ALL_BODIES[3],
    liftsFor(ALL_BODIES[3]),
    HEADS[0],
    'east',
    48,
    { hair: 'hair-short', pose: 'glance-back' },
  );
  const sentinelPortraitBefore = renderPortrait(
    ALL_BODIES[3],
    liftsFor(ALL_BODIES[3]),
    HEADS[0],
    48,
    { hair: 'hair-short' },
  );
  const carrierFacingsBefore = hairCarrier.facings;
  const productionPartIdsBefore = [
    sentinel.parts.body,
    sentinel.parts.head,
    sentinel.parts.hair,
    sentinel.parts.outfit,
  ].map((id) => getPart(id));

  const metrics = hairMetrics();
  const audit = stressAudit();
  const profileFit = profileFitMetrics();
  const primary = primarySheet(metrics, audit, profileFit);
  const context = contextSheet(audit);
  const fitMatrix = fitMatrixSheet(profileFit);

  const sentinelNeutralAfter = renderCharacter(
    ALL_BODIES[3],
    liftsFor(ALL_BODIES[3]),
    HEADS[0],
    'south',
    48,
    { hair: 'hair-short', pose: 'neutral' },
  );
  const sentinelPoseAfter = renderCharacter(
    ALL_BODIES[3],
    liftsFor(ALL_BODIES[3]),
    HEADS[0],
    'east',
    48,
    { hair: 'hair-short', pose: 'glance-back' },
  );
  const sentinelPortraitAfter = renderPortrait(
    ALL_BODIES[3],
    liftsFor(ALL_BODIES[3]),
    HEADS[0],
    48,
    { hair: 'hair-short' },
  );
  const productionPartIdsAfter = [
    sentinel.parts.body,
    sentinel.parts.head,
    sentinel.parts.hair,
    sentinel.parts.outfit,
  ].map((id) => getPart(id));
  if (
    sentinelNeutralAfter !== sentinelNeutralBefore
    || sentinelPoseAfter !== sentinelPoseBefore
    || sentinelPortraitAfter !== sentinelPortraitBefore
    || hairCarrier.facings !== carrierFacingsBefore
    || productionPartIdsAfter.some((part, index) => part !== productionPartIdsBefore[index])
  ) {
    throw new Error('Process-local hair proof did not restore production output and part references byte-for-byte');
  }

  writeSvgAndPng(outDir, 'character-hair-silhouette-v5', primary);
  writeSvgAndPng(outDir, 'character-hair-silhouette-context-v5', context);
  writeSvgAndPng(outDir, 'character-hair-fit-matrix-v5-1', fitMatrix);
  writeFileSync(join(outDir, 'character-hair-silhouette-v5-metrics.json'), `${JSON.stringify({
    status: 'review-only',
    hairCandidates: HAIR.map(({ id, label, axis, gapPolicy }) => ({ id, label, axis, gapPolicy })),
    headHairFits: HEAD_HAIR_FITS,
    currentAnalogs: CURRENT_ANALOGS,
    externalHairPairwise: metrics,
    profileFit,
    audit,
    animationCost: {
      frames: 0,
      bones: 0,
      poses: 0,
      rendererStates: 0,
      authoredWestFacings: 0,
      secondaryMotionSystems: 0,
    },
    restoration: {
      neutral: 'byte-identical',
      transformedPose: 'byte-identical',
      portrait: 'byte-identical',
      carrierFacingReference: 'identical',
      productionPartReferences: 'identical',
    },
  }, null, 2)}\n`);

  const currentMax = Math.max(metrics.south.current[0]?.iou ?? 0, metrics.east.current[0]?.iou ?? 0);
  const proposedMax = Math.max(metrics.south.proposed[0]?.iou ?? 0, metrics.east.proposed[0]?.iou ?? 0);
  console.log(`40 px closest external-hair overlap: current ${currentMax.toFixed(3)} · proposed ${proposedMax.toFixed(3)}`);
  console.log(`candidate stress: ${audit.bodies.renders} body cells · ${audit.heads.renders} head cells · ${audit.poses.renders} pose cells`);
  console.log(`fit findings: ${audit.bodies.edgeFindings.length} body · ${audit.heads.edgeFindings.length} head · ${audit.poses.edgeFindings.length} hair-added pose`);
  console.log(`profile findings: ${profileFit.profileFindings.length} · head-adaptation findings: ${profileFit.adaptationFindings.length}`);
  console.log(`baseline pose contacts: ${audit.poses.baselineEdgeFindings.length}`);
  console.log(`air-policy findings: ${audit.gapPolicy.findings.length}`);
  console.log('production compositor restoration: neutral, transformed pose, portrait, and part references byte-identical');
  console.log(`wrote review-only hair silhouette proofs to ${outDir}`);
}

if (process.argv[1]?.endsWith('characterHairSilhouettePreview.ts')) {
  main();
}
