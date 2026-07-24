import {
  EQUAL_HEIGHT_MASK_LEDGER,
  validateEqualHeightMaskLedger,
  type EqualHeightMaskTopologyClass,
} from './equalHeightMaskLedger';

export type EqualHeightConsistencyGround = 'light' | 'dark';
export type EqualHeightConsistencyExtent = 1 | 3 | 6;

export interface EqualHeightConsistencyTopologyGroup {
  readonly topologyClass: EqualHeightMaskTopologyClass;
  readonly maskRows: readonly number[];
}

export interface EqualHeightConsistencyDerivationPair {
  readonly sourceMask: number;
  readonly derivedMask: number;
  readonly operation:
    | 'mirror-x'
    | 'mirror-x-with-southeast-seam-filter'
    | 'mirror-x-with-opposite-diagonal-boundary-filter';
}

export interface EqualHeightAllMaskConsistencyGate {
  readonly stem: 'equal-height-47-mask-consistency-review';
  readonly previewStem: 'equal-height-47-mask-consistency-review-preview';
  readonly status: 'review-only-all-mask-consistency-gate';
  readonly acceptedLedgerStatus: 'owner-accepted-mapping-gate';
  readonly reviewedMaskRows: readonly number[];
  readonly topologyGroups: readonly EqualHeightConsistencyTopologyGroup[];
  readonly internalFacingMasks: readonly [1, 4, 5];
  readonly derivationPairs: readonly EqualHeightConsistencyDerivationPair[];
  readonly heroMasks: readonly number[];
  readonly extentMasks: readonly number[];
  readonly reviewCellSizes: readonly [240, 90, 40];
  readonly reviewExtents: readonly [1, 3, 6];
  readonly reviewGrounds: readonly ['light', 'dark'];
  readonly fullRasterWidth: 4480;
  readonly previewRasterWidth: 960;
  readonly fullRasterPixelBudget: 45_000_000;
  readonly previewRasterPixelBudget: 2_100_000;
  readonly contextScenes: readonly [
    'compact-room',
    'narrow-corridor',
    'three-by-three-solid-mass',
    'six-by-six-solid-mass',
    'mixed-junction-yard',
  ];
  readonly acceptedLedgerCounts: Readonly<{
    'direct-reuse': 28;
    'approved-derivation': 19;
    'synthetic-assembly': 0;
    'unresolved-authored-geometry': 0;
  }>;
  readonly ledgerMutation: false;
  readonly proofSourceMutation: false;
  readonly productionArtMutation: false;
  readonly productionRegistration: false;
  readonly productionTopologyMutation: false;
  readonly atlasMutation: false;
  readonly blobMappingMutation: false;
  readonly schemaChange: false;
  readonly unityRegistration: false;
  readonly exportable: false;
  readonly committedAtlas: false;
  readonly temporaryFrameIds: true;
}

const ALL_MASK_ROWS = Array.from(
  { length: EQUAL_HEIGHT_MASK_LEDGER.entries.length },
  (_, index) => index,
);

const TOPOLOGY_GROUPS = [
  { topologyClass: 'isolated', maskRows: [0] },
  { topologyClass: 'terminus', maskRows: [1, 2, 4, 8] },
  { topologyClass: 'straight', maskRows: [5, 10] },
  { topologyClass: 'perimeter-corner', maskRows: [3, 6, 9, 12] },
  { topologyClass: 'filled-elbow', maskRows: [16, 20, 26, 34] },
  {
    topologyClass: 't-junction',
    maskRows: [7, 11, 13, 14, 17, 18, 21, 22, 24, 27, 28, 31, 35, 36, 38, 42],
  },
  {
    topologyClass: 'cross-junction',
    maskRows: [15, 19, 23, 25, 29, 30, 32, 33, 37, 39, 40, 41, 43, 44, 45, 46],
  },
] as const satisfies readonly EqualHeightConsistencyTopologyGroup[];

const DERIVATION_PAIRS = [
  { sourceMask: 8, derivedMask: 2, operation: 'mirror-x' },
  { sourceMask: 3, derivedMask: 9, operation: 'mirror-x-with-southeast-seam-filter' },
  { sourceMask: 6, derivedMask: 12, operation: 'mirror-x' },
  { sourceMask: 7, derivedMask: 13, operation: 'mirror-x-with-southeast-seam-filter' },
  { sourceMask: 20, derivedMask: 26, operation: 'mirror-x' },
  { sourceMask: 21, derivedMask: 27, operation: 'mirror-x' },
  { sourceMask: 22, derivedMask: 28, operation: 'mirror-x' },
  { sourceMask: 23, derivedMask: 29, operation: 'mirror-x' },
  { sourceMask: 16, derivedMask: 34, operation: 'mirror-x-with-southeast-seam-filter' },
  { sourceMask: 18, derivedMask: 35, operation: 'mirror-x-with-southeast-seam-filter' },
  { sourceMask: 17, derivedMask: 36, operation: 'mirror-x-with-southeast-seam-filter' },
  {
    sourceMask: 30,
    derivedMask: 40,
    operation: 'mirror-x-with-opposite-diagonal-boundary-filter',
  },
  { sourceMask: 24, derivedMask: 42, operation: 'mirror-x' },
  { sourceMask: 25, derivedMask: 43, operation: 'mirror-x' },
  { sourceMask: 41, derivedMask: 44, operation: 'mirror-x' },
  { sourceMask: 33, derivedMask: 45, operation: 'mirror-x' },
] as const satisfies readonly EqualHeightConsistencyDerivationPair[];

export const EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE:
EqualHeightAllMaskConsistencyGate = {
  stem: 'equal-height-47-mask-consistency-review',
  previewStem: 'equal-height-47-mask-consistency-review-preview',
  status: 'review-only-all-mask-consistency-gate',
  acceptedLedgerStatus: 'owner-accepted-mapping-gate',
  reviewedMaskRows: ALL_MASK_ROWS,
  topologyGroups: TOPOLOGY_GROUPS,
  internalFacingMasks: [1, 4, 5],
  derivationPairs: DERIVATION_PAIRS,
  heroMasks: [0, 8, 5, 3, 16, 11, 18, 15, 46],
  extentMasks: [8, 3, 16, 11, 18, 15, 30, 41, 46],
  reviewCellSizes: [240, 90, 40],
  reviewExtents: [1, 3, 6],
  reviewGrounds: ['light', 'dark'],
  fullRasterWidth: 4480,
  previewRasterWidth: 960,
  fullRasterPixelBudget: 45_000_000,
  previewRasterPixelBudget: 2_100_000,
  contextScenes: [
    'compact-room',
    'narrow-corridor',
    'three-by-three-solid-mass',
    'six-by-six-solid-mass',
    'mixed-junction-yard',
  ],
  acceptedLedgerCounts: {
    'direct-reuse': 28,
    'approved-derivation': 19,
    'synthetic-assembly': 0,
    'unresolved-authored-geometry': 0,
  },
  ledgerMutation: false,
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
};

/** Fail loudly if the review sheet expands or mutates the accepted proof boundary. */
export function validateEqualHeightAllMaskConsistencyGate(
  gate: EqualHeightAllMaskConsistencyGate =
    EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE,
): void {
  validateEqualHeightMaskLedger(EQUAL_HEIGHT_MASK_LEDGER);
  const topologyRows = gate.topologyGroups.flatMap(({ maskRows }) => maskRows);
  const derivedRows = EQUAL_HEIGHT_MASK_LEDGER.entries
    .filter(({ resolution }) => resolution.kind === 'approved-derivation')
    .map(({ index }) => index);
  const coveredDerivedRows = [
    ...gate.internalFacingMasks,
    ...gate.derivationPairs.map(({ derivedMask }) => derivedMask),
  ].sort((left, right) => left - right);

  if (
    gate.stem !== 'equal-height-47-mask-consistency-review' ||
    gate.previewStem !==
      'equal-height-47-mask-consistency-review-preview' ||
    gate.status !== 'review-only-all-mask-consistency-gate' ||
    gate.acceptedLedgerStatus !== EQUAL_HEIGHT_MASK_LEDGER.status ||
    JSON.stringify(gate.reviewedMaskRows) !== JSON.stringify(ALL_MASK_ROWS) ||
    new Set(topologyRows).size !== ALL_MASK_ROWS.length ||
    JSON.stringify([...topologyRows].sort((left, right) => left - right)) !==
      JSON.stringify(ALL_MASK_ROWS)
  ) {
    throw new Error('Equal-height all-mask consistency coverage drift');
  }
  for (const group of gate.topologyGroups) {
    if (
      group.maskRows.some(
        (index) =>
          EQUAL_HEIGHT_MASK_LEDGER.entries[index]?.topologyClass !==
          group.topologyClass,
      )
    ) {
      throw new Error(
        `Equal-height consistency topology group drift: ${group.topologyClass}`,
      );
    }
  }
  if (
    JSON.stringify(coveredDerivedRows) !== JSON.stringify(derivedRows) ||
    gate.derivationPairs.some(({ sourceMask, derivedMask }) => {
      const source = EQUAL_HEIGHT_MASK_LEDGER.entries[sourceMask];
      const derived = EQUAL_HEIGHT_MASK_LEDGER.entries[derivedMask];
      return (
        source?.resolution.kind !== 'direct-reuse' ||
        derived?.resolution.kind !== 'approved-derivation'
      );
    })
  ) {
    throw new Error('Equal-height consistency derivation coverage drift');
  }
  if (
    JSON.stringify(gate.acceptedLedgerCounts) !==
      JSON.stringify(EQUAL_HEIGHT_MASK_LEDGER.counts) ||
    JSON.stringify(gate.reviewCellSizes) !== JSON.stringify([240, 90, 40]) ||
    JSON.stringify(gate.reviewExtents) !== JSON.stringify([1, 3, 6]) ||
    JSON.stringify(gate.reviewGrounds) !== JSON.stringify(['light', 'dark']) ||
    gate.fullRasterWidth !== 4480 ||
    gate.previewRasterWidth !== 960 ||
    gate.fullRasterPixelBudget !== 45_000_000 ||
    gate.previewRasterPixelBudget !== 2_100_000
  ) {
    throw new Error('Equal-height consistency review contract drift');
  }
  if (
    gate.ledgerMutation ||
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
      'Equal-height all-mask consistency gate crossed the review-only boundary',
    );
  }
}

validateEqualHeightAllMaskConsistencyGate();
