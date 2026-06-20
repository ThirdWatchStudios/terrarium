import { describe, it, expect } from 'vitest';
import {
  castTemplate,
  validateScenarioTemplate,
  type ScenarioTemplate,
  type Precondition,
  type DistanceContext,
} from '../src/core/scenarioTemplate';
import { THE_TURF_WAR } from '../src/data/roleTemplates';
import { DEFAULT_CAST, DEFAULT_PROFILES, DEFAULT_DEPARTMENTS, DEFAULT_STYLE, DEFAULT_RELATIONSHIP_TYPES } from '../src/data/defaults';
import { createDefaultProfile, type CharacterProfile, type Relationship } from '../src/core/profile';
import { cascadeCompany } from '../src/core/companyCascade';
import { createDefaultCompany } from '../src/core/company';

const tpl = (over: Partial<ScenarioTemplate>): ScenarioTemplate => ({
  templateId: 't', title: 'T', summary: '', triggering: 'emerge',
  emotionalPayload: { targetEmotions: ['x'], description: '' },
  roles: [], roleSeeds: [], locations: [], roleSpawns: [], truthFacts: [], informationItems: [],
  interventionTypes: [], variants: [], defaultVariantId: '',
  objective: { objectiveId: 'o', label: '', category: 'culture', desiredPressure: '', intendedObservableBehavior: '', kpi: '', expectedEvidence: [] },
  ...over,
});
const role = (roleId: string, preconditions: Precondition[], required = true) => ({ roleId, label: roleId, description: '', required, preconditions });

const managerEdge = (targetAgentId: string): Relationship => ({
  targetAgentId, relationshipType: 'manager', trust: 50, suspicion: 0, affinity: 0, influence: 0, respect: 50, familiarity: 50, tags: [],
});

/** Build a profile with a forced id, department, and (optional) "reports-to" manager edge. */
function mkProfile(agentId: string, department: string, managerId?: string): CharacterProfile {
  const p = createDefaultProfile(DEFAULT_CAST[0]);
  p.agentId = agentId;
  p.identity.department = department;
  p.relationships = managerId ? [managerEdge(managerId)] : [];
  return p;
}

// A 5-person org: ceo ← headA ← repA (sales), ceo ← headB ← repB (engineering).
// Structural (undirected reporting-tree) hops → normalized /6*100:
//   repA↔repB = 4 hops = 66.67   headA↔headB = 2 = 33.33   repA↔ceo = 2 = 33.33
const ORG = [mkProfile('ceo', 'exec'), mkProfile('headA', 'sales', 'ceo'), mkProfile('repA', 'sales', 'headA'), mkProfile('headB', 'eng', 'ceo'), mkProfile('repB', 'eng', 'headB')];
const pairOf = (r: ReturnType<typeof castTemplate>) => new Set(r.report.assignments.map((a) => a.agentId));

describe('F4.3 — structural organizational distance', () => {
  it('a hard threshold admits only a sufficiently distant pair', () => {
    // distance ≥ 60 (≈3.6 hops) → only repA↔repB (4 hops = 66.67) qualifies.
    const t = tpl({ roles: [role('a', []), role('b', [{ kind: 'distance', toRole: 'a', op: 'gte', value: 60 }])] });
    const result = castTemplate(t, ORG);
    expect(result.ok).toBe(true);
    expect(pairOf(result)).toEqual(new Set(['repA', 'repB']));
    // the resolved distance is surfaced in the report for payload scaling.
    expect(result.report.distances).toContainEqual({ fromRole: 'b', toRole: 'a', source: 'structural', value: 66.67 });
  });

  it('a soft weight prefers the most organizationally-distant pairing', () => {
    const t = tpl({ roles: [role('a', []), role('b', [{ kind: 'distance', toRole: 'a', weight: 1 }])] });
    const result = castTemplate(t, ORG);
    expect(result.ok).toBe(true);
    // no gate — but the weight steers the cast to the farthest pair.
    expect(pairOf(result)).toEqual(new Set(['repA', 'repB']));
  });

  it('an unknown structural distance is inert (never blocks the cast)', () => {
    // the default cast has no reporting edges → every pair is unreachable → distance unknown.
    const t = tpl({ roles: [role('a', []), role('b', [{ kind: 'distance', toRole: 'a', op: 'gte', value: 90 }])] });
    const result = castTemplate(t, DEFAULT_PROFILES);
    expect(result.ok).toBe(true); // not blocked despite the steep threshold
    expect(result.report.distances.every((d) => d.value === null)).toBe(true);
  });
});

describe('F4.3 — spatial organizational distance', () => {
  // wings in a line: w1 — w2 — w3, agents x@w1 and y@w3 → 2 hops = 33.33.
  const x = mkProfile('x', 'sales');
  const y = mkProfile('y', 'eng');
  const ctx: DistanceContext = {
    wingOfAgent: { x: 'w1', y: 'w3' },
    connectivity: [{ wings: ['w1', 'w2'] }, { wings: ['w2', 'w3'] }],
  };
  const spatialTpl = tpl({ roles: [role('a', []), role('b', [{ kind: 'distance', toRole: 'a', source: 'spatial', op: 'gte', value: 30 }])] });

  it('reads the wing-connectivity graph when a spatial context is supplied', () => {
    const result = castTemplate(spatialTpl, [x, y], { distance: ctx });
    expect(result.ok).toBe(true);
    expect(result.report.distances).toContainEqual({ fromRole: 'b', toRole: 'a', source: 'spatial', value: 33.33 });
  });

  it('a spatial term with no spatial context reads as unknown (inert)', () => {
    const result = castTemplate(spatialTpl, [x, y]); // no distance context
    expect(result.ok).toBe(true); // threshold can't block an unknown distance
    expect(result.report.distances.every((d) => d.value === null)).toBe(true);
  });
});

describe('F4.3 — distance precondition validation', () => {
  it('flags self-reference, an unknown source, a half-specified threshold, and an empty term', () => {
    const t = tpl({
      roles: [
        role('a', [{ kind: 'distance', toRole: 'a', weight: 1 }]),                       // self-reference
        role('b', [{ kind: 'distance', toRole: 'a', source: 'sideways' as any, weight: 1 }]), // bad source
        role('c', [{ kind: 'distance', toRole: 'a', op: 'gte' } as any]),                  // op without value
        role('d', [{ kind: 'distance', toRole: 'a' }]),                                    // neither threshold nor weight
      ],
    });
    const issues = validateScenarioTemplate(t);
    expect(issues.some((i) => i.includes('references itself'))).toBe(true);
    expect(issues.some((i) => i.includes('unknown source'))).toBe(true);
    expect(issues.some((i) => i.includes('without both op and value'))).toBe(true);
    expect(issues.some((i) => i.includes('neither a threshold'))).toBe(true);
  });

  it('a well-formed distance term (hard + soft together) validates clean', () => {
    const t = tpl({ roles: [role('a', []), role('b', [{ kind: 'distance', toRole: 'a', source: 'structural', op: 'gte', value: 40, weight: 0.5 }])] });
    expect(validateScenarioTemplate(t)).toEqual([]);
  });
});

describe('F4.3 — THE_TURF_WAR distance term (closes F4.5 distance AC)', () => {
  it('carries a soft structural distance term and still validates clean', () => {
    const distPre = THE_TURF_WAR.roles.find((r) => r.roleId === 'rivalA')!.preconditions.find((p) => p.kind === 'distance');
    expect(distPre).toMatchObject({ kind: 'distance', toRole: 'rivalB', source: 'structural', weight: 0.5 });
    expect(validateScenarioTemplate(THE_TURF_WAR)).toEqual([]);
  });

  it('still casts on the default cast (soft term is inert without reporting edges)', () => {
    const result = castTemplate(THE_TURF_WAR, DEFAULT_PROFILES);
    expect(result.ok).toBe(true);
    expect(result.report.distances.find((d) => d.fromRole === 'rivalA')!.value).toBeNull();
  });

  it('resolves a real distance against a generated multi-department org', () => {
    const c = createDefaultCompany('acme', 'Acme');
    c.identity.headcount = 48; c.identity.industry = 'Software'; c.culture.cutthroat = 80;
    const org = cascadeCompany(c, { catalog: DEFAULT_DEPARTMENTS, style: DEFAULT_STYLE, relationshipTypes: DEFAULT_RELATIONSHIP_TYPES, maxSeats: 48, seed: 'turf-1' });
    const result = castTemplate(THE_TURF_WAR, org.profiles);
    expect(result.ok).toBe(true);
    const d = result.report.distances.find((x) => x.fromRole === 'rivalA' && x.toRole === 'rivalB')!;
    expect(d.source).toBe('structural');
    expect(d.value).not.toBeNull();
    expect(d.value!).toBeGreaterThan(0);
  });
});
