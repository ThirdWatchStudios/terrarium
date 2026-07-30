import type { PropPalette, ShapeSpec } from '../core/types';

export type AuthoredSurfaceKind = 'floor' | 'ground';

/**
 * Deterministic compile result for one canonical floor or ground SVG source.
 *
 * Semantic SVG ownership survives compilation so live parameter controls can
 * operate on artist-authored detail groups instead of reconstructing the
 * accepted default artwork from unrelated procedural geometry.
 */
export interface ImportedSurfaceShape extends ShapeSpec {
  readonly sourceElementId: string;
  readonly semanticGroup: string;
}

export interface ImportedSurfaceArt {
  readonly id: string;
  readonly kind: AuthoredSurfaceKind;
  readonly templateId: string;
  readonly sourceFile: string;
  readonly sourceSha256: string;
  readonly paletteDefaults: PropPalette;
  readonly defaultParams: Readonly<Record<string, number>>;
  readonly shapes: readonly ImportedSurfaceShape[];
}
