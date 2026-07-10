import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  compilePartDirectory,
  compilePartSvg,
  emitImportedPartArt,
} from '../scripts/parts/importer';
import { PART_IMPORT_TARGETS } from '../scripts/parts/catalog';
import type { Facing, PartDef } from '../src/core/types';
import { FACINGS } from '../src/core/types';
import { applyImportedPartArt } from '../src/parts/importedArt';
import { PART_LIBRARY } from '../src/parts/library';

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

function staticPart(id: string, slot: 'head' | 'hair' = 'hair'): PartDef {
  const variant = { z: slot === 'hair' ? 50 : 40, shapes: [{ d: 'M0 0L1 0 0 1Z', fill: '$hair' }] };
  return {
    id,
    label: id,
    slot,
    anchor: 'headCenter',
    facings: { south: variant, east: variant, north: variant },
  };
}

function svg(body: string, rootAttributes = ''): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" ${rootAttributes}>${body}</svg>`;
}

function validHairSvg(): string {
  return svg([
    '<g transform="translate(4 6)" style="fill: #00ffff">',
    '<path d="M 60 38 L 68 38 L 64 46 Z"/>',
    '</g>',
    '<g id="detail/seam" fill="none" stroke="#00000080" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
    '<path d="M 60 44 L 68 44"/>',
    '</g>',
    '<g id="guide/canvas"><path d="M 0 0 L 128 128" fill="none"/></g>',
  ].join(''));
}

async function sourceTree(files: Partial<Record<Facing, string>>): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'terrarium-part-import-'));
  roots.push(root);
  await mkdir(path.join(root, 'hair'), { recursive: true });
  await Promise.all(Object.entries(files).map(([facing, contents]) =>
    writeFile(path.join(root, 'hair', `bob.${facing}.svg`), contents, 'utf8')));
  return root;
}

async function singleSource(relativePath: string): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'terrarium-part-import-'));
  roots.push(root);
  const absolutePath = path.join(root, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, validHairSvg(), 'utf8');
  return root;
}

describe('strict part SVG compiler', () => {
  it.each([
    ['#FF00FF', '$skin'],
    ['#00FFFF', '$hair'],
    ['#FF0000', '$outfitPrimary'],
    ['#00FF00', '$outfitSecondary'],
    ['#0000FF', '$accent'],
  ])('maps sentinel %s to %s', (sentinel, token) => {
    expect(compilePartSvg(svg(
      `<path d="M60 40L68 40 64 48Z" fill="${sentinel}"/>`,
    ), { source: 'sentinel.svg', slot: 'hair' })).toEqual([
      { d: 'M-4-4L4-4 0 4Z', fill: token },
    ]);
  });

  it('maps sentinels, flattens transforms, preserves paint order, and marks detail', () => {
    expect(compilePartSvg(validHairSvg(), { source: 'bob.south.svg', slot: 'hair' })).toEqual([
      { d: 'M0 0L8 0 4 8Z', fill: '$hair' },
      {
        d: 'M-4 0L4 0',
        stroke: '#00000080',
        strokeWidth: 2,
        silhouette: false,
      },
    ]);
  });

  it('ignores faded scaffold reference and guide layers without importing their paint', () => {
    const source = svg([
      '<g id="reference/bob" style="opacity:0.25;display:none"><path d="M20 20L30 20 25 30Z" fill="#123456"/></g>',
      '<g id="guide/grid" style="visibility:hidden"><path d="M0 0L128 128" stroke="#123456"/></g>',
      '<path d="M60 40L68 40 64 48Z" fill="#00FFFF"/>',
    ].join(''));
    expect(compilePartSvg(source, { source: 'scaffold.svg', slot: 'hair' })).toEqual([
      { d: 'M-4-4L4-4 0 4Z', fill: '$hair' },
    ]);
  });

  it('bakes nested rotation and uniform scale into local geometry and stroke width', () => {
    const source = svg([
      '<g transform="translate(64 44) rotate(90)">',
      '<g transform="scale(2)" fill="none" stroke="#00FFFF" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">',
      '<path d="M 0 0 L 4 0"/>',
      '</g></g>',
    ].join(''));
    expect(compilePartSvg(source, { source: 'nested.svg', slot: 'hair' })).toEqual([
      { d: 'M0 0L0 8', stroke: '$hair', strokeWidth: 2 },
    ]);
  });

  it.each([
    ['gradient', '<linearGradient id="paint"/>'],
    ['filter', '<filter id="blur"/>'],
    ['mask', '<mask id="mask"/>'],
    ['clip path', '<clipPath id="clip"/>'],
    ['text', '<text x="1" y="1">x</text>'],
    ['image', '<image href="data:image/png;base64,AA=="/>'],
    ['use', '<use href="#shape"/>'],
    ['primitive', '<rect x="1" y="1" width="2" height="2"/>'],
  ])('rejects forbidden %s elements before optimization', (_label, element) => {
    expect(() => compilePartSvg(svg(element), { source: 'forbidden.svg', slot: 'hair' }))
      .toThrow(/forbidden|convert visible art to paths/);
  });

  it('rejects unsupported canvas, group opacity, and non-round stroke semantics', () => {
    expect(() => compilePartSvg(
      '<svg viewBox="0 0 64 64"><path d="M1 1L2 2" fill="#00FFFF"/></svg>',
      { source: 'canvas.svg', slot: 'hair' },
    )).toThrow(/viewBox must be exactly/);
    expect(() => compilePartSvg(
      svg('<g opacity="0.5"><path d="M60 40L68 40 64 48Z" fill="#00FFFF"/></g>'),
      { source: 'opacity.svg', slot: 'hair' },
    )).toThrow(/group\/root opacity/);
    expect(() => compilePartSvg(
      svg('<path d="M60 44L68 44" fill="none" stroke="#00FFFF" stroke-width="2"/>'),
      { source: 'stroke.svg', slot: 'hair' },
    )).toThrow(/explicitly use round/);
    expect(() => compilePartSvg(
      svg('<path opacity="0.0004" d="M60 40L68 40 64 48Z" fill="#00FFFF"/>'),
      { source: 'tiny-opacity.svg', slot: 'hair' },
    )).toThrow(/opacity rounds to zero/);
  });

  it('rejects tint-impure shapes and non-uniform stroked transforms', () => {
    expect(() => compilePartSvg(svg(
      '<path d="M60 40L68 40 64 48Z" fill="#00FFFF" stroke="#111111" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>',
    ), { source: 'tint.svg', slot: 'hair' })).toThrow(/mix a palette token with a literal/);
    expect(() => compilePartSvg(svg(
      '<path transform="scale(2 1)" d="M30 44L34 44" fill="none" stroke="#00FFFF" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>',
    ), { source: 'scale.svg', slot: 'hair' })).toThrow(/uniform scale/);
    expect(() => compilePartSvg(svg(
      '<path d="M60 40L68 40 64 48Z" fill="#00FFFF" stroke="#00FFFF" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>',
    ), { source: 'filled-stroke.svg', slot: 'hair' })).toThrow(/silhouette paths cannot combine/);
  });

  it('requires literal paint to be explicitly classified as non-silhouette detail', () => {
    expect(() => compilePartSvg(svg(
      '<path d="M60 40L68 40 64 48Z" fill="#123456"/>',
    ), { source: 'literal.svg', slot: 'hair' })).toThrow(/literal paint is allowed only/);
    expect(compilePartSvg(svg(
      '<g id="detail/highlight"><path d="M60 40L68 40 64 48Z" fill="#123456"/></g>',
    ), { source: 'literal-detail.svg', slot: 'hair' })).toEqual([
      { d: 'M-4-4L4-4 0 4Z', fill: '#123456', silhouette: false },
    ]);
  });

  it('rejects paint buckets that would be reordered by the character layer exporter', () => {
    const source = svg([
      '<path d="M50 40L56 40 53 46Z" fill="#00FFFF"/>',
      '<g id="detail/seam"><path d="M60 40L66 40 63 46Z" fill="#123456"/></g>',
      '<path d="M70 40L76 40 73 46Z" fill="#00FFFF"/>',
    ].join(''));
    expect(() => compilePartSvg(source, { source: 'runs.svg', slot: 'hair' }))
      .toThrow(/reappears non-contiguously/);
  });

  it('checks painted bounds including the full stroke radius', () => {
    expect(() => compilePartSvg(svg(
      '<path d="M1 20L10 20" fill="none" stroke="#00FFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
    ), { source: 'bounds.svg', slot: 'hair' })).toThrow(/leave the 128 canvas/);
    expect(() => compilePartSvg(svg(
      '<path d="M1 20L8 20 4 28Z" fill="#00FFFF"/>',
    ), { source: 'outline-bounds.svg', slot: 'hair' })).toThrow(/outline margin/);
  });

  it('rejects singular transforms and fill-only paths with no raster coverage', () => {
    expect(() => compilePartSvg(svg(
      '<path transform="scale(0)" d="M60 40L68 40 64 48Z" fill="#00FFFF"/>',
    ), { source: 'singular.svg', slot: 'hair' })).toThrow(/singular transform/);
    expect(() => compilePartSvg(svg(
      '<path d="M60 40L68 48" fill="#00FFFF"/>',
    ), { source: 'zero-area.svg', slot: 'hair' })).toThrow(/paints no pixels/);
  });
});

describe('part source tree and generated registration', () => {
  it.each([
    ['body source', 'body/compact.south.svg', /slot must be one of head, hair/],
    ['outfit source', 'outfit/tee.south.svg', /slot must be one of head, hair/],
    ['accessory source', 'accessory/mug.south.svg', /slot must be one of head, hair/],
    ['west source', 'hair/bob.west.svg', /west is runtime-mirrored/],
  ])('rejects unsupported v1 %s', async (_label, relativePath, message) => {
    const root = await singleSource(relativePath);
    await expect(compilePartDirectory({
      inputDir: root,
      sourcePathPrefix: 'assets/parts',
      catalog: PART_IMPORT_TARGETS,
    })).rejects.toThrow(message);
  });

  it('requires a complete facing set and emits stable repository-relative provenance', async () => {
    const root = await sourceTree({ south: validHairSvg(), east: validHairSvg(), north: validHairSvg() });
    const imports = await compilePartDirectory({
      inputDir: root,
      sourcePathPrefix: 'assets/parts',
      catalog: [staticPart('hair-bob')],
    });
    const reorderedRoot = await sourceTree({
      north: validHairSvg(),
      south: validHairSvg(),
      east: validHairSvg(),
    });
    const reorderedImports = await compilePartDirectory({
      inputDir: reorderedRoot,
      sourcePathPrefix: 'assets/parts',
      catalog: [staticPart('hair-bob')],
    });
    expect(imports).toHaveLength(1);
    expect(imports[0].sourceFiles).toEqual([
      'assets/parts/hair/bob.east.svg',
      'assets/parts/hair/bob.north.svg',
      'assets/parts/hair/bob.south.svg',
    ]);
    expect(Object.keys(imports[0].facings)).toEqual(FACINGS);
    expect(emitImportedPartArt(imports)).toBe(emitImportedPartArt(reorderedImports));
    expect(emitImportedPartArt(imports)).not.toContain(root);
    expect(emitImportedPartArt(imports)).toContain('sourceKind: "authored"');
  });

  it('rejects partial source sets, unknown targets, and body-aware targets', async () => {
    const root = await sourceTree({ south: validHairSvg() });
    await expect(compilePartDirectory({
      inputDir: root,
      sourcePathPrefix: 'assets/parts',
      catalog: [staticPart('hair-bob')],
    })).rejects.toThrow(/complete facing set/);
    await expect(compilePartDirectory({
      inputDir: root,
      sourcePathPrefix: 'assets/parts',
      catalog: [],
    })).rejects.toThrow(/only replaces an existing selectable production part/);

    const rigged = staticPart('hair-bob');
    rigged.buildVariant = () => rigged.facings.south;
    await expect(compilePartDirectory({
      inputDir: root,
      sourcePathPrefix: 'assets/parts',
      catalog: [rigged],
    })).rejects.toThrow(/buildVariant/);
  });

  it('rejects facing sets whose paint order conflicts across views', async () => {
    const tokenThenLiteral = svg([
      '<path d="M50 40L56 40 53 46Z" fill="#00FFFF"/>',
      '<g id="detail/seam"><path d="M60 40L66 40 63 46Z" fill="#123456"/></g>',
    ].join(''));
    const literalThenToken = svg([
      '<g id="detail/seam"><path d="M60 40L66 40 63 46Z" fill="#123456"/></g>',
      '<path d="M50 40L56 40 53 46Z" fill="#00FFFF"/>',
    ].join(''));
    const root = await sourceTree({
      south: tokenThenLiteral,
      east: literalThenToken,
      north: tokenThenLiteral,
    });
    await expect(compilePartDirectory({
      inputDir: root,
      sourcePathPrefix: 'assets/parts',
      catalog: [staticPart('hair-bob')],
    })).rejects.toThrow(/paint order.*conflicts/);
  });

  it('keeps the committed generated module current with the authored source tree', async () => {
    const imports = await compilePartDirectory({
      inputDir: path.resolve('assets/parts'),
      sourcePathPrefix: 'assets/parts',
      catalog: PART_IMPORT_TARGETS,
    });
    const generated = await readFile(
      path.resolve('src/parts/generated/importedPartArt.ts'),
      'utf8',
    );
    expect(generated).toBe(emitImportedPartArt(imports));
  });
});

describe('imported art overlay', () => {
  it('replaces geometry in place while preserving production metadata and order', () => {
    const head = staticPart('head-round', 'head');
    const hair = staticPart('hair-bob');
    const result = applyImportedPartArt([head, hair], [{
      id: 'hair-bob',
      slot: 'hair',
      sourceKind: 'authored',
      sourceFiles: ['assets/parts/hair/bob.south.svg'],
      facings: { south: [{ d: 'M0 0L2 0 0 2Z', fill: '$hair' }] },
    }]);

    expect(result.map((part) => part.id)).toEqual(['head-round', 'hair-bob']);
    expect(result[0]).toBe(head);
    expect(result[1]).not.toBe(hair);
    expect(result[1].label).toBe(hair.label);
    expect(result[1].anchor).toBe(hair.anchor);
    expect(result[1].facings.south?.z).toBe(50);
    expect(result[1].facings.south?.shapes).toEqual([{ d: 'M0 0L2 0 0 2Z', fill: '$hair' }]);
    expect(hair.facings.south?.shapes).not.toEqual(result[1].facings.south?.shapes);
  });

  it('rejects duplicate, unknown, mismatched, and dynamic overlays', () => {
    const hair = staticPart('hair-bob');
    const importArt = {
      id: 'hair-bob',
      slot: 'hair' as const,
      sourceKind: 'authored' as const,
      sourceFiles: [],
      facings: { south: [{ d: 'M0 0L1 1', stroke: '#000000' }] },
    };
    expect(() => applyImportedPartArt([hair], [importArt, importArt])).toThrow(/duplicate imported id/);
    expect(() => applyImportedPartArt([hair], [{ ...importArt, id: 'hair-missing' }])).toThrow(/unknown production part/);
    expect(() => applyImportedPartArt([hair], [{ ...importArt, slot: 'head' }])).toThrow(/declares slot/);
    hair.buildVariant = () => hair.facings.south;
    expect(() => applyImportedPartArt([hair], [importArt])).toThrow(/buildVariant/);
  });

  it('leaves the production library unique while the generated overlay is empty', () => {
    const ids = PART_LIBRARY.map((part) => part.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps the explicit import target catalog aligned with production heads and hair', () => {
    const productionTargets = PART_LIBRARY
      .filter((part) => (part.slot === 'head' || part.slot === 'hair') && part.id !== 'hair-none');
    expect(PART_IMPORT_TARGETS.map((part) => part.id)).toEqual(productionTargets.map((part) => part.id));
    for (const target of PART_IMPORT_TARGETS) {
      const production = productionTargets.find((part) => part.id === target.id)!;
      expect(target.slot, target.id).toBe(production.slot);
      expect(target.anchor, target.id).toBe(production.anchor);
      expect(FACINGS.filter((facing) => target.facings[facing] !== undefined), target.id)
        .toEqual(FACINGS.filter((facing) => production.facings[facing] !== undefined));
      expect(production.buildVariant, target.id).toBeUndefined();
    }
  });
});
