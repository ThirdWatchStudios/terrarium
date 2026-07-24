import { BLOB_CONFIGS, configForIndex } from '../../src/tiles/blob';
import { EQUAL_HEIGHT_MASK_LEDGER } from './equalHeightMaskLedger';
import { EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE } from './equalHeightSingleFilledCrossJunctionGate';

/**
 * Owner-accepted proof-layer gate for mask_37: a four-way hub whose northwest
 * diagonal is solid while northeast, southeast, and southwest remain open.
 */

export type EqualHeightSingleFilledNorthwestCrossJunctionMask = 37;
export type EqualHeightSingleFilledNorthwestCrossJunctionMatrixMask =
  | 1 | 2 | 4 | 5 | 8 | 10 | 16 | 18 | 20 | 26 | 27 | 37;
export type EqualHeightSingleFilledNorthwestCrossJunctionMatrix =
  readonly (
    readonly (
      EqualHeightSingleFilledNorthwestCrossJunctionMatrixMask | null
    )[]
  )[];

export interface EqualHeightSingleFilledNorthwestCrossJunctionCandidate {
  readonly maskIndex: EqualHeightSingleFilledNorthwestCrossJunctionMask;
  readonly sourceMaskIndex: EqualHeightSingleFilledNorthwestCrossJunctionMask;
  readonly sourceStem: 'open_cross_filled_nw';
  readonly baseFile: 'open_cross_filled_nw-base.svg';
  readonly upperFile: 'open_cross_filled_nw-upper.svg';
  readonly connectedEdges: readonly ['n', 'e', 's', 'w'];
  readonly openPockets: readonly ['ne', 'se', 'sw'];
  readonly solidDiagonals: readonly ['nw'];
  readonly fixedLightRole: 'northwest-filled-four-way-hub-east-register';
  readonly transform: 'none';
  readonly derivation: 'none';
  readonly resolution: 'direct-reuse';
}

const COMPACT_MATRIX = [
  [20, 26, null],
  [16, 37, 8],
  [null, 1, null],
] as const satisfies EqualHeightSingleFilledNorthwestCrossJunctionMatrix;

const THREE_CELL_ARM_MATRIX = [
  [null, null, null, 4, null, null, null],
  [null, null, null, 5, null, null, null],
  [null, null, 20, 27, null, null, null],
  [2, 10, 18, 37, 10, 10, 8],
  [null, null, null, 5, null, null, null],
  [null, null, null, 5, null, null, null],
  [null, null, null, 1, null, null, null],
] as const satisfies EqualHeightSingleFilledNorthwestCrossJunctionMatrix;

const SIX_CELL_ARM_MATRIX = [
  [null, null, null, null, null, null, 4, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, 20, 27, null, null, null, null, null, null],
  [2, 10, 10, 10, 10, 18, 37, 10, 10, 10, 10, 10, 8],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 1, null, null, null, null, null, null],
] as const satisfies EqualHeightSingleFilledNorthwestCrossJunctionMatrix;

export const EQUAL_HEIGHT_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_GATE = {
  stem: 'equal-height-single-filled-northwest-cross-junction-gate',
  version: 0,
  status: 'owner-accepted-single-filled-northwest-cross-junction-gate',
  contract: false,
  topologyClass: 'single-filled-northwest-cross-junction',
  candidate: {
    maskIndex: 37,
    sourceMaskIndex: 37,
    sourceStem: 'open_cross_filled_nw',
    baseFile: 'open_cross_filled_nw-base.svg',
    upperFile: 'open_cross_filled_nw-upper.svg',
    connectedEdges: ['n', 'e', 's', 'w'],
    openPockets: ['ne', 'se', 'sw'],
    solidDiagonals: ['nw'],
    fixedLightRole: 'northwest-filled-four-way-hub-east-register',
    transform: 'none',
    derivation: 'none',
    resolution: 'direct-reuse',
  } as const satisfies EqualHeightSingleFilledNorthwestCrossJunctionCandidate,
  compactMatrix: COMPACT_MATRIX,
  threeCellArmMatrix: THREE_CELL_ARM_MATRIX,
  sixCellArmMatrix: SIX_CELL_ARM_MATRIX,
  baselineMaskRows: [15, 18, 19, 27] as const,
  installedNeighborMaskRows: [
    1, 2, 4, 5, 8, 10, 16, 18, 20, 26, 27,
  ] as const,
  maskRowsUnderReview: [] as const,
  maskRowsAccepted: [37] as const,
  reviewCellSizes: [240, 90, 40] as const,
  reviewArmLengths: [1, 3, 6] as const,
  verticalRegister: {
    facing: 'east-fixed',
    ordinaryNeighborMaskRows: [1, 4, 5] as const,
    fixedSourceMaskRows: [27, 37] as const,
    ordinaryNeighborTransform: 'mirror-x',
    mixedFacingAllowed: false,
    westFacingControlMaskIndex: 19,
  },
  renderingDecision: {
    kind: 'one-accepted-authored-single-filled-northwest-four-way-hub',
    scope: 'external-proof-source-bank',
    sourceDirectory:
      'assets/walls/quota-co-building-system-proofs/single-filled-northwest-cross-junction',
    authoredSourceFiles: [
      'open_cross_filled_nw-base.svg',
      'open_cross_filled_nw-upper.svg',
    ] as const,
    sourceCanvas: 128,
    sourceAuthorship: 'flattened-fixed-view-no-transform',
    geometryCueMaskIndex: 19,
    sourceRelationship: 'authored-cues-only-no-derived-provenance',
    purpose:
      'provide the accepted direct east-register source for the northwest-filled four-way hub while the northeast, southeast, and southwest floor crooks remain open',
    requiredRead:
      'one molded four-socket connector with one continuous northwest cream mass, never a mirror, rotation, patch, stacked T, peak, post, or duplicate belt',
    shadePolicy:
      'preserve the east-register fixed-light sockets and the continuous south-facing depth treatment; family-wide shadow cleanup remains deferred polish',
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

function validateArmMatrix(
  label: string,
  matrix: EqualHeightSingleFilledNorthwestCrossJunctionMatrix,
  armLength: 1 | 3 | 6,
): void {
  const size = armLength * 2 + 1;
  const center = armLength;
  if (matrix.length !== size || matrix.some((row) => row.length !== size)) {
    throw new Error(
      `Single-filled northwest cross-junction ${label} matrix must be ${size}x${size}`,
    );
  }
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      let expected:
        EqualHeightSingleFilledNorthwestCrossJunctionMatrixMask | null = null;
      if (row === center && column === center) {
        expected = 37;
      } else if (row === center - 1 && column === center - 1) {
        expected = 20;
      } else if (column === center) {
        if (row === center - 1) expected = armLength === 1 ? 26 : 27;
        else if (row === 0) expected = 4;
        else if (row === size - 1) expected = 1;
        else expected = 5;
      } else if (row === center) {
        if (column === center - 1) expected = armLength === 1 ? 16 : 18;
        else if (column === 0) expected = 2;
        else if (column === size - 1) expected = 8;
        else expected = 10;
      }
      if (matrix[row][column] !== expected) {
        throw new Error(
          `Single-filled northwest cross-junction ${label} matrix drift at ${column},${row}`,
        );
      }
    }
  }
}

/** Fail loudly if the accepted mask_37 proof-layer source mapping drifts. */
export function validateEqualHeightSingleFilledNorthwestCrossJunctionGate(
  gate = EQUAL_HEIGHT_SINGLE_FILLED_NORTHWEST_CROSS_JUNCTION_GATE,
): void {
  if (
    gate.stem !==
      'equal-height-single-filled-northwest-cross-junction-gate' ||
    gate.status !==
      'owner-accepted-single-filled-northwest-cross-junction-gate' ||
    gate.topologyClass !== 'single-filled-northwest-cross-junction' ||
    gate.candidate.maskIndex !== 37 ||
    gate.candidate.sourceMaskIndex !== 37 ||
    gate.candidate.sourceStem !== 'open_cross_filled_nw' ||
    gate.candidate.baseFile !== 'open_cross_filled_nw-base.svg' ||
    gate.candidate.upperFile !== 'open_cross_filled_nw-upper.svg' ||
    JSON.stringify(gate.candidate.connectedEdges) !==
      JSON.stringify(['n', 'e', 's', 'w']) ||
    JSON.stringify(gate.candidate.openPockets) !==
      JSON.stringify(['ne', 'se', 'sw']) ||
    JSON.stringify(gate.candidate.solidDiagonals) !==
      JSON.stringify(['nw']) ||
    gate.candidate.fixedLightRole !==
      'northwest-filled-four-way-hub-east-register' ||
    gate.candidate.transform !== 'none' ||
    gate.candidate.derivation !== 'none' ||
    gate.candidate.resolution !== 'direct-reuse' ||
    JSON.stringify(gate.baselineMaskRows) !==
      JSON.stringify([15, 18, 19, 27]) ||
    JSON.stringify(gate.installedNeighborMaskRows) !==
      JSON.stringify([1, 2, 4, 5, 8, 10, 16, 18, 20, 26, 27]) ||
    gate.maskRowsUnderReview.length !== 0 ||
    JSON.stringify(gate.maskRowsAccepted) !== JSON.stringify([37]) ||
    JSON.stringify(gate.reviewCellSizes) !==
      JSON.stringify([240, 90, 40]) ||
    JSON.stringify(gate.reviewArmLengths) !== JSON.stringify([1, 3, 6]) ||
    gate.verticalRegister.facing !== 'east-fixed' ||
    JSON.stringify(gate.verticalRegister.ordinaryNeighborMaskRows) !==
      JSON.stringify([1, 4, 5]) ||
    JSON.stringify(gate.verticalRegister.fixedSourceMaskRows) !==
      JSON.stringify([27, 37]) ||
    gate.verticalRegister.ordinaryNeighborTransform !== 'mirror-x' ||
    gate.verticalRegister.mixedFacingAllowed ||
    gate.verticalRegister.westFacingControlMaskIndex !== 19
  ) {
    throw new Error(
      'Single-filled northwest cross-junction gate identity drift',
    );
  }

  validateArmMatrix('compact', gate.compactMatrix, 1);
  validateArmMatrix('three-cell-arm', gate.threeCellArmMatrix, 3);
  validateArmMatrix('six-cell-arm', gate.sixCellArmMatrix, 6);

  const config = configForIndex(37);
  const ledgerEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[37];
  const westFacingControl = EQUAL_HEIGHT_SINGLE_FILLED_CROSS_JUNCTION_GATE;
  if (
    BLOB_CONFIGS[37] !== 0x8f ||
    JSON.stringify(config) !== JSON.stringify({
      n: true,
      e: true,
      s: true,
      w: true,
      ne: 'concave',
      se: 'concave',
      sw: 'concave',
      nw: 'solid',
    }) ||
    ledgerEntry.topologyClass !== 'cross-junction' ||
    JSON.stringify(ledgerEntry.connectedEdges) !==
      JSON.stringify(['n', 'e', 's', 'w']) ||
    ledgerEntry.exposedEdges.length !== 0 ||
    JSON.stringify(ledgerEntry.pockets) !==
      JSON.stringify(['ne', 'se', 'sw']) ||
    JSON.stringify(ledgerEntry.solidDiagonals) !== JSON.stringify(['nw']) ||
    ledgerEntry.resolution.kind !== 'direct-reuse' ||
    ledgerEntry.resolution.status !== 'accepted-source-mapping' ||
    ledgerEntry.resolution.variants.length !== 1 ||
    ledgerEntry.resolution.variants[0].sourceStem !==
      gate.candidate.sourceStem ||
    ledgerEntry.resolution.variants[0].baseFile !== gate.candidate.baseFile ||
    ledgerEntry.resolution.variants[0].upperFile !==
      gate.candidate.upperFile ||
    ledgerEntry.resolution.variants[0].transform !== gate.candidate.transform ||
    ledgerEntry.resolution.variants[0].derivation !==
      gate.candidate.derivation ||
    westFacingControl.candidate.maskIndex !== 19 ||
    westFacingControl.candidate.sourceStem !== 'open_cross_filled_ne' ||
    westFacingControl.candidate.baseFile !== 'open_cross_filled_ne-base.svg' ||
    westFacingControl.candidate.upperFile !==
      'open_cross_filled_ne-upper.svg' ||
    westFacingControl.xMirrorAllowed ||
    westFacingControl.yMirrorAllowed ||
    westFacingControl.rotationAllowed
  ) {
    throw new Error(
      'Single-filled northwest cross-junction source-provenance boundary drift',
    );
  }

  for (const index of gate.installedNeighborMaskRows) {
    const resolution = EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution;
    if (
      (resolution.kind !== 'direct-reuse' &&
        resolution.kind !== 'approved-derivation') ||
      resolution.status !== 'accepted-source-mapping'
    ) {
      throw new Error(
        `Single-filled northwest cross-junction installed-neighbor drift at mask_${index}`,
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
      'Single-filled northwest cross-junction ledger-count boundary drift',
    );
  }

  if (
    gate.renderingDecision.kind !==
      'one-accepted-authored-single-filled-northwest-four-way-hub' ||
    gate.renderingDecision.scope !== 'external-proof-source-bank' ||
    gate.renderingDecision.sourceDirectory !==
      'assets/walls/quota-co-building-system-proofs/single-filled-northwest-cross-junction' ||
    JSON.stringify(gate.renderingDecision.authoredSourceFiles) !==
      JSON.stringify([
        'open_cross_filled_nw-base.svg',
        'open_cross_filled_nw-upper.svg',
      ]) ||
    gate.renderingDecision.sourceCanvas !== 128 ||
    gate.renderingDecision.sourceAuthorship !==
      'flattened-fixed-view-no-transform' ||
    gate.renderingDecision.geometryCueMaskIndex !== 19 ||
    gate.renderingDecision.sourceRelationship !==
      'authored-cues-only-no-derived-provenance'
  ) {
    throw new Error(
      'Single-filled northwest cross-junction evidence boundary drift',
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
      'Single-filled northwest cross-junction crossed the proof-only boundary',
    );
  }
}

validateEqualHeightSingleFilledNorthwestCrossJunctionGate();
