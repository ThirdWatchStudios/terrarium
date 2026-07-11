import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';

import {
  compileWallBevelDirectory,
  emitWallBevelRegistry,
} from '../scripts/walls/importer';
import { composeWallRoom, composeWallTile } from '../src/core/compositor';
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

const OPAQUE_TEMPLATE_IDS = [
  'office-wall',
  'cubicle-partition',
  'brick-wall',
  'panel-wall',
  'living-wall',
  'branded-wall',
  'slat-wall',
  'demising-wall',
] as const;

const TRANSLUCENT_WALL_IDS = ['wall-glass', 'wall-curtain'] as const;

const sourceDirectory = path.resolve(process.cwd(), 'assets/walls/bevel');
const generatedFile = path.resolve(process.cwd(), 'src/tiles/generated/importedWallBevelArt.ts');

function hash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function silhouette(shapes: readonly ShapeSpec[]): ShapeSpec[] {
  return shapes.filter((shape) => shape.silhouette !== false);
}

function coveragePixels(shapes: readonly ShapeSpec[]): Uint8Array {
  const markup = shapes.map((shape) => {
    const attributes = [`d="${shape.d}"`, `fill="${shape.fill === undefined ? 'none' : '#FFFFFF'}"`];
    if (shape.stroke !== undefined) {
      attributes.push('stroke="#FFFFFF"');
      attributes.push(`stroke-width="${shape.strokeWidth ?? 1.5}"`);
      attributes.push('stroke-linecap="round" stroke-linejoin="round"');
    }
    return `<path ${attributes.join(' ')}/>`;
  }).join('');
  return new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">${markup}</svg>`,
    { font: { loadSystemFonts: false } },
  ).render().pixels;
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

  it('builds every opaque contour from the same nested boundary geometry', () => {
    const silhouetteHashes = new Set<string>();
    for (const templateId of OPAQUE_TEMPLATE_IDS) {
      const template = WALL_TEMPLATES.find((candidate) => candidate.id === templateId);
      expect(template, templateId).toBeDefined();
      for (let raw = 0; raw < 256; raw++) {
        const config = configForIndex(blobIndex(raw));
        const [boundary, material, ...details] = template!.build(raw, {}, DEFAULT_WALLS[0].palette);
        const hasExposedEdge = !config.n || !config.e || !config.s || !config.w;
        expect(boundary.fill, `${templateId} raw ${raw} boundary`).toBe('#000000');
        expect(boundary.silhouette, `${templateId} raw ${raw} boundary`).not.toBe(false);
        expect(material.fill, `${templateId} raw ${raw} material`).toBe('$primary');
        expect(material.silhouette, `${templateId} raw ${raw} material`).toBe(false);
        expect(boundary.d === material.d, `${templateId} raw ${raw} nested geometry`)
          .toBe(!hasExposedEdge);
        expect(details.every((shape) => shape.silhouette === false), `${templateId} raw ${raw} details`)
          .toBe(true);
      }
      silhouetteHashes.add(hash(BLOB_CONFIGS.map((config) =>
        silhouette(template!.build(config, {}, DEFAULT_WALLS[0].palette)))));
    }
    expect([...silhouetteHashes]).toEqual([
      'd05869d6bcba18787b5c8050caa5f33d7d7e89e95740487a0c384ddd62450a44',
    ]);
  });

  it('keeps isolated procedural material detail inside the rounded material body', () => {
    const bevelCount = authoredWallBevel(0).length;
    for (const templateId of OPAQUE_TEMPLATE_IDS) {
      const template = WALL_TEMPLATES.find((candidate) => candidate.id === templateId)!;
      const shapes = template.build(0, {}, DEFAULT_WALLS[0].palette);
      const details = shapes.slice(2, shapes.length - bevelCount);
      if (details.length === 0) continue;
      const material = coveragePixels([shapes[1]]);
      const detail = coveragePixels(details);
      const offenders: Array<{ x: number; y: number; detail: number; material: number }> = [];
      for (let pixel = 0; pixel < 128 * 128; pixel++) {
        const alpha = pixel * 4 + 3;
        if (detail[alpha] > material[alpha] + 4) {
          offenders.push({
            x: pixel % 128,
            y: Math.floor(pixel / 128),
            detail: detail[alpha],
            material: material[alpha],
          });
        }
      }
      expect(offenders.slice(0, 8), `${templateId} detail leaves material: ${JSON.stringify(offenders.slice(0, 8))}`)
        .toEqual([]);
    }
  });

  it('keeps native connected-wall rasters opaque across horizontal and vertical tile seams', () => {
    for (const templateId of OPAQUE_TEMPLATE_IDS) {
      const wall = DEFAULT_WALLS.find((candidate) => candidate.templateId === templateId)!;
      for (const layout of [
        [[1, 1]],
        [[1], [1]],
      ]) {
        const rendered = new Resvg(composeWallRoom(wall, DEFAULT_STYLE, layout, 128)).render();
        const vertical = layout[0].length === 2;
        for (const offset of [20, 64, 108]) {
          const x = vertical ? 128 : offset;
          const y = vertical ? offset : 128;
          const alpha = rendered.pixels[(y * rendered.width + x) * 4 + 3];
          expect(alpha, `${templateId} ${vertical ? 'vertical' : 'horizontal'} seam at ${offset}`)
            .toBe(255);
        }
      }
    }
  });

  it('uses whole-sheet PNGs for the responsive browser proof', async () => {
    const html = await readFile(
      path.resolve(process.cwd(), 'docs/previews/wall-preview-opaque-walls.html'),
      'utf8',
    );
    const imageSources = [...html.matchAll(/<img src="([^"]+)"/g)].map((match) => match[1]);
    expect(imageSources).toEqual(OPAQUE_TEMPLATE_IDS.map((id) => `wall-preview-${id}.png`));
    expect(html).not.toMatch(/<img[^>]+\.svg/);
  });

  it('promotes the shared kit to every opaque wall while freezing translucent walls', () => {
    const authoredPaths = WALL_BEVEL_PIECE_IDS.flatMap((id) =>
      WALL_BEVEL_ART[id].map((shape) => shape.d));
    for (const templateId of OPAQUE_TEMPLATE_IDS) {
      const template = WALL_TEMPLATES.find((candidate) => candidate.id === templateId)!;
      const paths = new Set(BLOB_CONFIGS.flatMap((config) =>
        template.build(config, {}, DEFAULT_WALLS[0].palette).map((shape) => shape.d)));
      for (const path of authoredPaths) expect(paths.has(path), `${templateId}: ${path}`).toBe(true);
    }

    const untouched = DEFAULT_WALLS
      .filter((wall) => TRANSLUCENT_WALL_IDS.includes(wall.id as typeof TRANSLUCENT_WALL_IDS[number]))
      .map((wall) => ({
        id: wall.id,
        tiles: BLOB_CONFIGS.map((config) => composeWallTile(wall, DEFAULT_STYLE, config, 128)),
      }));
    expect(untouched.map((wall) => wall.id)).toEqual(TRANSLUCENT_WALL_IDS);
    expect(hash(untouched)).toBe('42e5042e03884890af5a741f74194f09ba1de369990f6949a9cd613d292e4bfb');
  });

  it('keeps glass and curtain on their procedural no-bevel paths', () => {
    const authoredPaths = new Set(
      WALL_BEVEL_PIECE_IDS.flatMap((id) => WALL_BEVEL_ART[id].map((shape) => shape.d)),
    );
    for (const id of ['glass-partition', 'curtain-wall']) {
      const template = WALL_TEMPLATES.find((candidate) => candidate.id === id)!;
      for (const raw of BLOB_CONFIGS) {
        expect(template.build(raw, {}, DEFAULT_WALLS[0].palette).some((shape) => authoredPaths.has(shape.d)), id)
          .toBe(false);
      }
    }
  });
});
