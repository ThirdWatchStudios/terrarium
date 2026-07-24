import { BLOB_CONFIGS, configForIndex } from '../../src/tiles/blob';
import { EQUAL_HEIGHT_MASK_LEDGER } from './equalHeightMaskLedger';

/**
 * Owner-accepted proof for the repeatable middle column of an N×2 solid wall.
 *
 * The accepted sources remain external and promote masks 31 and 38 only in
 * the proof-layer ledger. No production registration follows from this gate.
 */

export interface EqualHeightThickWallHorizontalRepeatCandidate {
  readonly row: 'rear' | 'foreground';
  readonly col: 1;
  readonly rowIndex: 0 | 1;
  readonly maskIndex: 31 | 38;
  readonly sourceMaskIndex: 31 | 38;
  readonly sourceStem: 'filled_n_middle' | 'filled_s_middle';
  readonly baseFile: 'filled_n_middle-base.svg' | 'filled_s_middle-base.svg';
  readonly upperFile: 'filled_n_middle-upper.svg' | 'filled_s_middle-upper.svg';
  readonly transform: 'none';
  readonly resolution: 'direct-reuse';
}

export const EQUAL_HEIGHT_THICK_WALL_HORIZONTAL_REPEAT_GATE = {
  stem: 'equal-height-thick-wall-horizontal-repeat-gate',
  version: 0,
  status: 'owner-accepted-thick-wall-horizontal-repeat-gate',
  contract: false,
  topologyClass: 'filled-horizontal-spine-family',
  dimensions: { minimumColumns: 2, rows: 2 },
  referenceMatrix: [[20, 31, 26], [16, 38, 34]] as const,
  baselineMaskRows: [16, 20, 26, 34] as const,
  candidates: [
    {
      row: 'rear', col: 1, rowIndex: 0, maskIndex: 31, sourceMaskIndex: 31,
      sourceStem: 'filled_n_middle', baseFile: 'filled_n_middle-base.svg',
      upperFile: 'filled_n_middle-upper.svg', transform: 'none',
      resolution: 'direct-reuse',
    },
    {
      row: 'foreground', col: 1, rowIndex: 1, maskIndex: 38, sourceMaskIndex: 38,
      sourceStem: 'filled_s_middle', baseFile: 'filled_s_middle-base.svg',
      upperFile: 'filled_s_middle-upper.svg', transform: 'none',
      resolution: 'direct-reuse',
    },
  ] as const satisfies readonly EqualHeightThickWallHorizontalRepeatCandidate[],
  maskRowsUnderReview: [] as const,
  maskRowsAccepted: [31, 38] as const,
  reviewCellSizes: [240, 90, 40] as const,
  reviewBlockWidths: [2, 3, 4, 6] as const,
  renderingDecision: {
    kind: 'two-authored-fixed-light-horizontal-source-pairs',
    scope: 'external-proof-source-bank',
    sourceDirectory: 'assets/walls/quota-co-building-system-proofs/thick-wall-horizontal-repeat',
    authoredSourceFiles: [
      'filled_n_middle-base.svg',
      'filled_n_middle-upper.svg',
      'filled_s_middle-base.svg',
      'filled_s_middle-upper.svg',
    ] as const,
    purpose: 'extend the accepted two-row solid wall mass without an internal vertical belt',
    rearOwnership: ['charcoal-north-contour', 'cream-solid-top', 'coping-highlight'] as const,
    foregroundOwnership: [
      'cream-solid-top',
      'south-facing-material-shade',
      'coral-register',
      'green-frontage',
      'floor-contact-plinth',
    ] as const,
    suppressedLayers: [
      'buried-north-face',
      'internal-column-belt',
      'cap-rollover',
    ] as const,
  },
  rotationAllowed: false,
  xMirrorRequired: false,
  yMirrorAllowed: false,
  productionRegistration: false,
  productionTopologyMutation: false,
  schemaChange: false,
  exportable: false,
  committedAtlas: false,
  temporaryFrameIds: true,
} as const;

const expectedCandidate = {
  31: {
    n: false, e: true, s: true, w: true,
    ne: 'exposed', se: 'solid', sw: 'solid', nw: 'exposed',
    row: 'rear', sourceStem: 'filled_n_middle',
  },
  38: {
    n: true, e: true, s: false, w: true,
    ne: 'solid', se: 'exposed', sw: 'exposed', nw: 'solid',
    row: 'foreground', sourceStem: 'filled_s_middle',
  },
} as const;

/** Fail loudly if the accepted proof drifts or crosses into production. */
export function validateEqualHeightThickWallHorizontalRepeatGate(
  gate = EQUAL_HEIGHT_THICK_WALL_HORIZONTAL_REPEAT_GATE,
): void {
  if (
    gate.status !== 'owner-accepted-thick-wall-horizontal-repeat-gate' ||
    gate.topologyClass !== 'filled-horizontal-spine-family' ||
    gate.dimensions.minimumColumns !== 2 ||
    gate.dimensions.rows !== 2 ||
    JSON.stringify(gate.referenceMatrix) !== JSON.stringify([[20, 31, 26], [16, 38, 34]])
  ) {
    throw new Error('Thick-wall horizontal repeat gate identity drift');
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
      candidate.row !== expected.row ||
      candidate.sourceStem !== expected.sourceStem ||
      candidate.sourceMaskIndex !== candidate.maskIndex ||
      candidate.baseFile !== `${candidate.sourceStem}-base.svg` ||
      candidate.upperFile !== `${candidate.sourceStem}-upper.svg` ||
      candidate.transform !== 'none' ||
      candidate.resolution !== 'direct-reuse'
    ) {
      throw new Error(`Thick-wall horizontal repeat topology drift at mask_${candidate.maskIndex}`);
    }
    if (
      ledgerEntry.topologyClass !== 't-junction' ||
      ledgerEntry.pockets.length !== 0 ||
      ledgerEntry.resolution.kind !== candidate.resolution ||
      ledgerEntry.resolution.status !== 'accepted-source-mapping' ||
      ledgerEntry.resolution.variants.length !== 1 ||
      ledgerEntry.resolution.variants[0].sourceStem !== candidate.sourceStem ||
      ledgerEntry.resolution.variants[0].baseFile !== candidate.baseFile ||
      ledgerEntry.resolution.variants[0].upperFile !== candidate.upperFile ||
      ledgerEntry.resolution.variants[0].transform !== candidate.transform ||
      ledgerEntry.resolution.variants[0].derivation !== 'none'
    ) {
      throw new Error(`Thick-wall horizontal repeat accepted-source boundary drift at mask_${candidate.maskIndex}`);
    }
  }

  for (const index of gate.baselineMaskRows) {
    const resolution = EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution;
    if (
      (resolution.kind !== 'direct-reuse' && resolution.kind !== 'approved-derivation') ||
      resolution.status !== 'accepted-source-mapping'
    ) {
      throw new Error(`Thick-wall horizontal repeat baseline drift at mask_${index}`);
    }
  }

  if (
    gate.maskRowsUnderReview.length !== 0 ||
    JSON.stringify(gate.maskRowsAccepted) !== JSON.stringify([31, 38]) ||
    JSON.stringify(gate.reviewCellSizes) !== JSON.stringify([240, 90, 40]) ||
    JSON.stringify(gate.reviewBlockWidths) !== JSON.stringify([2, 3, 4, 6]) ||
    gate.renderingDecision.kind !== 'two-authored-fixed-light-horizontal-source-pairs' ||
    gate.renderingDecision.scope !== 'external-proof-source-bank' ||
    gate.renderingDecision.sourceDirectory !== 'assets/walls/quota-co-building-system-proofs/thick-wall-horizontal-repeat' ||
    JSON.stringify(gate.renderingDecision.authoredSourceFiles) !== JSON.stringify([
      'filled_n_middle-base.svg',
      'filled_n_middle-upper.svg',
      'filled_s_middle-base.svg',
      'filled_s_middle-upper.svg',
    ]) ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['direct-reuse'] !== 25 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['approved-derivation'] !== 17 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['synthetic-assembly'] !== 5 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['unresolved-authored-geometry'] !== 0
  ) {
    throw new Error('Thick-wall horizontal repeat evidence boundary drift');
  }

  if (
    gate.contract || gate.rotationAllowed || gate.xMirrorRequired || gate.yMirrorAllowed ||
    gate.productionRegistration || gate.productionTopologyMutation || gate.schemaChange ||
    gate.exportable || gate.committedAtlas || !gate.temporaryFrameIds
  ) {
    throw new Error('Thick-wall horizontal repeat gate crossed the proof-only production boundary');
  }
}

validateEqualHeightThickWallHorizontalRepeatGate();
