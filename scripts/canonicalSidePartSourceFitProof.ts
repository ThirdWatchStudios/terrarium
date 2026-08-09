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
  CANONICAL_SIDE_PART_HEAD_IDS,
  fitCanonicalSidePartVariant,
} from './parts/canonicalSidePartFit';

const SOURCE_FILES = [
  'assets/parts/hair/side-part.south.svg',
  'assets/parts/hair/side-part.east.svg',
  'assets/parts/hair/side-part.north.svg',
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
  styleName: 'Side-part',
  hairId: 'hair-side-part',
  version: 2,
  outputDirectory: 'docs/previews/canonical-side-part-production-validation-v2',
  sourceFiles: SOURCE_FILES,
  headIds: CANONICAL_SIDE_PART_HEAD_IDS,
  sourceVariant: (facing) => SOURCE_VARIANTS[facing],
  proposalVariant: (headId: FittedHairHeadId, facing) =>
    fitCanonicalSidePartVariant(SOURCE_VARIANTS[facing], headId, facing),
  directionFocus: 'Asymmetric sweep, side/rear mass, and visible parting crease must remain directional',
  scaleFocus: 'The sweep and crease must survive without becoming a generic cap at actual size',
  method: {
    geometryOwner: 'three editable canonical Side-part SVG facings',
    capFit: 'bounded piecewise-linear crown, sweep, width, and profile landmarks',
    massFit: 'separate declarative side/rear component placement',
    detailFit: 'source-owned non-silhouette parting crease follows the cap frame',
    replacementPathBuilders: 0,
  },
  readmeNote: 'Post-approval validation for the eighth source-owned fitted hairstyle. The production resolver must remain identical to an independent fit of the three canonical Side-part SVG facings through the declarative cap/mass frames, including the source-owned non-silhouette parting crease.',
};

writeCanonicalHairSourceFitReview(config);
