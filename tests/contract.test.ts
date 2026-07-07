import { describe, it, expect } from 'vitest';
import { MOODS } from '../src/core/types';
import { DEFAULT_CAST, DEFAULT_PROPS } from '../src/data/defaults';
import { PROP_TEMPLATES } from '../src/props/templates';
import { WALL_TEMPLATES, FLOOR_TEMPLATES } from '../src/tiles/templates';
import { BLOB_CONFIGS } from '../src/tiles/blob';
import { PROP_STATUSES } from '../src/parts/propStatus';
import { INTERACTION_PROP_TYPES, facilityCatalogJson } from '../src/core/layout';
import { tileShapeIsTintImpure } from '../src/core/compositor';
import type { PropPalette, ShapeSpec } from '../src/core/types';

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

  // Office-builder pivot (terrarium-office-builder-assets.md §1, b1 build-spec §4):
  // every prop template carries a whole-cell grid footprint, and the facility
  // catalog mirrors the sim FacilityDefinition. These gate the tool half so the
  // footprint/catalog fields can't silently drift from what the sim binds against.
  it('every prop template declares a whole-cell grid footprint', () => {
    for (const t of PROP_TEMPLATES) {
      expect(t.gridFootprint, `prop template "${t.id}" missing gridFootprint`).toBeTruthy();
      expect(Number.isInteger(t.gridFootprint.w) && t.gridFootprint.w >= 1, `bad footprint w on "${t.id}"`).toBe(true);
      expect(Number.isInteger(t.gridFootprint.h) && t.gridFootprint.h >= 1, `bad footprint h on "${t.id}"`).toBe(true);
    }
  });

  // Palette-as-runtime-lever (re-tintable layer atlases): every prop/wall/floor
  // template must keep its palette TOKENS and fixed LITERALS on separate shapes,
  // so each shape lands cleanly in one tint layer. A shape mixing a token on one
  // channel with a literal on the other would get its literal part wrongly tinted
  // at runtime. This is the tripwire — if it trips, promote the literal to a token
  // or split the shape (see tileShapeIsTintImpure).
  it('no prop/wall/floor template shape mixes a palette token with a literal', () => {
    const PAL: PropPalette = { primary: '$primary', secondary: '$secondary', accent: '$accent' };
    const params = (t: { params: Array<{ key: string; default: number }> }): Record<string, number> =>
      Object.fromEntries(t.params.map((p) => [p.key, p.default]));
    const offenders: string[] = [];
    const scan = (id: string, shapes: ShapeSpec[]) => {
      for (const s of shapes) if (tileShapeIsTintImpure(s)) offenders.push(`${id}: ${s.fill ?? ''}/${s.stroke ?? ''}`);
    };
    for (const t of PROP_TEMPLATES) scan(`prop ${t.id}`, t.build(params(t), PAL));
    for (const t of FLOOR_TEMPLATES) scan(`floor ${t.id}`, t.build(params(t), PAL));
    for (const t of WALL_TEMPLATES)
      for (const cfg of BLOB_CONFIGS) scan(`wall ${t.id} config=${cfg}`, t.build(cfg, params(t), PAL));
    expect(offenders, `tint-impure shapes:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('facility-catalog interaction anchors mirror INTERACTION_PROP_TYPES exactly', () => {
    const catalog = facilityCatalogJson();
    // Provisional v0 schema — flagged so a bump is a deliberate, noticed change.
    expect(catalog.version).toBe(0);
    for (const f of catalog.facilities) {
      if (f.kind === 'Wall') continue;
      const expected = INTERACTION_PROP_TYPES[f.propId];
      // AnchoredFacility ⇔ has an interaction type; the type equals the map value.
      expect(f.isInteractionAnchor, `${f.id} anchor flag disagrees with the interaction map`).toBe(Boolean(expected));
      expect(f.interactionType, `${f.id} interactionType disagrees with the interaction map`).toBe(expected ?? undefined);
    }
  });
});
