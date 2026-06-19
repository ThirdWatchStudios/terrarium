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

// --- F3.3 history-seeding hook (the Epic 0 `E3_relationships` cascade seam) ---

/** Count cross-department edges of a given relationship type. */
function interTypeCount(cast: CharacterProfile[], type: string): number {
  const deptOf = new Map(cast.map((p) => [p.agentId, p.identity.department || '__u__']));
  let n = 0;
  for (const p of cast) {
    for (const r of p.relationships) {
      if (r.relationshipType === type && deptOf.get(r.targetAgentId) !== deptOf.get(p.agentId)) n++;
    }
  }
  return n;
}

const edgeBetween = (p: CharacterProfile | undefined, targetId: string) =>
  p?.relationships.filter((r) => r.targetAgentId === targetId) ?? [];

describe('relationship-graph history-seeding hook (F3.3 seam → F0.6)', () => {
  it('plants a seeded edge with the right type/tags and a reciprocal, deterministically', () => {
    const base = castFor(['it'], 4);
    const [a, b] = base.map((p) => p.agentId);
    const seedEdges = [
      { sourceAgentId: a, targetAgentId: b, relationshipType: 'rival', tags: ['history:layoff-2023'] },
    ];
    const run = () =>
      generateRelationshipGraph(castFor(['it'], 4), {
        seed: 'S1',
        relationshipTypes: DEFAULT_RELATIONSHIP_TYPES,
        seedEdges,
      });
    const cast = run();
    const byId = new Map(cast.map((p) => [p.agentId, p]));
    const fwd = edgeBetween(byId.get(a), b);
    const rev = edgeBetween(byId.get(b), a);
    expect(fwd).toHaveLength(1);
    expect(fwd[0].relationshipType).toBe('rival');
    expect(fwd[0].tags).toContain('history:layoff-2023');
    expect(rev[0]?.relationshipType).toBe('rival'); // reciprocal of rival is rival
    expect(rev[0]?.tags).toContain('history:layoff-2023');
    // Deterministic.
    const again = run();
    expect(again.map((p) => p.relationships)).toEqual(cast.map((p) => p.relationships));
  });

  it('seeded edges win over the procedural pass (not duplicated/overwritten)', () => {
    const base = castFor(['it'], 6);
    const [a, b] = base.map((p) => p.agentId);
    const cast = generateRelationshipGraph(castFor(['it'], 6), {
      seed: 'S1',
      relationshipTypes: DEFAULT_RELATIONSHIP_TYPES,
      intraDensity: 1, // procedural would otherwise wire every pair
      seedEdges: [{ sourceAgentId: a, targetAgentId: b, relationshipType: 'rival' }],
    });
    const byId = new Map(cast.map((p) => [p.agentId, p]));
    const fwd = edgeBetween(byId.get(a), b);
    expect(fwd).toHaveLength(1); // exactly one edge a→b, and it is the seeded one
    expect(fwd[0].relationshipType).toBe('rival');
  });

  it('maps the reciprocal type and honors secret/secretByDefault', () => {
    const base = castFor(['it'], 3);
    const [a, b] = base.map((p) => p.agentId);
    const cast = generateRelationshipGraph(castFor(['it'], 3), {
      seed: 'S1',
      relationshipTypes: DEFAULT_RELATIONSHIP_TYPES,
      seedEdges: [
        { sourceAgentId: a, targetAgentId: b, relationshipType: 'mentor' }, // reciprocal → protege
      ],
    });
    const byId = new Map(cast.map((p) => [p.agentId, p]));
    expect(edgeBetween(byId.get(a), b)[0].relationshipType).toBe('mentor');
    expect(edgeBetween(byId.get(b), a)[0].relationshipType).toBe('protege');

    // A secretByDefault catalog type (romance) seeds a secret edge without an explicit flag.
    const cast2 = generateRelationshipGraph(castFor(['it'], 3), {
      seed: 'S1',
      relationshipTypes: DEFAULT_RELATIONSHIP_TYPES,
      seedEdges: [{ sourceAgentId: a, targetAgentId: b, relationshipType: 'romance' }],
    });
    const e = edgeBetween(new Map(cast2.map((p) => [p.agentId, p])).get(a), b)[0];
    expect(e.secret).toBe(true);
  });

  it('ignores seeded edges that reference a missing or self agent', () => {
    const a = castFor(['it'], 2).map((p) => p.agentId)[0];
    const cast = generateRelationshipGraph(castFor(['it'], 2), {
      seed: 'S1',
      relationshipTypes: DEFAULT_RELATIONSHIP_TYPES,
      seedEdges: [
        { sourceAgentId: a, targetAgentId: 'emp-DOES-NOT-EXIST', relationshipType: 'rival' },
        { sourceAgentId: a, targetAgentId: a, relationshipType: 'rival' },
      ],
    });
    const agentIds = cast.map((p) => p.agentId);
    for (const p of cast) expect(validateProfile(p, { agentIds }), p.agentId).toEqual([]);
  });

  it('higher factionalism skews inter-department ties toward rivalry', () => {
    const opts = { interDensity: 0.6, relationshipTypes: DEFAULT_RELATIONSHIP_TYPES };
    const factional = wired(['it', 'hr'], 14, { ...opts, climate: { factionalism: 95 } });
    const cohesive = wired(['it', 'hr'], 14, { ...opts, climate: { factionalism: 5 } });
    expect(interTypeCount(factional, 'rival')).toBeGreaterThan(interTypeCount(cohesive, 'rival'));
    // ...and fewer cross-wing alliances when factional.
    expect(interTypeCount(factional, 'ally')).toBeLessThanOrEqual(interTypeCount(cohesive, 'ally'));
  });

  it('neutral factionalism (50) leaves the graph unchanged', () => {
    const neutral = wired(['it', 'hr'], 12, { climate: { factionalism: 50 } });
    const plain = wired(['it', 'hr'], 12);
    expect(neutral.map((p) => p.relationships)).toEqual(plain.map((p) => p.relationships));
  });
});
