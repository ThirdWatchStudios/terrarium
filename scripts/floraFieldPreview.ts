/**
 * Focused wild-field flora approval sheet.
 *
 *   npm run flora:preview
 *   npm run flora:preview -- --out /tmp/terrarium-flora-proof
 *
 * Writes one SVG, one PNG, and a small HTML wrapper. The complete sheet is
 * composed and rasterized once, serially, so broad-field art review stays
 * lightweight while still exposing repetition and overlap problems.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import { composeFloorTile, composeProp } from '../src/core/compositor';
import { projectWithLook } from '../src/core/look';
import type {
  ProjectState,
  Projection,
  PropInstance,
  StyleSheet,
  TileInstance,
} from '../src/core/types';
import { defaultProject } from '../src/data/defaults';
import { PROP_TEMPLATES } from '../src/props/templates';

const CANVAS = 128;
const WIDTH = 1600;
const MARGIN = 32;
const GAP = 26;

const COLORS = {
  page: '#E8ECE6',
  panel: '#F9FBF7',
  panelAlt: '#F0F4EE',
  ink: '#253129',
  muted: '#647168',
  line: '#CBD4CB',
  green: '#4E8A34',
  soil: '#755035',
} as const;

const FAMILY_ROWS = [
  {
    label: 'Mature trees',
    ids: ['prop-tree', 'prop-tree-b', 'prop-tree-upright', 'prop-tree-conifer'],
  },
  {
    label: 'Saplings and understory',
    ids: ['prop-tree-sapling', 'prop-tree-sapling-b'],
  },
  {
    label: 'Wild shrubs',
    ids: ['prop-bush-cluster', 'prop-bush-bramble', 'prop-bush-low'],
  },
  {
    label: 'Herbaceous patches',
    ids: ['prop-wildflower-patch', 'prop-tall-grass-clump', 'prop-bracken-patch'],
  },
] as const;

const FLORA_IDS = FAMILY_ROWS.flatMap((family) => [...family.ids]);
const GROUND_IDS = [
  'ground-grass',
  'ground-grass-b',
  'ground-grass-c',
  'ground-meadow',
  'ground-meadow-b',
] as const;

const rawProject = defaultProject();
const clinicalProject = projectWithLook({ ...defaultProject(), look: 'clinical' });

function requiredProp(project: ProjectState, id: string): PropInstance {
  const prop = project.props.find((candidate) => candidate.id === id);
  if (!prop) throw new Error(`Missing flora prop ${id}`);
  return prop;
}

function requiredGround(project: ProjectState, id: string): TileInstance {
  const ground = project.ground?.find((candidate) => candidate.id === id);
  if (!ground) throw new Error(`Missing flora ground ${id}`);
  return ground;
}

function projectionOf(project: ProjectState, id: string): Projection {
  const prop = requiredProp(project, id);
  const template = PROP_TEMPLATES.find((candidate) => candidate.id === prop.templateId);
  if (!template) throw new Error(`Missing prop template ${prop.templateId} for ${id}`);
  return template.projection;
}

// Fail early with a concise inventory error instead of silently producing an
// incomplete review sheet when a production instance was not registered.
for (const id of FLORA_IDS) requiredProp(rawProject, id);
for (const id of GROUND_IDS) requiredGround(rawProject, id);

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function svgInner(svg: string): string {
  return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

function nestedSvg(
  svg: string,
  x: number,
  y: number,
  width: number,
  height = width,
  overflow: 'hidden' | 'visible' = 'visible',
): string {
  const clip = overflow === 'hidden' ? ' clip-path="url(#flora-cell-clip)"' : '';
  return (
    `<g transform="translate(${x} ${y}) scale(${width / CANVAS} ${height / CANVAS})"${clip}>` +
    `${svgInner(svg)}</g>`
  );
}

function propSvg(
  project: ProjectState,
  id: string,
  _style: StyleSheet = project.style,
): string {
  const register = project === clinicalProject ? 'clinical' : 'raw';
  return `<svg viewBox="0 0 ${CANVAS} ${CANVAS}"><use href="#flora-${register}-${id}"/></svg>`;
}

function groundSvg(project: ProjectState, id: string): string {
  // Natural-ground palettes are deliberately invariant under the clinical
  // register, so one shared symbol covers both project views.
  requiredGround(project, id);
  return `<svg viewBox="0 0 ${CANVAS} ${CANVAS}"><use href="#flora-ground-${id}"/></svg>`;
}

function symbolDefinitions(): string {
  const symbols: string[] = [
    `<clipPath id="flora-cell-clip"><rect width="${CANVAS}" height="${CANVAS}"/></clipPath>`,
  ];
  for (const id of FLORA_IDS) {
    for (const [register, project] of [
      ['raw', rawProject],
      ['clinical', clinicalProject],
    ] as const) {
      const composed = composeProp(requiredProp(project, id), project.style, CANVAS);
      symbols.push(
        `<g id="flora-${register}-${id}">${svgInner(composed)}</g>`,
      );
    }
  }
  for (const id of GROUND_IDS) {
    const composed = composeFloorTile(requiredGround(rawProject, id), rawProject.style, CANVAS);
    symbols.push(
      `<g id="flora-ground-${id}">${svgInner(composed)}</g>`,
    );
  }
  return `<defs>${symbols.join('')}</defs>`;
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
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${escapeXml(value)}</text>`;
}

function panel(parts: string[], x: number, y: number, width: number, height: number): void {
  parts.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="12" fill="${COLORS.panel}" stroke="${COLORS.line}"/>`);
}

function subhead(parts: string[], y: number, title: string, detail: string): void {
  parts.push(text(MARGIN + 20, y + 34, title, 22, 720));
  parts.push(text(MARGIN + 20, y + 58, detail, 13, 400, COLORS.muted));
}

function card(parts: string[], x: number, y: number, width: number, height: number): void {
  parts.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="#FFFFFF" stroke="${COLORS.line}"/>`);
}

function familySection(parts: string[], y: number): number {
  const height = 930;
  panel(parts, MARGIN, y, WIDTH - MARGIN * 2, height);
  subhead(
    parts,
    y,
    'Wild-field silhouette kit — complete production inventory',
    'Each source instance at literal 128, 64, and 32 px. The smallest read is the acceptance target; the large read exposes contour and internal rhythm.',
  );

  const rowTop = y + 88;
  const labelW = 190;
  const cardW = 318;
  const cardH = 194;
  const cardGap = 14;
  let rowY = rowTop;

  for (const family of FAMILY_ROWS) {
    parts.push(text(MARGIN + 30, rowY + 42, family.label, 16, 700));
    parts.push(text(MARGIN + 30, rowY + 64, `${family.ids.length} silhouettes`, 12, 500, COLORS.muted));

    family.ids.forEach((id, index) => {
      const x = MARGIN + labelW + index * (cardW + cardGap);
      const prop = requiredProp(rawProject, id);
      card(parts, x, rowY, cardW, cardH);
      parts.push(text(x + 12, rowY + 22, prop.name, 14, 700));
      parts.push(text(x + 12, rowY + 40, id, 10, 500, COLORS.muted));

      const projection = projectionOf(rawProject, id);
      const groundY = rowY + 166;
      const centerY = rowY + 114;
      const samples = [
        { x: x + 8, size: 128 },
        { x: x + 160, size: 64 },
        { x: x + 258, size: 32 },
      ] as const;
      if (projection === 'elevation') {
        parts.push(`<path d="M ${x + 8} ${groundY} H ${x + cardW - 8}" stroke="#ABB7AD" stroke-width="1" stroke-dasharray="3 4"/>`);
      }
      for (const sample of samples) {
        const spriteY = projection === 'elevation'
          ? groundY - sample.size * (116 / CANVAS)
          : centerY - sample.size / 2;
        parts.push(nestedSvg(propSvg(rawProject, id), sample.x, spriteY, sample.size));
        if (projection === 'elevation') {
          parts.push(`<circle cx="${sample.x + sample.size / 2}" cy="${groundY}" r="1.8" fill="#62756A"/>`);
        }
      }
      parts.push(text(x + 72, rowY + 183, '128', 11, 650, COLORS.muted, 'middle'));
      parts.push(text(x + 192, rowY + 183, '64', 11, 650, COLORS.muted, 'middle'));
      parts.push(text(x + 274, rowY + 183, '32', 11, 650, COLORS.muted, 'middle'));
    });

    rowY += cardH + 17;
  }

  return y + height + GAP;
}

function tilePatch(
  parts: string[],
  project: ProjectState,
  ids: readonly string[],
  x: number,
  y: number,
  cols: number,
  rows: number,
  cell: number,
  sequence: (row: number, col: number) => number,
): void {
  parts.push(`<rect x="${x}" y="${y}" width="${cols * cell}" height="${rows * cell}" fill="#4B8737"/>`);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const id = ids[sequence(row, col) % ids.length];
      parts.push(nestedSvg(groundSvg(project, id), x + col * cell, y + row * cell, cell, cell, 'hidden'));
    }
  }
}

function groundSection(parts: string[], y: number): number {
  const height = 676;
  panel(parts, MARGIN, y, WIDTH - MARGIN * 2, height);
  subhead(
    parts,
    y,
    'Ground variation — repetition versus a curated field mix',
    'Same-instance runs reveal macro cadence; mixed tiles prove that authored variants can break it without changing the ground contract.',
  );

  const sampleY = y + 88;
  const sampleW = 276;
  const sampleH = 176;
  const sampleCell = 46;
  GROUND_IDS.forEach((id, index) => {
    const x = MARGIN + 20 + index * (sampleW + 24);
    const ground = requiredGround(rawProject, id);
    card(parts, x, sampleY, sampleW, sampleH);
    parts.push(text(x + 10, sampleY + 20, ground.name, 13, 700));
    parts.push(text(x + 10, sampleY + 37, id, 9, 500, COLORS.muted));
    tilePatch(parts, rawProject, [id], x, sampleY + 46, 6, 2, sampleCell, () => 0);
    parts.push(text(x + sampleW / 2, sampleY + 160, '12 identical tiles', 10, 600, COLORS.muted, 'middle'));
  });

  const mosaicY = sampleY + sampleH + 46;
  const cell = 48;
  const cols = 14;
  const rows = 6;
  const patchW = cols * cell;
  const leftX = MARGIN + 20;
  const rightX = WIDTH - MARGIN - 20 - patchW;
  parts.push(text(leftX, mosaicY - 12, 'Single grass instance', 15, 700));
  parts.push(text(rightX, mosaicY - 12, 'Curated grass and meadow mix', 15, 700));
  tilePatch(parts, rawProject, ['ground-grass'], leftX, mosaicY, cols, rows, cell, () => 0);
  tilePatch(
    parts,
    rawProject,
    GROUND_IDS,
    rightX,
    mosaicY,
    cols,
    rows,
    cell,
    (row, col) => {
      // Deterministic low-frequency patches, not checkerboard noise.
      if ((row === 1 || row === 2) && col >= 8 && col <= 10) return 3;
      if ((row === 4 || row === 5) && col >= 2 && col <= 4) return 4;
      return (Math.floor(col / 3) + Math.floor(row / 2) * 2) % 3;
    },
  );
  parts.push(text(leftX + patchW / 2, mosaicY + rows * cell + 20, 'the same mottle cadence repeats', 11, 600, COLORS.muted, 'middle'));
  parts.push(text(rightX + patchW / 2, mosaicY + rows * cell + 20, 'broad patches preserve a natural field read', 11, 600, COLORS.muted, 'middle'));

  return y + height + GAP;
}

interface Placement {
  id: string;
  x: number;
  y: number;
  size?: number;
}

function placedProp(
  project: ProjectState,
  placement: Placement,
): string {
  const size = placement.size ?? 82;
  const projection = projectionOf(project, placement.id);
  const top = projection === 'elevation'
    ? placement.y - size * (116 / CANVAS)
    : placement.y - size / 2;
  return nestedSvg(
    propSvg(project, placement.id),
    placement.x - size / 2,
    top,
    size,
  );
}

const FIELD_PLACEMENTS: readonly Placement[] = [
  { id: 'prop-tree-upright', x: 120, y: 126, size: 92 },
  { id: 'prop-tree', x: 310, y: 140, size: 112 },
  { id: 'prop-tree-conifer', x: 515, y: 126, size: 98 },
  { id: 'prop-tree-b', x: 810, y: 145, size: 116 },
  { id: 'prop-tree-upright', x: 1125, y: 130, size: 92 },
  { id: 'prop-tree-sapling', x: 175, y: 218, size: 72 },
  { id: 'prop-bush-bramble', x: 420, y: 236, size: 86 },
  { id: 'prop-tree-sapling-b', x: 675, y: 216, size: 74 },
  { id: 'prop-bush-cluster', x: 960, y: 236, size: 86 },
  { id: 'prop-bush-low', x: 1240, y: 224, size: 84 },
  { id: 'prop-bracken-patch', x: 92, y: 334, size: 70 },
  { id: 'prop-wildflower-patch', x: 275, y: 344, size: 76 },
  { id: 'prop-tall-grass-clump', x: 545, y: 336, size: 72 },
  { id: 'prop-bush-low', x: 780, y: 342, size: 84 },
  { id: 'prop-wildflower-patch', x: 1035, y: 344, size: 76 },
  { id: 'prop-bracken-patch', x: 1280, y: 338, size: 70 },
];

function fieldScene(
  parts: string[],
  project: ProjectState,
  x: number,
  y: number,
  width: number,
  height: number,
  placements: readonly Placement[] = FIELD_PLACEMENTS,
): void {
  const cell = 64;
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  parts.push(`<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" overflow="hidden">`);
  const scene: string[] = [];
  tilePatch(
    scene,
    project,
    GROUND_IDS,
    0,
    0,
    cols,
    rows,
    cell,
    (row, col) => {
      if (row >= 2 && row <= 3 && col >= 4 && col <= 6) return 3;
      if (row >= 4 && col >= 13 && col <= 15) return 4;
      return (Math.floor(col / 4) + Math.floor(row / 2) * 2) % 3;
    },
  );
  const ordered = [...placements].sort((a, b) => {
    const aElevation = projectionOf(project, a.id) === 'elevation' ? 1 : 0;
    const bElevation = projectionOf(project, b.id) === 'elevation' ? 1 : 0;
    return aElevation - bElevation || a.y - b.y || a.x - b.x;
  });
  for (const placement of ordered) {
    scene.push(placedProp(project, placement));
  }
  parts.push(scene.join(''), '</svg>');
}

function fieldSection(parts: string[], y: number): number {
  const height = 568;
  panel(parts, MARGIN, y, WIDTH - MARGIN * 2, height);
  subhead(
    parts,
    y,
    'Unmanaged empty-field composition',
    'One bounded world-like read: mature canopy, understory, shrub masses, and small vegetation stay distinct without looking deliberately planted.',
  );
  const x = MARGIN + 20;
  const sceneY = y + 86;
  const width = WIDTH - MARGIN * 2 - 40;
  const heightScene = 432;
  card(parts, x - 1, sceneY - 1, width + 2, heightScene + 2);
  fieldScene(parts, rawProject, x, sceneY, width, heightScene);
  parts.push(`<rect x="${x + 14}" y="${sceneY + 14}" width="252" height="30" rx="15" fill="#18301FBB"/>`);
  parts.push(text(x + 140, sceneY + 34, 'wild spacing · no garden geometry', 11, 700, '#F4F7F1', 'middle'));
  return y + height + GAP;
}

function overlapSection(parts: string[], y: number): number {
  const height = 382;
  panel(parts, MARGIN, y, WIDTH - MARGIN * 2, height);
  subhead(
    parts,
    y,
    'Ordered-placement stress test',
    'Deliberate heavy overlap. Plan-projected low growth paints below the elevation layer; tree and sapling bases then sort by world Y like characters and cabinets.',
  );

  const x = MARGIN + 20;
  const sceneY = y + 88;
  const width = WIDTH - MARGIN * 2 - 40;
  const heightScene = 244;
  const placements: Placement[] = [
    { id: 'prop-bush-bramble', x: 915, y: 169, size: 105 },
    { id: 'prop-bush-cluster', x: 1010, y: 180, size: 105 },
    { id: 'prop-bush-low', x: 1105, y: 190, size: 105 },
    { id: 'prop-bracken-patch', x: 1180, y: 203, size: 80 },
    { id: 'prop-tall-grass-clump', x: 1245, y: 212, size: 78 },
    { id: 'prop-wildflower-patch', x: 1310, y: 219, size: 78 },
    { id: 'prop-tree-upright', x: 350, y: 142, size: 128 },
    { id: 'prop-tree-conifer', x: 468, y: 154, size: 128 },
    { id: 'prop-tree', x: 585, y: 170, size: 142 },
    { id: 'prop-tree-b', x: 720, y: 184, size: 142 },
    { id: 'prop-tree-sapling-b', x: 840, y: 198, size: 92 },
  ];
  card(parts, x - 1, sceneY - 1, width + 2, heightScene + 2);
  fieldScene(parts, rawProject, x, sceneY, width, heightScene, placements);
  parts.push(text(x + 18, sceneY + 28, 'rear', 12, 700, '#F7FAF5'));
  parts.push(text(x + width - 18, sceneY + heightScene - 16, 'foreground', 12, 700, '#F7FAF5', 'end'));
  return y + height + GAP;
}

function clinicalSection(parts: string[], y: number): number {
  const height = 456;
  panel(parts, MARGIN, y, WIDTH - MARGIN * 2, height);
  subhead(
    parts,
    y,
    'Raw versus clinical-plan register',
    'Nature keeps its saturated palette in both looks. Clinical mode only quiets shadow and outline treatment, preserving the living field against drained construction.',
  );

  const sceneY = y + 92;
  const cardW = 730;
  const sceneH = 310;
  const leftX = MARGIN + 20;
  const rightX = WIDTH - MARGIN - 20 - cardW;
  const compact = FIELD_PLACEMENTS.map((placement) => ({
    ...placement,
    x: placement.x * 0.52 + 15,
    y: placement.y * 0.64 + 12,
    size: (placement.size ?? 82) * 0.72,
  }));
  parts.push(text(leftX, sceneY - 12, 'Raw', 15, 700));
  parts.push(text(rightX, sceneY - 12, 'Clinical plan', 15, 700));
  card(parts, leftX - 1, sceneY - 1, cardW + 2, sceneH + 2);
  card(parts, rightX - 1, sceneY - 1, cardW + 2, sceneH + 2);
  fieldScene(parts, rawProject, leftX, sceneY, cardW, sceneH, compact);
  fieldScene(parts, clinicalProject, rightX, sceneY, cardW, sceneH, compact);
  return y + height + MARGIN;
}

function sheet(): string {
  const parts: string[] = [symbolDefinitions()];
  let y = 0;
  parts.push(`<rect width="${WIDTH}" height="1" fill="${COLORS.page}" data-page-background="true"/>`);
  parts.push(text(MARGIN, 40, 'Wild-field flora — production art review', 30, 760));
  parts.push(text(MARGIN, 68, 'Twelve silhouettes across four families · five ground variants · compositor output at literal game scales', 14, 400, COLORS.muted));
  parts.push(`<rect x="${WIDTH - 252}" y="24" width="220" height="34" rx="17" fill="#DCEFD7"/>`);
  parts.push(`<circle cx="${WIDTH - 228}" cy="41" r="6" fill="${COLORS.green}"/>`);
  parts.push(text(WIDTH - 212, 46, 'focused serial proof', 13, 700, '#356B36'));

  y = 94;
  y = familySection(parts, y);
  y = groundSection(parts, y);
  y = fieldSection(parts, y);
  y = overlapSection(parts, y);
  y = clinicalSection(parts, y);

  const height = Math.ceil(y);
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
const svgPath = join(directory, 'flora-field-review.svg');
const pngPath = join(directory, 'flora-field-review.png');
const htmlPath = join(directory, 'flora-field-review.html');

writeFileSync(svgPath, source);
writeFileSync(pngPath, new Resvg(source).render().asPng());
writeFileSync(
  htmlPath,
  '<!doctype html><meta charset="utf-8"><title>Wild-field flora production art review</title>' +
    '<style>html{background:#222}body{margin:0;text-align:center}img{max-width:100%;height:auto}</style>' +
    '<img src="flora-field-review.svg" alt="Wild-field flora silhouettes, ground variation, field composition, overlap, and clinical-register review">',
);

process.stdout.write(`Wrote ${svgPath}\nWrote ${pngPath}\nWrote ${htmlPath}\n`);
