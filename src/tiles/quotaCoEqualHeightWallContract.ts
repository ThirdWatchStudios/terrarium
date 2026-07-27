import type { ShapeSpec } from '../core/types';

export const QUOTA_CO_EQUAL_HEIGHT_WALL_TEMPLATE_ID = 'office-wall' as const;
export const QUOTA_CO_EQUAL_HEIGHT_AUTHORED_FACING = 'west' as const;
export const QUOTA_CO_EQUAL_HEIGHT_MIRROR_X_MASKS = [1, 4, 5] as const;

export interface QuotaCoEqualHeightWallFrame {
  readonly id: `mask_${number}`;
  readonly index: number;
  readonly canonicalMask: number;
  readonly shapes: readonly ShapeSpec[];
  readonly flipXForEastPresentation: boolean;
}

export type QuotaCoEqualHeightWallRegistry =
  readonly QuotaCoEqualHeightWallFrame[];
