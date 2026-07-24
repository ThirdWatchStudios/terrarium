import { BLOB_CONFIGS, configForIndex } from '../../src/tiles/blob';
import { EQUAL_HEIGHT_MASK_LEDGER } from './equalHeightMaskLedger';

/**
 * Owner-accepted proof-layer gate for canonical mask_0.
 *
 * This accepts one self-contained structural wall shell with zero cardinal
 * sockets and records its source provenance in the accepted mapping ledger.
 * It does not register frames, alter the exporter, or authorize production
 * topology.
 */

export type EqualHeightIsolatedShellLayer = 'base' | 'upper' | 'composed';

export interface EqualHeightIsolatedShellContext {
  readonly id: 'single-3x3' | 'diagonal-pair-2x2';
  readonly columns: 2 | 3;
  readonly rows: 2 | 3;
  readonly positions: readonly (readonly [number, number])[];
  readonly cellSizes: readonly (40 | 90)[];
  readonly purpose: string;
}

export const EQUAL_HEIGHT_ISOLATED_SHELL_GATE = {
  stem: 'equal-height-isolated-shell-gate',
  version: 0,
  status: 'owner-accepted-isolated-shell-gate',
  contract: false,
  canvas: 128,
  maskId: 'mask_0',
  index: 0,
  canonicalMask: 0x00,
  topologyClass: 'isolated',
  connectedEdges: [] as const,
  exposedEdges: ['n', 'e', 's', 'w'] as const,
  sourceDirectory: 'assets/walls/quota-co-building-system-proofs/isolated-shell',
  sourceStem: 'isolated_shell',
  baseFile: 'isolated_shell-base.svg',
  upperFile: 'isolated_shell-upper.svg',
  transform: 'none',
  reviewLayers: ['base', 'upper', 'composed'] as const satisfies readonly EqualHeightIsolatedShellLayer[],
  reviewCellSizes: [240, 90, 40] as const,
  floorChecks: ['light', 'dark'] as const,
  contexts: [
    {
      id: 'single-3x3',
      columns: 3,
      rows: 3,
      positions: [[1, 1]],
      cellSizes: [90, 40],
      purpose: 'one occupied cell reads as a deliberate structural catalog item',
    },
    {
      id: 'diagonal-pair-2x2',
      columns: 2,
      rows: 2,
      positions: [[0, 0], [1, 1]],
      cellSizes: [90, 40],
      purpose: 'adjacent proof cells remain two separate zero-link shells',
    },
  ] as const satisfies readonly EqualHeightIsolatedShellContext[],
  ledgerRowsUnderReview: [] as const,
  ledgerRowsAccepted: [0] as const,
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

/** Fail loudly if the accepted proof loses provenance or crosses into production. */
export function validateEqualHeightIsolatedShellGate(
  gate = EQUAL_HEIGHT_ISOLATED_SHELL_GATE,
): void {
  if (
    gate.status !== 'owner-accepted-isolated-shell-gate' ||
    gate.maskId !== 'mask_0' ||
    gate.index !== 0 ||
    gate.canonicalMask !== BLOB_CONFIGS[0] ||
    gate.topologyClass !== 'isolated'
  ) {
    throw new Error('Isolated shell gate identity drift');
  }
  const config = configForIndex(0);
  const connected = (['n', 'e', 's', 'w'] as const).filter((edge) => config[edge]);
  if (
    connected.length !== 0 ||
    gate.connectedEdges.length !== 0 ||
    JSON.stringify(gate.exposedEdges) !== JSON.stringify(['n', 'e', 's', 'w'])
  ) {
    throw new Error('Isolated shell gate must expose all four edges and connect to none');
  }

  const ledgerEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[0];
  if (
    ledgerEntry.id !== 'mask_0' ||
    ledgerEntry.topologyClass !== 'isolated' ||
    ledgerEntry.connectedEdges.length !== 0 ||
    ledgerEntry.resolution.kind !== 'direct-reuse' ||
    ledgerEntry.resolution.status !== 'accepted-source-mapping' ||
    ledgerEntry.resolution.variants.length !== 1 ||
    ledgerEntry.resolution.variants[0].role !== 'isolated-shell' ||
    ledgerEntry.resolution.variants[0].sourceStem !== gate.sourceStem ||
    ledgerEntry.resolution.variants[0].baseFile !== gate.baseFile ||
    ledgerEntry.resolution.variants[0].upperFile !== gate.upperFile ||
    ledgerEntry.resolution.variants[0].transform !== 'none' ||
    ledgerEntry.resolution.variants[0].derivation !== 'none'
  ) {
    throw new Error('Isolated shell gate ledger provenance drift');
  }
  if (
    JSON.stringify(EQUAL_HEIGHT_MASK_LEDGER.counts) !== JSON.stringify({
    'direct-reuse': 25,
      'approved-derivation': 17,
    'synthetic-assembly': 5,
      'unresolved-authored-geometry': 0,
    })
  ) {
    throw new Error('Isolated shell gate changed the accepted ledger counts');
  }
  const unresolved = EQUAL_HEIGHT_MASK_LEDGER.entries
    .filter(({ resolution }) => resolution.status === 'unresolved')
    .map(({ index }) => index);
  if (unresolved.length !== 0) {
    throw new Error('Isolated shell gate left an unresolved mask row');
  }

  if (
    gate.sourceStem !== 'isolated_shell' ||
    gate.baseFile !== 'isolated_shell-base.svg' ||
    gate.upperFile !== 'isolated_shell-upper.svg' ||
    gate.transform !== 'none' ||
    gate.rotationAllowed || gate.xMirrorAllowed || gate.yMirrorAllowed ||
    gate.contract ||
    gate.productionRegistration || gate.productionTopologyMutation ||
    gate.schemaChange || gate.exportable || gate.committedAtlas || !gate.temporaryFrameIds ||
    gate.ledgerRowsUnderReview.length !== 0 ||
    JSON.stringify(gate.ledgerRowsAccepted) !== JSON.stringify([0])
  ) {
    throw new Error('Isolated shell gate crossed the proof-only production boundary');
  }
  if (
    JSON.stringify(gate.reviewLayers) !== JSON.stringify(['base', 'upper', 'composed']) ||
    JSON.stringify(gate.reviewCellSizes) !== JSON.stringify([240, 90, 40]) ||
    JSON.stringify(gate.floorChecks) !== JSON.stringify(['light', 'dark']) ||
    gate.contexts.length !== 2 ||
    gate.contexts[0].positions.length !== 1 ||
    gate.contexts[1].positions.length !== 2
  ) {
    throw new Error('Isolated shell gate evidence matrix drift');
  }
}

validateEqualHeightIsolatedShellGate();
