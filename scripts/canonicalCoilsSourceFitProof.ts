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
  CANONICAL_COILS_HEAD_IDS,
  fitCanonicalCoilsVariant,
} from './parts/canonicalCoilsFit';

const SOURCE_FILES = [
  'assets/parts/hair/coils.south.svg',
  'assets/parts/hair/coils.east.svg',
  'assets/parts/hair/coils.north.svg',
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
  styleName: 'Coils',
  hairId: 'hair-coils',
  version: 2,
  outputDirectory: 'docs/previews/canonical-coils-production-validation-v2',
  sourceFiles: SOURCE_FILES,
  headIds: CANONICAL_COILS_HEAD_IDS,
  sourceVariant: (facing) => SOURCE_VARIANTS[facing],
  proposalVariant: (headId: FittedHairHeadId, facing) =>
    fitCanonicalCoilsVariant(SOURCE_VARIANTS[facing], headId, facing),
  directionFocus: 'Dense cloud volume, lowered edge lobes, and rear-weighted profile must remain distinct from Curly',
  scaleFocus: 'The wider, denser coil cloud must remain visibly heavier than Curly at actual size',
  method: {
    geometryOwner: 'three editable canonical Coils SVG facings',
    lobeFit: 'one declarative center/radius frame per source-owned coil lobe',
    replacementPathBuilders: 0,
  },
  readmeNote: 'Post-approval validation for the tenth source-owned fitted hairstyle. The production resolver must remain identical to an independent fit of the three canonical Coils SVG facings through the declarative per-lobe component frames.',
};

writeCanonicalHairSourceFitReview(config);
