import type { ShapeSpec } from '../core/types';

/** Stable authored vocabulary. Order follows the wall neighbor-bit convention. */
export const WALL_BEVEL_PIECE_IDS = [
  'edge-n',
  'edge-e',
  'edge-s',
  'edge-w',
  'convex-ne',
  'convex-se',
  'convex-sw',
  'convex-nw',
  'concave-ne',
  'concave-se',
  'concave-sw',
  'concave-nw',
] as const;

export type WallBevelPieceId = (typeof WALL_BEVEL_PIECE_IDS)[number];

export type WallBevelRegistry = Readonly<
  Record<WallBevelPieceId, readonly ShapeSpec[]>
>;
