import { describe, it, expect } from 'vitest';
import { unitColor, unitPalette, unitRecipe } from '../src/core/renderings';
import { composePortrait } from '../src/core/compositor';
import { defaultGoldenProject } from '../src/data/defaults';

/**
 * Renderings guard — register-constitution.md Article VIII (as amended):
 * "Every register redraws the person. None may rewrite their behavior."
 * The unit transform may only touch pigment; identity must survive at floor
 * zoom (lightness ordering) while the person is near-anonymized (skin
 * convergence, saturation crush).
 */

function lum(hex: string): number {
  const v = hex.replace('#', '');
  return (0.299 * parseInt(v.slice(0, 2), 16) + 0.587 * parseInt(v.slice(2, 4), 16) + 0.114 * parseInt(v.slice(4, 6), 16)) / 255;
}

function chroma(hex: string): number {
  const v = hex.replace('#', '');
  const ch = [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
  return Math.max(...ch) - Math.min(...ch);
}

describe('operational-unit rendering (Article VIII)', () => {
  it('crushes saturation — the unit is institutional, not colorful', () => {
    for (const vivid of ['#C7362E', '#107A53', '#0F4C81', '#D88918']) {
      expect(chroma(unitColor(vivid)), `${vivid} stayed vivid`).toBeLessThan(chroma(vivid) * 0.45);
    }
  });

  it('preserves lightness ordering — silhouette identity survives', () => {
    const dark = unitColor('#17191D'); // near-black hair
    const light = unitColor('#C7CDD5'); // pale hair
    expect(lum(dark)).toBeLessThan(lum(light) - 0.2);
  });

  it('converges complexions — the unit is near-anonymous', () => {
    const a = unitPalette({ skin: '#F1D6BE', hair: '#111', outfitPrimary: '#333', outfitSecondary: '#444', accent: '#555' });
    const b = unitPalette({ skin: '#68422F', hair: '#111', outfitPrimary: '#333', outfitSecondary: '#444', accent: '#555' });
    // Source skins are ~0.36 apart in luminance; units must land within 0.06.
    expect(Math.abs(lum(a.skin) - lum(b.skin))).toBeLessThan(0.06);
  });

  it('touches ONLY pigment — geometry, parts and id pass through untouched', () => {
    const identity = defaultGoldenProject().characters[0];
    const unit = unitRecipe(identity);
    expect(unit.id).toBe(identity.id);
    expect(unit.parts).toBe(identity.parts); // same reference: cannot have been rewritten
    expect(unit.palette).not.toEqual(identity.palette);
  });

  it('is idempotent-ish: a unit re-rendered stays institutional', () => {
    const once = unitColor('#C7362E');
    const twice = unitColor(once);
    expect(chroma(twice)).toBeLessThanOrEqual(chroma(once) + 1);
  });
});

describe('corporate-identity rendering (the badge photo)', () => {
  it('is a bust crop with a studio background, warm palette intact', () => {
    const { characters, style } = defaultGoldenProject();
    const portrait = composePortrait(characters[0], style, 96);
    expect(portrait).toContain('viewBox="24 2 80 80"');
    expect(portrait).toContain('#D9D4C9'); // the studio paper
    expect(portrait).toContain(characters[0].palette.skin.toUpperCase()); // warmth is proximity
  });
});
