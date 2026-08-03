/**
 * Generate a durable visual reference for Terrarium's current canonical SVG
 * sources. Thumbnails embed the exact editable files selected by live
 * importers; generated scaffolds and inactive proof fragments are excluded.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import type { ShapeSpec } from '../src/core/types';
import { CANONICAL_UI_ICON_ART } from '../src/parts/generated/canonicalUiIconArt';
import { IMPORTED_PART_PROVENANCE } from '../src/parts/generated/importedPartArt';
import {
  DEPARTMENT_MACHINE_TEMPLATE_DEFINITIONS,
  DEPARTMENT_STAMP_DEFINITIONS,
} from '../src/props/departmentMachineManifest';
import { IRIS_HARDWARE_ART } from '../src/props/generated/irisHardwareArt';
import { QUOTA_CO_WORKHORSE_PROP_ART } from '../src/props/generated/quotaCoWorkhorseArt';
import { QUOTA_CO_MAINTAINED_HYBRID_SURFACE_ART } from '../src/tiles/generated/quotaCoMaintainedHybridSurfaceArt';
import {
  compileEqualHeightEvaluationFrames,
  type CompiledEqualHeightFrame,
} from './walls/equalHeightImporter';

const GUIDE_SLUG = 'canonical-svg-library-v1';
const PAGE = '#E7E1D2';
const PANEL = '#F6F1E6';
const PANEL_ALT = '#ECE5D7';
const INK = '#292C2A';
const MUTED = '#626861';
const RULE = '#A39B8B';
const GREEN = '#355647';
const CORAL = '#B65F4D';
const BLUE = '#294565';
const AMBER = '#A97830';

export type CanonicalSvgStatus =
  | 'production'
  | 'production-dependency'
  | 'deferred';

export type CanonicalSvgCategory =
  | 'characters/body'
  | 'characters/head'
  | 'characters/hair'
  | 'characters/outfit'
  | 'characters/accessory'
  | 'props/workhorse'
  | 'props/outdoor'
  | 'props/iris-hardware'
  | 'props/department-machines'
  | 'props/deferred-gameplay'
  | 'surfaces/floors'
  | 'surfaces/grass'
  | 'ui/shared-primitives'
  | 'ui/department-glyphs'
  | 'walls/equal-height-direct'
  | 'walls/equal-height-promoted-proof'
  | 'walls/bevel';

export interface CanonicalSvgManifestEntry {
  readonly assetId: string;
  readonly category: CanonicalSvgCategory;
  readonly status: CanonicalSvgStatus;
  readonly sourceFile: string;
  readonly sha256: string;
}

export interface CanonicalSvgExclusion {
  readonly pattern: string;
  readonly count: number;
  readonly reason: string;
  readonly sourceFiles: readonly string[];
}

export interface CanonicalSvgReferenceManifest {
  readonly schemaVersion: 1;
  readonly guide: string;
  readonly counts: {
    readonly exactSourceFiles: number;
    readonly production: number;
    readonly productionDependencies: number;
    readonly deferred: number;
    readonly derivedWallFrames: number;
    readonly byCategory: Readonly<Record<string, number>>;
  };
  readonly entries: readonly CanonicalSvgManifestEntry[];
  readonly derivedWallFrames: readonly {
    readonly id: string;
    readonly index: number;
    readonly canonicalMask: number;
    readonly sourceStem: string;
    readonly sourceFiles: readonly string[];
  }[];
  readonly exclusions: readonly CanonicalSvgExclusion[];
  readonly deferredWork: readonly string[];
}

interface SourceEntry extends CanonicalSvgManifestEntry {
  readonly source: string;
  readonly viewBox: string;
  readonly innerSvg: string;
}

export interface CanonicalSvgReferenceInventory {
  readonly root: string;
  readonly entries: readonly SourceEntry[];
  readonly wallFrames: readonly CompiledEqualHeightFrame[];
  readonly manifest: CanonicalSvgReferenceManifest;
}

interface SheetGroup {
  readonly id: string;
  readonly label: string;
  readonly note: string;
  readonly entries: readonly SourceEntry[];
}

interface SheetOptions {
  readonly title: string;
  readonly subtitle: string;
  readonly groups: readonly SheetGroup[];
  readonly columns: number;
  readonly cellHeight: number;
  readonly compact?: boolean;
  readonly wallFrames?: readonly CompiledEqualHeightFrame[];
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function attr(value: string): string {
  return esc(value).replace(/'/g, '&apos;');
}

function shortened(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

function withoutExtension(filename: string): string {
  return filename.replace(/\.svg$/i, '');
}

function labelText(
  x: number,
  y: number,
  value: string,
  size: number,
  weight = 600,
  fill = INK,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return (
    `<text x="${x}" y="${y}" fill="${fill}" ` +
    `font-family="Inter,Arial,sans-serif" font-size="${size}" ` +
    `font-weight="${weight}" text-anchor="${anchor}">${esc(value)}</text>`
  );
}

function statusColor(status: CanonicalSvgStatus): string {
  if (status === 'deferred') return CORAL;
  if (status === 'production-dependency') return BLUE;
  return GREEN;
}

function parseSource(
  source: string,
  sourceFile: string,
): { readonly viewBox: string; readonly innerSvg: string } {
  const open = source.match(/<svg\b([^>]*)>/i);
  if (!open || open.index === undefined) {
    throw new Error(`${sourceFile} has no SVG root`);
  }
  const viewBox = open[1].match(/\bviewBox=(["'])(.*?)\1/i)?.[2];
  if (!viewBox) throw new Error(`${sourceFile} has no viewBox`);
  const close = source.lastIndexOf('</svg>');
  if (close < 0) throw new Error(`${sourceFile} has no closing SVG tag`);
  return {
    viewBox,
    innerSvg: source.slice(open.index + open[0].length, close),
  };
}

async function svgFilesUnder(directory: string): Promise<string[]> {
  const result: string[] = [];
  const visit = async (current: string): Promise<void> => {
    const entries = (await readdir(current, { withFileTypes: true }))
      .sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else if (entry.isFile() && entry.name.endsWith('.svg')) {
        result.push(absolute);
      }
    }
  };
  await visit(directory);
  return result;
}

function relativeFiles(root: string, files: readonly string[]): string[] {
  return files
    .map((file) => path.relative(root, file).replaceAll('\\', '/'))
    .sort(compareText);
}

function assertExactCoverage(
  label: string,
  expected: readonly string[],
  actual: readonly string[],
): void {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  const missing = expected.filter((file) => !actualSet.has(file));
  const extra = actual.filter((file) => !expectedSet.has(file));
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      `${label} canonical coverage mismatch` +
      `${missing.length ? `; missing ${missing.join(', ')}` : ''}` +
      `${extra.length ? `; unexpected ${extra.join(', ')}` : ''}`,
    );
  }
}

async function sourceEntry(
  root: string,
  sourceFile: string,
  assetId: string,
  category: CanonicalSvgCategory,
  status: CanonicalSvgStatus,
): Promise<SourceEntry> {
  const source = await readFile(path.join(root, sourceFile), 'utf8');
  return {
    assetId,
    category,
    status,
    sourceFile,
    sha256: createHash('sha256').update(source).digest('hex'),
    source,
    ...parseSource(source, sourceFile),
  };
}

function partCategory(sourceFile: string): CanonicalSvgCategory {
  const slot = sourceFile.split('/')[2];
  if (
    slot !== 'body' &&
    slot !== 'head' &&
    slot !== 'hair' &&
    slot !== 'outfit' &&
    slot !== 'accessory'
  ) {
    throw new Error(`Unknown canonical character slot for ${sourceFile}`);
  }
  return `characters/${slot}`;
}

function propCategory(assetId: string): CanonicalSvgCategory {
  const outdoor = new Set([
    'car',
    'lot-marking-crosswalk',
    'lamp-post',
    'sign-lot',
    'bike-rack',
    'park-bench',
    'picnic-table',
    'tree-canopy',
  ]);
  return outdoor.has(assetId) ? 'props/outdoor' : 'props/workhorse';
}

function countBy(values: readonly string[]): Readonly<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return Object.fromEntries(
    Object.entries(counts).sort(([left], [right]) => compareText(left, right)),
  );
}

export async function collectCanonicalSvgReferenceInventory(
  root = process.cwd(),
): Promise<CanonicalSvgReferenceInventory> {
  const entries: SourceEntry[] = [];

  const partSourceFiles = IMPORTED_PART_PROVENANCE
    .flatMap((item) => item.sourceFiles)
    .sort(compareText);
  const actualPartFiles = relativeFiles(
    root,
    await svgFilesUnder(path.join(root, 'assets', 'parts')),
  );
  assertExactCoverage('Character part', actualPartFiles, partSourceFiles);
  for (const item of IMPORTED_PART_PROVENANCE) {
    for (const sourceFile of item.sourceFiles) {
      entries.push(
        await sourceEntry(
          root,
          sourceFile,
          item.id,
          partCategory(sourceFile),
          'production',
        ),
      );
    }
  }

  const propSourceFiles = QUOTA_CO_WORKHORSE_PROP_ART
    .map((prop) => prop.sourceFile)
    .sort(compareText);
  const actualPropFiles = relativeFiles(
    root,
    await svgFilesUnder(
      path.join(root, 'assets', 'props', 'quota-co-workhorse-v1'),
    ),
  );
  assertExactCoverage('Workhorse prop', actualPropFiles, propSourceFiles);
  for (const prop of QUOTA_CO_WORKHORSE_PROP_ART) {
    entries.push(
      await sourceEntry(
        root,
        prop.sourceFile,
        prop.id,
        propCategory(prop.id),
        'production',
      ),
    );
  }

  const irisHardwareSourceFiles = IRIS_HARDWARE_ART
    .map((prop) => prop.sourceFile)
    .sort(compareText);
  const actualIrisHardwareFiles = relativeFiles(
    root,
    await svgFilesUnder(
      path.join(root, 'assets', 'props', 'iris-hardware-v1'),
    ),
  );
  assertExactCoverage(
    'IRIS hardware',
    actualIrisHardwareFiles,
    irisHardwareSourceFiles,
  );
  for (const prop of IRIS_HARDWARE_ART) {
    entries.push(
      await sourceEntry(
        root,
        prop.sourceFile,
        prop.id,
        'props/iris-hardware',
        'production',
      ),
    );
  }

  const uiSharedSourceFiles = CANONICAL_UI_ICON_ART
    .filter((icon) => icon.sourceFile.startsWith('assets/ui/canonical-shared-primitives-v1/'))
    .map((icon) => icon.sourceFile)
    .sort(compareText);
  const actualUiSharedFiles = relativeFiles(
    root,
    await svgFilesUnder(
      path.join(root, 'assets', 'ui', 'canonical-shared-primitives-v1'),
    ),
  );
  assertExactCoverage('UI shared primitive', actualUiSharedFiles, uiSharedSourceFiles);

  const uiDepartmentSourceFiles = CANONICAL_UI_ICON_ART
    .filter((icon) => icon.sourceFile.startsWith('assets/ui/canonical-department-glyphs-v1/'))
    .map((icon) => icon.sourceFile)
    .sort(compareText);
  const actualUiDepartmentFiles = relativeFiles(
    root,
    await svgFilesUnder(
      path.join(root, 'assets', 'ui', 'canonical-department-glyphs-v1'),
    ),
  );
  assertExactCoverage('UI department glyph', actualUiDepartmentFiles, uiDepartmentSourceFiles);

  for (const icon of CANONICAL_UI_ICON_ART) {
    const category: CanonicalSvgCategory = icon.sourceFile.startsWith(
      'assets/ui/canonical-shared-primitives-v1/',
    )
      ? 'ui/shared-primitives'
      : 'ui/department-glyphs';
    entries.push(
      await sourceEntry(
        root,
        icon.sourceFile,
        icon.id,
        category,
        'production',
      ),
    );
  }

  const departmentMachineSources: Array<{
    readonly assetId: string;
    readonly sourceFile: string;
  }> = [
    ...DEPARTMENT_MACHINE_TEMPLATE_DEFINITIONS
      .flatMap((template) => template.variants.map((variant) => ({
      assetId: template.id,
      sourceFile: path.posix.join(
        'assets/props/quota-co-department-machines-v1',
        variant.sourceFile,
      ),
      }))),
    ...DEPARTMENT_STAMP_DEFINITIONS.map((overlay) => ({
      assetId: `canister-stamp-${overlay.id}`,
      sourceFile: path.posix.join(
        'assets/props/quota-co-department-machines-v1',
        overlay.sourceFile,
      ),
    })),
  ];
  departmentMachineSources.sort(
    (left, right) => compareText(left.sourceFile, right.sourceFile),
  );
  const departmentMachineSourceFiles = departmentMachineSources
    .map(({ sourceFile }) => sourceFile);
  const actualDepartmentMachineFiles = relativeFiles(
    root,
    await svgFilesUnder(
      path.join(root, 'assets', 'props', 'quota-co-department-machines-v1'),
    ),
  );
  assertExactCoverage(
    'Department machine',
    actualDepartmentMachineFiles,
    departmentMachineSourceFiles,
  );
  for (const source of departmentMachineSources) {
    entries.push(
      await sourceEntry(
        root,
        source.sourceFile,
        source.assetId,
        'props/department-machines',
        'production',
      ),
    );
  }

  const deferredPropFiles = relativeFiles(
    root,
    await svgFilesUnder(
      path.join(root, 'assets', 'props', 'quota-co-gameplay-candidates-v1'),
    ),
  );
  for (const sourceFile of deferredPropFiles) {
    entries.push(
      await sourceEntry(
        root,
        sourceFile,
        withoutExtension(path.basename(sourceFile)),
        'props/deferred-gameplay',
        'deferred',
      ),
    );
  }

  const surfaceSourceFiles = QUOTA_CO_MAINTAINED_HYBRID_SURFACE_ART
    .map((surface) => surface.sourceFile)
    .sort(compareText);
  const actualSurfaceFiles = relativeFiles(
    root,
    await svgFilesUnder(
      path.join(root, 'assets', 'tiles', 'quota-co-maintained-hybrid-v1'),
    ),
  );
  assertExactCoverage(
    'Maintained Hybrid surface',
    actualSurfaceFiles,
    surfaceSourceFiles,
  );
  for (const surface of QUOTA_CO_MAINTAINED_HYBRID_SURFACE_ART) {
    entries.push(
      await sourceEntry(
        root,
        surface.sourceFile,
        surface.id,
        surface.kind === 'ground' ? 'surfaces/grass' : 'surfaces/floors',
        'production',
      ),
    );
  }

  const equalHeightRoots = [
    {
      inputDir: path.join(
        root,
        'assets',
        'walls',
        'quota-co-building-system',
      ),
      sourcePathPrefix: 'assets/walls/quota-co-building-system',
    },
    {
      inputDir: path.join(
        root,
        'assets',
        'walls',
        'quota-co-building-system-proofs',
      ),
      sourcePathPrefix: 'assets/walls/quota-co-building-system-proofs',
    },
  ] as const;
  const wallFrames = await compileEqualHeightEvaluationFrames({
    sourceRoots: equalHeightRoots,
  });
  const activeWallFiles = [...new Set(
    wallFrames.flatMap((frame) => [
      frame.sourceFiles.base,
      frame.sourceFiles.upper,
    ]),
  )].sort(compareText);
  for (const sourceFile of activeWallFiles) {
    const promotedProof = sourceFile.includes(
      '/quota-co-building-system-proofs/',
    );
    entries.push(
      await sourceEntry(
        root,
        sourceFile,
        withoutExtension(path.basename(sourceFile))
          .replace(/-(base|upper)$/, ''),
        promotedProof
          ? 'walls/equal-height-promoted-proof'
          : 'walls/equal-height-direct',
        'production-dependency',
      ),
    );
  }

  const bevelFiles = relativeFiles(
    root,
    await svgFilesUnder(path.join(root, 'assets', 'walls', 'bevel')),
  );
  for (const sourceFile of bevelFiles) {
    entries.push(
      await sourceEntry(
        root,
        sourceFile,
        withoutExtension(path.basename(sourceFile)),
        'walls/bevel',
        'production-dependency',
      ),
    );
  }

  entries.sort((left, right) =>
    compareText(left.category, right.category) ||
    compareText(left.sourceFile, right.sourceFile)
  );
  const sourceFiles = entries.map((entry) => entry.sourceFile);
  if (new Set(sourceFiles).size !== sourceFiles.length) {
    throw new Error('Canonical SVG reference contains duplicate source paths');
  }

  const scaffoldFiles = relativeFiles(
    root,
    await svgFilesUnder(
      path.join(root, 'assets', 'part-authoring', 'scaffolds'),
    ),
  );
  const sentinelFiles = relativeFiles(
    root,
    await svgFilesUnder(
      path.join(root, 'assets', 'part-authoring', 'palettes'),
    ),
  );
  const allEqualHeightFiles = relativeFiles(
    root,
    (
      await Promise.all(
        equalHeightRoots.map((sourceRoot) =>
          svgFilesUnder(sourceRoot.inputDir)
        ),
      )
    ).flat(),
  );
  const activeWallSet = new Set(activeWallFiles);
  const inactiveWallFiles = allEqualHeightFiles.filter(
    (sourceFile) => !activeWallSet.has(sourceFile),
  );

  const production = entries.filter(
    (entry) => entry.status === 'production',
  ).length;
  const productionDependencies = entries.filter(
    (entry) => entry.status === 'production-dependency',
  ).length;
  const deferred = entries.filter(
    (entry) => entry.status === 'deferred',
  ).length;
  const manifestEntries: CanonicalSvgManifestEntry[] = entries.map(
    ({ source: _source, viewBox: _viewBox, innerSvg: _innerSvg, ...entry }) =>
      entry,
  );
  const exclusions: CanonicalSvgExclusion[] = [
    {
      pattern: 'assets/part-authoring/scaffolds/**/*.svg',
      count: scaffoldFiles.length,
      reason:
        'Generated artist scaffolds mirror production geometry but are not canonical source truth.',
      sourceFiles: scaffoldFiles,
    },
    {
      pattern:
        'assets/walls/quota-co-building-system{,-proofs}/**/*.svg (inactive)',
      count: inactiveWallFiles.length,
      reason:
        'Retained technical and proof files not referenced by the live canonical 47-frame mapping.',
      sourceFiles: inactiveWallFiles,
    },
    {
      pattern: 'assets/part-authoring/palettes/*.svg',
      count: sentinelFiles.length,
      reason:
        'Importer palette sentinels are authoring infrastructure, not game assets.',
      sourceFiles: sentinelFiles,
    },
  ];
  const manifest: CanonicalSvgReferenceManifest = {
    schemaVersion: 1,
    guide: 'Terrarium canonical SVG library',
    counts: {
      exactSourceFiles: entries.length,
      production,
      productionDependencies,
      deferred,
      derivedWallFrames: wallFrames.length,
      byCategory: countBy(entries.map((entry) => entry.category)),
    },
    entries: manifestEntries,
    derivedWallFrames: wallFrames.map((frame) => ({
      id: frame.id,
      index: frame.index,
      canonicalMask: frame.canonicalMask,
      sourceStem: frame.source.sourceStem,
      sourceFiles: [frame.sourceFiles.base, frame.sourceFiles.upper],
    })),
    exclusions,
    deferredWork: [
      'The 47-frame grass-fringe remains code-owned and is explicitly deferred.',
      'No grass-fringe SVG extraction, redesign proof, production promotion, export change, or Unity integration is active.',
      'Reopen grass-fringe only as a separately approved visual slice.',
    ],
  };
  return { root, entries, wallFrames, manifest };
}

function sourceCanvasFill(entry: SourceEntry): string {
  return entry.category === 'walls/bevel' ? '#294B3C' : '#E1DDD2';
}

function sourceThumbnail(
  entry: SourceEntry,
  x: number,
  y: number,
  width: number,
  height: number,
  compact: boolean,
): string {
  const color = statusColor(entry.status);
  const padding = compact ? 7 : 10;
  const labelHeight = compact ? 38 : 50;
  const artSize = Math.min(
    width - padding * 2,
    height - labelHeight - padding * 2,
  );
  const artX = x + (width - artSize) / 2;
  const artY = y + padding + 5;
  const basename = withoutExtension(path.basename(entry.sourceFile));
  const parent = path.basename(path.dirname(entry.sourceFile));
  return [
    `<a href="../../../${attr(entry.sourceFile)}">`,
    `<title>${esc(entry.sourceFile)}</title>`,
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="10" ` +
      `fill="${entry.status === 'deferred' ? '#F2DED8' : PANEL}" ` +
      `stroke="${color}" stroke-width="${entry.status === 'deferred' ? 2 : 1}"/>`,
    `<rect x="${x}" y="${y}" width="6" height="${height}" rx="3" fill="${color}"/>`,
    `<rect x="${artX}" y="${artY}" width="${artSize}" height="${artSize}" rx="6" ` +
      `fill="${sourceCanvasFill(entry)}"/>`,
    `<svg x="${artX}" y="${artY}" width="${artSize}" height="${artSize}" ` +
      `viewBox="${attr(entry.viewBox)}" preserveAspectRatio="xMidYMid meet" ` +
      `overflow="hidden">${entry.innerSvg}</svg>`,
    labelText(
      x + width / 2,
      y + height - (compact ? 20 : 26),
      shortened(basename, compact ? 20 : 30),
      compact ? 7.4 : 8.7,
      700,
      INK,
      'middle',
    ),
    compact
      ? ''
      : labelText(
          x + width / 2,
          y + height - 11,
          shortened(parent, 31),
          7,
          560,
          entry.status === 'deferred' ? CORAL : MUTED,
          'middle',
        ),
    '</a>',
  ].join('');
}

function shapeMarkup(shape: ShapeSpec): string {
  const properties = [
    `d="${attr(shape.d)}"`,
    `fill="${attr(shape.fill ?? 'none')}"`,
  ];
  if (shape.stroke !== undefined) {
    properties.push(`stroke="${attr(shape.stroke)}"`);
    properties.push('stroke-linecap="round"', 'stroke-linejoin="round"');
  }
  if (shape.strokeWidth !== undefined) {
    properties.push(`stroke-width="${shape.strokeWidth}"`);
  }
  if (shape.opacity !== undefined) {
    properties.push(`opacity="${shape.opacity}"`);
  }
  return `<path ${properties.join(' ')}/>`;
}

function frameThumbnail(
  frame: CompiledEqualHeightFrame,
  x: number,
  y: number,
  width: number,
  height: number,
): string {
  const artSize = Math.min(width - 20, height - 52);
  const artX = x + (width - artSize) / 2;
  const artY = y + 9;
  return [
    `<title>${esc(
      `${frame.id}: ${frame.sourceFiles.base} + ${frame.sourceFiles.upper}`,
    )}</title>`,
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="10" ` +
      `fill="${PANEL}" stroke="${AMBER}" stroke-width="1"/>`,
    `<rect x="${artX}" y="${artY}" width="${artSize}" height="${artSize}" rx="6" fill="#DAD5C8"/>`,
    `<svg x="${artX}" y="${artY}" width="${artSize}" height="${artSize}" ` +
      `viewBox="0 0 128 128" overflow="hidden">`,
    frame.shapes.map(shapeMarkup).join(''),
    '</svg>',
    labelText(
      x + width / 2,
      y + height - 23,
      `MASK ${frame.index}`,
      8.5,
      760,
      INK,
      'middle',
    ),
    labelText(
      x + width / 2,
      y + height - 10,
      shortened(frame.source.sourceStem, 25),
      6.8,
      560,
      MUTED,
      'middle',
    ),
  ].join('');
}

function sheetHeader(
  title: string,
  subtitle: string,
  width: number,
): string {
  return [
    `<rect width="${width}" height="100%" fill="${PAGE}"/>`,
    labelText(42, 46, title, 26, 860, INK),
    labelText(42, 74, subtitle, 12, 590, MUTED),
    labelText(
      width - 42,
      42,
      'EXACT EDITABLE SVG SOURCES',
      10,
      820,
      GREEN,
      'end',
    ),
    labelText(
      width - 42,
      66,
      'click any cell in the SVG sheet to open its source',
      9,
      600,
      MUTED,
      'end',
    ),
    `<path d="M42 94H${width - 42}" stroke="${RULE}" stroke-width="1"/>`,
  ].join('');
}

function legend(width: number, y: number): string {
  const items: readonly [string, string][] = [
    [GREEN, 'production source'],
    [BLUE, 'live production dependency'],
    [CORAL, 'accepted source, work deferred'],
    [AMBER, 'derived composed frame'],
  ];
  const itemWidth = 360;
  const start = width - 42 - itemWidth * items.length;
  return items.map(([color, value], index) => {
    const x = start + index * itemWidth;
    return (
      `<rect x="${x}" y="${y - 10}" width="12" height="12" rx="2" fill="${color}"/>` +
      labelText(x + 20, y, value, 8.5, 630, MUTED)
    );
  }).join('');
}

function renderSourceSheet(options: SheetOptions): string {
  const width = 3200;
  const margin = 42;
  const gap = options.compact ? 8 : 12;
  const cellWidth =
    (width - margin * 2 - gap * (options.columns - 1)) / options.columns;
  let y = 116;
  const body: string[] = [legend(width, y + 6)];
  y += 32;

  if (options.wallFrames) {
    const headerHeight = 52;
    const cellHeight = 176;
    const rows = Math.ceil(options.wallFrames.length / options.columns);
    const height = headerHeight + rows * (cellHeight + gap) + 12;
    body.push(
      `<rect x="${margin}" y="${y}" width="${width - margin * 2}" ` +
        `height="${height}" rx="14" fill="${PANEL_ALT}" ` +
        `stroke="${RULE}" stroke-width="1"/>`,
      labelText(
        margin + 16,
        y + 23,
        'COMPOSED 47-FRAME WALL ATLAS',
        12,
        800,
        BLUE,
      ),
      labelText(
        width - margin - 16,
        y + 23,
        'derived from the exact active source fragments below',
        9,
        620,
        MUTED,
        'end',
      ),
    );
    options.wallFrames.forEach((frame, index) => {
      const column = index % options.columns;
      const row = Math.floor(index / options.columns);
      body.push(
        frameThumbnail(
          frame,
          margin + column * (cellWidth + gap),
          y + headerHeight + row * (cellHeight + gap),
          cellWidth,
          cellHeight,
        ),
      );
    });
    y += height + 16;
  }

  for (const group of options.groups) {
    if (group.entries.length === 0) continue;
    const headerHeight = 50;
    const rows = Math.ceil(group.entries.length / options.columns);
    const height = headerHeight + rows * (options.cellHeight + gap) + 12;
    body.push(
      `<rect x="${margin}" y="${y}" width="${width - margin * 2}" ` +
        `height="${height}" rx="14" fill="${PANEL_ALT}" ` +
        `stroke="${RULE}" stroke-width="1"/>`,
      labelText(
        margin + 16,
        y + 21,
        group.label.toUpperCase(),
        12,
        800,
        GREEN,
      ),
      labelText(margin + 16, y + 40, group.note, 8.5, 560, MUTED),
      labelText(
        width - margin - 16,
        y + 24,
        `${group.entries.length} exact SVG file${group.entries.length === 1 ? '' : 's'}`,
        9,
        720,
        group.entries.some((entry) => entry.status === 'deferred')
          ? CORAL
          : BLUE,
        'end',
      ),
    );
    group.entries.forEach((entry, index) => {
      const column = index % options.columns;
      const row = Math.floor(index / options.columns);
      body.push(
        sourceThumbnail(
          entry,
          margin + column * (cellWidth + gap),
          y + headerHeight + row * (options.cellHeight + gap),
          cellWidth,
          options.cellHeight,
          options.compact ?? false,
        ),
      );
    });
    y += height + 16;
  }

  const footerY = y + 8;
  const height = footerY + 42;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" ` +
    `height="${height}" viewBox="0 0 ${width} ${height}">` +
    sheetHeader(options.title, options.subtitle, width) +
    body.join('') +
    labelText(
      margin,
      footerY + 20,
      'Terrarium canonical SVG reference · generated from live importer registries',
      8.5,
      620,
      MUTED,
    ) +
    labelText(
      width - margin,
      footerY + 20,
      'reference only · no production mutation',
      8.5,
      700,
      CORAL,
      'end',
    ) +
    '</svg>'
  );
}

function entriesFor(
  inventory: CanonicalSvgReferenceInventory,
  categories: readonly CanonicalSvgCategory[],
): SourceEntry[] {
  const categorySet = new Set(categories);
  return inventory.entries.filter((entry) => categorySet.has(entry.category));
}

function overviewGroups(
  inventory: CanonicalSvgReferenceInventory,
): SheetGroup[] {
  return [
    {
      id: 'characters',
      label: 'Character source library',
      note: 'Bodies, heads, hair, garments, and accessories — every authored facing/component file.',
      entries: entriesFor(inventory, [
        'characters/body',
        'characters/head',
        'characters/hair',
        'characters/outfit',
        'characters/accessory',
      ]),
    },
    {
      id: 'props',
      label: 'Workhorse, IRIS, outdoor, and department-machine props',
      note: 'Live canonical prop SVGs, including IRIS hardware, machine states, and canister overlays.',
      entries: entriesFor(inventory, [
        'props/workhorse',
        'props/outdoor',
        'props/iris-hardware',
        'props/department-machines',
      ]),
    },
    {
      id: 'surfaces',
      label: 'Maintained Hybrid surfaces',
      note: 'Twelve interior floors and three grass grounds.',
      entries: entriesFor(inventory, [
        'surfaces/floors',
        'surfaces/grass',
      ]),
    },
    {
      id: 'ui',
      label: 'Shared and department UI glyphs',
      note: 'Approved UI-E1 shared marks plus department-era work, readiness, state, and route glyphs.',
      entries: entriesFor(inventory, [
        'ui/shared-primitives',
        'ui/department-glyphs',
      ]),
    },
    {
      id: 'walls',
      label: 'Active wall source dependencies',
      note: 'Only exact SVGs referenced by the live 47-frame mapping, plus the bevel kit.',
      entries: entriesFor(inventory, [
        'walls/equal-height-direct',
        'walls/equal-height-promoted-proof',
        'walls/bevel',
      ]),
    },
    {
      id: 'deferred',
      label: 'Accepted gameplay concepts — deferred',
      note: 'Visible for library judgment; not registered, exported, or queued for production.',
      entries: entriesFor(inventory, ['props/deferred-gameplay']),
    },
  ];
}

function overviewSheet(inventory: CanonicalSvgReferenceInventory): string {
  const counts = inventory.manifest.counts;
  return renderSourceSheet({
    title: 'Terrarium canonical SVG library · complete one-sheet',
    subtitle:
      `${counts.exactSourceFiles} exact source files · ` +
      `${counts.production} production · ` +
      `${counts.productionDependencies} dependencies · ` +
      `${counts.deferred} deferred`,
    groups: overviewGroups(inventory),
    columns: 16,
    cellHeight: 138,
    compact: true,
  });
}

function characterSheet(inventory: CanonicalSvgReferenceInventory): string {
  const definitions: readonly [
    CanonicalSvgCategory,
    string,
    string,
  ][] = [
    [
      'characters/body',
      'Bodies',
      'Six production silhouettes · south/east/north source files.',
    ],
    [
      'characters/head',
      'Heads',
      'Six human head families plus the dedicated FAB machine head.',
    ],
    [
      'characters/hair',
      'Hair',
      'Ten approved silhouette families · south/east/north.',
    ],
    [
      'characters/outfit',
      'Garment components',
      'Exact detail sources; conforming torso geometry remains rig-owned.',
    ],
    [
      'characters/accessory',
      'Accessories',
      'Complete head-center overlays; currently the cafeteria hairnet.',
    ],
  ];
  return renderSourceSheet({
    title: 'Terrarium canonical SVG library · character sources',
    subtitle: 'Every exact file in assets/parts · grouped by production slot',
    groups: definitions.map(([category, label, note]) => ({
      id: category,
      label,
      note,
      entries: entriesFor(inventory, [category]),
    })),
    columns: 12,
    cellHeight: 188,
  });
}

function propSurfaceSheet(
  inventory: CanonicalSvgReferenceInventory,
): string {
  return renderSourceSheet({
    title: 'Terrarium canonical SVG library · props and surfaces',
    subtitle:
      'Live props, outdoor carriers, floors, grass, and clearly separated deferred concepts',
    groups: [
      {
        id: 'props-workhorse',
        label: 'Interior workhorse props',
        note: 'Canonical artist-editable sources for the live prop importer.',
        entries: entriesFor(inventory, ['props/workhorse']),
      },
      {
        id: 'props-outdoor',
        label: 'Outdoor carriers',
        note: 'Canonical exterior props on existing live IDs and contracts.',
        entries: entriesFor(inventory, ['props/outdoor']),
      },
      {
        id: 'props-iris-hardware',
        label: 'IRIS installation hardware',
        note: 'Canonical live, dormant, and dock sources; installation heights use declared source roles.',
        entries: entriesFor(inventory, ['props/iris-hardware']),
      },
      {
        id: 'props-department-machines',
        label: 'Department machines and transport overlays',
        note: 'Canonical live machine states, facings, canister SKU, and work-type stamps.',
        entries: entriesFor(inventory, ['props/department-machines']),
      },
      {
        id: 'floors',
        label: 'Interior floors',
        note: 'Maintained Hybrid canonical sources; each fills one 128-unit tile.',
        entries: entriesFor(inventory, ['surfaces/floors']),
      },
      {
        id: 'grass',
        label: 'Grass grounds',
        note: 'Three accepted base sources; the separate grass-fringe remains deferred.',
        entries: entriesFor(inventory, ['surfaces/grass']),
      },
      {
        id: 'deferred',
        label: 'Gameplay-system concepts — deferred',
        note: 'Accepted visual references only; no live IDs, schema, export, or Unity registration.',
        entries: entriesFor(inventory, ['props/deferred-gameplay']),
      },
    ],
    columns: 12,
    cellHeight: 202,
  });
}

function wallSheet(inventory: CanonicalSvgReferenceInventory): string {
  return renderSourceSheet({
    title: 'Terrarium canonical SVG library · wall system',
    subtitle:
      '47 composed production masks above · exact active source fragments and bevel pieces below',
    groups: [
      {
        id: 'direct',
        label: 'Equal-height direct sources',
        note: 'Editable source pairs from the primary QuotaCo building-system bank.',
        entries: entriesFor(inventory, ['walls/equal-height-direct']),
      },
      {
        id: 'promoted-proof',
        label: 'Equal-height promoted proof sources',
        note: 'Accepted proof-bank pairs referenced by the production 47-frame ledger.',
        entries: entriesFor(inventory, [
          'walls/equal-height-promoted-proof',
        ]),
      },
      {
        id: 'bevel',
        label: 'Wall bevel kit',
        note: 'Twelve neutral fixed-light source pieces shared by opaque wall materials.',
        entries: entriesFor(inventory, ['walls/bevel']),
      },
    ],
    columns: 12,
    cellHeight: 188,
    wallFrames: inventory.wallFrames,
  });
}

function uiSheet(inventory: CanonicalSvgReferenceInventory): string {
  return renderSourceSheet({
    title: 'Terrarium canonical SVG library · UI marks and glyphs',
    subtitle:
      'Twenty-four source-owned marks · carriers, state surfaces, text, paths, and interaction remain Unity-owned',
    groups: [
      {
        id: 'ui-shared-primitives',
        label: 'Shared marks and ornaments',
        note: 'Exact authority inversions plus the approved square-corner and four-tick-focus redesigns.',
        entries: entriesFor(inventory, ['ui/shared-primitives']),
      },
      {
        id: 'ui-department-glyphs',
        label: 'Department-era work, readiness, state, and route marks',
        note: 'Nineteen approved tintable silhouettes promoted from the literal department design source.',
        entries: entriesFor(inventory, ['ui/department-glyphs']),
      },
    ],
    columns: 6,
    cellHeight: 280,
  });
}

function markdownGuide(
  inventory: CanonicalSvgReferenceInventory,
): string {
  const counts = inventory.manifest.counts;
  const exclusions = inventory.manifest.exclusions
    .map(
      (item) =>
        `- \`${item.pattern}\` — ${item.count}: ${item.reason}`,
    )
    .join('\n');
  return `# Terrarium canonical SVG library

Status: **generated reference; no production mutation**

This directory is the visual index for Terrarium's current genuine,
artist-editable SVG source library. It renders the exact source files selected
by the live import registries; it does not reconstruct the art from TypeScript.

## Open the guide

- [Complete one-sheet](./overview.svg) ([PNG](./overview.png))
- [Character sources](./characters.svg) ([PNG](./characters.png))
- [Props and surfaces](./props-surfaces.svg) ([PNG](./props-surfaces.png))
- [Shared UI primitives](./ui.svg) ([PNG](./ui.png))
- [Wall system](./walls.svg) ([PNG](./walls.png))
- [Machine-readable manifest](./manifest.json)
- [Browser index](./index.html)

## Current inventory

- ${counts.exactSourceFiles} exact SVG source files
- ${counts.production} production sources
- ${counts.productionDependencies} live production dependencies
- ${counts.deferred} accepted-but-deferred concepts
- ${counts.derivedWallFrames} composed equal-height wall frames shown for context

The four deferred gameplay concepts remain source-only. They are visible so the
library can be judged as a whole, but they have no live registration or active
production queue.

## Grass-fringe deferral

The 47-frame \`grass-fringe\` remains code-owned and is explicitly deferred.
This guide adds no transition SVGs and makes no exporter, schema, or Unity
change. Reopen the fringe only as a separate visual proof and approval slice.

## Deliberate exclusions

${exclusions}

## Regenerate

\`\`\`bash
npm run assets:reference:guide
npm run assets:reference:guide:check
\`\`\`

The check command fails when a canonical source, importer selection, manifest,
sheet, or raster is stale.
`;
}

function categoryCount(
  inventory: CanonicalSvgReferenceInventory,
  categories: readonly CanonicalSvgCategory[],
): number {
  return categories.reduce(
    (sum, category) =>
      sum + (inventory.manifest.counts.byCategory[category] ?? 0),
    0,
  );
}

function indexHtml(inventory: CanonicalSvgReferenceInventory): string {
  const counts = inventory.manifest.counts;
  const cards = [
    [
      'overview',
      'Complete one-sheet',
      `${counts.exactSourceFiles} exact editable SVG sources`,
    ],
    [
      'characters',
      'Character sources',
      `${categoryCount(inventory, [
        'characters/body',
        'characters/head',
        'characters/hair',
        'characters/outfit',
        'characters/accessory',
      ])} exact files`,
    ],
    [
      'props-surfaces',
      'Props and surfaces',
      `${categoryCount(inventory, [
        'props/workhorse',
        'props/outdoor',
        'props/iris-hardware',
        'props/department-machines',
        'props/deferred-gameplay',
        'surfaces/floors',
        'surfaces/grass',
      ])} exact files`,
    ],
    [
      'ui',
      'UI marks and glyphs',
      `${categoryCount(inventory, [
        'ui/shared-primitives',
        'ui/department-glyphs',
      ])} exact files`,
    ],
    [
      'walls',
      'Wall system',
      `${categoryCount(inventory, [
        'walls/equal-height-direct',
        'walls/equal-height-promoted-proof',
        'walls/bevel',
      ])} active sources + ${counts.derivedWallFrames} composed masks`,
    ],
  ] as const;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Terrarium canonical SVG library</title>
  <style>
    :root { color-scheme: light; --page:${PAGE}; --panel:${PANEL}; --ink:${INK}; --muted:${MUTED}; --rule:${RULE}; --green:${GREEN}; --coral:${CORAL}; --blue:${BLUE}; }
    * { box-sizing: border-box; }
    body { margin:0; background:var(--page); color:var(--ink); font:15px/1.5 Inter,ui-sans-serif,system-ui,sans-serif; }
    main { width:min(1500px,calc(100% - 32px)); margin:0 auto; padding:38px 0 64px; }
    header { display:grid; gap:12px; padding:26px 28px; border:1px solid var(--rule); border-radius:18px; background:var(--panel); }
    h1 { margin:0; color:var(--green); font-size:clamp(28px,4vw,48px); line-height:1.05; }
    h2 { margin:0; font-size:21px; }
    p { margin:0; color:var(--muted); max-width:90ch; }
    .stats { display:flex; flex-wrap:wrap; gap:10px; margin-top:8px; }
    .stat { padding:7px 11px; border-radius:999px; background:#ece5d7; color:var(--blue); font-weight:750; }
    .notice { border-left:5px solid var(--coral); padding-left:14px; }
    .grid { display:grid; grid-template-columns:1fr; gap:24px; margin-top:28px; }
    article { overflow:hidden; border:1px solid var(--rule); border-radius:18px; background:var(--panel); }
    article > div { display:flex; justify-content:space-between; gap:18px; padding:18px 20px; align-items:baseline; }
    article img { display:block; width:100%; height:auto; background:var(--page); border-top:1px solid var(--rule); }
    a { color:var(--blue); }
    .links { white-space:nowrap; font-weight:700; }
    footer { margin-top:28px; color:var(--muted); }
    @media (max-width:720px) { main { width:min(100% - 16px,1500px); padding-top:8px; } article > div { align-items:flex-start; flex-direction:column; } }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>Terrarium canonical SVG library</h1>
      <p>One visual source of truth for the genuine editable assets currently selected by Terrarium's live importers.</p>
      <div class="stats">
        <span class="stat">${counts.exactSourceFiles} exact sources</span>
        <span class="stat">${counts.production} production</span>
        <span class="stat">${counts.productionDependencies} dependencies</span>
        <span class="stat">${counts.deferred} deferred concepts</span>
        <span class="stat">${counts.derivedWallFrames} wall masks</span>
      </div>
      <p class="notice"><strong>Grass fringe remains deferred.</strong> This guide creates no transition source, export, schema, or Unity change.</p>
      <p><a href="./README.md">Scope and regeneration notes</a> · <a href="./manifest.json">machine-readable manifest</a></p>
    </header>
    <section class="grid">
      ${cards.map(([slug, label, note]) => `<article>
        <div>
          <div><h2>${esc(label)}</h2><p>${esc(note)}</p></div>
          <span class="links"><a href="./${slug}.svg">SVG</a> · <a href="./${slug}.png">PNG</a></span>
        </div>
        <a href="./${slug}.svg"><img src="./${slug}.png" alt="${esc(label)}"></a>
      </article>`).join('\n')}
    </section>
    <footer>Generated from live canonical source registries. Individual art changes belong in the linked SVG source files.</footer>
  </main>
</body>
</html>
`;
}

async function writeOrCheck(
  filename: string,
  data: string | Uint8Array,
  check: boolean,
): Promise<void> {
  const expected =
    typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data);
  if (check) {
    const current = await readFile(filename).catch(() => undefined);
    if (!current || !current.equals(expected)) {
      throw new Error(
        `${filename} is stale; run npm run assets:reference:guide`,
      );
    }
    return;
  }
  await writeFile(filename, expected);
}

export async function renderCanonicalSvgReferenceGuide(
  output = path.join('docs', 'reference', GUIDE_SLUG),
  check = false,
): Promise<{
  readonly output: string;
  readonly manifest: CanonicalSvgReferenceManifest;
}> {
  const inventory = await collectCanonicalSvgReferenceInventory();
  const sheets = [
    ['overview', overviewSheet(inventory)],
    ['characters', characterSheet(inventory)],
    ['props-surfaces', propSurfaceSheet(inventory)],
    ['ui', uiSheet(inventory)],
    ['walls', wallSheet(inventory)],
  ] as const;
  if (!check) await mkdir(output, { recursive: true });
  for (const [slug, source] of sheets) {
    const png = new Resvg(source, {
      font: { loadSystemFonts: true },
    }).render().asPng();
    await writeOrCheck(path.join(output, `${slug}.svg`), source, check);
    await writeOrCheck(path.join(output, `${slug}.png`), png, check);
  }
  await writeOrCheck(
    path.join(output, 'manifest.json'),
    `${JSON.stringify(inventory.manifest, null, 2)}\n`,
    check,
  );
  await writeOrCheck(
    path.join(output, 'README.md'),
    markdownGuide(inventory),
    check,
  );
  await writeOrCheck(
    path.join(output, 'index.html'),
    indexHtml(inventory),
    check,
  );
  return { output, manifest: inventory.manifest };
}

function parseArgs(args: readonly string[]): {
  readonly output: string;
  readonly check: boolean;
} {
  let output = path.resolve('docs', 'reference', GUIDE_SLUG);
  let check = false;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--out') {
      const value = args[++index];
      if (!value) throw new Error('--out requires a path');
      output = path.resolve(value);
    } else if (argument === '--check') {
      check = true;
    } else {
      throw new Error(`Unknown argument ${argument}`);
    }
  }
  return { output, check };
}

if (process.argv[1]?.endsWith('canonicalSvgReferenceGuide.ts')) {
  const options = parseArgs(process.argv.slice(2));
  renderCanonicalSvgReferenceGuide(options.output, options.check)
    .then(({ output, manifest }) => {
      process.stdout.write(
        `${options.check ? 'Verified' : 'Wrote'} canonical SVG reference guide ` +
        `(${manifest.counts.exactSourceFiles} exact sources, ` +
        `${manifest.counts.derivedWallFrames} derived wall frames):\n${output}\n`,
      );
    })
    .catch((error: unknown) => {
      process.stderr.write(
        `${error instanceof Error ? error.message : String(error)}\n`,
      );
      process.exitCode = 1;
    });
}
