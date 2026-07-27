import {
  BLOB_CONFIGS,
  NB,
  blobIndex,
  configForIndex,
} from '../../src/tiles/blob';
import { EQUAL_HEIGHT_MASK_LEDGER } from './equalHeightMaskLedger';
import { EQUAL_HEIGHT_THICK_WALL_BLOCK_GATE } from './equalHeightThickWallBlockGate';
import { EQUAL_HEIGHT_THICK_WALL_HORIZONTAL_REPEAT_GATE } from './equalHeightThickWallHorizontalRepeatGate';
import { EQUAL_HEIGHT_THICK_WALL_REPEAT_GATE } from './equalHeightThickWallRepeatGate';

/**
 * Owner-accepted proof-layer gate for mask_46, the fully buried center of a
 * solid wall mass.
 */

export type EqualHeightFullyFilledCrossJunctionMask = 46;
export type EqualHeightFullyFilledCrossJunctionMatrixMask =
  | 16 | 20 | 24 | 26 | 31 | 34 | 38 | 42 | 46;
export type EqualHeightFullyFilledCrossJunctionMatrix =
  readonly (
    readonly EqualHeightFullyFilledCrossJunctionMatrixMask[]
  )[];

export interface EqualHeightFullyFilledCrossJunctionCandidate {
  readonly maskIndex: EqualHeightFullyFilledCrossJunctionMask;
  readonly sourceMaskIndex: EqualHeightFullyFilledCrossJunctionMask;
  readonly sourceStem: 'filled_center';
  readonly baseFile: 'filled_center-base.svg';
  readonly upperFile: 'filled_center-upper.svg';
  readonly connectedEdges: readonly ['n', 'e', 's', 'w'];
  readonly openPockets: readonly [];
  readonly solidDiagonals: readonly ['ne', 'se', 'sw', 'nw'];
  readonly fixedLightRole: 'fully-buried-solid-center';
  readonly transform: 'none';
  readonly derivation: 'none';
  readonly resolution: 'direct-reuse';
}

const THREE_BY_THREE_MATRIX = [
  [20, 31, 26],
  [24, 46, 42],
  [16, 38, 34],
] as const satisfies EqualHeightFullyFilledCrossJunctionMatrix;

const FOUR_BY_FOUR_MATRIX = [
  [20, 31, 31, 26],
  [24, 46, 46, 42],
  [24, 46, 46, 42],
  [16, 38, 38, 34],
] as const satisfies EqualHeightFullyFilledCrossJunctionMatrix;

const SIX_BY_SIX_MATRIX = [
  [20, 31, 31, 31, 31, 26],
  [24, 46, 46, 46, 46, 42],
  [24, 46, 46, 46, 46, 42],
  [24, 46, 46, 46, 46, 42],
  [24, 46, 46, 46, 46, 42],
  [16, 38, 38, 38, 38, 34],
] as const satisfies EqualHeightFullyFilledCrossJunctionMatrix;

export const EQUAL_HEIGHT_FULLY_FILLED_CROSS_JUNCTION_GATE = {
  stem: 'equal-height-fully-filled-cross-junction-gate',
  version: 0,
  status: 'owner-accepted-fully-filled-cross-junction-gate',
  contract: false,
  topologyClass: 'fully-filled-cross-junction',
  candidate: {
    maskIndex: 46,
    sourceMaskIndex: 46,
    sourceStem: 'filled_center',
    baseFile: 'filled_center-base.svg',
    upperFile: 'filled_center-upper.svg',
    connectedEdges: ['n', 'e', 's', 'w'],
    openPockets: [],
    solidDiagonals: ['ne', 'se', 'sw', 'nw'],
    fixedLightRole: 'fully-buried-solid-center',
    transform: 'none',
    derivation: 'none',
    resolution: 'direct-reuse',
  } as const satisfies EqualHeightFullyFilledCrossJunctionCandidate,
  threeByThreeMatrix: THREE_BY_THREE_MATRIX,
  fourByFourMatrix: FOUR_BY_FOUR_MATRIX,
  sixBySixMatrix: SIX_BY_SIX_MATRIX,
  geometryControlMaskRows: [33, 41, 44, 45] as const,
  boundaryControlMaskRows: [16, 20, 24, 26, 31, 34, 38, 42] as const,
  maskRowsUnderReview: [] as const,
  maskRowsAccepted: [46] as const,
  reviewCellSizes: [240, 90, 40] as const,
  reviewBlockSizes: [3, 4, 6] as const,
  reviewGrounds: ['light', 'dark'] as const,
  renderingDecision: {
    kind: 'one-accepted-authored-fully-buried-center-source-pair',
    scope: 'external-proof-source-bank',
    sourceDirectory:
      'assets/walls/quota-co-building-system-proofs/fully-filled-cross-junction',
    authoredSourceFiles: [
      'filled_center-base.svg',
      'filled_center-upper.svg',
    ] as const,
    sourceCanvas: 128,
    sourceAuthorship: 'flattened-fixed-view-no-transform',
    sourceRelationship:
      'new-flat-center-derived-from-accepted-mass-laws-not-a-pixel-stack',
    geometryControlPolicy:
      'accepted single-open masks constrain the final occupied crook transition but contribute no source pixels',
    boundaryControlPolicy:
      'accepted masks 16/20/24/26/31/34/38/42 own every visible perimeter face and constrain all four full-cell joins',
    composition:
      'one buried charcoal underlay plus one uninterrupted full-cell cream top; never stack horizontal and vertical middle sources',
    purpose:
      'fill the center of a three-by-three-or-larger solid wall mass without introducing an internal seam or face',
    requiredRead:
      'one continuous molded cream slab whose center disappears into every accepted surrounding cell',
    shadePolicy:
      'mask_46 owns no local contour, highlight, coral, green, south-face shade, plinth, arris, return, or service seam because every edge is buried',
    forbiddenRead:
      'charcoal lattice, coping belt, fascia, south-face shade, center post, peak, hourglass, stair-step, doubled outline, duplicate color belt, or viewport hairline',
  },
  acceptedLedgerCounts: {
    'direct-reuse': 28,
    'approved-derivation': 19,
    'synthetic-assembly': 0,
    'unresolved-authored-geometry': 0,
  },
  directSourceAccepted: true,
  xMirrorAllowed: false,
  yMirrorAllowed: false,
  rotationAllowed: false,
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
} as const;

const NEIGHBORS = [
  [NB.N, 0, -1],
  [NB.E, 1, 0],
  [NB.S, 0, 1],
  [NB.W, -1, 0],
  [NB.NE, 1, -1],
  [NB.SE, 1, 1],
  [NB.SW, -1, 1],
  [NB.NW, -1, -1],
] as const;

function expectedSolidBlockMatrix(
  size: 3 | 4 | 6,
): EqualHeightFullyFilledCrossJunctionMatrix {
  const occupied = (column: number, row: number): boolean =>
    column >= 0 && row >= 0 && column < size && row < size;
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) => {
      let raw = 0;
      for (const [bit, dx, dy] of NEIGHBORS) {
        if (occupied(column + dx, row + dy)) raw |= bit;
      }
      return blobIndex(raw) as EqualHeightFullyFilledCrossJunctionMatrixMask;
    }),
  );
}

function validateBlockMatrix(
  label: string,
  matrix: EqualHeightFullyFilledCrossJunctionMatrix,
  size: 3 | 4 | 6,
): void {
  if (
    matrix.length !== size ||
    matrix.some((row) => row.length !== size) ||
    JSON.stringify(matrix) !==
      JSON.stringify(expectedSolidBlockMatrix(size))
  ) {
    throw new Error(
      `Fully filled cross-junction ${label} matrix drift`,
    );
  }
}

/** Fail loudly if the accepted mask_46 proof-layer source mapping drifts. */
export function validateEqualHeightFullyFilledCrossJunctionGate(
  gate = EQUAL_HEIGHT_FULLY_FILLED_CROSS_JUNCTION_GATE,
): void {
  if (
    gate.stem !==
      'equal-height-fully-filled-cross-junction-gate' ||
    gate.status !==
      'owner-accepted-fully-filled-cross-junction-gate' ||
    gate.topologyClass !== 'fully-filled-cross-junction' ||
    gate.candidate.maskIndex !== 46 ||
    gate.candidate.sourceMaskIndex !== 46 ||
    gate.candidate.sourceStem !== 'filled_center' ||
    gate.candidate.baseFile !== 'filled_center-base.svg' ||
    gate.candidate.upperFile !== 'filled_center-upper.svg' ||
    JSON.stringify(gate.candidate.connectedEdges) !==
      JSON.stringify(['n', 'e', 's', 'w']) ||
    gate.candidate.openPockets.length !== 0 ||
    JSON.stringify(gate.candidate.solidDiagonals) !==
      JSON.stringify(['ne', 'se', 'sw', 'nw']) ||
    gate.candidate.fixedLightRole !==
      'fully-buried-solid-center' ||
    gate.candidate.transform !== 'none' ||
    gate.candidate.derivation !== 'none' ||
    gate.candidate.resolution !== 'direct-reuse' ||
    JSON.stringify(gate.geometryControlMaskRows) !==
      JSON.stringify([33, 41, 44, 45]) ||
    JSON.stringify(gate.boundaryControlMaskRows) !==
      JSON.stringify([16, 20, 24, 26, 31, 34, 38, 42]) ||
    gate.maskRowsUnderReview.length !== 0 ||
    JSON.stringify(gate.maskRowsAccepted) !== JSON.stringify([46]) ||
    JSON.stringify(gate.reviewCellSizes) !==
      JSON.stringify([240, 90, 40]) ||
    JSON.stringify(gate.reviewBlockSizes) !==
      JSON.stringify([3, 4, 6]) ||
    JSON.stringify(gate.reviewGrounds) !==
      JSON.stringify(['light', 'dark'])
  ) {
    throw new Error('Fully filled cross-junction gate identity drift');
  }

  validateBlockMatrix(
    'three-by-three',
    gate.threeByThreeMatrix,
    3,
  );
  validateBlockMatrix(
    'four-by-four',
    gate.fourByFourMatrix,
    4,
  );
  validateBlockMatrix(
    'six-by-six',
    gate.sixBySixMatrix,
    6,
  );

  const targetEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[46];
  if (
    BLOB_CONFIGS[46] !== 0xff ||
    JSON.stringify(configForIndex(46)) !== JSON.stringify({
      n: true,
      e: true,
      s: true,
      w: true,
      ne: 'solid',
      se: 'solid',
      sw: 'solid',
      nw: 'solid',
    }) ||
    targetEntry.topologyClass !== 'cross-junction' ||
    JSON.stringify(targetEntry.connectedEdges) !==
      JSON.stringify(['n', 'e', 's', 'w']) ||
    targetEntry.exposedEdges.length !== 0 ||
    targetEntry.pockets.length !== 0 ||
    JSON.stringify(targetEntry.solidDiagonals) !==
      JSON.stringify(['ne', 'se', 'sw', 'nw']) ||
    targetEntry.resolution.kind !== 'direct-reuse' ||
    targetEntry.resolution.status !== 'accepted-source-mapping' ||
    targetEntry.resolution.variants.length !== 1 ||
    targetEntry.resolution.variants[0].role !==
      'fully-filled-cross-junction' ||
    targetEntry.resolution.variants[0].sourceStem !== 'filled_center' ||
    targetEntry.resolution.variants[0].transform !== 'none' ||
    targetEntry.resolution.variants[0].derivation !== 'none'
  ) {
    throw new Error(
      'Fully filled cross-junction accepted-ledger boundary drift',
    );
  }

  const acceptedBoundaryRows = [
    ...EQUAL_HEIGHT_THICK_WALL_BLOCK_GATE.maskRowsAccepted,
    ...EQUAL_HEIGHT_THICK_WALL_REPEAT_GATE.maskRowsAccepted,
    ...EQUAL_HEIGHT_THICK_WALL_HORIZONTAL_REPEAT_GATE.maskRowsAccepted,
  ].sort((left, right) => left - right);
  if (
    JSON.stringify(acceptedBoundaryRows) !==
      JSON.stringify([...gate.boundaryControlMaskRows].sort(
        (left, right) => left - right,
      ))
  ) {
    throw new Error(
      'Fully filled cross-junction accepted boundary-family drift',
    );
  }
  for (const index of [
    ...gate.geometryControlMaskRows,
    ...gate.boundaryControlMaskRows,
  ]) {
    const resolution = EQUAL_HEIGHT_MASK_LEDGER.entries[index].resolution;
    if (
      (resolution.kind !== 'direct-reuse' &&
        resolution.kind !== 'approved-derivation') ||
      resolution.status !== 'accepted-source-mapping'
    ) {
      throw new Error(
        `Fully filled cross-junction accepted-control drift at mask_${index}`,
      );
    }
  }

  if (
    JSON.stringify(gate.acceptedLedgerCounts) !==
      JSON.stringify(EQUAL_HEIGHT_MASK_LEDGER.counts) ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['direct-reuse'] !== 28 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['approved-derivation'] !== 19 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts['synthetic-assembly'] !== 0 ||
    EQUAL_HEIGHT_MASK_LEDGER.counts[
      'unresolved-authored-geometry'
    ] !== 0
  ) {
    throw new Error(
      'Fully filled cross-junction ledger-count boundary drift',
    );
  }

  if (
    gate.renderingDecision.kind !==
      'one-accepted-authored-fully-buried-center-source-pair' ||
    gate.renderingDecision.scope !== 'external-proof-source-bank' ||
    gate.renderingDecision.sourceDirectory !==
      'assets/walls/quota-co-building-system-proofs/fully-filled-cross-junction' ||
    JSON.stringify(gate.renderingDecision.authoredSourceFiles) !==
      JSON.stringify([
        'filled_center-base.svg',
        'filled_center-upper.svg',
      ]) ||
    gate.renderingDecision.sourceCanvas !== 128 ||
    gate.renderingDecision.sourceAuthorship !==
      'flattened-fixed-view-no-transform' ||
    gate.renderingDecision.sourceRelationship !==
      'new-flat-center-derived-from-accepted-mass-laws-not-a-pixel-stack'
  ) {
    throw new Error(
      'Fully filled cross-junction rendering-decision drift',
    );
  }

  if (
    gate.contract ||
    !gate.directSourceAccepted ||
    gate.xMirrorAllowed ||
    gate.yMirrorAllowed ||
    gate.rotationAllowed ||
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
      'Fully filled cross-junction gate crossed the accepted proof-layer production boundary',
    );
  }
}

validateEqualHeightFullyFilledCrossJunctionGate();
