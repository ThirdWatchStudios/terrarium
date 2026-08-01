/**
 * Review-only IRIS equipment redesign calibration.
 *
 *   npx tsx scripts/irisEquipmentRedesignCalibrationPreview.ts
 *   npx tsx scripts/irisEquipmentRedesignCalibrationPreview.ts --out /tmp/iris-equipment-proof
 *
 * The proposal drawings in this file are temporary SVG studies. They are not
 * registered as PropTemplates or PartDefs and do not change ids, recipes,
 * footprints, pivots, interaction anchors, export payloads, schema, or Unity
 * integration. Production art remains untouched until a direction is accepted.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import {
  composeCharacter,
  composeProp,
  composeWallTile,
} from '../src/core/compositor';
import {
  CURRENT_SCHEMA_VERSION,
  type CharacterRecipe,
  type Facing,
  type PropInstance,
  type PropTemplate,
  type StyleSheet,
  type TileInstance,
} from '../src/core/types';
import {
  CONSTRUCTION_CREW,
  DEFAULT_CAST,
  DEFAULT_PROPS,
  DEFAULT_STYLE,
  defaultProject,
} from '../src/data/defaults';
import type { Pose } from '../src/parts/poses';
import { PROP_TEMPLATES } from '../src/props/templates';
import { BLOB_CONFIGS } from '../src/tiles/blob';

const WIDTH = 3400;
const PAGE_1_HEIGHT = 2380;
const PAGE_2_HEIGHT = 2280;
const PAGE_3_HEIGHT = 1620;
const PAGE_4_HEIGHT = 2160;
const PAGE_5_HEIGHT = 1740;
const PAGE_6_HEIGHT = 1740;
const PAGE_7_HEIGHT = 1780;
const PAGE_8_HEIGHT = 1810;
const PAGE_11_HEIGHT = 1600;
const PAGE_12_HEIGHT = 1600;
const PAGE_13_HEIGHT = 1600;
const PAGE_14_HEIGHT = 1600;
const PAGE_15_HEIGHT = 1400;
const MARGIN = 36;
const GAP = 18;
const CANVAS = 128;
const WALL_DATUM = 112;
const CHARACTER_VISUAL_SCALE = 0.65;
const CHARACTER_FRAME_CELLS = 1.55 * CHARACTER_VISUAL_SCALE;

const COLORS = {
  page: '#E6E1D4',
  panel: '#F7F3E8',
  panelAlt: '#ECE7DB',
  panelCold: '#E5ECE8',
  panelDark: '#27302D',
  ink: '#292C2A',
  muted: '#626861',
  rule: '#A39B8B',
  green: '#5BE08A',
  greenDark: '#355647',
  coral: '#B65F4D',
  blue: '#294565',
  cream: '#F3EEDA',
  shell: '#DDE2DE',
  shellShade: '#B8C0BC',
  panelMetal: '#5C6662',
  dark: '#18201D',
  floor: '#78858D',
  floorLine: '#D9D4C7',
  lot: '#7C786C',
  lotLine: '#A39D8D',
  occupancy: '#D7CFAF',
} as const;

type DirectionId = 'sealed-spine' | 'certified-pier' | 'calibrated-monolith';
type PierRefinementId =
  | 'accepted-b'
  | 'sealed-register'
  | 'service-aperture'
  | 'structural-plinth';
type RackStudyId =
  | 'b1-control'
  | 'transverse-bank'
  | 'split-pylons'
  | 'stepped-buttress'
  | 'buttressed-bank'
  | 'cassette-array';
type FormResetId =
  | 'suspended-chassis'
  | 'fluted-column'
  | 'blade-register'
  | 'tensioned-buttress';
type SpatialResetId =
  | 'side-rack-console'
  | 'console-bridge'
  | 'backplane-lectern';
type GamifiedStudyId =
  | 'nes-risk-control'
  | 'offset-core'
  | 'side-console'
  | 'dominant-pier'
  | 'weighted-pair'
  | 'backset-pair'
  | 'asymmetric-sheath'
  | 'hybrid-dark-shoulder'
  | 'hybrid-register-cap'
  | 'hybrid-framed-sheath'
  | 'detail-r1-control'
  | 'detail-spine-depth'
  | 'detail-service-register'
  | 'detail-integrated';

interface Direction {
  readonly id: DirectionId;
  readonly label: string;
  readonly shortLabel: string;
  readonly thesis: string;
  readonly familyRule: string;
  readonly risk: string;
  readonly tint: string;
}

const DIRECTIONS: readonly Direction[] = [
  {
    id: 'sealed-spine',
    label: 'A · SEALED SERVICE SPINE',
    shortLabel: 'A · Sealed spine',
    thesis: 'A tall inaccessible service backbone with the console recessed as the one sanctioned human aperture.',
    familyRule: 'Vertical rail on the apparatus; keyed rail on the dock; narrow datum plate on the crew.',
    risk: 'Could become too slim at far zoom if the console shelf loses contrast.',
    tint: '#DDE9E2',
  },
  {
    id: 'certified-pier',
    label: 'B · CERTIFIED SUPPORT PIER',
    shortLabel: 'B · Certified pier',
    thesis: 'Paired structural piers and stamped yokes make IRIS feel installed, inspected, and load-bearing.',
    familyRule: 'Paired supports on the apparatus; four capture blocks on the dock; broad certified yoke on the crew.',
    risk: 'The strongest QuotaCo ancestry, but the broad shoulder rhythm must not become friendly mascot armor.',
    tint: '#E7E4D7',
  },
  {
    id: 'calibrated-monolith',
    label: 'C · CALIBRATED MONOLITH',
    shortLabel: 'C · Monolith',
    thesis: 'One exact sealed core carries the seeing; a lower cantilevered console is the deliberate human concession.',
    familyRule: 'Central keel on the apparatus; indexed diamond on the dock; forward wedge on the crew.',
    risk: 'Most severe branch; needs the molded plinth and service seams to retain QuotaCo ancestry.',
    tint: '#E1E6E7',
  },
] as const;

interface PierRefinement {
  readonly id: PierRefinementId;
  readonly label: string;
  readonly thesis: string;
  readonly keeps: string;
  readonly watch: string;
  readonly tint: string;
}

const PIER_REFINEMENTS: readonly PierRefinement[] = [
  {
    id: 'accepted-b',
    label: 'B0 · ACCEPTED CONTROL',
    thesis: 'The selected Certified Support Pier exactly as approved in the first comparison.',
    keeps: 'Paired piers · stamped dock blocks · broad crew yoke.',
    watch: 'Console is clear, but the rack face remains a little cabinet-like and the crew yoke still approaches mascot armor.',
    tint: '#E7E4D7',
  },
  {
    id: 'sealed-register',
    label: 'B1 · SEALED REGISTER',
    thesis: 'Close the rack into broad certified access slabs and pull the crew yoke inward.',
    keeps: 'Paired structural rhythm and stamped manufacturing seams.',
    watch: 'Most inaccessible read; ensure the quieter front does not become an anonymous refrigerator at far zoom.',
    tint: '#DDE7E0',
  },
  {
    id: 'service-aperture',
    label: 'B2 · SERVICE APERTURE',
    thesis: 'Deepen the console beneath a projecting service hood so human use is unmistakable.',
    keeps: 'Certified pier mass with one sanctioned human opening.',
    watch: 'Best console bridge; the hood must stay architectural rather than reading as a smiling brow.',
    tint: '#E8E5D8',
  },
  {
    id: 'structural-plinth',
    label: 'B3 · STRUCTURAL PLINTH',
    thesis: 'Increase base and foot mass so the apparatus feels bolted into the branch rather than delivered furniture.',
    keeps: 'Paired supports, exact console, and QuotaCo molded construction.',
    watch: 'Strongest permanence; avoid letting the lower mass consume the console or the one-cell gameplay read.',
    tint: '#E1E6E7',
  },
] as const;

interface RackStudy {
  readonly id: RackStudyId;
  readonly label: string;
  readonly thesis: string;
  readonly architecture: string;
  readonly watch: string;
  readonly tint: string;
}

const RACK_STUDIES: readonly RackStudy[] = [
  {
    id: 'b1-control',
    label: 'R0 · B1 CONTROL',
    thesis: 'The current sealed-register rack, retained only to expose the portable-toilet cues.',
    architecture: 'One human-height enclosure · door-sized inset · stacked panels · roof cap.',
    watch: 'Rejected as the rack target: the whole left mass reads as an occupiable plastic booth.',
    tint: '#E9DED7',
  },
  {
    id: 'transverse-bank',
    label: 'R1 · TRANSVERSE BANK',
    thesis: 'Rotate the visual logic into a broad low equipment bank with registered horizontal service courses.',
    architecture: 'Width-dominant mass · flush status register · no enclosed front door.',
    watch: 'Strongest break from the toilet read; keep the lower silhouette out of copier or kitchenette territory.',
    tint: '#DDE7E0',
  },
  {
    id: 'split-pylons',
    label: 'R2 · SPLIT PYLONS',
    thesis: 'Separate the rack into paired sealed load paths divided by a narrow inaccessible bus.',
    architecture: 'Two unequal piers · exposed central datum · optic mounted inside the structure.',
    watch: 'Retains useful verticality; avoid making the pair feel like ordinary lockers or elevator doors.',
    tint: '#E8E5D8',
  },
  {
    id: 'stepped-buttress',
    label: 'R3 · STEPPED BUTTRESS',
    thesis: 'Make the equipment core widen toward the floor like installed infrastructure carrying load.',
    architecture: 'Non-human stepped outline · horizontal compression ribs · flush optic.',
    watch: 'Strongest permanent pier read; the stepped mass must stay exact rather than becoming decorative sci-fi armor.',
    tint: '#E1E6E7',
  },
] as const;

const RACK_CONVERGENCES: readonly RackStudy[] = [
  {
    id: 'transverse-bank',
    label: 'C0 · TRANSVERSE CONTROL',
    thesis: 'The strongest width-first study, carried forward to judge whether it still feels like delivered office cabinetry.',
    architecture: 'Broad horizontal register · no human-scale front door · raised optic retained.',
    watch: 'Successfully loses the toilet, but the regular low case can still resemble a copier, credenza, or kitchenette appliance.',
    tint: '#DDE7E0',
  },
  {
    id: 'stepped-buttress',
    label: 'C1 · BUTTRESS CONTROL',
    thesis: 'The strongest installed-mass study, carried forward to judge whether its stepped face becomes decoration.',
    architecture: 'Widening load path · compressed horizontal ribs · raised optic retained.',
    watch: 'Feels permanent, but the stair-step profile is louder than the equipment function and weakens at room scale.',
    tint: '#E1E6E7',
  },
  {
    id: 'buttressed-bank',
    label: 'C2 · BUTTRESSED BANK',
    thesis: 'Anchor a broad equipment bank to one offset structural pier instead of enclosing a person-sized volume.',
    architecture: 'Asymmetric load-bearing silhouette · horizontal service courses · optic embedded in the pier.',
    watch: 'Best architectural hybrid; keep the tall pier clearly structural rather than letting it become a miniature booth of its own.',
    tint: '#DDE9E2',
  },
  {
    id: 'cassette-array',
    label: 'C3 · CERTIFIED ARRAY',
    thesis: 'Expose the machine scale through many small sealed cassettes held inside one broad certified frame.',
    architecture: 'Sub-human access modules · flush header optic · continuous molded plinth.',
    watch: 'Clearest server-equipment read; ensure the repeated cassettes remain severe infrastructure rather than friendly blinking modules.',
    tint: '#E8E5D8',
  },
] as const;

interface FormResetStudy {
  readonly id: FormResetId;
  readonly label: string;
  readonly thesis: string;
  readonly avoids: string;
  readonly risk: string;
  readonly tint: string;
}

const FORM_RESET_STUDIES: readonly FormResetStudy[] = [
  {
    id: 'suspended-chassis',
    label: 'F1 · SUSPENDED CHASSIS',
    thesis: 'Hang a sealed compute core inside a certified structural frame instead of presenting a cabinet front.',
    avoids: 'Negative space breaks the occupiable booth; the machine is a contained component, not a door.',
    risk: 'Could drift toward an industrial press if the suspended core and human console do not stay legible.',
    tint: '#DDE9E2',
  },
  {
    id: 'fluted-column',
    label: 'F2 · FLUTED COLUMN',
    thesis: 'Use one continuous rounded extrusion with vertical cooling ribs and a console attached at the service side.',
    avoids: 'No rectangular door, no stacked tiers, no front-facing access-panel grid, and no roof cap.',
    risk: 'The continuous vessel may read as a boiler or water heater rather than computing infrastructure.',
    tint: '#E1E6E7',
  },
  {
    id: 'blade-register',
    label: 'F3 · BLADE REGISTER',
    thesis: 'Expose several sealed vertical compute blades as staggered structural fins above one common bus.',
    avoids: 'Sub-human narrow elements replace both the garage-door face and the single person-sized enclosure.',
    risk: 'The staggered fins may become filing folders, books, or decorative acoustic panels at normal scale.',
    tint: '#E8E5D8',
  },
  {
    id: 'tensioned-buttress',
    label: 'F4 · TENSIONED BUTTRESS',
    thesis: 'Organize the sealed core around one diagonal load path with the console cut into its low shoulder.',
    avoids: 'A sloped structural silhouette replaces every appliance, door, drawer, and birthday-cake cue.',
    risk: 'The most architectural option; it must still read as plausible installed server hardware, not sculpture.',
    tint: '#E7E4D7',
  },
] as const;

interface SpatialResetStudy {
  readonly id: SpatialResetId;
  readonly label: string;
  readonly thesis: string;
  readonly physicalRead: string;
  readonly risk: string;
  readonly tint: string;
}

const SPATIAL_RESET_STUDIES: readonly SpatialResetStudy[] = [
  {
    id: 'side-rack-console',
    label: 'S1 · SIDE-RACK STATION',
    thesis: 'Turn the sealed rack edge-on against the wall and let a low operator console project from its service side.',
    physicalRead: 'One deep equipment slab + one sloped control desk + two independent floor anchors.',
    risk: 'The cleanest literal computer station; the rack side must retain enough mass to feel permanent rather than portable.',
    tint: '#DDE9E2',
  },
  {
    id: 'console-bridge',
    label: 'S2 · CONSOLE BRIDGE',
    thesis: 'Hold a single operator surface between two sealed equipment uprights with open knee space below.',
    physicalRead: 'Paired non-human rack ends + suspended console plane + visible space for an operator.',
    risk: 'Clearly usable and non-appliance; could resemble a laboratory bench if the equipment ends become too light.',
    tint: '#E8E5D8',
  },
  {
    id: 'backplane-lectern',
    label: 'S3 · BACKPLANE + LECTERN',
    thesis: 'Lay the sealed computing backplane shallow along the wall and project one narrow control lectern toward the room.',
    physicalRead: 'Wall-adjacent equipment bar + separate human control point + no cabinet front facing the player.',
    risk: 'Best architectural integration; must avoid becoming a reception counter or generic command desk.',
    tint: '#E1E6E7',
  },
] as const;

interface GamifiedStudy {
  readonly id: GamifiedStudyId;
  readonly label: string;
  readonly thesis: string;
  readonly breaks: string;
  readonly watch: string;
  readonly tint: string;
}

const GAMIFIED_STUDIES: readonly GamifiedStudy[] = [
  {
    id: 'nes-risk-control',
    label: 'G0 · NES-RISK CONTROL',
    thesis: 'The selected center concept reduced to its dominant game-scale shapes.',
    breaks: 'Nothing: paired pale blocks, dark center slot, and centered deck preserve the alias.',
    watch: 'Reject as a sprite target even though the high-resolution material study is attractive.',
    tint: '#E9DED7',
  },
  {
    id: 'offset-core',
    label: 'G1 · OFFSET CORE',
    thesis: 'Shift the machine spine and human console away from the apparatus centerline.',
    breaks: 'Unequal piers and an off-axis console remove the cartridge-slot plus controller symmetry.',
    watch: 'The smaller left mass must remain structural rather than becoming a second terminal.',
    tint: '#DDE9E2',
  },
  {
    id: 'side-console',
    label: 'G2 · SIDE CONSOLE',
    thesis: 'Keep the paired Brutalist housings but move the entire human interface to one side.',
    breaks: 'The central core stays visibly machine-only; no centered control deck completes a console silhouette.',
    watch: 'The paired towers may still imply an entertainment device if their heights stay too equal.',
    tint: '#E8E5D8',
  },
  {
    id: 'dominant-pier',
    label: 'G3 · DOMINANT PIER',
    thesis: 'Collapse the front pair into one primary certified mass, rear spine, and subordinate buttress.',
    breaks: 'One strong vertical load path eliminates the two-grip body and centered cartridge opening entirely.',
    watch: 'Strongest no-NES read; preserve enough depth that it remains apparatus rather than a tall kiosk.',
    tint: '#E1E6E7',
  },
] as const;

const CENTERED_CONSOLE_STUDIES: readonly GamifiedStudy[] = [
  {
    id: 'nes-risk-control',
    label: 'C0 · CENTERED CONTROL',
    thesis: 'Retain the only arrangement with a clearly supported, intentionally usable operator deck.',
    breaks: 'It does not. This is the coherence control: centered console, equal pale housings, and dark central spine.',
    watch: 'The paired light masses still form the two grips of a game-console icon at small scale.',
    tint: '#E9DED7',
  },
  {
    id: 'weighted-pair',
    label: 'C1 · WEIGHTED PAIR',
    thesis: 'Keep the console centered on the machine spine while making one structural housing visibly dominant.',
    breaks: 'Unequal width and height disrupt the two-grip symmetry without breaking the console support logic.',
    watch: 'The taller right mass must feel load-bearing, not like a decorative tower added to the control.',
    tint: '#DDE9E2',
  },
  {
    id: 'backset-pair',
    label: 'C2 · BACKSET PAIR',
    thesis: 'Keep the centered console but set one housing behind the other in the locked high-oblique projection.',
    breaks: 'Unequal top planes and visible depth stop the two housings from reading as one flat controller face.',
    watch: 'Depth must survive at 32 px; if it disappears, the silhouette falls back to the centered control.',
    tint: '#E8E5D8',
  },
  {
    id: 'asymmetric-sheath',
    label: 'C3 · ASYMMETRIC SHEATH',
    thesis: 'Hold the coherent centered structure while sheathing only one major housing in QuotaCo off-white.',
    breaks: 'The light-dark split removes the paired pale grips before geometry or detail has to explain the machine.',
    watch: 'The dark housing must remain structural and legible rather than disappearing into the central spine.',
    tint: '#E1E6E7',
  },
] as const;

const HYBRID_REFINEMENT_STUDIES: readonly GamifiedStudy[] = [
  {
    id: 'hybrid-dark-shoulder',
    label: 'R1 · DARK SHOULDER',
    thesis: 'Apply the C3 charcoal sheath to the entire subordinate housing of the C1 weighted silhouette.',
    breaks: 'Unequal mass and unequal value reinforce each other; the apparatus no longer presents two pale controller grips.',
    watch: 'The dark shoulder must remain distinct from the black machine spine at 32 px and in the dormant state.',
    tint: '#DDE9E2',
  },
  {
    id: 'hybrid-register-cap',
    label: 'R2 · REGISTER CAP',
    thesis: 'Keep the subordinate housing dark but give it one pale certified cap that reconnects it to the QuotaCo shell family.',
    breaks: 'The cap makes the shoulder feel deliberately installed while its charcoal body preserves the asymmetric value structure.',
    watch: 'Too much pale area will rebuild the paired-grip icon; the cap must stay subordinate to the dark body.',
    tint: '#E8E5D8',
  },
  {
    id: 'hybrid-framed-sheath',
    label: 'R3 · FRAMED SHEATH',
    thesis: 'Expose a narrow pale structural frame around a charcoal inset rather than coloring the entire shoulder one value.',
    breaks: 'The inset keeps the light-dark imbalance but gives the smaller mass its own readable load-bearing perimeter.',
    watch: 'At game scale the frame may become visual noise or restore too much left-right symmetry.',
    tint: '#E1E6E7',
  },
] as const;

const R1_DETAIL_STUDIES: readonly GamifiedStudy[] = [
  {
    id: 'detail-r1-control',
    label: 'D0 · R1 LOCKED',
    thesis: 'Hold the approved weighted silhouette, centered console, and full charcoal shoulder without added articulation.',
    breaks: 'This is the accepted shape control. Every following study must preserve its outer contour and operator relationship.',
    watch: 'The broad dark spine and shoulder currently sit close in value and can flatten into one mass when dormant.',
    tint: '#E9DED7',
  },
  {
    id: 'detail-spine-depth',
    label: 'D1 · RECESSED SPINE',
    thesis: 'Backset the machine spine with one inner plane and a hard top return while leaving the approved shell untouched.',
    breaks: 'The extra dark plane separates shoulder, spine, and tall housing without introducing another exterior component.',
    watch: 'The recess must read as depth, not as a door, cartridge slot, or glowing entertainment-system bay.',
    tint: '#DDE9E2',
  },
  {
    id: 'detail-service-register',
    label: 'D2 · KEYED SERVICE',
    thesis: 'Cut one irregular certified access seam into the dominant pale housing instead of adding a generic panel grid.',
    breaks: 'The keyed seam implies institutional maintenance access while avoiding a garage-door or rack-face pattern.',
    watch: 'The seam should disappear before the silhouette does; it cannot become the main recognition feature.',
    tint: '#E8E5D8',
  },
  {
    id: 'detail-integrated',
    label: 'D3 · INTEGRATED REGISTER',
    thesis: 'Combine the recessed spine and keyed service seam, then reserve green for one live optic and one console trace.',
    breaks: 'Depth explains the machine, the seam explains service, and sparse state cues distinguish live from dormant without changing form.',
    watch: 'This is the candidate final articulation; reject it if either green cue becomes decorative or the 32 px read grows busy.',
    tint: '#E1E6E7',
  },
] as const;

const LIVE = requiredProp('iris-installation-unit');
const DORMANT = requiredProp('iris-installation-unit-dormant');
const DOCK = requiredProp('iris-charging-dock');
const SERVER_RACK = requiredProp('server-rack');
const CREW = requiredCrew();
const PROJECT = defaultProject();
const WALL = requiredWall();
const STYLE: StyleSheet = {
  ...structuredClone(DEFAULT_STYLE),
  render: {
    ...DEFAULT_STYLE.render,
    contactShadow: 0.12,
  },
};

function requiredProp(templateId: string): PropInstance {
  const prop = DEFAULT_PROPS.find((candidate) => candidate.templateId === templateId);
  if (!prop) throw new Error(`Missing default prop ${templateId}`);
  return structuredClone(prop);
}

function requiredCrew(): CharacterRecipe {
  const recipe = CONSTRUCTION_CREW[0];
  if (!recipe) throw new Error('Missing construction-worker recipe');
  return structuredClone(recipe);
}

function requiredWall(): TileInstance {
  const wall = PROJECT.walls.find(({ id }) => id === 'wall-office');
  if (!wall) throw new Error('Default project is missing wall-office');
  return wall;
}

function template(templateId: string): PropTemplate {
  const value = PROP_TEMPLATES.find(({ id }) => id === templateId);
  if (!value) throw new Error(`Missing prop template ${templateId}`);
  return value;
}

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
  color: string = COLORS.ink,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return (
    `<text x="${x}" y="${y}" fill="${color}" ` +
    'font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif" ' +
    `font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">` +
    `${escapeText(value)}</text>`
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
  color: string = COLORS.ink,
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
  return lines.map((lineValue, index) =>
    text(x, y + index * lineHeight, lineValue, size, weight, color)
  ).join('');
}

function panel(
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string = COLORS.panel,
  radius = 14,
): string {
  return (
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" ` +
    `fill="${fill}" stroke="${COLORS.rule}" stroke-width="1.4"/>`
  );
}

function line(
  d: string,
  stroke: string = COLORS.rule,
  width = 1,
  opacity = 1,
  dash = '',
): string {
  return (
    `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" ` +
    `opacity="${opacity}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`
  );
}

function pill(
  x: number,
  y: number,
  width: number,
  label: string,
  fill: string,
  color: string,
): string {
  return (
    `<rect x="${x}" y="${y}" width="${width}" height="32" rx="16" fill="${fill}"/>` +
    text(x + width / 2, y + 21, label, 11, 740, color, 'middle')
  );
}

function svgInner(svg: string): string {
  return svg
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
}

function svgDocument(markup: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" ` +
    `viewBox="0 0 ${CANVAS} ${CANVAS}">${markup}</svg>`
  );
}

function placedSvg(
  source: string,
  x: number,
  y: number,
  width: number,
  height = width,
  overflow: 'visible' | 'hidden' = 'visible',
): string {
  return (
    `<svg x="${x}" y="${y}" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${CANVAS} ${CANVAS}" preserveAspectRatio="xMidYMid meet" ` +
    `overflow="${overflow}">${svgInner(source)}</svg>`
  );
}

function composeCurrentProp(prop: PropInstance): string {
  return composeProp(prop, STYLE, CANVAS);
}

function currentCrewSvg(
  facing: Facing | 'west',
  pose: Pose = 'neutral',
): string {
  return composeCharacter(
    CREW,
    STYLE,
    facing,
    CANVAS,
    'normal',
    { badge: false, pose },
  );
}

function employeeSvg(
  recipe: CharacterRecipe,
  facing: Facing | 'west',
  pose: Pose = 'neutral',
): string {
  return composeCharacter(
    recipe,
    STYLE,
    facing,
    CANVAS,
    'normal',
    { badge: false, pose },
  );
}

function apparatusMarkup(direction: DirectionId, live: boolean): string {
  const optic = live ? COLORS.green : '#3C4440';
  const screen = live ? '#111B17' : '#1D2421';
  const trace = live ? COLORS.green : '#424A46';
  const diagnostic = live ? '#B7C2BC' : '#3C4440';
  const shadow = `<ellipse cx="64" cy="119" rx="52" ry="5" fill="#00000026"/>`;

  if (direction === 'sealed-spine') {
    return [
      shadow,
      `<path d="M 17 112 V 27 Q 17 20 24 20 H 55 Q 62 20 62 27 V 112 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.4" stroke-linejoin="round"/>`,
      `<path d="M 24 29 H 55 V 108 H 24 Z" fill="${COLORS.shellShade}" stroke="#7F8984" stroke-width="1.4"/>`,
      `<path d="M 29 35 H 50 M 29 58 H 50 M 29 81 H 50" stroke="#8B9590" stroke-width="1.5"/>`,
      `<path d="M 28 32 V 104" stroke="#F7F8F4" stroke-width="1.6" opacity=".75"/>`,
      `<path d="M 65 112 V 63 Q 65 58 70 58 H 107 Q 112 58 112 63 V 112 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.4" stroke-linejoin="round"/>`,
      `<path d="M 72 66 H 105 V 87 H 72 Z" fill="${screen}" stroke="#53605A" stroke-width="1.5"/>`,
      `<path d="M 69 92 H 108 L 114 101 H 66 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="2.2" stroke-linejoin="round"/>`,
      `<path d="M 73 96 H 105" stroke="#7F8984" stroke-width="1.5"/>`,
      `<path d="M 14 108 H 115 V 118 H 14 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3.2" stroke-linejoin="round"/>`,
      `<path d="M 40 20 V 12" stroke="${COLORS.ink}" stroke-width="5" stroke-linecap="round"/>`,
      `<circle cx="40" cy="12" r="6.8" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="2.6"/>`,
      `<circle cx="40" cy="12" r="3.2" fill="${optic}"/>`,
      `<circle cx="49" cy="97" r="1.6" fill="${diagnostic}"/>`,
      `<path d="M 77 73 H 98 M 77 80 H 94" stroke="${trace}" stroke-width="1.8" opacity=".86"/>`,
      `<rect x="99" y="81" width="3.5" height="3.5" rx=".7" fill="${trace}"/>`,
    ].join('');
  }

  if (direction === 'certified-pier') {
    return [
      shadow,
      `<path d="M 13 113 V 29 L 20 22 H 52 L 58 29 V 113 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.4" stroke-linejoin="round"/>`,
      `<path d="M 20 32 H 51 V 108 H 20 Z" fill="${COLORS.shellShade}" stroke="#7F8984" stroke-width="1.4"/>`,
      `<path d="M 25 39 H 46 V 53 H 25 Z M 25 61 H 46 V 75 H 25 Z M 25 83 H 46 V 101 H 25 Z" fill="#CBD1CD" stroke="#87908C" stroke-width="1.2"/>`,
      `<path d="M 62 113 V 48 L 69 41 H 105 L 113 49 V 113 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.4" stroke-linejoin="round"/>`,
      `<path d="M 70 51 H 105 V 76 H 70 Z" fill="${screen}" stroke="#53605A" stroke-width="1.5"/>`,
      `<path d="M 66 82 H 109 L 115 93 H 62 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="2.2" stroke-linejoin="round"/>`,
      `<path d="M 73 89 H 103" stroke="#7F8984" stroke-width="1.6"/>`,
      `<path d="M 10 108 H 116 V 119 H 10 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3.3" stroke-linejoin="round"/>`,
      `<path d="M 18 112 V 118 M 55 112 V 118 M 69 112 V 118 M 108 112 V 118" stroke="#77807C" stroke-width="2"/>`,
      `<path d="M 35 22 V 14" stroke="${COLORS.ink}" stroke-width="5" stroke-linecap="round"/>`,
      `<rect x="28" y="8" width="14" height="10" rx="4" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="2.5"/>`,
      `<rect x="32" y="11" width="6" height="4" rx="2" fill="${optic}"/>`,
      `<circle cx="47" cy="92" r="1.7" fill="${diagnostic}"/>`,
      `<path d="M 76 59 H 99 M 76 67 H 96" stroke="${trace}" stroke-width="1.8" opacity=".86"/>`,
      `<circle cx="101" cy="70" r="1.8" fill="${trace}"/>`,
    ].join('');
  }

  return [
    shadow,
    `<path d="M 22 113 V 23 L 29 15 H 68 L 75 23 V 113 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.6" stroke-linejoin="round"/>`,
    `<path d="M 31 27 H 66 V 105 H 31 Z" fill="${COLORS.shellShade}" stroke="#7F8984" stroke-width="1.5"/>`,
    `<path d="M 38 31 H 60 V 97 H 38 Z" fill="#CDD3CF" stroke="#8B9490" stroke-width="1.2"/>`,
    `<path d="M 43 36 V 92" stroke="#F7F8F4" stroke-width="1.5" opacity=".72"/>`,
    `<path d="M 75 113 V 72 H 107 L 116 82 V 113 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.6" stroke-linejoin="round"/>`,
    `<path d="M 82 79 H 107 V 96 H 82 Z" fill="${screen}" stroke="#53605A" stroke-width="1.5"/>`,
    `<path d="M 78 99 H 111 L 116 108 H 75 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="2.2" stroke-linejoin="round"/>`,
    `<path d="M 15 109 H 118 L 112 119 H 20 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3.4" stroke-linejoin="round"/>`,
    `<path d="M 49 15 V 8" stroke="${COLORS.ink}" stroke-width="5" stroke-linecap="round"/>`,
    `<path d="M 43 8 L 49 3 L 55 8 L 49 13 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="2.5" stroke-linejoin="round"/>`,
    `<circle cx="49" cy="8" r="2.9" fill="${optic}"/>`,
    `<circle cx="61" cy="92" r="1.6" fill="${diagnostic}"/>`,
    `<path d="M 86 85 H 104 M 86 91 H 101" stroke="${trace}" stroke-width="1.7" opacity=".86"/>`,
  ].join('');
}

function apparatusSvg(direction: DirectionId, live: boolean): string {
  return svgDocument(apparatusMarkup(direction, live));
}

function dockMarkup(direction: DirectionId, active = true): string {
  const status = active ? COLORS.green : '#414945';
  const common = `<ellipse cx="64" cy="93" rx="34" ry="8" fill="#00000022"/>`;
  if (direction === 'sealed-spine') {
    return [
      common,
      `<path d="M 31 39 H 97 V 93 L 89 101 H 39 L 31 93 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3.4" stroke-linejoin="round"/>`,
      `<path d="M 40 47 H 88 V 88 H 40 Z" fill="${COLORS.panelMetal}" stroke="#87908C" stroke-width="1.5"/>`,
      `<path d="M 48 42 V 82 M 80 42 V 82" stroke="${COLORS.shell}" stroke-width="6" stroke-linecap="round"/>`,
      `<path d="M 52 74 H 76 V 94 H 52 Z" fill="${COLORS.dark}" stroke="${COLORS.ink}" stroke-width="1.8"/>`,
      `<rect x="60" y="90" width="8" height="5" rx="2" fill="${status}"/>`,
      `<circle cx="40" cy="48" r="2" fill="#EEF2EE"/><circle cx="88" cy="48" r="2" fill="#EEF2EE"/>`,
    ].join('');
  }
  if (direction === 'certified-pier') {
    return [
      common,
      `<rect x="28" y="34" width="72" height="66" rx="8" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3.4"/>`,
      `<rect x="39" y="45" width="50" height="44" rx="5" fill="${COLORS.panelMetal}" stroke="#87908C" stroke-width="1.5"/>`,
      `<rect x="32" y="38" width="18" height="11" rx="3" fill="${COLORS.shell}"/><rect x="78" y="38" width="18" height="11" rx="3" fill="${COLORS.shell}"/>`,
      `<rect x="32" y="85" width="18" height="11" rx="3" fill="${COLORS.shell}"/><rect x="78" y="85" width="18" height="11" rx="3" fill="${COLORS.shell}"/>`,
      `<path d="M 64 48 V 86 M 45 67 H 83" stroke="${COLORS.dark}" stroke-width="6" stroke-linecap="round"/>`,
      `<circle cx="64" cy="67" r="5" fill="${status}" stroke="${COLORS.ink}" stroke-width="1.5"/>`,
    ].join('');
  }
  return [
    common,
    `<path d="M 64 29 L 101 64 L 64 105 L 27 64 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3.4" stroke-linejoin="round"/>`,
    `<path d="M 64 40 L 90 64 L 64 92 L 38 64 Z" fill="${COLORS.panelMetal}" stroke="#87908C" stroke-width="1.5"/>`,
    `<path d="M 64 45 V 83 M 45 64 H 83" stroke="${COLORS.shell}" stroke-width="5" stroke-linecap="round"/>`,
    `<path d="M 54 82 H 74 L 78 99 H 50 Z" fill="${COLORS.dark}" stroke="${COLORS.ink}" stroke-width="1.8" stroke-linejoin="round"/>`,
    `<circle cx="64" cy="91" r="3.2" fill="${status}"/>`,
  ].join('');
}

function dockSvg(direction: DirectionId, active = true): string {
  return svgDocument(dockMarkup(direction, active));
}

function crewOverlay(direction: DirectionId, facing: Facing | 'west'): string {
  const profile = facing === 'east' || facing === 'west';
  const mirror = facing === 'west' ? ' transform="matrix(-1 0 0 1 128 0)"' : '';
  const rear = facing === 'north';
  const opticX = profile ? 73 : 64;
  const optic = rear ? '#87A493' : COLORS.green;

  if (direction === 'sealed-spine') {
    const torso = profile
      ? `<path d="M 52 58 H 77 L 80 107 L 72 114 H 52 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3" stroke-linejoin="round"/>`
      : `<path d="M 48 57 H 80 L 83 108 L 77 114 H 51 L 45 108 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3" stroke-linejoin="round"/>`;
    return (
      `<g${mirror}>` +
      `<path d="M 47 12 L 53 6 H 76 L 83 13 V 47 L 77 54 H 51 L 45 47 V 18 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.2" stroke-linejoin="round"/>` +
      `<path d="M 51 24 H 79 V 40 H 51 Z" fill="${COLORS.panelMetal}" stroke="${COLORS.dark}" stroke-width="1.5"/>` +
      `<rect x="${opticX - 3}" y="29" width="6" height="6" rx="2" fill="${optic}"/>` +
      torso +
      `<path d="M ${profile ? 60 : 64} 63 V 104" stroke="#F2F4EF" stroke-width="3" opacity=".72"/>` +
      `<rect x="${profile ? 67 : 58}" y="102" width="${profile ? 8 : 12}" height="6" rx="2" fill="${COLORS.panelMetal}"/>` +
      `</g>`
    );
  }

  if (direction === 'certified-pier') {
    const torso = profile
      ? `<path d="M 49 60 H 80 L 84 105 L 77 114 H 50 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3" stroke-linejoin="round"/>`
      : `<path d="M 39 64 L 47 56 H 81 L 90 64 L 86 107 L 78 114 H 50 L 42 107 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3" stroke-linejoin="round"/>`;
    return (
      `<g${mirror}>` +
      `<path d="M 42 17 L 50 9 H 78 L 87 17 V 46 L 79 54 H 49 L 41 46 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.2" stroke-linejoin="round"/>` +
      `<path d="M 47 25 H 82 V 41 H 47 Z" fill="${COLORS.panelMetal}" stroke="${COLORS.dark}" stroke-width="1.5"/>` +
      `<circle cx="${opticX}" cy="33" r="3.4" fill="${optic}"/>` +
      torso +
      `<path d="M ${profile ? 54 : 46} 67 H ${profile ? 77 : 82}" stroke="${COLORS.shell}" stroke-width="6" stroke-linecap="round"/>` +
      `<rect x="${profile ? 65 : 57}" y="101" width="${profile ? 10 : 14}" height="7" rx="2" fill="${COLORS.panelMetal}"/>` +
      `</g>`
    );
  }

  const torso = profile
    ? `<path d="M 51 58 H 78 L 86 103 L 77 114 H 53 L 48 102 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3" stroke-linejoin="round"/>`
    : `<path d="M 47 58 H 80 L 88 103 L 79 114 H 49 L 40 103 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3" stroke-linejoin="round"/>`;
  return (
    `<g${mirror}>` +
    `<path d="M 49 10 H 76 L 86 20 L 82 46 L 74 54 H 50 L 43 46 L 45 18 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.2" stroke-linejoin="round"/>` +
    `<path d="M 49 25 L 81 22 L 79 41 L 50 44 Z" fill="${COLORS.panelMetal}" stroke="${COLORS.dark}" stroke-width="1.5" stroke-linejoin="round"/>` +
    `<circle cx="${opticX}" cy="32" r="3.2" fill="${optic}"/>` +
    torso +
    `<path d="M ${profile ? 56 : 64} 63 L ${profile ? 73 : 75} 103" stroke="#F2F4EF" stroke-width="3" opacity=".7"/>` +
    `<path d="M ${profile ? 65 : 56} 103 H ${profile ? 78 : 76}" stroke="${COLORS.panelMetal}" stroke-width="7" stroke-linecap="round"/>` +
    `</g>`
  );
}

function proposalCrewSvg(
  direction: DirectionId,
  facing: Facing | 'west',
  pose: Pose = 'neutral',
): string {
  const current = currentCrewSvg(facing, pose);
  return svgDocument(svgInner(current) + crewOverlay(direction, facing));
}

function refinedPierApparatusMarkup(
  refinement: PierRefinementId,
  live: boolean,
): string {
  if (refinement === 'accepted-b') {
    return apparatusMarkup('certified-pier', live);
  }

  const optic = live ? COLORS.green : '#3C4440';
  const screen = live ? '#111B17' : '#1D2421';
  const trace = live ? COLORS.green : '#424A46';
  const diagnostic = live ? '#B7C2BC' : '#3C4440';
  const shadow = `<ellipse cx="64" cy="119" rx="54" ry="5" fill="#00000026"/>`;

  if (refinement === 'sealed-register') {
    return [
      shadow,
      `<path d="M 13 113 V 29 L 20 21 H 53 L 59 29 V 113 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.4" stroke-linejoin="round"/>`,
      `<path d="M 22 31 H 50 V 106 H 22 Z" fill="${COLORS.shellShade}" stroke="#7F8984" stroke-width="1.4"/>`,
      `<path d="M 27 34 V 102" stroke="#F7F8F4" stroke-width="1.7" opacity=".72"/>`,
      `<path d="M 22 57 H 50 M 22 82 H 50" stroke="#8B9590" stroke-width="1.4"/>`,
      `<circle cx="46" cy="96" r="1.6" fill="${diagnostic}"/>`,
      `<path d="M 63 113 V 49 L 70 42 H 105 L 113 50 V 113 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.4" stroke-linejoin="round"/>`,
      `<path d="M 72 53 H 104 V 76 H 72 Z" fill="${screen}" stroke="#53605A" stroke-width="1.5"/>`,
      `<path d="M 68 82 H 108 L 113 92 H 64 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="2.2" stroke-linejoin="round"/>`,
      `<path d="M 74 88 H 102" stroke="#7F8984" stroke-width="1.5"/>`,
      `<path d="M 10 108 H 116 V 119 H 10 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3.3" stroke-linejoin="round"/>`,
      `<path d="M 17 112 V 118 M 55 112 V 118 M 69 112 V 118 M 108 112 V 118" stroke="#77807C" stroke-width="2"/>`,
      `<path d="M 36 21 V 14" stroke="${COLORS.ink}" stroke-width="5" stroke-linecap="round"/>`,
      `<rect x="29" y="8" width="14" height="10" rx="3.5" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="2.5"/>`,
      `<rect x="33" y="11" width="6" height="4" rx="2" fill="${optic}"/>`,
      `<path d="M 78 60 H 98 M 78 68 H 95" stroke="${trace}" stroke-width="1.8" opacity=".86"/>`,
    ].join('');
  }

  if (refinement === 'service-aperture') {
    return [
      shadow,
      `<path d="M 12 113 V 29 L 19 21 H 55 L 61 29 V 113 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.5" stroke-linejoin="round"/>`,
      `<path d="M 21 32 H 52 V 107 H 21 Z" fill="${COLORS.shellShade}" stroke="#7F8984" stroke-width="1.4"/>`,
      `<path d="M 26 36 H 47 V 55 H 26 Z M 26 63 H 47 V 82 H 26 Z M 26 90 H 47 V 102 H 26 Z" fill="#CBD1CD" stroke="#87908C" stroke-width="1.15"/>`,
      `<path d="M 64 113 V 49 L 71 40 H 105 L 114 50 V 113 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.5" stroke-linejoin="round"/>`,
      `<path d="M 69 48 L 75 43 H 103 L 111 51 V 82 H 69 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="2.4" stroke-linejoin="round"/>`,
      `<path d="M 75 55 H 104 V 76 H 75 Z" fill="${screen}" stroke="#53605A" stroke-width="1.5"/>`,
      `<path d="M 68 82 H 110 L 116 94 H 63 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="2.4" stroke-linejoin="round"/>`,
      `<path d="M 75 89 H 104" stroke="#7F8984" stroke-width="1.7"/>`,
      `<path d="M 10 108 H 117 V 119 H 10 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3.3" stroke-linejoin="round"/>`,
      `<path d="M 36 21 V 14" stroke="${COLORS.ink}" stroke-width="5" stroke-linecap="round"/>`,
      `<rect x="29" y="8" width="14" height="10" rx="3.5" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="2.5"/>`,
      `<rect x="33" y="11" width="6" height="4" rx="2" fill="${optic}"/>`,
      `<circle cx="48" cy="97" r="1.5" fill="${diagnostic}"/>`,
      `<path d="M 80 62 H 99 M 80 69 H 96" stroke="${trace}" stroke-width="1.8" opacity=".88"/>`,
    ].join('');
  }

  return [
    shadow,
    `<path d="M 13 108 V 29 L 20 21 H 53 L 59 29 V 108 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.5" stroke-linejoin="round"/>`,
    `<path d="M 22 32 H 50 V 101 H 22 Z" fill="${COLORS.shellShade}" stroke="#7F8984" stroke-width="1.4"/>`,
    `<path d="M 27 37 H 45 V 57 H 27 Z M 27 65 H 45 V 94 H 27 Z" fill="#CBD1CD" stroke="#87908C" stroke-width="1.2"/>`,
    `<path d="M 64 108 V 51 L 71 43 H 104 L 113 52 V 108 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.5" stroke-linejoin="round"/>`,
    `<path d="M 72 54 H 104 V 77 H 72 Z" fill="${screen}" stroke="#53605A" stroke-width="1.5"/>`,
    `<path d="M 68 82 H 109 L 114 93 H 64 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="2.3" stroke-linejoin="round"/>`,
    `<path d="M 74 89 H 102" stroke="#7F8984" stroke-width="1.6"/>`,
    `<path d="M 8 101 H 119 V 112 H 8 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3.4" stroke-linejoin="round"/>`,
    `<path d="M 11 111 H 116 L 110 121 H 17 Z" fill="#AAB3AE" stroke="${COLORS.ink}" stroke-width="3.4" stroke-linejoin="round"/>`,
    `<path d="M 20 105 V 116 M 55 105 V 116 M 70 105 V 116 M 106 105 V 116" stroke="#737D78" stroke-width="2.2"/>`,
    `<path d="M 36 21 V 14" stroke="${COLORS.ink}" stroke-width="5" stroke-linecap="round"/>`,
    `<rect x="29" y="8" width="14" height="10" rx="3.5" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="2.5"/>`,
    `<rect x="33" y="11" width="6" height="4" rx="2" fill="${optic}"/>`,
    `<circle cx="47" cy="93" r="1.5" fill="${diagnostic}"/>`,
    `<path d="M 78 61 H 99 M 78 69 H 96" stroke="${trace}" stroke-width="1.8" opacity=".86"/>`,
  ].join('');
}

function refinedPierApparatusSvg(
  refinement: PierRefinementId,
  live: boolean,
): string {
  return svgDocument(refinedPierApparatusMarkup(refinement, live));
}

function rackStudyApparatusMarkup(
  study: RackStudyId,
  live: boolean,
): string {
  if (study === 'b1-control') {
    return refinedPierApparatusMarkup('sealed-register', live);
  }

  const optic = live ? COLORS.green : '#3C4440';
  const screen = live ? '#111B17' : '#1D2421';
  const trace = live ? COLORS.green : '#424A46';
  const diagnostic = live ? '#B7C2BC' : '#3C4440';
  const shadow = `<ellipse cx="64" cy="119" rx="56" ry="5" fill="#00000026"/>`;
  const console = [
    `<path d="M 84 110 V 58 L 91 50 H 110 L 118 59 V 110 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.4" stroke-linejoin="round"/>`,
    `<path d="M 91 60 H 111 V 80 H 91 Z" fill="${screen}" stroke="#53605A" stroke-width="1.5"/>`,
    `<path d="M 87 84 H 115 L 120 95 H 83 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="2.2" stroke-linejoin="round"/>`,
    `<path d="M 93 91 H 110" stroke="#7F8984" stroke-width="1.5"/>`,
    `<path d="M 96 67 H 107 M 96 73 H 105" stroke="${trace}" stroke-width="1.7" opacity=".86"/>`,
  ].join('');
  const base = [
    `<path d="M 8 106 H 121 V 118 H 8 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3.3" stroke-linejoin="round"/>`,
    `<path d="M 16 111 V 117 M 48 111 V 117 M 80 111 V 117 M 112 111 V 117" stroke="#77807C" stroke-width="2"/>`,
  ].join('');

  if (study === 'transverse-bank') {
    return [
      shadow,
      `<path d="M 10 106 V 48 L 18 40 H 78 L 86 48 V 106 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.5" stroke-linejoin="round"/>`,
      `<path d="M 16 47 H 80 V 59 H 16 Z" fill="#C8CFCA" stroke="#808A85" stroke-width="1.4"/>`,
      `<path d="M 16 66 H 80 V 79 H 16 Z M 16 86 H 80 V 100 H 16 Z" fill="${COLORS.shellShade}" stroke="#87908C" stroke-width="1.35"/>`,
      `<path d="M 29 49 V 98 M 67 49 V 98" stroke="#F5F7F3" stroke-width="1.8" opacity=".68"/>`,
      `<path d="M 48 40 V 32" stroke="${COLORS.ink}" stroke-width="4.5" stroke-linecap="round"/>`,
      `<rect x="38" y="26" width="20" height="9" rx="3" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="2.3"/>`,
      `<rect x="44" y="29" width="8" height="3.5" rx="1.6" fill="${optic}"/>`,
      `<circle cx="75" cy="95" r="1.6" fill="${diagnostic}"/>`,
      console,
      base,
    ].join('');
  }

  if (study === 'split-pylons') {
    return [
      shadow,
      `<path d="M 11 106 V 35 L 18 28 H 40 L 45 34 V 106 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.5" stroke-linejoin="round"/>`,
      `<path d="M 51 106 V 29 L 58 21 H 76 L 82 28 V 106 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.5" stroke-linejoin="round"/>`,
      `<path d="M 45 39 H 51 V 101 H 45 Z" fill="${COLORS.dark}" stroke="${COLORS.ink}" stroke-width="1.5"/>`,
      `<path d="M 18 43 H 39 M 18 64 H 39 M 18 85 H 39 M 58 36 H 76 M 58 58 H 76 M 58 80 H 76" stroke="#87908C" stroke-width="3.2"/>`,
      `<path d="M 23 32 V 101 M 63 26 V 101" stroke="#F5F7F3" stroke-width="1.6" opacity=".64"/>`,
      `<rect x="43" y="17" width="11" height="12" rx="3" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="2.2"/>`,
      `<rect x="46" y="20" width="5" height="6" rx="2" fill="${optic}"/>`,
      `<circle cx="74" cy="96" r="1.6" fill="${diagnostic}"/>`,
      console,
      base,
    ].join('');
  }

  if (study === 'buttressed-bank') {
    return [
      shadow,
      `<path d="M 10 106 V 34 L 17 27 H 35 L 41 34 V 106 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.6" stroke-linejoin="round"/>`,
      `<path d="M 34 106 V 51 L 41 44 H 78 L 86 51 V 106 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.6" stroke-linejoin="round"/>`,
      `<path d="M 17 42 H 34 V 55 H 17 Z M 41 53 H 80 V 66 H 41 Z M 41 73 H 80 V 86 H 41 Z M 41 93 H 80 V 101 H 41 Z" fill="${COLORS.shellShade}" stroke="#828C87" stroke-width="1.3"/>`,
      `<path d="M 22 36 V 101 M 52 48 V 101 M 70 48 V 101" stroke="#F5F7F3" stroke-width="1.6" opacity=".64"/>`,
      `<rect x="18" y="32" width="15" height="7" rx="2.4" fill="${COLORS.panelMetal}" stroke="${COLORS.ink}" stroke-width="1.7"/>`,
      `<rect x="23" y="34" width="6" height="3" rx="1.4" fill="${optic}"/>`,
      `<circle cx="77" cy="96" r="1.6" fill="${diagnostic}"/>`,
      console,
      base,
    ].join('');
  }

  if (study === 'cassette-array') {
    return [
      shadow,
      `<path d="M 9 106 V 43 L 17 35 H 79 L 87 43 V 106 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.6" stroke-linejoin="round"/>`,
      `<path d="M 16 43 H 81 V 56 H 16 Z" fill="${COLORS.shellShade}" stroke="#7F8984" stroke-width="1.4"/>`,
      `<rect x="21" y="47" width="17" height="5" rx="2" fill="${COLORS.panelMetal}"/><rect x="26" y="48" width="7" height="3" rx="1.4" fill="${optic}"/>`,
      `<path d="M 17 62 H 35 V 77 H 17 Z M 40 62 H 58 V 77 H 40 Z M 63 62 H 81 V 77 H 63 Z M 17 83 H 35 V 99 H 17 Z M 40 83 H 58 V 99 H 40 Z M 63 83 H 81 V 99 H 63 Z" fill="#C8CFCA" stroke="#828C87" stroke-width="1.25"/>`,
      `<path d="M 22 65 V 74 M 45 65 V 74 M 68 65 V 74 M 22 86 V 96 M 45 86 V 96 M 68 86 V 96" stroke="#F5F7F3" stroke-width="1.45" opacity=".68"/>`,
      `<circle cx="77" cy="95" r="1.6" fill="${diagnostic}"/>`,
      console,
      base,
    ].join('');
  }

  return [
    shadow,
    `<path d="M 24 22 H 62 L 70 30 V 46 H 78 V 64 H 85 V 106 H 10 V 78 H 15 V 52 H 19 V 29 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.6" stroke-linejoin="round"/>`,
    `<path d="M 22 35 H 67 V 48 H 18 V 54 H 75 V 68 H 14 V 75 H 81 V 91 H 11" fill="${COLORS.shellShade}" stroke="#7F8984" stroke-width="1.4" stroke-linejoin="round"/>`,
    `<path d="M 31 27 V 100 M 57 27 V 100" stroke="#F5F7F3" stroke-width="1.7" opacity=".65"/>`,
    `<path d="M 37 22 V 14 H 55 V 22" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3" stroke-linejoin="round"/>`,
    `<rect x="42" y="17" width="8" height="4" rx="1.8" fill="${optic}"/>`,
    `<circle cx="75" cy="97" r="1.6" fill="${diagnostic}"/>`,
    console,
    base,
  ].join('');
}

function rackStudyApparatusSvg(
  study: RackStudyId,
  live: boolean,
): string {
  return svgDocument(rackStudyApparatusMarkup(study, live));
}

function formResetApparatusMarkup(
  study: FormResetId,
  live: boolean,
): string {
  const optic = live ? COLORS.green : '#3C4440';
  const screen = live ? '#111B17' : '#1D2421';
  const trace = live ? COLORS.green : '#424A46';
  const diagnostic = live ? '#B7C2BC' : '#3C4440';
  const shadow = `<ellipse cx="64" cy="119" rx="55" ry="5" fill="#00000026"/>`;
  const base = [
    `<path d="M 8 107 H 121 V 118 H 8 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3.3" stroke-linejoin="round"/>`,
    `<path d="M 17 111 V 117 M 50 111 V 117 M 82 111 V 117 M 112 111 V 117" stroke="#77807C" stroke-width="2"/>`,
  ].join('');
  const console = [
    `<path d="M 82 107 V 79 L 89 68 H 111 L 118 76 V 107 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.4" stroke-linejoin="round"/>`,
    `<path d="M 89 75 H 111 V 91 H 87 Z" fill="${screen}" stroke="#53605A" stroke-width="1.5" stroke-linejoin="round"/>`,
    `<path d="M 85 94 H 115 L 120 103 H 82 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="2.2" stroke-linejoin="round"/>`,
    `<path d="M 94 81 H 107 M 94 86 H 105" stroke="${trace}" stroke-width="1.7" opacity=".86"/>`,
  ].join('');

  if (study === 'suspended-chassis') {
    return [
      shadow,
      `<path d="M 12 107 V 31 L 19 22 H 30 L 35 30 V 107 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.6" stroke-linejoin="round"/>`,
      `<path d="M 61 107 V 27 L 68 18 H 78 L 83 27 V 107 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.6" stroke-linejoin="round"/>`,
      `<path d="M 25 22 H 72" stroke="${COLORS.ink}" stroke-width="7" stroke-linecap="square"/>`,
      `<path d="M 31 36 L 38 30 H 61 L 68 37 V 78 L 61 86 H 38 L 31 79 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3.1" stroke-linejoin="round"/>`,
      `<path d="M 40 36 V 80 M 58 36 V 80" stroke="#F5F7F3" stroke-width="1.8" opacity=".66"/>`,
      `<path d="M 35 58 H 64" stroke="#818B86" stroke-width="2.6"/>`,
      `<rect x="44" y="32" width="11" height="7" rx="2.5" fill="${COLORS.panelMetal}" stroke="${COLORS.ink}" stroke-width="1.7"/>`,
      `<rect x="47" y="34" width="5" height="3" rx="1.4" fill="${optic}"/>`,
      `<circle cx="63" cy="77" r="1.6" fill="${diagnostic}"/>`,
      console,
      base,
    ].join('');
  }

  if (study === 'fluted-column') {
    return [
      shadow,
      `<path d="M 31 17 H 55 Q 70 17 75 33 V 96 Q 72 107 60 109 H 25 Q 14 106 14 96 V 34 Q 17 20 31 17 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.7" stroke-linejoin="round"/>`,
      `<path d="M 24 27 Q 20 41 20 59 V 95 M 34 22 V 102 M 47 21 V 103 M 60 25 V 99 M 69 33 V 93" stroke="#87908C" stroke-width="2.8" stroke-linecap="round"/>`,
      `<path d="M 27 25 V 98 M 53 24 V 100" stroke="#F5F7F3" stroke-width="1.6" opacity=".62"/>`,
      `<path d="M 27 18 Q 42 12 58 20" fill="none" stroke="${COLORS.shellShade}" stroke-width="4" stroke-linecap="round"/>`,
      `<rect x="38" y="21" width="12" height="7" rx="3" fill="${COLORS.panelMetal}" stroke="${COLORS.ink}" stroke-width="1.7"/>`,
      `<rect x="42" y="23" width="5" height="3" rx="1.4" fill="${optic}"/>`,
      `<circle cx="64" cy="94" r="1.6" fill="${diagnostic}"/>`,
      console,
      base,
    ].join('');
  }

  if (study === 'blade-register') {
    return [
      shadow,
      `<path d="M 10 107 V 44 L 17 36 H 31 L 36 43 V 107 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3.3" stroke-linejoin="round"/>`,
      `<path d="M 30 107 V 31 L 37 23 H 50 L 56 30 V 107 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.4" stroke-linejoin="round"/>`,
      `<path d="M 51 107 V 39 L 58 31 H 70 L 76 38 V 107 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3.3" stroke-linejoin="round"/>`,
      `<path d="M 70 107 V 51 L 77 43 H 84 L 89 49 V 107 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.2" stroke-linejoin="round"/>`,
      `<path d="M 18 43 V 101 M 39 30 V 101 M 60 38 V 101 M 79 50 V 101" stroke="#F5F7F3" stroke-width="1.7" opacity=".68"/>`,
      `<rect x="39" y="27" width="10" height="7" rx="2.5" fill="${COLORS.panelMetal}" stroke="${COLORS.ink}" stroke-width="1.7"/>`,
      `<rect x="42" y="29" width="5" height="3" rx="1.4" fill="${optic}"/>`,
      `<path d="M 16 86 H 83" stroke="#818B86" stroke-width="2.5"/>`,
      `<circle cx="82" cy="95" r="1.6" fill="${diagnostic}"/>`,
      console,
      base,
    ].join('');
  }

  return [
    shadow,
    `<path d="M 10 107 L 22 39 L 34 19 H 53 L 82 107 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.8" stroke-linejoin="round"/>`,
    `<path d="M 23 99 L 33 47 L 41 31 H 49 L 68 99 Z" fill="${COLORS.shellShade}" stroke="#7F8984" stroke-width="1.8" stroke-linejoin="round"/>`,
    `<path d="M 31 91 L 39 48 L 46 35 L 58 91" fill="none" stroke="#F5F7F3" stroke-width="2" opacity=".68"/>`,
    `<path d="M 19 74 L 65 74 M 16 91 H 72" stroke="#87908C" stroke-width="2.6"/>`,
    `<rect x="38" y="25" width="12" height="7" rx="2.5" fill="${COLORS.panelMetal}" stroke="${COLORS.ink}" stroke-width="1.7" transform="rotate(4 44 28.5)"/>`,
    `<rect x="42" y="27" width="5" height="3" rx="1.4" fill="${optic}" transform="rotate(4 44.5 28.5)"/>`,
    `<circle cx="68" cy="96" r="1.6" fill="${diagnostic}"/>`,
    console,
    base,
  ].join('');
}

function formResetApparatusSvg(
  study: FormResetId,
  live: boolean,
): string {
  return svgDocument(formResetApparatusMarkup(study, live));
}

function spatialResetApparatusMarkup(
  study: SpatialResetId,
  live: boolean,
): string {
  const optic = live ? COLORS.green : '#3C4440';
  const screen = live ? '#18211E' : '#1D2421';
  const neutralTrace = live ? '#BFC8C3' : '#59615D';
  const diagnostic = live ? '#B7C2BC' : '#3C4440';

  if (study === 'side-rack-console') {
    return [
      `<ellipse cx="35" cy="112" rx="27" ry="5" fill="#00000024"/>`,
      `<ellipse cx="92" cy="111" rx="31" ry="5" fill="#00000020"/>`,
      `<path d="M 15 34 L 29 22 H 49 V 96 L 35 108 H 15 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3.6" stroke-linejoin="round"/>`,
      `<path d="M 49 22 L 59 30 V 99 L 49 96 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.3" stroke-linejoin="round"/>`,
      `<path d="M 29 22 L 38 16 H 53 L 59 22 H 49 Z" fill="#EDF0ED" stroke="${COLORS.ink}" stroke-width="3" stroke-linejoin="round"/>`,
      `<path d="M 24 37 L 39 26 V 95 L 24 102 Z" fill="#C9D0CC" stroke="#858F8A" stroke-width="1.4" stroke-linejoin="round"/>`,
      `<path d="M 30 35 V 96" stroke="#F6F7F4" stroke-width="1.8" opacity=".7"/>`,
      `<rect x="51" y="34" width="5" height="11" rx="2" fill="${COLORS.panelMetal}" stroke="${COLORS.ink}" stroke-width="1.5"/>`,
      `<rect x="52.5" y="36" width="2" height="6" rx="1" fill="${optic}"/>`,
      `<path d="M 58 69 L 101 55 L 119 64 L 74 80 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.3" stroke-linejoin="round"/>`,
      `<path d="M 68 69 L 99 59 L 108 64 L 76 74 Z" fill="${screen}" stroke="#53605A" stroke-width="1.5" stroke-linejoin="round"/>`,
      `<path d="M 81 68 L 97 63" stroke="${neutralTrace}" stroke-width="1.7"/>`,
      `<path d="M 74 80 L 84 83 V 105 H 76 Z M 111 67 L 118 65 V 103 H 110 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="2.5" stroke-linejoin="round"/>`,
      `<path d="M 70 104 H 88 V 112 H 68 Z M 106 101 H 122 V 109 H 105 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="2.5" stroke-linejoin="round"/>`,
      `<circle cx="55" cy="91" r="1.6" fill="${diagnostic}"/>`,
    ].join('');
  }

  if (study === 'console-bridge') {
    return [
      `<ellipse cx="64" cy="112" rx="54" ry="6" fill="#00000022"/>`,
      `<path d="M 12 39 L 23 29 H 36 V 102 L 26 110 H 12 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3.5" stroke-linejoin="round"/>`,
      `<path d="M 36 29 L 43 36 V 103 L 36 102 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3" stroke-linejoin="round"/>`,
      `<path d="M 86 33 L 96 24 H 108 V 100 L 99 108 H 86 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3.5" stroke-linejoin="round"/>`,
      `<path d="M 108 24 L 116 32 V 102 L 108 100 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3" stroke-linejoin="round"/>`,
      `<path d="M 23 29 L 30 23 H 39 L 43 29 H 36 Z M 96 24 L 102 18 H 111 L 116 24 H 108 Z" fill="#EDF0ED" stroke="${COLORS.ink}" stroke-width="2.7" stroke-linejoin="round"/>`,
      `<rect x="30" y="40" width="5" height="11" rx="2" fill="${COLORS.panelMetal}" stroke="${COLORS.ink}" stroke-width="1.5"/>`,
      `<rect x="31.5" y="42" width="2" height="6" rx="1" fill="${optic}"/>`,
      `<path d="M 31 66 L 91 52 L 105 62 L 44 79 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.3" stroke-linejoin="round"/>`,
      `<path d="M 44 66 L 88 56 L 96 62 L 51 73 Z" fill="${screen}" stroke="#53605A" stroke-width="1.5" stroke-linejoin="round"/>`,
      `<path d="M 57 65 L 80 59" stroke="${neutralTrace}" stroke-width="1.8"/>`,
      `<path d="M 43 79 L 50 80 V 103 H 43 Z M 97 64 L 105 62 V 101 H 98 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="2.5" stroke-linejoin="round"/>`,
      `<path d="M 37 102 H 55 V 111 H 36 Z M 93 99 H 111 V 108 H 92 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="2.5" stroke-linejoin="round"/>`,
      `<circle cx="103" cy="91" r="1.6" fill="${diagnostic}"/>`,
    ].join('');
  }

  return [
    `<ellipse cx="64" cy="112" rx="54" ry="6" fill="#00000022"/>`,
    `<path d="M 12 42 L 26 29 H 99 L 116 41 V 68 L 100 80 H 27 L 12 70 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3.6" stroke-linejoin="round"/>`,
    `<path d="M 26 29 L 36 22 H 99 L 116 34 V 41 L 99 29 Z" fill="#EDF0ED" stroke="${COLORS.ink}" stroke-width="3" stroke-linejoin="round"/>`,
    `<path d="M 22 45 L 99 34 V 69 L 91 74 H 22 Z" fill="#C9D0CC" stroke="#858F8A" stroke-width="1.5" stroke-linejoin="round"/>`,
    `<path d="M 34 43 V 71 M 89 35 V 70" stroke="#F6F7F4" stroke-width="1.8" opacity=".68"/>`,
    `<rect x="31" y="37" width="12" height="6" rx="2.5" fill="${COLORS.panelMetal}" stroke="${COLORS.ink}" stroke-width="1.5" transform="rotate(-7 37 40)"/>`,
    `<rect x="35" y="38.5" width="5" height="2.5" rx="1.2" fill="${optic}" transform="rotate(-7 37.5 39.75)"/>`,
    `<path d="M 49 75 L 83 66 L 98 76 L 64 87 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.2" stroke-linejoin="round"/>`,
    `<path d="M 58 76 L 81 70 L 89 76 L 65 82 Z" fill="${screen}" stroke="#53605A" stroke-width="1.4" stroke-linejoin="round"/>`,
    `<path d="M 67 76 L 79 73" stroke="${neutralTrace}" stroke-width="1.7"/>`,
    `<path d="M 64 87 L 86 81 V 104 L 73 111 H 60 V 93 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="2.8" stroke-linejoin="round"/>`,
    `<path d="M 58 107 H 79 V 115 H 57 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="2.5" stroke-linejoin="round"/>`,
    `<path d="M 17 105 H 40 V 113 H 15 Z M 96 102 H 119 V 110 H 94 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="2.5" stroke-linejoin="round"/>`,
    `<circle cx="104" cy="64" r="1.6" fill="${diagnostic}"/>`,
  ].join('');
}

function spatialResetApparatusSvg(
  study: SpatialResetId,
  live: boolean,
): string {
  return svgDocument(spatialResetApparatusMarkup(study, live));
}

function gamifiedApparatusMarkup(
  study: GamifiedStudyId,
  live: boolean,
): string {
  const optic = live ? COLORS.green : '#3C4440';
  const screen = live ? '#18211E' : '#1D2421';
  const trace = live ? '#BFC8C3' : '#59615D';
  const shadow = `<ellipse cx="64" cy="119" rx="56" ry="5" fill="#00000024"/>`;
  const base = `<path d="M 7 108 H 121 V 118 H 7 Z" fill="${COLORS.dark}" stroke="${COLORS.ink}" stroke-width="3" stroke-linejoin="round"/>`;

  if (study === 'nes-risk-control') {
    return [
      shadow,
      `<path d="M 12 108 V 27 L 20 19 H 49 V 108 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.5" stroke-linejoin="round"/>`,
      `<path d="M 78 108 V 25 L 86 17 H 114 V 108 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.5" stroke-linejoin="round"/>`,
      `<path d="M 49 26 H 78 V 108 H 49 Z" fill="${COLORS.dark}" stroke="${COLORS.ink}" stroke-width="3"/>`,
      `<path d="M 57 33 H 70 V 101" fill="none" stroke="#505955" stroke-width="3"/>`,
      `<rect x="98" y="43" width="5" height="15" rx="2" fill="${COLORS.panelMetal}" stroke="${COLORS.ink}" stroke-width="1.4"/>`,
      `<rect x="99.5" y="46" width="2" height="8" rx="1" fill="${optic}"/>`,
      `<path d="M 42 67 H 86 L 93 76 L 82 89 H 46 L 35 78 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3" stroke-linejoin="round"/>`,
      `<path d="M 48 71 H 80 L 85 76 L 78 83 H 49 L 43 78 Z" fill="${screen}" stroke="#53605A" stroke-width="1.4"/>`,
      `<path d="M 56 77 H 73" stroke="${trace}" stroke-width="1.5"/>`,
      `<path d="M 58 88 H 72 V 106 H 58 Z" fill="${COLORS.dark}" stroke="${COLORS.ink}" stroke-width="2.5"/>`,
      base,
    ].join('');
  }

  if (study === 'offset-core') {
    return [
      shadow,
      `<path d="M 10 108 V 42 L 17 34 H 43 V 108 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.5" stroke-linejoin="round"/>`,
      `<path d="M 67 108 V 25 L 76 16 H 115 V 108 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.6" stroke-linejoin="round"/>`,
      `<path d="M 43 31 H 68 V 108 H 43 Z" fill="${COLORS.dark}" stroke="${COLORS.ink}" stroke-width="3"/>`,
      `<path d="M 50 39 H 60 V 102" fill="none" stroke="#505955" stroke-width="3"/>`,
      `<rect x="81" y="37" width="5" height="14" rx="2" fill="${COLORS.panelMetal}" stroke="${COLORS.ink}" stroke-width="1.4"/>`,
      `<rect x="82.5" y="40" width="2" height="8" rx="1" fill="${optic}"/>`,
      `<path d="M 22 68 L 54 60 L 70 68 L 38 80 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3" stroke-linejoin="round"/>`,
      `<path d="M 31 68 L 52 63 L 61 68 L 39 75 Z" fill="${screen}" stroke="#53605A" stroke-width="1.4"/>`,
      `<path d="M 40 68 L 51 65" stroke="${trace}" stroke-width="1.5"/>`,
      `<path d="M 54 60 H 66 V 91 H 58 L 52 82 Z" fill="${COLORS.dark}" stroke="${COLORS.ink}" stroke-width="2.5" stroke-linejoin="round"/>`,
      base,
    ].join('');
  }

  if (study === 'side-console') {
    return [
      shadow,
      `<path d="M 10 108 V 31 L 18 23 H 48 V 108 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.5" stroke-linejoin="round"/>`,
      `<path d="M 72 108 V 22 L 80 14 H 111 V 108 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.6" stroke-linejoin="round"/>`,
      `<path d="M 48 28 H 72 V 108 H 48 Z" fill="${COLORS.dark}" stroke="${COLORS.ink}" stroke-width="3"/>`,
      `<path d="M 55 36 H 65 V 101" fill="none" stroke="#505955" stroke-width="3"/>`,
      `<rect x="86" y="34" width="5" height="14" rx="2" fill="${COLORS.panelMetal}" stroke="${COLORS.ink}" stroke-width="1.4"/>`,
      `<rect x="87.5" y="37" width="2" height="8" rx="1" fill="${optic}"/>`,
      `<path d="M 85 61 L 111 55 L 123 63 L 98 74 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3" stroke-linejoin="round"/>`,
      `<path d="M 92 62 L 109 58 L 116 63 L 99 69 Z" fill="${screen}" stroke="#53605A" stroke-width="1.4"/>`,
      `<path d="M 100 62 L 109 60" stroke="${trace}" stroke-width="1.5"/>`,
      `<path d="M 86 64 H 99 V 94 H 91 L 85 85 Z" fill="${COLORS.dark}" stroke="${COLORS.ink}" stroke-width="2.5" stroke-linejoin="round"/>`,
      base,
    ].join('');
  }

  if (study === 'weighted-pair') {
    return [
      shadow,
      `<path d="M 13 108 V 39 L 21 31 H 44 V 108 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.5" stroke-linejoin="round"/>`,
      `<path d="M 74 108 V 23 L 84 13 H 116 V 108 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.7" stroke-linejoin="round"/>`,
      `<path d="M 44 29 H 74 V 108 H 44 Z" fill="${COLORS.dark}" stroke="${COLORS.ink}" stroke-width="3"/>`,
      `<path d="M 53 37 H 66 V 101" fill="none" stroke="#505955" stroke-width="3"/>`,
      `<rect x="98" y="34" width="5" height="15" rx="2" fill="${COLORS.panelMetal}" stroke="${COLORS.ink}" stroke-width="1.4"/>`,
      `<rect x="99.5" y="37" width="2" height="8" rx="1" fill="${optic}"/>`,
      `<path d="M 42 67 H 86 L 93 76 L 82 89 H 46 L 35 78 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3" stroke-linejoin="round"/>`,
      `<path d="M 48 71 H 80 L 85 76 L 78 83 H 49 L 43 78 Z" fill="${screen}" stroke="#53605A" stroke-width="1.4"/>`,
      `<path d="M 56 77 H 73" stroke="${trace}" stroke-width="1.5"/>`,
      `<path d="M 58 88 H 72 V 106 H 58 Z" fill="${COLORS.dark}" stroke="${COLORS.ink}" stroke-width="2.5"/>`,
      base,
    ].join('');
  }

  if (study === 'backset-pair') {
    return [
      shadow,
      `<path d="M 13 108 V 37 L 22 28 H 47 V 108 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3.5" stroke-linejoin="round"/>`,
      `<path d="M 13 37 L 22 28 H 47 L 40 37 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="2.4" stroke-linejoin="round"/>`,
      `<path d="M 76 108 V 27 L 86 17 H 114 V 108 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.7" stroke-linejoin="round"/>`,
      `<path d="M 47 27 H 76 V 108 H 47 Z" fill="${COLORS.dark}" stroke="${COLORS.ink}" stroke-width="3"/>`,
      `<path d="M 55 35 H 68 V 101" fill="none" stroke="#505955" stroke-width="3"/>`,
      `<path d="M 76 27 L 86 17 H 114 L 105 27 Z" fill="#EEF1ED" stroke="${COLORS.ink}" stroke-width="2.4" stroke-linejoin="round"/>`,
      `<rect x="97" y="38" width="5" height="15" rx="2" fill="${COLORS.panelMetal}" stroke="${COLORS.ink}" stroke-width="1.4"/>`,
      `<rect x="98.5" y="41" width="2" height="8" rx="1" fill="${optic}"/>`,
      `<path d="M 42 67 H 86 L 93 76 L 82 89 H 46 L 35 78 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3" stroke-linejoin="round"/>`,
      `<path d="M 48 71 H 80 L 85 76 L 78 83 H 49 L 43 78 Z" fill="${screen}" stroke="#53605A" stroke-width="1.4"/>`,
      `<path d="M 56 77 H 73" stroke="${trace}" stroke-width="1.5"/>`,
      `<path d="M 58 88 H 72 V 106 H 58 Z" fill="${COLORS.dark}" stroke="${COLORS.ink}" stroke-width="2.5"/>`,
      base,
    ].join('');
  }

  if (study === 'asymmetric-sheath') {
    return [
      shadow,
      `<path d="M 12 108 V 29 L 20 21 H 49 V 108 Z" fill="#4C5551" stroke="${COLORS.ink}" stroke-width="3.5" stroke-linejoin="round"/>`,
      `<path d="M 18 29 L 25 22 H 49 V 32 H 18 Z" fill="#69736E" stroke="${COLORS.ink}" stroke-width="2.2" stroke-linejoin="round"/>`,
      `<path d="M 78 108 V 25 L 86 17 H 115 V 108 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.7" stroke-linejoin="round"/>`,
      `<path d="M 49 27 H 78 V 108 H 49 Z" fill="${COLORS.dark}" stroke="${COLORS.ink}" stroke-width="3"/>`,
      `<path d="M 57 35 H 70 V 101" fill="none" stroke="#66706B" stroke-width="3"/>`,
      `<path d="M 24 44 H 42 V 96" fill="none" stroke="#7C8781" stroke-width="2.2"/>`,
      `<rect x="98" y="40" width="5" height="15" rx="2" fill="${COLORS.panelMetal}" stroke="${COLORS.ink}" stroke-width="1.4"/>`,
      `<rect x="99.5" y="43" width="2" height="8" rx="1" fill="${optic}"/>`,
      `<path d="M 42 67 H 86 L 93 76 L 82 89 H 46 L 35 78 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3" stroke-linejoin="round"/>`,
      `<path d="M 48 71 H 80 L 85 76 L 78 83 H 49 L 43 78 Z" fill="${screen}" stroke="#53605A" stroke-width="1.4"/>`,
      `<path d="M 56 77 H 73" stroke="${trace}" stroke-width="1.5"/>`,
      `<path d="M 58 88 H 72 V 106 H 58 Z" fill="${COLORS.dark}" stroke="${COLORS.ink}" stroke-width="2.5"/>`,
      base,
    ].join('');
  }

  if (study === 'hybrid-dark-shoulder') {
    return [
      shadow,
      `<path d="M 13 108 V 39 L 21 31 H 44 V 108 Z" fill="#4C5551" stroke="${COLORS.ink}" stroke-width="3.5" stroke-linejoin="round"/>`,
      `<path d="M 15 39 L 22 33 H 43" fill="none" stroke="#76807B" stroke-width="2.2" stroke-linejoin="round"/>`,
      `<path d="M 74 108 V 23 L 84 13 H 116 V 108 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.7" stroke-linejoin="round"/>`,
      `<path d="M 44 29 H 74 V 108 H 44 Z" fill="${COLORS.dark}" stroke="${COLORS.ink}" stroke-width="3"/>`,
      `<path d="M 53 37 H 66 V 101" fill="none" stroke="#505955" stroke-width="3"/>`,
      `<path d="M 21 50 H 37 V 98" fill="none" stroke="#77817C" stroke-width="2.2"/>`,
      `<rect x="98" y="34" width="5" height="15" rx="2" fill="${COLORS.panelMetal}" stroke="${COLORS.ink}" stroke-width="1.4"/>`,
      `<rect x="99.5" y="37" width="2" height="8" rx="1" fill="${optic}"/>`,
      `<path d="M 42 67 H 86 L 93 76 L 82 89 H 46 L 35 78 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3" stroke-linejoin="round"/>`,
      `<path d="M 48 71 H 80 L 85 76 L 78 83 H 49 L 43 78 Z" fill="${screen}" stroke="#53605A" stroke-width="1.4"/>`,
      `<path d="M 56 77 H 73" stroke="${trace}" stroke-width="1.5"/>`,
      `<path d="M 58 88 H 72 V 106 H 58 Z" fill="${COLORS.dark}" stroke="${COLORS.ink}" stroke-width="2.5"/>`,
      base,
    ].join('');
  }

  if (study === 'hybrid-register-cap') {
    return [
      shadow,
      `<path d="M 13 108 V 39 L 21 31 H 44 V 108 Z" fill="#4C5551" stroke="${COLORS.ink}" stroke-width="3.5" stroke-linejoin="round"/>`,
      `<path d="M 14 39 L 22 32 H 43 V 45 H 14 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="2.2" stroke-linejoin="round"/>`,
      `<path d="M 74 108 V 23 L 84 13 H 116 V 108 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.7" stroke-linejoin="round"/>`,
      `<path d="M 44 29 H 74 V 108 H 44 Z" fill="${COLORS.dark}" stroke="${COLORS.ink}" stroke-width="3"/>`,
      `<path d="M 53 37 H 66 V 101" fill="none" stroke="#505955" stroke-width="3"/>`,
      `<path d="M 21 53 H 37 V 98" fill="none" stroke="#77817C" stroke-width="2.2"/>`,
      `<rect x="98" y="34" width="5" height="15" rx="2" fill="${COLORS.panelMetal}" stroke="${COLORS.ink}" stroke-width="1.4"/>`,
      `<rect x="99.5" y="37" width="2" height="8" rx="1" fill="${optic}"/>`,
      `<path d="M 42 67 H 86 L 93 76 L 82 89 H 46 L 35 78 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3" stroke-linejoin="round"/>`,
      `<path d="M 48 71 H 80 L 85 76 L 78 83 H 49 L 43 78 Z" fill="${screen}" stroke="#53605A" stroke-width="1.4"/>`,
      `<path d="M 56 77 H 73" stroke="${trace}" stroke-width="1.5"/>`,
      `<path d="M 58 88 H 72 V 106 H 58 Z" fill="${COLORS.dark}" stroke="${COLORS.ink}" stroke-width="2.5"/>`,
      base,
    ].join('');
  }

  if (study === 'hybrid-framed-sheath') {
    return [
      shadow,
      `<path d="M 13 108 V 39 L 21 31 H 44 V 108 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3.5" stroke-linejoin="round"/>`,
      `<path d="M 19 43 L 24 38 H 39 V 103 H 19 Z" fill="#4C5551" stroke="${COLORS.ink}" stroke-width="2.2" stroke-linejoin="round"/>`,
      `<path d="M 24 50 H 35 V 96" fill="none" stroke="#76807B" stroke-width="2"/>`,
      `<path d="M 74 108 V 23 L 84 13 H 116 V 108 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.7" stroke-linejoin="round"/>`,
      `<path d="M 44 29 H 74 V 108 H 44 Z" fill="${COLORS.dark}" stroke="${COLORS.ink}" stroke-width="3"/>`,
      `<path d="M 53 37 H 66 V 101" fill="none" stroke="#505955" stroke-width="3"/>`,
      `<rect x="98" y="34" width="5" height="15" rx="2" fill="${COLORS.panelMetal}" stroke="${COLORS.ink}" stroke-width="1.4"/>`,
      `<rect x="99.5" y="37" width="2" height="8" rx="1" fill="${optic}"/>`,
      `<path d="M 42 67 H 86 L 93 76 L 82 89 H 46 L 35 78 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3" stroke-linejoin="round"/>`,
      `<path d="M 48 71 H 80 L 85 76 L 78 83 H 49 L 43 78 Z" fill="${screen}" stroke="#53605A" stroke-width="1.4"/>`,
      `<path d="M 56 77 H 73" stroke="${trace}" stroke-width="1.5"/>`,
      `<path d="M 58 88 H 72 V 106 H 58 Z" fill="${COLORS.dark}" stroke="${COLORS.ink}" stroke-width="2.5"/>`,
      base,
    ].join('');
  }

  if (
    study === 'detail-r1-control' ||
    study === 'detail-spine-depth' ||
    study === 'detail-service-register' ||
    study === 'detail-integrated'
  ) {
    const hasSpineDepth = study === 'detail-spine-depth' || study === 'detail-integrated';
    const hasServiceRegister = study === 'detail-service-register' || study === 'detail-integrated';
    const stateTrace = study === 'detail-integrated' && live ? COLORS.green : trace;
    const spineArticulation = hasSpineDepth
      ? [
          `<path d="M 50 33 H 68 V 106 H 50 Z" fill="#27302D" stroke="#111714" stroke-width="2.2"/>`,
          `<path d="M 50 33 L 55 28 H 73 L 68 33 Z" fill="#46504B" stroke="${COLORS.ink}" stroke-width="2" stroke-linejoin="round"/>`,
          `<path d="M 56 41 H 63 V 99" fill="none" stroke="#5B6560" stroke-width="2.4"/>`,
        ].join('')
      : `<path d="M 53 37 H 66 V 101" fill="none" stroke="#505955" stroke-width="3"/>`;
    const serviceRegister = hasServiceRegister
      ? `<path d="M 80 64 H 101 L 108 57 H 113" fill="none" stroke="#ABB3AF" stroke-width="1.8" stroke-linejoin="round"/>`
      : '';
    return [
      shadow,
      `<path d="M 13 108 V 39 L 21 31 H 44 V 108 Z" fill="#4C5551" stroke="${COLORS.ink}" stroke-width="3.5" stroke-linejoin="round"/>`,
      `<path d="M 15 39 L 22 33 H 43" fill="none" stroke="#76807B" stroke-width="2.2" stroke-linejoin="round"/>`,
      `<path d="M 74 108 V 23 L 84 13 H 116 V 108 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.7" stroke-linejoin="round"/>`,
      `<path d="M 44 29 H 74 V 108 H 44 Z" fill="${COLORS.dark}" stroke="${COLORS.ink}" stroke-width="3"/>`,
      spineArticulation,
      `<path d="M 21 50 H 37 V 98" fill="none" stroke="#77817C" stroke-width="2.2"/>`,
      serviceRegister,
      `<rect x="98" y="34" width="5" height="15" rx="2" fill="${COLORS.panelMetal}" stroke="${COLORS.ink}" stroke-width="1.4"/>`,
      `<rect x="99.5" y="37" width="2" height="8" rx="1" fill="${optic}"/>`,
      `<path d="M 42 67 H 86 L 93 76 L 82 89 H 46 L 35 78 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3" stroke-linejoin="round"/>`,
      `<path d="M 48 71 H 80 L 85 76 L 78 83 H 49 L 43 78 Z" fill="${screen}" stroke="#53605A" stroke-width="1.4"/>`,
      `<path d="M 56 77 H 73" stroke="${stateTrace}" stroke-width="1.5"/>`,
      `<path d="M 58 88 H 72 V 106 H 58 Z" fill="${COLORS.dark}" stroke="${COLORS.ink}" stroke-width="2.5"/>`,
      base,
    ].join('');
  }

  return [
    shadow,
    `<path d="M 12 108 V 27 L 21 17 H 69 V 108 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.7" stroke-linejoin="round"/>`,
    `<path d="M 69 29 H 92 V 108 H 69 Z" fill="${COLORS.dark}" stroke="${COLORS.ink}" stroke-width="3"/>`,
    `<path d="M 92 108 V 63 L 99 56 H 115 V 108 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3.4" stroke-linejoin="round"/>`,
    `<path d="M 76 37 H 86 V 102" fill="none" stroke="#505955" stroke-width="3"/>`,
    `<rect x="51" y="36" width="5" height="14" rx="2" fill="${COLORS.panelMetal}" stroke="${COLORS.ink}" stroke-width="1.4"/>`,
    `<rect x="52.5" y="39" width="2" height="8" rx="1" fill="${optic}"/>`,
    `<path d="M 83 57 L 108 50 L 122 58 L 97 69 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3" stroke-linejoin="round"/>`,
    `<path d="M 90 57 L 107 53 L 115 58 L 98 64 Z" fill="${screen}" stroke="#53605A" stroke-width="1.4"/>`,
    `<path d="M 98 57 L 107 55" stroke="${trace}" stroke-width="1.5"/>`,
    `<path d="M 82 59 H 96 V 90 H 88 L 82 82 Z" fill="${COLORS.dark}" stroke="${COLORS.ink}" stroke-width="2.5" stroke-linejoin="round"/>`,
    base,
  ].join('');
}

function gamifiedApparatusSvg(
  study: GamifiedStudyId,
  live: boolean,
): string {
  return svgDocument(gamifiedApparatusMarkup(study, live));
}

function refinedPierDockMarkup(
  refinement: PierRefinementId,
  active = true,
): string {
  if (refinement === 'accepted-b') {
    return dockMarkup('certified-pier', active);
  }
  const status = active ? COLORS.green : '#414945';
  const shadow = `<ellipse cx="64" cy="94" rx="34" ry="8" fill="#00000022"/>`;

  if (refinement === 'sealed-register') {
    return [
      shadow,
      `<rect x="28" y="34" width="72" height="66" rx="7" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3.4"/>`,
      `<rect x="39" y="45" width="50" height="44" rx="4" fill="${COLORS.panelMetal}" stroke="#87908C" stroke-width="1.5"/>`,
      `<rect x="32" y="38" width="16" height="10" rx="2.5" fill="${COLORS.shell}"/><rect x="80" y="38" width="16" height="10" rx="2.5" fill="${COLORS.shell}"/>`,
      `<rect x="32" y="86" width="16" height="10" rx="2.5" fill="${COLORS.shell}"/><rect x="80" y="86" width="16" height="10" rx="2.5" fill="${COLORS.shell}"/>`,
      `<path d="M 47 67 H 81 M 64 49 V 84" stroke="${COLORS.dark}" stroke-width="5.5" stroke-linecap="round"/>`,
      `<rect x="60" y="91" width="8" height="4" rx="2" fill="${status}"/>`,
    ].join('');
  }

  if (refinement === 'service-aperture') {
    return [
      shadow,
      `<path d="M 28 37 H 100 V 95 L 94 101 H 34 L 28 95 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3.4" stroke-linejoin="round"/>`,
      `<path d="M 37 46 H 91 V 86 H 37 Z" fill="${COLORS.panelMetal}" stroke="#87908C" stroke-width="1.5"/>`,
      `<rect x="33" y="41" width="15" height="10" rx="2.5" fill="${COLORS.shell}"/><rect x="80" y="41" width="15" height="10" rx="2.5" fill="${COLORS.shell}"/>`,
      `<path d="M 44 54 V 83 M 84 54 V 83" stroke="${COLORS.shell}" stroke-width="5.5" stroke-linecap="round"/>`,
      `<path d="M 52 76 H 76 L 80 96 H 48 Z" fill="${COLORS.dark}" stroke="${COLORS.ink}" stroke-width="1.8" stroke-linejoin="round"/>`,
      `<rect x="60" y="91" width="8" height="4" rx="2" fill="${status}"/>`,
    ].join('');
  }

  return [
    shadow,
    `<path d="M 26 36 H 102 V 91 L 96 101 H 32 L 26 91 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3.5" stroke-linejoin="round"/>`,
    `<path d="M 34 45 H 94 V 84 H 34 Z" fill="${COLORS.panelMetal}" stroke="#87908C" stroke-width="1.5"/>`,
    `<rect x="30" y="40" width="20" height="12" rx="3" fill="${COLORS.shell}"/><rect x="78" y="40" width="20" height="12" rx="3" fill="${COLORS.shell}"/>`,
    `<rect x="30" y="82" width="20" height="12" rx="3" fill="${COLORS.shell}"/><rect x="78" y="82" width="20" height="12" rx="3" fill="${COLORS.shell}"/>`,
    `<path d="M 46 64 H 82 M 64 49 V 83" stroke="${COLORS.dark}" stroke-width="6" stroke-linecap="round"/>`,
    `<path d="M 38 96 H 90 L 84 105 H 44 Z" fill="#AAB3AE" stroke="${COLORS.ink}" stroke-width="2.4" stroke-linejoin="round"/>`,
    `<circle cx="64" cy="98" r="3" fill="${status}"/>`,
  ].join('');
}

function refinedPierDockSvg(
  refinement: PierRefinementId,
  active = true,
): string {
  return svgDocument(refinedPierDockMarkup(refinement, active));
}

function refinedPierCrewOverlay(
  refinement: PierRefinementId,
  facing: Facing | 'west',
): string {
  if (refinement === 'accepted-b') {
    return crewOverlay('certified-pier', facing);
  }

  const profile = facing === 'east' || facing === 'west';
  const mirror = facing === 'west' ? ' transform="matrix(-1 0 0 1 128 0)"' : '';
  const rear = facing === 'north';
  const opticX = profile ? 73 : 64;
  const optic = rear ? '#87A493' : COLORS.green;

  if (refinement === 'sealed-register') {
    const torso = profile
      ? `<path d="M 50 59 H 79 L 82 106 L 76 114 H 51 L 47 105 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3" stroke-linejoin="round"/>`
      : `<path d="M 43 63 L 49 57 H 79 L 85 63 L 84 106 L 77 114 H 51 L 44 106 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3" stroke-linejoin="round"/>`;
    return (
      `<g${mirror}>` +
      `<path d="M 44 17 L 51 9 H 78 L 85 17 V 46 L 78 54 H 50 L 43 46 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.2" stroke-linejoin="round"/>` +
      `<path d="M 49 25 H 81 V 41 H 49 Z" fill="${COLORS.panelMetal}" stroke="${COLORS.dark}" stroke-width="1.5"/>` +
      `<circle cx="${opticX}" cy="33" r="3.2" fill="${optic}"/>` +
      torso +
      `<path d="M ${profile ? 56 : 51} 66 H ${profile ? 76 : 77}" stroke="${COLORS.shell}" stroke-width="4.5" stroke-linecap="square"/>` +
      `<path d="M ${profile ? 61 : 57} 70 V 102" stroke="#EEF1EC" stroke-width="2.5" opacity=".68"/>` +
      `<rect x="${profile ? 68 : 58}" y="102" width="${profile ? 8 : 12}" height="6" rx="1.5" fill="${COLORS.panelMetal}"/>` +
      `</g>`
    );
  }

  if (refinement === 'service-aperture') {
    const torso = profile
      ? `<path d="M 49 60 H 80 L 84 105 L 77 114 H 50 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3" stroke-linejoin="round"/>`
      : `<path d="M 40 64 L 48 57 H 80 L 88 64 L 85 106 L 78 114 H 50 L 43 106 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3" stroke-linejoin="round"/>`;
    return (
      `<g${mirror}>` +
      `<path d="M 42 17 L 50 9 H 78 L 87 17 V 46 L 79 54 H 49 L 41 46 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.2" stroke-linejoin="round"/>` +
      `<path d="M 47 24 H 82 L 79 42 H 49 Z" fill="${COLORS.panelMetal}" stroke="${COLORS.dark}" stroke-width="1.5" stroke-linejoin="round"/>` +
      `<circle cx="${opticX}" cy="33" r="3.3" fill="${optic}"/>` +
      torso +
      `<path d="M ${profile ? 53 : 48} 67 H ${profile ? 77 : 80}" stroke="${COLORS.shell}" stroke-width="5" stroke-linecap="square"/>` +
      `<rect x="${profile ? 57 : 54}" y="75" width="${profile ? 18 : 20}" height="17" rx="2" fill="${COLORS.panelMetal}" stroke="${COLORS.dark}" stroke-width="1.4"/>` +
      `<path d="M ${profile ? 61 : 58} 81 H ${profile ? 72 : 70}" stroke="#AAB5AF" stroke-width="1.5"/>` +
      `<rect x="${profile ? 67 : 57}" y="102" width="${profile ? 9 : 14}" height="6" rx="1.5" fill="${COLORS.panelMetal}"/>` +
      `</g>`
    );
  }

  const torso = profile
    ? `<path d="M 48 60 H 81 L 86 103 L 78 114 H 49 L 43 103 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3.2" stroke-linejoin="round"/>`
    : `<path d="M 39 64 L 47 57 H 81 L 90 64 L 87 103 L 79 114 H 49 L 41 103 Z" fill="${COLORS.shellShade}" stroke="${COLORS.ink}" stroke-width="3.2" stroke-linejoin="round"/>`;
  return (
    `<g${mirror}>` +
    `<path d="M 41 18 L 49 9 H 79 L 88 18 V 46 L 80 54 H 48 L 40 46 Z" fill="${COLORS.shell}" stroke="${COLORS.ink}" stroke-width="3.3" stroke-linejoin="round"/>` +
    `<path d="M 46 25 H 83 V 41 H 46 Z" fill="${COLORS.panelMetal}" stroke="${COLORS.dark}" stroke-width="1.5"/>` +
    `<circle cx="${opticX}" cy="33" r="3.3" fill="${optic}"/>` +
    torso +
    `<path d="M ${profile ? 51 : 46} 67 H ${profile ? 79 : 82}" stroke="${COLORS.shell}" stroke-width="6" stroke-linecap="square"/>` +
    `<path d="M ${profile ? 58 : 54} 101 H ${profile ? 79 : 75}" stroke="${COLORS.panelMetal}" stroke-width="8" stroke-linecap="square"/>` +
    `<path d="M ${profile ? 60 : 64} 72 V 98" stroke="#EEF1EC" stroke-width="2.5" opacity=".65"/>` +
    `</g>`
  );
}

function refinedPierCrewSvg(
  refinement: PierRefinementId,
  facing: Facing | 'west',
  pose: Pose = 'neutral',
): string {
  return svgDocument(
    svgInner(currentCrewSvg(facing, pose)) +
    refinedPierCrewOverlay(refinement, facing),
  );
}

function directionProp(
  direction: DirectionId | 'current',
  kind: 'apparatus-live' | 'apparatus-dormant' | 'dock',
): string {
  if (direction === 'current') {
    if (kind === 'apparatus-live') return composeCurrentProp(LIVE);
    if (kind === 'apparatus-dormant') return composeCurrentProp(DORMANT);
    return composeCurrentProp(DOCK);
  }
  if (kind === 'apparatus-live') return apparatusSvg(direction, true);
  if (kind === 'apparatus-dormant') return apparatusSvg(direction, false);
  return dockSvg(direction);
}

function directionCrew(
  direction: DirectionId | 'current',
  facing: Facing | 'west',
  pose: Pose = 'neutral',
): string {
  return direction === 'current'
    ? currentCrewSvg(facing, pose)
    : proposalCrewSvg(direction, facing, pose);
}

const wallCache = new Map<string, string>();

function wallTile(
  maskIndex: number,
  x: number,
  y: number,
  size: number,
  flipX = false,
  opacity = 1,
): string {
  const key = `${maskIndex}:${flipX}`;
  let markup = wallCache.get(key);
  if (!markup) {
    const source = composeWallTile(
      WALL,
      STYLE,
      BLOB_CONFIGS[maskIndex],
      CANVAS,
    );
    const inner = svgInner(source);
    markup = flipX
      ? `<g transform="matrix(-1 0 0 1 128 0)">${inner}</g>`
      : inner;
    wallCache.set(key, markup);
  }
  return (
    `<svg x="${x}" y="${y}" width="${size}" height="${size}" ` +
    `viewBox="0 0 128 128" preserveAspectRatio="none" overflow="hidden" opacity="${opacity}">` +
    markup +
    '</svg>'
  );
}

function drawGrid(
  parts: string[],
  x: number,
  y: number,
  columns: number,
  rows: number,
  cell: number,
  dark = false,
): void {
  const fill = dark ? '#303936' : COLORS.floor;
  const stroke = dark ? '#64706B' : COLORS.floorLine;
  parts.push(
    `<rect x="${x}" y="${y}" width="${columns * cell}" height="${rows * cell}" ` +
    `fill="${fill}" stroke="#56616A" stroke-width="2"/>`,
  );
  for (let column = 1; column < columns; column++) {
    parts.push(line(`M ${x + column * cell} ${y} V ${y + rows * cell}`, stroke, 1, dark ? .13 : .18));
  }
  for (let row = 1; row < rows; row++) {
    parts.push(line(`M ${x} ${y + row * cell} H ${x + columns * cell}`, stroke, 1, dark ? .13 : .18));
  }
}

function drawLot(
  parts: string[],
  x: number,
  y: number,
  columns: number,
  rows: number,
  cell: number,
): void {
  parts.push(
    `<rect x="${x}" y="${y}" width="${columns * cell}" height="${rows * cell}" ` +
    `fill="${COLORS.lot}" stroke="#5F5C53" stroke-width="2"/>`,
  );
  for (let column = 1; column < columns; column++) {
    parts.push(line(`M ${x + column * cell} ${y} V ${y + rows * cell}`, COLORS.lotLine, 1, .25));
  }
  for (let row = 1; row < rows; row++) {
    parts.push(line(`M ${x} ${y + row * cell} H ${x + columns * cell}`, COLORS.lotLine, 1, .25));
  }
  for (let index = 0; index < columns * rows; index += 3) {
    const sx = x + ((index * 37) % (columns * cell - 20)) + 10;
    const sy = y + ((index * 19) % (rows * cell - 20)) + 10;
    parts.push(line(`M ${sx} ${sy} l 5 -2`, '#B7B09F', 1, .42));
  }
}

function drawWalls(
  parts: string[],
  x: number,
  y: number,
  columns: number,
  rows: number,
  cell: number,
  layer: 'back' | 'front',
  opacity = 1,
): void {
  if (layer === 'back') {
    parts.push(wallTile(6, x, y, cell, false, opacity));
    for (let column = 1; column < columns - 1; column++) {
      parts.push(wallTile(10, x + column * cell, y, cell, false, opacity));
    }
    parts.push(wallTile(12, x + (columns - 1) * cell, y, cell, false, opacity));
    for (let row = 1; row < rows - 1; row++) {
      parts.push(
        wallTile(5, x, y + row * cell, cell, false, opacity),
        wallTile(5, x + (columns - 1) * cell, y + row * cell, cell, true, opacity),
      );
    }
    return;
  }
  parts.push(wallTile(3, x, y + (rows - 1) * cell, cell, false, opacity));
  for (let column = 1; column < columns - 1; column++) {
    parts.push(wallTile(10, x + column * cell, y + (rows - 1) * cell, cell, false, opacity));
  }
  parts.push(wallTile(9, x + (columns - 1) * cell, y + (rows - 1) * cell, cell, false, opacity));
}

function occupancyGuide(
  x: number,
  y: number,
  width: number,
  height: number,
  color: string = COLORS.occupancy,
): string {
  return (
    `<rect x="${x + 3}" y="${y + 3}" width="${width - 6}" height="${height - 6}" ` +
    `rx="5" fill="${color}" fill-opacity=".08" stroke="${color}" stroke-width="1.5" ` +
    'stroke-dasharray="6 5"/>'
  );
}

function propPlacement(
  templateId: string,
  footprintX: number,
  footprintY: number,
  cell: number,
  guide = false,
): string {
  const propTemplate = template(templateId);
  const prop = requiredProp(templateId);
  const source = composeCurrentProp(prop);
  const footprintWidth = propTemplate.gridFootprint.w * cell;
  const footprintHeight = propTemplate.gridFootprint.h * cell;
  const x = footprintX + (footprintWidth - cell) / 2;
  const y = propTemplate.projection === 'plan'
    ? footprintY + (footprintHeight - cell) / 2
    : footprintY + footprintHeight - cell * (116 / CANVAS);
  return (
    (guide ? occupancyGuide(footprintX, footprintY, footprintWidth, footprintHeight) : '') +
    placedSvg(source, x, y, cell)
  );
}

function apparatusPlacement(
  direction: DirectionId | 'current',
  footprintX: number,
  footprintY: number,
  cell: number,
  live: boolean,
  guide = true,
): string {
  const footprintWidth = 2 * cell;
  const x = footprintX + (footprintWidth - cell) / 2;
  const y = footprintY + cell - cell * (116 / CANVAS);
  return (
    (guide ? occupancyGuide(footprintX, footprintY, footprintWidth, cell, '#B9D9C3') : '') +
    placedSvg(directionProp(direction, live ? 'apparatus-live' : 'apparatus-dormant'), x, y, cell)
  );
}

function dockPlacement(
  direction: DirectionId | 'current',
  x: number,
  y: number,
  cell: number,
  active = true,
  guide = false,
): string {
  const source = direction === 'current'
    ? directionProp('current', 'dock')
    : dockSvg(direction, active);
  return (
    (guide ? occupancyGuide(x, y, cell, cell, '#B9D9C3') : '') +
    placedSvg(source, x, y, cell)
  );
}

function characterPlacement(
  source: string,
  anchorX: number,
  anchorY: number,
  cell: number,
): string {
  const frameSize = cell * CHARACTER_FRAME_CELLS;
  return placedSvg(
    source,
    anchorX - frameSize / 2,
    anchorY - frameSize * .86,
    frameSize,
  );
}

function crewPlacement(
  direction: DirectionId | 'current',
  facing: Facing | 'west',
  pose: Pose,
  anchorX: number,
  anchorY: number,
  cell: number,
): string {
  return characterPlacement(directionCrew(direction, facing, pose), anchorX, anchorY, cell);
}

function employeePlacement(
  recipeIndex: number,
  facing: Facing | 'west',
  pose: Pose,
  anchorX: number,
  anchorY: number,
  cell: number,
): string {
  const recipe = DEFAULT_CAST[recipeIndex % DEFAULT_CAST.length];
  return characterPlacement(employeeSvg(recipe, facing, pose), anchorX, anchorY, cell);
}

function anonymousFigurePlacement(
  anchorX: number,
  anchorY: number,
  cell: number,
): string {
  const frame = cell * CHARACTER_FRAME_CELLS;
  return (
    `<g opacity=".7">` +
    `<circle cx="${anchorX}" cy="${anchorY - frame * .62}" r="${frame * .10}" fill="#121715"/>` +
    `<path d="M ${anchorX - frame * .12} ${anchorY - frame * .50} ` +
    `Q ${anchorX} ${anchorY - frame * .56} ${anchorX + frame * .12} ${anchorY - frame * .50} ` +
    `L ${anchorX + frame * .15} ${anchorY - frame * .10} ` +
    `Q ${anchorX} ${anchorY} ${anchorX - frame * .15} ${anchorY - frame * .10} Z" fill="#121715"/>` +
    `</g>`
  );
}

function pageHeader(
  title: string,
  subtitle: string,
  pageLabel: string,
): string[] {
  return [
    text(MARGIN, 43, title, 27, 820, COLORS.greenDark),
    text(MARGIN, 70, subtitle, 12, 580, COLORS.muted),
    pill(WIDTH - MARGIN - 260, 25, 260, pageLabel, '#D8E8DE', COLORS.greenDark),
    text(
      WIDTH - MARGIN,
      82,
      `review-only · schema ${CURRENT_SCHEMA_VERSION} unchanged`,
      9.5,
      650,
      COLORS.coral,
      'end',
    ),
  ];
}

function baselineSection(parts: string[]): void {
  const x = MARGIN;
  const y = 105;
  const width = WIDTH - MARGIN * 2;
  const height = 450;
  parts.push(
    panel(x, y, width, height, COLORS.panelAlt),
    text(x + 20, y + 32, 'CURRENT PRODUCTION BASELINE · SHOWN, NOT ALTERED', 16, 780, COLORS.greenDark),
    text(
      x + 20,
      y + 57,
      'Code-owned apparatus and dock; SVG-owned fabrication head; code-owned rig-aware chassis on body-large-frame.',
      10.5,
      570,
      COLORS.muted,
    ),
  );

  const groups = [
    { label: 'LIVE', source: directionProp('current', 'apparatus-live') },
    { label: 'DORMANT', source: directionProp('current', 'apparatus-dormant') },
  ];
  groups.forEach((group, index) => {
    const gx = x + 34 + index * 260;
    parts.push(
      `<rect x="${gx}" y="${y + 82}" width="236" height="318" rx="10" fill="#FCFAF3" stroke="${COLORS.rule}"/>`,
      placedSvg(group.source, gx + 42, y + 92, 152),
      placedSvg(group.source, gx + 51, y + 247, 64),
      placedSvg(group.source, gx + 138, y + 263, 32),
      text(gx + 118, y + 385, `${group.label} · 128 / 64 / 32 px`, 9.5, 700, COLORS.blue, 'middle'),
    );
  });

  const dockX = x + 566;
  parts.push(
    `<rect x="${dockX}" y="${y + 82}" width="360" height="318" rx="10" fill="#FCFAF3" stroke="${COLORS.rule}"/>`,
    text(dockX + 18, y + 108, 'DOCK · EMPTY / OCCUPIED', 10, 720, COLORS.blue),
    placedSvg(directionProp('current', 'dock'), dockX + 35, y + 148, 130),
    placedSvg(directionProp('current', 'dock'), dockX + 200, y + 180, 130),
    placedSvg(currentCrewSvg('south'), dockX + 200, y + 120, 130),
    text(dockX + 100, y + 385, 'empty', 9.5, 650, COLORS.muted, 'middle'),
    text(dockX + 265, y + 385, 'occupied', 9.5, 650, COLORS.muted, 'middle'),
  );

  const crewX = dockX + 386;
  const crewWidth = width - (crewX - x) - 24;
  parts.push(
    `<rect x="${crewX}" y="${y + 82}" width="${crewWidth}" height="318" rx="10" fill="#FCFAF3" stroke="${COLORS.rule}"/>`,
    text(crewX + 18, y + 108, 'FABRICATION UNIT · FACINGS + WORK STATES', 10, 720, COLORS.blue),
  );
  const facings: Array<Facing | 'west'> = ['south', 'east', 'north', 'west'];
  facings.forEach((facing, index) => {
    const sx = crewX + 28 + index * 164;
    parts.push(
      placedSvg(currentCrewSvg(facing), sx, y + 124, 112),
      text(sx + 56, y + 248, facing, 8.5, 650, COLORS.muted, 'middle'),
    );
  });
  const poses: Array<{ pose: Pose; facing: Facing | 'west' }> = [
    { pose: 'walk-approach', facing: 'east' },
    { pose: 'point', facing: 'south' },
    { pose: 'console', facing: 'west' },
    { pose: 'hands-on-hips', facing: 'south' },
  ];
  poses.forEach(({ pose, facing }, index) => {
    const sx = crewX + 692 + index * 152;
    parts.push(
      placedSvg(currentCrewSvg(facing, pose), sx, y + 124, 112),
      text(sx + 56, y + 248, pose, 8.5, 650, COLORS.muted, 'middle'),
    );
  });
  parts.push(
    text(
      crewX + 18,
      y + 292,
      'Baseline read: friendly terminal pair + circular docking target + service-robot crew.',
      10,
      640,
      COLORS.coral,
    ),
    text(
      crewX + 18,
      y + 318,
      'Calibration question: can shared ancestry become more exact and load-bearing without becoming generic evil machinery?',
      10,
      570,
      COLORS.muted,
    ),
    text(
      crewX + 18,
      y + 365,
      'All alternatives below remain temporary SVG markup in this proof script.',
      9.5,
      700,
      COLORS.greenDark,
    ),
  );
}

function directionCard(
  parts: string[],
  direction: Direction,
  x: number,
  y: number,
  width: number,
): void {
  const height = 1725;
  parts.push(
    panel(x, y, width, height, direction.tint),
    text(x + 20, y + 34, direction.label, 17, 820, COLORS.greenDark),
    wrappedText(x + 20, y + 62, direction.thesis, 90, 18, 10.5, 580, COLORS.muted),
    pill(x + width - 176, y + 18, 156, 'PROOF ONLY', '#F2DDD7', COLORS.coral),
    line(`M ${x + 20} ${y + 104} H ${x + width - 20}`, COLORS.rule, 1, .7),
  );

  const apparatusY = y + 124;
  parts.push(
    text(x + 20, apparatusY, 'STATE + SILHOUETTE', 9.5, 750, COLORS.blue),
    `<rect x="${x + 20}" y="${apparatusY + 16}" width="${(width - 60) / 2}" height="294" rx="10" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
    `<rect x="${x + 40 + (width - 60) / 2}" y="${apparatusY + 16}" width="${(width - 60) / 2}" height="294" rx="10" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
  );
  const stateW = (width - 60) / 2;
  const liveX = x + 20;
  const dormantX = x + 40 + stateW;
  parts.push(
    placedSvg(apparatusSvg(direction.id, true), liveX + (stateW - 206) / 2, apparatusY + 30, 206),
    placedSvg(apparatusSvg(direction.id, false), dormantX + (stateW - 206) / 2, apparatusY + 30, 206),
    text(liveX + stateW / 2, apparatusY + 286, 'LIVE · one dominant optic', 9.5, 700, COLORS.greenDark, 'middle'),
    text(dormantX + stateW / 2, apparatusY + 286, 'DORMANT · same exterior', 9.5, 700, COLORS.muted, 'middle'),
  );

  const scaleY = apparatusY + 332;
  parts.push(
    text(x + 20, scaleY, 'CLOSE / NORMAL / FAR', 9.5, 750, COLORS.blue),
    `<rect x="${x + 20}" y="${scaleY + 16}" width="${width - 40}" height="146" rx="10" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
  );
  const scaleSpecs = [
    { size: 128, label: '128 px' },
    { size: 64, label: '64 px' },
    { size: 32, label: '32 px' },
  ] as const;
  let scaleX = x + 58;
  for (const { size, label } of scaleSpecs) {
    parts.push(
      placedSvg(apparatusSvg(direction.id, true), scaleX, scaleY + 24 + (128 - size) / 2, size),
      text(scaleX + size / 2, scaleY + 148, label, 8.5, 650, COLORS.muted, 'middle'),
    );
    scaleX += size + 84;
  }
  parts.push(
    placedSvg(dockSvg(direction.id), x + width - 206, scaleY + 35, 98),
    placedSvg(proposalCrewSvg(direction.id, 'south'), x + width - 112, scaleY + 22, 112),
  );

  const dockY = scaleY + 188;
  parts.push(
    text(x + 20, dockY, 'DOCK · EMPTY / OCCUPIED', 9.5, 750, COLORS.blue),
    `<rect x="${x + 20}" y="${dockY + 16}" width="${width - 40}" height="230" rx="10" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
    placedSvg(dockSvg(direction.id), x + 88, dockY + 48, 150),
    placedSvg(dockSvg(direction.id), x + width - 252, dockY + 75, 150),
    placedSvg(proposalCrewSvg(direction.id, 'south'), x + width - 252, dockY + 18, 150),
    text(x + 163, dockY + 225, 'empty', 8.5, 650, COLORS.muted, 'middle'),
    text(x + width - 177, dockY + 225, 'occupied · root centered', 8.5, 650, COLORS.muted, 'middle'),
  );

  const facingY = dockY + 274;
  parts.push(
    text(x + 20, facingY, 'FABRICATION UNIT · ALL FACINGS', 9.5, 750, COLORS.blue),
    `<rect x="${x + 20}" y="${facingY + 16}" width="${width - 40}" height="216" rx="10" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
  );
  const facings: Array<Facing | 'west'> = ['south', 'east', 'north', 'west'];
  const facingGap = (width - 80 - 4 * 122) / 3;
  facings.forEach((facing, index) => {
    const fx = x + 40 + index * (122 + facingGap);
    parts.push(
      placedSvg(proposalCrewSvg(direction.id, facing), fx, facingY + 34, 122),
      text(fx + 61, facingY + 215, facing, 8.5, 650, COLORS.muted, 'middle'),
    );
  });

  const poseY = facingY + 258;
  parts.push(
    text(x + 20, poseY, 'WORK + CONSOLE POSES · PRODUCTION RIG HELD', 9.5, 750, COLORS.blue),
    `<rect x="${x + 20}" y="${poseY + 16}" width="${width - 40}" height="222" rx="10" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
  );
  const poses: Array<{ pose: Pose; facing: Facing | 'west' }> = [
    { pose: 'walk-approach', facing: 'east' },
    { pose: 'point', facing: 'south' },
    { pose: 'console', facing: 'west' },
    { pose: 'hands-on-hips', facing: 'south' },
  ];
  const poseGap = (width - 80 - 4 * 122) / 3;
  poses.forEach(({ pose, facing }, index) => {
    const px = x + 40 + index * (122 + poseGap);
    parts.push(
      placedSvg(proposalCrewSvg(direction.id, facing, pose), px, poseY + 34, 122),
      text(px + 61, poseY + 218, pose, 8.2, 650, COLORS.muted, 'middle'),
    );
  });

  const noteY = poseY + 270;
  parts.push(
    `<rect x="${x + 20}" y="${noteY}" width="${width - 40}" height="195" rx="10" fill="#FFFFFFAA" stroke="${COLORS.rule}"/>`,
    text(x + 38, noteY + 28, 'FAMILY LINK', 9.5, 760, COLORS.greenDark),
    wrappedText(x + 38, noteY + 54, direction.familyRule, 92, 18, 10, 570, COLORS.ink),
    text(x + 38, noteY + 111, 'PRIMARY RISK', 9.5, 760, COLORS.coral),
    wrappedText(x + 38, noteY + 137, direction.risk, 92, 18, 10, 570, COLORS.muted),
  );
}

function pageOne(): string {
  const parts: string[] = [
    `<rect width="${WIDTH}" height="${PAGE_1_HEIGHT}" fill="${COLORS.page}"/>`,
    ...pageHeader(
      'IRIS EQUIPMENT REDESIGN · DIRECTION CALIBRATION',
      'Current production compositor beside three bounded, unregistered SVG studies · literal gameplay scale remains authoritative',
      '01 / DIRECTION',
    ),
  ];
  baselineSection(parts);
  const cardY = 575;
  const cardWidth = (WIDTH - MARGIN * 2 - GAP * 2) / 3;
  DIRECTIONS.forEach((direction, index) => {
    directionCard(parts, direction, MARGIN + index * (cardWidth + GAP), cardY, cardWidth);
  });
  parts.push(
    text(MARGIN, PAGE_1_HEIGHT - 22, 'No proposal source is imported, registered, exported, bundled, or committed.', 9.5, 680, COLORS.coral),
    text(WIDTH - MARGIN, PAGE_1_HEIGHT - 22, 'approval gate remains open', 9.5, 720, COLORS.greenDark, 'end'),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${PAGE_1_HEIGHT}" viewBox="0 0 ${WIDTH} ${PAGE_1_HEIGHT}">${parts.join('')}</svg>`;
}

function bareLotScene(
  direction: DirectionId,
  x: number,
  y: number,
  cell: number,
): string {
  const parts: string[] = [];
  drawLot(parts, x, y, 9, 5, cell);
  parts.push(
    apparatusPlacement(direction, x + .4 * cell, y + .5 * cell, cell, true),
    dockPlacement(direction, x + 3.5 * cell, y + 2.4 * cell, cell, true, true),
    dockPlacement(direction, x + 5.1 * cell, y + 2.4 * cell, cell, true, true),
    dockPlacement(direction, x + 6.7 * cell, y + 2.4 * cell, cell, true, true),
    crewPlacement(direction, 'west', 'console', x + 2.9 * cell, y + 2.3 * cell, cell),
    crewPlacement(direction, 'north', 'neutral', x + 5.6 * cell, y + 3.2 * cell, cell),
    crewPlacement(direction, 'east', 'walk-approach', x + 7.2 * cell, y + 3.2 * cell, cell),
    crewPlacement(direction, 'south', 'point', x + 8.2 * cell, y + 3.9 * cell, cell),
    text(x + 12, y + 5 * cell - 14, 'bare lot · 2×1 apparatus · three 1×1 bays', 8.5, 700, '#F4F0E6'),
  );
  return parts.join('');
}

function compactRoomScene(
  direction: DirectionId,
  x: number,
  y: number,
  cell: number,
): string {
  const parts: string[] = [];
  const columns = 10;
  const rows = 7;
  drawGrid(parts, x, y, columns, rows, cell);
  drawWalls(parts, x, y, columns, rows, cell, 'back');
  parts.push(
    apparatusPlacement(direction, x + .7 * cell, y + 1 * cell, cell, true),
    propPlacement('server-rack', x + 3.4 * cell, y + 1 * cell, cell, true),
    propPlacement('water-cooler', x + 4.8 * cell, y + 1 * cell, cell),
    propPlacement('desk', x + 6 * cell, y + 2 * cell, cell, true),
    propPlacement('office-chair', x + 7 * cell, y + 3 * cell, cell),
    propPlacement('filing-cabinet', x + 8.2 * cell, y + 1 * cell, cell),
    dockPlacement(direction, x + 2.5 * cell, y + 3.2 * cell, cell, true, true),
    crewPlacement(direction, 'south', 'neutral', x + 3 * cell, y + 4.15 * cell, cell),
    employeePlacement(0, 'west', 'console', x + 2.45 * cell, y + 3.55 * cell, cell),
    employeePlacement(1, 'south', 'neutral', x + 6.7 * cell, y + 4.9 * cell, cell),
    employeePlacement(2, 'east', 'notice', x + 8.2 * cell, y + 5.0 * cell, cell),
    employeePlacement(3, 'north', 'neutral', x + 5.0 * cell, y + 5.3 * cell, cell),
  );
  drawWalls(parts, x, y, columns, rows, cell, 'front');
  return parts.join('');
}

function consoleScene(
  direction: DirectionId,
  x: number,
  y: number,
  cell: number,
): string {
  const parts: string[] = [];
  drawGrid(parts, x, y, 4, 3, cell);
  drawWalls(parts, x, y, 4, 3, cell, 'back');
  parts.push(
    apparatusPlacement(direction, x + .15 * cell, y + .55 * cell, cell, true),
    employeePlacement(0, 'west', 'console', x + 2.58 * cell, y + 2.18 * cell, cell),
    `<circle cx="${x + 2.18 * cell}" cy="${y + 2.1 * cell}" r="${cell * .13}" fill="none" stroke="${COLORS.coral}" stroke-width="3"/>`,
    line(
      `M ${x + 2.18 * cell} ${y + 1.98 * cell} V ${y + 2.22 * cell} M ${x + 2.06 * cell} ${y + 2.1 * cell} H ${x + 2.30 * cell}`,
      COLORS.coral,
      2,
    ),
  );
  drawWalls(parts, x, y, 4, 3, cell, 'front');
  return parts.join('');
}

function dormantScene(
  direction: DirectionId,
  x: number,
  y: number,
  cell: number,
): string {
  const parts: string[] = [];
  drawGrid(parts, x, y, 4, 3, cell, true);
  drawWalls(parts, x, y, 4, 3, cell, 'back', .38);
  parts.push(
    apparatusPlacement(direction, x + .15 * cell, y + .55 * cell, cell, false),
    dockPlacement(direction, x + 2.55 * cell, y + 1.6 * cell, cell, false),
    crewPlacement(direction, 'north', 'neutral', x + 3.05 * cell, y + 2.48 * cell, cell),
    anonymousFigurePlacement(x + 2.4 * cell, y + 2.15 * cell, cell),
  );
  drawWalls(parts, x, y, 4, 3, cell, 'front', .38);
  return parts.join('');
}

function crowdedScene(
  direction: DirectionId,
  x: number,
  y: number,
  cell: number,
): string {
  const parts: string[] = [];
  const columns = 10;
  const rows = 6;
  drawGrid(parts, x, y, columns, rows, cell);
  drawWalls(parts, x, y, columns, rows, cell, 'back');
  parts.push(
    apparatusPlacement(direction, x + .4 * cell, y + .7 * cell, cell, true),
    propPlacement('server-rack', x + 2.9 * cell, y + .7 * cell, cell),
    propPlacement('filing-cabinet', x + 4.0 * cell, y + .7 * cell, cell),
    propPlacement('copier', x + 5.1 * cell, y + .7 * cell, cell),
    propPlacement('water-cooler', x + 6.4 * cell, y + .7 * cell, cell),
    propPlacement('desk', x + 7.4 * cell, y + 2.0 * cell, cell),
    dockPlacement(direction, x + 3.0 * cell, y + 3.2 * cell, cell),
    dockPlacement(direction, x + 4.4 * cell, y + 3.2 * cell, cell),
    crewPlacement(direction, 'south', 'neutral', x + 3.5 * cell, y + 4.0 * cell, cell),
    crewPlacement(direction, 'east', 'walk-approach', x + 4.9 * cell, y + 4.0 * cell, cell),
    employeePlacement(0, 'south', 'neutral', x + 6.3 * cell, y + 4.5 * cell, cell),
    employeePlacement(1, 'west', 'notice', x + 7.4 * cell, y + 4.0 * cell, cell),
    employeePlacement(2, 'east', 'neutral', x + 8.7 * cell, y + 4.6 * cell, cell),
  );
  drawWalls(parts, x, y, columns, rows, cell, 'front');
  return parts.join('');
}

function scaleRelationshipStudy(
  direction: DirectionId,
  x: number,
  y: number,
  width: number,
): string {
  const cell = 122;
  const baseY = y + 212;
  const subjectXs = [
    x + 100,
    x + 250,
    x + 400,
    x + 550,
    x + 700,
    x + 850,
  ];
  const parts = [
    `<rect x="${x}" y="${y}" width="${width}" height="292" rx="10" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
    text(x + 16, y + 25, 'LITERAL SCALE RELATIONSHIPS', 9.5, 760, COLORS.blue),
    text(x + width - 16, y + 25, 'props ×1.0 · characters ×0.65', 8.5, 690, COLORS.coral, 'end'),
    line(`M ${x + 30} ${baseY} H ${x + width - 30}`, COLORS.rule, 1.4, .7),
    line(`M ${x + 30} ${baseY - cell * WALL_DATUM / CANVAS} H ${x + width - 30}`, COLORS.greenDark, 1, .55, '5 4'),
    text(x + width - 34, baseY - cell * WALL_DATUM / CANVAS - 5, '112u wall datum', 7.8, 650, COLORS.greenDark, 'end'),
    placedSvg(apparatusSvg(direction, true), subjectXs[0] - cell / 2, baseY - cell * 116 / CANVAS, cell),
    characterPlacement(employeeSvg(DEFAULT_CAST[0], 'south'), subjectXs[1], baseY, cell),
    characterPlacement(proposalCrewSvg(direction, 'south'), subjectXs[2], baseY, cell),
    placedSvg(dockSvg(direction), subjectXs[3] - cell / 2, baseY - cell * .72, cell),
    placedSvg(composeCurrentProp(SERVER_RACK), subjectXs[4] - cell / 2, baseY - cell * 116 / CANVAS, cell),
    wallTile(10, subjectXs[5] - cell / 2, baseY - cell, cell),
  ];
  const labels = [
    'apparatus',
    'employee',
    'fab unit',
    'dock',
    'server rack',
    'accepted wall',
  ] as const;
  labels.forEach((labelValue, index) => {
    parts.push(text(subjectXs[index], y + 273, labelValue, 8.3, 650, COLORS.muted, 'middle'));
  });
  return parts.join('');
}

function contextDirectionColumn(
  parts: string[],
  direction: Direction,
  x: number,
  y: number,
  width: number,
): void {
  parts.push(
    panel(x, y, width, 2050, direction.tint),
    text(x + 18, y + 32, direction.label, 16, 820, COLORS.greenDark),
    text(x + width - 18, y + 32, 'NORMAL 80 · FAR 44 PX/CELL', 8.8, 700, COLORS.coral, 'end'),
  );

  const roomCell = 80;
  const roomX = x + (width - 10 * roomCell) / 2;
  const roomY = y + 84;
  parts.push(
    text(x + 18, y + 66, 'COMPACT ACCEPTED ROOM · WALL / DESK / CHARACTER OCCLUSION', 9.5, 750, COLORS.blue),
    compactRoomScene(direction.id, roomX, roomY, roomCell),
    text(
      x + 18,
      roomY + 7 * roomCell + 24,
      'Human console use remains readable; apparatus is literal ×1.0, not character-scaled.',
      8.8,
      620,
      COLORS.muted,
    ),
  );

  const lotY = roomY + 7 * roomCell + 54;
  const lotCell = 70;
  const lotX = x + (width - 9 * lotCell) / 2;
  parts.push(
    text(x + 18, lotY, 'BARE LOT · APPARATUS / CREW / DOCK FAMILY', 9.5, 750, COLORS.blue),
    bareLotScene(direction.id, lotX, lotY + 18, lotCell),
  );

  const insetY = lotY + 5 * lotCell + 50;
  const insetCell = 76;
  const insetWidth = 4 * insetCell;
  const consoleX = x + 26;
  const dormantX = x + width - insetWidth - 26;
  parts.push(
    text(consoleX, insetY, 'CONSOLE APPROACH', 9.5, 750, COLORS.blue),
    text(dormantX, insetY, 'AFTER HOURS / DORMANT', 9.5, 750, COLORS.blue),
    consoleScene(direction.id, consoleX, insetY + 18, insetCell),
    dormantScene(direction.id, dormantX, insetY + 18, insetCell),
    text(consoleX, insetY + 3 * insetCell + 40, 'interaction root highlighted', 8.3, 620, COLORS.coral),
    text(dormantX, insetY + 3 * insetCell + 40, 'figure position only · identity unresolved', 8.3, 620, COLORS.muted),
  );

  const crowdY = insetY + 3 * insetCell + 78;
  const crowdCell = 44;
  const crowdX = x + (width - 10 * crowdCell) / 2;
  parts.push(
    text(x + 18, crowdY, 'CROWDED EQUIPMENT CONTEXT · FAR GAMEPLAY READ', 9.5, 750, COLORS.blue),
    crowdedScene(direction.id, crowdX, crowdY + 18, crowdCell),
    text(
      x + 18,
      crowdY + 6 * crowdCell + 42,
      'Compare against ordinary server rack, storage, copier, water, desk, employees, and accepted wall mass.',
      8.6,
      620,
      COLORS.muted,
    ),
  );

  const scaleY = crowdY + 6 * crowdCell + 70;
  parts.push(scaleRelationshipStudy(direction.id, x + 18, scaleY, width - 36));
}

function pageTwo(): string {
  const parts: string[] = [
    `<rect width="${WIDTH}" height="${PAGE_2_HEIGHT}" fill="${COLORS.page}"/>`,
    ...pageHeader(
      'IRIS EQUIPMENT REDESIGN · CONTEXT + SCALE',
      'Accepted 112-unit walls, completed employees, ordinary QuotaCo props, literal apparatus scale, and production character rig controls',
      '02 / CONTEXT',
    ),
  ];
  const cardY = 104;
  const cardWidth = (WIDTH - MARGIN * 2 - GAP * 2) / 3;
  DIRECTIONS.forEach((direction, index) => {
    contextDirectionColumn(parts, direction, MARGIN + index * (cardWidth + GAP), cardY, cardWidth);
  });
  parts.push(
    panel(MARGIN, PAGE_2_HEIGHT - 92, WIDTH - MARGIN * 2, 58, COLORS.panelDark),
    text(
      MARGIN + 18,
      PAGE_2_HEIGHT - 57,
      'WHOLE-FLOOR SURVEILLANCE REMAINS LOCKED · no cones · no repeaters · no camera-placement minigame',
      11,
      760,
      '#EAF1EC',
    ),
    text(
      WIDTH - MARGIN - 18,
      PAGE_2_HEIGHT - 57,
      'review the pixels, then choose / combine / reject',
      10,
      650,
      COLORS.green,
      'end',
    ),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${PAGE_2_HEIGHT}" viewBox="0 0 ${WIDTH} ${PAGE_2_HEIGHT}">${parts.join('')}</svg>`;
}

function refinedPierApparatusPlacement(
  refinement: PierRefinementId,
  footprintX: number,
  footprintY: number,
  cell: number,
  live: boolean,
  guide = true,
): string {
  const footprintWidth = 2 * cell;
  const x = footprintX + (footprintWidth - cell) / 2;
  const y = footprintY + cell - cell * (116 / CANVAS);
  return (
    (guide ? occupancyGuide(footprintX, footprintY, footprintWidth, cell, '#B9D9C3') : '') +
    placedSvg(refinedPierApparatusSvg(refinement, live), x, y, cell)
  );
}

function refinedPierDockPlacement(
  refinement: PierRefinementId,
  x: number,
  y: number,
  cell: number,
  active = true,
  guide = false,
): string {
  return (
    (guide ? occupancyGuide(x, y, cell, cell, '#B9D9C3') : '') +
    placedSvg(refinedPierDockSvg(refinement, active), x, y, cell)
  );
}

function refinedPierCrewPlacement(
  refinement: PierRefinementId,
  facing: Facing | 'west',
  pose: Pose,
  anchorX: number,
  anchorY: number,
  cell: number,
): string {
  return characterPlacement(
    refinedPierCrewSvg(refinement, facing, pose),
    anchorX,
    anchorY,
    cell,
  );
}

function refinedPierRoomScene(
  refinement: PierRefinementId,
  x: number,
  y: number,
  cell: number,
): string {
  const parts: string[] = [];
  const columns = 7;
  const rows = 5;
  drawGrid(parts, x, y, columns, rows, cell);
  drawWalls(parts, x, y, columns, rows, cell, 'back');
  parts.push(
    refinedPierApparatusPlacement(refinement, x + .25 * cell, y + .8 * cell, cell, true),
    propPlacement('server-rack', x + 2.8 * cell, y + .8 * cell, cell),
    propPlacement('water-cooler', x + 4.0 * cell, y + .8 * cell, cell),
    propPlacement('desk', x + 5.0 * cell, y + 1.8 * cell, cell),
    employeePlacement(0, 'west', 'console', x + 2.2 * cell, y + 3.0 * cell, cell),
    employeePlacement(1, 'south', 'neutral', x + 5.5 * cell, y + 3.8 * cell, cell),
    refinedPierDockPlacement(refinement, x + 3.3 * cell, y + 3.1 * cell, cell, true, true),
    refinedPierCrewPlacement(refinement, 'north', 'neutral', x + 3.8 * cell, y + 4.0 * cell, cell),
  );
  drawWalls(parts, x, y, columns, rows, cell, 'front');
  return parts.join('');
}

function refinedPierConsoleInset(
  refinement: PierRefinementId,
  x: number,
  y: number,
  cell: number,
): string {
  const parts: string[] = [];
  drawGrid(parts, x, y, 4, 3, cell);
  drawWalls(parts, x, y, 4, 3, cell, 'back');
  parts.push(
    refinedPierApparatusPlacement(refinement, x + .1 * cell, y + .55 * cell, cell, true),
    employeePlacement(0, 'west', 'console', x + 2.55 * cell, y + 2.18 * cell, cell),
    `<circle cx="${x + 2.16 * cell}" cy="${y + 2.08 * cell}" r="${cell * .13}" fill="none" stroke="${COLORS.coral}" stroke-width="2.5"/>`,
  );
  drawWalls(parts, x, y, 4, 3, cell, 'front');
  return parts.join('');
}

function refinedPierFarScene(
  refinement: PierRefinementId,
  x: number,
  y: number,
  cell: number,
): string {
  const parts: string[] = [];
  const columns = 8;
  const rows = 5;
  drawGrid(parts, x, y, columns, rows, cell);
  drawWalls(parts, x, y, columns, rows, cell, 'back');
  parts.push(
    refinedPierApparatusPlacement(refinement, x + .2 * cell, y + .6 * cell, cell, true),
    propPlacement('server-rack', x + 2.6 * cell, y + .6 * cell, cell),
    propPlacement('filing-cabinet', x + 3.7 * cell, y + .6 * cell, cell),
    propPlacement('water-cooler', x + 4.8 * cell, y + .6 * cell, cell),
    refinedPierDockPlacement(refinement, x + 2.6 * cell, y + 2.8 * cell, cell),
    refinedPierCrewPlacement(refinement, 'south', 'neutral', x + 3.1 * cell, y + 3.7 * cell, cell),
    employeePlacement(0, 'south', 'neutral', x + 4.4 * cell, y + 3.8 * cell, cell),
    employeePlacement(1, 'west', 'notice', x + 5.5 * cell, y + 3.5 * cell, cell),
    employeePlacement(2, 'east', 'neutral', x + 6.7 * cell, y + 3.9 * cell, cell),
  );
  drawWalls(parts, x, y, columns, rows, cell, 'front');
  return parts.join('');
}

function refinementCard(
  parts: string[],
  refinement: PierRefinement,
  x: number,
  y: number,
  width: number,
): void {
  const height = 1900;
  parts.push(
    panel(x, y, width, height, refinement.tint),
    text(x + 18, y + 32, refinement.label, 15.5, 820, COLORS.greenDark),
    wrappedText(x + 18, y + 59, refinement.thesis, 68, 17, 9.7, 580, COLORS.muted),
    pill(
      x + width - 148,
      y + 16,
      130,
      refinement.id === 'accepted-b' ? 'CONTROL' : 'REFINE',
      refinement.id === 'accepted-b' ? '#D8E8DE' : '#F2DDD7',
      refinement.id === 'accepted-b' ? COLORS.greenDark : COLORS.coral,
    ),
    line(`M ${x + 18} ${y + 104} H ${x + width - 18}`, COLORS.rule, 1, .65),
  );

  const stateY = y + 126;
  const stateWidth = (width - 54) / 2;
  parts.push(
    text(x + 18, stateY, 'LIVE / DORMANT · IDENTICAL EXTERIOR', 9, 750, COLORS.blue),
    `<rect x="${x + 18}" y="${stateY + 16}" width="${stateWidth}" height="250" rx="9" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
    `<rect x="${x + 36 + stateWidth}" y="${stateY + 16}" width="${stateWidth}" height="250" rx="9" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
    placedSvg(
      refinedPierApparatusSvg(refinement.id, true),
      x + 18 + (stateWidth - 170) / 2,
      stateY + 28,
      170,
    ),
    placedSvg(
      refinedPierApparatusSvg(refinement.id, false),
      x + 36 + stateWidth + (stateWidth - 170) / 2,
      stateY + 28,
      170,
    ),
    text(x + 18 + stateWidth / 2, stateY + 246, 'live', 8.2, 680, COLORS.greenDark, 'middle'),
    text(x + 36 + stateWidth * 1.5, stateY + 246, 'dormant', 8.2, 680, COLORS.muted, 'middle'),
  );

  const scaleY = stateY + 292;
  parts.push(
    text(x + 18, scaleY, 'CLOSE / NORMAL / FAR', 9, 750, COLORS.blue),
    `<rect x="${x + 18}" y="${scaleY + 16}" width="${width - 36}" height="140" rx="9" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
    placedSvg(refinedPierApparatusSvg(refinement.id, true), x + 46, scaleY + 22, 112),
    placedSvg(refinedPierApparatusSvg(refinement.id, true), x + 206, scaleY + 50, 56),
    placedSvg(refinedPierApparatusSvg(refinement.id, true), x + 314, scaleY + 64, 28),
    text(x + 102, scaleY + 146, '128-ish', 7.8, 650, COLORS.muted, 'middle'),
    text(x + 234, scaleY + 146, '64', 7.8, 650, COLORS.muted, 'middle'),
    text(x + 328, scaleY + 146, '32', 7.8, 650, COLORS.muted, 'middle'),
    placedSvg(refinedPierDockSvg(refinement.id), x + width - 220, scaleY + 40, 88),
    placedSvg(refinedPierCrewSvg(refinement.id, 'south'), x + width - 132, scaleY + 28, 102),
  );

  const dockY = scaleY + 180;
  parts.push(
    text(x + 18, dockY, 'DOCK · EMPTY / OCCUPIED', 9, 750, COLORS.blue),
    `<rect x="${x + 18}" y="${dockY + 16}" width="${width - 36}" height="190" rx="9" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
    placedSvg(refinedPierDockSvg(refinement.id), x + 70, dockY + 45, 118),
    placedSvg(refinedPierDockSvg(refinement.id), x + width - 208, dockY + 69, 118),
    placedSvg(refinedPierCrewSvg(refinement.id, 'south'), x + width - 208, dockY + 24, 118),
    text(x + 129, dockY + 195, 'empty', 7.8, 650, COLORS.muted, 'middle'),
    text(x + width - 149, dockY + 195, 'occupied', 7.8, 650, COLORS.muted, 'middle'),
  );

  const facingY = dockY + 228;
  parts.push(
    text(x + 18, facingY, 'CREW FACINGS · YOKE / HEAD / CHEST', 9, 750, COLORS.blue),
    `<rect x="${x + 18}" y="${facingY + 16}" width="${width - 36}" height="168" rx="9" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
  );
  const facings: Array<Facing | 'west'> = ['south', 'east', 'north', 'west'];
  const facingGap = (width - 64 - 4 * 94) / 3;
  facings.forEach((facing, index) => {
    const fx = x + 32 + index * (94 + facingGap);
    parts.push(
      placedSvg(refinedPierCrewSvg(refinement.id, facing), fx, facingY + 27, 94),
      text(fx + 47, facingY + 173, facing, 7.5, 640, COLORS.muted, 'middle'),
    );
  });

  const poseY = facingY + 206;
  parts.push(
    text(x + 18, poseY, 'WORK / CONSOLE POSES · PRODUCTION RIG', 9, 750, COLORS.blue),
    `<rect x="${x + 18}" y="${poseY + 16}" width="${width - 36}" height="168" rx="9" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
  );
  const poses: Array<{ pose: Pose; facing: Facing | 'west' }> = [
    { pose: 'walk-approach', facing: 'east' },
    { pose: 'point', facing: 'south' },
    { pose: 'console', facing: 'west' },
    { pose: 'hands-on-hips', facing: 'south' },
  ];
  const poseGap = (width - 64 - 4 * 94) / 3;
  poses.forEach(({ pose, facing }, index) => {
    const px = x + 32 + index * (94 + poseGap);
    parts.push(
      placedSvg(refinedPierCrewSvg(refinement.id, facing, pose), px, poseY + 27, 94),
      text(px + 47, poseY + 173, pose, 7.1, 640, COLORS.muted, 'middle'),
    );
  });

  const contextY = poseY + 212;
  const normalCell = 52;
  const normalX = x + 18;
  const consoleCell = 52;
  const consoleX = x + width - 4 * consoleCell - 18;
  const farCell = 31;
  const farX = x + width - 8 * farCell - 18;
  parts.push(
    text(normalX, contextY, 'NORMAL ROOM · 52 PX/CELL', 8.5, 750, COLORS.blue),
    refinedPierRoomScene(refinement.id, normalX, contextY + 16, normalCell),
    text(consoleX, contextY, 'CONSOLE APPROACH', 8.5, 750, COLORS.blue),
    refinedPierConsoleInset(refinement.id, consoleX, contextY + 16, consoleCell),
    text(farX, contextY + 198, 'FAR CROWD · 31 PX/CELL', 8.5, 750, COLORS.blue),
    refinedPierFarScene(refinement.id, farX, contextY + 214, farCell),
  );

  const noteY = contextY + 396;
  parts.push(
    `<rect x="${x + 18}" y="${noteY}" width="${width - 36}" height="244" rx="9" fill="#FFFFFFAA" stroke="${COLORS.rule}"/>`,
    text(x + 34, noteY + 28, 'KEEPS', 9, 760, COLORS.greenDark),
    wrappedText(x + 34, noteY + 52, refinement.keeps, 66, 17, 9.2, 570, COLORS.ink),
    text(x + 34, noteY + 112, 'WATCH', 9, 760, COLORS.coral),
    wrappedText(x + 34, noteY + 136, refinement.watch, 66, 17, 9.2, 570, COLORS.muted),
  );
}

function pageFour(): string {
  const parts: string[] = [
    `<rect width="${WIDTH}" height="${PAGE_4_HEIGHT}" fill="${COLORS.page}"/>`,
    ...pageHeader(
      'CERTIFIED SUPPORT PIER · REFINEMENT PASS',
      'Direction B held as the control · three bounded adjustments to sealed access, console usability, and installed structural mass',
      '04 / REFINE B',
    ),
    panel(MARGIN, 102, WIDTH - MARGIN * 2, 72, COLORS.panelDark),
    text(
      MARGIN + 18,
      132,
      'REFINEMENT QUESTION',
      10,
      800,
      COLORS.green,
    ),
    text(
      MARGIN + 18,
      155,
      'Which version feels permanent, inaccessible, and recognizably QuotaCo-built while preserving one clearly usable console and avoiding a friendly robot mascot?',
      10.5,
      600,
      '#EEF2EE',
    ),
  ];
  const cardY = 194;
  const cardWidth = (WIDTH - MARGIN * 2 - GAP * 3) / 4;
  PIER_REFINEMENTS.forEach((refinement, index) => {
    refinementCard(
      parts,
      refinement,
      MARGIN + index * (cardWidth + GAP),
      cardY,
      cardWidth,
    );
  });
  parts.push(
    text(
      MARGIN,
      PAGE_4_HEIGHT - 22,
      'B0 remains accepted control only · B1/B2/B3 are unregistered review markup · no promotion implied',
      9.5,
      680,
      COLORS.coral,
    ),
    text(
      WIDTH - MARGIN,
      PAGE_4_HEIGHT - 22,
      'stop for refinement approval',
      9.5,
      720,
      COLORS.greenDark,
      'end',
    ),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${PAGE_4_HEIGHT}" viewBox="0 0 ${WIDTH} ${PAGE_4_HEIGHT}">${parts.join('')}</svg>`;
}

function rackStudyApparatusPlacement(
  study: RackStudyId,
  footprintX: number,
  footprintY: number,
  cell: number,
  live: boolean,
  guide = true,
): string {
  const footprintWidth = 2 * cell;
  const x = footprintX + (footprintWidth - cell) / 2;
  const y = footprintY + cell - cell * (116 / CANVAS);
  return (
    (guide ? occupancyGuide(footprintX, footprintY, footprintWidth, cell, '#B9D9C3') : '') +
    placedSvg(rackStudyApparatusSvg(study, live), x, y, cell)
  );
}

function rackStudyRoomScene(
  study: RackStudyId,
  x: number,
  y: number,
  cell: number,
): string {
  const parts: string[] = [];
  const columns = 7;
  const rows = 5;
  drawGrid(parts, x, y, columns, rows, cell);
  drawWalls(parts, x, y, columns, rows, cell, 'back');
  parts.push(
    rackStudyApparatusPlacement(study, x + .2 * cell, y + .75 * cell, cell, true),
    propPlacement('server-rack', x + 2.75 * cell, y + .75 * cell, cell),
    propPlacement('water-cooler', x + 4.0 * cell, y + .75 * cell, cell),
    propPlacement('desk', x + 5.1 * cell, y + 1.7 * cell, cell),
    employeePlacement(0, 'west', 'console', x + 2.15 * cell, y + 3.0 * cell, cell),
    refinedPierDockPlacement('sealed-register', x + 3.25 * cell, y + 3.1 * cell, cell, true, true),
    refinedPierCrewPlacement('sealed-register', 'north', 'neutral', x + 3.75 * cell, y + 4.0 * cell, cell),
    employeePlacement(1, 'south', 'neutral', x + 5.55 * cell, y + 3.85 * cell, cell),
  );
  drawWalls(parts, x, y, columns, rows, cell, 'front');
  return parts.join('');
}

function rackStudyCard(
  parts: string[],
  study: RackStudy,
  x: number,
  y: number,
  width: number,
): void {
  const height = 1430;
  parts.push(
    panel(x, y, width, height, study.tint),
    text(x + 18, y + 34, study.label, 15.5, 820, COLORS.greenDark),
    wrappedText(x + 18, y + 62, study.thesis, 74, 18, 9.8, 580, COLORS.muted),
    pill(
      x + width - 154,
      y + 16,
      136,
      study.id === 'b1-control' ? 'PROBLEM' : 'STUDY',
      study.id === 'b1-control' ? '#F2D9D2' : '#D8E8DE',
      study.id === 'b1-control' ? COLORS.coral : COLORS.greenDark,
    ),
    line(`M ${x + 18} ${y + 116} H ${x + width - 18}`, COLORS.rule, 1, .65),
  );

  const stateY = y + 140;
  const stateWidth = (width - 54) / 2;
  parts.push(
    text(x + 18, stateY, 'LIVE / DORMANT · EXTERIOR HELD', 9, 750, COLORS.blue),
    `<rect x="${x + 18}" y="${stateY + 16}" width="${stateWidth}" height="284" rx="9" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
    `<rect x="${x + 36 + stateWidth}" y="${stateY + 16}" width="${stateWidth}" height="284" rx="9" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
    placedSvg(
      rackStudyApparatusSvg(study.id, true),
      x + 18 + (stateWidth - 210) / 2,
      stateY + 30,
      210,
    ),
    placedSvg(
      rackStudyApparatusSvg(study.id, false),
      x + 36 + stateWidth + (stateWidth - 210) / 2,
      stateY + 30,
      210,
    ),
    text(x + 18 + stateWidth / 2, stateY + 276, 'live', 8.2, 680, COLORS.greenDark, 'middle'),
    text(x + 36 + stateWidth * 1.5, stateY + 276, 'dormant', 8.2, 680, COLORS.muted, 'middle'),
  );

  const scaleY = stateY + 326;
  parts.push(
    text(x + 18, scaleY, 'SILHOUETTE + ORDINARY-PROP CONTRAST', 9, 750, COLORS.blue),
    `<rect x="${x + 18}" y="${scaleY + 16}" width="${width - 36}" height="176" rx="9" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
    placedSvg(rackStudyApparatusSvg(study.id, true), x + 42, scaleY + 28, 128),
    placedSvg(rackStudyApparatusSvg(study.id, true), x + 210, scaleY + 60, 64),
    placedSvg(rackStudyApparatusSvg(study.id, true), x + 314, scaleY + 76, 32),
    placedSvg(composeCurrentProp(SERVER_RACK), x + width - 284, scaleY + 60, 80),
    placedSvg(composeCurrentProp(requiredProp('water-cooler')), x + width - 166, scaleY + 60, 80),
    text(x + 106, scaleY + 182, '128', 7.8, 650, COLORS.muted, 'middle'),
    text(x + 242, scaleY + 182, '64', 7.8, 650, COLORS.muted, 'middle'),
    text(x + 330, scaleY + 182, '32', 7.8, 650, COLORS.muted, 'middle'),
    text(x + width - 244, scaleY + 182, 'server', 7.8, 650, COLORS.muted, 'middle'),
    text(x + width - 126, scaleY + 182, 'water', 7.8, 650, COLORS.muted, 'middle'),
  );

  const logicY = scaleY + 220;
  parts.push(
    `<rect x="${x + 18}" y="${logicY}" width="${width - 36}" height="150" rx="9" fill="#FFFFFFAA" stroke="${COLORS.rule}"/>`,
    text(x + 34, logicY + 30, 'ARCHITECTURAL MOVE', 9, 760, COLORS.greenDark),
    wrappedText(x + 34, logicY + 56, study.architecture, 74, 18, 9.5, 580, COLORS.ink),
    text(x + 34, logicY + 120, study.id === 'b1-control' ? 'REMOVE THESE CUES' : 'KEEP CONSOLE / DOCK / CREW FIXED', 8.8, 740, COLORS.coral),
  );

  const contextY = logicY + 186;
  const normalCell = 58;
  const normalX = x + 18;
  const farCell = 34;
  const farX = x + width - 7 * farCell - 18;
  parts.push(
    text(normalX, contextY, 'NORMAL ROOM · 58 PX/CELL', 8.7, 750, COLORS.blue),
    rackStudyRoomScene(study.id, normalX, contextY + 16, normalCell),
    text(farX, contextY, 'FAR ROOM · 34 PX/CELL', 8.7, 750, COLORS.blue),
    rackStudyRoomScene(study.id, farX, contextY + 16, farCell),
  );

  const noteY = contextY + 336;
  parts.push(
    `<rect x="${x + 18}" y="${noteY}" width="${width - 36}" height="196" rx="9" fill="#FFFFFFAA" stroke="${COLORS.rule}"/>`,
    text(x + 34, noteY + 31, 'WATCH', 9, 760, COLORS.coral),
    wrappedText(x + 34, noteY + 58, study.watch, 76, 18, 9.5, 570, COLORS.muted),
    text(x + 34, noteY + 162, 'review-only · 2×1 footprint and iris_console anchor unchanged', 8.4, 650, COLORS.greenDark),
  );
}

function pageFive(): string {
  const parts: string[] = [
    `<rect width="${WIDTH}" height="${PAGE_5_HEIGHT}" fill="${COLORS.page}"/>`,
    ...pageHeader(
      'IRIS EQUIPMENT CORE · RACK ARCHITECTURE STUDY',
      'Focused response to the portable-toilet read · only the left equipment mass changes; B1 console, dock, crew, footprint, and state behavior stay fixed',
      '05 / RACK STUDY',
    ),
    panel(MARGIN, 102, WIDTH - MARGIN * 2, 118, COLORS.panelDark),
    text(MARGIN + 18, 132, 'WHY THE CURRENT RACK FAILS', 10, 800, COLORS.green),
    text(
      MARGIN + 18,
      157,
      'Human-height enclosure + door-sized inset + stacked door panels + roof-mounted cap = an occupiable plastic booth before it reads as infrastructure.',
      10.5,
      600,
      '#EEF2EE',
    ),
    text(
      MARGIN + 18,
      189,
      'This pass tests three different corrections: turn the mass sideways, split it into structural load paths, or make it widen toward the floor.',
      10.2,
      570,
      '#CCD6D0',
    ),
    pill(WIDTH - MARGIN - 294, 132, 268, 'NO PRODUCTION PROMOTION', '#F2DDD7', COLORS.coral),
  ];
  const cardY = 240;
  const cardWidth = (WIDTH - MARGIN * 2 - GAP * 3) / 4;
  RACK_STUDIES.forEach((study, index) => {
    rackStudyCard(
      parts,
      study,
      MARGIN + index * (cardWidth + GAP),
      cardY,
      cardWidth,
    );
  });
  parts.push(
    text(
      MARGIN,
      PAGE_5_HEIGHT - 22,
      'R0 is the diagnosed problem · R1/R2/R3 are unregistered review studies · ordinary server rack and water cooler included as recognition controls',
      9.5,
      680,
      COLORS.coral,
    ),
    text(
      WIDTH - MARGIN,
      PAGE_5_HEIGHT - 22,
      'stop for rack-direction approval',
      9.5,
      720,
      COLORS.greenDark,
      'end',
    ),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${PAGE_5_HEIGHT}" viewBox="0 0 ${WIDTH} ${PAGE_5_HEIGHT}">${parts.join('')}</svg>`;
}

function pageSix(): string {
  const parts: string[] = [
    `<rect width="${WIDTH}" height="${PAGE_6_HEIGHT}" fill="${COLORS.page}"/>`,
    ...pageHeader(
      'IRIS EQUIPMENT CORE · RACK CONVERGENCE',
      'R2 split pylons eliminated for locker drift · width-first and buttress studies converge into two more architectural machine-scale candidates',
      '06 / CONVERGE',
    ),
    panel(MARGIN, 102, WIDTH - MARGIN * 2, 118, COLORS.panelDark),
    text(MARGIN + 18, 132, 'SECOND-PASS QUESTION', 10, 800, COLORS.green),
    text(
      MARGIN + 18,
      157,
      'Can the equipment core remain unmistakably sealed and installed without resembling a toilet, locker pair, copier, or decorative staircase?',
      10.5,
      600,
      '#EEF2EE',
    ),
    text(
      MARGIN + 18,
      189,
      'C2 and C3 remove the roof-mounted optic, keep the service console subordinate, and expose structure or machine-scale modules instead of a human-scale door.',
      10.2,
      570,
      '#CCD6D0',
    ),
    pill(WIDTH - MARGIN - 294, 132, 268, 'NO PRODUCTION PROMOTION', '#F2DDD7', COLORS.coral),
  ];
  const cardY = 240;
  const cardWidth = (WIDTH - MARGIN * 2 - GAP * 3) / 4;
  RACK_CONVERGENCES.forEach((study, index) => {
    rackStudyCard(
      parts,
      study,
      MARGIN + index * (cardWidth + GAP),
      cardY,
      cardWidth,
    );
  });
  parts.push(
    text(
      MARGIN,
      PAGE_6_HEIGHT - 22,
      'C0/C1 are first-pass controls · C2/C3 are second-pass review studies · B1 family and all mechanical contracts remain unchanged',
      9.5,
      680,
      COLORS.coral,
    ),
    text(
      WIDTH - MARGIN,
      PAGE_6_HEIGHT - 22,
      'stop for rack-direction approval',
      9.5,
      720,
      COLORS.greenDark,
      'end',
    ),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${PAGE_6_HEIGHT}" viewBox="0 0 ${WIDTH} ${PAGE_6_HEIGHT}">${parts.join('')}</svg>`;
}

function formResetApparatusPlacement(
  study: FormResetId,
  footprintX: number,
  footprintY: number,
  cell: number,
  live: boolean,
  guide = true,
): string {
  const footprintWidth = 2 * cell;
  const x = footprintX + (footprintWidth - cell) / 2;
  const y = footprintY + cell - cell * (116 / CANVAS);
  return (
    (guide ? occupancyGuide(footprintX, footprintY, footprintWidth, cell, '#B9D9C3') : '') +
    placedSvg(formResetApparatusSvg(study, live), x, y, cell)
  );
}

function formResetRoomScene(
  study: FormResetId,
  x: number,
  y: number,
  cell: number,
): string {
  const parts: string[] = [];
  const columns = 7;
  const rows = 5;
  drawGrid(parts, x, y, columns, rows, cell);
  drawWalls(parts, x, y, columns, rows, cell, 'back');
  parts.push(
    formResetApparatusPlacement(study, x + .2 * cell, y + .75 * cell, cell, true),
    propPlacement('server-rack', x + 2.75 * cell, y + .75 * cell, cell),
    propPlacement('water-cooler', x + 4.0 * cell, y + .75 * cell, cell),
    propPlacement('desk', x + 5.1 * cell, y + 1.7 * cell, cell),
    employeePlacement(0, 'west', 'console', x + 2.15 * cell, y + 3.0 * cell, cell),
    refinedPierDockPlacement('sealed-register', x + 3.25 * cell, y + 3.1 * cell, cell, true, true),
    refinedPierCrewPlacement('sealed-register', 'north', 'neutral', x + 3.75 * cell, y + 4.0 * cell, cell),
    employeePlacement(1, 'south', 'neutral', x + 5.55 * cell, y + 3.85 * cell, cell),
  );
  drawWalls(parts, x, y, columns, rows, cell, 'front');
  return parts.join('');
}

function formResetScaleBay(
  study: FormResetId,
  x: number,
  y: number,
  width: number,
): string {
  const cell = 104;
  const baseY = y + 180;
  const subjectXs = [x + 84, x + 218, x + 352, x + 492, x + 640];
  const parts = [
    `<rect x="${x}" y="${y}" width="${width}" height="214" rx="9" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
    text(x + 16, y + 24, 'LITERAL SCALE · WALL / PEOPLE / ORDINARY SERVER', 8.8, 750, COLORS.blue),
    text(x + width - 16, y + 24, 'props ×1.0 · characters ×0.65', 8.2, 690, COLORS.coral, 'end'),
    line(`M ${x + 24} ${baseY} H ${x + width - 24}`, COLORS.rule, 1.3, .72),
    line(`M ${x + 24} ${baseY - cell * WALL_DATUM / CANVAS} H ${x + width - 24}`, COLORS.greenDark, 1, .45, '5 4'),
    placedSvg(formResetApparatusSvg(study, true), subjectXs[0] - cell / 2, baseY - cell * 116 / CANVAS, cell),
    characterPlacement(employeeSvg(DEFAULT_CAST[0], 'south'), subjectXs[1], baseY, cell),
    characterPlacement(refinedPierCrewSvg('sealed-register', 'south'), subjectXs[2], baseY, cell),
    placedSvg(composeCurrentProp(SERVER_RACK), subjectXs[3] - cell / 2, baseY - cell * 116 / CANVAS, cell),
    wallTile(10, subjectXs[4] - cell / 2, baseY - cell, cell),
  ];
  ['apparatus', 'employee', 'fab unit', 'server', '112u wall'].forEach((labelValue, index) => {
    parts.push(text(subjectXs[index], y + 204, labelValue, 7.5, 650, COLORS.muted, 'middle'));
  });
  return parts.join('');
}

function formResetCard(
  parts: string[],
  study: FormResetStudy,
  x: number,
  y: number,
  width: number,
): void {
  const height = 1430;
  parts.push(
    panel(x, y, width, height, study.tint),
    text(x + 18, y + 34, study.label, 15.5, 820, COLORS.greenDark),
    wrappedText(x + 18, y + 62, study.thesis, 74, 18, 9.8, 580, COLORS.muted),
    pill(x + width - 154, y + 16, 136, 'FORM RESET', '#D8E8DE', COLORS.greenDark),
    line(`M ${x + 18} ${y + 116} H ${x + width - 18}`, COLORS.rule, 1, .65),
  );

  const stateY = y + 140;
  const stateWidth = (width - 54) / 2;
  parts.push(
    text(x + 18, stateY, 'LIVE / DORMANT · ONE SILHOUETTE', 9, 750, COLORS.blue),
    `<rect x="${x + 18}" y="${stateY + 16}" width="${stateWidth}" height="254" rx="9" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
    `<rect x="${x + 36 + stateWidth}" y="${stateY + 16}" width="${stateWidth}" height="254" rx="9" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
    placedSvg(formResetApparatusSvg(study.id, true), x + 18 + (stateWidth - 190) / 2, stateY + 28, 190),
    placedSvg(formResetApparatusSvg(study.id, false), x + 36 + stateWidth + (stateWidth - 190) / 2, stateY + 28, 190),
    text(x + 18 + stateWidth / 2, stateY + 246, 'live', 8.2, 680, COLORS.greenDark, 'middle'),
    text(x + 36 + stateWidth * 1.5, stateY + 246, 'dormant', 8.2, 680, COLORS.muted, 'middle'),
  );

  const zoomY = stateY + 288;
  parts.push(
    text(x + 18, zoomY, 'CLOSE / NORMAL / FAR · NO PANEL DETAIL DEPENDENCY', 9, 750, COLORS.blue),
    `<rect x="${x + 18}" y="${zoomY + 16}" width="${width - 36}" height="154" rx="9" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
    placedSvg(formResetApparatusSvg(study.id, true), x + 50, zoomY + 24, 120),
    placedSvg(formResetApparatusSvg(study.id, true), x + 232, zoomY + 54, 60),
    placedSvg(formResetApparatusSvg(study.id, true), x + 356, zoomY + 69, 30),
    placedSvg(formResetApparatusSvg(study.id, false), x + width - 184, zoomY + 42, 84),
    text(x + 110, zoomY + 160, '128-ish', 7.7, 650, COLORS.muted, 'middle'),
    text(x + 262, zoomY + 160, '64', 7.7, 650, COLORS.muted, 'middle'),
    text(x + 371, zoomY + 160, '32', 7.7, 650, COLORS.muted, 'middle'),
    text(x + width - 142, zoomY + 160, 'dormant', 7.7, 650, COLORS.muted, 'middle'),
  );

  const scaleY = zoomY + 194;
  parts.push(formResetScaleBay(study.id, x + 18, scaleY, width - 36));

  const contextY = scaleY + 240;
  const normalCell = 52;
  const farCell = 30;
  const normalX = x + 18;
  const farX = x + width - 7 * farCell - 18;
  parts.push(
    text(normalX, contextY, 'NORMAL ROOM · 52 PX/CELL', 8.7, 750, COLORS.blue),
    formResetRoomScene(study.id, normalX, contextY + 16, normalCell),
    text(farX, contextY, 'FAR ROOM · 30 PX/CELL', 8.7, 750, COLORS.blue),
    formResetRoomScene(study.id, farX, contextY + 16, farCell),
  );

  const noteY = contextY + 292;
  parts.push(
    `<rect x="${x + 18}" y="${noteY}" width="${width - 36}" height="204" rx="9" fill="#FFFFFFAA" stroke="${COLORS.rule}"/>`,
    text(x + 34, noteY + 29, 'BREAKS THE OLD GRAMMAR', 9, 760, COLORS.greenDark),
    wrappedText(x + 34, noteY + 55, study.avoids, 76, 18, 9.4, 570, COLORS.ink),
    text(x + 34, noteY + 124, 'NEW RISK', 9, 760, COLORS.coral),
    wrappedText(x + 34, noteY + 150, study.risk, 76, 18, 9.4, 570, COLORS.muted),
  );
}

function pageSeven(): string {
  const parts: string[] = [
    `<rect width="${WIDTH}" height="${PAGE_7_HEIGHT}" fill="${COLORS.page}"/>`,
    ...pageHeader(
      'IRIS INSTALLATION UNIT · FUNDAMENTAL FORM RESET',
      'Previous rack studies rejected: appliance fronts became garage doors and stacked structural mass became birthday cakes',
      '07 / FORM RESET',
    ),
    panel(MARGIN, 102, WIDTH - MARGIN * 2, 118, COLORS.panelDark),
    text(MARGIN + 18, 132, 'RESET RULE', 10, 800, COLORS.green),
    text(
      MARGIN + 18,
      157,
      'No front-facing human door. No tier stack. No panel grid. No rooftop beacon. No attempt to rescue the old appliance silhouette with more detail.',
      10.5,
      600,
      '#EEF2EE',
    ),
    text(
      MARGIN + 18,
      189,
      'Machine-first assumption: four distinct physical organizations, each still floor-standing, wall-adjacent, 2×1, sealed, relocatable, and visibly usable by a person.',
      10.2,
      570,
      '#CCD6D0',
    ),
    pill(WIDTH - MARGIN - 294, 132, 268, 'SILHOUETTE STUDY ONLY', '#F2DDD7', COLORS.coral),
  ];
  const cardY = 240;
  const cardWidth = (WIDTH - MARGIN * 2 - GAP * 3) / 4;
  FORM_RESET_STUDIES.forEach((study, index) => {
    formResetCard(parts, study, MARGIN + index * (cardWidth + GAP), cardY, cardWidth);
  });
  parts.push(
    text(
      MARGIN,
      PAGE_7_HEIGHT - 22,
      'All four are unregistered form studies · B1 dock and fabrication unit held only as scale controls · no production direction selected',
      9.5,
      680,
      COLORS.coral,
    ),
    text(
      WIDTH - MARGIN,
      PAGE_7_HEIGHT - 22,
      'stop for form-family approval',
      9.5,
      720,
      COLORS.greenDark,
      'end',
    ),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${PAGE_7_HEIGHT}" viewBox="0 0 ${WIDTH} ${PAGE_7_HEIGHT}">${parts.join('')}</svg>`;
}

function spatialResetApparatusPlacement(
  study: SpatialResetId,
  footprintX: number,
  footprintY: number,
  cell: number,
  live: boolean,
  guide = true,
): string {
  const footprintWidth = 2 * cell;
  const x = footprintX + (footprintWidth - cell) / 2;
  const y = footprintY + cell - cell * (116 / CANVAS);
  return (
    (guide ? occupancyGuide(footprintX, footprintY, footprintWidth, cell, '#B9D9C3') : '') +
    placedSvg(spatialResetApparatusSvg(study, live), x, y, cell)
  );
}

function spatialResetRoomScene(
  study: SpatialResetId,
  x: number,
  y: number,
  cell: number,
): string {
  const parts: string[] = [];
  const columns = 8;
  const rows = 5;
  drawGrid(parts, x, y, columns, rows, cell);
  drawWalls(parts, x, y, columns, rows, cell, 'back');
  parts.push(
    spatialResetApparatusPlacement(study, x + .2 * cell, y + .75 * cell, cell, true),
    propPlacement('server-rack', x + 2.8 * cell, y + .75 * cell, cell),
    propPlacement('water-cooler', x + 4.0 * cell, y + .75 * cell, cell),
    propPlacement('desk', x + 6.0 * cell, y + 1.65 * cell, cell),
    employeePlacement(0, 'west', 'console', x + 2.15 * cell, y + 3.0 * cell, cell),
    refinedPierDockPlacement('sealed-register', x + 3.45 * cell, y + 3.1 * cell, cell, true, true),
    refinedPierCrewPlacement('sealed-register', 'north', 'neutral', x + 3.95 * cell, y + 4.0 * cell, cell),
    employeePlacement(1, 'south', 'neutral', x + 6.25 * cell, y + 3.85 * cell, cell),
  );
  drawWalls(parts, x, y, columns, rows, cell, 'front');
  return parts.join('');
}

function spatialResetConsoleInset(
  study: SpatialResetId,
  x: number,
  y: number,
  cell: number,
): string {
  const parts: string[] = [];
  drawGrid(parts, x, y, 4, 3, cell);
  drawWalls(parts, x, y, 4, 3, cell, 'back');
  parts.push(
    spatialResetApparatusPlacement(study, x + .1 * cell, y + .45 * cell, cell, true),
    employeePlacement(0, 'west', 'console', x + 2.5 * cell, y + 2.28 * cell, cell),
    `<circle cx="${x + 2.04 * cell}" cy="${y + 1.96 * cell}" r="${cell * .12}" fill="none" stroke="${COLORS.coral}" stroke-width="2.3"/>`,
  );
  drawWalls(parts, x, y, 4, 3, cell, 'front');
  return parts.join('');
}

function spatialResetPlanDiagram(
  study: SpatialResetId,
  x: number,
  y: number,
  width: number,
  height: number,
): string {
  const boxX = x + 22;
  const boxY = y + 35;
  const boxW = width - 44;
  const boxH = height - 58;
  const rack = '#AEB8B3';
  const console = '#596460';
  const parts = [
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="9" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
    text(x + 14, y + 23, '2×1 PLAN LOGIC · WALL AT TOP', 8.7, 750, COLORS.blue),
    `<rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" fill="#DDE2DE44" stroke="#7F8984" stroke-width="1.5" stroke-dasharray="6 5"/>`,
    `<path d="M ${boxX} ${boxY - 5} H ${boxX + boxW}" stroke="${COLORS.ink}" stroke-width="5"/>`,
  ];
  if (study === 'side-rack-console') {
    parts.push(
      `<rect x="${boxX + 12}" y="${boxY + 10}" width="${boxW * .25}" height="${boxH * .72}" rx="4" fill="${rack}" stroke="${COLORS.ink}" stroke-width="2"/>`,
      `<path d="M ${boxX + boxW * .30} ${boxY + boxH * .42} H ${boxX + boxW * .84} V ${boxY + boxH * .72} H ${boxX + boxW * .30} Z" fill="${console}" stroke="${COLORS.ink}" stroke-width="2"/>`,
    );
  } else if (study === 'console-bridge') {
    parts.push(
      `<rect x="${boxX + 12}" y="${boxY + 10}" width="${boxW * .18}" height="${boxH * .72}" rx="4" fill="${rack}" stroke="${COLORS.ink}" stroke-width="2"/>`,
      `<rect x="${boxX + boxW * .72}" y="${boxY + 10}" width="${boxW * .18}" height="${boxH * .72}" rx="4" fill="${rack}" stroke="${COLORS.ink}" stroke-width="2"/>`,
      `<path d="M ${boxX + boxW * .22} ${boxY + boxH * .40} H ${boxX + boxW * .78} V ${boxY + boxH * .72} H ${boxX + boxW * .22} Z" fill="${console}" stroke="${COLORS.ink}" stroke-width="2"/>`,
    );
  } else {
    parts.push(
      `<rect x="${boxX + 12}" y="${boxY + 10}" width="${boxW - 24}" height="${boxH * .30}" rx="4" fill="${rack}" stroke="${COLORS.ink}" stroke-width="2"/>`,
      `<path d="M ${boxX + boxW * .38} ${boxY + boxH * .35} H ${boxX + boxW * .64} V ${boxY + boxH * .82} H ${boxX + boxW * .38} Z" fill="${console}" stroke="${COLORS.ink}" stroke-width="2"/>`,
    );
  }
  parts.push(
    `<circle cx="${boxX + boxW * .58}" cy="${boxY + boxH - 8}" r="7" fill="#D6A982" stroke="${COLORS.ink}" stroke-width="1.8"/>`,
    `<path d="M ${boxX + boxW * .58} ${boxY + boxH - 15} V ${boxY + boxH - 28}" stroke="${COLORS.coral}" stroke-width="2"/>`,
    text(boxX + boxW - 8, boxY + boxH - 8, 'operator', 7.5, 650, COLORS.muted, 'end'),
  );
  return parts.join('');
}

function spatialResetCard(
  parts: string[],
  study: SpatialResetStudy,
  x: number,
  y: number,
  width: number,
): void {
  const height = 1480;
  parts.push(
    panel(x, y, width, height, study.tint),
    text(x + 20, y + 36, study.label, 17, 820, COLORS.greenDark),
    wrappedText(x + 20, y + 68, study.thesis, 98, 19, 10.2, 580, COLORS.muted),
    pill(x + width - 174, y + 18, 154, 'SPATIAL RESET', '#D8E8DE', COLORS.greenDark),
    line(`M ${x + 20} ${y + 122} H ${x + width - 20}`, COLORS.rule, 1, .65),
  );

  const stateY = y + 146;
  const stateWidth = (width - 58) / 2;
  parts.push(
    text(x + 20, stateY, 'LIVE / DORMANT · IDENTICAL PHYSICAL STATION', 9.3, 750, COLORS.blue),
    `<rect x="${x + 20}" y="${stateY + 18}" width="${stateWidth}" height="274" rx="9" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
    `<rect x="${x + 38 + stateWidth}" y="${stateY + 18}" width="${stateWidth}" height="274" rx="9" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
    placedSvg(spatialResetApparatusSvg(study.id, true), x + 20 + (stateWidth - 220) / 2, stateY + 30, 220),
    placedSvg(spatialResetApparatusSvg(study.id, false), x + 38 + stateWidth + (stateWidth - 220) / 2, stateY + 30, 220),
    text(x + 20 + stateWidth / 2, stateY + 266, 'live', 8.4, 680, COLORS.greenDark, 'middle'),
    text(x + 38 + stateWidth * 1.5, stateY + 266, 'dormant', 8.4, 680, COLORS.muted, 'middle'),
  );

  const logicY = stateY + 316;
  const planWidth = 330;
  const insetCell = 56;
  const insetX = x + width - 4 * insetCell - 20;
  parts.push(
    spatialResetPlanDiagram(study.id, x + 20, logicY, planWidth, 198),
    text(insetX, logicY, 'CONSOLE APPROACH · HUMAN BRIDGE', 8.7, 750, COLORS.blue),
    spatialResetConsoleInset(study.id, insetX, logicY + 18, insetCell),
  );

  const scaleY = logicY + 226;
  parts.push(formResetScaleBayForSpatial(study.id, x + 20, scaleY, width - 40));

  const contextY = scaleY + 242;
  const normalCell = 54;
  const farCell = 31;
  const normalX = x + 20;
  const farX = x + width - 8 * farCell - 20;
  parts.push(
    text(normalX, contextY, 'NORMAL ROOM · 54 PX/CELL', 8.8, 750, COLORS.blue),
    spatialResetRoomScene(study.id, normalX, contextY + 17, normalCell),
    text(farX, contextY, 'FAR ROOM · 31 PX/CELL', 8.8, 750, COLORS.blue),
    spatialResetRoomScene(study.id, farX, contextY + 17, farCell),
  );

  const noteY = contextY + 306;
  parts.push(
    `<rect x="${x + 20}" y="${noteY}" width="${width - 40}" height="206" rx="9" fill="#FFFFFFAA" stroke="${COLORS.rule}"/>`,
    text(x + 38, noteY + 31, 'PHYSICAL READ', 9.2, 760, COLORS.greenDark),
    wrappedText(x + 38, noteY + 58, study.physicalRead, 98, 19, 9.7, 570, COLORS.ink),
    text(x + 38, noteY + 127, 'WATCH', 9.2, 760, COLORS.coral),
    wrappedText(x + 38, noteY + 154, study.risk, 98, 19, 9.7, 570, COLORS.muted),
  );
}

function formResetScaleBayForSpatial(
  study: SpatialResetId,
  x: number,
  y: number,
  width: number,
): string {
  const cell = 104;
  const baseY = y + 180;
  const subjectXs = [x + 94, x + 256, x + 420, x + 590, x + 776];
  const parts = [
    `<rect x="${x}" y="${y}" width="${width}" height="214" rx="9" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
    text(x + 16, y + 24, 'LITERAL SCALE · WALL / PEOPLE / ORDINARY SERVER', 8.8, 750, COLORS.blue),
    text(x + width - 16, y + 24, 'props ×1.0 · characters ×0.65', 8.2, 690, COLORS.coral, 'end'),
    line(`M ${x + 24} ${baseY} H ${x + width - 24}`, COLORS.rule, 1.3, .72),
    line(`M ${x + 24} ${baseY - cell * WALL_DATUM / CANVAS} H ${x + width - 24}`, COLORS.greenDark, 1, .45, '5 4'),
    placedSvg(spatialResetApparatusSvg(study, true), subjectXs[0] - cell / 2, baseY - cell * 116 / CANVAS, cell),
    characterPlacement(employeeSvg(DEFAULT_CAST[0], 'south'), subjectXs[1], baseY, cell),
    characterPlacement(refinedPierCrewSvg('sealed-register', 'south'), subjectXs[2], baseY, cell),
    placedSvg(composeCurrentProp(SERVER_RACK), subjectXs[3] - cell / 2, baseY - cell * 116 / CANVAS, cell),
    wallTile(10, subjectXs[4] - cell / 2, baseY - cell, cell),
  ];
  ['apparatus', 'employee', 'fab unit', 'server', '112u wall'].forEach((labelValue, index) => {
    parts.push(text(subjectXs[index], y + 204, labelValue, 7.5, 650, COLORS.muted, 'middle'));
  });
  return parts.join('');
}

function pageEight(): string {
  const parts: string[] = [
    `<rect width="${WIDTH}" height="${PAGE_8_HEIGHT}" fill="${COLORS.page}"/>`,
    ...pageHeader(
      'IRIS INSTALLATION UNIT · SPATIAL LAYOUT RESET',
      'Rack and console are no longer one front-facing appliance · three wall-adjacent operator-station layouts inside the locked 2×1 footprint',
      '08 / SPATIAL RESET',
    ),
    panel(MARGIN, 102, WIDTH - MARGIN * 2, 118, COLORS.panelDark),
    text(MARGIN + 18, 132, 'NEW PREMISE', 10, 800, COLORS.green),
    text(
      MARGIN + 18,
      157,
      'The rack belongs along the wall plane; the human console belongs on a separate surface projecting toward the operator. Their relationship, not a decorated facade, carries recognition.',
      10.5,
      600,
      '#EEF2EE',
    ),
    text(
      MARGIN + 18,
      189,
      'All three remove the continuous plinth, roof beacon, access-door face, and tiered mass. Plan diagrams make the physical organization explicit before detail styling resumes.',
      10.2,
      570,
      '#CCD6D0',
    ),
    pill(WIDTH - MARGIN - 294, 132, 268, 'LAYOUT STUDY ONLY', '#F2DDD7', COLORS.coral),
  ];
  const cardY = 240;
  const cardWidth = (WIDTH - MARGIN * 2 - GAP * 2) / 3;
  SPATIAL_RESET_STUDIES.forEach((study, index) => {
    spatialResetCard(parts, study, MARGIN + index * (cardWidth + GAP), cardY, cardWidth);
  });
  parts.push(
    text(
      MARGIN,
      PAGE_8_HEIGHT - 22,
      'All three are unregistered spatial studies · live/dormant silhouette and locked mechanical contracts held · no production direction selected',
      9.5,
      680,
      COLORS.coral,
    ),
    text(
      WIDTH - MARGIN,
      PAGE_8_HEIGHT - 22,
      'stop for spatial-family approval',
      9.5,
      720,
      COLORS.greenDark,
      'end',
    ),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${PAGE_8_HEIGHT}" viewBox="0 0 ${WIDTH} ${PAGE_8_HEIGHT}">${parts.join('')}</svg>`;
}

function gamifiedApparatusPlacement(
  study: GamifiedStudyId,
  footprintX: number,
  footprintY: number,
  cell: number,
  live: boolean,
  guide = true,
): string {
  const footprintWidth = 2 * cell;
  const x = footprintX + (footprintWidth - cell) / 2;
  const y = footprintY + cell - cell * (116 / CANVAS);
  return (
    (guide ? occupancyGuide(footprintX, footprintY, footprintWidth, cell, '#B9D9C3') : '') +
    placedSvg(gamifiedApparatusSvg(study, live), x, y, cell)
  );
}

function gamifiedRoomScene(
  study: GamifiedStudyId,
  x: number,
  y: number,
  cell: number,
): string {
  const parts: string[] = [];
  const columns = 7;
  const rows = 5;
  drawGrid(parts, x, y, columns, rows, cell);
  drawWalls(parts, x, y, columns, rows, cell, 'back');
  parts.push(
    gamifiedApparatusPlacement(study, x + .2 * cell, y + .75 * cell, cell, true),
    propPlacement('server-rack', x + 2.75 * cell, y + .75 * cell, cell),
    propPlacement('water-cooler', x + 4.0 * cell, y + .75 * cell, cell),
    propPlacement('desk', x + 5.1 * cell, y + 1.7 * cell, cell),
    employeePlacement(0, 'west', 'console', x + 2.15 * cell, y + 3.0 * cell, cell),
    refinedPierDockPlacement('sealed-register', x + 3.25 * cell, y + 3.1 * cell, cell, true, true),
    refinedPierCrewPlacement('sealed-register', 'north', 'neutral', x + 3.75 * cell, y + 4.0 * cell, cell),
    employeePlacement(1, 'south', 'neutral', x + 5.55 * cell, y + 3.85 * cell, cell),
  );
  drawWalls(parts, x, y, columns, rows, cell, 'front');
  return parts.join('');
}

type PromotionSource = 'approved-d3' | 'production';

function promotionApparatusSvg(source: PromotionSource, live: boolean): string {
  return source === 'approved-d3'
    ? gamifiedApparatusSvg('detail-integrated', live)
    : directionProp('current', live ? 'apparatus-live' : 'apparatus-dormant');
}

function promotionRoomScene(
  source: PromotionSource,
  x: number,
  y: number,
  cell: number,
): string {
  const parts: string[] = [];
  const columns = 7;
  const rows = 5;
  drawGrid(parts, x, y, columns, rows, cell);
  drawWalls(parts, x, y, columns, rows, cell, 'back');
  const apparatus = source === 'approved-d3'
    ? gamifiedApparatusPlacement('detail-integrated', x + .2 * cell, y + .75 * cell, cell, true)
    : apparatusPlacement('current', x + .2 * cell, y + .75 * cell, cell, true);
  parts.push(
    apparatus,
    propPlacement('server-rack', x + 2.75 * cell, y + .75 * cell, cell),
    propPlacement('water-cooler', x + 4.0 * cell, y + .75 * cell, cell),
    propPlacement('desk', x + 5.1 * cell, y + 1.7 * cell, cell),
    employeePlacement(0, 'west', 'console', x + 2.15 * cell, y + 3.0 * cell, cell),
    dockPlacement('current', x + 3.25 * cell, y + 3.1 * cell, cell, true, true),
    crewPlacement('current', 'north', 'neutral', x + 3.75 * cell, y + 4.0 * cell, cell),
    employeePlacement(1, 'south', 'neutral', x + 5.55 * cell, y + 3.85 * cell, cell),
  );
  drawWalls(parts, x, y, columns, rows, cell, 'front');
  return parts.join('');
}

function promotionComparisonPanel(
  parts: string[],
  source: PromotionSource,
  x: number,
  y: number,
  width: number,
): void {
  const approved = source === 'approved-d3';
  parts.push(
    panel(x, y, width, 450, approved ? '#E8E5D8' : '#DDE9E2'),
    text(x + 22, y + 36, approved ? 'APPROVED D3 TARGET' : 'REGISTERED PRODUCTION', 16, 820, COLORS.greenDark),
    text(
      x + 22,
      y + 62,
      approved ? 'Independent proof geometry' : 'composeProp(DEFAULT_PROPS) after promotion',
      9.8,
      600,
      COLORS.muted,
    ),
    pill(x + width - 182, y + 18, 160, approved ? 'REFERENCE' : 'SOURCE TRUTH', '#D8E8DE', COLORS.greenDark),
  );
  const live = promotionApparatusSvg(source, true);
  const dormant = promotionApparatusSvg(source, false);
  parts.push(
    `<rect x="${x + 22}" y="${y + 84}" width="320" height="324" rx="10" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
    `<rect x="${x + 358}" y="${y + 84}" width="320" height="324" rx="10" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
    placedSvg(live, x + 67, y + 102, 230),
    placedSvg(dormant, x + 403, y + 102, 230),
    text(x + 182, y + 388, 'live', 9, 720, COLORS.greenDark, 'middle'),
    text(x + 518, y + 388, 'dormant', 9, 720, COLORS.muted, 'middle'),
    text(x + 714, y + 104, '128 / 64 / 32 · REGISTER CHECK', 9, 760, COLORS.blue),
    `<rect x="${x + 714}" y="${y + 120}" width="${width - 736}" height="288" rx="10" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
    placedSvg(live, x + 754, y + 142, 192),
    placedSvg(live, x + 990, y + 206, 96),
    placedSvg(live, x + 1136, y + 238, 48),
    placedSvg(dormant, x + width - 246, y + 174, 150),
    text(x + 850, y + 382, '128', 8, 680, COLORS.muted, 'middle'),
    text(x + 1038, y + 382, '64', 8, 680, COLORS.muted, 'middle'),
    text(x + 1160, y + 382, '32', 8, 680, COLORS.muted, 'middle'),
    text(x + width - 171, y + 382, 'dormant', 8, 680, COLORS.muted, 'middle'),
  );
}

function gamifiedCard(
  parts: string[],
  study: GamifiedStudy,
  x: number,
  y: number,
  width: number,
): void {
  const height = 1280;
  const isRejectedControl = study.label.startsWith('G0');
  const isControl = study.label.startsWith('C0') || study.label.startsWith('D0');
  const isDetailStudy = study.label.startsWith('D');
  parts.push(
    panel(x, y, width, height, study.tint),
    text(x + 18, y + 34, study.label, 15.5, 820, COLORS.greenDark),
    wrappedText(x + 18, y + 62, study.thesis, 74, 18, 9.8, 580, COLORS.muted),
    pill(
      x + width - 154,
      y + 16,
      136,
      isRejectedControl ? 'REJECT' : isControl ? 'CONTROL' : 'STUDY',
      isRejectedControl ? '#F2D9D2' : '#D8E8DE',
      isRejectedControl ? COLORS.coral : COLORS.greenDark,
    ),
    line(`M ${x + 18} ${y + 112} H ${x + width - 18}`, COLORS.rule, 1, .65),
  );

  const stateY = y + 136;
  const stateWidth = (width - 54) / 2;
  parts.push(
    text(x + 18, stateY, 'LIVE / DORMANT · IDENTICAL SILHOUETTE', 9, 750, COLORS.blue),
    `<rect x="${x + 18}" y="${stateY + 16}" width="${stateWidth}" height="254" rx="9" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
    `<rect x="${x + 36 + stateWidth}" y="${stateY + 16}" width="${stateWidth}" height="254" rx="9" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
    placedSvg(gamifiedApparatusSvg(study.id, true), x + 18 + (stateWidth - 190) / 2, stateY + 28, 190),
    placedSvg(gamifiedApparatusSvg(study.id, false), x + 36 + stateWidth + (stateWidth - 190) / 2, stateY + 28, 190),
    text(x + 18 + stateWidth / 2, stateY + 246, 'live', 8.2, 680, COLORS.greenDark, 'middle'),
    text(x + 36 + stateWidth * 1.5, stateY + 246, 'dormant', 8.2, 680, COLORS.muted, 'middle'),
  );

  const scaleY = stateY + 290;
  parts.push(
    text(x + 18, scaleY, '128 / 64 / 32 · ALIAS STRESS', 9, 750, COLORS.blue),
    `<rect x="${x + 18}" y="${scaleY + 16}" width="${width - 36}" height="160" rx="9" fill="#FBFAF5" stroke="${COLORS.rule}"/>`,
    placedSvg(gamifiedApparatusSvg(study.id, true), x + 50, scaleY + 24, 120),
    placedSvg(gamifiedApparatusSvg(study.id, true), x + 232, scaleY + 54, 60),
    placedSvg(gamifiedApparatusSvg(study.id, true), x + 356, scaleY + 69, 30),
    placedSvg(gamifiedApparatusSvg(study.id, false), x + width - 188, scaleY + 42, 86),
    text(x + 110, scaleY + 165, '128', 7.7, 650, COLORS.muted, 'middle'),
    text(x + 262, scaleY + 165, '64', 7.7, 650, COLORS.muted, 'middle'),
    text(x + 371, scaleY + 165, '32', 7.7, 650, COLORS.muted, 'middle'),
    text(x + width - 145, scaleY + 165, 'dormant', 7.7, 650, COLORS.muted, 'middle'),
  );

  const contextY = scaleY + 196;
  const normalCell = 52;
  const farCell = 30;
  const normalX = x + 18;
  const farX = x + width - 7 * farCell - 18;
  parts.push(
    text(normalX, contextY, 'NORMAL ROOM · 52 PX/CELL', 8.7, 750, COLORS.blue),
    gamifiedRoomScene(study.id, normalX, contextY + 16, normalCell),
    text(farX, contextY, 'FAR ROOM · 30 PX/CELL', 8.7, 750, COLORS.blue),
    gamifiedRoomScene(study.id, farX, contextY + 16, farCell),
  );

  const noteY = contextY + 292;
  parts.push(
    `<rect x="${x + 18}" y="${noteY}" width="${width - 36}" height="230" rx="9" fill="#FFFFFFAA" stroke="${COLORS.rule}"/>`,
    text(x + 34, noteY + 30, isDetailStudy ? 'REFINEMENT EFFECT' : 'BREAKS THE NES READ', 9, 760, COLORS.greenDark),
    wrappedText(x + 34, noteY + 56, study.breaks, 76, 18, 9.4, 570, COLORS.ink),
    text(x + 34, noteY + 132, 'WATCH', 9, 760, COLORS.coral),
    wrappedText(x + 34, noteY + 158, study.watch, 76, 18, 9.4, 570, COLORS.muted),
  );
}

function pageEleven(): string {
  const parts: string[] = [
    `<rect width="${WIDTH}" height="${PAGE_11_HEIGHT}" fill="${COLORS.page}"/>`,
    ...pageHeader(
      'IRIS INSTALLATION UNIT · GAMIFIED ALIAS TEST',
      'The selected Brutalist center concept is attractive at concept scale but collapses toward an NES-like game console when reduced',
      '11 / NES AUDIT',
    ),
    panel(MARGIN, 102, WIDTH - MARGIN * 2, 118, COLORS.panelDark),
    text(MARGIN + 18, 132, 'ALIAS DIAGNOSIS', 10, 800, COLORS.green),
    text(
      MARGIN + 18,
      157,
      'Two equal pale masses + one dark center slot + one centered sloped deck form a recognizable entertainment-console icon before material or scale can argue otherwise.',
      10.5,
      600,
      '#EEF2EE',
    ),
    text(
      MARGIN + 18,
      189,
      'This sheet holds the Brutalist material ancestry but tests offset core, side console, and dominant-pier silhouettes directly at 128 / 64 / 32.',
      10.2,
      570,
      '#CCD6D0',
    ),
    pill(WIDTH - MARGIN - 294, 132, 268, 'GAME-SCALE FORM TEST', '#F2DDD7', COLORS.coral),
  ];
  const cardY = 240;
  const cardWidth = (WIDTH - MARGIN * 2 - GAP * 3) / 4;
  GAMIFIED_STUDIES.forEach((study, index) => {
    gamifiedCard(parts, study, MARGIN + index * (cardWidth + GAP), cardY, cardWidth);
  });
  parts.push(
    text(
      MARGIN,
      PAGE_11_HEIGHT - 22,
      'G0 is the rejected alias control · G1/G2/G3 are unregistered game-scale studies · 2×1 footprint and all mechanical contracts remain unchanged',
      9.5,
      680,
      COLORS.coral,
    ),
    text(
      WIDTH - MARGIN,
      PAGE_11_HEIGHT - 22,
      'stop for silhouette approval',
      9.5,
      720,
      COLORS.greenDark,
      'end',
    ),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${PAGE_11_HEIGHT}" viewBox="0 0 ${WIDTH} ${PAGE_11_HEIGHT}">${parts.join('')}</svg>`;
}

function pageTwelve(): string {
  const parts: string[] = [
    `<rect width="${WIDTH}" height="${PAGE_12_HEIGHT}" fill="${COLORS.page}"/>`,
    ...pageHeader(
      'IRIS INSTALLATION UNIT · CENTERED-CONSOLE RETENTION',
      'Structural coherence held · NES alias tested through mass, depth, and sheathing rather than relocating the human interface',
      '12 / COHERENCE PASS',
    ),
    panel(MARGIN, 102, WIDTH - MARGIN * 2, 118, COLORS.panelDark),
    text(MARGIN + 18, 132, 'REVISED PREMISE', 10, 800, COLORS.green),
    text(
      MARGIN + 18,
      157,
      'The centered console is not the problem; it is the clearest evidence that the object was designed for a human operator. Break the alias around it.',
      10.5,
      600,
      '#EEF2EE',
    ),
    text(
      MARGIN + 18,
      189,
      'Every study keeps the same centered deck and support. Only structural weighting, high-oblique depth, or light-dark sheathing changes.',
      10.2,
      570,
      '#CCD6D0',
    ),
    pill(WIDTH - MARGIN - 310, 132, 284, 'CENTER CONSOLE LOCKED', '#D8E8DE', COLORS.greenDark),
  ];
  const cardY = 240;
  const cardWidth = (WIDTH - MARGIN * 2 - GAP * 3) / 4;
  CENTERED_CONSOLE_STUDIES.forEach((study, index) => {
    gamifiedCard(parts, study, MARGIN + index * (cardWidth + GAP), cardY, cardWidth);
  });
  parts.push(
    text(
      MARGIN,
      PAGE_12_HEIGHT - 22,
      'C0 is the coherence control · C1/C2/C3 alter surrounding architecture only · all are unregistered review studies with the locked 2×1 contract',
      9.5,
      680,
      COLORS.coral,
    ),
    text(
      WIDTH - MARGIN,
      PAGE_12_HEIGHT - 22,
      'stop for structural approval',
      9.5,
      720,
      COLORS.greenDark,
      'end',
    ),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${PAGE_12_HEIGHT}" viewBox="0 0 ${WIDTH} ${PAGE_12_HEIGHT}">${parts.join('')}</svg>`;
}

function pageThirteen(): string {
  const parts: string[] = [
    `<rect width="${WIDTH}" height="${PAGE_13_HEIGHT}" fill="${COLORS.page}"/>`,
    ...pageHeader(
      'IRIS INSTALLATION UNIT · WEIGHTED SHEATH REFINEMENT',
      'C1 unequal architecture + C3 asymmetric value · centered operator geometry held exactly constant',
      '13 / C1 + C3',
    ),
    panel(MARGIN, 102, WIDTH - MARGIN * 2, 118, COLORS.panelDark),
    text(MARGIN + 18, 132, 'HYBRID RULE', 10, 800, COLORS.green),
    text(
      MARGIN + 18,
      157,
      'One tall certified shell carries the dominant load; one shorter charcoal shoulder supports the opposite side; the console remains centered on the dark machine spine.',
      10.5,
      600,
      '#EEF2EE',
    ),
    text(
      MARGIN + 18,
      189,
      'The three studies change only how much pale structural registration remains on the dark shoulder: none, cap, or perimeter frame.',
      10.2,
      570,
      '#CCD6D0',
    ),
    pill(WIDTH - MARGIN - 324, 132, 298, 'MASS + VALUE ASYMMETRY', '#D8E8DE', COLORS.greenDark),
  ];
  const cardY = 240;
  const cardWidth = (WIDTH - MARGIN * 2 - GAP * 2) / 3;
  HYBRID_REFINEMENT_STUDIES.forEach((study, index) => {
    gamifiedCard(parts, study, MARGIN + index * (cardWidth + GAP), cardY, cardWidth);
  });
  parts.push(
    text(
      MARGIN,
      PAGE_13_HEIGHT - 22,
      'R1/R2/R3 are unregistered material-architecture studies · centered console, live/dormant silhouette, and locked 2×1 mechanical contract held',
      9.5,
      680,
      COLORS.coral,
    ),
    text(
      WIDTH - MARGIN,
      PAGE_13_HEIGHT - 22,
      'stop for refinement approval',
      9.5,
      720,
      COLORS.greenDark,
      'end',
    ),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${PAGE_13_HEIGHT}" viewBox="0 0 ${WIDTH} ${PAGE_13_HEIGHT}">${parts.join('')}</svg>`;
}

function pageFourteen(): string {
  const parts: string[] = [
    `<rect width="${WIDTH}" height="${PAGE_14_HEIGHT}" fill="${COLORS.page}"/>`,
    ...pageHeader(
      'IRIS INSTALLATION UNIT · R1 ARTICULATION LADDER',
      'Approved silhouette locked · depth, certified service access, and live/dormant signaling tested without exterior change',
      '14 / DETAIL PASS',
    ),
    panel(MARGIN, 102, WIDTH - MARGIN * 2, 118, COLORS.panelDark),
    text(MARGIN + 18, 132, 'LOCKED OUTER FORM', 10, 800, COLORS.green),
    text(
      MARGIN + 18,
      157,
      'Tall off-white housing, short charcoal shoulder, dark central spine, centered console, and thin foundation remain pixel-identical in every column.',
      10.5,
      600,
      '#EEF2EE',
    ),
    text(
      MARGIN + 18,
      189,
      'D1 isolates depth; D2 isolates one keyed maintenance seam; D3 combines both and reserves green for one optic plus one subordinate console trace.',
      10.2,
      570,
      '#CCD6D0',
    ),
    pill(WIDTH - MARGIN - 304, 132, 278, 'SILHOUETTE UNCHANGED', '#D8E8DE', COLORS.greenDark),
  ];
  const cardY = 240;
  const cardWidth = (WIDTH - MARGIN * 2 - GAP * 3) / 4;
  R1_DETAIL_STUDIES.forEach((study, index) => {
    gamifiedCard(parts, study, MARGIN + index * (cardWidth + GAP), cardY, cardWidth);
  });
  parts.push(
    text(
      MARGIN,
      PAGE_14_HEIGHT - 22,
      'D0 is the approved R1 control · D1/D2/D3 are unregistered articulation studies · no template, export, schema, Unity, or production change',
      9.5,
      680,
      COLORS.coral,
    ),
    text(
      WIDTH - MARGIN,
      PAGE_14_HEIGHT - 22,
      'stop for detail approval',
      9.5,
      720,
      COLORS.greenDark,
      'end',
    ),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${PAGE_14_HEIGHT}" viewBox="0 0 ${WIDTH} ${PAGE_14_HEIGHT}">${parts.join('')}</svg>`;
}

function pageFifteen(): string {
  const parts: string[] = [
    `<rect width="${WIDTH}" height="${PAGE_15_HEIGHT}" fill="${COLORS.page}"/>`,
    ...pageHeader(
      'IRIS INSTALLATION UNIT · D3 PRODUCTION PROMOTION',
      'Independent approved target compared directly with the registered live/dormant PropTemplates and composed room pixels',
      '15 / PROMOTION',
    ),
    panel(MARGIN, 102, WIDTH - MARGIN * 2, 118, COLORS.panelDark),
    text(MARGIN + 18, 132, 'PROMOTION BOUNDARY', 10, 800, COLORS.green),
    text(
      MARGIN + 18,
      157,
      'Only installation-unit art changed: R1 weighted shell, D3 recessed spine, keyed service joint, centered console, and sparse live-state register.',
      10.5,
      600,
      '#EEF2EE',
    ),
    text(
      MARGIN + 18,
      189,
      'Stable template ids, 2×1 footprint, iris_console anchor, dormant swap, dock, crew, facility catalog, export payload, and schema remain unchanged.',
      10.2,
      570,
      '#CCD6D0',
    ),
    pill(WIDTH - MARGIN - 288, 132, 262, 'PRODUCTION SOURCE', '#D8E8DE', COLORS.greenDark),
  ];
  const comparisonY = 240;
  const halfWidth = (WIDTH - MARGIN * 2 - GAP) / 2;
  promotionComparisonPanel(parts, 'approved-d3', MARGIN, comparisonY, halfWidth);
  promotionComparisonPanel(parts, 'production', MARGIN + halfWidth + GAP, comparisonY, halfWidth);

  const roomY = 710;
  (['approved-d3', 'production'] as const).forEach((source, index) => {
    const x = MARGIN + index * (halfWidth + GAP);
    const approved = source === 'approved-d3';
    parts.push(
      panel(x, roomY, halfWidth, 610, approved ? '#E8E5D8' : '#DDE9E2'),
      text(x + 22, roomY + 34, approved ? 'APPROVED TARGET · ROOM READ' : 'REGISTERED PRODUCTION · ROOM READ', 14, 800, COLORS.greenDark),
      text(x + 22, roomY + 58, 'Same surrounding props, people, dock, walls, and literal gameplay scale', 9.4, 580, COLORS.muted),
      text(x + 22, roomY + 88, 'NORMAL · 70 PX/CELL', 9, 750, COLORS.blue),
      promotionRoomScene(source, x + 22, roomY + 104, 70),
      text(x + 560, roomY + 88, 'FAR · 38 PX/CELL', 9, 750, COLORS.blue),
      promotionRoomScene(source, x + 560, roomY + 104, 38),
      `<rect x="${x + 22}" y="${roomY + 472}" width="${halfWidth - 44}" height="112" rx="9" fill="#FFFFFFAA" stroke="${COLORS.rule}"/>`,
      text(x + 40, roomY + 502, approved ? 'REFERENCE' : 'OBSERVED PRODUCTION RESULT', 9, 760, COLORS.greenDark),
      wrappedText(
        x + 40,
        roomY + 528,
        approved
          ? 'Accepted R1+D3 structure and state hierarchy, kept independent from the production builder for comparison.'
          : 'Registered source preserves the weighted silhouette and centered console; live and dormant differ only through the two sanctioned green cues.',
        108,
        18,
        9.4,
        570,
        COLORS.ink,
      ),
    );
  });
  parts.push(
    text(
      MARGIN,
      PAGE_15_HEIGHT - 22,
      'production promotion proof · source art changed · schema 19 and all mechanical registrations unchanged · no commit performed',
      9.5,
      680,
      COLORS.coral,
    ),
    text(
      WIDTH - MARGIN,
      PAGE_15_HEIGHT - 22,
      'production pixels ready for review',
      9.5,
      720,
      COLORS.greenDark,
      'end',
    ),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${PAGE_15_HEIGHT}" viewBox="0 0 ${WIDTH} ${PAGE_15_HEIGHT}">${parts.join('')}</svg>`;
}

interface AuditRow {
  readonly item: string;
  readonly status: string;
  readonly source: string;
  readonly classification: string;
}

const AUDIT_ROWS: readonly AuditRow[] = [
  {
    item: 'iris-installation-unit',
    status: 'production · live',
    source: 'generated by TypeScript buildIrisUnit()',
    classification: 'IRIS equipment · locked 2×1 elevation / iris_console anchor',
  },
  {
    item: 'iris-installation-unit-dormant',
    status: 'production · swap state',
    source: 'generated by the same TypeScript builder',
    classification: 'IRIS equipment · identical exterior silhouette / no live beacon',
  },
  {
    item: 'iris-charging-dock',
    status: 'production · non-placeable',
    source: 'generated by TypeScript PropTemplate',
    classification: 'IRIS equipment · locked 1×1 plan hardware',
  },
  {
    item: 'construction-worker',
    status: 'production · dynamic crew recipe',
    source: 'code-owned recipe on body-large-frame rig',
    classification: 'IRIS fabrication unit · not a fifth hero / not office staff',
  },
  {
    item: 'head-fab',
    status: 'production · recipe-only',
    source: '3 genuine editable SVGs: south / east / north',
    classification: 'IRIS fabrication-unit source · resolvable, non-selectable',
  },
  {
    item: 'outfit-fab-chassis',
    status: 'production · recipe-only',
    source: 'generated by TypeScript, including rig-aware variant',
    classification: 'IRIS fabrication-unit source · resolvable, non-selectable',
  },
  {
    item: 'service-scanner',
    status: 'production · placeable',
    source: 'generated by TypeScript PropTemplate',
    classification: 'ordinary QuotaCo facility · IRIS-green optic does not make it IRIS family',
  },
  {
    item: 'surveillance-camera / sensor',
    status: 'deferred · not registered',
    source: '2 genuine review-only SVG candidates',
    classification: 'source-only QuotaCo surveillance concepts · not IRIS core equipment',
  },
  {
    item: 'iris-mark / app-iris-console',
    status: 'production UI symbols',
    source: 'code-owned icon geometry',
    classification: 'IRIS chrome, not physical equipment',
  },
] as const;

function tableRow(
  parts: string[],
  x: number,
  y: number,
  widths: readonly number[],
  values: readonly string[],
  fill: string,
  color: string = COLORS.ink,
  weight = 570,
): void {
  let cx = x;
  values.forEach((value, index) => {
    parts.push(
      `<rect x="${cx}" y="${y}" width="${widths[index]}" height="54" fill="${fill}" stroke="${COLORS.rule}" stroke-width=".8"/>`,
      text(cx + 10, y + 21, value, 8.6, weight, color),
    );
    cx += widths[index];
  });
}

function auditTable(parts: string[], x: number, y: number, width: number): number {
  const widths = [500, 420, 740, width - 1660] as const;
  tableRow(
    parts,
    x,
    y,
    widths,
    ['ITEM', 'CURRENT STATUS', 'SOURCE OWNERSHIP', 'BOUNDARY / CLASSIFICATION'],
    COLORS.panelDark,
    '#F3F5F1',
    760,
  );
  AUDIT_ROWS.forEach((row, index) => {
    const rowY = y + 54 * (index + 1);
    tableRow(
      parts,
      x,
      rowY,
      widths,
      [row.item, row.status, row.source, row.classification],
      index % 2 === 0 ? '#FBF8EF' : '#ECE7DB',
    );
  });
  return y + 54 * (AUDIT_ROWS.length + 1);
}

function auditBucket(
  parts: string[],
  x: number,
  y: number,
  width: number,
  titleValue: string,
  color: string,
  items: readonly string[],
): void {
  parts.push(
    panel(x, y, width, 288, '#F9F6ED'),
    `<rect x="${x}" y="${y}" width="8" height="288" rx="4" fill="${color}"/>`,
    text(x + 24, y + 30, titleValue, 11, 800, color),
  );
  items.forEach((item, index) => {
    parts.push(
      `<circle cx="${x + 30}" cy="${y + 67 + index * 54}" r="4" fill="${color}"/>`,
      wrappedText(x + 44, y + 72 + index * 54, item, 88, 16, 9.4, 570, COLORS.ink),
    );
  });
}

function pageThree(): string {
  const parts: string[] = [
    `<rect width="${WIDTH}" height="${PAGE_3_HEIGHT}" fill="${COLORS.page}"/>`,
    ...pageHeader(
      'IRIS EQUIPMENT REDESIGN · SOURCE + MISSING-EQUIPMENT AUDIT',
      'Inventory is descriptive only: no adjacent item is silently adopted into the physical IRIS family',
      '03 / AUDIT',
    ),
    text(MARGIN, 116, 'CURRENT IMPLEMENTATION + SOURCE OWNERSHIP', 15, 800, COLORS.greenDark),
  ];
  const tableBottom = auditTable(parts, MARGIN, 136, WIDTH - MARGIN * 2);

  const lockY = tableBottom + 32;
  parts.push(
    panel(MARGIN, lockY, WIDTH - MARGIN * 2, 270, COLORS.panelCold),
    text(MARGIN + 20, lockY + 31, 'LOCKED THROUGH THIS REVIEW', 12, 800, COLORS.greenDark),
  );
  const lockedLeft = [
    'Stable live / dormant / dock ids and the dormant-to-live swap',
    'Live and dormant exterior silhouettes remain identical',
    '2×1 elevation apparatus; 1×1 plan dock; existing footprints / pivots / collision',
    'Relocation, catalog, iris_console, navigation, and interaction behavior',
  ] as const;
  const lockedRight = [
    'construction-worker recipe, body-large-frame rig, anchors, poses, dynamic crew sizing',
    'head-fab and outfit-fab-chassis remain recipe-only / non-selectable',
    '128-unit authoring canvas, 112-unit wall datum, completed character art',
    'Characters remain ×0.65 in Unity; IRIS props remain literal ×1.0',
  ] as const;
  lockedLeft.forEach((value, index) => {
    parts.push(
      `<circle cx="${MARGIN + 32}" cy="${lockY + 68 + index * 44}" r="4" fill="${COLORS.greenDark}"/>`,
      text(MARGIN + 46, lockY + 73 + index * 44, value, 9.5, 590, COLORS.ink),
    );
  });
  lockedRight.forEach((value, index) => {
    const rx = WIDTH / 2 + 10;
    parts.push(
      `<circle cx="${rx}" cy="${lockY + 68 + index * 44}" r="4" fill="${COLORS.greenDark}"/>`,
      text(rx + 14, lockY + 73 + index * 44, value, 9.5, 590, COLORS.ink),
    );
  });

  const missingY = lockY + 302;
  parts.push(text(MARGIN, missingY, 'MISSING-EQUIPMENT AUDIT · PRACTICAL SYSTEM ROLE ONLY', 15, 800, COLORS.greenDark));
  const bucketY = missingY + 24;
  const bucketWidth = (WIDTH - MARGIN * 2 - GAP * 2) / 3;
  auditBucket(
    parts,
    MARGIN,
    bucketY,
    bucketWidth,
    'REQUIRED BY AN EXISTING SYSTEM',
    COLORS.greenDark,
    [
      'No missing IRIS hardware identified. The installed apparatus + console already ground whole-floor optics, ARCHIVE, tutorial boot, and after-hours report access.',
      'The dock and construction-worker recipe already ground dynamic fabrication crew spawning and idle parking.',
      'Do not split these roles into extra boxes merely to fill a catalog.',
    ],
  );
  auditBucket(
    parts,
    MARGIN + bucketWidth + GAP,
    bucketY,
    bucketWidth,
    'PLAUSIBLE FUTURE SYSTEM EQUIPMENT',
    COLORS.blue,
    [
      'A sealed service-isolation box only if a later tamper / repair / maintenance system needs a physical anchor.',
      'A fabrication diagnostics cart only if crew damage, servicing, or task recovery becomes gameplay.',
      'Camera / sensor SVG candidates remain QuotaCo surveillance concepts unless a separate localized system is explicitly ratified.',
    ],
  );
  auditBucket(
    parts,
    MARGIN + (bucketWidth + GAP) * 2,
    bucketY,
    bucketWidth,
    'PURE ATMOSPHERE · NO CURRENT JUSTIFICATION',
    COLORS.coral,
    [
      'Coverage cones, repeaters, relay pylons, and camera-placement hardware contradict the whole-floor surveillance decision.',
      'Antennas, green glow strips, exposed cable bundles, and busy server-panel noise add menace without a gameplay receiver.',
      'Decorative drones, pods, or laboratory vats would be generic science-fiction dressing, not bureaucratic infrastructure.',
    ],
  );

  const boundaryY = bucketY + 322;
  parts.push(
    panel(MARGIN, boundaryY, WIDTH - MARGIN * 2, 220, COLORS.panelDark),
    text(MARGIN + 22, boundaryY + 36, 'APPROVAL BOUNDARY', 13, 820, COLORS.green),
    text(
      MARGIN + 22,
      boundaryY + 72,
      'Stop here for visual approval. Choose one direction, combine named traits, or reject all three.',
      11,
      650,
      '#F2F4EF',
    ),
    text(
      MARGIN + 22,
      boundaryY + 110,
      'Not done: production SVG creation · template/default changes · canonical atlas updates · export/bundle/schema changes · Unity work · commit.',
      10.2,
      600,
      '#D8DDD8',
    ),
    text(
      MARGIN + 22,
      boundaryY + 154,
      'After acceptance: maximize genuine editable SVG ownership; treat rig-aware fabrication geometry as a separate source-strategy decision.',
      10.2,
      600,
      '#D8DDD8',
    ),
    pill(WIDTH - MARGIN - 238, boundaryY + 154, 216, 'AWAITING REVIEW', '#F2DDD7', COLORS.coral),
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${PAGE_3_HEIGHT}" viewBox="0 0 ${WIDTH} ${PAGE_3_HEIGHT}">${parts.join('')}</svg>`;
}

function outputDirectory(args: string[]): string {
  let out = 'docs/previews/iris-equipment-redesign-calibration-v1';
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg !== '--out') throw new Error(`Unknown argument ${arg}`);
    const value = args[++index];
    if (!value) throw new Error('--out requires a directory');
    out = value;
  }
  return resolve(process.cwd(), out);
}

function writePage(directory: string, basename: string, source: string): void {
  const svgPath = join(directory, `${basename}.svg`);
  const pngPath = join(directory, `${basename}.png`);
  writeFileSync(svgPath, source);
  writeFileSync(pngPath, new Resvg(source, {
    font: { loadSystemFonts: true },
  }).render().asPng());
  process.stdout.write(`Wrote ${svgPath}\nWrote ${pngPath}\n`);
}

const directory = outputDirectory(process.argv.slice(2));
mkdirSync(directory, { recursive: true });

writePage(directory, '01-direction-comparison', pageOne());
writePage(directory, '02-context-and-scale', pageTwo());
writePage(directory, '03-source-and-equipment-audit', pageThree());
writePage(directory, '04-certified-pier-refinement', pageFour());
writePage(directory, '05-equipment-core-rack-study', pageFive());
writePage(directory, '06-equipment-core-rack-convergence', pageSix());
writePage(directory, '07-installation-unit-form-reset', pageSeven());
writePage(directory, '08-installation-unit-spatial-reset', pageEight());
writePage(directory, '11-installation-unit-gamified-alias-test', pageEleven());
writePage(directory, '12-installation-unit-centered-console-retention', pageTwelve());
writePage(directory, '13-installation-unit-weighted-sheath-refinement', pageThirteen());
writePage(directory, '14-installation-unit-r1-articulation-ladder', pageFourteen());
writePage(directory, '15-installation-unit-d3-production-promotion', pageFifteen());

const htmlPath = join(directory, 'index.html');
writeFileSync(
  htmlPath,
  '<!doctype html><meta charset="utf-8"><title>IRIS equipment redesign calibration</title>' +
  '<style>html{background:#1f2422}body{margin:0 auto;max-width:1800px;padding:20px}' +
  'img{display:block;width:100%;height:auto;margin:0 0 20px;box-shadow:0 8px 30px #0008}</style>' +
  '<img src="01-direction-comparison.svg" alt="IRIS redesign direction comparison">' +
  '<img src="02-context-and-scale.svg" alt="IRIS redesign context and scale studies">' +
  '<img src="03-source-and-equipment-audit.svg" alt="IRIS source ownership and missing equipment audit">' +
  '<img src="04-certified-pier-refinement.svg" alt="Certified Support Pier refinement comparison">' +
  '<img src="05-equipment-core-rack-study.svg" alt="IRIS equipment-core rack architecture study">' +
  '<img src="06-equipment-core-rack-convergence.svg" alt="IRIS equipment-core rack convergence study">' +
  '<img src="07-installation-unit-form-reset.svg" alt="IRIS installation-unit fundamental form reset">' +
  '<img src="08-installation-unit-spatial-reset.svg" alt="IRIS installation-unit spatial layout reset">' +
  '<img src="11-installation-unit-gamified-alias-test.svg" alt="IRIS installation-unit gamified alias test">' +
  '<img src="12-installation-unit-centered-console-retention.svg" alt="IRIS installation-unit centered-console retention study">' +
  '<img src="13-installation-unit-weighted-sheath-refinement.svg" alt="IRIS installation-unit weighted-sheath refinement">' +
  '<img src="14-installation-unit-r1-articulation-ladder.svg" alt="IRIS installation-unit R1 articulation ladder">' +
  '<img src="15-installation-unit-d3-production-promotion.svg" alt="IRIS installation-unit D3 production promotion">',
);
process.stdout.write(`Wrote ${htmlPath}\n`);
