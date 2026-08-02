import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';

import {
  FARM_FORM_PRIORITY_ONE_ASSET_IDS,
  FARM_FORM_PRIORITY_ONE_OPEN_QUESTIONS,
  FARM_FORM_PRIORITY_ONE_SCALE_SUGGESTIONS,
  farmFormPriorityOneAssetSvg,
  renderFarmFormPriorityOneCalibration,
  renderFarmFormPriorityOneGridSvg,
  renderFarmFormPriorityOnePartitionRunsSvg,
  renderFarmFormPriorityOneRoomSvg,
} from '../scripts/quotaCoDepartmentFarmFormPriorityOneCalibrationPreview';
import { DEPARTMENT_MACHINE_PALETTE } from '../scripts/quotaCoDepartmentMachineFamilyCalibrationPreview';
import { defaultProject } from '../src/data/defaults';
import { departmentAssetCatalogJson } from '../src/props/departmentAssetCatalog';
import { PROP_TEMPLATES } from '../src/props/templates';

function raster(svg: string, width?: number): PNG {
  return PNG.sync.read(new Resvg(
    svg,
    width ? { fitTo: { mode: 'width', value: width } } : undefined,
  ).render().asPng());
}

describe('QuotaCo farm-form Priority 1 addendum calibration', () => {
  it('keeps the review inventory and placement recommendations explicit', () => {
    expect(FARM_FORM_PRIORITY_ONE_ASSET_IDS).toEqual([
      'keypunch_console',
      'cubicle_partition_straight',
      'cubicle_partition_corner',
      'cubicle_partition_endcap',
    ]);
    expect(FARM_FORM_PRIORITY_ONE_SCALE_SUGGESTIONS).toEqual([
      expect.objectContaining({
        id: 'keypunch_console',
        suggestedFootprint: { w: 1, h: 1 },
        placement: 'whole-cell',
      }),
      expect.objectContaining({
        id: 'cubicle_partition_straight',
        placement: 'cell-edge-furniture-slot',
      }),
      expect.objectContaining({
        id: 'cubicle_partition_corner',
        placement: 'cell-corner-furniture-slot',
      }),
      expect.objectContaining({
        id: 'cubicle_partition_endcap',
        placement: 'cell-edge-furniture-slot',
      }),
    ]);
    expect(FARM_FORM_PRIORITY_ONE_OPEN_QUESTIONS.map(({ id }) => id)).toEqual([
      'partition-identifiers',
      'partition-grid-slot',
      'partition-facing-export',
    ]);
  });

  it('renders every proposed SKU on the locked non-signal product palette at source and far size', () => {
    const allowed = new Set(Object.values(DEPARTMENT_MACHINE_PALETTE)
      .filter((color) => color !== DEPARTMENT_MACHINE_PALETTE.coral)
      .map((color) => color.toUpperCase()));
    const sources = [
      ...FARM_FORM_PRIORITY_ONE_ASSET_IDS.map((id) =>
        [id, farmFormPriorityOneAssetSvg(id)] as const),
      ['cubicle_partition_straight_vertical',
        farmFormPriorityOneAssetSvg('cubicle_partition_straight', 'vertical')] as const,
      ['cubicle_partition_endcap_vertical',
        farmFormPriorityOneAssetSvg('cubicle_partition_endcap', 'vertical')] as const,
    ];
    for (const [id, source] of sources) {
      expect(source, id).toContain('viewBox="0 0 128 128"');
      expect(source, id).not.toMatch(/<text|<script|<foreignObject|<image|<line/i);
      expect(source, id).not.toMatch(/#(?:F59E0B|FFB000|D88918|993C56|E91E63|B65F4D)/i);
      const colors = source.match(/#[0-9A-Fa-f]{6}/g) ?? [];
      expect(colors.length, id).toBeGreaterThan(0);
      expect(colors.every((color) => allowed.has(color.toUpperCase())), id).toBe(true);
      expect(raster(source)).toMatchObject({ width: 128, height: 128 });
      expect(raster(source, 40)).toMatchObject({ width: 40, height: 40 });
    }
  }, 20_000);

  it('keeps the console physical and the partition family visibly freestanding and acoustic', () => {
    const console = farmFormPriorityOneAssetSvg('keypunch_console');
    expect(console).toContain('punch-card-input-hopper');
    expect(console).toContain('mechanical-punch-drum');
    expect(console).toContain('key-deck');
    expect(console).toContain('punched-card-output-slot');
    expect(console).not.toMatch(/screen|display|readout|meter/i);

    const straight = farmFormPriorityOneAssetSvg('cubicle_partition_straight');
    expect(straight).toContain('thick-acoustic-field');
    expect(straight).toContain('acoustic-perforation');
    expect(straight).toContain('left-shared-support-beam');
    expect(straight).toContain('right-shared-support-beam');
    expect(straight).toContain('x="28"');
    expect(straight).toContain('x="92"');
    expect(straight).toContain('floor-foot');
    const vertical = farmFormPriorityOneAssetSvg('cubicle_partition_straight', 'vertical');
    expect(vertical).toContain('continuous-topdown-baffle-contour');
    expect(vertical).toContain('continuous-acoustic-top-field');
    expect(vertical).toContain('far-shared-support-under-baffle');
    expect(vertical).toContain('near-shared-support-under-baffle');
    expect(vertical).toContain('floor-foot-under-baffle');
    expect(vertical).not.toContain('side-floor-shoe');
    expect(vertical).not.toContain('inline-support-beam');
    expect(vertical).not.toContain('width="32" height="8"');
    expect(vertical.indexOf('far-shared-support-under-baffle'))
      .toBeLessThan(vertical.indexOf('continuous-topdown-baffle-contour'));
    expect(vertical.indexOf('near-shared-support-under-baffle'))
      .toBeLessThan(vertical.indexOf('continuous-topdown-baffle-contour'));
    expect(farmFormPriorityOneAssetSvg('cubicle_partition_corner'))
      .toContain('rounded-corner-post');
    expect(farmFormPriorityOneAssetSvg('cubicle_partition_endcap'))
      .toContain('rounded-terminus-cap');
    expect(renderFarmFormPriorityOneGridSvg())
      .toContain('LOW PROFILE · FURNITURE, NOT ARCHITECTURE');
    expect(renderFarmFormPriorityOneRoomSvg())
      .toContain('FOOTSTEPS WITHIN · BAFFLES BETWEEN · TUBES ONLY BEYOND THE ROOM');
    expect(renderFarmFormPriorityOnePartitionRunsSvg())
      .toContain('JOINT CLOSE-UP · ONE BEAM, NOT A BUNCHED PAIR');
    expect(renderFarmFormPriorityOnePartitionRunsSvg())
      .toContain('VERTICAL STRETCH · FIVE ONE-CELL SEGMENTS');
  });

  it('keeps the accepted proof ids aligned with their promoted production registrations', () => {
    const templateIds = new Set(PROP_TEMPLATES.map(({ id }) => id));
    const defaultTemplateIds = new Set(defaultProject().props.map(({ templateId }) => templateId));
    const manifest = departmentAssetCatalogJson();
    const manifestIds = new Set(manifest.facilities.map(({ id }) => id));
    for (const id of FARM_FORM_PRIORITY_ONE_ASSET_IDS) {
      expect(templateIds.has(id), `${id} missing from PROP_TEMPLATES`).toBe(true);
      expect(defaultTemplateIds.has(id), `${id} missing from defaults`).toBe(true);
      expect(manifestIds.has(id), `${id} missing from department-assets`).toBe(true);
    }
    expect(templateIds.has('keypunch_bank')).toBe(true);
    expect(manifest.facilities.find(({ id }) => id === 'keypunch_bank')?.placeable).toBe(false);
    expect(manifest.facilities.find(({ id }) => id === 'cubicle_partition_straight'))
      .toMatchObject({
        placement: 'cell-edge-furniture-slot',
        states: [
          expect.objectContaining({ id: 'horizontal' }),
          expect.objectContaining({ id: 'vertical' }),
        ],
      });
  });

  it('writes a four-page accepted calibration record with promotion evidence separated', async () => {
    const output = await mkdtemp(path.join(os.tmpdir(), 'quota-department-farm-p1-'));
    const result = await renderFarmFormPriorityOneCalibration(output);
    expect(result.files).toHaveLength(10);
    const metrics = JSON.parse(await readFile(result.metricsPath, 'utf8')) as Record<string, unknown>;
    expect(metrics).toMatchObject({
      reviewStatus: 'owner-accepted-farm-form-priority-1-static-control',
      direction: 'administrative-percussion-farm-form',
      scope: 'farm-form-priority-1-addendum-accepted-and-promoted',
      productionPromotion: true,
      canonicalSvgAuthoring: true,
      templateRegistration: true,
      departmentManifestMutation: true,
      departmentAssetManifestVersion: 3,
      exportRun: true,
      parityClaim: 'terrarium-source-compositor-browser-export-only',
      unityImport: false,
      priorityTwoStarted: false,
      keypunchBankRetired: false,
      keypunchBankBuilderPlaceable: false,
    });
    await expect(readFile(path.join(output, '01-farm-form-family.svg'), 'utf8'))
      .resolves.toContain('ONE STAFFED SEAT = ONE 1×1 CONVERSION STATION');
    await expect(readFile(path.join(output, '02-grid-and-baffle-gates.svg'), 'utf8'))
      .resolves.toContain('RATIFIED EXPORT DECISIONS');
    await expect(readFile(path.join(output, '03-data-processing-farm.svg'), 'utf8'))
      .resolves.toContain('browser/headless export');
    await expect(readFile(path.join(output, '04-horizontal-and-vertical-partition-runs.svg'), 'utf8'))
      .resolves.toContain('shared feet are painted underneath; only their wings remain visible');
    await expect(readFile(result.readmePath, 'utf8'))
      .resolves.toContain('owner accepted as the farm-form Priority 1 static control');
  }, 20_000);
});
