/**
 * Company archetypes (F0.2) — the new-game presets. The company-scale analog of
 * the persona archetypes (src/data/personaArchetypes.ts): a `CompanyArchetype`
 * expresses **ranges** over the culture axes / identity / economy plus
 * **likely-history weights**, and {@link generateCompany} samples one coherent
 * {@link Company} per seed using the same `mulberry32` / "bias not lock" pattern.
 *
 * This is the entity-generation step only — no cascade yet (departments, people,
 * relationships, scenarios come in Pass 2, F0.3+). Determinism is the contract:
 * the same `(seed, archetype, dials)` reproduces byte-identical output.
 */
import {
  CULTURE_AXES,
  applyCompanyDerived,
  clampCompany,
  createDefaultCompany,
  type Company,
  type CompanyEvent,
  type CultureAxis,
  type EventVisibility,
  type NamedRivalry,
} from './company';
import { clampUnit } from './profile';
import { mulberry32, type Rng } from './random';
import { seedToInt } from './employee';

/** Inclusive `[min, max]` range. 0–100 unless the field says otherwise. */
export type Range = [number, number];

/** A candidate company event the archetype may draw into the generated history. */
export interface CompanyEventTemplate {
  id: string;
  title: string;
  description: string;
  kind: string;
  when: string;
  magnitude: Range;
  visibility: EventVisibility;
  involvedDepartments?: string[];
}

export interface CompanyArchetype {
  id: string;
  label: string;
  description: string;
  /** For grouping + blend affinity (free text). */
  archetypeTags?: string[];
  identity: {
    /** Drawn from; one is picked per seed. */
    industries: string[];
    ownership: string[];
    sizeBands: string[];
    /** Approximate headcount range. */
    headcount: Range;
    foundedYear: Range;
    reputation: Range;
  };
  /** Per-axis culture ranges; an omitted axis samples neutral 40–60. */
  culture: Partial<Record<CultureAxis, Range>>;
  economy: {
    financialHealth: Range;
    morale: Range;
    /** Weighted draw over trajectory strings (e.g. { declining: 3, flat: 1 }). */
    trajectoryWeights: Record<string, number>;
    /** Sampled when the drawn trajectory is shaky; null otherwise. */
    runwayMonths?: Range;
  };
  mission: {
    statedMissions: string[];
    actualPriorities: string[];
    hypocrisyGap: Range;
  };
  narrative: {
    officialStories: string[];
    realStories: string[];
    openSecretsPool: string[];
    openSecretCount: Range;
  };
  socialClimate: {
    orgTrust: Range;
    rivalryPool?: NamedRivalry[];
    rivalryCount?: Range;
    powerCenterPool?: string[];
    powerCenterCount?: Range;
  };
  history: {
    /** Candidate events; drawn by weight. */
    library: CompanyEventTemplate[];
    /** Likely-history weights by event kind (higher = more likely to be drawn). */
    kindWeights: Record<string, number>;
    count: Range;
  };
}

/** Optional steering that overrides sampled fields without authoring a new archetype. */
export interface CompanyDials {
  sizeBand?: string;
  industry?: string;
  ownership?: string;
  /** Absolute delta applied to financialHealth after sampling. */
  financialHealthAdj?: number;
  /** Per-axis absolute nudges applied to the sampled culture (signed). */
  cultureBias?: Partial<Record<CultureAxis, number>>;
}

/** A secondary archetype blended into the primary at `weight` (0–0.5). */
export interface CompanyBlend {
  archetype: CompanyArchetype;
  weight: number;
}

export interface GenerateCompanyOptions {
  companyId?: string;
  name?: string;
  dials?: CompanyDials;
  blend?: CompanyBlend;
}

// --- sampling helpers --------------------------------------------------------

const NEUTRAL: Range = [40, 60];
const sample = (rng: Rng, [lo, hi]: Range): number => clampUnit(lo + rng() * (hi - lo));
const sampleIntRaw = (rng: Rng, [lo, hi]: Range): number => Math.round(lo + rng() * (hi - lo));
const pick = <T>(rng: Rng, arr: T[]): T => arr[Math.floor(rng() * arr.length)];

/** Pull range `a` toward range `b` by `w` (per endpoint). */
const blendRange = (a: Range, b: Range, w: number): Range => [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w];

/** Weighted draw over `weights`; falls back to a uniform pick over `keys`. */
function weightedPick(rng: Rng, weights: Record<string, number>, keys?: string[]): string {
  const entries = (keys ?? Object.keys(weights)).map((k) => [k, Math.max(0, weights[k] ?? 0)] as const);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  if (total <= 0) return entries.length ? pick(rng, entries.map(([k]) => k)) : '';
  let r = rng() * total;
  for (const [k, w] of entries) {
    r -= w;
    if (r <= 0) return k;
  }
  return entries[entries.length - 1][0];
}

/** Draw up to `count` distinct items from `arr` (deterministic, order-preserving). */
function drawN<T>(rng: Rng, arr: T[], count: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i++) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return out;
}

// --- generation --------------------------------------------------------------

/**
 * Sample one coherent {@link Company} from an archetype + seed (deterministic:
 * same archetype + seed + opts → identical company). `opts.blend` pulls the
 * culture/economy ranges toward a secondary archetype; `opts.dials` overrides
 * specific sampled fields after the fact (authored-wins).
 */
export function generateCompany(
  archetype: CompanyArchetype,
  seed: number | string,
  opts: GenerateCompanyOptions = {},
): Company {
  const rng = mulberry32(typeof seed === 'number' ? seed >>> 0 : seedToInt(seed));
  const companyId = opts.companyId ?? `company_${typeof seed === 'string' ? seed : seed >>> 0}`;
  const c = createDefaultCompany(companyId, opts.name ?? archetype.label);
  const dials = opts.dials ?? {};

  const sec = opts.blend?.archetype;
  const w = sec ? Math.max(0, Math.min(0.5, opts.blend!.weight)) : 0;

  // Identity — picks from the archetype's pools; ranges blend with the secondary.
  c.identity.industry = dials.industry ?? pick(rng, archetype.identity.industries);
  c.identity.ownership = dials.ownership ?? pick(rng, archetype.identity.ownership);
  c.identity.sizeBand = dials.sizeBand ?? pick(rng, archetype.identity.sizeBands);
  c.identity.headcount = sampleIntRaw(rng, blendRange(archetype.identity.headcount, sec?.identity.headcount ?? archetype.identity.headcount, w));
  c.identity.foundedYear = sampleIntRaw(rng, archetype.identity.foundedYear);
  c.identity.reputation = sample(rng, blendRange(archetype.identity.reputation, sec?.identity.reputation ?? archetype.identity.reputation, w));

  // Culture spine — the load-bearing axes; unnamed axes sample neutral.
  for (const axis of CULTURE_AXES) {
    let r = archetype.culture[axis] ?? NEUTRAL;
    const s = sec?.culture[axis];
    if (s) r = blendRange(r, s, w);
    c.culture[axis] = sample(rng, r);
  }
  // Dial nudges on culture (signed, absolute).
  if (dials.cultureBias) {
    for (const axis of CULTURE_AXES) {
      const n = dials.cultureBias[axis];
      if (typeof n === 'number') c.culture[axis] = clampUnit(c.culture[axis] + n);
    }
  }

  // Economy — financial health/morale ranges blend; trajectory is a weighted draw.
  c.economy.financialHealth = sample(rng, blendRange(archetype.economy.financialHealth, sec?.economy.financialHealth ?? archetype.economy.financialHealth, w));
  c.economy.morale = sample(rng, blendRange(archetype.economy.morale, sec?.economy.morale ?? archetype.economy.morale, w));
  c.economy.trajectory = weightedPick(rng, archetype.economy.trajectoryWeights);
  if (typeof dials.financialHealthAdj === 'number') c.economy.financialHealth = clampUnit(c.economy.financialHealth + dials.financialHealthAdj);
  // Runway only when the archetype models it and the trajectory is shaky.
  c.economy.runwayMonths =
    archetype.economy.runwayMonths && (c.economy.trajectory === 'declining' || c.economy.trajectory === 'in-crisis')
      ? sampleIntRaw(rng, archetype.economy.runwayMonths)
      : null;

  // Mission vs. reality.
  c.mission.statedMission = pick(rng, archetype.mission.statedMissions);
  c.mission.actualPriority = pick(rng, archetype.mission.actualPriorities);
  c.mission.hypocrisyGap = sample(rng, blendRange(archetype.mission.hypocrisyGap, sec?.mission.hypocrisyGap ?? archetype.mission.hypocrisyGap, w));

  // Narrative / open-secrets.
  c.narrative.officialStory = pick(rng, archetype.narrative.officialStories);
  c.narrative.realStory = pick(rng, archetype.narrative.realStories);
  c.narrative.openSecrets = drawN(rng, archetype.narrative.openSecretsPool, sampleIntRaw(rng, archetype.narrative.openSecretCount));

  // Social climate.
  c.socialClimate.orgTrust = sample(rng, blendRange(archetype.socialClimate.orgTrust, sec?.socialClimate.orgTrust ?? archetype.socialClimate.orgTrust, w));
  c.socialClimate.rivalries = archetype.socialClimate.rivalryPool
    ? drawN(rng, archetype.socialClimate.rivalryPool, sampleIntRaw(rng, archetype.socialClimate.rivalryCount ?? [0, archetype.socialClimate.rivalryPool.length]))
    : [];
  c.socialClimate.powerCenters = archetype.socialClimate.powerCenterPool
    ? drawN(rng, archetype.socialClimate.powerCenterPool, sampleIntRaw(rng, archetype.socialClimate.powerCenterCount ?? [1, 2]))
    : [];

  // History — draw `count` events, biased by kind weight, magnitude sampled.
  c.history = sampleHistory(rng, archetype, sampleIntRaw(rng, archetype.history.count));

  clampCompany(c);
  return applyCompanyDerived(c);
}

/** Draw `count` distinct history events, weighting the kinds the archetype favors. */
function sampleHistory(rng: Rng, archetype: CompanyArchetype, count: number): CompanyEvent[] {
  const pool = [...archetype.history.library];
  const out: CompanyEvent[] = [];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i++) {
    // Weighted draw over the remaining pool by each event's kind weight.
    const weights = Object.fromEntries(pool.map((e, idx) => [String(idx), archetype.history.kindWeights[e.kind] ?? 1]));
    const idx = Number(weightedPick(rng, weights));
    const t = pool.splice(idx, 1)[0];
    out.push({
      id: t.id,
      title: t.title,
      description: t.description,
      kind: t.kind,
      when: t.when,
      magnitude: sample(rng, t.magnitude),
      visibility: t.visibility,
      involvedDepartments: [...(t.involvedDepartments ?? [])],
    });
  }
  return out;
}

// --- validation --------------------------------------------------------------

const checkRange = (issues: string[], label: string, r: Range, lo = 0, hi = 100) => {
  if (!Array.isArray(r) || r.length !== 2) {
    issues.push(`${label} must be a [min, max] range.`);
    return;
  }
  if (r[0] > r[1]) issues.push(`${label} has min > max (${r[0]} > ${r[1]}).`);
  if (r[0] < lo || r[1] > hi) issues.push(`${label} must stay within ${lo}–${hi} (got ${r[0]}..${r[1]}).`);
};

/** Human-readable issues with a company archetype. Empty = valid. */
export function validateCompanyArchetype(a: CompanyArchetype): string[] {
  const issues: string[] = [];
  if (!a.id) issues.push('Company archetype is missing id.');
  if (!a.label) issues.push(`Company archetype "${a.id}" is missing a label.`);

  if (!a.identity.industries.length) issues.push(`"${a.id}" has no industries to draw from.`);
  if (!a.identity.ownership.length) issues.push(`"${a.id}" has no ownership kinds to draw from.`);
  if (!a.identity.sizeBands.length) issues.push(`"${a.id}" has no size bands to draw from.`);
  checkRange(issues, `"${a.id}" identity.headcount`, a.identity.headcount, 0, 1_000_000);
  checkRange(issues, `"${a.id}" identity.foundedYear`, a.identity.foundedYear, 1800, 2200);
  checkRange(issues, `"${a.id}" identity.reputation`, a.identity.reputation);

  for (const axis of CULTURE_AXES) if (a.culture[axis]) checkRange(issues, `"${a.id}" culture.${axis}`, a.culture[axis]!);

  checkRange(issues, `"${a.id}" economy.financialHealth`, a.economy.financialHealth);
  checkRange(issues, `"${a.id}" economy.morale`, a.economy.morale);
  if (!Object.keys(a.economy.trajectoryWeights).length) issues.push(`"${a.id}" has no trajectory weights.`);

  if (!a.mission.statedMissions.length) issues.push(`"${a.id}" has no stated missions.`);
  if (!a.mission.actualPriorities.length) issues.push(`"${a.id}" has no actual priorities.`);
  checkRange(issues, `"${a.id}" mission.hypocrisyGap`, a.mission.hypocrisyGap);

  checkRange(issues, `"${a.id}" narrative.openSecretCount`, a.narrative.openSecretCount, 0, 50);
  checkRange(issues, `"${a.id}" socialClimate.orgTrust`, a.socialClimate.orgTrust);
  checkRange(issues, `"${a.id}" history.count`, a.history.count, 0, 50);

  for (const e of a.history.library) checkRange(issues, `"${a.id}" history event "${e.id}".magnitude`, e.magnitude);

  return issues;
}
