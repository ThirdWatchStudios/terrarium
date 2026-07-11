import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import svgpath from 'svgpath';
import { parseSync, type INode } from 'svgson';
import { optimize } from 'svgo';

import type { Facing, ShapeSpec } from '../../src/core/types';
import { FACINGS } from '../../src/core/types';
import { BODY_ARCHETYPES } from '../../src/parts/bodyArchetypes';
import type {
  ImportedBodyDetailOverlay,
  ImportedPartArt,
  ImportedPartSourceKind,
} from '../../src/parts/importedArt';
import type { PartImportTarget } from './catalog';
import { SENTINEL_TO_PALETTE_REF } from './sentinels';

const SUPPORTED_SLOTS = ['body', 'head', 'hair', 'outfit'] as const;
type SupportedSlot = (typeof SUPPORTED_SLOTS)[number];

const SLOT_SET = new Set<string>(SUPPORTED_SLOTS);
const FACING_SET = new Set<string>(FACINGS);
const CANVAS_SIZE = 128;
const PATH_PRECISION = 3;
const BOUNDS_EPSILON = 0.0001;
const LOCAL_PATH_TRANSFORM_EPSILON = 1e-12;
const SHIPPED_OUTLINE_MARGIN = 4;

/** Authored SVGs use a stable canvas origin; east placement offsets stay runtime-owned. */
export const PART_AUTHORING_ORIGINS: Readonly<Record<SupportedSlot, { x: number; y: number }>> = {
  body: { x: 64, y: 87 },
  head: { x: 64, y: 44 },
  hair: { x: 64, y: 44 },
  outfit: { x: 64, y: 87 },
};

interface Matrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

interface PaintState {
  fill?: string;
  stroke?: string;
  strokeWidth?: string;
  strokeLinecap?: string;
  strokeLinejoin?: string;
  fillRule?: string;
}

interface WalkState {
  matrix: Matrix;
  paint: PaintState;
  detail: boolean;
  ignored: boolean;
}

interface SourceDescriptor {
  absolutePath: string;
  relativePath: string;
  sourcePath: string;
  id: string;
  slot: SupportedSlot;
  facing: Facing;
}

interface MutableImportGroup {
  id: string;
  slot: SupportedSlot;
  files: Partial<Record<Facing, SourceDescriptor>>;
}

export interface CompilePartSvgContext {
  source: string;
  slot: SupportedSlot;
  /**
   * Keep canonical part-local path syntax after validating its canvas-space
   * geometry. Body promotion and explicit byte-stable static migration targets
   * use this to avoid normalization-only render and snapshot drift.
   */
  preserveLocalPaths?: boolean;
}

/**
 * Slot-independent strict SVG compilation seam used by other authored asset
 * families. Character parts continue to call {@link compilePartSvg}; wall kits
 * use a canvas-space origin without becoming a fake PartDef slot.
 */
export interface CompileAuthoredSvgContext {
  source: string;
  origin: { x: number; y: number };
  preserveLocalPaths?: boolean;
  canonicalTransformLabel?: string;
}

export interface CompilePartDirectoryOptions {
  inputDir: string;
  sourcePathPrefix: string;
  catalog: readonly PartImportTarget[];
  sourceKind?: ImportedPartSourceKind;
}

export class PartImportError extends Error {
  constructor(source: string, message: string) {
    super(`${source}: ${message}`);
    this.name = 'PartImportError';
  }
}

function fail(source: string, message: string): never {
  throw new PartImportError(source, message);
}

const IDENTITY_MATRIX: Matrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

function multiplyMatrix(left: Matrix, right: Matrix): Matrix {
  return {
    a: left.a * right.a + left.c * right.b,
    b: left.b * right.a + left.d * right.b,
    c: left.a * right.c + left.c * right.d,
    d: left.b * right.c + left.d * right.d,
    e: left.a * right.e + left.c * right.f + left.e,
    f: left.b * right.e + left.d * right.f + left.f,
  };
}

function translationMatrix(x: number, y: number): Matrix {
  return { a: 1, b: 0, c: 0, d: 1, e: x, f: y };
}

function rotationMatrix(degrees: number): Matrix {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 };
}

function parseFiniteNumbers(source: string, value: string): number[] {
  const trimmed = value.trim();
  if (!trimmed) fail(source, 'transform function has no arguments');
  const tokens = trimmed.split(/[\s,]+/);
  if (tokens.some((token) => token === '')) fail(source, `invalid transform arguments ${value}`);
  return tokens.map((token) => {
    const number = Number(token);
    if (!Number.isFinite(number)) fail(source, `non-finite transform argument ${token}`);
    return number;
  });
}

function parseTransform(source: string, value: string | undefined): Matrix {
  if (value === undefined) return IDENTITY_MATRIX;
  if (!value.trim()) fail(source, 'transform cannot be empty');

  const expression = /([A-Za-z]+)\s*\(([^()]*)\)/g;
  let cursor = 0;
  let matrix = IDENTITY_MATRIX;
  let match: RegExpExecArray | null;

  while ((match = expression.exec(value)) !== null) {
    if (!/^[\s,]*$/.test(value.slice(cursor, match.index))) {
      fail(source, `invalid transform syntax near ${value.slice(cursor, match.index).trim()}`);
    }
    cursor = expression.lastIndex;

    const name = match[1];
    const args = parseFiniteNumbers(source, match[2]);
    let next: Matrix;

    if (name === 'matrix' && args.length === 6) {
      next = { a: args[0], b: args[1], c: args[2], d: args[3], e: args[4], f: args[5] };
    } else if (name === 'translate' && (args.length === 1 || args.length === 2)) {
      next = translationMatrix(args[0], args[1] ?? 0);
    } else if (name === 'scale' && (args.length === 1 || args.length === 2)) {
      next = { a: args[0], b: 0, c: 0, d: args[1] ?? args[0], e: 0, f: 0 };
    } else if (name === 'rotate' && (args.length === 1 || args.length === 3)) {
      next = rotationMatrix(args[0]);
      if (args.length === 3) {
        next = multiplyMatrix(
          translationMatrix(args[1], args[2]),
          multiplyMatrix(next, translationMatrix(-args[1], -args[2])),
        );
      }
    } else if (name === 'skewX' && args.length === 1) {
      next = { a: 1, b: 0, c: Math.tan((args[0] * Math.PI) / 180), d: 1, e: 0, f: 0 };
    } else if (name === 'skewY' && args.length === 1) {
      next = { a: 1, b: Math.tan((args[0] * Math.PI) / 180), c: 0, d: 1, e: 0, f: 0 };
    } else {
      fail(source, `unsupported or malformed transform ${name}(${match[2]})`);
    }

    if (Object.values(next).some((number) => !Number.isFinite(number))) {
      fail(source, `transform ${name} produces non-finite coordinates`);
    }
    matrix = multiplyMatrix(matrix, next);
  }

  if (!/^[\s,]*$/.test(value.slice(cursor))) {
    fail(source, `invalid transform syntax near ${value.slice(cursor).trim()}`);
  }
  return matrix;
}

function strokeScale(source: string, matrix: Matrix): number {
  const xScale = Math.hypot(matrix.a, matrix.b);
  const yScale = Math.hypot(matrix.c, matrix.d);
  const dot = matrix.a * matrix.c + matrix.b * matrix.d;
  const scale = Math.max(xScale, yScale, 1);
  const tolerance = scale * 1e-7;

  if (xScale <= tolerance || yScale <= tolerance) {
    fail(source, 'stroked paths cannot use a singular transform');
  }
  if (Math.abs(xScale - yScale) > tolerance || Math.abs(dot) > scale * scale * 1e-7) {
    fail(source, 'stroked paths require a uniform scale with no skew');
  }
  return (xScale + yScale) / 2;
}

function localName(name: string): string {
  const colon = name.indexOf(':');
  return (colon >= 0 ? name.slice(colon + 1) : name).toLowerCase();
}

const PRESENTATION_ATTRIBUTES = new Set([
  'fill',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'fill-rule',
  'opacity',
  'display',
  'visibility',
]);

function parseStyle(source: string, style: string | undefined): Record<string, string> {
  if (style === undefined) return {};
  const declarations: Record<string, string> = {};
  for (const rawDeclaration of style.split(';')) {
    const declaration = rawDeclaration.trim();
    if (!declaration) continue;
    const separator = declaration.indexOf(':');
    if (separator <= 0 || declaration.slice(separator + 1).includes(':')) {
      fail(source, `malformed inline style declaration ${declaration}`);
    }
    const property = declaration.slice(0, separator).trim().toLowerCase();
    const value = declaration.slice(separator + 1).trim();
    if (!PRESENTATION_ATTRIBUTES.has(property)) {
      fail(source, `unsupported inline style property ${property}`);
    }
    if (!value || /!important/i.test(value)) {
      fail(source, `unsupported inline style value for ${property}`);
    }
    declarations[property] = value;
  }
  return declarations;
}

function attributesWithStyle(source: string, node: INode): Record<string, string> {
  return { ...node.attributes, ...parseStyle(source, node.attributes.style) };
}

function semanticRole(id: string | undefined): 'detail' | 'ignored' | undefined {
  if (!id) return undefined;
  if (/^detail(?:\/|$)/.test(id)) return 'detail';
  if (/^(?:guide|reference|swatches|anchors)(?:\/|$)/.test(id)) return 'ignored';
  return undefined;
}

function validateRoot(source: string, root: INode): void {
  if (root.type !== 'element' || localName(root.name) !== 'svg') {
    fail(source, 'document root must be <svg>');
  }
  const viewBox = root.attributes.viewBox ?? root.attributes.viewbox;
  if (!viewBox) fail(source, 'root must declare viewBox="0 0 128 128"');
  const values = viewBox.trim().split(/[\s,]+/).map(Number);
  if (
    values.length !== 4 ||
    values.some((value) => !Number.isFinite(value)) ||
    values[0] !== 0 ||
    values[1] !== 0 ||
    values[2] !== CANVAS_SIZE ||
    values[3] !== CANVAS_SIZE
  ) {
    fail(source, 'viewBox must be exactly 0 0 128 128');
  }
  for (const dimension of ['width', 'height'] as const) {
    const value = root.attributes[dimension];
    if (value !== undefined && value !== '128' && value !== '128px') {
      fail(source, `${dimension} must be 128 or 128px when present`);
    }
  }
}

function validateAttributes(
  source: string,
  node: INode,
  tag: 'svg' | 'g' | 'path',
  ignored: boolean,
): void {
  const common = new Set(['id', 'style', 'transform', ...PRESENTATION_ATTRIBUTES]);
  const allowed = tag === 'svg'
    ? new Set([...common, 'xmlns', 'viewBox', 'viewbox', 'width', 'height', 'version'])
    : tag === 'path'
      ? new Set([...common, 'd'])
      : common;

  for (const rawName of Object.keys(node.attributes)) {
    const name = rawName.toLowerCase();
    if (name.startsWith('on')) fail(source, `event attribute ${rawName} is forbidden`);
    if (name === 'href' || name.endsWith(':href')) fail(source, `${rawName} is forbidden`);
    if (name === 'class') fail(source, 'CSS classes are forbidden; use presentation attributes');
    if (name.startsWith('xmlns:') || name.includes(':')) continue;
    if (!allowed.has(rawName) && !allowed.has(name)) {
      fail(source, `unsupported <${tag}> attribute ${rawName}`);
    }
  }

  const attrs = attributesWithStyle(source, node);
  if (!ignored && (attrs.display !== undefined || attrs.visibility !== undefined)) {
    fail(source, 'display and visibility are allowed only on ignored reference/guide layers');
  }
  if (
    !ignored &&
    attrs['fill-rule'] !== undefined &&
    !['nonzero', 'evenodd'].includes(attrs['fill-rule'].toLowerCase())
  ) {
    fail(source, 'fill-rule declarations must be nonzero or evenodd');
  }
  if (!ignored && tag !== 'path' && attrs.opacity !== undefined) {
    const opacity = Number(attrs.opacity);
    if (!Number.isFinite(opacity) || opacity !== 1) {
      fail(source, 'group/root opacity cannot be represented by ShapeSpec');
    }
  }
  if (!ignored && attrs['stroke-linecap'] !== undefined && attrs['stroke-linecap'].toLowerCase() !== 'round') {
    fail(source, 'only round stroke linecaps are supported');
  }
  if (!ignored && attrs['stroke-linejoin'] !== undefined && attrs['stroke-linejoin'].toLowerCase() !== 'round') {
    fail(source, 'only round stroke linejoins are supported');
  }
  parseTransform(source, attrs.transform);
}

function validateTree(source: string, root: INode): void {
  const ids = new Set<string>();

  const visit = (node: INode, parentTag: string | undefined, inheritedIgnored: boolean): void => {
    if (node.type === 'text') {
      if (parentTag !== 'title' && parentTag !== 'desc' && node.value.trim()) {
        fail(source, 'rendered text nodes are forbidden');
      }
      return;
    }
    if (node.type !== 'element') return;

    const tag = localName(node.name);
    const id = node.attributes.id;
    if (id) {
      if (ids.has(id)) fail(source, `duplicate id ${id}`);
      ids.add(id);
    }

    if (tag === 'metadata') return;
    if (tag === 'title' || tag === 'desc') {
      for (const child of node.children) visit(child, tag, inheritedIgnored);
      return;
    }
    if (tag !== 'svg' && tag !== 'g' && tag !== 'path') {
      fail(source, `<${node.name}> is forbidden; convert visible art to paths`);
    }
    if (tag === 'svg' && parentTag !== undefined) fail(source, 'nested <svg> viewports are forbidden');

    const role = semanticRole(id);
    const ignored = inheritedIgnored || role === 'ignored';
    validateAttributes(source, node, tag, ignored);

    if (tag === 'path') {
      if (node.children.some((child) => child.type === 'element' || child.value.trim())) {
        fail(source, '<path> cannot contain child content');
      }
      return;
    }
    for (const child of node.children) visit(child, tag, ignored);
  };

  visit(root, undefined, false);
}

function parseValidatedSvg(source: string, input: string): INode {
  if (/<!DOCTYPE/i.test(input)) fail(source, 'DOCTYPE declarations are forbidden');
  let root: INode;
  try {
    root = parseSync(input);
  } catch (error) {
    fail(source, `invalid XML (${error instanceof Error ? error.message : String(error)})`);
  }
  validateRoot(source, root);
  validateTree(source, root);
  return root;
}

function optimizeSvg(source: string, input: string): INode {
  let data: string;
  try {
    data = optimize(input, {
      multipass: false,
      plugins: [
        'removeDoctype',
        'removeXMLProcInst',
        'removeComments',
        'removeMetadata',
        'convertStyleToAttrs',
      ],
    }).data;
  } catch (error) {
    fail(source, `SVGO could not clean the document (${error instanceof Error ? error.message : String(error)})`);
  }
  return parseValidatedSvg(source, data);
}

function inheritedPaint(parent: PaintState, attrs: Record<string, string>): PaintState {
  return {
    fill: attrs.fill ?? parent.fill,
    stroke: attrs.stroke ?? parent.stroke,
    strokeWidth: attrs['stroke-width'] ?? parent.strokeWidth,
    strokeLinecap: attrs['stroke-linecap'] ?? parent.strokeLinecap,
    strokeLinejoin: attrs['stroke-linejoin'] ?? parent.strokeLinejoin,
    fillRule: attrs['fill-rule'] ?? parent.fillRule,
  };
}

function normalizePaint(source: string, value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const normalized = value.trim().toUpperCase();
  if (normalized === 'NONE') return undefined;
  if (!/^#[0-9A-F]{6}(?:[0-9A-F]{2})?$/.test(normalized)) {
    fail(source, `paint ${value} must be none, #RRGGBB, or #RRGGBBAA`);
  }
  const token = SENTINEL_TO_PALETTE_REF.get(normalized);
  if (token) return token;
  if (normalized.length === 9 && SENTINEL_TO_PALETTE_REF.has(normalized.slice(0, 7))) {
    fail(source, `sentinel ${normalized.slice(0, 7)} must use path opacity, not an alpha suffix`);
  }
  if (normalized.length === 9 && normalized.endsWith('00')) {
    fail(source, `fully transparent paint ${value} is forbidden`);
  }
  return normalized;
}

function parsePositiveNumber(source: string, label: string, value: string | undefined): number {
  if (value === undefined || !/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?$/.test(value.trim())) {
    fail(source, `${label} must be an explicit unitless number`);
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) fail(source, `${label} must be greater than zero`);
  return number;
}

function parseOpacity(source: string, value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0 || number > 1) {
    fail(source, 'opacity must be greater than zero and at most one');
  }
  return number === 1 ? undefined : number;
}

function paletteRef(value: string | undefined): string | undefined {
  return value?.startsWith('$') ? value : undefined;
}

function validateTintPurity(source: string, fill: string | undefined, stroke: string | undefined): void {
  const fillToken = paletteRef(fill);
  const strokeToken = paletteRef(stroke);
  if ((fillToken && stroke && !strokeToken) || (strokeToken && fill && !fillToken)) {
    fail(source, 'a shape cannot mix a palette token with a literal paint');
  }
  if (fillToken && strokeToken && fillToken !== strokeToken) {
    fail(source, `a shape cannot mix palette tokens ${fillToken} and ${strokeToken}`);
  }
}

function pathError(value: ReturnType<typeof svgpath>): string | undefined {
  return (value as unknown as { err?: string }).err;
}

function roundNumber(value: number): number {
  const rounded = Number(value.toFixed(PATH_PRECISION));
  return Object.is(rounded, -0) ? 0 : rounded;
}

function flattenPath(source: string, d: string, matrix: Matrix): string {
  if (!d.trim()) fail(source, 'path d cannot be empty');
  const compiled = svgpath(d);
  const initialError = pathError(compiled);
  if (initialError) fail(source, `invalid path data (${initialError})`);
  compiled
    .matrix([matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f])
    .abs()
    .unshort()
    .unarc()
    .round(6);
  const error = pathError(compiled);
  if (error) fail(source, `could not flatten path (${error})`);
  const flattened = compiled.toString();
  if (!flattened || /(?:NaN|Infinity)/.test(flattened)) {
    fail(source, 'path produced no finite geometry');
  }
  return flattened;
}

function validateBounds(
  source: string,
  d: string,
  fill: string | undefined,
  stroke: string | undefined,
  strokeWidth: number | undefined,
  silhouette: boolean,
): void {
  const pathSvg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">',
    `<path d="${d.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"`,
    ` fill="${fill ? '#000000' : 'none'}"`,
    stroke ? ` stroke="#000000" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"` : '',
    '/></svg>',
  ].join('');

  let bounds: ReturnType<Resvg['getBBox']>;
  let hasPaintedPixel = false;
  try {
    const renderer = new Resvg(pathSvg, { font: { loadSystemFonts: false } });
    bounds = renderer.getBBox();
    const pixels = renderer.render().pixels;
    for (let offset = 3; offset < pixels.length; offset += 4) {
      if (pixels[offset] !== 0) {
        hasPaintedPixel = true;
        break;
      }
    }
  } catch (error) {
    fail(source, `renderer rejected flattened path (${error instanceof Error ? error.message : String(error)})`);
  }
  if (!bounds || !hasPaintedPixel) fail(source, 'path paints no pixels on the 128 canvas');
  const right = bounds.x + bounds.width;
  const bottom = bounds.y + bounds.height;
  const margin = silhouette ? SHIPPED_OUTLINE_MARGIN : 0;
  if (
    bounds.x < margin - BOUNDS_EPSILON ||
    bounds.y < margin - BOUNDS_EPSILON ||
    right > CANVAS_SIZE - margin + BOUNDS_EPSILON ||
    bottom > CANVAS_SIZE - margin + BOUNDS_EPSILON
  ) {
    fail(
      source,
      `painted bounds ${bounds.x},${bounds.y}..${right},${bottom} leave the 128 canvas${margin ? ` or its ${margin}-unit outline margin` : ''}`,
    );
  }
}

function compilePath(
  context: CompileAuthoredSvgContext,
  node: INode,
  state: WalkState,
): ShapeSpec {
  const attrs = attributesWithStyle(context.source, node);
  const paint = inheritedPaint(state.paint, attrs);
  const matrix = multiplyMatrix(state.matrix, parseTransform(context.source, attrs.transform));
  if (Math.abs(matrix.a * matrix.d - matrix.b * matrix.c) < 1e-12) {
    fail(context.source, 'paths cannot use a singular transform');
  }
  const fill = normalizePaint(context.source, paint.fill);
  const stroke = normalizePaint(context.source, paint.stroke);
  if (!fill && !stroke) fail(context.source, 'every path must resolve an explicit fill or stroke');
  if (fill && (paint.fillRule ?? 'nonzero').toLowerCase() !== 'nonzero') {
    fail(context.source, 'every filled path must resolve the nonzero fill rule');
  }
  validateTintPurity(context.source, fill, stroke);
  if (
    !state.detail &&
    ((fill !== undefined && !paletteRef(fill)) || (stroke !== undefined && !paletteRef(stroke)))
  ) {
    fail(context.source, 'literal paint is allowed only inside a detail or detail/* layer');
  }
  if (!state.detail && fill !== undefined && stroke !== undefined) {
    fail(context.source, 'silhouette paths cannot combine fill and stroke');
  }

  let strokeWidth: number | undefined;
  if (stroke) {
    if (paint.strokeLinecap?.toLowerCase() !== 'round' || paint.strokeLinejoin?.toLowerCase() !== 'round') {
      fail(context.source, 'stroked paths must explicitly use round linecaps and linejoins');
    }
    strokeWidth = parsePositiveNumber(context.source, 'stroke-width', paint.strokeWidth);
    strokeWidth = roundNumber(strokeWidth * strokeScale(context.source, matrix));
    if (strokeWidth <= 0) fail(context.source, 'transformed stroke-width rounds to zero');
  }

  const canvasPath = flattenPath(context.source, attrs.d ?? '', matrix);
  validateBounds(context.source, canvasPath, fill, stroke, strokeWidth, !state.detail);

  const origin = context.origin;
  let localPath: string;
  if (context.preserveLocalPaths) {
    const transformIsCanonicalTranslation =
      Math.abs(matrix.a - 1) <= LOCAL_PATH_TRANSFORM_EPSILON &&
      Math.abs(matrix.b) <= LOCAL_PATH_TRANSFORM_EPSILON &&
      Math.abs(matrix.c) <= LOCAL_PATH_TRANSFORM_EPSILON &&
      Math.abs(matrix.d - 1) <= LOCAL_PATH_TRANSFORM_EPSILON &&
      Math.abs(matrix.e - origin.x) <= LOCAL_PATH_TRANSFORM_EPSILON &&
      Math.abs(matrix.f - origin.y) <= LOCAL_PATH_TRANSFORM_EPSILON;
    if (!transformIsCanonicalTranslation) {
      fail(
        context.source,
        `byte-stable ${context.canonicalTransformLabel ?? 'authored'} art must keep paths directly under the canonical translate(${origin.x} ${origin.y}) group`,
      );
    }
    localPath = (attrs.d ?? '').trim();
  } else {
    localPath = svgpath(canvasPath)
      .translate(-origin.x, -origin.y)
      .round(PATH_PRECISION)
      .toString();
  }
  const opacity = parseOpacity(context.source, attrs.opacity);

  const shape: ShapeSpec = { d: localPath };
  if (fill) shape.fill = fill;
  if (stroke) {
    shape.stroke = stroke;
    shape.strokeWidth = strokeWidth;
  }
  if (opacity !== undefined) {
    const roundedOpacity = roundNumber(opacity);
    if (roundedOpacity <= 0) fail(context.source, 'opacity rounds to zero at importer precision');
    shape.opacity = roundedOpacity;
  }
  if (state.detail) shape.silhouette = false;
  return shape;
}

/** Compile one strict 128-space SVG into ShapeSpecs relative to an explicit origin. */
export function compileAuthoredSvg(input: string, context: CompileAuthoredSvgContext): ShapeSpec[] {
  parseValidatedSvg(context.source, input);
  const root = optimizeSvg(context.source, input);
  const shapes: ShapeSpec[] = [];

  const visit = (node: INode, parent: WalkState): void => {
    if (node.type !== 'element') return;
    const tag = localName(node.name);
    if (tag === 'title' || tag === 'desc' || tag === 'metadata') return;

    const attrs = attributesWithStyle(context.source, node);
    const role = semanticRole(attrs.id);
    const ignored = parent.ignored || role === 'ignored';
    if (ignored) return;

    const state: WalkState = {
      matrix: multiplyMatrix(parent.matrix, parseTransform(context.source, attrs.transform)),
      paint: inheritedPaint(parent.paint, attrs),
      detail: parent.detail || role === 'detail',
      ignored,
    };

    if (tag === 'path') {
      // compilePath consumes this node's attributes, so pass the unadvanced parent.
      shapes.push(compilePath(context, node, parent.detail || role === 'detail'
        ? { ...parent, detail: true }
        : parent));
      return;
    }
    for (const child of node.children) visit(child, state);
  };

  visit(root, {
    matrix: IDENTITY_MATRIX,
    paint: {},
    detail: false,
    ignored: false,
  });
  if (shapes.length === 0) fail(context.source, 'document contains no importable paths');
  paintBucketSequence(context.source, shapes);
  return shapes;
}

/** Compile one strict 128-space SVG into part-local ShapeSpecs. */
export function compilePartSvg(input: string, context: CompilePartSvgContext): ShapeSpec[] {
  return compileAuthoredSvg(input, {
    source: context.source,
    origin: PART_AUTHORING_ORIGINS[context.slot],
    preserveLocalPaths: context.preserveLocalPaths,
    canonicalTransformLabel: context.slot,
  });
}

function shapePaintBucket(shape: ShapeSpec): string {
  return paletteRef(shape.fill) ?? paletteRef(shape.stroke) ?? 'literal';
}

function paintBucketSequence(source: string, shapes: readonly ShapeSpec[]): string[] {
  const closedBuckets = new Set<string>();
  const sequence: string[] = [];
  let current: string | undefined;
  for (const shape of shapes) {
    const bucket = shapePaintBucket(shape);
    if (bucket === current) continue;
    if (current !== undefined) closedBuckets.add(current);
    if (closedBuckets.has(bucket)) {
      fail(source, `paint bucket ${bucket} reappears non-contiguously and would change layer order`);
    }
    sequence.push(bucket);
    current = bucket;
  }
  return sequence;
}

function validateFacingPaintOrder(
  source: string,
  facings: Partial<Record<Facing, readonly ShapeSpec[]>>,
): void {
  const globalOrder: string[] = [];
  for (const facing of FACINGS) {
    const shapes = facings[facing];
    if (!shapes) continue;
    const sequence = paintBucketSequence(`${source}/${facing}`, shapes);
    for (const bucket of sequence) {
      if (!globalOrder.includes(bucket)) globalOrder.push(bucket);
    }
    let previousIndex = -1;
    for (const bucket of sequence) {
      const index = globalOrder.indexOf(bucket);
      if (index < previousIndex) {
        fail(
          source,
          `${facing} paint order (${sequence.join(' -> ')}) conflicts with layer order ${globalOrder.join(' -> ')}`,
        );
      }
      previousIndex = index;
    }
  }
}

function normalizeRepositoryPath(source: string, value: string): string {
  const normalized = value.replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/$/, '');
  if (!normalized || path.posix.isAbsolute(normalized) || normalized === '..' || normalized.startsWith('../')) {
    fail(source, 'sourcePathPrefix must be a repository-relative path');
  }
  return normalized;
}

async function listSvgFiles(inputDir: string): Promise<string[]> {
  const files: string[] = [];
  const visit = async (directory: string): Promise<void> => {
    const entries = (await readdir(directory, { withFileTypes: true }))
      .sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.svg')) {
        if (!entry.name.endsWith('.svg')) fail(absolute, 'SVG filenames must use the lowercase .svg extension');
        files.push(absolute);
      }
    }
  };
  await visit(inputDir);
  return files;
}

function sourceDescriptor(
  inputDir: string,
  sourcePathPrefix: string,
  absolutePath: string,
): SourceDescriptor {
  const relativePath = path.relative(inputDir, absolutePath).replaceAll(path.sep, '/');
  const segments = relativePath.split('/');
  if (segments.length !== 2) {
    fail(relativePath, 'expected <slot>/<slug>.<facing>.svg');
  }
  const [slotValue, filename] = segments;
  if (!SLOT_SET.has(slotValue)) {
    fail(relativePath, `slot must be one of ${SUPPORTED_SLOTS.join(', ')}`);
  }
  const match = /^([a-z0-9]+(?:-[a-z0-9]+)*)\.(south|east|north|west)\.svg$/.exec(filename);
  if (!match) fail(relativePath, 'expected lowercase <slug>.<south|east|north>.svg');
  const slot = slotValue as SupportedSlot;
  const slug = match[1];
  if (!FACING_SET.has(match[2])) fail(relativePath, 'west is runtime-mirrored and cannot be authored');
  const facing = match[2] as Facing;
  if (slug.startsWith(`${slot}-`)) {
    fail(relativePath, `slug must omit the ${slot}- id prefix`);
  }
  return {
    absolutePath,
    relativePath,
    sourcePath: `${sourcePathPrefix}/${relativePath}`,
    id: `${slot}-${slug}`,
    slot,
    facing,
  };
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function validateCatalog(catalog: readonly PartImportTarget[]): Map<string, PartImportTarget> {
  const targets = new Map<string, PartImportTarget>();
  for (const part of catalog) {
    if (targets.has(part.id)) fail('PART_LIBRARY', `duplicate production id ${part.id}`);
    targets.set(part.id, part);
  }
  return targets;
}

function validateTarget(group: MutableImportGroup, target: PartImportTarget | undefined): PartImportTarget {
  if (!target) fail(group.id, 'importer v1 only replaces an existing selectable production part');
  if (target.slot !== group.slot) fail(group.id, `target slot is ${target.slot}, not ${group.slot}`);
  const mode = target.importMode ?? 'static';
  if (
    target.preserveLocalPaths &&
    (mode !== 'static' || (target.slot !== 'head' && target.slot !== 'hair'))
  ) {
    fail(group.id, 'preserveLocalPaths is supported only for static head/hair targets');
  }
  if (mode === 'body-art') {
    if (
      target.slot !== 'body' ||
      target.anchor !== 'body' ||
      target.buildVariant ||
      !target.bodyAnchors
    ) {
      fail(group.id, 'body-art targets must be body-anchored rigged static parts');
    }
  } else if (mode === 'anchored-detail') {
    if (target.slot !== 'outfit' || target.anchor !== 'body' || !target.buildVariant) {
      fail(group.id, 'anchored-detail targets must be body-anchored dynamic outfits');
    }
    if (!target.referenceBodyId || !target.placementAnchor) {
      fail(group.id, 'anchored-detail targets require a reference body and placement anchor');
    }
  } else {
    if (target.buildVariant) fail(group.id, 'body-aware buildVariant art needs an anchored-detail adapter');
    const expectedAnchor = 'headCenter';
    if (target.anchor !== expectedAnchor) {
      fail(group.id, `target anchor ${target.anchor} is not supported for ${group.slot} imports`);
    }
  }

  const expectedFacings = FACINGS.filter((facing) => target.facings[facing] !== undefined);
  const importedFacings = FACINGS.filter((facing) => group.files[facing] !== undefined);
  if (expectedFacings.join(',') !== importedFacings.join(',')) {
    fail(
      group.id,
      `must import the complete facing set (${expectedFacings.join(', ')}); received ${importedFacings.join(', ') || 'none'}`,
    );
  }
  return target;
}

function expandAnchoredDetailVariants(
  source: string,
  target: PartImportTarget,
  facings: Partial<Record<Facing, readonly ShapeSpec[]>>,
): ImportedBodyDetailOverlay['bodyVariants'] {
  const reference = BODY_ARCHETYPES.find(({ id }) => id === target.referenceBodyId);
  if (!reference || !target.placementAnchor) {
    fail(source, 'anchored-detail target has no valid reference body or placement anchor');
  }
  for (const facing of FACINGS) {
    const shapes = facings[facing];
    if (shapes?.some((shape) => shape.silhouette !== false)) {
      fail(source, `anchored-detail ${facing} art must contain detail/* shapes only`);
    }
  }

  const bodyVariants: Record<string, Partial<Record<Facing, ShapeSpec[]>>> = {};
  for (const archetype of BODY_ARCHETYPES) {
    const variants: Partial<Record<Facing, ShapeSpec[]>> = {};
    for (const facing of FACINGS) {
      const shapes = facings[facing];
      if (!shapes) continue;
      const referencePoint = reference.anchors[facing][target.placementAnchor];
      const targetPoint = archetype.anchors[facing][target.placementAnchor];
      const dx = targetPoint.x - referencePoint.x;
      const dy = targetPoint.y - referencePoint.y;
      variants[facing] = shapes.map((shape, index) => {
        const translated = {
          ...shape,
          d: svgpath(shape.d).translate(dx, dy).round(PATH_PRECISION).toString(),
        };
        const origin = PART_AUTHORING_ORIGINS.outfit;
        const canvasPath = svgpath(translated.d)
          .translate(origin.x, origin.y)
          .round(PATH_PRECISION)
          .toString();
        validateBounds(
          `${source}/${archetype.id}/${facing}/shape-${index + 1}`,
          canvasPath,
          translated.fill,
          translated.stroke,
          translated.strokeWidth,
          translated.silhouette !== false,
        );
        return translated;
      });
    }
    bodyVariants[archetype.id] = variants;
  }
  return bodyVariants;
}

/** Compile a source tree atomically in memory. No output is written on failure. */
export async function compilePartDirectory(
  options: CompilePartDirectoryOptions,
): Promise<ImportedPartArt[]> {
  const sourcePathPrefix = normalizeRepositoryPath('part importer', options.sourcePathPrefix);
  const targets = validateCatalog(options.catalog);
  const groups = new Map<string, MutableImportGroup>();
  const descriptors = (await listSvgFiles(options.inputDir))
    .map((file) => sourceDescriptor(options.inputDir, sourcePathPrefix, file));

  for (const descriptor of descriptors) {
    let group = groups.get(descriptor.id);
    if (!group) {
      group = { id: descriptor.id, slot: descriptor.slot, files: {} };
      groups.set(descriptor.id, group);
    }
    if (group.slot !== descriptor.slot) fail(descriptor.relativePath, `id ${descriptor.id} crosses slots`);
    if (group.files[descriptor.facing]) {
      fail(descriptor.relativePath, `duplicate ${descriptor.id}/${descriptor.facing} source`);
    }
    group.files[descriptor.facing] = descriptor;
  }

  const imports: ImportedPartArt[] = [];
  for (const group of [...groups.values()].sort((left, right) => compareText(left.id, right.id))) {
    const target = validateTarget(group, targets.get(group.id));
    const facings: Partial<Record<Facing, ShapeSpec[]>> = {};
    for (const facing of FACINGS) {
      const descriptor = group.files[facing];
      if (!descriptor) continue;
      const input = await readFile(descriptor.absolutePath, 'utf8');
      facings[facing] = compilePartSvg(input, {
        source: descriptor.sourcePath,
        slot: descriptor.slot,
        preserveLocalPaths: target.importMode === 'body-art' || target.preserveLocalPaths === true,
      });
    }
    validateFacingPaintOrder(group.id, facings);
    if (target.importMode === 'body-art') {
      for (const facing of FACINGS) {
        const shapes = facings[facing];
        if (!shapes?.some((shape) => shape.silhouette !== false)) {
          fail(group.id, `body-art ${facing} must contain silhouette geometry`);
        }
      }
    }
    const provenance = {
      sourceKind: options.sourceKind ?? 'authored' as const,
      sourceFiles: FACINGS
        .map((facing) => group.files[facing]?.sourcePath)
        .filter((source): source is string => source !== undefined)
        .sort(),
    };
    if (target.importMode === 'body-art') {
      imports.push({
        kind: 'body-art',
        id: group.id,
        slot: 'body',
        facings,
        ...provenance,
      });
    } else if (target.importMode === 'anchored-detail') {
      imports.push({
        kind: 'body-detail',
        id: group.id,
        slot: group.slot,
        bodyVariants: expandAnchoredDetailVariants(group.id, target, facings),
        ...provenance,
      });
    } else {
      imports.push({
        id: group.id,
        slot: group.slot,
        facings,
        ...provenance,
      });
    }
  }
  return imports;
}

function quote(value: string): string {
  return JSON.stringify(value);
}

function emitShape(shape: ShapeSpec): string {
  const properties = [`d: ${quote(shape.d)}`];
  if (shape.fill !== undefined) properties.push(`fill: ${quote(shape.fill)}`);
  if (shape.stroke !== undefined) properties.push(`stroke: ${quote(shape.stroke)}`);
  if (shape.strokeWidth !== undefined) properties.push(`strokeWidth: ${shape.strokeWidth}`);
  if (shape.opacity !== undefined) properties.push(`opacity: ${shape.opacity}`);
  if (shape.silhouette !== undefined) properties.push(`silhouette: ${shape.silhouette}`);
  return `{ ${properties.join(', ')} }`;
}

/** Deterministic generated module: no timestamps, absolute paths, or traversal order. */
export function emitImportedPartArt(imports: readonly ImportedPartArt[]): string {
  const lines = [
    "import type { ImportedPartOverlay, ImportedPartProvenance } from '../importedArt';",
    '',
    '// Generated by `npm run parts:import`. Do not edit by hand.',
  ];
  if (imports.length === 0) {
    lines.push('export const IMPORTED_PART_ART = [] as const satisfies readonly ImportedPartOverlay[];');
    lines.push('export const IMPORTED_PART_PROVENANCE = [] as const satisfies readonly ImportedPartProvenance[];');
    return `${lines.join('\n')}\n`;
  }

  lines.push('export const IMPORTED_PART_ART = [');
  for (const imported of imports) {
    lines.push('  {');
    if (imported.kind === 'body-detail') {
      lines.push('    kind: "body-detail",');
      lines.push(`    id: ${quote(imported.id)},`);
      lines.push(`    slot: ${quote(imported.slot)},`);
      lines.push('    bodyVariants: {');
      for (const archetype of BODY_ARCHETYPES) {
        const variants = imported.bodyVariants[archetype.id];
        if (!variants) continue;
        lines.push(`      ${quote(archetype.id)}: {`);
        for (const facing of FACINGS) {
          const shapes = variants[facing];
          if (!shapes) continue;
          lines.push(`        ${facing}: [`);
          for (const shape of shapes) lines.push(`          ${emitShape(shape)},`);
          lines.push('        ],');
        }
        lines.push('      },');
      }
      lines.push('    },');
      lines.push('  },');
      continue;
    }
    if (imported.kind === 'body-art') lines.push('    kind: "body-art",');
    lines.push(`    id: ${quote(imported.id)},`);
    lines.push(`    slot: ${quote(imported.slot)},`);
    lines.push('    facings: {');
    for (const facing of FACINGS) {
      const shapes = imported.facings[facing];
      if (!shapes) continue;
      lines.push(`      ${facing}: [`);
      for (const shape of shapes) lines.push(`        ${emitShape(shape)},`);
      lines.push('      ],');
    }
    lines.push('    },');
    lines.push('  },');
  }
  lines.push('] as const satisfies readonly ImportedPartOverlay[];');
  lines.push('');
  lines.push('// Build-time audit data; the browser imports only IMPORTED_PART_ART.');
  lines.push('export const IMPORTED_PART_PROVENANCE = [');
  for (const imported of imports) {
    lines.push('  {');
    lines.push(`    id: ${quote(imported.id)},`);
    lines.push(`    sourceKind: ${quote(imported.sourceKind)},`);
    lines.push('    sourceFiles: [');
    for (const sourceFile of [...imported.sourceFiles].sort()) {
      lines.push(`      ${quote(sourceFile)},`);
    }
    lines.push('    ],');
    lines.push('  },');
  }
  lines.push('] as const satisfies readonly ImportedPartProvenance[];');
  return `${lines.join('\n')}\n`;
}
