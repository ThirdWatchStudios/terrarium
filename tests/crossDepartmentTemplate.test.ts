import { describe, it, expect } from 'vitest';
import { castTemplate, validateScenarioTemplate } from '../src/core/scenarioTemplate';
import { THE_TURF_WAR } from '../src/data/roleTemplates';
import { cascadeCompany } from '../src/core/companyCascade';
import { createDefaultCompany } from '../src/core/company';
import { DEFAULT_DEPARTMENTS, DEFAULT_STYLE, DEFAULT_RELATIONSHIP_TYPES, DEFAULT_PROFILES } from '../src/data/defaults';
import { validateScenario } from '../src/core/scenario';

/** A generated multi-department org (deterministic for a fixed seed). */
function generatedOrg(seed = 'turf-1', headcount = 48) {
  const c = createDefaultCompany('acme', 'Acme');
  c.identity.headcount = headcount;
  c.identity.industry = 'Software';
  c.culture.cutthroat = 80; // a competitive culture → ambitious, rivalrous cohort
  return cascadeCompany(c, {
    catalog: DEFAULT_DEPARTMENTS,
    style: DEFAULT_STYLE,
    relationshipTypes: DEFAULT_RELATIONSHIP_TYPES,
    maxSeats: 48,
    seed,
  });
}

const deptOf = (profiles: typeof DEFAULT_PROFILES, id: string) =>
  profiles.find((p) => p.agentId === id)!.identity.department;

describe('F4.5 — the cross-department reference template (S4.5.1)', () => {
  it('THE_TURF_WAR validates clean', () => {
    expect(validateScenarioTemplate(THE_TURF_WAR)).toEqual([]);
  });

  it('requires two slots in different departments (the cross-wing pairing)', () => {
    const crossPred = THE_TURF_WAR.roles
      .find((r) => r.roleId === 'rivalA')!
      .preconditions.find((p) => p.kind === 'crossDepartment');
    expect(crossPred).toMatchObject({ kind: 'crossDepartment', toRole: 'rivalB', relation: 'different' });
  });

  it('casts onto the default cast across the operations / management boundary', () => {
    const result = castTemplate(THE_TURF_WAR, DEFAULT_PROFILES);
    expect(result.ok).toBe(true);
    const a = result.report.assignments.find((x) => x.roleId === 'rivalA')!.agentId!;
    const b = result.report.assignments.find((x) => x.roleId === 'rivalB')!.agentId!;
    expect(deptOf(DEFAULT_PROFILES, a)).not.toBe(deptOf(DEFAULT_PROFILES, b));
    // the only cross-department pair in the default cast involves the manager.
    expect([a, b]).toContain('manager');
  });
});

describe('F4.5 — casting against a generated multi-department org (S4.5.2)', () => {
  it('fills the rivals from two different departments and emits a valid scenario', () => {
    const org = generatedOrg();
    // sanity: the generated org actually spans multiple departments.
    const depts = new Set(org.profiles.map((p) => p.identity.department).filter(Boolean));
    expect(depts.size).toBeGreaterThan(1);

    const result = castTemplate(THE_TURF_WAR, org.profiles);
    expect(result.ok).toBe(true);

    const a = result.report.assignments.find((x) => x.roleId === 'rivalA')!.agentId!;
    const b = result.report.assignments.find((x) => x.roleId === 'rivalB')!.agentId!;
    // the department precondition held: the two rivals resolve to different wings.
    expect(deptOf(org.profiles, a)).not.toBe(deptOf(org.profiles, b));
    // both rivals clear the ambition threshold (the intrinsic half of the vocabulary).
    expect(org.profiles.find((p) => p.agentId === a)!.personality.axes.ambition).toBeGreaterThanOrEqual(50);
    expect(org.profiles.find((p) => p.agentId === b)!.personality.axes.ambition).toBeGreaterThanOrEqual(50);

    // the emitted bound scenario is internally valid against the generated cast.
    const agentIds = org.profiles.map((p) => p.agentId);
    expect(validateScenario(result.scenario!, { agentIds })).toEqual([]);
  });

  it('is deterministic for a fixed seed', () => {
    const a = castTemplate(THE_TURF_WAR, generatedOrg('seed-x').profiles).report.assignments;
    const b = castTemplate(THE_TURF_WAR, generatedOrg('seed-x').profiles).report.assignments;
    expect(a).toEqual(b);
  });

  it('cannot cast when the whole cohort is one department (cross-wing pairing impossible)', () => {
    const org = generatedOrg();
    const topDept = org.profiles[0].identity.department;
    const oneWing = org.profiles.filter((p) => p.identity.department === topDept);
    const result = castTemplate(THE_TURF_WAR, oneWing);
    expect(result.ok).toBe(false);
    expect(result.report.unfilledRequired).toContain('rivalB');
  });
});
