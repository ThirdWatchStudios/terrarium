import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, 'assets/ui/department-era-design-v1/manifest.json');
const COMPONENT_SOURCE = path.join(
  ROOT,
  'assets/ui/department-era-component-library-v1/manifest.json',
);
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
  source: {
    manifestSha256: string;
    componentManifestSha256: string;
  };
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
  promotedActionMarks: string[];
  canonicalCursorSources: string[];
  deferred: string[];
}

interface ComponentManifest {
  status: string;
  families: Array<{ id: string; construction: string }>;
  canonicalMarks: string[];
  promotedActionMarks: string[];
  canonicalCursorSources: string[];
  literalScreens: Array<{ id: string; viewport: string; uiScale: number }>;
  stopBoundary: string[];
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
    const [manifestSource, componentManifestSource, metricsSource, packageSource] = await Promise.all([
      readFile(SOURCE, 'utf8'),
      readFile(COMPONENT_SOURCE, 'utf8'),
      readFile(path.join(OUTPUT, 'metrics.json'), 'utf8'),
      readFile(path.join(ROOT, 'package.json'), 'utf8'),
    ]);
    const metrics = JSON.parse(metricsSource) as Metrics;
    const packageJson = JSON.parse(packageSource) as { scripts: Record<string, string> };

    expect(metrics.status).toBe('terrarium-production-design-source-approved');
    expect(metrics.source.manifestSha256).toBe(sha256(manifestSource));
    expect(metrics.source.componentManifestSha256).toBe(sha256(componentManifestSource));
    expect(metrics.literalScreens).toEqual([
      { id: 'chain-browse', viewport: '1280x720', uiScale: 1, armed: false },
      { id: 'requirement-selected', viewport: '1280x720', uiScale: 1, armed: false },
      { id: 'placement-valid', viewport: '1280x720', uiScale: 1, armed: true },
      { id: 'route-invalid', viewport: '1280x720', uiScale: 1.4, armed: true },
      { id: 'all-items-browse', viewport: '1280x720', uiScale: 1, armed: false },
      { id: 'all-items-search-focused', viewport: '1280x720', uiScale: 1, armed: false },
      { id: 'people-handoff', viewport: '1280x720', uiScale: 1, armed: false },
      { id: 'designation-management-receipt', viewport: '1280x720', uiScale: 1.4, armed: false },
    ]);
    expect(packageJson.scripts['ui:department-design']).toBe(
      'tsx scripts/departmentEraUiProductionDesign.ts',
    );
    expect(packageJson.scripts['ui:department-design:check']).toContain('--check');
    expect(metrics.canonicalMarks).toHaveLength(34);
    expect(metrics.promotedActionMarks).toEqual([
      'action-rotate',
      'action-undo',
      'action-redo',
      'action-move',
      'action-delete',
      'world-facing',
    ]);
    expect(metrics.canonicalCursorSources).toEqual([
      'cursor-default',
      'cursor-grab',
      'cursor-place',
      'cursor-invalid',
    ]);

    for (const output of metrics.outputs) {
      const [svg, png] = await Promise.all([
        readFile(path.join(OUTPUT, output.svg)),
        readFile(path.join(OUTPUT, output.png)),
      ]);
      expect(sha256(svg), output.svg).toBe(output.svgSha256);
      expect(sha256(png), output.png).toBe(output.pngSha256);
    }
  });

  it('keeps component construction and the approved source boundary explicit', async () => {
    const component = JSON.parse(
      await readFile(COMPONENT_SOURCE, 'utf8'),
    ) as ComponentManifest;

    expect(component.status).toBe('terrarium-production-design-source-approved');
    expect(component.families.map(({ id }) => id)).toEqual([
      'F-03', 'F-04', 'F-05', 'F-06', 'F-09', 'F-10', 'F-11',
      'C-01', 'C-03', 'C-04', 'C-05', 'C-06', 'C-07', 'C-08',
      'C-09', 'C-10', 'C-11', 'C-12',
    ]);
    expect(component.families.filter(({ construction }) => construction.includes('Unity USS'))).toHaveLength(16);
    expect(component.canonicalMarks).toHaveLength(24);
    expect(component.promotedActionMarks).toHaveLength(6);
    expect(component.canonicalCursorSources).toHaveLength(4);
    expect(component.literalScreens.map(({ id }) => id)).toEqual([
      'all-items-browse',
      'all-items-search-focused',
      'people-handoff',
      'designation-management-receipt',
    ]);
    expect(component.stopBoundary).toContain('no browser export');
    expect(component.stopBoundary).toContain('no Unity import or implementation');
    expect(component.stopBoundary).toContain('no runtime cursor texture or import-setting changes');
  });

  it('does not activate reserved amber or rose in the literal gameplay screens', async () => {
    const literalScreens = await Promise.all([
      readFile(path.join(OUTPUT, '01-literal-department-screens.svg'), 'utf8'),
      readFile(path.join(OUTPUT, '03-purpose-catalog-handoff-screens.svg'), 'utf8'),
    ]).then((sources) => sources.join('\n'));

    expect(literalScreens).not.toContain('#D08010');
    expect(literalScreens).not.toContain('#A45A6C');
    expect(literalScreens).toContain('REPAIR: CHOOSE THE SHARED WALL BAY.');
    expect(literalScreens).toContain('WORLD IMAGE IS APPROVED COMPOSITION REFERENCE ONLY');
    expect(literalScreens).toContain('GLYPHS RESOLVE FROM CANONICAL TERRARIUM SOURCES');
    expect(literalScreens).toContain('UNITY UNTOUCHED');
    expect(literalScreens).toContain('SEARCH OWNS TYPING WHILE FOCUSED.');
    expect(literalScreens).toContain('FILTER APPLIED. NO PERSON MOVED.');
    expect(literalScreens).toContain('DESIGNATED ≠ READY');
    expect(literalScreens).toContain('ACTION MARKS AND CURSORS RESOLVE FROM CANONICAL TERRARIUM SOURCES');
  });
});
