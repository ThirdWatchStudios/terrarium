import { circle, ellipse } from '../core/geometry';
import type { Facing, PartVariant, ShapeSpec } from '../core/types';
import { IMPORTED_PART_ART } from './generated/importedPartArt';
import type { ImportedHeadFittedPartOverlay, ImportedPartOverlay } from './importedArt';

/**
 * The first promoted head-aware hair carriers.
 *
 * Recipes keep these stable IDs. Terrarium resolves one fixed facing variant
 * from the recipe's head ID before flat or layered composition, so Unity still
 * receives ordinary baked sprites and no fit metadata or animation state.
 */
export const FITTED_HAIR_IDS = [
  'hair-short',
  'hair-bob',
  'hair-bun',
  'hair-curly',
  'hair-balding',
  'hair-side-part',
  'hair-pixie',
  'hair-ponytail',
  'hair-long-straight',
  'hair-coils',
] as const;

export type FittedHairId = typeof FITTED_HAIR_IDS[number];

export const FITTED_HAIR_HEAD_IDS = [
  'head-round',
  'head-oval',
  'head-long',
  'head-boxy',
  'head-angular',
  'head-soft-square',
] as const;

export type FittedHairHeadId = typeof FITTED_HAIR_HEAD_IDS[number];

const CANONICAL_HEAD_FITTED_ART = (
  IMPORTED_PART_ART as readonly ImportedPartOverlay[]
).filter((entry): entry is ImportedHeadFittedPartOverlay =>
  entry.kind === 'head-fitted-art');

const CANONICAL_HEAD_FITTED_BY_ID = new Map(
  CANONICAL_HEAD_FITTED_ART.map((entry) => [entry.id, entry]),
);

interface HeadHairFit {
  southHalf: number;
  northHalf: number;
  crownY: number;
  eastBack: number;
  eastFront: number;
}

const HEAD_HAIR_FITS: Record<FittedHairHeadId, HeadHairFit> = {
  'head-round': {
    southHalf: 21,
    northHalf: 21,
    crownY: -21,
    eastBack: -21,
    eastFront: 14,
  },
  'head-oval': {
    southHalf: 27,
    northHalf: 27,
    crownY: -20,
    eastBack: -26,
    eastFront: 17,
  },
  'head-long': {
    southHalf: 14,
    northHalf: 14,
    crownY: -22,
    eastBack: -16,
    eastFront: 10,
  },
  'head-boxy': {
    southHalf: 20,
    northHalf: 20,
    crownY: -21,
    eastBack: -20,
    eastFront: 14,
  },
  'head-angular': {
    southHalf: 23,
    northHalf: 23,
    crownY: -21,
    eastBack: -21,
    eastFront: 16,
  },
  'head-soft-square': {
    southHalf: 15,
    northHalf: 15,
    crownY: -21,
    eastBack: -22,
    eastFront: 10,
  },
};

const compact = (value: number): number => Number(value.toFixed(1));
const hairShape = (d: string): ShapeSpec => ({ d, fill: '$hair' });
const hairVariant = (...shapes: ShapeSpec[]): PartVariant => ({ z: 50, shapes });

function fittedCap(
  half: number,
  crownY: number,
  hairlineY: number,
  broken = false,
): ShapeSpec {
  const width = compact(half + 1);
  const crown = compact(crownY - 1);
  const base = broken
    ? (
      `L ${compact(width * 0.68)} ${hairlineY} ` +
      `L ${compact(width * 0.38)} ${hairlineY - 4} ` +
      `L ${compact(width * 0.08)} ${hairlineY} ` +
      `L ${compact(-width * 0.25)} ${hairlineY - 4} ` +
      `L ${compact(-width * 0.62)} ${hairlineY}`
    )
    : (
      `L ${compact(width * 0.58)} ${hairlineY} ` +
      `C ${compact(width * 0.25)} ${hairlineY - 5} ` +
      `${compact(-width * 0.22)} ${hairlineY - 5} ` +
      `${compact(-width * 0.6)} ${hairlineY}`
    );
  return hairShape(
    `M ${-width} ${hairlineY - 3} ` +
    `C ${compact(-width * 0.92)} ${compact(crown + 6)} ${compact(-width * 0.48)} ${crown} 0 ${crown} ` +
    `C ${compact(width * 0.5)} ${crown} ${compact(width * 0.92)} ${compact(crown + 6)} ${width} ${hairlineY - 3} ` +
    `${base} Z`,
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
    `M ${back} ${hairlineY} ` +
    `C ${compact(back + 2)} ${compact(crown + 6)} ${compact(back * 0.48)} ${crown} ${compact(-2 + sweep * 0.15)} ${crown} ` +
    `C ${compact(front - 5)} ${crown} ${front} ${compact(crown + 7)} ${front} ${hairlineY - 5} ` +
    `L ${compact(front - 4)} ${hairlineY} ` +
    `L ${compact(front - 10)} ${hairlineY + 3} ` +
    `L ${compact(front - 16)} ${hairlineY} ` +
    `C ${compact(front - 21)} ${hairlineY - 3} ${compact(back + 8)} ${hairlineY - 1} ${compact(back + 5)} ${hairlineY + 3} ` +
    `L ${back} ${backDrop} Z`,
  );
}

function curlyFacings(fit: HeadHairFit): Record<Facing, PartVariant> {
  const southWidth = fit.southHalf;
  const northWidth = fit.northHalf;
  const crown = fit.crownY + 4;
  const back = fit.eastBack;
  const front = fit.eastFront;
  const radius = Math.max(6, Math.min(8, compact(fit.southHalf * 0.34)));
  return {
    south: hairVariant(
      hairShape(circle(compact(-southWidth * 0.86), 1, radius + 1)),
      hairShape(circle(compact(-southWidth * 0.5), compact(crown + 8), radius + 2)),
      hairShape(circle(0, compact(crown + 3), radius + 1)),
      hairShape(circle(compact(southWidth * 0.48), compact(crown + 8), radius + 2)),
      hairShape(circle(compact(southWidth * 0.86), 2, radius + 1)),
    ),
    east: hairVariant(
      hairShape(circle(compact(back + 2), 2, radius + 1)),
      hairShape(circle(compact(back + 7), compact(crown + 8), radius + 2)),
      hairShape(circle(compact(back + 18), compact(crown + 3), radius + 1)),
      hairShape(circle(compact(front - 5), compact(crown + 9), radius + 1)),
    ),
    north: hairVariant(
      hairShape(circle(compact(-northWidth * 0.86), 2, radius + 1)),
      hairShape(circle(compact(-northWidth * 0.5), compact(crown + 9), radius + 2)),
      hairShape(circle(0, compact(crown + 4), radius + 1)),
      hairShape(circle(compact(northWidth * 0.48), compact(crown + 9), radius + 2)),
      hairShape(circle(compact(northWidth * 0.86), 3, radius + 1)),
    ),
  };
}

function baldingFacings(fit: HeadHairFit): Record<Facing, PartVariant> {
  const southX = compact(fit.southHalf * 0.9);
  const northWidth = compact(fit.northHalf + 1);
  const templeWidth = Math.max(4, compact(fit.southHalf * 0.22));
  const back = compact(fit.eastBack + 4);
  const crown = compact(fit.crownY + 5);
  return {
    south: hairVariant(
      hairShape(ellipse(-southX, 5, templeWidth, 7.5)),
      hairShape(ellipse(southX, 5, templeWidth, 7.5)),
    ),
    east: hairVariant(
      hairShape(ellipse(back, 5, Math.max(5, templeWidth), 7.5)),
    ),
    north: hairVariant(
      hairShape(
        `M ${-northWidth} -2 ` +
        `C ${compact(-northWidth * 0.88)} ${compact(crown - 7)} ${compact(-northWidth * 0.42)} ${crown} 0 ${crown} ` +
        `C ${compact(northWidth * 0.42)} ${crown} ${compact(northWidth * 0.88)} ${compact(crown - 7)} ${northWidth} -2 ` +
        `L ${compact(northWidth - 1)} 10 ` +
        `C ${compact(northWidth * 0.45)} 5 ${compact(-northWidth * 0.45)} 5 ${compact(-northWidth + 1)} 10 Z`,
      ),
    ),
  };
}

function sidePartFacings(fit: HeadHairFit): Record<Facing, PartVariant> {
  const southWidth = compact(fit.southHalf + 2);
  const northWidth = compact(fit.northHalf + 2);
  const crown = compact(fit.crownY - 1);
  const back = compact(fit.eastBack - 2);
  return {
    south: hairVariant(
      hairShape(
        `M ${-southWidth} -3 ` +
        `C ${compact(-southWidth * 0.85)} ${compact(crown + 5)} ${compact(-southWidth * 0.35)} ${crown} 3 ${crown} ` +
        `C ${compact(southWidth * 0.58)} ${crown} ${southWidth} ${compact(crown + 7)} ${southWidth} -4 ` +
        `L ${compact(southWidth * 0.66)} 3 ` +
        `C ${compact(southWidth * 0.24)} -5 ${compact(-southWidth * 0.2)} -7 ${compact(-southWidth * 0.62)} 1 ` +
        `L ${compact(-southWidth * 0.88)} 9 Z`,
      ),
      hairShape(ellipse(compact(southWidth - 3), 5, 5, 10)),
    ),
    east: hairVariant(
      profileCap(fit, { hairlineY: -3, backDrop: 10, sweep: 2 }),
      hairShape(
        `M ${back} -3 ` +
        `C ${compact(back - 8)} 1 ${compact(back - 8)} 12 ${compact(back - 1)} 17 ` +
        `C ${compact(back + 6)} 14 ${compact(back + 7)} 6 ${compact(back + 4)} 0 Z`,
      ),
    ),
    north: hairVariant(
      hairShape(
        `M ${-northWidth} -3 ` +
        `C ${compact(-northWidth * 0.85)} ${compact(crown + 5)} ${compact(-northWidth * 0.32)} ${crown} 4 ${crown} ` +
        `C ${compact(northWidth * 0.62)} ${crown} ${northWidth} ${compact(crown + 7)} ${northWidth} -3 ` +
        `L ${compact(northWidth * 0.9)} 11 H ${compact(-northWidth * 0.72)} L ${-northWidth} 6 Z`,
      ),
    ),
  };
}

function pixieFacings(fit: HeadHairFit): Record<Facing, PartVariant> {
  const southWidth = compact(fit.southHalf + 1);
  const northWidth = compact(fit.northHalf + 1);
  const back = compact(fit.eastBack);
  return {
    south: hairVariant(
      fittedCap(fit.southHalf, fit.crownY + 4, 2, true),
      hairShape(
        `M ${compact(-southWidth * 0.75)} -2 ` +
        `L ${compact(-southWidth * 0.42)} 4 L ${compact(-southWidth * 0.12)} -1 ` +
        `L ${compact(southWidth * 0.2)} 5 L ${compact(southWidth * 0.5)} -1 ` +
        `L ${compact(southWidth * 0.82)} 3 L ${compact(southWidth * 0.76)} -5 ` +
        `L ${compact(-southWidth * 0.72)} -5 Z`,
      ),
      hairShape(
        `M ${compact(-southWidth + 1)} -5 ` +
        `L ${compact(-southWidth - 5)} -1 L ${compact(-southWidth + 1)} 5 Z`,
      ),
    ),
    east: hairVariant(
      profileCap(fit, { hairlineY: 0, backDrop: 5 }),
      hairShape(
        `M ${compact(fit.eastFront - 8)} -7 ` +
        `L ${compact(fit.eastFront + 1)} -1 L ${compact(fit.eastFront - 4)} 4 ` +
        `L ${compact(fit.eastFront - 12)} 0 Z`,
      ),
      hairShape(
        `M ${back} -2 C ${compact(back - 6)} 2 ${compact(back - 5)} 9 ${compact(back + 2)} 12 ` +
        `L ${compact(back + 6)} 5 L ${compact(back + 4)} -1 Z`,
      ),
    ),
    north: hairVariant(
      hairShape(
        `M ${-northWidth} 4 ` +
        `C ${compact(-northWidth * 0.88)} ${compact(fit.crownY + 8)} ${compact(-northWidth * 0.4)} ${compact(fit.crownY + 3)} 0 ${compact(fit.crownY + 3)} ` +
        `C ${compact(northWidth * 0.45)} ${compact(fit.crownY + 3)} ${compact(northWidth * 0.9)} ${compact(fit.crownY + 8)} ${northWidth} 4 ` +
        `L ${compact(northWidth * 0.72)} 10 L ${compact(northWidth * 0.35)} 6 ` +
        `L 0 11 L ${compact(-northWidth * 0.35)} 6 L ${compact(-northWidth * 0.72)} 10 Z`,
      ),
      hairShape(
        `M ${compact(northWidth - 1)} -2 ` +
        `L ${compact(northWidth + 5)} 2 L ${compact(northWidth - 1)} 7 Z`,
      ),
    ),
  };
}

function longStraightFacings(fit: HeadHairFit): Record<Facing, PartVariant> {
  const southWidth = compact(fit.southHalf + 3);
  const northWidth = compact(fit.northHalf + 3);
  const opening = compact(Math.max(8, fit.southHalf * 0.56));
  const crown = compact(fit.crownY - 2);
  const back = compact(fit.eastBack - 3);
  const front = compact(fit.eastFront + 1);
  const profileOpening = compact(Math.min(7, front - 11));
  return {
    south: hairVariant(
      hairShape(
        `M ${-southWidth} -4 ` +
        `C ${compact(-southWidth * 0.9)} ${compact(crown + 6)} ${compact(-southWidth * 0.45)} ${crown} 0 ${crown} ` +
        `C ${compact(southWidth * 0.48)} ${crown} ${compact(southWidth * 0.92)} ${compact(crown + 6)} ${southWidth} -4 ` +
        `L ${southWidth} 30 L ${compact(opening + 4)} 30 L ${opening} -1 ` +
        `C ${compact(opening * 0.62)} -8 ${compact(-opening * 0.62)} -8 ${-opening} -1 ` +
        `L ${compact(-opening - 4)} 30 L ${-southWidth} 30 Z`,
      ),
    ),
    east: hairVariant(
      hairShape(
        `M ${back} 30 L ${back} -3 ` +
        `C ${compact(back + 2)} ${compact(crown + 7)} ${compact(back * 0.45)} ${crown} -2 ${crown} ` +
        `C ${compact(front - 5)} ${crown} ${front} ${compact(crown + 8)} ${front} -5 ` +
        `L ${profileOpening} 0 ` +
        `C ${compact(profileOpening - 6)} -5 ${compact(profileOpening - 12)} -5 ${compact(back + 8)} 1 ` +
        `L ${compact(back + 9)} 30 Z`,
      ),
      hairShape(
        `M ${compact(front - 13)} -1 ` +
        `C ${compact(front - 10)} 7 ${compact(front - 12)} 19 ${compact(front - 15)} 28 ` +
        `L ${compact(front - 20)} 28 L ${compact(front - 17)} 2 Z`,
      ),
    ),
    north: hairVariant(
      hairShape(
        `M ${-northWidth} -4 ` +
        `C ${compact(-northWidth * 0.9)} ${compact(crown + 6)} ${compact(-northWidth * 0.45)} ${crown} 0 ${crown} ` +
        `C ${compact(northWidth * 0.48)} ${crown} ${compact(northWidth * 0.92)} ${compact(crown + 6)} ${northWidth} -4 ` +
        `L ${northWidth} 31 H ${-northWidth} Z`,
      ),
    ),
  };
}

function coilsFacings(fit: HeadHairFit): Record<Facing, PartVariant> {
  const southWidth = fit.southHalf + 4;
  const northWidth = fit.northHalf + 4;
  const crown = fit.crownY + 3;
  const back = fit.eastBack;
  const front = fit.eastFront;
  const radius = Math.max(6, Math.min(9, compact(fit.southHalf * 0.36)));
  return {
    south: hairVariant(
      hairShape(circle(compact(-southWidth), 0, radius)),
      hairShape(circle(compact(-southWidth * 0.72), compact(crown + 9), radius + 1)),
      hairShape(circle(compact(-southWidth * 0.3), compact(crown + 5), radius)),
      hairShape(circle(compact(southWidth * 0.18), compact(crown + 5), radius)),
      hairShape(circle(compact(southWidth * 0.64), compact(crown + 9), radius + 1)),
      hairShape(circle(compact(southWidth), 0, radius)),
      hairShape(circle(compact(-southWidth), 8, Math.max(6, radius - 1))),
      hairShape(circle(compact(southWidth), 8, Math.max(6, radius - 1))),
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
      hairShape(circle(compact(-northWidth), 0, radius)),
      hairShape(circle(compact(-northWidth * 0.72), compact(crown + 9), radius + 1)),
      hairShape(circle(compact(-northWidth * 0.3), compact(crown + 5), radius)),
      hairShape(circle(compact(northWidth * 0.18), compact(crown + 5), radius)),
      hairShape(circle(compact(northWidth * 0.64), compact(crown + 9), radius + 1)),
      hairShape(circle(compact(northWidth), 0, radius)),
      hairShape(circle(compact(-northWidth), 9, Math.max(6, radius - 1))),
      hairShape(circle(compact(northWidth), 9, Math.max(6, radius - 1))),
    ),
  };
}

type CanonicalFittedHairId = 'hair-short' | 'hair-bob' | 'hair-bun' | 'hair-ponytail';
type CodeFittedHairId = Exclude<FittedHairId, CanonicalFittedHairId>;

const isCanonicalFittedHairId = (hairId: FittedHairId): hairId is CanonicalFittedHairId =>
  hairId === 'hair-short'
  || hairId === 'hair-bob'
  || hairId === 'hair-bun'
  || hairId === 'hair-ponytail';

const CODE_FITTED_HAIR_IDS = FITTED_HAIR_IDS.filter(
  (hairId): hairId is CodeFittedHairId => !isCanonicalFittedHairId(hairId),
);

const BUILDERS: Record<CodeFittedHairId, (fit: HeadHairFit) => Record<Facing, PartVariant>> = {
  'hair-curly': curlyFacings,
  'hair-balding': baldingFacings,
  'hair-side-part': sidePartFacings,
  'hair-pixie': pixieFacings,
  'hair-long-straight': longStraightFacings,
  'hair-coils': coilsFacings,
};

const CODE_FITTED_VARIANTS: Readonly<
  Record<CodeFittedHairId, Readonly<Record<FittedHairHeadId, Readonly<Record<Facing, PartVariant>>>>>
> = Object.fromEntries(
  CODE_FITTED_HAIR_IDS.map((hairId) => [
    hairId,
    Object.fromEntries(
      FITTED_HAIR_HEAD_IDS.map((headId) => [
        headId,
        BUILDERS[hairId](HEAD_HAIR_FITS[headId]),
      ]),
    ),
  ]),
) as Record<CodeFittedHairId, Record<FittedHairHeadId, Record<Facing, PartVariant>>>;

const isFittedHairId = (id: string): id is FittedHairId =>
  (FITTED_HAIR_IDS as readonly string[]).includes(id);

const isFittedHairHeadId = (id: string): id is FittedHairHeadId =>
  (FITTED_HAIR_HEAD_IDS as readonly string[]).includes(id);

export function fittedHairVariant(
  hairId: string,
  headId: string,
  facing: Facing,
): PartVariant | undefined {
  if (!isFittedHairId(hairId) || !isFittedHairHeadId(headId)) return undefined;
  if (isCanonicalFittedHairId(hairId)) {
    const variant = CANONICAL_HEAD_FITTED_BY_ID.get(hairId)?.headVariants[headId]?.[facing];
    if (!variant) {
      throw new Error(`Canonical ${hairId} fit is missing ${headId}/${facing}`);
    }
    return variant;
  }
  return CODE_FITTED_VARIANTS[hairId][headId][facing];
}
