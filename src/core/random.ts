import type { CharacterRecipe, StyleSheet } from './types';
import { partsForSlot } from '../parts/library';

export type Rng = () => number;

/** Deterministic small RNG. Same seed -> same sequence, everywhere. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWith<T>(rng: Rng, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pick<T>(arr: T[]): T {
  return pickWith(Math.random, arr);
}

const FIRST_NAMES = [
  'Alex', 'Sam', 'Jordan', 'Casey', 'Morgan', 'Riley', 'Quinn', 'Avery',
  'Dana', 'Jesse', 'Robin', 'Marge', 'Doug', 'Pam', 'Greg', 'Tina',
  'Howard', 'Cheryl', 'Vince', 'Donna', 'Phil', 'Rhonda', 'Stan', 'Bev',
];

let counter = 0;

/** Generate a random coworker from the part library and the style palette pools. */
export function randomCharacter(style: StyleSheet, rng: Rng = Math.random): CharacterRecipe {
  const pools = style.palettePools;
  const accessories: string[] = [];
  const accessoryPool = partsForSlot('accessory').map((p) => p.id);
  // 0–2 accessories, no duplicates
  const count = Math.floor(rng() * 3);
  while (accessories.length < count) {
    const id = pickWith(rng, accessoryPool);
    if (!accessories.includes(id)) accessories.push(id);
  }
  counter += 1;
  return {
    id: `char-${Date.now().toString(36)}-${counter}`,
    name: pickWith(rng, FIRST_NAMES),
    parts: {
      body: pickWith(rng, partsForSlot('body')).id,
      head: pickWith(rng, partsForSlot('head')).id,
      hair: pickWith(rng, partsForSlot('hair')).id,
      outfit: pickWith(rng, partsForSlot('outfit')).id,
      accessories,
    },
    palette: {
      skin: pickWith(rng, pools.skin),
      hair: pickWith(rng, pools.hair),
      outfitPrimary: pickWith(rng, pools.clothing),
      outfitSecondary: pickWith(rng, pools.secondary),
      accent: pickWith(rng, pools.accent),
    },
  };
}

/** Re-roll only the palette of an existing recipe. */
export function rerollPalette(recipe: CharacterRecipe, style: StyleSheet): CharacterRecipe {
  const pools = style.palettePools;
  return {
    ...recipe,
    palette: {
      skin: pick(pools.skin),
      hair: pick(pools.hair),
      outfitPrimary: pick(pools.clothing),
      outfitSecondary: pick(pools.secondary),
      accent: pick(pools.accent),
    },
  };
}
