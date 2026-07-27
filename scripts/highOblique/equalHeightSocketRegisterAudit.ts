/**
 * Bounded, report-only socket/register audit for the accepted QuotaCo
 * equal-height wall vocabulary.
 *
 * This deliberately does not decide whether a mismatch is acceptable. It
 * renders each accepted visual presentation one at a time, keeps only two-pixel
 * edge profiles, and reports exact pixel differences across every legal east
 * and south adjacency produced by a binary neighborhood.
 *
 *   npx tsx scripts/highOblique/equalHeightSocketRegisterAudit.ts
 *   npx tsx scripts/highOblique/equalHeightSocketRegisterAudit.ts --out /tmp/audit
 */
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

import { NB, blobIndex } from '../../src/tiles/blob';
import { derivePromotedSoutheastSourcePair } from './equalHeightWallDirection';
import {
  EQUAL_HEIGHT_MASK_LEDGER,
  validateEqualHeightMaskLedger,
  type EqualHeightMaskSourceVariant,
} from './equalHeightMaskLedger';

export const EQUAL_HEIGHT_SOCKET_REGISTER_AUDIT_STEM =
  'equal-height-47-socket-register-audit';
export const EQUAL_HEIGHT_SOCKET_REGISTER_AUDIT_VERSION = 0;
export const EQUAL_HEIGHT_SOCKET_REGISTER_PROFILE_STRIP_WIDTH = 2;
export const EQUAL_HEIGHT_SOCKET_REGISTER_RENDER_PIXEL_BUDGET = 2_600_000;
export const EQUAL_HEIGHT_SOCKET_REGISTER_RETAINED_PIXEL_BUDGET = 170_000;
export const EQUAL_HEIGHT_SOCKET_REGISTER_TRANSIENT_PIXEL_BUDGET = 128 * 128;

export type EqualHeightSocketRegisterDirection = 'e' | 's';
export type EqualHeightSocketRegisterEdge = 'n' | 'e' | 's' | 'w';
export type EqualHeightSocketRegisterLayer =
  | 'base-128'
  | 'upper-128'
  | 'composed-128'
  | 'composed-40';

interface AuditPresentation {
  readonly id: string;
  readonly maskIndex: number;
  readonly role: string;
  readonly variantIndex: number;
  readonly variantCount: number;
  readonly variant: EqualHeightMaskSourceVariant;
  readonly sourcePairKey: string;
  readonly sourceResolutionKey: string;
}

interface ResolvedAuditPresentation extends AuditPresentation {
  readonly baseSource: string;
  readonly upperSource: string;
  readonly baseSourcePath: string;
  readonly upperSourcePath: string;
  readonly sourceContentHash: string;
}

interface RetainedEdgeProfile {
  readonly size: 128 | 40;
  readonly stripWidth: 2;
  readonly edges: Readonly<
    Record<EqualHeightSocketRegisterEdge, Uint8Array>
  >;
  readonly edgeHashes: Readonly<
    Record<EqualHeightSocketRegisterEdge, string>
  >;
}

interface RetainedPresentationProfiles {
  readonly presentation: ResolvedAuditPresentation;
  readonly profiles: Readonly<
    Record<EqualHeightSocketRegisterLayer, RetainedEdgeProfile>
  >;
}

export interface EqualHeightSocketRegisterLegalPair {
  readonly direction: EqualHeightSocketRegisterDirection;
  readonly firstMask: number;
  readonly secondMask: number;
}

export interface EqualHeightSocketRegisterDifferenceMetrics {
  readonly sampleCount: number;
  readonly differingSamples: number;
  readonly differingBoundarySamples: number;
  readonly differingInsetSamples: number;
  readonly differingChannels: number;
  readonly colorDifferenceSamples: number;
  readonly alphaDifferenceSamples: number;
  readonly oneSidedTransparentSamples: number;
  readonly totalChannelDelta: number;
  readonly maxChannelDelta: number;
}

export type EqualHeightSocketRegisterTriageCategory =
  | 'presentation-ambiguity'
  | 'base-shell-or-contact-shadow'
  | 'upper-reveal-belt-or-plinth'
  | 'composed-color-or-layer-order'
  | 'silhouette-or-coverage'
  | 'compact-register'
  | 'high-resolution-only'
  | 'contact-shadow-register-focus'
  | 'horizontal-reveal-opacity-focus'
  | 'open-horizontal-return-plinth-focus'
  | 'layer-order-brightness-focus';

export interface EqualHeightSocketRegisterDiscrepancy {
  readonly rank: number;
  readonly direction: EqualHeightSocketRegisterDirection;
  readonly firstMask: number;
  readonly secondMask: number;
  readonly firstPresentationId: string;
  readonly secondPresentationId: string;
  readonly candidatePresentationComparisonCount: number;
  readonly severityScore: number;
  readonly categories: readonly EqualHeightSocketRegisterTriageCategory[];
  readonly metrics: Readonly<
    Record<
      EqualHeightSocketRegisterLayer,
      EqualHeightSocketRegisterDifferenceMetrics
    >
  >;
}

export interface EqualHeightSocketRegisterAuditReport {
  readonly stem: typeof EQUAL_HEIGHT_SOCKET_REGISTER_AUDIT_STEM;
  readonly version: typeof EQUAL_HEIGHT_SOCKET_REGISTER_AUDIT_VERSION;
  readonly status: 'review-only-quantitative-discrepancy-report';
  readonly acceptedLedgerStatus: 'owner-accepted-mapping-gate';
  readonly boundaries: Readonly<{
    ledgerMutation: false;
    proofSourceMutation: false;
    productionArtMutation: false;
    productionRegistration: false;
    exporterMutation: false;
    atlasMutation: false;
    schemaMutation: false;
    blobMutation: false;
    unityMutation: false;
  }>;
  readonly coverage: Readonly<{
    maskCount: 47;
    presentationCount: 50;
    underlyingSourcePairCount: number;
    uniqueSourceResolutionCount: 50;
    profiledPresentationCount: 50;
    comparedPresentationCount: number;
    legalPairCount: 338;
    eastPairCount: 169;
    southPairCount: 169;
    presentationComparisonCount: number;
    pairCoverageHash: string;
    sourceResolutionHash: string;
    discrepancyReportHash: string;
  }>;
  readonly containment: Readonly<{
    renderPassCount: number;
    renderedPixelCount: number;
    renderPixelBudget: typeof EQUAL_HEIGHT_SOCKET_REGISTER_RENDER_PIXEL_BUDGET;
    retainedProfilePixelCount: number;
    retainedProfilePixelBudget:
      typeof EQUAL_HEIGHT_SOCKET_REGISTER_RETAINED_PIXEL_BUDGET;
    maximumTransientRasterPixelCount: number;
    maximumTransientRasterPixelBudget:
      typeof EQUAL_HEIGHT_SOCKET_REGISTER_TRANSIENT_PIXEL_BUDGET;
    profileStripWidth:
      typeof EQUAL_HEIGHT_SOCKET_REGISTER_PROFILE_STRIP_WIDTH;
  }>;
  readonly presentations: readonly Readonly<{
    id: string;
    maskIndex: number;
    role: string;
    variantIndex: number;
    variantCount: number;
    sourceStem: string;
    baseSourcePath: string;
    upperSourcePath: string;
    transform: EqualHeightMaskSourceVariant['transform'];
    derivation: EqualHeightMaskSourceVariant['derivation'];
    sourcePairKey: string;
    sourceResolutionKey: string;
    sourceContentHash: string;
    profileHashes: Readonly<
      Record<
        EqualHeightSocketRegisterLayer,
        Readonly<Record<EqualHeightSocketRegisterEdge, string>>
      >
    >;
  }>[];
  readonly summary: Readonly<{
    exactCandidatePresentationComparisonCount: number;
    exactSelectedLegalPairCount: number;
    discrepancyCount: number;
    discrepantLegalPairCount: number;
    categoryCounts: Readonly<
      Partial<Record<EqualHeightSocketRegisterTriageCategory, number>>
    >;
  }>;
  readonly discrepancies: readonly EqualHeightSocketRegisterDiscrepancy[];
}

export interface EqualHeightSocketRegisterAuditOptions {
  readonly repoRoot: string;
}

const AUDIT_LAYERS = [
  'base-128',
  'upper-128',
  'composed-128',
  'composed-40',
] as const satisfies readonly EqualHeightSocketRegisterLayer[];

const AUDIT_EDGES = [
  'n',
  'e',
  's',
  'w',
] as const satisfies readonly EqualHeightSocketRegisterEdge[];

const NEIGHBOR_DELTAS = [
  [NB.N, 0, -1],
  [NB.E, 1, 0],
  [NB.S, 0, 1],
  [NB.W, -1, 0],
  [NB.NE, 1, -1],
  [NB.SE, 1, 1],
  [NB.SW, -1, 1],
  [NB.NW, -1, -1],
] as const;

const DIRECTION_DELTAS: Readonly<
  Record<
    EqualHeightSocketRegisterDirection,
    readonly [number, number]
  >
> = {
  e: [1, 0],
  s: [0, 1],
};

const JOIN_EDGES: Readonly<
  Record<
    EqualHeightSocketRegisterDirection,
    readonly [
      EqualHeightSocketRegisterEdge,
      EqualHeightSocketRegisterEdge,
    ]
  >
> = {
  e: ['e', 'w'],
  s: ['s', 'n'],
};

const REVIEW_FOCUS_MASKS = {
  'contact-shadow-register-focus': new Set([7, 13, 17, 36]),
  'horizontal-reveal-opacity-focus': new Set([22, 23, 25, 28, 29, 43]),
  'open-horizontal-return-plinth-focus': new Set([30, 40, 41, 44]),
  'layer-order-brightness-focus': new Set([32]),
} as const satisfies Readonly<
  Record<
    Extract<
      EqualHeightSocketRegisterTriageCategory,
      | 'contact-shadow-register-focus'
      | 'horizontal-reveal-opacity-focus'
      | 'open-horizontal-return-plinth-focus'
      | 'layer-order-brightness-focus'
    >,
    ReadonlySet<number>
  >
>;

function sha256(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}

function coordinateKey(x: number, y: number): string {
  return `${x},${y}`;
}

function maskAt(
  occupied: ReadonlySet<string>,
  x: number,
  y: number,
): number {
  let raw = 0;
  for (const [bit, dx, dy] of NEIGHBOR_DELTAS) {
    if (occupied.has(coordinateKey(x + dx, y + dy))) raw |= bit;
  }
  return blobIndex(raw);
}

/**
 * East and south are the canonical representatives of undirected cardinal
 * joins. Their complete two-cell neighborhood unions each contain ten free
 * binary cells, and collapse to 169 distinct mask pairs.
 */
export function enumerateEqualHeightSocketRegisterLegalPairs():
readonly EqualHeightSocketRegisterLegalPair[] {
  const pairs: EqualHeightSocketRegisterLegalPair[] = [];
  for (const direction of ['e', 's'] as const) {
    const [dx, dy] = DIRECTION_DELTAS[direction];
    const coordinates = new Set<string>();
    for (const [centerX, centerY] of [[0, 0], [dx, dy]] as const) {
      for (let y = centerY - 1; y <= centerY + 1; y += 1) {
        for (let x = centerX - 1; x <= centerX + 1; x += 1) {
          coordinates.add(coordinateKey(x, y));
        }
      }
    }
    const fixed = new Set([coordinateKey(0, 0), coordinateKey(dx, dy)]);
    const variable = [...coordinates]
      .filter((coordinate) => !fixed.has(coordinate))
      .sort((left, right) => {
        const [leftX, leftY] = left.split(',').map(Number);
        const [rightX, rightY] = right.split(',').map(Number);
        return leftY - rightY || leftX - rightX;
      });
    const unique = new Set<string>();
    for (let bits = 0; bits < 2 ** variable.length; bits += 1) {
      const occupied = new Set(fixed);
      for (let index = 0; index < variable.length; index += 1) {
        if ((bits & (1 << index)) !== 0) occupied.add(variable[index]);
      }
      unique.add(
        `${maskAt(occupied, 0, 0)},${maskAt(occupied, dx, dy)}`,
      );
    }
    pairs.push(
      ...[...unique]
        .map((pair) => pair.split(',').map(Number) as [number, number])
        .sort(
          ([leftFirst, leftSecond], [rightFirst, rightSecond]) =>
            leftFirst - rightFirst || leftSecond - rightSecond,
        )
        .map(([firstMask, secondMask]) => ({
          direction,
          firstMask,
          secondMask,
        })),
    );
  }
  return pairs;
}

function acceptedPresentations(): readonly AuditPresentation[] {
  validateEqualHeightMaskLedger(EQUAL_HEIGHT_MASK_LEDGER);
  return EQUAL_HEIGHT_MASK_LEDGER.entries.flatMap((entry) => {
    if (
      entry.resolution.kind !== 'direct-reuse' &&
      entry.resolution.kind !== 'approved-derivation'
    ) {
      throw new Error(
        `Socket/register audit encountered unaccepted ${entry.id}`,
      );
    }
    const variants = entry.resolution.variants;
    return variants.map((variant, variantIndex) => {
      const id =
        `${entry.id}-p${variantIndex + 1}-${variant.role}`;
      const sourcePairKey = `${variant.baseFile}|${variant.upperFile}`;
      const sourceResolutionKey =
        `${sourcePairKey}|${variant.transform}|${variant.derivation}`;
      return {
        id,
        maskIndex: entry.index,
        role: variant.role,
        variantIndex,
        variantCount: variants.length,
        variant,
        sourcePairKey,
        sourceResolutionKey,
      };
    });
  });
}

async function collectSvgFiles(directory: string): Promise<readonly string[]> {
  const files: string[] = [];
  const visit = async (current: string): Promise<void> => {
    const entries = (await readdir(current, { withFileTypes: true }))
      .sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await visit(absolute);
      } else if (entry.isFile() && entry.name.endsWith('.svg')) {
        files.push(absolute);
      }
    }
  };
  await visit(directory);
  return files;
}

async function resolvePresentations(
  repoRoot: string,
): Promise<readonly ResolvedAuditPresentation[]> {
  const authoredRoot = path.join(
    repoRoot,
    'assets/walls/quota-co-building-system',
  );
  const proofRoot = path.join(
    repoRoot,
    'assets/walls/quota-co-building-system-proofs',
  );
  const allFiles = [
    ...await collectSvgFiles(authoredRoot),
    ...await collectSvgFiles(proofRoot),
  ].sort((left, right) => left.localeCompare(right));
  const byFilename = new Map<string, string[]>();
  for (const absolute of allFiles) {
    const matches = byFilename.get(path.basename(absolute)) ?? [];
    matches.push(absolute);
    byFilename.set(path.basename(absolute), matches);
  }
  const sourceCache = new Map<string, string>();
  const resolveSource = async (
    filename: string,
  ): Promise<readonly [string, string]> => {
    const candidates = byFilename.get(filename) ?? [];
    if (candidates.length !== 1) {
      throw new Error(
        `Accepted socket/register source "${filename}" resolved to ` +
          `${candidates.length} files`,
      );
    }
    const absolute = candidates[0];
    let source = sourceCache.get(absolute);
    if (source === undefined) {
      source = await readFile(absolute, 'utf8');
      sourceCache.set(absolute, source);
    }
    return [
      source,
      path.relative(repoRoot, absolute).replaceAll(path.sep, '/'),
    ];
  };

  const presentations = acceptedPresentations();
  const resolved: ResolvedAuditPresentation[] = [];
  for (const presentation of presentations) {
    const [authoredBase, baseSourcePath] =
      await resolveSource(presentation.variant.baseFile);
    const [authoredUpper, upperSourcePath] =
      await resolveSource(presentation.variant.upperFile);
    const filtered =
      presentation.variant.derivation === 'none'
        ? { baseSource: authoredBase, upperSource: authoredUpper }
        : derivePromotedSoutheastSourcePair(authoredBase, authoredUpper);
    resolved.push({
      ...presentation,
      baseSource: filtered.baseSource,
      upperSource: filtered.upperSource,
      baseSourcePath,
      upperSourcePath,
      sourceContentHash: sha256(
        `${filtered.baseSource}\0${filtered.upperSource}`,
      ),
    });
  }

  if (resolved.length !== 50) {
    throw new Error(
      `Socket/register audit expected 50 presentations; received ` +
        `${resolved.length}`,
    );
  }
  if (new Set(resolved.map(({ id }) => id)).size !== resolved.length) {
    throw new Error('Socket/register audit presentation ids are not unique');
  }
  if (
    new Set(resolved.map(({ sourceResolutionKey }) => sourceResolutionKey))
      .size !== resolved.length
  ) {
    throw new Error(
      'Socket/register audit source resolution keys are not unique',
    );
  }
  return resolved;
}

function stripSvgShell(source: string): string {
  return source
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
}

function renderedLayerSource(
  presentation: ResolvedAuditPresentation,
  layer: EqualHeightSocketRegisterLayer,
): string {
  const base =
    layer === 'upper-128' ? '' : stripSvgShell(presentation.baseSource);
  const upper =
    layer === 'base-128' ? '' : stripSvgShell(presentation.upperSource);
  const content = `${base}${upper}`;
  const transformed =
    presentation.variant.transform === 'mirror-x'
      ? `<g transform="matrix(-1 0 0 1 128 0)">${content}</g>`
      : content;
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" ' +
    'viewBox="0 0 128 128" width="128" height="128">' +
    transformed +
    '</svg>'
  );
}

function extractEdge(
  pixels: Uint8Array,
  size: 128 | 40,
  edge: EqualHeightSocketRegisterEdge,
): Uint8Array {
  const stripWidth = EQUAL_HEIGHT_SOCKET_REGISTER_PROFILE_STRIP_WIDTH;
  const retained = new Uint8Array(size * stripWidth * 4);
  for (let along = 0; along < size; along += 1) {
    for (let depth = 0; depth < stripWidth; depth += 1) {
      let x: number;
      let y: number;
      switch (edge) {
        case 'n':
          x = along;
          y = depth;
          break;
        case 'e':
          x = size - 1 - depth;
          y = along;
          break;
        case 's':
          x = along;
          y = size - 1 - depth;
          break;
        case 'w':
          x = depth;
          y = along;
          break;
      }
      const sourceOffset = (y * size + x) * 4;
      const targetOffset = (along * stripWidth + depth) * 4;
      retained.set(
        pixels.subarray(sourceOffset, sourceOffset + 4),
        targetOffset,
      );
    }
  }
  return retained;
}

function renderProfile(
  presentation: ResolvedAuditPresentation,
  layer: EqualHeightSocketRegisterLayer,
): RetainedEdgeProfile {
  const size: 128 | 40 = layer === 'composed-40' ? 40 : 128;
  const rendered = new Resvg(renderedLayerSource(presentation, layer), {
    fitTo: { mode: 'width', value: size },
  }).render();
  if (rendered.width !== size || rendered.height !== size) {
    throw new Error(
      `${presentation.id} ${layer} rendered ${rendered.width}×` +
        `${rendered.height}; expected ${size}×${size}`,
    );
  }
  // Cache this getter exactly once: resvg copies the native pixel buffer.
  const pixels = rendered.pixels;
  const edges = Object.fromEntries(
    AUDIT_EDGES.map((edge) => [edge, extractEdge(pixels, size, edge)]),
  ) as Record<EqualHeightSocketRegisterEdge, Uint8Array>;
  return {
    size,
    stripWidth: EQUAL_HEIGHT_SOCKET_REGISTER_PROFILE_STRIP_WIDTH,
    edges,
    edgeHashes: Object.fromEntries(
      AUDIT_EDGES.map((edge) => [edge, sha256(edges[edge])]),
    ) as Record<EqualHeightSocketRegisterEdge, string>,
  };
}

async function renderPresentationProfiles(
  presentations: readonly ResolvedAuditPresentation[],
): Promise<readonly RetainedPresentationProfiles[]> {
  const retained: RetainedPresentationProfiles[] = [];
  // Intentionally sequential. A complete raster is unreachable after each
  // renderProfile call returns; only its two-pixel edge copies survive.
  for (const presentation of presentations) {
    const profiles = Object.fromEntries(
      AUDIT_LAYERS.map((layer) => [
        layer,
        renderProfile(presentation, layer),
      ]),
    ) as Record<EqualHeightSocketRegisterLayer, RetainedEdgeProfile>;
    retained.push({ presentation, profiles });
  }
  return retained;
}

function compareEdges(
  first: Uint8Array,
  second: Uint8Array,
): EqualHeightSocketRegisterDifferenceMetrics {
  if (first.length !== second.length || first.length % 8 !== 0) {
    throw new Error('Socket/register edge profiles have incompatible sizes');
  }
  let differingSamples = 0;
  let differingBoundarySamples = 0;
  let differingInsetSamples = 0;
  let differingChannels = 0;
  let colorDifferenceSamples = 0;
  let alphaDifferenceSamples = 0;
  let oneSidedTransparentSamples = 0;
  let totalChannelDelta = 0;
  let maxChannelDelta = 0;
  const stripWidth = EQUAL_HEIGHT_SOCKET_REGISTER_PROFILE_STRIP_WIDTH;
  for (let offset = 0; offset < first.length; offset += 4) {
    let sampleDiffers = false;
    let colorDiffers = false;
    for (let channel = 0; channel < 4; channel += 1) {
      const delta = Math.abs(first[offset + channel] - second[offset + channel]);
      if (delta > 0) {
        sampleDiffers = true;
        differingChannels += 1;
        totalChannelDelta += delta;
        maxChannelDelta = Math.max(maxChannelDelta, delta);
        if (channel < 3) colorDiffers = true;
      }
    }
    if (sampleDiffers) {
      differingSamples += 1;
      const depth = (offset / 4) % stripWidth;
      if (depth === 0) differingBoundarySamples += 1;
      else differingInsetSamples += 1;
    }
    if (colorDiffers) colorDifferenceSamples += 1;
    if (first[offset + 3] !== second[offset + 3]) {
      alphaDifferenceSamples += 1;
    }
    if (
      (first[offset + 3] === 0) !==
      (second[offset + 3] === 0)
    ) {
      oneSidedTransparentSamples += 1;
    }
  }
  return {
    sampleCount: first.length / 4,
    differingSamples,
    differingBoundarySamples,
    differingInsetSamples,
    differingChannels,
    colorDifferenceSamples,
    alphaDifferenceSamples,
    oneSidedTransparentSamples,
    totalChannelDelta,
    maxChannelDelta,
  };
}

function discrepancyCategories(
  pair: EqualHeightSocketRegisterLegalPair,
  first: RetainedPresentationProfiles,
  second: RetainedPresentationProfiles,
  metrics: Readonly<
    Record<
      EqualHeightSocketRegisterLayer,
      EqualHeightSocketRegisterDifferenceMetrics
    >
  >,
): readonly EqualHeightSocketRegisterTriageCategory[] {
  const categories = new Set<EqualHeightSocketRegisterTriageCategory>();
  if (
    first.presentation.variantCount > 1 ||
    second.presentation.variantCount > 1
  ) {
    categories.add('presentation-ambiguity');
  }
  if (metrics['base-128'].differingSamples > 0) {
    categories.add('base-shell-or-contact-shadow');
  }
  if (metrics['upper-128'].differingSamples > 0) {
    categories.add('upper-reveal-belt-or-plinth');
  }
  if (
    metrics['composed-128'].colorDifferenceSamples > 0 ||
    metrics['composed-40'].colorDifferenceSamples > 0
  ) {
    categories.add('composed-color-or-layer-order');
  }
  if (
    metrics['composed-128'].alphaDifferenceSamples > 0 ||
    metrics['composed-40'].alphaDifferenceSamples > 0
  ) {
    categories.add('silhouette-or-coverage');
  }
  if (metrics['composed-40'].differingSamples > 0) {
    categories.add('compact-register');
  } else if (metrics['composed-128'].differingSamples > 0) {
    categories.add('high-resolution-only');
  }
  for (const [category, masks] of Object.entries(REVIEW_FOCUS_MASKS) as
    readonly [
      keyof typeof REVIEW_FOCUS_MASKS,
      ReadonlySet<number>,
    ][]) {
    if (masks.has(pair.firstMask) || masks.has(pair.secondMask)) {
      categories.add(category);
    }
  }
  return [...categories].sort((left, right) => left.localeCompare(right));
}

function naturalDiscrepancyOrder(
  left: Omit<EqualHeightSocketRegisterDiscrepancy, 'rank'>,
  right: Omit<EqualHeightSocketRegisterDiscrepancy, 'rank'>,
): number {
  return (
    right.severityScore - left.severityScore ||
    (left.direction === right.direction
      ? 0
      : left.direction === 'e'
        ? -1
        : 1) ||
    left.firstMask - right.firstMask ||
    left.secondMask - right.secondMask ||
    left.firstPresentationId.localeCompare(right.firstPresentationId) ||
    left.secondPresentationId.localeCompare(right.secondPresentationId)
  );
}

function preferredCandidateOrder(
  left: Omit<EqualHeightSocketRegisterDiscrepancy, 'rank'>,
  right: Omit<EqualHeightSocketRegisterDiscrepancy, 'rank'>,
): number {
  return (
    left.severityScore - right.severityScore ||
    left.firstPresentationId.localeCompare(right.firstPresentationId) ||
    left.secondPresentationId.localeCompare(right.secondPresentationId)
  );
}

export async function runEqualHeightSocketRegisterAudit(
  options: EqualHeightSocketRegisterAuditOptions,
): Promise<EqualHeightSocketRegisterAuditReport> {
  const presentations = await resolvePresentations(options.repoRoot);
  const retained = await renderPresentationProfiles(presentations);
  const byMask = new Map<number, RetainedPresentationProfiles[]>();
  for (const presentation of retained) {
    const variants = byMask.get(presentation.presentation.maskIndex) ?? [];
    variants.push(presentation);
    byMask.set(presentation.presentation.maskIndex, variants);
  }
  const legalPairs = enumerateEqualHeightSocketRegisterLegalPairs();
  const rawDiscrepancies:
    Omit<EqualHeightSocketRegisterDiscrepancy, 'rank'>[] = [];
  let presentationComparisonCount = 0;
  let exactCandidatePresentationComparisonCount = 0;
  let exactSelectedLegalPairCount = 0;
  const comparedPresentations = new Set<string>();

  for (const pair of legalPairs) {
    const firstPresentations = byMask.get(pair.firstMask) ?? [];
    const secondPresentations = byMask.get(pair.secondMask) ?? [];
    const [firstEdge, secondEdge] = JOIN_EDGES[pair.direction];
    const candidates:
      Omit<EqualHeightSocketRegisterDiscrepancy, 'rank'>[] = [];
    for (const first of firstPresentations) {
      for (const second of secondPresentations) {
        presentationComparisonCount += 1;
        comparedPresentations.add(first.presentation.id);
        comparedPresentations.add(second.presentation.id);
        const metrics = Object.fromEntries(
          AUDIT_LAYERS.map((layer) => [
            layer,
            compareEdges(
              first.profiles[layer].edges[firstEdge],
              second.profiles[layer].edges[secondEdge],
            ),
          ]),
        ) as Record<
          EqualHeightSocketRegisterLayer,
          EqualHeightSocketRegisterDifferenceMetrics
        >;
        const severityScore = AUDIT_LAYERS.reduce(
          (total, layer) => total + metrics[layer].totalChannelDelta,
          0,
        );
        if (severityScore === 0) {
          exactCandidatePresentationComparisonCount += 1;
        }
        candidates.push({
          direction: pair.direction,
          firstMask: pair.firstMask,
          secondMask: pair.secondMask,
          firstPresentationId: first.presentation.id,
          secondPresentationId: second.presentation.id,
          candidatePresentationComparisonCount:
            firstPresentations.length * secondPresentations.length,
          severityScore,
          categories: discrepancyCategories(pair, first, second, metrics),
          metrics,
        });
      }
    }
    const selected = candidates.sort(preferredCandidateOrder)[0];
    if (!selected) {
      throw new Error(
        `Socket/register audit could not resolve ${pair.direction} ` +
          `mask_${pair.firstMask}->mask_${pair.secondMask}`,
      );
    }
    if (selected.severityScore === 0) {
      exactSelectedLegalPairCount += 1;
    } else {
      rawDiscrepancies.push(selected);
    }
  }

  rawDiscrepancies.sort(naturalDiscrepancyOrder);
  const discrepancies = rawDiscrepancies.map((discrepancy, index) => ({
    rank: index + 1,
    ...discrepancy,
  }));
  const categoryCounts:
    Partial<Record<EqualHeightSocketRegisterTriageCategory, number>> = {};
  for (const { categories } of discrepancies) {
    for (const category of categories) {
      categoryCounts[category] = (categoryCounts[category] ?? 0) + 1;
    }
  }
  const sortedCategoryCounts = Object.fromEntries(
    Object.entries(categoryCounts)
      .sort(([left], [right]) => left.localeCompare(right)),
  ) as Partial<Record<EqualHeightSocketRegisterTriageCategory, number>>;
  const discrepantLegalPairCount = new Set(
    discrepancies.map(
      ({ direction, firstMask, secondMask }) =>
        `${direction}:${firstMask}:${secondMask}`,
    ),
  ).size;
  const renderedPixelCount =
    presentations.length * (128 * 128 * 3 + 40 * 40);
  const retainedProfilePixelCount =
    presentations.length *
    AUDIT_EDGES.length *
    EQUAL_HEIGHT_SOCKET_REGISTER_PROFILE_STRIP_WIDTH *
    (128 * 3 + 40);

  if (
    legalPairs.length !== 338 ||
    legalPairs.filter(({ direction }) => direction === 'e').length !== 169 ||
    legalPairs.filter(({ direction }) => direction === 's').length !== 169
  ) {
    throw new Error('Socket/register legal adjacency coverage drift');
  }
  if (
    renderedPixelCount > EQUAL_HEIGHT_SOCKET_REGISTER_RENDER_PIXEL_BUDGET ||
    retainedProfilePixelCount >
      EQUAL_HEIGHT_SOCKET_REGISTER_RETAINED_PIXEL_BUDGET ||
    128 * 128 > EQUAL_HEIGHT_SOCKET_REGISTER_TRANSIENT_PIXEL_BUDGET
  ) {
    throw new Error('Socket/register raster containment budget exceeded');
  }

  return {
    stem: EQUAL_HEIGHT_SOCKET_REGISTER_AUDIT_STEM,
    version: EQUAL_HEIGHT_SOCKET_REGISTER_AUDIT_VERSION,
    status: 'review-only-quantitative-discrepancy-report',
    acceptedLedgerStatus: EQUAL_HEIGHT_MASK_LEDGER.status,
    boundaries: {
      ledgerMutation: false,
      proofSourceMutation: false,
      productionArtMutation: false,
      productionRegistration: false,
      exporterMutation: false,
      atlasMutation: false,
      schemaMutation: false,
      blobMutation: false,
      unityMutation: false,
    },
    coverage: {
      maskCount: 47,
      presentationCount: 50,
      underlyingSourcePairCount:
        new Set(presentations.map(({ sourcePairKey }) => sourcePairKey)).size,
      uniqueSourceResolutionCount:
        new Set(
          presentations.map(
            ({ sourceResolutionKey }) => sourceResolutionKey,
          ),
        ).size as 50,
      profiledPresentationCount: retained.length as 50,
      comparedPresentationCount: comparedPresentations.size,
      legalPairCount: legalPairs.length as 338,
      eastPairCount:
        legalPairs.filter(({ direction }) => direction === 'e').length as 169,
      southPairCount:
        legalPairs.filter(({ direction }) => direction === 's').length as 169,
      presentationComparisonCount,
      pairCoverageHash: sha256(
        legalPairs
          .map(
            ({ direction, firstMask, secondMask }) =>
              `${direction}:${firstMask}:${secondMask}`,
          )
          .join('\n'),
      ),
      sourceResolutionHash: sha256(
        presentations
          .map(({ id, sourceResolutionKey }) => `${id}:${sourceResolutionKey}`)
          .join('\n'),
      ),
      discrepancyReportHash: sha256(JSON.stringify(discrepancies)),
    },
    containment: {
      renderPassCount: presentations.length * AUDIT_LAYERS.length,
      renderedPixelCount,
      renderPixelBudget: EQUAL_HEIGHT_SOCKET_REGISTER_RENDER_PIXEL_BUDGET,
      retainedProfilePixelCount,
      retainedProfilePixelBudget:
        EQUAL_HEIGHT_SOCKET_REGISTER_RETAINED_PIXEL_BUDGET,
      maximumTransientRasterPixelCount: 128 * 128,
      maximumTransientRasterPixelBudget:
        EQUAL_HEIGHT_SOCKET_REGISTER_TRANSIENT_PIXEL_BUDGET,
      profileStripWidth:
        EQUAL_HEIGHT_SOCKET_REGISTER_PROFILE_STRIP_WIDTH,
    },
    presentations: retained.map(({ presentation, profiles }) => ({
      id: presentation.id,
      maskIndex: presentation.maskIndex,
      role: presentation.role,
      variantIndex: presentation.variantIndex,
      variantCount: presentation.variantCount,
      sourceStem: presentation.variant.sourceStem,
      baseSourcePath: presentation.baseSourcePath,
      upperSourcePath: presentation.upperSourcePath,
      transform: presentation.variant.transform,
      derivation: presentation.variant.derivation,
      sourcePairKey: presentation.sourcePairKey,
      sourceResolutionKey: presentation.sourceResolutionKey,
      sourceContentHash: presentation.sourceContentHash,
      profileHashes: Object.fromEntries(
        AUDIT_LAYERS.map((layer) => [
          layer,
          profiles[layer].edgeHashes,
        ]),
      ) as Record<
        EqualHeightSocketRegisterLayer,
        Record<EqualHeightSocketRegisterEdge, string>
      >,
    })),
    summary: {
      exactCandidatePresentationComparisonCount,
      exactSelectedLegalPairCount,
      discrepancyCount: discrepancies.length,
      discrepantLegalPairCount,
      categoryCounts: sortedCategoryCounts,
    },
    discrepancies,
  };
}

export function equalHeightSocketRegisterAuditJson(
  report: EqualHeightSocketRegisterAuditReport,
): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

function metricText(
  metric: EqualHeightSocketRegisterDifferenceMetrics,
): string {
  return (
    `${metric.differingSamples}/${metric.sampleCount}` +
    ` px Δ${metric.totalChannelDelta}`
  );
}

export function equalHeightSocketRegisterAuditText(
  report: EqualHeightSocketRegisterAuditReport,
): string {
  const lines = [
    'QUOTACO EQUAL-HEIGHT SOCKET / REGISTER AUDIT',
    'REVIEW ONLY - exact pixel discrepancies are observations, not failures',
    '',
    `Masks: ${report.coverage.maskCount}`,
    `Presentations profiled: ${report.coverage.profiledPresentationCount}`,
    `Underlying source pairs: ${report.coverage.underlyingSourcePairCount}`,
    `Unique source resolutions: ${report.coverage.uniqueSourceResolutionCount}`,
    `Legal cardinal pairs: ${report.coverage.legalPairCount} ` +
      `(${report.coverage.eastPairCount} east, ` +
      `${report.coverage.southPairCount} south)`,
    `Presentation comparisons: ${report.coverage.presentationComparisonCount}`,
    `Exact candidate comparisons: ` +
      `${report.summary.exactCandidatePresentationComparisonCount}`,
    `Exact selected legal pairs: ` +
      `${report.summary.exactSelectedLegalPairCount}`,
    `Discrepancies: ${report.summary.discrepancyCount} across ` +
      `${report.summary.discrepantLegalPairCount} legal pairs`,
    `Raster containment: ${report.containment.renderPassCount} sequential ` +
      `passes, ${report.containment.maximumTransientRasterPixelCount} ` +
      `maximum transient pixels, ${report.containment.retainedProfilePixelCount} ` +
      `retained profile pixels`,
    '',
    'TRIAGE CATEGORIES',
    ...Object.entries(report.summary.categoryCounts).map(
      ([category, count]) => `${category}: ${count}`,
    ),
    '',
    'RANKED DISCREPANCIES',
    ...report.discrepancies.map((discrepancy) => {
      const metrics = discrepancy.metrics;
      return (
        `#${String(discrepancy.rank).padStart(3, '0')} ` +
        `score=${discrepancy.severityScore} ${discrepancy.direction} ` +
        `mask_${discrepancy.firstMask}->mask_${discrepancy.secondMask} ` +
        `${discrepancy.firstPresentationId} -> ` +
        `${discrepancy.secondPresentationId} ` +
        `(best of ${discrepancy.candidatePresentationComparisonCount}) | ` +
        `base128 ${metricText(metrics['base-128'])}; ` +
        `upper128 ${metricText(metrics['upper-128'])}; ` +
        `composed128 ${metricText(metrics['composed-128'])}; ` +
        `composed40 ${metricText(metrics['composed-40'])} | ` +
        discrepancy.categories.join(', ')
      );
    }),
    '',
    'No accepted proof art, mapping, production, exporter, atlas, schema, blob, or Unity boundary was changed.',
  ];
  return `${lines.join('\n')}\n`;
}

interface CliOptions {
  readonly repoRoot: string;
  readonly output: string;
}

function parseCliOptions(args: readonly string[]): CliOptions {
  const defaultRepoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../..',
  );
  let repoRoot = defaultRepoRoot;
  let output = path.join(defaultRepoRoot, '.style-loop');
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--repo-root') {
      repoRoot = path.resolve(args[++index] ?? '');
      continue;
    }
    if (argument === '--out') {
      output = path.resolve(args[++index] ?? '');
      continue;
    }
    throw new Error(`Unknown socket/register audit option: ${argument}`);
  }
  return { repoRoot, output };
}

async function main(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2));
  const report = await runEqualHeightSocketRegisterAudit({
    repoRoot: options.repoRoot,
  });
  await mkdir(options.output, { recursive: true });
  const jsonPath = path.join(
    options.output,
    `${EQUAL_HEIGHT_SOCKET_REGISTER_AUDIT_STEM}.json`,
  );
  const textPath = path.join(
    options.output,
    `${EQUAL_HEIGHT_SOCKET_REGISTER_AUDIT_STEM}.txt`,
  );
  await writeFile(jsonPath, equalHeightSocketRegisterAuditJson(report), 'utf8');
  await writeFile(textPath, equalHeightSocketRegisterAuditText(report), 'utf8');
  process.stdout.write(
    `wrote ${report.coverage.legalPairCount}-pair socket/register audit: ` +
      `${jsonPath}\n${textPath}\n`,
  );
}

if (
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
  main().catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.stack ?? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
