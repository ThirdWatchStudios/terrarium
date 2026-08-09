/**
 * Review-only QuotaCo prop redesign inventory + literal gameplay-scale proof.
 *
 *   node --import tsx scripts/quotaCoPropRedesignCalibrationPreview.ts
 *   node --import tsx scripts/quotaCoPropRedesignCalibrationPreview.ts --out docs/previews
 *
 * This script does not register proposal art. It renders the current prop
 * catalog beside three temporary, code-owned directions while keeping template
 * ids, grid footprints, pivots, placement, projection, facility metadata,
 * export/schema surfaces, and Unity registration untouched. After direction
 * review, it also renders one consolidated hybrid proof. That proof remains
 * code-owned; standalone artist-editable SVG sources belong to the later,
 * separately approved source-art slice.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';

import {
  composeCharacter,
  composeProp,
  composeWallTile,
} from '../src/core/compositor';
import {
  DEFAULT_CAST,
  DEFAULT_STYLE,
  defaultProject,
} from '../src/data/defaults';
import { facilityCatalogJson } from '../src/core/layout';
import {
  CURRENT_SCHEMA_VERSION,
  type CharacterRecipe,
  type Facing,
  type PropInstance,
  type PropTemplate,
  type StyleSheet,
  type TileInstance,
} from '../src/core/types';
import { PART_LIBRARY } from '../src/parts/library';
import type { Pose } from '../src/parts/poses';
import { DEPARTMENT_MACHINE_TEMPLATE_IDS } from '../src/props/departmentMachineManifest';
import { PROP_TEMPLATES } from '../src/props/templates';
import { BLOB_CONFIGS } from '../src/tiles/blob';

const WIDTH = 3400;
const HEIGHT = 2480;
const MARGIN = 36;
const GAP = 18;
const NORMAL_CELL = 90;
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
const OCCUPANCY = '#D7CFAF';
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
  foliage: '#527A45',
  foliageDark: '#355B34',
  terracotta: '#A25C45',
  metal: '#8E9690',
} as const;

export type PropInventoryGroupId =
  | 'handheld-character-relative'
  | 'desk-work-surface'
  | 'furniture'
  | 'facilities-machines'
  | 'department-production'
  | 'wall-mounted-decorative'
  | 'outdoor-construction';

interface PropInventoryGroup {
  readonly id: PropInventoryGroupId;
  readonly label: string;
  readonly note: string;
  readonly propIds: readonly string[];
  readonly accessoryIds?: readonly string[];
}

const HANDHELD_ACCESSORY_IDS = [
  'acc-glasses',
  'acc-lanyard',
  'acc-mug',
  'acc-badge',
  'acc-headset',
  'acc-hard-hat',
  'acc-watch',
  'acc-earbuds',
  'acc-clipboard',
  'acc-coffee-tray',
  'acc-paper-stack',
  'acc-hairnet',
] as const;

const DESK_WORK_SURFACE_IDS = [
  'desk',
  'desk-succulent',
  'desk-lamp',
  'personal-desk-items',
  'standing-desk',
  'coffee-table',
  'ping-pong-table',
  'foosball-table',
  'conference-table',
  'reception-desk',
  'desk-clutter',
  'cubicle-workstation',
  'kitchenette-counter',
  'break-table',
  'prep-table',
  'dining-carrel',
  'cafeteria-table',
  'tray-stack',
] as const;

const FURNITURE_IDS = [
  'bookshelf',
  'lockers',
  'open-shelving',
  'waiting-bench',
  'pantry-shelf',
  'bean-bag',
  'nap-pod',
  'pet-bed',
  'bar-cart',
  'office-chair',
  'filing-cabinet',
  'supply-cabinet',
  'coat-rack',
  'couch',
  'lounge-seating',
  'restroom-stall',
] as const;

const FACILITY_MACHINE_IDS = [
  'water-cooler',
  'printer',
  'coffee-machine',
  'printer-jammed',
  'coffee-machine-broken',
  'water-cooler-empty',
  'restroom-sink',
  'copier',
  'shredder',
  'server-rack',
  'iris-installation-unit',
  'iris-installation-unit-dormant',
  'iris-charging-dock',
  'phone-booth',
  'microwave',
  'recycling-bins',
  'fridge',
  'vending-machine',
  'mail-station',
  'trash-bin',
  'elevator-bank',
  'serving-line',
  'service-scanner',
  'commercial-range',
  'dish-return',
  'walk-in-front',
] as const;

const WALL_DECORATIVE_IDS = [
  'office-plant',
  'potted-tree',
  'hanging-plant',
  'floor-lamp',
  'framed-art',
  'poster',
  'wall-clock',
  'wall-screen',
  'kanban-board',
  'fish-tank',
  'string-lights',
  'badge-reader',
  'door',
  'window',
  'nameplate',
  'hvac-vent',
  'rug',
  'whiteboard',
  'bulletin-board',
  'wall-calendar',
  'water-fountain',
  'exit-sign',
  'neighbor-glass',
  'directory-placard',
  'fire-extinguisher',
] as const;

const OUTDOOR_CONSTRUCTION_IDS = [
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
] as const;

export const PROP_REDESIGN_INVENTORY_GROUPS:
readonly PropInventoryGroup[] = [
  {
    id: 'handheld-character-relative',
    label: 'Handheld and character-relative items',
    note:
      'Character accessories attached to head, body, wrist, or hand anchors; ' +
      'held items follow the complete 0.65 character transform.',
    propIds: [],
    accessoryIds: HANDHELD_ACCESSORY_IDS,
  },
  {
    id: 'desk-work-surface',
    label: 'Desk and work-surface items',
    note:
      'Plan-projected work surfaces and the small items that establish their use.',
    propIds: DESK_WORK_SURFACE_IDS,
  },
  {
    id: 'furniture',
    label: 'Furniture',
    note:
      'Seating, storage, shelving, and freestanding furnishing shells.',
    propIds: FURNITURE_IDS,
  },
  {
    id: 'facilities-machines',
    label: 'Facilities and machines',
    note:
      'Amenities, appliances, processing equipment, IRIS equipment, and service infrastructure.',
    propIds: FACILITY_MACHINE_IDS,
  },
  {
    id: 'department-production',
    label: 'Department production and pneumatic transport',
    note:
      'First-class production machines, queue furniture, loading/delivery edges, ' +
      'and standardized tube/canister transport SKUs.',
    propIds: DEPARTMENT_MACHINE_TEMPLATE_IDS,
  },
  {
    id: 'wall-mounted-decorative',
    label: 'Wall-mounted and decorative items',
    note:
      'Wall-slot architecture plus office-softening plants, graphics, light, and display pieces.',
    propIds: WALL_DECORATIVE_IDS,
  },
  {
    id: 'outdoor-construction',
    label: 'Outdoor and construction-site props',
    note:
      'Parking, campus, landscape, build-site ground detail, and exterior fixtures.',
    propIds: OUTDOOR_CONSTRUCTION_IDS,
  },
];

export type PropRedesignDirectionId =
  | 'current'
  | 'catalog-shell'
  | 'service-spine'
  | 'used-shell'
  | 'hybrid';

type CodeProposalDirectionId = Exclude<
  PropRedesignDirectionId,
  'current' | 'hybrid'
>;

export interface PropRedesignDirection {
  readonly id: PropRedesignDirectionId;
  readonly label: string;
  readonly shortLabel: string;
  readonly note: string;
  readonly evaluation: readonly string[];
  readonly panelFill: string;
}

export const PROP_REDESIGN_DIRECTIONS:
readonly PropRedesignDirection[] = [
  {
    id: 'current',
    label: 'CONTROL · current production art',
    shortLabel: 'CURRENT',
    note: 'Real composed prop assets at their present 1.0 world envelope.',
    evaluation: [
      'Silhouettes vary by template rather than by a shared product family.',
      'Machines reach near-character height after the 0.65 character lock.',
      'Functional slots often disappear before the outer box does.',
    ],
    panelFill: PANEL,
  },
  {
    id: 'catalog-shell',
    label: 'A · CATALOG SHELL',
    shortLabel: 'CATALOG SHELL',
    note: 'Broad cream rollover, deep-green chassis, one coral hardware tell.',
    evaluation: [
      'Strongest shared QuotaCo catalog read and calmest crowded-room rhythm.',
      'Broad radii keep work surfaces and amenity shells friendly, not sleek.',
      'Interaction faces remain large, dark, and front-biased.',
    ],
    panelFill: GREEN_SOFT,
  },
  {
    id: 'service-spine',
    label: 'B · SERVICE SPINE',
    shortLabel: 'SERVICE SPINE',
    note: 'Asymmetric equipment pod, dark service band, visibly replaceable modules.',
    evaluation: [
      'Most distinctive machine silhouettes and clearest service/maintenance logic.',
      'Higher vertical rhythm risks competing with heads in crowded rooms.',
      'Best functional read for copier, storage, and hydration surfaces.',
    ],
    panelFill: TEAL_SOFT,
  },
  {
    id: 'used-shell',
    label: 'C · USED SHELL',
    shortLabel: 'USED SHELL',
    note: 'Catalog shell softened by wear, paper, repairs, plants, and personal color.',
    evaluation: [
      'Warmest room read without replacing the shared institutional shell.',
      'Personal overlays help reacquire desks and chairs in a repeated field.',
      'Small clutter must remain subordinate at 40 px to avoid confetti noise.',
    ],
    panelFill: CORAL_SOFT,
  },
];

export const PROP_REDESIGN_HYBRID_DIRECTION: PropRedesignDirection = {
  id: 'hybrid',
  label: 'SELECTED · QUOTACO WORKHORSE HYBRID',
  shortLabel: 'WORKHORSE HYBRID',
  note:
    'Catalog Shell bodies · Service Spine function · Used Shell personalization.',
  evaluation: [
    'One low, rounded institutional family remains legible before surface detail.',
    'Service bands appear only where they explain access, output, refill, or maintenance.',
    'Wear and personal objects stay optional and subordinate at far gameplay zoom.',
  ],
  panelFill: GREEN_SOFT,
};

export const REPRESENTATIVE_PROP_IDS = [
  'desk',
  'office-chair',
  'filing-cabinet',
  'copier',
  'office-plant',
] as const;

export const REPRESENTATIVE_HANDHELD_ID = 'acc-clipboard' as const;

export const HYBRID_PROP_DECISIONS = [
  {
    propId: 'desk',
    role: 'Work surface',
    projection: 'plan',
    decision:
      'Broad desktop silhouette with inset writing surface, monitor, keyboard, papers, and mug; no front-facing console modules.',
  },
  {
    propId: 'office-chair',
    role: 'Seating',
    projection: 'plan',
    decision:
      'Top-down backrest, seat, and paired arms dominate; three tucked caster contacts imply a rolling base without an octopus silhouette.',
  },
  {
    propId: 'filing-cabinet',
    role: 'Storage',
    projection: 'elevation',
    decision:
      'One rounded cabinet hull with an unmistakable vertical drawer stack, label pulls, and grounded plinth.',
  },
  {
    propId: 'copier',
    role: 'Machine',
    projection: 'elevation',
    decision:
      'One floor-standing copier hull organized around scanner lid, control panel, output mouth, paper drawers, and base.',
  },
  {
    propId: 'office-plant',
    role: 'Personalization',
    projection: 'elevation',
    decision:
      'Organic leaf canopy rises from one molded planter; the shell treatment stays below the foliage.',
  },
] as const;

export const HYBRID_PROP_SOURCE_FILES = [
  {
    propId: 'desk',
    projection: 'plan',
    path: 'assets/props/quota-co-workhorse-v1/desk.svg',
    requiredGroups: ['shell', 'structure', 'function', 'personalization'],
  },
  {
    propId: 'office-chair',
    projection: 'plan',
    path: 'assets/props/quota-co-workhorse-v1/office-chair.svg',
    requiredGroups: ['shadow', 'shell', 'structure', 'function', 'personalization'],
  },
  {
    propId: 'filing-cabinet',
    projection: 'elevation',
    path: 'assets/props/quota-co-workhorse-v1/filing-cabinet.svg',
    requiredGroups: ['shadow', 'shell', 'structure', 'function', 'personalization'],
  },
  {
    propId: 'copier',
    projection: 'elevation',
    path: 'assets/props/quota-co-workhorse-v1/copier.svg',
    requiredGroups: ['shadow', 'shell', 'structure', 'function'],
  },
  {
    propId: 'office-plant',
    projection: 'elevation',
    path: 'assets/props/quota-co-workhorse-v1/office-plant.svg',
    requiredGroups: ['shadow', 'shell', 'structure', 'foliage', 'personalization'],
  },
] as const;

const PROTECTED_SURFACES = [
  'CONTRACT.md',
  'src/core/exporter.ts',
  'src/core/layout.ts',
  'src/core/types.ts',
  'src/data/defaults.ts',
  'src/props/templates.ts',
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

function shadow(cx: number, cy: number, rx: number, ry: number): string {
  return e(cx, cy, rx, ry, '#000000', false, 0.12);
}

function proposalDesk(direction: CodeProposalDirectionId): string {
  if (direction === 'service-spine') {
    return [
      r(11, 35, 106, 60, 12, Q.cream, true),
      r(18, 43, 67, 40, 8, Q.olive),
      r(16, 28, 82, 18, 7, Q.creamLight, true),
      r(23, 32, 24, 10, 3, Q.recess),
      r(51, 32, 32, 10, 3, Q.recess),
      r(87, 39, 29, 49, 8, Q.green, true),
      r(93, 46, 17, 25, 4, Q.recess),
      r(96, 75, 11, 6, 2, Q.coral),
      r(25, 51, 43, 8, 2, Q.charcoal),
      r(36, 64, 28, 12, 3, Q.creamShade),
      e(75, 68, 4, 6, Q.creamShade),
    ].join('');
  }
  const used = direction === 'used-shell';
  return [
    r(10, 34, 108, 62, 14, Q.cream, true),
    r(18, 42, 92, 40, 9, used ? Q.olive : Q.green),
    r(16, 31, 96, 17, 8, Q.creamLight, true),
    r(23, 35, 27, 9, 3, Q.recess),
    r(78, 35, 27, 9, 3, Q.recess),
    r(18, 83, 92, 10, 5, Q.green, true),
    r(14, 53, 11, 23, 5, Q.green, true),
    r(103, 53, 11, 23, 5, Q.green, true),
    r(24, 51, 42, 8, 2, Q.charcoal),
    r(35, 64, 31, 12, 3, Q.creamShade),
    e(76, 69, 4, 6, Q.creamShade),
    r(106, 62, 4, 10, 1, Q.coral),
    ...(used
      ? [
          r(28, 47, 18, 13, 1, Q.paper),
          line('M 31 52 H 42 M 31 56 H 39', Q.charcoal, 1.2, 0.45),
          e(91, 57, 6, 6, Q.rust),
          e(91, 57, 3, 3, '#5A3527'),
          r(73, 66, 8, 10, 2, Q.terracotta),
          p('M 77 66 L 72 56 L 78 60 L 82 52 L 82 66 Z', Q.foliage),
          p('M 16 83 L 30 83 L 26 87 L 18 87 Z', Q.creamShade, false, 0.7),
        ]
      : []),
  ].join('');
}

function proposalChair(direction: CodeProposalDirectionId): string {
  if (direction === 'service-spine') {
    return [
      e(64, 103, 24, 9, '#000000', false, 0.12),
      p('M 37 42 Q 37 31 49 30 H 81 Q 92 31 93 42 L 88 57 H 42 Z', Q.green, true),
      r(43, 36, 44, 21, 8, Q.cream),
      p('M 43 58 Q 35 66 40 85 Q 64 98 88 85 Q 93 66 85 58 Z', Q.green, true),
      r(47, 61, 35, 25, 9, Q.coral),
      r(82, 55, 11, 33, 5, Q.cream, true),
      r(87, 62, 4, 15, 2, Q.rust),
      e(64, 98, 8, 6, Q.charcoal, true),
    ].join('');
  }
  const used = direction === 'used-shell';
  return [
    e(64, 103, 25, 9, '#000000', false, 0.12),
    r(36, 35, 56, 24, 10, Q.cream, true),
    r(42, 40, 44, 16, 7, used ? Q.rust : Q.coral),
    p('M 38 59 Q 34 73 41 88 Q 64 99 87 88 Q 94 73 90 59 Z', Q.cream, true),
    r(44, 62, 40, 25, 10, used ? '#A35C49' : Q.coral),
    r(60, 88, 8, 12, 3, Q.green, true),
    e(64, 100, 11, 5, Q.green, true),
    ...(used
      ? [
          p('M 41 36 Q 55 29 69 37 L 62 56 H 44 Z', '#55564F', false, 0.9),
          line('M 50 66 Q 63 70 78 65', Q.creamShade, 2, 0.7),
        ]
      : []),
  ].join('');
}

function proposalStorage(direction: CodeProposalDirectionId): string {
  if (direction === 'service-spine') {
    return [
      shadow(64, 117, 20, 4),
      r(40, 30, 48, 86, 9, Q.cream, true),
      r(47, 38, 34, 70, 5, Q.green, true),
      r(50, 42, 28, 13, 3, Q.recess),
      r(50, 59, 28, 18, 3, Q.greenLight),
      r(50, 81, 28, 18, 3, Q.greenLight),
      r(55, 63, 18, 4, 2, Q.charcoal),
      r(55, 85, 18, 4, 2, Q.charcoal),
      r(81, 37, 7, 58, 3, Q.teal, true),
      r(83, 47, 3, 11, 1, Q.coral),
      r(41, 107, 46, 9, 3, Q.charcoal, true),
    ].join('');
  }
  const used = direction === 'used-shell';
  return [
    shadow(64, 117, 23, 4),
    r(37, 40, 54, 76, 10, Q.green, true),
    r(35, 34, 58, 18, 9, Q.cream, true),
    r(42, 54, 44, 17, 4, Q.greenLight),
    r(42, 74, 44, 17, 4, Q.greenLight),
    r(42, 94, 44, 15, 4, Q.greenLight),
    r(49, 59, 30, 4, 2, Q.charcoal),
    r(49, 79, 30, 4, 2, Q.charcoal),
    r(49, 99, 30, 4, 2, Q.charcoal),
    r(82, 57, 4, 9, 1, Q.coral),
    r(37, 108, 54, 8, 3, Q.charcoal, true),
    ...(used
      ? [
          r(48, 30, 32, 6, 1, Q.paper),
          r(52, 26, 23, 5, 1, '#D9D4C9'),
          r(46, 76, 14, 8, 1, '#E5D89C'),
          line('M 49 80 H 57', Q.charcoal, 1, 0.4),
          line('M 41 110 L 51 108', Q.creamShade, 2, 0.7),
        ]
      : []),
  ].join('');
}

function proposalCopier(direction: CodeProposalDirectionId): string {
  if (direction === 'service-spine') {
    return [
      shadow(64, 117, 33, 5),
      r(24, 47, 74, 69, 10, Q.green, true),
      r(20, 39, 68, 29, 10, Q.cream, true),
      r(28, 44, 43, 16, 5, Q.recess),
      r(35, 38, 28, 9, 3, Q.paper),
      r(84, 50, 24, 61, 8, Q.cream, true),
      r(90, 56, 12, 25, 3, Q.teal),
      r(92, 59, 8, 6, 2, Q.recess),
      r(94, 70, 5, 5, 1, Q.coral),
      r(32, 76, 54, 22, 5, Q.recess),
      p('M 36 82 H 80 V 102 H 32 V 90 Z', Q.paper),
      r(25, 106, 82, 10, 4, Q.charcoal, true),
    ].join('');
  }
  const used = direction === 'used-shell';
  return [
    shadow(64, 117, 35, 5),
    r(24, 54, 80, 62, 11, Q.green, true),
    r(20, 42, 88, 35, 12, Q.cream, true),
    r(29, 49, 53, 19, 6, Q.recess),
    r(39, 39, 34, 13, 3, Q.paper),
    r(86, 50, 14, 17, 4, Q.teal),
    r(90, 54, 6, 6, 2, Q.coral),
    r(31, 81, 65, 24, 6, Q.recess),
    p('M 36 86 H 91 V 110 H 31 V 96 Z', Q.paper),
    r(23, 107, 82, 9, 4, Q.charcoal, true),
    ...(used
      ? [
          r(74, 36, 25, 7, 1, '#D8D2C5'),
          r(78, 32, 19, 5, 1, Q.paper),
          r(26, 68, 20, 9, 1, '#E6D58E'),
          line('M 29 72 H 43', Q.charcoal, 1, 0.45),
          p('M 90 107 Q 99 101 104 109 L 104 114 H 89 Z', Q.paper),
        ]
      : []),
  ].join('');
}

function proposalPlant(direction: CodeProposalDirectionId): string {
  if (direction === 'service-spine') {
    return [
      shadow(64, 117, 18, 4),
      r(45, 80, 38, 36, 7, Q.green, true),
      r(42, 76, 44, 14, 7, Q.cream, true),
      r(50, 92, 28, 18, 4, Q.teal),
      p('M 63 80 Q 41 58 49 40 Q 64 55 64 78 Z', Q.foliage, true),
      p('M 65 80 Q 86 56 79 36 Q 65 52 64 78 Z', Q.foliageDark, true),
      p('M 64 78 Q 54 45 64 27 Q 75 48 65 80 Z', Q.foliage, true),
      p('M 59 80 Q 34 72 36 53 Q 53 58 62 79 Z', Q.foliageDark, true),
      r(77, 95, 4, 10, 1, Q.coral),
    ].join('');
  }
  const used = direction === 'used-shell';
  return [
    shadow(64, 117, 19, 4),
    p('M 43 82 H 85 L 80 116 H 48 Z', Q.cream, true),
    r(41, 78, 46, 13, 6, Q.creamLight, true),
    r(48, 98, 32, 18, 4, Q.green, true),
    e(64, 80, 18, 5, '#3B3028'),
    e(53, 66, 16, 19, Q.foliage, true),
    e(73, 64, 17, 21, Q.foliageDark, true),
    e(63, 48, 18, 23, Q.foliage, true),
    e(45, 50, 13, 17, Q.foliageDark, true),
    e(82, 47, 13, 18, Q.foliage, true),
    ...(used
      ? [
          e(38, 58, 9, 15, Q.foliage, true),
          e(88, 69, 11, 16, Q.foliageDark, true),
          p('M 77 83 L 86 76 L 88 88 Z', '#E6D58E'),
          line('M 80 83 L 85 80', Q.charcoal, 1, 0.45),
        ]
      : []),
  ].join('');
}

function proposalPropSvg(
  direction: CodeProposalDirectionId,
  templateId: string,
): string {
  let markup: string;
  switch (templateId) {
    case 'desk':
      markup = proposalDesk(direction);
      break;
    case 'office-chair':
      markup = proposalChair(direction);
      break;
    case 'filing-cabinet':
      markup = proposalStorage(direction);
      break;
    case 'copier':
      markup = proposalCopier(direction);
      break;
    case 'office-plant':
      markup = proposalPlant(direction);
      break;
    default:
      throw new Error(`No review-only proposal geometry for ${templateId}`);
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" ` +
    `width="128" height="128">${markup}</svg>`
  );
}

function stripSvgShell(source: string): string {
  return source
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
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

export class PropCalibrationRenderer {
  private readonly style: StyleSheet;
  private readonly wall: TileInstance;
  private readonly props: readonly PropInstance[];
  private readonly currentPropCache = new Map<string, string>();
  private readonly wallCache = new Map<string, string>();
  private readonly characterCache = new Map<string, string>();

  constructor(
    private readonly hybridPropSources: ReadonlyMap<string, string>,
  ) {
    const project = defaultProject();
    const wall = project.walls.find(({ id }) => id === 'wall-office');
    if (!wall) throw new Error('Default project is missing wall-office');
    this.wall = wall;
    this.props = project.props;
    this.style = {
      ...structuredClone(DEFAULT_STYLE),
      render: {
        ...DEFAULT_STYLE.render,
        contactShadow: 0.12,
      },
    };
  }

  template(templateId: string): PropTemplate {
    const template = PROP_TEMPLATES.find(({ id }) => id === templateId);
    if (!template) throw new Error(`Missing prop template ${templateId}`);
    return template;
  }

  prop(direction: PropRedesignDirectionId, templateId: string): string {
    if (direction === 'hybrid') {
      const source = this.hybridPropSources.get(templateId);
      if (!source) {
        throw new Error(
          `Missing standalone hybrid SVG source for ${templateId}`,
        );
      }
      return source;
    }
    if (direction !== 'current') {
      return proposalPropSvg(direction, templateId);
    }
    let source = this.currentPropCache.get(templateId);
    if (!source) {
      const instance = this.props.find((prop) => prop.templateId === templateId);
      if (!instance) {
        throw new Error(`Default project is missing prop ${templateId}`);
      }
      source = composeProp(instance, this.style, AUTHORING_CANVAS);
      this.currentPropCache.set(templateId, source);
    }
    return source;
  }

  character(
    recipe: CharacterRecipe,
    facing: Facing | 'west',
    pose: Pose = 'neutral',
  ): string {
    const key = `${recipe.id}:${facing}:${pose}:${recipe.parts.accessories.join(',')}`;
    let source = this.characterCache.get(key);
    if (!source) {
      source = composeCharacter(
        recipe,
        this.style,
        facing,
        AUTHORING_CANVAS,
        'normal',
        { badge: false, pose },
      );
      this.characterCache.set(key, source);
    }
    return source;
  }

  wallTile(
    maskIndex: number,
    x: number,
    y: number,
    size: number,
    flipX = false,
  ): string {
    const key = `${maskIndex}:${flipX}`;
    let markup = this.wallCache.get(key);
    if (!markup) {
      const source = composeWallTile(
        this.wall,
        this.style,
        BLOB_CONFIGS[maskIndex],
        AUTHORING_CANVAS,
      );
      const inner = stripSvgShell(source);
      markup = flipX
        ? `<g transform="matrix(-1 0 0 1 128 0)">${inner}</g>`
        : inner;
      this.wallCache.set(key, markup);
    }
    return (
      `<svg x="${x}" y="${y}" width="${size}" height="${size}" ` +
      'viewBox="0 0 128 128" preserveAspectRatio="none" overflow="hidden">' +
      markup +
      '</svg>'
    );
  }
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
  );
  for (let column = 1; column < columns; column += 1) {
    parts.push(
      line(
        `M ${x + column * cell} ${y} V ${y + rows * cell}`,
        FLOOR_LINE,
        1,
        0.16,
      ),
    );
  }
  for (let row = 1; row < rows; row += 1) {
    parts.push(
      line(
        `M ${x} ${y + row * cell} H ${x + columns * cell}`,
        FLOOR_LINE,
        1,
        0.16,
      ),
    );
  }
}

function drawWalls(
  parts: string[],
  renderer: PropCalibrationRenderer,
  x: number,
  y: number,
  columns: number,
  rows: number,
  cell: number,
  layer: 'back' | 'front',
): void {
  if (layer === 'back') {
    parts.push(renderer.wallTile(6, x, y, cell));
    for (let column = 1; column < columns - 1; column += 1) {
      parts.push(renderer.wallTile(10, x + column * cell, y, cell));
    }
    parts.push(renderer.wallTile(12, x + (columns - 1) * cell, y, cell));
    for (let row = 1; row < rows - 1; row += 1) {
      parts.push(
        renderer.wallTile(5, x, y + row * cell, cell),
        renderer.wallTile(
          5,
          x + (columns - 1) * cell,
          y + row * cell,
          cell,
          true,
        ),
      );
    }
    return;
  }
  parts.push(renderer.wallTile(3, x, y + (rows - 1) * cell, cell));
  for (let column = 1; column < columns - 1; column += 1) {
    parts.push(
      renderer.wallTile(
        10,
        x + column * cell,
        y + (rows - 1) * cell,
        cell,
      ),
    );
  }
  parts.push(
    renderer.wallTile(
      9,
      x + (columns - 1) * cell,
      y + (rows - 1) * cell,
      cell,
    ),
  );
}

function propPlacement(
  renderer: PropCalibrationRenderer,
  direction: PropRedesignDirectionId,
  templateId: string,
  footprintX: number,
  footprintY: number,
  cell: number,
  occupancy = true,
): string {
  const template = renderer.template(templateId);
  const source = renderer.prop(direction, templateId);
  const footprintWidth = template.gridFootprint.w * cell;
  const footprintHeight = template.gridFootprint.h * cell;
  const spriteSize = cell;
  const x = footprintX + (footprintWidth - spriteSize) / 2;
  const y = template.projection === 'plan'
    ? footprintY + (footprintHeight - spriteSize) / 2
    : footprintY + footprintHeight - spriteSize * (116 / AUTHORING_CANVAS);
  const guide = occupancy
    ? (
      `<rect x="${footprintX + 3}" y="${footprintY + 3}" ` +
      `width="${footprintWidth - 6}" height="${footprintHeight - 6}" ` +
      `rx="5" fill="${OCCUPANCY}" fill-opacity=".08" stroke="${OCCUPANCY}" ` +
      'stroke-width="1.5" stroke-dasharray="6 5"/>'
    )
    : '';
  return guide + placedSvg(source, x, y, spriteSize);
}

interface AgentPlacement {
  readonly recipe: CharacterRecipe;
  readonly facing: Facing | 'west';
  readonly pose?: Pose;
  readonly x: number;
  readonly y: number;
}

function withAccessories(
  recipe: CharacterRecipe,
  accessories: readonly string[],
  idSuffix: string,
): CharacterRecipe {
  return {
    ...recipe,
    id: `${recipe.id}-${idSuffix}`,
    parts: {
      ...recipe.parts,
      accessories: [...accessories],
    },
  };
}

const JANICE_CLIPBOARD = withAccessories(
  DEFAULT_CAST[0],
  [REPRESENTATIVE_HANDHELD_ID],
  'clipboard-proof',
);

const ROOM_AGENTS: readonly AgentPlacement[] = [
  {
    recipe: JANICE_CLIPBOARD,
    facing: 'south',
    x: 2.55,
    y: 3.72,
  },
  {
    recipe: DEFAULT_CAST[1],
    facing: 'west',
    x: 4.18,
    y: 3.58,
  },
  {
    recipe: DEFAULT_CAST[2],
    facing: 'south',
    x: 5.7,
    y: 4.32,
  },
  {
    recipe: DEFAULT_CAST[3],
    facing: 'east',
    x: 5.45,
    y: 2.72,
  },
];

function agentPlacement(
  renderer: PropCalibrationRenderer,
  spec: AgentPlacement,
  roomX: number,
  roomY: number,
  cell: number,
): string {
  const frameSize = cell * CHARACTER_FRAME_CELLS;
  const source = renderer.character(
    spec.recipe,
    spec.facing,
    spec.pose ?? 'neutral',
  );
  const anchorX = roomX + spec.x * cell;
  const anchorY = roomY + spec.y * cell;
  return placedSvg(
    source,
    anchorX - frameSize / 2,
    anchorY - frameSize * 0.86,
    frameSize,
  );
}

function roomScene(
  renderer: PropCalibrationRenderer,
  direction: PropRedesignDirectionId,
  x: number,
  y: number,
  cell: number,
  crowded = false,
): string {
  const parts: string[] = [];
  const columns = 8;
  const rows = 6;
  drawGrid(parts, x, y, columns, rows, cell);
  drawWalls(parts, renderer, x, y, columns, rows, cell, 'back');

  parts.push(
    propPlacement(renderer, direction, 'desk', x + 1 * cell, y + 2 * cell, cell),
    propPlacement(renderer, direction, 'office-chair', x + 2 * cell, y + 3 * cell, cell),
    propPlacement(renderer, direction, 'filing-cabinet', x + 1 * cell, y + 1 * cell, cell),
    propPlacement(renderer, direction, 'copier', x + 3 * cell, y + 1 * cell, cell),
    propPlacement(renderer, direction, 'office-plant', x + 5.5 * cell, y + 1 * cell, cell),
  );

  const agents = crowded
    ? [
        ...ROOM_AGENTS,
        {
          recipe: DEFAULT_CAST[0],
          facing: 'east' as const,
          pose: 'walk-approach' as const,
          x: 3.25,
          y: 4.38,
        },
        {
          recipe: DEFAULT_CAST[1],
          facing: 'south' as const,
          pose: 'notice' as const,
          x: 6.35,
          y: 3.72,
        },
      ]
    : ROOM_AGENTS;
  for (const spec of agents) {
    parts.push(agentPlacement(renderer, spec, x, y, cell));
  }

  drawWalls(parts, renderer, x, y, columns, rows, cell, 'front');
  return parts.join('');
}

function interactionInset(
  renderer: PropCalibrationRenderer,
  direction: PropRedesignDirectionId,
  x: number,
  y: number,
): string {
  const parts: string[] = [];
  const cell = NORMAL_CELL;
  drawGrid(parts, x, y, 4, 3, cell);
  drawWalls(parts, renderer, x, y, 4, 3, cell, 'back');

  const actor: AgentPlacement = {
    recipe: JANICE_CLIPBOARD,
    facing: 'south',
    pose: 'neutral',
    x: 2,
    // Stand behind the desk: its foreground shell crosses the lower torso,
    // never the head. This is a proof-only overlap check, not a new runtime root.
    y: 1.65,
  };
  parts.push(
    propPlacement(
      renderer,
      direction,
      'office-chair',
      x + 1.5 * cell,
      y + 1.62 * cell,
      cell,
      false,
    ),
    agentPlacement(renderer, actor, x, y, cell),
    // Deliberate review-only overlap: the unchanged plan-projected desk is
    // drawn last to expose the approach/occlusion question before promotion.
    propPlacement(
      renderer,
      direction,
      'desk',
      x + 1 * cell,
      y + 1 * cell,
      cell,
      true,
    ),
    `<circle cx="${x + 2 * cell}" cy="${y + 2.38 * cell}" r="9" ` +
      `fill="none" stroke="${CORAL}" stroke-width="3"/>`,
    line(
      `M ${x + 2 * cell} ${y + 2.27 * cell} V ${y + 2.49 * cell} ` +
      `M ${x + 1.89 * cell} ${y + 2.38 * cell} H ${x + 2.11 * cell}`,
      CORAL,
      2,
    ),
  );
  return parts.join('');
}

function normalDirectionCard(
  parts: string[],
  renderer: PropCalibrationRenderer,
  direction: PropRedesignDirection,
  x: number,
  y: number,
  width: number,
): void {
  const roomX = x + (width - 8 * NORMAL_CELL) / 2;
  const roomY = y + 92;
  parts.push(
    panel(x, y, width, 690, direction.panelFill),
    text(x + 18, y + 30, direction.label, 18, 850, GREEN),
    text(x + 18, y + 54, direction.note, 11, 620, MUTED),
    text(
      x + width - 18,
      y + 30,
      '90 px / cell',
      11,
      760,
      CORAL,
      'end',
    ),
    roomScene(renderer, direction.id, roomX, roomY, NORMAL_CELL),
    text(
      x + 18,
      y + 646,
      'Dashed = unchanged grid occupancy · characters = production ×0.65',
      10,
      650,
      MUTED,
    ),
    text(
      x + 18,
      y + 668,
      'desk · chair · storage · copier · water · plant · clipboard',
      10,
      720,
      BLUE,
    ),
  );
}

function closeMatrix(
  parts: string[],
  renderer: PropCalibrationRenderer,
  y: number,
): void {
  const width = WIDTH - MARGIN * 2;
  const height = 640;
  const labels = ['Desk', 'Seat', 'Storage', 'Copier', 'Water', 'Plant'];
  parts.push(
    panel(MARGIN, y, width, height, PANEL_ALT),
    text(MARGIN + 22, y + 38, 'Close read · 128 px source cells', 22, 840),
    text(
      MARGIN + 430,
      y + 38,
      'No universal prop multiplier: each proposal owns its own internal envelope.',
      13,
      650,
      MUTED,
    ),
    text(
      WIDTH - MARGIN - 22,
      y + 38,
      'production characters and anchors unchanged',
      12,
      760,
      CORAL,
      'end',
    ),
  );
  const rowHeight = 142;
  const sprite = 112;
  const startX = MARGIN + 505;
  const columnGap = 154;
  PROP_REDESIGN_DIRECTIONS.forEach((direction, row) => {
    const rowY = y + 58 + row * rowHeight;
    parts.push(
      panel(
        MARGIN + 16,
        rowY,
        width - 32,
        rowHeight - 8,
        direction.panelFill,
        'none',
        9,
      ),
      text(MARGIN + 34, rowY + 34, direction.shortLabel, 14, 850, GREEN),
      text(MARGIN + 34, rowY + 58, direction.note, 10, 600, MUTED),
    );
    REPRESENTATIVE_PROP_IDS.forEach((templateId, index) => {
      const px = startX + index * columnGap;
      parts.push(
        placedSvg(
          renderer.prop(direction.id, templateId),
          px,
          rowY + 8,
          sprite,
        ),
        text(
          px + sprite / 2,
          rowY + 129,
          labels[index],
          9,
          700,
          INK,
          'middle',
        ),
      );
    });
    const charX = startX + REPRESENTATIVE_PROP_IDS.length * columnGap + 40;
    const character = renderer.character(
      JANICE_CLIPBOARD,
      'south',
      'neutral',
    );
    parts.push(
      placedSvg(character, charX, rowY + 7, sprite * CHARACTER_FRAME_CELLS),
      text(
        charX + sprite * CHARACTER_FRAME_CELLS / 2,
        rowY + 129,
        'locked character + clipboard',
        9,
        700,
        INK,
        'middle',
      ),
      line(
        `M ${charX + 190} ${rowY + 18} V ${rowY + 119}`,
        RULE,
        1.5,
      ),
      text(
        charX + 214,
        rowY + 40,
        '128u canvas',
        10,
        700,
        MUTED,
      ),
      text(
        charX + 214,
        rowY + 63,
        '112u wall datum',
        10,
        700,
        MUTED,
      ),
      text(
        charX + 214,
        rowY + 86,
        '0.65 character visual',
        10,
        700,
        MUTED,
      ),
      text(
        charX + 214,
        rowY + 109,
        'prop envelope: per object',
        10,
        760,
        CORAL,
      ),
    );
  });
}

function stressCard(
  parts: string[],
  renderer: PropCalibrationRenderer,
  direction: PropRedesignDirection,
  x: number,
  y: number,
  width: number,
): void {
  const farX = x + 28;
  const farY = y + 62;
  const insetX = x + width - 4 * NORMAL_CELL - 28;
  const insetY = y + 62;
  parts.push(
    panel(x, y, width, 760, direction.panelFill),
    text(x + 18, y + 30, direction.shortLabel, 16, 850, GREEN),
    text(x + 18, y + 50, 'FAR CROWD · 40 px/cell', 10, 760, CORAL),
    roomScene(renderer, direction.id, farX, farY, FAR_CELL, true),
    text(
      insetX,
      y + 50,
      'DESK OCCLUSION + APPROACH · 90 px/cell',
      10,
      760,
      CORAL,
    ),
    interactionInset(renderer, direction.id, insetX, insetY),
    text(
      x + 28,
      y + 330,
      '6-person crowd · five retained prop roles · full wall context',
      10,
      650,
      MUTED,
    ),
    text(
      insetX,
      y + 350,
      'Coral cross = existing interaction approach/root concept; metadata unchanged.',
      9,
      650,
      MUTED,
    ),
  );
  direction.evaluation.forEach((note, index) => {
    parts.push(
      `<circle cx="${x + 32}" cy="${y + 428 + index * 56}" r="4" fill="${index === 0 ? GREEN : CORAL}"/>`,
      text(
        x + 46,
        y + 434 + index * 56,
        note,
        11,
        index === 0 ? 720 : 620,
        index === 0 ? INK : MUTED,
      ),
    );
  });
  parts.push(
    line(`M ${x + 24} ${y + 608} H ${x + width - 24}`, RULE, 1),
    text(
      x + 24,
      y + 638,
      direction.id === 'current'
        ? 'Control only · no redesign conclusion'
        : 'Candidate only · visual approval would authorize a separate source-art slice',
      10,
      760,
      direction.id === 'current' ? MUTED : CORAL,
    ),
    text(
      x + 24,
      y + 666,
      'Held: footprint · nav · collision · pivot · projection · anchor · export · schema',
      10,
      700,
      BLUE,
    ),
    text(
      x + 24,
      y + 700,
      'Not evaluated here: Unity importer, runtime registration, or production atlas.',
      10,
      650,
      MUTED,
    ),
  );
}

function calibrationSheet(renderer: PropCalibrationRenderer): string {
  const parts: string[] = [
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAGE}"/>`,
    text(MARGIN, 46, 'QuotaCo prop redesign · calibration proof v1', 30, 870),
    text(
      MARGIN,
      76,
      'REVIEW ONLY · completed production characters · accepted equal-height walls · literal gameplay ratios',
      14,
      780,
      CORAL,
    ),
    text(
      WIDTH - MARGIN,
      44,
      `${PROP_TEMPLATES.length} prop templates · ${HANDHELD_ACCESSORY_IDS.length} character accessories`,
      13,
      760,
      GREEN,
      'end',
    ),
    text(
      WIDTH - MARGIN,
      70,
      `128u authoring · 112u wall · character ×${CHARACTER_VISUAL_SCALE} · schema ${CURRENT_SCHEMA_VERSION}`,
      12,
      650,
      MUTED,
      'end',
    ),
  ];

  const cardWidth = (WIDTH - MARGIN * 2 - GAP * 3) / 4;
  PROP_REDESIGN_DIRECTIONS.forEach((direction, index) => {
    normalDirectionCard(
      parts,
      renderer,
      direction,
      MARGIN + index * (cardWidth + GAP),
      96,
      cardWidth,
    );
  });
  closeMatrix(parts, renderer, 805);
  PROP_REDESIGN_DIRECTIONS.forEach((direction, index) => {
    stressCard(
      parts,
      renderer,
      direction,
      MARGIN + index * (cardWidth + GAP),
      1465,
      cardWidth,
    );
  });
  parts.push(
    panel(MARGIN, 2242, WIDTH - MARGIN * 2, 196, '#DAD4C6', 'none', 10),
    text(MARGIN + 22, 2278, 'Approval boundary', 17, 840, GREEN),
    text(
      MARGIN + 22,
      2308,
      'Choose none, one direction, or a bounded hybrid. Approval does not promote these pixels.',
      13,
      680,
      INK,
    ),
    text(
      MARGIN + 22,
      2338,
      'Any next slice must preserve the existing template identity and gameplay geometry unless separately authorized.',
      12,
      650,
      MUTED,
    ),
    text(
      MARGIN + 22,
      2368,
      'No source prop template, default instance, facility catalog, CONTRACT, schema, exporter, atlas, or Unity registration is changed by this proof.',
      12,
      780,
      CORAL,
    ),
    text(
      WIDTH - MARGIN - 22,
      2308,
      'VISUAL DECISION ONLY',
      15,
      900,
      CORAL,
      'end',
    ),
    text(
      WIDTH - MARGIN - 22,
      2338,
      'close · normal · far · crowd · wall · occlusion · interaction',
      11,
      700,
      BLUE,
      'end',
    ),
  );

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" ` +
    `viewBox="0 0 ${WIDTH} ${HEIGHT}">${parts.join('')}</svg>`
  );
}

const HYBRID_HEIGHT = 2300;

function hybridCloseComparison(
  parts: string[],
  renderer: PropCalibrationRenderer,
  y: number,
): void {
  const width = WIDTH - MARGIN * 2;
  const columnWidth = width / REPRESENTATIVE_PROP_IDS.length;
  parts.push(
    panel(MARGIN, y, width, 430, PANEL_ALT),
    text(MARGIN + 22, y + 38, 'Close read · current versus perspective-locked hybrid', 22, 840),
    text(
      WIDTH - MARGIN - 22,
      y + 38,
      '128 px source cells · object-specific envelopes · no universal prop multiplier',
      12,
      720,
      CORAL,
      'end',
    ),
  );
  REPRESENTATIVE_PROP_IDS.forEach((propId, index) => {
    const decision = HYBRID_PROP_DECISIONS[index];
    const columnX = MARGIN + index * columnWidth;
    const center = columnX + columnWidth / 2;
    parts.push(
      index > 0
        ? line(`M ${columnX} ${y + 58} V ${y + 405}`, RULE, 1)
        : '',
      text(
        center,
        y + 78,
        `${decision.role.toUpperCase()} · ${decision.projection.toUpperCase()}`,
        12,
        820,
        GREEN,
        'middle',
      ),
      placedSvg(renderer.prop('current', propId), center - 142, y + 100, 120),
      placedSvg(renderer.prop('hybrid', propId), center + 22, y + 100, 120),
      text(center - 82, y + 238, 'CURRENT', 10, 700, MUTED, 'middle'),
      text(center + 82, y + 238, 'HYBRID', 10, 820, CORAL, 'middle'),
      text(center, y + 268, propId, 11, 760, BLUE, 'middle'),
      wrappedText(
        columnX + 22,
        y + 302,
        decision.decision,
        48,
        19,
        11,
        600,
        MUTED,
      ),
    );
  });
}

function hybridDecisionSheet(renderer: PropCalibrationRenderer): string {
  const parts: string[] = [
    `<rect width="${WIDTH}" height="${HYBRID_HEIGHT}" fill="${PAGE}"/>`,
    text(MARGIN, 46, 'QuotaCo prop redesign · SVG-backed source proof v5', 30, 870),
    text(
      MARGIN,
      76,
      'REVIEW ONLY · live plan/elevation projections preserved · five standalone editable SVG candidates · no production registration',
      14,
      780,
      CORAL,
    ),
    text(
      WIDTH - MARGIN,
      44,
      'Catalog body · Service function · Used personalization',
      14,
      800,
      GREEN,
      'end',
    ),
    text(
      WIDTH - MARGIN,
      70,
      `128u authoring · 112u wall · character ×${CHARACTER_VISUAL_SCALE} · schema ${CURRENT_SCHEMA_VERSION}`,
      12,
      650,
      MUTED,
      'end',
    ),
    panel(MARGIN, 100, WIDTH - MARGIN * 2, 160, '#DAD4C6'),
  ];

  const grammar = [
    {
      title: '1 · CATALOG SHELL OWNS THE BODY',
      body:
        'Cream rollover, deep-green chassis, broad radii, low institutional mass. The silhouette must survive before labels, paper, or wear.',
      color: GREEN,
    },
    {
      title: '2 · SERVICE SPINE EXPLAINS FUNCTION',
      body:
        'Dark access bays and asymmetric modules appear only at feed, output, refill, control, drawer, or maintenance surfaces.',
      color: BLUE,
    },
    {
      title: '3 · USE SOFTENS; IT DOES NOT REBUILD',
      body:
        'Notes, repairs, upholstery wear, papers, and plants remain optional overlays that disappear cleanly at 40 px.',
      color: CORAL,
    },
  ] as const;
  grammar.forEach((item, index) => {
    const columnX = MARGIN + 28 + index * 1090;
    parts.push(
      index > 0
        ? line(`M ${columnX - 28} 120 V 240`, RULE, 1)
        : '',
      text(columnX, 140, item.title, 14, 860, item.color),
      wrappedText(columnX, 174, item.body, 115, 22, 12, 620, MUTED),
    );
  });

  const roomPanelY = 285;
  const roomY = roomPanelY + 62;
  const currentPanelX = MARGIN;
  const hybridPanelX = 804;
  const decisionPanelX = 1572;
  parts.push(
    panel(currentPanelX, roomPanelY, 748, 625, PANEL),
    text(currentPanelX + 18, roomPanelY + 32, 'CONTROL · CURRENT ROOM', 16, 840, GREEN),
    text(currentPanelX + 730, roomPanelY + 32, '90 px / cell', 11, 740, CORAL, 'end'),
    roomScene(renderer, 'current', currentPanelX + 14, roomY, NORMAL_CELL),
    panel(hybridPanelX, roomPanelY, 748, 625, GREEN_SOFT),
    text(hybridPanelX + 18, roomPanelY + 32, 'SELECTED · WORKHORSE HYBRID', 16, 860, GREEN),
    text(hybridPanelX + 730, roomPanelY + 32, '90 px / cell', 11, 740, CORAL, 'end'),
    roomScene(renderer, 'hybrid', hybridPanelX + 14, roomY, NORMAL_CELL),
    panel(decisionPanelX, roomPanelY, WIDTH - MARGIN - decisionPanelX, 625, PANEL_ALT),
    text(decisionPanelX + 22, roomPanelY + 36, 'Per-prop consolidation', 20, 850, GREEN),
    text(
      WIDTH - MARGIN - 22,
      roomPanelY + 36,
      'visual design only',
      12,
      760,
      CORAL,
      'end',
    ),
  );
  HYBRID_PROP_DECISIONS.forEach((decision, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = decisionPanelX + 28 + column * 884;
    const y = roomPanelY + 88 + row * 166;
    parts.push(
      `<circle cx="${x + 5}" cy="${y - 5}" r="5" fill="${row === 0 ? GREEN : CORAL}"/>`,
      text(
        x + 20,
        y,
        `${decision.role} · ${decision.propId} · ${decision.projection}`,
        14,
        820,
        BLUE,
      ),
      wrappedText(x + 20, y + 30, decision.decision, 86, 22, 12, 610, MUTED),
    );
  });

  hybridCloseComparison(parts, renderer, 930);

  const stressY = 1380;
  parts.push(
    panel(MARGIN, stressY, WIDTH - MARGIN * 2, 690, PANEL),
    text(MARGIN + 22, stressY + 38, 'Gameplay stress pass', 22, 850, GREEN),
    text(MARGIN + 22, stressY + 62, 'CURRENT · 6-PERSON CROWD · 40 px/cell', 10, 760, CORAL),
    roomScene(renderer, 'current', MARGIN + 22, stressY + 82, FAR_CELL, true),
    text(MARGIN + 382, stressY + 62, 'HYBRID · 6-PERSON CROWD · 40 px/cell', 10, 760, CORAL),
    roomScene(renderer, 'hybrid', MARGIN + 382, stressY + 82, FAR_CELL, true),
    text(MARGIN + 742, stressY + 62, 'HYBRID · DESK OCCLUSION + APPROACH · 90 px/cell', 10, 760, CORAL),
    interactionInset(renderer, 'hybrid', MARGIN + 742, stressY + 82),
    panel(MARGIN + 1130, stressY + 66, 2176, 558, GREEN_SOFT, 'none', 10),
    text(MARGIN + 1160, stressY + 106, 'Selected-family read', 18, 850, GREEN),
  );
  PROP_REDESIGN_HYBRID_DIRECTION.evaluation.forEach((note, index) => {
    parts.push(
      `<circle cx="${MARGIN + 1170}" cy="${stressY + 154 + index * 60}" r="5" fill="${index === 0 ? GREEN : CORAL}"/>`,
      wrappedText(
        MARGIN + 1190,
        stressY + 160 + index * 60,
        note,
        150,
        20,
        13,
        index === 0 ? 740 : 620,
        index === 0 ? INK : MUTED,
      ),
    );
  });
  parts.push(
    line(`M ${MARGIN + 1160} ${stressY + 360} H ${WIDTH - MARGIN - 32}`, RULE, 1),
    text(MARGIN + 1160, stressY + 394, 'Held throughout this proof', 14, 820, BLUE),
    text(
      MARGIN + 1160,
      stressY + 426,
      'character silhouettes · heads · hair · garments · anchors · 0.65 visual scale',
      12,
      650,
      MUTED,
    ),
    text(
      MARGIN + 1160,
      stressY + 452,
      '128-unit authoring canvas · 112-unit walls · gameplay roots and footprints',
      12,
      650,
      MUTED,
    ),
    text(
      MARGIN + 1160,
      stressY + 478,
      'prop footprint · pivot · navigation · collision · projection · interaction metadata',
      12,
      650,
      MUTED,
    ),
    text(
      MARGIN + 1160,
      stressY + 504,
      'CONTRACT · schema · exporter · facility catalog · atlas · Unity registration',
      12,
      650,
      MUTED,
    ),
    text(
      MARGIN + 1160,
      stressY + 548,
      'Source status: five standalone artist-editable SVG files loaded directly into this proof; production templates remain untouched.',
      12,
      790,
      CORAL,
    ),
  );

  parts.push(
    panel(MARGIN, 2090, WIDTH - MARGIN * 2, 170, '#DAD4C6', 'none', 10),
    text(MARGIN + 22, 2128, 'Next approval boundary', 18, 850, GREEN),
    text(
      MARGIN + 22,
      2160,
      'Approve the SVG-backed source fidelity and flag any prop-specific correction. Production wiring remains a separate explicit slice.',
      13,
      690,
      INK,
    ),
    text(
      MARGIN + 22,
      2192,
      'After each SVG is reviewed: wire that asset deliberately, rerun literal-scale gates, then verify export and Unity separately.',
      12,
      650,
      MUTED,
    ),
    text(
      WIDTH - MARGIN - 22,
      2134,
      'NO PRODUCTION PROMOTION',
      15,
      900,
      CORAL,
      'end',
    ),
    text(
      WIDTH - MARGIN - 22,
      2170,
      'close · normal · far · crowd · wall · occlusion · interaction',
      11,
      720,
      BLUE,
      'end',
    ),
  );

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HYBRID_HEIGHT}" ` +
    `viewBox="0 0 ${WIDTH} ${HYBRID_HEIGHT}">${parts.join('')}</svg>`
  );
}

export function validateHybridPropRedesignCoverage(): {
  propCount: number;
  direction: PropRedesignDirectionId;
} {
  const decisionIds = HYBRID_PROP_DECISIONS.map(({ propId }) => propId);
  if (
    decisionIds.length !== REPRESENTATIVE_PROP_IDS.length ||
    new Set(decisionIds).size !== decisionIds.length ||
    decisionIds.some((propId, index) => propId !== REPRESENTATIVE_PROP_IDS[index])
  ) {
    throw new Error('Hybrid prop decisions drifted from the representative proof set');
  }
  return {
    propCount: decisionIds.length,
    direction: PROP_REDESIGN_HYBRID_DIRECTION.id,
  };
}

export function validatePropRedesignInventoryCoverage(): {
  propCount: number;
  accessoryCount: number;
} {
  const classifiedProps = PROP_REDESIGN_INVENTORY_GROUPS.flatMap(
    ({ propIds }) => propIds,
  );
  const duplicates = classifiedProps.filter(
    (id, index) => classifiedProps.indexOf(id) !== index,
  );
  if (duplicates.length > 0) {
    throw new Error(`Duplicate prop inventory entries: ${[...new Set(duplicates)].join(', ')}`);
  }
  const actualProps = PROP_TEMPLATES.map(({ id }) => id);
  const missing = actualProps.filter((id) => !classifiedProps.includes(id));
  const extra = classifiedProps.filter((id) => !actualProps.includes(id));
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      `Prop inventory coverage drift; missing=[${missing.join(', ')}] extra=[${extra.join(', ')}]`,
    );
  }

  const actualAccessories = PART_LIBRARY
    .filter(({ slot }) => slot === 'accessory')
    .map(({ id }) => id);
  const classifiedAccessories = PROP_REDESIGN_INVENTORY_GROUPS.flatMap(
    ({ accessoryIds = [] }) => accessoryIds,
  );
  const missingAccessories = actualAccessories.filter(
    (id) => !classifiedAccessories.includes(id),
  );
  const extraAccessories = classifiedAccessories.filter(
    (id) => !actualAccessories.includes(id),
  );
  if (missingAccessories.length > 0 || extraAccessories.length > 0) {
    throw new Error(
      'Accessory inventory coverage drift; ' +
      `missing=[${missingAccessories.join(', ')}] ` +
      `extra=[${extraAccessories.join(', ')}]`,
    );
  }
  return {
    propCount: classifiedProps.length,
    accessoryCount: classifiedAccessories.length,
  };
}

function inventoryMarkdown(): string {
  validatePropRedesignInventoryCoverage();
  const facilityByProp = new Map(
    facilityCatalogJson().facilities.map((entry) => [entry.propId, entry]),
  );
  const accessoryById = new Map(
    PART_LIBRARY
      .filter(({ slot }) => slot === 'accessory')
      .map((part) => [part.id, part]),
  );
  const lines: string[] = [
    '# QuotaCo prop redesign inventory v1',
    '',
    'Status: **review-only inventory; no production art or integration change**',
    '',
    `Live registry baseline: ${PROP_TEMPLATES.length} prop templates + ` +
      `${HANDHELD_ACCESSORY_IDS.length} character accessories; ` +
      `schema ${CURRENT_SCHEMA_VERSION}; 128-unit authoring canvas; ` +
      `112-unit wall datum; Unity character visual scale 0.65.`,
    '',
    'The six groups below are a redesign review lens, not a new export taxonomy. ' +
      'Every current ID keeps its existing placement, projection, footprint, pivot, ' +
      'navigation/collision behavior, and interaction metadata during review.',
    '',
  ];
  for (const group of PROP_REDESIGN_INVENTORY_GROUPS) {
    lines.push(
      `## ${group.label}`,
      '',
      group.note,
      '',
      '| Source | ID | Label | Placement / projection | Grid footprint | Coupling |',
      '| --- | --- | --- | --- | --- | --- |',
    );
    for (const accessoryId of group.accessoryIds ?? []) {
      const accessory = accessoryById.get(accessoryId);
      if (!accessory) throw new Error(`Missing accessory ${accessoryId}`);
      lines.push(
        `| character part | \`${accessory.id}\` | ${accessory.label} | ` +
          `rig-relative / ${accessory.anchor} | — | ` +
          `${accessory.handAttachmentRole ?? 'character anchor'} |`,
      );
    }
    for (const propId of group.propIds) {
      const template = PROP_TEMPLATES.find(({ id }) => id === propId);
      if (!template) throw new Error(`Missing template ${propId}`);
      const facility = facilityByProp.get(propId);
      const coupling = facility
        ? (
          `${facility.blocksWalk ? 'blocks walk' : 'non-blocking'}` +
          (facility.isInteractionAnchor
            ? `; anchor \`${facility.interactionType}\``
            : '')
        )
        : 'not in placeable facility catalog';
      lines.push(
        `| prop template | \`${template.id}\` | ${template.label} | ` +
          `${template.placement ?? 'floor'} / ${template.projection} | ` +
          `${template.gridFootprint.w}×${template.gridFootprint.h} | ${coupling} |`,
      );
    }
    lines.push('');
  }
  lines.push(
    '## First proof selection',
    '',
    '- Work surface: `desk`',
    '- Seating: `office-chair`',
    '- Storage: `filing-cabinet`',
    '- Printer/copier: `copier`',
    '- Plant: `office-plant`',
    '- Handheld: `acc-clipboard` on the locked character rig',
    '',
    'These six roles are the calibration carriers only. A selected direction ' +
      'would still need a later family-by-family production plan and explicit promotion.',
    '',
  );
  return `${lines.join('\n')}\n`;
}

interface AlphaBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

function alphaBounds(svg: string): AlphaBounds {
  const png = PNG.sync.read(
    new Resvg(svg, { fitTo: { mode: 'width', value: AUTHORING_CANVAS } })
      .render()
      .asPng(),
  );
  let minX = png.width;
  let minY = png.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      if (png.data[(y * png.width + x) * 4 + 3] === 0) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) {
    throw new Error('Rendered proof prop is empty');
  }
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

async function protectedSurfaceHashes(): Promise<Record<string, string>> {
  const entries = await Promise.all(
    PROTECTED_SURFACES.map(async (file) => {
      const bytes = await readFile(path.resolve(file));
      return [file, createHash('sha256').update(bytes).digest('hex')] as const;
    }),
  );
  return Object.fromEntries(entries);
}

async function loadHybridPropSvgSources(): Promise<ReadonlyMap<string, string>> {
  const entries = await Promise.all(
    HYBRID_PROP_SOURCE_FILES.map(async (definition) => {
      const source = await readFile(path.resolve(definition.path), 'utf8');
      if (
        !source.includes('viewBox="0 0 128 128"') ||
        !source.includes('width="128"') ||
        !source.includes('height="128"')
      ) {
        throw new Error(
          `${definition.path} must use the 128-unit prop authoring canvas`,
        );
      }
      if (
        !source.includes(`data-prop-id="${definition.propId}"`) ||
        !source.includes(`data-projection="${definition.projection}"`)
      ) {
        throw new Error(
          `${definition.path} is missing its prop identity or projection lock`,
        );
      }
      if (!source.includes('<title>') || !source.includes('<desc>')) {
        throw new Error(`${definition.path} needs an editable-source title and description`);
      }
      for (const group of definition.requiredGroups) {
        if (!source.includes(`<g id="${group}">`)) {
          throw new Error(`${definition.path} is missing semantic group ${group}`);
        }
      }
      if (/<(?:script|image|foreignObject)\b|(?:href|xlink:href)=/i.test(source)) {
        throw new Error(`${definition.path} contains an external or unsafe SVG element`);
      }
      const ids = [...source.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
      if (new Set(ids).size !== ids.length) {
        throw new Error(`${definition.path} contains duplicate SVG ids`);
      }
      alphaBounds(source);
      return [definition.propId, source] as const;
    }),
  );
  return new Map(entries);
}

export async function validateHybridPropSvgSources(): Promise<{
  sourceCount: number;
  sources: Array<{
    propId: string;
    projection: 'plan' | 'elevation';
    path: string;
    sha256: string;
  }>;
}> {
  const sources = await loadHybridPropSvgSources();
  const sourceRecords = HYBRID_PROP_SOURCE_FILES.map((definition, index) => {
    const decision = HYBRID_PROP_DECISIONS[index];
    if (
      decision.propId !== definition.propId ||
      decision.projection !== definition.projection
    ) {
      throw new Error(
        `Hybrid SVG source manifest drift for ${definition.propId}`,
      );
    }
    const source = sources.get(definition.propId);
    if (!source) {
      throw new Error(`Hybrid SVG source not loaded for ${definition.propId}`);
    }
    return {
      propId: definition.propId,
      projection: definition.projection,
      path: definition.path,
      sha256: createHash('sha256').update(source).digest('hex'),
    };
  });
  return {
    sourceCount: sourceRecords.length,
    sources: sourceRecords,
  };
}

async function metrics(renderer: PropCalibrationRenderer): Promise<object> {
  const coverage = validatePropRedesignInventoryCoverage();
  const facilities = new Map(
    facilityCatalogJson().facilities.map((entry) => [entry.propId, entry]),
  );
  const visualBounds = Object.fromEntries(
    PROP_REDESIGN_DIRECTIONS.map((direction) => [
      direction.id,
      Object.fromEntries(
        REPRESENTATIVE_PROP_IDS.map((propId) => [
          propId,
          alphaBounds(renderer.prop(direction.id, propId)),
        ]),
      ),
    ]),
  );
  return {
    status: 'review-only',
    baseline: {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      authoringCanvas: AUTHORING_CANVAS,
      wallDatum: WALL_DATUM,
      normalCellPixels: NORMAL_CELL,
      farCellPixels: FAR_CELL,
      characterVisualScale: CHARACTER_VISUAL_SCALE,
      legacyCharacterFrameCells: LEGACY_CHARACTER_FRAME_CELLS,
      installedCharacterFrameCells: CHARACTER_FRAME_CELLS,
      propVisualMultiplier: null,
      note:
        'No universal prop multiplier is proposed; each candidate uses object-specific geometry inside the existing 128-unit frame.',
    },
    inventory: {
      ...coverage,
      groups: PROP_REDESIGN_INVENTORY_GROUPS.map((group) => ({
        id: group.id,
        label: group.label,
        propCount: group.propIds.length,
        accessoryCount: group.accessoryIds?.length ?? 0,
      })),
    },
    representativeSet: {
      props: REPRESENTATIVE_PROP_IDS.map((propId) => ({
        propId,
        template: PROP_TEMPLATES.find(({ id }) => id === propId),
        facility: facilities.get(propId) ?? null,
      })),
      handheld: REPRESENTATIVE_HANDHELD_ID,
    },
    directions: PROP_REDESIGN_DIRECTIONS,
    visualBounds,
    protectedSurfaceHashes: await protectedSurfaceHashes(),
    boundaries: {
      character: [
        'accepted silhouettes, heads, hair, garments, and anchors unchanged',
        '0.65 Unity visual scale unchanged',
        '128-unit authoring canvas unchanged',
        'gameplay roots and footprints unchanged',
      ],
      world: [
        '112-unit accepted wall datum unchanged',
        'prop grid footprints, pivots, navigation, collision, and interaction anchors unchanged',
      ],
      integration: [
        'no production prop registration',
        'no exporter, CONTRACT, schema, atlas, or Unity integration change',
      ],
    },
  };
}

function hybridDecisionMarkdown(): string {
  validateHybridPropRedesignCoverage();
  return [
    '# QuotaCo prop redesign SVG-backed hybrid v5',
    '',
    'Status: **standalone artist-editable SVG candidate sources; not production-registered**',
    '',
    'The selected family combines Catalog Shell bodies, Service Spine functional surfaces, ' +
      'and Used Shell personalization. This document does not authorize production registration.',
    '',
    '## Shared grammar',
    '',
    '- Catalog Shell owns the silhouette: cream rollover, deep-green chassis, broad radii, and low institutional mass.',
    '- Service Spine appears only where it explains feed, output, refill, controls, drawers, or maintenance.',
    '- Used Shell details are optional overlays: wear, notes, repairs, papers, upholstery, and plants must disappear cleanly at far zoom.',
    '- Each prop preserves its live authoring projection: desk and chair remain plan-projected; storage, copier, water, and plant remain elevation-projected.',
    '- Every prop keeps its existing template identity, grid footprint, pivot, placement, projection, navigation/collision behavior, and interaction metadata.',
    '- There is no universal prop scale multiplier; each object is calibrated inside the unchanged 128-unit authoring frame.',
    '',
    '## Representative decisions',
    '',
    '| Role | Prop | Projection | Consolidated decision |',
    '| --- | --- | --- | --- |',
    ...HYBRID_PROP_DECISIONS.map(
      ({ role, propId, projection, decision }) =>
        `| ${role} | \`${propId}\` | ${projection} | ${decision} |`,
    ),
    '',
    '## Artist-editable source workflow after approval',
    '',
    '1. Approve or correct each representative design in this proof.',
    '2. Create one genuine, hand-editable SVG source for the accepted prop.',
    '3. Review that SVG at close, normal, far, crowd, wall, occlusion, and interaction scales.',
    '4. Wire the accepted SVG deliberately into Terrarium while preserving the existing gameplay contract.',
    '5. Verify the baked atlas and Unity registration as a separate integration step.',
    '',
    'The five retained standalone prop SVG sources exist under `assets/props/quota-co-workhorse-v1/`. No production prop template, exporter, CONTRACT, schema, atlas, or Unity registration is changed by v5.',
    '',
  ].join('\n');
}

async function hybridMetrics(renderer: PropCalibrationRenderer): Promise<object> {
  validateHybridPropRedesignCoverage();
  const sourceValidation = await validateHybridPropSvgSources();
  return {
    status: 'review-only',
    sourceStatus:
      'five standalone artist-editable SVG candidate sources loaded directly by the proof; production registration deferred',
    sourceValidation,
    baseline: {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      authoringCanvas: AUTHORING_CANVAS,
      wallDatum: WALL_DATUM,
      normalCellPixels: NORMAL_CELL,
      farCellPixels: FAR_CELL,
      characterVisualScale: CHARACTER_VISUAL_SCALE,
      propVisualMultiplier: null,
    },
    direction: PROP_REDESIGN_HYBRID_DIRECTION,
    decisions: HYBRID_PROP_DECISIONS,
    projectionLocks: Object.fromEntries(
      HYBRID_PROP_DECISIONS.map(({ propId, projection }) => [
        propId,
        projection,
      ]),
    ),
    visualBounds: {
      current: Object.fromEntries(
        REPRESENTATIVE_PROP_IDS.map((propId) => [
          propId,
          alphaBounds(renderer.prop('current', propId)),
        ]),
      ),
      hybrid: Object.fromEntries(
        REPRESENTATIVE_PROP_IDS.map((propId) => [
          propId,
          alphaBounds(renderer.prop('hybrid', propId)),
        ]),
      ),
    },
    protectedSurfaceHashes: await protectedSurfaceHashes(),
    boundaries: {
      character:
        'accepted characters, anchors, 0.65 visual scale, roots, and footprints unchanged',
      world:
        '112-unit walls plus prop footprints, pivots, navigation, collision, projection, and interaction metadata unchanged',
      integration:
        'standalone candidate SVG sources added; no production registration, exporter, CONTRACT, schema, atlas, or Unity change',
    },
  };
}

const PRODUCTION_VALIDATION_HEIGHT = 1790;

function productionCloseComparison(
  parts: string[],
  renderer: PropCalibrationRenderer,
  y: number,
): void {
  const width = WIDTH - MARGIN * 2;
  const columnWidth = width / REPRESENTATIVE_PROP_IDS.length;
  parts.push(
    panel(MARGIN, y, width, 300, PANEL_ALT),
    text(MARGIN + 22, y + 38, 'Standalone SVG source versus production compositor', 22, 840),
    text(
      WIDTH - MARGIN - 22,
      y + 38,
      '128 px cells · source shadow omitted · template footprint and global outline retained',
      12,
      720,
      CORAL,
      'end',
    ),
  );
  REPRESENTATIVE_PROP_IDS.forEach((propId, index) => {
    const decision = HYBRID_PROP_DECISIONS[index];
    const columnX = MARGIN + index * columnWidth;
    const center = columnX + columnWidth / 2;
    parts.push(
      index > 0 ? line(`M ${columnX} ${y + 58} V ${y + 276}`, RULE, 1) : '',
      text(
        center,
        y + 80,
        `${decision.role.toUpperCase()} · ${decision.projection.toUpperCase()}`,
        11,
        820,
        GREEN,
        'middle',
      ),
      placedSvg(renderer.prop('hybrid', propId), center - 142, y + 96, 120),
      placedSvg(renderer.prop('current', propId), center + 22, y + 96, 120),
      text(center - 82, y + 238, 'SOURCE SVG', 10, 700, MUTED, 'middle'),
      text(center + 82, y + 238, 'PRODUCTION', 10, 820, CORAL, 'middle'),
      text(center, y + 268, propId, 11, 760, BLUE, 'middle'),
    );
  });
}

function productionValidationSheet(renderer: PropCalibrationRenderer): string {
  const parts: string[] = [
    `<rect width="${WIDTH}" height="${PRODUCTION_VALIDATION_HEIGHT}" fill="${PAGE}"/>`,
    text(MARGIN, 46, 'QuotaCo workhorse props · production wiring validation v6', 30, 870),
    text(
      MARGIN,
      76,
      'TERRARIUM PRODUCTION COMPOSITOR · canonical SVG sources · existing template and export identities',
      14,
      780,
      GREEN,
    ),
    text(
      WIDTH - MARGIN,
      44,
      `128u authoring · 112u wall · character ×${CHARACTER_VISUAL_SCALE} · schema ${CURRENT_SCHEMA_VERSION}`,
      12,
      690,
      MUTED,
      'end',
    ),
    text(
      WIDTH - MARGIN,
      70,
      'Uncommitted · Unity bundle import and Play Mode smoke not performed',
      12,
      760,
      CORAL,
      'end',
    ),
  ];

  productionCloseComparison(parts, renderer, 100);

  const roomPanelY = 425;
  const roomY = roomPanelY + 62;
  const sourcePanelX = MARGIN;
  const productionPanelX = 804;
  const contractPanelX = 1572;
  parts.push(
    panel(sourcePanelX, roomPanelY, 748, 625, PANEL),
    text(sourcePanelX + 18, roomPanelY + 32, 'SOURCE ART · LITERAL ROOM SCALE', 16, 840, GREEN),
    text(sourcePanelX + 730, roomPanelY + 32, '90 px / cell', 11, 740, CORAL, 'end'),
    roomScene(renderer, 'hybrid', sourcePanelX + 14, roomY, NORMAL_CELL),
    panel(productionPanelX, roomPanelY, 748, 625, GREEN_SOFT),
    text(productionPanelX + 18, roomPanelY + 32, 'PRODUCTION COMPOSITOR · LITERAL ROOM SCALE', 16, 860, GREEN),
    text(productionPanelX + 730, roomPanelY + 32, '90 px / cell', 11, 740, CORAL, 'end'),
    roomScene(renderer, 'current', productionPanelX + 14, roomY, NORMAL_CELL),
    panel(contractPanelX, roomPanelY, WIDTH - MARGIN - contractPanelX, 625, PANEL_ALT),
    text(contractPanelX + 24, roomPanelY + 40, 'Held production contracts', 21, 860, GREEN),
  );

  const held = [
    'Five existing template IDs and picker positions',
    'Plan/elevation projection per accepted source',
    'Grid footprints, pivots, navigation, and collision',
    'Contact-shadow footprints and interaction anchors',
    'Existing parameter keys and legal ranges',
    'Primary, secondary, and accent palette channels',
    `Schema ${CURRENT_SCHEMA_VERSION}, exporter cells, atlas registration`,
    'Accepted characters, 0.65 scale, 128 canvas, 112 walls',
  ];
  held.forEach((value, index) => {
    const x = contractPanelX + 42 + (index % 2) * 850;
    const y = roomPanelY + 100 + Math.floor(index / 2) * 105;
    parts.push(
      `<circle cx="${x}" cy="${y - 5}" r="6" fill="${index < 6 ? GREEN : CORAL}"/>`,
      wrappedText(x + 20, y, value, 74, 21, 13, 660, index < 6 ? INK : MUTED),
    );
  });
  parts.push(
    line(`M ${contractPanelX + 28} ${roomPanelY + 530} H ${WIDTH - MARGIN - 28}`, RULE, 1),
    text(contractPanelX + 28, roomPanelY + 565, 'Art-source seam', 14, 840, BLUE),
    wrappedText(
      contractPanelX + 28,
      roomPanelY + 596,
      'SVG primitives compile into deterministic variants. The browser and exported bundle receive ShapeSpecs and baked atlases, not an SVG parser or procedural prop generator.',
      158,
      21,
      12,
      650,
      MUTED,
    ),
  );

  const stressY = 1075;
  parts.push(
    panel(MARGIN, stressY, WIDTH - MARGIN * 2, 650, PANEL),
    text(MARGIN + 22, stressY + 38, 'Actual-production stress pass', 22, 850, GREEN),
    text(MARGIN + 22, stressY + 64, '6-PERSON CROWD · WALL CONTEXT · 40 px/CELL', 10, 760, CORAL),
    roomScene(renderer, 'current', MARGIN + 22, stressY + 84, FAR_CELL, true),
    text(MARGIN + 382, stressY + 64, 'DESK OCCLUSION + CHARACTER APPROACH · 90 px/CELL', 10, 760, CORAL),
    interactionInset(renderer, 'current', MARGIN + 382, stressY + 84),
    panel(MARGIN + 770, stressY + 70, 2536, 520, GREEN_SOFT, 'none', 10),
    text(MARGIN + 804, stressY + 112, 'Observed promotion boundary', 19, 860, GREEN),
    wrappedText(
      MARGIN + 804,
      stressY + 152,
      'Appearance now resolves from genuine SVG source files through a checked build-time importer. Default palettes reproduce the approved family; existing per-instance palettes still recolor the three declared material channels.',
      186,
      24,
      13,
      670,
      INK,
    ),
    text(MARGIN + 804, stressY + 252, 'Not changed', 14, 840, BLUE),
    wrappedText(
      MARGIN + 804,
      stressY + 286,
      'CONTRACT.md · project schema · exporter shape · facility catalog · interaction map · Unity-facing template IDs · character art and scale · wall art and datum.',
      186,
      23,
      12,
      640,
      MUTED,
    ),
    text(MARGIN + 804, stressY + 382, 'Still outside this Terrarium pass', 14, 840, CORAL),
    wrappedText(
      MARGIN + 804,
      stressY + 416,
      'A fresh headless bundle diff, The Water Cooler import, generated catalog inspection, and Unity Play Mode eyes-on check. No commit is made by this validation.',
      186,
      23,
      12,
      650,
      MUTED,
    ),
  );

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${PRODUCTION_VALIDATION_HEIGHT}" ` +
    `viewBox="0 0 ${WIDTH} ${PRODUCTION_VALIDATION_HEIGHT}">${parts.join('')}</svg>`
  );
}

function pixelDifference(leftSvg: string, rightSvg: string): {
  changedPixels: number;
  maxChannelDelta: number;
} {
  const render = (source: string) => PNG.sync.read(
    new Resvg(source, { fitTo: { mode: 'width', value: AUTHORING_CANVAS } })
      .render()
      .asPng(),
  );
  const left = render(leftSvg);
  const right = render(rightSvg);
  let changedPixels = 0;
  let maxChannelDelta = 0;
  for (let offset = 0; offset < left.data.length; offset += 4) {
    let changed = false;
    for (let channel = 0; channel < 4; channel += 1) {
      const delta = Math.abs(left.data[offset + channel] - right.data[offset + channel]);
      maxChannelDelta = Math.max(maxChannelDelta, delta);
      if (delta !== 0) changed = true;
    }
    if (changed) changedPixels += 1;
  }
  return { changedPixels, maxChannelDelta };
}

export async function renderQuotaCoPropProductionValidation(
  output: string,
): Promise<{ svgPath: string; pngPath: string; metricsPath: string }> {
  const hybridPropSources = await loadHybridPropSvgSources();
  const renderer = new PropCalibrationRenderer(hybridPropSources);
  const source = productionValidationSheet(renderer);
  const png = new Resvg(source, {
    font: { loadSystemFonts: true },
  }).render().asPng();
  const sourceValidation = await validateHybridPropSvgSources();
  const visualComparison = Object.fromEntries(
    REPRESENTATIVE_PROP_IDS.map((propId) => [
      propId,
      {
        sourceBounds: alphaBounds(renderer.prop('hybrid', propId)),
        productionBounds: alphaBounds(renderer.prop('current', propId)),
        difference: pixelDifference(
          renderer.prop('hybrid', propId),
          renderer.prop('current', propId),
        ),
      },
    ]),
  );
  const metrics = {
    status: 'production-wired-uncommitted',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    authoringCanvas: AUTHORING_CANVAS,
    wallDatum: WALL_DATUM,
    characterVisualScale: CHARACTER_VISUAL_SCALE,
    propVisualMultiplier: null,
    sources: sourceValidation.sources,
    visualComparison,
    templateContracts: Object.fromEntries(
      REPRESENTATIVE_PROP_IDS.map((propId) => {
        const template = renderer.template(propId);
        return [propId, {
          projection: template.projection,
          placement: template.placement ?? 'floor',
          gridFootprint: template.gridFootprint,
          gridPivot: template.gridPivot ?? null,
          contactShadowFootprint: template.footprint ?? null,
          params: template.params,
        }];
      }),
    ),
    protectedSurfaceHashes: await protectedSurfaceHashes(),
    verificationBoundary: {
      performed: [
        'standalone SVG source render',
        'production composeProp render',
        'normal and far literal-scale room render',
        'crowd, wall, desk occlusion, and character interaction render',
      ],
      notPerformed: [
        'fresh headless export diff',
        'The Water Cooler bundle import',
        'Unity generated catalog inspection',
        'Unity Play Mode eyes-on check',
      ],
    },
  };

  await mkdir(output, { recursive: true });
  const base = 'quota-co-prop-production-validation-v6';
  const svgPath = path.join(output, `${base}.svg`);
  const pngPath = path.join(output, `${base}.png`);
  const metricsPath = path.join(output, `${base}-metrics.json`);
  await writeFile(svgPath, source, 'utf8');
  await writeFile(pngPath, png);
  await writeFile(metricsPath, `${JSON.stringify(metrics, null, 2)}\n`, 'utf8');
  return { svgPath, pngPath, metricsPath };
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

export async function renderQuotaCoPropRedesignCalibration(
  output: string,
): Promise<{
  svgPath: string;
  pngPath: string;
  metricsPath: string;
  inventoryPath: string;
  hybridSvgPath: string;
  hybridPngPath: string;
  hybridMetricsPath: string;
  hybridDecisionPath: string;
}> {
  const hybridPropSources = await loadHybridPropSvgSources();
  const renderer = new PropCalibrationRenderer(hybridPropSources);
  const source = calibrationSheet(renderer);
  const png = new Resvg(source, {
    font: { loadSystemFonts: true },
  }).render().asPng();
  const hybridSource = hybridDecisionSheet(renderer);
  const hybridPng = new Resvg(hybridSource, {
    font: { loadSystemFonts: true },
  }).render().asPng();

  await mkdir(output, { recursive: true });
  const base = 'quota-co-prop-redesign-calibration-v1';
  const svgPath = path.join(output, `${base}.svg`);
  const pngPath = path.join(output, `${base}.png`);
  const metricsPath = path.join(output, `${base}-metrics.json`);
  const inventoryPath = path.join(
    output,
    'quota-co-prop-redesign-inventory-v1.md',
  );
  const hybridBase = 'quota-co-prop-redesign-hybrid-v5';
  const hybridSvgPath = path.join(output, `${hybridBase}.svg`);
  const hybridPngPath = path.join(output, `${hybridBase}.png`);
  const hybridMetricsPath = path.join(output, `${hybridBase}-metrics.json`);
  const hybridDecisionPath = path.join(output, `${hybridBase}.md`);
  await writeFile(svgPath, source, 'utf8');
  await writeFile(pngPath, png);
  await writeFile(
    metricsPath,
    `${JSON.stringify(await metrics(renderer), null, 2)}\n`,
    'utf8',
  );
  await writeFile(inventoryPath, inventoryMarkdown(), 'utf8');
  await writeFile(hybridSvgPath, hybridSource, 'utf8');
  await writeFile(hybridPngPath, hybridPng);
  await writeFile(
    hybridMetricsPath,
    `${JSON.stringify(await hybridMetrics(renderer), null, 2)}\n`,
    'utf8',
  );
  await writeFile(hybridDecisionPath, hybridDecisionMarkdown(), 'utf8');
  return {
    svgPath,
    pngPath,
    metricsPath,
    inventoryPath,
    hybridSvgPath,
    hybridPngPath,
    hybridMetricsPath,
    hybridDecisionPath,
  };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const result = await renderQuotaCoPropRedesignCalibration(options.output);
  process.stdout.write(
    'Wrote review-only QuotaCo prop calibration:\n' +
      `${result.svgPath}\n` +
      `${result.pngPath}\n` +
      `${result.metricsPath}\n` +
      `${result.inventoryPath}\n` +
      `${result.hybridSvgPath}\n` +
      `${result.hybridPngPath}\n` +
      `${result.hybridMetricsPath}\n` +
      `${result.hybridDecisionPath}\n`,
  );
}

if (
  process.argv[1]?.endsWith('quotaCoPropRedesignCalibrationPreview.ts')
) {
  main().catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
