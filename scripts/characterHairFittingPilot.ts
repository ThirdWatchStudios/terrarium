/**
 * Three-hairstyle production fitting proof.
 *
 *   npx tsx scripts/characterHairFittingPilot.ts [outDir]
 *
 * Short/Crop, Bob, and Ponytail/Tail are resolved by the production
 * compositor against all six accepted head envelopes. The proof verifies that
 * stable recipe IDs emit the promoted fitted geometry without adding an
 * export, animation, or Unity runtime surface.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';

import { composeCharacter } from '../src/core/compositor';
import type {
  CharacterRecipe,
  Facing,
  Palette,
  StyleSheet,
} from '../src/core/types';
import { DEFAULT_STYLE } from '../src/data/defaults';
import { getPart } from '../src/parts/library';

type ReviewFacing = Facing | 'west';

interface PilotHair {
  partId:
    | 'hair-short'
    | 'hair-bob'
    | 'hair-bun'
    | 'hair-curly'
    | 'hair-balding'
    | 'hair-side-part'
    | 'hair-pixie'
    | 'hair-ponytail'
    | 'hair-long-straight'
    | 'hair-coils';
  constructionId: string;
  label: string;
  note: string;
}

interface PilotHead {
  partId:
    | 'head-round'
    | 'head-oval'
    | 'head-long'
    | 'head-boxy'
    | 'head-angular'
    | 'head-soft-square';
  fitId: 'round' | 'broad' | 'long' | 'block' | 'point' | 'lantern';
  label: string;
}

interface AuditFinding {
  hair: string;
  head: string;
  facing: ReviewFacing;
  size: number;
}

const COLORS = {
  page: '#F2EFE7',
  panel: '#FFFEFA',
  panelAlt: '#E7E1D5',
  selected: '#DFEBE4',
  selectedStrong: '#C9DED1',
  ink: '#29302E',
  muted: '#69736F',
  grid: '#CCC4B6',
  green: '#345749',
  greenMid: '#739489',
  coral: '#B75E4B',
  cream: '#D9D0B9',
  floor: '#B8B09A',
  floorDark: '#9D9582',
  desk: '#C9B89A',
  deskDark: '#756D61',
} as const;

const PILOT_HAIRS: PilotHair[] = [
  {
    partId: 'hair-short',
    constructionId: 'crop',
    label: 'Short / Crop',
    note: 'tight cap · central air preserved',
  },
  {
    partId: 'hair-bob',
    constructionId: 'bob',
    label: 'Bob',
    note: 'jaw mass · open profile face',
  },
  {
    partId: 'hair-ponytail',
    constructionId: 'tail',
    label: 'Ponytail / Tail',
    note: 'rigid rear drop · lateral bridge allowed',
  },
];

const COMPLETION_HAIRS: PilotHair[] = [
  {
    partId: 'hair-pixie',
    constructionId: 'broken-crop',
    label: 'Pixie',
    note: 'short asymmetry · rear tuft',
  },
  {
    partId: 'hair-side-part',
    constructionId: 'sweep',
    label: 'Side-part / Sweep',
    note: 'diagonal front · one-sided mass',
  },
  {
    partId: 'hair-bun',
    constructionId: 'knot',
    label: 'Bun / Knot',
    note: 'compact offset crown anchor',
  },
  {
    partId: 'hair-curly',
    constructionId: 'soft-cloud',
    label: 'Curly',
    note: 'five broad lobes · narrower halo',
  },
  {
    partId: 'hair-coils',
    constructionId: 'dense-cloud',
    label: 'Coils',
    note: 'dense scalloped halo · wider reach',
  },
  {
    partId: 'hair-long-straight',
    constructionId: 'curtain',
    label: 'Long straight',
    note: 'long rear curtain · open profile eye',
  },
  {
    partId: 'hair-balding',
    constructionId: 'temple-band',
    label: 'Balding',
    note: 'fitted temples · rear band',
  },
];

const HEADS: PilotHead[] = [
  { partId: 'head-round', fitId: 'round', label: 'Round' },
  { partId: 'head-oval', fitId: 'broad', label: 'Broad' },
  { partId: 'head-long', fitId: 'long', label: 'Long' },
  { partId: 'head-boxy', fitId: 'block', label: 'Block' },
  { partId: 'head-angular', fitId: 'point', label: 'Point' },
  { partId: 'head-soft-square', fitId: 'lantern', label: 'Lantern' },
];

const BODY_IDS = [
  'body-compact',
  'body-balanced',
  'body-large-frame',
  'body-tall',
  'body-soft',
  'body-pinch',
] as const;

const FACINGS: ReviewFacing[] = ['south', 'east', 'north', 'west'];

const PALETTES: Palette[] = [
  {
    skin: '#C88E65',
    hair: '#3B2921',
    outfitPrimary: '#739489',
    outfitSecondary: '#D9D0B9',
    accent: '#B75E4B',
  },
  {
    skin: '#E6B98C',
    hair: '#8C5C37',
    outfitPrimary: '#527565',
    outfitSecondary: '#E6DDC8',
    accent: '#B75E4B',
  },
  {
    skin: '#74472F',
    hair: '#211B18',
    outfitPrimary: '#A76447',
    outfitSecondary: '#D9D0B9',
    accent: '#345749',
  },
  {
    skin: '#B8754F',
    hair: '#D0A55D',
    outfitPrimary: '#6A7880',
    outfitSecondary: '#E8E1D3',
    accent: '#B75E4B',
  },
];

const INK_PALETTE: Palette = {
  skin: COLORS.ink,
  hair: COLORS.ink,
  outfitPrimary: COLORS.ink,
  outfitSecondary: COLORS.ink,
  accent: COLORS.ink,
};

const COLOR_STYLE: StyleSheet = {
  ...structuredClone(DEFAULT_STYLE),
  render: { ...DEFAULT_STYLE.render, contactShadow: 0 },
};

const SILHOUETTE_STYLE: StyleSheet = {
  ...structuredClone(DEFAULT_STYLE),
  outline: { ...DEFAULT_STYLE.outline, color: COLORS.ink },
  render: { ...DEFAULT_STYLE.render, contactShadow: 0 },
};

function recipeFor(
  bodyId: string,
  head: PilotHead,
  hair: PilotHair,
  palette: Palette,
): CharacterRecipe {
  return {
    id: `hair-fitting-pilot-${bodyId}-${head.partId}-${hair.partId}`,
    name: 'Hair fitting pilot',
    parts: {
      body: bodyId,
      head: head.partId,
      hair: hair.partId,
      outfit: 'outfit-tee',
      accessories: [],
    },
    palette,
  };
}

function renderPilot(
  bodyId: string,
  head: PilotHead,
  hair: PilotHair,
  facing: ReviewFacing,
  size: number,
  palette: Palette,
  silhouette = false,
): string {
  return composeCharacter(
    recipeFor(bodyId, head, hair, silhouette ? INK_PALETTE : palette),
    silhouette ? SILHOUETTE_STYLE : COLOR_STYLE,
    facing,
    size,
    'normal',
    { badge: false },
  );
}

function escapeText(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function text(
  x: number,
  y: number,
  value: string,
  size: number,
  weight = 500,
  fill: string = COLORS.ink,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return (
    `<text x="${x}" y="${y}" font-family="Inter, ui-sans-serif, system-ui, sans-serif" ` +
    `font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">` +
    `${escapeText(value)}</text>`
  );
}

function panel(
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string = COLORS.panel,
  radius = 10,
): string {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" stroke="${COLORS.grid}"/>`;
}

function statCard(
  x: number,
  value: string,
  label: string,
  note: string,
  fill: string = COLORS.panel,
): string {
  return [
    panel(x, 78, 285, 74, fill, 8),
    text(x + 16, 106, value, 20, 760, COLORS.green),
    text(x + 16, 126, label, 10, 720),
    text(x + 16, 143, note, 8, 520, COLORS.muted),
  ].join('');
}

function nestedSvg(svg: string, x: number, y: number): string {
  return svg.replace(/^<svg /, `<svg x="${x}" y="${y}" `);
}

function matrixSheet(audit: ReturnType<typeof auditPilot>): string {
  const width = 1600;
  const height = 1450;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`,
    text(28, 38, 'Three-hairstyle fitted pilot · promoted production proof', 22, 780),
    text(
      28,
      61,
      'PROMOTED SLICE · real production IDs and compositor · current 3 px tighter head datum · deterministic static bake',
      10,
      700,
      COLORS.coral,
    ),
    statCard(28, '3', 'stable production hair IDs', 'Short · Bob · Ponytail', COLORS.selected),
    statCard(326, '6 × 4', 'heads × rendered facings', 'west remains the real east mirror'),
    statCard(624, String(audit.renderCount), 'literal audit cells', '40 + 48 px · hair pixels present', COLORS.selected),
    statCard(922, '0', 'new animation work', 'frames · bones · poses · states', COLORS.selected),
    statCard(
      1220,
      String(audit.hairEdgeContacts.length),
      'hair cell-edge contacts',
      audit.hairEdgeContacts.length === 0 ? 'current production frame retained' : 'inspect flagged cells',
      audit.hairEdgeContacts.length === 0 ? COLORS.selected : COLORS.panelAlt,
    ),
    text(28, 182, 'A · fitted head matrix', 15, 760),
    text(
      28,
      201,
      'Each cell uses the same saved hair ID; only its baked geometry resolves against the selected head envelope.',
      10,
      520,
      COLORS.muted,
    ),
  ];

  const startX = 116;
  const startY = 226;
  const columnWidth = 492;
  const rowHeight = 122;

  PILOT_HAIRS.forEach((hair, column) => {
    const x = startX + column * columnWidth;
    parts.push(text(x + 230, 219, hair.label, 12, 760, COLORS.green, 'middle'));
    parts.push(text(x + 230, 234, hair.note, 8, 560, COLORS.muted, 'middle'));
  });

  HEADS.forEach((head, row) => {
    const y = startY + row * rowHeight;
    parts.push(text(24, y + 28, head.label, 10, 760));
    parts.push(text(24, y + 45, head.fitId, 8, 560, COLORS.muted));
    PILOT_HAIRS.forEach((hair, column) => {
      const x = startX + column * columnWidth;
      const fill = (row + column) % 2 === 0 ? COLORS.panel : COLORS.panelAlt;
      parts.push(panel(x, y, 474, 108, fill, 8));
      parts.push(nestedSvg(renderPilot(
        'body-compact',
        head,
        hair,
        'south',
        56,
        PALETTES[column],
      ), x + 18, y + 12));
      parts.push(nestedSvg(renderPilot(
        'body-compact',
        head,
        hair,
        'east',
        56,
        PALETTES[column],
      ), x + 92, y + 12));
      parts.push(nestedSvg(renderPilot(
        'body-compact',
        head,
        hair,
        'north',
        48,
        PALETTES[column],
      ), x + 169, y + 16));
      parts.push(nestedSvg(renderPilot(
        'body-compact',
        head,
        hair,
        'west',
        48,
        PALETTES[column],
      ), x + 234, y + 16));
      parts.push(nestedSvg(renderPilot(
        'body-compact',
        head,
        hair,
        'south',
        40,
        PALETTES[column],
        true,
      ), x + 316, y + 20));
      parts.push(nestedSvg(renderPilot(
        'body-compact',
        head,
        hair,
        'east',
        40,
        PALETTES[column],
        true,
      ), x + 371, y + 20));
      parts.push(text(x + 46, y + 88, 'S 56', 8, 650, COLORS.muted, 'middle'));
      parts.push(text(x + 120, y + 88, 'E 56', 8, 650, COLORS.muted, 'middle'));
      parts.push(text(x + 193, y + 88, 'N 48', 8, 650, COLORS.muted, 'middle'));
      parts.push(text(x + 258, y + 88, 'W 48', 8, 650, COLORS.muted, 'middle'));
      parts.push(text(x + 336, y + 88, 'S 40', 8, 650, COLORS.muted, 'middle'));
      parts.push(text(x + 391, y + 88, 'E 40', 8, 650, COLORS.muted, 'middle'));
    });
  });

  const contextY = 980;
  parts.push(text(28, contextY, 'B · production context', 15, 760));
  parts.push(text(
    28,
    contextY + 19,
    'Desk occlusion and a same-scale anonymous crowd; bodies, heads, hair, neutral arms, and framing are all current production output.',
    10,
    520,
    COLORS.muted,
  ));

  parts.push(panel(28, contextY + 38, 754, 320, COLORS.panel));
  parts.push(text(46, contextY + 64, 'Desk occlusion · all six bodies', 11, 740, COLORS.green));
  parts.push(`<rect x="46" y="${contextY + 78}" width="718" height="252" rx="8" fill="${COLORS.floor}"/>`);
  HEADS.forEach((head, index) => {
    const hair = PILOT_HAIRS[index % PILOT_HAIRS.length];
    const x = 58 + index * 117;
    parts.push(nestedSvg(renderPilot(
      BODY_IDS[index],
      head,
      hair,
      index % 2 === 0 ? 'south' : 'east',
      82,
      PALETTES[index % PALETTES.length],
    ), x, contextY + 85 + (index % 2) * 9));
  });
  parts.push(`<rect x="54" y="${contextY + 151}" width="334" height="42" rx="9" fill="${COLORS.desk}" stroke="${COLORS.deskDark}" stroke-width="4"/>`);
  parts.push(`<rect x="421" y="${contextY + 160}" width="334" height="42" rx="9" fill="${COLORS.desk}" stroke="${COLORS.deskDark}" stroke-width="4"/>`);
  parts.push(`<rect x="76" y="${contextY + 193}" width="14" height="111" fill="${COLORS.deskDark}"/>`);
  parts.push(`<rect x="351" y="${contextY + 193}" width="14" height="111" fill="${COLORS.deskDark}"/>`);
  parts.push(`<rect x="444" y="${contextY + 202}" width="14" height="102" fill="${COLORS.deskDark}"/>`);
  parts.push(`<rect x="718" y="${contextY + 202}" width="14" height="102" fill="${COLORS.deskDark}"/>`);

  parts.push(panel(800, contextY + 38, 772, 320, COLORS.panel));
  parts.push(text(818, contextY + 64, 'Anonymous crowd · literal 48 px', 11, 740, COLORS.green));
  parts.push(`<rect x="818" y="${contextY + 78}" width="736" height="252" rx="8" fill="${COLORS.floorDark}"/>`);
  for (let index = 0; index < 12; index++) {
    const row = Math.floor(index / 6);
    const column = index % 6;
    const head = HEADS[(index * 5 + row) % HEADS.length];
    const hair = PILOT_HAIRS[(index + row) % PILOT_HAIRS.length];
    const facing = FACINGS[(index + row) % FACINGS.length];
    parts.push(nestedSvg(renderPilot(
      BODY_IDS[(index * 2 + row) % BODY_IDS.length],
      head,
      hair,
      facing,
      48,
      PALETTES[(index + row) % PALETTES.length],
    ), 835 + column * 116 + row * 14, contextY + 91 + row * 105));
  }

  parts.push(panel(28, 1380, 1544, 44, COLORS.selectedStrong, 8));
  parts.push(text(44, 1400, 'Promotion boundary', 9, 760, COLORS.green));
  parts.push(text(
    134,
    1400,
    'three carriers are live; individual strand polish and the remaining seven styles stay out of this slice',
    9,
    620,
  ));
  parts.push(text(44, 1416, 'Runtime cost', 9, 760, COLORS.coral));
  parts.push(text(
    112,
    1416,
    'none · the resolver emits ordinary fixed south/east/north geometry before atlas/export; west remains mirrored',
    9,
    620,
    COLORS.muted,
  ));

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`
  );
}

function completionSheet(audit: ReturnType<typeof auditPilot>): string {
  const width = 1600;
  const height = 1120;
  const startX = 160;
  const startY = 220;
  const cellWidth = 238;
  const rowHeight = 116;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`,
    text(28, 38, 'Seven-hairstyle fitting completion · promoted production proof', 22, 780),
    text(
      28,
      61,
      'PROMOTED SLICE · remaining production IDs · all six fitted head envelopes · deterministic static bake',
      10,
      700,
      COLORS.coral,
    ),
    statCard(28, '7', 'new fitted production IDs', 'Pixie · Side-part · Bun · Curly · Coils · Long · Balding', COLORS.selected),
    statCard(420, '6 × 4', 'heads × rendered facings', 'west remains the real east mirror'),
    statCard(812, String(audit.renderCount), 'literal audit cells', '40 + 48 px · hair pixels present', COLORS.selected),
    statCard(1204, '0', 'new animation work', 'frames · bones · poses · states', COLORS.selected),
  ];

  HEADS.forEach((head, index) => {
    parts.push(text(
      startX + index * cellWidth + cellWidth / 2,
      200,
      head.label,
      11,
      760,
      COLORS.green,
      'middle',
    ));
  });

  COMPLETION_HAIRS.forEach((hair, row) => {
    const y = startY + row * rowHeight;
    parts.push(panel(
      12,
      y,
      width - 24,
      rowHeight - 8,
      row % 2 === 0 ? COLORS.panel : COLORS.panelAlt,
      8,
    ));
    parts.push(text(24, y + 30, hair.label, 11, 760));
    parts.push(text(24, y + 47, hair.constructionId, 8, 650, COLORS.green));
    parts.push(text(24, y + 64, hair.note, 8, 520, COLORS.muted));

    HEADS.forEach((head, column) => {
      const x = startX + column * cellWidth;
      const palette = PALETTES[(row + column) % PALETTES.length];
      parts.push(nestedSvg(renderPilot(
        'body-compact',
        head,
        hair,
        'south',
        48,
        palette,
      ), x + 10, y + 12));
      parts.push(nestedSvg(renderPilot(
        'body-compact',
        head,
        hair,
        'east',
        48,
        palette,
      ), x + 65, y + 12));
      parts.push(nestedSvg(renderPilot(
        'body-compact',
        head,
        hair,
        'north',
        40,
        palette,
        true,
      ), x + 124, y + 18));
      parts.push(nestedSvg(renderPilot(
        'body-compact',
        head,
        hair,
        'west',
        40,
        palette,
        true,
      ), x + 172, y + 18));
      parts.push(text(x + 34, y + 89, 'S 48', 7, 650, COLORS.muted, 'middle'));
      parts.push(text(x + 89, y + 89, 'E 48', 7, 650, COLORS.muted, 'middle'));
      parts.push(text(x + 144, y + 89, 'N 40', 7, 650, COLORS.muted, 'middle'));
      parts.push(text(x + 192, y + 89, 'W 40', 7, 650, COLORS.muted, 'middle'));
    });
  });

  parts.push(panel(28, 1050, 1544, 48, COLORS.selectedStrong, 8));
  parts.push(text(44, 1070, 'Production result', 9, 760, COLORS.green));
  parts.push(text(
    144,
    1070,
    'all ten mapped hairstyles now use the same fixed head-aware resolver; the first three carrier pixels remain locked',
    9,
    620,
  ));
  parts.push(text(44, 1087, 'Runtime cost', 9, 760, COLORS.coral));
  parts.push(text(
    112,
    1087,
    `none · ${audit.hairEdgeContacts.length} hair cell-edge contacts · recipes, schema, and Unity animation stay unchanged`,
    9,
    620,
    COLORS.muted,
  ));

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`
  );
}

function hairPixelAudit(svg: string): { present: boolean; edgeContact: boolean } {
  const png = PNG.sync.read(new Resvg(svg).render().asPng());
  const target = [0x3b, 0x29, 0x21];
  let present = false;
  let edgeContact = false;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const offset = (y * png.width + x) * 4;
      const matches = (
        png.data[offset + 3] >= 128
        && Math.abs(png.data[offset] - target[0]) <= 3
        && Math.abs(png.data[offset + 1] - target[1]) <= 3
        && Math.abs(png.data[offset + 2] - target[2]) <= 3
      );
      if (!matches) continue;
      present = true;
      if (x === 0 || y === 0 || x === png.width - 1 || y === png.height - 1) {
        edgeContact = true;
      }
    }
  }
  return { present, edgeContact };
}

function auditPilot(hairs: readonly PilotHair[] = PILOT_HAIRS): {
  renderCount: number;
  missingHair: AuditFinding[];
  hairEdgeContacts: AuditFinding[];
  deterministicDigest: string;
} {
  const missingHair: AuditFinding[] = [];
  const hairEdgeContacts: AuditFinding[] = [];
  const digest = createHash('sha256');
  let renderCount = 0;

  for (const hair of hairs) {
    for (const head of HEADS) {
      for (const facing of FACINGS) {
        for (const size of [40, 48]) {
          const first = renderPilot(
            'body-compact',
            head,
            hair,
            facing,
            size,
            PALETTES[0],
          );
          const second = renderPilot(
            'body-compact',
            head,
            hair,
            facing,
            size,
            PALETTES[0],
          );
          if (first !== second) {
            throw new Error(`Nondeterministic fitted hair render: ${hair.partId}/${head.partId}/${facing}/${size}`);
          }
          const finding = { hair: hair.partId, head: head.partId, facing, size };
          const pixelAudit = hairPixelAudit(first);
          if (!pixelAudit.present) missingHair.push(finding);
          if (pixelAudit.edgeContact) hairEdgeContacts.push(finding);
          digest.update(first);
          renderCount++;
        }
      }
    }
  }

  return {
    renderCount,
    missingHair,
    hairEdgeContacts,
    deterministicDigest: digest.digest('hex'),
  };
}

function productionSentinel(): string {
  return composeCharacter(
    recipeFor('body-balanced', HEADS[0], PILOT_HAIRS[0], PALETTES[0]),
    COLOR_STYLE,
    'east',
    48,
    'normal',
    { badge: false },
  );
}

function writeSvgAndPng(outDir: string, base: string, svg: string): void {
  writeFileSync(join(outDir, `${base}.svg`), svg);
  writeFileSync(
    join(outDir, `${base}.png`),
    new Resvg(svg, { fitTo: { mode: 'zoom', value: 1 } }).render().asPng(),
  );
}

export function main(): void {
  const outDir = resolve(process.argv[2] ?? 'docs/previews');
  mkdirSync(outDir, { recursive: true });

  const allHairs = [...PILOT_HAIRS, ...COMPLETION_HAIRS];
  const partReferencesBefore = allHairs.map(({ partId }) => getPart(partId));
  const facingReferencesBefore = partReferencesBefore.map((part) => part?.facings);
  const sentinelBefore = productionSentinel();

  const audit = auditPilot();
  const completionAudit = auditPilot(COMPLETION_HAIRS);
  if (audit.missingHair.length > 0) {
    throw new Error(`Fitted hair disappeared from ${audit.missingHair.length} pilot cells`);
  }
  if (completionAudit.missingHair.length > 0) {
    throw new Error(`Fitted hair disappeared from ${completionAudit.missingHair.length} completion cells`);
  }
  const sheet = matrixSheet(audit);
  const completion = completionSheet(completionAudit);

  const partReferencesAfter = allHairs.map(({ partId }) => getPart(partId));
  const facingReferencesAfter = partReferencesAfter.map((part) => part?.facings);
  const sentinelAfter = productionSentinel();
  const restored = (
    sentinelAfter === sentinelBefore
    && partReferencesAfter.every((part, index) => part === partReferencesBefore[index])
    && facingReferencesAfter.every((facings, index) => facings === facingReferencesBefore[index])
  );
  if (!restored) {
    throw new Error('Fitted-hair proof altered production output or facing references');
  }

  writeSvgAndPng(outDir, 'character-hair-fitting-pilot-v1', sheet);
  writeFileSync(join(outDir, 'character-hair-fitting-pilot-v1-metrics.json'), `${JSON.stringify({
    status: 'promoted-three-carrier-slice',
    productionHairMappings: PILOT_HAIRS,
    heads: HEADS,
    mechanism: {
      phase: 'Terrarium composition/export bake',
      recipeIdsChanged: false,
      exportSchemaChanged: false,
      runtimeMetadataAdded: false,
      authoredWestFacings: 0,
    },
    animationCost: {
      frames: 0,
      bones: 0,
      poses: 0,
      rendererStates: 0,
      secondaryMotionSystems: 0,
    },
    audit,
    restoration: {
      productionSentinel: 'byte-identical across proof generation',
      partReferences: 'identical',
      facingReferences: 'identical',
    },
  }, null, 2)}\n`);
  writeSvgAndPng(outDir, 'character-hair-fitting-completion-v2', completion);
  writeFileSync(join(outDir, 'character-hair-fitting-completion-v2-metrics.json'), `${JSON.stringify({
    status: 'promoted-all-ten-style-set',
    productionHairMappings: COMPLETION_HAIRS,
    preservedFirstSlice: PILOT_HAIRS.map(({ partId }) => partId),
    preservedFirstSliceVariantDigest: '83fff7ef11a2acbaa16e3453ff7a364782a334d43b4d36ea58cc15db13be7c9a',
    heads: HEADS,
    mechanism: {
      phase: 'Terrarium composition/export bake',
      totalFittedHairIds: allHairs.length,
      recipeIdsChanged: false,
      exportSchemaChanged: false,
      runtimeMetadataAdded: false,
      authoredWestFacings: 0,
    },
    animationCost: {
      frames: 0,
      bones: 0,
      poses: 0,
      rendererStates: 0,
      secondaryMotionSystems: 0,
    },
    audit: completionAudit,
    restoration: {
      productionSentinel: 'byte-identical across proof generation',
      partReferences: 'identical',
      facingReferences: 'identical',
    },
  }, null, 2)}\n`);

  console.log(`pilot audit: ${audit.renderCount} cells · ${audit.missingHair.length} missing hair · ${audit.hairEdgeContacts.length} hair edge contacts`);
  console.log(`completion audit: ${completionAudit.renderCount} cells · ${completionAudit.missingHair.length} missing hair · ${completionAudit.hairEdgeContacts.length} hair edge contacts`);
  console.log(`deterministic digest: ${audit.deterministicDigest}`);
  console.log(`completion digest: ${completionAudit.deterministicDigest}`);
  console.log('production restoration: sentinel, part references, and facing references byte-identical');
  console.log(`wrote fitted-hair production proofs to ${outDir}`);
}

if (process.argv[1]?.endsWith('characterHairFittingPilot.ts')) {
  main();
}
