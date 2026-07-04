import { describe, it, expect } from 'vitest';
import { MOODS } from '../src/core/types';
import { DEFAULT_CAST, DEFAULT_PROPS } from '../src/data/defaults';
import { PROP_TEMPLATES } from '../src/props/templates';
import { PROP_STATUSES } from '../src/parts/propStatus';

/**
 * Tool ↔ game integration contracts.
 *
 * These mirror what the consuming game (The-Water-Cooler, epic 28 "Sprite Office
 * Runtime Integration") binds against — see SPRITE_INTEGRATION.md. The game side
 * resolves sim state into sprites by *string id*: agent id → layer-atlas family,
 * social-state label → mood overlay, location id → layout room, interaction
 * anchor → prop. If either side renames one of those ids, the binding silently
 * falls back instead of erroring. These tests are the tripwire that the tool
 * half drifted; update BOTH repos together when a contract genuinely changes.
 */

// NOTE: office generation (and the "every office carries the sim-bound rooms"
// invariant) moved to the sim per ADR-0001; that contract is now enforced sim-side by
// docs/schema/office-layout.schema.json + OfficeLayoutWingGoldenTests. The remaining
// contracts below are the authored-ingredient ids the tool still owns.

// Sim AgentIds (Phase2 scenario fixture). Must equal recipe ids 1:1 so the
// exported layer-atlas family matches the agent the game spawns.
const SIM_AGENT_IDS = ['janice', 'carl', 'linda', 'manager'];

// Sim ShortTermSocialStateLabel, lowercased (None→normal) — the mood overlay
// names the floor body + roster portrait resolve the atlas by. Must equal
// WaterCooler.Simulation.ShortTermSocialStateLabel exactly.
const SIM_MOOD_NAMES = ['normal', 'anxious', 'slighted', 'confident', 'defensive', 'reassured'];

// Sim interaction anchors that need a *physical* prop counterpart (the rest are
// navigation waypoints that resolve to location bounds, not props) → the tool
// prop template id the binder's AnchorTemplateMap points at.
const SIM_PROP_TEMPLATES = ['water-cooler', 'coffee-machine', 'printer', 'mail-station', 'supply-cabinet', 'door', 'desk'];

// Tampered-prop swap contract: the sim swaps a prop's sprite to a broken variant
// keyed by the active tamper state (CoercionProductionRuntime tamper-state id →
// broken prop template, mirrored in ProductionPresentationFloorBinding's
// BrokenPropTemplateByTamperState). Each broken template must exist and ship a
// default instance, or the swap silently falls back to a red tint.
const SIM_BROKEN_PROP_TEMPLATES = ['printer-jammed', 'coffee-machine-broken', 'water-cooler-empty'];

// Overhead prop-status badge ids — the sim selects a cell from the shared
// prop-status-badges atlas by a prop's active tamper-state id, so these must
// equal the sim's CoercionProductionRuntime degraded tamper-state ids exactly.
const SIM_TAMPER_STATE_IDS = ['jammed', 'broken', 'out_of_service'];

describe('tool ↔ game integration contracts', () => {
  it('default cast ids equal the sim agent ids exactly', () => {
    expect([...DEFAULT_CAST.map((recipe) => recipe.id)].sort()).toEqual([...SIM_AGENT_IDS].sort());
  });

  it('mood overlay names are a 1:1 match with the sim social-state labels', () => {
    expect([...MOODS].sort()).toEqual([...SIM_MOOD_NAMES].sort());
  });

  it('every physical sim anchor has a matching prop template and a default instance', () => {
    const templateIds = PROP_TEMPLATES.map((template) => template.id);
    const instanceTemplateIds = DEFAULT_PROPS.map((prop) => prop.templateId);
    for (const id of SIM_PROP_TEMPLATES) {
      expect(templateIds, `missing prop template "${id}"`).toContain(id);
      expect(instanceTemplateIds, `no default instance exports prop "${id}"`).toContain(id);
    }
  });

  it('every tampered-prop swap target has a matching broken template and a default instance', () => {
    const templateIds = PROP_TEMPLATES.map((template) => template.id);
    const instanceTemplateIds = DEFAULT_PROPS.map((prop) => prop.templateId);
    for (const id of SIM_BROKEN_PROP_TEMPLATES) {
      expect(templateIds, `missing broken prop template "${id}"`).toContain(id);
      expect(instanceTemplateIds, `no default instance exports broken prop "${id}"`).toContain(id);
    }
  });

  it('prop-status badge ids are a 1:1 match with the sim tamper-state ids', () => {
    expect([...PROP_STATUSES].sort()).toEqual([...SIM_TAMPER_STATE_IDS].sort());
  });
});
