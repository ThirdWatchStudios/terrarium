import type { Facing, Slot } from '../../src/core/types';
import type { BodyArchetypeId } from '../../src/parts/bodyArchetypes';

export type PartImportMode = 'static' | 'body-art' | 'anchored-detail';
export type BodyDetailPointAnchor = 'neck';

/** Minimal explicit metadata required before an existing part may accept SVG art. */
export interface PartImportTarget {
  readonly id: string;
  readonly slot: Slot;
  readonly anchor: string;
  readonly facings: Partial<Record<Facing, unknown>>;
  readonly buildVariant?: unknown;
  readonly bodyAnchors?: unknown;
  readonly preserveLocalPaths?: boolean;
  readonly importMode?: PartImportMode;
  readonly referenceBodyId?: BodyArchetypeId;
  readonly placementAnchor?: BodyDetailPointAnchor;
}

const allFacings = { south: true, east: true, north: true } as const;
const target = (id: string, slot: 'head' | 'hair'): PartImportTarget => ({
  id,
  slot,
  anchor: 'headCenter',
  facings: allFacings,
});
const byteStableTarget = (id: string, slot: 'head' | 'hair'): PartImportTarget => ({
  ...target(id, slot),
  preserveLocalPaths: true,
});
const bodyTarget = (id: BodyArchetypeId): PartImportTarget => ({
  id,
  slot: 'body',
  anchor: 'body',
  facings: allFacings,
  bodyAnchors: true,
  importMode: 'body-art',
});

/**
 * Explicit v1 allowlist, kept independent of the generated registry so a stale
 * or renamed overlay can always be regenerated. `hair-none` has no art source.
 */
export const PART_IMPORT_TARGETS: readonly PartImportTarget[] = [
  bodyTarget('body-compact'),
  bodyTarget('body-balanced'),
  bodyTarget('body-large-frame'),
  bodyTarget('body-tall'),
  bodyTarget('body-soft'),
  target('head-round', 'head'),
  target('head-oval', 'head'),
  target('head-boxy', 'head'),
  target('head-long', 'head'),
  target('head-angular', 'head'),
  target('head-soft-square', 'head'),
  byteStableTarget('hair-short', 'hair'),
  target('hair-bob', 'hair'),
  target('hair-bun', 'hair'),
  byteStableTarget('hair-curly', 'hair'),
  target('hair-balding', 'hair'),
  target('hair-side-part', 'hair'),
  target('hair-pixie', 'hair'),
  byteStableTarget('hair-ponytail', 'hair'),
  byteStableTarget('hair-long-straight', 'hair'),
  byteStableTarget('hair-coils', 'hair'),
  target('head-fab', 'head'),
  {
    id: 'outfit-tee',
    slot: 'outfit',
    anchor: 'body',
    facings: { south: true, east: true },
    buildVariant: true,
    importMode: 'anchored-detail',
    referenceBodyId: 'body-balanced',
    placementAnchor: 'neck',
  },
];
