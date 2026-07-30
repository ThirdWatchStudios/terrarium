/**
 * Review-only QuotaCo outdoor/construction prop calibration.
 *
 *   node --import tsx scripts/quotaCoOutdoorConstructionCalibrationPreview.ts
 *   node --import tsx scripts/quotaCoOutdoorConstructionCalibrationPreview.ts --out docs/previews
 *
 * The proposal pixels in this file are temporary comparison art. This script
 * does not register sources, modify prop templates, change exports, or touch
 * Unity integration.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import { CURRENT_SCHEMA_VERSION, type CharacterRecipe, type Facing } from '../src/core/types';
import { CONSTRUCTION_CREW, DEFAULT_CAST } from '../src/data/defaults';
import { PROP_TEMPLATES } from '../src/props/templates';
import {
  PROP_REDESIGN_INVENTORY_GROUPS,
  PropCalibrationRenderer,
} from './quotaCoPropRedesignCalibrationPreview';
import { PROP_NATIVE_FRAME_CELLS } from './quotaCoWorkstationFamilyCalibrationPreview';

const WIDTH = 3600;
const HEIGHT = 2530;
const MARGIN = 36;
const GAP = 18;
const NORMAL_CELL = 74;
const FAR_CELL = 40;
const AUTHORING_CANVAS = 128;
const WALL_DATUM = 112;
const CHARACTER_VISUAL_SCALE = 0.65;
const LEGACY_CHARACTER_FRAME_CELLS = 1.55;
const CHARACTER_FRAME_CELLS =
  LEGACY_CHARACTER_FRAME_CELLS * CHARACTER_VISUAL_SCALE;

const PAGE = '#E7E1D2';
const PANEL = '#F6F1E6';
const PANEL_ALT = '#ECE5D7';
const INK = '#292C2A';
const MUTED = '#626861';
const RULE = '#A39B8B';
const FLOOR = '#7B8890';
const FLOOR_LINE = '#D9D4C7';
const WALK = '#C8C2B2';
const GRASS = '#65755D';
const OCCUPANCY = '#E7DDAF';
const GREEN = '#355647';
const GREEN_SOFT = '#DCE9DD';
const TEAL_SOFT = '#D8E6E4';
const CORAL = '#B65F4D';
const CORAL_SOFT = '#F0DDD6';
const BLUE = '#294565';

const Q = {
  creamLight: '#F3EEDA',
  cream: '#DED5BD',
  creamShade: '#C7BDA7',
  green: '#355247',
  greenLight: '#49685A',
  teal: '#4E7470',
  olive: '#77755D',
  coral: '#B65F4D',
  rust: '#98513F',
  charcoal: '#262B29',
  recess: '#18211E',
  paper: '#F4F0E4',
  blueGlass: '#8FB7C0',
  blueGlassDark: '#668E98',
  foliage: '#527A45',
  foliageLight: '#6D8D57',
  foliageDark: '#355B34',
  metal: '#8E9690',
  yellow: '#D5B85D',
} as const;

export type OutdoorDirectionId =
  | 'current'
  | 'institutional-site-kit'
  | 'service-coded-edge'
  | 'lived-campus';

export type ProposalDirectionId = Exclude<OutdoorDirectionId, 'current'>;

interface OutdoorDirection {
  readonly id: OutdoorDirectionId;
  readonly label: string;
  readonly shortLabel: string;
  readonly note: string;
  readonly evaluation: readonly string[];
  readonly panelFill: string;
}

export const OUTDOOR_DIRECTIONS: readonly OutdoorDirection[] = [
  {
    id: 'current',
    label: 'CONTROL · CURRENT ART',
    shortLabel: 'CURRENT',
    note: 'Existing procedural exterior sprites at their literal gameplay scale.',
    evaluation: [
      'Useful category coverage, but silhouettes do not yet read as one site system.',
      'Vehicle, fixture, and campus families carry unrelated edge and detail rhythms.',
      'Control only; no current pixel is being promoted or retired in this proof.',
    ],
    panelFill: PANEL,
  },
  {
    id: 'institutional-site-kit',
    label: 'A · INSTITUTIONAL SITE KIT',
    shortLabel: 'SITE KIT',
    note: 'Rounded standardized shells, deep-green structure, restrained coral hardware.',
    evaluation: [
      'Strongest shared QuotaCo campus read from parking edge to employee break area.',
      'Broad silhouettes and large functional zones survive the far/crowded pass.',
      'Clean catalog repetition needs selective wear later to avoid a showroom feel.',
    ],
    panelFill: GREEN_SOFT,
  },
  {
    id: 'service-coded-edge',
    label: 'B · SERVICE-CODED EDGE',
    shortLabel: 'SERVICE EDGE',
    note: 'Visible access collars, safety bands, replaceable modules, and locator accents.',
    evaluation: [
      'Clearest maintenance, approach, and safety surfaces around fixtures and parking.',
      'Asymmetric modules give small exterior objects stronger reacquisition silhouettes.',
      'Coral and cream coding must stay bounded so the lot does not become visual signage.',
    ],
    panelFill: TEAL_SOFT,
  },
  {
    id: 'lived-campus',
    label: 'C · LIVED CAMPUS',
    shortLabel: 'LIVED CAMPUS',
    note: 'Site-kit bodies softened by weather, locks, stickers, planting, and daily use.',
    evaluation: [
      'Best employee-owned atmosphere while retaining the institutional base grammar.',
      'Wear breaks repeated fixtures into memorable landmarks at normal gameplay zoom.',
      'Small marks disappear safely at far zoom; silhouette still has to do the work.',
    ],
    panelFill: CORAL_SOFT,
  },
];

export const OUTDOOR_INVENTORY_SUBGROUPS = [
  {
    id: 'mobility-lot',
    label: 'Mobility and lot',
    ids: [
      'car',
      'car-suv',
      'parking-line',
      'lot-marking-accessible',
      'lot-marking-arrow',
      'lot-marking-reserved',
      'lot-marking-crosswalk',
      'lamp-post',
      'sign-lot',
      'car-compact',
      'bike-rack',
    ],
  },
  {
    id: 'campus-garden',
    label: 'Campus and garden',
    ids: [
      'ground-detail-rake-arc-a',
      'ground-detail-rake-arc-b',
      'ground-detail-rake-arc-c',
      'ground-detail-lilypad-a',
      'ground-detail-lilypad-b',
      'ground-detail-stepping-stone-a',
      'ground-detail-stepping-stone-b',
      'park-bench',
      'picnic-table',
      'stone-lantern',
      'boulder-arrangement',
      'reeds-cluster',
    ],
  },
  {
    id: 'landscape-scatter',
    label: 'Landscape and scatter',
    ids: [
      'tree-canopy',
      'tree-sapling',
      'bush-cluster',
      'wildflower-patch',
      'tall-grass-clump',
      'bracken-patch',
      'boulder',
      'ground-detail-grass-tuft-a',
      'ground-detail-grass-tuft-b',
      'ground-detail-grass-tuft-c',
      'ground-detail-flower-sprig-a',
      'ground-detail-flower-sprig-b',
      'ground-detail-pebble-a',
      'ground-detail-pebble-b',
      'ground-detail-twig-a',
    ],
  },
] as const;

export const OUTDOOR_PROOF_CARRIERS = [
  'car',
  'lot-marking-crosswalk',
  'lamp-post',
  'sign-lot',
  'bike-rack',
  'park-bench',
  'picnic-table',
  'tree-canopy',
] as const;

const CONTEXT_CARRIERS = ['car-compact', 'boulder-arrangement'] as const;

export const OUTDOOR_PROOF_DECISIONS = [
  {
    id: 'car',
    role: 'Vehicle',
    projection: 'plan',
    recognition: 'hood, glazed cabin, rear deck, lights, and one uninterrupted vehicle hull',
  },
  {
    id: 'lot-marking-crosswalk',
    role: 'Lot marking',
    projection: 'plan',
    recognition: 'five broad crossing bars with an unmistakable pedestrian travel axis',
  },
  {
    id: 'lamp-post',
    role: 'Exterior fixture',
    projection: 'elevation',
    recognition: 'wide luminaire, narrow post, service collar, and grounded foot',
  },
  {
    id: 'sign-lot',
    role: 'Wayfinding',
    projection: 'elevation',
    recognition: 'large sign face, paired supports, and a clear approach side',
  },
  {
    id: 'bike-rack',
    role: 'Mobility fixture',
    projection: 'plan',
    recognition: 'repeated lock hoops fixed to one long ground rail',
  },
  {
    id: 'park-bench',
    role: 'Seating',
    projection: 'elevation',
    recognition: 'long back, distinct seat lip, two supports, and open foot room',
  },
  {
    id: 'picnic-table',
    role: 'Break surface',
    projection: 'plan',
    recognition: 'one long table slab bracketed by two clearly separated benches',
  },
  {
    id: 'tree-canopy',
    role: 'Landscape anchor',
    projection: 'elevation',
    recognition: 'one broad organic crown, visible trunk, and planted ground contact',
  },
] as const;

const PROTECTED_REVIEW_SURFACES = [
  'assets/props/',
  'src/props/templates.ts',
  'src/data/defaults.ts',
  'src/core/exporter.ts',
  'src/core/types.ts',
  'CONTRACT.md',
  'Unity registration',
] as const;

function escapeText(value: string): string {
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
  weight = 560,
  color = INK,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return (
    `<text x="${x}" y="${y}" ` +
    'font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" ' +
    `font-size="${size}" font-weight="${weight}" fill="${color}" ` +
    `text-anchor="${anchor}">${escapeText(value)}</text>`
  );
}

function wrappedText(
  x: number,
  y: number,
  value: string,
  maxCharacters: number,
  lineHeight: number,
  size = 16,
  weight = 560,
  color = INK,
): string {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharacters && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines
    .map((lineValue, index) =>
      text(x, y + index * lineHeight, lineValue, size, weight, color),
    )
    .join('');
}

function panel(
  x: number,
  y: number,
  width: number,
  height: number,
  fill = PANEL,
  stroke = RULE,
  radius = 14,
): string {
  return (
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" ` +
    `rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`
  );
}

function r(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  outline = false,
  opacity = 1,
): string {
  return (
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" ` +
    `rx="${radius}" fill="${fill}" opacity="${opacity}" ` +
    (outline
      ? `stroke="${INK}" stroke-width="3" stroke-linejoin="round"`
      : 'stroke="none"') +
    '/>'
  );
}

function e(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fill: string,
  outline = false,
  opacity = 1,
): string {
  return (
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ` +
    `fill="${fill}" opacity="${opacity}" ` +
    (outline ? `stroke="${INK}" stroke-width="3"` : 'stroke="none"') +
    '/>'
  );
}

function p(
  d: string,
  fill: string,
  outline = false,
  opacity = 1,
): string {
  return (
    `<path d="${d}" fill="${fill}" opacity="${opacity}" ` +
    (outline
      ? `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`
      : 'stroke="none"') +
    '/>'
  );
}

function line(
  d: string,
  stroke: string,
  width = 2,
  opacity = 1,
  dash = '',
): string {
  return (
    `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" ` +
    `stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" ` +
    (dash ? `stroke-dasharray="${dash}"` : '') +
    '/>'
  );
}

function c(
  cx: number,
  cy: number,
  radius: number,
  fill: string,
  outline = false,
  opacity = 1,
): string {
  return (
    `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${fill}" ` +
    `opacity="${opacity}" ` +
    (outline ? `stroke="${INK}" stroke-width="3"` : 'stroke="none"') +
    '/>'
  );
}

function placedSvg(
  source: string,
  x: number,
  y: number,
  width: number,
  height = width,
): string {
  return source
    .replace('<svg ', `<svg x="${x}" y="${y}" overflow="visible" `)
    .replace(
      /width="[^"]+" height="[^"]+"/,
      `width="${width}" height="${height}"`,
    );
}

function svg(markup: string): string {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" ' +
    `width="128" height="128">${markup}</svg>`
  );
}

function proposalCar(direction: ProposalDirectionId, compact = false): string {
  const lived = direction === 'lived-campus';
  const service = direction === 'service-coded-edge';
  const x = compact ? 19 : 10;
  const width = compact ? 90 : 108;
  const front = x + width;
  const shell = service ? Q.green : Q.cream;
  const roof = service ? Q.cream : Q.green;
  return svg([
    e(64, 96, compact ? 40 : 49, 7, '#000000', false, 0.12),
    r(x, 38, width, 52, 18, shell, true),
    p(
      `M ${x + 25} 42 H ${front - 27} Q ${front - 16} 42 ${front - 12} 53 ` +
        `L ${front - 18} 76 Q ${front - 22} 86 ${front - 34} 86 ` +
        `H ${x + 31} Q ${x + 18} 86 ${x + 15} 75 L ${x + 12} 54 ` +
        `Q ${x + 14} 44 ${x + 25} 42 Z`,
      roof,
      true,
    ),
    p(
      `M ${x + 35} 46 H ${front - 39} L ${front - 31} 60 ` +
        `H ${x + 27} Z`,
      Q.blueGlass,
      true,
    ),
    p(
      `M ${x + 27} 65 H ${front - 31} L ${front - 39} 82 ` +
        `H ${x + 34} Z`,
      Q.blueGlassDark,
      true,
    ),
    line(`M 64 46 V 82`, Q.charcoal, 2, 0.65),
    r(front - 12, 50, 6, 11, 3, Q.creamLight, true),
    r(front - 12, 69, 6, 11, 3, Q.creamLight, true),
    r(x + 5, 51, 6, 10, 3, Q.coral, true),
    r(x + 5, 69, 6, 10, 3, Q.coral, true),
    ...(service
      ? [
          r(x + 21, 87, 28, 5, 2, Q.coral, true),
          r(front - 27, 31, 16, 10, 4, Q.cream, true),
          c(front - 19, 36, 3, Q.coral),
        ]
      : []),
    ...(lived
      ? [
          p(`M ${x + 12} 72 L ${x + 24} 69 L ${x + 22} 82 L ${x + 11} 84 Z`, Q.rust, false, 0.7),
          c(77, 54, 4, Q.yellow, true),
          line('M 79 50 L 83 46', Q.charcoal, 1.2, 0.7),
          r(43, 84, 23, 5, 2, Q.olive, false, 0.8),
        ]
      : []),
  ].join(''));
}

function proposalCrosswalk(direction: ProposalDirectionId): string {
  const service = direction === 'service-coded-edge';
  const lived = direction === 'lived-campus';
  const bars = [22, 40, 58, 76, 94]
    .map((y, index) => {
      const width = lived && index % 2 === 0 ? 82 : 90;
      const x = (128 - width) / 2;
      return r(x, y, width, 10, 3, Q.creamLight, true, lived ? 0.86 : 1);
    })
    .join('');
  return svg([
    bars,
    ...(service
      ? [
          r(11, 18, 13, 13, 4, Q.green, true),
          r(104, 18, 13, 13, 4, Q.green, true),
          r(11, 99, 13, 13, 4, Q.green, true),
          r(104, 99, 13, 13, 4, Q.green, true),
          r(15, 22, 5, 5, 2, Q.coral),
          r(108, 103, 5, 5, 2, Q.coral),
        ]
      : []),
    ...(lived
      ? [
          p('M 30 22 H 43 L 39 32 H 29 Z', FLOOR, false, 0.8),
          p('M 79 76 H 93 L 90 86 H 77 Z', FLOOR, false, 0.8),
          c(102, 104, 3, Q.foliageDark),
        ]
      : []),
  ].join(''));
}

function proposalLamp(direction: ProposalDirectionId): string {
  const service = direction === 'service-coded-edge';
  const lived = direction === 'lived-campus';
  return svg([
    e(64, 117, 17, 4, '#000000', false, 0.14),
    r(46, 22, 36, 24, 11, service ? Q.green : Q.cream, true),
    r(52, 29, 24, 12, 6, Q.creamLight, true),
    r(58, 43, 12, 65, 6, Q.green, true),
    r(51, 63, 26, 17, 7, service ? Q.cream : Q.greenLight, true),
    r(56, 68, 16, 7, 3, service ? Q.coral : Q.recess),
    r(47, 105, 34, 12, 6, Q.charcoal, true),
    ...(service
      ? [
          r(55, 82, 18, 13, 5, Q.cream, true),
          c(64, 88, 3, Q.coral),
          line('M 51 110 H 77', Q.coral, 3),
        ]
      : []),
    ...(lived
      ? [
          r(56, 78, 16, 8, 2, '#D9D08E', true),
          line('M 59 82 H 69', Q.charcoal, 1, 0.55),
          p('M 50 108 Q 42 99 43 91 Q 52 96 55 108 Z', Q.foliageDark, true),
        ]
      : []),
  ].join(''));
}

function proposalSign(direction: ProposalDirectionId): string {
  const service = direction === 'service-coded-edge';
  const lived = direction === 'lived-campus';
  return svg([
    e(64, 117, 18, 4, '#000000', false, 0.14),
    r(25, 27, 78, 48, 11, service ? Q.green : Q.cream, true),
    r(33, 35, 62, 32, 7, service ? Q.cream : Q.green, true),
    r(42, 42, 44, 7, 3, service ? Q.green : Q.creamLight),
    r(49, 54, 30, 6, 3, service ? Q.greenLight : Q.coral),
    r(34, 73, 13, 39, 5, Q.green, true),
    r(81, 73, 13, 39, 5, Q.green, true),
    r(27, 107, 74, 10, 5, Q.charcoal, true),
    ...(service
      ? [
          r(23, 48, 10, 19, 4, Q.coral, true),
          r(95, 35, 8, 13, 3, Q.creamLight, true),
        ]
      : []),
    ...(lived
      ? [
          r(62, 49, 24, 13, 2, '#E5D58F', true),
          line('M 66 54 H 82 M 66 58 H 77', Q.charcoal, 1, 0.55),
          p('M 32 108 Q 19 102 18 91 Q 29 94 39 108 Z', Q.foliageDark, true),
        ]
      : []),
  ].join(''));
}

function proposalBikeRack(direction: ProposalDirectionId): string {
  const service = direction === 'service-coded-edge';
  const lived = direction === 'lived-campus';
  const hoops = [28, 50, 72, 94]
    .map((x) =>
      line(`M ${x - 7} 39 Q ${x} 25 ${x + 7} 39 V 88`, Q.cream, 8),
    )
    .join('');
  return svg([
    e(64, 101, 52, 7, '#000000', false, 0.1),
    r(11, 86, 106, 15, 7, Q.green, true),
    hoops,
    line('M 18 82 H 110', Q.charcoal, 5),
    ...(service
      ? [
          r(10, 45, 15, 37, 6, Q.green, true),
          r(103, 45, 15, 37, 6, Q.green, true),
          r(14, 55, 7, 10, 3, Q.coral),
        ]
      : []),
    ...(lived
      ? [
          c(50, 61, 7, Q.coral, true),
          line('M 46 58 Q 50 52 54 58 V 65', Q.charcoal, 2),
          p('M 90 93 Q 99 83 106 91 Q 100 101 91 100 Z', Q.foliageDark, true),
        ]
      : []),
  ].join(''));
}

function proposalBench(direction: ProposalDirectionId): string {
  const service = direction === 'service-coded-edge';
  const lived = direction === 'lived-campus';
  return svg([
    e(64, 117, 50, 5, '#000000', false, 0.13),
    r(13, 43, 102, 33, 11, service ? Q.green : Q.cream, true),
    r(21, 50, 86, 18, 7, service ? Q.cream : Q.green, true),
    line('M 42 51 V 67 M 64 51 V 67 M 86 51 V 67', Q.charcoal, 2, 0.5),
    p('M 10 76 H 118 L 108 91 H 20 Z', service ? Q.cream : Q.green, true),
    r(23, 88, 14, 27, 5, Q.green, true),
    r(91, 88, 14, 27, 5, Q.green, true),
    ...(service
      ? [
          r(10, 72, 108, 8, 4, Q.coral, true),
          r(96, 94, 10, 14, 3, Q.cream, true),
        ]
      : []),
    ...(lived
      ? [
          r(27, 55, 24, 10, 3, Q.rust, false, 0.8),
          r(77, 78, 21, 9, 3, '#D5C880', true),
          line('M 81 82 H 94', Q.charcoal, 1, 0.55),
        ]
      : []),
  ].join(''));
}

function proposalPicnic(direction: ProposalDirectionId): string {
  const service = direction === 'service-coded-edge';
  const lived = direction === 'lived-campus';
  return svg([
    e(64, 108, 52, 7, '#000000', false, 0.1),
    r(15, 36, 98, 56, 13, service ? Q.green : Q.cream, true),
    r(22, 43, 84, 42, 9, service ? Q.cream : Q.green, true),
    line('M 50 43 V 85 M 78 43 V 85', Q.charcoal, 2, 0.45),
    r(24, 9, 80, 20, 9, service ? Q.cream : Q.green, true),
    r(24, 99, 80, 20, 9, service ? Q.cream : Q.green, true),
    r(31, 28, 66, 9, 4, Q.charcoal, true),
    r(31, 91, 66, 9, 4, Q.charcoal, true),
    ...(service
      ? [
          r(46, 34, 36, 9, 4, Q.coral, true),
          r(82, 101, 18, 16, 4, Q.green, true),
        ]
      : []),
    ...(lived
      ? [
          c(45, 63, 10, Q.paper, true),
          c(45, 63, 5, Q.coral),
          r(70, 56, 27, 14, 3, '#D9D08E', true),
          line('M 75 61 H 92 M 75 65 H 88', Q.charcoal, 1, 0.5),
        ]
      : []),
  ].join(''));
}

function proposalTree(direction: ProposalDirectionId): string {
  const service = direction === 'service-coded-edge';
  const lived = direction === 'lived-campus';
  return svg([
    e(64, 117, 43, 6, '#000000', false, 0.13),
    p('M 55 74 Q 50 92 49 112 H 79 Q 77 92 71 73 Z', Q.olive, true),
    p(
      'M 64 13 C 50 8 39 16 35 29 C 21 27 11 38 15 52 ' +
        'C 7 63 14 76 28 79 C 35 91 50 94 62 84 ' +
        'C 75 96 91 91 96 79 C 110 77 117 64 109 52 ' +
        'C 113 39 103 28 90 30 C 86 17 76 10 64 13 Z',
      service ? Q.foliageDark : Q.foliage,
      true,
    ),
    p(
      'M 32 56 C 38 39 49 28 64 25 C 76 27 88 37 96 53 ' +
        'C 84 47 75 48 64 57 C 52 49 43 48 32 56 Z',
      service ? Q.foliage : Q.foliageLight,
      false,
      0.92,
    ),
    p(
      'M 35 70 C 46 59 54 57 64 64 C 75 56 86 59 94 70 ' +
        'C 83 83 73 82 63 75 C 53 83 43 82 35 70 Z',
      Q.foliageDark,
      false,
      0.92,
    ),
    ...(service
      ? [
          r(46, 104, 36, 12, 6, Q.green, true),
          r(51, 108, 26, 5, 2, Q.coral),
          r(72, 77, 12, 15, 4, Q.cream, true),
        ]
      : []),
    ...(lived
      ? [
          p('M 22 68 Q 9 58 13 45 Q 27 44 36 58 Q 34 70 22 68 Z', Q.foliageDark, true),
          p('M 92 71 Q 107 58 114 69 Q 111 84 95 84 Z', Q.foliageLight, true),
          r(53, 88, 22, 8, 3, '#D7C878', true),
          line('M 57 92 H 71', Q.charcoal, 1, 0.5),
        ]
      : []),
  ].join(''));
}

function proposalBoulders(direction: ProposalDirectionId): string {
  const service = direction === 'service-coded-edge';
  const lived = direction === 'lived-campus';
  return svg([
    e(64, 96, 48, 11, '#000000', false, 0.1),
    p('M 13 88 Q 18 53 43 47 Q 62 58 58 92 Z', Q.creamShade, true),
    p('M 46 91 Q 55 37 84 33 Q 111 51 109 91 Z', service ? Q.green : Q.olive, true),
    p('M 74 91 Q 88 62 111 67 Q 121 79 115 96 Z', Q.cream, true),
    ...(service
      ? [r(75, 87, 39, 7, 3, Q.coral, false, 0.8)]
      : []),
    ...(lived
      ? [
          p('M 18 88 Q 25 70 34 86 Q 42 71 50 91 Z', Q.foliageDark, true),
          c(91, 47, 4, Q.foliageLight),
        ]
      : []),
  ].join(''));
}

export function renderOutdoorProposalSvg(
  direction: ProposalDirectionId,
  templateId: string,
): string {
  switch (templateId) {
    case 'car':
      return proposalCar(direction);
    case 'car-compact':
      return proposalCar(direction, true);
    case 'lot-marking-crosswalk':
      return proposalCrosswalk(direction);
    case 'lamp-post':
      return proposalLamp(direction);
    case 'sign-lot':
      return proposalSign(direction);
    case 'bike-rack':
      return proposalBikeRack(direction);
    case 'park-bench':
      return proposalBench(direction);
    case 'picnic-table':
      return proposalPicnic(direction);
    case 'tree-canopy':
      return proposalTree(direction);
    case 'boulder-arrangement':
      return proposalBoulders(direction);
    default:
      throw new Error(`No outdoor proposal geometry for ${templateId}`);
  }
}

function sourceFor(
  renderer: PropCalibrationRenderer,
  direction: OutdoorDirectionId,
  templateId: string,
): string {
  return direction === 'current'
    ? renderer.prop('current', templateId)
    : renderOutdoorProposalSvg(direction, templateId);
}

function drawGrid(
  parts: string[],
  x: number,
  y: number,
  columns: number,
  rows: number,
  cell: number,
): void {
  parts.push(
    `<rect x="${x}" y="${y}" width="${columns * cell}" ` +
      `height="${rows * cell}" fill="${FLOOR}" stroke="#56616A" stroke-width="2"/>`,
    `<rect x="${x + 6 * cell}" y="${y}" width="${4 * cell}" ` +
      `height="${rows * cell}" fill="${GRASS}"/>`,
    `<rect x="${x}" y="${y + 3.05 * cell}" width="${10 * cell}" ` +
      `height="${0.7 * cell}" fill="${WALK}" opacity=".94"/>`,
    line(
      `M ${x + 6 * cell} ${y} V ${y + rows * cell}`,
      Q.creamLight,
      2,
      0.5,
    ),
  );
  for (let column = 1; column < columns; column += 1) {
    parts.push(
      line(
        `M ${x + column * cell} ${y} V ${y + rows * cell}`,
        FLOOR_LINE,
        1,
        0.15,
      ),
    );
  }
  for (let row = 1; row < rows; row += 1) {
    parts.push(
      line(
        `M ${x} ${y + row * cell} H ${x + columns * cell}`,
        FLOOR_LINE,
        1,
        0.15,
      ),
    );
  }
}

function drawFacade(
  parts: string[],
  renderer: PropCalibrationRenderer,
  x: number,
  y: number,
  columns: number,
  cell: number,
): void {
  parts.push(renderer.wallTile(6, x, y, cell));
  for (let column = 1; column < columns - 1; column += 1) {
    parts.push(renderer.wallTile(10, x + column * cell, y, cell));
  }
  parts.push(renderer.wallTile(12, x + (columns - 1) * cell, y, cell));
}

function propPlacement(
  renderer: PropCalibrationRenderer,
  direction: OutdoorDirectionId,
  id: string,
  footprintX: number,
  footprintY: number,
  cell: number,
  occupancy = true,
): string {
  const template = renderer.template(id);
  const footprintWidth = template.gridFootprint.w * cell;
  const footprintHeight = template.gridFootprint.h * cell;
  const spriteSize = cell * PROP_NATIVE_FRAME_CELLS;
  const x = footprintX + (footprintWidth - spriteSize) / 2;
  const y = template.projection === 'plan'
    ? footprintY + (footprintHeight - spriteSize) / 2
    : footprintY + footprintHeight - spriteSize * (116 / AUTHORING_CANVAS);
  const guide = occupancy
    ? (
      `<rect x="${footprintX + 3}" y="${footprintY + 3}" ` +
      `width="${footprintWidth - 6}" height="${footprintHeight - 6}" ` +
      `rx="5" fill="${OCCUPANCY}" fill-opacity=".08" stroke="${OCCUPANCY}" ` +
      'stroke-width="1.3" stroke-dasharray="5 4"/>'
    )
    : '';
  return guide + placedSvg(
    sourceFor(renderer, direction, id),
    x,
    y,
    spriteSize,
  );
}

interface AgentPlacement {
  readonly recipe: CharacterRecipe;
  readonly facing: Facing | 'west';
  readonly x: number;
  readonly y: number;
}

function agentPlacement(
  renderer: PropCalibrationRenderer,
  spec: AgentPlacement,
  roomX: number,
  roomY: number,
  cell: number,
): string {
  const frameSize = cell * CHARACTER_FRAME_CELLS;
  const source = renderer.character(spec.recipe, spec.facing, 'neutral');
  const anchorX = roomX + spec.x * cell;
  const anchorY = roomY + spec.y * cell;
  return placedSvg(
    source,
    anchorX - frameSize / 2,
    anchorY - frameSize * 0.86,
    frameSize,
  );
}

const CLIPBOARD_EMPLOYEE: CharacterRecipe = {
  ...DEFAULT_CAST[0],
  id: 'outdoor-proof-clipboard',
  parts: {
    ...DEFAULT_CAST[0].parts,
    accessories: ['acc-clipboard'],
  },
};

function siteScene(
  renderer: PropCalibrationRenderer,
  direction: OutdoorDirectionId,
  x: number,
  y: number,
  cell: number,
  crowded = false,
): string {
  const parts: string[] = [];
  drawGrid(parts, x, y, 10, 7, cell);
  drawFacade(parts, renderer, x, y, 10, cell);

  parts.push(
    propPlacement(
      renderer,
      direction,
      'lot-marking-crosswalk',
      x + 4 * cell,
      y + 1 * cell,
      cell,
    ),
    propPlacement(
      renderer,
      direction,
      'car',
      x + 0.2 * cell,
      y + 1 * cell,
      cell,
    ),
    propPlacement(
      renderer,
      direction,
      'car-compact',
      x + 2.6 * cell,
      y + 4.5 * cell,
      cell,
    ),
    propPlacement(
      renderer,
      direction,
      'picnic-table',
      x + 3.1 * cell,
      y + 4.1 * cell,
      cell,
    ),
    propPlacement(
      renderer,
      direction,
      'bike-rack',
      x + 6.1 * cell,
      y + 1.5 * cell,
      cell,
    ),
    propPlacement(
      renderer,
      direction,
      'boulder-arrangement',
      x + 7.8 * cell,
      y + 5.2 * cell,
      cell,
    ),
  );

  const agents: readonly AgentPlacement[] = crowded
    ? [
        { recipe: DEFAULT_CAST[0], facing: 'south', x: 5.1, y: 3.55 },
        { recipe: DEFAULT_CAST[1], facing: 'east', x: 6.55, y: 4.75 },
        { recipe: DEFAULT_CAST[2], facing: 'west', x: 3.55, y: 6.15 },
        { recipe: DEFAULT_CAST[3], facing: 'north', x: 8.2, y: 5.5 },
        { recipe: CLIPBOARD_EMPLOYEE, facing: 'south', x: 1.8, y: 3.8 },
        { recipe: CONSTRUCTION_CREW[0], facing: 'west', x: 7.3, y: 3.55 },
      ]
    : [
        { recipe: DEFAULT_CAST[1], facing: 'south', x: 5.05, y: 3.55 },
        { recipe: CLIPBOARD_EMPLOYEE, facing: 'east', x: 6.75, y: 4.8 },
        { recipe: CONSTRUCTION_CREW[0], facing: 'west', x: 2.25, y: 4.25 },
      ];
  for (const actor of agents) {
    parts.push(agentPlacement(renderer, actor, x, y, cell));
  }

  parts.push(
    propPlacement(
      renderer,
      direction,
      'park-bench',
      x + 6.1 * cell,
      y + 4.2 * cell,
      cell,
    ),
    propPlacement(
      renderer,
      direction,
      'lamp-post',
      x + 8.75 * cell,
      y + 2.2 * cell,
      cell,
    ),
    propPlacement(
      renderer,
      direction,
      'sign-lot',
      x + 5.95 * cell,
      y + 2.15 * cell,
      cell,
    ),
    propPlacement(
      renderer,
      direction,
      'tree-canopy',
      x + 6.9 * cell,
      y + 3.8 * cell,
      cell,
    ),
  );
  return parts.join('');
}

function inventoryBand(parts: string[]): void {
  const y = 100;
  parts.push(
    panel(MARGIN, y, WIDTH - MARGIN * 2, 166, PANEL_ALT),
    text(MARGIN + 22, y + 34, 'Read-only inventory · existing exterior catalog', 21, 850, GREEN),
    text(
      WIDTH - MARGIN - 22,
      y + 34,
      '38 templates · 0 canonical SVG promotions in this slice',
      12,
      790,
      CORAL,
      'end',
    ),
  );
  OUTDOOR_INVENTORY_SUBGROUPS.forEach((group, index) => {
    const x = MARGIN + 28 + index * 760;
    parts.push(
      index > 0 ? line(`M ${x - 28} ${y + 52} V ${y + 142}`, RULE, 1) : '',
      text(x, y + 76, `${group.label.toUpperCase()} · ${group.ids.length}`, 13, 850, BLUE),
      wrappedText(
        x,
        y + 101,
        group.ids.join(' · '),
        88,
        18,
        9.5,
        580,
        MUTED,
      ),
    );
  });
  parts.push(
    panel(WIDTH - MARGIN - 1030, y + 54, 1000, 88, '#DAD4C6', 'none', 9),
    text(WIDTH - MARGIN - 1008, y + 80, 'BOUNDARY FOUND', 12, 900, CORAL),
    wrappedText(
      WIDTH - MARGIN - 1008,
      y + 103,
      'There are no dedicated construction-equipment templates. This proof reviews parking, campus, landscape, build-site ground detail, and the existing fabrication worker only.',
      132,
      18,
      10.5,
      650,
      INK,
    ),
  );
}

function closeMatrix(
  parts: string[],
  renderer: PropCalibrationRenderer,
): void {
  const y = 284;
  const height = 620;
  const width = WIDTH - MARGIN * 2;
  const labelWidth = 332;
  const columnWidth = (width - labelWidth - 30) / OUTDOOR_PROOF_CARRIERS.length;
  const sprite = 110;
  parts.push(
    panel(MARGIN, y, width, height, PANEL_ALT),
    text(MARGIN + 22, y + 36, 'Close read · projection-locked carrier matrix', 21, 850),
    text(
      WIDTH - MARGIN - 22,
      y + 36,
      '128u source frame · no character multiplier applied to props',
      12,
      760,
      CORAL,
      'end',
    ),
  );

  OUTDOOR_PROOF_CARRIERS.forEach((_id, index) => {
    const decision = OUTDOOR_PROOF_DECISIONS[index];
    const center = MARGIN + labelWidth + columnWidth * (index + 0.5);
    parts.push(
      text(center, y + 67, decision.role.toUpperCase(), 10, 840, GREEN, 'middle'),
      text(center, y + 84, decision.projection.toUpperCase(), 9, 700, MUTED, 'middle'),
    );
  });

  OUTDOOR_DIRECTIONS.forEach((direction, row) => {
    const rowY = y + 95 + row * 126;
    parts.push(
      panel(
        MARGIN + 14,
        rowY,
        width - 28,
        116,
        direction.panelFill,
        'none',
        9,
      ),
      text(MARGIN + 30, rowY + 30, direction.shortLabel, 13, 880, GREEN),
      wrappedText(
        MARGIN + 30,
        rowY + 52,
        direction.note,
        43,
        16,
        9.5,
        600,
        MUTED,
      ),
    );
    OUTDOOR_PROOF_CARRIERS.forEach((id, index) => {
      const center = MARGIN + labelWidth + columnWidth * (index + 0.5);
      parts.push(
        placedSvg(
          sourceFor(renderer, direction.id, id),
          center - sprite / 2,
          rowY + 2,
          sprite,
        ),
      );
    });
  });
  parts.push(
    text(
      MARGIN + 22,
      y + height - 18,
      'Recognition target: vehicle · crossing · light · sign · rack · bench · picnic table · tree before surface detail.',
      10,
      700,
      BLUE,
    ),
  );
}

function normalDirectionCard(
  parts: string[],
  renderer: PropCalibrationRenderer,
  direction: OutdoorDirection,
  x: number,
  y: number,
  width: number,
): void {
  const roomWidth = 10 * NORMAL_CELL;
  const roomX = x + (width - roomWidth) / 2;
  const roomY = y + 68;
  parts.push(
    panel(x, y, width, 666, direction.panelFill),
    text(x + 18, y + 29, direction.label, 15, 870, GREEN),
    text(x + 18, y + 50, direction.note, 9.5, 600, MUTED),
    text(x + width - 18, y + 29, `${NORMAL_CELL} px / cell`, 9.5, 780, CORAL, 'end'),
    siteScene(renderer, direction.id, roomX, roomY, NORMAL_CELL),
    text(
      x + 18,
      y + 610,
      'Wall/facade · parking · walkway · campus · character approach',
      9,
      680,
      BLUE,
    ),
    text(
      x + 18,
      y + 631,
      `props = native ${PROP_NATIVE_FRAME_CELLS}-cell frame · employees = production ×0.65`,
      9,
      650,
      MUTED,
    ),
    text(
      x + 18,
      y + 650,
      'Dashed = unchanged footprint; elevation overlap exposes occlusion.',
      9,
      650,
      MUTED,
    ),
  );
}

function farDirectionCard(
  parts: string[],
  renderer: PropCalibrationRenderer,
  direction: OutdoorDirection,
  x: number,
  y: number,
  width: number,
): void {
  const roomX = x + 18;
  const roomY = y + 59;
  parts.push(
    panel(x, y, width, 472, direction.panelFill),
    text(x + 18, y + 28, `${direction.shortLabel} · FAR CROWD`, 13, 860, GREEN),
    text(x + width - 18, y + 28, `${FAR_CELL} px / cell`, 9.5, 780, CORAL, 'end'),
    siteScene(renderer, direction.id, roomX, roomY, FAR_CELL, true),
  );
  direction.evaluation.forEach((note, index) => {
    parts.push(
      c(
        x + 447,
        y + 80 + index * 82,
        4,
        index === 0 ? GREEN : CORAL,
      ),
      wrappedText(
        x + 461,
        y + 85 + index * 82,
        note,
        50,
        17,
        9.5,
        index === 0 ? 720 : 600,
        index === 0 ? INK : MUTED,
      ),
    );
  });
  parts.push(
    line(`M ${x + 442} ${y + 330} H ${x + width - 20}`, RULE, 1),
    wrappedText(
      x + 447,
      y + 355,
      'Stress gates: six actors, wall context, mixed projections, tree/bench occlusion, lot crossing, fabrication-worker approach, and retained occupancy.',
      53,
      18,
      9.5,
      670,
      BLUE,
    ),
  );
}

function calibrationSheet(renderer: PropCalibrationRenderer): string {
  const parts: string[] = [
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAGE}"/>`,
    text(MARGIN, 46, 'QuotaCo outdoor + construction-site props · calibration v1', 29, 880),
    text(
      MARGIN,
      76,
      'REVIEW ONLY · current inventory + three bounded directions · literal gameplay scale',
      14,
      800,
      CORAL,
    ),
    text(
      WIDTH - MARGIN,
      44,
      'projection · footprint · pivot · navigation · collision · anchors held',
      12,
      740,
      GREEN,
      'end',
    ),
    text(
      WIDTH - MARGIN,
      70,
      `128u authoring · 112u wall datum · character ×${CHARACTER_VISUAL_SCALE} · schema ${CURRENT_SCHEMA_VERSION}`,
      11.5,
      650,
      MUTED,
      'end',
    ),
  ];
  inventoryBand(parts);
  closeMatrix(parts, renderer);

  const cardWidth = (WIDTH - MARGIN * 2 - GAP * 3) / 4;
  OUTDOOR_DIRECTIONS.forEach((direction, index) => {
    normalDirectionCard(
      parts,
      renderer,
      direction,
      MARGIN + index * (cardWidth + GAP),
      922,
      cardWidth,
    );
  });
  OUTDOOR_DIRECTIONS.forEach((direction, index) => {
    farDirectionCard(
      parts,
      renderer,
      direction,
      MARGIN + index * (cardWidth + GAP),
      1606,
      cardWidth,
    );
  });

  parts.push(
    panel(MARGIN, 2096, WIDTH - MARGIN * 2, 390, '#DAD4C6', 'none', 10),
    text(MARGIN + 24, 2134, 'Visual approval boundary', 19, 860, GREEN),
    text(
      MARGIN + 24,
      2165,
      'Choose none, one direction, or a bounded hybrid. Approval authorizes design refinement only—not source creation or production promotion.',
      12.5,
      690,
      INK,
    ),
    text(MARGIN + 24, 2206, 'Held during this review', 13, 840, BLUE),
    text(
      MARGIN + 24,
      2234,
      'accepted characters, silhouettes, heads, hair, garments, anchors, roots, footprints, 0.65 visual scale',
      11,
      640,
      MUTED,
    ),
    text(
      MARGIN + 24,
      2259,
      '128-unit character authoring canvas · accepted 112-unit wall datum · live prop projections and gameplay footprints',
      11,
      640,
      MUTED,
    ),
    text(
      MARGIN + 24,
      2284,
      'navigation · collision · interaction anchors · export contracts · schema · Unity registration',
      11,
      640,
      MUTED,
    ),
    text(MARGIN + 24, 2326, 'Not performed', 13, 840, CORAL),
    text(
      MARGIN + 24,
      2354,
      'no genuine SVG source creation · no template/default changes · no exporter change · no bundle export · no Unity import · no commit',
      11,
      720,
      MUTED,
    ),
    text(
      MARGIN + 24,
      2396,
      'If a direction is accepted, the next slice is a tighter silhouette/scale pass for these carriers. Artist-editable SVG files come only after that design is approved.',
      11.5,
      750,
      CORAL,
    ),
    panel(WIDTH - MARGIN - 1080, 2188, 1040, 234, PANEL_ALT, 'none', 9),
    text(WIDTH - MARGIN - 1054, 2220, 'CURRENT CATALOG REALITY', 12, 880, GREEN),
    wrappedText(
      WIDTH - MARGIN - 1054,
      2250,
      'The “construction-site” label currently means the outdoor environment around a build: lot markings, campus fixtures, landscape, ground scatter, and the existing fabrication worker. Dedicated barriers, pallets, machinery, or materials would be a separately scoped content decision.',
      130,
      21,
      11,
      650,
      INK,
    ),
    text(
      WIDTH - MARGIN - 1054,
      2379,
      'No silent scope expansion in this proof.',
      11,
      820,
      CORAL,
    ),
  );
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" ` +
    `viewBox="0 0 ${WIDTH} ${HEIGHT}">${parts.join('')}</svg>`
  );
}

function inventoryMarkdown(): string {
  const lines = [
    '# QuotaCo outdoor and construction-site prop inventory v1',
    '',
    'Status: read-only review inventory. No production source, template, export, schema, or Unity registration changes are authorized by this file.',
    '',
    '## Scope finding',
    '',
    'The live category contains parking, campus, landscape, build-site ground detail, and exterior fixtures. It does not contain dedicated construction equipment. The existing fabrication worker is used only as a scale and interaction reference.',
    '',
  ];
  for (const group of OUTDOOR_INVENTORY_SUBGROUPS) {
    lines.push(`## ${group.label} (${group.ids.length})`, '');
    for (const id of group.ids) lines.push(`- \`${id}\``);
    lines.push('');
  }
  lines.push(
    '## First proof carriers',
    '',
    '| Template | Role | Projection | Recognition target |',
    '| --- | --- | --- | --- |',
  );
  for (const decision of OUTDOOR_PROOF_DECISIONS) {
    lines.push(
      `| \`${decision.id}\` | ${decision.role} | ${decision.projection} | ${decision.recognition} |`,
    );
  }
  lines.push(
    '',
    'Context-only carriers: `car-compact`, `boulder-arrangement`.',
    '',
    '## Review boundary',
    '',
    '- Preserve every existing footprint, projection, pivot, navigation/collision contract, and interaction anchor.',
    '- Keep character roots and the 0.65 character visual scale unchanged.',
    '- Do not apply the character multiplier to props.',
    '- Do not create genuine SVG sources until a design is visually accepted.',
    '- Do not change exports, schema, default instances, facility catalogs, or Unity registration during this proof.',
    '',
  );
  return lines.join('\n');
}

function metrics(renderer: PropCalibrationRenderer): object {
  const outdoorGroup = PROP_REDESIGN_INVENTORY_GROUPS.find(
    ({ id }) => id === 'outdoor-construction',
  );
  if (!outdoorGroup) throw new Error('Missing outdoor-construction inventory group');
  return {
    status: 'review-only-awaiting-visual-approval',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    authoringCanvas: AUTHORING_CANVAS,
    wallDatum: WALL_DATUM,
    characterVisualScale: CHARACTER_VISUAL_SCALE,
    propVisualMultiplier: null,
    propNativeFrameCells: PROP_NATIVE_FRAME_CELLS,
    inventory: {
      templateCount: outdoorGroup.propIds.length,
      subgroups: OUTDOOR_INVENTORY_SUBGROUPS.map((group) => ({
        id: group.id,
        count: group.ids.length,
        ids: group.ids,
      })),
      dedicatedConstructionEquipmentTemplates: [],
      constructionReferenceCharacter: CONSTRUCTION_CREW[0].id,
    },
    directions: OUTDOOR_DIRECTIONS.map(({ id, label, note }) => ({
      id,
      label,
      note,
    })),
    carriers: [...OUTDOOR_PROOF_CARRIERS, ...CONTEXT_CARRIERS].map((id) => {
      const template = renderer.template(id);
      return {
        id,
        projection: template.projection,
        placement: template.placement ?? 'floor',
        gridFootprint: template.gridFootprint,
        gridPivot: template.gridPivot ?? null,
        interactionFootprint: template.footprint ?? null,
        params: template.params,
      };
    }),
    stressGates: [
      'close 128-unit source read',
      `normal ${NORMAL_CELL}px-per-cell literal gameplay context`,
      `far ${FAR_CELL}px-per-cell crowded context`,
      'accepted wall/facade context',
      'mixed plan and elevation projections',
      'tree and bench occlusion',
      'employee and fabrication-worker approaches',
      'unchanged occupancy guides',
    ],
    protectedReviewSurfaces: PROTECTED_REVIEW_SURFACES,
    mutationsPerformed: {
      productionSvgSources: false,
      propTemplates: false,
      defaultInstances: false,
      exporter: false,
      schema: false,
      unityRegistration: false,
      commit: false,
    },
  };
}

export function validateOutdoorConstructionCalibration(): {
  inventoryCount: number;
  carrierCount: number;
  directionCount: number;
} {
  const outdoorGroup = PROP_REDESIGN_INVENTORY_GROUPS.find(
    ({ id }) => id === 'outdoor-construction',
  );
  if (!outdoorGroup) throw new Error('Missing outdoor-construction inventory group');
  const subgroupIds = OUTDOOR_INVENTORY_SUBGROUPS.flatMap(({ ids }) => ids);
  if (new Set(subgroupIds).size !== subgroupIds.length) {
    throw new Error('Outdoor inventory subgroup contains duplicate ids');
  }
  if (
    subgroupIds.length !== outdoorGroup.propIds.length ||
    subgroupIds.some((id) => !outdoorGroup.propIds.includes(id))
  ) {
    throw new Error('Outdoor subgroup inventory does not cover the live group exactly');
  }
  for (const id of [...OUTDOOR_PROOF_CARRIERS, ...CONTEXT_CARRIERS]) {
    if (!PROP_TEMPLATES.some((template) => template.id === id)) {
      throw new Error(`Missing live outdoor carrier ${id}`);
    }
  }
  return {
    inventoryCount: subgroupIds.length,
    carrierCount: OUTDOOR_PROOF_CARRIERS.length,
    directionCount: OUTDOOR_DIRECTIONS.length,
  };
}

export async function renderQuotaCoOutdoorConstructionCalibration(
  output: string,
): Promise<{
  svgPath: string;
  pngPath: string;
  metricsPath: string;
  inventoryPath: string;
}> {
  validateOutdoorConstructionCalibration();
  const renderer = new PropCalibrationRenderer(new Map());
  const source = calibrationSheet(renderer);
  const png = new Resvg(source, {
    font: { loadSystemFonts: true },
  }).render().asPng();
  await mkdir(output, { recursive: true });
  const base = 'quota-co-outdoor-construction-calibration-v1';
  const svgPath = path.join(output, `${base}.svg`);
  const pngPath = path.join(output, `${base}.png`);
  const metricsPath = path.join(output, `${base}-metrics.json`);
  const inventoryPath = path.join(
    output,
    'quota-co-outdoor-construction-inventory-v1.md',
  );
  await writeFile(svgPath, source, 'utf8');
  await writeFile(pngPath, png);
  await writeFile(
    metricsPath,
    `${JSON.stringify(metrics(renderer), null, 2)}\n`,
    'utf8',
  );
  await writeFile(inventoryPath, `${inventoryMarkdown()}\n`, 'utf8');
  return { svgPath, pngPath, metricsPath, inventoryPath };
}

interface CliOptions {
  readonly output: string;
}

function parseArgs(args: readonly string[]): CliOptions {
  let output = path.resolve('docs/previews');
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--out') {
      const value = args[++index];
      if (!value) throw new Error('--out requires a path');
      output = path.resolve(value);
      continue;
    }
    throw new Error(`Unknown argument ${argument}`);
  }
  return { output };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const result = await renderQuotaCoOutdoorConstructionCalibration(
    options.output,
  );
  process.stdout.write(
    'Wrote review-only QuotaCo outdoor/construction calibration:\n' +
      `${result.svgPath}\n` +
      `${result.pngPath}\n` +
      `${result.metricsPath}\n` +
      `${result.inventoryPath}\n`,
  );
}

if (
  process.argv[1]?.endsWith('quotaCoOutdoorConstructionCalibrationPreview.ts')
) {
  main().catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
