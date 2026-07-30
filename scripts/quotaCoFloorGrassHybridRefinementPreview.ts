/**
 * Complete-family refinement of the visually approved Maintained Hybrid
 * direction for QuotaCo floors and grass ground.
 *
 * This remains proof code. It does not create standalone source SVG files,
 * mutate FloorTemplate/default data, promote snapshots, export a bundle, or
 * change Unity registration.
 *
 *   node --import tsx scripts/quotaCoFloorGrassHybridRefinementPreview.ts
 *   node --import tsx scripts/quotaCoFloorGrassHybridRefinementPreview.ts --out docs/previews
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import { composeFloorTile } from '../src/core/compositor';
import { CURRENT_SCHEMA_VERSION, type TileInstance } from '../src/core/types';
import {
  DEFAULT_CAST,
  DEFAULT_FLOORS,
  DEFAULT_GROUND,
  DEFAULT_STYLE,
} from '../src/data/defaults';
import { FLOOR_TEMPLATES, GROUND_TEMPLATE_IDS } from '../src/tiles/templates';
import { PropCalibrationRenderer } from './quotaCoPropRedesignCalibrationPreview';

const WIDTH = 3200;
const HEIGHT = 2500;
const MARGIN = 28;
const AUTHORING_CANVAS = 128;
const WALL_DATUM = 112;
const CHARACTER_VISUAL_SCALE = 0.65;
const NORMAL_CELL = 52;
const FAR_CELL = 18;

const PAGE = '#E7E1D2';
const PANEL = '#F6F1E6';
const PANEL_ALT = '#ECE5D7';
const HYBRID = '#DCE9DD';
const INK = '#292C2A';
const MUTED = '#626861';
const RULE = '#A39B8B';
const GREEN = '#355647';
const CORAL = '#B65F4D';
const BLUE = '#294565';

export const MAINTAINED_HYBRID_FLOOR_IDS = DEFAULT_FLOORS.map(({ id }) => id);
export const MAINTAINED_HYBRID_GRASS_IDS = [
  'ground-grass',
  'ground-grass-b',
  'ground-grass-c',
] as const;

const TARGETS = [
  ...DEFAULT_FLOORS,
  ...MAINTAINED_HYBRID_GRASS_IDS.map((id) => {
    const target = DEFAULT_GROUND.find((candidate) => candidate.id === id);
    if (!target) throw new Error(`Missing default grass ground ${id}`);
    return target;
  }),
];

function esc(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function text(
  x: number,
  y: number,
  value: string,
  size = 12,
  weight = 600,
  fill = INK,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return (
    `<text x="${x}" y="${y}" fill="${fill}" ` +
    'font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" ' +
    `font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">` +
    `${esc(value)}</text>`
  );
}

function panel(
  x: number,
  y: number,
  width: number,
  height: number,
  fill = PANEL,
  radius = 12,
): string {
  return (
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" ` +
    `rx="${radius}" fill="${fill}" stroke="${RULE}" stroke-width="1.3"/>`
  );
}

function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  opacity = 1,
  radius = 0,
): string {
  return (
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" ` +
    `rx="${radius}" fill="${fill}" opacity="${opacity}"/>`
  );
}

function line(
  d: string,
  stroke: string,
  width = 1,
  opacity = 1,
  dash = '',
): string {
  return (
    `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" ` +
    `stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"` +
    `${dash ? ` stroke-dasharray="${dash}"` : ''}/>`
  );
}

function pathFill(d: string, fill: string, opacity = 1): string {
  return `<path d="${d}" fill="${fill}" opacity="${opacity}"/>`;
}

function circle(
  x: number,
  y: number,
  radius: number,
  fill: string,
  opacity = 1,
): string {
  return (
    `<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" ` +
    `opacity="${opacity}"/>`
  );
}

function ellipse(
  x: number,
  y: number,
  rx: number,
  ry: number,
  fill: string,
  opacity = 1,
): string {
  return (
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" ` +
    `fill="${fill}" opacity="${opacity}"/>`
  );
}

function shell(markup: string): string {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" ' +
    `viewBox="0 0 128 128">${markup}</svg>`
  );
}

function stripSvg(source: string): string {
  return source
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
}

function placedSvg(
  source: string,
  x: number,
  y: number,
  width: number,
  height = width,
): string {
  return (
    `<svg x="${x}" y="${y}" width="${width}" height="${height}" ` +
    `viewBox="0 0 128 128" overflow="hidden">${stripSvg(source)}</svg>`
  );
}

function repeatSvg(
  source: string,
  x: number,
  y: number,
  columns: number,
  rows: number,
  cell: number,
): string {
  const inner = stripSvg(source);
  const parts = [
    `<svg x="${x}" y="${y}" width="${columns * cell}" height="${rows * cell}" ` +
      `viewBox="0 0 ${columns * 128} ${rows * 128}" overflow="hidden">`,
  ];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      parts.push(
        `<g transform="translate(${column * 128} ${row * 128})">${inner}</g>`,
      );
    }
  }
  parts.push('</svg>');
  return parts.join('');
}

function mixedGrassRepeat(
  sources: readonly string[],
  x: number,
  y: number,
  columns: number,
  rows: number,
  cell: number,
): string {
  const inners = sources.map(stripSvg);
  const parts = [
    `<svg x="${x}" y="${y}" width="${columns * cell}" height="${rows * cell}" ` +
      `viewBox="0 0 ${columns * 128} ${rows * 128}" overflow="hidden">`,
  ];
  const sequence = [
    [0, 2, 1, 0, 1, 2, 0, 2, 1, 0, 2, 1],
    [1, 0, 2, 1, 2, 0, 1, 0, 2, 1, 0, 2],
    [2, 1, 0, 2, 0, 1, 2, 1, 0, 2, 1, 0],
  ];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const source = inners[sequence[row % sequence.length][column % 12]];
      parts.push(
        `<g transform="translate(${column * 128} ${row * 128})">${source}</g>`,
      );
    }
  }
  parts.push('</svg>');
  return parts.join('');
}

function instance(id: string): TileInstance {
  const target = [...DEFAULT_FLOORS, ...DEFAULT_GROUND].find(
    (candidate) => candidate.id === id,
  );
  if (!target) throw new Error(`Missing surface instance ${id}`);
  return target;
}

function templateLabel(target: TileInstance): string {
  return (
    FLOOR_TEMPLATES.find(({ id }) => id === target.templateId)?.label ??
    target.templateId
  );
}

function grid(
  spacing: number,
  stroke: string,
  opacity: number,
  width = 1,
): string {
  const segments: string[] = [];
  for (let value = 0; value <= 128; value += spacing) {
    segments.push(`M ${value} 0 V 128`, `M 0 ${value} H 128`);
  }
  return line(segments.join(' '), stroke, width, opacity);
}

function chips(secondary: string, accent: string, opacity = 0.48): string {
  const points = [
    [9, 14, 2.2, 1.7],
    [29, 31, 3.5, 2],
    [52, 12, 1.8, 3],
    [76, 27, 3, 2.2],
    [104, 12, 2.5, 1.8],
    [119, 39, 3.2, 2.2],
    [18, 61, 2.2, 3],
    [43, 79, 3.5, 2.2],
    [68, 58, 2, 2.8],
    [92, 76, 3, 1.8],
    [116, 92, 2.5, 3.2],
    [12, 111, 3.4, 2],
    [61, 108, 2.5, 3],
    [88, 119, 3.4, 1.8],
  ] as const;
  return points
    .map(([x, y, rx, ry], index) =>
      ellipse(x, y, rx, ry, index % 3 === 0 ? accent : secondary, opacity),
    )
    .join('');
}

function seededPoints(seed: number, count: number): Array<[number, number]> {
  let state = seed * 104729 + 48611;
  const points: Array<[number, number]> = [];
  for (let index = 0; index < count; index += 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const x = 5 + (state % 118);
    state = (state * 1664525 + 1013904223) >>> 0;
    const y = 5 + (state % 118);
    points.push([x, y]);
  }
  return points;
}

function wrappedMarks(
  points: readonly [number, number][],
  builder: (x: number, y: number, index: number) => string,
  padding = 8,
): string {
  const parts: string[] = [];
  points.forEach(([x, y], index) => {
    for (const dx of [-128, 0, 128]) {
      for (const dy of [-128, 0, 128]) {
        const px = x + dx;
        const py = y + dy;
        if (
          px >= -padding &&
          px <= 128 + padding &&
          py >= -padding &&
          py <= 128 + padding
        ) {
          parts.push(builder(px, py, index));
        }
      }
    }
  });
  return parts.join('');
}

function floorSource(target: TileInstance): string {
  const { primary, secondary, accent } = target.palette;
  const shapes: string[] = [rect(0, 0, 128, 128, primary)];

  switch (target.templateId) {
    case 'carpet': {
      const count = 14 + (target.params.speckle ?? 2) * 4;
      shapes.push(
        wrappedMarks(
          seededPoints(target.params.seed ?? 3, count),
          (x, y, index) =>
            line(
              `M ${x - 1.5} ${y} L ${x + 1.5} ${y + (index % 2 ? 0.7 : -0.7)}`,
              index % 3 === 0 ? accent : secondary,
              0.9,
              0.25,
            ),
          3,
        ),
      );
      break;
    }
    case 'carpet-tiles': {
      shapes.push(
        rect(64, 0, 64, 64, secondary, 0.09),
        rect(0, 64, 64, 64, secondary, 0.09),
        line('M 64 0 V 128 M 0 64 H 128', accent, 1.1, 0.16),
      );
      for (let value = 8; value < 64; value += 12) {
        shapes.push(
          line(`M ${value} 4 V 60 M ${value + 64} 68 V 124`, secondary, 0.7, 0.12),
          line(`M 68 ${value} H 124 M 4 ${value + 64} H 60`, accent, 0.7, 0.1),
        );
      }
      break;
    }
    case 'wood-floor': {
      const joints = [36, 83, 55, 105, 24, 70, 111, 47];
      for (let row = 0; row < 8; row += 1) {
        const y = row * 16;
        shapes.push(
          line(`M 0 ${y} H 128`, secondary, 1.1, 0.28),
          line(`M ${joints[row]} ${y} V ${y + 16}`, secondary, 1, 0.26),
          line(
            `M ${(joints[row] + 18) % 110 + 6} ${y + 5} h ${12 + (row % 3) * 5}`,
            accent,
            1.1,
            0.24,
          ),
        );
      }
      break;
    }
    case 'linoleum': {
      shapes.push(
        grid(64, secondary, 0.2, 1.1),
        rect(0, 0, 128, 9, '#FFFFFF', 0.055),
        line('M 18 91 q 10 -4 20 0 M 83 38 q 8 3 17 -1', accent, 1.2, 0.11),
      );
      break;
    }
    case 'utility-vinyl': {
      shapes.push(
        grid(target.params.grid ?? 32, secondary, 0.16, 1),
        rect(0, 0, 128, 8, '#FFFFFF', 0.045),
      );
      const count = (target.params.scuff ?? 2) * 4;
      shapes.push(
        wrappedMarks(
          seededPoints(target.params.seed ?? 4, count),
          (x, y, index) =>
            line(
              `M ${x - 3} ${y} q ${3 + (index % 4)} ${index % 2 ? -2 : 2} ${8 + (index % 3)} 0`,
              index % 3 === 0 ? accent : secondary,
              1.2,
              0.18,
            ),
          12,
        ),
      );
      break;
    }
    case 'quiet-carpet': {
      for (let value = -96; value <= 96; value += 32) {
        shapes.push(
          line(`M ${value} 0 L ${value + 128} 128`, secondary, 0.8, 0.1),
          line(`M ${value + 16} 128 L ${value + 144} 0`, accent, 0.7, 0.07),
        );
      }
      shapes.push(
        wrappedMarks(
          seededPoints(target.params.seed ?? 6, 10),
          (x, y) => circle(x, y, 0.9, secondary, 0.25),
          2,
        ),
      );
      break;
    }
    case 'terrazzo': {
      shapes.push(chips(secondary, accent, 0.48));
      break;
    }
    case 'rubber-mat': {
      const spacing = Math.max(12, 128 / (target.params.studs ?? 8));
      for (let y = spacing / 2; y < 128; y += spacing) {
        for (let x = spacing / 2; x < 128; x += spacing) {
          shapes.push(
            circle(x, y, 2.25, secondary, 0.56),
            circle(x - 0.6, y - 0.7, 0.8, '#FFFFFF', 0.08),
          );
        }
      }
      break;
    }
    case 'lobby-stone': {
      shapes.push(
        grid(target.params.slab ?? 64, secondary, 0.24, 1.3),
        pathFill(
          'M 0 28 C 23 17 38 39 62 29 S 103 18 128 28 L 128 35 C 104 25 87 46 62 35 S 25 24 0 35 Z',
          accent,
          0.055,
        ),
        line('M 17 106 C 37 91 47 116 70 99 S 104 91 128 102', accent, 1.5, 0.12),
      );
      break;
    }
    case 'polished-concrete': {
      shapes.push(
        grid(64, secondary, 0.18, 1.1),
        ellipse(31, 31, 22, 11, accent, 0.055),
        ellipse(103, 86, 28, 13, secondary, 0.065),
        line('M 4 117 C 31 107 45 118 69 109 S 103 105 128 114', accent, 1.1, 0.1),
      );
      break;
    }
    case 'accent-tile': {
      shapes.push(
        grid(target.params.grid ?? 32, secondary, 0.15, 1),
        rect(0, 57, 128, 14, secondary, 0.6),
        rect(0, 61, 128, 6, accent, 0.82),
      );
      for (let x = 16; x < 128; x += 32) {
        shapes.push(circle(x, 64, 2.1, primary, 0.85));
      }
      break;
    }
    case 'astroturf': {
      shapes.push(
        rect(32, 0, 32, 128, secondary, 0.13),
        rect(96, 0, 32, 128, secondary, 0.13),
      );
      for (let x = 5; x < 128; x += 9) {
        const offset = (x * 7) % 17;
        shapes.push(
          line(`M ${x} ${offset} v 8 M ${x} ${offset + 64} v 8`, accent, 0.9, 0.25),
        );
      }
      break;
    }
    default:
      shapes.push(grid(64, secondary, 0.14, 1));
  }

  return shell(shapes.join(''));
}

function grassSource(target: TileInstance): string {
  const { primary, secondary, accent } = target.palette;
  const seed = target.params.seed ?? 1;
  const bladeLevel = target.params.blades ?? 1;
  const flowerLevel = target.params.flowers ?? 0;
  const shapes = [
    rect(0, 0, 128, 128, primary),
    pathFill(
      'M 0 24 C 24 11 41 38 66 27 S 105 13 128 24 L 128 39 C 105 28 88 49 65 39 S 25 26 0 40 Z',
      secondary,
      0.045 + bladeLevel * 0.012,
    ),
    pathFill(
      'M 84 0 C 70 25 100 43 88 67 S 74 105 84 128 L 99 128 C 89 104 106 89 101 66 S 92 25 99 0 Z',
      accent,
      0.038 + bladeLevel * 0.008,
    ),
  ];

  const tuftCount = 8 + bladeLevel * 4;
  shapes.push(
    wrappedMarks(
      seededPoints(seed, tuftCount),
      (x, y, index) => {
        const tone = index % 3 === 0 ? accent : secondary;
        const height = 3.5 + (index % 3);
        return [
          line(`M ${x - 2.5} ${y + 2} L ${x} ${y - height}`, tone, 1, 0.48),
          line(`M ${x} ${y + 2} L ${x + 2.8} ${y - height + 1.5}`, tone, 1, 0.42),
        ].join('');
      },
      7,
    ),
  );

  const pinpricks = seededPoints(seed + 17, 18);
  shapes.push(
    wrappedMarks(
      pinpricks,
      (x, y, index) =>
        circle(x, y, index % 4 === 0 ? 1.1 : 0.75, index % 3 ? secondary : accent, 0.22),
      2,
    ),
  );

  if (flowerLevel > 0) {
    const flowers = seededPoints(seed + 31, 2 + flowerLevel);
    const flowerColors = ['#F2EED8', '#E8C84A', '#C08BD6'];
    shapes.push(
      wrappedMarks(
        flowers,
        (x, y, index) => circle(x, y, 1.25, flowerColors[index % 3], 0.7),
        2,
      ),
    );
  }

  return shell(shapes.join(''));
}

export function maintainedHybridSurfaceSvg(id: string): string {
  const target = instance(id);
  return MAINTAINED_HYBRID_GRASS_IDS.includes(
    id as (typeof MAINTAINED_HYBRID_GRASS_IDS)[number],
  )
    ? grassSource(target)
    : floorSource(target);
}

function currentSource(target: TileInstance): string {
  return composeFloorTile(target, DEFAULT_STYLE, AUTHORING_CANVAS);
}

function familyCard(
  target: TileInstance,
  x: number,
  y: number,
  width: number,
): string {
  const current = currentSource(target);
  const refined = maintainedHybridSurfaceSvg(target.id);
  const isGrass = MAINTAINED_HYBRID_GRASS_IDS.includes(
    target.id as (typeof MAINTAINED_HYBRID_GRASS_IDS)[number],
  );
  return [
    panel(x, y, width, 214, isGrass ? HYBRID : PANEL),
    text(x + 14, y + 24, target.name.toUpperCase(), 9.5, 840, GREEN),
    text(
      x + width - 14,
      y + 24,
      isGrass ? 'GROUND' : 'FLOOR',
      8,
      780,
      isGrass ? GREEN : CORAL,
      'end',
    ),
    text(x + 14, y + 44, 'CURRENT', 7.2, 760, MUTED),
    text(x + 114, y + 44, 'REFINED HYBRID', 7.2, 760, CORAL),
    placedSvg(current, x + 14, y + 52, 82),
    placedSvg(refined, x + 114, y + 45, 104),
    repeatSvg(refined, x + 238, y + 54, 4, 2, 34),
    text(x + 238, y + 132, '4×2 repeat', 7.2, 650, MUTED),
    text(x + 398, y + 61, templateLabel(target), 8.7, 760, INK),
    text(x + 398, y + 83, target.id, 7.8, 650, BLUE),
    text(
      x + 398,
      y + 108,
      isGrass ? 'living variation · sparse detail' : materialRule(target.templateId),
      7.5,
      610,
      MUTED,
    ),
    text(x + 14, y + 183, '128u · seamless · flat · outline-free', 7.4, 650, MUTED),
    text(x + width - 14, y + 183, 'proof pixels only', 7.4, 690, CORAL, 'end'),
  ].join('');
}

function materialRule(templateId: string): string {
  const rules: Record<string, string> = {
    carpet: 'fiber fleck before pattern',
    'carpet-tiles': 'replaceable nap-direction modules',
    'wood-floor': 'staggered planks and restrained grain',
    linoleum: 'broad sheet field and welded seams',
    'utility-vinyl': 'service grid with softened scuffs',
    'quiet-carpet': 'dense acoustic weave',
    terrazzo: 'mineral aggregate in warm binder',
    'rubber-mat': 'raised anti-fatigue studs',
    'lobby-stone': 'large institutional slabs and vein',
    'polished-concrete': 'clouded slab with quiet joints',
    'accent-tile': 'QuotaCo service stripe in tile field',
    astroturf: 'regular manufactured blade bands',
  };
  return rules[templateId] ?? 'material-first surface';
}

function placedCharacter(
  renderer: PropCalibrationRenderer,
  castIndex: number,
  x: number,
  y: number,
  cell: number,
  facing: 'south' | 'north' | 'east' | 'west' = 'south',
): string {
  const size = cell * 1.55 * CHARACTER_VISUAL_SCALE;
  const character = DEFAULT_CAST[castIndex % DEFAULT_CAST.length];
  return placedSvg(
    renderer.character(character, facing),
    x - size / 2,
    y - size * 0.86,
    size,
  );
}

function placedProp(
  renderer: PropCalibrationRenderer,
  id: string,
  x: number,
  y: number,
  cell: number,
): string {
  const size = cell * 2;
  return placedSvg(
    renderer.prop('current', id),
    x - size / 2,
    y - size * 0.78,
    size,
  );
}

function room(
  renderer: PropCalibrationRenderer,
  floorId: string,
  x: number,
  y: number,
  columns: number,
  rows: number,
  cell: number,
  props: readonly [string, number, number][],
  cast: readonly [number, number, number, 'south' | 'north' | 'east' | 'west'][],
): string {
  const surface = maintainedHybridSurfaceSvg(floorId);
  const parts = [repeatSvg(surface, x, y, columns, rows, cell)];
  parts.push(renderer.wallTile(6, x, y, cell));
  for (let column = 1; column < columns - 1; column += 1) {
    parts.push(renderer.wallTile(10, x + column * cell, y, cell));
  }
  parts.push(renderer.wallTile(12, x + (columns - 1) * cell, y, cell));
  for (let row = 1; row < rows; row += 1) {
    parts.push(
      renderer.wallTile(5, x, y + row * cell, cell),
      renderer.wallTile(5, x + (columns - 1) * cell, y + row * cell, cell, true),
    );
  }
  props.forEach(([id, px, py]) => {
    parts.push(placedProp(renderer, id, x + px * cell, y + py * cell, cell));
  });
  cast.forEach(([index, px, py, facing]) => {
    parts.push(
      placedCharacter(renderer, index, x + px * cell, y + py * cell, cell, facing),
    );
  });
  return parts.join('');
}

function contextSection(renderer: PropCalibrationRenderer): string {
  const y = 868;
  const roomY = y + 73;
  const grassSources = MAINTAINED_HYBRID_GRASS_IDS.map((id) =>
    maintainedHybridSurfaceSvg(id),
  );
  const grassX = 1845;
  const grassWidth = 11 * NORMAL_CELL;
  return [
    panel(MARGIN, y, WIDTH - MARGIN * 2, 720, PANEL_ALT),
    text(MARGIN + 16, y + 31, 'NORMAL GAMEPLAY CONTEXT · 52 PX / CELL', 13, 850, GREEN),
    text(
      WIDTH - MARGIN - 16,
      y + 31,
      'accepted walls + props + literal ×0.65 characters',
      8.5,
      680,
      MUTED,
      'end',
    ),
    text(50, y + 59, 'WORKSTATION · OFFICE CARPET', 8, 760, BLUE),
    room(
      renderer,
      'floor-carpet',
      50,
      roomY,
      7,
      5,
      NORMAL_CELL,
      [
        ['desk', 2.1, 2.15],
        ['office-chair', 3.2, 3.35],
        ['filing-cabinet', 5.45, 1.9],
      ],
      [
        [0, 3.9, 4.05, 'south'],
        [1, 5.7, 3.9, 'west'],
      ],
    ),
    text(460, y + 59, 'BREAK ROOM · LINOLEUM', 8, 760, BLUE),
    room(
      renderer,
      'floor-linoleum',
      460,
      roomY,
      7,
      5,
      NORMAL_CELL,
      [
        ['break-table', 3.0, 2.55],
        ['vending-machine', 5.45, 2.0],
      ],
      [
        [2, 2.2, 4.05, 'east'],
        [3, 4.55, 4.05, 'north'],
      ],
    ),
    text(870, y + 59, 'LOBBY · STONE + ACCENT THRESHOLD', 8, 760, BLUE),
    room(
      renderer,
      'floor-lobby-stone',
      870,
      roomY,
      7,
      5,
      NORMAL_CELL,
      [
        ['waiting-bench', 2.7, 2.45],
        ['potted-tree', 5.35, 2.7],
      ],
      [
        [4, 2.15, 4.08, 'east'],
        [5, 4.45, 4.08, 'west'],
      ],
    ),
    repeatSvg(
      maintainedHybridSurfaceSvg('floor-accent-tile'),
      870 + NORMAL_CELL,
      roomY + 4 * NORMAL_CELL,
      5,
      1,
      NORMAL_CELL,
    ),
    text(grassX, y + 59, 'MIXED GRASS FIELD · THREE EXISTING VARIANTS', 8, 760, BLUE),
    mixedGrassRepeat(grassSources, grassX, roomY, 11, 5, NORMAL_CELL),
    placedProp(renderer, 'park-bench', grassX + 4.1 * NORMAL_CELL, roomY + 3.75 * NORMAL_CELL, NORMAL_CELL),
    placedProp(renderer, 'tree-canopy', grassX + 8.8 * NORMAL_CELL, roomY + 3.75 * NORMAL_CELL, NORMAL_CELL),
    placedProp(renderer, 'lamp-post', grassX + 1.25 * NORMAL_CELL, roomY + 2.55 * NORMAL_CELL, NORMAL_CELL),
    placedCharacter(renderer, 6, grassX + 2.8 * NORMAL_CELL, roomY + 4.05 * NORMAL_CELL, NORMAL_CELL, 'east'),
    placedCharacter(renderer, 7, grassX + 6.4 * NORMAL_CELL, roomY + 4.15 * NORMAL_CELL, NORMAL_CELL, 'north'),
    text(50, roomY + 285, 'Floor material stays subordinate to interactions and silhouettes.', 7.7, 620, MUTED),
    text(
      grassX + grassWidth,
      roomY + 285,
      'Mixed variants break repetition without changing the three existing IDs.',
      7.7,
      620,
      MUTED,
      'end',
    ),
    text(MARGIN + 16, y + 402, 'FAR GAMEPLAY + REPEAT STRESS · 18 PX / CELL', 10, 820, GREEN),
    ...farStressRows(y + 426),
  ].join('');
}

function farStressRows(y: number): string[] {
  const parts: string[] = [];
  const columns = 4;
  const blockWidth = (WIDTH - MARGIN * 2 - 48) / columns;
  DEFAULT_FLOORS.forEach((target, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = MARGIN + 16 + column * (blockWidth + 10);
    const rowY = y + row * 72;
    parts.push(
      repeatSvg(maintainedHybridSurfaceSvg(target.id), x, rowY, 10, 2, FAR_CELL),
      text(x + 10 * FAR_CELL + 10, rowY + 15, target.name, 7.5, 680, INK),
      text(x + 10 * FAR_CELL + 10, rowY + 34, '10×2', 7, 600, MUTED),
    );
  });
  const grassY = y + 3 * 72;
  const grassSources = MAINTAINED_HYBRID_GRASS_IDS.map((id) =>
    maintainedHybridSurfaceSvg(id),
  );
  parts.push(
    mixedGrassRepeat(grassSources, MARGIN + 16, grassY, 20, 2, FAR_CELL),
    text(MARGIN + 16 + 20 * FAR_CELL + 12, grassY + 16, 'mixed grass variants · 20×2', 7.5, 680, INK),
    text(
      WIDTH - MARGIN - 16,
      grassY + 16,
      'No character multiplier applied to floor or ground art.',
      7.5,
      660,
      CORAL,
      'end',
    ),
  );
  return parts;
}

function approvalSection(): string {
  const y = 1606;
  return [
    panel(MARGIN, y, WIDTH - MARGIN * 2, 854, HYBRID),
    text(MARGIN + 18, y + 37, 'Maintained Hybrid · complete-family refinement gate', 17, 880, GREEN),
    text(
      MARGIN + 18,
      y + 67,
      'Institutional substrates remain legible; use appears as restrained wear; grass relies on sparse living detail and three existing variants instead of large repeated patches.',
      10.2,
      650,
      INK,
    ),
    text(MARGIN + 18, y + 114, 'FLOOR FAMILY RULES', 9.5, 820, BLUE),
    text(MARGIN + 18, y + 142, '• Material noun reads before ornament or wear.', 9, 620, INK),
    text(MARGIN + 18, y + 168, '• Replaceable modules use quiet seams; poured and sheet materials use fewer seams.', 9, 620, INK),
    text(MARGIN + 18, y + 194, '• QuotaCo accent color is reserved for thresholds and service cues.', 9, 620, INK),
    text(MARGIN + 18, y + 220, '• No tile outline, contact shadow, bevel, or character-scale multiplier.', 9, 620, INK),
    text(MARGIN + 1040, y + 114, 'GRASS FAMILY RULES', 9.5, 820, BLUE),
    text(MARGIN + 1040, y + 142, '• Large repeating ovals from the direction proof are removed.', 9, 620, INK),
    text(MARGIN + 1040, y + 168, '• Lawn, deep, and soft-field variants differ by density and palette—not scale.', 9, 620, INK),
    text(MARGIN + 1040, y + 194, '• Tufts and flowers remain sparse enough to survive prop and employee occlusion.', 9, 620, INK),
    text(MARGIN + 1040, y + 220, '• Mixed use of the three existing IDs supplies low-frequency field variation.', 9, 620, INK),
    text(MARGIN + 2050, y + 114, 'HELD CONTRACTS', 9.5, 820, BLUE),
    text(MARGIN + 2050, y + 142, '128u one-cell authoring frame · seamless wrapping', 9, 620, INK),
    text(MARGIN + 2050, y + 168, 'template IDs · instance IDs · params · palettes', 9, 620, INK),
    text(MARGIN + 2050, y + 194, 'floor/ground export separation · atlas cells', 9, 620, INK),
    text(MARGIN + 2050, y + 220, `schema ${CURRENT_SCHEMA_VERSION} · Unity registration unchanged`, 9, 620, INK),
    text(MARGIN + 18, y + 286, 'NEXT APPROVAL DECISION', 10, 840, GREEN),
    text(
      MARGIN + 18,
      y + 315,
      'Approve, revise selected materials, or reject. Approval authorizes genuine artist-editable SVG source creation and importer design—not export or Unity promotion.',
      10,
      650,
      INK,
    ),
    text(MARGIN + 18, y + 370, 'DEFERRED DEPENDENCY', 9.5, 820, BLUE),
    text(
      MARGIN + 18,
      y + 398,
      'The derived 47-frame grass-fringe remains code-owned. After the base grass source is accepted, it must inherit these palettes and edge-density rules in a separate proof.',
      9.2,
      620,
      MUTED,
    ),
    text(MARGIN + 18, y + 452, 'NOT PERFORMED', 9.5, 820, CORAL),
    text(
      MARGIN + 18,
      y + 480,
      'no standalone floor/ground SVG files · no template/default mutation · no snapshot promotion · no exporter/contract/schema change · no bundle export/import · no Unity change · no commit',
      9.2,
      640,
      MUTED,
    ),
    text(MARGIN + 18, y + 550, 'VISUAL REVIEW CHECKS', 9.5, 820, GREEN),
    text(MARGIN + 18, y + 580, '1. Do all 12 floor materials read as different physical surfaces?', 9.2, 640, INK),
    text(MARGIN + 18, y + 608, '2. Do seams clarify construction without turning the room into a grid overlay?', 9.2, 640, INK),
    text(MARGIN + 18, y + 636, '3. Does the grass feel living and soft without becoming noisy behind props?', 9.2, 640, INK),
    text(MARGIN + 18, y + 664, '4. Does the three-variant field hide repetition at normal and far zoom?', 9.2, 640, INK),
    text(
      WIDTH - MARGIN - 18,
      y + 815,
      'STOP FOR COMPLETE-FAMILY VISUAL APPROVAL',
      10,
      840,
      CORAL,
      'end',
    ),
  ].join('');
}

function sheet(renderer: PropCalibrationRenderer): string {
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" ` +
      `viewBox="0 0 ${WIDTH} ${HEIGHT}">`,
    rect(0, 0, WIDTH, HEIGHT, PAGE),
    text(MARGIN, 42, 'QuotaCo floors + grass · Maintained Hybrid refinement', 24, 900, INK),
    text(
      MARGIN,
      68,
      'APPROVED DIRECTION · COMPLETE 12-FLOOR + 3-GRASS PROOF · NO SOURCE OR PRODUCTION PROMOTION',
      10.5,
      780,
      CORAL,
    ),
    text(
      WIDTH - MARGIN,
      39,
      'current code output → refined proof pixels',
      9.5,
      720,
      GREEN,
      'end',
    ),
    text(
      WIDTH - MARGIN,
      64,
      `128u tiles · 112u wall datum · characters ×0.65 · schema ${CURRENT_SCHEMA_VERSION}`,
      8.5,
      620,
      MUTED,
      'end',
    ),
    panel(MARGIN, 88, WIDTH - MARGIN * 2, 756, PANEL_ALT),
    text(MARGIN + 16, 116, 'COMPLETE FAMILY · CURRENT VERSUS REFINED HYBRID', 13, 850, GREEN),
    text(
      WIDTH - MARGIN - 16,
      116,
      '15 existing instances · zero new IDs · zero standalone source SVGs',
      8.5,
      680,
      CORAL,
      'end',
    ),
  ];

  const available = WIDTH - MARGIN * 2 - 24;
  const gap = 10;
  const cardWidth = (available - gap * 4) / 5;
  TARGETS.forEach((target, index) => {
    const column = index % 5;
    const row = Math.floor(index / 5);
    parts.push(
      familyCard(
        target,
        MARGIN + 12 + column * (cardWidth + gap),
        130 + row * 232,
        cardWidth,
      ),
    );
  });

  parts.push(contextSection(renderer), approvalSection(), '</svg>');
  return parts.join('');
}

function metrics(): object {
  return {
    reviewStatus: 'approved-direction-complete-family-refinement',
    approvedDirection: 'maintained-hybrid',
    sourceStatus: 'proof-code-only',
    inventory: {
      floorTemplateCount: FLOOR_TEMPLATES.length,
      interiorFloorInstanceCount: DEFAULT_FLOORS.length,
      groundTemplateCount: GROUND_TEMPLATE_IDS.length,
      groundInstanceCount: DEFAULT_GROUND.length,
      targetInteriorFloorIds: MAINTAINED_HYBRID_FLOOR_IDS,
      targetGrassGroundIds: MAINTAINED_HYBRID_GRASS_IDS,
      newIdsCreated: 0,
    },
    refinements: {
      allTargetInstancesRendered: true,
      currentVersusProposal: true,
      close128u: true,
      normal52pxPerCell: true,
      far18pxPerCell: true,
      repeatStress: true,
      mixedGrassVariantField: true,
      largeRepeatedGrassPatchesRemoved: true,
    },
    held: {
      authoringCanvas: AUTHORING_CANVAS,
      acceptedWallDatum: WALL_DATUM,
      characterVisualScale: CHARACTER_VISUAL_SCALE,
      floorGroundCharacterMultiplierApplied: false,
      templateIds: true,
      instanceIds: true,
      params: true,
      palettes: true,
      floorGroundExportKinds: true,
      atlasCells: true,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      schemaMutation: false,
      exporterMutation: false,
      unityRegistrationMutation: false,
      productionSourceCreation: false,
      templateDefaultMutation: false,
      snapshotPromotion: false,
      bundleExportImport: false,
      commitCreated: false,
    },
    deferred: {
      grassFringe: {
        currentOwnership: 'derived-code',
        autotileFrames: 47,
        reason: 'base grass source must be visually approved first',
      },
      nonTargetGroundFamilies: [
        'meadow',
        'dirt',
        'asphalt',
        'sidewalk',
        'gravel',
        'pond-water',
      ],
    },
  };
}

function notes(): string {
  return [
    '# QuotaCo floor and grass Maintained Hybrid refinement',
    '',
    'Status: **complete-family visual proof; no source or production promotion**',
    '',
    'Maintained Hybrid is the approved direction. This proof refines all 12 existing interior floor instances and all three existing grass instances without creating new IDs.',
    '',
    'The grass revision removes the conspicuous large repeating ovals from the direction sheet. It uses sparse tufts, very quiet seamless field bands, and the three existing variants to create low-frequency variation.',
    '',
    'Approval of this sheet authorizes the next source-authoring step: genuine hand-editable SVG files plus an importer design that preserves existing parameters and palettes. It does not authorize export, schema, bundle, Unity, or commit changes.',
    '',
    'The derived 47-frame grass fringe remains deferred until the base grass source is accepted.',
  ].join('\n');
}

export async function renderQuotaCoFloorGrassHybridRefinement(
  output = path.join('docs', 'previews'),
): Promise<{
  readonly svgPath: string;
  readonly pngPath: string;
  readonly metricsPath: string;
  readonly notesPath: string;
}> {
  const renderer = new PropCalibrationRenderer(new Map());
  const source = sheet(renderer);
  const png = new Resvg(source, {
    font: { loadSystemFonts: true },
  }).render().asPng();
  await mkdir(output, { recursive: true });
  const base = 'quota-co-floor-grass-maintained-hybrid-refinement-v1';
  const svgPath = path.join(output, `${base}.svg`);
  const pngPath = path.join(output, `${base}.png`);
  const metricsPath = path.join(output, `${base}-metrics.json`);
  const notesPath = path.join(output, `${base}.md`);
  await writeFile(svgPath, source, 'utf8');
  await writeFile(pngPath, png);
  await writeFile(metricsPath, `${JSON.stringify(metrics(), null, 2)}\n`, 'utf8');
  await writeFile(notesPath, `${notes()}\n`, 'utf8');
  return { svgPath, pngPath, metricsPath, notesPath };
}

function outputFrom(argv: readonly string[]): string {
  const index = argv.indexOf('--out');
  return index >= 0 && argv[index + 1]
    ? path.resolve(argv[index + 1])
    : path.resolve('docs', 'previews');
}

if (
  process.argv[1]?.endsWith(
    'quotaCoFloorGrassHybridRefinementPreview.ts',
  )
) {
  renderQuotaCoFloorGrassHybridRefinement(outputFrom(process.argv.slice(2)))
    .then(({ svgPath, pngPath, metricsPath, notesPath }) => {
      process.stdout.write(
        'Wrote QuotaCo floor/grass Maintained Hybrid refinement:\n' +
        `${svgPath}\n${pngPath}\n${metricsPath}\n${notesPath}\n`,
      );
    })
    .catch((error: unknown) => {
      process.stderr.write(
        `${error instanceof Error ? error.message : String(error)}\n`,
      );
      process.exitCode = 1;
    });
}
