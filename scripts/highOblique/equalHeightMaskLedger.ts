import {
  BLOB_CONFIGS,
  BLOB_TILE_COUNT,
  blobContract,
  configForIndex,
  type WallTileConfig,
} from '../../src/tiles/blob';
import {
  PROMOTED_EAST_WALL_REUSE,
  PROMOTED_NORTHEAST_CORNER,
  PROMOTED_SOUTHEAST_CORNER,
  PROMOTED_SOUTHWEST_CORNER,
  PROMOTED_SOUTH_WALL_REUSE,
  type EqualHeightWallTransform,
} from './equalHeightWallDirection';

/**
 * Owner-accepted proof-layer mapping ledger for the equal-height wall direction.
 *
 * The canonical 47-blob table remains the connectivity authority. This file
 * records what that connectivity can safely reuse from the accepted visual
 * proof and, just as importantly, where connectivity alone is insufficient.
 * Acceptance locks the table, classifications, and provenance boundaries. It
 * does not accept the synthetic candidate pixels, register frames, alter the
 * exporter, or create production art.
 */

export const EQUAL_HEIGHT_MASK_RESOLUTION_KINDS = [
  'direct-reuse',
  'approved-derivation',
  'synthetic-assembly',
  'unresolved-authored-geometry',
] as const;

export type EqualHeightMaskResolutionKind =
  (typeof EQUAL_HEIGHT_MASK_RESOLUTION_KINDS)[number];

export type EqualHeightMaskTopologyClass =
  | 'isolated'
  | 'terminus'
  | 'straight'
  | 'perimeter-corner'
  | 'filled-elbow'
  | 't-junction'
  | 'cross-junction';

export type EqualHeightMaskEdge = 'n' | 'e' | 's' | 'w';
export type EqualHeightMaskCorner = 'ne' | 'se' | 'sw' | 'nw';
export type EqualHeightMaskDerivation = 'none' | 'accepted-southeast-seam-filter';

export interface EqualHeightMaskSourceVariant {
  readonly role: string;
  readonly sourceStem: string;
  readonly baseFile: string;
  readonly upperFile: string;
  readonly transform: EqualHeightWallTransform;
  readonly derivation: EqualHeightMaskDerivation;
  readonly facingRule: string;
}

export interface EqualHeightMaskDirectResolution {
  readonly kind: 'direct-reuse';
  readonly status: 'accepted-source-mapping';
  readonly variants: readonly EqualHeightMaskSourceVariant[];
  readonly note: string;
}

export interface EqualHeightMaskDerivedResolution {
  readonly kind: 'approved-derivation';
  readonly status: 'accepted-source-mapping';
  readonly variants: readonly EqualHeightMaskSourceVariant[];
  readonly note: string;
}

export interface EqualHeightMaskSyntheticResolution {
  readonly kind: 'synthetic-assembly';
  readonly status: 'proof-only-candidate';
  readonly ingredients: readonly EqualHeightMaskSourceVariant[];
  readonly requirement: string;
}

export interface EqualHeightMaskUnresolvedResolution {
  readonly kind: 'unresolved-authored-geometry';
  readonly status: 'unresolved';
  readonly reason: string;
}

export type EqualHeightMaskResolution =
  | EqualHeightMaskDirectResolution
  | EqualHeightMaskDerivedResolution
  | EqualHeightMaskSyntheticResolution
  | EqualHeightMaskUnresolvedResolution;

export interface EqualHeightMaskLedgerEntry {
  readonly id: `mask_${number}`;
  readonly index: number;
  readonly canonicalMask: number;
  readonly connectivity: WallTileConfig;
  readonly connectedEdges: readonly EqualHeightMaskEdge[];
  readonly exposedEdges: readonly EqualHeightMaskEdge[];
  readonly pockets: readonly EqualHeightMaskCorner[];
  readonly solidDiagonals: readonly EqualHeightMaskCorner[];
  readonly topologyClass: EqualHeightMaskTopologyClass;
  readonly resolution: EqualHeightMaskResolution;
  readonly openings: 'separate-state-layer';
  readonly paletteMasks: 'not-covered';
}

export interface EqualHeightMaskLedger {
  readonly stem: 'equal-height-47-mask-ledger';
  readonly version: 0;
  readonly blobContractVersion: number;
  readonly status: 'owner-accepted-mapping-gate';
  readonly reviewCellSizes: readonly [90, 40];
  readonly productionRegistration: false;
  readonly productionTopologyMutation: false;
  readonly schemaChange: false;
  readonly exportable: false;
  readonly committedAtlas: false;
  readonly temporaryFrameIds: true;
  readonly entries: readonly EqualHeightMaskLedgerEntry[];
  readonly counts: Readonly<Record<EqualHeightMaskResolutionKind, number>>;
}

const EDGES = ['n', 'e', 's', 'w'] as const;
const CORNERS = ['ne', 'se', 'sw', 'nw'] as const;

const isolatedShell: EqualHeightMaskSourceVariant = {
  role: 'isolated-shell',
  sourceStem: 'isolated_shell',
  baseFile: 'isolated_shell-base.svg',
  upperFile: 'isolated_shell-upper.svg',
  transform: 'none',
  derivation: 'none',
  facingRule: 'zero cardinal sockets; one fixed front-on authored structural shell',
};

const horizontalShared: EqualHeightMaskSourceVariant = {
  role: 'north-or-south-wall',
  sourceStem: PROMOTED_SOUTH_WALL_REUSE.sourceStem,
  baseFile: PROMOTED_SOUTH_WALL_REUSE.baseFile,
  upperFile: PROMOTED_SOUTH_WALL_REUSE.upperFile,
  transform: PROMOTED_SOUTH_WALL_REUSE.transform,
  derivation: 'none',
  facingRule: 'north and south share the exact composed source',
};

const westWall: EqualHeightMaskSourceVariant = {
  role: 'west-wall',
  sourceStem: 'full_w_straight',
  baseFile: 'full_w_straight-base.svg',
  upperFile: 'full_w_straight-upper.svg',
  transform: 'none',
  derivation: 'none',
  facingRule: 'explicit west exterior facing',
};

const eastWall: EqualHeightMaskSourceVariant = {
  role: 'east-wall',
  sourceStem: PROMOTED_EAST_WALL_REUSE.sourceStem,
  baseFile: PROMOTED_EAST_WALL_REUSE.baseFile,
  upperFile: PROMOTED_EAST_WALL_REUSE.upperFile,
  transform: PROMOTED_EAST_WALL_REUSE.transform,
  derivation: 'none',
  facingRule: 'explicit east exterior facing; connectivity does not select this mirror',
};

const westSouthTerminus: EqualHeightMaskSourceVariant = {
  role: 'west-south-terminus',
  sourceStem: 'vertical_s_terminus',
  baseFile: 'vertical_s_terminus-base.svg',
  upperFile: 'vertical_s_terminus-upper.svg',
  transform: 'none',
  derivation: 'none',
  facingRule: 'connected north; exposed south rollover on the west wall',
};

const eastSouthTerminus: EqualHeightMaskSourceVariant = {
  role: 'east-south-terminus',
  sourceStem: 'vertical_s_terminus',
  baseFile: 'vertical_s_terminus-base.svg',
  upperFile: 'vertical_s_terminus-upper.svg',
  transform: 'mirror-x',
  derivation: 'none',
  facingRule: 'connected north; exposed south rollover on the east wall through the accepted whole-cell X mirror',
};

const westNorthTerminus: EqualHeightMaskSourceVariant = {
  role: 'west-north-terminus',
  sourceStem: 'vertical_n_terminus',
  baseFile: 'vertical_n_terminus-base.svg',
  upperFile: 'vertical_n_terminus-upper.svg',
  transform: 'none',
  derivation: 'none',
  facingRule: 'connected south; exposed north rollover on the west wall',
};

const eastNorthTerminus: EqualHeightMaskSourceVariant = {
  role: 'east-north-terminus',
  sourceStem: 'vertical_n_terminus',
  baseFile: 'vertical_n_terminus-base.svg',
  upperFile: 'vertical_n_terminus-upper.svg',
  transform: 'mirror-x',
  derivation: 'none',
  facingRule: 'connected south; exposed north rollover on the east wall through the accepted whole-cell X mirror',
};

const eastCapTerminus: EqualHeightMaskSourceVariant = {
  role: 'east-cap-terminus',
  sourceStem: 'full_terminus',
  baseFile: 'full_terminus-base.svg',
  upperFile: 'full_terminus-upper.svg',
  transform: 'none',
  derivation: 'none',
  facingRule: 'connected west; exposed molded cap faces east',
};

const westCapTerminus: EqualHeightMaskSourceVariant = {
  role: 'west-cap-terminus',
  sourceStem: 'full_terminus',
  baseFile: 'full_terminus-base.svg',
  upperFile: 'full_terminus-upper.svg',
  transform: 'mirror-x',
  derivation: 'none',
  facingRule: 'connected east; exposed molded cap faces west through the accepted whole-cell X mirror',
};

const northwestCorner: EqualHeightMaskSourceVariant = {
  role: 'northwest-corner',
  sourceStem: 'full_exterior_corner',
  baseFile: 'full_exterior_corner-base.svg',
  upperFile: 'full_exterior_corner-upper.svg',
  transform: 'none',
  derivation: 'none',
  facingRule: 'connected east and south with an open southeast pocket',
};

const northeastCorner: EqualHeightMaskSourceVariant = {
  role: 'northeast-corner',
  sourceStem: PROMOTED_NORTHEAST_CORNER.sourceStem,
  baseFile: PROMOTED_NORTHEAST_CORNER.baseFile,
  upperFile: PROMOTED_NORTHEAST_CORNER.upperFile,
  transform: PROMOTED_NORTHEAST_CORNER.transform,
  derivation: 'none',
  facingRule: 'connected south and west with an open southwest pocket',
};

const southwestCorner: EqualHeightMaskSourceVariant = {
  role: 'southwest-corner',
  sourceStem: PROMOTED_SOUTHWEST_CORNER.sourceStem,
  baseFile: PROMOTED_SOUTHWEST_CORNER.baseFile,
  upperFile: PROMOTED_SOUTHWEST_CORNER.upperFile,
  transform: PROMOTED_SOUTHWEST_CORNER.transform,
  derivation: 'none',
  facingRule: 'connected north and east with an open northeast pocket',
};

const southeastCorner: EqualHeightMaskSourceVariant = {
  role: 'southeast-corner',
  sourceStem: PROMOTED_SOUTHEAST_CORNER.sourceStem,
  baseFile: PROMOTED_SOUTHEAST_CORNER.baseFile,
  upperFile: PROMOTED_SOUTHEAST_CORNER.upperFile,
  transform: PROMOTED_SOUTHEAST_CORNER.transform,
  derivation: 'accepted-southeast-seam-filter',
  facingRule: 'connected north and west with an open northwest pocket',
};

const filledSouthwestElbow: EqualHeightMaskSourceVariant = {
  role: 'filled-southwest-elbow',
  sourceStem: 'filled_sw_elbow',
  baseFile: 'filled_sw_elbow-base.svg',
  upperFile: 'filled_sw_elbow-upper.svg',
  transform: 'none',
  derivation: 'none',
  facingRule: 'connected north and east with a solid northeast diagonal; authored foreground-west fixed-light source',
};

const filledNorthwestElbow: EqualHeightMaskSourceVariant = {
  role: 'filled-northwest-elbow',
  sourceStem: 'filled_nw_elbow',
  baseFile: 'filled_nw_elbow-base.svg',
  upperFile: 'filled_nw_elbow-upper.svg',
  transform: 'none',
  derivation: 'none',
  facingRule: 'connected east and south with a solid southeast diagonal; authored rear-west fixed-light source',
};

const filledNortheastElbow: EqualHeightMaskSourceVariant = {
  role: 'filled-northeast-elbow',
  sourceStem: 'filled_nw_elbow',
  baseFile: 'filled_nw_elbow-base.svg',
  upperFile: 'filled_nw_elbow-upper.svg',
  transform: 'mirror-x',
  derivation: 'none',
  facingRule: 'connected south and west with a solid southwest diagonal through the accepted whole-cell X mirror',
};

const filledSoutheastElbow: EqualHeightMaskSourceVariant = {
  role: 'filled-southeast-elbow',
  sourceStem: 'filled_sw_elbow',
  baseFile: 'filled_sw_elbow-base.svg',
  upperFile: 'filled_sw_elbow-upper.svg',
  transform: 'mirror-x',
  derivation: 'accepted-southeast-seam-filter',
  facingRule: 'connected north and west with a solid northwest diagonal through mirror-X plus the accepted southeast seam filter',
};

const filledWestMiddle: EqualHeightMaskSourceVariant = {
  role: 'filled-west-middle-spine',
  sourceStem: 'filled_w_middle',
  baseFile: 'filled_w_middle-base.svg',
  upperFile: 'filled_w_middle-upper.svg',
  transform: 'none',
  derivation: 'none',
  facingRule: 'connected north, east, and south with the west edge exposed; authored open-Y west spine for a solid two-column wall mass',
};

const filledEastMiddle: EqualHeightMaskSourceVariant = {
  role: 'filled-east-middle-spine',
  sourceStem: 'filled_w_middle',
  baseFile: 'filled_w_middle-base.svg',
  upperFile: 'filled_w_middle-upper.svg',
  transform: 'mirror-x',
  derivation: 'none',
  facingRule: 'connected north, south, and west with the east edge exposed through the accepted whole-cell X mirror',
};

const filledNorthMiddle: EqualHeightMaskSourceVariant = {
  role: 'filled-north-middle-spine',
  sourceStem: 'filled_n_middle',
  baseFile: 'filled_n_middle-base.svg',
  upperFile: 'filled_n_middle-upper.svg',
  transform: 'none',
  derivation: 'none',
  facingRule: 'connected east, south, and west with the north edge exposed; authored open-X rear spine for a solid two-row wall mass',
};

const filledSouthMiddle: EqualHeightMaskSourceVariant = {
  role: 'filled-south-middle-spine',
  sourceStem: 'filled_s_middle',
  baseFile: 'filled_s_middle-base.svg',
  upperFile: 'filled_s_middle-upper.svg',
  transform: 'none',
  derivation: 'none',
  facingRule: 'connected north, east, and west with the south edge exposed; authored open-X foreground spine with the accepted south-facing material stack',
};

const openWestTJunction: EqualHeightMaskSourceVariant = {
  role: 'open-west-t-junction',
  sourceStem: 'open_w_t_junction',
  baseFile: 'open_w_t_junction-base.svg',
  upperFile: 'open_w_t_junction-upper.svg',
  transform: 'none',
  derivation: 'none',
  facingRule: 'connected north, east, and south with the west edge exposed; authored fixed-light open-pocket T hub',
};

const openEastTJunction: EqualHeightMaskSourceVariant = {
  role: 'open-east-t-junction',
  sourceStem: 'open_w_t_junction',
  baseFile: 'open_w_t_junction-base.svg',
  upperFile: 'open_w_t_junction-upper.svg',
  transform: 'mirror-x',
  derivation: 'accepted-southeast-seam-filter',
  facingRule: 'connected north, south, and west with the east edge exposed through mirror-X after the accepted boundary-seam filter',
};

function topologyFor(config: WallTileConfig): EqualHeightMaskTopologyClass {
  const connected = EDGES.filter((edge) => config[edge]);
  if (connected.length === 0) return 'isolated';
  if (connected.length === 1) return 'terminus';
  if (connected.length === 3) return 't-junction';
  if (connected.length === 4) return 'cross-junction';
  const opposite = (config.n && config.s) || (config.e && config.w);
  if (opposite) return 'straight';
  return CORNERS.some((corner) => config[corner] === 'solid')
    ? 'filled-elbow'
    : 'perimeter-corner';
}

function unresolvedReason(topologyClass: EqualHeightMaskTopologyClass): string {
  return `No accepted authored source mapping exists for this ${topologyClass} row.`;
}

function uniqueVariants(
  variants: readonly EqualHeightMaskSourceVariant[],
): readonly EqualHeightMaskSourceVariant[] {
  const byRole = new Map(variants.map((variant) => [variant.role, variant]));
  return [...byRole.values()];
}

function syntheticIngredientsFor(
  index: number,
  topologyClass: EqualHeightMaskTopologyClass,
  exposedEdges: readonly EqualHeightMaskEdge[],
  pockets: readonly EqualHeightMaskCorner[],
): readonly EqualHeightMaskSourceVariant[] {
  if (topologyClass === 'filled-elbow') {
    throw new Error(`Accepted filled-elbow mask_${index} fell through to synthetic assembly`);
  }

  const variants: EqualHeightMaskSourceVariant[] = [];
  for (const edge of exposedEdges) {
    if (edge === 'n' || edge === 's') variants.push(horizontalShared);
    else if (edge === 'e') variants.push(westWall);
    else variants.push(eastWall);
  }
  const pocketSources: Readonly<Record<EqualHeightMaskCorner, EqualHeightMaskSourceVariant>> = {
    ne: southwestCorner,
    se: northwestCorner,
    sw: northeastCorner,
    nw: southeastCorner,
  };
  variants.push(...pockets.map((corner) => pocketSources[corner]));
  if (variants.length === 0) variants.push(horizontalShared, westWall, eastWall);
  return uniqueVariants(variants);
}

function resolvedEntry(index: number): EqualHeightMaskResolution | undefined {
  switch (index) {
    case 0:
      return {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [isolatedShell],
        note: 'Accepted zero-link catalog cell directly reuses the authored isolated structural shell with no transform or derivation.',
      };
    case 1:
      return {
        kind: 'approved-derivation',
        status: 'accepted-source-mapping',
        variants: [westSouthTerminus, eastSouthTerminus],
        note: 'Accepted south-facing vertical terminus uses one west-authored source plus its approved whole-cell X mirror for east-facing context.',
      };
    case 2:
      return {
        kind: 'approved-derivation',
        status: 'accepted-source-mapping',
        variants: [westCapTerminus],
        note: 'Accepted west-facing cap is the whole-cell mirror-X derivation of the horizontal terminus source.',
      };
    case 4:
      return {
        kind: 'approved-derivation',
        status: 'accepted-source-mapping',
        variants: [westNorthTerminus, eastNorthTerminus],
        note: 'Accepted north-facing vertical terminus uses one west-authored source plus its approved whole-cell X mirror for east-facing context.',
      };
    case 3:
      return {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [southwestCorner],
        note: 'Accepted southwest molded turn matches the N+E perimeter socket exactly.',
      };
    case 5:
      return {
        kind: 'approved-derivation',
        status: 'accepted-source-mapping',
        variants: [westWall, eastWall],
        note: 'N+S connectivity is shared by west and east walls; an explicit facing input selects direct west or approved mirror-X east.',
      };
    case 6:
      return {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [northwestCorner],
        note: 'Accepted northwest turn matches the E+S perimeter socket exactly.',
      };
    case 7:
      return {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [openWestTJunction],
        note: 'Accepted west-facing open-pocket T junction directly reuses the authored fixed-light three-socket source.',
      };
    case 8:
      return {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [eastCapTerminus],
        note: 'Accepted horizontal terminus source matches the W-connected socket and exposes its molded cap to the east.',
      };
    case 9:
      return {
        kind: 'approved-derivation',
        status: 'accepted-source-mapping',
        variants: [southeastCorner],
        note: 'Accepted southeast reuses the southwest source through mirror-X plus the approved service-seam filter.',
      };
    case 10:
      return {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [horizontalShared],
        note: 'E+W connectivity uses one exact composed source for both north and south room edges.',
      };
    case 12:
      return {
        kind: 'approved-derivation',
        status: 'accepted-source-mapping',
        variants: [northeastCorner],
        note: 'Accepted northeast is the approved whole-cell mirror-X derivation of the northwest source.',
      };
    case 13:
      return {
        kind: 'approved-derivation',
        status: 'accepted-source-mapping',
        variants: [openEastTJunction],
        note: 'Accepted east-facing open-pocket T junction mirrors the west-authored source after the accepted boundary-seam filter.',
      };
    case 16:
      return {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [filledSouthwestElbow],
        note: 'Accepted foreground-west filled elbow directly reuses the authored solid-top source with its south-facing material shade.',
      };
    case 20:
      return {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [filledNorthwestElbow],
        note: 'Accepted rear-west filled elbow directly reuses the authored solid-top source.',
      };
    case 24:
      return {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [filledWestMiddle],
        note: 'Accepted west middle spine directly extends the filled-wall cream top through both Y sockets without an internal belt or seam.',
      };
    case 26:
      return {
        kind: 'approved-derivation',
        status: 'accepted-source-mapping',
        variants: [filledNortheastElbow],
        note: 'Accepted rear-east filled elbow is the whole-cell mirror-X derivation of the rear-west solid-top source.',
      };
    case 31:
      return {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [filledNorthMiddle],
        note: 'Accepted rear middle spine directly extends the two-row solid wall cream top through both X sockets without an internal face rail.',
      };
    case 34:
      return {
        kind: 'approved-derivation',
        status: 'accepted-source-mapping',
        variants: [filledSoutheastElbow],
        note: 'Accepted foreground-east filled elbow mirrors the foreground-west source after the accepted southeast seam filter.',
      };
    case 38:
      return {
        kind: 'direct-reuse',
        status: 'accepted-source-mapping',
        variants: [filledSouthMiddle],
        note: 'Accepted foreground middle spine directly continues the south-facing material stack through both X sockets with one source-owned service boundary.',
      };
    case 42:
      return {
        kind: 'approved-derivation',
        status: 'accepted-source-mapping',
        variants: [filledEastMiddle],
        note: 'Accepted east middle spine is the whole-cell mirror-X derivation of the west-authored open-Y filled-wall source.',
      };
    default:
      return undefined;
  }
}

function buildEntry(index: number): EqualHeightMaskLedgerEntry {
  const connectivity = configForIndex(index);
  const connectedEdges = EDGES.filter((edge) => connectivity[edge]);
  const exposedEdges = EDGES.filter((edge) => !connectivity[edge]);
  const pockets = CORNERS.filter((corner) => connectivity[corner] === 'concave');
  const solidDiagonals = CORNERS.filter((corner) => connectivity[corner] === 'solid');
  const topologyClass = topologyFor(connectivity);
  const acceptedResolution = resolvedEntry(index);
  const resolution: EqualHeightMaskResolution = acceptedResolution ?? (
    topologyClass === 'filled-elbow' ||
    topologyClass === 't-junction' ||
    topologyClass === 'cross-junction'
      ? {
        kind: 'synthetic-assembly',
        status: 'proof-only-candidate',
        ingredients: syntheticIngredientsFor(index, topologyClass, exposedEdges, pockets),
        requirement: topologyClass === 'filled-elbow'
          ? `Preserve the accepted outer-facing corner provenance, then replace its open pocket with a synthetic solid-${solidDiagonals.join('-')} closure.`
          : topologyClass === 't-junction'
            ? 'Merge the named accepted edge and pocket laws, then author the local T hub and one-sided cap ownership.'
            : 'Merge the named accepted pocket laws and cardinal sockets, then author the local four-way hub.',
      }
      : {
        kind: 'unresolved-authored-geometry',
        status: 'unresolved',
        reason: unresolvedReason(topologyClass),
      }
  );

  return {
    id: `mask_${index}`,
    index,
    canonicalMask: BLOB_CONFIGS[index],
    connectivity,
    connectedEdges,
    exposedEdges,
    pockets,
    solidDiagonals,
    topologyClass,
    resolution,
    openings: 'separate-state-layer',
    paletteMasks: 'not-covered',
  };
}

const entries = Array.from({ length: BLOB_TILE_COUNT }, (_, index) => buildEntry(index));

const counts = Object.fromEntries(
  EQUAL_HEIGHT_MASK_RESOLUTION_KINDS.map((kind) => [
    kind,
    entries.filter((entry) => entry.resolution.kind === kind).length,
  ]),
) as Record<EqualHeightMaskResolutionKind, number>;

export const EQUAL_HEIGHT_MASK_LEDGER: EqualHeightMaskLedger = {
  stem: 'equal-height-47-mask-ledger',
  version: 0,
  blobContractVersion: blobContract().version,
  status: 'owner-accepted-mapping-gate',
  reviewCellSizes: [90, 40],
  productionRegistration: false,
  productionTopologyMutation: false,
  schemaChange: false,
  exportable: false,
  committedAtlas: false,
  temporaryFrameIds: true,
  entries,
  counts,
};

const sourceVariantSignature = (variant: EqualHeightMaskSourceVariant): string => JSON.stringify([
  variant.role,
  variant.sourceStem,
  variant.baseFile,
  variant.upperFile,
  variant.transform,
  variant.derivation,
  variant.facingRule,
]);

const ACCEPTED_SOURCE_VARIANTS = new Set([
  isolatedShell,
  horizontalShared,
  westWall,
  eastWall,
  westSouthTerminus,
  eastSouthTerminus,
  westNorthTerminus,
  eastNorthTerminus,
  eastCapTerminus,
  westCapTerminus,
  northwestCorner,
  northeastCorner,
  southwestCorner,
  southeastCorner,
  filledSouthwestElbow,
  filledNorthwestElbow,
  filledNortheastElbow,
  filledSoutheastElbow,
  filledWestMiddle,
  filledEastMiddle,
  filledNorthMiddle,
  filledSouthMiddle,
  openWestTJunction,
  openEastTJunction,
].map(sourceVariantSignature));

function variantsFor(
  resolution: EqualHeightMaskResolution,
): readonly EqualHeightMaskSourceVariant[] {
  if (resolution.kind === 'unresolved-authored-geometry') return [];
  return resolution.kind === 'synthetic-assembly'
    ? resolution.ingredients
    : resolution.variants;
}

/** Fail loudly when the proof ledger drifts away from the canonical 47 table. */
export function validateEqualHeightMaskLedger(ledger: EqualHeightMaskLedger): void {
  if (ledger.status !== 'owner-accepted-mapping-gate') {
    throw new Error(`Equal-height mask ledger has invalid promotion status ${ledger.status}`);
  }
  if (ledger.entries.length !== BLOB_TILE_COUNT) {
    throw new Error(`Equal-height mask ledger has ${ledger.entries.length} entries; expected ${BLOB_TILE_COUNT}`);
  }
  const ids = new Set<string>();
  for (let index = 0; index < BLOB_TILE_COUNT; index += 1) {
    const entry = ledger.entries[index];
    const expectedId = `mask_${index}`;
    if (!entry) throw new Error(`Equal-height mask ledger missing ${expectedId}`);
    if (ids.has(entry.id)) throw new Error(`Equal-height mask ledger duplicates ${entry.id}`);
    ids.add(entry.id);
    if (entry.id !== expectedId || entry.index !== index) {
      throw new Error(`Equal-height mask ledger order drift at ${expectedId}; received ${entry.id}/${entry.index}`);
    }
    if (entry.canonicalMask !== BLOB_CONFIGS[index]) {
      throw new Error(`Equal-height mask ledger canonical mask drift at ${entry.id}`);
    }
    if (JSON.stringify(entry.connectivity) !== JSON.stringify(configForIndex(index))) {
      throw new Error(`Equal-height mask ledger connectivity drift at ${entry.id}`);
    }
    const expectedConnected = EDGES.filter((edge) => entry.connectivity[edge]);
    const expectedExposed = EDGES.filter((edge) => !entry.connectivity[edge]);
    const expectedPockets = CORNERS.filter((corner) => entry.connectivity[corner] === 'concave');
    const expectedSolid = CORNERS.filter((corner) => entry.connectivity[corner] === 'solid');
    if (
      JSON.stringify(entry.connectedEdges) !== JSON.stringify(expectedConnected) ||
      JSON.stringify(entry.exposedEdges) !== JSON.stringify(expectedExposed) ||
      JSON.stringify(entry.pockets) !== JSON.stringify(expectedPockets) ||
      JSON.stringify(entry.solidDiagonals) !== JSON.stringify(expectedSolid) ||
      entry.topologyClass !== topologyFor(entry.connectivity)
    ) {
      throw new Error(`Equal-height mask ledger topology classification drift at ${entry.id}`);
    }
    if (!EQUAL_HEIGHT_MASK_RESOLUTION_KINDS.includes(entry.resolution.kind)) {
      throw new Error(`Equal-height mask ledger has invalid resolution at ${entry.id}`);
    }
    const variants = variantsFor(entry.resolution);
    for (const variant of variants) {
      if (!ACCEPTED_SOURCE_VARIANTS.has(sourceVariantSignature(variant))) {
        throw new Error(
          `Equal-height mask ledger uses forbidden source variant ${variant.role}/${variant.sourceStem} at ${entry.id}`,
        );
      }
      if (variant.transform !== 'none' && variant.transform !== 'mirror-x') {
        throw new Error(`Equal-height mask ledger uses invalid transform at ${entry.id}`);
      }
      if (
        variant.derivation !== 'none' &&
        variant.derivation !== 'accepted-southeast-seam-filter'
      ) {
        throw new Error(`Equal-height mask ledger uses invalid derivation at ${entry.id}`);
      }
    }
    if (entry.resolution.kind === 'direct-reuse') {
      if (entry.resolution.status !== 'accepted-source-mapping') {
        throw new Error(`Equal-height mask ledger direct reuse has invalid status at ${entry.id}`);
      }
      if ('ingredients' in entry.resolution) {
        throw new Error(`Equal-height mask ledger has multiple resolution strategies at ${entry.id}`);
      }
      if (variants.length === 0) throw new Error(`Equal-height mask ledger lacks direct provenance at ${entry.id}`);
      if (variants.some((variant) => variant.transform !== 'none' || variant.derivation !== 'none')) {
        throw new Error(`Equal-height mask ledger direct reuse is transformed at ${entry.id}`);
      }
    } else if (entry.resolution.kind === 'approved-derivation') {
      if (entry.resolution.status !== 'accepted-source-mapping') {
        throw new Error(`Equal-height mask ledger derivation has invalid status at ${entry.id}`);
      }
      if ('ingredients' in entry.resolution) {
        throw new Error(`Equal-height mask ledger has multiple resolution strategies at ${entry.id}`);
      }
      if (variants.length === 0) throw new Error(`Equal-height mask ledger lacks derived provenance at ${entry.id}`);
      if (!variants.some((variant) => variant.transform === 'mirror-x' || variant.derivation !== 'none')) {
        throw new Error(`Equal-height mask ledger derivation has no approved operation at ${entry.id}`);
      }
    } else if (entry.resolution.kind === 'synthetic-assembly') {
      if (entry.resolution.status !== 'proof-only-candidate') {
        throw new Error(`Equal-height mask ledger synthetic assembly has invalid status at ${entry.id}`);
      }
      if ('variants' in entry.resolution) {
        throw new Error(`Equal-height mask ledger has multiple resolution strategies at ${entry.id}`);
      }
      if (variants.length === 0 || !entry.resolution.requirement.trim()) {
        throw new Error(`Equal-height mask ledger lacks synthetic obligation at ${entry.id}`);
      }
    } else {
      if (entry.resolution.status !== 'unresolved') {
        throw new Error(`Equal-height mask ledger unresolved geometry has invalid status at ${entry.id}`);
      }
      if ('variants' in entry.resolution || 'ingredients' in entry.resolution) {
        throw new Error(`Equal-height mask ledger has multiple resolution strategies at ${entry.id}`);
      }
      if (!entry.resolution.reason.trim()) {
        throw new Error(`Equal-height mask ledger lacks unresolved reason at ${entry.id}`);
      }
    }
    if (entry.openings !== 'separate-state-layer' || entry.paletteMasks !== 'not-covered') {
      throw new Error(`Equal-height mask ledger overclaims state scope at ${entry.id}`);
    }
  }
  if (ledger.blobContractVersion !== blobContract().version) {
    throw new Error('Equal-height mask ledger blob contract version drift');
  }
  if (
    ledger.productionRegistration || ledger.productionTopologyMutation || ledger.schemaChange ||
    ledger.exportable || ledger.committedAtlas || !ledger.temporaryFrameIds
  ) {
    throw new Error('Equal-height mask ledger crossed the proof-only production boundary');
  }
  for (const kind of EQUAL_HEIGHT_MASK_RESOLUTION_KINDS) {
    const actual = ledger.entries.filter((entry) => entry.resolution.kind === kind).length;
    if (ledger.counts[kind] !== actual) {
      throw new Error(`Equal-height mask ledger ${kind} count drift; declared ${ledger.counts[kind]}, actual ${actual}`);
    }
  }
  const total = EQUAL_HEIGHT_MASK_RESOLUTION_KINDS.reduce((sum, kind) => sum + ledger.counts[kind], 0);
  if (total !== BLOB_TILE_COUNT) {
    throw new Error(`Equal-height mask ledger resolution counts total ${total}; expected ${BLOB_TILE_COUNT}`);
  }
}

export interface EqualHeightMaskContactPanel {
  readonly entry: EqualHeightMaskLedgerEntry;
  readonly column: number;
  readonly row: number;
}

export interface EqualHeightMaskContactDescriptor {
  readonly stem: EqualHeightMaskLedger['stem'];
  readonly columns: 6;
  readonly rows: 8;
  readonly panels: readonly EqualHeightMaskContactPanel[];
  readonly checksum: {
    readonly column: 5;
    readonly row: 7;
    readonly label: '47/47 · no missing or duplicate indices';
  };
  readonly contract: false;
  readonly productionRegistration: false;
  readonly exportable: false;
}

export function equalHeightMaskContactDescriptor(
  ledger: EqualHeightMaskLedger = EQUAL_HEIGHT_MASK_LEDGER,
): EqualHeightMaskContactDescriptor {
  validateEqualHeightMaskLedger(ledger);
  return {
    stem: ledger.stem,
    columns: 6,
    rows: 8,
    panels: ledger.entries.map((entry, index) => ({
      entry,
      column: index % 6,
      row: Math.floor(index / 6),
    })),
    checksum: {
      column: 5,
      row: 7,
      label: '47/47 · no missing or duplicate indices',
    },
    contract: false,
    productionRegistration: false,
    exportable: false,
  };
}

validateEqualHeightMaskLedger(EQUAL_HEIGHT_MASK_LEDGER);
