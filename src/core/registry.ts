import { CURRENT_SCHEMA_VERSION, MOODS } from './types';
import { DEFAULT_OVERLAY_STYLE } from './overlayStyle';
import { ACTIVITIES, ACTIVITY_BADGES } from '../parts/activities';
import { MOOD_EMOTES } from '../parts/moods';
import { SOCIAL_STATES } from '../parts/socialStates';
import { PROP_STATUSES } from '../parts/propStatus';
import { EMOTION_DEFS } from '../parts/emotions';
import { ATTENTION_PUFFS, type AttentionPuff } from '../parts/attention';
import { ICONS, CURSORS } from '../parts/icons';

/**
 * The symbol registry — register-constitution.md Article I made mechanical.
 *
 * Every symbol id the export ships (floor badges, glyphs, puffs, overlay
 * channels, chrome icons, reactions, cursors) is listed here with the REGISTER
 * it speaks in: `truth` (what bodies leak), `human` (what people choose to
 * say), or `iris` (what the corporation claims). "There is no unregistered
 * speech" — tests/symbolRegistry.test.ts fails the build on any exported id
 * this file doesn't cover, and CONTRACT.md §3.15 ships the result as
 * `symbol-registry.json` so the sim can resolve register/provenance without
 * duplicating these decisions.
 *
 * Two dimensions beyond the register:
 *   - `kind`: `signal` narrates the office's live state; `chrome` is the
 *     workstation's own furniture (buttons, window controls, app marks). Only
 *     IRIS *signals* carry `provenance` (Article IV.4) — smearing "asserted"
 *     over every close-button would dilute the dimension that teaches the
 *     player where IRIS's blind spots are.
 *   - `mirrors`: the same vocabulary word in another carrier/register, as
 *     `"<family>/<id>"` (e.g. state-mood-hostile mirrors mood-emote/hostile).
 *     This link is what lets the sim stage DELIBERATE register disagreement —
 *     floor shows one word, chrome claims its sibling — and know it is lying.
 */

export type Register = 'truth' | 'human' | 'iris';

/** IRIS provenance (Article IV.4): how the corporation came by the claim. */
export type Provenance = 'measured' | 'inferred' | 'asserted';

export type SymbolKind = 'signal' | 'chrome';

export interface SymbolEntry {
  /** The contract id the sim binds against (atlas frame key / icon id / channel key). */
  id: string;
  label?: string;
  /** Vocabulary family — `family/id` is unique across the registry. */
  family: string;
  /** The exported artifact that resolves the id. */
  carrier: string;
  register: Register;
  kind: SymbolKind;
  /** Required iff register === 'iris' && kind === 'signal'. */
  provenance?: Provenance;
  /** Sibling entry (`"<family>/<id>"`) carrying the same word elsewhere. */
  mirrors?: string;
}

// Same subsets the exporter emits as atlas cells (exporter.ts).
const BADGED_ACTIVITIES = ACTIVITIES.filter((a) => ACTIVITY_BADGES[a]);
const EMOTED_MOODS = MOODS.filter((m) => MOOD_EMOTES[m]);

/**
 * Attention puffs split across registers — the constitution's worked example of
 * a per-id decision (Article I). emotion-spike / conflict / information mark
 * events that genuinely happened on the floor (truth: the office leaking "this
 * just changed"); `harvestable` is the corporation's VALUATION of a moment — no
 * body has ever leaked "harvestable" — so it is an IRIS claim, inferred.
 * (Its warm floor-bubble carrier is a known Article VIII tension; if it ever
 * moves to a cold carrier, only this table and the art change — not the id.)
 */
const PUFF_REGISTER: Record<AttentionPuff, { register: Register; provenance?: Provenance }> = {
  'attn-emotion-spike': { register: 'truth' },
  'attn-conflict': { register: 'truth' },
  'attn-information': { register: 'truth' },
  'attn-harvestable': { register: 'iris', provenance: 'inferred' },
};

/**
 * Overlay channels are the cold layer projected onto the warm floor
 * (Article VIII) — all IRIS. Provenance per channel: claims about inner or
 * social states are `inferred`; things the system detects or does itself
 * (an event flash, its own scan attention) are `measured`.
 */
const OVERLAY_PROVENANCE: Record<string, Provenance> = {
  trust: 'inferred',
  suspicion: 'inferred',
  belief: 'inferred',
  pressure: 'inferred',
  information: 'inferred',
  change: 'measured',
  surveillance: 'measured',
};

/**
 * Chrome icon classification by id prefix, in match order. Signals narrate the
 * office (and need provenance); everything unlisted is workstation chrome.
 *   - state-* mirrors the floor vocabulary; claims about people are `inferred`,
 *     detected events `measured` (state-attn-* follows its floor sibling's
 *     split: harvestable stays `inferred`).
 *   - pressure-* / need-* / rel-* / emotion-* are readings of inner or social
 *     states: `inferred`.
 *   - directive-* / capture-* / status-trend-* are IRIS's own bookkeeping — it
 *     genuinely knows its directives, readings and metrics: `measured`.
 */
const ICON_SIGNAL_RULES: Array<{
  prefix: string;
  provenance: Provenance | ((id: string) => Provenance);
  mirrors?: (bare: string) => string;
}> = [
  { prefix: 'state-activity-', provenance: 'inferred', mirrors: (b) => `activity-badge/${b}` },
  { prefix: 'state-social-', provenance: 'inferred', mirrors: (b) => `social-state-badge/${b}` },
  { prefix: 'state-mood-', provenance: 'inferred', mirrors: (b) => `mood-emote/${b}` },
  { prefix: 'state-emotion-', provenance: 'inferred', mirrors: (b) => `emotion-glyph/${b}` },
  {
    prefix: 'state-attn-',
    provenance: (id) => (id === 'state-attn-harvestable' ? 'inferred' : 'measured'),
    mirrors: (b) => `attention-puff/attn-${b}`,
  },
  { prefix: 'emotion-', provenance: 'inferred', mirrors: (b) => `emotion-glyph/${b}` },
  { prefix: 'pressure-', provenance: 'inferred' },
  { prefix: 'need-', provenance: 'inferred' },
  { prefix: 'rel-', provenance: 'inferred' },
  { prefix: 'directive-', provenance: 'measured' },
  { prefix: 'capture-', provenance: 'measured' },
  { prefix: 'status-trend-', provenance: 'measured' },
];

function iconEntry(id: string, label: string): SymbolEntry {
  // Human register: quoted speech stamped on Slack messages (Article V.3).
  if (id.startsWith('reaction-')) {
    return { id, label, family: 'reaction', carrier: 'icons-manifest', register: 'human', kind: 'signal' };
  }
  for (const rule of ICON_SIGNAL_RULES) {
    if (!id.startsWith(rule.prefix)) continue;
    const bare = id.slice(rule.prefix.length);
    return {
      id,
      label,
      family: 'state-icon',
      carrier: 'icons-manifest',
      register: 'iris',
      kind: 'signal',
      provenance: typeof rule.provenance === 'function' ? rule.provenance(id) : rule.provenance,
      ...(rule.mirrors ? { mirrors: rule.mirrors(bare) } : {}),
    };
  }
  // Everything else is the workstation's own furniture — IRIS chrome.
  return { id, label, family: 'ui-icon', carrier: 'icons-manifest', register: 'iris', kind: 'chrome' };
}

/** Every exported symbol id, registered. Order: floor families, spec files, icons, cursors. */
export function buildSymbolRegistry(): SymbolEntry[] {
  const entries: SymbolEntry[] = [];

  // Mood face overlays — the body's own face; nothing more truth-register exists.
  for (const mood of MOODS) {
    entries.push({ id: mood, family: 'mood-overlay', carrier: 'moods-atlas', register: 'truth', kind: 'signal' });
  }
  // Overhead floor families — bodies and props leaking state (truth).
  for (const mood of EMOTED_MOODS) {
    entries.push({ id: mood, family: 'mood-emote', carrier: 'mood-emotes-atlas', register: 'truth', kind: 'signal' });
  }
  for (const activity of BADGED_ACTIVITIES) {
    entries.push({
      id: activity,
      family: 'activity-badge',
      carrier: 'activity-badges-atlas',
      register: 'truth',
      kind: 'signal',
    });
  }
  for (const state of SOCIAL_STATES) {
    entries.push({
      id: state,
      family: 'social-state-badge',
      carrier: 'social-state-badges-atlas',
      register: 'truth',
      kind: 'signal',
    });
  }
  for (const e of EMOTION_DEFS) {
    entries.push({
      id: e.id,
      label: e.label,
      family: 'emotion-glyph',
      carrier: 'emotion-glyphs-atlas',
      register: 'truth',
      kind: 'signal',
    });
  }
  // A tampered prop leaking its condition is the prop's body language (truth) —
  // the sprite swap carries the same fact; the badge amplifies, never invents.
  for (const status of PROP_STATUSES) {
    entries.push({
      id: status,
      family: 'prop-status-badge',
      carrier: 'prop-status-badges-atlas',
      register: 'truth',
      kind: 'signal',
    });
  }
  for (const puff of ATTENTION_PUFFS) {
    entries.push({
      id: puff,
      family: 'attention-puff',
      carrier: 'attention-puffs-atlas',
      register: PUFF_REGISTER[puff].register,
      kind: 'signal',
      ...(PUFF_REGISTER[puff].provenance ? { provenance: PUFF_REGISTER[puff].provenance } : {}),
    });
  }

  // Spec-file vocabularies. Two people visibly talking is observable truth;
  // every overlay channel is an IRIS projection (Article VIII).
  entries.push({
    id: 'conversation-link',
    family: 'conversation',
    carrier: 'conversation-style.json',
    register: 'truth',
    kind: 'signal',
  });
  for (const [id, channel] of Object.entries(DEFAULT_OVERLAY_STYLE)) {
    entries.push({
      id,
      label: channel.concept,
      family: 'overlay-channel',
      carrier: 'overlay-style.json',
      register: 'iris',
      kind: 'signal',
      provenance: OVERLAY_PROVENANCE[id] ?? 'inferred',
    });
  }

  for (const icon of ICONS) entries.push(iconEntry(icon.id, icon.label));
  for (const cursor of CURSORS) {
    entries.push({
      id: cursor.id,
      label: cursor.label,
      family: 'cursor',
      carrier: 'cursors',
      register: 'iris',
      kind: 'chrome',
    });
  }

  return entries;
}

/** Exported descriptor — the sim resolves any symbol id to its register here. */
export function symbolRegistryJson() {
  const symbols = buildSymbolRegistry();
  const counts: Record<Register, number> & { chrome: number; signals: number } = {
    truth: 0,
    human: 0,
    iris: 0,
    chrome: 0,
    signals: 0,
  };
  for (const s of symbols) {
    counts[s.register] += 1;
    counts[s.kind === 'chrome' ? 'chrome' : 'signals'] += 1;
  }
  return {
    kind: 'symbol-registry' as const,
    generator: 'sprite-character-creator',
    schema: 'register-constitution.md',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    /** The three narrators (Article I) and the Prime Law (Article II). */
    registers: {
      truth: { speaks: 'what bodies leak', fails: 'ambiguity' },
      human: { speaks: 'what people choose to say', fails: 'spin' },
      iris: { speaks: 'what the corporation claims', fails: 'systematic-error' },
    },
    rules: {
      noUnregisteredSpeech: true,
      // Article IV.4 — only claims about the office carry provenance.
      provenanceRequiredFor: 'iris signals',
      // Article II — the UI must never resolve a disagreement for the player.
      registersMayDisagree: true,
    },
    counts,
    symbols,
    meta: {
      note:
        'Register = who is speaking (register-constitution.md). The sim selects symbols at ' +
        'runtime but may not move one across registers; mirrors links are the sanctioned ' +
        'lanes for staged truth/IRIS disagreement. Unknown ids fall back per CONTRACT.md.',
    },
  };
}
