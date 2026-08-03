/**
 * Terrarium-owned department-era UI production-design renderer.
 *
 * This renders the approved Terrarium visual design authority using the live
 * canonical UI source registry. It does not write Unity assets, UXML/USS,
 * runtime state, or export bundles.
 */
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import design from '../assets/ui/department-era-design-v1/manifest.json';
import components from '../assets/ui/department-era-component-library-v1/manifest.json';
import { composeIcon } from '../src/core/compositor';
import type { ShapeSpec } from '../src/core/types';
import { getIcon } from '../src/parts/icons';
import { QUOTA_CO_DEPARTMENT_MACHINE_ART } from '../src/props/generated/quotaCoDepartmentMachineArt';

const OUTPUT = 'docs/previews/department-era-ui-production-design-v1';
const FONT_PILOT = 'docs/previews/ui-e1a-source-fit-font-pilot-v1/01-production-font-pilot.svg';
const WORLD_REFERENCE =
  '/Users/tombiagioni/.codex/generated_images/019fc31e-f42d-7f23-b0ee-6635d674450b/exec-1244ea64-482b-4484-b7c9-576da0a93593.png';

const P = design.palette;

type Anchor = 'start' | 'middle' | 'end';
type ControlState = keyof typeof design.states;
type ScreenScenario = 'chain-browse' | 'requirement-selected' | 'placement-valid' | 'route-invalid-140';
type ExpandedScreenScenario = 'all-items-browse' | 'all-items-search-focused' | 'people-handoff' | 'designation-management-receipt';

interface RenderedOutput {
  readonly filename: string;
  readonly source: string;
  readonly png: Buffer;
}

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
  color: string = P.utilityText,
  weight = 400,
  anchor: Anchor = 'start',
  family = 'IBM Plex Sans',
  letterSpacing = 0,
): string {
  return `<text x="${x}" y="${y}" fill="${color}" font-family="${family}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" letter-spacing="${letterSpacing}">${esc(value)}</text>`;
}

function multiline(
  x: number,
  y: number,
  lines: readonly string[],
  size = 14,
  color: string = P.utilityTextMuted,
  lineHeight = 22,
  family = 'IBM Plex Sans',
  weight = 400,
): string {
  return lines.map((line, index) =>
    text(x, y + index * lineHeight, line, size, color, weight, 'start', family)
  ).join('');
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

function line(x1: number, y1: number, x2: number, y2: number, color: string, width = 1): string {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"/>`;
}

function pathMark(d: string, color: string, width = 2, fill = 'none'): string {
  return `<path d="${d}" fill="${fill}" stroke="${color}" stroke-width="${width}" stroke-linecap="square" stroke-linejoin="miter"/>`;
}

function panel(x: number, y: number, width: number, height: number, fill = P.utilityChassis): string {
  return [
    rect(x + 4, y + 6, width, height, '#10110D99', 'none', 0, 3),
    rect(x, y, width, height, fill, P.darkRule, 2, 2),
    line(x + 2, y + 2, x + width - 2, y + 2, '#969075', 1),
  ].join('');
}

function paper(x: number, y: number, width: number, height: number): string {
  return [
    rect(x + 4, y + 5, width, height, '#10110D77', 'none', 0, 2),
    rect(x, y, width, height, P.quotaCoPaper, P.ink, 2, 1),
    line(x + 9, y + 9, x + width - 9, y + 9, P.quotaCoPaperLight, 1),
  ].join('');
}

function irisPanel(x: number, y: number, width: number, height: number): string {
  return [
    rect(x + 4, y + 5, width, height, '#10110DBB', 'none', 0, 2),
    rect(x, y, width, height, P.irisNavy, P.irisSignal, 2, 2),
    rect(x + 5, y + 6, 3, height - 12, P.irisNavyRaised),
  ].join('');
}

function focusCorners(x: number, y: number, width: number, height: number, scale = 1): string {
  const offset = 5 * scale;
  const arm = 10 * scale;
  const stroke = Math.max(1.5, 2 * scale);
  const left = x - offset;
  const top = y - offset;
  const right = x + width + offset;
  const bottom = y + height + offset;
  return [
    `M${left + arm} ${top}H${left}V${top + arm}`,
    `M${right - arm} ${top}H${right}V${top + arm}`,
    `M${left} ${bottom - arm}V${bottom}H${left + arm}`,
    `M${right} ${bottom - arm}V${bottom}H${right - arm}`,
  ].map((d) => pathMark(d, P.focus, stroke)).join('');
}

function svgBody(svg: string): string {
  return svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

function icon(id: string, x: number, y: number, size: number, tint?: string): string {
  let svg = composeIcon(id, 128);
  if (tint) svg = svg.replaceAll('#FFFFFF', tint);
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 128 128">${svgBody(svg)}</svg>`;
}

function departmentGlyph(id: string, x: number, y: number, size: number, color: string): string {
  return icon(id, x, y, size, color);
}

function actionGlyph(id: string, x: number, y: number, size: number, color: string): string {
  return icon(id, x, y, size, color);
}

function controlButton(
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  state: ControlState,
  scale = 1,
): string {
  let fill: string = P.utilitySleeve;
  let stroke: string = P.darkRule;
  let labelColor: string = P.utilityText;
  let yOffset = 0;
  let shadow = 4 * scale;
  if (state === 'hover') fill = '#736C50';
  if (state === 'focus') fill = '#615C46';
  if (state === 'pressed') {
    fill = P.utilityWell;
    yOffset = 2 * scale;
    shadow = scale;
  }
  if (state === 'selected') {
    fill = P.selection;
    stroke = P.selectionEdge;
  }
  if (state === 'disabled') {
    fill = '#565342';
    labelColor = '#AAA289';
  }
  if (state === 'invalid') {
    fill = P.utilityWell;
    stroke = P.invalidRust;
  }
  const parts = [
    rect(x + 2 * scale, y + shadow, width, height, '#11120E99', 'none', 0, 2 * scale),
    rect(x, y + yOffset, width, height, fill, stroke, state === 'invalid' ? 2.5 * scale : 1.5 * scale, 2 * scale),
    line(x + 3 * scale, y + yOffset + 2 * scale, x + width - 3 * scale, y + yOffset + 2 * scale, '#91896B', scale),
    text(x + width / 2, y + yOffset + height / 2 + 5.5 * scale, label, 14 * scale, labelColor, 500, 'middle', 'IBM Plex Sans Condensed', 0.65 * scale),
  ];
  if (state === 'focus') parts.push(focusCorners(x, y + yOffset, width, height, scale));
  if (state === 'invalid') parts.push(departmentGlyph('state-blocked', x + width - 27 * scale, y + yOffset + 9 * scale, 20 * scale, P.invalidRust));
  return parts.join('');
}

function technicalMachine(id: string, x: number, y: number, size: number, variant = ''): string {
  const entry = QUOTA_CO_DEPARTMENT_MACHINE_ART.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`Missing department machine ${id}`);
  const variants = entry.variants as unknown as Record<string, readonly ShapeSpec[]>;
  const shapes = variants[variant] ?? variants[''] ?? Object.values(variants)[0];
  if (!shapes) throw new Error(`Missing department machine variant ${id}:${variant}`);
  const body = shapes.map((shape) => {
    const attrs = [`d="${shape.d}"`];
    attrs.push(`fill="${shape.fill ? P.ink : 'none'}"`);
    if (shape.stroke) {
      attrs.push(`stroke="${P.ink}"`);
      attrs.push(`stroke-width="${shape.strokeWidth ?? 1.5}"`);
      attrs.push(`stroke-linecap="${shape.strokeLinecap ?? 'round'}"`);
      attrs.push(`stroke-linejoin="${shape.strokeLinejoin ?? 'round'}"`);
    }
    if (shape.opacity !== undefined) attrs.push(`opacity="${Math.max(0.28, shape.opacity)}"`);
    return `<path ${attrs.join(' ')}/>`;
  }).join('');
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 128 128">${body}</svg>`;
}

function backdrop(width: number, height: number): string {
  return [
    `<defs><pattern id="design-grid" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="${P.pageGrid}" stroke-width="1"/></pattern></defs>`,
    rect(0, 0, width, height, P.page),
    rect(0, 0, width, height, 'url(#design-grid)', 'none', 0, 0, 'opacity="0.42"'),
  ].join('');
}

function designSystemSheet(fontCss: string): string {
  const width = 2800;
  const height = 2110;
  const parts: string[] = [backdrop(width, height), `<style>${fontCss}</style>`];
  parts.push(panel(28, 24, width - 56, 94, P.utilityWell));
  parts.push(text(58, 69, 'TERRARIUM · DEPARTMENT-ERA UI PRODUCTION DESIGN', 28, P.utilityText, 500, 'start', 'IBM Plex Sans Condensed', 2));
  parts.push(text(58, 98, 'APPROVED PALETTE + DIRECTION B TYPE · TERRARIUM VISUAL AUTHORITY · UNITY IMPLEMENTATION DEFERRED', 12, P.utilityTextMuted, 500, 'start', 'IBM Plex Sans Condensed', 1.1));
  parts.push(text(width - 58, 72, 'DESIGN SOURCE v1', 15, P.focus, 500, 'end', 'IBM Plex Sans Condensed', 1.2));

  const paletteEntries = Object.entries(P).filter(([key]) => !key.includes('Reserved'));
  const paletteY = 150;
  parts.push(text(42, paletteY, 'SEMANTIC MATERIAL PALETTE', 19, P.utilityText, 500, 'start', 'IBM Plex Sans Condensed', 1.3));
  paletteEntries.forEach(([key, value], index) => {
    const column = index % 9;
    const row = Math.floor(index / 9);
    const x = 42 + column * 302;
    const y = paletteY + 24 + row * 92;
    parts.push(rect(x, y, 282, 72, value, value === P.page || value === P.ink ? P.utilityTextMuted : P.darkRule, 1, 2));
    const darkText = [P.quotaCoPaper, P.quotaCoPaperLight, P.focus, P.utilityText, P.utilityTextMuted, P.irisSignal].includes(value);
    parts.push(text(x + 12, y + 27, key.replace(/([A-Z])/g, ' $1').toUpperCase(), 11, darkText ? P.ink : P.utilityText, 500, 'start', 'IBM Plex Sans Condensed', 0.6));
    parts.push(text(x + 12, y + 51, value, 13, darkText ? P.ink : P.utilityTextMuted, 400, 'start', 'IBM Plex Mono'));
  });

  const typeY = 470;
  parts.push(text(42, typeY, 'THREE VOICES · DIRECTION B', 19, P.utilityText, 500, 'start', 'IBM Plex Sans Condensed', 1.3));
  const typeCards = [
    { x: 42, fill: P.utilityChassis, edge: P.utilityText, title: 'UTILITY / QUOTACO MACHINERY', family: 'IBM Plex Sans Condensed', body: 'IBM Plex Sans', sample: 'BUILD CHAIN 0128', copy: 'Place the Sorting Frame beside a legal dispatch path.' },
    { x: 957, fill: P.quotaCoPaper, edge: P.ink, title: 'QUOTACO PRINT', family: 'Courier Prime', body: 'Courier Prime', sample: 'QT–79 · INTAKE RECORD', copy: 'RECEIVED 000   MISSING 040   FILE WITH RECEIPT' },
    { x: 1872, fill: P.irisNavy, edge: P.irisSignal, title: 'IRIS / OBSERVED DIAGNOSTIC', family: 'IBM Plex Mono', body: 'IBM Plex Mono', sample: 'IRIS // WALL PASS', copy: 'OBSERVED: NO LEGAL SHARED-WALL CROSSING' },
  ] as const;
  typeCards.forEach((card) => {
    parts.push(rect(card.x, typeY + 28, 870, 260, card.fill, card.edge, 2, 2));
    parts.push(text(card.x + 24, typeY + 66, card.title, 12, card.edge, 500, 'start', card.family, 1));
    parts.push(text(card.x + 24, typeY + 111, card.sample, 25, card.edge, card.family === 'Courier Prime' ? 700 : 500, 'start', card.family, 0.8));
    parts.push(line(card.x + 24, typeY + 130, card.x + 846, typeY + 130, card.edge, 1));
    parts.push(text(card.x + 24, typeY + 169, card.copy, 16, card.edge, 400, 'start', card.body));
    parts.push(text(card.x + 24, typeY + 215, '100%  18 / 16 / 14 PX', 13, card.edge, 400, 'start', card.body));
    parts.push(text(card.x + 846, typeY + 215, '140%  25.2 / 22.4 / 19.6 PX', 13, card.edge, 400, 'end', card.body));
  });

  const statesY = 805;
  parts.push(text(42, statesY, 'CONTROL STATE GRAMMAR', 19, P.utilityText, 500, 'start', 'IBM Plex Sans Condensed', 1.3));
  const states = Object.keys(design.states) as ControlState[];
  states.forEach((state, index) => {
    const x = 42 + index * 390;
    parts.push(controlButton(x, statesY + 38, 330, 52, state.toUpperCase(), state));
    parts.push(text(x + 165, statesY + 122, design.states[state], 11, P.utilityTextMuted, 400, 'middle', 'IBM Plex Sans'));
  });

  const sourceY = 1005;
  parts.push(text(42, sourceY, 'APPROVED CANONICAL SHARED MARKS', 19, P.utilityText, 500, 'start', 'IBM Plex Sans Condensed', 1.3));
  design.shapeLedger.canonicalNow.forEach((id, index) => {
    const x = 42 + index * 330;
    const fill = id === 'iris-mark' ? P.irisNavy : id === 'quotaco-mark' ? P.quotaCoPaper : P.utilityWell;
    const tint = id === 'iris-mark' ? P.irisSignal : id === 'quotaco-mark' ? undefined : P.focus;
    parts.push(rect(x, sourceY + 32, 290, 142, fill, tint ?? P.ink, 2, 2));
    parts.push(icon(id, x + 108, sourceY + 49, 74, tint));
    parts.push(text(x + 145, sourceY + 156, id, 12, tint ?? P.ink, 400, 'middle', 'IBM Plex Mono'));
  });
  parts.push(panel(1722, sourceY + 32, 1020, 142, P.utilityChassis));
  parts.push(text(1746, sourceY + 66, 'SOURCE BOUNDARY', 13, P.focus, 500, 'start', 'IBM Plex Sans Condensed', 1));
  parts.push(multiline(1746, sourceY + 94, [
    'Twenty-four approved SVGs own only stateless mark geometry.',
    'No carrier, state surface, text, table, route, or footprint is baked.',
  ], 14, P.utilityTextMuted, 24));

  const glyphY = 1230;
  parts.push(text(42, glyphY, 'DEPARTMENT SLICE · CANONICAL GLYPHS', 19, P.utilityText, 500, 'start', 'IBM Plex Sans Condensed', 1.3));
  parts.push(text(width - 42, glyphY, 'APPROVED TERRARIUM SVG AUTHORITY', 12, P.focus, 500, 'end', 'IBM Plex Sans Condensed', 1));
  const groups = [
    { label: 'WORK TYPE', ids: ['work-intake', 'work-data-processing', 'work-delivery'] },
    { label: 'READINESS', ids: ['ready-room', 'ready-designated', 'ready-equipped', 'ready-io', 'ready-connected', 'ready-staffed', 'ready-flowing', 'ready-all'] },
    { label: 'STATE + ROUTE', ids: ['state-complete', 'state-missing', 'state-blocked', 'state-unavailable', 'route-input', 'route-output', 'route-wall-pass', 'route-repair'] },
  ] as const;
  let groupX = 42;
  groups.forEach((group) => {
    const cellWidth = 118;
    const groupWidth = group.ids.length * cellWidth + 28;
    parts.push(rect(groupX, glyphY + 30, groupWidth, 230, P.utilityWell, P.darkRule, 2, 2));
    parts.push(text(groupX + 14, glyphY + 57, group.label, 11, P.focus, 500, 'start', 'IBM Plex Sans Condensed', 0.8));
    group.ids.forEach((id, index) => {
      const x = groupX + 14 + index * cellWidth;
      parts.push(rect(x, glyphY + 75, 100, 100, P.utilityWellDeep, P.utilitySleeve, 1, 1));
      parts.push(departmentGlyph(id, x + 26, glyphY + 101, 48, id === 'state-blocked' ? P.invalidRust : P.utilityText));
      parts.push(text(x + 50, glyphY + 195, id.replace(/^(work|ready|state|route)-/, '').replaceAll('-', ' ').toUpperCase(), 8.5, P.utilityTextMuted, 500, 'middle', 'IBM Plex Sans Condensed', 0.4));
    });
    groupX += groupWidth + 22;
  });

  const ownershipY = 1575;
  parts.push(panel(42, ownershipY, width - 84, 465, P.utilityChassis));
  parts.push(text(68, ownershipY + 40, 'CREATION / IMPLEMENTATION LEDGER', 18, P.utilityText, 500, 'start', 'IBM Plex Sans Condensed', 1.2));
  const ownershipColumns = [
    { x: 68, title: 'CREATED IN TERRARIUM NOW', color: P.focus, lines: ['Palette, typography, material and state decisions', 'Literal 1280×720 compositions and scale reflow', 'Twenty-four canonical shared and department marks'] },
    { x: 955, title: 'TRANSLATED TO UNITY TOGETHER LATER', color: P.utilityText, lines: ['TextCore assets and licensed font packaging', 'UXML/USS controls, carriers, layout and accessibility', 'Authoritative data binding, interaction and focus behavior'] },
    { x: 1842, title: 'ALWAYS RUNTIME GEOMETRY', color: P.quotaCoPaperLight, lines: ['Room and department focus', 'Placement footprint, cells, facing and validity', 'Authored tube route, endpoints, wall pass and repair'] },
  ] as const;
  ownershipColumns.forEach((column) => {
    parts.push(text(column.x, ownershipY + 86, column.title, 13, column.color, 500, 'start', 'IBM Plex Sans Condensed', 0.9));
    parts.push(multiline(column.x, ownershipY + 121, column.lines, 14, P.utilityTextMuted, 28));
  });
  parts.push(line(68, ownershipY + 232, width - 68, ownershipY + 232, P.quotaCoPaperRule, 1));
  parts.push(text(68, ownershipY + 275, 'SIGNAL RESERVATIONS', 13, P.utilityText, 500, 'start', 'IBM Plex Sans Condensed', 0.9));
  parts.push(rect(68, ownershipY + 300, 24, 24, P.captureAmberReserved, P.darkRule, 1, 1));
  parts.push(text(106, ownershipY + 319, 'AMBER · DORMANT CAPTURE ONLY', 13, P.utilityTextMuted, 400, 'start', 'IBM Plex Sans'));
  parts.push(rect(520, ownershipY + 300, 24, 24, P.emotionRoseReserved, P.darkRule, 1, 1));
  parts.push(text(558, ownershipY + 319, 'ROSE · EMOTION ONLY', 13, P.utilityTextMuted, 400, 'start', 'IBM Plex Sans'));
  parts.push(rect(910, ownershipY + 300, 24, 24, P.selection, P.selectionEdge, 2, 1));
  parts.push(text(948, ownershipY + 319, 'TEAL · SELECTION', 13, P.utilityTextMuted, 400, 'start', 'IBM Plex Sans'));
  parts.push(rect(1260, ownershipY + 300, 24, 24, P.utilityWell, P.invalidRust, 2, 1));
  parts.push(text(1298, ownershipY + 319, 'RUST · INVALID + REPAIR', 13, P.utilityTextMuted, 400, 'start', 'IBM Plex Sans'));
  parts.push(text(width - 68, ownershipY + 413, 'APPROVED TERRARIUM DESIGN SOURCE · GLYPH PROMOTION RECORDED · UNITY DEFERRED', 12, P.focus, 500, 'end', 'IBM Plex Sans Condensed', 1));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function componentLibrarySheet(fontCss: string): string {
  const width = 2800;
  const height = 2380;
  const parts: string[] = [backdrop(width, height), `<style>${fontCss}</style>`];
  parts.push(text(48, 54, 'DEPARTMENT-ERA UI · REUSABLE COMPONENT LIBRARY', 30, P.utilityText, 500, 'start', 'IBM Plex Sans Condensed', 2));
  parts.push(text(48, 84, 'LITERAL CONSTRUCTION CONTRACT · 34 CANONICAL MARKS + SOURCE-OWNED CURSOR HOTSPOTS · UNITY DEFERRED', 13, P.utilityTextMuted, 500, 'start', 'IBM Plex Sans Condensed', 1));

  const carrierY = 130;
  parts.push(text(48, carrierY, 'F-03 / F-04 / F-05 / F-06 / F-11 · CARRIERS AND TECHNICAL PRINT', 18, P.focus, 500, 'start', 'IBM Plex Sans Condensed', 1.2));
  const carrierX = [48, 730, 1412, 2094] as const;
  parts.push(panel(carrierX[0], carrierY + 28, 642, 292));
  parts.push(text(carrierX[0] + 20, carrierY + 62, 'CONTINUOUS CHASSIS', 13, P.utilityText, 500, 'start', 'IBM Plex Sans Condensed', 0.8));
  parts.push(rect(carrierX[0] + 20, carrierY + 82, 602, 70, P.utilityWell, P.darkRule, 2, 2));
  parts.push(rect(carrierX[0] + 36, carrierY + 97, 170, 40, P.utilitySleeve, P.darkRule, 1, 2));
  parts.push(rect(carrierX[0] + 220, carrierY + 97, 170, 40, P.selection, P.selectionEdge, 2, 2));
  parts.push(rect(carrierX[0] + 404, carrierY + 97, 202, 40, '#565342', P.darkRule, 1, 2));
  parts.push(text(carrierX[0] + 121, carrierY + 123, 'RAISED SLEEVE', 12, P.utilityText, 500, 'middle', 'IBM Plex Sans Condensed', 0.5));
  parts.push(text(carrierX[0] + 305, carrierY + 123, 'SELECTED RAIL', 12, P.utilityText, 500, 'middle', 'IBM Plex Sans Condensed', 0.5));
  parts.push(text(carrierX[0] + 505, carrierY + 123, 'DISABLED · READABLE', 12, P.utilityTextMuted, 500, 'middle', 'IBM Plex Sans Condensed', 0.5));
  parts.push(multiline(carrierX[0] + 20, carrierY + 185, ['USS: shallow border, one-pixel upper edge, restrained shadow.', 'No whole-panel SVG; dimensions remain responsive.'], 13, P.utilityTextMuted, 24));

  parts.push(paper(carrierX[1], carrierY + 28, 642, 292));
  parts.push(text(carrierX[1] + 22, carrierY + 65, 'QT–C05 · QUOTACO RECORD CARRIER', 16, P.ink, 700, 'start', 'Courier Prime'));
  parts.push(line(carrierX[1] + 22, carrierY + 79, carrierX[1] + 620, carrierY + 79, P.quotaCoPaperRule, 1));
  parts.push(text(carrierX[1] + 22, carrierY + 116, 'PURPOSE     OFFICIAL FACTS AND RECOVERABLE RECEIPTS', 13, P.ink, 400, 'start', 'Courier Prime'));
  parts.push(text(carrierX[1] + 22, carrierY + 148, 'MATERIAL    MANILA / DARK RULE / LIVE TYPE', 13, P.ink, 400, 'start', 'Courier Prime'));
  parts.push(text(carrierX[1] + 22, carrierY + 180, 'NOT IRIS    NO CLAIMS ABOUT PEOPLE OR MOTIVE', 13, P.ink, 400, 'start', 'Courier Prime'));
  parts.push(controlButton(carrierX[1] + 400, carrierY + 220, 210, 42, 'FILE RECEIPT', 'default'));

  parts.push(irisPanel(carrierX[2], carrierY + 28, 642, 292));
  parts.push(icon('iris-mark', carrierX[2] + 22, carrierY + 48, 30, P.irisSignal));
  parts.push(text(carrierX[2] + 64, carrierY + 70, 'IRIS // OBSERVED BREAK', 15, P.irisSignal, 400, 'start', 'IBM Plex Mono', 0.5));
  parts.push(line(carrierX[2] + 22, carrierY + 88, carrierX[2] + 620, carrierY + 88, P.irisSignal, 1));
  parts.push(multiline(carrierX[2] + 22, carrierY + 126, ['OBSERVED: DISPATCH HAS NO LEGAL ROUTE.', 'REPAIR: START TUBE ROUTE FROM OUTPUT.', 'UNCERTAINTY: STAFFING AUTHORITY UNAVAILABLE.'], 13, P.irisSignal, 30, 'IBM Plex Mono'));
  parts.push(text(carrierX[2] + 620, carrierY + 290, 'CONTAINED · NEVER GLOBAL SHELL', 11, P.irisSignal, 400, 'end', 'IBM Plex Mono'));

  parts.push(paper(carrierX[3], carrierY + 28, 642, 292));
  parts.push(text(carrierX[3] + 22, carrierY + 64, 'F-11 · DERIVED TECHNICAL PRINT', 15, P.ink, 700, 'start', 'Courier Prime'));
  const machineSpecs = [
    ['sorting_frame', 'SORTING FRAME'],
    ['franking_machine', 'FRANKING MACHINE'],
    ['dispatch_station', 'DISPATCH STATION'],
  ] as const;
  machineSpecs.forEach(([id, label], index) => {
    const x = carrierX[3] + 24 + index * 202;
    parts.push(rect(x, carrierY + 88, 184, 154, index === 1 ? '#B7AA8B' : P.quotaCoPaperLight, P.ink, index === 1 ? 3 : 1, 1));
    parts.push(technicalMachine(id, x + 52, carrierY + 96, 80));
    parts.push(text(x + 92, carrierY + 224, label, 9, P.ink, 700, 'middle', 'Courier Prime'));
  });
  parts.push(text(carrierX[3] + 620, carrierY + 290, 'ONE-COLOR DERIVATION · NO REDRAWN SKU', 11, P.ink, 400, 'end', 'Courier Prime'));

  const controlY = 505;
  parts.push(text(48, controlY, 'C-01 / C-03 / F-10 · ACTION AND VIEW-STATE GRAMMAR', 18, P.focus, 500, 'start', 'IBM Plex Sans Condensed', 1.2));
  (Object.keys(design.states) as ControlState[]).forEach((state, index) => {
    const x = 48 + index * 390;
    parts.push(controlButton(x, controlY + 34, 340, 52, state.toUpperCase(), state));
    parts.push(text(x + 170, controlY + 112, state === 'focus' ? 'KEYBOARD / GAMEPAD' : design.states[state], 10.5, P.utilityTextMuted, 400, 'middle', 'IBM Plex Sans'));
  });
  const tabsY = controlY + 150;
  parts.push(panel(48, tabsY, 1030, 94, P.utilityChassis));
  parts.push(text(68, tabsY + 28, 'SEGMENTED VIEW SWITCHER', 11, P.utilityTextMuted, 500, 'start', 'IBM Plex Sans Condensed', 0.7));
  parts.push(controlButton(68, tabsY + 40, 210, 38, 'CHAIN', 'selected'));
  parts.push(controlButton(286, tabsY + 40, 250, 38, 'ALL ITEMS', 'default'));
  parts.push(controlButton(544, tabsY + 40, 210, 38, 'PEOPLE', 'focus'));
  parts.push(controlButton(762, tabsY + 40, 290, 38, 'UNAVAILABLE', 'disabled'));
  parts.push(panel(1110, tabsY, 1642, 94, P.utilityChassis));
  parts.push(text(1130, tabsY + 28, 'INDEX RAIL · WHOLE ROW ACTION', 11, P.utilityTextMuted, 500, 'start', 'IBM Plex Sans Condensed', 0.7));
  const railRows = [
    ['01', 'STRUCTURE', 'default'],
    ['02', 'DEPARTMENTS', 'selected'],
    ['03', 'PRODUCTION · UNREAD 2', 'focus'],
    ['04', 'PREFABS', 'disabled'],
  ] as const;
  railRows.forEach(([number, label, state], index) => {
    const x = 1130 + index * 394;
    const selected = state === 'selected';
    parts.push(rect(x, tabsY + 40, 370, 38, selected ? P.selection : P.utilityWell, selected ? P.selectionEdge : P.darkRule, selected ? 2 : 1, 1, state === 'disabled' ? 'opacity="0.62"' : ''));
    parts.push(text(x + 16, tabsY + 65, number, 13, selected ? P.focus : P.utilityTextMuted, 400, 'start', 'IBM Plex Mono'));
    parts.push(text(x + 58, tabsY + 65, label, 12, selected ? P.utilityText : P.utilityTextMuted, 500, 'start', 'IBM Plex Sans Condensed', 0.5));
    if (state === 'focus') parts.push(focusCorners(x, tabsY + 40, 370, 38));
  });

  const cellY = 805;
  parts.push(text(48, cellY, 'C-05 THROUGH C-12 · DENSE REUSABLE MECHANICS', 18, P.focus, 500, 'start', 'IBM Plex Sans Condensed', 1.2));
  parts.push(panel(48, cellY + 28, 650, 322));
  parts.push(text(70, cellY + 60, 'SEARCH OWNS TYPE ONLY WHILE FOCUSED', 12, P.utilityText, 500, 'start', 'IBM Plex Sans Condensed', 0.7));
  parts.push(rect(70, cellY + 78, 500, 44, P.utilityWellDeep, P.focus, 2, 2));
  parts.push(icon('ui-focus', 78, cellY + 86, 28, P.focus));
  parts.push(text(118, cellY + 107, 'station', 15, P.utilityText, 400, 'start', 'IBM Plex Sans'));
  parts.push(text(584, cellY + 107, '⌫', 16, P.utilityTextMuted, 400, 'middle', 'IBM Plex Sans'));
  parts.push(text(70, cellY + 148, 'SCROLL VIEWPORT', 11, P.utilityTextMuted, 500, 'start', 'IBM Plex Sans Condensed', 0.6));
  parts.push(rect(70, cellY + 162, 500, 120, P.utilityWell, P.darkRule, 1, 1));
  [0, 1, 2].forEach((index) => {
    parts.push(rect(84, cellY + 176 + index * 32, 448, 26, index === 1 ? P.selection : P.utilitySleeve, index === 1 ? P.selectionEdge : P.darkRule, 1, 1));
    parts.push(text(98, cellY + 194 + index * 32, ['INTAKE STATION', 'DISPATCH STATION', 'FILING STATION'][index], 11, P.utilityText, 500, 'start', 'IBM Plex Sans Condensed', 0.4));
  });
  parts.push(rect(546, cellY + 166, 10, 112, P.utilityWellDeep, P.darkRule, 1, 2));
  parts.push(rect(547, cellY + 184, 8, 40, P.utilityTextMuted, P.darkRule, 1, 2));

  parts.push(panel(730, cellY + 28, 650, 322));
  parts.push(text(752, cellY + 60, 'READINESS FACTS STAY INDEPENDENT', 12, P.utilityText, 500, 'start', 'IBM Plex Sans Condensed', 0.7));
  const readiness = [
    ['ready-room', 'ROOM', 'state-complete', P.selectionEdge],
    ['ready-equipped', 'EQUIPPED', 'state-missing', P.invalidRust],
    ['ready-connected', 'CONNECTED', 'state-blocked', P.invalidRust],
    ['ready-staffed', 'STAFFED 0 / 2', 'state-unavailable', P.disabled],
  ] as const;
  readiness.forEach(([fact, label, state, color], index) => {
    const y = cellY + 82 + index * 56;
    parts.push(rect(752, y, 606, 44, P.utilityWell, index === 2 ? P.invalidRust : P.darkRule, index === 2 ? 2 : 1, 1));
    parts.push(departmentGlyph(fact, 764, y + 8, 28, P.utilityText));
    parts.push(text(808, y + 28, label, 13, P.utilityText, 500, 'start', 'IBM Plex Sans Condensed', 0.5));
    parts.push(departmentGlyph(state, 1314, y + 10, 24, color));
  });

  parts.push(panel(1412, cellY + 28, 650, 322));
  parts.push(text(1434, cellY + 60, 'ATTENTION BROWSES · REPAIR EXPLAINS', 12, P.utilityText, 500, 'start', 'IBM Plex Sans Condensed', 0.7));
  parts.push(rect(1434, cellY + 82, 606, 72, P.utilityWell, P.invalidRust, 2, 2));
  parts.push(icon('ui-alert', 1448, cellY + 98, 34, P.invalidRust));
  parts.push(text(1496, cellY + 108, 'ACTION NEEDED · INTAKE EQUIPMENT', 13, P.utilityText, 500, 'start', 'IBM Plex Sans Condensed', 0.5));
  parts.push(text(1496, cellY + 134, 'Open Build selects Sorting Frame; it does not arm placement.', 12, P.utilityTextMuted, 400, 'start', 'IBM Plex Sans'));
  parts.push(irisDiagnostic(1434, cellY + 174, 606, 126, 'IRIS // ONE REPAIR', [
    'OBSERVED: OUTPUT HAS NO SHARED-WALL PASS.',
    'REPAIR: START TUBE ROUTE FROM OUTPUT.',
  ], true));

  parts.push(paper(2094, cellY + 28, 658, 322));
  parts.push(text(2116, cellY + 64, 'QT–R12 · RECOVERABLE EDIT RECEIPT', 15, P.ink, 700, 'start', 'Courier Prime'));
  parts.push(line(2116, cellY + 78, 2730, cellY + 78, P.quotaCoPaperRule, 1));
  parts.push(text(2116, cellY + 112, 'PLACED       SORTING FRAME', 13, P.ink, 400, 'start', 'Courier Prime'));
  parts.push(text(2116, cellY + 142, 'DEPARTMENT    INTAKE', 13, P.ink, 400, 'start', 'Courier Prime'));
  parts.push(text(2116, cellY + 172, 'AUTHORITY     REVALIDATED', 13, P.ink, 400, 'start', 'Courier Prime'));
  parts.push(controlButton(2116, cellY + 210, 190, 44, 'UNDO', 'default'));
  parts.push(controlButton(2318, cellY + 210, 190, 44, 'REDO', 'disabled'));
  parts.push(controlButton(2520, cellY + 210, 210, 44, 'FOCUS ITEM', 'selected'));
  parts.push(text(2730, cellY + 292, 'UNDO IS RECOVERY · NOT DURABLE MANAGEMENT', 11, P.ink, 400, 'end', 'Courier Prime'));

  const actionY = 1215;
  parts.push(text(48, actionY, 'C-11 / C-12 / W-03 · CANONICAL ACTION MARKS AT LITERAL SIZES', 18, P.focus, 500, 'start', 'IBM Plex Sans Condensed', 1.2));
  parts.push(text(width - 48, actionY, 'APPROVED TERRARIUM SVG AUTHORITY', 12, P.focus, 500, 'end', 'IBM Plex Sans Condensed', 0.9));
  const actionSizes = [16, 20, 24, 32, 42] as const;
  components.promotedActionMarks.forEach((id, index) => {
    const x = 48 + index * 452;
    parts.push(panel(x, actionY + 30, 420, 280, P.utilityWell));
    parts.push(text(x + 20, actionY + 62, id.toUpperCase().replaceAll('-', ' '), 12, P.utilityText, 500, 'start', 'IBM Plex Sans Condensed', 0.6));
    let cursorX = x + 22;
    actionSizes.forEach((size) => {
      parts.push(rect(cursorX, actionY + 88, Math.max(54, size + 20), 70, P.utilityWellDeep, P.darkRule, 1, 1));
      parts.push(actionGlyph(id, cursorX + (Math.max(54, size + 20) - size) / 2, actionY + 101 + (42 - size) / 2, size, P.utilityText));
      parts.push(text(cursorX + Math.max(54, size + 20) / 2, actionY + 180, `${size}px`, 10, P.utilityTextMuted, 400, 'middle', 'IBM Plex Mono'));
      cursorX += Math.max(62, size + 28);
    });
    parts.push(controlButton(x + 20, actionY + 208, 180, 42, id.replace('action-', '').replace('world-', '').toUpperCase(), index === 4 ? 'invalid' : 'default'));
    parts.push(text(x + 218, actionY + 234, index === 4 ? 'RUST + LABEL' : 'ICON NEVER SOLE LABEL', 10.5, index === 4 ? P.invalidRust : P.utilityTextMuted, 500, 'start', 'IBM Plex Sans Condensed', 0.5));
  });

  const cursorY = 1585;
  parts.push(text(48, cursorY, 'F-09 · CANONICAL CURSOR SVG FAMILY + SOURCE HOTSPOTS', 18, P.focus, 500, 'start', 'IBM Plex Sans Condensed', 1.2));
  parts.push(text(width - 48, cursorY, 'PNG HANDOFF LATER · HOTSPOTS PRESERVED', 12, P.utilityTextMuted, 500, 'end', 'IBM Plex Sans Condensed', 0.9));
  components.canonicalCursorSources.forEach((id, index) => {
    const x = 48 + index * 682;
    const definition = getIcon(id);
    if (!definition || !('hotspot' in definition)) throw new Error(`Missing cursor hotspot ${id}`);
    const hotspot = definition.hotspot as { readonly x: number; readonly y: number };
    parts.push(panel(x, cursorY + 30, 650, 470, P.utilityChassis));
    parts.push(text(x + 22, cursorY + 64, id.toUpperCase().replaceAll('-', ' '), 13, P.utilityText, 500, 'start', 'IBM Plex Sans Condensed', 0.7));
    const underlays = [P.quotaCoPaperLight, P.irisNavy] as const;
    underlays.forEach((underlay, underlayIndex) => {
      const baseY = cursorY + 88 + underlayIndex * 170;
      parts.push(rect(x + 22, baseY, 606, 146, underlay, underlay === P.irisNavy ? P.irisSignal : P.ink, 1, 2));
      [24, 32, 48].forEach((size, sizeIndex) => {
        const iconX = x + 90 + sizeIndex * 170;
        const iconY = baseY + 34;
        parts.push(icon(id, iconX, iconY, size));
        const hotX = iconX + size * hotspot.x;
        const hotY = iconY + size * hotspot.y;
        parts.push(line(hotX - 5, hotY, hotX + 5, hotY, P.invalidRust, 1.5));
        parts.push(line(hotX, hotY - 5, hotX, hotY + 5, P.invalidRust, 1.5));
        parts.push(text(iconX + size / 2, baseY + 118, `${size}px`, 10, underlay === P.irisNavy ? P.irisSignal : P.ink, 400, 'middle', 'IBM Plex Mono'));
      });
    });
    parts.push(text(x + 22, cursorY + 440, `HOTSPOT ${hotspot.x.toFixed(3)} / ${hotspot.y.toFixed(3)}`, 11, P.utilityTextMuted, 400, 'start', 'IBM Plex Mono'));
    parts.push(text(x + 628, cursorY + 440, 'SOURCE AUTHORITY', 11, P.focus, 500, 'end', 'IBM Plex Sans Condensed', 0.7));
  });

  parts.push(panel(48, 2115, width - 96, 205, P.utilityChassis));
  parts.push(text(70, 2152, 'OWNERSHIP LOCK', 14, P.focus, 500, 'start', 'IBM Plex Sans Condensed', 0.9));
  parts.push(multiline(70, 2184, [
    'TERRARIUM: visible design, 34 canonical stateless marks, source-owned cursor hotspots, derived technical print.',
    'UNITY LATER: semantic controls, layout, focus order, tooltips, live text, data binding, world geometry, and accessibility.',
    'SIGNALS: teal selection/valid · rust invalid/repair · amber dormant Capture only · rose emotion only.',
  ], 13, P.utilityTextMuted, 28));
  parts.push(text(width - 70, 2298, 'ACTION/CURSOR SOURCE PROMOTION APPROVED · EXPORT AND UNITY REMAIN CLOSED', 12, P.focus, 500, 'end', 'IBM Plex Sans Condensed', 0.9));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function topStrip(scale: number): string {
  const height = Math.round(48 * scale);
  const parts = [
    rect(0, 0, 1280, height, P.utilityWellDeep, P.darkRule, 2),
    text(18 * scale, height / 2 + 6 * scale, 'QUOTACO BRANCH · DAY 1', 16 * scale, P.utilityText, 500, 'start', 'IBM Plex Sans Condensed', 0.9 * scale),
  ];
  const items = [
    ['COMMITMENT', '40 × STRUCTURED DATA'],
    ['ARRIVED', '0 / 40'],
    ['ATTENTION', '3'],
  ] as const;
  const rightWidth = 690;
  const cell = rightWidth / items.length;
  items.forEach(([label, value], index) => {
    const x = 1280 - rightWidth + index * cell;
    parts.push(line(x, 7 * scale, x, height - 7 * scale, P.disabled, 1));
    parts.push(text(x + cell / 2, 17 * scale, label, 11.5 * scale, P.utilityTextMuted, 500, 'middle', 'IBM Plex Sans Condensed', 0.5 * scale));
    parts.push(text(x + cell / 2, 38 * scale, value, 14 * scale, P.utilityText, 400, 'middle', 'IBM Plex Mono'));
  });
  return parts.join('');
}

function chainNode(x: number, y: number, width: number, label: string, status: string, selected: boolean, glyphId: string, scale: number): string {
  const height = 38 * scale;
  const fill = selected ? P.selection : P.utilityWell;
  const stroke = selected ? P.selectionEdge : P.utilitySleeve;
  const parts = [rect(x, y, width, height, fill, stroke, selected ? 2 : 1, 2)];
  parts.push(departmentGlyph(glyphId, x + 9 * scale, y + 8 * scale, 22 * scale, selected ? P.utilityText : P.utilityTextMuted));
  parts.push(text(x + 40 * scale, y + 17 * scale, label, 12.5 * scale, P.utilityText, 500, 'start', 'IBM Plex Sans Condensed', 0.45 * scale));
  parts.push(text(x + 40 * scale, y + 32 * scale, status, 10.5 * scale, selected ? P.focus : P.utilityTextMuted, 400, 'start', 'IBM Plex Sans', 0.2 * scale));
  if (selected) parts.push(focusCorners(x, y, width, height, scale));
  return parts.join('');
}

function readinessRow(x: number, y: number, glyphId: string, label: string, status: 'complete' | 'missing' | 'unavailable', scale: number): string {
  const statusColor = status === 'complete' ? P.selectionEdge : status === 'missing' ? P.invalidRust : P.disabled;
  const stateId = status === 'complete' ? 'state-complete' : status === 'missing' ? 'state-missing' : 'state-unavailable';
  return [
    departmentGlyph(glyphId, x, y, 17 * scale, P.ink),
    text(x + 24 * scale, y + 13 * scale, label, 11.5 * scale, P.ink, 400, 'start', 'Courier Prime'),
    departmentGlyph(stateId, x + 131 * scale, y, 17 * scale, statusColor),
  ].join('');
}

function selectedDepartmentRecord(x: number, y: number, width: number, scale: number): string {
  const height = 138 * scale;
  const parts = [paper(x, y, width, height)];
  parts.push(text(x + 12 * scale, y + 26 * scale, 'QT–D01 · INTAKE', 14 * scale, P.ink, 700, 'start', 'Courier Prime'));
  parts.push(line(x + 12 * scale, y + 34 * scale, x + width - 12 * scale, y + 34 * scale, P.quotaCoPaperRule, 1));
  const rows = [
    ['ready-room', 'ROOM', 'complete'],
    ['ready-designated', 'DESIGNATED', 'complete'],
    ['ready-equipped', 'EQUIPPED', 'missing'],
    ['ready-io', 'IO READY', 'missing'],
    ['ready-connected', 'CONNECTED', 'missing'],
    ['ready-staffed', 'STAFFED', 'unavailable'],
  ] as const;
  rows.forEach(([glyph, label, status], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    parts.push(readinessRow(x + 12 * scale + column * (width / 2 - 6 * scale), y + 45 * scale + row * 27 * scale, glyph, label, status, scale));
  });
  parts.push(text(x + width - 12 * scale, y + height - 10 * scale, 'DESIGNATED ≠ READY', 10 * scale, P.invalidRust, 700, 'end', 'Courier Prime'));
  return parts.join('');
}

function requirementCard(x: number, y: number, width: number, id: string, label: string, selected: boolean, scale: number): string {
  const height = 138 * scale;
  const fill = selected ? '#B7AA8B' : P.quotaCoPaper;
  const edge = selected ? P.selection : P.ink;
  const parts = [rect(x + 3 * scale, y + 4 * scale, width, height, '#11120E66', 'none', 0, 1), rect(x, y, width, height, fill, edge, selected ? 3 : 1.5, 1)];
  parts.push(technicalMachine(id, x + width / 2 - 34 * scale, y + 9 * scale, 68 * scale));
  parts.push(line(x + 8 * scale, y + 80 * scale, x + width - 8 * scale, y + 80 * scale, P.quotaCoPaperRule, 1));
  parts.push(text(x + 10 * scale, y + 99 * scale, label.toUpperCase(), 11.5 * scale, P.ink, 700, 'start', 'Courier Prime'));
  parts.push(text(x + 10 * scale, y + 118 * scale, id === 'sorting_frame' ? '2 × 2 · MISSING' : id === 'franking_machine' ? '1 × 1 · MISSING' : '1 × 1 · ROUTE NEEDED', 10 * scale, id === 'dispatch_station' ? P.invalidRust : P.ink, 400, 'start', 'Courier Prime'));
  parts.push(text(x + width - 10 * scale, y + 133 * scale, selected ? 'SELECTED · INERT' : 'BROWSE', 9 * scale, selected ? P.selection : P.quotaCoPaperRule, 700, 'end', 'Courier Prime'));
  if (selected) parts.push(focusCorners(x, y, width, height, scale));
  return parts.join('');
}

function irisDiagnostic(x: number, y: number, width: number, height: number, title: string, body: readonly string[], invalid = false, scale = 1): string {
  const parts = [irisPanel(x, y, width, height)];
  parts.push(icon('iris-mark', x + 13 * scale, y + 12 * scale, 22 * scale, P.irisSignal));
  parts.push(text(x + 43 * scale, y + 27 * scale, title, 12 * scale, P.irisSignal, 400, 'start', 'IBM Plex Mono', 0.4 * scale));
  parts.push(line(x + 12 * scale, y + 37 * scale, x + width - 12 * scale, y + 37 * scale, P.irisSignal, 1));
  body.forEach((copy, index) => parts.push(text(x + 13 * scale, y + 59 * scale + index * 21 * scale, copy, 10.5 * scale, P.irisSignal, 400, 'start', 'IBM Plex Mono')));
  if (invalid) {
    parts.push(rect(x + 4 * scale, y + 5 * scale, 4 * scale, height - 10 * scale, P.invalidRust));
    parts.push(departmentGlyph('state-blocked', x + width - 31 * scale, y + 11 * scale, 20 * scale, P.invalidRust));
  }
  return parts.join('');
}

function shelfHeader(y: number, scale: number, context: string): string {
  const parts = [
    text(16 * scale, y + 26 * scale, `BUILD · ${context}`, 15 * scale, P.utilityText, 500, 'start', 'IBM Plex Sans Condensed', 0.85 * scale),
  ];
  const buttonHeight = 30 * scale;
  parts.push(controlButton(930 * scale, y + 8 * scale, 104 * scale, buttonHeight, 'CHAIN', 'selected', scale));
  parts.push(controlButton(1038 * scale, y + 8 * scale, 132 * scale, buttonHeight, 'ALL ITEMS', 'default', scale));
  parts.push(controlButton(1174 * scale, y + 8 * scale, 90 * scale, buttonHeight, 'DONE', 'default', scale));
  return parts.join('');
}

function chainShelf(scenario: ScreenScenario, shelfY: number, scale: number): string {
  const parts = [rect(0, shelfY, 1280, 720 - shelfY, P.utilityChassis, P.darkRule, 2), line(1, shelfY + 1, 1279, shelfY + 1, '#969075', 1)];
  parts.push(shelfHeader(shelfY, scale, 'RECORDS DIGITIZATION'));
  const chainY = shelfY + 47 * scale;
  parts.push(chainNode(16 * scale, chainY, 250 * scale, 'INTAKE', 'INCOMPLETE · 2 / 8', true, 'work-intake', scale));
  parts.push(text(281 * scale, chainY + 26 * scale, '→', 23 * scale, P.utilityTextMuted, 400, 'middle', 'IBM Plex Sans'));
  parts.push(chainNode(296 * scale, chainY, 280 * scale, 'DATA PROCESSING', 'INCOMPLETE · 1 / 8', false, 'work-data-processing', scale));
  parts.push(text(591 * scale, chainY + 26 * scale, '→', 23 * scale, P.utilityTextMuted, 400, 'middle', 'IBM Plex Sans'));
  parts.push(chainNode(606 * scale, chainY, 238 * scale, 'DELIVERY', 'UNAVAILABLE', false, 'work-delivery', scale));
  parts.push(text(865 * scale, chainY + 14 * scale, 'SELECTED: INTAKE', 11 * scale, P.focus, 500, 'start', 'IBM Plex Sans Condensed', 0.6 * scale));
  parts.push(text(865 * scale, chainY + 32 * scale, 'Browse is inert · Place arms world tool', 10.5 * scale, P.utilityTextMuted, 400, 'start', 'IBM Plex Sans'));

  const detailY = shelfY + 96 * scale;
  const selected = scenario === 'requirement-selected';
  parts.push(selectedDepartmentRecord(16 * scale, detailY, 320 * scale, scale));
  parts.push(requirementCard(350 * scale, detailY, 190 * scale, 'sorting_frame', 'Sorting Frame', selected, scale));
  parts.push(requirementCard(550 * scale, detailY, 190 * scale, 'franking_machine', 'Franking Machine', false, scale));
  parts.push(requirementCard(750 * scale, detailY, 190 * scale, 'dispatch_station', 'Dispatch Station', false, scale));
  if (selected) {
    parts.push(irisDiagnostic(954 * scale, detailY, 310 * scale, 138 * scale, 'IRIS // SELECTION', [
      'SORTING FRAME IS MISSING.',
      'SELECTION DID NOT ARM PLACEMENT.',
      'PRESS PLACE TO ENTER WORLD TOOL.',
    ], false, scale));
  } else {
    parts.push(irisDiagnostic(954 * scale, detailY, 310 * scale, 138 * scale, 'IRIS // FIRST BREAK', [
      'INTAKE IS DESIGNATED.',
      'EQUIPMENT IS INCOMPLETE.',
      'NEXT: SORTING FRAME.',
    ], false, scale));
  }
  return parts.join('');
}

function placementShelf(shelfY: number): string {
  const parts = [rect(0, shelfY, 1280, 720 - shelfY, P.utilityChassis, P.darkRule, 2), line(1, shelfY + 1, 1279, shelfY + 1, '#969075', 1)];
  parts.push(shelfHeader(shelfY, 1, 'PLACE SORTING FRAME'));
  parts.push(paper(16, shelfY + 53, 360, 178));
  parts.push(text(30, shelfY + 82, 'QT–M14 · SORTING FRAME', 15, P.ink, 700, 'start', 'Courier Prime'));
  parts.push(technicalMachine('sorting_frame', 28, shelfY + 92, 94));
  parts.push(text(137, shelfY + 118, 'FOOTPRINT  2 × 2', 12, P.ink, 400, 'start', 'Courier Prime'));
  parts.push(text(137, shelfY + 143, 'DEPARTMENT  INTAKE', 12, P.ink, 400, 'start', 'Courier Prime'));
  parts.push(text(137, shelfY + 168, 'STATE  VALID PREVIEW', 12, P.selection, 700, 'start', 'Courier Prime'));
  parts.push(text(137, shelfY + 196, 'CLICK OFFICE TO COMMIT', 11, P.ink, 400, 'start', 'Courier Prime'));
  parts.push(controlButton(395, shelfY + 60, 132, 40, 'ROTATE', 'default'));
  parts.push(controlButton(395, shelfY + 112, 132, 40, 'CANCEL', 'default'));
  parts.push(controlButton(395, shelfY + 164, 132, 40, 'PLACE', 'selected'));
  parts.push(irisDiagnostic(550, shelfY + 53, 420, 178, 'IRIS // PLACEMENT', [
    'VALID: 4 CELLS INSIDE INTAKE.',
    'AISLE CLEARANCE PRESERVED.',
    'CLICK COMMITS ONE RECOVERABLE EDIT.',
    'ESC CANCELS WITHOUT MUTATION.',
  ]));
  parts.push(paper(992, shelfY + 53, 272, 178));
  parts.push(text(1006, shelfY + 81, 'BUILD RECEIPT', 13, P.ink, 700, 'start', 'Courier Prime'));
  parts.push(line(1006, shelfY + 91, 1250, shelfY + 91, P.quotaCoPaperRule, 1));
  parts.push(text(1006, shelfY + 117, 'PENDING COMMIT', 12, P.ink, 400, 'start', 'Courier Prime'));
  parts.push(text(1006, shelfY + 145, 'UNDO APPEARS AFTER', 11, P.ink, 400, 'start', 'Courier Prime'));
  parts.push(text(1006, shelfY + 168, 'AUTHORITY REVALIDATION', 11, P.ink, 400, 'start', 'Courier Prime'));
  return parts.join('');
}

function routeShelf140(shelfY: number): string {
  const scale = 1.4;
  const parts = [rect(0, shelfY, 1280, 720 - shelfY, P.utilityChassis, P.darkRule, 2), line(1, shelfY + 1, 1279, shelfY + 1, '#969075', 1)];
  parts.push(text(18, shelfY + 37, 'BUILD · TUBE ROUTE · INTAKE → DATA PROCESSING', 21, P.utilityText, 500, 'start', 'IBM Plex Sans Condensed', 1.1));
  parts.push(controlButton(935, shelfY + 11, 145, 48, 'UNDO POINT', 'default', 1.2));
  parts.push(controlButton(1092, shelfY + 11, 170, 48, 'CANCEL ROUTE', 'default', 1.2));
  parts.push(paper(18, shelfY + 75, 360, 207));
  parts.push(text(35, shelfY + 111, 'QT–R08 · ROUTE WORK ORDER', 18, P.ink, 700, 'start', 'Courier Prime'));
  parts.push(line(35, shelfY + 122, 361, shelfY + 122, P.quotaCoPaperRule, 1));
  parts.push(text(35, shelfY + 154, 'FROM  INTAKE DISPATCH', 16, P.ink, 400, 'start', 'Courier Prime'));
  parts.push(text(35, shelfY + 184, 'TO    DATA PROCESSING INPUT', 16, P.ink, 400, 'start', 'Courier Prime'));
  parts.push(text(35, shelfY + 219, 'PATH  PLAYER AUTHORED', 15, P.ink, 400, 'start', 'Courier Prime'));
  parts.push(text(35, shelfY + 255, 'STATE INVALID · RECOVERABLY ARMED', 13, P.invalidRust, 700, 'start', 'Courier Prime'));
  parts.push(irisDiagnostic(400, shelfY + 75, 522, 207, 'IRIS // WALL PASS INVALID', [
    'OBSERVED: ROUTE CROSSES SOLID WALL.',
    'REPAIR: CHOOSE THE SHARED WALL BAY.',
    'NO OFFICE MUTATION HAS OCCURRED.',
    'ENDPOINTS REMAIN COMPATIBLE.',
  ], true, 1.25));
  parts.push(rect(944, shelfY + 75, 318, 207, P.utilityWell, P.utilitySleeve, 2, 2));
  parts.push(text(962, shelfY + 109, 'ROUTE TOOL', 15, P.focus, 500, 'start', 'IBM Plex Sans Condensed', 0.8));
  parts.push(departmentGlyph('route-output', 964, shelfY + 128, 34, P.utilityText));
  parts.push(text(1008, shelfY + 151, 'OUTPUT LOCKED', 14, P.utilityText, 400, 'start', 'IBM Plex Sans'));
  parts.push(departmentGlyph('route-input', 964, shelfY + 169, 34, P.utilityText));
  parts.push(text(1008, shelfY + 192, 'INPUT LOCKED', 14, P.utilityText, 400, 'start', 'IBM Plex Sans'));
  parts.push(departmentGlyph('route-wall-pass', 964, shelfY + 210, 34, P.invalidRust));
  parts.push(text(1008, shelfY + 233, 'WALL PASS MISSING', 14, P.invalidRust, 500, 'start', 'IBM Plex Sans'));
  parts.push(text(1244, shelfY + 270, `${Math.round(scale * 100)}% TYPE REFLOW`, 12, P.utilityTextMuted, 500, 'end', 'IBM Plex Sans Condensed', 0.6));
  return parts.join('');
}

function worldImage(worldDataUrl: string, topHeight: number, shelfY: number, clipId: string): string {
  const height = shelfY - topHeight;
  const sourceCropTop = 70;
  const sourceCropHeight = 440;
  const sourceScale = height / sourceCropHeight;
  const sourceWidth = 1792 * sourceScale;
  const sourceHeight = 1024 * sourceScale;
  const sourceX = (1280 - sourceWidth) / 2;
  const sourceY = topHeight - sourceCropTop * sourceScale;
  return [
    `<clipPath id="${clipId}"><rect x="0" y="${topHeight}" width="1280" height="${height}"/></clipPath>`,
    `<g clip-path="url(#${clipId})"><image href="${worldDataUrl}" x="${sourceX}" y="${sourceY}" width="${sourceWidth}" height="${sourceHeight}"/></g>`,
    rect(0, topHeight, 1280, height, '#090A0715'),
  ].join('');
}

function placementOverlay(topHeight: number, shelfY: number): string {
  const y = topHeight + (shelfY - topHeight) * 0.48;
  const x = 610;
  const parts: string[] = [];
  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < 2; column += 1) {
      parts.push(rect(x + column * 44, y + row * 30, 42, 28, '#405F5288', P.selectionEdge, 2, 1));
    }
  }
  parts.push(technicalMachine('sorting_frame', x + 3, y - 66, 82));
  parts.push(focusCorners(x - 5, y - 72, 98, 136, 1.1));
  parts.push(rect(x + 108, y - 40, 188, 54, P.utilityWellDeep, P.selectionEdge, 2, 2));
  parts.push(text(x + 124, y - 16, 'VALID · 2 × 2', 13, P.focus, 500, 'start', 'IBM Plex Sans Condensed', 0.7));
  parts.push(text(x + 124, y + 3, 'CLICK TO COMMIT', 11, P.utilityText, 400, 'start', 'IBM Plex Sans'));
  return parts.join('');
}

function routeOverlay(topHeight: number, shelfY: number): string {
  const height = shelfY - topHeight;
  const y = topHeight + height * 0.56;
  const points = [[310, y], [510, y], [510, y - 90], [720, y - 90], [720, y - 145], [920, y - 145]] as const;
  const parts: string[] = [];
  const segment = (a: readonly [number, number], b: readonly [number, number], invalid: boolean): void => {
    const color = invalid ? P.invalidRust : P.selectionEdge;
    parts.push(line(a[0], a[1], b[0], b[1], P.darkRule, 15));
    parts.push(line(a[0], a[1], b[0], b[1], color, 9));
  };
  for (let index = 0; index < points.length - 1; index += 1) segment(points[index], points[index + 1], index === 3);
  points.forEach(([px, py], index) => {
    if (index !== 0 && index !== points.length - 1) parts.push(rect(px - 6, py - 6, 12, 12, index === 4 ? P.invalidRust : P.selectionEdge, P.darkRule, 2, 1));
  });
  parts.push(departmentGlyph('route-output', points[0][0] - 19, points[0][1] - 19, 38, P.utilityText));
  parts.push(departmentGlyph('route-input', points.at(-1)![0] - 19, points.at(-1)![1] - 19, 38, P.utilityText));
  parts.push(departmentGlyph('route-wall-pass', 704, y - 129, 32, P.invalidRust));
  parts.push(rect(744, y - 175, 280, 60, P.irisNavy, P.invalidRust, 2, 2));
  parts.push(text(760, y - 150, 'INVALID WALL CROSSING', 14, P.irisSignal, 400, 'start', 'IBM Plex Mono'));
  parts.push(text(760, y - 128, 'Choose shared wall bay.', 12, P.irisSignal, 400, 'start', 'IBM Plex Mono'));
  return parts.join('');
}

function screenScenario(scenario: ScreenScenario, worldDataUrl: string, clipId: string): string {
  const scale = scenario === 'route-invalid-140' ? 1.4 : 1;
  const topHeight = Math.round(48 * scale);
  const shelfHeight = scenario === 'route-invalid-140' ? 288 : 248;
  const shelfY = 720 - shelfHeight;
  const parts = [rect(0, 0, 1280, 720, P.page, P.quotaCoPaper, 2), worldImage(worldDataUrl, topHeight, shelfY, clipId), topStrip(scale)];
  if (scenario === 'placement-valid') parts.push(placementOverlay(topHeight, shelfY));
  if (scenario === 'route-invalid-140') parts.push(routeOverlay(topHeight, shelfY));
  if (scenario === 'chain-browse' || scenario === 'requirement-selected') parts.push(chainShelf(scenario, shelfY, 1));
  if (scenario === 'placement-valid') parts.push(placementShelf(shelfY));
  if (scenario === 'route-invalid-140') parts.push(routeShelf140(shelfY));
  parts.push(rect(0, 0, 1280, 720, 'none', P.quotaCoPaper, 2));
  return parts.join('');
}

function literalScreensSheet(fontCss: string, worldDataUrl: string): string {
  const width = 2720;
  const height = 1720;
  const parts: string[] = [backdrop(width, height), `<style>${fontCss}</style>`];
  parts.push(text(50, 52, 'DEPARTMENT BUILD · LITERAL 1280 × 720 PRODUCTION COMPOSITIONS', 30, P.utilityText, 500, 'start', 'IBM Plex Sans Condensed', 2));
  parts.push(text(50, 84, 'OFFICE DOMINANT · INERT BROWSE → EXPLICIT ARMING → VALID PREVIEW → RECOVERABLE INVALID ROUTE', 13, P.utilityTextMuted, 500, 'start', 'IBM Plex Sans Condensed', 1));
  const scenarios = [
    { x: 50, y: 145, id: 'chain-browse' as const, label: '01 · CHAIN BROWSE · 100% · NO TOOL ARMED' },
    { x: 1390, y: 145, id: 'requirement-selected' as const, label: '02 · REQUIREMENT SELECTED · 100% · STILL INERT' },
    { x: 50, y: 945, id: 'placement-valid' as const, label: '03 · PLACEMENT ARMED · 100% · VALID WORLD PREVIEW' },
    { x: 1390, y: 945, id: 'route-invalid-140' as const, label: '04 · TUBE ROUTE · 140% · INVALID + ONE REPAIR' },
  ];
  scenarios.forEach((entry, index) => {
    parts.push(text(entry.x, entry.y - 18, entry.label, 16, index === 3 ? P.irisSignal : P.focus, 500, 'start', 'IBM Plex Sans Condensed', 1));
    parts.push(`<g transform="translate(${entry.x} ${entry.y})">${screenScenario(entry.id, worldDataUrl, `world-${index}`)}</g>`);
  });
  parts.push(text(width - 50, height - 20, 'WORLD IMAGE IS APPROVED COMPOSITION REFERENCE ONLY · GLYPHS RESOLVE FROM CANONICAL TERRARIUM SOURCES · UNITY UNTOUCHED', 11, P.focus, 500, 'end', 'IBM Plex Sans Condensed', 0.9));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function allItemsShelf(shelfY: number, searchFocused: boolean): string {
  const parts = [rect(0, shelfY, 1280, 720 - shelfY, P.utilityChassis, P.darkRule, 2), line(1, shelfY + 1, 1279, shelfY + 1, '#969075', 1)];
  parts.push(text(16, shelfY + 27, 'BUILD · ALL ITEMS', 15, P.utilityText, 500, 'start', 'IBM Plex Sans Condensed', 0.85));
  parts.push(controlButton(930, shelfY + 8, 104, 30, 'CHAIN', 'default'));
  parts.push(controlButton(1038, shelfY + 8, 132, 30, 'ALL ITEMS', 'selected'));
  parts.push(controlButton(1174, shelfY + 8, 90, 30, 'DONE', 'default'));
  const categories = ['STRUCTURE', 'DEPARTMENTS', 'PRODUCTION', 'LOGISTICS', 'AMENITIES', 'SURFACES', 'OUTDOOR', 'PREFABS'] as const;
  categories.forEach((label, index) => {
    const x = 16 + index * 118;
    const selected = index === 2;
    parts.push(rect(x, shelfY + 48, 110, 30, selected ? P.selection : P.utilityWell, selected ? P.selectionEdge : P.darkRule, selected ? 2 : 1, 1));
    parts.push(text(x + 55, shelfY + 68, label, 8.8, selected ? P.utilityText : P.utilityTextMuted, 500, 'middle', 'IBM Plex Sans Condensed', 0.35));
  });
  const searchX = 974;
  parts.push(rect(searchX, shelfY + 48, 290, 30, P.utilityWellDeep, searchFocused ? P.focus : P.darkRule, searchFocused ? 2 : 1, 2));
  parts.push(text(searchX + 12, shelfY + 68, searchFocused ? 'station' : 'Search all items', 11.5, searchFocused ? P.utilityText : P.utilityTextMuted, 400, 'start', 'IBM Plex Sans'));
  if (searchFocused) parts.push(focusCorners(searchX, shelfY + 48, 290, 30));

  const cards = searchFocused
    ? [
        ['dispatch_station', 'DISPATCH STATION', 'LOGISTICS · 1 × 1'],
        ['franking_machine', 'FRANKING STATION', 'PRODUCTION · 1 × 1'],
        ['sorting_frame', 'SORTING STATION', 'PRODUCTION · 2 × 2'],
      ] as const
    : [
        ['sorting_frame', 'SORTING FRAME', 'PRODUCTION · 2 × 2'],
        ['franking_machine', 'FRANKING MACHINE', 'PRODUCTION · 1 × 1'],
        ['dispatch_station', 'DISPATCH STATION', 'LOGISTICS · 1 × 1'],
        ['workbench', 'INTAKE WORKBENCH', 'PRODUCTION · 2 × 1'],
        ['route-tool', 'TUBE ROUTE', 'LOGISTICS · GEOMETRY TOOL'],
      ] as const;
  const cardWidth = searchFocused ? 285 : 226;
  cards.forEach(([id, label, detail], index) => {
    const x = 16 + index * (cardWidth + 12);
    const selected = searchFocused && index === 0;
    parts.push(rect(x, shelfY + 93, cardWidth, 138, selected ? '#B7AA8B' : P.quotaCoPaper, selected ? P.selection : P.ink, selected ? 3 : 1, 1));
    if (id === 'route-tool') {
      parts.push(departmentGlyph('route-output', x + 12, shelfY + 111, 38, P.ink));
      parts.push(departmentGlyph('route-wall-pass', x + 42, shelfY + 111, 38, P.ink));
      parts.push(departmentGlyph('route-input', x + 72, shelfY + 111, 38, P.ink));
    } else {
      parts.push(technicalMachine(id, x + 12, shelfY + 102, 76));
    }
    parts.push(text(x + 96, shelfY + 123, label, 11, P.ink, 700, 'start', 'Courier Prime'));
    parts.push(text(x + 96, shelfY + 146, detail, 9.5, P.ink, 400, 'start', 'Courier Prime'));
    parts.push(text(x + 96, shelfY + 169, selected ? 'SELECTED · INERT' : 'WHOLE CELL ACTION', 9, selected ? P.selection : P.quotaCoPaperRule, 700, 'start', 'Courier Prime'));
    parts.push(text(x + 12, shelfY + 215, selected ? 'PRESS PLACE TO ARM' : 'BROWSE', 9, selected ? P.selection : P.ink, 700, 'start', 'Courier Prime'));
    if (selected) parts.push(focusCorners(x, shelfY + 93, cardWidth, 138));
  });
  const noteX = searchFocused ? 940 : 1202;
  const noteWidth = searchFocused ? 324 : 62;
  if (searchFocused) {
    parts.push(irisDiagnostic(noteX, shelfY + 93, noteWidth, 138, 'IRIS // INPUT OWNERSHIP', [
      'SEARCH OWNS TYPING WHILE FOCUSED.',
      'WASD DOES NOT MOVE CAMERA NOW.',
      'SELECTION REMAINS INERT.',
    ]));
  } else {
    parts.push(rect(noteX, shelfY + 93, noteWidth, 138, P.utilityWell, P.darkRule, 1, 1));
    parts.push(rect(noteX + 45, shelfY + 108, 8, 106, P.utilityWellDeep, P.darkRule, 1, 2));
    parts.push(rect(noteX + 46, shelfY + 131, 6, 36, P.utilityTextMuted, P.darkRule, 1, 2));
  }
  return parts.join('');
}

function peopleHandoffShelf(shelfY: number): string {
  const parts = [rect(0, shelfY, 1280, 720 - shelfY, P.utilityChassis, P.darkRule, 2), line(1, shelfY + 1, 1279, shelfY + 1, '#969075', 1)];
  parts.push(text(16, shelfY + 27, 'PEOPLE · INTAKE STAFFING', 15, P.utilityText, 500, 'start', 'IBM Plex Sans Condensed', 0.85));
  parts.push(text(304, shelfY + 27, 'FILTERED HANDOFF FROM BUILD · NO ASSIGNMENT OCCURRED', 11, P.focus, 500, 'start', 'IBM Plex Sans Condensed', 0.55));
  parts.push(controlButton(1110, shelfY + 8, 154, 30, 'RETURN BUILD', 'default'));
  parts.push(paper(16, shelfY + 52, 300, 178));
  parts.push(text(30, shelfY + 80, 'QT–P08 · STAFFING NEED', 14, P.ink, 700, 'start', 'Courier Prime'));
  parts.push(line(30, shelfY + 91, 302, shelfY + 91, P.quotaCoPaperRule, 1));
  parts.push(departmentGlyph('ready-staffed', 30, shelfY + 108, 36, P.ink));
  parts.push(text(78, shelfY + 127, 'DEPARTMENT  INTAKE', 11.5, P.ink, 400, 'start', 'Courier Prime'));
  parts.push(text(78, shelfY + 151, 'REQUIRED    2 OPERATORS', 11.5, P.ink, 400, 'start', 'Courier Prime'));
  parts.push(text(78, shelfY + 175, 'ASSIGNED    0 / 2', 11.5, P.invalidRust, 700, 'start', 'Courier Prime'));
  parts.push(text(30, shelfY + 211, 'BUILD MAY FILTER · PEOPLE OWNS ASSIGNMENT', 9.5, P.ink, 700, 'start', 'Courier Prime'));

  parts.push(panel(334, shelfY + 52, 590, 178, P.utilityWell));
  parts.push(text(352, shelfY + 79, 'AVAILABLE PEOPLE', 12, P.utilityTextMuted, 500, 'start', 'IBM Plex Sans Condensed', 0.7));
  const people = [
    ['001', 'BEV PATEL', 'UNASSIGNED · OPERATOR FIT', 'selected'],
    ['002', 'MARA VOSS', 'DATA PROCESSING · BUSY', 'default'],
    ['003', 'ELI GRANT', 'UNASSIGNED · TRAINING NEEDED', 'disabled'],
  ] as const;
  people.forEach(([number, name, detail, state], index) => {
    const y = shelfY + 92 + index * 42;
    const selected = state === 'selected';
    parts.push(rect(352, y, 554, 34, selected ? P.selection : P.utilitySleeve, selected ? P.selectionEdge : P.darkRule, selected ? 2 : 1, 1, state === 'disabled' ? 'opacity="0.62"' : ''));
    parts.push(text(366, y + 22, number, 11, selected ? P.focus : P.utilityTextMuted, 400, 'start', 'IBM Plex Mono'));
    parts.push(text(410, y + 22, name, 12, P.utilityText, 500, 'start', 'IBM Plex Sans Condensed', 0.5));
    parts.push(text(560, y + 22, detail, 10.5, P.utilityTextMuted, 400, 'start', 'IBM Plex Sans'));
    if (selected) parts.push(focusCorners(352, y, 554, 34));
  });

  parts.push(irisDiagnostic(942, shelfY + 52, 322, 178, 'IRIS // HANDOFF', [
    'BUILD CONTEXT: INTAKE 0 / 2.',
    'FILTER APPLIED. NO PERSON MOVED.',
    'ASSIGNMENT REQUIRES PEOPLE AUTHORITY.',
    'RETURN PRESERVES BUILD CONTEXT.',
  ]));
  return parts.join('');
}

function designationReceiptShelf140(shelfY: number): string {
  const parts = [rect(0, shelfY, 1280, 720 - shelfY, P.utilityChassis, P.darkRule, 2), line(1, shelfY + 1, 1279, shelfY + 1, '#969075', 1)];
  parts.push(text(18, shelfY + 38, 'BUILD · DEPARTMENT MANAGEMENT · INTAKE', 21, P.utilityText, 500, 'start', 'IBM Plex Sans Condensed', 1.1));
  parts.push(controlButton(1088, shelfY + 11, 174, 48, 'RETURN CHAIN', 'default', 1.2));
  parts.push(paper(18, shelfY + 76, 360, 198));
  parts.push(text(36, shelfY + 111, 'QT–D01 · INTAKE DESIGNATION', 17, P.ink, 700, 'start', 'Courier Prime'));
  parts.push(line(36, shelfY + 124, 360, shelfY + 124, P.quotaCoPaperRule, 1));
  parts.push(text(36, shelfY + 157, 'ROOM          NORTHWEST 01', 15, P.ink, 400, 'start', 'Courier Prime'));
  parts.push(text(36, shelfY + 190, 'DESIGNATION   INTAKE', 15, P.ink, 400, 'start', 'Courier Prime'));
  parts.push(text(36, shelfY + 223, 'READINESS     2 / 8', 15, P.invalidRust, 700, 'start', 'Courier Prime'));
  parts.push(text(36, shelfY + 257, 'DESIGNATED ≠ READY', 13, P.invalidRust, 700, 'start', 'Courier Prime'));

  parts.push(panel(398, shelfY + 76, 388, 198, P.utilityWell));
  parts.push(text(416, shelfY + 108, 'DURABLE ACTIONS', 14, P.focus, 500, 'start', 'IBM Plex Sans Condensed', 0.8));
  const actions = [
    ['world-facing', 'FOCUS ROOM', 'selected'],
    ['action-rotate', 'CHANGE DESIGNATION', 'default'],
    ['action-delete', 'WITHDRAW', 'invalid'],
  ] as const;
  actions.forEach(([glyph, label, state], index) => {
    const y = shelfY + 126 + index * 46;
    parts.push(controlButton(416, y, 344, 38, label, state as ControlState, 1));
    parts.push(actionGlyph(glyph, 430, y + 7, 24, state === 'invalid' ? P.invalidRust : P.utilityText));
  });

  parts.push(paper(806, shelfY + 76, 456, 198));
  parts.push(text(824, shelfY + 111, 'QT–R12 · DESIGNATION RECEIPT', 17, P.ink, 700, 'start', 'Courier Prime'));
  parts.push(line(824, shelfY + 124, 1244, shelfY + 124, P.quotaCoPaperRule, 1));
  parts.push(text(824, shelfY + 157, 'LAST EDIT     DESIGNATED INTAKE', 14, P.ink, 400, 'start', 'Courier Prime'));
  parts.push(text(824, shelfY + 190, 'RECOVERY      UNDO AVAILABLE 00:12', 14, P.ink, 400, 'start', 'Courier Prime'));
  parts.push(controlButton(824, shelfY + 214, 174, 44, 'UNDO', 'default', 1.1));
  parts.push(actionGlyph('action-undo', 838, shelfY + 224, 24, P.utilityText));
  parts.push(controlButton(1010, shelfY + 214, 174, 44, 'REDO', 'disabled', 1.1));
  parts.push(actionGlyph('action-redo', 1024, shelfY + 224, 24, P.disabled));
  parts.push(text(1244, shelfY + 260, 'SHORT-LIVED RECOVERY', 11, P.ink, 700, 'end', 'Courier Prime'));
  return parts.join('');
}

function expandedScreenScenario(scenario: ExpandedScreenScenario, worldDataUrl: string, clipId: string): string {
  const scale = scenario === 'designation-management-receipt' ? 1.4 : 1;
  const topHeight = Math.round(48 * scale);
  const shelfHeight = scenario === 'designation-management-receipt' ? 288 : 248;
  const shelfY = 720 - shelfHeight;
  const parts = [rect(0, 0, 1280, 720, P.page, P.quotaCoPaper, 2), worldImage(worldDataUrl, topHeight, shelfY, clipId), topStrip(scale)];
  if (scenario === 'all-items-browse') parts.push(allItemsShelf(shelfY, false));
  if (scenario === 'all-items-search-focused') parts.push(allItemsShelf(shelfY, true));
  if (scenario === 'people-handoff') parts.push(peopleHandoffShelf(shelfY));
  if (scenario === 'designation-management-receipt') parts.push(designationReceiptShelf140(shelfY));
  parts.push(rect(0, 0, 1280, 720, 'none', P.quotaCoPaper, 2));
  return parts.join('');
}

function expandedScreensSheet(fontCss: string, worldDataUrl: string): string {
  const width = 2720;
  const height = 1720;
  const parts: string[] = [backdrop(width, height), `<style>${fontCss}</style>`];
  parts.push(text(50, 52, 'DEPARTMENT BUILD · PURPOSE CATALOG, HANDOFF, AND DURABLE EDIT COMPOSITIONS', 29, P.utilityText, 500, 'start', 'IBM Plex Sans Condensed', 1.8));
  parts.push(text(50, 84, 'B-08 / B-10 / B-11 + C-05 / C-12 · OFFICE DOMINANT · NO BROWSE ACTION ARMS A WORLD TOOL', 13, P.utilityTextMuted, 500, 'start', 'IBM Plex Sans Condensed', 1));
  const scenarios = [
    { x: 50, y: 145, id: 'all-items-browse' as const, label: '05 · ALL ITEMS · 100% · PURPOSE TAXONOMY · INERT BROWSE' },
    { x: 1390, y: 145, id: 'all-items-search-focused' as const, label: '06 · SEARCH FOCUSED · 100% · TYPE OWNERSHIP · STILL INERT' },
    { x: 50, y: 945, id: 'people-handoff' as const, label: '07 · PEOPLE HANDOFF · 100% · FILTERED · NO ASSIGNMENT' },
    { x: 1390, y: 945, id: 'designation-management-receipt' as const, label: '08 · DESIGNATION MANAGEMENT · 140% · DURABLE ACTIONS + RECEIPT' },
  ];
  scenarios.forEach((entry, index) => {
    parts.push(text(entry.x, entry.y - 18, entry.label, 16, index === 3 ? P.irisSignal : P.focus, 500, 'start', 'IBM Plex Sans Condensed', 0.9));
    parts.push(`<g transform="translate(${entry.x} ${entry.y})">${expandedScreenScenario(entry.id, worldDataUrl, `expanded-world-${index}`)}</g>`);
  });
  parts.push(text(width - 50, height - 20, 'ACTION MARKS AND CURSORS RESOLVE FROM CANONICAL TERRARIUM SOURCES · COMPONENT BEHAVIOR REMAINS UNITY-OWNED', 11, P.focus, 500, 'end', 'IBM Plex Sans Condensed', 0.9));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function sha256(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}

async function approvedFontCss(): Promise<string> {
  const source = await readFile(FONT_PILOT, 'utf8');
  const match = source.match(/<style>([\s\S]*?)<\/style>/);
  if (!match) throw new Error(`${FONT_PILOT} has no embedded approved font CSS`);
  return match[1];
}

function renderPng(source: string, fontFiles: readonly string[]): Buffer {
  return Buffer.from(new Resvg(source, { font: { fontFiles: [...fontFiles], loadSystemFonts: false } }).render().asPng());
}

async function stageApprovedFonts(fontCss: string): Promise<{ directory: string; files: string[] }> {
  const payloads = [...fontCss.matchAll(/base64,([A-Za-z0-9+/=]+)/g)].map((match) => match[1]);
  if (payloads.length === 0) throw new Error(`${FONT_PILOT} contains no embedded font payloads`);
  const directory = await mkdtemp(path.join(tmpdir(), 'department-era-ui-fonts-'));
  const files = await Promise.all(payloads.map(async (payload, index) => {
    const filename = path.join(directory, `approved-${String(index).padStart(2, '0')}.ttf`);
    await writeFile(filename, Buffer.from(payload, 'base64'));
    return filename;
  }));
  return { directory, files };
}

function readme(): string {
  return `# Department-era UI production design v1

Status: **approved Terrarium component source; Unity deferred**

This package creates the department-era UI in Terrarium before any Unity
implementation begins. It converts the approved UI-E0 v3 material grammar and
UI-E1a Direction B typography into structured design data and literal screen
compositions.

## Review sheets

- [Production design system](./00-production-design-system.png) ([SVG](./00-production-design-system.svg))
- [Literal department screens](./01-literal-department-screens.png) ([SVG](./01-literal-department-screens.svg))
- [Reusable component library](./02-reusable-component-library.png) ([SVG](./02-reusable-component-library.svg))
- [Purpose Catalog and handoff screens](./03-purpose-catalog-handoff-screens.png) ([SVG](./03-purpose-catalog-handoff-screens.svg))
- [Machine-readable metrics](./metrics.json)

The literal sheets contain eight exact 1280×720 compositions covering Chain,
placement, Tube Route, purpose-led All Items, focused search, People handoff,
designation management, and receipt recovery. The office remains dominant.

## Source boundaries

- Five shared UI-E1 marks are canonical production SVGs.
- Nineteen work-type, readiness, state, endpoint, wall-pass, and repair glyphs
  now resolve through canonical Terrarium production SVGs.
- Six action and world-facing marks now resolve through canonical tintable SVGs.
- Four ink-and-halo cursors now resolve through canonical literal SVGs with
  their normalized hotspots in the source manifest. PNG handoff remains later.
- Product illustrations are monochrome treatments derived from current
  canonical department-machine geometry; they are not separately redrawn SKUs.
- Panels, cards, text, state surfaces, focus placement, room highlights,
  footprints, and tube paths are compositions—not SVG assets to export.
- The embedded office image remains a visual reference, not a production master.
No Unity file, browser export, runtime implementation, or cursor texture handoff
is performed by this renderer.
`;
}

async function renderOutputs(): Promise<RenderedOutput[]> {
  const [fontCss, worldBytes] = await Promise.all([
    approvedFontCss(),
    readFile(WORLD_REFERENCE),
  ]);
  const worldDataUrl = `data:image/png;base64,${worldBytes.toString('base64')}`;
  const sources = [
    ['00-production-design-system', designSystemSheet(fontCss)],
    ['01-literal-department-screens', literalScreensSheet(fontCss, worldDataUrl)],
    ['02-reusable-component-library', componentLibrarySheet(fontCss)],
    ['03-purpose-catalog-handoff-screens', expandedScreensSheet(fontCss, worldDataUrl)],
  ] as const;
  const staged = await stageApprovedFonts(fontCss);
  try {
    return sources.map(([filename, source]) => ({
      filename,
      source,
      png: renderPng(source, staged.files),
    }));
  } finally {
    await rm(staged.directory, { recursive: true, force: true });
  }
}

async function writeOrCheck(filename: string, data: string | Uint8Array, check: boolean): Promise<void> {
  const expected = typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data);
  if (check) {
    const current = await readFile(filename).catch(() => undefined);
    if (!current || !current.equals(expected)) throw new Error(`${filename} is stale; run npm run ui:department-design`);
    return;
  }
  await writeFile(filename, expected);
}

export async function renderDepartmentEraUiProductionDesign(check = false): Promise<void> {
  const outputs = await renderOutputs();
  if (!check) await mkdir(OUTPUT, { recursive: true });
  for (const output of outputs) {
    await writeOrCheck(path.join(OUTPUT, `${output.filename}.svg`), output.source, check);
    await writeOrCheck(path.join(OUTPUT, `${output.filename}.png`), output.png, check);
  }
  const [manifestSource, componentManifestSource] = await Promise.all([
    readFile('assets/ui/department-era-design-v1/manifest.json', 'utf8'),
    readFile('assets/ui/department-era-component-library-v1/manifest.json', 'utf8'),
  ]);
  const worldBytes = await readFile(WORLD_REFERENCE);
  const metrics = {
    status: 'terrarium-production-design-source-approved',
    source: {
      manifest: 'assets/ui/department-era-design-v1/manifest.json',
      manifestSha256: sha256(manifestSource),
      componentManifest: 'assets/ui/department-era-component-library-v1/manifest.json',
      componentManifestSha256: sha256(componentManifestSource),
      fontPayload: FONT_PILOT,
      worldReference: WORLD_REFERENCE,
      worldReferenceSha256: sha256(worldBytes),
    },
    outputs: outputs.map((output) => ({
      svg: `${output.filename}.svg`,
      svgSha256: sha256(output.source),
      png: `${output.filename}.png`,
      pngSha256: sha256(output.png),
    })),
    literalScreens: [
      { id: 'chain-browse', viewport: '1280x720', uiScale: 1, armed: false },
      { id: 'requirement-selected', viewport: '1280x720', uiScale: 1, armed: false },
      { id: 'placement-valid', viewport: '1280x720', uiScale: 1, armed: true },
      { id: 'route-invalid', viewport: '1280x720', uiScale: 1.4, armed: true },
      { id: 'all-items-browse', viewport: '1280x720', uiScale: 1, armed: false },
      { id: 'all-items-search-focused', viewport: '1280x720', uiScale: 1, armed: false },
      { id: 'people-handoff', viewport: '1280x720', uiScale: 1, armed: false },
      { id: 'designation-management-receipt', viewport: '1280x720', uiScale: 1.4, armed: false },
    ],
    canonicalMarks: [
      ...design.shapeLedger.canonicalNow,
      ...design.shapeLedger.promotedDepartmentGlyphs,
      ...components.promotedActionMarks,
      ...components.canonicalCursorSources,
    ],
    promotedActionMarks: components.promotedActionMarks,
    canonicalCursorSources: components.canonicalCursorSources,
    reservations: design.reservations,
    productionChanges: [
      'Terrarium design manifest',
      'Terrarium deterministic design renderer',
      'literal department UI compositions',
    ],
    deferred: design.ownership.deferredUnityPass,
  };
  await writeOrCheck(path.join(OUTPUT, 'metrics.json'), `${JSON.stringify(metrics, null, 2)}\n`, check);
  await writeOrCheck(path.join(OUTPUT, 'README.md'), readme(), check);
  process.stdout.write(`${check ? 'Verified' : 'Wrote'} Terrarium department-era UI production design:\n${OUTPUT}\n`);
}

const check = process.argv.slice(2).includes('--check');
if (process.argv[1]?.endsWith('departmentEraUiProductionDesign.ts')) {
  renderDepartmentEraUiProductionDesign(check).catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
