import type { PaletteToken } from '../../src/core/types';

export const PART_SENTINEL_SWATCHES = [
  { token: 'skin', color: '#FF00FF' },
  { token: 'hair', color: '#00FFFF' },
  { token: 'outfitPrimary', color: '#FF0000' },
  { token: 'outfitSecondary', color: '#00FF00' },
  { token: 'accent', color: '#0000FF' },
] as const satisfies readonly { token: PaletteToken; color: string }[];

/** Frozen authoring colors. Scaffolds and the importer must share this table. */
export const PART_SENTINEL_COLORS = Object.fromEntries(
  PART_SENTINEL_SWATCHES.map(({ token, color }) => [token, color]),
) as Readonly<Record<PaletteToken, string>>;

export const SENTINEL_TO_PALETTE_REF = new Map<string, string>(
  PART_SENTINEL_SWATCHES.map(({ token, color }) => [color, `$${token}`]),
);
