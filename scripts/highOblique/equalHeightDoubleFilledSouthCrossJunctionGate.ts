import {
  BLOB_CONFIGS,
  NB,
  blobIndex,
  configForIndex,
} from '../../src/tiles/blob';
import { EQUAL_HEIGHT_MASK_LEDGER } from './equalHeightMaskLedger';

/**
 * Owner-accepted proof-layer gate for mask_32: all four cardinal sockets
 * connect, southeast and southwest are solid, and both northern crooks remain
 * open floor.
 */

export type EqualHeightDoubleFilledSouthCrossJunctionMask = 32;
export type EqualHeightDoubleFilledSouthCrossJunctionMatrixMask =
  | 1 | 2 | 4 | 5 | 8 | 10 | 16 | 20 | 22 | 26 | 28 | 32 | 34 | 38 | 39;
export type EqualHeightDoubleFilledSouthCrossJunctionMatrix =
  readonly (
    readonly (
      EqualHeightDoubleFilledSouthCrossJunctionMatrixMask | null
    )[]
  )[];

export interface EqualHeightDoubleFilledSouthCrossJunctionCandidate {
  readonly maskIndex: EqualHeightDoubleFilledSouthCrossJunctionMask;
  readonly sourceMaskIndex: EqualHeightDoubleFilledSouthCrossJunctionMask;
  readonly sourceStem: 'open_cross_filled_s';
  readonly baseFile: 'open_cross_filled_s-base.svg';
  readonly upperFile: 'open_cross_filled_s-upper.svg';
  readonly connectedEdges: readonly ['n', 'e', 's', 'w'];
  readonly openPockets: readonly ['ne', 'nw'];
  readonly solidDiagonals: readonly ['se', 'sw'];
  readonly fixedLightRole: 'south-filled-four-way-slab-fixed-view';
  readonly transform: 'none';
  readonly derivation: 'none';
  readonly resolution: 'direct-reuse';
}

const COMPACT_MATRIX = [
  [null, 4, null],
  [20, 32, 26],
  [16, 38, 34],
] as const satisfies EqualHeightDoubleFilledSouthCrossJunctionMatrix;

const THREE_CELL_ARM_MATRIX = [
  [null, null, null, 4, null, null, null],
  [null, null, null, 5, null, null, null],
  [null, null, null, 5, null, null, null],
  [2, 10, 22, 32, 28, 10, 8],
  [null, null, 16, 39, 34, null, null],
  [null, null, null, 5, null, null, null],
  [null, null, null, 1, null, null, null],
] as const satisfies EqualHeightDoubleFilledSouthCrossJunctionMatrix;

const SIX_CELL_ARM_MATRIX = [
  [null, null, null, null, null, null, 4, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [2, 10, 10, 10, 10, 22, 32, 28, 10, 10, 10, 10, 8],
  [null, null, null, null, null, 16, 39, 34, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 1, null, null, null, null, null, null],
] as const satisfies EqualHeightDoubleFilledSouthCrossJunctionMatrix;

export const EQUAL_HEIGHT_DOUBLE_FILLED_SOUTH_CROSS_JUNCTION_GATE = {
  stem: 'equal-height-double-filled-south-cross-junction-gate',
  version: 0,
  status: 'owner-accepted-double-filled-south-cross-junction-gate',
  contract: false,
  topologyClass: 'double-filled-south-cross-junction',
  candidate: {
    maskIndex: 32,
    sourceMaskIndex: 32,
    sourceStem: 'open_cross_filled_s',
    baseFile: 'open_cross_filled_s-base.svg',
    upperFile: 'open_cross_filled_s-upper.svg',
    connectedEdges: ['n', 'e', 's', 'w'],
    openPockets: ['ne', 'nw'],
    solidDiagonals: ['se', 'sw'],
    fixedLightRole: 'south-filled-four-way-slab-fixed-view',
    transform: 'none',
    derivation: 'none',
    resolution: 'direct-reuse',
  } as const satisfies EqualHeightDoubleFilledSouthCrossJunctionCandidate,
  compactMatrix: COMPACT_MATRIX,
  threeCellArmMatrix: THREE_CELL_ARM_MATRIX,
  sixCellArmMatrix: SIX_CELL_ARM_MATRIX,
  baselineMaskRows: [23, 29, 38, 39] as const,
  installedNeighborMaskRows: [
    1, 2, 4, 5, 8, 10, 16, 20, 22, 26, 28, 34, 38, 39,
  ] as const,
  maskRowsUnderReview: [] as const,
  maskRowsAccepted: [32] as const,
  reviewCellSizes: [240, 90, 40] as const,
  reviewArmLengths: [1, 3, 6] as const,
  renderingDecision: {
    kind: 'one-accepted-authored-double-filled-south-four-way-hub',
    scope: 'external-proof-source-bank',
    sourceDirectory:
      'assets/walls/quota-co-building-system-proofs/double-filled-south-cross-junction',
    authoredSourceFiles: [
      'open_cross_filled_s-base.svg',
      'open_cross_filled_s-upper.svg',
    ] as const,
    sourceCanvas: 128,
    sourceAuthorship: 'flattened-fixed-view-no-transform',
    geometryCueMaskIndices: [23, 29, 38, 39] as const,
    sourceRelationship: 'authored-cues-only-no-derived-provenance',
    composition:
      'author one flattened southeast-and-southwest-filled base and upper union; accepted single-filled controls constrain the two southern closures but must not be stacked',
    purpose:
      'join a continuous two-cell-deep south slab to all four cardinal sockets while both northern floor crooks remain open',
    requiredRead:
      'one molded four-socket connector with one uninterrupted cream rear plane, two open northern crooks, and no peak, post, patch, cap, or doubled belt',
    shadePolicy:
      'keep the candidate rear plane cream-led and buried at its south edge; installed foreground neighbors own coral, green, plinth, and south-facing shadow',
    oppositeControlMaskIndex: 39,
    oppositeControlPolicy:
      'mask_39 is a geometry and fixed-light comparison only; Y mirror is forbidden',
  },
  acceptedLedgerCounts: {
    'direct-reuse': 26,
    'approved-derivation': 18,
    'synthetic-assembly': 3,
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
): EqualHeightDoubleFilledSouthCrossJunctionMatrix {
  const size = armLength * 2 + 1;
  const center = armLength;
  const occupied = (column: number, row: number): boolean =>
    (column === center && row >= 0 && row < size) ||
    (row === center && column >= 0 && column < size) ||
    (row === center + 1 &&
      (column === center - 1 || column === center + 1));
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) => {
      if (!occupied(column, row)) return null;
      let raw = 0;
      for (const [bit, dx, dy] of NEIGHBORS) {
        if (occupied(column + dx, row + dy)) raw |= bit;
      }
      return blobIndex(raw) as
        EqualHeightDoubleFilledSouthCrossJunctionMatrixMask;
    }),
  );
}

function validateArmMatrix(
  label: string,
  matrix: EqualHeightDoubleFilledSouthCrossJunctionMatrix,
  armLength: 1 | 3 | 6,
): void {
  const size = armLength * 2 + 1;
  if (matrix.length !== size || matrix.some((row) => row.length !== size)) {
    throw new Error(
      `Double-filled south cross-junction ${label} matrix must be ${size}x${size}`,
    );
  }
  if (JSON.stringify(matrix) !== JSON.stringify(expectedMatrix(armLength))) {
    throw new Error(`Double-filled south cross-junction ${label} matrix drift`);
  }
}

/** Fail loudly if the accepted mask_32 proof-layer source mapping drifts. */
export function validateEqualHeightDoubleFilledSouthCrossJunctionGate(
  gate = EQUAL_HEIGHT_DOUBLE_FILLED_SOUTH_CROSS_JUNCTION_GATE,
): void {
  if (
    gate.stem !== 'equal-height-double-filled-south-cross-junction-gate' ||
    gate.status !==
      'owner-accepted-double-filled-south-cross-junction-gate' ||
    gate.topologyClass !== 'double-filled-south-cross-junction' ||
    gate.candidate.maskIndex !== 32 ||
    gate.candidate.sourceMaskIndex !== 32 ||
    gate.candidate.sourceStem !== 'open_cross_filled_s' ||
    gate.candidate.baseFile !== 'open_cross_filled_s-base.svg' ||
    gate.candidate.upperFile !== 'open_cross_filled_s-upper.svg' ||
    JSON.stringify(gate.candidate.connectedEdges) !==
      JSON.stringify(['n', 'e', 's', 'w']) ||
    JSON.stringify(gate.candidate.openPockets) !==
      JSON.stringify(['ne', 'nw']) ||
    JSON.stringify(gate.candidate.solidDiagonals) !==
      JSON.stringify(['se', 'sw']) ||
    gate.candidate.fixedLightRole !==
      'south-filled-four-way-slab-fixed-view' ||
    gate.candidate.transform !== 'none' ||
    gate.candidate.derivation !== 'none' ||
    gate.candidate.resolution !== 'direct-reuse' ||
    JSON.stringify(gate.baselineMaskRows) !==
      JSON.stringify([23, 29, 38, 39]) ||
    JSON.stringify(gate.installedNeighborMaskRows) !==
      JSON.stringify([
        1, 2, 4, 5, 8, 10, 16, 20, 22, 26, 28, 34, 38, 39,
      ]) ||
    gate.maskRowsUnderReview.length !== 0 ||
    JSON.stringify(gate.maskRowsAccepted) !== JSON.stringify([32]) ||
    JSON.stringify(gate.reviewCellSizes) !==
      JSON.stringify([240, 90, 40]) ||
    JSON.stringify(gate.reviewArmLengths) !== JSON.stringify([1, 3, 6])
  ) {
    throw new Error('Double-filled south cross-junction gate identity drift');
  }

  validateArmMatrix('compact', gate.compactMatrix, 1);
  validateArmMatrix('three-cell-arm', gate.threeCellArmMatrix, 3);
  validateArmMatrix('six-cell-arm', gate.sixCellArmMatrix, 6);

  const targetEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[32];
  if (
    BLOB_CONFIGS[32] !== 0x6f ||
    JSON.stringify(configForIndex(32)) !== JSON.stringify({
      n: true,
      e: true,
      s: true,
      w: true,
      ne: 'concave',
      se: 'solid',
      sw: 'solid',
      nw: 'concave',
    }) ||
    targetEntry.topologyClass !== 'cross-junction' ||
    JSON.stringify(targetEntry.connectedEdges) !==
      JSON.stringify(['n', 'e', 's', 'w']) ||
    targetEntry.exposedEdges.length !== 0 ||
    JSON.stringify(targetEntry.pockets) !== JSON.stringify(['ne', 'nw']) ||
    JSON.stringify(targetEntry.solidDiagonals) !==
      JSON.stringify(['se', 'sw']) ||
    targetEntry.resolution.kind !== 'direct-reuse' ||
    targetEntry.resolution.status !== 'accepted-source-mapping' ||
    targetEntry.resolution.variants.length !== 1 ||
    targetEntry.resolution.variants[0].role !==
      'double-filled-south-cross-junction' ||
    targetEntry.resolution.variants[0].sourceStem !== 'open_cross_filled_s' ||
    targetEntry.resolution.variants[0].baseFile !==
      'open_cross_filled_s-base.svg' ||
    targetEntry.resolution.variants[0].upperFile !==
      'open_cross_filled_s-upper.svg' ||
    targetEntry.resolution.variants[0].transform !== 'none' ||
    targetEntry.resolution.variants[0].derivation !== 'none'
  ) {
    throw new Error(
      'Double-filled south cross-junction accepted-ledger boundary drift',
    );
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
        `Double-filled south cross-junction accepted-control drift at mask_${index}`,
      );
    }
  }

  if (
    JSON.stringify(gate.acceptedLedgerCounts) !==
      JSON.stringify(EQUAL_HEIGHT_MASK_LEDGER.counts) ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['direct-reuse'] !== 26 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['approved-derivation'] !== 18 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['synthetic-assembly'] !== 3 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['unresolved-authored-geometry'] !== 0
  ) {
    throw new Error(
      'Double-filled south cross-junction ledger-count boundary drift',
    );
  }

  if (
    gate.renderingDecision.kind !==
      'one-accepted-authored-double-filled-south-four-way-hub' ||
    gate.renderingDecision.scope !== 'external-proof-source-bank' ||
    gate.renderingDecision.sourceDirectory !==
      'assets/walls/quota-co-building-system-proofs/double-filled-south-cross-junction' ||
    JSON.stringify(gate.renderingDecision.authoredSourceFiles) !==
      JSON.stringify([
        'open_cross_filled_s-base.svg',
        'open_cross_filled_s-upper.svg',
      ]) ||
    gate.renderingDecision.sourceCanvas !== 128 ||
    gate.renderingDecision.sourceAuthorship !==
      'flattened-fixed-view-no-transform' ||
    JSON.stringify(gate.renderingDecision.geometryCueMaskIndices) !==
      JSON.stringify([23, 29, 38, 39]) ||
    gate.renderingDecision.sourceRelationship !==
      'authored-cues-only-no-derived-provenance' ||
    gate.renderingDecision.oppositeControlMaskIndex !== 39 ||
    gate.renderingDecision.oppositeControlPolicy !==
      'mask_39 is a geometry and fixed-light comparison only; Y mirror is forbidden'
  ) {
    throw new Error(
      'Double-filled south cross-junction evidence boundary drift',
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
      'Double-filled south cross-junction crossed the accepted proof boundary',
    );
  }
}

validateEqualHeightDoubleFilledSouthCrossJunctionGate();
