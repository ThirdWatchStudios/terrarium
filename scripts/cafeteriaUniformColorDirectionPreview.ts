/** Approved palette-direction record for the cafeteria service uniform. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import { composeCharacter } from '../src/core/compositor';
import type { CharacterRecipe, Facing, Palette } from '../src/core/types';
import { DEFAULT_STYLE, KITCHEN_STAFF } from '../src/data/defaults';
import { BODY_ARCHETYPES, type BodyArchetype } from '../src/parts/bodyArchetypes';
import type { Pose } from '../src/parts/poses';

const CANVAS = 128;
const OUTPUT = 'docs/previews/cafeteria-uniform-color-direction-v1';
const HAIR_IDS = ['hair-bob', 'hair-short', 'hair-bun', 'hair-ponytail', 'hair-curly', 'hair-coils'] as const;

const COLORS = {
  page: '#E9E6DF',
  panel: '#FFFDF8',
  ink: '#252A28',
  muted: '#66706B',
  border: '#C8C1B5',
  current: '#526B67',
  recommendation: '#5C7480',
} as const;

interface Direction {
  id: string;
  label: string;
  note: string;
  palette: Palette;
  recommended?: boolean;
}

const common = {
  skin: KITCHEN_STAFF[0].palette.skin,
  hair: KITCHEN_STAFF[0].palette.hair,
  accent: KITCHEN_STAFF[0].palette.accent,
};

const DIRECTIONS: readonly Direction[] = [
  {
    id: 'chef-white-steel',
    label: 'A · CHEF WHITE + STEEL',
    note: 'Warm white coat/apron field with a muted steel undershirt. Strongest kitchen read; still QuotaCo clinical.',
    recommended: true,
    palette: { ...common, outfitPrimary: '#E7E1D5', outfitSecondary: '#657A82' },
  },
  {
    id: 'navy-paper',
    label: 'B · NAVY + PAPER WHITE',
    note: 'Conventional institutional service uniform. Clear and restrained, but keeps more dark mass at gameplay scale.',
    palette: { ...common, outfitPrimary: '#354650', outfitSecondary: '#F0EBDF' },
  },
  {
    id: 'cream-rust',
    label: 'C · CREAM + MUTED RUST',
    note: 'Warmer cafeteria identity with a cream apron and QuotaCo rust undershirt. Friendlier, less sterile.',
    palette: { ...common, outfitPrimary: '#DDD2BE', outfitSecondary: '#A85F49' },
  },
];

const CURRENT: Direction = {
  id: 'current-green',
  label: 'CURRENT · GREEN',
  note: 'Former production palette retained for comparison.',
  palette: {
    skin: '#B97850',
    hair: '#3A2A22',
    outfitPrimary: '#526B67',
    outfitSecondary: '#E8E4D9',
    accent: '#C69B52',
  },
};

function recipe(body: BodyArchetype, hairId: string, palette: Palette): CharacterRecipe {
  return {
    ...KITCHEN_STAFF[0],
    id: `cafeteria-color-${body.id}-${hairId}`,
    parts: { ...KITCHEN_STAFF[0].parts, body: body.id, hair: hairId },
    palette: { ...palette },
  };
}

function character(
  direction: Direction,
  body: BodyArchetype,
  facing: Facing | 'west',
  size: number,
  pose: Pose = 'neutral',
  hairId = 'hair-bun',
): string {
  return composeCharacter(recipe(body, hairId, direction.palette), DEFAULT_STYLE, facing, size, 'normal', {
    badge: false,
    pose,
  });
}

function raster(svg: string, width: number): Uint8Array {
  return new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function text(x: number, y: number, value: string, size = 14, weight = 500, fill: string = COLORS.ink): string {
  return `<text x="${x}" y="${y}" font-family="system-ui,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${escapeText(value)}</text>`;
}

function svgInner(svg: string): string {
  return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

function framedSvg(x: number, y: number, size: number, svg: string, border: string = COLORS.border, fill = '#FFFFFF'): string {
  return `<rect x="${x - 4}" y="${y - 4}" width="${size + 8}" height="${size + 8}" rx="8" fill="${fill}" stroke="${border}" stroke-width="2"/><g transform="translate(${x} ${y}) scale(${size / CANVAS})">${svgInner(svg)}</g>`;
}

function swatch(x: number, y: number, color: string, label: string): string {
  return `<rect x="${x}" y="${y}" width="28" height="18" rx="4" fill="${color}" stroke="#00000028"/>${text(x + 38, y + 14, label, 10, 650, COLORS.muted)}`;
}

function directionSheet(): string {
  const width = 1920;
  const height = 1160;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`,
    text(34, 44, 'CAFETERIA UNIFORM · COLOR DIRECTIONS', 28, 800),
    text(34, 72, 'Direction A is the approved production palette; the former green control remains below for comparison.', 15, 550, COLORS.muted),
  ];

  DIRECTIONS.forEach((direction, row) => {
    const y = 104 + row * 326;
    const border = direction.recommended ? COLORS.recommendation : COLORS.border;
    parts.push(`<rect x="30" y="${y}" width="1860" height="300" rx="16" fill="${COLORS.panel}" stroke="${border}" stroke-width="${direction.recommended ? 3 : 1}"/>`);
    parts.push(text(54, y + 34, direction.label, 18, 820, direction.recommended ? COLORS.recommendation : COLORS.ink));
    if (direction.recommended) parts.push(text(315, y + 34, 'APPROVED', 11, 800, COLORS.recommendation));
    parts.push(text(54, y + 58, direction.note, 12, 600, COLORS.muted));
    parts.push(swatch(54, y + 74, direction.palette.outfitPrimary, 'coat / apron / sleeves'));
    parts.push(swatch(240, y + 74, direction.palette.outfitSecondary, 'undershirt / pocket'));
    BODY_ARCHETYPES.forEach((body, column) => {
      const x = 454 + column * 232;
      const hairId = HAIR_IDS[column];
      parts.push(text(x, y + 38, body.label.toUpperCase(), 10, 760, COLORS.muted));
      parts.push(framedSvg(x, y + 72, 148, character(direction, body, 'south', 148, 'neutral', hairId), border));
      parts.push(framedSvg(x + 160, y + 128, 72, character(direction, body, 'east', 72, 'neutral', hairId), border));
      parts.push(framedSvg(x, y + 238, 48, character(direction, body, 'south', 48, 'neutral', hairId), border));
      parts.push(framedSvg(x + 62, y + 254, 32, character(direction, body, 'west', 32, 'neutral', hairId), border));
    });
  });

  const compareY = 1092;
  parts.push(text(44, compareY, 'Representative Barrel comparison:', 12, 760, COLORS.muted));
  [CURRENT, ...DIRECTIONS].forEach((direction, index) => {
    const x = 290 + index * 365;
    parts.push(text(x, compareY, direction.label, 11, 760, direction.id === 'current-green' ? COLORS.current : COLORS.ink));
    parts.push(framedSvg(x + 190, compareY - 42, 54, character(direction, BODY_ARCHETYPES[1], 'south', 54, 'neutral', 'hair-short'), direction.recommended ? COLORS.recommendation : COLORS.border));
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${parts.join('')}</svg>`;
}

function gameplaySheet(): string {
  const direction = DIRECTIONS[0];
  const width = 1920;
  const height = 1080;
  const poses: readonly Pose[] = ['neutral', 'walk-approach', 'arms-crossed', 'point', 'slump', 'console'];
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`,
    text(34, 44, 'DIRECTION A · CHEF WHITE + STEEL · GAMEPLAY-SCALE STUDY', 28, 800),
    text(34, 72, 'Approved Direction A on the live canonical apron and hairnet receivers; browser export remains the Unity handoff.', 15, 550, COLORS.muted),
    `<rect x="30" y="94" width="1860" height="936" rx="16" fill="${COLORS.panel}" stroke="${COLORS.recommendation}" stroke-width="3"/>`,
  ];
  BODY_ARCHETYPES.forEach((body, column) => {
    const x = 72 + column * 302;
    const hairId = HAIR_IDS[column];
    parts.push(text(x, 132, body.label.toUpperCase(), 13, 800));
    parts.push(text(x, 152, hairId, 11, 650, COLORS.muted));
    parts.push(framedSvg(x, 174, 172, character(direction, body, 'south', 172, 'neutral', hairId), COLORS.recommendation));
    parts.push(framedSvg(x + 184, 222, 86, character(direction, body, 'east', 86, 'neutral', hairId), COLORS.recommendation));
    parts.push(framedSvg(x, 410, 64, character(direction, body, 'south', 64, 'neutral', hairId), COLORS.recommendation));
    parts.push(framedSvg(x + 82, 426, 48, character(direction, body, 'east', 48, 'neutral', hairId), COLORS.recommendation));
    parts.push(framedSvg(x + 148, 442, 32, character(direction, body, 'west', 32, 'neutral', hairId), COLORS.recommendation));
  });
  parts.push(text(54, 536, 'POSE + FLOOR CONTEXT', 13, 800, COLORS.muted));
  BODY_ARCHETYPES.forEach((body, column) => {
    const x = 72 + column * 302;
    parts.push(framedSvg(x, 566, 132, character(direction, body, column % 2 ? 'east' : 'south', 132, poses[column], HAIR_IDS[column]), COLORS.recommendation));
    parts.push(framedSvg(x + 146, 584, 104, character(direction, body, column % 2 ? 'west' : 'north', 104, poses[(column + 2) % poses.length], HAIR_IDS[column]), COLORS.recommendation));
    parts.push(text(x, 718, poses[column], 10, 680));
  });
  parts.push(`<rect x="54" y="758" width="1812" height="236" rx="12" fill="#778187" stroke="#51595D" stroke-width="2"/>`);
  for (let x = 102; x < 1866; x += 96) parts.push(`<path d="M ${x} 758 V 994" stroke="#A3AAAD" opacity=".28"/>`);
  for (let y = 822; y < 994; y += 64) parts.push(`<path d="M 54 ${y} H 1866" stroke="#A3AAAD" opacity=".28"/>`);
  BODY_ARCHETYPES.forEach((body, index) => {
    const x = 112 + index * 290;
    const facing = (['south', 'east', 'west', 'north', 'south', 'west'] as const)[index];
    parts.push(framedSvg(x, 804 + (index % 2) * 24, 112, character(direction, body, facing, 112, poses[index], HAIR_IDS[index]), '#5F686C', '#7F898E'));
    parts.push(text(x, 960 + (index % 2) * 16, body.label, 11, 700, '#F4F1E9'));
  });
  parts.push(text(56, 1054, 'Approved read: warm-white apron field plus steel undershirt identifies cafeteria and food-service staff.', 13, 700, COLORS.muted));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${parts.join('')}</svg>`;
}

function writePreview(outputDir: string): void {
  mkdirSync(outputDir, { recursive: true });
  const directions = directionSheet();
  const gameplay = gameplaySheet();
  writeFileSync(join(outputDir, '00-color-directions.svg'), directions);
  writeFileSync(join(outputDir, '00-color-directions.png'), raster(directions, 1920));
  writeFileSync(join(outputDir, '01-direction-a-gameplay-scale.svg'), gameplay);
  writeFileSync(join(outputDir, '01-direction-a-gameplay-scale.png'), raster(gameplay, 1920));
  writeFileSync(join(outputDir, 'README.md'), [
    '# Cafeteria uniform color directions v1',
    '',
    'Status: **Direction A approved and promoted on 2026-08-02**',
    '',
    'The existing green palette failed the cafeteria-worker read. This sheet isolates',
    'three palette directions on unchanged production geometry. Direction A is the',
    'approved control because its warm-white coat/apron field gives the strongest',
    'food-service signal while muted steel preserves QuotaCo institutional restraint.',
    '',
  ].join('\n'));
  process.stdout.write(`Wrote cafeteria-uniform color directions to ${outputDir}\n`);
}

writePreview(resolve(process.argv[2] ?? OUTPUT));
