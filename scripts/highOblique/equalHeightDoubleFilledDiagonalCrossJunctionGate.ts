import {
  BLOB_CONFIGS,
  NB,
  blobIndex,
  configForIndex,
} from '../../src/tiles/blob';
import { EQUAL_HEIGHT_MASK_LEDGER } from './equalHeightMaskLedger';
import { EQUAL_HEIGHT_OPEN_POCKET_CROSS_JUNCTION_GATE } from './equalHeightOpenPocketCrossJunctionGate';
import { EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE } from './equalHeightSingleFilledCrossJunctionGate';
import { EQUAL_HEIGHT_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE } from './equalHeightSingleFilledSouthwestCrossJunctionGate';

/**
 * Owner-accepted proof-layer gate for mask_30: all four cardinal sockets connect,
 * northeast and southwest are solid, and the opposing northwest/southeast
 * crooks remain open floor.
 */

export type EqualHeightDoubleFilledDiagonalCrossJunctionMask = 30;
export type EqualHeightDoubleFilledDiagonalCrossJunctionVerticalFacing =
  | 'west'
  | 'east';
export type EqualHeightDoubleFilledDiagonalCrossJunctionMatrixMask =
  | 1 | 2 | 4 | 5 | 8 | 10 | 16 | 20 | 21 | 22 | 26 | 30 | 34 | 35 | 36;
export type EqualHeightDoubleFilledDiagonalCrossJunctionMatrix =
  readonly (
    readonly (
      EqualHeightDoubleFilledDiagonalCrossJunctionMatrixMask | null
    )[]
  )[];

export interface EqualHeightDoubleFilledDiagonalCrossJunctionCandidate {
  readonly maskIndex: EqualHeightDoubleFilledDiagonalCrossJunctionMask;
  readonly sourceMaskIndex: EqualHeightDoubleFilledDiagonalCrossJunctionMask;
  readonly sourceStem: 'open_cross_filled_ne_sw';
  readonly baseFile: 'open_cross_filled_ne_sw-base.svg';
  readonly upperFile: 'open_cross_filled_ne_sw-upper.svg';
  readonly connectedEdges: readonly ['n', 'e', 's', 'w'];
  readonly openPockets: readonly ['se', 'nw'];
  readonly solidDiagonals: readonly ['ne', 'sw'];
  readonly fixedLightRole: 'opposed-ne-sw-filled-four-way-hub';
  readonly transform: 'none';
  readonly derivation: 'none';
  readonly resolution: 'direct-reuse';
}

const COMPACT_MATRIX = [
  [null, 20, 26],
  [20, 30, 34],
  [16, 34, null],
] as const satisfies EqualHeightDoubleFilledDiagonalCrossJunctionMatrix;

const THREE_CELL_ARM_MATRIX = [
  [null, null, null, 4, null, null, null],
  [null, null, null, 5, null, null, null],
  [null, null, null, 21, 26, null, null],
  [2, 10, 22, 30, 35, 10, 8],
  [null, null, 16, 36, null, null, null],
  [null, null, null, 5, null, null, null],
  [null, null, null, 1, null, null, null],
] as const satisfies EqualHeightDoubleFilledDiagonalCrossJunctionMatrix;

const SIX_CELL_ARM_MATRIX = [
  [null, null, null, null, null, null, 4, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 21, 26, null, null, null, null, null],
  [2, 10, 10, 10, 10, 22, 30, 35, 10, 10, 10, 10, 8],
  [null, null, null, null, null, 16, 36, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 1, null, null, null, null, null, null],
] as const satisfies EqualHeightDoubleFilledDiagonalCrossJunctionMatrix;

export const EQUAL_HEIGHT_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE = {
  stem: 'equal-height-double-filled-diagonal-cross-junction-gate',
  version: 0,
  status: 'owner-accepted-double-filled-diagonal-cross-junction-gate',
  contract: false,
  topologyClass: 'double-filled-diagonal-cross-junction',
  candidate: {
    maskIndex: 30,
    sourceMaskIndex: 30,
    sourceStem: 'open_cross_filled_ne_sw',
    baseFile: 'open_cross_filled_ne_sw-base.svg',
    upperFile: 'open_cross_filled_ne_sw-upper.svg',
    connectedEdges: ['n', 'e', 's', 'w'],
    openPockets: ['se', 'nw'],
    solidDiagonals: ['ne', 'sw'],
    fixedLightRole: 'opposed-ne-sw-filled-four-way-hub',
    transform: 'none',
    derivation: 'none',
    resolution: 'direct-reuse',
  } as const satisfies EqualHeightDoubleFilledDiagonalCrossJunctionCandidate,
  compactMatrix: COMPACT_MATRIX,
  threeCellArmMatrix: THREE_CELL_ARM_MATRIX,
  sixCellArmMatrix: SIX_CELL_ARM_MATRIX,
  baselineMaskRows: [15, 19, 29] as const,
  installedNeighborMaskRows: [
    1, 2, 4, 5, 8, 10, 16, 20, 21, 22, 26, 34, 35, 36,
  ] as const,
  maskRowsUnderReview: [] as const,
  maskRowsAccepted: [30] as const,
  reviewCellSizes: [240, 90, 40] as const,
  reviewArmLengths: [1, 3, 6] as const,
  renderingDecision: {
    kind: 'one-accepted-authored-double-filled-diagonal-four-way-hub',
    scope: 'external-proof-source-bank',
    sourceDirectory:
      'assets/walls/quota-co-building-system-proofs/double-filled-diagonal-cross-junction',
    authoredSourceFiles: [
      'open_cross_filled_ne_sw-base.svg',
      'open_cross_filled_ne_sw-upper.svg',
    ] as const,
    sourceCanvas: 128,
    sourceAuthorship: 'flattened-fixed-view-no-transform',
    geometryCueMaskIndices: [15, 19, 29] as const,
    sourceRelationship: 'authored-cues-only-no-derived-provenance',
    composition:
      'author one flattened northeast-and-southwest-filled base and upper union; the accepted open and single-filled controls constrain the hub but must not be stacked',
    purpose:
      'join four ordinary wall runs through two opposed solid diagonals while northwest and southeast remain genuine open floor crooks',
    requiredRead:
      'one molded four-socket connector with two opposed filled lobes and two legible concave floor crooks, never a filled block, diagonal badge, peak, patch, or post',
    shadePolicy:
      'keep one fixed-light cream owner, remove buried faces in both solid diagonals, and preserve the accepted south-facing material hierarchy without doubled coral, green, or shadow bands',
    verticalRegisterPolicy: {
      north: 'west',
      south: 'east',
    },
  },
  acceptedLedgerCounts: {
    'direct-reuse': 26,
    'approved-derivation': 17,
    'synthetic-assembly': 4,
    'unresolved-authored-geometry': 0,
  },
  directSourceAccepted: true,
  xMirrorAllowed: false,
  yMirrorAllowed: false,
  rotationAllowed: false,
  productionRegistration: false,
  productionTopologyMutation: false,
  schemaChange: false,
  exportable: false,
  committedAtlas: false,
  temporaryFrameIds: true,
} as const;

/**
 * The opposed filled diagonals hand the north and south arms to different
 * fixed-view wall registers. The hub row itself contains no ordinary vertical
 * continuation, so it stays on the north/west register by convention.
 */
export function doubleFilledDiagonalCrossJunctionVerticalFacing(
  row: number,
  rowCount: number,
): EqualHeightDoubleFilledDiagonalCrossJunctionVerticalFacing {
  if (
    !Number.isInteger(row) ||
    !Number.isInteger(rowCount) ||
    rowCount < 1 ||
    rowCount % 2 === 0 ||
    row < 0 ||
    row >= rowCount
  ) {
    throw new Error(
      'Double-filled diagonal cross-junction vertical register requires an in-range row in an odd matrix',
    );
  }
  return row > Math.floor(rowCount / 2)
    ? EQUAL_HEIGHT_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE
        .renderingDecision.verticalRegisterPolicy.south
    : EQUAL_HEIGHT_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE
        .renderingDecision.verticalRegisterPolicy.north;
}

const NEIGHBORS = [
  [NB.N, 0, -1],
  [NB.E, 1, 0],
  [NB.S, 0, 1],
  [NB.W, -1, 0],
  [NB.NE, 1, -1],
  [NB.SE, 1, 1],
  [NB.SW, -1, 1],
  [NB.NW, -1, -1],
] as const;

function expectedMatrix(
  armLength: 1 | 3 | 6,
): EqualHeightDoubleFilledDiagonalCrossJunctionMatrix {
  const size = armLength * 2 + 1;
  const center = armLength;
  const occupied = (column: number, row: number): boolean =>
    (column === center && row >= 0 && row < size) ||
    (row === center && column >= 0 && column < size) ||
    (column === center + 1 && row === center - 1) ||
    (column === center - 1 && row === center + 1);
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) => {
      if (!occupied(column, row)) return null;
      let raw = 0;
      for (const [bit, dx, dy] of NEIGHBORS) {
        if (occupied(column + dx, row + dy)) raw |= bit;
      }
      return blobIndex(raw) as
        EqualHeightDoubleFilledDiagonalCrossJunctionMatrixMask;
    }),
  );
}

function validateArmMatrix(
  label: string,
  matrix: EqualHeightDoubleFilledDiagonalCrossJunctionMatrix,
  armLength: 1 | 3 | 6,
): void {
  const size = armLength * 2 + 1;
  if (matrix.length !== size || matrix.some((row) => row.length !== size)) {
    throw new Error(
      `Double-filled diagonal cross-junction ${label} matrix must be ${size}x${size}`,
    );
  }
  if (JSON.stringify(matrix) !== JSON.stringify(expectedMatrix(armLength))) {
    throw new Error(
      `Double-filled diagonal cross-junction ${label} matrix drift`,
    );
  }
}

/** Fail loudly if the accepted mask_30 proof-layer source mapping drifts. */
export function validateEqualHeightDoubleFilledDiagonalCrossJunctionGate(
  gate = EQUAL_HEIGHT_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE,
): void {
  if (
    gate.stem !==
      'equal-height-double-filled-diagonal-cross-junction-gate' ||
    gate.status !==
      'owner-accepted-double-filled-diagonal-cross-junction-gate' ||
    gate.topologyClass !== 'double-filled-diagonal-cross-junction' ||
    gate.candidate.maskIndex !== 30 ||
    gate.candidate.sourceMaskIndex !== 30 ||
    gate.candidate.sourceStem !== 'open_cross_filled_ne_sw' ||
    gate.candidate.baseFile !== 'open_cross_filled_ne_sw-base.svg' ||
    gate.candidate.upperFile !== 'open_cross_filled_ne_sw-upper.svg' ||
    JSON.stringify(gate.candidate.connectedEdges) !==
      JSON.stringify(['n', 'e', 's', 'w']) ||
    JSON.stringify(gate.candidate.openPockets) !==
      JSON.stringify(['se', 'nw']) ||
    JSON.stringify(gate.candidate.solidDiagonals) !==
      JSON.stringify(['ne', 'sw']) ||
    gate.candidate.fixedLightRole !==
      'opposed-ne-sw-filled-four-way-hub' ||
    gate.candidate.transform !== 'none' ||
    gate.candidate.derivation !== 'none' ||
    gate.candidate.resolution !== 'direct-reuse' ||
    JSON.stringify(gate.baselineMaskRows) !== JSON.stringify([15, 19, 29]) ||
    JSON.stringify(gate.installedNeighborMaskRows) !==
      JSON.stringify([
        1, 2, 4, 5, 8, 10, 16, 20, 21, 22, 26, 34, 35, 36,
      ]) ||
    gate.maskRowsUnderReview.length !== 0 ||
    JSON.stringify(gate.maskRowsAccepted) !== JSON.stringify([30]) ||
    JSON.stringify(gate.reviewCellSizes) !==
      JSON.stringify([240, 90, 40]) ||
    JSON.stringify(gate.reviewArmLengths) !== JSON.stringify([1, 3, 6])
    || JSON.stringify(gate.renderingDecision.verticalRegisterPolicy) !==
      JSON.stringify({ north: 'west', south: 'east' })
  ) {
    throw new Error(
      'Double-filled diagonal cross-junction gate identity drift',
    );
  }

  validateArmMatrix('compact', gate.compactMatrix, 1);
  validateArmMatrix('three-cell-arm', gate.threeCellArmMatrix, 3);
  validateArmMatrix('six-cell-arm', gate.sixCellArmMatrix, 6);

  const config = configForIndex(30);
  const ledgerEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[30];
  if (
    BLOB_CONFIGS[30] !== 0x5f ||
    JSON.stringify(config) !== JSON.stringify({
      n: true,
      e: true,
      s: true,
      w: true,
      ne: 'solid',
      se: 'concave',
      sw: 'solid',
      nw: 'concave',
    }) ||
    ledgerEntry.topologyClass !== 'cross-junction' ||
    JSON.stringify(ledgerEntry.connectedEdges) !==
      JSON.stringify(['n', 'e', 's', 'w']) ||
    ledgerEntry.exposedEdges.length !== 0 ||
    JSON.stringify(ledgerEntry.pockets) !== JSON.stringify(['se', 'nw']) ||
    JSON.stringify(ledgerEntry.solidDiagonals) !==
      JSON.stringify(['ne', 'sw']) ||
    ledgerEntry.resolution.kind !== 'direct-reuse' ||
    ledgerEntry.resolution.status !== 'accepted-source-mapping'
  ) {
    throw new Error(
      'Double-filled diagonal cross-junction ledger boundary drift',
    );
  }

  const openCue = EQUAL_HEIGHT_OPEN_POCKET_CROSS_JUNCTION_GATE;
  const northeastCue = EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE;
  const southwestCue =
    EQUAL_HEIGHT_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE;
  if (
    openCue.candidate.maskIndex !== 15 ||
    openCue.maskRowsAccepted[0] !== 15 ||
    northeastCue.candidate.maskIndex !== 19 ||
    northeastCue.maskRowsAccepted[0] !== 19 ||
    southwestCue.candidate.maskIndex !== 29 ||
    southwestCue.maskRowsAccepted[0] !== 29
  ) {
    throw new Error(
      'Double-filled diagonal cross-junction accepted-cue drift',
    );
  }

  for (const index of gate.installedNeighborMaskRows) {
    const resolution = EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution;
    if (
      (resolution.kind !== 'direct-reuse' &&
        resolution.kind !== 'approved-derivation') ||
      resolution.status !== 'accepted-source-mapping'
    ) {
      throw new Error(
        `Double-filled diagonal cross-junction installed-neighbor drift at mask_${index}`,
      );
    }
  }

  if (
    JSON.stringify(gate.acceptedLedgerCounts) !==
      JSON.stringify(EQUAL_HEIGHT_MASK_LEDGER.counts) ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['direct-reuse'] !== 26 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['approved-derivation'] !== 17 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['synthetic-assembly'] !== 4 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['unresolved-authored-geometry'] !== 0
  ) {
    throw new Error(
      'Double-filled diagonal cross-junction ledger-count boundary drift',
    );
  }

  if (
    gate.renderingDecision.kind !==
      'one-accepted-authored-double-filled-diagonal-four-way-hub' ||
    gate.renderingDecision.scope !==
      'external-proof-source-bank' ||
    gate.renderingDecision.sourceDirectory !==
      'assets/walls/quota-co-building-system-proofs/double-filled-diagonal-cross-junction' ||
    JSON.stringify(gate.renderingDecision.authoredSourceFiles) !==
      JSON.stringify([
        'open_cross_filled_ne_sw-base.svg',
        'open_cross_filled_ne_sw-upper.svg',
      ]) ||
    gate.renderingDecision.sourceCanvas !== 128 ||
    gate.renderingDecision.sourceAuthorship !==
      'flattened-fixed-view-no-transform' ||
    JSON.stringify(gate.renderingDecision.geometryCueMaskIndices) !==
      JSON.stringify([15, 19, 29]) ||
    gate.renderingDecision.sourceRelationship !==
      'authored-cues-only-no-derived-provenance'
  ) {
    throw new Error(
      'Double-filled diagonal cross-junction evidence boundary drift',
    );
  }

  if (
    gate.contract ||
    !gate.directSourceAccepted ||
    gate.xMirrorAllowed ||
    gate.yMirrorAllowed ||
    gate.rotationAllowed ||
    gate.productionRegistration ||
    gate.productionTopologyMutation ||
    gate.schemaChange ||
    gate.exportable ||
    gate.committedAtlas ||
    !gate.temporaryFrameIds
  ) {
    throw new Error(
      'Double-filled diagonal cross-junction crossed accepted proof-layer boundary',
    );
  }
}

validateEqualHeightDoubleFilledDiagonalCrossJunctionGate();
