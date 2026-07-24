import { BLOB_CONFIGS, configForIndex } from '../../src/tiles/blob';
import { EQUAL_HEIGHT_MASK_LEDGER } from './equalHeightMaskLedger';

/** Owner-accepted proof-layer gate for the first ordinary open-pocket T-junction pair. */

export type EqualHeightOpenPocketTJunctionTransform = 'none' | 'mirror-x';
export type EqualHeightOpenPocketTJunctionDerivation =
  'none' | 'accepted-southeast-seam-filter';

export interface EqualHeightOpenPocketTJunctionCandidate {
  readonly side: 'west' | 'east';
  readonly maskIndex: 7 | 13;
  readonly sourceMaskIndex: 7;
  readonly sourceStem: 'open_w_t_junction';
  readonly baseFile: 'open_w_t_junction-base.svg';
  readonly upperFile: 'open_w_t_junction-upper.svg';
  readonly transform: EqualHeightOpenPocketTJunctionTransform;
  readonly derivation: EqualHeightOpenPocketTJunctionDerivation;
  readonly resolution: 'direct-reuse' | 'approved-derivation';
}

export const EQUAL_HEIGHT_OPEN_POCKET_T_JUNCTION_GATE = {
  stem: 'equal-height-open-pocket-t-junction-gate',
  version: 0,
  status: 'owner-accepted-open-pocket-t-junction-gate',
  contract: false,
  topologyClass: 'open-pocket-t-junction-family',
  compactMatrices: {
    west: [[null, 4, null], [null, 7, 8], [null, 1, null]],
    east: [[null, 4, null], [2, 13, null], [null, 1, null]],
  } as const,
  longArmRows: {
    west: [7, 10, 10, 10, 10, 8],
    east: [2, 10, 10, 10, 10, 13],
  } as const,
  baselineMaskRows: [1, 2, 4, 5, 8, 10] as const,
  candidates: [
    {
      side: 'west', maskIndex: 7, sourceMaskIndex: 7,
      sourceStem: 'open_w_t_junction', baseFile: 'open_w_t_junction-base.svg',
      upperFile: 'open_w_t_junction-upper.svg', transform: 'none', derivation: 'none',
      resolution: 'direct-reuse',
    },
    {
      side: 'east', maskIndex: 13, sourceMaskIndex: 7,
      sourceStem: 'open_w_t_junction', baseFile: 'open_w_t_junction-base.svg',
      upperFile: 'open_w_t_junction-upper.svg', transform: 'mirror-x',
      derivation: 'accepted-southeast-seam-filter',
      resolution: 'approved-derivation',
    },
  ] as const satisfies readonly EqualHeightOpenPocketTJunctionCandidate[],
  maskRowsUnderReview: [] as const,
  maskRowsAccepted: [7, 13] as const,
  reviewCellSizes: [240, 90, 40] as const,
  reviewArmLengths: [1, 3, 6] as const,
  renderingDecision: {
    kind: 'one-authored-west-source-plus-filtered-x-mirror',
    scope: 'external-proof-source-bank',
    sourceDirectory: 'assets/walls/quota-co-building-system-proofs/open-pocket-t-junction',
    authoredSourceFiles: [
      'open_w_t_junction-base.svg',
      'open_w_t_junction-upper.svg',
    ] as const,
    purpose: 'join three ordinary equal-height wall runs without a cap, post, or doubled internal face',
    continuousSockets: ['north', 'east', 'south'] as const,
    openPockets: ['northeast', 'southeast'] as const,
    mirrorPolicy: 'whole-cell-x-after-east-boundary-seam-omission',
  },
  rotationAllowed: false,
  yMirrorAllowed: false,
  productionRegistration: false,
  productionTopologyMutation: false,
  schemaChange: false,
  exportable: false,
  committedAtlas: false,
  temporaryFrameIds: true,
} as const;

const expectedCandidate = {
  7: {
    n: true, e: true, s: true, w: false,
    ne: 'concave', se: 'concave', sw: 'exposed', nw: 'exposed',
    side: 'west', transform: 'none', derivation: 'none',
    resolution: 'direct-reuse',
  },
  13: {
    n: true, e: false, s: true, w: true,
    ne: 'exposed', se: 'exposed', sw: 'concave', nw: 'concave',
    side: 'east', transform: 'mirror-x', derivation: 'accepted-southeast-seam-filter',
    resolution: 'approved-derivation',
  },
} as const;

/** Fail loudly if the accepted proof-layer source mapping drifts. */
export function validateEqualHeightOpenPocketTJunctionGate(
  gate = EQUAL_HEIGHT_OPEN_POCKET_T_JUNCTION_GATE,
): void {
  if (
    gate.status !== 'owner-accepted-open-pocket-t-junction-gate' ||
    gate.topologyClass !== 'open-pocket-t-junction-family' ||
    JSON.stringify(gate.compactMatrices.west) !== JSON.stringify([[null, 4, null], [null, 7, 8], [null, 1, null]]) ||
    JSON.stringify(gate.compactMatrices.east) !== JSON.stringify([[null, 4, null], [2, 13, null], [null, 1, null]])
  ) {
    throw new Error('Open-pocket T-junction gate identity drift');
  }

  for (const candidate of gate.candidates) {
    const expected = expectedCandidate[candidate.maskIndex];
    const config = configForIndex(candidate.maskIndex);
    const ledgerEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[candidate.maskIndex];
    if (
      BLOB_CONFIGS[candidate.maskIndex] === undefined ||
      config.n !== expected.n || config.e !== expected.e ||
      config.s !== expected.s || config.w !== expected.w ||
      config.ne !== expected.ne || config.se !== expected.se ||
      config.sw !== expected.sw || config.nw !== expected.nw ||
      candidate.side !== expected.side ||
      candidate.transform !== expected.transform ||
      candidate.derivation !== expected.derivation ||
      candidate.resolution !== expected.resolution ||
      candidate.sourceMaskIndex !== 7 ||
      candidate.sourceStem !== 'open_w_t_junction' ||
      candidate.baseFile !== 'open_w_t_junction-base.svg' ||
      candidate.upperFile !== 'open_w_t_junction-upper.svg'
    ) {
      throw new Error(`Open-pocket T-junction topology drift at mask_${candidate.maskIndex}`);
    }
    if (
      ledgerEntry.topologyClass !== 't-junction' ||
      ledgerEntry.pockets.length !== 2 ||
      ledgerEntry.solidDiagonals.length !== 0 ||
      ledgerEntry.resolution.kind !== candidate.resolution ||
      ledgerEntry.resolution.status !== 'accepted-source-mapping' ||
      ledgerEntry.resolution.variants.length !== 1 ||
      ledgerEntry.resolution.variants[0].sourceStem !== candidate.sourceStem ||
      ledgerEntry.resolution.variants[0].baseFile !== candidate.baseFile ||
      ledgerEntry.resolution.variants[0].upperFile !== candidate.upperFile ||
      ledgerEntry.resolution.variants[0].transform !== candidate.transform ||
      ledgerEntry.resolution.variants[0].derivation !== candidate.derivation
    ) {
      throw new Error(`Open-pocket T-junction source mapping drift at mask_${candidate.maskIndex}`);
    }
  }

  for (const index of gate.baselineMaskRows) {
    const resolution = EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution;
    if (
      (resolution.kind !== 'direct-reuse' && resolution.kind !== 'approved-derivation') ||
      resolution.status !== 'accepted-source-mapping'
    ) {
      throw new Error(`Open-pocket T-junction baseline drift at mask_${index}`);
    }
  }

  if (
    JSON.stringify(gate.longArmRows.west) !== JSON.stringify([7, 10, 10, 10, 10, 8]) ||
    JSON.stringify(gate.longArmRows.east) !== JSON.stringify([2, 10, 10, 10, 10, 13]) ||
    gate.maskRowsUnderReview.length !== 0 ||
    JSON.stringify(gate.maskRowsAccepted) !== JSON.stringify([7, 13]) ||
    JSON.stringify(gate.reviewCellSizes) !== JSON.stringify([240, 90, 40]) ||
    JSON.stringify(gate.reviewArmLengths) !== JSON.stringify([1, 3, 6]) ||
    gate.renderingDecision.kind !== 'one-authored-west-source-plus-filtered-x-mirror' ||
    gate.renderingDecision.scope !== 'external-proof-source-bank' ||
    gate.renderingDecision.sourceDirectory !== 'assets/walls/quota-co-building-system-proofs/open-pocket-t-junction' ||
    JSON.stringify(gate.renderingDecision.authoredSourceFiles) !== JSON.stringify([
      'open_w_t_junction-base.svg',
      'open_w_t_junction-upper.svg',
    ]) ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['direct-reuse'] !== 26 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['approved-derivation'] !== 18 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['synthetic-assembly'] !== 3 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['unresolved-authored-geometry'] !== 0
  ) {
    throw new Error('Open-pocket T-junction evidence boundary drift');
  }

  if (
    gate.contract || gate.rotationAllowed || gate.yMirrorAllowed ||
    gate.productionRegistration || gate.productionTopologyMutation || gate.schemaChange ||
    gate.exportable || gate.committedAtlas || !gate.temporaryFrameIds
  ) {
    throw new Error('Open-pocket T-junction gate crossed the proof-only production boundary');
  }
}

validateEqualHeightOpenPocketTJunctionGate();
