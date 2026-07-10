/**
 * Production body-archetype preview and compatibility review surface.
 *
 *   npx tsx scripts/bodyArchetypePreview.ts [outDir]
 *
 * Writes full-character, body-only, active-rig, and garment/pose proof sheets
 * from the same production parts used by the picker and generators.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

import { composeCharacter } from '../src/core/compositor';
import type {
  BodyAnchorPoint,
  BodyAnchorSpan,
  BodyFacingAnchors,
  CharacterRecipe,
  StyleSheet,
} from '../src/core/types';
import { POSES, type Pose } from '../src/parts/poses';
import { DEFAULT_STYLE, DEFAULT_STYLE_PRESETS } from '../src/data/defaults';
import {
  BODY_ARCHETYPES,
  type BodyArchetype,
} from '../src/parts/bodyArchetypes';

const FACINGS = ['south', 'east', 'north', 'west'] as const;
const BODY_ONLY_PART = '__body-archetype-preview-none__';
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
  outfit?: string;
  lanyard?: boolean;
  accessories?: string[];
  pose?: Pose;
  style?: StyleSheet;
}

function recipe(archetype: BodyArchetype, options: CharacterPreviewOptions = {}): CharacterRecipe {
  const bodyOnly = options.bodyOnly ?? false;
  return {
    id: `preview-${archetype.id}`,
    name: archetype.label,
    parts: {
      body: archetype.part.id,
      head: bodyOnly ? BODY_ONLY_PART : 'head-soft-square',
      hair: bodyOnly ? BODY_ONLY_PART : 'hair-side-part',
      outfit: bodyOnly ? BODY_ONLY_PART : (options.outfit ?? 'outfit-tee'),
      accessories: bodyOnly ? [] : (options.accessories ?? (options.lanyard ? ['acc-lanyard'] : [])),
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
  archetype: BodyArchetype,
  facing: (typeof FACINGS)[number],
  x: number,
  y: number,
  size: number,
  options: CharacterPreviewOptions = {},
): string {
  const style = options.bodyOnly ? BODY_ONLY_STYLE : (options.style ?? DEFAULT_STYLE);
  const svg = composeCharacter(recipe(archetype, options), style, facing, CANVAS, 'normal', {
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
  const height = header + BODY_ARCHETYPES.length * rowHeight;
  const labelWidth = 188;
  const fullGap = 10;
  const fullSize = 128;
  const fullStart = labelWidth;
  const smallStart = fullStart + FACINGS.length * fullSize + (FACINGS.length - 1) * fullGap + 34;
  const smallSizes = [64, 48, 32] as const;
  const parts: string[] = [];

  parts.push(`<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`);
  parts.push(text(18, 30, 'Production body archetypes — active body-owned rig', 20, 700));
  parts.push(text(18, 53, 'Crew tee, head stack, portraits, and attachments follow every selectable production body.', 12, 400, COLORS.muted));
  FACINGS.forEach((facing, i) => {
    parts.push(text(fullStart + i * (fullSize + fullGap) + 44, 78, facing, 11, 600, COLORS.muted));
  });
  parts.push(text(smallStart, 78, 'distance: 64 / 48 / 32 px', 11, 600, COLORS.muted));

  BODY_ARCHETYPES.forEach((archetype, row) => {
    const y = header + row * rowHeight;
    const rowFill = row % 2 === 0 ? COLORS.panel : COLORS.row;
    parts.push(`<rect x="8" y="${y + 4}" width="${width - 16}" height="${rowHeight - 8}" rx="8" fill="${rowFill}"/>`);
    parts.push(text(22, y + 42, archetype.label, 16, 700));
    parts.push(text(22, y + 62, `id: ${archetype.id}`, 10, 600, COLORS.muted));
    const words = archetype.intent.split(' ');
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
      parts.push(placedCharacter(archetype, facing, x, y + 14, fullSize));
    });

    let sx = smallStart;
    for (const size of smallSizes) {
      const box = 72;
      const px = sx + (box - size) / 2;
      const py = y + 38 + (72 - size) / 2;
      parts.push(`<rect x="${sx}" y="${y + 38}" width="${box}" height="72" rx="5" fill="#FFFFFF" stroke="${COLORS.grid}"/>`);
      parts.push(placedCharacter(archetype, 'south', px, py, size));
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
  const height = header + BODY_ARCHETYPES.length * rowHeight;
  const labelWidth = 178;
  const parts: string[] = [`<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`];
  parts.push(text(18, 28, 'Flat silhouette comparison', 19, 700));
  parts.push(text(18, 49, 'No head, outfit detail, outline, shadow, or palette variation.', 11, 400, COLORS.muted));
  FACINGS.forEach((facing, i) => {
    parts.push(text(labelWidth + i * 140 + 45, 73, facing, 11, 600, COLORS.muted));
  });

  BODY_ARCHETYPES.forEach((archetype, row) => {
    const y = header + row * rowHeight;
    parts.push(text(20, y + 58, archetype.label, 15, 700));
    FACINGS.forEach((facing, i) => {
      const x = labelWidth + i * 140;
      parts.push(`<rect x="${x}" y="${y + 5}" width="128" height="128" rx="5" fill="#FFFFFF" stroke="${COLORS.grid}"/>`);
      parts.push(`<path d="M ${x + 64} ${y + 5} V ${y + 133} M ${x} ${y + 92} H ${x + 128}" stroke="${COLORS.grid}" stroke-width="0.7" stroke-dasharray="3 4"/>`);
      parts.push(placedCharacter(archetype, facing, x, y + 5, 128, { bodyOnly: true }));
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function canvasPoint(p: BodyAnchorPoint): BodyAnchorPoint {
  return { x: BODY_ORIGIN.x + p.x, y: BODY_ORIGIN.y + p.y };
}

function marker(p: BodyAnchorPoint, color: string, radius = 2.2): string {
  const c = canvasPoint(p);
  return `<circle cx="${c.x}" cy="${c.y}" r="${radius}" fill="${color}" stroke="#FFFFFF" stroke-width="0.8"/>`;
}

function spanMarker(value: BodyAnchorSpan, color: string): string {
  const left = canvasPoint(value.left);
  const right = canvasPoint(value.right);
  return (
    `<path d="M ${left.x} ${left.y} L ${right.x} ${right.y}" stroke="${color}" stroke-width="1.4" stroke-dasharray="3 2"/>` +
    marker(value.left, color) + marker(value.right, color)
  );
}

function anchorOverlay(anchors: BodyFacingAnchors): string {
  const head = canvasPoint(anchors.headCenter);
  return (
    `<circle cx="${head.x}" cy="${head.y}" r="21" fill="none" stroke="${COLORS.head}" stroke-width="1.2" opacity="0.52"/>` +
    marker(anchors.headCenter, COLORS.head, 2.6) +
    marker(anchors.aboveHead, COLORS.head, 1.7) +
    marker(anchors.neck, COLORS.neck, 2.6) +
    spanMarker(anchors.shoulders, COLORS.shoulders) +
    spanMarker(anchors.waist, COLORS.waist) +
    spanMarker(anchors.hem, COLORS.hem) +
    marker(anchors.chest, COLORS.chest, 2.5) +
    marker(anchors.hip, COLORS.hip, 2.5) +
    marker({ x: 0, y: 0 }, '#111111', 1.8)
  );
}

function anchorSheet(): string {
  const width = 690;
  const header = 92;
  const rowHeight = 184;
  const height = header + BODY_ARCHETYPES.length * rowHeight;
  const labelWidth = 180;
  const panelSize = 160;
  const scale = panelSize / CANVAS;
  const parts: string[] = [`<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`];

  parts.push(text(18, 28, 'Active body-owned sub-anchor rigs', 19, 700));
  parts.push(text(18, 49, 'These exact anchors now drive heads, garments, attachments, portraits, and the complete pose catalog.', 11, 400, COLORS.muted));
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

  BODY_ARCHETYPES.forEach((archetype, row) => {
    const y = header + row * rowHeight;
    parts.push(text(20, y + 68, archetype.label, 15, 700));
    (['south', 'east'] as const).forEach((facing, i) => {
      const x = labelWidth + i * 238;
      parts.push(`<rect x="${x}" y="${y + 8}" width="${panelSize}" height="${panelSize}" rx="5" fill="#FFFFFF" stroke="${COLORS.grid}"/>`);
      parts.push(text(x + 170, y + 28, facing, 11, 600, COLORS.muted));
      const body = placedCharacter(archetype, facing, x, y + 8, panelSize, { bodyOnly: true });
      parts.push(body);
      parts.push(`<g transform="translate(${x} ${y + 8}) scale(${scale})">${anchorOverlay(archetype.anchors[facing])}</g>`);
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
  const height = header + BODY_ARCHETYPES.length * rowHeight;
  const labelWidth = 188;
  const stride = 140;
  const panel = 128;
  const parts: string[] = [`<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`];

  parts.push(text(18, 28, 'Rigged vertical slice — tee / blazer / lanyard × neutral / point / slump', 19, 700));
  parts.push(text(18, 49, 'Every cell is composed by the production renderer from the active body’s own anchors.', 11, 400, COLORS.muted));
  RIGGED_COLUMNS.forEach((column, i) => {
    const x = labelWidth + i * stride;
    parts.push(text(x + 16, 75, `${column.facing} · ${column.outfit === 'outfit-tee' ? 'tee' : 'blazer'}`, 10, 650, COLORS.muted));
    parts.push(text(x + (column.lanyard ? 23 : 42), 91, `${column.pose}${column.lanyard ? ' + ID' : ''}`, 10, 500, COLORS.muted));
  });

  BODY_ARCHETYPES.forEach((archetype, row) => {
    const y = header + row * rowHeight;
    parts.push(`<rect x="8" y="${y + 3}" width="${width - 16}" height="${rowHeight - 6}" rx="8" fill="${row % 2 === 0 ? COLORS.panel : COLORS.row}"/>`);
    parts.push(text(22, y + 55, archetype.label, 16, 700));
    parts.push(text(22, y + 75, 'clean garment compare', 10, 500, COLORS.muted));
    parts.push(text(22, y + 92, 'slump cells add ID', 10, 500, COLORS.muted));
    parts.push(text(22, y + 109, 'production body · Dress provisional', 10, 500, COLORS.muted));
    RIGGED_COLUMNS.forEach((column, i) => {
      const x = labelWidth + i * stride;
      parts.push(`<rect x="${x}" y="${y + 10}" width="${panel}" height="${panel}" rx="5" fill="#FFFFFF" stroke="${COLORS.grid}"/>`);
      parts.push(placedCharacter(archetype, column.facing, x, y + 10, panel, {
        outfit: column.outfit,
        lanyard: column.lanyard,
        pose: column.pose,
      }));
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

const POSE_SHORT: Record<Pose, string> = {
  neutral: 'neutral',
  'walk-approach': 'walk →',
  notice: 'notice',
  'arms-crossed': 'crossed',
  'hands-on-hips': 'hips',
  point: 'point',
  slump: 'slump',
  'walk-away': 'walk ←',
  'lean-in': 'lean in',
  'glance-back': 'glance',
  laugh: 'laugh',
  shrug: 'shrug',
  recoil: 'recoil',
  celebrate: 'celebrate',
  console: 'console',
};

function poseProofSheet(facing: 'south' | 'east' | 'north'): string {
  const labelWidth = 178;
  const panel = 92;
  const stride = 96;
  const header = 100;
  const rowHeight = 104;
  const width = labelWidth + POSES.length * stride + 14;
  const height = header + BODY_ARCHETYPES.length * rowHeight;
  const parts: string[] = [`<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`];
  parts.push(text(18, 28, `${facing} pose rig — all 15 authored states`, 19, 700));
  parts.push(text(18, 49, 'Every wrist and arm path is generated from the active body anchors.', 11, 400, COLORS.muted));
  POSES.forEach((pose, i) => {
    const x = labelWidth + i * stride + 8;
    parts.push(`<text x="${x}" y="88" transform="rotate(-36 ${x} 88)" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="${COLORS.muted}">${POSE_SHORT[pose]}</text>`);
  });

  BODY_ARCHETYPES.forEach((archetype, row) => {
    const y = header + row * rowHeight;
    parts.push(`<rect x="8" y="${y + 2}" width="${width - 16}" height="${rowHeight - 4}" rx="7" fill="${row % 2 === 0 ? COLORS.panel : COLORS.row}"/>`);
    parts.push(text(20, y + 45, archetype.label, 15, 700));
    parts.push(text(20, y + 63, `${facing} · tee`, 10, 500, COLORS.muted));
    POSES.forEach((pose, col) => {
      const x = labelWidth + col * stride;
      parts.push(`<rect x="${x}" y="${y + 6}" width="${panel}" height="${panel}" rx="4" fill="#FFFFFF" stroke="${COLORS.grid}"/>`);
      parts.push(placedCharacter(archetype, facing, x, y + 6, panel, { outfit: 'outfit-tee', pose }));
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

const HELD_ACCESSORIES = [
  ['acc-mug', 'mug'],
  ['acc-watch', 'watch'],
  ['acc-clipboard', 'clipboard'],
  ['acc-coffee-tray', 'coffee tray'],
  ['acc-paper-stack', 'paper stack'],
] as const;

function heldProofSheet(facing: 'south' | 'east' | 'north'): string {
  const labelWidth = 218;
  const panel = 64;
  const stride = 68;
  const header = 106;
  const rowHeight = 68;
  const rows = BODY_ARCHETYPES.length * HELD_ACCESSORIES.length;
  const width = labelWidth + POSES.length * stride + 14;
  const height = header + rows * rowHeight;
  const parts: string[] = [`<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`];
  parts.push(text(18, 28, `${facing} wrist + held-object compatibility`, 19, 700));
  parts.push(text(18, 49, 'Watch follows every right wrist. Bulky props appear only when a pose has a free carry hand.', 11, 400, COLORS.muted));
  POSES.forEach((pose, i) => {
    const x = labelWidth + i * stride + 7;
    parts.push(`<text x="${x}" y="94" transform="rotate(-36 ${x} 94)" font-family="system-ui, sans-serif" font-size="8" font-weight="600" fill="${COLORS.muted}">${POSE_SHORT[pose]}</text>`);
  });

  let row = 0;
  BODY_ARCHETYPES.forEach((archetype, bodyIndex) => {
    HELD_ACCESSORIES.forEach(([accessory, label], accessoryIndex) => {
      const y = header + row * rowHeight;
      const fill = bodyIndex % 2 === 0 ? COLORS.panel : COLORS.row;
      parts.push(`<rect x="8" y="${y + 1}" width="${width - 16}" height="${rowHeight - 2}" fill="${fill}"/>`);
      if (accessoryIndex === 0) parts.push(text(18, y + 27, archetype.label, 13, 700));
      parts.push(text(108, y + 27, label, 10, 550, COLORS.muted));
      POSES.forEach((pose, col) => {
        const x = labelWidth + col * stride;
        parts.push(`<rect x="${x}" y="${y + 2}" width="${panel}" height="${panel}" rx="3" fill="#FFFFFF" stroke="${COLORS.grid}"/>`);
        parts.push(placedCharacter(archetype, facing, x, y + 2, panel, {
          outfit: 'outfit-tee',
          accessories: [accessory],
          pose,
        }));
      });
      row++;
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

const HUMAN_OUTFITS = [
  ['outfit-tee', 'tee'],
  ['outfit-polo', 'polo'],
  ['outfit-shirt-tie', 'shirt + tie'],
  ['outfit-turtleneck', 'turtleneck'],
  ['outfit-cardigan', 'cardigan'],
  ['outfit-blazer', 'blazer'],
  ['outfit-suit-jacket', 'suit'],
  ['outfit-hoodie', 'hoodie'],
  ['outfit-vest', 'vest'],
  ['outfit-hi-vis', 'hi-vis'],
  ['outfit-dress', 'dress'],
] as const;

function outfitProofSheet(facing: 'south' | 'east' | 'north'): string {
  const labelWidth = 178;
  const panel = 96;
  const stride = 100;
  const header = 100;
  const rowHeight = 108;
  const width = labelWidth + HUMAN_OUTFITS.length * stride + 14;
  const height = header + BODY_ARCHETYPES.length * rowHeight;
  const parts: string[] = [`<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`];
  parts.push(text(18, 28, `${facing} full outfit fit — 11 human garments`, 19, 700));
  parts.push(text(18, 49, 'Every collar, seam, panel, band, and hem is generated from the active body rig.', 11, 400, COLORS.muted));
  HUMAN_OUTFITS.forEach(([, label], i) => {
    const x = labelWidth + i * stride + 10;
    parts.push(`<text x="${x}" y="88" transform="rotate(-32 ${x} 88)" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="${COLORS.muted}">${label}</text>`);
  });

  BODY_ARCHETYPES.forEach((archetype, row) => {
    const y = header + row * rowHeight;
    parts.push(`<rect x="8" y="${y + 2}" width="${width - 16}" height="${rowHeight - 4}" rx="7" fill="${row % 2 === 0 ? COLORS.panel : COLORS.row}"/>`);
    parts.push(text(20, y + 46, archetype.label, 15, 700));
    parts.push(text(20, y + 64, `${facing} · full catalog`, 10, 500, COLORS.muted));
    HUMAN_OUTFITS.forEach(([outfit], col) => {
      const x = labelWidth + col * stride;
      parts.push(`<rect x="${x}" y="${y + 6}" width="${panel}" height="${panel}" rx="4" fill="#FFFFFF" stroke="${COLORS.grid}"/>`);
      parts.push(placedCharacter(archetype, facing, x, y + 6, panel, { outfit }));
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function dressStyleSheet(): string {
  const facings = ['south', 'east', 'north'] as const;
  const columns = DEFAULT_STYLE_PRESETS.flatMap((preset) => facings.map((facing) => ({ preset, facing })));
  const labelWidth = 178;
  const panel = 104;
  const stride = 108;
  const header = 108;
  const rowHeight = 116;
  const width = labelWidth + columns.length * stride + 14;
  const height = header + BODY_ARCHETYPES.length * rowHeight;
  const parts: string[] = [`<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`];
  parts.push(text(18, 28, 'Dress silhouette stress — bodies × source facings × styles', 19, 700));
  parts.push(text(18, 49, 'Dress is the rare silhouette-changing garment; the A-line profile is generated per body id.', 11, 400, COLORS.muted));
  columns.forEach(({ preset, facing }, i) => {
    const x = labelWidth + i * stride;
    parts.push(text(x + 8, 78, preset.name.replace(' readability', ''), 9, 650, COLORS.muted));
    parts.push(text(x + 34, 94, facing, 9, 500, COLORS.muted));
  });

  BODY_ARCHETYPES.forEach((archetype, row) => {
    const y = header + row * rowHeight;
    parts.push(`<rect x="8" y="${y + 2}" width="${width - 16}" height="${rowHeight - 4}" rx="7" fill="${row % 2 === 0 ? COLORS.panel : COLORS.row}"/>`);
    parts.push(text(20, y + 50, archetype.label, 15, 700));
    parts.push(text(20, y + 68, 'dress · silhouette', 10, 500, COLORS.muted));
    columns.forEach(({ preset, facing }, col) => {
      const x = labelWidth + col * stride;
      parts.push(`<rect x="${x}" y="${y + 6}" width="${panel}" height="${panel}" rx="4" fill="#FFFFFF" stroke="${COLORS.grid}"/>`);
      parts.push(placedCharacter(archetype, facing, x, y + 6, panel, { outfit: 'outfit-dress', style: preset.style }));
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function outfitDistanceSheet(): string {
  const sizes = [64, 48, 32] as const;
  const labelWidth = 176;
  const cell = 68;
  const bodyStride = cell * sizes.length + 10;
  const header = 106;
  const rowHeight = 76;
  const width = labelWidth + BODY_ARCHETYPES.length * bodyStride + 14;
  const height = header + HUMAN_OUTFITS.length * rowHeight;
  const parts: string[] = [`<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`];
  parts.push(text(18, 28, 'Outfit game-scale strip — 64 / 48 / 32 px', 19, 700));
  parts.push(text(18, 49, 'The full fitted catalog at shrinking raster sizes; fine details may simplify, identities must remain distinct.', 11, 400, COLORS.muted));
  BODY_ARCHETYPES.forEach((archetype, bodyIndex) => {
    const x = labelWidth + bodyIndex * bodyStride;
    parts.push(text(x + 48, 77, archetype.label, 11, 650, COLORS.muted));
    sizes.forEach((size, sizeIndex) => parts.push(text(x + sizeIndex * cell + 25, 94, `${size}`, 9, 500, COLORS.muted)));
  });

  HUMAN_OUTFITS.forEach(([outfit, label], row) => {
    const y = header + row * rowHeight;
    parts.push(`<rect x="8" y="${y + 1}" width="${width - 16}" height="${rowHeight - 2}" fill="${row % 2 === 0 ? COLORS.panel : COLORS.row}"/>`);
    parts.push(text(18, y + 31, label, 12, 650));
    parts.push(text(18, y + 48, outfit, 9, 450, COLORS.muted));
    BODY_ARCHETYPES.forEach((archetype, bodyIndex) => {
      const groupX = labelWidth + bodyIndex * bodyStride;
      sizes.forEach((size, sizeIndex) => {
        const x = groupX + sizeIndex * cell;
        const px = x + (cell - size) / 2;
        const py = y + 4 + (cell - size) / 2;
        parts.push(`<rect x="${x + 1}" y="${y + 4}" width="${cell - 4}" height="${cell}" rx="3" fill="#FFFFFF" stroke="${COLORS.grid}"/>`);
        parts.push(placedCharacter(archetype, 'south', px, py, size, { outfit }));
      });
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function html(): string {
  const cards = BODY_ARCHETYPES.map(
    (archetype) => `<li><strong>${archetype.label}</strong> — ${archetype.intent}</li>`,
  ).join('');
  return `<!doctype html>
<meta charset="utf-8">
<title>Terrarium production body archetypes</title>
<style>
  body { margin: 0; padding: 24px; background: ${COLORS.page}; color: ${COLORS.ink}; font: 14px/1.45 system-ui, sans-serif; }
  main { max-width: 1100px; margin: 0 auto; }
  h1 { margin: 0 0 8px; }
  .notice { border-left: 4px solid ${COLORS.shoulders}; padding: 10px 14px; background: #fff; }
  img { display: block; max-width: 100%; height: auto; margin: 16px 0 32px; border: 1px solid ${COLORS.grid}; }
  li { margin: 5px 0; }
</style>
<main>
  <h1>Production body archetypes</h1>
  <p class="notice"><strong>Body rig and every outfit are mechanically complete; Dress visuals are provisional.</strong> Body-owned anchors drive the full catalog, while Dress remains scheduled for a dedicated art pass before its shape language is final.</p>
  <ul>${cards}</ul>
  <h2>Garment, lanyard, and pose proof</h2>
  <img src="body-archetypes-rigged.png" alt="Five body archetypes with body-aware garments, lanyards, and poses">
  <h2>Complete pose rig — all authored source facings</h2>
  <img src="body-archetypes-poses-south.png" alt="All body archetypes in all south-facing poses">
  <img src="body-archetypes-poses-east.png" alt="All body archetypes in all east-facing poses">
  <img src="body-archetypes-poses-north.png" alt="All body archetypes in all north-facing poses">
  <h2>Wrist and held-object policy</h2>
  <img src="body-archetypes-held-south.png" alt="South-facing held-object compatibility matrix">
  <img src="body-archetypes-held-east.png" alt="East-facing held-object compatibility matrix">
  <img src="body-archetypes-held-north.png" alt="North-facing held-object compatibility matrix">
  <h2>Complete outfit fit</h2>
  <img src="body-archetypes-outfits-south.png" alt="All five body archetypes in all south-facing human outfits">
  <img src="body-archetypes-outfits-east.png" alt="All five body archetypes in all east-facing human outfits">
  <img src="body-archetypes-outfits-north.png" alt="All five body archetypes in all north-facing human outfits">
  <h2>Dress silhouette study — provisional</h2>
  <img src="body-archetypes-dress-styles.png" alt="Body-specific dress silhouettes across source facings and style presets">
  <h2>Outfit game-scale strip</h2>
  <img src="body-archetypes-outfit-distance.png" alt="Every body and outfit at 64, 48, and 32 pixels">
  <h2>Characters through the production compositor</h2>
  <img src="body-archetypes-preview.png" alt="Five body archetypes across facings and distances">
  <h2>Flat silhouettes</h2>
  <img src="body-archetypes-silhouettes.png" alt="Body-only silhouette comparison">
  <h2>Active sub-anchor blueprint</h2>
  <img src="body-archetypes-anchors.png" alt="Body archetype anchor blueprint">
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
  writeSvgAndPng(outDir, 'body-archetypes-poses-south', poseProofSheet('south'));
  writeSvgAndPng(outDir, 'body-archetypes-poses-east', poseProofSheet('east'));
  writeSvgAndPng(outDir, 'body-archetypes-poses-north', poseProofSheet('north'));
  writeSvgAndPng(outDir, 'body-archetypes-held-south', heldProofSheet('south'));
  writeSvgAndPng(outDir, 'body-archetypes-held-east', heldProofSheet('east'));
  writeSvgAndPng(outDir, 'body-archetypes-held-north', heldProofSheet('north'));
  writeSvgAndPng(outDir, 'body-archetypes-outfits-south', outfitProofSheet('south'));
  writeSvgAndPng(outDir, 'body-archetypes-outfits-east', outfitProofSheet('east'));
  writeSvgAndPng(outDir, 'body-archetypes-outfits-north', outfitProofSheet('north'));
  writeSvgAndPng(outDir, 'body-archetypes-dress-styles', dressStyleSheet());
  writeSvgAndPng(outDir, 'body-archetypes-outfit-distance', outfitDistanceSheet());
  writeSvgAndPng(outDir, 'body-archetypes-preview', full);
  writeFileSync(
    join(outDir, 'body-archetypes-preview@2x.png'),
    new Resvg(full, { fitTo: { mode: 'zoom', value: 2 } }).render().asPng(),
  );
  writeSvgAndPng(outDir, 'body-archetypes-silhouettes', silhouetteSheet());
  writeSvgAndPng(outDir, 'body-archetypes-anchors', anchorSheet());
  writeFileSync(join(outDir, 'body-archetypes-preview.html'), html());

  console.log(`wrote body-archetypes rig, pose, held-object, outfit, dress, distance, silhouette, and anchor proofs to ${outDir}`);
}

main();
