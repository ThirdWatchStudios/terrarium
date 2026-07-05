import type { PropTemplate, ShapeSpec } from '../core/types';
import { rr, circle, ellipse } from '../core/geometry';

/**
 * Parametric prop templates. Conventions:
 * - Canvas coords (128 design units), props rest on the ground line y = 116.
 * - Fills use '$primary' / '$secondary' / '$accent' tokens from the prop's palette.
 * - The global outline pass applies automatically, same as characters.
 */

const GROUND = 116;
const CX = 64;
const SIZE = 128;

const waterCooler: PropTemplate = {
  id: 'water-cooler',
  label: 'Water cooler',
  gridFootprint: { w: 1, h: 1 },
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 21, ry: 4 },
  params: [{ key: 'height', label: 'Body height', min: 44, max: 68, step: 2, default: 56 }],
  build(params) {
    const bodyH = params.height;
    const bodyTop = GROUND - bodyH;
    const shapes: ShapeSpec[] = [
      // bottle
      { d: rr(CX - 16, bodyTop - 34, 32, 30, 9), fill: '$primary' },
      { d: rr(CX - 6, bodyTop - 7, 12, 8, 2), fill: '$primary' },
      // cabinet
      { d: rr(CX - 20, bodyTop, 40, bodyH, 5), fill: '$secondary' },
      // taps
      { d: rr(CX - 13, bodyTop + 12, 7, 9, 2), fill: '$accent', silhouette: false },
      { d: rr(CX + 6, bodyTop + 12, 7, 9, 2), fill: '#D85A30', silhouette: false },
      // drip tray
      { d: rr(CX - 11, bodyTop + 26, 22, 4, 2), fill: '#00000026', silhouette: false },
      // bottle waterline glint
      { d: rr(CX - 9, bodyTop - 27, 5, 14, 2.5), fill: '#FFFFFF40', silhouette: false },
    ];
    return shapes;
  },
};

const printer: PropTemplate = {
  id: 'printer',
  label: 'Printer',
  gridFootprint: { w: 1, h: 1 },
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 26, ry: 4 },
  params: [{ key: 'width', label: 'Width', min: 44, max: 72, step: 2, default: 56 }],
  build(params) {
    const w = params.width;
    const x = CX - w / 2;
    const bodyTop = GROUND - 34;
    return [
      // paper sticking out of the feed
      { d: rr(CX - w * 0.27, bodyTop - 12, w * 0.54, 14, 1), fill: '#F7F4EC' },
      // body
      { d: rr(x, bodyTop, w, 34, 5), fill: '$secondary' },
      // output slot
      { d: rr(x + 6, bodyTop + 9, w - 12, 4, 2), fill: '#00000040', silhouette: false },
      // control button
      { d: circle(x + w - 10, bodyTop + 24, 3), fill: '$accent', silhouette: false },
      // jam-prone paper tray
      { d: rr(x + 5, GROUND - 7, w - 24, 5, 2), fill: '$primary', silhouette: false },
    ];
  },
};

const desk: PropTemplate = {
  id: 'desk',
  label: 'Desk',
  projection: 'plan',
  // desk + chair approach reads as two cells across
  gridFootprint: { w: 2, h: 1 },
  params: [
    { key: 'width', label: 'Width', min: 72, max: 120, step: 4, default: 100 },
    { key: 'monitor', label: 'Monitor', min: 0, max: 1, step: 1, default: 1 },
  ],
  build(params) {
    const w = params.width ?? 100;
    const x = CX - w / 2;
    const top = 34;
    const depth = 60;
    const shapes: ShapeSpec[] = [
      // desktop seen from above
      { d: rr(x, top, w, depth, 6), fill: '$primary' },
      // soft grain band
      { d: `M ${x + 10} ${top + depth / 2} L ${x + w - 10} ${top + depth / 2}`, stroke: '#00000010', strokeWidth: 10, silhouette: false },
    ];
    if ((params.monitor ?? 1) >= 1) {
      shapes.push(
        // monitor from above: slim bar near the far edge + stand foot
        { d: rr(CX - 22, top + 8, 44, 9, 2), fill: '#2C2C2A', silhouette: false },
        { d: rr(CX - 4, top + 17, 8, 4, 1.5), fill: '#2C2C2A', silhouette: false },
        // keyboard + mouse
        { d: rr(CX - 18, top + 28, 36, 13, 2), fill: '$secondary', silhouette: false },
        { d: ellipse(CX + 26, top + 34, 3.5, 5), fill: '$secondary', silhouette: false },
      );
    }
    // coffee mug, seen from above
    shapes.push(
      { d: circle(x + w - 13, top + 14, 5), fill: '$accent', silhouette: false },
      { d: circle(x + w - 13, top + 14, 2), fill: '#6E4A2A', silhouette: false },
    );
    return shapes;
  },
};

const coffeeMachine: PropTemplate = {
  id: 'coffee-machine',
  label: 'Coffee machine',
  gridFootprint: { w: 1, h: 1 },
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 18, ry: 3.5 },
  params: [{ key: 'height', label: 'Height', min: 40, max: 56, step: 2, default: 48 }],
  build(params) {
    const h = params.height;
    const top = GROUND - h;
    return [
      // back column
      { d: rr(CX - 17, top, 34, h, 4), fill: '$primary' },
      // brew head overhang
      { d: rr(CX - 21, top, 42, 12, 4), fill: '$primary' },
      // carafe
      { d: rr(CX - 11, GROUND - 20, 22, 17, 5), fill: '#B5D4F4', opacity: 0.92 },
      { d: rr(CX - 11, GROUND - 20, 22, 5, 2), fill: '$secondary', silhouette: false },
      // coffee level
      { d: rr(CX - 9, GROUND - 11, 18, 6, 2), fill: '#6E4A2A', silhouette: false },
      // status lights
      { d: circle(CX - 11, top + 6, 2.2), fill: '$accent', silhouette: false },
      { d: circle(CX - 4, top + 6, 2.2), fill: '#97C459', silhouette: false },
    ];
  },
};

// --- Tampered / broken variants -------------------------------------------
// Damaged twins of the interaction props above, used by the sim's tamper system:
// when the player jams/breaks/empties a prop, the runtime swaps the live sprite
// to the matching broken template (printer→printer-jammed, coffee-machine→
// coffee-machine-broken, water-cooler→water-cooler-empty). They keep the base
// footprint, params, and palette so the swap lands in place and reads as the
// same object — just visibly broken. Not auto-placed by the office generator;
// they exist only to be baked and swapped in.

const printerJammed: PropTemplate = {
  id: 'printer-jammed',
  label: 'Printer (jammed)',
  gridFootprint: { w: 1, h: 1 },
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 26, ry: 4 },
  params: [{ key: 'width', label: 'Width', min: 44, max: 72, step: 2, default: 56 }],
  build(params) {
    const w = params.width;
    const x = CX - w / 2;
    const bodyTop = GROUND - 34;
    return [
      // crumpled sheet jammed in the feed — half-ejected and torn
      {
        d:
          `M ${CX - w * 0.24} ${bodyTop - 3} L ${CX - w * 0.12} ${bodyTop - 15} ` +
          `L ${CX - w * 0.02} ${bodyTop - 6} L ${CX + w * 0.1} ${bodyTop - 17} ` +
          `L ${CX + w * 0.2} ${bodyTop - 4} L ${CX + w * 0.24} ${bodyTop + 1} Z`,
        fill: '#EDE7D6',
      },
      // crease shadows on the crumpled sheet
      { d: `M ${CX - w * 0.12} ${bodyTop - 13} L ${CX - w * 0.02} ${bodyTop - 6}`, stroke: '#00000026', strokeWidth: 1.5, silhouette: false },
      { d: `M ${CX + w * 0.1} ${bodyTop - 15} L ${CX + w * 0.02} ${bodyTop - 5}`, stroke: '#00000026', strokeWidth: 1.5, silhouette: false },
      // body
      { d: rr(x, bodyTop, w, 34, 5), fill: '$secondary' },
      // output slot, choked with paper
      { d: rr(x + 6, bodyTop + 9, w - 12, 4, 2), fill: '#00000040', silhouette: false },
      { d: rr(x + 8, bodyTop + 8, w - 22, 3, 1), fill: '#EDE7D6', silhouette: false },
      // red error light (the status accent gone wrong) with a soft halo
      { d: circle(x + w - 10, bodyTop + 24, 5), fill: '#D8362F33', silhouette: false },
      { d: circle(x + w - 10, bodyTop + 24, 3), fill: '#D8362F', silhouette: false },
      // jam-prone paper tray
      { d: rr(x + 5, GROUND - 7, w - 24, 5, 2), fill: '$primary', silhouette: false },
    ];
  },
};

const coffeeMachineBroken: PropTemplate = {
  id: 'coffee-machine-broken',
  label: 'Coffee machine (broken)',
  gridFootprint: { w: 1, h: 1 },
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 18, ry: 3.5 },
  params: [{ key: 'height', label: 'Height', min: 40, max: 56, step: 2, default: 48 }],
  build(params) {
    const h = params.height;
    const top = GROUND - h;
    return [
      // leak pooling on the floor
      { d: ellipse(CX + 2, GROUND + 1, 16, 3.5), fill: '#6E4A2A66', silhouette: false },
      // back column
      { d: rr(CX - 17, top, 34, h, 4), fill: '$primary' },
      // brew head overhang
      { d: rr(CX - 21, top, 42, 12, 4), fill: '$primary' },
      // empty carafe — no coffee, glass clouded
      { d: rr(CX - 11, GROUND - 20, 22, 17, 5), fill: '#C9D6E0', opacity: 0.55 },
      { d: rr(CX - 11, GROUND - 20, 22, 5, 2), fill: '$secondary', silhouette: false },
      // crack zig-zagging across the carafe
      { d: `M ${CX - 7} ${GROUND - 18} L ${CX - 2} ${GROUND - 12} L ${CX + 3} ${GROUND - 14} L ${CX + 6} ${GROUND - 6}`, stroke: '#2C2C2A', strokeWidth: 1, silhouette: false },
      // dead status lights — both red
      { d: circle(CX - 11, top + 6, 2.2), fill: '#D8362F', silhouette: false },
      { d: circle(CX - 4, top + 6, 2.2), fill: '#D8362F', silhouette: false },
    ];
  },
};

const waterCoolerEmpty: PropTemplate = {
  id: 'water-cooler-empty',
  label: 'Water cooler (empty)',
  gridFootprint: { w: 1, h: 1 },
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 21, ry: 4 },
  params: [{ key: 'height', label: 'Body height', min: 44, max: 68, step: 2, default: 56 }],
  build(params) {
    const bodyH = params.height;
    const bodyTop = GROUND - bodyH;
    return [
      // bottle drained — pale, clear, no waterline glint
      { d: rr(CX - 16, bodyTop - 34, 32, 30, 9), fill: '#E8EEF2', opacity: 0.5 },
      { d: rr(CX - 6, bodyTop - 7, 12, 8, 2), fill: '#E8EEF2', opacity: 0.5 },
      // cabinet
      { d: rr(CX - 20, bodyTop, 40, bodyH, 5), fill: '$secondary' },
      // taps (dry)
      { d: rr(CX - 13, bodyTop + 12, 7, 9, 2), fill: '$accent', silhouette: false },
      { d: rr(CX + 6, bodyTop + 12, 7, 9, 2), fill: '#D85A30', silhouette: false },
      // drip tray
      { d: rr(CX - 11, bodyTop + 26, 22, 4, 2), fill: '#00000026', silhouette: false },
      // OUT OF SERVICE tag taped to the cabinet
      { d: rr(CX - 13, bodyTop + 33, 26, 10, 2), fill: '#D8362F', silhouette: false },
      { d: rr(CX - 9, bodyTop + 37, 18, 2, 1), fill: '#FFFFFFCC', silhouette: false },
    ];
  },
};

const officePlant: PropTemplate = {
  id: 'office-plant',
  label: 'Office plant',
  gridFootprint: { w: 1, h: 1 },
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 15, ry: 3.5 },
  params: [{ key: 'bushiness', label: 'Bushiness', min: 1, max: 3, step: 1, default: 2 }],
  build(params) {
    const shapes: ShapeSpec[] = [
      { d: `M 50 ${GROUND} L 54 ${GROUND - 20} L 74 ${GROUND - 20} L 78 ${GROUND} Z`, fill: '$accent' },
      { d: rr(51, GROUND - 25, 26, 7, 2), fill: '$accent' },
    ];
    const leaves: Array<[number, number, number]> = [
      [55, 74, 11],
      [73, 74, 11],
      [64, 62, 13],
    ];
    if (params.bushiness >= 2) leaves.push([48, 66, 9], [80, 66, 9]);
    if (params.bushiness >= 3) leaves.push([56, 52, 9], [72, 52, 9], [64, 46, 8]);
    for (const [cx, cy, r] of leaves) shapes.push({ d: circle(cx, cy, r), fill: '$primary' });
    // a couple of darker leaves for depth
    shapes.push(
      { d: circle(60, 72, 7), fill: '$secondary', silhouette: false },
      { d: circle(70, 64, 6), fill: '$secondary', silhouette: false },
    );
    return shapes;
  },
};

// --- Greenery (warm-personality set; prop-variety-gap-analysis.md P0) ----------
// The office had exactly one plant. These add floor, wall, and desktop scale so a
// space can read as lived-in and green. Foliage on $primary/$secondary and the pot
// on $accent so they swatch cleanly per placement.

const pottedTree: PropTemplate = {
  id: 'potted-tree',
  label: 'Potted tree',
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 17, ry: 4 },
  gridFootprint: { w: 1, h: 1 },
  params: [
    { key: 'height', label: 'Height', min: 74, max: 100, step: 2, default: 90 },
    { key: 'fullness', label: 'Fullness', min: 1, max: 3, step: 1, default: 2 },
  ],
  build(params) {
    const h = params.height ?? 90;
    const canopyR = 22;
    const canopyCy = GROUND - h + canopyR;
    const potTop = GROUND - 22;
    const trunkTop = canopyCy + 8;
    const shapes: ShapeSpec[] = [
      // tapered planter
      { d: `M ${CX - 15} ${potTop} L ${CX + 15} ${potTop} L ${CX + 12} ${GROUND} L ${CX - 12} ${GROUND} Z`, fill: '$accent' },
      { d: rr(CX - 16, potTop - 4, 32, 6, 2), fill: '$accent' },
      // soil
      { d: ellipse(CX, potTop - 1, 13, 3), fill: '#3B2F26', silhouette: false },
      // woody trunk (literal detail — not a swatch token)
      { d: rr(CX - 3, trunkTop, 6, potTop - trunkTop + 2, 2), fill: '#6E4A2A' },
    ];
    // canopy clusters
    const clusters: Array<[number, number, number]> = [
      [CX, canopyCy, canopyR],
      [CX - 14, canopyCy + 11, 15],
      [CX + 14, canopyCy + 11, 15],
      [CX, canopyCy + 21, 16],
    ];
    if ((params.fullness ?? 2) >= 2) clusters.push([CX - 11, canopyCy - 8, 12], [CX + 12, canopyCy - 6, 11]);
    if ((params.fullness ?? 2) >= 3) clusters.push([CX - 21, canopyCy + 3, 10], [CX + 21, canopyCy + 3, 10]);
    for (const [cx, cy, r] of clusters) shapes.push({ d: circle(cx, cy, r), fill: '$primary' });
    // depth shading
    shapes.push(
      { d: circle(CX + 9, canopyCy + 15, 10), fill: '$secondary', silhouette: false },
      { d: circle(CX - 12, canopyCy + 6, 8), fill: '$secondary', silhouette: false },
    );
    return shapes;
  },
};

const hangingPlant: PropTemplate = {
  id: 'hanging-plant',
  label: 'Hanging plant',
  projection: 'plan',
  placement: 'wall-slot',
  gridFootprint: { w: 1, h: 1 },
  params: [
    { key: 'trail', label: 'Vine length', min: 14, max: 34, step: 2, default: 24 },
    { key: 'fullness', label: 'Fullness', min: 1, max: 3, step: 1, default: 2 },
  ],
  build(params) {
    const trail = params.trail ?? 24;
    const topY = 46;
    const potY = topY + 10;
    const halfW = 11;
    const shapes: ShapeSpec[] = [
      // ceiling hook + hanging cords to the pot rim
      { d: rr(CX - 1.5, topY - 6, 3, 5, 1), fill: '#5F5E5A', silhouette: false },
      { d: `M ${CX - halfW + 2} ${potY} L ${CX} ${topY - 1} L ${CX + halfW - 2} ${potY}`, stroke: '#00000033', strokeWidth: 1, silhouette: false },
      // planter
      { d: `M ${CX - halfW} ${potY} L ${CX + halfW} ${potY} L ${CX + halfW - 3} ${potY + 11} L ${CX - halfW + 3} ${potY + 11} Z`, fill: '$accent' },
      { d: rr(CX - halfW, potY - 2, halfW * 2, 4, 1.5), fill: '$accent' },
    ];
    // Foliage mound spilling over the rim (the plant body), THEN thin trailing
    // vines with little paired leaves — reads as ivy/pothos, not a drip.
    const rimY = potY + 2;
    for (const [dx, r] of [[-8, 5], [-2, 6], [4, 6], [9, 5], [0, 5]] as Array<[number, number]>) {
      shapes.push({ d: circle(CX + dx, rimY, r), fill: '$primary' });
    }
    shapes.push(
      { d: circle(CX - 4, rimY + 1, 4), fill: '$secondary', silhouette: false },
      { d: circle(CX + 6, rimY + 1, 3.5), fill: '$secondary', silhouette: false },
    );
    const vineTop = rimY + 4;
    const vines: Array<[number, number]> = [[-8, 0.95], [-3, 1.15], [3, 1.0], [8, 0.85]];
    const nv = Math.min(vines.length, (params.fullness ?? 2) + 1);
    for (let i = 0; i < nv; i++) {
      const [dx, k] = vines[i];
      const vx = CX + dx;
      const len = trail * k;
      const sway = dx < 0 ? -1 : 1;
      shapes.push({ d: `M ${vx} ${vineTop} q ${sway * 5} ${len * 0.4} ${sway * 2} ${len * 0.7} t ${-sway * 3} ${len * 0.3}`, stroke: '$primary', strokeWidth: 1.6, silhouette: false });
      const leaves = 3;
      for (let j = 1; j <= leaves; j++) {
        const t = j / (leaves + 1);
        const lx = vx + sway * 4 * Math.sin(t * Math.PI);
        const ly = vineTop + len * t;
        shapes.push({ d: ellipse(lx + (j % 2 ? 2 : -2), ly, 2, 3.2), fill: j % 2 ? '$secondary' : '$primary', silhouette: false });
      }
    }
    return shapes;
  },
};

const deskSucculent: PropTemplate = {
  id: 'desk-succulent',
  label: 'Desk succulent',
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 9, ry: 2.5 },
  gridFootprint: { w: 1, h: 1 },
  params: [{ key: 'size', label: 'Size', min: 10, max: 18, step: 2, default: 14 }],
  build(params) {
    const s = params.size ?? 14;
    const potTop = GROUND - s * 0.85;
    const shapes: ShapeSpec[] = [
      // terracotta pot
      { d: `M ${CX - s * 0.55} ${potTop} L ${CX + s * 0.55} ${potTop} L ${CX + s * 0.46} ${GROUND} L ${CX - s * 0.46} ${GROUND} Z`, fill: '$accent' },
      { d: rr(CX - s * 0.6, potTop - 3, s * 1.2, 5, 1.5), fill: '$accent' },
      { d: ellipse(CX, potTop - 1, s * 0.48, 2), fill: '#3B2F26', silhouette: false },
    ];
    // Upright echeveria rosette: pointed leaves radiating from the crown, fanning
    // up-and-out (never past ~55° off vertical, so it never crescents sideways).
    const cy = potTop - 1;
    const up = -Math.PI / 2;
    const leaf = (deg: number, L: number, W: number, fill: string, sil = true) => {
      const a = up + (deg * Math.PI) / 180;
      const tx = CX + Math.cos(a) * L;
      const ty = cy + Math.sin(a) * L;
      const mx = CX + Math.cos(a) * L * 0.5;
      const my = cy + Math.sin(a) * L * 0.5;
      const px = Math.cos(a + Math.PI / 2) * W;
      const py = Math.sin(a + Math.PI / 2) * W;
      shapes.push({ d: `M ${CX} ${cy} Q ${mx + px} ${my + py} ${tx} ${ty} Q ${mx - px} ${my - py} ${CX} ${cy} Z`, fill, silhouette: sil });
    };
    // outer ring (darker, wider fan) then a tighter, lighter, more upright inner ring
    for (const d of [-54, -27, 0, 27, 54]) leaf(d, s * 0.95, s * 0.17, '$secondary');
    for (const d of [-30, 0, 30]) leaf(d, s * 0.62, s * 0.15, '$primary', false);
    shapes.push({ d: circle(CX, cy - 1, 1.6), fill: '$primary', silhouette: false });
    return shapes;
  },
};

// --- Warm lighting + shelving (warm-personality set; P0) -----------------------
// Warm lamps are the strongest "lived-in office" signal. Shade/foliage on the
// palette tokens; the warm bulb-glow stays a fixed literal so a lamp always reads
// as "on" regardless of swatch.

const floorLamp: PropTemplate = {
  id: 'floor-lamp',
  label: 'Floor lamp',
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 12, ry: 3.5 },
  gridFootprint: { w: 1, h: 1 },
  params: [{ key: 'height', label: 'Height', min: 78, max: 104, step: 2, default: 92 }],
  build(params) {
    const h = params.height ?? 92;
    const top = GROUND - h;
    const shadeBot = top + 24;
    return [
      // base + pole
      { d: ellipse(CX, GROUND - 3, 13, 4), fill: '$secondary' },
      { d: rr(CX - 3, GROUND - 6, 6, 4, 1), fill: '$secondary', silhouette: false },
      { d: rr(CX - 2, shadeBot, 4, GROUND - shadeBot - 4, 2), fill: '$secondary' },
      // warm light pooling below the shade
      { d: ellipse(CX, shadeBot + 3, 16, 5), fill: '#FFE7A0', opacity: 0.4, silhouette: false },
      // empire shade (wider at the bottom)
      { d: `M ${CX - 18} ${shadeBot} L ${CX + 18} ${shadeBot} L ${CX + 13} ${top} L ${CX - 13} ${top} Z`, fill: '$primary' },
      // warm glow at the shade mouth + accent trims
      { d: rr(CX - 16, shadeBot - 3, 32, 4, 2), fill: '#FFE7A0', opacity: 0.6, silhouette: false },
      { d: `M ${CX - 13} ${top + 1} L ${CX + 13} ${top + 1}`, stroke: '$accent', strokeWidth: 1.5, silhouette: false },
      { d: `M ${CX - 18} ${shadeBot - 1} L ${CX + 18} ${shadeBot - 1}`, stroke: '$accent', strokeWidth: 1.5, silhouette: false },
    ];
  },
};

const deskLamp: PropTemplate = {
  id: 'desk-lamp',
  label: 'Desk lamp',
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 9, ry: 3 },
  gridFootprint: { w: 1, h: 1 },
  params: [{ key: 'size', label: 'Size', min: 26, max: 40, step: 2, default: 32 }],
  build(params) {
    const s = params.size ?? 32;
    const shadeBot = GROUND - s;
    return [
      // weighted base + stem (banker's-lamp silhouette)
      { d: rr(CX - 8, GROUND - 5, 16, 5, 2), fill: '$secondary' },
      { d: ellipse(CX, GROUND - 5, 9, 2.5), fill: '$secondary', silhouette: false },
      { d: rr(CX - 1.5, shadeBot, 3, GROUND - shadeBot - 4, 1), fill: '$secondary' },
      // warm glow under the dome
      { d: ellipse(CX, shadeBot + 1, 11, 3), fill: '#FFE7A0', opacity: 0.55, silhouette: false },
      // dome shade + accent band + finial
      { d: `M ${CX - 13} ${shadeBot} L ${CX + 13} ${shadeBot} L ${CX + 11} ${shadeBot - 6} Q ${CX} ${shadeBot - 12} ${CX - 11} ${shadeBot - 6} Z`, fill: '$primary' },
      { d: `M ${CX - 11} ${shadeBot - 1} L ${CX + 11} ${shadeBot - 1}`, stroke: '$accent', strokeWidth: 1.5, silhouette: false },
      { d: circle(CX, shadeBot - 12, 1.6), fill: '$accent', silhouette: false },
    ];
  },
};

const bookshelf: PropTemplate = {
  id: 'bookshelf',
  label: 'Bookshelf',
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 24, ry: 4.5 },
  gridFootprint: { w: 1, h: 1 },
  params: [
    { key: 'shelves', label: 'Shelves', min: 3, max: 5, step: 1, default: 4 },
    { key: 'fill', label: 'Stocked', min: 1, max: 3, step: 1, default: 3 },
  ],
  build(params) {
    const shelves = params.shelves ?? 4;
    const shelfH = 22;
    const w = 44;
    const h = shelves * shelfH + 6;
    const top = GROUND - h;
    const x = CX - w / 2;
    const stock = params.fill ?? 3;
    const shapes: ShapeSpec[] = [
      // carcass + recessed back
      { d: rr(x, top, w, h, 3), fill: '$primary' },
      { d: rr(x + 3, top + 3, w - 6, h - 6, 2), fill: '#00000022', silhouette: false },
    ];
    const bookColors = ['$accent', '$secondary', '#B8543E', '#3D6B8E', '#C9A24B', '#6E8B5A'];
    for (let s = 0; s < shelves; s++) {
      const shelfBottom = top + 3 + (s + 1) * shelfH - 2;
      shapes.push({ d: rr(x + 3, shelfBottom, w - 6, 3, 1), fill: '$primary', silhouette: false });
      let bx = x + 6;
      let k = s * 3 + 1;
      while (bx < x + w - 9) {
        const bw = 3 + ((k * 7) % 4);
        const bh = 12 + ((k * 5) % 6);
        const by = shelfBottom - bh;
        if (stock >= 2 || k % 3 !== 0) {
          if (k % 5 === 0) {
            // a leaning book
            shapes.push({ d: `M ${bx} ${shelfBottom} L ${bx + bh * 0.25} ${by + 1} L ${bx + bh * 0.25 + bw} ${by + 3} L ${bx + bw} ${shelfBottom} Z`, fill: bookColors[k % bookColors.length], silhouette: false });
          } else {
            shapes.push({ d: rr(bx, by, bw, bh, 0.5), fill: bookColors[k % bookColors.length], silhouette: false });
          }
        }
        bx += bw + 1.5;
        k++;
      }
    }
    // personality on top: a couple of flat-stacked books + a small plant (literal green)
    shapes.push(
      { d: rr(x + 6, top - 5, 15, 5, 1), fill: '$accent', silhouette: false },
      { d: rr(x + 8, top - 8, 11, 4, 1), fill: '$secondary', silhouette: false },
      { d: rr(CX + 11, top - 7, 8, 7, 1), fill: '#8A5A3C', silhouette: false },
      { d: circle(CX + 15, top - 10, 4), fill: '#5C8A3A', silhouette: false },
      { d: circle(CX + 12, top - 8, 3), fill: '#4A7030', silhouette: false },
    );
    return shapes;
  },
};

// --- Wall decor (warm-personality set; P0). Wall-slot, authored for the wall
// band. Frame/paper/rim on the palette tokens; ink + mat stay literal. ------------

const framedArt: PropTemplate = {
  id: 'framed-art',
  label: 'Framed art',
  projection: 'plan',
  placement: 'wall-slot',
  gridFootprint: { w: 1, h: 1 },
  params: [
    { key: 'width', label: 'Width', min: 28, max: 46, step: 2, default: 36 },
    { key: 'scene', label: 'Scene', min: 0, max: 2, step: 1, default: 1 },
  ],
  build(params) {
    const w = params.width ?? 36;
    const h = Math.round(w * 0.74);
    const x = CX - w / 2;
    const y = 64 - h / 2;
    const scene = params.scene ?? 1;
    const shapes: ShapeSpec[] = [
      // frame + mat
      { d: rr(x - 3, y - 3, w + 6, h + 6, 2), fill: '$primary' },
      { d: rr(x, y, w, h, 1), fill: '#F2EDE0', silhouette: false },
    ];
    const ax = x + 3, ay = y + 3, aw = w - 6, ah = h - 6;
    // simple framed landscape: sky wash, a hill, a sun
    shapes.push({ d: rr(ax, ay, aw, ah, 1), fill: '$secondary', silhouette: false });
    if (scene !== 2) shapes.push({ d: circle(ax + aw * 0.72, ay + ah * 0.32, aw * 0.11), fill: '$accent', silhouette: false });
    shapes.push({ d: `M ${ax} ${ay + ah} L ${ax} ${ay + ah * 0.6} Q ${ax + aw * 0.4} ${ay + ah * 0.4} ${ax + aw * 0.7} ${ay + ah * 0.62} T ${ax + aw} ${ay + ah * 0.58} L ${ax + aw} ${ay + ah} Z`, fill: '#2F5D3A', silhouette: false });
    if (scene >= 1) shapes.push({ d: `M ${ax} ${ay + ah * 0.78} Q ${ax + aw * 0.5} ${ay + ah * 0.62} ${ax + aw} ${ay + ah * 0.8} L ${ax + aw} ${ay + ah} L ${ax} ${ay + ah} Z`, fill: '#244A2E', silhouette: false });
    return shapes;
  },
};

const poster: PropTemplate = {
  id: 'poster',
  label: 'Poster',
  projection: 'plan',
  placement: 'wall-slot',
  gridFootprint: { w: 1, h: 1 },
  params: [{ key: 'lines', label: 'Caption lines', min: 1, max: 3, step: 1, default: 2 }],
  build(params) {
    const w = 30;
    const h = 40;
    const x = CX - w / 2;
    const y = 64 - h / 2;
    const shapes: ShapeSpec[] = [
      // paper + thin border
      { d: rr(x, y, w, h, 1), fill: '$primary' },
      { d: rr(x + 1.5, y + 1.5, w - 3, h - 3, 1), stroke: '$secondary', strokeWidth: 1, silhouette: false },
      // hero graphic — a summit (the eternal motivational-poster mountain)
      { d: `M ${x + 5} ${y + h * 0.56} L ${x + w * 0.42} ${y + h * 0.22} L ${x + w - 5} ${y + h * 0.56} Z`, fill: '$accent', silhouette: false },
      { d: `M ${x + w * 0.42} ${y + h * 0.22} L ${x + w * 0.52} ${y + h * 0.36} L ${x + w * 0.34} ${y + h * 0.36} Z`, fill: '#F2EDE0', silhouette: false },
      // headline bar
      { d: rr(x + 5, y + h * 0.64, w - 10, 4, 1), fill: '$secondary', silhouette: false },
    ];
    const lines = params.lines ?? 2;
    for (let i = 0; i < lines; i++) {
      shapes.push({ d: rr(x + 7, y + h * 0.76 + i * 4, w - 14 - i * 4, 2, 1), fill: '#00000055', silhouette: false });
    }
    return shapes;
  },
};

const wallClock: PropTemplate = {
  id: 'wall-clock',
  label: 'Wall clock',
  projection: 'plan',
  placement: 'wall-slot',
  gridFootprint: { w: 1, h: 1 },
  params: [{ key: 'time', label: 'Hour hand', min: 0, max: 11, step: 1, default: 10 }],
  build(params) {
    const cy = 62;
    const r = 15;
    const shapes: ShapeSpec[] = [
      { d: circle(CX, cy, r), fill: '$primary' },
      { d: circle(CX, cy, r - 3), fill: '#F4F1E8', silhouette: false },
    ];
    // hour ticks
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const ox = CX + Math.sin(a) * (r - 4);
      const oy = cy - Math.cos(a) * (r - 4);
      shapes.push({ d: circle(ox, oy, i % 3 === 0 ? 1.1 : 0.6), fill: '#2C2C2A', silhouette: false });
    }
    // hands
    const hour = params.time ?? 10;
    const ha = (hour / 12) * Math.PI * 2;
    const ma = (Math.PI * 2) * 0.0; // 12 o'clock minute
    shapes.push(
      { d: `M ${CX} ${cy} L ${CX + Math.sin(ha) * (r - 8)} ${cy - Math.cos(ha) * (r - 8)}`, stroke: '#2C2C2A', strokeWidth: 2, silhouette: false },
      { d: `M ${CX} ${cy} L ${CX + Math.sin(ma) * (r - 5)} ${cy - Math.cos(ma) * (r - 5)}`, stroke: '#2C2C2A', strokeWidth: 1.4, silhouette: false },
      { d: circle(CX, cy, 1.6), fill: '$accent', silhouette: false },
    );
    return shapes;
  },
};

const fridge: PropTemplate = {
  id: 'fridge',
  label: 'Break room fridge',
  gridFootprint: { w: 1, h: 1 },
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 21, ry: 4.5 },
  params: [{ key: 'height', label: 'Height', min: 66, max: 90, step: 2, default: 78 }],
  build(params) {
    const h = params.height;
    const top = GROUND - h;
    const freezerY = top + h * 0.32;
    return [
      // body
      { d: rr(CX - 19, top, 38, h, 6), fill: '$primary' },
      // freezer divider
      { d: `M ${CX - 19} ${freezerY} L ${CX + 19} ${freezerY}`, stroke: '#00000033', strokeWidth: 2, silhouette: false },
      // handles
      { d: rr(CX + 10, top + 8, 4, freezerY - top - 14, 2), fill: '$accent', silhouette: false },
      { d: rr(CX + 10, freezerY + 6, 4, 22, 2), fill: '$accent', silhouette: false },
      // passive-aggressive note + magnets
      { d: rr(CX - 13, freezerY + 8, 12, 14, 1), fill: '#F7F4EC', silhouette: false },
      { d: circle(CX - 7, freezerY + 8, 2), fill: '$secondary', silhouette: false },
      { d: circle(CX - 12, top + 10, 2), fill: '$secondary', silhouette: false },
    ];
  },
};

const conferenceTable: PropTemplate = {
  id: 'conference-table',
  label: 'Conference table',
  projection: 'plan',
  // large meeting table ringed with chairs — a whole room's centerpiece
  gridFootprint: { w: 3, h: 2 },
  params: [
    { key: 'width', label: 'Width', min: 84, max: 120, step: 4, default: 110 },
    { key: 'chairs', label: 'Chairs', min: 0, max: 8, step: 1, default: 6 },
  ],
  build(params) {
    const w = params.width ?? 110;
    const x = CX - w / 2;
    const top = 42;
    const depth = 44;
    const shapes: ShapeSpec[] = [];
    // chairs tucked around the table, drawn first so the tabletop overlaps them
    const chairs = params.chairs ?? 6;
    const nTop = Math.ceil(chairs / 2);
    const nBottom = chairs - nTop;
    const chair = (cx: number, cy: number, away: 1 | -1) => {
      shapes.push(
        { d: circle(cx, cy, 9), fill: '$accent' },
        {
          d: `M ${cx - 9.5} ${cy + 3 * away} A 11 11 0 0 ${away > 0 ? 0 : 1} ${cx + 9.5} ${cy + 3 * away}`,
          stroke: '$accent',
          strokeWidth: 4,
        },
      );
    };
    for (let i = 0; i < nTop; i++) chair(x + ((i + 1) * w) / (nTop + 1), top - 6, -1);
    for (let i = 0; i < nBottom; i++) chair(x + ((i + 1) * w) / (nBottom + 1), top + depth + 6, 1);
    shapes.push(
      { d: rr(x, top, w, depth, 12), fill: '$primary' },
      // tabletop inset
      { d: rr(x + 8, top + 8, w - 16, depth - 16, 8), fill: '#00000010', silhouette: false },
    );
    return shapes;
  },
};

const receptionDesk: PropTemplate = {
  id: 'reception-desk',
  label: 'Reception desk',
  projection: 'plan',
  // L-shaped counter — front run plus a side return
  gridFootprint: { w: 2, h: 2 },
  params: [{ key: 'width', label: 'Width', min: 72, max: 104, step: 4, default: 88 }],
  build(params) {
    const w = params.width ?? 88;
    const x = CX - w / 2;
    const top = 40;
    return [
      // L-shaped counter: front run + side return the receptionist sits behind
      { d: rr(x, top, w, 24, 6), fill: '$primary' },
      { d: rr(x, top, 24, 64, 6), fill: '$primary' },
      // counter surface inset
      { d: rr(x + 4, top + 4, w - 8, 16, 4), fill: '#00000010', silhouette: false },
      // receptionist monitor on the return, seen from above
      { d: rr(x + 6, top + 34, 12, 22, 2), fill: '#2C2C2A', silhouette: false },
      // service bell on the front counter
      { d: circle(x + w - 16, top + 12, 4.5), fill: '$accent', silhouette: false },
      { d: circle(x + w - 16, top + 12, 1.6), fill: '#00000033', silhouette: false },
    ];
  },
};

const badgeReader: PropTemplate = {
  id: 'badge-reader',
  label: 'Badge reader',
  gridFootprint: { w: 1, h: 1 },
  projection: 'plan',
  placement: 'wall-slot',
  params: [{ key: 'granted', label: 'Access granted', min: 0, max: 1, step: 1, default: 1 }],
  build(params) {
    const light = params.granted >= 1 ? '#97C459' : '#E24B4A';
    return [
      // small panel inset on a wall slot, not a front-facing object
      { d: rr(CX - 10, 53, 20, 22, 3), fill: '$primary' },
      { d: rr(CX - 7, 57, 14, 14, 2), fill: '$secondary', silhouette: false },
      // status light
      { d: circle(CX, 60, 2.4), fill: light, silhouette: false },
      // keypad
      { d: circle(CX - 4, 65, 1.3), fill: '#00000055', silhouette: false },
      { d: circle(CX + 4, 65, 1.3), fill: '#00000055', silhouette: false },
      { d: circle(CX - 4, 69, 1.3), fill: '#00000055', silhouette: false },
      { d: circle(CX + 4, 69, 1.3), fill: '#00000055', silhouette: false },
      // swipe slot
      { d: `M ${CX - 5} 72 L ${CX + 5} 72`, stroke: '#00000055', strokeWidth: 2, silhouette: false },
    ];
  },
};

const door: PropTemplate = {
  id: 'door',
  label: 'Door',
  gridFootprint: { w: 1, h: 1 },
  projection: 'plan',
  placement: 'wall-slot',
  params: [
    { key: 'thickness', label: 'Thickness', min: 24, max: 36, step: 2, default: 30 },
    { key: 'open', label: 'Open', min: 0, max: 1, step: 1, default: 0 },
  ],
  /**
   * Top-down door filling a doorway gap. The art is authored for a HORIZONTAL
   * wall (band across the tile); the layout rotates it 90° for vertical runs.
   * It spans the full tile width and sits in the wall band (y centered on 64),
   * with gray frame caps ($secondary) at the ends that overlap the neighbor
   * wall arms — so the door reads as a segment OF the wall, not an object
   * dropped on the floor. Closed = a wood slab ($primary) filling the gap with
   * a centre seam + handles; open = the gap is clear (floor shows through the
   * threshold split) with the leaf swung perpendicular into the room.
   */
  build(params) {
    const t = params.thickness ?? 30;
    const y0 = CX - t / 2;
    const isOpen = (params.open ?? 0) >= 1;
    const OV = 3; // overlap neighbor wall arms so the frame joins the wall run
    const jamb = 13; // length of the gray frame cap at each end
    const seam = '#00000026';
    const shapes: ShapeSpec[] = [
      // gray frame caps that tie the doorway into the wall run on both ends
      { d: rr(-OV, y0, jamb + OV, t, 2), fill: '$secondary' },
      { d: rr(SIZE - jamb, y0, jamb + OV, t, 2), fill: '$secondary' },
    ];
    if (isOpen) {
      // leaf swung 90° flush to the left jamb, opening into the lower room
      shapes.push(
        { d: rr(jamb - 2, y0 + t - 3, 7, 40, 2), fill: '$primary' },
        { d: circle(jamb + 1.5, y0 + t + 33, 2.2), fill: '$accent', silhouette: false },
        // faint swing arc hinting the travel of the leaf
        { d: `M ${jamb + 5} ${y0 + t} A 40 40 0 0 1 ${jamb + 42} ${y0 + t + 2}`, stroke: '#00000018', strokeWidth: 2, silhouette: false },
      );
    } else {
      // closed leaf spanning the opening between the two frame caps
      const x = jamb - 1;
      const w = SIZE - 2 * (jamb - 1);
      shapes.push(
        { d: rr(x, y0 + 1, w, t - 2, 2), fill: '$primary' },
        // centre meeting seam + two leaf panels
        { d: `M ${CX} ${y0 + 3} L ${CX} ${y0 + t - 3}`, stroke: seam, strokeWidth: 2, silhouette: false },
        { d: `M ${x + w * 0.33} ${y0 + 4} L ${x + w * 0.33} ${y0 + t - 4}`, stroke: '#00000014', strokeWidth: 1.5, silhouette: false },
        { d: `M ${x + w * 0.67} ${y0 + 4} L ${x + w * 0.67} ${y0 + t - 4}`, stroke: '#00000014', strokeWidth: 1.5, silhouette: false },
        // paired handles at the centre seam
        { d: circle(CX - 6, CX, 2.2), fill: '$accent', silhouette: false },
        { d: circle(CX + 6, CX, 2.2), fill: '$accent', silhouette: false },
      );
    }
    return shapes;
  },
};

const window: PropTemplate = {
  id: 'window',
  label: 'Window',
  gridFootprint: { w: 1, h: 1 },
  projection: 'plan',
  placement: 'wall-slot',
  params: [
    { key: 'width', label: 'Width', min: 48, max: 88, step: 4, default: 72 },
    { key: 'blinds', label: 'Blinds', min: 0, max: 3, step: 1, default: 1 },
  ],
  build(params) {
    const w = params.width ?? 72;
    const x = CX - w / 2;
    const y = 52;
    const h = 24;
    const shapes: ShapeSpec[] = [
      { d: rr(x - 5, y - 4, w + 10, h + 8, 3), fill: '$primary' },
      { d: rr(x, y, w, h, 2), fill: '$secondary', opacity: 0.86 },
      { d: `M ${CX} ${y + 3} L ${CX} ${y + h - 3} M ${x + 4} ${y + h / 2} L ${x + w - 4} ${y + h / 2}`, stroke: '$primary', strokeWidth: 2.5, silhouette: false },
      { d: `M ${x + 8} ${y + 6} L ${x + 20} ${y + 6}`, stroke: '#FFFFFF80', strokeWidth: 2, silhouette: false },
    ];
    const blinds = params.blinds ?? 1;
    for (let i = 0; i < blinds; i++) {
      const by = y + 7 + i * 5;
      shapes.push({ d: `M ${x + 7} ${by} L ${x + w - 7} ${by}`, stroke: '$accent', strokeWidth: 1.5, opacity: 0.55, silhouette: false });
    }
    return shapes;
  },
};

const nameplate: PropTemplate = {
  id: 'nameplate',
  label: 'Nameplate',
  gridFootprint: { w: 1, h: 1 },
  projection: 'plan',
  placement: 'wall-slot',
  params: [
    { key: 'width', label: 'Width', min: 34, max: 64, step: 2, default: 48 },
    { key: 'lines', label: 'Label lines', min: 1, max: 3, step: 1, default: 2 },
  ],
  build(params) {
    const w = params.width ?? 48;
    const x = CX - w / 2;
    const y = 55;
    const shapes: ShapeSpec[] = [
      { d: rr(x - 3, y - 3, w + 6, 18, 3), fill: '$primary' },
      { d: rr(x + 4, y + 4, w - 8, 3, 1), fill: '$secondary', silhouette: false },
    ];
    const lines = params.lines ?? 2;
    for (let i = 0; i < lines; i++) {
      shapes.push({ d: rr(x + 9, y + 9 + i * 4, w - 18 - i * 8, 2, 1), fill: '$accent', silhouette: false });
    }
    return shapes;
  },
};

const hvacVent: PropTemplate = {
  id: 'hvac-vent',
  label: 'HVAC vent',
  gridFootprint: { w: 1, h: 1 },
  projection: 'plan',
  placement: 'wall-slot',
  params: [
    { key: 'width', label: 'Width', min: 36, max: 66, step: 2, default: 52 },
    { key: 'slats', label: 'Slats', min: 3, max: 7, step: 1, default: 5 },
  ],
  build(params) {
    const w = params.width ?? 52;
    const x = CX - w / 2;
    const y = 55;
    const shapes: ShapeSpec[] = [
      { d: rr(x, y, w, 18, 3), fill: '$primary' },
      { d: rr(x + 4, y + 4, w - 8, 10, 2), fill: '$secondary', silhouette: false },
    ];
    const slats = params.slats ?? 5;
    for (let i = 0; i < slats; i++) {
      const sx = x + 9 + (i * (w - 18)) / Math.max(1, slats - 1);
      shapes.push({ d: `M ${sx} ${y + 6} L ${sx - 2} ${y + 13}`, stroke: '$accent', strokeWidth: 1.7, silhouette: false });
    }
    return shapes;
  },
};

const deskClutter: PropTemplate = {
  id: 'desk-clutter',
  label: 'Desk clutter',
  gridFootprint: { w: 1, h: 1 },
  projection: 'plan',
  params: [
    { key: 'papers', label: 'Paper piles', min: 1, max: 4, step: 1, default: 3 },
    { key: 'phone', label: 'Phone', min: 0, max: 1, step: 1, default: 1 },
  ],
  build(params) {
    const shapes: ShapeSpec[] = [];
    const piles = params.papers ?? 3;
    const paperCells: Array<[number, number, number]> = [
      [42, 42, -7],
      [59, 55, 4],
      [77, 44, -3],
      [50, 72, 6],
    ];
    for (let i = 0; i < piles; i++) {
      const [x, y, rot] = paperCells[i];
      shapes.push(
        { d: `M ${x - 9} ${y - 7} L ${x + 10} ${y - 7 + rot * 0.04} L ${x + 8} ${y + 8} L ${x - 10} ${y + 7 - rot * 0.04} Z`, fill: '#F7F4EC' },
        { d: `M ${x - 5} ${y - 1} L ${x + 5} ${y - 1} M ${x - 4} ${y + 4} L ${x + 4} ${y + 4}`, stroke: '$secondary', strokeWidth: 1.5, silhouette: false },
      );
    }
    if ((params.phone ?? 1) >= 1) {
      shapes.push(
        { d: rr(80, 66, 25, 13, 4), fill: '$primary' },
        { d: rr(84, 69, 12, 4, 2), fill: '$accent', silhouette: false },
        { d: circle(101, 72, 2), fill: '$secondary', silhouette: false },
      );
    }
    shapes.push({ d: circle(36, 72, 4.5), fill: '$accent', silhouette: false });
    return shapes;
  },
};

const couch: PropTemplate = {
  id: 'couch',
  label: 'Couch',
  projection: 'plan',
  gridFootprint: { w: 2, h: 1 },
  params: [
    { key: 'width', label: 'Width', min: 62, max: 98, step: 4, default: 82 },
    { key: 'cushions', label: 'Cushions', min: 2, max: 3, step: 1, default: 3 },
  ],
  build(params) {
    const w = params.width ?? 82;
    const x = CX - w / 2;
    const top = 42;
    const cushions = params.cushions ?? 3;
    const shapes: ShapeSpec[] = [
      { d: rr(x - 8, top - 6, w + 16, 52, 10), fill: '$secondary' },
      { d: rr(x, top, w, 42, 8), fill: '$primary' },
      { d: rr(x - 12, top + 4, 14, 34, 6), fill: '$secondary' },
      { d: rr(x + w - 2, top + 4, 14, 34, 6), fill: '$secondary' },
      { d: rr(x + 5, top + 31, w - 10, 7, 3), fill: '#00000016', silhouette: false },
    ];
    for (let i = 1; i < cushions; i++) {
      const sx = x + (w * i) / cushions;
      shapes.push({ d: `M ${sx} ${top + 7} L ${sx} ${top + 36}`, stroke: '$secondary', strokeWidth: 2, opacity: 0.65, silhouette: false });
    }
    return shapes;
  },
};

const rug: PropTemplate = {
  id: 'rug',
  label: 'Rug',
  projection: 'plan',
  // area rug defining a lounge zone; walkable, so it never blocks
  gridFootprint: { w: 2, h: 2 },
  params: [
    { key: 'width', label: 'Width', min: 72, max: 112, step: 4, default: 96 },
    { key: 'pattern', label: 'Pattern', min: 0, max: 2, step: 1, default: 1 },
  ],
  build(params) {
    const w = params.width ?? 96;
    const x = CX - w / 2;
    const y = 42;
    const h = 48;
    const shapes: ShapeSpec[] = [
      { d: rr(x, y, w, h, 12), fill: '$primary' },
      { d: rr(x + 8, y + 8, w - 16, h - 16, 8), fill: '$secondary', silhouette: false },
    ];
    const pattern = params.pattern ?? 1;
    if (pattern >= 1) shapes.push({ d: rr(x + 20, y + 18, w - 40, h - 36, 6), fill: '$accent', opacity: 0.55, silhouette: false });
    if (pattern >= 2) {
      shapes.push(
        { d: `M ${x + 12} ${y + 12} L ${x + w - 12} ${y + h - 12}`, stroke: '#FFFFFF42', strokeWidth: 4, silhouette: false },
        { d: `M ${x + w - 12} ${y + 12} L ${x + 12} ${y + h - 12}`, stroke: '#FFFFFF42', strokeWidth: 4, silhouette: false },
      );
    }
    return shapes;
  },
};

const vendingMachine: PropTemplate = {
  id: 'vending-machine',
  label: 'Vending machine',
  gridFootprint: { w: 1, h: 1 },
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 25, ry: 4.5 },
  params: [
    { key: 'height', label: 'Height', min: 70, max: 94, step: 2, default: 84 },
    { key: 'stocked', label: 'Stocked rows', min: 1, max: 3, step: 1, default: 3 },
  ],
  build(params) {
    const h = params.height ?? 84;
    const top = GROUND - h;
    const stocked = params.stocked ?? 3;
    const shapes: ShapeSpec[] = [
      { d: rr(CX - 23, top, 46, h, 5), fill: '$primary' },
      { d: rr(CX - 17, top + 8, 24, h - 20, 3), fill: '$secondary', opacity: 0.92 },
      { d: rr(CX + 10, top + 11, 8, h - 24, 2), fill: '#00000038', silhouette: false },
      { d: circle(CX + 14, top + 23, 2.5), fill: '$accent', silhouette: false },
      { d: rr(CX + 11, GROUND - 22, 7, 9, 1.5), fill: '$accent', silhouette: false },
      { d: rr(CX - 13, GROUND - 10, 25, 5, 2), fill: '#00000040', silhouette: false },
    ];
    const colors = ['#D85A30', '#97C459', '#185FA5', '#EF9F27', '#F7F4EC', '#A32D2D'];
    for (let row = 0; row < stocked; row++) {
      for (let col = 0; col < 3; col++) {
        shapes.push({ d: rr(CX - 14 + col * 8, top + 14 + row * 14, 5, 8, 1), fill: colors[(row * 3 + col) % colors.length], silhouette: false });
      }
    }
    return shapes;
  },
};

const officeChair: PropTemplate = {
  id: 'office-chair',
  label: 'Office chair',
  gridFootprint: { w: 1, h: 1 },
  projection: 'plan',
  params: [{ key: 'size', label: 'Seat size', min: 10, max: 16, step: 1, default: 13 }],
  build(params) {
    const r = params.size ?? 13;
    const cy = 64;
    return [
      // backrest: thick arc on the south edge (rotate in-engine to face the desk)
      {
        d: `M ${CX - r - 2.5} ${cy + r * 0.4} A ${r + 3.5} ${r + 3.5} 0 0 0 ${CX + r + 2.5} ${cy + r * 0.4}`,
        stroke: '$accent',
        strokeWidth: 5,
      },
      // armrests
      { d: rr(CX - r - 5, cy - 7, 4.5, 14, 2), fill: '$secondary' },
      { d: rr(CX + r + 0.5, cy - 7, 4.5, 14, 2), fill: '$secondary' },
      // seat
      { d: circle(CX, cy, r), fill: '$primary' },
      // cushion inset
      { d: circle(CX, cy, r - 5), fill: '#00000014', silhouette: false },
    ];
  },
};

const cubicleWorkstation: PropTemplate = {
  id: 'cubicle-workstation',
  label: 'Cubicle workstation',
  projection: 'plan',
  // a partitioned one-person pod — desk, chair, and surrounding panels
  gridFootprint: { w: 2, h: 2 },
  params: [
    { key: 'openness', label: 'Opening side', min: 0, max: 3, step: 1, default: 0 },
    { key: 'clutter', label: 'Desk clutter', min: 0, max: 2, step: 1, default: 1 },
  ],
  build(params) {
    const panel = '$secondary';
    const fabric = '$primary';
    const accent = '$accent';
    const openSide = params.openness ?? 0;
    const shapes: ShapeSpec[] = [
      // soft footprint shadow so pods read as furniture, not architecture
      { d: rr(20, 20, 88, 88, 8), fill: '#00000010', silhouette: false },
      // privacy-post caps
      { d: rr(16, 16, 14, 14, 4), fill: accent },
      { d: rr(98, 16, 14, 14, 4), fill: accent },
      { d: rr(16, 98, 14, 14, 4), fill: accent },
      { d: rr(98, 98, 14, 14, 4), fill: accent },
      // work surface and equipment
      { d: rr(32, 34, 64, 38, 5), fill: '$primary' },
      { d: rr(42, 39, 28, 7, 2), fill: '#2C2C2A', silhouette: false },
      { d: rr(54, 46, 5, 5, 1.5), fill: '#2C2C2A', silhouette: false },
      { d: rr(39, 54, 34, 10, 2), fill: '#F7F4EC', silhouette: false },
      { d: ellipse(82, 58, 4, 5), fill: '#F7F4EC', silhouette: false },
      // chair tucked into the open side
      { d: circle(64, 88, 12), fill: '$accent' },
      {
        d: 'M 52 91 A 14 14 0 0 0 76 91',
        stroke: '$accent',
        strokeWidth: 5,
      },
    ];

    // Low fabric partitions around a one-person workstation.
    if (openSide !== 2) {
      shapes.push(
        { d: rr(18, 18, 92, 10, 3), fill: panel },
        { d: rr(24, 23, 80, 4, 1.5), fill: fabric, silhouette: false },
      );
    }
    if (openSide !== 3) {
      shapes.push(
        { d: rr(18, 18, 10, 92, 3), fill: panel },
        { d: rr(23, 24, 4, 80, 1.5), fill: fabric, silhouette: false },
      );
    }
    if (openSide !== 1) {
      shapes.push(
        { d: rr(100, 18, 10, 92, 3), fill: panel },
        { d: rr(101, 24, 4, 80, 1.5), fill: fabric, silhouette: false },
      );
    }

    if ((params.clutter ?? 1) >= 1) {
      shapes.push(
        { d: rr(82, 38, 8, 11, 1.5), fill: '#F7F4EC', silhouette: false },
        { d: circle(89, 65, 4.5), fill: accent, silhouette: false },
      );
    }
    if ((params.clutter ?? 1) >= 2) {
      shapes.push(
        { d: rr(35, 65, 14, 4, 1.5), fill: '#D85A30', silhouette: false },
        { d: rr(50, 65, 10, 4, 1.5), fill: '#97C459', silhouette: false },
      );
    }

    return shapes;
  },
};

const whiteboard: PropTemplate = {
  id: 'whiteboard',
  label: 'Whiteboard',
  gridFootprint: { w: 1, h: 1 },
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 28, ry: 4 },
  params: [
    { key: 'width', label: 'Width', min: 52, max: 76, step: 4, default: 64 },
    { key: 'scribbles', label: 'Scribbles', min: 0, max: 3, step: 1, default: 2 },
  ],
  build(params) {
    const w = params.width;
    const x = CX - w / 2;
    const boardY = 50;
    const boardH = 42;
    const shapes: ShapeSpec[] = [
      // frame + board
      { d: rr(x - 3, boardY - 3, w + 6, boardH + 6, 3), fill: '$primary' },
      { d: rr(x, boardY, w, boardH, 1.5), fill: '$secondary', silhouette: false },
      // marker tray
      { d: rr(x + 4, boardY + boardH + 3, w - 8, 4, 2), fill: '$primary' },
      // legs + feet
      { d: `M ${x + 6} ${boardY + boardH + 7} L ${x + 2} ${GROUND} M ${x + w - 6} ${boardY + boardH + 7} L ${x + w - 2} ${GROUND}`, stroke: '$primary', strokeWidth: 4 },
    ];
    const inks = ['$accent', '#185FA5', '#3B6D11'];
    for (let i = 0; i < params.scribbles; i++) {
      const y = boardY + 9 + i * 10;
      shapes.push({
        d: `M ${x + 7} ${y} Q ${x + 16} ${y - 4} ${x + 24} ${y} T ${x + 7 + (w - 14) * (0.55 + i * 0.15)} ${y}`,
        stroke: inks[i % inks.length],
        strokeWidth: 2,
        silhouette: false,
      });
    }
    return shapes;
  },
};

const filingCabinet: PropTemplate = {
  id: 'filing-cabinet',
  label: 'Filing cabinet',
  gridFootprint: { w: 1, h: 1 },
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 19, ry: 4 },
  params: [{ key: 'drawers', label: 'Drawers', min: 2, max: 4, step: 1, default: 3 }],
  build(params) {
    const drawers = params.drawers;
    const drawerH = 22;
    const h = drawers * drawerH + 6;
    const top = GROUND - h;
    const shapes: ShapeSpec[] = [{ d: rr(CX - 17, top, 34, h, 3), fill: '$primary' }];
    for (let i = 0; i < drawers; i++) {
      const dy = top + 4 + i * drawerH;
      shapes.push(
        { d: rr(CX - 13, dy, 26, drawerH - 4, 2), fill: '$secondary', silhouette: false },
        { d: rr(CX - 6, dy + 4, 12, 3, 1.5), fill: '$accent', silhouette: false },
        { d: rr(CX - 4, dy + 10, 8, 5, 1), fill: '#F7F4EC', silhouette: false },
      );
    }
    return shapes;
  },
};

const supplyCabinet: PropTemplate = {
  id: 'supply-cabinet',
  label: 'Supply cabinet',
  gridFootprint: { w: 1, h: 1 },
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 22, ry: 4.5 },
  params: [{ key: 'height', label: 'Height', min: 60, max: 84, step: 2, default: 72 }],
  build(params) {
    const h = params.height;
    const top = GROUND - h;
    const w = 40;
    const x = CX - w / 2;
    const shelfY = top + Math.round(h * 0.42);
    const doorW = (w - 13) / 2;
    const doorTop = shelfY + 4;
    const doorH = GROUND - doorTop - 4;
    return [
      // carcass
      { d: rr(x, top, w, h, 4), fill: '$primary' },
      // open upper shelf recess
      { d: rr(x + 4, top + 4, w - 8, shelfY - top - 6, 2), fill: '$secondary', silhouette: false },
      // stacked supplies on the shelf: paper reams + a box + a bottle
      { d: rr(x + 7, top + 7, 10, 8, 1), fill: '#F7F4EC', silhouette: false },
      { d: rr(x + 18, top + 8, 8, 7, 1), fill: '$accent', silhouette: false },
      { d: rr(x + 27, top + 6, 6, 9, 1), fill: '#97C459', silhouette: false },
      // lower double doors
      { d: rr(x + 5, doorTop, doorW, doorH, 2), fill: '$secondary', silhouette: false },
      { d: rr(CX + 2, doorTop, doorW, doorH, 2), fill: '$secondary', silhouette: false },
      // door handles meeting at the centre seam
      { d: rr(CX - 3.5, doorTop + doorH / 2 - 4, 2, 8, 1), fill: '$accent', silhouette: false },
      { d: rr(CX + 1.5, doorTop + doorH / 2 - 4, 2, 8, 1), fill: '$accent', silhouette: false },
    ];
  },
};

const mailStation: PropTemplate = {
  id: 'mail-station',
  label: 'Mail station',
  gridFootprint: { w: 1, h: 1 },
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 24, ry: 4.5 },
  params: [
    { key: 'height', label: 'Height', min: 48, max: 72, step: 2, default: 60 },
    { key: 'columns', label: 'Slot columns', min: 3, max: 5, step: 1, default: 4 },
  ],
  build(params) {
    const h = params.height;
    const cols = params.columns ?? 4;
    const top = GROUND - h;
    const w = 46;
    const x = CX - w / 2;
    const sorterH = Math.round(h * 0.62);
    const shapes: ShapeSpec[] = [
      // carcass
      { d: rr(x, top, w, h, 3), fill: '$primary' },
      // pigeonhole face
      { d: rr(x + 4, top + 4, w - 8, sorterH - 6, 2), fill: '$secondary', silhouette: false },
    ];
    // grid of mail cubbies
    const rows = 3;
    const gx = x + 6;
    const gy = top + 6;
    const gw = w - 12;
    const gh = sorterH - 10;
    const cw = gw / cols;
    const ch = gh / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        shapes.push({ d: rr(gx + c * cw + 1, gy + r * ch + 1, cw - 2, ch - 2, 1), fill: '#00000026', silhouette: false });
      }
    }
    // a couple of envelopes poking out of slots
    shapes.push(
      { d: rr(gx + 1.5, gy + 1.5, cw - 3, ch * 0.5, 0.5), fill: '#F7F4EC', silhouette: false },
      { d: rr(gx + cw * (cols - 1) + 1.5, gy + ch + 1.5, cw - 3, ch * 0.5, 0.5), fill: '#F7F4EC', silhouette: false },
      // lower parcel shelf + an accent label strip
      { d: rr(x + 4, top + sorterH + 2, w - 8, GROUND - (top + sorterH) - 5, 2), fill: '$secondary', silhouette: false },
      { d: rr(x + 6, top + sorterH + 5, 16, 4, 1), fill: '$accent', silhouette: false },
    );
    return shapes;
  },
};

const trashBin: PropTemplate = {
  id: 'trash-bin',
  label: 'Trash bin',
  gridFootprint: { w: 1, h: 1 },
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 14, ry: 3.5 },
  params: [{ key: 'height', label: 'Height', min: 28, max: 46, step: 2, default: 36 }],
  build(params) {
    const h = params.height ?? 36;
    const top = GROUND - h;
    const topW = 24;
    const botW = 19;
    return [
      // tapered body
      { d: `M ${CX - topW / 2} ${top} L ${CX + topW / 2} ${top} L ${CX + botW / 2} ${GROUND} L ${CX - botW / 2} ${GROUND} Z`, fill: '$primary' },
      // rim / lid
      { d: rr(CX - topW / 2 - 2, top - 4, topW + 4, 6, 2), fill: '$secondary' },
      // opening shadow
      { d: ellipse(CX, top - 1, topW / 2 - 2, 2.5), fill: '#00000033', silhouette: false },
      // ribs
      { d: `M ${CX - 5} ${top + 5} L ${CX - 6} ${GROUND - 3}`, stroke: '#00000018', strokeWidth: 1.5, silhouette: false },
      { d: `M ${CX + 5} ${top + 5} L ${CX + 6} ${GROUND - 3}`, stroke: '#00000018', strokeWidth: 1.5, silhouette: false },
      // a wad of paper poking out
      { d: rr(CX - 4, top - 7, 8, 5, 1.5), fill: '#F7F4EC', silhouette: false },
    ];
  },
};

const waterStation: PropTemplate = {
  id: 'water-station',
  label: 'Water station',
  gridFootprint: { w: 1, h: 1 },
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 18, ry: 4 },
  params: [{ key: 'height', label: 'Height', min: 46, max: 64, step: 2, default: 54 }],
  build(params) {
    const h = params.height ?? 54;
    const top = GROUND - h;
    return [
      // inverted jug
      { d: rr(CX - 12, top, 24, 28, 6), fill: '$primary', opacity: 0.9 },
      { d: rr(CX - 10, top + 12, 20, 14, 4), fill: '#9FD0F2', silhouette: false },
      { d: rr(CX - 6, top - 5, 12, 6, 2), fill: '$secondary' },
      // stand / cabinet
      { d: rr(CX - 14, top + 28, 28, h - 28, 4), fill: '$secondary' },
      // spout + drip tray
      { d: rr(CX - 3, top + 31, 6, 7, 2), fill: '$accent', silhouette: false },
      { d: rr(CX - 8, GROUND - 8, 16, 4, 2), fill: '#00000026', silhouette: false },
      // cup sleeve on the side
      { d: rr(CX + 15, top + 30, 6, 18, 2), fill: '$primary' },
      { d: rr(CX + 15.5, top + 30, 5, 4, 1), fill: '#F7F4EC', silhouette: false },
    ];
  },
};

const coatRack: PropTemplate = {
  id: 'coat-rack',
  label: 'Coat rack',
  gridFootprint: { w: 1, h: 1 },
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 12, ry: 3.5 },
  params: [{ key: 'hooks', label: 'Hooks', min: 2, max: 5, step: 1, default: 4 }],
  build(params) {
    const hooks = params.hooks ?? 4;
    const top = GROUND - 80;
    const shapes: ShapeSpec[] = [
      // base
      { d: ellipse(CX, GROUND - 2, 12, 4), fill: '$secondary' },
      // post
      { d: rr(CX - 3, top, 6, GROUND - top - 2, 3), fill: '$primary' },
      // crown knob
      { d: circle(CX, top, 4), fill: '$accent' },
    ];
    for (let i = 0; i < hooks; i++) {
      const hy = top + 8 + i * 7;
      const side = i % 2 === 0 ? 1 : -1;
      shapes.push({ d: `M ${CX} ${hy} q ${side * 7} 0 ${side * 7} 5`, stroke: '$primary', strokeWidth: 3, silhouette: false });
    }
    // a coat draped on the top hook
    shapes.push({
      d: `M ${CX + 7} ${top + 13} Q ${CX + 16} ${top + 26} ${CX + 11} ${top + 42} L ${CX + 4} ${top + 42} Q ${CX + 2} ${top + 24} ${CX + 5} ${top + 14} Z`,
      fill: '$accent',
    });
    return shapes;
  },
};

const bulletinBoard: PropTemplate = {
  id: 'bulletin-board',
  label: 'Bulletin board',
  gridFootprint: { w: 1, h: 1 },
  projection: 'elevation',
  params: [
    { key: 'width', label: 'Width', min: 48, max: 80, step: 4, default: 64 },
    { key: 'notes', label: 'Notices', min: 0, max: 6, step: 1, default: 4 },
  ],
  build(params) {
    const w = params.width ?? 64;
    const x = CX - w / 2;
    const boardY = 48;
    const boardH = 44;
    const shapes: ShapeSpec[] = [
      { d: rr(x - 3, boardY - 3, w + 6, boardH + 6, 3), fill: '$primary' },
      { d: rr(x, boardY, w, boardH, 1.5), fill: '$secondary', silhouette: false },
    ];
    const notes = params.notes ?? 4;
    const cols = 3;
    const noteColors = ['#F7F4EC', '$accent', '#FBE38E', '#BFD8F2'];
    const nw = 13;
    const nh = 13;
    const gx = x + 6;
    const gy = boardY + 6;
    const sx = (w - 12 - nw) / Math.max(1, cols - 1);
    for (let i = 0; i < notes; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const px = gx + c * sx;
      const py = gy + r * (nh + 5);
      shapes.push(
        { d: rr(px, py, nw, nh, 1), fill: noteColors[i % noteColors.length], silhouette: false },
        { d: circle(px + nw / 2, py + 2, 1.3), fill: '#00000040', silhouette: false },
      );
    }
    return shapes;
  },
};

const wallCalendar: PropTemplate = {
  id: 'wall-calendar',
  label: 'Wall calendar',
  gridFootprint: { w: 1, h: 1 },
  projection: 'plan',
  placement: 'wall-slot',
  params: [{ key: 'rows', label: 'Week rows', min: 4, max: 6, step: 1, default: 5 }],
  build(params) {
    const rows = params.rows ?? 5;
    const w = 40;
    const h = 44;
    const x = CX - w / 2;
    const y = 48;
    const shapes: ShapeSpec[] = [
      { d: rr(x - 2, y - 2, w + 4, h + 4, 3), fill: '$primary' },
      { d: rr(x, y, w, 9, 2), fill: '$accent', silhouette: false },
      { d: rr(x, y + 10, w, h - 10, 1), fill: '$secondary', silhouette: false },
    ];
    const cols = 7;
    const gx = x + 2;
    const gy = y + 12;
    const gw = w - 4;
    const gh = h - 14;
    const cw = gw / cols;
    const ch = gh / rows;
    for (let c = 1; c < cols; c++) shapes.push({ d: `M ${gx + c * cw} ${gy} L ${gx + c * cw} ${gy + gh}`, stroke: '#00000018', strokeWidth: 0.8, silhouette: false });
    for (let r = 1; r < rows; r++) shapes.push({ d: `M ${gx} ${gy + r * ch} L ${gx + gw} ${gy + r * ch}`, stroke: '#00000018', strokeWidth: 0.8, silhouette: false });
    shapes.push({ d: circle(gx + cw * 3.5, gy + ch * 1.5, 2.4), stroke: '$accent', strokeWidth: 1.4, silhouette: false });
    return shapes;
  },
};

const waterFountain: PropTemplate = {
  id: 'water-fountain',
  label: 'Water fountain',
  gridFootprint: { w: 1, h: 1 },
  projection: 'plan',
  placement: 'wall-slot',
  params: [{ key: 'basins', label: 'Basins', min: 1, max: 2, step: 1, default: 1 }],
  build(params) {
    const n = params.basins ?? 1;
    const y = 54;
    const shapes: ShapeSpec[] = [];
    const unit = (cx: number) => {
      shapes.push(
        { d: rr(cx - 11, y, 22, 8, 2), fill: '$primary' },
        { d: rr(cx - 9, y + 7, 18, 12, 4), fill: '$secondary' },
        { d: ellipse(cx, y + 13, 6, 3), fill: '#9FD0F2', silhouette: false },
        { d: circle(cx, y + 9, 1.6), fill: '$accent', silhouette: false },
        { d: rr(cx + 5, y + 8, 3, 2, 1), fill: '$accent', silhouette: false },
        { d: circle(cx, y + 14, 0.9), fill: '#00000044', silhouette: false },
      );
    };
    if (n <= 1) unit(CX);
    else {
      unit(CX - 12);
      unit(CX + 12);
    }
    return shapes;
  },
};

const kitchenetteCounter: PropTemplate = {
  id: 'kitchenette-counter',
  label: 'Kitchenette counter',
  projection: 'plan',
  // a long galley counter run
  gridFootprint: { w: 3, h: 1 },
  params: [
    { key: 'length', label: 'Length', min: 80, max: 124, step: 4, default: 108 },
    { key: 'sink', label: 'Sink', min: 0, max: 1, step: 1, default: 1 },
  ],
  build(params) {
    const w = params.length ?? 108;
    const x = CX - w / 2;
    const top = 40;
    const depth = 40;
    const shapes: ShapeSpec[] = [
      { d: rr(x, top, w, depth, 4), fill: '$primary' },
      { d: rr(x + 3, top + 3, w - 6, 6, 2), fill: '#00000012', silhouette: false },
    ];
    if ((params.sink ?? 1) >= 1) {
      shapes.push(
        { d: rr(x + 8, top + 11, 22, 22, 3), fill: '$secondary', silhouette: false },
        { d: rr(x + 11, top + 14, 16, 16, 2), fill: '#8FB7C9', silhouette: false },
        { d: circle(x + 19, top + 22, 1.6), fill: '#00000044', silhouette: false },
        { d: rr(x + 17, top + 5, 4, 8, 1.5), fill: '$accent', silhouette: false },
      );
    }
    const bx = x + w - 40;
    const by = top + 9;
    for (let i = 0; i < 4; i++) {
      const c = i % 2;
      const r = Math.floor(i / 2);
      const ox = bx + c * 18 + 6;
      const oy = by + r * 18 + 6;
      shapes.push(
        { d: circle(ox, oy, 6), stroke: '$secondary', strokeWidth: 2, silhouette: false },
        { d: circle(ox, oy, 2.2), fill: '#00000033', silhouette: false },
      );
    }
    return shapes;
  },
};

const loungeSeating: PropTemplate = {
  id: 'lounge-seating',
  label: 'Lounge seating',
  projection: 'plan',
  // a ring of armchairs around a low table
  gridFootprint: { w: 2, h: 2 },
  params: [{ key: 'seats', label: 'Seats', min: 2, max: 4, step: 1, default: 3 }],
  build(params) {
    const seats = params.seats ?? 3;
    const ring = 30;
    const shapes: ShapeSpec[] = [];
    const armchair = (cx: number, cy: number, outAngle: number) => {
      shapes.push(
        { d: rr(cx - 9, cy - 9, 18, 18, 5), fill: '$primary' },
        { d: rr(cx - 6, cy - 6, 12, 12, 3), fill: '$accent', opacity: 0.5, silhouette: false },
        // backrest lip on the side facing away from the table
        { d: circle(cx + Math.cos(outAngle) * 8, cy + Math.sin(outAngle) * 8, 3.4), fill: '$secondary', silhouette: false },
      );
    };
    for (let i = 0; i < seats; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / seats;
      armchair(CX + Math.cos(a) * ring, CX + Math.sin(a) * ring, a);
    }
    shapes.push(
      { d: circle(CX, CX, 13), fill: '$secondary' },
      { d: circle(CX, CX, 9), fill: '#00000012', silhouette: false },
    );
    return shapes;
  },
};

const breakTable: PropTemplate = {
  id: 'break-table',
  label: 'Break room table',
  projection: 'plan',
  // round café table with a ring of stools
  gridFootprint: { w: 2, h: 2 },
  params: [
    { key: 'diameter', label: 'Diameter', min: 40, max: 64, step: 4, default: 52 },
    { key: 'stools', label: 'Stools', min: 2, max: 4, step: 1, default: 4 },
  ],
  build(params) {
    const d = params.diameter ?? 52;
    const r = d / 2;
    const stools = params.stools ?? 4;
    const ring = r + 12;
    const shapes: ShapeSpec[] = [];
    // round stools first so the tabletop overlaps them — the round top + tucked
    // stools read as a café/lunch table, never as a work desk
    for (let i = 0; i < stools; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / stools;
      const sx = CX + Math.cos(a) * ring;
      const sy = CX + Math.sin(a) * ring;
      shapes.push(
        { d: circle(sx, sy, 8), fill: '$secondary' },
        { d: circle(sx, sy, 4), fill: '#00000018', silhouette: false },
      );
    }
    shapes.push(
      // round tabletop
      { d: circle(CX, CX, r), fill: '$primary' },
      { d: circle(CX, CX, r - 5), fill: '#00000010', silhouette: false },
      // a napkin/condiment caddy at the centre so it never reads as a monitor desk
      { d: rr(CX - 5, CX - 6, 10, 12, 2), fill: '$accent', silhouette: false },
    );
    return shapes;
  },
};

// ---------------------------------------------------------------------------
// Building-surround props (the "floor in a tower" border — see
// docs/building-surround-model.md). Decorative only: the generator places these
// in the ring OUTSIDE the tenant rect and must NOT emit interaction anchors for
// them, so the sim never treats a neighbor's elevator as a usable amenity.
// ---------------------------------------------------------------------------

const elevatorBank: PropTemplate = {
  id: 'elevator-bank',
  label: 'Elevator bank',
  gridFootprint: { w: 2, h: 1 },
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 30, ry: 4 },
  params: [
    { key: 'doors', label: 'Doors', min: 1, max: 3, step: 1, default: 2 },
    { key: 'height', label: 'Door height', min: 60, max: 84, step: 2, default: 74 },
  ],
  build(params) {
    const doors = params.doors ?? 2;
    const h = params.height ?? 74;
    const top = GROUND - h;
    const dw = 26;
    const gap = 8;
    const totalW = doors * dw + (doors - 1) * gap;
    const startX = CX - totalW / 2;
    const shapes: ShapeSpec[] = [
      // surround / wall facing
      { d: rr(startX - 8, top - 10, totalW + 16, h + 10, 3), fill: '$primary' },
    ];
    for (let i = 0; i < doors; i++) {
      const x = startX + i * (dw + gap);
      shapes.push(
        // metal door pair
        { d: rr(x, top, dw, h, 2), fill: '$secondary' },
        // centre meeting seam
        { d: `M ${x + dw / 2} ${top + 2} L ${x + dw / 2} ${GROUND - 2}`, stroke: '#00000033', strokeWidth: 1.5, silhouette: false },
        // brushed-metal highlight
        { d: rr(x + 3, top + 3, 3, h - 6, 1), fill: '#FFFFFF1F', silhouette: false },
        // floor indicator above the door
        { d: rr(x + dw / 2 - 6, top - 8, 12, 5, 1), fill: '#1A1A18', silhouette: false },
        { d: circle(x + dw / 2, top - 5.5, 1.4), fill: '$accent', silhouette: false },
        // call button panel between/beside doors
        { d: rr(x + dw + gap / 2 - 2, top + h * 0.4, 4, 9, 1), fill: '$accent', silhouette: false },
      );
    }
    return shapes;
  },
};

const exitSign: PropTemplate = {
  id: 'exit-sign',
  label: 'Exit / stairwell door',
  gridFootprint: { w: 1, h: 1 },
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 22, ry: 4 },
  params: [{ key: 'height', label: 'Door height', min: 64, max: 84, step: 2, default: 76 }],
  build(params) {
    const h = params.height ?? 76;
    const top = GROUND - h;
    const w = 40;
    const x = CX - w / 2;
    return [
      // door frame + slab
      { d: rr(x - 4, top - 2, w + 8, h + 2, 2), fill: '$primary' },
      { d: rr(x, top + 2, w, h - 2, 1), fill: '$secondary' },
      // push bar
      { d: rr(x + 4, top + h * 0.5, w - 8, 5, 2), fill: '#00000026', silhouette: false },
      // kick plate
      { d: rr(x + 3, GROUND - 12, w - 6, 9, 1), fill: '#00000018', silhouette: false },
      // illuminated EXIT sign above (accent defaults to signage red)
      { d: rr(CX - 16, top - 16, 32, 12, 1.5), fill: '$accent' },
      // light letter bars
      { d: rr(CX - 12, top - 12, 5, 5, 0.5), fill: '#F7F4EC', silhouette: false },
      { d: rr(CX - 5, top - 12, 5, 5, 0.5), fill: '#F7F4EC', silhouette: false },
      { d: rr(CX + 2, top - 12, 5, 5, 0.5), fill: '#F7F4EC', silhouette: false },
      { d: rr(CX + 9, top - 12, 4, 5, 0.5), fill: '#F7F4EC', silhouette: false },
    ];
  },
};

const neighborGlass: PropTemplate = {
  id: 'neighbor-glass',
  label: 'Neighbor suite glass',
  gridFootprint: { w: 2, h: 1 },
  projection: 'plan',
  placement: 'wall-slot',
  params: [
    { key: 'width', label: 'Width', min: 64, max: 112, step: 4, default: 96 },
    { key: 'lit', label: 'Suite lit', min: 0, max: 1, step: 1, default: 0 },
  ],
  build(params) {
    const w = params.width ?? 96;
    const x = CX - w / 2;
    const y = 46;
    const h = 32;
    const glass = (params.lit ?? 0) >= 1 ? 0.4 : 0.7;
    const shapes: ShapeSpec[] = [
      // storefront frame
      { d: rr(x - 3, y - 3, w + 6, h + 6, 2), fill: '$primary' },
      // frosted glazing (darker = unlit suite behind)
      { d: rr(x, y, w, h, 1), fill: '$secondary', opacity: glass },
    ];
    // vertical mullions dividing the storefront into bays
    const bays = 4;
    for (let i = 1; i < bays; i++) {
      const mx = x + (w * i) / bays;
      shapes.push({ d: `M ${mx} ${y} L ${mx} ${y + h}`, stroke: '$primary', strokeWidth: 2, silhouette: false });
    }
    // fictional company name placard on the centre bay
    shapes.push(
      { d: rr(CX - 18, y + h / 2 - 4, 36, 8, 1), fill: '$primary', silhouette: false },
      { d: rr(CX - 14, y + h / 2 - 1.5, 28, 3, 1), fill: '$accent', silhouette: false },
    );
    return shapes;
  },
};

const directoryPlacard: PropTemplate = {
  id: 'directory-placard',
  label: 'Building directory',
  gridFootprint: { w: 1, h: 1 },
  projection: 'plan',
  placement: 'wall-slot',
  params: [{ key: 'lines', label: 'Listing lines', min: 3, max: 7, step: 1, default: 5 }],
  build(params) {
    const w = 36;
    const x = CX - w / 2;
    const y = 50;
    const h = 40;
    const shapes: ShapeSpec[] = [
      { d: rr(x - 2, y - 2, w + 4, h + 4, 2), fill: '$primary' },
      { d: rr(x, y, w, h, 1), fill: '$secondary', silhouette: false },
      // header band
      { d: rr(x + 2, y + 2, w - 4, 6, 1), fill: '$accent', silhouette: false },
    ];
    const lines = params.lines ?? 5;
    for (let i = 0; i < lines; i++) {
      const ly = y + 12 + i * ((h - 14) / lines);
      // floor number tick + listing line
      shapes.push(
        { d: rr(x + 3, ly, 5, 2.5, 0.5), fill: '$accent', silhouette: false },
        { d: rr(x + 11, ly, w - 16 - (i % 2) * 5, 2.5, 0.5), fill: '#00000044', silhouette: false },
      );
    }
    return shapes;
  },
};

const fireExtinguisher: PropTemplate = {
  id: 'fire-extinguisher',
  label: 'Extinguisher cabinet',
  gridFootprint: { w: 1, h: 1 },
  projection: 'plan',
  placement: 'wall-slot',
  params: [{ key: 'size', label: 'Cabinet size', min: 16, max: 26, step: 2, default: 20 }],
  build(params) {
    const s = params.size ?? 20;
    const x = CX - s / 2;
    const y = 56;
    return [
      // recessed wall cabinet (accent defaults to signage red)
      { d: rr(x - 2, y - 2, s + 4, s * 1.3 + 4, 2), fill: '$accent' },
      // glass front
      { d: rr(x, y, s, s * 1.3, 1), fill: '$secondary', opacity: 0.55, silhouette: false },
      // extinguisher silhouette behind the glass
      { d: rr(CX - 3, y + 4, 6, s * 1.3 - 8, 2), fill: '$primary', silhouette: false },
      { d: rr(CX - 1.5, y + 1, 3, 4, 1), fill: '$primary', silhouette: false },
    ];
  },
};

export const PROP_TEMPLATES: PropTemplate[] = [
  waterCooler,
  printer,
  desk,
  coffeeMachine,
  printerJammed,
  coffeeMachineBroken,
  waterCoolerEmpty,
  officePlant,
  pottedTree,
  hangingPlant,
  deskSucculent,
  floorLamp,
  deskLamp,
  bookshelf,
  framedArt,
  poster,
  wallClock,
  fridge,
  conferenceTable,
  receptionDesk,
  badgeReader,
  door,
  window,
  nameplate,
  hvacVent,
  deskClutter,
  couch,
  rug,
  vendingMachine,
  officeChair,
  cubicleWorkstation,
  whiteboard,
  filingCabinet,
  supplyCabinet,
  mailStation,
  trashBin,
  waterStation,
  coatRack,
  bulletinBoard,
  wallCalendar,
  waterFountain,
  kitchenetteCounter,
  loungeSeating,
  breakTable,
  elevatorBank,
  exitSign,
  neighborGlass,
  directoryPlacard,
  fireExtinguisher,
];
