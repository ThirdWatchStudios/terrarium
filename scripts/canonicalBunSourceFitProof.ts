import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { Facing, PartVariant } from '../src/core/types';
import { FACINGS } from '../src/core/types';
import type { FittedHairHeadId } from '../src/parts/hairFitting';
import {
  writeCanonicalHairSourceFitReview,
  type CanonicalHairSourceFitReviewConfig,
} from './canonicalHairSourceFitReview';
import {
  CANONICAL_BUN_HEAD_IDS,
  fitCanonicalBunVariant,
} from './parts/canonicalBunFit';
import { compilePartSvg } from './parts/importer';

const SOURCE_FILES = [
  'assets/parts/hair/bun.south.svg',
  'assets/parts/hair/bun.east.svg',
  'assets/parts/hair/bun.north.svg',
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
  styleName: 'Bun',
  hairId: 'hair-bun',
  version: 2,
  outputDirectory: 'docs/previews/canonical-bun-production-validation-v2',
  sourceFiles: SOURCE_FILES,
  headIds: CANONICAL_BUN_HEAD_IDS,
  sourceVariant: (facing) => SOURCE_VARIANTS[facing],
  proposalVariant: (headId: FittedHairHeadId, facing) =>
    fitCanonicalBunVariant(SOURCE_VARIANTS[facing], headId, facing),
  directionFocus: 'Approved production route · cap and disconnected knot must match in every pair',
  scaleFocus: 'Knot survival, cap fit, and directional placement must match at actual size',
  method: {
    geometryOwner: 'three imported canonical Bun SVG facings',
    capFit: 'bounded piecewise-linear landmark warp',
    knotFit: 'separate declarative affine component frame',
    replacementPathBuilders: 0,
  },
  readmeNote: 'Post-approval validation for the third source-owned fitted hairstyle. The production resolver must remain identical to an independent fit of the three canonical Bun SVG facings through the declarative cap and knot frames.',
};

writeCanonicalHairSourceFitReview(config);
