import path from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import {
  EQUAL_HEIGHT_SOCKET_REGISTER_PROFILE_STRIP_WIDTH,
  EQUAL_HEIGHT_SOCKET_REGISTER_RENDER_PIXEL_BUDGET,
  EQUAL_HEIGHT_SOCKET_REGISTER_RETAINED_PIXEL_BUDGET,
  EQUAL_HEIGHT_SOCKET_REGISTER_TRANSIENT_PIXEL_BUDGET,
  enumerateEqualHeightSocketRegisterLegalPairs,
  equalHeightSocketRegisterAuditJson,
  equalHeightSocketRegisterAuditText,
  runEqualHeightSocketRegisterAudit,
  type EqualHeightSocketRegisterAuditReport,
} from '../scripts/highOblique/equalHeightSocketRegisterAudit';
import { EQUAL_HEIGHT_MASK_LEDGER } from '../scripts/highOblique/equalHeightMaskLedger';

describe('QuotaCo equal-height socket/register report harness', () => {
  let report: EqualHeightSocketRegisterAuditReport;

  beforeAll(async () => {
    report = await runEqualHeightSocketRegisterAudit({
      repoRoot: path.resolve(import.meta.dirname, '..'),
    });
  }, 30_000);

  it('enumerates every canonical legal east/south adjacency', () => {
    const pairs = enumerateEqualHeightSocketRegisterLegalPairs();

    expect(pairs).toHaveLength(338);
    expect(
      pairs.filter(({ direction }) => direction === 'e'),
    ).toHaveLength(169);
    expect(
      pairs.filter(({ direction }) => direction === 's'),
    ).toHaveLength(169);
    expect(new Set(
      pairs.map(
        ({ direction, firstMask, secondMask }) =>
          `${direction}:${firstMask}:${secondMask}`,
      ),
    )).toHaveLength(338);
    for (const { direction, firstMask, secondMask } of pairs) {
      const first = EQUAL_HEIGHT_MASK_LEDGER.entries[firstMask];
      const second = EQUAL_HEIGHT_MASK_LEDGER.entries[secondMask];
      expect(first.connectedEdges).toContain(direction);
      expect(second.connectedEdges).toContain(
        direction === 'e' ? 'w' : 'n',
      );
    }
  });

  it('profiles the complete accepted presentation set through unique resolutions', () => {
    expect(report).toMatchObject({
      stem: 'equal-height-47-socket-register-audit',
      version: 0,
      status: 'review-only-quantitative-discrepancy-report',
      acceptedLedgerStatus: 'owner-accepted-mapping-gate',
      coverage: {
        maskCount: 47,
        presentationCount: 50,
        underlyingSourcePairCount: 31,
        uniqueSourceResolutionCount: 50,
        profiledPresentationCount: 50,
        comparedPresentationCount: 49,
        legalPairCount: 338,
        eastPairCount: 169,
        southPairCount: 169,
        presentationComparisonCount: 394,
      },
    });
    expect(report.presentations).toHaveLength(50);
    expect(new Set(report.presentations.map(({ id }) => id))).toHaveLength(50);
    expect(
      new Set(
        report.presentations.map(
          ({ sourceResolutionKey }) => sourceResolutionKey,
        ),
      ),
    ).toHaveLength(50);
    expect(report.coverage.pairCoverageHash).toBe(
      '8eac228d848399ad26c8152de03eb5e53efcaedc3d6030c5929d92371ac26c97',
    );
    expect(report.coverage.sourceResolutionHash).toBe(
      '5992c677479caf59c878fb14598f0a6f18163ef93ecf6d3722728ded3bf4d957',
    );
  });

  it('keeps raster work inside its sequential two-pixel-profile budget', () => {
    expect(report.containment).toEqual({
      renderPassCount: 200,
      renderedPixelCount: 2_537_600,
      renderPixelBudget: EQUAL_HEIGHT_SOCKET_REGISTER_RENDER_PIXEL_BUDGET,
      retainedProfilePixelCount: 169_600,
      retainedProfilePixelBudget:
        EQUAL_HEIGHT_SOCKET_REGISTER_RETAINED_PIXEL_BUDGET,
      maximumTransientRasterPixelCount: 16_384,
      maximumTransientRasterPixelBudget:
        EQUAL_HEIGHT_SOCKET_REGISTER_TRANSIENT_PIXEL_BUDGET,
      profileStripWidth: EQUAL_HEIGHT_SOCKET_REGISTER_PROFILE_STRIP_WIDTH,
    });
    expect(report.containment.renderedPixelCount).toBeLessThanOrEqual(
      report.containment.renderPixelBudget,
    );
    expect(report.containment.retainedProfilePixelCount).toBeLessThanOrEqual(
      report.containment.retainedProfilePixelBudget,
    );
    expect(report.containment.maximumTransientRasterPixelCount).toBeLessThanOrEqual(
      report.containment.maximumTransientRasterPixelBudget,
    );
  });

  it('emits a deterministic review-only discrepancy report with triage focuses', () => {
    expect(report.summary).toMatchObject({
      exactCandidatePresentationComparisonCount: 59,
      exactSelectedLegalPairCount: 59,
      discrepancyCount: 279,
      discrepantLegalPairCount: 279,
      categoryCounts: {
        'contact-shadow-register-focus': 52,
        'horizontal-reveal-opacity-focus': 59,
        'open-horizontal-return-plinth-focus': 36,
        'layer-order-brightness-focus': 8,
      },
    });
    expect(report.coverage.discrepancyReportHash).toBe(
      '212ed1cf1a7ecff8e135c370c17010fc9dd350d51b17f55f4f64c43baa4b63ed',
    );
    const json = equalHeightSocketRegisterAuditJson(report);
    const text = equalHeightSocketRegisterAuditText(report);
    expect(equalHeightSocketRegisterAuditJson(JSON.parse(json))).toBe(json);
    expect(text).toContain(
      'REVIEW ONLY - exact pixel discrepancies are observations, not failures',
    );
    expect(text).toContain('Legal cardinal pairs: 338 (169 east, 169 south)');
    expect(report.boundaries).toEqual({
      ledgerMutation: false,
      proofSourceMutation: false,
      productionArtMutation: false,
      productionRegistration: false,
      exporterMutation: false,
      atlasMutation: false,
      schemaMutation: false,
      blobMutation: false,
      unityMutation: false,
    });
  });
});
