import {
  BLOB_CONFIGS,
  NB,
  blobIndex,
  configForIndex,
} from '../../src/tiles/blob';
import {
  EQUAL_HEIGHT_SINGLE_OPEN_SOUTHWEST_CROSS_JUNCTION_GATE,
  validateEqualHeightSingleOpenSouthwestCrossJunctionGate,
} from './equalHeightSingleOpenSouthwestCrossJunctionGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from './equalHeightMaskLedger';

/**
 * Owner-accepted proof-layer gate for mask_44, the plain whole-cell X mirror
 * of mask_41. It does not register a production/export source.
 */

export type EqualHeightSingleOpenSoutheastCrossJunctionMask = 44;
export type EqualHeightSingleOpenSoutheastCrossJunctionMatrixMask =
  | 1 | 2 | 4 | 5 | 8 | 10 | 16 | 20 | 24 | 25 | 26
  | 31 | 32 | 34 | 35 | 36 | 44;
export type EqualHeightSingleOpenSoutheastCrossJunctionMatrix =
  readonly (
    readonly (
      EqualHeightSingleOpenSoutheastCrossJunctionMatrixMask | null
    )[]
  )[];

export interface EqualHeightSingleOpenSoutheastCrossJunctionCandidate {
  readonly maskIndex: EqualHeightSingleOpenSoutheastCrossJunctionMask;
  readonly sourceMaskIndex: 41;
  readonly sourceStem: 'open_cross_filled_ne_se_nw';
  readonly baseFile: 'open_cross_filled_ne_se_nw-base.svg';
  readonly upperFile: 'open_cross_filled_ne_se_nw-upper.svg';
  readonly connectedEdges: readonly ['n', 'e', 's', 'w'];
  readonly openPockets: readonly ['se'];
  readonly solidDiagonals: readonly ['nw', 'ne', 'sw'];
  readonly fixedLightRole: 'single-open-southeast-four-way-hub';
  readonly transform: 'mirror-x';
  readonly derivation: 'none';
  readonly resolution: 'approved-derivation';
}

const COMPACT_MATRIX = [
  [20, 31, 26],
  [24, 44, 34],
  [16, 34, null],
] as const satisfies EqualHeightSingleOpenSoutheastCrossJunctionMatrix;

const THREE_CELL_ARM_MATRIX = [
  [null, null, null, 4, null, null, null],
  [null, null, null, 5, null, null, null],
  [null, null, 20, 32, 26, null, null],
  [2, 10, 25, 44, 35, 10, 8],
  [null, null, 16, 36, null, null, null],
  [null, null, null, 5, null, null, null],
  [null, null, null, 1, null, null, null],
] as const satisfies EqualHeightSingleOpenSoutheastCrossJunctionMatrix;

const SIX_CELL_ARM_MATRIX = [
  [null, null, null, null, null, null, 4, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, 20, 32, 26, null, null, null, null, null],
  [2, 10, 10, 10, 10, 25, 44, 35, 10, 10, 10, 10, 8],
  [null, null, null, null, null, 16, 36, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 1, null, null, null, null, null, null],
] as const satisfies EqualHeightSingleOpenSoutheastCrossJunctionMatrix;

export const EQUAL_HEIGHT_SINGLE_OPEN_SOUTHEAST_CROSS_JUNCTION_GATE = {
  stem: 'equal-height-single-open-southeast-cross-junction-gate',
  version: 0,
  status: 'owner-accepted-single-open-southeast-cross-junction-gate',
  contract: false,
  topologyClass: 'single-open-southeast-cross-junction',
  candidate: {
    maskIndex: 44,
    sourceMaskIndex: 41,
    sourceStem: 'open_cross_filled_ne_se_nw',
    baseFile: 'open_cross_filled_ne_se_nw-base.svg',
    upperFile: 'open_cross_filled_ne_se_nw-upper.svg',
    connectedEdges: ['n', 'e', 's', 'w'],
    openPockets: ['se'],
    solidDiagonals: ['nw', 'ne', 'sw'],
    fixedLightRole: 'single-open-southeast-four-way-hub',
    transform: 'mirror-x',
    derivation: 'none',
    resolution: 'approved-derivation',
  } as const satisfies EqualHeightSingleOpenSoutheastCrossJunctionCandidate,
  compactMatrix: COMPACT_MATRIX,
  threeCellArmMatrix: THREE_CELL_ARM_MATRIX,
  sixCellArmMatrix: SIX_CELL_ARM_MATRIX,
  sourceMaskRows: [41] as const,
  installedNeighborMaskRows: [
    1, 2, 4, 5, 8, 10, 16, 20, 24, 25, 26, 31, 32, 34, 35, 36,
  ] as const,
  maskRowsUnderReview: [] as const,
  maskRowsAccepted: [44] as const,
  reviewCellSizes: [240, 90, 40] as const,
  reviewArmLengths: [1, 3, 6] as const,
  reviewGrounds: ['light', 'dark'] as const,
  renderingDecision: {
    kind: 'accepted-plain-whole-cell-x-mirror',
    scope: 'external-proof-source-reuse',
    sourceGate:
      'equal-height-single-open-southwest-cross-junction-gate',
    sourceGateStatus:
      'owner-accepted-single-open-southwest-cross-junction-gate',
    sourceDirectory:
      'assets/walls/quota-co-building-system-proofs/single-open-southwest-cross-junction',
    reusedSourceFiles: [
      'open_cross_filled_ne_se_nw-base.svg',
      'open_cross_filled_ne_se_nw-upper.svg',
    ] as const,
    newAuthoredSourceFiles: [] as const,
    sourceCanvas: 128,
    mirrorAxisX: 64,
    mirrorPolicy: 'whole-cell-x-no-filter',
    seamFilter: 'none',
    lightingDisposition:
      'accepted plain mirror preserves the source Y-based fixed-light hierarchy',
    sourceRelationship:
      'read-only-x-mirror-of-owner-accepted-mask-41-proof-source',
    requiredRead:
      'one molded three-solid hub with an uninterrupted cream mass and a visibly open southeast floor crook',
    forbiddenRead:
      'central post, peak, hourglass, stair-step, doubled outline, duplicate color belts, or stacked pieces',
  },
  acceptedLedgerCounts: {
    'direct-reuse': 26,
    'approved-derivation': 18,
    'synthetic-assembly': 3,
    'unresolved-authored-geometry': 0,
  },
  sourceGateAccepted: true,
  candidateAccepted: true,
  ledgerPromotion: true,
  xMirrorAllowed: true,
  filteredXMirrorApplied: false,
  yMirrorAllowed: false,
  rotationAllowed: false,
  proofSourceMutation: false,
  productionArtMutation: false,
  productionRegistration: false,
  productionTopologyMutation: false,
  atlasMutation: false,
  blobMappingMutation: false,
  schemaChange: false,
  unityRegistration: false,
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
): EqualHeightSingleOpenSoutheastCrossJunctionMatrix {
  const size = armLength * 2 + 1;
  const center = armLength;
  const occupied = (column: number, row: number): boolean =>
    (column === center && row >= 0 && row < size) ||
    (row === center && column >= 0 && column < size) ||
    (row === center - 1 &&
      (column === center - 1 || column === center + 1)) ||
    (row === center + 1 && column === center - 1);
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) => {
      if (!occupied(column, row)) return null;
      let raw = 0;
      for (const [bit, dx, dy] of NEIGHBORS) {
        if (occupied(column + dx, row + dy)) raw |= bit;
      }
      return blobIndex(raw) as
        EqualHeightSingleOpenSoutheastCrossJunctionMatrixMask;
    }),
  );
}

function validateArmMatrix(
  label: string,
  matrix: EqualHeightSingleOpenSoutheastCrossJunctionMatrix,
  armLength: 1 | 3 | 6,
): void {
  const size = armLength * 2 + 1;
  if (matrix.length !== size || matrix.some((row) => row.length !== size)) {
    throw new Error(
      `Single-open southeast cross-junction ${label} matrix must be ${size}x${size}`,
    );
  }
  if (JSON.stringify(matrix) !== JSON.stringify(expectedMatrix(armLength))) {
    throw new Error(
      `Single-open southeast cross-junction ${label} matrix drift`,
    );
  }
}

/** Fail loudly if the accepted mask_44 proof-layer gate drifts. */
export function validateEqualHeightSingleOpenSoutheastCrossJunctionGate(
  gate = EQUAL_HEIGHT_SINGLE_OPEN_SOUTHEAST_CROSS_JUNCTION_GATE,
): void {
  validateEqualHeightSingleOpenSouthwestCrossJunctionGate();

  if (
    gate.stem !==
      'equal-height-single-open-southeast-cross-junction-gate' ||
    gate.status !==
      'owner-accepted-single-open-southeast-cross-junction-gate' ||
    gate.topologyClass !== 'single-open-southeast-cross-junction' ||
    gate.candidate.maskIndex !== 44 ||
    gate.candidate.sourceMaskIndex !== 41 ||
    gate.candidate.sourceStem !== 'open_cross_filled_ne_se_nw' ||
    gate.candidate.baseFile !== 'open_cross_filled_ne_se_nw-base.svg' ||
    gate.candidate.upperFile !== 'open_cross_filled_ne_se_nw-upper.svg' ||
    JSON.stringify(gate.candidate.connectedEdges) !==
      JSON.stringify(['n', 'e', 's', 'w']) ||
    JSON.stringify(gate.candidate.openPockets) !== JSON.stringify(['se']) ||
    JSON.stringify(gate.candidate.solidDiagonals) !==
      JSON.stringify(['nw', 'ne', 'sw']) ||
    gate.candidate.fixedLightRole !==
      'single-open-southeast-four-way-hub' ||
    gate.candidate.transform !== 'mirror-x' ||
    gate.candidate.derivation !== 'none' ||
    gate.candidate.resolution !== 'approved-derivation' ||
    JSON.stringify(gate.sourceMaskRows) !== JSON.stringify([41]) ||
    JSON.stringify(gate.installedNeighborMaskRows) !== JSON.stringify([
      1, 2, 4, 5, 8, 10, 16, 20, 24, 25, 26, 31, 32, 34, 35, 36,
    ]) ||
    gate.maskRowsUnderReview.length !== 0 ||
    JSON.stringify(gate.maskRowsAccepted) !== JSON.stringify([44]) ||
    JSON.stringify(gate.reviewCellSizes) !==
      JSON.stringify([240, 90, 40]) ||
    JSON.stringify(gate.reviewArmLengths) !== JSON.stringify([1, 3, 6]) ||
    JSON.stringify(gate.reviewGrounds) !== JSON.stringify(['light', 'dark'])
  ) {
    throw new Error(
      'Single-open southeast cross-junction gate identity drift',
    );
  }

  validateArmMatrix('compact', gate.compactMatrix, 1);
  validateArmMatrix('three-cell-arm', gate.threeCellArmMatrix, 3);
  validateArmMatrix('six-cell-arm', gate.sixCellArmMatrix, 6);

  const sourceGate =
    EQUAL_HEIGHT_SINGLE_OPEN_SOUTHWEST_CROSS_JUNCTION_GATE;
  const sourceEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[41];
  if (
    !gate.sourceGateAccepted ||
    sourceGate.candidate.maskIndex !== 41 ||
    sourceGate.candidate.sourceMaskIndex !== 41 ||
    sourceGate.candidate.transform !== 'none' ||
    sourceGate.candidate.resolution !== 'direct-reuse' ||
    !sourceGate.directSourceAccepted ||
    sourceEntry.resolution.kind !== 'direct-reuse' ||
    sourceEntry.resolution.status !== 'accepted-source-mapping' ||
    sourceEntry.resolution.variants.length !== 1 ||
    sourceEntry.resolution.variants[0].sourceStem !==
      gate.candidate.sourceStem ||
    sourceEntry.resolution.variants[0].baseFile !==
      gate.candidate.baseFile ||
    sourceEntry.resolution.variants[0].upperFile !==
      gate.candidate.upperFile ||
    sourceEntry.resolution.variants[0].transform !== 'none' ||
    sourceEntry.resolution.variants[0].derivation !== 'none'
  ) {
    throw new Error(
      'Single-open southeast cross-junction accepted-source provenance drift',
    );
  }

  const targetEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[44];
  if (
    BLOB_CONFIGS[44] !== 0xdf ||
    JSON.stringify(configForIndex(44)) !== JSON.stringify({
      n: true,
      e: true,
      s: true,
      w: true,
      ne: 'solid',
      se: 'concave',
      sw: 'solid',
      nw: 'solid',
    }) ||
    targetEntry.topologyClass !== 'cross-junction' ||
    JSON.stringify(targetEntry.connectedEdges) !==
      JSON.stringify(['n', 'e', 's', 'w']) ||
    targetEntry.exposedEdges.length !== 0 ||
    JSON.stringify(targetEntry.pockets) !== JSON.stringify(['se']) ||
    JSON.stringify(targetEntry.solidDiagonals) !==
      JSON.stringify(['ne', 'sw', 'nw']) ||
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
      'Single-open southeast cross-junction accepted-ledger boundary drift',
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
        `Single-open southeast cross-junction accepted-neighbor drift at mask_${index}`,
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
      'Single-open southeast cross-junction ledger-count boundary drift',
    );
  }

  if (
    gate.renderingDecision.kind !==
      'accepted-plain-whole-cell-x-mirror' ||
    gate.renderingDecision.scope !==
      'external-proof-source-reuse' ||
    gate.renderingDecision.sourceGate !== sourceGate.stem ||
    gate.renderingDecision.sourceGateStatus !== sourceGate.status ||
    gate.renderingDecision.sourceDirectory !==
      sourceGate.renderingDecision.sourceDirectory ||
    JSON.stringify(gate.renderingDecision.reusedSourceFiles) !== JSON.stringify(
      sourceGate.renderingDecision.authoredSourceFiles,
    ) ||
    gate.renderingDecision.newAuthoredSourceFiles.length !== 0 ||
    gate.renderingDecision.sourceCanvas !== 128 ||
    gate.renderingDecision.mirrorAxisX !== 64 ||
    gate.renderingDecision.mirrorPolicy !== 'whole-cell-x-no-filter' ||
    gate.renderingDecision.seamFilter !== 'none' ||
    gate.renderingDecision.sourceRelationship !==
      'read-only-x-mirror-of-owner-accepted-mask-41-proof-source'
  ) {
    throw new Error(
      'Single-open southeast cross-junction accepted rendering drift',
    );
  }

  if (
    gate.contract ||
    !gate.candidateAccepted ||
    !gate.ledgerPromotion ||
    !gate.xMirrorAllowed ||
    gate.filteredXMirrorApplied ||
    gate.yMirrorAllowed ||
    gate.rotationAllowed ||
    gate.proofSourceMutation ||
    gate.productionArtMutation ||
    gate.productionRegistration ||
    gate.productionTopologyMutation ||
    gate.atlasMutation ||
    gate.blobMappingMutation ||
    gate.schemaChange ||
    gate.unityRegistration ||
    gate.exportable ||
    gate.committedAtlas ||
    !gate.temporaryFrameIds
  ) {
    throw new Error(
      'Single-open southeast cross-junction gate crossed the proof-only production boundary',
    );
  }
}

validateEqualHeightSingleOpenSoutheastCrossJunctionGate();
