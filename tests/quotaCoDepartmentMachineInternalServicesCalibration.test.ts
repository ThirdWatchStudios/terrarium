import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';

import {
  PRIORITY_THREE_B_ASSET_IDS,
  PRIORITY_THREE_B_HAND_CARRIED_IDS,
  PRIORITY_THREE_B_SCALE_SUGGESTIONS,
  PRIORITY_THREE_B_WORK_TYPE_STAMPS,
  priorityThreeBAssetSvg,
  priorityThreeBHandCarriedSvg,
  priorityThreeBStampOverlaySvg,
  renderPriorityThreeBCalibration,
  renderPriorityThreeBDifferentiationSvg,
  renderPriorityThreeBRoomSvg,
} from '../scripts/quotaCoDepartmentMachineInternalServicesCalibrationPreview';
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

describe('QuotaCo Priority 3B Personnel + Payroll + Supply calibration', () => {
  it('keeps the review inventory exact and footprints explicitly provisional', () => {
    expect(PRIORITY_THREE_B_ASSET_IDS).toEqual([
      'records_cabinet',
      'badge_press',
      'ledger_engine',
      'envelope_press',
      'requisition_counter',
      'stock_shelving',
    ]);
    expect(PRIORITY_THREE_B_WORK_TYPE_STAMPS).toEqual([
      'personnel_actions',
      'supplies',
    ]);
    expect(PRIORITY_THREE_B_HAND_CARRIED_IDS).toEqual(['pay_envelope']);
    expect(PRIORITY_THREE_B_SCALE_SUGGESTIONS.map(({ id, suggestedFootprint }) =>
      [id, suggestedFootprint])).toEqual([
      ['records_cabinet', { w: 2, h: 2 }],
      ['badge_press', { w: 1, h: 2 }],
      ['ledger_engine', { w: 2, h: 2 }],
      ['envelope_press', { w: 1, h: 2 }],
      ['requisition_counter', { w: 2, h: 2 }],
      ['stock_shelving', { w: 2, h: 2 }],
    ]);
  });

  it('renders every machine, stamp, and hand-carried item on the locked palette at source and far size', () => {
    const allowed = new Set(Object.values(DEPARTMENT_MACHINE_PALETTE)
      .filter((color) => color !== DEPARTMENT_MACHINE_PALETTE.coral)
      .map((color) => color.toUpperCase()));
    const sources = [
      ...PRIORITY_THREE_B_ASSET_IDS.map((id) => [id, priorityThreeBAssetSvg(id)] as const),
      ...PRIORITY_THREE_B_WORK_TYPE_STAMPS.map((id) => [id, priorityThreeBStampOverlaySvg(id)] as const),
      ...PRIORITY_THREE_B_HAND_CARRIED_IDS.map((id) => [id, priorityThreeBHandCarriedSvg(id)] as const),
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

  it('keeps the three machine collisions and pay-envelope transport distinction physical', () => {
    expect(priorityThreeBAssetSvg('records_cabinet')).toContain('sealed-archive-vault');
    expect(priorityThreeBAssetSvg('records_cabinet')).toContain('closed-lateral-drawers');
    expect(priorityThreeBAssetSvg('stock_shelving')).toContain('open-stock-bays');
    expect(priorityThreeBAssetSvg('stock_shelving')).toContain('deep-shelf-decks');
    expect(priorityThreeBAssetSvg('badge_press')).toContain('upright-badge-punch-yoke');
    expect(priorityThreeBAssetSvg('badge_press')).toContain('descending-badge-die');
    expect(priorityThreeBAssetSvg('envelope_press')).toContain('twin-seal-rollers');
    expect(priorityThreeBAssetSvg('envelope_press')).toContain('envelope-output-chute');
    expect(priorityThreeBAssetSvg('ledger_engine')).toContain('twin-posting-drums');
    expect(priorityThreeBAssetSvg('ledger_engine')).toContain('open-folio-bed');
    expect(priorityThreeBHandCarriedSvg('pay_envelope')).toContain('hand-carried-pay-envelope');
    expect(priorityThreeBHandCarriedSvg('pay_envelope')).not.toMatch(/canister|tube/i);
    expect(renderPriorityThreeBDifferentiationSvg())
      .toContain('RECORDS CABINET ≠ PARTS CRIB ≠ STOCK SHELVING');
    expect(renderPriorityThreeBDifferentiationSvg()).toContain('PAY ENVELOPE ≠ CANISTER');
    expect(renderPriorityThreeBRoomSvg()).toContain('PAYROLL · PAY ENVELOPES → EMPLOYEES');
  });

  it('promotes accepted assets with the pay envelope isolated in the hand-carried manifest category', () => {
    const productionTemplateIds = new Set(PROP_TEMPLATES.map(({ id }) => id));
    const defaultTemplateIds = new Set(defaultProject().props.map(({ templateId }) => templateId));
    const manifest = departmentAssetCatalogJson();
    const manifestIds = new Set(manifest.facilities.map(({ id }) => id));
    const manifestStamps = new Set(manifest.canister.stamps.map(({ workType }) => workType));
    for (const id of PRIORITY_THREE_B_ASSET_IDS) {
      expect(productionTemplateIds.has(id), `${id} missing from PROP_TEMPLATES`).toBe(true);
      expect(defaultTemplateIds.has(id), `${id} missing from defaults`).toBe(true);
      expect(manifestIds.has(id), `${id} missing from department-assets facilities`).toBe(true);
    }
    expect(productionTemplateIds.has('pay_envelope')).toBe(true);
    expect(defaultTemplateIds.has('pay_envelope')).toBe(true);
    expect(manifestIds.has('pay_envelope')).toBe(false);
    expect(manifest.handCarriedItems).toEqual([expect.objectContaining({
      id: 'pay_envelope',
      transport: 'hand-carried',
      pneumaticCompatible: false,
      placeable: false,
    })]);
    for (const stamp of PRIORITY_THREE_B_WORK_TYPE_STAMPS) {
      expect(manifestStamps.has(stamp), `${stamp} missing from canister stamps`).toBe(true);
    }
    expect(CURRENT_SCHEMA_VERSION).toBe(21);
  });

  it('writes a three-page accepted-control record with manifest-v2 and deferred animation', async () => {
    const output = await mkdtemp(path.join(os.tmpdir(), 'quota-department-priority3b-'));
    const result = await renderPriorityThreeBCalibration(output);
    expect(result.files).toHaveLength(8);
    const metrics = JSON.parse(await readFile(result.metricsPath, 'utf8')) as Record<string, unknown>;
    expect(metrics).toMatchObject({
      reviewStatus: 'owner-accepted-priority-3b-internal-services-static-control',
      direction: 'administrative-percussion',
      scope: 'priority-3b-personnel-payroll-supply-accepted-static-control',
      productionPromotion: true,
      canonicalSvgAuthoring: true,
      templateRegistration: true,
      defaultsMutation: true,
      departmentManifestMutation: true,
      exportRun: true,
      schemaMutation: true,
      unityImport: false,
      parityClaim: 'terrarium-source-compositor-browser-export-only',
      machineAnimationDeferred: true,
      schemaVersion: 21,
      departmentAssetManifestVersion: 2,
      routingLaw: {
        personnelActions: 'canister-and-tube',
        supplies: 'canister-and-tube',
        payEnvelope: 'hand-carried-not-tubed',
      },
    });
    await expect(readFile(path.join(output, '01-internal-services-family.svg'), 'utf8'))
      .resolves.toContain('PRIORITY 3B · INTERNAL SERVICES');
    await expect(readFile(path.join(output, '02-function-and-collision-gates.svg'), 'utf8'))
      .resolves.toContain('PAY ENVELOPE ≠ CANISTER');
    await expect(readFile(path.join(output, '03-phase-c-room-routing.svg'), 'utf8'))
      .resolves.toContain('footsteps and payday within the office');
    await expect(readFile(result.readmePath, 'utf8'))
      .resolves.toContain('owner accepted; promoted as the Priority 3B static production control');
  }, 20_000);
});
