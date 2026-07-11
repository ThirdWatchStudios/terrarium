import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  compileWallBevelDirectory,
  emitWallBevelRegistry,
} from '../scripts/walls/importer';
import {
  composeProceduralOfficeWallTile,
  composeWallTile,
} from '../src/core/compositor';
import type { ShapeSpec } from '../src/core/types';
import { DEFAULT_STYLE, DEFAULT_WALLS } from '../src/data/defaults';
import { BLOB_CONFIGS, NB, blobIndex, configForIndex } from '../src/tiles/blob';
import { WALL_BEVEL_ART } from '../src/tiles/generated/importedWallBevelArt';
import { WALL_TEMPLATES } from '../src/tiles/templates';
import { authoredWallBevel, bevelPieceIdsForNeighbors } from '../src/tiles/wallBevel';
import { WALL_BEVEL_PIECE_IDS } from '../src/tiles/wallBevelContract';

const EXPECTED_IDS = [
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
] as const;

const sourceDirectory = path.resolve(process.cwd(), 'assets/walls/bevel');
const generatedFile = path.resolve(process.cwd(), 'src/tiles/generated/importedWallBevelArt.ts');

function hash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function silhouette(shapes: readonly ShapeSpec[]): ShapeSpec[] {
  return shapes.filter((shape) => shape.silhouette !== false);
}

function expectedPieces(raw: number): readonly string[] {
  const cfg = configForIndex(blobIndex(raw));
  const exposed = { n: !cfg.n, e: !cfg.e, s: !cfg.s, w: !cfg.w };
  const selected = new Set<string>();

  for (const edge of ['n', 'e', 's', 'w'] as const) {
    if (exposed[edge]) selected.add(`edge-${edge}`);
  }
  for (const [corner, first, second] of [
    ['ne', 'n', 'e'],
    ['se', 's', 'e'],
    ['sw', 's', 'w'],
    ['nw', 'n', 'w'],
  ] as const) {
    if (exposed[first] && exposed[second]) selected.add(`convex-${corner}`);
    if (!exposed[first] && !exposed[second] && cfg[corner] === 'concave') {
      selected.add(`concave-${corner}`);
    }
  }
  return EXPECTED_IDS.filter((id) => selected.has(id));
}

describe('authored wall bevel source kit', () => {
  it('freezes the complete 12-piece inventory and fixed-light order', () => {
    expect(WALL_BEVEL_PIECE_IDS).toEqual(EXPECTED_IDS);
    expect(Object.keys(WALL_BEVEL_ART)).toEqual(EXPECTED_IDS);
  });

  it('compiles every canonical SVG into the checked-in runtime registry', async () => {
    const pieces = await compileWallBevelDirectory({
      inputDir: sourceDirectory,
      sourcePathPrefix: 'assets/walls/bevel',
    });
    expect(pieces.map((piece) => piece.id)).toEqual(EXPECTED_IDS);
    expect(Object.fromEntries(pieces.map((piece) => [piece.id, piece.shapes]))).toEqual(WALL_BEVEL_ART);
    expect(emitWallBevelRegistry(pieces)).toBe(await readFile(generatedFile, 'utf8'));
  });

  it('contains only neutral, non-silhouette lighting art', () => {
    for (const id of WALL_BEVEL_PIECE_IDS) {
      expect(WALL_BEVEL_ART[id].length, id).toBeGreaterThan(0);
      for (const shape of WALL_BEVEL_ART[id]) {
        expect(shape.silhouette, `${id} must not change wall silhouettes`).toBe(false);
        expect([undefined, '#FFFFFF', '#000000'], `${id} fill`).toContain(shape.fill);
        expect([undefined, '#FFFFFF', '#000000'], `${id} stroke`).toContain(shape.stroke);
      }
    }
  });
});

describe('wall bevel topology and production isolation', () => {
  it('selects authored edge and corner pieces correctly for every raw neighbor mask', () => {
    const used = new Set<string>();
    for (let raw = 0; raw < 256; raw++) {
      const actual = bevelPieceIdsForNeighbors(raw);
      expect(actual, `raw mask ${raw}`).toEqual(expectedPieces(raw));
      actual.forEach((id) => used.add(id));
    }
    expect([...used].sort()).toEqual([...EXPECTED_IDS].sort());
  });

  it('assembles detail-only art for all 47 canonical blob tiles', () => {
    for (const config of BLOB_CONFIGS) {
      const shapes = authoredWallBevel(config);
      expect(shapes.every((shape) => shape.silhouette === false), `config ${config}`).toBe(true);
      expect(shapes.every((shape) => !shape.fill?.startsWith('$') && !shape.stroke?.startsWith('$'))).toBe(true);
    }
  });

  it('keeps perimeter paint out of the authored face overlays', () => {
    for (let raw = 0; raw < 256; raw++) {
      const shapes = authoredWallBevel(raw);
      expect(shapes.some((shape) => shape.fill === '#000000' && shape.opacity === 0.92), `raw mask ${raw}`)
        .toBe(false);
    }
  });

  it('builds the Office contour from nested boundary geometry, not top-surface paint', () => {
    const office = WALL_TEMPLATES.find((template) => template.id === 'office-wall');
    expect(office).toBeDefined();
    for (let raw = 0; raw < 256; raw++) {
      const config = configForIndex(blobIndex(raw));
      const [boundary, material, ...faces] = office!.build(raw, {}, DEFAULT_WALLS[0].palette);
      const hasExposedEdge = !config.n || !config.e || !config.s || !config.w;
      expect(boundary.fill, `raw mask ${raw} boundary`).toBe('#000000');
      expect(boundary.silhouette, `raw mask ${raw} boundary`).not.toBe(false);
      expect(material.fill, `raw mask ${raw} material`).toBe('$primary');
      expect(material.silhouette, `raw mask ${raw} material`).toBe(false);
      expect(boundary.d === material.d, `raw mask ${raw} nested geometry`).toBe(!hasExposedEdge);
      expect(faces.every((shape) => shape.silhouette === false), `raw mask ${raw} faces`).toBe(true);
    }
    expect(hash(BLOB_CONFIGS.map((config) => silhouette(office!.build(config, {}, DEFAULT_WALLS[0].palette)))))
      .toBe('d05869d6bcba18787b5c8050caa5f33d7d7e89e95740487a0c384ddd62450a44');
  });

  it('changes only the Office lighting candidate and keeps the other nine wall renders frozen', () => {
    const office = DEFAULT_WALLS.find((wall) => wall.id === 'wall-office')!;
    const changed = BLOB_CONFIGS.filter((config) =>
      composeWallTile(office, DEFAULT_STYLE, config, 128) !==
      composeProceduralOfficeWallTile(office, DEFAULT_STYLE, config, 128));
    expect(changed).toHaveLength(BLOB_CONFIGS.length);

    const untouched = DEFAULT_WALLS
      .filter((wall) => wall.id !== 'wall-office')
      .map((wall) => ({
        id: wall.id,
        tiles: BLOB_CONFIGS.map((config) => composeWallTile(wall, DEFAULT_STYLE, config, 128)),
      }));
    expect(hash(untouched)).toBe('291d9cec8e763d8083b82d4d9a697e2955114c444fa2ab803c9891cd6fed9948');
  });

  it('keeps glass and curtain on their procedural no-bevel paths', () => {
    const authoredPaths = new Set(
      WALL_BEVEL_PIECE_IDS.flatMap((id) => WALL_BEVEL_ART[id].map((shape) => shape.d)),
    );
    for (const id of ['glass-partition', 'curtain-wall']) {
      const template = WALL_TEMPLATES.find((candidate) => candidate.id === id)!;
      for (const raw of [0, NB.N | NB.E, 0xff]) {
        expect(template.build(raw, {}, DEFAULT_WALLS[0].palette).some((shape) => authoredPaths.has(shape.d)), id)
          .toBe(false);
      }
    }
  });
});
