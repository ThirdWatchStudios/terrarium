import { QUOTA_CO_EQUAL_HEIGHT_WALL_ART } from './generated/importedQuotaCoEqualHeightWallArt';
import { BLOB_CONFIGS, BLOB_TILE_COUNT, blobIndex } from './blob';
import {
  QUOTA_CO_EQUAL_HEIGHT_MIRROR_X_MASKS,
  QUOTA_CO_EQUAL_HEIGHT_WALL_TEMPLATE_ID,
  type QuotaCoEqualHeightWallFrame,
  type QuotaCoEqualHeightWallRegistry,
} from './quotaCoEqualHeightWallContract';
import type { TileInstance } from '../core/types';

const productionArt: QuotaCoEqualHeightWallRegistry =
  QUOTA_CO_EQUAL_HEIGHT_WALL_ART;

let validated = false;

function validatedProductionArt(): QuotaCoEqualHeightWallRegistry {
  if (validated) return productionArt;
  if (productionArt.length !== BLOB_TILE_COUNT) {
    throw new Error(
      `QuotaCo production wall has ${productionArt.length} frames; ` +
      `expected ${BLOB_TILE_COUNT}`,
    );
  }
  for (let index = 0; index < BLOB_TILE_COUNT; index += 1) {
    const frame: QuotaCoEqualHeightWallFrame | undefined =
      productionArt[index];
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
  const mirrorMasks = productionArt
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
  return productionArt;
}

export function quotaCoEqualHeightWallFramesFor(
  wall: Pick<TileInstance, 'templateId'>,
): QuotaCoEqualHeightWallRegistry | undefined {
  return wall.templateId === QUOTA_CO_EQUAL_HEIGHT_WALL_TEMPLATE_ID
    ? validatedProductionArt()
    : undefined;
}

export function quotaCoEqualHeightWallFrameFor(
  wall: Pick<TileInstance, 'templateId'>,
  rawNeighbors: number,
): QuotaCoEqualHeightWallFrame | undefined {
  return quotaCoEqualHeightWallFramesFor(wall)?.[blobIndex(rawNeighbors)];
}
