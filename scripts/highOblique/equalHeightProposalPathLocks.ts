import { readdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import ts from 'typescript';

export interface EqualHeightProposalPathLockModule {
  readonly moduleFile: string;
  readonly arraySourceIds?: Readonly<Record<string, string>>;
}

export interface EqualHeightProposalPathLockChange {
  readonly moduleFile: string;
  readonly sourceFile: string;
  readonly sourceId: string;
  readonly pathId: string;
  readonly previousD: string;
  readonly currentD: string;
}

export interface ReconcileEqualHeightProposalPathLocksOptions {
  readonly rootDir: string;
  readonly sourceDir: string;
  readonly modules: readonly EqualHeightProposalPathLockModule[];
  readonly write?: boolean;
}

export interface ReconcileEqualHeightProposalPathLocksResult {
  readonly moduleCount: number;
  readonly sourceCount: number;
  readonly lockCount: number;
  readonly changes: readonly EqualHeightProposalPathLockChange[];
}

interface Replacement {
  readonly start: number;
  readonly end: number;
  readonly value: string;
}

interface IndexedSvg {
  readonly sourceFile: string;
  readonly paths: ReadonlyMap<string, string>;
}

interface PendingModule {
  readonly moduleFile: string;
  readonly content: string;
  readonly replacements: readonly Replacement[];
}

const EXACT_PATHS_NAME = /(?:^|_)EXACT_PATHS$/;
const PATH_TAG = /<path\b[\s\S]*?>/gi;
const ATTRIBUTE = /\b([:\w-]+)\s*=\s*(["'])([\s\S]*?)\2/g;

const normalizedRelative = (rootDir: string, filename: string): string =>
  path.relative(rootDir, filename).replaceAll(path.sep, '/');

async function collectSvgFiles(directory: string): Promise<readonly string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry): Promise<readonly string[]> => {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectSvgFiles(filename);
      return entry.isFile() && entry.name.endsWith('.svg') ? [filename] : [];
    }),
  );
  return nested.flat().sort();
}

function parseSvgPaths(sourceFile: string, content: string): ReadonlyMap<string, string> {
  const paths = new Map<string, string>();
  for (const tag of content.match(PATH_TAG) ?? []) {
    const attributes = new Map<string, string>();
    for (const match of tag.matchAll(ATTRIBUTE)) {
      attributes.set(match[1], match[3]);
    }
    const id = attributes.get('id');
    if (!id) continue;
    const d = attributes.get('d');
    if (d === undefined) {
      throw new Error(`${sourceFile}: path ${id} is missing its d attribute`);
    }
    if (paths.has(id)) {
      throw new Error(`${sourceFile}: duplicate path id ${id}`);
    }
    paths.set(id, d);
  }
  return paths;
}

async function indexSvgSources(
  rootDir: string,
  sourceDir: string,
): Promise<ReadonlyMap<string, IndexedSvg>> {
  const bySourceId = new Map<string, IndexedSvg>();
  for (const sourceFile of await collectSvgFiles(sourceDir)) {
    const sourceId = path.basename(sourceFile, '.svg');
    const existing = bySourceId.get(sourceId);
    if (existing) {
      throw new Error(
        `Duplicate proof source id ${sourceId}: ` +
        `${normalizedRelative(rootDir, existing.sourceFile)} and ` +
        normalizedRelative(rootDir, sourceFile),
      );
    }
    bySourceId.set(sourceId, {
      sourceFile,
      paths: parseSvgPaths(sourceFile, await readFile(sourceFile, 'utf8')),
    });
  }
  return bySourceId;
}

function unwrapInitializer(node: ts.Expression): ts.Expression {
  if (
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isParenthesizedExpression(node)
  ) {
    return unwrapInitializer(node.expression);
  }
  return node;
}

function propertyNameText(
  sourceFile: ts.SourceFile,
  property: ts.PropertyName,
): string {
  if (
    ts.isStringLiteralLike(property) ||
    ts.isIdentifier(property) ||
    ts.isNumericLiteral(property)
  ) {
    return property.text;
  }
  throw new Error(
    `${sourceFile.fileName}:${sourceFile.getLineAndCharacterOfPosition(property.getStart()).line + 1} ` +
    'EXACT_PATHS source keys must be static identifiers or literals',
  );
}

function quoted(value: string, previousLiteral: string): string {
  const quote = previousLiteral.startsWith('"') ? '"' : "'";
  return (
    quote +
    value
      .replaceAll('\\', '\\\\')
      .replaceAll(quote, `\\${quote}`)
      .replaceAll('\r', '\\r')
      .replaceAll('\n', '\\n') +
    quote
  );
}

function sourceForExactPathArray(
  sourceFile: ts.SourceFile,
  declarationName: string,
  initializer: ts.Expression,
  arraySourceIds: Readonly<Record<string, string>>,
): readonly [string, ts.ArrayLiteralExpression][] {
  const unwrapped = unwrapInitializer(initializer);
  if (ts.isObjectLiteralExpression(unwrapped)) {
    const arrays: [string, ts.ArrayLiteralExpression][] = [];
    for (const property of unwrapped.properties) {
      if (!ts.isPropertyAssignment(property)) {
        throw new Error(
          `${sourceFile.fileName}: ${declarationName} may contain only source array properties`,
        );
      }
      const value = unwrapInitializer(property.initializer);
      if (!ts.isArrayLiteralExpression(value)) {
        throw new Error(
          `${sourceFile.fileName}: ${declarationName}.${propertyNameText(sourceFile, property.name)} ` +
          'must be an array',
        );
      }
      arrays.push([propertyNameText(sourceFile, property.name), value]);
    }
    return arrays;
  }
  if (ts.isArrayLiteralExpression(unwrapped)) {
    const sourceId = arraySourceIds[declarationName];
    if (!sourceId) {
      throw new Error(
        `${sourceFile.fileName}: ${declarationName} needs an explicit source-id mapping`,
      );
    }
    return [[sourceId, unwrapped]];
  }
  throw new Error(
    `${sourceFile.fileName}: ${declarationName} must initialize an object or array literal`,
  );
}

function collectModuleReplacements(
  rootDir: string,
  moduleFile: string,
  content: string,
  svgSources: ReadonlyMap<string, IndexedSvg>,
  arraySourceIds: Readonly<Record<string, string>>,
): {
  readonly lockCount: number;
  readonly replacements: readonly Replacement[];
  readonly changes: readonly EqualHeightProposalPathLockChange[];
} {
  const parsed = ts.createSourceFile(
    moduleFile,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const replacements: Replacement[] = [];
  const changes: EqualHeightProposalPathLockChange[] = [];
  const seenLocks = new Set<string>();
  let exactPathDeclarationCount = 0;
  let lockCount = 0;

  const visit = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      EXACT_PATHS_NAME.test(node.name.text)
    ) {
      exactPathDeclarationCount++;
      if (!node.initializer) {
        throw new Error(`${moduleFile}: ${node.name.text} has no initializer`);
      }
      for (const [sourceId, array] of sourceForExactPathArray(
        parsed,
        node.name.text,
        node.initializer,
        arraySourceIds,
      )) {
        const source = svgSources.get(sourceId);
        if (!source) {
          throw new Error(`${moduleFile}: no unique proof SVG exists for ${sourceId}`);
        }
        for (const entry of array.elements) {
          if (
            !ts.isArrayLiteralExpression(entry) ||
            entry.elements.length !== 2 ||
            !entry.elements.every(ts.isStringLiteralLike)
          ) {
            throw new Error(
              `${moduleFile}:${parsed.getLineAndCharacterOfPosition(entry.getStart()).line + 1} ` +
              `${node.name.text} entries must be [pathId, d] string tuples`,
            );
          }
          const pathIdNode = entry.elements[0] as ts.StringLiteralLike;
          const dNode = entry.elements[1] as ts.StringLiteralLike;
          const lockKey = `${sourceId}\0${pathIdNode.text}`;
          if (seenLocks.has(lockKey)) {
            throw new Error(
              `${moduleFile}: duplicate exact-path lock ${sourceId}/${pathIdNode.text}`,
            );
          }
          seenLocks.add(lockKey);
          lockCount++;

          const currentD = source.paths.get(pathIdNode.text);
          if (currentD === undefined) {
            throw new Error(
              `${normalizedRelative(rootDir, source.sourceFile)}: ` +
              `missing locked path ${pathIdNode.text}`,
            );
          }
          if (dNode.text === currentD) continue;

          replacements.push({
            start: dNode.getStart(parsed),
            end: dNode.getEnd(),
            value: quoted(currentD, dNode.getText(parsed)),
          });
          changes.push({
            moduleFile,
            sourceFile: source.sourceFile,
            sourceId,
            pathId: pathIdNode.text,
            previousD: dNode.text,
            currentD,
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(parsed);

  if (exactPathDeclarationCount === 0) {
    throw new Error(`${moduleFile}: no exact-path lock declaration was found`);
  }
  return { lockCount, replacements, changes };
}

function applyReplacements(
  content: string,
  replacements: readonly Replacement[],
): string {
  return [...replacements]
    .sort((left, right) => right.start - left.start)
    .reduce(
      (updated, replacement) =>
        updated.slice(0, replacement.start) +
        replacement.value +
        updated.slice(replacement.end),
      content,
    );
}

async function writeAtomically(filename: string, content: string): Promise<void> {
  const temporary = `${filename}.tmp-${process.pid}`;
  await writeFile(temporary, content, 'utf8');
  await rename(temporary, filename);
}

export async function reconcileEqualHeightProposalPathLocks(
  options: ReconcileEqualHeightProposalPathLocksOptions,
): Promise<ReconcileEqualHeightProposalPathLocksResult> {
  const rootDir = path.resolve(options.rootDir);
  const sourceDir = path.resolve(options.sourceDir);
  const svgSources = await indexSvgSources(rootDir, sourceDir);
  const changes: EqualHeightProposalPathLockChange[] = [];
  const pendingModules: PendingModule[] = [];
  let lockCount = 0;

  for (const module of options.modules) {
    const moduleFile = path.resolve(module.moduleFile);
    const content = await readFile(moduleFile, 'utf8');
    const planned = collectModuleReplacements(
      rootDir,
      moduleFile,
      content,
      svgSources,
      module.arraySourceIds ?? {},
    );
    lockCount += planned.lockCount;
    changes.push(...planned.changes);
    pendingModules.push({
      moduleFile,
      content,
      replacements: planned.replacements,
    });
  }

  if (options.write) {
    for (const pending of pendingModules) {
      if (pending.replacements.length === 0) continue;
      await writeAtomically(
        pending.moduleFile,
        applyReplacements(pending.content, pending.replacements),
      );
    }
  }

  return {
    moduleCount: options.modules.length,
    sourceCount: svgSources.size,
    lockCount,
    changes,
  };
}
