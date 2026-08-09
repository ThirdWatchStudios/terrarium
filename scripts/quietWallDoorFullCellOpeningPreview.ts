/**
 * Review-only third door pass. The Unity receiver is already honoring the
 * one-cell contract; this proof addresses the remaining narrow-slot read by
 * making the doorway, rather than its decorative frame, occupy the cell.
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
  type QuietWallFamilyId,
} from './quietWallFamilyRefinementPreview';

type DoorAxis = 'horizontal' | 'vertical';
type DoorState = 'closed' | 'open';

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
const CONTOUR = '#323431';
const DOOR_PANEL = '#53615E';
const DOOR_PANEL_LIGHT = '#6E7C78';
const DOOR_GLASS = '#8CA4A1';
const STATUS = '#B96D52';

export interface DoorMaterial {
  id: QuietWallFamilyId;
  label: string;
  primary: string;
  secondary: string;
  accent: string;
  detail: string;
}

/**
 * Palettes observed in the fresh 2026-08-07 17:40 Unity import. These are the
 * wall values the door actually has to inherit in the reported runtime case;
 * the promoted door bank was incorrectly baked against a second palette set.
 */
export const FULL_CELL_DOOR_MATERIALS: readonly DoorMaterial[] = [
  {
    id: 'office-wall',
    label: 'Office wall',
    primary: '#B4B2A9',
    secondary: '#888780',
    accent: '#5F5E5A',
    detail: '#777872',
  },
  {
    id: 'brick-wall',
    label: 'Brick wall',
    primary: '#9C5A45',
    secondary: '#D8C9B8',
    accent: '#7A4334',
    detail: '#D2AA97',
  },
  {
    id: 'panel-wall',
    label: 'Panel wall',
    primary: '#6E6A63',
    secondary: '#9AA0A6',
    accent: '#185FA5',
    detail: '#B5B0A5',
  },
  {
    id: 'cubicle-partition',
    label: 'Cubicle partition',
    primary: '#8A9199',
    secondary: '#5F5E5A',
    accent: '#D85A30',
    detail: '#5D676C',
  },
  {
    id: 'slat-wall',
    label: 'Wood slat wall',
    primary: '#A9714B',
    secondary: '#5F3E22',
    accent: '#C68B59',
    detail: '#503E33',
  },
];

export const QUIET_WALL_DOOR_FULL_CELL_REVIEW = {
  status: 'review-only-full-cell-opening-awaiting-composed-visual-approval',
  runtimeFinding: 'receiver-scale-and-centering-confirmed-correct',
  shadingFinding: 'promoted-door-bank-and-exported-wall-use-different-palettes',
  shadingCorrection: 'door-wall-structure-inherits-exported-wall-instance-palette',
  paletteEvidenceSource: 'fresh-unity-import-wall-json',
  retainedRuntimeEnvelope: 'one-0.5-world-unit-wall-cell',
  retainedSourceCompensation: 0.5,
  promotedV2OuterAperture: 88,
  proposedOuterAperture: 120,
  promotedV2OpenPassage: 52,
  proposedOpenPassage: 80,
  promotedV2OpenPassagePercent: 40.625,
  proposedOpenPassagePercent: 62.5,
  simplification: [
    'continuous-wall-plane-lintel',
    'single-quiet-jamb-return',
    'leaves-retract-behind-jambs',
    'no-nested-frame-banding',
  ],
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
  const found = FULL_CELL_DOOR_MATERIALS.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`Unknown full-cell door material ${id}`);
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
  const clipId = `wall-cell-${id.replaceAll(/[^a-zA-Z0-9_-]/g, '-')}`;
  return `<defs><clipPath id="${clipId}" clipPathUnits="userSpaceOnUse"><rect x="${x}" y="${y}" width="${size}" height="${size}"/></clipPath></defs>` +
    `<g clip-path="url(#${clipId})"><g transform="translate(${x} ${y}) scale(${size / 128})">${inner(source)}</g></g>`;
}

function horizontalDetail(spec: DoorMaterial): string {
  if (spec.id === 'brick-wall') {
    return `<path d="M3 94H12M116 94H125" stroke="${spec.detail}" stroke-width="1.3" opacity=".62"/>`;
  }
  if (spec.id === 'panel-wall') {
    return `<path d="M8 76V120M120 76V120" stroke="${spec.detail}" stroke-width="1.2" opacity=".5"/>`;
  }
  if (spec.id === 'cubicle-partition') {
    return `<path d="M2 105H12M116 105H126" stroke="${spec.detail}" stroke-width="1.4" opacity=".4"/>`;
  }
  if (spec.id === 'slat-wall') {
    return `<path d="M4 76V120M10 76V120M118 76V120M124 76V120" stroke="${spec.detail}" stroke-width="1.3" opacity=".58"/>`;
  }
  return '';
}

function verticalDetail(spec: DoorMaterial): string {
  if (spec.id === 'brick-wall') {
    return `<path d="M8 6H120M8 122H120" stroke="${spec.detail}" stroke-width="1.3" opacity=".62"/>`;
  }
  if (spec.id === 'panel-wall') {
    return `<path d="M64 0V12M64 116V128" stroke="${spec.detail}" stroke-width="1.2" opacity=".5"/>`;
  }
  if (spec.id === 'cubicle-partition') {
    return `<path d="M10 8H118M10 120H118" stroke="${spec.detail}" stroke-width="1.4" opacity=".4"/>`;
  }
  if (spec.id === 'slat-wall') {
    return `<path d="M15 0V12M29 0V12M99 116V128M113 116V128" stroke="${spec.detail}" stroke-width="1.3" opacity=".58"/>`;
  }
  return '';
}

function fullCellHorizontal(spec: DoorMaterial, state: DoorState): string {
  const leaves = state === 'closed'
    ? [
      `<path d="M14 37H114V117H14Z" fill="${CONTOUR}"/>`,
      `<path d="M18 40H62V114H18ZM66 40H110V114H66Z" fill="${DOOR_PANEL}"/>`,
      `<path d="M49 50H58V84H49ZM70 50H79V84H70Z" fill="${DOOR_GLASS}" opacity=".82"/>`,
      `<path d="M50 51H53V83H50ZM71 51H74V83H71Z" fill="#FFFFFF" opacity=".16"/>`,
      `<path d="M64 40V114" stroke="${CONTOUR}" stroke-width="2"/>`,
    ].join('')
    : [
      `<path d="M14 37H24V117H14ZM104 37H114V117H104Z" fill="${CONTOUR}"/>`,
      `<path d="M18 40H23V114H18ZM105 40H110V114H105Z" fill="${DOOR_PANEL_LIGHT}"/>`,
      `<path d="M20 50H23V84H20ZM105 50H108V84H105Z" fill="${DOOR_GLASS}" opacity=".72"/>`,
    ].join('');
  return [
    // Only narrow material sockets remain at the cell seam. The adjacent wall
    // owns the mass; this tile owns a nearly full-cell interruption in it.
    `<path d="M0 2H12V126H0ZM116 2H128V126H116Z" fill="${CONTOUR}"/>`,
    `<path d="M0 8H12V120H0ZM116 8H128V120H116Z" fill="${spec.primary}"/>`,
    `<path d="M0 8H12V16H0ZM116 8H128V16H116Z" fill="${spec.accent}"/>`,
    `<path d="M0 76H12V120H0ZM116 76H128V120H116Z" fill="${spec.secondary}"/>`,
    horizontalDetail(spec),
    // One continuous wall-plane lintel replaces the nested header bands.
    `<path d="M4 2H124V40H4Z" fill="${CONTOUR}"/>`,
    `<path d="M8 8H120V35H8Z" fill="${spec.primary}"/>`,
    `<path d="M8 8H120V16H8Z" fill="${spec.accent}"/>`,
    `<path d="M8 25H120V35H8Z" fill="${spec.secondary}"/>`,
    // The jamb is one wall return plus the structural outline.
    `<path d="M4 34H16V120H4ZM112 34H124V120H112Z" fill="${CONTOUR}"/>`,
    `<path d="M8 38H16V76H8ZM112 38H120V76H112Z" fill="${spec.primary}"/>`,
    `<path d="M8 76H16V116H8ZM112 76H120V116H112Z" fill="${spec.secondary}"/>`,
    `<path d="M14 38H16V116H14ZM112 38H114V116H112Z" fill="${spec.accent}"/>`,
    `<path d="M14 116H114V122H14Z" fill="${CONTOUR}" opacity=".82"/>`,
    `<circle cx="64" cy="31.5" r="1.8" fill="${STATUS}"/>`,
    leaves,
  ].join('');
}

function fullCellVertical(spec: DoorMaterial, state: DoorState): string {
  const leaves = state === 'closed'
    ? [
      `<path d="M49 14H79V114H49Z" fill="${CONTOUR}"/>`,
      `<path d="M52 18H76V62H52ZM52 66H76V110H52Z" fill="${DOOR_PANEL}"/>`,
      `<path d="M58 49H70V58H58ZM58 70H70V79H58Z" fill="${DOOR_GLASS}" opacity=".82"/>`,
      `<path d="M59 50H62V57H59ZM59 71H62V78H59Z" fill="#FFFFFF" opacity=".16"/>`,
      `<path d="M52 64H76" stroke="${CONTOUR}" stroke-width="2"/>`,
    ].join('')
    : [
      `<path d="M49 14H79V24H49ZM49 104H79V114H49Z" fill="${CONTOUR}"/>`,
      `<path d="M52 18H76V23H52ZM52 105H76V110H52Z" fill="${DOOR_PANEL_LIGHT}"/>`,
      `<path d="M58 20H70V23H58ZM58 105H70V108H58Z" fill="${DOOR_GLASS}" opacity=".72"/>`,
    ].join('');
  return [
    `<path d="M2 0H126V12H2ZM2 116H126V128H2Z" fill="${CONTOUR}"/>`,
    `<path d="M8 0H120V12H8ZM8 116H120V128H8Z" fill="${spec.primary}"/>`,
    `<path d="M8 0H38V12H8ZM90 0H120V12H90ZM8 116H38V128H8ZM90 116H120V128H90Z" fill="${spec.accent}"/>`,
    verticalDetail(spec),
    `<path d="M38 4H90V16H38Z" fill="${CONTOUR}"/>`,
    `<path d="M42 4H86V12H42Z" fill="${spec.secondary}"/>`,
    `<path d="M38 112H90V124H38Z" fill="${CONTOUR}"/>`,
    `<path d="M42 116H86V124H42Z" fill="${spec.accent}"/>`,
    `<path d="M46 4H82V16H46ZM46 112H82V124H46Z" fill="${CONTOUR}"/>`,
    `<path d="M50 8H78V15H50Z" fill="${spec.secondary}"/>`,
    `<path d="M50 113H78V120H50Z" fill="${spec.accent}"/>`,
    `<path d="M46 14H51V114H46ZM77 14H82V114H77Z" fill="${CONTOUR}"/>`,
    `<path d="M48 18H51V110H48ZM77 18H80V110H77Z" fill="${spec.accent}"/>`,
    `<circle cx="48.5" cy="64" r="1.8" fill="${STATUS}"/>`,
    leaves,
  ].join('');
}

export function fullCellQuietWallDoorSvg(
  id: QuietWallFamilyId,
  axis: DoorAxis,
  state: DoorState,
  wallPalette?: Pick<DoorMaterial, 'primary' | 'secondary' | 'accent'> & { detail?: string },
): string {
  const base = material(id);
  const spec: DoorMaterial = wallPalette
    ? { ...base, ...wallPalette, detail: wallPalette.detail ?? base.detail }
    : base;
  const art = axis === 'horizontal' ? fullCellHorizontal(spec, state) : fullCellVertical(spec, state);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" ` +
    `data-review-only="quiet-wall-door-full-cell-opening" data-axis="${axis}" data-state="${state}">${art}</svg>`;
}

function currentDoorSvg(axis: DoorAxis, state: DoorState): string {
  const svg = authoredPropSvg('door', {
    open: state === 'open' ? 1 : 0,
    facing: axis === 'vertical' ? 1 : 0,
  });
  if (!svg) throw new Error(`Missing current promoted door ${axis}/${state}`);
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

function building(
  id: QuietWallFamilyId,
  current: boolean,
  x: number,
  y: number,
  cell: number,
  columns = 14,
  rows = 8,
): string {
  const doorColumn = Math.floor(columns / 2);
  const doorKey = key(doorColumn, rows - 1);
  const cells = new Set<string>();
  for (let column = 0; column < columns; column += 1) {
    cells.add(key(column, 0));
    cells.add(key(column, rows - 1));
  }
  for (let row = 0; row < rows; row += 1) {
    cells.add(key(0, row));
    cells.add(key(columns - 1, row));
  }
  const parts: string[] = [
    `<rect x="${x}" y="${y}" width="${columns * cell}" height="${rows * cell}" fill="${OUTSIDE}"/>`,
    floorGrid(x + cell, y + cell, (columns - 2) * cell, (rows - 2) * cell, cell),
  ];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const cellKey = key(column, row);
      if (!cells.has(cellKey)) continue;
      const px = x + column * cell;
      const py = y + row * cell;
      if (cellKey === doorKey) {
        parts.push(`<rect x="${px}" y="${py}" width="${cell}" height="${cell}" fill="${OUTSIDE}"/>`);
        if (current) {
          parts.push(placedSvg(currentDoorSvg('horizontal', 'open'), px - cell / 2, py - cell / 2, cell * 2));
        } else {
          parts.push(placedSvg(fullCellQuietWallDoorSvg(id, 'horizontal', 'open'), px, py, cell));
        }
      } else {
        parts.push(placedWallSvg(
          runtimeWallSvg(id, neighbors(cells, column, row)),
          px,
          py,
          cell,
          `${id}-${current}-${x}-${y}-${column}-${row}`,
        ));
      }
    }
  }
  return parts.join('');
}

function horizontalDoorRun(current: boolean, x: number, y: number, cell: number): string {
  return [
    floorGrid(x, y, cell * 3, cell, cell),
    placedWallSvg(runtimeWallSvg('office-wall', NB.E), x, y, cell, `shading-left-${current}`),
    placedWallSvg(runtimeWallSvg('office-wall', NB.W), x + cell * 2, y, cell, `shading-right-${current}`),
    current
      ? placedSvg(currentDoorSvg('horizontal', 'open'), x + cell / 2, y - cell / 2, cell * 2)
      : placedSvg(fullCellQuietWallDoorSvg('office-wall', 'horizontal', 'open'), x + cell, y, cell),
  ].join('');
}

function paletteChip(x: number, y: number, color: string, label: string): string {
  return `<rect x="${x}" y="${y}" width="18" height="18" rx="2" fill="${color}" stroke="${CONTOUR}" stroke-width="1"/>` +
    text(x + 26, y + 14, `${label} ${color}`, 9.5, 650, MUTED);
}

export function renderFullCellDoorShadingAuditSvg(): string {
  const width = 1880;
  const height = 650;
  const parts: string[] = [
    text(28, 42, 'DOOR PASS 3 · LIVE WALL SHADING AUDIT', 25, 860),
    text(28, 69, 'The current door is baked against a different palette; the candidate uses the wall instance shown beside it', 12, 620, MUTED),
    text(width - 28, 42, 'FRESH IMPORT EVIDENCE', 11, 840, PROPOSED, 'end'),
    panel(28, 94, 894, 500),
    panel(958, 94, 894, 500, PANEL_ALT),
    text(48, 126, 'CURRENT · TWO COMPETING SHADE SYSTEMS', 12, 820, REVIEW_RED),
    text(978, 126, 'PROPOSED · ONE WALL-OWNED SHADE SYSTEM', 12, 820, PROPOSED),
    horizontalDoorRun(true, 112, 166, 220),
    horizontalDoorRun(false, 1042, 166, 220),
    text(48, 432, 'EXPORTED WALL.JSON', 10, 800, MUTED),
    paletteChip(48, 449, '#B4B2A9', 'primary'),
    paletteChip(210, 449, '#888780', 'secondary'),
    paletteChip(372, 449, '#5F5E5A', 'accent'),
    text(48, 498, 'PROMOTED DOOR BANK', 10, 800, REVIEW_RED),
    paletteChip(48, 515, '#85867F', 'primary'),
    paletteChip(210, 515, '#B0AEA5', 'secondary'),
    paletteChip(372, 515, '#999A92', 'accent'),
    text(978, 432, 'DOOR STRUCTURE INHERITS EXPORTED WALL.JSON', 10, 800, PROPOSED),
    paletteChip(978, 449, '#B4B2A9', 'primary'),
    paletteChip(1140, 449, '#888780', 'secondary'),
    paletteChip(1302, 449, '#5F5E5A', 'accent'),
    text(978, 507, 'The wall-side sockets and lintel now continue the same cap, face, and return values.', 10.5, 650, MUTED),
    text(978, 534, 'Leaf and glass colors remain shared door equipment.', 10.5, 650, MUTED),
    text(28, 630, 'UNFINISHED GATE · this proves the correction direction; current canonical source and Unity import are untouched', 11, 820, REVIEW_RED),
  ];
  return page(width, height, parts.join(''));
}

export function renderFullCellDoorFacadeComparisonSvg(): string {
  const width = 1880;
  const height = 680;
  const parts: string[] = [
    text(28, 42, 'DOOR PASS 3 · LONG-WALL GAMEPLAY CONTEXT', 25, 860),
    text(28, 69, 'Receiver scale is correct · proposed passage is wider and inherits the actual exported wall palette', 12, 620, MUTED),
    text(width - 28, 42, 'REVIEW-ONLY · NO NEW PROMOTION', 11, 840, REVIEW_RED, 'end'),
    panel(28, 94, 894, 540),
    panel(958, 94, 894, 540, PANEL_ALT),
    text(48, 126, 'CURRENT IMPORT · FRAME DOMINATES', 12, 820, REVIEW_RED),
    text(978, 126, 'PROPOSED · OPENING + SHADING MATCH', 12, 820, PROPOSED),
    building('office-wall', true, 72, 152, 54),
    building('office-wall', false, 1002, 152, 54),
    text(475, 610, '52 / 128 clear passage · narrow slot in a long facade', 10, 650, MUTED, 'middle'),
    text(1405, 610, '80 / 128 passage · door structure uses this wall instance’s planes', 10, 700, PROPOSED, 'middle'),
    text(28, 660, 'UNFINISHED GATE · candidate stays local to this proof until the long-wall read is approved', 11, 820, REVIEW_RED),
  ];
  return page(width, height, parts.join(''));
}

const STATES = [
  { axis: 'horizontal', state: 'closed', label: 'HORIZONTAL · CLOSED' },
  { axis: 'horizontal', state: 'open', label: 'HORIZONTAL · OPEN' },
  { axis: 'vertical', state: 'closed', label: 'VERTICAL · CLOSED' },
  { axis: 'vertical', state: 'open', label: 'VERTICAL · OPEN' },
] as const;

export function renderFullCellDoorStateComparisonSvg(): string {
  const width = 1880;
  const height = 760;
  const parts: string[] = [
    text(28, 42, 'FULL-CELL OPENING · FOUR-STATE CONSTRUCTION', 25, 860),
    text(28, 69, 'Same wall-instance palette and shared leaves; less frame, more actual doorway', 12, 620, MUTED),
    text(width - 28, 42, 'OUTER APERTURE 88 → 120', 11, 840, PROPOSED, 'end'),
  ];
  STATES.forEach((entry, index) => {
    const x = 28 + index * 462;
    parts.push(panel(x, 94, 444, 610, index % 2 === 0 ? PANEL : PANEL_ALT));
    parts.push(text(x + 18, 126, entry.label, 14, 820));
    parts.push(text(x + 18, 154, 'CURRENT PROMOTED', 10, 800, REVIEW_RED));
    parts.push(`<rect x="${x + 126}" y="172" width="192" height="192" rx="4" fill="${FLOOR}"/>`);
    parts.push(placedSvg(currentDoorSvg(entry.axis, entry.state), x + 62, 108, 320));
    parts.push(text(x + 18, 405, 'PROPOSED FULL-CELL', 10, 800, PROPOSED));
    parts.push(`<rect x="${x + 126}" y="423" width="192" height="192" rx="4" fill="${FLOOR}"/>`);
    parts.push(placedSvg(fullCellQuietWallDoorSvg('office-wall', entry.axis, entry.state), x + 126, 423, 192));
    parts.push(text(x + 222, 649, 'quieter lintel · leaves hide behind jambs', 9.5, 650, PROPOSED, 'middle'));
  });
  parts.push(text(28, 738, 'PLACEMENT CONTRACT UNCHANGED · the source still receives the same centered .5 wrapper only after approval', 11, 800, MUTED));
  return page(width, height, parts.join(''));
}

export function renderFullCellDoorMaterialsSvg(): string {
  const width = 1880;
  const height = 500;
  const parts: string[] = [
    text(28, 42, 'FULL-CELL OPENING · RETAINED MATERIAL CHECK', 25, 860),
    text(28, 69, 'Open horizontal state at 128 px and 48 px wall-cell scales', 12, 620, MUTED),
  ];
  FULL_CELL_DOOR_MATERIALS.forEach((spec, index) => {
    const x = 28 + index * 366;
    parts.push(panel(x, 96, 348, 344, index % 2 === 0 ? PANEL : PANEL_ALT));
    parts.push(text(x + 16, 126, spec.label.toUpperCase(), 11, 800));
    parts.push(`<rect x="${x + 74}" y="146" width="200" height="200" rx="4" fill="${FLOOR}"/>`);
    parts.push(placedSvg(fullCellQuietWallDoorSvg(spec.id, 'horizontal', 'open'), x + 74, 146, 200));
    parts.push(`<rect x="${x + 150}" y="368" width="48" height="48" rx="2" fill="${FLOOR}"/>`);
    parts.push(placedSvg(fullCellQuietWallDoorSvg(spec.id, 'horizontal', 'open'), x + 150, 368, 48));
  });
  parts.push(text(28, 478, 'MATERIAL DETAIL REMAINS ON THE WALL SOCKETS · the opening itself stays shared equipment', 11, 800, PROPOSED));
  return page(width, height, parts.join(''));
}

export async function renderFullCellDoorPreview(output: string): Promise<readonly string[]> {
  await mkdir(output, { recursive: true });
  const pages = [
    ['01-live-wall-shading-audit', renderFullCellDoorShadingAuditSvg()],
    ['02-long-wall-runtime-context', renderFullCellDoorFacadeComparisonSvg()],
    ['03-four-state-construction', renderFullCellDoorStateComparisonSvg()],
    ['04-five-material-scale-check', renderFullCellDoorMaterialsSvg()],
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
    ...QUIET_WALL_DOOR_FULL_CELL_REVIEW,
    materials: FULL_CELL_DOOR_MATERIALS,
  }, null, 2)}\n`, 'utf8');
  files.push(metricsPath);
  const readmePath = path.join(output, 'README.md');
  await writeFile(readmePath, [
    '# Quiet Wall Door Runtime Fit v3',
    '',
    'Status: **review-only candidate; promoted v2 source and Unity import unchanged**',
    '',
    'The fresh Unity import proves that the receiver is honoring the one-cell footprint and centered',
    'source compensation. It also exposes a second defect: the exported Office wall uses',
    '`#B4B2A9 / #888780 / #5F5E5A`, while the promoted door was baked against',
    '`#85867F / #B0AEA5 / #999A92`. The door therefore cannot match the wall even when its',
    'plane ordering is internally consistent.',
    '',
    'This proof draws its wall-owned door structure from the fresh import’s actual wall palette.',
    'Production should resolve those values from the exported wall instance rather than introduce',
    'another fixed door palette. The remaining proportion problem is also addressed: v2 leaves only',
    '52/128 (41%) as clear passage, so the frame dominates and reads as a narrow inserted prop.',
    '',
    'This pass increases the outer aperture from 88/128 to 120/128 and the clear open passage to',
    '80/128 (63%). The wall-plane lintel becomes one continuous construction, the jamb becomes one',
    'quiet return, and open leaves retract behind it. Runtime footprint, facing, material, transparency,',
    'and the eventual centered 0.5 source wrapper remain unchanged.',
    '',
    'Nothing in the promoted source bank, generated registry, browser export, Unity import, staging,',
    'or commit is changed by this proof.',
    '',
  ].join('\n'), 'utf8');
  files.push(readmePath);
  return files;
}

function outputPath(argv: readonly string[]): string {
  const index = argv.indexOf('--out');
  return index >= 0 && argv[index + 1]
    ? path.resolve(argv[index + 1])
    : path.resolve('docs/previews/quiet-wall-door-runtime-fit-v3');
}

const isMain = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;

if (isMain) {
  const output = outputPath(process.argv.slice(2));
  const files = await renderFullCellDoorPreview(output);
  process.stdout.write(`Wrote ${files.length} full-cell door review files to ${output}\n`);
}
