import { describe, it, expect } from 'vitest';
import {
  BEHAVIOR_CATEGORIES,
  createDefaultBehavior,
  validateBehavior,
  type BehaviorDefinition,
} from '../src/core/behavior';
import { DEFAULT_BEHAVIORS } from '../src/data/defaults';
import { DEFAULT_RELATIONSHIP_TYPES, DEFAULT_TRAITS } from '../src/data/defaults';
import { exportAll, type ExportSink, type Rasterizer } from '../src/core/exporter';
import { defaultGoldenProject } from '../src/data/defaults';
import { ROLE_TEMPLATES } from '../src/data/roleTemplates';

const traitIds = DEFAULT_TRAITS.map((t) => t.id);
const relationshipTypeIds = DEFAULT_RELATIONSHIP_TYPES.map((t) => t.id);
const ctx = { traitIds, relationshipTypeIds };

describe('behavior catalog', () => {
  it('createDefaultBehavior produces a valid behavior', () => {
    expect(validateBehavior(createDefaultBehavior('x'), ctx)).toEqual([]);
  });

  it('ships a sizeable default catalog spanning every category', () => {
    // Success criterion: a designer gets 20–30 office behaviors out of the box.
    expect(DEFAULT_BEHAVIORS.length).toBeGreaterThanOrEqual(20);
    const cats = new Set(DEFAULT_BEHAVIORS.map((b) => b.category));
    for (const cat of BEHAVIOR_CATEGORIES) {
      expect(cats.has(cat), `no default behavior in category "${cat}"`).toBe(true);
    }
  });

  it('has unique ids', () => {
    const ids = DEFAULT_BEHAVIORS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every default behavior validates and references only real trait / bond ids', () => {
    for (const b of DEFAULT_BEHAVIORS) {
      expect(validateBehavior(b, ctx), `"${b.id}" has issues`).toEqual([]);
    }
  });

  it('the emergent-story behaviors from the spec are present', () => {
    const ids = new Set(DEFAULT_BEHAVIORS.map((b) => b.id));
    for (const id of ['steal_lunch', 'spread_rumor', 'eat_lunch_alone', 'direct_confrontation', 'browse_job_boards']) {
      expect(ids.has(id), `missing emergent behavior "${id}"`).toBe(true);
    }
  });

  it('steal_lunch is reachable from multiple distinct pressures (one behavior, many motives)', () => {
    const steal = DEFAULT_BEHAVIORS.find((b) => b.id === 'steal_lunch')!;
    expect(Object.keys(steal.pressureWeights).length).toBeGreaterThanOrEqual(3);
  });

  it('flags unknown trait and relationship-type references (non-fatal typo guard)', () => {
    const bad: BehaviorDefinition = {
      ...createDefaultBehavior('bad'),
      traitModifiers: { not_a_trait: 2 },
      relationshipRequirements: { requiresTarget: true, targetKnown: true, relationshipTypeAnyOf: ['not_a_bond'] },
    };
    const issues = validateBehavior(bad, ctx);
    expect(issues.some((i) => i.includes('not_a_trait'))).toBe(true);
    expect(issues.some((i) => i.includes('not_a_bond'))).toBe(true);
  });
});

describe('behaviors export', () => {
  it('emits behaviors.json at the bundle root and in each scenario package', async () => {
    const paths = new Set<string>();
    const json = new Map<string, string>();
    const sink: ExportSink = {
      file: (path, data) => {
        paths.add(path);
        if (typeof data === 'string') json.set(path, data);
      },
    };
    const rasterizer: Rasterizer = { rasterizeSheet: async () => new Uint8Array() };
    await exportAll(defaultGoldenProject(), { sink, rasterizer, scenarioTemplates: ROLE_TEMPLATES });

    expect(paths.has('behaviors.json'), 'no root behaviors.json').toBe(true);
    const root = JSON.parse(json.get('behaviors.json')!);
    expect(Array.isArray(root)).toBe(true);
    expect(root.length).toBeGreaterThanOrEqual(20);
    // Self-contained scenario package carries the catalog too.
    expect([...paths].some((p) => /^scenarios\/.+\/behaviors\.json$/.test(p)), 'scenario package missing behaviors.json').toBe(true);
  });
});
