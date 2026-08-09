import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';

import {
  PARTITION_REPLACEMENT_CONTRACT_QUESTIONS,
  PARTITION_REPLACEMENT_DIRECTIONS,
  partitionReplacementAssetSvg,
  renderPartitionReplacementCalibration,
  renderPartitionReplacementConnectionsSvg,
  renderPartitionReplacementFarmSvg,
} from '../scripts/quotaCoCubiclePartitionReplacementCalibrationPreview';
import { departmentAssetCatalogJson } from '../src/props/departmentAssetCatalog';
import { PROP_TEMPLATES } from '../src/props/templates';

function raster(svg: string, width?: number): PNG {
  return PNG.sync.read(new Resvg(
    svg,
    width ? { fitTo: { mode: 'width', value: width } } : undefined,
  ).render().asPng());
}

describe('QuotaCo cubicle partition replacement calibration', () => {
  it('compares two bounded replacement directions and recommends the acoustic-furniture read', () => {
    expect(PARTITION_REPLACEMENT_DIRECTIONS).toEqual([
      expect.objectContaining({ id: 'b_upholstered_slab', recommendation: 'recommended' }),
      expect.objectContaining({ id: 'c_molded_carrier', recommendation: 'alternate' }),
    ]);
    expect(PARTITION_REPLACEMENT_CONTRACT_QUESTIONS.map(({ id }) => id)).toEqual([
      'connection-state-ownership',
      'profile-width',
      'vertical-presentation',
    ]);
  });

  it('makes body tiles post-free and assigns exactly one beam to the explicit support piece', () => {
    for (const direction of PARTITION_REPLACEMENT_DIRECTIONS) {
      const body = partitionReplacementAssetSvg(direction.id, 'body', 'horizontal');
      const support = partitionReplacementAssetSvg(direction.id, 'support', 'horizontal');
      expect(body).toContain('connection-free-body');
      expect(body).not.toContain('support-post');
      expect(support.match(/one-shared-support-post/g)).toHaveLength(1);
      expect(renderPartitionReplacementConnectionsSvg())
        .toContain('ONE JOIN · PAINT ORDER');
    }
  });

  it('authors vertical bodies as uninterrupted longitudinal slabs with under-painted feet', () => {
    const vertical = partitionReplacementAssetSvg('b_upholstered_slab', 'body', 'vertical');
    const support = partitionReplacementAssetSvg('b_upholstered_slab', 'support', 'vertical');
    expect(vertical).toContain('continuous-topdown-upholstered-field');
    expect(vertical).toContain('longitudinal-piping');
    expect(vertical).not.toMatch(/separator|transverse|stack/i);
    expect(support).toContain('under-slab-foot');
    expect(renderPartitionReplacementConnectionsSvg())
      .toContain('NO TRANSVERSE SEPARATORS');
    expect(raster(vertical, 40)).toMatchObject({ width: 40, height: 40 });
    expect(renderPartitionReplacementFarmSvg()).toContain('actual far sprites · 40 px / cell');
  });

  it('does not replace the promoted production partitions before visual approval', async () => {
    const templateIds = new Set(PROP_TEMPLATES.map(({ id }) => id));
    expect(templateIds.has('b_upholstered_slab')).toBe(false);
    expect(templateIds.has('c_molded_carrier')).toBe(false);
    const manifest = departmentAssetCatalogJson();
    expect(manifest.facilities.find(({ id }) => id === 'cubicle_partition_straight'))
      .toMatchObject({
        states: [
          expect.objectContaining({ id: 'horizontal' }),
          expect.objectContaining({ id: 'vertical' }),
        ],
      });
    const canonical = await readFile(
      path.resolve('assets/props/quota-co-department-machines-v1/cubicle_partition_straight--horizontal.svg'),
      'utf8',
    );
    expect(canonical).toContain('owner-accepted-farm-form-priority1-calibration-v1');
    expect(canonical).not.toContain('b-upholstered-slab');
  });

  it('writes a three-page review-only record with the production gate intact', async () => {
    const output = await mkdtemp(path.join(os.tmpdir(), 'quota-partition-replacement-'));
    const result = await renderPartitionReplacementCalibration(output);
    expect(result.files).toHaveLength(8);
    const metrics = JSON.parse(await readFile(result.metricsPath, 'utf8')) as Record<string, unknown>;
    expect(metrics).toMatchObject({
      reviewStatus: 'awaiting-owner-partition-replacement-direction',
      scope: 'cubicle-partition-replacement-review-only',
      recommendedDirection: 'b_upholstered_slab',
      productionMutation: false,
      canonicalSvgAuthoring: false,
      templateRegistration: false,
      departmentManifestMutation: false,
      exportRun: false,
      parityClaim: false,
      currentProductionSkuStable: true,
      proposedOuterProfileUnits: 44,
      farGameplayPixelsPerCell: 40,
      bodyOwnsInternalSupport: false,
      oneGraphVertexOwnsOneSupport: true,
      verticalTransverseSeparators: false,
      unityImport: false,
    });
    await expect(readFile(path.join(output, '01-replacement-directions.svg'), 'utf8'))
      .resolves.toContain('NOT PROMOTED');
    await expect(readFile(result.readmePath, 'utf8'))
      .resolves.toContain('current promoted partition sprites remain unchanged');
  }, 20_000);
});
