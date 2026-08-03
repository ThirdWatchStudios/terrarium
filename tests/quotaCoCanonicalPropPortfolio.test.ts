import { readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { mkdtemp } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import {
  CANONICAL_PROP_PORTFOLIO_GROUPS,
  renderQuotaCoCanonicalPropPortfolio,
} from '../scripts/quotaCoCanonicalPropPortfolioPreview';
import {
  QUOTA_CO_EXTERIOR_WORKHORSE_PROP_IDS,
  QUOTA_CO_INTERIOR_WORKHORSE_PROP_IDS,
  QUOTA_CO_WORKHORSE_PROP_IDS,
} from '../scripts/props/importer';

describe('QuotaCo canonical prop portfolio', () => {
  it('groups every authored workhorse exactly once while keeping carryovers explicit', () => {
    const grouped = CANONICAL_PROP_PORTFOLIO_GROUPS.flatMap(
      ({ authoredIds }) => authoredIds,
    );
    expect(grouped).toHaveLength(54);
    expect(new Set(grouped).size).toBe(grouped.length);
    expect([...grouped].sort()).toEqual(
      [...QUOTA_CO_INTERIOR_WORKHORSE_PROP_IDS].sort(),
    );
    expect(QUOTA_CO_WORKHORSE_PROP_IDS).toHaveLength(62);
    expect(
      CANONICAL_PROP_PORTFOLIO_GROUPS.find(
        ({ id }) => id === 'handheld-character-relative',
      )?.carryoverIds,
    ).toEqual(['acc-clipboard']);
    expect(
      CANONICAL_PROP_PORTFOLIO_GROUPS.find(
        ({ id }) => id === 'outdoor-construction',
      )?.carryoverIds,
    ).toEqual(QUOTA_CO_EXTERIOR_WORKHORSE_PROP_IDS);
  });

  it('writes the 54-source visual gate with canonical default styling and held boundaries', async () => {
    const output = await mkdtemp(
      path.join(os.tmpdir(), 'quota-canonical-prop-portfolio-'),
    );
    const result = await renderQuotaCoCanonicalPropPortfolio(output);
    const metrics = JSON.parse(
      await readFile(result.metricsPath, 'utf8'),
    ) as {
      reviewStatus: string;
      canonicalSvgCount: number;
      productionPromotion: boolean;
      bundleExportPerformed: boolean;
      unityImport: boolean;
      runtimeVisualAcceptance: boolean;
      runtimeVisualAcceptanceDeferred: boolean;
      runtimeVisualAcceptanceReason: string;
      commitCreated: boolean;
      exportContractMutation: boolean;
      schemaMutation: boolean;
      schemaVersion: number;
      invariants: {
        authoringCanvas: number;
        acceptedWallDatum: number;
        characterVisualScale: number;
        propCharacterMultiplierApplied: boolean;
        nativePropFrameCells: number;
        gameplayRootsAndFootprintsPreserved: boolean;
      };
      authoredSvgStylePolicy: {
        globalRestylingDefault: boolean;
        compositorOutlineDefault: boolean;
        compositorContactShadowDefault: boolean;
        exportLayerMode: string;
        explicitOptIn: string;
      };
      sourceValidation: Record<string, {
        sourceHashMatches: boolean;
        normalizedPixelDelta: number;
        close: {
          visiblePixels: number;
          bounds: {
            minX: number;
            minY: number;
            maxX: number;
            maxY: number;
          } | null;
        };
        far: {
          visiblePixels: number;
          bounds: {
            minX: number;
            minY: number;
            maxX: number;
            maxY: number;
          } | null;
        };
        defaultLayerCount: number;
        defaultLayerTints: Array<string | null>;
      }>;
      evaluationContexts: string[];
    };

    expect(metrics).toMatchObject({
      reviewStatus: 'canonical-portfolio-unity-imported-runtime-deferred',
      canonicalSvgCount: 54,
      productionPromotion: true,
      bundleExportPerformed: true,
      unityImport: true,
      runtimeVisualAcceptance: false,
      runtimeVisualAcceptanceDeferred: true,
      runtimeVisualAcceptanceReason:
        'The cafeteria facilities do not yet have a viable in-game path.',
      commitCreated: false,
      exportContractMutation: false,
      schemaMutation: false,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      invariants: {
        authoringCanvas: 128,
        acceptedWallDatum: 112,
        characterVisualScale: 0.65,
        propCharacterMultiplierApplied: false,
        nativePropFrameCells: 2,
        gameplayRootsAndFootprintsPreserved: true,
      },
      authoredSvgStylePolicy: {
        globalRestylingDefault: false,
        compositorOutlineDefault: false,
        compositorContactShadowDefault: false,
        exportLayerMode: 'single-resolved-untinted',
        explicitOptIn: 'restyleAuthoredSvg',
      },
    });

    expect(Object.keys(metrics.sourceValidation).sort()).toEqual(
      [...QUOTA_CO_INTERIOR_WORKHORSE_PROP_IDS].sort(),
    );
    for (const [id, validation] of Object.entries(metrics.sourceValidation)) {
      expect(validation.sourceHashMatches, `${id} source provenance`).toBe(true);
      expect(
        validation.normalizedPixelDelta,
        `${id} source/output raster delta`,
      ).toBeLessThan(0.002);
      expect(validation.defaultLayerCount, `${id} layer count`).toBe(1);
      expect(validation.defaultLayerTints, `${id} layer tints`).toEqual([null]);
      expect(validation.close.visiblePixels, `${id} close read`).toBeGreaterThan(0);
      expect(validation.far.visiblePixels, `${id} far read`).toBeGreaterThan(0);
      expect(validation.close.bounds?.minX, `${id} close left`).toBeGreaterThanOrEqual(0);
      expect(validation.close.bounds?.minY, `${id} close top`).toBeGreaterThanOrEqual(0);
      expect(validation.close.bounds?.maxX, `${id} close right`).toBeLessThan(128);
      expect(validation.close.bounds?.maxY, `${id} close bottom`).toBeLessThan(128);
      expect(validation.far.bounds?.minX, `${id} far left`).toBeGreaterThanOrEqual(0);
      expect(validation.far.bounds?.minY, `${id} far top`).toBeGreaterThanOrEqual(0);
      expect(validation.far.bounds?.maxX, `${id} far right`).toBeLessThan(40);
      expect(validation.far.bounds?.maxY, `${id} far bottom`).toBeLessThan(40);
    }
    expect(metrics.evaluationContexts).toEqual(expect.arrayContaining([
      'close-canonical-svg-versus-terrarium-output',
      'normal-workstation-service',
      'normal-meeting-lounge',
      'normal-storage-machine-bay',
      'far-crowded-room',
      'wall-context',
      'desk-occlusion',
      'character-relative-handheld',
      'separately-gated-outdoor-carriers',
    ]));

    const svg = await readFile(result.svgPath, 'utf8');
    expect(svg).toContain('All 54 interior artist-editable SVGs promoted');
    expect(svg).toContain('TERRARIUM PRODUCTION SOURCE · UNITY IMPORTED');
    expect(svg).toContain('HANDHELD AND CHARACTER-RELATIVE ITEMS');
    expect(svg).toContain('OUTDOOR AND CONSTRUCTION-SITE PROPS');
    expect(svg).toContain('props native 2-cell frames');
    expect(svg).toContain(
      'BROWSER EXPORT + UNITY IMPORT COMPLETE · RUNTIME VISUAL DEFERRED · NO COMMIT',
    );
    expect((await readFile(result.pngPath)).byteLength).toBeGreaterThan(50_000);
  }, 20_000);
});
