import type { Facing, PartVariant } from '../core/types';
import { IMPORTED_PART_ART } from './generated/importedPartArt';
import type { ImportedHeadFittedPartOverlay, ImportedPartOverlay } from './importedArt';

/**
 * The ten promoted head-aware hair carriers.
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
  const variant = CANONICAL_HEAD_FITTED_BY_ID.get(hairId)?.headVariants[headId]?.[facing];
  if (!variant) {
    throw new Error(`Canonical ${hairId} fit is missing ${headId}/${facing}`);
  }
  return variant;
}
