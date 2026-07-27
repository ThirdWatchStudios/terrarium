/**
 * Render the complete proof-only QuotaCo A1b topology family.
 *
 *   npm run high-oblique:a1b:topology:preview
 *   npm run high-oblique:a1b:topology:preview -- --out /tmp/quota-co-a1b-topology
 *
 * The two atlases are transparent evidence generated from editable SVG source.
 * Labels, floor color, checkerboards, and room composition exist only on the
 * review sheet. Nothing here registers a production wall or export contract.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import { EXPORT_SCALES } from '../src/core/exporter';
import { NB } from '../src/tiles/blob';
import { A1A_PALETTE, A1A_REVIEW_SIZES } from './highOblique/a1aProof';
import {
  A1B_TOPOLOGY_ATLAS_COLUMNS,
  A1B_TOPOLOGY_ATLAS_ROWS,
  A1B_TOPOLOGY_COMPONENT_COUNT,
  A1B_TOPOLOGY_EVIDENCE_COUNT,
  a1bTopologyAtlasDescriptor,
  a1bTopologyAtlasSvg,
  loadA1bTopologyFamily,
  resolveA1bTopologyEvidence,
  type A1bTopologyAtlasDescriptor,
  type A1bTopologyComponentFrameId,
  type A1bTopologyEvidenceFrameId,
} from './highOblique/a1bTopology';
import {
  A1B_TOPOLOGY_COMPONENT_ATLAS_COLUMNS,
  A1B_TOPOLOGY_COMPONENT_ATLAS_ROWS,
  a1bTopologyComponentAtlasDescriptor,
  a1bTopologyComponentAtlasSvg,
  type A1bTopologyComponentAtlasDescriptor,
} from './highOblique/a1bTopologyProof';

const PAGE = '#E8E4D8';
const PANEL = '#F6F1E5';
const FULL_PANEL = '#E2E8DE';
const LOW_PANEL = '#E8DED2';
const INK = '#252A28';
const MUTED = '#606A64';
const RULE = '#A59E8F';
const WIDTH = 1920;
const MARGIN = 48;
const GAP = 22;

interface CliOptions {
  readonly input: string;
  readonly output: string;
}

interface ReviewAtlases {
  readonly evidence: A1bTopologyAtlasDescriptor;
  readonly components: A1bTopologyComponentAtlasDescriptor;
}

function escapeText(value: string): string {
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
  size = 18,
  weight = 400,
  color = INK,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return (
    `<text x="${x}" y="${y}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" ` +
    `font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">` +
    `${escapeText(value)}</text>`
  );
}

function panel(x: number, y: number, width: number, height: number, fill = PANEL): string {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="12" fill="${fill}"/>`;
}

function checker(x: number, y: number, width: number, height: number): string {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="6" fill="url(#checker)"/>`;
}

function sectionTitle(parts: string[], y: number, title: string, detail: string): number {
  parts.push(text(MARGIN, y + 28, title, 27, 760));
  parts.push(text(MARGIN, y + 55, detail, 15, 450, MUTED));
  parts.push(`<path d="M ${MARGIN} ${y + 70} H ${WIDTH - MARGIN}" stroke="${RULE}" stroke-width="1"/>`);
  return y + 90;
}

function evidenceFrame(
  atlas: A1bTopologyAtlasDescriptor,
  id: A1bTopologyEvidenceFrameId,
  x: number,
  y: number,
  size: number,
): string {
  const frame = atlas.frames[id];
  if (!frame) throw new Error(`Missing evidence review frame ${id}`);
  return (
    `<svg x="${x}" y="${y}" width="${size}" height="${size}" ` +
    `viewBox="${frame.x} ${frame.y} ${frame.w} ${frame.h}" preserveAspectRatio="none">` +
    '<use href="#evidencePixels"/>' +
    '</svg>'
  );
}

function checkedEvidenceFrame(
  atlas: A1bTopologyAtlasDescriptor,
  id: A1bTopologyEvidenceFrameId,
  x: number,
  y: number,
  size: number,
): string {
  return checker(x, y, size, size) + evidenceFrame(atlas, id, x, y, size);
}

function componentFrame(
  atlas: A1bTopologyComponentAtlasDescriptor,
  id: A1bTopologyComponentFrameId,
  x: number,
  y: number,
  size: number,
): string {
  const frame = atlas.frames[id];
  if (!frame) throw new Error(`Missing component review frame ${id}`);
  return (
    `<svg x="${x}" y="${y}" width="${size}" height="${size}" ` +
    `viewBox="${frame.x} ${frame.y} ${frame.w} ${frame.h}" preserveAspectRatio="none">` +
    '<use href="#componentPixels"/>' +
    '</svg>'
  );
}

function checkedComponentFrame(
  atlas: A1bTopologyComponentAtlasDescriptor,
  id: A1bTopologyComponentFrameId,
  x: number,
  y: number,
  size: number,
): string {
  return checker(x, y, size, size) + componentFrame(atlas, id, x, y, size);
}

function blobComponentId(bank: 'base' | 'upper', index: number): A1bTopologyComponentFrameId {
  return `a1b_component_${bank}_${index.toString().padStart(2, '0')}`;
}

function blobEvidenceId(profile: 'low' | 'full', index: number): A1bTopologyEvidenceFrameId {
  return `a1b_evidence_${profile}_${index.toString().padStart(2, '0')}`;
}

function representativeConstruction(
  parts: string[],
  y: number,
  atlases: ReviewAtlases,
): number {
  const cases = [
    {
      label: 'HORIZONTAL · MASK 10',
      detail: 'full north run',
      base: blobComponentId('base', 10),
      upper: blobComponentId('upper', 10),
      evidence: blobEvidenceId('full', 10),
    },
    {
      label: 'VERTICAL · MASK 05',
      detail: 'full west run',
      base: blobComponentId('base', 5),
      upper: blobComponentId('upper', 5),
      evidence: blobEvidenceId('full', 5),
    },
    {
      label: 'CORNER · MASK 06',
      detail: 'full/full junction',
      base: blobComponentId('base', 6),
      upper: blobComponentId('upper', 6),
      evidence: blobEvidenceId('full', 6),
    },
    {
      label: 'N → E · MASK 12',
      detail: 'full to low profile',
      base: blobComponentId('base', 12),
      upper: 'a1b_component_state_profile-n-to-e-upper' as const,
      evidence: 'a1b_evidence_transition_n_to_e' as const,
    },
    {
      label: 'W → S · MASK 03',
      detail: 'full to low profile',
      base: blobComponentId('base', 3),
      upper: 'a1b_component_state_profile-w-to-s-upper' as const,
      evidence: 'a1b_evidence_transition_w_to_s' as const,
    },
  ];
  const cardWidth = (WIDTH - MARGIN * 2 - GAP * (cases.length - 1)) / cases.length;
  const imageSize = 84;
  const imageGap = 11;
  const stripWidth = imageSize * 3 + imageGap * 2;
  for (let index = 0; index < cases.length; index += 1) {
    const entry = cases[index];
    const x = MARGIN + index * (cardWidth + GAP);
    parts.push(panel(x, y, cardWidth, 184, index >= 3 ? LOW_PANEL : PANEL));
    parts.push(text(x + cardWidth / 2, y + 25, entry.label, 13, 800, INK, 'middle'));
    parts.push(text(x + cardWidth / 2, y + 44, entry.detail, 11, 550, MUTED, 'middle'));
    const ix = x + (cardWidth - stripWidth) / 2;
    parts.push(checkedComponentFrame(atlases.components, entry.base, ix, y + 55, imageSize));
    parts.push(checkedComponentFrame(atlases.components, entry.upper, ix + imageSize + imageGap, y + 55, imageSize));
    parts.push(checkedEvidenceFrame(atlases.evidence, entry.evidence, ix + (imageSize + imageGap) * 2, y + 55, imageSize));
    parts.push(text(ix + imageSize / 2, y + 159, 'BASE', 9, 800, MUTED, 'middle'));
    parts.push(text(ix + imageSize * 1.5 + imageGap, y + 159, 'UPPER', 9, 800, MUTED, 'middle'));
    parts.push(text(ix + imageSize * 2.5 + imageGap * 2, y + 159, 'COMPOSED', 9, 800, A1A_PALETTE.green, 'middle'));
  }
  return y + 184;
}

function topologyBank(
  parts: string[],
  x: number,
  y: number,
  width: number,
  atlas: A1bTopologyAtlasDescriptor,
  profile: 'low' | 'full',
): void {
  const fill = profile === 'full' ? FULL_PANEL : LOW_PANEL;
  const title = profile === 'full'
    ? 'FULL BANK · BASE + OPTIONAL UPPER'
    : 'LOW BANK · PERSISTENT BASE';
  const detail = profile === 'full'
    ? 'same masks · explicit upper selection'
    : 'canonical masks 00…46';
  const columns = 8;
  const size = 91;
  const frameGap = 8;
  const gridWidth = columns * size + (columns - 1) * frameGap;
  const startX = x + (width - gridWidth) / 2;
  parts.push(panel(x, y, width, 682, fill));
  parts.push(text(x + 24, y + 32, title, 17, 800));
  parts.push(text(x + width - 24, y + 32, detail, 12, 600, MUTED, 'end'));
  for (let index = 0; index < 47; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const fx = startX + column * (size + frameGap);
    const fy = y + 52 + row * (size + frameGap);
    const id = blobEvidenceId(profile, index);
    parts.push(checkedEvidenceFrame(atlas, id, fx, fy, size));
    parts.push(`<rect x="${fx + 4}" y="${fy + 4}" width="25" height="16" rx="4" fill="${INK}" opacity="0.82"/>`);
    parts.push(text(fx + 16.5, fy + 16, index.toString().padStart(2, '0'), 9, 800, '#FFFFFF', 'middle'));
  }
}

function completeBanks(parts: string[], y: number, atlas: A1bTopologyAtlasDescriptor): number {
  const width = (WIDTH - MARGIN * 2 - GAP) / 2;
  topologyBank(parts, MARGIN, y, width, atlas, 'low');
  topologyBank(parts, MARGIN + width + GAP, y, width, atlas, 'full');
  return y + 682;
}

function stateCards(parts: string[], y: number, atlas: A1bTopologyAtlasDescriptor): number {
  const states: readonly {
    id: A1bTopologyEvidenceFrameId;
    title: string;
    detail: string;
  }[] = [
    { id: 'a1b_evidence_transition_n_to_e', title: 'FULL N → LOW E', detail: 'compatible base mask 12' },
    { id: 'a1b_evidence_transition_w_to_s', title: 'FULL W → LOW S', detail: 'compatible base mask 03' },
    { id: 'a1b_evidence_door_closed_n', title: 'DOOR · CLOSED', detail: 'authored north-facing state' },
    { id: 'a1b_evidence_door_open_n', title: 'DOOR · OPEN', detail: 'authored north-facing state' },
    { id: 'a1b_evidence_window_wide_n', title: 'WINDOW · WIDE', detail: 'authored north-facing state' },
  ];
  const cardWidth = (WIDTH - MARGIN * 2 - GAP * (states.length - 1)) / states.length;
  const cardHeight = 402;
  const closeSize = 218;
  for (let index = 0; index < states.length; index += 1) {
    const state = states[index];
    const x = MARGIN + index * (cardWidth + GAP);
    parts.push(panel(x, y, cardWidth, cardHeight, index < 2 ? LOW_PANEL : PANEL));
    parts.push(text(x + cardWidth / 2, y + 28, state.title, 14, 800, INK, 'middle'));
    parts.push(text(x + cardWidth / 2, y + 48, state.detail, 11, 550, MUTED, 'middle'));
    const closeX = x + (cardWidth - closeSize) / 2;
    parts.push(checkedEvidenceFrame(atlas, state.id, closeX, y + 59, closeSize));
    const normalX = x + 26;
    const farX = x + cardWidth - 26 - A1A_REVIEW_SIZES.far;
    parts.push(checkedEvidenceFrame(atlas, state.id, normalX, y + 285, A1A_REVIEW_SIZES.normal));
    parts.push(checkedEvidenceFrame(atlas, state.id, farX, y + 310, A1A_REVIEW_SIZES.far));
    parts.push(text(normalX + A1A_REVIEW_SIZES.normal / 2, y + 393, `${A1A_REVIEW_SIZES.normal}px`, 9, 700, MUTED, 'middle'));
    parts.push(text(farX + A1A_REVIEW_SIZES.far / 2, y + 366, `${A1A_REVIEW_SIZES.far}px`, 9, 700, MUTED, 'middle'));
  }
  return y + cardHeight;
}

interface Cell {
  readonly x: number;
  readonly y: number;
}

function cellKey(cell: Cell): string {
  return `${cell.x},${cell.y}`;
}

function perimeterCells(width: number, height: number): readonly Cell[] {
  const cells: Cell[] = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) cells.push({ x, y });
    }
  }
  return cells;
}

function rawMask(cell: Cell, occupied: ReadonlySet<string>): number {
  const neighbors = [
    [0, -1, NB.N],
    [1, 0, NB.E],
    [0, 1, NB.S],
    [-1, 0, NB.W],
    [1, -1, NB.NE],
    [1, 1, NB.SE],
    [-1, 1, NB.SW],
    [-1, -1, NB.NW],
  ] as const;
  let raw = 0;
  for (const [dx, dy, bit] of neighbors) {
    if (occupied.has(`${cell.x + dx},${cell.y + dy}`)) raw |= bit;
  }
  return raw;
}

function roomFrameId(cell: Cell, raw: number, width: number, height: number): A1bTopologyEvidenceFrameId {
  if (cell.x === width - 1 && cell.y === 0) return 'a1b_evidence_transition_n_to_e';
  if (cell.x === 0 && cell.y === height - 1) return 'a1b_evidence_transition_w_to_s';
  if (cell.y === 0 && cell.x === 2) return 'a1b_evidence_door_open_n';
  if (cell.y === 0 && cell.x === 4) return 'a1b_evidence_window_wide_n';
  const requestedProfile = cell.y === 0 || cell.x === 0 ? 'full' : 'low';
  return resolveA1bTopologyEvidence(raw, requestedProfile).evidenceFrameId;
}

function roomProof(parts: string[], y: number, atlas: A1bTopologyAtlasDescriptor): number {
  const leftWidth = 1165;
  const rightX = MARGIN + leftWidth + GAP;
  const rightWidth = WIDTH - MARGIN - rightX;
  const height = 592;
  parts.push(panel(MARGIN, y, leftWidth, height, FULL_PANEL));
  parts.push(text(MARGIN + 24, y + 34, 'FIXED HIGH-OBLIQUE ROOM PERIMETER · PROOF COMPOSITION', 17, 800));
  parts.push(text(MARGIN + leftWidth - 24, y + 34, 'Unity still owns final composition / cutaway / sorting', 12, 600, MUTED, 'end'));

  const gridWidth = 7;
  const gridHeight = 5;
  const tileSize = 92;
  const roomWidth = gridWidth * tileSize;
  const roomHeight = gridHeight * tileSize;
  const roomX = MARGIN + (leftWidth - roomWidth) / 2;
  const roomY = y + 72;
  parts.push(`<rect x="${roomX}" y="${roomY}" width="${roomWidth}" height="${roomHeight}" rx="8" fill="${A1A_PALETTE.floor}"/>`);
  parts.push(`<path d="M ${roomX} ${roomY + tileSize} H ${roomX + roomWidth} M ${roomX + tileSize} ${roomY} V ${roomY + roomHeight}" stroke="#FFFFFF" stroke-width="2" opacity="0.12"/>`);

  const cells = perimeterCells(gridWidth, gridHeight);
  const occupied = new Set(cells.map(cellKey));
  for (const cell of cells) {
    const raw = rawMask(cell, occupied);
    const id = roomFrameId(cell, raw, gridWidth, gridHeight);
    parts.push(evidenceFrame(
      atlas,
      id,
      roomX + cell.x * tileSize,
      roomY + cell.y * tileSize,
      tileSize,
    ));
  }

  parts.push(text(roomX + roomWidth / 2, roomY - 12, 'FULL NORTH · DOOR + WINDOW', 12, 800, A1A_PALETTE.green, 'middle'));
  parts.push(text(roomX - 14, roomY + roomHeight / 2, 'FULL WEST', 12, 800, A1A_PALETTE.green, 'middle'));
  parts.push(text(roomX + roomWidth + 14, roomY + roomHeight / 2, 'LOW EAST', 12, 800, A1A_PALETTE.teal, 'middle'));
  parts.push(text(roomX + roomWidth / 2, roomY + roomHeight + 24, 'LOW SOUTH', 12, 800, A1A_PALETTE.teal, 'middle'));

  parts.push(panel(rightX, y, rightWidth, height, PANEL));
  parts.push(text(rightX + 24, y + 34, 'What the complete proof establishes', 18, 780));
  const facts = [
    'One canonical 47-blob table remains the connectivity authority.',
    'Each mask has a persistent low base and optional authored upper shell.',
    'Full/low is explicit composition input; mask geometry never guesses it.',
    'North/west can remain full while south/east stay low on the same grid.',
    'Two authored mixed corners bridge those profile changes cleanly.',
    'Door and window views are authored states, not rotated baked pixels.',
    'Every component records editable SVG source provenance.',
  ];
  for (let index = 0; index < facts.length; index += 1) {
    const fy = y + 77 + index * 52;
    parts.push(`<circle cx="${rightX + 31}" cy="${fy - 5}" r="4" fill="${index < 5 ? A1A_PALETTE.green : A1A_PALETTE.teal}"/>`);
    parts.push(text(rightX + 45, fy, facts[index], 13, index === 2 ? 700 : 500, index === 2 ? INK : MUTED));
  }
  parts.push(`<path d="M ${rightX + 24} ${y + 455} H ${rightX + rightWidth - 24}" stroke="${RULE}"/>`);
  parts.push(text(rightX + 24, y + 488, 'BOUNDARY', 12, 800, A1A_PALETTE.coral));
  parts.push(text(rightX + 24, y + 516, 'No template registration, production atlas replacement,', 13, 600, INK));
  parts.push(text(rightX + 24, y + 538, 'schema/export decision, camera work, or Unity acceptance.', 13, 600, INK));
  parts.push(text(rightX + 24, y + 568, 'Profile labels remain temporary review metadata.', 12, 700, MUTED));
  return y + height;
}

function provenanceAndPalette(parts: string[], y: number): number {
  const cardWidth = (WIDTH - MARGIN * 2 - GAP) / 2;
  parts.push(panel(MARGIN, y, cardWidth, 252));
  parts.push(text(MARGIN + 24, y + 34, 'Source and topology accounting', 20, 760));
  const rows = [
    ['EDITABLE SOURCE', '20 base + 20 upper + 7 state SVGs'],
    ['COMPILED COMPONENTS', '47 base + 47 upper + 7 state = 101'],
    ['COMPOSED EVIDENCE', '47 low + 47 full + 2 transitions + 3 openings = 99'],
    ['CONNECTIVITY', 'existing raw 256 → canonical 47 mapping, unchanged'],
    ['AUTHORITY', 'SVG source is editable truth; atlases are deterministic proof pixels'],
  ] as const;
  for (let index = 0; index < rows.length; index += 1) {
    const [label, value] = rows[index];
    const ry = y + 70 + index * 34;
    parts.push(text(MARGIN + 24, ry, label, 11, 800, MUTED));
    parts.push(text(MARGIN + 198, ry, value, 13, index === 4 ? 700 : 520, INK));
  }

  const rightX = MARGIN + cardWidth + GAP;
  parts.push(panel(rightX, y, cardWidth, 252, LOW_PANEL));
  parts.push(text(rightX + 24, y + 34, 'QuotaCo Building System palette', 20, 760));
  const colors = [
    ['AGED CREAM', A1A_PALETTE.cream],
    ['DEEP GREEN', A1A_PALETTE.green],
    ['OXIDIZED TEAL', A1A_PALETTE.teal],
    ['CORAL / RUST', A1A_PALETTE.coral],
    ['CHARCOAL', A1A_PALETTE.charcoal],
    ['GLASS', A1A_PALETTE.glass],
    ['METAL', A1A_PALETTE.metal],
  ] as const;
  const swatchWidth = 92;
  const swatchGap = 20;
  const total = colors.length * swatchWidth + (colors.length - 1) * swatchGap;
  const startX = rightX + (cardWidth - total) / 2;
  for (let index = 0; index < colors.length; index += 1) {
    const [label, color] = colors[index];
    const x = startX + index * (swatchWidth + swatchGap);
    parts.push(`<rect x="${x}" y="${y + 68}" width="${swatchWidth}" height="88" rx="7" fill="${color}"/>`);
    parts.push(text(x + swatchWidth / 2, y + 182, label, 9, 800, MUTED, 'middle'));
  }
  parts.push(text(rightX + cardWidth / 2, y + 224, 'Reserved amber and rose signals remain absent from wall art.', 12, 700, INK, 'middle'));
  return y + 252;
}

function pngDataUri(bytes: Uint8Array): string {
  return `data:image/png;base64,${Buffer.from(bytes).toString('base64')}`;
}

function reviewSheet(
  atlases: ReviewAtlases,
  evidencePng: Uint8Array,
  componentPng: Uint8Array,
): string {
  const parts: string[] = [
    `<defs><pattern id="checker" width="16" height="16" patternUnits="userSpaceOnUse">` +
      '<rect width="16" height="16" fill="#B9B9B2"/>' +
      '<rect width="8" height="8" fill="#D6D5CC"/><rect x="8" y="8" width="8" height="8" fill="#D6D5CC"/>' +
      `</pattern><image id="evidencePixels" x="0" y="0" width="${atlases.evidence.width}" height="${atlases.evidence.height}" ` +
      `href="${pngDataUri(evidencePng)}" image-rendering="auto"/>` +
      `<image id="componentPixels" x="0" y="0" width="${atlases.components.width}" height="${atlases.components.height}" ` +
      `href="${pngDataUri(componentPng)}" image-rendering="auto"/></defs>`,
    `<rect width="${WIDTH}" height="4000" fill="${PAGE}"/>`,
  ];
  let y = 42;
  parts.push(text(MARGIN, y + 36, 'QuotaCo Building System · A1b complete topology proof', 34, 820));
  parts.push(text(MARGIN, y + 69, 'Approved split-B construction · editable directional SVGs · existing rectangular 47-blob grid', 17, 500, MUTED));
  parts.push(text(WIDTH - MARGIN, y + 34, '47 SOURCES · 101 COMPONENTS · 99 COMPOSED FRAMES', 14, 820, A1A_PALETTE.green, 'end'));
  parts.push(text(WIDTH - MARGIN, y + 60, 'PROOF ONLY · TRANSPARENT ATLASES · TEMPORARY IDS', 12, 700, MUTED, 'end'));
  y += 104;

  y = sectionTitle(parts, y, 'Reusable authored construction', 'The assembler contributes only hidden arm/core fill; visible corners, caps, transitions, and opening states remain authored.');
  y = representativeConstruction(parts, y, atlases) + 24;

  y = sectionTitle(parts, y, 'Complete canonical 47-mask banks', 'The connectivity index is identical in both banks. Profile selection is explicit composition input, not another mask table.');
  y = completeBanks(parts, y, atlases.evidence) + 24;

  y = sectionTitle(parts, y, 'Directional profile and opening states', 'Pilot states needed to judge transitions and authored-facing behavior before any schema or full-catalog decision.');
  y = stateCards(parts, y, atlases.evidence) + 24;

  y = sectionTitle(parts, y, 'Mixed-profile room read', 'Fixed orthographic high-oblique over the existing screen-aligned rectangular grid; flat floor; full north/west and low south/east.');
  y = roomProof(parts, y, atlases.evidence) + 24;

  y = sectionTitle(parts, y, 'Proof accounting and boundary', 'Terrarium owns source art and evidence metadata. Unity remains the production composition and acceptance authority.');
  y = provenanceAndPalette(parts, y) + MARGIN;

  const height = Math.ceil(y);
  parts[1] = `<rect width="${WIDTH}" height="${height}" fill="${PAGE}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}">${parts.join('')}</svg>`;
}

function parseArgs(args: string[], root: string): CliOptions {
  let input = path.join(root, 'assets/walls/quota-co-building-system/topology');
  let output = path.join(root, 'docs/previews');
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument !== '--input' && argument !== '--out') throw new Error(`Unknown argument ${argument}`);
    const value = args[++index];
    if (!value) throw new Error(`${argument} requires a path`);
    if (argument === '--input') input = path.resolve(root, value);
    else output = path.resolve(root, value);
  }
  return { input, output };
}

async function main(): Promise<void> {
  const root = process.cwd();
  const options = parseArgs(process.argv.slice(2), root);
  const sourcePathPrefix = path.relative(root, options.input).replaceAll(path.sep, '/');
  const family = await loadA1bTopologyFamily({
    inputDir: options.input,
    sourcePathPrefix,
  });
  await mkdir(options.output, { recursive: true });

  let evidenceOneX: Uint8Array | undefined;
  let componentOneX: Uint8Array | undefined;
  for (const scale of EXPORT_SCALES) {
    const evidenceDescriptor = a1bTopologyAtlasDescriptor(family.evidenceFrames, scale);
    const evidenceSource = a1bTopologyAtlasSvg(family.evidenceFrames, scale);
    const evidenceBytes = new Resvg(evidenceSource).render().asPng();
    await writeFile(
      path.join(options.output, `quota-co-high-oblique-a1b-topology-evidence-atlas@${scale}x.png`),
      evidenceBytes,
    );
    await writeFile(
      path.join(options.output, `quota-co-high-oblique-a1b-topology-evidence-atlas@${scale}x.json`),
      `${JSON.stringify(evidenceDescriptor, null, 2)}\n`,
      'utf8',
    );

    const componentDescriptor = a1bTopologyComponentAtlasDescriptor(family.components, scale);
    const componentSource = a1bTopologyComponentAtlasSvg(family.components, scale);
    const componentBytes = new Resvg(componentSource).render().asPng();
    await writeFile(
      path.join(options.output, `quota-co-high-oblique-a1b-topology-components-atlas@${scale}x.png`),
      componentBytes,
    );
    await writeFile(
      path.join(options.output, `quota-co-high-oblique-a1b-topology-components-atlas@${scale}x.json`),
      `${JSON.stringify(componentDescriptor, null, 2)}\n`,
      'utf8',
    );

    if (scale === 1) {
      evidenceOneX = evidenceBytes;
      componentOneX = componentBytes;
      await writeFile(
        path.join(options.output, 'quota-co-high-oblique-a1b-topology-evidence-atlas.svg'),
        evidenceSource,
        'utf8',
      );
      await writeFile(
        path.join(options.output, 'quota-co-high-oblique-a1b-topology-components-atlas.svg'),
        componentSource,
        'utf8',
      );
    }
  }

  await writeFile(
    path.join(options.output, 'quota-co-high-oblique-a1b-topology-component-manifest.json'),
    `${JSON.stringify(family.componentManifest, null, 2)}\n`,
    'utf8',
  );

  if (!evidenceOneX || !componentOneX) throw new Error('A1b topology 1x atlases were not rendered');
  const atlases = {
    evidence: a1bTopologyAtlasDescriptor(family.evidenceFrames, 1),
    components: a1bTopologyComponentAtlasDescriptor(family.components, 1),
  };
  const reviewSvg = reviewSheet(atlases, evidenceOneX, componentOneX);
  const reviewPng = new Resvg(reviewSvg).render().asPng();
  await writeFile(
    path.join(options.output, 'quota-co-high-oblique-a1b-topology-review.svg'),
    reviewSvg,
    'utf8',
  );
  await writeFile(
    path.join(options.output, 'quota-co-high-oblique-a1b-topology-review.png'),
    reviewPng,
  );
  await writeFile(
    path.join(options.output, 'quota-co-high-oblique-a1b-topology-review.html'),
    '<!doctype html><meta charset="utf-8"><title>QuotaCo A1b complete topology proof</title>' +
      '<style>html{background:#252a28;color:#f6f1e5;font-family:sans-serif}body{margin:24px}' +
      'img{display:block;max-width:100%;height:auto;margin-bottom:20px}a{color:#83a9a6;margin-right:16px}</style>' +
      '<h1>QuotaCo A1b complete topology proof</h1>' +
      '<p>Editable-SVG 47-blob evidence. No production registration, schema, or export-contract claim.</p>' +
      '<img src="quota-co-high-oblique-a1b-topology-review.png" alt="QuotaCo complete low and full topology proof">' +
      EXPORT_SCALES.map((scale) =>
        `<a href="quota-co-high-oblique-a1b-topology-evidence-atlas@${scale}x.png">evidence atlas ${scale}×</a>`).join('') +
      EXPORT_SCALES.map((scale) =>
        `<a href="quota-co-high-oblique-a1b-topology-components-atlas@${scale}x.png">component atlas ${scale}×</a>`).join('') +
      '<a href="quota-co-high-oblique-a1b-topology-component-manifest.json">component manifest</a>',
    'utf8',
  );

  process.stdout.write(
    `Wrote QuotaCo A1b complete topology proof (${family.sources.length} SVG sources, ` +
    `${A1B_TOPOLOGY_COMPONENT_COUNT} components, ${A1B_TOPOLOGY_EVIDENCE_COUNT} evidence frames, ` +
    `${A1B_TOPOLOGY_COMPONENT_ATLAS_COLUMNS}x${A1B_TOPOLOGY_COMPONENT_ATLAS_ROWS} component atlas, ` +
    `${A1B_TOPOLOGY_ATLAS_COLUMNS}x${A1B_TOPOLOGY_ATLAS_ROWS} evidence atlas) to ${options.output}\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
