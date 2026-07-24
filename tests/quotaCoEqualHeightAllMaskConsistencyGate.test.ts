import { describe, expect, it } from 'vitest';

import {
  EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE,
  validateEqualHeightAllMaskConsistencyGate,
} from '../scripts/highOblique/equalHeightAllMaskConsistencyGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from '../scripts/highOblique/equalHeightMaskLedger';
import { wallAtlas } from '../src/core/exporter';
import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import { DEFAULT_STYLE, DEFAULT_WALLS } from '../src/data/defaults';
import { PROP_TEMPLATES } from '../src/props/templates';
import { blobContract } from '../src/tiles/blob';
import { FLOOR_TEMPLATES, WALL_TEMPLATES } from '../src/tiles/templates';

function productionSignature(): string {
  return JSON.stringify({
    schemaVersion: CURRENT_SCHEMA_VERSION,
    blob: blobContract(),
    walls: WALL_TEMPLATES.map(({ id }) => id),
    floors: FLOOR_TEMPLATES.map(({ id }) => id),
    props: PROP_TEMPLATES.map(({ id }) => id),
    defaults: DEFAULT_WALLS.map(({ id, templateId }) => ({
      id,
      templateId,
    })),
    wallAtlas: wallAtlas(DEFAULT_WALLS[0], DEFAULT_STYLE, 1),
  });
}

describe('QuotaCo all-47 equal-height consistency review', () => {
  it('covers every accepted row without reopening the ledger', () => {
    expect(() => validateEqualHeightAllMaskConsistencyGate()).not.toThrow();
    expect(EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE).toMatchObject({
      stem: 'equal-height-47-mask-consistency-review',
      previewStem: 'equal-height-47-mask-consistency-review-preview',
      status: 'review-only-all-mask-consistency-gate',
      acceptedLedgerStatus: 'owner-accepted-mapping-gate',
      reviewCellSizes: [240, 90, 40],
      reviewExtents: [1, 3, 6],
      reviewGrounds: ['light', 'dark'],
      fullRasterWidth: 4480,
      previewRasterWidth: 960,
      fullRasterPixelBudget: 45_000_000,
      previewRasterPixelBudget: 2_100_000,
      acceptedLedgerCounts: {
        'direct-reuse': 28,
        'approved-derivation': 19,
        'synthetic-assembly': 0,
        'unresolved-authored-geometry': 0,
      },
    });
    expect(EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.reviewedMaskRows).toEqual(
      Array.from({ length: 47 }, (_, index) => index),
    );
    expect(EQUAL_HEIGHT_MASK_LEDGER.status).toBe(
      'owner-accepted-mapping-gate',
    );
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
      'direct-reuse': 28,
      'approved-derivation': 19,
      'synthetic-assembly': 0,
      'unresolved-authored-geometry': 0,
    });
  });

  it('partitions the whole vocabulary by accepted topology', () => {
    const rows =
      EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.topologyGroups.flatMap(
        ({ maskRows }) => maskRows,
      );
    expect([...rows].sort((left, right) => left - right)).toEqual(
      Array.from({ length: 47 }, (_, index) => index),
    );
    expect(new Set(rows)).toHaveLength(47);
    for (const { topologyClass, maskRows } of
      EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.topologyGroups) {
      expect(
        maskRows.map(
          (index) => EQUAL_HEIGHT_MASK_LEDGER.entries[index].topologyClass,
        ),
      ).toEqual(maskRows.map(() => topologyClass));
    }
  });

  it('accounts for all 19 derived rows and all 50 visual presentations', () => {
    const derivedRows = EQUAL_HEIGHT_MASK_LEDGER.entries
      .filter(({ resolution }) => resolution.kind === 'approved-derivation')
      .map(({ index }) => index);
    const coveredRows = [
      ...EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.internalFacingMasks,
      ...EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.derivationPairs.map(
        ({ derivedMask }) => derivedMask,
      ),
    ].sort((left, right) => left - right);
    const presentationCount = EQUAL_HEIGHT_MASK_LEDGER.entries.reduce(
      (total, { resolution }) =>
        total +
        (resolution.kind === 'direct-reuse' ||
        resolution.kind === 'approved-derivation'
          ? resolution.variants.length
          : 0),
      0,
    );

    expect(coveredRows).toEqual(derivedRows);
    expect(presentationCount).toBe(50);
    expect(
      EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE.derivationPairs.filter(
        ({ operation }) => operation.includes('filter'),
      ),
    ).toHaveLength(6);
  });

  it('keeps every production boundary locked during review', () => {
    const before = productionSignature();
    validateEqualHeightAllMaskConsistencyGate();
    expect(productionSignature()).toBe(before);
    expect(EQUAL_HEIGHT_ALL_MASK_CONSISTENCY_GATE).toMatchObject({
      ledgerMutation: false,
      proofSourceMutation: false,
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
    });
  });
});
