import path from 'node:path';

import {
  renderQuotaCoDecorPersonalizationFamilyProductionValidation,
} from './quotaCoDecorPersonalizationFamilyCalibrationPreview';

function parseOutput(argv: readonly string[]): string {
  const outIndex = argv.indexOf('--out');
  return outIndex >= 0 && argv[outIndex + 1]
    ? argv[outIndex + 1]
    : path.join('docs', 'previews');
}

renderQuotaCoDecorPersonalizationFamilyProductionValidation(
  parseOutput(process.argv.slice(2)),
).then((result) => {
  process.stdout.write(
    'Wrote QuotaCo decor/personalization imported-art validation:\n' +
    `${result.svgPath}\n` +
    `${result.pngPath}\n` +
    `${result.metricsPath}\n`,
  );
}).catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
