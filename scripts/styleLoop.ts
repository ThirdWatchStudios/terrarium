/**
 * Live authoring workbench for the QuotaCo Building System B pilot.
 *
 *   npm run style:watch            # watch kit, re-render on save, serve bench page
 *   npm run style:once             # single render, no watcher, no server
 *   npm run style:watch -- --input assets/walls/quota-co-building-system --out .style-loop --port 5411
 *
 * Every save re-validates the masters through the real A1b importer and
 * re-renders one card per stem: base / upper / composed plus the composed
 * frame at the close / normal / far review sizes on light and dark ground.
 * The open page is a current-state decision surface: the accepted mask_19
 * single-filled cross-junction first, then accepted mask_15 and horizontal/east/west
 * partial sources, mapping, enclosure, and working-set gates. Historical mixed-profile
 * gates and compiler cards remain available in closed disclosures.
 * Saves under low-profile-correction/ still re-render comparison evidence used
 * inside the current proof sheets.
 * Output is disposable (.style-loop/ is gitignored and kept outside Vite's
 * cleared dist/ build directory); docs/previews remains the
 * reviewed contact-sheet authority via the existing preview scripts.
 */
import { existsSync, watch } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import { A1bAuthoredBImportError, loadA1bAuthoredBFamily } from './highOblique/a1bAuthored';
import { A1A_PALETTE, A1A_REVIEW_SIZES } from './highOblique/a1aProof';
import {
  A1bLowCorrectionImportError,
  loadA1bLowCorrectionFamily,
} from './highOblique/a1bLowProfileCorrection';
import {
  derivePromotedSoutheastSourcePair,
  PROMOTED_EAST_WALL_REUSE,
  PROMOTED_NORTHEAST_CORNER,
  PROMOTED_SOUTHEAST_CORNER,
  PROMOTED_SOUTHWEST_CORNER,
  PROMOTED_SOUTH_WALL_REUSE,
  type EqualHeightWallTransform,
} from './highOblique/equalHeightWallDirection';
import {
  EQUAL_HEIGHT_CORRIDOR_GATE,
  type EqualHeightCorridorCell,
} from './highOblique/equalHeightCorridorGate';
import {
  EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE,
  equalHeightHorizontalTerminusRun,
  type EqualHeightHorizontalTerminusLayer,
} from './highOblique/equalHeightHorizontalTerminusGate';
import {
  compileA1bVerticalTerminusProposalDirectory,
} from './highOblique/a1bVerticalTerminusProposal';
import {
  compileA1bOpenPocketTJunctionProposalDirectory,
} from './highOblique/a1bOpenPocketTJunctionProposal';
import {
  compileA1bHorizontalOpenPocketTJunctionProposalDirectory,
} from './highOblique/a1bHorizontalOpenPocketTJunctionProposal';
import {
  compileA1bWestPartialTJunctionProposalDirectory,
} from './highOblique/a1bWestPartialTJunctionProposal';
import {
  compileA1bHorizontalPartialTJunctionProposalDirectory,
} from './highOblique/a1bHorizontalPartialTJunctionProposal';
import {
  compileA1bOpenPocketCrossJunctionProposalDirectory,
} from './highOblique/a1bOpenPocketCrossJunctionProposal';
import {
  compileA1bSingleFilledCrossJunctionProposalDirectory,
} from './highOblique/a1bSingleFilledCrossJunctionProposal';
import {
  compileA1bIsolatedShellProposalDirectory,
} from './highOblique/a1bIsolatedShellProposal';
import {
  compileA1bThickWallBlockProposalDirectory,
} from './highOblique/a1bThickWallBlockProposal';
import {
  compileA1bThickWallRepeatProposalDirectory,
} from './highOblique/a1bThickWallRepeatProposal';
import {
  compileA1bThickWallHorizontalRepeatProposalDirectory,
} from './highOblique/a1bThickWallHorizontalRepeatProposal';
import {
  EQUAL_HEIGHT_THICK_WALL_BLOCK_GATE,
} from './highOblique/equalHeightThickWallBlockGate';
import {
  EQUAL_HEIGHT_THICK_WALL_REPEAT_GATE,
  type EqualHeightThickWallRepeatCandidate,
} from './highOblique/equalHeightThickWallRepeatGate';
import {
  EQUAL_HEIGHT_THICK_WALL_HORIZONTAL_REPEAT_GATE,
  type EqualHeightThickWallHorizontalRepeatCandidate,
} from './highOblique/equalHeightThickWallHorizontalRepeatGate';
import {
  EQUAL_HEIGHT_ISOLATED_SHELL_GATE,
  type EqualHeightIsolatedShellLayer,
} from './highOblique/equalHeightIsolatedShellGate';
import {
  EQUAL_HEIGHT_VERTICAL_TERMINUS_GATE,
  equalHeightVerticalTerminusMinimumSegment,
  equalHeightVerticalTerminusRun,
  type EqualHeightVerticalTerminusLayer,
  type EqualHeightVerticalTerminusWallSide,
} from './highOblique/equalHeightVerticalTerminusGate';
import {
  EQUAL_HEIGHT_OPEN_POCKET_T_JUNCTION_GATE,
} from './highOblique/equalHeightOpenPocketTJunctionGate';
import {
  EQUAL_HEIGHT_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE,
} from './highOblique/equalHeightHorizontalOpenPocketTJunctionGate';
import {
  EQUAL_HEIGHT_WEST_PARTIAL_T_JUNCTION_GATE,
  type EqualHeightWestPartialTJunctionMask,
} from './highOblique/equalHeightWestPartialTJunctionGate';
import {
  EQUAL_HEIGHT_EAST_PARTIAL_T_JUNCTION_GATE,
  type EqualHeightEastPartialTJunctionMask,
} from './highOblique/equalHeightEastPartialTJunctionGate';
import {
  EQUAL_HEIGHT_HORIZONTAL_PARTIAL_T_JUNCTION_GATE,
  type EqualHeightHorizontalPartialTJunctionMask,
} from './highOblique/equalHeightHorizontalPartialTJunctionGate';
import {
  EQUAL_HEIGHT_OPEN_POCKET_CROSS_JUNCTION_GATE,
} from './highOblique/equalHeightOpenPocketCrossJunctionGate';
import {
  EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE,
} from './highOblique/equalHeightSingleFilledCrossJunctionGate';
import {
  EQUAL_HEIGHT_MASK_LEDGER,
  equalHeightMaskContactDescriptor,
  type EqualHeightMaskLedgerEntry,
  type EqualHeightMaskResolutionKind,
  type EqualHeightMaskSourceVariant,
} from './highOblique/equalHeightMaskLedger';
import {
  A1B_AUTHORED_STEMS,
  a1bAuthoredAtlasDescriptor,
  a1bAuthoredAtlasSvg,
  buildA1bAuthoredFrames,
  type A1bAuthoredAtlasDescriptor,
  type A1bAuthoredFrameKind,
  type A1bAuthoredStem,
} from './highOblique/a1bAuthoredProof';
import { renderStyleWorkbenchPage } from './highOblique/styleWorkbenchPage';

const ATLAS_SCALE = 4;
const CARD_WIDTH = 560;
const CARD_HEIGHT = 536;
const CARD_RENDER_SCALE = 2;
const PANEL = '#F6F1E5';
const INK = '#252A28';
const MUTED = '#606A64';

// Cross-section proofs: throwaway single-file SVGs (literal palette hexes,
// never imported) that live beside the kit directory so the strict importer
// never sees them. They render as their own bench card at the review sizes.
const PROOFS_DIRECTORY_NAME = 'quota-co-building-system-proofs';

const crossSectionProofsDirectory = (input: string): string =>
  path.join(path.dirname(input), PROOFS_DIRECTORY_NAME);

const verticalTerminusProposalDirectory = (input: string): string =>
  path.join(crossSectionProofsDirectory(input), 'vertical-terminus');

const isolatedShellProposalDirectory = (input: string): string =>
  path.join(crossSectionProofsDirectory(input), 'isolated-shell');

const thickWallBlockProposalDirectory = (input: string): string =>
  path.join(crossSectionProofsDirectory(input), 'thick-wall-block');

const thickWallRepeatProposalDirectory = (input: string): string =>
  path.join(crossSectionProofsDirectory(input), 'thick-wall-repeat');

const thickWallHorizontalRepeatProposalDirectory = (input: string): string =>
  path.join(crossSectionProofsDirectory(input), 'thick-wall-horizontal-repeat');

const openPocketTJunctionProposalDirectory = (input: string): string =>
  path.join(crossSectionProofsDirectory(input), 'open-pocket-t-junction');

const horizontalOpenPocketTJunctionProposalDirectory = (input: string): string =>
  path.join(crossSectionProofsDirectory(input), 'horizontal-open-pocket-t-junction');

const westPartialTJunctionProposalDirectory = (input: string): string =>
  path.join(crossSectionProofsDirectory(input), 'west-partial-t-junction');

const horizontalPartialTJunctionProposalDirectory = (input: string): string =>
  path.join(crossSectionProofsDirectory(input), 'horizontal-partial-t-junction');

const openPocketCrossJunctionProposalDirectory = (input: string): string =>
  path.join(crossSectionProofsDirectory(input), 'open-pocket-cross-junction');

const singleFilledCrossJunctionProposalDirectory = (input: string): string =>
  path.join(crossSectionProofsDirectory(input), 'single-filled-cross-junction');

// The distraction-free envelope gate: one closed 3x3 wall section assembled
// only from the structural masters under review. The empty centre cell exposes
// the walkable floor; every base is painted before every upper.
const ENVELOPE_GATE_CELLS: ReadonlyArray<readonly [number, number, string, string | null]> = [
  [0, 0, 'full_exterior_corner-base.svg', 'full_exterior_corner-upper.svg'],
  [1, 0, 'full_n_straight-base.svg', 'full_n_straight-upper.svg'],
  [2, 0, 'transition_n_to_e-base.svg', 'transition_n_to_e-upper.svg'],
  [0, 1, 'full_w_straight-base.svg', 'full_w_straight-upper.svg'],
  [2, 1, 'low-profile-correction/low-e-straight.svg', null],
  [0, 2, 'transition_w_to_s-base.svg', 'transition_w_to_s-upper.svg'],
  [1, 2, PROMOTED_SOUTH_WALL_REUSE.baseFile, PROMOTED_SOUTH_WALL_REUSE.upperFile],
  [2, 2, 'low-profile-correction/low-se-corner.svg', null],
];

// The room-context mock: real masters tiled the way the game composes a room.
// Full N wall + door + NE transition across the top, full W wall down the
// left, the promoted shared full-height horizontal source on S, and the
// remaining low E source. Later promoted southern corners appear as labeled
// legacy controls on this earlier room checkpoint.
const ROOM_CELLS: ReadonlyArray<readonly [number, number, string, string | null]> = [
  [0, 0, 'full_exterior_corner-base.svg', 'full_exterior_corner-upper.svg'],
  [1, 0, 'door_closed-base.svg', 'door_closed-upper.svg'],
  [2, 0, 'transition_n_to_e-base.svg', 'transition_n_to_e-upper.svg'],
  [0, 1, 'full_w_straight-base.svg', 'full_w_straight-upper.svg'],
  [2, 1, 'low-profile-correction/low-e-straight.svg', null],
  [0, 2, 'transition_w_to_s-base.svg', 'transition_w_to_s-upper.svg'],
  [1, 2, PROMOTED_SOUTH_WALL_REUSE.baseFile, PROMOTED_SOUTH_WALL_REUSE.upperFile],
  [2, 2, 'low-profile-correction/low-se-corner.svg', null],
];

type CompositionCell = readonly [
  number,
  number,
  string,
  string | null,
  EqualHeightWallTransform?,
];
type CompositionFileOverrides = Readonly<Record<string, string>>;

// Promotion replaces the old full-to-low W-to-S sources in the canonical
// nine-stem strip. Keep the superseded pair only as a virtual A/B control on
// the workbench; the accepted equal-height board always reads the real files.
const LEGACY_LOW_SOUTHWEST_BASE_FILE = '__proof__/legacy-low-southwest-base.svg';
const LEGACY_LOW_SOUTHWEST_UPPER_FILE = '__proof__/legacy-low-southwest-upper.svg';
const SOUTHEAST_WORKBENCH_BASE_FILE = '__proof__/promoted-southeast-base.svg';
const SOUTHEAST_WORKBENCH_UPPER_FILE = '__proof__/promoted-southeast-upper.svg';
const THICK_WALL_SOUTHEAST_BASE_FILE = '__proof__/filled-southeast-base.svg';
const THICK_WALL_SOUTHEAST_UPPER_FILE = '__proof__/filled-southeast-upper.svg';
const OPEN_POCKET_T_JUNCTION_EAST_BASE_FILE = '__proof__/open-east-t-junction-base.svg';
const OPEN_POCKET_T_JUNCTION_EAST_UPPER_FILE = '__proof__/open-east-t-junction-upper.svg';
const EAST_PARTIAL_T_JUNCTION_FILTERED_BASE_FILE =
  '__proof__/open-east-t-filled-nw-base.svg';
const EAST_PARTIAL_T_JUNCTION_FILTERED_UPPER_FILE =
  '__proof__/open-east-t-filled-nw-upper.svg';
const HORIZONTAL_PARTIAL_T_JUNCTION_FILTERED_BASE_FILE =
  '__proof__/open-south-t-filled-nw-base.svg';
const HORIZONTAL_PARTIAL_T_JUNCTION_FILTERED_UPPER_FILE =
  '__proof__/open-south-t-filled-nw-upper.svg';
const EMPTY_WORKBENCH_FILE = '__proof__/empty.svg';
const EMPTY_WORKBENCH_SOURCE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128"></svg>';
const SOUTHWEST_REVIEW_FILE_OVERRIDES: CompositionFileOverrides = {
  [LEGACY_LOW_SOUTHWEST_BASE_FILE]: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <title>QuotaCo legacy west-to-low-south transition base</title>
  <desc>Superseded comparison source retained only for the equal-height promotion board.</desc>
  <g id="detail/base">
    <path id="base-contour" d="M56 0V110A10 10 0 0 0 66 120H128V82A8 8 0 0 1 120 74V0Z" fill="#252A28"/>
    <path id="base-shell" d="M58 0V110A8 8 0 0 0 66 118H128V84A10 10 0 0 1 118 74V0Z" fill="#D9D0B9"/>
    <path id="base-contact-shade" d="M120 0H123.5V74H120Z M66 120H128V123.5H66Z" fill="#000000" opacity="0.12"/>
  </g>
</svg>`,
  [LEGACY_LOW_SOUTHWEST_UPPER_FILE]: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <title>QuotaCo legacy west-to-low-south transition upper</title>
  <desc>Superseded comparison source retained only for the equal-height promotion board.</desc>
  <g id="detail/upper">
    <path id="upper-west-plane-light" d="M58 0H90.5V76A12 12 0 0 0 102.5 88H58Z" fill="#FFFFFF" opacity="0.18"/>
    <path id="upper-west-coping-lip" d="M90.5 0H92V76H90.5Z" fill="#FFFFFF" opacity="0.30"/>
    <path id="upper-west-coral-turn" d="M97 0H102V89A8 8 0 0 0 110 97H128V102H110A13 13 0 0 1 97 89Z" fill="#B65F4D"/>
    <path id="upper-west-green-turn" d="M102 0H117V96A6 6 0 0 0 123 102H128V117H123A21 21 0 0 1 102 96Z" fill="#294B3C"/>
    <path id="upper-west-face-shade" d="M92 0H117V82H102V84H92Z" fill="#000000" opacity="0.12"/>
    <path id="upper-west-plinth" d="M117 0H120V82H117Z" fill="#252A28"/>
    <path id="upper-south-cream-wrap" d="M58 84H128V97H58Z" fill="#D9D0B9"/>
    <path id="upper-south-reveal-light" d="M58 84H128V88H62A4 4 0 0 1 58 84Z" fill="#FFFFFF" opacity="0.30"/>
    <path id="upper-south-coral-wrap" d="M58 97H128V102H63A5 5 0 0 1 58 97Z" fill="#B65F4D"/>
    <path id="upper-south-band-light" d="M58 97H128V98.5H59.5A1.5 1.5 0 0 1 58 97Z" fill="#FFFFFF" opacity="0.10"/>
    <path id="upper-south-green-wrap" d="M58 102H128V117H66A8 8 0 0 1 58 109Z" fill="#294B3C"/>
    <path id="upper-south-plinth" d="M66 117H128V120H66Z" fill="#252A28"/>
    <path id="upper-arris-seam" d="M92 1V76A12 12 0 0 0 104 88H127" fill="none" stroke="#252A28" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.45"/>
    <path id="upper-west-band-seam" d="M102 1V83" fill="none" stroke="#252A28" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.35"/>
    <path id="upper-south-band-seam" d="M63 102H127" fill="none" stroke="#252A28" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.35"/>
  </g>
</svg>`,
};

// Retained only as the before-state on the promoted south decision board.
const LEGACY_LOW_SOUTH_ROOM_CELLS: ReadonlyArray<CompositionCell> = [
  [0, 0, 'full_exterior_corner-base.svg', 'full_exterior_corner-upper.svg'],
  [1, 0, 'door_closed-base.svg', 'door_closed-upper.svg'],
  [2, 0, 'transition_n_to_e-base.svg', 'transition_n_to_e-upper.svg'],
  [0, 1, 'full_w_straight-base.svg', 'full_w_straight-upper.svg'],
  [2, 1, 'low-profile-correction/low-e-straight.svg', null],
  [0, 2, LEGACY_LOW_SOUTHWEST_BASE_FILE, LEGACY_LOW_SOUTHWEST_UPPER_FILE],
  [1, 2, 'low-profile-correction/low-s-straight.svg', null],
  [2, 2, 'low-profile-correction/low-se-corner.svg', null],
];

const FULL_HEIGHT_EAST_ROOM_CELLS: ReadonlyArray<CompositionCell> = [
  [0, 0, 'full_exterior_corner-base.svg', 'full_exterior_corner-upper.svg'],
  [1, 0, 'door_closed-base.svg', 'door_closed-upper.svg'],
  [2, 0, 'transition_n_to_e-base.svg', 'transition_n_to_e-upper.svg'],
  [0, 1, 'full_w_straight-base.svg', 'full_w_straight-upper.svg'],
  [
    2,
    1,
    PROMOTED_EAST_WALL_REUSE.baseFile,
    PROMOTED_EAST_WALL_REUSE.upperFile,
    'mirror-x',
  ],
  [0, 2, 'transition_w_to_s-base.svg', 'transition_w_to_s-upper.svg'],
  [1, 2, PROMOTED_SOUTH_WALL_REUSE.baseFile, PROMOTED_SOUTH_WALL_REUSE.upperFile],
  [2, 2, 'low-profile-correction/low-se-corner.svg', null],
];

const FULL_HEIGHT_NORTHEAST_ROOM_CELLS: ReadonlyArray<CompositionCell> = [
  [0, 0, 'full_exterior_corner-base.svg', 'full_exterior_corner-upper.svg'],
  [1, 0, 'door_closed-base.svg', 'door_closed-upper.svg'],
  [
    2,
    0,
    PROMOTED_NORTHEAST_CORNER.baseFile,
    PROMOTED_NORTHEAST_CORNER.upperFile,
    PROMOTED_NORTHEAST_CORNER.transform,
  ],
  [0, 1, 'full_w_straight-base.svg', 'full_w_straight-upper.svg'],
  [
    2,
    1,
    PROMOTED_EAST_WALL_REUSE.baseFile,
    PROMOTED_EAST_WALL_REUSE.upperFile,
    PROMOTED_EAST_WALL_REUSE.transform,
  ],
  [0, 2, 'transition_w_to_s-base.svg', 'transition_w_to_s-upper.svg'],
  [1, 2, PROMOTED_SOUTH_WALL_REUSE.baseFile, PROMOTED_SOUTH_WALL_REUSE.upperFile],
  [2, 2, 'low-profile-correction/low-se-corner.svg', null],
];

// Installed context for the promoted source board: every previously reviewed
// equal-height substitution remains in place, southwest reads from the
// canonical accepted pair; southeast remains a labeled legacy control on this
// southwest checkpoint and is promoted on its own following board.
const FULL_HEIGHT_SOUTHWEST_ROOM_CELLS: ReadonlyArray<CompositionCell> = [
  [0, 0, 'full_exterior_corner-base.svg', 'full_exterior_corner-upper.svg'],
  [1, 0, 'door_closed-base.svg', 'door_closed-upper.svg'],
  [
    2,
    0,
    PROMOTED_NORTHEAST_CORNER.baseFile,
    PROMOTED_NORTHEAST_CORNER.upperFile,
    PROMOTED_NORTHEAST_CORNER.transform,
  ],
  [0, 1, 'full_w_straight-base.svg', 'full_w_straight-upper.svg'],
  [
    2,
    1,
    PROMOTED_EAST_WALL_REUSE.baseFile,
    PROMOTED_EAST_WALL_REUSE.upperFile,
    PROMOTED_EAST_WALL_REUSE.transform,
  ],
  [
    0,
    2,
    PROMOTED_SOUTHWEST_CORNER.baseFile,
    PROMOTED_SOUTHWEST_CORNER.upperFile,
    PROMOTED_SOUTHWEST_CORNER.transform,
  ],
  [1, 2, PROMOTED_SOUTH_WALL_REUSE.baseFile, PROMOTED_SOUTH_WALL_REUSE.upperFile],
  [2, 2, 'low-profile-correction/low-se-corner.svg', null],
];

// Completed equal-height room used on the promoted southeast review board. A
// workbench alias materializes the accepted detail filter, while provenance
// remains the canonical southwest source pair and registration stays unchanged.
const PROMOTED_SOUTHEAST_ROOM_CELLS: ReadonlyArray<CompositionCell> = [
  [0, 0, 'full_exterior_corner-base.svg', 'full_exterior_corner-upper.svg'],
  [1, 0, 'door_closed-base.svg', 'door_closed-upper.svg'],
  [
    2,
    0,
    PROMOTED_NORTHEAST_CORNER.baseFile,
    PROMOTED_NORTHEAST_CORNER.upperFile,
    PROMOTED_NORTHEAST_CORNER.transform,
  ],
  [0, 1, 'full_w_straight-base.svg', 'full_w_straight-upper.svg'],
  [
    2,
    1,
    PROMOTED_EAST_WALL_REUSE.baseFile,
    PROMOTED_EAST_WALL_REUSE.upperFile,
    PROMOTED_EAST_WALL_REUSE.transform,
  ],
  [
    0,
    2,
    PROMOTED_SOUTHWEST_CORNER.baseFile,
    PROMOTED_SOUTHWEST_CORNER.upperFile,
    PROMOTED_SOUTHWEST_CORNER.transform,
  ],
  [1, 2, PROMOTED_SOUTH_WALL_REUSE.baseFile, PROMOTED_SOUTH_WALL_REUSE.upperFile],
  [
    2,
    2,
    SOUTHEAST_WORKBENCH_BASE_FILE,
    SOUTHEAST_WORKBENCH_UPPER_FILE,
    PROMOTED_SOUTHEAST_CORNER.transform,
  ],
];

const corridorCompositionCell = (cell: EqualHeightCorridorCell): CompositionCell => [
  cell.col,
  cell.row,
  cell.derivation === 'accepted-southeast-seam-filter'
    ? SOUTHEAST_WORKBENCH_BASE_FILE
    : cell.baseFile,
  cell.derivation === 'accepted-southeast-seam-filter'
    ? SOUTHEAST_WORKBENCH_UPPER_FILE
    : cell.upperFile,
  cell.transform,
];

const EQUAL_HEIGHT_CORRIDOR_CELLS: ReadonlyArray<CompositionCell> =
  EQUAL_HEIGHT_CORRIDOR_GATE.cells.map(corridorCompositionCell);

type CorridorJoin = 'northwest' | 'northeast' | 'southwest' | 'southeast';

function corridorGateCell(
  role: EqualHeightCorridorCell['role'],
  row?: number,
): EqualHeightCorridorCell {
  const cell = EQUAL_HEIGHT_CORRIDOR_GATE.cells.find(
    (candidate) => candidate.role === role && (row === undefined || candidate.row === row),
  );
  if (!cell) throw new Error(`Missing ${role} cell in equal-height corridor gate`);
  return cell;
}

function corridorJoinCells(join: CorridorJoin): ReadonlyArray<CompositionCell> {
  const configurations: Readonly<Record<CorridorJoin, {
    readonly colOffset: number;
    readonly rowOffset: number;
    readonly cells: readonly EqualHeightCorridorCell[];
  }>> = {
    northwest: {
      colOffset: 0,
      rowOffset: 0,
      cells: [
        corridorGateCell('northwest-corner'),
        corridorGateCell('north-wall'),
        corridorGateCell('west-wall', 1),
      ],
    },
    northeast: {
      colOffset: 1,
      rowOffset: 0,
      cells: [
        corridorGateCell('north-wall'),
        corridorGateCell('northeast-corner'),
        corridorGateCell('east-wall', 1),
      ],
    },
    southwest: {
      colOffset: 0,
      rowOffset: 6,
      cells: [
        corridorGateCell('west-wall', 6),
        corridorGateCell('southwest-corner'),
        corridorGateCell('south-wall'),
      ],
    },
    southeast: {
      colOffset: 1,
      rowOffset: 6,
      cells: [
        corridorGateCell('east-wall', 6),
        corridorGateCell('south-wall'),
        corridorGateCell('southeast-corner'),
      ],
    },
  };
  const configuration = configurations[join];
  return configuration.cells.map((cell) => {
    const composition = corridorCompositionCell(cell);
    return [
      composition[0] - configuration.colOffset,
      composition[1] - configuration.rowOffset,
      composition[2],
      composition[3],
      composition[4],
    ];
  });
}

const TRANSITION_W_TO_S_CELL: ReadonlyArray<CompositionCell> = [
  [0, 0, LEGACY_LOW_SOUTHWEST_BASE_FILE, LEGACY_LOW_SOUTHWEST_UPPER_FILE],
];

// A minimum closed room deliberately made only from junction pieces. It makes
// oversized corner and transition silhouettes impossible to hide behind long
// straight runs.
const COMPACT_CORNER_ROOM_CELLS: ReadonlyArray<CompositionCell> = [
  [0, 0, 'full_exterior_corner-base.svg', 'full_exterior_corner-upper.svg'],
  [1, 0, 'transition_n_to_e-base.svg', 'transition_n_to_e-upper.svg'],
  [0, 1, 'transition_w_to_s-base.svg', 'transition_w_to_s-upper.svg'],
  [1, 1, 'low-profile-correction/low-se-corner.svg', null],
];

// A one-cell-clear corridor: four repeated side-wall bodies bracketed by the
// current authored corners. South uses the promoted full-height source while
// east remains the next proof target.
const NARROW_CORRIDOR_CELLS: ReadonlyArray<CompositionCell> = [
  [0, 0, 'full_exterior_corner-base.svg', 'full_exterior_corner-upper.svg'],
  [1, 0, 'full_n_straight-base.svg', 'full_n_straight-upper.svg'],
  [2, 0, 'transition_n_to_e-base.svg', 'transition_n_to_e-upper.svg'],
  [0, 1, 'full_w_straight-base.svg', 'full_w_straight-upper.svg'],
  [2, 1, 'low-profile-correction/low-e-straight.svg', null],
  [0, 2, 'full_w_straight-base.svg', 'full_w_straight-upper.svg'],
  [2, 2, 'low-profile-correction/low-e-straight.svg', null],
  [0, 3, 'full_w_straight-base.svg', 'full_w_straight-upper.svg'],
  [2, 3, 'low-profile-correction/low-e-straight.svg', null],
  [0, 4, 'full_w_straight-base.svg', 'full_w_straight-upper.svg'],
  [2, 4, 'low-profile-correction/low-e-straight.svg', null],
  [0, 5, 'transition_w_to_s-base.svg', 'transition_w_to_s-upper.svg'],
  [1, 5, PROMOTED_SOUTH_WALL_REUSE.baseFile, PROMOTED_SOUTH_WALL_REUSE.upperFile],
  [2, 5, 'low-profile-correction/low-se-corner.svg', null],
];

const LENGTH_LADDER_RUNS = [1, 2, 3, 6] as const;

interface CliOptions {
  readonly input: string;
  readonly output: string;
  readonly once: boolean;
  readonly port: number;
}

function parseArgs(args: string[], root: string): CliOptions {
  let input = path.join(root, 'assets/walls/quota-co-building-system');
  let output = path.join(root, '.style-loop');
  let once = false;
  let port = 5411;
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === '--once') {
      once = true;
      continue;
    }
    if (argument !== '--input' && argument !== '--out' && argument !== '--port') {
      throw new Error(`Unknown argument ${argument}`);
    }
    const value = args[++index];
    if (!value) throw new Error(`${argument} requires a value`);
    if (argument === '--input') input = path.resolve(root, value);
    else if (argument === '--out') output = path.resolve(root, value);
    else port = Number.parseInt(value, 10);
  }
  return { input, output, once, port };
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
  size = 13,
  weight = 500,
  color = INK,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return (
    `<text x="${x}" y="${y}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" ` +
    `font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">` +
    `${escapeText(value)}</text>`
  );
}

function window_(
  atlas: A1bAuthoredAtlasDescriptor,
  stem: A1bAuthoredStem,
  kind: A1bAuthoredFrameKind,
  x: number,
  y: number,
  size: number,
  checkerBacked = true,
): string {
  const frame = atlas.frames[`b_${stem}_${kind}`];
  const backing = checkerBacked
    ? `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="6" fill="url(#checker)"/>`
    : '';
  return (
    backing +
    `<svg x="${x}" y="${y}" width="${size}" height="${size}" ` +
    `viewBox="${frame.x} ${frame.y} ${frame.w} ${frame.h}" preserveAspectRatio="none">` +
    '<use href="#atlasPixels"/>' +
    '</svg>'
  );
}

function stemCard(atlas: A1bAuthoredAtlasDescriptor, atlasUri: string, stem: A1bAuthoredStem): string {
  const parts: string[] = [
    `<defs><pattern id="checker" width="16" height="16" patternUnits="userSpaceOnUse">` +
      '<rect width="16" height="16" fill="#B9B9B2"/>' +
      '<rect width="8" height="8" fill="#D6D5CC"/><rect x="8" y="8" width="8" height="8" fill="#D6D5CC"/>' +
      `</pattern><image id="atlasPixels" x="0" y="0" width="${atlas.width}" height="${atlas.height}" ` +
      `href="${atlasUri}" image-rendering="auto"/></defs>`,
    `<rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="14" fill="${PANEL}"/>`,
  ];
  parts.push(text(20, 32, stem.replaceAll('_', ' '), 19, 750));
  parts.push(text(20, 49, `${stem}-base.svg + ${stem}-upper.svg`, 10, 500, MUTED));
  parts.push(text(CARD_WIDTH - 20, 32, 'compiled through the real importer', 11, 500, MUTED, 'end'));

  for (const [index, kind] of (['base', 'upper', 'composed'] as const).entries()) {
    const x = 20 + index * 185;
    parts.push(window_(atlas, stem, kind, x, 64, 150));
    parts.push(text(x + 75, 232, kind.toUpperCase(), 11, 800, kind === 'composed' ? A1A_PALETTE.green : MUTED, 'middle'));
  }

  parts.push(text(20, 256, 'distance proof — composed', 12, 750, MUTED));
  parts.push(window_(atlas, stem, 'composed', 20, 266, A1A_REVIEW_SIZES.close));
  parts.push(text(20 + A1A_REVIEW_SIZES.close / 2, 522, `${A1A_REVIEW_SIZES.close}px close`, 10, 650, MUTED, 'middle'));

  parts.push(window_(atlas, stem, 'composed', 290, 266, A1A_REVIEW_SIZES.normal));
  parts.push(text(290 + A1A_REVIEW_SIZES.normal / 2, 372, `${A1A_REVIEW_SIZES.normal}px`, 10, 650, MUTED, 'middle'));
  parts.push(window_(atlas, stem, 'composed', 290, 384, A1A_REVIEW_SIZES.far));
  parts.push(text(290 + A1A_REVIEW_SIZES.far / 2, 442, `${A1A_REVIEW_SIZES.far}px`, 10, 650, MUTED, 'middle'));

  parts.push(`<rect x="404" y="266" width="136" height="240" rx="10" fill="${A1A_PALETTE.charcoal}"/>`);
  parts.push(window_(atlas, stem, 'composed', 427, 280, A1A_REVIEW_SIZES.normal, false));
  parts.push(window_(atlas, stem, 'composed', 427, 384, A1A_REVIEW_SIZES.far, false));
  parts.push(text(472, 442, 'dark ground', 10, 650, '#A59E8F', 'middle'));
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" ` +
    `viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">${parts.join('')}</svg>`
  );
}

function benchPage(): string {
  return renderStyleWorkbenchPage(A1B_AUTHORED_STEMS);
}

async function render(
  options: CliOptions,
  root: string,
  stems: readonly A1bAuthoredStem[] = A1B_AUTHORED_STEMS,
): Promise<void> {
  const started = Date.now();
  const sourcePathPrefix = path.relative(root, options.input).replaceAll(path.sep, '/');
  const family = await loadA1bAuthoredBFamily({ inputDir: options.input, sourcePathPrefix });
  const frames = buildA1bAuthoredFrames(family.components);
  const atlas = a1bAuthoredAtlasDescriptor(frames, ATLAS_SCALE);
  const atlasPng = new Resvg(a1bAuthoredAtlasSvg(frames, ATLAS_SCALE)).render().asPng();
  const atlasUri = `data:image/png;base64,${Buffer.from(atlasPng).toString('base64')}`;

  await mkdir(options.output, { recursive: true });
  for (const stem of stems) {
    const png = new Resvg(stemCard(atlas, atlasUri, stem), {
      fitTo: { mode: 'width', value: CARD_WIDTH * CARD_RENDER_SCALE },
    }).render().asPng();
    await writeFile(path.join(options.output, `${stem}.png`), png);
  }
  await renderEnvelopeGate(options);
  await renderRoomMock(options);
  await renderFullHeightSouthProof(options);
  await renderLengthLadder(options);
  await renderTransitionWestSouthFocus(options, root);
  await renderFullHeightEastMirrorProof(options);
  await renderFullHeightNortheastProof(options);
  await renderFullHeightSouthwestProof(options);
  await renderFullHeightSoutheastProof(options);
  await renderEqualHeightCorridorGate(options);
  await renderEqualHeightSingleFilledCrossJunctionGate(options, root);
  await renderEqualHeightOpenPocketCrossJunctionGate(options, root);
  await renderEqualHeightHorizontalPartialTJunctionGate(options, root);
  await renderEqualHeightEastPartialTJunctionGate(options, root);
  await renderEqualHeightWestPartialTJunctionGate(options, root);
  await renderEqualHeightHorizontalOpenPocketTJunctionGate(options, root);
  await renderEqualHeightOpenPocketTJunctionGate(options, root);
  await renderEqualHeightThickWallHorizontalRepeatGate(options, root);
  await renderEqualHeightThickWallRepeatGate(options, root);
  await renderEqualHeightThickWallBlockGate(options, root);
  await renderEqualHeightIsolatedShellGate(options, root);
  await renderEqualHeightVerticalTerminusGate(options, root);
  await renderEqualHeightHorizontalTerminusGate(options);
  await renderEqualHeightMaskLedger(options, root);
  await renderLowSoutheastCornerFocus(options, root);
  const renderedAt = new Date().toISOString();
  const status = {
    ok: true,
    frames: frames.length,
    durationMs: Date.now() - started,
    renderedAt,
    gateRenderedAt: renderedAt,
    roomRenderedAt: renderedAt,
    ladderRenderedAt: renderedAt,
    focusRenderedAt: renderedAt,
    singleFilledCrossJunctionRenderedAt: renderedAt,
    openPocketCrossJunctionRenderedAt: renderedAt,
    horizontalPartialTJunctionRenderedAt: renderedAt,
    eastPartialTJunctionRenderedAt: renderedAt,
    singleFilledPocketTJunctionRenderedAt: renderedAt,
    horizontalOpenPocketTJunctionRenderedAt: renderedAt,
    openPocketTJunctionRenderedAt: renderedAt,
    thickWallHorizontalRepeatRenderedAt: renderedAt,
    thickWallRepeatRenderedAt: renderedAt,
    thickWallBlockRenderedAt: renderedAt,
    isolatedShellRenderedAt: renderedAt,
    verticalTerminusRenderedAt: renderedAt,
    terminusRenderedAt: renderedAt,
    mappingRenderedAt: renderedAt,
    corridorRenderedAt: renderedAt,
  };
  await writeFile(path.join(options.output, 'status.json'), `${JSON.stringify(status)}\n`, 'utf8');
  await writeFile(path.join(options.output, 'index.html'), benchPage(), 'utf8');
  process.stdout.write(`rendered ${stems.length} card${stems.length === 1 ? '' : 's'} (${frames.length} frames validated) in ${status.durationMs}ms\n`);
}

const stripSvgShell = (svg: string): string =>
  svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

async function southeastReviewFileOverrides(
  options: CliOptions,
): Promise<CompositionFileOverrides> {
  const [baseSource, upperSource] = await Promise.all([
    readFile(
      path.join(options.input, PROMOTED_SOUTHEAST_CORNER.baseFile),
      'utf8',
    ),
    readFile(
      path.join(options.input, PROMOTED_SOUTHEAST_CORNER.upperFile),
      'utf8',
    ),
  ]);
  const derived = derivePromotedSoutheastSourcePair(baseSource, upperSource);
  return {
    [SOUTHEAST_WORKBENCH_BASE_FILE]: derived.baseSource,
    [SOUTHEAST_WORKBENCH_UPPER_FILE]: derived.upperSource,
  };
}

async function verticalTerminusProposalFileOverrides(
  options: CliOptions,
  root: string,
): Promise<CompositionFileOverrides> {
  const directory = verticalTerminusProposalDirectory(options.input);
  const compiled = await compileA1bVerticalTerminusProposalDirectory({
    inputDir: directory,
    sourcePathPrefix: path.relative(root, directory).replaceAll(path.sep, '/'),
  });
  return Object.fromEntries([
    [EMPTY_WORKBENCH_FILE, EMPTY_WORKBENCH_SOURCE],
    ...compiled.map(({ filename, content }) => [filename, content] as const),
  ]);
}

async function isolatedShellProposalFileOverrides(
  options: CliOptions,
  root: string,
): Promise<CompositionFileOverrides> {
  const directory = isolatedShellProposalDirectory(options.input);
  const compiled = await compileA1bIsolatedShellProposalDirectory({
    inputDir: directory,
    sourcePathPrefix: path.relative(root, directory).replaceAll(path.sep, '/'),
  });
  return Object.fromEntries([
    [EMPTY_WORKBENCH_FILE, EMPTY_WORKBENCH_SOURCE],
    ...compiled.map(({ filename, content }) => [filename, content] as const),
  ]);
}

async function thickWallBlockProposalFileOverrides(
  options: CliOptions,
  root: string,
): Promise<CompositionFileOverrides> {
  const directory = thickWallBlockProposalDirectory(options.input);
  const compiled = await compileA1bThickWallBlockProposalDirectory({
    inputDir: directory,
    sourcePathPrefix: path.relative(root, directory).replaceAll(path.sep, '/'),
  });
  const byFilename = new Map(compiled.map((source) => [source.filename, source] as const));
  const foregroundBase = byFilename.get('filled_sw_elbow-base.svg');
  const foregroundUpper = byFilename.get('filled_sw_elbow-upper.svg');
  if (!foregroundBase || !foregroundUpper) {
    throw new Error('Thick-wall proposal compiler omitted the foreground source pair');
  }
  const southeast = derivePromotedSoutheastSourcePair(
    foregroundBase.content,
    foregroundUpper.content,
  );
  return Object.fromEntries([
    ...compiled.map(({ filename, content }) => [filename, content] as const),
    [THICK_WALL_SOUTHEAST_BASE_FILE, southeast.baseSource],
    [THICK_WALL_SOUTHEAST_UPPER_FILE, southeast.upperSource],
  ]);
}

async function thickWallRepeatProposalFileOverrides(
  options: CliOptions,
  root: string,
): Promise<CompositionFileOverrides> {
  const directory = thickWallRepeatProposalDirectory(options.input);
  const compiled = await compileA1bThickWallRepeatProposalDirectory({
    inputDir: directory,
    sourcePathPrefix: path.relative(root, directory).replaceAll(path.sep, '/'),
  });
  return Object.fromEntries(
    compiled.map(({ filename, content }) => [filename, content] as const),
  );
}

async function thickWallHorizontalRepeatProposalFileOverrides(
  options: CliOptions,
  root: string,
): Promise<CompositionFileOverrides> {
  const directory = thickWallHorizontalRepeatProposalDirectory(options.input);
  const compiled = await compileA1bThickWallHorizontalRepeatProposalDirectory({
    inputDir: directory,
    sourcePathPrefix: path.relative(root, directory).replaceAll(path.sep, '/'),
  });
  return Object.fromEntries(
    compiled.map(({ filename, content }) => [filename, content] as const),
  );
}

async function openPocketTJunctionProposalFileOverrides(
  options: CliOptions,
  root: string,
): Promise<CompositionFileOverrides> {
  const directory = openPocketTJunctionProposalDirectory(options.input);
  const compiled = await compileA1bOpenPocketTJunctionProposalDirectory({
    inputDir: directory,
    sourcePathPrefix: path.relative(root, directory).replaceAll(path.sep, '/'),
  });
  const byFilename = new Map(compiled.map((source) => [source.filename, source] as const));
  const base = byFilename.get('open_w_t_junction-base.svg');
  const upper = byFilename.get('open_w_t_junction-upper.svg');
  if (!base || !upper) {
    throw new Error('Open-pocket T-junction proposal compiler omitted its source pair');
  }
  const east = derivePromotedSoutheastSourcePair(base.content, upper.content);
  return Object.fromEntries([
    [EMPTY_WORKBENCH_FILE, EMPTY_WORKBENCH_SOURCE],
    ...compiled.map(({ filename, content }) => [filename, content] as const),
    [OPEN_POCKET_T_JUNCTION_EAST_BASE_FILE, east.baseSource],
    [OPEN_POCKET_T_JUNCTION_EAST_UPPER_FILE, east.upperSource],
  ]);
}

async function horizontalOpenPocketTJunctionProposalFileOverrides(
  options: CliOptions,
  root: string,
): Promise<CompositionFileOverrides> {
  const directory = horizontalOpenPocketTJunctionProposalDirectory(options.input);
  const compiled = await compileA1bHorizontalOpenPocketTJunctionProposalDirectory({
    inputDir: directory,
    sourcePathPrefix: path.relative(root, directory).replaceAll(path.sep, '/'),
  });
  return Object.fromEntries([
    [EMPTY_WORKBENCH_FILE, EMPTY_WORKBENCH_SOURCE],
    ...compiled.map(({ filename, content }) => [filename, content] as const),
  ]);
}

async function westPartialTJunctionProposalFileOverrides(
  options: CliOptions,
  root: string,
): Promise<CompositionFileOverrides> {
  const directory = westPartialTJunctionProposalDirectory(options.input);
  const compiled = await compileA1bWestPartialTJunctionProposalDirectory({
    inputDir: directory,
    sourcePathPrefix: path.relative(root, directory).replaceAll(path.sep, '/'),
  });
  return Object.fromEntries([
    [EMPTY_WORKBENCH_FILE, EMPTY_WORKBENCH_SOURCE],
    ...compiled.map(({ filename, content }) => [filename, content] as const),
  ]);
}

async function eastPartialTJunctionGateFileOverrides(
  options: CliOptions,
  root: string,
): Promise<CompositionFileOverrides> {
  const sourceOverrides = await westPartialTJunctionProposalFileOverrides(options, root);
  const foregroundBase = sourceOverrides['open_w_t_filled_ne-base.svg'];
  const foregroundUpper = sourceOverrides['open_w_t_filled_ne-upper.svg'];
  if (!foregroundBase || !foregroundUpper) {
    throw new Error('West partial T-junction source bank omitted the mask_17 pair');
  }
  const filtered = derivePromotedSoutheastSourcePair(
    foregroundBase,
    foregroundUpper,
  );
  return {
    ...sourceOverrides,
    [EAST_PARTIAL_T_JUNCTION_FILTERED_BASE_FILE]: filtered.baseSource,
    [EAST_PARTIAL_T_JUNCTION_FILTERED_UPPER_FILE]: filtered.upperSource,
  };
}

async function horizontalPartialTJunctionProposalFileOverrides(
  options: CliOptions,
  root: string,
): Promise<CompositionFileOverrides> {
  const directory = horizontalPartialTJunctionProposalDirectory(options.input);
  const compiled = await compileA1bHorizontalPartialTJunctionProposalDirectory({
    inputDir: directory,
    sourcePathPrefix: path.relative(root, directory).replaceAll(path.sep, '/'),
  });
  const byFilename = new Map(compiled.map((source) => [source.filename, source] as const));
  const foregroundBase = byFilename.get('open_s_t_filled_ne-base.svg');
  const foregroundUpper = byFilename.get('open_s_t_filled_ne-upper.svg');
  if (!foregroundBase || !foregroundUpper) {
    throw new Error('Horizontal partial T-junction compiler omitted the mask_18 pair');
  }
  const filtered = derivePromotedSoutheastSourcePair(
    foregroundBase.content,
    foregroundUpper.content,
  );
  return Object.fromEntries([
    [EMPTY_WORKBENCH_FILE, EMPTY_WORKBENCH_SOURCE],
    ...compiled.map(({ filename, content }) => [filename, content] as const),
    [HORIZONTAL_PARTIAL_T_JUNCTION_FILTERED_BASE_FILE, filtered.baseSource],
    [HORIZONTAL_PARTIAL_T_JUNCTION_FILTERED_UPPER_FILE, filtered.upperSource],
  ]);
}

async function openPocketCrossJunctionProposalFileOverrides(
  options: CliOptions,
  root: string,
): Promise<CompositionFileOverrides> {
  const directory = openPocketCrossJunctionProposalDirectory(options.input);
  const compiled = await compileA1bOpenPocketCrossJunctionProposalDirectory({
    inputDir: directory,
    sourcePathPrefix: path.relative(root, directory).replaceAll(path.sep, '/'),
  });
  return Object.fromEntries([
    [EMPTY_WORKBENCH_FILE, EMPTY_WORKBENCH_SOURCE],
    ...compiled.map(({ filename, content }) => [filename, content] as const),
  ]);
}

async function singleFilledCrossJunctionProposalFileOverrides(
  options: CliOptions,
  root: string,
): Promise<CompositionFileOverrides> {
  const directory = singleFilledCrossJunctionProposalDirectory(options.input);
  const compiled = await compileA1bSingleFilledCrossJunctionProposalDirectory({
    inputDir: directory,
    sourcePathPrefix: path.relative(root, directory).replaceAll(path.sep, '/'),
  });
  return Object.fromEntries([
    [EMPTY_WORKBENCH_FILE, EMPTY_WORKBENCH_SOURCE],
    ...compiled.map(({ filename, content }) => [filename, content] as const),
  ]);
}

const transformCellContent = (
  content: string,
  transform: EqualHeightWallTransform = 'none',
): string => transform === 'mirror-x'
  ? `<g transform="matrix(-1 0 0 1 128 0)">${content}</g>`
  : content;

const roomCell = (
  content: string,
  col: number,
  row: number,
  transform: EqualHeightWallTransform = 'none',
): string =>
  `<svg x="${col * 128}" y="${row * 128}" width="128" height="128" viewBox="0 0 128 128">` +
  transformCellContent(content, transform) +
  '</svg>';

async function compositionWindow(
  options: CliOptions,
  cells: ReadonlyArray<CompositionCell>,
  columns: number,
  rows: number,
  x: number,
  y: number,
  width: number,
  height: number,
  fileOverrides: CompositionFileOverrides = {},
  cropViewBox?: string,
  showGrid = true,
  floorFill: string = A1A_PALETTE.floor,
): Promise<string> {
  const basePass: string[] = [];
  const upperPass: string[] = [];
  for (const [col, row, baseFile, upperFile, transform = 'none'] of cells) {
    const baseSource = fileOverrides[baseFile] ?? await readFile(path.join(options.input, baseFile), 'utf8');
    basePass.push(roomCell(stripSvgShell(baseSource), col, row, transform));
    if (upperFile) {
      const upperSource = fileOverrides[upperFile] ?? await readFile(path.join(options.input, upperFile), 'utf8');
      upperPass.push(roomCell(stripSvgShell(upperSource), col, row, transform));
    }
  }
  const gridLines = [
    ...Array.from({ length: Math.max(0, columns - 1) }, (_, index) =>
      `<path d="M ${(index + 1) * 128} 0 V ${rows * 128}"/>`,
    ),
    ...Array.from({ length: Math.max(0, rows - 1) }, (_, index) =>
      `<path d="M 0 ${(index + 1) * 128} H ${columns * 128}"/>`,
    ),
  ].join('');
  return (
    `<svg x="${x}" y="${y}" width="${width}" height="${height}" ` +
    `viewBox="${cropViewBox ?? `0 0 ${columns * 128} ${rows * 128}`}" preserveAspectRatio="none">` +
    `<rect width="${columns * 128}" height="${rows * 128}" fill="${floorFill}"/>` +
    (showGrid
      ? `<g fill="none" stroke="${INK}" stroke-width="1" opacity="0.14">${gridLines}</g>`
      : '') +
    basePass.join('') +
    upperPass.join('') +
    '</svg>'
  );
}

function straightRunCells(
  length: number,
  baseFile: string,
  upperFile: string,
  vertical: boolean,
  transform: EqualHeightWallTransform = 'none',
): CompositionCell[] {
  return Array.from({ length }, (_, index) =>
    [vertical ? 0 : index, vertical ? index : 0, baseFile, upperFile, transform] as CompositionCell,
  );
}

function northeastInstalledCells(
  horizontalLength: number,
  verticalLength: number,
): CompositionCell[] {
  return [
    ...straightRunCells(
      horizontalLength,
      PROMOTED_SOUTH_WALL_REUSE.baseFile,
      PROMOTED_SOUTH_WALL_REUSE.upperFile,
      false,
    ),
    [
      horizontalLength,
      0,
      PROMOTED_NORTHEAST_CORNER.baseFile,
      PROMOTED_NORTHEAST_CORNER.upperFile,
      PROMOTED_NORTHEAST_CORNER.transform,
    ],
    ...Array.from(
      { length: verticalLength },
      (_, index) => [
        horizontalLength,
        index + 1,
        PROMOTED_EAST_WALL_REUSE.baseFile,
        PROMOTED_EAST_WALL_REUSE.upperFile,
        PROMOTED_EAST_WALL_REUSE.transform,
      ] as CompositionCell,
    ),
  ];
}

function southwestInstalledCells(
  verticalLength: number,
  horizontalLength: number,
): CompositionCell[] {
  return [
    ...straightRunCells(
      verticalLength,
      'full_w_straight-base.svg',
      'full_w_straight-upper.svg',
      true,
    ),
    [
      0,
      verticalLength,
      PROMOTED_SOUTHWEST_CORNER.baseFile,
      PROMOTED_SOUTHWEST_CORNER.upperFile,
      PROMOTED_SOUTHWEST_CORNER.transform,
    ],
    ...Array.from(
      { length: horizontalLength },
      (_, index) => [
        index + 1,
        verticalLength,
        PROMOTED_SOUTH_WALL_REUSE.baseFile,
        PROMOTED_SOUTH_WALL_REUSE.upperFile,
      ] as CompositionCell,
    ),
  ];
}

function southeastInstalledCells(
  verticalLength: number,
  horizontalLength: number,
): CompositionCell[] {
  return [
    ...Array.from(
      { length: verticalLength },
      (_, index) => [
        horizontalLength,
        index,
        PROMOTED_EAST_WALL_REUSE.baseFile,
        PROMOTED_EAST_WALL_REUSE.upperFile,
        PROMOTED_EAST_WALL_REUSE.transform,
      ] as CompositionCell,
    ),
    ...Array.from(
      { length: horizontalLength },
      (_, index) => [
        index,
        verticalLength,
        PROMOTED_SOUTH_WALL_REUSE.baseFile,
        PROMOTED_SOUTH_WALL_REUSE.upperFile,
      ] as CompositionCell,
    ),
    [
      horizontalLength,
      verticalLength,
      SOUTHEAST_WORKBENCH_BASE_FILE,
      SOUTHEAST_WORKBENCH_UPPER_FILE,
      PROMOTED_SOUTHEAST_CORNER.transform,
    ],
  ];
}

function terminusRunCells(bodyLength: number): CompositionCell[] {
  return [
    ...straightRunCells(
      bodyLength,
      'full_n_straight-base.svg',
      'full_n_straight-upper.svg',
      false,
    ),
    [bodyLength, 0, 'full_terminus-base.svg', 'full_terminus-upper.svg'],
  ];
}

function equalHeightHorizontalTerminusRunCells(
  index: 2 | 8,
  bodyLength: 1 | 3 | 6,
  layer: EqualHeightHorizontalTerminusLayer = 'composed',
): CompositionCell[] {
  return equalHeightHorizontalTerminusRun(index, bodyLength).map((cell) => {
    if (layer === 'base') {
      return [cell.position, 0, cell.baseFile, null, cell.transform] as CompositionCell;
    }
    if (layer === 'upper') {
      return [cell.position, 0, EMPTY_WORKBENCH_FILE, cell.upperFile, cell.transform] as CompositionCell;
    }
    return [cell.position, 0, cell.baseFile, cell.upperFile, cell.transform] as CompositionCell;
  });
}

function equalHeightHorizontalTerminusCell(
  index: 2 | 8,
  layer: EqualHeightHorizontalTerminusLayer = 'composed',
): CompositionCell[] {
  const gate = EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE;
  const transform: EqualHeightWallTransform = index === 8 ? 'none' : 'mirror-x';
  if (layer === 'base') {
    return [[0, 0, gate.terminusSource.baseFile, null, transform]];
  }
  if (layer === 'upper') {
    return [[0, 0, EMPTY_WORKBENCH_FILE, gate.terminusSource.upperFile, transform]];
  }
  return [[0, 0, gate.terminusSource.baseFile, gate.terminusSource.upperFile, transform]];
}

function equalHeightVerticalTerminusRunCells(
  index: 1 | 4,
  bodyLength: 1 | 3 | 6,
  wallSide: EqualHeightVerticalTerminusWallSide,
  layer: EqualHeightVerticalTerminusLayer = 'composed',
): CompositionCell[] {
  return equalHeightVerticalTerminusRun(index, bodyLength, wallSide).map((cell) => {
    if (layer === 'base') {
      return [0, cell.position, cell.baseFile, null, cell.transform] as CompositionCell;
    }
    if (layer === 'upper') {
      return [0, cell.position, EMPTY_WORKBENCH_FILE, cell.upperFile, cell.transform] as CompositionCell;
    }
    return [0, cell.position, cell.baseFile, cell.upperFile, cell.transform] as CompositionCell;
  });
}

function equalHeightVerticalTerminusCell(
  index: 1 | 4,
  wallSide: EqualHeightVerticalTerminusWallSide,
  layer: EqualHeightVerticalTerminusLayer = 'composed',
): CompositionCell[] {
  const candidate = EQUAL_HEIGHT_VERTICAL_TERMINUS_GATE.cases.find((entry) => entry.index === index);
  if (!candidate) throw new Error(`Unknown vertical terminus source mask_${index}`);
  const transform: EqualHeightWallTransform = wallSide === 'west' ? 'none' : 'mirror-x';
  if (layer === 'base') return [[0, 0, candidate.baseFile, null, transform]];
  if (layer === 'upper') return [[0, 0, EMPTY_WORKBENCH_FILE, candidate.upperFile, transform]];
  return [[0, 0, candidate.baseFile, candidate.upperFile, transform]];
}

function equalHeightVerticalTerminusMinimumSegmentCells(
  bodyLength: 0 | 1,
  wallSide: EqualHeightVerticalTerminusWallSide,
): CompositionCell[] {
  return equalHeightVerticalTerminusMinimumSegment(bodyLength, wallSide).map((cell) => [
    0,
    cell.position,
    cell.baseFile,
    cell.upperFile,
    cell.transform,
  ] as CompositionCell);
}

function openPocketTJunctionCandidateCell(
  maskIndex: 7 | 13,
  col: number,
  row: number,
  layer: 'base' | 'upper' | 'composed' = 'composed',
): CompositionCell {
  const candidate = EQUAL_HEIGHT_OPEN_POCKET_T_JUNCTION_GATE.candidates.find(
    ({ maskIndex: candidateIndex }) => candidateIndex === maskIndex,
  );
  if (!candidate) throw new Error(`Unknown open-pocket T-junction mask_${maskIndex}`);
  const derived = candidate.derivation === 'accepted-southeast-seam-filter';
  const baseFile = derived ? OPEN_POCKET_T_JUNCTION_EAST_BASE_FILE : candidate.baseFile;
  const upperFile = derived ? OPEN_POCKET_T_JUNCTION_EAST_UPPER_FILE : candidate.upperFile;
  if (layer === 'base') return [col, row, baseFile, null, candidate.transform];
  if (layer === 'upper') {
    return [col, row, EMPTY_WORKBENCH_FILE, upperFile, candidate.transform];
  }
  return [col, row, baseFile, upperFile, candidate.transform];
}

function openPocketVerticalEndCell(
  maskIndex: 1 | 4,
  wallSide: EqualHeightVerticalTerminusWallSide,
  col: number,
  row: number,
): CompositionCell {
  const candidate = EQUAL_HEIGHT_VERTICAL_TERMINUS_GATE.cases.find(
    ({ index }) => index === maskIndex,
  );
  if (!candidate) throw new Error(`Unknown open-pocket baseline mask_${maskIndex}`);
  return [
    col,
    row,
    candidate.baseFile,
    candidate.upperFile,
    wallSide === 'west' ? 'none' : 'mirror-x',
  ];
}

function openPocketHorizontalEndCell(
  maskIndex: 2 | 8,
  col: number,
  row: number,
): CompositionCell {
  const transform: EqualHeightWallTransform = maskIndex === 8 ? 'none' : 'mirror-x';
  return [
    col,
    row,
    EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE.terminusSource.baseFile,
    EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE.terminusSource.upperFile,
    transform,
  ];
}

function openPocketTJunctionCompactCells(side: 'west' | 'east'): readonly CompositionCell[] {
  const isWest = side === 'west';
  const col = 1;
  return [
    openPocketVerticalEndCell(4, side, col, 0),
    openPocketTJunctionCandidateCell(isWest ? 7 : 13, col, 1),
    openPocketVerticalEndCell(1, side, col, 2),
    openPocketHorizontalEndCell(isWest ? 8 : 2, isWest ? 2 : 0, 1),
  ];
}

function openPocketTJunctionLongCells(side: 'west' | 'east'): readonly CompositionCell[] {
  const isWest = side === 'west';
  const stemCol = isWest ? 0 : 5;
  const cells: CompositionCell[] = [
    openPocketVerticalEndCell(4, side, stemCol, 0),
    [
      stemCol,
      1,
      'full_w_straight-base.svg',
      'full_w_straight-upper.svg',
      isWest ? 'none' : 'mirror-x',
    ],
    openPocketTJunctionCandidateCell(isWest ? 7 : 13, stemCol, 2),
    [
      stemCol,
      3,
      'full_w_straight-base.svg',
      'full_w_straight-upper.svg',
      isWest ? 'none' : 'mirror-x',
    ],
    [
      stemCol,
      4,
      'full_w_straight-base.svg',
      'full_w_straight-upper.svg',
      isWest ? 'none' : 'mirror-x',
    ],
    openPocketVerticalEndCell(1, side, stemCol, 5),
  ];
  for (let col = 1; col <= 4; col += 1) {
    cells.push([col, 2, 'full_n_straight-base.svg', 'full_n_straight-upper.svg']);
  }
  cells.push(openPocketHorizontalEndCell(isWest ? 8 : 2, isWest ? 5 : 0, 2));
  return cells;
}

type HorizontalOpenPocketTJunctionMask = 11 | 14;
type HorizontalOpenPocketTJunctionFacing = 'west-source' | 'east-mirror-review';

function horizontalOpenPocketTJunctionSourceFiles(
  maskIndex: HorizontalOpenPocketTJunctionMask,
): readonly [string, string] {
  return maskIndex === 11
    ? ['open_s_t_junction-base.svg', 'open_s_t_junction-upper.svg']
    : ['open_n_t_junction-base.svg', 'open_n_t_junction-upper.svg'];
}

function horizontalOpenPocketTJunctionCandidateCell(
  maskIndex: HorizontalOpenPocketTJunctionMask,
  facing: HorizontalOpenPocketTJunctionFacing,
  col: number,
  row: number,
  layer: 'base' | 'upper' | 'composed' = 'composed',
): CompositionCell {
  const [baseFile, upperFile] = horizontalOpenPocketTJunctionSourceFiles(maskIndex);
  const transform: EqualHeightWallTransform = facing === 'west-source' ? 'none' : 'mirror-x';
  if (layer === 'base') return [col, row, baseFile, null, transform];
  if (layer === 'upper') return [col, row, EMPTY_WORKBENCH_FILE, upperFile, transform];
  return [col, row, baseFile, upperFile, transform];
}

function horizontalOpenPocketTJunctionCompactCells(
  maskIndex: HorizontalOpenPocketTJunctionMask,
  facing: HorizontalOpenPocketTJunctionFacing,
): readonly CompositionCell[] {
  const side: EqualHeightVerticalTerminusWallSide =
    facing === 'west-source' ? 'west' : 'east';
  const cells: CompositionCell[] = [
    openPocketHorizontalEndCell(2, 0, 1),
    horizontalOpenPocketTJunctionCandidateCell(maskIndex, facing, 1, 1),
    openPocketHorizontalEndCell(8, 2, 1),
  ];
  cells.push(maskIndex === 11
    ? openPocketVerticalEndCell(4, side, 1, 0)
    : openPocketVerticalEndCell(1, side, 1, 2));
  return cells;
}

function horizontalOpenPocketTJunctionLongCells(
  maskIndex: HorizontalOpenPocketTJunctionMask,
  facing: HorizontalOpenPocketTJunctionFacing,
): readonly CompositionCell[] {
  const side: EqualHeightVerticalTerminusWallSide =
    facing === 'west-source' ? 'west' : 'east';
  const transform: EqualHeightWallTransform = side === 'west' ? 'none' : 'mirror-x';
  const junctionRow = maskIndex === 11 ? 5 : 0;
  const cells: CompositionCell[] = [
    openPocketHorizontalEndCell(2, 0, junctionRow),
    [1, junctionRow, 'full_n_straight-base.svg', 'full_n_straight-upper.svg'],
    horizontalOpenPocketTJunctionCandidateCell(maskIndex, facing, 2, junctionRow),
    [3, junctionRow, 'full_n_straight-base.svg', 'full_n_straight-upper.svg'],
    [4, junctionRow, 'full_n_straight-base.svg', 'full_n_straight-upper.svg'],
    openPocketHorizontalEndCell(8, 5, junctionRow),
  ];
  if (maskIndex === 11) {
    cells.push(openPocketVerticalEndCell(4, side, 2, 0));
    for (let row = 1; row <= 4; row += 1) {
      cells.push([2, row, 'full_w_straight-base.svg', 'full_w_straight-upper.svg', transform]);
    }
  } else {
    for (let row = 1; row <= 4; row += 1) {
      cells.push([2, row, 'full_w_straight-base.svg', 'full_w_straight-upper.svg', transform]);
    }
    cells.push(openPocketVerticalEndCell(1, side, 2, 5));
  }
  return cells;
}

function transitionWestSouthInstalledCells(length: number): CompositionCell[] {
  return [
    ...straightRunCells(
      length,
      'full_w_straight-base.svg',
      'full_w_straight-upper.svg',
      true,
    ),
    [0, length, LEGACY_LOW_SOUTHWEST_BASE_FILE, LEGACY_LOW_SOUTHWEST_UPPER_FILE],
    ...Array.from(
      { length },
      (_, index) =>
        [index + 1, length, 'low-profile-correction/low-s-straight.svg', null] as CompositionCell,
    ),
  ];
}

const LOW_SE_CORNER_CELL: ReadonlyArray<CompositionCell> = [
  [0, 0, 'low-profile-correction/low-se-corner.svg', null],
];

function minimumLowSoutheastInstalledCells(): CompositionCell[] {
  return [
    [1, 0, 'low-profile-correction/low-e-straight.svg', null],
    [0, 1, 'low-profile-correction/low-s-straight.svg', null],
    [1, 1, 'low-profile-correction/low-se-corner.svg', null],
  ];
}

function longLowSoutheastInstalledCells(): CompositionCell[] {
  return [
    [3, 0, 'low-profile-correction/low-e-straight.svg', null],
    [3, 1, 'low-profile-correction/low-e-straight.svg', null],
    [3, 2, 'low-profile-correction/low-e-straight.svg', null],
    [0, 3, 'low-profile-correction/low-s-straight.svg', null],
    [1, 3, 'low-profile-correction/low-s-straight.svg', null],
    [2, 3, 'low-profile-correction/low-s-straight.svg', null],
    [3, 3, 'low-profile-correction/low-se-corner.svg', null],
  ];
}

async function renderTransitionWestSouthFocus(options: CliOptions, root: string): Promise<void> {
  const width = 1600;
  const height = 1380;
  const panelFill = '#ECE5D5';
  const panel = (x: number, y: number, w: number, h: number): string =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${panelFill}" ` +
    `stroke="${INK}" stroke-width="1.5" opacity="0.96"/>`;
  const cornerReference = `data:image/png;base64,${Buffer.from(
    await readFile(path.join(root, 'docs', 'reference', 'quota-co-wall-corners-and-ends-study.png')),
  ).toString('base64')}`;
  const referenceCrop = (
    href: string,
    x: number,
    y: number,
    width_: number,
    height_: number,
    viewBox: string,
  ): string =>
    `<svg x="${x}" y="${y}" width="${width_}" height="${height_}" viewBox="${viewBox}" ` +
    `preserveAspectRatio="xMidYMid meet"><image width="1536" height="1024" href="${href}"/></svg>`;
  const transitionBaseCell: ReadonlyArray<CompositionCell> = [
    [0, 0, LEGACY_LOW_SOUTHWEST_BASE_FILE, null],
  ];
  const transitionUpperCell: ReadonlyArray<CompositionCell> = [
    [0, 0, LEGACY_LOW_SOUTHWEST_UPPER_FILE, null],
  ];
  const westSocketCells: ReadonlyArray<CompositionCell> = [
    [0, 0, 'full_w_straight-base.svg', 'full_w_straight-upper.svg'],
    [0, 1, LEGACY_LOW_SOUTHWEST_BASE_FILE, LEGACY_LOW_SOUTHWEST_UPPER_FILE],
  ];
  const southSocketCells: ReadonlyArray<CompositionCell> = [
    [0, 0, LEGACY_LOW_SOUTHWEST_BASE_FILE, LEGACY_LOW_SOUTHWEST_UPPER_FILE],
    [1, 0, 'low-profile-correction/low-s-straight.svg', null],
  ];

  const parts: string[] = [
    `<rect width="${width}" height="${height}" rx="18" fill="${PANEL}"/>`,
    text(24, 34, 'SOUTHWEST FULL-TO-LOW TRANSITION — SUPERSEDED CHECKPOINT', 21, 800),
    text(24, 58, 'Historical control only. Its foreground-ownership lesson survives, but the equal-height southwest source now replaces this geometry.', 12, 600, MUTED),
    panel(20, 76, 350, 340),
    panel(390, 76, 330, 340),
    panel(740, 76, 840, 340),
    panel(20, 436, 760, 360),
    panel(800, 436, 780, 360),
    panel(20, 816, 770, 540),
    panel(810, 816, 770, 540),
    text(40, 108, 'OWNER-APPROVED SOUTHWEST TARGET', 14, 800),
    text(40, 130, 'Broad west mass; shallow south wall enters from its side.', 11, 600, MUTED),
    referenceCrop(cornerReference, 45, 138, 300, 238, '780 520 325 480'),
    text(40, 397, 'Use the ownership and catalog weight—not the generated pixels.', 10, 600, MUTED),
    text(410, 108, 'HISTORICAL SOURCE — COMPOSED', 14, 800),
    text(410, 130, 'Superseded source reconstructed only for comparison.', 11, 600, MUTED),
    text(410, 390, 'molded turn  ·  wrapped foreground stack  ·  continuous sockets', 10, 700, A1A_PALETTE.green),
    text(760, 108, 'HISTORICAL CONSTRUCTION — SUPERSEDED SOURCE', 14, 800),
    text(760, 130, 'Base and upper remain visible only to document why the old height step was replaced.', 11, 600, MUTED),
    text(845, 330, 'BASE', 10, 750, MUTED, 'middle'),
    text(1015, 330, 'UPPER', 10, 750, MUTED, 'middle'),
    text(1250, 390, 'COMPOSED', 10, 750, MUTED, 'middle'),
    text(1450, 158, '90 px', 10, 700, MUTED, 'middle'),
    text(1530, 246, '40 px', 10, 700, MUTED, 'middle'),
    text(760, 405, 'South cream / coral / green repaint the complete foreground heel after the west plane terminates.', 10, 700, A1A_PALETTE.green),
    text(40, 468, 'FULL-WEST INGRESS — ENLARGED SOCKET', 14, 800),
    text(40, 490, 'Fixed full-west above; promoted transition below. The horizontal guide is the tile boundary.', 11, 600, MUTED),
    text(390, 555, 'WEST OWNS', 11, 800),
    text(390, 579, '• the 64-unit vertical mass', 11, 600, MUTED),
    text(390, 603, '• broad cream plane', 11, 600, MUTED),
    text(390, 627, '• narrow side shade', 11, 600, MUTED),
    text(390, 675, 'The shaft ends behind the south coping.', 11, 750, A1A_PALETTE.green),
    text(820, 468, 'LOW-SOUTH EGRESS — ENLARGED SOCKET', 14, 800),
    text(820, 490, 'Promoted transition left; fixed low-south right. The vertical guide is the tile boundary.', 11, 600, MUTED),
    text(820, 745, 'Gate: cream / coral / green / plinth hand off without a shelf, patch, or side-face overpaint.', 11, 700),
    text(40, 848, 'MINIMUM INSTALLED TURN', 14, 800),
    text(40, 870, 'One-cell arms: the corner-unit gate.', 11, 600, MUTED),
    text(830, 848, 'LONG INSTALLED TURN', 14, 800),
    text(830, 870, 'Three-cell arms: the repetition gate.', 11, 600, MUTED),
    text(40, 1332, 'The height change must read immediately without becoming a terminal capsule.', 11, 650, MUTED),
    text(830, 1332, 'The transition must disappear into the catalog rhythm once the runs grow.', 11, 650, MUTED),
  ];
  parts.push(
    await compositionWindow(
      options, TRANSITION_W_TO_S_CELL, 1, 1, 435, 145, 240, 240,
      SOUTHWEST_REVIEW_FILE_OVERRIDES,
    ),
  );
  parts.push(
    await compositionWindow(
      options, transitionBaseCell, 1, 1, 770, 155, 150, 150,
      SOUTHWEST_REVIEW_FILE_OVERRIDES,
    ),
  );
  parts.push(
    await compositionWindow(
      options, transitionUpperCell, 1, 1, 940, 155, 150, 150,
      SOUTHWEST_REVIEW_FILE_OVERRIDES,
    ),
  );
  parts.push(
    await compositionWindow(
      options, TRANSITION_W_TO_S_CELL, 1, 1, 1115, 125, 270, 270,
      SOUTHWEST_REVIEW_FILE_OVERRIDES,
    ),
  );
  parts.push(
    await compositionWindow(
      options, TRANSITION_W_TO_S_CELL, 1, 1, 1405, 175, 90, 90,
      SOUTHWEST_REVIEW_FILE_OVERRIDES,
    ),
  );
  parts.push(
    await compositionWindow(
      options, TRANSITION_W_TO_S_CELL, 1, 1, 1510, 260, 40, 40,
      SOUTHWEST_REVIEW_FILE_OVERRIDES,
    ),
  );
  parts.push(
    await compositionWindow(
      options, westSocketCells, 1, 2, 80, 515, 280, 260,
      SOUTHWEST_REVIEW_FILE_OVERRIDES, '64 96 64 64',
    ),
  );
  parts.push(
    `<path d="M64 645H376" fill="none" stroke="${A1A_PALETTE.coral}" ` +
    'stroke-width="2" stroke-dasharray="6 5" opacity="0.75"/>',
  );
  parts.push(
    await compositionWindow(
      options, southSocketCells, 2, 1, 850, 530, 680, 170,
      SOUTHWEST_REVIEW_FILE_OVERRIDES, '0 64 256 64',
    ),
  );
  parts.push(
    `<path d="M1190 515V720" fill="none" stroke="${A1A_PALETTE.coral}" ` +
    'stroke-width="2" stroke-dasharray="6 5" opacity="0.75"/>',
  );
  parts.push(
    await compositionWindow(
      options, transitionWestSouthInstalledCells(1), 2, 2, 245, 925, 320, 320,
      SOUTHWEST_REVIEW_FILE_OVERRIDES,
    ),
  );
  parts.push(
    await compositionWindow(
      options, transitionWestSouthInstalledCells(3), 4, 4, 1035, 925, 320, 320,
      SOUTHWEST_REVIEW_FILE_OVERRIDES,
    ),
  );

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * CARD_RENDER_SCALE },
  }).render().asPng();
  await writeFile(path.join(options.output, 'transition-w-to-s-focus.png'), png);
}

async function renderFullHeightEastMirrorProof(options: CliOptions): Promise<void> {
  const width = 1600;
  const height = 1480;
  const panelFill = '#ECE5D5';
  const panel = (x: number, y: number, w: number, h: number): string =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${panelFill}" ` +
    `stroke="${INK}" stroke-width="1.5" opacity="0.96"/>`;
  const currentLowEast: ReadonlyArray<CompositionCell> = [
    [0, 0, 'low-profile-correction/low-e-straight.svg', null],
  ];
  const westSource: ReadonlyArray<CompositionCell> = [
    [0, 0, PROMOTED_EAST_WALL_REUSE.baseFile, PROMOTED_EAST_WALL_REUSE.upperFile],
  ];
  const acceptedEast: ReadonlyArray<CompositionCell> = [
    [
      0,
      0,
      PROMOTED_EAST_WALL_REUSE.baseFile,
      PROMOTED_EAST_WALL_REUSE.upperFile,
      PROMOTED_EAST_WALL_REUSE.transform,
    ],
  ];
  const eastRun = (length: number): CompositionCell[] => straightRunCells(
    length,
    PROMOTED_EAST_WALL_REUSE.baseFile,
    PROMOTED_EAST_WALL_REUSE.upperFile,
    true,
    PROMOTED_EAST_WALL_REUSE.transform,
  );
  const parts: string[] = [
    `<rect width="${width}" height="${height}" rx="18" fill="${PANEL}"/>`,
    text(24, 34, 'FULL-HEIGHT EAST STRAIGHT — ACCEPTED WHOLE-CELL MIRROR', 21, 800),
    text(24, 58, 'Owner accepted. The full-west base + upper pair is reflected around x=64; no east SVG, profile state, or production registration is added.', 12, 600, MUTED),
    panel(20, 76, 500, 370),
    panel(540, 76, 500, 370),
    panel(1060, 76, 520, 370),
    panel(20, 466, 1560, 300),
    panel(20, 786, 760, 670),
    panel(800, 786, 780, 670),
    text(44, 108, 'LEGACY CONTROL — LOW EAST', 14, 800),
    text(44, 132, '38-unit local-mirror profile retained as comparison evidence.', 11, 600, MUTED),
    text(564, 108, 'SOURCE — FULL WEST', 14, 800),
    text(564, 132, 'Accepted 64-unit vertical master; room-facing contact at right.', 11, 600, MUTED),
    text(1084, 108, 'ACCEPTED — FULL EAST', 14, 800),
    text(1084, 132, 'Exact west source, mirrored around the centred cell pivot.', 11, 600, MUTED),
    text(270, 418, 'LOW EAST · x82..120', 11, 800, '#9A493D', 'middle'),
    text(790, 418, 'FULL WEST · x56..120', 11, 800, MUTED, 'middle'),
    text(1320, 418, 'FULL EAST · x8..72', 11, 800, A1A_PALETTE.green, 'middle'),
    text(44, 498, 'ACCEPTED EAST — 1 / 3 / 6-CELL VERTICAL RUNS', 14, 800),
    text(44, 522, 'The complete profile, contact shade, seams, and lateral material cues mirror together.', 11, 600, MUTED),
    text(240, 728, '1 CELL', 10, 800, MUTED, 'middle'),
    text(550, 728, '3 CELLS', 10, 800, MUTED, 'middle'),
    text(860, 728, '6 CELLS', 10, 800, MUTED, 'middle'),
    text(1090, 514, 'GEOMETRY GATE', 12, 800),
    text(1090, 542, '• whole-cell reflection: x′ = 128 − x', 11, 600, MUTED),
    text(1090, 570, '• centred pivot remains 0.5 / 0.5', 11, 600, MUTED),
    text(1090, 598, '• vertical run sockets remain y0..128', 11, 600, MUTED),
    text(1090, 626, '• 64-unit envelope remains inside the wall cell', 11, 600, MUTED),
    text(1090, 674, 'Lighting polish is deferred; this pass judges profile and handedness.', 11, 700, A1A_PALETTE.green),
    text(44, 818, 'CURRENT ROOM — SOUTH PROMOTED, EAST LEGACY', 14, 800),
    text(44, 842, 'The accepted horizontal source is now the control; east remains low.', 11, 600, MUTED),
    text(824, 818, 'INSTALLED EAST-STRAIGHT PROOF', 14, 800),
    text(824, 842, 'Historical acceptance checkpoint: only the centre east cell changes; later sheets close both corner joins.', 11, 600, MUTED),
    text(44, 1430, 'Control shows the promoted south decision in the primary room composition.', 11, 650, MUTED),
    text(824, 1430, 'Gate: judge the mirrored straight and cell balance—not the deliberately incompatible corner sockets.', 11, 700, A1A_PALETTE.green),
  ];
  parts.push(await compositionWindow(options, currentLowEast, 1, 1, 150, 150, 240, 240));
  parts.push(await compositionWindow(options, westSource, 1, 1, 670, 150, 240, 240));
  parts.push(await compositionWindow(options, acceptedEast, 1, 1, 1190, 150, 240, 240));
  parts.push(await compositionWindow(options, eastRun(1), 1, 1, 180, 550, 120, 120));
  parts.push(await compositionWindow(options, eastRun(3), 1, 3, 490, 530, 120, 180));
  parts.push(await compositionWindow(options, eastRun(6), 1, 6, 800, 510, 120, 210));
  parts.push(await compositionWindow(options, ROOM_CELLS, 3, 3, 100, 850, 600, 600));
  parts.push(await compositionWindow(options, FULL_HEIGHT_EAST_ROOM_CELLS, 3, 3, 880, 850, 600, 600));
  parts.push(
    '<g fill="none" stroke="#B65F4D" stroke-width="3" stroke-dasharray="10 8" opacity="0.9">' +
      '<rect x="1280" y="850" width="200" height="200" rx="8"/>' +
      '<rect x="880" y="1250" width="200" height="200" rx="8"/>' +
      '<rect x="1280" y="1250" width="200" height="200" rx="8"/>' +
    '</g>',
  );
  parts.push(text(1380, 878, 'NE HISTORICAL CONTROL', 11, 800, '#9A493D', 'middle'));
  parts.push(text(980, 1278, 'SW PROMOTED', 11, 800, A1A_PALETTE.green, 'middle'));
  parts.push(text(1380, 1278, 'SE LEGACY CONTROL', 11, 800, '#9A493D', 'middle'));

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * CARD_RENDER_SCALE },
  }).render().asPng();
  await writeFile(path.join(options.output, 'full-height-east-proof.png'), png);
}

async function renderFullHeightNortheastProof(options: CliOptions): Promise<void> {
  const width = 1600;
  const height = 1600;
  const panelFill = '#ECE5D5';
  const panel = (x: number, y: number, w: number, h: number): string =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${panelFill}" ` +
    `stroke="${INK}" stroke-width="1.5" opacity="0.96"/>`;
  const legacyNortheast: ReadonlyArray<CompositionCell> = [
    [0, 0, 'transition_n_to_e-base.svg', 'transition_n_to_e-upper.svg'],
  ];
  const northwestSource: ReadonlyArray<CompositionCell> = [
    [
      0,
      0,
      PROMOTED_NORTHEAST_CORNER.baseFile,
      PROMOTED_NORTHEAST_CORNER.upperFile,
    ],
  ];
  const acceptedNortheast: ReadonlyArray<CompositionCell> = [
    [
      0,
      0,
      PROMOTED_NORTHEAST_CORNER.baseFile,
      PROMOTED_NORTHEAST_CORNER.upperFile,
      PROMOTED_NORTHEAST_CORNER.transform,
    ],
  ];
  const northSocketCells: ReadonlyArray<CompositionCell> = [
    [0, 0, PROMOTED_SOUTH_WALL_REUSE.baseFile, PROMOTED_SOUTH_WALL_REUSE.upperFile],
    [
      1,
      0,
      PROMOTED_NORTHEAST_CORNER.baseFile,
      PROMOTED_NORTHEAST_CORNER.upperFile,
      PROMOTED_NORTHEAST_CORNER.transform,
    ],
  ];
  const eastSocketCells: ReadonlyArray<CompositionCell> = [
    [
      0,
      0,
      PROMOTED_NORTHEAST_CORNER.baseFile,
      PROMOTED_NORTHEAST_CORNER.upperFile,
      PROMOTED_NORTHEAST_CORNER.transform,
    ],
    [
      0,
      1,
      PROMOTED_EAST_WALL_REUSE.baseFile,
      PROMOTED_EAST_WALL_REUSE.upperFile,
      PROMOTED_EAST_WALL_REUSE.transform,
    ],
  ];
  const parts: string[] = [
    `<rect width="${width}" height="${height}" rx="18" fill="${PANEL}"/>`,
    text(24, 34, 'FULL-HEIGHT NORTHEAST CORNER — ACCEPTED MIRRORED SOURCE', 21, 800),
    text(24, 58, 'Owner accepted with the east straight. The northwest base + upper pair is reflected around x=64; no northeast SVG or production registration is added.', 12, 600, MUTED),
    panel(20, 76, 500, 370),
    panel(540, 76, 500, 370),
    panel(1060, 76, 520, 370),
    panel(20, 466, 760, 390),
    panel(800, 466, 780, 390),
    panel(20, 876, 500, 700),
    panel(540, 876, 500, 700),
    panel(1060, 876, 520, 700),
    text(44, 108, 'LEGACY CONTROL — FULL NORTH TO LOW EAST', 14, 800),
    text(44, 132, 'Old right-anchored east socket; retained only to expose the mismatch.', 11, 600, MUTED),
    text(564, 108, 'SOURCE — ACCEPTED NORTHWEST', 14, 800),
    text(564, 132, 'The compact full/full molded corner already approved on the west side.', 11, 600, MUTED),
    text(1084, 108, 'ACCEPTED — MIRRORED NORTHEAST', 14, 800),
    text(1084, 132, 'Exact source reuse around the centred pivot; lighting polish deferred.', 11, 600, MUTED),
    text(270, 418, 'LEGACY NE', 11, 800, '#9A493D', 'middle'),
    text(790, 418, 'FULL NW SOURCE', 11, 800, MUTED, 'middle'),
    text(1320, 418, 'FULL NE MIRROR', 11, 800, A1A_PALETTE.green, 'middle'),
    text(1505, 278, '90 px', 10, 700, MUTED, 'middle'),
    text(1510, 370, '40 px', 10, 700, MUTED, 'middle'),
    text(44, 498, 'NORTH INGRESS — ENLARGED TILE SEAM', 14, 800),
    text(44, 522, 'The full horizontal profile enters unchanged from the west.', 11, 600, MUTED),
    text(430, 590, 'NORTH SOCKET', 11, 800),
    text(430, 618, '• y56..120 profile preserved', 11, 600, MUTED),
    text(430, 646, '• cream / coral / green registers meet', 11, 600, MUTED),
    text(430, 674, '• no terminal cap at the join', 11, 600, MUTED),
    text(430, 730, 'The vertical guide is the tile boundary.', 11, 700, A1A_PALETTE.green),
    text(824, 498, 'EAST EGRESS — ENLARGED TILE SEAM', 14, 800),
    text(824, 522, 'The mirrored corner exits into the same x8..72 full-east socket.', 11, 600, MUTED),
    text(1190, 590, 'EAST SOCKET', 11, 800),
    text(1190, 618, '• x8..72 profile preserved', 11, 600, MUTED),
    text(1190, 646, '• room-facing fascia stays inward', 11, 600, MUTED),
    text(1190, 674, '• repeated seam stays quiet', 11, 600, MUTED),
    text(1190, 730, 'The horizontal guide is the tile boundary.', 11, 700, A1A_PALETTE.green),
    text(44, 908, 'COMPACT TURN — ONE-CELL ARMS', 14, 800),
    text(44, 932, 'The corner must read as a turn, not a catalog appliance.', 11, 600, MUTED),
    text(564, 908, 'LONG TURN — THREE-CELL ARMS', 14, 800),
    text(564, 932, 'The corner must disappear into the repeated wall rhythm.', 11, 600, MUTED),
    text(1084, 908, 'INSTALLED ROOM — NE REPLACED ONLY', 14, 800),
    text(1084, 932, 'Historical acceptance checkpoint: southwest is current; southeast is shown before its later promotion.', 11, 600, MUTED),
    text(44, 1548, 'Gate: one-cell arms remain readable without the elbow becoming oversized.', 11, 700, MUTED),
    text(564, 1548, 'Gate: north and east seams remain continuous at length.', 11, 700, MUTED),
    text(1084, 1548, 'Accepted gate: the northeast turn and full-east run stay continuous in the composed room.', 11, 700, A1A_PALETTE.green),
  ];
  parts.push(await compositionWindow(options, legacyNortheast, 1, 1, 150, 150, 240, 240));
  parts.push(await compositionWindow(options, northwestSource, 1, 1, 670, 150, 240, 240));
  parts.push(await compositionWindow(options, acceptedNortheast, 1, 1, 1190, 150, 240, 240));
  parts.push(
    await compositionWindow(options, acceptedNortheast, 1, 1, 1460, 170, 90, 90),
  );
  parts.push(
    await compositionWindow(options, acceptedNortheast, 1, 1, 1490, 300, 40, 40),
  );
  parts.push(
    await compositionWindow(options, northSocketCells, 2, 1, 70, 540, 312, 312, {}, '64 0 128 128'),
  );
  parts.push(
    `<path d="M226 540V852" fill="none" stroke="${A1A_PALETTE.coral}" ` +
    'stroke-width="2" stroke-dasharray="7 6" opacity="0.75"/>',
  );
  parts.push(
    await compositionWindow(options, eastSocketCells, 1, 2, 840, 540, 312, 312, {}, '0 64 128 128'),
  );
  parts.push(
    `<path d="M840 696H1152" fill="none" stroke="${A1A_PALETTE.coral}" ` +
    'stroke-width="2" stroke-dasharray="7 6" opacity="0.75"/>',
  );
  parts.push(
    await compositionWindow(options, northeastInstalledCells(1, 1), 2, 2, 90, 980, 360, 360),
  );
  parts.push(
    await compositionWindow(options, northeastInstalledCells(3, 3), 4, 4, 600, 970, 380, 380),
  );
  parts.push(
    await compositionWindow(options, FULL_HEIGHT_NORTHEAST_ROOM_CELLS, 3, 3, 1090, 970, 460, 460),
  );
  parts.push(
    '<g fill="none" stroke="#B65F4D" stroke-width="3" stroke-dasharray="10 8" opacity="0.9">' +
      '<rect x="1090" y="1276.7" width="153.3" height="153.3" rx="8"/>' +
      '<rect x="1396.7" y="1276.7" width="153.3" height="153.3" rx="8"/>' +
    '</g>',
  );
  parts.push(text(1166, 1302, 'SW PROMOTED', 10, 800, A1A_PALETTE.green, 'middle'));
  parts.push(text(1473, 1302, 'SE LEGACY', 10, 800, '#9A493D', 'middle'));

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * CARD_RENDER_SCALE },
  }).render().asPng();
  await writeFile(path.join(options.output, 'full-height-northeast-proof.png'), png);
}

async function renderFullHeightSouthwestProof(options: CliOptions): Promise<void> {
  const width = 1600;
  const height = 1600;
  const panelFill = '#ECE5D5';
  const panel = (x: number, y: number, w: number, h: number): string =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${panelFill}" ` +
    `stroke="${INK}" stroke-width="1.5" opacity="0.96"/>`;
  const legacySouthwest: ReadonlyArray<CompositionCell> = [
    [0, 0, LEGACY_LOW_SOUTHWEST_BASE_FILE, LEGACY_LOW_SOUTHWEST_UPPER_FILE],
  ];
  const proposedSouthwest: ReadonlyArray<CompositionCell> = [
    [
      0,
      0,
      PROMOTED_SOUTHWEST_CORNER.baseFile,
      PROMOTED_SOUTHWEST_CORNER.upperFile,
      PROMOTED_SOUTHWEST_CORNER.transform,
    ],
  ];
  const proposedBase: ReadonlyArray<CompositionCell> = [
    [0, 0, PROMOTED_SOUTHWEST_CORNER.baseFile, null],
  ];
  const proposedUpper: ReadonlyArray<CompositionCell> = [
    [0, 0, PROMOTED_SOUTHWEST_CORNER.upperFile, null],
  ];
  const westSocketCells: ReadonlyArray<CompositionCell> = [
    [0, 0, 'full_w_straight-base.svg', 'full_w_straight-upper.svg'],
    [
      0,
      1,
      PROMOTED_SOUTHWEST_CORNER.baseFile,
      PROMOTED_SOUTHWEST_CORNER.upperFile,
      PROMOTED_SOUTHWEST_CORNER.transform,
    ],
  ];
  const southSocketCells: ReadonlyArray<CompositionCell> = [
    [
      0,
      0,
      PROMOTED_SOUTHWEST_CORNER.baseFile,
      PROMOTED_SOUTHWEST_CORNER.upperFile,
      PROMOTED_SOUTHWEST_CORNER.transform,
    ],
    [1, 0, PROMOTED_SOUTH_WALL_REUSE.baseFile, PROMOTED_SOUTH_WALL_REUSE.upperFile],
  ];
  const parts: string[] = [
    `<rect width="${width}" height="${height}" rx="18" fill="${PANEL}"/>`,
    text(24, 34, 'FULL-HEIGHT SOUTHWEST CORNER — PROMOTED MOLDED WRAP', 21, 800),
    text(24, 58, 'Canonical source checkpoint. The polished west-to-south pair preserves both accepted sockets and the south-owned foreground wrap; topology and production registration remain unchanged.', 12, 600, MUTED),
    panel(20, 76, 500, 370),
    panel(540, 76, 500, 370),
    panel(1060, 76, 520, 370),
    panel(20, 466, 760, 390),
    panel(800, 466, 780, 390),
    panel(20, 876, 500, 700),
    panel(540, 876, 500, 700),
    panel(1060, 876, 520, 700),
    text(44, 108, 'LEGACY CONTROL — FULL WEST TO LOW SOUTH', 14, 800),
    text(44, 132, 'The old shallow branch exposes the height mismatch we are replacing.', 11, 600, MUTED),
    text(564, 108, 'PROMOTED — FULL WEST TO FULL SOUTH', 14, 800),
    text(564, 132, 'A compact catalog elbow; the south frontage owns the foreground wrap.', 11, 600, MUTED),
    text(1084, 108, 'CONSTRUCTION — BASE / UPPER / DISTANCE', 14, 800),
    text(1084, 132, 'Two canonical paint passes; no baked patch or terminal appliance.', 11, 600, MUTED),
    text(270, 418, 'SUPERSEDED LOW EXIT', 11, 800, '#9A493D', 'middle'),
    text(790, 418, 'FULL / FULL MOLDED TURN', 11, 800, A1A_PALETTE.green, 'middle'),
    text(1165, 338, 'BASE', 10, 800, MUTED, 'middle'),
    text(1355, 338, 'UPPER', 10, 800, MUTED, 'middle'),
    text(1505, 278, '90 px', 10, 700, MUTED, 'middle'),
    text(1510, 370, '40 px', 10, 700, MUTED, 'middle'),
    text(44, 498, 'WEST INGRESS — ENLARGED TILE SEAM', 14, 800),
    text(44, 522, 'The full west profile enters from above without shifting its planes.', 11, 600, MUTED),
    text(430, 590, 'WEST SOCKET', 11, 800),
    text(430, 618, '• x56..123.5 envelope preserved', 11, 600, MUTED),
    text(430, 646, '• west shade terminates behind turn', 11, 600, MUTED),
    text(430, 674, '• no cap or applied corner box', 11, 600, MUTED),
    text(430, 730, 'Dashed guide marks the tile boundary.', 11, 700, A1A_PALETTE.green),
    text(824, 498, 'SOUTH EGRESS — ENLARGED TILE SEAM', 14, 800),
    text(824, 522, 'The promoted horizontal profile exits unchanged to the east.', 11, 600, MUTED),
    text(1190, 590, 'SOUTH SOCKET', 11, 800),
    text(1190, 618, '• y56..123.5 envelope preserved', 11, 600, MUTED),
    text(1190, 646, '• cream / coral / green registers meet', 11, 600, MUTED),
    text(1190, 674, '• full south face stays lit', 11, 600, MUTED),
    text(1190, 730, 'Dashed guide marks the tile boundary.', 11, 700, A1A_PALETTE.green),
    text(44, 908, 'COMPACT TURN — ONE-CELL ARMS', 14, 800),
    text(44, 932, 'The heel must remain legible when the room is only two cells across.', 11, 600, MUTED),
    text(564, 908, 'LONG TURN — THREE-CELL ARMS', 14, 800),
    text(564, 932, 'The elbow should disappear into the repeated catalog rhythm.', 11, 600, MUTED),
    text(1084, 908, 'INSTALLED ROOM — SW PROMOTED', 14, 800),
    text(1084, 932, 'This southwest checkpoint retains the legacy southeast for the next-sheet comparison.', 11, 600, MUTED),
    text(44, 1548, 'Gate: the one-cell turn reads as a continuous wall, not a corner appliance.', 11, 700, MUTED),
    text(564, 1548, 'Gate: both sockets stay flush at length without perspective drift.', 11, 700, MUTED),
    text(1084, 1548, 'Checkpoint preserved: southwest accepted; see the next sheet for promoted southeast.', 11, 700, A1A_PALETTE.green),
  ];
  parts.push(
    await compositionWindow(
      options, legacySouthwest, 1, 1, 150, 150, 240, 240,
      SOUTHWEST_REVIEW_FILE_OVERRIDES,
    ),
  );
  parts.push(
    await compositionWindow(
      options, proposedSouthwest, 1, 1, 670, 150, 240, 240,
      SOUTHWEST_REVIEW_FILE_OVERRIDES,
    ),
  );
  parts.push(
    await compositionWindow(
      options, proposedBase, 1, 1, 1100, 160, 130, 130,
      SOUTHWEST_REVIEW_FILE_OVERRIDES,
    ),
  );
  parts.push(
    await compositionWindow(
      options, proposedUpper, 1, 1, 1290, 160, 130, 130,
      SOUTHWEST_REVIEW_FILE_OVERRIDES,
    ),
  );
  parts.push(
    await compositionWindow(
      options, proposedSouthwest, 1, 1, 1460, 170, 90, 90,
      SOUTHWEST_REVIEW_FILE_OVERRIDES,
    ),
  );
  parts.push(
    await compositionWindow(
      options, proposedSouthwest, 1, 1, 1490, 300, 40, 40,
      SOUTHWEST_REVIEW_FILE_OVERRIDES,
    ),
  );
  parts.push(
    await compositionWindow(
      options, westSocketCells, 1, 2, 70, 540, 312, 312,
      SOUTHWEST_REVIEW_FILE_OVERRIDES, '0 64 128 128',
    ),
  );
  parts.push(
    `<path d="M70 696H382" fill="none" stroke="${A1A_PALETTE.coral}" ` +
    'stroke-width="2" stroke-dasharray="7 6" opacity="0.75"/>',
  );
  parts.push(
    await compositionWindow(
      options, southSocketCells, 2, 1, 840, 540, 312, 312,
      SOUTHWEST_REVIEW_FILE_OVERRIDES, '64 0 128 128',
    ),
  );
  parts.push(
    `<path d="M996 540V852" fill="none" stroke="${A1A_PALETTE.coral}" ` +
    'stroke-width="2" stroke-dasharray="7 6" opacity="0.75"/>',
  );
  parts.push(
    await compositionWindow(
      options, southwestInstalledCells(1, 1), 2, 2, 90, 980, 360, 360,
      SOUTHWEST_REVIEW_FILE_OVERRIDES,
    ),
  );
  parts.push(
    await compositionWindow(
      options, southwestInstalledCells(3, 3), 4, 4, 600, 970, 380, 380,
      SOUTHWEST_REVIEW_FILE_OVERRIDES,
    ),
  );
  parts.push(
    await compositionWindow(
      options, FULL_HEIGHT_SOUTHWEST_ROOM_CELLS, 3, 3, 1090, 970, 460, 460,
      SOUTHWEST_REVIEW_FILE_OVERRIDES,
    ),
  );
  parts.push(
    '<g fill="none" stroke-width="3" stroke-dasharray="10 8" opacity="0.9">' +
      '<rect x="1090" y="1276.7" width="153.3" height="153.3" rx="8" stroke="#294B3C"/>' +
      '<rect x="1396.7" y="1276.7" width="153.3" height="153.3" rx="8" stroke="#B65F4D"/>' +
    '</g>',
  );
  parts.push(text(1166, 1302, 'SW PROMOTED', 10, 800, A1A_PALETTE.green, 'middle'));
  parts.push(text(1473, 1302, 'SE NEXT SHEET', 10, 800, '#9A493D', 'middle'));

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * CARD_RENDER_SCALE },
  }).render().asPng();
  await writeFile(path.join(options.output, 'full-height-southwest-proof.png'), png);
}

async function renderFullHeightSoutheastProof(options: CliOptions): Promise<void> {
  const width = 1600;
  const height = 1600;
  const panelFill = '#ECE5D5';
  const panel = (x: number, y: number, w: number, h: number): string =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${panelFill}" ` +
    `stroke="${INK}" stroke-width="1.5" opacity="0.96"/>`;
  const fileOverrides = await southeastReviewFileOverrides(options);
  const legacySoutheast: ReadonlyArray<CompositionCell> = [
    [0, 0, 'low-profile-correction/low-se-corner.svg', null],
  ];
  const southwestSource: ReadonlyArray<CompositionCell> = [
    [
      0,
      0,
      PROMOTED_SOUTHWEST_CORNER.baseFile,
      PROMOTED_SOUTHWEST_CORNER.upperFile,
      PROMOTED_SOUTHWEST_CORNER.transform,
    ],
  ];
  const promotedSoutheast: ReadonlyArray<CompositionCell> = [
    [
      0,
      0,
      SOUTHEAST_WORKBENCH_BASE_FILE,
      SOUTHEAST_WORKBENCH_UPPER_FILE,
      PROMOTED_SOUTHEAST_CORNER.transform,
    ],
  ];
  const promotedBase: ReadonlyArray<CompositionCell> = [
    [
      0,
      0,
      SOUTHEAST_WORKBENCH_BASE_FILE,
      null,
      PROMOTED_SOUTHEAST_CORNER.transform,
    ],
  ];
  const promotedUpper: ReadonlyArray<CompositionCell> = [
    [
      0,
      0,
      SOUTHEAST_WORKBENCH_UPPER_FILE,
      null,
      PROMOTED_SOUTHEAST_CORNER.transform,
    ],
  ];
  const eastSocketCells: ReadonlyArray<CompositionCell> = [
    [
      0,
      0,
      PROMOTED_EAST_WALL_REUSE.baseFile,
      PROMOTED_EAST_WALL_REUSE.upperFile,
      PROMOTED_EAST_WALL_REUSE.transform,
    ],
    [
      0,
      1,
      SOUTHEAST_WORKBENCH_BASE_FILE,
      SOUTHEAST_WORKBENCH_UPPER_FILE,
      PROMOTED_SOUTHEAST_CORNER.transform,
    ],
  ];
  const southSocketCells: ReadonlyArray<CompositionCell> = [
    [0, 0, PROMOTED_SOUTH_WALL_REUSE.baseFile, PROMOTED_SOUTH_WALL_REUSE.upperFile],
    [
      1,
      0,
      SOUTHEAST_WORKBENCH_BASE_FILE,
      SOUTHEAST_WORKBENCH_UPPER_FILE,
      PROMOTED_SOUTHEAST_CORNER.transform,
    ],
  ];
  const parts: string[] = [
    `<rect width="${width}" height="${height}" rx="18" fill="${PANEL}"/>`,
    text(24, 34, 'FULL-HEIGHT SOUTHEAST CORNER — PROMOTED MIRRORED WRAP', 21, 800),
    text(24, 58, 'Canonical source-reuse checkpoint. The promoted southwest pair is reflected around x=64; the adjoining south cell owns the suppressed service seam. No southeast SVG or production registration is added.', 12, 600, MUTED),
    panel(20, 76, 500, 370),
    panel(540, 76, 500, 370),
    panel(1060, 76, 520, 370),
    panel(20, 466, 760, 390),
    panel(800, 466, 780, 390),
    panel(20, 876, 500, 700),
    panel(540, 876, 500, 700),
    panel(1060, 876, 520, 700),
    text(44, 108, 'LEGACY CONTROL — LOW SOUTHEAST', 14, 800),
    text(44, 132, 'Foreground-ownership reference only; its shallow geometry is superseded.', 11, 600, MUTED),
    text(564, 108, 'SOURCE — PROMOTED SOUTHWEST', 14, 800),
    text(564, 132, 'The accepted full/full molded wrap before reflection.', 11, 600, MUTED),
    text(1084, 108, 'PROMOTED — MIRROR / PASSES / DISTANCE', 14, 800),
    text(1084, 132, 'Accepted source reuse with the duplicate service tick suppressed.', 11, 600, MUTED),
    text(270, 418, 'LOW OWNERSHIP CONTROL', 11, 800, '#9A493D', 'middle'),
    text(790, 418, 'PROMOTED SW SOURCE', 11, 800, MUTED, 'middle'),
    text(1220, 418, 'FULL SE PROMOTED', 11, 800, A1A_PALETTE.green, 'middle'),
    text(1425, 250, 'BASE', 10, 800, MUTED, 'middle'),
    text(1520, 250, 'UPPER', 10, 800, MUTED, 'middle'),
    text(1445, 380, '90 px', 10, 700, MUTED, 'middle'),
    text(1530, 380, '40 px', 10, 700, MUTED, 'middle'),
    text(44, 498, 'EAST INGRESS — ENLARGED TILE SEAM', 14, 800),
    text(44, 522, 'The mirrored full-east profile enters from above without changing planes.', 11, 600, MUTED),
    text(430, 590, 'EAST SOCKET', 11, 800),
    text(430, 618, '• x4.5..72 envelope preserved', 11, 600, MUTED),
    text(430, 646, '• cream / coral / green registers meet', 11, 600, MUTED),
    text(430, 674, '• east structure remains behind the turn', 11, 600, MUTED),
    text(430, 730, 'Dashed guide marks the tile boundary.', 11, 700, A1A_PALETTE.green),
    text(824, 498, 'SOUTH INGRESS — ENLARGED TILE SEAM', 14, 800),
    text(824, 522, 'The shared full-south frontage enters unchanged from the west.', 11, 600, MUTED),
    text(1190, 590, 'SOUTH SOCKET', 11, 800),
    text(1190, 618, '• y56..123.5 envelope preserved', 11, 600, MUTED),
    text(1190, 646, '• front face wraps the entire heel', 11, 600, MUTED),
    text(1190, 674, '• one service seam, not a double tick', 11, 600, MUTED),
    text(1190, 730, 'Dashed guide marks the tile boundary.', 11, 700, A1A_PALETTE.green),
    text(44, 908, 'COMPACT TURN — ONE-CELL ARMS', 14, 800),
    text(44, 932, 'The wrap must remain legible when both adjoining runs are one cell.', 11, 600, MUTED),
    text(564, 908, 'LONG TURN — THREE-CELL ARMS', 14, 800),
    text(564, 932, 'The mirrored elbow must disappear into the repeated catalog rhythm.', 11, 600, MUTED),
    text(1084, 908, 'INSTALLED ROOM — SE PROMOTED', 14, 800),
    text(1084, 932, 'The accepted southeast reuse closes the reviewed equal-height room geometry.', 11, 600, MUTED),
    text(44, 1548, 'Gate: the one-cell turn reads as a continuous wall, not a corner appliance.', 11, 700, MUTED),
    text(564, 1548, 'Gate: east and south sockets stay flush at length without perspective drift.', 11, 700, MUTED),
    text(1084, 1548, 'Checkpoint: southeast is accepted; topology and production registration remain unchanged.', 11, 700, A1A_PALETTE.green),
  ];
  parts.push(
    await compositionWindow(
      options, legacySoutheast, 1, 1, 150, 150, 240, 240, fileOverrides,
    ),
  );
  parts.push(
    await compositionWindow(
      options, southwestSource, 1, 1, 670, 150, 240, 240, fileOverrides,
    ),
  );
  parts.push(
    await compositionWindow(
      options, promotedSoutheast, 1, 1, 1100, 150, 240, 240, fileOverrides,
    ),
  );
  parts.push(
    await compositionWindow(
      options, promotedBase, 1, 1, 1380, 150, 90, 90, fileOverrides,
    ),
  );
  parts.push(
    await compositionWindow(
      options, promotedUpper, 1, 1, 1475, 150, 90, 90, fileOverrides,
    ),
  );
  parts.push(
    await compositionWindow(
      options, promotedSoutheast, 1, 1, 1400, 270, 90, 90, fileOverrides,
    ),
  );
  parts.push(
    await compositionWindow(
      options, promotedSoutheast, 1, 1, 1510, 300, 40, 40, fileOverrides,
    ),
  );
  parts.push(
    await compositionWindow(
      options, eastSocketCells, 1, 2, 70, 540, 312, 312, fileOverrides, '0 64 128 128',
    ),
  );
  parts.push(
    `<path d="M70 696H382" fill="none" stroke="${A1A_PALETTE.coral}" ` +
    'stroke-width="2" stroke-dasharray="7 6" opacity="0.75"/>',
  );
  parts.push(
    await compositionWindow(
      options, southSocketCells, 2, 1, 840, 540, 312, 312, fileOverrides, '64 0 128 128',
    ),
  );
  parts.push(
    `<path d="M996 540V852" fill="none" stroke="${A1A_PALETTE.coral}" ` +
    'stroke-width="2" stroke-dasharray="7 6" opacity="0.75"/>',
  );
  parts.push(
    await compositionWindow(
      options, southeastInstalledCells(1, 1), 2, 2, 90, 980, 360, 360, fileOverrides,
    ),
  );
  parts.push(
    await compositionWindow(
      options, southeastInstalledCells(3, 3), 4, 4, 600, 970, 380, 380, fileOverrides,
    ),
  );
  parts.push(
    await compositionWindow(
      options, PROMOTED_SOUTHEAST_ROOM_CELLS, 3, 3, 1090, 970, 460, 460,
      fileOverrides,
    ),
  );
  parts.push(
    `<rect x="1396.7" y="1276.7" width="153.3" height="153.3" rx="8" fill="none" ` +
    'stroke="#294B3C" stroke-width="3" stroke-dasharray="10 8" opacity="0.9"/>',
  );
  parts.push(text(1473, 1302, 'SE PROMOTED', 10, 800, A1A_PALETTE.green, 'middle'));

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * CARD_RENDER_SCALE },
  }).render().asPng();
  await writeFile(path.join(options.output, 'full-height-southeast-proof.png'), png);
}

async function renderEqualHeightCorridorGate(options: CliOptions): Promise<void> {
  const width = 1600;
  const height = 1120;
  const panelFill = '#ECE5D5';
  const panel = (x: number, y: number, w: number, h: number): string =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${panelFill}" ` +
    `stroke="${INK}" stroke-width="1.5" opacity="0.96"/>`;
  const fileOverrides = await southeastReviewFileOverrides(options);
  const parts: string[] = [
    `<rect width="${width}" height="${height}" rx="18" fill="${PANEL}"/>`,
    text(24, 34, 'EQUAL-HEIGHT WALL KIT — ACCEPTED 3×8 NARROW-CORRIDOR GATE', 21, 800),
    text(24, 58, 'Accepted source reuse only · one-cell aisle · short horizontal runs · long vertical runs', 12, 600, MUTED),
    panel(20, 76, 560, 1024),
    panel(600, 76, 980, 400),
    panel(600, 496, 980, 604),
    text(44, 108, '90 PX / CELL — ACCEPTED ENCLOSURE', 14, 800),
    text(44, 132, 'All four turns, one-cell north/south bodies, and six-cell west/east runs.', 11, 600, MUTED),
    text(300, 928, '1-CELL CLEAR AISLE · N/S = 1 BODY CELL · W/E = 6 BODY CELLS', 11, 800, A1A_PALETTE.green, 'middle'),
    text(44, 968, '• one uninterrupted outer contour; no corner reads as an end cap', 11, 650, MUTED),
    text(44, 996, '• cream / coral / green / plinth registers turn through every join', 11, 650, MUTED),
    text(44, 1024, '• short horizontal bodies remain visible between their elbows', 11, 650, MUTED),
    text(44, 1052, '• long vertical runs stay parallel without cumulative drift', 11, 650, MUTED),
    text(624, 108, '40 PX / CELL — ACCEPTED SILHOUETTE', 14, 800),
    text(624, 132, 'The complete enclosure must survive at maximum-useful distance.', 11, 600, MUTED),
    text(800, 174, 'ONE ENCLOSURE, NOT FOUR STRIPS', 12, 800, A1A_PALETTE.green),
    text(800, 214, '• equal west / east perceived mass', 11, 650, MUTED),
    text(800, 244, '• open aisle remains unmistakable', 11, 650, MUTED),
    text(800, 274, '• north / south bodies are not swallowed', 11, 650, MUTED),
    text(800, 304, '• material hierarchy survives without labels', 11, 650, MUTED),
    text(800, 350, 'Service detail may soften here; silhouette and', 11, 600, MUTED),
    text(800, 372, 'directional mass may not.', 11, 600, MUTED),
    text(624, 528, 'FOUR TURNS — ONE CONTINUOUS ENVELOPE', 14, 800),
    text(624, 552, 'Each crop includes both adjoining straight cells; dashed guides mark tile boundaries.', 11, 600, MUTED),
    text(730, 584, 'NW · NORTH → WEST', 10, 800, MUTED, 'middle'),
    text(965, 584, 'NE · NORTH → EAST', 10, 800, MUTED, 'middle'),
    text(1200, 584, 'SW · WEST → SOUTH', 10, 800, MUTED, 'middle'),
    text(1435, 584, 'SE · EAST → SOUTH', 10, 800, MUTED, 'middle'),
    text(624, 838, 'ACCEPTED SYSTEM CONTRACT', 12, 800, A1A_PALETTE.green),
    text(624, 872, '• every socket closes with no alpha gap or doubled dark seam', 11, 650, MUTED),
    text(624, 902, '• material bands visibly turn; they do not merely touch at the boundary', 11, 650, MUTED),
    text(624, 932, '• south frontage owns both lower heels; side planes stop behind it', 11, 650, MUTED),
    text(1080, 872, '• repeated service seams appear once per owner cell', 11, 650, MUTED),
    text(1080, 902, '• mirrored southeast adds no duplicate service tick', 11, 650, MUTED),
    text(1080, 932, '• no low-profile source or new frame identity is present', 11, 650, MUTED),
    text(624, 1000, 'ACCEPTED BASELINE', 11, 800, MUTED),
    text(624, 1028, 'All authored source rows accepted · synthetic assemblies remain proof-only.', 12, 750, A1A_PALETTE.green),
  ];

  parts.push(
    await compositionWindow(
      options,
      EQUAL_HEIGHT_CORRIDOR_CELLS,
      EQUAL_HEIGHT_CORRIDOR_GATE.columns,
      EQUAL_HEIGHT_CORRIDOR_GATE.rows,
      165,
      180,
      270,
      720,
      fileOverrides,
      undefined,
      false,
    ),
  );
  parts.push(
    await compositionWindow(
      options,
      EQUAL_HEIGHT_CORRIDOR_CELLS,
      EQUAL_HEIGHT_CORRIDOR_GATE.columns,
      EQUAL_HEIGHT_CORRIDOR_GATE.rows,
      650,
      140,
      120,
      320,
      fileOverrides,
      undefined,
      false,
    ),
  );

  const joins: ReadonlyArray<readonly [CorridorJoin, number]> = [
    ['northwest', 630],
    ['northeast', 865],
    ['southwest', 1100],
    ['southeast', 1335],
  ];
  for (const [join, x] of joins) {
    parts.push(
      await compositionWindow(
        options,
        corridorJoinCells(join),
        2,
        2,
        x,
        600,
        200,
        200,
        fileOverrides,
      ),
    );
    parts.push(
      `<path d="M${x + 100} 600V800 M${x} 700H${x + 200}" fill="none" ` +
      `stroke="${A1A_PALETTE.coral}" stroke-width="2" stroke-dasharray="7 6" opacity="0.75"/>`,
    );
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * CARD_RENDER_SCALE },
  }).render().asPng();
  await writeFile(path.join(options.output, `${EQUAL_HEIGHT_CORRIDOR_GATE.stem}.png`), png);
}

async function renderEqualHeightHorizontalOpenPocketTJunctionGate(
  options: CliOptions,
  root: string,
): Promise<void> {
  const gate = EQUAL_HEIGHT_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE;
  const width = 1600;
  const height = 2122;
  const panelFill = '#ECE5D5';
  const panel = (x: number, y: number, w: number, h: number): string =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${panelFill}" ` +
      `stroke="${INK}" stroke-width="1.5" opacity="0.96"/>`;
  const fileOverrides: CompositionFileOverrides = {
    ...await verticalTerminusProposalFileOverrides(options, root),
    ...await horizontalOpenPocketTJunctionProposalFileOverrides(options, root),
  };
  const source = (
    maskIndex: HorizontalOpenPocketTJunctionMask,
    layer: 'base' | 'upper' | 'composed' = 'composed',
  ): readonly CompositionCell[] =>
    [horizontalOpenPocketTJunctionCandidateCell(maskIndex, 'west-source', 0, 0, layer)];
  const parts: string[] = [
    `<rect width="${width}" height="${height}" rx="18" fill="${PANEL}"/>`,
    text(24, 38, 'QUOTACO EQUAL-HEIGHT WALLS — ACCEPTED HORIZONTAL-SPINE OPEN-POCKET T FAMILY', 23, 820),
    text(24, 68, 'Owner-accepted proof layer · two direct fixed-light sources · lateral mirror remains registration evidence only', 13, 650, MUTED),
    text(1576, 38, 'MASKS 11 / 14 · ACCEPTED', 11, 820, '#294B3C', 'end'),
    text(1576, 62, '19 direct · 14 derived · 14 synthetic · 0 unresolved', 10, 700, MUTED, 'end'),

    panel(20, 92, 1560, 440),
    text(44, 126, 'AUTHORED SOURCE READ — 240 / 90 / 40 PX', 14, 820),
    text(44, 150, 'The foreground and rear turns pick their own plane ownership. Neither is a rotated reuse of the other.', 10, 650, MUTED),

    panel(20, 552, 1560, 480),
    text(44, 586, 'COMPACT SOCKET GATE — ONE-CELL ARMS AT 90 PX / CELL', 14, 820),
    text(44, 610, 'Each authored candidate must join both horizontal termini and the selected west/east vertical registration without becoming a cap, post, or patch.', 10, 650, MUTED),

    panel(20, 1052, 1560, 670),
    text(44, 1086, 'SIX-CELL EXTENT GATE — 40 PX / CELL ON LIGHT AND DARK FLOOR', 14, 820),
    text(44, 1110, 'The same hub must survive a full horizontal spine and vertical branch; the dashed cell is the only new art in each assembly.', 10, 650, MUTED),

    panel(20, 1742, 1560, 360),
    text(44, 1778, 'READING CONTRACT', 14, 820),
    text(824, 1778, 'PROOF BOUNDARY', 14, 820),
  ];

  parts.push(text(190, 182, 'MASK_11 · OPEN SOUTH · FOREGROUND TURN', 10, 820, '#294B3C', 'middle'));
  parts.push(await compositionWindow(options, source(11), 1, 1, 70, 198, 240, 240, fileOverrides, undefined, false));
  parts.push(await compositionWindow(options, source(11, 'base'), 1, 1, 338, 198, 90, 90, fileOverrides, undefined, false));
  parts.push(text(383, 306, 'BASE · 90', 9, 760, MUTED, 'middle'));
  parts.push(await compositionWindow(options, source(11, 'upper'), 1, 1, 338, 324, 90, 90, fileOverrides, undefined, false));
  parts.push(text(383, 432, 'UPPER · 90', 9, 760, MUTED, 'middle'));
  parts.push(await compositionWindow(options, source(11), 1, 1, 450, 324, 40, 40, fileOverrides, undefined, false));
  parts.push(text(470, 382, '40 PX', 8, 760, MUTED, 'middle'));

  parts.push(text(800, 216, 'TWO AXIAL MASTERS', 14, 850, '#B65F4D', 'middle'));
  parts.push(text(800, 254, 'mask_11: north branch passes behind the south frontage', 10, 700, MUTED, 'middle'));
  parts.push(text(800, 286, 'mask_14: cream coping bridges into the outgoing south branch', 10, 700, MUTED, 'middle'));
  parts.push(text(800, 334, 'PASS: one molded turn · continuous cream/coral/green hierarchy', 10, 760, '#294B3C', 'middle'));
  parts.push(text(800, 368, 'REJECT: CENTER PYLON · BURIED RAIL · DISCONNECTED BRANCH', 10, 820, '#9A493D', 'middle'));
  parts.push(text(800, 414, 'X mirror below is comparison evidence, not an accepted derivation.', 9, 700, '#4E7D79', 'middle'));

  parts.push(text(1410, 182, 'MASK_14 · OPEN NORTH · REAR TURN', 10, 820, '#294B3C', 'middle'));
  parts.push(await compositionWindow(options, source(14), 1, 1, 1290, 198, 240, 240, fileOverrides, undefined, false));
  parts.push(await compositionWindow(options, source(14, 'base'), 1, 1, 1172, 198, 90, 90, fileOverrides, undefined, false));
  parts.push(text(1217, 306, 'BASE · 90', 9, 760, MUTED, 'middle'));
  parts.push(await compositionWindow(options, source(14, 'upper'), 1, 1, 1172, 324, 90, 90, fileOverrides, undefined, false));
  parts.push(text(1217, 432, 'UPPER · 90', 9, 760, MUTED, 'middle'));
  parts.push(await compositionWindow(options, source(14), 1, 1, 1110, 324, 40, 40, fileOverrides, undefined, false));
  parts.push(text(1130, 382, '40 PX', 8, 760, MUTED, 'middle'));

  const compactCases: ReadonlyArray<readonly [number, HorizontalOpenPocketTJunctionMask, HorizontalOpenPocketTJunctionFacing, string]> = [
    [45, 11, 'west-source', '11 · WEST-DIRECT'],
    [420, 11, 'east-mirror-review', '11 · EAST-MIRROR CHECK'],
    [835, 14, 'west-source', '14 · WEST-DIRECT'],
    [1210, 14, 'east-mirror-review', '14 · EAST-MIRROR CHECK'],
  ];
  for (const [x, maskIndex, facing, label] of compactCases) {
    parts.push(text(x + 135, 642, label, 9, 820, facing === 'west-source' ? '#294B3C' : '#4E7D79', 'middle'));
    parts.push(await compositionWindow(
      options,
      horizontalOpenPocketTJunctionCompactCells(maskIndex, facing),
      3,
      3,
      x,
      660,
      270,
      270,
      fileOverrides,
    ));
    parts.push(`<rect x="${x + 90}" y="750" width="90" height="90" fill="none" stroke="#B65F4D" stroke-width="2" stroke-dasharray="7 5"/>`);
    parts.push(text(x + 135, 958, maskIndex === 11 ? '02 / 11 / 08 + 04' : '02 / 14 / 08 + 01', 9, 760, MUTED, 'middle'));
  }
  parts.push(text(800, 998, 'Pass only if all three sockets disappear into ordinary accepted neighbors at this minimum footprint.', 9, 720, '#294B3C', 'middle'));

  const longRuns: ReadonlyArray<readonly [number, HorizontalOpenPocketTJunctionFacing, string, string]> = [
    [80, 'west-source', 'WEST · LIGHT', A1A_PALETTE.floor],
    [460, 'east-mirror-review', 'EAST CHECK · LIGHT', A1A_PALETTE.floor],
    [900, 'west-source', 'WEST · DARK', A1A_PALETTE.charcoal],
    [1280, 'east-mirror-review', 'EAST CHECK · DARK', A1A_PALETTE.charcoal],
  ];
  for (const [rowIndex, maskIndex] of ([11, 14] as const).entries()) {
    const y = rowIndex === 0 ? 1135 : 1425;
    for (const [x, facing, label, floorFill] of longRuns) {
      parts.push(await compositionWindow(
        options,
        horizontalOpenPocketTJunctionLongCells(maskIndex, facing),
        6,
        6,
        x,
        y,
        240,
        240,
        fileOverrides,
        undefined,
        true,
        floorFill,
      ));
      const hubY = maskIndex === 11 ? y + 200 : y;
      parts.push(`<rect x="${x + 80}" y="${hubY}" width="40" height="40" fill="none" stroke="#B65F4D" stroke-width="1.5" stroke-dasharray="5 4"/>`);
      parts.push(text(x + 120, y + 258, `MASK_${maskIndex} · ${label}`, 8, 820, floorFill === A1A_PALETTE.floor ? MUTED : '#A59E8F', 'middle'));
    }
  }

  const readingLines = [
    'One continuous east-west wall before and after the branch',
    'The vertical socket vanishes into the accepted full-height wall family',
    'Cream, coral, and green turn once; no second cap or internal rail survives',
    'The same silhouette reads at one-cell arms and six-cell extents',
  ];
  for (const [index, line] of readingLines.entries()) {
    parts.push(text(44, 1820 + index * 42, `• ${line}`, 10, 700, index < 3 ? '#294B3C' : MUTED));
  }
  const boundaryLines: ReadonlyArray<readonly [string, string]> = [
    ['OWNER ACCEPTED · HORIZONTAL OPEN-POCKET T', '#294B3C'],
    ['mask_11 / mask_14 · accepted direct proof sources', MUTED],
    ['two fixed-light axial masters · no rotation or Y mirror', MUTED],
    ['X MIRROR REMAINS REGISTRATION EVIDENCE ONLY', '#4E7D79'],
    ['PROOF LEDGER ONLY · NO EXPORT / ATLAS / SCHEMA / UNITY', '#9A493D'],
  ];
  for (const [index, [line, color]] of boundaryLines.entries()) {
    parts.push(text(824, 1820 + index * 42, line, index === 0 || index >= 3 ? 10 : 9, index === 0 || index >= 3 ? 820 : 680, color));
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * CARD_RENDER_SCALE },
  }).render().asPng();
  await writeFile(path.join(options.output, `${gate.stem}.png`), png);
}

async function renderEqualHeightOpenPocketTJunctionGate(
  options: CliOptions,
  root: string,
): Promise<void> {
  const gate = EQUAL_HEIGHT_OPEN_POCKET_T_JUNCTION_GATE;
  const width = 1600;
  const height = 1900;
  const panelFill = '#ECE5D5';
  const panel = (x: number, y: number, w: number, h: number): string =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${panelFill}" ` +
      `stroke="${INK}" stroke-width="1.5" opacity="0.96"/>`;
  const fileOverrides: CompositionFileOverrides = {
    ...await verticalTerminusProposalFileOverrides(options, root),
    ...await openPocketTJunctionProposalFileOverrides(options, root),
  };
  const west = (layer: 'base' | 'upper' | 'composed' = 'composed'): readonly CompositionCell[] =>
    [openPocketTJunctionCandidateCell(7, 0, 0, layer)];
  const east = (layer: 'base' | 'upper' | 'composed' = 'composed'): readonly CompositionCell[] =>
    [openPocketTJunctionCandidateCell(13, 0, 0, layer)];
  const parts: string[] = [
    `<rect width="${width}" height="${height}" rx="18" fill="${PANEL}"/>`,
    text(24, 38, 'QUOTACO EQUAL-HEIGHT WALLS — ACCEPTED OPEN-POCKET T-JUNCTION FAMILY', 24, 820),
    text(24, 68, 'Owner-accepted proof layer · one authored west-side hub · one filtered whole-cell X mirror', 13, 650, MUTED),
    text(1576, 38, 'MASKS 7 / 13 ACCEPTED', 11, 820, '#294B3C', 'end'),
    text(1576, 62, '19 direct · 14 derived · 14 synthetic · 0 unresolved', 10, 700, MUTED, 'end'),

    panel(20, 92, 1560, 500),
    text(44, 126, 'THE HUB ITSELF — 240 PX SOURCE READ', 14, 820),
    text(44, 150, 'The stem remains an ordinary full-height wall. Its branch opens into the adjoining horizontal wall without a cap, post, or doubled inner face.', 10, 650, MUTED),

    panel(20, 612, 1560, 460),
    text(44, 646, 'COMPACT SOCKET GATE — ONE-CELL ARMS AT 90 PX / CELL', 14, 820),
    text(44, 670, 'The smallest legal T must read as one catalog unit; short rooms cannot be penalized for lacking a decorative run-up.', 10, 650, MUTED),

    panel(20, 1092, 1560, 500),
    text(44, 1126, 'LONG BRANCH GATE — SIX-CELL EXTENTS AT 40 PX / CELL', 14, 820),
    text(44, 1150, 'The same source must carry a full branch and stem on light and dark floors without an accidental terminus or doubled boundary tick.', 10, 650, MUTED),

    panel(20, 1612, 1560, 264),
    text(44, 1648, 'READING CONTRACT', 14, 820),
    text(824, 1648, 'PROOF BOUNDARY', 14, 820),
  ];

  parts.push(text(190, 182, 'MASK_7 · AUTHORED WEST SOURCE', 10, 820, '#294B3C', 'middle'));
  parts.push(await compositionWindow(options, west(), 1, 1, 70, 198, 240, 240, fileOverrides, undefined, false));
  parts.push(text(190, 462, '240 PX · N / E / S SOCKETS', 9, 780, MUTED, 'middle'));
  parts.push(await compositionWindow(options, west('base'), 1, 1, 338, 205, 110, 110, fileOverrides, undefined, false));
  parts.push(text(393, 332, 'BASE', 9, 820, MUTED, 'middle'));
  parts.push(await compositionWindow(options, west('upper'), 1, 1, 338, 352, 110, 110, fileOverrides, undefined, false));
  parts.push(text(393, 480, 'UPPER', 9, 820, MUTED, 'middle'));

  parts.push(text(800, 230, 'ONE MOLDED T', 14, 850, '#B65F4D', 'middle'));
  parts.push(text(800, 266, 'cream coping turns once', 10, 700, MUTED, 'middle'));
  parts.push(text(800, 294, 'coral register stays continuous', 10, 700, MUTED, 'middle'));
  parts.push(text(800, 322, 'green frontage owns the open crook', 10, 700, MUTED, 'middle'));
  parts.push(text(800, 350, 'no central pylon or terminal cap', 10, 700, MUTED, 'middle'));
  parts.push('<path d="M510 362H660 M940 362H1090" fill="none" stroke="#B65F4D" stroke-width="3" stroke-linecap="round"/>');

  parts.push(await compositionWindow(options, east('base'), 1, 1, 1152, 205, 110, 110, fileOverrides, undefined, false));
  parts.push(text(1207, 332, 'FILTERED BASE', 9, 820, MUTED, 'middle'));
  parts.push(await compositionWindow(options, east('upper'), 1, 1, 1152, 352, 110, 110, fileOverrides, undefined, false));
  parts.push(text(1207, 480, 'FILTERED UPPER', 9, 820, MUTED, 'middle'));
  parts.push(text(1410, 182, 'MASK_13 · FILTERED MIRROR-X', 10, 820, '#4E7D79', 'middle'));
  parts.push(await compositionWindow(options, east(), 1, 1, 1290, 198, 240, 240, fileOverrides, undefined, false));
  parts.push(text(1410, 462, '240 PX · N / S / W SOCKETS', 9, 780, MUTED, 'middle'));

  parts.push(text(295, 704, 'WEST OPEN POCKET', 10, 820, '#294B3C', 'middle'));
  parts.push(await compositionWindow(options, openPocketTJunctionCompactCells('west'), 3, 3, 160, 720, 270, 270, fileOverrides));
  parts.push('<rect x="250" y="810" width="90" height="90" fill="none" stroke="#B65F4D" stroke-width="2" stroke-dasharray="7 5"/>');
  parts.push(text(295, 1016, '04 / 07 / 01 + 08', 9, 760, MUTED, 'middle'));
  parts.push(text(800, 770, 'PASS WHEN', 12, 840, '#B65F4D', 'middle'));
  parts.push(text(800, 812, 'all three sockets vanish into their neighbors', 10, 700, MUTED, 'middle'));
  parts.push(text(800, 846, 'the elbow crooks remain open floor, not wall fill', 10, 700, MUTED, 'middle'));
  parts.push(text(800, 880, 'the center reads as a connector, not decoration', 10, 700, MUTED, 'middle'));
  parts.push(text(800, 928, 'REJECT: CAP · POST · PATCH · DOUBLE FACE', 10, 820, '#9A493D', 'middle'));
  parts.push(text(1305, 704, 'EAST OPEN POCKET', 10, 820, '#4E7D79', 'middle'));
  parts.push(await compositionWindow(options, openPocketTJunctionCompactCells('east'), 3, 3, 1170, 720, 270, 270, fileOverrides));
  parts.push('<rect x="1260" y="810" width="90" height="90" fill="none" stroke="#B65F4D" stroke-width="2" stroke-dasharray="7 5"/>');
  parts.push(text(1305, 1016, '04 / 13 / 01 + 02', 9, 760, MUTED, 'middle'));

  const longRuns: ReadonlyArray<readonly [number, 'west' | 'east', string, string]> = [
    [80, 'west', 'WEST · LIGHT', A1A_PALETTE.floor],
    [460, 'east', 'EAST · LIGHT', A1A_PALETTE.floor],
    [900, 'west', 'WEST · DARK', A1A_PALETTE.charcoal],
    [1280, 'east', 'EAST · DARK', A1A_PALETTE.charcoal],
  ];
  for (const [x, side, label, floorFill] of longRuns) {
    parts.push(await compositionWindow(
      options,
      openPocketTJunctionLongCells(side),
      6,
      6,
      x,
      1190,
      240,
      240,
      fileOverrides,
      undefined,
      true,
      floorFill,
    ));
    const hubX = side === 'west' ? x : x + 200;
    parts.push(`<rect x="${hubX}" y="1270" width="40" height="40" fill="none" stroke="#B65F4D" stroke-width="1.5" stroke-dasharray="5 4"/>`);
    parts.push(text(x + 120, 1458, label, 9, 820, floorFill === A1A_PALETTE.floor ? MUTED : '#A59E8F', 'middle'));
  }
  parts.push(text(800, 1506, '40 PX / CELL · SIX-CELL VERTICAL STEM · SIX-CELL HORIZONTAL EXTENT', 9, 760, '#294B3C', 'middle'));
  parts.push(text(800, 1540, 'The dashed frame marks the same single authored cell in every context.', 9, 680, MUTED, 'middle'));

  const readingLines = [
    'One continuous vertical wall before and after the branch',
    'One continuous horizontal wall from the hub to its terminus',
    'Tri-tone frontage turns through the junction without a second cap',
    'Compact and long layouts preserve the same silhouette',
  ];
  for (const [index, line] of readingLines.entries()) {
    parts.push(text(44, 1688 + index * 36, `• ${line}`, 10, 700, index < 3 ? '#294B3C' : MUTED));
  }
  const boundaryLines: ReadonlyArray<readonly [string, string]> = [
    ['OWNER ACCEPTED · OPEN-POCKET T-JUNCTION', '#294B3C'],
    ['mask_7 · direct accepted proof source', MUTED],
    ['mask_13 · accepted filtered whole-cell mirror-X', MUTED],
    ['PROOF LEDGER · 20 SYNTHETIC CANDIDATES REMAIN', '#4E7D79'],
    ['NO EXPORT / ATLAS / SCHEMA / UNITY', '#9A493D'],
  ];
  for (const [index, [line, color]] of boundaryLines.entries()) {
    parts.push(text(824, 1688 + index * 34, line, index === 0 || index >= 3 ? 10 : 9, index === 0 || index >= 3 ? 820 : 680, color));
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * CARD_RENDER_SCALE },
  }).render().asPng();
  await writeFile(path.join(options.output, `${gate.stem}.png`), png);
}

function acceptedFilledBlockCell(
  maskIndex: 16 | 20 | 26 | 34,
  col: number,
  row: number,
): CompositionCell {
  const cell = EQUAL_HEIGHT_THICK_WALL_BLOCK_GATE.cells.find(
    (candidate) => candidate.maskIndex === maskIndex,
  );
  if (!cell) throw new Error(`Accepted thick-wall source missing for mask_${maskIndex}`);
  return [
    col,
    row,
    maskIndex === 34 ? THICK_WALL_SOUTHEAST_BASE_FILE : cell.baseFile,
    maskIndex === 34 ? THICK_WALL_SOUTHEAST_UPPER_FILE : cell.upperFile,
    cell.transform,
  ];
}

type WestPartialTJunctionMatrixMask =
  | 1 | 4 | 5
  | 16 | 17 | 20 | 21 | 24 | 26 | 31 | 34 | 38 | 42;

function westPartialTJunctionCandidateCell(
  maskIndex: EqualHeightWestPartialTJunctionMask,
  col: number,
  row: number,
  layer: 'base' | 'upper' | 'composed' = 'composed',
): CompositionCell {
  const candidate = EQUAL_HEIGHT_WEST_PARTIAL_T_JUNCTION_GATE.candidates.find(
    ({ maskIndex: candidateIndex }) => candidateIndex === maskIndex,
  );
  if (!candidate) throw new Error(`Unknown west partial T-junction mask_${maskIndex}`);
  if (layer === 'base') return [col, row, candidate.baseFile, null];
  if (layer === 'upper') return [col, row, EMPTY_WORKBENCH_FILE, candidate.upperFile];
  return [col, row, candidate.baseFile, candidate.upperFile];
}

function westPartialTJunctionMaskCell(
  maskIndex: WestPartialTJunctionMatrixMask,
  col: number,
  row: number,
): CompositionCell {
  if (maskIndex === 17 || maskIndex === 21) {
    return westPartialTJunctionCandidateCell(maskIndex, col, row);
  }
  if (maskIndex === 1 || maskIndex === 4) {
    return openPocketVerticalEndCell(maskIndex, 'west', col, row);
  }
  if (maskIndex === 5) {
    return [
      col,
      row,
      'full_w_straight-base.svg',
      'full_w_straight-upper.svg',
    ];
  }
  if (maskIndex === 16 || maskIndex === 20 || maskIndex === 26 || maskIndex === 34) {
    return acceptedFilledBlockCell(maskIndex, col, row);
  }
  if (maskIndex === 24 || maskIndex === 42) {
    const candidate = EQUAL_HEIGHT_THICK_WALL_REPEAT_GATE.candidates.find(
      ({ maskIndex: candidateIndex }) => candidateIndex === maskIndex,
    );
    if (!candidate) throw new Error(`Accepted repeat source missing for mask_${maskIndex}`);
    return thickWallRepeatCandidateCell(candidate, col, row);
  }
  const candidate = EQUAL_HEIGHT_THICK_WALL_HORIZONTAL_REPEAT_GATE.candidates.find(
    ({ maskIndex: candidateIndex }) => candidateIndex === maskIndex,
  );
  if (!candidate) throw new Error(`Accepted horizontal repeat source missing for mask_${maskIndex}`);
  return thickWallHorizontalRepeatCandidateCell(candidate, col, row);
}

function westPartialTJunctionMatrixCells(
  matrix: readonly (readonly (number | null)[])[],
): readonly CompositionCell[] {
  const cells: CompositionCell[] = [];
  for (const [row, masks] of matrix.entries()) {
    for (const [col, maskIndex] of masks.entries()) {
      if (maskIndex === null) continue;
      cells.push(westPartialTJunctionMaskCell(
        maskIndex as WestPartialTJunctionMatrixMask,
        col,
        row,
      ));
    }
  }
  return cells;
}

async function westPartialTJunctionMatrixWindow(
  options: CliOptions,
  matrix: readonly (readonly (number | null)[])[],
  x: number,
  y: number,
  width: number,
  height: number,
  fileOverrides: CompositionFileOverrides,
  floorFill: string = A1A_PALETTE.floor,
  showGrid = true,
): Promise<string> {
  return compositionWindow(
    options,
    westPartialTJunctionMatrixCells(matrix),
    matrix[0].length,
    matrix.length,
    x,
    y,
    width,
    height,
    fileOverrides,
    undefined,
    showGrid,
    floorFill,
  );
}

function westPartialTJunctionCandidateFrame(
  x: number,
  y: number,
  size: number,
  color: string,
): string {
  return `<rect x="${x + 2}" y="${y + 2}" width="${size - 4}" height="${size - 4}" ` +
    `rx="3" fill="none" stroke="${color}" stroke-width="2.2" stroke-dasharray="7 4"/>`;
}

type EastPartialTJunctionMatrixMask =
  | 1 | 4 | 5
  | 16 | 20 | 26 | 27 | 31 | 34 | 36 | 38;

function eastPartialTJunctionCandidateCell(
  maskIndex: EqualHeightEastPartialTJunctionMask,
  col: number,
  row: number,
  layer: 'base' | 'upper' | 'composed' = 'composed',
  rawMirror = false,
): CompositionCell {
  const candidate = EQUAL_HEIGHT_EAST_PARTIAL_T_JUNCTION_GATE.candidates.find(
    ({ maskIndex: candidateIndex }) => candidateIndex === maskIndex,
  );
  if (!candidate) throw new Error(`Unknown east partial T-junction mask_${maskIndex}`);
  const baseFile = maskIndex === 36 && !rawMirror
    ? EAST_PARTIAL_T_JUNCTION_FILTERED_BASE_FILE
    : candidate.baseFile;
  const upperFile = maskIndex === 36 && !rawMirror
    ? EAST_PARTIAL_T_JUNCTION_FILTERED_UPPER_FILE
    : candidate.upperFile;
  if (layer === 'base') return [col, row, baseFile, null, 'mirror-x'];
  if (layer === 'upper') {
    return [col, row, EMPTY_WORKBENCH_FILE, upperFile, 'mirror-x'];
  }
  return [col, row, baseFile, upperFile, 'mirror-x'];
}

function eastPartialTJunctionMaskCell(
  maskIndex: EastPartialTJunctionMatrixMask,
  col: number,
  row: number,
): CompositionCell {
  if (maskIndex === 36 || maskIndex === 27) {
    return eastPartialTJunctionCandidateCell(maskIndex, col, row);
  }
  if (maskIndex === 1 || maskIndex === 4) {
    return openPocketVerticalEndCell(maskIndex, 'east', col, row);
  }
  if (maskIndex === 5) {
    return [
      col,
      row,
      'full_w_straight-base.svg',
      'full_w_straight-upper.svg',
      'mirror-x',
    ];
  }
  if (maskIndex === 16 || maskIndex === 20 || maskIndex === 26 || maskIndex === 34) {
    return acceptedFilledBlockCell(maskIndex, col, row);
  }
  const candidate = EQUAL_HEIGHT_THICK_WALL_HORIZONTAL_REPEAT_GATE.candidates.find(
    ({ maskIndex: candidateIndex }) => candidateIndex === maskIndex,
  );
  if (!candidate) throw new Error(`Accepted horizontal repeat source missing for mask_${maskIndex}`);
  return thickWallHorizontalRepeatCandidateCell(candidate, col, row);
}

function eastPartialTJunctionMatrixCells(
  matrix: readonly (readonly (number | null)[])[],
): readonly CompositionCell[] {
  const cells: CompositionCell[] = [];
  for (const [row, masks] of matrix.entries()) {
    for (const [col, maskIndex] of masks.entries()) {
      if (maskIndex === null) continue;
      cells.push(eastPartialTJunctionMaskCell(
        maskIndex as EastPartialTJunctionMatrixMask,
        col,
        row,
      ));
    }
  }
  return cells;
}

async function eastPartialTJunctionMatrixWindow(
  options: CliOptions,
  matrix: readonly (readonly (number | null)[])[],
  x: number,
  y: number,
  width: number,
  height: number,
  fileOverrides: CompositionFileOverrides,
  floorFill: string = A1A_PALETTE.floor,
  showGrid = true,
): Promise<string> {
  return compositionWindow(
    options,
    eastPartialTJunctionMatrixCells(matrix),
    matrix[0].length,
    matrix.length,
    x,
    y,
    width,
    height,
    fileOverrides,
    undefined,
    showGrid,
    floorFill,
  );
}

type HorizontalPartialTJunctionMatrixMask =
  | 1 | 2 | 4 | 5 | 8 | 10
  | 16 | 17 | 18 | 20 | 21 | 22 | 26 | 27 | 28
  | 31 | 34 | 35 | 36 | 38;

function horizontalPartialTJunctionCandidateCell(
  maskIndex: EqualHeightHorizontalPartialTJunctionMask,
  col: number,
  row: number,
  layer: 'base' | 'upper' | 'composed' = 'composed',
  rawMirror = false,
): CompositionCell {
  const candidate = EQUAL_HEIGHT_HORIZONTAL_PARTIAL_T_JUNCTION_GATE.candidates.find(
    ({ maskIndex: candidateIndex }) => candidateIndex === maskIndex,
  );
  if (!candidate) throw new Error(`Unknown horizontal partial T-junction mask_${maskIndex}`);
  const filteredMirror = maskIndex === 35 && !rawMirror;
  const baseFile = filteredMirror
    ? HORIZONTAL_PARTIAL_T_JUNCTION_FILTERED_BASE_FILE
    : candidate.baseFile;
  const upperFile = filteredMirror
    ? HORIZONTAL_PARTIAL_T_JUNCTION_FILTERED_UPPER_FILE
    : candidate.upperFile;
  if (layer === 'base') return [col, row, baseFile, null, candidate.transform];
  if (layer === 'upper') {
    return [col, row, EMPTY_WORKBENCH_FILE, upperFile, candidate.transform];
  }
  return [col, row, baseFile, upperFile, candidate.transform];
}

function horizontalPartialTJunctionMatrixCell(
  maskIndex: HorizontalPartialTJunctionMatrixMask,
  targetMaskIndex: EqualHeightHorizontalPartialTJunctionMask,
  col: number,
  row: number,
): CompositionCell {
  const eastFacing = targetMaskIndex === 35 || targetMaskIndex === 28;
  if (maskIndex === 18 || maskIndex === 35 || maskIndex === 22 || maskIndex === 28) {
    return horizontalPartialTJunctionCandidateCell(maskIndex, col, row);
  }
  if (maskIndex === 17 || maskIndex === 21) {
    return westPartialTJunctionCandidateCell(maskIndex, col, row);
  }
  if (maskIndex === 36 || maskIndex === 27) {
    return eastPartialTJunctionCandidateCell(maskIndex, col, row);
  }
  if (maskIndex === 1 || maskIndex === 4) {
    return openPocketVerticalEndCell(maskIndex, eastFacing ? 'east' : 'west', col, row);
  }
  if (maskIndex === 2 || maskIndex === 8) {
    return openPocketHorizontalEndCell(maskIndex, col, row);
  }
  if (maskIndex === 5) {
    return [
      col,
      row,
      'full_w_straight-base.svg',
      'full_w_straight-upper.svg',
      eastFacing ? 'mirror-x' : 'none',
    ];
  }
  if (maskIndex === 10) {
    return [col, row, 'full_n_straight-base.svg', 'full_n_straight-upper.svg'];
  }
  if (maskIndex === 16 || maskIndex === 20 || maskIndex === 26 || maskIndex === 34) {
    return acceptedFilledBlockCell(maskIndex, col, row);
  }
  const repeat = EQUAL_HEIGHT_THICK_WALL_HORIZONTAL_REPEAT_GATE.candidates.find(
    ({ maskIndex: candidateIndex }) => candidateIndex === maskIndex,
  );
  if (!repeat) throw new Error(`Accepted horizontal repeat source missing for mask_${maskIndex}`);
  return thickWallHorizontalRepeatCandidateCell(repeat, col, row);
}

function horizontalPartialTJunctionMatrixCells(
  matrix: readonly (readonly (number | null)[])[],
  targetMaskIndex: EqualHeightHorizontalPartialTJunctionMask,
): readonly CompositionCell[] {
  const cells: CompositionCell[] = [];
  for (const [row, masks] of matrix.entries()) {
    for (const [col, maskIndex] of masks.entries()) {
      if (maskIndex === null) continue;
      cells.push(horizontalPartialTJunctionMatrixCell(
        maskIndex as HorizontalPartialTJunctionMatrixMask,
        targetMaskIndex,
        col,
        row,
      ));
    }
  }
  return cells;
}

async function horizontalPartialTJunctionMatrixWindow(
  options: CliOptions,
  matrix: readonly (readonly (number | null)[])[],
  targetMaskIndex: EqualHeightHorizontalPartialTJunctionMask,
  x: number,
  y: number,
  width: number,
  height: number,
  fileOverrides: CompositionFileOverrides,
  floorFill: string = A1A_PALETTE.floor,
  showGrid = true,
): Promise<string> {
  return compositionWindow(
    options,
    horizontalPartialTJunctionMatrixCells(matrix, targetMaskIndex),
    matrix[0].length,
    matrix.length,
    x,
    y,
    width,
    height,
    fileOverrides,
    undefined,
    showGrid,
    floorFill,
  );
}

type SingleFilledCrossJunctionMatrixMask =
  | 1 | 2 | 4 | 5 | 8 | 10
  | 19 | 20 | 21 | 26 | 34 | 35;

function singleFilledCrossJunctionCandidateCell(
  col: number,
  row: number,
  layer: 'base' | 'upper' | 'composed' = 'composed',
): CompositionCell {
  const candidate = EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE.candidate;
  if (layer === 'base') return [col, row, candidate.baseFile, null];
  if (layer === 'upper') return [col, row, EMPTY_WORKBENCH_FILE, candidate.upperFile];
  return [col, row, candidate.baseFile, candidate.upperFile];
}

function singleFilledCrossJunctionMatrixCell(
  maskIndex: SingleFilledCrossJunctionMatrixMask,
  col: number,
  row: number,
): CompositionCell {
  if (maskIndex === 19) return singleFilledCrossJunctionCandidateCell(col, row);
  if (maskIndex === 20 || maskIndex === 26 || maskIndex === 34) {
    return acceptedFilledBlockCell(maskIndex, col, row);
  }
  if (maskIndex === 21) {
    return westPartialTJunctionCandidateCell(maskIndex, col, row);
  }
  if (maskIndex === 35) {
    return horizontalPartialTJunctionCandidateCell(maskIndex, col, row);
  }
  if (maskIndex === 1 || maskIndex === 4) {
    return openPocketVerticalEndCell(maskIndex, 'west', col, row);
  }
  if (maskIndex === 2 || maskIndex === 8) {
    return openPocketHorizontalEndCell(maskIndex, col, row);
  }
  if (maskIndex === 5) {
    return [
      col,
      row,
      'full_w_straight-base.svg',
      'full_w_straight-upper.svg',
    ];
  }
  return [col, row, 'full_n_straight-base.svg', 'full_n_straight-upper.svg'];
}

function singleFilledCrossJunctionMatrixCells(
  matrix: readonly (readonly (number | null)[])[],
): readonly CompositionCell[] {
  const cells: CompositionCell[] = [];
  for (const [row, masks] of matrix.entries()) {
    for (const [col, maskIndex] of masks.entries()) {
      if (maskIndex === null) continue;
      cells.push(singleFilledCrossJunctionMatrixCell(
        maskIndex as SingleFilledCrossJunctionMatrixMask,
        col,
        row,
      ));
    }
  }
  return cells;
}

async function singleFilledCrossJunctionMatrixWindow(
  options: CliOptions,
  matrix: readonly (readonly (number | null)[])[],
  x: number,
  y: number,
  width: number,
  height: number,
  fileOverrides: CompositionFileOverrides,
  floorFill: string = A1A_PALETTE.floor,
  showGrid = true,
): Promise<string> {
  return compositionWindow(
    options,
    singleFilledCrossJunctionMatrixCells(matrix),
    matrix[0].length,
    matrix.length,
    x,
    y,
    width,
    height,
    fileOverrides,
    undefined,
    showGrid,
    floorFill,
  );
}

const crossSourceCellFrame = (
  x: number,
  y: number,
  size: number,
  inset = 0,
): string => `<rect x="${x + inset}" y="${y + inset}" width="${size - inset * 2}" height="${size - inset * 2}" fill="none" ` +
  'stroke="#B65F4D" stroke-width="2" stroke-dasharray="8 5"/>';

const crossInstalledUnionFrame = (
  x: number,
  y: number,
  cellSize: number,
): string => {
  const offset = Math.max(3, cellSize * 0.08);
  const left = x - offset;
  const top = y - offset;
  const right = x + cellSize * 2 + offset;
  const bottom = y + cellSize * 2 + offset;
  const bracket = Math.max(10, cellSize * 0.32);
  return `<path d="M${left + bracket} ${top}H${left}V${top + bracket}` +
    ` M${right - bracket} ${top}H${right}V${top + bracket}` +
    ` M${left} ${bottom - bracket}V${bottom}H${left + bracket}` +
    ` M${right} ${bottom - bracket}V${bottom}H${right - bracket}" fill="none" ` +
    'stroke="#4E7D79" stroke-width="2.5" stroke-linecap="square" opacity="0.82"/>';
};

async function renderEqualHeightSingleFilledCrossJunctionGate(
  options: CliOptions,
  root: string,
): Promise<void> {
  const gate = EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE;
  const width = 1600;
  const height = 3190;
  const panelFill = '#ECE5D5';
  const panel = (x: number, y: number, w: number, h: number): string =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${panelFill}" ` +
      `stroke="${INK}" stroke-width="1.5" opacity="0.96"/>`;
  const fileOverrides: CompositionFileOverrides = {
    [EMPTY_WORKBENCH_FILE]: EMPTY_WORKBENCH_SOURCE,
    ...await verticalTerminusProposalFileOverrides(options, root),
    ...await openPocketCrossJunctionProposalFileOverrides(options, root),
    ...await thickWallBlockProposalFileOverrides(options, root),
    ...await westPartialTJunctionProposalFileOverrides(options, root),
    ...await horizontalPartialTJunctionProposalFileOverrides(options, root),
    ...await singleFilledCrossJunctionProposalFileOverrides(options, root),
  };
  const parts: string[] = [
    `<rect width="${width}" height="${height}" rx="18" fill="${PANEL}"/>`,
    text(24, 38, 'QUOTACO EQUAL-HEIGHT WALLS — SINGLE-FILLED CROSS-JUNCTION GATE', 23, 820),
    text(24, 68, 'OWNER ACCEPTED · one northeast crook closes inside the four-way socket envelope', 13, 650, MUTED),
    text(1576, 38, 'MASK_19 · ACCEPTED', 11, 820, '#4E7D79', 'end'),
    text(1576, 62, 'accepted ledger · 19 direct · 14 derived · 14 synthetic', 10, 700, MUTED, 'end'),

    panel(20, 92, 1560, 470),
    text(44, 126, 'ACCEPTED SOURCE LOCK — MASK_15 OPEN CONTROL → MASK_19 NE-FILLED', 14, 820),
    text(44, 150, 'Keep all four cardinal sockets exact. Fill only the northeast crook; southeast, southwest, and northwest remain visible floor.', 10, 650, MUTED),

    panel(20, 582, 1560, 640),
    text(44, 616, 'SOURCE READ — BASE / UPPER / COMPOSED AT 240 / 90 / 40 PX', 14, 820),
    text(44, 640, 'The filled crook must become one continuous wall mass while the four-way hub keeps the flattened mask_15 perspective.', 10, 650, MUTED),

    panel(20, 1242, 1560, 430),
    text(44, 1276, 'CONSTRUCTION CONTROLS — RELATED T STATES ARE REFERENCES, NOT OVERLAYS', 14, 820),
    text(44, 1300, 'mask_17 and mask_18 demonstrate the same NE closure at different three-way sockets. mask_19 must remain one authored four-way union.', 10, 650, MUTED),

    panel(20, 1692, 1560, 500),
    text(44, 1726, 'COMPACT CROSSING — ONE-CELL ARMS AT 90 / 40 PX PER CELL', 14, 820),
    text(44, 1750, 'The filled northeast mass and three open floor crooks must survive both grounds without leaving the fixed west socket register.', 10, 650, MUTED),

    panel(20, 2212, 1560, 660),
    text(44, 2246, 'EXTENT GATE — THREE-CELL AND SIX-CELL ARMS ON LIGHT / DARK FLOOR', 14, 820),
    text(44, 2270, 'The center stays the same size as the arms grow. A longer room may not hide a bad hub, and a compact room may not collapse it.', 10, 650, MUTED),

    panel(20, 2892, 1560, 274),
    text(44, 2928, 'ACCEPTANCE CONTRACT', 14, 820),
    text(824, 2928, 'PROOF BOUNDARY', 14, 820),
  ];

  parts.push(text(326, 190, 'MASK_15 · ACCEPTED · FOUR CROOKS OPEN', 10, 840, '#4E7D79', 'middle'));
  parts.push(await compositionWindow(
    options,
    [openPocketCrossJunctionCandidateCell(0, 0)],
    1,
    1,
    206,
    212,
    240,
    240,
    fileOverrides,
  ));
  parts.push(crossAcceptedFrame(206, 212, 240));
  parts.push(text(800, 334, '→', 52, 700, '#B65F4D', 'middle'));
  parts.push(text(1274, 190, 'MASK_19 · ACCEPTED · NE CROOK FILLED', 10, 840, '#4E7D79', 'middle'));
  parts.push(await compositionWindow(
    options,
    [singleFilledCrossJunctionCandidateCell(0, 0)],
    1,
    1,
    1154,
    212,
    240,
    240,
    fileOverrides,
  ));
  parts.push(crossSourceCellFrame(1154, 212, 240));
  parts.push(text(800, 490, 'ONE OCCUPANCY CHANGE · NO SOCKET CHANGE · NO NEW CENTER ORNAMENT', 11, 820, '#294B3C', 'middle'));

  const sourceViews: ReadonlyArray<readonly ['base' | 'upper' | 'composed', number, string]> = [
    ['base', 54, 'BASE · 240'],
    ['upper', 314, 'UPPER · 240'],
    ['composed', 574, 'COMPOSED · 240'],
  ];
  for (const [layer, x, label] of sourceViews) {
    parts.push(await compositionWindow(
      options,
      [singleFilledCrossJunctionCandidateCell(0, 0, layer)],
      1,
      1,
      x,
      688,
      240,
      240,
      fileOverrides,
    ));
    parts.push(text(x + 120, 954, label, 9, 820, layer === 'composed' ? '#B65F4D' : MUTED, 'middle'));
  }
  parts.push(await compositionWindow(options, [singleFilledCrossJunctionCandidateCell(0, 0)], 1, 1, 884, 714, 90, 90, fileOverrides));
  parts.push(await compositionWindow(options, [singleFilledCrossJunctionCandidateCell(0, 0)], 1, 1, 1016, 739, 40, 40, fileOverrides, undefined, true, A1A_PALETTE.charcoal));
  parts.push(text(929, 824, '90 PX', 9, 820, '#B65F4D', 'middle'));
  parts.push(text(1036, 806, '40 PX · DARK', 9, 820, '#B65F4D', 'middle'));
  const sourceNotes = [
    'NE cream field reaches both adjoining sockets',
    'coral and green turn once around the filled crook',
    'SE / SW / NW remain genuine floor pockets',
    'four-way center keeps mask_15 scale and perspective',
    'no cap, badge, patch, or hidden interior rail',
  ];
  for (const [index, note] of sourceNotes.entries()) {
    parts.push(text(1120, 712 + index * 48, `• ${note}`, 10, 720, index < 4 ? '#294B3C' : MUTED));
  }
  parts.push(text(1120, 990, 'ACCEPTED PROOF SOURCE · MASK_19 DIRECT LEDGER PROVENANCE', 10, 820, '#294B3C'));

  const constructionControls: ReadonlyArray<readonly [CompositionCell, number, string]> = [
    [westPartialTJunctionCandidateCell(17, 0, 0), 60, 'MASK_17 · N/E/S · NE FILLED'],
    [horizontalPartialTJunctionCandidateCell(18, 0, 0), 360, 'MASK_18 · N/E/W · NE FILLED'],
    [singleFilledCrossJunctionCandidateCell(0, 0), 1280, 'MASK_19 · N/E/S/W · NE FILLED'],
  ];
  for (const [cell, x, label] of constructionControls) {
    parts.push(text(x + 120, 1344, label, 9, 820, x === 1280 ? '#B65F4D' : '#4E7D79', 'middle'));
    parts.push(await compositionWindow(options, [cell], 1, 1, x, 1364, 240, 240, fileOverrides));
  }
  parts.push(text(630, 1486, '≠', 38, 800, '#9A493D', 'middle'));
  parts.push(text(690, 1418, 'DO NOT STACK THE TWO T CONTROLS', 10, 840, '#9A493D'));
  parts.push(text(690, 1460, 'AUTHOR ONE FOUR-WAY UNION', 10, 840, '#294B3C'));
  parts.push(text(690, 1510, 'REJECT · PEAK / POST', 10, 840, '#9A493D'));
  parts.push(text(690, 1545, 'REJECT · BURIED FACE', 10, 840, '#9A493D'));
  parts.push(text(690, 1580, 'REJECT · DOUBLE CORAL / GREEN BANDS', 10, 840, '#9A493D'));
  parts.push(text(690, 1615, 'PASS · FLAT COPING / THREE OPEN FLOOR CROOKS', 10, 820, '#294B3C'));

  parts.push(text(246, 1792, '90 PX/CELL · LIGHT · CANONICAL WEST REGISTER', 10, 840, '#B65F4D', 'middle'));
  parts.push(await singleFilledCrossJunctionMatrixWindow(options, gate.compactMatrix, 111, 1812, 270, 270, fileOverrides));
  parts.push(crossInstalledUnionFrame(201, 1812, 90));
  parts.push(crossSourceCellFrame(201, 1902, 90, 3));
  parts.push(text(558, 1792, '40 PX/CELL · DARK · SAME FIXED REGISTER', 10, 840, '#4E7D79', 'middle'));
  parts.push(await singleFilledCrossJunctionMatrixWindow(options, gate.compactMatrix, 498, 1812, 120, 120, fileOverrides, A1A_PALETTE.charcoal));
  parts.push(crossInstalledUnionFrame(538, 1812, 40));
  parts.push(crossSourceCellFrame(538, 1852, 40, 2));
  const compactNotes = [
    'four cardinal sockets disappear into ordinary neighbors',
    'the northeast fill remains one continuous wall mass',
    'three open crooks remain readable at gameplay distance',
    'floor value never changes the fixed-light socket register',
  ];
  for (const [index, note] of compactNotes.entries()) {
    parts.push(text(760, 1836 + index * 58, `• ${note}`, 11, 740, index < 3 ? '#294B3C' : MUTED));
  }
  parts.push(text(760, 2088, 'Reject any center bulge, perspective switch, doubled seam, or lost floor crook.', 11, 820, '#9A493D'));
  parts.push(text(111, 2126, 'TEAL BRACKETS · FULL 2×2 INSTALLED UNION · 20 / 26 / 19 / 34', 9, 820, '#4E7D79'));
  parts.push(text(111, 2160, 'CORAL CELL · MASK_19 SOURCE', 9, 820, '#B65F4D'));

  parts.push(text(190, 2310, '3-CELL ARMS · 40 PX/CELL · LIGHT', 10, 840, '#B65F4D', 'middle'));
  parts.push(await singleFilledCrossJunctionMatrixWindow(options, gate.threeCellArmMatrix, 50, 2330, 280, 280, fileOverrides));
  parts.push(crossInstalledUnionFrame(170, 2410, 40));
  parts.push(crossSourceCellFrame(170, 2450, 40, 2));
  parts.push(text(616, 2310, '6-CELL ARMS · 40 PX/CELL · LIGHT · FIXED WEST REGISTER', 10, 840, '#4E7D79', 'middle'));
  parts.push(await singleFilledCrossJunctionMatrixWindow(options, gate.sixCellArmMatrix, 356, 2330, 520, 520, fileOverrides));
  parts.push(crossInstalledUnionFrame(596, 2530, 40));
  parts.push(crossSourceCellFrame(596, 2570, 40, 2));
  parts.push(text(1254, 2310, '6-CELL ARMS · 40 PX/CELL · DARK · SAME REGISTER', 10, 840, '#B65F4D', 'middle'));
  parts.push(await singleFilledCrossJunctionMatrixWindow(options, gate.sixCellArmMatrix, 994, 2330, 520, 520, fileOverrides, A1A_PALETTE.charcoal));
  parts.push(crossInstalledUnionFrame(1234, 2530, 40));
  parts.push(crossSourceCellFrame(1234, 2570, 40, 2));
  parts.push(text(190, 2660, 'TEAL BRACKETS · INSTALLED 2×2 UNION', 10, 820, '#4E7D79', 'middle'));
  parts.push(text(190, 2700, '21 / 26 / 19 / 35 · CORAL = MASK_19', 10, 820, '#B65F4D', 'middle'));
  parts.push(text(190, 2740, 'No long-run camouflage.', 10, 820, '#9A493D', 'middle'));

  const acceptanceLines = [
    'Judge one occupancy step from accepted open mask_15',
    'Keep exact N/E/S/W sockets and exactly three open floor crooks',
    'Demand a flat high-oblique coping hierarchy with no central peak or post',
    'Reject buried faces and doubled cream/coral/green material bands',
  ];
  for (const [index, line] of acceptanceLines.entries()) {
    parts.push(text(44, 2970 + index * 42, `• ${line}`, 10, 720, index < 3 ? '#294B3C' : MUTED));
  }
  const boundaryLines: ReadonlyArray<readonly [string, string]> = [
    ['OWNER ACCEPTED · MASK_19 DIRECT PROOF SOURCE', '#294B3C'],
    ['accepted ledger · 19 direct / 14 derived / 14 synthetic', MUTED],
    ['2 EXTERNAL PROOF SVGs · TEMPORARY FRAMES', '#4E7D79'],
    ['NO CANONICAL / EXPORT / ATLAS / SCHEMA / BLOB / UNITY', '#9A493D'],
  ];
  for (const [index, [line, color]] of boundaryLines.entries()) {
    parts.push(text(824, 2970 + index * 44, line, 10, index === 0 || index >= 2 ? 820 : 700, color));
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * CARD_RENDER_SCALE },
  }).render().asPng();
  await writeFile(path.join(options.output, `${gate.stem}.png`), png);
}

type OpenPocketCrossJunctionMatrixMask = 1 | 2 | 4 | 5 | 8 | 10 | 15;
type OpenPocketCrossJunctionVerticalFacing = 'west' | 'east';

function openPocketCrossJunctionCandidateCell(
  col: number,
  row: number,
  layer: 'base' | 'upper' | 'composed' = 'composed',
): CompositionCell {
  const baseFile = 'open_cross_junction-base.svg';
  const upperFile = 'open_cross_junction-upper.svg';
  if (layer === 'base') return [col, row, baseFile, null];
  if (layer === 'upper') return [col, row, EMPTY_WORKBENCH_FILE, upperFile];
  return [col, row, baseFile, upperFile];
}

function openPocketCrossJunctionMatrixCell(
  maskIndex: OpenPocketCrossJunctionMatrixMask,
  col: number,
  row: number,
  verticalFacing: OpenPocketCrossJunctionVerticalFacing,
): CompositionCell {
  if (maskIndex === 15) return openPocketCrossJunctionCandidateCell(col, row);
  if (maskIndex === 1 || maskIndex === 4) {
    return openPocketVerticalEndCell(maskIndex, verticalFacing, col, row);
  }
  if (maskIndex === 2 || maskIndex === 8) {
    return openPocketHorizontalEndCell(maskIndex, col, row);
  }
  if (maskIndex === 5) {
    return [
      col,
      row,
      'full_w_straight-base.svg',
      'full_w_straight-upper.svg',
      verticalFacing === 'west' ? 'none' : 'mirror-x',
    ];
  }
  return [col, row, 'full_n_straight-base.svg', 'full_n_straight-upper.svg'];
}

function openPocketCrossJunctionMatrixCells(
  matrix: readonly (readonly (number | null)[])[],
  verticalFacing: OpenPocketCrossJunctionVerticalFacing,
): readonly CompositionCell[] {
  const cells: CompositionCell[] = [];
  for (const [row, masks] of matrix.entries()) {
    for (const [col, maskIndex] of masks.entries()) {
      if (maskIndex === null) continue;
      cells.push(openPocketCrossJunctionMatrixCell(
        maskIndex as OpenPocketCrossJunctionMatrixMask,
        col,
        row,
        verticalFacing,
      ));
    }
  }
  return cells;
}

async function openPocketCrossJunctionMatrixWindow(
  options: CliOptions,
  matrix: readonly (readonly (number | null)[])[],
  verticalFacing: OpenPocketCrossJunctionVerticalFacing,
  x: number,
  y: number,
  width: number,
  height: number,
  fileOverrides: CompositionFileOverrides,
  floorFill: string = A1A_PALETTE.floor,
  showGrid = true,
): Promise<string> {
  return compositionWindow(
    options,
    openPocketCrossJunctionMatrixCells(matrix, verticalFacing),
    matrix[0].length,
    matrix.length,
    x,
    y,
    width,
    height,
    fileOverrides,
    undefined,
    showGrid,
    floorFill,
  );
}

const crossAcceptedFrame = (
  x: number,
  y: number,
  size: number,
  color = '#4E7D79',
): string => `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="none" ` +
  `stroke="${color}" stroke-width="2" stroke-dasharray="8 5"/>`;

async function renderEqualHeightOpenPocketCrossJunctionGate(
  options: CliOptions,
  root: string,
): Promise<void> {
  const gate = EQUAL_HEIGHT_OPEN_POCKET_CROSS_JUNCTION_GATE;
  const width = 1600;
  const height = 3310;
  const panelFill = '#ECE5D5';
  const panel = (x: number, y: number, w: number, h: number): string =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${panelFill}" ` +
      `stroke="${INK}" stroke-width="1.5" opacity="0.96"/>`;
  const fileOverrides: CompositionFileOverrides = {
    [EMPTY_WORKBENCH_FILE]: EMPTY_WORKBENCH_SOURCE,
    ...await verticalTerminusProposalFileOverrides(options, root),
    ...await openPocketTJunctionProposalFileOverrides(options, root),
    ...await horizontalOpenPocketTJunctionProposalFileOverrides(options, root),
    ...await openPocketCrossJunctionProposalFileOverrides(options, root),
  };
  const parts: string[] = [
    `<rect width="${width}" height="${height}" rx="18" fill="${PANEL}"/>`,
    text(24, 38, 'QUOTACO EQUAL-HEIGHT WALLS — OPEN-POCKET CROSS-JUNCTION GATE', 24, 820),
    text(24, 68, 'OWNER ACCEPTED · one authored fixed-light four-way union · direct proof-layer source', 13, 650, MUTED),
    text(1576, 38, 'MASK_15 · ACCEPTED', 11, 820, '#4E7D79', 'end'),
    text(1576, 62, 'ledger · 19 direct · 14 derived · 14 synthetic', 10, 700, MUTED, 'end'),

    panel(20, 92, 1560, 450),
    text(44, 126, 'CONCRETE USE CASE — ONE-CELL-WIDE RUNS CROSS, ALL FOUR DIAGONALS STAY FLOOR', 14, 820),
    text(44, 150, 'mask_15 is the center of a plus-shaped wall crossing. It is not a thick 3×3 block and it does not fill any elbow crook.', 10, 650, MUTED),

    panel(20, 562, 1560, 680),
    text(44, 596, 'AUTHORED SOURCE READ — BASE / UPPER / COMPOSED AT 240 / 90 / 40 PX', 14, 820),
    text(44, 620, 'One flattened structural union owns all four sockets. The horizontal frontage and vertical coping meet once, with no central badge or applied post.', 10, 650, MUTED),

    panel(20, 1262, 1560, 430),
    text(44, 1296, 'CONSTRUCTION AUDIT — STACKED T ART IS THE REJECTED CONTROL', 14, 820),
    text(44, 1320, 'Literal mask_11 + mask_14 layers retain doubled contours and paint belts. The authored candidate must read as a single catalog connector.', 10, 650, MUTED),

    panel(20, 1712, 1560, 520),
    text(44, 1746, 'COMPACT INSTALLED GATE — LITERAL 90 PX AND 40 PX PER CELL', 14, 820),
    text(44, 1770, 'One-cell arms are valid. The four crooks must remain floor-shaped negative space even when the grid is condensed.', 10, 650, MUTED),

    panel(20, 2252, 1560, 700),
    text(44, 2286, 'LONG CROSSING GATE — THREE-CELL AND SIX-CELL ARMS', 14, 820),
    text(44, 2310, 'The accepted hub is tested with both vertical facings and on light/dark floors. The dashed center identifies the direct mask_15 source.', 10, 650, MUTED),

    panel(20, 2972, 1560, 314),
    text(44, 3008, 'READING CONTRACT', 14, 820),
    text(824, 3008, 'PROOF BOUNDARY', 14, 820),
  ];

  const controls: ReadonlyArray<readonly [CompositionCell, number, string]> = [
    [openPocketTJunctionCandidateCell(7, 0, 0), 88, 'MASK_7 · OPEN E'],
    [openPocketTJunctionCandidateCell(13, 0, 0), 278, 'MASK_13 · OPEN W'],
    [horizontalOpenPocketTJunctionCandidateCell(11, 'west-source', 0, 0), 1032, 'MASK_11 · OPEN S'],
    [horizontalOpenPocketTJunctionCandidateCell(14, 'west-source', 0, 0), 1222, 'MASK_14 · OPEN N'],
  ];
  for (const [cell, x, label] of controls) {
    parts.push(await compositionWindow(options, [cell], 1, 1, x, 232, 128, 128, fileOverrides));
    parts.push(text(x + 64, 380, label, 9, 800, MUTED, 'middle'));
  }
  parts.push(await compositionWindow(
    options,
    [openPocketCrossJunctionCandidateCell(0, 0)],
    1,
    1,
    648,
    190,
    210,
    210,
    fileOverrides,
  ));
  parts.push(crossAcceptedFrame(648, 190, 210));
  parts.push(text(753, 430, 'MASK_15 · ACCEPTED · ALL FOUR SOCKETS / ALL FOUR CROOKS OPEN', 10, 840, '#4E7D79', 'middle'));
  parts.push(text(753, 470, '7 + 13 + 11 + 14 establish the four accepted one-arm-missing controls', 10, 700, MUTED, 'middle'));
  parts.push(text(753, 506, 'PASS · one molded hub     REJECT · pylon / medallion / crosshair', 10, 820, '#294B3C', 'middle'));

  const sourceViews: ReadonlyArray<readonly ['base' | 'upper' | 'composed', number, string]> = [
    ['base', 54, 'BASE'],
    ['upper', 314, 'UPPER'],
    ['composed', 574, 'COMPOSED'],
  ];
  for (const [layer, x, label] of sourceViews) {
    parts.push(await compositionWindow(
      options,
      [openPocketCrossJunctionCandidateCell(0, 0, layer)],
      1,
      1,
      x,
      662,
      240,
      240,
      fileOverrides,
    ));
    parts.push(text(x + 120, 928, label, 10, 840, layer === 'composed' ? '#B65F4D' : MUTED, 'middle'));
  }
  parts.push(await compositionWindow(options, [openPocketCrossJunctionCandidateCell(0, 0)], 1, 1, 886, 690, 90, 90, fileOverrides));
  parts.push(await compositionWindow(options, [openPocketCrossJunctionCandidateCell(0, 0)], 1, 1, 1018, 715, 40, 40, fileOverrides, undefined, true, A1A_PALETTE.charcoal));
  parts.push(text(931, 806, '90 PX', 9, 820, '#B65F4D', 'middle'));
  parts.push(text(1038, 782, '40 PX · DARK', 9, 820, '#B65F4D', 'middle'));
  const sourceNotes = [
    'E/W sockets match the accepted horizontal straight register',
    'N/S sockets match the accepted vertical straight register',
    'cream, coral, green, and plinth turn once through the hub',
    'four diagonal floor pockets remain visibly outside the part',
    'south-face shadow normalization remains deferred family polish',
  ];
  for (const [index, note] of sourceNotes.entries()) {
    parts.push(text(1120, 690 + index * 48, `• ${note}`, 10, 720, index < 4 ? '#294B3C' : MUTED));
  }
  parts.push(text(1120, 958, 'NO MIRROR CLAIM · NO ROTATION · NO COVER PATCH', 10, 820, '#9A493D'));

  const rawOverlay: readonly CompositionCell[] = [
    horizontalOpenPocketTJunctionCandidateCell(11, 'west-source', 0, 0),
    horizontalOpenPocketTJunctionCandidateCell(14, 'west-source', 0, 0),
  ];
  parts.push(text(230, 1364, 'REJECTED · RAW T + T OVERLAY', 10, 840, '#9A493D', 'middle'));
  parts.push(await compositionWindow(options, rawOverlay, 1, 1, 102, 1382, 256, 256, fileOverrides));
  parts.push(text(630, 1364, 'ACCEPTED · ONE AUTHORED UNION', 10, 840, '#4E7D79', 'middle'));
  parts.push(await compositionWindow(options, [openPocketCrossJunctionCandidateCell(0, 0)], 1, 1, 502, 1382, 256, 256, fileOverrides));
  parts.push(crossAcceptedFrame(502, 1382, 256));
  const auditNotes = [
    'remove doubled charcoal contours at center',
    'remove duplicate coral and green belts',
    'preserve a single cream-led top/front hierarchy',
    'keep all four sockets exact and all four crooks open',
  ];
  for (const [index, note] of auditNotes.entries()) {
    parts.push(text(860, 1405 + index * 55, `• ${note}`, 11, 740, index < 3 ? MUTED : '#294B3C'));
  }
  parts.push(text(860, 1635, 'If this still reads as a post, the source is not ready.', 11, 840, '#9A493D'));

  parts.push(text(200, 1808, '90 PX/CELL · WEST-FACING VERTICAL REGISTER', 10, 840, '#B65F4D', 'middle'));
  parts.push(await openPocketCrossJunctionMatrixWindow(options, gate.compactMatrix, 'west', 65, 1828, 270, 270, fileOverrides));
  parts.push(crossAcceptedFrame(155, 1918, 90));
  parts.push(text(530, 1808, '40 PX/CELL · EAST-FACING REGISTER · DARK', 10, 840, '#4E7D79', 'middle'));
  parts.push(await openPocketCrossJunctionMatrixWindow(options, gate.compactMatrix, 'east', 470, 1828, 120, 120, fileOverrides, A1A_PALETTE.charcoal));
  parts.push(crossAcceptedFrame(510, 1868, 40));
  const compactNotes = [
    'all four accepted terminus sockets disappear cleanly',
    'no arm needs extra length for the center to read',
    'the vertical facing changes neighbors, never the hub source',
    'floor remains legible in NE / SE / SW / NW crooks',
  ];
  for (const [index, note] of compactNotes.entries()) {
    parts.push(text(740, 1842 + index * 62, `• ${note}`, 11, 740, index === 3 ? '#294B3C' : MUTED));
  }
  parts.push(text(740, 2110, 'Reject any width bulge, internal cap, cream/coral gap, or perspective switch.', 11, 820, '#9A493D'));

  parts.push(text(182, 2350, '3-CELL ARMS · 40 PX/CELL', 10, 840, '#B65F4D', 'middle'));
  parts.push(await openPocketCrossJunctionMatrixWindow(options, gate.threeCellArmMatrix, 'west', 42, 2370, 280, 280, fileOverrides));
  parts.push(crossAcceptedFrame(162, 2490, 40));
  parts.push(text(612, 2350, '6-CELL ARMS · LIGHT · EAST-FACING REGISTER', 10, 840, '#4E7D79', 'middle'));
  parts.push(await openPocketCrossJunctionMatrixWindow(options, gate.sixCellArmMatrix, 'east', 352, 2370, 520, 520, fileOverrides));
  parts.push(crossAcceptedFrame(592, 2610, 40));
  parts.push(text(1252, 2350, '6-CELL ARMS · DARK · WEST-FACING REGISTER', 10, 840, '#B65F4D', 'middle'));
  parts.push(await openPocketCrossJunctionMatrixWindow(options, gate.sixCellArmMatrix, 'west', 992, 2370, 520, 520, fileOverrides, A1A_PALETTE.charcoal));
  parts.push(crossAcceptedFrame(1232, 2610, 40));
  parts.push(text(182, 2700, 'Same authored center at every extent.', 10, 720, MUTED, 'middle'));
  parts.push(text(182, 2740, 'No decorative hub inflation.', 10, 820, '#9A493D', 'middle'));
  parts.push(text(182, 2780, 'No diagonal is occupied.', 10, 820, '#294B3C', 'middle'));

  const readingLines = [
    'One catalog-built connector, not two T-junctions laid on top of each other',
    'Four ordinary wall sockets vanish into accepted neighbors without steps or caps',
    'Four floor crooks stay visibly open at 90 and 40 px per cell',
    'The same center reads in one-cell, three-cell, and six-cell arm lengths',
  ];
  for (const [index, line] of readingLines.entries()) {
    parts.push(text(44, 3050 + index * 48, `• ${line}`, 10, 720, index < 3 ? '#294B3C' : MUTED));
  }
  const boundaryLines: ReadonlyArray<readonly [string, string]> = [
    ['OWNER ACCEPTED · MASK_15 DIRECT SOURCE', '#4E7D79'],
    ['accepted ledger · 19 direct / 14 derived / 14 synthetic', MUTED],
    ['14 remaining cross-junction rows stay proof-only', MUTED],
    ['2 EXTERNAL PROOF SVGs · TEMPORARY FRAMES', '#4E7D79'],
    ['NO CANONICAL / EXPORT / ATLAS / SCHEMA / BLOB / UNITY', '#9A493D'],
  ];
  for (const [index, [line, color]] of boundaryLines.entries()) {
    parts.push(text(824, 3050 + index * 42, line, index === 0 || index >= 3 ? 10 : 9, index === 0 || index >= 3 ? 820 : 700, color));
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * CARD_RENDER_SCALE },
  }).render().asPng();
  await writeFile(path.join(options.output, `${gate.stem}.png`), png);
}

async function renderEqualHeightHorizontalPartialTJunctionGate(
  options: CliOptions,
  root: string,
): Promise<void> {
  const gate = EQUAL_HEIGHT_HORIZONTAL_PARTIAL_T_JUNCTION_GATE;
  const width = 1600;
  const height = 3630;
  const panelFill = '#ECE5D5';
  const panel = (x: number, y: number, w: number, h: number): string =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${panelFill}" ` +
      `stroke="${INK}" stroke-width="1.5" opacity="0.96"/>`;
  const fileOverrides: CompositionFileOverrides = {
    [EMPTY_WORKBENCH_FILE]: EMPTY_WORKBENCH_SOURCE,
    ...await verticalTerminusProposalFileOverrides(options, root),
    ...await openPocketTJunctionProposalFileOverrides(options, root),
    ...await horizontalOpenPocketTJunctionProposalFileOverrides(options, root),
    ...await thickWallBlockProposalFileOverrides(options, root),
    ...await thickWallHorizontalRepeatProposalFileOverrides(options, root),
    ...await eastPartialTJunctionGateFileOverrides(options, root),
    ...await horizontalPartialTJunctionProposalFileOverrides(options, root),
  };
  const parts: string[] = [
    `<rect width="${width}" height="${height}" rx="18" fill="${PANEL}"/>`,
    text(24, 38, 'QUOTACO EQUAL-HEIGHT WALLS — HORIZONTAL PARTIAL T-JUNCTION GATE', 24, 820),
    text(24, 68, 'OWNER ACCEPTED · two fixed-light direct masters plus two approved whole-cell X derivations', 13, 650, MUTED),
    text(1576, 38, 'MASKS 18 / 35 / 22 / 28', 11, 820, '#B65F4D', 'end'),
    text(1576, 62, 'ledger · 19 direct · 14 derived · 14 synthetic', 10, 700, MUTED, 'end'),

    panel(20, 92, 1560, 430),
    text(44, 126, 'TWO OCCUPANCY DIAMONDS — FOUR SIBLING STATES, NOT A SEQUENCE', 14, 820),
    text(44, 150, 'Each accepted mapping fills exactly one upper or lower crook. The opposite crook remains genuine floor while the solid quadrant merges into the two-row mass.', 10, 650, MUTED),

    panel(20, 542, 1560, 690),
    text(44, 576, 'THE TWO DIRECT SOURCE PAIRS — BASE / UPPER / COMPOSED', 14, 820),
    text(44, 600, 'Buried faces are absent at source. Foreground and rear planes are separately authored; no rotation or Y-mirror is permitted.', 10, 650, MUTED),

    panel(20, 1252, 1560, 390),
    text(44, 1286, 'DERIVATION AUDIT — ONE FILTERED MIRROR, ONE PLAIN MIRROR', 14, 820),
    text(44, 1310, 'mask_35 drops the source-side boundary ticks before mirror-X so mask_38 owns the shared seam. mask_28 mirrors the rear source unchanged.', 10, 650, MUTED),

    panel(20, 1662, 1560, 570),
    text(44, 1696, 'COMPACT INSTALLED CHECK — LITERAL 90 PX AND 40 PX PER CELL', 14, 820),
    text(44, 1720, 'Every neighbor is accepted. Dashed frames identify the four newly accepted mappings; light and dark grounds expose different seam failures.', 10, 650, MUTED),

    panel(20, 2252, 1560, 1090),
    text(44, 2286, 'LONG INSTALLED GATE — TRUE FIVE-ROW MASS, PAIRED PARTIAL SEAMS INCLUDED', 14, 820),
    text(44, 2310, 'Each 40 px proof joins a partial sibling above or below the accepted mapping. The branch is three cells deep and the horizontal mass extends in both directions.', 10, 650, MUTED),

    panel(20, 3362, 1560, 244),
    text(44, 3398, 'READING CONTRACT', 14, 820),
    text(824, 3398, 'ACCEPTANCE BOUNDARY', 14, 820),
  ];

  const openSouth = horizontalOpenPocketTJunctionCandidateCell(11, 'west-source', 0, 0);
  const openNorth = horizontalOpenPocketTJunctionCandidateCell(14, 'west-source', 0, 0);
  const stateCells: ReadonlyArray<readonly [CompositionCell, number, number, string, string]> = [
    [openSouth, 72, 220, 'MASK_11', A1A_PALETTE.green],
    [horizontalPartialTJunctionCandidateCell(18, 0, 0), 292, 180, 'MASK_18 · NE SOLID', '#B65F4D'],
    [horizontalPartialTJunctionCandidateCell(35, 0, 0), 292, 340, 'MASK_35 · NW SOLID', '#4E7D79'],
    [horizontalPartialTJunctionMatrixCell(38, 18, 0, 0), 590, 220, 'MASK_38', A1A_PALETTE.green],
    [openNorth, 842, 220, 'MASK_14', A1A_PALETTE.green],
    [horizontalPartialTJunctionCandidateCell(22, 0, 0), 1062, 180, 'MASK_22 · SE SOLID', '#B65F4D'],
    [horizontalPartialTJunctionCandidateCell(28, 0, 0), 1062, 340, 'MASK_28 · SW SOLID', '#4E7D79'],
    [horizontalPartialTJunctionMatrixCell(31, 22, 0, 0), 1360, 220, 'MASK_31', A1A_PALETTE.green],
  ];
  for (const [cell, x, y, label, color] of stateCells) {
    parts.push(await compositionWindow(options, [cell], 1, 1, x, y, 96, 96, fileOverrides));
    parts.push(text(x + 48, y + 118, label, 9, 820, color, 'middle'));
  }
  parts.push('<defs><marker id="horizontal-partial-arrow" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#B65F4D"/></marker></defs>');
  parts.push('<path d="M180 268L270 228 M180 268L270 388 M410 228L568 268 M410 388L568 268 M950 268L1040 228 M950 268L1040 388 M1180 228L1338 268 M1180 388L1338 268" fill="none" stroke="#B65F4D" stroke-width="2.4" stroke-linecap="round" marker-end="url(#horizontal-partial-arrow)"/>');
  parts.push(text(365, 490, 'mask_11 → mask_18 or mask_35 → mask_38', 11, 780, MUTED, 'middle'));
  parts.push(text(1135, 490, 'mask_14 → mask_22 or mask_28 → mask_31', 11, 780, MUTED, 'middle'));

  const sourceRows: ReadonlyArray<readonly [
    number,
    18 | 22,
    string,
    string,
    readonly string[],
  ]> = [
    [620, 18, 'MASK_18 · DIRECT FOREGROUND MASTER · NE SOLID / NW OPEN', '#B65F4D', [
      'west socket keeps the full tri-tone frontage',
      'north/east mass is cream-led with no buried face rail',
      'local plane cue preserves the top/front break; family-wide continuity is deferred',
    ]],
    [910, 22, 'MASK_22 · DIRECT REAR MASTER · SE SOLID / SW OPEN', '#4E7D79', [
      'east socket stays quiet and cream-only like mask_31',
      'south/east mass has no buried coral or green return',
      'southwest crook remains open floor, not cream paint',
    ]],
  ];
  for (const [y, maskIndex, label, color, notes] of sourceRows) {
    parts.push(text(44, y + 16, label, 11, 840, color));
    const sourceViews: ReadonlyArray<readonly ['base' | 'upper' | 'composed', number, string]> = [
      ['base', 54, 'BASE'],
      ['upper', 274, 'UPPER'],
      ['composed', 494, 'COMPOSED'],
    ];
    for (const [layer, x, viewLabel] of sourceViews) {
      parts.push(await compositionWindow(
        options,
        [horizontalPartialTJunctionCandidateCell(maskIndex, 0, 0, layer)],
        1,
        1,
        x,
        y + 34,
        200,
        200,
        fileOverrides,
      ));
      parts.push(text(x + 100, y + 254, viewLabel, 10, 820, layer === 'composed' ? color : MUTED, 'middle'));
    }
    parts.push(await compositionWindow(
      options,
      [horizontalPartialTJunctionCandidateCell(maskIndex, 0, 0)],
      1,
      1,
      754,
      y + 82,
      90,
      90,
      fileOverrides,
    ));
    parts.push(await compositionWindow(
      options,
      [horizontalPartialTJunctionCandidateCell(maskIndex, 0, 0)],
      1,
      1,
      884,
      y + 107,
      40,
      40,
      fileOverrides,
      undefined,
      true,
      A1A_PALETTE.charcoal,
    ));
    parts.push(text(799, y + 194, '90 PX', 9, 820, color, 'middle'));
    parts.push(text(904, y + 172, '40 PX · DARK', 9, 820, color, 'middle'));
    for (const [index, note] of notes.entries()) {
      parts.push(text(1000, y + 82 + index * 38, `• ${note}`, 10, 720, index === 0 ? color : MUTED));
    }
    parts.push(text(1000, y + 208, 'NO ROTATION · NO Y MIRROR · NO COVER PATCH', 9, 820, '#9A493D'));
  }

  const mask38 = EQUAL_HEIGHT_THICK_WALL_HORIZONTAL_REPEAT_GATE.candidates.find(
    ({ maskIndex }) => maskIndex === 38,
  );
  if (!mask38) throw new Error('Accepted foreground repeat source missing for mask_38');
  const rawMask35Join: readonly CompositionCell[] = [
    thickWallHorizontalRepeatCandidateCell(mask38, 0, 0),
    horizontalPartialTJunctionCandidateCell(35, 1, 0, 'composed', true),
  ];
  const filteredMask35Join: readonly CompositionCell[] = [
    thickWallHorizontalRepeatCandidateCell(mask38, 0, 0),
    horizontalPartialTJunctionCandidateCell(35, 1, 0),
  ];
  parts.push(text(220, 1354, 'RAW MASK_35 · DOUBLED SOCKET TICK', 10, 840, '#9A493D', 'middle'));
  parts.push(await compositionWindow(options, rawMask35Join, 2, 1, 54, 1372, 332, 166, fileOverrides));
  parts.push('<path d="M220 1372V1538" fill="none" stroke="#9A493D" stroke-width="2" stroke-dasharray="7 5"/>');
  parts.push(text(620, 1354, 'FILTERED MASK_35 · NEIGHBOR OWNS SEAM', 10, 840, '#B65F4D', 'middle'));
  parts.push(await compositionWindow(options, filteredMask35Join, 2, 1, 454, 1372, 332, 166, fileOverrides));
  parts.push('<path d="M620 1372V1538" fill="none" stroke="#B65F4D" stroke-width="2" stroke-dasharray="7 5"/>');
  parts.push(text(1012, 1354, 'MASK_28 · PLAIN WHOLE-CELL X MIRROR', 10, 840, '#4E7D79', 'middle'));
  parts.push(await compositionWindow(
    options,
    [horizontalPartialTJunctionCandidateCell(28, 0, 0)],
    1,
    1,
    896,
    1372,
    166,
    166,
    fileOverrides,
  ));
  parts.push(await compositionWindow(
    options,
    [horizontalPartialTJunctionCandidateCell(35, 0, 0)],
    1,
    1,
    1120,
    1390,
    90,
    90,
    fileOverrides,
  ));
  parts.push(await compositionWindow(
    options,
    [horizontalPartialTJunctionCandidateCell(28, 0, 0)],
    1,
    1,
    1260,
    1415,
    40,
    40,
    fileOverrides,
    undefined,
    true,
    A1A_PALETTE.charcoal,
  ));
  parts.push(text(1165, 1500, 'MASK_35 · 90 PX', 9, 800, MUTED, 'middle'));
  parts.push(text(1280, 1480, 'MASK_28 · 40 PX', 9, 800, MUTED, 'middle'));
  parts.push(text(1370, 1408, 'Only mask_35 needs filtering.', 10, 720, MUTED, 'middle'));
  parts.push(text(1370, 1440, 'Both derivations stay X-only.', 10, 720, MUTED, 'middle'));
  parts.push(text(1370, 1472, 'No source pixels rotate.', 10, 720, '#9A493D', 'middle'));

  const compactCases: ReadonlyArray<readonly [
    keyof typeof gate.compactMatrices,
    EqualHeightHorizontalPartialTJunctionMask,
    string,
    string,
  ]> = [
    ['mask18', 18, 'NE SOLID', '#B65F4D'],
    ['mask35', 35, 'NW SOLID', '#4E7D79'],
    ['mask22', 22, 'SE SOLID', '#B65F4D'],
    ['mask28', 28, 'SW SOLID', '#4E7D79'],
  ];
  for (const [index, [matrixKey, maskIndex, label, color]] of compactCases.entries()) {
    const x = 44 + index * 388;
    const matrix = gate.compactMatrices[matrixKey];
    parts.push(text(x + 135, 1754, `MASK_${maskIndex} · ${label}`, 10, 840, color, 'middle'));
    parts.push(await horizontalPartialTJunctionMatrixWindow(
      options, matrix, maskIndex, x, 1772, 270, 270, fileOverrides,
    ));
    parts.push(westPartialTJunctionCandidateFrame(x + 90, 1862, 90, color));
    parts.push(await horizontalPartialTJunctionMatrixWindow(
      options, matrix, maskIndex, x + 118, 2064, 120, 120, fileOverrides, A1A_PALETTE.charcoal,
    ));
    parts.push(westPartialTJunctionCandidateFrame(x + 158, 2104, 40, color));
    parts.push(text(x + 178, 2206, '40 PX · DARK', 9, 820, color, 'middle'));
  }

  const longCases: ReadonlyArray<readonly [
    keyof typeof gate.longMatrices,
    EqualHeightHorizontalPartialTJunctionMask,
    string,
    string,
    number,
    number,
  ]> = [
    ['mask18', 18, 'MASK_18 BELOW ACCEPTED MASK_21', '#B65F4D', 4, 4],
    ['mask35', 35, 'MASK_35 BELOW ACCEPTED MASK_27', '#4E7D79', 5, 4],
    ['mask22', 22, 'MASK_22 ABOVE ACCEPTED MASK_17', '#B65F4D', 4, 0],
    ['mask28', 28, 'MASK_28 ABOVE ACCEPTED MASK_36', '#4E7D79', 5, 0],
  ];
  for (const [index, [matrixKey, maskIndex, label, color, candidateCol, candidateRow]] of longCases.entries()) {
    const top = 2334 + index * 246;
    const matrix = gate.longMatrices[matrixKey];
    parts.push(text(54, top, label, 10, 840, color));
    parts.push(await horizontalPartialTJunctionMatrixWindow(
      options, matrix, maskIndex, 54, top + 18, 400, 200, fileOverrides, A1A_PALETTE.floor,
    ));
    parts.push(westPartialTJunctionCandidateFrame(
      54 + candidateCol * 40,
      top + 18 + candidateRow * 40,
      40,
      color,
    ));
    parts.push(await horizontalPartialTJunctionMatrixWindow(
      options, matrix, maskIndex, 494, top + 18, 400, 200, fileOverrides, A1A_PALETTE.charcoal,
    ));
    parts.push(westPartialTJunctionCandidateFrame(
      494 + candidateCol * 40,
      top + 18 + candidateRow * 40,
      40,
      color,
    ));
    const notes = maskIndex === 18
      ? ['west ordinary run enters cleanly', 'mask_21/18 pair has one continuous cream bridge', 'east thick mass keeps tri-tone frontage']
      : maskIndex === 35
        ? ['west thick mass owns the filtered seam', 'mask_27/35 mirrored branch shares one perspective', 'east ordinary run exits without a false cap']
        : maskIndex === 22
          ? ['rear mapping meets ordinary west run', 'mask_22/17 pair keeps the south-facing depth break', 'east filled row stays cream-led']
          : ['west filled row remains cream-led', 'mask_28/36 mirrored branch shares one perspective', 'east ordinary run exits without a socket step'];
    for (const [noteIndex, note] of notes.entries()) {
      parts.push(text(940, top + 62 + noteIndex * 38, `• ${note}`, 10, 720, noteIndex === 1 ? color : MUTED));
    }
    parts.push(text(940, top + 190, '40 PX/CELL · LIGHT + DARK', 9, 820, color));
  }

  const readingLines = [
    'One solid quadrant disappears into accepted thick-wall top pixels; no buried inner façade survives',
    'The opposite crook remains floor-shaped negative space at both 90 and 40 px per cell',
    'Cream, coral, green, and plinth registers are accepted; continuous south-face plane cues remain family-wide polish',
    'A one-cell room remains as valid as a long run; no graphic requires extra wall length to read',
  ];
  for (const [index, line] of readingLines.entries()) {
    parts.push(text(44, 3442 + index * 34, `• ${line}`, 10, 720, index < 3 ? '#294B3C' : MUTED));
  }
  const boundaryLines: ReadonlyArray<readonly [string, string]> = [
    ['OWNER ACCEPTED · PROOF-LAYER SOURCE MAPPING', '#294B3C'],
    ['ledger · 19 direct / 14 derived / 14 synthetic', MUTED],
    ['remaining synthetic rows · cross-junctions only', MUTED],
    ['4 EXTERNAL PROOF SVGs · TEMPORARY FRAMES', '#4E7D79'],
    ['NO CANONICAL / EXPORT / ATLAS / SCHEMA / BLOB / UNITY', '#9A493D'],
  ];
  for (const [index, [line, color]] of boundaryLines.entries()) {
    parts.push(text(824, 3442 + index * 30, line, index === 0 || index >= 3 ? 10 : 9, index === 0 || index >= 3 ? 820 : 700, color));
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * CARD_RENDER_SCALE },
  }).render().asPng();
  await writeFile(path.join(options.output, `${gate.stem}.png`), png);
}

async function renderEqualHeightEastPartialTJunctionGate(
  options: CliOptions,
  root: string,
): Promise<void> {
  const gate = EQUAL_HEIGHT_EAST_PARTIAL_T_JUNCTION_GATE;
  const width = 1600;
  const height = 2410;
  const panelFill = '#ECE5D5';
  const panel = (x: number, y: number, w: number, h: number): string =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${panelFill}" ` +
      `stroke="${INK}" stroke-width="1.5" opacity="0.96"/>`;
  const fileOverrides: CompositionFileOverrides = {
    [EMPTY_WORKBENCH_FILE]: EMPTY_WORKBENCH_SOURCE,
    ...await verticalTerminusProposalFileOverrides(options, root),
    ...await openPocketTJunctionProposalFileOverrides(options, root),
    ...await thickWallBlockProposalFileOverrides(options, root),
    ...await thickWallRepeatProposalFileOverrides(options, root),
    ...await thickWallHorizontalRepeatProposalFileOverrides(options, root),
    ...await eastPartialTJunctionGateFileOverrides(options, root),
  };
  const parts: string[] = [
    `<rect width="${width}" height="${height}" rx="18" fill="${PANEL}"/>`,
    text(24, 38, 'QUOTACO EQUAL-HEIGHT WALLS — EAST SINGLE-FILLED-POCKET T TRANSITIONS', 24, 820),
    text(24, 68, 'OWNER ACCEPTED · approved X-mirror derivations of the accepted west pair · fixed-light source roles preserved', 13, 650, MUTED),
    text(1576, 38, 'MASKS 36 / 27 · ACCEPTED', 11, 820, A1A_PALETTE.green, 'end'),
    text(1576, 62, 'ledger · 19 direct · 14 derived · 14 synthetic', 10, 700, MUTED, 'end'),

    panel(20, 92, 1560, 430),
    text(44, 126, 'THE EAST OCCUPANCY DIAMOND — MIRRORED TOPOLOGY, SAME FIXED-LIGHT ROLES', 14, 820),
    text(44, 150, 'mask_36 fills the northwest crook; mask_27 fills the southwest crook. They branch from mask_13 and converge at mask_42.', 10, 650, MUTED),

    panel(20, 542, 1560, 580),
    text(44, 576, 'THE ONLY CORRECTION — ONE SHARED-SOCKET SEAM OWNER', 14, 820),
    text(44, 600, 'mask_36 omits only the accepted boundary ticks before mirror-X; mask_27 is a plain whole-cell mirror. Source geometry and fixed-light shading otherwise stay intact.', 10, 650, MUTED),

    panel(20, 1142, 1560, 520),
    text(44, 1176, 'COMPACT INSTALLED CHECK — ACCEPTED DERIVATION SURROUNDED BY ACCEPTED CELLS', 14, 820),
    text(44, 1200, 'The solid quadrant merges into the two-cell mass while the opposite crook remains genuine open floor. Dashed frame = newly accepted derivation.', 10, 650, MUTED),

    panel(20, 1682, 1560, 440),
    text(44, 1716, 'LONG-RUN GATE — LITERAL 40 PX PER CELL ON LIGHT AND DARK GROUNDS', 14, 820),
    text(44, 1740, 'Six-cell horizontal mass plus a three-cell east stem: no doubled module tick, fascia rail, socket step, or false cap.', 10, 650, MUTED),

    panel(20, 2142, 1560, 244),
    text(44, 2178, 'READING CONTRACT', 14, 820),
    text(824, 2178, 'PROOF BOUNDARY', 14, 820),
  ];

  parts.push(text(175, 208, 'OPEN CONTROL · MASK_13', 10, 820, A1A_PALETTE.green, 'middle'));
  parts.push(await compositionWindow(
    options,
    openPocketTJunctionCompactCells('east'),
    3,
    3,
    100,
    224,
    150,
    150,
    fileOverrides,
  ));
  parts.push(text(570, 178, 'FILL NW · MASK_36', 10, 820, '#B65F4D', 'middle'));
  parts.push(await eastPartialTJunctionMatrixWindow(
    options,
    gate.compactMatrices.filledNorthWest,
    525,
    188,
    90,
    135,
    fileOverrides,
  ));
  parts.push(text(570, 350, 'FILL SW · MASK_27', 10, 820, '#4E7D79', 'middle'));
  parts.push(await eastPartialTJunctionMatrixWindow(
    options,
    gate.compactMatrices.filledSouthWest,
    525,
    360,
    90,
    135,
    fileOverrides,
  ));
  parts.push(text(1250, 208, 'BOTH FILLED · MASK_42', 10, 820, A1A_PALETTE.green, 'middle'));
  parts.push(await thickWallRepeatWindow(
    options,
    1200,
    224,
    100,
    150,
    3,
    fileOverrides,
  ));
  parts.push('<defs><marker id="east-partial-t-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#B65F4D"/></marker></defs>');
  parts.push('<path d="M270 299L495 255 M270 299L495 427 M645 255L1170 299 M645 427L1170 299" fill="none" stroke="#B65F4D" stroke-width="3" stroke-linecap="round" marker-end="url(#east-partial-t-arrow)"/>');
  parts.push(text(800, 504, 'Topology mirror: mask_13 → mask_36 or mask_27 → mask_42. The two candidates are sibling states.', 12, 780, MUTED, 'middle'));

  const mask38 = EQUAL_HEIGHT_THICK_WALL_HORIZONTAL_REPEAT_GATE.candidates.find(
    ({ maskIndex }) => maskIndex === 38,
  );
  if (!mask38) throw new Error('Accepted foreground repeat source missing for mask_38');
  const rawJoin: readonly CompositionCell[] = [
    thickWallHorizontalRepeatCandidateCell(mask38, 0, 0),
    eastPartialTJunctionCandidateCell(36, 1, 0, 'composed', true),
  ];
  const filteredJoin: readonly CompositionCell[] = [
    thickWallHorizontalRepeatCandidateCell(mask38, 0, 0),
    eastPartialTJunctionCandidateCell(36, 1, 0),
  ];
  parts.push(text(250, 646, 'RAW MIRROR · TWO MODULE TICKS', 11, 840, '#9A493D', 'middle'));
  parts.push(await compositionWindow(
    options, rawJoin, 2, 1, 50, 668, 400, 200, fileOverrides,
  ));
  parts.push('<path d="M250 668V868" fill="none" stroke="#9A493D" stroke-width="2.5" stroke-dasharray="8 5"/>');
  parts.push(text(720, 646, 'ACCEPTED FILTER · NEIGHBOR OWNS THE SEAM', 11, 840, '#B65F4D', 'middle'));
  parts.push(await compositionWindow(
    options, filteredJoin, 2, 1, 520, 668, 400, 200, fileOverrides,
  ));
  parts.push('<path d="M720 668V868" fill="none" stroke="#B65F4D" stroke-width="2.5" stroke-dasharray="8 5"/>');
  parts.push(text(1220, 646, 'MASK_27 · PLAIN MIRROR-X', 11, 840, '#4E7D79', 'middle'));
  parts.push(await compositionWindow(
    options,
    [eastPartialTJunctionCandidateCell(27, 0, 0)],
    1,
    1,
    1090,
    668,
    260,
    260,
    fileOverrides,
  ));
  parts.push(await compositionWindow(
    options,
    [eastPartialTJunctionCandidateCell(36, 0, 0)],
    1,
    1,
    580,
    910,
    90,
    90,
    fileOverrides,
  ));
  parts.push(await compositionWindow(
    options,
    [eastPartialTJunctionCandidateCell(36, 0, 0)],
    1,
    1,
    705,
    935,
    40,
    40,
    fileOverrides,
  ));
  parts.push(text(625, 1024, 'MASK_36 · 90 PX', 9, 800, '#B65F4D', 'middle'));
  parts.push(text(725, 1000, '40 PX', 9, 800, '#B65F4D', 'middle'));
  parts.push(text(54, 1050, 'Reject: a mirrored source-side tick becomes a second line inside the connected west socket.', 10, 700, '#9A493D'));
  parts.push(text(820, 1050, 'Keep: service seams, south shade, cream bridge, coral/green wrap, and fixed-light highlights.', 10, 700, '#294B3C'));

  const compactCases = [
    [gate.compactMatrices.filledNorthWest, 36, 84, '#B65F4D'],
    [gate.compactMatrices.filledSouthWest, 27, 824, '#4E7D79'],
  ] as const;
  for (const [matrix, maskIndex, x, color] of compactCases) {
    parts.push(text(x + 90, 1240, `MASK_${maskIndex} · 90 PX/CELL`, 10, 840, color, 'middle'));
    parts.push(await eastPartialTJunctionMatrixWindow(
      options,
      matrix,
      x,
      1262,
      180,
      270,
      fileOverrides,
    ));
    parts.push(westPartialTJunctionCandidateFrame(x + 90, 1352, 90, color));
    parts.push(await eastPartialTJunctionMatrixWindow(
      options,
      matrix,
      x + 230,
      1312,
      80,
      120,
      fileOverrides,
      A1A_PALETTE.charcoal,
    ));
    parts.push(westPartialTJunctionCandidateFrame(x + 270, 1352, 40, color));
    parts.push(text(x + 270, 1456, '40 PX · DARK', 10, 820, color, 'middle'));
    parts.push(text(
      x,
      1588,
      maskIndex === 36
        ? 'foreground seam ownership stays singular'
        : 'rear cream socket stays quiet',
      11,
      760,
      MUTED,
    ));
  }

  const longCases = [
    [gate.longMatrices.filledNorthWest, 36, 54, A1A_PALETTE.floor, '#B65F4D', 'LIGHT'],
    [gate.longMatrices.filledNorthWest, 36, 414, A1A_PALETTE.charcoal, '#B65F4D', 'DARK'],
    [gate.longMatrices.filledSouthWest, 27, 804, A1A_PALETTE.floor, '#4E7D79', 'LIGHT'],
    [gate.longMatrices.filledSouthWest, 27, 1164, A1A_PALETTE.charcoal, '#4E7D79', 'DARK'],
  ] as const;
  for (const [matrix, maskIndex, x, floorFill, color, ground] of longCases) {
    parts.push(text(x + 120, 1784, `MASK_${maskIndex} · ${ground}`, 9, 840, color, 'middle'));
    parts.push(await eastPartialTJunctionMatrixWindow(
      options,
      matrix,
      x,
      1804,
      240,
      200,
      fileOverrides,
      floorFill,
    ));
    parts.push(westPartialTJunctionCandidateFrame(
      x + 200,
      1804 + (maskIndex === 36 ? 40 : 120),
      40,
      color,
    ));
    parts.push(text(x + 120, 2028, '6-CELL MASS · 3-CELL EAST STEM', 10, 780, MUTED, 'middle'));
  }

  const readingLines = [
    'One solid quadrant merges into accepted thick-wall top pixels with no internal face rail',
    'The remaining concave quadrant stays open floor at both 90 and 40 px per cell',
    'mask_36 keeps foreground shading; mask_27 remains the quiet rear transition',
    'All N/W/S sockets disappear into accepted neighbors in compact and long runs',
  ];
  for (const [index, line] of readingLines.entries()) {
    parts.push(text(44, 2220 + index * 32, `• ${line}`, 11, 720, index < 3 ? '#294B3C' : MUTED));
  }
  const boundaryLines: ReadonlyArray<readonly [string, string]> = [
    ['OWNER ACCEPTED · EAST PARTIAL T-JUNCTION', A1A_PALETTE.green],
    ['mask_36 / mask_27 · accepted approved derivations', MUTED],
    ['accepted mask_17 / mask_21 remain the source controls', MUTED],
    ['NO NEW EAST SVG SOURCE BANK', '#4E7D79'],
    ['NO CANONICAL / EXPORT / ATLAS / SCHEMA / UNITY', '#9A493D'],
  ];
  for (const [index, [line, color]] of boundaryLines.entries()) {
    parts.push(text(824, 2220 + index * 30, line, index === 0 || index >= 3 ? 11 : 10, index === 0 || index >= 3 ? 820 : 700, color));
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * CARD_RENDER_SCALE },
  }).render().asPng();
  await writeFile(path.join(options.output, `${gate.stem}.png`), png);
}

async function renderEqualHeightWestPartialTJunctionGate(
  options: CliOptions,
  root: string,
): Promise<void> {
  const gate = EQUAL_HEIGHT_WEST_PARTIAL_T_JUNCTION_GATE;
  const width = 1600;
  const height = 2460;
  const panelFill = '#ECE5D5';
  const panel = (x: number, y: number, w: number, h: number): string =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${panelFill}" ` +
      `stroke="${INK}" stroke-width="1.5" opacity="0.96"/>`;
  const fileOverrides: CompositionFileOverrides = {
    [EMPTY_WORKBENCH_FILE]: EMPTY_WORKBENCH_SOURCE,
    ...await verticalTerminusProposalFileOverrides(options, root),
    ...await openPocketTJunctionProposalFileOverrides(options, root),
    ...await thickWallBlockProposalFileOverrides(options, root),
    ...await thickWallRepeatProposalFileOverrides(options, root),
    ...await thickWallHorizontalRepeatProposalFileOverrides(options, root),
    ...await westPartialTJunctionProposalFileOverrides(options, root),
  };
  const parts: string[] = [
    `<rect width="${width}" height="${height}" rx="18" fill="${PANEL}"/>`,
    text(24, 38, 'QUOTACO EQUAL-HEIGHT WALLS — SINGLE-FILLED-POCKET T TRANSITIONS', 24, 820),
    text(24, 68, 'OWNER ACCEPTED · two separately authored west-side fixed-light direct sources · open and fully filled states remain the controls', 13, 650, MUTED),
    text(1576, 38, 'MASKS 17 / 21 · ACCEPTED', 11, 820, '#B65F4D', 'end'),
    text(1576, 62, 'ledger · 19 direct · 14 derived · 14 synthetic', 10, 700, MUTED, 'end'),

    panel(20, 92, 1560, 450),
    text(44, 126, 'THE OCCUPANCY DIAMOND — THESE ARE SIBLING STATES', 14, 820),
    text(44, 150, 'mask_17 fills the northeast crook; mask_21 fills the southeast crook. Neither is a Y-mirrored version of the other.', 10, 650, MUTED),

    panel(20, 562, 1560, 690),
    text(44, 596, 'THE ACCEPTED SOURCE PIXELS — BASE / UPPER / COMPOSED AT SOURCE SCALE', 14, 820),
    text(44, 620, 'Foreground mask_17 must meet mask_38. Rear mask_21 must meet cream-only mask_31. Buried faces are absent at source.', 10, 650, MUTED),

    panel(20, 1262, 1560, 500),
    text(44, 1296, 'COMPACT INSTALLED CHECK — ONE NEWLY ACCEPTED SOURCE, ALL OTHER CELLS ACCEPTED', 14, 820),
    text(44, 1320, 'The filled quadrant must disappear into the two-cell mass while the remaining crook stays visibly open floor. Dashed frame = newly accepted source cell.', 11, 700, MUTED),

    panel(20, 1782, 1560, 400),
    text(44, 1816, 'LONG-RUN GATE — LITERAL 40 PX PER CELL ON BOTH GROUNDS', 14, 820),
    text(44, 1840, 'Six-cell horizontal mass plus a three-cell vertical stem: no internal fascia rail, socket step, or false cap. Dashed frame = newly accepted source cell.', 11, 700, MUTED),

    panel(20, 2202, 1560, 234),
    text(44, 2238, 'READING CONTRACT', 14, 820),
    text(824, 2238, 'PROOF BOUNDARY', 14, 820),
  ];

  parts.push(text(175, 214, 'OPEN CONTROL · MASK_7', 10, 820, A1A_PALETTE.green, 'middle'));
  parts.push(await compositionWindow(
    options,
    openPocketTJunctionCompactCells('west'),
    3,
    3,
    100,
    230,
    150,
    150,
    fileOverrides,
  ));
  parts.push(text(560, 160, 'FILL NE · MASK_17', 10, 820, '#B65F4D', 'middle'));
  parts.push(await westPartialTJunctionMatrixWindow(
    options,
    gate.compactMatrices.filledNorthEast,
    510,
    170,
    100,
    150,
    fileOverrides,
  ));
  parts.push(text(560, 336, 'FILL SE · MASK_21', 10, 820, '#4E7D79', 'middle'));
  parts.push(await westPartialTJunctionMatrixWindow(
    options,
    gate.compactMatrices.filledSouthEast,
    510,
    346,
    100,
    150,
    fileOverrides,
  ));
  parts.push(text(1250, 214, 'BOTH FILLED · MASK_24', 10, 820, A1A_PALETTE.green, 'middle'));
  parts.push(await thickWallRepeatWindow(
    options,
    1200,
    230,
    100,
    150,
    3,
    fileOverrides,
  ));
  parts.push('<defs><marker id="partial-t-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#B65F4D"/></marker></defs>');
  parts.push('<path d="M270 305L480 250 M270 305L480 410 M630 250L1170 305 M630 410L1170 305" fill="none" stroke="#B65F4D" stroke-width="3" stroke-linecap="round" marker-end="url(#partial-t-arrow)"/>');
  parts.push(text(800, 520, 'Topology branches from mask_7 and merges at mask_24; mask_17 and mask_21 are never a sequence.', 12, 780, MUTED, 'middle'));

  const sourceRows: ReadonlyArray<readonly [
    number,
    EqualHeightWestPartialTJunctionMask,
    string,
    string,
  ]> = [
    [650, 17, 'MASK_17 · DIRECT FOREGROUND SOURCE · NE SOLID / SE OPEN', '#B65F4D'],
    [950, 21, 'MASK_21 · DIRECT REAR SOURCE · SE SOLID / NE OPEN', '#4E7D79'],
  ];
  for (const [y, maskIndex, label, color] of sourceRows) {
    parts.push(text(44, y + 18, label, 11, 840, color));
    parts.push(await compositionWindow(
      options,
      [westPartialTJunctionCandidateCell(maskIndex, 0, 0, 'base')],
      1,
      1,
      54,
      y + 38,
      240,
      240,
      fileOverrides,
    ));
    parts.push(await compositionWindow(
      options,
      [westPartialTJunctionCandidateCell(maskIndex, 0, 0, 'upper')],
      1,
      1,
      304,
      y + 38,
      240,
      240,
      fileOverrides,
    ));
    parts.push(await compositionWindow(
      options,
      [westPartialTJunctionCandidateCell(maskIndex, 0, 0)],
      1,
      1,
      554,
      y + 38,
      240,
      240,
      fileOverrides,
    ));
    parts.push(text(174, y + 292, 'BASE', 10, 820, MUTED, 'middle'));
    parts.push(text(424, y + 292, 'UPPER', 10, 820, MUTED, 'middle'));
    parts.push(text(674, y + 292, 'COMPOSED · 240 PX SOURCE READ', 10, 820, color, 'middle'));
    parts.push(await compositionWindow(
      options,
      [westPartialTJunctionCandidateCell(maskIndex, 0, 0)],
      1,
      1,
      844,
      y + 92,
      90,
      90,
      fileOverrides,
    ));
    parts.push(await compositionWindow(
      options,
      [westPartialTJunctionCandidateCell(maskIndex, 0, 0)],
      1,
      1,
      994,
      y + 117,
      40,
      40,
      fileOverrides,
    ));
    parts.push(text(889, y + 206, '90 PX', 10, 820, MUTED, 'middle'));
    parts.push(text(1014, y + 182, '40 PX', 10, 820, MUTED, 'middle'));
    const notes = maskIndex === 17
      ? ['east socket: mask_38 tri-tone frontage', 'solid NE: continuous cream top', 'open SE: foreground bend remains readable']
      : ['east socket: mask_31 cream-only rear span', 'solid SE: no buried tri-tone face', 'open NE: quiet rear crook remains readable'];
    for (const [index, note] of notes.entries()) {
      parts.push(text(1110, y + 92 + index * 40, `• ${note}`, 10, 720, index === 0 ? color : MUTED));
    }
    parts.push(text(1110, y + 226, 'NO Y MIRROR · NO COVER PATCH', 9, 820, '#9A493D'));
  }

  const compactCases = [
    [gate.compactMatrices.filledNorthEast, 17, 92, '#B65F4D'],
    [gate.compactMatrices.filledSouthEast, 21, 842, '#4E7D79'],
  ] as const;
  for (const [matrix, maskIndex, x, color] of compactCases) {
    parts.push(text(x + 90, 1358, `MASK_${maskIndex} · 90 PX/CELL`, 10, 840, color, 'middle'));
    parts.push(await westPartialTJunctionMatrixWindow(
      options,
      matrix,
      x,
      1380,
      180,
      270,
      fileOverrides,
      A1A_PALETTE.floor,
      true,
    ));
    parts.push(westPartialTJunctionCandidateFrame(x, 1470, 90, color));
    parts.push(await westPartialTJunctionMatrixWindow(
      options,
      matrix,
      x + 230,
      1430,
      80,
      120,
      fileOverrides,
      A1A_PALETTE.charcoal,
      true,
    ));
    parts.push(westPartialTJunctionCandidateFrame(x + 230, 1470, 40, color));
    parts.push(text(x + 270, 1570, '40 PX · DARK', 10, 820, color, 'middle'));
    parts.push(text(x, 1692, maskIndex === 17 ? 'foreground plane break survives' : 'rear cream socket stays quiet', 11, 760, MUTED));
  }

  const longCases = [
    [gate.longMatrices.filledNorthEast, 17, 54, A1A_PALETTE.floor, '#B65F4D', 'LIGHT'],
    [gate.longMatrices.filledNorthEast, 17, 414, A1A_PALETTE.charcoal, '#B65F4D', 'DARK'],
    [gate.longMatrices.filledSouthEast, 21, 804, A1A_PALETTE.floor, '#4E7D79', 'LIGHT'],
    [gate.longMatrices.filledSouthEast, 21, 1164, A1A_PALETTE.charcoal, '#4E7D79', 'DARK'],
  ] as const;
  for (const [matrix, maskIndex, x, floorFill, color, ground] of longCases) {
    parts.push(text(x + 120, 1884, `MASK_${maskIndex} · ${ground}`, 9, 840, color, 'middle'));
    parts.push(await westPartialTJunctionMatrixWindow(
      options,
      matrix,
      x,
      1904,
      240,
      200,
      fileOverrides,
      floorFill,
      true,
    ));
    parts.push(westPartialTJunctionCandidateFrame(
      x,
      1904 + (maskIndex === 17 ? 40 : 120),
      40,
      color,
    ));
    parts.push(text(x + 120, 2128, '6-CELL MASS · 3-CELL STEM', 10, 780, MUTED, 'middle'));
  }

  const readingLines = [
    'One solid quadrant merges into accepted thick-wall top pixels with no internal rail',
    'The remaining concave quadrant stays genuine floor, never cream-painted negative space',
    'mask_17 owns the foreground shade/coral/green/plinth; mask_21 does not inherit it',
    'All N/E/S sockets disappear into accepted neighbors at compact and long distance',
  ];
  for (const [index, line] of readingLines.entries()) {
    parts.push(text(44, 2276 + index * 32, `• ${line}`, 11, 720, index < 3 ? '#294B3C' : MUTED));
  }
  const boundaryLines: ReadonlyArray<readonly [string, string]> = [
    ['OWNER ACCEPTED · WEST PARTIAL T-JUNCTION', '#B65F4D'],
    ['mask_17 / mask_21 · accepted direct proof sources', MUTED],
    ['mask_36 / mask_27 · accepted east-side derivations', MUTED],
    ['EXTERNAL PROOF SOURCES ONLY', '#4E7D79'],
    ['NO CANONICAL / EXPORT / ATLAS / SCHEMA / UNITY', '#9A493D'],
  ];
  for (const [index, [line, color]] of boundaryLines.entries()) {
    parts.push(text(824, 2276 + index * 30, line, index === 0 || index >= 3 ? 11 : 10, index === 0 || index >= 3 ? 820 : 700, color));
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * CARD_RENDER_SCALE },
  }).render().asPng();
  await writeFile(path.join(options.output, `${gate.stem}.png`), png);
}

function thickWallHorizontalRepeatCandidateCell(
  candidate: EqualHeightThickWallHorizontalRepeatCandidate,
  col: number,
  row: number,
  layer: 'base' | 'upper' | 'composed' = 'composed',
): CompositionCell {
  if (layer === 'base') return [col, row, candidate.baseFile, null];
  if (layer === 'upper') return [col, row, EMPTY_WORKBENCH_FILE, candidate.upperFile];
  return [col, row, candidate.baseFile, candidate.upperFile];
}

function thickWallHorizontalRepeatCells(
  columns: 2 | 3 | 4 | 6,
  middleMode: 'authored-candidate' | 'straight-reuse' = 'authored-candidate',
): readonly CompositionCell[] {
  const cells: CompositionCell[] = [
    acceptedFilledBlockCell(20, 0, 0),
    acceptedFilledBlockCell(16, 0, 1),
  ];
  for (let col = 1; col < columns - 1; col += 1) {
    if (middleMode === 'straight-reuse') {
      cells.push(
        [col, 0, 'full_n_straight-base.svg', 'full_n_straight-upper.svg'],
        [col, 1, 'full_n_straight-base.svg', 'full_n_straight-upper.svg'],
      );
    } else {
      cells.push(
        ...EQUAL_HEIGHT_THICK_WALL_HORIZONTAL_REPEAT_GATE.candidates.map((candidate) =>
          thickWallHorizontalRepeatCandidateCell(candidate, col, candidate.rowIndex)),
      );
    }
  }
  cells.push(
    acceptedFilledBlockCell(26, columns - 1, 0),
    acceptedFilledBlockCell(34, columns - 1, 1),
  );
  return cells;
}

async function thickWallHorizontalRepeatWindow(
  options: CliOptions,
  x: number,
  y: number,
  width: number,
  height: number,
  columns: 2 | 3 | 4 | 6,
  fileOverrides: CompositionFileOverrides,
  floorFill: string = A1A_PALETTE.floor,
  middleMode: 'authored-candidate' | 'straight-reuse' = 'authored-candidate',
): Promise<string> {
  return compositionWindow(
    options,
    thickWallHorizontalRepeatCells(columns, middleMode),
    columns,
    2,
    x,
    y,
    width,
    height,
    fileOverrides,
    undefined,
    false,
    floorFill,
  );
}

async function renderEqualHeightThickWallHorizontalRepeatGate(
  options: CliOptions,
  root: string,
): Promise<void> {
  const gate = EQUAL_HEIGHT_THICK_WALL_HORIZONTAL_REPEAT_GATE;
  const width = 1600;
  const height = 1900;
  const panelFill = '#ECE5D5';
  const panel = (x: number, y: number, w: number, h: number): string =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${panelFill}" ` +
      `stroke="${INK}" stroke-width="1.5" opacity="0.96"/>`;
  const fileOverrides: CompositionFileOverrides = {
    [EMPTY_WORKBENCH_FILE]: EMPTY_WORKBENCH_SOURCE,
    ...await southeastReviewFileOverrides(options),
    ...await thickWallBlockProposalFileOverrides(options, root),
    ...await thickWallHorizontalRepeatProposalFileOverrides(options, root),
  };
  const rear = gate.candidates[0];
  const foreground = gate.candidates[1];
  const parts: string[] = [
    `<rect width="${width}" height="${height}" rx="18" fill="${PANEL}"/>`,
    text(24, 38, 'QUOTACO EQUAL-HEIGHT WALLS — ACCEPTED N×2 HORIZONTAL REPEAT FAMILY', 24, 820),
    text(24, 68, 'Owner-accepted proof layer · two fixed-light direct sources · accepted 2×2 family remains the control', 13, 650, MUTED),
    text(1576, 38, 'MASKS 31 / 38 ACCEPTED', 11, 820, A1A_PALETTE.green, 'end'),
    text(1576, 62, '19 direct · 14 derived · 14 synthetic · 0 unresolved', 10, 700, MUTED, 'end'),

    panel(20, 92, 1560, 500),
    text(44, 126, 'THE PLAYER-SHAPED CASE — WIDEN THE SOLID MASS', 14, 820),
    text(44, 150, 'Adding one complete wall column must extend the accepted slab without reopening a north face, burying a fascia rail, or inventing a center cap.', 10, 650, MUTED),

    panel(20, 612, 1560, 410),
    text(44, 646, 'THE ONLY NEW PIXELS — REAR TOP + FOREGROUND FRONTAGE', 14, 820),
    text(44, 670, 'The rear source is cream-only. The foreground source alone owns the south shade, coral register, green face, plinth, and one right-edge service seam.', 10, 650, MUTED),

    panel(20, 1042, 1560, 560),
    text(44, 1076, 'REPEATABILITY GATE — SHORT, CONSECUTIVE, AND LONG', 14, 820),
    text(44, 1100, 'Judge the first inserted column, consecutive middle columns, and a literal 40 px-per-cell six-column mass on both grounds.', 10, 650, MUTED),

    panel(20, 1622, 1560, 254),
    text(44, 1658, 'READING CONTRACT', 14, 820),
    text(824, 1658, 'PROOF BOUNDARY', 14, 820),
  ];

  parts.push(text(246, 186, 'ACCEPTED 2×2 CONTROL', 11, 820, A1A_PALETTE.green, 'middle'));
  parts.push(await thickWallHorizontalRepeatWindow(options, 66, 206, 360, 330, 2, fileOverrides));
  parts.push(text(592, 342, 'INSERT', 11, 850, '#B65F4D', 'middle'));
  parts.push(text(592, 364, 'ONE FULL COLUMN', 11, 850, '#B65F4D', 'middle'));
  parts.push('<path d="M470 380H692" fill="none" stroke="#B65F4D" stroke-width="4" stroke-linecap="round"/><path d="M692 380L670 365V395Z" fill="#B65F4D"/>');
  parts.push(text(1036, 186, '3×2 ACCEPTED MASS · ONE INSERT', 11, 820, A1A_PALETTE.green, 'middle'));
  parts.push(await thickWallHorizontalRepeatWindow(options, 786, 206, 500, 330, 3, fileOverrides));
  parts.push(text(1370, 272, '20   31   26', 11, 850, MUTED));
  parts.push(text(1370, 438, '16   38   34', 11, 850, '#B65F4D'));
  parts.push(text(1370, 480, '31 and 38 repeat;', 9, 700, '#294B3C'));
  parts.push(text(1370, 502, 'corners stay unchanged', 9, 700, '#294B3C'));

  const sourceCards: ReadonlyArray<readonly [number, string, CompositionCell, string]> = [
    [54, 'REAR · MASK_31', thickWallHorizontalRepeatCandidateCell(rear, 0, 0), '#4E7D79'],
    [324, 'FOREGROUND · MASK_38', thickWallHorizontalRepeatCandidateCell(foreground, 0, 0), '#B65F4D'],
  ];
  for (const [x, label, cell, color] of sourceCards) {
    parts.push(await compositionWindow(options, [cell], 1, 1, x, 710, 220, 220, fileOverrides));
    parts.push(text(x + 110, 954, label, 10, 820, color, 'middle'));
  }
  const pairedColumn = [
    thickWallHorizontalRepeatCandidateCell(rear, 0, 0),
    thickWallHorizontalRepeatCandidateCell(foreground, 0, 1),
  ];
  parts.push(await compositionWindow(options, pairedColumn, 1, 2, 640, 702, 180, 280, fileOverrides));
  parts.push(text(730, 1000, 'COMPOSED COLUMN', 10, 820, '#294B3C', 'middle'));
  parts.push(await compositionWindow(options, pairedColumn, 1, 2, 940, 750, 90, 180, fileOverrides));
  parts.push(text(985, 954, '90 PX / CELL', 9, 820, MUTED, 'middle'));
  parts.push(await compositionWindow(options, pairedColumn, 1, 2, 1130, 800, 40, 80, fileOverrides));
  parts.push(text(1150, 904, '40 PX', 9, 820, MUTED, 'middle'));
  parts.push(text(1260, 750, 'REAR', 9, 850, '#4E7D79'));
  parts.push(text(1260, 780, 'north contour · cream · highlight', 9, 680, MUTED));
  parts.push(text(1260, 838, 'FOREGROUND', 9, 850, '#B65F4D'));
  parts.push(text(1260, 868, 'shade · coral · green · plinth · service seam', 9, 680, MUTED));
  parts.push(text(1260, 926, 'NO ROTATION · NO Y MIRROR', 9, 820, '#9A493D'));

  parts.push(text(194, 1140, 'REJECT · ORDINARY STRAIGHT REUSE', 10, 820, '#9A493D', 'middle'));
  parts.push(await thickWallHorizontalRepeatWindow(options, 54, 1160, 280, 210, 3, fileOverrides, A1A_PALETTE.floor, 'straight-reuse'));
  parts.push(text(194, 1394, 'buried face rails split the mass', 9, 740, '#9A493D', 'middle'));
  parts.push(text(520, 1140, '3×2 · ONE MIDDLE', 10, 820, '#B65F4D', 'middle'));
  parts.push(await thickWallHorizontalRepeatWindow(options, 380, 1160, 280, 210, 3, fileOverrides));
  parts.push(text(850, 1140, '4×2 · CONSECUTIVE MIDDLES', 10, 820, '#294B3C', 'middle'));
  parts.push(await thickWallHorizontalRepeatWindow(options, 700, 1180, 300, 180, 4, fileOverrides));
  parts.push(text(1260, 1140, '6×2 · 40 PX / CELL', 10, 820, '#294B3C', 'middle'));
  parts.push(await thickWallHorizontalRepeatWindow(options, 1120, 1200, 240, 80, 6, fileOverrides));
  parts.push(text(1260, 1302, 'LIGHT', 8, 820, MUTED, 'middle'));
  parts.push(await thickWallHorizontalRepeatWindow(options, 1120, 1360, 240, 80, 6, fileOverrides, A1A_PALETTE.charcoal));
  parts.push(text(1260, 1462, 'DARK', 8, 820, '#4E7D79', 'middle'));
  parts.push(text(360, 1510, 'rear cream plane', 9, 780, '#4E7D79', 'middle'));
  parts.push('<path d="M180 1480H540" fill="none" stroke="#4E7D79" stroke-width="2" stroke-linecap="round"/>');
  parts.push(text(790, 1510, 'foreground tri-tone frontage', 9, 780, '#B65F4D', 'middle'));
  parts.push('<path d="M610 1480H970" fill="none" stroke="#B65F4D" stroke-width="2" stroke-linecap="round"/>');

  const readingLines = [
    'One cream mass across the rear row and through the rear/foreground join',
    'Only the foreground row carries the south-facing plane break and tri-tone face',
    'Repeated cells keep one quiet service-seam owner without a doubled boundary',
    'The silhouette reads cleanly with one or several inserted columns',
  ];
  for (const [index, line] of readingLines.entries()) {
    parts.push(text(44, 1696 + index * 34, `• ${line}`, 10, 700, index < 3 ? '#294B3C' : MUTED));
  }
  const boundaryLines: ReadonlyArray<readonly [string, string]> = [
    ['OWNER ACCEPTED · HORIZONTAL REPEAT FAMILY', A1A_PALETTE.green],
    ['mask_31 · direct accepted rear source', MUTED],
    ['mask_38 · direct accepted foreground source', MUTED],
    ['PROOF-LAYER LEDGER PROMOTION ONLY', '#4E7D79'],
    ['NO EXPORT / ATLAS / SCHEMA / UNITY', '#9A493D'],
  ];
  for (const [index, [line, color]] of boundaryLines.entries()) {
    parts.push(text(824, 1696 + index * 32, line, index === 0 || index >= 3 ? 10 : 9, index === 0 || index >= 3 ? 820 : 680, color));
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * CARD_RENDER_SCALE },
  }).render().asPng();
  await writeFile(path.join(options.output, `${gate.stem}.png`), png);
}

function thickWallRepeatCandidateCell(
  candidate: EqualHeightThickWallRepeatCandidate,
  col: number,
  row: number,
  layer: 'base' | 'upper' | 'composed' = 'composed',
): CompositionCell {
  if (layer === 'base') return [col, row, candidate.baseFile, null, candidate.transform];
  if (layer === 'upper') {
    return [col, row, EMPTY_WORKBENCH_FILE, candidate.upperFile, candidate.transform];
  }
  return [col, row, candidate.baseFile, candidate.upperFile, candidate.transform];
}

function thickWallRepeatCells(
  rows: 2 | 3 | 4 | 6,
  middleMode: 'authored-candidate' | 'straight-reuse' = 'authored-candidate',
): readonly CompositionCell[] {
  const cells: CompositionCell[] = [
    acceptedFilledBlockCell(20, 0, 0),
    acceptedFilledBlockCell(26, 1, 0),
  ];
  for (let row = 1; row < rows - 1; row += 1) {
    if (middleMode === 'straight-reuse') {
      cells.push(
        [0, row, 'full_w_straight-base.svg', 'full_w_straight-upper.svg'],
        [1, row, 'full_w_straight-base.svg', 'full_w_straight-upper.svg', 'mirror-x'],
      );
    } else {
      cells.push(
        ...EQUAL_HEIGHT_THICK_WALL_REPEAT_GATE.candidates.map((candidate) =>
          thickWallRepeatCandidateCell(candidate, candidate.col, row)),
      );
    }
  }
  cells.push(
    acceptedFilledBlockCell(16, 0, rows - 1),
    acceptedFilledBlockCell(34, 1, rows - 1),
  );
  return cells;
}

async function thickWallRepeatWindow(
  options: CliOptions,
  x: number,
  y: number,
  width: number,
  height: number,
  rows: 2 | 3 | 4 | 6,
  fileOverrides: CompositionFileOverrides,
  floorFill: string = A1A_PALETTE.floor,
  middleMode: 'authored-candidate' | 'straight-reuse' = 'authored-candidate',
): Promise<string> {
  return compositionWindow(
    options,
    thickWallRepeatCells(rows, middleMode),
    2,
    rows,
    x,
    y,
    width,
    height,
    fileOverrides,
    undefined,
    false,
    floorFill,
  );
}

async function renderEqualHeightThickWallRepeatGate(
  options: CliOptions,
  root: string,
): Promise<void> {
  const gate = EQUAL_HEIGHT_THICK_WALL_REPEAT_GATE;
  const width = 1600;
  const height = 1980;
  const panelFill = '#ECE5D5';
  const panel = (x: number, y: number, w: number, h: number): string =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${panelFill}" ` +
      `stroke="${INK}" stroke-width="1.5" opacity="0.96"/>`;
  const fileOverrides: CompositionFileOverrides = {
    [EMPTY_WORKBENCH_FILE]: EMPTY_WORKBENCH_SOURCE,
    ...await southeastReviewFileOverrides(options),
    ...await thickWallBlockProposalFileOverrides(options, root),
    ...await thickWallRepeatProposalFileOverrides(options, root),
  };
  const west = gate.candidates[0];
  const east = gate.candidates[1];
  const parts: string[] = [
    `<rect width="${width}" height="${height}" rx="18" fill="${PANEL}"/>`,
    text(24, 38, 'QUOTACO EQUAL-HEIGHT WALLS — ACCEPTED 2xN THICK-WALL REPEAT FAMILY', 24, 820),
    text(24, 68, 'Owner-accepted proof layer · one west-authored middle spine plus one approved whole-cell X mirror · 2x2 family remains the control', 13, 650, MUTED),
    text(1576, 38, 'MASKS 24 / 42 ACCEPTED', 11, 820, A1A_PALETTE.green, 'end'),
    text(1576, 62, '19 direct · 14 derived · 14 synthetic · 0 unresolved', 10, 700, MUTED, 'end'),

    panel(20, 92, 1560, 570),
    text(44, 126, 'THE PLAYER-SHAPED CASE — EXTEND THE SOLID MASS', 14, 820),
    text(44, 150, 'Adding one complete wall row must extend the accepted slab, not reveal a T hub, belt, pipe cap, or buried service rail.', 10, 650, MUTED),

    panel(20, 682, 1560, 440),
    text(44, 716, 'THE ONLY NEW PIXELS — ONE OPEN-Y WEST SPINE', 14, 820),
    text(44, 740, 'The base is fully buried. The upper owns a straight charcoal outside edge and cream top through both Y sockets; the east side is mirror-X only.', 10, 650, MUTED),

    panel(20, 1142, 1560, 560),
    text(44, 1176, 'REPEATABILITY GATE — SHORT, CONSECUTIVE, AND LONG', 14, 820),
    text(44, 1200, 'The accepted unit remains one mass with one foreground fascia at 2x3, survives consecutive middle rows at 2x4, and stays clean at 40 px per cell over 2x6.', 10, 650, MUTED),

    panel(20, 1722, 1560, 234),
    text(44, 1758, 'READING CONTRACT', 14, 820),
    text(824, 1758, 'PROOF BOUNDARY', 14, 820),
  ];

  parts.push(text(250, 190, 'ACCEPTED 2x2 CONTROL', 11, 820, A1A_PALETTE.green, 'middle'));
  parts.push(await thickWallRepeatWindow(options, 70, 210, 360, 360, 2, fileOverrides));
  parts.push(text(570, 360, 'INSERT', 11, 850, '#B65F4D', 'middle'));
  parts.push(text(570, 382, 'ONE FULL ROW', 11, 850, '#B65F4D', 'middle'));
  parts.push('<path d="M468 398H668" fill="none" stroke="#B65F4D" stroke-width="4" stroke-linecap="round"/><path d="M668 398L646 383V413Z" fill="#B65F4D"/>');
  parts.push(text(930, 190, 'ACCEPTED 2x3 MASS', 11, 820, A1A_PALETTE.green, 'middle'));
  parts.push(await thickWallRepeatWindow(options, 760, 170, 320, 480, 3, fileOverrides));
  parts.push(text(1190, 250, '20   26', 11, 850, MUTED));
  parts.push(text(1190, 402, '24   42', 11, 850, '#B65F4D'));
  parts.push(text(1190, 554, '16   34', 11, 850, MUTED));
  parts.push(text(1190, 594, 'middle row repeats;', 9, 700, '#294B3C'));
  parts.push(text(1190, 616, 'foreground remains bottom-owned', 9, 700, '#294B3C'));

  const sourceCards: ReadonlyArray<readonly [number, string, CompositionCell, string]> = [
    [54, 'BASE · BURIED', thickWallRepeatCandidateCell(west, 0, 0, 'base'), MUTED],
    [324, 'UPPER · DIRECT 24', thickWallRepeatCandidateCell(west, 0, 0, 'upper'), '#B65F4D'],
    [594, 'COMPOSED · 24', thickWallRepeatCandidateCell(west, 0, 0), '#B65F4D'],
    [864, 'MIRROR-X · 42', thickWallRepeatCandidateCell(east, 0, 0), '#4E7D79'],
  ];
  for (const [x, label, cell, color] of sourceCards) {
    parts.push(await compositionWindow(options, [cell], 1, 1, x, 772, 220, 220, fileOverrides));
    parts.push(text(x + 110, 1016, label, 10, 820, color, 'middle'));
  }
  parts.push(await compositionWindow(options, [thickWallRepeatCandidateCell(west, 0, 0)], 1, 1, 1205, 827, 90, 90, fileOverrides));
  parts.push(text(1250, 986, '90 PX', 9, 820, MUTED, 'middle'));
  parts.push(await compositionWindow(options, [thickWallRepeatCandidateCell(west, 0, 0)], 1, 1, 1410, 872, 40, 40, fileOverrides));
  parts.push(text(1430, 956, '40 PX', 9, 820, MUTED, 'middle'));
  parts.push(text(1160, 1044, 'No coral · no green · no shade · no Y seam', 10, 760, '#294B3C'));

  parts.push(text(194, 1240, 'REJECT · STRAIGHT-WALL REUSE', 10, 820, '#9A493D', 'middle'));
  parts.push(await thickWallRepeatWindow(options, 64, 1260, 260, 390, 3, fileOverrides, A1A_PALETTE.floor, 'straight-reuse'));
  parts.push(text(194, 1670, 'buried rails survive inside the mass', 9, 740, '#9A493D', 'middle'));
  parts.push(text(514, 1240, '2x3 · ONE MIDDLE', 10, 820, '#B65F4D', 'middle'));
  parts.push(await thickWallRepeatWindow(options, 384, 1260, 260, 390, 3, fileOverrides));
  parts.push(text(820, 1240, '2x4 · CONSECUTIVE MIDDLES', 10, 820, '#294B3C', 'middle'));
  parts.push(await thickWallRepeatWindow(options, 710, 1240, 220, 440, 4, fileOverrides));
  parts.push(text(1080, 1240, '2x6 · 40 PX/CELL · LIGHT', 10, 820, '#294B3C', 'middle'));
  parts.push(await thickWallRepeatWindow(options, 1040, 1340, 80, 240, 6, fileOverrides));
  parts.push(text(1350, 1240, '2x6 · 40 PX/CELL · DARK', 10, 820, '#4E7D79', 'middle'));
  parts.push(await thickWallRepeatWindow(options, 1310, 1340, 80, 240, 6, fileOverrides, A1A_PALETTE.charcoal));

  const readingLines = [
    'One uninterrupted cream wall-top plane through every inserted row',
    'Only the outside west/east outlines survive; the center join stays invisible',
    'Coral, green, and south-facing shade remain owned by the final foreground row',
    'The silhouette reads cleanly with one or several middle rows',
  ];
  for (const [index, line] of readingLines.entries()) {
    parts.push(text(44, 1796 + index * 34, `• ${line}`, 10, 700, index < 3 ? '#294B3C' : MUTED));
  }
  const boundaryLines: ReadonlyArray<readonly [string, string]> = [
    ['OWNER ACCEPTED · REPEAT FAMILY', A1A_PALETTE.green],
    ['mask_24 · direct accepted proof source', MUTED],
    ['mask_42 · accepted whole-cell mirror-X derivation', MUTED],
    ['PROOF-LAYER LEDGER PROMOTION ONLY', '#4E7D79'],
    ['NO EXPORT / ATLAS / SCHEMA / UNITY', '#9A493D'],
  ];
  for (const [index, [line, color]] of boundaryLines.entries()) {
    parts.push(text(824, 1796 + index * 32, line, index === 0 || index >= 3 ? 10 : 9, index === 0 || index >= 3 ? 820 : 680, color));
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * CARD_RENDER_SCALE },
  }).render().asPng();
  await writeFile(path.join(options.output, `${gate.stem}.png`), png);
}

const THICK_WALL_BLOCK_CONTROL_CELLS: readonly CompositionCell[] = [
  [0, 0, 'full_exterior_corner-base.svg', 'full_exterior_corner-upper.svg'],
  [
    1,
    0,
    PROMOTED_NORTHEAST_CORNER.baseFile,
    PROMOTED_NORTHEAST_CORNER.upperFile,
    PROMOTED_NORTHEAST_CORNER.transform,
  ],
  [
    0,
    1,
    PROMOTED_SOUTHWEST_CORNER.baseFile,
    PROMOTED_SOUTHWEST_CORNER.upperFile,
    PROMOTED_SOUTHWEST_CORNER.transform,
  ],
  [
    1,
    1,
    SOUTHEAST_WORKBENCH_BASE_FILE,
    SOUTHEAST_WORKBENCH_UPPER_FILE,
    PROMOTED_SOUTHEAST_CORNER.transform,
  ],
];

function thickWallBlockCandidateCells(): readonly CompositionCell[] {
  return EQUAL_HEIGHT_THICK_WALL_BLOCK_GATE.cells.map((cell) => [
    cell.col,
    cell.row,
    cell.quadrant === 'southeast' ? THICK_WALL_SOUTHEAST_BASE_FILE : cell.baseFile,
    cell.quadrant === 'southeast' ? THICK_WALL_SOUTHEAST_UPPER_FILE : cell.upperFile,
    cell.transform,
  ] as CompositionCell);
}

function openElbowControlCells(): readonly CompositionCell[] {
  return [
    [
      0,
      0,
      EQUAL_HEIGHT_VERTICAL_TERMINUS_GATE.cases[1].baseFile,
      EQUAL_HEIGHT_VERTICAL_TERMINUS_GATE.cases[1].upperFile,
    ],
    [
      0,
      1,
      PROMOTED_SOUTHWEST_CORNER.baseFile,
      PROMOTED_SOUTHWEST_CORNER.upperFile,
      PROMOTED_SOUTHWEST_CORNER.transform,
    ],
    [
      1,
      1,
      EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE.terminusSource.baseFile,
      EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE.terminusSource.upperFile,
    ],
  ];
}

function thickWallBlockGuideOverlay(
  x: number,
  y: number,
  width: number,
  height: number,
  columns: 2 | 3 = 2,
  annotate = false,
): string {
  const viewWidth = columns * 128;
  const overlay: string[] = [
    `<svg x="${x}" y="${y}" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${viewWidth} 256" preserveAspectRatio="none">`,
  ];
  if (annotate) {
    overlay.push(
      '<path d="M128 28V228 M28 128H228" fill="none" stroke="#4E7D79" stroke-width="1" stroke-dasharray="4 4" opacity="0.32"/>',
      '<path d="M166 96H206" fill="none" stroke="#4E7D79" stroke-width="1.5"/>',
      text(208, 100, '4 PIECES', 7, 820, '#294B3C'),
    );
  }
  if (columns === 3) {
    overlay.push(
      '<rect x="256" y="0" width="128" height="256" fill="#FFFFFF" fill-opacity="0.07" stroke="#606A64" stroke-width="1.5" stroke-dasharray="7 5"/>',
      text(320, 120, '1-CELL', 10, 800, MUTED, 'middle'),
      text(320, 138, 'CLEAR AISLE', 10, 800, MUTED, 'middle'),
    );
  }
  overlay.push('</svg>');
  return overlay.join('');
}

async function thickWallBlockWindow(
  options: CliOptions,
  x: number,
  y: number,
  width: number,
  height: number,
  fileOverrides: CompositionFileOverrides,
  mode: 'raw-corner-reuse' | 'authored-candidate',
  floorFill: string = A1A_PALETTE.floor,
  columns: 2 | 3 = 2,
  annotate = false,
): Promise<string> {
  const block = await compositionWindow(
    options,
    mode === 'raw-corner-reuse'
      ? THICK_WALL_BLOCK_CONTROL_CELLS
      : thickWallBlockCandidateCells(),
    columns,
    2,
    x,
    y,
    width,
    height,
    fileOverrides,
    undefined,
    false,
    floorFill,
  );
  return block + thickWallBlockGuideOverlay(x, y, width, height, columns, annotate);
}

async function renderEqualHeightThickWallBlockGate(
  options: CliOptions,
  root: string,
): Promise<void> {
  const gate = EQUAL_HEIGHT_THICK_WALL_BLOCK_GATE;
  const width = 1600;
  const height = 1740;
  const panelFill = '#ECE5D5';
  const panel = (x: number, y: number, w: number, h: number): string =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${panelFill}" ` +
    `stroke="${INK}" stroke-width="1.5" opacity="0.96"/>`;
  const fileOverrides: CompositionFileOverrides = {
    ...await southeastReviewFileOverrides(options),
    ...await verticalTerminusProposalFileOverrides(options, root),
    ...await thickWallBlockProposalFileOverrides(options, root),
  };
  const parts: string[] = [
    `<rect width="${width}" height="${height}" rx="18" fill="${PANEL}"/>`,
    text(24, 38, 'QUOTACO EQUAL-HEIGHT WALLS — ACCEPTED 2x2 THICK-WALL FAMILY', 24, 820),
    text(24, 68, 'Owner-accepted proof layer · two fixed-light west sources plus two approved X-mirror derivations · solid top lives in the pieces', 13, 650, MUTED),
    text(1576, 38, 'FOUR MAPPINGS ACCEPTED', 11, 820, A1A_PALETTE.green, 'end'),
    text(1576, 62, '19 direct · 14 derived · 14 synthetic · 0 unresolved', 10, 700, MUTED, 'end'),

    panel(20, 92, 1560, 560),
    text(44, 126, 'THE PLAYER ACTION — FILL THE OPEN CROOK', 14, 820),
    text(44, 150, 'The old concave turn does not receive a decorative patch. The occupied cells become one two-cell-thick wall mass.', 10, 650, MUTED),

    panel(20, 672, 1560, 440),
    text(44, 706, 'WHY MASK_16 ALONE WAS THE WRONG REVIEW UNIT', 14, 820),
    text(44, 730, 'Accepted perimeter corners remain the control. The accepted sources remove buried pocket geometry at source, so no full-block overlay is needed.', 10, 650, MUTED),

    panel(20, 1132, 1560, 330),
    text(44, 1166, 'GAME-DISTANCE + COMPACT-PLACEMENT CHECKS', 14, 820),
    text(44, 1190, 'Judge one solid mass at 90 and 40 px per cell, on both grounds, then beside a one-cell clear aisle.', 10, 650, MUTED),

    panel(20, 1482, 1560, 234),
    text(44, 1518, 'READING CONTRACT', 14, 820),
    text(824, 1518, 'PROOF BOUNDARY', 14, 820),
  ];

  parts.push(text(274, 184, 'A · THREE-CELL L · NE OPEN', 11, 820, MUTED, 'middle'));
  parts.push(
    await compositionWindow(
      options,
      openElbowControlCells(),
      2,
      2,
      54,
      204,
      440,
      400,
      fileOverrides,
      undefined,
      true,
    ),
  );
  parts.push(text(790, 365, 'ADD WALL', 12, 850, '#B65F4D', 'middle'));
  parts.push('<path d="M705 382H870" fill="none" stroke="#B65F4D" stroke-width="4" stroke-linecap="round"/><path d="M870 382L848 367V397Z" fill="#B65F4D"/>');
  parts.push(text(790, 410, 'the crook becomes occupied', 9, 700, MUTED, 'middle'));
  parts.push(text(1126, 184, 'B · FOUR ACCEPTED SOURCE MAPPINGS · ONE TOP', 11, 820, A1A_PALETTE.green, 'middle'));
  parts.push(await thickWallBlockWindow(options, 906, 204, 440, 400, fileOverrides, 'authored-candidate', A1A_PALETTE.floor, 2, true));
  parts.push(text(1390, 274, '20', 10, 850, MUTED));
  parts.push(text(1514, 274, '26', 10, 850, MUTED));
  parts.push(text(1390, 548, '16', 10, 850, MUTED));
  parts.push(text(1514, 548, '34', 10, 850, MUTED));
  parts.push(text(906, 628, 'All four rows recalculate together; no literal mask_3 remains inside the completed block.', 9, 700, '#294B3C'));

  parts.push(text(244, 764, 'RAW CORNER REUSE', 11, 820, '#9A493D', 'middle'));
  parts.push(await thickWallBlockWindow(options, 54, 786, 380, 296, fileOverrides, 'raw-corner-reuse'));
  parts.push(text(244, 1098, 'wrong: four inward faces survive', 9, 750, '#9A493D', 'middle'));
  parts.push(text(704, 764, 'ACCEPTED AUTHORED FAMILY', 11, 820, A1A_PALETTE.green, 'middle'));
  parts.push(await thickWallBlockWindow(options, 514, 786, 380, 296, fileOverrides, 'authored-candidate'));
  parts.push(text(704, 1098, 'source truth: the inner return is gone', 9, 750, '#294B3C', 'middle'));
  parts.push(text(980, 800, 'THE CHANGE', 10, 850, '#B65F4D'));
  parts.push(text(980, 838, '• preserve the accepted outside silhouette', 10, 700, INK));
  parts.push(text(980, 874, '• suppress buried coral / green / charcoal pocket faces', 10, 700, INK));
  parts.push(text(980, 910, '• continue one cream wall-top plane through the center', 10, 700, INK));
  parts.push(text(980, 946, '• restore the south-facing cream material shade above coral', 10, 700, INK));
  parts.push(text(980, 982, '• keep the tri-tone frontage as the foreground owner', 10, 700, INK));
  parts.push(text(980, 1030, 'mask_20 + mask_16 are accepted direct fixed-light proof sources.', 9, 700, MUTED));
  parts.push(text(980, 1058, 'mask_26 + mask_34 are accepted X mirrors; mask_34 keeps the southeast seam filter.', 9, 700, MUTED));

  const distanceChecks: ReadonlyArray<readonly [number, number, number, string, string]> = [
    [54, 1220, 180, A1A_PALETTE.floor, '90 PX / CELL · LIGHT'],
    [264, 1220, 180, A1A_PALETTE.charcoal, '90 PX / CELL · DARK'],
    [480, 1265, 80, A1A_PALETTE.floor, '40 · LIGHT'],
    [588, 1265, 80, A1A_PALETTE.charcoal, '40 · DARK'],
  ];
  for (const [x, y, size, floorFill, label] of distanceChecks) {
    parts.push(await thickWallBlockWindow(options, x, y, size, size, fileOverrides, 'authored-candidate', floorFill));
    parts.push(text(x + size / 2, y + size + 20, label, 8, 800, MUTED, 'middle'));
  }
  parts.push(text(1112, 1218, 'TWO WALL COLUMNS + ONE CLEAR AISLE', 10, 820, MUTED, 'middle'));
  parts.push(await thickWallBlockWindow(options, 770, 1240, 684, 184, fileOverrides, 'authored-candidate', A1A_PALETTE.floor, 3));

  const readingLines = [
    'One outer silhouette; no inner service well',
    'The former crook reads as ordinary wall top',
    'South-facing cream material shade plus coral and green stay on the exposed face',
    'The rule survives at 40 px per cell',
  ];
  for (const [index, line] of readingLines.entries()) {
    parts.push(text(44, 1556 + index * 34, `• ${line}`, 10, 700, index < 3 ? '#294B3C' : MUTED));
  }
  const boundaryLines: ReadonlyArray<readonly [string, string]> = [
    ['OWNER ACCEPTED · FILLED-BLOCK FAMILY', A1A_PALETTE.green],
    ['mask rows 16 / 20 are direct accepted sources', MUTED],
    ['mask rows 26 / 34 are accepted mirror-X derivations', MUTED],
    ['PROOF-LAYER LEDGER PROMOTION ONLY', '#4E7D79'],
    ['NO EXPORT / ATLAS / SCHEMA / UNITY', '#9A493D'],
  ];
  for (const [index, [line, color]] of boundaryLines.entries()) {
    parts.push(text(824, 1556 + index * 32, line, index === 0 || index >= 3 ? 10 : 9, index === 0 || index >= 3 ? 820 : 680, color));
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * CARD_RENDER_SCALE },
  }).render().asPng();
  await writeFile(path.join(options.output, `${gate.stem}.png`), png);
}

function equalHeightIsolatedShellCell(
  layer: EqualHeightIsolatedShellLayer = 'composed',
  col = 0,
  row = 0,
): CompositionCell {
  const gate = EQUAL_HEIGHT_ISOLATED_SHELL_GATE;
  if (layer === 'base') return [col, row, gate.baseFile, null];
  if (layer === 'upper') return [col, row, EMPTY_WORKBENCH_FILE, gate.upperFile];
  return [col, row, gate.baseFile, gate.upperFile];
}

function equalHeightIsolatedShellContextCells(
  positions: readonly (readonly [number, number])[],
): CompositionCell[] {
  return positions.map(([col, row]) => equalHeightIsolatedShellCell('composed', col, row));
}

async function renderEqualHeightIsolatedShellGate(
  options: CliOptions,
  root: string,
): Promise<void> {
  const gate = EQUAL_HEIGHT_ISOLATED_SHELL_GATE;
  const width = 1600;
  const height = 1580;
  const panelFill = '#ECE5D5';
  const panel = (x: number, y: number, w: number, h: number): string =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${panelFill}" ` +
    `stroke="${INK}" stroke-width="1.5" opacity="0.96"/>`;
  const fileOverrides = {
    ...await isolatedShellProposalFileOverrides(options, root),
    ...await verticalTerminusProposalFileOverrides(options, root),
  };
  const singleContext = gate.contexts[0];
  const pairContext = gate.contexts[1];
  const parts: string[] = [
    `<rect width="${width}" height="${height}" rx="18" fill="${PANEL}"/>`,
    text(24, 38, 'QUOTACO EQUAL-HEIGHT WALLS — ACCEPTED MASK_0 ISOLATED SHELL GATE', 24, 820),
    text(24, 68, 'Owner-accepted proof layer · one full-height structural housing · zero cardinal sockets · no transform', 13, 650, MUTED),
    text(1576, 38, 'MASK_0 MAPPING ACCEPTED', 11, 820, A1A_PALETTE.green, 'end'),
    text(1576, 62, '19 direct · 14 derived · 14 synthetic · 0 unresolved', 10, 700, MUTED, 'end'),

    panel(20, 92, 1120, 410),
    text(44, 126, 'ONE MOLDED HOUSING — LAYER READ AT 240 PX', 14, 820),
    text(44, 150, 'Base owns one continuous green body; upper commits to the accepted front-on wall plane.', 10, 650, MUTED),
    panel(1160, 92, 420, 410),
    text(1184, 126, 'DISTANCE + GROUND CHECK', 14, 820),
    text(1184, 150, 'The silhouette must survive without labels.', 10, 650, MUTED),

    panel(20, 522, 760, 570),
    text(44, 556, 'ONE OCCUPIED CELL IN A 3×3 FLOOR', 14, 820),
    text(44, 580, 'Contained alpha on every edge: this tile exposes four sides and joins nothing.', 10, 650, MUTED),
    panel(800, 522, 780, 570),
    text(824, 556, 'COMPACT SEPARATION + FAMILY SCALE', 14, 820),
    text(824, 580, 'Two diagonal shells stay separate; accepted neighbors establish the shared wall mass.', 10, 650, MUTED),

    panel(20, 1112, 1560, 448),
    text(44, 1148, 'READING CONTRACT', 14, 820),
    text(824, 1148, 'PROOF BOUNDARY', 14, 820),
  ];

  for (const [index, layer] of gate.reviewLayers.entries()) {
    const x = 58 + index * 350;
    parts.push(text(x + 120, 184, layer.toUpperCase(), 11, 820, layer === 'composed' ? '#294B3C' : MUTED, 'middle'));
    parts.push(
      await compositionWindow(
        options,
        [equalHeightIsolatedShellCell(layer)],
        1,
        1,
        x,
        204,
        240,
        240,
        fileOverrides,
      ),
    );
    parts.push(text(x + 120, 466, layer === 'composed' ? 'ONE ACCEPTED SHELL · NOT FOUR CAPS' : `${layer} source`, 10, 780, layer === 'composed' ? A1A_PALETTE.green : MUTED, 'middle'));
  }

  const distanceChecks: ReadonlyArray<readonly [number, number, 90 | 40, string, string]> = [
    [1192, 190, 90, A1A_PALETTE.floor, '90 · LIGHT'],
    [1360, 190, 90, A1A_PALETTE.charcoal, '90 · DARK'],
    [1217, 350, 40, A1A_PALETTE.floor, '40 · LIGHT'],
    [1385, 350, 40, A1A_PALETTE.charcoal, '40 · DARK'],
  ];
  for (const [x, y, size, floorFill, label] of distanceChecks) {
    parts.push(
      await compositionWindow(
        options,
        [equalHeightIsolatedShellCell()],
        1,
        1,
        x,
        y,
        size,
        size,
        fileOverrides,
        undefined,
        false,
        floorFill,
      ),
    );
    parts.push(text(x + size / 2, y + size + 18, label, 9, 800, MUTED, 'middle'));
  }
  parts.push(text(1184, 454, 'PASS · squat structural mass, visible coral register, no post or appliance read', 9, 740, '#294B3C'));

  parts.push(text(179, 618, '90 PX / CELL', 10, 820, MUTED, 'middle'));
  parts.push(
    await compositionWindow(
      options,
      equalHeightIsolatedShellContextCells(singleContext.positions),
      singleContext.columns,
      singleContext.rows,
      44,
      636,
      270,
      270,
      fileOverrides,
    ),
  );
  parts.push(text(410, 618, '40 PX / CELL', 10, 820, MUTED, 'middle'));
  parts.push(
    await compositionWindow(
      options,
      equalHeightIsolatedShellContextCells(singleContext.positions),
      singleContext.columns,
      singleContext.rows,
      350,
      636,
      120,
      120,
      fileOverrides,
      undefined,
      true,
    ),
  );
  parts.push(text(44, 956, 'ZERO-SOCKET TEST', 10, 820, '#9A493D'));
  parts.push(text(44, 982, '• no alpha reaches north / east / south / west cell boundaries', 10, 680, MUTED));
  parts.push(text(44, 1008, '• no cardinal nose, collar, or half-join implies a neighbor', 10, 680, MUTED));
  parts.push(text(44, 1034, '• one cell remains visibly blocked without pretending to be a full room', 10, 680, MUTED));

  parts.push(text(938, 618, 'DIAGONAL PAIR · 90 PX / CELL', 10, 820, MUTED, 'middle'));
  parts.push(
    await compositionWindow(
      options,
      equalHeightIsolatedShellContextCells(pairContext.positions),
      pairContext.columns,
      pairContext.rows,
      848,
      636,
      180,
      180,
      fileOverrides,
    ),
  );
  parts.push(text(1108, 618, '40 PX / CELL', 10, 820, MUTED, 'middle'));
  parts.push(
    await compositionWindow(
      options,
      equalHeightIsolatedShellContextCells(pairContext.positions),
      pairContext.columns,
      pairContext.rows,
      1068,
      636,
      80,
      80,
      fileOverrides,
    ),
  );

  const comparisons: ReadonlyArray<readonly [string, CompositionCell]> = [
    ['NW CORNER', [0, 0, 'full_exterior_corner-base.svg', 'full_exterior_corner-upper.svg']],
    ['MASK_0', equalHeightIsolatedShellCell()],
    ['H END', [0, 0, 'full_terminus-base.svg', 'full_terminus-upper.svg']],
    ['V END', [0, 0, 'vertical_s_terminus-base.svg', 'vertical_s_terminus-upper.svg']],
  ];
  for (const [index, [label, cell]] of comparisons.entries()) {
    const x = 824 + index * 178;
    parts.push(
      await compositionWindow(options, [cell], 1, 1, x, 846, 90, 90, fileOverrides),
    );
    parts.push(text(x + 45, 954, label, 9, 820, label === 'MASK_0' ? A1A_PALETTE.green : MUTED, 'middle'));
  }
  parts.push(text(824, 994, 'Same 128×128 cell · same tri-tone hierarchy · deliberately different topology', 10, 700, MUTED));
  parts.push(text(824, 1024, 'The isolated cell is a compact pier, never a terminus with nowhere to connect.', 10, 700, '#294B3C'));

  const readingLines = [
    'ONE uninterrupted rounded-square outer contour',
    'ONE front-on cream coping plane with one horizontal edge',
    'ONE coral register spanning the same front-facing plane',
    'ONE broad green body and compact charcoal contact edge',
    'No vertical side register competes with the chosen front perspective',
    'At 40 px: near-square mass first, tri-tone hierarchy second',
  ];
  for (const [index, line] of readingLines.entries()) {
    parts.push(text(44, 1184 + index * 48, `• ${line}`, 11, 700, index < 4 ? '#294B3C' : MUTED));
  }
  parts.push(text(44, 1490, 'FAIL IF IT READS AS', 10, 820, '#9A493D'));
  parts.push(text(44, 1518, 'four caps · pipe fitting · bollard · appliance · decorative prop', 11, 760, '#9A493D'));

  const boundaryLines: ReadonlyArray<readonly [string, string]> = [
    ['MASK_0 · DIRECT SOURCE ACCEPTED', A1A_PALETTE.green],
    ['ledger row accepted · source provenance only', MUTED],
    ['one authored orientation · no mirror / rotation', MUTED],
    ['external editable proof pair retained', MUTED],
    ['NO PRODUCTION REGISTRATION', '#9A493D'],
    ['NO EXPORT / ATLAS / SCHEMA', '#9A493D'],
    ['NO UNITY OR TOPOLOGY MUTATION', '#9A493D'],
    ['OWNER-ACCEPTED PROOF SOURCE', A1A_PALETTE.green],
  ];
  for (const [index, [line, color]] of boundaryLines.entries()) {
    parts.push(text(824, 1188 + index * 43, line, index === 0 || index >= 4 ? 11 : 10, index === 0 || index >= 4 ? 820 : 680, color));
  }
  parts.push(text(824, 1516, 'Acceptance records proof-layer provenance only; production remains a separate decision.', 10, 700, MUTED));

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * CARD_RENDER_SCALE },
  }).render().asPng();
  await writeFile(path.join(options.output, `${gate.stem}.png`), png);
}

async function renderEqualHeightVerticalTerminusGate(
  options: CliOptions,
  root: string,
): Promise<void> {
  const gate = EQUAL_HEIGHT_VERTICAL_TERMINUS_GATE;
  const width = 2000;
  const height = 2200;
  const panelFill = '#ECE5D5';
  const panel = (x: number, y: number, w: number, h: number): string =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${panelFill}" ` +
    `stroke="${INK}" stroke-width="1.5" opacity="0.96"/>`;
  const fileOverrides = await verticalTerminusProposalFileOverrides(options, root);
  const parts: string[] = [
    `<rect width="${width}" height="${height}" rx="18" fill="${PANEL}"/>`,
    text(24, 38, 'QUOTACO EQUAL-HEIGHT WALLS — ACCEPTED VERTICAL TERMINUS GATE', 24, 820),
    text(24, 68, 'Owner-accepted proof layer · two authored wall rollovers · west source + east mirror-X derivation', 13, 650, MUTED),
    text(1976, 38, 'MASK_1 + MASK_4 MAPPING ACCEPTED', 11, 820, A1A_PALETTE.green, 'end'),
    text(1976, 62, '19 direct · 14 derived · 14 synthetic · 0 unresolved', 10, 700, MUTED, 'end'),
  ];

  const isolated: ReadonlyArray<readonly [1 | 4, EqualHeightVerticalTerminusWallSide]> = [
    [1, 'west'],
    [1, 'east'],
    [4, 'west'],
    [4, 'east'],
  ];
  for (const [cardIndex, [maskIndex, wallSide]] of isolated.entries()) {
    const x = 20 + cardIndex * 495;
    const candidate = gate.cases.find((entry) => entry.index === maskIndex)!;
    const direct = wallSide === 'west';
    parts.push(panel(x, 92, 475, 388));
    parts.push(text(x + 22, 124, `${candidate.maskId.toUpperCase()} · ${candidate.label.toUpperCase()}`, 13, 820));
    parts.push(text(
      x + 22,
      148,
      direct ? 'WEST · accepted authored source' : 'EAST · accepted whole-cell X mirror',
      10,
      760,
      direct ? A1A_PALETTE.green : '#4E7D79',
    ));
    parts.push(
      await compositionWindow(
        options,
        equalHeightVerticalTerminusCell(maskIndex, wallSide),
        1,
        1,
        x + 20,
        170,
        240,
        240,
        fileOverrides,
      ),
      await compositionWindow(
        options,
        equalHeightVerticalTerminusCell(maskIndex, wallSide),
        1,
        1,
        x + 286,
        184,
        90,
        90,
        fileOverrides,
      ),
      await compositionWindow(
        options,
        equalHeightVerticalTerminusCell(maskIndex, wallSide),
        1,
        1,
        x + 306,
        308,
        40,
        40,
        fileOverrides,
        undefined,
        false,
      ),
    );
    parts.push(text(x + 140, 438, '240 PX', 10, 800, MUTED, 'middle'));
    parts.push(text(x + 331, 292, '90 PX', 10, 800, MUTED, 'middle'));
    parts.push(text(x + 326, 366, '40 PX', 10, 800, MUTED, 'middle'));
    parts.push(text(
      x + 388,
      406,
      maskIndex === 1 ? 'FRONT END' : 'REAR END',
      10,
      820,
      maskIndex === 1 ? '#9A493D' : '#4E7D79',
      'middle',
    ));
    parts.push(text(
      x + 388,
      430,
      maskIndex === 1 ? 'tri-tone wall rollover' : 'cream-led wall rollover',
      9,
      700,
      MUTED,
      'middle',
    ));
  }

  const installed: ReadonlyArray<readonly [1 | 4, EqualHeightVerticalTerminusWallSide]> = isolated;
  for (const [panelIndex, [maskIndex, wallSide]] of installed.entries()) {
    const x = 20 + panelIndex * 495;
    const candidate = gate.cases.find((entry) => entry.index === maskIndex)!;
    parts.push(panel(x, 500, 475, 950));
    parts.push(text(x + 22, 534, `${candidate.maskId.toUpperCase()} · ${wallSide.toUpperCase()} INSTALLED`, 14, 820));
    parts.push(text(
      x + 22,
      558,
      maskIndex === 1 ? 'body → exposed south end' : 'exposed north end → body',
      10,
      700,
      MUTED,
    ));
    for (const [runIndex, bodyLength] of gate.bodyRunLengths.entries()) {
      const runX = x + 22 + runIndex * 110;
      const runY = 602;
      parts.push(text(runX + 45, 588, `${bodyLength} BODY`, 9, 820, MUTED, 'middle'));
      parts.push(
        await compositionWindow(
          options,
          equalHeightVerticalTerminusRunCells(maskIndex, bodyLength, wallSide),
          1,
          bodyLength + 1,
          runX,
          runY,
          90,
          (bodyLength + 1) * 90,
          fileOverrides,
        ),
      );
    }
    parts.push(text(x + 416, 588, '40 PX', 9, 820, MUTED, 'middle'));
    let compactY = 602;
    for (const bodyLength of gate.bodyRunLengths) {
      const compactHeight = (bodyLength + 1) * 40;
      parts.push(
        await compositionWindow(
          options,
          equalHeightVerticalTerminusRunCells(maskIndex, bodyLength, wallSide),
          1,
          bodyLength + 1,
          x + 396,
          compactY,
          40,
          compactHeight,
          fileOverrides,
          undefined,
          false,
        ),
      );
      parts.push(text(x + 454, compactY + compactHeight / 2 + 3, `${bodyLength}`, 9, 800, MUTED, 'middle'));
      compactY += compactHeight + 18;
    }
    parts.push(text(x + 22, 1378, maskIndex === 1
      ? 'The same cream, coral, and green registers turn through the shallow south end.'
      : 'The same wall registers close beneath one quiet cream-led north rollover.', 10, 680, MUTED));
    parts.push(text(x + 22, 1406, wallSide === 'west'
      ? 'Accepted source · no transform'
      : 'Accepted derivation · matrix(-1 0 0 1 128 0)', 9, 780, wallSide === 'west' ? A1A_PALETTE.green : '#4E7D79'));
  }

  parts.push(
    panel(20, 1470, 760, 710),
    panel(800, 1470, 760, 710),
    panel(1580, 1470, 400, 710),
    text(44, 1504, 'MINIMUM SEGMENTS — ENDS MUST NOT SWALLOW SHORT WALLS', 14, 820),
    text(44, 1528, 'Two exposed ends directly joined, then one ordinary body cell between them; west and east presentations.', 10, 650, MUTED),
    text(824, 1504, '240 PX SOCKET AUDIT — BASE / UPPER / COMPOSED', 14, 820),
    text(824, 1528, 'Every crop straddles the cell boundary; the ordinary body cell owns its module seam.', 10, 650, MUTED),
    text(1604, 1504, 'ACCEPTED PROOF BOUNDARY', 14, 820),
  );

  const minimumSegments: ReadonlyArray<readonly [0 | 1, EqualHeightVerticalTerminusWallSide]> = [
    [0, 'west'],
    [1, 'west'],
    [0, 'east'],
    [1, 'east'],
  ];
  for (const [index, [bodyLength, wallSide]] of minimumSegments.entries()) {
    const x = 44 + index * 180;
    parts.push(text(
      x + 84,
      1560,
      `${wallSide.toUpperCase()} · ${bodyLength === 0 ? '2 CAPS' : '1 BODY'} · 120 / 40`,
      8,
      820,
      MUTED,
      'middle',
    ));
    parts.push(
      await compositionWindow(
        options,
        equalHeightVerticalTerminusMinimumSegmentCells(bodyLength, wallSide),
        1,
        bodyLength + 2,
        x,
        1576,
        120,
        (bodyLength + 2) * 120,
        fileOverrides,
      ),
      await compositionWindow(
        options,
        equalHeightVerticalTerminusMinimumSegmentCells(bodyLength, wallSide),
        1,
        bodyLength + 2,
        x + 128,
        1576,
        40,
        (bodyLength + 2) * 40,
        fileOverrides,
        undefined,
        false,
      ),
    );
  }
  parts.push(text(44, 2046, 'PASS TARGET', 10, 820, A1A_PALETTE.green));
  parts.push(text(44, 2072, 'The two-cell segment remains one constant-width wall, not two fittings joined by a pipe.', 10, 680, MUTED));
  parts.push(text(44, 2098, 'The three-cell segment reveals one clean, flush socket on each side of the body.', 10, 680, MUTED));
  parts.push(text(44, 2124, 'At 40 px both ends stay flush with the shaft while their different projected planes remain legible.', 10, 680, MUTED));

  for (const [layerIndex, layer] of gate.socketAuditLayers.entries()) {
    const x = 820 + layerIndex * 245;
    parts.push(text(x + 120, 1558, layer.toUpperCase(), 10, 820, MUTED, 'middle'));
    for (const [caseIndex, maskIndex] of ([1, 4] as const).entries()) {
      const y = 1572 + caseIndex * 268;
      parts.push(
        await compositionWindow(
          options,
          equalHeightVerticalTerminusRunCells(maskIndex, 1, 'west', layer),
          1,
          2,
          x,
          y,
          240,
          240,
          fileOverrides,
          '32 80 96 96',
          true,
        ),
      );
      parts.push(
        `<path d="M${x} ${y + 120}H${x + 240}" fill="none" stroke="${A1A_PALETTE.coral}" ` +
        'stroke-width="1.5" stroke-dasharray="7 6" opacity="0.82"/>',
      );
      parts.push(text(x + 12, y + 22, `MASK_${maskIndex} SOCKET`, 9, 820, '#9A493D'));
    }
  }
  parts.push(text(824, 2118, 'PASS TARGET · exact ingress pixels, no alpha crack, no doubled bar, no rounded lobe at either socket.', 10, 740, A1A_PALETTE.green));

  const contractLines = [
    ['TWO AUTHORED DIRECTIONS', A1A_PALETTE.green],
    ['mask_1 · end S · foreground rollover', MUTED],
    ['mask_4 · end N · rear rollover', MUTED],
    ['NO ROTATION', '#9A493D'],
    ['NO Y MIRROR', '#9A493D'],
    ['X MIRROR · ACCEPTED', '#4E7D79'],
    ['LEDGER ROWS ACCEPTED', A1A_PALETTE.green],
    ['mask_1 / 4 · derived', MUTED],
    ['mask_0 · accepted direct source', A1A_PALETTE.green],
    ['NO EXPORT', MUTED],
    ['NO ATLAS', MUTED],
    ['NO SCHEMA', MUTED],
    ['NO UNITY MUTATION', MUTED],
  ] as const;
  for (const [index, [line, color]] of contractLines.entries()) {
    parts.push(text(1604, 1550 + index * 42, line, index % 3 === 0 ? 11 : 10, index % 3 === 0 ? 820 : 680, color));
  }
  parts.push(text(1604, 2082, 'OWNER DECISION', 11, 820, A1A_PALETTE.green));
  parts.push(text(1604, 2110, 'Accepted as one complete', 10, 680, MUTED));
  parts.push(text(1604, 2134, 'proof-layer source family.', 10, 680, MUTED));

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * CARD_RENDER_SCALE },
  }).render().asPng();
  await writeFile(path.join(options.output, `${gate.stem}.png`), png);
}

async function renderEqualHeightHorizontalTerminusGate(options: CliOptions): Promise<void> {
  const gate = EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE;
  const width = 1800;
  const height = 1600;
  const panelFill = '#ECE5D5';
  const panel = (x: number, y: number, w: number, h: number): string =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${panelFill}" ` +
    `stroke="${INK}" stroke-width="1.5" opacity="0.96"/>`;
  const fileOverrides: CompositionFileOverrides = {
    [EMPTY_WORKBENCH_FILE]: EMPTY_WORKBENCH_SOURCE,
  };
  const parts: string[] = [
    `<rect width="${width}" height="${height}" rx="18" fill="${PANEL}"/>`,
    text(24, 36, 'QUOTACO EQUAL-HEIGHT WALLS — ACCEPTED HORIZONTAL TERMINUS GATE', 23, 820),
    text(24, 64, 'Owner-accepted proof-layer source · mask_8 direct · mask_2 whole-cell mirror-X', 13, 650, MUTED),
    text(1776, 36, 'MASK_8 + MASK_2 MAPPING ACCEPTED', 11, 820, A1A_PALETTE.green, 'end'),
    text(1776, 60, 'No rotation · no second source · no production registration', 10, 700, MUTED, 'end'),
    panel(20, 92, 870, 354),
    panel(910, 92, 870, 354),
    panel(20, 466, 870, 524),
    panel(910, 466, 870, 524),
    panel(20, 1010, 1120, 566),
    panel(1160, 1010, 620, 566),
    text(44, 126, 'MASK_8 · CONNECTED W · CAP E', 15, 820),
    text(44, 150, 'Accepted direct reuse · existing full_terminus pair · transform none', 11, 650, MUTED),
    text(934, 126, 'MASK_2 · CONNECTED E · CAP W', 15, 820),
    text(934, 150, 'Accepted derivation · same pair · matrix(-1 0 0 1 128 0)', 11, 650, MUTED),
    text(350, 184, '90 PX', 10, 800, MUTED, 'middle'),
    text(520, 246, '40 PX', 10, 800, MUTED, 'middle'),
    text(1240, 184, '90 PX', 10, 800, MUTED, 'middle'),
    text(1410, 246, '40 PX', 10, 800, MUTED, 'middle'),
    text(604, 212, 'MOLDED END, NOT A PATCH', 12, 820, A1A_PALETTE.green),
    text(604, 240, '• cap owns only the exposed end', 11, 650, MUTED),
    text(604, 266, '• incoming wall strata stay unchanged', 11, 650, MUTED),
    text(604, 292, '• post remains substantial at 40 px', 11, 650, MUTED),
    text(1494, 212, 'WHOLE-CELL MIRROR', 12, 820, '#4E7D79'),
    text(1494, 240, '• identical mass and centred pivot', 11, 650, MUTED),
    text(1494, 266, '• no new stem or frame identity', 11, 650, MUTED),
    text(1494, 292, '• fixed-light polish judged here', 11, 650, MUTED),
    text(44, 500, 'MASK_8 INSTALLED · BODY → CAP', 14, 820),
    text(44, 524, '1 / 3 / 6 body cells at 90 px; the compact strip repeats all three at 40 px.', 11, 650, MUTED),
    text(934, 500, 'MASK_2 INSTALLED · CAP → BODY', 14, 820),
    text(934, 524, 'The terminus mirrors; the accepted horizontal body source does not rotate.', 11, 650, MUTED),
    text(44, 1044, 'SOCKET AUDIT · BASE / UPPER / COMPOSED', 14, 820),
    text(44, 1068, 'Each crop straddles the tile boundary. The first 96 source units inherit the accepted straight exactly.', 11, 650, MUTED),
    text(1184, 1044, 'CAP SILHOUETTE + DEFERRALS', 14, 820),
    text(1184, 1068, 'The local molded end stays intact while only its incoming socket changes.', 11, 650, MUTED),
  ];

  parts.push(
    await compositionWindow(options, equalHeightHorizontalTerminusCell(8), 1, 1, 64, 170, 240, 240),
    await compositionWindow(options, equalHeightHorizontalTerminusCell(8), 1, 1, 350, 200, 90, 90),
    await compositionWindow(options, equalHeightHorizontalTerminusCell(8), 1, 1, 500, 260, 40, 40),
    await compositionWindow(options, equalHeightHorizontalTerminusCell(2), 1, 1, 954, 170, 240, 240),
    await compositionWindow(options, equalHeightHorizontalTerminusCell(2), 1, 1, 1240, 200, 90, 90),
    await compositionWindow(options, equalHeightHorizontalTerminusCell(2), 1, 1, 1390, 260, 40, 40),
  );

  for (const [panelIndex, maskIndex] of ([8, 2] as const).entries()) {
    const panelX = panelIndex === 0 ? 20 : 910;
    for (const [row, bodyLength] of gate.bodyRunLengths.entries()) {
      const runWidth = (bodyLength + 1) * 90;
      const runX = panelX + 190;
      const runY = 548 + row * 112;
      parts.push(text(panelX + 62, runY + 52, `${bodyLength} BODY`, 10, 820, MUTED, 'middle'));
      parts.push(
        await compositionWindow(
          options,
          equalHeightHorizontalTerminusRunCells(maskIndex, bodyLength),
          bodyLength + 1,
          1,
          runX,
          runY,
          runWidth,
          90,
        ),
      );
    }
    parts.push(text(panelX + 48, 930, '40 PX', 10, 820, MUTED));
    let compactX = panelX + 118;
    for (const bodyLength of gate.bodyRunLengths) {
      const compactWidth = (bodyLength + 1) * 40;
      parts.push(
        await compositionWindow(
          options,
          equalHeightHorizontalTerminusRunCells(maskIndex, bodyLength),
          bodyLength + 1,
          1,
          compactX,
          908,
          compactWidth,
          40,
          {},
          undefined,
          false,
        ),
      );
      parts.push(text(compactX + compactWidth / 2, 968, `${bodyLength}`, 9, 800, MUTED, 'middle'));
      compactX += compactWidth + 28;
    }
  }

  const cropLayers = gate.socketAuditLayers;
  for (const [layerIndex, layer] of cropLayers.entries()) {
    const groupX = 48 + layerIndex * 354;
    parts.push(text(groupX + 150, 1104, layer.toUpperCase(), 11, 820, MUTED, 'middle'));
    for (const [facingIndex, maskIndex] of ([8, 2] as const).entries()) {
      const cropX = groupX + facingIndex * 160;
      parts.push(text(cropX + 60, 1124, maskIndex === 8 ? 'DIRECT' : 'MIRROR', 9, 800, maskIndex === 8 ? A1A_PALETTE.green : '#4E7D79', 'middle'));
      parts.push(
        await compositionWindow(
          options,
          equalHeightHorizontalTerminusRunCells(maskIndex, 1, layer),
          2,
          1,
          cropX,
          1136,
          120,
          150,
          fileOverrides,
          '96 48 64 80',
          true,
        ),
      );
      parts.push(
        `<path d="M${cropX + 60} 1136V1286" fill="none" stroke="${A1A_PALETTE.coral}" ` +
        'stroke-width="1.5" stroke-dasharray="6 5" opacity="0.8"/>',
      );
    }
  }
  parts.push(text(44, 1324, 'PASS · base, upper, and composed sockets match the accepted horizontal ingress at 4× raster precision.', 11, 760, A1A_PALETTE.green));
  parts.push(text(44, 1352, 'The body cell owns its normal module seam; the terminus adds no rounded cap, dark bar, or alpha crack at the join.', 11, 650, MUTED));
  parts.push(text(44, 1396, 'ACCEPTED CHECKS', 11, 820, A1A_PALETTE.green));
  parts.push(text(44, 1422, 'One body cell: the end remains a catalog terminal without swallowing the wall.', 11, 650, MUTED));
  parts.push(text(44, 1448, 'Six body cells: the cap ends the module rhythm without becoming an appliance.', 11, 650, MUTED));
  parts.push(text(44, 1474, 'At 40 px: direct and mirrored facings remain legible from silhouette alone.', 11, 650, MUTED));
  parts.push(text(44, 1526, 'ACCEPTED PROOF-LAYER MAPPING · mask_8 and mask_2 only; no other ledger row moves.', 11, 820, A1A_PALETTE.green));

  parts.push(
    await compositionWindow(
      options,
      equalHeightHorizontalTerminusCell(8),
      1,
      1,
      1210,
      1100,
      144,
      240,
      {},
      '72 48 48 80',
      false,
    ),
    await compositionWindow(
      options,
      equalHeightHorizontalTerminusCell(2),
      1,
      1,
      1400,
      1100,
      144,
      240,
      {},
      '8 48 48 80',
      false,
    ),
  );
  parts.push(text(1282, 1360, 'CAP E', 10, 820, A1A_PALETTE.green, 'middle'));
  parts.push(text(1472, 1360, 'CAP W', 10, 820, '#4E7D79', 'middle'));
  parts.push(text(1184, 1404, 'VERTICAL ENDS ARE OWNED SEPARATELY', 11, 820, MUTED));
  parts.push(text(1184, 1432, 'mask_1 · accepted by the vertical terminus gate', 11, 700, A1A_PALETTE.green));
  parts.push(text(1184, 1458, 'mask_4 · accepted by the vertical terminus gate', 11, 700, A1A_PALETTE.green));
  parts.push(text(1184, 1494, 'They use authored rollovers; this source is never rotated.', 11, 650, MUTED));
  parts.push(text(1184, 1520, 'Isolated mask_0 is accepted by its own source gate, never derived from this cap.', 11, 650, MUTED));
  parts.push(text(1184, 1552, 'No export · no atlas · no schema · no Unity mutation', 10, 820, MUTED));

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * CARD_RENDER_SCALE },
  }).render().asPng();
  await writeFile(path.join(options.output, `${gate.stem}.png`), png);
}

const MASK_RESOLUTION_STYLE: Readonly<Record<EqualHeightMaskResolutionKind, {
  readonly label: string;
  readonly accent: string;
  readonly card: string;
}>> = {
  'direct-reuse': { label: 'DIRECT', accent: '#294B3C', card: '#E2E8DE' },
  'approved-derivation': { label: 'DERIVED', accent: '#4E7D79', card: '#DFE9E5' },
  'synthetic-assembly': { label: 'SYNTHETIC', accent: '#7B715F', card: '#EEE8D7' },
  'unresolved-authored-geometry': { label: 'UNRESOLVED', accent: '#B65F4D', card: '#F0DDD6' },
};

const maskList = (values: readonly string[]): string =>
  values.length === 0 ? '—' : values.map((value) => value.toUpperCase()).join(' ');

function equalHeightMaskTopologyGlyph(
  entry: EqualHeightMaskLedgerEntry,
  x: number,
  y: number,
  size: number,
): string {
  const cell = size / 3;
  const positions: Readonly<Record<string, readonly [number, number]>> = {
    n: [1, 0], e: [2, 1], s: [1, 2], w: [0, 1],
    ne: [2, 0], se: [2, 2], sw: [0, 2], nw: [0, 0],
  };
  const parts = [
    `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="4" fill="#D7D0C2"/>`,
    `<rect x="${x + cell + 1}" y="${y + cell + 1}" width="${cell - 2}" ` +
      `height="${cell - 2}" rx="2" fill="${A1A_PALETTE.green}"/>`,
  ];
  for (const edge of entry.connectedEdges) {
    const [col, row] = positions[edge];
    parts.push(
      `<rect x="${x + col * cell + 1}" y="${y + row * cell + 1}" ` +
      `width="${cell - 2}" height="${cell - 2}" rx="2" fill="${A1A_PALETTE.green}"/>`,
    );
  }
  for (const corner of entry.solidDiagonals) {
    const [col, row] = positions[corner];
    parts.push(
      `<rect x="${x + col * cell + 1}" y="${y + row * cell + 1}" ` +
      `width="${cell - 2}" height="${cell - 2}" rx="2" fill="${A1A_PALETTE.teal}"/>`,
    );
  }
  for (const corner of entry.pockets) {
    const [col, row] = positions[corner];
    parts.push(
      `<rect x="${x + col * cell + 2}" y="${y + row * cell + 2}" ` +
      `width="${cell - 4}" height="${cell - 4}" rx="2" fill="none" ` +
      `stroke="${A1A_PALETTE.coral}" stroke-width="1.5" stroke-dasharray="2 2"/>`,
    );
  }
  parts.push(
    `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="4" fill="none" ` +
    `stroke="${INK}" stroke-width="1" opacity="0.45"/>`,
  );
  return parts.join('');
}

function equalHeightMaskSchematic(
  entry: EqualHeightMaskLedgerEntry,
  x: number,
  y: number,
  size: number,
): string {
  const glyphInset = size * 0.08;
  return (
    `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="6" fill="url(#ledgerHatch)" ` +
    `stroke="${MASK_RESOLUTION_STYLE[entry.resolution.kind].accent}" stroke-width="1.5"/>` +
    equalHeightMaskTopologyGlyph(
      entry,
      x + glyphInset,
      y + glyphInset,
      size - glyphInset * 2,
    ) +
    text(x + size / 2, y + size - 5, 'SCHEMATIC', Math.max(5, size * 0.08), 800, MUTED, 'middle')
  );
}

function maskVariantCell(variant: EqualHeightMaskSourceVariant): CompositionCell {
  const usesThickWallSoutheastFilter =
    variant.sourceStem === 'filled_sw_elbow' &&
    variant.derivation === 'accepted-southeast-seam-filter';
  const usesOpenPocketEastFilter =
    variant.sourceStem === 'open_w_t_junction' &&
    variant.derivation === 'accepted-southeast-seam-filter';
  const usesEastPartialTJunctionFilter =
    variant.sourceStem === 'open_w_t_filled_ne' &&
    variant.derivation === 'accepted-southeast-seam-filter';
  return [
    0,
    0,
    usesThickWallSoutheastFilter
      ? THICK_WALL_SOUTHEAST_BASE_FILE
      : usesOpenPocketEastFilter
      ? OPEN_POCKET_T_JUNCTION_EAST_BASE_FILE
      : usesEastPartialTJunctionFilter
      ? EAST_PARTIAL_T_JUNCTION_FILTERED_BASE_FILE
      : variant.derivation === 'accepted-southeast-seam-filter'
      ? SOUTHEAST_WORKBENCH_BASE_FILE
      : variant.baseFile,
    usesThickWallSoutheastFilter
      ? THICK_WALL_SOUTHEAST_UPPER_FILE
      : usesOpenPocketEastFilter
      ? OPEN_POCKET_T_JUNCTION_EAST_UPPER_FILE
      : usesEastPartialTJunctionFilter
      ? EAST_PARTIAL_T_JUNCTION_FILTERED_UPPER_FILE
      : variant.derivation === 'accepted-southeast-seam-filter'
      ? SOUTHEAST_WORKBENCH_UPPER_FILE
      : variant.upperFile,
    variant.transform,
  ];
}

async function equalHeightMaskPreview(
  options: CliOptions,
  entry: EqualHeightMaskLedgerEntry,
  x: number,
  y: number,
  fileOverrides: CompositionFileOverrides,
): Promise<string> {
  if (
    entry.resolution.kind === 'synthetic-assembly' ||
    entry.resolution.kind === 'unresolved-authored-geometry'
  ) {
    return (
      equalHeightMaskSchematic(entry, x, y, 90) +
      equalHeightMaskSchematic(entry, x + 100, y + 25, 40)
    );
  }
  const variants = entry.resolution.variants;
  if (variants.length === 2) {
    return (
      await compositionWindow(
        options, [maskVariantCell(variants[0])], 1, 1, x, y + 10, 64, 64,
        fileOverrides, undefined, false,
      ) +
      await compositionWindow(
        options, [maskVariantCell(variants[1])], 1, 1, x + 72, y + 10, 64, 64,
        fileOverrides, undefined, false,
      ) +
      text(x + 32, y + 86, 'WEST', 8, 800, MUTED, 'middle') +
      text(x + 104, y + 86, 'EAST', 8, 800, MUTED, 'middle')
    );
  }
  const cell = maskVariantCell(variants[0]);
  return (
    await compositionWindow(
      options, [cell], 1, 1, x, y, 90, 90, fileOverrides, undefined, false,
    ) +
    await compositionWindow(
      options, [cell], 1, 1, x + 100, y + 25, 40, 40, fileOverrides, undefined, false,
    )
  );
}

function equalHeightMaskSourceLabel(entry: EqualHeightMaskLedgerEntry): string {
  if (entry.resolution.kind === 'unresolved-authored-geometry') {
    return entry.topologyClass === 'isolated' ? 'NEEDS ISOLATED SHELL' : 'NEEDS END FAMILY';
  }
  const variants = entry.resolution.kind === 'synthetic-assembly'
    ? entry.resolution.ingredients
    : entry.resolution.variants;
  const roles = [...new Set(variants.map((variant) => variant.role
    .replace('-corner', '')
    .replace('-wall', '')
    .replace('-cap-terminus', ' cap')
    .replace('north-or-south', 'north/south')))].join(' + ');
  return roles.length > 29 ? `${roles.slice(0, 28)}…` : roles;
}

function equalHeightMaskOperationLabel(entry: EqualHeightMaskLedgerEntry): string {
  if (entry.resolution.kind === 'direct-reuse') return 'exact accepted source';
  if (entry.resolution.kind === 'approved-derivation') {
    if (entry.resolution.variants.some(({ derivation }) =>
      derivation === 'accepted-southeast-seam-filter')) {
      return 'mirror-X + SE seam filter';
    }
    return entry.index === 5 ? 'facing input: W direct / E mirror' :
      entry.index === 2 ? 'accepted horizontal mirror-X' : 'approved mirror-X';
  }
  if (entry.resolution.kind === 'synthetic-assembly') {
    return entry.topologyClass === 'filled-elbow' ? 'synthetic solid closure' :
      entry.topologyClass === 't-junction' ? 'synthetic T hub + cap law' :
        'synthetic four-way hub';
  }
  return entry.topologyClass === 'isolated' ? 'catalog identity unresolved' :
    'rotation/mirror not approved';
}

async function renderEqualHeightMaskLedger(options: CliOptions, root: string): Promise<void> {
  const descriptor = equalHeightMaskContactDescriptor();
  const width = 1900;
  const height = 2160;
  const gridX = 24;
  const gridY = 164;
  const cardWidth = 202;
  const cardHeight = 238;
  const gap = 8;
  const railX = 1296;
  const railWidth = 580;
  const fileOverrides = {
    ...await southeastReviewFileOverrides(options),
    ...await isolatedShellProposalFileOverrides(options, root),
    ...await verticalTerminusProposalFileOverrides(options, root),
    ...await thickWallBlockProposalFileOverrides(options, root),
    ...await thickWallHorizontalRepeatProposalFileOverrides(options, root),
    ...await thickWallRepeatProposalFileOverrides(options, root),
    ...await openPocketTJunctionProposalFileOverrides(options, root),
    ...await horizontalOpenPocketTJunctionProposalFileOverrides(options, root),
    ...await westPartialTJunctionProposalFileOverrides(options, root),
    ...await eastPartialTJunctionGateFileOverrides(options, root),
    ...await horizontalPartialTJunctionProposalFileOverrides(options, root),
    ...await openPocketCrossJunctionProposalFileOverrides(options, root),
    ...await singleFilledCrossJunctionProposalFileOverrides(options, root),
  };
  const parts: string[] = [
    '<defs>' +
      '<pattern id="ledgerHatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
        '<rect width="12" height="12" fill="#E6DFD1"/><rect width="4" height="12" fill="#D4CCBE"/>' +
      '</pattern>' +
    '</defs>',
    `<rect width="${width}" height="${height}" rx="18" fill="${PANEL}"/>`,
    text(24, 38, 'QUOTACO EQUAL-HEIGHT WALLS — OWNER-ACCEPTED 47-MASK MAPPING', 24, 820),
    text(24, 66, 'Canonical mask order unchanged · 256 raw neighborhoods → 47 cases · connectivity, facing, and state remain separate inputs', 13, 600, MUTED),
  ];

  const chips: ReadonlyArray<readonly [string, string, string]> = [
    ['47 / 47', 'CANONICAL INDICES', A1A_PALETTE.green],
    [`${EQUAL_HEIGHT_MASK_LEDGER.counts['direct-reuse']}`, 'DIRECT', '#294B3C'],
    [`${EQUAL_HEIGHT_MASK_LEDGER.counts['approved-derivation']}`, 'DERIVED', '#4E7D79'],
    [`${EQUAL_HEIGHT_MASK_LEDGER.counts['synthetic-assembly']}`, 'SYNTHETIC', '#7B715F'],
    [`${EQUAL_HEIGHT_MASK_LEDGER.counts['unresolved-authored-geometry']}`, 'UNRESOLVED', '#B65F4D'],
  ];
  for (const [index, [count, label, accent]] of chips.entries()) {
    const x = 24 + index * 178;
    parts.push(`<rect x="${x}" y="86" width="166" height="56" rx="10" fill="#ECE5D5" stroke="${accent}" stroke-width="1.5"/>`);
    parts.push(text(x + 16, 111, count, 18, 850, accent));
    parts.push(text(x + 16, 130, label, 9, 800, MUTED));
  }
  parts.push(text(926, 110, 'MAPPING ACCEPTED', 12, 850, A1A_PALETTE.green));
  parts.push(text(926, 130, 'Synthetic diagrams remain noncanonical · no production mutation', 10, 700, MUTED));

  for (const panel of descriptor.panels) {
    const { entry } = panel;
    const style = MASK_RESOLUTION_STYLE[entry.resolution.kind];
    const x = gridX + panel.column * (cardWidth + gap);
    const y = gridY + panel.row * (cardHeight + gap);
    parts.push(
      `<rect x="${x}" y="${y}" width="${cardWidth}" height="${cardHeight}" rx="10" ` +
      `fill="${style.card}" stroke="${style.accent}" stroke-width="1.5"/>`,
    );
    parts.push(text(x + 10, y + 18, entry.id, 12, 850));
    parts.push(text(
      x + cardWidth - 10,
      y + 18,
      `0x${entry.canonicalMask.toString(16).padStart(2, '0').toUpperCase()}`,
      10,
      800,
      MUTED,
      'end',
    ));
    parts.push(text(x + 10, y + 35, entry.topologyClass.toUpperCase(), 9, 800, MUTED));
    parts.push(text(x + cardWidth - 10, y + 35, style.label, 9, 850, style.accent, 'end'));
    parts.push(await equalHeightMaskPreview(options, entry, x + 10, y + 46, fileOverrides));
    parts.push(equalHeightMaskTopologyGlyph(entry, x + 158, y + 48, 34));
    parts.push(text(x + 10, y + 151, `CONNECTED  ${maskList(entry.connectedEdges)}`, 9, 750, INK));
    parts.push(text(x + 10, y + 165, `EXPOSED    ${maskList(entry.exposedEdges)}`, 9, 650, MUTED));
    parts.push(text(x + 10, y + 179, `POCKET     ${maskList(entry.pockets)}`, 9, 650, A1A_PALETTE.coral));
    parts.push(text(x + 10, y + 193, `SOLID      ${maskList(entry.solidDiagonals)}`, 9, 650, A1A_PALETTE.teal));
    parts.push(text(x + 10, y + 211, equalHeightMaskSourceLabel(entry), 9, 800, style.accent));
    parts.push(text(x + 10, y + 226, equalHeightMaskOperationLabel(entry), 8, 650, MUTED));
  }

  const checksumX = gridX + descriptor.checksum.column * (cardWidth + gap);
  const checksumY = gridY + descriptor.checksum.row * (cardHeight + gap);
  parts.push(`<rect x="${checksumX}" y="${checksumY}" width="${cardWidth}" height="${cardHeight}" rx="10" fill="#252A28"/>`);
  parts.push(text(checksumX + cardWidth / 2, checksumY + 70, 'END', 13, 850, '#A59E8F', 'middle'));
  parts.push(text(checksumX + cardWidth / 2, checksumY + 116, '47 / 47', 32, 900, '#E2E8DE', 'middle'));
  parts.push(text(checksumX + cardWidth / 2, checksumY + 146, 'NO MISSING OR', 10, 800, '#E2E8DE', 'middle'));
  parts.push(text(checksumX + cardWidth / 2, checksumY + 162, 'DUPLICATE INDICES', 10, 800, '#E2E8DE', 'middle'));
  parts.push(text(checksumX + cardWidth / 2, checksumY + 210, 'BLOB CONTRACT v1', 9, 750, '#83A9A6', 'middle'));

  parts.push(`<rect x="${railX}" y="${gridY}" width="${railWidth}" height="1960" rx="14" fill="#ECE5D5" stroke="${INK}" stroke-width="1.5"/>`);
  parts.push(text(railX + 24, gridY + 34, 'HOW TO READ THIS SHEET', 16, 850));
  parts.push(text(railX + 24, gridY + 60, 'mask_16 is index 16; its canonical value is 0x13.', 11, 650, MUTED));
  parts.push(text(railX + 24, gridY + 82, 'CONNECTED describes neighboring wall cells—not art facing.', 11, 700, INK));
  parts.push(text(railX + 24, gridY + 104, 'POCKET is a missing eligible diagonal; SOLID retains it.', 11, 650, MUTED));
  parts.push(equalHeightMaskTopologyGlyph(EQUAL_HEIGHT_MASK_LEDGER.entries[24], railX + 24, gridY + 126, 96));
  parts.push(text(railX + 136, gridY + 154, 'N IS ALWAYS UP', 11, 800, INK));
  parts.push(text(railX + 136, gridY + 176, 'green = center/cardinal wall', 10, 650, MUTED));
  parts.push(text(railX + 136, gridY + 196, 'teal = solid diagonal', 10, 650, MUTED));
  parts.push(text(railX + 136, gridY + 216, 'coral outline = open pocket', 10, 650, MUTED));

  parts.push(text(railX + 24, gridY + 268, 'THE DECISIVE COLLISION', 14, 850, A1A_PALETTE.coral));
  parts.push(text(railX + 24, gridY + 296, 'mask_5 · CONNECTED N S', 12, 850));
  parts.push(text(railX + 24, gridY + 320, 'WEST → full_w_straight · unchanged', 11, 700, '#294B3C'));
  parts.push(text(railX + 24, gridY + 342, 'EAST → full_w_straight · mirror-X', 11, 700, '#4E7D79'));
  parts.push(text(railX + 24, gridY + 370, 'Connectivity cannot choose. The proof recipe therefore', 11, 650, MUTED));
  parts.push(text(railX + 24, gridY + 390, 'requires explicit facing/context instead of a second mask bank.', 11, 650, MUTED));

  parts.push(text(railX + 24, gridY + 442, 'RESOLUTION KEY', 14, 850));
  const legendRows: ReadonlyArray<readonly [EqualHeightMaskResolutionKind, string]> = [
    ['direct-reuse', 'accepted source exactly'],
    ['approved-derivation', 'named mirror or seam filter'],
    ['synthetic-assembly', 'accepted laws; local hub still proof-only'],
    ['unresolved-authored-geometry', 'new focused geometry decision required'],
  ];
  for (const [index, [kind, description]] of legendRows.entries()) {
    const style = MASK_RESOLUTION_STYLE[kind];
    const y = gridY + 474 + index * 52;
    parts.push(`<rect x="${railX + 24}" y="${y - 16}" width="18" height="18" rx="4" fill="${style.card}" stroke="${style.accent}"/>`);
    parts.push(text(railX + 54, y - 3, `${style.label} · ${EQUAL_HEIGHT_MASK_LEDGER.counts[kind]}`, 11, 850, style.accent));
    parts.push(text(railX + 54, y + 15, description, 10, 600, MUTED));
  }

  parts.push(text(railX + 24, gridY + 706, 'RESOLVED SOURCE REPRESENTATIVES', 14, 850));
  const resolvedLines = [
    'mask_0 · isolated shell · direct source',
    'mask_1 / 4 · vertical ends · W sources / E mirrors',
    'mask_2 / 8 · horizontal caps · mirror / direct',
    'mask_3 / 6 · perimeter corners · direct sources',
    'mask_9 / 12 · perimeter corners · approved mirrors',
    'mask_5 · W direct / E mirror-X + facing',
    'mask_10 · shared north / south source',
    'mask_7 / 13 · open-pocket T · direct / filtered mirror-X',
    'mask_11 / 14 · horizontal T; mask_15 / 19 · direct cross hubs',
    'mask_16 / 20 · filled elbows · direct sources',
    'mask_26 / 34 · filled elbows · mirror-X',
    'mask_24 / 42 · filled middle spine · direct / mirror-X',
    'mask_31 / 38 · horizontal middle spines · direct',
  ];
  for (const [index, line] of resolvedLines.entries()) {
    parts.push(text(railX + 24, gridY + 732 + index * 17, line, 11, 700, index % 2 === 0 ? '#294B3C' : '#4E7D79'));
  }

  parts.push(text(railX + 24, gridY + 962, 'TOPOLOGY INDEX', 14, 850));
  const topologyLines = [
    '0-link isolated · 1',
    '1-link termini · 4',
    '2-link straights · 2',
    '2-link elbows · 8 (4 open + 4 solid)',
    '3-link T junctions · 16',
    '4-link cross/interior states · 16',
  ];
  for (const [index, line] of topologyLines.entries()) {
    parts.push(text(railX + 24, gridY + 990 + index * 24, line, 11, 650, MUTED));
  }

  parts.push(text(railX + 24, gridY + 1148, 'STATE REMAINS EXTERNAL', 14, 850, A1A_PALETTE.coral));
  parts.push(text(railX + 24, gridY + 1176, 'mask_10 also hosts door/window variants in the old proof.', 11, 650, MUTED));
  parts.push(text(railX + 24, gridY + 1198, 'That does not make those states part of connectivity or this ledger.', 11, 650, MUTED));

  parts.push(text(railX + 24, gridY + 1254, 'AUTHORED SOURCE SET', 14, 850, A1A_PALETTE.green));
  parts.push(text(railX + 24, gridY + 1282, 'mask_0 · accepted fixed-view isolated shell', 11, 750, A1A_PALETTE.green));
  parts.push(text(railX + 24, gridY + 1310, 'mask_1 / 4 are accepted as separately authored vertical ends.', 11, 650, MUTED));
  parts.push(text(railX + 24, gridY + 1332, 'mask_8 direct and mask_2 mirror-X remain the horizontal pair.', 11, 650, MUTED));
  parts.push(text(railX + 24, gridY + 1354, 'mask_16 / 20 direct and mask_26 / 34 mirror-X form the filled-elbow family.', 11, 650, MUTED));
  parts.push(text(railX + 24, gridY + 1376, 'mask_24 / 42 extend Y; direct masks 31 / 38 extend X.', 11, 650, MUTED));
  parts.push(text(railX + 24, gridY + 1398, 'mask_7 / 13 vertical T and direct masks 11 / 14 horizontal T are accepted.', 11, 650, MUTED));
  parts.push(text(railX + 24, gridY + 1420, 'mask_15 open and mask_19 NE-filled are accepted direct four-way hubs.', 11, 650, MUTED));

  parts.push(text(railX + 24, gridY + 1452, 'SYNTHETIC OBLIGATION', 14, 850, '#7B715F'));
  parts.push(text(railX + 24, gridY + 1480, '0 solid elbows · all four now have accepted proof sources', 11, 700, MUTED));
  parts.push(text(railX + 24, gridY + 1502, '0 T cases · every open and single-filled-pocket T row is accepted', 11, 700, MUTED));
  parts.push(text(railX + 24, gridY + 1524, '14 cross cases · accepted pocket laws still need local four-way hubs', 11, 700, MUTED));
  parts.push(text(railX + 24, gridY + 1552, 'Hatched previews are topology diagrams, never proposed final art.', 11, 750, '#7B715F'));

  parts.push(text(railX + 24, gridY + 1586, 'OUT OF SCOPE', 14, 850));
  const outOfScope = [
    'opening and door/window state art',
    'low partitions or cutaway geometry',
    'palette-mask authoring',
    'production frame identity or committed atlas',
    'exporter / CONTRACT / schema / Unity registration',
  ];
  for (const [index, line] of outOfScope.entries()) {
    parts.push(text(railX + 24, gridY + 1614 + index * 24, `• ${line}`, 11, 650, MUTED));
  }

  parts.push(`<rect x="${railX + 20}" y="${gridY + 1720}" width="${railWidth - 40}" height="214" rx="12" fill="#252A28"/>`);
  parts.push(text(railX + 42, gridY + 1752, 'PROOF BOUNDARY / FAILURE TRAY', 13, 850, '#E2E8DE'));
  parts.push(text(railX + 42, gridY + 1784, '✓ canonical order: 47/47, no duplicates', 11, 700, '#9FC7A9'));
  parts.push(text(railX + 42, gridY + 1810, '✓ accepted source provenance only', 11, 700, '#9FC7A9'));
  parts.push(text(railX + 42, gridY + 1836, '✓ no low-profile or historical topology pixels', 11, 700, '#9FC7A9'));
  parts.push(text(railX + 42, gridY + 1862, '✓ 0 authored geometry gaps remain', 11, 750, '#9FC7A9'));
  parts.push(text(railX + 42, gridY + 1888, '! 14 synthetic cross-junction cases are diagrams, not accepted art', 11, 750, '#E0836E'));
  parts.push(text(railX + 42, gridY + 1918, 'No further proof or production registration is implied.', 11, 800, '#83A9A6'));

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * CARD_RENDER_SCALE },
  }).render().asPng();
  await writeFile(path.join(options.output, `${EQUAL_HEIGHT_MASK_LEDGER.stem}.png`), png);
}

async function renderLowSoutheastCornerFocus(options: CliOptions, root: string): Promise<void> {
  const width = 1600;
  const height = 1280;
  const panelFill = '#ECE5D5';
  const panel = (x: number, y: number, w: number, h: number): string =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${panelFill}" ` +
    `stroke="${INK}" stroke-width="1.5" opacity="0.96"/>`;
  const cornerReference = `data:image/png;base64,${Buffer.from(
    await readFile(path.join(root, 'docs', 'reference', 'quota-co-wall-corners-and-ends-study.png')),
  ).toString('base64')}`;
  const referenceCrop = (
    href: string,
    x: number,
    y: number,
    width_: number,
    height_: number,
    viewBox: string,
  ): string =>
    `<svg x="${x}" y="${y}" width="${width_}" height="${height_}" viewBox="${viewBox}" ` +
    `preserveAspectRatio="xMidYMid meet"><image width="1536" height="1024" href="${href}"/></svg>`;
  const southControlCells = straightRunCells(
    3,
    'low-profile-correction/low-s-straight.svg',
    '',
    false,
  );
  const southSocketCells: ReadonlyArray<CompositionCell> = [
    [0, 0, 'low-profile-correction/low-s-straight.svg', null],
    [1, 0, 'low-profile-correction/low-se-corner.svg', null],
  ];
  const eastSocketCells: ReadonlyArray<CompositionCell> = [
    [0, 0, 'low-profile-correction/low-e-straight.svg', null],
    [0, 1, 'low-profile-correction/low-se-corner.svg', null],
  ];

  const parts: string[] = [
    `<rect width="${width}" height="${height}" rx="18" fill="${PANEL}"/>`,
    text(24, 34, 'LOW SOUTHEAST OUTER CORNER — SOUTH-FRONT OWNERSHIP', 21, 800),
    text(24, 58, 'Promoted source. South fascia owns the foreground heel; east coping stops at the shallow south-top register.', 12, 600, MUTED),
    panel(20, 76, 350, 330),
    panel(390, 76, 520, 330),
    panel(930, 76, 650, 330),
    panel(20, 426, 980, 390),
    panel(1020, 426, 560, 390),
    panel(20, 836, 770, 420),
    panel(810, 836, 770, 420),
    text(40, 108, 'SOUTHEAST OWNERSHIP TARGET', 14, 800),
    text(40, 130, 'Reference panel 8: a capped return with a foreground face.', 11, 600, MUTED),
    referenceCrop(cornerReference, 45, 142, 300, 230, '1160 520 325 480'),
    text(40, 391, 'South front wraps the heel. The east leg contributes only the cream top arc.', 10, 600, MUTED),
    text(410, 108, 'FIXED LOW-SOUTH CONTROL — ALONE', 14, 800),
    text(410, 130, 'This is the accepted straight with no corner over it.', 11, 600, MUTED),
    text(410, 326, 'CREAM = lit top plane  ·  CORAL = trim  ·  GREEN = front fascia material', 11, 750),
    text(410, 350, 'Only the narrow charcoal plinth/contact beneath the green is shadow-dark.', 11, 600, MUTED),
    text(950, 108, 'PROMOTED LOW-SE CORNER — ISOLATED', 14, 800),
    text(1260, 146, 'What changed', 12, 750),
    text(1260, 172, '• south green wraps the full heel', 11, 600, MUTED),
    text(1260, 196, '• coral remains its foreground trim', 11, 600, MUTED),
    text(1260, 220, '• east top ends at south coping depth', 11, 600, MUTED),
    text(1260, 260, 'Read at all sizes', 12, 750),
    text(1260, 286, '240 px construction', 11, 600, MUTED),
    text(1260, 310, '90 px gameplay', 11, 600, MUTED),
    text(1260, 334, '40 px silhouette', 11, 600, MUTED),
    text(40, 458, 'SOUTH SOCKET — ENLARGED', 14, 800),
    text(40, 480, 'Accepted low-south left; promoted corner right. The vertical guide marks the tile boundary.', 11, 600, MUTED),
    text(270, 505, 'FIXED SOUTH', 11, 750, MUTED, 'middle'),
    text(730, 505, 'PROMOTED CORNER', 11, 750, MUTED, 'middle'),
    `<path d="M510 494V750" fill="none" stroke="${A1A_PALETTE.coral}" stroke-width="2" stroke-dasharray="6 5" opacity="0.75"/>`,
    text(40, 773, 'Gate: the south cream / coral / green stack continues through the heel; east coping never occupies the front.', 11, 700),
    text(1040, 458, 'EAST SOCKET — ENLARGED', 14, 800),
    text(1040, 480, 'Accepted low-east above; promoted corner below.', 11, 600, MUTED),
    `<path d="M1064 643H1244" fill="none" stroke="${A1A_PALETTE.coral}" stroke-width="2" stroke-dasharray="6 5" opacity="0.75"/>`,
    text(1280, 548, 'EAST TOP', 11, 800),
    text(1280, 570, 'ends behind the coping.', 11, 650),
    text(1280, 614, 'SOUTH FRONT', 11, 800),
    text(1280, 638, 'continues across the corner', 11, 600, MUTED),
    text(1280, 662, 'and rounds the outer heel.', 11, 600, MUTED),
    text(40, 868, 'MINIMUM INSTALLED TURN', 14, 800),
    text(40, 890, 'One-cell arms: the compact-room gate.', 11, 600, MUTED),
    text(830, 868, 'LONG INSTALLED TURN', 14, 800),
    text(830, 890, 'Three-cell arms: the repetition gate.', 11, 600, MUTED),
    text(40, 1234, 'The corner must settle immediately without making a short room feel pinched.', 11, 650, MUTED),
    text(830, 1234, 'The turn must remain quiet and continuous across a long room envelope.', 11, 650, MUTED),
  ];
  parts.push(
    await compositionWindow(
      options, southControlCells, 3, 1, 420, 150, 460, 153,
    ),
  );
  parts.push(
    await compositionWindow(
      options, LOW_SE_CORNER_CELL, 1, 1, 965, 125, 270, 270,
    ),
  );
  parts.push(
    await compositionWindow(
      options, LOW_SE_CORNER_CELL, 1, 1, 1370, 278, 90, 90,
    ),
  );
  parts.push(
    await compositionWindow(
      options, LOW_SE_CORNER_CELL, 1, 1, 1480, 328, 40, 40,
    ),
  );
  parts.push(
    await compositionWindow(
      options, southSocketCells, 2, 1, 70, 510, 880, 220,
      {}, '0 64 256 64',
    ),
  );
  parts.push(
    await compositionWindow(
      options, eastSocketCells, 1, 2, 1085, 500, 143, 286,
      {}, '64 64 64 128',
    ),
  );
  parts.push(
    await compositionWindow(
      options, minimumLowSoutheastInstalledCells(), 2, 2, 260, 920, 290, 290,
    ),
  );
  parts.push(
    await compositionWindow(
      options, longLowSoutheastInstalledCells(), 4, 4, 1050, 920, 290, 290,
    ),
  );

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * CARD_RENDER_SCALE },
  }).render().asPng();
  await writeFile(path.join(options.output, 'low-se-corner-focus.png'), png);
}

async function renderFullHeightSouthProof(options: CliOptions): Promise<void> {
  const width = 1600;
  const height = 1180;
  const panelFill = '#ECE5D5';
  const panel = (x: number, y: number, w: number, h: number): string =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${panelFill}" ` +
    `stroke="${INK}" stroke-width="1.5" opacity="0.96"/>`;
  const currentLowRun = straightRunCells(
    3,
    'low-profile-correction/low-s-straight.svg',
    '',
    false,
  );
  const acceptedFullRun = straightRunCells(
    3,
    PROMOTED_SOUTH_WALL_REUSE.baseFile,
    PROMOTED_SOUTH_WALL_REUSE.upperFile,
    false,
  );
  const acceptedCell: ReadonlyArray<CompositionCell> = [
    [0, 0, PROMOTED_SOUTH_WALL_REUSE.baseFile, PROMOTED_SOUTH_WALL_REUSE.upperFile],
  ];
  const parts: string[] = [
    `<rect width="${width}" height="${height}" rx="18" fill="${PANEL}"/>`,
    text(24, 34, 'EQUAL-HEIGHT SOUTH STRAIGHT — PROMOTED WORKING CONTRACT', 21, 800),
    text(24, 58, 'Owner accepted. The full-north base + upper pair is placed unchanged in the south wall cell; no new wall source, transform, or production registration exists.', 12, 600, MUTED),
    panel(20, 76, 500, 350),
    panel(540, 76, 500, 350),
    panel(1060, 76, 520, 350),
    panel(20, 446, 760, 710),
    panel(800, 446, 780, 710),
    text(44, 108, 'LEGACY CONTROL — THREE LOW-SOUTH CELLS', 14, 800),
    text(44, 132, '38-unit envelope; retained only as deterministic comparison evidence.', 11, 600, MUTED),
    text(564, 108, 'ACCEPTED — THREE FULL-HEIGHT SOUTH CELLS', 14, 800),
    text(564, 132, 'Exact north source, exact 64-unit envelope, exact contact baseline.', 11, 600, MUTED),
    text(1084, 108, 'ONE SOURCE — REVIEW DISTANCES', 14, 800),
    text(1084, 132, 'No Y-flip, copy, translation, or south-only SVG.', 11, 600, MUTED),
    text(270, 390, 'CURRENT LOW PROFILE', 11, 800, '#9A493D', 'middle'),
    text(790, 390, 'ACCEPTED SHARED FULL PROFILE', 11, 800, A1A_PALETTE.green, 'middle'),
    text(1110, 398, '240 px', 10, 700, MUTED, 'middle'),
    text(1395, 266, '90 px', 10, 700, MUTED, 'middle'),
    text(1510, 336, '40 px', 10, 700, MUTED, 'middle'),
    text(44, 478, 'LEGACY MIXED-PROFILE ROOM', 14, 800),
    text(44, 502, 'Historical comparison: full north/west, low south/east.', 11, 600, MUTED),
    text(824, 478, 'PRIMARY ROOM — SOUTH PROMOTED', 14, 800),
    text(824, 502, 'Only the centre south cell changes. Existing low corners remain visible as legacy controls.', 11, 600, MUTED),
    text(44, 1130, 'Legacy control only; its low-south sources remain untouched.', 11, 650, MUTED),
    text(824, 1130, 'Gate: judge the straight profile and occupied-cell read—not the deliberately incompatible corner sockets.', 11, 700, A1A_PALETTE.green),
  ];
  parts.push(
    await compositionWindow(options, currentLowRun, 3, 1, 60, 165, 420, 140),
  );
  parts.push(
    await compositionWindow(options, acceptedFullRun, 3, 1, 580, 165, 420, 140),
  );
  parts.push(
    await compositionWindow(options, acceptedCell, 1, 1, 1080, 150, 240, 240),
  );
  parts.push(
    await compositionWindow(options, acceptedCell, 1, 1, 1350, 158, 90, 90),
  );
  parts.push(
    await compositionWindow(options, acceptedCell, 1, 1, 1490, 276, 40, 40),
  );
  parts.push(
    await compositionWindow(
      options, LEGACY_LOW_SOUTH_ROOM_CELLS, 3, 3, 100, 520, 600, 600,
      SOUTHWEST_REVIEW_FILE_OVERRIDES,
    ),
  );
  parts.push(
    await compositionWindow(options, ROOM_CELLS, 3, 3, 880, 520, 600, 600),
  );
  parts.push(
    '<g fill="none" stroke="#B65F4D" stroke-width="3" stroke-dasharray="10 8" opacity="0.9">' +
      '<rect x="880" y="920" width="200" height="200" rx="8"/>' +
      '<rect x="1280" y="920" width="200" height="200" rx="8"/>' +
    '</g>',
  );
  parts.push(text(980, 948, 'SW PROMOTED', 11, 800, A1A_PALETTE.green, 'middle'));
  parts.push(text(1380, 948, 'SE LEGACY CONTROL', 11, 800, '#9A493D', 'middle'));

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * CARD_RENDER_SCALE },
  }).render().asPng();
  await writeFile(path.join(options.output, 'full-height-south-proof.png'), png);
}

async function renderLengthLadder(options: CliOptions): Promise<void> {
  const width = 1400;
  const height = 1200;
  const panelFill = '#ECE5D5';
  const panel = (x: number, y: number, w: number, h: number): string =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${panelFill}" ` +
    `stroke="${INK}" stroke-width="1.5" opacity="0.96"/>`;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" rx="18" fill="${PANEL}"/>`,
    text(24, 34, 'working wall composition length ladder', 21, 800),
    text(24, 56, 'Uncommitted body, corner, and terminus proposal; high-to-low transitions remain comparison controls.', 12, 500, MUTED),
    panel(20, 76, 780, 550),
    panel(820, 76, 560, 550),
    panel(20, 646, 560, 530),
    panel(600, 646, 780, 530),
    text(40, 108, 'FULL NORTH BODY — 1 / 2 / 3 / 6 CELLS', 15, 800),
    text(840, 108, 'FULL WEST BODY — 1 / 2 / 3 / 6 CELLS', 15, 800),
  ];

  for (const [index, length] of LENGTH_LADDER_RUNS.entries()) {
    const top = 126 + index * 117;
    parts.push(text(68, top + 57, `${length}`, 18, 800, INK, 'middle'));
    parts.push(
      await compositionWindow(
        options,
        straightRunCells(length, 'full_n_straight-base.svg', 'full_n_straight-upper.svg', false),
        length,
        1,
        100,
        top,
        length * 100,
        100,
      ),
    );
  }
  parts.push(text(40, 608, 'Gate: the body must remain legible at one cell and quiet at six.', 11, 650, MUTED));

  const westXs = [856, 968, 1080, 1210];
  for (const [index, length] of LENGTH_LADDER_RUNS.entries()) {
    const left = westXs[index];
    parts.push(text(left + 37, 130, `${length}`, 18, 800, INK, 'middle'));
    parts.push(
      await compositionWindow(
        options,
        straightRunCells(length, 'full_w_straight-base.svg', 'full_w_straight-upper.svg', true),
        1,
        length,
        left,
        142,
        74,
        length * 74,
      ),
    );
  }
  parts.push(text(840, 608, 'Same cross-section, judged without a terminus hiding repetition.', 11, 650, MUTED));

  parts.push(text(40, 680, 'COMPACT CORNER ROOM', 15, 800));
  parts.push(text(40, 704, '2×2 minimum enclosure · junction geometry only', 11, 600, MUTED));
  parts.push(await compositionWindow(options, COMPACT_CORNER_ROOM_CELLS, 2, 2, 130, 732, 340, 340));
  parts.push(text(40, 1104, 'Gate: corners may finish the room, but must not become the room.', 11, 650, MUTED));
  parts.push(text(40, 1127, 'This deliberately gives oversized elbows nowhere to hide.', 11, 500, MUTED));

  parts.push(text(620, 680, 'NARROW CORRIDOR', 15, 800));
  parts.push(text(620, 704, '1-cell clear span · four repeated side-wall cells', 11, 600, MUTED));
  parts.push(await compositionWindow(options, NARROW_CORRIDOR_CELLS, 3, 6, 640, 724, 216, 432));
  parts.push(text(900, 770, 'Must preserve:', 13, 800));
  parts.push(text(900, 798, '• a readable one-cell aisle', 12, 600, MUTED));
  parts.push(text(900, 824, '• quiet service-seam repetition', 12, 600, MUTED));
  parts.push(text(900, 850, '• distinct full-west and low-east profiles', 12, 600, MUTED));
  parts.push(text(900, 876, '• compact transitions at both ends', 12, 600, MUTED));
  parts.push(text(900, 934, 'Failure is visible here before a large room can disguise it.', 11, 650, MUTED));
  parts.push(text(900, 972, 'COMPACT END — 1 / 3 BODY CELLS', 12, 800));
  parts.push(text(884, 1028, '1', 13, 800, INK, 'middle'));
  parts.push(
    await compositionWindow(options, terminusRunCells(1), 2, 1, 900, 984, 180, 90),
  );
  parts.push(text(884, 1128, '3', 13, 800, INK, 'middle'));
  parts.push(
    await compositionWindow(options, terminusRunCells(3), 4, 1, 900, 1080, 360, 90),
  );

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * CARD_RENDER_SCALE },
  }).render().asPng();
  await writeFile(path.join(options.output, 'length-ladder.png'), png);
}

async function renderCompositionMock(
  options: CliOptions,
  cells: ReadonlyArray<CompositionCell>,
  outputName: string,
  showGrid: boolean,
): Promise<void> {
  const basePass: string[] = [];
  const upperPass: string[] = [];
  for (const [col, row, baseFile, upperFile, transform = 'none'] of cells) {
    basePass.push(roomCell(
      stripSvgShell(await readFile(path.join(options.input, baseFile), 'utf8')),
      col,
      row,
      transform,
    ));
    if (upperFile) {
      upperPass.push(roomCell(
        stripSvgShell(await readFile(path.join(options.input, upperFile), 'utf8')),
        col,
        row,
        transform,
      ));
    }
  }
  const gridLines = showGrid
    ? [1, 2]
      .map((i) => `<path d="M ${i * 128} 0 V 384 M 0 ${i * 128} H 384" stroke="${INK}" stroke-width="1"/>`)
      .join('')
    : '';
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="384" height="384" viewBox="0 0 384 384">` +
    `<rect width="384" height="384" fill="${A1A_PALETTE.floor}"/>` +
    `<g opacity="0.12">${gridLines}</g>` +
    basePass.join('') +
    upperPass.join('') +
    `</svg>`;
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 768 } }).render().asPng();
  await writeFile(path.join(options.output, outputName), png);
}

async function renderEnvelopeGate(options: CliOptions): Promise<void> {
  await renderCompositionMock(options, ENVELOPE_GATE_CELLS, 'envelope-gate.png', false);
}

async function renderRoomMock(options: CliOptions): Promise<void> {
  await renderCompositionMock(options, ROOM_CELLS, 'room-context-mock.png', true);
}

async function renderCrossSectionProofs(options: CliOptions): Promise<void> {
  const directory = crossSectionProofsDirectory(options.input);
  const files = existsSync(directory)
    ? (await readdir(directory)).filter((name) => name.endsWith('.svg')).sort()
    : [];
  const rowHeight = 310;
  const width = 900;
  const height = files.length === 0 ? 120 : 54 + files.length * rowHeight;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" rx="14" fill="${PANEL}"/>`,
    text(20, 32, 'cross-section proofs — directional plane law candidates', 19, 750),
  ];
  if (files.length === 0) {
    parts.push(text(20, 70, `no proofs present in ${PROOFS_DIRECTORY_NAME}/`, 12, 500, MUTED));
  }
  for (const [index, name] of files.entries()) {
    const top = 54 + index * rowHeight;
    const content = stripSvgShell(await readFile(path.join(directory, name), 'utf8'));
    const proof = (x: number, y: number, size: number, floorBacked = true): string =>
      (floorBacked
        ? `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="6" fill="${A1A_PALETTE.floor}"/>`
        : '') +
      `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 128 128">${content}</svg>`;
    parts.push(text(20, top + 14, name, 13, 750));
    parts.push(proof(20, top + 24, A1A_REVIEW_SIZES.close));
    parts.push(text(140, top + 280, `${A1A_REVIEW_SIZES.close}px close`, 10, 650, MUTED, 'middle'));
    parts.push(proof(290, top + 24, A1A_REVIEW_SIZES.normal));
    parts.push(text(335, top + 130, `${A1A_REVIEW_SIZES.normal}px`, 10, 650, MUTED, 'middle'));
    parts.push(proof(290, top + 154, A1A_REVIEW_SIZES.far));
    parts.push(text(310, top + 210, `${A1A_REVIEW_SIZES.far}px`, 10, 650, MUTED, 'middle'));
    parts.push(`<rect x="420" y="${top + 24}" width="150" height="240" rx="10" fill="${A1A_PALETTE.charcoal}"/>`);
    parts.push(proof(450, top + 40, A1A_REVIEW_SIZES.normal, false));
    parts.push(proof(450, top + 150, A1A_REVIEW_SIZES.far, false));
    parts.push(text(495, top + 250, 'dark ground', 10, 650, '#A59E8F', 'middle'));
  }
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * CARD_RENDER_SCALE },
  }).render().asPng();
  await writeFile(path.join(options.output, 'cross-section-proofs.png'), png);
}

async function renderProofsSafely(options: CliOptions): Promise<void> {
  const statusPath = path.join(options.output, 'status.json');
  let status: Record<string, unknown> = {};
  try {
    status = JSON.parse(await readFile(statusPath, 'utf8')) as Record<string, unknown>;
  } catch {
    // The initial render normally creates status.json before the watcher starts.
  }
  try {
    await mkdir(options.output, { recursive: true });
    await renderCrossSectionProofs(options);
    delete status.proofsError;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    status.proofsError = message;
    process.stdout.write(`✗ proof render error — last good proofs kept\n${message}\n`);
  }
  status.proofsRenderedAt = new Date().toISOString();
  await writeFile(statusPath, `${JSON.stringify(status)}\n`, 'utf8');
}

async function renderContextMocksSafely(options: CliOptions, root: string): Promise<void> {
  try {
    await mkdir(options.output, { recursive: true });
    const correctionDir = path.join(options.input, 'low-profile-correction');
    await loadA1bLowCorrectionFamily({
      inputDir: correctionDir,
      sourcePathPrefix: path.relative(root, correctionDir).replaceAll(path.sep, '/'),
    });
    await renderEnvelopeGate(options);
    await renderRoomMock(options);
    await renderFullHeightSouthProof(options);
    await renderLengthLadder(options);
    await renderTransitionWestSouthFocus(options, root);
    await renderFullHeightEastMirrorProof(options);
    await renderFullHeightNortheastProof(options);
    await renderFullHeightSouthwestProof(options);
    await renderFullHeightSoutheastProof(options);
    await renderEqualHeightCorridorGate(options);
    await renderEqualHeightSingleFilledCrossJunctionGate(options, root);
    await renderEqualHeightOpenPocketCrossJunctionGate(options, root);
    await renderEqualHeightHorizontalPartialTJunctionGate(options, root);
    await renderEqualHeightEastPartialTJunctionGate(options, root);
    await renderEqualHeightWestPartialTJunctionGate(options, root);
    await renderEqualHeightHorizontalOpenPocketTJunctionGate(options, root);
    await renderEqualHeightOpenPocketTJunctionGate(options, root);
    await renderEqualHeightThickWallHorizontalRepeatGate(options, root);
    await renderEqualHeightThickWallRepeatGate(options, root);
    await renderEqualHeightThickWallBlockGate(options, root);
    await renderEqualHeightIsolatedShellGate(options, root);
    await renderEqualHeightVerticalTerminusGate(options, root);
    await renderEqualHeightHorizontalTerminusGate(options);
    await renderEqualHeightMaskLedger(options, root);
    await renderLowSoutheastCornerFocus(options, root);
    const statusPath = path.join(options.output, 'status.json');
    const status = JSON.parse(await readFile(statusPath, 'utf8')) as Record<string, unknown>;
    delete status.contextError;
    delete status.roomError;
    const renderedAt = new Date().toISOString();
    status.gateRenderedAt = renderedAt;
    status.roomRenderedAt = renderedAt;
    status.ladderRenderedAt = renderedAt;
    status.focusRenderedAt = renderedAt;
    status.singleFilledCrossJunctionRenderedAt = renderedAt;
    status.openPocketCrossJunctionRenderedAt = renderedAt;
    status.horizontalPartialTJunctionRenderedAt = renderedAt;
    status.eastPartialTJunctionRenderedAt = renderedAt;
    status.singleFilledPocketTJunctionRenderedAt = renderedAt;
    status.horizontalOpenPocketTJunctionRenderedAt = renderedAt;
    status.openPocketTJunctionRenderedAt = renderedAt;
    status.thickWallHorizontalRepeatRenderedAt = renderedAt;
    status.thickWallRepeatRenderedAt = renderedAt;
    status.thickWallBlockRenderedAt = renderedAt;
    status.isolatedShellRenderedAt = renderedAt;
    status.verticalTerminusRenderedAt = renderedAt;
    status.terminusRenderedAt = renderedAt;
    status.mappingRenderedAt = renderedAt;
    status.corridorRenderedAt = renderedAt;
    await writeFile(statusPath, `${JSON.stringify(status)}\n`, 'utf8');
    process.stdout.write('composition mocks re-rendered\n');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const statusPath = path.join(options.output, 'status.json');
    let status: Record<string, unknown> = { ok: true };
    try {
      status = JSON.parse(await readFile(statusPath, 'utf8')) as Record<string, unknown>;
    } catch {
      // The initial render normally creates status.json before the watcher starts.
    }
    status.contextError = message;
    const renderedAt = new Date().toISOString();
    status.gateRenderedAt = renderedAt;
    status.roomRenderedAt = renderedAt;
    status.ladderRenderedAt = renderedAt;
    await writeFile(statusPath, `${JSON.stringify(status)}\n`, 'utf8');
    const kind = error instanceof A1bLowCorrectionImportError ? 'composition import contract' : 'composition render';
    process.stdout.write(`✗ ${kind} error — last good mocks kept\n${message}\n`);
  }
}

async function renderSafely(
  options: CliOptions,
  root: string,
  stems?: readonly A1bAuthoredStem[],
): Promise<boolean> {
  try {
    await render(options, root, stems);
    await renderProofsSafely(options);
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    await mkdir(options.output, { recursive: true });
    await writeFile(
      path.join(options.output, 'status.json'),
      `${JSON.stringify({ ok: false, error: message, renderedAt: new Date().toISOString() })}\n`,
      'utf8',
    );
    const kind = error instanceof A1bAuthoredBImportError ? 'import contract' : 'render';
    process.stdout.write(`✗ ${kind} error — last good cards kept\n${message}\n`);
    return false;
  }
}

const MIME: Readonly<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
};

function serve(outputDir: string, port: number): void {
  const server = http.createServer(async (request, response) => {
    const name = path.basename(request.url?.split('?')[0] || '/') || 'index.html';
    const file = path.join(outputDir, name === '' ? 'index.html' : name);
    try {
      const body = await readFile(file);
      response.writeHead(200, {
        'content-type': MIME[path.extname(file)] ?? 'application/octet-stream',
        'cache-control': 'no-store',
      });
      response.end(body);
    } catch {
      response.writeHead(404).end('not found');
    }
  });
  server.listen(port, () => {
    process.stdout.write(`bench page: http://localhost:${port}/ — pin it beside your editor\n`);
  });
}

async function main(): Promise<void> {
  const root = process.cwd();
  const options = parseArgs(process.argv.slice(2), root);
  const initialRenderOk = await renderSafely(options, root);
  if (options.once) {
    if (!initialRenderOk) process.exitCode = 1;
    return;
  }

  serve(options.output, options.port);
  let timer: NodeJS.Timeout | undefined;
  let renderInProgress = false;
  let renderAllCards = false;
  let roomRenderPending = false;
  let proofsRenderPending = false;
  const pendingStems = new Set<A1bAuthoredStem>();
  let lastRootFile = '';
  let lastRoomFile = '';
  let lastProofFile = '';
  let subfamilyHinted = false;

  const flushPendingRenders = async (): Promise<void> => {
    if (renderInProgress) return;
    renderInProgress = true;
    try {
      while (renderAllCards || pendingStems.size > 0 || roomRenderPending || proofsRenderPending) {
        if (renderAllCards || pendingStems.size > 0) {
          const stems = renderAllCards ? undefined : [...pendingStems];
          const label = stems ? stems.join(', ') : 'all';
          renderAllCards = false;
          pendingStems.clear();
          // A card render also rebuilds the room from the latest low-profile
          // sources and the proofs card from the latest proof sources.
          roomRenderPending = false;
          proofsRenderPending = false;
          process.stdout.write(`${lastRootFile} changed — re-rendering ${label}…\n`);
          await renderSafely(options, root, stems);
          continue;
        }

        if (roomRenderPending) {
          roomRenderPending = false;
          process.stdout.write(`${lastRoomFile} changed — re-rendering current composition proofs…\n`);
          await renderContextMocksSafely(options, root);
          continue;
        }

        proofsRenderPending = false;
        process.stdout.write(`${lastProofFile} changed — re-rendering cross-section proofs…\n`);
        await renderProofsSafely(options);
      }
    } finally {
      renderInProgress = false;
    }
  };

  const schedulePendingRenders = (): void => {
    clearTimeout(timer);
    timer = setTimeout(() => void flushPendingRenders(), 200);
  };

  watch(options.input, { recursive: true }, (_event, fileName) => {
    if (!fileName || !fileName.endsWith('.svg')) return;
    if (fileName.includes(path.sep) || fileName.includes('/')) {
      if (fileName.replaceAll(path.sep, '/').startsWith('low-profile-correction/')) {
        lastRoomFile = fileName;
        roomRenderPending = true;
        schedulePendingRenders();
      } else if (!subfamilyHinted) {
        subfamilyHinted = true;
        process.stdout.write(
          `subfamily change (${fileName}) — cards cover the root B pilot; use the matching ` +
          'high-oblique:*:preview script for that view\n',
        );
      }
      return;
    }
    const stem = fileName.replace(/-(base|upper)\.svg$/, '') as A1bAuthoredStem;
    lastRootFile = fileName;
    if (A1B_AUTHORED_STEMS.includes(stem)) pendingStems.add(stem);
    else renderAllCards = true;
    schedulePendingRenders();
  });

  const proofsDirectory = crossSectionProofsDirectory(options.input);
  if (existsSync(proofsDirectory)) {
    watch(proofsDirectory, { recursive: true }, (_event, fileName) => {
      if (!fileName || !fileName.endsWith('.svg')) return;
      const normalizedProofFile = fileName.replaceAll(path.sep, '/');
      if (
        normalizedProofFile.startsWith('vertical-terminus/') ||
        normalizedProofFile.startsWith('single-filled-cross-junction/') ||
        normalizedProofFile.startsWith('open-pocket-cross-junction/') ||
        normalizedProofFile.startsWith('west-partial-t-junction/') ||
        normalizedProofFile.startsWith('horizontal-open-pocket-t-junction/') ||
        normalizedProofFile.startsWith('open-pocket-t-junction/') ||
        normalizedProofFile.startsWith('isolated-shell/') ||
        normalizedProofFile.startsWith('thick-wall-block/') ||
        normalizedProofFile.startsWith('thick-wall-horizontal-repeat/') ||
        normalizedProofFile.startsWith('thick-wall-repeat/')
      ) {
        lastRoomFile = fileName;
        roomRenderPending = true;
        schedulePendingRenders();
        return;
      }
      lastProofFile = fileName;
      proofsRenderPending = true;
      schedulePendingRenders();
    });
    process.stdout.write(`watching ${path.relative(root, proofsDirectory)} for proof saves\n`);
  }
  process.stdout.write(`watching ${path.relative(root, options.input)} for saves (ctrl-c to stop)\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
