import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { parseSync, type INode } from 'svgson';

import type { ShapeSpec } from '../../src/core/types';

export type CanonicalUiIconMode = 'tintable' | 'literal';
export type CanonicalUiIconDecision = 'exact-authority-inversion' | 'approved-redesign';

interface ManifestIcon {
  readonly id: string;
  readonly label: string;
  readonly mode: CanonicalUiIconMode;
  readonly file: string;
  readonly decision: CanonicalUiIconDecision;
  readonly literalReviewSizes: readonly number[];
}

interface Manifest {
  readonly schemaVersion: number;
  readonly family: string;
  readonly authority: string;
  readonly canvas: {
    readonly width: number;
    readonly height: number;
    readonly origin: readonly number[];
  };
  readonly icons: readonly ManifestIcon[];
}

export interface ImportedCanonicalUiIconArt {
  readonly id: string;
  readonly label: string;
  readonly mode: CanonicalUiIconMode;
  readonly decision: CanonicalUiIconDecision;
  readonly sourceFile: string;
  readonly sourceSha256: string;
  readonly literalReviewSizes: readonly number[];
  readonly shapes: readonly ShapeSpec[];
}

const EXPECTED_IDS = ['ui-divider', 'ui-corner', 'ui-focus', 'iris-mark', 'quotaco-mark'] as const;
const ALLOWED_ROOT_ATTRIBUTES = new Set([
  'xmlns', 'width', 'height', 'viewBox', 'data-ui-icon-id', 'data-icon-mode',
]);
const ALLOWED_GROUP_ATTRIBUTES = new Set(['id', 'transform']);
const ALLOWED_PATH_ATTRIBUTES = new Set([
  'id', 'd', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'opacity',
]);
const RESERVED_LITERAL_COLORS = new Set([
  '#D08010', '#D69B4B', '#F0A000', '#E5A000',
  '#A45A6C', '#D9708C', '#C9657D',
]);

export class CanonicalUiIconImportError extends Error {
  constructor(source: string, message: string) {
    super(`${source}: ${message}`);
    this.name = 'CanonicalUiIconImportError';
  }
}

function fail(source: string, message: string): never {
  throw new CanonicalUiIconImportError(source, message);
}

function localName(name: string): string {
  const colon = name.indexOf(':');
  return (colon >= 0 ? name.slice(colon + 1) : name).toLowerCase();
}

function elementChildren(node: INode): INode[] {
  return node.children.filter((child) => child.type === 'element');
}

function textContent(node: INode | undefined): string {
  if (!node) return '';
  return node.children.map((child) => child.value).join('').trim();
}

function assertAllowedAttributes(source: string, node: INode, allowed: ReadonlySet<string>): void {
  for (const attribute of Object.keys(node.attributes)) {
    if (!allowed.has(attribute)) fail(source, `<${node.name}> attribute ${attribute} is forbidden`);
    if (/^on/i.test(attribute)) fail(source, `event attribute ${attribute} is forbidden`);
  }
}

function finiteNumber(source: string, label: string, value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) fail(source, `${label} must be finite`);
  return parsed;
}

function normalizePaint(value: string | undefined): string | undefined {
  if (!value || value.toLowerCase() === 'none') return undefined;
  return value.toUpperCase();
}

function compilePath(source: string, node: INode, mode: CanonicalUiIconMode): ShapeSpec {
  assertAllowedAttributes(source, node, ALLOWED_PATH_ATTRIBUTES);
  const id = node.attributes.id;
  const d = node.attributes.d?.trim();
  if (!id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) fail(source, 'every path needs a lowercase semantic id');
  if (!d) fail(source, `${id} needs non-empty path data`);
  if (node.children.some((child) => child.type === 'element' || child.value.trim())) {
    fail(source, `${id} cannot contain child content`);
  }

  const fill = normalizePaint(node.attributes.fill);
  const stroke = normalizePaint(node.attributes.stroke);
  if (!fill && !stroke) fail(source, `${id} needs explicit fill or stroke`);
  if (mode === 'tintable' && [fill, stroke].some((paint) => paint !== undefined && paint !== '#FFFFFF')) {
    fail(source, `${id} tintable geometry must be white`);
  }
  if (mode === 'literal') {
    for (const paint of [fill, stroke]) {
      if (paint && RESERVED_LITERAL_COLORS.has(paint)) fail(source, `${id} uses reserved amber/rose ${paint}`);
    }
  }

  const shape: ShapeSpec = { d, silhouette: false };
  if (fill) shape.fill = fill;
  if (stroke) {
    shape.stroke = stroke;
    const width = finiteNumber(source, `${id} stroke-width`, node.attributes['stroke-width']);
    if (width <= 0) fail(source, `${id} stroke-width must be positive`);
    const linecap = node.attributes['stroke-linecap'];
    const linejoin = node.attributes['stroke-linejoin'];
    if (linecap !== 'round' && linecap !== 'butt' && linecap !== 'square') {
      fail(source, `${id} needs round, butt, or square stroke-linecap`);
    }
    if (linejoin !== 'round' && linejoin !== 'miter' && linejoin !== 'bevel') {
      fail(source, `${id} needs round, miter, or bevel stroke-linejoin`);
    }
    shape.strokeWidth = width;
    shape.strokeLinecap = linecap;
    shape.strokeLinejoin = linejoin;
  }
  if (node.attributes.opacity !== undefined) {
    const opacity = finiteNumber(source, `${id} opacity`, node.attributes.opacity);
    if (opacity <= 0 || opacity > 1) fail(source, `${id} opacity must be greater than zero and at most one`);
    if (opacity !== 1) shape.opacity = opacity;
  }
  return shape;
}

function parseSource(source: string, svg: string, entry: ManifestIcon): ShapeSpec[] {
  if (/<!DOCTYPE/i.test(svg)) fail(source, 'DOCTYPE declarations are forbidden');
  if (/<(?:script|foreignObject|image|text|use|style)\b/i.test(svg)) {
    fail(source, 'script, foreignObject, image, text, use, and style are forbidden');
  }
  if (/\b(?:href|xlink:href|on[a-z]+)\s*=/i.test(svg)) fail(source, 'references and event attributes are forbidden');

  let root: INode;
  try {
    root = parseSync(svg);
  } catch (error) {
    fail(source, `invalid XML (${error instanceof Error ? error.message : String(error)})`);
  }
  if (root.type !== 'element' || localName(root.name) !== 'svg') fail(source, 'root must be svg');
  assertAllowedAttributes(source, root, ALLOWED_ROOT_ATTRIBUTES);
  if (root.attributes.width !== '128' || root.attributes.height !== '128' || root.attributes.viewBox !== '0 0 128 128') {
    fail(source, 'root must declare the canonical 128 canvas and viewBox');
  }
  if (root.attributes['data-ui-icon-id'] !== entry.id) fail(source, 'root stable id does not match manifest');
  if (root.attributes['data-icon-mode'] !== entry.mode) fail(source, 'root mode does not match manifest');

  const children = elementChildren(root);
  const title = children.find((child) => localName(child.name) === 'title');
  const desc = children.find((child) => localName(child.name) === 'desc');
  if (!textContent(title)) fail(source, 'source needs a non-empty title');
  if (!textContent(desc)) fail(source, 'source needs a non-empty description');
  const visibleGroups = children.filter((child) => localName(child.name) === 'g');
  if (visibleGroups.length !== 1) fail(source, 'source needs exactly one visible group');
  const group = visibleGroups[0];
  assertAllowedAttributes(source, group, ALLOWED_GROUP_ATTRIBUTES);
  if (group.attributes.id !== 'approved-mark' || group.attributes.transform !== 'translate(64 64)') {
    fail(source, 'visible art must be directly under approved-mark translate(64 64)');
  }
  const pathNodes = elementChildren(group);
  if (pathNodes.length === 0 || pathNodes.some((node) => localName(node.name) !== 'path')) {
    fail(source, 'approved-mark may contain paths only');
  }
  const ids = new Set<string>();
  const shapes = pathNodes.map((node) => {
    const id = node.attributes.id;
    if (ids.has(id)) fail(source, `duplicate path id ${id}`);
    ids.add(id);
    return compilePath(source, node, entry.mode);
  });

  try {
    const renderer = new Resvg(svg, { font: { loadSystemFonts: false } });
    const bbox = renderer.getBBox();
    if (!bbox || bbox.x < 0 || bbox.y < 0 || bbox.x + bbox.width > 128 || bbox.y + bbox.height > 128) {
      fail(source, 'painted bounds must remain inside the 128 canvas');
    }
    if (!renderer.render().pixels.some((value, index) => index % 4 === 3 && value !== 0)) {
      fail(source, 'source paints no pixels');
    }
  } catch (error) {
    if (error instanceof CanonicalUiIconImportError) throw error;
    fail(source, `renderer rejected source (${error instanceof Error ? error.message : String(error)})`);
  }
  return shapes;
}

function hash(source: string): string {
  return createHash('sha256').update(source).digest('hex');
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function validateManifest(source: string, manifest: Manifest): void {
  if (manifest.schemaVersion !== 1 || manifest.family !== 'canonical-ui-shared-primitives-v1' || manifest.authority !== 'canonical-svg') {
    fail(source, 'manifest identity or schema is unsupported');
  }
  if (manifest.canvas.width !== 128 || manifest.canvas.height !== 128 || manifest.canvas.origin.join(',') !== '64,64') {
    fail(source, 'manifest canvas must be 128 with origin 64,64');
  }
  const ids = manifest.icons.map((entry) => entry.id);
  if ([...ids].sort(compareText).join(',') !== [...EXPECTED_IDS].sort(compareText).join(',')) {
    fail(source, `manifest must contain exactly ${EXPECTED_IDS.join(', ')}`);
  }
  if (new Set(ids).size !== ids.length) fail(source, 'manifest repeats an icon id');
  for (const entry of manifest.icons) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id)) fail(source, `invalid icon id ${entry.id}`);
    if (entry.file !== `${entry.id}.svg`) fail(source, `${entry.id} source filename must match its stable id`);
    if (!entry.label.trim()) fail(source, `${entry.id} needs a label`);
    if (entry.mode !== 'tintable' && entry.mode !== 'literal') fail(source, `${entry.id} has unsupported mode`);
    if (entry.decision !== 'exact-authority-inversion' && entry.decision !== 'approved-redesign') {
      fail(source, `${entry.id} has unsupported promotion decision`);
    }
    if (entry.literalReviewSizes.length === 0 || entry.literalReviewSizes.some((size) => !Number.isInteger(size) || size <= 0)) {
      fail(source, `${entry.id} needs positive literal review sizes`);
    }
  }
}

export async function compileCanonicalUiIconArt(
  inputDir: string,
  sourcePathPrefix: string,
): Promise<ImportedCanonicalUiIconArt[]> {
  const manifestFile = path.join(inputDir, 'manifest.json');
  const manifestSource = await readFile(manifestFile, 'utf8');
  let manifest: Manifest;
  try {
    manifest = JSON.parse(manifestSource) as Manifest;
  } catch (error) {
    fail(manifestFile, `invalid JSON (${error instanceof Error ? error.message : String(error)})`);
  }
  validateManifest(manifestFile, manifest);

  const imports = await Promise.all(manifest.icons.map(async (entry) => {
    const sourceFile = path.posix.join(sourcePathPrefix.replaceAll('\\', '/'), entry.file);
    const svg = await readFile(path.join(inputDir, entry.file), 'utf8');
    return {
      id: entry.id,
      label: entry.label,
      mode: entry.mode,
      decision: entry.decision,
      sourceFile,
      sourceSha256: hash(svg),
      literalReviewSizes: [...entry.literalReviewSizes],
      shapes: parseSource(sourceFile, svg, entry),
    } satisfies ImportedCanonicalUiIconArt;
  }));
  return imports.sort((left, right) => compareText(left.id, right.id));
}

function quote(value: string): string {
  return JSON.stringify(value);
}

function emitShape(shape: ShapeSpec): string {
  const fields = [`d: ${quote(shape.d)}`];
  if (shape.fill !== undefined) fields.push(`fill: ${quote(shape.fill)}`);
  if (shape.stroke !== undefined) fields.push(`stroke: ${quote(shape.stroke)}`);
  if (shape.strokeWidth !== undefined) fields.push(`strokeWidth: ${shape.strokeWidth}`);
  if (shape.strokeLinecap !== undefined) fields.push(`strokeLinecap: ${quote(shape.strokeLinecap)}`);
  if (shape.strokeLinejoin !== undefined) fields.push(`strokeLinejoin: ${quote(shape.strokeLinejoin)}`);
  if (shape.opacity !== undefined) fields.push(`opacity: ${shape.opacity}`);
  if (shape.silhouette !== undefined) fields.push(`silhouette: ${shape.silhouette}`);
  return `{ ${fields.join(', ')} }`;
}

export function emitCanonicalUiIconArt(imports: readonly ImportedCanonicalUiIconArt[]): string {
  const lines = [
    '// Generated by `npm run ui-shared:import`. Do not edit by hand.',
    'export const CANONICAL_UI_ICON_ART = [',
  ];
  for (const imported of imports) {
    lines.push('  {');
    lines.push(`    id: ${quote(imported.id)},`);
    lines.push(`    label: ${quote(imported.label)},`);
    lines.push(`    mode: ${quote(imported.mode)},`);
    lines.push(`    decision: ${quote(imported.decision)},`);
    lines.push(`    sourceFile: ${quote(imported.sourceFile)},`);
    lines.push(`    sourceSha256: ${quote(imported.sourceSha256)},`);
    lines.push(`    literalReviewSizes: ${JSON.stringify(imported.literalReviewSizes)},`);
    lines.push('    shapes: [');
    for (const shape of imported.shapes) lines.push(`      ${emitShape(shape)},`);
    lines.push('    ],');
    lines.push('  },');
  }
  lines.push('] as const;');
  return `${lines.join('\n')}\n`;
}
