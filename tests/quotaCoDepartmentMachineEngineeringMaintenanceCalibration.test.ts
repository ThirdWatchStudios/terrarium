import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';

import {
  PRIORITY_THREE_A_ASSET_IDS,
  PRIORITY_THREE_A_SCALE_SUGGESTIONS,
  PRIORITY_THREE_A_WORK_TYPE_STAMPS,
  priorityThreeAAssetSvg,
  priorityThreeAStampOverlaySvg,
  renderPriorityThreeACalibration,
  renderPriorityThreeADifferentiationSvg,
  renderPriorityThreeARoomSvg,
} from '../scripts/quotaCoDepartmentMachineEngineeringMaintenanceCalibrationPreview';
import { DEPARTMENT_MACHINE_PALETTE } from '../scripts/quotaCoDepartmentMachineFamilyCalibrationPreview';
import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import { defaultProject } from '../src/data/defaults';
import { departmentAssetCatalogJson } from '../src/props/departmentAssetCatalog';
import { PROP_TEMPLATES } from '../src/props/templates';

function raster(svg: string, width?: number): PNG {
  return PNG.sync.read(new Resvg(
    svg,
    width ? { fitTo: { mode: 'width', value: width } } : undefined,
  ).render().asPng());
}

describe('QuotaCo Priority 3A Engineering + Maintenance calibration', () => {
  it('keeps the review scope exact and footprints explicitly provisional', () => {
    expect(PRIORITY_THREE_A_ASSET_IDS).toEqual([
      'terminal_bank',
      'compiler_press',
      'parts_crib',
      'workbench',
    ]);
    expect(PRIORITY_THREE_A_WORK_TYPE_STAMPS).toEqual([
      'specifications',
      'code',
      'release',
      'repairs',
    ]);
    expect(PRIORITY_THREE_A_SCALE_SUGGESTIONS.map(({ id, suggestedFootprint }) =>
      [id, suggestedFootprint])).toEqual([
      ['terminal_bank', { w: 3, h: 2 }],
      ['compiler_press', { w: 2, h: 2 }],
      ['parts_crib', { w: 2, h: 2 }],
      ['workbench', { w: 2, h: 2 }],
    ]);
  });

  it('renders every machine and stamp on the locked world-art palette at source and far size', () => {
    const allowed = new Set(Object.values(DEPARTMENT_MACHINE_PALETTE)
      .filter((color) => color !== DEPARTMENT_MACHINE_PALETTE.coral)
      .map((color) => color.toUpperCase()));
    for (const id of PRIORITY_THREE_A_ASSET_IDS) {
      const source = priorityThreeAAssetSvg(id);
      expect(source, id).toContain('viewBox="0 0 128 128"');
      expect(source, id).not.toMatch(/<text|<script|<foreignObject|<image|<line/i);
      expect(source, id).not.toMatch(/#(?:F59E0B|FFB000|D88918|993C56|E91E63|B65F4D)/i);
      const colors = source.match(/#[0-9A-Fa-f]{6}/g) ?? [];
      expect(colors.length, id).toBeGreaterThan(0);
      expect(colors.every((color) => allowed.has(color.toUpperCase())), id).toBe(true);
      expect(raster(source)).toMatchObject({ width: 128, height: 128 });
      expect(raster(source, 40)).toMatchObject({ width: 40, height: 40 });
    }
    for (const stamp of PRIORITY_THREE_A_WORK_TYPE_STAMPS) {
      const source = priorityThreeAStampOverlaySvg(stamp);
      expect(source, stamp).not.toMatch(/<text|<script|#(?:F59E0B|FFB000|D88918|993C56|E91E63|B65F4D)/i);
      expect(raster(source)).toMatchObject({ width: 128, height: 128 });
    }
  }, 20_000);

  it('keeps the engineering and maintenance nouns physically distinct', () => {
    expect(priorityThreeAAssetSvg('terminal_bank')).toContain('three-deep-crt-hoods');
    expect(priorityThreeAAssetSvg('terminal_bank')).toContain('rear-thermal-spine');
    expect(priorityThreeAAssetSvg('terminal_bank').match(/thermal-spine[\s\S]*?<path/g)?.length).toBeGreaterThan(0);
    expect(priorityThreeAAssetSvg('compiler_press')).toContain('impact-hammer-bridge');
    expect(priorityThreeAAssetSvg('compiler_press')).toContain('impact-camshaft');
    expect(priorityThreeAAssetSvg('compiler_press')).toContain('sprocket-listing-throat');
    expect(priorityThreeAAssetSvg('parts_crib')).toContain('caged-bin-wall');
    expect(priorityThreeAAssetSvg('parts_crib')).toContain('orthogonal-security-mesh');
    expect(priorityThreeAAssetSvg('parts_crib')).toContain('controlled-cage-latch');
    expect(priorityThreeAAssetSvg('parts_crib')).toContain('controlled-issue-hatch');
    expect(priorityThreeAAssetSvg('workbench')).toContain('mounted-vise');
    expect(priorityThreeAAssetSvg('workbench')).toContain('articulated-service-arm');
    expect(priorityThreeAAssetSvg('workbench')).toContain('open-service-bay');
    expect(priorityThreeAAssetSvg('workbench')).toContain('service-bed');
    expect(renderPriorityThreeADifferentiationSvg()).toContain('TERMINAL BANK ≠ COMPILER PRESS');
    expect(renderPriorityThreeADifferentiationSvg()).toContain('PARTS CRIB ≠ WORKBENCH');
    expect(renderPriorityThreeARoomSvg()).toContain('ENGINEERING · SPECIFICATIONS → CODE');
    expect(renderPriorityThreeARoomSvg()).toContain('MAINTENANCE · REPAIRS → MACHINES');
  });

  it('promotes accepted assets through production registries, defaults, manifest, and stamps without a schema bump', () => {
    const productionTemplateIds = new Set(PROP_TEMPLATES.map(({ id }) => id));
    const defaultTemplateIds = new Set(defaultProject().props.map(({ templateId }) => templateId));
    const manifest = departmentAssetCatalogJson();
    const manifestIds = new Set(manifest.facilities.map(({ id }) => id));
    const manifestStamps = new Set(manifest.canister.stamps.map(({ workType }) => workType));
    for (const id of PRIORITY_THREE_A_ASSET_IDS) {
      expect(productionTemplateIds.has(id), `${id} missing from PROP_TEMPLATES`).toBe(true);
      expect(defaultTemplateIds.has(id), `${id} missing from defaults`).toBe(true);
      expect(manifestIds.has(id), `${id} missing from department-assets`).toBe(true);
    }
    for (const stamp of PRIORITY_THREE_A_WORK_TYPE_STAMPS) {
      expect(manifestStamps.has(stamp), `${stamp} missing from canister stamps`).toBe(true);
    }
    expect(CURRENT_SCHEMA_VERSION).toBe(21);
  });

  it('writes a three-page accepted-control record with static parity scope and deferred animation', async () => {
    const output = await mkdtemp(path.join(os.tmpdir(), 'quota-department-priority3a-'));
    const result = await renderPriorityThreeACalibration(output);
    expect(result.files).toHaveLength(8);
    const metrics = JSON.parse(await readFile(result.metricsPath, 'utf8')) as Record<string, unknown>;
    expect(metrics).toMatchObject({
      reviewStatus: 'owner-accepted-priority-3a-refinement-v2-static-control',
      direction: 'administrative-percussion',
      scope: 'priority-3a-engineering-maintenance-refinement-v2-accepted-static-control',
      productionPromotion: true,
      canonicalSvgAuthoring: true,
      templateRegistration: true,
      defaultsMutation: true,
      departmentManifestMutation: true,
      exportRun: true,
      schemaMutation: false,
      unityImport: false,
      parityClaim: 'terrarium-source-compositor-browser-export-only',
      machineAnimationDeferred: true,
    });
    await expect(readFile(path.join(output, '01-engineering-maintenance-family.svg'), 'utf8'))
      .resolves.toContain('REFINEMENT V2');
    await expect(readFile(path.join(output, '02-function-and-pollution-gates.svg'), 'utf8'))
      .resolves.toContain('ONE CANISTER · FOUR STAMPS');
    await expect(readFile(path.join(output, '03-phase-b-room-routing.svg'), 'utf8'))
      .resolves.toContain('PHASE B ROUTING CHOICE');
    await expect(readFile(result.readmePath, 'utf8'))
      .resolves.toContain('owner accepted; promoted as the Priority 3A static production control');
  }, 20_000);
});
