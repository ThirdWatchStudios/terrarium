import { access, mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import { defaultProject } from '../src/data/defaults';
import { PROP_TEMPLATES } from '../src/props/templates';
import {
  EXPECTED_STORAGE_SUPPORT_CONTRACTS,
  STORAGE_SUPPORT_FAMILY_IDS,
  STORAGE_SUPPORT_GAMEPLAY_ART_SCALES,
  STORAGE_SUPPORT_NATIVE_FRAME_CELLS,
  proposalStorageSupportSvg,
  renderQuotaCoStorageSupportFamilyCalibration,
  renderQuotaCoStorageSupportFamilyProductionValidation,
  validateStorageSupportContracts,
} from '../scripts/quotaCoStorageSupportFamilyCalibrationPreview';

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

describe('QuotaCo storage and support family calibration', () => {
  it('keeps the seven review targets bounded and independently scaled', () => {
    expect(STORAGE_SUPPORT_FAMILY_IDS).toEqual([
      'bookshelf',
      'lockers',
      'open-shelving',
      'pantry-shelf',
      'mail-station',
      'server-rack',
      'coat-rack',
    ]);
    expect(STORAGE_SUPPORT_NATIVE_FRAME_CELLS).toBe(2);
    expect(STORAGE_SUPPORT_GAMEPLAY_ART_SCALES).toEqual({
      bookshelf: 0.8,
      lockers: 0.8,
      'open-shelving': 0.8,
      'pantry-shelf': 0.78,
      'mail-station': 0.8,
      'server-rack': 0.8,
      'coat-rack': 0.72,
    });
  });

  it('preserves projection, occupancy, shadows, params, registrations, and mail anchor', () => {
    const validation = validateStorageSupportContracts();
    expect(validation).toMatchObject({ pass: true, errors: [] });
    const project = defaultProject();
    for (const expected of EXPECTED_STORAGE_SUPPORT_CONTRACTS) {
      const template = PROP_TEMPLATES.find(({ id }) => id === expected.id);
      const instance = project.props.find(({ templateId }) => templateId === expected.id);
      expect(template?.projection).toBe('elevation');
      expect(template?.gridFootprint).toEqual({ w: 1, h: 1 });
      expect(instance?.params).toEqual(expected.defaultInstanceParams);
    }
    expect(
      EXPECTED_STORAGE_SUPPORT_CONTRACTS.find(({ id }) => id === 'mail-station')
        ?.interactionType,
    ).toBe('mail_station');
    expect(
      EXPECTED_STORAGE_SUPPORT_CONTRACTS
        .filter(({ id }) => id !== 'mail-station')
        .every(({ interactionType }) => interactionType === null),
    ).toBe(true);
  });

  it('renders every code-owned proposal cleanly at close and far gameplay size', () => {
    for (const id of STORAGE_SUPPORT_FAMILY_IDS) {
      const source = proposalStorageSupportSvg(id);
      expect(source).toContain('viewBox="0 0 128 128"');
      expect(source).not.toMatch(/<script|<foreignObject|<text/i);
      expect(renderSize(source, 128)).toMatchObject({ width: 128, height: 128 });
      const far = renderSize(source, 40);
      expect(far).toMatchObject({ width: 40, height: 40 });
      expect(far.bytes).toBeGreaterThan(100);
    }
  });

  it('keeps every existing authoring parameter visibly active', () => {
    for (const contract of EXPECTED_STORAGE_SUPPORT_CONTRACTS) {
      for (const param of contract.params) {
        const low = {
          ...contract.defaultInstanceParams,
          [param.key]: param.min,
        };
        const high = {
          ...contract.defaultInstanceParams,
          [param.key]: param.max,
        };
        expect(proposalStorageSupportSvg(contract.id, low)).not.toBe(
          proposalStorageSupportSvg(contract.id, high),
        );
      }
    }
  });

  it('loads genuine canonical SVG assets after visual approval', async () => {
    for (const id of STORAGE_SUPPORT_FAMILY_IDS) {
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

  it('writes the accepted reference with source/template promotion and Unity still deferred', async () => {
    const output = await mkdtemp(path.join(os.tmpdir(), 'quota-storage-support-'));
    const result = await renderQuotaCoStorageSupportFamilyCalibration(output);
    const metrics = JSON.parse(await readFile(result.metricsPath, 'utf8')) as {
      reviewStatus: string;
      productionPromotion: boolean;
      sourceSvgAuthoring: boolean;
      templateMutation: boolean;
      exportContractMutation: boolean;
      schemaMutation: boolean;
      unityIntegrationMutation: boolean;
      unityImport: boolean;
      commitCreated: boolean;
      schemaVersion: number;
      sourceAssetsPresent: Record<string, boolean>;
      contractValidation: { pass: boolean };
      invariants: {
        authoringCanvas: number;
        acceptedWallDatum: number;
        characterVisualScale: number;
        propNativeFrameCells: number;
        propCharacterMultiplierApplied: boolean;
        projection: string;
        groundPivotY: number;
      };
    };
    expect(metrics).toMatchObject({
      reviewStatus: 'accepted-direction-reference',
      productionPromotion: true,
      sourceSvgAuthoring: true,
      templateMutation: true,
      exportContractMutation: false,
      schemaMutation: false,
      unityIntegrationMutation: false,
      unityImport: false,
      commitCreated: false,
      schemaVersion: 21,
      contractValidation: { pass: true },
      invariants: {
        authoringCanvas: 128,
        acceptedWallDatum: 112,
        characterVisualScale: 0.65,
        propNativeFrameCells: 2,
        propCharacterMultiplierApplied: false,
        projection: 'elevation',
        groundPivotY: 116,
      },
    });
    expect(Object.values(metrics.sourceAssetsPresent).every((present) => present)).toBe(true);
    await expect(readFile(result.svgPath, 'utf8')).resolves.toContain(
      'SVG SOURCES PRODUCTION WIRED',
    );
    await expect(readFile(result.inventoryPath, 'utf8')).resolves.toContain(
      'canonical SVG sources and Terrarium production wiring complete',
    );
    expect((await readFile(result.pngPath)).byteLength).toBeGreaterThan(1000);
  }, 15_000);

  it('writes canonical-source versus imported-output production validation', async () => {
    const output = await mkdtemp(path.join(os.tmpdir(), 'quota-storage-support-prod-'));
    const result = await renderQuotaCoStorageSupportFamilyProductionValidation(output);
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
        variantCount: number;
      }>;
    };
    expect(metrics).toMatchObject({
      reviewStatus: 'production-wired-awaiting-final-family-closeout',
      productionPromotion: true,
      canonicalSvgCount: 7,
      importerGeneratedArt: true,
      unityImport: false,
      commitCreated: false,
      exportContractMutation: false,
      schemaMutation: false,
      contractValidation: { pass: true },
    });
    expect(Object.keys(metrics.sourceProvenance).sort()).toEqual(
      [...STORAGE_SUPPORT_FAMILY_IDS].sort(),
    );
    expect(Object.values(metrics.sourceProvenance).every(
      ({ hashMatchesImportedArt, projectionMatches, variantCount }) =>
        hashMatchesImportedArt && projectionMatches && variantCount > 0,
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
