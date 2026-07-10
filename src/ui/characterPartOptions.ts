import { getPart, partsForSlot } from '../parts/library';

export interface CharacterPartOption {
  value: string;
  label: string;
}

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
