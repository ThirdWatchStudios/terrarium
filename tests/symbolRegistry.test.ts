import { describe, it, expect } from 'vitest';
import { buildSymbolRegistry, symbolRegistryJson, type SymbolEntry } from '../src/core/registry';
import { MOODS } from '../src/core/types';
import { DEFAULT_OVERLAY_STYLE } from '../src/core/overlayStyle';
import { ACTIVITIES, ACTIVITY_BADGES } from '../src/parts/activities';
import { MOOD_EMOTES } from '../src/parts/moods';
import { SOCIAL_STATES } from '../src/parts/socialStates';
import { PROP_STATUSES } from '../src/parts/propStatus';
import { EMOTIONS } from '../src/parts/emotions';
import { ATTENTION_PUFFS } from '../src/parts/attention';
import { ICONS, CURSORS } from '../src/parts/icons';
import { REACTIONS } from '../src/parts/reactions';
import { POSES } from '../src/parts/poses';

/**
 * Register-constitution coverage guard (docs/register-constitution.md).
 *
 * Article I: "there is no unregistered speech" — every symbol id the export
 * ships must resolve to a register. Article IV.4: every IRIS *signal* carries
 * provenance. This test is those articles as CI: add a new badge, glyph, icon,
 * overlay channel or cursor without registering it and the build fails here,
 * with the constitution to point at.
 */

const registry = buildSymbolRegistry();
const byKey = new Map<string, SymbolEntry>(registry.map((s) => [`${s.family}/${s.id}`, s]));

function expectRegistered(family: string, id: string) {
  expect(byKey.has(`${family}/${id}`), `unregistered speech: ${family}/${id} (Article I)`).toBe(true);
}

describe('symbol registry — no unregistered speech (Article I)', () => {
  it('registers every floor-atlas cell', () => {
    for (const mood of MOODS) expectRegistered('mood-overlay', mood);
    for (const mood of MOODS.filter((m) => MOOD_EMOTES[m])) expectRegistered('mood-emote', mood);
    for (const activity of ACTIVITIES.filter((a) => ACTIVITY_BADGES[a])) expectRegistered('activity-badge', activity);
    for (const state of SOCIAL_STATES) expectRegistered('social-state-badge', state);
    for (const emotion of EMOTIONS) expectRegistered('emotion-glyph', emotion);
    for (const status of PROP_STATUSES) expectRegistered('prop-status-badge', status);
    for (const puff of ATTENTION_PUFFS) expectRegistered('attention-puff', puff);
    for (const pose of POSES) expectRegistered('pose', pose);
  });

  it('registers every overlay channel and the conversation link', () => {
    for (const channel of Object.keys(DEFAULT_OVERLAY_STYLE)) expectRegistered('overlay-channel', channel);
    expectRegistered('conversation', 'conversation-link');
  });

  it('registers every icon and cursor id', () => {
    const iconIds = new Set(registry.filter((s) => s.carrier === 'icons-manifest').map((s) => s.id));
    for (const icon of ICONS) {
      expect(iconIds.has(icon.id), `unregistered speech: icon ${icon.id} (Article I)`).toBe(true);
    }
    for (const cursor of CURSORS) expectRegistered('cursor', cursor.id);
  });

  it('has no duplicate family/id entries', () => {
    expect(byKey.size, 'duplicate family/id in the registry').toBe(registry.length);
  });
});

describe('symbol registry — register law', () => {
  it('every IRIS signal carries provenance; no one else does (Article IV.4)', () => {
    for (const s of registry) {
      const isIrisSignal = s.register === 'iris' && s.kind === 'signal';
      if (isIrisSignal) {
        expect(s.provenance, `IRIS signal ${s.family}/${s.id} has no provenance`).toBeTruthy();
      } else {
        expect(s.provenance, `${s.register} ${s.kind} ${s.family}/${s.id} must not claim provenance`).toBeUndefined();
      }
    }
  });

  it('every mirrors link resolves to a registered sibling', () => {
    for (const s of registry) {
      if (!s.mirrors) continue;
      expect(byKey.has(s.mirrors), `${s.family}/${s.id} mirrors unknown ${s.mirrors}`).toBe(true);
    }
  });

  it('all three registers are inhabited (Article I — three narrators)', () => {
    const counts = symbolRegistryJson().counts;
    expect(counts.truth, 'truth register is empty').toBeGreaterThan(0);
    expect(counts.human, 'human register is empty').toBeGreaterThan(0);
    expect(counts.iris, 'iris register is empty').toBeGreaterThan(0);
  });

  it('locks the ratified per-id decisions', () => {
    // The puff family deliberately splits across registers: events the floor
    // leaks are truth; "harvestable" is the corporation's valuation (inferred).
    expect(byKey.get('attention-puff/attn-emotion-spike')?.register).toBe('truth');
    expect(byKey.get('attention-puff/attn-conflict')?.register).toBe('truth');
    expect(byKey.get('attention-puff/attn-information')?.register).toBe('truth');
    expect(byKey.get('attention-puff/attn-harvestable')?.register).toBe('iris');
    expect(byKey.get('attention-puff/attn-harvestable')?.provenance).toBe('inferred');

    // Overlay channels are the cold layer projected onto the warm floor (Article VIII).
    for (const channel of Object.keys(DEFAULT_OVERLAY_STYLE)) {
      expect(byKey.get(`overlay-channel/${channel}`)?.register, `overlay ${channel} must be iris`).toBe('iris');
    }

    // Poses are the body's own held states — nothing is more truth-register.
    for (const pose of POSES) {
      expect(byKey.get(`pose/${pose}`)?.register, `pose ${pose} must be truth`).toBe('truth');
    }

    // Reactions are quoted human speech, one per canonical id.
    for (const id of REACTIONS) {
      expect(byKey.get(`reaction/reaction-${id}`)?.register, `reaction-${id} must be human`).toBe('human');
    }

    // The state-icon chrome mirrors the floor: same word, IRIS voice.
    expect(byKey.get('state-icon/state-mood-defensive')?.mirrors).toBe('mood-emote/defensive');
    expect(byKey.get('state-icon/state-emotion-embarrassment')?.mirrors).toBe('emotion-glyph/embarrassment');
    expect(byKey.get('state-icon/state-attn-harvestable')?.provenance).toBe('inferred');
    expect(byKey.get('state-icon/state-attn-conflict')?.provenance).toBe('measured');
  });
});

describe('symbol registry — exported descriptor', () => {
  it('ships the constitution header the sim binds against', () => {
    const json = symbolRegistryJson();
    expect(json.kind).toBe('symbol-registry');
    expect(json.schema).toBe('register-constitution.md');
    expect(json.rules.noUnregisteredSpeech).toBe(true);
    expect(json.rules.registersMayDisagree).toBe(true);
    expect(json.registers.truth.fails).toBe('ambiguity');
    expect(json.registers.human.fails).toBe('spin');
    expect(json.registers.iris.fails).toBe('systematic-error');
    expect(json.symbols.length).toBe(registry.length);
  });
});
