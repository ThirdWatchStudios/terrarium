import type { Facing, PartDef, ShapeSpec, Slot } from '../core/types';
import { FACINGS } from '../core/types';

export type ImportedPartSourceKind = 'authored' | 'generated' | 'curated';

/**
 * Geometry compiled from the strict authored-SVG dialect.
 *
 * Imported art is deliberately an overlay on an existing production part. The
 * handwritten definition remains authoritative for selection order, label,
 * anchors, z-order, body rig data, and any other runtime behavior.
 */
export interface ImportedPartOverlay {
  readonly id: string;
  readonly slot: Slot;
  readonly facings: Partial<Record<Facing, readonly ShapeSpec[]>>;
}

export interface ImportedPartProvenance {
  readonly id: string;
  readonly sourceKind: ImportedPartSourceKind;
  readonly sourceFiles: readonly string[];
}

export interface ImportedPartArt extends ImportedPartOverlay, ImportedPartProvenance {}

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
