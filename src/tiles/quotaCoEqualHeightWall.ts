import { QUOTA_CO_EQUAL_HEIGHT_WALL_ART } from './generated/importedQuotaCoEqualHeightWallArt';
import { BLOB_CONFIGS, BLOB_TILE_COUNT, blobIndex } from './blob';
import {
  QUOTA_CO_EQUAL_HEIGHT_MIRROR_X_MASKS,
  QUOTA_CO_EQUAL_HEIGHT_WALL_TEMPLATE_ID,
  type QuotaCoEqualHeightWallFrame,
  type QuotaCoEqualHeightWallRegistry,
} from './quotaCoEqualHeightWallContract';
import type { TileInstance } from '../core/types';

// Reproducible archive bank for legacy proofs and previously exported packs.
// Current wall composition enters through WALL_TEMPLATES instead.
const archivedArt: QuotaCoEqualHeightWallRegistry =
  QUOTA_CO_EQUAL_HEIGHT_WALL_ART;

let validated = false;

function validatedArchivedArt(): QuotaCoEqualHeightWallRegistry {
  if (validated) return archivedArt;
  if (archivedArt.length !== BLOB_TILE_COUNT) {
    throw new Error(
      `QuotaCo archived wall has ${archivedArt.length} frames; ` +
      `expected ${BLOB_TILE_COUNT}`,
    );
  }
  for (let index = 0; index < BLOB_TILE_COUNT; index += 1) {
    const frame: QuotaCoEqualHeightWallFrame | undefined =
      archivedArt[index];
    if (
      !frame ||
      frame.id !== `mask_${index}` ||
      frame.index !== index ||
      frame.canonicalMask !== BLOB_CONFIGS[index] ||
      frame.shapes.length === 0 ||
      typeof frame.flipXForEastPresentation !== 'boolean'
    ) {
      throw new Error(`QuotaCo production wall drift at mask_${index}`);
    }
  }
  const mirrorMasks = archivedArt
    .filter(({ flipXForEastPresentation }) => flipXForEastPresentation)
    .map(({ index }) => index);
  if (
    mirrorMasks.length !== QUOTA_CO_EQUAL_HEIGHT_MIRROR_X_MASKS.length ||
    mirrorMasks.some(
      (mask, index) => mask !== QUOTA_CO_EQUAL_HEIGHT_MIRROR_X_MASKS[index],
    )
  ) {
    throw new Error('QuotaCo production wall contextual-facing mask drift');
  }
  validated = true;
  return archivedArt;
}

export function quotaCoEqualHeightWallFramesFor(
  wall: Pick<TileInstance, 'templateId'>,
): QuotaCoEqualHeightWallRegistry | undefined {
  return wall.templateId === QUOTA_CO_EQUAL_HEIGHT_WALL_TEMPLATE_ID
    ? validatedArchivedArt()
    : undefined;
}

export function quotaCoEqualHeightWallFrameFor(
  wall: Pick<TileInstance, 'templateId'>,
  rawNeighbors: number,
): QuotaCoEqualHeightWallFrame | undefined {
  return quotaCoEqualHeightWallFramesFor(wall)?.[blobIndex(rawNeighbors)];
}
