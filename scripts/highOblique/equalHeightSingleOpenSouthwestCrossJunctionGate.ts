import {
  BLOB_CONFIGS,
  NB,
  blobIndex,
  configForIndex,
} from '../../src/tiles/blob';
import { EQUAL_HEIGHT_MASK_LEDGER } from './equalHeightMaskLedger';

/**
 * Owner-accepted proof-layer gate for mask_41: all cardinal sockets connect,
 * northeast/southeast/northwest are solid, and southwest remains open floor.
 */

export type EqualHeightSingleOpenSouthwestCrossJunctionMask = 41;
export type EqualHeightSingleOpenSouthwestCrossJunctionMatrixMask =
  | 1 | 2 | 4 | 5 | 8 | 10 | 16 | 17 | 18
  | 20 | 26 | 31 | 32 | 34 | 41 | 42 | 43;
export type EqualHeightSingleOpenSouthwestCrossJunctionMatrix =
  readonly (
    readonly (
      EqualHeightSingleOpenSouthwestCrossJunctionMatrixMask | null
    )[]
  )[];

export interface EqualHeightSingleOpenSouthwestCrossJunctionCandidate {
  readonly maskIndex: EqualHeightSingleOpenSouthwestCrossJunctionMask;
  readonly sourceMaskIndex: EqualHeightSingleOpenSouthwestCrossJunctionMask;
  readonly sourceStem: 'open_cross_filled_ne_se_nw';
  readonly baseFile: 'open_cross_filled_ne_se_nw-base.svg';
  readonly upperFile: 'open_cross_filled_ne_se_nw-upper.svg';
  readonly connectedEdges: readonly ['n', 'e', 's', 'w'];
  readonly openPockets: readonly ['sw'];
  readonly solidDiagonals: readonly ['ne', 'se', 'nw'];
  readonly fixedLightRole: 'single-open-southwest-four-way-hub';
  readonly transform: 'none';
  readonly derivation: 'none';
  readonly resolution: 'direct-reuse';
}

const COMPACT_MATRIX = [
  [20, 31, 26],
  [16, 41, 42],
  [null, 16, 34],
] as const satisfies EqualHeightSingleOpenSouthwestCrossJunctionMatrix;

const THREE_CELL_ARM_MATRIX = [
  [null, null, null, 4, null, null, null],
  [null, null, null, 5, null, null, null],
  [null, null, 20, 32, 26, null, null],
  [2, 10, 18, 41, 43, 10, 8],
  [null, null, null, 17, 34, null, null],
  [null, null, null, 5, null, null, null],
  [null, null, null, 1, null, null, null],
] as const satisfies EqualHeightSingleOpenSouthwestCrossJunctionMatrix;

const SIX_CELL_ARM_MATRIX = [
  [null, null, null, null, null, null, 4, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, 20, 32, 26, null, null, null, null, null],
  [2, 10, 10, 10, 10, 18, 41, 43, 10, 10, 10, 10, 8],
  [null, null, null, null, null, null, 17, 34, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 1, null, null, null, null, null, null],
] as const satisfies EqualHeightSingleOpenSouthwestCrossJunctionMatrix;

export const EQUAL_HEIGHT_SINGLE_OPEN_SOUTHWEST_CROSS_JUNCTION_GATE = {
  stem: 'equal-height-single-open-southwest-cross-junction-gate',
  version: 0,
  status: 'owner-accepted-single-open-southwest-cross-junction-gate',
  contract: false,
  topologyClass: 'single-open-southwest-cross-junction',
  candidate: {
    maskIndex: 41,
    sourceMaskIndex: 41,
    sourceStem: 'open_cross_filled_ne_se_nw',
    baseFile: 'open_cross_filled_ne_se_nw-base.svg',
    upperFile: 'open_cross_filled_ne_se_nw-upper.svg',
    connectedEdges: ['n', 'e', 's', 'w'],
    openPockets: ['sw'],
    solidDiagonals: ['ne', 'se', 'nw'],
    fixedLightRole: 'single-open-southwest-four-way-hub',
    transform: 'none',
    derivation: 'none',
    resolution: 'direct-reuse',
  } as const satisfies EqualHeightSingleOpenSouthwestCrossJunctionCandidate,
  compactMatrix: COMPACT_MATRIX,
  threeCellArmMatrix: THREE_CELL_ARM_MATRIX,
  sixCellArmMatrix: SIX_CELL_ARM_MATRIX,
  baselineMaskRows: [25, 39, 40] as const,
  installedNeighborMaskRows: [
    1, 2, 4, 5, 8, 10, 16, 17, 18, 20, 26, 31, 32, 34, 42, 43,
  ] as const,
  maskRowsUnderReview: [] as const,
  maskRowsAccepted: [41] as const,
  reviewCellSizes: [240, 90, 40] as const,
  reviewArmLengths: [1, 3, 6] as const,
  renderingDecision: {
    kind: 'one-accepted-authored-single-open-southwest-four-way-hub',
    scope: 'external-proof-source-bank',
    sourceDirectory:
      'assets/walls/quota-co-building-system-proofs/single-open-southwest-cross-junction',
    authoredSourceFiles: [
      'open_cross_filled_ne_se_nw-base.svg',
      'open_cross_filled_ne_se_nw-upper.svg',
    ] as const,
    sourceCanvas: 128,
    sourceAuthorship: 'flattened-fixed-view-no-transform',
    geometryCueMaskIndices: [25, 39] as const,
    southwestReturnControlMaskIndex: 40,
    southwestReturnControlPolicy:
      'accepted mask_40 constrains the exposed southwest material return only; it is not geometry or source provenance',
    sourceRelationship:
      'authored-cues-only-no-derived-provenance',
    composition:
      'author one flattened north-and-east wrapped slab union; mask_25 and mask_39 constrain the three solid diagonals but must not be stacked',
    purpose:
      'join all four sockets through one three-solid hub while the southwest crook remains genuine floor',
    requiredRead:
      'one molded L-shaped cream mass with one open southwest return and no center peak, post, patch, cap, or doubled belt',
    shadePolicy:
      'keep coral, green, and south-facing depth on the exposed southwest return only; buried northeast, southeast, and northwest joins remain cream-led',
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
): EqualHeightSingleOpenSouthwestCrossJunctionMatrix {
  const size = armLength * 2 + 1;
  const center = armLength;
  const occupied = (column: number, row: number): boolean =>
    (column === center && row >= 0 && row < size) ||
    (row === center && column >= 0 && column < size) ||
    (row === center - 1 &&
      (column === center - 1 || column === center + 1)) ||
    (row === center + 1 && column === center + 1);
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) => {
      if (!occupied(column, row)) return null;
      let raw = 0;
      for (const [bit, dx, dy] of NEIGHBORS) {
        if (occupied(column + dx, row + dy)) raw |= bit;
      }
      return blobIndex(raw) as
        EqualHeightSingleOpenSouthwestCrossJunctionMatrixMask;
    }),
  );
}

function validateArmMatrix(
  label: string,
  matrix: EqualHeightSingleOpenSouthwestCrossJunctionMatrix,
  armLength: 1 | 3 | 6,
): void {
  const size = armLength * 2 + 1;
  if (matrix.length !== size || matrix.some((row) => row.length !== size)) {
    throw new Error(
      `Single-open southwest cross-junction ${label} matrix must be ${size}x${size}`,
    );
  }
  if (JSON.stringify(matrix) !== JSON.stringify(expectedMatrix(armLength))) {
    throw new Error(
      `Single-open southwest cross-junction ${label} matrix drift`,
    );
  }
}

/** Fail loudly if the accepted mask_41 proof-layer source mapping drifts. */
export function validateEqualHeightSingleOpenSouthwestCrossJunctionGate(
  gate = EQUAL_HEIGHT_SINGLE_OPEN_SOUTHWEST_CROSS_JUNCTION_GATE,
): void {
  if (
    gate.stem !==
      'equal-height-single-open-southwest-cross-junction-gate' ||
    gate.status !==
      'owner-accepted-single-open-southwest-cross-junction-gate' ||
    gate.topologyClass !== 'single-open-southwest-cross-junction' ||
    gate.candidate.maskIndex !== 41 ||
    gate.candidate.sourceMaskIndex !== 41 ||
    gate.candidate.sourceStem !== 'open_cross_filled_ne_se_nw' ||
    gate.candidate.baseFile !==
      'open_cross_filled_ne_se_nw-base.svg' ||
    gate.candidate.upperFile !==
      'open_cross_filled_ne_se_nw-upper.svg' ||
    JSON.stringify(gate.candidate.connectedEdges) !==
      JSON.stringify(['n', 'e', 's', 'w']) ||
    JSON.stringify(gate.candidate.openPockets) !==
      JSON.stringify(['sw']) ||
    JSON.stringify(gate.candidate.solidDiagonals) !==
      JSON.stringify(['ne', 'se', 'nw']) ||
    gate.candidate.fixedLightRole !==
      'single-open-southwest-four-way-hub' ||
    gate.candidate.transform !== 'none' ||
    gate.candidate.derivation !== 'none' ||
    gate.candidate.resolution !== 'direct-reuse' ||
    JSON.stringify(gate.baselineMaskRows) !==
      JSON.stringify([25, 39, 40]) ||
    JSON.stringify(gate.installedNeighborMaskRows) !==
      JSON.stringify([
        1, 2, 4, 5, 8, 10, 16, 17, 18, 20, 26, 31, 32, 34, 42, 43,
      ]) ||
    gate.maskRowsUnderReview.length !== 0 ||
    JSON.stringify(gate.maskRowsAccepted) !== JSON.stringify([41]) ||
    JSON.stringify(gate.reviewCellSizes) !==
      JSON.stringify([240, 90, 40]) ||
    JSON.stringify(gate.reviewArmLengths) !== JSON.stringify([1, 3, 6])
  ) {
    throw new Error(
      'Single-open southwest cross-junction gate identity drift',
    );
  }

  validateArmMatrix('compact', gate.compactMatrix, 1);
  validateArmMatrix('three-cell-arm', gate.threeCellArmMatrix, 3);
  validateArmMatrix('six-cell-arm', gate.sixCellArmMatrix, 6);

  const targetEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[41];
  if (
    BLOB_CONFIGS[41] !== 0xbf ||
    JSON.stringify(configForIndex(41)) !== JSON.stringify({
      n: true,
      e: true,
      s: true,
      w: true,
      ne: 'solid',
      se: 'solid',
      sw: 'concave',
      nw: 'solid',
    }) ||
    targetEntry.topologyClass !== 'cross-junction' ||
    JSON.stringify(targetEntry.connectedEdges) !==
      JSON.stringify(['n', 'e', 's', 'w']) ||
    targetEntry.exposedEdges.length !== 0 ||
    JSON.stringify(targetEntry.pockets) !== JSON.stringify(['sw']) ||
    JSON.stringify(targetEntry.solidDiagonals) !==
      JSON.stringify(['ne', 'se', 'nw']) ||
    targetEntry.resolution.kind !== 'direct-reuse' ||
    targetEntry.resolution.status !== 'accepted-source-mapping' ||
    targetEntry.resolution.variants.length !== 1 ||
    targetEntry.resolution.variants[0].role !==
      'single-open-southwest-cross-junction' ||
    targetEntry.resolution.variants[0].sourceStem !==
      'open_cross_filled_ne_se_nw' ||
    targetEntry.resolution.variants[0].baseFile !==
      'open_cross_filled_ne_se_nw-base.svg' ||
    targetEntry.resolution.variants[0].upperFile !==
      'open_cross_filled_ne_se_nw-upper.svg' ||
    targetEntry.resolution.variants[0].transform !== 'none' ||
    targetEntry.resolution.variants[0].derivation !== 'none'
  ) {
    throw new Error(
      'Single-open southwest cross-junction accepted-ledger boundary drift',
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
        `Single-open southwest cross-junction accepted-control drift at mask_${index}`,
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
      'Single-open southwest cross-junction ledger-count boundary drift',
    );
  }

  if (
    gate.renderingDecision.kind !==
      'one-accepted-authored-single-open-southwest-four-way-hub' ||
    gate.renderingDecision.scope !==
      'external-proof-source-bank' ||
    gate.renderingDecision.sourceDirectory !==
      'assets/walls/quota-co-building-system-proofs/single-open-southwest-cross-junction' ||
    JSON.stringify(gate.renderingDecision.authoredSourceFiles) !==
      JSON.stringify([
        'open_cross_filled_ne_se_nw-base.svg',
        'open_cross_filled_ne_se_nw-upper.svg',
      ]) ||
    gate.renderingDecision.sourceCanvas !== 128 ||
    gate.renderingDecision.sourceAuthorship !==
      'flattened-fixed-view-no-transform' ||
    JSON.stringify(gate.renderingDecision.geometryCueMaskIndices) !==
      JSON.stringify([25, 39]) ||
    gate.renderingDecision.southwestReturnControlMaskIndex !== 40 ||
    gate.renderingDecision.southwestReturnControlPolicy !==
      'accepted mask_40 constrains the exposed southwest material return only; it is not geometry or source provenance' ||
    gate.renderingDecision.sourceRelationship !==
      'authored-cues-only-no-derived-provenance'
  ) {
    throw new Error(
      'Single-open southwest cross-junction evidence boundary drift',
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
      'Single-open southwest cross-junction crossed the accepted proof boundary',
    );
  }
}

validateEqualHeightSingleOpenSouthwestCrossJunctionGate();
