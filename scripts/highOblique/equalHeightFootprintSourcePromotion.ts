import {
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { compileAuthoredSvg } from '../parts/importer';
import {
  compileEqualHeightEvaluationFrames,
  type CompiledEqualHeightFrame,
  type EqualHeightSourceRoot,
} from '../walls/equalHeightImporter';
import {
  compileSelectedEqualHeightAllMaskFrames,
  equalHeightAllMaskSourceFootprintState,
  type CalibratedEqualHeightFrame,
} from './equalHeightFootprintAllMaskCalibration';

export interface EqualHeightFootprintSourceChange {
  readonly sourceFile: string;
  readonly absolutePath: string;
  readonly ownerMask: number;
  readonly previousSource: string;
  readonly promotedSource: string;
  readonly pathCount: number;
}

export interface EqualHeightFootprintSourcePromotionPlan {
  readonly state: 'legacy-68' | 'accepted-112';
  readonly ownerCount: number;
  readonly sourceCount: number;
  readonly pathCount: number;
  readonly changes: readonly EqualHeightFootprintSourceChange[];
}

interface SourceDocument {
  readonly sourceFile: string;
  readonly absolutePath: string;
  readonly ownerMask: number;
  readonly previousSource: string;
  readonly promotedSource: string;
  readonly pathCount: number;
}

interface LegacyPromotionPlan extends EqualHeightFootprintSourcePromotionPlan {
  readonly state: 'legacy-68';
  readonly documents: readonly SourceDocument[];
  readonly expectedFrames: readonly CalibratedEqualHeightFrame[];
}

const PATH_TAG = /<path\b[^>]*>/gi;
const PATH_DATA_ATTRIBUTE = /(\bd\s*=\s*)(["'])([\s\S]*?)\2/i;

const compareText = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

function framePairKey(frame: CompiledEqualHeightFrame): string {
  return `${frame.sourceFiles.base}\0${frame.sourceFiles.upper}`;
}

function sourceAbsolutePath(
  sourceFile: string,
  sourceRoots: readonly EqualHeightSourceRoot[],
): string {
  const normalized = sourceFile.replaceAll('\\', '/');
  const matches = sourceRoots.flatMap((root) => {
    const prefix = root.sourcePathPrefix
      .replaceAll('\\', '/')
      .replace(/\/$/, '');
    if (normalized === prefix) return [path.resolve(root.inputDir)];
    if (!normalized.startsWith(`${prefix}/`)) return [];
    return [
      path.resolve(
        root.inputDir,
        normalized.slice(prefix.length + 1),
      ),
    ];
  });
  if (matches.length !== 1) {
    throw new Error(
      `Equal-height footprint promotion could not uniquely resolve ${sourceFile}`,
    );
  }
  return matches[0];
}

function compiledShapes(
  source: string,
  sourceFile: string,
): readonly CompiledEqualHeightFrame['shapes'][number][] {
  return compileAuthoredSvg(source, {
    source: sourceFile,
    origin: { x: 0, y: 0 },
  });
}

function sameShapes(
  left: readonly CompiledEqualHeightFrame['shapes'][number][],
  right: readonly CompiledEqualHeightFrame['shapes'][number][],
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

/**
 * Replace only authored path geometry. Semantic ids, paint, titles,
 * descriptions, grouping, whitespace, and all non-path metadata stay byte
 * exact so seam filtering and proof-source ownership remain inspectable.
 */
export function replaceEqualHeightSvgPathData(
  source: string,
  paths: readonly string[],
  sourceFile = '<svg>',
): string {
  let pathIndex = 0;
  const replaced = source.replace(PATH_TAG, (tag) => {
    const match = PATH_DATA_ATTRIBUTE.exec(tag);
    if (!match) {
      throw new Error(
        `Equal-height footprint promotion found a path without d in ${sourceFile}`,
      );
    }
    const d = paths[pathIndex];
    if (d === undefined) {
      throw new Error(
        `Equal-height footprint promotion found extra paths in ${sourceFile}`,
      );
    }
    pathIndex += 1;
    const start = match.index;
    const end = start + match[0].length;
    const attribute = `${match[1]}${match[2]}${d}${match[2]}`;
    return tag.slice(0, start) + attribute + tag.slice(end);
  });
  if (pathIndex !== paths.length) {
    throw new Error(
      `Equal-height footprint promotion expected ${paths.length} paths in ` +
      `${sourceFile}; found ${pathIndex}`,
    );
  }
  return replaced;
}

function directOwners(
  frames: readonly CompiledEqualHeightFrame[],
): readonly CompiledEqualHeightFrame[] {
  const groups = new Map<string, CompiledEqualHeightFrame[]>();
  for (const frame of frames) {
    const key = framePairKey(frame);
    const group = groups.get(key) ?? [];
    group.push(frame);
    groups.set(key, group);
  }
  return [...groups.entries()]
    .map(([key, group]) => {
      const owners = group.filter(
        ({ source }) =>
          source.transform === 'none' && source.derivation === 'none',
      );
      if (owners.length !== 1) {
        throw new Error(
          `Equal-height footprint promotion expected one direct owner for ` +
          `${key.replace('\0', ' + ')}; found ${owners.length}`,
        );
      }
      return owners[0];
    })
    .sort((left, right) => left.index - right.index);
}

async function sourceDocument(
  owner: CompiledEqualHeightFrame,
  sourceFile: string,
  expectedShapes: readonly CompiledEqualHeightFrame['shapes'][number][],
  sourceRoots: readonly EqualHeightSourceRoot[],
): Promise<SourceDocument> {
  const absolutePath = sourceAbsolutePath(sourceFile, sourceRoots);
  const previousSource = await readFile(absolutePath, 'utf8');
  const beforeShapes = compiledShapes(previousSource, sourceFile);
  const promotedSource = replaceEqualHeightSvgPathData(
    previousSource,
    expectedShapes.map(({ d }) => d),
    sourceFile,
  );
  const afterShapes = compiledShapes(promotedSource, sourceFile);
  if (!sameShapes(afterShapes, expectedShapes)) {
    throw new Error(
      `Equal-height footprint promotion lost compiled parity for ${sourceFile}`,
    );
  }
  return {
    sourceFile,
    absolutePath,
    ownerMask: owner.index,
    previousSource,
    promotedSource,
    pathCount: beforeShapes.length,
  };
}

async function legacyPlan(
  frames: readonly CompiledEqualHeightFrame[],
  sourceRoots: readonly EqualHeightSourceRoot[],
): Promise<LegacyPromotionPlan> {
  const expectedFrames = compileSelectedEqualHeightAllMaskFrames(frames);
  const owners = directOwners(frames);
  const documents: SourceDocument[] = [];

  for (const owner of owners) {
    const expected = expectedFrames[owner.index];
    const baseSource = await readFile(
      sourceAbsolutePath(owner.sourceFiles.base, sourceRoots),
      'utf8',
    );
    const baseShapes = compiledShapes(baseSource, owner.sourceFiles.base);
    if (
      owner.shapes.length !== expected.shapes.length ||
      baseShapes.length > expected.shapes.length
    ) {
      throw new Error(
        `Equal-height footprint promotion lost the accepted inventory for ${owner.id}`,
      );
    }
    const currentBase = owner.shapes.slice(0, baseShapes.length);
    const currentUpper = owner.shapes.slice(baseShapes.length);
    const upperSource = await readFile(
      sourceAbsolutePath(owner.sourceFiles.upper, sourceRoots),
      'utf8',
    );
    const upperShapes = compiledShapes(upperSource, owner.sourceFiles.upper);
    if (
      !sameShapes(baseShapes, currentBase) ||
      !sameShapes(upperShapes, currentUpper)
    ) {
      throw new Error(
        `Equal-height footprint promotion owner ${owner.id} drifted from its direct source pair`,
      );
    }
    documents.push(
      await sourceDocument(
        owner,
        owner.sourceFiles.base,
        expected.shapes.slice(0, baseShapes.length),
        sourceRoots,
      ),
      await sourceDocument(
        owner,
        owner.sourceFiles.upper,
        expected.shapes.slice(baseShapes.length),
        sourceRoots,
      ),
    );
  }

  const changes = documents.filter(
    ({ previousSource, promotedSource }) =>
      previousSource !== promotedSource,
  );
  return {
    state: 'legacy-68',
    ownerCount: owners.length,
    sourceCount: documents.length,
    pathCount: documents.reduce(
      (total, { pathCount }) => total + pathCount,
      0,
    ),
    changes,
    documents,
    expectedFrames,
  };
}

async function validateStagedBank(
  plan: LegacyPromotionPlan,
  sourceRoots: readonly EqualHeightSourceRoot[],
): Promise<void> {
  const temporaryRoot = await mkdtemp(
    path.join(tmpdir(), 'quota-co-equal-height-112-'),
  );
  try {
    const temporaryRoots = sourceRoots.map((root, index) => ({
      inputDir: path.join(temporaryRoot, `source-${index}`),
      sourcePathPrefix: root.sourcePathPrefix,
    }));
    for (const document of plan.documents) {
      const target = sourceAbsolutePath(
        document.sourceFile,
        temporaryRoots,
      );
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, document.promotedSource, 'utf8');
    }
    const stagedFrames = await compileEqualHeightEvaluationFrames({
      sourceRoots: temporaryRoots,
    });
    for (let index = 0; index < stagedFrames.length; index += 1) {
      if (
        !sameShapes(
          stagedFrames[index].shapes,
          plan.expectedFrames[index].shapes,
        )
      ) {
        throw new Error(
          `Equal-height footprint staged bank drifted at mask_${index}`,
        );
      }
    }
    if (equalHeightAllMaskSourceFootprintState(stagedFrames) !== 'accepted-112') {
      throw new Error(
        'Equal-height footprint staged bank did not resolve as accepted-112',
      );
    }
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

export async function planEqualHeightFootprintSourcePromotion(
  sourceRoots: readonly EqualHeightSourceRoot[],
): Promise<EqualHeightFootprintSourcePromotionPlan> {
  const frames = await compileEqualHeightEvaluationFrames({ sourceRoots });
  const state = equalHeightAllMaskSourceFootprintState(frames);
  const owners = directOwners(frames);
  if (state === 'accepted-112') {
    return {
      state,
      ownerCount: owners.length,
      sourceCount: owners.length * 2,
      pathCount: owners.reduce(
        (total, owner) => total + owner.shapes.length,
        0,
      ),
      changes: [],
    };
  }
  const plan = await legacyPlan(frames, sourceRoots);
  await validateStagedBank(plan, sourceRoots);
  return plan;
}

async function writeChangesAtomically(
  changes: readonly EqualHeightFootprintSourceChange[],
): Promise<void> {
  const staged = changes.map((change) => ({
    ...change,
    temporaryPath: `${change.absolutePath}.quota-co-112-${process.pid}.tmp`,
  }));
  try {
    for (const change of staged) {
      await writeFile(
        change.temporaryPath,
        change.promotedSource,
        'utf8',
      );
    }
    for (const change of staged) {
      await rename(change.temporaryPath, change.absolutePath);
    }
  } finally {
    await Promise.all(
      staged.map(({ temporaryPath }) =>
        rm(temporaryPath, { force: true })),
    );
  }
}

export async function promoteEqualHeightFootprintSources(
  sourceRoots: readonly EqualHeightSourceRoot[],
): Promise<EqualHeightFootprintSourcePromotionPlan> {
  const plan = await planEqualHeightFootprintSourcePromotion(sourceRoots);
  if (plan.state === 'accepted-112') {
    throw new Error(
      'Equal-height footprint source bank is already accepted-112; refusing a double promotion',
    );
  }
  await writeChangesAtomically(plan.changes);
  const promotedFrames = await compileEqualHeightEvaluationFrames({
    sourceRoots,
  });
  if (equalHeightAllMaskSourceFootprintState(promotedFrames) !== 'accepted-112') {
    throw new Error(
      'Equal-height footprint source bank did not resolve as accepted-112 after write',
    );
  }
  const expectedFrames = (plan as LegacyPromotionPlan).expectedFrames;
  for (let index = 0; index < promotedFrames.length; index += 1) {
    if (
      !sameShapes(
        promotedFrames[index].shapes,
        expectedFrames[index].shapes,
      )
    ) {
      throw new Error(
        `Equal-height footprint written bank drifted at mask_${index}`,
      );
    }
  }
  return plan;
}

export function equalHeightFootprintPromotionSummary(
  plan: EqualHeightFootprintSourcePromotionPlan,
): string {
  const changedPaths = plan.changes.reduce(
    (total, { pathCount }) => total + pathCount,
    0,
  );
  return [
    `state=${plan.state}`,
    `owners=${plan.ownerCount}`,
    `sources=${plan.sourceCount}`,
    `paths=${plan.pathCount}`,
    `changedSources=${plan.changes.length}`,
    `changedSourcePaths=${changedPaths}`,
  ].join(' ');
}

export function sortEqualHeightFootprintSourceChanges(
  changes: readonly EqualHeightFootprintSourceChange[],
): readonly EqualHeightFootprintSourceChange[] {
  return [...changes].sort((left, right) =>
    compareText(left.sourceFile, right.sourceFile));
}
