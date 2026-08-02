import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import svgpath from 'svgpath';
import { parseSync, type INode } from 'svgson';

import type {
  Projection,
  PropPalette,
  PropPaletteToken,
  ShapeSpec,
} from '../../src/core/types';
import { compileAuthoredSvg, PartImportError } from '../parts/importer';

const CANVAS = 128;
const CENTER = 64;
const GROUND = 116;
const TOKENS = new Set<PropPaletteToken>(['primary', 'secondary', 'accent']);
const PRESENTATION_ATTRIBUTES = new Set([
  'fill',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'fill-rule',
  'opacity',
  'style',
  'transform',
]);
const VISIBLE_TAGS = new Set(['path', 'rect', 'ellipse', 'circle']);

export const QUOTA_CO_INTERIOR_WORKHORSE_PROP_IDS = [
  'printer',
  'printer-jammed',
  'coffee-machine',
  'coffee-machine-broken',
  'water-cooler',
  'water-cooler-empty',
  'shredder',
  'microwave',
  'fridge',
  'vending-machine',
  'desk',
  'office-chair',
  'filing-cabinet',
  'copier',
  'office-plant',
  'standing-desk',
  'cubicle-workstation',
  'reception-desk',
  'conference-table',
  'supply-cabinet',
  'desk-lamp',
  'desk-clutter',
  'couch',
  'waiting-bench',
  'coffee-table',
  'break-table',
  'lounge-seating',
  'bean-bag',
  'nap-pod',
  'bookshelf',
  'lockers',
  'open-shelving',
  'pantry-shelf',
  'mail-station',
  'server-rack',
  'coat-rack',
  'potted-tree',
  'hanging-plant',
  'floor-lamp',
  'framed-art',
  'poster',
  'wall-clock',
  'fish-tank',
  'string-lights',
  'rug',
] as const;

export const QUOTA_CO_EXTERIOR_WORKHORSE_PROP_IDS = [
  'car',
  'lot-marking-crosswalk',
  'lamp-post',
  'sign-lot',
  'bike-rack',
  'park-bench',
  'picnic-table',
  'tree-canopy',
] as const;

export const QUOTA_CO_WORKHORSE_PROP_IDS = [
  ...QUOTA_CO_INTERIOR_WORKHORSE_PROP_IDS,
  ...QUOTA_CO_EXTERIOR_WORKHORSE_PROP_IDS,
] as const;

export type QuotaCoExteriorWorkhorsePropId =
  (typeof QUOTA_CO_EXTERIOR_WORKHORSE_PROP_IDS)[number];
export type QuotaCoWorkhorsePropId = (typeof QUOTA_CO_WORKHORSE_PROP_IDS)[number];

export interface ImportedPropArt {
  id: QuotaCoWorkhorsePropId;
  projection: Projection;
  sourceFile: string;
  sourceSha256: string;
  paletteDefaults: PropPalette;
  variants: Readonly<Record<string, readonly ShapeSpec[]>>;
}

interface SourceElement {
  id: string;
  groupId: string;
  fillToken?: PropPaletteToken;
  silhouette?: boolean;
  shape: ShapeSpec;
}

interface SourceDocument {
  id: string;
  projection: Projection;
  normalizedSvg: string;
  elements: Array<{
    id: string;
    groupId: string;
    fillToken?: PropPaletteToken;
    silhouette?: boolean;
  }>;
}

interface ManifestEntry {
  id: string;
  file: string;
  projection: Projection;
  paletteDefaults: PropPalette;
}

export interface StaticPropSourceDefinition {
  id: string;
  projection: Projection;
  paletteDefaults: PropPalette;
}

const MANIFEST: readonly ManifestEntry[] = [
  {
    id: 'printer',
    file: 'printer.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'printer-jammed',
    file: 'printer-jammed.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'coffee-machine',
    file: 'coffee-machine.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'coffee-machine-broken',
    file: 'coffee-machine-broken.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'water-cooler',
    file: 'water-cooler.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'water-cooler-empty',
    file: 'water-cooler-empty.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'shredder',
    file: 'shredder.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'microwave',
    file: 'microwave.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'fridge',
    file: 'fridge.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'vending-machine',
    file: 'vending-machine.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'desk',
    file: 'desk.svg',
    projection: 'plan',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'office-chair',
    file: 'office-chair.svg',
    projection: 'plan',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'filing-cabinet',
    file: 'filing-cabinet.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#DED5BD', secondary: '#49685A', accent: '#B65F4D' },
  },
  {
    id: 'copier',
    file: 'copier.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#DED5BD', secondary: '#49685A', accent: '#B65F4D' },
  },
  {
    id: 'office-plant',
    file: 'office-plant.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#527A45', secondary: '#355B34', accent: '#B65F4D' },
  },
  {
    id: 'standing-desk',
    file: 'standing-desk.svg',
    projection: 'plan',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'cubicle-workstation',
    file: 'cubicle-workstation.svg',
    projection: 'plan',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'reception-desk',
    file: 'reception-desk.svg',
    projection: 'plan',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'conference-table',
    file: 'conference-table.svg',
    projection: 'plan',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'supply-cabinet',
    file: 'supply-cabinet.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#DED5BD', secondary: '#49685A', accent: '#B65F4D' },
  },
  {
    id: 'desk-lamp',
    file: 'desk-lamp.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'desk-clutter',
    file: 'desk-clutter.svg',
    projection: 'plan',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'couch',
    file: 'couch.svg',
    projection: 'plan',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'waiting-bench',
    file: 'waiting-bench.svg',
    projection: 'plan',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'coffee-table',
    file: 'coffee-table.svg',
    projection: 'plan',
    paletteDefaults: { primary: '#DED5BD', secondary: '#49685A', accent: '#B65F4D' },
  },
  {
    id: 'break-table',
    file: 'break-table.svg',
    projection: 'plan',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'lounge-seating',
    file: 'lounge-seating.svg',
    projection: 'plan',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'bean-bag',
    file: 'bean-bag.svg',
    projection: 'plan',
    paletteDefaults: { primary: '#355247', secondary: '#18211E', accent: '#B65F4D' },
  },
  {
    id: 'nap-pod',
    file: 'nap-pod.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'bookshelf',
    file: 'bookshelf.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'lockers',
    file: 'lockers.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'open-shelving',
    file: 'open-shelving.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'pantry-shelf',
    file: 'pantry-shelf.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'mail-station',
    file: 'mail-station.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'server-rack',
    file: 'server-rack.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#262B29', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'coat-rack',
    file: 'coat-rack.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'potted-tree',
    file: 'potted-tree.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#3F7250', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'hanging-plant',
    file: 'hanging-plant.svg',
    projection: 'plan',
    paletteDefaults: { primary: '#3F7250', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'floor-lamp',
    file: 'floor-lamp.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'framed-art',
    file: 'framed-art.svg',
    projection: 'plan',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'poster',
    file: 'poster.svg',
    projection: 'plan',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'wall-clock',
    file: 'wall-clock.svg',
    projection: 'plan',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'fish-tank',
    file: 'fish-tank.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'string-lights',
    file: 'string-lights.svg',
    projection: 'plan',
    paletteDefaults: { primary: '#DED5BD', secondary: '#262B29', accent: '#B65F4D' },
  },
  {
    id: 'rug',
    file: 'rug.svg',
    projection: 'plan',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'car',
    file: 'car.svg',
    projection: 'plan',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'lot-marking-crosswalk',
    file: 'lot-marking-crosswalk.svg',
    projection: 'plan',
    paletteDefaults: { primary: '#F3EEDA', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'lamp-post',
    file: 'lamp-post.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'sign-lot',
    file: 'sign-lot.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'bike-rack',
    file: 'bike-rack.svg',
    projection: 'plan',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'park-bench',
    file: 'park-bench.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'picnic-table',
    file: 'picnic-table.svg',
    projection: 'plan',
    paletteDefaults: { primary: '#DED5BD', secondary: '#355247', accent: '#B65F4D' },
  },
  {
    id: 'tree-canopy',
    file: 'tree-canopy.svg',
    projection: 'elevation',
    paletteDefaults: { primary: '#527A45', secondary: '#355B34', accent: '#6D8D57' },
  },
] as const;

function fail(source: string, message: string): never {
  throw new PartImportError(source, message);
}

function localName(name: string): string {
  const colon = name.indexOf(':');
  return (colon >= 0 ? name.slice(colon + 1) : name).toLowerCase();
}

function finiteNumber(source: string, label: string, value: string | undefined): number {
  if (value === undefined || value.trim() === '') fail(source, `${label} is required`);
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) fail(source, `${label} must be a finite number`);
  return parsed;
}

function positiveNumber(source: string, label: string, value: string | undefined): number {
  const parsed = finiteNumber(source, label, value);
  if (parsed <= 0) fail(source, `${label} must be greater than zero`);
  return parsed;
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function roundedRectPath(
  source: string,
  attrs: Record<string, string>,
): string {
  const x = finiteNumber(source, 'rect x', attrs.x ?? '0');
  const y = finiteNumber(source, 'rect y', attrs.y ?? '0');
  const width = positiveNumber(source, 'rect width', attrs.width);
  const height = positiveNumber(source, 'rect height', attrs.height);
  let rx = attrs.rx === undefined ? 0 : finiteNumber(source, 'rect rx', attrs.rx);
  let ry = attrs.ry === undefined ? rx : finiteNumber(source, 'rect ry', attrs.ry);
  if (rx < 0 || ry < 0) fail(source, 'rect radii cannot be negative');
  rx = Math.min(rx, width / 2);
  ry = Math.min(ry, height / 2);
  if (rx === 0 || ry === 0) return `M${x} ${y}H${x + width}V${y + height}H${x}Z`;
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
  attrs: Record<string, string>,
  circle: boolean,
): string {
  const cx = finiteNumber(source, `${circle ? 'circle' : 'ellipse'} cx`, attrs.cx ?? '0');
  const cy = finiteNumber(source, `${circle ? 'circle' : 'ellipse'} cy`, attrs.cy ?? '0');
  const rx = positiveNumber(source, `${circle ? 'circle' : 'ellipse'} radius`, circle ? attrs.r : attrs.rx);
  const ry = circle ? rx : positiveNumber(source, 'ellipse ry', attrs.ry);
  return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;
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

function serializePresentationAttributes(node: INode): string {
  const attributes: string[] = [];
  for (const [name, value] of Object.entries(node.attributes)) {
    if (!PRESENTATION_ATTRIBUTES.has(name)) continue;
    attributes.push(`${name}="${escapeAttribute(value)}"`);
  }
  return attributes.length ? ` ${attributes.join(' ')}` : '';
}

function parseSourceDocument(
  source: string,
  input: string,
  expected: StaticPropSourceDefinition,
): SourceDocument {
  if (/<!DOCTYPE/i.test(input)) fail(source, 'DOCTYPE declarations are forbidden');
  let root: INode;
  try {
    root = parseSync(input);
  } catch (error) {
    fail(source, `invalid XML (${error instanceof Error ? error.message : String(error)})`);
  }
  if (root.type !== 'element' || localName(root.name) !== 'svg') {
    fail(source, 'document root must be <svg>');
  }
  const viewBox = (root.attributes.viewBox ?? root.attributes.viewbox ?? '')
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  if (
    viewBox.length !== 4
    || viewBox.some((value) => !Number.isFinite(value))
    || viewBox[0] !== 0
    || viewBox[1] !== 0
    || viewBox[2] !== CANVAS
    || viewBox[3] !== CANVAS
  ) {
    fail(source, 'viewBox must be exactly 0 0 128 128');
  }
  for (const dimension of ['width', 'height'] as const) {
    const value = root.attributes[dimension];
    if (value !== '128' && value !== '128px') {
      fail(source, `${dimension} must be 128 or 128px`);
    }
  }
  for (const name of Object.keys(root.attributes)) {
    const normalizedName = name.toLowerCase();
    if (normalizedName.startsWith('on')) fail(source, `event attribute ${name} is forbidden`);
    if (normalizedName === 'href' || normalizedName.endsWith(':href')) {
      fail(source, `${name} is forbidden`);
    }
  }
  if (root.attributes['data-prop-id'] !== expected.id) {
    fail(source, `data-prop-id must be ${expected.id}`);
  }
  if (root.attributes['data-projection'] !== expected.projection) {
    fail(source, `data-projection must be ${expected.projection}`);
  }

  const title = root.children.find(
    (child) => child.type === 'element' && localName(child.name) === 'title',
  );
  const description = root.children.find(
    (child) => child.type === 'element' && localName(child.name) === 'desc',
  );
  if (!title || !description) fail(source, 'source requires both <title> and <desc>');

  const ids = new Set<string>();
  const elements: SourceDocument['elements'] = [];
  const normalized: string[] = [];

  const visit = (
    node: INode,
    groupId: string | undefined,
    ignored: boolean,
    inheritedSilhouette: boolean | undefined,
  ): void => {
    if (node.type === 'text') {
      if (node.value.trim()) fail(source, 'rendered text outside title/desc is forbidden');
      return;
    }
    if (node.type !== 'element') return;
    const tag = localName(node.name);
    if (tag === 'title' || tag === 'desc' || tag === 'metadata') return;

    for (const name of Object.keys(node.attributes)) {
      const normalizedName = name.toLowerCase();
      if (normalizedName.startsWith('on')) fail(source, `event attribute ${name} is forbidden`);
      if (normalizedName === 'href' || normalizedName.endsWith(':href')) {
        fail(source, `${name} is forbidden`);
      }
    }

    const id = node.attributes.id;
    if (id) {
      if (ids.has(id)) fail(source, `duplicate id ${id}`);
      ids.add(id);
    }

    if (tag === 'g') {
      if (!id) fail(source, 'every editor group requires an id');
      const skip = ignored;
      if (skip) return;
      const rawSilhouette = node.attributes['data-silhouette'];
      if (rawSilhouette !== undefined && rawSilhouette !== 'true' && rawSilhouette !== 'false') {
        fail(source, `data-silhouette on ${id} must be true or false`);
      }
      const silhouette = rawSilhouette === undefined
        ? inheritedSilhouette
        : rawSilhouette === 'true';
      normalized.push(`<g id="${escapeAttribute(id)}"${serializePresentationAttributes(node)}>`);
      for (const child of node.children) visit(child, id, false, silhouette);
      normalized.push('</g>');
      return;
    }
    if (!VISIBLE_TAGS.has(tag)) {
      fail(source, `<${node.name}> is forbidden; use groups, paths, rects, ellipses, or circles`);
    }
    if (ignored) return;
    if (!groupId) fail(source, `visible element ${id ?? '(unnamed)'} must be inside a semantic group`);
    if (!id) fail(source, 'every visible source element requires an id');

    const rawToken = node.attributes['data-fill-token'];
    let fillToken: PropPaletteToken | undefined;
    if (rawToken !== undefined) {
      if (!TOKENS.has(rawToken as PropPaletteToken)) {
        fail(source, `data-fill-token on ${id} must be primary, secondary, or accent`);
      }
      fillToken = rawToken as PropPaletteToken;
      const sourceFill = node.attributes.fill?.toUpperCase();
      const expectedFill = expected.paletteDefaults[fillToken].toUpperCase();
      if (sourceFill !== expectedFill) {
        fail(
          source,
          `${id} source fill ${sourceFill ?? '(inherited)'} must match ${fillToken} default ${expectedFill}`,
        );
      }
    }

    const d = pathForNode(source, node);
    const attributes = serializePresentationAttributes(node);
    const hasLinecap = node.attributes['stroke-linecap'] !== undefined;
    const hasLinejoin = node.attributes['stroke-linejoin'] !== undefined;
    const strokeDefaults = [
      hasLinecap ? '' : ' stroke-linecap="round"',
      hasLinejoin ? '' : ' stroke-linejoin="round"',
    ].join('');
    normalized.push(
      `<path id="${escapeAttribute(id)}" d="${escapeAttribute(d)}"${attributes}${strokeDefaults}/>`
    );
    const rawSilhouette = node.attributes['data-silhouette'];
    if (rawSilhouette !== undefined && rawSilhouette !== 'true' && rawSilhouette !== 'false') {
      fail(source, `data-silhouette on ${id} must be true or false`);
    }
    const silhouette = rawSilhouette === undefined
      ? inheritedSilhouette
      : rawSilhouette === 'true';
    elements.push({ id, groupId, fillToken, silhouette });
  };

  for (const child of root.children) visit(child, undefined, false, undefined);
  if (elements.length === 0) fail(source, 'source contains no production elements');

  return {
    id: expected.id,
    projection: expected.projection,
    normalizedSvg:
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">`
      + `<g id="detail">${normalized.join('')}</g></svg>`,
    elements,
  };
}

function compileElements(
  source: string,
  input: string,
  manifest: StaticPropSourceDefinition,
): SourceElement[] {
  const document = parseSourceDocument(source, input, manifest);
  const shapes = compileAuthoredSvg(document.normalizedSvg, {
    source,
    origin: { x: 0, y: 0 },
  });
  if (shapes.length !== document.elements.length) {
    fail(
      source,
      `metadata count ${document.elements.length} does not match compiled shape count ${shapes.length}`,
    );
  }
  return shapes.flatMap((compiled, index) => {
    const metadata = document.elements[index];
    const shape: ShapeSpec = { ...compiled };
    if (metadata.fillToken) shape.fill = `$${metadata.fillToken}`;

    // Canonical SVG strokes are production art. Keep them as literal shapes
    // beside tokenized fills so the default compositor remains source-faithful
    // and the runtime tint atlas never mixes a palette token with literal ink.
    if (shape.fill && shape.stroke) {
      const stroke: ShapeSpec = {
        d: shape.d,
        stroke: shape.stroke,
        strokeWidth: shape.strokeWidth,
        strokeLinecap: shape.strokeLinecap,
        strokeLinejoin: shape.strokeLinejoin,
        opacity: shape.opacity,
        silhouette: false,
      };
      delete shape.stroke;
      delete shape.strokeWidth;
      shape.silhouette = metadata.silhouette ?? true;
      return [
        { ...metadata, shape },
        { ...metadata, shape: stroke },
      ];
    }
    shape.silhouette = metadata.silhouette ?? Boolean(shape.fill);
    return [{ ...metadata, shape }];
  });
}

/**
 * Compile one source-faithful, non-parametric prop SVG through the same strict
 * authored-art seam as the workhorse catalog. Department machines use this to
 * keep each accepted fill/queue state as an explicit baked variant.
 */
export function compileStaticPropSource(
  source: string,
  input: string,
  definition: StaticPropSourceDefinition,
): ShapeSpec[] {
  return compileElements(source, input, definition).map(({ shape }) => ({ ...shape }));
}

function transformed(
  element: SourceElement,
  scaleX: number,
  scaleY: number,
  cx: number,
  cy: number,
): SourceElement {
  const shape: ShapeSpec = {
    ...element.shape,
    d: svgpath(element.shape.d)
      .translate(-cx, -cy)
      .scale(scaleX, scaleY)
      .translate(cx, cy)
      .round(3)
      .toString(),
  };
  if (shape.strokeWidth !== undefined && Math.abs(scaleX - scaleY) < 1e-9) {
    shape.strokeWidth = Number((shape.strokeWidth * scaleX).toFixed(3));
  }
  return { ...element, shape };
}

function translated(element: SourceElement, x: number, y: number): SourceElement {
  return {
    ...element,
    shape: {
      ...element.shape,
      d: svgpath(element.shape.d).translate(x, y).round(3).toString(),
    },
  };
}

function rotated(
  element: SourceElement,
  degrees: number,
  cx: number,
  cy: number,
): SourceElement {
  return {
    ...element,
    shape: {
      ...element.shape,
      d: svgpath(element.shape.d)
        .rotate(degrees, cx, cy)
        .round(3)
        .toString(),
    },
  };
}

function clonedShapes(elements: readonly SourceElement[]): ShapeSpec[] {
  return elements.map(({ shape }) => ({ ...shape }));
}

function range(min: number, max: number, step: number): number[] {
  const values: number[] = [];
  for (let value = min; value <= max; value += step) values.push(value);
  return values;
}

function rangeWithCanonical(
  min: number,
  max: number,
  step: number,
  canonical: number,
): number[] {
  return [...new Set([...range(min, max, step), canonical])].sort((a, b) => a - b);
}

function variantKey(values: Readonly<Record<string, number>>): string {
  return Object.entries(values).map(([key, value]) => `${key}=${value}`).join(';');
}

function deskVariants(elements: readonly SourceElement[]): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const width of range(72, 120, 4)) {
    const scaleX = 1 + (width - 100) / 250;
    const scaled = elements.map((element) => transformed(element, scaleX, 1, CENTER, CENTER));
    for (const monitor of [0, 1]) {
      const selected = monitor === 1
        ? scaled
        : scaled.filter(({ id }) => ![
          'function-monitor',
          'function-monitor-stand',
          'function-keyboard',
          'function-key-lines',
          'function-mouse',
        ].includes(id));
      variants[variantKey({ width, monitor })] = clonedShapes(selected);
    }
  }
  return variants;
}

function chairVariants(elements: readonly SourceElement[]): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const size of range(10, 16, 1)) {
    variants[variantKey({ size })] = clonedShapes(
      elements.map((element) => transformed(element, size / 13, size / 13, CENTER, CENTER)),
    );
  }
  return variants;
}

function filingCabinetVariants(elements: readonly SourceElement[]): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const drawers of range(2, 4, 1)) {
    const offset = (4 - drawers) * 17;
    const selected: SourceElement[] = [];
    for (const element of elements) {
      const row = /-(\d)$/.exec(element.id)?.[1];
      if (row && Number(row) > drawers) continue;
      if (element.id === 'shell-body' || element.id === 'structure-drawer-well') {
        selected.push(transformed(element, 1, (89 - offset) / 89, CENTER, GROUND));
      } else if (row) {
        selected.push(translated(element, 0, offset));
      } else {
        selected.push({ ...element, shape: { ...element.shape } });
      }
    }
    variants[variantKey({ drawers })] = clonedShapes(selected);
  }
  return variants;
}

function copierVariants(elements: readonly SourceElement[]): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const height of range(60, 78, 2)) {
    variants[variantKey({ height })] = clonedShapes(
      elements.map((element) => transformed(element, 1, height / 70, CENTER, GROUND)),
    );
  }
  return variants;
}

function horizontalMachineVariants(
  elements: readonly SourceElement[],
  key: string,
  min: number,
  max: number,
  step: number,
  baseline: number,
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const value of range(min, max, step)) {
    variants[variantKey({ [key]: value })] = clonedShapes(
      elements.map((element) =>
        transformed(element, value / baseline, 1, CENTER, GROUND)
      ),
    );
  }
  return variants;
}

function verticalMachineVariants(
  elements: readonly SourceElement[],
  key: string,
  min: number,
  max: number,
  step: number,
  baseline: number,
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const value of range(min, max, step)) {
    variants[variantKey({ [key]: value })] = clonedShapes(
      elements.map((element) =>
        transformed(element, 1, value / baseline, CENTER, GROUND)
      ),
    );
  }
  return variants;
}

function vendingMachineVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const height of range(70, 94, 2)) {
    const scaled = elements.map((element) =>
      transformed(element, 1, height / 84, CENTER, GROUND)
    );
    for (const stocked of range(1, 3, 1)) {
      const selected = scaled.filter((element) => {
        const stock = /^stock-row-(\d)-\d$/.exec(element.id);
        return !stock || Number(stock[1]) <= stocked;
      });
      variants[variantKey({ height, stocked })] = clonedShapes(selected);
    }
  }
  return variants;
}

function officePlantVariants(elements: readonly SourceElement[]): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const bushiness of range(1, 3, 1)) {
    const scale = bushiness === 1 ? 0.9 : bushiness === 2 ? 1 : 1.08;
    variants[variantKey({ bushiness })] = clonedShapes(
      elements.map((element) =>
        element.groupId === 'foliage' || element.id === 'structure-stems'
          ? transformed(element, scale, scale, CENTER, 82)
          : { ...element, shape: { ...element.shape } }
      ),
    );
  }
  return variants;
}

function standingDeskVariants(elements: readonly SourceElement[]): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const width of range(84, 116, 4)) {
    const scaled = elements.map((element) =>
      transformed(element, width / 100, 1, CENTER, CENTER)
    );
    for (const dual of [0, 1]) {
      const selected: SourceElement[] = [];
      for (const element of scaled) {
        if (element.id !== 'function-monitor' || dual === 0) {
          selected.push({ ...element, shape: { ...element.shape } });
          continue;
        }
        const narrow = transformed(element, 0.68, 1, CENTER, CENTER);
        selected.push(
          translated(narrow, -14, 0),
          translated(narrow, 14, 0),
        );
      }
      variants[variantKey({ width, dual })] = clonedShapes(selected);
    }
  }
  return variants;
}

function cubicleWorkstationVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const openness of range(0, 3, 1)) {
    const turned = elements.map((element) =>
      rotated(element, openness * 90, CENTER, CENTER)
    );
    for (const clutter of range(0, 2, 1)) {
      const selected = turned.filter((element) => {
        if (element.id === 'personalization-papers') return clutter >= 1;
        if (element.id === 'personalization-mug') return clutter >= 2;
        return true;
      }).map((element) => {
        if (element.id !== 'personalization-mug') return element;
        const shape = { ...element.shape };
        delete shape.opacity;
        return { ...element, shape };
      });
      variants[variantKey({ openness, clutter })] = clonedShapes(selected);
    }
  }
  return variants;
}

function receptionDeskVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const width of range(72, 104, 4)) {
    variants[variantKey({ width })] = clonedShapes(
      elements.map((element) =>
        transformed(element, width / 88, 1, CENTER, CENTER)
      ),
    );
  }
  return variants;
}

function selectedConferenceChairIndices(
  count: number,
  side: 'top' | 'bottom',
): ReadonlySet<number> {
  if (count <= 0) return new Set();
  if (count === 1) return new Set([side === 'top' ? 2 : 3]);
  if (count === 2) return new Set([2, 3]);
  if (count === 3) {
    return new Set(side === 'top' ? [1, 2, 4] : [1, 3, 4]);
  }
  return new Set([1, 2, 3, 4]);
}

function conferenceTableVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const width of rangeWithCanonical(84, 120, 4, 110)) {
    const scaled = elements.map((element) =>
      transformed(element, width / 110, 1, CENTER, CENTER)
    );
    for (const chairs of range(0, 8, 1)) {
      const top = selectedConferenceChairIndices(Math.ceil(chairs / 2), 'top');
      const bottom = selectedConferenceChairIndices(Math.floor(chairs / 2), 'bottom');
      const selected = scaled.filter((element) => {
        const match = /^chair-(top|bottom)-(\d)-/.exec(element.id);
        if (!match) return true;
        const side = match[1] as 'top' | 'bottom';
        const index = Number(match[2]);
        return (side === 'top' ? top : bottom).has(index);
      }).map((element) => {
        if (!/^chair-(top|bottom)-(\d)-/.test(element.id)) return element;
        const shape = { ...element.shape };
        delete shape.opacity;
        return { ...element, shape };
      });
      variants[variantKey({ width, chairs })] = clonedShapes(selected);
    }
  }
  return variants;
}

function supplyCabinetVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const height of range(60, 84, 2)) {
    variants[variantKey({ height })] = clonedShapes(
      elements.map((element) =>
        transformed(element, 1, height / 72, CENTER, GROUND)
      ),
    );
  }
  return variants;
}

function deskLampVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const size of range(26, 40, 2)) {
    variants[variantKey({ size })] = clonedShapes(
      elements.map((element) =>
        transformed(element, size / 32, size / 32, CENTER, GROUND)
      ),
    );
  }
  return variants;
}

function deskClutterVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const papers of range(1, 4, 1)) {
    for (const phone of [0, 1]) {
      const selected = elements.filter((element) => {
        const paper = /^paper-(?:stack|lines)-(\d)$/.exec(element.id);
        if (paper && Number(paper[1]) > papers) return false;
        if (element.groupId === 'phone') return phone === 1;
        return true;
      }).map((element) => {
        if (!/^paper-(?:stack|lines)-4$/.test(element.id)) return element;
        const shape = { ...element.shape };
        delete shape.opacity;
        return { ...element, shape };
      });
      variants[variantKey({ papers, phone })] = clonedShapes(selected);
    }
  }
  return variants;
}

function selectedVariantGroup(
  elements: readonly SourceElement[],
  prefix: string,
  selected: number,
): SourceElement[] {
  return elements.filter((element) =>
    !element.groupId.startsWith(`${prefix}-`)
    || element.groupId === `${prefix}-${selected}`
  );
}

function couchVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const width of range(62, 98, 4)) {
    const scaled = elements.map((element) =>
      transformed(element, (width + 30) / 112, 1, CENTER, CENTER)
    );
    for (const cushions of range(2, 3, 1)) {
      variants[variantKey({ width, cushions })] = clonedShapes(
        selectedVariantGroup(scaled, 'cushions', cushions),
      );
    }
  }
  return variants;
}

function waitingBenchVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const length of range(76, 112, 4)) {
    const scaled = elements.map((element) =>
      transformed(element, (length + 20) / 116, 1, CENTER, CENTER)
    );
    for (const seats of range(2, 4, 1)) {
      variants[variantKey({ length, seats })] = clonedShapes(
        selectedVariantGroup(scaled, 'seats', seats),
      );
    }
  }
  return variants;
}

function coffeeTableVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const width of rangeWithCanonical(48, 76, 4, 62)) {
    const scaled = elements.map((element) =>
      transformed(element, width / 62, width / 62, CENTER, CENTER)
    );
    for (const decor of range(0, 2, 1)) {
      const selected = scaled.filter((element) => {
        if (element.groupId === 'decor-1') return decor >= 1;
        if (element.groupId === 'decor-2') return decor >= 2;
        return true;
      });
      variants[variantKey({ width, decor })] = clonedShapes(selected);
    }
  }
  return variants;
}

function breakTableVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const diameter of range(40, 64, 4)) {
    const scale = (diameter + 32) / 84;
    const scaled = elements.map((element) =>
      transformed(element, scale, scale, CENTER, CENTER)
    );
    for (const stools of range(2, 4, 1)) {
      variants[variantKey({ diameter, stools })] = clonedShapes(
        selectedVariantGroup(scaled, 'stools', stools),
      );
    }
  }
  return variants;
}

function loungeSeatingVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const seats of range(2, 4, 1)) {
    variants[variantKey({ seats })] = clonedShapes(
      selectedVariantGroup(elements, 'seats', seats),
    );
  }
  return variants;
}

function beanBagVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const size of range(34, 48, 2)) {
    variants[variantKey({ size })] = clonedShapes(
      elements.map((element) =>
        transformed(element, size / 42, size / 42, CENTER, CENTER)
      ),
    );
  }
  return variants;
}

function napPodVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const visor of [0, 1]) {
    variants[variantKey({ visor })] = clonedShapes(
      elements.filter((element) => {
        if (element.groupId === 'visor-down') return visor === 1;
        if (element.groupId === 'visor-up') return visor === 0;
        return true;
      }),
    );
  }
  return variants;
}

function stockedShelfVariants(
  elements: readonly SourceElement[],
  shelfMin: number,
  shelfMax: number,
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const shelves of range(shelfMin, shelfMax, 1)) {
    const selectedShelves = selectedVariantGroup(elements, 'shelves', shelves);
    for (const fill of range(1, 3, 1)) {
      variants[variantKey({ shelves, fill })] = clonedShapes(
        selectedShelves.filter((element) => {
          const level = /^fill-(\d)-/.exec(element.id)?.[1];
          return !level || Number(level) <= fill;
        }),
      );
    }
  }
  return variants;
}

function lockersVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const columns of range(2, 4, 1)) {
    const selected = selectedVariantGroup(elements, 'columns', columns);
    for (const height of range(72, 92, 2)) {
      variants[variantKey({ columns, height })] = clonedShapes(
        selected.map((element) =>
          transformed(element, 1, height / 84, CENTER, GROUND)
        ),
      );
    }
  }
  return variants;
}

function pantryShelfVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const shelves of range(2, 4, 1)) {
    variants[variantKey({ shelves })] = clonedShapes(
      selectedVariantGroup(elements, 'shelves', shelves),
    );
  }
  return variants;
}

function mailStationVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const height of range(48, 72, 2)) {
    const scaled = elements.map((element) =>
      transformed(element, 1, height / 60, CENTER, GROUND)
    );
    for (const columns of range(3, 5, 1)) {
      variants[variantKey({ height, columns })] = clonedShapes(
        selectedVariantGroup(scaled, 'columns', columns),
      );
    }
  }
  return variants;
}

function serverRackVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const height of range(72, 94, 2)) {
    const scaled = elements.map((element) =>
      transformed(element, 1, height / 86, CENTER, GROUND)
    );
    for (const units of range(3, 6, 1)) {
      const selected = scaled.filter((element) => {
        const sourceUnits = /^unit-(\d)-/.exec(element.id)?.[1];
        return !sourceUnits || Number(sourceUnits) === units;
      });
      variants[variantKey({ height, units })] = clonedShapes(selected);
    }
  }
  return variants;
}

function coatRackVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const hooks of range(2, 5, 1)) {
    variants[variantKey({ hooks })] = clonedShapes(
      selectedVariantGroup(elements, 'hooks', hooks),
    );
  }
  return variants;
}

function pottedTreeVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const height of range(74, 100, 2)) {
    const heightScale = height / 90;
    const heightScaled = elements.map((element) =>
      transformed(element, 1, heightScale, CENTER, GROUND)
    );
    const foliagePivotY = GROUND + (57 - GROUND) * heightScale;
    for (const fullness of range(1, 3, 1)) {
      const fullnessScale = fullness === 1 ? 0.9 : fullness === 2 ? 1 : 1.08;
      variants[variantKey({ height, fullness })] = clonedShapes(
        heightScaled.map((element) =>
          element.groupId === 'foliage'
            ? transformed(
                element,
                fullnessScale,
                fullnessScale,
                CENTER,
                foliagePivotY,
              )
            : { ...element, shape: { ...element.shape } }
        ),
      );
    }
  }
  return variants;
}

function hangingPlantVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  const vinePivotY = 64.86;
  for (const trail of range(14, 34, 2)) {
    const trailScaled = elements.map((element) =>
      element.groupId.startsWith('vine-')
        ? transformed(element, 1, trail / 24, CENTER, vinePivotY)
        : { ...element, shape: { ...element.shape } }
    );
    for (const fullness of range(1, 3, 1)) {
      const vineCount = fullness + 1;
      variants[variantKey({ trail, fullness })] = clonedShapes(
        trailScaled.filter((element) => {
          const vine = /^vine-(\d)$/.exec(element.groupId)?.[1];
          return !vine || Number(vine) <= vineCount;
        }),
      );
    }
  }
  return variants;
}

function framedArtVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const width of range(28, 46, 2)) {
    const scale = (width + 12) / 48;
    const scaled = elements.map((element) =>
      transformed(element, scale, scale, CENTER, CENTER)
    );
    for (const scene of range(0, 2, 1)) {
      variants[variantKey({ width, scene })] = clonedShapes(
        selectedVariantGroup(scaled, 'scene', scene),
      );
    }
  }
  return variants;
}

function posterVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const lines of range(1, 3, 1)) {
    variants[variantKey({ lines })] = clonedShapes(
      selectedVariantGroup(elements, 'lines', lines),
    );
  }
  return variants;
}

function wallClockVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const time of range(0, 11, 1)) {
    variants[variantKey({ time })] = clonedShapes(
      elements.map((element) =>
        element.id === 'function-hour-hand'
          ? rotated(element, (time - 10) * 30, CENTER, 63.28)
          : { ...element, shape: { ...element.shape } }
      ),
    );
  }
  return variants;
}

function fishTankVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const fish of range(1, 4, 1)) {
    variants[variantKey({ fish })] = clonedShapes(
      elements.filter((element) => {
        const fishIndex = /^fish-(\d)$/.exec(element.groupId)?.[1];
        return !fishIndex || Number(fishIndex) <= fish;
      }),
    );
  }
  return variants;
}

function stringLightsVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  const selections: Record<number, ReadonlySet<number>> = {
    4: new Set([1, 3, 4, 6]),
    5: new Set([1, 2, 3, 5, 6]),
    6: new Set([1, 2, 3, 4, 5, 6]),
    7: new Set([1, 2, 3, 4, 5, 6, 7]),
    8: new Set([1, 2, 3, 4, 5, 6, 7, 8]),
  };
  for (const bulbs of range(4, 8, 1)) {
    variants[variantKey({ bulbs })] = clonedShapes(
      elements.filter((element) => {
        const bulb = /^bulb-(\d)$/.exec(element.groupId)?.[1];
        return !bulb || selections[bulbs].has(Number(bulb));
      }),
    );
  }
  return variants;
}

function rugVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const width of range(72, 112, 4)) {
    const scaled = elements.map((element) =>
      transformed(element, width / 96, 1, CENTER, CENTER)
    );
    for (const pattern of range(0, 2, 1)) {
      variants[variantKey({ width, pattern })] = clonedShapes(
        scaled.filter((element) => {
          if (element.groupId === 'pattern-1') return pattern >= 1;
          if (element.groupId === 'pattern-2') return pattern >= 2;
          return true;
        }),
      );
    }
  }
  return variants;
}

function staticVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  return { '': clonedShapes(elements) };
}

function carVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const lightIds = new Set([
    'function-headlight-upper',
    'function-headlight-lower',
    'function-tail-light-upper',
    'function-tail-light-lower',
  ]);
  return {
    [variantKey({ trim: 0 })]: clonedShapes(
      elements.filter(({ id }) => !lightIds.has(id)),
    ),
    [variantKey({ trim: 1 })]: clonedShapes(elements),
  };
}

function signLotVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const defaultMarkIds = new Set([
    'function-primary-mark',
    'function-secondary-mark',
  ]);
  const compliancePrefix = 'variant-compliance-';
  const defaultElements = elements.filter(
    ({ id }) => !id.startsWith(compliancePrefix),
  );
  const complianceElements = elements
    .filter(({ id }) => !defaultMarkIds.has(id))
    .map((element) =>
      element.id.startsWith(compliancePrefix)
        ? {
            ...element,
            shape: {
              ...element.shape,
              opacity: 1,
            },
          }
        : element,
    );
  return {
    [variantKey({ variant: 0 })]: clonedShapes(defaultElements),
    [variantKey({ variant: 1 })]: clonedShapes(complianceElements),
  };
}

function treeCanopyVariants(
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  const variants: Record<string, ShapeSpec[]> = {};
  for (const habit of range(0, 3, 1)) {
    for (const lobes of range(5, 9, 1)) {
      for (const seed of range(1, 9, 1)) {
        if (habit === 3) {
          const scaleX = 1 + (lobes - 7) * 0.012;
          const seedOffset = (seed - 9) * 0.2;
          variants[variantKey({ habit, lobes, seed })] = clonedShapes(
            elements
              .filter(({ groupId }) => groupId !== 'foliage')
              .map((element) => {
                if (element.groupId !== 'variant-conifer') return element;
                let active: SourceElement = {
                  ...element,
                  shape: {
                    ...element.shape,
                    opacity: 1,
                  },
                };
                if (scaleX !== 1) {
                  active = transformed(active, scaleX, 1, CENTER, 64);
                }
                return seedOffset === 0
                  ? active
                  : translated(active, seedOffset, -seedOffset * 0.08);
              }),
          );
          continue;
        }

        const scaleX =
          (habit === 1 ? 1.08 : habit === 2 ? 0.84 : 1) *
          (1 + (lobes - 7) * 0.012);
        const scaleY =
          (habit === 1 ? 0.92 : habit === 2 ? 1.06 : 1) *
          (1 + (lobes - 7) * 0.006);
        const seedOffset = (seed - 3) * 0.24;
        const selected = elements
          .filter(({ groupId }) => groupId !== 'variant-conifer')
          .map((element) => {
            if (element.groupId !== 'foliage') return element;
            if (scaleX === 1 && scaleY === 1 && seedOffset === 0) {
              return element;
            }
            const scaled = transformed(
              element,
              scaleX,
              scaleY,
              CENTER,
              64,
            );
            return seedOffset === 0
              ? scaled
              : translated(
                  scaled,
                  element.id === 'foliage-main'
                    ? seedOffset * 0.35
                    : seedOffset,
                  element.id === 'foliage-fold'
                    ? seedOffset * 0.2
                    : -seedOffset * 0.15,
                );
          });
        variants[variantKey({ habit, lobes, seed })] =
          clonedShapes(selected);
      }
    }
  }
  return variants;
}

function buildVariants(
  id: QuotaCoWorkhorsePropId,
  elements: readonly SourceElement[],
): Record<string, ShapeSpec[]> {
  switch (id) {
    case 'printer':
    case 'printer-jammed':
      return horizontalMachineVariants(elements, 'width', 44, 72, 2, 56);
    case 'coffee-machine':
    case 'coffee-machine-broken':
      return verticalMachineVariants(elements, 'height', 40, 56, 2, 48);
    case 'water-cooler':
    case 'water-cooler-empty':
      return verticalMachineVariants(elements, 'height', 44, 68, 2, 56);
    case 'shredder':
      return verticalMachineVariants(elements, 'height', 34, 50, 2, 42);
    case 'microwave':
      return horizontalMachineVariants(elements, 'width', 38, 52, 2, 44);
    case 'fridge':
      return verticalMachineVariants(elements, 'height', 66, 90, 2, 78);
    case 'vending-machine':
      return vendingMachineVariants(elements);
    case 'desk': return deskVariants(elements);
    case 'office-chair': return chairVariants(elements);
    case 'filing-cabinet': return filingCabinetVariants(elements);
    case 'copier': return copierVariants(elements);
    case 'office-plant': return officePlantVariants(elements);
    case 'standing-desk': return standingDeskVariants(elements);
    case 'cubicle-workstation': return cubicleWorkstationVariants(elements);
    case 'reception-desk': return receptionDeskVariants(elements);
    case 'conference-table': return conferenceTableVariants(elements);
    case 'supply-cabinet': return supplyCabinetVariants(elements);
    case 'desk-lamp': return deskLampVariants(elements);
    case 'desk-clutter': return deskClutterVariants(elements);
    case 'couch': return couchVariants(elements);
    case 'waiting-bench': return waitingBenchVariants(elements);
    case 'coffee-table': return coffeeTableVariants(elements);
    case 'break-table': return breakTableVariants(elements);
    case 'lounge-seating': return loungeSeatingVariants(elements);
    case 'bean-bag': return beanBagVariants(elements);
    case 'nap-pod': return napPodVariants(elements);
    case 'bookshelf': return stockedShelfVariants(elements, 3, 5);
    case 'lockers': return lockersVariants(elements);
    case 'open-shelving': return stockedShelfVariants(elements, 3, 5);
    case 'pantry-shelf': return pantryShelfVariants(elements);
    case 'mail-station': return mailStationVariants(elements);
    case 'server-rack': return serverRackVariants(elements);
    case 'coat-rack': return coatRackVariants(elements);
    case 'potted-tree': return pottedTreeVariants(elements);
    case 'hanging-plant': return hangingPlantVariants(elements);
    case 'floor-lamp':
      return verticalMachineVariants(elements, 'height', 78, 104, 2, 92);
    case 'framed-art': return framedArtVariants(elements);
    case 'poster': return posterVariants(elements);
    case 'wall-clock': return wallClockVariants(elements);
    case 'fish-tank': return fishTankVariants(elements);
    case 'string-lights': return stringLightsVariants(elements);
    case 'rug': return rugVariants(elements);
    case 'car': return carVariants(elements);
    case 'sign-lot': return signLotVariants(elements);
    case 'tree-canopy': return treeCanopyVariants(elements);
    case 'lot-marking-crosswalk':
    case 'lamp-post':
    case 'bike-rack':
    case 'park-bench':
    case 'picnic-table':
      return staticVariants(elements);
  }
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export async function compileQuotaCoWorkhorseProps(
  inputDir: string,
  sourcePathPrefix: string,
): Promise<ImportedPropArt[]> {
  const imports: ImportedPropArt[] = [];
  for (const manifest of MANIFEST) {
    const absolutePath = path.join(inputDir, manifest.file);
    const sourceFile = path.posix.join(sourcePathPrefix.replaceAll('\\', '/'), manifest.file);
    const input = await readFile(absolutePath, 'utf8');
    const elements = compileElements(sourceFile, input, manifest);
    imports.push({
      id: manifest.id as QuotaCoWorkhorsePropId,
      projection: manifest.projection,
      sourceFile,
      sourceSha256: createHash('sha256').update(input).digest('hex'),
      paletteDefaults: manifest.paletteDefaults,
      variants: buildVariants(manifest.id as QuotaCoWorkhorsePropId, elements),
    });
  }
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

/** Deterministic generated module: no timestamps, absolute paths, or traversal order. */
export function emitQuotaCoWorkhorsePropArt(imports: readonly ImportedPropArt[]): string {
  const lines = [
    "import type { ImportedPropArt } from '../authoredArt';",
    '',
    '// Generated by `npm run props:import`. Do not edit by hand.',
    'export const QUOTA_CO_WORKHORSE_PROP_ART = [',
  ];
  for (const imported of imports) {
    lines.push('  {');
    lines.push(`    id: ${quote(imported.id)},`);
    lines.push(`    projection: ${quote(imported.projection)},`);
    lines.push(`    sourceFile: ${quote(imported.sourceFile)},`);
    lines.push(`    sourceSha256: ${quote(imported.sourceSha256)},`);
    lines.push(`    paletteDefaults: ${JSON.stringify(imported.paletteDefaults)},`);
    lines.push('    variants: {');
    for (const [key, shapes] of Object.entries(imported.variants).sort(([left], [right]) =>
      compareText(left, right)
    )) {
      lines.push(`      ${quote(key)}: [`);
      for (const shape of shapes) lines.push(`        ${emitShape(shape)},`);
      lines.push('      ],');
    }
    lines.push('    },');
    lines.push('  },');
  }
  lines.push('] as const satisfies readonly ImportedPropArt[];');
  return `${lines.join('\n')}\n`;
}
