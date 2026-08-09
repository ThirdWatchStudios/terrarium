/**
 * Review-only correction proof prompted by the first Unity import of the
 * promoted quiet-wall door bank. The imported source remains untouched until
 * this wider aperture and corrected wall-plane mapping are approved.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

import { authoredPropSvg } from '../src/props/authoredArt';
import { NB } from '../src/tiles/blob';
import {
  QUIET_WALL_FAMILIES,
  type QuietWallFamilyId,
  proposedWallSvg,
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

interface DoorMaterial {
  id: QuietWallFamilyId;
  label: string;
  primary: string;
  secondary: string;
  accent: string;
  detail: string;
}

export const CORRECTED_DOOR_MATERIALS: readonly DoorMaterial[] = QUIET_WALL_FAMILIES.map((family) => ({
  id: family.id,
  label: family.label,
  primary: family.palette.primary,
  secondary: family.palette.secondary,
  accent: family.palette.accent,
  detail: family.detail,
}));

export const QUIET_WALL_DOOR_RUNTIME_CORRECTION = {
  status: 'review-only-runtime-correction-awaiting-visual-approval',
  sourceOfFinding: 'fresh-unity-import-game-view',
  stableTemplateId: 'door',
  stableStates: ['horizontal-closed', 'horizontal-open', 'vertical-closed', 'vertical-open'],
  retainedRuntimeEnvelope: 'one-0.5-world-unit-wall-cell',
  retainedSourceCompensation: 0.5,
  horizontalOuterApertureBefore: 58,
  horizontalOuterApertureAfter: 88,
  horizontalOuterAperturePercentBefore: 45.3125,
  horizontalOuterAperturePercentAfter: 68.75,
  horizontalOpenPassageBefore: 28,
  horizontalOpenPassageAfter: 52,
  correctedHorizontalSocketPlanes: {
    contour: 'y2..126',
    primary: 'y8..120',
    northLipAccent: 'y8..16',
    southFrontSecondary: 'y76..120',
  },
  correctedVerticalSocketPlanes: {
    contour: 'x2..126',
    primary: 'x8..120',
    sideReturnAccent: ['x8..38', 'x90..120'],
    straightRunSecondaryPlane: false,
  },
  canonicalSvgMutation: false,
  generatedRegistryMutation: false,
  productionTemplateMutation: false,
  exporterMutation: false,
  unityMutation: false,
  browserExport: false,
  unityImport: false,
  staging: false,
  commit: false,
} as const;

function material(id: QuietWallFamilyId): DoorMaterial {
  const found = CORRECTED_DOOR_MATERIALS.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`Unknown corrected door material ${id}`);
  return found;
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

function horizontalMaterialDetail(spec: DoorMaterial): string {
  if (spec.id === 'brick-wall') {
    return `<path d="M8 94H20M108 94H120M14 76V94M114 94V120" stroke="${spec.detail}" stroke-width="1.4" opacity=".68"/>`;
  }
  if (spec.id === 'panel-wall') {
    return `<path d="M14 76V120M114 76V120" stroke="${spec.detail}" stroke-width="1.25" opacity=".55"/>`;
  }
  if (spec.id === 'cubicle-partition') {
    return `<path d="M8 105H20M108 105H120" stroke="${spec.detail}" stroke-width="1.5" opacity=".44"/>`;
  }
  if (spec.id === 'slat-wall') {
    return `<path d="M8 76V120M15 76V120M113 76V120M120 76V120" stroke="${spec.detail}" stroke-width="1.45" opacity=".62"/>`;
  }
  return '';
}

function verticalMaterialDetail(spec: DoorMaterial): string {
  if (spec.id === 'brick-wall') {
    return `<path d="M8 12H120M8 116H120M28 0V20M72 108V128" stroke="${spec.detail}" stroke-width="1.35" opacity=".68"/>`;
  }
  if (spec.id === 'panel-wall') {
    return `<path d="M64 0V20M64 108V128" stroke="${spec.detail}" stroke-width="1.25" opacity=".55"/>`;
  }
  if (spec.id === 'cubicle-partition') {
    return `<path d="M10 15H118M10 113H118" stroke="${spec.detail}" stroke-width="1.5" opacity=".44"/>`;
  }
  if (spec.id === 'slat-wall') {
    return `<path d="M15 0V20M29 0V20M99 108V128M113 108V128" stroke="${spec.detail}" stroke-width="1.45" opacity=".62"/>`;
  }
  return '';
}

function correctedHorizontal(spec: DoorMaterial, state: DoorState): string {
  const leaves = state === 'closed'
    ? [
      `<path d="M28 37H100V117H28Z" fill="${CONTOUR}"/>`,
      `<path d="M31 40H62V114H31ZM66 40H97V114H66Z" fill="${DOOR_PANEL}"/>`,
      `<path d="M51 50H59V83H51ZM69 50H77V83H69Z" fill="${DOOR_GLASS}" opacity=".82"/>`,
      `<path d="M52 51H54V82H52ZM70 51H72V82H70Z" fill="#FFFFFF" opacity=".16"/>`,
      `<path d="M64 40V114" stroke="${CONTOUR}" stroke-width="2"/>`,
    ].join('')
    : [
      `<path d="M28 37H38V117H28ZM90 37H100V117H90Z" fill="${CONTOUR}"/>`,
      `<path d="M31 40H37V114H31ZM91 40H97V114H91Z" fill="${DOOR_PANEL_LIGHT}"/>`,
      `<path d="M33 50H37V83H33ZM91 50H95V83H91Z" fill="${DOOR_GLASS}" opacity=".72"/>`,
    ].join('');

  return [
    // Exact horizontal straight-wall socket planes from the production compositor.
    `<path d="M0 2H24V126H0ZM104 2H128V126H104Z" fill="${CONTOUR}"/>`,
    `<path d="M0 8H24V120H0ZM104 8H128V120H104Z" fill="${spec.primary}"/>`,
    `<path d="M0 8H24V16H0ZM104 8H128V16H104Z" fill="${spec.accent}"/>`,
    `<path d="M0 76H24V120H0ZM104 76H128V120H104Z" fill="${spec.secondary}"/>`,
    horizontalMaterialDetail(spec),
    // The wider lintel is a local wall cross-section: cap, top lip, then front face.
    `<path d="M20 2H108V40H20Z" fill="${CONTOUR}"/>`,
    `<path d="M24 8H104V35H24Z" fill="${spec.primary}"/>`,
    `<path d="M24 8H104V16H24Z" fill="${spec.accent}"/>`,
    `<path d="M24 25H104V35H24Z" fill="${spec.secondary}"/>`,
    // Jamb faces continue the wall planes instead of using a flipped single shade.
    `<path d="M20 34H29V120H20ZM99 34H108V120H99Z" fill="${CONTOUR}"/>`,
    `<path d="M24 38H29V76H24ZM99 38H104V76H99Z" fill="${spec.primary}"/>`,
    `<path d="M24 76H29V116H24ZM99 76H104V116H99Z" fill="${spec.secondary}"/>`,
    `<path d="M27 38H29V116H27ZM99 38H101V116H99Z" fill="${spec.accent}"/>`,
    `<path d="M28 116H100V122H28Z" fill="${CONTOUR}" opacity=".82"/>`,
    `<path d="M31 119H97" stroke="${DOOR_PANEL_LIGHT}" stroke-width="1" opacity=".55"/>`,
    `<circle cx="64" cy="31.5" r="1.8" fill="${STATUS}"/>`,
    leaves,
  ].join('');
}

function correctedVertical(spec: DoorMaterial, state: DoorState): string {
  const leaves = state === 'closed'
    ? [
      `<path d="M49 27H79V101H49Z" fill="${CONTOUR}"/>`,
      `<path d="M52 30H76V62H52ZM52 66H76V98H52Z" fill="${DOOR_PANEL}"/>`,
      `<path d="M58 48H70V58H58ZM58 70H70V80H58Z" fill="${DOOR_GLASS}" opacity=".82"/>`,
      `<path d="M59 49H62V57H59ZM59 71H62V79H59Z" fill="#FFFFFF" opacity=".16"/>`,
      `<path d="M52 64H76" stroke="${CONTOUR}" stroke-width="2"/>`,
    ].join('')
    : [
      `<path d="M49 27H79V40H49ZM49 88H79V101H49Z" fill="${CONTOUR}"/>`,
      `<path d="M52 30H76V39H52ZM52 89H76V98H52Z" fill="${DOOR_PANEL_LIGHT}"/>`,
      `<path d="M58 34H70V39H58ZM58 89H70V94H58Z" fill="${DOOR_GLASS}" opacity=".72"/>`,
    ].join('');

  return [
    // Exact vertical straight-wall socket planes. The old door incorrectly
    // substituted a secondary west slab and accent east slab here.
    `<path d="M2 0H126V24H2ZM2 104H126V128H2Z" fill="${CONTOUR}"/>`,
    `<path d="M8 0H120V24H8ZM8 104H120V128H8Z" fill="${spec.primary}"/>`,
    `<path d="M8 0H38V24H8ZM90 0H120V24H90ZM8 104H38V128H8ZM90 104H120V128H90Z" fill="${spec.accent}"/>`,
    verticalMaterialDetail(spec),
    // Exposed ends of the two wall stubs use the same front/lip hierarchy as
    // production termini, without changing the straight-run side planes.
    `<path d="M38 16H90V28H38Z" fill="${CONTOUR}"/>`,
    `<path d="M42 16H86V24H42Z" fill="${spec.secondary}"/>`,
    `<path d="M38 100H90V112H38Z" fill="${CONTOUR}"/>`,
    `<path d="M42 104H86V112H42Z" fill="${spec.accent}"/>`,
    `<path d="M46 20H82V29H46ZM46 99H82V108H46Z" fill="${CONTOUR}"/>`,
    `<path d="M50 23H78V28H50Z" fill="${spec.secondary}"/>`,
    `<path d="M50 100H78V105H50Z" fill="${spec.accent}"/>`,
    `<path d="M46 27H51V101H46ZM77 27H82V101H77Z" fill="${CONTOUR}"/>`,
    `<path d="M48 30H51V98H48ZM77 30H80V98H77Z" fill="${spec.accent}"/>`,
    `<circle cx="48.5" cy="64" r="1.8" fill="${STATUS}"/>`,
    leaves,
  ].join('');
}

export function correctedQuietWallDoorSvg(
  id: QuietWallFamilyId,
  axis: DoorAxis,
  state: DoorState,
): string {
  const spec = material(id);
  const art = axis === 'horizontal' ? correctedHorizontal(spec, state) : correctedVertical(spec, state);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" ` +
    `data-review-only="quiet-wall-door-runtime-correction" data-axis="${axis}" data-state="${state}">${art}</svg>`;
}

function importedDoorSvg(axis: DoorAxis, state: DoorState): string {
  const svg = authoredPropSvg('door', {
    open: state === 'open' ? 1 : 0,
    facing: axis === 'vertical' ? 1 : 0,
  });
  if (!svg) throw new Error(`Missing imported door source ${axis}/${state}`);
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

function doorRun(
  id: QuietWallFamilyId,
  axis: DoorAxis,
  state: DoorState,
  current: boolean,
  x: number,
  y: number,
  cell: number,
): string {
  const parts: string[] = [];
  if (axis === 'horizontal') {
    parts.push(floorGrid(x, y, cell * 3, cell, cell));
    parts.push(placedWallSvg(proposedWallSvg(id, NB.E), x, y, cell, `${id}-${x}-${y}-left`));
    parts.push(placedWallSvg(proposedWallSvg(id, NB.W), x + cell * 2, y, cell, `${id}-${x}-${y}-right`));
  } else {
    parts.push(floorGrid(x, y, cell, cell * 3, cell));
    parts.push(placedWallSvg(proposedWallSvg(id, NB.S), x, y, cell, `${id}-${x}-${y}-top`));
    parts.push(placedWallSvg(proposedWallSvg(id, NB.N), x, y + cell * 2, cell, `${id}-${x}-${y}-bottom`));
  }
  const dx = axis === 'horizontal' ? x + cell : x;
  const dy = axis === 'horizontal' ? y : y + cell;
  if (current) {
    // The canonical source contains the required centered .5 compensation.
    parts.push(placedSvg(importedDoorSvg(axis, state), dx - cell / 2, dy - cell / 2, cell * 2));
  } else {
    parts.push(placedSvg(correctedQuietWallDoorSvg(id, axis, state), dx, dy, cell));
  }
  return parts.join('');
}

const STATES = [
  { axis: 'horizontal', state: 'closed', label: 'HORIZONTAL · CLOSED' },
  { axis: 'horizontal', state: 'open', label: 'HORIZONTAL · OPEN' },
  { axis: 'vertical', state: 'closed', label: 'VERTICAL · CLOSED' },
  { axis: 'vertical', state: 'open', label: 'VERTICAL · OPEN' },
] as const;

export function renderDoorRuntimeCorrectionComparisonSvg(): string {
  const width = 1880;
  const height = 790;
  const cardWidth = 444;
  const parts: string[] = [
    text(28, 42, 'DOOR RUNTIME CORRECTION · SCALE + WALL PLANES', 25, 860),
    text(28, 69, 'Fresh Unity import finding · one-cell envelope retained; aperture and face construction corrected', 12, 620, MUTED),
    text(width - 28, 42, 'REVIEW-ONLY · NOT PROMOTED', 11, 840, REVIEW_RED, 'end'),
  ];
  STATES.forEach((entry, index) => {
    const x = 28 + index * 462;
    parts.push(panel(x, 94, cardWidth, 640, index % 2 === 0 ? PANEL : PANEL_ALT));
    parts.push(text(x + 18, 126, entry.label, 14, 820));
    parts.push(text(x + 18, 151, 'CURRENT IMPORT', 10, 800, REVIEW_RED));
    const cell = entry.axis === 'horizontal' ? 96 : 66;
    const runX = entry.axis === 'horizontal' ? x + 78 : x + 189;
    const currentY = entry.axis === 'horizontal' ? 174 : 165;
    parts.push(doorRun('office-wall', entry.axis, entry.state, true, runX, currentY, cell));
    parts.push(text(x + cardWidth / 2, 387, 'narrow aperture · socket shades oppose wall planes', 10, 620, MUTED, 'middle'));
    parts.push(text(x + 18, 423, 'CORRECTED SOURCE', 10, 800, PROPOSED));
    const correctedY = entry.axis === 'horizontal' ? 446 : 437;
    parts.push(doorRun('office-wall', entry.axis, entry.state, false, runX, correctedY, cell));
    const note = entry.axis === 'horizontal'
      ? '45% → 69% outer aperture · y8–16 lip · y76–120 front'
      : 'wider interruption · production x-plane mapping restored';
    parts.push(text(x + cardWidth / 2, 672, note, 9.5, 670, PROPOSED, 'middle'));
    parts.push(text(x + cardWidth / 2, 699, '.5 source compensation retained', 9.5, 650, MUTED, 'middle'));
  });
  parts.push(text(28, 768, 'UNFINISHED GATE · canonical door bank, generated art, browser export, and Unity import remain unchanged', 11, 820, REVIEW_RED));
  return page(width, height, parts.join(''));
}

export function renderDoorRuntimeCorrectionMaterialsSvg(): string {
  const width = 1880;
  const height = 940;
  const parts: string[] = [
    text(28, 42, 'CORRECTED DOOR BANK · FIVE WALL MATERIALS', 25, 860),
    text(28, 69, 'The larger opening is shared; socket cap, front, returns, and face detail remain material-owned', 12, 620, MUTED),
    text(width - 28, 42, 'FOUR STATES · ONE CELL EACH', 11, 840, PROPOSED, 'end'),
  ];
  STATES.forEach((entry, index) => {
    parts.push(text(470 + index * 330, 108, entry.label, 11, 800, MUTED, 'middle'));
  });
  CORRECTED_DOOR_MATERIALS.forEach((spec, row) => {
    const y = 130 + row * 154;
    parts.push(panel(28, y, width - 56, 136, row % 2 === 0 ? PANEL : PANEL_ALT));
    parts.push(text(48, y + 34, spec.label.toUpperCase(), 14, 820));
    parts.push(`<rect x="48" y="${y + 52}" width="24" height="24" rx="3" fill="${spec.primary}" stroke="${CONTOUR}"/>`);
    parts.push(text(82, y + 69, 'cap', 10, 650, MUTED));
    parts.push(`<rect x="48" y="${y + 84}" width="24" height="24" rx="3" fill="${spec.secondary}" stroke="${CONTOUR}"/>`);
    parts.push(text(82, y + 101, 'front', 10, 650, MUTED));
    STATES.forEach((entry, column) => {
      const size = 112;
      const x = 414 + column * 330;
      parts.push(`<rect x="${x}" y="${y + 12}" width="${size}" height="${size}" rx="4" fill="${FLOOR}"/>`);
      parts.push(placedSvg(correctedQuietWallDoorSvg(spec.id, entry.axis, entry.state), x, y + 12, size));
    });
  });
  parts.push(text(28, 918, 'REVIEW TARGET · clear wall interruption first; material and sliding-leaf identity second', 11, 800, PROPOSED));
  return page(width, height, parts.join(''));
}

function key(column: number, row: number): string {
  return `${column},${row}`;
}

function roomNeighbors(cells: ReadonlySet<string>, column: number, row: number): number {
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

function gameplayRoom(id: QuietWallFamilyId, x: number, y: number, cell: number): string {
  const columns = 5;
  const rows = 4;
  const horizontalDoor = key(2, rows - 1);
  const verticalDoor = key(columns - 1, 1);
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
      if (cellKey === horizontalDoor) {
        parts.push(`<rect x="${px}" y="${py}" width="${cell}" height="${cell}" fill="${FLOOR}"/>`);
        parts.push(placedSvg(correctedQuietWallDoorSvg(id, 'horizontal', 'closed'), px, py, cell));
      } else if (cellKey === verticalDoor) {
        parts.push(`<rect x="${px}" y="${py}" width="${cell}" height="${cell}" fill="${FLOOR}"/>`);
        parts.push(placedSvg(correctedQuietWallDoorSvg(id, 'vertical', 'open'), px, py, cell));
      } else {
        parts.push(placedWallSvg(
          proposedWallSvg(id, roomNeighbors(cells, column, row)),
          px,
          py,
          cell,
          `${id}-${x}-${y}-${column}-${row}`,
        ));
      }
    }
  }
  return parts.join('');
}

export function renderDoorRuntimeCorrectionGameplaySvg(): string {
  const width = 1880;
  const height = 800;
  const parts: string[] = [
    text(28, 42, 'CORRECTED DOORS · COMPOSED GAMEPLAY-SCALE READ', 25, 860),
    text(28, 69, 'Closed south opening · open side opening · same 48 px and 30 px wall-cell tests', 12, 620, MUTED),
    text(width - 28, 42, 'APERTURE WIDER · FOOTPRINT UNCHANGED', 11, 840, PROPOSED, 'end'),
  ];
  const largeCell = 48;
  CORRECTED_DOOR_MATERIALS.forEach((spec, index) => {
    const x = 28 + index * 366;
    parts.push(panel(x, 96, 348, 288));
    parts.push(text(x + 16, 124, spec.label.toUpperCase(), 11, 800));
    parts.push(gameplayRoom(spec.id, x + 54, 146, largeCell));
  });
  const smallCell = 30;
  CORRECTED_DOOR_MATERIALS.forEach((spec, index) => {
    const x = 28 + index * 366;
    parts.push(panel(x, 408, 348, 230, PANEL_ALT));
    parts.push(text(x + 16, 436, `${spec.label.toUpperCase()} · FAR`, 10, 780, MUTED));
    parts.push(gameplayRoom(spec.id, x + 99, 460, smallCell));
  });
  parts.push(text(28, 681, 'WHAT CHANGED', 10, 820, PROPOSED));
  parts.push(text(28, 708, '1 · the door now occupies most of its wall cell', 12, 650));
  parts.push(text(28, 735, '2 · connected sockets use the wall compositor’s actual cap / front / return planes', 12, 650));
  parts.push(text(28, 762, '3 · runtime footprint, state contract, material inheritance, and transparent open passage are unchanged', 12, 650));
  parts.push(text(width - 28, 779, 'PROMOTION REQUIRES THIS PROOF’S VISUAL APPROVAL', 11, 840, REVIEW_RED, 'end'));
  return page(width, height, parts.join(''));
}

export async function renderDoorRuntimeCorrectionPreview(output: string): Promise<readonly string[]> {
  await mkdir(output, { recursive: true });
  const pages = [
    ['01-current-corrected-scale-and-planes', renderDoorRuntimeCorrectionComparisonSvg()],
    ['02-corrected-five-material-bank', renderDoorRuntimeCorrectionMaterialsSvg()],
    ['03-corrected-composed-gameplay-scale', renderDoorRuntimeCorrectionGameplaySvg()],
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
    ...QUIET_WALL_DOOR_RUNTIME_CORRECTION,
    materials: CORRECTED_DOOR_MATERIALS,
  }, null, 2)}\n`, 'utf8');
  files.push(metricsPath);
  const readmePath = path.join(output, 'README.md');
  await writeFile(readmePath, [
    '# Quiet Wall Door Runtime Correction v2',
    '',
    'Status: **review-only correction; promoted source and Unity import unchanged**',
    '',
    'The first Unity review showed two real source problems: the visible door aperture was too',
    'narrow inside its wall cell, and the socket shading did not use the production wall compositor’s',
    'actual cap/front/return planes.',
    '',
    'This proof keeps the required centered 0.5 source compensation and one-cell runtime envelope.',
    'It widens the horizontal outer aperture from 58/128 (45%) to 88/128 (69%), widens the open',
    'passage from 28/128 to 52/128, and applies the exact connected-wall planes to the door sockets.',
    'The vertical states receive the corresponding wider wall interruption and corrected x-plane mapping.',
    '',
    'No canonical SVG, generated registry, production template, exporter, browser export, Unity import,',
    'staging, or commit is changed by this review proof.',
    '',
  ].join('\n'), 'utf8');
  files.push(readmePath);
  return files;
}

function outputPath(argv: readonly string[]): string {
  const index = argv.indexOf('--out');
  return index >= 0 && argv[index + 1]
    ? path.resolve(argv[index + 1])
    : path.resolve('docs/previews/quiet-wall-door-runtime-correction-v2');
}

const isMain = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;

if (isMain) {
  const output = outputPath(process.argv.slice(2));
  const files = await renderDoorRuntimeCorrectionPreview(output);
  process.stdout.write(`Wrote ${files.length} door runtime-correction review files to ${output}\n`);
}
