import { BLOB_CONFIGS, configForIndex } from '../../src/tiles/blob';
import { EQUAL_HEIGHT_MASK_LEDGER } from './equalHeightMaskLedger';
import type { EqualHeightWallTransform } from './equalHeightWallDirection';

/**
 * Owner-accepted proof-layer gate for the vertical one-link family.
 *
 * The north- and south-facing ends are separately authored fixed-light
 * sources. Each is accepted on the east wall through the already accepted
 * whole-cell X mirror. This promotes source provenance for mask_1 and
 * mask_4 only; it does not register frames, alter the exporter, or authorize
 * production topology.
 */

export type EqualHeightVerticalTerminusLayer = 'base' | 'upper' | 'composed';
export type EqualHeightVerticalTerminusWallSide = 'west' | 'east';

export interface EqualHeightVerticalTerminusCase {
  readonly maskId: 'mask_1' | 'mask_4';
  readonly index: 1 | 4;
  readonly canonicalMask: 0x01 | 0x04;
  readonly connectedEdge: 'n' | 's';
  readonly capFacing: 's' | 'n';
  readonly sourceStem: 'vertical_s_terminus' | 'vertical_n_terminus';
  readonly baseFile: 'vertical_s_terminus-base.svg' | 'vertical_n_terminus-base.svg';
  readonly upperFile: 'vertical_s_terminus-upper.svg' | 'vertical_n_terminus-upper.svg';
  readonly projectedRead: 'foreground-wall-rollover' | 'rear-wall-rollover';
  readonly label: string;
}

export interface EqualHeightVerticalTerminusFacing {
  readonly wallSide: EqualHeightVerticalTerminusWallSide;
  readonly transform: EqualHeightWallTransform;
  readonly status: 'accepted-west-source' | 'accepted-x-mirror-derivation';
  readonly label: string;
}

export interface EqualHeightVerticalTerminusRunCell {
  readonly position: number;
  readonly role: 'body' | 'terminus';
  readonly baseFile: string;
  readonly upperFile: string;
  readonly transform: EqualHeightWallTransform;
}

export interface EqualHeightVerticalTerminusEvidenceRun {
  readonly maskId: EqualHeightVerticalTerminusCase['maskId'];
  readonly wallSide: EqualHeightVerticalTerminusWallSide;
  readonly bodyLength: 1 | 3 | 6;
  readonly cellSize: 90 | 40;
  readonly totalCells: 2 | 4 | 7;
  readonly pixelWidth: 90 | 40;
  readonly pixelHeight: number;
  readonly order: 'body-then-terminus' | 'terminus-then-body';
}

export const EQUAL_HEIGHT_VERTICAL_TERMINUS_GATE = {
  stem: 'equal-height-vertical-terminus-gate',
  version: 0,
  status: 'owner-accepted-vertical-terminus-gate',
  contract: false,
  canvas: 128,
  sourceDirectory: 'assets/walls/quota-co-building-system-proofs/vertical-terminus',
  bodySource: {
    sourceStem: 'full_w_straight',
    baseFile: 'full_w_straight-base.svg',
    upperFile: 'full_w_straight-upper.svg',
  },
  cases: [
    {
      maskId: 'mask_1',
      index: 1,
      canonicalMask: 0x01,
      connectedEdge: 'n',
      capFacing: 's',
      sourceStem: 'vertical_s_terminus',
      baseFile: 'vertical_s_terminus-base.svg',
      upperFile: 'vertical_s_terminus-upper.svg',
      projectedRead: 'foreground-wall-rollover',
      label: 'connected N · end S · tri-tone foreground rollover',
    },
    {
      maskId: 'mask_4',
      index: 4,
      canonicalMask: 0x04,
      connectedEdge: 's',
      capFacing: 'n',
      sourceStem: 'vertical_n_terminus',
      baseFile: 'vertical_n_terminus-base.svg',
      upperFile: 'vertical_n_terminus-upper.svg',
      projectedRead: 'rear-wall-rollover',
      label: 'connected S · end N · cream-led rear rollover',
    },
  ] as const satisfies readonly EqualHeightVerticalTerminusCase[],
  facings: [
    {
      wallSide: 'west',
      transform: 'none',
      status: 'accepted-west-source',
      label: 'west accepted source',
    },
    {
      wallSide: 'east',
      transform: 'mirror-x',
      status: 'accepted-x-mirror-derivation',
      label: 'east accepted mirror-X',
    },
  ] as const satisfies readonly EqualHeightVerticalTerminusFacing[],
  socketAuditLayers: ['base', 'upper', 'composed'] as const satisfies readonly EqualHeightVerticalTerminusLayer[],
  reviewCellSizes: [90, 40] as const,
  bodyRunLengths: [1, 3, 6] as const,
  minimumSegmentBodyLengths: [0, 1] as const,
  ledgerRowsUnderReview: [] as const,
  ledgerRowsAccepted: [1, 4] as const,
  rotationAllowed: false,
  yMirrorAllowed: false,
  xMirrorAccepted: true,
  productionRegistration: false,
  productionTopologyMutation: false,
  schemaChange: false,
  exportable: false,
  committedAtlas: false,
  temporaryFrameIds: true,
} as const;

const caseFor = (index: 1 | 4): EqualHeightVerticalTerminusCase => {
  const candidate = EQUAL_HEIGHT_VERTICAL_TERMINUS_GATE.cases.find((entry) => entry.index === index);
  if (!candidate) throw new Error(`Unknown vertical terminus source mask_${index}`);
  return candidate;
};

const transformFor = (
  wallSide: EqualHeightVerticalTerminusWallSide,
): EqualHeightWallTransform => wallSide === 'west' ? 'none' : 'mirror-x';

export function equalHeightVerticalTerminusRun(
  index: 1 | 4,
  bodyLength: 1 | 3 | 6,
  wallSide: EqualHeightVerticalTerminusWallSide,
): readonly EqualHeightVerticalTerminusRunCell[] {
  const gate = EQUAL_HEIGHT_VERTICAL_TERMINUS_GATE;
  const candidate = caseFor(index);
  const transform = transformFor(wallSide);
  const body = (position: number): EqualHeightVerticalTerminusRunCell => ({
    position,
    role: 'body',
    baseFile: gate.bodySource.baseFile,
    upperFile: gate.bodySource.upperFile,
    transform,
  });
  const terminus = (position: number): EqualHeightVerticalTerminusRunCell => ({
    position,
    role: 'terminus',
    baseFile: candidate.baseFile,
    upperFile: candidate.upperFile,
    transform,
  });
  return index === 1
    ? [
        ...Array.from({ length: bodyLength }, (_, position) => body(position)),
        terminus(bodyLength),
      ]
    : [
        terminus(0),
        ...Array.from({ length: bodyLength }, (_, offset) => body(offset + 1)),
      ];
}

/** Two exposed wall ends with zero or one accepted straight cell between them. */
export function equalHeightVerticalTerminusMinimumSegment(
  bodyLength: 0 | 1,
  wallSide: EqualHeightVerticalTerminusWallSide,
): readonly EqualHeightVerticalTerminusRunCell[] {
  const northCap = caseFor(4);
  const southCap = caseFor(1);
  const transform = transformFor(wallSide);
  return [
    {
      position: 0,
      role: 'terminus',
      baseFile: northCap.baseFile,
      upperFile: northCap.upperFile,
      transform,
    },
    ...Array.from({ length: bodyLength }, (_, offset) => ({
      position: offset + 1,
      role: 'body' as const,
      baseFile: EQUAL_HEIGHT_VERTICAL_TERMINUS_GATE.bodySource.baseFile,
      upperFile: EQUAL_HEIGHT_VERTICAL_TERMINUS_GATE.bodySource.upperFile,
      transform,
    })),
    {
      position: bodyLength + 1,
      role: 'terminus',
      baseFile: southCap.baseFile,
      upperFile: southCap.upperFile,
      transform,
    },
  ];
}

export function equalHeightVerticalTerminusEvidenceRuns(): readonly EqualHeightVerticalTerminusEvidenceRun[] {
  const gate = EQUAL_HEIGHT_VERTICAL_TERMINUS_GATE;
  return gate.cases.flatMap((candidate) =>
    gate.facings.flatMap((facing) =>
      gate.bodyRunLengths.flatMap((bodyLength) =>
        gate.reviewCellSizes.map((cellSize) => ({
          maskId: candidate.maskId,
          wallSide: facing.wallSide,
          bodyLength,
          cellSize,
          totalCells: (bodyLength + 1) as 2 | 4 | 7,
          pixelWidth: cellSize,
          pixelHeight: (bodyLength + 1) * cellSize,
          order: candidate.index === 1 ? 'body-then-terminus' : 'terminus-then-body',
        })),
      ),
    ),
  );
}

/** Fail loudly if this accepted proof loses provenance or crosses into production. */
export function validateEqualHeightVerticalTerminusGate(
  gate = EQUAL_HEIGHT_VERTICAL_TERMINUS_GATE,
): void {
  if (gate.status !== 'owner-accepted-vertical-terminus-gate') {
    throw new Error(`Vertical terminus gate has invalid status ${gate.status}`);
  }
  if (gate.cases.length !== 2 || gate.facings.length !== 2) {
    throw new Error('Vertical terminus gate must expose two authored wall ends and two lateral facings');
  }
  for (const candidate of gate.cases) {
    if (
      candidate.maskId !== `mask_${candidate.index}` ||
      candidate.canonicalMask !== BLOB_CONFIGS[candidate.index]
    ) {
      throw new Error(`Vertical terminus mask identity drift at ${candidate.maskId}`);
    }
    const config = configForIndex(candidate.index);
    const connected = (['n', 'e', 's', 'w'] as const).filter((edge) => config[edge]);
    if (connected.length !== 1 || connected[0] !== candidate.connectedEdge) {
      throw new Error(`Vertical terminus connectivity drift at ${candidate.maskId}`);
    }
    const ledgerEntry = EQUAL_HEIGHT_MASK_LEDGER.entries[candidate.index];
    if (
      ledgerEntry.topologyClass !== 'terminus' ||
      JSON.stringify(ledgerEntry.connectedEdges) !== JSON.stringify([candidate.connectedEdge]) ||
      ledgerEntry.resolution.kind !== 'approved-derivation' ||
      ledgerEntry.resolution.status !== 'accepted-source-mapping' ||
      ledgerEntry.resolution.variants.length !== 2
    ) {
      throw new Error(`Vertical terminus gate ledger status drift at ${candidate.maskId}`);
    }
    const direction = candidate.index === 1 ? 'south' : 'north';
    for (const facing of gate.facings) {
      const variant = ledgerEntry.resolution.variants.find(({ transform }) =>
        transform === facing.transform);
      if (
        !variant ||
        variant.role !== `${facing.wallSide}-${direction}-terminus` ||
        variant.sourceStem !== candidate.sourceStem ||
        variant.baseFile !== candidate.baseFile ||
        variant.upperFile !== candidate.upperFile ||
        variant.derivation !== 'none'
      ) {
        throw new Error(
          `Vertical terminus gate ledger provenance drift at ${candidate.maskId}/${facing.wallSide}`,
        );
      }
    }
  }
  if (
    new Set(gate.cases.map(({ sourceStem }) => sourceStem)).size !== 2 ||
    gate.rotationAllowed || gate.yMirrorAllowed || !gate.xMirrorAccepted || gate.contract ||
    gate.productionRegistration || gate.productionTopologyMutation ||
    gate.schemaChange || gate.exportable || gate.committedAtlas || !gate.temporaryFrameIds ||
    gate.ledgerRowsUnderReview.length !== 0 ||
    JSON.stringify(gate.ledgerRowsAccepted) !== JSON.stringify([1, 4])
  ) {
    throw new Error('Vertical terminus gate crossed the proof-only production boundary');
  }
  if (
    JSON.stringify(gate.reviewCellSizes) !== JSON.stringify([90, 40]) ||
    JSON.stringify(gate.bodyRunLengths) !== JSON.stringify([1, 3, 6]) ||
    JSON.stringify(gate.minimumSegmentBodyLengths) !== JSON.stringify([0, 1]) ||
    JSON.stringify(gate.socketAuditLayers) !== JSON.stringify(['base', 'upper', 'composed'])
  ) {
    throw new Error('Vertical terminus gate evidence matrix drift');
  }
  if (
    JSON.stringify(EQUAL_HEIGHT_MASK_LEDGER.counts) !== JSON.stringify({
      'direct-reuse': 22,
      'approved-derivation': 16,
      'synthetic-assembly': 9,
      'unresolved-authored-geometry': 0,
    })
  ) {
    throw new Error('Vertical terminus gate changed the accepted ledger counts');
  }
  const unresolved = EQUAL_HEIGHT_MASK_LEDGER.entries
    .filter(({ resolution }) => resolution.status === 'unresolved')
    .map(({ index }) => index);
  if (unresolved.length !== 0) {
    throw new Error('Vertical terminus gate changed the unresolved mask set');
  }
  const evidence = equalHeightVerticalTerminusEvidenceRuns();
  if (
    evidence.length !== 24 ||
    new Set(evidence.map(({ maskId, wallSide, bodyLength, cellSize }) =>
      `${maskId}/${wallSide}/${bodyLength}/${cellSize}`)).size !== 24
  ) {
    throw new Error('Vertical terminus gate evidence coverage drift');
  }
  for (const candidate of gate.cases) {
    for (const facing of gate.facings) {
      for (const bodyLength of gate.bodyRunLengths) {
        const run = equalHeightVerticalTerminusRun(candidate.index, bodyLength, facing.wallSide);
        if (
          run.length !== bodyLength + 1 ||
          run.filter(({ role }) => role === 'terminus').length !== 1 ||
          run.some(({ position }, index) => position !== index) ||
          run.some(({ transform }) => transform !== facing.transform)
        ) {
          throw new Error(
              `Vertical terminus gate run drift at ${candidate.maskId}/${facing.wallSide}/${bodyLength}`,
          );
        }
      }
    }
  }
}

validateEqualHeightVerticalTerminusGate();
