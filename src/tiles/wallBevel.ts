import type { ShapeSpec } from '../core/types';
import { blobIndex, configForIndex, type CornerState } from './blob';
import { WALL_BEVEL_ART } from './generated/importedWallBevelArt';
import {
  WALL_BEVEL_PIECE_IDS,
  type WallBevelPieceId,
} from './wallBevelContract';

type Edge = 'n' | 'e' | 's' | 'w';
type Corner = 'ne' | 'se' | 'sw' | 'nw';

const CORNERS: readonly {
  corner: Corner;
  first: Edge;
  second: Edge;
  convex: WallBevelPieceId;
  concave: WallBevelPieceId;
  capPaths: Readonly<Partial<Record<Edge, string>>>;
}[] = [
  {
    corner: 'ne', first: 'n', second: 'e', convex: 'convex-ne', concave: 'concave-ne',
    capPaths: { n: 'M90 8H128V16H90Z', e: 'M90 0H120V16H90Z' },
  },
  {
    corner: 'se', first: 's', second: 'e', convex: 'convex-se', concave: 'concave-se',
    capPaths: { s: 'M90 76H128V120H90Z', e: 'M90 76H120V128H90Z' },
  },
  {
    corner: 'sw', first: 's', second: 'w', convex: 'convex-sw', concave: 'concave-sw',
    capPaths: { s: 'M0 76H38V120H0Z', w: 'M8 76H38V128H8Z' },
  },
  {
    corner: 'nw', first: 'n', second: 'w', convex: 'convex-nw', concave: 'concave-nw',
    capPaths: { n: 'M0 8H38V16H0Z', w: 'M8 0H38V16H8Z' },
  },
] as const;

function topology(neighbors: number): {
  exposed: Readonly<Record<Edge, boolean>>;
  corners: Readonly<Record<Corner, CornerState>>;
} {
  const cfg = configForIndex(blobIndex(neighbors));
  return {
    exposed: { n: !cfg.n, e: !cfg.e, s: !cfg.s, w: !cfg.w },
    corners: { ne: cfg.ne, se: cfg.se, sw: cfg.sw, nw: cfg.nw },
  };
}

/** Pure authored-piece truth table; procedural one-sided socket caps are excluded. */
export function bevelPieceIdsForNeighbors(neighbors: number): readonly WallBevelPieceId[] {
  const { exposed, corners } = topology(neighbors);
  const selected = new Set<WallBevelPieceId>();
  for (const edge of ['n', 'e', 's', 'w'] as const) {
    if (exposed[edge]) selected.add(`edge-${edge}`);
  }
  for (const spec of CORNERS) {
    if (exposed[spec.first] && exposed[spec.second]) selected.add(spec.convex);
    else if (!exposed[spec.first] && !exposed[spec.second] && corners[spec.corner] === 'concave') {
      selected.add(spec.concave);
    }
  }
  return WALL_BEVEL_PIECE_IDS.filter((id) => selected.has(id));
}

function cloneShapes(id: WallBevelPieceId): ShapeSpec[] {
  return WALL_BEVEL_ART[id].map((shape) => ({ ...shape }));
}

function facePaint(edge: Edge): Omit<ShapeSpec, 'd'> {
  const edgeShapes = WALL_BEVEL_ART[`edge-${edge}`] as readonly ShapeSpec[];
  const face = edgeShapes.find((shape) => shape.fill !== undefined);
  if (!face) throw new Error(`Wall bevel ${edge} edge has no authored face paint`);
  const { d: _d, ...paint } = face;
  return { ...paint };
}

function southCreasePaint(): Omit<ShapeSpec, 'd'> | undefined {
  const southShapes = WALL_BEVEL_ART['edge-s'] as readonly ShapeSpec[];
  const crease = southShapes.find((shape) => shape.stroke !== undefined);
  if (!crease) return undefined;
  const { d: _d, ...paint } = crease;
  return { ...paint };
}

/**
 * Assemble the 12 authored pieces for one raw 8-neighbor mask.
 *
 * Center strips and corner pieces never overlap. When exactly one side of a
 * corner is exposed, a plain procedural cap connects that authored face to the
 * material boundary; the cap owns topology only and inherits the source paint.
 */
export function authoredWallBevel(neighbors: number): ShapeSpec[] {
  const { exposed } = topology(neighbors);
  const shapes = bevelPieceIdsForNeighbors(neighbors).flatMap(cloneShapes);

  for (const spec of CORNERS) {
    const firstExposed = exposed[spec.first];
    const secondExposed = exposed[spec.second];
    if (firstExposed !== secondExposed) {
      const edge = firstExposed ? spec.first : spec.second;
      const capPath = spec.capPaths[edge];
      if (!capPath) throw new Error(`Wall bevel ${spec.corner} cap has no ${edge} face path`);
      shapes.push({ d: capPath, ...facePaint(edge) });
    }

    // The front-face crease runs through a one-sided cap. Convex corners end
    // the crease at the socket; concave south corners carry their own crease.
    if (spec.corner === 'sw' && exposed.s && !exposed.w) {
      const paint = southCreasePaint();
      if (paint) shapes.push({ d: 'M0 76H38', ...paint });
    }
    if (spec.corner === 'se' && exposed.s && !exposed.e) {
      const paint = southCreasePaint();
      if (paint) shapes.push({ d: 'M90 76H128', ...paint });
    }
  }
  return shapes;
}
