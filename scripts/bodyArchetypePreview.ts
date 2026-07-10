/**
 * Body-archetype trial preview — an AI-assisted silhouette review surface.
 *
 *   npx tsx scripts/bodyArchetypePreview.ts [outDir]
 *
 * Writes full-character, body-only, active-rig, and garment/pose proof sheets.
 * Trial parts render through the real compositor but remain outside PART_LIBRARY,
 * so this command cannot change production picks.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

import { composeCharacter } from '../src/core/compositor';
import type { CharacterRecipe, StyleSheet } from '../src/core/types';
import type { Pose } from '../src/parts/poses';
import { DEFAULT_STYLE } from '../src/data/defaults';
import {
  BODY_ARCHETYPE_TRIALS,
  type BodyArchetypeTrial,
  type BodyFacingGuide,
  type BodyGuidePoint,
  type BodyGuideSpan,
} from '../src/parts/bodyArchetypeTrials';

const FACINGS = ['south', 'east', 'north', 'west'] as const;
const BODY_ONLY_PART = '__body-archetype-trial-none__';
const CANVAS = 128;
const BODY_ORIGIN = { x: 64, y: 87 };

const COLORS = {
  page: '#F4F1E9',
  panel: '#FFFEFA',
  row: '#EAE6DC',
  ink: '#2F3538',
  muted: '#68747A',
  grid: '#CFC9BC',
  head: '#D94A6A',
  neck: '#2E9D67',
  shoulders: '#D98532',
  waist: '#278AA0',
  hem: '#7D62B3',
  chest: '#C79A22',
  hip: '#4169A8',
} as const;

const PALETTE = {
  skin: '#C68B59',
  hair: '#2B211D',
  outfitPrimary: '#315A78',
  outfitSecondary: '#E8E4D8',
  accent: '#D85A30',
};

const BODY_ONLY_STYLE: StyleSheet = {
  ...structuredClone(DEFAULT_STYLE),
  outline: { ...DEFAULT_STYLE.outline, width: 0 },
  render: { ...DEFAULT_STYLE.render, contactShadow: 0 },
};

interface CharacterPreviewOptions {
  bodyOnly?: boolean;
  outfit?: 'outfit-tee' | 'outfit-blazer';
  lanyard?: boolean;
  pose?: Pose;
}

function recipe(trial: BodyArchetypeTrial, options: CharacterPreviewOptions = {}): CharacterRecipe {
  const bodyOnly = options.bodyOnly ?? false;
  return {
    id: `preview-${trial.id}`,
    name: trial.label,
    parts: {
      body: trial.part.id,
      head: bodyOnly ? BODY_ONLY_PART : 'head-soft-square',
      hair: bodyOnly ? BODY_ONLY_PART : 'hair-side-part',
      outfit: bodyOnly ? BODY_ONLY_PART : (options.outfit ?? 'outfit-tee'),
      accessories: bodyOnly || !options.lanyard ? [] : ['acc-lanyard'],
    },
    palette: bodyOnly
      ? { ...PALETTE, outfitPrimary: '#171A1C' }
      : { ...PALETTE },
  };
}

function svgInner(svg: string): string {
  return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

function placedCharacter(
  trial: BodyArchetypeTrial,
  facing: (typeof FACINGS)[number],
  x: number,
  y: number,
  size: number,
  options: CharacterPreviewOptions = {},
): string {
  const style = options.bodyOnly ? BODY_ONLY_STYLE : DEFAULT_STYLE;
  const svg = composeCharacter(recipe(trial, options), style, facing, CANVAS, 'normal', {
    badge: false,
    pose: options.pose,
  });
  return `<g transform="translate(${x} ${y}) scale(${size / CANVAS})">${svgInner(svg)}</g>`;
}

function text(x: number, y: number, value: string, size = 13, weight = 400, fill: string = COLORS.ink): string {
  return `<text x="${x}" y="${y}" font-family="system-ui, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${value}</text>`;
}

function fullCharacterSheet(): string {
  const width = 1060;
  const header = 92;
  const rowHeight = 156;
  const height = header + BODY_ARCHETYPE_TRIALS.length * rowHeight;
  const labelWidth = 188;
  const fullGap = 10;
  const fullSize = 128;
  const fullStart = labelWidth;
  const smallStart = fullStart + FACINGS.length * fullSize + (FACINGS.length - 1) * fullGap + 34;
  const smallSizes = [64, 48, 32] as const;
  const parts: string[] = [];

  parts.push(`<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`);
  parts.push(text(18, 30, 'Body archetype trial — active body-owned rig', 20, 700));
  parts.push(text(18, 53, 'Crew tee, head stack, portraits, and attachments now follow each candidate body.', 12, 400, COLORS.muted));
  FACINGS.forEach((facing, i) => {
    parts.push(text(fullStart + i * (fullSize + fullGap) + 44, 78, facing, 11, 600, COLORS.muted));
  });
  parts.push(text(smallStart, 78, 'distance: 64 / 48 / 32 px', 11, 600, COLORS.muted));

  BODY_ARCHETYPE_TRIALS.forEach((trial, row) => {
    const y = header + row * rowHeight;
    const rowFill = row % 2 === 0 ? COLORS.panel : COLORS.row;
    parts.push(`<rect x="8" y="${y + 4}" width="${width - 16}" height="${rowHeight - 8}" rx="8" fill="${rowFill}"/>`);
    parts.push(text(22, y + 42, trial.label, 16, 700));
    parts.push(text(22, y + 62, trial.id === 'average' ? 'id: average' : `id: ${trial.id}`, 10, 600, COLORS.muted));
    const words = trial.intent.split(' ');
    const lines: string[] = [];
    while (words.length > 0) {
      let line = '';
      while (words.length > 0 && `${line} ${words[0]}`.trim().length <= 27) line = `${line} ${words.shift()}`.trim();
      lines.push(line);
    }
    lines.slice(0, 3).forEach((line, i) => parts.push(text(22, y + 84 + i * 15, line, 10, 400, COLORS.muted)));

    FACINGS.forEach((facing, i) => {
      const x = fullStart + i * (fullSize + fullGap);
      parts.push(`<rect x="${x}" y="${y + 14}" width="${fullSize}" height="${fullSize}" rx="5" fill="#FFFFFF" stroke="${COLORS.grid}"/>`);
      parts.push(placedCharacter(trial, facing, x, y + 14, fullSize));
    });

    let sx = smallStart;
    for (const size of smallSizes) {
      const box = 72;
      const px = sx + (box - size) / 2;
      const py = y + 38 + (72 - size) / 2;
      parts.push(`<rect x="${sx}" y="${y + 38}" width="${box}" height="72" rx="5" fill="#FFFFFF" stroke="${COLORS.grid}"/>`);
      parts.push(placedCharacter(trial, 'south', px, py, size));
      parts.push(text(sx + 26, y + 128, `${size}`, 9, 600, COLORS.muted));
      sx += 84;
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function silhouetteSheet(): string {
  const width = 760;
  const header = 86;
  const rowHeight = 138;
  const height = header + BODY_ARCHETYPE_TRIALS.length * rowHeight;
  const labelWidth = 178;
  const parts: string[] = [`<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`];
  parts.push(text(18, 28, 'Flat silhouette comparison', 19, 700));
  parts.push(text(18, 49, 'No head, outfit detail, outline, shadow, or palette variation.', 11, 400, COLORS.muted));
  FACINGS.forEach((facing, i) => {
    parts.push(text(labelWidth + i * 140 + 45, 73, facing, 11, 600, COLORS.muted));
  });

  BODY_ARCHETYPE_TRIALS.forEach((trial, row) => {
    const y = header + row * rowHeight;
    parts.push(text(20, y + 58, trial.label, 15, 700));
    FACINGS.forEach((facing, i) => {
      const x = labelWidth + i * 140;
      parts.push(`<rect x="${x}" y="${y + 5}" width="128" height="128" rx="5" fill="#FFFFFF" stroke="${COLORS.grid}"/>`);
      parts.push(`<path d="M ${x + 64} ${y + 5} V ${y + 133} M ${x} ${y + 92} H ${x + 128}" stroke="${COLORS.grid}" stroke-width="0.7" stroke-dasharray="3 4"/>`);
      parts.push(placedCharacter(trial, facing, x, y + 5, 128, { bodyOnly: true }));
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function canvasPoint(p: BodyGuidePoint): BodyGuidePoint {
  return { x: BODY_ORIGIN.x + p.x, y: BODY_ORIGIN.y + p.y };
}

function marker(p: BodyGuidePoint, color: string, radius = 2.2): string {
  const c = canvasPoint(p);
  return `<circle cx="${c.x}" cy="${c.y}" r="${radius}" fill="${color}" stroke="#FFFFFF" stroke-width="0.8"/>`;
}

function spanMarker(value: BodyGuideSpan, color: string): string {
  const left = canvasPoint(value.left);
  const right = canvasPoint(value.right);
  return (
    `<path d="M ${left.x} ${left.y} L ${right.x} ${right.y}" stroke="${color}" stroke-width="1.4" stroke-dasharray="3 2"/>` +
    marker(value.left, color) + marker(value.right, color)
  );
}

function guideOverlay(guide: BodyFacingGuide): string {
  const head = canvasPoint(guide.headCenter);
  return (
    `<circle cx="${head.x}" cy="${head.y}" r="21" fill="none" stroke="${COLORS.head}" stroke-width="1.2" opacity="0.52"/>` +
    marker(guide.headCenter, COLORS.head, 2.6) +
    marker(guide.aboveHead, COLORS.head, 1.7) +
    marker(guide.neck, COLORS.neck, 2.6) +
    spanMarker(guide.shoulders, COLORS.shoulders) +
    spanMarker(guide.waist, COLORS.waist) +
    spanMarker(guide.hem, COLORS.hem) +
    marker(guide.chest, COLORS.chest, 2.5) +
    marker(guide.hip, COLORS.hip, 2.5) +
    marker({ x: 0, y: 0 }, '#111111', 1.8)
  );
}

function anchorSheet(): string {
  const width = 690;
  const header = 92;
  const rowHeight = 184;
  const height = header + BODY_ARCHETYPE_TRIALS.length * rowHeight;
  const labelWidth = 180;
  const panelSize = 160;
  const scale = panelSize / CANVAS;
  const parts: string[] = [`<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`];

  parts.push(text(18, 28, 'Active body-owned sub-anchor rigs', 19, 700));
  parts.push(text(18, 49, 'These exact anchors now drive heads, garments, attachments, portraits, and representative poses.', 11, 400, COLORS.muted));
  const legend = [
    ['head', COLORS.head], ['neck', COLORS.neck], ['shoulders', COLORS.shoulders],
    ['waist', COLORS.waist], ['hem', COLORS.hem], ['chest', COLORS.chest], ['hip', COLORS.hip],
  ] as const;
  let lx = 18;
  for (const [name, color] of legend) {
    parts.push(`<circle cx="${lx + 4}" cy="72" r="4" fill="${color}"/>`);
    parts.push(text(lx + 12, 76, name, 10, 600, COLORS.muted));
    lx += name.length * 7 + 38;
  }

  BODY_ARCHETYPE_TRIALS.forEach((trial, row) => {
    const y = header + row * rowHeight;
    parts.push(text(20, y + 68, trial.label, 15, 700));
    (['south', 'east'] as const).forEach((facing, i) => {
      const x = labelWidth + i * 238;
      parts.push(`<rect x="${x}" y="${y + 8}" width="${panelSize}" height="${panelSize}" rx="5" fill="#FFFFFF" stroke="${COLORS.grid}"/>`);
      parts.push(text(x + 170, y + 28, facing, 11, 600, COLORS.muted));
      const body = placedCharacter(trial, facing, x, y + 8, panelSize, { bodyOnly: true });
      parts.push(body);
      parts.push(`<g transform="translate(${x} ${y + 8}) scale(${scale})">${guideOverlay(trial.guides[facing])}</g>`);
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

const RIGGED_COLUMNS: Array<{
  facing: 'south' | 'east';
  outfit: 'outfit-tee' | 'outfit-blazer';
  pose: 'neutral' | 'point' | 'slump';
  lanyard?: boolean;
}> = [
  { facing: 'south', outfit: 'outfit-tee', pose: 'neutral' },
  { facing: 'south', outfit: 'outfit-blazer', pose: 'neutral' },
  { facing: 'south', outfit: 'outfit-blazer', pose: 'point' },
  { facing: 'south', outfit: 'outfit-blazer', pose: 'slump', lanyard: true },
  { facing: 'east', outfit: 'outfit-tee', pose: 'neutral' },
  { facing: 'east', outfit: 'outfit-blazer', pose: 'neutral' },
  { facing: 'east', outfit: 'outfit-blazer', pose: 'point' },
  { facing: 'east', outfit: 'outfit-blazer', pose: 'slump', lanyard: true },
];

/** The actual vertical slice under review: body-aware garments, lanyard, and poses. */
function riggedSliceSheet(): string {
  const width = 1320;
  const header = 104;
  const rowHeight = 152;
  const height = header + BODY_ARCHETYPE_TRIALS.length * rowHeight;
  const labelWidth = 188;
  const stride = 140;
  const panel = 128;
  const parts: string[] = [`<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`];

  parts.push(text(18, 28, 'Rigged vertical slice — tee / blazer / lanyard × neutral / point / slump', 19, 700));
  parts.push(text(18, 49, 'Every cell is composed by the production renderer from the candidate body’s own anchors.', 11, 400, COLORS.muted));
  RIGGED_COLUMNS.forEach((column, i) => {
    const x = labelWidth + i * stride;
    parts.push(text(x + 16, 75, `${column.facing} · ${column.outfit === 'outfit-tee' ? 'tee' : 'blazer'}`, 10, 650, COLORS.muted));
    parts.push(text(x + (column.lanyard ? 23 : 42), 91, `${column.pose}${column.lanyard ? ' + ID' : ''}`, 10, 500, COLORS.muted));
  });

  BODY_ARCHETYPE_TRIALS.forEach((trial, row) => {
    const y = header + row * rowHeight;
    parts.push(`<rect x="8" y="${y + 3}" width="${width - 16}" height="${rowHeight - 6}" rx="8" fill="${row % 2 === 0 ? COLORS.panel : COLORS.row}"/>`);
    parts.push(text(22, y + 55, trial.label, 16, 700));
    parts.push(text(22, y + 75, 'clean garment compare', 10, 500, COLORS.muted));
    parts.push(text(22, y + 92, 'slump cells add ID', 10, 500, COLORS.muted));
    parts.push(text(22, y + 109, 'render-only candidate', 10, 500, COLORS.muted));
    RIGGED_COLUMNS.forEach((column, i) => {
      const x = labelWidth + i * stride;
      parts.push(`<rect x="${x}" y="${y + 10}" width="${panel}" height="${panel}" rx="5" fill="#FFFFFF" stroke="${COLORS.grid}"/>`);
      parts.push(placedCharacter(trial, column.facing, x, y + 10, panel, {
        outfit: column.outfit,
        lanyard: column.lanyard,
        pose: column.pose,
      }));
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function html(): string {
  const cards = BODY_ARCHETYPE_TRIALS.map(
    (trial) => `<li><strong>${trial.label}</strong> — ${trial.intent}</li>`,
  ).join('');
  return `<!doctype html>
<meta charset="utf-8">
<title>Terrarium body archetype trial</title>
<style>
  body { margin: 0; padding: 24px; background: ${COLORS.page}; color: ${COLORS.ink}; font: 14px/1.45 system-ui, sans-serif; }
  main { max-width: 1100px; margin: 0 auto; }
  h1 { margin: 0 0 8px; }
  .notice { border-left: 4px solid ${COLORS.shoulders}; padding: 10px 14px; background: #fff; }
  img { display: block; max-width: 100%; height: auto; margin: 16px 0 32px; border: 1px solid ${COLORS.grid}; }
  li { margin: 5px 0; }
</style>
<main>
  <h1>Body archetype trial</h1>
  <p class="notice"><strong>Active rig trial, still safely nonselectable.</strong> Body-owned anchors now drive the representative character slice; the candidates remain outside the production library until art review and full-catalog adaptation.</p>
  <ul>${cards}</ul>
  <h2>Garment, lanyard, and pose proof</h2>
  <img src="body-archetypes-rigged.png" alt="Five body archetypes with body-aware garments, lanyards, and poses">
  <h2>Characters through the production compositor</h2>
  <img src="body-archetypes-preview.png" alt="Five body archetypes across facings and distances">
  <h2>Flat silhouettes</h2>
  <img src="body-archetypes-silhouettes.png" alt="Body-only silhouette comparison">
  <h2>Active sub-anchor blueprint</h2>
  <img src="body-archetypes-anchors.png" alt="Body archetype anchor guides">
</main>`;
}

function writeSvgAndPng(outDir: string, base: string, svg: string, zoom = 1): void {
  writeFileSync(join(outDir, `${base}.svg`), svg);
  writeFileSync(join(outDir, `${base}.png`), new Resvg(svg, { fitTo: { mode: 'zoom', value: zoom } }).render().asPng());
}

function main(): void {
  const outDir = resolve(process.argv[2] ?? 'docs/previews');
  mkdirSync(outDir, { recursive: true });

  const full = fullCharacterSheet();
  writeSvgAndPng(outDir, 'body-archetypes-rigged', riggedSliceSheet());
  writeSvgAndPng(outDir, 'body-archetypes-preview', full);
  writeFileSync(
    join(outDir, 'body-archetypes-preview@2x.png'),
    new Resvg(full, { fitTo: { mode: 'zoom', value: 2 } }).render().asPng(),
  );
  writeSvgAndPng(outDir, 'body-archetypes-silhouettes', silhouetteSheet());
  writeSvgAndPng(outDir, 'body-archetypes-anchors', anchorSheet());
  writeFileSync(join(outDir, 'body-archetypes-preview.html'), html());

  console.log(`wrote body-archetypes-{rigged,preview,silhouettes,anchors}.{svg,png} + preview HTML to ${outDir}`);
}

main();
