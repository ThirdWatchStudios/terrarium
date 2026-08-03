import type { Facing, Slot } from '../../src/core/types';
import type { BodyArchetypeId } from '../../src/parts/bodyArchetypes';

export type PartImportMode =
  | 'static'
  | 'head-fitted-art'
  | 'body-art'
  | 'fixed-body-art'
  | 'anchored-detail'
  | 'component-detail';
export type BodyDetailPointAnchor = 'neck';
export type BodyDetailFrame = 'upper-torso' | 'lower-torso';
export type HeadFitAdapter =
  | 'canonical-bob-v1'
  | 'canonical-short-v1'
  | 'canonical-bun-v1'
  | 'canonical-ponytail-v1'
  | 'canonical-long-straight-v1'
  | 'canonical-balding-v1'
  | 'canonical-pixie-v1'
  | 'canonical-side-part-v1'
  | 'canonical-curly-v1'
  | 'canonical-coils-v1';

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
  readonly headFitAdapter?: HeadFitAdapter;
  readonly variantZ?: number;
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
  {
    ...target('hair-short', 'hair'),
    importMode: 'head-fitted-art',
    headFitAdapter: 'canonical-short-v1',
    variantZ: 50,
  },
  {
    ...target('hair-bob', 'hair'),
    importMode: 'head-fitted-art',
    headFitAdapter: 'canonical-bob-v1',
    variantZ: 50,
  },
  {
    ...target('hair-bun', 'hair'),
    importMode: 'head-fitted-art',
    headFitAdapter: 'canonical-bun-v1',
    variantZ: 50,
  },
  {
    ...target('hair-curly', 'hair'),
    preserveLocalPaths: true,
    importMode: 'head-fitted-art',
    headFitAdapter: 'canonical-curly-v1',
    variantZ: 50,
  },
  {
    ...target('hair-balding', 'hair'),
    importMode: 'head-fitted-art',
    headFitAdapter: 'canonical-balding-v1',
    variantZ: 50,
  },
  {
    ...target('hair-side-part', 'hair'),
    importMode: 'head-fitted-art',
    headFitAdapter: 'canonical-side-part-v1',
    variantZ: 50,
  },
  {
    ...target('hair-pixie', 'hair'),
    importMode: 'head-fitted-art',
    headFitAdapter: 'canonical-pixie-v1',
    variantZ: 50,
  },
  {
    ...target('hair-ponytail', 'hair'),
    importMode: 'head-fitted-art',
    headFitAdapter: 'canonical-ponytail-v1',
    variantZ: 50,
  },
  {
    ...target('hair-long-straight', 'hair'),
    importMode: 'head-fitted-art',
    headFitAdapter: 'canonical-long-straight-v1',
    variantZ: 50,
  },
  {
    ...target('hair-coils', 'hair'),
    preserveLocalPaths: true,
    importMode: 'head-fitted-art',
    headFitAdapter: 'canonical-coils-v1',
    variantZ: 50,
  },
  target('head-fab', 'head'),
  {
    id: 'outfit-fab-chassis',
    slot: 'outfit',
    anchor: 'body',
    facings: allFacings,
    importMode: 'fixed-body-art',
    preserveLocalPaths: true,
    referenceBodyId: 'body-large-frame',
    variantZ: 20,
  },
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
  {
    id: 'outfit-turtleneck',
    slot: 'outfit',
    anchor: 'body',
    facings: { south: true, east: true, north: true },
    buildVariant: true,
    importMode: 'component-detail',
    referenceBodyId: 'body-balanced',
    components: [
      {
        id: 'neck-band',
        frame: 'upper-torso',
        facings: {
          south: { shapeCount: 2 },
          east: { shapeCount: 1 },
          north: { shapeCount: 1 },
        },
      },
    ],
  },
  {
    id: 'outfit-cardigan',
    slot: 'outfit',
    anchor: 'body',
    facings: { south: true, east: true },
    buildVariant: true,
    importMode: 'component-detail',
    referenceBodyId: 'body-balanced',
    components: [
      {
        id: 'trim',
        frame: 'upper-torso',
        facings: {
          south: { shapeCount: 1 },
          east: { shapeCount: 1 },
        },
      },
      {
        id: 'button-line',
        frame: 'lower-torso',
        facings: {
          south: { shapeCount: 3 },
          east: { shapeCount: 3 },
        },
      },
    ],
  },
  {
    id: 'outfit-suit-jacket',
    slot: 'outfit',
    anchor: 'body',
    facings: { south: true, east: true },
    buildVariant: true,
    importMode: 'component-detail',
    referenceBodyId: 'body-balanced',
    components: [
      {
        id: 'pocket-square',
        frame: 'lower-torso',
        facings: {
          south: { shapeCount: 1 },
          east: { shapeCount: 1 },
        },
      },
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
      {
        id: 'tie',
        frame: 'upper-torso',
        facings: {
          south: { shapeCount: 1 },
          east: { shapeCount: 1 },
        },
      },
      {
        id: 'notches',
        frame: 'upper-torso',
        facings: {
          south: { shapeCount: 1 },
          east: { shapeCount: 1 },
        },
      },
    ],
  },
  {
    id: 'outfit-hoodie',
    slot: 'outfit',
    anchor: 'body',
    facings: { south: true, east: true, north: true },
    buildVariant: true,
    importMode: 'component-detail',
    referenceBodyId: 'body-balanced',
    components: [
      {
        id: 'hood',
        frame: 'upper-torso',
        facings: {
          south: { shapeCount: 1 },
          east: { shapeCount: 1 },
          north: { shapeCount: 1 },
        },
      },
      {
        id: 'drawstrings',
        frame: 'upper-torso',
        facings: {
          south: { shapeCount: 3 },
          east: { shapeCount: 1 },
        },
      },
      {
        id: 'pocket',
        frame: 'lower-torso',
        facings: {
          south: { shapeCount: 1 },
        },
      },
    ],
  },
  {
    id: 'outfit-vest',
    slot: 'outfit',
    anchor: 'body',
    facings: { south: true },
    buildVariant: true,
    importMode: 'component-detail',
    referenceBodyId: 'body-balanced',
    components: [
      {
        id: 'panel',
        frame: 'upper-torso',
        facings: {
          south: { shapeCount: 1 },
        },
      },
      {
        id: 'neck-inset',
        frame: 'upper-torso',
        facings: {
          south: { shapeCount: 1 },
        },
      },
      {
        id: 'buttons',
        frame: 'lower-torso',
        facings: {
          south: { shapeCount: 2 },
        },
      },
    ],
  },
];
