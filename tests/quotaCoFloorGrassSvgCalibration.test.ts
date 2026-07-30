import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import { DEFAULT_FLOORS, DEFAULT_GROUND } from '../src/data/defaults';
import {
  FLOOR_GRASS_DIRECTION_IDS,
  FLOOR_GRASS_GROUND_IDS,
  FLOOR_GRASS_INTERIOR_IDS,
  renderQuotaCoFloorGrassSvgCalibration,
} from '../scripts/quotaCoFloorGrassSvgCalibrationPreview';

describe('review-only QuotaCo floor and grass SVG calibration', () => {
  it('targets the existing interior floors and grass instances without creating new IDs', () => {
    expect(FLOOR_GRASS_INTERIOR_IDS).toEqual(
      DEFAULT_FLOORS.map(({ id }) => id),
    );
    expect(FLOOR_GRASS_GROUND_IDS).toEqual([
      'ground-grass',
      'ground-grass-b',
      'ground-grass-c',
    ]);
    expect(
      FLOOR_GRASS_GROUND_IDS.every((id) =>
        DEFAULT_GROUND.some((instance) => instance.id === id),
      ),
    ).toBe(true);
    expect(FLOOR_GRASS_DIRECTION_IDS).toEqual([
      'institutional-grid',
      'used-campus',
      'maintained-hybrid',
    ]);
  });

  it('writes a bounded proof while holding source, export, schema, and Unity boundaries', async () => {
    const output = await mkdtemp(
      path.join(os.tmpdir(), 'quota-floor-grass-svg-calibration-'),
    );
    const result = await renderQuotaCoFloorGrassSvgCalibration(output);
    const metrics = JSON.parse(await readFile(result.metricsPath, 'utf8')) as {
      status: string;
      currentOwnership: {
        implementation: string;
        artistEditableStandaloneSvgCount: number;
        currentOutputFormat: string;
      };
      inventory: {
        floorTemplateCount: number;
        interiorFloorInstanceCount: number;
        groundTemplateCount: number;
        groundInstanceCount: number;
        targetInteriorFloorIds: string[];
        targetGrassGroundIds: string[];
      };
      directions: Array<{ id: string }>;
      held: {
        authoringCanvas: number;
        acceptedWallDatum: number;
        characterVisualScale: number;
        floorGroundCharacterMultiplierApplied: boolean;
        schemaVersion: number;
        schemaMutation: boolean;
        exporterMutation: boolean;
        unityRegistrationMutation: boolean;
        productionSourceCreation: boolean;
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
      status: 'review-only-pre-source',
      currentOwnership: {
        implementation: 'src/tiles/templates.ts',
        artistEditableStandaloneSvgCount: 0,
        currentOutputFormat: 'generated-svg',
      },
      inventory: {
        floorTemplateCount: 19,
        interiorFloorInstanceCount: 12,
        groundTemplateCount: 7,
        groundInstanceCount: 10,
        targetInteriorFloorIds: [...FLOOR_GRASS_INTERIOR_IDS],
        targetGrassGroundIds: [...FLOOR_GRASS_GROUND_IDS],
      },
      held: {
        authoringCanvas: 128,
        acceptedWallDatum: 112,
        characterVisualScale: 0.65,
        floorGroundCharacterMultiplierApplied: false,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        schemaMutation: false,
        exporterMutation: false,
        unityRegistrationMutation: false,
        productionSourceCreation: false,
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
    expect(metrics.directions.map(({ id }) => id)).toEqual([
      ...FLOOR_GRASS_DIRECTION_IDS,
    ]);

    const svg = await readFile(result.svgPath, 'utf8');
    expect(svg).toContain('QuotaCo floors + grass ground');
    expect(svg).toContain('INSTITUTIONAL GRID');
    expect(svg).toContain('USED CAMPUS');
    expect(svg).toContain('MAINTAINED HYBRID');
    expect(svg).toContain('STOP FOR VISUAL DIRECTION APPROVAL');
    expect(svg).toContain('no standalone floor/ground SVG files');
    expect((await readFile(result.pngPath)).byteLength).toBeGreaterThan(10_000);
  }, 20_000);
});
