import type { ShapeSpec, TileInstance } from '../core/types';
import { NB } from './blob';
import { mulberry32 } from '../core/random';

/**
 * Ground-edge transition overlays (the lush-outside pass, phase 3). Where two
 * ground kinds meet, the sim draws a TRANSITION OVERLAY on the receiving cell
 * (dirt / asphalt / sidewalk) showing the encroaching natural ground (grass /
 * meadow) bleeding over the seam — a torn organic fringe instead of a hard
 * 128-unit butt joint.
 *
 * These ride the SAME 47-blob autotile contract as walls (tiles/blob.ts +
 * blob-index-table.json): a 47-frame tileset where frame `mask_<i>` is blob
 * index i, and the mask bit for a receiving cell means "the neighbour on that
 * side is encroaching ground". The sim computes the identical index with its
 * WallBlob table and selects frames the same way it does for walls — nothing
 * new to agree on beyond which cells receive (sim-owned selection, tool-owned
 * art; CONTRACT §3.18).
 *
 * Art rules:
 * - Fringe bands are FIXED per edge (same geometry every tile): the scallop is
 *   built from sinusoids whose periods divide 128 plus a wrapped fixed-seed
 *   jitter, so a run of overlay tiles continues seamlessly across cells (the
 *   same trick that keeps floor speckle seamless).
 * - Diagonal bits are deliberately IGNORED by the art: a corner between two
 *   fringed edges is already covered by their overlapping bands, and the
 *   pocket/wrap distinction is invisible at fringe depth. Frames that differ
 *   only in corner bits ship identical art — the contract keeps all 47 so the
 *   sim-side index needs no special cases.
 * - No outline pass (silhouette:false throughout): ground is a floor-family
 *   surface and floors are outline-free flat pattern by convention.
 *
 * Overlays are CODE-OWNED and DERIVED, not authored: the export builds them
 * from the project's ground instances (deriveGroundOverlays), so the fringe
 * always matches the grass palette — including the clinical look, where the
 * natural-ground exemption (D2 amendment) flows through automatically.
 */

const SIZE = 128;
/** Nominal fringe depth into the receiving cell, in design units. */
const DEPTH = 14;
/** Boundary sample step — 8u keeps the scallop organic without path bloat. */
const STEP = 8;

type Pt = [number, number];

/** Map N-edge local coords onto each edge (rotations about the tile centre). */
const EDGE_XFORMS: Record<'n' | 'e' | 's' | 'w', (p: Pt) => Pt> = {
  n: ([x, y]) => [x, y],
  e: ([x, y]) => [SIZE - y, x],
  s: ([x, y]) => [SIZE - x, SIZE - y],
  w: ([x, y]) => [y, SIZE - x],
};

/** Scallop depth at position x along the edge. Periodic in 128 (sines with
 *  dividing periods + a wrapped jitter table) so adjacent tiles continue. */
const JITTER: number[] = (() => {
  const rng = mulberry32(90121);
  const n = SIZE / STEP;
  const j = Array.from({ length: n + 1 }, () => (rng() - 0.5) * 3);
  j[n] = j[0]; // wrap
  return j;
})();

function depthAt(x: number): number {
  const base = DEPTH + 3.5 * Math.sin((x * Math.PI * 2) / 64) + 2 * Math.sin((x * Math.PI * 2) / 32 + 1.3);
  const i = x / STEP;
  const lo = Math.floor(i);
  const hi = Math.min(lo + 1, JITTER.length - 1);
  return base + JITTER[lo] + (JITTER[hi] - JITTER[lo]) * (i - lo);
}

const fmt = (v: number) => Math.round(v * 100) / 100;
const pathFrom = (pts: Pt[], close: boolean) =>
  `M ${pts.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join(' L ')}${close ? ' Z' : ''}`;

/** One edge's fringe band, in final tile coords. */
function fringeBand(edge: 'n' | 'e' | 's' | 'w'): ShapeSpec[] {
  const xf = EDGE_XFORMS[edge];
  const shapes: ShapeSpec[] = [];

  // scallop boundary samples (local N coords: y grows into the receiving cell)
  const boundary: Pt[] = [];
  for (let x = 0; x <= SIZE; x += STEP) boundary.push([x, depthAt(x)]);

  // the grass tongue: edge line out and back along the scallop
  const fill: Pt[] = [[0, 0], [SIZE, 0], ...[...boundary].reverse()];
  shapes.push({ d: pathFrom(fill.map(xf), true), fill: '$primary', silhouette: false });

  // soft under-edge shadow line along the scallop (no outline pass — drawn ink)
  shapes.push({
    d: pathFrom(boundary.map(xf), false),
    stroke: '$secondary',
    strokeWidth: 1.5,
    opacity: 0.45,
    silhouette: false,
  });

  // blades crossing the boundary, pointing into the receiving cell. Fixed seed
  // per edge orientation is the SAME for every tile → wraps across a run.
  const rng = mulberry32(47251);
  for (let i = 0; i < 10; i++) {
    const bx = rng() * SIZE;
    const by = depthAt(bx) - 1;
    const len = 3.5 + rng() * 2.5;
    const lean = (rng() - 0.5) * 3;
    const fillTok = rng() > 0.5 ? '$secondary' : '$accent';
    for (const dx of [0, -SIZE, SIZE]) {
      if (bx + dx < -4 || bx + dx > SIZE + 4) continue;
      const a = xf([bx + dx, by]);
      const b = xf([bx + dx + lean, by + len]);
      shapes.push({
        d: `M ${fmt(a[0])} ${fmt(a[1])} L ${fmt(b[0])} ${fmt(b[1])}`,
        stroke: fillTok,
        strokeWidth: 1.3,
        opacity: 0.7,
        silhouette: false,
      });
    }
  }

  // sparse highlight flecks inside the tongue
  const rng2 = mulberry32(61553);
  for (let i = 0; i < 6; i++) {
    const fx = rng2() * SIZE;
    const fy = 2 + rng2() * (DEPTH - 5);
    const r = 1 + rng2() * 0.8;
    const [cx, cy] = xf([fx, fy]);
    shapes.push({
      d: `M ${fmt(cx)} ${fmt(cy)} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 Z`,
      fill: '$accent',
      opacity: 0.5,
      silhouette: false,
    });
  }

  return shapes;
}

/** One poured-concrete curb band on the paved (receiving) cell. The geometry is
 * fixed and edge-aligned, so adjoining curb tiles meet without visible seams. */
function curbBand(edge: 'n' | 'e' | 's' | 'w'): ShapeSpec[] {
  const xf = EDGE_XFORMS[edge];
  const map = (pts: Pt[]) => pts.map(xf);
  const band = map([[0, 0], [SIZE, 0], [SIZE, 10], [0, 10]]);
  const highlight = map([[0, 2], [SIZE, 2]]);
  const gutter = map([[0, 11.5], [SIZE, 11.5]]);
  const joint = map([[64, 1], [64, 9]]);
  return [
    { d: pathFrom(band, true), fill: '$primary', silhouette: false },
    {
      d: pathFrom(highlight, false),
      stroke: '$accent',
      strokeWidth: 1.4,
      opacity: 0.55,
      silhouette: false,
    },
    {
      d: pathFrom(gutter, false),
      stroke: '$secondary',
      strokeWidth: 2.2,
      opacity: 0.58,
      silhouette: false,
    },
    {
      d: pathFrom(joint, false),
      stroke: '$secondary',
      strokeWidth: 1,
      opacity: 0.35,
      silhouette: false,
    },
  ];
}

/** Build one grass-fringe frame for RAW 8-neighbor bits (tiles/blob.ts NB
 *  layout). A set edge bit = "encroaching ground on that side" → band along
 *  that edge. Corner bits ignored (see the header comment). */
export function buildGrassFringe(neighbors: number): ShapeSpec[] {
  const shapes: ShapeSpec[] = [];
  if (neighbors & NB.N) shapes.push(...fringeBand('n'));
  if (neighbors & NB.E) shapes.push(...fringeBand('e'));
  if (neighbors & NB.S) shapes.push(...fringeBand('s'));
  if (neighbors & NB.W) shapes.push(...fringeBand('w'));
  return shapes;
}

/** Build one curb-edge frame for the shared RAW 8-neighbor blob bits. A set
 * cardinal bit means natural ground borders that side of the paved receiver.
 * Diagonal bits remain art-equivalent, preserving the 47-frame contract. */
export function buildCurbEdge(neighbors: number): ShapeSpec[] {
  const shapes: ShapeSpec[] = [];
  if (neighbors & NB.N) shapes.push(...curbBand('n'));
  if (neighbors & NB.E) shapes.push(...curbBand('e'));
  if (neighbors & NB.S) shapes.push(...curbBand('s'));
  if (neighbors & NB.W) shapes.push(...curbBand('w'));
  return shapes;
}

export const GROUND_OVERLAY_BUILDERS: Record<string, (neighbors: number) => ShapeSpec[]> = {
  'grass-fringe': buildGrassFringe,
  'curb-edge': buildCurbEdge,
};

/**
 * Derive the code-owned overlay instances from a project's ground set. One
 * grass fringe today, tinted by the canonical grass instance's palette so it
 * always matches the field it bleeds from (and inherits the clinical-look
 * exemption for free). Returns [] when the project has no grass — the export
 * simply ships no overlays, and the sim's fringe pass no-ops.
 */
export function deriveGroundOverlays(ground: TileInstance[] | undefined): TileInstance[] {
  const grass = (ground ?? []).find((g) => g.templateId === 'grass');
  const sidewalk = (ground ?? []).find((g) => g.templateId === 'sidewalk');
  const paved = sidewalk ?? (ground ?? []).find((g) => g.templateId === 'asphalt');
  const overlays: TileInstance[] = [];
  if (grass) {
    overlays.push({
      id: 'overlay-grass-fringe',
      name: 'Grass fringe',
      templateId: 'grass-fringe',
      params: {},
      palette: { ...grass.palette },
    });
  }
  if (paved) {
    // Prefer the authored sidewalk concrete palette. An asphalt-only project
    // still receives a clean neutral curb rather than a dark asphalt-colored lip.
    overlays.push({
      id: 'overlay-curb-edge',
      name: 'Curb edge',
      templateId: 'curb-edge',
      params: {},
      palette: sidewalk
        ? { ...sidewalk.palette }
        : { primary: '#C8C6BD', secondary: '#555A5D', accent: '#F1EFE8' },
    });
  }
  return overlays;
}
