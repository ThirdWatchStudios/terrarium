/**
 * Wall autotile: 8-neighbor "blob" (47-tile) index — the SHARED CONTRACT.
 *
 * This is the spine of the 47-blob wall autotiling (docs, The-Water-Cooler:
 * wall-autotile-47-blob-implementation-plan.md). The tool (here) and the Unity sim
 * MUST agree on which 8-neighbor configuration maps to which tile index 0..46, or
 * every wall tiles wrong. The mapping is generated deterministically below; the
 * committed `blob-index-table.json` golden freezes it, and a parity test in each
 * repo checks its own computation against that golden.
 *
 * Model: 4 edges (N/E/S/W) + 4 corners (NE/SE/SW/NW). A corner only "counts" when
 * BOTH its adjacent edges are set (otherwise there is no corner to round). Zeroing
 * the non-counting corners collapses the 256 raw neighbor-configs to exactly 47.
 */

/** 8-neighbor bit layout. Edges keep the existing WALL_BITS values (N1 E2 S4 W8). */
export const NB = {
  N: 1,
  E: 2,
  S: 4,
  W: 8,
  NE: 16,
  SE: 32,
  SW: 64,
  NW: 128,
} as const;

export const BLOB_TILE_COUNT = 47;

/** Zero out any corner bit whose two adjacent edges aren't both set. Idempotent. */
export function canonicalize(raw: number): number {
  let c = raw & 0x0f; // edges (N/E/S/W) always kept
  if (raw & NB.NE && raw & NB.N && raw & NB.E) c |= NB.NE;
  if (raw & NB.SE && raw & NB.S && raw & NB.E) c |= NB.SE;
  if (raw & NB.SW && raw & NB.S && raw & NB.W) c |= NB.SW;
  if (raw & NB.NW && raw & NB.N && raw & NB.W) c |= NB.NW;
  return c;
}

// Deterministic build: walk raw 0..255, canonicalize, and assign each newly-seen
// canonical form the next index. Because a canonical value c only ever clears bits
// (c ⊆ raw ⇒ c ≤ raw), the raw==c iteration is the first to produce c, so indices
// come out in ascending canonical order — stable and trivially reproducible in C#.
function build(): { table: number[]; configs: number[] } {
  const table = new Array<number>(256);
  const seen = new Map<number, number>();
  const configs: number[] = [];
  for (let raw = 0; raw < 256; raw++) {
    const c = canonicalize(raw);
    let idx = seen.get(c);
    if (idx === undefined) {
      idx = configs.length;
      seen.set(c, idx);
      configs.push(c);
    }
    table[raw] = idx;
  }
  return { table, configs };
}

const BUILT = build();

/** raw neighbor bits (0..255) → tile index (0..46). */
export const BLOB_TABLE: readonly number[] = BUILT.table;
/** tile index (0..46) → its canonical 8-bit config value. */
export const BLOB_CONFIGS: readonly number[] = BUILT.configs;

/** Tile index for an 8-neighbor config (raw bits, non-counting corners ignored). */
export function blobIndex(rawNeighbors: number): number {
  return BLOB_TABLE[rawNeighbors & 0xff];
}

/** Per-corner render state, derived from the canonical config for a tile. */
export type CornerState = 'exposed' | 'solid' | 'concave';

export interface WallTileConfig {
  /** Edge connections. */
  n: boolean;
  e: boolean;
  s: boolean;
  w: boolean;
  /** Corner states: `exposed` (an adjacent edge is open → outside corner / edge),
   *  `solid` (both edges + diagonal are wall → interior, flat), `concave` (both
   *  edges are wall but the diagonal is floor → inside corner, needs a notch). */
  ne: CornerState;
  se: CornerState;
  sw: CornerState;
  nw: CornerState;
}

function corner(c: number, diag: number, e1: number, e2: number): CornerState {
  if (!(c & e1) || !(c & e2)) return 'exposed';
  return c & diag ? 'solid' : 'concave';
}

/** Decode a tile index into edges + corner states (for the renderer / bevel). */
export function configForIndex(index: number): WallTileConfig {
  const c = BLOB_CONFIGS[index];
  return {
    n: !!(c & NB.N),
    e: !!(c & NB.E),
    s: !!(c & NB.S),
    w: !!(c & NB.W),
    ne: corner(c, NB.NE, NB.N, NB.E),
    se: corner(c, NB.SE, NB.S, NB.E),
    sw: corner(c, NB.SW, NB.S, NB.W),
    nw: corner(c, NB.NW, NB.N, NB.W),
  };
}

/** The committed contract artifact (see blob-index-table.json). */
export function blobContract() {
  return {
    version: 1,
    tileCount: BLOB_TILE_COUNT,
    bits: { ...NB },
    note: '8-neighbor wall blob autotile. table[rawNeighbors 0..255] = tileIndex 0..46. '
      + 'A corner bit counts only when both adjacent edges are set. Shared by Terrarium + Unity.',
    table: [...BLOB_TABLE],
    configs: [...BLOB_CONFIGS],
  };
}
