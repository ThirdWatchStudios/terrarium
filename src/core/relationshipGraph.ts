/**
 * Relationship-graph generation (Epic 3, F3.3) — give a generated cast a reason to
 * exist as an org: each department is **pre-wired internally** (a revealed wing
 * already knows itself), and a **sparser, plausible inter-department** graph gives
 * the cross-department casting layer material to work with.
 *
 * It reuses the existing relationship model end-to-end (no new types): edges carry
 * a `relationshipType` id into the project catalog (§3.7), and where that type
 * declares a third-party (jealousy/protectiveness) coupling, the sim applies it at
 * runtime — so wiring a `romance`/`rival`/`protege` edge is all this needs to do.
 * A light seniority-oriented pass also wires `manager`/`direct-report` edges, so a
 * generated department feeds F2.3's reporting-line + head derivation.
 *
 * Deterministic: edges are seeded per unordered agent pair (order-independent), so
 * the same cast + seed always yields the same graph. This is the cast-level graph
 * pass that `personaTemplate.ts` deferred (note §5).
 */
import {
  SENIORITY,
  clampBipolar,
  clampUnit,
  type CharacterProfile,
  type Relationship,
  type RelationshipTypeDefinition,
} from './profile';
import { mulberry32, type Rng } from './random';
import { seedToInt } from './employee';

type Range = [number, number];

/** Per-type starting-axis templates (sampled with a seeded jitter). affinity is bipolar. */
interface AxisTemplate {
  trust: Range;
  suspicion?: Range;
  affinity: Range;
  influence?: Range;
  respect?: Range;
  familiarity: Range;
  tags?: string[];
}

const TYPE_AXES: Record<string, AxisTemplate> = {
  coworker: { trust: [45, 65], affinity: [-10, 25], respect: [45, 60], familiarity: [35, 65] },
  friend: { trust: [65, 85], affinity: [40, 70], respect: [55, 75], familiarity: [60, 85] },
  'close-friend': { trust: [80, 95], affinity: [60, 90], respect: [60, 80], familiarity: [80, 95] },
  ally: { trust: [60, 80], affinity: [25, 50], influence: [40, 60], respect: [55, 75], familiarity: [50, 75] },
  confidant: { trust: [70, 90], affinity: [40, 65], respect: [55, 75], familiarity: [70, 92] },
  rival: { trust: [25, 50], suspicion: [40, 70], affinity: [-45, -10], respect: [40, 65], familiarity: [50, 75], tags: ['rival'] },
  romance: { trust: [82, 100], affinity: [70, 95], respect: [60, 85], familiarity: [80, 95] },
  mentor: { trust: [70, 90], affinity: [25, 55], respect: [72, 92], familiarity: [60, 82] },
  protege: { trust: [68, 88], affinity: [30, 55], respect: [50, 68], familiarity: [60, 82] },
  manager: { trust: [50, 75], affinity: [0, 35], influence: [30, 50], respect: [65, 85], familiarity: [50, 72] },
  'direct-report': { trust: [50, 72], affinity: [5, 35], influence: [0, 22], respect: [45, 68], familiarity: [50, 72] },
};

/** The reciprocal type to write on the other side of a tie. */
const RECIPROCAL: Record<string, string> = {
  coworker: 'coworker',
  friend: 'friend',
  'close-friend': 'close-friend',
  ally: 'ally',
  confidant: 'confidant',
  rival: 'rival',
  romance: 'romance',
  mentor: 'protege',
  protege: 'mentor',
  manager: 'direct-report',
  'direct-report': 'manager',
};

/** Weighted social-tie pools (the reporting/hierarchy types are a separate pass). */
const INTRA_SOCIAL: Record<string, number> = { coworker: 5, friend: 3, ally: 2, confidant: 1.5, 'close-friend': 1, rival: 1.5, romance: 0.5 };
const INTER_SOCIAL: Record<string, number> = { coworker: 4, ally: 2, rival: 1.5, friend: 1, confidant: 0.6 };

export interface RelationshipGraphOptions {
  seed?: number | string;
  /** Probability of a tie between two same-department members (default 0.5). */
  intraDensity?: number;
  /** Probability of a tie between two different-department members (default 0.08). */
  interDensity?: number;
  /** Probability a non-head member gets a reporting edge to the department head (default 0.7). */
  reportProbability?: number;
  /** Override the intra/inter social type weights. */
  intraWeights?: Record<string, number>;
  interWeights?: Record<string, number>;
  /** The relationship-type catalog — used for `secretByDefault`. Optional. */
  relationshipTypes?: RelationshipTypeDefinition[];
}

const sample = (rng: Rng, [lo, hi]: Range): number => lo + rng() * (hi - lo);
const seniorityRank = (s: string | undefined): number => {
  const i = (SENIORITY as readonly string[]).indexOf(s ?? '');
  return i < 0 ? 0 : i;
};

function weightedPick(rng: Rng, weights: Record<string, number>): string {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [k, w] of entries) {
    r -= w;
    if (r <= 0) return k;
  }
  return entries[entries.length - 1][0];
}

/** Build one directed edge of `type` from holder→target, axes sampled with `rng`. */
function makeEdge(rng: Rng, targetAgentId: string, type: string, secret: boolean): Relationship {
  const t = TYPE_AXES[type] ?? TYPE_AXES.coworker;
  const edge: Relationship = {
    targetAgentId,
    trust: clampUnit(sample(rng, t.trust)),
    suspicion: clampUnit(t.suspicion ? sample(rng, t.suspicion) : 0),
    affinity: clampBipolar(sample(rng, t.affinity)),
    influence: clampUnit(t.influence ? sample(rng, t.influence) : sample(rng, [10, 40])),
    respect: clampUnit(t.respect ? sample(rng, t.respect) : 50),
    familiarity: clampUnit(sample(rng, t.familiarity)),
    relationshipType: type,
    tags: t.tags ? [...t.tags] : [],
  };
  if (secret) edge.secret = true;
  return edge;
}

/**
 * Generate intra- and inter-department relationships across a cast, writing the
 * edges onto each profile's `relationships[]`. Mutates and returns the profiles.
 * Existing relationships are preserved; a generated edge is skipped when one to
 * that target already exists. Deterministic for a given seed.
 */
export function generateRelationshipGraph(
  profiles: CharacterProfile[],
  opts: RelationshipGraphOptions = {},
): CharacterProfile[] {
  const base = String(opts.seed ?? 'graph');
  const intraDensity = opts.intraDensity ?? 0.5;
  const interDensity = opts.interDensity ?? 0.08;
  const reportProb = opts.reportProbability ?? 0.7;
  const intraWeights = opts.intraWeights ?? INTRA_SOCIAL;
  const interWeights = opts.interWeights ?? INTER_SOCIAL;
  const secretByType = new Map((opts.relationshipTypes ?? []).map((t) => [t.id, !!t.secretByDefault]));
  const isSecret = (type: string): boolean => secretByType.get(type) ?? type === 'romance';

  const byId = new Map(profiles.map((p) => [p.agentId, p]));
  const taken = new Map(profiles.map((p) => [p.agentId, new Set(p.relationships.map((r) => r.targetAgentId))]));

  /** A per-pair rng (order-independent: the same pair always salts the same way). */
  const pairRng = (a: string, b: string): Rng => mulberry32(seedToInt(`${base}|${[a, b].sort().join('~')}`));

  const addEdge = (sourceId: string, targetId: string, type: string, rng: Rng): void => {
    const seen = taken.get(sourceId)!;
    if (seen.has(targetId) || sourceId === targetId) return;
    byId.get(sourceId)!.relationships.push(makeEdge(rng, targetId, type, isSecret(type)));
    seen.add(targetId);
  };

  /** Wire a symmetric/asymmetric tie across a pair, oriented by seniority for hierarchy types. */
  const wireTie = (a: CharacterProfile, b: CharacterProfile, type: string, rng: Rng): void => {
    // Hierarchy/mentorship types orient toward the more senior member as the boss/mentor.
    if (type === 'manager' || type === 'mentor') {
      const [jr, sr] = seniorityRank(a.identity.seniority) >= seniorityRank(b.identity.seniority) ? [b, a] : [a, b];
      addEdge(jr.agentId, sr.agentId, type, rng); // junior → manager/mentor (target = senior)
      addEdge(sr.agentId, jr.agentId, RECIPROCAL[type], rng); // senior → direct-report/protege
      return;
    }
    addEdge(a.agentId, b.agentId, type, rng);
    addEdge(b.agentId, a.agentId, RECIPROCAL[type] ?? type, rng);
  };

  // Group by department (blank = its own bucket so unassigned still wire internally).
  const byDept = new Map<string, CharacterProfile[]>();
  for (const p of profiles) {
    const key = p.identity.department || '__unassigned__';
    (byDept.get(key) ?? byDept.set(key, []).get(key)!).push(p);
  }

  // Intra-department: a reporting star to the senior-most member, then dense social ties.
  for (const members of byDept.values()) {
    if (members.length < 2) continue;
    const head = [...members].sort((x, y) => seniorityRank(y.identity.seniority) - seniorityRank(x.identity.seniority))[0];
    for (const m of members) {
      if (m === head) continue;
      const rng = pairRng(m.agentId, head.agentId);
      if (rng() < reportProb) wireTie(m, head, 'manager', rng);
    }
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const rng = pairRng(members[i].agentId, members[j].agentId);
        if (rng() < intraDensity) wireTie(members[i], members[j], weightedPick(rng, intraWeights), rng);
      }
    }
  }

  // Inter-department: sparse, plausible cross-wing ties.
  const depts = [...byDept.entries()];
  for (let di = 0; di < depts.length; di++) {
    for (let dj = di + 1; dj < depts.length; dj++) {
      for (const a of depts[di][1]) {
        for (const b of depts[dj][1]) {
          const rng = pairRng(a.agentId, b.agentId);
          if (rng() < interDensity) wireTie(a, b, weightedPick(rng, interWeights), rng);
        }
      }
    }
  }

  return profiles;
}

// --- graph stats ------------------------------------------------------------

export interface GraphStats {
  edges: number;
  intra: number;
  inter: number;
  byType: Record<string, number>;
  /** Agents with at least one relationship. */
  connected: number;
}

/** Summarize a cast's relationship graph (intra/inter by the agents' departments). */
export function graphStats(profiles: CharacterProfile[]): GraphStats {
  const deptOf = new Map(profiles.map((p) => [p.agentId, p.identity.department || '__unassigned__']));
  const byType: Record<string, number> = {};
  let edges = 0;
  let intra = 0;
  let inter = 0;
  const connected = new Set<string>();
  for (const p of profiles) {
    if (p.relationships.length) connected.add(p.agentId);
    for (const r of p.relationships) {
      edges++;
      const t = r.relationshipType ?? 'untyped';
      byType[t] = (byType[t] ?? 0) + 1;
      const od = deptOf.get(r.targetAgentId);
      if (od !== undefined && od === deptOf.get(p.agentId)) intra++;
      else if (od !== undefined) inter++;
    }
  }
  return { edges, intra, inter, byType, connected: connected.size };
}
