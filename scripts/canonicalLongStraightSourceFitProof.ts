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
  CANONICAL_LONG_STRAIGHT_HEAD_IDS,
  fitCanonicalLongStraightVariant,
} from './parts/canonicalLongStraightFit';

const SOURCE_FILES = [
  'assets/parts/hair/long-straight.south.svg',
  'assets/parts/hair/long-straight.east.svg',
  'assets/parts/hair/long-straight.north.svg',
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
  styleName: 'Long straight',
  hairId: 'hair-long-straight',
  version: 2,
  outputDirectory: 'docs/previews/canonical-long-straight-production-validation-v2',
  sourceFiles: SOURCE_FILES,
  headIds: CANONICAL_LONG_STRAIGHT_HEAD_IDS,
  sourceVariant: (facing) => SOURCE_VARIANTS[facing],
  proposalVariant: (headId: FittedHairHeadId, facing) =>
    fitCanonicalLongStraightVariant(SOURCE_VARIANTS[facing], headId, facing),
  directionFocus: 'Open face, asymmetric two-piece profile, and rear curtain must remain distinct in every direction',
  scaleFocus: 'The face opening and long fall must survive without merging into the torso at actual size',
  method: {
    geometryOwner: 'three editable review-source Long straight SVG facings',
    fit: 'bounded piecewise-linear crown, opening, width, and fall landmarks; both east pieces share the frame',
    replacementPathBuilders: 0,
  },
  readmeNote: 'Post-approval validation for the fifth source-owned fitted hairstyle. The production resolver must remain identical to an independent fit of the three canonical Long straight SVG facings through the declarative crown, opening, width, and fall frames.',
};

writeCanonicalHairSourceFitReview(config);
