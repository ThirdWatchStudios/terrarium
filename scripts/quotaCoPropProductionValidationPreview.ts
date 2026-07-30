import path from 'node:path';

import { renderQuotaCoPropProductionValidation } from './quotaCoPropRedesignCalibrationPreview';

function outputPath(args: readonly string[]): string {
  let output = path.resolve('docs/previews');
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument !== '--out') throw new Error(`Unknown argument ${argument}`);
    const value = args[++index];
    if (!value) throw new Error('--out requires a path');
    output = path.resolve(value);
  }
  return output;
}

async function main(): Promise<void> {
  const result = await renderQuotaCoPropProductionValidation(outputPath(process.argv.slice(2)));
  process.stdout.write(
    'Wrote QuotaCo prop production validation:\n' +
      `${result.svgPath}\n${result.pngPath}\n${result.metricsPath}\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
