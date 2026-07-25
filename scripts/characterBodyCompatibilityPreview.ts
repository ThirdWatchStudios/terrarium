/**
 * Review-only six-body production-compatibility gate.
 *
 *   npx tsx scripts/characterBodyCompatibilityPreview.ts [outDir]
 *
 * Each candidate is installed sequentially on an existing body carrier,
 * rendered through the production compositor, and restored in a finally block.
 * Pinch intentionally remains a proof-local body-soft carrier here: this gate
 * exercises its hull and rig, while recording a true sixth-ID dispatch check as
 * promotion work rather than mutating the production registry.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';

import { composeCharacter } from '../src/core/compositor';
import type {
  BodyAnchorPoint,
  CharacterRecipe,
  Facing,
  StyleSheet,
} from '../src/core/types';
import { DEFAULT_STYLE, DEFAULT_STYLE_PRESETS } from '../src/data/defaults';
import { getPart } from '../src/parts/library';
import { POSES, poseVariantFor, type Pose } from '../src/parts/poses';
import {
  BODIES,
  PINCH,
  installSingleBodyCandidate,
  restoreSingleBodyCandidate,
  type BodyCandidate,
} from './characterPawnPlusPreview';

type ReviewFacing = Facing | 'west';
type FindingKind =
  | 'anchor'
  | 'pose-rig'
  | 'invalid-geometry'
  | 'unresolved-palette'
  | 'nondeterminism'
  | 'canvas-clip'
  | 'silhouette-collapse'
  | 'fitted-paint'
  | 'dress-expansion';

interface RenderCell {
  label: string;
  svg: string;
}

interface Finding {
  kind: FindingKind;
  label: string;
  detail: string;
  svg?: string;
}

interface IntegrationGap {
  label: string;
  detail: string;
}

interface SilhouetteComparison {
  pair: [string, string];
  pose: Pose;
  facing: Facing;
  iou: number;
  differingPixels: number;
}

interface AuditReport {
  reviewOnly: true;
  productionCompositorRestored: boolean;
  candidates: Array<{
    label: string;
    proofCarrier: string;
    construction: string;
  }>;
  coverage: {
    bodyCount: number;
    poseCount: number;
    authoredFacingCount: number;
    renderedFacingCount: number;
    standardGarmentCount: number;
    specialGarmentCount: number;
    stylePresetCount: number;
    outfitRenderCount: number;
    heldAccessoryRenderCount: number;
    totalAuditedRenders: number;
  };
  hardFailures: Finding[];
  adapterFindings: Finding[];
  integrationGaps: IntegrationGap[];
  silhouette: {
    comparedStates: number;
    exactCollapses: number;
    maximumIou: number;
    closest: SilhouetteComparison[];
  };
}

interface Captures {
  foundation: Map<string, string>;
  poses: Map<string, string>;
  garments: Map<string, string>;
  stress: Map<string, string>;
}

interface StressRecipe {
  body: string;
  outfit: string;
  hair: string;
  accessories: string[];
  pose: Pose;
  note: string;
}

const CANVAS = 128;
const NO_PART = '__body-compatibility-proof-none__';
const CANDIDATES: BodyCandidate[] = [...BODIES, PINCH];
const FACINGS: ReviewFacing[] = ['south', 'east', 'north', 'west'];
const SOURCE_FACINGS: Facing[] = ['south', 'east', 'north'];
const STANDARD_GARMENTS = [
  'outfit-tee',
  'outfit-polo',
  'outfit-shirt-tie',
  'outfit-turtleneck',
  'outfit-cardigan',
  'outfit-blazer',
  'outfit-suit-jacket',
  'outfit-hoodie',
  'outfit-vest',
  'outfit-hi-vis',
  'outfit-dress',
] as const;
const SPECIAL_GARMENTS = ['outfit-service-apron'] as const;
const GARMENTS = [...STANDARD_GARMENTS, ...SPECIAL_GARMENTS] as const;
const FITTED_GARMENTS = GARMENTS.filter((id) => id !== 'outfit-dress');
const VISUAL_GARMENTS = [
  'outfit-tee',
  'outfit-suit-jacket',
  'outfit-hoodie',
  'outfit-hi-vis',
  'outfit-dress',
  'outfit-service-apron',
] as const;
const HAND_ACCESSORIES = [
  'acc-mug',
  'acc-watch',
  'acc-clipboard',
  'acc-coffee-tray',
  'acc-paper-stack',
] as const;

const POSE_SHORT: Record<Pose, string> = {
  neutral: 'neutral',
  'walk-approach': 'walk →',
  notice: 'notice',
  'arms-crossed': 'crossed',
  'hands-on-hips': 'hips',
  point: 'point',
  slump: 'slump',
  'walk-away': 'walk ←',
  'lean-in': 'lean',
  'glance-back': 'glance',
  laugh: 'laugh',
  shrug: 'shrug',
  recoil: 'recoil',
  celebrate: 'celebrate',
  console: 'console',
};

const STRESS_RECIPES: StressRecipe[] = [
  {
    body: 'Column',
    outfit: 'outfit-hoodie',
    hair: 'hair-bun',
    accessories: ['acc-hard-hat', 'acc-headset'],
    pose: 'celebrate',
    note: 'tall crown · headgear stack · raised arms',
  },
  {
    body: 'Block',
    outfit: 'outfit-service-apron',
    hair: 'hair-coils',
    accessories: ['acc-hairnet', 'acc-clipboard'],
    pose: 'slump',
    note: 'compact stack · apron · net · held prop',
  },
  {
    body: 'Wedge',
    outfit: 'outfit-hi-vis',
    hair: 'hair-short',
    accessories: ['acc-badge', 'acc-coffee-tray', 'acc-watch'],
    pose: 'walk-approach',
    note: 'wide shoulder · bands · tray · wrist',
  },
  {
    body: 'Barrel',
    outfit: 'outfit-cardigan',
    hair: 'hair-side-part',
    accessories: ['acc-lanyard', 'acc-mug', 'acc-watch'],
    pose: 'walk-approach',
    note: 'full middle · center detail · mug tracking',
  },
  {
    body: 'Bell',
    outfit: 'outfit-dress',
    hair: 'hair-ponytail',
    accessories: ['acc-paper-stack', 'acc-watch'],
    pose: 'walk-approach',
    note: 'lower flare · dress flare · prop occlusion',
  },
  {
    body: 'Pinch',
    outfit: 'outfit-suit-jacket',
    hair: 'hair-bun',
    accessories: ['acc-lanyard', 'acc-clipboard', 'acc-watch'],
    pose: 'hands-on-hips',
    note: 'dense torso detail · arms across waist rhythm',
  },
];

const COLORS = {
  page: '#F2EFE7',
  panel: '#FFFEFA',
  panelAlt: '#E8E3D8',
  row: '#F7F4EC',
  ink: '#29302E',
  muted: '#68736F',
  grid: '#CEC6B8',
  cream: '#DAD1BA',
  green: '#345749',
  greenSoft: '#E4ECE5',
  coral: '#B75E4B',
  coralSoft: '#F2E1DD',
  amber: '#9A6A24',
  amberSoft: '#F2E9D5',
} as const;

const PALETTE = {
  skin: '#C68B62',
  hair: '#38271F',
  outfitPrimary: '#6F9386',
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

const DISPLAY_STYLE: StyleSheet = {
  ...structuredClone(DEFAULT_STYLE),
  render: { ...DEFAULT_STYLE.render, contactShadow: 0 },
};

const BLACK_STYLE: StyleSheet = {
  ...structuredClone(DEFAULT_STYLE),
  outline: { ...DEFAULT_STYLE.outline, width: 0, color: COLORS.ink },
  render: { ...DEFAULT_STYLE.render, contactShadow: 0 },
};

const FIT_STYLE: StyleSheet = {
  ...structuredClone(DEFAULT_STYLE),
  outline: { ...DEFAULT_STYLE.outline, width: 0 },
  render: { ...DEFAULT_STYLE.render, contactShadow: 0 },
};

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function text(
  x: number,
  y: number,
  value: string,
  size = 13,
  weight = 400,
  fill: string = COLORS.ink,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return (
    `<text x="${x}" y="${y}" text-anchor="${anchor}" ` +
    `font-family="system-ui, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">` +
    `${escapeXml(value)}</text>`
  );
}

function panel(
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string = COLORS.panel,
  radius = 8,
): string {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" stroke="${COLORS.grid}"/>`;
}

function svgInner(svg: string): string {
  return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

function placedSvg(svg: string, x: number, y: number, size: number): string {
  return `<g transform="translate(${x} ${y}) scale(${size / CANVAS})">${svgInner(svg)}</g>`;
}

function candidateKey(candidate: BodyCandidate): string {
  return candidate.label.toLowerCase();
}

function recipe(
  candidate: BodyCandidate,
  options: {
    head?: string;
    hair?: string;
    outfit?: string;
    accessories?: string[];
    black?: boolean;
  } = {},
): CharacterRecipe {
  return {
    id: `body-compatibility-${candidateKey(candidate)}`,
    name: candidate.label,
    parts: {
      body: candidate.carrier,
      head: options.head ?? 'head-round',
      hair: options.hair ?? 'hair-none',
      outfit: options.outfit ?? NO_PART,
      accessories: options.accessories ?? [],
    },
    palette: options.black ? BLACK_PALETTE : PALETTE,
  };
}

function render(
  candidate: BodyCandidate,
  facing: ReviewFacing,
  pose: Pose,
  options: {
    style?: StyleSheet;
    head?: string;
    hair?: string;
    outfit?: string;
    accessories?: string[];
    black?: boolean;
    pixelSize?: number;
  } = {},
): string {
  return composeCharacter(
    recipe(candidate, options),
    options.style ?? (options.black ? BLACK_STYLE : DISPLAY_STYLE),
    facing,
    options.pixelSize ?? CANVAS,
    'normal',
    { badge: false, pose },
  );
}

function bodyOnly(candidate: BodyCandidate, facing: ReviewFacing): string {
  return composeCharacter(
    recipe(candidate, {
      head: NO_PART,
      hair: NO_PART,
      outfit: NO_PART,
      accessories: [],
      black: true,
    }),
    BLACK_STYLE,
    facing,
    CANVAS,
    'normal',
    { badge: false },
  );
}

function rasterGrid(cells: RenderCell[], cellSize: number, cols: number): { png: PNG; gap: number } {
  const gap = 2;
  const rows = Math.ceil(cells.length / cols);
  const width = cols * (cellSize + gap) + gap;
  const height = rows * (cellSize + gap) + gap;
  const body = cells.map((cell, index) => {
    const x = gap + (index % cols) * (cellSize + gap);
    const y = gap + Math.floor(index / cols) * (cellSize + gap);
    return `<g transform="translate(${x} ${y}) scale(${cellSize / CANVAS})">${svgInner(cell.svg)}</g>`;
  }).join('');
  const grid = (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${body}</svg>`
  );
  return { png: PNG.sync.read(new Resvg(grid).render().asPng()), gap };
}

function clippedCells(cells: RenderCell[], cellSize: number, cols: number): string[] {
  const { png, gap } = rasterGrid(cells, cellSize, cols);
  const alphaAt = (x: number, y: number) => png.data[(y * png.width + x) * 4 + 3];
  const clipped: string[] = [];

  cells.forEach((cell, index) => {
    const x0 = gap + (index % cols) * (cellSize + gap);
    const y0 = gap + Math.floor(index / cols) * (cellSize + gap);
    const x1 = x0 + cellSize - 1;
    const y1 = y0 + cellSize - 1;
    let touches = false;
    for (let x = x0; x <= x1 && !touches; x++) {
      touches = alphaAt(x, y0) > 0 || alphaAt(x, y1) > 0;
    }
    for (let y = y0; y <= y1 && !touches; y++) {
      touches = alphaAt(x0, y) > 0 || alphaAt(x1, y) > 0;
    }
    if (touches) clipped.push(cell.label);
  });
  return clipped;
}

function outsidePaintCounts(
  baseCells: RenderCell[],
  dressedCells: RenderCell[],
  cellSize: number,
  cols: number,
): Array<{ label: string; count: number }> {
  if (
    baseCells.length !== dressedCells.length ||
    baseCells.some((cell, index) => cell.label !== dressedCells[index]?.label)
  ) {
    throw new Error('Fitted-paint grids are not aligned');
  }
  const base = rasterGrid(baseCells, cellSize, cols);
  const dressed = rasterGrid(dressedCells, cellSize, cols);
  const counts: Array<{ label: string; count: number }> = [];

  baseCells.forEach((cell, index) => {
    const x0 = base.gap + (index % cols) * (cellSize + base.gap);
    const y0 = base.gap + Math.floor(index / cols) * (cellSize + base.gap);
    let count = 0;
    for (let y = y0; y < y0 + cellSize; y++) {
      for (let x = x0; x < x0 + cellSize; x++) {
        const offset = (y * base.png.width + x) * 4 + 3;
        if (base.png.data[offset] <= 8 && dressed.png.data[offset] > 32) count++;
      }
    }
    counts.push({ label: cell.label, count });
  });
  return counts;
}

function rasterMask(svg: string): Uint8Array {
  const png = PNG.sync.read(new Resvg(svg).render().asPng());
  const mask = new Uint8Array(png.width * png.height);
  for (let index = 0; index < mask.length; index++) {
    mask[index] = png.data[index * 4 + 3] >= 128 ? 1 : 0;
  }
  return mask;
}

function silhouetteStats(left: Uint8Array, right: Uint8Array): {
  iou: number;
  differingPixels: number;
} {
  if (left.length !== right.length) throw new Error('Silhouette masks use different canvases');
  let intersection = 0;
  let union = 0;
  let differingPixels = 0;
  for (let index = 0; index < left.length; index++) {
    if (left[index] || right[index]) union++;
    if (left[index] && right[index]) intersection++;
    if (left[index] !== right[index]) differingPixels++;
  }
  return {
    iou: union === 0 ? 1 : intersection / union,
    differingPixels,
  };
}

function finding(
  findings: Finding[],
  kind: FindingKind,
  label: string,
  detail: string,
  svg?: string,
): void {
  findings.push({ kind, label, detail, ...(svg ? { svg } : {}) });
}

function validateAnchors(candidate: BodyCandidate, hardFailures: Finding[]): void {
  for (const facing of SOURCE_FACINGS) {
    const anchors = candidate.anchors[facing];
    const points: BodyAnchorPoint[] = [
      anchors.headCenter,
      anchors.aboveHead,
      anchors.neck,
      anchors.chest,
      anchors.hip,
      anchors.shoulders.left,
      anchors.shoulders.right,
      anchors.waist.left,
      anchors.waist.right,
      anchors.hem.left,
      anchors.hem.right,
    ];
    const label = `${candidate.label}/${facing}`;
    if (points.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y))) {
      finding(hardFailures, 'anchor', label, 'contains a non-finite anchor');
    }
    if (
      anchors.shoulders.left.x >= anchors.shoulders.right.x ||
      anchors.waist.left.x >= anchors.waist.right.x ||
      anchors.hem.left.x >= anchors.hem.right.x
    ) {
      finding(hardFailures, 'anchor', label, 'contains an inverted horizontal anchor span');
    }
    if (anchors.aboveHead.y !== anchors.headCenter.y - 32) {
      finding(hardFailures, 'anchor', label, 'aboveHead is not 32 units above headCenter');
    }
  }
}

function validatePoseRig(candidate: BodyCandidate, hardFailures: Finding[]): void {
  for (const pose of POSES) {
    for (const facing of FACINGS) {
      const actual: Facing = facing === 'west' ? 'east' : facing;
      const label = `${candidate.label}/${pose}/${facing}`;
      const variant = poseVariantFor(pose, actual, candidate.anchors[actual]);
      if (!variant) {
        finding(hardFailures, 'pose-rig', label, 'did not generate a pose variant');
        continue;
      }
      if (!variant.attachments?.handRight) {
        finding(hardFailures, 'pose-rig', label, 'did not publish a right wrist');
      }
      const carryHand = variant.attachments?.carryHand;
      if (!carryHand || !/^(left|right|none)$/.test(carryHand)) {
        finding(hardFailures, 'pose-rig', label, 'did not publish a valid carry policy');
      } else if (carryHand !== 'none') {
        const carryPoint = carryHand === 'left'
          ? variant.attachments?.handLeft
          : variant.attachments?.handRight;
        if (!carryPoint) {
          finding(hardFailures, 'pose-rig', label, `declares a missing ${carryHand} carry wrist`);
        }
      }
      for (const point of [
        variant.attachments?.handLeft,
        variant.attachments?.handRight,
      ].filter(Boolean)) {
        if (!Number.isFinite(point!.x) || !Number.isFinite(point!.y)) {
          finding(hardFailures, 'pose-rig', label, 'contains a non-finite wrist');
        }
      }
    }
  }
}

function validateRender(
  label: string,
  first: string,
  second: string,
  hardFailures: Finding[],
): void {
  if (first !== second) {
    finding(hardFailures, 'nondeterminism', label, 'two compositor calls returned different SVG');
  }
  if (/NaN|undefined/.test(first)) {
    finding(hardFailures, 'invalid-geometry', label, 'render contains invalid geometry');
  }
  if (first.toUpperCase().includes('#FF00FF')) {
    finding(hardFailures, 'unresolved-palette', label, 'render contains an unresolved palette token');
  }
}

function captureVisuals(candidate: BodyCandidate, captures: Captures): void {
  const key = candidateKey(candidate);
  for (const facing of ['south', 'east'] as const) {
    captures.foundation.set(`${key}/body/${facing}`, bodyOnly(candidate, facing));
    captures.foundation.set(
      `${key}/neutral/${facing}`,
      render(candidate, facing, 'neutral'),
    );
    captures.foundation.set(
      `${key}/walk/${facing}`,
      render(candidate, facing, 'walk-approach'),
    );
  }

  for (const pose of POSES) {
    for (const facing of FACINGS) {
      captures.poses.set(
        `${key}/${pose}/${facing}`,
        render(candidate, facing, pose, {
          black: true,
          head: 'head-round',
          hair: 'hair-none',
          outfit: NO_PART,
          accessories: [],
          pixelSize: 40,
        }),
      );
    }
  }

  for (const outfit of VISUAL_GARMENTS) {
    for (const facing of ['south', 'east'] as const) {
      captures.garments.set(
        `${key}/${outfit}/${facing}`,
        render(candidate, facing, 'neutral', {
          outfit,
          head: 'head-round',
          hair: 'hair-none',
        }),
      );
    }
  }

  const stress = STRESS_RECIPES.find((entry) => entry.body === candidate.label);
  if (!stress) throw new Error(`Missing stress recipe for ${candidate.label}`);
  for (const pose of ['neutral', stress.pose] as const) {
    for (const facing of ['south', 'east'] as const) {
      captures.stress.set(
        `${key}/${pose}/${facing}`,
        render(candidate, facing, pose, {
          outfit: stress.outfit,
          head: 'head-soft-square',
          hair: stress.hair,
          accessories: stress.accessories,
        }),
      );
    }
  }
}

function auditMatrices(
  candidate: BodyCandidate,
  hardFailures: Finding[],
): { outfitRenderCount: number; heldAccessoryRenderCount: number } {
  let outfitRenderCount = 0;
  let heldAccessoryRenderCount = 0;
  const key = candidateKey(candidate);

  for (const preset of DEFAULT_STYLE_PRESETS) {
    const outfitCells: RenderCell[] = [];
    for (const outfit of GARMENTS) {
      for (const pose of POSES) {
        for (const facing of FACINGS) {
          const label = `${preset.id}/${key}/${outfit}/${pose}/${facing}`;
          const first = render(candidate, facing, pose, {
            style: preset.style,
            outfit,
            head: 'head-round',
            hair: 'hair-none',
            accessories: ['acc-lanyard', 'acc-watch'],
            pixelSize: 64,
          });
          const second = render(candidate, facing, pose, {
            style: preset.style,
            outfit,
            head: 'head-round',
            hair: 'hair-none',
            accessories: ['acc-lanyard', 'acc-watch'],
            pixelSize: 64,
          });
          validateRender(label, first, second, hardFailures);
          outfitCells.push({ label, svg: first });
          outfitRenderCount++;
        }
      }
    }
    for (const label of clippedCells(outfitCells, 64, 30)) {
      const svg = outfitCells.find((cell) => cell.label === label)?.svg;
      finding(hardFailures, 'canvas-clip', label, 'outfit matrix paints the canvas edge', svg);
    }

    const handCells: RenderCell[] = [];
    for (const accessory of HAND_ACCESSORIES) {
      for (const pose of POSES) {
        for (const facing of FACINGS) {
          const label = `${preset.id}/${key}/${accessory}/${pose}/${facing}`;
          const first = render(candidate, facing, pose, {
            style: preset.style,
            outfit: 'outfit-tee',
            head: 'head-round',
            hair: 'hair-none',
            accessories: [accessory],
            pixelSize: 64,
          });
          const second = render(candidate, facing, pose, {
            style: preset.style,
            outfit: 'outfit-tee',
            head: 'head-round',
            hair: 'hair-none',
            accessories: [accessory],
            pixelSize: 64,
          });
          validateRender(label, first, second, hardFailures);
          handCells.push({ label, svg: first });
          heldAccessoryRenderCount++;
        }
      }
    }
    for (const label of clippedCells(handCells, 64, 24)) {
      const svg = handCells.find((cell) => cell.label === label)?.svg;
      finding(hardFailures, 'canvas-clip', label, 'hand-accessory matrix paints the canvas edge', svg);
    }
  }

  return { outfitRenderCount, heldAccessoryRenderCount };
}

function auditGarmentFit(candidate: BodyCandidate, adapterFindings: Finding[]): void {
  const key = candidateKey(candidate);
  const baseCells: RenderCell[] = [];
  const fittedCells: RenderCell[] = [];
  const fittedSvgs = new Map<string, string>();

  for (const outfit of FITTED_GARMENTS) {
    for (const facing of SOURCE_FACINGS) {
      const label = `${key}/${outfit}/${facing}`;
      const bare = render(candidate, facing, 'neutral', {
        style: FIT_STYLE,
        head: NO_PART,
        hair: NO_PART,
        outfit: NO_PART,
        accessories: [],
      });
      const dressed = render(candidate, facing, 'neutral', {
        style: FIT_STYLE,
        head: NO_PART,
        hair: NO_PART,
        outfit,
        accessories: [],
      });
      baseCells.push({ label, svg: bare });
      fittedCells.push({ label, svg: dressed });
      fittedSvgs.set(label, dressed);
    }
  }

  for (const result of outsidePaintCounts(baseCells, fittedCells, CANVAS, 9)) {
    if (result.count > 4) {
      finding(
        adapterFindings,
        'fitted-paint',
        result.label,
        `${result.count} strong pixels fall outside the candidate body`,
        fittedSvgs.get(result.label),
      );
    }
  }

  const dressBaseCells: RenderCell[] = [];
  const dressCells: RenderCell[] = [];
  const dressSvgs = new Map<string, string>();
  for (const facing of SOURCE_FACINGS) {
    const label = `${key}/outfit-dress/${facing}`;
    const bare = render(candidate, facing, 'neutral', {
      style: FIT_STYLE,
      head: NO_PART,
      hair: NO_PART,
      outfit: NO_PART,
      accessories: [],
    });
    const dressed = render(candidate, facing, 'neutral', {
      style: FIT_STYLE,
      head: NO_PART,
      hair: NO_PART,
      outfit: 'outfit-dress',
      accessories: [],
    });
    dressBaseCells.push({ label, svg: bare });
    dressCells.push({ label, svg: dressed });
    dressSvgs.set(label, dressed);
  }
  for (const result of outsidePaintCounts(dressBaseCells, dressCells, CANVAS, 3)) {
    if (result.count < 20) {
      finding(
        adapterFindings,
        'dress-expansion',
        result.label,
        `dress adds only ${result.count} strong silhouette pixels`,
        dressSvgs.get(result.label),
      );
    }
  }
}

function silhouetteComparisons(captures: Captures): {
  comparisons: SilhouetteComparison[];
  collapses: Finding[];
} {
  const comparisons: SilhouetteComparison[] = [];
  const collapses: Finding[] = [];
  for (const pose of POSES) {
    for (const facing of SOURCE_FACINGS) {
      const masks = CANDIDATES.map((candidate) => {
        const key = `${candidateKey(candidate)}/${pose}/${facing}`;
        const svg = captures.poses.get(key);
        if (!svg) throw new Error(`Missing silhouette capture ${key}`);
        return { candidate, svg, mask: rasterMask(svg) };
      });
      for (let left = 0; left < masks.length; left++) {
        for (let right = left + 1; right < masks.length; right++) {
          const stats = silhouetteStats(masks[left].mask, masks[right].mask);
          const row: SilhouetteComparison = {
            pair: [masks[left].candidate.label, masks[right].candidate.label],
            pose,
            facing,
            iou: Number(stats.iou.toFixed(3)),
            differingPixels: stats.differingPixels,
          };
          comparisons.push(row);
          if (stats.differingPixels === 0) {
            collapses.push({
              kind: 'silhouette-collapse',
              label: `${row.pair.join(' / ')}/${pose}/${facing}`,
              detail: 'flat-black 40 px silhouettes are pixel-identical',
              svg: masks[left].svg,
            });
          }
        }
      }
    }
  }
  comparisons.sort((left, right) =>
    right.iou - left.iou || left.differingPixels - right.differingPixels);
  return { comparisons, collapses };
}

function required(map: ReadonlyMap<string, string>, key: string): string {
  const value = map.get(key);
  if (!value) throw new Error(`Missing proof capture ${key}`);
  return value;
}

function statBox(
  x: number,
  y: number,
  width: number,
  value: string,
  label: string,
  note: string,
  tone: 'green' | 'coral' | 'amber' = 'green',
): string {
  const fill = tone === 'green' ? COLORS.greenSoft : tone === 'coral' ? COLORS.coralSoft : COLORS.amberSoft;
  const ink = tone === 'green' ? COLORS.green : tone === 'coral' ? COLORS.coral : COLORS.amber;
  return (
    panel(x, y, width, 82, fill) +
    text(x + 18, y + 37, value, 25, 760, ink) +
    text(x + 18, y + 57, label, 11, 700, COLORS.ink) +
    text(x + 18, y + 72, note, 9, 500, COLORS.muted)
  );
}

function poseGrid(
  captures: Captures,
  facing: 'south' | 'east',
  top: number,
): string {
  const parts: string[] = [];
  const labelWidth = 190;
  const stride = 105;
  parts.push(text(30, top, `${facing === 'south' ? 'South' : 'East'} pose census · literal 40 px flat-black`, 17, 760));
  POSES.forEach((pose, index) => {
    const x = labelWidth + index * stride + 48;
    parts.push(text(x, top + 25, POSE_SHORT[pose], 9, 650, COLORS.muted, 'middle'));
  });
  CANDIDATES.forEach((candidate, row) => {
    const y = top + 40 + row * 66;
    parts.push(`<rect x="20" y="${y - 4}" width="1838" height="60" rx="7" fill="${row % 2 === 0 ? COLORS.panel : COLORS.panelAlt}"/>`);
    parts.push(text(38, y + 22, candidate.label, 14, 720));
    parts.push(text(38, y + 39, candidate.carrier, 9, 500, COLORS.muted));
    POSES.forEach((pose, column) => {
      const x = labelWidth + column * stride + 28;
      parts.push(placedSvg(
        required(captures.poses, `${candidateKey(candidate)}/${pose}/${facing}`),
        x,
        y + 5,
        40,
      ));
    });
  });
  return parts.join('');
}

function compatibilitySheet(report: AuditReport, captures: Captures): string {
  const width = 1880;
  const height = 1780;
  const parts: string[] = [`<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`];
  parts.push(text(30, 40, 'Six-body production-compatibility gate · v3', 25, 760));
  parts.push(text(
    30,
    68,
    'REVIEW ONLY · production compositor · process-local body swaps · exact production references restored',
    12,
    680,
    COLORS.coral,
  ));

  const hardTone = report.hardFailures.length === 0 ? 'green' : 'coral';
  parts.push(statBox(30, 88, 285, '6', 'body foundations', 'Column · Block · Wedge · Barrel · Bell · Pinch'));
  parts.push(statBox(330, 88, 285, '360', 'pose / facing states', '15 poses × 4 facings × 6 bodies'));
  parts.push(statBox(
    630,
    88,
    285,
    report.coverage.outfitRenderCount.toLocaleString(),
    'garment renders',
    '12 builders × poses × facings × 3 styles',
  ));
  parts.push(statBox(
    930,
    88,
    285,
    report.coverage.heldAccessoryRenderCount.toLocaleString(),
    'hand-accessory renders',
    '5 accessories × poses × facings × 3 styles',
  ));
  parts.push(statBox(
    1230,
    88,
    285,
    String(report.hardFailures.length),
    'renderer / rig failures',
    report.hardFailures.length === 0 ? 'no invalid, clipped, unstable, or collapsed cells' : 'inspect the failure sheet',
    hardTone,
  ));
  parts.push(statBox(1530, 88, 320, '0', 'new animation frames', 'all arms remain generated from body anchors'));

  parts.push(text(30, 205, 'Foundation strip', 18, 760));
  parts.push(text(
    30,
    226,
    'body-only 40 px · neutral 48 px · walk 40 px · same round head · no hair',
    10,
    520,
    COLORS.muted,
  ));

  CANDIDATES.forEach((candidate, index) => {
    const x = 30 + index * 304;
    const key = candidateKey(candidate);
    parts.push(panel(x, 245, 286, 178, index % 2 === 0 ? COLORS.panel : COLORS.panelAlt));
    parts.push(text(x + 143, 272, candidate.label, 16, 760, COLORS.ink, 'middle'));
    parts.push(text(x + 143, 290, `proof carrier · ${candidate.carrier}`, 9, 520, COLORS.muted, 'middle'));
    parts.push(text(x + 48, 313, 'body', 9, 650, COLORS.muted, 'middle'));
    parts.push(text(x + 143, 313, 'neutral', 9, 650, COLORS.muted, 'middle'));
    parts.push(text(x + 238, 313, 'walk', 9, 650, COLORS.muted, 'middle'));
    for (const [facing, offset] of [['south', 0], ['east', 50]] as const) {
      const y = 325 + offset;
      parts.push(text(x + 12, y + 25, facing === 'south' ? 'S' : 'E', 9, 700, COLORS.muted));
      parts.push(placedSvg(required(captures.foundation, `${key}/body/${facing}`), x + 28, y + 5, 40));
      parts.push(placedSvg(required(captures.foundation, `${key}/neutral/${facing}`), x + 115, y + 1, 48));
      parts.push(placedSvg(required(captures.foundation, `${key}/walk/${facing}`), x + 218, y + 5, 40));
    }
  });

  parts.push(poseGrid(captures, 'south', 465));
  parts.push(poseGrid(captures, 'east', 930));

  parts.push(text(30, 1395, 'Rear and mirror turn · walk-approach · literal 48 px', 17, 760));
  CANDIDATES.forEach((candidate, index) => {
    const x = 30 + index * 304;
    const key = candidateKey(candidate);
    parts.push(panel(x, 1418, 286, 160, index % 2 === 0 ? COLORS.panel : COLORS.panelAlt));
    parts.push(text(x + 143, 1443, candidate.label, 13, 720, COLORS.ink, 'middle'));
    parts.push(text(x + 75, 1462, 'north', 9, 650, COLORS.muted, 'middle'));
    parts.push(text(x + 211, 1462, 'west = mirror east', 9, 650, COLORS.muted, 'middle'));
    parts.push(placedSvg(required(captures.poses, `${key}/walk-approach/north`), x + 51, 1472, 48));
    parts.push(placedSvg(required(captures.poses, `${key}/walk-approach/west`), x + 187, 1472, 48));
  });

  parts.push(panel(30, 1600, 1820, 132, COLORS.greenSoft));
  parts.push(text(50, 1633, 'Mechanical result', 15, 760, COLORS.green));
  parts.push(text(
    50,
    1660,
    report.hardFailures.length === 0
      ? `All ${report.coverage.totalAuditedRenders.toLocaleString()} compositor renders are deterministic, token-clean, and canvas-safe; all 360 pose states publish valid wrists and carry policy.`
      : `${report.hardFailures.length} renderer or rig findings require review before promotion.`,
    11,
    600,
    COLORS.ink,
  ));
  parts.push(text(
    50,
    1684,
    `Closest 40 px state: ${report.silhouette.closest[0]?.pair.join(' / ') ?? 'n/a'} · ${report.silhouette.closest[0]?.pose ?? 'n/a'} · ${report.silhouette.closest[0]?.facing ?? 'n/a'} · IoU ${report.silhouette.maximumIou.toFixed(3)} · no score substitutes for visual review.`,
    10,
    520,
    COLORS.muted,
  ));
  parts.push(text(
    50,
    1708,
    'Pinch still uses body-soft as a proof carrier; a true sixth-ID dispatch and regenerated authored detail variants remain promotion work.',
    10,
    680,
    COLORS.coral,
  ));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function findingSummary(
  findings: Finding[],
  x: number,
  y: number,
  width: number,
  limit = 7,
): string {
  const parts: string[] = [];
  if (findings.length === 0) {
    parts.push(text(x, y, 'none', 12, 700, COLORS.green));
    return parts.join('');
  }
  findings.slice(0, limit).forEach((entry, index) => {
    const rowY = y + index * 25;
    parts.push(text(x, rowY, `${entry.kind} · ${entry.label}`, 10, 700, COLORS.ink));
    parts.push(text(x + width, rowY, entry.detail, 9, 500, COLORS.muted, 'end'));
  });
  if (findings.length > limit) {
    parts.push(text(x, y + limit * 25, `+ ${findings.length - limit} more in metrics JSON`, 9, 650, COLORS.coral));
  }
  return parts.join('');
}

function garmentFailureSheet(report: AuditReport, captures: Captures): string {
  const width = 1880;
  const height = 1980;
  const parts: string[] = [`<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`];
  parts.push(text(30, 40, 'Six-body garment stress and failure review · v3', 25, 760));
  parts.push(text(
    30,
    68,
    'REVIEW ONLY · literal 48/40 px cells · automated findings separate renderer failures from adapter debt',
    12,
    680,
    COLORS.coral,
  ));

  parts.push(statBox(
    30,
    88,
    330,
    String(report.hardFailures.length),
    'renderer / rig failures',
    report.hardFailures.length === 0 ? 'mechanically clean' : 'must resolve before promotion',
    report.hardFailures.length === 0 ? 'green' : 'coral',
  ));
  parts.push(statBox(
    380,
    88,
    330,
    String(report.adapterFindings.length),
    'fitted-detail findings',
    'strong paint beyond candidate hull or weak dress expansion',
    report.adapterFindings.length === 0 ? 'green' : 'amber',
  ));
  parts.push(statBox(
    730,
    88,
    330,
    String(report.integrationGaps.length),
    'promotion-only gaps',
    'registry / body-ID dispatch intentionally untouched',
    'amber',
  ));
  parts.push(statBox(
    1080,
    88,
    330,
    String(report.silhouette.exactCollapses),
    'exact 40 px collapses',
    `${report.silhouette.comparedStates.toLocaleString()} pairwise pose / facing comparisons`,
    report.silhouette.exactCollapses === 0 ? 'green' : 'coral',
  ));
  parts.push(statBox(
    1430,
    88,
    420,
    report.silhouette.maximumIou.toFixed(3),
    'closest silhouette overlap',
    'watchlist only · composed pixels remain authoritative',
    'amber',
  ));

  parts.push(text(30, 205, 'Garment anchor matrix · neutral · south/east pair at literal 48 px', 18, 760));
  CANDIDATES.forEach((candidate, index) => {
    const x = 240 + index * 268;
    parts.push(text(x + 96, 229, candidate.label, 13, 740, COLORS.ink, 'middle'));
    parts.push(text(x + 96, 245, candidate.carrier, 9, 500, COLORS.muted, 'middle'));
  });
  VISUAL_GARMENTS.forEach((outfit, row) => {
    const y = 258 + row * 112;
    parts.push(`<rect x="20" y="${y}" width="1840" height="104" rx="8" fill="${row % 2 === 0 ? COLORS.panel : COLORS.panelAlt}"/>`);
    parts.push(text(38, y + 39, getPart(outfit)?.label ?? outfit, 13, 720));
    parts.push(text(
      38,
      y + 60,
      outfit === 'outfit-dress'
        ? 'silhouette-changing'
        : outfit === 'outfit-tee'
          ? 'authored body-detail overlay'
          : 'anchor-built fitted detail',
      9,
      520,
      COLORS.muted,
    ));
    CANDIDATES.forEach((candidate, column) => {
      const x = 240 + column * 268;
      const key = candidateKey(candidate);
      parts.push(placedSvg(required(captures.garments, `${key}/${outfit}/south`), x + 28, y + 30, 48));
      parts.push(placedSvg(required(captures.garments, `${key}/${outfit}/east`), x + 112, y + 30, 48));
      parts.push(text(x + 52, y + 23, 'S', 8, 700, COLORS.muted, 'middle'));
      parts.push(text(x + 136, y + 23, 'E', 8, 700, COLORS.muted, 'middle'));
    });
  });

  const stressTop = 960;
  parts.push(text(30, stressTop, 'Representative collision cards', 18, 760));
  parts.push(text(
    30,
    stressTop + 21,
    'neutral 48 px + risky pose 40 px · production hair/accessories · one bulky held prop after normalization',
    10,
    520,
    COLORS.muted,
  ));
  STRESS_RECIPES.forEach((stress, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const x = 30 + column * 610;
    const y = stressTop + 42 + row * 214;
    const candidate = CANDIDATES.find((entry) => entry.label === stress.body);
    if (!candidate) throw new Error(`Missing stress candidate ${stress.body}`);
    const key = candidateKey(candidate);
    parts.push(panel(x, y, 590, 194, row % 2 === 0 ? COLORS.panel : COLORS.panelAlt));
    parts.push(text(x + 18, y + 29, stress.body, 15, 760));
    parts.push(text(x + 18, y + 48, stress.note, 9, 540, COLORS.muted));
    parts.push(text(x + 18, y + 68, `${getPart(stress.outfit)?.label ?? stress.outfit} · ${stress.pose}`, 9, 680, COLORS.green));
    const placements = [
      ['neutral', 'south', 48, 250, 22],
      ['neutral', 'east', 48, 318, 22],
      [stress.pose, 'south', 40, 406, 26],
      [stress.pose, 'east', 40, 468, 26],
    ] as const;
    placements.forEach(([pose, facing, size, dx, dy]) => {
      parts.push(placedSvg(required(captures.stress, `${key}/${pose}/${facing}`), x + dx, y + dy, size));
    });
    parts.push(text(x + 274, y + 92, 'neutral S/E', 8, 650, COLORS.muted, 'middle'));
    parts.push(text(x + 457, y + 92, `${POSE_SHORT[stress.pose]} S/E`, 8, 650, COLORS.muted, 'middle'));
    parts.push(text(x + 18, y + 116, stress.hair, 9, 500, COLORS.muted));
    parts.push(text(x + 18, y + 134, stress.accessories.join(' · '), 9, 500, COLORS.muted));
    parts.push(text(
      x + 18,
      y + 165,
      stress.body === 'Pinch'
        ? 'watch the shoulder → waist → hip rhythm under arms'
        : 'inspect outline tangencies, detail survival, and attachment position',
      9,
      650,
      stress.body === 'Pinch' ? COLORS.coral : COLORS.ink,
    ));
  });

  const findingsTop = 1435;
  parts.push(panel(30, findingsTop, 890, 220, report.hardFailures.length === 0 ? COLORS.greenSoft : COLORS.coralSoft));
  parts.push(text(50, findingsTop + 30, 'Renderer / rig failures', 15, 760, report.hardFailures.length === 0 ? COLORS.green : COLORS.coral));
  parts.push(findingSummary(report.hardFailures, 50, findingsTop + 59, 840));

  parts.push(panel(940, findingsTop, 910, 220, report.adapterFindings.length === 0 ? COLORS.greenSoft : COLORS.amberSoft));
  parts.push(text(960, findingsTop + 30, 'Fitted-detail findings', 15, 760, report.adapterFindings.length === 0 ? COLORS.green : COLORS.amber));
  parts.push(findingSummary(report.adapterFindings, 960, findingsTop + 59, 860));

  parts.push(text(30, 1690, 'Closest 40 px silhouette states · review watchlist', 17, 760));
  report.silhouette.closest.slice(0, 5).forEach((comparison, index) => {
    const y = 1720 + index * 46;
    const left = CANDIDATES.find((candidate) => candidate.label === comparison.pair[0]);
    const right = CANDIDATES.find((candidate) => candidate.label === comparison.pair[1]);
    if (!left || !right) throw new Error(`Missing comparison bodies ${comparison.pair.join('/')}`);
    parts.push(`<rect x="20" y="${y - 5}" width="1840" height="42" rx="6" fill="${index % 2 === 0 ? COLORS.panel : COLORS.panelAlt}"/>`);
    parts.push(placedSvg(
      required(captures.poses, `${candidateKey(left)}/${comparison.pose}/${comparison.facing}`),
      42,
      y - 4,
      40,
    ));
    parts.push(placedSvg(
      required(captures.poses, `${candidateKey(right)}/${comparison.pose}/${comparison.facing}`),
      91,
      y - 4,
      40,
    ));
    parts.push(text(150, y + 20, comparison.pair.join(' / '), 11, 720));
    parts.push(text(430, y + 20, `${comparison.pose} · ${comparison.facing}`, 10, 600, COLORS.muted));
    parts.push(text(760, y + 20, `IoU ${comparison.iou.toFixed(3)}`, 10, 700, COLORS.amber));
    parts.push(text(900, y + 20, `${comparison.differingPixels} differing pixels`, 10, 600, COLORS.muted));
  });

  parts.push(text(
    30,
    1960,
    'A clean mechanical gate does not promote the bodies. Approve the composed pixels first; registry, authored tee variants, and the true Pinch dress profile remain explicit production work.',
    10,
    650,
    COLORS.coral,
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

function serializableFinding(entry: Finding): Omit<Finding, 'svg'> {
  const { svg: _svg, ...rest } = entry;
  return rest;
}

function main(): void {
  for (const id of [NO_PART]) {
    if (getPart(id)) throw new Error(`Proof sentinel unexpectedly resolves: ${id}`);
  }
  for (const id of [...GARMENTS, ...HAND_ACCESSORIES]) {
    if (!getPart(id)) throw new Error(`Compatibility part is missing: ${id}`);
  }

  const outDir = resolve(process.argv[2] ?? 'docs/previews');
  mkdirSync(outDir, { recursive: true });
  const captures: Captures = {
    foundation: new Map(),
    poses: new Map(),
    garments: new Map(),
    stress: new Map(),
  };
  const hardFailures: Finding[] = [];
  const adapterFindings: Finding[] = [];
  let outfitRenderCount = 0;
  let heldAccessoryRenderCount = 0;

  const sentinelRecipe: CharacterRecipe = {
    id: 'body-compatibility-restoration-sentinel',
    name: 'Restoration sentinel',
    parts: {
      body: 'body-balanced',
      head: 'head-round',
      hair: 'hair-side-part',
      outfit: 'outfit-blazer',
      accessories: ['acc-lanyard', 'acc-watch'],
    },
    palette: PALETTE,
  };
  const sentinelBefore = composeCharacter(
    sentinelRecipe,
    DISPLAY_STYLE,
    'west',
    CANVAS,
    'normal',
    { badge: false, pose: 'walk-approach' },
  );

  for (const candidate of CANDIDATES) {
    const snapshot = installSingleBodyCandidate(candidate);
    try {
      validateAnchors(candidate, hardFailures);
      validatePoseRig(candidate, hardFailures);
      captureVisuals(candidate, captures);
      const counts = auditMatrices(candidate, hardFailures);
      outfitRenderCount += counts.outfitRenderCount;
      heldAccessoryRenderCount += counts.heldAccessoryRenderCount;
      auditGarmentFit(candidate, adapterFindings);
    } finally {
      restoreSingleBodyCandidate(snapshot);
    }
  }

  const sentinelAfter = composeCharacter(
    sentinelRecipe,
    DISPLAY_STYLE,
    'west',
    CANVAS,
    'normal',
    { badge: false, pose: 'walk-approach' },
  );
  if (sentinelAfter !== sentinelBefore) {
    throw new Error('Process-local compatibility gate did not restore production output byte-for-byte');
  }

  const silhouette = silhouetteComparisons(captures);
  hardFailures.push(...silhouette.collapses);
  const integrationGaps: IntegrationGap[] = [
    {
      label: 'Pinch / true sixth body ID',
      detail:
        'Pinch uses body-soft only as a process-local carrier; registry, picker, randomizer, export, and body-ID dispatch are intentionally not exercised.',
    },
    {
      label: 'Pinch / Dress profile',
      detail:
        'The proof resolves Dress through the body-soft profile. A body-pinch profile must be authored and reviewed during promotion.',
    },
  ];

  const comparedStates = POSES.length * SOURCE_FACINGS.length * ((CANDIDATES.length * (CANDIDATES.length - 1)) / 2);
  const totalAuditedRenders = outfitRenderCount + heldAccessoryRenderCount;
  const report: AuditReport = {
    reviewOnly: true,
    productionCompositorRestored: true,
    candidates: CANDIDATES.map((candidate) => ({
      label: candidate.label,
      proofCarrier: candidate.carrier,
      construction: candidate.construction,
    })),
    coverage: {
      bodyCount: CANDIDATES.length,
      poseCount: POSES.length,
      authoredFacingCount: SOURCE_FACINGS.length,
      renderedFacingCount: FACINGS.length,
      standardGarmentCount: STANDARD_GARMENTS.length,
      specialGarmentCount: SPECIAL_GARMENTS.length,
      stylePresetCount: DEFAULT_STYLE_PRESETS.length,
      outfitRenderCount,
      heldAccessoryRenderCount,
      totalAuditedRenders,
    },
    hardFailures: hardFailures.map(serializableFinding),
    adapterFindings: adapterFindings.map(serializableFinding),
    integrationGaps,
    silhouette: {
      comparedStates,
      exactCollapses: silhouette.collapses.length,
      maximumIou: silhouette.comparisons[0]?.iou ?? 0,
      closest: silhouette.comparisons.slice(0, 20),
    },
  };

  const compatibility = compatibilitySheet(report, captures);
  const garmentFailures = garmentFailureSheet(report, captures);
  writeSvgAndPng(outDir, 'character-body-compatibility-v3', compatibility);
  writeSvgAndPng(outDir, 'character-body-garment-failures-v3', garmentFailures);
  writeFileSync(
    join(outDir, 'character-body-compatibility-v3-metrics.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  );

  console.log(
    `audited ${totalAuditedRenders.toLocaleString()} process-local compositor renders ` +
    `(${outfitRenderCount.toLocaleString()} garment + ${heldAccessoryRenderCount.toLocaleString()} hand accessory)`,
  );
  console.log(
    `hard failures ${hardFailures.length} · fitted-detail findings ${adapterFindings.length} · ` +
    `exact 40 px collapses ${silhouette.collapses.length}`,
  );
  console.log(
    `closest 40 px state: ${silhouette.comparisons[0]?.pair.join(' / ') ?? 'n/a'} · ` +
    `${silhouette.comparisons[0]?.pose ?? 'n/a'} · ${silhouette.comparisons[0]?.facing ?? 'n/a'} · ` +
    `IoU ${(silhouette.comparisons[0]?.iou ?? 0).toFixed(3)}`,
  );
  console.log('production compositor restoration: byte-identical');
  console.log(`wrote review-only compatibility proofs to ${outDir}`);
}

main();
