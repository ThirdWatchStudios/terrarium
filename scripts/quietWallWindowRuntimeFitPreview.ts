/**
 * Review-only window refit against the retained quiet wall families.
 *
 * The accepted glazing identity remains shared equipment. Only the structural
 * wall pixels change: they inherit the same material planes as the wall cell
 * that owns the opening instead of carrying the retired QuotaCo facade palette.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

import { composeWallTile } from '../src/core/compositor';
import type { TileInstance } from '../src/core/types';
import { CORE_WALLS, DEFAULT_STYLE } from '../src/data/defaults';
import { authoredPropSvg } from '../src/props/authoredArt';
import { NB } from '../src/tiles/blob';
import {
  type DoorMaterial,
  FULL_CELL_DOOR_MATERIALS,
} from './quietWallDoorFullCellOpeningPreview';
import type { QuietWallFamilyId } from './quietWallFamilyRefinementPreview';

type WindowAxis = 'horizontal' | 'vertical';

const PAGE = '#E8E5DC';
const PANEL = '#F4F1E9';
const PANEL_ALT = '#ECE9E0';
const INK = '#2C302D';
const MUTED = '#666B67';
const RULE = '#A5A49D';
const FLOOR = '#9B795E';
const FLOOR_LINE = '#765C49';
const OUTSIDE = '#62715B';
const PROPOSED = '#526E68';
const REVIEW_RED = '#A95546';

const FRAME = '#323431';
const FRAME_LIGHT = '#535A56';
const GLASS = '#83A9A6';
const GLASS_SHADE = '#648B89';
const BLIND = '#C3C0B6';
const BLIND_SHADE = '#858A84';

const RETIRED_WINDOW_WALL_COLORS = ['#D9D0B9', '#294B3C', '#B65F4D'] as const;

/** The same fresh-import wall evidence used for the approved door correction. */
export const FULL_CELL_WINDOW_MATERIALS = FULL_CELL_DOOR_MATERIALS;

export const QUIET_WALL_WINDOW_RUNTIME_FIT_REVIEW = {
  status: 'review-only-face-owned-window-awaiting-composed-visual-approval',
  retainedIdentity: [
    'horizontal-integrated-opening',
    'vertical-raised-barrier',
    'partial-blinds',
    'mullion',
    'glazing',
    'sill',
  ],
  removedFromCandidate: [
    'retired-cream-wall-shell',
    'retired-green-wall-face',
    'retired-coral-wall-band',
  ],
  shadingCorrection: 'window-wall-structure-inherits-exported-wall-instance-palette',
  paletteEvidenceSource: 'fresh-unity-import-wall-json',
  retainedRuntimeEnvelope: 'one-0.5-world-unit-wall-cell',
  retainedSourceCompensation: 0.5,
  axes: ['horizontal', 'vertical'],
  materials: 5,
  neighborGlass: 'still-deferred',
  candidateArtLocalToPreview: true,
  canonicalSvgMutation: false,
  generatedRegistryMutation: false,
  exporterMutation: false,
  unityMutation: false,
  browserExport: false,
  unityImport: false,
  staging: false,
  commit: false,
} as const;

function material(id: QuietWallFamilyId): DoorMaterial {
  const found = FULL_CELL_WINDOW_MATERIALS.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`Unknown quiet-wall window material ${id}`);
  return found;
}

function runtimeWall(id: QuietWallFamilyId): TileInstance {
  const source = CORE_WALLS.find(({ templateId }) => templateId === id);
  if (!source) throw new Error(`Missing runtime wall ${id}`);
  const spec = material(id);
  return {
    ...source,
    palette: {
      primary: spec.primary,
      secondary: spec.secondary,
      accent: spec.accent,
    },
  };
}

function runtimeWallSvg(id: QuietWallFamilyId, mask: number): string {
  return composeWallTile(runtimeWall(id), DEFAULT_STYLE, mask, 128);
}

function escapeText(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function text(
  x: number,
  y: number,
  value: string,
  size = 15,
  weight = 600,
  fill = INK,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return `<text x="${x}" y="${y}" font-family="Inter,Arial,sans-serif" font-size="${size}" ` +
    `font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${escapeText(value)}</text>`;
}

function page(width: number, height: number, content: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${PAGE}"/>${content}</svg>`;
}

function panel(x: number, y: number, width: number, height: number, fill = PANEL): string {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="10" ` +
    `fill="${fill}" stroke="${RULE}" stroke-width="1.4"/>`;
}

function inner(svg: string): string {
  return svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

function placedSvg(source: string, x: number, y: number, width: number, height = width): string {
  return `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="0 0 128 128" ` +
    `preserveAspectRatio="none" overflow="visible">${inner(source)}</svg>`;
}

function placedWallSvg(source: string, x: number, y: number, size: number, id: string): string {
  const clipId = `window-wall-${id.replaceAll(/[^a-zA-Z0-9_-]/g, '-')}`;
  return `<defs><clipPath id="${clipId}" clipPathUnits="userSpaceOnUse"><rect x="${x}" y="${y}" width="${size}" height="${size}"/></clipPath></defs>` +
    `<g clip-path="url(#${clipId})"><g transform="translate(${x} ${y}) scale(${size / 128})">${inner(source)}</g></g>`;
}

function horizontalMaterialDetail(spec: DoorMaterial): string {
  if (spec.id === 'brick-wall') {
    return `<path d="M2 112H126M24 103V112M60 112V121M96 103V112" stroke="${spec.detail}" stroke-width="1.2" opacity=".55"/>`;
  }
  if (spec.id === 'panel-wall') {
    return `<path d="M24 102V120M104 102V120" stroke="${spec.detail}" stroke-width="1.1" opacity=".44"/>`;
  }
  if (spec.id === 'cubicle-partition') {
    return `<path d="M4 113H124" stroke="${spec.detail}" stroke-width="1.3" opacity=".36"/>`;
  }
  if (spec.id === 'slat-wall') {
    return `<path d="M10 102V120M20 102V120M108 102V120M118 102V120" stroke="${spec.detail}" stroke-width="1.2" opacity=".5"/>`;
  }
  return '';
}

function verticalMaterialDetail(spec: DoorMaterial): string {
  if (spec.id === 'brick-wall') {
    return `<path d="M8 6H120M8 122H120M34 0V12M94 116V128" stroke="${spec.detail}" stroke-width="1.2" opacity=".55"/>`;
  }
  if (spec.id === 'panel-wall') {
    return `<path d="M28 0V12M100 116V128" stroke="${spec.detail}" stroke-width="1.1" opacity=".44"/>`;
  }
  if (spec.id === 'cubicle-partition') {
    return `<path d="M10 8H118M10 120H118" stroke="${spec.detail}" stroke-width="1.3" opacity=".36"/>`;
  }
  if (spec.id === 'slat-wall') {
    return `<path d="M16 0V12M30 0V12M98 116V128M112 116V128" stroke="${spec.detail}" stroke-width="1.2" opacity=".5"/>`;
  }
  return '';
}

function horizontalWindow(spec: DoorMaterial): string {
  return [
    // Narrow sockets and lower register are the wall face, not window trim.
    `<path d="M0 2H12V126H0ZM116 2H128V126H116Z" fill="${FRAME}"/>`,
    `<path d="M0 8H12V120H0ZM116 8H128V120H116Z" fill="${spec.primary}"/>`,
    `<path d="M0 8H12V16H0ZM116 8H128V16H116Z" fill="${spec.accent}"/>`,
    `<path d="M0 82H12V120H0ZM116 82H128V120H116Z" fill="${spec.secondary}"/>`,
    `<path d="M4 2H124V34H4Z" fill="${FRAME}"/>`,
    `<path d="M8 8H120V30H8Z" fill="${spec.primary}"/>`,
    `<path d="M8 8H120V15H8Z" fill="${spec.accent}"/>`,
    `<path d="M8 24H120V30H8Z" fill="${spec.secondary}"/>`,
    `<path d="M0 98H128V126H0Z" fill="${FRAME}"/>`,
    `<path d="M0 102H128V120H0Z" fill="${spec.primary}"/>`,
    `<path d="M0 110H128V120H0Z" fill="${spec.secondary}"/>`,
    `<path d="M0 102H128V106H0Z" fill="${spec.accent}"/>`,
    horizontalMaterialDetail(spec),
    // Shared equipment: one frame, one pane, partial blinds, mullion, sill.
    `<path d="M12 28H116V103H12Z" fill="${FRAME}"/>`,
    `<path d="M18 34H110V96H18Z" fill="${GLASS}"/>`,
    `<path d="M18 70L110 51V96H18Z" fill="${GLASS_SHADE}" opacity=".24"/>`,
    `<path d="M18 34H110V55H18Z" fill="${BLIND}" opacity=".94"/>`,
    `<path d="M19 40H109M19 47H109M19 54H109" stroke="${BLIND_SHADE}" stroke-width="1.4" opacity=".75"/>`,
    `<path d="M63 55H66V96H63Z" fill="${FRAME_LIGHT}"/>`,
    `<path d="M22 36H25V94H22Z" fill="#FFFFFF" opacity=".13"/>`,
    `<path d="M10 96H118V105H10Z" fill="${FRAME}"/>`,
    `<path d="M16 96H112V101H16Z" fill="${spec.secondary}"/>`,
  ].join('');
}

function verticalWindow(spec: DoorMaterial): string {
  return [
    // Straight wall seams at each end preserve the separately-authored view.
    `<path d="M2 0H126V12H2ZM2 116H126V128H2Z" fill="${FRAME}"/>`,
    `<path d="M8 0H120V12H8ZM8 116H120V128H8Z" fill="${spec.primary}"/>`,
    `<path d="M8 0H38V12H8ZM90 0H120V12H90ZM8 116H38V128H8ZM90 116H120V128H90Z" fill="${spec.accent}"/>`,
    verticalMaterialDetail(spec),
    `<path d="M40 4H88V18H40ZM40 110H88V124H40Z" fill="${FRAME}"/>`,
    `<path d="M45 8H83V14H45Z" fill="${spec.secondary}"/>`,
    `<path d="M45 114H83V120H45Z" fill="${spec.accent}"/>`,
    // Centered raised barrier. Everything beside it remains transparent floor.
    `<path d="M44 14H84V114H44Z" fill="${FRAME}"/>`,
    `<path d="M50 20H78V108H50Z" fill="${GLASS}"/>`,
    `<path id="vertical-window-blind-field" d="M68 20H78V108H68Z" fill="${BLIND}" opacity=".94"/>`,
    `<path id="vertical-window-blind-slats" d="M71 21V107M74 21V107M77 21V107" stroke="${BLIND_SHADE}" stroke-width="1.2" opacity=".72"/>`,
    `<path d="M50 66L78 55V108H50Z" fill="${GLASS_SHADE}" opacity=".24"/>`,
    `<path d="M50 63H78V67H50Z" fill="${FRAME_LIGHT}"/>`,
    `<path d="M52 22H55V106H52Z" fill="#FFFFFF" opacity=".13"/>`,
    `<path d="M42 108H86V115H42Z" fill="${FRAME}"/>`,
    `<path d="M48 108H80V112H48Z" fill="${spec.secondary}"/>`,
  ].join('');
}

export function faceOwnedQuietWallWindowSvg(
  id: QuietWallFamilyId,
  axis: WindowAxis,
  wallPalette?: Pick<DoorMaterial, 'primary' | 'secondary' | 'accent'> & { detail?: string },
): string {
  const base = material(id);
  const spec: DoorMaterial = wallPalette
    ? { ...base, ...wallPalette, detail: wallPalette.detail ?? base.detail }
    : base;
  const art = axis === 'horizontal' ? horizontalWindow(spec) : verticalWindow(spec);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" ` +
    `data-review-only="quiet-wall-window-runtime-fit" data-axis="${axis}">${art}</svg>`;
}

function currentWindowSvg(axis: WindowAxis): string {
  const svg = authoredPropSvg('window', { facing: axis === 'vertical' ? 1 : 0 });
  if (!svg) throw new Error(`Missing promoted ${axis} window`);
  return svg;
}

function floorGrid(x: number, y: number, width: number, height: number, cell: number): string {
  const parts = [`<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${FLOOR}"/>`];
  for (let px = x + cell; px < x + width; px += cell) {
    parts.push(`<path d="M${px} ${y}V${y + height}" stroke="${FLOOR_LINE}" stroke-width="1" opacity=".18"/>`);
  }
  for (let py = y + cell; py < y + height; py += cell) {
    parts.push(`<path d="M${x} ${py}H${x + width}" stroke="${FLOOR_LINE}" stroke-width="1" opacity=".18"/>`);
  }
  return parts.join('');
}

function paletteChip(x: number, y: number, color: string, label: string): string {
  return `<rect x="${x}" y="${y}" width="18" height="18" rx="2" fill="${color}" stroke="${FRAME}" stroke-width="1"/>` +
    text(x + 26, y + 14, `${label} ${color}`, 9.5, 650, MUTED);
}

function windowRun(current: boolean, axis: WindowAxis, x: number, y: number, cell: number): string {
  const candidate = faceOwnedQuietWallWindowSvg('office-wall', axis);
  if (axis === 'horizontal') {
    return [
      floorGrid(x, y, cell * 3, cell, cell),
      placedWallSvg(runtimeWallSvg('office-wall', NB.E), x, y, cell, `audit-h-left-${current}`),
      placedWallSvg(runtimeWallSvg('office-wall', NB.W), x + cell * 2, y, cell, `audit-h-right-${current}`),
      current
        ? placedSvg(currentWindowSvg(axis), x + cell / 2, y - cell / 2, cell * 2)
        : placedSvg(candidate, x + cell, y, cell),
    ].join('');
  }
  return [
    floorGrid(x, y, cell, cell * 3, cell),
    placedWallSvg(runtimeWallSvg('office-wall', NB.S), x, y, cell, `audit-v-top-${current}`),
    placedWallSvg(runtimeWallSvg('office-wall', NB.N), x, y + cell * 2, cell, `audit-v-bottom-${current}`),
    current
      ? placedSvg(currentWindowSvg(axis), x - cell / 2, y + cell / 2, cell * 2)
      : placedSvg(candidate, x, y + cell, cell),
  ].join('');
}

export function renderQuietWallWindowPaletteAuditSvg(): string {
  const width = 1880;
  const height = 720;
  const parts: string[] = [
    text(28, 42, 'WINDOW PASS · LIVE WALL PALETTE AUDIT', 25, 860),
    text(28, 69, 'Useful glazing identity, but the current structural shell still belongs to the retired facade palette', 12, 620, MUTED),
    text(width - 28, 42, 'REVIEW-ONLY', 11, 840, REVIEW_RED, 'end'),
    panel(28, 94, 894, 570),
    panel(958, 94, 894, 570, PANEL_ALT),
    text(48, 126, 'CURRENT · WINDOW CARRIES ITS OWN WALL', 12, 820, REVIEW_RED),
    text(978, 126, 'PROPOSED · WINDOW IS PART OF THIS WALL FACE', 12, 820, PROPOSED),
    windowRun(true, 'horizontal', 82, 158, 210),
    windowRun(false, 'horizontal', 1012, 158, 210),
    windowRun(true, 'vertical', 720, 158, 116),
    windowRun(false, 'vertical', 1650, 158, 116),
    text(48, 418, 'RETIRED WINDOW WALL COLORS', 10, 800, REVIEW_RED),
    paletteChip(48, 438, '#D9D0B9', 'cream'),
    paletteChip(210, 438, '#294B3C', 'green'),
    paletteChip(372, 438, '#B65F4D', 'coral'),
    text(48, 504, 'LIVE OFFICE WALL', 10, 800, MUTED),
    paletteChip(48, 524, '#B4B2A9', 'primary'),
    paletteChip(210, 524, '#888780', 'secondary'),
    paletteChip(372, 524, '#5F5E5A', 'accent'),
    text(978, 418, 'STRUCTURAL PIXELS INHERIT THE LIVE WALL', 10, 800, PROPOSED),
    paletteChip(978, 438, '#B4B2A9', 'primary'),
    paletteChip(1140, 438, '#888780', 'secondary'),
    paletteChip(1302, 438, '#5F5E5A', 'accent'),
    text(978, 504, 'SHARED WINDOW EQUIPMENT', 10, 800, MUTED),
    paletteChip(978, 524, FRAME, 'frame'),
    paletteChip(1140, 524, GLASS, 'glass'),
    paletteChip(1302, 524, BLIND, 'blind'),
    text(48, 612, 'Current: cream/green/coral shell interrupts the wall plane.', 10.5, 650, MUTED),
    text(978, 612, 'Proposed: only frame, glass, and blinds remain window-owned.', 10.5, 650, MUTED),
    text(28, 696, 'UNFINISHED GATE · canonical window SVGs, generated registry, exporter, and Unity import are unchanged', 11, 820, REVIEW_RED),
  ];
  return page(width, height, parts.join(''));
}

export function renderQuietWallWindowFixedViewsSvg(): string {
  const width = 1880;
  const height = 760;
  const axes = [
    { axis: 'horizontal' as const, label: 'HORIZONTAL · INTEGRATED FACE' },
    { axis: 'vertical' as const, label: 'VERTICAL · RAISED BARRIER' },
  ];
  const parts: string[] = [
    text(28, 42, 'WINDOW PASS · TWO FIXED-VIEW CONSTRUCTIONS', 25, 860),
    text(28, 69, 'Same restrained window kit · separately authored geometry · transparent surroundings remain intact', 12, 620, MUTED),
  ];
  axes.forEach((entry, index) => {
    const x = 28 + index * 930;
    parts.push(panel(x, 94, 894, 610, index === 0 ? PANEL : PANEL_ALT));
    parts.push(text(x + 20, 128, entry.label, 13, 820));
    parts.push(text(x + 20, 157, 'CURRENT PROMOTED', 10, 800, REVIEW_RED));
    parts.push(`<rect x="${x + 76}" y="177" width="250" height="250" rx="5" fill="${FLOOR}"/>`);
    parts.push(placedSvg(currentWindowSvg(entry.axis), x - 49, 52, 500));
    parts.push(text(x + 448, 157, 'PROPOSED FACE-OWNED', 10, 800, PROPOSED));
    parts.push(`<rect x="${x + 512}" y="177" width="250" height="250" rx="5" fill="${FLOOR}"/>`);
    parts.push(placedSvg(faceOwnedQuietWallWindowSvg('office-wall', entry.axis), x + 512, 177, 250));
    parts.push(`<rect x="${x + 128}" y="482" width="64" height="64" rx="3" fill="${FLOOR}"/>`);
    parts.push(placedSvg(currentWindowSvg(entry.axis), x + 96, 450, 128));
    parts.push(`<rect x="${x + 606}" y="482" width="64" height="64" rx="3" fill="${FLOOR}"/>`);
    parts.push(placedSvg(faceOwnedQuietWallWindowSvg('office-wall', entry.axis), x + 606, 482, 64));
    parts.push(text(x + 160, 572, 'CURRENT · 64 PX CELL', 9.5, 720, MUTED, 'middle'));
    parts.push(text(x + 638, 572, 'PROPOSED · 64 PX CELL', 9.5, 720, PROPOSED, 'middle'));
    const note = entry.axis === 'horizontal'
      ? 'Lintel and sill belong to the wall; blinds cover only the upper pane.'
      : 'Centered pane spans straight seams; visible floor remains on both sides.';
    parts.push(text(x + 447, 632, note, 10.5, 650, MUTED, 'middle'));
  });
  parts.push(text(28, 738, 'RETAINED CONTRACT · one cell, centered 0.5 source wrapper after approval, facing selected without rotating pixels', 11, 800, MUTED));
  return page(width, height, parts.join(''));
}

export function renderQuietWallWindowMaterialsSvg(): string {
  const width = 1880;
  const height = 590;
  const parts: string[] = [
    text(28, 42, 'WINDOW PASS · FIVE RETAINED MATERIALS', 25, 860),
    text(28, 69, 'The wall face changes by material; frame, glazing, blinds, and mullion stay shared equipment', 12, 620, MUTED),
  ];
  FULL_CELL_WINDOW_MATERIALS.forEach((spec, index) => {
    const x = 28 + index * 366;
    parts.push(panel(x, 96, 348, 438, index % 2 === 0 ? PANEL : PANEL_ALT));
    parts.push(text(x + 174, 128, spec.label.toUpperCase(), 11, 800, INK, 'middle'));
    parts.push(`<rect x="${x + 26}" y="150" width="196" height="196" rx="4" fill="${FLOOR}"/>`);
    parts.push(placedSvg(faceOwnedQuietWallWindowSvg(spec.id, 'horizontal'), x + 26, 150, 196));
    parts.push(`<rect x="${x + 224}" y="192" width="112" height="112" rx="4" fill="${FLOOR}"/>`);
    parts.push(placedSvg(faceOwnedQuietWallWindowSvg(spec.id, 'vertical'), x + 224, 192, 112));
    parts.push(`<rect x="${x + 90}" y="392" width="48" height="48" rx="2" fill="${FLOOR}"/>`);
    parts.push(placedSvg(faceOwnedQuietWallWindowSvg(spec.id, 'horizontal'), x + 90, 392, 48));
    parts.push(`<rect x="${x + 224}" y="392" width="48" height="48" rx="2" fill="${FLOOR}"/>`);
    parts.push(placedSvg(faceOwnedQuietWallWindowSvg(spec.id, 'vertical'), x + 224, 392, 48));
    parts.push(text(x + 114, 464, 'H · 48 PX', 9.5, 720, MUTED, 'middle'));
    parts.push(text(x + 248, 464, 'V · 48 PX', 9.5, 720, MUTED, 'middle'));
    parts.push(paletteChip(x + 38, 488, spec.primary, 'wall'));
  });
  parts.push(text(28, 568, 'NO EXTRA WALL TYPES · these are the same five retained families, with the opening drawn into their face', 11, 800, PROPOSED));
  return page(width, height, parts.join(''));
}

function key(column: number, row: number): string {
  return `${column},${row}`;
}

function neighbors(cells: ReadonlySet<string>, column: number, row: number): number {
  const at = (x: number, y: number) => cells.has(key(x, y));
  return (
    (at(column, row - 1) ? NB.N : 0) |
    (at(column + 1, row) ? NB.E : 0) |
    (at(column, row + 1) ? NB.S : 0) |
    (at(column - 1, row) ? NB.W : 0) |
    (at(column + 1, row - 1) ? NB.NE : 0) |
    (at(column + 1, row + 1) ? NB.SE : 0) |
    (at(column - 1, row + 1) ? NB.SW : 0) |
    (at(column - 1, row - 1) ? NB.NW : 0)
  );
}

function windowRoom(
  id: QuietWallFamilyId,
  x: number,
  y: number,
  cell: number,
  columns: number,
  rows: number,
): string {
  const cells = new Set<string>();
  for (let column = 0; column < columns; column += 1) {
    cells.add(key(column, 0));
    cells.add(key(column, rows - 1));
  }
  for (let row = 0; row < rows; row += 1) {
    cells.add(key(0, row));
    cells.add(key(columns - 1, row));
  }
  const windows = new Map<string, WindowAxis>([
    [key(3, 0), 'horizontal'],
    [key(columns - 4, 0), 'horizontal'],
    [key(0, 3), 'vertical'],
    [key(columns - 1, rows - 4), 'vertical'],
  ]);
  const parts = [
    `<rect x="${x}" y="${y}" width="${columns * cell}" height="${rows * cell}" fill="${OUTSIDE}"/>`,
    floorGrid(x + cell, y + cell, (columns - 2) * cell, (rows - 2) * cell, cell),
  ];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      if (!cells.has(key(column, row))) continue;
      const px = x + column * cell;
      const py = y + row * cell;
      const axis = windows.get(key(column, row));
      parts.push(axis
        ? placedSvg(faceOwnedQuietWallWindowSvg(id, axis), px, py, cell)
        : placedWallSvg(
          runtimeWallSvg(id, neighbors(cells, column, row)),
          px,
          py,
          cell,
          `room-${id}-${cell}-${column}-${row}`,
        ));
    }
  }
  return parts.join('');
}

export function renderQuietWallWindowGameplaySvg(): string {
  const width = 1880;
  const height = 760;
  const parts: string[] = [
    text(28, 42, 'WINDOW PASS · COMPOSED GAMEPLAY-SCALE READ', 25, 860),
    text(28, 69, 'Repeated openings stay subordinate to the room outline; material character remains on the wall', 12, 620, MUTED),
    panel(28, 94, 1180, 610),
    text(48, 126, 'OFFICE WALL · 48 PX CELL', 11, 820),
    windowRoom('office-wall', 60, 150, 48, 22, 10),
    panel(1240, 94, 612, 286, PANEL_ALT),
    text(1260, 126, 'BRICK · 30 PX CELL', 11, 820),
    windowRoom('brick-wall', 1260, 150, 30, 18, 7),
    panel(1240, 408, 612, 296, PANEL_ALT),
    text(1260, 440, 'PANEL · 30 PX CELL', 11, 820),
    windowRoom('panel-wall', 1260, 464, 30, 18, 7),
    text(48, 674, 'Two horizontal and two vertical windows replace wall cells without introducing a new facade language.', 10.5, 650, MUTED),
    text(28, 738, 'UNFINISHED GATE · gameplay-scale review only; promotion waits for explicit approval', 11, 820, REVIEW_RED),
  ];
  return page(width, height, parts.join(''));
}

export async function renderQuietWallWindowRuntimeFitPreview(output: string): Promise<readonly string[]> {
  await mkdir(output, { recursive: true });
  const pages = [
    ['01-live-wall-palette-audit', renderQuietWallWindowPaletteAuditSvg()],
    ['02-two-fixed-view-constructions', renderQuietWallWindowFixedViewsSvg()],
    ['03-five-material-scale-check', renderQuietWallWindowMaterialsSvg()],
    ['04-composed-gameplay-scale', renderQuietWallWindowGameplaySvg()],
  ] as const;
  const files: string[] = [];
  for (const [stem, svg] of pages) {
    const svgPath = path.join(output, `${stem}.svg`);
    const pngPath = path.join(output, `${stem}.png`);
    await writeFile(svgPath, svg, 'utf8');
    await writeFile(pngPath, new Resvg(svg).render().asPng());
    files.push(svgPath, pngPath);
  }
  const metricsPath = path.join(output, 'metrics.json');
  await writeFile(metricsPath, `${JSON.stringify({
    ...QUIET_WALL_WINDOW_RUNTIME_FIT_REVIEW,
    materials: FULL_CELL_WINDOW_MATERIALS,
    retiredWindowWallColors: RETIRED_WINDOW_WALL_COLORS,
  }, null, 2)}\n`, 'utf8');
  files.push(metricsPath);
  const readmePath = path.join(output, 'README.md');
  await writeFile(readmePath, [
    '# Quiet Wall Window Runtime Fit',
    '',
    'Status: **review-only candidate; canonical window sources and Unity import unchanged**',
    '',
    'The current window keeps useful identity in its frame, glazing, partial blinds, mullion, and sill,',
    'but its structural pixels are still baked in the retired cream, green, and coral facade palette.',
    'That makes it interrupt the newly accepted wall planes in exactly the way the earlier door bank did.',
    '',
    'This candidate retains both separately authored fixed views. Horizontal remains an integrated wall-face',
    'opening. Vertical remains a centered raised glazed barrier with transparent floor on either side. The',
    'wall-owned lintel, sill register, end sockets, and seam stubs now inherit the actual exported wall palette',
    'across Office, Brick, Panel, Cubicle, and Wood Slat. Only frame, glass, blinds, and mullion remain fixed',
    'window equipment.',
    '',
    'Neighbor-suite glass remains deferred. No new wall family or decorative shell is introduced.',
    '',
    'Nothing in the canonical SVG source, generated registry, browser export, Unity import, staging, or commit',
    'is changed by this proof.',
    '',
  ].join('\n'), 'utf8');
  files.push(readmePath);
  return files;
}

function outputPath(argv: readonly string[]): string {
  const index = argv.indexOf('--out');
  return index >= 0 && argv[index + 1]
    ? path.resolve(argv[index + 1])
    : path.resolve('docs/previews/quiet-wall-window-runtime-fit-v3');
}

const isMain = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;

if (isMain) {
  const output = outputPath(process.argv.slice(2));
  const files = await renderQuietWallWindowRuntimeFitPreview(output);
  process.stdout.write(`Wrote ${files.length} quiet-wall window review files to ${output}\n`);
}
