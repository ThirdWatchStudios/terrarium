import type { CharacterRecipe, CharacterRenderRecipe } from './types';
import { getPart } from '../parts/library';

type AccessoryRecipe = Pick<CharacterRecipe, 'parts'> & Partial<Pick<CharacterRenderRecipe, 'rigBodyId'>>;

/**
 * The effective identity accessory set for a recipe.
 *
 * Body-owned rigs can place one bulky object in a free hand while still
 * allowing wrist wear and every non-hand accessory. Preserve authoring order:
 * the first held prop wins. Legacy bodies intentionally keep their full arrays
 * byte-for-byte so existing projects and renders do not change.
 */
export function normalizedRiggedAccessories(recipe: AccessoryRecipe): string[] {
  const bodyId = recipe.rigBodyId ?? recipe.parts.body;
  if (!getPart(bodyId)?.bodyAnchors) return recipe.parts.accessories;

  let hasHeldProp = false;
  return recipe.parts.accessories.filter((id) => {
    if (getPart(id)?.handAttachmentRole !== 'held-prop') return true;
    if (hasHeldProp) return false;
    hasHeldProp = true;
    return true;
  });
}

/** Return a recipe whose persisted identity matches its effective pixels. */
export function normalizeCharacterRecipe<T extends CharacterRecipe>(recipe: T): T {
  const accessories = normalizedRiggedAccessories(recipe);
  if (
    accessories.length === recipe.parts.accessories.length &&
    accessories.every((id, index) => id === recipe.parts.accessories[index])
  ) {
    return recipe;
  }

  return {
    ...recipe,
    parts: { ...recipe.parts, accessories },
  } as T;
}
