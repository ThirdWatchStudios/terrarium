import { BLOB_CONFIGS, configForIndex } from '../../src/tiles/blob';
import { EQUAL_HEIGHT_MASK_LEDGER } from './equalHeightMaskLedger';

/**
 * Owner-accepted proof-layer source gate for the repeatable middle row of a 2xN solid wall.
 *
 * Blob topology calls these rows T-junctions, but inside a fully occupied
 * two-column mass their art responsibility is simply the uninterrupted west
 * and east side spine between the already accepted corner rows.
 */

export type EqualHeightThickWallRepeatTransform = 'none' | 'mirror-x';

export interface EqualHeightThickWallRepeatCandidate {
  readonly side: 'west' | 'east';
  readonly col: 0 | 1;
  readonly row: 1;
  readonly maskIndex: 24 | 42;
  readonly sourceMaskIndex: 24;
  readonly sourceStem: 'filled_w_middle';
  readonly baseFile: 'filled_w_middle-base.svg';
  readonly upperFile: 'filled_w_middle-upper.svg';
  readonly transform: EqualHeightThickWallRepeatTransform;
  readonly resolution: 'direct-reuse' | 'approved-derivation';
}

export const EQUAL_HEIGHT_THICK_WALL_REPEAT_GATE = {
  stem: 'equal-height-thick-wall-repeat-gate',
  version: 0,
  status: 'owner-accepted-thick-wall-repeat-gate',
  contract: false,
  topologyClass: 'filled-side-spine-family',
  dimensions: { columns: 2, minimumRows: 2 },
  referenceMatrix: [[20, 26], [24, 42], [16, 34]] as const,
  baselineMaskRows: [16, 20, 26, 34] as const,
  candidates: [
    {
      side: 'west', col: 0, row: 1, maskIndex: 24, sourceMaskIndex: 24,
      sourceStem: 'filled_w_middle', baseFile: 'filled_w_middle-base.svg',
      upperFile: 'filled_w_middle-upper.svg', transform: 'none',
      resolution: 'direct-reuse',
    },
    {
      side: 'east', col: 1, row: 1, maskIndex: 42, sourceMaskIndex: 24,
      sourceStem: 'filled_w_middle', baseFile: 'filled_w_middle-base.svg',
      upperFile: 'filled_w_middle-upper.svg', transform: 'mirror-x',
      resolution: 'approved-derivation',
    },
  ] as const satisfies readonly EqualHeightThickWallRepeatCandidate[],
  maskRowsUnderReview: [] as const,
  maskRowsAccepted: [24, 42] as const,
  reviewCellSizes: [240, 90, 40] as const,
  reviewBlockHeights: [2, 3, 4, 6] as const,
  renderingDecision: {
    kind: 'one-authored-west-source-plus-x-mirror',
    scope: 'external-proof-source-bank',
    sourceDirectory: 'assets/walls/quota-co-building-system-proofs/thick-wall-repeat',
    authoredSourceFiles: [
      'filled_w_middle-base.svg',
      'filled_w_middle-upper.svg',
    ] as const,
    purpose: 'extend the accepted two-cell-thick wall mass without an internal belt',
    visibleLayers: ['charcoal-outer-contour', 'cream-solid-top'] as const,
    suppressedLayers: [
      'coral-fascia',
      'green-fascia',
      'south-facing-shade',
      'cap-rollover',
      'north-south-boundary-seam',
      'internal-center-seam',
    ] as const,
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
  24: {
    n: true, e: true, s: true, w: false,
    ne: 'solid', se: 'solid', sw: 'exposed', nw: 'exposed',
    side: 'west', transform: 'none', resolution: 'direct-reuse',
  },
  42: {
    n: true, e: false, s: true, w: true,
    ne: 'exposed', se: 'exposed', sw: 'solid', nw: 'solid',
    side: 'east', transform: 'mirror-x', resolution: 'approved-derivation',
  },
} as const;

/** Fail loudly if accepted provenance drifts or crosses into production. */
export function validateEqualHeightThickWallRepeatGate(
  gate = EQUAL_HEIGHT_THICK_WALL_REPEAT_GATE,
): void {
  if (
    gate.status !== 'owner-accepted-thick-wall-repeat-gate' ||
    gate.topologyClass !== 'filled-side-spine-family' ||
    gate.dimensions.columns !== 2 ||
    gate.dimensions.minimumRows !== 2 ||
    JSON.stringify(gate.referenceMatrix) !== JSON.stringify([[20, 26], [24, 42], [16, 34]])
  ) {
    throw new Error('Thick-wall repeat gate identity drift');
  }

  for (const candidate of gate.candidates) {
    const expected = expectedCandidate[candidate.maskIndex];
    const config = configForIndex(candidate.maskIndex);
    const ledgerEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[candidate.maskIndex];
    if (
      BLOB_CONFIGS[candidate.maskIndex] === undefined ||
      config.n !== expected.n ||
      config.e !== expected.e ||
      config.s !== expected.s ||
      config.w !== expected.w ||
      config.ne !== expected.ne ||
      config.se !== expected.se ||
      config.sw !== expected.sw ||
      config.nw !== expected.nw ||
      candidate.side !== expected.side ||
      candidate.transform !== expected.transform ||
      candidate.resolution !== expected.resolution ||
      candidate.sourceMaskIndex !== 24 ||
      candidate.sourceStem !== 'filled_w_middle' ||
      candidate.baseFile !== 'filled_w_middle-base.svg' ||
      candidate.upperFile !== 'filled_w_middle-upper.svg'
    ) {
      throw new Error(`Thick-wall repeat topology drift at mask_${candidate.maskIndex}`);
    }
    if (
      ledgerEntry.topologyClass !== 't-junction' ||
      ledgerEntry.pockets.length !== 0 ||
      ledgerEntry.resolution.kind !== candidate.resolution ||
      ledgerEntry.resolution.status !== 'accepted-source-mapping' ||
      ledgerEntry.resolution.variants.length !== 1 ||
      ledgerEntry.resolution.variants[0]?.sourceStem !== candidate.sourceStem ||
      ledgerEntry.resolution.variants[0]?.baseFile !== candidate.baseFile ||
      ledgerEntry.resolution.variants[0]?.upperFile !== candidate.upperFile ||
      ledgerEntry.resolution.variants[0]?.transform !== candidate.transform ||
      ledgerEntry.resolution.variants[0]?.derivation !== 'none'
    ) {
      throw new Error(`Thick-wall repeat ledger boundary drift at mask_${candidate.maskIndex}`);
    }
  }

  for (const index of gate.baselineMaskRows) {
    const resolution = EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution;
    if (
      (resolution.kind !== 'direct-reuse' && resolution.kind !== 'approved-derivation') ||
      resolution.status !== 'accepted-source-mapping'
    ) {
      throw new Error(`Thick-wall repeat baseline drift at mask_${index}`);
    }
  }

  if (
    gate.maskRowsUnderReview.length !== 0 ||
    JSON.stringify(gate.maskRowsAccepted) !== JSON.stringify([24, 42]) ||
    JSON.stringify(gate.reviewCellSizes) !== JSON.stringify([240, 90, 40]) ||
    JSON.stringify(gate.reviewBlockHeights) !== JSON.stringify([2, 3, 4, 6]) ||
    gate.renderingDecision.kind !== 'one-authored-west-source-plus-x-mirror' ||
    gate.renderingDecision.scope !== 'external-proof-source-bank' ||
    gate.renderingDecision.sourceDirectory !== 'assets/walls/quota-co-building-system-proofs/thick-wall-repeat' ||
    JSON.stringify(gate.renderingDecision.authoredSourceFiles) !== JSON.stringify([
      'filled_w_middle-base.svg',
      'filled_w_middle-upper.svg',
    ]) ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['direct-reuse'] !== 13 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['approved-derivation'] !== 10 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['synthetic-assembly'] !== 24 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['unresolved-authored-geometry'] !== 0
  ) {
    throw new Error('Thick-wall repeat evidence boundary drift');
  }

  if (
    gate.contract ||
    gate.rotationAllowed ||
    gate.yMirrorAllowed ||
    gate.productionRegistration ||
    gate.productionTopologyMutation ||
    gate.schemaChange ||
    gate.exportable ||
    gate.committedAtlas ||
    !gate.temporaryFrameIds
  ) {
    throw new Error('Thick-wall repeat gate crossed the proof-only production boundary');
  }
}

validateEqualHeightThickWallRepeatGate();
