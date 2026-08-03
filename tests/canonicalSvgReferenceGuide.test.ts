import { describe, expect, it } from 'vitest';

import { collectCanonicalSvgReferenceInventory } from '../scripts/canonicalSvgReferenceGuide';

describe('canonical SVG reference guide', () => {
  it('covers every live canonical source exactly once and isolates deferred work', async () => {
    const inventory = await collectCanonicalSvgReferenceInventory();
    const { counts, entries, exclusions } = inventory.manifest;

    expect(counts).toMatchObject({
      exactSourceFiles: 404,
      production: 326,
      productionDependencies: 74,
      deferred: 4,
      derivedWallFrames: 47,
    });
    expect(new Set(entries.map((entry) => entry.sourceFile)).size).toBe(
      entries.length,
    );
    expect(
      entries
        .filter((entry) => entry.status === 'deferred')
        .map((entry) => entry.assetId),
    ).toEqual([
      'hvac-condenser',
      'privacy-hedge',
      'surveillance-camera',
      'surveillance-sensor',
    ]);
    expect(
      entries.some((entry) =>
        entry.sourceFile.includes('/part-authoring/scaffolds/'),
      ),
    ).toBe(false);
    expect(
      exclusions.find((entry) =>
        entry.pattern.includes('part-authoring/scaffolds'),
      )?.count,
    ).toBe(113);
    expect(counts.byCategory['props/department-machines']).toBe(67);
    expect(counts.byCategory['props/workhorse']).toBe(54);
    expect(counts.byCategory['characters/accessory']).toBe(3);
    expect(counts.byCategory['characters/outfit']).toBe(83);
    expect(counts.byCategory['props/iris-hardware']).toBe(3);
    expect(counts.byCategory['ui/shared-primitives']).toBe(5);
    expect(counts.byCategory['ui/department-glyphs']).toBe(19);
    expect(
      entries
        .filter((entry) => entry.category === 'props/iris-hardware')
        .every((entry) => entry.status === 'production'),
    ).toBe(true);
    expect(
      entries
        .filter((entry) => entry.category === 'props/department-machines')
        .every((entry) => entry.status === 'production'),
    ).toBe(true);
    expect(
      entries
        .filter((entry) => entry.category === 'ui/shared-primitives')
        .map((entry) => entry.assetId),
    ).toEqual([
      'iris-mark',
      'quotaco-mark',
      'ui-corner',
      'ui-divider',
      'ui-focus',
    ]);
    expect(
      entries
        .filter((entry) => entry.category === 'ui/department-glyphs')
        .map((entry) => entry.assetId),
    ).toEqual([
      'ready-all',
      'ready-connected',
      'ready-designated',
      'ready-equipped',
      'ready-flowing',
      'ready-io',
      'ready-room',
      'ready-staffed',
      'route-input',
      'route-output',
      'route-repair',
      'route-wall-pass',
      'state-blocked',
      'state-complete',
      'state-missing',
      'state-unavailable',
      'work-data-processing',
      'work-delivery',
      'work-intake',
    ]);
  });

  it('shows all 47 wall masks while listing only active SVG dependencies', async () => {
    const inventory = await collectCanonicalSvgReferenceInventory();
    const wallEntries = inventory.manifest.entries.filter((entry) =>
      entry.category.startsWith('walls/'),
    );

    expect(inventory.wallFrames.map((frame) => frame.index)).toEqual(
      Array.from({ length: 47 }, (_, index) => index),
    );
    expect(wallEntries).toHaveLength(74);
    expect(
      wallEntries.filter(
        (entry) => entry.category === 'walls/equal-height-direct',
      ),
    ).toHaveLength(10);
    expect(
      wallEntries.filter(
        (entry) => entry.category === 'walls/equal-height-promoted-proof',
      ),
    ).toHaveLength(52);
    expect(
      wallEntries.filter((entry) => entry.category === 'walls/bevel'),
    ).toHaveLength(12);
  });
});
