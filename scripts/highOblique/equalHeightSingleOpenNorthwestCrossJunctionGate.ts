import {
  BLOB_CONFIGS,
  NB,
  blobIndex,
  configForIndex,
} from '../../src/tiles/blob';
import { EQUAL_HEIGHT_MASK_LEDGER } from './equalHeightMaskLedger';

/**
 * Owner-accepted proof-layer gate for mask_33: all cardinal sockets connect,
 * northeast/southeast/southwest are solid, and northwest remains open floor.
 */

export type EqualHeightSingleOpenNorthwestCrossJunctionMask = 33;
export type EqualHeightSingleOpenNorthwestCrossJunctionMatrixMask =
  | 1 | 2 | 4 | 5 | 8 | 10 | 16 | 20 | 21 | 22 | 26
  | 33 | 34 | 38 | 39 | 42 | 43;
export type EqualHeightSingleOpenNorthwestCrossJunctionMatrix =
  readonly (
    readonly (
      EqualHeightSingleOpenNorthwestCrossJunctionMatrixMask | null
    )[]
  )[];

export interface EqualHeightSingleOpenNorthwestCrossJunctionCandidate {
  readonly maskIndex: EqualHeightSingleOpenNorthwestCrossJunctionMask;
  readonly sourceMaskIndex: EqualHeightSingleOpenNorthwestCrossJunctionMask;
  readonly sourceStem: 'open_cross_filled_ne_se_sw';
  readonly baseFile: 'open_cross_filled_ne_se_sw-base.svg';
  readonly upperFile: 'open_cross_filled_ne_se_sw-upper.svg';
  readonly connectedEdges: readonly ['n', 'e', 's', 'w'];
  readonly openPockets: readonly ['nw'];
  readonly solidDiagonals: readonly ['ne', 'se', 'sw'];
  readonly fixedLightRole: 'single-open-northwest-four-way-hub';
  readonly transform: 'none';
  readonly derivation: 'none';
  readonly resolution: 'direct-reuse';
}

const COMPACT_MATRIX = [
  [null, 20, 26],
  [20, 33, 42],
  [16, 38, 34],
] as const satisfies EqualHeightSingleOpenNorthwestCrossJunctionMatrix;

const THREE_CELL_ARM_MATRIX = [
  [null, null, null, 4, null, null, null],
  [null, null, null, 5, null, null, null],
  [null, null, null, 21, 26, null, null],
  [2, 10, 22, 33, 43, 10, 8],
  [null, null, 16, 39, 34, null, null],
  [null, null, null, 5, null, null, null],
  [null, null, null, 1, null, null, null],
] as const satisfies EqualHeightSingleOpenNorthwestCrossJunctionMatrix;

const SIX_CELL_ARM_MATRIX = [
  [null, null, null, null, null, null, 4, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 21, 26, null, null, null, null, null],
  [2, 10, 10, 10, 10, 22, 33, 43, 10, 10, 10, 10, 8],
  [null, null, null, null, null, 16, 39, 34, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 1, null, null, null, null, null, null],
] as const satisfies EqualHeightSingleOpenNorthwestCrossJunctionMatrix;

export const EQUAL_HEIGHT_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_GATE = {
  stem: 'equal-height-single-open-northwest-cross-junction-gate',
  version: 0,
  status: 'owner-accepted-single-open-northwest-cross-junction-gate',
  contract: false,
  topologyClass: 'single-open-northwest-cross-junction',
  candidate: {
    maskIndex: 33,
    sourceMaskIndex: 33,
    sourceStem: 'open_cross_filled_ne_se_sw',
    baseFile: 'open_cross_filled_ne_se_sw-base.svg',
    upperFile: 'open_cross_filled_ne_se_sw-upper.svg',
    connectedEdges: ['n', 'e', 's', 'w'],
    openPockets: ['nw'],
    solidDiagonals: ['ne', 'se', 'sw'],
    fixedLightRole: 'single-open-northwest-four-way-hub',
    transform: 'none',
    derivation: 'none',
    resolution: 'direct-reuse',
  } as const satisfies EqualHeightSingleOpenNorthwestCrossJunctionCandidate,
  compactMatrix: COMPACT_MATRIX,
  threeCellArmMatrix: THREE_CELL_ARM_MATRIX,
  sixCellArmMatrix: SIX_CELL_ARM_MATRIX,
  baselineMaskRows: [25, 32, 30] as const,
  installedNeighborMaskRows: [
    1, 2, 4, 5, 8, 10, 16, 20, 21, 22, 26, 34, 38, 39, 42, 43,
  ] as const,
  maskRowsUnderReview: [] as const,
  maskRowsAccepted: [33] as const,
  reviewCellSizes: [240, 90, 40] as const,
  reviewArmLengths: [1, 3, 6] as const,
  renderingDecision: {
    kind: 'one-accepted-authored-single-open-northwest-four-way-hub',
    scope: 'external-proof-source-bank',
    sourceDirectory:
      'assets/walls/quota-co-building-system-proofs/single-open-northwest-cross-junction',
    authoredSourceFiles: [
      'open_cross_filled_ne_se_sw-base.svg',
      'open_cross_filled_ne_se_sw-upper.svg',
    ] as const,
    sourceCanvas: 128,
    sourceAuthorship: 'flattened-fixed-view-no-transform',
    geometryCueMaskIndices: [25, 32] as const,
    northwestReturnControlMaskIndex: 30,
    northwestReturnControlPolicy:
      'accepted mask_30 constrains the exposed northwest reveal and arris only; it is not geometry or source provenance',
    sourceRelationship:
      'authored-cues-only-no-derived-provenance',
    composition:
      'author one flattened east-and-south wrapped slab union; mask_25 and mask_32 constrain the three solid diagonals but must not be stacked or Y-mirrored',
    purpose:
      'join all four sockets through one three-solid hub while the northwest crook remains genuine floor',
    requiredRead:
      'one molded L-shaped cream mass with one open northwest return and no center peak, post, patch, cap, stair-step, or doubled belt',
    shadePolicy:
      'keep one northwest reveal light and arris seam; do not repaint coral, green, or south-facing frontage because all southern and eastern crooks are buried',
  },
  acceptedLedgerCounts: {
    'direct-reuse': 28,
    'approved-derivation': 19,
    'synthetic-assembly': 0,
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
): EqualHeightSingleOpenNorthwestCrossJunctionMatrix {
  const size = armLength * 2 + 1;
  const center = armLength;
  const occupied = (column: number, row: number): boolean =>
    (column === center && row >= 0 && row < size) ||
    (row === center && column >= 0 && column < size) ||
    (row === center - 1 && column === center + 1) ||
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
        EqualHeightSingleOpenNorthwestCrossJunctionMatrixMask;
    }),
  );
}

function validateArmMatrix(
  label: string,
  matrix: EqualHeightSingleOpenNorthwestCrossJunctionMatrix,
  armLength: 1 | 3 | 6,
): void {
  const size = armLength * 2 + 1;
  if (matrix.length !== size || matrix.some((row) => row.length !== size)) {
    throw new Error(
      `Single-open northwest cross-junction ${label} matrix must be ${size}x${size}`,
    );
  }
  if (JSON.stringify(matrix) !== JSON.stringify(expectedMatrix(armLength))) {
    throw new Error(
      `Single-open northwest cross-junction ${label} matrix drift`,
    );
  }
}

/** Fail loudly if the accepted mask_33 proof-layer source mapping drifts. */
export function validateEqualHeightSingleOpenNorthwestCrossJunctionGate(
  gate = EQUAL_HEIGHT_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_GATE,
): void {
  if (
    gate.stem !==
      'equal-height-single-open-northwest-cross-junction-gate' ||
    gate.status !==
      'owner-accepted-single-open-northwest-cross-junction-gate' ||
    gate.topologyClass !== 'single-open-northwest-cross-junction' ||
    gate.candidate.maskIndex !== 33 ||
    gate.candidate.sourceMaskIndex !== 33 ||
    gate.candidate.sourceStem !== 'open_cross_filled_ne_se_sw' ||
    gate.candidate.baseFile !==
      'open_cross_filled_ne_se_sw-base.svg' ||
    gate.candidate.upperFile !==
      'open_cross_filled_ne_se_sw-upper.svg' ||
    JSON.stringify(gate.candidate.connectedEdges) !==
      JSON.stringify(['n', 'e', 's', 'w']) ||
    JSON.stringify(gate.candidate.openPockets) !==
      JSON.stringify(['nw']) ||
    JSON.stringify(gate.candidate.solidDiagonals) !==
      JSON.stringify(['ne', 'se', 'sw']) ||
    gate.candidate.fixedLightRole !==
      'single-open-northwest-four-way-hub' ||
    gate.candidate.transform !== 'none' ||
    gate.candidate.derivation !== 'none' ||
    gate.candidate.resolution !== 'direct-reuse' ||
    JSON.stringify(gate.baselineMaskRows) !==
      JSON.stringify([25, 32, 30]) ||
    JSON.stringify(gate.installedNeighborMaskRows) !==
      JSON.stringify([
        1, 2, 4, 5, 8, 10, 16, 20, 21, 22, 26, 34, 38, 39, 42, 43,
      ]) ||
    gate.maskRowsUnderReview.length !== 0 ||
    JSON.stringify(gate.maskRowsAccepted) !== JSON.stringify([33]) ||
    JSON.stringify(gate.reviewCellSizes) !==
      JSON.stringify([240, 90, 40]) ||
    JSON.stringify(gate.reviewArmLengths) !== JSON.stringify([1, 3, 6])
  ) {
    throw new Error(
      'Single-open northwest cross-junction gate identity drift',
    );
  }

  validateArmMatrix('compact', gate.compactMatrix, 1);
  validateArmMatrix('three-cell-arm', gate.threeCellArmMatrix, 3);
  validateArmMatrix('six-cell-arm', gate.sixCellArmMatrix, 6);

  const targetEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[33];
  if (
    BLOB_CONFIGS[33] !== 0x7f ||
    JSON.stringify(configForIndex(33)) !== JSON.stringify({
      n: true,
      e: true,
      s: true,
      w: true,
      ne: 'solid',
      se: 'solid',
      sw: 'solid',
      nw: 'concave',
    }) ||
    targetEntry.topologyClass !== 'cross-junction' ||
    JSON.stringify(targetEntry.connectedEdges) !==
      JSON.stringify(['n', 'e', 's', 'w']) ||
    targetEntry.exposedEdges.length !== 0 ||
    JSON.stringify(targetEntry.pockets) !== JSON.stringify(['nw']) ||
    JSON.stringify(targetEntry.solidDiagonals) !==
      JSON.stringify(['ne', 'se', 'sw']) ||
    targetEntry.resolution.kind !== 'direct-reuse' ||
    targetEntry.resolution.status !== 'accepted-source-mapping' ||
    targetEntry.resolution.variants.length !== 1 ||
    targetEntry.resolution.variants[0].role !==
      'single-open-northwest-cross-junction' ||
    targetEntry.resolution.variants[0].sourceStem !==
      'open_cross_filled_ne_se_sw' ||
    targetEntry.resolution.variants[0].baseFile !==
      'open_cross_filled_ne_se_sw-base.svg' ||
    targetEntry.resolution.variants[0].upperFile !==
      'open_cross_filled_ne_se_sw-upper.svg' ||
    targetEntry.resolution.variants[0].transform !== 'none' ||
    targetEntry.resolution.variants[0].derivation !== 'none'
  ) {
    throw new Error(
      'Single-open northwest cross-junction accepted-ledger boundary drift',
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
        `Single-open northwest cross-junction accepted-control drift at mask_${index}`,
      );
    }
  }

  if (
    JSON.stringify(gate.acceptedLedgerCounts) !==
      JSON.stringify(EQUAL_HEIGHT_MASK_LEDGER.counts) ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['direct-reuse'] !== 28 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['approved-derivation'] !== 19 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['synthetic-assembly'] !== 0 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['unresolved-authored-geometry'] !== 0
  ) {
    throw new Error(
      'Single-open northwest cross-junction ledger-count boundary drift',
    );
  }

  if (
    gate.renderingDecision.kind !==
      'one-accepted-authored-single-open-northwest-four-way-hub' ||
    gate.renderingDecision.scope !==
      'external-proof-source-bank' ||
    gate.renderingDecision.sourceDirectory !==
      'assets/walls/quota-co-building-system-proofs/single-open-northwest-cross-junction' ||
    JSON.stringify(gate.renderingDecision.authoredSourceFiles) !==
      JSON.stringify([
        'open_cross_filled_ne_se_sw-base.svg',
        'open_cross_filled_ne_se_sw-upper.svg',
      ]) ||
    gate.renderingDecision.sourceCanvas !== 128 ||
    gate.renderingDecision.sourceAuthorship !==
      'flattened-fixed-view-no-transform' ||
    JSON.stringify(gate.renderingDecision.geometryCueMaskIndices) !==
      JSON.stringify([25, 32]) ||
    gate.renderingDecision.northwestReturnControlMaskIndex !== 30 ||
    gate.renderingDecision.northwestReturnControlPolicy !==
      'accepted mask_30 constrains the exposed northwest reveal and arris only; it is not geometry or source provenance' ||
    gate.renderingDecision.sourceRelationship !==
      'authored-cues-only-no-derived-provenance'
  ) {
    throw new Error(
      'Single-open northwest cross-junction evidence boundary drift',
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
      'Single-open northwest cross-junction crossed the accepted proof boundary',
    );
  }
}

validateEqualHeightSingleOpenNorthwestCrossJunctionGate();
