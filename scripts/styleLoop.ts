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
 * The open page is a current-state decision surface: the accepted equal-height
 * enclosure proof first, accepted working contracts second, and the next proof-
 * only gate named in the status rail. Historical mixed-profile gates and
 * compiler cards remain available in closed disclosures.
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
    `<rect width="${columns * 128}" height="${rows * 128}" fill="${A1A_PALETTE.floor}"/>` +
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
    text(624, 1000, 'ACCEPTED — NEXT', 11, 800, MUTED),
    text(624, 1028, '47-mask mapping ledger and synthetic proof — not production registration.', 12, 750, A1A_PALETTE.green),
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
          process.stdout.write(`${lastRoomFile} changed — re-rendering room mock…\n`);
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
    watch(proofsDirectory, (_event, fileName) => {
      if (!fileName || !fileName.endsWith('.svg')) return;
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
