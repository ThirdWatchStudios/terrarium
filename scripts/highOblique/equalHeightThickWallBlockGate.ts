import { BLOB_CONFIGS, configForIndex } from '../../src/tiles/blob';
import { EQUAL_HEIGHT_MASK_LEDGER } from './equalHeightMaskLedger';

/**
 * Owner-accepted proof-layer source gate for a completely occupied 2x2 wall block.
 *
 * The four cells keep the accepted exposed-edge laws of the corresponding
 * perimeter corners. Two west fixed-light source pairs recut the buried
 * pocket regions as solid wall top; the east pair uses the approved whole-cell
 * X mirror. This accepts source provenance only and does not register frames,
 * alter the exporter, or authorize production topology.
 */

export type EqualHeightThickWallBlockTransform = 'none' | 'mirror-x';
export type EqualHeightThickWallBlockSourceStem =
  'filled_nw_elbow' | 'filled_sw_elbow';

export interface EqualHeightThickWallBlockCell {
  readonly quadrant: 'northwest' | 'northeast' | 'southwest' | 'southeast';
  readonly col: 0 | 1;
  readonly row: 0 | 1;
  readonly maskIndex: 16 | 20 | 26 | 34;
  readonly controlMaskIndex: 3 | 6 | 9 | 12;
  readonly sourceStem: EqualHeightThickWallBlockSourceStem;
  readonly baseFile: 'filled_nw_elbow-base.svg' | 'filled_sw_elbow-base.svg';
  readonly upperFile: 'filled_nw_elbow-upper.svg' | 'filled_sw_elbow-upper.svg';
  readonly transform: EqualHeightThickWallBlockTransform;
  readonly resolution: 'direct-reuse' | 'approved-derivation';
  readonly derivation: 'none' | 'accepted-southeast-seam-filter';
  readonly seamPolicy: 'source-owned' | 'accepted-southeast-boundary-seam-omission';
}

export const EQUAL_HEIGHT_THICK_WALL_BLOCK_GATE = {
  stem: 'equal-height-thick-wall-block-gate',
  version: 0,
  status: 'owner-accepted-thick-wall-block-gate',
  contract: false,
  topologyClass: 'filled-elbow-family',
  dimensions: { columns: 2, rows: 2 },
  occupiedCells: [[0, 0], [1, 0], [0, 1], [1, 1]] as const,
  cells: [
    {
      quadrant: 'northwest', col: 0, row: 0, maskIndex: 20, controlMaskIndex: 6,
      sourceStem: 'filled_nw_elbow', baseFile: 'filled_nw_elbow-base.svg',
      upperFile: 'filled_nw_elbow-upper.svg', transform: 'none',
      resolution: 'direct-reuse', derivation: 'none', seamPolicy: 'source-owned',
    },
    {
      quadrant: 'northeast', col: 1, row: 0, maskIndex: 26, controlMaskIndex: 12,
      sourceStem: 'filled_nw_elbow', baseFile: 'filled_nw_elbow-base.svg',
      upperFile: 'filled_nw_elbow-upper.svg', transform: 'mirror-x',
      resolution: 'approved-derivation', derivation: 'none', seamPolicy: 'source-owned',
    },
    {
      quadrant: 'southwest', col: 0, row: 1, maskIndex: 16, controlMaskIndex: 3,
      sourceStem: 'filled_sw_elbow', baseFile: 'filled_sw_elbow-base.svg',
      upperFile: 'filled_sw_elbow-upper.svg', transform: 'none',
      resolution: 'direct-reuse', derivation: 'none', seamPolicy: 'source-owned',
    },
    {
      quadrant: 'southeast', col: 1, row: 1, maskIndex: 34, controlMaskIndex: 9,
      sourceStem: 'filled_sw_elbow', baseFile: 'filled_sw_elbow-base.svg',
      upperFile: 'filled_sw_elbow-upper.svg', transform: 'mirror-x',
      resolution: 'approved-derivation', derivation: 'accepted-southeast-seam-filter',
      seamPolicy: 'accepted-southeast-boundary-seam-omission',
    },
  ] as const satisfies readonly EqualHeightThickWallBlockCell[],
  maskRowsUnderReview: [] as const,
  maskRowsAccepted: [16, 20, 26, 34] as const,
  reviewCellSizes: [240, 90, 40] as const,
  renderingDecision: {
    kind: 'two-authored-fixed-light-source-pairs',
    scope: 'external-proof-source-bank',
    sourceDirectory: 'assets/walls/quota-co-building-system-proofs/thick-wall-block',
    authoredSourceFiles: [
      'filled_nw_elbow-base.svg',
      'filled_nw_elbow-upper.svg',
      'filled_sw_elbow-base.svg',
      'filled_sw_elbow-upper.svg',
    ] as const,
    purpose: 'replace buried pocket geometry with four modular solid-top quadrants',
    exteriorOwnership: 'accepted perimeter-corner sources',
    foregroundPlaneBreak: {
      sourceMaskIndex: 16,
      mirroredMaskIndex: 34,
      yStart: 63,
      yEnd: 88,
      paint: '#000000',
      opacity: 0.08,
      kind: 'south-facing-material-shade',
    },
  },
  rotationAllowed: false,
  productionRegistration: false,
  productionTopologyMutation: false,
  schemaChange: false,
  exportable: false,
  committedAtlas: false,
  temporaryFrameIds: true,
} as const;

const expectedSolidCorner: Readonly<Record<16 | 20 | 26 | 34, {
  readonly n: boolean;
  readonly e: boolean;
  readonly s: boolean;
  readonly w: boolean;
  readonly solidCorner: 'ne' | 'se' | 'sw' | 'nw';
}>> = {
  16: { n: true, e: true, s: false, w: false, solidCorner: 'ne' },
  20: { n: false, e: true, s: true, w: false, solidCorner: 'se' },
  26: { n: false, e: false, s: true, w: true, solidCorner: 'sw' },
  34: { n: true, e: false, s: false, w: true, solidCorner: 'nw' },
};

const expectedCandidateSource: Readonly<Record<16 | 20 | 26 | 34, {
  readonly sourceStem: EqualHeightThickWallBlockSourceStem;
  readonly transform: EqualHeightThickWallBlockTransform;
  readonly resolution: EqualHeightThickWallBlockCell['resolution'];
  readonly derivation: EqualHeightThickWallBlockCell['derivation'];
  readonly seamPolicy: EqualHeightThickWallBlockCell['seamPolicy'];
}>> = {
  16: {
    sourceStem: 'filled_sw_elbow', transform: 'none',
    resolution: 'direct-reuse', derivation: 'none', seamPolicy: 'source-owned',
  },
  20: {
    sourceStem: 'filled_nw_elbow', transform: 'none',
    resolution: 'direct-reuse', derivation: 'none', seamPolicy: 'source-owned',
  },
  26: {
    sourceStem: 'filled_nw_elbow', transform: 'mirror-x',
    resolution: 'approved-derivation', derivation: 'none', seamPolicy: 'source-owned',
  },
  34: {
    sourceStem: 'filled_sw_elbow', transform: 'mirror-x',
    resolution: 'approved-derivation', derivation: 'accepted-southeast-seam-filter',
    seamPolicy: 'accepted-southeast-boundary-seam-omission',
  },
};

/** Fail loudly if the accepted proof loses provenance or crosses into production. */
export function validateEqualHeightThickWallBlockGate(
  gate = EQUAL_HEIGHT_THICK_WALL_BLOCK_GATE,
): void {
  if (
    gate.status !== 'owner-accepted-thick-wall-block-gate' ||
    gate.topologyClass !== 'filled-elbow-family' ||
    gate.dimensions.columns !== 2 ||
    gate.dimensions.rows !== 2 ||
    JSON.stringify(gate.occupiedCells) !== JSON.stringify([[0, 0], [1, 0], [0, 1], [1, 1]])
  ) {
    throw new Error('Thick-wall block gate identity drift');
  }

  for (const cell of gate.cells) {
    const expected = expectedSolidCorner[cell.maskIndex];
    const expectedSource = expectedCandidateSource[cell.maskIndex];
    const config = configForIndex(cell.maskIndex);
    if (
      BLOB_CONFIGS[cell.maskIndex] === undefined ||
      config.n !== expected.n ||
      config.e !== expected.e ||
      config.s !== expected.s ||
      config.w !== expected.w ||
      config[expected.solidCorner] !== 'solid' ||
      cell.sourceStem !== expectedSource.sourceStem ||
      cell.transform !== expectedSource.transform ||
      cell.resolution !== expectedSource.resolution ||
      cell.derivation !== expectedSource.derivation ||
      cell.seamPolicy !== expectedSource.seamPolicy ||
      cell.baseFile !== `${cell.sourceStem}-base.svg` ||
      cell.upperFile !== `${cell.sourceStem}-upper.svg`
    ) {
      throw new Error(`Thick-wall block topology drift at mask_${cell.maskIndex}`);
    }

    const candidate = EQUAL_HEIGHT_MASK_LEDGER.entries[cell.maskIndex];
    const control = EQUAL_HEIGHT_MASK_LEDGER.entries[cell.controlMaskIndex];
    if (
      candidate.topologyClass !== 'filled-elbow' ||
      (candidate.resolution.kind !== 'direct-reuse' &&
        candidate.resolution.kind !== 'approved-derivation') ||
      (control.resolution.kind !== 'direct-reuse' && control.resolution.kind !== 'approved-derivation') ||
      control.resolution.status !== 'accepted-source-mapping'
    ) {
      throw new Error(`Thick-wall block provenance drift at mask_${cell.maskIndex}`);
    }
    const variant = candidate.resolution.variants[0];
    if (
      candidate.resolution.kind !== cell.resolution ||
      candidate.resolution.status !== 'accepted-source-mapping' ||
      candidate.resolution.variants.length !== 1 ||
      variant?.sourceStem !== cell.sourceStem ||
      variant.baseFile !== cell.baseFile ||
      variant.upperFile !== cell.upperFile ||
      variant.transform !== cell.transform ||
      variant.derivation !== cell.derivation
    ) {
      throw new Error(`Thick-wall block provenance drift at mask_${cell.maskIndex}`);
    }
  }

  if (
    gate.maskRowsUnderReview.length !== 0 ||
    JSON.stringify(gate.maskRowsAccepted) !== JSON.stringify([16, 20, 26, 34]) ||
    JSON.stringify(gate.reviewCellSizes) !== JSON.stringify([240, 90, 40]) ||
    gate.renderingDecision.kind !== 'two-authored-fixed-light-source-pairs' ||
    gate.renderingDecision.scope !== 'external-proof-source-bank' ||
    gate.renderingDecision.sourceDirectory !== 'assets/walls/quota-co-building-system-proofs/thick-wall-block' ||
    JSON.stringify(gate.renderingDecision.authoredSourceFiles) !== JSON.stringify([
      'filled_nw_elbow-base.svg',
      'filled_nw_elbow-upper.svg',
      'filled_sw_elbow-base.svg',
      'filled_sw_elbow-upper.svg',
    ]) ||
    gate.renderingDecision.foregroundPlaneBreak.sourceMaskIndex !== 16 ||
    gate.renderingDecision.foregroundPlaneBreak.mirroredMaskIndex !== 34 ||
    gate.renderingDecision.foregroundPlaneBreak.yStart !== 63 ||
    gate.renderingDecision.foregroundPlaneBreak.yEnd !== 88 ||
    gate.renderingDecision.foregroundPlaneBreak.paint !== '#000000' ||
    gate.renderingDecision.foregroundPlaneBreak.opacity !== 0.08 ||
    gate.renderingDecision.foregroundPlaneBreak.kind !== 'south-facing-material-shade'
  ) {
    throw new Error('Thick-wall block evidence boundary drift');
  }

  if (
    gate.contract || gate.rotationAllowed || gate.productionRegistration ||
    gate.productionTopologyMutation || gate.schemaChange || gate.exportable ||
    gate.committedAtlas || !gate.temporaryFrameIds
  ) {
    throw new Error('Thick-wall block gate crossed the proof-only production boundary');
  }

  if (
    JSON.stringify(EQUAL_HEIGHT_MASK_LEDGER.counts) !== JSON.stringify({
      'direct-reuse': 24,
      'approved-derivation': 16,
      'synthetic-assembly': 7,
      'unresolved-authored-geometry': 0,
    })
  ) {
    throw new Error('Thick-wall block gate ledger count drift');
  }
}

validateEqualHeightThickWallBlockGate();
