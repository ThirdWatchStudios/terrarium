import { describe, it, expect } from 'vitest';
import { CULTURE_AXES, validateCompany } from '../src/core/company';
import { generateCompany, validateCompanyArchetype } from '../src/core/companyTemplate';
import {
  COMPANY_ARCHETYPES,
  DECLINING_INCUMBENT,
  HYPERGROWTH_STARTUP,
} from '../src/data/companyArchetypes';

describe('company archetypes — authoring validation (F0.2)', () => {
  it('every starter archetype is valid', () => {
    for (const a of COMPANY_ARCHETYPES) {
      expect(validateCompanyArchetype(a), `archetype "${a.id}"`).toEqual([]);
    }
  });

  it('flags bad ranges', () => {
    const issues = validateCompanyArchetype({
      ...DECLINING_INCUMBENT,
      culture: { fear: [90, 10] },
      mission: { ...DECLINING_INCUMBENT.mission, statedMissions: [] },
    });
    expect(issues.some((i) => i.includes('min > max'))).toBe(true);
    expect(issues.some((i) => i.includes('stated missions'))).toBe(true);
  });
});

describe('generateCompany (F0.2 / S0.2.1)', () => {
  it('is deterministic — same archetype + seed → byte-identical output', () => {
    const a = generateCompany(DECLINING_INCUMBENT, 'seed-A');
    const b = generateCompany(DECLINING_INCUMBENT, 'seed-A');
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('different seeds produce different companies', () => {
    const a = generateCompany(DECLINING_INCUMBENT, 'seed-A');
    const b = generateCompany(DECLINING_INCUMBENT, 'seed-B');
    expect(a).not.toEqual(b);
  });

  it('generated companies are always valid and respect culture ranges', () => {
    for (let i = 0; i < 25; i++) {
      const c = generateCompany(HYPERGROWTH_STARTUP, `s${i}`);
      expect(validateCompany(c), `seed s${i}`).toEqual([]);
      // Hierarchy range is [10, 30] on this archetype.
      expect(c.culture.hierarchy).toBeGreaterThanOrEqual(10);
      expect(c.culture.hierarchy).toBeLessThanOrEqual(30);
      for (const a of CULTURE_AXES) {
        expect(c.culture[a]).toBeGreaterThanOrEqual(0);
        expect(c.culture[a]).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe('two reference archetypes diverge (F0.2 / S0.2.2)', () => {
  it('the incumbent and the startup differ on load-bearing axes and economy', () => {
    // Average across seeds to compare the archetypes, not two single samples.
    const seeds = Array.from({ length: 20 }, (_, i) => `d${i}`);
    const avg = (arch: typeof DECLINING_INCUMBENT, sel: (c: ReturnType<typeof generateCompany>) => number) =>
      seeds.reduce((s, k) => s + sel(generateCompany(arch, k)), 0) / seeds.length;

    const incHierarchy = avg(DECLINING_INCUMBENT, (c) => c.culture.hierarchy);
    const startHierarchy = avg(HYPERGROWTH_STARTUP, (c) => c.culture.hierarchy);
    expect(incHierarchy).toBeGreaterThan(startHierarchy + 30);

    const incMercenary = avg(DECLINING_INCUMBENT, (c) => c.culture.mercenary);
    const startMercenary = avg(HYPERGROWTH_STARTUP, (c) => c.culture.mercenary);
    expect(incMercenary).toBeGreaterThan(startMercenary);

    const incHealth = avg(DECLINING_INCUMBENT, (c) => c.economy.financialHealth);
    const startHealth = avg(HYPERGROWTH_STARTUP, (c) => c.economy.financialHealth);
    expect(startHealth).toBeGreaterThan(incHealth);

    const incFear = avg(DECLINING_INCUMBENT, (c) => c.climate.fear.value);
    const startFear = avg(HYPERGROWTH_STARTUP, (c) => c.climate.fear.value);
    expect(incFear).toBeGreaterThan(startFear + 15);
  });
});

describe('dials and blend (F0.2 / S0.2.3)', () => {
  it('dials override sampled fields deterministically', () => {
    const c = generateCompany(DECLINING_INCUMBENT, 'seed-A', {
      dials: { sizeBand: 'startup', industry: 'Software', financialHealthAdj: 40, cultureBias: { hierarchy: -50 } },
    });
    expect(c.identity.sizeBand).toBe('startup');
    expect(c.identity.industry).toBe('Software');
    const baseline = generateCompany(DECLINING_INCUMBENT, 'seed-A');
    expect(c.economy.financialHealth).toBeGreaterThanOrEqual(baseline.economy.financialHealth);
    expect(c.culture.hierarchy).toBeLessThan(baseline.culture.hierarchy);
    // Same dials reproduce identical output.
    const c2 = generateCompany(DECLINING_INCUMBENT, 'seed-A', {
      dials: { sizeBand: 'startup', industry: 'Software', financialHealthAdj: 40, cultureBias: { hierarchy: -50 } },
    });
    expect(JSON.stringify(c)).toBe(JSON.stringify(c2));
  });

  it('blending pulls culture toward the secondary archetype', () => {
    const seeds = Array.from({ length: 20 }, (_, i) => `b${i}`);
    const avgHierarchy = (blendW: number) =>
      seeds.reduce(
        (s, k) =>
          s +
          generateCompany(DECLINING_INCUMBENT, k, blendW > 0 ? { blend: { archetype: HYPERGROWTH_STARTUP, weight: blendW } } : {}).culture.hierarchy,
        0,
      ) / seeds.length;
    // The startup is flat (low hierarchy); blending toward it lowers the incumbent's.
    expect(avgHierarchy(0.5)).toBeLessThan(avgHierarchy(0));
  });
});
