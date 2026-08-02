import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { Facing, PartVariant } from '../src/core/types';
import { FACINGS } from '../src/core/types';
import type { FittedHairHeadId } from '../src/parts/hairFitting';
import {
  writeCanonicalHairSourceFitReview,
  type CanonicalHairSourceFitReviewConfig,
} from './canonicalHairSourceFitReview';
import { compilePartSvg } from './parts/importer';
import {
  CANONICAL_PONYTAIL_HEAD_IDS,
  fitCanonicalPonytailVariant,
} from './parts/canonicalPonytailFit';

const SOURCE_FILES = [
  'assets/parts/hair/ponytail.south.svg',
  'assets/parts/hair/ponytail.east.svg',
  'assets/parts/hair/ponytail.north.svg',
] as const;

const SOURCE_VARIANTS = Object.fromEntries(FACINGS.map((facing, index) => {
  const source = SOURCE_FILES[index];
  return [facing, {
    z: 50,
    shapes: compilePartSvg(readFileSync(resolve(source), 'utf8'), {
      source,
      slot: 'hair',
    }),
  } satisfies PartVariant];
})) as Record<Facing, PartVariant>;

const config: CanonicalHairSourceFitReviewConfig = {
  phase: 'production',
  styleName: 'Ponytail',
  hairId: 'hair-ponytail',
  version: 2,
  outputDirectory: 'docs/previews/canonical-ponytail-production-validation-v2',
  sourceFiles: SOURCE_FILES,
  headIds: CANONICAL_PONYTAIL_HEAD_IDS,
  sourceVariant: (facing) => SOURCE_VARIANTS[facing],
  proposalVariant: (headId: FittedHairHeadId, facing) =>
    fitCanonicalPonytailVariant(SOURCE_VARIANTS[facing], headId, facing),
  directionFocus: 'Approved production route · cap, tie contact, and directional tail must match in every pair',
  scaleFocus: 'Tail survival, directional read, and head clearance must match at actual size',
  method: {
    geometryOwner: 'three imported canonical Ponytail SVG facings',
    capFit: 'bounded piecewise-linear landmark warp',
    attachmentFit: 'shared declarative translation for authored tie and tail',
    replacementPathBuilders: 0,
  },
  readmeNote: 'Post-approval validation for the fourth source-owned fitted hairstyle. The production resolver must remain identical to an independent fit of the three canonical Ponytail SVG facings through the declarative cap and shared tie/tail attachment frames.',
};

writeCanonicalHairSourceFitReview(config);
