import { BLOB_CONFIGS, configForIndex } from '../../src/tiles/blob';
import { EQUAL_HEIGHT_MASK_LEDGER } from './equalHeightMaskLedger';
import { EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE } from './equalHeightSingleFilledCrossJunctionGate';
import { EQUAL_HEIGHT_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_GATE } from './equalHeightSingleFilledNorthwestCrossJunctionGate';

/**
 * Owner-accepted proof-layer gate for mask_39: one north-filled slab joins all four
 * cardinal sockets while both southern floor crooks remain open.
 */

export type EqualHeightDoubleFilledNorthCrossJunctionMask = 39;
export type EqualHeightDoubleFilledNorthCrossJunctionMatrixMask =
  | 1 | 5 | 16 | 20 | 26 | 31 | 34 | 38 | 39;
export type EqualHeightDoubleFilledNorthCrossJunctionMatrix =
  readonly (
    readonly (EqualHeightDoubleFilledNorthCrossJunctionMatrixMask | null)[]
  )[];

export interface EqualHeightDoubleFilledNorthCrossJunctionCandidate {
  readonly maskIndex: EqualHeightDoubleFilledNorthCrossJunctionMask;
  readonly sourceMaskIndex: EqualHeightDoubleFilledNorthCrossJunctionMask;
  readonly sourceStem: 'open_cross_filled_n';
  readonly baseFile: 'open_cross_filled_n-base.svg';
  readonly upperFile: 'open_cross_filled_n-upper.svg';
  readonly connectedEdges: readonly ['n', 'e', 's', 'w'];
  readonly openPockets: readonly ['se', 'sw'];
  readonly solidDiagonals: readonly ['ne', 'nw'];
  readonly fixedLightRole: 'north-filled-four-way-slab-west-register';
  readonly transform: 'none';
  readonly derivation: 'none';
  readonly resolution: 'direct-reuse';
}

const COMPACT_MATRIX = [
  [20, 31, 26],
  [16, 39, 34],
  [null, 1, null],
] as const satisfies EqualHeightDoubleFilledNorthCrossJunctionMatrix;

const THREE_CELL_EXTENT_MATRIX = [
  [null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null],
  [20, 31, 31, 31, 31, 31, 26],
  [16, 38, 38, 39, 38, 38, 34],
  [null, null, null, 5, null, null, null],
  [null, null, null, 5, null, null, null],
  [null, null, null, 1, null, null, null],
] as const satisfies EqualHeightDoubleFilledNorthCrossJunctionMatrix;

const SIX_CELL_EXTENT_MATRIX = [
  [null, null, null, null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null, null, null, null],
  [20, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 26],
  [16, 38, 38, 38, 38, 38, 39, 38, 38, 38, 38, 38, 34],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 1, null, null, null, null, null, null],
] as const satisfies EqualHeightDoubleFilledNorthCrossJunctionMatrix;

export const EQUAL_HEIGHT_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_GATE = {
  stem: 'equal-height-double-filled-north-cross-junction-gate',
  version: 0,
  status: 'owner-accepted-double-filled-north-cross-junction-gate',
  contract: false,
  topologyClass: 'double-filled-north-cross-junction',
  candidate: {
    maskIndex: 39,
    sourceMaskIndex: 39,
    sourceStem: 'open_cross_filled_n',
    baseFile: 'open_cross_filled_n-base.svg',
    upperFile: 'open_cross_filled_n-upper.svg',
    connectedEdges: ['n', 'e', 's', 'w'],
    openPockets: ['se', 'sw'],
    solidDiagonals: ['ne', 'nw'],
    fixedLightRole: 'north-filled-four-way-slab-west-register',
    transform: 'none',
    derivation: 'none',
    resolution: 'direct-reuse',
  } as const satisfies EqualHeightDoubleFilledNorthCrossJunctionCandidate,
  compactMatrix: COMPACT_MATRIX,
  threeCellExtentMatrix: THREE_CELL_EXTENT_MATRIX,
  sixCellExtentMatrix: SIX_CELL_EXTENT_MATRIX,
  baselineMaskRows: [19, 37] as const,
  installedNeighborMaskRows: [1, 5, 16, 20, 26, 31, 34, 38] as const,
  maskRowsUnderReview: [] as const,
  maskRowsAccepted: [39] as const,
  reviewCellSizes: [240, 90, 40] as const,
  reviewExtentLengths: [1, 3, 6] as const,
  renderingDecision: {
    kind: 'one-accepted-authored-double-filled-north-four-way-hub',
    scope: 'external-proof-source-bank',
    sourceDirectory:
      'assets/walls/quota-co-building-system-proofs/double-filled-north-cross-junction',
    authoredSourceFiles: [
      'open_cross_filled_n-base.svg',
      'open_cross_filled_n-upper.svg',
    ] as const,
    sourceCanvas: 128,
    sourceAuthorship: 'flattened-fixed-view-no-transform',
    geometryCueMaskIndices: [19, 37] as const,
    sourceRelationship: 'authored-cues-only-no-derived-provenance',
    composition:
      'author one flattened north-filled base and upper union; accepted single-filled controls constrain the two northern corners but must not be stacked',
    purpose:
      'join a continuous two-cell-deep north slab to one south branch while both southern floor crooks remain open',
    requiredRead:
      'one molded four-socket connector with one uninterrupted cream north plane continuing through the south socket, never a stair-step, patch, peak, or post',
    shadePolicy:
      'carry horizontal south-facing depth, coral, and green only across exposed frontage; yield at the top-to-top south socket and wrap the side stack down the west-fixed branch',
  },
  acceptedLedgerCounts: {
    'direct-reuse': 24,
    'approved-derivation': 17,
    'synthetic-assembly': 6,
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

function validateExtentMatrix(
  label: string,
  matrix: EqualHeightDoubleFilledNorthCrossJunctionMatrix,
  extent: 1 | 3 | 6,
): void {
  const size = extent * 2 + 1;
  const center = extent;
  if (matrix.length !== size || matrix.some((row) => row.length !== size)) {
    throw new Error(
      `Double-filled north cross-junction ${label} matrix must be ${size}x${size}`,
    );
  }
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      let expected: EqualHeightDoubleFilledNorthCrossJunctionMatrixMask | null =
        null;
      if (row === center - 1) {
        expected = column === 0 ? 20 : column === size - 1 ? 26 : 31;
      } else if (row === center) {
        if (column === 0) expected = 16;
        else if (column === size - 1) expected = 34;
        else if (column === center) expected = 39;
        else expected = 38;
      } else if (column === center && row > center) {
        expected = row === size - 1 ? 1 : 5;
      }
      if (matrix[row][column] !== expected) {
        throw new Error(
          `Double-filled north cross-junction ${label} matrix drift at ${column},${row}`,
        );
      }
    }
  }
}

/** Fail loudly if the accepted mask_39 proof-layer source mapping drifts. */
export function validateEqualHeightDoubleFilledNorthCrossJunctionGate(
  gate = EQUAL_HEIGHT_DOUBLE_FILLED_NORTH_CROSS_JUNCTION_GATE,
): void {
  if (
    gate.stem !== 'equal-height-double-filled-north-cross-junction-gate' ||
    gate.status !==
      'owner-accepted-double-filled-north-cross-junction-gate' ||
    gate.topologyClass !== 'double-filled-north-cross-junction' ||
    gate.candidate.maskIndex !== 39 ||
    gate.candidate.sourceMaskIndex !== 39 ||
    gate.candidate.sourceStem !== 'open_cross_filled_n' ||
    gate.candidate.baseFile !== 'open_cross_filled_n-base.svg' ||
    gate.candidate.upperFile !== 'open_cross_filled_n-upper.svg' ||
    JSON.stringify(gate.candidate.connectedEdges) !==
      JSON.stringify(['n', 'e', 's', 'w']) ||
    JSON.stringify(gate.candidate.openPockets) !==
      JSON.stringify(['se', 'sw']) ||
    JSON.stringify(gate.candidate.solidDiagonals) !==
      JSON.stringify(['ne', 'nw']) ||
    gate.candidate.fixedLightRole !==
      'north-filled-four-way-slab-west-register' ||
    gate.candidate.transform !== 'none' ||
    gate.candidate.derivation !== 'none' ||
    gate.candidate.resolution !== 'direct-reuse' ||
    JSON.stringify(gate.baselineMaskRows) !== JSON.stringify([19, 37]) ||
    JSON.stringify(gate.installedNeighborMaskRows) !==
      JSON.stringify([1, 5, 16, 20, 26, 31, 34, 38]) ||
    gate.maskRowsUnderReview.length !== 0 ||
    JSON.stringify(gate.maskRowsAccepted) !== JSON.stringify([39]) ||
    JSON.stringify(gate.reviewCellSizes) !==
      JSON.stringify([240, 90, 40]) ||
    JSON.stringify(gate.reviewExtentLengths) !== JSON.stringify([1, 3, 6])
  ) {
    throw new Error('Double-filled north cross-junction gate identity drift');
  }

  validateExtentMatrix('compact', gate.compactMatrix, 1);
  validateExtentMatrix('three-cell-extent', gate.threeCellExtentMatrix, 3);
  validateExtentMatrix('six-cell-extent', gate.sixCellExtentMatrix, 6);

  const config = configForIndex(39);
  const ledgerEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[39];
  if (
    BLOB_CONFIGS[39] !== 0x9f ||
    JSON.stringify(config) !== JSON.stringify({
      n: true,
      e: true,
      s: true,
      w: true,
      ne: 'solid',
      se: 'concave',
      sw: 'concave',
      nw: 'solid',
    }) ||
    ledgerEntry.topologyClass !== 'cross-junction' ||
    JSON.stringify(ledgerEntry.connectedEdges) !==
      JSON.stringify(['n', 'e', 's', 'w']) ||
    ledgerEntry.exposedEdges.length !== 0 ||
    JSON.stringify(ledgerEntry.pockets) !== JSON.stringify(['se', 'sw']) ||
    JSON.stringify(ledgerEntry.solidDiagonals) !==
      JSON.stringify(['ne', 'nw']) ||
    ledgerEntry.resolution.kind !== 'direct-reuse' ||
    ledgerEntry.resolution.status !== 'accepted-source-mapping' ||
    ledgerEntry.resolution.variants.length !== 1 ||
    ledgerEntry.resolution.variants[0].role !==
      'double-filled-north-cross-junction' ||
    ledgerEntry.resolution.variants[0].sourceStem !== 'open_cross_filled_n' ||
    ledgerEntry.resolution.variants[0].baseFile !==
      'open_cross_filled_n-base.svg' ||
    ledgerEntry.resolution.variants[0].upperFile !==
      'open_cross_filled_n-upper.svg' ||
    ledgerEntry.resolution.variants[0].transform !== 'none' ||
    ledgerEntry.resolution.variants[0].derivation !== 'none'
  ) {
    throw new Error(
      'Double-filled north cross-junction accepted-ledger boundary drift',
    );
  }

  const northeastCue = EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE;
  const northwestCue =
    EQUAL_HEIGHT_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_GATE;
  if (
    northeastCue.candidate.maskIndex !== 19 ||
    northeastCue.candidate.sourceStem !== 'open_cross_filled_ne' ||
    northeastCue.maskRowsAccepted[0] !== 19 ||
    northwestCue.candidate.maskIndex !== 37 ||
    northwestCue.candidate.sourceStem !== 'open_cross_filled_nw' ||
    northwestCue.maskRowsAccepted[0] !== 37
  ) {
    throw new Error('Double-filled north cross-junction accepted-cue drift');
  }

  for (const index of gate.installedNeighborMaskRows) {
    const resolution = EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution;
    if (
      (resolution.kind !== 'direct-reuse' &&
        resolution.kind !== 'approved-derivation') ||
      resolution.status !== 'accepted-source-mapping'
    ) {
      throw new Error(
        `Double-filled north cross-junction installed-neighbor drift at mask_${index}`,
      );
    }
  }

  if (
    JSON.stringify(gate.acceptedLedgerCounts) !==
      JSON.stringify(EQUAL_HEIGHT_MASK_LEDGER.counts) ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['direct-reuse'] !== 24 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['approved-derivation'] !== 17 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['synthetic-assembly'] !== 6 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['unresolved-authored-geometry'] !== 0
  ) {
    throw new Error(
      'Double-filled north cross-junction ledger-count boundary drift',
    );
  }
  if (
    gate.renderingDecision.kind !==
      'one-accepted-authored-double-filled-north-four-way-hub' ||
    gate.renderingDecision.scope !== 'external-proof-source-bank' ||
    gate.renderingDecision.sourceDirectory !==
      'assets/walls/quota-co-building-system-proofs/double-filled-north-cross-junction' ||
    JSON.stringify(gate.renderingDecision.authoredSourceFiles) !==
      JSON.stringify([
        'open_cross_filled_n-base.svg',
        'open_cross_filled_n-upper.svg',
      ]) ||
    gate.renderingDecision.sourceCanvas !== 128 ||
    gate.renderingDecision.sourceAuthorship !==
      'flattened-fixed-view-no-transform' ||
    JSON.stringify(gate.renderingDecision.geometryCueMaskIndices) !==
      JSON.stringify([19, 37]) ||
    gate.renderingDecision.sourceRelationship !==
      'authored-cues-only-no-derived-provenance'
  ) {
    throw new Error(
      'Double-filled north cross-junction evidence boundary drift',
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
      'Double-filled north cross-junction crossed the accepted proof boundary',
    );
  }
}

validateEqualHeightDoubleFilledNorthCrossJunctionGate();
