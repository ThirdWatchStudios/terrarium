/**
 * Review-only fit proof for the sliding auto-door against the quiet five-wall
 * production system. Candidate geometry stays local to this renderer until the
 * composed gameplay-scale read is approved.
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

export const QUIET_WALL_DOOR_MATERIALS: readonly DoorMaterial[] = QUIET_WALL_FAMILIES.map((family) => ({
  id: family.id,
  label: family.label,
  primary: family.palette.primary,
  secondary: family.palette.secondary,
  accent: family.palette.accent,
  detail: family.detail,
}));

export const QUIET_WALL_DOOR_REVIEW = {
  status: 'review-only-candidate-awaiting-composed-visual-approval',
  stableTemplateId: 'door',
  stableStates: ['horizontal-closed', 'horizontal-open', 'vertical-closed', 'vertical-open'],
  retainedMechanic: 'double-retracting-sliding-auto-door',
  wallInheritance: ['cap-primary', 'front-secondary', 'return-accent', 'material-face-detail'],
  removedFromCandidate: [
    'oversized-pressure-mats',
    'coral-wall-band',
    'cream-green-wall-kit',
    'outlined-lower-door-panels',
    'decorative-threshold-hardware',
  ],
  retainedDoorCues: [
    'paired-sliding-leaves',
    'narrow-safety-glazing',
    'subtle-pressure-threshold',
    'single-status-point',
  ],
  proofWallSource: 'production-composeWallTile',
  proofCellComposition: 'flattened-clipped-wall-cells',
  candidateArtLocalToPreview: true,
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
  const found = QUIET_WALL_DOOR_MATERIALS.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`Unknown quiet wall door material ${id}`);
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

/**
 * Flatten a production wall cell into the review page and clip it in page
 * coordinates. Independently scaled nested SVG viewports can create false
 * antialias hairlines; this preserves the runtime crop without that review-only
 * presentation artifact.
 */
function placedWallSvg(source: string, x: number, y: number, size: number, id: string): string {
  const clipId = `wall-cell-${id.replaceAll(/[^a-zA-Z0-9_-]/g, '-')}`;
  return `<defs><clipPath id="${clipId}" clipPathUnits="userSpaceOnUse"><rect x="${x}" y="${y}" width="${size}" height="${size}"/></clipPath></defs>` +
    `<g clip-path="url(#${clipId})"><g transform="translate(${x} ${y}) scale(${size / 128})">${inner(source)}</g></g>`;
}

function materialDetailHorizontal(spec: DoorMaterial): string {
  if (spec.id === 'brick-wall') {
    return `<path d="M8 94H34M94 94H120M21 76V94M107 94V119" stroke="${spec.detail}" stroke-width="1.4" opacity=".68"/>`;
  }
  if (spec.id === 'panel-wall') {
    return `<path d="M21 74V119M107 74V119" stroke="${spec.detail}" stroke-width="1.25" opacity=".55"/>`;
  }
  if (spec.id === 'cubicle-partition') {
    return `<path d="M10 105H34M94 105H118" stroke="${spec.detail}" stroke-width="1.5" opacity=".44"/>`;
  }
  if (spec.id === 'slat-wall') {
    return `<path d="M15 75V119M24 75V119M104 75V119M113 75V119" stroke="${spec.detail}" stroke-width="1.55" opacity=".66"/>`;
  }
  return '';
}

function materialDetailVertical(spec: DoorMaterial): string {
  if (spec.id === 'brick-wall') {
    return `<path d="M8 25H120M8 103H120M28 8V25M72 103V120" stroke="${spec.detail}" stroke-width="1.35" opacity=".68"/>`;
  }
  if (spec.id === 'panel-wall') {
    return `<path d="M64 8V25M64 103V120" stroke="${spec.detail}" stroke-width="1.25" opacity=".55"/>`;
  }
  if (spec.id === 'cubicle-partition') {
    return `<path d="M10 28H118M10 100H118" stroke="${spec.detail}" stroke-width="1.5" opacity=".44"/>`;
  }
  if (spec.id === 'slat-wall') {
    return `<path d="M15 8V25M29 8V25M99 103V120M113 103V120" stroke="${spec.detail}" stroke-width="1.55" opacity=".66"/>`;
  }
  return '';
}

function horizontalCandidate(spec: DoorMaterial, state: DoorState): string {
  const leaves = state === 'closed'
    ? [
      `<path d="M41 37H87V119H41Z" fill="${CONTOUR}"/>`,
      `<path d="M44 40H62V116H44ZM66 40H84V116H66Z" fill="${DOOR_PANEL}"/>`,
      `<path d="M52 50H59V82H52ZM69 50H76V82H69Z" fill="${DOOR_GLASS}" opacity=".82"/>`,
      `<path d="M53 51H55V81H53ZM70 51H72V81H70Z" fill="#FFFFFF" opacity=".16"/>`,
      `<path d="M64 40V116" stroke="${CONTOUR}" stroke-width="2"/>`,
    ].join('')
    : [
      `<path d="M41 37H50V119H41ZM78 37H87V119H78Z" fill="${CONTOUR}"/>`,
      `<path d="M44 40H49V116H44ZM79 40H84V116H79Z" fill="${DOOR_PANEL_LIGHT}"/>`,
      `<path d="M46 50H49V82H46ZM79 50H82V82H79Z" fill="${DOOR_GLASS}" opacity=".72"/>`,
    ].join('');
  return [
    // Connected east/west sockets exactly match a production horizontal wall:
    // contour y2..126, primary y8..120, north lip y0..16, south face y72..128.
    `<path d="M0 2H39V126H0ZM89 2H128V126H89Z" fill="${CONTOUR}"/>`,
    `<path d="M0 8H35V120H0ZM93 8H128V120H93Z" fill="${spec.primary}"/>`,
    `<path d="M0 0H35V16H0ZM93 0H128V16H93Z" fill="${spec.accent}"/>`,
    `<path d="M0 72H35V128H0ZM93 72H128V128H93Z" fill="${spec.secondary}"/>`,
    materialDetailHorizontal(spec),
    `<path d="M35 2H93V39H35Z" fill="${CONTOUR}"/>`,
    `<path d="M39 8H89V21H39Z" fill="${spec.primary}"/>`,
    `<path d="M39 21H89V34H39Z" fill="${spec.secondary}"/>`,
    `<path d="M35 34H43V120H35ZM85 34H93V120H85Z" fill="${CONTOUR}"/>`,
    `<path d="M39 37H43V116H39ZM85 37H89V116H85Z" fill="${spec.accent}"/>`,
    `<path d="M41 118H87V122H41Z" fill="${CONTOUR}" opacity=".8"/>`,
    `<path d="M44 119.5H84" stroke="${DOOR_PANEL_LIGHT}" stroke-width="1" opacity=".55"/>`,
    `<circle cx="64" cy="32" r="1.8" fill="${STATUS}"/>`,
    leaves,
  ].join('');
}

function verticalCandidate(spec: DoorMaterial, state: DoorState): string {
  const leaves = state === 'closed'
    ? [
      `<path d="M51 38H77V90H51Z" fill="${CONTOUR}"/>`,
      `<path d="M54 41H74V62H54ZM54 66H74V87H54Z" fill="${DOOR_PANEL}"/>`,
      `<path d="M59 48H69V58H59ZM59 70H69V80H59Z" fill="${DOOR_GLASS}" opacity=".82"/>`,
      `<path d="M60 49H63V57H60ZM60 71H63V79H60Z" fill="#FFFFFF" opacity=".16"/>`,
      `<path d="M54 64H74" stroke="${CONTOUR}" stroke-width="2"/>`,
    ].join('')
    : [
      `<path d="M51 38H77V50H51ZM51 78H77V90H51Z" fill="${CONTOUR}"/>`,
      `<path d="M54 41H74V49H54ZM54 79H74V87H54Z" fill="${DOOR_PANEL_LIGHT}"/>`,
      `<path d="M59 44H69V49H59ZM59 79H69V84H59Z" fill="${DOOR_GLASS}" opacity=".72"/>`,
    ].join('');
  return [
    // Connected north/south sockets exactly match a production vertical wall:
    // contour x2..126, west/front x0..36, cap x8..120, east return x92..128.
    `<path d="M2 0H126V39H2ZM2 89H126V128H2Z" fill="${CONTOUR}"/>`,
    `<path d="M0 0H36V35H0ZM0 93H36V128H0Z" fill="${spec.secondary}"/>`,
    `<path d="M8 0H120V35H8ZM8 93H120V128H8Z" fill="${spec.primary}"/>`,
    `<path d="M92 0H128V35H92ZM92 93H128V128H92Z" fill="${spec.accent}"/>`,
    `<path d="M8 25H120V35H8Z" fill="${spec.secondary}"/>`,
    `<path d="M8 93H120V101H8Z" fill="${spec.accent}"/>`,
    materialDetailVertical(spec),
    `<path d="M48 32H80V43H48ZM48 85H80V96H48Z" fill="${CONTOUR}"/>`,
    `<path d="M52 35H76V42H52Z" fill="${spec.secondary}"/>`,
    `<path d="M52 86H76V93H52Z" fill="${spec.accent}"/>`,
    `<path d="M17 46H46V82H17ZM82 46H111V82H82Z" fill="${DOOR_PANEL}" opacity=".07" ` +
      `stroke="${DOOR_PANEL}" stroke-width="1"/>`,
    `<path d="M22 57H41M22 69H41M87 57H106M87 69H106" stroke="${DOOR_PANEL_LIGHT}" ` +
      `stroke-width="1" opacity=".18"/>`,
    `<path d="M48 38H53V90H48ZM75 38H80V90H75Z" fill="${CONTOUR}"/>`,
    `<circle cx="50.5" cy="64" r="1.8" fill="${STATUS}"/>`,
    leaves,
  ].join('');
}

export function quietWallDoorCandidateSvg(
  id: QuietWallFamilyId,
  axis: DoorAxis,
  state: DoorState,
): string {
  const spec = material(id);
  const art = axis === 'horizontal' ? horizontalCandidate(spec, state) : verticalCandidate(spec, state);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" ` +
    `data-review-only="quiet-wall-door-fit" data-axis="${axis}" data-state="${state}">${art}</svg>`;
}

function canonicalDoorSvg(axis: DoorAxis, state: DoorState): string {
  const svg = authoredPropSvg('door', {
    open: state === 'open' ? 1 : 0,
    facing: axis === 'vertical' ? 1 : 0,
  });
  if (!svg) throw new Error(`Missing canonical door ${axis}/${state}`);
  return svg;
}

function floorGrid(x: number, y: number, width: number, height: number, cell: number): string {
  const lines: string[] = [
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${FLOOR}"/>`,
  ];
  for (let px = x + cell; px < x + width; px += cell) {
    lines.push(`<path d="M${px} ${y}V${y + height}" stroke="${FLOOR_LINE}" stroke-width="1" opacity=".18"/>`);
  }
  for (let py = y + cell; py < y + height; py += cell) {
    lines.push(`<path d="M${x} ${py}H${x + width}" stroke="${FLOOR_LINE}" stroke-width="1" opacity=".18"/>`);
  }
  return lines.join('');
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
    // Canonical door art owns a centered .5 runtime compensation. Display it at
    // 2x here so its live wall-slot footprint is directly comparable to a wall cell.
    parts.push(placedSvg(canonicalDoorSvg(axis, state), dx - cell / 2, dy - cell / 2, cell * 2));
  } else {
    parts.push(placedSvg(quietWallDoorCandidateSvg(id, axis, state), dx, dy, cell));
  }
  return parts.join('');
}

const STATES = [
  { axis: 'horizontal', state: 'closed', label: 'HORIZONTAL · CLOSED' },
  { axis: 'horizontal', state: 'open', label: 'HORIZONTAL · OPEN' },
  { axis: 'vertical', state: 'closed', label: 'VERTICAL · CLOSED' },
  { axis: 'vertical', state: 'open', label: 'VERTICAL · OPEN' },
] as const;

export function renderQuietWallDoorComparisonSvg(): string {
  const width = 1880;
  const height = 720;
  const cardWidth = 444;
  const cardHeight = 570;
  const parts: string[] = [
    text(28, 42, 'QUIET WALL SYSTEM · DOOR FIT', 25, 860),
    text(28, 69, 'Current wall-slot product versus a wall-owned opening · office material control', 12, 620, MUTED),
    text(width - 28, 42, 'REVIEW-ONLY CANDIDATE', 11, 840, PROPOSED, 'end'),
  ];
  STATES.forEach((entry, index) => {
    const x = 28 + index * 462;
    parts.push(panel(x, 94, cardWidth, cardHeight, index % 2 === 0 ? PANEL : PANEL_ALT));
    parts.push(text(x + 18, 126, entry.label, 14, 820));
    parts.push(text(x + 18, 151, 'CURRENT · self-contained wall kit', 10, 780, REVIEW_RED));
    const currentCell = entry.axis === 'horizontal' ? 92 : 64;
    const currentX = entry.axis === 'horizontal' ? x + 77 : x + 190;
    const currentY = entry.axis === 'horizontal' ? 173 : 164;
    parts.push(doorRun('office-wall', entry.axis, entry.state, true, currentX, currentY, currentCell));
    parts.push(text(x + cardWidth / 2, 382, 'cream / coral / green fragments compete with the wall', 10, 620, MUTED, 'middle'));
    parts.push(text(x + 18, 418, 'PROPOSED · opening belongs to the wall', 10, 800, PROPOSED));
    const proposedCell = entry.axis === 'horizontal' ? 92 : 64;
    const proposedX = entry.axis === 'horizontal' ? x + 77 : x + 190;
    const proposedY = entry.axis === 'horizontal' ? 438 : 424;
    parts.push(doorRun('office-wall', entry.axis, entry.state, false, proposedX, proposedY, proposedCell));
    parts.push(text(x + cardWidth / 2, 641, 'same cap / front / return construction · quiet shared leaf', 10, 650, PROPOSED, 'middle'));
  });
  parts.push(text(28, 696, 'UNFINISHED GATE · candidate review only; canonical SVGs, generated art, export, and Unity remain unchanged', 11, 800, REVIEW_RED));
  return page(width, height, parts.join(''));
}

export function renderQuietWallDoorMaterialsSvg(): string {
  const width = 1880;
  const height = 940;
  const parts: string[] = [
    text(28, 42, 'DOOR MATERIAL INHERITANCE · FIVE-WALL CORE SET', 25, 860),
    text(28, 69, 'The leaf is shared equipment; the aperture, jamb, lintel, face cues, and returns belong to each wall', 12, 620, MUTED),
    text(width - 28, 42, 'NO DOOR-SPECIFIC WALL PALETTE', 11, 840, PROPOSED, 'end'),
  ];
  STATES.forEach((entry, index) => {
    parts.push(text(470 + index * 330, 108, entry.label, 11, 800, MUTED, 'middle'));
  });
  QUIET_WALL_DOOR_MATERIALS.forEach((spec, row) => {
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
      parts.push(placedSvg(quietWallDoorCandidateSvg(spec.id, entry.axis, entry.state), x, y + 12, size));
    });
  });
  parts.push(text(28, 918, 'MATERIAL CUES STOP AT THE OPENING · no top mask, no ornamental wall band, no oversized pressure mat', 11, 800, PROPOSED));
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
        parts.push(placedSvg(quietWallDoorCandidateSvg(id, 'horizontal', 'closed'), px, py, cell));
      } else if (cellKey === verticalDoor) {
        parts.push(`<rect x="${px}" y="${py}" width="${cell}" height="${cell}" fill="${FLOOR}"/>`);
        parts.push(placedSvg(quietWallDoorCandidateSvg(id, 'vertical', 'open'), px, py, cell));
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

export function renderQuietWallDoorGameplaySvg(): string {
  const width = 1880;
  const height = 820;
  const parts: string[] = [
    text(28, 42, 'QUIET DOORS · COMPOSED GAMEPLAY-SCALE READ', 25, 860),
    text(28, 69, 'Closed south opening · open side opening · every slot remains one cell', 12, 620, MUTED),
    text(width - 28, 42, '48 PX + 30 PX / CELL', 11, 840, PROPOSED, 'end'),
  ];
  const largeCell = 48;
  QUIET_WALL_DOOR_MATERIALS.forEach((spec, index) => {
    const x = 28 + index * 366;
    parts.push(panel(x, 96, 348, 288));
    parts.push(text(x + 16, 124, spec.label.toUpperCase(), 11, 800));
    parts.push(gameplayRoom(spec.id, x + 54, 146, largeCell));
  });
  const smallCell = 30;
  QUIET_WALL_DOOR_MATERIALS.forEach((spec, index) => {
    const x = 28 + index * 366;
    parts.push(panel(x, 408, 348, 230, PANEL_ALT));
    parts.push(text(x + 16, 436, `${spec.label.toUpperCase()} · FAR`, 10, 780, MUTED));
    parts.push(gameplayRoom(spec.id, x + 99, 460, smallCell));
  });
  parts.push(text(28, 682, 'READ PRIORITY', 10, 820, PROPOSED));
  parts.push(text(28, 707, '1 · opening interrupts the wall mass', 12, 650));
  parts.push(text(28, 732, '2 · jamb inherits the material face', 12, 650));
  parts.push(text(28, 757, '3 · shared sliding leaf stays secondary', 12, 650));
  parts.push(text(width - 28, 785, 'CANONICAL PROMOTION REQUIRES VISUAL APPROVAL', 11, 840, REVIEW_RED, 'end'));
  return page(width, height, parts.join(''));
}

export async function renderQuietWallDoorPreview(output: string): Promise<readonly string[]> {
  await mkdir(output, { recursive: true });
  const pages = [
    ['01-current-proposed-wall-fit', renderQuietWallDoorComparisonSvg()],
    ['02-five-material-inheritance', renderQuietWallDoorMaterialsSvg()],
    ['03-composed-gameplay-scale', renderQuietWallDoorGameplaySvg()],
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
    ...QUIET_WALL_DOOR_REVIEW,
    materials: QUIET_WALL_DOOR_MATERIALS,
  }, null, 2)}\n`, 'utf8');
  files.push(metricsPath);
  const readmePath = path.join(output, 'README.md');
  await writeFile(readmePath, [
    '# Quiet Wall Door Fit v1',
    '',
    'Status: **review-only candidate; canonical source and production receivers unchanged**',
    '',
    'This proof refits the existing four-state sliding auto-door to the five-wall core system.',
    'The door remains a one-cell, double-retracting wall-slot fixture with separately drawn',
    'horizontal and vertical states. The proposed change is one of visual ownership:',
    '',
    '- the wall material owns the aperture, lintel, jambs, front face, returns, and material detail;',
    '- the shared door equipment is reduced to paired leaves, narrow safety glazing, and one status point;',
    '- the pressure trigger is reduced to a quiet threshold field; oversized mats and decorative threshold hardware are removed;',
    '- open states leave the passage transparent; no floor is baked into the candidate;',
    '- axis remains topology-derived and does not introduce an inside-facing input.',
    '- production wall cells are flattened and clipped in page coordinates so nested-SVG hairlines are not mistaken for source seams.',
    '',
    'All candidate geometry is local to this review renderer. The four canonical door SVGs, generated',
    'registry, production template, browser export, Unity import, staging, and commit are untouched.',
    '',
    'The next gate is approval of the composed 48 px and 30 px gameplay-scale read.',
    '',
  ].join('\n'), 'utf8');
  files.push(readmePath);
  return files;
}

function outputPath(argv: readonly string[]): string {
  const index = argv.indexOf('--out');
  return index >= 0 && argv[index + 1]
    ? path.resolve(argv[index + 1])
    : path.resolve('docs/previews/quiet-wall-door-fit-v1');
}

const isMain = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;

if (isMain) {
  const output = outputPath(process.argv.slice(2));
  const files = await renderQuietWallDoorPreview(output);
  process.stdout.write(`Wrote ${files.length} quiet wall door-fit review files to ${output}\n`);
}
