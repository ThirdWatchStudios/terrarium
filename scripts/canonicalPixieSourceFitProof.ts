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
  CANONICAL_PIXIE_HEAD_IDS,
  fitCanonicalPixieVariant,
} from './parts/canonicalPixieFit';

const SOURCE_FILES = [
  'assets/parts/hair/pixie.south.svg',
  'assets/parts/hair/pixie.east.svg',
  'assets/parts/hair/pixie.north.svg',
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
  styleName: 'Pixie',
  hairId: 'hair-pixie',
  version: 2,
  outputDirectory: 'docs/previews/canonical-pixie-production-validation-v2',
  sourceFiles: SOURCE_FILES,
  headIds: CANONICAL_PIXIE_HEAD_IDS,
  sourceVariant: (facing) => SOURCE_VARIANTS[facing],
  proposalVariant: (headId: FittedHairHeadId, facing) =>
    fitCanonicalPixieVariant(SOURCE_VARIANTS[facing], headId, facing),
  directionFocus: 'Broken fringe, cropped cap, and asymmetric side tuft must retain a distinct Pixie read',
  scaleFocus: 'The irregular fringe and directional tuft must survive without becoming a generic Short cap',
  method: {
    geometryOwner: 'three editable review-source Pixie SVG facings',
    capFit: 'bounded piecewise-linear crown, fringe, width, and profile landmarks',
    tuftFit: 'separate declarative component placement',
    replacementPathBuilders: 0,
  },
  readmeNote: 'Post-approval validation for the seventh source-owned fitted hairstyle. The production resolver must remain identical to an independent fit of the three canonical Pixie SVG facings through the declarative cap/fringe and tuft frames.',
};

writeCanonicalHairSourceFitReview(config);
