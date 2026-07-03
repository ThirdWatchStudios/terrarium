import { describe, it, expect } from 'vitest';
import { UNIT_INK, UNIT_PARTS, codingHue, unitPalette, unitRecipe, unitRenderingSpec } from '../src/core/renderings';
import { composeCharacter, composePortrait } from '../src/core/compositor';
import { defaultGoldenProject } from '../src/data/defaults';

/**
 * Renderings guard — register-constitution.md Article VIII (as amended):
 * "Every register redraws the person. None may rewrite their behavior."
 * The unit is IRIS's OWN drawing (pictogram parts + coding hue), not a
 * re-tinted sprite; it must stay fully anonymous at the head, keep the
 * identity's hue family for recognition, and be unable to touch conduct.
 */

function rgb(hex: string): [number, number, number] {
  const v = hex.replace('#', '');
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

describe('operational-unit rendering (Article VIII)', () => {
  it('uses the pictogram parts — IRIS draws its own figure', () => {
    const identity = defaultGoldenProject().characters[0];
    const unit = unitRecipe(identity);
    expect(unit.parts.body).toBe('body-unit');
    expect(unit.parts.head).toBe('head-unit');
    expect(unit.parts.accessories).toEqual([]);
    expect(unit.id).toBe(identity.id); // same identity, different author
  });

  it('is fully anonymous at the head — one ink for every complexion', () => {
    const a = unitPalette({ skin: '#F1D6BE', hair: '#111111', outfitPrimary: '#107A53', outfitSecondary: '#444444', accent: '#555555' });
    const b = unitPalette({ skin: '#68422F', hair: '#C7CDD5', outfitPrimary: '#107A53', outfitSecondary: '#444444', accent: '#555555' });
    expect(a.skin).toBe(UNIT_INK);
    expect(b.skin).toBe(UNIT_INK);
    expect(a.hair).toBe(UNIT_INK);
  });

  it('keeps the identity hue family as a flat coding tone (cold ≠ grey)', () => {
    const green = codingHue('#107A53');
    const red = codingHue('#C7362E');
    const [gr, gg, gb] = rgb(green);
    const [rr, rg, rb] = rgb(red);
    expect(gg, 'green identity should stay green-dominant').toBeGreaterThan(gr);
    expect(gg).toBeGreaterThan(gb);
    expect(rr, 'red identity should stay red-dominant').toBeGreaterThan(rg);
    // …but normalized: very dark and very light sources land at one HSL
    // lightness (perceived luminance still varies by hue — blue < yellow —
    // which is fine; no unit may be *lighter or darker*, hue may differ).
    const lum = (c: [number, number, number]) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
    expect(Math.abs(lum(rgb(codingHue('#0F2A44'))) - lum(rgb(codingHue('#E8B84D'))))).toBeLessThan(45);
  });

  it('near-grey outfits fall back to the institutional coding tone', () => {
    expect(codingHue('#8A8A8A')).toBe('#6B7683');
  });

  it('cannot rewrite behavior: poses compose on the unit exactly as on the identity', () => {
    const { characters, style } = defaultGoldenProject();
    const unit = unitRecipe(characters[0]);
    const neutral = composeCharacter(unit, style, 'south', 128, 'normal', { badge: false, pose: 'neutral' });
    const point = composeCharacter(unit, style, 'south', 128, 'normal', { badge: false, pose: 'point' });
    expect(point).not.toBe(neutral); // the arm layer attached
    const slump = composeCharacter(unit, style, 'south', 128, 'normal', { badge: false, pose: 'slump' });
    expect(slump).toContain('translate(0 7)'); // head-drop transform passes through
  });

  it('the unit has no face — mood overlays draw nothing on it', () => {
    const { characters, style } = defaultGoldenProject();
    const unit = unitRecipe(characters[0]);
    // No eyes, no mood strokes: the warm head's ink-detail color never appears.
    const svg = composeCharacter(unit, style, 'south', 128, 'hostile', { badge: false });
    expect(svg).not.toContain('#2C2C2A');
  });

  it('ships the drawing spec so consumers can re-derive it (§3.17)', () => {
    const identity = defaultGoldenProject().characters[0];
    const spec = unitRenderingSpec(identity);
    expect(spec.author).toBe('iris');
    expect(spec.parts).toEqual(UNIT_PARTS);
    expect(spec.palette.skin).toBe(UNIT_INK);
  });
});

describe("the floor is IRIS's view", () => {
  it('composeSceneSvg draws agents as units by default; identity is opt-in', async () => {
    const { composeSceneSvg } = await import('../src/core/scene');
    const project = defaultGoldenProject();
    expect(project.scene?.entities.some((e) => e.kind === 'character'), 'golden scene has no characters').toBe(true);
    const floor = composeSceneSvg(project.scene!, project, 8);
    const authoring = composeSceneSvg(project.scene!, project, 8, { agents: 'identity' });
    expect(floor).toContain(UNIT_INK); // the featureless head disc
    expect(floor).not.toContain(project.characters[0].palette.skin.toUpperCase());
    expect(authoring).toContain(project.characters[0].palette.skin.toUpperCase());
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
