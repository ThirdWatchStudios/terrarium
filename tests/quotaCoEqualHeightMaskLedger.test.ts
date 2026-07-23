import { describe, expect, it } from 'vitest';

import {
  EQUAL_HEIGHT_MASK_LEDGER,
  EQUAL_HEIGHT_MASK_RESOLUTION_KINDS,
  equalHeightMaskContactDescriptor,
  validateEqualHeightMaskLedger,
  type EqualHeightMaskLedger,
  type EqualHeightMaskResolution,
} from '../scripts/highOblique/equalHeightMaskLedger';
import { wallAtlas } from '../src/core/exporter';
import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import { DEFAULT_STYLE, DEFAULT_WALLS } from '../src/data/defaults';
import { PROP_TEMPLATES } from '../src/props/templates';
import {
  BLOB_CONFIGS,
  BLOB_TILE_COUNT,
  blobContract,
  configForIndex,
} from '../src/tiles/blob';
import { FLOOR_TEMPLATES, WALL_TEMPLATES } from '../src/tiles/templates';

function variantsFor(resolution: EqualHeightMaskResolution) {
  if (resolution.kind === 'unresolved-authored-geometry') return [];
  return resolution.kind === 'synthetic-assembly'
    ? resolution.ingredients
    : resolution.variants;
}

function productionSignature(): string {
  return JSON.stringify({
    schemaVersion: CURRENT_SCHEMA_VERSION,
    blob: blobContract(),
    walls: WALL_TEMPLATES.map(({ id }) => id),
    floors: FLOOR_TEMPLATES.map(({ id }) => id),
    props: PROP_TEMPLATES.map(({ id }) => id),
    defaults: DEFAULT_WALLS.map(({ id, templateId }) => ({ id, templateId })),
    wallAtlas: wallAtlas(DEFAULT_WALLS[0], DEFAULT_STYLE, 1),
  });
}

const productionBefore = productionSignature();

describe('QuotaCo owner-accepted proof-layer equal-height 47-mask ledger', () => {
  it('binds every mask index to the unchanged canonical blob contract in exact order', () => {
    expect(EQUAL_HEIGHT_MASK_LEDGER).toMatchObject({
      stem: 'equal-height-47-mask-ledger',
      version: 0,
      blobContractVersion: blobContract().version,
      status: 'owner-accepted-mapping-gate',
      reviewCellSizes: [90, 40],
      productionRegistration: false,
      productionTopologyMutation: false,
      schemaChange: false,
      exportable: false,
      committedAtlas: false,
      temporaryFrameIds: true,
    });
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries).toHaveLength(BLOB_TILE_COUNT);
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries.map(({ id }) => id)).toEqual(
      Array.from({ length: BLOB_TILE_COUNT }, (_, index) => `mask_${index}`),
    );
    expect(EQUAL_HEIGHT_MASK_LEDGER.entries.map(({ index }) => index)).toEqual(
      Array.from({ length: BLOB_TILE_COUNT }, (_, index) => index),
    );
    expect(new Set(EQUAL_HEIGHT_MASK_LEDGER.entries.map(({ id }) => id)).size).toBe(47);
    for (const entry of EQUAL_HEIGHT_MASK_LEDGER.entries) {
      expect(entry.canonicalMask, entry.id).toBe(BLOB_CONFIGS[entry.index]);
      expect(entry.connectivity, entry.id).toEqual(configForIndex(entry.index));
      expect(entry.openings, entry.id).toBe('separate-state-layer');
      expect(entry.paletteMasks, entry.id).toBe('not-covered');
    }
  });

  it('makes the twenty-seven accepted source mappings and their facing provenance explicit', () => {
    const byIndex = new Map(
      EQUAL_HEIGHT_MASK_LEDGER.entries.map((entry) => [entry.index, entry]),
    );
    expect(byIndex.get(0)?.resolution).toMatchObject({
      kind: 'direct-reuse',
      status: 'accepted-source-mapping',
      variants: [{
        role: 'isolated-shell', sourceStem: 'isolated_shell', transform: 'none', derivation: 'none',
      }],
    });
    expect(byIndex.get(3)?.resolution).toMatchObject({
      kind: 'direct-reuse',
      variants: [{ role: 'southwest-corner', sourceStem: 'transition_w_to_s', transform: 'none' }],
    });
    expect(byIndex.get(1)?.resolution).toMatchObject({
      kind: 'approved-derivation',
      variants: [
        { role: 'west-south-terminus', sourceStem: 'vertical_s_terminus', transform: 'none' },
        { role: 'east-south-terminus', sourceStem: 'vertical_s_terminus', transform: 'mirror-x' },
      ],
    });
    expect(byIndex.get(2)?.resolution).toMatchObject({
      kind: 'approved-derivation',
      variants: [{ role: 'west-cap-terminus', sourceStem: 'full_terminus', transform: 'mirror-x' }],
    });
    expect(byIndex.get(6)?.resolution).toMatchObject({
      kind: 'direct-reuse',
      variants: [{ role: 'northwest-corner', sourceStem: 'full_exterior_corner', transform: 'none' }],
    });
    expect(byIndex.get(8)?.resolution).toMatchObject({
      kind: 'direct-reuse',
      variants: [{ role: 'east-cap-terminus', sourceStem: 'full_terminus', transform: 'none' }],
    });
    expect(byIndex.get(10)?.resolution).toMatchObject({
      kind: 'direct-reuse',
      variants: [{ role: 'north-or-south-wall', sourceStem: 'full_n_straight', transform: 'none' }],
    });
    expect(byIndex.get(11)?.resolution).toMatchObject({
      kind: 'direct-reuse',
      status: 'accepted-source-mapping',
      variants: [{
        role: 'open-south-t-junction', sourceStem: 'open_s_t_junction',
        baseFile: 'open_s_t_junction-base.svg', upperFile: 'open_s_t_junction-upper.svg',
        transform: 'none', derivation: 'none',
      }],
    });
    expect(byIndex.get(14)?.resolution).toMatchObject({
      kind: 'direct-reuse',
      status: 'accepted-source-mapping',
      variants: [{
        role: 'open-north-t-junction', sourceStem: 'open_n_t_junction',
        baseFile: 'open_n_t_junction-base.svg', upperFile: 'open_n_t_junction-upper.svg',
        transform: 'none', derivation: 'none',
      }],
    });
    expect(byIndex.get(5)?.resolution).toMatchObject({
      kind: 'approved-derivation',
      variants: [
        { role: 'west-wall', sourceStem: 'full_w_straight', transform: 'none' },
        { role: 'east-wall', sourceStem: 'full_w_straight', transform: 'mirror-x' },
      ],
    });
    expect(byIndex.get(9)?.resolution).toMatchObject({
      kind: 'approved-derivation',
      variants: [{
        role: 'southeast-corner',
        sourceStem: 'transition_w_to_s',
        transform: 'mirror-x',
        derivation: 'accepted-southeast-seam-filter',
      }],
    });
    expect(byIndex.get(12)?.resolution).toMatchObject({
      kind: 'approved-derivation',
      variants: [{ role: 'northeast-corner', sourceStem: 'full_exterior_corner', transform: 'mirror-x' }],
    });
    expect(byIndex.get(4)?.resolution).toMatchObject({
      kind: 'approved-derivation',
      variants: [
        { role: 'west-north-terminus', sourceStem: 'vertical_n_terminus', transform: 'none' },
        { role: 'east-north-terminus', sourceStem: 'vertical_n_terminus', transform: 'mirror-x' },
      ],
    });
    expect(byIndex.get(16)?.resolution).toMatchObject({
      kind: 'direct-reuse',
      variants: [{ role: 'filled-southwest-elbow', sourceStem: 'filled_sw_elbow', transform: 'none', derivation: 'none' }],
    });
    expect(byIndex.get(17)?.resolution).toMatchObject({
      kind: 'direct-reuse',
      status: 'accepted-source-mapping',
      variants: [{
        role: 'partial-west-foreground-t-junction',
        sourceStem: 'open_w_t_filled_ne',
        baseFile: 'open_w_t_filled_ne-base.svg',
        upperFile: 'open_w_t_filled_ne-upper.svg',
        transform: 'none',
        derivation: 'none',
      }],
    });
    expect(byIndex.get(20)?.resolution).toMatchObject({
      kind: 'direct-reuse',
      variants: [{ role: 'filled-northwest-elbow', sourceStem: 'filled_nw_elbow', transform: 'none', derivation: 'none' }],
    });
    expect(byIndex.get(21)?.resolution).toMatchObject({
      kind: 'direct-reuse',
      status: 'accepted-source-mapping',
      variants: [{
        role: 'partial-west-rear-t-junction',
        sourceStem: 'open_w_t_filled_se',
        baseFile: 'open_w_t_filled_se-base.svg',
        upperFile: 'open_w_t_filled_se-upper.svg',
        transform: 'none',
        derivation: 'none',
      }],
    });
    expect(byIndex.get(27)?.resolution).toMatchObject({
      kind: 'approved-derivation',
      status: 'accepted-source-mapping',
      variants: [{
        role: 'partial-east-rear-t-junction',
        sourceStem: 'open_w_t_filled_se',
        baseFile: 'open_w_t_filled_se-base.svg',
        upperFile: 'open_w_t_filled_se-upper.svg',
        transform: 'mirror-x',
        derivation: 'none',
      }],
    });
    expect(byIndex.get(36)?.resolution).toMatchObject({
      kind: 'approved-derivation',
      status: 'accepted-source-mapping',
      variants: [{
        role: 'partial-east-foreground-t-junction',
        sourceStem: 'open_w_t_filled_ne',
        baseFile: 'open_w_t_filled_ne-base.svg',
        upperFile: 'open_w_t_filled_ne-upper.svg',
        transform: 'mirror-x',
        derivation: 'accepted-southeast-seam-filter',
      }],
    });
    expect(byIndex.get(26)?.resolution).toMatchObject({
      kind: 'approved-derivation',
      variants: [{ role: 'filled-northeast-elbow', sourceStem: 'filled_nw_elbow', transform: 'mirror-x', derivation: 'none' }],
    });
    expect(byIndex.get(34)?.resolution).toMatchObject({
      kind: 'approved-derivation',
      variants: [{
        role: 'filled-southeast-elbow', sourceStem: 'filled_sw_elbow', transform: 'mirror-x',
        derivation: 'accepted-southeast-seam-filter',
      }],
    });
    expect(byIndex.get(24)?.resolution).toMatchObject({
      kind: 'direct-reuse',
      variants: [{
        role: 'filled-west-middle-spine', sourceStem: 'filled_w_middle',
        transform: 'none', derivation: 'none',
      }],
    });
    expect(byIndex.get(42)?.resolution).toMatchObject({
      kind: 'approved-derivation',
      variants: [{
        role: 'filled-east-middle-spine', sourceStem: 'filled_w_middle',
        transform: 'mirror-x', derivation: 'none',
      }],
    });
    expect(byIndex.get(31)?.resolution).toMatchObject({
      kind: 'direct-reuse',
      status: 'accepted-source-mapping',
      variants: [{
        role: 'filled-north-middle-spine',
        sourceStem: 'filled_n_middle',
        baseFile: 'filled_n_middle-base.svg',
        upperFile: 'filled_n_middle-upper.svg',
        transform: 'none',
        derivation: 'none',
      }],
    });
    expect(byIndex.get(38)?.resolution).toMatchObject({
      kind: 'direct-reuse',
      status: 'accepted-source-mapping',
      variants: [{
        role: 'filled-south-middle-spine',
        sourceStem: 'filled_s_middle',
        baseFile: 'filled_s_middle-base.svg',
        upperFile: 'filled_s_middle-upper.svg',
        transform: 'none',
        derivation: 'none',
      }],
    });

    const resolved = EQUAL_HEIGHT_MASK_LEDGER.entries
      .filter(({ resolution }) =>
        resolution.kind === 'direct-reuse' || resolution.kind === 'approved-derivation')
      .map(({ index }) => index);
    expect(resolved).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 20, 21, 24, 26, 27, 31, 34, 36, 38, 42]);
    expect(byIndex.get(5)?.resolution).toMatchObject({
      note: expect.stringContaining('explicit facing input'),
    });
    expect(byIndex.get(10)?.resolution).toMatchObject({
      note: expect.stringContaining('both north and south'),
    });
  });

  it('keeps synthetic obligations honest after closing every authored-source gap', () => {
    expect(EQUAL_HEIGHT_MASK_LEDGER.counts).toEqual({
      'direct-reuse': 15,
      'approved-derivation': 12,
      'synthetic-assembly': 20,
      'unresolved-authored-geometry': 0,
    });
    expect(
      EQUAL_HEIGHT_MASK_RESOLUTION_KINDS.reduce(
        (sum, kind) => sum + EQUAL_HEIGHT_MASK_LEDGER.counts[kind],
        0,
      ),
    ).toBe(47);

    const unresolved = EQUAL_HEIGHT_MASK_LEDGER.entries
      .filter(({ resolution }) => resolution.kind === 'unresolved-authored-geometry');
    expect(unresolved).toEqual([]);

    const synthetic = EQUAL_HEIGHT_MASK_LEDGER.entries
      .filter(({ resolution }) => resolution.kind === 'synthetic-assembly');
    expect(synthetic).toHaveLength(20);
    expect(synthetic.filter(({ topologyClass }) => topologyClass === 'filled-elbow')).toHaveLength(0);
    expect(synthetic.filter(({ topologyClass }) => topologyClass === 't-junction')).toHaveLength(4);
    expect(synthetic
      .filter(({ topologyClass }) => topologyClass === 't-junction')
      .map(({ index }) => index)).toEqual([18, 22, 28, 35]);
    expect(synthetic.filter(({ topologyClass }) => topologyClass === 'cross-junction')).toHaveLength(16);
    for (const entry of synthetic) {
      expect(entry.resolution).toMatchObject({
        status: 'proof-only-candidate',
        requirement: expect.any(String),
      });
      expect(variantsFor(entry.resolution).length, entry.id).toBeGreaterThan(0);
    }

    expect(
      EQUAL_HEIGHT_MASK_LEDGER.entries
        .filter(({ resolution }) => resolution.status === 'accepted-source-mapping'),
    ).toHaveLength(27);
    expect(
      EQUAL_HEIGHT_MASK_LEDGER.entries
        .filter(({ resolution }) => resolution.status === 'proof-only-candidate'),
    ).toHaveLength(20);
    expect(
      EQUAL_HEIGHT_MASK_LEDGER.entries
        .filter(({ resolution }) => resolution.status === 'unresolved'),
    ).toHaveLength(0);

    const allSourceFiles = EQUAL_HEIGHT_MASK_LEDGER.entries.flatMap(({ resolution }) =>
      variantsFor(resolution).flatMap(({ baseFile, upperFile }) => [baseFile, upperFile]));
    expect(allSourceFiles.join('\n')).not.toMatch(
      /low-profile-correction|\/topology\/|full_[se]_straight|transition_e_to_s/i,
    );
    expect(new Set(allSourceFiles)).toEqual(new Set([
      'isolated_shell-base.svg',
      'isolated_shell-upper.svg',
      'full_n_straight-base.svg',
      'full_n_straight-upper.svg',
      'full_w_straight-base.svg',
      'full_w_straight-upper.svg',
      'full_terminus-base.svg',
      'full_terminus-upper.svg',
      'vertical_s_terminus-base.svg',
      'vertical_s_terminus-upper.svg',
      'vertical_n_terminus-base.svg',
      'vertical_n_terminus-upper.svg',
      'full_exterior_corner-base.svg',
      'full_exterior_corner-upper.svg',
      'transition_w_to_s-base.svg',
      'transition_w_to_s-upper.svg',
      'filled_nw_elbow-base.svg',
      'filled_nw_elbow-upper.svg',
      'filled_sw_elbow-base.svg',
      'filled_sw_elbow-upper.svg',
      'filled_w_middle-base.svg',
      'filled_w_middle-upper.svg',
      'filled_n_middle-base.svg',
      'filled_n_middle-upper.svg',
      'filled_s_middle-base.svg',
      'filled_s_middle-upper.svg',
      'open_w_t_junction-base.svg',
      'open_w_t_junction-upper.svg',
      'open_s_t_junction-base.svg',
      'open_s_t_junction-upper.svg',
      'open_n_t_junction-base.svg',
      'open_n_t_junction-upper.svg',
      'open_w_t_filled_ne-base.svg',
      'open_w_t_filled_ne-upper.svg',
      'open_w_t_filled_se-base.svg',
      'open_w_t_filled_se-upper.svg',
    ]));
  });

  it('fails loudly on missing, duplicated, drifted, forbidden, or over-promoted rows', () => {
    const clone = (): EqualHeightMaskLedger => structuredClone(EQUAL_HEIGHT_MASK_LEDGER);

    const missing = clone() as any;
    missing.entries.pop();
    expect(() => validateEqualHeightMaskLedger(missing)).toThrow(/46 entries; expected 47/);

    const duplicated = clone() as any;
    duplicated.entries[1].id = 'mask_0';
    expect(() => validateEqualHeightMaskLedger(duplicated)).toThrow(/duplicates mask_0/);

    const canonicalDrift = clone() as any;
    canonicalDrift.entries[3].canonicalMask = 255;
    expect(() => validateEqualHeightMaskLedger(canonicalDrift)).toThrow(/canonical mask drift at mask_3/);

    const topologyDrift = clone() as any;
    topologyDrift.entries[3].connectedEdges = ['n'];
    expect(() => validateEqualHeightMaskLedger(topologyDrift)).toThrow(/topology classification drift at mask_3/);

    const forbidden = clone() as any;
    forbidden.entries[10].resolution.variants[0].baseFile = 'low-profile-correction/low-s-straight.svg';
    expect(() => validateEqualHeightMaskLedger(forbidden)).toThrow(/forbidden source.*mask_10/);

    const crossPaired = clone() as any;
    crossPaired.entries[10].resolution.variants[0].upperFile = 'full_w_straight-upper.svg';
    expect(() => validateEqualHeightMaskLedger(crossPaired)).toThrow(/forbidden source variant.*mask_10/);

    const unresolvedWithoutReason = clone() as any;
    unresolvedWithoutReason.entries[0].resolution = {
      kind: 'unresolved-authored-geometry', status: 'unresolved', reason: '',
    };
    expect(() => validateEqualHeightMaskLedger(unresolvedWithoutReason)).toThrow(/unresolved reason at mask_0/);

    const ambiguous = clone() as any;
    ambiguous.entries[0].resolution.ingredients = [];
    expect(() => validateEqualHeightMaskLedger(ambiguous)).toThrow(/multiple resolution strategies at mask_0/);

    const countDrift = clone() as any;
    countDrift.counts['synthetic-assembly'] = 35;
    countDrift.counts['unresolved-authored-geometry'] = 6;
    expect(() => validateEqualHeightMaskLedger(countDrift)).toThrow(/synthetic-assembly count drift/);

    const promoted = clone() as any;
    promoted.exportable = true;
    expect(() => validateEqualHeightMaskLedger(promoted)).toThrow(/proof-only production boundary/);

    const demotedEnvelope = clone() as any;
    demotedEnvelope.status = 'proof-only-review';
    expect(() => validateEqualHeightMaskLedger(demotedEnvelope)).toThrow(/invalid promotion status/);

    const overclaimedSynthetic = clone() as any;
    overclaimedSynthetic.entries[15].resolution.status = 'accepted-source-mapping';
    expect(() => validateEqualHeightMaskLedger(overclaimedSynthetic)).toThrow(
      /synthetic assembly has invalid status at mask_15/,
    );

    const demotedDirect = clone() as any;
    demotedDirect.entries[3].resolution.status = 'proof-only-candidate';
    expect(() => validateEqualHeightMaskLedger(demotedDirect)).toThrow(
      /direct reuse has invalid status at mask_3/,
    );

    const overclaimedGap = clone() as any;
    overclaimedGap.entries[0].resolution = {
      kind: 'unresolved-authored-geometry',
      status: 'accepted-source-mapping',
      reason: 'test-only invalid unresolved row',
    };
    expect(() => validateEqualHeightMaskLedger(overclaimedGap)).toThrow(
      /unresolved geometry has invalid status at mask_0/,
    );
  });

  it('describes one disposable canonical-order contact sheet and no atlas contract', () => {
    const descriptor = equalHeightMaskContactDescriptor();
    expect(descriptor).toMatchObject({
      stem: 'equal-height-47-mask-ledger',
      columns: 6,
      rows: 8,
      checksum: {
        column: 5,
        row: 7,
        label: '47/47 · no missing or duplicate indices',
      },
      contract: false,
      productionRegistration: false,
      exportable: false,
    });
    expect(descriptor.panels).toHaveLength(47);
    expect(descriptor.panels.map(({ entry }) => entry.id)).toEqual(
      Array.from({ length: 47 }, (_, index) => `mask_${index}`),
    );
    expect(descriptor.panels.at(-1)).toMatchObject({ column: 4, row: 7 });
    expect(JSON.stringify(equalHeightMaskContactDescriptor()))
      .toBe(JSON.stringify(equalHeightMaskContactDescriptor()));
  });

  it('leaves production templates, frame ids, schema, and exporter output unchanged', () => {
    validateEqualHeightMaskLedger(EQUAL_HEIGHT_MASK_LEDGER);
    equalHeightMaskContactDescriptor();
    expect(productionSignature()).toBe(productionBefore);
    expect(CURRENT_SCHEMA_VERSION).toBe(18);
    expect(blobContract()).toMatchObject({ version: 1, tileCount: 47 });
    expect(Object.keys(wallAtlas(DEFAULT_WALLS[0], DEFAULT_STYLE, 1).frames)).toEqual(
      Array.from({ length: BLOB_TILE_COUNT }, (_, index) => `mask_${index}`),
    );
    const productionIds = [
      ...WALL_TEMPLATES.map(({ id }) => id),
      ...FLOOR_TEMPLATES.map(({ id }) => id),
      ...PROP_TEMPLATES.map(({ id }) => id),
    ].join('\n');
    expect(productionIds).not.toMatch(/equal-height-47-mask-ledger|synthetic-contact/i);
  });
});
