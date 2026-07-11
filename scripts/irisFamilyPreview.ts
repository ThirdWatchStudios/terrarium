/**
 * Focused IRIS apparatus + fabrication-unit visual review.
 *
 *   npm run iris:preview
 *   npm run iris:preview -- --out /tmp/terrarium-iris-proof
 *
 * Writes one SVG, one PNG, and a small HTML wrapper. The sheet is composed and
 * rasterized once, serially, so art review stays lightweight.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import { composeCharacter, composeProp } from '../src/core/compositor';
import { clinicalStyle, clinicalSurfaceColor } from '../src/core/look';
import type {
  CharacterRecipe,
  Facing,
  PropInstance,
  StyleSheet,
} from '../src/core/types';
import {
  CONSTRUCTION_CREW,
  DEFAULT_PROPS,
  DEFAULT_STYLE,
} from '../src/data/defaults';
import type { Pose } from '../src/parts/poses';

const WIDTH = 1440;
const MARGIN = 32;
const GAP = 24;
const CANVAS = 128;

const COLORS = {
  page: '#E7EBEA',
  panel: '#F8FAF8',
  panelAlt: '#EEF2EF',
  ink: '#27312D',
  muted: '#66736D',
  line: '#CAD2CE',
  floor: '#898478',
  floorDark: '#777166',
  green: '#38B96E',
} as const;

const LIVE = requiredProp('iris-installation-unit');
const DORMANT = requiredProp('iris-installation-unit-dormant');
const DOCK = requiredProp('iris-charging-dock');
const CREW = requiredCrew();
const CLINICAL_STYLE = clinicalStyle(DEFAULT_STYLE);

function requiredProp(templateId: string): PropInstance {
  const prop = DEFAULT_PROPS.find((candidate) => candidate.templateId === templateId);
  if (!prop) throw new Error(`Missing default prop for ${templateId}`);
  return structuredClone(prop);
}

function requiredCrew(): CharacterRecipe {
  const recipe = CONSTRUCTION_CREW[0];
  if (!recipe) throw new Error('Missing construction-crew recipe');
  return structuredClone(recipe);
}

function clinicalProp(prop: PropInstance): PropInstance {
  const copy = structuredClone(prop);
  copy.palette = {
    primary: clinicalSurfaceColor(copy.palette.primary),
    secondary: clinicalSurfaceColor(copy.palette.secondary),
    accent: clinicalSurfaceColor(copy.palette.accent),
  };
  return copy;
}

function svgInner(svg: string): string {
  return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

function nestedSvg(svg: string, x: number, y: number, width: number, height = width): string {
  return (
    `<svg x="${x}" y="${y}" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${CANVAS} ${CANVAS}" overflow="visible">${svgInner(svg)}</svg>`
  );
}

function propSvg(prop: PropInstance, style: StyleSheet = DEFAULT_STYLE): string {
  return composeProp(prop, style, CANVAS);
}

function crewSvg(
  facing: Facing | 'west',
  pose: Pose = 'neutral',
  style: StyleSheet = DEFAULT_STYLE,
): string {
  return composeCharacter(CREW, style, facing, CANVAS, 'normal', { badge: false, pose });
}

function text(
  x: number,
  y: number,
  value: string,
  size = 16,
  weight = 400,
  color: string = COLORS.ink,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${value}</text>`;
}

function panel(parts: string[], x: number, y: number, width: number, height: number): void {
  parts.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="12" fill="${COLORS.panel}" stroke="${COLORS.line}"/>`);
}

function subhead(parts: string[], x: number, y: number, title: string, detail: string): void {
  parts.push(text(x, y, title, 21, 700));
  parts.push(text(x, y + 23, detail, 13, 400, COLORS.muted));
}

function cell(parts: string[], x: number, y: number, width: number, height: number, label?: string): void {
  parts.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="#FFFFFF" stroke="${COLORS.line}"/>`);
  if (label) parts.push(text(x + width / 2, y + height - 10, label, 12, 600, COLORS.muted, 'middle'));
}

function apparatusSection(parts: string[], y: number): number {
  const height = 414;
  panel(parts, MARGIN, y, WIDTH - MARGIN * 2, height);
  subhead(
    parts,
    MARGIN + 18,
    y + 32,
    'Installation apparatus — state, scale, and look',
    'Live and dormant keep one silhouette; IRIS green is reserved for the live hierarchy.',
  );

  const leftX = MARGIN + 18;
  const rowStart = y + 86;
  const labelWidth = 112;
  const scaleColumns = [
    { size: 128, box: 148 },
    { size: 64, box: 112 },
    { size: 32, box: 88 },
  ] as const;
  const rows = [
    { label: 'Live', prop: LIVE },
    { label: 'Dormant', prop: DORMANT },
  ] as const;

  rows.forEach((row, rowIndex) => {
    const rowY = rowStart + rowIndex * 154;
    parts.push(text(leftX, rowY + 72, row.label, 16, 700));
    let x = leftX + labelWidth;
    scaleColumns.forEach(({ size, box }) => {
      cell(parts, x, rowY, box, 150, `${size} px`);
      parts.push(
        nestedSvg(
          propSvg(row.prop),
          x + (box - size) / 2,
          rowY + 2 + (128 - size) / 2,
          size,
        ),
      );
      x += box + 12;
    });
  });

  const compareX = MARGIN + 712;
  parts.push(`<path d="M ${compareX - 20} ${rowStart - 12} V ${y + height - 18}" stroke="${COLORS.line}"/>`);
  parts.push(text(compareX, rowStart - 2, 'Raw surface palette', 13, 700, COLORS.muted));
  parts.push(text(compareX + 278, rowStart - 2, 'Clinical-plan palette', 13, 700, COLORS.muted));

  const rawCellX = compareX;
  const clinicalCellX = compareX + 278;
  cell(parts, rawCellX, rowStart + 12, 250, 240, 'apparatus + dock');
  cell(parts, clinicalCellX, rowStart + 12, 250, 240, 'apparatus + dock');
  parts.push(nestedSvg(propSvg(LIVE), rawCellX + 49, rowStart + 26, 152));
  parts.push(nestedSvg(propSvg(DOCK), rawCellX + 91, rowStart + 144, 68));
  parts.push(nestedSvg(propSvg(clinicalProp(LIVE), CLINICAL_STYLE), clinicalCellX + 49, rowStart + 26, 152));
  parts.push(nestedSvg(propSvg(clinicalProp(DOCK), CLINICAL_STYLE), clinicalCellX + 91, rowStart + 144, 68));

  return y + height + GAP;
}

function floorCard(parts: string[], x: number, y: number, width: number, height: number): void {
  cell(parts, x, y, width, height);
  parts.push(`<rect x="${x + 8}" y="${y + 8}" width="${width - 16}" height="${height - 36}" rx="5" fill="url(#floor-grid)"/>`);
}

function dockSection(parts: string[], y: number): number {
  const height = 342;
  panel(parts, MARGIN, y, WIDTH - MARGIN * 2, height);
  subhead(
    parts,
    MARGIN + 18,
    y + 32,
    'Charging dock — physical floor hardware',
    'Empty, occupied, and repeated bays; the character pivot is aligned to the dock center.',
  );

  const top = y + 82;
  const emptyX = MARGIN + 18;
  floorCard(parts, emptyX, top, 238, 236);
  parts.push(nestedSvg(propSvg(DOCK), emptyX + 55, top + 34, 128));
  parts.push(text(emptyX + 119, top + 220, 'empty bay', 13, 700, COLORS.muted, 'middle'));

  const occupiedX = emptyX + 258;
  floorCard(parts, occupiedX, top, 238, 236);
  parts.push(nestedSvg(propSvg(DOCK), occupiedX + 55, top + 72, 128));
  parts.push(nestedSvg(crewSvg('south'), occupiedX + 55, top + 20, 128));
  parts.push(text(occupiedX + 119, top + 220, 'occupied bay', 13, 700, COLORS.muted, 'middle'));

  const rowX = occupiedX + 258;
  const rowW = WIDTH - MARGIN - 18 - rowX;
  floorCard(parts, rowX, top, rowW, 236);
  const dockSize = 116;
  const dockY = top + 78;
  const rowStart = rowX + 28;
  for (let index = 0; index < 4; index++) {
    const dx = rowStart + index * 142;
    parts.push(nestedSvg(propSvg(DOCK), dx, dockY, dockSize));
    if (index === 1 || index === 3) {
      const facing = index === 1 ? 'east' : 'north';
      parts.push(nestedSvg(crewSvg(facing), dx - 6, dockY - 47, CANVAS));
    }
  }
  parts.push(text(rowX + rowW / 2, top + 220, 'four-bay charging row', 13, 700, COLORS.muted, 'middle'));

  return y + height + GAP;
}

function crewSection(parts: string[], y: number): number {
  const height = 510;
  panel(parts, MARGIN, y, WIDTH - MARGIN * 2, height);
  subhead(
    parts,
    MARGIN + 18,
    y + 32,
    'IRIS fabrication unit — facing and pose matrix',
    'The approved production body rig drives one machine silhouette through all four source facings and representative work states.',
  );

  const facings: Array<Facing | 'west'> = ['south', 'east', 'north', 'west'];
  const poses: Pose[] = ['walk-approach', 'point', 'console', 'hands-on-hips'];
  const cellW = 300;
  const cellH = 180;
  const startX = MARGIN + 58;
  const facingY = y + 94;
  const poseY = y + 294;

  facings.forEach((facing, index) => {
    const x = startX + index * (cellW + 12);
    cell(parts, x, facingY, cellW, cellH, facing);
    parts.push(nestedSvg(crewSvg(facing), x + (cellW - CANVAS) / 2, facingY + 10, CANVAS));
  });
  parts.push(text(startX - 12, facingY + 86, 'facings', 14, 700, COLORS.muted, 'end'));

  poses.forEach((pose, index) => {
    const x = startX + index * (cellW + 12);
    cell(parts, x, poseY, cellW, cellH, pose);
    const facing: Facing | 'west' = pose === 'console' ? 'west' : pose === 'walk-approach' ? 'east' : 'south';
    parts.push(nestedSvg(crewSvg(facing, pose), x + (cellW - CANVAS) / 2, poseY + 10, CANVAS));
  });
  parts.push(text(startX - 12, poseY + 86, 'poses', 14, 700, COLORS.muted, 'end'));

  return y + height + GAP;
}

function vignetteSection(parts: string[], y: number): number {
  const height = 442;
  panel(parts, MARGIN, y, WIDTH - MARGIN * 2, height);
  subhead(
    parts,
    MARGIN + 18,
    y + 32,
    'Bare-lot family vignette',
    'One installation apparatus, a dock row, and fabrication units sharing the same sterile chassis and sparse IRIS-green hierarchy.',
  );

  const x = MARGIN + 18;
  const top = y + 82;
  const width = WIDTH - MARGIN * 2 - 36;
  const floorH = 334;
  parts.push(`<rect x="${x}" y="${top}" width="${width}" height="${floorH}" rx="8" fill="url(#lot-grid)"/>`);

  // Installation apparatus and one console-facing unit.
  parts.push(nestedSvg(propSvg(LIVE), x + 54, top + 64, 250));
  parts.push(nestedSvg(crewSvg('west', 'console'), x + 310, top + 112, 128));

  // Three charging bays. The two standing units share the same world pivot as
  // the center of their plan-projection docks.
  const dockY = top + 174;
  const dockXs = [x + 520, x + 702, x + 884] as const;
  dockXs.forEach((dockX) => parts.push(nestedSvg(propSvg(DOCK), dockX, dockY, 128)));
  parts.push(nestedSvg(crewSvg('north'), dockXs[1], dockY - 52, 128));
  parts.push(nestedSvg(crewSvg('east', 'walk-approach'), dockXs[2], dockY - 52, 128));

  // One outward-facing unit carries the construction silhouette beyond the
  // charging line and keeps the scene from reading as a static prop catalog.
  parts.push(nestedSvg(crewSvg('south', 'point'), x + 1120, top + 126, 148));
  parts.push(text(x + 18, top + floorH - 16, '2×1 apparatus', 12, 700, '#F7F5EF'));
  parts.push(text(x + width - 18, top + floorH - 16, '1×1 dock bays · aligned world pivots', 12, 700, '#F7F5EF', 'end'));

  return y + height + MARGIN;
}

function sheet(): string {
  const parts: string[] = [
    `<defs>` +
      `<pattern id="floor-grid" width="32" height="32" patternUnits="userSpaceOnUse">` +
      `<rect width="32" height="32" fill="${COLORS.floor}"/>` +
      `<path d="M 32 0 H 0 V 32" fill="none" stroke="${COLORS.floorDark}" stroke-width="1" opacity="0.6"/>` +
      `</pattern>` +
      `<pattern id="lot-grid" width="64" height="64" patternUnits="userSpaceOnUse">` +
      `<rect width="64" height="64" fill="#777367"/>` +
      `<path d="M 64 0 H 0 V 64" fill="none" stroke="#5F5C53" stroke-width="1.2" opacity="0.72"/>` +
      `<path d="M 8 14 l 3 -2 M 46 38 l 4 1 M 23 55 l 2 -3" stroke="#9B9687" stroke-width="1" opacity="0.55"/>` +
      `</pattern>` +
      `</defs>`,
  ];

  let y = 0;
  parts.push(`<rect width="${WIDTH}" height="1" fill="${COLORS.page}" data-page-background="true"/>`);
  parts.push(text(MARGIN, 38, 'IRIS apparatus + fabrication-unit review', 28, 750));
  parts.push(text(MARGIN, 65, 'Production compositor output · current ids, palettes, rig, poses, and prop projections', 14, 400, COLORS.muted));
  parts.push(`<rect x="${WIDTH - 240}" y="24" width="208" height="34" rx="17" fill="#DDF4E6"/>`);
  parts.push(`<circle cx="${WIDTH - 216}" cy="41" r="6" fill="${COLORS.green}"/>`);
  parts.push(text(WIDTH - 200, 46, 'focused serial proof', 13, 700, '#257448'));

  y = 90;
  y = apparatusSection(parts, y);
  y = dockSection(parts, y);
  y = crewSection(parts, y);
  y = vignetteSection(parts, y);

  const height = Math.ceil(y);
  // Replace the tiny sizing placeholder with the actual page background now
  // that all variable-height sections have been laid out.
  const placeholder = parts.findIndex((part) => part.includes('data-page-background'));
  parts[placeholder] = `<rect width="${WIDTH}" height="${height}" fill="${COLORS.page}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}">${parts.join('')}</svg>`;
}

function outputDirectory(args: string[]): string {
  let out = 'docs/previews';
  for (let index = 0; index < args.length; index++) {
    if (args[index] !== '--out') throw new Error(`Unknown argument ${args[index]}`);
    const value = args[++index];
    if (!value) throw new Error('--out requires a directory');
    out = value;
  }
  return resolve(process.cwd(), out);
}

const directory = outputDirectory(process.argv.slice(2));
mkdirSync(directory, { recursive: true });

const source = sheet();
const svgPath = join(directory, 'iris-family-review.svg');
const pngPath = join(directory, 'iris-family-review.png');
const htmlPath = join(directory, 'iris-family-review.html');

writeFileSync(svgPath, source);
writeFileSync(pngPath, new Resvg(source).render().asPng());
writeFileSync(
  htmlPath,
  '<!doctype html><meta charset="utf-8"><title>IRIS apparatus and fabrication-unit review</title>' +
    '<style>html{background:#222}body{margin:0;text-align:center}img{max-width:100%;height:auto}</style>' +
    '<img src="iris-family-review.svg" alt="IRIS installation apparatus, charging docks, and fabrication crew visual review">',
);

process.stdout.write(`Wrote ${svgPath}\nWrote ${pngPath}\nWrote ${htmlPath}\n`);
