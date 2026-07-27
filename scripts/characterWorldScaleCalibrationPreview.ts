/**
 * Review-only character + prop world-scale calibration against the accepted
 * 112-unit QuotaCo wall footprint.
 *
 *   node --import tsx scripts/characterWorldScaleCalibrationPreview.ts
 *   node --import tsx scripts/characterWorldScaleCalibrationPreview.ts --out docs/previews
 *
 * The proof keeps the 128-unit authoring canvases, wall topology, exported grid
 * footprints, schemas, and runtime registration unchanged. It varies only the
 * installed character envelope so the world-scale ratio can be selected before
 * production migration. Real props remain fixed at their current authored
 * envelope, keeping the character decision isolated.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import {
  composeProp,
  composeWallShapes,
} from '../src/core/compositor';
import type {
  Facing,
  PropInstance,
  PropTemplate,
  StyleSheet,
  TileInstance,
} from '../src/core/types';
import {
  DEFAULT_STYLE,
  defaultProject,
} from '../src/data/defaults';
import { PROP_TEMPLATES } from '../src/props/templates';
import {
  EQUAL_HEIGHT_ALL_MASK_REVIEW_BOUNDARY,
  compileSelectedEqualHeightAllMaskFrames,
  equalHeightAllMaskSourceFootprintState,
  type CalibratedEqualHeightFrame,
} from './highOblique/equalHeightFootprintAllMaskCalibration';
import {
  compileEqualHeightEvaluationFrames,
} from './walls/equalHeightImporter';
import {
  ALL_BODIES,
  HEADS,
} from './characterHeadGapPreview';
import {
  HAIR,
  renderCandidate,
} from './characterHairSilhouettePreview';

const WIDTH = 2440;
const HEIGHT = 1790;
const MARGIN = 30;
const GAP = 20;
const CELL = 90;
const AUTHORING_CANVAS = 128;
const CURRENT_CHARACTER_FRAME_CELLS = 1.55;

const PAGE = '#E7E1D2';
const PANEL = '#F6F1E6';
const PANEL_ALT = '#ECE5D7';
const INK = '#292C2A';
const MUTED = '#626861';
const RULE = '#A39B8B';
const GREEN = '#4E8059';
const GREEN_SOFT = '#DCE9DD';
const CORAL = '#C96A50';
const CORAL_SOFT = '#F0DDD6';
const BLUE = '#294565';
const FLOOR = '#7B8890';
const FLOOR_LINE = '#D9D4C7';
const OCCUPANCY = '#D7CFAF';

const SOURCE_ROOTS = [
  {
    inputDir: path.resolve('assets/walls/quota-co-building-system'),
    sourcePathPrefix: 'assets/walls/quota-co-building-system',
  },
  {
    inputDir: path.resolve(
      'assets/walls/quota-co-building-system-proofs',
    ),
    sourcePathPrefix:
      'assets/walls/quota-co-building-system-proofs',
  },
] as const;

interface ScaleCandidate {
  readonly id: string;
  readonly label: string;
  readonly factor: number;
  readonly note: string;
  readonly fill: string;
}

type CalibrationRound = '1' | '2';

const ROUND_ONE_CANDIDATES: readonly ScaleCandidate[] = [
  {
    id: 'current',
    label: 'A · CURRENT',
    factor: 1,
    note: 'locked wall-proof reference',
    fill: PANEL,
  },
  {
    id: 'minus-12',
    label: 'B · −12%',
    factor: 0.88,
    note: 'moderate character reduction',
    fill: GREEN_SOFT,
  },
  {
    id: 'minus-25',
    label: 'C · −25%',
    factor: 0.75,
    note: 'strong character reduction',
    fill: CORAL_SOFT,
  },
];

const ROUND_TWO_CANDIDATES: readonly ScaleCandidate[] = [
  {
    id: 'minus-25',
    label: 'A · −25%',
    factor: 0.75,
    note: 'round-one lead · overlap reference',
    fill: PANEL,
  },
  {
    id: 'minus-35',
    label: 'B · −35%',
    factor: 0.65,
    note: 'SELECTED · accepted character scale',
    fill: GREEN_SOFT,
  },
  {
    id: 'minus-45',
    label: 'C · −45%',
    factor: 0.55,
    note: 'strong reduction · smallest candidate',
    fill: CORAL_SOFT,
  },
];

function candidatesForRound(
  round: CalibrationRound,
): readonly ScaleCandidate[] {
  return round === '1' ? ROUND_ONE_CANDIDATES : ROUND_TWO_CANDIDATES;
}

interface AgentSpec {
  readonly bodyIndex: number;
  readonly headIndex: number;
  readonly hairIndex: number;
  readonly facing: Facing | 'west';
  readonly outfit: string;
  readonly accessories: readonly string[];
  readonly anchorCellX: number;
  readonly anchorCellY: number;
}

const ROOM_AGENTS: readonly AgentSpec[] = [
  {
    bodyIndex: 0,
    headIndex: 2,
    hairIndex: 0,
    facing: 'south',
    outfit: 'outfit-hoodie',
    accessories: ['acc-clipboard'],
    anchorCellX: 1.75,
    anchorCellY: 3.82,
  },
  {
    bodyIndex: 4,
    headIndex: 1,
    hairIndex: 5,
    facing: 'south',
    outfit: 'outfit-dress',
    accessories: ['acc-mug'],
    anchorCellX: 3.55,
    anchorCellY: 3.88,
  },
  {
    bodyIndex: 5,
    headIndex: 4,
    hairIndex: 4,
    facing: 'east',
    outfit: 'outfit-suit-jacket',
    accessories: ['acc-watch'],
    anchorCellX: 5.18,
    anchorCellY: 3.15,
  },
];

const FAR_ZOOM_AGENTS: ReadonlyArray<{
  bodyIndex: number;
  headIndex: number;
  hairIndex: number;
  label: string;
}> = [
  { bodyIndex: 0, headIndex: 2, hairIndex: 0, label: 'Column · Long · Crop' },
  { bodyIndex: 1, headIndex: 3, hairIndex: 1, label: 'Block · Block · Sweep' },
  { bodyIndex: 2, headIndex: 0, hairIndex: 2, label: 'Wedge · Round · Bob' },
  { bodyIndex: 3, headIndex: 5, hairIndex: 3, label: 'Barrel · Lantern · Knot' },
  { bodyIndex: 4, headIndex: 1, hairIndex: 5, label: 'Bell · Broad · Cloud' },
  { bodyIndex: 5, headIndex: 4, hairIndex: 4, label: 'Pinch · Point · Tail' },
];

interface CliOptions {
  readonly output: string;
  readonly round: CalibrationRound;
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

function panel(
  x: number,
  y: number,
  width: number,
  height: number,
  fill = PANEL,
  stroke = RULE,
  radius = 15,
): string {
  return (
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" ` +
    `rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`
  );
}

function stripSvgShell(source: string): string {
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
  return source
    .replace('<svg ', `<svg x="${x}" y="${y}" `)
    .replace(
      /width="[^"]+" height="[^"]+"/,
      `width="${width}" height="${height}"`,
    )
    .replace('<svg ', '<svg overflow="visible" ');
}

class CalibrationRenderer {
  private readonly walls: ReadonlyMap<number, CalibratedEqualHeightFrame>;
  private readonly wall: TileInstance;
  private readonly style: StyleSheet;
  private readonly props: readonly PropInstance[];
  private readonly propCache = new Map<string, string>();
  private readonly wallCache = new Map<number, string>();

  constructor(frames: readonly CalibratedEqualHeightFrame[]) {
    this.walls = new Map(frames.map((frame) => [frame.index, frame]));
    const project = defaultProject();
    const wall = project.walls.find(({ id }) => id === 'wall-office');
    if (!wall) throw new Error('Default project is missing wall-office');
    this.wall = wall;
    this.style = {
      ...structuredClone(DEFAULT_STYLE),
      render: {
        ...DEFAULT_STYLE.render,
        contactShadow: 0.12,
      },
    };
    this.props = project.props;
  }

  tile(
    mask: number,
    x: number,
    y: number,
    size: number,
    options: { flipX?: boolean; frame?: boolean } = {},
  ): string {
    const frame = this.walls.get(mask);
    if (!frame) throw new Error(`Calibration wall bank is missing mask_${mask}`);
    let markup = this.wallCache.get(mask);
    if (!markup) {
      markup = stripSvgShell(
        composeWallShapes(frame.shapes, this.wall, this.style, 128),
      );
      this.wallCache.set(mask, markup);
    }
    return (
      `<svg x="${x}" y="${y}" width="${size}" height="${size}" ` +
      'viewBox="0 0 128 128" preserveAspectRatio="none" overflow="hidden">' +
      (options.flipX
        ? `<g transform="matrix(-1 0 0 1 128 0)">${markup}</g>`
        : markup) +
      '</svg>' +
      (options.frame === false
        ? ''
        : `<rect x="${x}" y="${y}" width="${size}" height="${size}" ` +
          'fill="none" stroke="#756F65" stroke-opacity=".25"/>')
    );
  }

  prop(templateId: string): {
    svg: string;
    template: PropTemplate;
    instance: PropInstance;
  } {
    const template = PROP_TEMPLATES.find(({ id }) => id === templateId);
    if (!template) throw new Error(`Missing prop template ${templateId}`);
    const instance = this.props.find((prop) => prop.templateId === templateId);
    if (!instance) throw new Error(`Default project is missing prop ${templateId}`);
    let svg = this.propCache.get(templateId);
    if (!svg) {
      svg = composeProp(instance, this.style, AUTHORING_CANVAS);
      this.propCache.set(templateId, svg);
    }
    return { svg, template, instance };
  }
}

function drawRoomGrid(
  parts: string[],
  x: number,
  y: number,
  columns: number,
  rows: number,
  size: number,
): void {
  parts.push(
    `<rect x="${x}" y="${y}" width="${columns * size}" ` +
      `height="${rows * size}" fill="${FLOOR}" stroke="#56616A" stroke-width="2"/>`,
  );
  for (let column = 1; column < columns; column += 1) {
    parts.push(
      `<path d="M ${x + column * size} ${y} V ${y + rows * size}" ` +
        `stroke="${FLOOR_LINE}" stroke-opacity=".18"/>`,
    );
  }
  for (let row = 1; row < rows; row += 1) {
    parts.push(
      `<path d="M ${x} ${y + row * size} H ${x + columns * size}" ` +
        `stroke="${FLOOR_LINE}" stroke-opacity=".18"/>`,
    );
  }
}

function drawRoomWalls(
  parts: string[],
  renderer: CalibrationRenderer,
  x: number,
  y: number,
  columns: number,
  rows: number,
  size: number,
  layer: 'back' | 'front',
): void {
  if (layer === 'back') {
    parts.push(renderer.tile(6, x, y, size));
    for (let column = 1; column < columns - 1; column += 1) {
      parts.push(renderer.tile(10, x + column * size, y, size));
    }
    parts.push(renderer.tile(12, x + (columns - 1) * size, y, size));
    for (let row = 1; row < rows - 1; row += 1) {
      parts.push(
        renderer.tile(5, x, y + row * size, size),
        renderer.tile(
          5,
          x + (columns - 1) * size,
          y + row * size,
          size,
          { flipX: true },
        ),
      );
    }
    return;
  }

  parts.push(renderer.tile(3, x, y + (rows - 1) * size, size));
  for (let column = 1; column < columns - 1; column += 1) {
    parts.push(
      renderer.tile(10, x + column * size, y + (rows - 1) * size, size),
    );
  }
  parts.push(
    renderer.tile(
      9,
      x + (columns - 1) * size,
      y + (rows - 1) * size,
      size,
    ),
  );
}

function propPlacement(
  renderer: CalibrationRenderer,
  templateId: string,
  footprintX: number,
  footprintY: number,
  cellSize: number,
  factor: number,
  showOccupancy = true,
): string {
  const { svg, template } = renderer.prop(templateId);
  const footprintWidth = template.gridFootprint.w * cellSize;
  const footprintHeight = template.gridFootprint.h * cellSize;
  const spriteSize = cellSize * factor;
  const x = footprintX + (footprintWidth - spriteSize) / 2;
  const y = template.projection === 'plan'
    ? footprintY + (footprintHeight - spriteSize) / 2
    : footprintY + footprintHeight - spriteSize * (116 / AUTHORING_CANVAS);
  const guide = showOccupancy
    ? (
      `<rect x="${footprintX + 3}" y="${footprintY + 3}" ` +
      `width="${footprintWidth - 6}" height="${footprintHeight - 6}" ` +
      `rx="6" fill="${OCCUPANCY}" fill-opacity=".10" stroke="${OCCUPANCY}" ` +
      'stroke-width="2" stroke-dasharray="7 5"/>'
    )
    : '';
  return guide + placedSvg(svg, x, y, spriteSize);
}

function agentPlacement(
  spec: AgentSpec,
  roomX: number,
  roomY: number,
  factor: number,
): string {
  const frameSize = CELL * CURRENT_CHARACTER_FRAME_CELLS * factor;
  const svg = renderCandidate(
    ALL_BODIES[spec.bodyIndex],
    HEADS[spec.headIndex],
    HAIR[spec.hairIndex],
    spec.facing,
    AUTHORING_CANVAS,
    {
      pose: 'neutral',
      outfit: spec.outfit,
      accessories: [...spec.accessories],
    },
  );
  const anchorX = roomX + spec.anchorCellX * CELL;
  const anchorY = roomY + spec.anchorCellY * CELL;
  return placedSvg(
    svg,
    anchorX - frameSize / 2,
    anchorY - frameSize * 0.86,
    frameSize,
  );
}

function scaleRoom(
  parts: string[],
  renderer: CalibrationRenderer,
  candidate: ScaleCandidate,
  x: number,
  y: number,
  width: number,
): void {
  const height = 650;
  const columns = 7;
  const rows = 5;
  const roomWidth = columns * CELL;
  const roomX = x + (width - roomWidth) / 2;
  const roomY = y + 108;
  const frameCells = CURRENT_CHARACTER_FRAME_CELLS * candidate.factor;

  parts.push(
    panel(x, y, width, height, candidate.fill),
    text(x + 24, y + 34, candidate.label, 22, 820, GREEN),
    text(
      x + width - 24,
      y + 34,
      `${frameCells.toFixed(2)}-cell character frame`,
      14,
      720,
      INK,
      'end',
    ),
    text(x + 24, y + 58, candidate.note, 13, 620, MUTED),
    text(
      x + width - 24,
      y + 58,
      `128u source → ${(CELL * frameCells).toFixed(0)} px at this 90 px cell`,
      12,
      620,
      MUTED,
      'end',
    ),
  );

  drawRoomGrid(parts, roomX, roomY, columns, rows, CELL);
  drawRoomWalls(
    parts,
    renderer,
    roomX,
    roomY,
    columns,
    rows,
    CELL,
    'back',
  );

  parts.push(
    propPlacement(
      renderer,
      'desk',
      roomX + 2 * CELL,
      roomY + CELL,
      CELL,
      1,
    ),
    propPlacement(
      renderer,
      'office-chair',
      roomX + 3 * CELL,
      roomY + 2 * CELL,
      CELL,
      1,
    ),
    propPlacement(
      renderer,
      'potted-tree',
      roomX + CELL,
      roomY + CELL,
      CELL,
      1,
    ),
    propPlacement(
      renderer,
      'water-cooler',
      roomX + 5 * CELL,
      roomY + CELL,
      CELL,
      1,
    ),
  );

  for (const spec of ROOM_AGENTS) {
    parts.push(agentPlacement(spec, roomX, roomY, candidate.factor));
  }

  drawRoomWalls(
    parts,
    renderer,
    roomX,
    roomY,
    columns,
    rows,
    CELL,
    'front',
  );

  parts.push(
    text(
      x + 24,
      y + 592,
      'Dashed boxes = exported grid occupancy · real prop envelopes remain fixed at current scale',
      12,
      620,
      MUTED,
    ),
    text(
      x + 24,
      y + 618,
      'Column/Long/Crop + clipboard · Bell/Broad/Cloud + mug · Pinch/Point/Tail profile',
      12,
      700,
      BLUE,
    ),
  );
}

function fixture(
  parts: string[],
  renderer: CalibrationRenderer,
  templateId: string,
  label: string,
  x: number,
  y: number,
  cellSize: number,
): void {
  const { template } = renderer.prop(templateId);
  const width = template.gridFootprint.w * cellSize;
  const height = template.gridFootprint.h * cellSize;
  parts.push(
    propPlacement(
      renderer,
      templateId,
      x,
      y,
      cellSize,
      1,
    ),
    text(x + width / 2, y + height + 19, label, 10, 720, INK, 'middle'),
    text(
      x + width / 2,
      y + height + 34,
      `${template.gridFootprint.w}×${template.gridFootprint.h} occupancy`,
      9,
      560,
      MUTED,
      'middle',
    ),
  );
}

function propLadder(
  parts: string[],
  renderer: CalibrationRenderer,
  candidates: readonly ScaleCandidate[],
  y: number,
): void {
  const width = WIDTH - MARGIN * 2;
  const height = 330;
  const columnWidth = (width - GAP * 2) / 3;
  parts.push(
    panel(MARGIN, y, width, height, PANEL_ALT),
    text(MARGIN + 24, y + 38, 'Prop control · real composed assets held fixed', 22, 820),
    text(
      MARGIN + 505,
      y + 38,
      'The room comparison changes characters only; props retain their current 128u envelope.',
      13,
      620,
      MUTED,
    ),
  );

  candidates.forEach((candidate, index) => {
    const x = MARGIN + index * (columnWidth + GAP);
    parts.push(
      panel(x + 10, y + 58, columnWidth - 20, 245, candidate.fill, 'none', 10),
      text(x + 28, y + 84, candidate.label, 15, 800, GREEN),
      text(
        x + columnWidth - 28,
        y + 84,
        `props 100% · character ${Math.round(candidate.factor * 100)}%`,
        11,
        650,
        MUTED,
        'end',
      ),
    );
    const fixtureY = y + 105;
    const cellSize = 62;
    fixture(parts, renderer, 'desk', 'Desk', x + 28, fixtureY, cellSize);
    fixture(parts, renderer, 'office-chair', 'Chair', x + 190, fixtureY, cellSize);
    fixture(parts, renderer, 'potted-tree', 'Tree', x + 292, fixtureY, cellSize);
    fixture(parts, renderer, 'water-cooler', 'Cooler', x + 394, fixtureY, cellSize);
    fixture(
      parts,
      renderer,
      'cubicle-workstation',
      'Cubicle workstation',
      x + 506,
      fixtureY,
      cellSize,
    );
  });
}

function farZoomGate(parts: string[], y: number): void {
  const width = WIDTH - MARGIN * 2;
  const height = 330;
  parts.push(
    panel(MARGIN, y, width, height),
    text(MARGIN + 24, y + 38, 'Far-zoom retention · absolute screen raster stays a separate gate', 22, 820),
    text(
      MARGIN + 690,
      y + 38,
      'Changing world presence does not authorize softer 48/40 px silhouettes.',
      13,
      620,
      MUTED,
    ),
    text(MARGIN + 30, y + 78, '48 px', 13, 800, GREEN),
    text(MARGIN + 30, y + 200, '40 px', 13, 800, CORAL),
  );

  FAR_ZOOM_AGENTS.forEach((spec, index) => {
    const x = MARGIN + 110 + index * 285;
    const svg48 = renderCandidate(
      ALL_BODIES[spec.bodyIndex],
      HEADS[spec.headIndex],
      HAIR[spec.hairIndex],
      index % 3 === 1 ? 'east' : 'south',
      48,
      { pose: 'neutral' },
    );
    const svg40 = renderCandidate(
      ALL_BODIES[spec.bodyIndex],
      HEADS[spec.headIndex],
      HAIR[spec.hairIndex],
      index % 3 === 1 ? 'east' : 'south',
      40,
      { pose: 'neutral', black: true },
    );
    parts.push(
      placedSvg(svg48, x + 72, y + 64, 48),
      placedSvg(svg40, x + 76, y + 186, 40),
      text(x + 96, y + 138, spec.label, 9, 650, INK, 'middle'),
      text(x + 96, y + 254, spec.label, 9, 650, MUTED, 'middle'),
    );
  });

  parts.push(
    `<path d="M ${MARGIN + 40} ${y + 278} H ${WIDTH - MARGIN - 40}" ` +
      `stroke="${RULE}" stroke-width="1"/>`,
    text(
      MARGIN + 40,
      y + 304,
      'Boundary held: one-row head/body air · fitted profile hair · neutral arms · no new frames, bones, poses, or renderer states',
      12,
      700,
      BLUE,
    ),
  );
}

function reviewSheet(
  renderer: CalibrationRenderer,
  sourceState: string,
  candidates: readonly ScaleCandidate[],
  round: CalibrationRound,
): string {
  const parts: string[] = [
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAGE}"/>`,
    text(
      MARGIN,
      48,
      `Character world-scale reduction calibration · round ${round}`,
      30,
      850,
      INK,
    ),
    text(
      MARGIN,
      78,
      'REVIEW ONLY · accepted 112-unit wall envelope · 90 px cells · real compositor assets',
      15,
      760,
      CORAL,
    ),
    text(
      WIDTH - MARGIN,
      48,
      `${sourceState} wall source`,
      13,
      720,
      GREEN,
      'end',
    ),
    text(
      WIDTH - MARGIN,
      77,
      round === '1'
        ? 'Choose the installed ratio; do not evaluate hair polish here.'
        : 'Round two continues downward from the −25% lead.',
      13,
      620,
      MUTED,
      'end',
    ),
  ];

  const cardWidth = (WIDTH - MARGIN * 2 - GAP * 2) / 3;
  candidates.forEach((candidate, index) => {
    scaleRoom(
      parts,
      renderer,
      candidate,
      MARGIN + index * (cardWidth + GAP),
      105,
      cardWidth,
    );
  });
  propLadder(parts, renderer, candidates, 785);
  farZoomGate(parts, 1135);
  parts.push(
    panel(MARGIN, 1485, WIDTH - MARGIN * 2, 260, '#DAD4C6', 'none', 12),
    text(
      MARGIN + 24,
      1523,
      round === '2' ? 'Selected outcome' : 'Decision this sheet supports',
      18,
      820,
      GREEN,
    ),
    text(
      MARGIN + 24,
      1553,
      round === '2'
        ? '−35% is locked: factor 0.65, approximately one character frame per cell. Props remain a separate redesign.'
        : 'Pick A, B, or C as the global character frame. Props are deliberately held fixed until that decision is made:',
      14,
      650,
      INK,
    ),
    text(MARGIN + 50, 1590, '• Handhelds remain rig-relative and will follow the selected character scale.', 13, 650, MUTED),
    text(MARGIN + 50, 1620, '• Chairs, desks, and counters need a second pass against the smaller hand / hip / seated anchors.', 13, 650, MUTED),
    text(MARGIN + 50, 1650, '• Facilities keep their exported footprint; their internal art receives a separate fit decision.', 13, 650, MUTED),
    text(MARGIN + 50, 1680, '• Decorations retain desktop / floor / architectural ranges rather than inheriting character scale.', 13, 650, MUTED),
    text(
      MARGIN + 50,
      1714,
      'No source canvas, wall topology, schema, atlas, PPU, collision, pathfinding, or Unity registration changes in this proof.',
      12,
      760,
      CORAL,
    ),
  );

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" ` +
    `viewBox="0 0 ${WIDTH} ${HEIGHT}">${parts.join('')}</svg>`
  );
}

function parseArgs(args: readonly string[]): CliOptions {
  let output = path.resolve('docs/previews');
  let round: CalibrationRound = '2';
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--out') {
      const value = args[++index];
      if (!value) throw new Error('--out requires a path');
      output = path.resolve(value);
      continue;
    }
    if (argument === '--round') {
      const value = args[++index];
      if (value !== '1' && value !== '2') {
        throw new Error('--round requires 1 or 2');
      }
      round = value;
      continue;
    }
    throw new Error(`Unknown argument ${argument}`);
  }
  return { output, round };
}

export async function renderWorldScaleCalibration(
  output: string,
  round: CalibrationRound = '2',
): Promise<{ svgPath: string; pngPath: string; metricsPath: string }> {
  const acceptedFrames = await compileEqualHeightEvaluationFrames({
    sourceRoots: SOURCE_ROOTS,
  });
  const sourceState = equalHeightAllMaskSourceFootprintState(acceptedFrames);
  const selectedFrames = compileSelectedEqualHeightAllMaskFrames(acceptedFrames);
  const renderer = new CalibrationRenderer(selectedFrames);
  const candidates = candidatesForRound(round);
  const source = reviewSheet(renderer, sourceState, candidates, round);
  const png = new Resvg(source, {
    font: { loadSystemFonts: true },
  }).render().asPng();

  await mkdir(output, { recursive: true });
  const base = `character-world-scale-calibration-v${round}`;
  const svgPath = path.join(output, `${base}.svg`);
  const pngPath = path.join(output, `${base}.png`);
  const metricsPath = path.join(
    output,
    `${base}-metrics.json`,
  );
  const propTemplates = [
    'desk',
    'office-chair',
    'potted-tree',
    'water-cooler',
    'cubicle-workstation',
  ].map((templateId) => {
    const template = PROP_TEMPLATES.find(({ id }) => id === templateId);
    if (!template) throw new Error(`Missing calibration prop ${templateId}`);
    return {
      id: template.id,
      projection: template.projection,
      gridFootprint: template.gridFootprint,
      authoringCanvas: AUTHORING_CANVAS,
    };
  });

  await writeFile(svgPath, source, 'utf8');
  await writeFile(pngPath, png);
  await writeFile(
    metricsPath,
    `${JSON.stringify({
      status: 'review-only',
      round,
      wallSourceState: sourceState,
      cellPixels: CELL,
      authoringCanvas: AUTHORING_CANVAS,
      currentCharacterFrameCells: CURRENT_CHARACTER_FRAME_CELLS,
      propControlFactor: 1,
      selectedCandidateId: round === '2' ? 'minus-35' : null,
      candidates: candidates.map((candidate) => ({
        ...candidate,
        characterFrameCells:
          CURRENT_CHARACTER_FRAME_CELLS * candidate.factor,
        characterFramePixels:
          CELL * CURRENT_CHARACTER_FRAME_CELLS * candidate.factor,
      })),
      agents: ROOM_AGENTS.map((agent) => ({
        body: ALL_BODIES[agent.bodyIndex].label,
        head: HEADS[agent.headIndex].label,
        hair: HAIR[agent.hairIndex].label,
        facing: agent.facing,
        outfit: agent.outfit,
        accessories: agent.accessories,
      })),
      props: propTemplates,
      boundaries: {
        wall: EQUAL_HEIGHT_ALL_MASK_REVIEW_BOUNDARY,
        character: [
          '128-unit authoring canvas unchanged',
          'v4 one-row head/body air retained',
          'v5.1 fitted hair/head profiles retained',
          'neutral arms retained',
          'no new frames, bones, poses, or renderer states',
        ],
        runtime: [
          'no exporter, atlas, schema, PPU, collision, pathfinding, or Unity registration change',
        ],
      },
    }, null, 2)}\n`,
    'utf8',
  );
  return { svgPath, pngPath, metricsPath };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const result = await renderWorldScaleCalibration(options.output, options.round);
  process.stdout.write(
    `Wrote review-only world-scale calibration:\n` +
      `${result.svgPath}\n${result.pngPath}\n${result.metricsPath}\n`,
  );
}

if (process.argv[1]?.endsWith('characterWorldScaleCalibrationPreview.ts')) {
  main().catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
