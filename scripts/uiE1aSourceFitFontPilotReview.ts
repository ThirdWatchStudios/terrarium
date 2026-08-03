/**
 * UI-E1a review-only shared-shape source-fit and production-font pilot.
 *
 * Writes only docs/previews/ui-e1a-source-fit-font-pilot-v1. Candidate SVGs
 * remain review artifacts: this script does not alter live ShapeSpec builders,
 * canonical sources, export/import contracts, Unity assets, or runtime UI.
 *
 * Run with:
 *   npx tsx scripts/uiE1aSourceFitFontPilotReview.ts
 */
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';

import { composeIcon } from '../src/core/compositor';
import { CURSORS, ICONS, getIcon } from '../src/parts/icons';
import { EMOTION_ICONS } from '../src/parts/emotions';
import { REACTION_ICONS } from '../src/parts/reactions';
import { STATE_ICONS } from '../src/parts/stateIcons';

const OUTPUT = 'docs/previews/ui-e1a-source-fit-font-pilot-v1';
const CANDIDATE_OUTPUT = `${OUTPUT}/candidate-svg-review-only`;
const REFERENCE_WORLD =
  '/Users/tombiagioni/.codex/generated_images/019fc31e-f42d-7f23-b0ee-6635d674450b/exec-1244ea64-482b-4484-b7c9-576da0a93593.png';
const UNITY_ROOT = '/Users/tombiagioni/git/The-Water-Cooler';
const UNITY_FONT_ROOT = `${UNITY_ROOT}/Assets/WaterCooler/UI/Fonts`;
const GOOGLE_FONTS_COMMIT = '2796410152d4f9524b68ed46e69c1b60f8e0f7c3';

const C = {
  page: '#202119',
  pageGrid: '#2B2C23',
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
  rust: '#984820',
  ink: '#25251E',
  cream: '#D9CBA8',
  creamMuted: '#B8AD90',
  disabled: '#77725F',
  dark: '#171811',
} as const;

type TextAnchor = 'start' | 'middle' | 'end';
type CandidateDecision = 'exact-authority-inversion' | 'redesign-before-promotion';

interface Candidate {
  id: 'ui-divider' | 'ui-corner' | 'ui-focus' | 'iris-mark' | 'quotaco-mark';
  decision: CandidateDecision;
  currentUse: string;
  recommendation: string;
  sizes: readonly number[];
  carrier: 'utility' | 'iris' | 'print';
  svg: string;
}

interface FontAsset {
  key: string;
  family: string;
  weight: number;
  source: string;
  bytes: Buffer;
  license: string;
  disposition: string;
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
  color: string = C.cream,
  weight = 400,
  anchor: TextAnchor = 'start',
  family: string = 'Arial, sans-serif',
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
  family: string = 'Arial, sans-serif',
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

function tintSvg(svg: string, tint: string): string {
  return svg.replaceAll('#FFFFFF', tint);
}

function nestedIcon(svg: string, x: number, y: number, size: number, tint?: string): string {
  const body = svgBody(tint ? tintSvg(svg, tint) : svg);
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 128 128">${body}</svg>`;
}

function currentSvg(id: string): string {
  const definition = getIcon(id);
  if (!definition) throw new Error(`Missing live icon ${id}`);
  return composeIcon(id, 128);
}

function svgSource(body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">${body}</svg>`;
}

function candidates(): Candidate[] {
  return [
    {
      id: 'ui-divider',
      decision: 'exact-authority-inversion',
      currentUse: 'Discrete seam ornament; no live runtime binding found.',
      recommendation: 'Keep the lean rule and central registration diamond. It fits the approved administrative chassis at 16–32 px.',
      sizes: [16, 20, 24, 32],
      carrier: 'utility',
      svg: currentSvg('ui-divider'),
    },
    {
      id: 'ui-corner',
      decision: 'redesign-before-promotion',
      currentUse: 'Catalog candidate for UI trim and logical-footprint ticks.',
      recommendation: 'Replace the soft radius with a square open bracket so Utility trim and focus geometry share the approved drafting grammar.',
      sizes: [16, 20, 24, 32],
      carrier: 'utility',
      svg: svgSource('<path d="M36 92V36H92" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="square" stroke-linejoin="miter"/>'),
    },
    {
      id: 'ui-focus',
      decision: 'redesign-before-promotion',
      currentUse: 'Catalog candidate; no direct stable-ID runtime binding found.',
      recommendation: 'Use four open corner ticks. The current crosshair reads as surveillance and wrongly blends IRIS/Capture into Utility focus.',
      sizes: [16, 20, 24, 32],
      carrier: 'utility',
      svg: svgSource([
        '<path d="M52 34H34V52" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="square" stroke-linejoin="miter"/>',
        '<path d="M76 34H94V52" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="square" stroke-linejoin="miter"/>',
        '<path d="M34 76V94H52" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="square" stroke-linejoin="miter"/>',
        '<path d="M94 76V94H76" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="square" stroke-linejoin="miter"/>',
      ].join('')),
    },
    {
      id: 'iris-mark',
      decision: 'exact-authority-inversion',
      currentUse: 'Live stable-ID consumer at 18–20 px in Main Menu and Workstation.',
      recommendation: 'Keep the eye mark exact. It remains legible at the live sizes when contained on navy and never used as global chrome.',
      sizes: [18, 20, 24, 32],
      carrier: 'iris',
      svg: currentSvg('iris-mark'),
    },
    {
      id: 'quotaco-mark',
      decision: 'exact-authority-inversion',
      currentUse: 'Live stable-ID consumer at 42 px in Main Menu branding.',
      recommendation: 'Keep the literal halftone seal exact for its 42 px carrier. Do not assign it to 16–20 px control duty.',
      sizes: [24, 32, 42, 48],
      carrier: 'print',
      svg: currentSvg('quotaco-mark'),
    },
  ];
}

function backgroundPattern(width: number, height: number): string {
  return `<defs><pattern id="grid" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="${C.pageGrid}" stroke-width="1"/></pattern></defs>${rect(0, 0, width, height, C.page)}${rect(0, 0, width, height, 'url(#grid)', 'none', 0, 0, 'opacity="0.45"')}`;
}

function decisionLabel(decision: CandidateDecision): string {
  return decision === 'exact-authority-inversion' ? 'EXACT INVERSION' : 'REDESIGN';
}

function carrierSample(candidate: Candidate, x: number, y: number, width: number, height: number): string {
  if (candidate.carrier === 'iris') {
    return rect(x, y, width, height, C.iris, C.irisLine, 2, 2);
  }
  if (candidate.carrier === 'print') {
    return rect(x, y, width, height, C.record, C.ink, 2, 1);
  }
  return rect(x, y, width, height, C.well, C.dark, 2, 2);
}

function sourceFitSheet(entries: readonly Candidate[]): string {
  const width = 2800;
  const height = 1850;
  const parts: string[] = [backgroundPattern(width, height)];
  parts.push(rect(28, 24, width - 56, 94, C.well, C.dark, 2, 2));
  parts.push(text(60, 69, 'TERRARIUM · UI-E1a SOURCE-FIT PILOT', 27, C.cream, 500, 'start', 'Arial Narrow, sans-serif', 2.3));
  parts.push(text(60, 96, 'REVIEW-ONLY CANDIDATES · FIVE STABLE IDS · NO PRODUCTION AUTHORITY CHANGED', 12, C.creamMuted, 500, 'start', 'Arial Narrow, sans-serif', 1.2));
  parts.push(text(width - 60, 72, 'F-07 + VOICE MARKS', 15, C.focus, 500, 'end', 'Arial Narrow, sans-serif', 1.2));

  const top = 148;
  parts.push(rect(28, top, width - 56, 68, C.chassis, C.dark, 2, 1));
  parts.push(text(56, top + 26, 'STABLE ID + DECISION', 13, C.cream, 500, 'start', 'Arial Narrow, sans-serif', 1));
  parts.push(text(550, top + 26, 'CURRENT SHAPESPEC', 13, C.cream, 500, 'start', 'Arial Narrow, sans-serif', 1));
  parts.push(text(810, top + 26, 'REVIEW CANDIDATE', 13, C.cream, 500, 'start', 'Arial Narrow, sans-serif', 1));
  parts.push(text(1080, top + 26, 'LITERAL-SIZE CARRIER CHECK', 13, C.cream, 500, 'start', 'Arial Narrow, sans-serif', 1));
  parts.push(text(1850, top + 26, 'FIT JUDGMENT', 13, C.cream, 500, 'start', 'Arial Narrow, sans-serif', 1));
  parts.push(text(56, top + 51, 'Exact keeps approved pixels; redesign remains deliberately non-parity.', 12, C.creamMuted));

  entries.forEach((candidate, index) => {
    const y = 232 + index * 282;
    const current = currentSvg(candidate.id);
    const currentMode = getIcon(candidate.id)?.mode;
    const exact = candidate.decision === 'exact-authority-inversion';
    const decisionColor = exact ? C.selectLight : C.rust;
    parts.push(rect(28, y, width - 56, 260, index % 2 === 0 ? '#303128' : '#2A2B23', C.dark, 2, 2));
    parts.push(text(56, y + 38, candidate.id, 22, C.cream, 500, 'start', 'IBM Plex Mono, monospace', 0.6));
    parts.push(text(56, y + 66, decisionLabel(candidate.decision), 12, decisionColor, 500, 'start', 'Arial Narrow, sans-serif', 1.1));
    parts.push(multiline(56, y + 102, [candidate.currentUse], 13, C.creamMuted, 20, 'Arial, sans-serif'));

    const currentTint = currentMode === 'tintable' ? C.focus : undefined;
    const candidateTint = currentMode === 'tintable' ? C.focus : undefined;
    parts.push(rect(540, y + 26, 190, 190, C.wellDeep, C.dark, 2, 3));
    parts.push(nestedIcon(current, 571, y + 57, 128, currentTint));
    parts.push(text(635, y + 239, '128 px', 11, C.creamMuted, 400, 'middle'));
    parts.push(rect(800, y + 26, 190, 190, C.wellDeep, decisionColor, 2, 3));
    parts.push(nestedIcon(candidate.svg, 831, y + 57, 128, candidateTint));
    parts.push(text(895, y + 239, exact ? 'pixel parity target' : 'deliberate redraw', 11, decisionColor, 400, 'middle'));

    parts.push(carrierSample(candidate, 1060, y + 35, 730, 165));
    candidate.sizes.forEach((size, sizeIndex) => {
      const cellX = 1095 + sizeIndex * 165;
      const tint = candidate.carrier === 'print' ? undefined : candidate.carrier === 'iris' ? C.irisLine : C.focus;
      const visualX = cellX + (100 - size) / 2;
      const visualY = y + 67 + (76 - size) / 2;
      parts.push(rect(cellX, y + 58, 100, 92, candidate.carrier === 'print' ? C.recordLight : candidate.carrier === 'iris' ? C.irisMid : C.dark, candidate.carrier === 'print' ? C.recordDark : C.sleeve, 1, 1));
      parts.push(nestedIcon(candidate.svg, visualX, visualY, size, tint));
      parts.push(text(cellX + 50, y + 183, `${size}px`, 11, candidate.carrier === 'print' ? C.ink : C.creamMuted, 400, 'middle', 'IBM Plex Mono, monospace'));
    });

    const recommendationLines = candidate.recommendation.length > 104
      ? [candidate.recommendation.slice(0, candidate.recommendation.lastIndexOf(' ', 98)), candidate.recommendation.slice(candidate.recommendation.lastIndexOf(' ', 98) + 1)]
      : [candidate.recommendation];
    parts.push(multiline(1850, y + 56, recommendationLines, 15, C.cream, 25, 'Arial, sans-serif'));
    parts.push(text(1850, y + 139, exact ? 'Stable ID + tint/literal mode remain unchanged.' : 'Stable ID can remain; geometry must change only after approval.', 13, exact ? C.selectLight : C.rust, 500));
    parts.push(text(1850, y + 172, candidate.carrier === 'utility' ? 'VOICE: UTILITY' : candidate.carrier === 'iris' ? 'VOICE: IRIS ONLY' : 'VOICE: QUOTACO PRINT', 11, C.creamMuted, 500, 'start', 'Arial Narrow, sans-serif', 1));
  });

  const footerY = 1660;
  parts.push(rect(28, footerY, width - 56, 155, C.chassis, C.dark, 2, 2));
  parts.push(text(56, footerY + 34, 'PILOT DECISION', 15, C.cream, 500, 'start', 'Arial Narrow, sans-serif', 1.2));
  parts.push(text(56, footerY + 66, 'Exact inversion: ui-divider, iris-mark, quotaco-mark', 15, C.selectLight, 500));
  parts.push(text(56, footerY + 93, 'Redesign before promotion: ui-corner, ui-focus', 15, C.rust, 500));
  parts.push(multiline(820, footerY + 58, [
    'Unity UXML/USS still owns focus placement, state surfaces, carriers, controls, text, and layout.',
    'Runtime still owns logical footprints and spatial focus; these candidates are stateless marks only.',
  ], 13, C.creamMuted, 25));
  parts.push(text(width - 56, footerY + 126, 'REVIEW ONLY · STOP BEFORE CANONICAL SVG PROMOTION', 12, C.rust, 500, 'end', 'Arial Narrow, sans-serif', 1.1));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

function fontFaceCss(fonts: readonly FontAsset[]): string {
  return fonts.map((font) => {
    const data = font.bytes.toString('base64');
    return `@font-face{font-family:'${font.family}';font-style:normal;font-weight:${font.weight};src:url(data:font/ttf;base64,${data}) format('truetype');}`;
  }).join('');
}

function focusCorners(x: number, y: number, width: number, height: number, scale: number): string {
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
  ].map((path) => `<path d="${path}" fill="none" stroke="${C.focus}" stroke-width="${stroke}"/>`).join('');
}

function fontCarrierSet(x: number, y: number, width: number, scale: number, stack: 'control' | 'recommended' | 'terminal-accent'): string {
  const utilityHeading = stack === 'control' ? 'IBM Plex Sans' : 'IBM Plex Sans Condensed';
  const body = 'IBM Plex Sans';
  const print = stack === 'control' ? 'IBM Plex Mono' : 'Courier Prime';
  const irisHeading = stack === 'terminal-accent' ? 'VT323' : 'IBM Plex Mono';
  const irisBody = 'IBM Plex Mono';
  const h = 142 * scale;
  const gap = 14 * scale;
  const bodySize = 16 * scale;
  const supportSize = 14 * scale;
  const headingSize = 18 * scale;
  const pad = 18 * scale;
  const parts: string[] = [];
  parts.push(rect(x, y, width, h, C.chassis, C.dark, 2, 2));
  parts.push(text(x + pad, y + 31 * scale, 'BUILD CHAIN 0128', headingSize, C.cream, 500, 'start', utilityHeading, 0.8 * scale));
  parts.push(text(x + pad, y + 60 * scale, 'Place the Intake Desk beside a legal wall pass.', bodySize, C.cream, 400, 'start', body));
  parts.push(text(x + pad, y + 86 * scale, '40 × Structured Data · 0 / 40 arrived', supportSize, C.creamMuted, 400, 'start', body));
  const actionY = y + 101 * scale;
  const actionH = 40 * scale;
  parts.push(rect(x + pad, actionY, 155 * scale, actionH, C.select, C.selectLight, 2, 2));
  parts.push(text(x + pad + 77.5 * scale, actionY + 26 * scale, 'PLACE', supportSize, C.cream, 500, 'middle', utilityHeading, 0.7 * scale));
  parts.push(focusCorners(x + pad, actionY, 155 * scale, actionH, scale));

  const recordY = y + h + gap;
  parts.push(rect(x, recordY, width, h, C.record, C.ink, 2, 1));
  parts.push(text(x + pad, recordY + 31 * scale, 'QT–79 · INTAKE DESK', headingSize, C.ink, stack === 'control' ? 400 : 700, 'start', print));
  parts.push(line(x + pad, recordY + 42 * scale, x + width - pad, recordY + 42 * scale, C.recordDark, 1));
  parts.push(text(x + pad, recordY + 69 * scale, 'FORM  QT–79  ·  2 × 1  ·  120 DATA', bodySize, C.ink, 400, 'start', print));
  parts.push(text(x + pad, recordY + 96 * scale, 'RECEIVED  000   MISSING  040', supportSize, C.ink, 400, 'start', print));
  parts.push(text(x + pad, recordY + 124 * scale, 'FILE WITH BUILD RECEIPT', supportSize, C.ink, 400, 'start', print));

  const irisY = recordY + h + gap;
  parts.push(rect(x, irisY, width, h, C.iris, C.irisLine, 2, 2));
  parts.push(text(x + pad, irisY + 31 * scale, 'IRIS // WALL PASS', headingSize, C.irisLine, 400, 'start', irisHeading, 0.6 * scale));
  parts.push(line(x + pad, irisY + 42 * scale, x + width - pad, irisY + 42 * scale, C.irisLine, 1));
  parts.push(text(x + pad, irisY + 69 * scale, 'OBSERVED: NO LEGAL TUBE PASS', bodySize, C.irisLine, 400, 'start', irisBody));
  parts.push(text(x + pad, irisY + 96 * scale, 'Choose a shared wall, then retry.', supportSize, C.irisLine, 400, 'start', irisBody));
  parts.push(text(x + width - pad, irisY + 124 * scale, 'OBSERVED  02:15:00', supportSize, C.irisLine, 400, 'end', irisBody));
  return parts.join('');
}

function literalViewport(
  x: number,
  y: number,
  scale: number,
  worldDataUrl: string,
  label: string,
): string {
  const width = 1280;
  const height = 720;
  const topH = 64 * scale;
  const shelfH = scale === 1 ? 232 : 288;
  const worldH = height - topH - shelfH;
  const body = 16 * scale;
  const support = 14 * scale;
  const parts: string[] = [];
  parts.push(rect(x, y, width, height, C.dark, C.creamMuted, 2, 1));
  parts.push(rect(x, y, width, topH, C.wellDeep, C.recordLight, 1, 0));
  parts.push(text(x + 18 * scale, y + 39 * scale, 'QUOTACO BRANCH · DAY 1', 18 * scale, C.cream, 500, 'start', 'IBM Plex Sans Condensed', 0.8 * scale));
  parts.push(text(x + width - 30 * scale, y + 26 * scale, 'COMMITMENT', support, C.creamMuted, 500, 'end', 'IBM Plex Sans Condensed'));
  parts.push(text(x + width - 30 * scale, y + 49 * scale, '40 × STRUCTURED DATA', body, C.cream, 400, 'end', 'IBM Plex Mono'));
  parts.push(`<image href="${worldDataUrl}" x="${x}" y="${y + topH}" width="${width}" height="${worldH}" preserveAspectRatio="xMidYMid slice"/>`);
  const shelfY = y + height - shelfH;
  parts.push(rect(x, shelfY, width, shelfH, C.chassis, C.dark, 2, 0));
  parts.push(text(x + 18 * scale, shelfY + 31 * scale, `${label} · OFFICE REMAINS PRIMARY`, support, C.cream, 500, 'start', 'IBM Plex Sans Condensed', 0.7 * scale));
  const buttonY = shelfY + 48 * scale;
  const buttonH = 40 * scale;
  const buttonW = 155 * scale;
  parts.push(rect(x + 18 * scale, buttonY, buttonW, buttonH, C.select, C.selectLight, 2, 2));
  parts.push(text(x + 18 * scale + buttonW / 2, buttonY + 26 * scale, 'PLACE', support, C.cream, 500, 'middle', 'IBM Plex Sans Condensed', 0.7 * scale));
  parts.push(focusCorners(x + 18 * scale, buttonY, buttonW, buttonH, scale));
  parts.push(rect(x + 192 * scale, buttonY, 220 * scale, buttonH, C.well, C.focus, 2, 2));
  parts.push(text(x + 207 * scale, buttonY + 26 * scale, 'Search all items…', support, C.cream, 400, 'start', 'IBM Plex Sans'));
  const irisX = x + 430 * scale;
  const irisW = Math.min(365 * scale, x + width - irisX - 18 * scale);
  parts.push(rect(irisX, buttonY, irisW, buttonH, C.iris, C.irisLine, 2, 2));
  parts.push(text(irisX + 14 * scale, buttonY + 25 * scale, 'IRIS // WALL PASS INVALID', support, C.irisLine, 400, 'start', 'IBM Plex Mono'));
  const receiptY = buttonY + 56 * scale;
  const receiptW = Math.min(520 * scale, width - 36 * scale);
  parts.push(rect(x + 18 * scale, receiptY, receiptW, 54 * scale, C.record, C.ink, 2, 1));
  parts.push(text(x + 34 * scale, receiptY + 23 * scale, 'QT–79 · INTAKE DESK · PLACED', body, C.ink, 400, 'start', 'Courier Prime'));
  parts.push(text(x + 34 * scale, receiptY + 44 * scale, 'ONE RECOVERABLE OFFICE EDIT', support, C.ink, 400, 'start', 'Courier Prime'));
  return parts.join('');
}

function fontPilotSheet(fonts: readonly FontAsset[], worldDataUrl: string): string {
  const width = 2800;
  const height = 2600;
  const parts: string[] = [backgroundPattern(width, height)];
  parts.push(`<style>${fontFaceCss(fonts)}</style>`);
  parts.push(rect(28, 24, width - 56, 94, C.well, C.dark, 2, 2));
  parts.push(text(60, 69, 'TERRARIUM · UI-E1a PRODUCTION-FONT PILOT', 27, C.cream, 500, 'start', 'IBM Plex Sans Condensed', 2));
  parts.push(text(60, 96, 'ACTUAL FONT BINARIES · PINNED SOURCES · REVIEW-ONLY EMBEDDING · NO UNITY FONT ASSET CREATED', 12, C.creamMuted, 500, 'start', 'IBM Plex Sans Condensed', 1.1));
  parts.push(text(width - 60, 72, 'RECOMMENDED SPLIT', 15, C.focus, 500, 'end', 'IBM Plex Sans Condensed', 1.1));

  parts.push(text(60, 151, 'LITERAL 1280 × 720 · RECOMMENDED STACK', 17, C.cream, 500, 'start', 'IBM Plex Sans Condensed', 1.2));
  parts.push(literalViewport(60, 176, 1, worldDataUrl, '100% UI · 16 / 14 PX'));
  parts.push(literalViewport(1460, 176, 1.4, worldDataUrl, '140% UI · 22.4 / 19.6 PX'));

  const compareY = 940;
  parts.push(text(60, compareY, 'ROLE SEPARATION AT READING SCALE', 17, C.cream, 500, 'start', 'IBM Plex Sans Condensed', 1.2));
  const columns = [
    {
      x: 60,
      title: 'A · EXISTING-ONLY CONTROL',
      stack: 'control' as const,
      note: 'Plex Sans + Plex Mono only. Readable, but QuotaCo print and IRIS share one machine voice.',
      accent: C.disabled,
    },
    {
      x: 970,
      title: 'B · RECOMMENDED PRODUCTION SPLIT',
      stack: 'recommended' as const,
      note: 'Plex Sans Condensed + Plex Sans / Courier Prime / Plex Mono. Period signal without sacrificing body copy.',
      accent: C.selectLight,
    },
    {
      x: 1880,
      title: 'C · STRONG TERMINAL ACCENT',
      stack: 'terminal-accent' as const,
      note: 'Stack B plus VT323 for IRIS headings only. More era-forward, but too stylized for IRIS body copy.',
      accent: C.irisLine,
    },
  ];
  columns.forEach((column) => {
    parts.push(rect(column.x, compareY + 24, 850, 1260, C.wellDeep, column.accent, 2, 2));
    parts.push(text(column.x + 24, compareY + 61, column.title, 17, column.accent, 500, 'start', 'IBM Plex Sans Condensed', 1));
    parts.push(multiline(column.x + 24, compareY + 91, [column.note], 13, C.creamMuted, 21, 'IBM Plex Sans'));
    parts.push(text(column.x + 24, compareY + 143, '100% · 16 PX BODY / 14 PX SUPPORT / 40 PX ACTION', 11, C.creamMuted, 500, 'start', 'IBM Plex Sans Condensed', 0.8));
    parts.push(fontCarrierSet(column.x + 24, compareY + 165, 802, 1, column.stack));
    parts.push(text(column.x + 24, compareY + 634, '140% · 22.4 PX BODY / 19.6 PX SUPPORT / 56 PX ACTION', 11, C.creamMuted, 500, 'start', 'IBM Plex Sans Condensed', 0.8));
    parts.push(`<g transform="translate(${column.x + 24} ${compareY + 656}) scale(0.72)">${fontCarrierSet(0, 0, 1114, 1.4, column.stack)}</g>`);
    const glyphY = compareY + 1166;
    const monoFamily = column.stack === 'control' ? 'IBM Plex Mono' : 'Courier Prime';
    parts.push(text(column.x + 24, glyphY, 'Aa Bb Cc 0123456789 · QT–79 · 2 × 1', 16, C.cream, 400, 'start', monoFamily));
    parts.push(text(column.x + 24, glyphY + 28, '[] / — → : ; ! ?  O0 I1 lL', 14, C.creamMuted, 400, 'start', 'IBM Plex Mono'));
  });

  const ledgerY = 2270;
  parts.push(rect(28, ledgerY, width - 56, 294, C.chassis, C.dark, 2, 2));
  parts.push(text(56, ledgerY + 38, 'PRODUCTION-FIT LEDGER', 16, C.cream, 500, 'start', 'IBM Plex Sans Condensed', 1.1));
  parts.push(text(56, ledgerY + 75, 'UTILITY', 12, C.focus, 500, 'start', 'IBM Plex Sans Condensed', 0.9));
  parts.push(multiline(56, ledgerY + 103, [
    'Heading: IBM Plex Sans Condensed Medium · new candidate',
    'Body: IBM Plex Sans Regular / Medium · already present in Unity',
  ], 13, C.creamMuted, 24, 'IBM Plex Sans'));
  parts.push(text(690, ledgerY + 75, 'QUOTACO PRINT', 12, C.recordLight, 500, 'start', 'IBM Plex Sans Condensed', 0.9));
  parts.push(multiline(690, ledgerY + 103, [
    'Courier Prime Regular / Bold · new candidates',
    'Forms, receipts, record fields, tabular values; never global body copy',
  ], 13, C.creamMuted, 24, 'IBM Plex Sans'));
  parts.push(text(1370, ledgerY + 75, 'IRIS', 12, C.irisLine, 500, 'start', 'IBM Plex Sans Condensed', 0.9));
  parts.push(multiline(1370, ledgerY + 103, [
    'IBM Plex Mono Regular · already present; recommended body + heading',
    'VT323 Regular · optional heading accent only, not recommended as body',
  ], 13, C.creamMuted, 24, 'IBM Plex Sans'));
  parts.push(text(2050, ledgerY + 75, 'LICENSE / PACKAGING', 12, C.rust, 500, 'start', 'IBM Plex Sans Condensed', 0.9));
  parts.push(multiline(2050, ledgerY + 103, [
    'All pilot families are SIL OFL 1.1.',
    'Existing Unity IBM Plex folder lacks a bundled license file: close before promotion.',
  ], 13, C.creamMuted, 24, 'IBM Plex Sans'));
  parts.push(line(56, ledgerY + 177, width - 56, ledgerY + 177, C.recordDark, 1));
  parts.push(text(56, ledgerY + 211, 'RECOMMEND B', 15, C.selectLight, 500, 'start', 'IBM Plex Sans Condensed', 1));
  parts.push(text(245, ledgerY + 211, 'Keep VT323 as an optional IRIS heading accent pending owner taste; do not use it for body, buttons, or QuotaCo records.', 14, C.cream, 400, 'start', 'IBM Plex Sans'));
  parts.push(text(width - 56, ledgerY + 259, 'AMBER ABSENT · ROSE ABSENT · REVIEW ONLY · STOP BEFORE FONT IMPORT', 12, C.rust, 500, 'end', 'IBM Plex Sans Condensed', 1));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

async function fetchFont(key: string, family: string, weight: number, path: string, disposition: string): Promise<FontAsset> {
  const source = `https://raw.githubusercontent.com/google/fonts/${GOOGLE_FONTS_COMMIT}/${path}`;
  const response = await fetch(source);
  if (!response.ok) throw new Error(`Unable to fetch ${source}: ${response.status}`);
  return {
    key,
    family,
    weight,
    source,
    bytes: Buffer.from(await response.arrayBuffer()),
    license: 'SIL Open Font License 1.1',
    disposition,
  };
}

async function loadFonts(): Promise<FontAsset[]> {
  const existing = [
    {
      key: 'ibm-plex-sans-regular',
      family: 'IBM Plex Sans',
      weight: 400,
      path: `${UNITY_FONT_ROOT}/IBMPlexSans-Regular.ttf`,
      disposition: 'existing Unity TTF; embedded in review sheet only',
    },
    {
      key: 'ibm-plex-sans-medium',
      family: 'IBM Plex Sans',
      weight: 500,
      path: `${UNITY_FONT_ROOT}/IBMPlexSans-Medium.ttf`,
      disposition: 'existing Unity TTF; embedded in review sheet only',
    },
    {
      key: 'ibm-plex-mono-regular',
      family: 'IBM Plex Mono',
      weight: 400,
      path: `${UNITY_FONT_ROOT}/IBMPlexMono-Regular.ttf`,
      disposition: 'existing Unity TTF; embedded in review sheet only',
    },
  ];
  const localFonts = await Promise.all(existing.map(async (font) => ({
    key: font.key,
    family: font.family,
    weight: font.weight,
    source: font.path,
    bytes: await readFile(font.path),
    license: 'SIL Open Font License 1.1; repository license-file packaging gap noted',
    disposition: font.disposition,
  })));
  const candidateFonts = await Promise.all([
    fetchFont('ibm-plex-sans-condensed-medium', 'IBM Plex Sans Condensed', 500, 'ofl/ibmplexsanscondensed/IBMPlexSansCondensed-Medium.ttf', 'downloaded to memory for review render; not copied to Unity'),
    fetchFont('courier-prime-regular', 'Courier Prime', 400, 'ofl/courierprime/CourierPrime-Regular.ttf', 'downloaded to memory for review render; not copied to Unity'),
    fetchFont('courier-prime-bold', 'Courier Prime', 700, 'ofl/courierprime/CourierPrime-Bold.ttf', 'downloaded to memory for review render; not copied to Unity'),
    fetchFont('vt323-regular', 'VT323', 400, 'ofl/vt323/VT323-Regular.ttf', 'downloaded to memory for review render; not copied to Unity'),
  ]);
  return [...localFonts, ...candidateFonts];
}

function render(svg: string, fontFiles: readonly string[] = [], loadSystemFonts = false): Buffer {
  return new Resvg(svg, { font: { fontFiles: [...fontFiles], loadSystemFonts } }).render().asPng();
}

async function stageFontFiles(fonts: readonly FontAsset[]): Promise<{ directory: string; paths: string[] }> {
  const directory = await mkdtemp(join(tmpdir(), 'ui-e1a-fonts-'));
  const paths = await Promise.all(fonts.map(async (font) => {
    const path = join(directory, `${font.key}.ttf`);
    await writeFile(path, font.bytes);
    return path;
  }));
  return { directory, paths };
}

function pixelMismatch(a: Buffer, b: Buffer): { mismatchedPixels: number; totalPixels: number } {
  const left = PNG.sync.read(a);
  const right = PNG.sync.read(b);
  if (left.width !== right.width || left.height !== right.height) throw new Error('Parity dimensions differ');
  let mismatchedPixels = 0;
  for (let offset = 0; offset < left.data.length; offset += 4) {
    if (
      left.data[offset] !== right.data[offset] ||
      left.data[offset + 1] !== right.data[offset + 1] ||
      left.data[offset + 2] !== right.data[offset + 2] ||
      left.data[offset + 3] !== right.data[offset + 3]
    ) mismatchedPixels += 1;
  }
  return { mismatchedPixels, totalPixels: left.width * left.height };
}

function parityAtSizes(candidate: Candidate): Array<{ size: number; mismatchedPixels: number; totalPixels: number }> {
  if (candidate.decision !== 'exact-authority-inversion') return [];
  return [16, 18, 20, 24, 32, 42, 48, 64, 128].map((size) => {
    const live = render(currentSvg(candidate.id).replace('width="128" height="128"', `width="${size}" height="${size}"`));
    const review = render(candidate.svg.replace('width="128" height="128"', `width="${size}" height="${size}"`));
    return { size, ...pixelMismatch(live, review) };
  });
}

async function sha256Bytes(bytes: Uint8Array): Promise<string> {
  return createHash('sha256').update(bytes).digest('hex');
}

async function sha256File(file: string): Promise<string> {
  return sha256Bytes(await readFile(file));
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
  return Object.fromEntries(await Promise.all(files.map(async (file) => [file, await sha256File(file)])));
}

function readme(): string {
  return `# UI-E1a review-only source-fit and production-font pilot

Status: **review only; stopped for explicit visual approval**

This pilot follows the approved UI-E0 v3 direction without promoting anything
to production. The source-fit sheet audits the five bounded shared-shape
candidates from the catalog. Candidate SVG files live under
\`candidate-svg-review-only/\`; they are evidence, not canonical source assets.

The font sheet uses actual font binaries rather than system proxies:

- Utility: IBM Plex Sans Condensed Medium headings with existing IBM Plex Sans
  Regular/Medium body copy.
- QuotaCo print: Courier Prime Regular/Bold.
- IRIS: existing IBM Plex Mono Regular. VT323 appears only as an optional
  period-forward IRIS heading accent.

The recommended production split is the middle direction: it keeps the three
voices distinct and readable at literal 100% and 140% scale. The current Unity
IBM Plex folder does not contain a bundled license file; that packaging gap
must be resolved before any font promotion.

## Source-fit recommendation

- Exact authority inversion after approval: \`ui-divider\`, \`iris-mark\`, and
  \`quotaco-mark\`.
- Redesign before promotion: \`ui-corner\` and \`ui-focus\`. Their review
  candidates adopt the approved square drafting/focus grammar; \`ui-focus\`
  drops the surveillance crosshair so Utility and IRIS do not blend.
- Stable IDs and tintable/literal modes are held in every case.

Only \`iris-mark\` and \`quotaco-mark\` have direct live stable-ID bindings in
the current Unity code. The three F-07 ornaments are present in the imported
catalog but have no direct runtime stable-ID consumer found by the pilot audit.

## Ownership boundary

- Terrarium candidate SVGs: stateless discrete marks only.
- Unity UXML/USS: all carriers, controls, text, layout, focus placement,
  accessibility, and visual states.
- Unity runtime geometry: logical footprints, spatial focus, routes, endpoints,
  placement validity, and repair anchors.

## Approval boundary

Approval of these sheets would select source-fit and font directions only. It
does not authorize canonical SVG extraction or promotion, production builder
changes, exporter/importer changes, browser export, Unity import, runtime UI
implementation, staging, or commit.
`;
}

async function main(): Promise<void> {
  const entries = candidates();
  const fonts = await loadFonts();
  const worldBytes = await readFile(REFERENCE_WORLD);
  const worldDataUrl = `data:image/png;base64,${worldBytes.toString('base64')}`;
  const sourceSheet = sourceFitSheet(entries);
  const fontSheet = fontPilotSheet(fonts, worldDataUrl);
  const directIconCount = ICONS.length - EMOTION_ICONS.length - STATE_ICONS.length - REACTION_ICONS.length;
  const sourceDecisions = await Promise.all(entries.map(async (entry) => ({
    id: entry.id,
    mode: getIcon(entry.id)?.mode,
    decision: entry.decision,
    currentUse: entry.currentUse,
    recommendation: entry.recommendation,
    candidateSha256: await sha256Bytes(Buffer.from(entry.svg)),
    currentComposedSha256: await sha256Bytes(Buffer.from(currentSvg(entry.id))),
    parity: parityAtSizes(entry),
  })));
  const metrics = {
    status: 'review-only-stopped-for-explicit-visual-approval',
    gate: 'UI-E1a source-fit and production-font pilot',
    sourceDecisions,
    fontPilot: {
      recommended: {
        utilityHeading: 'IBM Plex Sans Condensed Medium',
        utilityBody: 'IBM Plex Sans Regular / Medium',
        quotaCoPrint: 'Courier Prime Regular / Bold',
        iris: 'IBM Plex Mono Regular',
        optionalIrisHeadingAccent: 'VT323 Regular',
      },
      fonts: await Promise.all(fonts.map(async (font) => ({
        key: font.key,
        family: font.family,
        weight: font.weight,
        source: font.source,
        sha256: await sha256Bytes(font.bytes),
        license: font.license,
        disposition: font.disposition,
      }))),
      googleFontsCommit: GOOGLE_FONTS_COMMIT,
      existingUnityLicenseFileFound: false,
      literalScale: [
        { viewport: '1280x720', uiScale: 1, bodyPx: 16, supportPx: 14, actionHeightPx: 40 },
        { viewport: '1280x720', uiScale: 1.4, bodyPx: 22.4, supportPx: 19.6, actionHeightPx: 56 },
      ],
    },
    liveInventory: {
      icons: ICONS.length,
      cursors: CURSORS.length,
      directIcons: directIconCount,
      emotionIcons: EMOTION_ICONS.length,
      stateIcons: STATE_ICONS.length,
      reactionIcons: REACTION_ICONS.length,
      currentAuthority: 'TypeScript ShapeSpec builders',
      canonicalUiOrCursorSvgSources: 0,
    },
    currentUnityStableIdConsumers: {
      'ui-divider': 'imported catalog only; no direct runtime binding found',
      'ui-corner': 'imported catalog only; no direct runtime binding found',
      'ui-focus': 'imported catalog only; no direct runtime binding found',
      'iris-mark': 'MainMenuController and WorkstationShellController; live carrier sizes 18–20 px',
      'quotaco-mark': 'MainMenuController; live carrier size 42 px',
    },
    reservations: {
      amber: 'dormant Capture only; absent from pilot sheets',
      rose: 'emotion only; absent from pilot sheets',
      selection: 'muted teal',
      invalid: 'rust plus geometry and repair text',
    },
    protectedSurfaceHashes: await protectedHashes(),
    worldReference: {
      file: REFERENCE_WORLD,
      sha256: await sha256Bytes(worldBytes),
      use: 'review backdrop only; not a production master or source asset',
    },
    productionChanges: [],
    deferred: [
      'canonical SVG extraction or promotion',
      'production builder changes',
      'exporter/importer changes',
      'browser export',
      'Unity import',
      'runtime UI implementation',
      'staging',
      'commit',
    ],
  };

  await mkdir(CANDIDATE_OUTPUT, { recursive: true });
  await Promise.all(entries.map(async (entry) => {
    const notice = `<!-- REVIEW ONLY: UI-E1a candidate; not canonical or production authority. Decision: ${entry.decision}. -->\n`;
    await writeFile(`${CANDIDATE_OUTPUT}/${entry.id}.candidate.svg`, `${notice}${entry.svg}\n`, 'utf8');
  }));
  const stagedFonts = await stageFontFiles(fonts);
  try {
    await writeFile(`${OUTPUT}/00-source-fit-review.svg`, sourceSheet, 'utf8');
    await writeFile(`${OUTPUT}/00-source-fit-review.png`, render(sourceSheet, stagedFonts.paths, true));
    await writeFile(`${OUTPUT}/01-production-font-pilot.svg`, fontSheet, 'utf8');
    await writeFile(`${OUTPUT}/01-production-font-pilot.png`, render(fontSheet, stagedFonts.paths));
    await writeFile(`${OUTPUT}/metrics.json`, `${JSON.stringify(metrics, null, 2)}\n`, 'utf8');
    await writeFile(`${OUTPUT}/README.md`, readme(), 'utf8');
  } finally {
    await rm(stagedFonts.directory, { recursive: true, force: true });
  }
  process.stdout.write(
    `Wrote UI-E1a review-only source-fit and font pilot.\n` +
    `${OUTPUT}/00-source-fit-review.png\n` +
    `${OUTPUT}/01-production-font-pilot.png\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
