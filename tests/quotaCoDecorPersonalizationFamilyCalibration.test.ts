import { access, mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import { defaultProject } from '../src/data/defaults';
import { PROP_TEMPLATES } from '../src/props/templates';
import {
  DECOR_PERSONALIZATION_FAMILY_IDS,
  DECOR_PERSONALIZATION_GAMEPLAY_ART_SCALES,
  EXPECTED_DECOR_PERSONALIZATION_CONTRACTS,
  proposalDecorPersonalizationSvg,
  renderQuotaCoDecorPersonalizationFamilyCalibration,
  renderQuotaCoDecorPersonalizationFamilyProductionValidation,
  validateDecorPersonalizationContracts,
} from '../scripts/quotaCoDecorPersonalizationFamilyCalibrationPreview';

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

describe('QuotaCo decor and personalization review proof', () => {
  it('keeps the bounded nine-prop family and noun-specific scales explicit', () => {
    expect(DECOR_PERSONALIZATION_FAMILY_IDS).toEqual([
      'potted-tree',
      'hanging-plant',
      'floor-lamp',
      'framed-art',
      'poster',
      'wall-clock',
      'fish-tank',
      'string-lights',
      'rug',
    ]);
    expect(DECOR_PERSONALIZATION_GAMEPLAY_ART_SCALES).toEqual({
      'potted-tree': 0.78,
      'hanging-plant': 0.86,
      'floor-lamp': 0.76,
      'framed-art': 0.92,
      poster: 0.74,
      'wall-clock': 0.72,
      'fish-tank': 0.82,
      'string-lights': 1,
      rug: 0.94,
    });
    expect(EXPECTED_DECOR_PERSONALIZATION_CONTRACTS).toHaveLength(9);
  });

  it('preserves projection, placement, occupancy, shadow, parameters, and defaults', () => {
    const validation = validateDecorPersonalizationContracts();
    expect(validation).toMatchObject({ pass: true, errors: [] });
    expect(validation.contracts).toEqual(
      EXPECTED_DECOR_PERSONALIZATION_CONTRACTS,
    );

    const project = defaultProject();
    for (const expected of EXPECTED_DECOR_PERSONALIZATION_CONTRACTS) {
      const template = PROP_TEMPLATES.find(({ id }) => id === expected.id);
      const instance = project.props.find(
        ({ templateId }) => templateId === expected.id,
      );
      expect(template?.projection).toBe(expected.projection);
      expect(template?.placement ?? 'floor').toBe(expected.placement);
      expect(template?.gridFootprint).toEqual(expected.gridFootprint);
      expect(instance?.params).toEqual(expected.defaultInstanceParams);
    }
  });

  it('renders every accepted reference cleanly at close and far gameplay size', () => {
    for (const expected of EXPECTED_DECOR_PERSONALIZATION_CONTRACTS) {
      const source = proposalDecorPersonalizationSvg(
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
      expect(far.bytes, expected.id).toBeGreaterThan(100);
    }
  });

  it('keeps every existing parameter visually active in the accepted reference', () => {
    for (const expected of EXPECTED_DECOR_PERSONALIZATION_CONTRACTS) {
      for (const parameter of expected.params) {
        const atMin = proposalDecorPersonalizationSvg(expected.id, {
          ...expected.defaultInstanceParams,
          [parameter.key]: parameter.min,
        });
        const atMax = proposalDecorPersonalizationSvg(expected.id, {
          ...expected.defaultInstanceParams,
          [parameter.key]: parameter.max,
        });
        expect(atMin, `${expected.id}.${parameter.key}`).not.toBe(atMax);
      }
    }
  });

  it('loads genuine canonical SVG sources after visual acceptance', async () => {
    for (const id of DECOR_PERSONALIZATION_FAMILY_IDS) {
      const sourcePath = path.join(
        'assets',
        'props',
        'quota-co-workhorse-v1',
        `${id}.svg`,
      );
      await expect(access(sourcePath)).resolves.toBeUndefined();
      const source = await readFile(sourcePath, 'utf8');
      const expected = EXPECTED_DECOR_PERSONALIZATION_CONTRACTS.find(
        (contract) => contract.id === id,
      );
      expect(source).toContain(`data-prop-id="${id}"`);
      expect(source).toContain(
        `data-projection="${expected?.projection}"`,
      );
      expect(source).toContain('<title>');
      expect(source).toContain('<desc>');
      expect(source).not.toMatch(/<script|<foreignObject|<text/i);
    }
  });

  it('writes the accepted sheet while holding the Unity and commit boundaries', async () => {
    const output = await mkdtemp(
      path.join(os.tmpdir(), 'quota-decor-personalization-'),
    );
    const result = await renderQuotaCoDecorPersonalizationFamilyCalibration(
      output,
    );
    const metrics = JSON.parse(await readFile(result.metricsPath, 'utf8')) as {
      reviewStatus: string;
      productionPromotion: boolean;
      sourceSvgAuthoring: boolean;
      templateMutation: boolean;
      defaultMutation: boolean;
      unityImport: boolean;
      commitCreated: boolean;
      exportContractMutation: boolean;
      schemaMutation: boolean;
      schemaVersion: number;
      authoringCanvas: number;
      acceptedWallDatum: number;
      characterVisualScale: number;
      propScalePolicy: string;
      contractValidation: { pass: boolean };
      sourceAssetPresence: Record<string, boolean>;
      evaluationContexts: string[];
    };
    expect(metrics).toMatchObject({
      reviewStatus: 'accepted-direction-reference',
      productionPromotion: true,
      sourceSvgAuthoring: true,
      templateMutation: true,
      defaultMutation: true,
      unityImport: false,
      commitCreated: false,
      exportContractMutation: false,
      schemaMutation: false,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      authoringCanvas: 128,
      acceptedWallDatum: 112,
      characterVisualScale: 0.65,
      propScalePolicy: 'independent-per-noun',
      contractValidation: { pass: true },
    });
    expect(Object.keys(metrics.sourceAssetPresence).sort()).toEqual(
      [...DECOR_PERSONALIZATION_FAMILY_IDS].sort(),
    );
    expect(
      Object.values(metrics.sourceAssetPresence).every((present) => present),
    ).toBe(true);
    expect(metrics.evaluationContexts).toEqual(
      expect.arrayContaining([
        'close-current-versus-proposal',
        'normal-employee-lounge',
        'normal-hallway-gallery',
        'normal-quiet-nook',
        'wall-slot-register',
        'desk-occlusion',
        'crowded-lounge',
        'far-gameplay-strip',
      ]),
    );
    await expect(readFile(result.svgPath, 'utf8')).resolves.toContain(
      'Accepted Catalog Personalization System',
    );
    await expect(readFile(result.inventoryPath, 'utf8')).resolves.toContain(
      'accepted direction and production-wired SVG family',
    );
    expect((await readFile(result.pngPath)).byteLength).toBeGreaterThan(1000);
  }, 20_000);

  it('writes canonical-source versus imported-output production validation', async () => {
    const output = await mkdtemp(
      path.join(os.tmpdir(), 'quota-decor-personalization-prod-'),
    );
    const result =
      await renderQuotaCoDecorPersonalizationFamilyProductionValidation(output);
    const metrics = JSON.parse(await readFile(result.metricsPath, 'utf8')) as {
      reviewStatus: string;
      productionPromotion: boolean;
      sourceSvgAuthoring: boolean;
      canonicalSvgCount: number;
      importerGeneratedArt: boolean;
      authoredSvgStylePolicy: {
        globalRestylingDefault: boolean;
        compositorOutlineDefault: boolean;
        compositorContactShadowDefault: boolean;
        exportLayerMode: string;
        explicitOptIn: string;
      };
      unityImport: boolean;
      commitCreated: boolean;
      exportContractMutation: boolean;
      schemaMutation: boolean;
      contractValidation: { pass: boolean };
      sourceProvenance: Record<string, {
        hashMatchesImportedArt: boolean;
        projectionMatches: boolean;
        defaultExportLayerCount: number;
        defaultExportTints: Array<string | null>;
      }>;
    };
    expect(metrics).toMatchObject({
      reviewStatus: 'production-wired-source-validation',
      productionPromotion: true,
      sourceSvgAuthoring: true,
      canonicalSvgCount: 9,
      importerGeneratedArt: true,
      authoredSvgStylePolicy: {
        globalRestylingDefault: false,
        compositorOutlineDefault: false,
        compositorContactShadowDefault: false,
        exportLayerMode: 'single-resolved-untinted',
        explicitOptIn: 'restyleAuthoredSvg',
      },
      unityImport: false,
      commitCreated: false,
      exportContractMutation: false,
      schemaMutation: false,
      contractValidation: { pass: true },
    });
    expect(Object.keys(metrics.sourceProvenance).sort()).toEqual(
      [...DECOR_PERSONALIZATION_FAMILY_IDS].sort(),
    );
    expect(Object.values(metrics.sourceProvenance).every(
      ({
        hashMatchesImportedArt,
        projectionMatches,
        defaultExportLayerCount,
        defaultExportTints,
      }) =>
        hashMatchesImportedArt
        && projectionMatches
        && defaultExportLayerCount === 1
        && defaultExportTints.length === 1
        && defaultExportTints[0] === null,
    )).toBe(true);
    await expect(readFile(result.svgPath, 'utf8')).resolves.toContain(
      'CANONICAL SVG',
    );
    await expect(readFile(result.svgPath, 'utf8')).resolves.toContain(
      'No Unity import and no commit.',
    );
    await expect(readFile(result.svgPath, 'utf8')).resolves.toContain(
      'GLOBAL PROP STYLE OFF',
    );
    expect((await readFile(result.pngPath)).byteLength).toBeGreaterThan(1000);
  }, 20_000);
});
