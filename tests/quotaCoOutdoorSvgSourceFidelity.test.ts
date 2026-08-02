import { describe, expect, it } from 'vitest';

import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import { PROP_TEMPLATES } from '../src/props/templates';
import {
  OUTDOOR_SVG_SOURCE_DEFINITIONS,
  loadAndValidateOutdoorSvgSources,
} from '../scripts/quotaCoOutdoorSvgSourceFidelityPreview';

describe('QuotaCo exterior genuine SVG source gate', () => {
  it('authors eight live-carrier and four source-only concept files', async () => {
    const loaded = await loadAndValidateOutdoorSvgSources();
    expect(loaded).toHaveLength(12);
    expect(
      loaded.filter(({ kind }) => kind === 'live-carrier'),
    ).toHaveLength(8);
    expect(
      loaded.filter(({ kind }) => kind === 'system-candidate'),
    ).toHaveLength(4);
  });

  it('matches every accepted reference raster exactly', async () => {
    const loaded = await loadAndValidateOutdoorSvgSources();
    for (const source of loaded) {
      expect(source.normalizedPixelDelta, source.id).toBe(0);
      if (source.kind === 'live-carrier') {
        expect(source.normalizedImportedPixelDelta, source.id).toBeLessThan(
          0.002,
        );
        expect(source.importedSource, source.id).toContain(
          'viewBox="0 0 128 128"',
        );
      } else {
        expect(source.normalizedImportedPixelDelta, source.id).toBeUndefined();
        expect(source.importedSource, source.id).toBeUndefined();
      }
      expect(source.sha256, source.id).toMatch(/^[a-f0-9]{64}$/);
      expect(source.semanticGroupCount, source.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('keeps only existing carriers eligible for production wiring', () => {
    for (const source of OUTDOOR_SVG_SOURCE_DEFINITIONS) {
      const registered = PROP_TEMPLATES.some(
        (template) => template.id === source.id,
      );
      expect(registered, source.id).toBe(source.kind === 'live-carrier');
    }
  });

  it('keeps projection metadata aligned with live and proposed contracts', () => {
    for (const source of OUTDOOR_SVG_SOURCE_DEFINITIONS) {
      if (source.kind === 'live-carrier') {
        const template = PROP_TEMPLATES.find(
          (candidate) => candidate.id === source.id,
        );
        expect(template?.projection, source.id).toBe(source.projection);
      }
    }
  });

  it('holds the current export schema', () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(21);
  });
});
