import { BLOB_CONFIGS, configForIndex } from '../../src/tiles/blob';
import { EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE } from './equalHeightDoubleFilledEastCrossJunctionGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from './equalHeightMaskLedger';

/** Owner-accepted proof-layer gate for the whole-cell X-mirrored mask_43 slab junction. */

export type EqualHeightDoubleFilledWestCrossJunctionMask = 43;
export type EqualHeightDoubleFilledWestCrossJunctionMatrixMask =
  | 8 | 10 | 16 | 20 | 24 | 26 | 34 | 42 | 43;
export type EqualHeightDoubleFilledWestCrossJunctionMatrix =
  readonly (
    readonly (EqualHeightDoubleFilledWestCrossJunctionMatrixMask | null)[]
  )[];

export interface EqualHeightDoubleFilledWestCrossJunctionCandidate {
  readonly maskIndex: EqualHeightDoubleFilledWestCrossJunctionMask;
  readonly sourceMaskIndex: 25;
  readonly sourceStem: 'open_cross_filled_e';
  readonly baseFile: 'open_cross_filled_e-base.svg';
  readonly upperFile: 'open_cross_filled_e-upper.svg';
  readonly connectedEdges: readonly ['n', 'e', 's', 'w'];
  readonly openPockets: readonly ['ne', 'se'];
  readonly solidDiagonals: readonly ['sw', 'nw'];
  readonly fixedLightRole: 'east-branch-into-double-width-west-slab';
  readonly transform: 'mirror-x';
  readonly derivation: 'none';
  readonly resolution: 'approved-derivation';
}

const COMPACT_MATRIX = [
  [20, 26, null],
  [24, 43, 8],
  [16, 34, null],
] as const satisfies EqualHeightDoubleFilledWestCrossJunctionMatrix;

const THREE_CELL_EXTENT_MATRIX = [
  [null, null, 20, 26, null, null, null],
  [null, null, 24, 42, null, null, null],
  [null, null, 24, 42, null, null, null],
  [null, null, 24, 43, 10, 10, 8],
  [null, null, 24, 42, null, null, null],
  [null, null, 24, 42, null, null, null],
  [null, null, 16, 34, null, null, null],
] as const satisfies EqualHeightDoubleFilledWestCrossJunctionMatrix;

const SIX_CELL_EXTENT_MATRIX = [
  [null, null, null, null, null, 20, 26, null, null, null, null, null, null],
  [null, null, null, null, null, 24, 42, null, null, null, null, null, null],
  [null, null, null, null, null, 24, 42, null, null, null, null, null, null],
  [null, null, null, null, null, 24, 42, null, null, null, null, null, null],
  [null, null, null, null, null, 24, 42, null, null, null, null, null, null],
  [null, null, null, null, null, 24, 42, null, null, null, null, null, null],
  [null, null, null, null, null, 24, 43, 10, 10, 10, 10, 10, 8],
  [null, null, null, null, null, 24, 42, null, null, null, null, null, null],
  [null, null, null, null, null, 24, 42, null, null, null, null, null, null],
  [null, null, null, null, null, 24, 42, null, null, null, null, null, null],
  [null, null, null, null, null, 24, 42, null, null, null, null, null, null],
  [null, null, null, null, null, 24, 42, null, null, null, null, null, null],
  [null, null, null, null, null, 16, 34, null, null, null, null, null, null],
] as const satisfies EqualHeightDoubleFilledWestCrossJunctionMatrix;

export const EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE = {
  stem: 'equal-height-double-filled-west-cross-junction-gate',
  version: 0,
  status: 'owner-accepted-double-filled-west-cross-junction-gate',
  contract: false,
  topologyClass: 'double-filled-west-cross-junction',
  candidate: {
    maskIndex: 43,
    sourceMaskIndex: 25,
    sourceStem: 'open_cross_filled_e',
    baseFile: 'open_cross_filled_e-base.svg',
    upperFile: 'open_cross_filled_e-upper.svg',
    connectedEdges: ['n', 'e', 's', 'w'],
    openPockets: ['ne', 'se'],
    solidDiagonals: ['sw', 'nw'],
    fixedLightRole: 'east-branch-into-double-width-west-slab',
    transform: 'mirror-x',
    derivation: 'none',
    resolution: 'approved-derivation',
  } as const satisfies EqualHeightDoubleFilledWestCrossJunctionCandidate,
  compactMatrix: COMPACT_MATRIX,
  threeCellExtentMatrix: THREE_CELL_EXTENT_MATRIX,
  sixCellExtentMatrix: SIX_CELL_EXTENT_MATRIX,
  baselineMaskRows: [8, 10, 16, 20, 24, 25, 26, 34, 42] as const,
  maskRowsUnderReview: [] as const,
  maskRowsAccepted: [43] as const,
  reviewCellSizes: [240, 90, 40] as const,
  reviewExtentLengths: [1, 3, 6] as const,
  renderingDecision: {
    kind: 'accepted-plain-whole-cell-x-mirror',
    scope: 'external-proof-source-reuse',
    sourceDirectory:
      'assets/walls/quota-co-building-system-proofs/double-filled-east-cross-junction',
    reusedSourceFiles: [
      'open_cross_filled_e-base.svg',
      'open_cross_filled_e-upper.svg',
    ] as const,
    newAuthoredSourceFiles: [] as const,
    sourceCanvas: 128,
    mirrorAxisX: 64,
    mirrorPolicy: 'whole-cell-x-no-filter',
    purpose:
      'reuse one east branch entering the accepted two-cell-wide west slab while keeping the northeast and southeast floor crooks open',
    requiredRead:
      'one mirrored molded junction with a continuous cream west slab, never a patch, cap, peak, post, duplicate belt, or exposed buried west fascia',
    shadePolicy:
      'preserve north/south fixed-light ownership and the y=97 south-face handoff while moving only the occupied west/east register',
  },
  acceptedLedgerCounts: {
    'direct-reuse': 25,
    'approved-derivation': 17,
    'synthetic-assembly': 5,
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

function validateExtentMatrix(
  label: string,
  matrix: EqualHeightDoubleFilledWestCrossJunctionMatrix,
  extent: 1 | 3 | 6,
): void {
  const size = extent * 2 + 1;
  const center = extent;
  if (matrix.length !== size || matrix.some((row) => row.length !== size)) {
    throw new Error(
      `Double-filled west cross-junction ${label} matrix must be ${size}x${size}`,
    );
  }
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      let expected: EqualHeightDoubleFilledWestCrossJunctionMatrixMask | null = null;
      if (column === center - 1) {
        if (row === 0) expected = 20;
        else if (row === size - 1) expected = 16;
        else expected = 24;
      } else if (column === center) {
        if (row === 0) expected = 26;
        else if (row === size - 1) expected = 34;
        else if (row === center) expected = 43;
        else expected = 42;
      } else if (row === center && column > center) {
        expected = column === size - 1 ? 8 : 10;
      }
      if (matrix[row][column] !== expected) {
        throw new Error(
          `Double-filled west cross-junction ${label} matrix drift at ${column},${row}`,
        );
      }
    }
  }
}

/** Fail loudly if the accepted mask_43 proof-layer gate drifts. */
export function validateEqualHeightDoubleFilledWestCrossJunctionGate(
  gate = EQUAL_HEIGHT_DOUBLE_FILLED_WEST_CROSS_JUNCTION_GATE,
): void {
  if (
    gate.stem !== 'equal-height-double-filled-west-cross-junction-gate' ||
    gate.status !== 'owner-accepted-double-filled-west-cross-junction-gate' ||
    gate.topologyClass !== 'double-filled-west-cross-junction' ||
    gate.candidate.maskIndex !== 43 ||
    gate.candidate.sourceMaskIndex !== 25 ||
    gate.candidate.sourceStem !== 'open_cross_filled_e' ||
    gate.candidate.baseFile !== 'open_cross_filled_e-base.svg' ||
    gate.candidate.upperFile !== 'open_cross_filled_e-upper.svg' ||
    JSON.stringify(gate.candidate.connectedEdges) !==
      JSON.stringify(['n', 'e', 's', 'w']) ||
    JSON.stringify(gate.candidate.openPockets) !==
      JSON.stringify(['ne', 'se']) ||
    JSON.stringify(gate.candidate.solidDiagonals) !==
      JSON.stringify(['sw', 'nw']) ||
    gate.candidate.fixedLightRole !==
      'east-branch-into-double-width-west-slab' ||
    gate.candidate.transform !== 'mirror-x' ||
    gate.candidate.derivation !== 'none' ||
    gate.candidate.resolution !== 'approved-derivation' ||
    JSON.stringify(gate.baselineMaskRows) !==
      JSON.stringify([8, 10, 16, 20, 24, 25, 26, 34, 42]) ||
    gate.maskRowsUnderReview.length !== 0 ||
    JSON.stringify(gate.maskRowsAccepted) !== JSON.stringify([43]) ||
    JSON.stringify(gate.reviewCellSizes) !== JSON.stringify([240, 90, 40]) ||
    JSON.stringify(gate.reviewExtentLengths) !== JSON.stringify([1, 3, 6])
  ) {
    throw new Error('Double-filled west cross-junction gate identity drift');
  }

  validateExtentMatrix('compact', gate.compactMatrix, 1);
  validateExtentMatrix('three-cell-extent', gate.threeCellExtentMatrix, 3);
  validateExtentMatrix('six-cell-extent', gate.sixCellExtentMatrix, 6);

  const sourceGate = EQUAL_HEIGHT_DOUBLE_FILLED_EAST_CROSS_JUNCTION_GATE;
  const sourceEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[25];
  const targetEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[43];
  if (
    BLOB_CONFIGS[25] !== 0x3f ||
    BLOB_CONFIGS[43] !== 0xcf ||
    JSON.stringify(configForIndex(43)) !== JSON.stringify({
      n: true, e: true, s: true, w: true,
      ne: 'concave', se: 'concave', sw: 'solid', nw: 'solid',
    }) ||
    sourceGate.candidate.maskIndex !== gate.candidate.sourceMaskIndex ||
    sourceGate.candidate.sourceStem !== gate.candidate.sourceStem ||
    sourceGate.candidate.baseFile !== gate.candidate.baseFile ||
    sourceGate.candidate.upperFile !== gate.candidate.upperFile ||
    sourceGate.candidate.transform !== 'none' ||
    sourceGate.candidate.derivation !== 'none' ||
    sourceGate.candidate.resolution !== 'direct-reuse' ||
    sourceEntry.resolution.kind !== 'direct-reuse' ||
    sourceEntry.resolution.status !== 'accepted-source-mapping' ||
    sourceEntry.resolution.variants.length !== 1 ||
    sourceEntry.resolution.variants[0].sourceStem !== gate.candidate.sourceStem ||
    sourceEntry.resolution.variants[0].baseFile !== gate.candidate.baseFile ||
    sourceEntry.resolution.variants[0].upperFile !== gate.candidate.upperFile ||
    sourceEntry.resolution.variants[0].transform !== 'none' ||
    sourceEntry.resolution.variants[0].derivation !== 'none' ||
    targetEntry.topologyClass !== 'cross-junction' ||
    JSON.stringify(targetEntry.connectedEdges) !==
      JSON.stringify(['n', 'e', 's', 'w']) ||
    targetEntry.exposedEdges.length !== 0 ||
    JSON.stringify(targetEntry.pockets) !== JSON.stringify(['ne', 'se']) ||
    JSON.stringify(targetEntry.solidDiagonals) !== JSON.stringify(['sw', 'nw']) ||
    targetEntry.resolution.kind !== 'approved-derivation' ||
    targetEntry.resolution.status !== 'accepted-source-mapping' ||
    targetEntry.resolution.variants.length !== 1 ||
    targetEntry.resolution.variants[0].sourceStem !== gate.candidate.sourceStem ||
    targetEntry.resolution.variants[0].baseFile !== gate.candidate.baseFile ||
    targetEntry.resolution.variants[0].upperFile !== gate.candidate.upperFile ||
    targetEntry.resolution.variants[0].transform !== gate.candidate.transform ||
    targetEntry.resolution.variants[0].derivation !== gate.candidate.derivation
  ) {
    throw new Error('Double-filled west cross-junction topology boundary drift');
  }

  for (const index of gate.baselineMaskRows) {
    const resolution = EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution;
    if (
      (resolution.kind !== 'direct-reuse' &&
        resolution.kind !== 'approved-derivation') ||
      resolution.status !== 'accepted-source-mapping'
    ) {
      throw new Error(
        `Double-filled west cross-junction control drift at mask_${index}`,
      );
    }
  }

  const currentCounts = EQUAL_HEIGHT_MASK_LEDGER.counts;
  if (
    JSON.stringify(gate.acceptedLedgerCounts) !==
      JSON.stringify(currentCounts) ||
    currentCounts['direct-reuse'] !== 25 ||
    currentCounts['approved-derivation'] !== 17 ||
    currentCounts['synthetic-assembly'] !== 5 ||
    currentCounts['unresolved-authored-geometry'] !== 0
  ) {
    throw new Error(
      'Double-filled west cross-junction ledger-count boundary drift',
    );
  }

  if (
    gate.renderingDecision.kind !==
      'accepted-plain-whole-cell-x-mirror' ||
    gate.renderingDecision.scope !== 'external-proof-source-reuse' ||
    gate.renderingDecision.sourceDirectory !==
      'assets/walls/quota-co-building-system-proofs/double-filled-east-cross-junction' ||
    JSON.stringify(gate.renderingDecision.reusedSourceFiles) !==
      JSON.stringify([
        'open_cross_filled_e-base.svg',
        'open_cross_filled_e-upper.svg',
      ]) ||
    gate.renderingDecision.newAuthoredSourceFiles.length !== 0 ||
    gate.renderingDecision.sourceCanvas !== 128 ||
    gate.renderingDecision.mirrorAxisX !== 64 ||
    gate.renderingDecision.mirrorPolicy !== 'whole-cell-x-no-filter'
  ) {
    throw new Error(
      'Double-filled west cross-junction source-reuse boundary drift',
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
      'Double-filled west cross-junction gate crossed the proof-only production boundary',
    );
  }
}

validateEqualHeightDoubleFilledWestCrossJunctionGate();
