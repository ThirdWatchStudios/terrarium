/**
 * Owner-reviewed equal-height structural-wall direction.
 *
 * These entries describe source reuse for the isolated wall-art workbench. They
 * do not register production templates, add exporter metadata, or replace the
 * 47-blob connectivity contract.
 */

export type EqualHeightWallTransform = 'none' | 'mirror-x';

export const PROMOTED_SOUTH_WALL_REUSE = {
  role: 'south',
  sourceStem: 'full_n_straight',
  baseFile: 'full_n_straight-base.svg',
  upperFile: 'full_n_straight-upper.svg',
  transform: 'none' as EqualHeightWallTransform,
  outerProfile: { start: 56, end: 120 },
  pivot: { x: 0.5, y: 0.5 },
  status: 'owner-accepted-working-contract',
  productionRegistration: false,
} as const;

export const FULL_HEIGHT_EAST_MIRROR_PROPOSAL = {
  role: 'east',
  sourceStem: 'full_w_straight',
  baseFile: 'full_w_straight-base.svg',
  upperFile: 'full_w_straight-upper.svg',
  transform: 'mirror-x' as EqualHeightWallTransform,
  mirrorAxis: 64,
  outerProfile: { start: 8, end: 72 },
  pivot: { x: 0.5, y: 0.5 },
  status: 'proposal',
  productionRegistration: false,
} as const;

export const FULL_HEIGHT_NORTHEAST_MIRROR_PROPOSAL = {
  role: 'northeast-corner',
  sourceStem: 'full_exterior_corner',
  baseFile: 'full_exterior_corner-base.svg',
  upperFile: 'full_exterior_corner-upper.svg',
  transform: 'mirror-x' as EqualHeightWallTransform,
  mirrorAxis: 64,
  pivot: { x: 0.5, y: 0.5 },
  status: 'proposal',
  productionRegistration: false,
} as const;

/**
 * Owner-accepted southwest source pair. It adapts the earlier W-to-S scaffold
 * into an equal-height molded turn without changing the established stem id.
 * Production template and topology registration remain a separate decision.
 */
export const PROMOTED_SOUTHWEST_CORNER = {
  role: 'southwest-corner',
  sourceStem: 'transition_w_to_s',
  baseFile: 'transition_w_to_s-base.svg',
  upperFile: 'transition_w_to_s-upper.svg',
  transform: 'none' as EqualHeightWallTransform,
  pivot: { x: 0.5, y: 0.5 },
  status: 'owner-accepted-working-contract',
  productionRegistration: false,
} as const;
