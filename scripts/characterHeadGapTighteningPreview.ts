/**
 * Selection record for the promoted production head/body gap tightening.
 *
 *   npx tsx scripts/characterHeadGapTighteningPreview.ts [outDir]
 *
 * The accepted three-pixel-closer datum is the zero offset. The proof
 * temporarily reconstructs the previous, two-pixel, and four-pixel options,
 * renders through the real compositor, and restores every anchor before exit.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import { composeCharacter } from '../src/core/compositor';
import type { BodyFacingAnchors, CharacterRecipe, Facing, StyleSheet } from '../src/core/types';
import { DEFAULT_STYLE } from '../src/data/defaults';
import { BODY_ARCHETYPES } from '../src/parts/bodyArchetypes';

type ReviewFacing = Facing | 'west';

interface GapOption {
  delta: number;
  label: string;
  note: string;
}

const OPTIONS: GapOption[] = [
  { delta: -3, label: 'Previous', note: 'former one-row guarantee' },
  { delta: -1, label: '2 px closer', note: 'light correction' },
  { delta: 0, label: '3 px closer', note: 'accepted production datum' },
  { delta: 1, label: '4 px closer', note: 'near-touch at gameplay scale' },
];

const HEADS = [
  ['head-round', 'Round'],
  ['head-oval', 'Broad'],
  ['head-boxy', 'Block'],
  ['head-long', 'Long'],
  ['head-angular', 'Point'],
  ['head-soft-square', 'Lantern'],
] as const;

const FACINGS: Array<{ id: ReviewFacing; label: string }> = [
  { id: 'south', label: 'S' },
  { id: 'east', label: 'E' },
  { id: 'north', label: 'N' },
  { id: 'west', label: 'W' },
];

const COLORS = {
  page: '#F2EFE7',
  panel: '#FFFEFA',
  panelAlt: '#E7E1D5',
  selected: '#DCEAE1',
  ink: '#29302E',
  muted: '#69736F',
  green: '#345749',
  coral: '#B75E4B',
  line: '#C9C1B3',
} as const;

const STYLE: StyleSheet = {
  ...structuredClone(DEFAULT_STYLE),
  render: { ...DEFAULT_STYLE.render, contactShadow: 0 },
};

const PALETTE = {
  skin: '#C88E65',
  hair: '#3B2921',
  outfitPrimary: '#315A78',
  outfitSecondary: '#E8D6A8',
  accent: '#D85A30',
};

function recipe(body: string, head: string): CharacterRecipe {
  return {
    id: `head-gap-tightening-${body}-${head}`,
    name: 'Head gap tightening proof',
    parts: {
      body,
      head,
      hair: 'hair-none',
      outfit: 'outfit-tee',
      accessories: [],
    },
    palette: PALETTE,
  };
}

function escapeXml(value: string): string {
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
  weight = 500,
  fill: string = COLORS.ink,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return `<text x="${x}" y="${y}" font-family="Inter, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${escapeXml(value)}</text>`;
}

function panel(x: number, y: number, w: number, h: number, fill: string = COLORS.panel): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill}" stroke="${COLORS.line}" stroke-width="1"/>`;
}

function placeSvg(svg: string, x: number, y: number): string {
  return svg.replace('<svg ', `<svg x="${x}" y="${y}" `);
}

function renderCharacter(
  body: string,
  head: string,
  facing: ReviewFacing,
  size: number,
): string {
  return composeCharacter(
    recipe(body, head),
    STYLE,
    facing,
    size,
    'normal',
    { badge: false, pose: 'neutral' },
  );
}

function uniqueProductionAnchors(): BodyFacingAnchors[] {
  const seen = new Set<BodyFacingAnchors>();
  for (const body of BODY_ARCHETYPES) {
    for (const facing of ['south', 'east', 'north'] as const) {
      seen.add(body.anchors[facing]);
    }
  }
  return [...seen];
}

function withCloserGap<T>(delta: number, render: () => T): T {
  const anchors = uniqueProductionAnchors();
  for (const anchor of anchors) {
    anchor.headCenter.y += delta;
    anchor.aboveHead.y += delta;
  }
  try {
    return render();
  } finally {
    for (const anchor of anchors) {
      anchor.headCenter.y -= delta;
      anchor.aboveHead.y -= delta;
    }
  }
}

function buildSheet(): string {
  const width = 1712;
  const height = 1160;
  const left = 112;
  const top = 146;
  const columnWidth = 396;
  const rowHeight = 158;
  const cellWidth = 386;
  const cellHeight = 146;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`,
    text(28, 42, 'Head / torso gap tightening', 24, 720),
    text(
      28,
      68,
      'Selection record · production head art and body rigs · literal 64 / 48 / 40 px compositor renders',
      12,
      520,
      COLORS.muted,
    ),
    panel(28, 84, width - 56, 42, COLORS.panelAlt),
    text(44, 109, 'Decision question', 11, 720, COLORS.green),
    text(150, 109, 'Which spacing keeps a designed neck break without making the head read as detached?', 11, 560),
  ];

  OPTIONS.forEach((option, optionIndex) => {
    const x = left + optionIndex * columnWidth;
    const selected = option.delta === 0;
    parts.push(panel(x, 132, cellWidth, 58, selected ? COLORS.selected : COLORS.panel));
    parts.push(text(x + 14, 156, option.label, 15, 720, selected ? COLORS.green : COLORS.ink));
    parts.push(text(x + 14, 176, option.note, 10, 520, selected ? COLORS.green : COLORS.muted));
  });

  BODY_ARCHETYPES.forEach((body, rowIndex) => {
    const [headId, headLabel] = HEADS[rowIndex];
    const y = top + 54 + rowIndex * rowHeight;
    parts.push(text(28, y + 39, body.label, 14, 720));
    parts.push(text(28, y + 58, headLabel, 10, 560, COLORS.muted));
    parts.push(text(28, y + 75, body.id, 8, 500, COLORS.muted));

    OPTIONS.forEach((option, optionIndex) => {
      const x = left + optionIndex * columnWidth;
      parts.push(panel(
        x,
        y,
        cellWidth,
        cellHeight,
        option.delta === 0 ? COLORS.selected : (rowIndex % 2 === 0 ? COLORS.panel : COLORS.panelAlt),
      ));
      withCloserGap(option.delta, () => {
        FACINGS.forEach((facing, facingIndex) => {
          const spriteX = x + 12 + facingIndex * 70;
          parts.push(placeSvg(renderCharacter(body.id, headId, facing.id, 64), spriteX, y + 12));
          parts.push(text(spriteX + 32, y + 88, facing.label, 8, 650, COLORS.muted, 'middle'));
        });
        parts.push(placeSvg(renderCharacter(body.id, headId, 'south', 48), x + 294, y + 14));
        parts.push(text(x + 318, y + 76, '48', 8, 650, COLORS.muted, 'middle'));
        parts.push(placeSvg(renderCharacter(body.id, headId, 'south', 40), x + 339, y + 18));
        parts.push(text(x + 359, y + 76, '40', 8, 650, COLORS.muted, 'middle'));
      });
      parts.push(text(
        x + 193,
        y + 128,
        option.delta === 0 ? 'promoted datum' : option.label.toLowerCase(),
        9,
        600,
        option.delta === 0 ? COLORS.green : COLORS.muted,
        'middle',
      ));
    });
  });

  parts.push(panel(28, 1110, width - 56, 34, COLORS.panelAlt));
  parts.push(text(44, 1132, 'Scope lock', 10, 720, COLORS.green));
  parts.push(text(
    112,
    1132,
    'Production uses the accepted three-pixel tightening. Hair and high-contrast fit remain separate follow-up work.',
    10,
    540,
    COLORS.muted,
  ));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function main(): void {
  const outDir = resolve(process.argv[2] ?? 'docs/previews');
  mkdirSync(outDir, { recursive: true });
  const svg = buildSheet();
  writeFileSync(join(outDir, 'character-head-gap-tightening.svg'), svg);
  writeFileSync(
    join(outDir, 'character-head-gap-tightening.png'),
    new Resvg(svg, { fitTo: { mode: 'zoom', value: 1 } }).render().asPng(),
  );
  console.log(`wrote promoted head-gap tightening selection record to ${outDir}`);
}

main();
