import type { FloorTemplate, ShapeSpec, WallTemplate } from '../core/types';
import { WALL_BITS } from '../core/types';
import { rr, circle, ellipse } from '../core/geometry';
import { mulberry32 } from '../core/random';

/**
 * Wall + floor tile templates. Conventions:
 * - Tiles are 128 design units, centered on (64, 64).
 * - Walls: connected arms overdraw the tile edge by OVERHANG so the outline
 *   pass never draws an end-cap stroke at a tile seam — it gets clipped by the
 *   viewBox, and adjacent tiles continue the run.
 * - Floors: every shape is silhouette-free flat pattern, and anything near an
 *   edge is repeated at ±128 so the tile wraps seamlessly.
 */

const C = 64;
const SIZE = 128; // design units per cell (walls are full-cell; see wallBody)
const OVERHANG = 16;

/**
 * The opaque wall BODY for a neighbor mask: a FULL-CELL fill that overhangs the
 * tile edge by OVERHANG on each CONNECTED side and stops flush at the edge on each
 * exposed side. Connected wall cells therefore overlap — their shared outline falls
 * outside the viewBox and clips away, so a wall run reads as one seamless mass —
 * while every exposed side keeps the outline pass as the wall's crisp edge against
 * the open floor. This is the RimWorld / Prison-Architect full-cell wall model that
 * replaced the old thin `thickness`-wide centered band (grid-rescale plan Phase 2).
 * `thickness` is retained in the signature for callers but no longer sizes the body
 * (templates still use it to scale their own surface detail).
 */
function wallBody(mask: number, fill: string): ShapeSpec {
  const x0 = mask & WALL_BITS.W ? -OVERHANG : 0;
  const y0 = mask & WALL_BITS.N ? -OVERHANG : 0;
  const x1 = mask & WALL_BITS.E ? SIZE + OVERHANG : SIZE;
  const y1 = mask & WALL_BITS.S ? SIZE + OVERHANG : SIZE;
  // An isolated pillar gets soft corners; any connected cell fills flush so the mass reads solid.
  const radius = mask === 0 ? 6 : 0;
  return { d: rr(x0, y0, x1 - x0, y1 - y0, radius), fill };
}

/**
 * A top-lit bevel that makes a full-cell wall read as a raised, extruded block
 * (RimWorld-style dimension) instead of a flat slab: a highlight down the lit
 * (top / left) EXPOSED edges and a shadow down the shaded (bottom / right) ones.
 * Literal white/black at low alpha, so it layers over any wall colour and stays
 * fixed under runtime re-tinting (it's a light effect, not a palette surface).
 * Connected edges get nothing, so a wall run still reads as one continuous mass.
 */
function wallBevel(mask: number): ShapeSpec[] {
  // A chamfer along the wall-mass PERIMETER: an angled bevel face on each EXPOSED
  // side (lit top/left, shadowed right/bottom) so the mass reads as one solid
  // extruded block with depth (RimWorld-style). A face runs flush to any CONNECTED
  // side (so a straight run reads continuous) and miters at 45° where two exposed
  // sides meet (a real corner). Connected-only cells (interior of a thick wall) get
  // no bevel — the flat top merges seamlessly. Literal white/black at low alpha, so
  // it layers over any wall colour and survives runtime re-tinting.
  const e = exposedSides(mask);
  const s = SIZE;
  const w = 22; // chamfer face width (of 128) — how "tall"/deep the block reads
  // Inner-edge offsets: pull in (miter) toward a corner only when that adjacent
  // side is ALSO exposed; otherwise run flush to the connected edge.
  const xL = e.w ? w : 0;
  const xR = e.e ? s - w : s;
  const yT = e.n ? w : 0;
  const yB = e.s ? s - w : s;
  const out: ShapeSpec[] = [];
  const face = (d: string, fill: string, opacity: number) => out.push({ d, fill, opacity, silhouette: false });
  if (e.n) face(`M 0 0 L ${s} 0 L ${xR} ${w} L ${xL} ${w} Z`, '#FFFFFF', 0.3); //       top — brightest
  if (e.w) face(`M 0 0 L 0 ${s} L ${w} ${yB} L ${w} ${yT} Z`, '#FFFFFF', 0.14); //      left — light
  if (e.e) face(`M ${s} 0 L ${s} ${s} L ${s - w} ${yB} L ${s - w} ${yT} Z`, '#000000', 0.2); // right — shadow
  if (e.s) face(`M 0 ${s} L ${s} ${s} L ${xR} ${s - w} L ${xL} ${s - w} Z`, '#000000', 0.36); // bottom — deepest
  return out;
}

/** Back-compat base layer for SOLID walls: the full-cell body + the raised-block
 *  bevel. (Translucent walls — glass, curtain — use wallBody directly, no bevel.) */
function wallArms(mask: number, _thickness: number, fill: string): ShapeSpec[] {
  return [wallBody(mask, fill), ...wallBevel(mask)];
}

/** The sides of a cell that face open floor (no wall neighbour) — where a wall
 *  shows a visible face. Full-cell "light detail" goes on the face, not the seam,
 *  so connected sides stay flush and wall runs merge seamlessly. */
function exposedSides(mask: number): { n: boolean; e: boolean; s: boolean; w: boolean } {
  return {
    n: !(mask & WALL_BITS.N),
    e: !(mask & WALL_BITS.E),
    s: !(mask & WALL_BITS.S),
    w: !(mask & WALL_BITS.W),
  };
}

/** A trim line just inside each EXPOSED edge (a border on the wall's visible
 *  faces). Connected edges get nothing, so adjacent cells still merge seam-free. */
function faceEdgeTrim(mask: number, color: string, inset: number, width: number, opacity = 1): ShapeSpec[] {
  const e = exposedSides(mask);
  const out: ShapeSpec[] = [];
  const line = (d: string) => out.push({ d, stroke: color, strokeWidth: width, opacity, silhouette: false });
  if (e.n) line(`M 0 ${inset} L ${SIZE} ${inset}`);
  if (e.s) line(`M 0 ${SIZE - inset} L ${SIZE} ${SIZE - inset}`);
  if (e.w) line(`M ${inset} 0 L ${inset} ${SIZE}`);
  if (e.e) line(`M ${SIZE - inset} 0 L ${SIZE - inset} ${SIZE}`);
  return out;
}

const officeWall: WallTemplate = {
  kind: 'wall',
  id: 'office-wall',
  label: 'Office wall',
  params: [],
  build(mask) {
    // The plain default / building-shell wall: a clean opaque full-cell body.
    return wallArms(mask, 0, '$primary');
  },
};

const glassPartition: WallTemplate = {
  kind: 'wall',
  id: 'glass-partition',
  label: 'Glass partition',
  params: [],
  build(mask) {
    // Translucent full-cell glazing with a thin frame on the exposed faces — reads
    // as a see-through partition. (Full-cell light detail; grid-rescale Phase 2.)
    const shapes: ShapeSpec[] = [{ ...wallBody(mask, '$secondary'), opacity: 0.5 }];
    shapes.push(...faceEdgeTrim(mask, '$primary', 4, 3));
    return shapes;
  },
};

const cubiclePartition: WallTemplate = {
  kind: 'wall',
  id: 'cubicle-partition',
  label: 'Cubicle partition',
  params: [],
  build(mask) {
    // Low fabric partition: full-cell body with a soft fabric-tone inset on the
    // exposed faces (light detail; rich weave deferred).
    const shapes = wallArms(mask, 0, '$primary');
    shapes.push(...faceEdgeTrim(mask, '$secondary', 10, 3, 0.85));
    return shapes;
  },
};

const brickWall: WallTemplate = {
  kind: 'wall',
  id: 'brick-wall',
  label: 'Brick wall',
  params: [],
  build(mask) {
    // Full-cell brick: horizontal mortar courses across the whole face, with a
    // half-brick header offset per course. Lines run edge-to-edge so courses stay
    // continuous across a run. (Light face texture; rich bond pattern deferred.)
    const shapes = wallArms(mask, 0, '$primary');
    const mortar = (d: string) =>
      shapes.push({ d, stroke: '$secondary', strokeWidth: 1.5, opacity: 0.5, silhouette: false });
    let row = 0;
    for (let y = 22; y < SIZE; y += 22, row++) {
      mortar(`M 0 ${y} L ${SIZE} ${y}`);
      // vertical header joints, offset every other course
      for (let x = row % 2 ? 0 : 22; x < SIZE; x += 44) mortar(`M ${x} ${y} L ${x} ${y + 22}`);
    }
    return shapes;
  },
};

const panelWall: WallTemplate = {
  kind: 'wall',
  id: 'panel-wall',
  label: 'Panel wall',
  params: [],
  build(mask) {
    // Full-cell panelling: an inset reveal frame on the exposed faces plus a light
    // accent mid-rail across the face. (Light detail; per-panel joinery deferred.)
    const shapes = wallArms(mask, 0, '$primary');
    shapes.push(...faceEdgeTrim(mask, '$secondary', 12, 2, 0.7));
    shapes.push({ d: `M 0 ${C} L ${SIZE} ${C}`, stroke: '$accent', strokeWidth: 1.5, opacity: 0.6, silhouette: false });
    return shapes;
  },
};

// --- Feature walls (prop-variety-gap-analysis.md §4; warm↔clinical variety) ----

/** A moss / greenery feature wall — the warm end. Backing on $primary, foliage
 *  on $secondary/$accent, so recolouring shifts the whole planted face. */
const livingWall: WallTemplate = {
  kind: 'wall',
  id: 'living-wall',
  label: 'Living wall',
  params: [],
  build(mask) {
    // Full-cell greenery: foliage planted across the whole face on a moss backing.
    const shapes = wallArms(mask, 0, '$primary'); // moss backing
    const pts: Array<[number, number]> = [];
    for (let y = 12; y < SIZE; y += 18) for (let x = 12; x < SIZE; x += 18) pts.push([x, y]);
    // Leaves first, then highlights — one $secondary run + one $accent run. Keeps
    // the re-tint layer atlas exact + cheap (under the per-mask run cap) instead of
    // alternating buckets per leaf, which exploded the sheet.
    for (const [px, py] of pts) shapes.push({ d: circle(px, py, 4.5), fill: '$secondary', silhouette: false });
    for (const [px, py] of pts) shapes.push({ d: circle(px + 1.5, py - 1.5, 2.4), fill: '$accent', silhouette: false });
    return shapes;
  },
};

/** A corporate accent wall — the clinical end. Solid brand face, a crisp accent
 *  stripe down each arm, and a logo placard at the junction. */
const brandedWall: WallTemplate = {
  kind: 'wall',
  id: 'branded-wall',
  label: 'Branded wall',
  params: [],
  build(mask) {
    // Solid brand face with a crisp accent rail along the exposed faces (a
    // waist-height brand stripe). (Light detail; logo placards deferred.)
    const shapes = wallArms(mask, 0, '$primary');
    shapes.push(...faceEdgeTrim(mask, '$accent', 20, 3));
    return shapes;
  },
};

/** A wood acoustic-slat wall — warm-modern. Slat shadow lines run across the band
 *  at a regular pitch along each arm. */
const slatWall: WallTemplate = {
  kind: 'wall',
  id: 'slat-wall',
  label: 'Wood slat wall',
  params: [],
  build(mask) {
    // Full-cell wood slats: evenly pitched vertical shadow lines across the face.
    const shapes = wallArms(mask, 0, '$primary');
    for (let x = 10; x < SIZE; x += 10) {
      shapes.push({ d: `M ${x} 0 L ${x} ${SIZE}`, stroke: '$secondary', strokeWidth: 1.2, opacity: 0.55, silhouette: false });
    }
    return shapes;
  },
};

// ---------------------------------------------------------------------------
// Building-surround walls (the "floor in a tower" border — see
// docs/building-surround-model.md). These read as the building shell, not the
// tenant's partitions. They are art-directed independently via their own tile
// instance palettes (the spec's "$building"/"$sky" token groups are realized as
// dedicated instances, since every tile carries its own primary/secondary/accent).
// ---------------------------------------------------------------------------

/**
 * The structural wall that separates the leased suite from the rest of the
 * floor. Same 28-unit band geometry as `officeWall` — the shell walls must
 * share the tenant band so mid-run junctions align seam-free when the sim
 * mixes them — with a darker structural core seam carrying the "part of the
 * building, not a tenant partition" identity instead of extra thickness.
 */
const demisingWall: WallTemplate = {
  kind: 'wall',
  id: 'demising-wall',
  label: 'Demising wall',
  params: [],
  build(mask) {
    // Shell wall (building structure, not a tenant partition): a full-cell body
    // with a WIDE darker structural spine running the length of each connected
    // direction (and filling the junction), so a demising run reads as heavy core.
    const shapes = wallArms(mask, 0, '$primary');
    const cw = 44;
    const ch = cw / 2;
    const core = (x: number, y: number, w: number, hgt: number) =>
      shapes.push({ d: rr(x, y, w, hgt, 0), fill: '$secondary', silhouette: false });
    if (mask & WALL_BITS.N) core(C - ch, -OVERHANG, cw, C + OVERHANG);
    if (mask & WALL_BITS.S) core(C - ch, C, cw, C + OVERHANG);
    if (mask & WALL_BITS.W) core(-OVERHANG, C - ch, C + OVERHANG, cw);
    if (mask & WALL_BITS.E) core(C, C - ch, C + OVERHANG, cw);
    // junction / isolated: keep the spine continuous through corners + tees
    shapes.push({ d: rr(C - ch, C - ch, cw, cw, mask === 0 ? 4 : 0), fill: '$secondary', silhouette: false });
    return shapes;
  },
};

/**
 * Floor-to-ceiling exterior glazing. The glass is tinted toward the sky color
 * (the instance's `$accent` slot = the spec's `$sky` token); v1 is a flat tint
 * (parallax/day-night skyline is deferred). Bold mullions + a heavy frame post
 * read as building-perimeter curtain wall rather than an interior partition.
 * Same 28-unit band geometry as `officeWall`/`demisingWall` so shell↔tenant
 * junctions align seam-free; the glazing + mullions carry the identity.
 */
const curtainWall: WallTemplate = {
  kind: 'wall',
  id: 'curtain-wall',
  label: 'Curtain wall',
  params: [],
  build(mask) {
    // Exterior curtain wall: full-cell sky-tinted glazing (semi-opaque for depth)
    // with a frame on the exposed faces and mullion posts across the glass.
    const shapes: ShapeSpec[] = [{ ...wallBody(mask, '$accent'), opacity: 0.8 }];
    shapes.push(...faceEdgeTrim(mask, '$primary', 4, 3));
    for (let x = 24; x < SIZE; x += 28) {
      shapes.push({ d: `M ${x} 0 L ${x} ${SIZE}`, stroke: '$primary', strokeWidth: 2, opacity: 0.85, silhouette: false });
    }
    return shapes;
  },
};

export const WALL_TEMPLATES: WallTemplate[] = [
  officeWall,
  glassPartition,
  cubiclePartition,
  brickWall,
  panelWall,
  livingWall,
  brandedWall,
  slatWall,
  demisingWall,
  curtainWall,
];

// ---------------------------------------------------------------------------
// Floors
// ---------------------------------------------------------------------------

const flat = (d: string, fill: string, opacity?: number): ShapeSpec => ({
  d,
  fill,
  opacity,
  silhouette: false,
});

const carpet: FloorTemplate = {
  kind: 'floor',
  id: 'carpet',
  label: 'Carpet',
  params: [
    { key: 'speckle', label: 'Speckle', min: 0, max: 3, step: 1, default: 2 },
    { key: 'seed', label: 'Pattern seed', min: 1, max: 9, step: 1, default: 3 },
  ],
  build(params) {
    const shapes: ShapeSpec[] = [flat(rr(0, 0, 128, 128, 0), '$primary')];
    const rng = mulberry32((params.seed ?? 3) * 7919);
    const count = (params.speckle ?? 2) * 22;
    for (let i = 0; i < count; i++) {
      const x = rng() * 128;
      const y = rng() * 128;
      const r = 1 + rng() * 1.4;
      const fill = rng() > 0.5 ? '$secondary' : '$accent';
      // draw wrapped copies so speckles tile seamlessly across edges
      for (const dx of [0, -128, 128]) {
        for (const dy of [0, -128, 128]) {
          if (x + dx > -4 && x + dx < 132 && y + dy > -4 && y + dy < 132) {
            shapes.push(flat(circle(x + dx, y + dy, r), fill, 0.55));
          }
        }
      }
    }
    return shapes;
  },
};

const carpetTiles: FloorTemplate = {
  kind: 'floor',
  id: 'carpet-tiles',
  label: 'Carpet tiles',
  params: [{ key: 'contrast', label: 'Checker contrast', min: 1, max: 4, step: 1, default: 2 }],
  build(params) {
    const alpha = (params.contrast ?? 2) * 0.06;
    const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
    return [
      flat(rr(0, 0, 128, 128, 0), '$primary'),
      flat(rr(64, 0, 64, 64, 0), `#000000${a}`),
      flat(rr(0, 64, 64, 64, 0), `#000000${a}`),
      // seams
      { d: 'M 64 0 L 64 128 M 0 64 L 128 64', stroke: '#00000014', strokeWidth: 1.5, silhouette: false },
    ];
  },
};

const woodFloor: FloorTemplate = {
  kind: 'floor',
  id: 'wood-floor',
  label: 'Wood floor',
  params: [{ key: 'seed', label: 'Pattern seed', min: 1, max: 9, step: 1, default: 5 }],
  build(params) {
    const shapes: ShapeSpec[] = [flat(rr(0, 0, 128, 128, 0), '$primary')];
    const rng = mulberry32((params.seed ?? 5) * 104729);
    for (let row = 0; row < 8; row++) {
      const y = row * 16;
      // plank line
      shapes.push({ d: `M 0 ${y} L 128 ${y}`, stroke: '#00000018', strokeWidth: 1.5, silhouette: false });
      // one staggered end-seam per row, wrapped
      const sx = Math.floor(rng() * 8) * 16;
      for (const dx of [0, -128, 128]) {
        if (sx + dx >= -2 && sx + dx <= 130) {
          shapes.push({ d: `M ${sx + dx} ${y} L ${sx + dx} ${y + 16}`, stroke: '#00000018', strokeWidth: 1.5, silhouette: false });
        }
      }
      // occasional grain streak
      if (rng() > 0.5) {
        const gx = rng() * 100 + 10;
        shapes.push({ d: `M ${gx} ${y + 5} L ${gx + 14} ${y + 5}`, stroke: '#00000010', strokeWidth: 2, silhouette: false });
      }
    }
    return shapes;
  },
};

const linoleum: FloorTemplate = {
  kind: 'floor',
  id: 'linoleum',
  label: 'Linoleum',
  params: [{ key: 'grid', label: 'Tile size', min: 16, max: 64, step: 16, default: 32 }],
  build(params) {
    const g = params.grid ?? 32;
    const shapes: ShapeSpec[] = [flat(rr(0, 0, 128, 128, 0), '$primary')];
    for (let v = 0; v <= 128; v += g) {
      shapes.push({ d: `M ${v} 0 L ${v} 128`, stroke: '#00000012', strokeWidth: 2, silhouette: false });
      shapes.push({ d: `M 0 ${v} L 128 ${v}`, stroke: '#00000012', strokeWidth: 2, silhouette: false });
    }
    // soft sheen
    shapes.push(flat(rr(0, 0, 128, 14, 0), '#FFFFFF0A'));
    return shapes;
  },
};

const utilityVinyl: FloorTemplate = {
  kind: 'floor',
  id: 'utility-vinyl',
  label: 'Utility vinyl',
  params: [
    { key: 'grid', label: 'Tile size', min: 16, max: 64, step: 16, default: 32 },
    { key: 'scuff', label: 'Scuff', min: 0, max: 3, step: 1, default: 2 },
    { key: 'seed', label: 'Pattern seed', min: 1, max: 9, step: 1, default: 4 },
  ],
  build(params) {
    const g = params.grid ?? 32;
    const shapes: ShapeSpec[] = [flat(rr(0, 0, 128, 128, 0), '$primary')];
    for (let v = 0; v <= 128; v += g) {
      shapes.push({ d: `M ${v} 0 L ${v} 128`, stroke: '#00000010', strokeWidth: 1.5, silhouette: false });
      shapes.push({ d: `M 0 ${v} L 128 ${v}`, stroke: '#00000010', strokeWidth: 1.5, silhouette: false });
    }
    const rng = mulberry32((params.seed ?? 4) * 65537);
    const count = (params.scuff ?? 2) * 10;
    for (let i = 0; i < count; i++) {
      const x = rng() * 128;
      const y = rng() * 128;
      const w = 4 + rng() * 9;
      const fill = rng() > 0.45 ? '$secondary' : '$accent';
      for (const dx of [0, -128, 128]) {
        for (const dy of [0, -128, 128]) {
          if (x + dx > -12 && x + dx < 140 && y + dy > -4 && y + dy < 132) {
            shapes.push(flat(rr(x + dx, y + dy, w, 1.5, 1), fill, 0.34));
          }
        }
      }
    }
    shapes.push(flat(rr(0, 0, 128, 12, 0), '#FFFFFF08'));
    return shapes;
  },
};

const quietCarpet: FloorTemplate = {
  kind: 'floor',
  id: 'quiet-carpet',
  label: 'Quiet room carpet',
  params: [
    { key: 'weave', label: 'Weave', min: 1, max: 4, step: 1, default: 2 },
    { key: 'seed', label: 'Pattern seed', min: 1, max: 9, step: 1, default: 6 },
  ],
  build(params) {
    const shapes: ShapeSpec[] = [flat(rr(0, 0, 128, 128, 0), '$primary')];
    const step = 16;
    const opacity = 0.06 + (params.weave ?? 2) * 0.025;
    for (let v = -128; v <= 256; v += step) {
      shapes.push({ d: `M ${v} 0 L ${v + 128} 128`, stroke: '$secondary', strokeWidth: 1.2, opacity, silhouette: false });
      shapes.push({ d: `M ${v} 128 L ${v + 128} 0`, stroke: '$accent', strokeWidth: 1, opacity: opacity * 0.8, silhouette: false });
    }
    const rng = mulberry32((params.seed ?? 6) * 31337);
    for (let i = 0; i < 12; i++) {
      const x = rng() * 128;
      const y = rng() * 128;
      for (const dx of [0, -128, 128]) {
        for (const dy of [0, -128, 128]) {
          if (x + dx > -4 && x + dx < 132 && y + dy > -4 && y + dy < 132) {
            shapes.push(flat(circle(x + dx, y + dy, 1.1), '$secondary', 0.32));
          }
        }
      }
    }
    return shapes;
  },
};

const terrazzo: FloorTemplate = {
  kind: 'floor',
  id: 'terrazzo',
  label: 'Terrazzo',
  params: [
    { key: 'density', label: 'Aggregate', min: 1, max: 3, step: 1, default: 2 },
    { key: 'seed', label: 'Pattern seed', min: 1, max: 9, step: 1, default: 4 },
  ],
  build(params) {
    const shapes: ShapeSpec[] = [flat(rr(0, 0, 128, 128, 0), '$primary')];
    const rng = mulberry32((params.seed ?? 4) * 49157);
    const count = (params.density ?? 2) * 26;
    const palette = ['$secondary', '$accent'];
    for (let i = 0; i < count; i++) {
      // resolve every per-chip property BEFORE the wrap loops so each wrapped
      // copy is identical — otherwise edge chips wouldn't match across tiles.
      const x = rng() * 128;
      const y = rng() * 128;
      const r = 1.5 + rng() * 2.5;
      const ry = r * (0.6 + rng() * 0.5);
      const fill = palette[rng() > 0.5 ? 0 : 1];
      const op = 0.3 + rng() * 0.3;
      for (const dx of [0, -128, 128]) {
        for (const dy of [0, -128, 128]) {
          if (x + dx > -6 && x + dx < 134 && y + dy > -6 && y + dy < 134) {
            shapes.push(flat(ellipse(x + dx, y + dy, r, ry), fill, op));
          }
        }
      }
    }
    return shapes;
  },
};

const rubberMat: FloorTemplate = {
  kind: 'floor',
  id: 'rubber-mat',
  label: 'Rubber mat',
  params: [{ key: 'studs', label: 'Studs', min: 6, max: 12, step: 1, default: 8 }],
  build(params) {
    const n = params.studs ?? 8;
    const sp = 128 / n; // exact divisor → studs wrap seamlessly across tile edges
    const shapes: ShapeSpec[] = [flat(rr(0, 0, 128, 128, 0), '$primary')];
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const x = (i + 0.5) * sp;
        const y = (j + 0.5) * sp;
        shapes.push(flat(circle(x, y, 2.2), '$secondary', 0.5));
        shapes.push(flat(circle(x, y, 1), '$accent', 0.4));
      }
    }
    shapes.push(flat(rr(0, 0, 128, 10, 0), '#FFFFFF08'));
    return shapes;
  },
};

/**
 * Polished stone floor for the shared elevator lobby / corridor ring of the
 * building surround (see docs/building-surround-model.md). Large square slabs
 * with grout seams and a soft diagonal sheen — reads as a public building
 * lobby, distinct from the tenant's carpet/terrazzo. Seams sit on exact
 * divisors of 128 so slabs wrap seamlessly across tiles.
 */
const lobbyStone: FloorTemplate = {
  kind: 'floor',
  id: 'lobby-stone',
  label: 'Lobby stone',
  params: [
    { key: 'slab', label: 'Slab size', min: 32, max: 64, step: 16, default: 64 },
    { key: 'sheen', label: 'Sheen', min: 0, max: 3, step: 1, default: 2 },
  ],
  build(params) {
    const g = params.slab ?? 64;
    const shapes: ShapeSpec[] = [flat(rr(0, 0, 128, 128, 0), '$primary')];
    // checker the slabs faintly so the grid reads as stone, not a single sheet
    for (let y = 0; y < 128; y += g) {
      for (let x = 0; x < 128; x += g) {
        if (((x / g) + (y / g)) % 2 === 1) shapes.push(flat(rr(x, y, g, g, 0), '$secondary', 0.5));
      }
    }
    // grout seams (wrap because they sit on divisors of 128)
    for (let v = 0; v <= 128; v += g) {
      shapes.push({ d: `M ${v} 0 L ${v} 128`, stroke: '#0000001C', strokeWidth: 1.5, silhouette: false });
      shapes.push({ d: `M 0 ${v} L 128 ${v}`, stroke: '#0000001C', strokeWidth: 1.5, silhouette: false });
    }
    // diagonal polish streaks, wrapped across both edges
    const n = params.sheen ?? 2;
    for (let i = 0; i < n; i++) {
      const off = -128 + i * 48;
      for (const d of [0, 128]) {
        shapes.push({ d: `M ${off + d} 128 L ${off + 128 + d} 0`, stroke: '#FFFFFF14', strokeWidth: 6, silhouette: false });
      }
    }
    return shapes;
  },
};

// ---------------------------------------------------------------------------
// Outdoor ground (B1.5 "the build site" — the bare parking lot the office is
// raised onto). Authored with the same flat, seamless tile machinery as the
// interior floors (they ARE FloorTemplates, so composeFloorTile renders them),
// but they SHIP as a DISTINCT ground KIND (own export dir + sort band −20000 +
// clinical-drain treatment — decision D2). Deliberately NO sheen bands or
// non-tiling accents: ground spans the whole outdoor map, so any per-tile band
// would print a visible 128-unit grid. Pure seamless speckle/joints only.
// ---------------------------------------------------------------------------

const grass: FloorTemplate = {
  kind: 'floor',
  id: 'grass',
  label: 'Grass',
  params: [
    { key: 'blades', label: 'Blade density', min: 1, max: 3, step: 1, default: 2 },
    { key: 'seed', label: 'Pattern seed', min: 1, max: 9, step: 1, default: 5 },
  ],
  build(params) {
    const shapes: ShapeSpec[] = [flat(rr(0, 0, 128, 128, 0), '$primary')];
    const rng = mulberry32((params.seed ?? 5) * 22307);
    const count = (params.blades ?? 2) * 42;
    for (let i = 0; i < count; i++) {
      // resolve per-blade props before the wrap loops so edge blades match across tiles
      const x = rng() * 128;
      const y = rng() * 128;
      const h = 3 + rng() * 4;
      const lean = (rng() - 0.5) * 3;
      const fill = rng() > 0.5 ? '$secondary' : '$accent';
      for (const dx of [0, -128, 128]) {
        for (const dy of [0, -128, 128]) {
          if (x + dx > -4 && x + dx < 132 && y + dy > -6 && y + dy < 132) {
            shapes.push({ d: `M ${x + dx} ${y + dy} L ${x + dx + lean} ${y + dy - h}`, stroke: fill, strokeWidth: 1.3, opacity: 0.5, silhouette: false });
          }
        }
      }
    }
    return shapes;
  },
};

const dirt: FloorTemplate = {
  kind: 'floor',
  id: 'dirt',
  label: 'Dirt',
  params: [
    { key: 'clods', label: 'Clods', min: 1, max: 3, step: 1, default: 2 },
    { key: 'seed', label: 'Pattern seed', min: 1, max: 9, step: 1, default: 3 },
  ],
  build(params) {
    const shapes: ShapeSpec[] = [flat(rr(0, 0, 128, 128, 0), '$primary')];
    const rng = mulberry32((params.seed ?? 3) * 40009);
    const count = (params.clods ?? 2) * 30;
    for (let i = 0; i < count; i++) {
      const x = rng() * 128;
      const y = rng() * 128;
      const r = 1 + rng() * 3;
      const ry = r * (0.6 + rng() * 0.4);
      const fill = rng() > 0.5 ? '$secondary' : '$accent';
      const op = 0.22 + rng() * 0.3;
      for (const dx of [0, -128, 128]) {
        for (const dy of [0, -128, 128]) {
          if (x + dx > -6 && x + dx < 134 && y + dy > -6 && y + dy < 134) {
            shapes.push(flat(ellipse(x + dx, y + dy, r, ry), fill, op));
          }
        }
      }
    }
    return shapes;
  },
};

const asphalt: FloorTemplate = {
  kind: 'floor',
  id: 'asphalt',
  label: 'Asphalt',
  params: [
    { key: 'aggregate', label: 'Aggregate', min: 1, max: 3, step: 1, default: 2 },
    { key: 'seed', label: 'Pattern seed', min: 1, max: 9, step: 1, default: 7 },
  ],
  build(params) {
    const shapes: ShapeSpec[] = [flat(rr(0, 0, 128, 128, 0), '$primary')];
    const rng = mulberry32((params.seed ?? 7) * 69061);
    const count = (params.aggregate ?? 2) * 44;
    for (let i = 0; i < count; i++) {
      const x = rng() * 128;
      const y = rng() * 128;
      const r = 0.7 + rng() * 1.4;
      const fill = rng() > 0.5 ? '$secondary' : '$accent';
      const op = 0.2 + rng() * 0.28;
      for (const dx of [0, -128, 128]) {
        for (const dy of [0, -128, 128]) {
          if (x + dx > -4 && x + dx < 132 && y + dy > -4 && y + dy < 132) {
            shapes.push(flat(circle(x + dx, y + dy, r), fill, op));
          }
        }
      }
    }
    return shapes;
  },
};

const sidewalk: FloorTemplate = {
  kind: 'floor',
  id: 'sidewalk',
  label: 'Sidewalk',
  params: [{ key: 'slab', label: 'Slab size', min: 32, max: 64, step: 16, default: 64 }],
  build(params) {
    const g = params.slab ?? 64;
    const shapes: ShapeSpec[] = [flat(rr(0, 0, 128, 128, 0), '$primary')];
    // faint concrete fleck (fixed seed → deterministic)
    const rng = mulberry32(51413);
    for (let i = 0; i < 40; i++) {
      const x = rng() * 128;
      const y = rng() * 128;
      for (const dx of [0, -128, 128]) {
        for (const dy of [0, -128, 128]) {
          if (x + dx > -2 && x + dx < 130 && y + dy > -2 && y + dy < 130) {
            shapes.push(flat(circle(x + dx, y + dy, 0.8), '$secondary', 0.3));
          }
        }
      }
    }
    // expansion joints on exact divisors of 128 → seams wrap seamlessly
    for (let v = 0; v <= 128; v += g) {
      shapes.push({ d: `M ${v} 0 L ${v} 128`, stroke: '#0000001F', strokeWidth: 1.5, silhouette: false });
      shapes.push({ d: `M 0 ${v} L 128 ${v}`, stroke: '#0000001F', strokeWidth: 1.5, silhouette: false });
    }
    return shapes;
  },
};

// --- Added floors (prop-variety-gap-analysis.md §4) ----------------------------

/** Smooth industrial concrete — the clinical/institutional surface. Faint
 *  mottling + saw-cut control joints on 128-divisors (seamless) + a soft sheen. */
const polishedConcrete: FloorTemplate = {
  kind: 'floor',
  id: 'polished-concrete',
  label: 'Polished concrete',
  params: [
    { key: 'joints', label: 'Control joints', min: 0, max: 2, step: 1, default: 1 },
    { key: 'seed', label: 'Pattern seed', min: 1, max: 9, step: 1, default: 3 },
  ],
  build(params) {
    const shapes: ShapeSpec[] = [flat(rr(0, 0, 128, 128, 0), '$primary')];
    const rng = mulberry32((params.seed ?? 3) * 21937);
    for (let i = 0; i < 28; i++) {
      const x = rng() * 128;
      const y = rng() * 128;
      const r = 6 + rng() * 14;
      const fill = rng() > 0.5 ? '$secondary' : '$accent';
      for (const dx of [0, -128, 128]) {
        for (const dy of [0, -128, 128]) {
          if (x + dx > -20 && x + dx < 148 && y + dy > -20 && y + dy < 148) shapes.push(flat(circle(x + dx, y + dy, r), fill, 0.06));
        }
      }
    }
    const joints = params.joints ?? 1;
    if (joints >= 1)
      for (const v of [64]) {
        shapes.push({ d: `M ${v} 0 L ${v} 128`, stroke: '#00000018', strokeWidth: 1.2, silhouette: false });
        shapes.push({ d: `M 0 ${v} L 128 ${v}`, stroke: '#00000018', strokeWidth: 1.2, silhouette: false });
      }
    if (joints >= 2)
      for (const v of [32, 96]) {
        shapes.push({ d: `M ${v} 0 L ${v} 128`, stroke: '#00000010', strokeWidth: 1, silhouette: false });
        shapes.push({ d: `M 0 ${v} L 128 ${v}`, stroke: '#00000010', strokeWidth: 1, silhouette: false });
      }
    shapes.push(flat(rr(0, 0, 128, 12, 0), '#FFFFFF0A'));
    return shapes;
  },
};

/** A bold decorative tile for defining a zone (lounge / breakout). Checker of
 *  $primary/$secondary with an $accent diamond motif; grout on divisors (seamless). */
const accentTile: FloorTemplate = {
  kind: 'floor',
  id: 'accent-tile',
  label: 'Accent tile',
  params: [
    { key: 'grid', label: 'Tile size', min: 32, max: 64, step: 16, default: 32 },
    { key: 'motif', label: 'Motif', min: 0, max: 2, step: 1, default: 1 },
  ],
  build(params) {
    const g = params.grid ?? 32;
    const motif = params.motif ?? 1;
    const shapes: ShapeSpec[] = [flat(rr(0, 0, 128, 128, 0), '$primary')];
    for (let y = 0; y < 128; y += g) {
      for (let x = 0; x < 128; x += g) {
        if ((x / g + y / g) % 2 === 1) shapes.push(flat(rr(x, y, g, g, 0), '$secondary', 0.8));
        if (motif >= 1) {
          const cx = x + g / 2;
          const cy = y + g / 2;
          const d = g * 0.22;
          shapes.push(flat(`M ${cx} ${cy - d} L ${cx + d} ${cy} L ${cx} ${cy + d} L ${cx - d} ${cy} Z`, '$accent', 0.85));
        }
      }
    }
    for (let v = 0; v <= 128; v += g) {
      shapes.push({ d: `M ${v} 0 L ${v} 128`, stroke: '#00000018', strokeWidth: 1, silhouette: false });
      shapes.push({ d: `M 0 ${v} L 128 ${v}`, stroke: '#00000018', strokeWidth: 1, silhouette: false });
    }
    return shapes;
  },
};

/** Astroturf for the game room — the fun/warm end. Mowing stripes on divisors +
 *  a wrapped grass-fleck texture. */
const astroturf: FloorTemplate = {
  kind: 'floor',
  id: 'astroturf',
  label: 'Astroturf',
  params: [{ key: 'seed', label: 'Pattern seed', min: 1, max: 9, step: 1, default: 5 }],
  build(params) {
    const shapes: ShapeSpec[] = [flat(rr(0, 0, 128, 128, 0), '$primary')];
    // mowing stripes (32-wide, wrap on divisors)
    for (let i = 1; i < 4; i += 2) shapes.push(flat(rr(i * 32, 0, 32, 128, 0), '$secondary', 0.32));
    // grass flecks
    const rng = mulberry32((params.seed ?? 5) * 71317);
    for (let i = 0; i < 90; i++) {
      const x = rng() * 128;
      const y = rng() * 128;
      const len = 2 + rng() * 2;
      const fill = rng() > 0.5 ? '$secondary' : '$accent';
      for (const dx of [0, -128, 128]) {
        for (const dy of [0, -128, 128]) {
          if (x + dx > -4 && x + dx < 132 && y + dy > -4 && y + dy < 132) shapes.push({ d: `M ${x + dx} ${y + dy} L ${x + dx} ${y + dy - len}`, stroke: fill, strokeWidth: 1, opacity: 0.5, silhouette: false });
        }
      }
    }
    return shapes;
  },
};

export const FLOOR_TEMPLATES: FloorTemplate[] = [
  carpet,
  carpetTiles,
  woodFloor,
  linoleum,
  utilityVinyl,
  quietCarpet,
  terrazzo,
  rubberMat,
  lobbyStone,
  polishedConcrete,
  accentTile,
  astroturf,
  // Outdoor ground surfaces (B1.5 — shipped as the distinct ground kind).
  grass,
  dirt,
  asphalt,
  sidewalk,
];

/** Ground-surface template ids — the outdoor floors that ship as the distinct
 *  ground kind (B1.5 / D2), NOT interior floor. The sim imports these as a
 *  separate layer (own sort band −20000). Kept here so the tool has one source
 *  of truth for which FloorTemplates are ground. */
export const GROUND_TEMPLATE_IDS = ['grass', 'dirt', 'asphalt', 'sidewalk'] as const;

/** Human-readable name for a wall mask, used in atlas JSON. */
export function maskName(mask: number): string {
  if (mask === 0) return 'isolated';
  const dirs = [
    mask & WALL_BITS.N ? 'N' : '',
    mask & WALL_BITS.E ? 'E' : '',
    mask & WALL_BITS.S ? 'S' : '',
    mask & WALL_BITS.W ? 'W' : '',
  ].join('');
  const bits = dirs.length;
  if (bits === 1) return `end-${dirs}`;
  if (mask === 5) return 'straight-NS';
  if (mask === 10) return 'straight-EW';
  if (bits === 2) return `corner-${dirs}`;
  if (bits === 3) return `tee-${dirs}`;
  return 'cross';
}
