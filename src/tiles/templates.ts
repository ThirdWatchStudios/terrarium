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
const OVERHANG = 16;

/** Axis-aligned arm rects for a neighbor mask, all `fill`-colored. */
function wallArms(mask: number, thickness: number, fill: string): ShapeSpec[] {
  const h = thickness / 2;
  const shapes: ShapeSpec[] = [{ d: rr(C - h, C - h, thickness, thickness, mask === 0 ? 5 : 0), fill }];
  if (mask & WALL_BITS.N) shapes.push({ d: rr(C - h, -OVERHANG, thickness, C + OVERHANG, 0), fill });
  if (mask & WALL_BITS.S) shapes.push({ d: rr(C - h, C, thickness, C + OVERHANG, 0), fill });
  if (mask & WALL_BITS.W) shapes.push({ d: rr(-OVERHANG, C - h, C + OVERHANG, thickness, 0), fill });
  if (mask & WALL_BITS.E) shapes.push({ d: rr(C, C - h, C + OVERHANG, thickness, 0), fill });
  return shapes;
}

/**
 * End-trim caps where a run terminates (cubicle-style): a side gets a cap only
 * when it is unconnected but the opposite side is connected.
 */
function endCaps(mask: number, thickness: number, fill: string): ShapeSpec[] {
  const h = thickness / 2;
  const caps: ShapeSpec[] = [];
  const cap = (x: number, y: number, w: number, hgt: number) => caps.push({ d: rr(x, y, w, hgt, 3), fill });
  if (!(mask & WALL_BITS.E) && mask & WALL_BITS.W) cap(C + h - 2, C - h - 2, 6, thickness + 4);
  if (!(mask & WALL_BITS.W) && mask & WALL_BITS.E) cap(C - h - 4, C - h - 2, 6, thickness + 4);
  if (!(mask & WALL_BITS.N) && mask & WALL_BITS.S) cap(C - h - 2, C - h - 4, thickness + 4, 6);
  if (!(mask & WALL_BITS.S) && mask & WALL_BITS.N) cap(C - h - 2, C + h - 2, thickness + 4, 6);
  return caps;
}

const officeWall: WallTemplate = {
  kind: 'wall',
  id: 'office-wall',
  label: 'Office wall',
  params: [{ key: 'thickness', label: 'Thickness', min: 12, max: 36, step: 2, default: 28 }],
  build(mask, params) {
    const t = params.thickness ?? 28;
    return wallArms(mask, t, '$primary');
  },
};

const glassPartition: WallTemplate = {
  kind: 'wall',
  id: 'glass-partition',
  label: 'Glass partition',
  params: [{ key: 'thickness', label: 'Thickness', min: 8, max: 16, step: 2, default: 10 }],
  build(mask, params) {
    const t = params.thickness ?? 10;
    const h = t / 2;
    const shapes: ShapeSpec[] = wallArms(mask, t, '$secondary').map((s) => ({ ...s, opacity: 0.6 }));
    // mullions: frame ticks along each arm
    const tick = (x: number, y: number, w: number, hgt: number) =>
      shapes.push({ d: rr(x, y, w, hgt, 1), fill: '$primary', silhouette: false });
    for (const off of [22, 64, 106]) {
      if (mask & WALL_BITS.N && off < 64) tick(C - h - 1, off - 2, t + 2, 4);
      if (mask & WALL_BITS.S && off > 64) tick(C - h - 1, off - 2, t + 2, 4);
      if (mask & WALL_BITS.W && off < 64) tick(off - 2, C - h - 1, 4, t + 2);
      if (mask & WALL_BITS.E && off > 64) tick(off - 2, C - h - 1, 4, t + 2);
    }
    // frame post at the junction
    shapes.push({ d: rr(C - h - 1, C - h - 1, t + 2, t + 2, 1.5), fill: '$primary', silhouette: false });
    return shapes;
  },
};

const cubiclePartition: WallTemplate = {
  kind: 'wall',
  id: 'cubicle-partition',
  label: 'Cubicle partition',
  params: [{ key: 'thickness', label: 'Thickness', min: 10, max: 18, step: 2, default: 14 }],
  build(mask, params) {
    const t = params.thickness ?? 14;
    const shapes = wallArms(mask, t, '$primary');
    // fabric inset
    const h = t / 2 - 3;
    if (mask & WALL_BITS.N) shapes.push({ d: rr(C - h, 0, h * 2, C, 0), fill: '#FFFFFF14', silhouette: false });
    if (mask & WALL_BITS.S) shapes.push({ d: rr(C - h, C, h * 2, 64, 0), fill: '#FFFFFF14', silhouette: false });
    if (mask & WALL_BITS.W) shapes.push({ d: rr(0, C - h, C, h * 2, 0), fill: '#FFFFFF14', silhouette: false });
    if (mask & WALL_BITS.E) shapes.push({ d: rr(C, C - h, 64, h * 2, 0), fill: '#FFFFFF14', silhouette: false });
    // end trim + junction post
    shapes.push(...endCaps(mask, t, '$secondary'));
    const bits = [WALL_BITS.N, WALL_BITS.E, WALL_BITS.S, WALL_BITS.W].filter((b) => mask & b).length;
    if (bits >= 3 || mask === 0) {
      shapes.push({ d: rr(C - t / 2 - 2, C - t / 2 - 2, t + 4, t + 4, 4), fill: '$secondary' });
    }
    return shapes;
  },
};

const brickWall: WallTemplate = {
  kind: 'wall',
  id: 'brick-wall',
  label: 'Brick wall',
  params: [{ key: 'thickness', label: 'Thickness', min: 16, max: 32, step: 2, default: 24 }],
  build(mask, params) {
    const t = params.thickness ?? 24;
    const shapes = wallArms(mask, t, '$primary');
    const h = t / 2;
    // mortar: a course line down the centre of each arm + offset header ticks.
    // Lines overdraw past the tile edge and clip to the viewBox, staying seamless.
    if (mask & WALL_BITS.W || mask & WALL_BITS.E) {
      shapes.push({ d: `M ${-OVERHANG} ${C} L ${C + OVERHANG} ${C}`, stroke: '$secondary', strokeWidth: 1, silhouette: false });
    }
    if (mask & WALL_BITS.N || mask & WALL_BITS.S) {
      shapes.push({ d: `M ${C} ${-OVERHANG} L ${C} ${C + OVERHANG}`, stroke: '$secondary', strokeWidth: 1, silhouette: false });
    }
    if (mask & WALL_BITS.W) for (let bx = -OVERHANG + 6; bx < C - h; bx += 12) shapes.push({ d: `M ${bx} ${C - h} L ${bx} ${C + h}`, stroke: '$secondary', strokeWidth: 1, silhouette: false });
    if (mask & WALL_BITS.E) for (let bx = C + h + 6; bx < C + OVERHANG + C; bx += 12) shapes.push({ d: `M ${bx} ${C - h} L ${bx} ${C + h}`, stroke: '$secondary', strokeWidth: 1, silhouette: false });
    if (mask & WALL_BITS.N) for (let by = -OVERHANG + 6; by < C - h; by += 12) shapes.push({ d: `M ${C - h} ${by} L ${C + h} ${by}`, stroke: '$secondary', strokeWidth: 1, silhouette: false });
    if (mask & WALL_BITS.S) for (let by = C + h + 6; by < C + OVERHANG + C; by += 12) shapes.push({ d: `M ${C - h} ${by} L ${C + h} ${by}`, stroke: '$secondary', strokeWidth: 1, silhouette: false });
    return shapes;
  },
};

const panelWall: WallTemplate = {
  kind: 'wall',
  id: 'panel-wall',
  label: 'Panel wall',
  params: [{ key: 'thickness', label: 'Thickness', min: 16, max: 26, step: 2, default: 20 }],
  build(mask, params) {
    const t = params.thickness ?? 20;
    const shapes = wallArms(mask, t, '$primary');
    const h = t / 2 - 3;
    const panel = (x: number, y: number, w: number, hgt: number) => shapes.push({ d: rr(x, y, w, hgt, 1), fill: '$secondary', silhouette: false });
    if (mask & WALL_BITS.N) panel(C - h, 0, h * 2, C);
    if (mask & WALL_BITS.S) panel(C - h, C, h * 2, 64);
    if (mask & WALL_BITS.W) panel(0, C - h, C, h * 2);
    if (mask & WALL_BITS.E) panel(C, C - h, 64, h * 2);
    // accent rail down the centre of each arm
    if (mask & WALL_BITS.N) shapes.push({ d: `M ${C} 0 L ${C} ${C}`, stroke: '$accent', strokeWidth: 1.5, silhouette: false });
    if (mask & WALL_BITS.S) shapes.push({ d: `M ${C} ${C} L ${C} 128`, stroke: '$accent', strokeWidth: 1.5, silhouette: false });
    if (mask & WALL_BITS.W) shapes.push({ d: `M 0 ${C} L ${C} ${C}`, stroke: '$accent', strokeWidth: 1.5, silhouette: false });
    if (mask & WALL_BITS.E) shapes.push({ d: `M ${C} ${C} L 128 ${C}`, stroke: '$accent', strokeWidth: 1.5, silhouette: false });
    shapes.push(...endCaps(mask, t, '$secondary'));
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
  params: [{ key: 'thickness', label: 'Thickness', min: 20, max: 36, step: 2, default: 28 }],
  build(mask, params) {
    const t = params.thickness ?? 28;
    const shapes = wallArms(mask, t, '$primary');
    // structural core: a darker stripe down the centre of each arm (overdraws
    // the edge by OVERHANG and clips to the viewBox, staying seamless).
    const cw = Math.max(3, t * 0.28);
    const ch = cw / 2;
    const core = (x: number, y: number, w: number, hgt: number) =>
      shapes.push({ d: rr(x, y, w, hgt, 0), fill: '$secondary', silhouette: false });
    if (mask & WALL_BITS.N) core(C - ch, -OVERHANG, cw, C + OVERHANG);
    if (mask & WALL_BITS.S) core(C - ch, C, cw, C + OVERHANG);
    if (mask & WALL_BITS.W) core(-OVERHANG, C - ch, C + OVERHANG, cw);
    if (mask & WALL_BITS.E) core(C, C - ch, C + OVERHANG, cw);
    // junction block keeps the core continuous through corners/tees
    shapes.push({ d: rr(C - ch, C - ch, cw, cw, 0), fill: '$secondary', silhouette: false });
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
  params: [{ key: 'thickness', label: 'Thickness', min: 20, max: 36, step: 2, default: 28 }],
  build(mask, params) {
    const t = params.thickness ?? 28;
    const h = t / 2;
    // sky-tinted glass body, semi-opaque so the exterior reads with depth
    const shapes: ShapeSpec[] = wallArms(mask, t, '$accent').map((s) => ({ ...s, opacity: 0.82 }));
    // frame rails: thin dark edges running the length of each glazed arm
    const rail = (d: string) => shapes.push({ d, stroke: '$primary', strokeWidth: 2, silhouette: false });
    if (mask & WALL_BITS.N) rail(`M ${C - h} 0 L ${C - h} ${C} M ${C + h} 0 L ${C + h} ${C}`);
    if (mask & WALL_BITS.S) rail(`M ${C - h} ${C} L ${C - h} 128 M ${C + h} ${C} L ${C + h} 128`);
    if (mask & WALL_BITS.W) rail(`M 0 ${C - h} L ${C} ${C - h} M 0 ${C + h} L ${C} ${C + h}`);
    if (mask & WALL_BITS.E) rail(`M ${C} ${C - h} L 128 ${C - h} M ${C} ${C + h} L 128 ${C + h}`);
    // mullions: vertical posts spaced along the glazing
    const mull = (x: number, y: number, w: number, hgt: number) =>
      shapes.push({ d: rr(x, y, w, hgt, 0.5), fill: '$primary', silhouette: false });
    for (const off of [20, 44, 84, 108]) {
      if (mask & WALL_BITS.N && off < 64) mull(C - h, off - 1.5, t, 3);
      if (mask & WALL_BITS.S && off > 64) mull(C - h, off - 1.5, t, 3);
      if (mask & WALL_BITS.W && off < 64) mull(off - 1.5, C - h, 3, t);
      if (mask & WALL_BITS.E && off > 64) mull(off - 1.5, C - h, 3, t);
    }
    // frame post at the junction
    shapes.push({ d: rr(C - h - 1, C - h - 1, t + 2, t + 2, 1), fill: '$primary', silhouette: false });
    return shapes;
  },
};

export const WALL_TEMPLATES: WallTemplate[] = [
  officeWall,
  glassPartition,
  cubiclePartition,
  brickWall,
  panelWall,
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
];

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
