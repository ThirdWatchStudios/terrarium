/**
 * Workplace behaviors — the reusable catalog that bridges the gap between an
 * agent's inner state (drives / needs / pressures / traits / emotional state) and
 * the *visible actions* they take inside the office. A behavior answers:
 *
 *   "What does this person actually DO when they feel this way?"
 *
 * Behaviors are observable, explainable, socially consequential, and reusable: one
 * definition ("Steal Lunch") is selectable by many agents under different
 * circumstances (resentment, jealousy, revenge, boredom, territory). The behavior
 * is the same; the motivation changes.
 *
 * The tool authors *what behaviors exist* and *their constraints + couplings*; the
 * sim owns *which behavior happens now* — selection, simulation, scoring, and
 * outcome resolution are all sim-side (CONTRACT.md ownership boundary). This module
 * is the tool-side schema + vocabulary, exported verbatim as `behaviors.json` the
 * same way drives/traits/relationshipTypes are (§3.5–§3.7). It deliberately reuses
 * the existing catalogs' vocabulary — `traitModifiers` keys are trait ids (§3.6),
 * `relationshipRequirements.relationshipTypeAnyOf` are bond-type ids (§3.7) — rather
 * than inventing a parallel one.
 */

// --- categories -------------------------------------------------------------

/**
 * Top-level grouping for the behavior catalog. The five families an office's
 * pressure can express itself through, coarsest first by social consequence.
 */
export const BEHAVIOR_CATEGORIES = [
  'productivity',
  'social',
  'territorial',
  'coping',
  'escalation',
] as const;
export type BehaviorCategory = (typeof BEHAVIOR_CATEGORIES)[number];

export const BEHAVIOR_CATEGORY_LABELS: Record<BehaviorCategory, string> = {
  productivity: 'Productivity',
  social: 'Social',
  territorial: 'Territorial',
  coping: 'Coping',
  escalation: 'Escalation',
};

// --- visibility & severity --------------------------------------------------

/** How observable the act is to others — the sim weights social fallout by this. */
export const BEHAVIOR_VISIBILITY = ['private', 'semi-private', 'public'] as const;
export type BehaviorVisibility = (typeof BEHAVIOR_VISIBILITY)[number];

/** How socially consequential the act is, coarse and ordered (trivial → severe). */
export const BEHAVIOR_SEVERITY = ['trivial', 'minor', 'moderate', 'major', 'severe'] as const;
export type BehaviorSeverity = (typeof BEHAVIOR_SEVERITY)[number];

// --- suggestion vocabularies ------------------------------------------------
// These are *suggestions* the UI offers as datalists, not closed unions: the sim
// owns the real vocabulary, so authors may type any token. Keeping a curated set
// here keeps authored catalogs internally consistent without locking the field.

/**
 * Pressures — the felt, transient states (distinct from stable traits) that push
 * an agent toward a behavior. `pressureWeights` keys come from here; the value is
 * the relative pull this behavior has under that pressure. Free-text: the sim's
 * pressure model is authoritative.
 */
export const PRESSURE_SUGGESTIONS = [
  'resentment',
  'jealousy',
  'frustration',
  'boredom',
  'anxiety',
  'anger',
  'insecurity',
  'loneliness',
  'ambition',
  'spite',
  'fear',
  'guilt',
  'contempt',
  'envy',
  'overwhelm',
  'pride',
] as const;

/** Things the situation must offer for a behavior to be selectable (free-text). */
export const CONTEXT_SUGGESTIONS = [
  'break_room',
  'target_employee',
  'manager_present',
  'manager_absent',
  'meeting',
  'after_hours',
  'private_space',
  'open_floor',
  'audience_present',
  'one_on_one',
  'own_desk',
  'shared_space',
] as const;

/** Objects/resources the behavior acts on; the sim binds these to props (free-text). */
export const AFFORDANCE_SUGGESTIONS = [
  'lunch',
  'printer',
  'coffee_machine',
  'parking_spot',
  'meeting_room',
  'supplies',
  'preferred_seat',
  'whiteboard',
  'phone',
  'computer',
  'shared_calendar',
  'document',
] as const;

/**
 * Likely consequences the author expects this behavior to seed. The sim resolves
 * the actual effects; these are *expected* outcomes that make a catalog readable
 * and let the sim weight/log against intent. Free-text.
 */
export const OUTCOME_SUGGESTIONS = [
  'target_annoyed',
  'trust_loss',
  'trust_gain',
  'gossip_seed',
  'reputation_gain',
  'reputation_loss',
  'task_complete',
  'task_delayed',
  'morale_drop',
  'morale_boost',
  'conflict_escalation',
  'alliance_formed',
  'relationship_damage',
  'stress_relief',
  'hr_attention',
  'manager_notices',
] as const;

// --- relationship requirements ----------------------------------------------

/**
 * Relationship preconditions for a behavior to be available. Kept small and
 * structured: whether it even needs a target, whether that target must already be
 * known, and an optional restriction to particular bond types (ids into the
 * relationshipTypes catalog, §3.7). The numeric affinity/trust gates the sim may
 * also want stay sim-side — this is authoring intent, not a runtime query.
 */
export interface BehaviorRelationshipRequirements {
  /** Does the behavior act on another employee at all? */
  requiresTarget: boolean;
  /** Must the actor already know the target (vs. a stranger)? */
  targetKnown: boolean;
  /** Optional: only valid toward these bond types (relationshipTypes ids). Empty = any. */
  relationshipTypeAnyOf: string[];
}

// --- the definition ---------------------------------------------------------

export interface BehaviorDefinition {
  id: string;
  displayName: string;
  category: BehaviorCategory;
  description: string;
  /** Situational tokens that must hold; the sim matches these to live context. */
  requiredContext: string[];
  /** Objects/resources the behavior needs (sim binds to props/affordances). */
  requiredAffordances: string[];
  /** Pressure → relative pull. Only non-zero stored; the sim weights selection. */
  pressureWeights: Record<string, number>;
  /** Trait id (§3.6) → signed modifier to the behavior's likelihood. Only non-zero stored. */
  traitModifiers: Record<string, number>;
  relationshipRequirements: BehaviorRelationshipRequirements;
  visibility: BehaviorVisibility;
  severity: BehaviorSeverity;
  /** Expected consequences this behavior tends to seed (the sim resolves actuals). */
  outcomes: string[];
}

// --- factory ----------------------------------------------------------------

/** A blank, valid behavior for the "+ New behavior" path. */
export function createDefaultBehavior(id: string): BehaviorDefinition {
  return {
    id,
    displayName: 'New behavior',
    category: 'social',
    description: '',
    requiredContext: [],
    requiredAffordances: [],
    pressureWeights: {},
    traitModifiers: {},
    relationshipRequirements: { requiresTarget: false, targetKnown: false, relationshipTypeAnyOf: [] },
    visibility: 'public',
    severity: 'minor',
    outcomes: [],
  };
}

// --- validation -------------------------------------------------------------

export interface BehaviorValidationContext {
  /** Trait catalog ids — `traitModifiers` keys should resolve (warn, never block). */
  traitIds?: string[];
  /** Relationship-type ids — `relationshipTypeAnyOf` should resolve. */
  relationshipTypeIds?: string[];
}

/**
 * Human-readable issues with a behavior. Empty = valid. Unknown trait /
 * relationship-type ids are flagged (so a typo surfaces) but, like a persona's
 * one-off drive id, are not fatal — the sim falls back + logs (§7).
 */
export function validateBehavior(b: BehaviorDefinition, ctx: BehaviorValidationContext = {}): string[] {
  const issues: string[] = [];
  if (!b.id) issues.push('Behavior is missing an id.');
  if (!b.displayName?.trim()) issues.push(`Behavior "${b.id}" has no display name.`);
  if (!(BEHAVIOR_CATEGORIES as readonly string[]).includes(b.category))
    issues.push(`Behavior "${b.id}" has unknown category "${b.category}".`);
  if (!(BEHAVIOR_VISIBILITY as readonly string[]).includes(b.visibility))
    issues.push(`Behavior "${b.id}" has unknown visibility "${b.visibility}".`);
  if (!(BEHAVIOR_SEVERITY as readonly string[]).includes(b.severity))
    issues.push(`Behavior "${b.id}" has unknown severity "${b.severity}".`);

  if (ctx.traitIds) {
    const known = new Set(ctx.traitIds);
    for (const t of Object.keys(b.traitModifiers)) {
      if (!known.has(t)) issues.push(`Behavior "${b.id}" modifies unknown trait "${t}".`);
    }
  }
  if (ctx.relationshipTypeIds) {
    const known = new Set(ctx.relationshipTypeIds);
    for (const r of b.relationshipRequirements.relationshipTypeAnyOf) {
      if (!known.has(r)) issues.push(`Behavior "${b.id}" requires unknown relationship type "${r}".`);
    }
  }
  return issues;
}
