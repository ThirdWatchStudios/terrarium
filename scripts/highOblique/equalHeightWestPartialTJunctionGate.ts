import { configForIndex } from '../../src/tiles/blob';
import { EQUAL_HEIGHT_MASK_LEDGER } from './equalHeightMaskLedger';

/** Owner-accepted proof-layer gate for the two west-side one-filled-pocket T states. */

export type EqualHeightWestPartialTJunctionMask = 17 | 21;

export interface EqualHeightWestPartialTJunctionCandidate {
  readonly maskIndex: EqualHeightWestPartialTJunctionMask;
  readonly sourceStem: 'open_w_t_filled_ne' | 'open_w_t_filled_se';
  readonly baseFile:
    | 'open_w_t_filled_ne-base.svg'
    | 'open_w_t_filled_se-base.svg';
  readonly upperFile:
    | 'open_w_t_filled_ne-upper.svg'
    | 'open_w_t_filled_se-upper.svg';
  readonly solidDiagonal: 'ne' | 'se';
  readonly openPocket: 'se' | 'ne';
  readonly fixedLightRole: 'foreground' | 'rear';
  readonly eastSocketControl: 38 | 31;
  readonly transform: 'none';
  readonly resolution: 'direct-reuse';
}

export const EQUAL_HEIGHT_WEST_PARTIAL_T_JUNCTION_GATE = {
  stem: 'equal-height-west-partial-t-junction-gate',
  version: 0,
  status: 'owner-accepted-west-partial-t-junction-gate',
  contract: false,
  topologyClass: 'single-filled-pocket-t-junction-pair',
  stateDiamond: {
    openMaskIndex: 7,
    partialMaskIndices: [17, 21],
    filledMaskIndex: 24,
  },
  compactMatrices: {
    filledNorthEast: [
      [20, 26],
      [17, 34],
      [1, null],
    ],
    filledSouthEast: [
      [4, null],
      [21, 26],
      [16, 34],
    ],
  },
  longMatrices: {
    filledNorthEast: [
      [20, 31, 31, 31, 31, 26],
      [17, 38, 38, 38, 38, 34],
      [5, null, null, null, null, null],
      [5, null, null, null, null, null],
      [1, null, null, null, null, null],
    ],
    filledSouthEast: [
      [4, null, null, null, null, null],
      [5, null, null, null, null, null],
      [5, null, null, null, null, null],
      [21, 31, 31, 31, 31, 26],
      [16, 38, 38, 38, 38, 34],
    ],
  },
  candidates: [
    {
      maskIndex: 17,
      sourceStem: 'open_w_t_filled_ne',
      baseFile: 'open_w_t_filled_ne-base.svg',
      upperFile: 'open_w_t_filled_ne-upper.svg',
      solidDiagonal: 'ne',
      openPocket: 'se',
      fixedLightRole: 'foreground',
      eastSocketControl: 38,
      transform: 'none',
      resolution: 'direct-reuse',
    },
    {
      maskIndex: 21,
      sourceStem: 'open_w_t_filled_se',
      baseFile: 'open_w_t_filled_se-base.svg',
      upperFile: 'open_w_t_filled_se-upper.svg',
      solidDiagonal: 'se',
      openPocket: 'ne',
      fixedLightRole: 'rear',
      eastSocketControl: 31,
      transform: 'none',
      resolution: 'direct-reuse',
    },
  ] as const satisfies readonly EqualHeightWestPartialTJunctionCandidate[],
  maskRowsUnderReview: [] as const,
  maskRowsAccepted: [17, 21] as const,
  acceptedMirrorRows: [36, 27] as const,
  reviewCellSizes: [240, 90, 40] as const,
  renderingDecision: {
    kind: 'two-authored-west-fixed-light-transition-sources',
    scope: 'external-proof-source-bank',
    sourceDirectory:
      'assets/walls/quota-co-building-system-proofs/west-partial-t-junction',
    authoredSourceFiles: [
      'open_w_t_filled_ne-base.svg',
      'open_w_t_filled_ne-upper.svg',
      'open_w_t_filled_se-base.svg',
      'open_w_t_filled_se-upper.svg',
    ] as const,
    purpose:
      'transition between a one-cell branch and one side of a two-cell-thick wall without exposing a buried pocket face',
    acceptedControls: [7, 24] as const,
    requiredRead:
      'one continuous cream mass, one genuinely open floor pocket, and fixed-light foreground or rear socket ownership appropriate to the candidate',
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

const EXPECTED_CONFIG = {
  17: {
    n: true, e: true, s: true, w: false,
    ne: 'solid', se: 'concave', sw: 'exposed', nw: 'exposed',
  },
  21: {
    n: true, e: true, s: true, w: false,
    ne: 'concave', se: 'solid', sw: 'exposed', nw: 'exposed',
  },
} as const;

/** Fail loudly if the accepted proof-layer source mapping drifts. */
export function validateEqualHeightWestPartialTJunctionGate(
  gate = EQUAL_HEIGHT_WEST_PARTIAL_T_JUNCTION_GATE,
): void {
  if (
    gate.status !== 'owner-accepted-west-partial-t-junction-gate' ||
    gate.topologyClass !== 'single-filled-pocket-t-junction-pair' ||
    JSON.stringify(gate.stateDiamond) !== JSON.stringify({
      openMaskIndex: 7,
      partialMaskIndices: [17, 21],
      filledMaskIndex: 24,
    }) ||
    gate.maskRowsUnderReview.length !== 0 ||
    JSON.stringify(gate.maskRowsAccepted) !== JSON.stringify([17, 21]) ||
    JSON.stringify(gate.acceptedMirrorRows) !== JSON.stringify([36, 27]) ||
    JSON.stringify(gate.reviewCellSizes) !== JSON.stringify([240, 90, 40])
  ) {
    throw new Error('West partial T-junction gate identity drift');
  }

  for (const candidate of gate.candidates) {
    const config = configForIndex(candidate.maskIndex);
    const expected = EXPECTED_CONFIG[candidate.maskIndex];
    const ledgerEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[candidate.maskIndex];
    if (
      JSON.stringify(config) !== JSON.stringify(expected) ||
      candidate.transform !== 'none' ||
      candidate.resolution !== 'direct-reuse' ||
      candidate.fixedLightRole !== (candidate.maskIndex === 17 ? 'foreground' : 'rear') ||
      candidate.eastSocketControl !== (candidate.maskIndex === 17 ? 38 : 31) ||
      expected[candidate.solidDiagonal] !== 'solid' ||
      expected[candidate.openPocket] !== 'concave' ||
      ledgerEntry.topologyClass !== 't-junction' ||
      ledgerEntry.pockets.length !== 1 ||
      ledgerEntry.pockets[0] !== candidate.openPocket ||
      ledgerEntry.solidDiagonals.length !== 1 ||
      ledgerEntry.solidDiagonals[0] !== candidate.solidDiagonal ||
      ledgerEntry.resolution.kind !== 'direct-reuse' ||
      ledgerEntry.resolution.status !== 'accepted-source-mapping' ||
      ledgerEntry.resolution.variants.length !== 1 ||
      ledgerEntry.resolution.variants[0].sourceStem !== candidate.sourceStem ||
      ledgerEntry.resolution.variants[0].baseFile !== candidate.baseFile ||
      ledgerEntry.resolution.variants[0].upperFile !== candidate.upperFile ||
      ledgerEntry.resolution.variants[0].transform !== candidate.transform ||
      ledgerEntry.resolution.variants[0].derivation !== 'none'
    ) {
      throw new Error(`West partial T-junction topology drift at mask_${candidate.maskIndex}`);
    }
  }

  for (const mirrorIndex of gate.acceptedMirrorRows) {
    const resolution = EQUAL_HEIGHT_MASK_LEDGER.entries[mirrorIndex].resolution;
    if (
      resolution.kind !== 'approved-derivation' ||
      resolution.status !== 'accepted-source-mapping'
    ) {
      throw new Error(`West partial T-junction accepted mirror drift at mask_${mirrorIndex}`);
    }
  }

  for (const controlIndex of [7, 24] as const) {
    const resolution = EQUAL_HEIGHT_MASK_LEDGER.entries[controlIndex].resolution;
    if (
      (resolution.kind !== 'direct-reuse' &&
        resolution.kind !== 'approved-derivation') ||
      resolution.status !== 'accepted-source-mapping'
    ) {
      throw new Error(`West partial T-junction control drift at mask_${controlIndex}`);
    }
  }

  if (
    gate.renderingDecision.sourceDirectory !==
      'assets/walls/quota-co-building-system-proofs/west-partial-t-junction' ||
    JSON.stringify(gate.renderingDecision.authoredSourceFiles) !== JSON.stringify([
      'open_w_t_filled_ne-base.svg',
      'open_w_t_filled_ne-upper.svg',
      'open_w_t_filled_se-base.svg',
      'open_w_t_filled_se-upper.svg',
    ]) ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['direct-reuse'] !== 17 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['approved-derivation'] !== 14 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['synthetic-assembly'] !== 16 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['unresolved-authored-geometry'] !== 0
  ) {
    throw new Error('West partial T-junction evidence boundary drift');
  }

  if (
    gate.contract || gate.xMirrorAllowed || gate.yMirrorAllowed ||
    gate.rotationAllowed || gate.productionRegistration ||
    gate.productionTopologyMutation || gate.schemaChange ||
    gate.exportable || gate.committedAtlas || !gate.temporaryFrameIds
  ) {
    throw new Error('West partial T-junction gate crossed the proof-only boundary');
  }
}

validateEqualHeightWestPartialTJunctionGate();
