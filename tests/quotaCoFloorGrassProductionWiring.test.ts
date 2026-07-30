import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import type { ShapeSpec } from '../src/core/types';
import { DEFAULT_FLOORS, DEFAULT_GROUND } from '../src/data/defaults';
import type { ImportedSurfaceShape } from '../src/tiles/authoredSurfaceArt';
import { QUOTA_CO_MAINTAINED_HYBRID_SURFACE_ART } from '../src/tiles/generated/quotaCoMaintainedHybridSurfaceArt';
import {
  maintainedHybridSurfaceShapes,
  maintainedHybridSurfaceSource,
} from '../src/tiles/maintainedHybridSurfaces';
import { FLOOR_TEMPLATES } from '../src/tiles/templates';
import {
  renderQuotaCoFloorGrassProductionValidation,
} from '../scripts/quotaCoFloorGrassProductionValidationPreview';

function plainShape({
  sourceElementId: _sourceElementId,
  semanticGroup: _semanticGroup,
  ...shape
}: ImportedSurfaceShape): ShapeSpec {
  return shape;
}

const TARGETS = [
  ...DEFAULT_FLOORS,
  ...DEFAULT_GROUND.filter(({ id }) =>
    ['ground-grass', 'ground-grass-b', 'ground-grass-c'].includes(id),
  ),
];

describe('QuotaCo floor and grass production wiring', () => {
  it('registers the accepted canonical SVG geometry for every default instance', () => {
    for (const target of TARGETS) {
      const source = maintainedHybridSurfaceSource(
        target.templateId,
        target.palette,
      );
      expect(source?.id, target.id).toBe(target.id);
      const template = FLOOR_TEMPLATES.find(
        ({ id }) => id === target.templateId,
      );
      expect(template, target.templateId).toBeDefined();
      expect(
        template!.build(target.params, target.palette),
        `${target.id} live geometry`,
      ).toEqual(source!.shapes.map(plainShape));
      expect(
        maintainedHybridSurfaceShapes(
          target.templateId,
          target.params,
          target.palette,
        ),
      ).toEqual(source!.shapes.map(plainShape));
    }
  });

  it('keeps every existing parameter active at its bounded extremes', () => {
    for (const target of TARGETS) {
      const template = FLOOR_TEMPLATES.find(
        ({ id }) => id === target.templateId,
      )!;
      for (const definition of template.params) {
        const minimum = template.build(
          { ...target.params, [definition.key]: definition.min },
          target.palette,
        );
        const maximum = template.build(
          { ...target.params, [definition.key]: definition.max },
          target.palette,
        );
        expect(
          JSON.stringify(minimum),
          `${target.id}.${definition.key}`,
        ).not.toBe(JSON.stringify(maximum));
      }
    }
  });

  it('preserves IDs, kinds, templates, palettes, and instance defaults', () => {
    expect(
      QUOTA_CO_MAINTAINED_HYBRID_SURFACE_ART.map(
        ({ id, kind, templateId, paletteDefaults, defaultParams }) => ({
          id,
          kind,
          templateId,
          paletteDefaults,
          defaultParams,
        }),
      ),
    ).toEqual(
      TARGETS.map(({ id, templateId, palette, params }) => ({
        id,
        kind: id.startsWith('ground-') ? 'ground' : 'floor',
        templateId,
        paletteDefaults: palette,
        defaultParams: params,
      })).sort((left, right) => left.id.localeCompare(right.id)),
    );
  });

  it('writes the live production validation and stops before Unity import', async () => {
    const output = await mkdtemp(
      path.join(os.tmpdir(), 'quota-surface-production-validation-'),
    );
    const result =
      await renderQuotaCoFloorGrassProductionValidation(output);
    const metrics = JSON.parse(await readFile(result.metricsPath, 'utf8')) as {
      reviewStatus: string;
      canonicalSvgCount: number;
      liveTemplateCount: number;
      parameterCount: number;
      everyParameterActive: boolean;
      held: {
        floorGroundCharacterMultiplierApplied: boolean;
        schemaMutation: boolean;
        unityMutation: boolean;
        commitCreated: boolean;
      };
      promoted: {
        canonicalSvgProductionSource: boolean;
        productionTemplateRegistration: boolean;
        semanticParameterVariants: boolean;
        snapshotPromotion: boolean;
      };
      deferred: {
        grassFringe47FrameProof: boolean;
        bundleImport: boolean;
        unityRegistration: boolean;
      };
    };
    expect(metrics).toMatchObject({
      reviewStatus: 'terrarium-production-svg-validation',
      canonicalSvgCount: 15,
      liveTemplateCount: 15,
      parameterCount: 29,
      everyParameterActive: true,
      held: {
        floorGroundCharacterMultiplierApplied: false,
        schemaMutation: false,
        unityMutation: false,
        commitCreated: false,
      },
      promoted: {
        canonicalSvgProductionSource: true,
        productionTemplateRegistration: true,
        semanticParameterVariants: true,
        snapshotPromotion: true,
      },
      deferred: {
        grassFringe47FrameProof: true,
        bundleImport: true,
        unityRegistration: true,
      },
    });
    expect((await readFile(result.pngPath)).byteLength).toBeGreaterThan(
      10_000,
    );
  }, 20_000);
});
