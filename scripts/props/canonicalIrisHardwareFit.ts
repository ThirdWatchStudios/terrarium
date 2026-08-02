import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import svgpath from 'svgpath';
import { parseSync, stringify, type INode } from 'svgson';

import type { PropPalette, ShapeSpec } from '../../src/core/types';
import {
  IRIS_HARDWARE_HEIGHTS,
  IRIS_HARDWARE_SOURCE_PREFIX,
} from '../../src/props/irisHardwareManifest';
import { fitCanonicalHairShapes } from '../parts/canonicalHairFit';

export const CANONICAL_IRIS_HEIGHT = 90;
export const CANONICAL_IRIS_HEIGHTS = IRIS_HARDWARE_HEIGHTS;

export const CANONICAL_IRIS_SOURCE_FILES = {
  'iris-installation-unit':
    `${IRIS_HARDWARE_SOURCE_PREFIX}/iris-installation-unit.svg`,
  'iris-installation-unit-dormant':
    `${IRIS_HARDWARE_SOURCE_PREFIX}/iris-installation-unit-dormant.svg`,
  'iris-charging-dock':
    `${IRIS_HARDWARE_SOURCE_PREFIX}/iris-charging-dock.svg`,
} as const;

export type CanonicalIrisHardwareId = keyof typeof CANONICAL_IRIS_SOURCE_FILES;
export type CanonicalIrisInstallationId = Exclude<CanonicalIrisHardwareId, 'iris-charging-dock'>;

function sourceText(id: CanonicalIrisHardwareId): string {
  return readFileSync(resolve(process.cwd(), CANONICAL_IRIS_SOURCE_FILES[id]), 'utf8');
}

function snappedHeight(raw: number | undefined): number {
  const candidate = Number.isFinite(raw) ? Number(raw) : CANONICAL_IRIS_HEIGHT;
  const snapped = 78 + Math.round((candidate - 78) / 2) * 2;
  return Math.min(98, Math.max(78, snapped));
}

function translateY(d: string, offset: number): string {
  return svgpath(d).translate(0, offset).round(3).toString();
}

function stretchY(d: string, scale: number, pivotY: number): string {
  return svgpath(d)
    .translate(0, -pivotY)
    .scale(1, scale)
    .translate(0, pivotY)
    .round(3)
    .toString();
}

function piecewiseY(
  d: string,
  source: readonly [number, number, number],
  target: readonly [number, number, number],
): string {
  const shape: ShapeSpec = { d };
  return fitCanonicalHairShapes(
    [shape],
    {
      x: { low: 0, center: 64, high: 128 },
      y: { low: source[0], center: source[1], high: source[2] },
    },
    {
      x: { low: 0, center: 64, high: 128 },
      y: { low: target[0], center: target[1], high: target[2] },
    },
  )[0].d;
}

function fitHeightPath(d: string, role: string, height: number): string {
  const offset = CANONICAL_IRIS_HEIGHT - height;
  switch (role) {
    case 'right-shell':
      return piecewiseY(d, [13, 23, 108], [103 - height, 113 - height, 108]);
    case 'left-shell':
      return piecewiseY(d, [31, 39, 108], [121 - height, 129 - height, 108]);
    case 'spine-shell':
      return stretchY(d, (height - 11) / 79, 108);
    case 'left-crown':
    case 'spine-crown':
    case 'optic':
      return translateY(d, offset);
    case 'spine-plane':
      return stretchY(d, (height - 17) / 73, 106);
    case 'spine-rail':
      return stretchY(d, (height - 32) / 58, 99);
    default:
      throw new Error(`Unknown IRIS height role ${role}`);
  }
}

function visit(node: INode, height: number, palette: PropPalette | undefined): void {
  const role = node.attributes['data-height-role'];
  if (role && node.name === 'path' && height !== CANONICAL_IRIS_HEIGHT) {
    const d = node.attributes.d;
    if (!d) throw new Error(`${node.attributes.id ?? 'unnamed path'} has no geometry`);
    node.attributes.d = fitHeightPath(d, role, height);
  }

  const fillToken = node.attributes['data-fill-token'] as keyof PropPalette | undefined;
  if (fillToken && palette) node.attributes.fill = palette[fillToken];
  for (const child of node.children) visit(child, height, palette);
}

/**
 * Compile a final SVG from one directly inspectable source.
 * Visible paths come only from the source; the adapter applies declared height
 * roles and palette tokens without constructing replacement geometry.
 */
export function canonicalIrisHardwareSvg(
  id: CanonicalIrisHardwareId,
  params: Readonly<Record<string, number>> = {},
  palette?: PropPalette,
  size = 128,
): string {
  return fitCanonicalIrisHardwareSourceSvg(sourceText(id), id, params, palette, size);
}

/** Apply the declared adapter to a supplied canonical source document. */
export function fitCanonicalIrisHardwareSourceSvg(
  source: string,
  id: CanonicalIrisHardwareId,
  params: Readonly<Record<string, number>> = {},
  palette?: PropPalette,
  size = 128,
): string {
  const root = parseSync(source);
  const height = id === 'iris-charging-dock'
    ? CANONICAL_IRIS_HEIGHT
    : snappedHeight(params.height);
  visit(root, height, palette);
  root.attributes.width = String(size);
  root.attributes.height = String(size);
  if (id !== 'iris-charging-dock') {
    root.attributes['data-derived-height'] = String(height);
  }
  return stringify(root);
}
