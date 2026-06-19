import { describe, it, expect } from 'vitest';
import {
  mapDepartmentNameToId,
  reportUnmappedDepartments,
  slugifyDepartment,
  validateDepartmentCatalog,
} from '../src/core/department';
import { DEFAULT_DEPARTMENTS, defaultProject } from '../src/data/defaults';
import { migrateProject } from '../src/core/migrations';
import { CURRENT_SCHEMA_VERSION } from '../src/core/types';

describe('department catalog (Epic 2 / F2.1)', () => {
  it('the seed catalog is valid with unique stable ids', () => {
    expect(validateDepartmentCatalog(DEFAULT_DEPARTMENTS)).toEqual([]);
    const ids = DEFAULT_DEPARTMENTS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('flags duplicate and missing ids', () => {
    const issues = validateDepartmentCatalog([
      { id: 'sales', label: 'Sales', category: 'commercial' },
      { id: 'sales', label: 'Field Sales', category: 'commercial' },
      { id: '', label: 'Mystery', category: 'operations' },
    ]);
    expect(issues.some((i) => i.includes('Duplicate'))).toBe(true);
    expect(issues.some((i) => i.includes('missing an id'))).toBe(true);
  });

  it('slugifies free-text names into stable kebab-case ids', () => {
    expect(slugifyDepartment('Customer Support')).toBe('customer-support');
    expect(slugifyDepartment('  R&D / Labs ')).toBe('r-d-labs');
    expect(slugifyDepartment('IT')).toBe('it');
  });

  it('maps free-text department names onto catalog ids (id, label, slug)', () => {
    expect(mapDepartmentNameToId('Customer Support', DEFAULT_DEPARTMENTS)).toBe('customer-support');
    expect(mapDepartmentNameToId('hr', DEFAULT_DEPARTMENTS)).toBe('hr'); // exact id
    expect(mapDepartmentNameToId('ENGINEERING', DEFAULT_DEPARTMENTS)).toBe('engineering'); // case-insensitive label
    expect(mapDepartmentNameToId('Procurement', DEFAULT_DEPARTMENTS)).toBeNull();
  });

  it('reports the unmapped free-text names for cleanup (deduped)', () => {
    const unmapped = reportUnmappedDepartments(['Sales', 'Procurement', 'procurement', 'Skunkworks', ''], DEFAULT_DEPARTMENTS);
    expect(unmapped).toEqual(['Procurement', 'Skunkworks']);
  });
});

describe('department catalog wiring', () => {
  it('the default project ships the seed catalog', () => {
    const p = defaultProject();
    expect(p.departments).toEqual(DEFAULT_DEPARTMENTS);
    expect(p.version).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('migration seeds departments into a pre-v10 project and absorbs unmapped names', () => {
    // A minimal v9-shaped project missing the new catalog, with a custom dept.
    const v9 = defaultProject() as Record<string, unknown>;
    v9.version = 9;
    delete v9.departments;
    (v9.profiles as Array<{ identity: { department: string } }>)[0].identity.department = 'Skunkworks';

    const migrated = migrateProject(v9)!;
    expect(migrated.version).toBe(CURRENT_SCHEMA_VERSION);
    expect(validateDepartmentCatalog(migrated.departments)).toEqual([]);
    // Defaults are present...
    expect(migrated.departments.some((d) => d.id === 'sales')).toBe(true);
    // ...and the unmapped free-text dept was absorbed with a stable id.
    expect(migrated.departments.some((d) => d.id === 'skunkworks' && d.label === 'Skunkworks')).toBe(true);
  });
});
