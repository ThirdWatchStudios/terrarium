/**
 * Review-only authority and literal-scale gate for the first canonical UI slice.
 *
 * This command writes only docs/previews evidence. It does not create canonical
 * sources, alter the live icon definitions, change export, or touch Unity.
 *
 *   npm run ui-foundation:context:preview
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

import { Resvg } from '@resvg/resvg-js';

import { composeIcon } from '../src/core/compositor';
import { ICONS, CURSORS, getIcon } from '../src/parts/icons';
import { EMOTION_ICONS } from '../src/parts/emotions';
import { REACTION_ICONS } from '../src/parts/reactions';
import { STATE_ICONS } from '../src/parts/stateIcons';

const OUTPUT = 'docs/previews/canonical-ui-foundation-context-v1';
const ICON_IDS = [
  'ui-gear',
  'ui-close',
  'ui-play',
  'ui-pause',
  'ui-save',
  'ui-divider',
  'ui-corner',
  'ui-spinner',
] as const;
const CURSOR_IDS = [
  'cursor-default',
  'cursor-grab',
  'cursor-place',
  'cursor-invalid',
] as const;
const SELECTED_IDS = [...ICON_IDS, ...CURSOR_IDS] as const;

const PAGE = '#E7E1D2';
const PANEL = '#F6F1E6';
const PANEL_ALT = '#ECE5D7';
const INK = '#292C2A';
const MUTED = '#626861';
const RULE = '#A39B8B';
const GREEN = '#355247';
const CORAL = '#B65F4D';
const BLUE = '#294565';
const PURPLE = '#6C5A8D';
const LIGHT_SURFACE = '#F2EEE4';
const DARK_SURFACE = '#29343B';
const LIGHT_TINT = '#294565';
const DARK_TINT = '#E9E2D3';

const escapeText = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

function text(
  x: number,
  y: number,
  value: string,
  size = 16,
  weight = 600,
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
): string {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="14" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
}

function svgBody(svg: string): string {
  return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

function placedIcon(
  id: string,
  x: number,
  y: number,
  size: number,
  background: string,
  tint: string,
  fitScale = 1,
  opacity = 1,
): string {
  const icon = getIcon(id);
  if (!icon) throw new Error(`Missing icon ${id}`);
  const current = composeIcon(id, 128);
  const colored = icon.mode === 'tintable'
    ? current.replaceAll('#FFFFFF', tint)
    : current;
  const body = svgBody(colored);
  const inset = Math.max(2, size * 0.08);
  return [
    `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${Math.max(3, size * 0.1)}" fill="${background}" stroke="#00000022"/>`,
    `<svg x="${x + inset}" y="${y + inset}" width="${size - inset * 2}" height="${size - inset * 2}" viewBox="0 0 128 128" opacity="${opacity}">`,
    fitScale === 1
      ? body
      : `<g transform="translate(64 64) scale(${fitScale}) translate(-64 -64)">${body}</g>`,
    '</svg>',
  ].join('');
}

function labelFor(id: string): string {
  return getIcon(id)?.label ?? id;
}

function selectedStrip(
  x: number,
  y: number,
  width: number,
  ids: readonly string[],
  fitScale: number,
  cursorOpacity = 1,
): string {
  const gap = 10;
  const slot = width / ids.length;
  const cell = Math.min(140, slot - gap);
  return ids.map((id, index) => {
    const cellX = x + index * slot + (slot - cell) / 2;
    return [
      placedIcon(
        id,
        cellX,
        y,
        cell,
        LIGHT_SURFACE,
        LIGHT_TINT,
        fitScale,
        id.startsWith('cursor-') ? cursorOpacity : 1,
      ),
      text(cellX + cell / 2, y + cell + 17, id.replace(/^(ui-|cursor-)/, ''), 8, 650, MUTED, 'middle'),
    ].join('');
  }).join('');
}

function directionSheet(): string {
  const width = 3000;
  const height = 1500;
  const margin = 36;
  const parts = [
    `<rect width="${width}" height="${height}" fill="${PAGE}"/>`,
    text(margin, 54, 'CANONICAL UI FOUNDATION · OWNERSHIP + DIRECTION GATE', 28, 860, GREEN),
    text(margin, 84, 'REVIEW ONLY · LIVE ICON BUILDERS, EXPORTS, AND CATALOGS UNCHANGED', 12, 800, CORAL),
    panel(margin, 116, width - margin * 2, 250, PANEL_ALT),
    text(margin + 22, 150, 'CURRENT AUTHORITY', 13, 800, GREEN),
    text(margin + 22, 183, '142 live icons + 4 cursors', 24, 850, INK),
    text(margin + 22, 212, 'All 146 visible shapes are owned by TypeScript ShapeSpec builders.', 13, 620, MUTED),
    text(margin + 22, 239, 'Terrarium exports 142 SVG receiver files, but there are 0 checked-in canonical UI/cursor SVG sources.', 13, 620, MUTED),
    text(margin + 22, 283, 'FIRST BOUNDED FAMILY', 11, 800, BLUE),
    text(margin + 22, 309, '8 foundational controls/trim glyphs + 4 cursors · stable ids, modes, crops, PNG ladders, and cursor hotspots held', 13, 650, INK),
    text(width - margin - 22, 158, 'FALSE-CANONICAL RISK', 11, 800, CORAL, 'end'),
    text(width - margin - 22, 190, 'Exported SVG ≠ source SVG', 18, 820, CORAL, 'end'),
    text(width - margin - 22, 221, 'Editing icons/<id>.svg after export cannot change the next Terrarium export.', 12, 620, MUTED, 'end'),
  ];

  const directions = [
    {
      key: 'A',
      title: 'EXACT AUTHORITY INVERSION · RECOMMENDED',
      note: 'Extract the accepted current pixels into editor-safe SVGs. Preserve crop, stroke weight, tint/literal mode, and hotspots exactly.',
      scale: 1,
      cursorOpacity: 1,
      color: GREEN,
    },
    {
      key: 'B',
      title: 'TIGHT-CROP NORMALIZATION',
      note: 'Enlarge the existing glyph register before extraction. Improves small-size occupancy but changes approved pixels and raises clipping risk.',
      scale: 1.14,
      cursorOpacity: 1,
      color: PURPLE,
    },
    {
      key: 'C',
      title: 'SPLIT CONTROLS FROM CURSORS',
      note: 'Canonicalize only the eight SVG-exported glyphs now. Keep the four cursor shapes code-owned for a later PNG/hotspot-specific gate.',
      scale: 1,
      cursorOpacity: 0.18,
      color: BLUE,
    },
  ] as const;

  directions.forEach((direction, index) => {
    const y = 398 + index * 326;
    parts.push(
      panel(margin, y, width - margin * 2, 294, index % 2 === 0 ? PANEL : PANEL_ALT),
      text(margin + 22, y + 38, `DIRECTION ${direction.key}`, 11, 820, direction.color),
      text(margin + 22, y + 70, direction.title, 17, 830, INK),
      text(margin + 22, y + 98, direction.note, 11.5, 580, MUTED),
      selectedStrip(
        margin + 22,
        y + 128,
        width - margin * 2 - 44,
        SELECTED_IDS,
        direction.scale,
        direction.cursorOpacity,
      ),
    );
  });

  parts.push(
    text(margin, 1414, 'Approval boundary', 11, 800, CORAL),
    text(margin, 1440, 'Choose a direction before any candidate SVG is extracted. This sheet does not alter production, export, Unity, or the checkpoint.', 12, 620, MUTED),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function scaleCard(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  index: number,
): string {
  const icon = getIcon(id);
  if (!icon) throw new Error(`Missing icon ${id}`);
  const isCursor = id.startsWith('cursor-');
  const normal = isCursor ? 32 : 24;
  const small = isCursor ? 24 : 16;
  return [
    panel(x, y, width, height, index % 2 === 0 ? PANEL : PANEL_ALT),
    text(x + 20, y + 34, id, 15, 820, GREEN),
    text(x + width - 20, y + 34, icon.mode.toUpperCase(), 9, 780, CORAL, 'end'),
    text(x + 20, y + 57, labelFor(id), 10, 580, MUTED),
    text(x + 84, y + 84, 'AUTHORING 128', 9, 760, BLUE, 'middle'),
    placedIcon(id, x + 20, y + 94, 128, LIGHT_SURFACE, LIGHT_TINT),
    text(x + 245, y + 84, `LIGHT · ${normal}px`, 9, 760, BLUE, 'middle'),
    placedIcon(id, x + 245 - normal / 2, y + 126, normal, LIGHT_SURFACE, LIGHT_TINT),
    text(x + 375, y + 84, `DARK · ${normal}px`, 9, 760, BLUE, 'middle'),
    placedIcon(id, x + 375 - normal / 2, y + 126, normal, DARK_SURFACE, DARK_TINT),
    text(x + 505, y + 84, `SMALL · ${small}px`, 9, 760, BLUE, 'middle'),
    placedIcon(id, x + 505 - small / 2, y + 130, small, LIGHT_SURFACE, LIGHT_TINT),
    text(x + 20, y + height - 34, isCursor ? 'Cursor hotspot + halo held' : 'Tintable mask + crop held', 9, 630, MUTED),
    text(x + width - 20, y + height - 34, 'DIRECTION A · EXACT CURRENT', 9, 720, GREEN, 'end'),
  ].join('');
}

function scaleSheet(): string {
  const width = 3000;
  const height = 1590;
  const margin = 36;
  const gap = 18;
  const cardWidth = (width - margin * 2 - gap * 3) / 4;
  const cardHeight = 438;
  const parts = [
    `<rect width="${width}" height="${height}" fill="${PAGE}"/>`,
    text(margin, 54, 'CANONICAL UI FOUNDATION · LITERAL SCALE STUDY', 28, 860, GREEN),
    text(margin, 84, 'DIRECTION A CURRENT PIXELS · LIGHT/DARK THEME SURFACES · NO PRODUCTION CHANGE', 12, 800, CORAL),
    text(margin, 112, 'Icons are judged at 24 px and 16 px; cursors at 32 px and 24 px. The 128 px cell shows the source geometry, not intended UI display size.', 12, 620, MUTED),
  ];
  SELECTED_IDS.forEach((id, index) => {
    const column = index % 4;
    const row = Math.floor(index / 4);
    parts.push(scaleCard(
      id,
      margin + column * (cardWidth + gap),
      140 + row * (cardHeight + gap),
      cardWidth,
      cardHeight,
      index,
    ));
  });
  parts.push(
    text(margin, 1530, 'Gate question', 11, 800, CORAL),
    text(margin, 1556, 'Do these current silhouettes, crops, and stroke weights read well enough to freeze as the first canonical UI SVG family?', 12, 620, MUTED),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

async function protectedSurfaceHashes(): Promise<Record<string, string>> {
  const files = [
    'CONTRACT.md',
    'src/parts/icons.ts',
    'src/parts/emotions.ts',
    'src/parts/stateIcons.ts',
    'src/parts/reactions.ts',
    'src/core/compositor.ts',
    'src/core/exporter.ts',
  ];
  return Object.fromEntries(await Promise.all(files.map(async (file) => {
    const content = await readFile(file);
    return [file, createHash('sha256').update(content).digest('hex')];
  })));
}

function readme(): string {
  return `# Canonical UI foundation context review v1

Status: **review only; stopped before source extraction**

Terrarium currently exports 142 icon SVG receivers and four cursor PNG families,
but all 146 live shapes are still owned by TypeScript \`ShapeSpec\` builders.
There are no checked-in canonical UI or cursor SVG sources. Editing a generated
\`icons/<id>.svg\` cannot affect a later export.

This first bounded family contains eight foundational controls/trim glyphs and
four cursors. The sheets compare three ownership directions and show Direction A
at literal UI sizes on light and dark surfaces.

## Approval boundary

Approval chooses the source-extraction direction. It does not authorize source
creation, importer/receiver wiring, catalog changes, export, Unity import, or a
commit. Production remains unchanged until the later source/import fidelity gate
is separately approved.
`;
}

async function main(): Promise<void> {
  const directIconCount = ICONS.length
    - EMOTION_ICONS.length
    - STATE_ICONS.length
    - REACTION_ICONS.length;
  const metrics = {
    status: 'review-only-stopped-before-source-extraction',
    inventory: {
      liveIcons: ICONS.length,
      liveCursors: CURSORS.length,
      directIcons: directIconCount,
      emotionIcons: EMOTION_ICONS.length,
      stateIcons: STATE_ICONS.length,
      reactionIcons: REACTION_ICONS.length,
      generatedSvgReceivers: ICONS.length,
      checkedInCanonicalUiSvgSources: 0,
      currentAuthority: 'TypeScript ShapeSpec builders',
    },
    selectedFamily: {
      ids: SELECTED_IDS,
      controlsAndTrim: ICON_IDS,
      cursors: CURSOR_IDS,
      heldContracts: [
        'stable ids and labels',
        'tintable versus literal mode',
        '128-unit design canvas',
        'tight crop and stroke weight',
        'SVG plus PNG ladder for icons',
        'PNG ladder plus normalized hotspot for cursors',
      ],
    },
    directions: {
      A: 'exact authority inversion; recommended',
      B: 'tight-crop normalization before extraction',
      C: 'controls and trim now; cursors later',
    },
    protectedSurfaceHashes: await protectedSurfaceHashes(),
    productionChanges: [],
    deferred: [
      'candidate SVG source extraction',
      'importer and production receiver wiring',
      'catalog and export validation',
      'browser export and Unity import',
      'commit',
    ],
  };
  const directions = directionSheet();
  const scale = scaleSheet();
  await mkdir(OUTPUT, { recursive: true });
  await writeFile(`${OUTPUT}/00-ownership-and-directions.svg`, directions, 'utf8');
  await writeFile(
    `${OUTPUT}/00-ownership-and-directions.png`,
    new Resvg(directions, { font: { loadSystemFonts: true } }).render().asPng(),
  );
  await writeFile(`${OUTPUT}/01-literal-scale-study.svg`, scale, 'utf8');
  await writeFile(
    `${OUTPUT}/01-literal-scale-study.png`,
    new Resvg(scale, { font: { loadSystemFonts: true } }).render().asPng(),
  );
  await writeFile(`${OUTPUT}/metrics.json`, `${JSON.stringify(metrics, null, 2)}\n`, 'utf8');
  await writeFile(`${OUTPUT}/README.md`, readme(), 'utf8');
  process.stdout.write(
    `Wrote review-only UI foundation authority gate for ${SELECTED_IDS.length} assets.\n` +
    `${OUTPUT}/00-ownership-and-directions.png\n` +
    `${OUTPUT}/01-literal-scale-study.png\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
