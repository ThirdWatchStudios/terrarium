import {
  BLOB_CONFIGS,
  NB,
  blobIndex,
  configForIndex,
} from '../../src/tiles/blob';
import {
  EQUAL_HEIGHT_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE,
} from './equalHeightDoubleFilledDiagonalCrossJunctionGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from './equalHeightMaskLedger';

/**
 * Owner-accepted proof-layer gate for mask_40. The accepted derivation reuses
 * the mask_30 source through one whole-cell X mirror after omitting only the
 * two duplicated west-boundary seam paths.
 */

export type EqualHeightDoubleFilledOppositeDiagonalCrossJunctionMask = 40;
export type EqualHeightDoubleFilledOppositeDiagonalCrossJunctionVerticalFacing =
  | 'west'
  | 'east';
export type EqualHeightDoubleFilledOppositeDiagonalCrossJunctionMatrixMask =
  | 1 | 2 | 4 | 5 | 8 | 10 | 16 | 17 | 18 | 20 | 26 | 27 | 28 | 34 | 40;
export type EqualHeightDoubleFilledOppositeDiagonalCrossJunctionMatrix =
  readonly (
    readonly (
      EqualHeightDoubleFilledOppositeDiagonalCrossJunctionMatrixMask | null
    )[]
  )[];

export interface EqualHeightDoubleFilledOppositeDiagonalCrossJunctionCandidate {
  readonly maskIndex: EqualHeightDoubleFilledOppositeDiagonalCrossJunctionMask;
  readonly sourceMaskIndex: 30;
  readonly sourceStem: 'open_cross_filled_ne_sw';
  readonly baseFile: 'open_cross_filled_ne_sw-base.svg';
  readonly upperFile: 'open_cross_filled_ne_sw-upper.svg';
  readonly connectedEdges: readonly ['n', 'e', 's', 'w'];
  readonly openPockets: readonly ['ne', 'sw'];
  readonly solidDiagonals: readonly ['se', 'nw'];
  readonly fixedLightRole: 'opposed-nw-se-filled-four-way-hub';
  readonly transform: 'mirror-x';
  readonly derivation:
    'accepted-opposite-diagonal-boundary-seam-filter';
  readonly resolution: 'approved-derivation';
  readonly acceptedVariant: 'boundary-seam-filtered-mirror';
  readonly sourceOmissions: readonly [
    'base-boundary-seam',
    'upper-boundary-seam',
  ];
}

const COMPACT_MATRIX = [
  [20, 26, null],
  [16, 40, 26],
  [null, 16, 34],
] as const satisfies EqualHeightDoubleFilledOppositeDiagonalCrossJunctionMatrix;

const THREE_CELL_ARM_MATRIX = [
  [null, null, null, 4, null, null, null],
  [null, null, null, 5, null, null, null],
  [null, null, 20, 27, null, null, null],
  [2, 10, 18, 40, 28, 10, 8],
  [null, null, null, 17, 34, null, null],
  [null, null, null, 5, null, null, null],
  [null, null, null, 1, null, null, null],
] as const satisfies EqualHeightDoubleFilledOppositeDiagonalCrossJunctionMatrix;

const SIX_CELL_ARM_MATRIX = [
  [null, null, null, null, null, null, 4, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, 20, 27, null, null, null, null, null, null],
  [2, 10, 10, 10, 10, 18, 40, 28, 10, 10, 10, 10, 8],
  [null, null, null, null, null, null, 17, 34, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 1, null, null, null, null, null, null],
] as const satisfies EqualHeightDoubleFilledOppositeDiagonalCrossJunctionMatrix;

export const EQUAL_HEIGHT_DOUBLE_FILLED_OPPOSITE_DIAGONAL_CROSS_JUNCTION_GATE = {
  stem: 'equal-height-double-filled-opposite-diagonal-cross-junction-gate',
  version: 0,
  status:
    'owner-accepted-double-filled-opposite-diagonal-cross-junction-gate',
  contract: false,
  topologyClass: 'double-filled-opposite-diagonal-cross-junction',
  candidate: {
    maskIndex: 40,
    sourceMaskIndex: 30,
    sourceStem: 'open_cross_filled_ne_sw',
    baseFile: 'open_cross_filled_ne_sw-base.svg',
    upperFile: 'open_cross_filled_ne_sw-upper.svg',
    connectedEdges: ['n', 'e', 's', 'w'],
    openPockets: ['ne', 'sw'],
    solidDiagonals: ['se', 'nw'],
    fixedLightRole: 'opposed-nw-se-filled-four-way-hub',
    transform: 'mirror-x',
    derivation:
      'accepted-opposite-diagonal-boundary-seam-filter',
    resolution: 'approved-derivation',
    acceptedVariant: 'boundary-seam-filtered-mirror',
    sourceOmissions: [
      'base-boundary-seam',
      'upper-boundary-seam',
    ],
  } as const satisfies EqualHeightDoubleFilledOppositeDiagonalCrossJunctionCandidate,
  compactMatrix: COMPACT_MATRIX,
  threeCellArmMatrix: THREE_CELL_ARM_MATRIX,
  sixCellArmMatrix: SIX_CELL_ARM_MATRIX,
  baselineMaskRows: [23, 30, 37] as const,
  installedNeighborMaskRows: [
    1, 2, 4, 5, 8, 10, 16, 17, 18, 20, 26, 27, 28, 34,
  ] as const,
  maskRowsUnderReview: [] as const,
  maskRowsAccepted: [40] as const,
  reviewCellSizes: [240, 90, 40] as const,
  reviewArmLengths: [1, 3, 6] as const,
  comparisonVariants: [
    {
      id: 'raw-whole-cell-mirror-comparison',
      role: 'comparison-control',
      transform: 'mirror-x',
      sourceOmissions: [] as const,
      mirrorPolicy: 'whole-cell-x-no-filter',
    },
    {
      id: 'boundary-seam-filtered-mirror',
      role: 'owner-accepted-derivation',
      transform: 'mirror-x',
      sourceOmissions: [
        'base-boundary-seam',
        'upper-boundary-seam',
      ] as const,
      mirrorPolicy:
        'omit-two-source-boundary-seams-then-whole-cell-mirror-x',
    },
  ] as const,
  acceptedVariant: 'boundary-seam-filtered-mirror',
  renderingDecision: {
    kind: 'accepted-boundary-seam-filtered-whole-cell-x-mirror',
    scope: 'external-proof-source-reuse',
    sourceDirectory:
      'assets/walls/quota-co-building-system-proofs/double-filled-diagonal-cross-junction',
    reusedSourceFiles: [
      'open_cross_filled_ne_sw-base.svg',
      'open_cross_filled_ne_sw-upper.svg',
    ] as const,
    newAuthoredSourceFiles: [] as const,
    sourceCanvas: 128,
    mirrorAxisX: 64,
    mirrorPolicy:
      'omit-two-source-boundary-seams-then-whole-cell-mirror-x',
    filterProvenance:
      'mask-40-owner-accepted-boundary-seam-filter',
    sourceRelationship: 'accepted-mask-30-source-derived-reuse',
    geometryCueMaskIndices: [23, 37] as const,
    purpose:
      'lock the opposite northwest/southeast filled diagonal occupancy without creating another source bank',
    requiredRead:
      'one mirrored molded four-socket connector with northwest and southeast solid, northeast and southwest open floor, and no cap, peak, post, patch, or duplicate belt',
    shadePolicy:
      'mirror the accepted source as one whole cell so fixed-light north/south ownership remains coherent while lateral wall registers exchange sides',
    verticalRegisterPolicy: {
      north: 'east',
      south: 'west',
    },
  },
  acceptedLedgerCounts: {
    'direct-reuse': 27,
    'approved-derivation': 19,
    'synthetic-assembly': 1,
    'unresolved-authored-geometry': 0,
  },
  sourceMappingAccepted: true,
  derivationAccepted: true,
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

/**
 * Whole-cell X mirroring exchanges the accepted mask_30 west/east registers
 * without changing their vertical handoff. The hub row stays with the north
 * register by convention.
 */
export function doubleFilledOppositeDiagonalCrossJunctionVerticalFacing(
  row: number,
  rowCount: number,
): EqualHeightDoubleFilledOppositeDiagonalCrossJunctionVerticalFacing {
  if (
    !Number.isInteger(row) ||
    !Number.isInteger(rowCount) ||
    rowCount < 1 ||
    rowCount % 2 === 0 ||
    row < 0 ||
    row >= rowCount
  ) {
    throw new Error(
      'Double-filled opposite diagonal cross-junction vertical register requires an in-range row in an odd matrix',
    );
  }
  return row > Math.floor(rowCount / 2)
    ? EQUAL_HEIGHT_DOUBLE_FILLED_OPPOSITE_DIAGONAL_CROSS_JUNCTION_GATE
        .renderingDecision.verticalRegisterPolicy.south
    : EQUAL_HEIGHT_DOUBLE_FILLED_OPPOSITE_DIAGONAL_CROSS_JUNCTION_GATE
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
): EqualHeightDoubleFilledOppositeDiagonalCrossJunctionMatrix {
  const size = armLength * 2 + 1;
  const center = armLength;
  const occupied = (column: number, row: number): boolean =>
    (column === center &&
      row >= 0 &&
      row < size) ||
    (row === center &&
      column >= 0 &&
      column < size) ||
    (column === center - 1 && row === center - 1) ||
    (column === center + 1 && row === center + 1);
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) => {
      if (!occupied(column, row)) return null;
      let raw = 0;
      for (const [bit, dx, dy] of NEIGHBORS) {
        if (occupied(column + dx, row + dy)) raw |= bit;
      }
      return blobIndex(raw) as
        EqualHeightDoubleFilledOppositeDiagonalCrossJunctionMatrixMask;
    }),
  );
}

function validateArmMatrix(
  label: string,
  matrix: EqualHeightDoubleFilledOppositeDiagonalCrossJunctionMatrix,
  armLength: 1 | 3 | 6,
): void {
  const size = armLength * 2 + 1;
  if (matrix.length !== size || matrix.some((row) => row.length !== size)) {
    throw new Error(
      `Double-filled opposite diagonal cross-junction ${label} matrix must be ${size}x${size}`,
    );
  }
  if (JSON.stringify(matrix) !== JSON.stringify(expectedMatrix(armLength))) {
    throw new Error(
      `Double-filled opposite diagonal cross-junction ${label} matrix drift`,
    );
  }
}

/** Fail loudly if the accepted mask_40 proof-layer derivation drifts. */
export function validateEqualHeightDoubleFilledOppositeDiagonalCrossJunctionGate(
  gate = EQUAL_HEIGHT_DOUBLE_FILLED_OPPOSITE_DIAGONAL_CROSS_JUNCTION_GATE,
): void {
  if (
    gate.stem !==
      'equal-height-double-filled-opposite-diagonal-cross-junction-gate' ||
    gate.status !==
      'owner-accepted-double-filled-opposite-diagonal-cross-junction-gate' ||
    gate.topologyClass !==
      'double-filled-opposite-diagonal-cross-junction' ||
    gate.candidate.maskIndex !== 40 ||
    gate.candidate.sourceMaskIndex !== 30 ||
    gate.candidate.sourceStem !== 'open_cross_filled_ne_sw' ||
    gate.candidate.baseFile !== 'open_cross_filled_ne_sw-base.svg' ||
    gate.candidate.upperFile !== 'open_cross_filled_ne_sw-upper.svg' ||
    JSON.stringify(gate.candidate.connectedEdges) !==
      JSON.stringify(['n', 'e', 's', 'w']) ||
    JSON.stringify(gate.candidate.openPockets) !==
      JSON.stringify(['ne', 'sw']) ||
    JSON.stringify(gate.candidate.solidDiagonals) !==
      JSON.stringify(['se', 'nw']) ||
    gate.candidate.fixedLightRole !==
      'opposed-nw-se-filled-four-way-hub' ||
    gate.candidate.transform !== 'mirror-x' ||
    gate.candidate.derivation !==
      'accepted-opposite-diagonal-boundary-seam-filter' ||
    gate.candidate.resolution !== 'approved-derivation' ||
    gate.candidate.acceptedVariant !==
      'boundary-seam-filtered-mirror' ||
    JSON.stringify(gate.candidate.sourceOmissions) !==
      JSON.stringify([
        'base-boundary-seam',
        'upper-boundary-seam',
      ]) ||
    JSON.stringify(gate.baselineMaskRows) !==
      JSON.stringify([23, 30, 37]) ||
    JSON.stringify(gate.installedNeighborMaskRows) !==
      JSON.stringify([
        1, 2, 4, 5, 8, 10, 16, 17, 18, 20, 26, 27, 28, 34,
      ]) ||
    gate.maskRowsUnderReview.length !== 0 ||
    JSON.stringify(gate.maskRowsAccepted) !== JSON.stringify([40]) ||
    JSON.stringify(gate.reviewCellSizes) !==
      JSON.stringify([240, 90, 40]) ||
    JSON.stringify(gate.reviewArmLengths) !== JSON.stringify([1, 3, 6]) ||
    gate.acceptedVariant !== 'boundary-seam-filtered-mirror' ||
    JSON.stringify(gate.renderingDecision.verticalRegisterPolicy) !==
      JSON.stringify({ north: 'east', south: 'west' })
  ) {
    throw new Error(
      'Double-filled opposite diagonal cross-junction gate identity drift',
    );
  }

  validateArmMatrix('compact', gate.compactMatrix, 1);
  validateArmMatrix('three-cell-arm', gate.threeCellArmMatrix, 3);
  validateArmMatrix('six-cell-arm', gate.sixCellArmMatrix, 6);

  const sourceGate =
    EQUAL_HEIGHT_DOUBLE_FILLED_DIAGONAL_CROSS_JUNCTION_GATE;
  const sourceEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[30];
  const targetEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[40];
  if (
    BLOB_CONFIGS[30] !== 0x5f ||
    BLOB_CONFIGS[40] !== 0xaf ||
    JSON.stringify(configForIndex(40)) !== JSON.stringify({
      n: true,
      e: true,
      s: true,
      w: true,
      ne: 'concave',
      se: 'solid',
      sw: 'concave',
      nw: 'solid',
    }) ||
    sourceGate.candidate.maskIndex !== gate.candidate.sourceMaskIndex ||
    sourceGate.candidate.sourceStem !== gate.candidate.sourceStem ||
    sourceGate.candidate.baseFile !== gate.candidate.baseFile ||
    sourceGate.candidate.upperFile !== gate.candidate.upperFile ||
    sourceGate.candidate.transform !== 'none' ||
    sourceGate.candidate.derivation !== 'none' ||
    sourceGate.candidate.resolution !== 'direct-reuse' ||
    !sourceGate.directSourceAccepted ||
    sourceEntry.resolution.kind !== 'direct-reuse' ||
    sourceEntry.resolution.status !== 'accepted-source-mapping' ||
    sourceEntry.resolution.variants.length !== 1 ||
    sourceEntry.resolution.variants[0].sourceStem !==
      gate.candidate.sourceStem ||
    sourceEntry.resolution.variants[0].baseFile !== gate.candidate.baseFile ||
    sourceEntry.resolution.variants[0].upperFile !== gate.candidate.upperFile ||
    sourceEntry.resolution.variants[0].transform !== 'none' ||
    sourceEntry.resolution.variants[0].derivation !== 'none' ||
    targetEntry.topologyClass !== 'cross-junction' ||
    JSON.stringify(targetEntry.connectedEdges) !==
      JSON.stringify(['n', 'e', 's', 'w']) ||
    targetEntry.exposedEdges.length !== 0 ||
    JSON.stringify(targetEntry.pockets) !== JSON.stringify(['ne', 'sw']) ||
    JSON.stringify(targetEntry.solidDiagonals) !==
      JSON.stringify(['se', 'nw']) ||
    targetEntry.resolution.kind !== 'approved-derivation' ||
    targetEntry.resolution.status !== 'accepted-source-mapping' ||
    targetEntry.resolution.variants.length !== 1 ||
    targetEntry.resolution.variants[0].sourceStem !==
      gate.candidate.sourceStem ||
    targetEntry.resolution.variants[0].baseFile !==
      gate.candidate.baseFile ||
    targetEntry.resolution.variants[0].upperFile !==
      gate.candidate.upperFile ||
    targetEntry.resolution.variants[0].transform !==
      gate.candidate.transform ||
    targetEntry.resolution.variants[0].derivation !==
      gate.candidate.derivation
  ) {
    throw new Error(
      'Double-filled opposite diagonal cross-junction provenance boundary drift',
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
        `Double-filled opposite diagonal cross-junction control drift at mask_${index}`,
      );
    }
  }

  if (
    JSON.stringify(gate.acceptedLedgerCounts) !==
      JSON.stringify(EQUAL_HEIGHT_MASK_LEDGER.counts) ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['direct-reuse'] !== 27 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['approved-derivation'] !== 19 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['synthetic-assembly'] !== 1 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['unresolved-authored-geometry'] !== 0
  ) {
    throw new Error(
      'Double-filled opposite diagonal cross-junction ledger-count boundary drift',
    );
  }

  if (
    JSON.stringify(gate.comparisonVariants) !== JSON.stringify([
      {
        id: 'raw-whole-cell-mirror-comparison',
        role: 'comparison-control',
        transform: 'mirror-x',
        sourceOmissions: [],
        mirrorPolicy: 'whole-cell-x-no-filter',
      },
      {
        id: 'boundary-seam-filtered-mirror',
        role: 'owner-accepted-derivation',
        transform: 'mirror-x',
        sourceOmissions: [
          'base-boundary-seam',
          'upper-boundary-seam',
        ],
        mirrorPolicy:
          'omit-two-source-boundary-seams-then-whole-cell-mirror-x',
      },
    ]) ||
    gate.renderingDecision.kind !==
      'accepted-boundary-seam-filtered-whole-cell-x-mirror' ||
    gate.renderingDecision.scope !== 'external-proof-source-reuse' ||
    gate.renderingDecision.sourceDirectory !==
      'assets/walls/quota-co-building-system-proofs/double-filled-diagonal-cross-junction' ||
    JSON.stringify(gate.renderingDecision.reusedSourceFiles) !==
      JSON.stringify([
        'open_cross_filled_ne_sw-base.svg',
        'open_cross_filled_ne_sw-upper.svg',
      ]) ||
    gate.renderingDecision.newAuthoredSourceFiles.length !== 0 ||
    gate.renderingDecision.sourceCanvas !== 128 ||
    gate.renderingDecision.mirrorAxisX !== 64 ||
    gate.renderingDecision.mirrorPolicy !==
      'omit-two-source-boundary-seams-then-whole-cell-mirror-x' ||
    gate.renderingDecision.filterProvenance !==
      'mask-40-owner-accepted-boundary-seam-filter' ||
    gate.renderingDecision.sourceRelationship !==
      'accepted-mask-30-source-derived-reuse' ||
    JSON.stringify(gate.renderingDecision.geometryCueMaskIndices) !==
      JSON.stringify([23, 37])
  ) {
    throw new Error(
      'Double-filled opposite diagonal cross-junction source-reuse boundary drift',
    );
  }

  if (
    gate.contract ||
    !gate.sourceMappingAccepted ||
    !gate.derivationAccepted ||
    !gate.xMirrorAllowed ||
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
      'Double-filled opposite diagonal cross-junction crossed the proof-only production boundary',
    );
  }
}

validateEqualHeightDoubleFilledOppositeDiagonalCrossJunctionGate();
