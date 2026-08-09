import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';

import { DEPARTMENT_MACHINE_PALETTE } from '../scripts/quotaCoDepartmentMachineFamilyCalibrationPreview';
import {
  REFINED_ASSET_IDS,
  REFINED_TUBE_GEOMETRY,
  refinedPriorityOneAssetSvg,
  renderContinuousTubeRouteSvg,
  renderDepartmentMachineReadabilityRefinement,
} from '../scripts/quotaCoDepartmentMachineReadabilityRefinementPreview';

function raster(svg: string, width?: number): PNG {
  const rendered = new Resvg(svg, width ? { fitTo: { mode: 'width', value: width } } : undefined)
    .render()
    .asPng();
  return PNG.sync.read(rendered);
}

function alphaAt(png: PNG, x: number, y: number): number {
  return png.data[(y * png.width + x) * 4 + 3] ?? 0;
}

describe('QuotaCo department-machine focused readability refinement', () => {
  it('holds the complete accepted Priority 1 scope without starting Priority 2', () => {
    expect(REFINED_ASSET_IDS).toEqual([
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
  });

  it('gives the canister literal visible clearance inside the corrected lumen', () => {
    expect(REFINED_TUBE_GEOMETRY).toMatchObject({
      sourceCanvas: 128,
      logicalCellSourceMin: 32,
      logicalCellSourceMax: 96,
      westSocket: { x: 32, y: 64 },
      eastSocket: { x: 96, y: 64 },
      southSocket: { x: 64, y: 96 },
      outerDiameter: 28,
      linerDiameter: 22,
      lumenDiameter: 16,
      canisterDiameter: 10,
      radialClearance: 3,
    });
    expect(REFINED_TUBE_GEOMETRY.canisterDiameter + REFINED_TUBE_GEOMETRY.radialClearance * 2)
      .toBe(REFINED_TUBE_GEOMETRY.lumenDiameter);
    expect(REFINED_TUBE_GEOMETRY.lumenDiameter).toBeLessThan(REFINED_TUBE_GEOMETRY.linerDiameter);
    expect(REFINED_TUBE_GEOMETRY.linerDiameter).toBeLessThan(REFINED_TUBE_GEOMETRY.outerDiameter);
  });

  it('keeps exact adjacent-cell joins painted through straight, wall-pass, and riser seams', () => {
    const route = raster(renderContinuousTubeRouteSvg());
    expect(route).toMatchObject({ width: 256, height: 128 });
    for (const seamX of [64, 128, 192]) {
      for (let y = 53; y <= 75; y += 1) {
        expect(alphaAt(route, seamX, y), `transparent route seam at ${seamX},${y}`).toBeGreaterThan(0);
      }
    }
  });

  it('keeps refined sprites on the 128u canvas and inside the locked authored palette', () => {
    const allowed = new Set(Object.values(DEPARTMENT_MACHINE_PALETTE).map((value) => value.toUpperCase()));
    for (const id of REFINED_ASSET_IDS) {
      const state = id === 'loading_dock' ? 'high'
        : id.includes('tray') || id === 'dispatch_station' ? 'overflowing'
          : 'empty';
      const source = refinedPriorityOneAssetSvg(id, {
        state,
        stamp: id === 'canister_base' ? 'structured_data' : undefined,
        canisterInTube: id.startsWith('tube_'),
      });
      expect(source, id).toContain('viewBox="0 0 128 128"');
      expect(source, id).not.toMatch(/<text|<script|<foreignObject/i);
      expect(source, id).not.toMatch(/#(?:F59E0B|FFB000|D88918|993C56|E91E63)/i);
      const colors = source.match(/#[0-9A-Fa-f]{6}/g) ?? [];
      expect(colors.length, id).toBeGreaterThan(0);
      expect(colors.every((color) => allowed.has(color.toUpperCase())), id).toBe(true);
      expect(raster(source)).toMatchObject({ width: 128, height: 128 });
      expect(raster(source, 40)).toMatchObject({ width: 40, height: 40 });
    }
  }, 20_000);

  it('writes the focused three-page proof with explicit non-promotion metrics', async () => {
    const output = await mkdtemp(path.join(os.tmpdir(), 'quota-department-refinement-'));
    const result = await renderDepartmentMachineReadabilityRefinement(output);
    expect(result.files).toHaveLength(8);
    const metrics = JSON.parse(await readFile(result.metricsPath, 'utf8')) as Record<string, unknown>;
    expect(metrics).toMatchObject({
      reviewStatus: 'awaiting-owner-focused-readability-approval',
      acceptedDirection: 'percussion-line',
      acceptedContractDecisionsHeld: true,
      productionPromotion: false,
      canonicalSvgAuthoring: false,
      templateRegistration: false,
      defaultsMutation: false,
      exportRun: false,
      schemaMutation: false,
      unityImport: false,
      parityClaim: false,
      scope: 'priority-1-focused-refinement-only',
    });
    await expect(readFile(path.join(output, '01-tube-canister-engineering.svg'), 'utf8'))
      .resolves.toContain('FOUR CELLS, ONE PIPE');
    await expect(readFile(path.join(output, '02-machine-noun-refinement.svg'), 'utf8'))
      .resolves.toContain('MACHINE-NOUN REFINEMENT');
    await expect(readFile(path.join(output, '03-refined-minimal-chain-room.svg'), 'utf8'))
      .resolves.toContain('NOT EXPORT / PARITY');
    await expect(readFile(result.readmePath, 'utf8')).resolves.toContain('Priority 2 has not started');
  }, 20_000);
});
