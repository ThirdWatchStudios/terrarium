/**
 * The Company model — Epic 0, the generative root of the office-scale cascade.
 *
 * Terrarium can generate *people*; this is the entity it could not generate
 * before — the **company they work for**, made as rich as a persona so a long
 * playthrough can open on a believable, *distinct* organization. A company is the
 * top-down root: its culture/economy/history cascade down into departments (E2),
 * the people generated within them (E3), the relationship graph (E3), and the
 * eligible scenarios (E4). See docs/office-scale/00-company-root-and-cascade.md.
 *
 * The shape deliberately mirrors `profile.ts`'s `CharacterProfile`:
 *   - identity                  ≙ persona identity
 *   - culture axes (the spine)  ≙ persona OCEAN + game axes  (0–100, "bias not lock")
 *   - economic state            ≙ persona needs (the pressure the org is under)
 *   - mission-vs-reality        ≙ persona drives (the official goal + the hypocrisy gap)
 *   - history (company events)  ≙ persona formativeEvents (the narrative charge)
 *   - narrative / open-secrets  ≙ persona beliefs/knowledge
 *   - social climate            ≙ persona relationships
 *   - derived climate aggregates ≙ persona `applyDerived` (computed, override-friendly)
 *
 * There is **one** department/org model — Epic 2's. This entity owns the company
 * *root* only; it carries no department list. The cascade (F0.3+, Pass 2) derives
 * departments into E2's catalog. The fields the tiers consume are named in
 * {@link CASCADE_SEAMS} (story S0.1.4).
 */
import { clampUnit, type Derived } from './profile';

// --- scale helpers (reused from the persona model) --------------------------

/** A value computed from the model unless a designer has overridden it. */
const derived = (value: number): Derived => ({ value: clampUnit(value), authored: false });

// --- culture axes (the company spine) ---------------------------------------

/**
 * The seven load-bearing culture axes — the company's "personality," each 0–100.
 * Like the persona spine they are *biases, not locks*: they tilt everything below
 * without fully determining it. By convention **100 is the charged / edgier pole**
 * (the one that makes for drama); see {@link CULTURE_AXIS_POLES}.
 */
export const CULTURE_AXES = [
  'hierarchy',
  'secrecy',
  'volatility',
  'cutthroat',
  'mercenary',
  'pace',
  'fear',
] as const;
export type CultureAxis = (typeof CULTURE_AXES)[number];

/** Human-readable `[low pole, high pole]` for each culture axis (UI + docs). */
export const CULTURE_AXIS_POLES: Record<CultureAxis, [string, string]> = {
  hierarchy: ['Flat', 'Hierarchical'],
  secrecy: ['Transparent', 'Secretive'],
  volatility: ['Stable', 'Volatile'],
  cutthroat: ['Collaborative', 'Cutthroat'],
  mercenary: ['Mission-driven', 'Mercenary'],
  pace: ['Relaxed', 'Burnout'],
  fear: ['Psychologically safe', 'Fearful'],
};

export type CultureAxes = Record<CultureAxis, number>;

// --- free-text-with-fallback vocabularies -----------------------------------
//
// As in profile.ts (DEPARTMENTS/SENIORITY etc.), these are *suggestion lists*,
// not union types — the fields stay `string` so older saves and one-off custom
// values survive, while the UI can render closed dropdowns. Extend a list to add
// a choice; the cascade falls back gracefully on an unrecognized value.

export const SIZE_BANDS = ['startup', 'small', 'midmarket', 'large', 'enterprise'] as const;

export const OWNERSHIP_KINDS = [
  'bootstrapped',
  'vc-backed',
  'public',
  'family',
  'pe-owned',
  'nonprofit',
  'government',
] as const;

export const TRAJECTORIES = ['growing', 'flat', 'declining', 'in-crisis'] as const;

export const INDUSTRIES = [
  'Finance',
  'Software',
  'Manufacturing',
  'Retail',
  'Healthcare',
  'Media',
  'Consulting',
  'Logistics',
  'Energy',
  'Nonprofit',
  'Government',
] as const;

/**
 * Company-history event kinds — the company analog of a persona's formative
 * events. Free text with these as the fallback vocabulary. Negative shocks
 * (layoff/scandal/reorg/founder_exit) drive the fear/factionalism climate; any
 * high-magnitude event drives volatility (see {@link applyCompanyDerived}).
 */
export const COMPANY_EVENT_KINDS = [
  'reorg',
  'layoff',
  'founder_exit',
  'merger',
  'acquisition',
  'scandal',
  'failed_product',
  'new_ceo',
  'funding_round',
  'ipo',
  'pivot',
  'record_quarter',
  'union_drive',
  'return_to_office',
] as const;

/** Event kinds that read as *negative shocks* — they raise fear + factionalism. */
export const NEGATIVE_EVENT_KINDS: readonly string[] = [
  'reorg',
  'layoff',
  'founder_exit',
  'scandal',
  'failed_product',
];

export const EVENT_VISIBILITY = ['public', 'open_secret', 'buried'] as const;
export type EventVisibility = (typeof EVENT_VISIBILITY)[number];

// --- the model sections -----------------------------------------------------

export interface CompanyIdentity {
  name: string;
  /** Free text; {@link INDUSTRIES} is the fallback vocabulary. */
  industry: string;
  foundedYear: number;
  /** Free text; {@link SIZE_BANDS} is the fallback vocabulary. */
  sizeBand: string;
  /** Approximate headcount — drives structure derivation (F0.3). */
  headcount: number;
  /** Free text; {@link OWNERSHIP_KINDS} is the fallback vocabulary. */
  ownership: string;
  /** External regard, 0–100. */
  reputation: number;
}

/** Economic state / health — the pressure the org is under (≙ persona needs). */
export interface EconomicState {
  /** 0–100. */
  financialHealth: number;
  /** Free text; {@link TRAJECTORIES} is the fallback vocabulary. */
  trajectory: string;
  /** Org-wide morale, 0–100. */
  morale: number;
  /** Cash runway in months, or null when not meaningful (e.g. comfortably profitable). */
  runwayMonths: number | null;
}

/** Mission vs. reality — the official goal and the gap to how it actually runs. */
export interface MissionReality {
  statedMission: string;
  actualPriority: string;
  /** 0–100: how wide the stated/actual gap is (the hypocrisy seam scenarios mine). */
  hypocrisyGap: number;
}

/** One company-scale formative event (≙ persona FormativeEvent). */
export interface CompanyEvent {
  id: string;
  title: string;
  description: string;
  /** Free text; {@link COMPANY_EVENT_KINDS} is the fallback vocabulary. */
  kind: string;
  /** Coarse time, free text: "recent", "two_years_ago", "at_founding", … */
  when: string;
  /** 0–100: how big a shock this was — scales its climate/edge/scenario pull. */
  magnitude: number;
  visibility: EventVisibility;
  /** Department ids/names this event touched — cascade seam to E2/E3 wiring. */
  involvedDepartments: string[];
}

/** Company narrative — the org-wide official story, the real story, open secrets. */
export interface CompanyNarrative {
  officialStory: string;
  realStory: string;
  openSecrets: string[];
}

/** A named tension between two departments / power centers. */
export interface NamedRivalry {
  a: string;
  b: string;
  note?: string;
}

/** Social climate — org-wide trust texture + named rivalries + power centers. */
export interface SocialClimate {
  /** 0–100 org-wide trust. */
  orgTrust: number;
  rivalries: NamedRivalry[];
  /** Where the real power sits (dept/role names, free text). */
  powerCenters: string[];
}

/**
 * Derived climate aggregates — the company analog of persona `applyDerived`.
 * Computed from culture + economy + history by {@link applyCompanyDerived}; an
 * authored override wins and is never clobbered by re-derivation. These are the
 * single "climate read" the cascade weighting consumes (factionalism biases the
 * relationship graph; fear/volatility tint persona generation and scenarios).
 */
export interface CompanyClimate {
  factionalism: Derived;
  fear: Derived;
  volatility: Derived;
}

export interface Company {
  /** Stable key (slug). The company package is exported under this id. */
  companyId: string;
  identity: CompanyIdentity;
  culture: CultureAxes;
  economy: EconomicState;
  mission: MissionReality;
  history: CompanyEvent[];
  narrative: CompanyNarrative;
  socialClimate: SocialClimate;
  /** Derived; kept in the editable model with `authored` flags (resolved on export). */
  climate: CompanyClimate;
}

// --- cascade seams (story S0.1.4) -------------------------------------------

/**
 * The company fields each downstream tier consumes — named here so the E1–E4
 * tiers are built against the right seam rather than retrofitting it. See
 * docs/office-scale/00-company-root-and-cascade.md and each tier's
 * "Cascade seam (Epic 0 tier)" section in its feature breakdown.
 */
export const CASCADE_SEAMS: Record<'E1' | 'E2' | 'E3_personas' | 'E3_relationships' | 'E4', {
  consumes: string[];
  note: string;
}> = {
  E2: {
    consumes: ['identity.headcount', 'identity.sizeBand', 'identity.industry', 'culture.hierarchy'],
    note: 'Structure derivation (F0.3) reads size/industry → department set, and hierarchy → org-chart depth/span; department subculture (F0.4) biases off the full culture axes.',
  },
  E3_personas: {
    consumes: ['culture', 'climate.fear', 'climate.volatility'],
    note: 'Culture-weighted persona generation (F0.5) weights Epic 3 archetype selection/sampling by company + department culture.',
  },
  E3_relationships: {
    consumes: ['socialClimate', 'climate.factionalism', 'history'],
    note: 'History-seeded relationship wiring (F0.6) biases the graph by factionalism and seeds concrete edges from formative company events.',
  },
  E4: {
    consumes: ['history', 'mission.hypocrisyGap', 'narrative.openSecrets'],
    note: 'History-seeded scenario eligibility (F0.7) maps event kinds → scenario-library families and biases salience.',
  },
  E1: {
    consumes: ['(department ids produced by F0.3)'],
    note: 'Multi-department layout groups wings by the cascade-produced department ids (no company field is read directly).',
  },
};

// --- derivation -------------------------------------------------------------

/** Coarse pressure read off the trajectory vocabulary (unknown → neutral 50). */
export function trajectoryPressure(trajectory: string): number {
  switch (trajectory) {
    case 'in-crisis':
      return 100;
    case 'declining':
      return 70;
    case 'flat':
      return 45;
    case 'growing':
      return 25;
    default:
      return 50;
  }
}

/** The strongest negative-shock magnitude in the history (0 when there is none). */
function negativeShock(history: CompanyEvent[]): number {
  return history.reduce((m, e) => (NEGATIVE_EVENT_KINDS.includes(e.kind) ? Math.max(m, e.magnitude) : m), 0);
}

/** The strongest shock of any kind (0 when the history is empty). */
function anyShock(history: CompanyEvent[]): number {
  return history.reduce((m, e) => Math.max(m, e.magnitude), 0);
}

/** Compute the three climate aggregates from the model. Pure; deterministic. */
export function deriveClimate(c: Company): Record<keyof CompanyClimate, number> {
  const { culture, economy, socialClimate, history } = c;
  const tp = trajectoryPressure(economy.trajectory);
  const negShock = negativeShock(history);
  const shock = anyShock(history);
  const rivalryBump = Math.min(20, socialClimate.rivalries.length * 7);

  return {
    // Factionalism = cutthroat + secrecy + low trust, plus a bump per named rivalry.
    factionalism: clampUnit(
      0.4 * culture.cutthroat + 0.3 * culture.secrecy + 0.3 * (100 - socialClimate.orgTrust) + rivalryBump,
    ),
    // Fear = the fear axis, lifted by volatility, weak finances, a bad trajectory,
    // and the memory of the worst negative shock.
    fear: clampUnit(
      0.4 * culture.fear +
        0.2 * culture.volatility +
        0.15 * (100 - economy.financialHealth) +
        0.15 * tp +
        0.1 * negShock,
    ),
    // Volatility climate = the volatility axis, the trajectory pressure, and the
    // freshest shock to the system.
    volatility: clampUnit(0.55 * culture.volatility + 0.25 * tp + 0.2 * shock),
  };
}

/**
 * Recompute every climate aggregate that has not been hand-authored. Mutates and
 * returns the company. Idempotent: running it twice yields the same model. Run on
 * create, after edits, and before export — same discipline as persona `applyDerived`.
 */
export function applyCompanyDerived(c: Company): Company {
  const d = deriveClimate(c);
  for (const key of ['factionalism', 'fear', 'volatility'] as const) {
    if (!c.climate[key].authored) c.climate[key].value = d[key];
  }
  return c;
}

// --- factory ----------------------------------------------------------------

const neutralCulture = (): CultureAxes =>
  Object.fromEntries(CULTURE_AXES.map((a) => [a, 50])) as CultureAxes;

/** A neutral company — all axes mid, lists empty, climate derived. */
export function createDefaultCompany(companyId: string, name = companyId): Company {
  const company: Company = {
    companyId,
    identity: {
      name,
      industry: '',
      foundedYear: 2000,
      sizeBand: 'small',
      headcount: 50,
      ownership: 'bootstrapped',
      reputation: 50,
    },
    culture: neutralCulture(),
    economy: { financialHealth: 50, trajectory: 'flat', morale: 50, runwayMonths: null },
    mission: { statedMission: '', actualPriority: '', hypocrisyGap: 0 },
    history: [],
    narrative: { officialStory: '', realStory: '', openSecrets: [] },
    socialClimate: { orgTrust: 50, rivalries: [], powerCenters: [] },
    climate: { factionalism: derived(50), fear: derived(50), volatility: derived(50) },
  };
  return applyCompanyDerived(company);
}

// --- validation -------------------------------------------------------------

/**
 * Human-readable issues with a company. Empty array = valid. Mirrors
 * `validateProfile`: the live UI clamps at the input layer; this is the
 * import/round-trip/generation guard.
 */
export function validateCompany(c: Company): string[] {
  const issues: string[] = [];
  const unit = (label: string, v: number) => {
    if (typeof v !== 'number' || v < 0 || v > 100) issues.push(`${label} must be 0–100 (got ${v}).`);
  };

  if (!c.companyId) issues.push('Company is missing companyId.');
  if (!c.identity.name) issues.push('Company is missing a name.');

  for (const a of CULTURE_AXES) unit(`culture.${a}`, c.culture[a]);
  unit('identity.reputation', c.identity.reputation);
  unit('economy.financialHealth', c.economy.financialHealth);
  unit('economy.morale', c.economy.morale);
  unit('mission.hypocrisyGap', c.mission.hypocrisyGap);
  unit('socialClimate.orgTrust', c.socialClimate.orgTrust);
  if (c.identity.headcount < 0) issues.push(`identity.headcount must be ≥ 0 (got ${c.identity.headcount}).`);
  if (c.economy.runwayMonths !== null && c.economy.runwayMonths < 0)
    issues.push(`economy.runwayMonths must be ≥ 0 or null (got ${c.economy.runwayMonths}).`);

  for (const key of ['factionalism', 'fear', 'volatility'] as const) unit(`climate.${key}`, c.climate[key]?.value);

  const ids = new Set<string>();
  for (const e of c.history) {
    if (!e.id) issues.push(`History event "${e.title}" is missing an id.`);
    else if (ids.has(e.id)) issues.push(`Duplicate history event id "${e.id}".`);
    ids.add(e.id);
    unit(`history "${e.id}".magnitude`, e.magnitude);
  }

  for (const r of c.socialClimate.rivalries) {
    if (!r.a || !r.b) issues.push('A named rivalry is missing one of its two sides.');
    if (r.a && r.a === r.b) issues.push(`Rivalry "${r.a}" points at itself.`);
  }

  return issues;
}

/** Clamp every numeric field into range. Mutates and returns. */
export function clampCompany(c: Company): Company {
  for (const a of CULTURE_AXES) c.culture[a] = clampUnit(c.culture[a]);
  c.identity.reputation = clampUnit(c.identity.reputation);
  c.economy.financialHealth = clampUnit(c.economy.financialHealth);
  c.economy.morale = clampUnit(c.economy.morale);
  c.mission.hypocrisyGap = clampUnit(c.mission.hypocrisyGap);
  c.socialClimate.orgTrust = clampUnit(c.socialClimate.orgTrust);
  for (const e of c.history) e.magnitude = clampUnit(e.magnitude);
  for (const key of ['factionalism', 'fear', 'volatility'] as const) c.climate[key].value = clampUnit(c.climate[key].value);
  return c;
}

// --- export serialization ---------------------------------------------------

/**
 * The consumer-facing shape for `company.json` (F0.8 — the cascade-package root).
 * Climate aggregates resolve to plain numbers (the sim shouldn't re-derive) and
 * the authoring-only `authored` flags drop, same split as `serializeProfile`.
 * The full editable form (with `Derived` wrappers) lives in project.json.
 */
export function serializeCompany(input: Company): unknown {
  const c = applyCompanyDerived(structuredClone(input));
  return {
    companyId: c.companyId,
    identity: c.identity,
    culture: c.culture,
    economy: c.economy,
    mission: c.mission,
    history: c.history,
    narrative: c.narrative,
    socialClimate: c.socialClimate,
    climate: {
      factionalism: c.climate.factionalism.value,
      fear: c.climate.fear.value,
      volatility: c.climate.volatility.value,
    },
    meta: { generator: 'sprite-character-creator', schema: '00-company-root-and-cascade.md' },
  };
}

/**
 * Reconstruct an editable {@link Company} from the serialized `company.json` form
 * (the inverse of {@link serializeCompany}). The flattened climate numbers come
 * back as **authored** `Derived` values so a round-trip preserves them exactly
 * (`serializeCompany(parseCompany(serializeCompany(c)))` is stable). Tolerant of a
 * partial object — missing sections fall back to a default company's.
 */
export function parseCompany(input: unknown): Company {
  const raw = (input ?? {}) as Record<string, unknown>;
  const base = createDefaultCompany(String(raw.companyId ?? 'company'));
  const climate = (raw.climate ?? {}) as Partial<Record<keyof CompanyClimate, number>>;
  const authored = (value: number | undefined, fallback: number): Derived => ({
    value: clampUnit(typeof value === 'number' ? value : fallback),
    authored: true,
  });
  return {
    companyId: String(raw.companyId ?? base.companyId),
    identity: { ...base.identity, ...(raw.identity as object) },
    culture: { ...base.culture, ...(raw.culture as object) },
    economy: { ...base.economy, ...(raw.economy as object) },
    mission: { ...base.mission, ...(raw.mission as object) },
    history: Array.isArray(raw.history) ? (raw.history as Company['history']) : [],
    narrative: { ...base.narrative, ...(raw.narrative as object) },
    socialClimate: { ...base.socialClimate, ...(raw.socialClimate as object) },
    climate: {
      factionalism: authored(climate.factionalism, base.climate.factionalism.value),
      fear: authored(climate.fear, base.climate.fear.value),
      volatility: authored(climate.volatility, base.climate.volatility.value),
    },
  };
}
