/**
 * State-icon preview sheet — the legibility acceptance artifact for the
 * UI-STATE-ICON set (src/parts/stateIcons.ts): every `state-*` icon rendered at
 * 24 px, tinted near-black on a light chrome swatch and near-white on a dark
 * chrome swatch, so both themes are checked BEFORE the export ships.
 *
 *   npx tsx scripts/stateIconPreview.ts [outDir]        (default docs/previews)
 *
 * Writes:
 *   state-icons-preview.html      — labeled, browsable sheet (inline SVG)
 *   state-icons-preview.png       — pixel-true 24 px contact sheet
 *   state-icons-preview@4x.png    — the same sheet at 4× for close art review
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

import { composeIcon } from '../src/core/compositor';
import { STATE_ICONS } from '../src/parts/stateIcons';

const THEMES = [
  { name: 'light chrome', panel: '#ECEFF1', tint: '#141B1F', label: '#3A464C' },
  { name: 'dark chrome', panel: '#0A1217', tint: '#E9EEF0', label: '#93A2A9' },
] as const;

const ICON = 24; // rendered size under test
const BOX = 36; // grid cell (icon + breathing room)
const COLS = 8;

/** composeIcon emits tintable icons as pure-white masks — recolor by replace. */
function tintedSvg(id: string, tint: string): string {
  return composeIcon(id).replaceAll('#FFFFFF', tint);
}

/** Strip the <svg> wrapper so the markup can be placed in a larger sheet. */
function svgInner(svg: string): string {
  return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

function pngSheet(): string {
  const rows = Math.ceil(STATE_ICONS.length / COLS);
  const panelW = COLS * BOX;
  const panelH = rows * BOX;
  const gap = 8;
  const parts: string[] = [];
  THEMES.forEach((theme, t) => {
    const py = t * (panelH + gap);
    parts.push(`<rect x="0" y="${py}" width="${panelW}" height="${panelH}" fill="${theme.panel}"/>`);
    STATE_ICONS.forEach((icon, i) => {
      const x = (i % COLS) * BOX + (BOX - ICON) / 2;
      const y = py + Math.floor(i / COLS) * BOX + (BOX - ICON) / 2;
      parts.push(
        `<g transform="translate(${x} ${y}) scale(${ICON / 128})">${svgInner(tintedSvg(icon.id, theme.tint))}</g>`,
      );
    });
  });
  const h = panelH * THEMES.length + gap * (THEMES.length - 1);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${panelW}" height="${h}" viewBox="0 0 ${panelW} ${h}">${parts.join('')}</svg>`;
}

function htmlSheet(): string {
  const panels = THEMES.map((theme) => {
    const cells = STATE_ICONS.map((icon) => {
      const svg = tintedSvg(icon.id, theme.tint).replace(/^<svg /, `<svg width="${ICON}" height="${ICON}" `);
      return `<div class="cell">${svg}<span style="color:${theme.label}">${icon.id}</span></div>`;
    }).join('\n');
    return `<section style="background:${theme.panel}"><h2 style="color:${theme.label}">${theme.name} — ${ICON}px, tint ${theme.tint}</h2><div class="grid">\n${cells}\n</div></section>`;
  }).join('\n');
  return `<!doctype html>
<meta charset="utf-8"><title>UI-STATE-ICON preview — ${STATE_ICONS.length} icons</title>
<style>
  body { margin: 0; font: 12px/1.4 system-ui, sans-serif; }
  section { padding: 16px 20px 24px; }
  h2 { font-size: 13px; font-weight: 600; margin: 0 0 12px; }
  .grid { display: grid; grid-template-columns: repeat(6, minmax(120px, 1fr)); gap: 14px 10px; }
  .cell { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .cell span { font-size: 10px; word-break: break-all; text-align: center; }
</style>
${panels}`;
}

function main() {
  const outDir = resolve(process.argv[2] ?? 'docs/previews');
  mkdirSync(outDir, { recursive: true });
  const sheet = pngSheet();
  writeFileSync(join(outDir, 'state-icons-preview.html'), htmlSheet());
  writeFileSync(join(outDir, 'state-icons-preview.png'), new Resvg(sheet).render().asPng());
  writeFileSync(
    join(outDir, 'state-icons-preview@4x.png'),
    new Resvg(sheet, { fitTo: { mode: 'zoom', value: 4 } }).render().asPng(),
  );
  console.log(`wrote state-icons-preview.{html,png,@4x.png} (${STATE_ICONS.length} icons) to ${outDir}`);
}

main();
