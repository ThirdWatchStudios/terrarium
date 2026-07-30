import type { PropPalette, ShapeSpec } from '../core/types';
import { circle } from '../core/geometry';
import type {
  ImportedSurfaceArt,
  ImportedSurfaceShape,
} from './authoredSurfaceArt';
import { QUOTA_CO_MAINTAINED_HYBRID_SURFACE_ART } from './generated/quotaCoMaintainedHybridSurfaceArt';

const CANVAS = 128;

function paletteMatches(left: PropPalette, right: PropPalette): boolean {
  return (
    left.primary.toUpperCase() === right.primary.toUpperCase() &&
    left.secondary.toUpperCase() === right.secondary.toUpperCase() &&
    left.accent.toUpperCase() === right.accent.toUpperCase()
  );
}

/**
 * Resolve the canonical SVG source behind a live floor/ground template.
 *
 * Grass is the one shared template in this bank, so its three accepted sources
 * are selected by the existing instance palette. All other templates map
 * one-to-one to their existing default instance.
 */
export function maintainedHybridSurfaceSource(
  templateId: string,
  palette: PropPalette,
): ImportedSurfaceArt | undefined {
  const candidates = QUOTA_CO_MAINTAINED_HYBRID_SURFACE_ART.filter(
    (candidate) => candidate.templateId === templateId,
  );
  if (candidates.length === 0) return undefined;
  return (
    candidates.find((candidate) =>
      paletteMatches(candidate.paletteDefaults, palette),
    ) ?? candidates[0]
  );
}

function plainShape({
  sourceElementId: _sourceElementId,
  semanticGroup: _semanticGroup,
  ...shape
}: ImportedSurfaceShape): ShapeSpec {
  return { ...shape };
}

function parameter(
  source: ImportedSurfaceArt,
  params: Readonly<Record<string, number>>,
  key: string,
): number {
  return params[key] ?? source.defaultParams[key] ?? 0;
}

function usesCanonicalDefaults(
  source: ImportedSurfaceArt,
  params: Readonly<Record<string, number>>,
): boolean {
  return Object.entries(source.defaultParams).every(
    ([key, value]) => parameter(source, params, key) === value,
  );
}

function group(
  source: ImportedSurfaceArt,
  semanticGroup: string,
): ImportedSurfaceShape[] {
  return source.shapes.filter(
    (shape) => shape.semanticGroup === semanticGroup,
  );
}

function substrate(source: ImportedSurfaceArt): ShapeSpec[] {
  return group(source, 'substrate').map(plainShape);
}

function detail(source: ImportedSurfaceArt): ImportedSurfaceShape[] {
  return source.shapes.filter((shape) => shape.semanticGroup !== 'substrate');
}

function round(value: number): number {
  return Number(value.toFixed(3));
}

function withOpacity(
  shape: ImportedSurfaceShape,
  scale: number,
): ShapeSpec {
  const plain = plainShape(shape);
  plain.opacity = round(Math.min(1, (shape.opacity ?? 1) * scale));
  return plain;
}

function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function seededWeight(shape: ImportedSurfaceShape, seed: number): number {
  return hash(`${seed}:${shape.sourceElementId}:${shape.d}`) / 0xffffffff;
}

function seededOpacity(
  shape: ImportedSurfaceShape,
  seed: number,
  baseScale = 1,
): ShapeSpec {
  return withOpacity(shape, baseScale * (0.78 + seededWeight(shape, seed) * 0.4));
}

function sourceSeededOpacity(
  source: ImportedSurfaceArt,
  params: Readonly<Record<string, number>>,
  shape: ImportedSurfaceShape,
  baseScale = 1,
): ShapeSpec {
  const seed = parameter(source, params, 'seed');
  return seed === source.defaultParams.seed
    ? withOpacity(shape, baseScale)
    : seededOpacity(shape, seed, baseScale);
}

function selectSourceDetails(
  shapes: readonly ImportedSurfaceShape[],
  count: number,
  seed: number,
): ImportedSurfaceShape[] {
  const selected = new Set(
    [...shapes]
      .sort(
        (left, right) =>
          seededWeight(left, seed) - seededWeight(right, seed),
      )
      .slice(0, Math.max(0, Math.min(shapes.length, count))),
  );
  return shapes.filter((shape) => selected.has(shape));
}

function gridShape(
  sourceShape: ImportedSurfaceShape,
  spacing: number,
): ShapeSpec {
  const lines: string[] = [];
  for (let value = 0; value <= CANVAS; value += spacing) {
    lines.push(`M ${value} 0 V ${CANVAS}`);
    lines.push(`M 0 ${value} H ${CANVAS}`);
  }
  return {
    ...plainShape(sourceShape),
    d: lines.join(' '),
  };
}

function carpetVariant(
  source: ImportedSurfaceArt,
  params: Readonly<Record<string, number>>,
): ShapeSpec[] {
  const speckle = parameter(source, params, 'speckle');
  const seed = parameter(source, params, 'seed');
  const authored = detail(source);
  if (speckle === 0) return substrate(source);
  const count = Math.round(authored.length * Math.min(1, speckle / 2));
  const scale = speckle > 2 ? 1.3 : 1;
  return [
    ...substrate(source),
    ...selectSourceDetails(authored, count, seed).map((shape) =>
      sourceSeededOpacity(source, params, shape, scale),
    ),
  ];
}

function carpetTileVariant(
  source: ImportedSurfaceArt,
  params: Readonly<Record<string, number>>,
): ShapeSpec[] {
  const contrast = parameter(source, params, 'contrast');
  return [
    ...substrate(source),
    ...detail(source).map((shape) => withOpacity(shape, contrast / 2)),
  ];
}

function woodVariant(
  source: ImportedSurfaceArt,
  params: Readonly<Record<string, number>>,
): ShapeSpec[] {
  const seed = parameter(source, params, 'seed');
  return [
    ...substrate(source),
    ...detail(source).map((shape) =>
      shape.semanticGroup === 'accent-detail'
        ? seededOpacity(shape, seed)
        : plainShape(shape),
    ),
  ];
}

function linoleumVariant(
  source: ImportedSurfaceArt,
  params: Readonly<Record<string, number>>,
): ShapeSpec[] {
  const spacing = parameter(source, params, 'grid');
  const seam = group(source, 'secondary-detail')[0];
  return [
    ...substrate(source),
    ...(seam ? [gridShape(seam, spacing)] : []),
    ...group(source, 'accent-detail').map(plainShape),
    ...group(source, 'literal-detail').map(plainShape),
  ];
}

function utilityVinylVariant(
  source: ImportedSurfaceArt,
  params: Readonly<Record<string, number>>,
): ShapeSpec[] {
  const spacing = parameter(source, params, 'grid');
  const scuff = parameter(source, params, 'scuff');
  const seed = parameter(source, params, 'seed');
  const secondary = group(source, 'secondary-detail');
  const seam = secondary[0];
  const scuffs = [...secondary.slice(1), ...group(source, 'accent-detail')];
  const count = Math.round(scuffs.length * Math.min(1, scuff / 2));
  const scale = scuff > 2 ? 1.25 : 1;
  return [
    ...substrate(source),
    ...(seam ? [gridShape(seam, spacing)] : []),
    ...selectSourceDetails(scuffs, count, seed).map((shape) =>
      sourceSeededOpacity(source, params, shape, scale),
    ),
    ...group(source, 'literal-detail').map(plainShape),
  ];
}

function quietCarpetVariant(
  source: ImportedSurfaceArt,
  params: Readonly<Record<string, number>>,
): ShapeSpec[] {
  const weave = parameter(source, params, 'weave');
  return [
    ...substrate(source),
    ...detail(source).map((shape) =>
      shape.stroke
        ? withOpacity(shape, weave / 2)
        : sourceSeededOpacity(source, params, shape),
    ),
  ];
}

function terrazzoVariant(
  source: ImportedSurfaceArt,
  params: Readonly<Record<string, number>>,
): ShapeSpec[] {
  const density = parameter(source, params, 'density');
  const seed = parameter(source, params, 'seed');
  const chips = detail(source);
  const count = Math.round(chips.length * Math.min(1, density / 2));
  const scale = density > 2 ? 1.3 : 1;
  return [
    ...substrate(source),
    ...selectSourceDetails(chips, count, seed).map((shape) =>
      sourceSeededOpacity(source, params, shape, scale),
    ),
  ];
}

function rubberMatVariant(
  source: ImportedSurfaceArt,
  params: Readonly<Record<string, number>>,
): ShapeSpec[] {
  const studs = parameter(source, params, 'studs');
  const outerSource = group(source, 'secondary-detail')[0];
  const innerSource = group(source, 'literal-detail')[0];
  if (!outerSource || !innerSource) return source.shapes.map(plainShape);
  const spacing = CANVAS / studs;
  const shapes = substrate(source);
  for (let row = 0; row < studs; row += 1) {
    for (let column = 0; column < studs; column += 1) {
      const x = (column + 0.5) * spacing;
      const y = (row + 0.5) * spacing;
      shapes.push({
        ...plainShape(outerSource),
        d: circle(x, y, Math.min(2.35, spacing * 0.19)),
      });
      shapes.push({
        ...plainShape(innerSource),
        d: circle(x, y, Math.min(0.95, spacing * 0.08)),
      });
    }
  }
  return shapes;
}

function lobbyStoneVariant(
  source: ImportedSurfaceArt,
  params: Readonly<Record<string, number>>,
): ShapeSpec[] {
  const slab = parameter(source, params, 'slab');
  const sheen = parameter(source, params, 'sheen');
  const seam = group(source, 'secondary-detail')[0];
  const polish = group(source, 'accent-detail');
  return [
    ...substrate(source),
    ...(seam ? [gridShape(seam, slab)] : []),
    ...polish
      .slice(0, sheen === 0 ? 0 : sheen === 1 ? 1 : polish.length)
      .map((shape) => withOpacity(shape, sheen > 2 ? 1.3 : 1)),
  ];
}

function polishedConcreteVariant(
  source: ImportedSurfaceArt,
  params: Readonly<Record<string, number>>,
): ShapeSpec[] {
  const joints = parameter(source, params, 'joints');
  const secondary = group(source, 'secondary-detail');
  const seam = secondary[0];
  const materialDetail = [
    ...secondary.slice(1),
    ...group(source, 'accent-detail'),
  ];
  return [
    ...substrate(source),
    ...(joints > 0 && seam
      ? [gridShape(seam, joints === 1 ? 64 : 32)]
      : []),
    ...materialDetail.map((shape) =>
      sourceSeededOpacity(source, params, shape),
    ),
  ];
}

function accentTileVariant(
  source: ImportedSurfaceArt,
  params: Readonly<Record<string, number>>,
): ShapeSpec[] {
  const spacing = parameter(source, params, 'grid');
  const motif = parameter(source, params, 'motif');
  const secondary = group(source, 'secondary-detail');
  const seam = secondary[0];
  const motifShapes = [
    ...group(source, 'primary-detail'),
    ...secondary.slice(1),
    ...group(source, 'accent-detail'),
  ];
  return [
    ...substrate(source),
    ...(seam ? [gridShape(seam, spacing)] : []),
    ...(motif === 0
      ? []
      : motifShapes.map((shape) => withOpacity(shape, motif > 1 ? 1.25 : 1))),
  ];
}

function astroturfVariant(
  source: ImportedSurfaceArt,
  params: Readonly<Record<string, number>>,
): ShapeSpec[] {
  const seed = parameter(source, params, 'seed');
  return [
    ...substrate(source),
    ...group(source, 'secondary-detail').map(plainShape),
    ...group(source, 'accent-detail').map((shape) =>
      seededOpacity(shape, seed),
    ),
  ];
}

function grassVariant(
  source: ImportedSurfaceArt,
  params: Readonly<Record<string, number>>,
): ShapeSpec[] {
  const blades = parameter(source, params, 'blades');
  const flowers = parameter(source, params, 'flowers');
  const seed = parameter(source, params, 'seed');
  const sourceBlades = source.shapes.filter(
    (shape) =>
      shape.semanticGroup !== 'literal-detail' &&
      shape.semanticGroup !== 'substrate' &&
      shape.stroke !== undefined,
  );
  const sourceStatic = source.shapes.filter(
    (shape) =>
      shape.semanticGroup !== 'literal-detail' &&
      shape.semanticGroup !== 'substrate' &&
      shape.stroke === undefined,
  );
  const defaultBlades = source.defaultParams.blades ?? 2;
  const count = Math.round(
    sourceBlades.length * Math.min(1, blades / defaultBlades),
  );
  const bladeScale = blades > defaultBlades ? 1.2 : 1;
  const flowerSource =
    group(source, 'literal-detail').length > 0
      ? group(source, 'literal-detail')
      : group(
          QUOTA_CO_MAINTAINED_HYBRID_SURFACE_ART.find(
            (candidate) => candidate.id === 'ground-grass',
          )!,
          'literal-detail',
        );
  return [
    ...substrate(source),
    ...sourceStatic.map((shape) =>
      sourceSeededOpacity(source, params, shape),
    ),
    ...selectSourceDetails(sourceBlades, count, seed).map((shape) =>
      sourceSeededOpacity(source, params, shape, bladeScale),
    ),
    ...flowerSource
      .slice(0, flowers === 0 ? 0 : flowerSource.length)
      .map((shape) => withOpacity(shape, flowers > 1 ? 1.25 : 1)),
  ];
}

/**
 * Build a live template from its canonical Maintained Hybrid SVG source.
 *
 * Accepted default instances return the compiled source geometry verbatim.
 * Non-default controls derive bounded variants from the same semantic SVG
 * layers; IDs, palettes, template registration, and export shape stay intact.
 */
export function maintainedHybridSurfaceShapes(
  templateId: string,
  params: Readonly<Record<string, number>>,
  palette: PropPalette,
): ShapeSpec[] | undefined {
  const source = maintainedHybridSurfaceSource(templateId, palette);
  if (!source) return undefined;
  if (usesCanonicalDefaults(source, params)) {
    return source.shapes.map(plainShape);
  }
  switch (templateId) {
    case 'carpet':
      return carpetVariant(source, params);
    case 'carpet-tiles':
      return carpetTileVariant(source, params);
    case 'wood-floor':
      return woodVariant(source, params);
    case 'linoleum':
      return linoleumVariant(source, params);
    case 'utility-vinyl':
      return utilityVinylVariant(source, params);
    case 'quiet-carpet':
      return quietCarpetVariant(source, params);
    case 'terrazzo':
      return terrazzoVariant(source, params);
    case 'rubber-mat':
      return rubberMatVariant(source, params);
    case 'lobby-stone':
      return lobbyStoneVariant(source, params);
    case 'polished-concrete':
      return polishedConcreteVariant(source, params);
    case 'accent-tile':
      return accentTileVariant(source, params);
    case 'astroturf':
      return astroturfVariant(source, params);
    case 'grass':
      return grassVariant(source, params);
    default:
      return undefined;
  }
}
