import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, 'assets/ui/department-era-design-v1/manifest.json');
const OUTPUT = path.join(ROOT, 'docs/previews/department-era-ui-production-design-v1');

interface DesignManifest {
  status: string;
  ownership: {
    terrarium: string[];
    deferredUnityPass: string[];
  };
  palette: Record<string, string>;
  reservations: Record<string, string>;
  layout: {
    referenceViewport: { width: number; height: number };
    worldDominance: Record<string, number>;
  };
  departmentSlice: { requiredScreens: string[] };
  shapeLedger: {
    canonicalNow: string[];
    promotedDepartmentGlyphs: string[];
    reviewCandidatesOnly: string[];
    mustRemainLayoutOrRuntimeGeometry: string[];
  };
}

interface Metrics {
  status: string;
  source: { manifestSha256: string };
  outputs: Array<{
    svg: string;
    svgSha256: string;
    png: string;
    pngSha256: string;
  }>;
  literalScreens: Array<{
    id: string;
    viewport: string;
    uiScale: number;
    armed: boolean;
  }>;
  canonicalMarks: string[];
  reviewCandidateMarks: string[];
  deferred: string[];
}

function sha256(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}

describe('department-era UI production design source', () => {
  it('locks the Terrarium and deferred Unity ownership boundary', async () => {
    const design = JSON.parse(await readFile(SOURCE, 'utf8')) as DesignManifest;

    expect(design.status).toBe('terrarium-production-design-source-approved');
    expect(design.ownership.terrarium).toEqual(expect.arrayContaining([
      'visual design tokens',
      'literal screen compositions',
      'stateless canonical SVG shapes',
    ]));
    expect(design.ownership.deferredUnityPass).toEqual(expect.arrayContaining([
      'TextCore font assets',
      'UXML and USS implementation',
      'interaction and runtime state binding',
      'import and Play Mode validation',
    ]));
    expect(design.reservations.amber).toContain('dormant Capture only');
    expect(design.reservations.rose).toContain('emotion only');
    expect(design.palette.captureAmberReserved).toBe('#D08010');
    expect(design.palette.emotionRoseReserved).toBe('#A45A6C');
  });

  it('keeps the office dominant at literal 1280 by 720 in both scale studies', async () => {
    const design = JSON.parse(await readFile(SOURCE, 'utf8')) as DesignManifest;
    const { referenceViewport, worldDominance } = design.layout;

    expect(referenceViewport).toEqual({ width: 1280, height: 720 });
    expect(
      worldDominance.topStrip100Px
      + worldDominance.buildShelf100Px
      + worldDominance.minimumVisibleWorld100Px,
    ).toBe(referenceViewport.height);
    expect(worldDominance.minimumVisibleWorld100Px).toBeGreaterThan(
      worldDominance.topStrip100Px + worldDominance.buildShelf100Px,
    );
    expect(
      worldDominance.topStrip140Px
      + worldDominance.buildShelf140Px
      + worldDominance.minimumVisibleWorld140Px,
    ).toBe(referenceViewport.height);
    expect(worldDominance.minimumVisibleWorld140Px).toBeGreaterThan(
      worldDominance.topStrip140Px + worldDominance.buildShelf140Px,
    );
    expect(design.departmentSlice.requiredScreens).toEqual([
      'chain browse',
      'requirement selected without arming',
      'placement armed with valid preview',
      'tube route invalid with one repair reason',
      '140 percent reflow',
    ]);
  });

  it('separates the 24 approved SVG shapes from layout and runtime geometry', async () => {
    const design = JSON.parse(await readFile(SOURCE, 'utf8')) as DesignManifest;
    const {
      canonicalNow,
      promotedDepartmentGlyphs,
      reviewCandidatesOnly,
      mustRemainLayoutOrRuntimeGeometry,
    } = design.shapeLedger;

    expect(canonicalNow).toEqual([
      'ui-divider',
      'ui-corner',
      'ui-focus',
      'iris-mark',
      'quotaco-mark',
    ]);
    expect(promotedDepartmentGlyphs).toHaveLength(19);
    expect(new Set(promotedDepartmentGlyphs).size).toBe(promotedDepartmentGlyphs.length);
    expect(promotedDepartmentGlyphs.some((id) => canonicalNow.includes(id))).toBe(false);
    expect(reviewCandidatesOnly).toEqual([]);
    expect(mustRemainLayoutOrRuntimeGeometry).toEqual(expect.arrayContaining([
      'all panels and cards',
      'placement footprints and cell validity',
      'tube path segments and corners',
    ]));
  });

  it('keeps the rendered review sheets current and records all literal states', async () => {
    const [manifestSource, metricsSource, packageSource] = await Promise.all([
      readFile(SOURCE, 'utf8'),
      readFile(path.join(OUTPUT, 'metrics.json'), 'utf8'),
      readFile(path.join(ROOT, 'package.json'), 'utf8'),
    ]);
    const metrics = JSON.parse(metricsSource) as Metrics;
    const packageJson = JSON.parse(packageSource) as { scripts: Record<string, string> };

    expect(metrics.status).toBe('terrarium-production-design-source-approved');
    expect(metrics.source.manifestSha256).toBe(sha256(manifestSource));
    expect(metrics.literalScreens).toEqual([
      { id: 'chain-browse', viewport: '1280x720', uiScale: 1, armed: false },
      { id: 'requirement-selected', viewport: '1280x720', uiScale: 1, armed: false },
      { id: 'placement-valid', viewport: '1280x720', uiScale: 1, armed: true },
      { id: 'route-invalid', viewport: '1280x720', uiScale: 1.4, armed: true },
    ]);
    expect(packageJson.scripts['ui:department-design']).toBe(
      'tsx scripts/departmentEraUiProductionDesign.ts',
    );
    expect(packageJson.scripts['ui:department-design:check']).toContain('--check');
    expect(metrics.canonicalMarks).toHaveLength(24);
    expect(metrics.reviewCandidateMarks).toEqual([]);

    for (const output of metrics.outputs) {
      const [svg, png] = await Promise.all([
        readFile(path.join(OUTPUT, output.svg)),
        readFile(path.join(OUTPUT, output.png)),
      ]);
      expect(sha256(svg), output.svg).toBe(output.svgSha256);
      expect(sha256(png), output.png).toBe(output.pngSha256);
    }
  });

  it('does not activate reserved amber or rose in the literal gameplay screens', async () => {
    const literalScreens = await readFile(
      path.join(OUTPUT, '01-literal-department-screens.svg'),
      'utf8',
    );

    expect(literalScreens).not.toContain('#D08010');
    expect(literalScreens).not.toContain('#A45A6C');
    expect(literalScreens).toContain('REPAIR: CHOOSE THE SHARED WALL BAY.');
    expect(literalScreens).toContain('WORLD IMAGE IS APPROVED COMPOSITION REFERENCE ONLY');
    expect(literalScreens).toContain('GLYPHS RESOLVE FROM CANONICAL TERRARIUM SOURCES');
    expect(literalScreens).toContain('UNITY UNTOUCHED');
  });
});
