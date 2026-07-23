import { BLOB_CONFIGS, configForIndex } from '../../src/tiles/blob';
import { EQUAL_HEIGHT_MASK_LEDGER } from './equalHeightMaskLedger';

/** Owner-accepted proof-layer gate for mask_15, the all-open four-way wall hub. */

export type EqualHeightOpenPocketCrossJunctionMask = 15;
export type EqualHeightOpenPocketCrossJunctionMatrixMask =
  | 1 | 2 | 4 | 5 | 8 | 10 | 15;
export type EqualHeightOpenPocketCrossJunctionMatrix =
  readonly (readonly (EqualHeightOpenPocketCrossJunctionMatrixMask | null)[])[];

export interface EqualHeightOpenPocketCrossJunctionCandidate {
  readonly maskIndex: EqualHeightOpenPocketCrossJunctionMask;
  readonly sourceMaskIndex: EqualHeightOpenPocketCrossJunctionMask;
  readonly sourceStem: 'open_cross_junction';
  readonly baseFile: 'open_cross_junction-base.svg';
  readonly upperFile: 'open_cross_junction-upper.svg';
  readonly connectedEdges: readonly ['n', 'e', 's', 'w'];
  readonly openPockets: readonly ['ne', 'se', 'sw', 'nw'];
  readonly solidDiagonals: readonly [];
  readonly fixedLightRole: 'four-way-hub';
  readonly transform: 'none';
  readonly derivation: 'none';
  readonly resolution: 'direct-reuse';
}

const ONE_CELL_ARM_MATRIX = [
  [null, 4, null],
  [2, 15, 8],
  [null, 1, null],
] as const satisfies EqualHeightOpenPocketCrossJunctionMatrix;

const THREE_CELL_ARM_MATRIX = [
  [null, null, null, 4, null, null, null],
  [null, null, null, 5, null, null, null],
  [null, null, null, 5, null, null, null],
  [2, 10, 10, 15, 10, 10, 8],
  [null, null, null, 5, null, null, null],
  [null, null, null, 5, null, null, null],
  [null, null, null, 1, null, null, null],
] as const satisfies EqualHeightOpenPocketCrossJunctionMatrix;

const SIX_CELL_ARM_MATRIX = [
  [null, null, null, null, null, null, 4, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [2, 10, 10, 10, 10, 10, 15, 10, 10, 10, 10, 10, 8],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 5, null, null, null, null, null, null],
  [null, null, null, null, null, null, 1, null, null, null, null, null, null],
] as const satisfies EqualHeightOpenPocketCrossJunctionMatrix;

export const EQUAL_HEIGHT_OPEN_POCKET_CROSS_JUNCTION_GATE = {
  stem: 'equal-height-open-pocket-cross-junction-gate',
  version: 0,
  status: 'owner-accepted-open-pocket-cross-junction-gate',
  contract: false,
  topologyClass: 'open-pocket-cross-junction',
  candidate: {
    maskIndex: 15,
    sourceMaskIndex: 15,
    sourceStem: 'open_cross_junction',
    baseFile: 'open_cross_junction-base.svg',
    upperFile: 'open_cross_junction-upper.svg',
    connectedEdges: ['n', 'e', 's', 'w'],
    openPockets: ['ne', 'se', 'sw', 'nw'],
    solidDiagonals: [],
    fixedLightRole: 'four-way-hub',
    transform: 'none',
    derivation: 'none',
    resolution: 'direct-reuse',
  } as const satisfies EqualHeightOpenPocketCrossJunctionCandidate,
  compactMatrix: ONE_CELL_ARM_MATRIX,
  threeCellArmMatrix: THREE_CELL_ARM_MATRIX,
  sixCellArmMatrix: SIX_CELL_ARM_MATRIX,
  baselineMaskRows: [1, 2, 4, 5, 7, 8, 10, 11, 13, 14] as const,
  maskRowsUnderReview: [] as const,
  maskRowsAccepted: [15] as const,
  reviewCellSizes: [240, 90, 40] as const,
  reviewArmLengths: [1, 3, 6] as const,
  renderingDecision: {
    kind: 'one-accepted-authored-fixed-light-four-way-hub',
    scope: 'external-proof-source-bank',
    sourceDirectory:
      'assets/walls/quota-co-building-system-proofs/open-pocket-cross-junction',
    authoredSourceFiles: [
      'open_cross_junction-base.svg',
      'open_cross_junction-upper.svg',
    ] as const,
    purpose:
      'join four ordinary equal-height one-cell wall runs while preserving all four diagonal floor pockets',
    requiredRead:
      'one molded four-way connector whose sockets disappear into neighboring runs without becoming a post, cap, or filled block',
    shadePolicy:
      'preserve local fixed-light plane cues; continuous south-face shade remains a separate cross-family polish pass',
  },
  acceptedLedgerCounts: {
    'direct-reuse': 23,
    'approved-derivation': 16,
    'synthetic-assembly': 8,
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
  matrix: EqualHeightOpenPocketCrossJunctionMatrix,
  armLength: 1 | 3 | 6,
): void {
  const size = armLength * 2 + 1;
  const center = armLength;
  if (matrix.length !== size || matrix.some((row) => row.length !== size)) {
    throw new Error(`Open-pocket cross-junction ${label} matrix must be ${size}x${size}`);
  }
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      let expected: EqualHeightOpenPocketCrossJunctionMatrixMask | null = null;
      if (row === center && column === center) expected = 15;
      else if (column === center) {
        expected = row === 0 ? 4 : row === size - 1 ? 1 : 5;
      } else if (row === center) {
        expected = column === 0 ? 2 : column === size - 1 ? 8 : 10;
      }
      if (matrix[row][column] !== expected) {
        throw new Error(
          `Open-pocket cross-junction ${label} matrix drift at ${column},${row}`,
        );
      }
    }
  }
}

/** Fail loudly if the accepted mask_15 proof-layer source mapping drifts. */
export function validateEqualHeightOpenPocketCrossJunctionGate(
  gate = EQUAL_HEIGHT_OPEN_POCKET_CROSS_JUNCTION_GATE,
): void {
  if (
    gate.stem !== 'equal-height-open-pocket-cross-junction-gate' ||
    gate.status !== 'owner-accepted-open-pocket-cross-junction-gate' ||
    gate.topologyClass !== 'open-pocket-cross-junction' ||
    gate.candidate.maskIndex !== 15 ||
    gate.candidate.sourceMaskIndex !== 15 ||
    gate.candidate.sourceStem !== 'open_cross_junction' ||
    gate.candidate.baseFile !== 'open_cross_junction-base.svg' ||
    gate.candidate.upperFile !== 'open_cross_junction-upper.svg' ||
    JSON.stringify(gate.candidate.connectedEdges) !== JSON.stringify(['n', 'e', 's', 'w']) ||
    JSON.stringify(gate.candidate.openPockets) !== JSON.stringify(['ne', 'se', 'sw', 'nw']) ||
    gate.candidate.solidDiagonals.length !== 0 ||
    gate.candidate.fixedLightRole !== 'four-way-hub' ||
    gate.candidate.transform !== 'none' ||
    gate.candidate.derivation !== 'none' ||
    gate.candidate.resolution !== 'direct-reuse' ||
    gate.maskRowsUnderReview.length !== 0 ||
    JSON.stringify(gate.maskRowsAccepted) !== JSON.stringify([15]) ||
    JSON.stringify(gate.reviewCellSizes) !== JSON.stringify([240, 90, 40]) ||
    JSON.stringify(gate.reviewArmLengths) !== JSON.stringify([1, 3, 6])
  ) {
    throw new Error('Open-pocket cross-junction gate identity drift');
  }

  validateArmMatrix('compact', gate.compactMatrix, 1);
  validateArmMatrix('three-cell-arm', gate.threeCellArmMatrix, 3);
  validateArmMatrix('six-cell-arm', gate.sixCellArmMatrix, 6);

  const config = configForIndex(15);
  const ledgerEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[15];
  if (
    BLOB_CONFIGS[15] !== 0x0f ||
    JSON.stringify(config) !== JSON.stringify({
      n: true, e: true, s: true, w: true,
      ne: 'concave', se: 'concave', sw: 'concave', nw: 'concave',
    }) ||
    ledgerEntry.topologyClass !== 'cross-junction' ||
    JSON.stringify(ledgerEntry.connectedEdges) !== JSON.stringify(['n', 'e', 's', 'w']) ||
    ledgerEntry.exposedEdges.length !== 0 ||
    JSON.stringify(ledgerEntry.pockets) !== JSON.stringify(['ne', 'se', 'sw', 'nw']) ||
    ledgerEntry.solidDiagonals.length !== 0 ||
    ledgerEntry.resolution.kind !== 'direct-reuse' ||
    ledgerEntry.resolution.status !== 'accepted-source-mapping' ||
    ledgerEntry.resolution.variants.length !== 1 ||
    ledgerEntry.resolution.variants[0].sourceStem !== gate.candidate.sourceStem ||
    ledgerEntry.resolution.variants[0].baseFile !== gate.candidate.baseFile ||
    ledgerEntry.resolution.variants[0].upperFile !== gate.candidate.upperFile ||
    ledgerEntry.resolution.variants[0].transform !== gate.candidate.transform ||
    ledgerEntry.resolution.variants[0].derivation !== gate.candidate.derivation
  ) {
    throw new Error('Open-pocket cross-junction source mapping drift');
  }

  for (const index of gate.baselineMaskRows) {
    const resolution = EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution;
    if (
      (resolution.kind !== 'direct-reuse' && resolution.kind !== 'approved-derivation') ||
      resolution.status !== 'accepted-source-mapping'
    ) {
      throw new Error(`Open-pocket cross-junction baseline drift at mask_${index}`);
    }
  }

  const currentCounts = EQUAL_HEIGHT_MASK_LEDGER.counts;
  if (
    JSON.stringify(gate.acceptedLedgerCounts) !== JSON.stringify(currentCounts) ||
    currentCounts['direct-reuse'] !== 23 ||
    currentCounts['approved-derivation'] !== 16 ||
    currentCounts['synthetic-assembly'] !== 8 ||
    currentCounts['unresolved-authored-geometry'] !== 0
  ) {
    throw new Error('Open-pocket cross-junction ledger-count boundary drift');
  }

  if (
    gate.renderingDecision.kind !==
      'one-accepted-authored-fixed-light-four-way-hub' ||
    gate.renderingDecision.scope !== 'external-proof-source-bank' ||
    gate.renderingDecision.sourceDirectory !==
      'assets/walls/quota-co-building-system-proofs/open-pocket-cross-junction' ||
    JSON.stringify(gate.renderingDecision.authoredSourceFiles) !== JSON.stringify([
      'open_cross_junction-base.svg',
      'open_cross_junction-upper.svg',
    ])
  ) {
    throw new Error('Open-pocket cross-junction evidence boundary drift');
  }

  if (
    gate.contract || gate.xMirrorAllowed || gate.yMirrorAllowed ||
    gate.rotationAllowed || gate.productionRegistration ||
    gate.productionTopologyMutation || gate.schemaChange ||
    gate.exportable || gate.committedAtlas || !gate.temporaryFrameIds
  ) {
    throw new Error('Open-pocket cross-junction gate crossed the proof-only boundary');
  }
}

validateEqualHeightOpenPocketCrossJunctionGate();
