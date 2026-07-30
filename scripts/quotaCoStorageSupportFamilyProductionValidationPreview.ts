import path from 'node:path';

import {
  renderQuotaCoStorageSupportFamilyProductionValidation,
} from './quotaCoStorageSupportFamilyCalibrationPreview';

function parseOutput(argv: readonly string[]): string {
  const outIndex = argv.indexOf('--out');
  return outIndex >= 0 && argv[outIndex + 1]
    ? argv[outIndex + 1]
    : path.join('docs', 'previews');
}

renderQuotaCoStorageSupportFamilyProductionValidation(
  parseOutput(process.argv.slice(2)),
).then((result) => {
  process.stdout.write(
    'Wrote QuotaCo storage/support imported-art validation:\n' +
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
