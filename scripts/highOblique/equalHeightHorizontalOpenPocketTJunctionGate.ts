import { BLOB_CONFIGS, configForIndex } from '../../src/tiles/blob';
import { EQUAL_HEIGHT_MASK_LEDGER } from './equalHeightMaskLedger';

/** Owner-accepted proof-layer gate for the two horizontal-spine open-pocket T hubs. */

export interface EqualHeightHorizontalOpenPocketTJunctionCandidate {
  readonly opening: 'south' | 'north';
  readonly fixedLightRole: 'foreground' | 'rear';
  readonly maskIndex: 11 | 14;
  readonly sourceMaskIndex: 11 | 14;
  readonly sourceStem: 'open_s_t_junction' | 'open_n_t_junction';
  readonly baseFile: 'open_s_t_junction-base.svg' | 'open_n_t_junction-base.svg';
  readonly upperFile: 'open_s_t_junction-upper.svg' | 'open_n_t_junction-upper.svg';
  readonly transform: 'none';
  readonly derivation: 'none';
  readonly resolution: 'direct-reuse';
}

export const EQUAL_HEIGHT_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE = {
  stem: 'equal-height-horizontal-open-pocket-t-junction-gate',
  version: 0,
  status: 'owner-accepted-horizontal-open-pocket-t-junction-gate',
  contract: false,
  topologyClass: 'horizontal-open-pocket-t-junction-family',
  compactMatrices: {
    openSouth: [[null, 4, null], [2, 11, 8], [null, null, null]],
    openNorth: [[null, null, null], [2, 14, 8], [null, 1, null]],
  } as const,
  longHorizontalRows: {
    openSouth: [2, 10, 11, 10, 10, 8],
    openNorth: [2, 10, 14, 10, 10, 8],
  } as const,
  longVerticalColumns: {
    openSouth: [4, 5, 5, 5, 5, 11],
    openNorth: [14, 5, 5, 5, 5, 1],
  } as const,
  baselineMaskRows: [1, 2, 4, 5, 8, 10] as const,
  branchFacingEvidence: [
    { side: 'west', bodyMaskIndex: 5, transform: 'none' },
    { side: 'east', bodyMaskIndex: 5, transform: 'mirror-x' },
  ] as const,
  candidates: [
    {
      opening: 'south', fixedLightRole: 'foreground', maskIndex: 11,
      sourceMaskIndex: 11, sourceStem: 'open_s_t_junction',
      baseFile: 'open_s_t_junction-base.svg',
      upperFile: 'open_s_t_junction-upper.svg', transform: 'none',
      derivation: 'none', resolution: 'direct-reuse',
    },
    {
      opening: 'north', fixedLightRole: 'rear', maskIndex: 14,
      sourceMaskIndex: 14, sourceStem: 'open_n_t_junction',
      baseFile: 'open_n_t_junction-base.svg',
      upperFile: 'open_n_t_junction-upper.svg', transform: 'none',
      derivation: 'none', resolution: 'direct-reuse',
    },
  ] as const satisfies readonly EqualHeightHorizontalOpenPocketTJunctionCandidate[],
  maskRowsUnderReview: [] as const,
  maskRowsAccepted: [11, 14] as const,
  reviewCellSizes: [240, 90, 40] as const,
  reviewArmLengths: [1, 3, 6] as const,
  renderingDecision: {
    kind: 'two-authored-fixed-light-horizontal-spine-sources',
    scope: 'external-proof-source-bank',
    sourceDirectory:
      'assets/walls/quota-co-building-system-proofs/horizontal-open-pocket-t-junction',
    authoredSourceFiles: [
      'open_s_t_junction-base.svg',
      'open_s_t_junction-upper.svg',
      'open_n_t_junction-base.svg',
      'open_n_t_junction-upper.svg',
    ] as const,
    purpose:
      'join one vertical branch to an ordinary horizontal wall without a cap, post, or filled pocket',
    foregroundOwnership: [
      'continuous-horizontal-cream-frontage',
      'horizontal-coral-register',
      'horizontal-green-frontage',
    ] as const,
    rearOwnership: [
      'continuous-horizontal-cream-span',
      'south-branch-cream-reset',
      'outgoing-south-material-stack',
    ] as const,
    mirrorPolicy: 'no-x-or-y-mirror-fixed-light-pair',
  },
  rotationAllowed: false,
  xMirrorAllowed: false,
  yMirrorAllowed: false,
  productionRegistration: false,
  productionTopologyMutation: false,
  schemaChange: false,
  exportable: false,
  committedAtlas: false,
  temporaryFrameIds: true,
} as const;

const expectedCandidate = {
  11: {
    n: true, e: true, s: false, w: true,
    ne: 'concave', se: 'exposed', sw: 'exposed', nw: 'concave',
    opening: 'south', fixedLightRole: 'foreground', sourceStem: 'open_s_t_junction',
  },
  14: {
    n: false, e: true, s: true, w: true,
    ne: 'exposed', se: 'concave', sw: 'concave', nw: 'exposed',
    opening: 'north', fixedLightRole: 'rear', sourceStem: 'open_n_t_junction',
  },
} as const;

/** Fail loudly if the accepted proof-layer source mapping drifts. */
export function validateEqualHeightHorizontalOpenPocketTJunctionGate(
  gate = EQUAL_HEIGHT_HORIZONTAL_OPEN_POCKET_T_JUNCTION_GATE,
): void {
  if (
    gate.status !== 'owner-accepted-horizontal-open-pocket-t-junction-gate' ||
    gate.topologyClass !== 'horizontal-open-pocket-t-junction-family' ||
    JSON.stringify(gate.compactMatrices.openSouth) !==
      JSON.stringify([[null, 4, null], [2, 11, 8], [null, null, null]]) ||
    JSON.stringify(gate.compactMatrices.openNorth) !==
      JSON.stringify([[null, null, null], [2, 14, 8], [null, 1, null]])
  ) {
    throw new Error('Horizontal open-pocket T-junction gate identity drift');
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
      candidate.opening !== expected.opening ||
      candidate.fixedLightRole !== expected.fixedLightRole ||
      candidate.sourceStem !== expected.sourceStem ||
      candidate.sourceMaskIndex !== candidate.maskIndex ||
      candidate.transform !== 'none' || candidate.derivation !== 'none' ||
      candidate.resolution !== 'direct-reuse'
    ) {
      throw new Error(
        `Horizontal open-pocket T-junction topology drift at mask_${candidate.maskIndex}`,
      );
    }
    if (
      ledgerEntry.topologyClass !== 't-junction' ||
      ledgerEntry.pockets.length !== 2 ||
      ledgerEntry.solidDiagonals.length !== 0 ||
      ledgerEntry.resolution.kind !== 'direct-reuse' ||
      ledgerEntry.resolution.status !== 'accepted-source-mapping' ||
      ledgerEntry.resolution.variants.length !== 1 ||
      ledgerEntry.resolution.variants[0].sourceStem !== candidate.sourceStem ||
      ledgerEntry.resolution.variants[0].baseFile !== candidate.baseFile ||
      ledgerEntry.resolution.variants[0].upperFile !== candidate.upperFile ||
      ledgerEntry.resolution.variants[0].transform !== candidate.transform ||
      ledgerEntry.resolution.variants[0].derivation !== candidate.derivation
    ) {
      throw new Error(
        `Horizontal open-pocket T-junction source mapping drift at mask_${candidate.maskIndex}`,
      );
    }
  }

  for (const index of gate.baselineMaskRows) {
    const resolution = EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution;
    if (
      (resolution.kind !== 'direct-reuse' && resolution.kind !== 'approved-derivation') ||
      resolution.status !== 'accepted-source-mapping'
    ) {
      throw new Error(`Horizontal open-pocket T-junction baseline drift at mask_${index}`);
    }
  }

  const verticalBodyResolution = EQUAL_HEIGHT_MASK_LEDGER.entries[5].resolution;
  if (
    verticalBodyResolution.kind !== 'approved-derivation' ||
    verticalBodyResolution.status !== 'accepted-source-mapping' ||
    verticalBodyResolution.variants.length !== 2 ||
    verticalBodyResolution.variants[0].transform !== 'none' ||
    verticalBodyResolution.variants[1].transform !== 'mirror-x' ||
    JSON.stringify(gate.branchFacingEvidence) !== JSON.stringify([
      { side: 'west', bodyMaskIndex: 5, transform: 'none' },
      { side: 'east', bodyMaskIndex: 5, transform: 'mirror-x' },
    ])
  ) {
    throw new Error('Horizontal open-pocket T-junction branch-facing evidence drift');
  }

  if (
    JSON.stringify(gate.longHorizontalRows.openSouth) !==
      JSON.stringify([2, 10, 11, 10, 10, 8]) ||
    JSON.stringify(gate.longHorizontalRows.openNorth) !==
      JSON.stringify([2, 10, 14, 10, 10, 8]) ||
    JSON.stringify(gate.longVerticalColumns.openSouth) !==
      JSON.stringify([4, 5, 5, 5, 5, 11]) ||
    JSON.stringify(gate.longVerticalColumns.openNorth) !==
      JSON.stringify([14, 5, 5, 5, 5, 1]) ||
    gate.maskRowsUnderReview.length !== 0 ||
    JSON.stringify(gate.maskRowsAccepted) !== JSON.stringify([11, 14]) ||
    JSON.stringify(gate.reviewCellSizes) !== JSON.stringify([240, 90, 40]) ||
    JSON.stringify(gate.reviewArmLengths) !== JSON.stringify([1, 3, 6]) ||
    gate.renderingDecision.kind !== 'two-authored-fixed-light-horizontal-spine-sources' ||
    gate.renderingDecision.scope !== 'external-proof-source-bank' ||
    gate.renderingDecision.sourceDirectory !==
      'assets/walls/quota-co-building-system-proofs/horizontal-open-pocket-t-junction' ||
    JSON.stringify(gate.renderingDecision.authoredSourceFiles) !== JSON.stringify([
      'open_s_t_junction-base.svg',
      'open_s_t_junction-upper.svg',
      'open_n_t_junction-base.svg',
      'open_n_t_junction-upper.svg',
    ]) ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['direct-reuse'] !== 24 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['approved-derivation'] !== 17 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['synthetic-assembly'] !== 6 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['unresolved-authored-geometry'] !== 0
  ) {
    throw new Error('Horizontal open-pocket T-junction evidence boundary drift');
  }

  if (
    gate.contract || gate.rotationAllowed || gate.xMirrorAllowed || gate.yMirrorAllowed ||
    gate.productionRegistration || gate.productionTopologyMutation || gate.schemaChange ||
    gate.exportable || gate.committedAtlas || !gate.temporaryFrameIds
  ) {
    throw new Error(
      'Horizontal open-pocket T-junction gate crossed the proof-only production boundary',
    );
  }
}

validateEqualHeightHorizontalOpenPocketTJunctionGate();
