import { BLOB_CONFIGS, configForIndex } from '../../src/tiles/blob';
import { EQUAL_HEIGHT_MASK_LEDGER } from './equalHeightMaskLedger';

/** Owner-accepted proof-layer gate for the two east-side one-filled-pocket T states. */

export type EqualHeightEastPartialTJunctionMask = 36 | 27;

export interface EqualHeightEastPartialTJunctionCandidate {
  readonly maskIndex: EqualHeightEastPartialTJunctionMask;
  readonly sourceMaskIndex: 17 | 21;
  readonly sourceStem: 'open_w_t_filled_ne' | 'open_w_t_filled_se';
  readonly baseFile:
    | 'open_w_t_filled_ne-base.svg'
    | 'open_w_t_filled_se-base.svg';
  readonly upperFile:
    | 'open_w_t_filled_ne-upper.svg'
    | 'open_w_t_filled_se-upper.svg';
  readonly solidDiagonal: 'nw' | 'sw';
  readonly openPocket: 'sw' | 'nw';
  readonly fixedLightRole: 'foreground' | 'rear';
  readonly westSocketControl: 38 | 31;
  readonly transform: 'mirror-x';
  readonly derivation: 'accepted-southeast-seam-filter' | 'none';
  readonly resolution: 'approved-derivation';
}

export const EQUAL_HEIGHT_EAST_PARTIAL_T_JUNCTION_GATE = {
  stem: 'equal-height-east-partial-t-junction-gate',
  version: 0,
  status: 'owner-accepted-east-partial-t-junction-gate',
  contract: false,
  topologyClass: 'single-filled-pocket-t-junction-pair',
  stateDiamond: {
    openMaskIndex: 13,
    partialMaskIndices: [36, 27],
    filledMaskIndex: 42,
  },
  compactMatrices: {
    filledNorthWest: [
      [20, 26],
      [16, 36],
      [null, 1],
    ],
    filledSouthWest: [
      [null, 4],
      [20, 27],
      [16, 34],
    ],
  },
  longMatrices: {
    filledNorthWest: [
      [20, 31, 31, 31, 31, 26],
      [16, 38, 38, 38, 38, 36],
      [null, null, null, null, null, 5],
      [null, null, null, null, null, 5],
      [null, null, null, null, null, 1],
    ],
    filledSouthWest: [
      [null, null, null, null, null, 4],
      [null, null, null, null, null, 5],
      [null, null, null, null, null, 5],
      [20, 31, 31, 31, 31, 27],
      [16, 38, 38, 38, 38, 34],
    ],
  },
  candidates: [
    {
      maskIndex: 36,
      sourceMaskIndex: 17,
      sourceStem: 'open_w_t_filled_ne',
      baseFile: 'open_w_t_filled_ne-base.svg',
      upperFile: 'open_w_t_filled_ne-upper.svg',
      solidDiagonal: 'nw',
      openPocket: 'sw',
      fixedLightRole: 'foreground',
      westSocketControl: 38,
      transform: 'mirror-x',
      derivation: 'accepted-southeast-seam-filter',
      resolution: 'approved-derivation',
    },
    {
      maskIndex: 27,
      sourceMaskIndex: 21,
      sourceStem: 'open_w_t_filled_se',
      baseFile: 'open_w_t_filled_se-base.svg',
      upperFile: 'open_w_t_filled_se-upper.svg',
      solidDiagonal: 'sw',
      openPocket: 'nw',
      fixedLightRole: 'rear',
      westSocketControl: 31,
      transform: 'mirror-x',
      derivation: 'none',
      resolution: 'approved-derivation',
    },
  ] as const satisfies readonly EqualHeightEastPartialTJunctionCandidate[],
  maskRowsUnderReview: [] as const,
  maskRowsAccepted: [36, 27] as const,
  baselineMaskRows: [1, 4, 5, 13, 16, 20, 26, 31, 34, 38, 42] as const,
  reviewCellSizes: [240, 90, 40] as const,
  renderingDecision: {
    kind: 'two-accepted-west-fixed-light-sources-plus-approved-x-mirror',
    scope: 'external-proof-source-reuse',
    sourceDirectory:
      'assets/walls/quota-co-building-system-proofs/west-partial-t-junction',
    reusedSourceFiles: [
      'open_w_t_filled_ne-base.svg',
      'open_w_t_filled_ne-upper.svg',
      'open_w_t_filled_se-base.svg',
      'open_w_t_filled_se-upper.svg',
    ] as const,
    purpose:
      'mirror the accepted west partial T transitions into east-side compact and long wall masses without exposing a buried pocket face',
    acceptedControls: [13, 42] as const,
    mirrorPolicy: {
      mask36: 'omit-boundary-seams-then-whole-cell-x',
      mask27: 'whole-cell-x',
    },
    requiredRead:
      'one continuous cream mass, one genuinely open floor pocket, and unchanged foreground or rear fixed-light ownership',
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
  36: {
    raw: 141,
    n: true, e: false, s: true, w: true,
    ne: 'exposed', se: 'exposed', sw: 'concave', nw: 'solid',
  },
  27: {
    raw: 77,
    n: true, e: false, s: true, w: true,
    ne: 'exposed', se: 'exposed', sw: 'solid', nw: 'concave',
  },
} as const;

/** Fail loudly if the accepted proof-layer mapping drifts. */
export function validateEqualHeightEastPartialTJunctionGate(
  gate = EQUAL_HEIGHT_EAST_PARTIAL_T_JUNCTION_GATE,
): void {
  if (
    gate.status !== 'owner-accepted-east-partial-t-junction-gate' ||
    gate.topologyClass !== 'single-filled-pocket-t-junction-pair' ||
    JSON.stringify(gate.stateDiamond) !== JSON.stringify({
      openMaskIndex: 13,
      partialMaskIndices: [36, 27],
      filledMaskIndex: 42,
    }) ||
    JSON.stringify(gate.compactMatrices) !== JSON.stringify({
      filledNorthWest: [[20, 26], [16, 36], [null, 1]],
      filledSouthWest: [[null, 4], [20, 27], [16, 34]],
    }) ||
    JSON.stringify(gate.longMatrices) !== JSON.stringify({
      filledNorthWest: [
        [20, 31, 31, 31, 31, 26],
        [16, 38, 38, 38, 38, 36],
        [null, null, null, null, null, 5],
        [null, null, null, null, null, 5],
        [null, null, null, null, null, 1],
      ],
      filledSouthWest: [
        [null, null, null, null, null, 4],
        [null, null, null, null, null, 5],
        [null, null, null, null, null, 5],
        [20, 31, 31, 31, 31, 27],
        [16, 38, 38, 38, 38, 34],
      ],
    }) ||
    gate.maskRowsUnderReview.length !== 0 ||
    JSON.stringify(gate.maskRowsAccepted) !== JSON.stringify([36, 27]) ||
    JSON.stringify(gate.reviewCellSizes) !== JSON.stringify([240, 90, 40])
  ) {
    throw new Error('East partial T-junction gate identity drift');
  }

  for (const candidate of gate.candidates) {
    const expected = EXPECTED_CONFIG[candidate.maskIndex];
    const config = configForIndex(candidate.maskIndex);
    const ledgerEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[candidate.maskIndex];
    const foreground = candidate.maskIndex === 36;
    if (
      BLOB_CONFIGS[candidate.maskIndex] !== expected.raw ||
      config.n !== expected.n || config.e !== expected.e ||
      config.s !== expected.s || config.w !== expected.w ||
      config.ne !== expected.ne || config.se !== expected.se ||
      config.sw !== expected.sw || config.nw !== expected.nw ||
      candidate.sourceMaskIndex !== (foreground ? 17 : 21) ||
      candidate.sourceStem !== (foreground ? 'open_w_t_filled_ne' : 'open_w_t_filled_se') ||
      candidate.solidDiagonal !== (foreground ? 'nw' : 'sw') ||
      candidate.openPocket !== (foreground ? 'sw' : 'nw') ||
      candidate.fixedLightRole !== (foreground ? 'foreground' : 'rear') ||
      candidate.westSocketControl !== (foreground ? 38 : 31) ||
      candidate.transform !== 'mirror-x' ||
      candidate.derivation !== (foreground ? 'accepted-southeast-seam-filter' : 'none') ||
      candidate.resolution !== 'approved-derivation' ||
      candidate.baseFile !== `${candidate.sourceStem}-base.svg` ||
      candidate.upperFile !== `${candidate.sourceStem}-upper.svg` ||
      ledgerEntry.topologyClass !== 't-junction' ||
      ledgerEntry.pockets.length !== 1 ||
      ledgerEntry.pockets[0] !== candidate.openPocket ||
      ledgerEntry.solidDiagonals.length !== 1 ||
      ledgerEntry.solidDiagonals[0] !== candidate.solidDiagonal ||
      ledgerEntry.resolution.kind !== 'approved-derivation' ||
      ledgerEntry.resolution.status !== 'accepted-source-mapping' ||
      ledgerEntry.resolution.variants.length !== 1 ||
      ledgerEntry.resolution.variants[0].sourceStem !== candidate.sourceStem ||
      ledgerEntry.resolution.variants[0].baseFile !== candidate.baseFile ||
      ledgerEntry.resolution.variants[0].upperFile !== candidate.upperFile ||
      ledgerEntry.resolution.variants[0].transform !== candidate.transform ||
      ledgerEntry.resolution.variants[0].derivation !== candidate.derivation
    ) {
      throw new Error(`East partial T-junction topology drift at mask_${candidate.maskIndex}`);
    }
  }

  for (const index of gate.baselineMaskRows) {
    const resolution = EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution;
    if (
      (resolution.kind !== 'direct-reuse' &&
        resolution.kind !== 'approved-derivation') ||
      resolution.status !== 'accepted-source-mapping'
    ) {
      throw new Error(`East partial T-junction baseline drift at mask_${index}`);
    }
  }

  if (
    gate.renderingDecision.sourceDirectory !==
      'assets/walls/quota-co-building-system-proofs/west-partial-t-junction' ||
    JSON.stringify(gate.renderingDecision.reusedSourceFiles) !== JSON.stringify([
      'open_w_t_filled_ne-base.svg',
      'open_w_t_filled_ne-upper.svg',
      'open_w_t_filled_se-base.svg',
      'open_w_t_filled_se-upper.svg',
    ]) ||
    gate.renderingDecision.kind !==
      'two-accepted-west-fixed-light-sources-plus-approved-x-mirror' ||
    gate.renderingDecision.mirrorPolicy.mask36 !==
      'omit-boundary-seams-then-whole-cell-x' ||
    gate.renderingDecision.mirrorPolicy.mask27 !== 'whole-cell-x' ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['direct-reuse'] !== 19 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['approved-derivation'] !== 14 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['synthetic-assembly'] !== 14 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['unresolved-authored-geometry'] !== 0
  ) {
    throw new Error('East partial T-junction accepted evidence boundary drift');
  }

  if (
    gate.contract || !gate.xMirrorAllowed || gate.yMirrorAllowed ||
    gate.rotationAllowed || gate.productionRegistration ||
    gate.productionTopologyMutation || gate.schemaChange ||
    gate.exportable || gate.committedAtlas || !gate.temporaryFrameIds
  ) {
    throw new Error('East partial T-junction gate crossed the proof-only boundary');
  }
}

validateEqualHeightEastPartialTJunctionGate();
