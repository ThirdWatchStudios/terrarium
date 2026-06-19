import { describe, it, expect } from 'vitest';
import { generateEmployee, generatePopulation } from '../src/core/employee';
import { cohortVariety, generateEmployeePersona } from '../src/core/populationPersona';
import { DEPARTMENT_ARCHETYPES, PERSONA_ARCHETYPES } from '../src/data/personaArchetypes';
import { DEFAULT_DEPARTMENTS, DEFAULT_STYLE } from '../src/data/defaults';
import { validateProfile } from '../src/core/profile';

const archetypeIds = new Set(PERSONA_ARCHETYPES.map((a) => a.id));

describe('department-aware persona generation (Epic 3 / F3.2)', () => {
  it('every department-flavored pool references real archetypes and seed-catalog ids', () => {
    const deptIds = new Set(DEFAULT_DEPARTMENTS.map((d) => d.id));
    for (const [deptId, pool] of Object.entries(DEPARTMENT_ARCHETYPES)) {
      expect(deptIds.has(deptId), `dept "${deptId}"`).toBe(true);
      for (const id of Object.keys(pool)) expect(archetypeIds.has(id), `archetype "${id}"`).toBe(true);
    }
  });

  it('generates a full persona (drives/traits/needs/axes), not just visual DNA', () => {
    const emp = generateEmployee('AA11', 'it', DEFAULT_STYLE);
    const p = generateEmployeePersona(emp);
    expect(p.drives.primary).toBeTruthy();
    expect(p.personality.traitTags.length).toBeGreaterThan(0);
    expect(p.identity.department).toBe('it'); // F3.1 catalog id carried through
    expect(p.agentId).toBe(`emp-${emp.visualSeed}`);
    expect(validateProfile(p, { agentIds: [p.agentId] })).toEqual([]);
  });

  it('is deterministic — same employee → identical persona', () => {
    const emp = generateEmployee('BB22', 'hr', DEFAULT_STYLE);
    expect(generateEmployeePersona(emp)).toEqual(generateEmployeePersona(emp));
  });

  it('binds the persona agentId to a provided cast recipe', () => {
    const emp = generateEmployee('CC33', 'sales', DEFAULT_STYLE);
    const recipe = { id: 'sales-hire-1', name: emp.name, parts: emp.recipe.parts, palette: emp.recipe.palette };
    const p = generateEmployeePersona(emp, recipe);
    expect(p.agentId).toBe('sales-hire-1');
  });

  it('a blank/unmapped department falls back to the generic spread', () => {
    const emp = generateEmployee('DD44', 'random', DEFAULT_STYLE); // metadata.department === ''
    const p = generateEmployeePersona(emp);
    expect(p.drives.primary).toBeTruthy();
    expect(p.identity.department).toBe('');
  });

  it('IT and HR cohorts skew to different archetypes (department flavor)', () => {
    const archetypesFor = (deptProfile: string): Set<string> => {
      const pop = generatePopulation(16, deptProfile, DEFAULT_STYLE, `flavor-${deptProfile}`);
      return new Set(pop.employees.map((e) => generateEmployeePersona(e).identity.prototypeRole));
    };
    const it = archetypesFor('it');
    const hr = archetypesFor('hr');
    // HR's signature roles (Office Mom / Charmer) should be far more present in HR.
    const hrOnly = [...hr].filter((r) => /Office Mom|Charmer/.test(r));
    expect(hrOnly.length).toBeGreaterThan(0);
    // The two cohorts are not the same set of archetypes.
    expect([...it].sort()).not.toEqual([...hr].sort());
  });
});

describe('cohort distinctiveness metric (S3.2.2)', () => {
  it('a generated cohort is legibly distinct (variety ratio meets threshold)', () => {
    const pop = generatePopulation(12, 'it', DEFAULT_STYLE, 'variety-seed');
    const v = cohortVariety(pop.employees.map((e) => generateEmployeePersona(e)));
    expect(v.count).toBe(12);
    expect(v.varietyRatio).toBeGreaterThanOrEqual(0.6);
    expect(v.distinctArchetypes).toBeGreaterThan(1);
  });

  it('reports zero variety for an empty cohort', () => {
    expect(cohortVariety([]).varietyRatio).toBe(0);
  });
});
