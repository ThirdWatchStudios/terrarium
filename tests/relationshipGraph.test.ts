import { describe, it, expect } from 'vitest';
import { generatePopulation } from '../src/core/employee';
import { generateEmployeePersona } from '../src/core/populationPersona';
import { generateRelationshipGraph, graphStats } from '../src/core/relationshipGraph';
import { buildOrgStructure } from '../src/core/orgStructure';
import { DEFAULT_DEPARTMENTS, DEFAULT_RELATIONSHIP_TYPES, DEFAULT_STYLE } from '../src/data/defaults';
import { validateProfile, type CharacterProfile } from '../src/core/profile';

/** A cast: `n` generated personas per generation-profile (department). */
function castFor(deptProfiles: string[], n: number): CharacterProfile[] {
  return deptProfiles.flatMap((dp) =>
    generatePopulation(n, dp, DEFAULT_STYLE, `cast-${dp}`).employees.map((e) => generateEmployeePersona(e)),
  );
}

const wired = (deptProfiles: string[], n: number, opts = {}): CharacterProfile[] =>
  generateRelationshipGraph(castFor(deptProfiles, n), { seed: 'S1', relationshipTypes: DEFAULT_RELATIONSHIP_TYPES, ...opts });

const catalogIds = new Set(DEFAULT_RELATIONSHIP_TYPES.map((t) => t.id));

describe('relationship-graph generation (Epic 3 / F3.3)', () => {
  it('is deterministic for a given seed', () => {
    const a = wired(['it', 'hr'], 8);
    const b = wired(['it', 'hr'], 8);
    expect(a.map((p) => p.relationships)).toEqual(b.map((p) => p.relationships));
  });

  it('uses only the existing relationship-type catalog', () => {
    for (const p of wired(['it', 'hr'], 10)) {
      for (const r of p.relationships) expect(catalogIds.has(r.relationshipType!), r.relationshipType).toBe(true);
    }
  });

  it('pre-wires dense intra-department ties (a wing knows itself)', () => {
    const cast = wired(['it'], 12); // single department → all intra
    const stats = graphStats(cast);
    expect(stats.inter).toBe(0);
    expect(stats.intra).toBeGreaterThan(0);
    // Most members end up connected to someone.
    expect(stats.connected).toBeGreaterThanOrEqual(cast.length - 1);
  });

  it('adds a sparser inter-department graph than the intra one', () => {
    const stats = graphStats(wired(['it', 'hr'], 14));
    expect(stats.inter).toBeGreaterThan(0); // cross-wing material exists
    expect(stats.intra).toBeGreaterThan(stats.inter); // but it is sparser than intra
  });

  it('density is tunable', () => {
    const dense = graphStats(wired(['it'], 12, { intraDensity: 0.95 }));
    const sparse = graphStats(wired(['it'], 12, { intraDensity: 0.1 }));
    expect(dense.intra).toBeGreaterThan(sparse.intra);
  });

  it('includes third-party-coupled types where the catalog declares them', () => {
    const thirdParty = new Set(DEFAULT_RELATIONSHIP_TYPES.filter((t) => t.thirdParty).map((t) => t.id));
    const used = new Set(wired(['it', 'hr'], 18).flatMap((p) => p.relationships.map((r) => r.relationshipType!)));
    expect([...used].some((t) => thirdParty.has(t))).toBe(true);
  });

  it('seniority-oriented reporting edges feed F2.3 (org chart gets reporting lines)', () => {
    const cast = wired(['accounting'], 8, { reportProbability: 1 });
    const org = buildOrgStructure({ departments: DEFAULT_DEPARTMENTS, profiles: cast });
    expect(org.contents.reportingLines.length).toBeGreaterThan(0);
    expect(org.contents.heads.accounting).toBeTruthy();
  });

  it('every generated edge is valid (axes in range, targets resolve)', () => {
    const cast = wired(['it', 'hr'], 10);
    const agentIds = cast.map((p) => p.agentId);
    for (const p of cast) expect(validateProfile(p, { agentIds }), p.agentId).toEqual([]);
  });
});
