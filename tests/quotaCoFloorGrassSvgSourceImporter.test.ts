import { createHash } from 'node:crypto';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import { DEFAULT_FLOORS } from '../src/data/defaults';
import { QUOTA_CO_MAINTAINED_HYBRID_SURFACE_ART } from '../src/tiles/generated/quotaCoMaintainedHybridSurfaceArt';
import {
  QUOTA_CO_MAINTAINED_HYBRID_GRASS_IDS,
  QUOTA_CO_MAINTAINED_HYBRID_SURFACE_IDS,
  compileQuotaCoMaintainedHybridSurfaces,
  emitQuotaCoMaintainedHybridSurfaceArt,
} from '../scripts/tiles/importer';
import {
  renderQuotaCoFloorGrassSvgSourceValidation,
} from '../scripts/quotaCoFloorGrassSvgSourceValidationPreview';

const SOURCE_ROOT = path.join(
  'assets',
  'tiles',
  'quota-co-maintained-hybrid-v1',
);

describe('QuotaCo floor and grass canonical SVG importer', () => {
  it('keeps the source bank bounded to the existing 12 floors and 3 grass IDs', () => {
    expect(QUOTA_CO_MAINTAINED_HYBRID_SURFACE_IDS).toEqual([
      ...DEFAULT_FLOORS.map(({ id }) => id),
      'ground-grass',
      'ground-grass-b',
      'ground-grass-c',
    ]);
    expect(QUOTA_CO_MAINTAINED_HYBRID_GRASS_IDS).toEqual([
      'ground-grass',
      'ground-grass-b',
      'ground-grass-c',
    ]);
    expect(QUOTA_CO_MAINTAINED_HYBRID_SURFACE_ART).toHaveLength(15);
  });

  it('stores genuine semantic SVG sources with stable metadata', async () => {
    for (const imported of QUOTA_CO_MAINTAINED_HYBRID_SURFACE_ART) {
      const source = await readFile(imported.sourceFile, 'utf8');
      expect(source).toContain('width="128" height="128"');
      expect(source).toContain('viewBox="0 0 128 128"');
      expect(source).toContain(`data-surface-id="${imported.id}"`);
      expect(source).toContain(`data-kind="${imported.kind}"`);
      expect(source).toContain(`data-template-id="${imported.templateId}"`);
      expect(source).toContain('data-direction="maintained-hybrid"');
      expect(source).toContain('<title>');
      expect(source).toContain('<desc>');
      expect(source).toContain('<g id="substrate">');
      expect(source).toMatch(/data-(?:fill|stroke)-token=/);
      expect(source).not.toMatch(
        /<script|<foreignObject|<image|<filter|Gradient|style=|transform=/i,
      );
      expect(createHash('sha256').update(source).digest('hex')).toBe(
        imported.sourceSha256,
      );
    }
  });

  it('compiles deterministically with semantic source ownership', async () => {
    const imports = await compileQuotaCoMaintainedHybridSurfaces(
      SOURCE_ROOT,
      SOURCE_ROOT,
    );
    expect(imports).toEqual(QUOTA_CO_MAINTAINED_HYBRID_SURFACE_ART);
    expect(
      imports.every(({ shapes }) =>
        shapes.every(
          (shape) =>
            shape.silhouette === false &&
            shape.sourceElementId.length > 0 &&
            shape.semanticGroup.length > 0,
        ),
      ),
    ).toBe(true);
    const generated = await readFile(
      'src/tiles/generated/quotaCoMaintainedHybridSurfaceArt.ts',
      'utf8',
    );
    expect(emitQuotaCoMaintainedHybridSurfaceArt(imports)).toBe(generated);
    const liveTemplates = await readFile('src/tiles/templates.ts', 'utf8');
    expect(liveTemplates).toContain('maintainedHybridSurfaceShapes');
  });

  it('writes source-versus-imported validation within raster tolerance', async () => {
    const output = await mkdtemp(
      path.join(os.tmpdir(), 'quota-surface-svg-validation-'),
    );
    const result = await renderQuotaCoFloorGrassSvgSourceValidation(output);
    const metrics = JSON.parse(await readFile(result.metricsPath, 'utf8')) as {
      reviewStatus: string;
      canonicalSvgCount: number;
      compiledCandidateCount: number;
      sourceHashesMatch: boolean;
      entries: Array<{
        close: {
          differentPixelCount: number;
          maxChannelDelta: number;
        };
        far: {
          differentPixelCount: number;
          maxChannelDelta: number;
        };
      }>;
      held: {
        authoringCanvas: number;
        acceptedWallDatum: number;
        characterVisualScale: number;
        floorGroundCharacterMultiplierApplied: boolean;
        productionTemplateRegistration: boolean;
        exporterMutation: boolean;
        schemaMutation: boolean;
        schemaVersion: number;
        bundleExportImport: boolean;
        unityMutation: boolean;
        commitCreated: boolean;
      };
    };
    expect(metrics).toMatchObject({
      reviewStatus: 'canonical-source-import-validation',
      canonicalSvgCount: 15,
      compiledCandidateCount: 15,
      sourceHashesMatch: true,
      held: {
        authoringCanvas: 128,
        acceptedWallDatum: 112,
        characterVisualScale: 0.65,
        floorGroundCharacterMultiplierApplied: false,
        productionTemplateRegistration: true,
        exporterMutation: false,
        schemaMutation: false,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        bundleExportImport: false,
        unityMutation: false,
        commitCreated: false,
      },
    });
    const closeDifferentPixels = metrics.entries.reduce(
      (sum, entry) => sum + entry.close.differentPixelCount,
      0,
    );
    const farDifferentPixels = metrics.entries.reduce(
      (sum, entry) => sum + entry.far.differentPixelCount,
      0,
    );
    expect(closeDifferentPixels).toBeLessThanOrEqual(150);
    expect(farDifferentPixels).toBeLessThanOrEqual(5);
    expect(
      Math.max(...metrics.entries.map((entry) => entry.close.maxChannelDelta)),
    ).toBeLessThanOrEqual(4);
    expect(
      Math.max(...metrics.entries.map((entry) => entry.far.maxChannelDelta)),
    ).toBeLessThanOrEqual(8);
    expect((await readFile(result.pngPath)).byteLength).toBeGreaterThan(10_000);
  }, 20_000);
});
