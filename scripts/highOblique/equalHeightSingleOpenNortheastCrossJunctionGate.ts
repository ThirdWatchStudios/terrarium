import {
  BLOB_CONFIGS,
  NB,
  blobIndex,
  configForIndex,
} from '../../src/tiles/blob';
import {
  EQUAL_HEIGHT_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_GATE,
  validateEqualHeightSingleOpenNorthwestCrossJunctionGate,
} from './equalHeightSingleOpenNorthwestCrossJunctionGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from './equalHeightMaskLedger';

/**
 * Owner-accepted proof-layer gate for mask_45, the plain whole-cell X mirror
 * of mask_33. It does not register a production/export source.
 */

export type EqualHeightSingleOpenNortheastCrossJunctionMask = 45;
export type EqualHeightSingleOpenNortheastCrossJunctionMatrixMask =
  | 1 | 2 | 4 | 5 | 8 | 10 | 16 | 20 | 24 | 25 | 26
  | 27 | 28 | 34 | 38 | 39 | 45;
export type EqualHeightSingleOpenNortheastCrossJunctionMatrix =
  readonly (
    readonly (
      EqualHeightSingleOpenNortheastCrossJunctionMatrixMask | null
    )[]
  )[];

export interface EqualHeightSingleOpenNortheastCrossJunctionCandidate {
  readonly maskIndex: EqualHeightSingleOpenNortheastCrossJunctionMask;
  readonly sourceMaskIndex: 33;
  readonly sourceStem: 'open_cross_filled_ne_se_sw';
  readonly baseFile: 'open_cross_filled_ne_se_sw-base.svg';
  readonly upperFile: 'open_cross_filled_ne_se_sw-upper.svg';
  readonly connectedEdges: readonly ['n', 'e', 's', 'w'];
  readonly openPockets: readonly ['ne'];
  readonly solidDiagonals: readonly ['se', 'sw', 'nw'];
  readonly fixedLightRole: 'single-open-northeast-four-way-hub';
  readonly transform: 'mirror-x';
  readonly derivation: 'none';
  readonly resolution: 'approved-derivation';
}

const COMPACT_MATRIX = [
  [20, 26, null],
  [24, 45, 26],
  [16, 38, 34],
] as const satisfies EqualHeightSingleOpenNortheastCrossJunctionMatrix;

const THREE_CELL_ARM_MATRIX = [
  [null, null, null, 4, null, null, null],
  [null, null, null, 5, null, null, null],
  [null, null, 20, 27, null, null, null],
  [2, 10, 25, 45, 28, 10, 8],
  [null, null, 16, 39, 34, null, null],
  [null, null, null, 5, null, null, null],
  [null, null, null, 1, null, null, null],
] as const satisfies EqualHeightSingleOpenNortheastCrossJunctionMatrix;

const SIX_CELL_ARM_MATRIX = [
  [null, null, null, null, null, null, 4, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, 20, 27, null, null, null, null, null, null],
  [2, 10, 10, 10, 10, 25, 45, 28, 10, 10, 10, 10, 8],
  [null, null, null, null, null, 16, 39, 34, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 1, null, null, null, null, null, null],
] as const satisfies EqualHeightSingleOpenNortheastCrossJunctionMatrix;

export const EQUAL_HEIGHT_SINGLE_OPEN_NORTHEAST_CROSS_JUNCTION_GATE = {
  stem: 'equal-height-single-open-northeast-cross-junction-gate',
  version: 0,
  status: 'owner-accepted-single-open-northeast-cross-junction-gate',
  contract: false,
  topologyClass: 'single-open-northeast-cross-junction',
  candidate: {
    maskIndex: 45,
    sourceMaskIndex: 33,
    sourceStem: 'open_cross_filled_ne_se_sw',
    baseFile: 'open_cross_filled_ne_se_sw-base.svg',
    upperFile: 'open_cross_filled_ne_se_sw-upper.svg',
    connectedEdges: ['n', 'e', 's', 'w'],
    openPockets: ['ne'],
    solidDiagonals: ['se', 'sw', 'nw'],
    fixedLightRole: 'single-open-northeast-four-way-hub',
    transform: 'mirror-x',
    derivation: 'none',
    resolution: 'approved-derivation',
  } as const satisfies EqualHeightSingleOpenNortheastCrossJunctionCandidate,
  compactMatrix: COMPACT_MATRIX,
  threeCellArmMatrix: THREE_CELL_ARM_MATRIX,
  sixCellArmMatrix: SIX_CELL_ARM_MATRIX,
  sourceMaskRows: [33] as const,
  controlMaskRows: [43, 32, 40] as const,
  installedNeighborMaskRows: [
    1, 2, 4, 5, 8, 10, 16, 20, 24, 25, 26, 27, 28, 34, 38, 39,
  ] as const,
  maskRowsUnderReview: [] as const,
  maskRowsAccepted: [45] as const,
  reviewCellSizes: [240, 90, 40] as const,
  reviewArmLengths: [1, 3, 6] as const,
  reviewGrounds: ['light', 'dark'] as const,
  renderingDecision: {
    kind: 'accepted-plain-whole-cell-x-mirror',
    scope: 'external-proof-source-reuse',
    sourceGate:
      'equal-height-single-open-northwest-cross-junction-gate',
    sourceGateStatus:
      'owner-accepted-single-open-northwest-cross-junction-gate',
    sourceDirectory:
      'assets/walls/quota-co-building-system-proofs/single-open-northwest-cross-junction',
    reusedSourceFiles: [
      'open_cross_filled_ne_se_sw-base.svg',
      'open_cross_filled_ne_se_sw-upper.svg',
    ] as const,
    newAuthoredSourceFiles: [] as const,
    sourceOmissions: [] as const,
    sourceCanvas: 128,
    mirrorAxisX: 64,
    mirrorPolicy: 'whole-cell-x-no-filter',
    seamFilter: 'none',
    lightingDisposition:
      'accepted plain mirror preserves the source Y-based fixed-light hierarchy',
    sourceRelationship:
      'read-only-x-mirror-of-owner-accepted-mask-33-proof-source',
    geometryControlMaskIndices: [43, 32] as const,
    northeastReturnControlMaskIndex: 40,
    controlPolicy:
      'accepted masks 43 and 32 constrain the west and south slab geometry while mask 40 constrains only the exposed northeast reveal and arris; none is stacked source provenance',
    requiredRead:
      'one molded three-solid hub with an uninterrupted cream mass and a visibly open northeast floor crook',
    forbiddenRead:
      'central post, peak, hourglass, stair-step, doubled outline, duplicate color belts, or stacked pieces',
  },
  acceptedLedgerCounts: {
    'direct-reuse': 28,
    'approved-derivation': 19,
    'synthetic-assembly': 0,
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
): EqualHeightSingleOpenNortheastCrossJunctionMatrix {
  const size = armLength * 2 + 1;
  const center = armLength;
  const occupied = (column: number, row: number): boolean =>
    (column === center && row >= 0 && row < size) ||
    (row === center && column >= 0 && column < size) ||
    (row === center - 1 && column === center - 1) ||
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
        EqualHeightSingleOpenNortheastCrossJunctionMatrixMask;
    }),
  );
}

function validateArmMatrix(
  label: string,
  matrix: EqualHeightSingleOpenNortheastCrossJunctionMatrix,
  armLength: 1 | 3 | 6,
): void {
  const size = armLength * 2 + 1;
  if (matrix.length !== size || matrix.some((row) => row.length !== size)) {
    throw new Error(
      `Single-open northeast cross-junction ${label} matrix must be ${size}x${size}`,
    );
  }
  if (JSON.stringify(matrix) !== JSON.stringify(expectedMatrix(armLength))) {
    throw new Error(
      `Single-open northeast cross-junction ${label} matrix drift`,
    );
  }
}

/** Fail loudly if the accepted mask_45 proof-layer gate drifts. */
export function validateEqualHeightSingleOpenNortheastCrossJunctionGate(
  gate = EQUAL_HEIGHT_SINGLE_OPEN_NORTHEAST_CROSS_JUNCTION_GATE,
): void {
  validateEqualHeightSingleOpenNorthwestCrossJunctionGate();

  if (
    gate.stem !==
      'equal-height-single-open-northeast-cross-junction-gate' ||
    gate.status !==
      'owner-accepted-single-open-northeast-cross-junction-gate' ||
    gate.topologyClass !== 'single-open-northeast-cross-junction' ||
    gate.candidate.maskIndex !== 45 ||
    gate.candidate.sourceMaskIndex !== 33 ||
    gate.candidate.sourceStem !== 'open_cross_filled_ne_se_sw' ||
    gate.candidate.baseFile !== 'open_cross_filled_ne_se_sw-base.svg' ||
    gate.candidate.upperFile !== 'open_cross_filled_ne_se_sw-upper.svg' ||
    JSON.stringify(gate.candidate.connectedEdges) !==
      JSON.stringify(['n', 'e', 's', 'w']) ||
    JSON.stringify(gate.candidate.openPockets) !== JSON.stringify(['ne']) ||
    JSON.stringify(gate.candidate.solidDiagonals) !==
      JSON.stringify(['se', 'sw', 'nw']) ||
    gate.candidate.fixedLightRole !==
      'single-open-northeast-four-way-hub' ||
    gate.candidate.transform !== 'mirror-x' ||
    gate.candidate.derivation !== 'none' ||
    gate.candidate.resolution !== 'approved-derivation' ||
    JSON.stringify(gate.sourceMaskRows) !== JSON.stringify([33]) ||
    JSON.stringify(gate.controlMaskRows) !== JSON.stringify([43, 32, 40]) ||
    JSON.stringify(gate.installedNeighborMaskRows) !== JSON.stringify([
      1, 2, 4, 5, 8, 10, 16, 20, 24, 25, 26, 27, 28, 34, 38, 39,
    ]) ||
    gate.maskRowsUnderReview.length !== 0 ||
    JSON.stringify(gate.maskRowsAccepted) !== JSON.stringify([45]) ||
    JSON.stringify(gate.reviewCellSizes) !==
      JSON.stringify([240, 90, 40]) ||
    JSON.stringify(gate.reviewArmLengths) !== JSON.stringify([1, 3, 6]) ||
    JSON.stringify(gate.reviewGrounds) !== JSON.stringify(['light', 'dark'])
  ) {
    throw new Error(
      'Single-open northeast cross-junction gate identity drift',
    );
  }

  validateArmMatrix('compact', gate.compactMatrix, 1);
  validateArmMatrix('three-cell-arm', gate.threeCellArmMatrix, 3);
  validateArmMatrix('six-cell-arm', gate.sixCellArmMatrix, 6);

  const sourceGate =
    EQUAL_HEIGHT_SINGLE_OPEN_NORTHWEST_CROSS_JUNCTION_GATE;
  const sourceEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[33];
  if (
    !gate.sourceGateAccepted ||
    sourceGate.candidate.maskIndex !== 33 ||
    sourceGate.candidate.sourceMaskIndex !== 33 ||
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
      'Single-open northeast cross-junction accepted-source provenance drift',
    );
  }

  const targetEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[45];
  if (
    BLOB_CONFIGS[45] !== 0xef ||
    JSON.stringify(configForIndex(45)) !== JSON.stringify({
      n: true,
      e: true,
      s: true,
      w: true,
      ne: 'concave',
      se: 'solid',
      sw: 'solid',
      nw: 'solid',
    }) ||
    targetEntry.topologyClass !== 'cross-junction' ||
    JSON.stringify(targetEntry.connectedEdges) !==
      JSON.stringify(['n', 'e', 's', 'w']) ||
    targetEntry.exposedEdges.length !== 0 ||
    JSON.stringify(targetEntry.pockets) !== JSON.stringify(['ne']) ||
    JSON.stringify(targetEntry.solidDiagonals) !==
      JSON.stringify(['se', 'sw', 'nw']) ||
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
      'Single-open northeast cross-junction accepted-ledger boundary drift',
    );
  }

  for (const index of [
    ...gate.controlMaskRows,
    ...gate.installedNeighborMaskRows,
  ]) {
    const resolution = EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution;
    if (
      (resolution.kind !== 'direct-reuse' &&
        resolution.kind !== 'approved-derivation') ||
      resolution.status !== 'accepted-source-mapping'
    ) {
      throw new Error(
        `Single-open northeast cross-junction accepted dependency drift at mask_${index}`,
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
      'Single-open northeast cross-junction ledger-count boundary drift',
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
    JSON.stringify(gate.renderingDecision.reusedSourceFiles) !==
      JSON.stringify(sourceGate.renderingDecision.authoredSourceFiles) ||
    gate.renderingDecision.newAuthoredSourceFiles.length !== 0 ||
    gate.renderingDecision.sourceOmissions.length !== 0 ||
    gate.renderingDecision.sourceCanvas !== 128 ||
    gate.renderingDecision.mirrorAxisX !== 64 ||
    gate.renderingDecision.mirrorPolicy !== 'whole-cell-x-no-filter' ||
    gate.renderingDecision.seamFilter !== 'none' ||
    JSON.stringify(
      gate.renderingDecision.geometryControlMaskIndices,
    ) !== JSON.stringify([43, 32]) ||
    gate.renderingDecision.northeastReturnControlMaskIndex !== 40 ||
    gate.renderingDecision.sourceRelationship !==
      'read-only-x-mirror-of-owner-accepted-mask-33-proof-source'
  ) {
    throw new Error(
      'Single-open northeast cross-junction accepted rendering drift',
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
      'Single-open northeast cross-junction gate crossed the proof-only production boundary',
    );
  }
}

validateEqualHeightSingleOpenNortheastCrossJunctionGate();
