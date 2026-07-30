import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import svgpath from 'svgpath';
import { parseSync, type INode } from 'svgson';

import type {
  PropPalette,
  PropPaletteToken,
  TileInstance,
} from '../../src/core/types';
import {
  DEFAULT_FLOORS,
  DEFAULT_GROUND,
} from '../../src/data/defaults';
import type {
  AuthoredSurfaceKind,
  ImportedSurfaceArt,
  ImportedSurfaceShape,
} from '../../src/tiles/authoredSurfaceArt';
import { PartImportError } from '../parts/importer';

const CANVAS = 128;
const TOKENS = ['primary', 'secondary', 'accent'] as const;
const TOKEN_SET = new Set<PropPaletteToken>(TOKENS);
const VISIBLE_TAGS = new Set(['path', 'rect', 'ellipse', 'circle']);
const PRESENTATION_ATTRIBUTES = new Set([
  'fill',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'fill-rule',
  'opacity',
]);

export const QUOTA_CO_MAINTAINED_HYBRID_FLOOR_IDS =
  DEFAULT_FLOORS.map(({ id }) => id);
export const QUOTA_CO_MAINTAINED_HYBRID_GRASS_IDS = [
  'ground-grass',
  'ground-grass-b',
  'ground-grass-c',
] as const;
export const QUOTA_CO_MAINTAINED_HYBRID_SURFACE_IDS = [
  ...QUOTA_CO_MAINTAINED_HYBRID_FLOOR_IDS,
  ...QUOTA_CO_MAINTAINED_HYBRID_GRASS_IDS,
];

interface ManifestEntry {
  readonly id: string;
  readonly kind: AuthoredSurfaceKind;
  readonly templateId: string;
  readonly file: string;
  readonly paletteDefaults: PropPalette;
  readonly defaultParams: Readonly<Record<string, number>>;
}

interface ParsedSource {
  readonly shapes: readonly ImportedSurfaceShape[];
}

function manifestEntry(
  target: TileInstance,
  kind: AuthoredSurfaceKind,
  directory: string,
): ManifestEntry {
  return {
    id: target.id,
    kind,
    templateId: target.templateId,
    file: path.posix.join(directory, `${target.id}.svg`),
    paletteDefaults: target.palette,
    defaultParams: target.params,
  };
}

export const QUOTA_CO_MAINTAINED_HYBRID_SURFACE_MANIFEST:
  readonly ManifestEntry[] = [
    ...DEFAULT_FLOORS.map((target) =>
      manifestEntry(target, 'floor', 'floors'),
    ),
    ...QUOTA_CO_MAINTAINED_HYBRID_GRASS_IDS.map((id) => {
      const target = DEFAULT_GROUND.find((candidate) => candidate.id === id);
      if (!target) throw new Error(`Missing default grass instance ${id}`);
      return manifestEntry(target, 'ground', 'ground');
    }),
  ];

function fail(source: string, message: string): never {
  throw new PartImportError(source, message);
}

function localName(name: string): string {
  const colon = name.indexOf(':');
  return (colon >= 0 ? name.slice(colon + 1) : name).toLowerCase();
}

function finiteNumber(
  source: string,
  label: string,
  value: string | undefined,
): number {
  if (value === undefined || value.trim() === '') {
    fail(source, `${label} is required`);
  }
  const number = Number(value);
  if (!Number.isFinite(number)) fail(source, `${label} must be finite`);
  return number;
}

function positiveNumber(
  source: string,
  label: string,
  value: string | undefined,
): number {
  const number = finiteNumber(source, label, value);
  if (number <= 0) fail(source, `${label} must be greater than zero`);
  return number;
}

function roundedRectPath(
  source: string,
  attributes: Record<string, string>,
): string {
  const x = finiteNumber(source, 'rect x', attributes.x ?? '0');
  const y = finiteNumber(source, 'rect y', attributes.y ?? '0');
  const width = positiveNumber(source, 'rect width', attributes.width);
  const height = positiveNumber(source, 'rect height', attributes.height);
  let rx =
    attributes.rx === undefined
      ? 0
      : finiteNumber(source, 'rect rx', attributes.rx);
  let ry =
    attributes.ry === undefined
      ? rx
      : finiteNumber(source, 'rect ry', attributes.ry);
  if (rx < 0 || ry < 0) fail(source, 'rect radii cannot be negative');
  rx = Math.min(rx, width / 2);
  ry = Math.min(ry, height / 2);
  if (rx === 0 || ry === 0) {
    return `M${x} ${y}H${x + width}V${y + height}H${x}Z`;
  }
  return [
    `M${x + rx} ${y}`,
    `H${x + width - rx}`,
    `A${rx} ${ry} 0 0 1 ${x + width} ${y + ry}`,
    `V${y + height - ry}`,
    `A${rx} ${ry} 0 0 1 ${x + width - rx} ${y + height}`,
    `H${x + rx}`,
    `A${rx} ${ry} 0 0 1 ${x} ${y + height - ry}`,
    `V${y + ry}`,
    `A${rx} ${ry} 0 0 1 ${x + rx} ${y}`,
    'Z',
  ].join('');
}

function ellipsePath(
  source: string,
  attributes: Record<string, string>,
  isCircle: boolean,
): string {
  const label = isCircle ? 'circle' : 'ellipse';
  const cx = finiteNumber(source, `${label} cx`, attributes.cx ?? '0');
  const cy = finiteNumber(source, `${label} cy`, attributes.cy ?? '0');
  const rx = positiveNumber(
    source,
    `${label} radius`,
    isCircle ? attributes.r : attributes.rx,
  );
  const ry = isCircle
    ? rx
    : positiveNumber(source, 'ellipse ry', attributes.ry);
  return (
    `M${cx - rx} ${cy}` +
    `A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}` +
    `A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`
  );
}

function pathForNode(source: string, node: INode): string {
  const tag = localName(node.name);
  if (tag === 'path') {
    const d = node.attributes.d?.trim();
    if (!d) fail(source, `path ${node.attributes.id ?? '(unnamed)'} has no d`);
    return d;
  }
  if (tag === 'rect') return roundedRectPath(source, node.attributes);
  if (tag === 'ellipse') return ellipsePath(source, node.attributes, false);
  if (tag === 'circle') return ellipsePath(source, node.attributes, true);
  return fail(source, `unsupported visible element <${node.name}>`);
}

function tokenForPaint(
  paint: string | undefined,
  palette: PropPalette,
): PropPaletteToken | undefined {
  if (!paint) return undefined;
  const normalized = paint.toUpperCase();
  return TOKENS.find(
    (token) => palette[token].toUpperCase() === normalized,
  );
}

function validatePaintMetadata(
  source: string,
  node: INode,
  manifest: ManifestEntry,
): void {
  const fillToken = tokenForPaint(node.attributes.fill, manifest.paletteDefaults);
  const strokeToken = tokenForPaint(
    node.attributes.stroke,
    manifest.paletteDefaults,
  );
  const declaredFill = node.attributes['data-fill-token'];
  const declaredStroke = node.attributes['data-stroke-token'];

  if (declaredFill !== undefined && !TOKEN_SET.has(declaredFill as PropPaletteToken)) {
    fail(source, `${node.attributes.id} has invalid data-fill-token`);
  }
  if (
    declaredStroke !== undefined &&
    !TOKEN_SET.has(declaredStroke as PropPaletteToken)
  ) {
    fail(source, `${node.attributes.id} has invalid data-stroke-token`);
  }
  if (fillToken !== (declaredFill as PropPaletteToken | undefined)) {
    fail(
      source,
      `${node.attributes.id} fill token metadata does not match its source paint`,
    );
  }
  if (strokeToken !== (declaredStroke as PropPaletteToken | undefined)) {
    fail(
      source,
      `${node.attributes.id} stroke token metadata does not match its source paint`,
    );
  }
}

function normalizedPath(source: string, d: string): string {
  const compiled = svgpath(d);
  const error = (compiled as unknown as { err?: string }).err;
  if (error) fail(source, `invalid path data (${error})`);
  const result = d.trim();
  if (!result || /(?:NaN|Infinity)/.test(result)) {
    fail(source, 'path produced no finite geometry');
  }
  return result;
}

function normalizedPaint(
  source: string,
  label: string,
  value: string | undefined,
): string | undefined {
  if (value === undefined || value.trim().toLowerCase() === 'none') {
    return undefined;
  }
  const normalized = value.trim().toUpperCase();
  if (!/^#[0-9A-F]{6}$/.test(normalized)) {
    fail(source, `${label} must be none or #RRGGBB`);
  }
  return normalized;
}

function compiledShape(
  source: string,
  node: INode,
  manifest: ManifestEntry,
  semanticGroup: string,
): ImportedSurfaceShape {
  for (const attribute of Object.keys(node.attributes)) {
    if (
      PRESENTATION_ATTRIBUTES.has(attribute) ||
      attribute === 'id' ||
      attribute === 'd' ||
      attribute === 'x' ||
      attribute === 'y' ||
      attribute === 'width' ||
      attribute === 'height' ||
      attribute === 'rx' ||
      attribute === 'ry' ||
      attribute === 'cx' ||
      attribute === 'cy' ||
      attribute === 'r' ||
      attribute === 'data-fill-token' ||
      attribute === 'data-stroke-token'
    ) {
      continue;
    }
    fail(source, `${node.attributes.id} has unsupported attribute ${attribute}`);
  }
  const fill = normalizedPaint(source, 'fill', node.attributes.fill);
  const stroke = normalizedPaint(source, 'stroke', node.attributes.stroke);
  if (!fill && !stroke) {
    fail(source, `${node.attributes.id} must have an explicit fill or stroke`);
  }
  if (node.attributes['fill-rule']?.toLowerCase() === 'evenodd') {
    fail(source, `${node.attributes.id} must use the nonzero fill rule`);
  }
  let strokeWidth: number | undefined;
  if (stroke) {
    strokeWidth = positiveNumber(
      source,
      `${node.attributes.id} stroke-width`,
      node.attributes['stroke-width'],
    );
    if (
      node.attributes['stroke-linecap'] !== 'round' ||
      node.attributes['stroke-linejoin'] !== 'round'
    ) {
      fail(source, `${node.attributes.id} strokes require round caps and joins`);
    }
  }
  let opacity: number | undefined;
  if (node.attributes.opacity !== undefined) {
    const value = finiteNumber(
      source,
      `${node.attributes.id} opacity`,
      node.attributes.opacity,
    );
    if (value <= 0 || value > 1) {
      fail(source, `${node.attributes.id} opacity must be above zero and at most one`);
    }
    if (value !== 1) opacity = Number(value.toFixed(3));
  }
  const fillToken = tokenForPaint(fill, manifest.paletteDefaults);
  const strokeToken = tokenForPaint(stroke, manifest.paletteDefaults);
  const shape: ImportedSurfaceShape = {
    d: normalizedPath(source, pathForNode(source, node)),
    silhouette: false,
    sourceElementId: node.attributes.id,
    semanticGroup,
  };
  if (fill) shape.fill = fillToken ? `$${fillToken}` : fill;
  if (stroke) {
    shape.stroke = strokeToken ? `$${strokeToken}` : stroke;
    shape.strokeWidth = strokeWidth;
  }
  if (opacity !== undefined) shape.opacity = opacity;
  return shape;
}

function parseSource(
  source: string,
  input: string,
  manifest: ManifestEntry,
): ParsedSource {
  if (/<!DOCTYPE/i.test(input)) fail(source, 'DOCTYPE declarations are forbidden');
  let root: INode;
  try {
    root = parseSync(input);
  } catch (error) {
    return fail(
      source,
      `invalid XML (${error instanceof Error ? error.message : String(error)})`,
    );
  }
  if (root.type !== 'element' || localName(root.name) !== 'svg') {
    fail(source, 'document root must be <svg>');
  }
  const viewBox = (root.attributes.viewBox ?? root.attributes.viewbox ?? '')
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  if (
    viewBox.length !== 4 ||
    viewBox.some((value) => !Number.isFinite(value)) ||
    viewBox[0] !== 0 ||
    viewBox[1] !== 0 ||
    viewBox[2] !== CANVAS ||
    viewBox[3] !== CANVAS
  ) {
    fail(source, 'viewBox must be exactly 0 0 128 128');
  }
  for (const dimension of ['width', 'height'] as const) {
    const value = root.attributes[dimension];
    if (value !== '128' && value !== '128px') {
      fail(source, `${dimension} must be 128 or 128px`);
    }
  }
  if (root.attributes['data-surface-id'] !== manifest.id) {
    fail(source, `data-surface-id must be ${manifest.id}`);
  }
  if (root.attributes['data-kind'] !== manifest.kind) {
    fail(source, `data-kind must be ${manifest.kind}`);
  }
  if (root.attributes['data-template-id'] !== manifest.templateId) {
    fail(source, `data-template-id must be ${manifest.templateId}`);
  }
  if (root.attributes['data-direction'] !== 'maintained-hybrid') {
    fail(source, 'data-direction must be maintained-hybrid');
  }

  const title = root.children.find(
    (child) => child.type === 'element' && localName(child.name) === 'title',
  );
  const description = root.children.find(
    (child) => child.type === 'element' && localName(child.name) === 'desc',
  );
  if (!title || !description) fail(source, 'source requires title and desc');

  const ids = new Set<string>();
  const shapes: ImportedSurfaceShape[] = [];
  let substrateFound = false;

  const visit = (
    node: INode,
    groupId: string | undefined,
    ignored: boolean,
  ): void => {
    if (node.type === 'text') {
      if (node.value.trim()) {
        fail(source, 'rendered text outside title and desc is forbidden');
      }
      return;
    }
    if (node.type !== 'element') return;
    const tag = localName(node.name);
    if (tag === 'title' || tag === 'desc' || tag === 'metadata') return;
    if (
      tag === 'script' ||
      tag === 'image' ||
      tag === 'foreignobject' ||
      tag === 'filter' ||
      tag === 'lineargradient' ||
      tag === 'radialgradient'
    ) {
      fail(source, `<${node.name}> is forbidden`);
    }
    for (const name of Object.keys(node.attributes)) {
      const normalizedName = name.toLowerCase();
      if (normalizedName.startsWith('on')) {
        fail(source, `event attribute ${name} is forbidden`);
      }
      if (normalizedName === 'href' || normalizedName.endsWith(':href')) {
        fail(source, `${name} is forbidden`);
      }
      if (normalizedName === 'style' || normalizedName === 'transform') {
        fail(source, `${name} is forbidden; bake presentation into explicit geometry`);
      }
    }

    const id = node.attributes.id;
    if (id) {
      if (ids.has(id)) fail(source, `duplicate id ${id}`);
      ids.add(id);
    }
    if (tag === 'g') {
      if (!id) fail(source, 'every editor group requires an id');
      if (id === 'substrate') substrateFound = true;
      if (ignored) return;
      for (const child of node.children) visit(child, id, false);
      return;
    }
    if (!VISIBLE_TAGS.has(tag)) {
      fail(
        source,
        `<${node.name}> is forbidden; use groups, paths, rects, ellipses, or circles`,
      );
    }
    if (ignored) return;
    if (!groupId) {
      fail(source, `visible element ${id ?? '(unnamed)'} needs a semantic group`);
    }
    if (!id) fail(source, 'every visible element requires an id');
    validatePaintMetadata(source, node, manifest);
    shapes.push(compiledShape(source, node, manifest, groupId));
  };

  for (const child of root.children) visit(child, undefined, false);
  if (!substrateFound) fail(source, 'source requires a substrate group');
  if (shapes.length === 0) fail(source, 'source has no production elements');

  return { shapes };
}

function compileShapes(
  source: string,
  input: string,
  manifest: ManifestEntry,
): ImportedSurfaceShape[] {
  return [...parseSource(source, input, manifest).shapes];
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export async function compileQuotaCoMaintainedHybridSurfaces(
  inputDir: string,
  sourcePathPrefix: string,
): Promise<ImportedSurfaceArt[]> {
  const imports: ImportedSurfaceArt[] = [];
  for (const manifest of QUOTA_CO_MAINTAINED_HYBRID_SURFACE_MANIFEST) {
    const absolutePath = path.join(inputDir, manifest.file);
    const sourceFile = path.posix.join(
      sourcePathPrefix.replaceAll('\\', '/'),
      manifest.file,
    );
    const input = await readFile(absolutePath, 'utf8');
    imports.push({
      id: manifest.id,
      kind: manifest.kind,
      templateId: manifest.templateId,
      sourceFile,
      sourceSha256: createHash('sha256').update(input).digest('hex'),
      paletteDefaults: manifest.paletteDefaults,
      defaultParams: manifest.defaultParams,
      shapes: compileShapes(sourceFile, input, manifest),
    });
  }
  return imports.sort((left, right) => compareText(left.id, right.id));
}

function quote(value: string): string {
  return JSON.stringify(value);
}

function emitShape(shape: ImportedSurfaceShape): string {
  const fields = [`d: ${quote(shape.d)}`];
  if (shape.fill !== undefined) fields.push(`fill: ${quote(shape.fill)}`);
  if (shape.stroke !== undefined) fields.push(`stroke: ${quote(shape.stroke)}`);
  if (shape.strokeWidth !== undefined) {
    fields.push(`strokeWidth: ${shape.strokeWidth}`);
  }
  if (shape.opacity !== undefined) fields.push(`opacity: ${shape.opacity}`);
  if (shape.silhouette !== undefined) {
    fields.push(`silhouette: ${shape.silhouette}`);
  }
  fields.push(`sourceElementId: ${quote(shape.sourceElementId)}`);
  fields.push(`semanticGroup: ${quote(shape.semanticGroup)}`);
  return `{ ${fields.join(', ')} }`;
}

/** Deterministic production-source module compiled from canonical SVGs. */
export function emitQuotaCoMaintainedHybridSurfaceArt(
  imports: readonly ImportedSurfaceArt[],
): string {
  const lines = [
    "import type { ImportedSurfaceArt } from '../authoredSurfaceArt';",
    '',
    '// Generated by `npm run surfaces:import`. Do not edit by hand.',
    '// Canonical SVG geometry is registered through maintainedHybridSurfaceShapes().',
    'export const QUOTA_CO_MAINTAINED_HYBRID_SURFACE_ART = [',
  ];
  for (const imported of imports) {
    lines.push('  {');
    lines.push(`    id: ${quote(imported.id)},`);
    lines.push(`    kind: ${quote(imported.kind)},`);
    lines.push(`    templateId: ${quote(imported.templateId)},`);
    lines.push(`    sourceFile: ${quote(imported.sourceFile)},`);
    lines.push(`    sourceSha256: ${quote(imported.sourceSha256)},`);
    lines.push(`    paletteDefaults: ${JSON.stringify(imported.paletteDefaults)},`);
    lines.push(`    defaultParams: ${JSON.stringify(imported.defaultParams)},`);
    lines.push('    shapes: [');
    for (const shape of imported.shapes) {
      lines.push(`      ${emitShape(shape)},`);
    }
    lines.push('    ],');
    lines.push('  },');
  }
  lines.push('] as const satisfies readonly ImportedSurfaceArt[];');
  return `${lines.join('\n')}\n`;
}
