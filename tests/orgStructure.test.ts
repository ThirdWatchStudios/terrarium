import { describe, it, expect } from 'vitest';
import { buildOrgStructure } from '../src/core/orgStructure';
import { buildScenarioPackage } from '../src/core/scenarioRun';
import { DEFAULT_SCENARIOS, defaultProject } from '../src/data/defaults';

describe('org-structure artifact (Epic 2 / F2.2)', () => {
  it('lists every department and resolves members by agentId', () => {
    const org = buildOrgStructure(defaultProject());
    // Visible structure carries every catalog department.
    expect(org.structure.departments).toHaveLength(13);
    expect(org.structure.departments.find((d) => d.id === 'operations')?.label).toBe('Operations');
    // Fogged contents groups the default cast by their (free-text) department.
    expect(org.contents.members.operations.sort()).toEqual(['carl', 'janice', 'linda']);
    expect(org.contents.members.management).toEqual(['manager']);
    expect(org.contents.unassigned).toEqual([]);
    expect(org.meta.departmentCount).toBe(13);
    expect(org.meta.memberCount).toBe(4);
  });

  it('keeps visible structure free of member data (the fog split)', () => {
    const org = buildOrgStructure(defaultProject());
    // structure.departments entries are id/label/category only — no members.
    for (const d of org.structure.departments) {
      expect(Object.keys(d).sort()).toEqual(['category', 'id', 'label']);
    }
    // Every department also has a (possibly empty) members entry in contents.
    for (const d of org.structure.departments) {
      expect(Array.isArray(org.contents.members[d.id])).toBe(true);
    }
  });

  it('routes personas with an unresolvable department to unassigned', () => {
    const p = defaultProject();
    p.profiles![0].identity.department = 'Skunkworks'; // not in the catalog
    const org = buildOrgStructure(p);
    expect(org.contents.unassigned).toContain(p.profiles![0].agentId);
    expect(org.meta.memberCount).toBe(3);
  });

  it('is deterministic', () => {
    expect(JSON.stringify(buildOrgStructure(defaultProject()))).toBe(
      JSON.stringify(buildOrgStructure(defaultProject())),
    );
  });

  it('ships in the scenario package bundle', () => {
    const pkg = buildScenarioPackage(DEFAULT_SCENARIOS[0], defaultProject());
    expect(pkg['departments.json']).toBeDefined();
    const org = pkg['org-structure.json'] as ReturnType<typeof buildOrgStructure>;
    expect(org.structure.departments.length).toBeGreaterThan(0);
    expect(org.contents.members).toBeDefined();
  });
});
