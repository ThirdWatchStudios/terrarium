import { describe, expect, it } from 'vitest';
import { Resvg } from '@resvg/resvg-js';

import { characterLayers, composeCharacter, composePortrait } from '../src/core/compositor';
import { unitRecipe } from '../src/core/renderings';
import type { CharacterRecipe, Facing } from '../src/core/types';
import { FACINGS } from '../src/core/types';
import { DEFAULT_STYLE } from '../src/data/defaults';
import { BODY_ARCHETYPES } from '../src/parts/bodyArchetypes';
import { poseVariantFor } from '../src/parts/poses';

function recipe(bodyId: string): CharacterRecipe {
  return {
    id: `always-on-arms-${bodyId}`,
    name: bodyId,
    parts: {
      body: bodyId,
      head: 'head-soft-square',
      hair: 'hair-side-part',
      outfit: 'outfit-tee',
      accessories: [],
    },
    palette: {
      skin: '#C68B59',
      hair: '#2B211D',
      outfitPrimary: '#315A78',
      outfitSecondary: '#E8E4D8',
      accent: '#D85A30',
    },
  };
}

function reconstructedSvg(identity: CharacterRecipe, facing: Facing | 'west'): {
  flat: string;
  reconstructed: string;
} {
  const style = structuredClone(DEFAULT_STYLE);
  style.render.contactShadow = 0;
  const flat = composeCharacter(identity, style, facing, 128, 'normal', { badge: false });
  const markup = characterLayers(identity, style)
    .filter((layer) => layer.mood === null)
    .map((layer) => {
      const source = layer.markup[facing];
      return layer.tint ? source.replaceAll('#FFFFFF', identity.palette[layer.tint]) : source;
    })
    .join('');
  return {
    flat,
    reconstructed:
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">` +
      `${markup}</svg>`,
  };
}

describe('always-on neutral arms', () => {
  it('makes omitted and explicit Neutral rendering identical, while explicit action poses replace it', () => {
    const facings = [...FACINGS, 'west'] as const;

    for (const archetype of BODY_ARCHETYPES) {
      const identity = recipe(archetype.part.id);
      for (const facing of facings) {
        const actual: Facing = facing === 'west' ? 'east' : facing;
        const unposed = composeCharacter(identity, DEFAULT_STYLE, facing, 128, 'normal', { badge: false });
        const neutral = composeCharacter(identity, DEFAULT_STYLE, facing, 128, 'normal', {
          badge: false,
          pose: 'neutral',
        });
        expect(unposed, `${archetype.id}/${facing} should resolve Neutral`).toBe(neutral);

        const variant = poseVariantFor('neutral', actual, archetype.anchors[actual])!;
        for (const shape of [...(variant.back ?? []), ...variant.front]) {
          expect(unposed, `${archetype.id}/${facing} omitted ${shape.d}`).toContain(`d="${shape.d}"`);
        }

        const point = composeCharacter(identity, DEFAULT_STYLE, facing, 128, 'normal', {
          badge: false,
          pose: 'point',
        });
        expect(point, `${archetype.id}/${facing} did not replace Neutral`).not.toBe(unposed);
      }
    }
  });

  it('keeps Neutral upper sleeves in portraits and emits sleeve, hand, and outline layers', () => {
    const facings = [...FACINGS, 'west'] as const;

    for (const archetype of BODY_ARCHETYPES) {
      const identity = recipe(archetype.part.id);
      const neutralSouth = poseVariantFor('neutral', 'south', archetype.anchors.south)!;
      const portrait = composePortrait(identity, DEFAULT_STYLE, 128);
      for (const shape of neutralSouth.front) {
        expect(portrait, `${archetype.id} portrait omitted ${shape.d}`).toContain(`d="${shape.d}"`);
      }

      const layers = characterLayers(identity, DEFAULT_STYLE);
      const sleeves = layers.find((layer) => layer.key === 'pose-neutral-front__outfitPrimary');
      const hands = layers.find((layer) => layer.key === 'pose-neutral-front__skin');
      expect(sleeves).toMatchObject({ partId: 'pose-neutral-front', slot: 'pose', z: 30 });
      expect(hands).toMatchObject({ partId: 'pose-neutral-front', slot: 'pose', z: 30 });
      for (const facing of facings) {
        expect(sleeves?.markup[facing], `${archetype.id}/${facing} has no sleeve layer`).not.toBe('');
        expect(hands?.markup[facing], `${archetype.id}/${facing} has no hand layer`).not.toBe('');
      }
      expect(layers.find((layer) => layer.key === 'outline')?.markup.south)
        .toContain(`d="${neutralSouth.front[0].d}"`);
    }
  });

  it('reconstructs the default arm-bearing flat sprite exactly from layer-atlas markup', () => {
    const facings = [...FACINGS, 'west'] as const;
    for (const archetype of BODY_ARCHETYPES) {
      const identity = recipe(archetype.part.id);
      for (const facing of facings) {
        const { flat, reconstructed } = reconstructedSvg(identity, facing);
        const flatPng = new Resvg(flat).render().asPng();
        const reconstructedPng = new Resvg(reconstructed).render().asPng();
        expect(
          Buffer.compare(flatPng, reconstructedPng),
          `${archetype.id}/${facing} layer reconstruction diverged from the flat compositor`,
        ).toBe(0);
      }
    }
  });

  it('applies the same fallback to operational units while preserving legacy unposed bytes', () => {
    for (const archetype of BODY_ARCHETYPES) {
      const unit = unitRecipe(recipe(archetype.part.id));
      expect(composeCharacter(unit, DEFAULT_STYLE, 'south', 128, 'normal', { badge: false }))
        .toBe(composeCharacter(unit, DEFAULT_STYLE, 'south', 128, 'normal', {
          badge: false,
          pose: 'neutral',
        }));
      expect(characterLayers(unit, DEFAULT_STYLE).some((layer) => layer.partId === 'pose-neutral-front')).toBe(true);
    }

    // Old saved recipes have no body-owned rig. Their unposed bytes remain
    // untouched until migration, and no generated Neutral layer is fabricated.
    const legacy = recipe('body-standard');
    expect(composeCharacter(legacy, DEFAULT_STYLE, 'south', 128, 'normal', { badge: false }))
      .not.toBe(composeCharacter(legacy, DEFAULT_STYLE, 'south', 128, 'normal', {
        badge: false,
        pose: 'neutral',
      }));
    expect(characterLayers(legacy, DEFAULT_STYLE).some((layer) => layer.partId === 'pose-neutral-front')).toBe(false);
  });
});
