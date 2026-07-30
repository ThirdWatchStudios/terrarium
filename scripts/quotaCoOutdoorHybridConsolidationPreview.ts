/**
 * Review-only consolidation of the accepted exterior hybrid and systems-first
 * candidate family.
 *
 *   node --import tsx scripts/quotaCoOutdoorHybridConsolidationPreview.ts
 *   node --import tsx scripts/quotaCoOutdoorHybridConsolidationPreview.ts --out docs/previews
 *
 * The selected pixels remain temporary proposal art. Standalone SVG source
 * creation and all template/export/Unity work remain later approval boundaries.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import {
  CURRENT_SCHEMA_VERSION,
  type CharacterRecipe,
  type Facing,
} from '../src/core/types';
import { DEFAULT_CAST } from '../src/data/defaults';
import { PROP_TEMPLATES } from '../src/props/templates';
import {
  type ProposalDirectionId,
  renderOutdoorProposalSvg,
} from './quotaCoOutdoorConstructionCalibrationPreview';
import {
  RECOMMENDED_MOBILITY_LIGHTING_REVISIONS,
  renderMobilityLightingRevisionSvg,
} from './quotaCoOutdoorMobilityLightingRevisionPreview';
import {
  GAMEPLAY_GAP_CANDIDATES,
  type GameplayGapCandidateId,
  renderGameplayGapCandidateSvg,
} from './quotaCoGameplaySystemsPropGapPreview';
import { PropCalibrationRenderer } from './quotaCoPropRedesignCalibrationPreview';
import { PROP_NATIVE_FRAME_CELLS } from './quotaCoWorkstationFamilyCalibrationPreview';

const WIDTH = 3600;
const HEIGHT = 2460;
const MARGIN = 36;
const GAP = 18;
const NORMAL_CELL = 74;
const FAR_CELL = 40;
const AUTHORING_CANVAS = 128;
const WALL_DATUM = 112;
const CHARACTER_VISUAL_SCALE = 0.65;
const CHARACTER_FRAME_CELLS = 1.55 * CHARACTER_VISUAL_SCALE;

const PAGE = '#E7E1D2';
const PANEL = '#F6F1E6';
const PANEL_ALT = '#ECE5D7';
const INK = '#292C2A';
const MUTED = '#626861';
const RULE = '#A39B8B';
const FLOOR = '#7B8890';
const FLOOR_LINE = '#D9D4C7';
const GRASS = '#667A5D';
const WALK = '#C8C2B2';
const OCCUPANCY = '#E7DDAF';
const GREEN = '#355647';
const GREEN_SOFT = '#DCE9DD';
const TEAL_SOFT = '#D8E6E4';
const CORAL = '#B65F4D';
const BLUE = '#294565';

const Q = {
  cream: '#DED5BD',
  green: '#355247',
  teal: '#4E7470',
  coral: '#B65F4D',
  charcoal: '#262B29',
  blueGlass: '#8FB7C0',
} as const;

interface SelectedOutdoorDecision {
  readonly id: string;
  readonly role: string;
  readonly direction: ProposalDirectionId;
  readonly decision: string;
}

export const SELECTED_OUTDOOR_HYBRID_DECISIONS:
readonly SelectedOutdoorDecision[] = [
  {
    id: 'car',
    role: 'Vehicle',
    direction: 'lived-campus',
    decision:
      'Site Kit hull and glazing with bounded wear and one employee-owned marker.',
  },
  {
    id: 'lot-marking-crosswalk',
    role: 'Crossing',
    direction: 'institutional-site-kit',
    decision:
      'Broad clean bars carry recognition; no service frame that could read as a ladder.',
  },
  {
    id: 'lamp-post',
    role: 'Lighting',
    direction: 'service-coded-edge',
    decision:
      'Offset service arm and broad shielded emitting head; coral remains confined to the access panel.',
  },
  {
    id: 'sign-lot',
    role: 'Wayfinding',
    direction: 'lived-campus',
    decision:
      'Catalog sign body with clear face plus one posted-use layer and planted edge.',
  },
  {
    id: 'bike-rack',
    role: 'Mobility',
    direction: 'lived-campus',
    decision:
      'Three broad low staple hoops, six ground mounts, and one lock preserve a conventional plan-projected rack read.',
  },
  {
    id: 'park-bench',
    role: 'Seating',
    direction: 'lived-campus',
    decision:
      'Institutional frame with a readable back/seat and localized wear, not clutter.',
  },
  {
    id: 'picnic-table',
    role: 'Break surface',
    direction: 'lived-campus',
    decision:
      'Plan-projected table and separated benches with restrained evidence of use.',
  },
  {
    id: 'tree-canopy',
    role: 'Landscape',
    direction: 'lived-campus',
    decision:
      'One coherent living canopy with a visible trunk; QuotaCo appears only at the tag/edge.',
  },
];

export const SELECTED_SYSTEM_CANDIDATE_IDS = GAMEPLAY_GAP_CANDIDATES.map(
  ({ id }) => id,
);

export const ACCEPTED_MOBILITY_LIGHTING_REVISIONS =
  RECOMMENDED_MOBILITY_LIGHTING_REVISIONS;

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
  size = 16,
  weight = 560,
  color = INK,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return (
    `<text x="${x}" y="${y}" ` +
    'font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" ' +
    `font-size="${size}" font-weight="${weight}" fill="${color}" ` +
    `text-anchor="${anchor}">${escapeText(value)}</text>`
  );
}

function wrappedText(
  x: number,
  y: number,
  value: string,
  maxCharacters: number,
  lineHeight: number,
  size = 16,
  weight = 560,
  color = INK,
): string {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharacters && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines
    .map((lineValue, index) =>
      text(x, y + index * lineHeight, lineValue, size, weight, color),
    )
    .join('');
}

function panel(
  x: number,
  y: number,
  width: number,
  height: number,
  fill = PANEL,
  stroke = RULE,
  radius = 14,
): string {
  return (
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" ` +
    `rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`
  );
}

function line(
  d: string,
  stroke: string,
  width = 2,
  opacity = 1,
  dash = '',
): string {
  return (
    `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" ` +
    `stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" ` +
    (dash ? `stroke-dasharray="${dash}"` : '') +
    '/>'
  );
}

function p(
  d: string,
  fill: string,
  opacity = 1,
): string {
  return `<path d="${d}" fill="${fill}" opacity="${opacity}" stroke="none"/>`;
}

function c(
  cx: number,
  cy: number,
  radius: number,
  fill: string,
): string {
  return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${fill}"/>`;
}

function placedSvg(
  source: string,
  x: number,
  y: number,
  width: number,
  height = width,
): string {
  return source
    .replace('<svg ', `<svg x="${x}" y="${y}" overflow="visible" `)
    .replace(
      /width="[^"]+" height="[^"]+"/,
      `width="${width}" height="${height}"`,
    );
}

function selectedOutdoorSvg(id: string): string {
  if (id === 'bike-rack') {
    return renderMobilityLightingRevisionSvg(
      ACCEPTED_MOBILITY_LIGHTING_REVISIONS.bikeRack,
    );
  }
  if (id === 'lamp-post') {
    return renderMobilityLightingRevisionSvg(
      ACCEPTED_MOBILITY_LIGHTING_REVISIONS.lampPost,
    );
  }
  const decision = SELECTED_OUTDOOR_HYBRID_DECISIONS.find(
    (candidate) => candidate.id === id,
  );
  if (!decision) throw new Error(`Missing selected outdoor decision ${id}`);
  return renderOutdoorProposalSvg(decision.direction, id);
}

function sourceFor(
  renderer: PropCalibrationRenderer,
  kind: 'current' | 'selected',
  id: string,
): string {
  return kind === 'current'
    ? renderer.prop('current', id)
    : selectedOutdoorSvg(id);
}

function drawGrid(
  parts: string[],
  x: number,
  y: number,
  columns: number,
  rows: number,
  cell: number,
  grassStart: number,
): void {
  parts.push(
    `<rect x="${x}" y="${y}" width="${columns * cell}" ` +
      `height="${rows * cell}" fill="${FLOOR}" stroke="#56616A" stroke-width="2"/>`,
    `<rect x="${x + grassStart * cell}" y="${y}" width="${(columns - grassStart) * cell}" ` +
      `height="${rows * cell}" fill="${GRASS}"/>`,
    `<rect x="${x}" y="${y + 2.8 * cell}" width="${columns * cell}" ` +
      `height="${0.7 * cell}" fill="${WALK}" opacity=".94"/>`,
  );
  for (let column = 1; column < columns; column += 1) {
    parts.push(
      line(
        `M ${x + column * cell} ${y} V ${y + rows * cell}`,
        FLOOR_LINE,
        1,
        0.15,
      ),
    );
  }
  for (let row = 1; row < rows; row += 1) {
    parts.push(
      line(
        `M ${x} ${y + row * cell} H ${x + columns * cell}`,
        FLOOR_LINE,
        1,
        0.15,
      ),
    );
  }
}

function drawFacade(
  parts: string[],
  renderer: PropCalibrationRenderer,
  x: number,
  y: number,
  columns: number,
  cell: number,
): void {
  parts.push(renderer.wallTile(6, x, y, cell));
  for (let column = 1; column < columns - 1; column += 1) {
    parts.push(renderer.wallTile(10, x + column * cell, y, cell));
  }
  parts.push(renderer.wallTile(12, x + (columns - 1) * cell, y, cell));
}

function outdoorPlacement(
  renderer: PropCalibrationRenderer,
  kind: 'current' | 'selected',
  id: string,
  footprintX: number,
  footprintY: number,
  cell: number,
  occupancy = true,
): string {
  const template = renderer.template(id);
  const footprintWidth = template.gridFootprint.w * cell;
  const footprintHeight = template.gridFootprint.h * cell;
  const spriteSize = cell * PROP_NATIVE_FRAME_CELLS;
  const x = footprintX + (footprintWidth - spriteSize) / 2;
  const y = template.projection === 'plan'
    ? footprintY + (footprintHeight - spriteSize) / 2
    : footprintY + footprintHeight - spriteSize * (116 / AUTHORING_CANVAS);
  const guide = occupancy
    ? (
      `<rect x="${footprintX + 3}" y="${footprintY + 3}" ` +
      `width="${footprintWidth - 6}" height="${footprintHeight - 6}" ` +
      `rx="5" fill="${OCCUPANCY}" fill-opacity=".08" stroke="${OCCUPANCY}" ` +
      'stroke-width="1.3" stroke-dasharray="5 4"/>'
    )
    : '';
  return guide + placedSvg(
    sourceFor(renderer, kind, id),
    x,
    y,
    spriteSize,
  );
}

function systemPlacement(
  id: GameplayGapCandidateId,
  footprintX: number,
  footprintY: number,
  cell: number,
  occupancy = true,
): string {
  const decision = GAMEPLAY_GAP_CANDIDATES.find(
    (candidate) => candidate.id === id,
  );
  if (!decision) throw new Error(`Missing system decision ${id}`);
  const footprintWidth = decision.gridFootprint.w * cell;
  const footprintHeight = decision.gridFootprint.h * cell;
  const spriteSize = cell * PROP_NATIVE_FRAME_CELLS;
  const x = footprintX + (footprintWidth - spriteSize) / 2;
  const y = decision.placement === 'wall-slot'
    ? footprintY - spriteSize * 0.06
    : footprintY + footprintHeight - spriteSize * (116 / AUTHORING_CANVAS);
  const guide = occupancy
    ? (
      `<rect x="${footprintX + 3}" y="${footprintY + 3}" ` +
      `width="${footprintWidth - 6}" height="${footprintHeight - 6}" ` +
      `rx="5" fill="${OCCUPANCY}" fill-opacity=".08" stroke="${OCCUPANCY}" ` +
      'stroke-width="1.3" stroke-dasharray="5 4"/>'
    )
    : '';
  return guide + placedSvg(
    renderGameplayGapCandidateSvg(id),
    x,
    y,
    spriteSize,
  );
}

interface AgentPlacement {
  readonly recipe: CharacterRecipe;
  readonly facing: Facing | 'west';
  readonly x: number;
  readonly y: number;
}

function agentPlacement(
  renderer: PropCalibrationRenderer,
  spec: AgentPlacement,
  roomX: number,
  roomY: number,
  cell: number,
): string {
  const frameSize = cell * CHARACTER_FRAME_CELLS;
  const source = renderer.character(spec.recipe, spec.facing, 'neutral');
  const anchorX = roomX + spec.x * cell;
  const anchorY = roomY + spec.y * cell;
  return placedSvg(
    source,
    anchorX - frameSize / 2,
    anchorY - frameSize * 0.86,
    frameSize,
  );
}

function serviceScene(
  renderer: PropCalibrationRenderer,
  x: number,
  y: number,
  cell: number,
  crowded = false,
): string {
  const parts: string[] = [];
  drawGrid(parts, x, y, 10, 6, cell, 8);
  drawFacade(parts, renderer, x, y, 10, cell);
  const cameraX = x + 4.5 * cell;
  const cameraY = y + 1.2 * cell;
  parts.push(
    p(
      `M ${cameraX} ${cameraY} L ${x + 2.6 * cell} ${y + 4.7 * cell} ` +
        `L ${x + 6.6 * cell} ${y + 4.7 * cell} Z`,
      Q.blueGlass,
      0.11,
    ),
    outdoorPlacement(
      renderer,
      'selected',
      'lot-marking-crosswalk',
      x + 4 * cell,
      y + 1.25 * cell,
      cell,
    ),
    outdoorPlacement(
      renderer,
      'selected',
      'car',
      x + 0.1 * cell,
      y + 1.3 * cell,
      cell,
    ),
    systemPlacement(
      'hvac-condenser',
      x + 0.9 * cell,
      y + 4.05 * cell,
      cell,
    ),
  );
  const actors: readonly AgentPlacement[] = crowded
    ? [
        { recipe: DEFAULT_CAST[0], facing: 'south', x: 3.2, y: 4.2 },
        { recipe: DEFAULT_CAST[1], facing: 'east', x: 5.3, y: 3.7 },
        { recipe: DEFAULT_CAST[2], facing: 'west', x: 7.4, y: 4.8 },
        { recipe: DEFAULT_CAST[3], facing: 'north', x: 8.8, y: 5.1 },
      ]
    : [
        { recipe: DEFAULT_CAST[0], facing: 'east', x: 3.1, y: 4.1 },
        { recipe: DEFAULT_CAST[1], facing: 'west', x: 7.15, y: 4.45 },
      ];
  for (const actor of actors) {
    parts.push(agentPlacement(renderer, actor, x, y, cell));
  }
  parts.push(
    outdoorPlacement(
      renderer,
      'selected',
      'sign-lot',
      x + 6.9 * cell,
      y + 2.2 * cell,
      cell,
    ),
    outdoorPlacement(
      renderer,
      'selected',
      'lamp-post',
      x + 8.65 * cell,
      y + 2.25 * cell,
      cell,
    ),
    systemPlacement(
      'surveillance-camera',
      x + 4 * cell,
      y + 0.25 * cell,
      cell,
      false,
    ),
    systemPlacement(
      'surveillance-sensor',
      x + 5.35 * cell,
      y + 0.34 * cell,
      cell,
      false,
    ),
    c(x + 2.05 * cell, y + 3.25 * cell, cell * 0.11, CORAL),
  );
  return parts.join('');
}

function campusScene(
  renderer: PropCalibrationRenderer,
  x: number,
  y: number,
  cell: number,
  crowded = false,
): string {
  const parts: string[] = [];
  drawGrid(parts, x, y, 10, 6, cell, 0);
  drawFacade(parts, renderer, x, y, 10, cell);
  parts.push(
    outdoorPlacement(
      renderer,
      'selected',
      'bike-rack',
      x + 0.8 * cell,
      y + 1.45 * cell,
      cell,
    ),
    outdoorPlacement(
      renderer,
      'selected',
      'picnic-table',
      x + 0.8 * cell,
      y + 3.5 * cell,
      cell,
    ),
    systemPlacement(
      'privacy-hedge',
      x + 5.35 * cell,
      y + 4.15 * cell,
      cell,
    ),
  );
  const actors: readonly AgentPlacement[] = crowded
    ? [
        { recipe: DEFAULT_CAST[0], facing: 'south', x: 2.5, y: 4.3 },
        { recipe: DEFAULT_CAST[1], facing: 'east', x: 4.6, y: 3.75 },
        { recipe: DEFAULT_CAST[2], facing: 'west', x: 6.5, y: 4.6 },
        { recipe: DEFAULT_CAST[3], facing: 'north', x: 8.5, y: 5.05 },
      ]
    : [
        { recipe: DEFAULT_CAST[2], facing: 'south', x: 3.9, y: 4.15 },
        { recipe: DEFAULT_CAST[3], facing: 'west', x: 6.35, y: 4.65 },
      ];
  for (const actor of actors) {
    parts.push(agentPlacement(renderer, actor, x, y, cell));
  }
  parts.push(
    outdoorPlacement(
      renderer,
      'selected',
      'park-bench',
      x + 4.25 * cell,
      y + 3.45 * cell,
      cell,
    ),
    outdoorPlacement(
      renderer,
      'selected',
      'tree-canopy',
      x + 6.65 * cell,
      y + 2.25 * cell,
      cell,
    ),
  );
  return parts.join('');
}

function grammarBand(parts: string[]): void {
  const y = 100;
  parts.push(
    panel(MARGIN, y, WIDTH - MARGIN * 2, 158, PANEL_ALT),
    text(MARGIN + 22, y + 34, 'Accepted hybrid grammar · one family, three responsibilities', 20, 860, GREEN),
    text(
      WIDTH - MARGIN - 22,
      y + 34,
      'accepted design direction · still temporary proposal pixels',
      11,
      780,
      CORAL,
      'end',
    ),
  );
  const rules = [
    [
      '1 · SITE KIT OWNS MANUFACTURE',
      'Rounded standardized shells, deep-green structure, cream working faces, and stable silhouettes.',
    ],
    [
      '2 · SERVICE EDGE EXPLAINS FUNCTION',
      'Coral and dark access details appear only at controls, maintenance, safety, light, or observation surfaces.',
    ],
    [
      '3 · LIFE SOFTENS THE CAMPUS',
      'Wear, locks, posted notes, foliage, and use remain subordinate; living nature keeps its own saturated grammar.',
    ],
  ] as const;
  rules.forEach(([title, body], index) => {
    const x = MARGIN + 28 + index * 1165;
    parts.push(
      index > 0 ? line(`M ${x - 28} ${y + 54} V ${y + 132}`, RULE, 1) : '',
      text(x, y + 79, title, 13, 880, index === 1 ? BLUE : GREEN),
      wrappedText(x, y + 104, body, 116, 19, 10.5, 620, MUTED),
    );
  });
}

function closeMatrix(
  parts: string[],
  renderer: PropCalibrationRenderer,
): void {
  const y = 276;
  const width = WIDTH - MARGIN * 2;
  const height = 440;
  const ids = [
    ...SELECTED_OUTDOOR_HYBRID_DECISIONS.map(({ id }) => id),
    ...SELECTED_SYSTEM_CANDIDATE_IDS,
  ];
  const labelWidth = 240;
  const columnWidth = (width - labelWidth - 24) / ids.length;
  const sprite = 96;
  parts.push(
    panel(MARGIN, y, width, height, PANEL_ALT),
    text(MARGIN + 22, y + 34, 'Close read · current versus selected hybrid family', 20, 860),
    text(
      WIDTH - MARGIN - 22,
      y + 34,
      '128u source cells · projection and proposed footprint held',
      11,
      760,
      CORAL,
      'end',
    ),
  );
  ids.forEach((id, index) => {
    const center = MARGIN + labelWidth + columnWidth * (index + 0.5);
    const role = SELECTED_OUTDOOR_HYBRID_DECISIONS.find(
      (decision) => decision.id === id,
    )?.role ?? 'System';
    parts.push(
      text(center, y + 67, role.toUpperCase(), 8.5, 840, GREEN, 'middle'),
      text(center, y + 84, id, 7.5, 650, MUTED, 'middle'),
    );
  });
  (['current', 'selected'] as const).forEach((kind, row) => {
    const rowY = y + 96 + row * 148;
    parts.push(
      panel(
        MARGIN + 14,
        rowY,
        width - 28,
        136,
        kind === 'current' ? PANEL : GREEN_SOFT,
        'none',
        9,
      ),
      text(
        MARGIN + 30,
        rowY + 31,
        kind === 'current' ? 'CURRENT / ABSENT' : 'SELECTED HYBRID',
        12,
        880,
        kind === 'current' ? MUTED : GREEN,
      ),
    );
    ids.forEach((id, index) => {
      const center = MARGIN + labelWidth + columnWidth * (index + 0.5);
      const systemId = SELECTED_SYSTEM_CANDIDATE_IDS.find(
        (candidate) => candidate === id,
      );
      if (kind === 'current' && systemId) {
        parts.push(
          `<rect x="${center - 37}" y="${rowY + 24}" width="74" height="74" ` +
            `rx="8" fill="none" stroke="${RULE}" stroke-width="1.2" stroke-dasharray="5 4"/>`,
          text(center, rowY + 67, 'NEW', 8.5, 800, CORAL, 'middle'),
        );
        return;
      }
      const source = systemId
        ? renderGameplayGapCandidateSvg(systemId)
        : sourceFor(renderer, kind, id);
      parts.push(
        placedSvg(source, center - sprite / 2, rowY + 8, sprite),
      );
    });
  });
  parts.push(
    text(
      MARGIN + 22,
      y + height - 18,
      'The four system concepts remain proposed additions; “selected” records design direction, not registration.',
      10,
      720,
      BLUE,
    ),
  );
}

function decisionLedger(parts: string[]): void {
  const y = 734;
  const width = WIDTH - MARGIN * 2;
  parts.push(
    panel(MARGIN, y, width, 286, PANEL),
    text(MARGIN + 22, y + 34, 'Consolidation ledger', 18, 860, GREEN),
    text(
      WIDTH - MARGIN - 22,
      y + 34,
      'selected source influence per carrier',
      11,
      760,
      CORAL,
      'end',
    ),
  );
  SELECTED_OUTDOOR_HYBRID_DECISIONS.forEach((decision, index) => {
    const column = index % 4;
    const row = Math.floor(index / 4);
    const columnWidth = width / 4;
    const x = MARGIN + 26 + column * columnWidth;
    const rowY = y + 70 + row * 96;
    parts.push(
      column > 0
        ? line(
            `M ${MARGIN + column * columnWidth} ${rowY - 20} ` +
              `V ${rowY + 61}`,
            RULE,
            1,
          )
        : '',
      c(x + 4, rowY - 3, 4, decision.direction === 'service-coded-edge' ? CORAL : GREEN),
      text(
        x + 17,
        rowY,
        `${decision.id} · ${decision.direction}`,
        10.5,
        820,
        BLUE,
      ),
      wrappedText(x + 17, rowY + 23, decision.decision, 74, 17, 9.5, 600, MUTED),
    );
  });
}

function normalScenes(
  parts: string[],
  renderer: PropCalibrationRenderer,
): void {
  const y = 1038;
  const width = (WIDTH - MARGIN * 2 - GAP) / 2;
  const roomWidth = 10 * NORMAL_CELL;
  const leftX = MARGIN;
  const rightX = MARGIN + width + GAP;
  const leftRoomX = leftX + (width - roomWidth) / 2;
  const rightRoomX = rightX + (width - roomWidth) / 2;
  const roomY = y + 70;
  parts.push(
    panel(leftX, y, width, 590, TEAL_SOFT),
    text(leftX + 18, y + 30, 'SERVICE EDGE · PARKING + BUILDING SYSTEMS', 15, 870, GREEN),
    text(leftX + width - 18, y + 30, `${NORMAL_CELL} px / cell`, 9.5, 780, CORAL, 'end'),
    text(leftX + 18, y + 51, 'Car · crossing · HVAC · camera · sensor · sign · practical light', 9.5, 620, MUTED),
    serviceScene(renderer, leftRoomX, roomY, NORMAL_CELL),
    panel(rightX, y, width, 590, GREEN_SOFT),
    text(rightX + 18, y + 30, 'LIVED CAMPUS · MOBILITY + OUTDOOR RECOVERY', 15, 870, GREEN),
    text(rightX + width - 18, y + 30, `${NORMAL_CELL} px / cell`, 9.5, 780, CORAL, 'end'),
    text(rightX + 18, y + 51, 'Bike rack · picnic table · bench · hedge · tree · employee use', 9.5, 620, MUTED),
    campusScene(renderer, rightRoomX, roomY, NORMAL_CELL),
    text(
      leftX + 18,
      y + 568,
      'Dashed = preserved/proposed occupancy · character roots and ×0.65 visual scale unchanged',
      9,
      650,
      BLUE,
    ),
    text(
      rightX + 18,
      y + 568,
      'Nature remains living material; QuotaCo owns edging, service tags, and manufactured neighbors.',
      9,
      650,
      BLUE,
    ),
  );
}

function stressPanel(
  parts: string[],
  renderer: PropCalibrationRenderer,
): void {
  const y = 1646;
  const width = WIDTH - MARGIN * 2;
  parts.push(
    panel(MARGIN, y, width, 514, PANEL_ALT),
    text(MARGIN + 22, y + 34, 'Far/crowded + operational-state stress pass', 18, 860, GREEN),
    text(
      WIDTH - MARGIN - 22,
      y + 34,
      `${FAR_CELL} px / cell`,
      10,
      800,
      CORAL,
      'end',
    ),
  );
  const serviceX = MARGIN + 24;
  const campusX = MARGIN + 454;
  const roomY = y + 64;
  parts.push(
    serviceScene(renderer, serviceX, roomY, FAR_CELL, true),
    campusScene(renderer, campusX, roomY, FAR_CELL, true),
    text(serviceX, y + 326, 'SERVICE CROWD', 9, 800, CORAL),
    text(campusX, y + 326, 'CAMPUS CROWD', 9, 800, CORAL),
  );
  const statesX = MARGIN + 910;
  GAMEPLAY_GAP_CANDIDATES.forEach((candidate, row) => {
    const rowY = y + 68 + row * 92;
    parts.push(
      text(statesX, rowY + 30, candidate.id, 9.5, 800, BLUE),
    );
    (['rated', 'degraded', 'inoperative'] as const).forEach((state, column) => {
      const spriteX = statesX + 180 + column * 104;
      parts.push(
        placedSvg(
          renderGameplayGapCandidateSvg(candidate.id, state),
          spriteX,
          rowY,
          68,
        ),
        text(
          spriteX + 34,
          rowY + 78,
          state.toUpperCase(),
          6.8,
          680,
          state === 'rated' ? GREEN : CORAL,
          'middle',
        ),
      );
    });
  });
  const notesX = MARGIN + 1490;
  parts.push(
    panel(notesX, y + 58, width - 1514, 402, GREEN_SOFT, 'none', 9),
    text(notesX + 24, y + 91, 'Consolidated read', 15, 860, GREEN),
  );
  const notes = [
    'Manufactured objects share one low rounded catalog family before small service or wear marks.',
    'Observation, maintenance, access, lighting, seating, and wayfinding surfaces remain explicit at normal zoom.',
    'Crowds and elevation overlap do not erase the car, crossing, HVAC, bench, hedge, or tree silhouettes.',
    'System states read as named visual changes, not durability bars or a generic warning tint.',
  ];
  notes.forEach((note, index) => {
    parts.push(
      c(notesX + 30, y + 130 + index * 68, 4, index === 0 ? GREEN : CORAL),
      wrappedText(
        notesX + 45,
        y + 135 + index * 68,
        note,
        128,
        18,
        10.5,
        index === 0 ? 720 : 610,
        index === 0 ? INK : MUTED,
      ),
    );
  });
}

function approvalBoundary(parts: string[]): void {
  const y = 2178;
  parts.push(
    panel(MARGIN, y, WIDTH - MARGIN * 2, 238, '#DAD4C6', 'none', 10),
    text(MARGIN + 22, y + 38, 'Accepted review boundary', 18, 860, GREEN),
    text(
      MARGIN + 22,
      y + 70,
      'The consolidated hybrid family, including the revised low-staple rack and offset-arm street light, is visually accepted.',
      12,
      690,
      INK,
    ),
    text(
      MARGIN + 22,
      y + 111,
      'This acceptance authorizes genuine standalone SVG source creation next. It does not automatically authorize new templates, gameplay systems, exports, or Unity registration.',
      11,
      680,
      CORAL,
    ),
    text(MARGIN + 22, y + 158, 'Held', 12, 840, BLUE),
    text(
      MARGIN + 22,
      y + 185,
      'character art/scale/roots · wall art/datum · existing prop contracts · schema · exporter · Unity integration',
      10.5,
      650,
      MUTED,
    ),
    text(MARGIN + 22, y + 216, 'No source SVG creation · no production promotion · no commit', 10.5, 760, MUTED),
    panel(WIDTH - MARGIN - 1120, y + 92, 1080, 104, PANEL_ALT, 'none', 9),
    text(WIDTH - MARGIN - 1094, y + 120, 'SYSTEM CANDIDATE BOUNDARY', 11, 880, CORAL),
    wrappedText(
      WIDTH - MARGIN - 1094,
      y + 147,
      'The four new concepts can receive approved SVG source files next, but live ids and facility behavior wait for a separate contract-aware decision.',
      128,
      19,
      10.5,
      650,
      INK,
    ),
  );
}

function sheet(renderer: PropCalibrationRenderer): string {
  const parts: string[] = [
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAGE}"/>`,
    text(MARGIN, 46, 'QuotaCo exterior prop family · accepted hybrid consolidation v2', 29, 880),
    text(
      MARGIN,
      76,
      'REVIEW ACCEPTED · revised mobility and lighting carriers locked into one coherent family',
      14,
      800,
      CORAL,
    ),
    text(
      WIDTH - MARGIN,
      44,
      'existing exterior carriers + four systems-first concepts',
      12,
      760,
      GREEN,
      'end',
    ),
    text(
      WIDTH - MARGIN,
      70,
      `128u authoring · 112u wall · character ×${CHARACTER_VISUAL_SCALE} · schema ${CURRENT_SCHEMA_VERSION}`,
      11.5,
      650,
      MUTED,
      'end',
    ),
  ];
  grammarBand(parts);
  closeMatrix(parts, renderer);
  decisionLedger(parts);
  normalScenes(parts, renderer);
  stressPanel(parts, renderer);
  approvalBoundary(parts);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" ` +
    `viewBox="0 0 ${WIDTH} ${HEIGHT}">${parts.join('')}</svg>`
  );
}

function decisionMarkdown(): string {
  const lines = [
    '# QuotaCo exterior accepted hybrid consolidation v2',
    '',
    'Status: visually accepted. Genuine source authoring is authorized but not yet performed.',
    '',
    '## Hybrid grammar',
    '',
    '- Site Kit owns manufactured silhouettes and primary material relationships.',
    '- Service Edge details appear only where they explain maintenance, safety, control, access, lighting, or observation.',
    '- Lived Campus wear and personalization remain optional and subordinate.',
    '- Living nature retains its own saturated material grammar; QuotaCo appears at manufactured edges and service tags.',
    '- The accepted mobility revision is `rack-low-staple`; the accepted lighting revision is `light-offset-arm`.',
    '',
    '## Existing carrier decisions',
    '',
    '| Prop | Role | Selected influence | Decision |',
    '| --- | --- | --- | --- |',
  ];
  for (const decision of SELECTED_OUTDOOR_HYBRID_DECISIONS) {
    lines.push(
      `| \`${decision.id}\` | ${decision.role} | ${decision.direction} | ${decision.decision} |`,
    );
  }
  lines.push(
    '',
    '## Systems-first concepts',
    '',
  );
  for (const candidate of GAMEPLAY_GAP_CANDIDATES) {
    lines.push(
      `- \`${candidate.id}\`: ${candidate.systemReceiver}; ${candidate.floorConsequence}.`,
    );
  }
  lines.push(
    '',
    'Visual acceptance authorizes standalone artist-editable SVG source creation for accepted carriers. New template ids, gameplay systems, facility registration, export changes, and Unity integration remain separate decisions.',
    '',
  );
  return lines.join('\n');
}

function metrics(renderer: PropCalibrationRenderer): object {
  return {
    status: 'visual-review-accepted',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    authoringCanvas: AUTHORING_CANVAS,
    wallDatum: WALL_DATUM,
    characterVisualScale: CHARACTER_VISUAL_SCALE,
    propVisualMultiplier: null,
    propNativeFrameCells: PROP_NATIVE_FRAME_CELLS,
    existingCarrierDecisions: SELECTED_OUTDOOR_HYBRID_DECISIONS.map(
      (decision) => {
        const template = renderer.template(decision.id);
        return {
          ...decision,
          projection: template.projection,
          placement: template.placement ?? 'floor',
          gridFootprint: template.gridFootprint,
          gridPivot: template.gridPivot ?? null,
        };
      },
    ),
    acceptedCarrierRevisions: ACCEPTED_MOBILITY_LIGHTING_REVISIONS,
    systemCandidateDecisions: GAMEPLAY_GAP_CANDIDATES,
    proofGates: [
      'close current-versus-selected comparison',
      `${NORMAL_CELL}px-per-cell service and campus contexts`,
      `${FAR_CELL}px-per-cell crowded contexts`,
      'accepted wall context',
      'camera coverage and HVAC service approach',
      'tree and hedge occlusion',
      'rated, degraded, and inoperative system states',
    ],
    mutationsPerformed: {
      productionSvgSources: false,
      propTemplates: false,
      facilityCatalog: false,
      gameplaySystems: false,
      exporter: false,
      schema: false,
      unityRegistration: false,
      commit: false,
    },
  };
}

export function validateOutdoorHybridConsolidation(): {
  existingCarrierCount: number;
  systemCandidateCount: number;
} {
  const ids = SELECTED_OUTDOOR_HYBRID_DECISIONS.map(({ id }) => id);
  if (new Set(ids).size !== ids.length) {
    throw new Error('Selected outdoor hybrid decisions contain duplicate ids');
  }
  for (const decision of SELECTED_OUTDOOR_HYBRID_DECISIONS) {
    if (!PROP_TEMPLATES.some((template) => template.id === decision.id)) {
      throw new Error(`Missing live outdoor carrier ${decision.id}`);
    }
  }
  for (const id of SELECTED_SYSTEM_CANDIDATE_IDS) {
    if (PROP_TEMPLATES.some((template) => template.id === id)) {
      throw new Error(`Review-only system candidate already exists ${id}`);
    }
  }
  for (const id of Object.values(ACCEPTED_MOBILITY_LIGHTING_REVISIONS)) {
    const source = renderMobilityLightingRevisionSvg(id);
    if (!source.includes('viewBox="0 0 128 128"')) {
      throw new Error(`Accepted carrier revision is not 128u SVG ${id}`);
    }
  }
  return {
    existingCarrierCount: ids.length,
    systemCandidateCount: SELECTED_SYSTEM_CANDIDATE_IDS.length,
  };
}

export async function renderOutdoorHybridConsolidation(
  output: string,
): Promise<{
  svgPath: string;
  pngPath: string;
  metricsPath: string;
  decisionPath: string;
}> {
  validateOutdoorHybridConsolidation();
  const renderer = new PropCalibrationRenderer(new Map());
  const source = sheet(renderer);
  const png = new Resvg(source, {
    font: { loadSystemFonts: true },
  }).render().asPng();
  await mkdir(output, { recursive: true });
  const base = 'quota-co-outdoor-hybrid-consolidation-v2';
  const svgPath = path.join(output, `${base}.svg`);
  const pngPath = path.join(output, `${base}.png`);
  const metricsPath = path.join(output, `${base}-metrics.json`);
  const decisionPath = path.join(output, `${base}.md`);
  await writeFile(svgPath, source, 'utf8');
  await writeFile(pngPath, png);
  await writeFile(
    metricsPath,
    `${JSON.stringify(metrics(renderer), null, 2)}\n`,
    'utf8',
  );
  await writeFile(decisionPath, `${decisionMarkdown()}\n`, 'utf8');
  return { svgPath, pngPath, metricsPath, decisionPath };
}

interface CliOptions {
  readonly output: string;
}

function parseArgs(args: readonly string[]): CliOptions {
  let output = path.resolve('docs/previews');
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--out') {
      const value = args[++index];
      if (!value) throw new Error('--out requires a path');
      output = path.resolve(value);
      continue;
    }
    throw new Error(`Unknown argument ${argument}`);
  }
  return { output };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const result = await renderOutdoorHybridConsolidation(options.output);
  process.stdout.write(
    'Wrote review-only exterior hybrid consolidation:\n' +
      `${result.svgPath}\n` +
      `${result.pngPath}\n` +
      `${result.metricsPath}\n` +
      `${result.decisionPath}\n`,
  );
}

if (
  process.argv[1]?.endsWith('quotaCoOutdoorHybridConsolidationPreview.ts')
) {
  main().catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
