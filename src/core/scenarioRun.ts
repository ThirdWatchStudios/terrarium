/**
 * Scenario run resolver — computes the *effective* starting state the sim will
 * load, the way the sim will compute it: persona baseline first, then scenario
 * overrides/seeds on top (the loader precedence from scenario_model.md). The
 * studio uses this for the dry-run preview; it is also the studio half of the
 * studio↔sim parity the Scenario Loading epic (Epic 30) validates against.
 *
 * Pure and deterministic — given the same scenario + profiles + variant it always
 * resolves the same run.
 */
import type { CharacterProfile, Relationship } from './profile';
import { NEEDS, NEED_LABELS } from './profile';
import type { InformationItem, Scenario, ScenarioBelief, ScenarioObjective, TruthFact } from './scenario';
import { OVERRIDE_AXES, validateScenario } from './scenario';

/** A baseline relationship with the scenario override (if any) folded in. */
export interface ResolvedRelationship extends Relationship {
  /** True when a scenario relationshipOverride touched this relationship. */
  fromOverride: boolean;
}

export interface ResolvedAgent {
  agentId: string;
  displayName: string;
  hasPersona: boolean;
  prototypeRole: string;
  spawnLocationId: string;
  spawnBinding: { anchorId: string; roomId: string } | null;
  /** From the persona (empty when none). */
  drivePrimary: string;
  driveSecondary: string;
  topNeeds: string[];
  traitTags: string[];
  /** Effective starting state. */
  relationships: ResolvedRelationship[];
  beliefs: ScenarioBelief[];
  knowledge: string[];
}

export interface ResolvedRun {
  scenarioId: string;
  variantId: string;
  variantConditions: Record<string, string>;
  agents: ResolvedAgent[];
  truthFacts: TruthFact[];
  informationItems: InformationItem[];
  objective: ScenarioObjective;
  /** Validation issues for the scenario as resolved (reuses validateScenario). */
  issues: string[];
}

export interface ResolveOptions {
  profiles: CharacterProfile[];
  characters?: Array<{ id: string; name: string }>;
  variantId?: string;
  agentIds: string[];
  anchorIds?: string[];
}

const neutralRel = (targetAgentId: string): Relationship => ({
  targetAgentId,
  trust: 50,
  suspicion: 0,
  affinity: 0,
  influence: 0,
  respect: 50,
  familiarity: 50,
  tags: [],
});

export function resolveScenarioRun(scenario: Scenario, opts: ResolveOptions): ResolvedRun {
  const profiles = new Map(opts.profiles.map((p) => [p.agentId, p]));
  const names = new Map((opts.characters ?? []).map((c) => [c.id, c.name]));

  const vid =
    opts.variantId && scenario.variants.some((v) => v.variantId === opts.variantId)
      ? opts.variantId
      : scenario.defaultVariantId;
  const variant = scenario.variants.find((v) => v.variantId === vid);

  const agents: ResolvedAgent[] = scenario.cast.map((member) => {
    const profile = profiles.get(member.agentId);

    // Relationships: persona baseline, then scenario overrides folded on top.
    const rels = new Map<string, ResolvedRelationship>();
    for (const r of profile?.relationships ?? []) {
      rels.set(r.targetAgentId, { ...structuredClone(r), fromOverride: false });
    }
    for (const ov of member.relationshipOverrides) {
      const cur = rels.get(ov.targetAgentId) ?? { ...neutralRel(ov.targetAgentId), fromOverride: false };
      for (const a of OVERRIDE_AXES) if (ov[a] !== undefined) cur[a] = ov[a] as number;
      if (ov.affinity !== undefined) cur.affinity = ov.affinity;
      if (ov.tags) cur.tags = ov.tags;
      cur.fromOverride = true;
      rels.set(ov.targetAgentId, cur);
    }

    // Knowledge: scenario knowledge seeds + items this agent initially holds.
    const knowledge = new Set(member.knowledgeSeeds);
    for (const info of scenario.informationItems) {
      if (info.initialHolderAgentIds.includes(member.agentId)) knowledge.add(info.informationId);
    }

    const topNeeds = profile
      ? [...NEEDS].sort((a, b) => profile.needs[b].sensitivity - profile.needs[a].sensitivity).slice(0, 3).map((n) => NEED_LABELS[n])
      : [];

    const loc = scenario.locations.find((l) => l.locationId === member.spawnLocationId);

    return {
      agentId: member.agentId,
      displayName: names.get(member.agentId) ?? member.agentId,
      hasPersona: !!profile,
      prototypeRole: member.prototypeRole,
      spawnLocationId: member.spawnLocationId,
      spawnBinding: loc ? loc.bindTo : null,
      drivePrimary: profile?.drives.primary ?? '',
      driveSecondary: profile?.drives.secondary ?? '',
      topNeeds,
      traitTags: profile?.personality.traitTags ?? [],
      relationships: [...rels.values()],
      beliefs: member.beliefSeeds,
      knowledge: [...knowledge],
    };
  });

  return {
    scenarioId: scenario.scenarioId,
    variantId: variant?.variantId ?? '',
    variantConditions: variant?.selections ?? {},
    agents,
    truthFacts: scenario.truthFacts,
    informationItems: scenario.informationItems,
    objective: scenario.objective,
    issues: validateScenario(scenario, { agentIds: opts.agentIds, anchorIds: opts.anchorIds }),
  };
}
