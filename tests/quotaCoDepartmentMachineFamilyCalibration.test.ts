import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import {
  DEPARTMENT_MACHINE_DIRECTIONS,
  DEPARTMENT_MACHINE_PALETTE,
  PRIORITY_ONE_ASSET_IDS,
  PRIORITY_ONE_FILL_STATES,
  PRIORITY_ONE_OPEN_QUESTIONS,
  PRIORITY_ONE_SCALE_SUGGESTIONS,
  PRIORITY_ONE_WORK_TYPE_STAMPS,
  priorityOneAssetSvg,
  renderDepartmentMachineFamilyCalibration,
  workTypeStampOverlaySvg,
} from '../scripts/quotaCoDepartmentMachineFamilyCalibrationPreview';

function raster(svg: string, width: number): { width: number; height: number; bytes: number } {
  const image = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render();
  return { width: image.width, height: image.height, bytes: image.asPng().byteLength };
}

describe('QuotaCo department-machine family calibration', () => {
  it('covers the complete Priority 1 id and work-type stamp scope only', () => {
    expect(PRIORITY_ONE_ASSET_IDS).toEqual([
      'loading_dock',
      'sorting_frame',
      'franking_machine',
      'keypunch_bank',
      'tabulating_machine',
      'intake_tray_small',
      'intake_tray_large',
      'dispatch_station',
      'pneumatic_dispatch_node',
      'tube_straight',
      'tube_corner',
      'tube_wallpass',
      'tube_riser',
      'canister_base',
      'delivery_uplink',
    ]);
    expect(PRIORITY_ONE_WORK_TYPE_STAMPS).toEqual(['raw_records', 'structured_data']);
    expect(PRIORITY_ONE_SCALE_SUGGESTIONS.map(({ id }) => id)).toEqual(PRIORITY_ONE_ASSET_IDS);
  });

  it('keeps three bounded directions and recommends Administrative Percussion', () => {
    expect(DEPARTMENT_MACHINE_DIRECTIONS).toHaveLength(3);
    expect(DEPARTMENT_MACHINE_DIRECTIONS.filter(({ recommended }) => recommended)).toEqual([
      expect.objectContaining({ id: 'percussion-line' }),
    ]);
  });

  it('keeps every proposed asset inside the locked QuotaCo authored palette', () => {
    const allowed = new Set(Object.values(DEPARTMENT_MACHINE_PALETTE).map((value) => value.toUpperCase()));
    for (const id of PRIORITY_ONE_ASSET_IDS) {
      const source = priorityOneAssetSvg(id, {
        direction: 'percussion-line',
        state: id === 'loading_dock' ? 'high'
          : id.includes('tray') || id === 'dispatch_station' ? 'overflowing'
            : 'empty',
        stamp: id === 'canister_base' ? 'structured_data' : undefined,
      });
      const colors = source.match(/#[0-9A-Fa-f]{6}/g) ?? [];
      expect(colors.length, id).toBeGreaterThan(0);
      expect(colors.every((color) => allowed.has(color.toUpperCase())), id).toBe(true);
      expect(source, id).not.toMatch(/<text|<script|<foreignObject/i);
      expect(source, id).not.toMatch(/#(?:F59E0B|FFB000|D88918|993C56|E91E63)/i);
    }
  });

  it('renders every direction and state cleanly at source and far-use sizes', () => {
    for (const direction of DEPARTMENT_MACHINE_DIRECTIONS) {
      for (const id of PRIORITY_ONE_ASSET_IDS) {
        const states = id in PRIORITY_ONE_FILL_STATES
          ? PRIORITY_ONE_FILL_STATES[id as keyof typeof PRIORITY_ONE_FILL_STATES]
          : ['empty'] as const;
        for (const state of states) {
          const source = priorityOneAssetSvg(id, { direction: direction.id, state });
          expect(source).toContain('viewBox="0 0 128 128"');
          expect(raster(source, 128)).toMatchObject({ width: 128, height: 128 });
          const far = raster(source, 40);
          expect(far).toMatchObject({ width: 40, height: 40 });
          expect(far.bytes, `${direction.id}/${id}/${state}`).toBeGreaterThan(100);
        }
      }
    }
    for (const stamp of PRIORITY_ONE_WORK_TYPE_STAMPS) {
      expect(raster(workTypeStampOverlaySvg(stamp), 40).bytes).toBeGreaterThan(100);
    }
  }, 20_000);

  it('surfaces every unresolved grid/export seam instead of locking it in art', () => {
    expect(PRIORITY_ONE_OPEN_QUESTIONS.map(({ id }) => id)).toEqual([
      'state-identity',
      'dock-occupancy',
      'franking-form',
      'three-cell-art',
      'station-node-split',
      'wallpass',
    ]);
    expect(PRIORITY_ONE_SCALE_SUGGESTIONS.filter(({ status }) => status === 'open-contract')
      .map(({ id }) => id)).toEqual([
      'loading_dock',
      'franking_machine',
      'tabulating_machine',
      'dispatch_station',
      'pneumatic_dispatch_node',
      'tube_wallpass',
      'canister_base',
    ]);
  });

  it('writes a review-only three-page proof and explicit non-promotion metrics', async () => {
    const output = await mkdtemp(path.join(os.tmpdir(), 'quota-department-machines-'));
    const result = await renderDepartmentMachineFamilyCalibration(output);
    expect(result.files).toHaveLength(8);
    const metrics = JSON.parse(await readFile(result.metricsPath, 'utf8')) as Record<string, unknown>;
    expect(metrics).toMatchObject({
      reviewStatus: 'awaiting-owner-direction-and-grid-decisions',
      productionPromotion: false,
      canonicalSvgAuthoring: false,
      templateRegistration: false,
      defaultsMutation: false,
      exportRun: false,
      schemaMutation: false,
      unityImport: false,
      parityClaim: false,
      scope: 'priority-1-only',
      recommendedDirection: 'percussion-line',
    });
    await expect(readFile(path.join(output, '01-product-family-directions.svg'), 'utf8'))
      .resolves.toContain('OWNER GATE');
    await expect(readFile(path.join(output, '02-priority1-scale-and-states.svg'), 'utf8'))
      .resolves.toContain('CONTRACT QUESTIONS TO RESOLVE BEFORE PRODUCTION');
    await expect(readFile(path.join(output, '03-minimal-chain-room-flow.svg'), 'utf8'))
      .resolves.toContain('NOT AN EXPORTED OFFICE OR PARITY CLAIM');
    await expect(readFile(result.readmePath, 'utf8')).resolves.toContain('Priority 2 has not started');
  }, 20_000);
});
