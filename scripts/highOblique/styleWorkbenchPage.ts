import { EQUAL_HEIGHT_CORRIDOR_GATE } from './equalHeightCorridorGate';
import { EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE } from './equalHeightAllMaskConsistencyGate';
import { EQUAL_HEIGHT_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE } from './equalHeightDoubleFilledDiagonalCrossJunctionGate';
import { EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE } from './equalHeightDoubleFilledEastCrossJunctionGate';
import { EQUAL_HEIGHT_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_GATE } from './equalHeightDoubleFilledNorthCrossJunctionGate';
import { EQUAL_HEIGHT_DOUBLE_FILLED_OPPOSITE_DIAGONAL_CROSS_JUNCTION_GATE } from './equalHeightDoubleFilledOppositeDiagonalCrossJunctionGate';
import { EQUAL_HEIGHT_DOUBLE_FILLED_SOUTH_CROSS_JUNCTION_GATE } from './equalHeightDoubleFilledSouthCrossJunctionGate';
import { EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE } from './equalHeightDoubleFilledWestCrossJunctionGate';
import { EQUAL_HEIGHT_EAST_PARTIAL_T_JUNCTION_GATE } from './equalHeightEastPartialTJunctionGate';
import { EQUAL_HEIGHT_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE } from './equalHeightHorizontalOpenPocketTJunctionGate';
import { EQUAL_HEIGHT_HORIZONTAL_PARTIAL_T_JUNCTION_GATE } from './equalHeightHorizontalPartialTJunctionGate';
import { EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE } from './equalHeightHorizontalTerminusGate';
import { EQUAL_HEIGHT_ISOLATED_SHELL_GATE } from './equalHeightIsolatedShellGate';
import { EQUAL_HEIGHT_FULLY_FILLED_CROSS_JUNCTION_GATE } from './equalHeightFullyFilledCrossJunctionGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from './equalHeightMaskLedger';
import { EQUAL_HEIGHT_OPEN_POCKET_T_JUNCTION_GATE } from './equalHeightOpenPocketTJunctionGate';
import { EQUAL_HEIGHT_OPEN_POCKET_CROSS_JUNCTION_GATE } from './equalHeightOpenPocketCrossJunctionGate';
import { EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE } from './equalHeightSingleFilledCrossJunctionGate';
import { EQUAL_HEIGHT_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_GATE } from './equalHeightSingleFilledNorthwestCrossJunctionGate';
import { EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE } from './equalHeightSingleFilledSoutheastCrossJunctionGate';
import { EQUAL_HEIGHT_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE } from './equalHeightSingleFilledSouthwestCrossJunctionGate';
import { EQUAL_HEIGHT_SINGLE_OPEN_NORTHEAST_CROSS_JUNCTION_GATE } from './equalHeightSingleOpenNortheastCrossJunctionGate';
import { EQUAL_HEIGHT_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_GATE } from './equalHeightSingleOpenNorthwestCrossJunctionGate';
import { EQUAL_HEIGHT_SINGLE_OPEN_SOUTHEAST_CROSS_JUNCTION_GATE } from './equalHeightSingleOpenSoutheastCrossJunctionGate';
import { EQUAL_HEIGHT_SINGLE_OPEN_SOUTHWEST_CROSS_JUNCTION_GATE } from './equalHeightSingleOpenSouthwestCrossJunctionGate';
import { EQUAL_HEIGHT_THICK_WALL_BLOCK_GATE } from './equalHeightThickWallBlockGate';
import { EQUAL_HEIGHT_THICK_WALL_HORIZONTAL_REPEAT_GATE } from './equalHeightThickWallHorizontalRepeatGate';
import { EQUAL_HEIGHT_THICK_WALL_REPEAT_GATE } from './equalHeightThickWallRepeatGate';
import { EQUAL_HEIGHT_VERTICAL_TERMINUS_GATE } from './equalHeightVerticalTerminusGate';
import { EQUAL_HEIGHT_WEST_PARTIAL_T_JUNCTION_GATE } from './equalHeightWestPartialTJunctionGate';

export type CurrentWorkbenchBoardState = 'accepted' | 'review';

export interface CurrentWorkbenchBoard {
  readonly stem: string;
  readonly previewStem?: string;
  readonly state: CurrentWorkbenchBoardState;
  readonly status?: string;
  readonly gateId?:
    | 'fully-filled-cross-junction'
    | 'single-open-northeast-cross-junction'
    | 'double-filled-south-cross-junction'
    | 'double-filled-north-cross-junction'
    | 'double-filled-opposite-diagonal-cross-junction';
  readonly refreshGroup?:
    | 'focus'
    | 'consistency'
    | 'fully-filled-cross-junction'
    | 'single-open-northeast-cross-junction'
    | 'single-open-northwest-cross-junction'
    | 'single-open-southeast-cross-junction'
    | 'double-filled-south-cross-junction'
    | 'double-filled-north-cross-junction'
    | 'double-filled-opposite-diagonal-cross-junction'
    | 'single-filled-southwest-cross-junction'
    | 'double-filled-west-cross-junction';
  readonly title: string;
  readonly summary: string;
  readonly alt: string;
}

interface ArchivedWorkbenchBoard {
  readonly stem: string;
  readonly title: string;
  readonly refreshGroup: 'focus' | 'proofs' | 'gate' | 'room' | 'ladder';
  readonly alt: string;
}

export interface AcceptedSystemGate {
  readonly stem: string;
  readonly state: 'accepted';
  readonly title: string;
  readonly summary: string;
  readonly alt: string;
}

/** Owner-accepted authored source for the fully buried solid-wall center. */
export const ACCEPTED_FULLY_FILLED_CROSS_JUNCTION_GATE:
AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_FULLY_FILLED_CROSS_JUNCTION_GATE.stem,
  state: 'accepted',
  title: 'mask_46 fully filled center',
  summary: 'Accepted one independently authored flattened buried-center pair. All four cardinal sockets and all four diagonal crooks are occupied; accepted perimeter pieces own every visible face cue.',
  alt: 'owner-accepted mask forty-six QuotaCo fully filled buried center source in three by three four by four and six by six solid wall masses',
};

/** Owner-accepted plain whole-cell X derivation for the single-open northeast cross-junction. */
export const ACCEPTED_SINGLE_OPEN_NORTHEAST_CROSS_JUNCTION_GATE:
AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_SINGLE_OPEN_NORTHEAST_CROSS_JUNCTION_GATE.stem,
  state: 'accepted',
  title: 'mask_45 single-open northeast cross-junction',
  summary: 'Accepted the plain whole-cell X mirror of mask_33; southeast, southwest, and northwest are solid while the northeast floor crook remains open.',
  alt: 'owner-accepted mask forty-five QuotaCo single-open northeast cross-junction plain whole-cell X derivation in source compact and long installed proofs',
};

/** Owner-accepted authored source for the single-open northwest cross-junction. */
export const ACCEPTED_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_GATE:
AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_GATE.stem,
  state: 'accepted',
  title: 'mask_33 single-open northwest cross-junction',
  summary: 'Accepted one independently authored fixed-view four-way union with northeast, southeast, and southwest solid while the northwest floor crook remains open; mask_33 now has direct proof-layer provenance.',
  alt: 'owner-accepted mask thirty-three QuotaCo single-open northwest cross-junction in source compact and long installed proofs',
};

/** Owner-accepted plain whole-cell X derivation for the single-open southeast cross-junction. */
export const ACCEPTED_SINGLE_OPEN_SOUTHEAST_CROSS_JUNCTION_GATE:
AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_SINGLE_OPEN_SOUTHEAST_CROSS_JUNCTION_GATE.stem,
  state: 'accepted',
  title: 'mask_44 single-open southeast cross-junction',
  summary: 'Accepted the plain whole-cell X mirror of mask_41; northwest, northeast, and southwest are solid while the southeast floor crook remains open.',
  alt: 'owner-accepted mask forty-four QuotaCo single-open southeast cross-junction plain whole-cell X derivation in source compact and long installed proofs',
};

/** Owner-accepted authored source for the single-open southwest cross-junction. */
export const ACCEPTED_SINGLE_OPEN_SOUTHWEST_CROSS_JUNCTION_GATE:
AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_SINGLE_OPEN_SOUTHWEST_CROSS_JUNCTION_GATE.stem,
  state: 'accepted',
  title: 'mask_41 single-open southwest cross-junction',
  summary: 'Accepted one independently authored fixed-view four-way union with northeast, southeast, and northwest solid while the southwest floor crook remains open; mask_41 now has direct proof-layer provenance.',
  alt: 'owner-accepted mask forty-one QuotaCo single-open southwest cross-junction in source compact and long installed proofs',
};

/** Owner-accepted authored source for the south-filled structural-slab junction. */
export const ACCEPTED_DOUBLE_FILLED_SOUTH_CROSS_JUNCTION_GATE:
AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_DOUBLE_FILLED_SOUTH_CROSS_JUNCTION_GATE.stem,
  state: 'accepted',
  title: 'mask_32 south-filled slab cross-junction',
  summary: 'Accepted one independently authored fixed-view union for a two-row south slab with a centered north spur. Both southern diagonals are solid, both northern crooks remain open floor, and mask_32 now has direct proof-layer provenance.',
  alt: 'owner-accepted mask thirty-two QuotaCo south-filled slab cross-junction in source compact and long installed proofs',
};

/** Owner-accepted authored source for the opposed-diagonal filled four-way hub. */
export const ACCEPTED_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE:
AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE.stem,
  state: 'accepted',
  title: 'mask_30 diagonal-filled cross-junction',
  summary: 'Accepted one authored fixed-light union with northeast and southwest solid, northwest and southeast open floor, and source-owned north/west-to-south/east register handoff; mask_30 now has direct proof-layer provenance.',
  alt: 'owner-accepted mask thirty diagonal-filled QuotaCo cross-junction in source compact and long installed proofs',
};

/** Owner-accepted filtered X derivation for the opposite-diagonal filled hub. */
export const ACCEPTED_DOUBLE_FILLED_OPPOSITE_DIAGONAL_CROSS_JUNCTION_GATE:
AcceptedSystemGate = {
  stem:
    EQUAL_HEIGHT_DOUBLE_FILLED_OPPOSITE_DIAGONAL_CROSS_JUNCTION_GATE.stem,
  state: 'accepted',
  title: 'mask_40 opposite-diagonal cross-junction',
  summary: 'Accepted the whole-cell X mirror of mask_30 after omitting only the two duplicated west-boundary seam paths. Northwest and southeast are solid while northeast and southwest remain open floor.',
  alt: 'owner-accepted mask forty opposite-diagonal QuotaCo cross-junction filtered mirror derivation in compact and long installed proofs',
};

/** Owner-accepted authored source for the north-filled structural-slab junction. */
export const ACCEPTED_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_GATE:
AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_GATE.stem,
  state: 'accepted',
  title: 'mask_39 north-filled slab cross-junction',
  summary: 'Accepted one authored west-fixed union for a two-row north slab with a south spur. Its cream plane, light arris, dimensional shade, and seam share one parallel curve into the existing coral/green south-branch return while all socket pixels remain fixed.',
  alt: 'owner-accepted mask thirty-nine QuotaCo north-filled slab cross-junction in source compact and long installed proofs',
};

/** Owner-accepted separately authored east-register source for the northwest-filled four-way hub. */
export const ACCEPTED_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_GATE:
AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_GATE.stem,
  state: 'accepted',
  title: 'mask_37 northwest-filled cross-junction',
  summary: 'Accepted one separately authored east-register four-way union with a solid northwest crook and three genuine floor crooks; mask_37 now has direct proof-layer provenance.',
  alt: 'owner-accepted mask thirty-seven QuotaCo northwest-filled cross-junction authored east-register source in compact and long installed proofs',
};

/** Owner-accepted whole-cell X derivation for the southwest-filled four-way hub. */
export const ACCEPTED_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE:
AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE.stem,
  state: 'accepted',
  title: 'mask_29 southwest-filled cross-junction',
  summary: 'Accepted the plain whole-cell X mirror of mask_23 as one east-register four-way union; the southwest crook is solid while northeast, southeast, and northwest remain open floor.',
  alt: 'owner-accepted mask twenty-nine QuotaCo southwest-filled cross-junction mirror derivation in compact and long installed proofs',
};

/** Owner-accepted whole-cell X derivation for the west-filled structural-slab junction. */
export const ACCEPTED_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE: AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE.stem,
  state: 'accepted',
  title: 'mask_43 west-filled slab junction',
  summary: 'Accepted the plain whole-cell X mirror of mask_25 for an east branch entering a two-cell-wide north–south slab; it inherits one local cream reveal exposure through the turn while preserving the outer socket bands.',
  alt: 'owner-accepted mask forty-three QuotaCo west-filled slab junction in source compact and long installed proofs',
};

/** Owner-accepted authored source for the east-filled structural-slab junction. */
export const ACCEPTED_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE: AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE.stem,
  state: 'accepted',
  title: 'mask_25 east-filled slab junction',
  summary: 'Accepted one west-fixed authored union for a west branch entering a two-cell-wide north–south slab; its local x=58…120 highlight keeps one cream reveal exposure through the turn while preserving the outer socket bands.',
  alt: 'owner-accepted mask twenty-five QuotaCo east-filled slab junction in source compact and long installed proofs',
};

/** Owner-accepted authored source for the southeast-filled four-way wall hub. */
export const ACCEPTED_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE: AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE.stem,
  state: 'accepted',
  title: 'mask_23 southeast-filled cross-junction',
  summary: 'Accepted one west-fixed authored four-way union with a solid southeast crook and three genuine floor crooks; mask_23 now has direct proof-layer provenance.',
  alt: 'owner-accepted mask twenty-three single-filled southeast crook QuotaCo cross-junction in source compact and long installed proofs',
};

/** Owner-accepted authored source for the northeast-filled four-way wall hub. */
export const ACCEPTED_SINGLE_FILLED_CROSS_JUNCTION_GATE: AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE.stem,
  state: 'accepted',
  title: 'mask_19 single-filled-crook cross-junction',
  summary: 'Accepted one west-fixed authored four-way union with a solid northeast crook and three genuine floor crooks. Its right-hand cream plane, light arris, dimensional shade, and seam share one parallel curve into a combined coral/green return while every full-resolution socket pixel remains fixed.',
  alt: 'owner-accepted mask nineteen single-filled northeast crook QuotaCo cross-junction in source compact and long installed proofs',
};

/** Owner-accepted authored source for the all-open four-way wall hub. */
export const ACCEPTED_OPEN_POCKET_CROSS_JUNCTION_GATE: AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_OPEN_POCKET_CROSS_JUNCTION_GATE.stem,
  state: 'accepted',
  title: 'mask_15 open-pocket cross-junction',
  summary: 'Accepted one authored fixed-light four-way union with four cardinal sockets and four genuine floor crooks; mask_15 now has direct proof-layer provenance.',
  alt: 'owner-accepted mask fifteen open-pocket four-way QuotaCo wall hub in source compact and long installed proofs',
};

/** Owner-accepted horizontal-spine transitions with exactly one filled crook. */
export const ACCEPTED_HORIZONTAL_PARTIAL_T_JUNCTION_GATE: AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_HORIZONTAL_PARTIAL_T_JUNCTION_GATE.stem,
  state: 'accepted',
  title: 'Horizontal single-filled-pocket T-junction family',
  summary: 'Accepted masks 18/22 as two fixed-light direct sources and masks 35/28 as approved whole-cell X derivations; masks 22/28 share one cream-reveal exposure while broader south-face continuity remains deferred polish.',
  alt: 'owner-accepted horizontal single-filled-pocket T-junction masks eighteen thirty-five twenty-two and twenty-eight in compact and long wall masses',
};

/** Owner-accepted east-side mirror derivations with exactly one filled crook. */
export const ACCEPTED_EAST_PARTIAL_T_JUNCTION_GATE: AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_EAST_PARTIAL_T_JUNCTION_GATE.stem,
  state: 'accepted',
  title: 'East single-filled-pocket T-junction pair',
  summary: 'Accepted mask_36 as the filtered whole-cell X mirror of foreground mask_17 and mask_27 as the whole-cell X mirror of rear mask_21.',
  alt: 'owner-accepted east-side equal-height T junction masks thirty-six and twenty-seven with one filled diagonal and one open floor pocket',
};

/** Owner-accepted west-side transitions with exactly one filled crook. */
export const ACCEPTED_WEST_PARTIAL_T_JUNCTION_GATE: AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_WEST_PARTIAL_T_JUNCTION_GATE.stem,
  state: 'accepted',
  title: 'Single-filled-pocket T-junction pair',
  summary: 'Accepted mask_17 and mask_21 as two separately authored west fixed-light direct proof sources; mask_36 and mask_27 are their accepted east-side mirror derivations.',
  alt: 'owner-accepted west-side equal-height T junction masks seventeen and twenty-one with one filled diagonal and one open floor pocket',
};

/** Owner-accepted horizontal-spine T sources; lateral mirrors remain comparison evidence only. */
export const ACCEPTED_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE: AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE.stem,
  state: 'accepted',
  title: 'Horizontal open-pocket T-junction pair',
  summary: 'Accepted mask_11 and mask_14 as two separately authored fixed-light direct proof sources; same-mask lateral X mirrors remain comparison evidence, not accepted derivations.',
  alt: 'owner-accepted horizontal open-pocket T-junction pair with masks eleven and fourteen as direct fixed-light proof sources',
};

/** Owner-accepted open-pocket T-junction source and its filtered mirror mapping. */
export const ACCEPTED_OPEN_POCKET_T_JUNCTION_GATE: AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_OPEN_POCKET_T_JUNCTION_GATE.stem,
  state: 'accepted',
  title: 'Open-pocket T-junction pair',
  summary: 'Accepted mask_7 as the authored open-west direct source and mask_13 as its approved whole-cell X mirror with the southeast boundary-seam filter.',
  alt: 'owner-accepted equal-height open-pocket T-junction pair with mask seven direct and mask thirteen as a filtered mirror',
};

/** Owner-accepted horizontal middle sources and their direct ledger mappings. */
export const ACCEPTED_THICK_WALL_HORIZONTAL_REPEAT_GATE: AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_THICK_WALL_HORIZONTAL_REPEAT_GATE.stem,
  state: 'accepted',
  title: 'N×2 thick-wall horizontal repeat unit',
  summary: 'Accepted masks 31/38 as two direct fixed-light middle sources, proven inside 3×2, 4×2, and 6×2 solid wall masses.',
  alt: 'owner-accepted equal-height horizontal thick-wall repeat family with masks thirty-one and thirty-eight as direct sources',
};

/** Owner-accepted repeatable middle source and its mirrored ledger mapping. */
export const ACCEPTED_THICK_WALL_REPEAT_GATE: AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_THICK_WALL_REPEAT_GATE.stem,
  state: 'accepted',
  title: '2×N thick-wall repeat unit',
  summary: 'Accepted mask_24 as one west-authored open-Y cream spine and mask_42 as its approved whole-cell X mirror, proven inside 2×3, 2×4, and 2×6 solid wall masses.',
  alt: 'owner-accepted equal-height two-column thick-wall repeat family with mask twenty-four direct and mask forty-two mirrored',
};

/** Owner-accepted filled-elbow source family and its four ledger mappings. */
export const ACCEPTED_THICK_WALL_BLOCK_GATE: AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_THICK_WALL_BLOCK_GATE.stem,
  state: 'accepted',
  title: '2×2 thick-wall source family',
  summary: 'Accepted masks 16/20 as direct fixed-light sources and 26/34 as approved X mirrors: one continuous cream wall top with the south-facing material shade preserving the foreground plane break.',
  alt: 'owner-accepted equal-height two by two solid wall block assembled from direct and mirrored proof sources',
};

/** Owner-accepted zero-link structural shell and its direct ledger provenance. */
export const ACCEPTED_ISOLATED_SHELL_GATE: AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_ISOLATED_SHELL_GATE.stem,
  state: 'accepted',
  title: 'mask_0 isolated structural shell',
  summary: 'Accepted direct source for one full-height zero-socket wall cell: a single molded tri-tone housing proven at 240/90/40 px and in compact floor contexts.',
  alt: 'owner-accepted mask zero isolated structural wall shell at multiple scales and compact placements',
};

/** Owner-accepted vertical closures and their whole-cell mirrored facings. */
export const ACCEPTED_VERTICAL_TERMINUS_GATE: AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_VERTICAL_TERMINUS_GATE.stem,
  state: 'accepted',
  title: 'Vertical terminus family',
  summary: 'Accepted mask_1 south-facing and mask_4 north-facing wall-owned closures, with west-authored sources and approved east mirror-X derivations proven at 240/90/40 px and short/long runs.',
  alt: 'owner-accepted equal-height vertical terminus family with tri-tone exposed wall ends at multiple sizes and run lengths',
};

/** Owner-accepted composition proof, kept separate from wall-piece acceptance. */
export const ACCEPTED_CORRIDOR_GATE: AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_CORRIDOR_GATE.stem,
  state: 'accepted',
  title: '3×8 narrow-corridor closure',
  summary: 'Accepted equal-height enclosure baseline at 90 and 40 pixels per cell.',
  alt: 'accepted equal-height wall family narrow-corridor closure gate',
};

/** Owner-accepted mapping structure with all 47 proof-layer rows resolved. */
export const ACCEPTED_MAPPING_GATE: AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_MASK_LEDGER.stem,
  state: 'accepted',
  title: '47-mask mapping ledger',
  summary: 'Accepted topology map: 28 direct reuses, 19 approved derivations, 0 synthetic candidates, and 0 authored-geometry gaps.',
  alt: 'owner-accepted equal-height 47-mask mapping ledger with all proof-layer rows resolved',
};

/** Owner-accepted horizontal cap source and its whole-cell mirrored facing. */
export const ACCEPTED_HORIZONTAL_TERMINUS_GATE: AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE.stem,
  state: 'accepted',
  title: 'Horizontal terminus pair',
  summary: 'Accepted mask_8 direct source and mask_2 whole-cell X mirror, proven at 90/40 px and across 1/3/6-cell runs.',
  alt: 'owner-accepted equal-height horizontal terminus direct and mirrored source sheet',
};

/** The current owner-accepted decision sheets. */
export const CURRENT_WORKBENCH_BOARDS: readonly CurrentWorkbenchBoard[] = [
  {
    stem: EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.stem,
    previewStem: EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.previewStem,
    state: 'review',
    status: EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.status,
    refreshGroup: 'consistency',
    title: 'All-47 family consistency review',
    summary: 'Review-only whole-vocabulary pass across all 50 accepted visual presentations, compact occupancy, direct/derived pairs, 1/3/6-cell extents, and light/dark composed environments. The accepted 28/19/0/0 ledger remains frozen.',
    alt: 'review-only QuotaCo equal-height all forty-seven mask family consistency sheet across scales grounds derivations sockets extents and composed environments',
  },
  {
    stem: 'full-height-east-proof',
    state: 'accepted',
    title: 'East wall',
    summary: 'Accepted whole-cell mirror reuse of the full-height west profile.',
    alt: 'accepted full-height east wall mirror reuse',
  },
  {
    stem: 'full-height-northeast-proof',
    state: 'accepted',
    title: 'Northeast corner',
    summary: 'Accepted mirror reuse of the northwest source, proven with the east wall.',
    alt: 'accepted full-height northeast mirrored corner',
  },
  {
    stem: 'full-height-south-proof',
    state: 'accepted',
    title: 'South wall',
    summary: 'Accepted reuse of the full-height north wall source.',
    alt: 'accepted full-height south wall source reuse',
  },
  {
    stem: 'full-height-southwest-proof',
    state: 'accepted',
    title: 'Southwest corner',
    summary: 'Accepted molded turn from the west wall into the shared south profile.',
    alt: 'accepted full-height southwest molded corner',
  },
  {
    stem: 'full-height-southeast-proof',
    state: 'accepted',
    title: 'Southeast corner',
    summary: 'Accepted mirror-derived reuse of the southwest source with south-owned service seams.',
    alt: 'accepted full-height southeast mirrored corner',
  },
] as const;

/** Historical evidence stays reachable without competing with current work. */
export const ARCHIVED_WORKBENCH_BOARDS: readonly ArchivedWorkbenchBoard[] = [
  {
    stem: 'transition-w-to-s-focus',
    title: 'Superseded southwest full-to-low transition',
    refreshGroup: 'focus',
    alt: 'superseded southwest full-to-low transition and installed proofs',
  },
  {
    stem: 'cross-section-proofs',
    title: 'Directional plane-law reference controls',
    refreshGroup: 'proofs',
    alt: 'archived cross-section proofs',
  },
  {
    stem: 'envelope-gate',
    title: 'Mixed-profile envelope checkpoint',
    refreshGroup: 'gate',
    alt: 'archived composed wall envelope gate',
  },
  {
    stem: 'room-context-mock',
    title: 'Mixed-profile room checkpoint',
    refreshGroup: 'room',
    alt: 'archived room context mock',
  },
  {
    stem: 'length-ladder',
    title: 'Mixed-profile length and corridor checkpoint',
    refreshGroup: 'ladder',
    alt: 'archived short and long wall composition gate',
  },
] as const;

const escapeHtml = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const imageControls = (
  loadLabel: string,
  unloadLabel: string,
  initiallyLoaded: boolean,
): string => (
  '<div class="image-controls">' +
  `<button type="button" data-action="load"${initiallyLoaded ? ' disabled' : ''}>${escapeHtml(loadLabel)}</button>` +
  `<button type="button" data-action="unload"${initiallyLoaded ? '' : ' disabled'}>${escapeHtml(unloadLabel)}</button>` +
  '</div>'
);

const loadableFigure = (
  stem: string,
  refreshGroup: string,
  alt: string,
): string => (
  `<figure data-stem="${escapeHtml(stem)}" data-refresh="${escapeHtml(refreshGroup)}" data-loadable="true" data-loaded="false">` +
  `<img alt="${escapeHtml(alt)}">` +
  imageControls('Load image', 'Unload image', false) +
  '</figure>'
);

const currentBoard = (board: CurrentWorkbenchBoard): string => {
  const stateLabel = board.state === 'accepted' ? 'Accepted' : 'Review next';
  const refreshGroup = board.refreshGroup ?? 'focus';
  const statusAttribute =
    board.status === undefined ? '' : ` data-status="${escapeHtml(board.status)}"`;
  const gateAttribute =
    board.gateId === undefined ? '' : ` data-gate="${escapeHtml(board.gateId)}"`;
  const figure = board.state === 'review' && board.previewStem !== undefined
    ? (
      `<figure data-stem="${escapeHtml(board.stem)}" data-preview-stem="${escapeHtml(board.previewStem)}" data-refresh="${escapeHtml(refreshGroup)}" data-loadable="true" data-loaded="preview" data-full-resolution="download-only">` +
      `<img src="${escapeHtml(board.previewStem)}.png" alt="${escapeHtml(`${board.alt} bounded preview`)}">` +
      imageControls('Load preview', 'Unload preview', true) +
      '<figcaption class="artifact-download">' +
      `<a href="${escapeHtml(board.stem)}.png" download>Download full-resolution PNG</a>` +
      '<span>The full sheet is download-only and is never decoded by this page.</span>' +
      '</figcaption></figure>'
    )
    : loadableFigure(board.stem, refreshGroup, board.alt);
  return (
    `<article class="board" data-state="${board.state}"${statusAttribute}${gateAttribute}>` +
    '<header class="board-copy">' +
    `<span class="badge">${stateLabel}</span>` +
    `<h3>${escapeHtml(board.title)}</h3>` +
    `<p>${escapeHtml(board.summary)}</p>` +
    '</header>' +
    figure +
    '</article>'
  );
};

const archivedBoard = (board: ArchivedWorkbenchBoard): string => (
  '<article class="archived-board">' +
  `<h3>${escapeHtml(board.title)}</h3>` +
  loadableFigure(board.stem, board.refreshGroup, board.alt) +
  '</article>'
);

const acceptedSystemGate = (
  gate: AcceptedSystemGate,
  refreshGroup: 'fully-filled-cross-junction' | 'single-open-northeast-cross-junction' | 'single-open-northwest-cross-junction' | 'single-open-southeast-cross-junction' | 'single-open-southwest-cross-junction' | 'double-filled-south-cross-junction' | 'double-filled-opposite-diagonal-cross-junction' | 'double-filled-diagonal-cross-junction' | 'double-filled-north-cross-junction' | 'single-filled-northwest-cross-junction' | 'single-filled-southwest-cross-junction' | 'double-filled-west-cross-junction' | 'double-filled-east-cross-junction' | 'single-filled-southeast-cross-junction' | 'single-filled-cross-junction' | 'open-pocket-cross-junction' | 'horizontal-partial-t-junction' | 'east-partial-t-junction' | 'single-filled-pocket-t-junction' | 'horizontal-open-pocket-t-junction' | 'open-pocket-t-junction' | 'thick-wall-horizontal-repeat' | 'thick-wall-repeat' | 'thick-wall-block' | 'isolated-shell' | 'vertical-terminus' | 'terminus' | 'mapping' | 'corridor',
  gateId: 'fully-filled-cross-junction' | 'single-open-northeast-cross-junction' | 'single-open-northwest-cross-junction' | 'single-open-southeast-cross-junction' | 'single-open-southwest-cross-junction' | 'double-filled-south-cross-junction' | 'double-filled-opposite-diagonal-cross-junction' | 'double-filled-diagonal-cross-junction' | 'double-filled-north-cross-junction' | 'single-filled-northwest-cross-junction' | 'single-filled-southwest-cross-junction' | 'double-filled-west-cross-junction' | 'double-filled-east-cross-junction' | 'single-filled-southeast-cross-junction' | 'single-filled-cross-junction' | 'open-pocket-cross-junction' | 'horizontal-partial-t-junction' | 'east-partial-t-junction' | 'single-filled-pocket-t-junction' | 'horizontal-open-pocket-t-junction' | 'open-pocket-t-junction' | 'thick-wall-horizontal-repeat' | 'thick-wall-repeat' | 'thick-wall-block' | 'isolated-shell' | 'vertical-terminus' | 'terminus' | 'mapping' | 'corridor',
): string => (
  `<section class="current-section system-accepted" aria-labelledby="accepted-${gateId}-title">` +
  `<header class="section-copy"><h2 id="accepted-${gateId}-title">${gateId === 'mapping' ? 'Accepted system mapping' : gateId === 'corridor' ? 'Accepted system proof' : gateId === 'single-open-northeast-cross-junction' || gateId === 'single-open-southeast-cross-junction' || gateId === 'double-filled-opposite-diagonal-cross-junction' || gateId === 'single-filled-southwest-cross-junction' || gateId === 'double-filled-west-cross-junction' ? 'Accepted derivation gate' : 'Accepted source gate'}</h2>` +
  `<p>${gateId === 'mapping' ? 'The mapping structure is locked; all 47 rows have accepted direct or derived proof-layer provenance and no authored-geometry gaps remain.' : gateId === 'fully-filled-cross-junction' ? 'The independently authored flattened buried-center pair and ledger row mask_46 are locked at the proof layer; all four cardinal sockets and all four diagonal crooks are solid while accepted perimeter rows own every visible face cue.' : gateId === 'single-open-northeast-cross-junction' ? 'The plain whole-cell X mirror of mask_33 and ledger row mask_45 are locked at the proof layer; southeast, southwest, and northwest are solid while the northeast crook remains open floor.' : gateId === 'single-open-northwest-cross-junction' ? 'The independently authored fixed-view four-way union and ledger row mask_33 are locked at the proof layer; northeast, southeast, and southwest are solid while the northwest crook remains open floor.' : gateId === 'single-open-southeast-cross-junction' ? 'The plain whole-cell X mirror of mask_41 and ledger row mask_44 are locked at the proof layer; northwest, northeast, and southwest are solid while the southeast crook remains open floor.' : gateId === 'single-open-southwest-cross-junction' ? 'The independently authored fixed-view four-way union and ledger row mask_41 are locked at the proof layer; northeast, southeast, and northwest are solid while the southwest crook remains open floor.' : gateId === 'double-filled-south-cross-junction' ? 'The independently authored fixed-view four-way union and ledger row mask_32 are locked at the proof layer; both southern diagonals are solid while the two northern crooks remain open floor.' : gateId === 'double-filled-opposite-diagonal-cross-junction' ? 'The filtered whole-cell X mirror of mask_30 and ledger row mask_40 are locked at the proof layer; northwest and southeast are solid while northeast and southwest remain open floor.' : gateId === 'double-filled-diagonal-cross-junction' ? 'The authored fixed-light four-way union and ledger row mask_30 are locked at the proof layer; northeast and southwest are solid while northwest and southeast remain open floor.' : gateId === 'double-filled-north-cross-junction' ? 'The authored west-fixed four-way union and ledger row mask_39 are locked at the proof layer with the approved parallel cream, arris, shade, and seam curve entering the existing material return while every socket pixel stays fixed.' : gateId === 'single-filled-northwest-cross-junction' ? 'The authored east-fixed four-way union and ledger row mask_37 are locked at the proof layer; the northwest crook is solid while the other three remain open floor.' : gateId === 'single-filled-southwest-cross-junction' ? 'The whole-cell X mirror of the mask_23 union and ledger row mask_29 are locked at the proof layer; the southwest crook is solid while the other three remain open floor.' : gateId === 'double-filled-west-cross-junction' ? 'The whole-cell X mirror of mask_25 and ledger row mask_43 are locked at the proof layer with the approved shared reveal exposure and unchanged socket bands.' : gateId === 'double-filled-east-cross-junction' ? 'The authored west-fixed union and ledger row mask_25 are locked at the proof layer with one local cream reveal exposure through the turn and unchanged socket bands.' : gateId === 'single-filled-southeast-cross-junction' ? 'The authored west-fixed four-way union and ledger row mask_23 are locked at the proof layer; the southeast crook is solid while the other three remain open floor.' : gateId === 'single-filled-cross-junction' ? 'The authored west-fixed four-way union and ledger row mask_19 are locked at the proof layer with the approved parallel cream, arris, shade, and seam turn entering one combined coral/green return while every full-resolution socket pixel remains fixed.' : gateId === 'open-pocket-cross-junction' ? 'The authored four-way union and ledger row mask_15 are locked at the proof layer; all four cardinal sockets connect while every diagonal crook remains open floor.' : gateId === 'horizontal-partial-t-junction' ? 'The two direct horizontal fixed-light sources, two approved X derivations, and ledger rows mask_18/mask_35/mask_22/mask_28 are locked at the proof layer; masks 22/28 share one cream-reveal exposure while broader south-face continuity remains deferred polish.' : gateId === 'east-partial-t-junction' ? 'The filtered foreground mirror, rear mirror, and ledger rows mask_36/mask_27 are locked at the proof layer.' : gateId === 'single-filled-pocket-t-junction' ? 'The two separately authored west fixed-light sources and ledger rows mask_17/mask_21 are locked at the proof layer; their east mirror rows are accepted separately.' : gateId === 'horizontal-open-pocket-t-junction' ? 'The two separately authored fixed-light sources and ledger rows mask_11/mask_14 are locked at the proof layer; lateral X mirrors remain comparison evidence only.' : gateId === 'open-pocket-t-junction' ? 'The authored open-west source, its filtered mirror, and ledger rows mask_7/mask_13 are locked at the proof layer.' : gateId === 'thick-wall-horizontal-repeat' ? 'The authored rear and foreground middle spines and ledger rows mask_31/mask_38 are locked at the proof layer.' : gateId === 'thick-wall-repeat' ? 'The authored west middle spine, its east mirror, and ledger rows mask_24/mask_42 are locked at the proof layer.' : gateId === 'thick-wall-block' ? 'The two authored filled-elbow sources, their east mirrors, and ledger rows mask_16/mask_20/mask_26/mask_34 are locked at the proof layer.' : gateId === 'isolated-shell' ? 'The fixed-view isolated shell and ledger row mask_0 are locked at the proof layer.' : gateId === 'vertical-terminus' ? 'The two authored vertical closures, their east mirrors, and ledger rows mask_1/mask_4 are locked at the proof layer.' : gateId === 'terminus' ? 'The horizontal source pair and its two ledger rows are locked at the proof layer.' : 'This remains the approved enclosure baseline for all subsequent wall-family proofs.'}</p></header>` +
  `<article class="board" data-state="system-accepted" data-gate="${gateId}">` +
  '<header class="board-copy"><span class="badge">Accepted · System gate</span>' +
  `<h3>${escapeHtml(gate.title)}</h3>` +
  `<p>${escapeHtml(gate.summary)}</p></header>` +
  loadableFigure(gate.stem, refreshGroup, gate.alt) +
  '</article></section>'
);

export function renderStyleWorkbenchPage(diagnosticStems: readonly string[]): string {
  const reviewManifest = CURRENT_WORKBENCH_BOARDS.filter((board) => board.state === 'review');
  const acceptedManifest = CURRENT_WORKBENCH_BOARDS.filter((board) => board.state === 'accepted');
  const reviewBoards = reviewManifest.map(currentBoard).join('');
  const acceptedBoards = acceptedManifest.map(currentBoard).join('');
  const reviewNames = reviewManifest.map((board) => board.title).join(' · ');
  const acceptedNames = acceptedManifest.map((board) => board.title).join(' · ');
  const reviewStatus = reviewManifest.length > 0
    ? `<div class="status-card review"><span>Review next · ${reviewManifest.length} ${reviewManifest.length === 1 ? 'piece' : 'pieces'}</span><strong>${escapeHtml(reviewNames)}</strong><p>These remain active proposals and are not yet in the accepted working set.</p></div>`
    : '';
  const acceptedFullyFilledCrossJunctionStatus =
    '<div class="status-card accepted"><span>Accepted source gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_FULLY_FILLED_CROSS_JUNCTION_GATE.title)}</strong>` +
    '<p>mask_46 directly reuses one independently authored flattened buried-center pair; all 47 proof-layer rows now have accepted provenance.</p></div>';
  const acceptedSingleOpenNortheastCrossJunctionStatus =
    '<div class="status-card accepted"><span>Accepted derivation gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_SINGLE_OPEN_NORTHEAST_CROSS_JUNCTION_GATE.title)}</strong>` +
    '<p>mask_45 is the accepted plain whole-cell X mirror of mask_33; southeast, southwest, and northwest are solid while the northeast crook remains open floor.</p></div>';
  const acceptedSingleOpenNorthwestCrossJunctionStatus =
    '<div class="status-card accepted"><span>Accepted source gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_GATE.title)}</strong>` +
    '<p>mask_33 directly reuses one independently authored fixed-view union; northeast, southeast, and southwest are solid while the northwest crook remains open floor.</p></div>';
  const acceptedSingleOpenSoutheastCrossJunctionStatus =
    '<div class="status-card accepted"><span>Accepted derivation gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_SINGLE_OPEN_SOUTHEAST_CROSS_JUNCTION_GATE.title)}</strong>` +
    '<p>mask_44 is the accepted plain whole-cell X mirror of mask_41; northwest, northeast, and southwest are solid while the southeast crook remains open floor.</p></div>';
  const acceptedSingleOpenSouthwestCrossJunctionStatus =
    '<div class="status-card accepted"><span>Accepted source gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_SINGLE_OPEN_SOUTHWEST_CROSS_JUNCTION_GATE.title)}</strong>` +
    '<p>mask_41 directly reuses one independently authored fixed-view union; northeast, southeast, and northwest are solid while the southwest crook remains open floor.</p></div>';
  const acceptedDoubleFilledSouthCrossJunctionStatus =
    '<div class="status-card accepted"><span>Accepted source gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_DOUBLE_FILLED_SOUTH_CROSS_JUNCTION_GATE.title)}</strong>` +
    '<p>mask_32 directly reuses one independently authored fixed-view union; both southern diagonals are solid and the two northern crooks remain open floor.</p></div>';
  const acceptedDoubleFilledOppositeDiagonalCrossJunctionStatus =
    '<div class="status-card accepted"><span>Accepted derivation gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_DOUBLE_FILLED_OPPOSITE_DIAGONAL_CROSS_JUNCTION_GATE.title)}</strong>` +
    '<p>mask_40 is the accepted filtered whole-cell X mirror of mask_30; northwest and southeast are solid while northeast and southwest remain open floor.</p></div>';
  const acceptedDoubleFilledDiagonalCrossJunctionStatus =
    '<div class="status-card accepted"><span>Accepted source gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE.title)}</strong>` +
    '<p>mask_30 directly reuses one authored fixed-light four-way union; northeast and southwest are solid, northwest and southeast remain open floor, and the register handoff stays source-owned.</p></div>';
  const acceptedDoubleFilledNorthCrossJunctionStatus =
    '<div class="status-card accepted"><span>Accepted source gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_GATE.title)}</strong>` +
    '<p>mask_39 directly reuses one west-fixed authored four-way union with one approved parallel shared-turn curve across cream, arris, shade, and seam while every socket pixel remains fixed.</p></div>';
  const acceptedSingleFilledNorthwestCrossJunctionStatus =
    '<div class="status-card accepted"><span>Accepted source gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_GATE.title)}</strong>` +
    '<p>mask_37 directly reuses one east-fixed authored four-way union; the northwest crook is solid and the other three remain open floor.</p></div>';
  const acceptedSingleFilledSouthwestCrossJunctionStatus =
    '<div class="status-card accepted"><span>Accepted derivation gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE.title)}</strong>` +
    '<p>mask_29 is the accepted plain whole-cell X mirror of mask_23; the southwest crook is solid and the other three remain open floor.</p></div>';
  const acceptedDoubleFilledWestCrossJunctionStatus =
    '<div class="status-card accepted"><span>Accepted derivation gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE.title)}</strong>` +
    '<p>mask_43 is the accepted plain whole-cell X mirror of mask_25 and inherits its shared local cream reveal exposure without changing the outer socket bands.</p></div>';
  const acceptedDoubleFilledEastCrossJunctionStatus =
    '<div class="status-card accepted"><span>Accepted source gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE.title)}</strong>` +
    '<p>mask_25 directly reuses one west-fixed authored union with a local x=58…120 highlight that keeps one cream reveal exposure through the turn without changing the outer socket bands.</p></div>';
  const acceptedSingleFilledSoutheastCrossJunctionStatus =
    '<div class="status-card accepted"><span>Accepted source gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE.title)}</strong>` +
    '<p>mask_23 directly reuses one west-fixed authored four-way union; the southeast crook is solid and the other three remain open floor.</p></div>';
  const acceptedSingleFilledCrossJunctionStatus =
    '<div class="status-card accepted"><span>Accepted source gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_SINGLE_FILLED_CROSS_JUNCTION_GATE.title)}</strong>` +
    '<p>mask_19 directly reuses one west-fixed authored four-way union with the approved shared right-hand curve and one combined coral/green return while every full-resolution socket pixel remains fixed.</p></div>';
  const acceptedOpenPocketCrossJunctionStatus =
    '<div class="status-card accepted"><span>Accepted source gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_OPEN_POCKET_CROSS_JUNCTION_GATE.title)}</strong>` +
    '<p>mask_15 directly reuses one authored four-way union; all four sockets connect and all four diagonal crooks remain open floor.</p></div>';
  const acceptedHorizontalPartialTJunctionStatus =
    '<div class="status-card accepted"><span>Accepted source gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_HORIZONTAL_PARTIAL_T_JUNCTION_GATE.title)}</strong>` +
    '<p>mask_18/mask_22 are direct; mask_35/mask_28 are approved X derivations. Masks 22/28 share one cream-reveal exposure; broader south-face continuity remains deferred polish.</p></div>';
  const acceptedEastPartialTJunctionStatus = '<div class="status-card accepted"><span>Accepted source gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_EAST_PARTIAL_T_JUNCTION_GATE.title)}</strong>` +
    '<p>mask_36 is the accepted filtered whole-cell X mirror of mask_17; mask_27 is the accepted whole-cell X mirror of mask_21.</p></div>';
  const acceptedTerminusGateStatus = '<div class="status-card accepted"><span>Accepted source gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_HORIZONTAL_TERMINUS_GATE.title)}</strong>` +
    '<p>mask_8 is direct; mask_2 is the accepted whole-cell mirror-X derivation.</p></div>';
  const acceptedVerticalTerminusGateStatus = '<div class="status-card accepted"><span>Accepted source gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_VERTICAL_TERMINUS_GATE.title)}</strong>` +
    '<p>mask_1 and mask_4 are accepted with west-authored sources and east mirror-X derivations.</p></div>';
  const acceptedIsolatedShellGateStatus = '<div class="status-card accepted"><span>Accepted source gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_ISOLATED_SHELL_GATE.title)}</strong>` +
    '<p>mask_0 is accepted as one fixed-view direct source with zero cardinal sockets.</p></div>';
  const acceptedMappingGateStatus = '<div class="status-card accepted"><span>Accepted system mapping</span>' +
    `<strong>${escapeHtml(ACCEPTED_MAPPING_GATE.title)}</strong>` +
    '<p>The 47-row topology plan is locked; all rows have accepted direct or derived proof-layer provenance and no synthetic candidates remain.</p></div>';
  const acceptedCorridorGateStatus = '<div class="status-card accepted"><span>Accepted system proof</span>' +
    `<strong>${escapeHtml(ACCEPTED_CORRIDOR_GATE.title)}</strong>` +
    '<p>The equal-height family reads as one enclosure at short and long extremes.</p></div>';
  const acceptedThickWallBlockGateStatus = '<div class="status-card accepted"><span>Accepted source gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_THICK_WALL_BLOCK_GATE.title)}</strong>` +
    '<p>mask_16/mask_20 are direct; mask_26/mask_34 are accepted whole-cell mirror-X derivations.</p></div>';
  const acceptedThickWallRepeatGateStatus = '<div class="status-card accepted"><span>Accepted source gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_THICK_WALL_REPEAT_GATE.title)}</strong>` +
    '<p>mask_24 is direct; mask_42 is the accepted whole-cell mirror-X derivation.</p></div>';
  const acceptedThickWallHorizontalRepeatStatus = '<div class="status-card accepted"><span>Accepted source gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_THICK_WALL_HORIZONTAL_REPEAT_GATE.title)}</strong>` +
    '<p>mask_31 and mask_38 are accepted as two direct fixed-light proof sources.</p></div>';
  const acceptedOpenPocketTJunctionStatus = '<div class="status-card accepted"><span>Accepted source gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_OPEN_POCKET_T_JUNCTION_GATE.title)}</strong>` +
    '<p>mask_7 is direct; mask_13 is the approved whole-cell X mirror with the southeast boundary-seam filter.</p></div>';
  const acceptedHorizontalOpenPocketTJunctionStatus = '<div class="status-card accepted"><span>Accepted source gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE.title)}</strong>` +
    '<p>mask_11 and mask_14 are direct fixed-light proof sources; lateral X mirrors are evidence only, not accepted derivations.</p></div>';
  const acceptedWestPartialTJunctionStatus = '<div class="status-card accepted"><span>Accepted source gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_WEST_PARTIAL_T_JUNCTION_GATE.title)}</strong>` +
    '<p>mask_17 and mask_21 are accepted direct proof sources; mask_36 and mask_27 are their accepted east-side mirror derivations.</p></div>';
  const reviewSection = reviewManifest.length > 0
    ? '<section class="current-section review" aria-labelledby="review-title"><header class="section-copy"><h2 id="review-title">Review next</h2><p>The proof-only candidates currently in play.</p></header>' + reviewBoards + '</section>'
    : '';
  const archivedBoards = ARCHIVED_WORKBENCH_BOARDS.map(archivedBoard).join('');
  const diagnostics = diagnosticStems.map((stem) => (
    loadableFigure(stem, 'root', `compiler diagnostic for ${stem}`)
  )).join('');

  return (
    '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>QuotaCo wall workbench</title>' +
    '<link rel="icon" href="data:,">' +
    '<style>' +
    ':root{color-scheme:dark;--ground:#1d211f;--panel:#252b28;--panel2:#303733;--ink:#f6f1e5;--muted:#a59e8f;--teal:#83a9a6;--green:#9fc7a9;--coral:#e0836e;--line:#46504b}' +
    '*{box-sizing:border-box}html{background:var(--ground);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}' +
    'body{max-width:1280px;margin:0 auto;padding:24px 20px 64px}h1{font-size:22px;margin:0 0 6px}h2{font-size:16px;margin:0}h3{font-size:16px;margin:8px 0 4px}' +
    'p{margin:0}.lede{max-width:760px;color:var(--muted);font-size:14px;line-height:1.5}' +
    '#status{font-size:13px;margin:14px 0 22px;color:var(--teal)}#status.bad,#archive-status.bad{color:var(--coral);white-space:pre-wrap}' +
    '.kit-status{border:1px solid var(--line);background:var(--panel);border-radius:14px;padding:16px;margin-bottom:28px}' +
    '.kit-status>h2{margin-bottom:12px;text-transform:uppercase;letter-spacing:.08em;font-size:12px;color:var(--muted)}' +
    '.status-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.status-card{border-radius:10px;padding:12px 14px;background:var(--panel2)}' +
    '.status-card span,.badge{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.status-card strong{display:block;margin:6px 0 3px;font-size:14px}.status-card p{font-size:12px;line-height:1.4;color:var(--muted)}' +
    '.status-card.review span,.board[data-state="review"] .badge,.board[data-state="system-review"] .badge{color:var(--coral)}.status-card.accepted span,.board[data-state="accepted"] .badge,.board[data-state="system-accepted"] .badge{color:var(--green)}' +
    '.current-section{margin:34px 0}.section-copy{border-left:3px solid var(--line);padding-left:12px;margin-bottom:14px}.current-section.review .section-copy,.current-section.system-review .section-copy{border-color:var(--coral)}.current-section.accepted .section-copy,.current-section.system-accepted .section-copy{border-color:var(--green)}' +
    '.section-copy p{color:var(--muted);font-size:13px;margin-top:4px}.board{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px;margin:0 0 18px}' +
    '.board-copy{margin:0 2px 12px}.board-copy p{color:var(--muted);font-size:13px;line-height:1.45}figure{margin:0}img{display:block;width:100%;height:auto;border-radius:10px}' +
    'img:not([src]){display:none}.image-controls{display:flex;gap:8px;align-items:center;padding-top:10px}.image-controls button{appearance:none;border:1px solid var(--line);border-radius:8px;background:var(--panel2);color:var(--ink);font:inherit;font-size:12px;font-weight:700;padding:7px 10px;cursor:pointer}.image-controls button:disabled{cursor:default;opacity:.4}.artifact-download{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:baseline;padding-top:8px;font-size:12px}.artifact-download a{color:var(--teal);font-weight:700}.artifact-download span{color:var(--muted)}' +
    'details{border-top:1px solid var(--line);margin-top:26px;padding-top:14px}summary{cursor:pointer;color:var(--muted);font-size:13px;font-weight:700;list-style-position:outside}' +
    'summary small{display:block;font-size:11px;font-weight:500;margin:5px 0 0 18px;color:#7e8983}details[open] summary{color:var(--ink);margin-bottom:16px}' +
    '.archive-grid,.diagnostic-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:14px}.archived-board h3{font-size:12px;color:var(--muted);margin:0 0 7px}' +
    '#archive-status{font-size:12px;margin:0 0 12px}.diagnostic-grid figure{min-width:0}' +
    '@media(max-width:700px){body{padding:18px 12px 48px}.status-grid{grid-template-columns:1fr}.archive-grid,.diagnostic-grid{grid-template-columns:1fr}.board{padding:8px}.current-section{margin:26px 0}}' +
    '</style>' +
    '<header><h1>QuotaCo Building System — current wall workbench</h1>' +
    '<p class="lede">The all-47 family consistency pass is active for review. Every topology row remains accepted; this sheet audits cross-family register, socket, seam, silhouette, and south-facing shade coherence without crossing the production boundary.</p></header>' +
    '<div id="status">waiting for first render…</div>' +
    '<section class="kit-status" aria-labelledby="kit-status-title"><h2 id="kit-status-title">Current direction status — equal-height structural walls</h2>' +
    '<div class="status-grid">' +
    reviewStatus +
    acceptedFullyFilledCrossJunctionStatus +
    acceptedSingleOpenNortheastCrossJunctionStatus +
    acceptedSingleOpenNorthwestCrossJunctionStatus +
    acceptedSingleOpenSoutheastCrossJunctionStatus +
    acceptedSingleOpenSouthwestCrossJunctionStatus +
    acceptedDoubleFilledSouthCrossJunctionStatus +
    acceptedDoubleFilledOppositeDiagonalCrossJunctionStatus +
    acceptedDoubleFilledDiagonalCrossJunctionStatus +
    acceptedDoubleFilledNorthCrossJunctionStatus +
    acceptedSingleFilledNorthwestCrossJunctionStatus +
    acceptedSingleFilledSouthwestCrossJunctionStatus +
    acceptedDoubleFilledWestCrossJunctionStatus +
    acceptedDoubleFilledEastCrossJunctionStatus +
    acceptedSingleFilledSoutheastCrossJunctionStatus +
    acceptedSingleFilledCrossJunctionStatus +
    acceptedOpenPocketCrossJunctionStatus +
    acceptedHorizontalPartialTJunctionStatus +
    acceptedEastPartialTJunctionStatus +
    acceptedWestPartialTJunctionStatus +
    acceptedHorizontalOpenPocketTJunctionStatus +
    acceptedOpenPocketTJunctionStatus +
    acceptedThickWallHorizontalRepeatStatus +
    acceptedThickWallRepeatGateStatus +
    acceptedThickWallBlockGateStatus +
    acceptedIsolatedShellGateStatus +
    acceptedVerticalTerminusGateStatus +
    acceptedTerminusGateStatus +
    acceptedMappingGateStatus +
    acceptedCorridorGateStatus +
    `<div class="status-card accepted"><span>Accepted working set · ${acceptedManifest.length} pieces</span><strong>${escapeHtml(acceptedNames)}</strong><p>These are the current owner-approved working contracts.</p></div>` +
    '</div></section>' +
    '<main id="current-equal-height-wall-system">' +
    reviewSection +
    acceptedSystemGate(ACCEPTED_FULLY_FILLED_CROSS_JUNCTION_GATE, 'fully-filled-cross-junction', 'fully-filled-cross-junction') +
    acceptedSystemGate(ACCEPTED_SINGLE_OPEN_NORTHEAST_CROSS_JUNCTION_GATE, 'single-open-northeast-cross-junction', 'single-open-northeast-cross-junction') +
    acceptedSystemGate(ACCEPTED_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_GATE, 'single-open-northwest-cross-junction', 'single-open-northwest-cross-junction') +
    acceptedSystemGate(ACCEPTED_SINGLE_OPEN_SOUTHEAST_CROSS_JUNCTION_GATE, 'single-open-southeast-cross-junction', 'single-open-southeast-cross-junction') +
    acceptedSystemGate(ACCEPTED_SINGLE_OPEN_SOUTHWEST_CROSS_JUNCTION_GATE, 'single-open-southwest-cross-junction', 'single-open-southwest-cross-junction') +
    acceptedSystemGate(ACCEPTED_DOUBLE_FILLED_SOUTH_CROSS_JUNCTION_GATE, 'double-filled-south-cross-junction', 'double-filled-south-cross-junction') +
    acceptedSystemGate(ACCEPTED_DOUBLE_FILLED_OPPOSITE_DIAGONAL_CROSS_JUNCTION_GATE, 'double-filled-opposite-diagonal-cross-junction', 'double-filled-opposite-diagonal-cross-junction') +
    acceptedSystemGate(ACCEPTED_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE, 'double-filled-diagonal-cross-junction', 'double-filled-diagonal-cross-junction') +
    acceptedSystemGate(ACCEPTED_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_GATE, 'double-filled-north-cross-junction', 'double-filled-north-cross-junction') +
    acceptedSystemGate(ACCEPTED_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_GATE, 'single-filled-northwest-cross-junction', 'single-filled-northwest-cross-junction') +
    acceptedSystemGate(ACCEPTED_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE, 'single-filled-southwest-cross-junction', 'single-filled-southwest-cross-junction') +
    acceptedSystemGate(ACCEPTED_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE, 'double-filled-west-cross-junction', 'double-filled-west-cross-junction') +
    acceptedSystemGate(ACCEPTED_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE, 'double-filled-east-cross-junction', 'double-filled-east-cross-junction') +
    acceptedSystemGate(ACCEPTED_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE, 'single-filled-southeast-cross-junction', 'single-filled-southeast-cross-junction') +
    acceptedSystemGate(ACCEPTED_SINGLE_FILLED_CROSS_JUNCTION_GATE, 'single-filled-cross-junction', 'single-filled-cross-junction') +
    acceptedSystemGate(ACCEPTED_OPEN_POCKET_CROSS_JUNCTION_GATE, 'open-pocket-cross-junction', 'open-pocket-cross-junction') +
    acceptedSystemGate(ACCEPTED_HORIZONTAL_PARTIAL_T_JUNCTION_GATE, 'horizontal-partial-t-junction', 'horizontal-partial-t-junction') +
    acceptedSystemGate(ACCEPTED_EAST_PARTIAL_T_JUNCTION_GATE, 'east-partial-t-junction', 'east-partial-t-junction') +
    acceptedSystemGate(ACCEPTED_WEST_PARTIAL_T_JUNCTION_GATE, 'single-filled-pocket-t-junction', 'single-filled-pocket-t-junction') +
    acceptedSystemGate(ACCEPTED_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE, 'horizontal-open-pocket-t-junction', 'horizontal-open-pocket-t-junction') +
    acceptedSystemGate(ACCEPTED_OPEN_POCKET_T_JUNCTION_GATE, 'open-pocket-t-junction', 'open-pocket-t-junction') +
    acceptedSystemGate(ACCEPTED_THICK_WALL_HORIZONTAL_REPEAT_GATE, 'thick-wall-horizontal-repeat', 'thick-wall-horizontal-repeat') +
    acceptedSystemGate(ACCEPTED_THICK_WALL_REPEAT_GATE, 'thick-wall-repeat', 'thick-wall-repeat') +
    acceptedSystemGate(ACCEPTED_THICK_WALL_BLOCK_GATE, 'thick-wall-block', 'thick-wall-block') +
    acceptedSystemGate(ACCEPTED_ISOLATED_SHELL_GATE, 'isolated-shell', 'isolated-shell') +
    acceptedSystemGate(ACCEPTED_VERTICAL_TERMINUS_GATE, 'vertical-terminus', 'vertical-terminus') +
    acceptedSystemGate(ACCEPTED_HORIZONTAL_TERMINUS_GATE, 'terminus', 'terminus') +
    acceptedSystemGate(ACCEPTED_MAPPING_GATE, 'mapping', 'mapping') +
    acceptedSystemGate(ACCEPTED_CORRIDOR_GATE, 'corridor', 'corridor') +
    '<section class="current-section accepted" aria-labelledby="accepted-title"><header class="section-copy"><h2 id="accepted-title">Accepted working set</h2><p>Approved direction references; keep these as the comparison baseline.</p></header>' +
    acceptedBoards + '</section></main>' +
    '<details class="archive"><summary>Archived checkpoints — not current<small>Superseded low-profile comparisons, technical reference controls, and mixed-profile composition gates.</small></summary>' +
    '<div id="archive-status"></div><div class="archive-grid">' + archivedBoards + '</div></details>' +
    '<details class="diagnostics"><summary>Compiler diagnostics — not approval status<small>The strict source inventory remains available for importer debugging.</small></summary>' +
    '<div class="diagnostic-grid">' + diagnostics + '</div></details>' +
    '<script>const stamps={};function resourceUrl(figure){const stem=figure.dataset.previewStem||figure.dataset.stem;const stamp=stamps[figure.dataset.refresh];return `${stem}.png${stamp?`?t=${encodeURIComponent(stamp)}`:""}`;}function setFigureLoaded(figure,loaded){const image=figure.querySelector("img");if(!image)return;if(loaded){image.src=resourceUrl(figure);figure.dataset.loaded=figure.dataset.previewStem?"preview":"true";}else{image.removeAttribute("src");figure.dataset.loaded="false";}const load=figure.querySelector(`[data-action="load"]`);const unload=figure.querySelector(`[data-action="unload"]`);if(load)load.disabled=loaded;if(unload)unload.disabled=!loaded;}document.addEventListener("click",(event)=>{const target=event.target instanceof Element?event.target.closest("button[data-action]"):null;const figure=target?.closest("figure[data-loadable]");if(!target||!figure)return;setFigureLoaded(figure,target.dataset.action==="load");});async function tick(){try{' +
    'const response=await fetch("status.json",{cache:"no-store"});if(!response.ok)throw new Error(`status ${response.status}`);const s=await response.json();' +
    'const status=document.getElementById("status");' +
    'if(!s.ok){status.textContent=`IMPORT FAILED\\n${s.error}`;status.className="bad";}' +
    'else if(s.contextError){status.textContent=`CURRENT PROOF RENDER FAILED\\n${s.contextError}`;status.className="bad";}' +
    'else if(s.roomError){status.textContent=`CURRENT ROOM RENDER FAILED\\n${s.roomError}`;status.className="bad";}' +
    'else{status.textContent=`current proofs ok · ${s.frames} frames validated · ${s.durationMs}ms · ${s.renderedAt}`;status.className="";}' +
    'const archiveStatus=document.getElementById("archive-status");if(s.proofsError){archiveStatus.textContent=`ARCHIVED CROSS-SECTION RENDER FAILED\\n${s.proofsError}`;archiveStatus.className="bad";}else{archiveStatus.textContent="";archiveStatus.className="";}' +
    'const groups={root:s.renderedAt,focus:s.focusRenderedAt,consistency:s.consistencyRenderedAt,"fully-filled-cross-junction":s.fullyFilledCrossJunctionRenderedAt,"single-open-northeast-cross-junction":s.singleOpenNortheastCrossJunctionRenderedAt,"single-open-northwest-cross-junction":s.singleOpenNorthwestCrossJunctionRenderedAt,"single-open-southeast-cross-junction":s.singleOpenSoutheastCrossJunctionRenderedAt,"single-open-southwest-cross-junction":s.singleOpenSouthwestCrossJunctionRenderedAt,"double-filled-south-cross-junction":s.doubleFilledSouthCrossJunctionRenderedAt,"double-filled-opposite-diagonal-cross-junction":s.doubleFilledOppositeDiagonalCrossJunctionRenderedAt,"double-filled-diagonal-cross-junction":s.doubleFilledDiagonalCrossJunctionRenderedAt,"double-filled-north-cross-junction":s.doubleFilledNorthCrossJunctionRenderedAt,"single-filled-northwest-cross-junction":s.singleFilledNorthwestCrossJunctionRenderedAt,"single-filled-southwest-cross-junction":s.singleFilledSouthwestCrossJunctionRenderedAt,"double-filled-west-cross-junction":s.doubleFilledWestCrossJunctionRenderedAt,"double-filled-east-cross-junction":s.doubleFilledEastCrossJunctionRenderedAt,"single-filled-southeast-cross-junction":s.singleFilledSoutheastCrossJunctionRenderedAt,"single-filled-cross-junction":s.singleFilledCrossJunctionRenderedAt,"open-pocket-cross-junction":s.openPocketCrossJunctionRenderedAt,"horizontal-partial-t-junction":s.horizontalPartialTJunctionRenderedAt,"east-partial-t-junction":s.eastPartialTJunctionRenderedAt,"single-filled-pocket-t-junction":s.singleFilledPocketTJunctionRenderedAt,"horizontal-open-pocket-t-junction":s.horizontalOpenPocketTJunctionRenderedAt,"open-pocket-t-junction":s.openPocketTJunctionRenderedAt,"thick-wall-horizontal-repeat":s.thickWallHorizontalRepeatRenderedAt,"thick-wall-repeat":s.thickWallRepeatRenderedAt,"thick-wall-block":s.thickWallBlockRenderedAt,"isolated-shell":s.isolatedShellRenderedAt,"vertical-terminus":s.verticalTerminusRenderedAt,terminus:s.terminusRenderedAt,mapping:s.mappingRenderedAt,corridor:s.corridorRenderedAt,gate:s.gateRenderedAt,proofs:s.proofsRenderedAt,room:s.roomRenderedAt,ladder:s.ladderRenderedAt};' +
    'for(const [group,next] of Object.entries(groups)){if(!next)continue;if(!(group in stamps)){stamps[group]=next;continue;}if(stamps[group]===next)continue;stamps[group]=next;for(const figure of document.querySelectorAll(`[data-refresh="${group}"]`)){const image=figure.querySelector("img");if(image?.hasAttribute("src"))image.src=resourceUrl(figure);}}' +
    '}catch(error){const status=document.getElementById("status");status.textContent=`WORKBENCH STATUS UNAVAILABLE\\n${error instanceof Error?error.message:String(error)}`;status.className="bad";}setTimeout(tick,700)}tick()</script>'
  );
}
