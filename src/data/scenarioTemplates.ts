/**
 * Scenario templates — starting-condition seeds for common Water Cooler runs.
 * Templates define ONLY the initial state (cast, office locations, experiment,
 * objective, and light belief seeds); they never script outcomes. "Promotion
 * Rumor" is the fully-authored reference; the others are valid scaffolds a
 * designer fleshes out. See game-design-docs .../design/scenario_model.md.
 */
import type { Scenario, ScenarioBelief, ScenarioObjective } from '../core/scenario';
import { DEFAULT_CAST, DEFAULT_SCENARIOS } from './defaults';

const base = DEFAULT_SCENARIOS[0];

const stdLocations = () => structuredClone(base.locations);
const stdInterventionTypes = () => structuredClone(base.interventionTypes);
const stdVariants = () => structuredClone(base.variants);

const SPAWN: Record<string, string> = {
  janice: 'janice_desk',
  carl: 'carl_desk',
  linda: 'linda_desk',
  manager: 'manager_office',
};

type SeededBelief = ScenarioBelief & { agentId: string };

/** Build a minimal-but-valid scaffold: the standard cast + office + experiment. */
function scaffold(
  scenarioId: string,
  title: string,
  summary: string,
  objective: ScenarioObjective,
  beliefSeeds: SeededBelief[] = [],
): Scenario {
  const cast = DEFAULT_CAST.map((r) => ({
    agentId: r.id,
    spawnLocationId: SPAWN[r.id] ?? 'hallway',
    prototypeRole: '',
    relationshipOverrides: [],
    beliefSeeds: [] as ScenarioBelief[],
    knowledgeSeeds: [] as string[],
  }));
  for (const seed of beliefSeeds) {
    const { agentId, ...belief } = seed;
    cast.find((c) => c.agentId === agentId)?.beliefSeeds.push(belief);
  }
  return {
    scenarioId,
    title,
    summary,
    cast,
    locations: stdLocations(),
    truthFacts: [],
    informationItems: [],
    interventionTypes: stdInterventionTypes(),
    variants: stdVariants(),
    defaultVariantId: base.defaultVariantId,
    objective,
  };
}

export interface ScenarioTemplate {
  id: string;
  name: string;
  description: string;
  build: () => Scenario;
}

export const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
  {
    id: 'promotion_rumor',
    name: 'Promotion Rumor',
    description: 'An ambiguous promotion seeds a rumor — the fully-authored reference scenario.',
    build: () => structuredClone(base),
  },
  {
    id: 'leadership_confidence',
    name: 'Leadership Confidence',
    description: 'An org change tests whether the team keeps faith in management.',
    build: () =>
      scaffold(
        'leadership_confidence',
        'Leadership Confidence',
        'A reorg announcement tests trust in leadership.',
        {
          objectiveId: 'sustain_leadership_confidence',
          label: 'Keep leadership confidence high through an org change.',
          category: 'stability',
          desiredPressure: 'management_trust',
          intendedObservableBehavior: 'Trust in management stays high despite uncertainty.',
          kpi: 'leadership_confidence_index',
          expectedEvidence: ['trust metrics', 'belief changes'],
        },
        [{ agentId: 'carl', topic: 'reorg_plan', claim: 'The reorg is a mistake.', stance: 'doubts', confidence: 50 }],
      ),
  },
  {
    id: 'printer_jam',
    name: 'Printer Jam',
    description: 'A mundane equipment outage stresses routine and patience.',
    build: () =>
      scaffold(
        'printer_jam',
        'Printer Jam',
        'The printer is down before a deadline; does the team stay productive?',
        {
          objectiveId: 'maintain_throughput',
          label: 'Keep the team productive despite an equipment outage.',
          category: 'productivity',
          desiredPressure: 'routine_interruption',
          intendedObservableBehavior: 'Work continues; frustration stays contained.',
          kpi: 'throughput_retention',
          expectedEvidence: ['routine disruption events'],
        },
        [{ agentId: 'carl', topic: 'facilities_reliability', claim: 'IT never fixes anything.', stance: 'suspects', confidence: 40 }],
      ),
  },
  {
    id: 'new_hire',
    name: 'New Hire',
    description: 'A new employee joins; does the team include them or harden into cliques?',
    build: () =>
      scaffold(
        'new_hire',
        'New Hire',
        'A new hire arrives and the team forms first impressions.',
        {
          objectiveId: 'smooth_onboarding',
          label: 'Integrate a new hire into the team.',
          category: 'culture',
          desiredPressure: 'belonging',
          intendedObservableBehavior: 'The new hire is included; cliques do not harden.',
          kpi: 'onboarding_cohesion',
          expectedEvidence: ['social inclusion', 'relationship changes'],
        },
        [{ agentId: 'linda', topic: 'new_hire', claim: 'I should get to know them.', stance: 'accepts', confidence: 60 }],
      ),
  },
  {
    id: 'performance_review',
    name: 'Performance Review',
    description: 'Review season raises questions of fairness and status.',
    build: () =>
      scaffold(
        'performance_review',
        'Performance Review',
        'Performance reviews land; are they seen as fair?',
        {
          objectiveId: 'fair_review_perception',
          label: 'Run performance reviews seen as fair.',
          category: 'political',
          desiredPressure: 'resentment',
          intendedObservableBehavior: 'Reviews land without resentment spikes.',
          kpi: 'perceived_fairness',
          expectedEvidence: ['resentment changes'],
        },
        [{ agentId: 'carl', topic: 'review_fairness', claim: 'The reviews are rigged.', stance: 'suspects', confidence: 45 }],
      ),
  },
];
