import type { Facing, Slot } from '../../src/core/types';
import type { BodyArchetypeId } from '../../src/parts/bodyArchetypes';

export type PartImportMode =
  | 'static'
  | 'body-art'
  | 'anchored-detail'
  | 'component-detail';
export type BodyDetailPointAnchor = 'neck';
export type BodyDetailFrame = 'upper-torso' | 'lower-torso';

export interface PartImportComponent {
  readonly id: string;
  readonly frame: BodyDetailFrame;
  readonly facings: Partial<Record<Facing, { readonly shapeCount: number }>>;
}

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
  readonly components?: readonly PartImportComponent[];
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
  bodyTarget('body-pinch'),
  target('head-round', 'head'),
  target('head-oval', 'head'),
  target('head-boxy', 'head'),
  target('head-long', 'head'),
  target('head-angular', 'head'),
  target('head-soft-square', 'head'),
  byteStableTarget('hair-short', 'hair'),
  target('hair-bob', 'hair'),
  byteStableTarget('hair-bun', 'hair'),
  byteStableTarget('hair-curly', 'hair'),
  byteStableTarget('hair-balding', 'hair'),
  byteStableTarget('hair-side-part', 'hair'),
  byteStableTarget('hair-pixie', 'hair'),
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
  {
    id: 'outfit-blazer',
    slot: 'outfit',
    anchor: 'body',
    facings: { south: true, east: true },
    buildVariant: true,
    importMode: 'component-detail',
    referenceBodyId: 'body-balanced',
    components: [
      {
        id: 'lapels',
        frame: 'upper-torso',
        facings: {
          south: { shapeCount: 3 },
          east: { shapeCount: 2 },
        },
      },
      {
        id: 'buttons',
        frame: 'lower-torso',
        facings: {
          south: { shapeCount: 2 },
          east: { shapeCount: 1 },
        },
      },
      {
        id: 'pocket',
        frame: 'lower-torso',
        facings: {
          south: { shapeCount: 1 },
          east: { shapeCount: 1 },
        },
      },
    ],
  },
  {
    id: 'outfit-polo',
    slot: 'outfit',
    anchor: 'body',
    facings: { south: true, east: true },
    buildVariant: true,
    importMode: 'component-detail',
    referenceBodyId: 'body-balanced',
    components: [
      {
        id: 'collar',
        frame: 'upper-torso',
        facings: {
          south: { shapeCount: 1 },
          east: { shapeCount: 1 },
        },
      },
      {
        id: 'placket',
        frame: 'upper-torso',
        facings: {
          south: { shapeCount: 1 },
          east: { shapeCount: 1 },
        },
      },
    ],
  },
  {
    id: 'outfit-shirt-tie',
    slot: 'outfit',
    anchor: 'body',
    facings: { south: true, east: true },
    buildVariant: true,
    importMode: 'component-detail',
    referenceBodyId: 'body-balanced',
    components: [
      {
        id: 'collar',
        frame: 'upper-torso',
        facings: {
          south: { shapeCount: 1 },
          east: { shapeCount: 1 },
        },
      },
      {
        id: 'tie',
        frame: 'upper-torso',
        facings: {
          south: { shapeCount: 1 },
          east: { shapeCount: 1 },
        },
      },
    ],
  },
];
