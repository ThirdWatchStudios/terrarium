import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';

import {
  DEPARTMENT_MACHINE_MOTION_CONTRACT_QUESTIONS,
  DEPARTMENT_MACHINE_MOTION_PILOTS,
  departmentMachineMotionFrameSvg,
  renderDepartmentMachineMotionCalibration,
  renderDepartmentMachineMotionContractSvg,
  renderDepartmentMachineMotionLoopSvg,
  renderDepartmentMachineMotionRoomSvg,
} from '../scripts/quotaCoDepartmentMachineMotionCalibrationPreview';
import { departmentAssetCatalogJson } from '../src/props/departmentAssetCatalog';

function raster(svg: string, width?: number): PNG {
  return PNG.sync.read(new Resvg(
    svg,
    width ? { fitTo: { mode: 'width', value: width } } : undefined,
  ).render().asPng());
}

describe('QuotaCo department machine motion pilot', () => {
  it('covers noise, heat, fumes, and a quiet control with distinct physical primitives', () => {
    expect(DEPARTMENT_MACHINE_MOTION_PILOTS).toEqual([
      expect.objectContaining({ id: 'tabulating_machine', pollution: 'noise', primitive: 'impact-cycle' }),
      expect.objectContaining({ id: 'calculating_engine', pollution: 'heat', primitive: 'continuous-mechanism' }),
      expect.objectContaining({ id: 'rotary_duplicator', pollution: 'fumes', primitive: 'rotary-feed' }),
      expect.objectContaining({ id: 'comparator', pollution: 'quiet-control', primitive: 'gate-settle' }),
    ]);
  });

  it('keeps frame zero pixel-identical to each accepted static canonical source', async () => {
    for (const pilot of DEPARTMENT_MACHINE_MOTION_PILOTS) {
      const source = await readFile(
        path.resolve(`assets/props/quota-co-department-machines-v1/${pilot.id}.svg`),
        'utf8',
      );
      expect(
        Buffer.compare(raster(departmentMachineMotionFrameSvg(pilot.id, 0)).data, raster(source).data),
        pilot.id,
      ).toBe(0);
    }
  });

  it('moves functional components without moving the housing or baking pollution effects', () => {
    for (const pilot of DEPARTMENT_MACHINE_MOTION_PILOTS) {
      const idle = raster(departmentMachineMotionFrameSvg(pilot.id, 0));
      const active = raster(departmentMachineMotionFrameSvg(pilot.id, 2));
      expect(Buffer.compare(idle.data, active.data), `${pilot.id} active frame`).not.toBe(0);
      expect(departmentMachineMotionFrameSvg(pilot.id, 2)).toContain(`${pilot.id}-accepted-static-base`);
      expect(raster(departmentMachineMotionFrameSvg(pilot.id, 2), 40))
        .toMatchObject({ width: 40, height: 40 });
    }
    const proofText = renderDepartmentMachineMotionContractSvg() + renderDepartmentMachineMotionRoomSvg();
    expect(proofText).toContain('NEVER BAKED INTO SKU');
    expect(proofText).toContain('no glow, haze, fumes, sound rings, or UI');
    expect(proofText).not.toMatch(/amber status|rose status|camera lens/i);
  });

  it('keeps state/timing and phase ownership explicit while leaving production manifest v3 static', () => {
    expect(DEPARTMENT_MACHINE_MOTION_CONTRACT_QUESTIONS.map(({ id }) => id)).toEqual([
      'frame-vocabulary',
      'state-ownership',
      'phase-desynchronization',
      'pollution-boundary',
      'export-shape',
    ]);
    const catalog = departmentAssetCatalogJson();
    expect(catalog.version).toBe(3);
    expect(JSON.stringify(catalog)).not.toContain('animations');
    const loop = renderDepartmentMachineMotionLoopSvg();
    expect(loop).toContain('animation-duration:1.2s');
    expect(loop).toContain('runtime must desynchronize instances');
  });

  it('writes review-only animation and contract evidence with all promotion gates closed', async () => {
    const output = await mkdtemp(path.join(os.tmpdir(), 'quota-machine-motion-'));
    const result = await renderDepartmentMachineMotionCalibration(output);
    expect(result.files).toHaveLength(9);
    const metrics = JSON.parse(await readFile(result.metricsPath, 'utf8')) as Record<string, unknown>;
    expect(metrics).toMatchObject({
      reviewStatus: 'awaiting-owner-machine-motion-direction-and-contract-approval',
      scope: 'department-machine-motion-pilot-review-only',
      frameCountPerWorkingLoop: 4,
      productionMutation: false,
      canonicalSvgAuthoring: false,
      templateRegistration: false,
      departmentManifestMutation: false,
      contractMutation: false,
      schemaMutation: false,
      exportRun: false,
      parityClaim: false,
      currentStaticSpritesStable: true,
      pollutionEffectsBakedIntoFrames: false,
      wholeHousingMotion: false,
      unityImport: false,
    });
    await expect(readFile(path.join(output, '01-motion-primitive-ladder.svg'), 'utf8'))
      .resolves.toContain('NOT PROMOTED');
    await expect(readFile(result.readmePath, 'utf8'))
      .resolves.toContain('no animation or export contract has been promoted');
  }, 20_000);
});
