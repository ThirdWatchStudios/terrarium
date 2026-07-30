import { access, mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import { defaultProject } from '../src/data/defaults';
import { PROP_TEMPLATES } from '../src/props/templates';
import {
  EXPECTED_SERVICE_MACHINE_CONTRACTS,
  SERVICE_MACHINE_FAILURE_IDS,
  SERVICE_MACHINE_FAMILY_IDS,
  SERVICE_MACHINE_GAMEPLAY_ART_SCALES,
  SERVICE_MACHINE_SOURCE_IDS,
  proposalServiceMachineSvg,
  renderQuotaCoServiceMachineFamilyCalibration,
  renderQuotaCoServiceMachineFamilyProductionValidation,
  validateServiceMachineContracts,
} from '../scripts/quotaCoServiceMachineFamilyCalibrationPreview';

function renderSize(svg: string, width: number): {
  readonly width: number;
  readonly height: number;
  readonly bytes: number;
} {
  const rendered = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
  }).render();
  return {
    width: rendered.width,
    height: rendered.height,
    bytes: rendered.asPng().byteLength,
  };
}

describe('QuotaCo employee-service machine family', () => {
  it('keeps the seven base machines and three failure-state twins bounded', () => {
    expect(SERVICE_MACHINE_FAMILY_IDS).toEqual([
      'printer',
      'coffee-machine',
      'water-cooler',
      'shredder',
      'microwave',
      'fridge',
      'vending-machine',
    ]);
    expect(SERVICE_MACHINE_FAILURE_IDS).toEqual([
      'printer-jammed',
      'coffee-machine-broken',
      'water-cooler-empty',
    ]);
    expect(SERVICE_MACHINE_SOURCE_IDS).toHaveLength(10);
    expect(EXPECTED_SERVICE_MACHINE_CONTRACTS).toHaveLength(10);
    expect(SERVICE_MACHINE_GAMEPLAY_ART_SCALES).toEqual({
      printer: 0.84,
      'printer-jammed': 0.84,
      'coffee-machine': 0.84,
      'coffee-machine-broken': 0.84,
      'water-cooler': 0.86,
      'water-cooler-empty': 0.86,
      shredder: 0.82,
      microwave: 0.85,
      fridge: 0.86,
      'vending-machine': 0.86,
    });
  });

  it('preserves every template, instance, elevation projection, footprint, and parameter contract', () => {
    const validation = validateServiceMachineContracts();
    expect(validation).toMatchObject({ pass: true, errors: [] });
    const project = defaultProject();
    for (const expected of EXPECTED_SERVICE_MACHINE_CONTRACTS) {
      const template = PROP_TEMPLATES.find(({ id }) => id === expected.id);
      const instance = project.props.find(({ templateId }) => templateId === expected.id);
      expect(template?.projection).toBe('elevation');
      expect(template?.gridFootprint).toEqual({ w: 1, h: 1 });
      expect(instance?.params).toEqual(expected.defaultInstanceParams);
    }
  });

  it('keeps each failure state on the same physical contract as its base machine', () => {
    const pairs = [
      ['printer', 'printer-jammed'],
      ['coffee-machine', 'coffee-machine-broken'],
      ['water-cooler', 'water-cooler-empty'],
    ] as const;
    for (const [baseId, failureId] of pairs) {
      const base = EXPECTED_SERVICE_MACHINE_CONTRACTS.find(({ id }) => id === baseId);
      const failure = EXPECTED_SERVICE_MACHINE_CONTRACTS.find(({ id }) => id === failureId);
      expect(failure).toMatchObject({
        projection: base?.projection,
        gridFootprint: base?.gridFootprint,
        contactShadow: base?.contactShadow,
        params: base?.params,
        defaultInstanceParams: base?.defaultInstanceParams,
      });
    }
  });

  it('renders every code-owned proposal cleanly at close and far gameplay size', () => {
    for (const id of [...SERVICE_MACHINE_FAMILY_IDS, ...SERVICE_MACHINE_FAILURE_IDS]) {
      const source = proposalServiceMachineSvg(id);
      expect(source).toContain('viewBox="0 0 128 128"');
      expect(source).not.toMatch(/<script|<foreignObject|<text/i);
      expect(renderSize(source, 128)).toMatchObject({ width: 128, height: 128 });
      const far = renderSize(source, 40);
      expect(far).toMatchObject({ width: 40, height: 40 });
      expect(far.bytes).toBeGreaterThan(100);
    }
  });

  it('loads genuine canonical SVG assets for every base and failure-state machine', async () => {
    for (const id of [...SERVICE_MACHINE_FAMILY_IDS, ...SERVICE_MACHINE_FAILURE_IDS]) {
      const sourcePath = path.join(
        'assets',
        'props',
        'quota-co-workhorse-v1',
        `${id}.svg`,
      );
      await expect(access(sourcePath)).resolves.toBeUndefined();
      const source = await readFile(sourcePath, 'utf8');
      expect(source).toContain(`data-prop-id="${id}"`);
      expect(source).toContain('data-projection="elevation"');
      expect(source).toContain('<title>');
      expect(source).toContain('<desc>');
      expect(source).not.toMatch(/<script|<foreignObject|<text/i);
    }
  });

  it('writes the accepted reference sheet and metrics with the locked scale boundary', async () => {
    const output = await mkdtemp(path.join(os.tmpdir(), 'quota-service-machines-'));
    const result = await renderQuotaCoServiceMachineFamilyCalibration(output);
    const metrics = JSON.parse(await readFile(result.metricsPath, 'utf8')) as {
      reviewStatus: string;
      productionPromotion: boolean;
      sourceSvgAuthoring: boolean;
      unityImport: boolean;
      contractValidation: { pass: boolean };
      invariants: {
        authoringCanvas: number;
        acceptedWallDatum: number;
        characterVisualScale: number;
        propNativeFrameCells: number;
        propCharacterMultiplierApplied: boolean;
      };
    };
    expect(metrics).toMatchObject({
      reviewStatus: 'accepted-direction-reference',
      productionPromotion: true,
      sourceSvgAuthoring: true,
      unityImport: false,
      contractValidation: { pass: true },
      invariants: {
        authoringCanvas: 128,
        acceptedWallDatum: 112,
        characterVisualScale: 0.65,
        propNativeFrameCells: 2,
        propCharacterMultiplierApplied: false,
      },
    });
    await expect(readFile(result.svgPath, 'utf8')).resolves.toContain(
      'SVG SOURCES AUTHORED',
    );
    expect((await readFile(result.pngPath)).byteLength).toBeGreaterThan(1000);
    await expect(readFile(result.inventoryPath, 'utf8')).resolves.toContain(
      'Ten canonical',
    );
  }, 15_000);

  it('writes canonical-source versus imported-output production validation', async () => {
    const output = await mkdtemp(path.join(os.tmpdir(), 'quota-service-machines-prod-'));
    const result = await renderQuotaCoServiceMachineFamilyProductionValidation(output);
    const metrics = JSON.parse(await readFile(result.metricsPath, 'utf8')) as {
      reviewStatus: string;
      productionPromotion: boolean;
      canonicalSvgCount: number;
      importerGeneratedArt: boolean;
      unityImport: boolean;
      commitCreated: boolean;
      exportContractMutation: boolean;
      schemaMutation: boolean;
      contractValidation: { pass: boolean };
      sourceProvenance: Record<string, {
        hashMatchesImportedArt: boolean;
        projectionMatches: boolean;
      }>;
    };
    expect(metrics).toMatchObject({
      reviewStatus: 'production-wired-awaiting-visual-approval',
      productionPromotion: true,
      canonicalSvgCount: 10,
      importerGeneratedArt: true,
      unityImport: false,
      commitCreated: false,
      exportContractMutation: false,
      schemaMutation: false,
      contractValidation: { pass: true },
    });
    expect(Object.keys(metrics.sourceProvenance).sort()).toEqual(
      [...SERVICE_MACHINE_SOURCE_IDS].sort(),
    );
    expect(Object.values(metrics.sourceProvenance).every(
      ({ hashMatchesImportedArt, projectionMatches }) =>
        hashMatchesImportedArt && projectionMatches,
    )).toBe(true);
    await expect(readFile(result.svgPath, 'utf8')).resolves.toContain(
      'CANONICAL SVG',
    );
    await expect(readFile(result.svgPath, 'utf8')).resolves.toContain(
      'No Unity import and no commit.',
    );
    expect((await readFile(result.pngPath)).byteLength).toBeGreaterThan(1000);
  }, 15_000);
});
