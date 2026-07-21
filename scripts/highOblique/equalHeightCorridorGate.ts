import {
  PROMOTED_EAST_WALL_REUSE,
  PROMOTED_NORTHEAST_CORNER,
  PROMOTED_SOUTHEAST_CORNER,
  PROMOTED_SOUTHWEST_CORNER,
  PROMOTED_SOUTH_WALL_REUSE,
  type EqualHeightWallTransform,
} from './equalHeightWallDirection';

export type EqualHeightCorridorCellRole =
  | 'northwest-corner'
  | 'north-wall'
  | 'northeast-corner'
  | 'west-wall'
  | 'east-wall'
  | 'southwest-corner'
  | 'south-wall'
  | 'southeast-corner';

export type EqualHeightCorridorDerivation =
  | 'none'
  | 'accepted-southeast-seam-filter';

export interface EqualHeightCorridorCell {
  readonly col: number;
  readonly row: number;
  readonly role: EqualHeightCorridorCellRole;
  readonly baseFile: string;
  readonly upperFile: string;
  readonly transform: EqualHeightWallTransform;
  readonly derivation: EqualHeightCorridorDerivation;
}

const westWall = (row: number): EqualHeightCorridorCell => ({
  col: 0,
  row,
  role: 'west-wall',
  baseFile: 'full_w_straight-base.svg',
  upperFile: 'full_w_straight-upper.svg',
  transform: 'none',
  derivation: 'none',
});

const eastWall = (row: number): EqualHeightCorridorCell => ({
  col: 2,
  row,
  role: 'east-wall',
  baseFile: PROMOTED_EAST_WALL_REUSE.baseFile,
  upperFile: PROMOTED_EAST_WALL_REUSE.upperFile,
  transform: PROMOTED_EAST_WALL_REUSE.transform,
  derivation: 'none',
});

/**
 * Review-only composition that closes every accepted cardinal socket in the
 * shortest horizontal span and a six-cell vertical run. It deliberately adds
 * no art source, production frame identity, topology state, or registration.
 */
export const EQUAL_HEIGHT_CORRIDOR_GATE = {
  stem: 'equal-height-corridor-gate',
  columns: 3,
  rows: 8,
  clearSpan: {
    col: 1,
    row: 1,
    columns: 1,
    rows: 6,
  },
  reviewCellSizes: [90, 40] as const,
  cells: [
    {
      col: 0,
      row: 0,
      role: 'northwest-corner',
      baseFile: 'full_exterior_corner-base.svg',
      upperFile: 'full_exterior_corner-upper.svg',
      transform: 'none',
      derivation: 'none',
    },
    {
      col: 1,
      row: 0,
      role: 'north-wall',
      baseFile: PROMOTED_SOUTH_WALL_REUSE.baseFile,
      upperFile: PROMOTED_SOUTH_WALL_REUSE.upperFile,
      transform: PROMOTED_SOUTH_WALL_REUSE.transform,
      derivation: 'none',
    },
    {
      col: 2,
      row: 0,
      role: 'northeast-corner',
      baseFile: PROMOTED_NORTHEAST_CORNER.baseFile,
      upperFile: PROMOTED_NORTHEAST_CORNER.upperFile,
      transform: PROMOTED_NORTHEAST_CORNER.transform,
      derivation: 'none',
    },
    ...Array.from({ length: 6 }, (_, index) => westWall(index + 1)),
    ...Array.from({ length: 6 }, (_, index) => eastWall(index + 1)),
    {
      col: 0,
      row: 7,
      role: 'southwest-corner',
      baseFile: PROMOTED_SOUTHWEST_CORNER.baseFile,
      upperFile: PROMOTED_SOUTHWEST_CORNER.upperFile,
      transform: PROMOTED_SOUTHWEST_CORNER.transform,
      derivation: 'none',
    },
    {
      col: 1,
      row: 7,
      role: 'south-wall',
      baseFile: PROMOTED_SOUTH_WALL_REUSE.baseFile,
      upperFile: PROMOTED_SOUTH_WALL_REUSE.upperFile,
      transform: PROMOTED_SOUTH_WALL_REUSE.transform,
      derivation: 'none',
    },
    {
      col: 2,
      row: 7,
      role: 'southeast-corner',
      baseFile: PROMOTED_SOUTHEAST_CORNER.baseFile,
      upperFile: PROMOTED_SOUTHEAST_CORNER.upperFile,
      transform: PROMOTED_SOUTHEAST_CORNER.transform,
      derivation: 'accepted-southeast-seam-filter',
    },
  ] as readonly EqualHeightCorridorCell[],
  status: 'owner-accepted-system-gate',
  productionRegistration: false,
} as const;
