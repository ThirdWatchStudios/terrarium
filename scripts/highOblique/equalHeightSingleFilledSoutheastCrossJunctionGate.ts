import { BLOB_CONFIGS, configForIndex } from '../../src/tiles/blob';
import { EQUAL_HEIGHT_MASK_LEDGER } from './equalHeightMaskLedger';

/**
 * Owner-accepted proof-layer gate for mask_23: a four-way hub whose southeast
 * diagonal crook is solid while the other three crooks remain open floor.
 */

export type EqualHeightSingleFilledSoutheastCrossJunctionMask = 23;
export type EqualHeightSingleFilledSoutheastCrossJunctionMatrixMask =
  | 1 | 2 | 4 | 5 | 8 | 10 | 16 | 17 | 23 | 26 | 28 | 34;
export type EqualHeightSingleFilledSoutheastCrossJunctionMatrix =
  readonly (
    readonly (EqualHeightSingleFilledSoutheastCrossJunctionMatrixMask | null)[]
  )[];

export interface EqualHeightSingleFilledSoutheastCrossJunctionCandidate {
  readonly maskIndex: EqualHeightSingleFilledSoutheastCrossJunctionMask;
  readonly sourceMaskIndex: EqualHeightSingleFilledSoutheastCrossJunctionMask;
  readonly sourceStem: 'open_cross_filled_se';
  readonly baseFile: 'open_cross_filled_se-base.svg';
  readonly upperFile: 'open_cross_filled_se-upper.svg';
  readonly connectedEdges: readonly ['n', 'e', 's', 'w'];
  readonly openPockets: readonly ['ne', 'sw', 'nw'];
  readonly solidDiagonals: readonly ['se'];
  readonly fixedLightRole: 'rear-southeast-filled-four-way-hub';
  readonly transform: 'none';
  readonly derivation: 'none';
  readonly resolution: 'direct-reuse';
}

const ONE_CELL_ARM_MATRIX = [
  [null, 4, null],
  [2, 23, 26],
  [null, 16, 34],
] as const satisfies EqualHeightSingleFilledSoutheastCrossJunctionMatrix;

const THREE_CELL_ARM_MATRIX = [
  [null, null, null, 4, null, null, null],
  [null, null, null, 5, null, null, null],
  [null, null, null, 5, null, null, null],
  [2, 10, 10, 23, 28, 10, 8],
  [null, null, null, 17, 34, null, null],
  [null, null, null, 5, null, null, null],
  [null, null, null, 1, null, null, null],
] as const satisfies EqualHeightSingleFilledSoutheastCrossJunctionMatrix;

const SIX_CELL_ARM_MATRIX = [
  [null, null, null, null, null, null, 4, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [2, 10, 10, 10, 10, 10, 23, 28, 10, 10, 10, 10, 8],
  [null, null, null, null, null, null, 17, 34, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 1, null, null, null, null, null, null],
] as const satisfies EqualHeightSingleFilledSoutheastCrossJunctionMatrix;

export const EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE = {
  stem: 'equal-height-single-filled-southeast-cross-junction-gate',
  version: 0,
  status: 'owner-accepted-single-filled-southeast-cross-junction-gate',
  contract: false,
  topologyClass: 'single-filled-southeast-cross-junction',
  candidate: {
    maskIndex: 23,
    sourceMaskIndex: 23,
    sourceStem: 'open_cross_filled_se',
    baseFile: 'open_cross_filled_se-base.svg',
    upperFile: 'open_cross_filled_se-upper.svg',
    connectedEdges: ['n', 'e', 's', 'w'],
    openPockets: ['ne', 'sw', 'nw'],
    solidDiagonals: ['se'],
    fixedLightRole: 'rear-southeast-filled-four-way-hub',
    transform: 'none',
    derivation: 'none',
    resolution: 'direct-reuse',
  } as const satisfies EqualHeightSingleFilledSoutheastCrossJunctionCandidate,
  compactMatrix: ONE_CELL_ARM_MATRIX,
  threeCellArmMatrix: THREE_CELL_ARM_MATRIX,
  sixCellArmMatrix: SIX_CELL_ARM_MATRIX,
  baselineMaskRows: [15, 21, 22] as const,
  maskRowsUnderReview: [] as const,
  maskRowsAccepted: [23] as const,
  reviewCellSizes: [240, 90, 40] as const,
  reviewArmLengths: [1, 3, 6] as const,
  verticalRegister: {
    facing: 'west-fixed',
    ordinaryNeighborMaskRows: [1, 4, 5] as const,
    transitionMaskRows: [17, 21] as const,
    ordinaryNeighborTransform: 'none',
    mixedFacingAllowed: false,
  },
  renderingDecision: {
    kind: 'one-accepted-authored-single-filled-southeast-four-way-hub',
    scope: 'external-proof-source-bank',
    sourceDirectory:
      'assets/walls/quota-co-building-system-proofs/single-filled-southeast-cross-junction',
    authoredSourceFiles: [
      'open_cross_filled_se-base.svg',
      'open_cross_filled_se-upper.svg',
    ] as const,
    acceptedControlSources: [
      {
        maskIndex: 15,
        sourceStem: 'open_cross_junction',
        baseFile: 'open_cross_junction-base.svg',
        upperFile: 'open_cross_junction-upper.svg',
      },
      {
        maskIndex: 21,
        sourceStem: 'open_w_t_filled_se',
        baseFile: 'open_w_t_filled_se-base.svg',
        upperFile: 'open_w_t_filled_se-upper.svg',
      },
      {
        maskIndex: 22,
        sourceStem: 'open_n_t_filled_se',
        baseFile: 'open_n_t_filled_se-base.svg',
        upperFile: 'open_n_t_filled_se-upper.svg',
      },
    ] as const,
    purpose:
      'provide the accepted direct source for one solid southeast diagonal inside the four-socket hub while preserving the northeast, southwest, and northwest floor crooks',
    requiredRead:
      'the accepted open four-way connector with exactly the southeast crook converted into continuous wall mass, never a patch, stacked T, peak, or center post',
    shadePolicy:
      'preserve the accepted rear cream-led mask_21 and mask_22 plane laws; family-wide south-face continuity remains deferred polish',
  },
  acceptedLedgerCounts: {
    'direct-reuse': 23,
    'approved-derivation': 16,
    'synthetic-assembly': 8,
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

function validateArmMatrix(
  label: string,
  matrix: EqualHeightSingleFilledSoutheastCrossJunctionMatrix,
  armLength: 1 | 3 | 6,
): void {
  const size = armLength * 2 + 1;
  const center = armLength;
  if (matrix.length !== size || matrix.some((row) => row.length !== size)) {
    throw new Error(
      `Single-filled southeast cross-junction ${label} matrix must be ${size}x${size}`,
    );
  }
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      let expected: EqualHeightSingleFilledSoutheastCrossJunctionMatrixMask | null = null;
      if (row === center && column === center) {
        expected = 23;
      } else if (row === center + 1 && column === center + 1) {
        expected = 34;
      } else if (column === center) {
        if (row === center + 1) expected = armLength === 1 ? 16 : 17;
        else if (row === 0) expected = 4;
        else if (row === size - 1) expected = 1;
        else expected = 5;
      } else if (row === center) {
        if (column === center + 1) expected = armLength === 1 ? 26 : 28;
        else if (column === 0) expected = 2;
        else if (column === size - 1) expected = 8;
        else expected = 10;
      }
      if (matrix[row][column] !== expected) {
        throw new Error(
          `Single-filled southeast cross-junction ${label} matrix drift at ${column},${row}`,
        );
      }
    }
  }
}

/** Fail loudly if the accepted mask_23 proof-layer source mapping drifts. */
export function validateEqualHeightSingleFilledSoutheastCrossJunctionGate(
  gate = EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE,
): void {
  if (
    gate.stem !== 'equal-height-single-filled-southeast-cross-junction-gate' ||
    gate.status !== 'owner-accepted-single-filled-southeast-cross-junction-gate' ||
    gate.topologyClass !== 'single-filled-southeast-cross-junction' ||
    gate.candidate.maskIndex !== 23 ||
    gate.candidate.sourceMaskIndex !== 23 ||
    gate.candidate.sourceStem !== 'open_cross_filled_se' ||
    gate.candidate.baseFile !== 'open_cross_filled_se-base.svg' ||
    gate.candidate.upperFile !== 'open_cross_filled_se-upper.svg' ||
    JSON.stringify(gate.candidate.connectedEdges) !== JSON.stringify(['n', 'e', 's', 'w']) ||
    JSON.stringify(gate.candidate.openPockets) !== JSON.stringify(['ne', 'sw', 'nw']) ||
    JSON.stringify(gate.candidate.solidDiagonals) !== JSON.stringify(['se']) ||
    gate.candidate.fixedLightRole !== 'rear-southeast-filled-four-way-hub' ||
    gate.candidate.transform !== 'none' ||
    gate.candidate.derivation !== 'none' ||
    gate.candidate.resolution !== 'direct-reuse' ||
    JSON.stringify(gate.baselineMaskRows) !== JSON.stringify([15, 21, 22]) ||
    gate.maskRowsUnderReview.length !== 0 ||
    JSON.stringify(gate.maskRowsAccepted) !== JSON.stringify([23]) ||
    JSON.stringify(gate.reviewCellSizes) !== JSON.stringify([240, 90, 40]) ||
    JSON.stringify(gate.reviewArmLengths) !== JSON.stringify([1, 3, 6]) ||
    gate.verticalRegister.facing !== 'west-fixed' ||
    JSON.stringify(gate.verticalRegister.ordinaryNeighborMaskRows) !==
      JSON.stringify([1, 4, 5]) ||
    JSON.stringify(gate.verticalRegister.transitionMaskRows) !==
      JSON.stringify([17, 21]) ||
    gate.verticalRegister.ordinaryNeighborTransform !== 'none' ||
    gate.verticalRegister.mixedFacingAllowed
  ) {
    throw new Error('Single-filled southeast cross-junction gate identity drift');
  }

  validateArmMatrix('compact', gate.compactMatrix, 1);
  validateArmMatrix('three-cell-arm', gate.threeCellArmMatrix, 3);
  validateArmMatrix('six-cell-arm', gate.sixCellArmMatrix, 6);

  const config = configForIndex(23);
  const ledgerEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[23];
  if (
    BLOB_CONFIGS[23] !== 0x2f ||
    JSON.stringify(config) !== JSON.stringify({
      n: true, e: true, s: true, w: true,
      ne: 'concave', se: 'solid', sw: 'concave', nw: 'concave',
    }) ||
    ledgerEntry.topologyClass !== 'cross-junction' ||
    JSON.stringify(ledgerEntry.connectedEdges) !== JSON.stringify(['n', 'e', 's', 'w']) ||
    ledgerEntry.exposedEdges.length !== 0 ||
    JSON.stringify(ledgerEntry.pockets) !== JSON.stringify(['ne', 'sw', 'nw']) ||
    JSON.stringify(ledgerEntry.solidDiagonals) !== JSON.stringify(['se']) ||
    ledgerEntry.resolution.kind !== 'direct-reuse' ||
    ledgerEntry.resolution.status !== 'accepted-source-mapping' ||
    ledgerEntry.resolution.variants.length !== 1 ||
    ledgerEntry.resolution.variants[0].sourceStem !== gate.candidate.sourceStem ||
    ledgerEntry.resolution.variants[0].baseFile !== gate.candidate.baseFile ||
    ledgerEntry.resolution.variants[0].upperFile !== gate.candidate.upperFile ||
    ledgerEntry.resolution.variants[0].transform !== gate.candidate.transform ||
    ledgerEntry.resolution.variants[0].derivation !== gate.candidate.derivation
  ) {
    throw new Error('Single-filled southeast cross-junction source mapping drift');
  }

  for (const control of gate.renderingDecision.acceptedControlSources) {
    const resolution = EQUAL_HEIGHT_MASK_LEDGER.entries[control.maskIndex].resolution;
    if (
      resolution.kind !== 'direct-reuse' ||
      resolution.status !== 'accepted-source-mapping' ||
      resolution.variants.length !== 1 ||
      resolution.variants[0].sourceStem !== control.sourceStem ||
      resolution.variants[0].baseFile !== control.baseFile ||
      resolution.variants[0].upperFile !== control.upperFile ||
      resolution.variants[0].transform !== 'none' ||
      resolution.variants[0].derivation !== 'none'
    ) {
      throw new Error(
        `Single-filled southeast cross-junction control drift at mask_${control.maskIndex}`,
      );
    }
  }

  const currentCounts = EQUAL_HEIGHT_MASK_LEDGER.counts;
  if (
    JSON.stringify(gate.acceptedLedgerCounts) !== JSON.stringify(currentCounts) ||
    currentCounts['direct-reuse'] !== 23 ||
    currentCounts['approved-derivation'] !== 16 ||
    currentCounts['synthetic-assembly'] !== 8 ||
    currentCounts['unresolved-authored-geometry'] !== 0
  ) {
    throw new Error('Single-filled southeast cross-junction ledger-count boundary drift');
  }

  const acceptedStems = EQUAL_HEIGHT_MASK_LEDGER.entries.flatMap(({ resolution }) =>
    resolution.kind === 'direct-reuse' || resolution.kind === 'approved-derivation'
      ? resolution.variants.map(({ sourceStem }) => sourceStem)
      : []);
  if (!acceptedStems.includes(gate.candidate.sourceStem)) {
    throw new Error('Single-filled southeast cross-junction accepted source is missing');
  }

  if (
    gate.renderingDecision.kind !==
      'one-accepted-authored-single-filled-southeast-four-way-hub' ||
    gate.renderingDecision.scope !== 'external-proof-source-bank' ||
    gate.renderingDecision.sourceDirectory !==
      'assets/walls/quota-co-building-system-proofs/single-filled-southeast-cross-junction' ||
    JSON.stringify(gate.renderingDecision.authoredSourceFiles) !== JSON.stringify([
      'open_cross_filled_se-base.svg',
      'open_cross_filled_se-upper.svg',
    ])
  ) {
    throw new Error('Single-filled southeast cross-junction evidence boundary drift');
  }

  if (
    gate.contract || gate.xMirrorAllowed || gate.yMirrorAllowed ||
    gate.rotationAllowed || gate.productionRegistration ||
    gate.productionTopologyMutation || gate.schemaChange ||
    gate.exportable || gate.committedAtlas || !gate.temporaryFrameIds
  ) {
    throw new Error('Single-filled southeast cross-junction gate crossed the proof-only boundary');
  }
}

validateEqualHeightSingleFilledSoutheastCrossJunctionGate();
