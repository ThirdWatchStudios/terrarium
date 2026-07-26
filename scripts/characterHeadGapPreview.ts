/**
 * Review-only head silhouette + body-air proof.
 *
 *   npx tsx scripts/characterHeadGapPreview.ts [outDir]
 *
 * Six stronger head hulls and body-owned head offsets are installed only in
 * this process, rendered through the production compositor, then restored in
 * finally blocks. No canonical part art, schema, export, or animation state is
 * changed.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';

import { composeCharacter, composePortrait } from '../src/core/compositor';
import type {
  BodyAnchors,
  CharacterRecipe,
  Facing,
  PartDef,
  StyleSheet,
} from '../src/core/types';
import { DEFAULT_STYLE, DEFAULT_STYLE_PRESETS } from '../src/data/defaults';
import { getPart, partsForSlot } from '../src/parts/library';
import { POSES, type Pose } from '../src/parts/poses';
import {
  BODIES,
  PINCH,
  installSingleBodyCandidate,
  restoreSingleBodyCandidate,
  type BodyCandidate,
} from './characterPawnPlusPreview';

type ReviewFacing = Facing | 'west';
type AuthoredFacing = Facing;

export interface HeadCandidate {
  id: string;
  label: string;
  axis: string;
  paths: Record<AuthoredFacing, string>;
}

export interface GapStats {
  gapRows: number;
  componentCount: number;
  topMargin: number;
  bottomMargin: number;
  edgeContact: boolean;
}

interface FacingGapPlan {
  lift: number;
  targetRows: number;
  minGapRows: number;
  topMargin: number;
  edgeContact: boolean;
  met: boolean;
}

interface BodyGapPlan {
  body: string;
  south: FacingGapPlan;
  east: FacingGapPlan;
  north: FacingGapPlan;
}

interface RasterComponent {
  area: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  pixels: number[];
}

const HEAD_CARRIER = 'head-round';
const NO_OUTFIT = '__head-gap-proof-no-outfit__';
const SELECTED_GAP_ROWS = 1;
const MIN_PLAN_LIFT = 14;
const MAX_LIFT = 34;
/** Static bake-time crop shift used to recover the air without enlarging the cell. */
export const FRAME_VIEWBOX_Y = -5;

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

const BLACK_PALETTE = {
  skin: COLORS.ink,
  hair: COLORS.ink,
  outfitPrimary: COLORS.ink,
  outfitSecondary: COLORS.ink,
  accent: COLORS.ink,
};

const COLOR_STYLE: StyleSheet = {
  ...structuredClone(DEFAULT_STYLE),
  render: { ...DEFAULT_STYLE.render, contactShadow: 0 },
};

const SILHOUETTE_STYLE: StyleSheet = {
  ...structuredClone(DEFAULT_STYLE),
  outline: { ...DEFAULT_STYLE.outline, color: COLORS.ink },
  render: { ...DEFAULT_STYLE.render, contactShadow: 0 },
};

export const ALL_BODIES: BodyCandidate[] = [...BODIES, PINCH];

/**
 * The crown datum remains near y=-21 so existing hair remains a useful stress
 * test. Distinction is concentrated in width, cheek, jaw, and chin geometry:
 * the part of the head that hair is least likely to hide.
 */
export const HEADS: HeadCandidate[] = [
  {
    id: 'round',
    label: 'Round',
    axis: 'circular control',
    paths: {
      south:
        'M 0 -21 C 13 -21 21 -13 21 0 C 21 11 14 19 4 21 C 2 21.5 -2 21.5 -4 21 C -14 19 -21 11 -21 0 C -21 -13 -13 -21 0 -21 Z',
      east:
        'M -1 -21 C 11 -21 19 -14 20 -4 C 23 -2 23 2 20 4 C 20 13 13 21 1 21 C -12 21 -21 12 -21 0 C -21 -12 -13 -21 -1 -21 Z',
      north:
        'M 0 -21 C 13 -21 21 -13 21 0 C 21 12 12 21 0 21 C -12 21 -21 12 -21 0 C -21 -13 -13 -21 0 -21 Z',
    },
  },
  {
    id: 'broad',
    label: 'Broad',
    axis: 'low lateral reach',
    paths: {
      south:
        'M 0 -20 C 17 -20 26 -13 27 -3 C 28 7 19 15 6 18 C 2 19 -2 19 -6 18 C -19 15 -28 7 -27 -3 C -26 -13 -17 -20 0 -20 Z',
      east:
        'M -3 -20 C 13 -20 23 -13 24 -6 C 28 -4 29 -1 27 2 C 26 4 24 5 24 7 C 23 15 14 19 0 19 C -17 19 -26 12 -26 0 C -26 -11 -17 -20 -3 -20 Z',
      north:
        'M 0 -20 C 17 -20 26 -13 27 -3 C 28 8 19 16 6 18 C 2 19 -2 19 -6 18 C -19 16 -28 8 -27 -3 C -26 -13 -17 -20 0 -20 Z',
    },
  },
  {
    id: 'long',
    label: 'Long',
    axis: 'narrow vertical pull',
    paths: {
      south:
        'M 0 -22 C 8 -22 13 -15 14 -5 L 14 9 C 13 17 8 21 2 22 H -2 C -8 21 -13 17 -14 9 L -14 -5 C -13 -15 -8 -22 0 -22 Z',
      east:
        'M -3 -22 C 6 -22 12 -16 14 -7 C 18 -5 20 -2 19 2 C 18 5 16 6 16 8 C 15 17 9 22 0 22 C -9 22 -15 17 -16 9 L -16 -5 C -15 -16 -10 -22 -3 -22 Z',
      north:
        'M 0 -22 C 8 -22 13 -15 14 -5 L 14 9 C 13 17 8 21 2 22 H -2 C -8 21 -13 17 -14 9 L -14 -5 C -13 -15 -8 -22 0 -22 Z',
    },
  },
  {
    id: 'block',
    label: 'Block',
    axis: 'parallel cheek + flat jaw',
    paths: {
      south:
        'M 0 -21 C 10 -21 18 -16 20 -8 L 20 12 Q 20 21 11 22 H -11 Q -20 21 -20 12 L -20 -8 C -18 -16 -10 -21 0 -21 Z',
      east:
        'M -2 -21 C 9 -21 17 -16 19 -8 L 19 -5 C 23 -3 24 0 22 3 L 19 6 L 19 12 Q 18 21 8 22 H -10 Q -20 20 -20 10 L -20 -8 C -17 -17 -10 -21 -2 -21 Z',
      north:
        'M 0 -21 C 10 -21 18 -16 20 -8 L 20 12 Q 20 21 11 22 H -11 Q -20 21 -20 12 L -20 -8 C -18 -16 -10 -21 0 -21 Z',
    },
  },
  {
    id: 'point',
    label: 'Point',
    axis: 'wide cheek → real chin',
    paths: {
      south:
        'M 0 -21 C 13 -21 22 -14 23 -3 C 23 8 16 15 8 18 L 0 22 L -8 18 C -16 15 -23 8 -23 -3 C -22 -14 -13 -21 0 -21 Z',
      east:
        'M -3 -21 C 10 -21 19 -15 21 -7 C 25 -5 27 -2 25 2 C 24 4 21 5 21 8 C 19 14 12 18 4 22 C -5 21 -14 18 -18 11 C -22 4 -21 -6 -18 -13 C -15 -18 -9 -21 -3 -21 Z',
      north:
        'M 0 -21 C 13 -21 22 -14 23 -3 C 23 9 16 16 8 19 L 0 22 L -8 19 C -16 16 -23 9 -23 -3 C -22 -14 -13 -21 0 -21 Z',
    },
  },
  {
    id: 'lantern',
    label: 'Lantern',
    axis: 'narrow crown → broad jaw',
    paths: {
      south:
        'M 0 -21 C 7 -21 13 -17 14 -10 C 16 -4 15 1 20 7 C 25 12 25 17 18 20 C 12 22 6 22 0 22 C -6 22 -12 22 -18 20 C -25 17 -25 12 -20 7 C -15 1 -16 -4 -14 -10 C -13 -17 -7 -21 0 -21 Z',
      east:
        'M -3 -21 C 6 -21 12 -17 13 -10 C 15 -5 21 -4 23 -1 C 25 2 22 4 20 6 C 25 11 24 17 17 20 C 10 22 1 22 -7 21 C -17 21 -22 17 -22 9 C -22 3 -17 -2 -17 -8 C -16 -16 -10 -21 -3 -21 Z',
      north:
        'M 0 -21 C 7 -21 13 -17 14 -10 C 16 -4 15 1 20 7 C 25 12 25 17 18 20 C 12 22 6 22 0 22 C -6 22 -12 22 -18 20 C -25 17 -25 12 -20 7 C -15 1 -16 -4 -14 -10 C -13 -17 -7 -21 0 -21 Z',
    },
  },
];

const PRODUCTION_HEAD_IDS = [
  'head-round',
  'head-oval',
  'head-long',
  'head-boxy',
  'head-angular',
  'head-soft-square',
] as const;

const headCarrier = getPart(HEAD_CARRIER)!;
if (!headCarrier) throw new Error(`Missing proof head carrier ${HEAD_CARRIER}`);
const PRODUCTION_HEAD_FACINGS = headCarrier.facings;

function candidateFacings(candidate: HeadCandidate): PartDef['facings'] {
  const result: PartDef['facings'] = {};
  for (const facing of ['south', 'east', 'north'] as const) {
    const source = PRODUCTION_HEAD_FACINGS[facing];
    if (!source || source.shapes.length === 0) {
      throw new Error(`Head carrier ${HEAD_CARRIER} is missing ${facing} art`);
    }
    result[facing] = {
      ...source,
      shapes: source.shapes.map((shape, index) => (
        index === 0 ? { ...shape, d: candidate.paths[facing] } : { ...shape }
      )),
    };
  }
  return result;
}

function liftAnchors(anchors: BodyAnchors, lifts: Record<AuthoredFacing, number>): BodyAnchors {
  // Several proof bodies intentionally alias north to their south anchor
  // object. Clone per-facing so shifting south and north cannot apply twice.
  const lifted = {} as BodyAnchors;
  for (const facing of ['south', 'east', 'north'] as const) {
    lifted[facing] = structuredClone(anchors[facing]);
    const amount = lifts[facing];
    lifted[facing].headCenter.y -= amount;
    lifted[facing].aboveHead.y -= amount;
  }
  return lifted;
}

function liftedBody(
  body: BodyCandidate,
  lifts: Record<AuthoredFacing, number>,
): BodyCandidate {
  return { ...body, anchors: liftAnchors(body.anchors, lifts) };
}

function recipe(
  body: BodyCandidate,
  headId: string,
  hair: string,
  outfit: string,
  black: boolean,
): CharacterRecipe {
  return {
    id: `head-gap-${body.label}-${headId}-${hair}-${outfit}`,
    name: `${body.label} ${headId}`,
    parts: {
      body: body.carrier,
      head: headId,
      hair,
      outfit,
      accessories: [],
    },
    palette: black ? BLACK_PALETTE : PALETTE,
  };
}

function withProofParts<T>(
  body: BodyCandidate,
  lifts: Record<AuthoredFacing, number>,
  candidate: HeadCandidate | undefined,
  run: () => T,
): T {
  const bodySnapshot = installSingleBodyCandidate(liftedBody(body, lifts));
  const priorHeadFacings = headCarrier.facings;
  try {
    if (candidate) headCarrier.facings = candidateFacings(candidate);
    return run();
  } finally {
    headCarrier.facings = priorHeadFacings;
    restoreSingleBodyCandidate(bodySnapshot);
  }
}

export interface RenderOptions {
  hair?: string;
  outfit?: string;
  pose?: Pose;
  black?: boolean;
  style?: StyleSheet;
  /** Disable the proof's static bake-time cell crop when auditing raw framing. */
  reframe?: boolean;
}

function reframeCell(svg: string): string {
  return svg.replace('viewBox="0 0 128 128"', `viewBox="0 ${FRAME_VIEWBOX_Y} 128 128"`);
}

export function renderCharacter(
  body: BodyCandidate,
  lifts: Record<AuthoredFacing, number>,
  head: HeadCandidate | string,
  facing: ReviewFacing,
  pixelSize: number,
  options: RenderOptions = {},
): string {
  const candidate = typeof head === 'string' ? undefined : head;
  const headId = typeof head === 'string' ? head : HEAD_CARRIER;
  const black = options.black ?? false;
  const style = options.style ?? (black ? SILHOUETTE_STYLE : COLOR_STYLE);
  const svg = withProofParts(body, lifts, candidate, () => composeCharacter(
    recipe(body, headId, options.hair ?? 'hair-none', options.outfit ?? NO_OUTFIT, black),
    style,
    facing,
    pixelSize,
    'normal',
    { badge: false, pose: options.pose ?? 'neutral' },
  ));
  return options.reframe === false ? svg : reframeCell(svg);
}

export function renderPortrait(
  body: BodyCandidate,
  lifts: Record<AuthoredFacing, number>,
  head: HeadCandidate | string,
  pixelSize: number,
  options: Pick<RenderOptions, 'hair' | 'outfit'> = {},
): string {
  const candidate = typeof head === 'string' ? undefined : head;
  const headId = typeof head === 'string' ? head : HEAD_CARRIER;
  return withProofParts(body, lifts, candidate, () => composePortrait(
    recipe(body, headId, options.hair ?? 'hair-none', options.outfit ?? NO_OUTFIT, false),
    COLOR_STYLE,
    pixelSize,
    'normal',
  ));
}

function raster(svg: string): { png: PNG; mask: Uint8Array } {
  const png = PNG.sync.read(new Resvg(svg).render().asPng());
  const mask = new Uint8Array(png.width * png.height);
  for (let index = 0; index < mask.length; index++) {
    mask[index] = png.data[index * 4 + 3] >= 128 ? 1 : 0;
  }
  return { png, mask };
}

function connectedComponents(mask: Uint8Array, width: number, height: number): RasterComponent[] {
  const visited = new Uint8Array(mask.length);
  const components: RasterComponent[] = [];
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || visited[start]) continue;
    const stack = [start];
    visited[start] = 1;
    const pixels: number[] = [];
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    while (stack.length > 0) {
      const index = stack.pop()!;
      pixels.push(index);
      const x = index % width;
      const y = Math.floor(index / width);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const neighbor = ny * width + nx;
          if (!mask[neighbor] || visited[neighbor]) continue;
          visited[neighbor] = 1;
          stack.push(neighbor);
        }
      }
    }
    components.push({ area: pixels.length, minX, minY, maxX, maxY, pixels });
  }
  return components.sort((left, right) => right.area - left.area);
}

export function analyzeGap(svg: string): GapStats {
  const { png, mask } = raster(svg);
  const components = connectedComponents(mask, png.width, png.height);
  const major = components.filter((component) => component.area >= 8).slice(0, 2);
  const vertical = [...major].sort((left, right) => left.minY - right.minY);
  const gapRows = vertical.length < 2
    ? 0
    : Math.max(0, vertical[1].minY - vertical[0].maxY - 1);
  const occupied = components.flatMap((component) => component.pixels);
  const top = occupied.length > 0
    ? Math.min(...components.map((component) => component.minY))
    : png.height;
  const bottom = occupied.length > 0
    ? Math.max(...components.map((component) => component.maxY))
    : -1;
  const edgeContact = components.some((component) => (
    component.minX === 0
    || component.minY === 0
    || component.maxX === png.width - 1
    || component.maxY === png.height - 1
  ));
  return {
    gapRows,
    componentCount: components.filter((component) => component.area >= 8).length,
    topMargin: top,
    bottomMargin: png.height - 1 - bottom,
    edgeContact,
  };
}

function liftMap(south: number, east: number = south): Record<AuthoredFacing, number> {
  return { south, east, north: south };
}

function findLiftForFacing(
  body: BodyCandidate,
  heads: HeadCandidate[],
  facing: AuthoredFacing,
  targetRows: number,
): FacingGapPlan {
  let last: FacingGapPlan | undefined;
  for (let lift = MIN_PLAN_LIFT; lift <= MAX_LIFT; lift++) {
    const lifts = liftMap(facing === 'east' ? 0 : lift, facing === 'east' ? lift : 0);
    const measures = heads.flatMap((head) => [40, 48].map((size) => analyzeGap(
      renderCharacter(body, lifts, head, facing, size, { black: true }),
    )));
    const candidate: FacingGapPlan = {
      lift,
      targetRows,
      minGapRows: Math.min(...measures.map((measure) => measure.gapRows)),
      topMargin: Math.min(...measures.map((measure) => measure.topMargin)),
      edgeContact: measures.some((measure) => measure.edgeContact),
      met: measures.every((measure) => measure.gapRows >= targetRows),
    };
    last = candidate;
    if (candidate.met) return candidate;
  }
  if (!last) throw new Error(`Unable to scan ${body.label} ${facing}`);
  return last;
}

function bodyGapPlan(body: BodyCandidate): BodyGapPlan {
  const south = findLiftForFacing(body, HEADS, 'south', SELECTED_GAP_ROWS);
  const east = findLiftForFacing(body, HEADS, 'east', SELECTED_GAP_ROWS);
  return {
    body: body.label,
    south,
    east,
    north: { ...south },
  };
}

function planLifts(plan: BodyGapPlan): Record<AuthoredFacing, number> {
  return liftMap(plan.south.lift, plan.east.lift);
}

function gapLadder(body: BodyCandidate, head: HeadCandidate) {
  const rows = [0, 1, 2, 3];
  return rows.map((targetRows) => {
    if (targetRows === 0) {
      const lifts = liftMap(0);
      const south = analyzeGap(renderCharacter(body, lifts, head, 'south', 40, { black: true }));
      const east = analyzeGap(renderCharacter(body, lifts, head, 'east', 40, { black: true }));
      return { targetRows, lift: 0, south, east, met: true };
    }
    for (let lift = 1; lift <= MAX_LIFT; lift++) {
      const lifts = liftMap(lift);
      const south = analyzeGap(renderCharacter(body, lifts, head, 'south', 40, { black: true }));
      const east = analyzeGap(renderCharacter(body, lifts, head, 'east', 40, { black: true }));
      if (south.gapRows >= targetRows && east.gapRows >= targetRows) {
        return { targetRows, lift, south, east, met: true };
      }
    }
    const lifts = liftMap(MAX_LIFT);
    return {
      targetRows,
      lift: MAX_LIFT,
      south: analyzeGap(renderCharacter(body, lifts, head, 'south', 40, { black: true })),
      east: analyzeGap(renderCharacter(body, lifts, head, 'east', 40, { black: true })),
      met: false,
    };
  });
}

function topComponentMask(svg: string): Uint8Array {
  const { png, mask } = raster(svg);
  const components = connectedComponents(mask, png.width, png.height)
    .filter((component) => component.area >= 8)
    .slice(0, 2)
    .sort((left, right) => left.minY - right.minY);
  const result = new Uint8Array(mask.length);
  const head = components[0];
  if (!head) return result;
  for (const index of head.pixels) result[index] = 1;
  return result;
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

function pairwiseHeadMetrics(
  ids: string[],
  renderHead: (id: string, facing: 'south' | 'east') => string,
) {
  return Object.fromEntries((['south', 'east'] as const).map((facing) => {
    const masks = ids.map((id) => ({ id, mask: topComponentMask(renderHead(id, facing)) }));
    const pairs: Array<{ pair: [string, string]; iou: number }> = [];
    for (let left = 0; left < masks.length; left++) {
      for (let right = left + 1; right < masks.length; right++) {
        pairs.push({
          pair: [masks[left].id, masks[right].id],
          iou: Number(iou(masks[left].mask, masks[right].mask).toFixed(3)),
        });
      }
    }
    return [facing, pairs.sort((a, b) => b.iou - a.iou)];
  }));
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
  plans: BodyGapPlan[],
  ladder: ReturnType<typeof gapLadder>,
  currentMetrics: ReturnType<typeof pairwiseHeadMetrics>,
  proposedMetrics: ReturnType<typeof pairwiseHeadMetrics>,
): string {
  const width = 1600;
  const height = 1210;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`,
    text(28, 40, 'Head silhouette + body air · direction proof v4', 22, 760),
    text(28, 63, 'REVIEW ONLY · lower-face anchors first · static y−5 cell reframe · hair and body remain independent parts', 10, 700, COLORS.coral),
  ];

  const edgePlans = plans.filter((plan) => plan.south.edgeContact || plan.east.edgeContact).length;
  const proposedMax = Math.max(proposedMetrics.south[0]?.iou ?? 0, proposedMetrics.east[0]?.iou ?? 0);
  const currentMax = Math.max(currentMetrics.south[0]?.iou ?? 0, currentMetrics.east[0]?.iou ?? 0);
  parts.push(statCard(28, 82, 285, '6', 'orthogonal head anchors', 'round · broad · long · block · point · lantern', COLORS.selected));
  parts.push(statCard(326, 82, 285, '1 px', 'selected air target at 40 + 48', 'body-owned rigid head datum · hair-none', COLORS.selected));
  parts.push(statCard(624, 82, 285, `${currentMax.toFixed(3)} → ${proposedMax.toFixed(3)}`, 'closest head-only IoU', 'diagnostic only · composed review decides'));
  parts.push(statCard(922, 82, 285, '0', 'new animation frames', 'no bones · no pose IDs · west still mirrored', COLORS.selected));
  parts.push(statCard(1220, 82, 352, `${edgePlans}/6`, 'reframed body plans touch an edge', 'proof uses a static five-unit crop shift; high hair audits separately', edgePlans > 0 ? COLORS.warning : COLORS.panel));

  parts.push(text(28, 184, 'A · same body, same air: current head family vs. stronger lower-face anchors', 15, 740));
  parts.push(text(28, 203, 'Portrait gives the design read; literal 40 px south/east silhouettes decide whether it survives gameplay.', 10, 500, COLORS.muted));

  const block = ALL_BODIES.find((body) => body.label === 'Block')!;
  const blockPlan = plans.find((plan) => plan.body === 'Block')!;
  const blockLifts = planLifts(blockPlan);
  const groupWidth = 758;
  for (const [groupIndex, group] of [
    { title: 'Current six', heads: [...PRODUCTION_HEAD_IDS], proposed: false },
    { title: 'Proposed six', heads: HEADS, proposed: true },
  ].entries()) {
    const x = 28 + groupIndex * 772;
    parts.push(panel(x, 220, groupWidth, 316, group.proposed ? COLORS.selected : COLORS.panel));
    parts.push(text(x + 16, 247, group.title, 13, 730, group.proposed ? COLORS.green : COLORS.ink));
    parts.push(text(
      x + 16,
      265,
      group.proposed ? 'Crown held near the hair datum; jaw and chin do the separating.' : 'Round/Oval and Boxy/Soft-square remain the collapse risks.',
      9,
      500,
      COLORS.muted,
    ));
    group.heads.forEach((head, index) => {
      const cellX = x + 12 + index * 122;
      const label = typeof head === 'string'
        ? head.replace('head-', '').replace('-', ' ')
        : head.label;
      const portrait = renderPortrait(block, blockLifts, head, 72);
      const south = renderCharacter(block, blockLifts, head, 'south', 40, { black: true });
      const east = renderCharacter(block, blockLifts, head, 'east', 40, { black: true });
      parts.push(checker(cellX + 22, 278, 72, 9));
      parts.push(nestedSvg(portrait, cellX + 22, 278, 72));
      parts.push(text(cellX + 58, 365, label, 9, 700, group.proposed ? COLORS.green : COLORS.ink, 'middle'));
      parts.push(nestedSvg(south, cellX + 16, 378, 40));
      parts.push(nestedSvg(east, cellX + 64, 378, 40));
      parts.push(text(cellX + 36, 430, 'S', 8, 650, COLORS.muted, 'middle'));
      parts.push(text(cellX + 84, 430, 'E', 8, 650, COLORS.muted, 'middle'));
      if (typeof head !== 'string') {
        parts.push(text(cellX + 58, 458, head.axis, 8, 560, COLORS.muted, 'middle'));
      }
      parts.push(nestedSvg(renderCharacter(block, blockLifts, head, 'south', 56), cellX + 30, 466, 56));
    });
  }

  parts.push(text(28, 575, 'B · separation ladder: choose raster air, not an abstract anchor offset', 15, 740));
  parts.push(text(28, 594, 'Same Round head + Block body. Outline-to-outline space is measured from the final transparent 40 px render.', 10, 500, COLORS.muted));
  const ladderWidth = 374;
  ladder.forEach((entry, index) => {
    const x = 28 + index * 386;
    const selected = entry.targetRows === SELECTED_GAP_ROWS;
    const fill = selected ? COLORS.selected : (entry.south.edgeContact || entry.east.edgeContact ? COLORS.warning : COLORS.panel);
    parts.push(panel(x, 612, ladderWidth, 238, fill));
    const title = entry.targetRows === 0 ? 'Current overlap' : `${entry.targetRows} raster row${entry.targetRows === 1 ? '' : 's'} at 40`;
    parts.push(text(x + 16, 639, title, 12, 740, selected ? COLORS.green : COLORS.ink));
    parts.push(text(x + ladderWidth - 16, 639, selected ? 'SELECTED FOR CONTEXT' : '', 8, 720, COLORS.green, 'end'));
    parts.push(text(x + 16, 658, `head anchor lift ${entry.lift} source units`, 9, 550, COLORS.muted));
    const lifts = liftMap(entry.lift);
    parts.push(nestedSvg(renderCharacter(block, lifts, HEADS[0], 'south', 88), x + 22, 675, 88));
    parts.push(nestedSvg(renderCharacter(block, lifts, HEADS[0], 'east', 88), x + 122, 675, 88));
    parts.push(checker(x + 230, 681, 64, 8));
    parts.push(nestedSvg(renderCharacter(block, lifts, HEADS[0], 'south', 40, { black: true }), x + 242, 693, 40));
    parts.push(checker(x + 300, 681, 64, 8));
    parts.push(nestedSvg(renderCharacter(block, lifts, HEADS[0], 'east', 40, { black: true }), x + 312, 693, 40));
    parts.push(text(x + 66, 779, 'south · 88', 8, 600, COLORS.muted, 'middle'));
    parts.push(text(x + 166, 779, 'east · 88', 8, 600, COLORS.muted, 'middle'));
    parts.push(text(x + 262, 758, `${entry.south.gapRows} row`, 8, 700, COLORS.muted, 'middle'));
    parts.push(text(x + 332, 758, `${entry.east.gapRows} row`, 8, 700, COLORS.muted, 'middle'));
    const margin = Math.min(entry.south.topMargin, entry.east.topMargin);
    parts.push(text(
      x + 16,
      828,
      `top margin ${margin}px @40${entry.south.edgeContact || entry.east.edgeContact ? ' · edge contact' : ''}`,
      9,
      650,
      entry.south.edgeContact || entry.east.edgeContact ? COLORS.coral : COLORS.muted,
    ));
  });

  parts.push(text(28, 890, 'C · one static system: six heads paired with the accepted six body envelopes', 15, 740));
  parts.push(text(28, 909, 'Each body owns one south/north and one east/west head datum; every head reuses it. Neutral close-hanging arms remain present.', 10, 500, COLORS.muted));
  ALL_BODIES.forEach((body, index) => {
    const x = 28 + index * 257;
    const plan = plans[index];
    const lifts = planLifts(plan);
    const head = HEADS[index];
    parts.push(panel(x, 928, 245, 214, index % 2 === 0 ? COLORS.panel : COLORS.panelAlt));
    parts.push(text(x + 14, 953, `${body.label} + ${head.label}`, 11, 730));
    parts.push(text(x + 14, 970, `${head.axis}`, 8, 550, COLORS.muted));
    parts.push(nestedSvg(renderCharacter(body, lifts, head, 'south', 64), x + 16, 985, 64));
    parts.push(nestedSvg(renderCharacter(body, lifts, head, 'east', 64), x + 86, 985, 64));
    parts.push(checker(x + 158, 989, 52, 7));
    parts.push(nestedSvg(renderCharacter(body, lifts, head, 'south', 40, { black: true }), x + 164, 995, 40));
    parts.push(nestedSvg(renderCharacter(body, lifts, head, 'east', 40, { black: true }), x + 190, 1037, 40));
    parts.push(text(x + 48, 1064, 'south', 8, 600, COLORS.muted, 'middle'));
    parts.push(text(x + 118, 1064, 'east', 8, 600, COLORS.muted, 'middle'));
    parts.push(text(
      x + 14,
      1123,
      `lift S${plan.south.lift} / E${plan.east.lift}${plan.south.edgeContact || plan.east.edgeContact ? ' · framing debt' : ''}`,
      8,
      650,
      plan.south.edgeContact || plan.east.edgeContact ? COLORS.coral : COLORS.muted,
    ));
  });

  parts.push(panel(28, 1158, 1544, 34, COLORS.selectedStrong, 7));
  parts.push(text(
    44,
    1180,
    'Direction read: one 40 px row makes the head feel deliberately mounted; a static crop reframe keeps it in-cell without articulated anatomy.',
    10,
    700,
    COLORS.green,
  ));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function contextSheet(plans: BodyGapPlan[]): string {
  const width = 1600;
  const height = 1120;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`,
    text(28, 40, 'Head silhouette + body air · context and debt proof v4', 22, 760),
    text(28, 63, 'REVIEW ONLY · one-row air target · static y−5 cell reframe · hair may bridge the gap by construction', 10, 700, COLORS.coral),
  ];

  const hairIds = ['hair-balding', 'hair-short', 'hair-side-part', 'hair-bob', 'hair-bun', 'hair-coils'];
  parts.push(text(28, 103, 'Hair honesty: the jaw survives some styles; occluding hair is allowed to bridge or hide it', 15, 740));
  parts.push(text(28, 122, 'This row is a compatibility warning surface, not a hair redesign. High crowns expose the existing top-margin constraint.', 10, 500, COLORS.muted));
  ALL_BODIES.forEach((body, index) => {
    const x = 28 + index * 257;
    const head = HEADS[index];
    const lifts = planLifts(plans[index]);
    const hair = hairIds[index];
    const sample = renderCharacter(body, lifts, head, 'south', 64, { hair });
    const profile = renderCharacter(body, lifts, head, 'east', 64, { hair });
    const hairMeasures = (['south', 'east', 'north', 'west'] as const).flatMap((facing) => (
      [40, 48].map((size) => analyzeGap(renderCharacter(body, lifts, head, facing, size, { hair, black: true })))
    ));
    const stats = analyzeGap(renderCharacter(body, lifts, head, 'south', 40, { hair, black: true }));
    const hasEdgeContact = hairMeasures.some((measure) => measure.edgeContact);
    parts.push(panel(x, 141, 245, 218, hasEdgeContact ? COLORS.warning : (index % 2 === 0 ? COLORS.panel : COLORS.panelAlt)));
    parts.push(text(x + 14, 166, `${head.label} · ${hair.replace('hair-', '').replace('-', ' ')}`, 10, 730));
    parts.push(text(x + 14, 183, body.label, 8, 620, COLORS.muted));
    parts.push(nestedSvg(sample, x + 21, 198, 72));
    parts.push(nestedSvg(profile, x + 100, 198, 72));
    parts.push(checker(x + 177, 206, 52, 7));
    parts.push(nestedSvg(renderCharacter(body, lifts, head, 'south', 40, { hair, black: true }), x + 183, 212, 40));
    parts.push(text(x + 57, 286, 'south', 8, 600, COLORS.muted, 'middle'));
    parts.push(text(x + 136, 286, 'east', 8, 600, COLORS.muted, 'middle'));
    parts.push(text(x + 203, 270, '40', 8, 650, COLORS.muted, 'middle'));
    parts.push(text(
      x + 14,
      330,
      hasEdgeContact ? 'one or more facings touch the cell edge · refit later' : `${stats.gapRows} central gap row${stats.gapRows === 1 ? '' : 's'} where hair permits`,
      8,
      650,
      hasEdgeContact ? COLORS.coral : COLORS.muted,
    ));
  });

  parts.push(text(28, 397, 'Pose stress: the gap is a neutral datum, not a promise that every posture stays disconnected', 15, 740));
  parts.push(text(28, 416, 'Slump deliberately drops the rigid head group by 7 source units; tilt continues around the existing neck pivot.', 10, 500, COLORS.muted));
  const poseBody = ALL_BODIES.find((body) => body.label === 'Barrel')!;
  const posePlan = plans.find((plan) => plan.body === 'Barrel')!;
  const poseLifts = planLifts(posePlan);
  const poseHead = HEADS[4];
  const poseCards: Array<{ pose: Pose; label: string; note: string }> = [
    { pose: 'neutral', label: 'Neutral datum', note: 'one-row air target' },
    { pose: 'notice', label: 'Notice', note: '+9° head tilt' },
    { pose: 'slump', label: 'Slump', note: '+7 drop · gap may close' },
    { pose: 'glance-back', label: 'Glance back', note: '−14° head tilt' },
  ];
  poseCards.forEach((entry, index) => {
    const x = 28 + index * 386;
    parts.push(panel(x, 435, 374, 190, entry.pose === 'neutral' ? COLORS.selected : COLORS.panel));
    parts.push(text(x + 16, 461, entry.label, 11, 730));
    parts.push(text(x + 16, 479, entry.note, 8, 550, COLORS.muted));
    parts.push(nestedSvg(renderCharacter(poseBody, poseLifts, poseHead, 'south', 72, { pose: entry.pose }), x + 52, 492, 72));
    parts.push(nestedSvg(renderCharacter(poseBody, poseLifts, poseHead, 'east', 72, { pose: entry.pose }), x + 142, 492, 72));
    parts.push(nestedSvg(renderCharacter(poseBody, poseLifts, poseHead, 'west', 48, { pose: entry.pose, black: true }), x + 250, 505, 48));
    parts.push(text(x + 88, 580, 'S', 8, 650, COLORS.muted, 'middle'));
    parts.push(text(x + 178, 580, 'E', 8, 650, COLORS.muted, 'middle'));
    parts.push(text(x + 274, 566, 'W · 48', 8, 650, COLORS.muted, 'middle'));
  });

  parts.push(text(28, 665, 'Gameplay context: distinct heads still need to read as a population, not six novelty tokens', 15, 740));
  parts.push(text(28, 684, 'No names. Mixed 48/40 px figures. Desk-height occlusion keeps the decision in the head/shoulder band.', 10, 500, COLORS.muted));
  parts.push(panel(28, 703, 1544, 325, '#D7D0BE'));
  for (let row = 0; row < 5; row++) {
    parts.push(`<path d="M 28 ${733 + row * 62} H 1572" stroke="#AAA18C" stroke-width="1" opacity="0.55"/>`);
  }
  for (let column = 0; column < 12; column++) {
    parts.push(`<path d="M ${70 + column * 128} 703 V 1028" stroke="#B2A993" stroke-width="1" opacity="0.35"/>`);
  }
  const crowd = [
    { x: 76, y: 808, size: 48, body: 0, head: 0, hair: 'hair-balding', facing: 'south' as ReviewFacing },
    { x: 188, y: 804, size: 48, body: 1, head: 1, hair: 'hair-short', facing: 'east' as ReviewFacing },
    { x: 305, y: 812, size: 48, body: 2, head: 2, hair: 'hair-side-part', facing: 'west' as ReviewFacing },
    { x: 432, y: 800, size: 48, body: 3, head: 3, hair: 'hair-bob', facing: 'south' as ReviewFacing },
    { x: 552, y: 808, size: 48, body: 4, head: 4, hair: 'hair-pixie', facing: 'east' as ReviewFacing },
    { x: 671, y: 803, size: 48, body: 5, head: 5, hair: 'hair-coils', facing: 'west' as ReviewFacing },
    { x: 820, y: 878, size: 40, body: 2, head: 4, hair: 'hair-none', facing: 'south' as ReviewFacing },
    { x: 940, y: 885, size: 40, body: 0, head: 5, hair: 'hair-short', facing: 'east' as ReviewFacing },
    { x: 1062, y: 877, size: 40, body: 5, head: 0, hair: 'hair-side-part', facing: 'west' as ReviewFacing },
    { x: 1180, y: 883, size: 40, body: 1, head: 3, hair: 'hair-balding', facing: 'south' as ReviewFacing },
    { x: 1310, y: 875, size: 40, body: 3, head: 2, hair: 'hair-pixie', facing: 'east' as ReviewFacing },
    { x: 1430, y: 881, size: 40, body: 4, head: 1, hair: 'hair-coils', facing: 'west' as ReviewFacing },
  ];
  crowd.forEach((entry) => {
    const body = ALL_BODIES[entry.body];
    parts.push(nestedSvg(
      renderCharacter(body, planLifts(plans[entry.body]), HEADS[entry.head], entry.facing, entry.size, { hair: entry.hair }),
      entry.x,
      entry.y,
      entry.size,
    ));
  });
  for (const desk of [
    { x: 66, y: 840, w: 650 },
    { x: 790, y: 910, w: 700 },
  ]) {
    parts.push(`<rect x="${desk.x}" y="${desk.y}" width="${desk.w}" height="42" rx="8" fill="${COLORS.desk}" stroke="${COLORS.deskDark}" stroke-width="3"/>`);
    parts.push(`<rect x="${desk.x + 18}" y="${desk.y + 42}" width="12" height="71" fill="${COLORS.deskDark}"/>`);
    parts.push(`<rect x="${desk.x + desk.w - 30}" y="${desk.y + 42}" width="12" height="71" fill="${COLORS.deskDark}"/>`);
  }
  parts.push(`<rect x="28" y="1010" width="1544" height="18" fill="${COLORS.floorDark}" opacity="0.55"/>`);

  parts.push(panel(28, 1046, 1544, 52, COLORS.selectedStrong, 8));
  parts.push(text(44, 1070, 'Scope lock', 10, 740, COLORS.green));
  parts.push(text(116, 1070, 'static per-facing head art + body-owned datum + bake-time cell reframe', 10, 620));
  parts.push(text(44, 1088, 'Deferred debt', 10, 740, COLORS.coral));
  parts.push(text(130, 1088, 'high-crown hair refit and promotion of the crop policy; no procedural animation system is required', 10, 620, COLORS.muted));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function writeSvgAndPng(outDir: string, base: string, svg: string): void {
  writeFileSync(join(outDir, `${base}.svg`), svg);
  writeFileSync(
    join(outDir, `${base}.png`),
    new Resvg(svg, { fitTo: { mode: 'zoom', value: 1 } }).render().asPng(),
  );
}

function stressAudit(plans: BodyGapPlan[]) {
  let fullBodyRenders = 0;
  let gapMisses = 0;
  let edgeContacts = 0;
  const gapByCombination: Array<{
    body: string;
    head: string;
    facing: ReviewFacing;
    size: number;
    stats: GapStats;
  }> = [];
  for (let bodyIndex = 0; bodyIndex < ALL_BODIES.length; bodyIndex++) {
    const body = ALL_BODIES[bodyIndex];
    const lifts = planLifts(plans[bodyIndex]);
    for (const head of HEADS) {
      for (const facing of ['south', 'east', 'north', 'west'] as const) {
        for (const size of [40, 48] as const) {
          const svg = renderCharacter(body, lifts, head, facing, size, { black: true });
          const stats = analyzeGap(svg);
          fullBodyRenders++;
          if (stats.gapRows < SELECTED_GAP_ROWS) gapMisses++;
          if (stats.edgeContact) edgeContacts++;
          gapByCombination.push({ body: body.label, head: head.label, facing, size, stats });
        }
      }
    }
  }

  const representativeHairs = [
    'hair-none',
    'hair-balding',
    'hair-short',
    'hair-side-part',
    'hair-bob',
    'hair-long-straight',
    'hair-bun',
    'hair-coils',
  ];
  let hairRenders = 0;
  let hairEdgeContacts = 0;
  const hairEdgeDetails: Array<{ head: string; hair: string; facing: ReviewFacing }> = [];
  const block = ALL_BODIES.find((body) => body.label === 'Block')!;
  const blockLifts = planLifts(plans.find((plan) => plan.body === 'Block')!);
  for (const head of HEADS) {
    for (const hair of representativeHairs) {
      for (const facing of ['south', 'east', 'north', 'west'] as const) {
        const svg = renderCharacter(block, blockLifts, head, facing, 48, { hair });
        hairRenders++;
        if (analyzeGap(svg).edgeContact) {
          hairEdgeContacts++;
          hairEdgeDetails.push({ head: head.label, hair, facing });
        }
      }
    }
  }

  const pairedHairs = ['hair-balding', 'hair-short', 'hair-side-part', 'hair-bob', 'hair-bun', 'hair-coils'];
  let pairedHairRenders = 0;
  const pairedHairEdgeDetails: Array<{
    body: string;
    head: string;
    hair: string;
    facing: ReviewFacing;
    size: number;
  }> = [];
  for (let index = 0; index < ALL_BODIES.length; index++) {
    for (const facing of ['south', 'east', 'north', 'west'] as const) {
      for (const size of [40, 48] as const) {
        const svg = renderCharacter(
          ALL_BODIES[index],
          planLifts(plans[index]),
          HEADS[index],
          facing,
          size,
          { hair: pairedHairs[index] },
        );
        pairedHairRenders++;
        if (analyzeGap(svg).edgeContact) {
          pairedHairEdgeDetails.push({
            body: ALL_BODIES[index].label,
            head: HEADS[index].label,
            hair: pairedHairs[index],
            facing,
            size,
          });
        }
      }
    }
  }

  let poseRenders = 0;
  let poseTokenFailures = 0;
  let poseEdgeContacts = 0;
  const poseEdgeDetails: Array<{
    body: string;
    head: string;
    pose: Pose;
    facing: ReviewFacing;
  }> = [];
  for (let index = 0; index < ALL_BODIES.length; index++) {
    const body = ALL_BODIES[index];
    const head = HEADS[index];
    const lifts = planLifts(plans[index]);
    for (const pose of POSES) {
      for (const facing of ['south', 'east', 'north', 'west'] as const) {
        const svg = renderCharacter(body, lifts, head, facing, 48, { pose });
        poseRenders++;
        if (svg.includes('$')) poseTokenFailures++;
        if (analyzeGap(svg).edgeContact) {
          poseEdgeContacts++;
          poseEdgeDetails.push({ body: body.label, head: head.label, pose, facing });
        }
      }
    }
  }

  const styleRows = DEFAULT_STYLE_PRESETS.map((preset) => {
    let renders = 0;
    let edgeContacts = 0;
    for (let index = 0; index < ALL_BODIES.length; index++) {
      for (const facing of ['south', 'east', 'north', 'west'] as const) {
        const svg = renderCharacter(
          ALL_BODIES[index],
          planLifts(plans[index]),
          HEADS[index],
          facing,
          40,
          { style: { ...structuredClone(preset.style), render: { ...preset.style.render, contactShadow: 0 } } },
        );
        renders++;
        if (analyzeGap(svg).edgeContact) edgeContacts++;
      }
    }
    return { id: preset.id, outline: preset.style.outline, renders, edgeContacts };
  });

  return {
    note:
      'Raster separation is measured on final alpha at literal output size. A one-row neutral gap is the review target; composed visual review remains authoritative.',
    fullBody: {
      renders: fullBodyRenders,
      gapMisses,
      edgeContacts,
      minimumGapRows: Math.min(...gapByCombination.map((entry) => entry.stats.gapRows)),
      combinations: gapByCombination,
    },
    hair: {
      representativeHairs,
      availableProductionHairs: partsForSlot('hair').map((part) => part.id),
      renders: hairRenders,
      edgeContacts: hairEdgeContacts,
      edgeDetails: hairEdgeDetails,
      paired: {
        hairs: pairedHairs,
        renders: pairedHairRenders,
        edgeContacts: pairedHairEdgeDetails.length,
        edgeDetails: pairedHairEdgeDetails,
      },
      note: 'Long and high hair may intentionally bridge the head/body air; edge contact remains framing debt.',
    },
    poses: {
      renders: poseRenders,
      tokenFailures: poseTokenFailures,
      edgeContacts: poseEdgeContacts,
      edgeDetails: poseEdgeDetails,
      note: 'All existing poses reuse the same rigid head group. Slump may intentionally close the neutral gap.',
    },
    styles: styleRows,
  };
}

function main(): void {
  if (getPart(NO_OUTFIT)) {
    throw new Error(`Proof outfit sentinel unexpectedly resolves: ${NO_OUTFIT}`);
  }
  const outDir = resolve(process.argv[2] ?? 'docs/previews');
  mkdirSync(outDir, { recursive: true });

  const sentinelRecipe: CharacterRecipe = {
    id: 'head-gap-restoration-sentinel',
    name: 'Head gap restoration sentinel',
    parts: {
      body: 'body-balanced',
      head: 'head-round',
      hair: 'hair-bob',
      outfit: 'outfit-blazer',
      accessories: [],
    },
    palette: PALETTE,
  };
  const sentinelNeutralBefore = composeCharacter(
    sentinelRecipe,
    COLOR_STYLE,
    'south',
    48,
    'normal',
    { badge: false, pose: 'neutral' },
  );
  const sentinelPoseBefore = composeCharacter(
    sentinelRecipe,
    COLOR_STYLE,
    'east',
    48,
    'normal',
    { badge: false, pose: 'glance-back' },
  );
  const sentinelPortraitBefore = composePortrait(sentinelRecipe, COLOR_STYLE, 48, 'normal');
  const headReferenceBefore = headCarrier.facings;

  const plans = ALL_BODIES.map(bodyGapPlan);
  const block = ALL_BODIES.find((body) => body.label === 'Block')!;
  const blockPlan = plans.find((plan) => plan.body === 'Block')!;
  const blockLifts = planLifts(blockPlan);
  const ladder = gapLadder(block, HEADS[0]);
  const currentMetrics = pairwiseHeadMetrics(
    [...PRODUCTION_HEAD_IDS],
    (id, facing) => renderCharacter(block, blockLifts, id, facing, 40, { black: true }),
  );
  const proposedMetrics = pairwiseHeadMetrics(
    HEADS.map((head) => head.id),
    (id, facing) => renderCharacter(
      block,
      blockLifts,
      HEADS.find((head) => head.id === id)!,
      facing,
      40,
      { black: true },
    ),
  );
  const primary = primarySheet(plans, ladder, currentMetrics, proposedMetrics);
  const context = contextSheet(plans);
  const audit = stressAudit(plans);

  const sentinelNeutralAfter = composeCharacter(
    sentinelRecipe,
    COLOR_STYLE,
    'south',
    48,
    'normal',
    { badge: false, pose: 'neutral' },
  );
  const sentinelPoseAfter = composeCharacter(
    sentinelRecipe,
    COLOR_STYLE,
    'east',
    48,
    'normal',
    { badge: false, pose: 'glance-back' },
  );
  const sentinelPortraitAfter = composePortrait(sentinelRecipe, COLOR_STYLE, 48, 'normal');
  if (
    sentinelNeutralAfter !== sentinelNeutralBefore
    || sentinelPoseAfter !== sentinelPoseBefore
    || sentinelPortraitAfter !== sentinelPortraitBefore
    || headCarrier.facings !== headReferenceBefore
  ) {
    throw new Error('Process-local head/body proof mutation did not restore production output byte-for-byte');
  }

  writeSvgAndPng(outDir, 'character-head-gap-v4', primary);
  writeSvgAndPng(outDir, 'character-head-gap-context-v4', context);
  writeFileSync(join(outDir, 'character-head-gap-v4-metrics.json'), `${JSON.stringify({
    status: 'review-only',
    selectedGapRowsAt40: SELECTED_GAP_ROWS,
    staticCellReframe: {
      viewBoxY: FRAME_VIEWBOX_Y,
      note: 'Bake-time crop shift only; this is not a runtime animation state.',
    },
    headCandidates: HEADS.map(({ id, label, axis }) => ({ id, label, axis })),
    gapLadder: ladder,
    bodyPlans: plans,
    headOnlyPairwise: {
      current: currentMetrics,
      proposed: proposedMetrics,
    },
    audit,
    animationCost: {
      frames: 0,
      bones: 0,
      poses: 0,
      rendererStates: 0,
      authoredWestFacings: 0,
    },
    restoration: {
      neutral: 'byte-identical',
      transformedPose: 'byte-identical',
      portrait: 'byte-identical',
      headFacingReference: 'identical',
    },
  }, null, 2)}\n`);

  const currentClosest = Math.max(currentMetrics.south[0]?.iou ?? 0, currentMetrics.east[0]?.iou ?? 0);
  const proposedClosest = Math.max(proposedMetrics.south[0]?.iou ?? 0, proposedMetrics.east[0]?.iou ?? 0);
  console.log(`40 px closest head-only overlap: current ${currentClosest.toFixed(3)} · proposed ${proposedClosest.toFixed(3)}`);
  console.log(`selected neutral air target: ${SELECTED_GAP_ROWS} raster row at 40 px`);
  console.log(`stress renders: ${audit.fullBody.renders} body/head · ${audit.hair.renders + audit.hair.paired.renders} hair · ${audit.poses.renders} pose`);
  console.log(`framing debt: ${audit.fullBody.edgeContacts} body/head edge contacts · ${audit.hair.paired.edgeContacts} paired-hair edge contacts`);
  console.log('production compositor restoration: neutral, transformed pose, and portrait byte-identical');
  console.log(`wrote review-only head-gap proofs to ${outDir}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main();
}
