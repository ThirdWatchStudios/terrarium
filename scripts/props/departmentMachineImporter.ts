import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { Projection, ShapeSpec } from '../../src/core/types';
import {
  DEPARTMENT_MACHINE_PALETTE,
  DEPARTMENT_MACHINE_TEMPLATE_DEFINITIONS,
  DEPARTMENT_STAMP_DEFINITIONS,
} from '../../src/props/departmentMachineManifest';
import { compileStaticPropSource } from './importer';

export interface ImportedDepartmentMachineArt {
  readonly id: string;
  readonly projection: Projection;
  readonly sourceFile: string;
  readonly sourceSha256: string;
  readonly variants: Readonly<Record<string, readonly ShapeSpec[]>>;
  readonly sourceSvgVariants: Readonly<Record<string, string>>;
}

export interface ImportedDepartmentStampOverlay {
  readonly id: string;
  readonly displayName: string;
  readonly sourceFile: string;
  readonly sourceSha256: string;
  readonly exportDirectory: string;
  readonly svg: string;
}

export interface DepartmentMachineImportResult {
  readonly art: readonly ImportedDepartmentMachineArt[];
  readonly overlays: readonly ImportedDepartmentStampOverlay[];
}

const RESERVED_PRODUCT_COLORS = new Set([
  '#F0A000', // amber status register
  '#E5A000',
  '#D9708C', // rose social register
  '#C9657D',
]);

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function assertWorldOnlySource(sourceFile: string, svg: string): void {
  if (/<(?:text|script|foreignObject)\b/i.test(svg)) {
    throw new Error(`${sourceFile}: world sprites cannot contain text, script, or foreignObject`);
  }
  if (/\b(?:href|xlink:href|on[a-z]+)\s*=/i.test(svg)) {
    throw new Error(`${sourceFile}: external references and event attributes are forbidden`);
  }
  for (const match of svg.matchAll(/#[0-9A-Fa-f]{6}/g)) {
    const color = match[0].toUpperCase();
    if (RESERVED_PRODUCT_COLORS.has(color)) {
      throw new Error(`${sourceFile}: reserved amber/rose product color ${color}`);
    }
  }
}

function hash(source: string): string {
  return createHash('sha256').update(source).digest('hex');
}

export async function compileDepartmentMachineArt(
  inputDir: string,
  sourcePathPrefix: string,
): Promise<DepartmentMachineImportResult> {
  const art: ImportedDepartmentMachineArt[] = [];
  for (const template of DEPARTMENT_MACHINE_TEMPLATE_DEFINITIONS) {
    const variants: Record<string, readonly ShapeSpec[]> = {};
    const sourceSvgVariants: Record<string, string> = {};
    let firstSourceFile = '';
    const variantHashes: string[] = [];
    for (const variant of template.variants) {
      const absolutePath = path.join(inputDir, variant.sourceFile);
      const sourceFile = path.posix.join(sourcePathPrefix.replaceAll('\\', '/'), variant.sourceFile);
      const svg = await readFile(absolutePath, 'utf8');
      assertWorldOnlySource(sourceFile, svg);
      sourceSvgVariants[variant.key] = svg;
      variants[variant.key] = compileStaticPropSource(sourceFile, svg, {
        id: `${template.id}${variant.state ? `:${variant.state}` : ''}`,
        projection: template.projection,
        paletteDefaults: DEPARTMENT_MACHINE_PALETTE,
      });
      if (!firstSourceFile) firstSourceFile = sourceFile;
      variantHashes.push(hash(svg));
    }
    art.push({
      id: template.id,
      projection: template.projection,
      sourceFile: firstSourceFile,
      sourceSha256: hash(variantHashes.join('\n')),
      variants,
      sourceSvgVariants,
    });
  }

  const overlays: ImportedDepartmentStampOverlay[] = [];
  for (const overlay of DEPARTMENT_STAMP_DEFINITIONS) {
    const sourceFile = path.posix.join(sourcePathPrefix.replaceAll('\\', '/'), overlay.sourceFile);
    const svg = await readFile(path.join(inputDir, overlay.sourceFile), 'utf8');
    assertWorldOnlySource(sourceFile, svg);
    // Run overlays through the same strict SVG contract even though their final
    // export remains a transparent SVG/PNG layer rather than a placeable prop.
    compileStaticPropSource(sourceFile, svg, {
      id: `canister_stamp:${overlay.id}`,
      projection: 'plan',
      paletteDefaults: DEPARTMENT_MACHINE_PALETTE,
    });
    overlays.push({
      id: overlay.id,
      displayName: overlay.displayName,
      sourceFile,
      sourceSha256: hash(svg),
      exportDirectory: overlay.exportDirectory,
      svg,
    });
  }

  return {
    art: art.sort((left, right) => compareText(left.id, right.id)),
    overlays: overlays.sort((left, right) => compareText(left.id, right.id)),
  };
}

function quote(value: string): string {
  return JSON.stringify(value);
}

function emitShape(shape: ShapeSpec): string {
  const fields = [`d: ${quote(shape.d)}`];
  if (shape.fill !== undefined) fields.push(`fill: ${quote(shape.fill)}`);
  if (shape.stroke !== undefined) fields.push(`stroke: ${quote(shape.stroke)}`);
  if (shape.strokeWidth !== undefined) fields.push(`strokeWidth: ${shape.strokeWidth}`);
  if (shape.strokeLinecap !== undefined) fields.push(`strokeLinecap: ${quote(shape.strokeLinecap)}`);
  if (shape.strokeLinejoin !== undefined) fields.push(`strokeLinejoin: ${quote(shape.strokeLinejoin)}`);
  if (shape.opacity !== undefined) fields.push(`opacity: ${shape.opacity}`);
  if (shape.silhouette !== undefined) fields.push(`silhouette: ${shape.silhouette}`);
  return `{ ${fields.join(', ')} }`;
}

export function emitDepartmentMachineArt(result: DepartmentMachineImportResult): string {
  const lines = [
    "import type { ImportedPropArt } from '../authoredArt';",
    '',
    '// Generated by `npm run department-machines:import`. Do not edit by hand.',
    'export const QUOTA_CO_DEPARTMENT_MACHINE_ART = [',
  ];
  for (const imported of result.art) {
    lines.push('  {');
    lines.push(`    id: ${quote(imported.id)},`);
    lines.push(`    projection: ${quote(imported.projection)},`);
    lines.push(`    sourceFile: ${quote(imported.sourceFile)},`);
    lines.push(`    sourceSha256: ${quote(imported.sourceSha256)},`);
    lines.push(`    paletteDefaults: ${JSON.stringify(DEPARTMENT_MACHINE_PALETTE)},`);
    lines.push('    variants: {');
    for (const [key, shapes] of Object.entries(imported.variants).sort(([left], [right]) =>
      compareText(left, right)
    )) {
      lines.push(`      ${quote(key)}: [`);
      for (const shape of shapes) lines.push(`        ${emitShape(shape)},`);
      lines.push('      ],');
    }
    lines.push('    },');
    lines.push('    sourceSvgVariants: {');
    for (const [key, svg] of Object.entries(imported.sourceSvgVariants).sort(([left], [right]) =>
      compareText(left, right)
    )) {
      lines.push(`      ${quote(key)}: ${quote(svg)},`);
    }
    lines.push('    },');
    lines.push('  },');
  }
  lines.push('] as const satisfies readonly ImportedPropArt[];');
  lines.push('');
  lines.push('export const QUOTA_CO_DEPARTMENT_STAMP_OVERLAYS = [');
  for (const overlay of result.overlays) {
    lines.push('  {');
    lines.push(`    id: ${quote(overlay.id)},`);
    lines.push(`    displayName: ${quote(overlay.displayName)},`);
    lines.push(`    sourceFile: ${quote(overlay.sourceFile)},`);
    lines.push(`    sourceSha256: ${quote(overlay.sourceSha256)},`);
    lines.push(`    exportDirectory: ${quote(overlay.exportDirectory)},`);
    lines.push(`    svg: ${quote(overlay.svg)},`);
    lines.push('  },');
  }
  lines.push('] as const;');
  return `${lines.join('\n')}\n`;
}
