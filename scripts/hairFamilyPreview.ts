/**
 * Representative production-hair review surface.
 *
 *   npx tsx scripts/hairFamilyPreview.ts [outDir]
 *
 * Renders the current compositor geometry for the approved representative
 * Short/Bob/Long straight and Curly/Ponytail/Coils sets. This script is
 * deliberately read-only with respect to part sources; all six are approved.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import { composeCharacter } from '../src/core/compositor';
import type { CharacterRecipe, Facing } from '../src/core/types';
import { DEFAULT_STYLE } from '../src/data/defaults';

const CANVAS = 128;
const FACINGS = ['south', 'east', 'north'] as const satisfies readonly Facing[];
const SIZES = [128, 64, 48, 32] as const;

const HEADS = [
  ['head-round', 'Round'],
  ['head-oval', 'Oval'],
  ['head-boxy', 'Boxy'],
  ['head-long', 'Long'],
  ['head-angular', 'Angular'],
  ['head-soft-square', 'Soft square'],
] as const;

const HAIR_STYLES = [
  {
    id: 'hair-short',
    label: 'Short',
    approved: true,
    status: 'approved canonical production geometry',
    statusShort: 'approved canonical',
  },
  {
    id: 'hair-pixie',
    label: 'Pixie',
    approved: true,
    status: 'approved canonical production geometry',
    statusShort: 'approved canonical',
  },
  {
    id: 'hair-side-part',
    label: 'Side-part',
    approved: true,
    status: 'approved canonical production geometry',
    statusShort: 'approved canonical',
  },
  {
    id: 'hair-bob',
    label: 'Bob',
    approved: true,
    status: 'approved medium-family control',
    statusShort: 'approved control',
  },
  {
    id: 'hair-curly',
    label: 'Curly',
    approved: true,
    status: 'approved canonical production geometry',
    statusShort: 'approved canonical',
  },
  {
    id: 'hair-long-straight',
    label: 'Long straight',
    approved: true,
    status: 'approved canonical production geometry',
    statusShort: 'approved canonical',
  },
  {
    id: 'hair-ponytail',
    label: 'Ponytail',
    approved: true,
    status: 'approved canonical production geometry',
    statusShort: 'approved canonical',
  },
  {
    id: 'hair-bun',
    label: 'Bun',
    approved: true,
    status: 'approved canonical production geometry',
    statusShort: 'approved canonical',
  },
  {
    id: 'hair-balding',
    label: 'Balding',
    approved: true,
    status: 'approved canonical production geometry',
    statusShort: 'approved canonical',
  },
  {
    id: 'hair-coils',
    label: 'Coils',
    approved: true,
    status: 'approved canonical production geometry',
    statusShort: 'approved canonical',
  },
] as const;

const COLORS = {
  page: '#F1EEE7',
  panel: '#FFFEFA',
  alternate: '#E8E4DC',
  ink: '#2F3538',
  muted: '#68747A',
  border: '#D4CEC2',
  approved: '#2E7D5B',
  pending: '#B66B24',
  group: '#E2DED5',
} as const;

const PALETTE = {
  skin: '#C68B59',
  hair: '#34251C',
  outfitPrimary: '#315A78',
  outfitSecondary: '#E8D6A8',
  accent: '#E4A62A',
};

function recipe(head: string, hair: string): CharacterRecipe {
  return {
    id: `hair-family-preview-${head}-${hair}`,
    name: 'Hair family preview',
    parts: {
      body: 'body-balanced',
      head,
      hair,
      outfit: 'outfit-tee',
      accessories: [],
    },
    palette: { ...PALETTE },
  };
}

function svgInner(svg: string): string {
  return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

function text(
  x: number,
  y: number,
  value: string,
  size = 12,
  weight = 400,
  fill: string = COLORS.ink,
  extra = '',
): string {
  return `<text x="${x}" y="${y}" ${extra} font-family="system-ui, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${value}</text>`;
}

function renderedCharacter(head: string, hair: string, facing: Facing): string {
  return composeCharacter(
    recipe(head, hair),
    DEFAULT_STYLE,
    facing,
    CANVAS,
    'normal',
    { badge: false },
  );
}

function compatibilitySheet(): string {
  const labelWidth = 150;
  const cellStride = 118;
  const renderSize = 108;
  const groupWidth = FACINGS.length * cellStride;
  const titleHeight = 66;
  const bandHeaderHeight = 58;
  const rowHeight = 118;
  const stylesPerBand = 5;
  const bands = Array.from(
    { length: Math.ceil(HAIR_STYLES.length / stylesPerBand) },
    (_, index) => HAIR_STYLES.slice(index * stylesPerBand, (index + 1) * stylesPerBand),
  );
  const bandHeight = bandHeaderHeight + HEADS.length * rowHeight + 10;
  const width = labelWidth + stylesPerBand * groupWidth + 14;
  const height = titleHeight + bands.length * bandHeight;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`,
    text(18, 30, 'Representative production hair — six-head compatibility', 22, 700),
    text(18, 53, 'Body-balanced · current compositor · all source facings · 108 px review cells', 12, 400, COLORS.muted),
  ];

  bands.forEach((styles, bandIndex) => {
    const bandTop = titleHeight + bandIndex * bandHeight;
    styles.forEach((hair, hairIndex) => {
      const x = labelWidth + hairIndex * groupWidth;
      const statusColor = hair.approved ? COLORS.approved : COLORS.pending;
      parts.push(`<rect x="${x + 2}" y="${bandTop}" width="${groupWidth - 8}" height="52" rx="7" fill="${COLORS.group}"/>`);
      parts.push(text(x + 12, bandTop + 18, hair.label, 14, 700));
      parts.push(text(x + 12, bandTop + 35, hair.statusShort, 9, 650, statusColor));
      FACINGS.forEach((facing, facingIndex) => {
        parts.push(text(x + facingIndex * cellStride + 42, bandTop + 50, facing, 9, 600, COLORS.muted, 'text-anchor="middle"'));
      });
    });

    HEADS.forEach(([head, label], row) => {
      const y = bandTop + bandHeaderHeight + row * rowHeight;
      parts.push(`<rect x="8" y="${y + 2}" width="${width - 16}" height="${rowHeight - 4}" rx="7" fill="${row % 2 ? COLORS.alternate : COLORS.panel}"/>`);
      parts.push(text(18, y + 44, label, 14, 700));
      parts.push(text(18, y + 62, head, 9, 400, COLORS.muted));

      styles.forEach((hair, hairIndex) => {
        FACINGS.forEach((facing, facingIndex) => {
          const x = labelWidth + hairIndex * groupWidth + facingIndex * cellStride;
          const svg = renderedCharacter(head, hair.id, facing);
          parts.push(`<rect x="${x + 3}" y="${y + 5}" width="${renderSize + 4}" height="${renderSize + 4}" rx="5" fill="#FFFFFF" stroke="${COLORS.border}"/>`);
          parts.push(`<g transform="translate(${x + 5} ${y + 7}) scale(${renderSize / CANVAS})">${svgInner(svg)}</g>`);
        });
      });
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function distanceSheet(): string {
  const labelWidth = 176;
  const panelWidth = 304;
  const headerHeight = 92;
  const rowHeight = 204;
  const width = labelWidth + FACINGS.length * panelWidth + 14;
  const height = headerHeight + HAIR_STYLES.length * rowHeight + 10;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`,
    text(18, 30, 'Representative production hair — game-distance check', 22, 700),
    text(18, 53, 'Body-balanced · head-round control · literal 128 / 64 / 48 / 32 px compositor renders', 12, 400, COLORS.muted),
  ];

  FACINGS.forEach((facing, index) => {
    parts.push(text(labelWidth + index * panelWidth + 12, 80, facing, 11, 650, COLORS.muted));
  });

  HAIR_STYLES.forEach((hair, row) => {
    const y = headerHeight + row * rowHeight;
    const statusColor = hair.approved ? COLORS.approved : COLORS.pending;
    parts.push(`<rect x="8" y="${y + 4}" width="${width - 16}" height="${rowHeight - 8}" rx="8" fill="${row % 2 ? COLORS.alternate : COLORS.panel}"/>`);
    parts.push(text(20, y + 45, hair.label, 15, 700));
    parts.push(text(20, y + 64, hair.id, 9, 400, COLORS.muted));
    parts.push(text(20, y + 83, hair.statusShort, 9, 650, statusColor));

    FACINGS.forEach((facing, facingIndex) => {
      const x = labelWidth + facingIndex * panelWidth;
      const svg = renderedCharacter('head-round', hair.id, facing);
      parts.push(`<rect x="${x + 4}" y="${y + 14}" width="136" height="148" rx="5" fill="#FFFFFF" stroke="${COLORS.border}"/>`);
      parts.push(`<g transform="translate(${x + 8} ${y + 18})">${svgInner(svg)}</g>`);
      parts.push(text(x + 116, y + 157, '128', 9, 600, COLORS.muted));

      let smallY = y + 16;
      for (const size of SIZES.slice(1)) {
        const boxWidth = 74;
        const boxHeight = size === 64 ? 72 : size + 8;
        const boxX = x + 151;
        const characterX = boxX + (boxWidth - size) / 2;
        const characterY = smallY + (boxHeight - size) / 2;
        parts.push(`<rect x="${boxX}" y="${smallY}" width="${boxWidth}" height="${boxHeight}" rx="4" fill="#FFFFFF" stroke="${COLORS.border}"/>`);
        parts.push(`<g transform="translate(${characterX} ${characterY}) scale(${size / CANVAS})">${svgInner(svg)}</g>`);
        parts.push(text(x + 241, smallY + boxHeight / 2 + 3, String(size), 9, 600, COLORS.muted));
        smallY += boxHeight + 5;
      }
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function html(): string {
  return `<!doctype html>
<meta charset="utf-8">
<title>Terrarium representative hair-family review</title>
<style>
  body { margin: 0; padding: 24px; background: ${COLORS.page}; color: ${COLORS.ink}; font: 14px/1.45 system-ui, sans-serif; }
  main { max-width: 1320px; margin: 0 auto; }
  h1 { margin: 0 0 8px; }
  .notice { border-left: 4px solid ${COLORS.approved}; padding: 10px 14px; background: #fff; }
  .approved { color: ${COLORS.approved}; font-weight: 700; }
  .pending { color: ${COLORS.pending}; font-weight: 700; }
  img { display: block; max-width: 100%; height: auto; margin: 16px 0 32px; border: 1px solid ${COLORS.border}; }
</style>
<main>
  <h1>Representative production hair-family review</h1>
  <p class="notice"><span class="approved">All ten mapped hair families are approved canonical production geometry.</span> Bun is compact and clip-free, Balding uses tapered temple and horseshoe hair, Pixie has a clean swept profile, and Side-part carries its crease through every facing. All cells come directly from the production compositor; this preview does not alter part sources.</p>
  <h2>Six-head compatibility across source facings</h2>
  <img src="hair-families-compatibility.png" alt="Ten production hairstyles on all six production heads across south, east, and north facings">
  <h2>Game-distance readability</h2>
  <img src="hair-families-distance.png" alt="Ten production hairstyles across facings at 128, 64, 48, and 32 pixels">
</main>`;
}

function writeSvgAndPng(outDir: string, base: string, svg: string): void {
  writeFileSync(join(outDir, `${base}.svg`), svg);
  writeFileSync(join(outDir, `${base}.png`), new Resvg(svg).render().asPng());
}

function main(): void {
  const outDir = resolve(process.argv[2] ?? 'docs/previews');
  mkdirSync(outDir, { recursive: true });

  writeSvgAndPng(outDir, 'hair-families-compatibility', compatibilitySheet());
  writeSvgAndPng(outDir, 'hair-families-distance', distanceSheet());
  writeFileSync(join(outDir, 'hair-families-preview.html'), html());

  console.log(`wrote representative hair-family proofs to ${outDir}`);
}

main();
