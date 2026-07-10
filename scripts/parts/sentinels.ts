import type { PaletteToken } from '../../src/core/types';

/** Frozen authoring colors. Scaffolds and the importer must share this table. */
export const PART_SENTINEL_COLORS: Readonly<Record<PaletteToken, string>> = {
  skin: '#FF00FF',
  hair: '#00FFFF',
  outfitPrimary: '#FF0000',
  outfitSecondary: '#00FF00',
  accent: '#0000FF',
};

export const SENTINEL_TO_PALETTE_REF = new Map<string, string>(
  Object.entries(PART_SENTINEL_COLORS).map(([token, color]) => [color, `$${token}`]),
);
