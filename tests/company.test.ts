import { describe, it, expect } from 'vitest';
import {
  CULTURE_AXES,
  applyCompanyDerived,
  createDefaultCompany,
  deriveClimate,
  serializeCompany,
  validateCompany,
  type Company,
} from '../src/core/company';
import { MERIDIAN_DYNAMICS, REFERENCE_COMPANIES } from '../src/data/companies';

const clone = (c: Company): Company => structuredClone(c);

describe('Company model — round-trip & validation (F0.1)', () => {
  it('the reference company is valid', () => {
    expect(validateCompany(MERIDIAN_DYNAMICS)).toEqual([]);
  });

  it('every reference company exercises every culture axis and validates', () => {
    for (const c of REFERENCE_COMPANIES) {
      expect(validateCompany(c), c.companyId).toEqual([]);
      for (const a of CULTURE_AXES) expect(typeof c.culture[a]).toBe('number');
      expect(c.history.length).toBeGreaterThan(0);
      expect(c.narrative.openSecrets.length).toBeGreaterThan(0);
      expect(c.socialClimate.rivalries.length).toBeGreaterThan(0);
    }
  });

  it('JSON-serializes and deserializes with no loss', () => {
    const round = JSON.parse(JSON.stringify(MERIDIAN_DYNAMICS)) as Company;
    expect(round).toEqual(MERIDIAN_DYNAMICS);
  });

  it('serializeCompany resolves climate to plain numbers and drops authored flags', () => {
    const out = serializeCompany(MERIDIAN_DYNAMICS) as any;
    expect(typeof out.climate.factionalism).toBe('number');
    expect(typeof out.climate.fear).toBe('number');
    expect(typeof out.climate.volatility).toBe('number');
    expect(out.meta.generator).toBe('sprite-character-creator');
  });

  it('flags out-of-range and self-referential fields', () => {
    const bad = clone(MERIDIAN_DYNAMICS);
    bad.culture.fear = 140;
    bad.socialClimate.rivalries.push({ a: 'X', b: 'X' });
    const issues = validateCompany(bad);
    expect(issues.some((i) => i.includes('culture.fear'))).toBe(true);
    expect(issues.some((i) => i.includes('itself'))).toBe(true);
  });
});

describe('Company climate aggregates (F0.1 / S0.1.2)', () => {
  it('derives deterministically and idempotently', () => {
    const a = applyCompanyDerived(clone(MERIDIAN_DYNAMICS));
    const b = applyCompanyDerived(applyCompanyDerived(clone(MERIDIAN_DYNAMICS)));
    expect(a.climate).toEqual(b.climate);
    const direct = deriveClimate(MERIDIAN_DYNAMICS);
    expect(a.climate.factionalism.value).toBe(direct.factionalism);
    expect(a.climate.fear.value).toBe(direct.fear);
    expect(a.climate.volatility.value).toBe(direct.volatility);
  });

  it('a fearful, low-trust, declining incumbent reads as high-fear, high-factionalism', () => {
    const c = applyCompanyDerived(clone(MERIDIAN_DYNAMICS));
    expect(c.climate.fear.value).toBeGreaterThan(60);
    expect(c.climate.factionalism.value).toBeGreaterThan(60);
  });

  it('authored climate overrides win and survive re-derivation', () => {
    const c = clone(MERIDIAN_DYNAMICS);
    c.climate.fear = { value: 12, authored: true };
    applyCompanyDerived(c);
    expect(c.climate.fear.value).toBe(12);
    // non-authored siblings still recompute
    expect(c.climate.factionalism.authored).toBe(false);
  });

  it('a neutral company sits mid-scale on every aggregate', () => {
    const c = createDefaultCompany('neutral_co', 'Neutral Co');
    for (const v of [c.climate.factionalism.value, c.climate.fear.value, c.climate.volatility.value]) {
      expect(v).toBeGreaterThan(30);
      expect(v).toBeLessThan(70);
    }
  });
});
