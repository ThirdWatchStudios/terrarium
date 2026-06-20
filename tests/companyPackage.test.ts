import { describe, it, expect } from 'vitest';
import { createDefaultCompany, serializeCompany, parseCompany, type Company } from '../src/core/company';
import { cascadeCompany, cascadeToProject } from '../src/core/companyCascade';
import { exportAll, type ExportSink, type Rasterizer } from '../src/core/exporter';
import { migrateProject } from '../src/core/migrations';
import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import { defaultProject, DEFAULT_DEPARTMENTS, DEFAULT_RELATIONSHIP_TYPES } from '../src/data/defaults';
import type { ProjectState } from '../src/core/types';

/** A small generated company package, fast enough for an export round in tests. */
function smallCompany(headcount = 8): Company {
  const c = createDefaultCompany('acme', 'Acme Co');
  c.identity.headcount = headcount;
  c.identity.industry = 'Software';
  c.history = [
    { id: 'lay', title: 'Layoff', description: '', kind: 'layoff', when: 'recent', magnitude: 80, visibility: 'public', involvedDepartments: ['Engineering'] },
  ];
  return c;
}

function packageProject(company: Company): ProjectState {
  const result = cascadeCompany(company, {
    catalog: DEFAULT_DEPARTMENTS,
    style: defaultProject().style,
    relationshipTypes: DEFAULT_RELATIONSHIP_TYPES,
  });
  return cascadeToProject(result, defaultProject());
}

/** Run exportAll with a stub rasterizer, capturing only the JSON (string) files. */
async function exportJsonFiles(project: ProjectState): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  const sink: ExportSink = { file: (path, data) => { if (typeof data === 'string') files.set(path, data); } };
  const rasterizer: Rasterizer = { rasterizeSheet: async () => new Uint8Array() };
  await exportAll(project, { sink, rasterizer });
  return files;
}

describe('F0.8 — company.json serialize/deserialize (S0.8.1)', () => {
  it('round-trips through serialize → parse → serialize', () => {
    const c = smallCompany();
    const once = serializeCompany(c);
    expect(serializeCompany(parseCompany(once))).toEqual(once);
  });

  it('parse preserves the flattened climate values exactly', () => {
    const c = smallCompany();
    c.climate.factionalism = { value: 73, authored: true };
    const parsed = parseCompany(serializeCompany(c));
    expect(parsed.climate.factionalism.value).toBe(73);
    expect(parsed.identity.name).toBe('Acme Co');
  });

  it('the schema version is bumped to 12 and a pre-v12 project migrates cleanly', () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(12);
    const old = { ...defaultProject(), version: 11, company: undefined };
    const migrated = migrateProject(JSON.parse(JSON.stringify(old)))!;
    expect(migrated.version).toBe(12);
    expect(migrated.company).toBeUndefined(); // additive — nothing fabricated
  });
});

describe('F0.8 — company package bundle (S0.8.2)', () => {
  it('places company.json at the root over the existing children', async () => {
    const company = smallCompany();
    const files = await exportJsonFiles(packageProject(company));
    expect(files.has('company.json')).toBe(true);
    expect(JSON.parse(files.get('company.json')!)).toEqual(serializeCompany(company));
    // The existing children still ship, unchanged in location.
    for (const child of ['project.json', 'departments.json', 'org-structure.json', 'drives.json']) {
      expect(files.has(child)).toBe(true);
    }
  });

  it('a project without a company emits no company.json (existing exports unaffected)', async () => {
    const files = await exportJsonFiles(defaultProject());
    expect(files.has('company.json')).toBe(false);
    expect(files.has('project.json')).toBe(true);
  });
});

describe('F0.8 — headless determinism (S0.8.3)', () => {
  it('two runs of the same company produce byte-identical JSON', async () => {
    const a = await exportJsonFiles(packageProject(smallCompany()));
    const b = await exportJsonFiles(packageProject(smallCompany()));
    expect(a.size).toBe(b.size);
    for (const [path, json] of a) expect(b.get(path), path).toBe(json);
  });
});
