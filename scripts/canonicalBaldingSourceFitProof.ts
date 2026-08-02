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
  CANONICAL_BALDING_HEAD_IDS,
  fitCanonicalBaldingVariant,
} from './parts/canonicalBaldingFit';

const SOURCE_FILES = [
  'assets/parts/hair/balding.south.svg',
  'assets/parts/hair/balding.east.svg',
  'assets/parts/hair/balding.north.svg',
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
  styleName: 'Balding',
  hairId: 'hair-balding',
  version: 2,
  outputDirectory: 'docs/previews/canonical-balding-production-validation-v2',
  sourceFiles: SOURCE_FILES,
  headIds: CANONICAL_BALDING_HEAD_IDS,
  sourceVariant: (facing) => SOURCE_VARIANTS[facing],
  proposalVariant: (headId: FittedHairHeadId, facing) =>
    fitCanonicalBaldingVariant(SOURCE_VARIANTS[facing], headId, facing),
  directionFocus: 'Tapered temples, bare crown, and low rear horseshoe must remain unmistakably Balding',
  scaleFocus: 'Temple wisps and the rear band must survive without becoming a full cap at actual size',
  method: {
    geometryOwner: 'three editable review-source Balding SVG facings',
    fit: 'independent declarative component transforms for temples, rear piece, and horseshoe',
    replacementPathBuilders: 0,
  },
  readmeNote: 'Post-approval validation for the sixth source-owned fitted hairstyle. The production resolver must remain identical to an independent fit of the three canonical Balding SVG facings through the declarative temple, rear-piece, and horseshoe component frames.',
};

writeCanonicalHairSourceFitReview(config);
