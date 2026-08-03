import type { Facing, PartDef, PartVariant, ShapeSpec, Slot } from '../core/types';
import { FACINGS } from '../core/types';

export type ImportedPartSourceKind = 'authored' | 'generated' | 'curated';

/**
 * Geometry compiled from the strict authored-SVG dialect.
 *
 * Imported art is deliberately an overlay on an existing production part. The
 * handwritten definition remains authoritative for selection order, label,
 * anchors, z-order, body rig data, and any other runtime behavior.
 */
export interface ImportedStaticPartOverlay {
  readonly kind?: 'static';
  readonly id: string;
  readonly slot: Slot;
  readonly facings: Partial<Record<Facing, readonly ShapeSpec[]>>;
}

/**
 * Static canonical art plus build-time-expanded, head-specific variants.
 *
 * The SVG facings remain the only visible geometry source. Head variants are
 * generated from those shapes and declarative fit data; they are ordinary
 * baked PartVariants and add no recipe, runtime, or export-schema state.
 */
export interface ImportedHeadFittedPartOverlay {
  readonly kind: 'head-fitted-art';
  readonly id: string;
  readonly slot: 'hair';
  readonly facings: Partial<Record<Facing, readonly ShapeSpec[]>>;
  readonly headVariants: Readonly<
    Record<string, Partial<Record<Facing, PartVariant>>>
  >;
}

/**
 * Complete visible art for one production body.
 *
 * Body archetype records and the selectable library deliberately share their
 * PartDef objects. Applying this overlay therefore updates that existing object
 * in place instead of creating the split registry identity used by static art.
 * The handwritten definition remains authoritative for labels, z-order, and
 * the body-owned rig.
 */
export interface ImportedBodyArtOverlay {
  readonly kind: 'body-art';
  readonly id: string;
  readonly slot: 'body';
  readonly facings: Partial<Record<Facing, readonly ShapeSpec[]>>;
}

/**
 * Complete SVG-owned overlay for an outfit locked to one production body rig.
 *
 * The source supplies every visible shape. The adapter supplies only the
 * allowed body id and z-order; it deliberately has no handwritten geometry or
 * unknown-body fallback.
 */
export interface ImportedFixedBodyArtOverlay {
  readonly kind: 'fixed-body-art';
  readonly id: string;
  readonly slot: 'outfit';
  readonly bodyId: string;
  readonly z: number;
  readonly facings: Partial<Record<Facing, readonly ShapeSpec[]>>;
}

/**
 * Pre-expanded detail art for body-rig-aware builders.
 *
 * Each entry replaces only the builder's detail shapes for one production body
 * and facing. The original builder still owns z-order and remains the fallback
 * for legacy, future, or intentionally unauthored variants.
 */
export interface ImportedBodyDetailOverlay {
  readonly kind: 'body-detail';
  readonly id: string;
  readonly slot: Slot;
  readonly bodyVariants: Readonly<
    Record<string, Partial<Record<Facing, readonly ShapeSpec[]>>>
  >;
}

export type ImportedPartOverlay =
  | ImportedStaticPartOverlay
  | ImportedHeadFittedPartOverlay
  | ImportedBodyArtOverlay
  | ImportedFixedBodyArtOverlay
  | ImportedBodyDetailOverlay;

export interface ImportedPartProvenance {
  readonly id: string;
  readonly sourceKind: ImportedPartSourceKind;
  readonly sourceFiles: readonly string[];
}

export type ImportedPartArt = ImportedPartOverlay & ImportedPartProvenance;

function fail(message: string): never {
  throw new Error(`Imported part art: ${message}`);
}

/** Apply imported geometry without changing production picker/RNG order. */
export function applyImportedPartArt(
  baseParts: readonly PartDef[],
  importedArt: readonly ImportedPartOverlay[],
): PartDef[] {
  const indexes = new Map<string, number>();
  baseParts.forEach((part, index) => {
    if (indexes.has(part.id)) fail(`base library contains duplicate id ${part.id}`);
    indexes.set(part.id, index);
  });

  const result = [...baseParts];
  const importedIds = new Set<string>();

  for (const imported of importedArt) {
    if (importedIds.has(imported.id)) fail(`duplicate imported id ${imported.id}`);
    importedIds.add(imported.id);

    const index = indexes.get(imported.id);
    if (index === undefined) fail(`unknown production part ${imported.id}`);

    const base = result[index];
    if (base.slot !== imported.slot) {
      fail(`${imported.id} declares slot ${imported.slot}, expected ${base.slot}`);
    }
    if (imported.kind === 'head-fitted-art') {
      if (base.slot !== 'hair' || base.anchor !== 'headCenter' || base.buildVariant) {
        fail(`${imported.id} head-fitted-art overlays require static head-anchored hair`);
      }
      const headIds = Object.keys(imported.headVariants);
      if (headIds.length === 0) fail(`${imported.id} contains no head-fitted variants`);
      for (const headId of headIds) {
        const variants = imported.headVariants[headId];
        for (const facing of FACINGS) {
          const variant = variants?.[facing];
          if (!variant || variant.shapes.length === 0) {
            fail(`${imported.id}/${headId}/${facing} contains no fitted art`);
          }
        }
      }
    }
    if (imported.kind === 'body-art') {
      if (base.slot !== 'body' || base.anchor !== 'body') {
        fail(`${imported.id} body-art overlays require a body-anchored production part`);
      }
      if (base.buildVariant) {
        fail(`${imported.id} body-art overlays cannot replace buildVariant geometry`);
      }
      if (!base.bodyAnchors) {
        fail(`${imported.id} body-art overlays require a body-owned rig`);
      }

      const facings = { ...base.facings };
      for (const facing of FACINGS) {
        const shapes = imported.facings[facing];
        if (shapes === undefined) fail(`${imported.id}/${facing} is missing body art`);
        if (shapes.length === 0) fail(`${imported.id}/${facing} contains no shapes`);
        if (!shapes.some((shape) => shape.silhouette !== false)) {
          fail(`${imported.id}/${facing} contains no silhouette geometry`);
        }

        const baseVariant = base.facings[facing];
        if (!baseVariant) fail(`${imported.id}/${facing} has no production variant to replace`);
        facings[facing] = {
          ...baseVariant,
          shapes: shapes.map((shape) => ({ ...shape })),
        };
      }

      // Preserve the exact object shared by BODY_ARCHETYPES and PART_LIBRARY.
      // Only its visible facing art changes; bodyAnchors and all other metadata
      // retain their original identity.
      base.facings = facings;
      result[index] = base;
      continue;
    }
    if (imported.kind === 'fixed-body-art') {
      if (base.slot !== 'outfit' || base.anchor !== 'body') {
        fail(`${imported.id} fixed-body-art overlays require a body-anchored outfit`);
      }
      if (base.buildVariant) {
        fail(`${imported.id} fixed-body-art overlays cannot retain handwritten buildVariant geometry`);
      }
      if (!imported.bodyId || !Number.isFinite(imported.z)) {
        fail(`${imported.id} fixed-body-art overlay requires a body id and finite z-order`);
      }
      for (const facing of FACINGS) {
        const shapes = imported.facings[facing];
        if (!base.facings[facing]) {
          fail(`${imported.id}/${facing} has no production facing metadata`);
        }
        if (!shapes || shapes.length === 0) {
          fail(`${imported.id}/${facing} contains no fixed-body art`);
        }
        if (shapes.some((shape) => shape.silhouette !== false)) {
          fail(`${imported.id}/${facing} contains non-overlay geometry`);
        }
      }
      result[index] = {
        ...base,
        buildVariant: (facing, context) => {
          if (context.bodyId !== imported.bodyId) return undefined;
          const shapes = imported.facings[facing];
          if (!shapes) fail(`${imported.id}/${facing} is missing fixed-body art`);
          return {
            z: imported.z,
            shapes: shapes.map((shape) => ({ ...shape })),
          };
        },
      };
      continue;
    }
    if (imported.kind === 'body-detail') {
      if (!base.buildVariant) {
        fail(`${imported.id} has no buildVariant for a body-detail overlay`);
      }
      const buildVariant = base.buildVariant;
      const bodyIds = Object.keys(imported.bodyVariants);
      if (bodyIds.length === 0) fail(`${imported.id} contains no body variants`);
      for (const bodyId of bodyIds) {
        const variants = imported.bodyVariants[bodyId];
        if (!variants || !FACINGS.some((facing) => variants[facing] !== undefined)) {
          fail(`${imported.id}/${bodyId} contains no facing art`);
        }
        for (const facing of FACINGS) {
          const shapes = variants[facing];
          if (shapes?.length === 0) {
            fail(`${imported.id}/${bodyId}/${facing} contains no shapes`);
          }
          if (shapes?.some((shape) => shape.silhouette !== false)) {
            fail(`${imported.id}/${bodyId}/${facing} contains non-detail geometry`);
          }
        }
      }
      result[index] = {
        ...base,
        buildVariant: (facing, context) => {
          const baseVariant = buildVariant(facing, context);
          const shapes = context.bodyId
            ? imported.bodyVariants[context.bodyId]?.[facing]
            : undefined;
          if (shapes === undefined) return baseVariant;
          if (!baseVariant) {
            fail(`${imported.id}/${context.bodyId}/${facing} has no base dynamic variant`);
          }
          return {
            ...baseVariant,
            shapes: shapes.map((shape) => ({ ...shape })),
          };
        },
      };
      continue;
    }

    if (base.slot === 'body') {
      fail(`${imported.id} body parts require an explicit body-art overlay`);
    }
    if (base.buildVariant) {
      fail(`${imported.id} uses buildVariant and cannot accept a static-art overlay`);
    }

    const facings = { ...base.facings };
    let replacementCount = 0;
    for (const facing of FACINGS) {
      const shapes = imported.facings[facing];
      if (shapes === undefined) continue;

      const baseVariant = base.facings[facing];
      if (!baseVariant) fail(`${imported.id}/${facing} has no production variant to replace`);
      if (shapes.length === 0) fail(`${imported.id}/${facing} contains no shapes`);

      facings[facing] = {
        ...baseVariant,
        shapes: shapes.map((shape) => ({ ...shape })),
      };
      replacementCount++;
    }
    if (replacementCount === 0) fail(`${imported.id} contains no facing art`);

    result[index] = { ...base, facings };
  }

  return result;
}
