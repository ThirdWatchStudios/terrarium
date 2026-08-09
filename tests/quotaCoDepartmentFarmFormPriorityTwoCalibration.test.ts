import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';

import {
  FARM_FORM_PRIORITY_TWO_ASSET_IDS,
  FARM_FORM_PRIORITY_TWO_OPEN_QUESTIONS,
  FARM_FORM_PRIORITY_TWO_SCALE_SUGGESTIONS,
  FARM_FORM_PRIORITY_TWO_WORK_TYPE_STAMPS,
  farmFormPriorityTwoAssetSvg,
  farmFormPriorityTwoStampOverlaySvg,
  renderFarmFormPriorityTwoCalibration,
  renderFarmFormPriorityTwoContractSvg,
  renderFarmFormPriorityTwoRoomSvg,
} from '../scripts/quotaCoDepartmentFarmFormPriorityTwoCalibrationPreview';
import { DEFAULT_PROPS } from '../src/data/defaults';
import { departmentAssetCatalogJson } from '../src/props/departmentAssetCatalog';
import { PROP_TEMPLATES } from '../src/props/templates';

function raster(svg: string, width?: number): PNG {
  return PNG.sync.read(new Resvg(
    svg,
    width ? { fitTo: { mode: 'width', value: width } } : undefined,
  ).render().asPng());
}

describe('QuotaCo farm-form Priority 2 Approvals calibration', () => {
  it('keeps the proposed inventory, roles, and unresolved decisions explicit', () => {
    expect(FARM_FORM_PRIORITY_TWO_ASSET_IDS).toEqual([
      'adjudication_desk_set',
      'docket_rack',
    ]);
    expect(FARM_FORM_PRIORITY_TWO_WORK_TYPE_STAMPS).toEqual([
      'applications',
      'determinations',
    ]);
    expect(FARM_FORM_PRIORITY_TWO_SCALE_SUGGESTIONS).toEqual([
      expect.objectContaining({
        id: 'adjudication_desk_set',
        suggestedFootprint: { w: 1, h: 1 },
        role: 'per-seat conversion station',
      }),
      expect.objectContaining({
        id: 'docket_rack',
        suggestedFootprint: { w: 1, h: 1 },
        role: 'small shared collector',
      }),
    ]);
    expect(FARM_FORM_PRIORITY_TWO_OPEN_QUESTIONS.map(({ id }) => id)).toEqual([
      'approvals-identifiers',
      'docket-rack-footprint',
      'docket-fill-states',
    ]);
  });

  it('keeps both products physical, differentiated, and readable at source and far scale', () => {
    const desk = farmFormPriorityTwoAssetSvg('adjudication_desk_set');
    expect(desk).toContain('stamp-rack');
    expect(desk).toContain('mechanical-date-punch');
    expect(desk).toContain('guided-form-bed');
    expect(desk).toContain('twin-decision-chutes');
    expect(desk).not.toMatch(/screen|display|readout|meter/i);
    for (const state of ['empty', 'low', 'high', 'overflowing'] as const) {
      const rack = farmFormPriorityTwoAssetSvg('docket_rack', state);
      expect(rack).toContain(`shared-docket-rack-${state}`);
      expect(rack).toContain('open-backlog-cage');
      expect(raster(rack)).toMatchObject({ width: 128, height: 128 });
      expect(raster(rack, 40)).toMatchObject({ width: 40, height: 40 });
    }
    expect(farmFormPriorityTwoAssetSvg('docket_rack', 'empty')).not.toContain('id="docket-0"');
    expect(farmFormPriorityTwoAssetSvg('docket_rack', 'overflowing')).toContain('overflow-dockets');
    expect(renderFarmFormPriorityTwoContractSvg()).toContain('KEYPUNCH CONSOLE ≠ ADJUDICATION DESK SET');
    expect(renderFarmFormPriorityTwoContractSvg()).toContain('TABULATOR ≠ DOCKET RACK');
  });

  it('keeps the two work identities as transparent overlays over one canister base', () => {
    const applications = farmFormPriorityTwoStampOverlaySvg('applications');
    const determinations = farmFormPriorityTwoStampOverlaySvg('determinations');
    expect(applications).toContain('applications-stamp');
    expect(determinations).toContain('determinations-stamp');
    expect(applications).not.toContain('canister_base');
    expect(determinations).not.toContain('canister_base');
    expect(Buffer.compare(raster(applications).data, raster(determinations).data)).not.toBe(0);
    expect(renderFarmFormPriorityTwoRoomSvg())
      .toContain('applications → Adjudication Desk Set → determinations →');
    expect(renderFarmFormPriorityTwoRoomSvg()).toContain('Docket Rack → dispatch station');
  });

  it('keeps the accepted proof ids aligned with their promoted production registrations', () => {
    const templateIds = new Set(PROP_TEMPLATES.map(({ id }) => id));
    const defaultTemplateIds = new Set(DEFAULT_PROPS.map(({ templateId }) => templateId));
    const manifest = departmentAssetCatalogJson();
    const manifestIds = new Set(manifest.facilities.map(({ id }) => id));
    const stampIds = new Set(manifest.canister.stamps.map(({ workType }) => workType));
    for (const id of FARM_FORM_PRIORITY_TWO_ASSET_IDS) {
      expect(templateIds.has(id), `${id} missing from templates`).toBe(true);
      expect(defaultTemplateIds.has(id), `${id} missing from defaults`).toBe(true);
      expect(manifestIds.has(id), `${id} missing from manifest`).toBe(true);
    }
    for (const id of FARM_FORM_PRIORITY_TWO_WORK_TYPE_STAMPS) {
      expect(stampIds.has(id), `${id} missing from canister stamps`).toBe(true);
    }
    expect(manifest.facilities.find(({ id }) => id === 'adjudication_desk_set'))
      .toMatchObject({ placeable: true, suggestedFootprint: { w: 1, h: 1 } });
    expect(manifest.facilities.find(({ id }) => id === 'docket_rack'))
      .toMatchObject({
        placeable: true,
        suggestedFootprint: { w: 1, h: 1 },
        states: [
          expect.objectContaining({ id: 'empty' }),
          expect.objectContaining({ id: 'low' }),
          expect.objectContaining({ id: 'high' }),
          expect.objectContaining({ id: 'overflowing' }),
        ],
      });
  });

  it('writes a three-page accepted calibration record with promotion evidence separated', async () => {
    const output = await mkdtemp(path.join(os.tmpdir(), 'quota-approvals-farm-p2-'));
    const result = await renderFarmFormPriorityTwoCalibration(output);
    expect(result.files).toHaveLength(8);
    const metrics = JSON.parse(await readFile(result.metricsPath, 'utf8')) as Record<string, unknown>;
    expect(metrics).toMatchObject({
      reviewStatus: 'owner-accepted-farm-form-priority-2-static-control',
      scope: 'farm-form-priority-2-addendum-accepted-and-promoted',
      productionPromotion: true,
      canonicalSvgAuthoring: true,
      templateRegistration: true,
      departmentManifestMutation: true,
      departmentAssetManifestVersion: 3,
      exportRun: true,
      parityClaim: 'terrarium-source-compositor-browser-export-only',
      unityImport: false,
      docketFillStatesRatified: ['empty', 'low', 'high', 'overflowing'],
      machineAnimationDeferred: true,
    });
    await expect(readFile(path.join(output, '01-approvals-farm-family.svg'), 'utf8'))
      .resolves.toContain('OWNER ACCEPTED · PROMOTED');
    await expect(readFile(path.join(output, '03-difference-and-contract-gates.svg'), 'utf8'))
      .resolves.toContain('RATIFIED EXPORT DECISIONS');
    await expect(readFile(result.readmePath, 'utf8'))
      .resolves.toContain('owner accepted and promoted');
  }, 20_000);
});
