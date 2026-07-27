/**
 * Review-only pawn-plus character silhouette proof.
 *
 *   npx tsx scripts/characterPawnPlusPreview.ts [outDir]
 *
 * Candidate bodies, hair, and facial hair are installed only in this process,
 * rendered through the production compositor and pose builders, then restored
 * in a finally block. No canonical part art, schema, or export is changed.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';

import { composeCharacter } from '../src/core/compositor';
import { circle, ellipse } from '../src/core/geometry';
import type {
  BodyAnchorPoint,
  BodyAnchors,
  BodyAnchorSpan,
  BodyFacingAnchors,
  CharacterRecipe,
  Facing,
  PartDef,
  PartVariant,
  StyleSheet,
} from '../src/core/types';
import { DEFAULT_STYLE } from '../src/data/defaults';
import { BODY_ARCHETYPES, type BodyArchetype } from '../src/parts/bodyArchetypes';
import { getPart } from '../src/parts/library';
import type { Pose } from '../src/parts/poses';

type ReviewFacing = 'south' | 'east';
type ReviewPose = 'base' | 'neutral' | 'walk-approach';

export interface BodyCandidate {
  carrier: BodyArchetype['id'];
  label: string;
  construction: string;
  facings: Record<Facing, PartVariant>;
  anchors: BodyAnchors;
}

interface HairCandidate {
  carrier: string;
  label: string;
  construction: string;
  facings: Partial<Record<Facing, PartVariant>>;
}

interface CombinedRecipe {
  id: string;
  label: string;
  body: BodyCandidate['carrier'];
  hair: HairCandidate['carrier'];
  beard?: boolean;
  levers: string;
}

export interface BodySnapshot {
  archetype: BodyArchetype;
  facings: PartDef['facings'];
  partAnchors: BodyAnchors | undefined;
  archetypeAnchors: BodyAnchors;
}

interface PartSnapshot {
  part: PartDef;
  facings: PartDef['facings'];
}

const CANVAS = 128;
const NO_OUTFIT = '__pawn-plus-proof-no-outfit__';
const BEARD_CARRIER = 'acc-earbuds';

const COLORS = {
  page: '#F2EFE7',
  panel: '#FFFEFA',
  panelAlt: '#E8E3D8',
  ink: '#29302E',
  muted: '#68736F',
  grid: '#CEC6B8',
  cream: '#DAD1BA',
  creamLight: '#EEE8D9',
  green: '#345749',
  greenMid: '#6F9386',
  coral: '#B75E4B',
  floor: '#B7AF9A',
  floorDark: '#9F9784',
  chair: '#737971',
} as const;

const PALETTE = {
  skin: '#C68B62',
  hair: '#38271F',
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

const BLACK_STYLE: StyleSheet = {
  ...structuredClone(DEFAULT_STYLE),
  outline: { ...DEFAULT_STYLE.outline, width: 0, color: COLORS.ink },
  render: { ...DEFAULT_STYLE.render, contactShadow: 0 },
};

const point = (x: number, y: number): BodyAnchorPoint => ({ x, y });
const span = (lx: number, ly: number, rx: number, ry: number): BodyAnchorSpan => ({
  left: point(lx, ly),
  right: point(rx, ry),
});

function facingAnchors(
  headX: number,
  headY: number,
  neckX: number,
  neckY: number,
  chestX: number,
  chestY: number,
  hipX: number,
  hipY: number,
  shoulders: BodyAnchorSpan,
  waist: BodyAnchorSpan,
  hem: BodyAnchorSpan,
): BodyFacingAnchors {
  return {
    headCenter: point(headX, headY),
    aboveHead: point(headX, headY - 32),
    neck: point(neckX, neckY),
    chest: point(chestX, chestY),
    hip: point(hipX, hipY),
    shoulders,
    waist,
    hem,
  };
}

function bodyVariant(d: string): PartVariant {
  return { z: 10, shapes: [{ d, fill: '$outfitPrimary' }] };
}

function bodyFacings(south: string, east: string): Record<Facing, PartVariant> {
  return {
    south: bodyVariant(south),
    east: bodyVariant(east),
    north: bodyVariant(south),
  };
}

function bodyAnchors(south: BodyFacingAnchors, east: BodyFacingAnchors): BodyAnchors {
  return { south, east, north: south };
}

export const BODIES: BodyCandidate[] = [
  {
    carrier: 'body-tall',
    label: 'Column',
    construction: 'near-parallel flanks · tight base',
    facings: bodyFacings(
      'M -12 -34 Q 0 -38 12 -34 Q 18 -31 19 -23 L 18 19 Q 18 29 9 30 H -9 Q -18 29 -18 19 L -19 -23 Q -18 -31 -12 -34 Z',
      'M -9 -34 Q 1 -38 11 -34 Q 17 -31 18 -23 L 18 19 Q 16 29 7 30 H -7 Q -14 28 -15 19 L -15 -23 Q -14 -31 -9 -34 Z',
    ),
    anchors: bodyAnchors(
      facingAnchors(
        0, -44, 0, -34, 0, -9, 0, 13,
        span(-18, -24, 18, -24), span(-17, 4, 17, 4), span(-10, 25, 10, 25),
      ),
      facingAnchors(
        2, -44, 0, -34, 1, -9, 1, 13,
        span(-2, -24, 4, -24), span(-14, 4, 16, 4), span(-8, 25, 10, 25),
      ),
    ),
  },
  {
    carrier: 'body-compact',
    label: 'Block',
    construction: 'flat shoulder shelf · broad base',
    facings: bodyFacings(
      'M -18 -29 H 18 Q 28 -29 31 -21 L 30 21 Q 29 30 18 30 H -18 Q -29 30 -30 21 L -31 -21 Q -28 -29 -18 -29 Z',
      'M -15 -29 H 14 Q 23 -28 25 -20 L 25 21 Q 23 30 13 30 H -14 Q -23 29 -23 20 L -24 -20 Q -22 -27 -15 -29 Z',
    ),
    anchors: bodyAnchors(
      facingAnchors(
        0, -40, 0, -29, 0, -5, 0, 14,
        span(-29, -20, 29, -20), span(-29, 5, 29, 5), span(-23, 25, 23, 25),
      ),
      facingAnchors(
        3, -40, 0, -29, 2, -5, 2, 14,
        span(-4, -20, 7, -20), span(-22, 5, 24, 5), span(-17, 25, 19, 25),
      ),
    ),
  },
  {
    carrier: 'body-large-frame',
    label: 'Wedge',
    construction: 'wide shoulder slope · narrow base',
    facings: bodyFacings(
      'M 0 -33 Q -18 -34 -35 -23 Q -38 -20 -34 -14 L -19 22 Q -16 30 -9 30 H 9 Q 16 30 19 22 L 34 -14 Q 38 -20 35 -23 Q 18 -34 0 -33 Z',
      'M -5 -32 Q 5 -35 16 -31 L 29 -22 Q 32 -19 29 -13 L 16 22 Q 13 30 5 30 H -9 Q -17 29 -16 21 L -20 -17 Q -18 -27 -5 -32 Z',
    ),
    anchors: bodyAnchors(
      facingAnchors(
        0, -44, 0, -32, 0, -8, 0, 13,
        span(-33, -21, 33, -21), span(-24, 3, 24, 3), span(-12, 25, 12, 25),
      ),
      facingAnchors(
        3, -44, 0, -32, 3, -8, 3, 13,
        span(-4, -21, 8, -21), span(-17, 3, 22, 3), span(-10, 25, 13, 25),
      ),
    ),
  },
  {
    carrier: 'body-balanced',
    label: 'Barrel',
    construction: 'full middle · pinched shoulder/base',
    facings: bodyFacings(
      'M -13 -29 Q 0 -33 13 -29 Q 24 -26 27 -16 Q 35 -3 32 13 Q 30 26 19 29 Q 9 32 0 29 Q -9 32 -19 29 Q -30 26 -32 13 Q -35 -3 -27 -16 Q -24 -26 -13 -29 Z',
      'M -10 -29 Q 1 -33 12 -29 Q 23 -25 26 -14 Q 32 0 29 14 Q 27 26 17 29 Q 6 32 -4 29 Q -16 29 -20 20 Q -25 7 -22 -7 Q -21 -23 -10 -29 Z',
    ),
    anchors: bodyAnchors(
      facingAnchors(
        0, -41, 0, -29, 0, -5, 0, 14,
        span(-25, -18, 25, -18), span(-31, 4, 31, 4), span(-21, 25, 21, 25),
      ),
      facingAnchors(
        3, -41, 0, -29, 3, -5, 3, 14,
        span(-3, -18, 7, -18), span(-21, 4, 27, 4), span(-14, 25, 18, 25),
      ),
    ),
  },
  {
    carrier: 'body-soft',
    label: 'Bell',
    construction: 'small shoulder · low outward mass',
    facings: bodyFacings(
      'M -10 -28 Q 0 -32 10 -28 Q 20 -25 21 -16 Q 21 -5 27 6 L 34 20 Q 36 28 24 30 H -24 Q -36 28 -34 20 L -27 6 Q -21 -5 -21 -16 Q -20 -25 -10 -28 Z',
      'M -8 -28 Q 1 -32 10 -28 Q 19 -24 20 -15 Q 21 -3 27 9 L 31 20 Q 33 29 21 30 H -17 Q -29 28 -27 19 L -21 7 Q -18 -4 -18 -16 Q -17 -25 -8 -28 Z',
    ),
    anchors: bodyAnchors(
      facingAnchors(
        0, -40, 0, -28, 0, -4, 0, 15,
        span(-20, -17, 20, -17), span(-28, 7, 28, 7), span(-28, 25, 28, 25),
      ),
      facingAnchors(
        3, -40, 0, -28, 3, -4, 3, 15,
        span(-3, -17, 6, -17), span(-20, 7, 27, 7), span(-18, 25, 23, 25),
      ),
    ),
  },
];

/**
 * Focused v2.1 candidate: evolve Bell's monotonic lower flare into a readable
 * shoulder–waist–hip rhythm without adding another body id.
 */
export const PINCH: BodyCandidate = {
  carrier: 'body-soft',
  label: 'Pinch',
  construction: 'moderate shoulder · shallow waist · rounded hip',
  facings: bodyFacings(
    'M -11 -29 Q 0 -33 11 -29 C 20 -27 24 -24 25 -18 C 26 -11 22 -7 20 -3 C 18 1 19 6 22 10 C 25 14 29 16 31 21 C 33 26 29 30 22 30 H -22 C -29 30 -33 26 -31 21 C -29 16 -25 14 -22 10 C -19 6 -18 1 -20 -3 C -22 -7 -26 -11 -25 -18 C -24 -24 -20 -27 -11 -29 Z',
    'M -9 -29 Q 1 -33 11 -29 C 19 -26 22 -23 22 -17 C 23 -11 20 -7 18 -3 C 17 1 18 6 21 10 C 24 14 29 17 30 21 C 32 26 28 30 20 30 H -17 C -24 30 -28 26 -26 21 C -24 17 -20 14 -18 10 C -16 6 -16 1 -18 -3 C -21 -8 -22 -12 -20 -18 C -18 -25 -15 -27 -9 -29 Z',
  ),
  anchors: bodyAnchors(
    facingAnchors(
      0, -41, 0, -29, 0, -6, 0, 11,
      span(-20, -18, 20, -18), span(-19, 4, 19, 4), span(-29, 25, 29, 25),
    ),
    facingAnchors(
      3, -41, 0, -29, 3, -6, 3, 12,
      span(-3, -18, 7, -18), span(-17, 4, 20, 4), span(-24, 25, 28, 25),
    ),
  ),
};

function hairVariant(paths: string[]): PartVariant {
  return {
    z: 50,
    shapes: paths.map((d) => ({ d, fill: '$hair' })),
  };
}

const HAIR: HairCandidate[] = [
  {
    carrier: 'hair-bob',
    label: 'Wide cap',
    construction: 'smooth lateral reach',
    facings: {
      south: hairVariant([
        'M -31 -4 C -29 -18 -17 -25 0 -24 C 17 -25 29 -18 31 -4 Q 27 3 17 5 Q 11 -6 0 -7 Q -11 -6 -17 5 Q -27 3 -31 -4 Z',
      ]),
      east: hairVariant([
        'M -34 -4 Q -28 -21 -5 -24 Q 17 -24 29 -5 Q 30 2 22 7 Q 13 -4 1 -6 L -12 8 L -30 8 Z',
      ]),
      north: hairVariant([
        'M -31 -4 C -29 -18 -17 -25 0 -24 C 17 -25 29 -18 31 -4 L 27 10 H -27 Z',
      ]),
    },
  },
  {
    carrier: 'hair-ponytail',
    label: 'Twin mass',
    construction: 'two ear-line lobes',
    facings: {
      south: hairVariant([
        'M -20 -7 Q -18 -23 0 -24 Q 18 -23 20 -7 L 13 0 Q 7 -7 0 -7 Q -7 -7 -13 0 Z',
        ellipse(-29, 0, 12, 15),
        ellipse(29, 0, 12, 15),
        circle(-20, -2, 5),
        circle(20, -2, 5),
      ]),
      east: hairVariant([
        'M -20 -7 Q -16 -23 1 -24 Q 18 -22 21 -6 L 13 1 Q 5 -7 -4 -7 L -13 1 Z',
        ellipse(-29, 5, 13, 18),
        circle(-17, -2, 5),
      ]),
      north: hairVariant([
        'M -21 -6 Q -18 -23 0 -24 Q 18 -23 21 -6 L 20 9 H -20 Z',
        ellipse(-29, 0, 12, 15),
        ellipse(29, 0, 12, 15),
      ]),
    },
  },
  {
    carrier: 'hair-bun',
    label: 'High crown',
    construction: 'stacked vertical crown',
    facings: {
      south: hairVariant([
        'M -20 -7 Q -18 -23 0 -24 Q 18 -23 20 -7 L 13 1 Q 8 -7 0 -7 Q -8 -7 -13 1 Z',
        ellipse(0, -31, 13, 11),
        ellipse(0, -43, 9, 9),
      ]),
      east: hairVariant([
        'M -20 -7 Q -16 -23 1 -24 Q 18 -22 21 -6 L 13 1 Q 5 -7 -4 -7 L -13 1 Z',
        ellipse(-6, -31, 13, 11),
        ellipse(-7, -43, 9, 9),
      ]),
      north: hairVariant([
        'M -21 -6 Q -18 -23 0 -24 Q 18 -23 21 -6 L 20 9 H -20 Z',
        ellipse(0, -31, 13, 11),
        ellipse(0, -43, 9, 9),
      ]),
    },
  },
  {
    carrier: 'hair-side-part',
    label: 'Jaw drop',
    construction: 'quiet crown · deep jaw',
    facings: {
      south: hairVariant([
        'M -20 -7 Q -12 -23 3 -23 Q 17 -21 21 -8 L 14 0 Q 5 -7 -4 -6 L -15 1 Z',
      ]),
      east: hairVariant([
        'M -20 -7 Q -13 -23 3 -23 Q 17 -21 21 -7 L 13 1 Q 5 -7 -5 -6 L -15 1 Z',
      ]),
      north: hairVariant([
        'M -21 -6 Q -14 -23 3 -23 Q 17 -21 21 -6 L 20 9 H -20 Z',
      ]),
    },
  },
  {
    carrier: 'hair-short',
    label: 'Crest',
    construction: 'single vertical interruption',
    facings: {
      south: hairVariant([
        'M -19 -6 Q -14 -19 0 -20 Q 14 -19 19 -6 L 12 1 Q 6 -6 0 -6 Q -6 -6 -12 1 Z',
        'M -8 -15 Q -5 -32 2 -42 Q 11 -34 10 -18 L 7 -8 Z',
      ]),
      east: hairVariant([
        'M -20 -6 Q -14 -20 1 -21 Q 16 -19 20 -6 L 12 1 Q 4 -7 -5 -6 L -14 1 Z',
        'M -16 -14 L -12 -31 L -3 -40 L 6 -32 L 13 -15 L 7 -8 Z',
      ]),
      north: hairVariant([
        'M -20 -5 Q -15 -20 0 -21 Q 15 -20 20 -5 L 19 9 H -19 Z',
        'M -8 -15 Q -5 -32 2 -42 Q 11 -34 10 -18 L 7 -8 Z',
      ]),
    },
  },
  {
    carrier: 'hair-coils',
    label: 'Cloud',
    construction: 'broad scalloped crown',
    facings: {
      south: hairVariant([
        circle(-25, -4, 10),
        circle(-19, -15, 11),
        circle(-8, -22, 11),
        circle(4, -24, 12),
        circle(16, -19, 11),
        circle(25, -8, 10),
        circle(-27, 7, 9),
        circle(27, 4, 9),
      ]),
      east: hairVariant([
        circle(-25, -4, 11),
        circle(-20, -16, 11),
        circle(-9, -23, 12),
        circle(4, -24, 12),
        circle(16, -17, 11),
        circle(24, -6, 9),
        circle(-27, 7, 9),
      ]),
      north: hairVariant([
        circle(-24, -4, 10),
        circle(-18, -15, 11),
        circle(-7, -22, 11),
        circle(5, -23, 12),
        circle(17, -17, 11),
        circle(25, -6, 10),
      ]),
    },
  },
];

const BEARD_FACINGS: Partial<Record<Facing, PartVariant>> = {
  south: {
    z: 55,
    shapes: [{
      d: 'M -18 5 Q -20 17 -14 25 Q -8 32 0 35 Q 8 32 14 25 Q 20 17 18 5 Q 12 14 0 15 Q -12 14 -18 5 Z',
      fill: '$hair',
    }],
  },
  east: {
    z: 55,
    shapes: [{
      d: 'M 4 5 Q 17 7 22 15 Q 20 25 9 34 Q -1 32 -7 27 Q 2 22 3 13 Z',
      fill: '$hair',
    }],
  },
  north: { z: 55, shapes: [] },
};

const RECIPES: CombinedRecipe[] = [
  {
    id: 'wide-cap',
    label: 'Wide Cap',
    body: 'body-compact',
    hair: 'hair-bob',
    levers: 'low + wide / smooth crown / broad base',
  },
  {
    id: 'twin-mass',
    label: 'Twin Mass',
    body: 'body-tall',
    hair: 'hair-ponytail',
    levers: 'lateral lobes / narrow vertical hull',
  },
  {
    id: 'high-crown',
    label: 'High Crown',
    body: 'body-soft',
    hair: 'hair-bun',
    levers: 'top height / narrow shoulder / low flare',
  },
  {
    id: 'jaw-drop',
    label: 'Jaw Drop',
    body: 'body-large-frame',
    hair: 'hair-side-part',
    beard: true,
    levers: 'jaw depth / exposed crown / shoulder taper',
  },
  {
    id: 'crest',
    label: 'Crest',
    body: 'body-tall',
    hair: 'hair-short',
    levers: 'vertical spike / same Column as Twin Mass',
  },
  {
    id: 'cloud',
    label: 'Cloud',
    body: 'body-balanced',
    hair: 'hair-coils',
    levers: 'scalloped width / full middle / tight base',
  },
];

const PINCH_PRESENTATIONS: CombinedRecipe[] = [
  {
    id: 'pinch-high-crown',
    label: 'Pinch + High Crown',
    body: 'body-soft',
    hair: 'hair-bun',
    levers: 'feminine-leaning combination',
  },
  {
    id: 'pinch-beard',
    label: 'Pinch + Beard',
    body: 'body-soft',
    hair: 'hair-side-part',
    beard: true,
    levers: 'same body · different presentation',
  },
  {
    id: 'barrel-high-crown',
    label: 'Barrel + High Crown',
    body: 'body-balanced',
    hair: 'hair-bun',
    levers: 'same crown · different body',
  },
];

function text(
  x: number,
  y: number,
  value: string,
  size = 13,
  weight = 400,
  fill: string = COLORS.ink,
  anchor: 'start' | 'middle' = 'start',
): string {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="system-ui, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${value}</text>`;
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

function recipeFor(entry: CombinedRecipe, black = false): CharacterRecipe {
  return {
    id: `pawn-plus-${entry.id}`,
    name: entry.label,
    parts: {
      body: entry.body,
      head: 'head-round',
      hair: entry.hair,
      outfit: NO_OUTFIT,
      accessories: entry.beard ? [BEARD_CARRIER] : [],
    },
    palette: black ? BLACK_PALETTE : PALETTE,
  };
}

function bodyOnlyRecipe(body: string): CharacterRecipe {
  return {
    id: `pawn-plus-body-only-${body}`,
    name: body,
    parts: {
      body,
      head: 'head-round',
      hair: 'hair-none',
      outfit: NO_OUTFIT,
      accessories: [],
    },
    palette: BLACK_PALETTE,
  };
}

function characterSvg(
  entry: CombinedRecipe,
  facing: ReviewFacing,
  pose: ReviewPose,
  black = false,
  pixelSize = CANVAS,
): string {
  return composeCharacter(
    recipeFor(entry, black),
    black ? BLACK_STYLE : COLOR_STYLE,
    facing,
    pixelSize,
    'normal',
    {
      badge: false,
      ...(pose === 'base' ? {} : { pose: pose as Pose }),
    },
  );
}

function bodyOnlySvg(body: string, facing: ReviewFacing, pixelSize = CANVAS): string {
  return composeCharacter(
    bodyOnlyRecipe(body),
    BLACK_STYLE,
    facing,
    pixelSize,
    'normal',
    { badge: false },
  );
}

function placedSvg(svg: string, x: number, y: number, size: number): string {
  return `<g transform="translate(${x} ${y}) scale(${size / CANVAS})">${svgInner(svg)}</g>`;
}

function figure(
  entry: CombinedRecipe,
  facing: ReviewFacing,
  pose: ReviewPose,
  x: number,
  y: number,
  size: number,
  black = false,
): string {
  return placedSvg(characterSvg(entry, facing, pose, black), x, y, size);
}

function bodyFigure(svg: string, x: number, y: number, size: number): string {
  return placedSvg(svg, x, y, size);
}

function bodyCandidateFor(id: BodyCandidate['carrier']): BodyCandidate {
  const candidate = BODIES.find((entry) => entry.carrier === id);
  if (!candidate) throw new Error(`Missing body candidate ${id}`);
  return candidate;
}

function plainBodyEntry(body: BodyCandidate['carrier'], id: string = body): CombinedRecipe {
  return {
    id: `plain-${id}`,
    label: id,
    body,
    hair: 'hair-none',
    levers: '',
  };
}

function capturePlainBodyStates(body: BodyCandidate['carrier']): Map<string, string> {
  const entry = plainBodyEntry(body);
  const states = new Map<string, string>();
  for (const facing of ['south', 'east'] as const) {
    for (const pose of ['base', 'neutral', 'walk-approach'] as const) {
      for (const black of [false, true] as const) {
        states.set(`${facing}/${pose}/${black ? 'black' : 'color'}`, characterSvg(entry, facing, pose, black));
      }
    }
  }
  return states;
}

function requiredCell(cells: ReadonlyMap<string, string>, key: string): string {
  const value = cells.get(key);
  if (!value) throw new Error(`Missing proof cell ${key}`);
  return value;
}

function captureCurrentBodyCells(): Map<string, string> {
  const cells = new Map<string, string>();
  for (const archetype of BODY_ARCHETYPES) {
    for (const facing of ['south', 'east'] as const) {
      cells.set(`${archetype.id}/${facing}`, bodyOnlySvg(archetype.id, facing));
    }
  }
  return cells;
}

export function installSingleBodyCandidate(candidate: BodyCandidate): BodySnapshot {
  const archetype = BODY_ARCHETYPES.find((entry) => entry.id === candidate.carrier);
  if (!archetype) throw new Error(`Missing body carrier ${candidate.carrier}`);
  if (getPart(candidate.carrier) !== archetype.part) {
    throw new Error(`Body carrier ${candidate.carrier} is not the registered archetype object`);
  }
  const snapshot: BodySnapshot = {
    archetype,
    facings: archetype.part.facings,
    partAnchors: archetype.part.bodyAnchors,
    archetypeAnchors: archetype.anchors,
  };
  archetype.part.facings = candidate.facings;
  archetype.part.bodyAnchors = candidate.anchors;
  archetype.anchors = candidate.anchors;
  return snapshot;
}

export function restoreSingleBodyCandidate(snapshot: BodySnapshot): void {
  snapshot.archetype.part.facings = snapshot.facings;
  snapshot.archetype.part.bodyAnchors = snapshot.partAnchors;
  snapshot.archetype.anchors = snapshot.archetypeAnchors;
}

function snapshotAndInstallProofParts(): {
  bodies: BodySnapshot[];
  hair: PartSnapshot[];
  beard: PartSnapshot;
} {
  const bodies = BODIES.map((candidate) => {
    const archetype = BODY_ARCHETYPES.find((entry) => entry.id === candidate.carrier);
    if (!archetype) throw new Error(`Missing body carrier ${candidate.carrier}`);
    if (getPart(candidate.carrier) !== archetype.part) {
      throw new Error(`Body carrier ${candidate.carrier} is not the registered archetype object`);
    }
    const snapshot: BodySnapshot = {
      archetype,
      facings: archetype.part.facings,
      partAnchors: archetype.part.bodyAnchors,
      archetypeAnchors: archetype.anchors,
    };
    archetype.part.facings = candidate.facings;
    archetype.part.bodyAnchors = candidate.anchors;
    archetype.anchors = candidate.anchors;
    return snapshot;
  });

  const hair = HAIR.map((candidate) => {
    const part = getPart(candidate.carrier);
    if (!part) throw new Error(`Missing hair carrier ${candidate.carrier}`);
    const snapshot: PartSnapshot = { part, facings: part.facings };
    part.facings = candidate.facings;
    return snapshot;
  });

  const beardPart = getPart(BEARD_CARRIER);
  if (!beardPart) throw new Error(`Missing beard carrier ${BEARD_CARRIER}`);
  const beard = { part: beardPart, facings: beardPart.facings };
  beardPart.facings = BEARD_FACINGS;

  return { bodies, hair, beard };
}

function restoreProofParts(snapshots: {
  bodies: BodySnapshot[];
  hair: PartSnapshot[];
  beard: PartSnapshot;
}): void {
  for (const snapshot of snapshots.bodies) {
    snapshot.archetype.part.facings = snapshot.facings;
    snapshot.archetype.part.bodyAnchors = snapshot.partAnchors;
    snapshot.archetype.anchors = snapshot.archetypeAnchors;
  }
  for (const snapshot of snapshots.hair) snapshot.part.facings = snapshot.facings;
  snapshots.beard.part.facings = snapshots.beard.facings;
}

function directionSheet(currentBodies: ReadonlyMap<string, string>): string {
  const width = 1640;
  const height = 1370;
  const parts: string[] = [`<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`];

  parts.push(text(30, 40, 'Character pawn-plus · animation-safe silhouette proof v2', 25, 760));
  parts.push(text(
    30,
    68,
    'REVIEW ONLY · one fixed head and palette · candidate parts are process-local · production art remains untouched',
    13,
    650,
    COLORS.coral,
  ));

  const costBoxes = [
    ['0', 'new animation frames', 'static silhouette work only'],
    ['1', 'continuous grounded hull', 'no legs, feet, or gait cycle'],
    ['2', 'generated poses sampled', 'neutral + walk · full 15-pose audit deferred'],
    ['2', 'source facings reviewed', 'south + east · west mirrors east · north deferred'],
  ] as const;
  costBoxes.forEach(([number, label, note], index) => {
    const x = 30 + index * 397;
    parts.push(panel(x, 88, 375, 70, index === 2 ? '#E4ECE5' : COLORS.panel));
    parts.push(text(x + 18, 127, number, 28, 800, index === 2 ? COLORS.green : COLORS.coral));
    parts.push(text(x + 60, 125, label, 13, 650, COLORS.ink));
    parts.push(text(x + 60, 144, note, 10, 500, COLORS.muted));
  });

  parts.push(panel(30, 176, 1580, 150));
  parts.push(text(48, 204, 'Body envelope check · same round head · no hair · no pose arms · 40 px', 15, 720));
  parts.push(text(48, 230, 'Current production', 11, 700, COLORS.muted));
  parts.push(text(826, 230, 'Pawn-plus fused masses', 11, 700, COLORS.green));
  BODY_ARCHETYPES.forEach((archetype, index) => {
    const x = 184 + index * 118;
    const svg = currentBodies.get(`${archetype.id}/south`);
    if (!svg) throw new Error(`Missing current body cell ${archetype.id}`);
    parts.push(panel(x, 216, 66, 86, COLORS.panelAlt, 6));
    parts.push(bodyFigure(svg, x + 13, 222, 40));
    parts.push(text(x + 33, 292, archetype.label.replace('-frame', ''), 9, 600, COLORS.muted, 'middle'));
  });
  BODIES.forEach((body, index) => {
    const x = 934 + index * 126;
    parts.push(panel(x, 216, 72, 86, '#F2F6F1', 6));
    parts.push(bodyFigure(bodyOnlySvg(body.carrier, 'south'), x + 16, 222, 40));
    parts.push(text(x + 36, 292, body.label, 9, 650, COLORS.green, 'middle'));
  });
  parts.push(text(48, 316, 'The body layer stays a single rigid mass; the procedural pose layer supplies every visible arm.', 10, 550, COLORS.muted));

  parts.push(text(30, 360, 'Combined identity recipes', 19, 760));
  parts.push(text(30, 382, 'The repeated Column body in Twin Mass and Crest is intentional: head anchors must create identity without bespoke anatomy.', 11, 500, COLORS.muted));

  const headers = [
    [362, 'rigid core'],
    [582, 'generated neutral'],
    [782, 'generated walk'],
    [1002, 'neutral · 40 px'],
    [1142, 'walk · 40 px'],
    [1280, 'desk crop'],
    [1457, 'silhouette levers'],
  ] as const;
  headers.forEach(([x, label]) => parts.push(text(x, 412, label, 10, 700, COLORS.muted, 'middle')));
  parts.push(text(352, 426, 'S', 9, 700, COLORS.muted, 'middle'));
  parts.push(text(457, 426, 'E', 9, 700, COLORS.muted, 'middle'));
  parts.push(text(570, 426, 'S', 9, 700, COLORS.muted, 'middle'));
  parts.push(text(660, 426, 'E', 9, 700, COLORS.muted, 'middle'));
  parts.push(text(770, 426, 'S', 9, 700, COLORS.muted, 'middle'));
  parts.push(text(860, 426, 'E', 9, 700, COLORS.muted, 'middle'));
  parts.push(text(985, 426, 'S', 9, 700, COLORS.muted, 'middle'));
  parts.push(text(1050, 426, 'E', 9, 700, COLORS.muted, 'middle'));
  parts.push(text(1125, 426, 'S', 9, 700, COLORS.muted, 'middle'));
  parts.push(text(1190, 426, 'E', 9, 700, COLORS.muted, 'middle'));

  RECIPES.forEach((entry, row) => {
    const y = 438 + row * 142;
    const body = bodyCandidateFor(entry.body);
    const hair = HAIR.find((candidate) => candidate.carrier === entry.hair);
    if (!hair) throw new Error(`Missing hair candidate ${entry.hair}`);
    const fill = row % 2 === 0 ? COLORS.panel : COLORS.panelAlt;
    parts.push(`<rect x="20" y="${y}" width="1590" height="132" rx="9" fill="${fill}"/>`);
    parts.push(text(38, y + 31, `${row + 1} · ${entry.label}`, 17, 760));
    parts.push(text(38, y + 53, `${body.label} + ${hair.label}${entry.beard ? ' + beard' : ''}`, 11, 650, COLORS.green));
    parts.push(text(38, y + 75, body.construction, 10, 500, COLORS.muted));
    parts.push(text(38, y + 92, hair.construction, 10, 500, COLORS.muted));

    for (const [facing, x] of [['south', 310], ['east', 415]] as const) {
      parts.push(panel(x, y + 10, 92, 108, COLORS.panel, 6));
      parts.push(figure(entry, facing, 'base', x + 6, y + 20, 80));
    }
    for (const [facing, x] of [['south', 530], ['east', 620]] as const) {
      parts.push(panel(x, y + 22, 76, 84, COLORS.panel, 6));
      parts.push(figure(entry, facing, 'neutral', x + 6, y + 32, 64));
    }
    for (const [facing, x] of [['south', 730], ['east', 820]] as const) {
      parts.push(panel(x, y + 22, 76, 84, COLORS.panel, 6));
      parts.push(figure(entry, facing, 'walk-approach', x + 6, y + 32, 64));
    }
    for (const [facing, x] of [['south', 960], ['east', 1025]] as const) {
      parts.push(panel(x, y + 34, 56, 62, COLORS.panel, 6));
      parts.push(figure(entry, facing, 'neutral', x + 8, y + 44, 40, true));
    }
    for (const [facing, x] of [['south', 1100], ['east', 1165]] as const) {
      parts.push(panel(x, y + 34, 56, 62, COLORS.panel, 6));
      parts.push(figure(entry, facing, 'walk-approach', x + 8, y + 44, 40, true));
    }
    parts.push(panel(1250, y + 25, 66, 80, COLORS.panel, 6));
    parts.push(figure(entry, row % 2 === 0 ? 'south' : 'east', 'neutral', 1259, y + 31, 48, true));
    parts.push(`<rect x="1251" y="${y + 72}" width="64" height="32" fill="${COLORS.green}"/>`);
    parts.push(text(1340, y + 44, entry.levers, 10, 650, COLORS.ink));
    parts.push(text(
      1340,
      y + 66,
      row === 1 || row === 4 ? 'same body · different head envelope' : 'orthogonal body + head envelope',
      9,
      500,
      COLORS.muted,
    ));
    if (entry.beard) parts.push(text(1340, y + 85, 'facial hair is one rigid head attachment', 9, 650, COLORS.coral));
  });

  parts.push(text(30, 1318, 'Gate', 15, 760));
  parts.push(text(
    88,
    1318,
    'match all six across south/east and neutral/walk · reacquire at least five behind the desk crop · keep Twin Mass and Crest distinct despite sharing one body',
    11,
    550,
    COLORS.muted,
  ));
  parts.push(text(30, 1348, 'Approval changes the static part vocabulary, not the runtime animation model.', 13, 700, COLORS.green));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function roomShell(x: number, y: number, width: number, height: number): string {
  const floorX = x + 34;
  const floorY = y + 60;
  const floorW = width - 68;
  const floorH = height - 96;
  const parts: string[] = [];
  parts.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="12" fill="${COLORS.panel}" stroke="${COLORS.grid}"/>`);
  parts.push(`<rect x="${floorX}" y="${floorY}" width="${floorW}" height="${floorH}" fill="${COLORS.floor}"/>`);
  for (let gx = floorX; gx <= floorX + floorW; gx += 48) {
    parts.push(`<path d="M ${gx} ${floorY} V ${floorY + floorH}" stroke="${COLORS.floorDark}" stroke-width="1" opacity="0.3"/>`);
  }
  for (let gy = floorY; gy <= floorY + floorH; gy += 48) {
    parts.push(`<path d="M ${floorX} ${gy} H ${floorX + floorW}" stroke="${COLORS.floorDark}" stroke-width="1" opacity="0.3"/>`);
  }
  parts.push(`<path d="M ${floorX} ${floorY + floorH} V ${floorY - 20} H ${floorX + floorW}" fill="none" stroke="${COLORS.ink}" stroke-width="18" stroke-linejoin="round"/>`);
  parts.push(`<path d="M ${floorX} ${floorY + floorH} V ${floorY - 20} H ${floorX + floorW}" fill="none" stroke="${COLORS.cream}" stroke-width="12" stroke-linejoin="round"/>`);
  parts.push(`<path d="M ${floorX - 6} ${floorY + floorH} H ${floorX + floorW + 6}" stroke="${COLORS.ink}" stroke-width="14"/>`);
  parts.push(`<path d="M ${floorX - 2} ${floorY + floorH - 4} H ${floorX + floorW + 2}" stroke="${COLORS.green}" stroke-width="7"/>`);
  parts.push(`<path d="M ${floorX} ${floorY + floorH - 10} H ${floorX + floorW}" stroke="${COLORS.coral}" stroke-width="3"/>`);
  return parts.join('');
}

function chair(x: number, y: number): string {
  return [
    `<ellipse cx="${x}" cy="${y + 9}" rx="18" ry="11" fill="${COLORS.ink}"/>`,
    `<ellipse cx="${x}" cy="${y + 7}" rx="14" ry="8" fill="${COLORS.chair}"/>`,
    `<path d="M ${x} ${y + 15} V ${y + 27} M ${x - 10} ${y + 27} H ${x + 10}" stroke="${COLORS.ink}" stroke-width="4" stroke-linecap="round"/>`,
  ].join('');
}

function desk(x: number, y: number, width = 112): string {
  return [
    `<rect x="${x}" y="${y}" width="${width}" height="38" rx="7" fill="${COLORS.ink}"/>`,
    `<rect x="${x + 4}" y="${y + 3}" width="${width - 8}" height="24" rx="5" fill="${COLORS.cream}"/>`,
    `<path d="M ${x + 5} ${y + 23} H ${x + width - 5} V ${y + 40} H ${x + 5} Z" fill="${COLORS.green}"/>`,
    `<rect x="${x + width - 22}" y="${y + 29}" width="11" height="5" rx="2" fill="${COLORS.coral}"/>`,
  ].join('');
}

function roomSheet(): string {
  const width = 1600;
  const height = 1080;
  const parts: string[] = [`<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`];
  parts.push(text(30, 40, 'Character pawn-plus · compact room and blind gate v2', 25, 760));
  parts.push(text(
    30,
    68,
    'REVIEW ONLY · same palette · 48–56 px room figures · compositor-generated neutral/walk arms · no names or props',
    13,
    650,
    COLORS.coral,
  ));

  const roomX = 24;
  const roomY = 98;
  parts.push(roomShell(roomX, roomY, 980, 850));
  parts.push(text(52, roomY + 30, 'Schematic QuotaCo office · furniture occlusion + repeated scale', 15, 720));

  const placements = [
    { entry: RECIPES[0], facing: 'south' as const, pose: 'neutral' as const, x: 152, y: 208, size: 56 },
    { entry: RECIPES[1], facing: 'east' as const, pose: 'walk-approach' as const, x: 352, y: 354, size: 52 },
    { entry: RECIPES[2], facing: 'south' as const, pose: 'neutral' as const, x: 584, y: 190, size: 54 },
    { entry: RECIPES[3], facing: 'east' as const, pose: 'neutral' as const, x: 752, y: 414, size: 56 },
    { entry: RECIPES[4], facing: 'south' as const, pose: 'walk-approach' as const, x: 474, y: 552, size: 52 },
    { entry: RECIPES[5], facing: 'east' as const, pose: 'walk-approach' as const, x: 790, y: 690, size: 56 },
  ];

  const furniture = [
    { x: 126, y: 245, width: 116 },
    { x: 328, y: 390, width: 116 },
    { x: 558, y: 226, width: 116 },
    { x: 726, y: 452, width: 116 },
    { x: 450, y: 588, width: 116 },
  ];
  furniture.forEach((item) => parts.push(chair(item.x + item.width / 2, item.y + 42)));
  placements.forEach(({ entry, facing, pose, x, y, size }) => {
    parts.push(figure(entry, facing, pose, x, y, size));
  });
  furniture.forEach((item) => parts.push(desk(item.x, item.y, item.width)));

  parts.push(text(72, 870, 'Five figures are desk-occluded; one is clear-floor. All retain a glide-compatible single ground mass.', 11, 600, COLORS.muted));

  const testX = 1030;
  parts.push(panel(testX, roomY, 546, 850));
  parts.push(text(testX + 24, roomY + 38, 'Blind matching', 16, 740));
  parts.push(text(testX + 24, roomY + 61, 'Reordered rows · literal 40 px silhouettes', 11, 500, COLORS.muted));

  const rows: Array<{
    label: string;
    facing: ReviewFacing;
    pose: ReviewPose;
    order: number[];
  }> = [
    { label: 'South · neutral', facing: 'south', pose: 'neutral', order: [4, 0, 5, 2, 1, 3] },
    { label: 'East · neutral', facing: 'east', pose: 'neutral', order: [2, 5, 1, 3, 0, 4] },
    { label: 'South · walk', facing: 'south', pose: 'walk-approach', order: [1, 3, 4, 0, 5, 2] },
  ];
  rows.forEach((row, rowIndex) => {
    const y = roomY + 104 + rowIndex * 142;
    parts.push(text(testX + 24, y, row.label, 11, 700, COLORS.green));
    row.order.forEach((recipeIndex, index) => {
      const x = testX + 24 + index * 82;
      parts.push(panel(x, y + 14, 64, 74, rowIndex % 2 ? COLORS.panelAlt : COLORS.panel, 6));
      parts.push(figure(RECIPES[recipeIndex], row.facing, row.pose, x + 12, y + 24, 40, true));
    });
  });

  const cropY = roomY + 540;
  parts.push(text(testX + 24, cropY, 'Desk-height crop · alternating facings', 11, 700, COLORS.green));
  [3, 0, 4, 2, 5, 1].forEach((recipeIndex, index) => {
    const x = testX + 24 + index * 82;
    parts.push(panel(x, cropY + 14, 64, 84, COLORS.panel, 6));
    parts.push(figure(
      RECIPES[recipeIndex],
      index % 2 === 0 ? 'south' : 'east',
      'neutral',
      x + 8,
      cropY + 21,
      48,
      true,
    ));
    parts.push(`<rect x="${x + 1}" y="${cropY + 59}" width="62" height="38" fill="${COLORS.green}"/>`);
  });

  parts.push(panel(testX + 24, roomY + 694, 498, 118, '#E4ECE5', 7));
  parts.push(text(testX + 40, roomY + 724, 'Animation budget read', 12, 760, COLORS.green));
  parts.push(text(testX + 40, roomY + 750, 'Hair + beard: rigid head attachments', 11, 600));
  parts.push(text(testX + 40, roomY + 772, 'Body: one continuous mass with stable ground contact', 11, 600));
  parts.push(text(testX + 40, roomY + 794, 'Arms: existing anchor-generated pose layer', 11, 600));

  parts.push(text(30, 1002, 'Review questions', 15, 760));
  parts.push(text(
    30,
    1030,
    'Can you reacquire each person after desk occlusion? Do south/east and neutral/walk remain the same identity? Is this enough distinction without adding a gait system?',
    11,
    550,
    COLORS.muted,
  ));
  parts.push(text(30, 1058, 'Passing this visual gate would authorize a static part-art pass only.', 12, 700, COLORS.coral));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function pinchDecisionSheet(
  bellVocabulary: ReadonlyMap<string, string>,
  pinchVocabulary: ReadonlyMap<string, string>,
  bellStates: ReadonlyMap<string, string>,
): string {
  const width = 1600;
  const height = 930;
  const parts: string[] = [`<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`];
  const pinchPlain = plainBodyEntry('body-soft', 'pinch');

  parts.push(text(30, 40, 'Body vocabulary · Bell ↔ Pinch count decision proof v2.1', 25, 760));
  parts.push(text(
    30,
    68,
    'REVIEW ONLY · compare replacement versus sixth foundation · same round head and palette · no production change',
    13,
    650,
    COLORS.coral,
  ));

  const costBoxes = [
    ['5–6', 'body-count decision', 'replace Bell or retain both'],
    ['2', 'lower-body axes', 'Bell lower-heavy · Pinch waist-to-hip'],
    ['0', 'new animation frames', 'existing anchor-generated arms'],
    ['2', 'poses sampled', 'neutral + walk · south + east'],
  ] as const;
  costBoxes.forEach(([number, label, note], index) => {
    const x = 30 + index * 397;
    const labelX = x + (index === 0 ? 90 : 60);
    parts.push(panel(x, 88, 375, 70, index === 1 ? '#E4ECE5' : COLORS.panel));
    parts.push(text(x + 18, 127, number, 28, 800, index === 1 ? COLORS.green : COLORS.coral));
    parts.push(text(labelX, 125, label, 13, 650));
    parts.push(text(labelX, 144, note, 10, 500, COLORS.muted));
  });

  parts.push(panel(30, 176, 1540, 228));
  parts.push(text(48, 205, 'Coverage alternatives · paired south/east · body-only · literal 40 px', 15, 730));
  parts.push(text(
    48,
    225,
    'The pixels decide whether Pinch supersedes Bell or deserves one additional static foundation.',
    10,
    500,
    COLORS.muted,
  ));

  BODIES.forEach((body, index) => {
    const x = 420 + index * 220;
    parts.push(text(
      x + 69,
      238,
      body.carrier === 'body-soft' ? 'Bell / Pinch' : body.label,
      10,
      700,
      body.carrier === 'body-soft' ? COLORS.coral : COLORS.muted,
      'middle',
    ));
  });

  const vocabularyRows = [
    {
      label: 'Bell vocabulary',
      note: 'retain lower-heavy / pear-like mass',
      cells: bellVocabulary,
      y: 247,
      fill: COLORS.panelAlt,
    },
    {
      label: 'Pinch vocabulary',
      note: 'substitute shoulder → waist → hip → base',
      cells: pinchVocabulary,
      y: 326,
      fill: '#F2F6F1',
    },
  ] as const;
  vocabularyRows.forEach((row) => {
    parts.push(text(48, row.y + 29, row.label, 13, 720, row.label.startsWith('Pinch') ? COLORS.green : COLORS.ink));
    parts.push(text(48, row.y + 47, row.note, 10, 500, COLORS.muted));
    BODIES.forEach((body, index) => {
      const x = 420 + index * 220;
      parts.push(panel(x, row.y, 138, 66, row.fill, 6));
      parts.push(bodyFigure(requiredCell(row.cells, `${body.carrier}/south`), x + 20, row.y + 10, 40));
      parts.push(bodyFigure(requiredCell(row.cells, `${body.carrier}/east`), x + 78, row.y + 10, 40));
      parts.push(text(x + 39, row.y + 61, 'S', 8, 650, COLORS.muted, 'middle'));
      parts.push(text(x + 97, row.y + 61, 'E', 8, 650, COLORS.muted, 'middle'));
    });
  });

  const compareX = 30;
  const compareY = 424;
  parts.push(panel(compareX, compareY, 500, 420));
  parts.push(text(compareX + 20, compareY + 32, 'Contour decision · same head, no hair or arms', 14, 730));
  parts.push(text(compareX + 20, compareY + 52, 'Bell keeps one outward slope; Pinch adds a distinct shallow waist and hip return.', 10, 500, COLORS.muted));

  const largeGroups = [
    { label: 'Bell', x: compareX + 34, states: bellStates, live: false },
    { label: 'Pinch', x: compareX + 264, states: bellStates, live: true },
  ] as const;
  largeGroups.forEach((group) => {
    parts.push(text(group.x + 96, compareY + 82, group.label, 14, 750, group.live ? COLORS.green : COLORS.ink, 'middle'));
    for (const [facing, offset] of [['south', 0], ['east', 106]] as const) {
      parts.push(panel(group.x + offset, compareY + 94, 98, 128, group.live ? '#F2F6F1' : COLORS.panelAlt, 6));
      const svg = group.live
        ? characterSvg(pinchPlain, facing, 'base')
        : requiredCell(group.states, `${facing}/base/color`);
      parts.push(placedSvg(svg, group.x + offset + 1, compareY + 104, 96));
      parts.push(text(group.x + offset + 49, compareY + 215, facing === 'south' ? 'S' : 'E', 8, 650, COLORS.muted, 'middle'));
    }
  });

  parts.push(text(compareX + 24, compareY + 256, '40 px black control', 10, 700, COLORS.muted));
  for (const [groupIndex, group] of largeGroups.entries()) {
    for (const [facingIndex, facing] of (['south', 'east'] as const).entries()) {
      const x = compareX + 128 + groupIndex * 150 + facingIndex * 60;
      parts.push(panel(x, compareY + 272, 52, 58, COLORS.panel, 5));
      const svg = group.live
        ? characterSvg(pinchPlain, facing, 'base', true)
        : requiredCell(group.states, `${facing}/base/black`);
      parts.push(placedSvg(svg, x + 6, compareY + 280, 40));
    }
  }
  parts.push(text(compareX + 24, compareY + 358, 'Pinch construction', 11, 740, COLORS.green));
  parts.push(text(compareX + 24, compareY + 379, 'moderate shoulder · 2–3 px waist return · rounded hip · narrower grounded base', 10, 550, COLORS.ink));
  parts.push(text(compareX + 24, compareY + 402, 'No chest/bust protrusion, limb gap, or gender assignment is authored into the hull.', 10, 550, COLORS.muted));

  const poseX = 550;
  parts.push(panel(poseX, compareY, 400, 420));
  parts.push(text(poseX + 20, compareY + 32, 'Existing rig sample · Pinch', 14, 730));
  parts.push(text(poseX + 20, compareY + 52, 'Visible arms are generated from the retuned shoulder and hip anchors.', 10, 500, COLORS.muted));
  const poseCells = [
    { facing: 'south' as const, pose: 'neutral' as const, label: 'neutral S' },
    { facing: 'east' as const, pose: 'neutral' as const, label: 'neutral E' },
    { facing: 'south' as const, pose: 'walk-approach' as const, label: 'walk S' },
    { facing: 'east' as const, pose: 'walk-approach' as const, label: 'walk E' },
  ];
  poseCells.forEach((cell, index) => {
    const x = poseX + 20 + index * 92;
    parts.push(panel(x, compareY + 76, 78, 100, COLORS.panel, 6));
    parts.push(figure(pinchPlain, cell.facing, cell.pose, x + 7, compareY + 87, 64));
    parts.push(text(x + 39, compareY + 167, cell.label, 8, 650, COLORS.muted, 'middle'));
  });
  parts.push(text(poseX + 20, compareY + 210, 'Literal 40 px', 10, 700, COLORS.muted));
  poseCells.forEach((cell, index) => {
    const x = poseX + 20 + index * 92;
    parts.push(panel(x, compareY + 224, 58, 64, COLORS.panelAlt, 5));
    parts.push(figure(pinchPlain, cell.facing, cell.pose, x + 9, compareY + 234, 40, true));
  });
  parts.push(panel(poseX + 20, compareY + 316, 360, 78, '#E4ECE5', 6));
  parts.push(text(poseX + 36, compareY + 342, 'Animation implication', 11, 740, COLORS.green));
  parts.push(text(poseX + 36, compareY + 363, 'same fused glide hull · same pose generator · anchor-clearance QA only', 10, 600));
  parts.push(text(poseX + 36, compareY + 382, 'The other 13 poses and north facing remain deferred promotion checks.', 9, 500, COLORS.muted));

  const expressionX = 970;
  parts.push(panel(expressionX, compareY, 600, 420));
  parts.push(text(expressionX + 20, compareY + 32, 'Presentation decoupling', 14, 730));
  parts.push(text(
    expressionX + 20,
    compareY + 52,
    'The body may lean feminine in one combination without becoming a female-only body.',
    10,
    500,
    COLORS.muted,
  ));
  PINCH_PRESENTATIONS.forEach((entry, index) => {
    const x = expressionX + 18 + index * 190;
    parts.push(panel(x, compareY + 76, 176, 302, index === 0 ? '#F2F6F1' : COLORS.panel, 6));
    parts.push(text(x + 88, compareY + 101, entry.label, 11, 720, index === 0 ? COLORS.green : COLORS.ink, 'middle'));
    parts.push(figure(entry, 'south', 'neutral', x + 14, compareY + 118, 64));
    parts.push(figure(entry, 'east', 'neutral', x + 96, compareY + 118, 64));
    parts.push(text(x + 46, compareY + 196, 'S', 8, 650, COLORS.muted, 'middle'));
    parts.push(text(x + 128, compareY + 196, 'E', 8, 650, COLORS.muted, 'middle'));
    parts.push(text(x + 88, compareY + 224, entry.levers, 9, 600, COLORS.muted, 'middle'));
    parts.push(panel(x + 17, compareY + 243, 58, 64, COLORS.panelAlt, 5));
    parts.push(panel(x + 101, compareY + 243, 58, 64, COLORS.panelAlt, 5));
    parts.push(figure(entry, 'south', 'neutral', x + 26, compareY + 253, 40, true));
    parts.push(figure(entry, 'east', 'neutral', x + 110, compareY + 253, 40, true));
    parts.push(figure(entry, index % 2 === 0 ? 'south' : 'east', 'neutral', x + 64, compareY + 315, 48, true));
    parts.push(`<rect x="${x + 49}" y="${compareY + 350}" width="78" height="27" fill="${COLORS.green}"/>`);
  });

  parts.push(text(30, 882, 'Decision gate', 15, 760));
  parts.push(text(
    128,
    882,
    'Does Pinch add a feminine-leaning option at 40 px? Does it remain the same body under High Crown and Beard? Is Bell still needed as a separate foundation?',
    11,
    550,
    COLORS.muted,
  ));
  parts.push(text(
    30,
    914,
    'Either outcome is static art: replace Bell to stay at five, or retain both as six. Neither adds animation frames.',
    12,
    700,
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

function rasterMask(svg: string): Uint8Array {
  const png = PNG.sync.read(new Resvg(svg).render().asPng());
  const mask = new Uint8Array(png.width * png.height);
  for (let index = 0; index < mask.length; index++) {
    mask[index] = png.data[index * 4 + 3] >= 128 ? 1 : 0;
  }
  return mask;
}

function silhouetteIou(left: Uint8Array, right: Uint8Array): number {
  let intersection = 0;
  let union = 0;
  for (let index = 0; index < left.length; index++) {
    if (left[index] || right[index]) union++;
    if (left[index] && right[index]) intersection++;
  }
  return union === 0 ? 1 : intersection / union;
}

function pairwiseMetrics(
  entries: Array<{ id: string; svg: string }>,
): Array<{ pair: [string, string]; iou: number }> {
  const masks = entries.map((entry) => ({ id: entry.id, mask: rasterMask(entry.svg) }));
  const rows: Array<{ pair: [string, string]; iou: number }> = [];
  for (let left = 0; left < masks.length; left++) {
    for (let right = left + 1; right < masks.length; right++) {
      rows.push({
        pair: [masks[left].id, masks[right].id],
        iou: Number(silhouetteIou(masks[left].mask, masks[right].mask).toFixed(3)),
      });
    }
  }
  return rows.sort((left, right) => right.iou - left.iou);
}

function metrics(currentBodies: ReadonlyMap<string, string>) {
  const current = Object.fromEntries((['south', 'east'] as const).map((facing) => [
    facing,
    pairwiseMetrics(BODY_ARCHETYPES.map((archetype) => ({
      id: archetype.id,
      svg: currentBodies.get(`${archetype.id}/${facing}`)!.replace('width="128" height="128"', 'width="40" height="40"'),
    }))),
  ]));
  const combined = Object.fromEntries((['neutral', 'walk-approach'] as const).map((pose) => [
    pose,
    Object.fromEntries((['south', 'east'] as const).map((facing) => [
      facing,
      pairwiseMetrics(RECIPES.map((entry) => ({
        id: entry.id,
        svg: characterSvg(entry, facing, pose, true, 40),
      }))),
    ])),
  ]));
  return {
    note:
      'Pairwise intersection-over-union on transparent 40 px compositor renders. Lower overlap supports distinction; the composed visual review remains authoritative.',
    currentBodyOnly: current,
    combined,
    repeatedBodyPair: {
      body: 'body-tall / Column',
      recipes: ['twin-mass', 'crest'],
      neutralSouthIou: combined.neutral.south.find((row) =>
        row.pair.includes('twin-mass') && row.pair.includes('crest'))?.iou,
      neutralEastIou: combined.neutral.east.find((row) =>
        row.pair.includes('twin-mass') && row.pair.includes('crest'))?.iou,
    },
  };
}

function fortyPixelSvg(svg: string): string {
  return svg.replace('width="128" height="128"', 'width="40" height="40"');
}

function bodyVocabularyMetrics(cells: ReadonlyMap<string, string>) {
  return Object.fromEntries((['south', 'east'] as const).map((facing) => [
    facing,
    pairwiseMetrics(BODIES.map((body) => ({
      id: body.carrier === 'body-soft' ? 'body-soft' : body.label.toLowerCase(),
      svg: fortyPixelSvg(requiredCell(cells, `${body.carrier}/${facing}`)),
    }))),
  ]));
}

function pinchDecisionMetrics(
  bellVocabulary: ReadonlyMap<string, string>,
  pinchVocabulary: ReadonlyMap<string, string>,
  bellStates: ReadonlyMap<string, string>,
) {
  const pinchPlain = plainBodyEntry('body-soft', 'pinch');
  const bellVersusPinch = Object.fromEntries((['south', 'east'] as const).map((facing) => {
    const bellMask = rasterMask(fortyPixelSvg(requiredCell(bellStates, `${facing}/base/black`)));
    const pinchMask = rasterMask(characterSvg(pinchPlain, facing, 'base', true, 40));
    return [facing, Number(silhouetteIou(bellMask, pinchMask).toFixed(3))];
  }));
  return {
    note:
      'Body-only intersection-over-union on transparent 40 px compositor renders. The visual gate remains authoritative.',
    bellVersusPinch,
    bellVocabulary: bodyVocabularyMetrics(bellVocabulary),
    pinchVocabulary: bodyVocabularyMetrics(pinchVocabulary),
  };
}

function main(): void {
  if (getPart(NO_OUTFIT)) throw new Error(`Proof outfit sentinel unexpectedly resolves: ${NO_OUTFIT}`);
  const outDir = resolve(process.argv[2] ?? 'docs/previews');
  mkdirSync(outDir, { recursive: true });

  const currentBodies = captureCurrentBodyCells();
  const sentinelRecipe: CharacterRecipe = {
    id: 'pawn-plus-restoration-sentinel',
    name: 'Restoration sentinel',
    parts: {
      body: 'body-balanced',
      head: 'head-round',
      hair: 'hair-bob',
      outfit: NO_OUTFIT,
      accessories: [BEARD_CARRIER],
    },
    palette: PALETTE,
  };
  const sentinelBefore = composeCharacter(
    sentinelRecipe,
    COLOR_STYLE,
    'south',
    CANVAS,
    'normal',
    { badge: false, pose: 'walk-approach' },
  );

  let direction = '';
  let room = '';
  let pinchDecision = '';
  let proofMetrics: ReturnType<typeof metrics> | undefined;
  let focusedMetrics: ReturnType<typeof pinchDecisionMetrics> | undefined;
  const snapshots = snapshotAndInstallProofParts();
  try {
    direction = directionSheet(currentBodies);
    room = roomSheet();
    proofMetrics = metrics(currentBodies);

    const bellVocabulary = captureCurrentBodyCells();
    const bellStates = capturePlainBodyStates('body-soft');
    const pinchSnapshot = installSingleBodyCandidate(PINCH);
    try {
      const pinchVocabulary = captureCurrentBodyCells();
      pinchDecision = pinchDecisionSheet(bellVocabulary, pinchVocabulary, bellStates);
      focusedMetrics = pinchDecisionMetrics(bellVocabulary, pinchVocabulary, bellStates);
    } finally {
      restoreSingleBodyCandidate(pinchSnapshot);
    }
  } finally {
    restoreProofParts(snapshots);
  }

  const sentinelAfter = composeCharacter(
    sentinelRecipe,
    COLOR_STYLE,
    'south',
    CANVAS,
    'normal',
    { badge: false, pose: 'walk-approach' },
  );
  if (sentinelAfter !== sentinelBefore) {
    throw new Error('Process-local proof mutation did not restore production compositor output byte-for-byte');
  }
  if (!direction || !room || !pinchDecision || !proofMetrics || !focusedMetrics) {
    throw new Error('Proof rendering did not complete');
  }

  writeSvgAndPng(outDir, 'character-pawn-plus-v2', direction);
  writeSvgAndPng(outDir, 'character-pawn-plus-room-v2', room);
  writeSvgAndPng(outDir, 'character-body-pinch-v2-1', pinchDecision);
  writeFileSync(
    join(outDir, 'character-pawn-plus-v2-metrics.json'),
    `${JSON.stringify(proofMetrics, null, 2)}\n`,
  );
  writeFileSync(
    join(outDir, 'character-body-pinch-v2-1-metrics.json'),
    `${JSON.stringify(focusedMetrics, null, 2)}\n`,
  );

  const neutralMax = Math.max(
    proofMetrics.combined.neutral.south[0].iou,
    proofMetrics.combined.neutral.east[0].iou,
  );
  const walkMax = Math.max(
    proofMetrics.combined['walk-approach'].south[0].iou,
    proofMetrics.combined['walk-approach'].east[0].iou,
  );
  console.log(`40 px max pair overlap: neutral ${neutralMax.toFixed(3)} · walk ${walkMax.toFixed(3)}`);
  console.log(
    `Bell → Pinch 40 px overlap: south ${focusedMetrics.bellVersusPinch.south.toFixed(3)} · east ${focusedMetrics.bellVersusPinch.east.toFixed(3)}`,
  );
  console.log('production compositor restoration: byte-identical');
  console.log(`wrote review-only pawn-plus proofs to ${outDir}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main();
}
