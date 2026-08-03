import type { PropTemplate, ShapeSpec } from '../core/types';
import { rr, circle, ellipse } from '../core/geometry';
import { mulberry32 } from '../core/random';
import { FLOWER_HUES } from '../tiles/templates';
import { authoredPropShapes } from './authoredArt';
import { DEPARTMENT_MACHINE_TEMPLATES } from './departmentMachineTemplates';

/**
 * Parametric prop templates. Conventions:
 * - Canvas coords (128 design units), props rest on the ground line y = 116.
 * - Fills use '$primary' / '$secondary' / '$accent' tokens from the prop's palette.
 * - Procedural props use the global outline pass. Authored SVG props preserve
 *   canonical source strokes and opt out of global prop styling by default.
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
    return authoredPropShapes('water-cooler', params);
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
    return authoredPropShapes('printer', params);
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
    return authoredPropShapes('desk', params);
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
    return authoredPropShapes('coffee-machine', params);
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
    return authoredPropShapes('printer-jammed', params);
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
    return authoredPropShapes('coffee-machine-broken', params);
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
    return authoredPropShapes('water-cooler-empty', params);
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
    return authoredPropShapes('office-plant', params);
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
    return authoredPropShapes('potted-tree', params);
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
    return authoredPropShapes('hanging-plant', params);
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
    return authoredPropShapes('floor-lamp', params);
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
    return authoredPropShapes('desk-lamp', params);
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
    return authoredPropShapes('bookshelf', params);
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
    return authoredPropShapes('framed-art', params);
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
    return authoredPropShapes('poster', params);
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
    return authoredPropShapes('wall-clock', params);
  },
};

// --- Desk dressing + abstracted restroom (P0) ---------------------------------
// personal-desk-items is the top-down scatter overlay (the cheap anti-monotony
// lever): a `variant` param yields distinct arrangements, so repeated desks read
// as individually owned. The restroom fixtures are deliberately abstracted —
// suggestive, not literal plumbing — enough to read a room as a bathroom.

const personalDeskItems: PropTemplate = {
  id: 'personal-desk-items',
  label: 'Personal desk items',
  projection: 'plan',
  gridFootprint: { w: 1, h: 1 },
  params: [
    { key: 'variant', label: 'Arrangement', min: 0, max: 3, step: 1, default: 0 },
    { key: 'items', label: 'Item count', min: 2, max: 4, step: 1, default: 3 },
  ],
  build(params) {
    const v = params.variant ?? 0;
    const n = params.items ?? 3;
    const sticky = ['#F6D34B', '#F29DB0', '#9AD6A0', '#8FC7E8'];
    const toy = ['#D85A30', '#5B8DB8', '#97C459', '#B968A6'];
    const jx = (i: number) => ((v * 13 + i * 29) % 9) - 4;
    const jy = (i: number) => ((v * 17 + i * 23) % 9) - 4;
    const shapes: ShapeSpec[] = [];
    // framed photo (seen from above)
    if (n >= 1) {
      const px = 44 + jx(0), py = 48 + jy(0);
      shapes.push(
        { d: rr(px, py, 20, 15, 2), fill: '$secondary' },
        { d: rr(px + 2, py + 2, 16, 11, 1), fill: '#EDE7D6', silhouette: false },
        { d: circle(px + 10, py + 7, 3.2), fill: '$accent', silhouette: false },
      );
    }
    // coffee mug (top-down: handle behind, ring, coffee)
    if (n >= 2) {
      const mx = 84 + jx(1), my = 62 + jy(1);
      shapes.push(
        { d: `M ${mx + 6} ${my - 2} q 6 2 0 6`, stroke: '$primary', strokeWidth: 3, silhouette: false },
        { d: circle(mx, my, 7.5), fill: '$primary' },
        { d: circle(mx, my, 5), fill: '#6E4A2A', silhouette: false },
      );
    }
    // sticky note
    if (n >= 3) {
      const sx = 56 + jx(2), sy = 72 + jy(2);
      shapes.push(
        { d: rr(sx, sy, 12, 12, 1), fill: sticky[v % sticky.length], silhouette: false },
        { d: `M ${sx + 2} ${sy + 4} L ${sx + 10} ${sy + 4} M ${sx + 2} ${sy + 7} L ${sx + 8} ${sy + 7}`, stroke: '#00000030', strokeWidth: 0.8, silhouette: false },
      );
    }
    // a figurine or a tiny plant (alternates by variant)
    if (n >= 4) {
      const tx = 80 + jx(3), ty = 42 + jy(3);
      if (v % 2 === 0) {
        shapes.push({ d: circle(tx, ty, 4.5), fill: toy[v % toy.length] }, { d: circle(tx, ty - 3, 3), fill: toy[(v + 2) % toy.length], silhouette: false });
      } else {
        shapes.push({ d: rr(tx - 3.5, ty, 7, 5, 1), fill: '#B07A4B' }, { d: circle(tx, ty - 2, 4), fill: '#5C8A3A', silhouette: false });
      }
    }
    return shapes;
  },
};

const restroomSink: PropTemplate = {
  id: 'restroom-sink',
  label: 'Restroom sinks',
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 30, ry: 4.5 },
  gridFootprint: { w: 2, h: 1 },
  params: [{ key: 'basins', label: 'Basins', min: 1, max: 3, step: 1, default: 2 }],
  build(params) {
    const basins = params.basins ?? 2;
    const w = 96;
    const x = CX - w / 2;
    const counterTop = GROUND - 34;
    const shapes: ShapeSpec[] = [
      // mirror band
      { d: rr(x + 4, counterTop - 30, w - 8, 22, 2), fill: '$secondary' },
      { d: rr(x + 6, counterTop - 28, w - 12, 18, 1), fill: '#CFE0E6', opacity: 0.7, silhouette: false },
      { d: `M ${x + 12} ${counterTop - 26} L ${x + 22} ${counterTop - 26}`, stroke: '#FFFFFF80', strokeWidth: 2, silhouette: false },
      // vanity counter + apron
      { d: rr(x, counterTop, w, 14, 3), fill: '$primary' },
      { d: rr(x + 2, GROUND - 20, w - 4, 20, 2), fill: '$primary', silhouette: false },
    ];
    for (let i = 0; i < basins; i++) {
      const bx = x + ((i + 0.5) * w) / basins;
      const br = (w / basins) * 0.3;
      shapes.push(
        { d: ellipse(bx, counterTop + 6, br, 4.5), fill: '#E8EEF0', silhouette: false },
        { d: ellipse(bx, counterTop + 6, br * 0.7, 3), fill: '#00000022', silhouette: false },
        { d: rr(bx - 1.5, counterTop - 4, 3, 6, 1), fill: '$accent', silhouette: false },
        { d: `M ${bx} ${counterTop - 4} q 0 -4 4 -4`, stroke: '$accent', strokeWidth: 2, silhouette: false },
      );
    }
    return shapes;
  },
};

const restroomStall: PropTemplate = {
  id: 'restroom-stall',
  label: 'Restroom stall',
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 26, ry: 4 },
  gridFootprint: { w: 1, h: 1 },
  params: [
    { key: 'height', label: 'Panel height', min: 62, max: 82, step: 2, default: 72 },
    { key: 'occupied', label: 'Occupied', min: 0, max: 1, step: 1, default: 0 },
  ],
  build(params) {
    const h = params.height ?? 72;
    const w = 48;
    const x = CX - w / 2;
    const top = GROUND - h;
    const gap = 12; // floor gap under the partitions
    const panelBot = GROUND - gap;
    const light = (params.occupied ?? 0) >= 1 ? '#D8362F' : '#97C459';
    return [
      // side partitions
      { d: rr(x - 3, top, 6, panelBot - top, 1), fill: '$primary' },
      { d: rr(x + w - 3, top, 6, panelBot - top, 1), fill: '$primary' },
      // stall door + inset
      { d: rr(x + 3, top, w - 6, panelBot - top, 1), fill: '$secondary' },
      { d: rr(x + 6, top + 4, w - 12, panelBot - top - 8, 1), fill: '#00000012', silhouette: false },
      // vacant/occupied latch indicator
      { d: rr(x + w - 13, top + (panelBot - top) / 2 - 3, 7, 6, 1), fill: light, silhouette: false },
      // partition legs (the feet gap)
      { d: rr(x - 2, panelBot, 4, gap, 1), fill: '$primary', silhouette: false },
      { d: rr(x + w - 2, panelBot, 4, gap, 1), fill: '$primary', silhouette: false },
    ];
  },
};

// --- P1: AV + open storage (functional believability holes) --------------------

const wallScreen: PropTemplate = {
  id: 'wall-screen',
  label: 'Wall screen',
  projection: 'plan',
  placement: 'wall-slot',
  gridFootprint: { w: 2, h: 1 },
  params: [
    { key: 'width', label: 'Width', min: 44, max: 68, step: 4, default: 56 },
    { key: 'content', label: 'On-screen', min: 0, max: 2, step: 1, default: 1 },
  ],
  build(params) {
    const w = params.width ?? 56;
    const h = Math.round(w * 0.58);
    const x = CX - w / 2;
    const y = 64 - h / 2;
    const content = params.content ?? 1;
    const shapes: ShapeSpec[] = [
      // bezel + screen
      { d: rr(x - 2, y - 2, w + 4, h + 4, 2), fill: '$primary' },
      { d: rr(x, y, w, h, 1), fill: '$secondary', silhouette: false },
    ];
    if (content === 1) {
      // a title slide
      shapes.push(
        { d: rr(x + 5, y + 5, w * 0.5, 4, 1), fill: '#F2EDE0', opacity: 0.85, silhouette: false },
        { d: rr(x + 5, y + 14, w - 12, 2.5, 1), fill: '#FFFFFF66', silhouette: false },
        { d: rr(x + 5, y + 20, w - 20, 2.5, 1), fill: '#FFFFFF66', silhouette: false },
        { d: rr(x + 5, y + 26, w - 16, 2.5, 1), fill: '#FFFFFF66', silhouette: false },
      );
    } else if (content === 2) {
      // a bar chart
      for (let i = 0; i < 4; i++) {
        const bh = 6 + ((i * 7) % 12);
        shapes.push({ d: rr(x + 6 + i * ((w - 12) / 4), y + h - 6 - bh, (w - 16) / 4 - 2, bh, 1), fill: i % 2 ? '$accent' : '#F2EDE0', opacity: 0.85, silhouette: false });
      }
    }
    // power LED
    shapes.push({ d: circle(x + w - 3, y + h + 2, 1.4), fill: '$accent', silhouette: false });
    return shapes;
  },
};

const lockers: PropTemplate = {
  id: 'lockers',
  label: 'Lockers',
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 27, ry: 4.5 },
  gridFootprint: { w: 1, h: 1 },
  params: [
    { key: 'columns', label: 'Doors', min: 2, max: 4, step: 1, default: 3 },
    { key: 'height', label: 'Height', min: 72, max: 92, step: 2, default: 84 },
  ],
  build(params) {
    return authoredPropShapes('lockers', params);
  },
};

const openShelving: PropTemplate = {
  id: 'open-shelving',
  label: 'Open shelving',
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 26, ry: 4.5 },
  gridFootprint: { w: 1, h: 1 },
  params: [
    { key: 'shelves', label: 'Shelves', min: 3, max: 5, step: 1, default: 4 },
    { key: 'fill', label: 'Stocked', min: 1, max: 3, step: 1, default: 3 },
  ],
  build(params) {
    return authoredPropShapes('open-shelving', params);
  },
};

// --- P1: service + IT equipment ------------------------------------------------

const copier: PropTemplate = {
  id: 'copier',
  label: 'Copier',
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 24, ry: 4.5 },
  gridFootprint: { w: 1, h: 1 },
  params: [{ key: 'height', label: 'Height', min: 60, max: 78, step: 2, default: 70 }],
  build(params) {
    return authoredPropShapes('copier', params);
  },
};

const shredder: PropTemplate = {
  id: 'shredder',
  label: 'Paper shredder',
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 17, ry: 4 },
  gridFootprint: { w: 1, h: 1 },
  params: [{ key: 'height', label: 'Bin height', min: 34, max: 50, step: 2, default: 42 }],
  build(params) {
    return authoredPropShapes('shredder', params);
  },
};

const serverRack: PropTemplate = {
  id: 'server-rack',
  label: 'Server rack',
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 21, ry: 4.5 },
  gridFootprint: { w: 1, h: 1 },
  params: [
    { key: 'height', label: 'Height', min: 72, max: 94, step: 2, default: 86 },
    { key: 'units', label: 'Units', min: 3, max: 6, step: 1, default: 5 },
  ],
  build(params) {
    return authoredPropShapes('server-rack', params);
  },
};

// --- IRIS installation unit ------------------------------------------------
// The physical seat of IRIS: one weighted institutional machine with a centered
// operator console, installed once per office (the founding tutorial IS this
// unit booting). Twin pattern like the tampered variants, but in reverse: the
// sim places the DORMANT unit on the bare lot and swaps to the live template as
// the boot sequence completes. The live optic and subordinate console trace use
// literal IRIS green so they survive both the clinical drain and runtime re-tint.

const irisInstallationUnit: PropTemplate = {
  id: 'iris-installation-unit',
  label: 'IRIS installation unit',
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 46, ry: 5 },
  gridFootprint: { w: 2, h: 1 },
  params: [{ key: 'height', label: 'Rack height', min: 78, max: 98, step: 2, default: 90 }],
  build(params) {
    return authoredPropShapes('iris-installation-unit', params);
  },
};

const irisInstallationUnitDormant: PropTemplate = {
  id: 'iris-installation-unit-dormant',
  label: 'IRIS installation unit (dormant)',
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 46, ry: 5 },
  gridFootprint: { w: 2, h: 1 },
  params: [{ key: 'height', label: 'Rack height', min: 78, max: 98, step: 2, default: 90 }],
  build(params) {
    return authoredPropShapes('iris-installation-unit-dormant', params);
  },
};

// IRIS fabrication-unit charging dock: a floor bay the idle robot crew return to
// and power down in when there's nothing to build. A plan-projection pad (renders
// UNDER the standing unit, so it reads as "docked on the pad"), sterile chassis
// with a subdued IRIS-green charge ring and physical capture lugs (literal #5BE08A,
// matching the installation unit + the units' own optic). Seeded by the sim near the IRIS unit,
// never player-placed (non-placeable).
const irisChargingDock: PropTemplate = {
  id: 'iris-charging-dock',
  label: 'IRIS charging dock',
  projection: 'plan',
  gridFootprint: { w: 1, h: 1 },
  params: [],
  build() {
    return authoredPropShapes('iris-charging-dock', {});
  },
};

// --- P1: workstations + lounge seating -----------------------------------------

const standingDesk: PropTemplate = {
  id: 'standing-desk',
  label: 'Standing desk',
  projection: 'plan',
  gridFootprint: { w: 2, h: 1 },
  params: [
    { key: 'width', label: 'Width', min: 84, max: 116, step: 4, default: 100 },
    { key: 'dual', label: 'Dual monitor', min: 0, max: 1, step: 1, default: 0 },
  ],
  build(params) {
    return authoredPropShapes('standing-desk', params);
  },
};

const waitingBench: PropTemplate = {
  id: 'waiting-bench',
  label: 'Waiting bench',
  projection: 'plan',
  gridFootprint: { w: 2, h: 1 },
  params: [
    { key: 'length', label: 'Length', min: 76, max: 112, step: 4, default: 96 },
    { key: 'seats', label: 'Cushions', min: 2, max: 4, step: 1, default: 3 },
  ],
  build(params) {
    return authoredPropShapes('waiting-bench', params);
  },
};

const coffeeTable: PropTemplate = {
  id: 'coffee-table',
  label: 'Coffee table',
  projection: 'plan',
  gridFootprint: { w: 1, h: 1 },
  params: [
    { key: 'width', label: 'Width', min: 48, max: 76, step: 4, default: 62 },
    { key: 'decor', label: 'Décor', min: 0, max: 2, step: 1, default: 2 },
  ],
  build(params) {
    return authoredPropShapes('coffee-table', params);
  },
};

// --- P1: focus / collaboration / kitchen ---------------------------------------

const phoneBooth: PropTemplate = {
  id: 'phone-booth',
  label: 'Phone booth',
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 24, ry: 4.5 },
  gridFootprint: { w: 1, h: 1 },
  params: [
    { key: 'height', label: 'Height', min: 82, max: 98, step: 2, default: 90 },
    { key: 'occupied', label: 'Occupied', min: 0, max: 1, step: 1, default: 0 },
  ],
  build(params) {
    const h = params.height ?? 90;
    const w = 46;
    const x = CX - w / 2;
    const top = GROUND - h;
    const occ = (params.occupied ?? 0) >= 1;
    const shapes: ShapeSpec[] = [
      // pod shell + roof cap
      { d: rr(x, top, w, h, 6), fill: '$primary' },
      { d: rr(x - 2, top - 3, w + 4, 8, 4), fill: '$primary' },
      // frosted glass door
      { d: rr(x + 5, top + 8, w - 10, h - 14, 4), fill: '$secondary', opacity: 0.85, silhouette: false },
      { d: rr(x + 8, top + 11, w - 16, h - 20, 3), fill: '#CFE0E6', opacity: 0.5, silhouette: false },
    ];
    if (occ) {
      // seated occupant silhouette behind the glass
      shapes.push(
        { d: circle(CX, top + 34, 8), fill: '#2C2C2A', opacity: 0.55, silhouette: false },
        { d: rr(CX - 10, top + 42, 20, 24, 6), fill: '#2C2C2A', opacity: 0.55, silhouette: false },
      );
    } else {
      shapes.push({ d: rr(CX - 12, GROUND - 30, 24, 5, 2), fill: '#00000026', silhouette: false });
    }
    shapes.push(
      // handle + vacancy light + glass glint
      { d: rr(x + w - 11, top + h / 2 - 6, 3, 12, 1.5), fill: '$accent', silhouette: false },
      { d: circle(x + w - 8, top + 6, 2), fill: occ ? '#D8362F' : '#97C459', silhouette: false },
      { d: `M ${x + 11} ${top + 14} L ${x + 18} ${top + 14}`, stroke: '#FFFFFF66', strokeWidth: 2, silhouette: false },
    );
    return shapes;
  },
};

const kanbanBoard: PropTemplate = {
  id: 'kanban-board',
  label: 'Kanban board',
  projection: 'plan',
  placement: 'wall-slot',
  gridFootprint: { w: 1, h: 1 },
  params: [{ key: 'notes', label: 'Cards', min: 3, max: 9, step: 1, default: 6 }],
  build(params) {
    const w = 52;
    const h = 40;
    const x = CX - w / 2;
    const y = 64 - h / 2;
    const shapes: ShapeSpec[] = [
      { d: rr(x - 2, y - 2, w + 4, h + 4, 2), fill: '$primary' },
      { d: rr(x, y, w, h, 1), fill: '$secondary', silhouette: false },
    ];
    const cols = 3;
    const colW = w / cols;
    for (let c = 0; c < cols; c++) {
      shapes.push({ d: rr(x + c * colW + 2, y + 2, colW - 4, 3, 1), fill: '$accent', silhouette: false });
      if (c > 0) shapes.push({ d: `M ${x + c * colW} ${y + 1} L ${x + c * colW} ${y + h - 1}`, stroke: '#00000022', strokeWidth: 1, silhouette: false });
    }
    const cardColors = ['#F6D34B', '#F29DB0', '#9AD6A0', '#8FC7E8'];
    const notes = params.notes ?? 6;
    for (let i = 0; i < notes; i++) {
      const c = i % cols;
      const row = Math.floor(i / cols);
      const cy0 = y + 8 + row * 9;
      if (cy0 + 7 > y + h) continue;
      shapes.push({ d: rr(x + c * colW + 3, cy0, colW - 6, 7, 1), fill: cardColors[(i * 3) % cardColors.length], silhouette: false });
    }
    return shapes;
  },
};

const microwave: PropTemplate = {
  id: 'microwave',
  label: 'Microwave',
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 22, ry: 4 },
  gridFootprint: { w: 1, h: 1 },
  params: [{ key: 'width', label: 'Width', min: 38, max: 52, step: 2, default: 44 }],
  build(params) {
    return authoredPropShapes('microwave', params);
  },
};

const pantryShelf: PropTemplate = {
  id: 'pantry-shelf',
  label: 'Pantry shelf',
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 25, ry: 4.5 },
  gridFootprint: { w: 1, h: 1 },
  params: [{ key: 'shelves', label: 'Shelves', min: 2, max: 4, step: 1, default: 3 }],
  build(params) {
    return authoredPropShapes('pantry-shelf', params);
  },
};

// --- P1: game room / recreation (the warm "before" feels fun) -------------------

const pingPongTable: PropTemplate = {
  id: 'ping-pong-table',
  label: 'Ping-pong table',
  projection: 'plan',
  gridFootprint: { w: 3, h: 2 },
  params: [{ key: 'width', label: 'Width', min: 96, max: 118, step: 4, default: 110 }],
  build(params) {
    const w = params.width ?? 110;
    const depth = 62;
    const x = CX - w / 2;
    const y = CX - depth / 2;
    return [
      // table top
      { d: rr(x, y, w, depth, 4), fill: '$primary' },
      // regulation boundary + centre lines
      { d: rr(x + 4, y + 4, w - 8, depth - 8, 2), stroke: '#F2EDE0', strokeWidth: 1.5, silhouette: false },
      { d: `M ${x + 4} ${CX} L ${x + w - 4} ${CX}`, stroke: '#F2EDE0', strokeWidth: 1, silhouette: false },
      // net across the middle + posts
      { d: rr(CX - 1.5, y - 3, 3, depth + 6, 1), fill: '$secondary', silhouette: false },
      { d: `M ${CX} ${y - 3} L ${CX} ${y + depth + 3}`, stroke: '#FFFFFF66', strokeWidth: 3, silhouette: false },
      { d: circle(CX, y - 3, 2), fill: '$secondary', silhouette: false },
      { d: circle(CX, y + depth + 3, 2), fill: '$secondary', silhouette: false },
      // paddles at opposite ends + a ball mid-rally
      { d: ellipse(x + 12, y + 16, 5, 7), fill: '$accent', silhouette: false },
      { d: rr(x + 9, y + 22, 6, 8, 2), fill: '#6E4A2A', silhouette: false },
      { d: ellipse(x + w - 12, y + depth - 16, 5, 7), fill: '$accent', silhouette: false },
      { d: rr(x + w - 15, y + depth - 30, 6, 8, 2), fill: '#6E4A2A', silhouette: false },
      { d: circle(CX + 20, y + 18, 2.2), fill: '#F2EDE0', silhouette: false },
    ];
  },
};

const foosballTable: PropTemplate = {
  id: 'foosball-table',
  label: 'Foosball table',
  projection: 'plan',
  gridFootprint: { w: 2, h: 1 },
  params: [{ key: 'rods', label: 'Player rods', min: 4, max: 8, step: 2, default: 6 }],
  build(params) {
    const w = 88;
    const depth = 52;
    const x = CX - w / 2;
    const y = CX - depth / 2;
    const rods = params.rods ?? 6;
    const shapes: ShapeSpec[] = [
      // cabinet + green field
      { d: rr(x, y, w, depth, 5), fill: '$primary' },
      { d: rr(x + 6, y + 5, w - 12, depth - 10, 2), fill: '$secondary', silhouette: false },
      // goals at each end
      { d: rr(x + 6, CX - 8, 3, 16, 1), fill: '#1D1F22', silhouette: false },
      { d: rr(x + w - 9, CX - 8, 3, 16, 1), fill: '#1D1F22', silhouette: false },
      // centre line + ball
      { d: `M ${CX} ${y + 6} L ${CX} ${y + depth - 6}`, stroke: '#FFFFFF44', strokeWidth: 1, silhouette: false },
      { d: circle(CX + 6, CX + 4, 2), fill: '#F2EDE0', silhouette: false },
    ];
    // player rods across the field, handles poking out, two teams of figures
    for (let i = 0; i < rods; i++) {
      const rx = x + 12 + (i * (w - 24)) / (rods - 1);
      const team = i % 2 ? '$accent' : '#D8362F';
      shapes.push(
        { d: `M ${rx} ${y - 3} L ${rx} ${y + depth + 3}`, stroke: '#9AA0A2', strokeWidth: 2, silhouette: false },
        { d: rr(rx - 2.5, y - 6, 5, 5, 1.5), fill: '$accent', silhouette: false },
      );
      for (let p = 0; p < 3; p++) {
        shapes.push({ d: rr(rx - 2.5, y + 12 + p * ((depth - 20) / 2) - 3, 5, 6, 1), fill: team, silhouette: false });
      }
    }
    return shapes;
  },
};

const beanBag: PropTemplate = {
  id: 'bean-bag',
  label: 'Bean bag',
  projection: 'plan',
  gridFootprint: { w: 1, h: 1 },
  params: [{ key: 'size', label: 'Size', min: 34, max: 48, step: 2, default: 42 }],
  build(params) {
    return authoredPropShapes('bean-bag', params);
  },
};

// --- P2: warm flavor / long-tail -----------------------------------------------

const fishTank: PropTemplate = {
  id: 'fish-tank',
  label: 'Fish tank',
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 24, ry: 4.5 },
  gridFootprint: { w: 1, h: 1 },
  params: [{ key: 'fish', label: 'Fish', min: 1, max: 4, step: 1, default: 3 }],
  build(params) {
    return authoredPropShapes('fish-tank', params);
  },
};

const napPod: PropTemplate = {
  id: 'nap-pod',
  label: 'Nap pod',
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 34, ry: 5 },
  gridFootprint: { w: 2, h: 1 },
  params: [{ key: 'visor', label: 'Visor down', min: 0, max: 1, step: 1, default: 1 }],
  build(params) {
    return authoredPropShapes('nap-pod', params);
  },
};

const petBed: PropTemplate = {
  id: 'pet-bed',
  label: 'Pet bed',
  projection: 'plan',
  gridFootprint: { w: 1, h: 1 },
  params: [{ key: 'size', label: 'Size', min: 40, max: 58, step: 2, default: 50 }],
  build(params) {
    const s = params.size ?? 50;
    const rx = s / 2;
    const ry = (s / 2) * 0.82;
    return [
      // bolster rim + inner cushion
      { d: ellipse(CX, CX, rx, ry), fill: '$primary' },
      { d: ellipse(CX, CX, rx - 7, ry - 6), fill: '$secondary', silhouette: false },
      { d: ellipse(CX, CX, rx - 10, ry - 9), fill: '#00000012', silhouette: false },
      // a bunched blanket
      { d: `M ${CX - rx + 12} ${CX + 4} Q ${CX - 4} ${CX + ry - 8} ${CX + 8} ${CX + 6} Q ${CX - 2} ${CX + 2} ${CX - rx + 12} ${CX + 4} Z`, fill: '$accent', opacity: 0.85, silhouette: false },
      // a chew-toy bone
      { d: rr(CX + rx - 20, CX - ry + 8, 10, 3, 1.5), fill: '#F2EDE0', silhouette: false },
      { d: circle(CX + rx - 20, CX - ry + 9.5, 2, ), fill: '#F2EDE0', silhouette: false },
      { d: circle(CX + rx - 10, CX - ry + 9.5, 2), fill: '#F2EDE0', silhouette: false },
    ];
  },
};

// --- P2: ambiance / lounge / sorting -------------------------------------------

const stringLights: PropTemplate = {
  id: 'string-lights',
  label: 'String lights',
  projection: 'plan',
  placement: 'wall-slot',
  gridFootprint: { w: 1, h: 1 },
  params: [{ key: 'bulbs', label: 'Bulbs', min: 4, max: 8, step: 1, default: 6 }],
  build(params) {
    return authoredPropShapes('string-lights', params);
  },
};

const barCart: PropTemplate = {
  id: 'bar-cart',
  label: 'Bar cart',
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 24, ry: 4.5 },
  gridFootprint: { w: 1, h: 1 },
  params: [{ key: 'bottles', label: 'Bottles', min: 2, max: 5, step: 1, default: 4 }],
  build(params) {
    const w = 48;
    const x = CX - w / 2;
    const topY = GROUND - 54;
    const midY = GROUND - 26;
    const shapes: ShapeSpec[] = [
      // frame posts + shelves + wheels + handle
      { d: rr(x + 2, topY, 3, GROUND - topY - 4, 1.5), fill: '$primary' },
      { d: rr(x + w - 5, topY, 3, GROUND - topY - 4, 1.5), fill: '$primary' },
      { d: rr(x, topY, w, 4, 1), fill: '$secondary' },
      { d: rr(x, midY, w, 4, 1), fill: '$secondary' },
      { d: circle(x + 5, GROUND - 3, 3), fill: '#2C2C2A', silhouette: false },
      { d: circle(x + w - 5, GROUND - 3, 3), fill: '#2C2C2A', silhouette: false },
      { d: `M ${x + w - 3} ${topY + 2} q 7 0 7 8`, stroke: '$primary', strokeWidth: 2, silhouette: false },
    ];
    // bottles on the top shelf
    const bottleColors = ['#3B7D3A', '#8A3A2E', '#C9A24B', '#5A7A9A', '#E8E4D8'];
    const bottles = params.bottles ?? 4;
    for (let i = 0; i < bottles; i++) {
      const bx = x + 7 + i * ((w - 14) / bottles);
      const bh = 14 + ((i * 5) % 6);
      shapes.push(
        { d: rr(bx, topY - bh, 5, bh, 1.5), fill: bottleColors[i % bottleColors.length], silhouette: false },
        { d: rr(bx + 1.5, topY - bh - 3, 2, 4, 0.5), fill: bottleColors[i % bottleColors.length], silhouette: false },
      );
    }
    // glasses + ice bucket on the mid shelf
    shapes.push(
      { d: rr(x + 8, midY - 8, 4, 8, 1), fill: '#CFE0E6', opacity: 0.8, silhouette: false },
      { d: rr(x + 14, midY - 8, 4, 8, 1), fill: '#CFE0E6', opacity: 0.8, silhouette: false },
      { d: rr(x + w - 20, midY - 11, 13, 11, 2), fill: '$accent', silhouette: false },
      { d: ellipse(x + w - 13.5, midY - 11, 6.5, 2), fill: '#CFEAF6', silhouette: false },
    );
    return shapes;
  },
};

const recyclingBins: PropTemplate = {
  id: 'recycling-bins',
  label: 'Recycling bins',
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 27, ry: 4.5 },
  gridFootprint: { w: 1, h: 1 },
  params: [{ key: 'bins', label: 'Bins', min: 2, max: 3, step: 1, default: 3 }],
  build(params) {
    const bins = params.bins ?? 3;
    const h = 40;
    const top = GROUND - h;
    const gap = 3;
    const totalW = 54;
    const bw = (totalW - gap * (bins - 1)) / bins;
    const x0 = CX - totalW / 2;
    const bodyTokens = ['$primary', '$secondary', '$accent'];
    const shapes: ShapeSpec[] = [];
    for (let i = 0; i < bins; i++) {
      const bx = x0 + i * (bw + gap);
      shapes.push(
        // tapered body (colour-coded via the palette trio) + lid + slot + sort mark
        { d: `M ${bx} ${top + 4} L ${bx + bw} ${top + 4} L ${bx + bw - 1.5} ${GROUND} L ${bx + 1.5} ${GROUND} Z`, fill: bodyTokens[i % 3] },
        { d: rr(bx - 1, top, bw + 2, 5, 1.5), fill: '#3A3A38', silhouette: false },
        { d: rr(bx + bw / 2 - 4, top + 1.5, 8, 2, 1), fill: '#1A1A18', silhouette: false },
        { d: circle(bx + bw / 2, top + 18, 4), stroke: '#F2EDE0', strokeWidth: 1.4, silhouette: false },
      );
    }
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
    return authoredPropShapes('fridge', params);
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
    return authoredPropShapes('conference-table', params);
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
    return authoredPropShapes('reception-desk', params);
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
    return authoredPropShapes('desk-clutter', params);
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
    return authoredPropShapes('couch', params);
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
    return authoredPropShapes('rug', params);
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
    return authoredPropShapes('vending-machine', params);
  },
};

const officeChair: PropTemplate = {
  id: 'office-chair',
  label: 'Office chair',
  gridFootprint: { w: 1, h: 1 },
  projection: 'plan',
  params: [{ key: 'size', label: 'Seat size', min: 10, max: 16, step: 1, default: 13 }],
  build(params) {
    return authoredPropShapes('office-chair', params);
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
    return authoredPropShapes('cubicle-workstation', params);
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
  params: [{ key: 'drawers', label: 'Drawers', min: 2, max: 4, step: 1, default: 4 }],
  build(params) {
    return authoredPropShapes('filing-cabinet', params);
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
    return authoredPropShapes('supply-cabinet', params);
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
    return authoredPropShapes('mail-station', params);
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

const coatRack: PropTemplate = {
  id: 'coat-rack',
  label: 'Coat rack',
  gridFootprint: { w: 1, h: 1 },
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 12, ry: 3.5 },
  params: [{ key: 'hooks', label: 'Hooks', min: 2, max: 5, step: 1, default: 4 }],
  build(params) {
    return authoredPropShapes('coat-rack', params);
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
    return authoredPropShapes('lounge-seating', params);
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
    return authoredPropShapes('break-table', params);
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

// ---------------------------------------------------------------------------
// Exterior vehicles + lot decals (B1.5 "the build site"). Plan-projected (seen
// from above), multi-cell footprints, decor-only (added to NON_PLACEABLE_TEMPLATES
// in core/layout.ts — cars are scenery, not a placeable facility). Drawn nose-east
// in the 128 canvas; the sim rotates the plan sprite over its footprint cells.
// Precedent for exterior props: the building-surround ring (core/buildingSurround.ts).
// ---------------------------------------------------------------------------

const car: PropTemplate = {
  id: 'car',
  label: 'Car',
  projection: 'plan',
  // A sedan reads as ~4 cells long × 2 wide from above.
  gridFootprint: { w: 4, h: 2 },
  params: [{ key: 'trim', label: 'Lights', min: 0, max: 1, step: 1, default: 1 }],
  build(params) {
    return authoredPropShapes('car', params);
  },
};

const carSuv: PropTemplate = {
  id: 'car-suv',
  label: 'SUV',
  projection: 'plan',
  gridFootprint: { w: 4, h: 2 },
  params: [{ key: 'rails', label: 'Roof rails', min: 0, max: 1, step: 1, default: 1 }],
  build(params) {
    const shapes: ShapeSpec[] = [
      // boxier, taller body than the sedan
      { d: rr(8, 38, 112, 52, 14), fill: '$primary' },
      // large greenhouse / roof
      { d: rr(30, 44, 74, 40, 8), fill: '$secondary', silhouette: false },
      // windshield + rear glass bands
      { d: rr(34, 46, 66, 8, 2), fill: '$accent', silhouette: false },
      { d: rr(34, 70, 66, 8, 2), fill: '$accent', silhouette: false },
      // roof seam
      { d: `M 30 64 L 104 64`, stroke: '#00000018', strokeWidth: 1.5, silhouette: false },
      // mirrors
      { d: rr(90, 36, 6, 3, 1), fill: '$primary', silhouette: false },
      { d: rr(90, 89, 6, 3, 1), fill: '$primary', silhouette: false },
    ];
    if ((params.rails ?? 1) >= 1) {
      shapes.push(
        { d: rr(32, 41, 70, 2.5, 1), fill: '$accent', silhouette: false },
        { d: rr(32, 84.5, 70, 2.5, 1), fill: '$accent', silhouette: false },
      );
    }
    shapes.push(
      { d: rr(116, 44, 4, 8, 1.5), fill: '#F7F1D8', silhouette: false },
      { d: rr(116, 76, 4, 8, 1.5), fill: '#F7F1D8', silhouette: false },
      { d: rr(8, 44, 4, 8, 1.5), fill: '#C0392B', silhouette: false },
      { d: rr(8, 76, 4, 8, 1.5), fill: '#C0392B', silhouette: false },
    );
    return shapes;
  },
};

const parkingLine: PropTemplate = {
  id: 'parking-line',
  label: 'Parking line',
  projection: 'plan',
  // one painted bay (~2 cells wide × 2 deep); mostly transparent decal on asphalt.
  gridFootprint: { w: 2, h: 2 },
  params: [{ key: 'stop', label: 'Stop bar', min: 0, max: 1, step: 1, default: 1 }],
  build(params) {
    const shapes: ShapeSpec[] = [
      // the two stall divider lines running the depth of the bay
      { d: rr(24, 20, 4, 88, 1), fill: '$primary', silhouette: false },
      { d: rr(100, 20, 4, 88, 1), fill: '$primary', silhouette: false },
    ];
    // head / wheel-stop bar across the top of the bay
    if ((params.stop ?? 1) >= 1) shapes.push({ d: rr(24, 20, 80, 4, 1), fill: '$primary', silhouette: false });
    return shapes;
  },
};

// ---------------------------------------------------------------------------
// Corporate-campus parking kit (CE-21). Lot markings are flat painted terrain
// decals (never silhouette-bearing); fixtures and vehicles remain ordinary
// static props. Cars keep their body shell on $primary for per-instance tinting.
// ---------------------------------------------------------------------------

const lotMarkingAccessible: PropTemplate = {
  id: 'lot-marking-accessible',
  label: 'Accessible-stall marking',
  projection: 'plan',
  gridFootprint: { w: 2, h: 2 },
  params: [],
  build() {
    return [
      { d: circle(62, 32, 8), fill: '$primary', opacity: 0.86, silhouette: false },
      {
        d: 'M 60 43 L 56 68 L 75 68 L 87 91',
        stroke: '$primary',
        strokeWidth: 7,
        opacity: 0.86,
        silhouette: false,
      },
      {
        d: 'M 58 51 L 78 51',
        stroke: '$primary',
        strokeWidth: 6,
        opacity: 0.86,
        silhouette: false,
      },
      {
        d: 'M 54 61 C 38 65 34 81 43 92 C 52 104 72 101 78 88',
        stroke: '$primary',
        strokeWidth: 6,
        opacity: 0.86,
        silhouette: false,
      },
    ];
  },
};

const lotMarkingArrow: PropTemplate = {
  id: 'lot-marking-arrow',
  label: 'Lane arrow marking',
  projection: 'plan',
  gridFootprint: { w: 2, h: 1 },
  params: [],
  build() {
    return [{
      d: 'M 18 56 L 77 56 L 77 38 L 112 64 L 77 90 L 77 72 L 18 72 Z',
      fill: '$primary',
      opacity: 0.82,
      silhouette: false,
    }];
  },
};

const lotMarkingReserved: PropTemplate = {
  id: 'lot-marking-reserved',
  label: 'Reserved-stall marking',
  projection: 'plan',
  gridFootprint: { w: 2, h: 1 },
  params: [],
  build() {
    // Stencil-weight abstract glyph rhythm: readable as official lettering at
    // campus zoom without baking prose the game would need to localize.
    const shapes: ShapeSpec[] = [];
    const glyphs = [
      [10, 32, 10, 64], [20, 32, 9, 10], [20, 56, 9, 9],
      [34, 32, 9, 64], [43, 32, 10, 9], [43, 59, 10, 9], [43, 87, 10, 9],
      [58, 32, 9, 64], [67, 32, 9, 9], [67, 59, 9, 9],
      [81, 32, 9, 64], [90, 32, 10, 9], [90, 87, 10, 9],
      [105, 32, 9, 64],
    ];
    for (const [x, y, w, h] of glyphs) {
      shapes.push({ d: rr(x, y, w, h, 1), fill: '$primary', opacity: 0.78, silhouette: false });
    }
    return shapes;
  },
};

const lotMarkingCrosswalk: PropTemplate = {
  id: 'lot-marking-crosswalk',
  label: 'Crosswalk marking',
  projection: 'plan',
  gridFootprint: { w: 2, h: 2 },
  params: [],
  build() {
    return authoredPropShapes('lot-marking-crosswalk', {});
  },
};

/** Stable decal family id list for catalog/tests and sim prefix parity. */
export const LOT_MARKING_TEMPLATE_IDS = [
  'lot-marking-accessible',
  'lot-marking-arrow',
  'lot-marking-reserved',
  'lot-marking-crosswalk',
] as const;

const lampPost: PropTemplate = {
  id: 'lamp-post',
  label: 'Parking-lot lamp post',
  projection: 'elevation',
  gridFootprint: { w: 1, h: 1 },
  footprint: { cx: CX, cy: 117, rx: 13, ry: 3.5 },
  params: [],
  build() {
    return authoredPropShapes('lamp-post', {});
  },
};

const signLot: PropTemplate = {
  id: 'sign-lot',
  label: 'Parking-lot sign',
  projection: 'elevation',
  gridFootprint: { w: 1, h: 1 },
  footprint: { cx: CX, cy: 117, rx: 12, ry: 3.5 },
  params: [{ key: 'variant', label: 'Panel', min: 0, max: 1, step: 1, default: 0 }],
  build(params) {
    return authoredPropShapes('sign-lot', params);
  },
};

const carCompact: PropTemplate = {
  id: 'car-compact',
  label: 'Compact car',
  projection: 'plan',
  gridFootprint: { w: 3, h: 2 },
  params: [{ key: 'spoiler', label: 'Rear lip', min: 0, max: 1, step: 1, default: 0 }],
  build(params) {
    const shapes: ShapeSpec[] = [
      { d: rr(18, 39, 94, 50, 20), fill: '$primary' },
      { d: rr(42, 45, 50, 38, 12), fill: '$secondary', silhouette: false },
      { d: 'M 38 49 L 46 60 L 46 68 L 38 79 Z', fill: '$accent', silhouette: false },
      { d: 'M 96 49 L 89 60 L 89 68 L 96 79 Z', fill: '$accent', silhouette: false },
      { d: rr(51, 47, 32, 7, 2), fill: '$accent', silhouette: false },
      { d: rr(51, 74, 32, 7, 2), fill: '$accent', silhouette: false },
      { d: rr(107, 47, 4, 9, 1), fill: '#F7F1D8', silhouette: false },
      { d: rr(107, 72, 4, 9, 1), fill: '#F7F1D8', silhouette: false },
      { d: rr(19, 48, 4, 8, 1), fill: '#C0392B', silhouette: false },
      { d: rr(19, 72, 4, 8, 1), fill: '#C0392B', silhouette: false },
    ];
    if ((params.spoiler ?? 0) >= 1) {
      shapes.push({ d: rr(17, 43, 4, 42, 2), fill: '$primary', silhouette: false });
    }
    return shapes;
  },
};

const bikeRack: PropTemplate = {
  id: 'bike-rack',
  label: 'Bike rack',
  projection: 'plan',
  gridFootprint: { w: 2, h: 1 },
  params: [],
  build() {
    return authoredPropShapes('bike-rack', {});
  },
};

// ---------------------------------------------------------------------------
// Corporate-campus cafeteria + kitchen kit (CE-22). Static service-line art:
// no steam, motion frames, or wall-slot stacking. Elevation counters sit against
// walls but remain ordinary floor props; plan seating rotates with the room.
// ---------------------------------------------------------------------------

const servingLine: PropTemplate = {
  id: 'serving-line',
  label: 'Serving line',
  projection: 'elevation',
  gridFootprint: { w: 4, h: 1 },
  footprint: { cx: CX, cy: 117, rx: 52, ry: 5 },
  params: [],
  build() {
    return authoredPropShapes('serving-line', {});
  },
};

const serviceScanner: PropTemplate = {
  id: 'service-scanner',
  label: 'Service attendance scanner',
  projection: 'elevation',
  gridFootprint: { w: 1, h: 1 },
  footprint: { cx: CX, cy: 117, rx: 14, ry: 4 },
  params: [],
  build() {
    return authoredPropShapes('service-scanner', {});
  },
};

const commercialRange: PropTemplate = {
  id: 'commercial-range',
  label: 'Commercial range',
  projection: 'elevation',
  gridFootprint: { w: 2, h: 1 },
  footprint: { cx: CX, cy: 117, rx: 41, ry: 5 },
  params: [],
  build() {
    return authoredPropShapes('commercial-range', {});
  },
};

const prepTable: PropTemplate = {
  id: 'prep-table',
  label: 'Kitchen prep table',
  projection: 'plan',
  gridFootprint: { w: 2, h: 1 },
  params: [],
  build() {
    return authoredPropShapes('prep-table', {});
  },
};

const dishReturn: PropTemplate = {
  id: 'dish-return',
  label: 'Dish return',
  projection: 'elevation',
  gridFootprint: { w: 2, h: 1 },
  footprint: { cx: CX, cy: 117, rx: 42, ry: 5 },
  params: [],
  build() {
    return authoredPropShapes('dish-return', {});
  },
};

const walkInFront: PropTemplate = {
  id: 'walk-in-front',
  label: 'Walk-in cooler front',
  projection: 'elevation',
  gridFootprint: { w: 2, h: 1 },
  footprint: { cx: CX, cy: 117, rx: 42, ry: 5 },
  params: [],
  build() {
    return authoredPropShapes('walk-in-front', {});
  },
};

const diningCarrel: PropTemplate = {
  id: 'dining-carrel',
  label: 'Solitary dining carrel',
  projection: 'plan',
  gridFootprint: { w: 1, h: 1 },
  params: [],
  build() {
    return authoredPropShapes('dining-carrel', {});
  },
};

const cafeteriaTable: PropTemplate = {
  id: 'cafeteria-table',
  label: 'Communal cafeteria table',
  projection: 'plan',
  gridFootprint: { w: 4, h: 2 },
  params: [],
  build() {
    return authoredPropShapes('cafeteria-table', {});
  },
};

const trayStack: PropTemplate = {
  id: 'tray-stack',
  label: 'Tray stack',
  projection: 'plan',
  gridFootprint: { w: 1, h: 1 },
  params: [],
  build() {
    return authoredPropShapes('tray-stack', {});
  },
};

// ---------------------------------------------------------------------------
// Corporate-campus quad, pond, and reflection-garden kit (CE-23/24).
// Ground-detail sprites are static, flat plan decals; the five furnishings are
// ordinary props except reeds, which the sim scatters as living shoreline decor.
// ---------------------------------------------------------------------------

function rakeArcTemplate(
  id: 'ground-detail-rake-arc-a' | 'ground-detail-rake-arc-b' | 'ground-detail-rake-arc-c',
  label: string,
  paths: string[],
): PropTemplate {
  return {
    id,
    label,
    projection: 'plan',
    gridFootprint: { w: 1, h: 1 },
    params: [],
    build() {
      return paths.flatMap((d, index): ShapeSpec[] => [
        {
          d,
          stroke: '#7C797238',
          strokeWidth: 4.2,
          opacity: 0.58,
          silhouette: false,
        },
        {
          d,
          stroke: index % 2 === 0 ? '$primary' : '$secondary',
          strokeWidth: 1.7,
          opacity: 0.82,
          silhouette: false,
        },
      ]);
    },
  };
}

const groundDetailRakeArcA = rakeArcTemplate(
  'ground-detail-rake-arc-a',
  'Raked gravel arcs A',
  [
    'M 24 105 A 80 80 0 0 1 104 25',
    'M 35 108 A 73 73 0 0 1 108 35',
    'M 48 111 A 63 63 0 0 1 111 48',
    'M 61 112 A 51 51 0 0 1 112 61',
  ],
);

const groundDetailRakeArcB = rakeArcTemplate(
  'ground-detail-rake-arc-b',
  'Raked gravel arcs B',
  [
    'M 18 31 A 79 79 0 0 0 97 110',
    'M 18 44 A 66 66 0 0 0 84 110',
    'M 18 57 A 53 53 0 0 0 71 110',
    'M 18 70 A 40 40 0 0 0 58 110',
  ],
);

const groundDetailRakeArcC = rakeArcTemplate(
  'ground-detail-rake-arc-c',
  'Raked gravel arcs C',
  [
    'M 13 79 Q 64 29 115 79',
    'M 13 89 Q 64 39 115 89',
    'M 13 99 Q 64 49 115 99',
    'M 19 108 Q 64 65 109 108',
  ],
);

const groundDetailLilypadA: PropTemplate = {
  id: 'ground-detail-lilypad-a',
  label: 'Lily pads A',
  projection: 'plan',
  gridFootprint: { w: 1, h: 1 },
  params: [],
  build() {
    return [
      { d: 'M 32 70 A 27 21 0 1 1 65 50 L 52 68 Z', fill: '$primary', silhouette: false },
      { d: 'M 53 68 L 65 50', stroke: '$accent', strokeWidth: 1.7, opacity: 0.65, silhouette: false },
      { d: 'M 73 83 A 19 14 0 1 1 94 69 L 84 82 Z', fill: '$secondary', silhouette: false },
      { d: 'M 84 82 L 94 69', stroke: '$accent', strokeWidth: 1.4, opacity: 0.58, silhouette: false },
      { d: ellipse(44, 55, 10, 4), fill: '#FFFFFF20', silhouette: false },
    ];
  },
};

const groundDetailLilypadB: PropTemplate = {
  id: 'ground-detail-lilypad-b',
  label: 'Lily pads B',
  projection: 'plan',
  gridFootprint: { w: 1, h: 1 },
  params: [],
  build() {
    return [
      { d: 'M 58 45 A 24 18 0 1 1 81 61 L 66 61 Z', fill: '$secondary', silhouette: false },
      { d: 'M 66 61 L 81 61', stroke: '$accent', strokeWidth: 1.5, opacity: 0.62, silhouette: false },
      { d: 'M 35 87 A 17 13 0 1 1 55 77 L 47 88 Z', fill: '$primary', silhouette: false },
      { d: 'M 47 88 L 55 77', stroke: '$accent', strokeWidth: 1.3, opacity: 0.58, silhouette: false },
      { d: 'M 79 93 A 14 11 0 1 1 94 84 L 88 94 Z', fill: '$primary', opacity: 0.86, silhouette: false },
      { d: ellipse(71, 49, 8, 3), fill: '#FFFFFF20', silhouette: false },
    ];
  },
};

const groundDetailSteppingStoneA: PropTemplate = {
  id: 'ground-detail-stepping-stone-a',
  label: 'Stepping stones A',
  projection: 'plan',
  gridFootprint: { w: 1, h: 1 },
  params: [],
  build() {
    return [
      { d: ellipse(36, 88, 19, 12), fill: '#00000018', silhouette: false },
      { d: 'M 19 83 Q 25 70 41 72 Q 57 74 56 88 Q 51 101 34 101 Q 18 98 19 83 Z', fill: '$primary', silhouette: false },
      { d: ellipse(33, 80, 10, 4), fill: '$accent', opacity: 0.65, silhouette: false },
      { d: ellipse(83, 51, 21, 13), fill: '#00000018', silhouette: false },
      { d: 'M 64 47 Q 70 33 88 35 Q 106 38 104 53 Q 98 66 80 65 Q 63 62 64 47 Z', fill: '$secondary', silhouette: false },
      { d: ellipse(79, 43, 11, 4), fill: '$accent', opacity: 0.58, silhouette: false },
    ];
  },
};

const groundDetailSteppingStoneB: PropTemplate = {
  id: 'ground-detail-stepping-stone-b',
  label: 'Stepping stones B',
  projection: 'plan',
  gridFootprint: { w: 1, h: 1 },
  params: [],
  build() {
    return [
      { d: ellipse(43, 48, 17, 11), fill: '#00000018', silhouette: false },
      { d: 'M 28 44 Q 34 33 47 35 Q 62 38 60 51 Q 55 61 40 60 Q 27 57 28 44 Z', fill: '$secondary', silhouette: false },
      { d: ellipse(40, 41, 8, 3), fill: '$accent', opacity: 0.6, silhouette: false },
      { d: ellipse(84, 84, 23, 14), fill: '#00000018', silhouette: false },
      { d: 'M 64 80 Q 69 66 87 67 Q 106 70 106 84 Q 101 99 81 99 Q 63 95 64 80 Z', fill: '$primary', silhouette: false },
      { d: ellipse(80, 76, 12, 4), fill: '$accent', opacity: 0.62, silhouette: false },
    ];
  },
};

const parkBench: PropTemplate = {
  id: 'park-bench',
  label: 'Outdoor park bench',
  projection: 'elevation',
  gridFootprint: { w: 2, h: 1 },
  footprint: { cx: CX, cy: 117, rx: 44, ry: 5 },
  params: [],
  build() {
    return authoredPropShapes('park-bench', {});
  },
};

const picnicTable: PropTemplate = {
  id: 'picnic-table',
  label: 'Campus picnic table',
  projection: 'plan',
  gridFootprint: { w: 3, h: 2 },
  params: [],
  build() {
    return authoredPropShapes('picnic-table', {});
  },
};

const stoneLantern: PropTemplate = {
  id: 'stone-lantern',
  label: 'Stone garden lantern',
  projection: 'elevation',
  gridFootprint: { w: 1, h: 1 },
  footprint: { cx: CX, cy: 117, rx: 22, ry: 5 },
  params: [],
  build() {
    return [
      { d: ellipse(CX, GROUND + 1, 24, 5), fill: '#00000020', silhouette: false },
      { d: rr(45, 107, 38, 10, 3), fill: '$secondary' },
      { d: 'M 54 68 L 74 68 L 79 108 L 49 108 Z', fill: '$primary' },
      { d: rr(43, 47, 42, 25, 4), fill: '$secondary' },
      { d: rr(51, 52, 26, 15, 3), fill: '#242A28', silhouette: false },
      { d: circle(CX, 59, 7), fill: '#FFE3A255', silhouette: false },
      { d: circle(CX, 59, 3.5), fill: '#FFE5A8', silhouette: false },
      { d: 'M 38 47 L 51 33 L 77 33 L 90 47 Z', fill: '$primary' },
      { d: rr(56, 26, 16, 9, 3), fill: '$secondary' },
      { d: circle(CX, 24, 5), fill: '$primary' },
    ];
  },
};

const boulderArrangement: PropTemplate = {
  id: 'boulder-arrangement',
  label: 'Placed boulder arrangement',
  projection: 'plan',
  gridFootprint: { w: 2, h: 1 },
  params: [],
  build() {
    return [
      { d: ellipse(52, 76, 35, 14), fill: '#00000018', silhouette: false },
      { d: 'M 18 72 Q 21 47 45 43 Q 71 43 78 68 Q 74 91 46 94 Q 22 92 18 72 Z', fill: '$primary' },
      { d: 'M 28 64 Q 37 49 57 52 Q 65 56 68 66 Q 48 60 28 72 Z', fill: '$accent', opacity: 0.68, silhouette: false },
      { d: ellipse(92, 84, 24, 11), fill: '#00000018', silhouette: false },
      { d: 'M 72 82 Q 77 61 96 61 Q 114 66 112 84 Q 108 99 89 100 Q 72 97 72 82 Z', fill: '$secondary' },
      { d: ellipse(92, 72, 12, 5), fill: '$accent', opacity: 0.6, silhouette: false },
      { d: ellipse(90, 43, 11, 7), fill: '$secondary' },
      { d: ellipse(87, 40, 5, 2.5), fill: '$accent', opacity: 0.58, silhouette: false },
    ];
  },
};

const reedsCluster: PropTemplate = {
  id: 'reeds-cluster',
  label: 'Shoreline reeds cluster',
  projection: 'elevation',
  gridFootprint: { w: 1, h: 1 },
  footprint: { cx: CX, cy: 117, rx: 26, ry: 4 },
  params: [],
  build() {
    const stems = [
      [38, 91, 35], [47, 103, 45], [55, 90, 31], [63, 105, 40],
      [72, 93, 34], [81, 105, 49], [89, 94, 38],
    ];
    const shapes: ShapeSpec[] = [
      { d: ellipse(CX, GROUND + 1, 28, 4), fill: '#00000018', silhouette: false },
      { d: ellipse(CX, 108, 26, 10), fill: '$secondary' },
      { d: 'M 57 108 Q 51 94 48 88 Q 61 96 63 108 Z', fill: '$secondary', silhouette: false },
    ];
    for (const [x, bottom, top] of stems) {
      shapes.push({ d: `M ${x} ${bottom} Q ${x - 2} ${(bottom + top) / 2} ${x + 1} ${top}`, stroke: '$primary', strokeWidth: 3 });
    }
    shapes.push(
      { d: 'M 49 101 Q 40 87 35 78 Q 48 83 54 98 Z', fill: '$primary' },
      { d: 'M 68 103 Q 77 87 86 80 Q 82 96 73 107 Z', fill: '$primary' },
    );
    for (const [x, , top] of stems) shapes.push({ d: rr(x - 2, top - 7, 6, 13, 3), fill: '$accent' });
    return shapes;
  },
};

// ---------------------------------------------------------------------------
// Nature decor (lush-outside pass — D2 amendment). Projection follows height:
// trees/saplings are front-facing elevation art; low flora remains plan art.
// All are NON_PLACEABLE scenery the sim scatters over the build site,
// and all are EXEMPT from the clinical drain
// (NATURE_PROP_TEMPLATE_IDS, core/look.ts) — nature stays saturated on the
// plan, like people and the natural ground under it.
// ---------------------------------------------------------------------------

interface FloraPoint {
  x: number;
  y: number;
}

function smoothBlobPath(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  points: number,
  rng: () => number,
  jitter = 0.16,
  rotation = 0,
): string {
  const ring: FloraPoint[] = [];
  for (let i = 0; i < points; i++) {
    const angle = rotation + (i / points) * Math.PI * 2;
    const distance = 1 - jitter + rng() * jitter * 2;
    ring.push({
      x: cx + Math.cos(angle) * rx * distance,
      y: cy + Math.sin(angle) * ry * distance,
    });
  }
  const midpoint = (a: FloraPoint, b: FloraPoint): FloraPoint => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  });
  const start = midpoint(ring[ring.length - 1], ring[0]);
  let d = `M ${start.x} ${start.y}`;
  for (let i = 0; i < ring.length; i++) {
    const next = midpoint(ring[i], ring[(i + 1) % ring.length]);
    d += ` Q ${ring[i].x} ${ring[i].y} ${next.x} ${next.y}`;
  }
  return `${d} Z`;
}

function starPath(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  points: number,
  rotation: number,
  rng?: () => number,
  jitter = 0,
): string {
  const vertices: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = rotation + (i / (points * 2)) * Math.PI * 2;
    const baseRadius = i % 2 === 0 ? outer : inner;
    const radius = baseRadius * (1 + ((rng?.() ?? 0.5) - 0.5) * jitter * 2);
    vertices.push(`${cx + Math.cos(angle) * radius} ${cy + Math.sin(angle) * radius}`);
  }
  return `M ${vertices[0]} L ${vertices.slice(1).join(' L ')} Z`;
}

function pointedLeafPath(startX: number, startY: number, endX: number, endY: number, width: number): string {
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.max(1, Math.hypot(dx, dy));
  const px = (-dy / length) * width;
  const py = (dx / length) * width;
  const midX = startX + dx * 0.55;
  const midY = startY + dy * 0.55;
  return (
    `M ${startX} ${startY} ` +
    `Q ${midX + px} ${midY + py} ${endX} ${endY} ` +
    `Q ${midX - px} ${midY - py} ${startX} ${startY} Z`
  );
}

function treeTrunk(shapes: ShapeSpec[], topY: number, bottomY: number, width: number, lean = 0): void {
  const topX = CX + lean;
  shapes.push({
    d: (
      `M ${topX - width * 0.38} ${topY} ` +
      `Q ${CX - width * 0.58} ${(topY + bottomY) / 2} ${CX - width * 0.62} ${bottomY} ` +
      `L ${CX + width * 0.62} ${bottomY} ` +
      `Q ${CX + width * 0.52} ${(topY + bottomY) / 2} ${topX + width * 0.38} ${topY} Z`
    ),
    fill: '#6F5130',
  });
  shapes.push({
    d: `M ${topX - width * 0.08} ${topY + 3} Q ${CX - width * 0.1} ${(topY + bottomY) / 2} ${CX - width * 0.16} ${bottomY - 3}`,
    stroke: '#9A7448',
    strokeWidth: Math.max(1.5, width * 0.18),
    opacity: 0.76,
    silhouette: false,
  });
}

const treeCanopy: PropTemplate = {
  id: 'tree-canopy',
  label: 'Tree',
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 42, ry: 6 },
  // A mature crown shades a 3×3 block even though its sprite is elevation art.
  gridFootprint: { w: 3, h: 3 },
  params: [
    { key: 'habit', label: 'Crown habit', min: 0, max: 3, step: 1, default: 0 },
    { key: 'lobes', label: 'Lobes', min: 5, max: 9, step: 1, default: 7 },
    { key: 'seed', label: 'Shape seed', min: 1, max: 9, step: 1, default: 3 },
  ],
  build(params) {
    return authoredPropShapes('tree-canopy', params);
  },
};

function elevationMultiStemSapling(shapes: ShapeSpec[], rng: () => number): void {
  const crowns = [
    { x: 48, y: 57, rx: 16, ry: 18 },
    { x: 64, y: 43, rx: 17, ry: 18 },
    { x: 81, y: 59, rx: 15, ry: 17 },
  ].map((crown) => ({
    ...crown,
    x: crown.x + (rng() - 0.5) * 5,
    y: crown.y + (rng() - 0.5) * 5,
  }));
  shapes.push(
    { d: `M ${CX - 5} ${GROUND} Q ${CX - 7} 78 ${crowns[0].x} ${crowns[0].y + 8}`, stroke: '#6F5130', strokeWidth: 5, silhouette: true },
    { d: `M ${CX} ${GROUND} Q ${CX} 72 ${crowns[1].x} ${crowns[1].y + 8}`, stroke: '#6F5130', strokeWidth: 5, silhouette: true },
    { d: `M ${CX + 5} ${GROUND} Q ${CX + 8} 80 ${crowns[2].x} ${crowns[2].y + 8}`, stroke: '#6F5130', strokeWidth: 5, silhouette: true },
  );
  for (const crown of crowns) {
    shapes.push({ d: ellipse(crown.x, crown.y, crown.rx, crown.ry), fill: '$secondary' });
  }
  for (const crown of crowns) {
    shapes.push({
      d: ellipse(crown.x - 2.5, crown.y - 3, crown.rx * 0.72, crown.ry * 0.72),
      fill: '$primary',
      silhouette: false,
    });
  }
  for (const crown of crowns) {
    shapes.push({
      d: ellipse(crown.x - 5, crown.y - 6, crown.rx * 0.34, crown.ry * 0.34),
      fill: '$accent',
      opacity: 0.82,
      silhouette: false,
    });
  }
}

const treeSapling: PropTemplate = {
  id: 'tree-sapling',
  label: 'Sapling',
  projection: 'elevation',
  footprint: { cx: CX, cy: 117, rx: 25, ry: 4 },
  gridFootprint: { w: 2, h: 2 },
  params: [
    { key: 'habit', label: 'Growth habit', min: 0, max: 1, step: 1, default: 0 },
    { key: 'seed', label: 'Shape seed', min: 1, max: 9, step: 1, default: 5 },
  ],
  build(params) {
    const shapes: ShapeSpec[] = [];
    const habit = Math.round(params.habit ?? 0);
    const rng = mulberry32((params.seed ?? 5) * 26041 + habit * 6553);
    if (habit === 1) {
      elevationMultiStemSapling(shapes, rng);
    } else {
      treeTrunk(shapes, 70, GROUND, 8, -1);
      shapes.push({ d: smoothBlobPath(CX - 2, 55, 29, 27, 12, rng, 0.18), fill: '$secondary' });
      shapes.push({ d: smoothBlobPath(CX - 5, 50, 22, 19, 10, rng, 0.16), fill: '$primary', silhouette: false });
      shapes.push(
        { d: ellipse(51, 43, 7, 6), fill: '$accent', opacity: 0.78, silhouette: false },
        { d: ellipse(65, 38, 6, 7), fill: '$accent', opacity: 0.72, silhouette: false },
      );
    }
    return shapes;
  },
};

const bushCluster: PropTemplate = {
  id: 'bush-cluster',
  label: 'Bush cluster',
  projection: 'plan',
  // a low run of shrubs, 2 cells long
  gridFootprint: { w: 2, h: 1 },
  params: [
    { key: 'habit', label: 'Shrub habit', min: 0, max: 2, step: 1, default: 0 },
    { key: 'bushes', label: 'Bushes', min: 2, max: 4, step: 1, default: 3 },
    { key: 'seed', label: 'Shape seed', min: 1, max: 9, step: 1, default: 2 },
  ],
  build(params) {
    const habit = Math.round(params.habit ?? 0);
    const rng = mulberry32((params.seed ?? 2) * 33997 + habit * 9151);
    const n = params.bushes ?? 3;
    const shapes: ShapeSpec[] = [];
    if (habit === 1) {
      const lobes = Array.from({ length: n + 3 }, (_, index) => {
        const angle = (index / (n + 3)) * Math.PI * 2 + (rng() - 0.5) * 0.7;
        const distance = 12 + rng() * 22;
        return {
          x: CX + Math.cos(angle) * distance * 1.45,
          y: CX + Math.sin(angle) * distance * 0.72,
          r: 11 + rng() * 7,
        };
      });
      shapes.push({ d: ellipse(CX + 4, CX + 6, 48, 26), fill: '#00000022', silhouette: false });
      shapes.push({ d: smoothBlobPath(CX, CX, 39, 20, 12, rng, 0.26), fill: '$secondary' });
      for (const lobe of lobes) shapes.push({ d: circle(lobe.x, lobe.y, lobe.r), fill: '$secondary' });
      for (const lobe of lobes) shapes.push({ d: circle(lobe.x - 2, lobe.y - 3, lobe.r * 0.7), fill: '$primary', silhouette: false });
      for (let i = 0; i < lobes.length; i += 2) {
        const lobe = lobes[i];
        shapes.push({ d: circle(lobe.x - 4, lobe.y - 5, lobe.r * 0.3), fill: '$accent', opacity: 0.78, silhouette: false });
      }
    } else {
      const low = habit === 2;
      const base = smoothBlobPath(CX, CX, low ? 49 : 46, low ? 18 : 23, low ? 14 : 12, rng, low ? 0.24 : 0.2, 0.15);
      shapes.push({ d: ellipse(CX + 4, CX + 6, low ? 50 : 47, low ? 20 : 25), fill: '#00000022', silhouette: false });
      shapes.push({ d: base, fill: '$secondary' });
      const highlights = low ? 5 : Math.max(5, n + 2);
      if (low) {
        shapes.push({
          d: smoothBlobPath(CX - 3, CX - 4, 43, 13, 13, rng, 0.22, 0.2),
          fill: '$primary',
          silhouette: false,
        });
      } else {
        for (let i = 0; i < highlights; i++) {
          const x = 31 + (i / Math.max(1, highlights - 1)) * 66 + (rng() - 0.5) * 8;
          const y = CX - 3 + (rng() - 0.5) * 20;
          shapes.push({ d: ellipse(x, y, 12 + rng() * 4, 9 + rng() * 4), fill: '$primary', silhouette: false });
        }
      }
      for (let i = 0; i < highlights; i++) {
        const x = 32 + (i / Math.max(1, highlights - 1)) * 62 + (rng() - 0.5) * 6;
        const y = CX - 6 + (rng() - 0.5) * (low ? 10 : 17);
        shapes.push({ d: ellipse(x, y, low ? 7 : 6, low ? 4.5 : 5), fill: '$accent', opacity: 0.7, silhouette: false });
      }
    }
    return shapes;
  },
};

const wildflowerPatch: PropTemplate = {
  id: 'wildflower-patch',
  label: 'Wildflower patch',
  projection: 'plan',
  // a mostly-transparent decal over the grass, like the parking line over asphalt
  gridFootprint: { w: 2, h: 2 },
  params: [
    { key: 'density', label: 'Density', min: 1, max: 3, step: 1, default: 2 },
    { key: 'seed', label: 'Pattern seed', min: 1, max: 9, step: 1, default: 6 },
  ],
  build(params) {
    const rng = mulberry32((params.seed ?? 6) * 47057);
    const shapes: ShapeSpec[] = [];
    const density = params.density ?? 2;
    for (const patch of [
      { x: 47, y: 61, rx: 27, ry: 20 },
      { x: 74, y: 56, rx: 25, ry: 18 },
      { x: 67, y: 78, rx: 28, ry: 17 },
    ]) {
      shapes.push({
        d: smoothBlobPath(patch.x, patch.y, patch.rx, patch.ry, 10, rng, 0.28, rng() * 0.4),
        fill: '$secondary',
        opacity: 0.17,
        silhouette: false,
      });
    }
    const tufts = density * 10;
    const blades: Array<{ x: number; y: number; h: number; lean: number }> = [];
    for (let i = 0; i < tufts; i++) {
      blades.push({ x: (rng() + rng()) * 64, y: (rng() + rng()) * 64, h: 4 + rng() * 4, lean: (rng() - 0.5) * 5 });
    }
    for (const blade of blades) {
      shapes.push({ d: `M ${blade.x} ${blade.y} L ${blade.x + blade.lean} ${blade.y - blade.h}`, stroke: '$primary', strokeWidth: 1.8, opacity: 0.78, silhouette: false });
    }
    const flowers = density * 9;
    const literalFlowers: ShapeSpec[] = [];
    for (let i = 0; i < flowers; i++) {
      const x = (rng() + rng()) * 64;
      const y = (rng() + rng()) * 64;
      const radius = 2.1 + rng() * 1.4;
      if (i % 3 === 1) {
        shapes.push({ d: circle(x, y, radius), fill: '$accent', opacity: 0.94, silhouette: false });
      } else {
        const hue = i % 3 === 2 ? FLOWER_HUES[1] : (i % 2 === 0 ? FLOWER_HUES[0] : FLOWER_HUES[2]);
        literalFlowers.push({ d: circle(x, y, radius), fill: hue, opacity: 0.96, silhouette: false });
      }
    }
    shapes.push(...literalFlowers);
    return shapes;
  },
};

const tallGrassClump: PropTemplate = {
  id: 'tall-grass-clump',
  label: 'Tall grass clump',
  projection: 'plan',
  gridFootprint: { w: 1, h: 1 },
  params: [
    { key: 'density', label: 'Density', min: 1, max: 3, step: 1, default: 2 },
    { key: 'seed', label: 'Pattern seed', min: 1, max: 9, step: 1, default: 4 },
  ],
  build(params) {
    const rng = mulberry32((params.seed ?? 4) * 57037);
    const density = params.density ?? 2;
    const rotation = -Math.PI / 2 + (rng() - 0.5) * 0.35;
    const shapes: ShapeSpec[] = [
      { d: ellipse(CX + 4, CX + 6, 29, 21), fill: '#00000022', silhouette: false },
      { d: starPath(CX, CX, 31, 17, 9, rotation, rng, 0.24), fill: '$secondary' },
    ];
    const blades: Array<{ x: number; y: number; tx: number; ty: number; accent: boolean }> = [];
    for (let i = 0; i < density * 12; i++) {
      const angle = rng() * Math.PI * 2;
      const rootRadius = rng() * 15;
      const length = 13 + rng() * 15;
      blades.push({
        x: CX + Math.cos(angle) * rootRadius,
        y: CX + Math.sin(angle) * rootRadius * 0.72,
        tx: CX + Math.cos(angle) * (rootRadius + length),
        ty: CX + Math.sin(angle) * (rootRadius + length) * 0.72,
        accent: i % 3 === 0,
      });
    }
    for (const blade of blades.filter(({ accent }) => !accent)) {
      shapes.push({ d: `M ${blade.x} ${blade.y} Q ${CX} ${CX} ${blade.tx} ${blade.ty}`, stroke: '$primary', strokeWidth: 2.2, opacity: 0.82, silhouette: false });
    }
    for (const blade of blades.filter(({ accent }) => accent)) {
      shapes.push({ d: `M ${blade.x} ${blade.y} Q ${CX} ${CX} ${blade.tx} ${blade.ty}`, stroke: '$accent', strokeWidth: 2, opacity: 0.78, silhouette: false });
    }
    for (const blade of blades.filter(({ accent }) => accent).slice(0, 4)) {
      shapes.push({ d: ellipse(blade.tx, blade.ty, 1.7, 2.8), fill: '#D9C87A', opacity: 0.84, silhouette: false });
    }
    return shapes;
  },
};

const brackenPatch: PropTemplate = {
  id: 'bracken-patch',
  label: 'Bracken patch',
  projection: 'plan',
  gridFootprint: { w: 2, h: 1 },
  params: [
    { key: 'fronds', label: 'Fronds', min: 4, max: 7, step: 1, default: 6 },
    { key: 'seed', label: 'Pattern seed', min: 1, max: 9, step: 1, default: 7 },
  ],
  build(params) {
    const rng = mulberry32((params.seed ?? 7) * 64007);
    const fronds = params.fronds ?? 6;
    const shapes: ShapeSpec[] = [
      { d: ellipse(CX + 4, CX + 6, 46, 25), fill: '#00000022', silhouette: false },
    ];
    const geometry: Array<{ angle: number; endX: number; endY: number; width: number }> = [];
    for (let i = 0; i < fronds; i++) {
      const angle = -Math.PI + (i / Math.max(1, fronds - 1)) * Math.PI * 2 + (rng() - 0.5) * 0.3;
      const length = 25 + rng() * 13;
      geometry.push({
        angle,
        endX: CX + Math.cos(angle) * length * 1.2,
        endY: CX + Math.sin(angle) * length * 0.5,
        width: 6 + rng() * 2.5,
      });
    }
    for (const frond of geometry) {
      shapes.push({ d: pointedLeafPath(CX, CX, frond.endX, frond.endY, frond.width), fill: '$secondary' });
    }
    shapes.push({ d: circle(CX, CX, 8), fill: '$secondary' });
    const leaflets: ShapeSpec[] = [];
    const stems: ShapeSpec[] = [];
    for (const frond of geometry) {
      stems.push({ d: `M ${CX} ${CX} L ${frond.endX} ${frond.endY}`, stroke: '$accent', strokeWidth: 1.8, opacity: 0.78, silhouette: false });
      for (let step = 1; step <= 4; step++) {
        const t = step / 5;
        const x = CX + (frond.endX - CX) * t;
        const y = CX + (frond.endY - CX) * t;
        const px = -Math.sin(frond.angle) * (4.5 - step * 0.35);
        const py = Math.cos(frond.angle) * (3.2 - step * 0.2);
        leaflets.push(
          { d: ellipse(x + px, y + py, 4.4, 2.6), fill: '$primary', silhouette: false },
          { d: ellipse(x - px, y - py, 4.4, 2.6), fill: '$primary', silhouette: false },
        );
      }
    }
    shapes.push(...leaflets, ...stems);
    return shapes;
  },
};

const boulder: PropTemplate = {
  id: 'boulder',
  label: 'Boulder',
  projection: 'plan',
  gridFootprint: { w: 1, h: 1 },
  params: [
    { key: 'size', label: 'Size', min: 56, max: 96, step: 4, default: 76 },
    { key: 'seed', label: 'Shape seed', min: 1, max: 9, step: 1, default: 4 },
  ],
  build(params) {
    const shapes: ShapeSpec[] = [];
    const rng = mulberry32((params.seed ?? 4) * 61129);
    const R = (params.size ?? 76) / 2;
    // irregular rounded outcrop: jittered radial polygon with soft corners
    const pts: string[] = [];
    const n = 7;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const d = R * (0.78 + rng() * 0.3);
      pts.push(`${64 + Math.cos(a) * d} ${64 + Math.sin(a) * d * 0.88}`);
    }
    shapes.push({ d: ellipse(68, 70, R * 0.95, R * 0.8), fill: '#00000022', silhouette: false });
    shapes.push({ d: `M ${pts[0]} L ${pts.slice(1).join(' L ')} Z`, fill: '$primary' });
    // lit top facet toward NW + shaded flank SE
    shapes.push({ d: ellipse(58, 56, R * 0.45, R * 0.32), fill: '$accent', opacity: 0.8, silhouette: false });
    shapes.push({ d: ellipse(72, 74, R * 0.4, R * 0.26), fill: '$secondary', opacity: 0.7, silhouette: false });
    // a hairline crack
    shapes.push({ d: `M ${64 - R * 0.3} ${64 + R * 0.15} L ${64 + R * 0.1} ${64 + R * 0.4}`, stroke: '$secondary', strokeWidth: 1.2, opacity: 0.7, silhouette: false });
    return shapes;
  },
};

// ---------------------------------------------------------------------------
// Ground-detail decals (wild-field pass — D2 amendment). The dense sub-tile
// scatter layer under the flora: tiny tufts, sprigs, pebbles, and a twig the
// sim strews nearly everywhere over the natural ground. Each variant is its
// OWN template id — the sim pattern-matches the `ground-detail-` prefix and
// consumes baked per-variant silhouettes, never generator controls. All are
// plan-projected 1×1 decals on the wildflower-patch convention: every shape
// silhouette:false (no compositor outline), no ground shadow, and the drawn
// element covers only ~30–60% of the cell so a dense scatter reads as ground
// texture, not objects. Variants shift anchor + rotation so tiling can't
// read as a repeat.
// ---------------------------------------------------------------------------

interface GroundDetailTuftRoot {
  x: number;
  y: number;
  blades: number;
  reach: number;
  rotation: number;
}

function groundDetailTuft(
  id: string,
  label: string,
  seedDefault: number,
  seedSalt: number,
  roots: GroundDetailTuftRoot[],
): PropTemplate {
  return {
    id,
    label,
    projection: 'plan',
    gridFootprint: { w: 1, h: 1 },
    params: [{ key: 'seed', label: 'Pattern seed', min: 1, max: 9, step: 1, default: seedDefault }],
    build(params) {
      const rng = mulberry32((params.seed ?? seedDefault) * seedSalt);
      const shapes: ShapeSpec[] = [];
      for (const root of roots) {
        for (let i = 0; i < root.blades; i++) {
          const angle = root.rotation + (i / root.blades) * Math.PI * 2 + (rng() - 0.5) * 0.55;
          const rootRadius = 1.5 + rng() * 3;
          const length = root.reach * (0.65 + rng() * 0.5);
          const sx = root.x + Math.cos(angle) * rootRadius;
          const sy = root.y + Math.sin(angle) * rootRadius * 0.72;
          const tx = root.x + Math.cos(angle) * (rootRadius + length);
          const ty = root.y + Math.sin(angle) * (rootRadius + length) * 0.72;
          shapes.push({
            d: `M ${sx} ${sy} Q ${root.x} ${root.y} ${tx} ${ty}`,
            stroke: i % 3 === 0 ? '$accent' : '$primary',
            strokeWidth: i % 3 === 0 ? 2.6 : 3.1,
            opacity: 0.88,
            silhouette: false,
          });
        }
        shapes.push({ d: ellipse(root.x, root.y, 3, 2.2), fill: '$secondary', opacity: 0.55, silhouette: false });
      }
      return shapes;
    },
  };
}

const groundDetailGrassTuftA = groundDetailTuft('ground-detail-grass-tuft-a', 'Grass tuft A', 3, 68111, [
  { x: CX, y: CX, blades: 7, reach: 17, rotation: 0.4 },
]);

const groundDetailGrassTuftB = groundDetailTuft('ground-detail-grass-tuft-b', 'Grass tuft B', 6, 68113, [
  { x: 52, y: 74, blades: 5, reach: 20, rotation: 2.1 },
]);

const groundDetailGrassTuftC = groundDetailTuft('ground-detail-grass-tuft-c', 'Grass tuft C', 8, 68117, [
  { x: 46, y: 50, blades: 4, reach: 13, rotation: 1.2 },
  { x: 80, y: 79, blades: 4, reach: 12, rotation: 4.3 },
]);

interface GroundDetailSprigStem {
  x: number;
  y: number;
  tx: number;
  ty: number;
  /** flower-head fill: a palette token or a literal FLOWER_HUES entry. */
  head: string;
  headRadius: number;
}

function groundDetailFlowerSprig(
  id: string,
  label: string,
  seedDefault: number,
  seedSalt: number,
  root: FloraPoint,
  stems: GroundDetailSprigStem[],
): PropTemplate {
  return {
    id,
    label,
    projection: 'plan',
    gridFootprint: { w: 1, h: 1 },
    params: [{ key: 'seed', label: 'Pattern seed', min: 1, max: 9, step: 1, default: seedDefault }],
    build(params) {
      const rng = mulberry32((params.seed ?? seedDefault) * seedSalt);
      const shapes: ShapeSpec[] = [];
      // leaf blades first, so heads read on top
      for (let i = 0; i < 3; i++) {
        const angle = rng() * Math.PI * 2;
        const length = 6 + rng() * 5;
        shapes.push({
          d: `M ${root.x} ${root.y} L ${root.x + Math.cos(angle) * length} ${root.y + Math.sin(angle) * length * 0.72}`,
          stroke: '$primary',
          strokeWidth: 2.6,
          opacity: 0.85,
          silhouette: false,
        });
      }
      for (const stem of stems) {
        const jx = stem.tx + (rng() - 0.5) * 3;
        const jy = stem.ty + (rng() - 0.5) * 3;
        shapes.push({
          d: `M ${root.x} ${root.y} Q ${(root.x + jx) / 2 + (rng() - 0.5) * 4} ${(root.y + jy) / 2} ${jx} ${jy}`,
          stroke: '$primary',
          strokeWidth: 2.2,
          opacity: 0.9,
          silhouette: false,
        });
        shapes.push({ d: circle(jx, jy, stem.headRadius * 1.15), fill: stem.head, opacity: 0.95, silhouette: false });
        shapes.push({ d: circle(jx, jy, stem.headRadius * 0.42), fill: '$secondary', opacity: 0.55, silhouette: false });
      }
      return shapes;
    },
  };
}

// Restrained heads only: the muted wildflower creams/lilacs plus the palette's
// straw accent — never hot reds/ambers (amber is reserved for capture cues).
const groundDetailFlowerSprigA = groundDetailFlowerSprig(
  'ground-detail-flower-sprig-a',
  'Flower sprig A',
  4,
  71119,
  { x: 58, y: 70 },
  [
    { x: 58, y: 70, tx: 47, ty: 56, head: FLOWER_HUES[0], headRadius: 3.2 },
    { x: 58, y: 70, tx: 66, ty: 52, head: '$accent', headRadius: 2.8 },
    { x: 58, y: 70, tx: 72, ty: 74, head: FLOWER_HUES[2], headRadius: 2.6 },
  ],
);

const groundDetailFlowerSprigB = groundDetailFlowerSprig(
  'ground-detail-flower-sprig-b',
  'Flower sprig B',
  7,
  71129,
  { x: 72, y: 55 },
  [
    { x: 72, y: 55, tx: 84, ty: 66, head: FLOWER_HUES[2], headRadius: 3 },
    { x: 72, y: 55, tx: 60, ty: 44, head: FLOWER_HUES[0], headRadius: 2.5 },
  ],
);

interface GroundDetailStone {
  x: number;
  y: number;
  r: number;
  /** horizontal stretch — 1 is round, >1 elongates the stone. */
  stretch: number;
}

function groundDetailPebble(
  id: string,
  label: string,
  seedDefault: number,
  seedSalt: number,
  stones: GroundDetailStone[],
): PropTemplate {
  return {
    id,
    label,
    projection: 'plan',
    gridFootprint: { w: 1, h: 1 },
    params: [{ key: 'seed', label: 'Shape seed', min: 1, max: 9, step: 1, default: seedDefault }],
    build(params) {
      const rng = mulberry32((params.seed ?? seedDefault) * seedSalt);
      const shapes: ShapeSpec[] = [];
      for (const stone of stones) {
        // mini-boulder outcrop: jittered radial polygon, soft y-squash
        const pts: string[] = [];
        const n = 6;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          const d = stone.r * (0.78 + rng() * 0.3);
          pts.push(`${stone.x + Math.cos(a) * d * stone.stretch} ${stone.y + Math.sin(a) * d * 0.85}`);
        }
        shapes.push({ d: ellipse(stone.x + 1.5, stone.y + 1.5, stone.r * stone.stretch, stone.r * 0.8), fill: '#00000018', silhouette: false });
        shapes.push({ d: `M ${pts[0]} L ${pts.slice(1).join(' L ')} Z`, fill: '$primary', silhouette: false });
        shapes.push({ d: ellipse(stone.x - stone.r * 0.25, stone.y - stone.r * 0.3, stone.r * 0.42 * stone.stretch, stone.r * 0.3), fill: '$accent', opacity: 0.8, silhouette: false });
        shapes.push({ d: ellipse(stone.x + stone.r * 0.22, stone.y + stone.r * 0.28, stone.r * 0.38 * stone.stretch, stone.r * 0.24), fill: '$secondary', opacity: 0.7, silhouette: false });
      }
      return shapes;
    },
  };
}

const groundDetailPebbleA = groundDetailPebble('ground-detail-pebble-a', 'Pebble scatter A', 2, 74093, [
  { x: 55, y: 62, r: 7, stretch: 1 },
  { x: 70, y: 70, r: 5.5, stretch: 1.1 },
  { x: 63, y: 76, r: 4.2, stretch: 1 },
]);

const groundDetailPebbleB = groundDetailPebble('ground-detail-pebble-b', 'Pebble scatter B', 5, 74099, [
  { x: 72, y: 55, r: 8, stretch: 1.35 },
  { x: 49, y: 74, r: 5, stretch: 1 },
]);

const groundDetailTwigA: PropTemplate = {
  id: 'ground-detail-twig-a',
  label: 'Fallen twig',
  projection: 'plan',
  gridFootprint: { w: 1, h: 1 },
  params: [{ key: 'seed', label: 'Shape seed', min: 1, max: 9, step: 1, default: 3 }],
  build(params) {
    const rng = mulberry32((params.seed ?? 3) * 77003);
    const bend = (rng() - 0.5) * 10;
    const shapes: ShapeSpec[] = [
      // main stem, lying diagonally with a slight bow
      { d: `M 42 79 Q ${64 + bend} ${60 + bend * 0.4} 86 51`, stroke: '$secondary', strokeWidth: 3.6, opacity: 0.9, silhouette: false },
      { d: `M 42 79 Q ${64 + bend} ${60 + bend * 0.4} 86 51`, stroke: '$primary', strokeWidth: 2.4, opacity: 0.95, silhouette: false },
      // fork branch + a broken stub
      { d: `M ${62 + bend * 0.5} ${64 + bend * 0.2} L ${72 + (rng() - 0.5) * 4} ${74 + (rng() - 0.5) * 4}`, stroke: '$primary', strokeWidth: 2, opacity: 0.9, silhouette: false },
      { d: `M 52 73 L ${47 + (rng() - 0.5) * 3} ${66 + (rng() - 0.5) * 3}`, stroke: '$primary', strokeWidth: 1.8, opacity: 0.85, silhouette: false },
      // snapped-end highlight
      { d: circle(86, 51, 1.6), fill: '$accent', opacity: 0.9, silhouette: false },
    ];
    return shapes;
  },
};

/** Ground-detail decal template ids — the wild-field scatter layer. The sim
 *  pattern-matches this `ground-detail-` prefix; every id here is a baked
 *  1×1 plan decal variant (no generator controls cross the boundary). */
export const GROUND_DETAIL_TEMPLATE_IDS = [
  'ground-detail-grass-tuft-a',
  'ground-detail-grass-tuft-b',
  'ground-detail-grass-tuft-c',
  'ground-detail-flower-sprig-a',
  'ground-detail-flower-sprig-b',
  'ground-detail-pebble-a',
  'ground-detail-pebble-b',
  'ground-detail-twig-a',
] as const;

/** Quad/pond ground-detail decals. They keep the simulation-recognized
 *  `ground-detail-` prefix but remain separate from the wild nature family:
 *  the sim scatters them over authored gravel, pond, or desire-line cells. */
export const QUAD_GROUND_DETAIL_TEMPLATE_IDS = [
  'ground-detail-rake-arc-a',
  'ground-detail-rake-arc-b',
  'ground-detail-rake-arc-c',
  'ground-detail-lilypad-a',
  'ground-detail-lilypad-b',
  'ground-detail-stepping-stone-a',
  'ground-detail-stepping-stone-b',
] as const;

/** Nature decor template ids — EXEMPT from the clinical drain (core/look.ts),
 *  mirroring NATURAL_GROUND_TEMPLATE_IDS: under the clinical look these stay
 *  saturated while the office (and the cars, and the paved lot) drains. */
export const NATURE_PROP_TEMPLATE_IDS = [
  'tree-canopy',
  'tree-sapling',
  'bush-cluster',
  'wildflower-patch',
  'tall-grass-clump',
  'bracken-patch',
  'boulder',
  'reeds-cluster',
  ...GROUND_DETAIL_TEMPLATE_IDS,
] as const;

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
  personalDeskItems,
  restroomSink,
  restroomStall,
  wallScreen,
  lockers,
  openShelving,
  copier,
  shredder,
  serverRack,
  irisInstallationUnit,
  irisInstallationUnitDormant,
  irisChargingDock,
  standingDesk,
  waitingBench,
  coffeeTable,
  phoneBooth,
  kanbanBoard,
  microwave,
  pantryShelf,
  pingPongTable,
  foosballTable,
  beanBag,
  fishTank,
  napPod,
  petBed,
  stringLights,
  barCart,
  recyclingBins,
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
  // Exterior vehicles + lot decals (B1.5 build site).
  car,
  carSuv,
  parkingLine,
  // Corporate-campus parking kit (CE-21).
  lotMarkingAccessible,
  lotMarkingArrow,
  lotMarkingReserved,
  lotMarkingCrosswalk,
  lampPost,
  signLot,
  carCompact,
  bikeRack,
  // Corporate-campus cafeteria + kitchen kit (CE-22).
  servingLine,
  serviceScanner,
  commercialRange,
  prepTable,
  dishReturn,
  walkInFront,
  diningCarrel,
  cafeteriaTable,
  trayStack,
  // Corporate-campus quad, pond, and reflection-garden kit (CE-23/24).
  groundDetailRakeArcA,
  groundDetailRakeArcB,
  groundDetailRakeArcC,
  groundDetailLilypadA,
  groundDetailLilypadB,
  groundDetailSteppingStoneA,
  groundDetailSteppingStoneB,
  parkBench,
  picnicTable,
  stoneLantern,
  boulderArrangement,
  reedsCluster,
  // Nature decor (lush-outside pass) — clinical-exempt exterior scenery.
  treeCanopy,
  treeSapling,
  bushCluster,
  wildflowerPatch,
  tallGrassClump,
  brackenPatch,
  boulder,
  // Ground-detail scatter decals (wild-field pass) — sub-tile texture variants.
  groundDetailGrassTuftA,
  groundDetailGrassTuftB,
  groundDetailGrassTuftC,
  groundDetailFlowerSprigA,
  groundDetailFlowerSprigB,
  groundDetailPebbleA,
  groundDetailPebbleB,
  groundDetailTwigA,
  ...DEPARTMENT_MACHINE_TEMPLATES,
];
