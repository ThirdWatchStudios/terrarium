import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import { DEFAULT_FLOORS, DEFAULT_GROUND } from '../src/data/defaults';
import {
  MAINTAINED_HYBRID_FLOOR_IDS,
  MAINTAINED_HYBRID_GRASS_IDS,
  maintainedHybridSurfaceSvg,
  renderQuotaCoFloorGrassHybridRefinement,
} from '../scripts/quotaCoFloorGrassHybridRefinementPreview';

describe('QuotaCo Maintained Hybrid floor and grass refinement', () => {
  it('covers every existing floor and the three existing grass instances', () => {
    expect(MAINTAINED_HYBRID_FLOOR_IDS).toEqual(
      DEFAULT_FLOORS.map(({ id }) => id),
    );
    expect(MAINTAINED_HYBRID_GRASS_IDS).toEqual([
      'ground-grass',
      'ground-grass-b',
      'ground-grass-c',
    ]);
    expect(
      MAINTAINED_HYBRID_GRASS_IDS.every((id) =>
        DEFAULT_GROUND.some((target) => target.id === id),
      ),
    ).toBe(true);
  });

  it('renders every proof surface as a clean one-cell SVG at close and far scale', () => {
    for (const id of [
      ...MAINTAINED_HYBRID_FLOOR_IDS,
      ...MAINTAINED_HYBRID_GRASS_IDS,
    ]) {
      const source = maintainedHybridSurfaceSvg(id);
      expect(source).toContain('viewBox="0 0 128 128"');
      expect(source).not.toMatch(/<script|<foreignObject|<text/i);
      const close = new Resvg(source).render();
      const far = new Resvg(source, {
        fitTo: { mode: 'width', value: 40 },
      }).render();
      expect(close.width, id).toBe(128);
      expect(close.height, id).toBe(128);
      expect(close.asPng().byteLength, id).toBeGreaterThan(250);
      expect(far.width, id).toBe(40);
      expect(far.height, id).toBe(40);
      expect(far.asPng().byteLength, id).toBeGreaterThan(120);
    }
  });

  it('writes the complete-family visual gate without production promotion', async () => {
    const output = await mkdtemp(
      path.join(os.tmpdir(), 'quota-floor-grass-hybrid-refinement-'),
    );
    const result = await renderQuotaCoFloorGrassHybridRefinement(output);
    const metrics = JSON.parse(await readFile(result.metricsPath, 'utf8')) as {
      reviewStatus: string;
      approvedDirection: string;
      sourceStatus: string;
      inventory: {
        interiorFloorInstanceCount: number;
        targetInteriorFloorIds: string[];
        targetGrassGroundIds: string[];
        newIdsCreated: number;
      };
      refinements: {
        allTargetInstancesRendered: boolean;
        mixedGrassVariantField: boolean;
        largeRepeatedGrassPatchesRemoved: boolean;
      };
      held: {
        authoringCanvas: number;
        acceptedWallDatum: number;
        characterVisualScale: number;
        floorGroundCharacterMultiplierApplied: boolean;
        schemaVersion: number;
        productionSourceCreation: boolean;
        templateDefaultMutation: boolean;
        snapshotPromotion: boolean;
        exporterMutation: boolean;
        schemaMutation: boolean;
        unityRegistrationMutation: boolean;
        bundleExportImport: boolean;
        commitCreated: boolean;
      };
      deferred: {
        grassFringe: {
          currentOwnership: string;
          autotileFrames: number;
        };
      };
    };

    expect(metrics).toMatchObject({
      reviewStatus: 'approved-direction-complete-family-refinement',
      approvedDirection: 'maintained-hybrid',
      sourceStatus: 'proof-code-only',
      inventory: {
        interiorFloorInstanceCount: 12,
        targetInteriorFloorIds: [...MAINTAINED_HYBRID_FLOOR_IDS],
        targetGrassGroundIds: [...MAINTAINED_HYBRID_GRASS_IDS],
        newIdsCreated: 0,
      },
      refinements: {
        allTargetInstancesRendered: true,
        mixedGrassVariantField: true,
        largeRepeatedGrassPatchesRemoved: true,
      },
      held: {
        authoringCanvas: 128,
        acceptedWallDatum: 112,
        characterVisualScale: 0.65,
        floorGroundCharacterMultiplierApplied: false,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        productionSourceCreation: false,
        templateDefaultMutation: false,
        snapshotPromotion: false,
        exporterMutation: false,
        schemaMutation: false,
        unityRegistrationMutation: false,
        bundleExportImport: false,
        commitCreated: false,
      },
      deferred: {
        grassFringe: {
          currentOwnership: 'derived-code',
          autotileFrames: 47,
        },
      },
    });

    const svg = await readFile(result.svgPath, 'utf8');
    expect(svg).toContain('Maintained Hybrid refinement');
    expect(svg).toContain('COMPLETE FAMILY');
    expect(svg).toContain('MIXED GRASS FIELD');
    expect(svg).toContain('STOP FOR COMPLETE-FAMILY VISUAL APPROVAL');
    expect((await readFile(result.pngPath)).byteLength).toBeGreaterThan(10_000);
  }, 20_000);
});
