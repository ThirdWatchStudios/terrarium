import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  QUOTA_CO_DOOR_MATERIALS,
  QUOTA_CO_DOOR_SOURCE_DEFINITIONS,
} from '../src/props/doorManifest';
import { fullCellQuietWallDoorSvg } from './quietWallDoorFullCellOpeningPreview';

interface Options {
  readonly check: boolean;
  readonly output: string;
}

const REVIEW_MATERIAL_ID = {
  office: 'office-wall',
  brick: 'brick-wall',
  panel: 'panel-wall',
  cubicle: 'cubicle-partition',
  slat: 'slat-wall',
} as const;

function parseArgs(argv: readonly string[]): Options {
  let check = true;
  let output = path.resolve('assets/walls/quota-co-building-openings-v2');
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--check') check = true;
    else if (argument === '--write') check = false;
    else if (argument === '--out') {
      const value = argv[++index];
      if (!value) throw new Error('--out requires a path');
      output = path.resolve(value);
    } else if (argument === '--help' || argument === '-h') {
      process.stdout.write(
        'Usage: tsx scripts/promoteQuietWallDoorRuntimeCorrection.ts [--check|--write] [--out <dir>]\n',
      );
      process.exit(0);
    } else throw new Error(`Unknown argument ${argument}`);
  }
  return { check, output };
}

function inner(svg: string): string {
  return svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

function capitalize(value: string): string {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

function promotedSource(definition: (typeof QUOTA_CO_DOOR_SOURCE_DEFINITIONS)[number]): string {
  const material = QUOTA_CO_DOOR_MATERIALS.find(({ id }) => id === definition.materialId);
  if (!material) throw new Error(`Missing material ${definition.materialId}`);
  const prefix = `${definition.axis}-door-${definition.state}-${definition.materialId}`;
  let part = 0;
  const visible = inner(fullCellQuietWallDoorSvg(
    REVIEW_MATERIAL_ID[definition.materialId],
    definition.axis,
    definition.state,
    material.palette,
  ))
    .replace(/<(path|circle)\b/g, (_match, element: string) => {
      part += 1;
      return `<${element} id="${prefix}-part-${String(part).padStart(2, '0')}"`;
    })
    .replace(/\/>\s*</g, '/>\n    <');
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" data-prop-id="door" data-projection="plan" data-runtime-grid-scale="0.5" data-wall-material-id="${material.wallIds[1]}" data-axis="${definition.axis}" data-state="${definition.state}">`,
    `  <title>QuotaCo ${material.label.toLowerCase()} ${definition.axis} sliding auto-door, ${definition.state}</title>`,
    `  <desc>${capitalize(material.label)} wall-owned full-cell opening with palette-inheriting structure, compensated to the 64-unit Unity wall-slot envelope.</desc>`,
    `  <g id="${prefix}" transform="translate(32 32) scale(.5)">`,
    `    ${visible}`,
    '  </g>',
    '</svg>',
    '',
  ].join('\n');
}

async function writeAtomic(file: string, contents: string): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp-${process.pid}`;
  await writeFile(temporary, contents, 'utf8');
  await rename(temporary, file);
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const stale: string[] = [];
  for (const definition of QUOTA_CO_DOOR_SOURCE_DEFINITIONS) {
    const file = path.join(options.output, definition.sourceFile);
    const expected = promotedSource(definition);
    const current = await readFile(file, 'utf8').catch(() => undefined);
    if (current === expected) continue;
    stale.push(definition.sourceFile);
    if (!options.check) await writeAtomic(file, expected);
  }
  if (options.check && stale.length > 0) {
    throw new Error(
      `${stale.length} corrected door sources are stale; run ` +
      '`tsx scripts/promoteQuietWallDoorRuntimeCorrection.ts --write`',
    );
  }
  process.stdout.write(
    options.check
      ? `Corrected door source bank is current (${QUOTA_CO_DOOR_SOURCE_DEFINITIONS.length} states).\n`
      : `Promoted ${stale.length} corrected door sources (${QUOTA_CO_DOOR_SOURCE_DEFINITIONS.length} checked).\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
