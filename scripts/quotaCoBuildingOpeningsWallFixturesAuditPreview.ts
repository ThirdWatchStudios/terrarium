/**
 * QuotaCo Building System openings + wall-fixture audit and production evidence.
 *
 * This module renders comparison sheets only. Proposal geometry remains local;
 * the production door panels read their canonical SVGs through the real source
 * path so the sheet also exposes the live wall-slot scale contract.
 */
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

import { composeProp, composeWallTile } from '../src/core/compositor';
import { DEFAULT_PROPS, DEFAULT_WALLS, defaultProject } from '../src/data/defaults';
import type { PropInstance } from '../src/core/types';
import { PROP_TEMPLATES } from '../src/props/templates';
import { BLOB_CONFIGS } from '../src/tiles/blob';

const PAGE = '#E7E1D2';
const PANEL = '#F6F1E6';
const PANEL_ALT = '#ECE5D7';
const PANEL_COLD = '#E3ECE8';
const PANEL_WARN = '#F2E3DC';
const INK = '#292C2A';
const MUTED = '#626861';
const RULE = '#A39B8B';
const FLOOR = '#7B8890';
const FLOOR_LINE = '#D9D4C7';

const Q = {
  cream: '#D9D0B9',
  creamLight: '#F3EEDA',
  creamShade: '#BEB49F',
  green: '#294B3C',
  teal: '#547B78',
  tealLight: '#83A9A6',
  rust: '#B65F4D',
  charcoal: '#252A28',
  metal: '#979A91',
  paper: '#F3EEDC',
} as const;

export type AuditClassification =
  | 'canonical-source-redesign'
  | 'authored-source-fit'
  | 'procedural-elevation-fit';

export interface WallSlotAuditEntry {
  readonly id: string;
  readonly label: string;
  readonly classification: AuditClassification;
  readonly decision: string;
}

export const WALL_SLOT_AUDIT: readonly WallSlotAuditEntry[] = [
  {
    id: 'door',
    label: 'Door',
    classification: 'canonical-source-redesign',
    decision: 'Confirmed false-complete: carry the captured sliding auto-door through equal-height source fitting and closed/open registration.',
  },
  {
    id: 'window',
    label: 'Window',
    classification: 'canonical-source-redesign',
    decision: 'Confirmed false-complete: integrate glazing, sill, and blinds into the equal-height wall envelope.',
  },
  {
    id: 'neighbor-glass',
    label: 'Neighbor suite glass',
    classification: 'canonical-source-redesign',
    decision: 'Fold into the authored opening family instead of retaining a separate flat storefront strip.',
  },
  {
    id: 'wall-screen',
    label: 'Wall screen',
    classification: 'authored-source-fit',
    decision: 'Treat as a mounted QuotaCo product with a deliberate shell, bracket, and screen face.',
  },
  {
    id: 'kanban-board',
    label: 'Kanban board',
    classification: 'authored-source-fit',
    decision: 'Keep paper-note variation procedural, but author the mounted board and frame.',
  },
  {
    id: 'water-fountain',
    label: 'Water fountain',
    classification: 'authored-source-fit',
    decision: 'Its facility silhouette needs authored elevation and wall contact at gameplay scale.',
  },
  {
    id: 'badge-reader',
    label: 'Badge reader',
    classification: 'authored-source-fit',
    decision: 'Author the hardware shell; retain status-lamp state as a bounded runtime color/state.',
  },
  {
    id: 'nameplate',
    label: 'Nameplate',
    classification: 'procedural-elevation-fit',
    decision: 'Simple runtime label carrier; correct the wall-facing envelope without making a source SKU matrix.',
  },
  {
    id: 'hvac-vent',
    label: 'HVAC vent',
    classification: 'procedural-elevation-fit',
    decision: 'Repeated slats are intentional geometry; reframe them on the visible wall face.',
  },
  {
    id: 'wall-calendar',
    label: 'Wall calendar',
    classification: 'procedural-elevation-fit',
    decision: 'Calendar rows remain generated; give the paper carrier a readable wall-facing mount.',
  },
  {
    id: 'directory-placard',
    label: 'Building directory',
    classification: 'procedural-elevation-fit',
    decision: 'Generated listing lines are appropriate; only the physical carrier needs elevation framing.',
  },
  {
    id: 'fire-extinguisher',
    label: 'Extinguisher cabinet',
    classification: 'procedural-elevation-fit',
    decision: 'Small safety fixture can remain procedural if the recessed cabinet reads on the wall face.',
  },
] as const;

export const SLIDING_DOOR_REFINEMENT = {
  identity: 'pressure-mat sliding auto-door',
  sourceDecisionCommit: '175f1223',
  sourceReseatCommit: '20302144',
  preserved: [
    'double retracting leaves',
    'transparent open passage',
    'pressure threshold mat',
    'static coral mode lens',
    'no handles',
  ],
  updated: [
    '112-unit equal-height envelope',
    '0.5 runtime wall-slot compensation',
    'current horizontal wall registers',
    'top-oblique vertical fixed-view facing',
    'stronger office glazing and quieter leaf panels',
  ],
} as const;

export type DoorState = 'closed' | 'open';
export type WallAxis = 'horizontal' | 'vertical';

export const CANONICAL_SLIDING_DOOR_SOURCE_FILES = {
  'horizontal-closed': 'door-horizontal-closed.svg',
  'horizontal-open': 'door-horizontal-open.svg',
  'vertical-closed': 'door-vertical-closed.svg',
  'vertical-open': 'door-vertical-open.svg',
} as const;

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
  size = 16,
  weight = 560,
  fill = INK,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return `<text x="${x}" y="${y}" font-family="Inter,Arial,sans-serif" ` +
    `font-size="${size}" font-weight="${weight}" fill="${fill}" ` +
    `text-anchor="${anchor}">${escapeText(value)}</text>`;
}

function wrappedText(
  x: number,
  y: number,
  value: string,
  max: number,
  size = 14,
  leading = 20,
  weight = 560,
  fill = INK,
): string {
  const lines: string[] = [];
  let current = '';
  for (const word of value.split(/\s+/)) {
    const next = current ? `${current} ${word}` : word;
    if (current && next.length > max) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines
    .map((line, index) => text(x, y + index * leading, line, size, weight, fill))
    .join('');
}

function panel(
  x: number,
  y: number,
  width: number,
  height: number,
  fill = PANEL,
  stroke = RULE,
): string {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="12" ` +
    `fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
}

function page(width: number, height: number, markup: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${PAGE}"/>${markup}</svg>`;
}

function asset(markup: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">${markup}</svg>`;
}

function inner(svg: string): string {
  return svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

function placedSvg(source: string, x: number, y: number, size: number): string {
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 128 128" ` +
    `preserveAspectRatio="none" overflow="visible">${inner(source)}</svg>`;
}

function classificationLabel(classification: AuditClassification): string {
  if (classification === 'canonical-source-redesign') return 'AUTHOR / REFIT SOURCE';
  if (classification === 'authored-source-fit') return 'AUTHOR SHELL';
  return 'KEEP PROCEDURAL';
}

function classificationColor(classification: AuditClassification): string {
  if (classification === 'canonical-source-redesign') return Q.rust;
  if (classification === 'authored-source-fit') return Q.teal;
  return Q.green;
}

function currentProp(id: string): PropInstance {
  const existing = DEFAULT_PROPS.find(({ templateId }) => templateId === id);
  if (existing) return existing;
  const template = PROP_TEMPLATES.find((candidate) => candidate.id === id);
  if (!template) throw new Error(`Unknown wall-slot template ${id}`);
  return {
    id: `audit-${id}`,
    name: template.label,
    templateId: id,
    params: Object.fromEntries(template.params.map(({ key, default: value }) => [key, value])),
    palette: { primary: Q.cream, secondary: Q.green, accent: Q.rust },
  };
}

function currentPropSvg(id: string): string {
  return composeProp(currentProp(id), defaultProject().style, 128);
}

function productionWallSvg(axis: WallAxis): string {
  const wall = DEFAULT_WALLS.find(({ templateId }) => templateId === 'office-wall');
  if (!wall) throw new Error('Missing production office wall');
  const maskIndex = axis === 'horizontal' ? 10 : 5;
  return composeWallTile(wall, defaultProject().style, BLOB_CONFIGS[maskIndex], 128);
}

export function capturedSlidingDoorSvg(state: DoorState): string {
  const stem = state === 'closed' ? 'door_closed' : 'door_open';
  const root = path.resolve('assets/walls/quota-co-building-system');
  const base = readFileSync(path.join(root, `${stem}-base.svg`), 'utf8');
  const upper = readFileSync(path.join(root, `${stem}-upper.svg`), 'utf8');
  return asset(inner(base) + inner(upper));
}

export function canonicalSlidingDoorSvg(axis: WallAxis, state: DoorState): string {
  const key = `${axis}-${state}` as keyof typeof CANONICAL_SLIDING_DOOR_SOURCE_FILES;
  const source = path.resolve(
    'assets/walls/quota-co-building-openings-v2',
    CANONICAL_SLIDING_DOOR_SOURCE_FILES[key],
  );
  return readFileSync(source, 'utf8');
}

function horizontalWallStubs(): string {
  return (
    `<path d="M0 11.5H26V123.5H0ZM102 11.5H128V123.5H102Z" fill="${Q.charcoal}"/>` +
    `<path d="M0 14.8H23V112.7H0ZM105 14.8H128V112.7H105Z" fill="${Q.cream}"/>` +
    `<path d="M0 64.6H23V74.6H0ZM105 64.6H128V74.6H105Z" fill="${Q.rust}"/>` +
    `<path d="M0 74.6H23V117.7H0ZM105 74.6H128V117.7H105Z" fill="${Q.green}"/>` +
    `<path d="M0 14.8H23V23.1H0ZM105 14.8H128V23.1H105Z" fill="#FFFFFF" opacity=".28"/>`
  );
}

function horizontalRefittedSlidingDoor(state: DoorState): string {
  const common = horizontalWallStubs() +
    `<path d="M23 11.5H105V39H23Z" fill="${Q.charcoal}"/>` +
    `<path d="M26 14.8H102V34H26Z" fill="${Q.cream}"/>` +
    `<path d="M26 14.8H102V20H26Z" fill="#FFFFFF" opacity=".28"/>` +
    `<path d="M27 34H101V39H27Z" fill="${Q.charcoal}"/>` +
    `<path d="M24 113H104V122H24Z" fill="${Q.charcoal}"/>` +
    `<path d="M27 115H101V119H27Z" fill="${Q.teal}"/>` +
    `<path d="M31 119H97V121H31Z" fill="${Q.metal}" opacity=".82"/>` +
    `<circle cx="64" cy="36.5" r="2" fill="${Q.rust}"/>`;
  if (state === 'closed') {
    return asset(common +
      `<path d="M28 39H100V114H28Z" fill="${Q.charcoal}"/>` +
      `<path d="M31 42H97V112H31Z" fill="${Q.green}"/>` +
      `<path d="M35 49H59V84H35ZM69 49H93V84H69Z" fill="${Q.tealLight}" opacity=".88"/>` +
      `<path d="M35 49H59V84H35ZM69 49H93V84H69Z" fill="none" stroke="${Q.creamShade}" stroke-width="2"/>` +
      `<path d="M35 90H59V106H35ZM69 90H93V106H69Z" fill="none" stroke="${Q.creamShade}" stroke-width="1.5" opacity=".55"/>` +
      `<path d="M64 42V112" stroke="${Q.charcoal}" stroke-width="2"/>` +
      `<path d="M39 55L48 51M73 55L82 51" stroke="#FFFFFF" stroke-width="2" opacity=".28"/>`);
  }
  return asset(common +
    `<path d="M28 39H37V114H28ZM91 39H100V114H91Z" fill="${Q.charcoal}"/>` +
    `<path d="M31 42H37V111H31ZM91 42H97V111H91Z" fill="${Q.green}"/>` +
    `<path d="M32 49H37V84H32ZM91 49H96V84H91Z" fill="${Q.tealLight}" opacity=".82"/>`);
}

function horizontalWindow(): string {
  return asset(
    `<path d="M0 11.5H128V123.5H0Z" fill="${Q.charcoal}"/>` +
    `<path d="M0 14.8H128V117.7H0Z" fill="${Q.cream}"/>` +
    `<path d="M0 14.8H128V23.1H0Z" fill="#FFFFFF" opacity=".28"/>` +
    `<path d="M0 64.6H14V74.6H0ZM114 64.6H128V74.6H114Z" fill="${Q.rust}"/>` +
    `<path d="M0 74.6H14V117.7H0ZM114 74.6H128V117.7H114Z" fill="${Q.green}"/>` +
    `<path d="M14 34H114V99H14Z" fill="${Q.charcoal}"/>` +
    `<path d="M18 38H110V94H18Z" fill="${Q.tealLight}"/>` +
    `<path d="M18 38H110V59H18Z" fill="${Q.green}"/>` +
    `<path d="M18 42H110M18 47H110M18 52H110M18 57H110" stroke="${Q.charcoal}" stroke-width="1.5" opacity=".55"/>` +
    `<path d="M62 59H66V94H62Z" fill="${Q.cream}"/>` +
    `<path d="M24 87L37 73M73 87L86 73" stroke="#FFFFFF" stroke-width="2.5" opacity=".3"/>` +
    `<path d="M12 94H116V103H12Z" fill="${Q.charcoal}"/>` +
    `<path d="M15 94H113V99H15Z" fill="${Q.creamShade}"/>` +
    `<path d="M0 103H128V117.7H0Z" fill="${Q.green}"/>`);
}

function verticalRefittedSlidingDoor(state: DoorState): string {
  const common =
    `<g id="vertical-door-wall-break">` +
    `<path d="M11.5 0H123.5V25H11.5ZM11.5 103H123.5V128H11.5Z" fill="${Q.charcoal}"/>` +
    `<path d="M14.8 0H117.7V22H14.8ZM14.8 106H117.7V128H14.8Z" fill="${Q.cream}"/>` +
    `<path d="M79.5 0H87.8V22H79.5ZM79.5 106H87.8V128H79.5Z" fill="${Q.rust}"/>` +
    `<path d="M87.8 0H117.7V22H87.8ZM87.8 106H117.7V128H87.8Z" fill="${Q.green}"/>` +
    `<path d="M58 20H98V35H58ZM58 93H98V108H58Z" fill="${Q.charcoal}"/>` +
    `<path d="M62 22H94V33H62ZM62 95H94V106H62Z" fill="${Q.cream}"/>` +
    `<path d="M85 22H94V33H85ZM85 95H94V106H85Z" fill="${Q.green}"/>` +
    `</g>` +
    `<g id="vertical-door-pressure-mats">` +
    `<path d="M25 36H59V92H25Z" fill="${Q.charcoal}" opacity=".34"/>` +
    `<path d="M28 39H57V89H28Z" fill="${Q.teal}" opacity=".38"/>` +
    `<path d="M96 36H121V92H96Z" fill="${Q.charcoal}" opacity=".34"/>` +
    `<path d="M99 39H118V89H99Z" fill="${Q.teal}" opacity=".38"/>` +
    `<path d="M32 48H53M32 58H53M32 68H53M32 78H53M103 48H114M103 58H114M103 68H114M103 78H114" stroke="${Q.creamLight}" stroke-width="1" opacity=".2"/>` +
    `</g>` +
    `<g id="vertical-door-overhead-track">` +
    `<path d="M65 31H73V97H65Z" fill="${Q.charcoal}"/>` +
    `<path d="M67 33H71V95H67Z" fill="${Q.metal}"/>` +
    `<circle cx="69" cy="35" r="2" fill="${Q.rust}"/>` +
    `</g>`;
  if (state === 'closed') {
    return asset(common +
      `<g id="vertical-door-top-oblique-closed-leaves">` +
      `<path d="M72 32L79 29H93V99H79L72 96Z" fill="${Q.charcoal}"/>` +
      `<path d="M75 34L80 32H83V96L75 94Z" fill="${Q.cream}"/>` +
      `<path d="M83 32H90V96H83Z" fill="${Q.green}"/>` +
      `<path d="M84 37H89V57H84ZM84 70H89V90H84Z" fill="${Q.tealLight}"/>` +
      `<path d="M75 64H90" stroke="${Q.charcoal}" stroke-width="2"/>` +
      `<path d="M80 32V96" stroke="#FFFFFF" stroke-width="1" opacity=".22"/>` +
      `<path d="M91 34H94V98H91Z" fill="#000000" opacity=".18"/>` +
      `</g>`);
  }
  return asset(common +
    `<g id="vertical-door-top-oblique-open-leaves">` +
    `<path d="M72 32L79 29H93V42H79L72 40ZM72 88L79 86H93V99H79L72 96Z" fill="${Q.charcoal}"/>` +
    `<path d="M75 34L80 32H83V39L75 38ZM75 90L80 89H83V96L75 94Z" fill="${Q.cream}"/>` +
    `<path d="M83 32H90V40H83ZM83 89H90V96H83Z" fill="${Q.green}"/>` +
    `<path d="M84 34H89V39H84ZM84 90H89V95H84Z" fill="${Q.tealLight}"/>` +
    `<path d="M91 33H94V42H91ZM91 88H94V98H91Z" fill="#000000" opacity=".18"/>` +
    `</g>`);
}

function verticalWindow(): string {
  return asset(
    `<path d="M11.5 0H123.5V128H11.5Z" fill="${Q.charcoal}"/>` +
    `<path d="M14.8 0H92.8V128H14.8Z" fill="${Q.cream}"/>` +
    `<path d="M14.8 0H68.7V128H14.8Z" fill="#FFFFFF" opacity=".18"/>` +
    `<path d="M71 13H95V115H71Z" fill="${Q.charcoal}"/>` +
    `<path d="M74 17H91V111H74Z" fill="${Q.tealLight}"/>` +
    `<path d="M74 17H91V53H74Z" fill="${Q.green}"/>` +
    `<path d="M74 25H91M74 34H91M74 43H91M74 52H91" stroke="${Q.charcoal}" stroke-width="1.5" opacity=".55"/>` +
    `<path d="M74 63H91" stroke="${Q.cream}" stroke-width="3"/>` +
    `<path d="M80 104L88 94" stroke="#FFFFFF" stroke-width="2" opacity=".3"/>` +
    `<path d="M95 0H117.7V128H95Z" fill="${Q.green}" opacity=".88"/>`);
}

export function openingProposalSvg(
  kind: 'door' | 'window',
  axis: WallAxis,
  state: DoorState = 'closed',
): string {
  if (kind === 'window') return axis === 'horizontal' ? horizontalWindow() : verticalWindow();
  return canonicalSlidingDoorSvg(axis, state);
}

export function approvedSlidingDoorGeometrySvg(axis: WallAxis, state: DoorState): string {
  const approved = axis === 'vertical'
    ? verticalRefittedSlidingDoor(state)
    : horizontalRefittedSlidingDoor(state);
  return asset(
    `<g transform="translate(32 32) scale(.5)">${inner(approved)}</g>`,
  );
}

function scaleExamples(source: string, x: number, y: number): string {
  return placedSvg(source, x, y, 128) +
    runtimeWallSlotSvg(source, x + 154, y + 19, 90) +
    runtimeWallSlotSvg(source, x + 272, y + 44, 40) +
    text(x + 64, y + 151, '128 authoring', 11, 720, MUTED, 'middle') +
    text(x + 199, y + 151, '90 normal', 11, 720, MUTED, 'middle') +
    text(x + 292, y + 151, '40 far', 11, 720, MUTED, 'middle');
}

function runtimeWallSlotSvg(source: string, x: number, y: number, cell: number): string {
  return placedSvg(source, x - cell / 2, y - cell / 2, cell * 2);
}

export function renderWallFixtureInventorySvg(): string {
  const width = 2400;
  const height = 1320;
  const margin = 36;
  const gap = 16;
  const cardW = (width - margin * 2 - gap * 3) / 4;
  const cardH = 352;
  const parts: string[] = [
    text(margin, 48, 'BUILDING OPENINGS + WALL FIXTURES · LIVE INVENTORY', 27, 860),
    text(margin, 79, 'Review only · current production pixels · twelve code-owned wall-slot receivers · proposed source ownership, not promotion', 14, 650, MUTED),
    text(width - margin, 48, 'NOT PROMOTED', 12, 860, Q.rust, 'end'),
  ];
  WALL_SLOT_AUDIT.forEach((entry, index) => {
    const column = index % 4;
    const row = Math.floor(index / 4);
    const x = margin + column * (cardW + gap);
    const y = 108 + row * (cardH + gap);
    const classification = classificationColor(entry.classification);
    const current = currentPropSvg(entry.id);
    parts.push(
      panel(x, y, cardW, cardH, entry.classification === 'canonical-source-redesign' ? PANEL_WARN : PANEL),
      text(x + 18, y + 28, entry.label.toUpperCase(), 14, 840),
      text(x + cardW - 18, y + 28, classificationLabel(entry.classification), 10, 840, classification, 'end'),
      text(x + 18, y + 49, entry.id, 11, 640, MUTED),
      `<rect x="${x + 18}" y="${y + 66}" width="170" height="170" rx="8" fill="${FLOOR}"/>`,
      placedSvg(productionWallSvg('horizontal'), x + 39, y + 87, 128),
      placedSvg(current, x + 39, y + 87, 128),
      placedSvg(current, x + 224, y + 88, 90),
      placedSvg(current, x + 336, y + 113, 40),
      text(x + 269, y + 195, '90 px', 10, 720, MUTED, 'middle'),
      text(x + 356, y + 195, '40 px', 10, 720, MUTED, 'middle'),
      wrappedText(x + 18, y + 272, entry.decision, 64, 12, 17, 600, INK),
    );
  });
  return page(width, height, parts.join(''));
}

export function renderOpeningDirectionSvg(): string {
  const width = 2240;
  const height = 1460;
  const parts: string[] = [
    text(36, 48, 'SLIDING AUTO-DOOR · 112-UNIT CONTINUITY REFINEMENT', 27, 860),
    text(36, 79, 'Review only · preserves the owner-directed 2026-07-20 door identity · refits it to the current equal-height building system', 14, 650, MUTED),
    text(width - 36, 48, 'VISUAL DIRECTION APPROVED', 12, 860, Q.teal, 'end'),
    panel(36, 108, 430, 608, PANEL_WARN),
    text(58, 142, 'CURRENT LIVE GAP', 13, 840, Q.rust),
    text(58, 166, 'Old plan strip still owns production', 12, 620, MUTED),
    `<rect x="78" y="194" width="346" height="222" rx="8" fill="${FLOOR}"/>`,
    placedSvg(productionWallSvg('horizontal'), 168, 220, 166),
    placedSvg(currentPropSvg('door'), 168, 220, 166),
    text(251, 414, 'live plan door over 112-unit wall', 11, 720, MUTED, 'middle'),
    wrappedText(58, 470, 'The missing work is source fitting and registration, not a missing door concept. Fresh export currently preserves the projection mismatch.', 43, 14, 21, 620),
    text(58, 604, 'DO NOT CARRY FORWARD', 11, 840, Q.rust),
    wrappedText(58, 636, 'Flat plan slab · rotation-derived presentation · detached jamb caps · no equal-height envelope.', 43, 13, 19, 620),
    panel(488, 108, 724, 608, PANEL_ALT),
    text(510, 142, 'CAPTURED SOURCE IDENTITY · 2026-07-20', 13, 840, Q.green),
    text(1190, 142, 'PRESERVE', 10, 840, Q.teal, 'end'),
    text(510, 166, 'Owner-directed pressure-mat sliding auto-door', 12, 620, MUTED),
    `<rect x="522" y="190" width="322" height="270" rx="8" fill="${FLOOR}"/>`,
    `<rect x="862" y="190" width="322" height="270" rx="8" fill="${FLOOR}"/>`,
    placedSvg(capturedSlidingDoorSvg('closed'), 555, 218, 256),
    placedSvg(capturedSlidingDoorSvg('open'), 895, 218, 256),
    text(683, 486, 'CAPTURED CLOSED', 11, 820, MUTED, 'middle'),
    text(1023, 486, 'CAPTURED OPEN', 11, 820, MUTED, 'middle'),
    wrappedText(510, 534, 'Preserve retracting double leaves, pressure threshold, transparent passage, static coral mode lens, banded pylons, and no handles.', 70, 14, 21, 620),
    text(510, 654, 'Source commits 175f1223 · 20302144', 11, 760, Q.teal),
    panel(1234, 108, 970, 608, PANEL_COLD),
    text(1256, 142, 'REFITTED SLIDER · CURRENT WALL SYSTEM', 13, 840, Q.green),
    text(2182, 142, 'RECOMMENDED CONTINUITY PASS', 10, 840, Q.teal, 'end'),
    scaleExamples(openingProposalSvg('door', 'horizontal', 'closed'), 1280, 192),
    scaleExamples(openingProposalSvg('door', 'horizontal', 'open'), 1692, 192),
    text(1440, 374, 'CLOSED', 11, 820, MUTED, 'middle'),
    text(1852, 374, 'OPEN', 11, 820, MUTED, 'middle'),
    wrappedText(1256, 430, 'Same automatic slider identity, derived from the 11.5–123.5 wall source and centered in the 64-unit live slot. Current cream, rust, green, teal, and charcoal registers continue through the jambs and header.', 92, 14, 21, 620),
    text(1256, 564, 'REFINED, NOT REPLACED', 11, 840, Q.teal),
    wrappedText(1256, 596, 'Larger office glazing improves the ordinary-office read. Quieter lower panels and one mode lens retain QuotaCo machinery without turning the doorway into a security checkpoint.', 92, 13, 19, 620),
  ];
  parts.push(
    panel(36, 744, 2168, 660, PANEL),
    text(58, 780, 'REFITTED FIXED-VIEW AXES + WINDOW FAMILY', 13, 840, Q.green),
    text(58, 805, 'The horizontal slider is preserved. The vertical case exposes floor around a narrow top-oblique leaf barrier; it is not a rotated front elevation.', 12, 620, MUTED),
  );
  const cases = [
    { label: 'HORIZONTAL · CLOSED', svg: openingProposalSvg('door', 'horizontal', 'closed') },
    { label: 'HORIZONTAL · OPEN', svg: openingProposalSvg('door', 'horizontal', 'open') },
    { label: 'VERTICAL · CLOSED', svg: openingProposalSvg('door', 'vertical', 'closed') },
    { label: 'VERTICAL · OPEN', svg: openingProposalSvg('door', 'vertical', 'open') },
    { label: 'HORIZONTAL · WINDOW', svg: openingProposalSvg('window', 'horizontal') },
    { label: 'VERTICAL · WINDOW', svg: openingProposalSvg('window', 'vertical') },
  ];
  cases.forEach((entry, index) => {
    const x = 70 + index * 350;
    const isRuntimeCompensatedDoor = entry.svg.includes('data-runtime-grid-scale="0.5"');
    parts.push(
      `<rect x="${x}" y="842" width="292" height="292" rx="8" fill="${FLOOR}"/>`,
      placedSvg(entry.svg, x + 18, 860, 256),
      text(x + 146, 1162, entry.label, 11, 800, MUTED, 'middle'),
      isRuntimeCompensatedDoor
        ? runtimeWallSlotSvg(entry.svg, x + 76, 1202, 90)
        : placedSvg(entry.svg, x + 76, 1202, 90),
      isRuntimeCompensatedDoor
        ? runtimeWallSlotSvg(entry.svg, x + 194, 1227, 40)
        : placedSvg(entry.svg, x + 194, 1227, 40),
      text(x + 121, 1320, '90', 10, 720, MUTED, 'middle'),
      text(x + 214, 1320, '40', 10, 720, MUTED, 'middle'),
    );
  });
  return page(width, height, parts.join(''));
}

function grid(x: number, y: number, columns: number, rows: number, cell: number): string {
  const parts = [`<rect x="${x}" y="${y}" width="${columns * cell}" height="${rows * cell}" fill="${FLOOR}"/>`];
  for (let column = 1; column < columns; column += 1) {
    parts.push(`<path d="M ${x + column * cell} ${y} V ${y + rows * cell}" stroke="${FLOOR_LINE}" opacity=".18"/>`);
  }
  for (let row = 1; row < rows; row += 1) {
    parts.push(`<path d="M ${x} ${y + row * cell} H ${x + columns * cell}" stroke="${FLOOR_LINE}" opacity=".18"/>`);
  }
  return parts.join('');
}

function wallRun(
  x: number,
  y: number,
  cell: number,
  axis: WallAxis,
  count: number,
  replacements: ReadonlyMap<number, string>,
): string {
  const parts: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const px = axis === 'horizontal' ? x + index * cell : x;
    const py = axis === 'vertical' ? y + index * cell : y;
    const replacement = replacements.get(index);
    parts.push(replacement?.includes('data-runtime-grid-scale="0.5"')
      ? runtimeWallSlotSvg(replacement, px, py, cell)
      : placedSvg(replacement ?? productionWallSvg(axis), px, py, cell));
  }
  return parts.join('');
}

function literalRoom(
  x: number,
  y: number,
  cell: number,
  columns: number,
  rows: number,
  label: string,
): string {
  const roomW = columns * cell;
  const topReplacements = new Map<number, string>([
    [2, openingProposalSvg('door', 'horizontal', 'closed')],
    [5, openingProposalSvg('door', 'horizontal', 'open')],
    [7, openingProposalSvg('window', 'horizontal')],
  ]);
  const sideReplacements = new Map<number, string>([
    [2, openingProposalSvg('window', 'vertical')],
    [4, openingProposalSvg('door', 'vertical', 'closed')],
  ]);
  const parts = [
    text(x, y - 18, label, 12, 820, INK),
    grid(x, y, columns, rows, cell),
    wallRun(x, y, cell, 'horizontal', columns, topReplacements),
    wallRun(x, y, cell, 'vertical', rows, sideReplacements),
  ];
  const fixtureIds = ['badge-reader', 'wall-screen', 'kanban-board', 'water-fountain'];
  fixtureIds.forEach((id, index) => {
    const fx = x + (3.1 + index * 1.15) * cell;
    const fy = y + 1.05 * cell;
    parts.push(placedSvg(currentPropSvg(id), fx, fy, cell));
  });
  parts.push(
    `<rect x="${x + 2.2 * cell}" y="${y + 3.0 * cell}" width="${3.8 * cell}" height="${1.25 * cell}" rx="${cell * .08}" fill="${Q.cream}" stroke="${Q.charcoal}" stroke-width="${Math.max(1, cell * .025)}"/>`,
    `<rect x="${x + 2.45 * cell}" y="${y + 3.18 * cell}" width="${1.3 * cell}" height="${.72 * cell}" rx="${cell * .06}" fill="${Q.green}"/>`,
    `<rect x="${x + 4.15 * cell}" y="${y + 3.18 * cell}" width="${1.3 * cell}" height="${.72 * cell}" rx="${cell * .06}" fill="${Q.teal}"/>`,
    text(x + roomW - 8, y + rows * cell - 10, 'office remains dominant · no UI chrome', Math.max(8, cell * .12), 650, Q.creamLight, 'end'),
  );
  return parts.join('');
}

export function renderOpeningLiteralScaleSvg(): string {
  const width = 1280;
  const height = 720;
  const parts = [
    text(24, 34, 'OPENINGS + WALL FIXTURES · LITERAL GAMEPLAY SCALE', 21, 860),
    text(24, 58, '1280 × 720 review frame · exact 90 px normal and 40 px far cells · proposed openings, current fixture controls', 12, 640, MUTED),
    text(width - 24, 34, 'REVIEW ONLY', 11, 840, Q.rust, 'end'),
    panel(18, 78, 876, 616, PANEL),
    literalRoom(38, 122, 90, 9, 6, 'NORMAL · 90 PX / CELL'),
    panel(912, 78, 350, 310, PANEL_ALT),
    literalRoom(932, 122, 40, 8, 6, 'FAR · 40 PX / CELL'),
    panel(912, 406, 350, 288, PANEL_COLD),
    text(932, 438, 'READ AT FAR SCALE', 11, 840, Q.green),
    wrappedText(932, 472, 'The doorway must remain an opening noun, not a colored strip. The window must remain glazing, not a teal wall panel. Small fixtures may simplify, but their wall contact must survive.', 35, 12, 18, 620),
    text(932, 594, 'NEXT GATE', 11, 840, Q.teal),
    wrappedText(932, 624, 'Re-export the corrected canonical sources, re-import them, and inspect the same live wall-slot case.', 35, 12, 18, 650),
  ];
  return page(width, height, parts.join(''));
}

export function renderSlidingDoorSourceFitSvg(): string {
  const width = 2240;
  const height = 1320;
  const cardWidth = 1058;
  const cardHeight = 548;
  const cases = [
    { axis: 'horizontal', state: 'closed', label: 'HORIZONTAL · CLOSED' },
    { axis: 'horizontal', state: 'open', label: 'HORIZONTAL · OPEN' },
    { axis: 'vertical', state: 'closed', label: 'VERTICAL · CLOSED' },
    { axis: 'vertical', state: 'open', label: 'VERTICAL · OPEN' },
  ] as const;
  const parts: string[] = [
    text(36, 48, 'SLIDING AUTO-DOOR · SOURCE-FIT REVIEW', 27, 860),
    text(36, 79, 'Four hand-editable canonical SVGs · transparent floor context · production template parity at authoring and gameplay scales', 14, 650, MUTED),
    text(width - 36, 48, 'TERRARIUM PRODUCTION SCALE CORRECTED', 12, 860, Q.teal, 'end'),
  ];
  cases.forEach((entry, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 36 + column * (cardWidth + 52);
    const y = 108 + row * (cardHeight + 42);
    const approved = approvedSlidingDoorGeometrySvg(entry.axis, entry.state);
    const candidate = canonicalSlidingDoorSvg(entry.axis, entry.state);
    parts.push(
      panel(x, y, cardWidth, cardHeight, entry.state === 'open' ? PANEL_COLD : PANEL),
      text(x + 22, y + 34, entry.label, 14, 840),
      text(x + cardWidth - 22, y + 34, 'LIVE SLOT MATCH · 128 / 90 / 40', 10, 840, Q.teal, 'end'),
      text(x + 22, y + 60, 'Runtime-calibrated control', 11, 720, MUTED),
      text(x + 320, y + 60, 'Canonical production source', 11, 720, MUTED),
      `<rect x="${x + 22}" y="${y + 78}" width="256" height="256" rx="8" fill="${FLOOR}"/>`,
      `<rect x="${x + 320}" y="${y + 78}" width="256" height="256" rx="8" fill="${FLOOR}"/>`,
      placedSvg(approved, x + 22, y + 78, 256),
      placedSvg(candidate, x + 320, y + 78, 256),
      text(x + 150, y + 358, 'CONTROL', 10, 820, MUTED, 'middle'),
      text(x + 448, y + 358, 'SOURCE', 10, 820, Q.teal, 'middle'),
      `<rect x="${x + 626}" y="${y + 97}" width="128" height="128" rx="5" fill="${FLOOR}"/>`,
      `<rect x="${x + 783}" y="${y + 116}" width="90" height="90" rx="4" fill="${FLOOR}"/>`,
      `<rect x="${x + 902}" y="${y + 141}" width="40" height="40" rx="2" fill="${FLOOR}"/>`,
      placedSvg(candidate, x + 626, y + 97, 128),
      runtimeWallSlotSvg(candidate, x + 783, y + 116, 90),
      runtimeWallSlotSvg(candidate, x + 902, y + 141, 40),
      text(x + 690, y + 249, '128 canvas · 64 art', 10, 720, MUTED, 'middle'),
      text(x + 828, y + 249, '90 normal', 10, 720, MUTED, 'middle'),
      text(x + 922, y + 249, '40 far', 10, 720, MUTED, 'middle'),
      text(x + 626, y + 302, entry.state === 'open' ? 'PASSAGE: TRANSPARENT' : 'LEAVES: OPAQUE', 10, 840, entry.state === 'open' ? Q.teal : Q.green),
      wrappedText(x + 626, y + 334, entry.axis === 'vertical'
        ? 'Separately authored top-oblique wall-facing state. Centered 0.5 slot envelope; no rotated front elevation or baked floor.'
        : 'Front-facing state with header, retracting leaf pockets, threshold, and centered 0.5 live-slot compensation.', 47, 12, 18, 620),
      `<path d="M${x + 22} ${y + 398}H${x + cardWidth - 22}" stroke="${RULE}" opacity=".65"/>`,
      text(x + 22, y + 426, 'SOURCE OWNERSHIP', 10, 840, Q.green),
      wrappedText(x + 22, y + 452, `assets/walls/quota-co-building-openings-v2/${CANONICAL_SLIDING_DOOR_SOURCE_FILES[`${entry.axis}-${entry.state}`]}`, 92, 11, 17, 650, MUTED),
      text(x + 22, y + 520, 'Canonical source · production registered · corrected pixels await re-export / Unity review', 10, 760, Q.teal),
    );
  });
  return page(width, height, parts.join(''));
}

export interface BuildingOpeningsAuditResult {
  readonly output: string;
  readonly files: readonly string[];
}

export async function renderBuildingOpeningsAudit(
  output: string,
): Promise<BuildingOpeningsAuditResult> {
  await mkdir(output, { recursive: true });
  const pages = [
    ['00-live-wall-slot-inventory', renderWallFixtureInventorySvg()],
    ['01-opening-direction-study', renderOpeningDirectionSvg()],
    ['02-literal-gameplay-scale', renderOpeningLiteralScaleSvg()],
    ['03-sliding-door-source-fit', renderSlidingDoorSourceFitSvg()],
  ] as const;
  const files: string[] = [];
  for (const [stem, svg] of pages) {
    const svgPath = path.join(output, `${stem}.svg`);
    const pngPath = path.join(output, `${stem}.png`);
    await writeFile(svgPath, svg, 'utf8');
    await writeFile(pngPath, new Resvg(svg).render().asPng());
    files.push(svgPath, pngPath);
  }
  const metrics = {
    status: 'terrarium-production-promoted-sliding-door',
    scope: 'review-only-building-openings-wall-fixtures-audit-v1',
    wallSlotReceiverCount: WALL_SLOT_AUDIT.length,
    classifications: Object.fromEntries(
      (['canonical-source-redesign', 'authored-source-fit', 'procedural-elevation-fit'] as const)
        .map((classification) => [classification, WALL_SLOT_AUDIT.filter((entry) => entry.classification === classification).map(({ id }) => id)]),
    ),
    recommendedDoorDirection: 'refitted-pressure-mat-sliding-auto-door',
    slidingDoorIdentity: SLIDING_DOOR_REFINEMENT,
    canonicalSlidingDoorSources: CANONICAL_SLIDING_DOOR_SOURCE_FILES,
    normalGameplayPixelsPerCell: 90,
    farGameplayPixelsPerCell: 40,
    currentProductionReadOnly: true,
    doorProposalGeometryLocalToPreview: false,
    remainingAuditProposalGeometryLocalToPreview: true,
    canonicalSvgAuthoring: true,
    productionRegistration: true,
    sourceOwnedRuntimeGridScale: 0.5,
    exporterMutation: false,
    browserExportByThisPass: false,
    unityImportByThisPass: false,
    postCorrectionRuntimeVerification: false,
    staging: false,
    commit: false,
  };
  const metricsPath = path.join(output, 'metrics.json');
  await writeFile(metricsPath, `${JSON.stringify(metrics, null, 2)}\n`, 'utf8');
  files.push(metricsPath);
  const readmePath = path.join(output, 'README.md');
  await writeFile(readmePath, [
    '# QuotaCo Building Openings and Wall Fixtures Audit v1',
    '',
    'Status: **visual direction and source fit approved; Terrarium production promotion complete**',
    '',
    'The current live `window` and the other ten wall-slot receivers remain unchanged.',
    'The four door states have hand-editable canonical SVGs registered with the production `door` template.',
    'A user-run export/import exposed a two-times scale mismatch between the wall and prop render paths.',
    '',
    'The opening direction preserves the owner-directed **pressure-mat sliding auto-door** captured in',
    '`175f1223` and reseated in `20302144`. The refinement changes its fit, not its identity: both states now',
    'derive from the current 112-unit equal-height envelope, inherit the current wall registers, enlarge the office',
    'glazing, retain the retracting double leaves and static coral mode lens, and add no handles.',
    'The source now owns the required `translate(32 32) scale(.5)` compensation, centering the construction in',
    'the 64-unit live wall-slot while preserving the 128-unit prop canvas, ordinary import scale, and pivot.',
    'The vertical case leaves floor and pressure mats visible around a narrow top-oblique leaf barrier; it is',
    'separately authored and never rotates the horizontal front elevation onto the floor.',
    'All four candidates leave their surrounding floor transparent; the review sheets supply floor context.',
    '',
    'The audit proposes three ownership classes:',
    '',
    '- Canonical source/refit: door, window, neighbor glass.',
    '- Authored source fit: wall screen, kanban board, water fountain, badge reader.',
    '- Procedural elevation fit: nameplate, HVAC vent, wall calendar, directory placard, extinguisher cabinet.',
    '',
    'Terrarium production scale correction is complete. Re-export, Unity re-import/runtime review, staging,',
    'and commit remain separate gates and have not been performed by this pass.',
    '',
  ].join('\n'), 'utf8');
  files.push(readmePath);
  return { output, files };
}

function outputPath(argv: readonly string[]): string {
  const index = argv.indexOf('--out');
  return index >= 0 && argv[index + 1]
    ? path.resolve(argv[index + 1])
    : path.resolve('docs/previews/quota-co-building-openings-wall-fixtures-audit-v1');
}

const isMain = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;
if (isMain) {
  const result = await renderBuildingOpeningsAudit(outputPath(process.argv.slice(2)));
  process.stdout.write(`Wrote ${result.files.length} review-only opening-audit files to ${result.output}\n`);
}
