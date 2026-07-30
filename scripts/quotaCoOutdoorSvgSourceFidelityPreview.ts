/**
 * Source-fidelity gate for the visually accepted exterior family.
 *
 *   node --import tsx scripts/quotaCoOutdoorSvgSourceFidelityPreview.ts
 *   node --import tsx scripts/quotaCoOutdoorSvgSourceFidelityPreview.ts --out docs/previews
 *
 * The eight live-carrier files compile through the production importer. The
 * four systems files remain source-only candidates.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { parseSync, type INode } from 'svgson';

import { composeProp } from '../src/core/compositor';
import {
  CURRENT_SCHEMA_VERSION,
  type CharacterRecipe,
  type Facing,
} from '../src/core/types';
import {
  DEFAULT_CAST,
  DEFAULT_PROPS,
  DEFAULT_STYLE,
} from '../src/data/defaults';
import { authoredPropArt } from '../src/props/authoredArt';
import { PROP_TEMPLATES } from '../src/props/templates';
import {
  GAMEPLAY_GAP_CANDIDATES,
  type GameplayGapCandidateId,
  renderGameplayGapCandidateSvg,
} from './quotaCoGameplaySystemsPropGapPreview';
import {
  type ProposalDirectionId,
  renderOutdoorProposalSvg,
} from './quotaCoOutdoorConstructionCalibrationPreview';
import {
  RECOMMENDED_MOBILITY_LIGHTING_REVISIONS,
  renderMobilityLightingRevisionSvg,
} from './quotaCoOutdoorMobilityLightingRevisionPreview';
import { PropCalibrationRenderer } from './quotaCoPropRedesignCalibrationPreview';
import { PROP_NATIVE_FRAME_CELLS } from './quotaCoWorkstationFamilyCalibrationPreview';

const WIDTH = 3000;
const HEIGHT = 2040;
const MARGIN = 32;
const GAP = 16;
const AUTHORING_CANVAS = 128;
const WALL_DATUM = 112;
const CHARACTER_VISUAL_SCALE = 0.65;
const CHARACTER_FRAME_CELLS = 1.55 * CHARACTER_VISUAL_SCALE;
const NORMAL_CELL = 74;
const FAR_CELL = 40;

const PAGE = '#E7E1D2';
const PANEL = '#F6F1E6';
const PANEL_ALT = '#ECE5D7';
const GREEN_SOFT = '#DCE9DD';
const INK = '#292C2A';
const MUTED = '#626861';
const RULE = '#A39B8B';
const GREEN = '#355647';
const CORAL = '#B65F4D';
const BLUE = '#294565';
const FLOOR = '#7B8890';
const FLOOR_LINE = '#D9D4C7';
const GRASS = '#667A5D';
const WALK = '#C8C2B2';
const OCCUPANCY = '#E7DDAF';

type LiveExteriorSourceId =
  | 'car'
  | 'lot-marking-crosswalk'
  | 'lamp-post'
  | 'sign-lot'
  | 'bike-rack'
  | 'park-bench'
  | 'picnic-table'
  | 'tree-canopy';

type OutdoorSourceId = LiveExteriorSourceId | GameplayGapCandidateId;

interface OutdoorSourceDefinition {
  readonly id: OutdoorSourceId;
  readonly label: string;
  readonly kind: 'live-carrier' | 'system-candidate';
  readonly projection: 'plan' | 'elevation';
  readonly path: string;
  readonly reference:
    | { readonly type: 'outdoor'; readonly direction: ProposalDirectionId }
    | { readonly type: 'revision'; readonly revision: 'bikeRack' | 'lampPost' }
    | { readonly type: 'candidate' };
}

const WORKHORSE_ROOT = 'assets/props/quota-co-workhorse-v1';
const CANDIDATE_ROOT = 'assets/props/quota-co-gameplay-candidates-v1';

export const OUTDOOR_SVG_SOURCE_DEFINITIONS:
readonly OutdoorSourceDefinition[] = [
  {
    id: 'car',
    label: 'Campus fleet car',
    kind: 'live-carrier',
    projection: 'plan',
    path: `${WORKHORSE_ROOT}/car.svg`,
    reference: { type: 'outdoor', direction: 'lived-campus' },
  },
  {
    id: 'lot-marking-crosswalk',
    label: 'Crosswalk',
    kind: 'live-carrier',
    projection: 'plan',
    path: `${WORKHORSE_ROOT}/lot-marking-crosswalk.svg`,
    reference: {
      type: 'outdoor',
      direction: 'institutional-site-kit',
    },
  },
  {
    id: 'lamp-post',
    label: 'Offset-arm street light',
    kind: 'live-carrier',
    projection: 'elevation',
    path: `${WORKHORSE_ROOT}/lamp-post.svg`,
    reference: { type: 'revision', revision: 'lampPost' },
  },
  {
    id: 'sign-lot',
    label: 'Parking sign',
    kind: 'live-carrier',
    projection: 'elevation',
    path: `${WORKHORSE_ROOT}/sign-lot.svg`,
    reference: { type: 'outdoor', direction: 'lived-campus' },
  },
  {
    id: 'bike-rack',
    label: 'Low-staple bike rack',
    kind: 'live-carrier',
    projection: 'plan',
    path: `${WORKHORSE_ROOT}/bike-rack.svg`,
    reference: { type: 'revision', revision: 'bikeRack' },
  },
  {
    id: 'park-bench',
    label: 'Park bench',
    kind: 'live-carrier',
    projection: 'elevation',
    path: `${WORKHORSE_ROOT}/park-bench.svg`,
    reference: { type: 'outdoor', direction: 'lived-campus' },
  },
  {
    id: 'picnic-table',
    label: 'Picnic table',
    kind: 'live-carrier',
    projection: 'plan',
    path: `${WORKHORSE_ROOT}/picnic-table.svg`,
    reference: { type: 'outdoor', direction: 'lived-campus' },
  },
  {
    id: 'tree-canopy',
    label: 'Tree canopy',
    kind: 'live-carrier',
    projection: 'elevation',
    path: `${WORKHORSE_ROOT}/tree-canopy.svg`,
    reference: { type: 'outdoor', direction: 'lived-campus' },
  },
  ...GAMEPLAY_GAP_CANDIDATES.map(
    (candidate): OutdoorSourceDefinition => ({
      id: candidate.id,
      label: candidate.label,
      kind: 'system-candidate',
      projection: candidate.projection,
      path: `${CANDIDATE_ROOT}/${candidate.id}.svg`,
      reference: { type: 'candidate' },
    }),
  ),
];

interface LoadedOutdoorSource extends OutdoorSourceDefinition {
  readonly source: string;
  readonly referenceSource: string;
  readonly importedSource?: string;
  readonly sha256: string;
  readonly normalizedPixelDelta: number;
  readonly normalizedImportedPixelDelta?: number;
  readonly semanticGroupCount: number;
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
  size = 12,
  weight = 600,
  fill = INK,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return (
    `<text x="${x}" y="${y}" fill="${fill}" font-family="Inter, Arial, sans-serif" ` +
    `font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">` +
    `${escapeText(value)}</text>`
  );
}

function wrappedText(
  x: number,
  y: number,
  value: string,
  maxCharacters: number,
  lineHeight: number,
  size = 10,
  weight = 560,
  fill = MUTED,
): string {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxCharacters && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return (
    `<text x="${x}" y="${y}" fill="${fill}" font-family="Inter, Arial, sans-serif" ` +
    `font-size="${size}" font-weight="${weight}">` +
    lines
      .map(
        (lineText, index) =>
          `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">` +
          `${escapeText(lineText)}</tspan>`,
      )
      .join('') +
    '</text>'
  );
}

function panel(
  x: number,
  y: number,
  width: number,
  height: number,
  fill = PANEL,
  stroke = RULE,
  radius = 12,
): string {
  return (
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" ` +
    `fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>`
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

function circle(
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

function localName(name: string): string {
  const colon = name.indexOf(':');
  return (colon >= 0 ? name.slice(colon + 1) : name).toLowerCase();
}

function sourceMetadata(
  sourcePath: string,
  source: string,
  expectedId: string,
  expectedProjection: string,
): number {
  const root = parseSync(source);
  if (root.type !== 'element' || localName(root.name) !== 'svg') {
    throw new Error(`${sourcePath}: root must be svg`);
  }
  if (
    root.attributes.viewBox !== '0 0 128 128' ||
    root.attributes.width !== '128' ||
    root.attributes.height !== '128'
  ) {
    throw new Error(`${sourcePath}: authoring canvas must be exactly 128u`);
  }
  if (root.attributes['data-prop-id'] !== expectedId) {
    throw new Error(`${sourcePath}: data-prop-id drift`);
  }
  if (root.attributes['data-projection'] !== expectedProjection) {
    throw new Error(`${sourcePath}: projection drift`);
  }
  if (
    !root.children.some(
      (child) => child.type === 'element' && localName(child.name) === 'title',
    ) ||
    !root.children.some(
      (child) => child.type === 'element' && localName(child.name) === 'desc',
    )
  ) {
    throw new Error(`${sourcePath}: title and desc are required`);
  }
  let groupCount = 0;
  const ids = new Set<string>();
  const visit = (node: INode, groupId?: string): void => {
    if (node.type !== 'element') return;
    const tag = localName(node.name);
    const id = node.attributes.id;
    if (id) {
      if (ids.has(id)) throw new Error(`${sourcePath}: duplicate id ${id}`);
      ids.add(id);
    }
    if (tag === 'g') {
      if (!id) throw new Error(`${sourcePath}: every group needs an id`);
      groupCount += 1;
    }
    if (
      ['path', 'rect', 'ellipse', 'circle'].includes(tag) &&
      (!id || !groupId)
    ) {
      throw new Error(
        `${sourcePath}: every visible element needs an id and semantic group`,
      );
    }
    for (const child of node.children) {
      visit(child, tag === 'g' ? id : groupId);
    }
  };
  for (const child of root.children) visit(child);
  if (groupCount < 2) {
    throw new Error(`${sourcePath}: source needs multiple semantic groups`);
  }
  return groupCount;
}

function renderedPixels(source: string): Uint8Array {
  return new Resvg(source, {
    fitTo: { mode: 'width', value: AUTHORING_CANVAS },
    font: { loadSystemFonts: false },
  }).render().pixels;
}

function pixelDelta(left: string, right: string): number {
  const leftPixels = renderedPixels(left);
  const rightPixels = renderedPixels(right);
  let delta = 0;
  for (let index = 0; index < leftPixels.length; index += 1) {
    delta += Math.abs(leftPixels[index] - rightPixels[index]);
  }
  return delta / (leftPixels.length * 255);
}

function referenceSource(definition: OutdoorSourceDefinition): string {
  if (definition.reference.type === 'candidate') {
    return renderGameplayGapCandidateSvg(
      definition.id as GameplayGapCandidateId,
      'rated',
    );
  }
  if (definition.reference.type === 'revision') {
    return renderMobilityLightingRevisionSvg(
      RECOMMENDED_MOBILITY_LIGHTING_REVISIONS[
        definition.reference.revision
      ],
    );
  }
  return renderOutdoorProposalSvg(
    definition.reference.direction,
    definition.id,
  );
}

export async function loadAndValidateOutdoorSvgSources(
  root = process.cwd(),
): Promise<readonly LoadedOutdoorSource[]> {
  const loaded: LoadedOutdoorSource[] = [];
  for (const definition of OUTDOOR_SVG_SOURCE_DEFINITIONS) {
    const absolutePath = path.resolve(root, definition.path);
    const source = await readFile(absolutePath, 'utf8');
    const reference = referenceSource(definition);
    const semanticGroupCount = sourceMetadata(
      definition.path,
      source,
      definition.id,
      definition.projection,
    );
    const normalizedPixelDelta = pixelDelta(source, reference);
    if (normalizedPixelDelta > 0.000001) {
      throw new Error(
        `${definition.id}: source drift ${normalizedPixelDelta.toFixed(8)}`,
      );
    }
    let importedSource: string | undefined;
    let normalizedImportedPixelDelta: number | undefined;
    if (definition.kind === 'live-carrier') {
      const instance = DEFAULT_PROPS.find(
        (prop) => prop.templateId === definition.id,
      );
      if (!instance || !authoredPropArt(definition.id)) {
        throw new Error(
          `${definition.id}: live carrier is not production authored`,
        );
      }
      importedSource = composeProp(instance, DEFAULT_STYLE, AUTHORING_CANVAS);
      normalizedImportedPixelDelta = pixelDelta(source, importedSource);
      if (normalizedImportedPixelDelta >= 0.002) {
        throw new Error(
          `${definition.id}: compiled import drift ` +
            normalizedImportedPixelDelta.toFixed(8),
        );
      }
    }
    loaded.push({
      ...definition,
      source,
      referenceSource: reference,
      importedSource,
      sha256: createHash('sha256').update(source).digest('hex'),
      normalizedPixelDelta,
      normalizedImportedPixelDelta,
      semanticGroupCount,
    });
  }
  return loaded;
}

function fidelityCard(
  source: LoadedOutdoorSource,
  x: number,
  y: number,
  width: number,
): string {
  const sprite = 120;
  const referenceX = x + 58;
  const sourceX = x + width - sprite - 58;
  const wired = source.kind === 'live-carrier';
  const leftSource = wired ? source.source : source.referenceSource;
  const rightSource = wired
    ? (source.importedSource ?? source.source)
    : source.source;
  const delta = wired
    ? (source.normalizedImportedPixelDelta ?? Number.NaN)
    : source.normalizedPixelDelta;
  return [
    panel(
      x,
      y,
      width,
      220,
      source.kind === 'live-carrier' ? PANEL : GREEN_SOFT,
      source.kind === 'live-carrier' ? RULE : GREEN,
      10,
    ),
    text(x + 16, y + 27, source.label.toUpperCase(), 11.5, 830, GREEN),
    text(
      x + width - 16,
      y + 27,
      source.projection.toUpperCase(),
      8.5,
      760,
      CORAL,
      'end',
    ),
    placedSvg(leftSource, referenceX, y + 39, sprite),
    placedSvg(rightSource, sourceX, y + 39, sprite),
    text(
      referenceX + sprite / 2,
      y + 176,
      wired ? 'CANONICAL SVG' : 'ACCEPTED PIXELS',
      8,
      700,
      BLUE,
      'middle',
    ),
    text(
      sourceX + sprite / 2,
      y + 176,
      wired ? 'COMPILED OUTPUT' : 'SOURCE-ONLY SVG',
      8,
      700,
      GREEN,
      'middle',
    ),
    line(
      `M ${x + width / 2} ${y + 48} V ${y + 184}`,
      RULE,
      1,
      0.55,
      '4 4',
    ),
    text(
      x + 16,
      y + 205,
      `pixel delta ${delta.toFixed(6)} · ${source.semanticGroupCount} groups · sha ${source.sha256.slice(0, 10)}`,
      8.2,
      620,
      delta < 0.002 ? GREEN : CORAL,
    ),
  ].join('');
}

function cardBand(
  parts: string[],
  sources: readonly LoadedOutdoorSource[],
  y: number,
  titleValue: string,
  note: string,
): void {
  const width = WIDTH - MARGIN * 2;
  const columns = 4;
  const cardWidth = (width - 24 - GAP * (columns - 1)) / columns;
  const rows = Math.ceil(sources.length / columns);
  const height = 66 + rows * 220 + (rows - 1) * GAP + 18;
  parts.push(
    panel(MARGIN, y, width, height, PANEL_ALT),
    text(MARGIN + 18, y + 31, titleValue, 16, 870, GREEN),
    text(WIDTH - MARGIN - 18, y + 31, note, 9.5, 720, CORAL, 'end'),
  );
  sources.forEach((source, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    parts.push(
      fidelityCard(
        source,
        MARGIN + 12 + column * (cardWidth + GAP),
        y + 51 + row * (220 + GAP),
        cardWidth,
      ),
    );
  });
}

function drawGrid(
  x: number,
  y: number,
  columns: number,
  rows: number,
  cell: number,
  grassStart: number,
): string {
  const parts = [
    `<rect x="${x}" y="${y}" width="${columns * cell}" height="${rows * cell}" ` +
      `fill="${FLOOR}" stroke="#56616A" stroke-width="2"/>`,
    `<rect x="${x + grassStart * cell}" y="${y}" width="${(columns - grassStart) * cell}" ` +
      `height="${rows * cell}" fill="${GRASS}"/>`,
    `<rect x="${x}" y="${y + 2.35 * cell}" width="${columns * cell}" ` +
      `height="${0.65 * cell}" fill="${WALK}" opacity=".95"/>`,
  ];
  for (let column = 1; column < columns; column += 1) {
    parts.push(
      line(
        `M ${x + column * cell} ${y} V ${y + rows * cell}`,
        FLOOR_LINE,
        1,
        0.14,
      ),
    );
  }
  for (let row = 1; row < rows; row += 1) {
    parts.push(
      line(
        `M ${x} ${y + row * cell} H ${x + columns * cell}`,
        FLOOR_LINE,
        1,
        0.14,
      ),
    );
  }
  return parts.join('');
}

function facade(
  renderer: PropCalibrationRenderer,
  x: number,
  y: number,
  columns: number,
  cell: number,
): string {
  const parts = [renderer.wallTile(6, x, y, cell)];
  for (let column = 1; column < columns - 1; column += 1) {
    parts.push(renderer.wallTile(10, x + column * cell, y, cell));
  }
  parts.push(renderer.wallTile(12, x + (columns - 1) * cell, y, cell));
  return parts.join('');
}

function occupancy(
  x: number,
  y: number,
  width: number,
  height: number,
): string {
  return (
    `<rect x="${x + 3}" y="${y + 3}" width="${width - 6}" height="${height - 6}" ` +
    `rx="5" fill="${OCCUPANCY}" fill-opacity=".08" stroke="${OCCUPANCY}" ` +
    'stroke-width="1.2" stroke-dasharray="5 4"/>'
  );
}

function sourcePlacement(
  sources: ReadonlyMap<string, LoadedOutdoorSource>,
  id: OutdoorSourceId,
  footprintX: number,
  footprintY: number,
  cell: number,
): string {
  const source = sources.get(id);
  if (!source) throw new Error(`Missing loaded source ${id}`);
  const liveTemplate = PROP_TEMPLATES.find((template) => template.id === id);
  const candidate = GAMEPLAY_GAP_CANDIDATES.find(
    (entry) => entry.id === id,
  );
  const gridFootprint = liveTemplate?.gridFootprint ?? candidate?.gridFootprint;
  if (!gridFootprint) throw new Error(`Missing source footprint ${id}`);
  const footprintWidth = gridFootprint.w * cell;
  const footprintHeight = gridFootprint.h * cell;
  const spriteSize = cell * PROP_NATIVE_FRAME_CELLS;
  const x = footprintX + (footprintWidth - spriteSize) / 2;
  const wallSlot = candidate?.placement === 'wall-slot';
  const y =
    source.projection === 'plan'
      ? footprintY + (footprintHeight - spriteSize) / 2
      : wallSlot
        ? footprintY - spriteSize * 0.06
        : footprintY + footprintHeight - spriteSize * (116 / AUTHORING_CANVAS);
  return (
    occupancy(
      footprintX,
      footprintY,
      footprintWidth,
      footprintHeight,
    ) + placedSvg(source.importedSource ?? source.source, x, y, spriteSize)
  );
}

interface CharacterPlacement {
  readonly recipe: CharacterRecipe;
  readonly facing: Facing | 'west';
  readonly x: number;
  readonly y: number;
}

function characterPlacement(
  renderer: PropCalibrationRenderer,
  spec: CharacterPlacement,
  roomX: number,
  roomY: number,
  cell: number,
): string {
  const frame = cell * CHARACTER_FRAME_CELLS;
  return placedSvg(
    renderer.character(spec.recipe, spec.facing, 'neutral'),
    roomX + spec.x * cell - frame / 2,
    roomY + spec.y * cell - frame * 0.86,
    frame,
  );
}

function serviceScene(
  sources: ReadonlyMap<string, LoadedOutdoorSource>,
  renderer: PropCalibrationRenderer,
  x: number,
  y: number,
  cell: number,
): string {
  const parts = [
    drawGrid(x, y, 10, 5, cell, 8),
    facade(renderer, x, y, 10, cell),
    sourcePlacement(
      sources,
      'lot-marking-crosswalk',
      x + 4 * cell,
      y + 1.1 * cell,
      cell,
    ),
    sourcePlacement(sources, 'car', x + 0.1 * cell, y + 1.2 * cell, cell),
    sourcePlacement(
      sources,
      'hvac-condenser',
      x + 0.7 * cell,
      y + 3.65 * cell,
      cell,
    ),
    sourcePlacement(
      sources,
      'surveillance-camera',
      x + 4.1 * cell,
      y + 0.25 * cell,
      cell,
    ),
    sourcePlacement(
      sources,
      'surveillance-sensor',
      x + 5.4 * cell,
      y + 0.3 * cell,
      cell,
    ),
    sourcePlacement(
      sources,
      'sign-lot',
      x + 7 * cell,
      y + 2 * cell,
      cell,
    ),
    sourcePlacement(
      sources,
      'lamp-post',
      x + 8.6 * cell,
      y + 2 * cell,
      cell,
    ),
    characterPlacement(
      renderer,
      { recipe: DEFAULT_CAST[0], facing: 'east', x: 3.2, y: 4.35 },
      x,
      y,
      cell,
    ),
    characterPlacement(
      renderer,
      { recipe: DEFAULT_CAST[1], facing: 'west', x: 7.5, y: 4.35 },
      x,
      y,
      cell,
    ),
  ];
  return parts.join('');
}

function campusScene(
  sources: ReadonlyMap<string, LoadedOutdoorSource>,
  renderer: PropCalibrationRenderer,
  x: number,
  y: number,
  cell: number,
): string {
  const parts = [
    drawGrid(x, y, 10, 5, cell, 0),
    facade(renderer, x, y, 10, cell),
    sourcePlacement(
      sources,
      'bike-rack',
      x + 0.7 * cell,
      y + 1.35 * cell,
      cell,
    ),
    sourcePlacement(
      sources,
      'picnic-table',
      x + 0.6 * cell,
      y + 3.15 * cell,
      cell,
    ),
    sourcePlacement(
      sources,
      'park-bench',
      x + 4.4 * cell,
      y + 3.2 * cell,
      cell,
    ),
    sourcePlacement(
      sources,
      'privacy-hedge',
      x + 5.4 * cell,
      y + 3.4 * cell,
      cell,
    ),
    sourcePlacement(
      sources,
      'tree-canopy',
      x + 7 * cell,
      y + 2 * cell,
      cell,
    ),
    characterPlacement(
      renderer,
      { recipe: DEFAULT_CAST[2], facing: 'south', x: 3.9, y: 4.25 },
      x,
      y,
      cell,
    ),
    characterPlacement(
      renderer,
      { recipe: DEFAULT_CAST[3], facing: 'west', x: 6.5, y: 4.3 },
      x,
      y,
      cell,
    ),
  ];
  return parts.join('');
}

function contextBand(
  parts: string[],
  loaded: readonly LoadedOutdoorSource[],
  renderer: PropCalibrationRenderer,
  y: number,
): void {
  const sources = new Map(loaded.map((source) => [source.id, source]));
  const width = WIDTH - MARGIN * 2;
  parts.push(
    panel(MARGIN, y, width, 600, PANEL_ALT),
    text(MARGIN + 18, y + 32, 'Compiled-output literal gameplay-scale gate', 17, 870, GREEN),
    text(
      WIDTH - MARGIN - 18,
      y + 32,
      `${NORMAL_CELL}px/cell normal · ${FAR_CELL}px/cell far · accepted wall and character contracts`,
      9.5,
      720,
      CORAL,
      'end',
    ),
    text(MARGIN + 18, y + 59, 'SERVICE EDGE · NORMAL', 9.5, 800, BLUE),
    serviceScene(sources, renderer, MARGIN + 18, y + 72, NORMAL_CELL),
    text(MARGIN + 780, y + 59, 'LIVED CAMPUS · NORMAL', 9.5, 800, BLUE),
    campusScene(sources, renderer, MARGIN + 780, y + 72, NORMAL_CELL),
    text(MARGIN + 1542, y + 59, 'COMPILED LIVE + SOURCE-ONLY · FAR', 9.5, 800, BLUE),
    serviceScene(sources, renderer, MARGIN + 1542, y + 72, FAR_CELL),
    campusScene(sources, renderer, MARGIN + 1870, y + 72, FAR_CELL),
    panel(MARGIN + 2212, y + 72, 710, 418, GREEN_SOFT, 'none', 10),
    text(MARGIN + 2234, y + 105, 'Source gate result', 15, 850, GREEN),
  );
  const notes = [
    'All twelve files are genuine standalone SVG assets with semantic editor groups.',
    'Every live-carrier compile remains within the strict canonical-source raster tolerance at 128 units.',
    'The eight production-wired carriers retain literal room scale, projection, and footprint context.',
    'The four systems concepts remain absent from templates, facility registration, exports, and Unity.',
  ];
  notes.forEach((note, index) => {
    parts.push(
      circle(MARGIN + 2240, y + 150 + index * 70, 4, index < 3 ? GREEN : CORAL),
      wrappedText(
        MARGIN + 2255,
        y + 154 + index * 70,
        note,
        88,
        16,
        10.5,
        620,
        index < 3 ? INK : MUTED,
      ),
    );
  });
  parts.push(
    text(
      MARGIN + 18,
      y + 571,
      'Dashed = held or proposed occupancy · character art/roots and ×0.65 visual scale unchanged',
      9.5,
      650,
      BLUE,
    ),
    text(
      WIDTH - MARGIN - 18,
      y + 571,
      '53-source importer current · no export/Unity change · no commit',
      9.5,
      720,
      CORAL,
      'end',
    ),
  );
}

function sheet(
  loaded: readonly LoadedOutdoorSource[],
  renderer: PropCalibrationRenderer,
): string {
  const live = loaded.filter((source) => source.kind === 'live-carrier');
  const candidates = loaded.filter(
    (source) => source.kind === 'system-candidate',
  );
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" ` +
      `viewBox="0 0 ${WIDTH} ${HEIGHT}">`,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAGE}"/>`,
    text(
      MARGIN,
      43,
      'QuotaCo exterior family · genuine SVG + compiled-import fidelity gate',
      25,
      900,
      INK,
    ),
    text(
      MARGIN,
      70,
      'PRODUCTION SOURCE VALIDATION · eight existing carriers compiled from canonical editable files',
      11.5,
      780,
      CORAL,
    ),
    text(
      WIDTH - MARGIN,
      43,
      '53 production sources total · 4 system concepts remain source-only',
      10,
      740,
      GREEN,
      'end',
    ),
    text(
      WIDTH - MARGIN,
      70,
      `${AUTHORING_CANVAS}u authoring · ${WALL_DATUM}u wall · character ×${CHARACTER_VISUAL_SCALE} · schema ${CURRENT_SCHEMA_VERSION}`,
      9.5,
      620,
      MUTED,
      'end',
    ),
  ];
  cardBand(
    parts,
    live,
    90,
    'Existing exterior carriers · accepted reference versus canonical SVG',
    'production wired · source hash and compiled pixels validated',
  );
  cardBand(
    parts,
    candidates,
    646,
    'Gameplay-system concepts · accepted rated state versus source-only SVG',
    'not live ids · no facility or behavior registration',
  );
  contextBand(parts, loaded, renderer, 966);
  parts.push(
    panel(MARGIN, 1582, WIDTH - MARGIN * 2, 425, '#DAD4C6', 'none', 10),
    text(MARGIN + 20, 1617, 'Wiring boundary complete', 17, 870, GREEN),
    text(
      MARGIN + 20,
      1650,
      'The eight existing carriers now compile through the authored-prop importer with their source pixels, parameters, and contracts intact.',
      11.5,
      690,
      INK,
    ),
    text(
      MARGIN + 20,
      1682,
      'Candidate IDs, state sources, gameplay receivers, facility catalog entries, bundle export/import, Unity integration, and committing remain separate decisions.',
      10.5,
      670,
      CORAL,
    ),
    text(MARGIN + 20, 1732, 'Held throughout extraction', 11, 840, BLUE),
    wrappedText(
      MARGIN + 20,
      1764,
      'existing template IDs, parameters, grid footprints, pivots, navigation, collision, interaction anchors, schema, export contract, character roots, character scale, and wall datum',
      185,
      18,
      10,
      620,
      MUTED,
    ),
    text(
      MARGIN + 20,
      1974,
      'Production source wiring complete · no export/import · no Unity change · no commit',
      10,
      740,
      MUTED,
    ),
    '</svg>',
  );
  return parts.join('');
}

function metrics(loaded: readonly LoadedOutdoorSource[]): object {
  return {
    status: 'production-source-and-importer-validated',
    authoringCanvas: AUTHORING_CANVAS,
    wallDatum: WALL_DATUM,
    characterVisualScale: CHARACTER_VISUAL_SCALE,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    liveCarrierSourceCount: loaded.filter(
      ({ kind }) => kind === 'live-carrier',
    ).length,
    systemCandidateSourceCount: loaded.filter(
      ({ kind }) => kind === 'system-candidate',
    ).length,
    maximumNormalizedPixelDelta: Math.max(
      ...loaded.map(({ normalizedPixelDelta }) => normalizedPixelDelta),
    ),
    maximumImportedPixelDelta: Math.max(
      ...loaded
        .filter(({ kind }) => kind === 'live-carrier')
        .map(
          ({ normalizedImportedPixelDelta }) =>
            normalizedImportedPixelDelta ?? Number.POSITIVE_INFINITY,
        ),
    ),
    sources: loaded.map(
      ({
        id,
        kind,
        projection,
        path: sourcePath,
        sha256,
        normalizedPixelDelta,
        normalizedImportedPixelDelta,
        semanticGroupCount,
      }) => ({
        id,
        kind,
        projection,
        path: sourcePath,
        sha256,
        normalizedPixelDelta,
        normalizedImportedPixelDelta,
        semanticGroupCount,
      }),
    ),
    productionMutations: {
      importerManifest: true,
      generatedShapeSpecs: true,
      propTemplates: 'appearance-builders-only',
      facilityCatalog: false,
      exporter: false,
      schema: false,
      unityRegistration: false,
      commit: false,
    },
  };
}

function notes(loaded: readonly LoadedOutdoorSource[]): string {
  return [
    '# QuotaCo exterior SVG source-fidelity gate',
    '',
    'Status: the eight existing carriers are production-wired from canonical SVGs; the four gameplay-system concepts remain source-only.',
    '',
    `- Genuine editable SVG files: ${loaded.length}`,
    `- Existing live carriers: ${loaded.filter(({ kind }) => kind === 'live-carrier').length}`,
    `- Source-only system concepts: ${loaded.filter(({ kind }) => kind === 'system-candidate').length}`,
    `- Maximum normalized pixel delta from accepted proof: ${Math.max(...loaded.map(({ normalizedPixelDelta }) => normalizedPixelDelta)).toFixed(6)}`,
    `- Maximum canonical-source to compiled-output delta: ${Math.max(...loaded.filter(({ kind }) => kind === 'live-carrier').map(({ normalizedImportedPixelDelta }) => normalizedImportedPixelDelta ?? Number.POSITIVE_INFINITY)).toFixed(6)}`,
    '',
    'Importer wiring is complete for the eight existing carriers only. This does not authorize new gameplay-system IDs, state art promotion, facility registration, bundle export/import, Unity integration, or a commit.',
  ].join('\n');
}

export async function renderQuotaCoOutdoorSvgSourceFidelity(
  output: string,
): Promise<{
  readonly svgPath: string;
  readonly pngPath: string;
  readonly metricsPath: string;
  readonly notesPath: string;
}> {
  const loaded = await loadAndValidateOutdoorSvgSources();
  const renderer = new PropCalibrationRenderer(new Map());
  const source = sheet(loaded, renderer);
  const png = new Resvg(source, {
    font: { loadSystemFonts: true },
  })
    .render()
    .asPng();
  await mkdir(output, { recursive: true });
  const base = 'quota-co-outdoor-svg-source-fidelity-v2';
  const svgPath = path.join(output, `${base}.svg`);
  const pngPath = path.join(output, `${base}.png`);
  const metricsPath = path.join(output, `${base}-metrics.json`);
  const notesPath = path.join(output, `${base}.md`);
  await writeFile(svgPath, source, 'utf8');
  await writeFile(pngPath, png);
  await writeFile(
    metricsPath,
    `${JSON.stringify(metrics(loaded), null, 2)}\n`,
    'utf8',
  );
  await writeFile(notesPath, `${notes(loaded)}\n`, 'utf8');
  return { svgPath, pngPath, metricsPath, notesPath };
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
  const result = await renderQuotaCoOutdoorSvgSourceFidelity(options.output);
  process.stdout.write(
    'Wrote QuotaCo exterior SVG source-fidelity gate:\n' +
      `${result.svgPath}\n` +
      `${result.pngPath}\n` +
      `${result.metricsPath}\n` +
      `${result.notesPath}\n`,
  );
}

if (
  process.argv[1]?.endsWith('quotaCoOutdoorSvgSourceFidelityPreview.ts')
) {
  main().catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
