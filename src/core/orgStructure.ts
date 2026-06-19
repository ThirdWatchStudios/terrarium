/**
 * The org-structure export artifact (Epic 2, F2.2) — `org-structure.json`, the
 * loadable shape the sim renders as a known-structure, fogged-contents org chart.
 *
 * The load-bearing idea (S2.2.2) is a clean **structure / contents split**:
 *   - `structure` — what the player always sees: which departments exist, their
 *     labels + categories. The sim can load this alone to draw the chart.
 *   - `contents` — what the sim fogs until a wing is reached: who is inside each
 *     department (members by agentId). Reporting lines / ties join here in F2.3.
 *
 * It is **derived**, not stored — the company cascade (Epic 0 F0.3) populates the
 * same department catalog + personas this reads, so a generated company yields a
 * valid org structure with no extra authoring. Membership is resolved from each
 * persona's `department` via the F2.1 catalog mapping (personas still hold free
 * text until the F3.1 id-rewrite; unresolved ones land in `unassigned`).
 */
import type { ProjectState } from './types';
import { mapDepartmentNameToId } from './department';

/** The visible chart structure — safe to load without the member roster. */
export interface OrgStructureVisible {
  departments: { id: string; label: string; category: string }[];
}

/** The fogged contents — revealed wing-by-wing by the sim. */
export interface OrgStructureContents {
  /** Member agentIds keyed by department id (every catalog department has an entry). */
  members: Record<string, string[]>;
  /** Personas whose `department` resolves to no catalog id (or is blank). */
  unassigned: string[];
}

export interface OrgStructureJson {
  structure: OrgStructureVisible;
  contents: OrgStructureContents;
  meta: { generator: string; schema: string; departmentCount: number; memberCount: number };
}

/**
 * Build the org-structure artifact from the project's department catalog +
 * personas. Pure and deterministic (catalog order for departments, profile order
 * for members). Every catalog department appears in both `structure.departments`
 * and `contents.members` (with a possibly-empty roster), so the sim's chart and
 * its fog map are always complete.
 */
export function buildOrgStructure(project: Pick<ProjectState, 'departments' | 'profiles'>): OrgStructureJson {
  const departments = project.departments ?? [];
  const profiles = project.profiles ?? [];

  const members: Record<string, string[]> = {};
  for (const d of departments) members[d.id] = [];
  const unassigned: string[] = [];

  let memberCount = 0;
  for (const p of profiles) {
    const id = p.identity.department ? mapDepartmentNameToId(p.identity.department, departments) : null;
    if (id && members[id]) {
      members[id].push(p.agentId);
      memberCount++;
    } else {
      unassigned.push(p.agentId);
    }
  }

  return {
    structure: {
      departments: departments.map((d) => ({ id: d.id, label: d.label, category: d.category })),
    },
    contents: { members, unassigned },
    meta: {
      generator: 'sprite-character-creator',
      schema: '00-company-root-and-cascade.md',
      departmentCount: departments.length,
      memberCount,
    },
  };
}
