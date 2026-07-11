import { getPart, partsForSlot } from '../parts/library';
import type { Slot } from '../core/types';

export interface CharacterPartOption {
  value: string;
  label: string;
}

type SinglePartSlot = Exclude<Slot, 'accessory'>;

const LEGACY_BODY_IDS = new Set(['body-standard', 'body-slim', 'body-broad']);

/**
 * Production body choices plus the current legacy value, when applicable.
 *
 * Injecting only the active legacy body keeps old recipes honest in the native
 * select without making any legacy or renderer-owned body generally selectable.
 */
export function bodyPickerOptions(currentBodyId: string): CharacterPartOption[] {
  const options = partsForSlot('body').map((part) => ({ value: part.id, label: part.label }));
  if (!LEGACY_BODY_IDS.has(currentBodyId) || options.some((option) => option.value === currentBodyId)) {
    return options;
  }

  const legacy = getPart(currentBodyId);
  if (!legacy || legacy.slot !== 'body') return options;
  return [{ value: legacy.id, label: `${legacy.label} (legacy)` }, ...options];
}

/**
 * Selectable parts plus a resolvable current-only value for non-body slots.
 *
 * Special recipes can legitimately retain parts that are excluded from normal
 * authoring and generation. Injecting only the active value keeps the native
 * select honest without advertising that part as a general character choice.
 * Bodies keep their narrower legacy-only policy above; renderer-owned bodies
 * must not become visible authoring options.
 */
export function partPickerOptions(slot: SinglePartSlot, currentPartId: string): CharacterPartOption[] {
  if (slot === 'body') return bodyPickerOptions(currentPartId);

  const options = partsForSlot(slot).map((part) => ({ value: part.id, label: part.label }));
  if (options.some((option) => option.value === currentPartId)) return options;

  const current = getPart(currentPartId);
  if (!current || current.slot !== slot) return options;
  return [{ value: current.id, label: `${current.label} (special)` }, ...options];
}
