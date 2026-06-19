/**
 * Department-aware persona generation (Epic 3, F3.2) — the bridge that turns the
 * population generator's **visual DNA** (`employee.ts`) into **full personas**
 * (`personaTemplate.ts`). A generated department is no longer sprites + metadata;
 * it is real people with drives/traits/needs/axes, skewed by the department's
 * function (the F3.2 *department-flavored archetype* decision, S3.2.2).
 *
 * Lives in its own module on purpose: `personaTemplate` already imports
 * `employee` (for `seedToInt`), so wiring the two together here avoids an import
 * cycle. Deterministic — the same employee (+ recipe) always yields the same
 * persona, so a generated cohort is reproducible.
 */
import { mulberry32 } from './random';
import { seedToInt, employeeRecipe, type EmployeeDefinition } from './employee';
import { generatePersona } from './personaTemplate';
import { DEPARTMENT_ARCHETYPES, PERSONA_ARCHETYPES } from '../data/personaArchetypes';
import type { PersonaTemplate } from './personaTemplate';
import type { CharacterProfile } from './profile';
import type { CharacterRecipe } from './types';

const ARCHETYPE_BY_ID = new Map(PERSONA_ARCHETYPES.map((a) => [a.id, a]));

/** The weighted `{ id, weight }` archetype pool for a department (generic spread when unmapped). */
function archetypePool(departmentId: string): Array<{ template: PersonaTemplate; weight: number }> {
  const weights = DEPARTMENT_ARCHETYPES[departmentId];
  if (weights) {
    return Object.entries(weights)
      .map(([id, weight]) => ({ template: ARCHETYPE_BY_ID.get(id), weight }))
      .filter((e): e is { template: PersonaTemplate; weight: number } => !!e.template);
  }
  // No department flavor (blank or unmapped) → uniform over all archetypes.
  return PERSONA_ARCHETYPES.map((template) => ({ template, weight: 1 }));
}

/** Weighted archetype pick from a seeded rng. */
function pickArchetype(rng: () => number, pool: Array<{ template: PersonaTemplate; weight: number }>): PersonaTemplate {
  const total = pool.reduce((s, e) => s + Math.max(0, e.weight), 0);
  if (total <= 0) return pool[0].template;
  let r = rng() * total;
  for (const e of pool) {
    r -= Math.max(0, e.weight);
    if (r <= 0) return e.template;
  }
  return pool[pool.length - 1].template;
}

/**
 * Generate a full {@link CharacterProfile} for a generated employee, drawing a
 * department-flavored archetype and binding it to the employee's appearance.
 * Pass the cast `recipe` when promoting into the project so the persona's
 * `agentId` matches the cast member; otherwise a recipe is synthesized from the
 * employee. The persona's `department` is set to the employee's catalog id (F3.1).
 */
export function generateEmployeePersona(emp: EmployeeDefinition, recipe?: CharacterRecipe): CharacterProfile {
  const bound = recipe ?? employeeRecipe(emp);
  const departmentId = emp.metadata.department || '';
  const rng = mulberry32(seedToInt(`${emp.visualSeed}|persona|${departmentId}`));
  const template = pickArchetype(rng, archetypePool(departmentId));

  const profile = generatePersona(template, seedToInt(`${emp.visualSeed}|${template.id}`), {
    agentId: bound.id,
    name: emp.name,
    recipe: bound,
  });
  profile.identity.department = departmentId;
  profile.identity.displayName = emp.name;
  return profile;
}

// --- cohort distinctiveness metric (S3.2.2) ---------------------------------

export interface CohortVariety {
  count: number;
  /** Distinct (archetype + primary drive + trait-set) signatures. */
  distinctSignatures: number;
  /** distinctSignatures / count — 1 = everyone reads differently, low = reskins. */
  varietyRatio: number;
  distinctArchetypes: number;
  distinctPrimaryDrives: number;
}

/** A persona's "reads-as" signature — what makes one cohort member legibly distinct. */
function personaSignature(p: CharacterProfile): string {
  return [p.identity.prototypeRole, p.drives.primary, [...p.personality.traitTags].sort().join('+')].join('|');
}

/**
 * Measure how legibly distinct a generated cohort is (S3.2.2). A healthy
 * department-flavored cohort spreads across several archetypes and drives rather
 * than collapsing into near-duplicates; `varietyRatio` is the headline number.
 */
export function cohortVariety(profiles: CharacterProfile[]): CohortVariety {
  const count = profiles.length;
  const sigs = new Set(profiles.map(personaSignature));
  const archetypes = new Set(profiles.map((p) => p.identity.prototypeRole));
  const drives = new Set(profiles.map((p) => p.drives.primary));
  return {
    count,
    distinctSignatures: sigs.size,
    varietyRatio: count ? sigs.size / count : 0,
    distinctArchetypes: archetypes.size,
    distinctPrimaryDrives: drives.size,
  };
}
