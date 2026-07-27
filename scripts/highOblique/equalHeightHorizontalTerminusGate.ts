import { BLOB_CONFIGS, configForIndex } from '../../src/tiles/blob';
import { EQUAL_HEIGHT_MASK_LEDGER } from './equalHeightMaskLedger';
import type { EqualHeightWallTransform } from './equalHeightWallDirection';

/**
 * Owner-accepted proof-layer gate for the two horizontal one-link cases.
 * This promotes source provenance for mask_8 and mask_2 only; it does not
 * register frames or alter the exporter. The vertical ends are owned by their
 * later, separate accepted gate and never derived by rotating this source.
 */

export type EqualHeightHorizontalTerminusLayer = 'base' | 'upper' | 'composed';

export interface EqualHeightHorizontalTerminusCase {
  readonly maskId: 'mask_8' | 'mask_2';
  readonly index: 8 | 2;
  readonly canonicalMask: 0x08 | 0x02;
  readonly connectedEdge: 'w' | 'e';
  readonly capFacing: 'e' | 'w';
  readonly resolution: 'direct-reuse' | 'approved-derivation';
  readonly transform: EqualHeightWallTransform;
  readonly label: string;
}

export interface EqualHeightHorizontalTerminusEvidenceRun {
  readonly maskId: EqualHeightHorizontalTerminusCase['maskId'];
  readonly bodyLength: 1 | 3 | 6;
  readonly cellSize: 90 | 40;
  readonly totalCells: 2 | 4 | 7;
  readonly pixelWidth: number;
  readonly pixelHeight: 90 | 40;
  readonly order: 'body-then-terminus' | 'terminus-then-body';
}

export interface EqualHeightHorizontalTerminusRunCell {
  readonly position: number;
  readonly role: 'body' | 'terminus';
  readonly baseFile: string;
  readonly upperFile: string;
  readonly transform: EqualHeightWallTransform;
}

export const EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE = {
  stem: 'equal-height-horizontal-terminus-gate',
  version: 0,
  status: 'owner-accepted-horizontal-terminus-gate',
  contract: false,
  canvas: 128,
  bodySource: {
    sourceStem: 'full_n_straight',
    baseFile: 'full_n_straight-base.svg',
    upperFile: 'full_n_straight-upper.svg',
    transform: 'none' as EqualHeightWallTransform,
  },
  terminusSource: {
    sourceStem: 'full_terminus',
    baseFile: 'full_terminus-base.svg',
    upperFile: 'full_terminus-upper.svg',
    mirrorAxis: 64,
    mirrorMatrix: 'matrix(-1 0 0 1 128 0)',
    pivot: { x: 0.5, y: 0.5 },
  },
  cases: [
    {
      maskId: 'mask_8',
      index: 8,
      canonicalMask: 0x08,
      connectedEdge: 'w',
      capFacing: 'e',
      resolution: 'direct-reuse',
      transform: 'none',
      label: 'run from W · cap E',
    },
    {
      maskId: 'mask_2',
      index: 2,
      canonicalMask: 0x02,
      connectedEdge: 'e',
      capFacing: 'w',
      resolution: 'approved-derivation',
      transform: 'mirror-x',
      label: 'run from E · cap W',
    },
  ] as const satisfies readonly EqualHeightHorizontalTerminusCase[],
  socketAuditLayers: ['base', 'upper', 'composed'] as const satisfies readonly EqualHeightHorizontalTerminusLayer[],
  reviewCellSizes: [90, 40] as const,
  bodyRunLengths: [1, 3, 6] as const,
  verticalSuccessors: [
    { maskId: 'mask_1', index: 1, connectedEdge: 'n', status: 'resolved-by-separate-vertical-gate' },
    { maskId: 'mask_4', index: 4, connectedEdge: 's', status: 'resolved-by-separate-vertical-gate' },
  ] as const,
  rotationAllowed: false,
  sourceMutationScope: 'accepted-socket-polish',
  ledgerRowsAccepted: [2, 8] as const,
  productionRegistration: false,
  productionTopologyMutation: false,
  schemaChange: false,
  exportable: false,
  committedAtlas: false,
  temporaryFrameIds: true,
} as const;

export function equalHeightHorizontalTerminusRun(
  index: 2 | 8,
  bodyLength: 1 | 3 | 6,
): readonly EqualHeightHorizontalTerminusRunCell[] {
  const gate = EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE;
  if (index === 8) {
    return [
      ...Array.from({ length: bodyLength }, (_, position) => ({
        position,
        role: 'body' as const,
        ...gate.bodySource,
      })),
      {
        position: bodyLength,
        role: 'terminus' as const,
        baseFile: gate.terminusSource.baseFile,
        upperFile: gate.terminusSource.upperFile,
        transform: 'none' as const,
      },
    ];
  }
  return [
    {
      position: 0,
      role: 'terminus' as const,
      baseFile: gate.terminusSource.baseFile,
      upperFile: gate.terminusSource.upperFile,
      transform: 'mirror-x' as const,
    },
    ...Array.from({ length: bodyLength }, (_, offset) => ({
      position: offset + 1,
      role: 'body' as const,
      ...gate.bodySource,
    })),
  ];
}

export function equalHeightHorizontalTerminusEvidenceRuns(): readonly EqualHeightHorizontalTerminusEvidenceRun[] {
  return EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE.cases.flatMap((candidate) =>
    EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE.bodyRunLengths.flatMap((bodyLength) =>
      EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE.reviewCellSizes.map((cellSize) => ({
        maskId: candidate.maskId,
        bodyLength,
        cellSize,
        totalCells: (bodyLength + 1) as 2 | 4 | 7,
        pixelWidth: (bodyLength + 1) * cellSize,
        pixelHeight: cellSize,
        order: candidate.index === 8 ? 'body-then-terminus' : 'terminus-then-body',
      })),
    ),
  );
}

/** Fail loudly if this accepted proof drifts beyond its two rows or loses topology truth. */
export function validateEqualHeightHorizontalTerminusGate(
  gate = EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE,
): void {
  if (gate.status !== 'owner-accepted-horizontal-terminus-gate') {
    throw new Error(`Horizontal terminus gate has invalid status ${gate.status}`);
  }
  if (gate.cases.length !== 2) {
    throw new Error(`Horizontal terminus gate has ${gate.cases.length} cases; expected 2`);
  }
  for (const candidate of gate.cases) {
    const candidateId: string = candidate.maskId;
    if (candidate.maskId !== `mask_${candidate.index}`) {
      throw new Error(`Horizontal terminus gate id/index drift at ${candidate.maskId}`);
    }
    if (candidate.canonicalMask !== BLOB_CONFIGS[candidate.index]) {
      throw new Error(`Horizontal terminus gate canonical mask drift at ${candidate.maskId}`);
    }
    const config = configForIndex(candidate.index);
    const connected = (['n', 'e', 's', 'w'] as const).filter((edge) => config[edge]);
    if (connected.length !== 1 || connected[0] !== candidate.connectedEdge) {
      throw new Error(`Horizontal terminus gate connectivity drift at ${candidate.maskId}`);
    }
    if (
      (candidate.index === 8 && (
        candidate.transform !== 'none' ||
        candidate.resolution !== 'direct-reuse' ||
        candidate.capFacing !== 'e'
      )) ||
      (candidate.index === 2 && (
        candidate.transform !== 'mirror-x' ||
        candidate.resolution !== 'approved-derivation' ||
        candidate.capFacing !== 'w'
      ))
    ) {
      throw new Error(`Horizontal terminus gate transform/facing drift at ${candidateId}`);
    }
    const ledgerEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[candidate.index];
    const expectedRole = candidate.index === 8 ? 'east-cap-terminus' : 'west-cap-terminus';
    const expectedFacingRule = candidate.index === 8
      ? 'connected west; exposed molded cap faces east'
      : 'connected east; exposed molded cap faces west through the accepted whole-cell X mirror';
    if (
      ledgerEntry.resolution.kind !== candidate.resolution ||
      ledgerEntry.resolution.status !== 'accepted-source-mapping' ||
      ledgerEntry.resolution.variants.length !== 1 ||
      ledgerEntry.topologyClass !== 'terminus' ||
      JSON.stringify(ledgerEntry.connectedEdges) !== JSON.stringify([candidate.connectedEdge]) ||
      ledgerEntry.resolution.variants[0].role !== expectedRole ||
      ledgerEntry.resolution.variants[0].sourceStem !== gate.terminusSource.sourceStem ||
      ledgerEntry.resolution.variants[0].baseFile !== gate.terminusSource.baseFile ||
      ledgerEntry.resolution.variants[0].upperFile !== gate.terminusSource.upperFile ||
      ledgerEntry.resolution.variants[0].transform !== candidate.transform ||
      ledgerEntry.resolution.variants[0].derivation !== 'none' ||
      ledgerEntry.resolution.variants[0].facingRule !== expectedFacingRule
    ) {
      throw new Error(`Horizontal terminus gate ledger provenance drift at ${candidate.maskId}`);
    }
  }
  if (
    gate.rotationAllowed || gate.contract || gate.productionRegistration ||
    gate.productionTopologyMutation || gate.schemaChange || gate.exportable ||
    gate.committedAtlas || !gate.temporaryFrameIds
  ) {
    throw new Error('Horizontal terminus gate crossed the proof-only boundary');
  }
  if (
    JSON.stringify(gate.reviewCellSizes) !== JSON.stringify([90, 40]) ||
    JSON.stringify(gate.bodyRunLengths) !== JSON.stringify([1, 3, 6]) ||
    JSON.stringify(gate.socketAuditLayers) !== JSON.stringify(['base', 'upper', 'composed']) ||
    JSON.stringify(gate.ledgerRowsAccepted) !== JSON.stringify([2, 8]) ||
    JSON.stringify(gate.verticalSuccessors.map(({ index }) => index)) !== JSON.stringify([1, 4])
  ) {
    throw new Error('Horizontal terminus gate evidence matrix drift');
  }
  for (const { index, connectedEdge } of gate.verticalSuccessors) {
    const entry = EQUAL_HEIGHT_MASK_LEDGER.entries[index];
    if (
      entry.topologyClass !== 'terminus' ||
      JSON.stringify(entry.connectedEdges) !== JSON.stringify([connectedEdge]) ||
      entry.resolution.kind !== 'approved-derivation' ||
      entry.resolution.status !== 'accepted-source-mapping' ||
      entry.resolution.variants.some(({ sourceStem }) =>
        sourceStem === gate.terminusSource.sourceStem)
    ) {
      throw new Error(`Horizontal terminus gate vertical successor drift at mask_${index}`);
    }
  }
  const isolatedEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[0];
  if (
    isolatedEntry.resolution.kind !== 'direct-reuse' ||
    isolatedEntry.resolution.status !== 'accepted-source-mapping' ||
    isolatedEntry.resolution.variants.length !== 1 ||
    isolatedEntry.resolution.variants[0].sourceStem !== 'isolated_shell' ||
    isolatedEntry.resolution.variants[0].transform !== 'none' ||
    isolatedEntry.resolution.variants[0].derivation !== 'none'
  ) {
    throw new Error('Horizontal terminus gate crossed the isolated-source boundary');
  }
  const evidence = equalHeightHorizontalTerminusEvidenceRuns();
  if (evidence.length !== 12 || new Set(evidence.map((run) =>
    `${run.maskId}/${run.bodyLength}/${run.cellSize}`)).size !== 12) {
    throw new Error('Horizontal terminus gate evidence run coverage drift');
  }
  for (const candidate of gate.cases) {
    for (const bodyLength of gate.bodyRunLengths) {
      const run = equalHeightHorizontalTerminusRun(candidate.index, bodyLength);
      if (
        run.length !== bodyLength + 1 ||
        run.filter(({ role }) => role === 'terminus').length !== 1 ||
        run.some(({ position }, index) => position !== index)
      ) {
        throw new Error(`Horizontal terminus gate run assembly drift at ${candidate.maskId}/${bodyLength}`);
      }
    }
  }
}

validateEqualHeightHorizontalTerminusGate();
