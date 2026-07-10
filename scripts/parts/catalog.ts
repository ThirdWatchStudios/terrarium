import type { Facing, Slot } from '../../src/core/types';

/** Minimal explicit metadata required before an existing part may accept SVG art. */
export interface PartImportTarget {
  readonly id: string;
  readonly slot: Slot;
  readonly anchor: string;
  readonly facings: Partial<Record<Facing, unknown>>;
  readonly buildVariant?: unknown;
}

const allFacings = { south: true, east: true, north: true } as const;
const target = (id: string, slot: 'head' | 'hair'): PartImportTarget => ({
  id,
  slot,
  anchor: 'headCenter',
  facings: allFacings,
});

/**
 * Explicit v1 allowlist, kept independent of the generated registry so a stale
 * or renamed overlay can always be regenerated. `hair-none` has no art source.
 */
export const PART_IMPORT_TARGETS: readonly PartImportTarget[] = [
  target('head-round', 'head'),
  target('head-oval', 'head'),
  target('head-boxy', 'head'),
  target('head-long', 'head'),
  target('head-angular', 'head'),
  target('head-soft-square', 'head'),
  target('hair-short', 'hair'),
  target('hair-bob', 'hair'),
  target('hair-bun', 'hair'),
  target('hair-curly', 'hair'),
  target('hair-balding', 'hair'),
  target('hair-side-part', 'hair'),
  target('hair-pixie', 'hair'),
  target('hair-ponytail', 'hair'),
  target('hair-long-straight', 'hair'),
  target('hair-coils', 'hair'),
  target('head-fab', 'head'),
];
