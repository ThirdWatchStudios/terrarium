import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';

import {
  PRIORITY_TWO_ASSET_IDS,
  PRIORITY_TWO_SCALE_SUGGESTIONS,
  PRIORITY_TWO_WORK_TYPE_STAMPS,
  priorityTwoAssetSvg,
  priorityTwoStampOverlaySvg,
  renderPhaseASpineCalibration,
  renderPriorityTwoDifferentiationSvg,
  renderPriorityTwoRoomSpineSvg,
} from '../scripts/quotaCoDepartmentMachinePhaseASpineCalibrationPreview';
import { DEPARTMENT_MACHINE_PALETTE } from '../scripts/quotaCoDepartmentMachineFamilyCalibrationPreview';
import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import { defaultProject } from '../src/data/defaults';
import { departmentAssetCatalogJson } from '../src/props/departmentAssetCatalog';
import { PROP_TEMPLATES } from '../src/props/templates';

function raster(svg: string, width?: number): PNG {
  const bytes = new Resvg(svg, width ? { fitTo: { mode: 'width', value: width } } : undefined)
    .render()
    .asPng();
  return PNG.sync.read(bytes);
}

describe('QuotaCo Priority 2 Phase A spine calibration', () => {
  it('keeps the review scope exact and footprints explicitly suggested', () => {
    expect(PRIORITY_TWO_ASSET_IDS).toEqual([
      'calculating_engine',
      'comparator',
      'rotary_duplicator',
      'binding_press',
      'verification_comparator',
      'manifest_press',
    ]);
    expect(PRIORITY_TWO_WORK_TYPE_STAMPS).toEqual([
      'findings',
      'reports',
      'requirements',
    ]);
    expect(PRIORITY_TWO_SCALE_SUGGESTIONS).toHaveLength(6);
    expect(PRIORITY_TWO_SCALE_SUGGESTIONS.every(({ suggestedFootprint }) =>
      [1, 2].includes(suggestedFootprint.w) && suggestedFootprint.h === 2)).toBe(true);
  });

  it('renders every machine cleanly at source and far size inside the locked world-art palette', () => {
    const allowed = new Set(Object.values(DEPARTMENT_MACHINE_PALETTE)
      .filter((color) => color !== DEPARTMENT_MACHINE_PALETTE.coral)
      .map((color) => color.toUpperCase()));
    for (const id of PRIORITY_TWO_ASSET_IDS) {
      const source = priorityTwoAssetSvg(id);
      expect(source, id).toContain('viewBox="0 0 128 128"');
      expect(source, id).not.toMatch(/<text|<script|<foreignObject|<image/i);
      expect(source, id).not.toMatch(/#(?:F59E0B|FFB000|D88918|993C56|E91E63|B65F4D)/i);
      const colors = source.match(/#[0-9A-Fa-f]{6}/g) ?? [];
      expect(colors.length, id).toBeGreaterThan(0);
      expect(colors.every((color) => allowed.has(color.toUpperCase())), id).toBe(true);
      expect(raster(source)).toMatchObject({ width: 128, height: 128 });
      expect(raster(source, 40)).toMatchObject({ width: 40, height: 40 });
    }
    for (const stamp of PRIORITY_TWO_WORK_TYPE_STAMPS) {
      const source = priorityTwoStampOverlaySvg(stamp);
      expect(source, stamp).not.toMatch(/<text|#(?:F59E0B|FFB000|D88918|993C56|E91E63|B65F4D)/i);
      expect(raster(source)).toMatchObject({ width: 128, height: 128 });
    }
  }, 20_000);

  it('keeps heat, fumes, comparison, certification, binding, and manifest functions physical', () => {
    expect(priorityTwoAssetSvg('calculating_engine')).toContain('heat-radiator-crown');
    expect(priorityTwoAssetSvg('calculating_engine')).toContain('heat-exhaust-louvers');
    expect(priorityTwoAssetSvg('rotary_duplicator')).toContain('dominant-ink-drum');
    expect(priorityTwoAssetSvg('rotary_duplicator')).toContain('drying-fingers');
    expect(priorityTwoAssetSvg('comparator')).toContain('balance-bridge');
    expect(priorityTwoAssetSvg('verification_comparator')).toContain('certification-jaw');
    expect(priorityTwoAssetSvg('binding_press')).toContain('compressed-report-stack');
    expect(priorityTwoAssetSvg('manifest_press')).toContain('canister-cradle');
    expect(renderPriorityTwoDifferentiationSvg()).toContain('COMPARATOR ≠ VERIFICATION COMPARATOR');
    expect(renderPriorityTwoRoomSpineSvg()).toContain('exact existing conference_table art');
  });

  it('keeps every owner-accepted static asset registered after later schema evolution', () => {
    const productionTemplateIds = new Set(PROP_TEMPLATES.map(({ id }) => id));
    const defaultTemplateIds = new Set(defaultProject().props.map(({ templateId }) => templateId));
    const manifestIds = new Set(departmentAssetCatalogJson().facilities.map(({ id }) => id));
    for (const id of PRIORITY_TWO_ASSET_IDS) {
      expect(productionTemplateIds.has(id), `${id} missing from PROP_TEMPLATES`).toBe(true);
      expect(defaultTemplateIds.has(id), `${id} missing from defaults`).toBe(true);
      expect(manifestIds.has(id), `${id} missing from department-assets`).toBe(true);
    }
    expect(departmentAssetCatalogJson().canister.stamps.map(({ workType }) => workType))
      .toEqual(expect.arrayContaining(PRIORITY_TWO_WORK_TYPE_STAMPS));
    expect(CURRENT_SCHEMA_VERSION).toBe(21);
  });

  it('writes a three-page accepted-control record with animation explicitly deferred', async () => {
    const output = await mkdtemp(path.join(os.tmpdir(), 'quota-department-phase-a-'));
    const result = await renderPhaseASpineCalibration(output);
    expect(result.files).toHaveLength(8);
    const metrics = JSON.parse(await readFile(result.metricsPath, 'utf8')) as Record<string, unknown>;
    expect(metrics).toMatchObject({
      reviewStatus: 'owner-accepted-priority-2-static-control',
      direction: 'administrative-percussion',
      scope: 'priority-2-phase-a-spine-plus-audit-accepted-static-control',
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
    await expect(readFile(path.join(output, '01-phase-a-machine-family.svg'), 'utf8'))
      .resolves.toContain('PHASE A SPINE');
    await expect(readFile(path.join(output, '02-function-and-difference-gates.svg'), 'utf8'))
      .resolves.toContain('ONE CANISTER, THREE NEW STAMPS');
    await expect(readFile(path.join(output, '03-phase-a-room-spine.svg'), 'utf8'))
      .resolves.toContain('PLACED OBJECTS');
    await expect(readFile(result.readmePath, 'utf8'))
      .resolves.toContain('animation as a necessary follow-up');
  }, 20_000);
});
