import { describe, it, expect } from 'vitest';
import {
  clampProfile,
  clearPresenceMood,
  createDefaultProfile,
  MODULATED_MOODS,
  normalizePresenceMoods,
  serializeProfile,
  setPresenceMood,
  setPresenceMoodMap,
  validateProfile,
} from '../src/core/profile';
import { DEFAULT_MOOD_EXPRESSION, moodExpressionDefault } from '../src/data/presenceMoodDefaults';
import { DEFAULT_CAST } from '../src/data/defaults';

const agentIds = DEFAULT_CAST.map((c) => c.id);

describe('per-mood presence modulation (§5.8)', () => {
  it('a fresh profile has no mood map (absent ⇒ no modulation), and stays valid', () => {
    const p = createDefaultProfile(DEFAULT_CAST[0]);
    expect(p.presenceMoods).toBeUndefined();
    expect(validateProfile(p, { agentIds })).toEqual([]);
  });

  it('`normal` is excluded from the modulatable moods (it is the baseline)', () => {
    expect(MODULATED_MOODS).not.toContain('normal');
    expect(MODULATED_MOODS).toContain('anxious');
  });

  it('setPresenceMood writes a delta and prunes the map back to absent on zero', () => {
    const p = createDefaultProfile(DEFAULT_CAST[0]);
    setPresenceMood(p, 'anxious', 'restlessness', 20);
    expect(p.presenceMoods?.anxious?.restlessness).toBe(20);
    setPresenceMood(p, 'anxious', 'restlessness', 0); // clears
    expect(p.presenceMoods).toBeUndefined(); // last entry gone ⇒ whole map pruned
  });

  it('clamps bipolar deltas into −100..100', () => {
    const p = createDefaultProfile(DEFAULT_CAST[0]);
    setPresenceMood(p, 'anxious', 'personalSpace', -250);
    expect(p.presenceMoods?.anxious?.personalSpace).toBe(-100);
    expect(validateProfile(p, { agentIds })).toEqual([]);
  });

  it('setPresenceMoodMap replaces a mood with a template, dropping zeros', () => {
    const p = createDefaultProfile(DEFAULT_CAST[0]);
    setPresenceMood(p, 'anxious', 'latency', 30); // pre-existing, should be replaced
    setPresenceMoodMap(p, 'anxious', moodExpressionDefault('anxious'));
    expect(p.presenceMoods?.anxious).toEqual(DEFAULT_MOOD_EXPRESSION.anxious);
    expect(p.presenceMoods?.anxious?.latency).toBe(DEFAULT_MOOD_EXPRESSION.anxious.latency);
  });

  it('clearPresenceMood removes one mood and prunes when the map empties', () => {
    const p = createDefaultProfile(DEFAULT_CAST[0]);
    setPresenceMoodMap(p, 'confident', moodExpressionDefault('confident'));
    setPresenceMoodMap(p, 'anxious', moodExpressionDefault('anxious'));
    clearPresenceMood(p, 'confident');
    expect(p.presenceMoods?.confident).toBeUndefined();
    expect(p.presenceMoods?.anxious).toBeDefined();
    clearPresenceMood(p, 'anxious');
    expect(p.presenceMoods).toBeUndefined();
  });

  it('the same mood can carry opposite deltas on two bodies (the whole point)', () => {
    const pacer = createDefaultProfile(DEFAULT_CAST[0]);
    const freezer = createDefaultProfile(DEFAULT_CAST[1]);
    setPresenceMood(pacer, 'anxious', 'restlessness', 25);
    setPresenceMood(freezer, 'anxious', 'restlessness', -25);
    expect(pacer.presenceMoods!.anxious!.restlessness).toBeGreaterThan(0);
    expect(freezer.presenceMoods!.anxious!.restlessness).toBeLessThan(0);
  });

  it('normalize/clamp drop empty moods and zero channels', () => {
    const messy = { anxious: { restlessness: 20, latency: 0 }, confident: {}, normal: { gaitSpeed: 9 } } as any;
    const norm = normalizePresenceMoods(messy);
    expect(norm.anxious).toEqual({ restlessness: 20 }); // zero latency dropped
    expect(norm.confident).toBeUndefined(); // empty mood dropped
    expect((norm as any).normal).toBeUndefined(); // baseline never modulated
  });

  it('serializeProfile emits sparse moods, omitting the key entirely when none authored', () => {
    const none = createDefaultProfile(DEFAULT_CAST[0]);
    expect('presenceMoods' in (serializeProfile(none) as any)).toBe(false);

    const some = createDefaultProfile(DEFAULT_CAST[0]);
    setPresenceMoodMap(some, 'slighted', moodExpressionDefault('slighted'));
    const out = serializeProfile(some) as any;
    expect(out.presenceMoods.slighted.personalSpace).toBe(DEFAULT_MOOD_EXPRESSION.slighted.personalSpace);
    expect(out.presenceMoods.normal).toBeUndefined();
  });

  it('clampProfile prunes an emptied map back to absent', () => {
    const p = createDefaultProfile(DEFAULT_CAST[0]);
    p.presenceMoods = { anxious: {}, confident: { gaitSpeed: 0 } };
    clampProfile(p);
    expect(p.presenceMoods).toBeUndefined();
  });
});
