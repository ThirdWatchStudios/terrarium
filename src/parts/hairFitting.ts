import { circle } from '../core/geometry';
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

type CanonicalFittedHairId =
  | 'hair-short'
  | 'hair-bob'
  | 'hair-bun'
  | 'hair-ponytail'
  | 'hair-long-straight'
  | 'hair-balding'
  | 'hair-pixie'
  | 'hair-side-part';
type CodeFittedHairId = Exclude<FittedHairId, CanonicalFittedHairId>;

const isCanonicalFittedHairId = (hairId: FittedHairId): hairId is CanonicalFittedHairId =>
  hairId === 'hair-short'
  || hairId === 'hair-bob'
  || hairId === 'hair-bun'
  || hairId === 'hair-ponytail'
  || hairId === 'hair-long-straight'
  || hairId === 'hair-balding'
  || hairId === 'hair-pixie'
  || hairId === 'hair-side-part';

const CODE_FITTED_HAIR_IDS = FITTED_HAIR_IDS.filter(
  (hairId): hairId is CodeFittedHairId => !isCanonicalFittedHairId(hairId),
);

const BUILDERS: Record<CodeFittedHairId, (fit: HeadHairFit) => Record<Facing, PartVariant>> = {
  'hair-curly': curlyFacings,
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
