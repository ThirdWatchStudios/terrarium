import { BLOB_CONFIGS, configForIndex } from '../../src/tiles/blob';
import { EQUAL_HEIGHT_MASK_LEDGER } from './equalHeightMaskLedger';

/**
 * Owner-accepted proof-layer gate for mask_25: a west branch entering a two-cell-wide
 * north/south slab, with both east diagonals solid and both west crooks open.
 */

export type EqualHeightDoubleFilledEastCrossJunctionMask = 25;
export type EqualHeightDoubleFilledEastCrossJunctionMatrixMask =
  | 2 | 10 | 16 | 20 | 24 | 25 | 26 | 34 | 42;
export type EqualHeightDoubleFilledEastCrossJunctionMatrix =
  readonly (
    readonly (EqualHeightDoubleFilledEastCrossJunctionMatrixMask | null)[]
  )[];

export interface EqualHeightDoubleFilledEastCrossJunctionCandidate {
  readonly maskIndex: EqualHeightDoubleFilledEastCrossJunctionMask;
  readonly sourceMaskIndex: EqualHeightDoubleFilledEastCrossJunctionMask;
  readonly sourceStem: 'open_cross_filled_e';
  readonly baseFile: 'open_cross_filled_e-base.svg';
  readonly upperFile: 'open_cross_filled_e-upper.svg';
  readonly connectedEdges: readonly ['n', 'e', 's', 'w'];
  readonly openPockets: readonly ['sw', 'nw'];
  readonly solidDiagonals: readonly ['ne', 'se'];
  readonly fixedLightRole: 'west-branch-into-double-width-east-slab';
  readonly transform: 'none';
  readonly derivation: 'none';
  readonly resolution: 'direct-reuse';
}

const COMPACT_MATRIX = [
  [null, 20, 26],
  [2, 25, 42],
  [null, 16, 34],
] as const satisfies EqualHeightDoubleFilledEastCrossJunctionMatrix;

const THREE_CELL_EXTENT_MATRIX = [
  [null, null, null, 20, 26, null, null],
  [null, null, null, 24, 42, null, null],
  [null, null, null, 24, 42, null, null],
  [2, 10, 10, 25, 42, null, null],
  [null, null, null, 24, 42, null, null],
  [null, null, null, 24, 42, null, null],
  [null, null, null, 16, 34, null, null],
] as const satisfies EqualHeightDoubleFilledEastCrossJunctionMatrix;

const SIX_CELL_EXTENT_MATRIX = [
  [null, null, null, null, null, null, 20, 26, null, null, null, null, null],
  [null, null, null, null, null, null, 24, 42, null, null, null, null, null],
  [null, null, null, null, null, null, 24, 42, null, null, null, null, null],
  [null, null, null, null, null, null, 24, 42, null, null, null, null, null],
  [null, null, null, null, null, null, 24, 42, null, null, null, null, null],
  [null, null, null, null, null, null, 24, 42, null, null, null, null, null],
  [2, 10, 10, 10, 10, 10, 25, 42, null, null, null, null, null],
  [null, null, null, null, null, null, 24, 42, null, null, null, null, null],
  [null, null, null, null, null, null, 24, 42, null, null, null, null, null],
  [null, null, null, null, null, null, 24, 42, null, null, null, null, null],
  [null, null, null, null, null, null, 24, 42, null, null, null, null, null],
  [null, null, null, null, null, null, 24, 42, null, null, null, null, null],
  [null, null, null, null, null, null, 16, 34, null, null, null, null, null],
] as const satisfies EqualHeightDoubleFilledEastCrossJunctionMatrix;

export const EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE = {
  stem: 'equal-height-double-filled-east-cross-junction-gate',
  version: 0,
  status: 'owner-accepted-double-filled-east-cross-junction-gate',
  contract: false,
  topologyClass: 'double-filled-east-cross-junction',
  candidate: {
    maskIndex: 25,
    sourceMaskIndex: 25,
    sourceStem: 'open_cross_filled_e',
    baseFile: 'open_cross_filled_e-base.svg',
    upperFile: 'open_cross_filled_e-upper.svg',
    connectedEdges: ['n', 'e', 's', 'w'],
    openPockets: ['sw', 'nw'],
    solidDiagonals: ['ne', 'se'],
    fixedLightRole: 'west-branch-into-double-width-east-slab',
    transform: 'none',
    derivation: 'none',
    resolution: 'direct-reuse',
  } as const satisfies EqualHeightDoubleFilledEastCrossJunctionCandidate,
  compactMatrix: COMPACT_MATRIX,
  threeCellExtentMatrix: THREE_CELL_EXTENT_MATRIX,
  sixCellExtentMatrix: SIX_CELL_EXTENT_MATRIX,
  baselineMaskRows: [15, 19, 23, 24, 42] as const,
  stateDiamond: {
    open: 15,
    singleFilled: [19, 23] as const,
    doubleFilled: 25,
  },
  maskRowsUnderReview: [] as const,
  maskRowsAccepted: [25] as const,
  reviewCellSizes: [240, 90, 40] as const,
  reviewExtentLengths: [1, 3, 6] as const,
  acceptedWestFilledCompanionMaskIndex: 43,
  renderingDecision: {
    kind: 'one-accepted-authored-double-filled-east-four-way-hub',
    scope: 'external-proof-source-bank',
    sourceDirectory:
      'assets/walls/quota-co-building-system-proofs/double-filled-east-cross-junction',
    authoredSourceFiles: [
      'open_cross_filled_e-base.svg',
      'open_cross_filled_e-upper.svg',
    ] as const,
    acceptedControlSources: [
      {
        maskIndex: 15,
        sourceStem: 'open_cross_junction',
        baseFile: 'open_cross_junction-base.svg',
        upperFile: 'open_cross_junction-upper.svg',
        resolution: 'direct-reuse',
        transform: 'none',
      },
      {
        maskIndex: 19,
        sourceStem: 'open_cross_filled_ne',
        baseFile: 'open_cross_filled_ne-base.svg',
        upperFile: 'open_cross_filled_ne-upper.svg',
        resolution: 'direct-reuse',
        transform: 'none',
      },
      {
        maskIndex: 23,
        sourceStem: 'open_cross_filled_se',
        baseFile: 'open_cross_filled_se-base.svg',
        upperFile: 'open_cross_filled_se-upper.svg',
        resolution: 'direct-reuse',
        transform: 'none',
      },
      {
        maskIndex: 24,
        sourceStem: 'filled_w_middle',
        baseFile: 'filled_w_middle-base.svg',
        upperFile: 'filled_w_middle-upper.svg',
        resolution: 'direct-reuse',
        transform: 'none',
      },
      {
        maskIndex: 42,
        sourceStem: 'filled_w_middle',
        baseFile: 'filled_w_middle-base.svg',
        upperFile: 'filled_w_middle-upper.svg',
        resolution: 'approved-derivation',
        transform: 'mirror-x',
      },
    ] as const,
    composition:
      'author one flattened base and upper union; controls constrain boundaries and must not be stacked',
    purpose:
      'join one west branch to the accepted two-cell-wide north/south slab while keeping both west floor crooks open',
    requiredRead:
      'one molded junction with continuous cream mass across the east half, never a patch, cap, peak, post, duplicate belt, or exposed buried fascia',
    shadePolicy:
      'retain one 0.18 reveal exposure through the open-to-solid turn with a local x=58..120 highlight, preserve the outer socket band, and keep coral, green, and shade only on exposed west frontage',
  },
  acceptedLedgerCounts: {
    'direct-reuse': 28,
    'approved-derivation': 19,
    'synthetic-assembly': 0,
    'unresolved-authored-geometry': 0,
  },
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
  matrix: EqualHeightDoubleFilledEastCrossJunctionMatrix,
  extent: 1 | 3 | 6,
): void {
  const size = extent * 2 + 1;
  const center = extent;
  if (matrix.length !== size || matrix.some((row) => row.length !== size)) {
    throw new Error(
      `Double-filled east cross-junction ${label} matrix must be ${size}x${size}`,
    );
  }
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      let expected: EqualHeightDoubleFilledEastCrossJunctionMatrixMask | null = null;
      if (column === center) {
        if (row === 0) expected = 20;
        else if (row === size - 1) expected = 16;
        else if (row === center) expected = 25;
        else expected = 24;
      } else if (column === center + 1) {
        if (row === 0) expected = 26;
        else if (row === size - 1) expected = 34;
        else expected = 42;
      } else if (row === center && column < center) {
        expected = column === 0 ? 2 : 10;
      }
      if (matrix[row][column] !== expected) {
        throw new Error(
          `Double-filled east cross-junction ${label} matrix drift at ${column},${row}`,
        );
      }
    }
  }
}

/** Fail loudly if the accepted mask_25 proof-layer source mapping drifts. */
export function validateEqualHeightDoubleFilledEastCrossJunctionGate(
  gate = EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE,
): void {
  if (
    gate.stem !== 'equal-height-double-filled-east-cross-junction-gate' ||
    gate.status !== 'owner-accepted-double-filled-east-cross-junction-gate' ||
    gate.topologyClass !== 'double-filled-east-cross-junction' ||
    gate.candidate.maskIndex !== 25 ||
    gate.candidate.sourceMaskIndex !== 25 ||
    gate.candidate.sourceStem !== 'open_cross_filled_e' ||
    gate.candidate.baseFile !== 'open_cross_filled_e-base.svg' ||
    gate.candidate.upperFile !== 'open_cross_filled_e-upper.svg' ||
    JSON.stringify(gate.candidate.connectedEdges) !==
      JSON.stringify(['n', 'e', 's', 'w']) ||
    JSON.stringify(gate.candidate.openPockets) !== JSON.stringify(['sw', 'nw']) ||
    JSON.stringify(gate.candidate.solidDiagonals) !== JSON.stringify(['ne', 'se']) ||
    gate.candidate.fixedLightRole !== 'west-branch-into-double-width-east-slab' ||
    gate.candidate.transform !== 'none' ||
    gate.candidate.derivation !== 'none' ||
    gate.candidate.resolution !== 'direct-reuse' ||
    JSON.stringify(gate.baselineMaskRows) !== JSON.stringify([15, 19, 23, 24, 42]) ||
    JSON.stringify(gate.stateDiamond) !== JSON.stringify({
      open: 15, singleFilled: [19, 23], doubleFilled: 25,
    }) ||
    gate.maskRowsUnderReview.length !== 0 ||
    JSON.stringify(gate.maskRowsAccepted) !== JSON.stringify([25]) ||
    JSON.stringify(gate.reviewCellSizes) !== JSON.stringify([240, 90, 40]) ||
    JSON.stringify(gate.reviewExtentLengths) !== JSON.stringify([1, 3, 6]) ||
    gate.acceptedWestFilledCompanionMaskIndex !== 43
  ) {
    throw new Error('Double-filled east cross-junction gate identity drift');
  }

  validateExtentMatrix('compact', gate.compactMatrix, 1);
  validateExtentMatrix('three-cell-extent', gate.threeCellExtentMatrix, 3);
  validateExtentMatrix('six-cell-extent', gate.sixCellExtentMatrix, 6);

  const config = configForIndex(25);
  const ledgerEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[25];
  if (
    BLOB_CONFIGS[25] !== 0x3f ||
    JSON.stringify(config) !== JSON.stringify({
      n: true, e: true, s: true, w: true,
      ne: 'solid', se: 'solid', sw: 'concave', nw: 'concave',
    }) ||
    ledgerEntry.topologyClass !== 'cross-junction' ||
    JSON.stringify(ledgerEntry.connectedEdges) !==
      JSON.stringify(['n', 'e', 's', 'w']) ||
    ledgerEntry.exposedEdges.length !== 0 ||
    JSON.stringify(ledgerEntry.pockets) !== JSON.stringify(['sw', 'nw']) ||
    JSON.stringify(ledgerEntry.solidDiagonals) !== JSON.stringify(['ne', 'se']) ||
    ledgerEntry.resolution.kind !== 'direct-reuse' ||
    ledgerEntry.resolution.status !== 'accepted-source-mapping' ||
    ledgerEntry.resolution.variants.length !== 1 ||
    ledgerEntry.resolution.variants[0].sourceStem !== gate.candidate.sourceStem ||
    ledgerEntry.resolution.variants[0].baseFile !== gate.candidate.baseFile ||
    ledgerEntry.resolution.variants[0].upperFile !== gate.candidate.upperFile ||
    ledgerEntry.resolution.variants[0].transform !== gate.candidate.transform ||
    ledgerEntry.resolution.variants[0].derivation !== gate.candidate.derivation
  ) {
    throw new Error('Double-filled east cross-junction source mapping drift');
  }

  for (const control of gate.renderingDecision.acceptedControlSources) {
    const resolution = EQUAL_HEIGHT_MASK_LEDGER.entries[control.maskIndex].resolution;
    if (
      resolution.kind !== control.resolution ||
      resolution.status !== 'accepted-source-mapping' ||
      resolution.variants.length !== 1 ||
      resolution.variants[0].sourceStem !== control.sourceStem ||
      resolution.variants[0].baseFile !== control.baseFile ||
      resolution.variants[0].upperFile !== control.upperFile ||
      resolution.variants[0].transform !== control.transform ||
      resolution.variants[0].derivation !== 'none'
    ) {
      throw new Error(
        `Double-filled east cross-junction control drift at mask_${control.maskIndex}`,
      );
    }
  }

  const acceptedCompanion = EQUAL_HEIGHT_MASK_LEDGER.entries[43];
  if (
    BLOB_CONFIGS[43] !== 0xcf ||
    acceptedCompanion.resolution.kind !== 'approved-derivation' ||
    acceptedCompanion.resolution.status !== 'accepted-source-mapping' ||
    acceptedCompanion.resolution.variants.length !== 1 ||
    acceptedCompanion.resolution.variants[0].sourceStem !== gate.candidate.sourceStem ||
    acceptedCompanion.resolution.variants[0].transform !== 'mirror-x' ||
    acceptedCompanion.resolution.variants[0].derivation !== 'none'
  ) {
    throw new Error('Double-filled east cross-junction accepted mask_43 companion drift');
  }

  const currentCounts = EQUAL_HEIGHT_MASK_LEDGER.counts;
  if (
    JSON.stringify(gate.acceptedLedgerCounts) !== JSON.stringify(currentCounts) ||
    currentCounts['direct-reuse'] !== 28 ||
    currentCounts['approved-derivation'] !== 19 ||
    currentCounts['synthetic-assembly'] !== 0 ||
    currentCounts['unresolved-authored-geometry'] !== 0
  ) {
    throw new Error('Double-filled east cross-junction ledger-count boundary drift');
  }

  const acceptedStems = EQUAL_HEIGHT_MASK_LEDGER.entries.flatMap(({ resolution }) =>
    resolution.kind === 'direct-reuse' || resolution.kind === 'approved-derivation'
      ? resolution.variants.map(({ sourceStem }) => sourceStem)
      : []);
  if (!acceptedStems.includes(gate.candidate.sourceStem)) {
    throw new Error('Double-filled east cross-junction accepted source is missing');
  }

  if (
    gate.renderingDecision.kind !==
      'one-accepted-authored-double-filled-east-four-way-hub' ||
    gate.renderingDecision.scope !== 'external-proof-source-bank' ||
    gate.renderingDecision.sourceDirectory !==
      'assets/walls/quota-co-building-system-proofs/double-filled-east-cross-junction' ||
    JSON.stringify(gate.renderingDecision.authoredSourceFiles) !== JSON.stringify([
      'open_cross_filled_e-base.svg',
      'open_cross_filled_e-upper.svg',
    ])
  ) {
    throw new Error('Double-filled east cross-junction evidence boundary drift');
  }

  if (
    gate.contract || gate.xMirrorAllowed || gate.yMirrorAllowed ||
    gate.rotationAllowed || gate.productionRegistration ||
    gate.productionTopologyMutation || gate.schemaChange ||
    gate.exportable || gate.committedAtlas || !gate.temporaryFrameIds
  ) {
    throw new Error('Double-filled east cross-junction crossed the proof-only boundary');
  }
}

validateEqualHeightDoubleFilledEastCrossJunctionGate();
