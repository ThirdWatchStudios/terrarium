import { describe, it, expect } from 'vitest';
import { createDefaultCompany, applyCompanyDerived, CULTURE_AXES, type Company, type CompanyEvent } from '../src/core/company';
import { cascadeCompany, type CascadeResult } from '../src/core/companyCascade';
import { validateSeed } from '../src/core/seedValidation';
import { DEFAULT_DEPARTMENTS, DEFAULT_STYLE, DEFAULT_RELATIONSHIP_TYPES } from '../src/data/defaults';
import { ROLE_TEMPLATES } from '../src/data/roleTemplates';

const RTO: CompanyEvent = { id: 'rto', title: 'Return to office', description: '', kind: 'return_to_office', when: 'recent', magnitude: 80, visibility: 'public', involvedDepartments: [] };

function neutralize(c: Company): Company {
  const n = structuredClone(c);
  for (const a of CULTURE_AXES) n.culture[a] = 50;
  return applyCompanyDerived(n);
}

const cascadeOpts = (seed: string) => ({
  catalog: DEFAULT_DEPARTMENTS, style: DEFAULT_STYLE, relationshipTypes: DEFAULT_RELATIONSHIP_TYPES,
  scenarioLibrary: ROLE_TEMPLATES, maxSeats: 48, seed,
});

/** Build a generated seed + its neutral-culture baseline (the divergence reference). */
function buildSeed(mutate: (c: Company) => void, seed = 's1'): { result: CascadeResult; neutral: CascadeResult } {
  const c = createDefaultCompany('acme', 'Acme');
  c.identity.headcount = 48;
  c.identity.industry = 'Software';
  mutate(c);
  applyCompanyDerived(c);
  return { result: cascadeCompany(c, cascadeOpts(seed)), neutral: cascadeCompany(neutralize(c), cascadeOpts(seed)) };
}

/** A characterful, dramatic seed: strong culture + a history that grounds a castable scenario. */
const goodSeed = () => buildSeed((c) => { c.culture.cutthroat = 88; c.culture.secrecy = 82; c.culture.fear = 78; c.history = [RTO]; });
/** A flat seed: neutral culture, no grounding history. */
const flatSeed = () => buildSeed(() => {});

describe('F0.10 — seed go/no-go validation', () => {
  it('passes a sound, covered, diverged, dramatic seed (S0.10.3)', () => {
    const { result, neutral } = goodSeed();
    const v = validateSeed(result, { library: ROLE_TEMPLATES, neutralProfiles: neutral.profiles });
    expect(v.soundness.sound).toBe(true);
    expect(v.coverage.adequate).toBe(true);
    expect(v.drama.diverged).toBe(true);
    expect(v.drama.dramatic).toBe(true);
    expect(v.ok).toBe(true);
    expect(v.issues).toEqual([]);
  });

  it('fails a flat seed on divergence and drama (S0.10.3)', () => {
    const { result, neutral } = flatSeed();
    const v = validateSeed(result, { library: ROLE_TEMPLATES, neutralProfiles: neutral.profiles });
    expect(v.ok).toBe(false);
    expect(v.drama.diverged).toBe(false);     // neutral culture → no shift
    expect(v.drama.dramatic).toBe(false);     // no grounded castable scenario
    expect(v.issues.length).toBeGreaterThanOrEqual(2);
  });

  it('flags a dangling history edge (S0.10.1)', () => {
    const { result, neutral } = goodSeed();
    result.profiles[0].relationships.push({
      targetAgentId: 'ghost-agent', trust: 50, suspicion: 0, affinity: 0, influence: 0, respect: 50, familiarity: 0,
      relationshipType: 'rival', tags: ['history:ghost'],
    });
    const v = validateSeed(result, { library: ROLE_TEMPLATES, neutralProfiles: neutral.profiles });
    expect(v.soundness.danglingEdges.length).toBeGreaterThan(0);
    expect(v.soundness.sound).toBe(false);
    expect(v.ok).toBe(false);
  });

  it('flags thin coverage when the threshold is raised (S0.10.2)', () => {
    const { result } = goodSeed();
    // Require every template castable — the contested-promotion role can't fill a generated cohort.
    const v = validateSeed(result, { library: ROLE_TEMPLATES, minCoverageRatio: 1 });
    expect(v.coverage.adequate).toBe(false);
    expect(v.ok).toBe(false);
  });

  it('skips the divergence check when no neutral baseline is given', () => {
    const { result } = goodSeed();
    const v = validateSeed(result, { library: ROLE_TEMPLATES });
    expect(v.drama.divergence).toBeNull();
    expect(v.drama.diverged).toBe(true); // not checked → not blocking
  });

  it('is deterministic', () => {
    const { result, neutral } = goodSeed();
    const a = validateSeed(result, { library: ROLE_TEMPLATES, neutralProfiles: neutral.profiles });
    const b = validateSeed(result, { library: ROLE_TEMPLATES, neutralProfiles: neutral.profiles });
    expect(a).toEqual(b);
  });
});
