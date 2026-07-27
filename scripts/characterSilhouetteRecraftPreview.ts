/**
 * Review-only character silhouette recraft.
 *
 *   npx tsx scripts/characterSilhouetteRecraftPreview.ts [outDir]
 *
 * This script deliberately does not read or write canonical part sources.
 * It compares the production baseline with five topology proposals, then
 * installs the proposals in a schematic gameplay-scale QuotaCo room.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';

import { composeCharacter } from '../src/core/compositor';
import type { CharacterRecipe, StyleSheet } from '../src/core/types';
import { DEFAULT_STYLE } from '../src/data/defaults';
import { BODY_ARCHETYPES } from '../src/parts/bodyArchetypes';

type Facing = 'south' | 'east';

interface CandidateFacing {
  outer: string[];
  cutouts?: string[];
}

interface Candidate {
  id: string;
  label: string;
  intent: string;
  axes: string;
  south: CandidateFacing;
  east: CandidateFacing;
}

const CANVAS = 128;
const COLORS = {
  page: '#F4F1E9',
  panel: '#FFFEFA',
  panelAlt: '#E9E4D8',
  ink: '#252A28',
  muted: '#657075',
  grid: '#CEC6B7',
  cream: '#D9D0B9',
  creamLight: '#EEE7D7',
  green: '#294B3C',
  coral: '#B85E4A',
  floor: '#B9B19B',
  floorDark: '#A49C88',
  deskTop: '#D9D0B9',
  deskFront: '#294B3C',
  chair: '#6E746D',
} as const;

const BLACK_STYLE: StyleSheet = {
  ...structuredClone(DEFAULT_STYLE),
  outline: { ...DEFAULT_STYLE.outline, color: COLORS.ink, width: 0 },
  render: { ...DEFAULT_STYLE.render, contactShadow: 0 },
};

const BLACK_PALETTE = {
  skin: COLORS.ink,
  hair: COLORS.ink,
  outfitPrimary: COLORS.ink,
  outfitSecondary: COLORS.ink,
  accent: COLORS.ink,
};

function headSouth(cx: number, cy: number): string {
  return [
    `M ${cx - 14} ${cy - 10}`,
    `C ${cx - 12} ${cy - 18} ${cx + 10} ${cy - 19} ${cx + 14} ${cy - 9}`,
    `C ${cx + 17} ${cy - 1} ${cx + 12} ${cy + 13} ${cx} ${cy + 16}`,
    `C ${cx - 12} ${cy + 13} ${cx - 17} ${cy - 1} ${cx - 14} ${cy - 10} Z`,
  ].join(' ');
}

function headEast(cx: number, cy: number): string {
  return [
    `M ${cx - 12} ${cy - 11}`,
    `C ${cx - 5} ${cy - 18} ${cx + 10} ${cy - 16} ${cx + 14} ${cy - 6}`,
    `L ${cx + 17} ${cy - 1}`,
    `L ${cx + 12} ${cy + 2}`,
    `C ${cx + 9} ${cy + 13} ${cx - 4} ${cy + 16} ${cx - 12} ${cy + 9}`,
    `C ${cx - 17} ${cy + 3} ${cx - 17} ${cy - 5} ${cx - 12} ${cy - 11} Z`,
  ].join(' ');
}

const CANDIDATES: Candidate[] = [
  {
    id: 'column',
    label: 'A · Column',
    intent: 'Narrow vertical rhythm · exposed neck · long separated arms',
    axes: 'neck / shoulder slope / arm gaps / tight stance',
    south: {
      outer: [
        headSouth(64, 25),
        'M 59 39 L 69 39 L 70 48 L 58 48 Z',
        'M 49 47 Q 64 42 79 47 L 76 83 Q 72 88 68 88 L 60 88 Q 55 87 52 82 Z',
        'M 49 49 Q 44 51 43 58 L 42 84 Q 43 90 48 91 Q 53 89 52 83 L 54 59 Z',
        'M 79 49 Q 84 51 85 58 L 86 84 Q 85 90 80 91 Q 75 89 76 83 L 74 59 Z',
        'M 54 84 L 64 84 L 63 112 L 49 115 Q 47 112 52 108 Z',
        'M 64 84 L 74 84 L 76 108 Q 81 112 79 115 L 65 112 Z',
      ],
    },
    east: {
      outer: [
        headEast(68, 25),
        'M 61 39 L 69 39 L 70 48 L 60 48 Z',
        'M 56 47 Q 66 43 73 48 Q 78 61 75 83 Q 71 89 61 88 Q 55 84 55 70 Z',
        'M 57 50 Q 51 54 51 62 L 53 85 Q 55 90 60 88 L 61 83 L 59 62 Z',
        'M 64 84 L 72 84 L 73 109 L 83 113 Q 83 116 78 116 L 62 112 Z',
        'M 57 84 L 65 84 L 63 112 L 53 115 Q 50 113 54 109 Z',
      ],
    },
  },
  {
    id: 'block',
    label: 'B · Block',
    intent: 'Low-set head · hard shoulder shelf · short rectangular mass',
    axes: 'head inset / square shoulder / short arms / broad stance',
    south: {
      outer: [
        headSouth(64, 31),
        'M 55 43 L 73 43 L 76 49 L 52 49 Z',
        'M 35 50 Q 41 45 52 45 L 76 45 Q 87 45 93 50 L 89 84 Q 84 91 75 91 L 53 91 Q 44 91 39 84 Z',
        'M 36 52 Q 29 57 29 68 L 30 86 Q 32 92 38 91 Q 43 88 41 82 L 42 61 Z',
        'M 92 52 Q 99 57 99 68 L 98 86 Q 96 92 90 91 Q 85 88 87 82 L 86 61 Z',
        'M 42 84 L 61 84 L 60 108 L 39 113 Q 36 109 42 105 Z',
        'M 67 84 L 86 84 L 86 105 Q 92 109 89 113 L 68 108 Z',
      ],
    },
    east: {
      outer: [
        headEast(69, 31),
        'M 57 44 L 72 44 L 74 51 L 55 51 Z',
        'M 46 49 Q 57 44 75 48 Q 86 56 86 70 L 82 85 Q 77 92 58 91 Q 48 88 45 78 Z',
        'M 48 54 Q 40 61 41 73 L 45 88 Q 48 93 54 90 L 54 83 L 50 68 Z',
        'M 57 84 L 72 84 L 71 108 L 88 112 Q 90 116 83 116 L 56 111 Z',
        'M 48 84 L 61 84 L 57 111 L 44 114 Q 41 111 46 107 Z',
      ],
    },
  },
  {
    id: 'wedge',
    label: 'C · Wedge',
    intent: 'Broad sloping shoulders · strong taper · narrow lower footprint',
    axes: 'shoulder span / diagonal arms / waist taper / narrow stance',
    south: {
      outer: [
        headSouth(64, 25),
        'M 56 39 L 72 39 L 75 48 L 53 48 Z',
        'M 31 49 Q 43 43 55 44 L 73 44 Q 85 43 97 49 L 83 78 Q 78 86 72 89 L 56 89 Q 50 86 45 78 Z',
        'M 32 49 L 23 56 L 34 88 Q 37 94 43 91 Q 47 87 43 82 L 39 60 Z',
        'M 96 49 L 105 56 L 94 88 Q 91 94 85 91 Q 81 87 85 82 L 89 60 Z',
        'M 55 84 L 65 84 L 63 110 L 50 114 Q 48 111 53 107 Z',
        'M 63 84 L 73 84 L 75 107 Q 80 111 78 114 L 65 110 Z',
      ],
    },
    east: {
      outer: [
        headEast(69, 25),
        'M 58 39 L 71 39 L 73 48 L 56 48 Z',
        'M 40 49 Q 55 42 75 47 L 91 56 L 79 79 Q 74 88 59 89 Q 52 83 49 70 Z',
        'M 42 50 L 32 59 L 47 88 Q 51 94 57 89 L 55 82 L 44 62 Z',
        'M 58 84 L 68 84 L 66 111 L 54 114 Q 51 111 56 107 Z',
        'M 67 84 L 76 84 L 78 108 L 88 112 Q 90 115 84 116 L 68 111 Z',
      ],
    },
  },
  {
    id: 'bell',
    label: 'D · Bell',
    intent: 'Narrow upper mass · low wide center · outward lower contour',
    axes: 'small shoulder / low center / concave arms / wide footprint',
    south: {
      outer: [
        headSouth(64, 29),
        'M 57 42 L 71 42 L 73 50 L 55 50 Z',
        'M 48 49 Q 64 45 80 49 Q 85 61 89 72 Q 94 84 86 94 Q 78 99 64 98 Q 50 99 42 94 Q 34 84 39 72 Q 43 61 48 49 Z',
        'M 47 52 Q 39 56 36 65 L 31 86 Q 31 94 38 96 Q 44 96 46 89 L 44 80 L 49 62 Z',
        'M 81 52 Q 89 56 92 65 L 97 86 Q 97 94 90 96 Q 84 96 82 89 L 84 80 L 79 62 Z',
        'M 43 90 L 61 90 L 59 109 L 37 114 Q 34 111 40 106 Z',
        'M 67 90 L 85 90 L 88 106 Q 94 111 91 114 L 69 109 Z',
      ],
    },
    east: {
      outer: [
        headEast(70, 29),
        'M 59 42 L 71 42 L 73 50 L 57 50 Z',
        'M 50 49 Q 62 45 75 50 Q 82 60 86 73 Q 91 88 82 96 Q 72 100 57 96 Q 48 90 46 78 Q 46 62 50 49 Z',
        'M 50 54 Q 43 60 42 70 L 43 89 Q 45 96 52 96 Q 58 93 56 87 L 53 73 L 56 61 Z',
        'M 56 91 L 70 91 L 67 111 L 50 115 Q 47 112 53 107 Z',
        'M 69 91 L 82 91 L 84 108 L 94 112 Q 96 115 90 116 L 70 112 Z',
      ],
    },
  },
  {
    id: 'joint',
    label: 'E · Joint',
    intent: 'Articulated middle · visible neck · stepped waist · neutral stance',
    axes: 'neck break / arm gaps / waist step / split stance',
    south: {
      outer: [
        headSouth(64, 26),
        'M 57 40 L 71 40 L 73 48 L 55 48 Z',
        'M 45 49 Q 52 43 59 45 L 69 45 Q 76 43 83 49 L 79 64 L 76 84 Q 70 90 64 88 Q 58 90 52 84 L 49 64 Z',
        'M 45 50 Q 38 54 38 63 L 40 86 Q 42 92 48 91 Q 53 88 50 82 L 51 62 Z',
        'M 83 50 Q 90 54 90 63 L 88 86 Q 86 92 80 91 Q 75 88 78 82 L 77 62 Z',
        'M 52 83 L 63 86 L 61 110 L 46 114 Q 43 111 49 107 Z',
        'M 65 86 L 76 83 L 79 107 Q 85 111 82 114 L 67 110 Z',
      ],
    },
    east: {
      outer: [
        headEast(69, 26),
        'M 58 40 L 70 40 L 72 48 L 56 48 Z',
        'M 49 49 Q 59 43 73 47 Q 81 56 79 67 L 75 84 Q 69 90 57 88 Q 51 83 50 72 Z',
        'M 50 51 Q 43 56 43 65 L 46 87 Q 49 93 55 90 Q 59 87 56 81 L 55 64 L 61 54 Z',
        'M 58 83 L 68 86 L 65 111 L 51 114 Q 48 111 54 107 Z',
        'M 68 86 L 77 83 L 80 108 L 91 112 Q 93 115 87 116 L 69 111 Z',
      ],
    },
  },
];

const CANDIDATE_BOUNDS: Record<
  string,
  Record<Facing, readonly [minX: number, minY: number, maxX: number, maxY: number]>
> = {
  column: { south: [42, 7, 86, 115], east: [51, 7, 83, 116] },
  block: { south: [29, 13, 99, 113], east: [40, 13, 90, 116] },
  wedge: { south: [23, 7, 105, 114], east: [32, 7, 91, 116] },
  bell: { south: [31, 11, 97, 114], east: [42, 11, 96, 116] },
  joint: { south: [38, 8, 90, 114], east: [43, 8, 93, 116] },
};

function text(
  x: number,
  y: number,
  value: string,
  size = 14,
  weight = 400,
  fill: string = COLORS.ink,
  anchor: 'start' | 'middle' = 'start',
): string {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="system-ui, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${value}</text>`;
}

function svgInner(svg: string): string {
  return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

function baselineRecipe(bodyId: string, label: string): CharacterRecipe {
  return {
    id: `silhouette-baseline-${bodyId}`,
    name: label,
    parts: {
      body: bodyId,
      head: 'head-round',
      hair: 'hair-side-part',
      outfit: 'outfit-tee',
      accessories: [],
    },
    palette: BLACK_PALETTE,
  };
}

function baselineFigure(
  bodyId: string,
  label: string,
  facing: Facing,
  x: number,
  y: number,
  size: number,
): string {
  const svg = composeCharacter(
    baselineRecipe(bodyId, label),
    BLACK_STYLE,
    facing,
    CANVAS,
    'normal',
    { badge: false, pose: 'neutral' },
  );
  return `<g transform="translate(${x} ${y}) scale(${size / CANVAS})">${svgInner(svg)}</g>`;
}

function proposalFigure(
  candidate: Candidate,
  facing: Facing,
  x: number,
  y: number,
  size: number,
  fill: string = COLORS.ink,
  cutoutFill: string = COLORS.panel,
): string {
  const spec = candidate[facing];
  const paths = spec.outer.map((d) => `<path d="${d}" fill="${fill}"/>`).join('');
  const cutouts = (spec.cutouts ?? [])
    .map((d) => `<path d="${d}" fill="${cutoutFill}"/>`)
    .join('');
  return `<g transform="translate(${x} ${y}) scale(${size / CANVAS})">${paths}${cutouts}</g>`;
}

function normalizedProposalFigure(
  candidate: Candidate,
  facing: Facing,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string = COLORS.ink,
  cutoutFill: string = COLORS.panel,
): string {
  const spec = candidate[facing];
  const [minX, minY, maxX, maxY] = CANDIDATE_BOUNDS[candidate.id][facing];
  const scale = height / (maxY - minY);
  const renderedWidth = (maxX - minX) * scale;
  const offsetX = x + (width - renderedWidth) / 2;
  const paths = spec.outer.map((d) => `<path d="${d}" fill="${fill}"/>`).join('');
  const cutouts = (spec.cutouts ?? [])
    .map((d) => `<path d="${d}" fill="${cutoutFill}"/>`)
    .join('');
  return `<g transform="translate(${offsetX} ${y}) scale(${scale}) translate(${-minX} ${-minY})">${paths}${cutouts}</g>`;
}

function panel(x: number, y: number, width: number, height: number, fill: string = COLORS.panel): string {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="${fill}" stroke="${COLORS.grid}"/>`;
}

function directionSheet(): string {
  const width = 1500;
  const height = 1260;
  const parts: string[] = [`<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`];

  parts.push(text(32, 42, 'Character silhouette recraft · direction proof v1', 25, 750));
  parts.push(text(32, 70, 'REVIEW ONLY · same anonymous head, hair, garment, palette, and neutral state · no production part changes', 13, 650, COLORS.coral));

  parts.push(text(32, 112, 'Current production baseline · 40 px', 17, 700));
  parts.push(text(32, 135, 'The five authored bodies still collapse into one centered rounded-pawn topology.', 12, 400, COLORS.muted));
  const baselineX = 590;
  BODY_ARCHETYPES.forEach((archetype, index) => {
    const x = baselineX + index * 142;
    parts.push(panel(x, 92, 116, 96));
    parts.push(baselineFigure(archetype.part.id, archetype.label, 'south', x + 38, 102, 40));
    parts.push(text(x + 58, 177, archetype.label.replace('-frame', ''), 10, 600, COLORS.muted, 'middle'));
  });

  parts.push(text(32, 232, 'Proposed topology vocabulary', 20, 750));
  parts.push(text(32, 257, 'The labels describe shape construction only. They are not body IDs, personalities, jobs, or approved replacements.', 12, 400, COLORS.muted));

  const headerY = 300;
  const columns = [
    { facing: 'south' as const, size: 128, x: 350, label: 'south · native' },
    { facing: 'east' as const, size: 128, x: 500, label: 'east · native' },
    { facing: 'south' as const, size: 64, x: 690, label: 'south · 64 px' },
    { facing: 'east' as const, size: 64, x: 800, label: 'east · 64 px' },
    { facing: 'south' as const, size: 40, x: 955, label: 'south · 40 px' },
    { facing: 'east' as const, size: 40, x: 1045, label: 'east · 40 px' },
  ];
  columns.forEach((column) => parts.push(text(column.x + 64, headerY, column.label, 11, 650, COLORS.muted, 'middle')));
  parts.push(text(1245, headerY, 'changed silhouette axes', 11, 650, COLORS.muted, 'middle'));

  CANDIDATES.forEach((candidate, row) => {
    const y = 322 + row * 166;
    parts.push(`<rect x="20" y="${y}" width="${width - 40}" height="154" rx="10" fill="${row % 2 === 0 ? COLORS.panel : COLORS.panelAlt}"/>`);
    parts.push(text(36, y + 38, candidate.label, 18, 750));
    parts.push(text(36, y + 63, candidate.intent, 11, 500, COLORS.muted));
    parts.push(text(36, y + 86, candidate.axes, 11, 650, COLORS.green));

    columns.forEach((column) => {
      const box = column.size === 128 ? 136 : column.size === 64 ? 86 : 68;
      const px = column.x + (128 - box) / 2;
      const py = y + 9 + (136 - box) / 2;
      parts.push(`<rect x="${px}" y="${py}" width="${box}" height="${box}" rx="6" fill="${COLORS.panel}" stroke="${COLORS.grid}"/>`);
      const dx = px + (box - column.size) / 2;
      const dy = py + (box - column.size) / 2;
      parts.push(proposalFigure(candidate, column.facing, dx, dy, column.size));
    });

    const axisX = 1168;
    const axisLines = candidate.axes.split(' / ');
    axisLines.forEach((axis, index) => {
      parts.push(`<circle cx="${axisX}" cy="${y + 35 + index * 24}" r="3.5" fill="${COLORS.coral}"/>`);
      parts.push(text(axisX + 12, y + 39 + index * 24, axis, 11, 600, COLORS.ink));
    });
  });

  const gateY = 1178;
  parts.push(text(32, gateY, 'Visual gate', 16, 750));
  parts.push(text(140, gateY, 'Match across facings without labels · distinguish all five at 40 px · retain identity behind desk-height occlusion · read as one population', 12, 550, COLORS.muted));
  parts.push(text(32, 1214, 'QuotaCo repeats. People interrupt the repetition.', 18, 750, COLORS.green));
  parts.push(text(32, 1240, 'Passing this sheet does not promote production art.', 11, 600, COLORS.coral));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function roomShell(x: number, y: number, width: number, height: number): string {
  const floorX = x + 34;
  const floorY = y + 64;
  const floorW = width - 68;
  const floorH = height - 104;
  const parts: string[] = [];
  parts.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="12" fill="${COLORS.panel}" stroke="${COLORS.grid}"/>`);
  parts.push(`<rect x="${floorX}" y="${floorY}" width="${floorW}" height="${floorH}" fill="${COLORS.floor}"/>`);
  for (let gx = floorX; gx <= floorX + floorW; gx += 48) {
    parts.push(`<path d="M ${gx} ${floorY} V ${floorY + floorH}" stroke="${COLORS.floorDark}" stroke-width="1" opacity="0.35"/>`);
  }
  for (let gy = floorY; gy <= floorY + floorH; gy += 48) {
    parts.push(`<path d="M ${floorX} ${gy} H ${floorX + floorW}" stroke="${COLORS.floorDark}" stroke-width="1" opacity="0.35"/>`);
  }
  parts.push(`<path d="M ${floorX} ${floorY + floorH} V ${floorY - 22} H ${floorX + floorW}" fill="none" stroke="${COLORS.ink}" stroke-width="18" stroke-linejoin="round"/>`);
  parts.push(`<path d="M ${floorX} ${floorY + floorH} V ${floorY - 22} H ${floorX + floorW}" fill="none" stroke="${COLORS.cream}" stroke-width="12" stroke-linejoin="round"/>`);
  parts.push(`<path d="M ${floorX - 7} ${floorY + floorH} H ${floorX + floorW + 7}" stroke="${COLORS.ink}" stroke-width="14"/>`);
  parts.push(`<path d="M ${floorX - 3} ${floorY + floorH - 4} H ${floorX + floorW + 3}" stroke="${COLORS.green}" stroke-width="7"/>`);
  parts.push(`<path d="M ${floorX} ${floorY + floorH - 10} H ${floorX + floorW}" stroke="${COLORS.coral}" stroke-width="3"/>`);
  return parts.join('');
}

function desk(x: number, y: number, width = 96): string {
  return [
    `<rect x="${x}" y="${y}" width="${width}" height="34" rx="7" fill="${COLORS.ink}"/>`,
    `<rect x="${x + 4}" y="${y + 3}" width="${width - 8}" height="22" rx="5" fill="${COLORS.deskTop}"/>`,
    `<path d="M ${x + 5} ${y + 22} H ${x + width - 5} V ${y + 36} H ${x + 5} Z" fill="${COLORS.deskFront}"/>`,
    `<rect x="${x + width - 21}" y="${y + 27}" width="10" height="5" rx="2" fill="${COLORS.coral}"/>`,
  ].join('');
}

function chair(x: number, y: number): string {
  return [
    `<ellipse cx="${x}" cy="${y + 9}" rx="18" ry="11" fill="${COLORS.ink}"/>`,
    `<ellipse cx="${x}" cy="${y + 7}" rx="14" ry="8" fill="${COLORS.chair}"/>`,
    `<path d="M ${x} ${y + 15} V ${y + 27} M ${x - 10} ${y + 27} H ${x + 10}" stroke="${COLORS.ink}" stroke-width="4" stroke-linecap="round"/>`,
  ].join('');
}

function roomSheet(): string {
  const width = 1500;
  const height = 1060;
  const parts: string[] = [`<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`];
  parts.push(text(32, 42, 'Character silhouette recraft · composed room gate v1', 25, 750));
  parts.push(text(32, 70, 'REVIEW ONLY · figures are 40–48 px · one flat ink color · no names, palette identities, props, or action poses', 13, 650, COLORS.coral));

  const roomY = 104;
  parts.push(roomShell(24, roomY, 920, 824));
  parts.push(text(52, roomY + 28, 'Compact office · clear floor + workstation occlusion', 16, 700));

  const figures = [
    { candidate: CANDIDATES[0], facing: 'south' as const, x: 156, y: 258, size: 48 },
    { candidate: CANDIDATES[1], facing: 'east' as const, x: 345, y: 373, size: 46 },
    { candidate: CANDIDATES[2], facing: 'south' as const, x: 567, y: 226, size: 44 },
    { candidate: CANDIDATES[3], facing: 'east' as const, x: 712, y: 426, size: 48 },
    { candidate: CANDIDATES[4], facing: 'south' as const, x: 455, y: 548, size: 46 },
  ];

  parts.push(desk(118, 306, 116));
  parts.push(chair(178, 352));
  parts.push(desk(325, 421, 116));
  parts.push(chair(384, 467));
  parts.push(desk(552, 274, 116));
  parts.push(chair(611, 320));
  parts.push(desk(688, 475, 116));
  parts.push(chair(747, 521));
  parts.push(desk(428, 597, 116));
  parts.push(chair(487, 643));

  figures.forEach(({ candidate, facing, x, y, size }) => {
    parts.push(proposalFigure(candidate, facing, x, y, size, COLORS.ink, COLORS.floor));
  });

  // Foreground desk faces deliberately hide the lower third of three figures.
  parts.push(`<path d="M 122 328 H 230 V 348 H 122 Z" fill="${COLORS.deskFront}"/>`);
  parts.push(`<path d="M 556 296 H 664 V 316 H 556 Z" fill="${COLORS.deskFront}"/>`);
  parts.push(`<path d="M 692 497 H 800 V 517 H 692 Z" fill="${COLORS.deskFront}"/>`);

  const testX = 980;
  parts.push(panel(testX, roomY, 496, 824));
  parts.push(text(testX + 24, roomY + 38, 'Blind matching tests', 16, 700));
  parts.push(text(testX + 24, roomY + 61, 'If the labels are needed, the topology is not ready.', 11, 500, COLORS.muted));

  parts.push(text(testX + 24, roomY + 104, 'South · 40 px', 12, 700, COLORS.green));
  CANDIDATES.forEach((candidate, index) => {
    const x = testX + 30 + index * 88;
    parts.push(panel(x, roomY + 122, 68, 68, COLORS.panelAlt));
    parts.push(proposalFigure(candidate, 'south', x + 14, roomY + 136, 40, COLORS.ink, COLORS.panelAlt));
  });

  parts.push(text(testX + 24, roomY + 232, 'East · reordered · 40 px', 12, 700, COLORS.green));
  [CANDIDATES[2], CANDIDATES[4], CANDIDATES[0], CANDIDATES[3], CANDIDATES[1]].forEach((candidate, index) => {
    const x = testX + 30 + index * 88;
    parts.push(panel(x, roomY + 250, 68, 68, COLORS.panelAlt));
    parts.push(proposalFigure(candidate, 'east', x + 14, roomY + 264, 40, COLORS.ink, COLORS.panelAlt));
  });

  parts.push(text(testX + 24, roomY + 360, 'Equal-height normalization · reordered · 40 px', 12, 700, COLORS.green));
  [CANDIDATES[3], CANDIDATES[1], CANDIDATES[4], CANDIDATES[0], CANDIDATES[2]].forEach((candidate, index) => {
    const x = testX + 30 + index * 88;
    parts.push(panel(x, roomY + 378, 68, 68, COLORS.panelAlt));
    parts.push(normalizedProposalFigure(candidate, 'south', x + 12, roomY + 390, 44, 44, COLORS.ink, COLORS.panelAlt));
  });

  parts.push(text(testX + 24, roomY + 488, 'Desk-height crop · upper silhouette only', 12, 700, COLORS.green));
  CANDIDATES.forEach((candidate, index) => {
    const x = testX + 30 + index * 88;
    parts.push(panel(x, roomY + 506, 68, 68, COLORS.panelAlt));
    parts.push(proposalFigure(candidate, index % 2 === 0 ? 'south' : 'east', x + 10, roomY + 511, 48, COLORS.ink, COLORS.panelAlt));
    parts.push(`<rect x="${x + 1}" y="${roomY + 550}" width="66" height="23" fill="${COLORS.deskFront}"/>`);
  });

  parts.push(text(testX + 24, roomY + 616, 'Overlap cluster · edge-ownership stress', 12, 700, COLORS.green));
  const clusterX = testX + 84;
  const clusterY = roomY + 643;
  parts.push(proposalFigure(CANDIDATES[1], 'south', clusterX + 44, clusterY + 30, 52, COLORS.ink, COLORS.panel));
  parts.push(proposalFigure(CANDIDATES[0], 'east', clusterX + 90, clusterY + 2, 48, COLORS.green, COLORS.panel));
  parts.push(proposalFigure(CANDIDATES[3], 'south', clusterX + 126, clusterY + 38, 52, COLORS.ink, COLORS.panel));
  parts.push(proposalFigure(CANDIDATES[2], 'east', clusterX + 167, clusterY + 8, 48, COLORS.coral, COLORS.panel));
  parts.push(proposalFigure(CANDIDATES[4], 'south', clusterX + 205, clusterY + 34, 50, COLORS.ink, COLORS.panel));
  parts.push(text(testX + 24, roomY + 802, 'Green/coral appear only here to expose edge ownership.', 10, 500, COLORS.muted));

  parts.push(text(32, 972, 'Questions for review', 16, 750));
  parts.push(text(32, 1000, '1. Can each figure be reacquired after furniture occlusion?   2. Do south/east pairs feel like the same person?   3. Is the set varied without becoming comic?', 12, 550, COLORS.muted));
  parts.push(text(32, 1030, 'This is a topology proof, not a proposal for final anatomy, clothing, palette, or animation.', 11, 650, COLORS.coral));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function writeSvgAndPng(outDir: string, base: string, svg: string): void {
  writeFileSync(join(outDir, `${base}.svg`), svg);
  writeFileSync(
    join(outDir, `${base}.png`),
    new Resvg(svg, { fitTo: { mode: 'zoom', value: 1 } }).render().asPng(),
  );
}

function rasterMask(svg: string): Uint8Array {
  const png = PNG.sync.read(new Resvg(svg).render().asPng());
  const mask = new Uint8Array(png.width * png.height);
  for (let index = 0; index < mask.length; index++) {
    mask[index] = png.data[index * 4 + 3] >= 128 ? 1 : 0;
  }
  return mask;
}

function silhouetteIou(left: Uint8Array, right: Uint8Array): number {
  let intersection = 0;
  let union = 0;
  for (let index = 0; index < left.length; index++) {
    if (left[index] || right[index]) union++;
    if (left[index] && right[index]) intersection++;
  }
  return union === 0 ? 1 : intersection / union;
}

function pairwiseMetrics(
  entries: Array<{ id: string; svg: string }>,
): Array<{ pair: [string, string]; iou: number }> {
  const masks = entries.map((entry) => ({ id: entry.id, mask: rasterMask(entry.svg) }));
  const rows: Array<{ pair: [string, string]; iou: number }> = [];
  for (let left = 0; left < masks.length; left++) {
    for (let right = left + 1; right < masks.length; right++) {
      rows.push({
        pair: [masks[left].id, masks[right].id],
        iou: Number(silhouetteIou(masks[left].mask, masks[right].mask).toFixed(3)),
      });
    }
  }
  return rows.sort((a, b) => b.iou - a.iou);
}

function standaloneSvg(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">${inner}</svg>`;
}

function overlapMetrics(): {
  note: string;
  baseline: Record<Facing, ReturnType<typeof pairwiseMetrics>>;
  proposal: Record<Facing, ReturnType<typeof pairwiseMetrics>>;
} {
  const facings: Facing[] = ['south', 'east'];
  const baseline = Object.fromEntries(facings.map((facing) => [
    facing,
    pairwiseMetrics(BODY_ARCHETYPES.map((archetype) => ({
      id: archetype.id,
      svg: standaloneSvg(baselineFigure(archetype.part.id, archetype.label, facing, 0, 0, 40)),
    }))),
  ])) as Record<Facing, ReturnType<typeof pairwiseMetrics>>;
  const proposal = Object.fromEntries(facings.map((facing) => [
    facing,
    pairwiseMetrics(CANDIDATES.map((candidate) => ({
      id: candidate.id,
      svg: standaloneSvg(proposalFigure(candidate, facing, 0, 0, 40, COLORS.ink, 'transparent')),
    }))),
  ])) as Record<Facing, ReturnType<typeof pairwiseMetrics>>;
  return {
    note: 'Pairwise intersection-over-union on a literal 40 px transparent canvas. Lower overlap supports distinction; visual review remains authoritative.',
    baseline,
    proposal,
  };
}

function main(): void {
  const outDir = resolve(process.argv[2] ?? 'docs/previews');
  mkdirSync(outDir, { recursive: true });
  writeSvgAndPng(outDir, 'character-silhouette-recraft-v1', directionSheet());
  writeSvgAndPng(outDir, 'character-silhouette-room-v1', roomSheet());
  const metrics = overlapMetrics();
  writeFileSync(
    join(outDir, 'character-silhouette-recraft-v1-metrics.json'),
    `${JSON.stringify(metrics, null, 2)}\n`,
  );
  const baselineMax = Math.max(metrics.baseline.south[0].iou, metrics.baseline.east[0].iou);
  const proposalMax = Math.max(metrics.proposal.south[0].iou, metrics.proposal.east[0].iou);
  console.log(`40 px max pair overlap: baseline ${baselineMax.toFixed(3)} · proposal ${proposalMax.toFixed(3)}`);
  console.log(`wrote review-only character silhouette recraft proofs to ${outDir}`);
}

main();
