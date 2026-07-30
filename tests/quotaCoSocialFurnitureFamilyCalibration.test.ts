import { access, mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import { defaultProject } from '../src/data/defaults';
import { PROP_TEMPLATES } from '../src/props/templates';
import {
  EXPECTED_SOCIAL_FURNITURE_CONTRACTS,
  SOCIAL_FURNITURE_FAMILY_IDS,
  SOCIAL_FURNITURE_GAMEPLAY_ART_SCALES,
  proposalSocialFurnitureSvg,
  renderQuotaCoSocialFurnitureFamilyCalibration,
  renderQuotaCoSocialFurnitureFamilyProductionValidation,
  validateSocialFurnitureContracts,
} from '../scripts/quotaCoSocialFurnitureFamilyCalibrationPreview';

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

describe('QuotaCo social and lounge furniture review proof', () => {
  it('keeps the bounded seven-prop family and noun-specific art scales explicit', () => {
    expect(SOCIAL_FURNITURE_FAMILY_IDS).toEqual([
      'couch',
      'waiting-bench',
      'coffee-table',
      'break-table',
      'lounge-seating',
      'bean-bag',
      'nap-pod',
    ]);
    expect(SOCIAL_FURNITURE_GAMEPLAY_ART_SCALES).toEqual({
      couch: 0.9,
      'waiting-bench': 0.9,
      'coffee-table': 0.82,
      'break-table': 0.9,
      'lounge-seating': 0.9,
      'bean-bag': 0.84,
      'nap-pod': 0.9,
    });
    expect(EXPECTED_SOCIAL_FURNITURE_CONTRACTS).toHaveLength(7);
  });

  it('preserves projection, occupancy, shadow, parameters, defaults, and anchor status', () => {
    const validation = validateSocialFurnitureContracts();
    expect(validation).toMatchObject({ pass: true, errors: [] });
    expect(validation.contracts).toEqual(EXPECTED_SOCIAL_FURNITURE_CONTRACTS);

    const project = defaultProject();
    for (const expected of EXPECTED_SOCIAL_FURNITURE_CONTRACTS) {
      const template = PROP_TEMPLATES.find(({ id }) => id === expected.id);
      const instance = project.props.find(({ templateId }) => templateId === expected.id);
      expect(template?.projection).toBe(
        expected.id === 'nap-pod' ? 'elevation' : 'plan',
      );
      expect(template?.gridFootprint).toEqual(expected.gridFootprint);
      expect(instance?.params).toEqual(expected.defaultInstanceParams);
    }
  });

  it('renders every temporary proposal at close and far gameplay size', () => {
    for (const expected of EXPECTED_SOCIAL_FURNITURE_CONTRACTS) {
      const source = proposalSocialFurnitureSvg(
        expected.id,
        expected.defaultInstanceParams,
      );
      expect(source).toContain('viewBox="0 0 128 128"');
      expect(source).not.toMatch(/<script|<foreignObject|<text/i);
      expect(renderSize(source, 128)).toMatchObject({
        width: 128,
        height: 128,
      });
      const far = renderSize(source, 40);
      expect(far).toMatchObject({ width: 40, height: 40 });
      expect(far.bytes).toBeGreaterThan(100);
    }
  });

  it('keeps every live parameter visually active in the temporary proof', () => {
    for (const contract of EXPECTED_SOCIAL_FURNITURE_CONTRACTS) {
      const baseline = proposalSocialFurnitureSvg(
        contract.id,
        contract.defaultInstanceParams,
      );
      for (const parameter of contract.params) {
        const atMin = proposalSocialFurnitureSvg(contract.id, {
          ...contract.defaultInstanceParams,
          [parameter.key]: parameter.min,
        });
        const atMax = proposalSocialFurnitureSvg(contract.id, {
          ...contract.defaultInstanceParams,
          [parameter.key]: parameter.max,
        });
        expect(
          atMin !== atMax || baseline !== atMin,
          `${contract.id}.${parameter.key}`,
        ).toBe(true);
      }
    }
  });

  it('loads genuine canonical SVG sources after visual acceptance', async () => {
    for (const id of SOCIAL_FURNITURE_FAMILY_IDS) {
      const sourcePath = path.join(
        'assets',
        'props',
        'quota-co-workhorse-v1',
        `${id}.svg`,
      );
      await expect(access(sourcePath)).resolves.toBeUndefined();
      const source = await readFile(sourcePath, 'utf8');
      expect(source).toContain(`data-prop-id="${id}"`);
      expect(source).toContain(
        `data-projection="${id === 'nap-pod' ? 'elevation' : 'plan'}"`,
      );
      expect(source).toContain('<title>');
      expect(source).toContain('<desc>');
      expect(source).not.toMatch(/<script|<foreignObject|<text/i);
    }
  });

  it('writes the accepted reference sheet and records the locked Unity boundary', async () => {
    const output = await mkdtemp(path.join(os.tmpdir(), 'quota-social-furniture-'));
    const result = await renderQuotaCoSocialFurnitureFamilyCalibration(output);
    const metrics = JSON.parse(await readFile(result.metricsPath, 'utf8')) as {
      reviewStatus: string;
      productionPromotion: boolean;
      sourceSvgAuthoring: boolean;
      unityImport: boolean;
      commitCreated: boolean;
      exportChanged: boolean;
      schemaChanged: boolean;
      schemaVersion: number;
      contractValidation: { pass: boolean };
      sourceAssetPresence: Record<string, boolean>;
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
      commitCreated: false,
      exportChanged: true,
      schemaChanged: false,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      contractValidation: { pass: true },
      invariants: {
        authoringCanvas: 128,
        acceptedWallDatum: 112,
        characterVisualScale: 0.65,
        propNativeFrameCells: 2,
        propCharacterMultiplierApplied: false,
      },
    });
    expect(Object.keys(metrics.sourceAssetPresence).sort()).toEqual(
      [...SOCIAL_FURNITURE_FAMILY_IDS].sort(),
    );
    expect(Object.values(metrics.sourceAssetPresence).every(
      (present) => present,
    )).toBe(true);
    await expect(readFile(result.svgPath, 'utf8')).resolves.toContain(
      'SVG SOURCES PRODUCTION WIRED',
    );
    await expect(readFile(result.inventoryPath, 'utf8')).resolves.toContain(
      'Seven canonical',
    );
    expect((await readFile(result.pngPath)).byteLength).toBeGreaterThan(1000);
  }, 20_000);

  it('writes canonical-source versus imported-output production validation', async () => {
    const output = await mkdtemp(path.join(os.tmpdir(), 'quota-social-furniture-prod-'));
    const result = await renderQuotaCoSocialFurnitureFamilyProductionValidation(output);
    const metrics = JSON.parse(await readFile(result.metricsPath, 'utf8')) as {
      reviewStatus: string;
      productionPromotion: boolean;
      sourceSvgAuthoring: boolean;
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
      reviewStatus: 'production-wired-source-validation',
      productionPromotion: true,
      sourceSvgAuthoring: true,
      canonicalSvgCount: 7,
      importerGeneratedArt: true,
      unityImport: false,
      commitCreated: false,
      exportContractMutation: false,
      schemaMutation: false,
      contractValidation: { pass: true },
    });
    expect(Object.keys(metrics.sourceProvenance).sort()).toEqual(
      [...SOCIAL_FURNITURE_FAMILY_IDS].sort(),
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
  }, 20_000);
});
