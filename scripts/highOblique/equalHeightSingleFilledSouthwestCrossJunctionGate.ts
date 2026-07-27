import { BLOB_CONFIGS, configForIndex } from '../../src/tiles/blob';
import { EQUAL_HEIGHT_MASK_LEDGER } from './equalHeightMaskLedger';
import { EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE } from './equalHeightSingleFilledSoutheastCrossJunctionGate';

/** Owner-accepted proof-layer gate for mask_29, the whole-cell X mirror of mask_23. */

export type EqualHeightSingleFilledSouthwestCrossJunctionMask = 29;
export type EqualHeightSingleFilledSouthwestCrossJunctionMatrixMask =
  | 1 | 2 | 4 | 5 | 8 | 10 | 16 | 20 | 22 | 29 | 34 | 36;
export type EqualHeightSingleFilledSouthwestCrossJunctionMatrix =
  readonly (
    readonly (EqualHeightSingleFilledSouthwestCrossJunctionMatrixMask | null)[]
  )[];

export interface EqualHeightSingleFilledSouthwestCrossJunctionCandidate {
  readonly maskIndex: EqualHeightSingleFilledSouthwestCrossJunctionMask;
  readonly sourceMaskIndex: 23;
  readonly sourceStem: 'open_cross_filled_se';
  readonly baseFile: 'open_cross_filled_se-base.svg';
  readonly upperFile: 'open_cross_filled_se-upper.svg';
  readonly connectedEdges: readonly ['n', 'e', 's', 'w'];
  readonly openPockets: readonly ['ne', 'se', 'nw'];
  readonly solidDiagonals: readonly ['sw'];
  readonly fixedLightRole: 'rear-southwest-filled-four-way-hub';
  readonly transform: 'mirror-x';
  readonly derivation: 'none';
  readonly resolution: 'approved-derivation';
}

const COMPACT_MATRIX = [
  [null, 4, null],
  [20, 29, 8],
  [16, 34, null],
] as const satisfies EqualHeightSingleFilledSouthwestCrossJunctionMatrix;

const THREE_CELL_ARM_MATRIX = [
  [null, null, null, 4, null, null, null],
  [null, null, null, 5, null, null, null],
  [null, null, null, 5, null, null, null],
  [2, 10, 22, 29, 10, 10, 8],
  [null, null, 16, 36, null, null, null],
  [null, null, null, 5, null, null, null],
  [null, null, null, 1, null, null, null],
] as const satisfies EqualHeightSingleFilledSouthwestCrossJunctionMatrix;

const SIX_CELL_ARM_MATRIX = [
  [null, null, null, null, null, null, 4, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [2, 10, 10, 10, 10, 22, 29, 10, 10, 10, 10, 10, 8],
  [null, null, null, null, null, 16, 36, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 1, null, null, null, null, null, null],
] as const satisfies EqualHeightSingleFilledSouthwestCrossJunctionMatrix;

export const EQUAL_HEIGHT_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE = {
  stem: 'equal-height-single-filled-southwest-cross-junction-gate',
  version: 0,
  status: 'owner-accepted-single-filled-southwest-cross-junction-gate',
  contract: false,
  topologyClass: 'single-filled-southwest-cross-junction',
  candidate: {
    maskIndex: 29,
    sourceMaskIndex: 23,
    sourceStem: 'open_cross_filled_se',
    baseFile: 'open_cross_filled_se-base.svg',
    upperFile: 'open_cross_filled_se-upper.svg',
    connectedEdges: ['n', 'e', 's', 'w'],
    openPockets: ['ne', 'se', 'nw'],
    solidDiagonals: ['sw'],
    fixedLightRole: 'rear-southwest-filled-four-way-hub',
    transform: 'mirror-x',
    derivation: 'none',
    resolution: 'approved-derivation',
  } as const satisfies EqualHeightSingleFilledSouthwestCrossJunctionCandidate,
  compactMatrix: COMPACT_MATRIX,
  threeCellArmMatrix: THREE_CELL_ARM_MATRIX,
  sixCellArmMatrix: SIX_CELL_ARM_MATRIX,
  baselineMaskRows: [15, 23, 27, 28] as const,
  installedNeighborMaskRows: [1, 2, 4, 5, 8, 10, 16, 20, 22, 34, 36] as const,
  maskRowsUnderReview: [] as const,
  maskRowsAccepted: [29] as const,
  reviewCellSizes: [240, 90, 40] as const,
  reviewArmLengths: [1, 3, 6] as const,
  renderingDecision: {
    kind: 'accepted-plain-whole-cell-x-mirror',
    scope: 'external-proof-source-reuse',
    sourceDirectory:
      'assets/walls/quota-co-building-system-proofs/single-filled-southeast-cross-junction',
    reusedSourceFiles: [
      'open_cross_filled_se-base.svg',
      'open_cross_filled_se-upper.svg',
    ] as const,
    newAuthoredSourceFiles: [] as const,
    sourceCanvas: 128,
    mirrorAxisX: 64,
    mirrorPolicy: 'whole-cell-x-no-filter',
    purpose:
      'test one southwest solid diagonal inside the four-socket hub while northeast, southeast, and northwest remain genuine floor crooks',
    requiredRead:
      'the accepted mask_23 connector mirrored as one molded union, never a patch, stacked T, peak, post, duplicate belt, or exposed buried fascia',
    shadePolicy:
      'preserve the source Y-based fixed-light ownership and its synchronized cream, arris, shade, coral, green, and seam turn; the plain-X mirror must wrap exactly once around the southwest fill without filtering or moving any socket pixel',
  },
  acceptedLedgerCounts: {
    'direct-reuse': 28,
    'approved-derivation': 19,
    'synthetic-assembly': 0,
    'unresolved-authored-geometry': 0,
  },
  xMirrorAllowed: true,
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
  matrix: EqualHeightSingleFilledSouthwestCrossJunctionMatrix,
  armLength: 1 | 3 | 6,
): void {
  const size = armLength * 2 + 1;
  const center = armLength;
  if (matrix.length !== size || matrix.some((row) => row.length !== size)) {
    throw new Error(
      `Single-filled southwest cross-junction ${label} matrix must be ${size}x${size}`,
    );
  }
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      let expected: EqualHeightSingleFilledSouthwestCrossJunctionMatrixMask | null = null;
      if (row === center && column === center) {
        expected = 29;
      } else if (row === center + 1 && column === center - 1) {
        expected = 16;
      } else if (column === center) {
        if (row === center + 1) expected = armLength === 1 ? 34 : 36;
        else if (row === 0) expected = 4;
        else if (row === size - 1) expected = 1;
        else expected = 5;
      } else if (row === center) {
        if (column === center - 1) expected = armLength === 1 ? 20 : 22;
        else if (column === 0) expected = 2;
        else if (column === size - 1) expected = 8;
        else expected = 10;
      }
      if (matrix[row][column] !== expected) {
        throw new Error(
          `Single-filled southwest cross-junction ${label} matrix drift at ${column},${row}`,
        );
      }
    }
  }
}

/** Fail loudly if the accepted mask_29 proof-layer gate drifts. */
export function validateEqualHeightSingleFilledSouthwestCrossJunctionGate(
  gate = EQUAL_HEIGHT_SINGLE_FILLED_SOUTHWEST_CROSS_JUNCTION_GATE,
): void {
  if (
    gate.stem !== 'equal-height-single-filled-southwest-cross-junction-gate' ||
    gate.status !== 'owner-accepted-single-filled-southwest-cross-junction-gate' ||
    gate.topologyClass !== 'single-filled-southwest-cross-junction' ||
    gate.candidate.maskIndex !== 29 ||
    gate.candidate.sourceMaskIndex !== 23 ||
    gate.candidate.sourceStem !== 'open_cross_filled_se' ||
    gate.candidate.baseFile !== 'open_cross_filled_se-base.svg' ||
    gate.candidate.upperFile !== 'open_cross_filled_se-upper.svg' ||
    JSON.stringify(gate.candidate.connectedEdges) !==
      JSON.stringify(['n', 'e', 's', 'w']) ||
    JSON.stringify(gate.candidate.openPockets) !==
      JSON.stringify(['ne', 'se', 'nw']) ||
    JSON.stringify(gate.candidate.solidDiagonals) !==
      JSON.stringify(['sw']) ||
    gate.candidate.fixedLightRole !==
      'rear-southwest-filled-four-way-hub' ||
    gate.candidate.transform !== 'mirror-x' ||
    gate.candidate.derivation !== 'none' ||
    gate.candidate.resolution !== 'approved-derivation' ||
    JSON.stringify(gate.baselineMaskRows) !==
      JSON.stringify([15, 23, 27, 28]) ||
    JSON.stringify(gate.installedNeighborMaskRows) !==
      JSON.stringify([1, 2, 4, 5, 8, 10, 16, 20, 22, 34, 36]) ||
    gate.maskRowsUnderReview.length !== 0 ||
    JSON.stringify(gate.maskRowsAccepted) !== JSON.stringify([29]) ||
    JSON.stringify(gate.reviewCellSizes) !== JSON.stringify([240, 90, 40]) ||
    JSON.stringify(gate.reviewArmLengths) !== JSON.stringify([1, 3, 6])
  ) {
    throw new Error('Single-filled southwest cross-junction gate identity drift');
  }

  validateArmMatrix('compact', gate.compactMatrix, 1);
  validateArmMatrix('three-cell-arm', gate.threeCellArmMatrix, 3);
  validateArmMatrix('six-cell-arm', gate.sixCellArmMatrix, 6);

  const sourceGate = EQUAL_HEIGHT_SINGLE_FILLED_SOUTHEAST_CROSS_JUNCTION_GATE;
  const sourceEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[23];
  const targetEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[29];
  if (
    BLOB_CONFIGS[23] !== 0x2f ||
    BLOB_CONFIGS[29] !== 0x4f ||
    JSON.stringify(configForIndex(29)) !== JSON.stringify({
      n: true, e: true, s: true, w: true,
      ne: 'concave', se: 'concave', sw: 'solid', nw: 'concave',
    }) ||
    sourceGate.candidate.maskIndex !== gate.candidate.sourceMaskIndex ||
    sourceGate.candidate.sourceStem !== gate.candidate.sourceStem ||
    sourceGate.candidate.baseFile !== gate.candidate.baseFile ||
    sourceGate.candidate.upperFile !== gate.candidate.upperFile ||
    sourceGate.candidate.transform !== 'none' ||
    sourceGate.candidate.derivation !== 'none' ||
    sourceEntry.resolution.kind !== 'direct-reuse' ||
    sourceEntry.resolution.status !== 'accepted-source-mapping' ||
    sourceEntry.resolution.variants.length !== 1 ||
    sourceEntry.resolution.variants[0].sourceStem !==
      gate.candidate.sourceStem ||
    sourceEntry.resolution.variants[0].transform !== 'none' ||
    sourceEntry.resolution.variants[0].derivation !== 'none' ||
    targetEntry.topologyClass !== 'cross-junction' ||
    JSON.stringify(targetEntry.connectedEdges) !==
      JSON.stringify(['n', 'e', 's', 'w']) ||
    targetEntry.exposedEdges.length !== 0 ||
    JSON.stringify(targetEntry.pockets) !==
      JSON.stringify(['ne', 'se', 'nw']) ||
    JSON.stringify(targetEntry.solidDiagonals) !== JSON.stringify(['sw']) ||
    targetEntry.resolution.kind !== 'approved-derivation' ||
    targetEntry.resolution.status !== 'accepted-source-mapping' ||
    targetEntry.resolution.variants.length !== 1 ||
    targetEntry.resolution.variants[0].sourceStem !== gate.candidate.sourceStem ||
    targetEntry.resolution.variants[0].baseFile !== gate.candidate.baseFile ||
    targetEntry.resolution.variants[0].upperFile !== gate.candidate.upperFile ||
    targetEntry.resolution.variants[0].transform !== gate.candidate.transform ||
    targetEntry.resolution.variants[0].derivation !== gate.candidate.derivation
  ) {
    throw new Error('Single-filled southwest cross-junction topology boundary drift');
  }

  for (const index of [
    ...gate.baselineMaskRows,
    ...gate.installedNeighborMaskRows,
  ]) {
    const resolution = EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution;
    if (
      (resolution.kind !== 'direct-reuse' &&
        resolution.kind !== 'approved-derivation') ||
      resolution.status !== 'accepted-source-mapping'
    ) {
      throw new Error(
        `Single-filled southwest cross-junction control drift at mask_${index}`,
      );
    }
  }

  const currentCounts = EQUAL_HEIGHT_MASK_LEDGER.counts;
  if (
    JSON.stringify(gate.acceptedLedgerCounts) !==
      JSON.stringify(currentCounts) ||
    currentCounts['direct-reuse'] !== 28 ||
    currentCounts['approved-derivation'] !== 19 ||
    currentCounts['synthetic-assembly'] !== 0 ||
    currentCounts['unresolved-authored-geometry'] !== 0
  ) {
    throw new Error(
      'Single-filled southwest cross-junction ledger boundary drift',
    );
  }

  if (
    gate.renderingDecision.kind !==
      'accepted-plain-whole-cell-x-mirror' ||
    gate.renderingDecision.scope !== 'external-proof-source-reuse' ||
    gate.renderingDecision.sourceDirectory !==
      'assets/walls/quota-co-building-system-proofs/single-filled-southeast-cross-junction' ||
    JSON.stringify(gate.renderingDecision.reusedSourceFiles) !==
      JSON.stringify([
        'open_cross_filled_se-base.svg',
        'open_cross_filled_se-upper.svg',
      ]) ||
    gate.renderingDecision.newAuthoredSourceFiles.length !== 0 ||
    gate.renderingDecision.sourceCanvas !== 128 ||
    gate.renderingDecision.mirrorAxisX !== 64 ||
    gate.renderingDecision.mirrorPolicy !== 'whole-cell-x-no-filter'
  ) {
    throw new Error(
      'Single-filled southwest cross-junction source-reuse boundary drift',
    );
  }

  if (
    gate.contract || !gate.xMirrorAllowed ||
    gate.yMirrorAllowed || gate.rotationAllowed ||
    gate.productionRegistration || gate.productionTopologyMutation ||
    gate.schemaChange || gate.exportable || gate.committedAtlas ||
    !gate.temporaryFrameIds
  ) {
    throw new Error(
      'Single-filled southwest cross-junction gate crossed the proof-only production boundary',
    );
  }
}

validateEqualHeightSingleFilledSouthwestCrossJunctionGate();
