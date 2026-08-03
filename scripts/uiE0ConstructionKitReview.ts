/**
 * UI-E0 review-only construction kit and literal-scale gate.
 *
 * Writes only docs/previews/ui-e0-construction-kit-v3. It does not alter
 * canonical sources, live builders, export/import contracts, Unity assets, or
 * runtime implementation.
 *
 * Run with:
 *   npx tsx scripts/uiE0ConstructionKitReview.ts
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

import { Resvg } from '@resvg/resvg-js';

import { composeIcon } from '../src/core/compositor';
import { CURSORS, ICONS, getIcon } from '../src/parts/icons';
import { EMOTION_ICONS } from '../src/parts/emotions';
import { REACTION_ICONS } from '../src/parts/reactions';
import { STATE_ICONS } from '../src/parts/stateIcons';

const OUTPUT = 'docs/previews/ui-e0-construction-kit-v3';
const REFERENCE_WORLD =
  '/Users/tombiagioni/.codex/generated_images/019fc31e-f42d-7f23-b0ee-6635d674450b/exec-1244ea64-482b-4484-b7c9-576da0a93593.png';
const UNITY_IMPORT_ROOT =
  '/Users/tombiagioni/git/The-Water-Cooler/Assets/WaterCooler/Generated/SpriteToolkitImports/water-cooler-sprites-20260803-113055';
const REFERENCE_IMAGES = [
  '/Users/tombiagioni/.codex/generated_images/019f9540-34ff-77d0-ac5c-f32564192819/exec-d9c50912-2e08-4833-9b8d-a80a56ab4b3c.png',
  '/Users/tombiagioni/.codex/generated_images/019f9540-34ff-77d0-ac5c-f32564192819/exec-f9b360cc-1ed5-4574-a9ec-017796f9657a.png',
  REFERENCE_WORLD,
] as const;

const C = {
  page: '#292A22',
  pageDeep: '#202119',
  chassis: '#5E5A45',
  sleeve: '#666047',
  well: '#343429',
  wellDeep: '#25261F',
  record: '#A99C7F',
  recordLight: '#C8B995',
  recordDark: '#81765E',
  select: '#405F52',
  selectLight: '#7FA99A',
  focus: '#A9D3C7',
  iris: '#06141E',
  irisMid: '#0D2731',
  irisLine: '#82B8BA',
  capture: '#D08010',
  rust: '#984820',
  rose: '#A45A6C',
  ink: '#25251E',
  cream: '#D9CBA8',
  creamMuted: '#B8AD90',
  disabled: '#77725F',
  rule: '#1C1D17',
  worldLight: '#B6AD94',
  worldDark: '#252720',
} as const;

const displayFont = 'Avenir Next Condensed,Arial Narrow,sans-serif';
const bodyFont = 'Avenir Next,Segoe UI,sans-serif';
const monoFont = 'Menlo,Consolas,monospace';
const printFont = 'Courier New,Courier,monospace';
const irisDisplayFont = 'Monaco,Andale Mono,monospace';
const irisBodyFont = 'Andale Mono,Menlo,monospace';

type TextAnchor = 'start' | 'middle' | 'end';
type State = 'default' | 'hover' | 'focus' | 'pressed' | 'selected' | 'disabled' | 'invalid';

function esc(value: string): string {
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
  size = 16,
  color: string = C.cream,
  weight = 500,
  anchor: TextAnchor = 'start',
  family: string = bodyFont,
  letterSpacing = 0,
): string {
  return `<text x="${x}" y="${y}" fill="${color}" font-family="${family}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" letter-spacing="${letterSpacing}">${esc(value)}</text>`;
}

function multiline(
  x: number,
  y: number,
  lines: readonly string[],
  size = 15,
  color: string = C.creamMuted,
  lineHeight = 22,
  family: string = bodyFont,
  weight = 400,
): string {
  return lines.map((line, index) => text(x, y + index * lineHeight, line, size, color, weight, 'start', family)).join('');
}

function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke = 'none',
  strokeWidth = 0,
  radius = 0,
  extra = '',
): string {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" ${extra}/>`;
}

function line(x1: number, y1: number, x2: number, y2: number, color: string = C.creamMuted, width = 1): string {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"/>`;
}

function svgBody(svg: string): string {
  return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

function icon(id: string, x: number, y: number, size: number, tint: string = C.cream): string {
  const definition = getIcon(id);
  if (!definition) throw new Error(`Missing icon ${id}`);
  const composed = composeIcon(id, 128);
  const colored = definition.mode === 'tintable' ? composed.replaceAll('#FFFFFF', tint) : composed;
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 128 128">${svgBody(colored)}</svg>`;
}

function focusCorners(x: number, y: number, width: number, height: number, scale = 1): string {
  const o = 5 * scale;
  const arm = 10 * scale;
  const sw = Math.max(1.5, 2 * scale);
  const left = x - o;
  const top = y - o;
  const right = x + width + o;
  const bottom = y + height + o;
  return [
    `M ${left + arm} ${top} H ${left} V ${top + arm}`,
    `M ${right - arm} ${top} H ${right} V ${top + arm}`,
    `M ${left} ${bottom - arm} V ${bottom} H ${left + arm}`,
    `M ${right} ${bottom - arm} V ${bottom} H ${right - arm}`,
  ].map((path) => `<path d="${path}" fill="none" stroke="${C.focus}" stroke-width="${sw}"/>`).join('');
}

function reviewGlyph(name: string, x: number, y: number, size: number, color: string = C.cream): string {
  const s = size / 24;
  const p = (value: string, fill: string = 'none', stroke: string = color, width = 2): string =>
    `<path d="${value}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="square" stroke-linejoin="miter"/>`;
  let body = '';
  switch (name) {
    case 'check': body = p('M4 12l5 5L20 6'); break;
    case 'minus': body = p('M5 12h14'); break;
    case 'alert': body = `${p('M12 3L22 21H2Z')} ${p('M12 8v6')} ${p('M12 18h.01')}`; break;
    case 'search': body = `${p('M10 4a6 6 0 1 0 0 12a6 6 0 0 0 0-12z')} ${p('M15 15l5 5')}`; break;
    case 'undo': body = `${p('M9 7H4v-5')} ${p('M4 7c3-4 8-5 12-2s5 8 2 12c-2 3-6 4-9 2')}`; break;
    case 'redo': body = `${p('M15 7h5v-5')} ${p('M20 7c-3-4-8-5-12-2s-5 8-2 12c2 3 6 4 9 2')}`; break;
    case 'rotate': body = `${p('M18 8V3l4 4-4 4V8a7 7 0 1 0 1 8')} `; break;
    case 'person': body = `${p('M12 4a4 4 0 1 0 0 8a4 4 0 0 0 0-8z')} ${p('M4 22c0-5 3-8 8-8s8 3 8 8')}`; break;
    case 'room': body = `${p('M4 4h16v16H4z')} ${p('M12 4v16')}`; break;
    case 'wrench': body = `${p('M14 5a5 5 0 0 0-6 6L3 16l5 5 5-5a5 5 0 0 0 6-6l-4 1-2-2 1-4z')}`; break;
    case 'link': body = `${p('M9 15l6-6')} ${p('M7 17H5a4 4 0 0 1 0-8h4')} ${p('M17 7h2a4 4 0 0 1 0 8h-4')}`; break;
    case 'flag': body = `${p('M5 22V3')} ${p('M5 4h12l-2 4 2 4H5')}`; break;
    case 'route': body = `${p('M4 19h4V6h8v12h4')} ${p('M2 19h4')} ${p('M18 18h4')}`; break;
    case 'caret': body = p('M8 10l4 4 4-4'); break;
    default: body = p('M5 5h14v14H5z'); break;
  }
  return `<g transform="translate(${x} ${y}) scale(${s})">${body}</g>`;
}

function panel(x: number, y: number, width: number, height: number, fill: string = C.chassis): string {
  return [
    rect(x + 3, y + 5, width, height, '#11120E88', 'none', 0, 4),
    rect(x, y, width, height, fill, '#181914', 2, 3),
    line(x + 1, y + 1, x + width - 1, y + 1, '#8A8569', 1),
  ].join('');
}

function paper(x: number, y: number, width: number, height: number): string {
  return [
    rect(x + 4, y + 5, width, height, '#11120E88', 'none', 0, 2),
    rect(x, y, width, height, C.record, C.ink, 2, 1),
    line(x + 8, y + 10, x + width - 8, y + 10, C.recordLight, 1),
  ].join('');
}

function irisInsert(x: number, y: number, width: number, height: number): string {
  return [
    rect(x + 4, y + 5, width, height, '#11120EBB', 'none', 0, 2),
    rect(x, y, width, height, C.iris, C.irisLine, 2, 2),
    line(x + 12, y + 12, x + width - 12, y + 12, C.irisLine, 1),
    focusCorners(x + 9, y + 9, width - 18, height - 18, 0.6),
  ].join('');
}

function button(
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  state: State = 'default',
  scale = 1,
  glyph?: string,
): string {
  let fill: string = C.sleeve;
  let stroke: string = '#24251E';
  let labelColor: string = C.cream;
  let yOffset = 0;
  let shadow = 4 * scale;
  let opacity = 1;
  if (state === 'hover') fill = '#736C50';
  if (state === 'focus') fill = '#615C46';
  if (state === 'pressed') {
    fill = C.well;
    yOffset = 2 * scale;
    shadow = 1 * scale;
  }
  if (state === 'selected') {
    fill = C.select;
    stroke = C.selectLight;
  }
  if (state === 'disabled') {
    fill = '#565342';
    labelColor = '#AAA289';
    opacity = 0.78;
  }
  if (state === 'invalid') {
    fill = C.well;
    stroke = C.rust;
  }
  const parts = [
    rect(x + 2 * scale, y + shadow, width, height, '#11120E99', 'none', 0, 2 * scale),
    rect(x, y + yOffset, width, height, fill, stroke, state === 'invalid' ? 2.5 * scale : 1.5 * scale, 2 * scale, `opacity="${opacity}"`),
    line(x + 3 * scale, y + yOffset + 2 * scale, x + width - 3 * scale, y + yOffset + 2 * scale, '#91896B', scale),
  ];
  const iconSize = Math.min(22 * scale, height * 0.52);
  if (glyph) {
    parts.push(reviewGlyph(glyph, x + 10 * scale, y + yOffset + (height - iconSize) / 2, iconSize, labelColor));
  }
  const centerX = glyph ? x + width / 2 + 6 * scale : x + width / 2;
  parts.push(text(centerX, y + yOffset + height / 2 + 6 * scale, label, 15.5 * scale, labelColor, 500, 'middle', displayFont, 1.05 * scale));
  if (state === 'focus') parts.push(focusCorners(x, y + yOffset, width, height, scale));
  if (state === 'invalid') parts.push(reviewGlyph('alert', x + width - 29 * scale, y + yOffset + (height - 20 * scale) / 2, 20 * scale, C.rust));
  return parts.join('');
}

function stateStrip(x: number, y: number, width: number, scale: number, darkLabels = false): string {
  const states: readonly State[] = ['default', 'hover', 'focus', 'pressed', 'selected', 'disabled', 'invalid'];
  const gap = 8 * scale;
  const cellWidth = (width - gap * (states.length - 1)) / states.length;
  const labelColor = darkLabels ? C.ink : C.creamMuted;
  return states.map((state, index) => {
    const cellX = x + index * (cellWidth + gap);
    const display = state === 'focus' ? 'KEY / PAD FOCUS' : state.toUpperCase();
    const actionLabel = state === 'disabled' ? 'NEEDS ROOM' : 'ACTION';
    return [
      text(cellX + cellWidth / 2, y, display, 14 * scale, labelColor, 500, 'middle', displayFont, 0.35 * scale),
      button(cellX, y + 14 * scale, cellWidth, 40 * scale, actionLabel, state, scale),
    ].join('');
  }).join('');
}

function familyCard(
  x: number,
  y: number,
  width: number,
  height: number,
  id: string,
  title: string,
  authority: string,
  body: string,
): string[] {
  return [
    panel(x, y, width, height, C.chassis),
    rect(x + 12, y + 12, 58, 25, C.well, C.creamMuted, 1, 1),
    text(x + 41, y + 31, id, 13, C.cream, 500, 'middle', monoFont),
    text(x + 82, y + 31, title.toUpperCase(), 16, C.cream, 500, 'start', displayFont, 1.2),
    text(x + width - 14, y + 31, authority.toUpperCase(), 10, C.focus, 500, 'end', displayFont, 1),
    text(x + 16, y + height - 15, body, 11, C.creamMuted, 400),
  ];
}

function constructionKitSheet(): string {
  const width = 3200;
  const height = 2050;
  const margin = 32;
  const parts: string[] = [
    `<defs>
      <linearGradient id="page-grad" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${C.page}"/><stop offset="1" stop-color="${C.pageDeep}"/></linearGradient>
      <pattern id="grid" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="#FFFFFF08" stroke-width="1"/></pattern>
    </defs>`,
    rect(0, 0, width, height, 'url(#page-grad)'),
    rect(0, 0, width, height, 'url(#grid)'),
    panel(margin, 24, width - margin * 2, 102, C.well),
    text(width / 2, 70, 'TERRARIUM · UI-E0 CONSTRUCTION KIT · REFINEMENT 3', 38, C.cream, 500, 'middle', displayFont, 3.6),
    text(width / 2, 101, 'OFFICIAL REVIEW SHEET · ROLE-SPLIT TYPOGRAPHY + ACCESSIBLE STATE READS · SOURCE AUTHORITY NOT PROMOTED', 14, C.creamMuted, 500, 'middle', displayFont, 1.8),
  ];

  // Palette, type, and three-voice ownership header.
  const headerY = 144;
  parts.push(panel(margin, headerY, width - margin * 2, 235, C.chassis));
  parts.push(text(54, headerY + 30, 'F-01 · SEMANTIC PALETTE + RESERVED SIGNALS', 16, C.cream, 500, 'start', displayFont, 1.2));
  const swatches = [
    ['CHASSIS', C.chassis], ['SLEEVE', C.sleeve], ['WELL', C.well], ['RECORD', C.record],
    ['SELECT', C.select], ['IRIS', C.iris], ['CAPTURE ONLY', C.capture], ['INVALID', C.rust], ['EMOTION ONLY', C.rose],
  ] as const;
  swatches.forEach(([label, color], index) => {
    const x = 54 + index * 124;
    parts.push(rect(x, headerY + 44, 104, 54, color, '#1A1B16', 2, 2));
    parts.push(text(x + 52, headerY + 118, label, 9, C.creamMuted, 500, 'middle', displayFont, 0.8));
  });
  parts.push(text(54, headerY + 151, 'F-02 · ROLE-SPLIT TYPOGRAPHY', 13, C.creamMuted, 500, 'start', displayFont, 1));
  parts.push(text(54, headerY + 173, 'UTILITY', 10, C.creamMuted, 500, 'start', displayFont, 1));
  parts.push(text(54, headerY + 202, 'BUILD CHAIN 0128', 24, C.cream, 500, 'start', displayFont, 1.7));
  parts.push(text(54, headerY + 224, 'Readable humanist body', 13, C.creamMuted, 400, 'start', bodyFont));
  parts.push(text(430, headerY + 173, 'QUOTACO PRINT', 10, C.creamMuted, 500, 'start', displayFont, 1));
  parts.push(text(430, headerY + 202, 'FORM QT-79 · 2 × 1', 19, C.cream, 400, 'start', printFont, 0.4));
  parts.push(text(800, headerY + 173, 'IRIS TERMINAL', 10, C.irisLine, 500, 'start', displayFont, 1));
  parts.push(text(800, headerY + 202, 'OBSERVED // NO DATA', 20, C.irisLine, 400, 'start', irisDisplayFont, 0.8));
  parts.push(text(800, headerY + 224, '12,840   02:15:00', 13, C.irisLine, 400, 'start', irisBodyFont));

  const voiceX = 1260;
  const voiceW = 598;
  const voiceGap = 20;
  const voices = [
    ['WORLD', 'Physical office, people, facilities', 'Runtime world / sprite / geometry', C.worldLight, C.ink],
    ['UTILITY + QUOTACO PRINT', 'Olive machinery contains manila records', 'UXML / USS + discrete ornament', C.chassis, C.cream],
    ['IRIS', 'Contained observation and diagnostics', 'UXML / USS insert + audited mark', C.iris, C.irisLine],
  ] as const;
  voices.forEach(([title, note, owner, fill, ink], index) => {
    const x = voiceX + index * (voiceW + voiceGap);
    parts.push(rect(x, headerY + 22, voiceW, 188, fill, index === 2 ? C.irisLine : '#1A1B16', 2, 2));
    const voiceHeadingFont = index === 2 ? irisDisplayFont : displayFont;
    const voiceBodyFont = index === 2 ? irisBodyFont : bodyFont;
    parts.push(text(x + 18, headerY + 55, `${index + 1} · ${title}`, 19, ink, index === 2 ? 400 : 500, 'start', voiceHeadingFont, 1.4));
    parts.push(text(x + 18, headerY + 86, note, 15, ink, 400, 'start', voiceBodyFont));
    parts.push(line(x + 18, headerY + 105, x + voiceW - 18, headerY + 105, ink, 1));
    parts.push(text(x + 18, headerY + 134, owner, 12, ink, 400, 'start', voiceBodyFont));
    parts.push(text(x + 18, headerY + 177, 'VOICE DOES NOT BLEND', 10, ink, index === 2 ? 400 : 500, 'start', voiceHeadingFont, 1.2));
    if (index === 0) {
      const sampleX = x + 430;
      const sampleY = headerY + 116;
      parts.push(rect(sampleX, sampleY, 142, 64, C.worldDark, C.ink, 1, 1));
      parts.push(line(sampleX + 10, sampleY + 18, sampleX + 132, sampleY + 18, '#77725F', 1));
      parts.push(line(sampleX + 46, sampleY + 6, sampleX + 46, sampleY + 56, '#77725F', 1));
      parts.push(rect(sampleX + 62, sampleY + 29, 45, 20, C.recordDark, C.ink, 1, 1));
      parts.push(reviewGlyph('person', sampleX + 18, sampleY + 28, 20, C.recordLight));
    }
    if (index === 1) {
      const sampleX = x + 425;
      const sampleY = headerY + 116;
      parts.push(rect(sampleX, sampleY, 147, 64, C.well, C.ink, 1, 1));
      parts.push(rect(sampleX + 12, sampleY + 10, 123, 44, C.record, C.ink, 1, 1));
      parts.push(line(sampleX + 21, sampleY + 25, sampleX + 126, sampleY + 25, C.ink, 1));
      parts.push(text(sampleX + 21, sampleY + 46, 'LIVE RECORD', 9, C.ink, 400, 'start', printFont, 0.45));
    }
    if (index === 2) {
      parts.push(focusCorners(x + 430, headerY + 123, 132, 48, 0.7));
      parts.push(text(x + 496, headerY + 153, 'OBSERVED', 10, C.irisLine, 400, 'middle', irisDisplayFont, 0.7));
    }
  });

  // Foundations F-03 through F-10.
  parts.push(text(margin + 8, 417, 'FOUNDATIONS · F-03—F-10', 22, C.cream, 500, 'start', displayFont, 2));
  const foundationY = 442;
  const foundationGap = 14;
  const foundationW = (width - margin * 2 - foundationGap * 3) / 4;
  const foundationH = 250;
  const foundations = [
    ['F-03', 'Continuous chassis', 'UXML / USS', 'Structural panel remains scalable; no whole-panel SVG.'],
    ['F-04', 'Well · sleeve · index rail', 'UXML / USS', 'Inset grammar is layout-owned; arrows may use a glyph.'],
    ['F-05', 'QuotaCo record carrier', 'USS + ornament audit', 'Paper, rules, fields, and copy stay live.'],
    ['F-06', 'IRIS diagnostic carrier', 'USS + ornament audit', 'Navy insert is contained; never the global shell.'],
    ['F-07', 'Divider · corner · focus', 'SVG candidates', 'Audit ui-divider, ui-corner, and ui-focus.'],
    ['F-08', 'Icon registry · two modes', 'SVG candidates', '142 stable icon ids; tintable and literal are held.'],
    ['F-09', 'Pointer cursor family', 'SVG → PNG candidate', 'Four ids + hotspots; Unity runtime use still absent.'],
    ['F-10', 'Surface state grammar', 'UXML / USS', 'State is material + label + shape, never color alone.'],
  ] as const;

  foundations.forEach(([id, title, authority, body], index) => {
    const x = margin + (index % 4) * (foundationW + foundationGap);
    const y = foundationY + Math.floor(index / 4) * (foundationH + foundationGap);
    parts.push(...familyCard(x, y, foundationW, foundationH, id, title, authority, body));
    if (id === 'F-03') {
      parts.push(panel(x + 20, y + 58, foundationW - 40, 108, C.chassis));
      parts.push(rect(x + 35, y + 75, foundationW - 70, 70, C.well, '#202119', 2, 2));
      parts.push(text(x + 50, y + 103, 'CONTINUOUS SHELF CHASSIS', 14, C.cream, 500, 'start', displayFont, 1));
      parts.push(text(x + 50, y + 130, 'shallow · resizable · world subordinate', 12, C.creamMuted));
    }
    if (id === 'F-04') {
      parts.push(rect(x + 28, y + 60, 54, 118, C.well, '#1A1B16', 2, 2));
      parts.push(button(x + 37, y + 67, 36, 28, '▲', 'default', 0.7));
      parts.push(rect(x + 37, y + 101, 36, 42, C.select, C.selectLight, 1, 1));
      parts.push(text(x + 55, y + 128, '01', 12, C.cream, 500, 'middle', monoFont));
      parts.push(button(x + 37, y + 149, 36, 22, '▼', 'default', 0.6));
      parts.push(rect(x + 102, y + 60, foundationW - 130, 118, C.well, '#1A1B16', 2, 2));
      parts.push(rect(x + 116, y + 76, foundationW - 158, 86, C.sleeve, '#202119', 2, 2));
      parts.push(text(x + 136, y + 109, 'RECESSED WELL', 14, C.cream, 500, 'start', displayFont, 1));
      parts.push(text(x + 136, y + 136, 'raised sleeve', 12, C.creamMuted));
    }
    if (id === 'F-05') {
      parts.push(paper(x + 24, y + 58, foundationW - 48, 126));
      parts.push(rect(x + 44, y + 50, 76, 18, C.recordDark, C.ink, 1, 1));
      parts.push(text(x + 42, y + 91, 'INTAKE DESK', 18, C.ink, 400, 'start', printFont, 0.6));
      parts.push(text(x + foundationW - 42, y + 89, 'QT-79', 12, C.ink, 400, 'end', printFont));
      parts.push(line(x + 42, y + 103, x + foundationW - 42, y + 103, C.ink, 1));
      parts.push(text(x + 42, y + 128, 'Footprint', 11, C.ink, 400, 'start', printFont));
      parts.push(text(x + 160, y + 128, '2 × 1', 12, C.ink, 400, 'start', printFont));
      parts.push(text(x + 42, y + 154, 'Live copy + live fields', 11, C.ink, 400, 'start', printFont));
    }
    if (id === 'F-06') {
      parts.push(irisInsert(x + 24, y + 58, foundationW - 48, 126));
      parts.push(text(x + 48, y + 91, 'IRIS DIAGNOSTIC', 16, C.irisLine, 400, 'start', irisDisplayFont, 1.1));
      parts.push(text(x + 48, y + 120, 'Observed break', 12, C.irisLine, 400, 'start', irisBodyFont));
      parts.push(text(x + foundationW - 48, y + 120, 'WALL PASS', 12, C.irisLine, 400, 'end', irisDisplayFont, 0.7));
      parts.push(line(x + 48, y + 134, x + foundationW - 48, y + 134, C.irisLine, 1));
      parts.push(text(x + 48, y + 158, 'One observation · one repair', 11, C.irisLine, 400, 'start', irisBodyFont));
    }
    if (id === 'F-07') {
      const ids = ['ui-divider', 'ui-corner', 'ui-focus'] as const;
      ids.forEach((iconId, iconIndex) => {
        const ix = x + 72 + iconIndex * 180;
        parts.push(rect(ix - 30, y + 70, 80, 80, C.well, '#1A1B16', 1, 2));
        parts.push(icon(iconId, ix - 14, y + 86, 48, C.focus));
        parts.push(text(ix + 10, y + 174, iconId.replace('ui-', ''), 11, C.creamMuted, 500, 'middle', monoFont));
      });
    }
    if (id === 'F-08') {
      const ids = ['quotaco-mark', 'iris-mark', 'ui-close', 'ui-play', 'ui-pause', 'ui-speed'] as const;
      ids.forEach((iconId, iconIndex) => {
        const ix = x + 28 + iconIndex * 104;
        parts.push(rect(ix, y + 70, 76, 76, iconId === 'iris-mark' ? C.iris : C.well, '#1A1B16', 1, 2));
        parts.push(icon(iconId, ix + 14, y + 84, 48, iconId === 'iris-mark' ? C.irisLine : C.cream));
      });
      parts.push(text(x + 28, y + 174, 'LIVE 142 ICONS · 129 TINTABLE · 13 LITERAL', 11, C.focus, 500, 'start', monoFont));
    }
    if (id === 'F-09') {
      CURSORS.forEach((cursor, cursorIndex) => {
        const ix = x + 42 + cursorIndex * 154;
        parts.push(rect(ix, y + 70, 72, 72, C.recordLight, C.ink, 1, 2));
        parts.push(icon(cursor.id, ix + 12, y + 82, 48));
        parts.push(text(ix + 36, y + 164, cursor.id.replace('cursor-', ''), 10, C.creamMuted, 500, 'middle', monoFont));
      });
    }
    if (id === 'F-10') {
      parts.push(stateStrip(x + 22, y + 104, foundationW - 44, 0.74));
    }
  });

  // Reusable controls C-01 through C-12.
  const controlsTitleY = foundationY + 2 * (foundationH + foundationGap) + 8;
  parts.push(text(margin + 8, controlsTitleY, 'REUSABLE CONTROLS · C-01—C-12', 22, C.cream, 500, 'start', displayFont, 2));
  const controlsY = controlsTitleY + 24;
  const controlGap = 14;
  const controlW = (width - margin * 2 - controlGap * 3) / 4;
  const controlH = 250;
  const controls = [
    ['C-01', 'Text action button', 'UXML / USS', 'Semantic Button owns label, focus, and action.'],
    ['C-02', 'Icon + transport button', 'USS + audited SVG', 'Accessible label and tooltip remain Unity-owned.'],
    ['C-03', 'Tab / segmented switcher', 'UXML / USS', 'Selected and focus remain independently legible.'],
    ['C-04', 'Indexed navigation row', 'USS + optional SVG', 'Number rail, hierarchy, current location, unread.'],
    ['C-05', 'Text + search field', 'UXML / USS', 'Typing is owned only after deliberate focus.'],
    ['C-06', 'Scroll track + viewport', 'UXML / USS', 'Compact track; shelf scroll stays internal.'],
    ['C-07', 'Selectable card / cell', 'USS + world-derived art', 'Whole-cell action; factual state remains live.'],
    ['C-08', 'Status / readiness fact', 'USS + new SVG glyphs', 'Independent facts; icon + text + color.'],
    ['C-09', 'Attention / advisory row', 'USS + audited SVG', 'Browse or deep-link only; never commits.'],
    ['C-10', 'Inline repair notice', 'USS + repair SVG', 'World and shelf repeat the same one repair.'],
    ['C-11', 'Grouped action bank', 'USS + audited SVGs', 'Primary, secondary, destructive stay distinct.'],
    ['C-12', 'Receipt + Undo / Redo', 'USS + new SVG glyphs', 'Availability must be backed by real history.'],
  ] as const;

  controls.forEach(([id, title, authority, body], index) => {
    const x = margin + (index % 4) * (controlW + controlGap);
    const y = controlsY + Math.floor(index / 4) * (controlH + controlGap);
    parts.push(...familyCard(x, y, controlW, controlH, id, title, authority, body));
    if (id === 'C-01') {
      parts.push(button(x + 28, y + 76, 190, 52, 'PLACE', 'selected', 1, 'room'));
      parts.push(button(x + 238, y + 76, 190, 52, 'CANCEL', 'default', 1));
      parts.push(button(x + 448, y + 76, 190, 52, 'DELETE', 'invalid', 1));
      parts.push(text(x + 28, y + 161, '40 px minimum at 100% · 56 px at 140%', 12, C.creamMuted));
    }
    if (id === 'C-02') {
      const ids = ['ui-play', 'ui-pause', 'ui-speed'] as const;
      ids.forEach((iconId, iconIndex) => {
        const ix = x + 62 + iconIndex * 170;
        parts.push(button(ix, y + 72, 124, 58, '', iconIndex === 1 ? 'selected' : 'default', 1));
        parts.push(icon(iconId, ix + 46, y + 85, 32, C.cream));
      });
      parts.push(text(x + 62, y + 166, 'PLAY', 11, C.creamMuted, 500, 'middle', displayFont, 1));
      parts.push(text(x + 232, y + 166, 'PAUSE', 11, C.creamMuted, 500, 'middle', displayFont, 1));
      parts.push(text(x + 402, y + 166, 'SPEED', 11, C.creamMuted, 500, 'middle', displayFont, 1));
    }
    if (id === 'C-03') {
      parts.push(button(x + 34, y + 80, 190, 48, 'CHAIN', 'selected', 1));
      parts.push(button(x + 224, y + 80, 190, 48, 'ALL ITEMS', 'default', 1));
      parts.push(button(x + 414, y + 80, 190, 48, 'RECORDS', 'focus', 1));
      parts.push(text(x + 34, y + 166, 'Selected fill ≠ keyboard/gamepad focus corners', 12, C.creamMuted));
    }
    if (id === 'C-04') {
      [
        ['01', 'Intake', 'selected'],
        ['02', 'Data Processing', 'default'],
        ['03', 'Delivery', 'disabled'],
      ].forEach(([num, label, state], row) => {
        const ry = y + 62 + row * 46;
        parts.push(rect(x + 28, ry, 50, 38, state === 'selected' ? C.select : C.well, '#202119', 1, 1));
        parts.push(text(x + 53, ry + 25, num, 13, C.cream, 500, 'middle', monoFont));
        parts.push(rect(x + 78, ry, 470, 38, state === 'selected' ? '#536D61' : C.sleeve, '#202119', 1, 1, state === 'disabled' ? 'opacity="0.72"' : ''));
        parts.push(text(x + 96, ry + 25, label, 14, state === 'disabled' ? '#AAA289' : C.cream, 500, 'start', displayFont, 0.8));
      });
    }
    if (id === 'C-05') {
      parts.push(rect(x + 34, y + 79, 570, 52, C.well, C.selectLight, 2, 2));
      parts.push(reviewGlyph('search', x + 50, y + 93, 24, C.focus));
      parts.push(text(x + 89, y + 112, 'Search all items…', 16, C.cream, 400));
      parts.push(focusCorners(x + 34, y + 79, 570, 52, 1));
      parts.push(text(x + 34, y + 165, 'Focus is explicit; WASD remains camera-owned otherwise.', 12, C.creamMuted));
    }
    if (id === 'C-06') {
      parts.push(rect(x + 62, y + 60, 54, 132, C.well, '#1A1B16', 2, 2));
      parts.push(button(x + 69, y + 67, 40, 28, '▲', 'default', 0.7));
      parts.push(rect(x + 76, y + 102, 26, 54, C.sleeve, C.creamMuted, 1, 1));
      parts.push(button(x + 69, y + 163, 40, 22, '▼', 'default', 0.6));
      parts.push(rect(x + 152, y + 60, 460, 132, C.well, '#1A1B16', 2, 2));
      parts.push(text(x + 174, y + 94, 'VIEWPORT CONTENT', 15, C.cream, 500, 'start', displayFont, 1));
      parts.push(line(x + 174, y + 112, x + 580, y + 112, C.creamMuted, 1));
      parts.push(text(x + 174, y + 143, 'Scroll is internal to the summoned shelf.', 13, C.creamMuted));
    }
    if (id === 'C-07') {
      parts.push(paper(x + 32, y + 55, 300, 142));
      parts.push(text(x + 52, y + 87, 'INTAKE DESK', 17, C.ink, 400, 'start', printFont, 0.5));
      parts.push(reviewGlyph('room', x + 64, y + 105, 52, C.ink));
      parts.push(text(x + 142, y + 124, '0 / 1', 14, C.ink, 400, 'start', printFont));
      parts.push(text(x + 142, y + 151, 'MISSING', 13, C.rust, 400, 'start', printFont, 0.5));
      parts.push(button(x + 362, y + 84, 220, 52, 'SELECTED CELL', 'selected', 1));
      parts.push(text(x + 362, y + 167, 'Whole cell activates; no nested Place button.', 12, C.creamMuted));
    }
    if (id === 'C-08') {
      const facts = [
        ['room', 'ROOM', 'check', C.selectLight],
        ['wrench', 'EQUIPPED 1 / 2', 'minus', C.cream],
        ['link', 'CONNECTED', 'alert', C.rust],
      ] as const;
      facts.forEach(([glyphName, label, stateGlyph, color], row) => {
        const ry = y + 58 + row * 48;
        parts.push(rect(x + 28, ry, 610, 40, C.well, color, 1.5, 1));
        parts.push(reviewGlyph(glyphName, x + 42, ry + 8, 24, color));
        parts.push(text(x + 82, ry + 26, label, 14, C.cream, 500, 'start', displayFont, 1));
        parts.push(reviewGlyph(stateGlyph, x + 590, ry + 8, 24, color));
      });
    }
    if (id === 'C-09') {
      parts.push(rect(x + 30, y + 72, 596, 72, C.well, C.creamMuted, 1.5, 2));
      parts.push(icon('ui-alert', x + 48, y + 90, 34, C.cream));
      parts.push(text(x + 98, y + 99, 'ACTION NEEDED', 13, C.cream, 500, 'start', displayFont, 1.2));
      parts.push(text(x + 98, y + 126, 'Intake needs one legal tube output.', 14, C.cream, 400));
      parts.push(text(x + 604, y + 111, 'OPEN', 12, C.focus, 500, 'end', displayFont, 1));
      parts.push(text(x + 30, y + 176, 'Neutral attention; amber remains dormant Capture only.', 12, C.creamMuted));
    }
    if (id === 'C-10') {
      parts.push(rect(x + 30, y + 70, 596, 88, C.well, C.rust, 2.5, 2));
      parts.push(reviewGlyph('alert', x + 48, y + 90, 34, C.rust));
      parts.push(text(x + 100, y + 100, 'WALL PASS BLOCKED', 15, C.cream, 500, 'start', displayFont, 1));
      parts.push(text(x + 100, y + 130, 'Choose a shared wall with a legal pass.', 13, C.cream, 400));
      parts.push(text(x + 30, y + 184, 'Rust + triangle + repair text; proposal remains armed.', 12, C.creamMuted));
    }
    if (id === 'C-11') {
      parts.push(button(x + 28, y + 76, 190, 52, 'PLACE', 'selected', 1, 'room'));
      parts.push(button(x + 232, y + 76, 180, 52, 'ROTATE', 'default', 1, 'rotate'));
      parts.push(button(x + 426, y + 76, 180, 52, 'DELETE', 'invalid', 1));
      parts.push(text(x + 28, y + 166, 'One loud primary; destructive stays separate.', 12, C.creamMuted));
    }
    if (id === 'C-12') {
      parts.push(rect(x + 30, y + 70, 596, 86, C.well, C.selectLight, 1.5, 2));
      parts.push(reviewGlyph('check', x + 48, y + 94, 28, C.focus));
      parts.push(text(x + 92, y + 101, 'Intake Desk placed', 15, C.cream, 500, 'start', displayFont, 1));
      parts.push(text(x + 92, y + 130, 'One recoverable office edit', 12, C.creamMuted));
      parts.push(button(x + 404, y + 87, 96, 46, 'UNDO', 'default', 0.9, 'undo'));
      parts.push(button(x + 510, y + 87, 96, 46, 'REDO', 'disabled', 0.9, 'redo'));
      parts.push(text(x + 30, y + 184, 'No receipt promises unavailable history.', 12, C.creamMuted));
    }
  });

  // Authority ledger.
  const ledgerY = controlsY + 3 * (controlH + controlGap) + 4;
  parts.push(panel(margin, ledgerY, width - margin * 2, 198, C.well));
  parts.push(text(54, ledgerY + 32, 'SOURCE-AUTHORITY DECISION', 18, C.cream, 500, 'start', displayFont, 1.5));
  const columnW = (width - 108) / 3;
  const ledgers = [
    ['CANONICAL SVG CANDIDATES', C.focus, [
      'Discrete marks: ui-divider · ui-corner · ui-focus',
      'QuotaCo / IRIS marks; transport + action glyphs',
      'Readiness / repair / undo-redo glyphs; four cursors',
      'Clip or bezel ornament only if USS cannot express it',
    ]],
    ['UNITY UXML / USS', C.cream, [
      'Chassis · wells · sleeves · paper · IRIS carriers',
      'Buttons · tabs · fields · scroll · cards · receipts',
      'All text, layout, focus placement, and surface states',
      'No baked copy, tables, whole panels, or state sprites',
    ]],
    ['UNITY RUNTIME GEOMETRY', '#D0C49F', [
      'Placement footprints and valid / invalid cells',
      'Room focus, facing cues, tube path and wall passes',
      'Endpoint highlights and spatial repair anchors',
      'No baked route, room, footprint, or world frame SVG',
    ]],
  ] as const;
  ledgers.forEach(([title, color, lines], index) => {
    const x = 54 + index * columnW;
    if (index > 0) parts.push(line(x - 20, ledgerY + 48, x - 20, ledgerY + 176, '#77725F', 1));
    parts.push(text(x, ledgerY + 62, title, 14, color, 500, 'start', displayFont, 1.1));
    parts.push(multiline(x, ledgerY + 91, lines, 12, C.creamMuted, 22));
  });
  parts.push(text(width - 54, ledgerY + 32, 'REVIEW ONLY · STOP BEFORE EXTRACTION / PROMOTION', 12, C.rust, 500, 'end', displayFont, 1.1));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function topBar(x: number, y: number, scale: number): string {
  const height = Math.round(48 * scale);
  const font = 16 * scale;
  const parts = [
    rect(x, y, 1280, height, C.wellDeep, '#151611', 2),
    text(x + 18 * scale, y + height / 2 + 6 * scale, 'QUOTACO BRANCH · DAY 1', 16 * scale, C.cream, 500, 'start', displayFont, 1.15 * scale),
  ];
  const metrics = [
    ['COMMITMENT', '40 × STRUCTURED DATA'],
    ['ARRIVED', '0 / 40'],
    ['ATTENTION', '3'],
  ] as const;
  const rightWidth = 720;
  const segmentWidth = rightWidth / metrics.length;
  metrics.forEach(([label, value], index) => {
    const sx = x + 1280 - rightWidth + index * segmentWidth;
    parts.push(line(sx, y + 7 * scale, sx, y + height - 7 * scale, '#77725F', 1));
    parts.push(text(sx + segmentWidth / 2, y + 16 * scale, label, 14 * scale, C.creamMuted, 500, 'middle', displayFont, 0.25 * scale));
    parts.push(text(sx + segmentWidth / 2, y + 38 * scale, value, font, C.cream, 500, 'middle', monoFont));
  });
  return parts.join('');
}

function proofShelf(x: number, y: number, scale: number): string {
  const shelfHeight = Math.round(scale === 1 ? 232 : 288);
  const pad = 14 * scale;
  const parts = [
    rect(x, y, 1280, shelfHeight, C.chassis, '#191A15', 2),
    line(x + 1, y + 1, x + 1279, y + 1, '#969075', 1),
    text(x + pad, y + 25 * scale, `LITERAL STATE PROOF · ${Math.round(scale * 100)}% UI`, 16 * scale, C.cream, 500, 'start', displayFont, 0.8 * scale),
    text(x + 1266, y + 25 * scale, 'OFFICE REMAINS PRIMARY', 14 * scale, C.creamMuted, 500, 'end', displayFont, 0.45 * scale),
  ];
  parts.push(stateStrip(x + pad, y + 46 * scale, 1280 - pad * 2, scale));

  const secondY = y + (scale === 1 ? 110 : 106) * scale;
  const controlH = 40 * scale;
  parts.push(button(x + pad, secondY, 118 * scale, controlH, 'CHAIN', 'selected', scale));
  parts.push(button(x + pad + 118 * scale, secondY, 142 * scale, controlH, 'ALL ITEMS', 'default', scale));
  const fieldX = x + pad + 280 * scale;
  parts.push(rect(fieldX, secondY, 218 * scale, controlH, C.well, C.selectLight, 1.5 * scale, 2 * scale));
  parts.push(reviewGlyph('search', fieldX + 10 * scale, secondY + 9 * scale, 22 * scale, C.focus));
  parts.push(text(fieldX + 42 * scale, secondY + 27 * scale, 'Search items…', 16 * scale, C.cream, 400));
  parts.push(focusCorners(fieldX, secondY, 218 * scale, controlH, scale));

  const noticeX = scale === 1 ? fieldX + 238 * scale : x + pad;
  const noticeY = scale === 1 ? secondY : y + 151 * scale;
  const noticeW = scale === 1 ? 270 * scale : 520 * scale;
  parts.push(rect(noticeX, noticeY, noticeW, controlH, C.iris, C.irisLine, 1.5 * scale, 2 * scale));
  parts.push(rect(noticeX + 3 * scale, noticeY + 5 * scale, 3 * scale, controlH - 10 * scale, C.rust));
  parts.push(reviewGlyph('alert', noticeX + 10 * scale, noticeY + 9 * scale, 22 * scale, C.rust));
  parts.push(text(noticeX + 43 * scale, noticeY + 18 * scale, 'WALL PASS // INVALID', 14 * scale, C.irisLine, 400, 'start', irisDisplayFont, 0.35 * scale));
  parts.push(text(noticeX + 43 * scale, noticeY + 35 * scale, 'Choose a shared wall.', 14 * scale, C.irisLine, 400, 'start', irisBodyFont));

  const receiptX = noticeX + noticeW + 16 * scale;
  const receiptW = x + 1280 - pad - receiptX;
  parts.push(rect(receiptX + 3 * scale, noticeY + 4 * scale, receiptW, controlH, '#11120E88', 'none', 0, 2 * scale));
  parts.push(rect(receiptX, noticeY, receiptW, controlH, C.record, C.ink, 1.5 * scale, 1 * scale));
  parts.push(line(receiptX + 8 * scale, noticeY + 6 * scale, receiptX + receiptW - 8 * scale, noticeY + 6 * scale, C.recordLight, scale));
  parts.push(reviewGlyph('check', receiptX + 10 * scale, noticeY + 9 * scale, 22 * scale, C.ink));
  parts.push(text(receiptX + 41 * scale, noticeY + 27 * scale, 'QT-79 · INTAKE DESK / PLACED', 14 * scale, C.ink, 400, 'start', printFont, 0.2 * scale));
  parts.push(reviewGlyph('undo', receiptX + receiptW - 31 * scale, noticeY + 9 * scale, 22 * scale, C.ink));
  return parts.join('');
}

function literalViewport(
  x: number,
  y: number,
  scale: number,
  worldDataUrl: string,
  clipId: string,
): string {
  const topHeight = Math.round(48 * scale);
  const shelfHeight = Math.round(scale === 1 ? 232 : 288);
  const shelfY = y + 720 - shelfHeight;
  const worldHeight = 720 - topHeight - shelfHeight;
  const worldY = y + topHeight;
  const sourceCropTop = 70;
  const sourceCropHeight = 440;
  const sourceScale = worldHeight / sourceCropHeight;
  const sourceWidth = 1792 * sourceScale;
  const sourceHeight = 1024 * sourceScale;
  const sourceX = x + (1280 - sourceWidth) / 2;
  const sourceY = worldY - sourceCropTop * sourceScale;
  return [
    `<clipPath id="${clipId}"><rect x="${x}" y="${y}" width="1280" height="720"/></clipPath>`,
    `<clipPath id="${clipId}-world"><rect x="${x}" y="${worldY}" width="1280" height="${worldHeight}"/></clipPath>`,
    `<g clip-path="url(#${clipId})">`,
    `<g clip-path="url(#${clipId}-world)"><image href="${worldDataUrl}" x="${sourceX}" y="${sourceY}" width="${sourceWidth}" height="${sourceHeight}"/></g>`,
    rect(x, worldY, 1280, worldHeight, '#0B0C0922'),
    topBar(x, y, scale),
    proofShelf(x, shelfY, scale),
    '</g>',
    rect(x, y, 1280, 720, 'none', C.record, 2),
  ].join('');
}

function literalScaleSheet(worldDataUrl: string): string {
  const width = 2720;
  const height = 1500;
  const frameY = 128;
  const leftX = 50;
  const rightX = 1390;
  const parts: string[] = [
    `<defs><linearGradient id="literal-page" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${C.page}"/><stop offset="1" stop-color="${C.pageDeep}"/></linearGradient></defs>`,
    rect(0, 0, width, height, 'url(#literal-page)'),
    text(50, 48, 'UI-E0 · LITERAL 1280 × 720 SCALE STUDY · REFINEMENT 3', 34, C.cream, 500, 'start', displayFont, 2.6),
    text(50, 80, 'ROLE-SPLIT TYPE AT 1:1 PIXELS · 14 PX SUPPORT FLOOR · REFERENCE WORLD BACKDROP IS NOT SOURCE ART', 14, C.creamMuted, 500, 'start', displayFont, 1.1),
    text(leftX, 113, '100% UI SCALE', 18, C.focus, 500, 'start', displayFont, 1.5),
    text(rightX, 113, '140% UI SCALE', 18, C.focus, 500, 'start', displayFont, 1.5),
    literalViewport(leftX, frameY, 1, worldDataUrl, 'frame-100'),
    literalViewport(rightX, frameY, 1.4, worldDataUrl, 'frame-140'),
  ];

  const noteY = 885;
  parts.push(panel(50, noteY, 2620, 155, C.well));
  parts.push(text(74, noteY + 34, 'READ AT ACTUAL SIZE', 16, C.cream, 500, 'start', displayFont, 1.3));
  parts.push(multiline(74, noteY + 65, [
    '100%: 16 px body · 14 px support · 40 px action. The Build proof shelf occupies 232 px (32.2% of the frame).',
    '140%: 22.4 px body · 19.6 px support · 56 px action. The shelf reflows to 288 px (40.0%) without hiding any state or action.',
    'Focus uses pale-teal corner geometry plus material change; invalid uses rust border, warning shape, and one repair sentence.',
  ], 14, C.creamMuted, 24));
  parts.push(text(2646, noteY + 34, 'AMBER IS ABSENT · ROSE IS ABSENT', 12, C.creamMuted, 500, 'end', displayFont, 1.2));

  const contrastY = 1060;
  parts.push(text(50, contrastY, 'CARRIER + TYPOGRAPHY ROLE CHECK', 20, C.cream, 500, 'start', displayFont, 1.6));
  const tiles = [
    ['UTILITY', 'Condensed heading + humanist body', C.chassis, C.cream],
    ['QUOTACO PRINT', 'Office print + tabular fields', C.record, C.ink],
    ['IRIS', 'Terminal mono diagnostic', C.iris, C.irisLine],
    ['INVALID', 'Rust + geometry + repair', C.well, C.rust],
  ] as const;
  tiles.forEach(([title, note, fill, color], index) => {
    const x = 50 + index * 655;
    const titleFont = index === 1 ? printFont : index === 2 ? irisDisplayFont : displayFont;
    const noteFont = index === 1 ? printFont : index === 2 ? irisBodyFont : bodyFont;
    const titleWeight = index === 1 || index === 2 ? 400 : 500;
    parts.push(rect(x, contrastY + 22, 620, 138, fill, color, 2, 2));
    parts.push(text(x + 20, contrastY + 57, title, 16, color, titleWeight, 'start', titleFont, 1.3));
    parts.push(text(x + 20, contrastY + 87, note, 14, color, 400, 'start', noteFont));
    parts.push(line(x + 20, contrastY + 103, x + 600, contrastY + 103, color, 1));
    parts.push(text(x + 20, contrastY + 130, index < 3 ? 'VOICE CONTAINED' : 'NOT COLOR-ONLY', 11, color, titleWeight, 'start', titleFont, 1));
  });

  const ledgerY = 1250;
  parts.push(panel(50, ledgerY, 2620, 205, C.chassis));
  parts.push(text(74, ledgerY + 35, 'VISIBLE SHAPE OWNERSHIP', 17, C.cream, 500, 'start', displayFont, 1.4));
  parts.push(text(74, ledgerY + 72, 'CANONICAL SVG CANDIDATES', 13, C.focus, 500, 'start', displayFont, 1.1));
  parts.push(multiline(74, ledgerY + 99, [
    'Discrete marks, transport/action/readiness glyphs, four pointer silhouettes',
    'QuotaCo / IRIS marks and only the ornaments USS cannot express cleanly',
  ], 12, C.creamMuted, 22));
  parts.push(text(930, ledgerY + 72, 'UNITY UXML / USS', 13, C.cream, 500, 'start', displayFont, 1.1));
  parts.push(multiline(930, ledgerY + 99, [
    'Every carrier, control, state surface, focus placement, layout, and live string',
    'No whole-panel SVG, baked copy, baked table, or per-state button sprite',
  ], 12, C.creamMuted, 22));
  parts.push(text(1785, ledgerY + 72, 'UNITY RUNTIME GEOMETRY', 13, '#D0C49F', 500, 'start', displayFont, 1.1));
  parts.push(multiline(1785, ledgerY + 99, [
    'Footprints, room focus, facing, tube routes, endpoints, and invalid cells',
    'World geometry remains authored by player/runtime, never baked by Terrarium',
  ], 12, C.creamMuted, 22));
  parts.push(text(2646, ledgerY + 184, 'REVIEW ONLY · STOPPED BEFORE SOURCE EXTRACTION', 12, C.rust, 500, 'end', displayFont, 1.2));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

async function sha256(file: string): Promise<string> {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}

async function protectedHashes(): Promise<Record<string, string>> {
  const files = [
    'CONTRACT.md',
    'src/parts/icons.ts',
    'src/parts/emotions.ts',
    'src/parts/stateIcons.ts',
    'src/parts/reactions.ts',
    'src/core/compositor.ts',
    'src/core/exporter.ts',
  ];
  return Object.fromEntries(await Promise.all(files.map(async (file) => [file, await sha256(file)])));
}

function readme(): string {
  return `# UI-E0 construction kit review v3

Status: **review only; stopped for explicit visual approval**

This refinement applies the approved role-split typography direction to the v2
construction kit. Utility uses an institutional condensed heading with a
readable humanist body; QuotaCo records use office-print monospace; contained
IRIS diagnostics use a stronger terminal mono. The literal-scale shelf now
contains all three voices without allowing terminal typography to become the
global interface.

The rendered faces are local review proxies: Avenir Next Condensed / Avenir
Next for Utility, Courier New for QuotaCo print, and Monaco / Andale Mono for
IRIS. This gate does not select, license, import, or promote production Unity
font assets.

The official construction-kit sheet covers catalog families F-01 through F-10
and C-01 through C-12. The literal-scale sheet draws two 1280×720 viewports at
1:1 pixels, using 100% and 140% interface scale. It includes default, hover,
keyboard/gamepad focus, pressed, selected, disabled, and invalid states.

The office image in the literal-scale sheet is an approved composition reference
used only as a review backdrop. It is not a production master or canonical asset.

## Source-authority decision

- Canonical SVG candidates: discrete marks, transport/action/readiness glyphs,
  four pointer silhouettes, the QuotaCo and IRIS marks, and only those clip/bezel
  ornaments that USS cannot express cleanly.
- Unity UXML/USS: chassis, wells, sleeves, records, IRIS carriers, controls,
  state surfaces, focus placement, scroll, text, fields, and layout.
- Unity runtime geometry: footprints, room focus, facing, tube paths, endpoints,
  invalid cells, and spatial repair anchors.

## Approval boundary

Approval of these review sheets does not authorize canonical SVG extraction or
promotion, production builder changes, exporter/importer changes, browser export,
Unity import, runtime UI implementation, staging, or commit.
`;
}

async function main(): Promise<void> {
  const worldBytes = await readFile(REFERENCE_WORLD);
  const worldDataUrl = `data:image/png;base64,${worldBytes.toString('base64')}`;
  const unityIconManifest = JSON.parse(
    await readFile(`${UNITY_IMPORT_ROOT}/icons/icons-manifest.json`, 'utf8'),
  ) as { icons?: Array<{ id?: string; mode?: string }> };
  const unityCursorManifest = JSON.parse(
    await readFile(`${UNITY_IMPORT_ROOT}/cursors/cursors-manifest.json`, 'utf8'),
  ) as { cursors?: Array<{ id?: string; hotspot?: { x?: number; y?: number } }> };
  const importedIcons = unityIconManifest.icons ?? [];
  const importedCursors = unityCursorManifest.cursors ?? [];
  const construction = constructionKitSheet();
  const literal = literalScaleSheet(worldDataUrl);
  const directIconCount = ICONS.length - EMOTION_ICONS.length - STATE_ICONS.length - REACTION_ICONS.length;
  const metrics = {
    status: 'review-only-stopped-for-explicit-visual-approval',
    refinement: {
      revision: 3,
      changes: [
        'Utility uses institutional condensed headings with readable humanist body copy',
        'QuotaCo manila records use an office-print monospace instead of terminal display type',
        'contained IRIS diagnostics own the stronger terminal-mono treatment',
        'literal 1280 by 720 frames show Utility, QuotaCo print, and IRIS together at 100 and 140 percent',
        'v2 state clarity, support-text floor, office dominance, and reserved signal colors are preserved',
      ],
    },
    typographyRoles: {
      utility: {
        headingProxy: 'Avenir Next Condensed',
        bodyProxy: 'Avenir Next',
        intent: 'institutional machinery labels plus readable general interface copy',
      },
      quotaCoPrint: {
        proxy: 'Courier New',
        intent: 'office forms, line-printer texture, record fields, and tabular values',
      },
      iris: {
        displayProxy: 'Monaco',
        bodyProxy: 'Andale Mono',
        intent: 'contained terminal diagnostics and named registers only',
      },
      productionFontAssets: 'not selected, licensed, imported, or promoted; local system faces are review proxies',
    },
    catalogScope: {
      foundationFamilies: ['F-01', 'F-02', 'F-03', 'F-04', 'F-05', 'F-06', 'F-07', 'F-08', 'F-09', 'F-10'],
      controlFamilies: ['C-01', 'C-02', 'C-03', 'C-04', 'C-05', 'C-06', 'C-07', 'C-08', 'C-09', 'C-10', 'C-11', 'C-12'],
      states: ['default', 'hover', 'keyboard-gamepad-focus', 'pressed', 'selected', 'disabled', 'invalid'],
      viewports: [
        { width: 1280, height: 720, uiScale: 1, bodyPx: 16, supportPx: 14, actionHeightPx: 40, shelfHeightPx: 232 },
        { width: 1280, height: 720, uiScale: 1.4, bodyPx: 22.4, supportPx: 19.6, actionHeightPx: 56, shelfHeightPx: 288 },
      ],
    },
    liveTerrariumInventory: {
      icons: ICONS.length,
      cursors: CURSORS.length,
      directIcons: directIconCount,
      emotionIcons: EMOTION_ICONS.length,
      stateIcons: STATE_ICONS.length,
      reactionIcons: REACTION_ICONS.length,
      tintableIcons: ICONS.filter((entry) => entry.mode === 'tintable').length,
      literalIcons: ICONS.filter((entry) => entry.mode === 'literal').length,
      cursorIds: CURSORS.map((entry) => ({ id: entry.id, hotspot: entry.hotspot })),
      currentAuthority: 'TypeScript ShapeSpec builders',
      canonicalUiOrCursorSvgSources: 0,
    },
    currentUnityStableIdConsumers: {
      importedReceiver: 'SpriteToolkitUiIconCatalog (case-insensitive id to sprite and tint mode)',
      importedCursorReceiver: 'SpriteToolkitCursorSet (case-insensitive id to texture and normalized hotspot)',
      mainMenu: ['quotaco-mark', 'iris-mark'],
      workstationStaticAndTransport: ['iris-mark', 'ui-speed', 'ui-play', 'ui-pause'],
      workstationEventRows: [
        'intervention-notification', 'intervention-lock', 'ui-mail', 'ui-truth-belief',
        'rel-social', 'ui-capture', 'ui-alert',
      ],
      workstationReviewDeveloperSurface: ['review-info-path', 'review-dossier'],
      dynamicFamilies: [
        'need-*', 'state-activity-*', 'state-social-*', 'state-mood-*',
        'state-emotion-*', 'reaction-*',
      ],
      cursorRuntimeConsumer: 'absent: catalog and hotspot receiver exist, but no runtime Cursor.SetCursor call consumes the ids',
    },
    freshUnityImportInventory: {
      root: UNITY_IMPORT_ROOT,
      icons: importedIcons.length,
      tintableIcons: importedIcons.filter((entry) => entry.mode === 'tintable').length,
      literalIcons: importedIcons.filter((entry) => entry.mode === 'literal').length,
      cursors: importedCursors.length,
      cursorIds: importedCursors.map((entry) => ({ id: entry.id, hotspot: entry.hotspot })),
      matchesLiveTerrariumIds:
        JSON.stringify(importedIcons.map((entry) => entry.id)) === JSON.stringify(ICONS.map((entry) => entry.id)) &&
        JSON.stringify(importedCursors.map((entry) => entry.id)) === JSON.stringify(CURSORS.map((entry) => entry.id)),
    },
    sourceAuthority: {
      canonicalSvgCandidates: [
        'ui-divider', 'ui-corner', 'ui-focus', 'iris-mark', 'quotaco-mark',
        'transport and action glyphs', 'readiness and repair glyphs', 'undo and redo glyphs',
        'cursor-default', 'cursor-grab', 'cursor-place', 'cursor-invalid',
        'print clip and IRIS bezel ornament only if USS cannot express them',
      ],
      unityUxmlUss: [
        'semantic palette and type roles', 'chassis, wells, sleeves, rails',
        'QuotaCo paper and IRIS carriers', 'buttons, tabs, rows, fields, scroll, cards, notices, action banks, receipts',
        'all text, layout, accessibility, focus placement, and state surfaces',
      ],
      runtimeGeometry: [
        'placement footprint and valid/invalid cells', 'room focus/highlight', 'facing and rotation cues',
        'tube routes, endpoints, wall passes, and spatial repair anchors',
      ],
    },
    reservations: {
      amber: 'dormant Capture only',
      rose: 'emotion only',
      selection: 'muted teal',
      invalid: 'rust plus warning geometry and repair text',
    },
    references: Object.fromEntries(await Promise.all(REFERENCE_IMAGES.map(async (file) => [file, await sha256(file)]))),
    referenceUse: 'visual reference only; department-era image is embedded solely as a literal-scale review backdrop',
    protectedSurfaceHashes: await protectedHashes(),
    productionChanges: [],
    deferred: [
      'canonical SVG extraction or promotion', 'production builder changes', 'exporter/importer changes',
      'browser export', 'Unity import', 'runtime UI implementation', 'staging', 'commit',
    ],
  };

  await mkdir(OUTPUT, { recursive: true });
  await writeFile(`${OUTPUT}/00-construction-kit-review.svg`, construction, 'utf8');
  await writeFile(`${OUTPUT}/00-construction-kit-review.png`, new Resvg(construction, { font: { loadSystemFonts: true } }).render().asPng());
  await writeFile(`${OUTPUT}/01-literal-scale-1280x720.svg`, literal, 'utf8');
  await writeFile(`${OUTPUT}/01-literal-scale-1280x720.png`, new Resvg(literal, { font: { loadSystemFonts: true } }).render().asPng());
  await writeFile(`${OUTPUT}/metrics.json`, `${JSON.stringify(metrics, null, 2)}\n`, 'utf8');
  await writeFile(`${OUTPUT}/README.md`, readme(), 'utf8');
  process.stdout.write(
    `Wrote UI-E0 review-only construction kit.\n` +
    `${OUTPUT}/00-construction-kit-review.png\n` +
    `${OUTPUT}/01-literal-scale-1280x720.png\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
