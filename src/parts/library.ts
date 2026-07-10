import type { BodyFacingAnchors, Facing, PartDef, PartVariant, Slot } from '../core/types';
import { rr, circle, ellipse, topCap } from '../core/geometry';
import { UI_PALETTE } from '../data/uiPalette';
import { BODY_ARCHETYPE_PARTS } from './bodyArchetypes';

/**
 * Part library. Conventions:
 * - Coordinates are part-local; (0,0) is the part's anchor point.
 * - body parts anchor at the body center; the body capsule spans y -29..29.
 * - head/hair/face parts anchor at headCenter; the default head radius is 21.
 * - Fills use '$token' palette references; literals only for style-neutral detail.
 * - z order: body 10, outfit 20, body accessories 30, head 40, hair 50, face gear 60.
 */

const INK = UI_PALETTE.ink; // eyes / neutral hardware, deliberately palette-independent

// ---------------------------------------------------------------------------
// Legacy bodies (anchor: body). Kept byte-stable and resolvable for existing
// recipes, but no longer included in production selection.
// ---------------------------------------------------------------------------

const LEGACY_BODY_PARTS: PartDef[] = [
  {
    id: 'body-standard',
    label: 'Standard',
    slot: 'body',
    anchor: 'body',
    facings: {
      south: { z: 10, shapes: [{ d: rr(-28, -29, 56, 58, 24), fill: '$outfitPrimary' }, { d: ellipse(0, 20, 18, 8), fill: '#00000012', silhouette: false }] },
      north: { z: 10, shapes: [{ d: rr(-28, -29, 56, 58, 24), fill: '$outfitPrimary' }, { d: ellipse(0, 20, 18, 8), fill: '#00000012', silhouette: false }] },
      east: { z: 10, shapes: [{ d: rr(-22, -29, 44, 58, 20), fill: '$outfitPrimary' }, { d: ellipse(0, 20, 12, 8), fill: '#00000012', silhouette: false }] },
    },
  },
  {
    id: 'body-slim',
    label: 'Slim',
    slot: 'body',
    anchor: 'body',
    facings: {
      south: { z: 10, shapes: [{ d: rr(-23, -29, 46, 58, 21), fill: '$outfitPrimary' }, { d: ellipse(0, 20, 13, 8), fill: '#00000012', silhouette: false }] },
      north: { z: 10, shapes: [{ d: rr(-23, -29, 46, 58, 21), fill: '$outfitPrimary' }, { d: ellipse(0, 20, 13, 8), fill: '#00000012', silhouette: false }] },
      east: { z: 10, shapes: [{ d: rr(-18, -29, 36, 58, 17), fill: '$outfitPrimary' }, { d: ellipse(0, 20, 11, 8), fill: '#00000012', silhouette: false }] },
    },
  },
  {
    id: 'body-broad',
    label: 'Broad',
    slot: 'body',
    anchor: 'body',
    facings: {
      south: { z: 10, shapes: [{ d: rr(-32, -29, 64, 58, 26), fill: '$outfitPrimary' }, { d: ellipse(0, 20, 20, 8), fill: '#00000012', silhouette: false }] },
      north: { z: 10, shapes: [{ d: rr(-32, -29, 64, 58, 26), fill: '$outfitPrimary' }, { d: ellipse(0, 20, 20, 8), fill: '#00000012', silhouette: false }] },
      east: { z: 10, shapes: [{ d: rr(-25, -29, 50, 58, 22), fill: '$outfitPrimary' }, { d: ellipse(0, 20, 15, 8), fill: '#00000012', silhouette: false }] },
    },
  },
];

// ---------------------------------------------------------------------------
// Heads (anchor: headCenter). Includes the eyes so eye placement can match the
// head shape; glasses overlay separately.
// ---------------------------------------------------------------------------

const eyeS = (x: number, y: number) => ({ d: circle(x, y, 2.6), fill: INK, silhouette: false });

const BASE_HEADS: Array<{ id: string; label: string; d: string; eastD?: string }> = [
  { id: 'head-round', label: 'Round', d: circle(0, 0, 21) },
  { id: 'head-oval', label: 'Oval', d: ellipse(0, 0, 19, 22) },
  { id: 'head-boxy', label: 'Boxy', d: rr(-19, -20, 38, 40, 13) },
  { id: 'head-long', label: 'Long', d: ellipse(0, 1, 17, 24), eastD: ellipse(1, 1, 16, 24) },
  {
    id: 'head-angular',
    label: 'Angular',
    d: `M -16 -17 L 9 -20 L 19 -8 L 17 12 L 7 22 L -10 20 L -20 8 L -20 -7 Z`,
    eastD: `M -13 -18 L 8 -20 L 19 -8 L 17 12 L 6 22 L -11 18 L -18 4 Z`,
  },
  {
    id: 'head-soft-square',
    label: 'Soft square',
    d: rr(-18, -19, 36, 41, 9),
    eastD: rr(-16, -19, 33, 41, 9),
  },
];

const HEADS: PartDef[] = BASE_HEADS.map(({ id, label, d, eastD }) => ({
  id,
  label,
  slot: 'head' as Slot,
  anchor: 'headCenter' as const,
  facings: {
    south: { z: 40, shapes: [{ d, fill: '$skin' }, eyeS(-8, 0), eyeS(8, 0)] },
    east: { z: 40, shapes: [{ d: eastD ?? d, fill: '$skin' }, eyeS(11, 0)] },
    north: { z: 40, shapes: [{ d, fill: '$skin' }] },
  },
}));

// ---------------------------------------------------------------------------
// Hair (anchor: headCenter, head radius 21).
// ---------------------------------------------------------------------------

const HAIR: PartDef[] = [
  {
    id: 'hair-none',
    label: 'None',
    slot: 'hair',
    anchor: 'headCenter',
    facings: {},
  },
  {
    id: 'hair-short',
    label: 'Short',
    slot: 'hair',
    anchor: 'headCenter',
    facings: {
      south: { z: 50, shapes: [{ d: topCap(21, -8), fill: '$hair' }] },
      east: {
        z: 50,
        shapes: [
          { d: topCap(21, -8), fill: '$hair' },
          { d: rr(-21, -9, 8, 17, 4), fill: '$hair' }, // back of head
        ],
      },
      north: { z: 50, shapes: [{ d: topCap(21, 7), fill: '$hair' }] },
    },
  },
  {
    id: 'hair-bob',
    label: 'Bob',
    slot: 'hair',
    anchor: 'headCenter',
    facings: {
      south: {
        z: 50,
        shapes: [
          {
            d:
              `M -23 -4 A 23 23 0 0 1 23 -4 L 23 14 L 12 14 L 12 -2 ` +
              `A 14 14 0 0 0 -12 -2 L -12 14 L -23 14 Z`,
            fill: '$hair',
          },
        ],
      },
      east: {
        z: 50,
        shapes: [
          { d: `M -23 -4 A 23 23 0 0 1 23 -4 L 23 6 L 14 12 L -14 14 L -23 14 Z`, fill: '$hair' },
        ],
      },
      north: {
        z: 50,
        shapes: [{ d: `M -23 -4 A 23 23 0 0 1 23 -4 L 23 16 L -23 16 Z`, fill: '$hair' }],
      },
    },
  },
  {
    id: 'hair-bun',
    label: 'Bun',
    slot: 'hair',
    anchor: 'headCenter',
    facings: {
      south: { z: 50, shapes: [{ d: topCap(21, -8), fill: '$hair' }, { d: circle(0, -26, 8), fill: '$hair' }] },
      east: {
        z: 50,
        shapes: [
          { d: topCap(21, -8), fill: '$hair' },
          { d: rr(-21, -9, 8, 15, 4), fill: '$hair' },
          { d: circle(-15, -19, 8), fill: '$hair' },
        ],
      },
      north: { z: 50, shapes: [{ d: topCap(21, 4), fill: '$hair' }, { d: circle(0, -26, 8), fill: '$hair' }] },
    },
  },
  {
    id: 'hair-curly',
    label: 'Curly',
    slot: 'hair',
    anchor: 'headCenter',
    facings: {
      south: {
        z: 50,
        shapes: [
          { d: topCap(21, -8), fill: '$hair' },
          { d: circle(-15, -9, 9), fill: '$hair' },
          { d: circle(-8, -16, 9), fill: '$hair' },
          { d: circle(0, -18, 9), fill: '$hair' },
          { d: circle(8, -16, 9), fill: '$hair' },
          { d: circle(15, -9, 9), fill: '$hair' },
        ],
      },
      east: {
        z: 50,
        shapes: [
          { d: topCap(21, -8), fill: '$hair' },
          { d: circle(-12, -12, 9), fill: '$hair' },
          { d: circle(-2, -17, 9), fill: '$hair' },
          { d: circle(9, -14, 9), fill: '$hair' },
          { d: circle(-17, -2, 8), fill: '$hair' },
        ],
      },
      north: {
        z: 50,
        shapes: [
          { d: topCap(21, 6), fill: '$hair' },
          { d: circle(-14, -10, 9), fill: '$hair' },
          { d: circle(0, -16, 10), fill: '$hair' },
          { d: circle(14, -10, 9), fill: '$hair' },
        ],
      },
    },
  },
  {
    id: 'hair-balding',
    label: 'Balding',
    slot: 'hair',
    anchor: 'headCenter',
    facings: {
      south: {
        z: 50,
        shapes: [
          { d: ellipse(-19.5, 5, 4.5, 7.5), fill: '$hair' },
          { d: ellipse(19.5, 5, 4.5, 7.5), fill: '$hair' },
        ],
      },
      east: { z: 50, shapes: [{ d: ellipse(-16, 5, 5.5, 7.5), fill: '$hair' }] },
      north: {
        z: 50,
        shapes: [
          { d: `M -20 -3 A 20 20 0 0 0 20 -3 L 20 10 L -20 10 Z`, fill: '$hair' },
        ],
      },
    },
  },
  {
    id: 'hair-side-part',
    label: 'Side part',
    slot: 'hair',
    anchor: 'headCenter',
    facings: {
      south: {
        z: 50,
        shapes: [
          { d: topCap(21, -7), fill: '$hair' },
          { d: `M -19 -6 C -7 -18 8 -19 20 -7 L 15 1 C 5 -7 -6 -8 -17 1 Z`, fill: '$hair' },
          { d: `M -5 -15 C -3 -8 -2 -2 -2 7`, stroke: '#00000024', strokeWidth: 1.6, silhouette: false },
        ],
      },
      east: {
        z: 50,
        shapes: [
          { d: topCap(21, -7), fill: '$hair' },
          { d: rr(-21, -8, 8, 16, 4), fill: '$hair' },
          { d: `M -6 -16 C 6 -16 16 -10 19 -3 L 12 2 C 5 -4 -3 -5 -11 0 Z`, fill: '$hair' },
        ],
      },
      north: {
        z: 50,
        shapes: [
          { d: topCap(21, 5), fill: '$hair' },
          { d: `M -19 0 C -7 9 8 9 20 1 L 20 13 L -20 13 Z`, fill: '$hair' },
        ],
      },
    },
  },
  {
    id: 'hair-pixie',
    label: 'Pixie',
    slot: 'hair',
    anchor: 'headCenter',
    facings: {
      south: {
        z: 50,
        shapes: [
          { d: topCap(21, -5), fill: '$hair' },
          { d: `M -18 -4 L -10 3 L -3 -2 L 4 4 L 11 -2 L 19 2 L 18 -8 L -17 -8 Z`, fill: '$hair' },
        ],
      },
      east: {
        z: 50,
        shapes: [
          { d: topCap(21, -5), fill: '$hair' },
          { d: rr(-20, -7, 8, 15, 4), fill: '$hair' },
          { d: `M 3 -9 L 17 -2 L 12 4 L 2 0 Z`, fill: '$hair' },
        ],
      },
      north: { z: 50, shapes: [{ d: topCap(21, 8), fill: '$hair' }] },
    },
  },
  {
    id: 'hair-ponytail',
    label: 'Ponytail',
    slot: 'hair',
    anchor: 'headCenter',
    facings: {
      south: {
        z: 50,
        shapes: [
          { d: topCap(21, -8), fill: '$hair' },
          { d: ellipse(0, -23, 7, 8), fill: '$hair' },
          { d: `M -5 -24 C -3 -36 5 -36 6 -24 Z`, fill: '$hair' },
        ],
      },
      east: {
        z: 50,
        shapes: [
          { d: topCap(21, -8), fill: '$hair' },
          { d: rr(-21, -9, 8, 16, 4), fill: '$hair' },
          { d: ellipse(-18, -18, 7, 8), fill: '$hair' },
          { d: `M -20 -22 C -30 -28 -31 -15 -21 -12 Z`, fill: '$hair' },
        ],
      },
      north: {
        z: 50,
        shapes: [
          { d: topCap(21, 5), fill: '$hair' },
          { d: ellipse(0, -20, 8, 8), fill: '$hair' },
          { d: `M -5 -19 C -7 -33 7 -33 5 -19 Z`, fill: '$hair' },
        ],
      },
    },
  },
  {
    id: 'hair-long-straight',
    label: 'Long straight',
    slot: 'hair',
    anchor: 'headCenter',
    facings: {
      south: {
        z: 50,
        shapes: [
          { d: `M -23 -5 A 23 23 0 0 1 23 -5 L 23 29 L 14 29 L 11 -2 A 12 12 0 0 0 -11 -2 L -14 29 L -23 29 Z`, fill: '$hair' },
        ],
      },
      east: {
        z: 50,
        shapes: [
          { d: `M -22 -5 A 23 23 0 0 1 23 -5 L 21 21 L 12 30 L -18 30 L -23 10 Z`, fill: '$hair' },
        ],
      },
      north: {
        z: 50,
        shapes: [{ d: `M -23 -4 A 23 23 0 0 1 23 -4 L 23 31 L -23 31 Z`, fill: '$hair' }],
      },
    },
  },
  {
    id: 'hair-coils',
    label: 'Coils',
    slot: 'hair',
    anchor: 'headCenter',
    facings: {
      south: {
        z: 50,
        shapes: [
          { d: circle(-18, -7, 8), fill: '$hair' },
          { d: circle(-11, -16, 9), fill: '$hair' },
          { d: circle(0, -19, 10), fill: '$hair' },
          { d: circle(11, -16, 9), fill: '$hair' },
          { d: circle(18, -7, 8), fill: '$hair' },
          { d: circle(-19, 3, 7), fill: '$hair' },
          { d: circle(19, 3, 7), fill: '$hair' },
        ],
      },
      east: {
        z: 50,
        shapes: [
          { d: circle(-16, -8, 8), fill: '$hair' },
          { d: circle(-7, -17, 9), fill: '$hair' },
          { d: circle(4, -18, 10), fill: '$hair' },
          { d: circle(15, -10, 8), fill: '$hair' },
          { d: circle(-18, 2, 7), fill: '$hair' },
        ],
      },
      north: {
        z: 50,
        shapes: [
          { d: circle(-17, -6, 8), fill: '$hair' },
          { d: circle(-8, -15, 9), fill: '$hair' },
          { d: circle(4, -17, 10), fill: '$hair' },
          { d: circle(16, -8, 8), fill: '$hair' },
          { d: topCap(21, 8), fill: '$hair' },
        ],
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Outfits (anchor: body). Static variants preserve the legacy y=-29 capsule;
// body-aware builders place production detail from each active rig.
// ---------------------------------------------------------------------------

const spanCenter = (span: BodyFacingAnchors['waist']) => ({
  x: (span.left.x + span.right.x) / 2,
  y: (span.left.y + span.right.y) / 2,
});
const spanWidth = (span: BodyFacingAnchors['waist']) => Math.abs(span.right.x - span.left.x);
const mix = (from: number, to: number, t: number) => from + (to - from) * t;
const clampValue = (min: number, max: number, value: number) => Math.max(min, Math.min(max, value));

/** Conservative torso interior at one y, interpolated through the body's own anchors. */
function bodyInteriorSpan(body: BodyFacingAnchors, y: number, inset = 1) {
  const shoulderY = spanCenter(body.shoulders).y;
  const waistY = spanCenter(body.waist).y;
  const hemY = spanCenter(body.hem).y;
  let left: number;
  let right: number;
  if (y <= shoulderY) {
    const t = clampValue(0, 1, (y - body.neck.y) / Math.max(1, shoulderY - body.neck.y));
    left = mix(body.neck.x, body.shoulders.left.x, t);
    right = mix(body.neck.x, body.shoulders.right.x, t);
  } else if (y <= waistY) {
    const t = clampValue(0, 1, (y - shoulderY) / Math.max(1, waistY - shoulderY));
    left = mix(body.shoulders.left.x, body.waist.left.x, t);
    right = mix(body.shoulders.right.x, body.waist.right.x, t);
  } else {
    const t = clampValue(0, 1, (y - waistY) / Math.max(1, hemY - waistY));
    left = mix(body.waist.left.x, body.hem.left.x, t);
    right = mix(body.waist.right.x, body.hem.right.x, t);
  }
  const safeInset = Math.min(inset, Math.max(0, (right - left) / 3));
  return { left: left + safeInset, right: right - safeInset };
}

/** The body silhouette itself is the conforming tee torso; this cuts its neck opening. */
function anchoredTee(facing: Facing, body: BodyFacingAnchors): PartVariant {
  const n = body.neck;
  if (facing === 'north') return { z: 20, shapes: [] };
  if (facing === 'east') {
    return {
      z: 20,
      shapes: [
        {
          d: `M ${n.x - 4} ${n.y} Q ${n.x + 1} ${n.y + 5} ${n.x + 6} ${n.y} Z`,
          fill: '$skin',
          silhouette: false,
        },
      ],
    };
  }
  const shoulderWidth = body.shoulders.right.x - body.shoulders.left.x;
  const half = Math.max(7, Math.min(10, shoulderWidth * 0.17));
  return {
    z: 20,
    shapes: [
      {
        d: `M ${n.x - half} ${n.y} Q ${n.x} ${n.y + 7} ${n.x + half} ${n.y} Z`,
        fill: '$skin',
        silhouette: false,
      },
    ],
  };
}

/** One blazer detail kit placed from the active body's neck/chest/hip/hem anchors. */
function anchoredBlazer(facing: Facing, body: BodyFacingAnchors): PartVariant {
  const n = body.neck;
  const chest = body.chest;
  const hip = body.hip;
  if (facing === 'north') {
    const hem = spanCenter(body.hem);
    return {
      z: 20,
      shapes: [
        {
          d: `M ${n.x} ${n.y + 3} L ${hem.x} ${hem.y}`,
          stroke: '#00000022',
          strokeWidth: 2,
          silhouette: false,
        },
      ],
    };
  }
  if (facing === 'east') {
    const collarY = n.y + 4;
    const apexY = mix(n.y, chest.y, 0.68);
    const collarSpan = bodyInteriorSpan(body, collarY, 0.5);
    const bottomX = bodyInteriorSpan(body, apexY, 2).right;
    const hem = spanCenter(body.hem);
    const endY = hem.y - 2;
    const frontHemX = bodyInteriorSpan(body, endY, 3).right;
    const pocketY = mix(chest.y, hip.y, 0.48);
    const pocketX = bodyInteriorSpan(body, pocketY, 3).right;
    return {
      z: 20,
      shapes: [
        {
          d: `M ${collarSpan.left} ${collarY} L ${bottomX} ${apexY} L ${collarSpan.right} ${collarY} Z`,
          fill: '$outfitSecondary',
          silhouette: false,
        },
        {
          d: `M ${bottomX} ${apexY} Q ${bodyInteriorSpan(body, chest.y + 7, 3).right} ${chest.y + 7} ${frontHemX} ${endY}`,
          stroke: '#00000030',
          strokeWidth: 2,
          silhouette: false,
        },
        { d: circle(bodyInteriorSpan(body, chest.y + 5, 3).right, chest.y + 5, 1.7), fill: '#0000003D', silhouette: false },
        { d: `M ${pocketX - 5} ${pocketY} L ${pocketX} ${pocketY + 1}`, stroke: '#00000030', strokeWidth: 1.6, silhouette: false },
      ],
    };
  }
  const shoulderWidth = body.shoulders.right.x - body.shoulders.left.x;
  const half = Math.max(9, Math.min(14, shoulderWidth * 0.21));
  const hem = spanCenter(body.hem);
  const apexY = chest.y - 1;
  const button1Y = chest.y + (hip.y - chest.y) * 0.35;
  const button2Y = chest.y + (hip.y - chest.y) * 0.75;
  const pocketX = mix(chest.x, body.waist.right.x, 0.58);
  const pocketY = mix(chest.y, hip.y, 0.45);
  return {
    z: 20,
    shapes: [
      {
        d: `M ${n.x - half} ${n.y} L ${chest.x} ${apexY} L ${n.x - 2.5} ${n.y} Z`,
        fill: '$outfitSecondary',
        silhouette: false,
      },
      {
        d: `M ${n.x + 2.5} ${n.y} L ${chest.x} ${apexY} L ${n.x + half} ${n.y} Z`,
        fill: '$outfitSecondary',
        silhouette: false,
      },
      {
        d: `M ${chest.x} ${apexY + 2} L ${hem.x} ${hem.y}`,
        stroke: '#00000030',
        strokeWidth: 2,
        silhouette: false,
      },
      { d: circle(chest.x, button1Y, 1.8), fill: '#00000033', silhouette: false },
      { d: circle(chest.x, button2Y, 1.8), fill: '#00000033', silhouette: false },
      { d: `M ${pocketX - 4} ${pocketY} L ${pocketX + 4} ${pocketY}`, stroke: '#00000030', strokeWidth: 1.6, silhouette: false },
    ],
  };
}

/** Anchor-driven polo collar and placket. */
function anchoredPolo(facing: Facing, body: BodyFacingAnchors): PartVariant {
  const n = body.neck;
  const chest = body.chest;
  const shoulderWidth = spanWidth(body.shoulders);
  const collarHalf = clampValue(8, 12, shoulderWidth * 0.19);
  const apexY = mix(n.y, chest.y, 0.64);

  if (facing === 'north') {
    return {
      z: 20,
      shapes: [{ d: rr(n.x - collarHalf, n.y, collarHalf * 2, 5, 2), fill: '$outfitSecondary', silhouette: false }],
    };
  }
  if (facing === 'east') {
    const collarY = n.y + 4;
    const collarSpan = bodyInteriorSpan(body, collarY, 0.5);
    const apexX = bodyInteriorSpan(body, apexY, 2).right;
    return {
      z: 20,
      shapes: [
        { d: `M ${collarSpan.left} ${collarY} L ${apexX} ${apexY} L ${collarSpan.right} ${collarY} Z`, fill: '$outfitSecondary', silhouette: false },
        { d: `M ${apexX} ${apexY} L ${bodyInteriorSpan(body, Math.min(chest.y + 2, apexY + 9), 2).right} ${Math.min(chest.y + 2, apexY + 9)}`, stroke: '#00000026', strokeWidth: 2, silhouette: false },
      ],
    };
  }
  return {
    z: 20,
    shapes: [
      { d: `M ${n.x - collarHalf} ${n.y} L ${chest.x} ${apexY} L ${n.x + collarHalf} ${n.y} Z`, fill: '$outfitSecondary', silhouette: false },
      { d: `M ${chest.x} ${apexY} L ${chest.x} ${Math.min(chest.y + 2, apexY + 9)}`, stroke: '#00000026', strokeWidth: 2, silhouette: false },
    ],
  };
}

/** Anchor-driven open cardigan trim, center placket, and buttons. */
function anchoredCardigan(facing: Facing, body: BodyFacingAnchors): PartVariant {
  if (facing === 'north') return { z: 20, shapes: [] };
  const n = body.neck;
  const chest = body.chest;
  const hip = body.hip;
  const hem = spanCenter(body.hem);
  const shoulderWidth = spanWidth(body.shoulders);
  const vHalf = clampValue(6, 9, shoulderWidth * 0.135);
  const apexY = mix(n.y, chest.y, 0.5);
  const button1Y = mix(chest.y, hip.y, 0.15);
  const button2Y = mix(chest.y, hip.y, 0.65);

  if (facing === 'east') {
    const collarY = n.y + 4;
    const collarSpan = bodyInteriorSpan(body, collarY, 0.5);
    const seamX = bodyInteriorSpan(body, apexY, 2).right;
    const endY = hem.y - 2;
    const endX = bodyInteriorSpan(body, endY, 3).right;
    return {
      z: 20,
      shapes: [
        { d: `M ${collarSpan.left} ${collarY} L ${seamX} ${apexY} L ${collarSpan.right} ${collarY} Z`, fill: '$outfitSecondary', silhouette: false },
        { d: `M ${seamX} ${apexY} Q ${bodyInteriorSpan(body, button2Y, 3).right} ${button2Y} ${endX} ${endY}`, stroke: '#00000030', strokeWidth: 2.5, silhouette: false },
        { d: circle(bodyInteriorSpan(body, button1Y, 3).right, button1Y, 1.5), fill: '#00000033', silhouette: false },
        { d: circle(bodyInteriorSpan(body, button2Y, 3).right, button2Y, 1.5), fill: '#00000033', silhouette: false },
      ],
    };
  }
  return {
    z: 20,
    shapes: [
      { d: `M ${n.x - vHalf} ${n.y} L ${chest.x} ${apexY} L ${n.x + vHalf} ${n.y} Z`, fill: '$outfitSecondary', silhouette: false },
      { d: `M ${chest.x} ${apexY} L ${hem.x} ${hem.y}`, stroke: '#00000030', strokeWidth: 2.5, silhouette: false },
      { d: circle(chest.x - 3, button1Y, 1.6), fill: '#00000033', silhouette: false },
      { d: circle(chest.x - 3, button2Y, 1.6), fill: '#00000033', silhouette: false },
    ],
  };
}

/** Anchor-driven shirt collar and tie. */
function anchoredShirtTie(facing: Facing, body: BodyFacingAnchors): PartVariant {
  const n = body.neck;
  const chest = body.chest;
  const hip = body.hip;
  const shoulderWidth = spanWidth(body.shoulders);
  const collarHalf = clampValue(9, 13, shoulderWidth * 0.21);
  const apexY = mix(n.y, chest.y, 0.82);
  const tieHalf = clampValue(3, 4.5, collarHalf * 0.32);
  const tieTipY = mix(chest.y, hip.y, 0.15);

  if (facing === 'north') {
    return {
      z: 20,
      shapes: [{ d: rr(n.x - collarHalf, n.y, collarHalf * 2, 4, 2), fill: '$outfitSecondary', silhouette: false }],
    };
  }
  if (facing === 'east') {
    const collarY = n.y + 4;
    const collarSpan = bodyInteriorSpan(body, collarY, 0.5);
    const apexX = bodyInteriorSpan(body, apexY, 2).right;
    const tieTopY = mix(n.y, chest.y, 0.42);
    const tieSpan = bodyInteriorSpan(body, tieTopY, 1.5);
    const knotX = (tieSpan.left + tieSpan.right) / 2;
    const topHalf = Math.min(tieHalf * 0.55, (tieSpan.right - tieSpan.left) / 2);
    return {
      z: 20,
      shapes: [
        { d: `M ${collarSpan.left} ${collarY} L ${apexX} ${apexY} L ${collarSpan.right} ${collarY} Z`, fill: '$outfitSecondary', silhouette: false },
        { d: `M ${knotX - topHalf} ${tieTopY} L ${knotX + topHalf} ${tieTopY} L ${knotX + tieHalf * 0.8} ${tieTipY - 3} L ${knotX} ${tieTipY} L ${knotX - tieHalf * 0.8} ${tieTipY - 3} Z`, fill: '$accent', silhouette: false },
      ],
    };
  }
  return {
    z: 20,
    shapes: [
      { d: `M ${n.x - collarHalf} ${n.y} L ${chest.x} ${apexY} L ${n.x + collarHalf} ${n.y} Z`, fill: '$outfitSecondary', silhouette: false },
      { d: `M ${chest.x - tieHalf} ${n.y + 1} L ${chest.x + tieHalf} ${n.y + 1} L ${chest.x + tieHalf * 1.25} ${tieTipY - 4} L ${chest.x} ${tieTipY} L ${chest.x - tieHalf * 1.25} ${tieTipY - 4} Z`, fill: '$accent', silhouette: false },
    ],
  };
}

/** Anchor-driven hood, drawstrings, and pocket seam. */
function anchoredHoodie(facing: Facing, body: BodyFacingAnchors): PartVariant {
  const n = body.neck;
  const chest = body.chest;
  const shoulderWidth = spanWidth(body.shoulders);
  const hoodHalf = clampValue(11, 16, shoulderWidth * 0.25);
  const hoodDepthY = mix(n.y, chest.y, 0.45);

  if (facing === 'north') {
    return {
      z: 20,
      shapes: [
        { d: `M ${n.x - hoodHalf} ${n.y} Q ${n.x} ${hoodDepthY + 2} ${n.x + hoodHalf} ${n.y} L ${n.x + hoodHalf} ${hoodDepthY} Q ${n.x} ${chest.y - 2} ${n.x - hoodHalf} ${hoodDepthY} Z`, fill: '$outfitSecondary', silhouette: false },
      ],
    };
  }
  if (facing === 'east') {
    const run = clampValue(8, 18, body.waist.right.x - body.shoulders.right.x);
    const outerX = Math.min(body.waist.right.x - 2, body.shoulders.right.x + run * 0.82);
    const stringX = body.shoulders.right.x + run * 0.5;
    return {
      z: 20,
      shapes: [
        { d: `M ${n.x + 2} ${n.y} Q ${outerX} ${n.y + 4} ${outerX - 2} ${hoodDepthY} L ${stringX} ${hoodDepthY - 2} Z`, fill: '$outfitSecondary', silhouette: false },
        { d: `M ${stringX} ${hoodDepthY} L ${stringX + 1} ${chest.y + 2}`, stroke: '$accent', strokeWidth: 1.6, silhouette: false },
      ],
    };
  }
  const pocketHalf = clampValue(8, 13, spanWidth(body.waist) * 0.2);
  const pocketY = mix(spanCenter(body.waist).y, body.hip.y, 0.35);
  return {
    z: 20,
    shapes: [
      { d: `M ${n.x - hoodHalf} ${n.y} Q ${n.x} ${hoodDepthY + 2} ${n.x + hoodHalf} ${n.y} L ${n.x + hoodHalf * 0.7} ${hoodDepthY} Q ${n.x} ${chest.y - 1} ${n.x - hoodHalf * 0.7} ${hoodDepthY} Z`, fill: '$outfitSecondary', silhouette: false },
      { d: `M ${n.x - 3} ${hoodDepthY} L ${chest.x - 4} ${chest.y + 2} M ${n.x + 3} ${hoodDepthY} L ${chest.x + 4} ${chest.y + 2}`, stroke: '$accent', strokeWidth: 1.6, silhouette: false },
      { d: circle(chest.x - 4, chest.y + 2, 1.4), fill: '$accent', silhouette: false },
      { d: circle(chest.x + 4, chest.y + 2, 1.4), fill: '$accent', silhouette: false },
      { d: `M ${body.hip.x - pocketHalf} ${pocketY} Q ${body.hip.x} ${pocketY + 4} ${body.hip.x + pocketHalf} ${pocketY}`, stroke: '#00000026', strokeWidth: 2, silhouette: false },
    ],
  };
}

/** Formal blazer vocabulary plus an anchored tie and pocket square. */
function anchoredSuitJacket(facing: Facing, body: BodyFacingAnchors): PartVariant {
  const base = anchoredBlazer(facing, body);
  const n = body.neck;
  const chest = body.chest;
  const hip = body.hip;
  const shoulderWidth = spanWidth(body.shoulders);
  const tieHalf = clampValue(2.6, 4, shoulderWidth * 0.06);

  if (facing === 'north') {
    const collarHalf = clampValue(10, 15, shoulderWidth * 0.23);
    return {
      ...base,
      shapes: [
        ...base.shapes,
        { d: rr(n.x - collarHalf, n.y, collarHalf * 2, 5, 2), fill: '$outfitSecondary', silhouette: false },
      ],
    };
  }
  if (facing === 'east') {
    const tieTopY = mix(n.y, chest.y, 0.42);
    const tieSpan = bodyInteriorSpan(body, tieTopY, 1.5);
    const tieX = (tieSpan.left + tieSpan.right) / 2;
    const topHalf = Math.min(tieHalf * 0.6, (tieSpan.right - tieSpan.left) / 2);
    const tieEndY = mix(chest.y, hip.y, 0.55);
    const pocketY = chest.y + 5;
    const pocketX = bodyInteriorSpan(body, pocketY, 3).right;
    const notchY = mix(n.y, chest.y, 0.5);
    const notchX = bodyInteriorSpan(body, notchY, 2).right;
    return {
      ...base,
      shapes: [
        ...base.shapes,
        { d: `M ${tieX - topHalf} ${tieTopY} L ${tieX + topHalf} ${tieTopY} L ${tieX + tieHalf} ${tieEndY - 3} L ${tieX} ${tieEndY} L ${tieX - tieHalf} ${tieEndY - 3} Z`, fill: '$accent', silhouette: false },
        { d: `M ${pocketX - 5} ${pocketY} L ${pocketX - 1} ${pocketY - 2} L ${pocketX - 1} ${pocketY + 3} Z`, fill: '$outfitSecondary', silhouette: false },
        { d: `M ${notchX - 4} ${notchY - 2} L ${notchX - 1} ${notchY} L ${notchX - 3} ${notchY + 2}`, stroke: '$outfitPrimary', strokeWidth: 2.4, silhouette: false },
      ],
    };
  }
  const tieEndY = mix(chest.y, hip.y, 0.55);
  const pocketX = mix(chest.x, body.waist.right.x, 0.58);
  const lapelHalf = clampValue(10, 15, shoulderWidth * 0.23);
  const notchY = n.y + 5;
  return {
    ...base,
    shapes: [
      ...base.shapes,
      { d: `M ${chest.x - tieHalf} ${n.y + 2} L ${chest.x + tieHalf} ${n.y + 2} L ${chest.x + tieHalf * 1.2} ${tieEndY - 4} L ${chest.x} ${tieEndY} L ${chest.x - tieHalf * 1.2} ${tieEndY - 4} Z`, fill: '$accent', silhouette: false },
      { d: `M ${pocketX - 4} ${chest.y + 5} L ${pocketX + 2} ${chest.y + 2} L ${pocketX + 2} ${chest.y + 8} Z`, fill: '$outfitSecondary', silhouette: false },
      { d: `M ${n.x - lapelHalf * 0.78} ${notchY - 2} L ${n.x - lapelHalf * 0.48} ${notchY + 1} L ${n.x - lapelHalf * 0.26} ${notchY - 1} M ${n.x + lapelHalf * 0.78} ${notchY - 2} L ${n.x + lapelHalf * 0.48} ${notchY + 1} L ${n.x + lapelHalf * 0.26} ${notchY - 1}`, stroke: '$outfitPrimary', strokeWidth: 2.4, silhouette: false },
    ],
  };
}

// Mechanically complete but visually provisional (2026-07-09 review): retain
// these variants and revisit Dress in a dedicated art pass.
const COMPACT_DRESS = { flareScale: 1.08, bottomDrop: 5 };
const BALANCED_DRESS = { flareScale: 1, bottomDrop: 5 };
const LARGE_FRAME_DRESS = { flareScale: 1.08, bottomDrop: 5 };
const TALL_DRESS = { flareScale: 1.15, bottomDrop: 5 };
const SOFT_DRESS = { flareScale: 1.18, bottomDrop: 5 };
const DRESS_PROFILES: Record<string, { flareScale: number; bottomDrop: number }> = {
  'body-compact': COMPACT_DRESS,
  'body-balanced': BALANCED_DRESS,
  'body-large-frame': LARGE_FRAME_DRESS,
  'body-tall': TALL_DRESS,
  'body-soft': SOFT_DRESS,
};

/** Body-specific A-line silhouette with anchor-driven neckline and seam art. */
function anchoredDress(facing: Facing, body: BodyFacingAnchors, bodyId?: string): PartVariant {
  const profile = DRESS_PROFILES[bodyId ?? ''] ?? BALANCED_DRESS;
  const waist = spanCenter(body.waist);
  const hem = spanCenter(body.hem);
  const waistHalf = spanWidth(body.waist) / 2;
  const hemHalf = spanWidth(body.hem) / 2;
  const flareHalf = clampValue(18, 31, Math.max(hemHalf + 3, waistHalf * 0.88) * profile.flareScale);
  const bottomY = hem.y + profile.bottomDrop;
  const leftBottom = facing === 'east'
    ? Math.max(-31, hem.x - flareHalf * 0.78)
    : hem.x - flareHalf;
  const rightBottom = facing === 'east'
    ? Math.min(31, hem.x + flareHalf * 1.08)
    : hem.x + flareHalf;
  const shoulderY = spanCenter(body.shoulders).y;
  const skirt: PartVariant['shapes'][number] = {
    d: `M ${body.neck.x} ${body.neck.y} Q ${body.shoulders.left.x} ${shoulderY} ${body.waist.left.x} ${waist.y} Q ${leftBottom} ${mix(waist.y, bottomY, 0.55)} ${leftBottom} ${bottomY} Q ${hem.x} ${bottomY + 2} ${rightBottom} ${bottomY} Q ${rightBottom} ${mix(waist.y, bottomY, 0.55)} ${body.waist.right.x} ${waist.y} Q ${body.shoulders.right.x} ${shoulderY} ${body.neck.x} ${body.neck.y} Z`,
    fill: '$outfitPrimary',
  };
  const waistBand: PartVariant['shapes'][number] = {
    d: `M ${body.waist.left.x} ${waist.y} L ${body.waist.right.x} ${waist.y}`,
    stroke: '$accent',
    strokeWidth: 2.5,
    silhouette: false,
  };

  if (facing === 'north') {
    const neckHalf = clampValue(7, 11, spanWidth(body.shoulders) * 0.17);
    return {
      z: 20,
      shapes: [
        skirt,
        { d: rr(body.neck.x - neckHalf, body.neck.y, neckHalf * 2, 4, 2), fill: '$outfitSecondary', silhouette: false },
        waistBand,
        { d: `M ${hem.x} ${waist.y + 3} L ${hem.x} ${bottomY - 1}`, stroke: '#00000018', strokeWidth: 1.4, silhouette: false },
      ],
    };
  }
  if (facing === 'east') {
    const collarY = body.neck.y + 4;
    const collarSpan = bodyInteriorSpan(body, collarY, 0.5);
    const necklineY = mix(body.neck.y, body.chest.y, 0.55);
    return {
      z: 20,
      shapes: [
        skirt,
        { d: `M ${collarSpan.left} ${collarY} Q ${bodyInteriorSpan(body, necklineY, 1.5).right} ${necklineY} ${collarSpan.right} ${collarY} Z`, fill: '$skin', silhouette: false },
        waistBand,
        { d: `M ${hem.x - flareHalf * 0.34} ${waist.y + 3} L ${hem.x - flareHalf * 0.48} ${bottomY - 1} M ${hem.x + flareHalf * 0.34} ${waist.y + 3} L ${hem.x + flareHalf * 0.48} ${bottomY - 1}`, stroke: '#0000001E', strokeWidth: 1.6, silhouette: false },
      ],
    };
  }
  const neckHalf = clampValue(7, 11, spanWidth(body.shoulders) * 0.17);
  return {
    z: 20,
    shapes: [
      skirt,
      { d: `M ${body.neck.x - neckHalf} ${body.neck.y} Q ${body.neck.x} ${mix(body.neck.y, body.chest.y, 0.58)} ${body.neck.x + neckHalf} ${body.neck.y} Z`, fill: '$skin', silhouette: false },
      waistBand,
      { d: `M ${hem.x - flareHalf * 0.34} ${waist.y + 3} L ${hem.x - flareHalf * 0.48} ${bottomY - 1} M ${hem.x + flareHalf * 0.34} ${waist.y + 3} L ${hem.x + flareHalf * 0.48} ${bottomY - 1} M ${hem.x} ${waist.y + 2} L ${hem.x} ${bottomY}`, stroke: '#0000001E', strokeWidth: 1.5, silhouette: false },
    ],
  };
}

/** Anchor-driven rolled collar. */
function anchoredTurtleneck(facing: Facing, body: BodyFacingAnchors): PartVariant {
  const n = body.neck;
  const height = clampValue(7, 10, (body.chest.y - n.y) * 0.4);
  const shoulderWidth = spanWidth(body.shoulders);
  if (facing === 'east') {
    const bottomY = n.y + height;
    const bottomSpan = bodyInteriorSpan(body, bottomY, 0.75);
    return {
      z: 20,
      shapes: [
        { d: `M ${n.x} ${n.y + 1} Q ${bottomSpan.right} ${n.y + 2} ${bottomSpan.right} ${bottomY} L ${bottomSpan.left} ${bottomY} Q ${bottomSpan.left} ${n.y + 2} ${n.x} ${n.y + 1} Z`, fill: '$outfitSecondary', silhouette: false },
      ],
    };
  }
  const half = clampValue(6, 9, shoulderWidth * 0.135);
  return {
    z: 20,
    shapes: [
      { d: rr(n.x - half, n.y, half * 2, height, 4), fill: '$outfitSecondary', silhouette: false },
      ...(facing === 'south'
        ? [{ d: `M ${n.x - half} ${n.y + height * 0.7} Q ${n.x} ${n.y + height} ${n.x + half} ${n.y + height * 0.7}`, stroke: '#0000001E', strokeWidth: 1.4, silhouette: false } as PartVariant['shapes'][number]]
        : []),
    ],
  };
}

/** Anchor-driven sweater vest panel. */
function anchoredVest(facing: Facing, body: BodyFacingAnchors): PartVariant {
  const n = body.neck;
  const chest = body.chest;
  const bottomY = mix(body.hip.y, spanCenter(body.hem).y, 0.45);
  const panelHalf = Math.min(spanWidth(body.shoulders) * 0.23, spanWidth(body.waist) * 0.24);
  const apexY = mix(n.y, chest.y, 0.82);

  if (facing === 'east') {
    const topY = spanCenter(body.shoulders).y + 2;
    const top = bodyInteriorSpan(body, topY, 1.5);
    const bottom = bodyInteriorSpan(body, bottomY, 2.5);
    const apexX = bodyInteriorSpan(body, apexY, 2).right;
    return {
      z: 20,
      shapes: [
        { d: `M ${top.left} ${topY} L ${apexX} ${apexY} L ${top.right} ${topY} L ${bottom.right} ${bottomY} L ${bottom.left} ${bottomY} Z`, fill: '$outfitSecondary', silhouette: false },
        { d: `M ${top.left + 1.5} ${topY} L ${apexX} ${mix(topY, apexY, 0.72)} L ${top.right - 1.5} ${topY} Z`, fill: '$accent', silhouette: false },
      ],
    };
  }
  if (facing === 'north') {
    return {
      z: 20,
      shapes: [{ d: rr(body.chest.x - panelHalf, n.y, panelHalf * 2, bottomY - n.y, 4), fill: '$outfitSecondary', silhouette: false }],
    };
  }
  return {
    z: 20,
    shapes: [
      { d: `M ${n.x - panelHalf} ${n.y} L ${chest.x} ${apexY} L ${n.x + panelHalf} ${n.y} L ${body.hip.x + panelHalf} ${bottomY} L ${body.hip.x - panelHalf} ${bottomY} Z`, fill: '$outfitSecondary', silhouette: false },
      { d: `M ${n.x - panelHalf * 0.5} ${n.y} L ${chest.x} ${mix(n.y, apexY, 0.78)} L ${n.x + panelHalf * 0.5} ${n.y} Z`, fill: '$accent', silhouette: false },
      { d: circle(chest.x, mix(chest.y, body.hip.y, 0.38), 1.5), fill: '#00000030', silhouette: false },
      { d: circle(chest.x, mix(chest.y, body.hip.y, 0.78), 1.5), fill: '#00000030', silhouette: false },
    ],
  };
}

/** Anchor-driven high-visibility vest and reflective bands. */
function anchoredHiVis(facing: Facing, body: BodyFacingAnchors): PartVariant {
  const n = body.neck;
  const chest = body.chest;
  const bottomY = mix(body.hip.y, spanCenter(body.hem).y, 0.64);
  const panelHalf = Math.min(spanWidth(body.shoulders) * 0.23, spanWidth(body.waist) * 0.24);
  const band = '#E4E8EC';

  if (facing === 'east') {
    const topY = spanCenter(body.shoulders).y + 2;
    const top = bodyInteriorSpan(body, topY, 1.5);
    const bottom = bodyInteriorSpan(body, bottomY, 2.5);
    const vY = mix(topY, chest.y, 0.55);
    const band1Y = mix(topY, chest.y, 0.72);
    const band2Y = mix(chest.y, body.hip.y, 0.55);
    const band1 = bodyInteriorSpan(body, band1Y, 2.5);
    const band2 = bodyInteriorSpan(body, band2Y, 2.5);
    return {
      z: 20,
      shapes: [
        { d: `M ${top.left} ${topY} L ${bottom.left} ${bottomY} L ${bottom.right} ${bottomY} L ${top.right} ${topY} L ${mix(top.left, top.right, 0.64)} ${topY} L ${mix(top.left, top.right, 0.5)} ${vY} L ${mix(top.left, top.right, 0.36)} ${topY} Z`, fill: '$outfitSecondary', silhouette: false },
        { d: rr(band1.left, band1Y, band1.right - band1.left, 3.5, 0.5), fill: band, silhouette: false },
        { d: rr(band2.left, band2Y, band2.right - band2.left, 3.5, 0.5), fill: band, silhouette: false },
      ],
    };
  }
  if (facing === 'north') {
    const leftX = body.chest.x - panelHalf;
    const width = panelHalf * 2;
    return {
      z: 20,
      shapes: [
        { d: rr(leftX, n.y, width, bottomY - n.y, 3), fill: '$outfitSecondary', silhouette: false },
        { d: rr(leftX + width * 0.16, n.y + 5, 3.5, bottomY - n.y - 9, 0.5), fill: band, silhouette: false },
        { d: rr(leftX + width * 0.68, n.y + 5, 3.5, bottomY - n.y - 9, 0.5), fill: band, silhouette: false },
        { d: rr(leftX, mix(chest.y, body.hip.y, 0.25), width, 3.5, 0.5), fill: band, silhouette: false },
      ],
    };
  }
  const leftX = body.chest.x - panelHalf;
  const width = panelHalf * 2;
  const vY = mix(n.y, chest.y, 0.5);
  return {
    z: 20,
    shapes: [
      { d: `M ${leftX} ${n.y} L ${leftX} ${bottomY} L ${leftX + width} ${bottomY} L ${leftX + width} ${n.y} L ${body.chest.x + panelHalf * 0.34} ${n.y} L ${body.chest.x} ${vY} L ${body.chest.x - panelHalf * 0.34} ${n.y} Z`, fill: '$outfitSecondary', silhouette: false },
      { d: rr(leftX + width * 0.16, n.y + 5, 3.5, bottomY - n.y - 9, 0.5), fill: band, silhouette: false },
      { d: rr(leftX + width * 0.68, n.y + 5, 3.5, bottomY - n.y - 9, 0.5), fill: band, silhouette: false },
      { d: rr(leftX, mix(chest.y, body.hip.y, 0.15), width, 3.5, 0.5), fill: band, silhouette: false },
      { d: rr(leftX, mix(chest.y, body.hip.y, 0.62), width, 3.5, 0.5), fill: band, silhouette: false },
      { d: `M ${body.chest.x} ${vY} L ${body.hip.x} ${bottomY}`, stroke: '#00000030', strokeWidth: 1.5, silhouette: false },
    ],
  };
}

function anchoredLanyard(facing: Facing, body: BodyFacingAnchors): PartVariant {
  const n = body.neck;
  const chest = body.chest;
  if (facing === 'north') {
    return {
      z: 30,
      shapes: [
        {
          d: `M ${n.x - 9} ${n.y + 2} Q ${n.x} ${n.y + 8} ${n.x + 9} ${n.y + 2}`,
          stroke: '$accent',
          strokeWidth: 2.5,
          silhouette: false,
        },
      ],
    };
  }
  if (facing === 'east') {
    const top = { x: n.x + 8, y: n.y + 2 };
    const card = { x: chest.x + 6, y: chest.y - 1 };
    return {
      z: 30,
      shapes: [
        { d: `M ${top.x} ${top.y} L ${card.x + 5} ${card.y}`, stroke: '$accent', strokeWidth: 2.5, silhouette: false },
        { d: rr(card.x, card.y, 9, 11, 2), fill: '#F7F4EC', silhouette: false },
      ],
    };
  }
  const card = { x: chest.x - 7, y: chest.y - 1 };
  return {
    z: 30,
    shapes: [
      { d: `M ${n.x - 9} ${n.y + 1} L ${chest.x - 4} ${card.y} M ${n.x + 9} ${n.y + 1} L ${chest.x + 4} ${card.y}`, stroke: '$accent', strokeWidth: 2.5, silhouette: false },
      { d: rr(card.x, card.y, 14, 11, 2), fill: '#F7F4EC', silhouette: false },
      { d: rr(chest.x - 4.5, card.y + 2.5, 5, 6, 1), fill: '$skin', silhouette: false },
    ],
  };
}

const OUTFITS: PartDef[] = [
  {
    id: 'outfit-tee',
    label: 'Crew tee',
    slot: 'outfit',
    anchor: 'body',
    facings: {
      south: { z: 20, shapes: [{ d: `M -8 -29 A 8 7 0 0 0 8 -29 Z`, fill: '$skin', silhouette: false }] },
      north: { z: 20, shapes: [] },
      east: { z: 20, shapes: [] },
    },
    buildVariant: (facing, context) => context.bodyAnchors && anchoredTee(facing, context.bodyAnchors),
  },
  {
    id: 'outfit-blazer',
    label: 'Blazer',
    slot: 'outfit',
    anchor: 'body',
    facings: {
      south: {
        z: 20,
        shapes: [
          { d: `M -11 -29 L 0 -8 L 11 -29 Z`, fill: '$outfitSecondary', silhouette: false },
          { d: circle(0, 0, 1.8), fill: '#00000033', silhouette: false },
          { d: circle(0, 8, 1.8), fill: '#00000033', silhouette: false },
        ],
      },
      north: {
        z: 20,
        shapes: [{ d: `M 0 -26 L 0 24`, stroke: '#00000022', strokeWidth: 2, silhouette: false }],
      },
      east: {
        z: 20,
        shapes: [{ d: `M 9 -28 L 14 -13 L 17 -28 Z`, fill: '$outfitSecondary', silhouette: false }],
      },
    },
    buildVariant: (facing, context) => context.bodyAnchors && anchoredBlazer(facing, context.bodyAnchors),
  },
  {
    id: 'outfit-polo',
    label: 'Polo',
    slot: 'outfit',
    anchor: 'body',
    facings: {
      south: {
        z: 20,
        shapes: [
          { d: `M -10 -29 L 0 -15 L 10 -29 Z`, fill: '$outfitSecondary', silhouette: false },
          { d: `M 0 -15 L 0 -6`, stroke: '#00000026', strokeWidth: 2, silhouette: false },
        ],
      },
      north: {
        z: 20,
        shapes: [{ d: rr(-11, -29, 22, 5, 2), fill: '$outfitSecondary', silhouette: false }],
      },
      east: {
        z: 20,
        shapes: [{ d: `M 8 -29 L 13 -18 L 16 -29 Z`, fill: '$outfitSecondary', silhouette: false }],
      },
    },
    buildVariant: (facing, context) => context.bodyAnchors && anchoredPolo(facing, context.bodyAnchors),
  },
  {
    id: 'outfit-cardigan',
    label: 'Cardigan',
    slot: 'outfit',
    anchor: 'body',
    facings: {
      south: {
        z: 20,
        shapes: [
          { d: `M -7 -29 L 0 -18 L 7 -29 Z`, fill: '$outfitSecondary', silhouette: false },
          { d: `M 0 -18 L 0 26`, stroke: '#00000030', strokeWidth: 2.5, silhouette: false },
          { d: circle(-3, -4, 1.6), fill: '#00000033', silhouette: false },
          { d: circle(-3, 6, 1.6), fill: '#00000033', silhouette: false },
        ],
      },
      north: { z: 20, shapes: [] },
      east: {
        z: 20,
        shapes: [{ d: `M 14 -24 L 14 20`, stroke: '#00000030', strokeWidth: 2.5, silhouette: false }],
      },
    },
    buildVariant: (facing, context) => context.bodyAnchors && anchoredCardigan(facing, context.bodyAnchors),
  },
  {
    id: 'outfit-shirt-tie',
    label: 'Shirt & tie',
    slot: 'outfit',
    anchor: 'body',
    facings: {
      south: {
        z: 20,
        shapes: [
          { d: `M -11 -29 L 0 -11 L 11 -29 Z`, fill: '$outfitSecondary', silhouette: false },
          { d: `M -3.5 -28 L 3.5 -28 L 4.5 -10 L 0 -4 L -4.5 -10 Z`, fill: '$accent', silhouette: false },
        ],
      },
      north: {
        z: 20,
        shapes: [{ d: rr(-10, -29, 20, 4, 2), fill: '$outfitSecondary', silhouette: false }],
      },
      east: {
        z: 20,
        shapes: [
          { d: `M 9 -28 L 13 -15 L 16 -28 Z`, fill: '$outfitSecondary', silhouette: false },
          { d: `M 11 -23 L 14 -11 L 10 -9 Z`, fill: '$accent', silhouette: false },
        ],
      },
    },
    buildVariant: (facing, context) => context.bodyAnchors && anchoredShirtTie(facing, context.bodyAnchors),
  },
  {
    // Casual: hood draped at the neck, drawstrings, a kangaroo-pocket seam.
    // Same minimal-overlay convention as the other tops — detail on the body
    // capsule, all inside the silhouette.
    id: 'outfit-hoodie',
    label: 'Hoodie',
    slot: 'outfit',
    anchor: 'body',
    facings: {
      south: {
        z: 20,
        shapes: [
          { d: `M -13 -29 Q 0 -19 13 -29 L 9 -23 Q 0 -15 -9 -23 Z`, fill: '$outfitSecondary', silhouette: false },
          { d: `M -3 -18 L -4 -5 M 3 -18 L 4 -5`, stroke: '$accent', strokeWidth: 1.6, silhouette: false },
          { d: circle(-4, -5, 1.4), fill: '$accent', silhouette: false },
          { d: circle(4, -5, 1.4), fill: '$accent', silhouette: false },
          { d: `M -10 7 Q 0 11 10 7`, stroke: '#00000026', strokeWidth: 2, silhouette: false },
        ],
      },
      north: {
        z: 20,
        shapes: [{ d: `M -13 -29 Q 0 -21 13 -29 L 13 -19 Q 0 -13 -13 -19 Z`, fill: '$outfitSecondary', silhouette: false }],
      },
      east: {
        z: 20,
        shapes: [
          { d: `M 8 -29 Q 16 -23 13 -14 L 9 -18 Z`, fill: '$outfitSecondary', silhouette: false },
          { d: `M 12 -15 L 13 -5`, stroke: '$accent', strokeWidth: 1.6, silhouette: false },
        ],
      },
    },
    buildVariant: (facing, context) => context.bodyAnchors && anchoredHoodie(facing, context.bodyAnchors),
  },
  {
    // Formal: notched lapels + tie + buttons. Reads dressier than the blazer
    // without overpainting the torso.
    id: 'outfit-suit-jacket',
    label: 'Suit jacket',
    slot: 'outfit',
    anchor: 'body',
    facings: {
      south: {
        z: 20,
        shapes: [
          { d: `M -12 -29 L -2 -9 L -6 -2 L 0 -8 L 6 -2 L 2 -9 L 12 -29 Z`, fill: '$outfitSecondary', silhouette: false },
          { d: `M -2.6 -9 L 2.6 -9 L 3.6 10 L 0 15 L -3.6 10 Z`, fill: '$accent', silhouette: false },
          { d: circle(-6, 6, 1.6), fill: '#00000033', silhouette: false },
          { d: circle(-6, 14, 1.6), fill: '#00000033', silhouette: false },
        ],
      },
      north: {
        z: 20,
        shapes: [
          { d: rr(-12, -29, 24, 5, 2), fill: '$outfitSecondary', silhouette: false },
          { d: `M 0 -24 L 0 24`, stroke: '#0000002A', strokeWidth: 2, silhouette: false },
        ],
      },
      east: {
        z: 20,
        shapes: [
          { d: `M 9 -29 L 13 -12 L 16 -29 Z`, fill: '$outfitSecondary', silhouette: false },
          { d: `M 11 -12 L 13 -1 L 10 1 Z`, fill: '$accent', silhouette: false },
          { d: circle(11, 8, 1.6), fill: '#00000033', silhouette: false },
        ],
      },
    },
    buildVariant: (facing, context) => context.bodyAnchors && anchoredSuitJacket(facing, context.bodyAnchors),
  },
  {
    // Legacy fallback dress: detail-only art on the old capsule. Body-owned
    // rigs use anchoredDress(), whose A-line silhouette expands per body id.
    id: 'outfit-dress',
    label: 'Dress',
    slot: 'outfit',
    anchor: 'body',
    facings: {
      south: {
        z: 20,
        shapes: [
          { d: `M -9 -29 Q 0 -15 9 -29 Z`, fill: '$outfitSecondary', silhouette: false },
          { d: `M -13 2 L 13 2`, stroke: '$accent', strokeWidth: 2.5, silhouette: false },
          { d: `M -7 5 L -12 26 M 7 5 L 12 26`, stroke: '#0000001E', strokeWidth: 1.6, silhouette: false },
          { d: `M 0 4 L 0 27`, stroke: '#00000018', strokeWidth: 1.4, silhouette: false },
        ],
      },
      north: {
        z: 20,
        shapes: [
          { d: rr(-11, -29, 22, 4, 2), fill: '$outfitSecondary', silhouette: false },
          { d: `M -13 2 L 13 2`, stroke: '$accent', strokeWidth: 2.5, silhouette: false },
          { d: `M 0 4 L 0 27`, stroke: '#00000018', strokeWidth: 1.4, silhouette: false },
        ],
      },
      east: {
        z: 20,
        shapes: [
          { d: `M 7 -29 Q 13 -16 17 -29 Z`, fill: '$outfitSecondary', silhouette: false },
          { d: `M -11 2 L 13 2`, stroke: '$accent', strokeWidth: 2.5, silhouette: false },
          { d: `M 2 5 L -2 26 M 11 5 L 13 26`, stroke: '#0000001E', strokeWidth: 1.6, silhouette: false },
        ],
      },
    },
    buildVariant: (facing, context) => context.bodyAnchors && anchoredDress(facing, context.bodyAnchors, context.bodyId),
  },
  {
    // High rolled collar covering the neck — distinct, minimal silhouette read.
    id: 'outfit-turtleneck',
    label: 'Turtleneck',
    slot: 'outfit',
    anchor: 'body',
    facings: {
      south: {
        z: 20,
        shapes: [
          { d: rr(-7, -29, 14, 9, 4), fill: '$outfitSecondary', silhouette: false },
          { d: `M -7 -23 Q 0 -20 7 -23`, stroke: '#0000001E', strokeWidth: 1.4, silhouette: false },
        ],
      },
      north: { z: 20, shapes: [{ d: rr(-7, -29, 14, 8, 4), fill: '$outfitSecondary', silhouette: false }] },
      east: {
        z: 20,
        shapes: [{ d: rr(5, -29, 12, 9, 4), fill: '$outfitSecondary', silhouette: false }],
      },
    },
    buildVariant: (facing, context) => context.bodyAnchors && anchoredTurtleneck(facing, context.bodyAnchors),
  },
  {
    // Sweater vest over a collared shirt: V-neck panel + shirt V + buttons.
    id: 'outfit-vest',
    label: 'Sweater vest',
    slot: 'outfit',
    anchor: 'body',
    facings: {
      south: {
        z: 20,
        shapes: [
          { d: `M -12 -29 L 0 -7 L 12 -29 L 12 18 L -12 18 Z`, fill: '$outfitSecondary', silhouette: false },
          { d: `M -6 -29 L 0 -11 L 6 -29 Z`, fill: '$accent', silhouette: false },
          { d: circle(0, 1, 1.5), fill: '#00000030', silhouette: false },
          { d: circle(0, 9, 1.5), fill: '#00000030', silhouette: false },
        ],
      },
      north: { z: 20, shapes: [{ d: rr(-12, -29, 24, 47, 4), fill: '$outfitSecondary', silhouette: false }] },
      east: {
        z: 20,
        shapes: [
          { d: `M 7 -29 L 12 -12 L 17 -29 L 17 18 L 7 18 Z`, fill: '$outfitSecondary', silhouette: false },
          { d: `M 9 -29 L 12 -16 L 15 -29 Z`, fill: '$accent', silhouette: false },
        ],
      },
    },
    buildVariant: (facing, context) => context.bodyAnchors && anchoredVest(facing, context.bodyAnchors),
  },
  {
    // Hi-vis safety vest (B1.5 construction crew). The vest is $outfitSecondary
    // (the hi-vis fabric) over the $outfitPrimary work shirt; reflective bands are
    // a fixed silver literal so they read as reflective regardless of swatch. Bold
    // vest panel + horizontal bands so it survives the unit-pictogram / portrait
    // flattening (IRIS's own drawing loses fine detail).
    id: 'outfit-hi-vis',
    label: 'Hi-vis vest',
    slot: 'outfit',
    anchor: 'body',
    facings: {
      south: {
        z: 20,
        shapes: [
          // open-front vest panel with a shallow collar V
          { d: `M -12 -29 L -12 20 L 12 20 L 12 -29 L 4 -29 L 0 -20 L -4 -29 Z`, fill: '$outfitSecondary', silhouette: false },
          // reflective bands over each shoulder + two across the chest (silver literal)
          { d: rr(-9, -19, 3.5, 15, 0.5), fill: '#E4E8EC', silhouette: false },
          { d: rr(5.5, -19, 3.5, 15, 0.5), fill: '#E4E8EC', silhouette: false },
          { d: rr(-12, -6, 24, 3.5, 0.5), fill: '#E4E8EC', silhouette: false },
          { d: rr(-12, 3, 24, 3.5, 0.5), fill: '#E4E8EC', silhouette: false },
          // center zip
          { d: `M 0 -19 L 0 20`, stroke: '#00000030', strokeWidth: 1.5, silhouette: false },
        ],
      },
      north: {
        z: 20,
        shapes: [
          { d: rr(-12, -29, 24, 49, 3), fill: '$outfitSecondary', silhouette: false },
          { d: rr(-9, -24, 3.5, 40, 0.5), fill: '#E4E8EC', silhouette: false },
          { d: rr(5.5, -24, 3.5, 40, 0.5), fill: '#E4E8EC', silhouette: false },
          { d: rr(-12, -4, 24, 3.5, 0.5), fill: '#E4E8EC', silhouette: false },
        ],
      },
      east: {
        z: 20,
        shapes: [
          { d: `M 7 -29 L 7 20 L 17 20 L 17 -29 Z`, fill: '$outfitSecondary', silhouette: false },
          { d: rr(7, -19, 10, 3.5, 0.5), fill: '#E4E8EC', silhouette: false },
          { d: rr(7, -6, 10, 3.5, 0.5), fill: '#E4E8EC', silhouette: false },
          { d: rr(7, 3, 10, 3.5, 0.5), fill: '#E4E8EC', silhouette: false },
        ],
      },
    },
    buildVariant: (facing, context) => context.bodyAnchors && anchoredHiVis(facing, context.bodyAnchors),
  },
];

// ---------------------------------------------------------------------------
// Accessories.
// ---------------------------------------------------------------------------

const ACCESSORIES: PartDef[] = [
  {
    id: 'acc-glasses',
    label: 'Glasses',
    slot: 'accessory',
    anchor: 'headCenter',
    facings: {
      south: {
        z: 60,
        shapes: [
          { d: circle(-8, 0, 6), stroke: INK, strokeWidth: 2, silhouette: false },
          { d: circle(8, 0, 6), stroke: INK, strokeWidth: 2, silhouette: false },
          { d: `M -2 0 L 2 0`, stroke: INK, strokeWidth: 2, silhouette: false },
        ],
      },
      east: {
        z: 60,
        shapes: [
          { d: circle(11, 0, 6), stroke: INK, strokeWidth: 2, silhouette: false },
          { d: `M 5 -1 L -8 -3`, stroke: INK, strokeWidth: 2, silhouette: false },
        ],
      },
    },
  },
  {
    id: 'acc-lanyard',
    label: 'Lanyard',
    slot: 'accessory',
    anchor: 'body',
    facings: {
      south: {
        z: 30,
        shapes: [
          { d: `M -9 -28 L -4 -8 M 9 -28 L 4 -8`, stroke: '$accent', strokeWidth: 2.5, silhouette: false },
          { d: rr(-7, -8, 14, 11, 2), fill: '#F7F4EC', silhouette: false },
          { d: rr(-4.5, -5.5, 5, 6, 1), fill: '$skin', silhouette: false },
        ],
      },
      north: {
        z: 30,
        shapes: [{ d: `M -9 -27 A 11 6 0 0 0 9 -27`, stroke: '$accent', strokeWidth: 2.5, silhouette: false }],
      },
      east: {
        z: 30,
        shapes: [
          { d: `M 10 -27 L 12 -8`, stroke: '$accent', strokeWidth: 2.5, silhouette: false },
          { d: rr(7, -8, 9, 11, 2), fill: '#F7F4EC', silhouette: false },
        ],
      },
    },
    buildVariant: (facing, context) => context.bodyAnchors && anchoredLanyard(facing, context.bodyAnchors),
  },
  {
    id: 'acc-mug',
    label: 'Coffee mug',
    slot: 'accessory',
    anchor: 'handRight',
    handAttachmentRole: 'held-prop',
    facings: {
      south: {
        z: 30,
        shapes: [
          { d: circle(9, 0, 4.5), stroke: '$accent', strokeWidth: 2.5 },
          { d: rr(-6, -7, 13, 14, 2), fill: '$accent' },
        ],
      },
      east: {
        z: 30,
        shapes: [
          { d: circle(8, 0, 4.5), stroke: '$accent', strokeWidth: 2.5 },
          { d: rr(-6, -7, 12, 14, 2), fill: '$accent' },
        ],
      },
    },
  },
  {
    id: 'acc-badge',
    label: 'Badge clip',
    slot: 'accessory',
    anchor: 'chest',
    facings: {
      south: {
        z: 30,
        shapes: [
          { d: rr(8, -4, 11, 8, 1.5), fill: '#F7F4EC', silhouette: false },
          { d: `M 13 -4 L 13 -8`, stroke: INK, strokeWidth: 1.5, silhouette: false },
        ],
      },
      east: {
        z: 30,
        shapes: [{ d: rr(8, -4, 8, 8, 1.5), fill: '#F7F4EC', silhouette: false }],
      },
    },
  },
  {
    id: 'acc-headset',
    label: 'Headset',
    slot: 'accessory',
    anchor: 'headCenter',
    facings: {
      south: {
        z: 60,
        shapes: [
          { d: `M -21 -6 A 22 22 0 0 1 21 -6`, stroke: INK, strokeWidth: 3, silhouette: false },
          { d: ellipse(-20, 0, 3.5, 5), fill: INK },
          { d: ellipse(20, 0, 3.5, 5), fill: INK },
          { d: `M 19 5 Q 16 14 6 12`, stroke: INK, strokeWidth: 2, silhouette: false },
          { d: circle(5, 12, 2.5), fill: INK, silhouette: false },
        ],
      },
      east: {
        z: 60,
        shapes: [
          { d: `M -18 -10 A 20 20 0 0 1 16 -12`, stroke: INK, strokeWidth: 3, silhouette: false },
          { d: ellipse(-2, -2, 4, 5.5), fill: INK },
          { d: `M 0 3 Q 6 12 14 10`, stroke: INK, strokeWidth: 2, silhouette: false },
          { d: circle(15, 10, 2.5), fill: INK, silhouette: false },
        ],
      },
      north: {
        z: 60,
        shapes: [
          { d: `M -21 -6 A 22 22 0 0 1 21 -6`, stroke: INK, strokeWidth: 3, silhouette: false },
          { d: ellipse(-20, 0, 3.5, 5), fill: INK },
          { d: ellipse(20, 0, 3.5, 5), fill: INK },
        ],
      },
    },
  },
  {
    // Hard hat (B1.5 construction crew). A domed shell + front brim on the crown,
    // painted $accent (the recipe's safety colour) so it reads as hi-vis; z 60 so
    // it sits over the hair. Bold silhouette so it survives the unit-pictogram.
    id: 'acc-hard-hat',
    label: 'Hard hat',
    slot: 'accessory',
    anchor: 'headCenter',
    facings: {
      south: {
        z: 60,
        shapes: [
          // domed shell over the crown
          { d: `M -19 -6 Q 0 -30 19 -6 Z`, fill: '$accent', silhouette: false },
          // front brim jutting toward the viewer
          { d: `M -21 -6 Q 0 0 21 -6 L 19 -9 Q 0 -4 -19 -9 Z`, fill: '$accent', silhouette: false },
          // crown ridges
          { d: `M 0 -25 L 0 -6`, stroke: '#00000026', strokeWidth: 2, silhouette: false },
          { d: `M -8 -20 L -8 -6 M 8 -20 L 8 -6`, stroke: '#00000018', strokeWidth: 1.5, silhouette: false },
        ],
      },
      east: {
        z: 60,
        shapes: [
          { d: `M -16 -6 Q 3 -30 17 -8 Z`, fill: '$accent', silhouette: false },
          // brim jutting east (the direction faced)
          { d: `M 11 -6 Q 22 -4 25 -9 L 23 -12 Q 14 -9 11 -9 Z`, fill: '$accent', silhouette: false },
          { d: `M 1 -25 L 3 -8`, stroke: '#00000022', strokeWidth: 2, silhouette: false },
        ],
      },
      north: {
        z: 60,
        shapes: [
          { d: `M -19 -6 Q 0 -30 19 -6 Z`, fill: '$accent', silhouette: false },
          { d: `M 0 -25 L 0 -6`, stroke: '#00000022', strokeWidth: 2, silhouette: false },
          { d: `M -8 -20 L -8 -6 M 8 -20 L 8 -6`, stroke: '#00000018', strokeWidth: 1.5, silhouette: false },
        ],
      },
    },
  },
  {
    id: 'acc-watch',
    label: 'Watch',
    slot: 'accessory',
    anchor: 'handRight',
    handAttachmentRole: 'wrist-worn',
    facings: {
      south: {
        z: 31,
        shapes: [
          { d: `M -2 -8 L -2 8`, stroke: INK, strokeWidth: 3, silhouette: false },
          { d: circle(-2, 0, 3.5), fill: '$accent', silhouette: false },
        ],
      },
      east: {
        z: 31,
        shapes: [
          { d: `M -3 -7 L -3 7`, stroke: INK, strokeWidth: 3, silhouette: false },
          { d: circle(-3, 0, 3.5), fill: '$accent', silhouette: false },
        ],
      },
      north: {
        z: 31,
        shapes: [
          { d: `M -2 -8 L -2 8`, stroke: INK, strokeWidth: 3, silhouette: false },
          { d: circle(-2, 0, 3), fill: '$accent', silhouette: false },
        ],
      },
    },
  },
  {
    id: 'acc-earbuds',
    label: 'Earbuds',
    slot: 'accessory',
    anchor: 'headCenter',
    facings: {
      south: {
        z: 60,
        shapes: [
          { d: circle(-18, 2, 2.6), fill: '#F7F4EC', silhouette: false },
          { d: circle(18, 2, 2.6), fill: '#F7F4EC', silhouette: false },
          { d: `M -17 4 Q -10 13 -2 15 M 17 4 Q 10 13 2 15`, stroke: '#F7F4EC', strokeWidth: 1.6, silhouette: false },
        ],
      },
      east: {
        z: 60,
        shapes: [
          { d: circle(17, 2, 2.6), fill: '#F7F4EC', silhouette: false },
          { d: `M 17 4 Q 12 13 5 15`, stroke: '#F7F4EC', strokeWidth: 1.6, silhouette: false },
        ],
      },
      north: {
        z: 60,
        shapes: [
          { d: circle(-18, 2, 2.3), fill: '#F7F4EC', silhouette: false },
          { d: circle(18, 2, 2.3), fill: '#F7F4EC', silhouette: false },
        ],
      },
    },
  },
  {
    id: 'acc-clipboard',
    label: 'Clipboard',
    slot: 'accessory',
    anchor: 'handRight',
    handAttachmentRole: 'held-prop',
    facings: {
      south: {
        z: 32,
        shapes: [
          { d: rr(-9, -15, 18, 24, 2), fill: '#8B5A2B' },
          { d: rr(-6, -11, 12, 17, 1), fill: '#F7F4EC', silhouette: false },
          { d: rr(-4, -18, 8, 5, 2), fill: INK, silhouette: false },
          { d: `M -3 -5 L 4 -5 M -3 0 L 5 0`, stroke: '#00000035', strokeWidth: 1.2, silhouette: false },
        ],
      },
      east: {
        z: 32,
        shapes: [
          { d: rr(-7, -15, 15, 24, 2), fill: '#8B5A2B' },
          { d: rr(-4, -11, 9, 17, 1), fill: '#F7F4EC', silhouette: false },
          { d: rr(-2, -18, 7, 5, 2), fill: INK, silhouette: false },
        ],
      },
      north: {
        z: 32,
        shapes: [
          { d: rr(-8, -14, 16, 22, 2), fill: '#8B5A2B' },
          { d: rr(-5, -10, 10, 15, 1), fill: '#F7F4EC', silhouette: false },
        ],
      },
    },
  },
  {
    id: 'acc-coffee-tray',
    label: 'Coffee run',
    slot: 'accessory',
    anchor: 'handRight',
    handAttachmentRole: 'held-prop',
    facings: {
      south: {
        z: 32,
        shapes: [
          { d: rr(-14, -2, 24, 12, 3), fill: '#B8893B' },
          { d: circle(-7, -4, 4.2), fill: '$accent' },
          { d: circle(3, -4, 4.2), fill: '$outfitSecondary' },
          { d: `M -10 -9 L -4 -9 M 0 -9 L 6 -9`, stroke: '#F7F4EC', strokeWidth: 2, silhouette: false },
        ],
      },
      east: {
        z: 32,
        shapes: [
          { d: rr(-12, -1, 21, 11, 3), fill: '#B8893B' },
          { d: circle(-5, -4, 4), fill: '$accent' },
          { d: circle(4, -4, 4), fill: '$outfitSecondary' },
        ],
      },
      north: {
        z: 32,
        shapes: [
          { d: rr(-13, -1, 23, 11, 3), fill: '#B8893B' },
          { d: circle(-6, -4, 4), fill: '$accent' },
          { d: circle(4, -4, 4), fill: '$outfitSecondary' },
        ],
      },
    },
  },
  {
    id: 'acc-paper-stack',
    label: 'Stack of papers',
    slot: 'accessory',
    anchor: 'handRight',
    handAttachmentRole: 'held-prop',
    facings: {
      south: {
        z: 32,
        shapes: [
          { d: rr(-11, -12, 21, 25, 1.5), fill: '#DCE6EC' },
          { d: rr(-8, -15, 21, 25, 1.5), fill: '#F7F4EC' },
          { d: `M -4 -7 L 8 -7 M -4 -2 L 8 -2 M -4 3 L 5 3`, stroke: '#00000030', strokeWidth: 1.3, silhouette: false },
        ],
      },
      east: {
        z: 32,
        shapes: [
          { d: rr(-9, -12, 18, 24, 1.5), fill: '#DCE6EC' },
          { d: rr(-6, -15, 18, 24, 1.5), fill: '#F7F4EC' },
          { d: `M -2 -7 L 6 -7 M -2 -2 L 6 -2`, stroke: '#00000030', strokeWidth: 1.3, silhouette: false },
        ],
      },
      north: {
        z: 32,
        shapes: [
          { d: rr(-10, -12, 20, 24, 1.5), fill: '#DCE6EC' },
          { d: rr(-7, -15, 20, 24, 1.5), fill: '#F7F4EC' },
        ],
      },
    },
  },
];

// ---------------------------------------------------------------------------
// IRIS fabrication unit (the construction crew — robots operated by IRIS, not
// people). Reuses the warm walk/pose rig (body-broad, so arms + poses attach
// unchanged) but swaps to a chassis head + plating so the crew reads as IRIS's
// machines, not staff. The single GREEN OPTIC is a literal (#5BE08A, the IRIS
// installation unit's beacon hue) so it survives re-tint + the unit-pictogram
// flattening — you know they're IRIS's by the shared eye.
// ---------------------------------------------------------------------------

const IRIS_OPTIC = '#5BE08A';

const FAB_PARTS: PartDef[] = [
  {
    id: 'head-fab',
    label: 'Fabrication unit head',
    slot: 'head',
    anchor: 'headCenter',
    noFace: true, // a machine — moods arrive as IRIS claims, never on the head
    facings: {
      south: {
        z: 40,
        shapes: [
          { d: rr(-19, -19, 38, 38, 8), fill: '$skin' }, // chassis dome
          { d: rr(-6, -21, 12, 3, 1), fill: '$outfitSecondary', silhouette: false }, // top vent
          { d: rr(-19, -7, 38, 13, 4), fill: '$outfitSecondary', silhouette: false }, // visor band
          { d: circle(0, 0, 5.5), fill: `${IRIS_OPTIC}30`, silhouette: false }, // optic halo
          { d: circle(0, 0, 3.2), fill: IRIS_OPTIC, silhouette: false }, // green optic
        ],
      },
      east: {
        z: 40,
        shapes: [
          { d: rr(-17, -19, 34, 38, 8), fill: '$skin' },
          { d: rr(-15, -7, 30, 13, 4), fill: '$outfitSecondary', silhouette: false },
          { d: circle(9, 0, 5), fill: `${IRIS_OPTIC}30`, silhouette: false },
          { d: circle(9, 0, 3), fill: IRIS_OPTIC, silhouette: false },
        ],
      },
      north: {
        z: 40,
        shapes: [
          { d: rr(-19, -19, 38, 38, 8), fill: '$skin' },
          { d: rr(-8, -6, 16, 11, 2), fill: '$outfitSecondary', silhouette: false }, // rear vent panel
          { d: circle(0, 0, 1.6), fill: IRIS_OPTIC, silhouette: false }, // rear status pip
        ],
      },
    },
  },
  {
    id: 'outfit-fab-chassis',
    label: 'Fabrication chassis',
    slot: 'outfit',
    anchor: 'body',
    facings: {
      south: {
        z: 20,
        shapes: [
          { d: rr(-12, -29, 24, 49, 4), fill: '$outfitPrimary', silhouette: false }, // chest plate
          { d: rr(-12, -29, 5, 13, 2), fill: '$outfitSecondary', silhouette: false }, // L shoulder panel
          { d: rr(7, -29, 5, 13, 2), fill: '$outfitSecondary', silhouette: false }, // R shoulder panel
          { d: rr(-12, -2, 24, 5, 1), fill: '$outfitSecondary', silhouette: false }, // vent band
          { d: `M 0 -22 L 0 20`, stroke: '#00000030', strokeWidth: 1.5, silhouette: false }, // seam
          { d: circle(0, -17, 4), fill: `${IRIS_OPTIC}30`, silhouette: false }, // core halo
          { d: circle(0, -17, 2.2), fill: IRIS_OPTIC, silhouette: false }, // IRIS core light
        ],
      },
      north: {
        z: 20,
        shapes: [
          { d: rr(-12, -29, 24, 49, 3), fill: '$outfitPrimary', silhouette: false },
          { d: rr(-12, -29, 5, 13, 2), fill: '$outfitSecondary', silhouette: false },
          { d: rr(7, -29, 5, 13, 2), fill: '$outfitSecondary', silhouette: false },
          { d: rr(-9, -6, 18, 5, 1), fill: '$outfitSecondary', silhouette: false }, // back vent
        ],
      },
      east: {
        z: 20,
        shapes: [
          { d: rr(7, -29, 10, 49, 4), fill: '$outfitPrimary', silhouette: false },
          { d: rr(7, -29, 5, 13, 2), fill: '$outfitSecondary', silhouette: false },
          { d: rr(7, -2, 10, 5, 1), fill: '$outfitSecondary', silhouette: false },
          { d: circle(12, -17, 2), fill: IRIS_OPTIC, silhouette: false },
        ],
      },
    },
  },
];

export const PART_LIBRARY: PartDef[] = [...BODY_ARCHETYPE_PARTS, ...HEADS, ...HAIR, ...OUTFITS, ...ACCESSORIES, ...FAB_PARTS];

// ---------------------------------------------------------------------------
// Internal parts — resolvable by id but NOT offered in the authoring pickers.
// These are the operational-unit pictogram (register-constitution.md Article
// VIII): IRIS's own drawing of a person, not an authorable character choice.
// The mockup grammar: a flat coding-hue figure with a featureless dark head
// disc — no face, no hair; identity is color + silhouette + (sim-side) label.
// Same canvas, anchors and pose rig as the warm bodies, so arms/poses attach
// unchanged.
// ---------------------------------------------------------------------------

export const INTERNAL_PARTS: PartDef[] = [
  {
    id: 'body-unit',
    label: 'Unit (internal)',
    slot: 'body',
    anchor: 'body',
    facings: {
      // Rounded shoulders tapering slightly to the base — pictogram bullet.
      south: {
        z: 10,
        shapes: [
          { d: 'M -24 -6 Q -24 -29 0 -29 Q 24 -29 24 -6 L 20 19 Q 18 29 8 29 L -8 29 Q -18 29 -20 19 Z', fill: '$outfitPrimary' },
        ],
      },
      north: {
        z: 10,
        shapes: [
          { d: 'M -24 -6 Q -24 -29 0 -29 Q 24 -29 24 -6 L 20 19 Q 18 29 8 29 L -8 29 Q -18 29 -20 19 Z', fill: '$outfitPrimary' },
        ],
      },
      east: {
        z: 10,
        shapes: [
          { d: 'M -18 -6 Q -18 -29 0 -29 Q 18 -29 18 -6 L 15 19 Q 13 29 6 29 L -6 29 Q -13 29 -15 19 Z', fill: '$outfitPrimary' },
        ],
      },
    },
  },
  {
    id: 'head-unit',
    label: 'Unit head (internal)',
    slot: 'head',
    anchor: 'headCenter',
    noFace: true,
    facings: {
      // A featureless disc in the unit ink — the unit has no face. Feelings
      // arrive as IRIS claims, never on the head.
      south: { z: 40, shapes: [{ d: circle(0, 0, 18), fill: '$skin' }] },
      east: { z: 40, shapes: [{ d: circle(1, 0, 17), fill: '$skin' }] },
      north: { z: 40, shapes: [{ d: circle(0, 0, 18), fill: '$skin' }] },
    },
  },
];

// Legacy bodies remain resolvable for existing recipes and the unchanged named
// cast, but stay outside PART_LIBRARY so pickers and generation cannot select
// them for new characters. Renderer-owned unit parts are likewise resolvable
// without becoming authoring choices.
const byId = new Map(
  [...PART_LIBRARY, ...LEGACY_BODY_PARTS, ...INTERNAL_PARTS].map((p) => [p.id, p]),
);

export function getPart(id: string): PartDef | undefined {
  return byId.get(id);
}

/** Authoring pickers only — internal (renderer-owned) parts are excluded. */
export function partsForSlot(slot: Slot): PartDef[] {
  return PART_LIBRARY.filter((p) => p.slot === slot);
}
