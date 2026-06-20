/**
 * Seed coverage & drama validation (Epic 0, F0.10) — the go/no-go gate that closes
 * the cascade: is a *generated company* actually worth playing? It composes the
 * validators each tier already ships rather than inventing new ones —
 *
 *   - **Soundness** (S0.10.1): the org-structure validates (every department has a
 *     head, no dangling/cyclic reports — Epic 2 F2.5) AND every relationship edge
 *     resolves to a real agent (no dangling history-seeded edge — F0.6).
 *   - **Coverage** (S0.10.2): the generated cast can cast enough of the scenario
 *     library (Epic 3/4 `analyzeOrgCoverage` — F3.5).
 *   - **Drama** (S0.10.3): the company character *measurably shifted* the population
 *     vs a neutral-culture run (F0.5 `populationDivergence`), and enough hot,
 *     castable opening scenarios exist (F0.7 eligibility).
 *
 * Pure + deterministic. The UI runs it before export and surfaces the verdict.
 * See …/11-f0-10-seed-coverage-and-drama-validation.
 */
import type { CascadeResult } from './companyCascade';
import { validateOrgStructure } from './orgStructure';
import { analyzeOrgCoverage, type ScenarioTemplate } from './scenarioTemplate';
import { rankScenarioEligibility } from './scenarioEligibility';
import { meanDepartmentDivergence, ORG_DIVERGENCE_THRESHOLD } from './cultureWeighting';
import type { CharacterProfile } from './profile';

export interface SeedValidationOptions {
  /** The scenario-template library to score coverage + drama against. */
  library: ScenarioTemplate[];
  /** A neutral-culture run of the same seed — the divergence baseline. Omit to skip the check. */
  neutralProfiles?: CharacterProfile[];
  /** Minimum castable-template ratio to count as covered (default 0.5). */
  minCoverageRatio?: number;
  /** Minimum population divergence from neutral to count as "shaped" (default 0.2). */
  minDivergence?: number;
  /** Minimum hot, castable opening scenarios to count as dramatic (default 1). */
  minHotScenarios?: number;
}

export interface SeedValidation {
  /** The combined go/no-go: every sub-check passed. */
  ok: boolean;
  soundness: { sound: boolean; errors: string[]; warnings: string[]; danglingEdges: string[] };
  coverage: { castable: number; total: number; ratio: number; adequate: boolean };
  drama: { divergence: number | null; diverged: boolean; hotScenarios: number; dramatic: boolean };
  /** Human-readable reasons the seed is not a clean go (empty when ok). */
  issues: string[];
}

/** Relationship edges whose target isn't a real agent in the cast (dangling — F0.6/F0.10). */
function danglingEdges(profiles: CharacterProfile[]): string[] {
  const ids = new Set(profiles.map((p) => p.agentId));
  const out: string[] = [];
  for (const p of profiles) {
    for (const r of p.relationships) {
      if (!ids.has(r.targetAgentId)) out.push(`${p.agentId} → ${r.targetAgentId} (${r.relationshipType ?? 'untyped'})`);
    }
  }
  return out;
}

/**
 * Validate a generated seed and return a go/no-go verdict with the per-check
 * breakdown. Deterministic. `ok` is true only when the seed is sound, covered,
 * diverged, and dramatic.
 */
export function validateSeed(result: CascadeResult, opts: SeedValidationOptions): SeedValidation {
  const minCoverageRatio = opts.minCoverageRatio ?? 0.5;
  const minDivergence = opts.minDivergence ?? ORG_DIVERGENCE_THRESHOLD;
  const minHot = opts.minHotScenarios ?? 1;
  const issues: string[] = [];

  // S0.10.1 — structure + history-edge soundness.
  const org = validateOrgStructure({ departments: result.departments, profiles: result.profiles, characters: result.characters });
  const dangling = danglingEdges(result.profiles);
  const sound = org.errors.length === 0 && dangling.length === 0;
  if (org.errors.length) issues.push(`Structure is broken: ${org.errors[0]}${org.errors.length > 1 ? ` (+${org.errors.length - 1} more)` : ''}.`);
  if (dangling.length) issues.push(`${dangling.length} relationship edge(s) dangle to a missing agent.`);

  // S0.10.2 — scenario-precondition coverage.
  const cov = analyzeOrgCoverage(opts.library, result.profiles);
  const adequate = cov.coverageRatio >= minCoverageRatio;
  if (!adequate) issues.push(`Only ${cov.castableCount}/${cov.totalCount} scenario templates are castable (need ≥ ${Math.round(minCoverageRatio * 100)}%).`);

  // S0.10.3 — drama: divergence vs neutral + hot castable opening scenarios.
  const divergence = opts.neutralProfiles ? meanDepartmentDivergence(result.profiles, opts.neutralProfiles) : null;
  const diverged = divergence === null ? true : divergence >= minDivergence;
  if (!diverged) issues.push(`The population barely diverges from a neutral company (${divergence!.toFixed(2)} < ${minDivergence}) — a flat seed.`);

  const hotScenarios = (result.eligibility ?? rankScenarioEligibility(result.company, opts.library, result.profiles)).hot.length;
  const dramatic = hotScenarios >= minHot;
  if (!dramatic) issues.push(`No history-grounded, castable opening scenario (${hotScenarios} hot) — add scenario templates or history.`);

  return {
    ok: sound && adequate && diverged && dramatic,
    soundness: { sound, errors: org.errors, warnings: org.warnings, danglingEdges: dangling },
    coverage: { castable: cov.castableCount, total: cov.totalCount, ratio: cov.coverageRatio, adequate },
    drama: { divergence, diverged, hotScenarios, dramatic },
    issues,
  };
}
