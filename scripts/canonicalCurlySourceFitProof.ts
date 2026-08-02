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
  CANONICAL_CURLY_HEAD_IDS,
  fitCanonicalCurlyVariant,
} from './parts/canonicalCurlyFit';

const SOURCE_FILES = [
  'assets/parts/hair/curly.south.svg',
  'assets/parts/hair/curly.east.svg',
  'assets/parts/hair/curly.north.svg',
] as const;

const SOURCE_VARIANTS = Object.fromEntries(FACINGS.map((facing, index) => {
  const source = SOURCE_FILES[index];
  return [facing, {
    z: 50,
    shapes: compilePartSvg(readFileSync(resolve(source), 'utf8'), {
      source,
      slot: 'hair',
      preserveLocalPaths: true,
    }),
  } satisfies PartVariant];
})) as Record<Facing, PartVariant>;

const config: CanonicalHairSourceFitReviewConfig = {
  phase: 'production',
  styleName: 'Curly',
  hairId: 'hair-curly',
  version: 2,
  outputDirectory: 'docs/previews/canonical-curly-production-validation-v2',
  sourceFiles: SOURCE_FILES,
  headIds: CANONICAL_CURLY_HEAD_IDS,
  sourceVariant: (facing) => SOURCE_VARIANTS[facing],
  proposalVariant: (headId: FittedHairHeadId, facing) =>
    fitCanonicalCurlyVariant(SOURCE_VARIANTS[facing], headId, facing),
  directionFocus: 'Soft clustered lobes, open face, and rear-weighted profile must remain distinct from dense Coils',
  scaleFocus: 'Individual lobes must survive at actual size without merging into a smooth cap or dense coils',
  method: {
    geometryOwner: 'three editable canonical Curly SVG facings',
    lobeFit: 'one declarative center/radius frame per source-owned curl lobe',
    replacementPathBuilders: 0,
  },
  readmeNote: 'Post-approval validation for the ninth source-owned fitted hairstyle. The production resolver must remain identical to an independent fit of the three canonical Curly SVG facings through the declarative per-lobe component frames.',
};

writeCanonicalHairSourceFitReview(config);
