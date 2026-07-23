import { BLOB_CONFIGS, configForIndex } from '../../src/tiles/blob';
import { EQUAL_HEIGHT_MASK_LEDGER } from './equalHeightMaskLedger';

/**
 * Owner-accepted proof-layer gate for mask_19: a four-way hub whose northeast
 * diagonal crook is solid while the other three crooks remain open floor.
 */

export type EqualHeightSingleFilledCrossJunctionMask = 19;
export type EqualHeightSingleFilledCrossJunctionMatrixMask =
  | 1 | 2 | 4 | 5 | 8 | 10 | 19 | 20 | 21 | 26 | 34 | 35;
export type EqualHeightSingleFilledCrossJunctionMatrix =
  readonly (readonly (EqualHeightSingleFilledCrossJunctionMatrixMask | null)[])[];

export interface EqualHeightSingleFilledCrossJunctionCandidate {
  readonly maskIndex: EqualHeightSingleFilledCrossJunctionMask;
  readonly sourceMaskIndex: EqualHeightSingleFilledCrossJunctionMask;
  readonly sourceStem: 'open_cross_filled_ne';
  readonly baseFile: 'open_cross_filled_ne-base.svg';
  readonly upperFile: 'open_cross_filled_ne-upper.svg';
  readonly connectedEdges: readonly ['n', 'e', 's', 'w'];
  readonly openPockets: readonly ['se', 'sw', 'nw'];
  readonly solidDiagonals: readonly ['ne'];
  readonly fixedLightRole: 'northeast-filled-four-way-hub';
  readonly transform: 'none';
  readonly derivation: 'none';
  readonly resolution: 'direct-reuse';
}

const ONE_CELL_ARM_MATRIX = [
  [null, 20, 26],
  [2, 19, 34],
  [null, 1, null],
] as const satisfies EqualHeightSingleFilledCrossJunctionMatrix;

const THREE_CELL_ARM_MATRIX = [
  [null, null, null, 4, null, null, null],
  [null, null, null, 5, null, null, null],
  [null, null, null, 21, 26, null, null],
  [2, 10, 10, 19, 35, 10, 8],
  [null, null, null, 5, null, null, null],
  [null, null, null, 5, null, null, null],
  [null, null, null, 1, null, null, null],
] as const satisfies EqualHeightSingleFilledCrossJunctionMatrix;

const SIX_CELL_ARM_MATRIX = [
  [null, null, null, null, null, null, 4, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 21, 26, null, null, null, null, null],
  [2, 10, 10, 10, 10, 10, 19, 35, 10, 10, 10, 10, 8],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 1, null, null, null, null, null, null],
] as const satisfies EqualHeightSingleFilledCrossJunctionMatrix;

export const EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE = {
  stem: 'equal-height-single-filled-cross-junction-gate',
  version: 0,
  status: 'owner-accepted-single-filled-cross-junction-gate',
  contract: false,
  topologyClass: 'single-filled-cross-junction',
  candidate: {
    maskIndex: 19,
    sourceMaskIndex: 19,
    sourceStem: 'open_cross_filled_ne',
    baseFile: 'open_cross_filled_ne-base.svg',
    upperFile: 'open_cross_filled_ne-upper.svg',
    connectedEdges: ['n', 'e', 's', 'w'],
    openPockets: ['se', 'sw', 'nw'],
    solidDiagonals: ['ne'],
    fixedLightRole: 'northeast-filled-four-way-hub',
    transform: 'none',
    derivation: 'none',
    resolution: 'direct-reuse',
  } as const satisfies EqualHeightSingleFilledCrossJunctionCandidate,
  compactMatrix: ONE_CELL_ARM_MATRIX,
  threeCellArmMatrix: THREE_CELL_ARM_MATRIX,
  sixCellArmMatrix: SIX_CELL_ARM_MATRIX,
  baselineMaskRows: [15, 17, 18] as const,
  maskRowsUnderReview: [] as const,
  maskRowsAccepted: [19] as const,
  reviewCellSizes: [240, 90, 40] as const,
  reviewArmLengths: [1, 3, 6] as const,
  verticalRegister: {
    facing: 'west-fixed',
    ordinaryNeighborMaskRows: [1, 4, 5] as const,
    fixedSourceMaskRows: [19, 21] as const,
    ordinaryNeighborTransform: 'none',
    mixedFacingAllowed: false,
    eastFacingCompanionMaskIndex: 37,
  },
  renderingDecision: {
    kind: 'one-accepted-authored-single-filled-northeast-four-way-hub',
    scope: 'external-proof-source-bank',
    sourceDirectory:
      'assets/walls/quota-co-building-system-proofs/single-filled-cross-junction',
    authoredSourceFiles: [
      'open_cross_filled_ne-base.svg',
      'open_cross_filled_ne-upper.svg',
    ] as const,
    purpose:
      'provide the accepted direct source for one solid northeast diagonal inside the four-socket hub while preserving the southeast, southwest, and northwest floor crooks',
    requiredRead:
      'the accepted open four-way connector with exactly one crook converted into continuous wall mass, never a patch, stacked T, or center post',
    shadePolicy:
      'preserve authored fixed-light planes from the mask_15, mask_17, and mask_18 controls; family-wide south-face continuity remains deferred polish',
  },
  acceptedLedgerCounts: {
    'direct-reuse': 21,
    'approved-derivation': 14,
    'synthetic-assembly': 12,
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
  matrix: EqualHeightSingleFilledCrossJunctionMatrix,
  armLength: 1 | 3 | 6,
): void {
  const size = armLength * 2 + 1;
  const center = armLength;
  if (matrix.length !== size || matrix.some((row) => row.length !== size)) {
    throw new Error(`Single-filled cross-junction ${label} matrix must be ${size}x${size}`);
  }
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      let expected: EqualHeightSingleFilledCrossJunctionMatrixMask | null = null;
      if (row === center && column === center) expected = 19;
      else if (column === center) {
        if (row === 0) expected = 4;
        else if (row === size - 1) expected = 1;
        else if (row === center - 1) expected = 21;
        else expected = 5;
      } else if (row === center) {
        if (column === 0) expected = 2;
        else if (column === size - 1) expected = 8;
        else if (column === center + 1) expected = 35;
        else expected = 10;
      } else if (row === center - 1 && column === center + 1) {
        expected = 26;
      }
      if (armLength === 1) {
        if (row === 0 && column === 1) expected = 20;
        if (row === 1 && column === 2) expected = 34;
      }
      if (matrix[row][column] !== expected) {
        throw new Error(
          `Single-filled cross-junction ${label} matrix drift at ${column},${row}`,
        );
      }
    }
  }
}

/** Fail loudly if the accepted mask_19 proof-layer source mapping drifts. */
export function validateEqualHeightSingleFilledCrossJunctionGate(
  gate = EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE,
): void {
  if (
    gate.stem !== 'equal-height-single-filled-cross-junction-gate' ||
    gate.status !== 'owner-accepted-single-filled-cross-junction-gate' ||
    gate.topologyClass !== 'single-filled-cross-junction' ||
    gate.candidate.maskIndex !== 19 ||
    gate.candidate.sourceMaskIndex !== 19 ||
    gate.candidate.sourceStem !== 'open_cross_filled_ne' ||
    gate.candidate.baseFile !== 'open_cross_filled_ne-base.svg' ||
    gate.candidate.upperFile !== 'open_cross_filled_ne-upper.svg' ||
    JSON.stringify(gate.candidate.connectedEdges) !== JSON.stringify(['n', 'e', 's', 'w']) ||
    JSON.stringify(gate.candidate.openPockets) !== JSON.stringify(['se', 'sw', 'nw']) ||
    JSON.stringify(gate.candidate.solidDiagonals) !== JSON.stringify(['ne']) ||
    gate.candidate.fixedLightRole !== 'northeast-filled-four-way-hub' ||
    gate.candidate.transform !== 'none' ||
    gate.candidate.derivation !== 'none' ||
    gate.candidate.resolution !== 'direct-reuse' ||
    JSON.stringify(gate.baselineMaskRows) !== JSON.stringify([15, 17, 18]) ||
    gate.maskRowsUnderReview.length !== 0 ||
    JSON.stringify(gate.maskRowsAccepted) !== JSON.stringify([19]) ||
    JSON.stringify(gate.reviewCellSizes) !== JSON.stringify([240, 90, 40]) ||
    JSON.stringify(gate.reviewArmLengths) !== JSON.stringify([1, 3, 6]) ||
    gate.verticalRegister.facing !== 'west-fixed' ||
    JSON.stringify(gate.verticalRegister.ordinaryNeighborMaskRows) !==
      JSON.stringify([1, 4, 5]) ||
    JSON.stringify(gate.verticalRegister.fixedSourceMaskRows) !==
      JSON.stringify([19, 21]) ||
    gate.verticalRegister.ordinaryNeighborTransform !== 'none' ||
    gate.verticalRegister.mixedFacingAllowed ||
    gate.verticalRegister.eastFacingCompanionMaskIndex !== 37
  ) {
    throw new Error('Single-filled cross-junction gate identity drift');
  }

  validateArmMatrix('compact', gate.compactMatrix, 1);
  validateArmMatrix('three-cell-arm', gate.threeCellArmMatrix, 3);
  validateArmMatrix('six-cell-arm', gate.sixCellArmMatrix, 6);

  const config = configForIndex(19);
  const ledgerEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[19];
  if (
    BLOB_CONFIGS[19] !== 0x1f ||
    JSON.stringify(config) !== JSON.stringify({
      n: true, e: true, s: true, w: true,
      ne: 'solid', se: 'concave', sw: 'concave', nw: 'concave',
    }) ||
    ledgerEntry.topologyClass !== 'cross-junction' ||
    JSON.stringify(ledgerEntry.connectedEdges) !== JSON.stringify(['n', 'e', 's', 'w']) ||
    ledgerEntry.exposedEdges.length !== 0 ||
    JSON.stringify(ledgerEntry.pockets) !== JSON.stringify(['se', 'sw', 'nw']) ||
    JSON.stringify(ledgerEntry.solidDiagonals) !== JSON.stringify(['ne']) ||
    ledgerEntry.resolution.kind !== 'direct-reuse' ||
    ledgerEntry.resolution.status !== 'accepted-source-mapping' ||
    ledgerEntry.resolution.variants.length !== 1 ||
    ledgerEntry.resolution.variants[0].sourceStem !== gate.candidate.sourceStem ||
    ledgerEntry.resolution.variants[0].baseFile !== gate.candidate.baseFile ||
    ledgerEntry.resolution.variants[0].upperFile !== gate.candidate.upperFile ||
    ledgerEntry.resolution.variants[0].transform !== gate.candidate.transform ||
    ledgerEntry.resolution.variants[0].derivation !== gate.candidate.derivation
  ) {
    throw new Error('Single-filled cross-junction source mapping drift');
  }

  for (const index of gate.baselineMaskRows) {
    const resolution = EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution;
    if (
      (resolution.kind !== 'direct-reuse' && resolution.kind !== 'approved-derivation') ||
      resolution.status !== 'accepted-source-mapping'
    ) {
      throw new Error(`Single-filled cross-junction baseline drift at mask_${index}`);
    }
  }

  const currentCounts = EQUAL_HEIGHT_MASK_LEDGER.counts;
  if (
    JSON.stringify(gate.acceptedLedgerCounts) !== JSON.stringify(currentCounts) ||
    currentCounts['direct-reuse'] !== 21 ||
    currentCounts['approved-derivation'] !== 14 ||
    currentCounts['synthetic-assembly'] !== 12 ||
    currentCounts['unresolved-authored-geometry'] !== 0
  ) {
    throw new Error('Single-filled cross-junction ledger-count boundary drift');
  }

  if (
    gate.renderingDecision.kind !==
      'one-accepted-authored-single-filled-northeast-four-way-hub' ||
    gate.renderingDecision.scope !== 'external-proof-source-bank' ||
    gate.renderingDecision.sourceDirectory !==
      'assets/walls/quota-co-building-system-proofs/single-filled-cross-junction' ||
    JSON.stringify(gate.renderingDecision.authoredSourceFiles) !== JSON.stringify([
      'open_cross_filled_ne-base.svg',
      'open_cross_filled_ne-upper.svg',
    ])
  ) {
    throw new Error('Single-filled cross-junction evidence boundary drift');
  }

  if (
    gate.contract || gate.xMirrorAllowed || gate.yMirrorAllowed ||
    gate.rotationAllowed || gate.productionRegistration ||
    gate.productionTopologyMutation || gate.schemaChange ||
    gate.exportable || gate.committedAtlas || !gate.temporaryFrameIds
  ) {
    throw new Error('Single-filled cross-junction gate crossed the proof-only boundary');
  }
}

validateEqualHeightSingleFilledCrossJunctionGate();
