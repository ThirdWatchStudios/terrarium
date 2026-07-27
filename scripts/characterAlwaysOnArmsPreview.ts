/**
 * Review-only always-on-arms proof.
 *
 *   npx tsx scripts/characterAlwaysOnArmsPreview.ts [outDir]
 *
 * The proposed default is the existing generated `neutral` pose. This script
 * passes it explicitly whenever a character would otherwise be unposed, so the
 * model can be reviewed without changing production compositor semantics.
 * Candidate bodies are installed one at a time and restored in `finally`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';

import { composeCharacter } from '../src/core/compositor';
import { circle } from '../src/core/geometry';
import type {
  BodyAnchorPoint,
  BodyFacingAnchors,
  CharacterRecipe,
  Facing,
  StyleSheet,
} from '../src/core/types';
import { DEFAULT_STYLE, DEFAULT_STYLE_PRESETS } from '../src/data/defaults';
import { getPart } from '../src/parts/library';
import { POSE_DEFS } from '../src/parts/poses';
import type { Pose, PoseDef, PoseVariant } from '../src/parts/poses';
import {
  BODIES,
  PINCH,
  installSingleBodyCandidate,
  restoreSingleBodyCandidate,
  type BodyCandidate,
} from './characterPawnPlusPreview';

type ReviewFacing = Facing | 'west';

interface ArmContribution {
  body: string;
  facing: ReviewFacing;
  pixelSize: 40 | 48;
  currentPixels: number;
  alwaysOnPixels: number;
  addedPixels: number;
  removedPixels: number;
  iou: number;
}

interface SilhouetteComparison {
  pair: [string, string];
  facing: ReviewFacing;
  armlessIou: number;
  iou: number;
  collapseDelta: number;
  differingPixels: number;
}

interface Finding {
  label: string;
  detail: string;
}

interface ProofReport {
  reviewOnly: true;
  proposedRule: string;
  productionCompositorRestored: boolean;
  coverage: {
    bodyCount: number;
    facingCount: number;
    armContributionChecks: number;
    stressRenderCount: number;
    crowdCharacterCount: number;
    newAnimationFrames: 0;
  };
  armContribution: {
    allChecksAddVisiblePixels: boolean;
    visibleChecks: number;
    profileOccludedChecks: number;
    minimumAddedPixels40: number;
    minimumAddedPixels48: number;
    findings: Finding[];
    checks: ArmContribution[];
  };
  silhouette: {
    comparisonCount: number;
    exactCollapses: number;
    highSimilarityThreshold: number;
    highSimilarityFindings: Finding[];
    maximumIou: number;
    maximumCollapseDelta: number;
    closest: SilhouetteComparison[];
  };
  stress: {
    minimumCanvasMargin40: number;
    failures: Finding[];
  };
  promotionGaps: string[];
}

interface Captures {
  current: Map<string, string>;
  always: Map<string, string>;
  walk: Map<string, string>;
  poses: Map<string, string>;
  stress: Map<string, string>;
  props: Map<string, string>;
  crowd: Map<number, string>;
}

interface RevisionCaptures {
  grid: Map<string, string>;
  stress: Map<string, string>;
  props: Map<string, string>;
  crowd: Map<string, string>;
}

interface RevisionPairMetric {
  revision: NeutralRevision;
  pixelSize: 40 | 48;
  iou: number;
  differingPixels: number;
}

interface ArmModelCheck {
  body: string;
  facing: Facing;
  expectedSleevePaths: number;
  sleevePaths: number;
  expectedHands: number;
  hands: number;
  hasHandLeft: boolean;
  hasHandRight: boolean;
  carryHand: 'left' | 'right' | 'none' | null;
  pathsValid: boolean;
  compositorIncludesAllPaths: boolean;
  passed: boolean;
}

interface RevisionProofReport {
  reviewOnly: true;
  acceptedRule: string;
  selectedRevision: NeutralRevision;
  rejectedRevision: {
    id: NeutralRevision;
    reason: string;
  };
  productionNeutralRestored: boolean;
  proofPoseRemoved: boolean;
  coverage: {
    bodyCount: number;
    facingCount: number;
    revisionCount: number;
    authoredArmModelChecks: number;
    productionParityChecks: number;
    profileSilhouetteChecks: number;
    stressRenderCount: number;
    crowdCharacterCount: number;
    newAnimationFrames: 0;
  };
  armModelPresence: {
    allChecksPass: boolean;
    checks: ArmModelCheck[];
    findings: Finding[];
  };
  profileOcclusion: {
    allowed: true;
    allChecksOccluded: boolean;
    occludedChecks: number;
    checks: ArmContribution[];
  };
  bellPinch: {
    diagnosticOnly: true;
    comparisons: RevisionPairMetric[];
  };
  selectedSilhouettes: {
    comparisonCount: number;
    exactCollapses: number;
    maximumIou: number;
    closest: SilhouetteComparison[];
  };
  stress: {
    minimumCanvasMargin40: number;
    failures: Finding[];
  };
  deferredProductionGates: string[];
}

interface StressRecipe {
  body: string;
  outfit: string;
  hair: string;
  accessories: string[];
  riskPose: Pose;
  note: string;
}

interface CrowdEntry {
  body: string;
  facing: ReviewFacing;
  pose: Pose;
  outfit: string;
  hair: string;
  accessories: string[];
  palette: number;
  cold?: boolean;
}

const CANVAS = 128;
const NO_PART = '__always-on-arms-proof-none__';
const CANDIDATES: BodyCandidate[] = [...BODIES, PINCH];
const FACINGS: ReviewFacing[] = ['south', 'east', 'north', 'west'];
const REPRESENTATIVE_POSES: Pose[] = [
  'neutral',
  'walk-approach',
  'hands-on-hips',
  'console',
  'celebrate',
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
  greenMid: '#6F9386',
  greenSoft: '#E4ECE5',
  coral: '#B75E4B',
  coralSoft: '#F2E1DD',
  amber: '#9A6A24',
  amberSoft: '#F2E9D5',
  floor: '#B7AF9A',
  floorDark: '#9F9784',
} as const;

const PALETTES = [
  {
    skin: '#C68B62',
    hair: '#38271F',
    outfitPrimary: COLORS.greenMid,
    outfitSecondary: COLORS.cream,
    accent: COLORS.coral,
  },
  {
    skin: '#8D5A3B',
    hair: '#1F1A17',
    outfitPrimary: '#3D5A80',
    outfitSecondary: '#E8E4D8',
    accent: '#A32D2D',
  },
  {
    skin: '#E8B88A',
    hair: '#6E4A2A',
    outfitPrimary: '#5F5E5A',
    outfitSecondary: '#DCE6EC',
    accent: '#185FA5',
  },
  {
    skin: '#D9A06B',
    hair: '#8A8A8A',
    outfitPrimary: '#476579',
    outfitSecondary: '#CBD6E0',
    accent: '#DA7C4B',
  },
] as const;

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

const COLD_STYLE: StyleSheet = {
  ...structuredClone(DEFAULT_STYLE_PRESETS[1].style),
  render: { ...DEFAULT_STYLE_PRESETS[1].style.render, contactShadow: 0 },
};

const BLACK_STYLE: StyleSheet = {
  ...structuredClone(DEFAULT_STYLE),
  outline: { ...DEFAULT_STYLE.outline, width: 0, color: COLORS.ink },
  render: { ...DEFAULT_STYLE.render, contactShadow: 0 },
};

const STRESS_RECIPES: StressRecipe[] = [
  {
    body: 'Column',
    outfit: 'outfit-hoodie',
    hair: 'hair-bun',
    accessories: ['acc-paper-stack'],
    riskPose: 'walk-approach',
    note: 'narrow torso · tall crown · paper stack',
  },
  {
    body: 'Block',
    outfit: 'outfit-service-apron',
    hair: 'hair-coils',
    accessories: ['acc-hairnet', 'acc-clipboard'],
    riskPose: 'slump',
    note: 'compact stack · apron · hairnet · clipboard',
  },
  {
    body: 'Wedge',
    outfit: 'outfit-hi-vis',
    hair: 'hair-short',
    accessories: ['acc-coffee-tray', 'acc-watch'],
    riskPose: 'walk-approach',
    note: 'broad shoulders · reflective bands · tray',
  },
  {
    body: 'Barrel',
    outfit: 'outfit-cardigan',
    hair: 'hair-side-part',
    accessories: ['acc-lanyard', 'acc-mug'],
    riskPose: 'walk-approach',
    note: 'full middle · center detail · mug',
  },
  {
    body: 'Bell',
    outfit: 'outfit-dress',
    hair: 'hair-ponytail',
    accessories: ['acc-watch'],
    riskPose: 'hands-on-hips',
    note: 'lower flare · dress edge · wrist',
  },
  {
    body: 'Pinch',
    outfit: 'outfit-suit-jacket',
    hair: 'hair-bun',
    accessories: ['acc-lanyard', 'acc-clipboard', 'acc-watch'],
    riskPose: 'hands-on-hips',
    note: 'waist rhythm · lapels · clipboard · wrist',
  },
];

const CROWD: CrowdEntry[] = [
  { body: 'Column', facing: 'south', pose: 'neutral', outfit: 'outfit-hoodie', hair: 'hair-short', accessories: [], palette: 0 },
  { body: 'Column', facing: 'east', pose: 'walk-approach', outfit: 'outfit-hoodie', hair: 'hair-bun', accessories: ['acc-paper-stack'], palette: 1 },
  { body: 'Block', facing: 'north', pose: 'neutral', outfit: 'outfit-service-apron', hair: 'hair-coils', accessories: ['acc-hairnet'], palette: 2 },
  { body: 'Block', facing: 'west', pose: 'slump', outfit: 'outfit-service-apron', hair: 'hair-bob', accessories: ['acc-clipboard'], palette: 3, cold: true },
  { body: 'Wedge', facing: 'east', pose: 'neutral', outfit: 'outfit-hi-vis', hair: 'hair-short', accessories: ['acc-watch'], palette: 0 },
  { body: 'Wedge', facing: 'south', pose: 'walk-approach', outfit: 'outfit-hi-vis', hair: 'hair-pixie', accessories: ['acc-coffee-tray'], palette: 1 },
  { body: 'Barrel', facing: 'west', pose: 'neutral', outfit: 'outfit-cardigan', hair: 'hair-side-part', accessories: ['acc-lanyard', 'acc-mug'], palette: 2 },
  { body: 'Barrel', facing: 'north', pose: 'glance-back', outfit: 'outfit-cardigan', hair: 'hair-bob', accessories: [], palette: 3, cold: true },
  { body: 'Bell', facing: 'south', pose: 'neutral', outfit: 'outfit-dress', hair: 'hair-ponytail', accessories: ['acc-watch'], palette: 0 },
  { body: 'Bell', facing: 'east', pose: 'walk-away', outfit: 'outfit-dress', hair: 'hair-bun', accessories: [], palette: 1 },
  { body: 'Pinch', facing: 'north', pose: 'neutral', outfit: 'outfit-suit-jacket', hair: 'hair-coils', accessories: ['acc-lanyard'], palette: 2 },
  { body: 'Pinch', facing: 'west', pose: 'hands-on-hips', outfit: 'outfit-suit-jacket', hair: 'hair-bun', accessories: [], palette: 3, cold: true },
];

export type NeutralRevision = 'current' | 'tucked-cuff' | 'outboard-hang';

export const NEUTRAL_REVISIONS: Array<{
  id: NeutralRevision;
  label: string;
  note: string;
}> = [
  { id: 'current', label: 'Close hanging', note: 'selected · relaxed fallback · profile occlusion allowed' },
  { id: 'tucked-cuff', label: 'Tucked cuff', note: 'not selected · reads like an active held pose' },
  { id: 'outboard-hang', label: 'Outboard hang', note: 'rejected · one-sided profile reads as a missing arm' },
];

export const SELECTED_NEUTRAL_REVISION: NeutralRevision = 'current';
const PROOF_NEUTRAL_POSE = '__proof-neutral-v3-3__' as Pose;

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
    palette?: number;
    black?: boolean;
  } = {},
): CharacterRecipe {
  return {
    id: `always-on-arms-${candidateKey(candidate)}`,
    name: candidate.label,
    parts: {
      body: candidate.carrier,
      head: options.head ?? 'head-round',
      hair: options.hair ?? 'hair-none',
      outfit: options.outfit ?? NO_PART,
      accessories: options.accessories ?? [],
    },
    palette: options.black ? BLACK_PALETTE : PALETTES[options.palette ?? 0],
  };
}

function render(
  candidate: BodyCandidate,
  facing: ReviewFacing,
  options: {
    pose?: Pose;
    style?: StyleSheet;
    head?: string;
    hair?: string;
    outfit?: string;
    accessories?: string[];
    palette?: number;
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
    {
      badge: false,
      ...(options.pose ? { pose: options.pose } : {}),
    },
  );
}

const proofArm = (d: string, strokeWidth: number): PoseVariant['front'][number] => ({
  d,
  stroke: '$outfitPrimary',
  strokeWidth,
});

const proofHand = (
  point: BodyAnchorPoint,
  radius: number,
): PoseVariant['front'][number] => ({
  d: circle(point.x, point.y, radius),
  fill: '$skin',
});

function quadraticArm(
  start: BodyAnchorPoint,
  control: BodyAnchorPoint,
  end: BodyAnchorPoint,
): string {
  return `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`;
}

function revisedNeutralVariant(
  facing: Facing,
  body: BodyFacingAnchors,
  revision: NeutralRevision,
): PoseVariant {
  const isProfile = facing === 'east';
  const leftStart = body.shoulders.left;
  const rightStart = body.shoulders.right;

  if (revision === 'current') {
    if (isProfile) {
      const handRight = { x: rightStart.x + 3, y: body.hip.y };
      const end = { x: handRight.x, y: handRight.y - 3 };
      return {
        front: [
          proofArm(
            quadraticArm(
              rightStart,
              { x: rightStart.x + 4, y: (rightStart.y + end.y) / 2 },
              end,
            ),
            11,
          ),
          proofHand(handRight, 4.5),
        ],
        attachments: { handRight, carryHand: 'right' },
      };
    }
    const handLeft = { x: leftStart.x - 3, y: body.hip.y };
    const handRight = { x: rightStart.x + 3, y: body.hip.y };
    const leftEnd = { x: handLeft.x, y: handLeft.y - 3 };
    const rightEnd = { x: handRight.x, y: handRight.y - 3 };
    return {
      front: [
        proofArm(
          quadraticArm(
            leftStart,
            { x: leftEnd.x - 2, y: (leftStart.y + leftEnd.y) / 2 },
            leftEnd,
          ),
          11,
        ),
        proofHand(handLeft, 4.5),
        proofArm(
          quadraticArm(
            rightStart,
            { x: rightEnd.x + 2, y: (rightStart.y + rightEnd.y) / 2 },
            rightEnd,
          ),
          11,
        ),
        proofHand(handRight, 4.5),
      ],
      attachments: { handLeft, handRight, carryHand: 'right' },
    };
  }

  if (revision === 'tucked-cuff') {
    const compactOffset = body.hip.y < 13 ? 1 : 0;
    const handY = body.chest.y + compactOffset;
    if (isProfile) {
      const handRight = {
        x: Math.max(
          rightStart.x + 18 + compactOffset,
          body.waist.right.x + 7,
        ),
        y: handY,
      };
      const control = {
        x: handRight.x + 4,
        y: (rightStart.y + handRight.y) / 2 - 1.5,
      };
      return {
        front: [
          proofArm(quadraticArm(rightStart, control, handRight), 8),
          proofHand(handRight, 3.5),
        ],
        attachments: { handRight, carryHand: 'right' },
      };
    }
    const outward = 6 + compactOffset;
    const handLeft = { x: leftStart.x - outward, y: handY };
    const handRight = { x: rightStart.x + outward, y: handY };
    return {
      front: [
        proofArm(
          quadraticArm(
            leftStart,
            { x: handLeft.x - 4, y: (leftStart.y + handLeft.y) / 2 - 1.5 },
            handLeft,
          ),
          8,
        ),
        proofHand(handLeft, 3.5),
        proofArm(
          quadraticArm(
            rightStart,
            { x: handRight.x + 4, y: (rightStart.y + handRight.y) / 2 - 1.5 },
            handRight,
          ),
          8,
        ),
        proofHand(handRight, 3.5),
      ],
      attachments: { handLeft, handRight, carryHand: 'right' },
    };
  }

  if (isProfile) {
    const compactDrop = body.hip.y < 13 ? 3 : 0;
    const start = {
      x: Math.max(
        rightStart.x,
        body.waist.right.x - 6,
        body.hem.right.x - 5,
      ) + 3,
      y: rightStart.y,
    };
    const handRight = {
      x: start.x + 3,
      y: body.hip.y + compactDrop,
    };
    const end = { x: handRight.x, y: handRight.y - 3 };
    const control = {
      x: handRight.x + 3,
      y: (start.y + end.y) / 2,
    };
    return {
      front: [
        proofArm(quadraticArm(start, control, end), 11),
        proofHand(handRight, 4.5),
      ],
      attachments: { handRight, carryHand: 'right' },
    };
  }
  const shoulderMagnitude = Math.max(Math.abs(leftStart.x), Math.abs(rightStart.x));
  const waistMagnitude = Math.max(
    Math.abs(body.waist.left.x),
    Math.abs(body.waist.right.x),
  );
  const calculatedOutward = Math.max(
    3,
    Math.min(
      7,
      7 -
        Math.max(0, waistMagnitude - shoulderMagnitude) / 2 -
        Math.max(0, shoulderMagnitude - 25) / 2,
    ),
  );
  const compactShift = body.hip.y < 13 ? 4 : 0;
  const compactDrop = body.hip.y < 13 ? 3 : 0;
  const outward = compactShift > 0 ? 3 : calculatedOutward;
  const leftPoseStart = {
    x: leftStart.x - compactShift,
    y: leftStart.y,
  };
  const rightPoseStart = {
    x: rightStart.x + compactShift,
    y: rightStart.y,
  };
  const handLeft = {
    x: leftPoseStart.x - outward,
    y: body.hip.y + compactDrop,
  };
  const handRight = {
    x: rightPoseStart.x + outward,
    y: body.hip.y + compactDrop,
  };
  const leftEnd = { x: handLeft.x, y: handLeft.y - 3 };
  const rightEnd = { x: handRight.x, y: handRight.y - 3 };
  return {
    front: [
      proofArm(
        quadraticArm(
          leftPoseStart,
          {
            x: leftEnd.x - 2,
            y: (leftPoseStart.y + leftEnd.y) / 2,
          },
          leftEnd,
        ),
        11,
      ),
      proofHand(handLeft, 4.5),
      proofArm(
        quadraticArm(
          rightPoseStart,
          {
            x: rightEnd.x + 2,
            y: (rightPoseStart.y + rightEnd.y) / 2,
          },
          rightEnd,
        ),
        11,
      ),
      proofHand(handRight, 4.5),
    ],
    attachments: { handLeft, handRight, carryHand: 'right' },
  };
}

function withProofNeutralPose<T>(
  candidate: BodyCandidate,
  revision: NeutralRevision,
  action: () => T,
): T {
  const defs = POSE_DEFS as unknown as Record<string, PoseDef | undefined>;
  const existed = Object.prototype.hasOwnProperty.call(defs, PROOF_NEUTRAL_POSE);
  const previous = defs[PROOF_NEUTRAL_POSE];
  defs[PROOF_NEUTRAL_POSE] = {
    id: PROOF_NEUTRAL_POSE,
    label: `Proof neutral · ${revision}`,
    readsAs: 'review-only neutral arm geometry',
    presenceChannels: [],
    facings: {
      south: revisedNeutralVariant('south', candidate.anchors.south, revision),
      east: revisedNeutralVariant('east', candidate.anchors.east, revision),
      north: revisedNeutralVariant('north', candidate.anchors.north, revision),
    },
  };
  try {
    return action();
  } finally {
    if (existed) defs[PROOF_NEUTRAL_POSE] = previous;
    else delete defs[PROOF_NEUTRAL_POSE];
  }
}

export function renderNeutralRevision(
  candidate: BodyCandidate,
  facing: ReviewFacing,
  revision: NeutralRevision,
  options: {
    style?: StyleSheet;
    head?: string;
    hair?: string;
    outfit?: string;
    accessories?: string[];
    palette?: number;
    black?: boolean;
    pixelSize?: number;
  } = {},
): string {
  return withProofNeutralPose(candidate, revision, () =>
    render(candidate, facing, {
      ...options,
      pose: PROOF_NEUTRAL_POSE,
    }),
  );
}

function currentDefault(candidate: BodyCandidate, facing: ReviewFacing, black = false, pixelSize = CANVAS): string {
  return render(candidate, facing, { black, pixelSize });
}

function alwaysOnDefault(candidate: BodyCandidate, facing: ReviewFacing, black = false, pixelSize = CANVAS): string {
  return render(candidate, facing, { pose: 'neutral', black, pixelSize });
}

function pngFor(svg: string): PNG {
  return PNG.sync.read(new Resvg(svg).render().asPng());
}

function alphaMask(svg: string): Uint8Array {
  const png = pngFor(svg);
  const mask = new Uint8Array(png.width * png.height);
  for (let index = 0; index < mask.length; index++) {
    mask[index] = png.data[index * 4 + 3] >= 128 ? 1 : 0;
  }
  return mask;
}

function compareMasks(left: Uint8Array, right: Uint8Array): {
  leftPixels: number;
  rightPixels: number;
  addedPixels: number;
  removedPixels: number;
  differingPixels: number;
  iou: number;
} {
  if (left.length !== right.length) throw new Error('Raster masks use different canvases');
  let leftPixels = 0;
  let rightPixels = 0;
  let addedPixels = 0;
  let removedPixels = 0;
  let differingPixels = 0;
  let intersection = 0;
  let union = 0;
  for (let index = 0; index < left.length; index++) {
    if (left[index]) leftPixels++;
    if (right[index]) rightPixels++;
    if (!left[index] && right[index]) addedPixels++;
    if (left[index] && !right[index]) removedPixels++;
    if (left[index] !== right[index]) differingPixels++;
    if (left[index] || right[index]) union++;
    if (left[index] && right[index]) intersection++;
  }
  return {
    leftPixels,
    rightPixels,
    addedPixels,
    removedPixels,
    differingPixels,
    iou: union === 0 ? 1 : intersection / union,
  };
}

function canvasMargin(svg: string): number {
  const png = pngFor(svg);
  let minX = png.width;
  let minY = png.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      if (png.data[(y * png.width + x) * 4 + 3] < 32) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < 0) return 0;
  return Math.min(minX, minY, png.width - 1 - maxX, png.height - 1 - maxY);
}

function captureCandidate(candidate: BodyCandidate, captures: Captures): void {
  const key = candidateKey(candidate);
  for (const facing of FACINGS) {
    captures.current.set(`${key}/${facing}/color`, currentDefault(candidate, facing));
    captures.current.set(`${key}/${facing}/black`, currentDefault(candidate, facing, true, 40));
    captures.always.set(`${key}/${facing}/color`, alwaysOnDefault(candidate, facing));
    captures.always.set(`${key}/${facing}/black`, alwaysOnDefault(candidate, facing, true, 40));
    captures.walk.set(
      `${key}/${facing}/color`,
      render(candidate, facing, { pose: 'walk-approach' }),
    );
    captures.walk.set(
      `${key}/${facing}/black`,
      render(candidate, facing, { pose: 'walk-approach', black: true, pixelSize: 40 }),
    );
  }

  for (const pose of REPRESENTATIVE_POSES) {
    for (const facing of ['south', 'east'] as const) {
      captures.poses.set(
        `${key}/${pose}/${facing}`,
        render(candidate, facing, { pose, black: true, pixelSize: 40 }),
      );
    }
  }

  const stress = STRESS_RECIPES.find((entry) => entry.body === candidate.label);
  if (!stress) throw new Error(`Missing stress recipe for ${candidate.label}`);
  for (const pose of ['neutral', stress.riskPose] as const) {
    for (const facing of FACINGS) {
      captures.stress.set(
        `${key}/${pose}/${facing}`,
        render(candidate, facing, {
          pose,
          outfit: stress.outfit,
          hair: stress.hair,
          head: 'head-soft-square',
          accessories: stress.accessories,
        }),
      );
    }
  }

  CROWD.forEach((entry, index) => {
    if (entry.body !== candidate.label) return;
    captures.crowd.set(
      index,
      render(candidate, entry.facing, {
        pose: entry.pose,
        style: entry.cold ? COLD_STYLE : DISPLAY_STYLE,
        outfit: entry.outfit,
        hair: entry.hair,
        head: 'head-soft-square',
        accessories: entry.accessories,
        palette: entry.palette,
      }),
    );
  });
}

function captureRevisionCandidate(
  candidate: BodyCandidate,
  captures: RevisionCaptures,
): void {
  const key = candidateKey(candidate);
  for (const revision of NEUTRAL_REVISIONS) {
    for (const facing of FACINGS) {
      for (const pixelSize of [40, 48] as const) {
        captures.grid.set(
          `${key}/${revision.id}/${facing}/${pixelSize}/color`,
          renderNeutralRevision(candidate, facing, revision.id, { pixelSize }),
        );
        captures.grid.set(
          `${key}/${revision.id}/${facing}/${pixelSize}/black`,
          renderNeutralRevision(candidate, facing, revision.id, {
            black: true,
            pixelSize,
          }),
        );
      }
    }
  }

  const stress = STRESS_RECIPES.find((entry) => entry.body === candidate.label);
  if (!stress) throw new Error(`Missing revision stress recipe for ${candidate.label}`);
  for (const facing of FACINGS) {
    captures.stress.set(
      `${key}/${facing}/color`,
      renderNeutralRevision(candidate, facing, SELECTED_NEUTRAL_REVISION, {
        outfit: stress.outfit,
        hair: stress.hair,
        head: 'head-soft-square',
        accessories: stress.accessories,
      }),
    );
    captures.stress.set(
      `${key}/${facing}/black`,
      renderNeutralRevision(candidate, facing, SELECTED_NEUTRAL_REVISION, {
        outfit: stress.outfit,
        hair: stress.hair,
        head: 'head-soft-square',
        accessories: stress.accessories,
        black: true,
        pixelSize: 40,
      }),
    );
  }

  const propExamples = [
    {
      body: 'Barrel',
      outfit: 'outfit-cardigan',
      hair: 'hair-side-part',
      accessories: ['acc-lanyard', 'acc-mug'],
    },
    {
      body: 'Block',
      outfit: 'outfit-service-apron',
      hair: 'hair-bob',
      accessories: ['acc-clipboard'],
    },
    {
      body: 'Wedge',
      outfit: 'outfit-hi-vis',
      hair: 'hair-short',
      accessories: ['acc-coffee-tray', 'acc-watch'],
    },
  ] as const;
  const prop = propExamples.find((entry) => entry.body === candidate.label);
  if (prop) {
    for (const facing of ['south', 'east'] as const) {
      const options = {
        outfit: prop.outfit,
        hair: prop.hair,
        head: 'head-soft-square',
        accessories: [...prop.accessories],
      };
      captures.props.set(
        `${key}/current/${facing}`,
        renderNeutralRevision(candidate, facing, 'current', options),
      );
      captures.props.set(
        `${key}/selected/${facing}`,
        renderNeutralRevision(candidate, facing, SELECTED_NEUTRAL_REVISION, options),
      );
    }
  }

  CROWD.forEach((entry, index) => {
    if (entry.body !== candidate.label) return;
    const options = {
      style: entry.cold ? COLD_STYLE : DISPLAY_STYLE,
      outfit: entry.outfit,
      hair: entry.hair,
      head: 'head-soft-square',
      accessories: entry.accessories,
      palette: entry.palette,
    };
    captures.crowd.set(
      `current/${index}`,
      renderNeutralRevision(candidate, entry.facing, 'current', options),
    );
    captures.crowd.set(
      `selected/${index}`,
      renderNeutralRevision(candidate, entry.facing, SELECTED_NEUTRAL_REVISION, options),
    );
  });
}

function capturePropComparisons(captures: Captures): void {
  const examples = [
    { body: 'Barrel', outfit: 'outfit-cardigan', hair: 'hair-side-part', accessories: ['acc-lanyard', 'acc-mug'] },
    { body: 'Block', outfit: 'outfit-service-apron', hair: 'hair-bob', accessories: ['acc-clipboard'] },
    { body: 'Wedge', outfit: 'outfit-hi-vis', hair: 'hair-short', accessories: ['acc-coffee-tray', 'acc-watch'] },
  ] as const;
  for (const example of examples) {
    const candidate = CANDIDATES.find((entry) => entry.label === example.body);
    if (!candidate) throw new Error(`Missing prop example body ${example.body}`);
    const snapshot = installSingleBodyCandidate(candidate);
    try {
      for (const facing of ['south', 'east'] as const) {
        const options = {
          outfit: example.outfit,
          hair: example.hair,
          head: 'head-soft-square',
          accessories: [...example.accessories],
        };
        captures.props.set(
          `${candidateKey(candidate)}/current/${facing}`,
          render(candidate, facing, options),
        );
        captures.props.set(
          `${candidateKey(candidate)}/always/${facing}`,
          render(candidate, facing, { ...options, pose: 'neutral' }),
        );
      }
    } finally {
      restoreSingleBodyCandidate(snapshot);
    }
  }
}

function armMetrics(captures: Captures): {
  checks: ArmContribution[];
  failures: Finding[];
} {
  const checks: ArmContribution[] = [];
  const failures: Finding[] = [];
  for (const candidate of CANDIDATES) {
    const key = candidateKey(candidate);
    for (const facing of FACINGS) {
      for (const pixelSize of [40, 48] as const) {
        const current = currentDefaultFromCapture(captures, key, facing, pixelSize, false);
        const always = currentDefaultFromCapture(captures, key, facing, pixelSize, true);
        const stats = compareMasks(alphaMask(current), alphaMask(always));
        const row: ArmContribution = {
          body: candidate.label,
          facing,
          pixelSize,
          currentPixels: stats.leftPixels,
          alwaysOnPixels: stats.rightPixels,
          addedPixels: stats.addedPixels,
          removedPixels: stats.removedPixels,
          iou: Number(stats.iou.toFixed(3)),
        };
        checks.push(row);
        if (row.addedPixels === 0) {
          failures.push({
            label: `${candidate.label}/${facing}/${pixelSize}px`,
            detail: 'neutral arms add no visible silhouette pixels',
          });
        }
        if (row.removedPixels > 0) {
          failures.push({
            label: `${candidate.label}/${facing}/${pixelSize}px`,
            detail: `neutral fallback removes ${row.removedPixels} existing silhouette pixels`,
          });
        }
      }
    }
  }
  return { checks, failures };
}

function currentDefaultFromCapture(
  captures: Captures,
  key: string,
  facing: ReviewFacing,
  pixelSize: 40 | 48,
  always: boolean,
): string {
  const source = always
    ? required(captures.always, `${key}/${facing}/black`)
    : required(captures.current, `${key}/${facing}/black`);
  return source.replace('width="40" height="40"', `width="${pixelSize}" height="${pixelSize}"`);
}

function silhouetteMetrics(captures: Captures): {
  rows: SilhouetteComparison[];
  exactFailures: Finding[];
  highSimilarityFindings: Finding[];
} {
  const rows: SilhouetteComparison[] = [];
  const exactFailures: Finding[] = [];
  const highSimilarityFindings: Finding[] = [];
  for (const facing of FACINGS) {
    const masks = CANDIDATES.map((candidate) => {
      const key = `${candidateKey(candidate)}/${facing}/black`;
      return {
        candidate,
        armlessMask: alphaMask(required(captures.current, key)),
        alwaysMask: alphaMask(required(captures.always, key)),
      };
    });
    for (let left = 0; left < masks.length; left++) {
      for (let right = left + 1; right < masks.length; right++) {
        const armlessStats = compareMasks(masks[left].armlessMask, masks[right].armlessMask);
        const stats = compareMasks(masks[left].alwaysMask, masks[right].alwaysMask);
        const row: SilhouetteComparison = {
          pair: [masks[left].candidate.label, masks[right].candidate.label],
          facing,
          armlessIou: Number(armlessStats.iou.toFixed(3)),
          iou: Number(stats.iou.toFixed(3)),
          collapseDelta: Number((stats.iou - armlessStats.iou).toFixed(3)),
          differingPixels: stats.differingPixels,
        };
        rows.push(row);
        if (row.differingPixels === 0) {
          exactFailures.push({
            label: `${row.pair.join(' / ')}/${facing}`,
            detail: 'always-on neutral silhouettes are pixel-identical at 40 px',
          });
        }
        if (row.iou >= 0.93) {
          highSimilarityFindings.push({
            label: `${row.pair.join(' / ')}/${facing}`,
            detail:
              `always-on IoU ${row.iou.toFixed(3)} (armless ${row.armlessIou.toFixed(3)}, ` +
              `collapse delta ${row.collapseDelta >= 0 ? '+' : ''}${row.collapseDelta.toFixed(3)})`,
          });
        }
      }
    }
  }
  rows.sort((left, right) =>
    right.iou - left.iou || left.differingPixels - right.differingPixels);
  return { rows, exactFailures, highSimilarityFindings };
}

function stressAudit(): {
  count: number;
  minimumMargin: number;
  failures: Finding[];
} {
  let count = 0;
  let minimumMargin = Number.POSITIVE_INFINITY;
  const failures: Finding[] = [];
  for (const candidate of CANDIDATES) {
    const stress = STRESS_RECIPES.find((entry) => entry.body === candidate.label);
    if (!stress) throw new Error(`Missing stress recipe ${candidate.label}`);
    const snapshot = installSingleBodyCandidate(candidate);
    try {
      for (const preset of DEFAULT_STYLE_PRESETS) {
        for (const facing of FACINGS) {
          for (const pose of ['neutral', stress.riskPose] as const) {
            const label = `${preset.id}/${candidate.label}/${pose}/${facing}`;
            const options = {
              pose,
              style: {
                ...structuredClone(preset.style),
                render: { ...preset.style.render, contactShadow: 0 },
              },
              outfit: stress.outfit,
              hair: stress.hair,
              head: 'head-soft-square',
              accessories: stress.accessories,
              pixelSize: 40,
            };
            const first = render(candidate, facing, options);
            const second = render(candidate, facing, options);
            count++;
            if (first !== second) failures.push({ label, detail: 'render is nondeterministic' });
            if (/NaN|undefined/.test(first)) failures.push({ label, detail: 'render contains invalid geometry' });
            if (first.toUpperCase().includes('#FF00FF')) failures.push({ label, detail: 'render contains an unresolved palette token' });
            const margin = canvasMargin(first);
            minimumMargin = Math.min(minimumMargin, margin);
            if (margin === 0) failures.push({ label, detail: 'render paints the 40 px canvas edge' });
          }
        }
      }
    } finally {
      restoreSingleBodyCandidate(snapshot);
    }
  }
  return {
    count,
    minimumMargin: Number.isFinite(minimumMargin) ? minimumMargin : 0,
    failures,
  };
}

function armModelPresenceAudit(): {
  checks: ArmModelCheck[];
  failures: Finding[];
} {
  const checks: ArmModelCheck[] = [];
  const failures: Finding[] = [];
  for (const candidate of CANDIDATES) {
    const snapshot = installSingleBodyCandidate(candidate);
    try {
      for (const facing of ['south', 'east', 'north'] as const) {
        const variant = revisedNeutralVariant(
          facing,
          candidate.anchors[facing],
          SELECTED_NEUTRAL_REVISION,
        );
        const shapes = [...(variant.back ?? []), ...variant.front];
        const sleevePaths = shapes.filter(
          (shape) => shape.stroke === '$outfitPrimary',
        ).length;
        const hands = shapes.filter((shape) => shape.fill === '$skin').length;
        const expectedSleevePaths = facing === 'east' ? 1 : 2;
        const expectedHands = facing === 'east' ? 1 : 2;
        const attachments = variant.attachments;
        const hasHandLeft = Boolean(attachments?.handLeft);
        const hasHandRight = Boolean(attachments?.handRight);
        const points = [
          attachments?.handLeft,
          attachments?.handRight,
        ].filter((point): point is BodyAnchorPoint => Boolean(point));
        const pathsValid =
          shapes.length > 0 &&
          shapes.every(
            (shape) =>
              shape.d.trim().length > 0 &&
              !/NaN|undefined|Infinity/.test(shape.d) &&
              (shape.strokeWidth === undefined ||
                (Number.isFinite(shape.strokeWidth) && shape.strokeWidth > 0)),
          ) &&
          points.every(
            (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
          );
        const composed = renderNeutralRevision(
          candidate,
          facing,
          SELECTED_NEUTRAL_REVISION,
        );
        const compositorIncludesAllPaths = shapes.every((shape) =>
          composed.includes(`d="${shape.d}"`),
        );
        const passed =
          sleevePaths === expectedSleevePaths &&
          hands === expectedHands &&
          hasHandRight &&
          hasHandLeft === (facing !== 'east') &&
          attachments?.carryHand === 'right' &&
          pathsValid &&
          compositorIncludesAllPaths;
        const row: ArmModelCheck = {
          body: candidate.label,
          facing,
          expectedSleevePaths,
          sleevePaths,
          expectedHands,
          hands,
          hasHandLeft,
          hasHandRight,
          carryHand: attachments?.carryHand ?? null,
          pathsValid,
          compositorIncludesAllPaths,
          passed,
        };
        checks.push(row);
        if (!passed) {
          failures.push({
            label: `${candidate.label}/${facing}`,
            detail:
              `arm model mismatch: sleeves ${sleevePaths}/${expectedSleevePaths}, ` +
              `hands ${hands}/${expectedHands}, left ${hasHandLeft}, right ${hasHandRight}, ` +
              `carry ${attachments?.carryHand ?? 'missing'}, paths ${pathsValid}, ` +
              `composed ${compositorIncludesAllPaths}`,
          });
        }
      }
    } finally {
      restoreSingleBodyCandidate(snapshot);
    }
  }
  return { checks, failures };
}

function revisionBellPinchMetrics(captures: RevisionCaptures): RevisionPairMetric[] {
  const rows: RevisionPairMetric[] = [];
  for (const revision of NEUTRAL_REVISIONS) {
    for (const pixelSize of [40, 48] as const) {
      const bell = required(
        captures.grid,
        `bell/${revision.id}/south/${pixelSize}/black`,
      );
      const pinch = required(
        captures.grid,
        `pinch/${revision.id}/south/${pixelSize}/black`,
      );
      const stats = compareMasks(alphaMask(bell), alphaMask(pinch));
      rows.push({
        revision: revision.id,
        pixelSize,
        iou: Number(stats.iou.toFixed(3)),
        differingPixels: stats.differingPixels,
      });
    }
  }
  return rows;
}

function revisionSilhouetteMetrics(
  captures: RevisionCaptures,
  armlessCaptures: Captures,
): {
  rows: SilhouetteComparison[];
  exactFailures: Finding[];
} {
  const rows: SilhouetteComparison[] = [];
  const exactFailures: Finding[] = [];
  for (const facing of FACINGS) {
    const masks = CANDIDATES.map((candidate) => {
      const key = candidateKey(candidate);
      return {
        candidate,
        armless: alphaMask(required(armlessCaptures.current, `${key}/${facing}/black`)),
        selected: alphaMask(required(
          captures.grid,
          `${key}/${SELECTED_NEUTRAL_REVISION}/${facing}/40/black`,
        )),
      };
    });
    for (let left = 0; left < masks.length; left++) {
      for (let right = left + 1; right < masks.length; right++) {
        const armless = compareMasks(masks[left].armless, masks[right].armless);
        const selected = compareMasks(masks[left].selected, masks[right].selected);
        const row: SilhouetteComparison = {
          pair: [masks[left].candidate.label, masks[right].candidate.label],
          facing,
          armlessIou: Number(armless.iou.toFixed(3)),
          iou: Number(selected.iou.toFixed(3)),
          collapseDelta: Number((selected.iou - armless.iou).toFixed(3)),
          differingPixels: selected.differingPixels,
        };
        rows.push(row);
        if (row.differingPixels === 0) {
          exactFailures.push({
            label: `${row.pair.join(' / ')}/${facing}`,
            detail: 'selected neutral silhouettes are pixel-identical at 40 px',
          });
        }
      }
    }
  }
  rows.sort((left, right) =>
    right.iou - left.iou || left.differingPixels - right.differingPixels);
  return { rows, exactFailures };
}

function revisionStressAudit(): {
  count: number;
  minimumMargin: number;
  failures: Finding[];
} {
  let count = 0;
  let minimumMargin = Number.POSITIVE_INFINITY;
  const failures: Finding[] = [];
  for (const candidate of CANDIDATES) {
    const stress = STRESS_RECIPES.find((entry) => entry.body === candidate.label);
    if (!stress) throw new Error(`Missing revision stress recipe ${candidate.label}`);
    const snapshot = installSingleBodyCandidate(candidate);
    try {
      for (const preset of DEFAULT_STYLE_PRESETS) {
        for (const facing of FACINGS) {
          const label = `${preset.id}/${candidate.label}/${facing}`;
          const options = {
            style: {
              ...structuredClone(preset.style),
              render: { ...preset.style.render, contactShadow: 0 },
            },
            outfit: stress.outfit,
            hair: stress.hair,
            head: 'head-soft-square',
            accessories: stress.accessories,
            pixelSize: 40,
          };
          const first = renderNeutralRevision(
            candidate,
            facing,
            SELECTED_NEUTRAL_REVISION,
            options,
          );
          const second = renderNeutralRevision(
            candidate,
            facing,
            SELECTED_NEUTRAL_REVISION,
            options,
          );
          count++;
          if (first !== second) failures.push({ label, detail: 'render is nondeterministic' });
          if (/NaN|undefined/.test(first)) failures.push({ label, detail: 'render contains invalid geometry' });
          if (first.toUpperCase().includes('#FF00FF')) failures.push({ label, detail: 'render contains an unresolved palette token' });
          const margin = canvasMargin(first);
          minimumMargin = Math.min(minimumMargin, margin);
          if (margin === 0) failures.push({ label, detail: 'render paints the 40 px canvas edge' });
        }
      }
    } finally {
      restoreSingleBodyCandidate(snapshot);
    }
  }
  return {
    count,
    minimumMargin: Number.isFinite(minimumMargin) ? minimumMargin : 0,
    failures,
  };
}

function required(map: ReadonlyMap<string | number, string>, key: string | number): string {
  const value = map.get(key);
  if (!value) throw new Error(`Missing always-on-arms capture ${key}`);
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
    text(x + 18, y + 57, label, 11, 700) +
    text(x + 18, y + 72, note, 9, 500, COLORS.muted)
  );
}

function modelSheet(report: ProofReport, captures: Captures): string {
  const width = 1880;
  const height = 1920;
  const parts: string[] = [`<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`];
  parts.push(text(30, 40, 'Always-on arms · model proof v3.1', 25, 760));
  parts.push(text(
    30,
    68,
    'REVIEW ONLY · proposed default = existing generated neutral arms · armless model retained only as a diagnostic control',
    12,
    680,
    COLORS.coral,
  ));

  parts.push(statBox(30, 88, 340, '6', 'body foundations', 'same provisional hulls and anchors'));
  parts.push(statBox(
    390,
    88,
    340,
    `${report.armContribution.visibleChecks}/${report.coverage.armContributionChecks}`,
    'silhouette-visible arms',
    `${report.armContribution.profileOccludedChecks} east/west checks stay inside the hull`,
    report.armContribution.allChecksAddVisiblePixels ? 'green' : 'amber',
  ));
  parts.push(statBox(
    750,
    88,
    340,
    String(report.silhouette.highSimilarityFindings.length),
    'body-distinction findings',
    'Bell / Pinch south + north cross the 0.93 watch',
    report.silhouette.highSimilarityFindings.length === 0 ? 'green' : 'amber',
  ));
  parts.push(statBox(
    1110,
    88,
    340,
    String(report.stress.failures.length),
    'mechanical failures',
    report.stress.failures.length === 0 ? 'deterministic · valid geometry · no edge paint' : 'inspect the metrics',
    report.stress.failures.length === 0 ? 'green' : 'coral',
  ));
  parts.push(statBox(1470, 88, 380, '0', 'new animation frames', 'neutral becomes the fallback, not a new state'));

  parts.push(text(30, 205, 'Current unposed gap → proposed always-on default', 18, 760));
  parts.push(text(
    30,
    226,
    'current base omits arms · proposed base resolves the existing neutral rig · literal 48/40 px',
    10,
    520,
    COLORS.muted,
  ));

  CANDIDATES.forEach((candidate, index) => {
    const x = 30 + index * 304;
    const key = candidateKey(candidate);
    parts.push(panel(x, 245, 286, 294, index % 2 === 0 ? COLORS.panel : COLORS.panelAlt));
    parts.push(text(x + 143, 272, candidate.label, 16, 760, COLORS.ink, 'middle'));
    parts.push(text(x + 143, 290, candidate.carrier, 9, 500, COLORS.muted, 'middle'));
    parts.push(text(x + 15, 316, 'CURRENT · no arms', 9, 700, COLORS.coral));
    parts.push(text(x + 90, 335, 'south', 8, 600, COLORS.muted, 'middle'));
    parts.push(text(x + 198, 335, 'east', 8, 600, COLORS.muted, 'middle'));
    parts.push(placedSvg(required(captures.current, `${key}/south/color`), x + 66, 342, 48));
    parts.push(placedSvg(required(captures.current, `${key}/east/color`), x + 174, 342, 48));
    parts.push(text(x + 15, 414, 'PROPOSED · neutral arms', 9, 700, COLORS.green));
    parts.push(placedSvg(required(captures.always, `${key}/south/color`), x + 66, 425, 48));
    parts.push(placedSvg(required(captures.always, `${key}/east/color`), x + 174, 425, 48));
    parts.push(text(x + 15, 500, '40 px silhouette', 8, 650, COLORS.muted));
    parts.push(placedSvg(required(captures.always, `${key}/south/black`), x + 137, 484, 40));
  });

  parts.push(text(30, 580, 'Core arm grid', 18, 760));
  parts.push(text(
    30,
    601,
    'each cell: neutral 48 px · walk 40 px · walk flat-black 40 px',
    10,
    520,
    COLORS.muted,
  ));
  FACINGS.forEach((facing, facingIndex) => {
    const x = 215 + facingIndex * 408;
    parts.push(text(x + 170, 627, facing === 'west' ? 'west · mirrored east' : facing, 11, 720, COLORS.muted, 'middle'));
    parts.push(text(x + 70, 646, 'neutral', 8, 600, COLORS.muted, 'middle'));
    parts.push(text(x + 170, 646, 'walk', 8, 600, COLORS.muted, 'middle'));
    parts.push(text(x + 270, 646, 'silhouette', 8, 600, COLORS.muted, 'middle'));
  });
  CANDIDATES.forEach((candidate, row) => {
    const y = 655 + row * 91;
    const key = candidateKey(candidate);
    parts.push(`<rect x="20" y="${y - 4}" width="1840" height="84" rx="7" fill="${row % 2 === 0 ? COLORS.panel : COLORS.panelAlt}"/>`);
    parts.push(text(38, y + 30, candidate.label, 14, 740));
    parts.push(text(38, y + 49, candidate.construction, 9, 500, COLORS.muted));
    FACINGS.forEach((facing, facingIndex) => {
      const x = 215 + facingIndex * 408;
      parts.push(placedSvg(required(captures.always, `${key}/${facing}/color`), x + 46, y + 10, 48));
      parts.push(placedSvg(required(captures.walk, `${key}/${facing}/color`), x + 150, y + 14, 40));
      parts.push(placedSvg(required(captures.walk, `${key}/${facing}/black`), x + 250, y + 14, 40));
    });
  });

  const continuityTop = 1240;
  parts.push(text(30, continuityTop, 'Arm continuity across representative states · south/east · literal 40 px', 18, 760));
  REPRESENTATIVE_POSES.forEach((pose, index) => {
    const x = 230 + index * 310;
    parts.push(text(x + 105, continuityTop + 25, pose === 'neutral' ? 'default / neutral' : pose, 10, 700, COLORS.muted, 'middle'));
    parts.push(text(x + 75, continuityTop + 42, 'S', 8, 650, COLORS.muted, 'middle'));
    parts.push(text(x + 150, continuityTop + 42, 'E', 8, 650, COLORS.muted, 'middle'));
  });
  CANDIDATES.forEach((candidate, row) => {
    const y = continuityTop + 53 + row * 64;
    const key = candidateKey(candidate);
    parts.push(`<rect x="20" y="${y - 3}" width="1840" height="58" rx="6" fill="${row % 2 === 0 ? COLORS.panel : COLORS.panelAlt}"/>`);
    parts.push(text(38, y + 27, candidate.label, 12, 720));
    REPRESENTATIVE_POSES.forEach((pose, column) => {
      const x = 230 + column * 310;
      parts.push(placedSvg(required(captures.poses, `${key}/${pose}/south`), x + 55, y + 6, 40));
      parts.push(placedSvg(required(captures.poses, `${key}/${pose}/east`), x + 130, y + 6, 40));
    });
  });

  parts.push(panel(30, 1700, 1820, 166, COLORS.amberSoft));
  parts.push(text(50, 1732, 'Decision read', 15, 760, COLORS.amber));
  parts.push(text(
    50,
    1760,
    `The neutral arm layer renders in all ${report.coverage.armContributionChecks} checks, but expands the silhouette in only ${report.armContribution.visibleChecks}; east/west arms remain wholly inside the torso hull.`,
    11,
    600,
  ));
  parts.push(text(
    50,
    1785,
    `No exact body collapse at 40 px, but ${report.silhouette.closest[0]?.pair.join(' / ') ?? 'n/a'} reaches IoU ${report.silhouette.maximumIou.toFixed(3)} from the ${report.silhouette.closest[0]?.facing ?? 'n/a'} (armless ${report.silhouette.closest[0]?.armlessIou.toFixed(3) ?? 'n/a'}).`,
    10,
    520,
    COLORS.muted,
  ));
  parts.push(text(
    50,
    1810,
    'Direction passes; this neutral geometry does not. Profile needs a recoverable arm cue, and Bell / Pinch need either revised arm anchors or one shared slot.',
    10,
    680,
    COLORS.coral,
  ));
  parts.push(text(
    50,
    1835,
    'Approval would change the default render rule and export surfaces, not the pose vocabulary or authored animation count.',
    10,
    650,
    COLORS.green,
  ));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function roomPanel(
  captures: Captures,
  x: number,
  y: number,
  width: number,
  height: number,
  figureSize: 40 | 48,
): string {
  const parts: string[] = [];
  parts.push(panel(x, y, width, height));
  parts.push(text(x + 18, y + 28, `${figureSize} px crowd`, 15, 740));
  parts.push(text(x + 18, y + 47, 'same 12 recipes · six bodies twice · mixed facings and props', 9, 500, COLORS.muted));
  const floorX = x + 24;
  const floorY = y + 64;
  const floorW = width - 48;
  const floorH = height - 90;
  parts.push(`<rect x="${floorX}" y="${floorY}" width="${floorW}" height="${floorH}" fill="${COLORS.floor}"/>`);
  for (let gx = floorX; gx <= floorX + floorW; gx += 54) {
    parts.push(`<path d="M ${gx} ${floorY} V ${floorY + floorH}" stroke="${COLORS.floorDark}" stroke-width="1" opacity="0.25"/>`);
  }
  for (let gy = floorY; gy <= floorY + floorH; gy += 54) {
    parts.push(`<path d="M ${floorX} ${gy} H ${floorX + floorW}" stroke="${COLORS.floorDark}" stroke-width="1" opacity="0.25"/>`);
  }
  parts.push(`<path d="M ${floorX} ${floorY + floorH} V ${floorY} H ${floorX + floorW}" fill="none" stroke="${COLORS.ink}" stroke-width="12"/>`);
  parts.push(`<path d="M ${floorX} ${floorY + floorH} V ${floorY} H ${floorX + floorW}" fill="none" stroke="${COLORS.cream}" stroke-width="7"/>`);

  const columns = 4;
  const rows = 3;
  const xStride = floorW / columns;
  const yStride = floorH / rows;
  CROWD.forEach((entry, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const jitterX = [5, -8, 10, -3][index % 4];
    const jitterY = [2, 7, -4][row];
    const cx = floorX + column * xStride + xStride / 2 + jitterX;
    const cy = floorY + row * yStride + yStride / 2 + jitterY;
    parts.push(placedSvg(required(captures.crowd, index), cx - figureSize / 2, cy - figureSize / 2 - 8, figureSize));
    parts.push(text(cx, cy + figureSize / 2 + 7, entry.body, 8, 650, COLORS.ink, 'middle'));
  });

  return parts.join('');
}

function roomAndPropsSheet(report: ProofReport, captures: Captures): string {
  const width = 1880;
  const height = 1360;
  const parts: string[] = [`<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`];
  parts.push(text(30, 40, 'Always-on arms · crowd and held-prop proof v3.1', 25, 760));
  parts.push(text(
    30,
    68,
    'REVIEW ONLY · same crowd at 48 and 40 px · no furniture occlusion · props remain attached to published neutral wrists',
    12,
    680,
    COLORS.coral,
  ));

  parts.push(roomPanel(captures, 24, 92, 906, 760, 48));
  parts.push(roomPanel(captures, 950, 92, 906, 760, 40));

  parts.push(text(30, 895, 'Why the fallback matters for held props', 18, 760));
  parts.push(text(
    30,
    916,
    'the current unposed renderer already places props at neutral wrists but omits the connecting arms',
    10,
    520,
    COLORS.muted,
  ));

  const propBodies = [
    ['barrel', 'Barrel · mug'],
    ['block', 'Block · clipboard'],
    ['wedge', 'Wedge · coffee tray'],
  ] as const;
  propBodies.forEach(([key, label], index) => {
    const x = 30 + index * 610;
    const y = 940;
    parts.push(panel(x, y, 590, 260, index % 2 === 0 ? COLORS.panel : COLORS.panelAlt));
    parts.push(text(x + 18, y + 29, label, 15, 750));
    parts.push(text(x + 145, y + 54, 'CURRENT · floating attachment', 9, 700, COLORS.coral, 'middle'));
    parts.push(text(x + 445, y + 54, 'PROPOSED · connected neutral arm', 9, 700, COLORS.green, 'middle'));
    parts.push(text(x + 105, y + 76, 'S', 8, 650, COLORS.muted, 'middle'));
    parts.push(text(x + 185, y + 76, 'E', 8, 650, COLORS.muted, 'middle'));
    parts.push(text(x + 405, y + 76, 'S', 8, 650, COLORS.muted, 'middle'));
    parts.push(text(x + 485, y + 76, 'E', 8, 650, COLORS.muted, 'middle'));
    parts.push(placedSvg(required(captures.props, `${key}/current/south`), x + 73, y + 84, 64));
    parts.push(placedSvg(required(captures.props, `${key}/current/east`), x + 153, y + 84, 64));
    parts.push(placedSvg(required(captures.props, `${key}/always/south`), x + 373, y + 84, 64));
    parts.push(placedSvg(required(captures.props, `${key}/always/east`), x + 453, y + 84, 64));
    parts.push(text(
      x + 18,
      y + 230,
      'same garment · same wrist anchor · only the mandatory neutral arm changes',
      9,
      600,
      COLORS.muted,
    ));
  });

  parts.push(panel(30, 1225, 1820, 90, report.stress.failures.length === 0 ? COLORS.greenSoft : COLORS.coralSoft));
  parts.push(text(
    50,
    1255,
    report.stress.failures.length === 0 ? 'Stress result · mechanically clean' : 'Stress result · failures found',
    14,
    760,
    report.stress.failures.length === 0 ? COLORS.green : COLORS.coral,
  ));
  parts.push(text(
    50,
    1280,
    `${report.coverage.stressRenderCount} garment/prop renders across four facings and three style presets · minimum 40 px canvas margin ${report.stress.minimumCanvasMargin40} px.`,
    10,
    600,
    COLORS.ink,
  ));
  parts.push(text(
    50,
    1302,
    'Crowd review is still human: recover both arms on at least ten of twelve 40 px figures, and reject any arm that reads as a garment edge or floating side pixel.',
    10,
    600,
    COLORS.coral,
  ));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function revisionModelSheet(
  report: RevisionProofReport,
  captures: RevisionCaptures,
): string {
  const width = 1880;
  const height = 1860;
  const parts: string[] = [`<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`];

  parts.push(text(30, 40, 'Neutral-arm fallback · profile-policy correction v3.3', 25, 760));
  parts.push(text(
    30,
    68,
    'REVIEW ONLY · fallback rule locked · outboard profile cue rejected · other fourteen poses unchanged',
    12,
    680,
    COLORS.coral,
  ));

  parts.push(statBox(30, 88, 340, 'LOCKED', 'fallback rule', 'full-body rigs resolve neutral arms'));
  parts.push(statBox(
    390,
    88,
    340,
    `${report.armModelPresence.checks.filter((entry) => entry.passed).length}/${report.coverage.authoredArmModelChecks}`,
    'authored arm models',
    '6 bodies · south/east/north · geometry + wrists',
    report.armModelPresence.allChecksPass ? 'green' : 'coral',
  ));
  parts.push(statBox(
    750,
    88,
    340,
    `${report.profileOcclusion.occludedChecks}/${report.coverage.profileSilhouetteChecks}`,
    'selected profile checks',
    'zero exterior arm pixels · allowed, not required',
    report.profileOcclusion.allChecksOccluded ? 'green' : 'amber',
  ));
  parts.push(statBox(
    1110,
    88,
    340,
    String(report.stress.failures.length),
    'raster-integrity failures',
    'determinism · tokens · canvas-edge contact',
    report.stress.failures.length === 0 ? 'green' : 'coral',
  ));
  parts.push(statBox(1470, 88, 380, '0', 'new animation frames', 'neutral geometry only · no new state'));

  parts.push(text(30, 205, 'Profile-policy correction · close hang selected; outboard hang rejected', 18, 760));
  parts.push(text(
    30,
    226,
    'An arm model may be present without changing the outer silhouette · literal 48 and 40 px',
    10,
    520,
    COLORS.muted,
  ));

  NEUTRAL_REVISIONS.forEach((revision, column) => {
    const x = 30 + column * 610;
    const fill =
      revision.id === report.selectedRevision
        ? COLORS.greenSoft
        : revision.id === report.rejectedRevision.id
          ? COLORS.coralSoft
        : column % 2 === 0
          ? COLORS.panel
          : COLORS.panelAlt;
    parts.push(panel(x, 245, 590, 318, fill));
    parts.push(text(x + 20, 275, revision.label, 16, 760));
    parts.push(text(x + 20, 295, revision.note, 9, 540, COLORS.muted));
    if (revision.id === report.selectedRevision) {
      parts.push(text(x + 565, 275, 'SELECTED', 9, 760, COLORS.green, 'end'));
    } else if (revision.id === report.rejectedRevision.id) {
      parts.push(text(x + 565, 275, 'REJECTED', 9, 760, COLORS.coral, 'end'));
    }
    parts.push(text(x + 245, 320, 'east', 9, 650, COLORS.muted, 'middle'));
    parts.push(text(x + 345, 320, 'west', 9, 650, COLORS.muted, 'middle'));
    parts.push(text(x + 455, 320, 'east · 40', 9, 650, COLORS.muted, 'middle'));
    parts.push(text(x + 535, 320, 'west · 40', 9, 650, COLORS.muted, 'middle'));
    (['Wedge', 'Pinch'] as const).forEach((label, row) => {
      const candidate = CANDIDATES.find((entry) => entry.label === label);
      if (!candidate) throw new Error(`Missing revision audition candidate ${label}`);
      const key = candidateKey(candidate);
      const y = 344 + row * 103;
      parts.push(text(x + 20, y + 30, label, 13, 720));
      parts.push(placedSvg(
        required(captures.grid, `${key}/${revision.id}/east/48/color`),
        x + 221,
        y + 3,
        48,
      ));
      parts.push(placedSvg(
        required(captures.grid, `${key}/${revision.id}/west/48/color`),
        x + 321,
        y + 3,
        48,
      ));
      parts.push(placedSvg(
        required(captures.grid, `${key}/${revision.id}/east/40/black`),
        x + 435,
        y + 7,
        40,
      ));
      parts.push(placedSvg(
        required(captures.grid, `${key}/${revision.id}/west/40/black`),
        x + 515,
        y + 7,
        40,
      ));
    });
  });

  parts.push(text(30, 600, 'Front-facing body distinction diagnostic · Bell / Pinch south', 18, 760));
  NEUTRAL_REVISIONS.forEach((revision, column) => {
    const x = 30 + column * 610;
    const y = 620;
    const metric40 = report.bellPinch.comparisons.find(
      (entry) => entry.revision === revision.id && entry.pixelSize === 40,
    );
    const metric48 = report.bellPinch.comparisons.find(
      (entry) => entry.revision === revision.id && entry.pixelSize === 48,
    );
    parts.push(panel(
      x,
      y,
      590,
      245,
      revision.id === report.selectedRevision
        ? COLORS.greenSoft
        : revision.id === report.rejectedRevision.id
          ? COLORS.coralSoft
          : COLORS.panel,
    ));
    parts.push(text(x + 20, y + 30, revision.label, 14, 740));
    parts.push(text(
      x + 570,
      y + 30,
      `IoU ${metric40?.iou.toFixed(3) ?? 'n/a'} / ${metric48?.iou.toFixed(3) ?? 'n/a'}`,
      10,
      700,
      revision.id === report.selectedRevision
        ? COLORS.green
        : revision.id === report.rejectedRevision.id
          ? COLORS.coral
          : COLORS.muted,
      'end',
    ));
    (['Bell', 'Pinch'] as const).forEach((label, row) => {
      const candidate = CANDIDATES.find((entry) => entry.label === label);
      if (!candidate) throw new Error(`Missing waist candidate ${label}`);
      const key = candidateKey(candidate);
      const cellY = y + 55 + row * 83;
      parts.push(text(x + 20, cellY + 30, label, 13, 720));
      parts.push(text(x + 180, cellY + 12, '48', 8, 600, COLORS.muted, 'middle'));
      parts.push(text(x + 330, cellY + 12, '40', 8, 600, COLORS.muted, 'middle'));
      parts.push(text(x + 480, cellY + 12, 'silhouette', 8, 600, COLORS.muted, 'middle'));
      parts.push(placedSvg(
        required(captures.grid, `${key}/${revision.id}/south/48/color`),
        x + 156,
        cellY + 18,
        48,
      ));
      parts.push(placedSvg(
        required(captures.grid, `${key}/${revision.id}/south/40/color`),
        x + 310,
        cellY + 22,
        40,
      ));
      parts.push(placedSvg(
        required(captures.grid, `${key}/${revision.id}/south/40/black`),
        x + 460,
        cellY + 22,
        40,
      ));
    });
  });

  parts.push(text(30, 910, 'Selected close hang · six-body confirmation', 18, 760));
  FACINGS.forEach((facing, index) => {
    const x = 260 + index * 390;
    parts.push(text(
      x + 110,
      936,
      facing === 'west' ? 'west · mirrored east' : facing,
      10,
      700,
      COLORS.muted,
      'middle',
    ));
    parts.push(text(x + 70, 954, '48', 8, 600, COLORS.muted, 'middle'));
    parts.push(text(x + 150, 954, '40 silhouette', 8, 600, COLORS.muted, 'middle'));
  });
  CANDIDATES.forEach((candidate, row) => {
    const y = 968 + row * 103;
    const key = candidateKey(candidate);
    parts.push(`<rect x="20" y="${y - 4}" width="1840" height="96" rx="7" fill="${row % 2 === 0 ? COLORS.panel : COLORS.panelAlt}"/>`);
    parts.push(text(38, y + 34, candidate.label, 14, 740));
    parts.push(text(38, y + 54, candidate.construction, 9, 500, COLORS.muted));
    FACINGS.forEach((facing, index) => {
      const x = 260 + index * 390;
      parts.push(placedSvg(
        required(
          captures.grid,
          `${key}/${report.selectedRevision}/${facing}/48/color`,
        ),
        x + 46,
        y + 12,
        48,
      ));
      parts.push(placedSvg(
        required(
          captures.grid,
          `${key}/${report.selectedRevision}/${facing}/40/black`,
        ),
        x + 130,
        y + 16,
        40,
      ));
    });
  });

  parts.push(panel(30, 1610, 1820, 190, COLORS.greenSoft));
  parts.push(text(50, 1642, 'Corrected read', 15, 760, COLORS.green));
  parts.push(text(
    50,
    1670,
    `Outboard hang is rejected: its one-sided profile protrusion reads as a missing arm. Close hanging neutral is selected.`,
    11,
    620,
  ));
  parts.push(text(
    50,
    1698,
    `${report.armModelPresence.checks.filter((entry) => entry.passed).length}/${report.coverage.authoredArmModelChecks} authored arm-model checks and ${report.coverage.productionParityChecks}/${report.coverage.productionParityChecks} production-neutral parity checks pass.`,
    10,
    540,
    COLORS.muted,
  ));
  parts.push(text(
    50,
    1726,
    `All ${report.profileOcclusion.occludedChecks} selected east/west scale checks add zero exterior pixels; this is permitted, not required of future geometry.`,
    10,
    620,
    COLORS.green,
  ));
  parts.push(text(
    50,
    1754,
    `Bell / Pinch overlap remains diagnostic (${report.bellPinch.comparisons.filter((entry) => entry.revision === report.selectedRevision).map((entry) => entry.iou.toFixed(3)).join(' / ')}); fallback routing, atlases, portraits, exports, and runtime remain a separate promotion gate.`,
    10,
    650,
    COLORS.coral,
  ));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function revisionCrowdPanel(
  captures: RevisionCaptures,
  mode: 'current' | 'selected',
  x: number,
  y: number,
  width: number,
  height: number,
): string {
  const parts: string[] = [];
  const selectedLabel =
    NEUTRAL_REVISIONS.find((entry) => entry.id === SELECTED_NEUTRAL_REVISION)?.label ??
    SELECTED_NEUTRAL_REVISION;
  const label = mode === 'current' ? 'Current hanging neutral' : `Selected ${selectedLabel}`;
  parts.push(panel(x, y, width, height));
  parts.push(text(x + 18, y + 28, `${label} · literal 40 px`, 15, 740));
  parts.push(text(
    x + 18,
    y + 47,
    'same 12 recipes · same facings, garments, hair, palettes, and props',
    9,
    500,
    COLORS.muted,
  ));
  const floorX = x + 24;
  const floorY = y + 64;
  const floorW = width - 48;
  const floorH = height - 90;
  parts.push(`<rect x="${floorX}" y="${floorY}" width="${floorW}" height="${floorH}" fill="${COLORS.floor}"/>`);
  for (let gx = floorX; gx <= floorX + floorW; gx += 54) {
    parts.push(`<path d="M ${gx} ${floorY} V ${floorY + floorH}" stroke="${COLORS.floorDark}" stroke-width="1" opacity="0.25"/>`);
  }
  for (let gy = floorY; gy <= floorY + floorH; gy += 54) {
    parts.push(`<path d="M ${floorX} ${gy} H ${floorX + floorW}" stroke="${COLORS.floorDark}" stroke-width="1" opacity="0.25"/>`);
  }
  parts.push(`<path d="M ${floorX} ${floorY + floorH} V ${floorY} H ${floorX + floorW}" fill="none" stroke="${COLORS.ink}" stroke-width="12"/>`);
  parts.push(`<path d="M ${floorX} ${floorY + floorH} V ${floorY} H ${floorX + floorW}" fill="none" stroke="${COLORS.cream}" stroke-width="7"/>`);

  const columns = 4;
  const rows = 3;
  const xStride = floorW / columns;
  const yStride = floorH / rows;
  CROWD.forEach((entry, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const jitterX = [5, -8, 10, -3][index % 4];
    const jitterY = [2, 7, -4][row];
    const cx = floorX + column * xStride + xStride / 2 + jitterX;
    const cy = floorY + row * yStride + yStride / 2 + jitterY;
    parts.push(placedSvg(
      required(captures.crowd, `${mode}/${index}`),
      cx - 20,
      cy - 28,
      40,
    ));
    parts.push(text(cx, cy + 28, entry.body, 8, 650, COLORS.ink, 'middle'));
  });
  return parts.join('');
}

function profileOcclusionPanel(
  report: RevisionProofReport,
  captures: RevisionCaptures,
  x: number,
  y: number,
  width: number,
  height: number,
): string {
  const parts: string[] = [];
  parts.push(panel(x, y, width, height));
  parts.push(text(x + 18, y + 28, 'Selected close hang · profile occlusion allowed', 15, 740));
  parts.push(text(
    x + 18,
    y + 47,
    `${report.profileOcclusion.occludedChecks}/${report.coverage.profileSilhouetteChecks} selected east/west checks add zero outer pixels · not a future requirement`,
    9,
    500,
    COLORS.muted,
  ));
  parts.push(text(x + 320, y + 68, 'east · authored', 9, 700, COLORS.muted, 'middle'));
  parts.push(text(x + 660, y + 68, 'west · mirrored', 9, 700, COLORS.muted, 'middle'));

  CANDIDATES.forEach((candidate, row) => {
    const key = candidateKey(candidate);
    const rowY = y + 78 + row * 88;
    parts.push(
      `<rect x="${x + 16}" y="${rowY}" width="${width - 32}" height="80" rx="6" fill="${row % 2 === 0 ? COLORS.row : COLORS.panelAlt}"/>`,
    );
    parts.push(text(x + 30, rowY + 44, candidate.label, 12, 700));
    parts.push(placedSvg(
      required(captures.grid, `${key}/${report.selectedRevision}/east/48/color`),
      x + 235,
      rowY + 15,
      48,
    ));
    parts.push(placedSvg(
      required(captures.grid, `${key}/${report.selectedRevision}/east/40/black`),
      x + 345,
      rowY + 19,
      40,
    ));
    parts.push(placedSvg(
      required(captures.grid, `${key}/${report.selectedRevision}/west/48/color`),
      x + 575,
      rowY + 15,
      48,
    ));
    parts.push(placedSvg(
      required(captures.grid, `${key}/${report.selectedRevision}/west/40/black`),
      x + 685,
      rowY + 19,
      40,
    ));
  });

  return parts.join('');
}

function revisionConfirmationSheet(
  report: RevisionProofReport,
  captures: RevisionCaptures,
): string {
  const width = 1880;
  const height = 1500;
  const parts: string[] = [`<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`];
  parts.push(text(30, 40, 'Neutral-arm fallback · corrected neutral in context v3.3', 25, 760));
  parts.push(text(
    30,
    68,
    'REVIEW ONLY · close hanging neutral selected · profile protrusion removed · fallback only',
    12,
    680,
    COLORS.coral,
  ));

  parts.push(revisionCrowdPanel(captures, 'selected', 24, 92, 906, 650));
  parts.push(profileOcclusionPanel(report, captures, 950, 92, 906, 650));

  parts.push(text(30, 785, 'Selected fallback · compatibility sentinels', 18, 760));
  const compatibility = [
    { key: 'wedge', label: 'Wedge · hi-vis + tray', facings: ['east', 'west'] as const },
    { key: 'bell', label: 'Bell · Dress + Watch', facings: ['south', 'east'] as const },
    { key: 'pinch', label: 'Pinch · suit + clipboard', facings: ['south', 'east'] as const },
    { key: 'block', label: 'Block · apron + clipboard', facings: ['east', 'west'] as const },
  ];
  compatibility.forEach((entry, index) => {
    const x = 30 + index * 455;
    const y = 810;
    parts.push(panel(x, y, 435, 238, index % 2 === 0 ? COLORS.panel : COLORS.panelAlt));
    parts.push(text(x + 18, y + 30, entry.label, 14, 740));
    entry.facings.forEach((facing, column) => {
      const figureX = x + 95 + column * 190;
      parts.push(text(figureX + 25, y + 56, facing, 9, 650, COLORS.muted, 'middle'));
      parts.push(placedSvg(
        required(captures.stress, `${entry.key}/${facing}/color`),
        figureX,
        y + 66,
        48,
      ));
      parts.push(placedSvg(
        required(captures.stress, `${entry.key}/${facing}/black`),
        figureX + 65,
        y + 70,
        40,
      ));
    });
    parts.push(text(
      x + 18,
      y + 214,
      '48 px color · 40 px silhouette',
      9,
      580,
      COLORS.muted,
    ));
  });

  parts.push(text(30, 1090, 'Held-prop continuity · selected close hang', 18, 760));
  const propBodies = [
    ['barrel', 'Barrel · mug'],
    ['block', 'Block · clipboard'],
    ['wedge', 'Wedge · coffee tray'],
  ] as const;
  propBodies.forEach(([key, label], index) => {
    const x = 30 + index * 610;
    const y = 1110;
    parts.push(panel(x, y, 590, 225, index % 2 === 0 ? COLORS.panel : COLORS.panelAlt));
    parts.push(text(x + 18, y + 29, label, 14, 740));
    parts.push(text(x + 205, y + 52, 'SOUTH', 9, 700, COLORS.green, 'middle'));
    parts.push(text(x + 405, y + 52, 'EAST · ARM INSIDE SILHOUETTE', 9, 700, COLORS.green, 'middle'));
    parts.push(placedSvg(required(captures.props, `${key}/selected/south`), x + 170, y + 65, 64));
    parts.push(placedSvg(required(captures.props, `${key}/selected/east`), x + 370, y + 65, 64));
    parts.push(text(
      x + 18,
      y + 202,
      'shared neutral wrist metadata · no forced profile protrusion',
      9,
      580,
      COLORS.muted,
    ));
  });

  parts.push(panel(
    30,
    1370,
    1820,
    88,
    report.stress.failures.length === 0 ? COLORS.greenSoft : COLORS.coralSoft,
  ));
  parts.push(text(
    50,
    1401,
    report.stress.failures.length === 0
      ? 'Selected fallback · raster checks clean'
      : 'Selected fallback · raster-integrity findings',
    14,
    760,
    report.stress.failures.length === 0 ? COLORS.green : COLORS.coral,
  ));
  parts.push(text(
    50,
    1428,
    `${report.coverage.stressRenderCount} deterministic, token-clean garment/prop/style renders · ${report.coverage.authoredArmModelChecks} authored arm-model checks · ${report.coverage.productionParityChecks} production-parity checks · proof pose removed.`,
    10,
    600,
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

function main(): void {
  if (getPart(NO_PART)) throw new Error(`Proof sentinel unexpectedly resolves: ${NO_PART}`);
  const outDir = resolve(process.argv[2] ?? 'docs/previews');
  mkdirSync(outDir, { recursive: true });

  const captures: Captures = {
    current: new Map(),
    always: new Map(),
    walk: new Map(),
    poses: new Map(),
    stress: new Map(),
    props: new Map(),
    crowd: new Map(),
  };
  const revisionCaptures: RevisionCaptures = {
    grid: new Map(),
    stress: new Map(),
    props: new Map(),
    crowd: new Map(),
  };
  const poseKeysBefore = Object.keys(POSE_DEFS);
  let productionParityChecks = 0;

  const sentinelRecipe: CharacterRecipe = {
    id: 'always-on-arms-restoration-sentinel',
    name: 'Restoration sentinel',
    parts: {
      body: 'body-balanced',
      head: 'head-round',
      hair: 'hair-side-part',
      outfit: 'outfit-blazer',
      accessories: ['acc-lanyard', 'acc-watch'],
    },
    palette: PALETTES[0],
  };
  const sentinelBefore = composeCharacter(
    sentinelRecipe,
    DISPLAY_STYLE,
    'west',
    CANVAS,
    'normal',
    { badge: false, pose: 'neutral' },
  );

  for (const candidate of CANDIDATES) {
    const snapshot = installSingleBodyCandidate(candidate);
    try {
      captureCandidate(candidate, captures);
      captureRevisionCandidate(candidate, revisionCaptures);
      for (const facing of FACINGS) {
        const productionNeutral = alwaysOnDefault(candidate, facing);
        const proofControl = renderNeutralRevision(candidate, facing, 'current');
        if (proofControl !== productionNeutral) {
          throw new Error(
            `Proof current-neutral control diverged from production for ${candidate.label}/${facing}`,
          );
        }
        productionParityChecks++;
      }
    } finally {
      restoreSingleBodyCandidate(snapshot);
    }
  }
  capturePropComparisons(captures);

  const sentinelAfter = composeCharacter(
    sentinelRecipe,
    DISPLAY_STYLE,
    'west',
    CANVAS,
    'normal',
    { badge: false, pose: 'neutral' },
  );
  if (sentinelAfter !== sentinelBefore) {
    throw new Error('Process-local always-on-arms proof did not restore production output byte-for-byte');
  }
  const poseKeysAfterCapture = Object.keys(POSE_DEFS);
  if (
    Object.prototype.hasOwnProperty.call(POSE_DEFS, PROOF_NEUTRAL_POSE) ||
    poseKeysAfterCapture.length !== poseKeysBefore.length ||
    poseKeysAfterCapture.some((key, index) => key !== poseKeysBefore[index])
  ) {
    throw new Error('Review-only neutral proof pose leaked into the production catalog');
  }

  const arms = armMetrics(captures);
  const silhouettes = silhouetteMetrics(captures);
  const stress = stressAudit();
  const visibleChecks = arms.checks.filter((entry) => entry.addedPixels > 0).length;
  const profileOccludedChecks = arms.checks.filter(
    (entry) => (entry.facing === 'east' || entry.facing === 'west') && entry.addedPixels === 0,
  ).length;
  const minimumAddedPixels40 = Math.min(
    ...arms.checks.filter((entry) => entry.pixelSize === 40).map((entry) => entry.addedPixels),
  );
  const minimumAddedPixels48 = Math.min(
    ...arms.checks.filter((entry) => entry.pixelSize === 48).map((entry) => entry.addedPixels),
  );

  const report: ProofReport = {
    reviewOnly: true,
    proposedRule:
      'Every rigged character resolves generated neutral arms when no explicit pose is supplied; explicit poses replace the arm configuration rather than introducing arms.',
    productionCompositorRestored: true,
    coverage: {
      bodyCount: CANDIDATES.length,
      facingCount: FACINGS.length,
      armContributionChecks: arms.checks.length,
      stressRenderCount: stress.count,
      crowdCharacterCount: CROWD.length,
      newAnimationFrames: 0,
    },
    armContribution: {
      allChecksAddVisiblePixels: arms.failures.length === 0,
      visibleChecks,
      profileOccludedChecks,
      minimumAddedPixels40,
      minimumAddedPixels48,
      findings: arms.failures,
      checks: arms.checks,
    },
    silhouette: {
      comparisonCount: silhouettes.rows.length,
      exactCollapses: silhouettes.exactFailures.length,
      highSimilarityThreshold: 0.93,
      highSimilarityFindings: silhouettes.highSimilarityFindings,
      maximumIou: silhouettes.rows[0]?.iou ?? 0,
      maximumCollapseDelta: Math.max(...silhouettes.rows.map((entry) => entry.collapseDelta)),
      closest: silhouettes.rows.slice(0, 20),
    },
    stress: {
      minimumCanvasMargin40: stress.minimumMargin,
      failures: stress.failures,
    },
    promotionGaps: [
      'composeCharacter must resolve neutral pose art when opts.pose is absent for a rigged body',
      'composePortrait, characterLayers, and base character atlas policy must be decided explicitly',
      'Unity/runtime consumers must treat neutral as the base visible arm state without adding a new animation state',
      'Pinch still requires a true sixth production body ID and dedicated Dress profile',
    ],
  };

  const armModelPresence = armModelPresenceAudit();
  const revisionBellPinch = revisionBellPinchMetrics(revisionCaptures);
  const revisionSilhouettes = revisionSilhouetteMetrics(revisionCaptures, captures);
  const revisionStress = revisionStressAudit();
  const profileSilhouetteChecks = arms.checks.filter(
    (entry) => entry.facing === 'east' || entry.facing === 'west',
  );
  const occludedProfileChecks = profileSilhouetteChecks.filter(
    (entry) => entry.addedPixels === 0,
  );
  const selectedBellPinch = revisionBellPinch.filter(
    (entry) => entry.revision === SELECTED_NEUTRAL_REVISION,
  );
  const revisionReport: RevisionProofReport = {
    reviewOnly: true,
    acceptedRule:
      'Every full-body rigged character has generated neutral-arm geometry as its fallback. East and west neutral arms may remain wholly inside the body silhouette; explicit action poses may expose them when the action calls for it.',
    selectedRevision: SELECTED_NEUTRAL_REVISION,
    rejectedRevision: {
      id: 'outboard-hang',
      reason:
        'The forced one-sided profile protrusion reads as though the other arm disappeared.',
    },
    productionNeutralRestored: true,
    proofPoseRemoved: !Object.prototype.hasOwnProperty.call(
      POSE_DEFS,
      PROOF_NEUTRAL_POSE,
    ),
    coverage: {
      bodyCount: CANDIDATES.length,
      facingCount: FACINGS.length,
      revisionCount: NEUTRAL_REVISIONS.length,
      authoredArmModelChecks: armModelPresence.checks.length,
      productionParityChecks,
      profileSilhouetteChecks: profileSilhouetteChecks.length,
      stressRenderCount: revisionStress.count,
      crowdCharacterCount: CROWD.length,
      newAnimationFrames: 0,
    },
    armModelPresence: {
      allChecksPass: armModelPresence.failures.length === 0,
      checks: armModelPresence.checks,
      findings: armModelPresence.failures,
    },
    profileOcclusion: {
      allowed: true,
      allChecksOccluded:
        occludedProfileChecks.length === profileSilhouetteChecks.length,
      occludedChecks: occludedProfileChecks.length,
      checks: profileSilhouetteChecks,
    },
    bellPinch: {
      diagnosticOnly: true,
      comparisons: revisionBellPinch,
    },
    selectedSilhouettes: {
      comparisonCount: revisionSilhouettes.rows.length,
      exactCollapses: revisionSilhouettes.exactFailures.length,
      maximumIou: revisionSilhouettes.rows[0]?.iou ?? 0,
      closest: revisionSilhouettes.rows.slice(0, 20),
    },
    stress: {
      minimumCanvasMargin40: revisionStress.minimumMargin,
      failures: revisionStress.failures,
    },
    deferredProductionGates: [
      'route omitted full-body poses to the selected neutral geometry',
      'add matching neutral sleeve, hand, and outline rows to characterLayers',
      'decide whether portraits are arm-bearing or explicitly exempt',
      'regenerate base, mood, employee, unit, and construction-crew export surfaces',
      'verify Unity/runtime neutral-base uptake without adding an animation state',
    ],
  };

  writeSvgAndPng(outDir, 'character-always-on-arms-v3-1', modelSheet(report, captures));
  writeSvgAndPng(outDir, 'character-always-on-arms-room-v3-1', roomAndPropsSheet(report, captures));
  writeFileSync(
    join(outDir, 'character-always-on-arms-v3-1-metrics.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  writeSvgAndPng(
    outDir,
    'character-neutral-arm-fallback-v3-3',
    revisionModelSheet(revisionReport, revisionCaptures),
  );
  writeSvgAndPng(
    outDir,
    'character-neutral-arm-fallback-context-v3-3',
    revisionConfirmationSheet(revisionReport, revisionCaptures),
  );
  writeFileSync(
    join(outDir, 'character-neutral-arm-fallback-v3-3-metrics.json'),
    `${JSON.stringify(revisionReport, null, 2)}\n`,
  );

  console.log(
    `arm contribution: ${visibleChecks}/${arms.checks.length} checks silhouette-visible · ` +
    `minimum ${minimumAddedPixels40}px at 40 px / ${minimumAddedPixels48}px at 48 px`,
  );
  console.log(
    `always-on silhouette collapses: ${silhouettes.exactFailures.length} · ` +
    `high-similarity findings ${silhouettes.highSimilarityFindings.length} · ` +
    `closest ${silhouettes.rows[0]?.pair.join(' / ') ?? 'n/a'} ${silhouettes.rows[0]?.facing ?? 'n/a'} ` +
    `IoU ${(silhouettes.rows[0]?.iou ?? 0).toFixed(3)}`,
  );
  console.log(
    `stress renders: ${stress.count} · failures ${stress.failures.length} · ` +
    `minimum 40 px canvas margin ${stress.minimumMargin}px`,
  );
  console.log(
    `v3.3 selected ${SELECTED_NEUTRAL_REVISION}: ` +
    `${armModelPresence.checks.length - armModelPresence.failures.length}/${armModelPresence.checks.length} authored arm models pass · ` +
    `${occludedProfileChecks.length}/${profileSilhouetteChecks.length} profile checks fully occluded · ` +
    `Bell/Pinch diagnostic ${selectedBellPinch.map((entry) => entry.iou.toFixed(3)).join(' / ')}`,
  );
  console.log(
    `v3.3 stress renders: ${revisionStress.count} · failures ${revisionStress.failures.length} · ` +
    `minimum 40 px canvas margin ${revisionStress.minimumMargin}px`,
  );
  console.log('production compositor restoration: byte-identical');
  console.log(`wrote review-only always-on-arms proofs to ${outDir}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
