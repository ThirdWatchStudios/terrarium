import { BLOB_CONFIGS, configForIndex } from '../../src/tiles/blob';
import { EQUAL_HEIGHT_MASK_LEDGER } from './equalHeightMaskLedger';

/** Owner-accepted proof-layer gate for the four horizontal single-filled-pocket T states. */

export type EqualHeightHorizontalPartialTJunctionMask = 18 | 35 | 22 | 28;

export interface EqualHeightHorizontalPartialTJunctionCandidate {
  readonly maskIndex: EqualHeightHorizontalPartialTJunctionMask;
  readonly sourceMaskIndex: 18 | 22;
  readonly sourceStem: 'open_s_t_filled_ne' | 'open_n_t_filled_se';
  readonly baseFile:
    | 'open_s_t_filled_ne-base.svg'
    | 'open_n_t_filled_se-base.svg';
  readonly upperFile:
    | 'open_s_t_filled_ne-upper.svg'
    | 'open_n_t_filled_se-upper.svg';
  readonly opening: 'south' | 'north';
  readonly fixedLightRole: 'foreground' | 'rear';
  readonly solidDiagonal: 'ne' | 'nw' | 'se' | 'sw';
  readonly openPocket: 'nw' | 'ne' | 'sw' | 'se';
  readonly transform: 'none' | 'mirror-x';
  readonly derivation: 'none' | 'accepted-southeast-seam-filter';
  readonly resolution: 'direct-reuse' | 'approved-derivation';
}

export const EQUAL_HEIGHT_HORIZONTAL_PARTIAL_T_JUNCTION_GATE = {
  stem: 'equal-height-horizontal-partial-t-junction-gate',
  version: 0,
  status: 'owner-accepted-horizontal-partial-t-junction-gate',
  contract: false,
  topologyClass: 'horizontal-single-filled-pocket-t-junction-family',
  stateDiamonds: {
    openSouth: {
      openMaskIndex: 11,
      partialMaskIndices: [18, 35],
      filledMaskIndex: 38,
    },
    openNorth: {
      openMaskIndex: 14,
      partialMaskIndices: [22, 28],
      filledMaskIndex: 31,
    },
  },
  compactMatrices: {
    mask18: [[null, 20, 26], [2, 18, 34], [null, null, null]],
    mask35: [[20, 26, null], [16, 35, 8], [null, null, null]],
    mask22: [[null, null, null], [2, 22, 26], [null, 16, 34]],
    mask28: [[null, null, null], [20, 28, 8], [16, 34, null]],
  },
  longMatrices: {
    mask18: [
      [null, null, null, null, 4, null, null, null, null, null],
      [null, null, null, null, 5, null, null, null, null, null],
      [null, null, null, null, 5, null, null, null, null, null],
      [null, null, null, null, 21, 31, 31, 31, 31, 26],
      [2, 10, 10, 10, 18, 38, 38, 38, 38, 34],
    ],
    mask35: [
      [null, null, null, null, null, 4, null, null, null, null],
      [null, null, null, null, null, 5, null, null, null, null],
      [null, null, null, null, null, 5, null, null, null, null],
      [20, 31, 31, 31, 31, 27, null, null, null, null],
      [16, 38, 38, 38, 38, 35, 10, 10, 10, 8],
    ],
    mask22: [
      [2, 10, 10, 10, 22, 31, 31, 31, 31, 26],
      [null, null, null, null, 17, 38, 38, 38, 38, 34],
      [null, null, null, null, 5, null, null, null, null, null],
      [null, null, null, null, 5, null, null, null, null, null],
      [null, null, null, null, 1, null, null, null, null, null],
    ],
    mask28: [
      [20, 31, 31, 31, 31, 28, 10, 10, 10, 8],
      [16, 38, 38, 38, 38, 36, null, null, null, null],
      [null, null, null, null, null, 5, null, null, null, null],
      [null, null, null, null, null, 5, null, null, null, null],
      [null, null, null, null, null, 1, null, null, null, null],
    ],
  },
  candidates: [
    {
      maskIndex: 18,
      sourceMaskIndex: 18,
      sourceStem: 'open_s_t_filled_ne',
      baseFile: 'open_s_t_filled_ne-base.svg',
      upperFile: 'open_s_t_filled_ne-upper.svg',
      opening: 'south',
      fixedLightRole: 'foreground',
      solidDiagonal: 'ne',
      openPocket: 'nw',
      transform: 'none',
      derivation: 'none',
      resolution: 'direct-reuse',
    },
    {
      maskIndex: 35,
      sourceMaskIndex: 18,
      sourceStem: 'open_s_t_filled_ne',
      baseFile: 'open_s_t_filled_ne-base.svg',
      upperFile: 'open_s_t_filled_ne-upper.svg',
      opening: 'south',
      fixedLightRole: 'foreground',
      solidDiagonal: 'nw',
      openPocket: 'ne',
      transform: 'mirror-x',
      derivation: 'accepted-southeast-seam-filter',
      resolution: 'approved-derivation',
    },
    {
      maskIndex: 22,
      sourceMaskIndex: 22,
      sourceStem: 'open_n_t_filled_se',
      baseFile: 'open_n_t_filled_se-base.svg',
      upperFile: 'open_n_t_filled_se-upper.svg',
      opening: 'north',
      fixedLightRole: 'rear',
      solidDiagonal: 'se',
      openPocket: 'sw',
      transform: 'none',
      derivation: 'none',
      resolution: 'direct-reuse',
    },
    {
      maskIndex: 28,
      sourceMaskIndex: 22,
      sourceStem: 'open_n_t_filled_se',
      baseFile: 'open_n_t_filled_se-base.svg',
      upperFile: 'open_n_t_filled_se-upper.svg',
      opening: 'north',
      fixedLightRole: 'rear',
      solidDiagonal: 'sw',
      openPocket: 'se',
      transform: 'mirror-x',
      derivation: 'none',
      resolution: 'approved-derivation',
    },
  ] as const satisfies readonly EqualHeightHorizontalPartialTJunctionCandidate[],
  maskRowsUnderReview: [] as const,
  maskRowsAccepted: [18, 35, 22, 28] as const,
  baselineMaskRows: [1, 2, 4, 5, 8, 10, 11, 14, 16, 17, 20, 21, 26, 27, 31, 34, 36, 38] as const,
  reviewCellSizes: [240, 90, 40] as const,
  reviewArmLengths: [1, 3, 6] as const,
  renderingDecision: {
    kind: 'two-accepted-fixed-light-masters-plus-two-approved-x-mirrors',
    scope: 'external-proof-source-reuse',
    sourceDirectory:
      'assets/walls/quota-co-building-system-proofs/horizontal-partial-t-junction',
    reusedSourceFiles: [
      'open_s_t_filled_ne-base.svg',
      'open_s_t_filled_ne-upper.svg',
      'open_n_t_filled_se-base.svg',
      'open_n_t_filled_se-upper.svg',
    ] as const,
    mirrorPolicy: {
      mask35: 'omit-boundary-seams-then-whole-cell-x',
      mask28: 'whole-cell-x',
    },
    shadePolicy:
      'preserve accepted local plane cues; defer continuous south-face plane-cue normalization to one cross-family polish pass',
    requiredRead:
      'the filled diagonal disappears into the two-row mass while the sibling crook remains visibly open floor',
  },
  acceptedLedgerCounts: {
    'direct-reuse': 27,
    'approved-derivation': 18,
    'synthetic-assembly': 2,
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

const EXPECTED_CONFIG = {
  18: {
    raw: 27,
    n: true, e: true, s: false, w: true,
    ne: 'solid', se: 'exposed', sw: 'exposed', nw: 'concave',
  },
  35: {
    raw: 139,
    n: true, e: true, s: false, w: true,
    ne: 'concave', se: 'exposed', sw: 'exposed', nw: 'solid',
  },
  22: {
    raw: 46,
    n: false, e: true, s: true, w: true,
    ne: 'exposed', se: 'solid', sw: 'concave', nw: 'exposed',
  },
  28: {
    raw: 78,
    n: false, e: true, s: true, w: true,
    ne: 'exposed', se: 'concave', sw: 'solid', nw: 'exposed',
  },
} as const;

/** Fail loudly if the accepted proof-layer mapping drifts. */
export function validateEqualHeightHorizontalPartialTJunctionGate(
  gate = EQUAL_HEIGHT_HORIZONTAL_PARTIAL_T_JUNCTION_GATE,
): void {
  if (
    gate.status !== 'owner-accepted-horizontal-partial-t-junction-gate' ||
    gate.topologyClass !== 'horizontal-single-filled-pocket-t-junction-family' ||
    JSON.stringify(gate.stateDiamonds) !== JSON.stringify({
      openSouth: { openMaskIndex: 11, partialMaskIndices: [18, 35], filledMaskIndex: 38 },
      openNorth: { openMaskIndex: 14, partialMaskIndices: [22, 28], filledMaskIndex: 31 },
    }) ||
    JSON.stringify(gate.compactMatrices) !== JSON.stringify({
      mask18: [[null, 20, 26], [2, 18, 34], [null, null, null]],
      mask35: [[20, 26, null], [16, 35, 8], [null, null, null]],
      mask22: [[null, null, null], [2, 22, 26], [null, 16, 34]],
      mask28: [[null, null, null], [20, 28, 8], [16, 34, null]],
    }) ||
    JSON.stringify(gate.longMatrices) !== JSON.stringify({
      mask18: [
        [null, null, null, null, 4, null, null, null, null, null],
        [null, null, null, null, 5, null, null, null, null, null],
        [null, null, null, null, 5, null, null, null, null, null],
        [null, null, null, null, 21, 31, 31, 31, 31, 26],
        [2, 10, 10, 10, 18, 38, 38, 38, 38, 34],
      ],
      mask35: [
        [null, null, null, null, null, 4, null, null, null, null],
        [null, null, null, null, null, 5, null, null, null, null],
        [null, null, null, null, null, 5, null, null, null, null],
        [20, 31, 31, 31, 31, 27, null, null, null, null],
        [16, 38, 38, 38, 38, 35, 10, 10, 10, 8],
      ],
      mask22: [
        [2, 10, 10, 10, 22, 31, 31, 31, 31, 26],
        [null, null, null, null, 17, 38, 38, 38, 38, 34],
        [null, null, null, null, 5, null, null, null, null, null],
        [null, null, null, null, 5, null, null, null, null, null],
        [null, null, null, null, 1, null, null, null, null, null],
      ],
      mask28: [
        [20, 31, 31, 31, 31, 28, 10, 10, 10, 8],
        [16, 38, 38, 38, 38, 36, null, null, null, null],
        [null, null, null, null, null, 5, null, null, null, null],
        [null, null, null, null, null, 5, null, null, null, null],
        [null, null, null, null, null, 1, null, null, null, null],
      ],
    }) ||
    gate.maskRowsUnderReview.length !== 0 ||
    JSON.stringify(gate.maskRowsAccepted) !== JSON.stringify([18, 35, 22, 28]) ||
    JSON.stringify(gate.reviewCellSizes) !== JSON.stringify([240, 90, 40]) ||
    JSON.stringify(gate.reviewArmLengths) !== JSON.stringify([1, 3, 6])
  ) {
    throw new Error('Horizontal partial T-junction gate identity drift');
  }

  const expectedCandidates = {
    18: {
      sourceMaskIndex: 18, sourceStem: 'open_s_t_filled_ne',
      opening: 'south', fixedLightRole: 'foreground',
      solidDiagonal: 'ne', openPocket: 'nw', transform: 'none',
      derivation: 'none', resolution: 'direct-reuse',
    },
    35: {
      sourceMaskIndex: 18, sourceStem: 'open_s_t_filled_ne',
      opening: 'south', fixedLightRole: 'foreground',
      solidDiagonal: 'nw', openPocket: 'ne', transform: 'mirror-x',
      derivation: 'accepted-southeast-seam-filter',
      resolution: 'approved-derivation',
    },
    22: {
      sourceMaskIndex: 22, sourceStem: 'open_n_t_filled_se',
      opening: 'north', fixedLightRole: 'rear',
      solidDiagonal: 'se', openPocket: 'sw', transform: 'none',
      derivation: 'none', resolution: 'direct-reuse',
    },
    28: {
      sourceMaskIndex: 22, sourceStem: 'open_n_t_filled_se',
      opening: 'north', fixedLightRole: 'rear',
      solidDiagonal: 'sw', openPocket: 'se', transform: 'mirror-x',
      derivation: 'none', resolution: 'approved-derivation',
    },
  } as const;

  for (const candidate of gate.candidates) {
    const expectedConfig = EXPECTED_CONFIG[candidate.maskIndex];
    const expectedCandidate = expectedCandidates[candidate.maskIndex];
    const config = configForIndex(candidate.maskIndex);
    const ledgerEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[candidate.maskIndex];
    if (
      BLOB_CONFIGS[candidate.maskIndex] !== expectedConfig.raw ||
      JSON.stringify(config) !== JSON.stringify({
        n: expectedConfig.n, e: expectedConfig.e,
        s: expectedConfig.s, w: expectedConfig.w,
        ne: expectedConfig.ne, se: expectedConfig.se,
        sw: expectedConfig.sw, nw: expectedConfig.nw,
      }) ||
      candidate.sourceMaskIndex !== expectedCandidate.sourceMaskIndex ||
      candidate.sourceStem !== expectedCandidate.sourceStem ||
      candidate.opening !== expectedCandidate.opening ||
      candidate.fixedLightRole !== expectedCandidate.fixedLightRole ||
      candidate.solidDiagonal !== expectedCandidate.solidDiagonal ||
      candidate.openPocket !== expectedCandidate.openPocket ||
      candidate.transform !== expectedCandidate.transform ||
      candidate.derivation !== expectedCandidate.derivation ||
      candidate.resolution !== expectedCandidate.resolution ||
      candidate.baseFile !== `${candidate.sourceStem}-base.svg` ||
      candidate.upperFile !== `${candidate.sourceStem}-upper.svg` ||
      ledgerEntry.topologyClass !== 't-junction' ||
      ledgerEntry.pockets.length !== 1 ||
      ledgerEntry.pockets[0] !== candidate.openPocket ||
      ledgerEntry.solidDiagonals.length !== 1 ||
      ledgerEntry.solidDiagonals[0] !== candidate.solidDiagonal ||
      ledgerEntry.resolution.kind !== candidate.resolution ||
      ledgerEntry.resolution.status !== 'accepted-source-mapping' ||
      ledgerEntry.resolution.variants.length !== 1 ||
      ledgerEntry.resolution.variants[0].sourceStem !== candidate.sourceStem ||
      ledgerEntry.resolution.variants[0].baseFile !== candidate.baseFile ||
      ledgerEntry.resolution.variants[0].upperFile !== candidate.upperFile ||
      ledgerEntry.resolution.variants[0].transform !== candidate.transform ||
      ledgerEntry.resolution.variants[0].derivation !== candidate.derivation
    ) {
      throw new Error(`Horizontal partial T-junction accepted mapping drift at mask_${candidate.maskIndex}`);
    }
  }

  for (const index of gate.baselineMaskRows) {
    const resolution = EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution;
    if (
      (resolution.kind !== 'direct-reuse' && resolution.kind !== 'approved-derivation') ||
      resolution.status !== 'accepted-source-mapping'
    ) {
      throw new Error(`Horizontal partial T-junction baseline drift at mask_${index}`);
    }
  }

  if (
    JSON.stringify(EQUAL_HEIGHT_MASK_LEDGER.counts) !== JSON.stringify({
    'direct-reuse': 27,
      'approved-derivation': 18,
    'synthetic-assembly': 2,
      'unresolved-authored-geometry': 0,
    }) ||
    JSON.stringify(gate.acceptedLedgerCounts) !== JSON.stringify(EQUAL_HEIGHT_MASK_LEDGER.counts) ||
    gate.renderingDecision.kind !==
      'two-accepted-fixed-light-masters-plus-two-approved-x-mirrors' ||
    gate.renderingDecision.mirrorPolicy.mask35 !==
      'omit-boundary-seams-then-whole-cell-x' ||
    gate.renderingDecision.mirrorPolicy.mask28 !== 'whole-cell-x'
  ) {
    throw new Error('Horizontal partial T-junction accepted evidence boundary drift');
  }

  if (
    gate.contract || !gate.xMirrorAllowed || gate.yMirrorAllowed || gate.rotationAllowed ||
    gate.productionRegistration || gate.productionTopologyMutation ||
    gate.schemaChange || gate.exportable || gate.committedAtlas ||
    !gate.temporaryFrameIds
  ) {
    throw new Error('Horizontal partial T-junction gate crossed the proof-only boundary');
  }
}

validateEqualHeightHorizontalPartialTJunctionGate();
