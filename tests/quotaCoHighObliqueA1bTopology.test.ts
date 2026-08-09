import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { beforeAll, describe, expect, it } from 'vitest';

import { tileShapeIsTintImpure } from '../src/core/compositor';
import { EXPORT_SCALES, wallAtlas } from '../src/core/exporter';
import type { ShapeSpec } from '../src/core/types';
import { CURRENT_SCHEMA_VERSION } from '../src/core/types';
import { DEFAULT_STYLE, DEFAULT_WALLS } from '../src/data/defaults';
import { PROP_TEMPLATES } from '../src/props/templates';
import {
  BLOB_CONFIGS,
  BLOB_TILE_COUNT,
  blobContract,
  blobIndex,
  configForIndex,
} from '../src/tiles/blob';
import { FLOOR_TEMPLATES, WALL_TEMPLATES } from '../src/tiles/templates';
import { A1A_PALETTE, A1A_RULER, resolveA1aPaint } from '../scripts/highOblique/a1aProof';
import {
  A1B_TOPOLOGY_ATLAS_COLUMNS,
  A1B_TOPOLOGY_ATLAS_PADDING,
  A1B_TOPOLOGY_ATLAS_ROWS,
  A1B_TOPOLOGY_BANKS,
  A1B_TOPOLOGY_CANVAS,
  A1B_TOPOLOGY_CELL_STRIDE,
  A1B_TOPOLOGY_COMPONENT_COUNT,
  A1B_TOPOLOGY_EVIDENCE_COUNT,
  A1B_TOPOLOGY_KERNELS,
  A1B_TOPOLOGY_ROLE_IDS,
  A1B_TOPOLOGY_SOURCE_IDS,
  A1B_TOPOLOGY_SOURCE_INVENTORY,
  A1B_TOPOLOGY_STATE_COMPATIBILITY,
  A1B_TOPOLOGY_STATE_IDS,
  A1B_TOPOLOGY_TILE_COUNT,
  a1bTopologyAtlasDescriptor,
  a1bTopologyAtlasSvg,
  a1bTopologyComponentManifest,
  a1bTopologyFrameMarkup,
  a1bTopologyFrameSvg,
  a1bTopologyKernelShapesForIndex,
  a1bTopologyRoleIdsForIndex,
  a1bTopologyShapeMarkup,
  buildA1bTopologyComponentFrames,
  buildA1bTopologyEvidenceFrames,
  compileA1bTopologyDirectory,
  loadA1bTopologyFamily,
  resolveA1bTopologyEvidence,
  resolveA1bTopologyMask,
  type A1bTopologyBank,
  type A1bTopologyComponentFrame,
  type A1bTopologyEvidenceFrame,
  type A1bTopologyFamily,
  type A1bTopologyRoleId,
  type A1bTopologyStateId,
} from '../scripts/highOblique/a1bTopology';
import {
  A1B_TOPOLOGY_COMPONENT_ATLAS_COLUMNS,
  A1B_TOPOLOGY_COMPONENT_ATLAS_ROWS,
  a1bTopologyComponentAtlasDescriptor,
  a1bTopologyComponentAtlasSvg,
  a1bTopologyComponentFrameMarkup,
} from '../scripts/highOblique/a1bTopologyProof';

const SOURCE_PREFIX = 'assets/walls/quota-co-building-system/topology';
const SOURCE_DIRECTORY = path.resolve(process.cwd(), SOURCE_PREFIX);

const EXPECTED_ROLE_IDS = [
  'edge-n',
  'edge-e',
  'edge-s',
  'edge-w',
  'convex-ne',
  'convex-se',
  'convex-sw',
  'convex-nw',
  'concave-ne',
  'concave-se',
  'concave-sw',
  'concave-nw',
  'one-ne-n',
  'one-ne-e',
  'one-se-s',
  'one-se-e',
  'one-sw-s',
  'one-sw-w',
  'one-nw-n',
  'one-nw-w',
] as const;

const EXPECTED_STATE_IDS = [
  'profile-n-to-e-upper',
  'profile-w-to-s-upper',
  'door-base',
  'door-upper-frame',
  'door-leaf-closed',
  'door-leaf-open',
  'window-wide-upper',
] as const;

const STATE_LAYERS: Readonly<Record<A1bTopologyStateId, 'base' | 'upper' | 'opening'>> = {
  'profile-n-to-e-upper': 'upper',
  'profile-w-to-s-upper': 'upper',
  'door-base': 'base',
  'door-upper-frame': 'upper',
  'door-leaf-closed': 'opening',
  'door-leaf-open': 'opening',
  'window-wide-upper': 'opening',
};

const EXPECTED_SOURCE_SPECS = [
  ...(['base', 'upper'] as const).flatMap((bank) =>
    EXPECTED_ROLE_IDS.map((roleId) => ({
      id: `${bank}/${roleId}`,
      kind: 'topology',
      bank,
      roleId,
      layer: bank,
      semanticGroup: `detail/${bank}`,
      relativePath: `${bank}/${roleId}.svg`,
    } as const))),
  ...EXPECTED_STATE_IDS.map((stateId) => ({
    id: `state/${stateId}`,
    kind: 'state',
    bank: 'state',
    stateId,
    layer: STATE_LAYERS[stateId],
    semanticGroup: 'detail/state',
    relativePath: `state/${stateId}.svg`,
  } as const)),
] as const;

function pad(index: number): string {
  return index.toString().padStart(2, '0');
}

const EXPECTED_COMPONENT_IDS = [
  ...(['base', 'upper'] as const).flatMap((bank) =>
    Array.from({ length: BLOB_TILE_COUNT }, (_, index) => `a1b_component_${bank}_${pad(index)}`)),
  ...EXPECTED_STATE_IDS.map((stateId) => `a1b_component_state_${stateId}`),
];

const EXPECTED_EVIDENCE_IDS = [
  ...Array.from({ length: BLOB_TILE_COUNT }, (_, index) => `a1b_evidence_low_${pad(index)}`),
  ...Array.from({ length: BLOB_TILE_COUNT }, (_, index) => `a1b_evidence_full_${pad(index)}`),
  'a1b_evidence_transition_n_to_e',
  'a1b_evidence_transition_w_to_s',
  'a1b_evidence_door_closed_n',
  'a1b_evidence_door_open_n',
  'a1b_evidence_window_wide_n',
];

interface Raster {
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint8Array;
}

function raster(svg: string): Raster {
  const rendered = new Resvg(svg, { font: { loadSystemFonts: false } }).render();
  return { width: rendered.width, height: rendered.height, pixels: rendered.pixels };
}

function shapesSvg(shapes: readonly ShapeSpec[], pixelSize = A1B_TOPOLOGY_CANVAS): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${pixelSize}" height="${pixelSize}" ` +
    `viewBox="0 0 ${A1B_TOPOLOGY_CANVAS} ${A1B_TOPOLOGY_CANVAS}">` +
    shapes.map(a1bTopologyShapeMarkup).join('') +
    '</svg>'
  );
}

function alphaAt(rendered: Raster, x: number, y: number): number {
  return rendered.pixels[(y * rendered.width + x) * 4 + 3];
}

function alphaCounts(
  rendered: Raster,
  x: number,
  y: number,
  width: number,
  height: number,
): { painted: number; transparent: number } {
  let painted = 0;
  let transparent = 0;
  for (let py = y; py < y + height; py += 1) {
    for (let px = x; px < x + width; px += 1) {
      if (alphaAt(rendered, px, py) === 0) transparent += 1;
      else painted += 1;
    }
  }
  return { painted, transparent };
}

function alphaBounds(rendered: Raster): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = rendered.width;
  let minY = rendered.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < rendered.height; y += 1) {
    for (let x = 0; x < rendered.width; x += 1) {
      if (alphaAt(rendered, x, y) === 0) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return { minX, minY, maxX, maxY };
}

type Edge = 'n' | 'e' | 's' | 'w';
type Corner = 'ne' | 'se' | 'sw' | 'nw';

const CORNERS: readonly { corner: Corner; first: Edge; second: Edge }[] = [
  { corner: 'ne', first: 'n', second: 'e' },
  { corner: 'se', first: 's', second: 'e' },
  { corner: 'sw', first: 's', second: 'w' },
  { corner: 'nw', first: 'n', second: 'w' },
];

function expectedRoleIds(index: number): readonly A1bTopologyRoleId[] {
  const config = configForIndex(index);
  const exposed: Readonly<Record<Edge, boolean>> = {
    n: !config.n,
    e: !config.e,
    s: !config.s,
    w: !config.w,
  };
  const selected = new Set<A1bTopologyRoleId>();
  for (const edge of ['n', 'e', 's', 'w'] as const) {
    if (exposed[edge]) selected.add(`edge-${edge}`);
  }
  for (const { corner, first, second } of CORNERS) {
    const firstExposed = exposed[first];
    const secondExposed = exposed[second];
    if (firstExposed && secondExposed) selected.add(`convex-${corner}`);
    else if (!firstExposed && !secondExposed && config[corner] === 'concave') {
      selected.add(`concave-${corner}`);
    } else if (firstExposed !== secondExposed) {
      selected.add(`one-${corner}-${firstExposed ? first : second}` as A1bTopologyRoleId);
    }
  }
  return EXPECTED_ROLE_IDS.filter((roleId) => selected.has(roleId));
}

function edgeSignature(rendered: Raster, edge: Edge): string {
  const values: number[] = [];
  for (let offset = 0; offset < A1B_TOPOLOGY_CANVAS; offset += 1) {
    const x = edge === 'w' ? 0 : edge === 'e' ? A1B_TOPOLOGY_CANVAS - 1 : offset;
    const y = edge === 'n' ? 0 : edge === 's' ? A1B_TOPOLOGY_CANVAS - 1 : offset;
    values.push(alphaAt(rendered, x, y) === 0 ? 0 : 1);
  }
  return values.join('');
}

function edgeHasPaint(rendered: Raster, edge: Edge): boolean {
  return edgeSignature(rendered, edge).includes('1');
}

function productionSignature(): string {
  return JSON.stringify({
    schemaVersion: CURRENT_SCHEMA_VERSION,
    blob: blobContract(),
    wallTemplates: WALL_TEMPLATES.map(({ id }) => id),
    floorTemplates: FLOOR_TEMPLATES.map(({ id }) => id),
    propTemplates: PROP_TEMPLATES.map(({ id }) => id),
    defaultWalls: DEFAULT_WALLS.map(({ id, templateId }) => ({ id, templateId })),
    wallAtlas: wallAtlas(DEFAULT_WALLS[0], DEFAULT_STYLE, 1),
  });
}

const productionBefore = productionSignature();

let family: A1bTopologyFamily;

beforeAll(async () => {
  family = await loadA1bTopologyFamily({
    inputDir: SOURCE_DIRECTORY,
    sourcePathPrefix: SOURCE_PREFIX,
  });
});

describe('QuotaCo high-oblique A1b complete topology proof', () => {
  it('freezes the exact 47-file authored source authority', async () => {
    expect(A1B_TOPOLOGY_BANKS).toEqual(['base', 'upper']);
    expect(A1B_TOPOLOGY_ROLE_IDS).toEqual(EXPECTED_ROLE_IDS);
    expect(A1B_TOPOLOGY_STATE_IDS).toEqual(EXPECTED_STATE_IDS);
    expect(A1B_TOPOLOGY_SOURCE_INVENTORY).toEqual(EXPECTED_SOURCE_SPECS);
    expect(A1B_TOPOLOGY_SOURCE_IDS).toEqual(EXPECTED_SOURCE_SPECS.map(({ id }) => id));
    expect(new Set(A1B_TOPOLOGY_SOURCE_IDS).size).toBe(47);

    const repeated = await compileA1bTopologyDirectory({
      inputDir: SOURCE_DIRECTORY,
      sourcePathPrefix: SOURCE_PREFIX,
    });
    expect(repeated).toEqual(family.sources);
    expect(family.sources).toHaveLength(47);

    for (const source of family.sources) {
      expect(source.sourceFile).toBe(`${SOURCE_PREFIX}/${source.relativePath}`);
      expect(source.shapes.length, source.id).toBeGreaterThan(0);
      expect(source.shapes.every((shape) => shape.layer === source.layer), source.id).toBe(true);
      const text = await readFile(path.resolve(process.cwd(), source.sourceFile), 'utf8');
      expect(text, source.relativePath).toContain('viewBox="0 0 128 128"');
      expect(text, source.relativePath).toMatch(
        new RegExp(`id=["']${source.semanticGroup.replace('/', '\\/')}["']`),
      );
    }
  });

  it('uses the canonical blob table for all roles and all 256 raw masks', () => {
    expect(A1B_TOPOLOGY_TILE_COUNT).toBe(BLOB_TILE_COUNT);
    expect(BLOB_CONFIGS).toHaveLength(47);
    expect(new Set(BLOB_CONFIGS).size).toBe(47);
    const usedRoles = new Set<A1bTopologyRoleId>();

    for (let index = 0; index < BLOB_TILE_COUNT; index += 1) {
      const roles = a1bTopologyRoleIdsForIndex(index);
      expect(roles, `blob ${index}`).toEqual(expectedRoleIds(index));
      expect(new Set(roles).size, `blob ${index} duplicate role`).toBe(roles.length);
      roles.forEach((role) => usedRoles.add(role));
    }
    expect([...usedRoles].sort()).toEqual([...EXPECTED_ROLE_IDS].sort());

    for (let raw = 0; raw < 256; raw += 1) {
      const expectedIndex = blobIndex(raw);
      const resolved = resolveA1bTopologyMask(raw);
      expect(resolved).toEqual({
        rawNeighbors: raw,
        blobIndex: expectedIndex,
        canonicalMask: BLOB_CONFIGS[expectedIndex],
        config: configForIndex(expectedIndex),
        roleIds: expectedRoleIds(expectedIndex),
        baseComponentId: `a1b_component_base_${pad(expectedIndex)}`,
        upperComponentId: `a1b_component_upper_${pad(expectedIndex)}`,
      });
      expect(resolveA1bTopologyEvidence(raw, 'low').evidenceFrameId)
        .toBe(`a1b_evidence_low_${pad(expectedIndex)}`);
      expect(resolveA1bTopologyEvidence(raw, 'full').evidenceFrameId)
        .toBe(`a1b_evidence_full_${pad(expectedIndex)}`);
    }

    expect(() => resolveA1bTopologyMask(-1)).toThrow(/0\.\.255/);
    expect(() => resolveA1bTopologyMask(256)).toThrow(/0\.\.255/);
    expect(() => a1bTopologyRoleIdsForIndex(47)).toThrow(/0\.\.46/);
  });

  it('builds exactly 101 source-derived component manifests with no missing masks', () => {
    expect(A1B_TOPOLOGY_COMPONENT_COUNT).toBe(101);
    expect(family.components).toHaveLength(101);
    expect(family.components.map(({ id }) => id)).toEqual(EXPECTED_COMPONENT_IDS);
    expect(buildA1bTopologyComponentFrames(family.sources)).toEqual(family.components);

    const sourceById = new Map(family.sources.map((source) => [source.id, source]));
    for (const bank of ['base', 'upper'] as const) {
      const components = family.components.filter((component) => component.bank === bank);
      expect(components).toHaveLength(47);
      expect(components.map(({ blobIndex }) => blobIndex)).toEqual(
        Array.from({ length: 47 }, (_, index) => index),
      );
      expect(components.map(({ canonicalMask }) => canonicalMask)).toEqual(BLOB_CONFIGS);
      for (const component of components) {
        const index = component.blobIndex!;
        const roleIds = expectedRoleIds(index);
        const expectedSourceIds = roleIds.map((roleId) => `${bank}/${roleId}` as const);
        const expectedSources = expectedSourceIds.map((id) => sourceById.get(id)!);
        expect(component.roleIds, component.id).toEqual(roleIds);
        expect(component.sourceIds, component.id).toEqual(expectedSourceIds);
        expect(component.shapes, `${component.id} source composition`).toEqual([
          ...a1bTopologyKernelShapesForIndex(index, bank),
          ...expectedSources.flatMap((source) => source.shapes),
        ]);
        expect(component.pivot).toEqual({ x: 0.5, y: 0.5 });
        expect(component.bounds).toEqual({ x: 0, y: 0, w: 128, h: 128 });
      }
    }

    const states = family.components.filter((component) => component.bank === 'state');
    expect(states.map(({ stateId }) => stateId)).toEqual(EXPECTED_STATE_IDS);
    for (const component of states) {
      const source = sourceById.get(`state/${component.stateId}`)!;
      expect(component.sourceIds).toEqual([source.id]);
      expect(component.shapes).toEqual(source.shapes);
    }

    const manifest = a1bTopologyComponentManifest(family.components);
    expect(manifest).toEqual(family.componentManifest);
    expect(Object.keys(manifest.components)).toEqual(EXPECTED_COMPONENT_IDS);
    expect(manifest).toMatchObject({
      version: 0,
      status: 'proof-only',
      contract: false,
      pivot: { x: 0.5, y: 0.5 },
      meta: {
        sourceCount: 47,
        componentCount: 101,
        baseCount: 47,
        upperCount: 47,
        stateCount: 7,
        productionRegistration: false,
        schemaChange: false,
        profileMetadataPermanent: false,
      },
    });
  });

  it('builds the exact 99-frame low/full/profile/opening evidence matrix', () => {
    expect(A1B_TOPOLOGY_EVIDENCE_COUNT).toBe(99);
    expect(family.evidenceFrames).toHaveLength(99);
    expect(family.evidenceFrames.map(({ id }) => id)).toEqual(EXPECTED_EVIDENCE_IDS);
    expect(new Set(family.evidenceFrames.map(({ id }) => id)).size).toBe(99);
    expect(buildA1bTopologyEvidenceFrames(family.components)).toEqual(family.evidenceFrames);

    const componentById = new Map(family.components.map((component) => [component.id, component]));
    for (const frame of family.evidenceFrames) {
      const components = frame.componentIds.map((id) => componentById.get(id)!);
      expect(components.every(Boolean), frame.id).toBe(true);
      expect(frame.shapes, `${frame.id} shape provenance`).toEqual(
        components.flatMap((component) => component.shapes),
      );
      expect(frame.sourceIds, `${frame.id} source provenance`).toEqual([
        ...new Set(components.flatMap((component) => component.sourceIds)),
      ]);
      expect(frame.sourceFiles, `${frame.id} file provenance`).toEqual([
        ...new Set(components.flatMap((component) => component.sourceFiles)),
      ]);
      expect(frame.pivot).toEqual({ x: 0.5, y: 0.5 });
      expect(frame.bounds).toEqual({ x: 0, y: 0, w: 128, h: 128 });
    }

    const lows = family.evidenceFrames.slice(0, 47);
    const fulls = family.evidenceFrames.slice(47, 94);
    expect(lows.map(({ profileCase }) => profileCase)).toEqual(Array(47).fill('low'));
    expect(lows.map(({ blobIndex }) => blobIndex)).toEqual(Array.from({ length: 47 }, (_, i) => i));
    expect(lows.map(({ canonicalMask }) => canonicalMask)).toEqual(BLOB_CONFIGS);
    expect(lows.every(({ upperBlobIndex }) => upperBlobIndex === undefined)).toBe(true);
    expect(fulls.map(({ blobIndex }) => blobIndex)).toEqual(Array.from({ length: 47 }, (_, i) => i));
    expect(fulls.map(({ canonicalMask }) => canonicalMask)).toEqual(BLOB_CONFIGS);
    expect(fulls.every((frame) => frame.upperBlobIndex === frame.blobIndex)).toBe(true);
  });

  it('keeps profileCase explicit for ambiguous straights, transitions, and openings', () => {
    const byId = new Map(family.evidenceFrames.map((frame) => [frame.id, frame]));
    const lowNorthSouth = byId.get('a1b_evidence_low_05')!;
    const fullWest = byId.get('a1b_evidence_full_05')!;
    const lowEastWest = byId.get('a1b_evidence_low_10')!;
    const fullNorth = byId.get('a1b_evidence_full_10')!;

    expect([lowNorthSouth.canonicalMask, fullWest.canonicalMask]).toEqual([5, 5]);
    expect([lowEastWest.canonicalMask, fullNorth.canonicalMask]).toEqual([10, 10]);
    expect(lowNorthSouth.profileCase).toBe('low');
    expect(fullWest.profileCase).toBe('full-w');
    expect(lowEastWest.profileCase).toBe('low');
    expect(fullNorth.profileCase).toBe('full-n');
    expect(new Set(lowNorthSouth.shapes.map(({ layer }) => layer))).toEqual(new Set(['base']));
    expect(new Set(fullWest.shapes.map(({ layer }) => layer))).toEqual(new Set(['base', 'upper']));
    expect(new Set(lowEastWest.shapes.map(({ layer }) => layer))).toEqual(new Set(['base']));
    expect(new Set(fullNorth.shapes.map(({ layer }) => layer))).toEqual(new Set(['base', 'upper']));

    expect(A1B_TOPOLOGY_STATE_COMPATIBILITY).toEqual({
      'profile-n-to-e-upper': { compatibleBlobIndex: 12, profileCases: ['transition-n-to-e'] },
      'profile-w-to-s-upper': { compatibleBlobIndex: 3, profileCases: ['transition-w-to-s'] },
      'door-base': { compatibleBlobIndex: 10, profileCases: ['door-closed-n', 'door-open-n'] },
      'door-upper-frame': { compatibleBlobIndex: 10, profileCases: ['door-closed-n', 'door-open-n'] },
      'door-leaf-closed': { compatibleBlobIndex: 10, profileCases: ['door-closed-n'] },
      'door-leaf-open': { compatibleBlobIndex: 10, profileCases: ['door-open-n'] },
      'window-wide-upper': { compatibleBlobIndex: 10, profileCases: ['window-wide-n'] },
    });

    const transitionNorthEast = byId.get('a1b_evidence_transition_n_to_e')!;
    const transitionWestSouth = byId.get('a1b_evidence_transition_w_to_s')!;
    expect(transitionNorthEast).toMatchObject({
      profileCase: 'transition-n-to-e',
      blobIndex: 12,
      canonicalMask: 12,
      stateIds: ['profile-n-to-e-upper'],
      componentIds: ['a1b_component_base_12', 'a1b_component_state_profile-n-to-e-upper'],
    });
    expect(transitionWestSouth).toMatchObject({
      profileCase: 'transition-w-to-s',
      blobIndex: 3,
      canonicalMask: 3,
      stateIds: ['profile-w-to-s-upper'],
      componentIds: ['a1b_component_base_03', 'a1b_component_state_profile-w-to-s-upper'],
    });

    expect(byId.get('a1b_evidence_door_closed_n')).toMatchObject({
      profileCase: 'door-closed-n',
      blobIndex: 10,
      stateIds: ['door-base', 'door-upper-frame', 'door-leaf-closed'],
    });
    expect(byId.get('a1b_evidence_door_open_n')).toMatchObject({
      profileCase: 'door-open-n',
      blobIndex: 10,
      stateIds: ['door-base', 'door-upper-frame', 'door-leaf-open'],
    });
    expect(byId.get('a1b_evidence_window_wide_n')).toMatchObject({
      profileCase: 'window-wide-n',
      blobIndex: 10,
      stateIds: ['window-wide-upper'],
    });

    const openDoor = raster(a1bTopologyFrameSvg(byId.get('a1b_evidence_door_open_n')!));
    const closedDoor = raster(a1bTopologyFrameSvg(byId.get('a1b_evidence_door_closed_n')!));
    expect(alphaAt(openDoor, 64, 80), 'open doorway centre').toBe(0);
    expect(alphaAt(closedDoor, 64, 80), 'closed doorway centre').toBeGreaterThan(0);

    const lowBounds = alphaBounds(raster(a1bTopologyFrameSvg(lowEastWest)));
    const fullBounds = alphaBounds(raster(a1bTopologyFrameSvg(fullNorth)));
    expect(lowBounds.maxY - lowBounds.minY + 1).toBeLessThanOrEqual(A1A_RULER.lowProfile + 4);
    expect(lowBounds.maxY - fullBounds.minY + 1).toBeGreaterThanOrEqual(A1A_RULER.fullProfile);
  });

  it('keeps pivots, transparent canvas bounds, palette layers, and reserved colors honest', async () => {
    expect(A1B_TOPOLOGY_KERNELS).toEqual({
      base: {
        outerStart: 94,
        innerStart: 96,
        firstCut: 102,
        secondCut: 112,
        innerEnd: 118,
        outerEnd: 120,
        material: '$green',
      },
      upper: {
        outerStart: 56,
        innerStart: 58,
        firstCut: 68,
        secondCut: 87,
        innerEnd: 97,
        outerEnd: 99,
        material: '$cream',
      },
    });

    const allowedTokens = new Set(['cream', 'green', 'teal']);
    const allowedLiterals = new Set([
      '#FFFFFF',
      '#000000',
      A1A_PALETTE.coral,
      A1A_PALETTE.charcoal,
      A1A_PALETTE.glass,
      A1A_PALETTE.metal,
    ].map((paint) => paint.toUpperCase()));
    const forbidden = new Set(['#D69B4B', '#D8638F']);
    const usedTokens = new Set<string>();

    for (const source of family.sources) {
      const sourceText = (await readFile(path.resolve(process.cwd(), source.sourceFile), 'utf8')).toUpperCase();
      for (const reserved of forbidden) expect(sourceText, `${source.id} uses ${reserved}`).not.toContain(reserved);
      for (const shape of source.shapes) {
        expect(shape.silhouette, `${source.id} remains explicit detail art`).toBe(false);
        expect(tileShapeIsTintImpure(shape), source.id).toBe(false);
        expect(shape.layer === 'base' || shape.layer === 'upper' || shape.layer === 'opening').toBe(true);
        for (const paint of [shape.fill, shape.stroke]) {
          if (paint === undefined) continue;
          if (paint.startsWith('$')) {
            const token = paint.slice(1);
            usedTokens.add(token);
            expect(allowedTokens.has(token), `${source.id} token ${token}`).toBe(true);
          } else {
            expect(allowedLiterals.has(paint.toUpperCase()), `${source.id} literal ${paint}`).toBe(true);
          }
          expect(forbidden.has(resolveA1aPaint(paint).toUpperCase()), source.id).toBe(false);
        }
      }
    }
    expect([...usedTokens].sort()).toEqual(['cream', 'green', 'teal']);

    for (const frame of family.evidenceFrames) {
      const rendered = raster(a1bTopologyFrameSvg(frame));
      const counts = alphaCounts(rendered, 0, 0, rendered.width, rendered.height);
      const bounds = alphaBounds(rendered);
      expect(counts.painted, frame.id).toBeGreaterThan(0);
      expect(counts.transparent, `${frame.id} transparent canvas`).toBeGreaterThan(0);
      expect(bounds.minX, frame.id).toBeGreaterThanOrEqual(frame.bounds.x);
      expect(bounds.minY, frame.id).toBeGreaterThanOrEqual(frame.bounds.y);
      expect(bounds.maxX, frame.id).toBeLessThan(frame.bounds.x + frame.bounds.w);
      expect(bounds.maxY, frame.id).toBeLessThan(frame.bounds.y + frame.bounds.h);
      expect(frame.pivot).toEqual({ x: 0.5, y: 0.5 });
      expect(frame.shapes.some((shape) => shape.layer === ('shadow' as never)), frame.id).toBe(false);
    }
  });

  it('keeps every connected base and upper socket continuous across all 47 masks', () => {
    const componentRasters = new Map<string, Raster>();
    const renderComponent = (component: A1bTopologyComponentFrame): Raster => {
      let rendered = componentRasters.get(component.id);
      if (!rendered) {
        rendered = raster(shapesSvg(component.shapes));
        componentRasters.set(component.id, rendered);
      }
      return rendered;
    };

    for (const bank of ['base', 'upper'] as const) {
      const components = family.components.filter(
        (component): component is A1bTopologyComponentFrame & { blobIndex: number; bank: A1bTopologyBank } =>
          component.kind === 'topology' && component.bank === bank && component.blobIndex !== undefined,
      );
      expect(components).toHaveLength(47);
      const signatures = new Map<Edge, Set<string>>([
        ['n', new Set<string>()],
        ['e', new Set<string>()],
        ['s', new Set<string>()],
        ['w', new Set<string>()],
      ]);

      for (const component of components) {
        const config = configForIndex(component.blobIndex);
        const rendered = renderComponent(component);
        for (const edge of ['n', 'e', 's', 'w'] as const) {
          expect(edgeHasPaint(rendered, edge), `${component.id} ${edge} socket`)
            .toBe(config[edge]);
          if (config[edge]) signatures.get(edge)!.add(edgeSignature(rendered, edge));
        }
      }

      for (const edge of ['n', 'e', 's', 'w'] as const) {
        expect(signatures.get(edge)!.size, `${bank} ${edge} socket variants`).toBe(1);
        expect([...signatures.get(edge)!][0], `${bank} ${edge} socket`).toContain('1');
      }
      expect([...signatures.get('n')!]).toEqual([...signatures.get('s')!]);
      expect([...signatures.get('e')!]).toEqual([...signatures.get('w')!]);

      const continuityToken = bank === 'base' ? '$green' : '$cream';
      const tokenSignatures = new Map<Edge, Set<string>>([
        ['n', new Set<string>()],
        ['e', new Set<string>()],
        ['s', new Set<string>()],
        ['w', new Set<string>()],
      ]);
      for (const component of components) {
        const config = configForIndex(component.blobIndex);
        const tokenShapes = component.shapes.filter(
          (shape) => shape.fill === continuityToken || shape.stroke === continuityToken,
        );
        const rendered = raster(shapesSvg(tokenShapes));
        for (const edge of ['n', 'e', 's', 'w'] as const) {
          if (config[edge]) tokenSignatures.get(edge)!.add(edgeSignature(rendered, edge));
        }
      }
      for (const edge of ['n', 'e', 's', 'w'] as const) {
        expect(tokenSignatures.get(edge)!.size, `${bank} ${continuityToken} ${edge}`).toBe(1);
        expect([...tokenSignatures.get(edge)!][0], `${bank} ${continuityToken} ${edge}`).toContain('1');
      }
      expect([...tokenSignatures.get('n')!]).toEqual([...tokenSignatures.get('s')!]);
      expect([...tokenSignatures.get('e')!]).toEqual([...tokenSignatures.get('w')!]);
    }
  });

  it('packs a deterministic transparent 99-frame proof atlas at every export scale', async () => {
    expect([A1B_TOPOLOGY_ATLAS_COLUMNS, A1B_TOPOLOGY_ATLAS_ROWS]).toEqual([11, 9]);
    expect(A1B_TOPOLOGY_ATLAS_COLUMNS * A1B_TOPOLOGY_ATLAS_ROWS).toBe(99);

    for (const scale of EXPORT_SCALES) {
      const atlas = a1bTopologyAtlasDescriptor(family.evidenceFrames, scale);
      const stride = A1B_TOPOLOGY_CELL_STRIDE * scale;
      expect(atlas.width).toBe(A1B_TOPOLOGY_ATLAS_COLUMNS * stride);
      expect(atlas.height).toBe(A1B_TOPOLOGY_ATLAS_ROWS * stride);
      expect(atlas.frameSize).toBe(A1B_TOPOLOGY_CANVAS * scale);
      expect(Object.keys(atlas.frames)).toEqual(EXPECTED_EVIDENCE_IDS);
      expect(Math.max(atlas.width, atlas.height), `A1b topology@${scale}x`).toBeLessThanOrEqual(8192);
      for (const [index, frame] of Object.values(atlas.frames).entries()) {
        expect(frame).toMatchObject({
          x: (index % A1B_TOPOLOGY_ATLAS_COLUMNS) * stride + A1B_TOPOLOGY_ATLAS_PADDING * scale,
          y: Math.floor(index / A1B_TOPOLOGY_ATLAS_COLUMNS) * stride + A1B_TOPOLOGY_ATLAS_PADDING * scale,
          w: A1B_TOPOLOGY_CANVAS * scale,
          h: A1B_TOPOLOGY_CANVAS * scale,
          bounds: { x: 0, y: 0, w: 128, h: 128 },
        });
      }
    }

    const repeated = await loadA1bTopologyFamily({
      inputDir: SOURCE_DIRECTORY,
      sourcePathPrefix: SOURCE_PREFIX,
    });
    expect(repeated.evidenceFrames).toEqual(family.evidenceFrames);
    expect(a1bTopologyFrameMarkup(repeated.evidenceFrames[0]))
      .toBe(a1bTopologyFrameMarkup(family.evidenceFrames[0]));

    const atlas = a1bTopologyAtlasDescriptor(family.evidenceFrames, 1);
    expect(atlas).toMatchObject({
      version: 0,
      status: 'proof-only',
      contract: false,
      pivot: { x: 0.5, y: 0.5 },
      meta: {
        evidenceCount: 99,
        lowCount: 47,
        fullCount: 47,
        transitionCount: 2,
        openingCount: 3,
        completeBlobFamily: true,
        transparentPadding: true,
        temporaryFrameIds: true,
        productionRegistration: false,
        schemaChange: false,
        directionalCastShadow: false,
      },
    });
    const source = a1bTopologyAtlasSvg(family.evidenceFrames, 1);
    expect(a1bTopologyAtlasSvg(repeated.evidenceFrames, 1)).toBe(source);
    expect(source).not.toMatch(/<text|checker|panel/i);
    const rendered = raster(source);
    expect([rendered.width, rendered.height]).toEqual([atlas.width, atlas.height]);

    for (let index = 0; index < family.evidenceFrames.length; index += 1) {
      const frame = family.evidenceFrames[index];
      const rect = atlas.frames[frame.id];
      const counts = alphaCounts(rendered, rect.x, rect.y, rect.w, rect.h);
      expect(counts.painted, frame.id).toBeGreaterThan(0);
      expect(counts.transparent, `${frame.id} transparent frame`).toBeGreaterThan(0);

      const cellX = (index % A1B_TOPOLOGY_ATLAS_COLUMNS) * A1B_TOPOLOGY_CELL_STRIDE;
      const cellY = Math.floor(index / A1B_TOPOLOGY_ATLAS_COLUMNS) * A1B_TOPOLOGY_CELL_STRIDE;
      expect(alphaCounts(
        rendered,
        cellX,
        cellY,
        A1B_TOPOLOGY_CELL_STRIDE,
        A1B_TOPOLOGY_ATLAS_PADDING,
      ).painted, `${frame.id} top gutter`).toBe(0);
      expect(alphaCounts(
        rendered,
        cellX,
        cellY + A1B_TOPOLOGY_ATLAS_PADDING + A1B_TOPOLOGY_CANVAS,
        A1B_TOPOLOGY_CELL_STRIDE,
        A1B_TOPOLOGY_ATLAS_PADDING,
      ).painted, `${frame.id} bottom gutter`).toBe(0);
      expect(alphaCounts(
        rendered,
        cellX,
        cellY,
        A1B_TOPOLOGY_ATLAS_PADDING,
        A1B_TOPOLOGY_CELL_STRIDE,
      ).painted, `${frame.id} left gutter`).toBe(0);
      expect(alphaCounts(
        rendered,
        cellX + A1B_TOPOLOGY_ATLAS_PADDING + A1B_TOPOLOGY_CANVAS,
        cellY,
        A1B_TOPOLOGY_ATLAS_PADDING,
        A1B_TOPOLOGY_CELL_STRIDE,
      ).painted, `${frame.id} right gutter`).toBe(0);
    }
  });

  it('packs all 101 reusable components into a transparent 11x10 proof atlas', () => {
    expect([
      A1B_TOPOLOGY_COMPONENT_ATLAS_COLUMNS,
      A1B_TOPOLOGY_COMPONENT_ATLAS_ROWS,
    ]).toEqual([11, 10]);
    expect(A1B_TOPOLOGY_COMPONENT_ATLAS_COLUMNS * A1B_TOPOLOGY_COMPONENT_ATLAS_ROWS).toBe(110);

    for (const scale of EXPORT_SCALES) {
      const atlas = a1bTopologyComponentAtlasDescriptor(family.components, scale);
      const stride = A1B_TOPOLOGY_CELL_STRIDE * scale;
      expect(atlas.width).toBe(A1B_TOPOLOGY_COMPONENT_ATLAS_COLUMNS * stride);
      expect(atlas.height).toBe(A1B_TOPOLOGY_COMPONENT_ATLAS_ROWS * stride);
      expect(atlas.frameSize).toBe(A1B_TOPOLOGY_CANVAS * scale);
      expect(Object.keys(atlas.frames)).toEqual(EXPECTED_COMPONENT_IDS);
      expect(Math.max(atlas.width, atlas.height), `A1b components@${scale}x`)
        .toBeLessThanOrEqual(8192);
      for (const [index, frame] of Object.values(atlas.frames).entries()) {
        expect(frame).toMatchObject({
          x: (index % A1B_TOPOLOGY_COMPONENT_ATLAS_COLUMNS) * stride +
            A1B_TOPOLOGY_ATLAS_PADDING * scale,
          y: Math.floor(index / A1B_TOPOLOGY_COMPONENT_ATLAS_COLUMNS) * stride +
            A1B_TOPOLOGY_ATLAS_PADDING * scale,
          w: A1B_TOPOLOGY_CANVAS * scale,
          h: A1B_TOPOLOGY_CANVAS * scale,
          bounds: { x: 0, y: 0, w: 128, h: 128 },
        });
      }
    }

    const atlas = a1bTopologyComponentAtlasDescriptor(family.components, 1);
    expect(atlas).toMatchObject({
      version: 0,
      status: 'proof-only',
      contract: false,
      pivot: { x: 0.5, y: 0.5 },
      meta: {
        componentCount: 101,
        baseCount: 47,
        upperCount: 47,
        stateCount: 7,
        completeBlobFamily: true,
        transparentPadding: true,
        temporaryFrameIds: true,
        productionRegistration: false,
        schemaChange: false,
        directionalCastShadow: false,
      },
    });
    const source = a1bTopologyComponentAtlasSvg(family.components, 1);
    expect(a1bTopologyComponentAtlasSvg(family.components, 1)).toBe(source);
    expect(source).not.toMatch(/<text|checker|panel/i);
    expect(a1bTopologyComponentFrameMarkup(family.components[0])).toBe(
      family.components[0].shapes.map(a1bTopologyShapeMarkup).join(''),
    );
    const rendered = raster(source);
    expect([rendered.width, rendered.height]).toEqual([atlas.width, atlas.height]);

    for (let index = 0; index < family.components.length; index += 1) {
      const component = family.components[index];
      const rect = atlas.frames[component.id];
      const counts = alphaCounts(rendered, rect.x, rect.y, rect.w, rect.h);
      expect(counts.painted, component.id).toBeGreaterThan(0);
      expect(counts.transparent, `${component.id} transparent frame`).toBeGreaterThan(0);

      const cellX = (index % A1B_TOPOLOGY_COMPONENT_ATLAS_COLUMNS) * A1B_TOPOLOGY_CELL_STRIDE;
      const cellY = Math.floor(index / A1B_TOPOLOGY_COMPONENT_ATLAS_COLUMNS) *
        A1B_TOPOLOGY_CELL_STRIDE;
      expect(alphaCounts(
        rendered,
        cellX,
        cellY,
        A1B_TOPOLOGY_CELL_STRIDE,
        A1B_TOPOLOGY_ATLAS_PADDING,
      ).painted, `${component.id} top gutter`).toBe(0);
      expect(alphaCounts(
        rendered,
        cellX,
        cellY + A1B_TOPOLOGY_ATLAS_PADDING + A1B_TOPOLOGY_CANVAS,
        A1B_TOPOLOGY_CELL_STRIDE,
        A1B_TOPOLOGY_ATLAS_PADDING,
      ).painted, `${component.id} bottom gutter`).toBe(0);
      expect(alphaCounts(
        rendered,
        cellX,
        cellY,
        A1B_TOPOLOGY_ATLAS_PADDING,
        A1B_TOPOLOGY_CELL_STRIDE,
      ).painted, `${component.id} left gutter`).toBe(0);
      expect(alphaCounts(
        rendered,
        cellX + A1B_TOPOLOGY_ATLAS_PADDING + A1B_TOPOLOGY_CANVAS,
        cellY,
        A1B_TOPOLOGY_ATLAS_PADDING,
        A1B_TOPOLOGY_CELL_STRIDE,
      ).painted, `${component.id} right gutter`).toBe(0);
    }

    for (
      let index = family.components.length;
      index < A1B_TOPOLOGY_COMPONENT_ATLAS_COLUMNS * A1B_TOPOLOGY_COMPONENT_ATLAS_ROWS;
      index += 1
    ) {
      const cellX = (index % A1B_TOPOLOGY_COMPONENT_ATLAS_COLUMNS) * A1B_TOPOLOGY_CELL_STRIDE;
      const cellY = Math.floor(index / A1B_TOPOLOGY_COMPONENT_ATLAS_COLUMNS) *
        A1B_TOPOLOGY_CELL_STRIDE;
      expect(alphaCounts(
        rendered,
        cellX,
        cellY,
        A1B_TOPOLOGY_CELL_STRIDE,
        A1B_TOPOLOGY_CELL_STRIDE,
      ).painted, `unused component cell ${index}`).toBe(0);
    }
  });

  it('remains proof-only and leaves production blob, templates, atlas, and schema unchanged', () => {
    expect(productionSignature()).toBe(productionBefore);
    expect(CURRENT_SCHEMA_VERSION).toBe(21);
    expect(blobContract()).toMatchObject({ version: 1, tileCount: 47 });
    expect(blobContract().configs).toEqual(BLOB_CONFIGS);

    const productionIds = new Set([
      ...WALL_TEMPLATES.map(({ id }) => id),
      ...FLOOR_TEMPLATES.map(({ id }) => id),
      ...PROP_TEMPLATES.map(({ id }) => id),
    ]);
    for (const id of [...EXPECTED_COMPONENT_IDS, ...EXPECTED_EVIDENCE_IDS, ...A1B_TOPOLOGY_SOURCE_IDS]) {
      expect(productionIds.has(id), id).toBe(false);
    }

    const productionWall = wallAtlas(DEFAULT_WALLS[0], DEFAULT_STYLE, 1);
    expect(Object.keys(productionWall.frames)).toEqual(
      Array.from({ length: BLOB_TILE_COUNT }, (_, index) => `mask_${index}`),
    );
    expect(JSON.stringify(productionWall)).not.toMatch(/a1b|profileCase|high-oblique/i);
    expect(family.componentManifest).toMatchObject({
      contract: false,
      meta: {
        productionRegistration: false,
        schemaChange: false,
        profileMetadataPermanent: false,
      },
    });
    expect(a1bTopologyAtlasDescriptor(family.evidenceFrames, 1)).toMatchObject({
      contract: false,
      meta: { productionRegistration: false, schemaChange: false },
    });
  });
});
