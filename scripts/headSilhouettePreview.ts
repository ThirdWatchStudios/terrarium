/**
 * Human head-silhouette review surface.
 *
 *   npx tsx scripts/headSilhouettePreview.ts [outDir]
 *
 * Renders the previous procedural head geometry beside the active production
 * compositor result, plus a representative hair/head-accessory compatibility
 * sheet. The baseline swap is process-local; repository art is never changed.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import { composeCharacter } from '../src/core/compositor';
import { ellipse, rr } from '../src/core/geometry';
import type { CharacterRecipe, Facing, ShapeSpec } from '../src/core/types';
import { DEFAULT_STYLE } from '../src/data/defaults';
import { getPart } from '../src/parts/library';

const CANVAS = 128;
const FACINGS = ['south', 'east', 'north'] as const;
const SIZES = [128, 64, 48, 32] as const;

const HEADS = [
  ['head-round', 'Round'],
  ['head-oval', 'Oval'],
  ['head-boxy', 'Boxy'],
  ['head-long', 'Long'],
  ['head-angular', 'Angular'],
  ['head-soft-square', 'Soft square'],
] as const;

const COLORS = {
  page: '#F1EEE7',
  panel: '#FFFEFA',
  alternate: '#E8E4DC',
  ink: '#2F3538',
  muted: '#68747A',
  border: '#D4CEC2',
} as const;

const PALETTE = {
  skin: '#C68B59',
  hair: '#34251C',
  outfitPrimary: '#315A78',
  outfitSecondary: '#E8D6A8',
  accent: '#E4A62A',
};

/** Frozen pre-authoring geometry, retained only for the visual comparison. */
const PREVIOUS_SILHOUETTES: Readonly<
  Record<string, Readonly<Record<Facing, string>>>
> = {
  'head-oval': {
    south: ellipse(0, 0, 19, 22),
    east: ellipse(0, 0, 19, 22),
    north: ellipse(0, 0, 19, 22),
  },
  'head-boxy': {
    south: rr(-19, -20, 38, 40, 13),
    east: rr(-19, -20, 38, 40, 13),
    north: rr(-19, -20, 38, 40, 13),
  },
  'head-long': {
    south: ellipse(0, 1, 17, 24),
    east: ellipse(1, 1, 16, 24),
    north: ellipse(0, 1, 17, 24),
  },
  'head-angular': {
    south: 'M -16 -17 L 9 -20 L 19 -8 L 17 12 L 7 22 L -10 20 L -20 8 L -20 -7 Z',
    east: 'M -13 -18 L 8 -20 L 19 -8 L 17 12 L 6 22 L -11 18 L -18 4 Z',
    north: 'M -16 -17 L 9 -20 L 19 -8 L 17 12 L 7 22 L -10 20 L -20 8 L -20 -7 Z',
  },
  'head-soft-square': {
    south: rr(-18, -19, 36, 41, 9),
    east: rr(-16, -19, 33, 41, 9),
    north: rr(-18, -19, 36, 41, 9),
  },
};

const COMPATIBILITY_CASES = [
  ['south', 'hair-short', 'acc-glasses', 'short + glasses'],
  ['south', 'hair-bob', 'acc-earbuds', 'bob + earbuds'],
  ['south', 'hair-balding', 'acc-headset', 'balding + headset'],
  ['east', 'hair-side-part', 'acc-glasses', 'side-part + glasses'],
  ['east', 'hair-ponytail', 'acc-hard-hat', 'ponytail + hard hat'],
  ['east', 'hair-coils', 'acc-earbuds', 'coils + earbuds'],
  ['north', 'hair-long-straight', 'acc-headset', 'long hair + headset'],
  ['north', 'hair-curly', 'acc-hard-hat', 'curly + hard hat'],
] as const satisfies readonly (readonly [Facing, string, string, string])[];

function recipe(
  head: string,
  hair = 'hair-none',
  accessories: string[] = [],
): CharacterRecipe {
  return {
    id: `head-preview-${head}`,
    name: 'Head silhouette preview',
    parts: {
      body: 'body-balanced',
      head,
      hair,
      outfit: 'outfit-tee',
      accessories,
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

function renderHeadCells(): Map<string, string> {
  return new Map(
    HEADS.flatMap(([head]) => FACINGS.map((facing) => {
      const key = `${head}/${facing}`;
      const svg = composeCharacter(
        recipe(head),
        DEFAULT_STYLE,
        facing,
        CANVAS,
        'normal',
        { badge: false },
      );
      return [key, svg] as const;
    })),
  );
}

function snapshotProductionSilhouettes(): Map<string, ShapeSpec> {
  const result = new Map<string, ShapeSpec>();
  for (const [head] of HEADS) {
    const part = getPart(head);
    if (!part) throw new Error(`Missing production head ${head}`);
    for (const facing of FACINGS) {
      const variant = part.facings[facing];
      const shape = variant?.shapes[0];
      if (!variant || !shape) throw new Error(`Missing production head facing ${head}/${facing}`);
      result.set(`${head}/${facing}`, { ...shape });
    }
  }
  return result;
}

function installPreviousSilhouettes(production: ReadonlyMap<string, ShapeSpec>): void {
  for (const [head] of HEADS) {
    const part = getPart(head)!;
    for (const facing of FACINGS) {
      const previous = PREVIOUS_SILHOUETTES[head]?.[facing];
      const shape = production.get(`${head}/${facing}`)!;
      part.facings[facing]!.shapes[0] = previous ? { ...shape, d: previous } : { ...shape };
    }
  }
}

function restoreProductionSilhouettes(production: ReadonlyMap<string, ShapeSpec>): void {
  for (const [head] of HEADS) {
    const part = getPart(head)!;
    for (const facing of FACINGS) {
      part.facings[facing]!.shapes[0] = { ...production.get(`${head}/${facing}`)! };
    }
  }
}

function comparisonSheet(previous: ReadonlyMap<string, string>, production: ReadonlyMap<string, string>): string {
  const labelWidth = 150;
  const panelWidth = 220;
  const rowHeight = 170;
  const headerHeight = 88;
  const width = labelWidth + panelWidth * 6 + 12;
  const height = headerHeight + rowHeight * HEADS.length + 10;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`,
    text(20, 30, 'Human head silhouettes — previous procedural vs approved production', 22, 700),
    text(20, 52, 'Body-balanced · no hair/accessories · literal 128 / 64 / 48 / 32 px compositor renders', 12, 400, COLORS.muted),
  ];

  FACINGS.forEach((facing, facingIndex) => {
    (['previous', 'authored'] as const).forEach((mode, modeIndex) => {
      const column = facingIndex * 2 + modeIndex;
      parts.push(text(labelWidth + column * panelWidth + 10, 78, `${mode} ${facing}`, 11, 650, COLORS.muted));
    });
  });

  HEADS.forEach(([head, label], row) => {
    const y = headerHeight + row * rowHeight;
    parts.push(`<rect x="8" y="${y + 4}" width="${width - 16}" height="${rowHeight - 8}" rx="8" fill="${row % 2 ? COLORS.alternate : COLORS.panel}"/>`);
    parts.push(text(20, y + 40, label, 15, 700));
    parts.push(text(20, y + 60, head === 'head-round' ? `${head} · control` : head, 10, 400, COLORS.muted));

    FACINGS.forEach((facing, facingIndex) => {
      ([previous, production] as const).forEach((cells, modeIndex) => {
        const column = facingIndex * 2 + modeIndex;
        const x = labelWidth + column * panelWidth;
        const svg = cells.get(`${head}/${facing}`);
        if (!svg) throw new Error(`Missing comparison cell ${head}/${facing}`);
        parts.push(`<rect x="${x}" y="${y + 10}" width="${panelWidth - 7}" height="148" rx="5" fill="#FFFFFF" stroke="${COLORS.border}"/>`);
        parts.push(`<g transform="translate(${x + 3} ${y + 14})">${svgInner(svg)}</g>`);

        let smallY = y + 18;
        for (const size of SIZES.slice(1)) {
          parts.push(`<g transform="translate(${x + 140} ${smallY}) scale(${size / CANVAS})">${svgInner(svg)}</g>`);
          parts.push(text(x + 207, smallY + Math.min(size, 14), String(size), 9, 400, '#798286', 'text-anchor="end"'));
          smallY += size + 3;
        }
      });
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function compatibilitySheet(): string {
  const labelWidth = 145;
  const cellStride = 88;
  const renderSize = 80;
  const headerHeight = 126;
  const rowHeight = 92;
  const width = labelWidth + cellStride * COMPATIBILITY_CASES.length + 12;
  const height = headerHeight + rowHeight * HEADS.length + 8;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${COLORS.page}"/>`,
    text(18, 28, 'Approved production heads — hair and head-accessory tangents', 20, 700),
    text(18, 49, '80 px review cells · all geometry uses the unchanged headCenter anchor', 11, 400, COLORS.muted),
  ];

  COMPATIBILITY_CASES.forEach(([facing, , , label], index) => {
    const x = labelWidth + index * cellStride + 9;
    parts.push(text(
      x,
      115,
      `${facing} · ${label}`,
      9,
      600,
      COLORS.muted,
      `transform="rotate(-30 ${x} 115)"`,
    ));
  });

  HEADS.forEach(([head, label], row) => {
    const y = headerHeight + row * rowHeight;
    parts.push(`<rect x="8" y="${y + 2}" width="${width - 16}" height="${rowHeight - 4}" rx="7" fill="${row % 2 ? COLORS.alternate : COLORS.panel}"/>`);
    parts.push(text(18, y + 39, label, 14, 700));
    parts.push(text(18, y + 57, head, 9, 400, COLORS.muted));

    COMPATIBILITY_CASES.forEach(([facing, hair, accessory], column) => {
      const x = labelWidth + column * cellStride;
      const svg = composeCharacter(
        recipe(head, hair, [accessory]),
        DEFAULT_STYLE,
        facing,
        CANVAS,
        'normal',
        { badge: false },
      );
      parts.push(`<rect x="${x + 2}" y="${y + 5}" width="${renderSize + 4}" height="${renderSize + 4}" rx="4" fill="#FFFFFF" stroke="${COLORS.border}"/>`);
      parts.push(`<g transform="translate(${x + 4} ${y + 7}) scale(${renderSize / CANVAS})">${svgInner(svg)}</g>`);
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function html(): string {
  return `<!doctype html>
<meta charset="utf-8">
<title>Terrarium authored head silhouette review</title>
<style>
  body { margin: 0; padding: 24px; background: ${COLORS.page}; color: ${COLORS.ink}; font: 14px/1.45 system-ui, sans-serif; }
  main { max-width: 1500px; margin: 0 auto; }
  h1 { margin: 0 0 8px; }
  .notice { border-left: 4px solid #4F91A8; padding: 10px 14px; background: #fff; }
  img { display: block; max-width: 100%; height: auto; margin: 16px 0 32px; border: 1px solid ${COLORS.border}; }
</style>
<main>
  <h1>Authored head silhouette review</h1>
  <p class="notice">The approved production family keeps one stable head anchor and eye convention while separating Round, Oval, Boxy, Long, Angular, and Soft square at game scale. The sources remain easy to refine without changing their runtime ids.</p>
  <h2>Previous procedural geometry vs approved production art</h2>
  <img src="head-silhouettes-preview.png" alt="Previous and approved production head silhouettes across source facings and game sizes">
  <h2>Hair and head-accessory tangents</h2>
  <img src="head-silhouettes-compatibility.png" alt="Approved production heads with representative hair and head accessories">
</main>`;
}

function writeSvgAndPng(outDir: string, base: string, svg: string): void {
  writeFileSync(join(outDir, `${base}.svg`), svg);
  writeFileSync(join(outDir, `${base}.png`), new Resvg(svg).render().asPng());
}

function main(): void {
  const outDir = resolve(process.argv[2] ?? 'docs/previews');
  mkdirSync(outDir, { recursive: true });

  const productionShapes = snapshotProductionSilhouettes();
  const productionCells = renderHeadCells();
  installPreviousSilhouettes(productionShapes);
  const previousCells = renderHeadCells();
  restoreProductionSilhouettes(productionShapes);

  writeSvgAndPng(
    outDir,
    'head-silhouettes-preview',
    comparisonSheet(previousCells, productionCells),
  );
  writeSvgAndPng(
    outDir,
    'head-silhouettes-compatibility',
    compatibilitySheet(),
  );
  writeFileSync(join(outDir, 'head-silhouettes-preview.html'), html());

  console.log(`wrote authored head silhouette and compatibility proofs to ${outDir}`);
}

main();
