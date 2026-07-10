import { createHash } from 'node:crypto';
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
import { BODY_ARCHETYPES } from '../src/parts/bodyArchetypes';
import type {
  ImportedBodyArtOverlay,
  ImportedPartArt,
  ImportedPartProvenance,
  ImportedStaticPartOverlay,
} from '../src/parts/importedArt';
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

type ImportedStaticPartArt = ImportedStaticPartOverlay & ImportedPartProvenance;
type ImportedBodyPartArt = ImportedBodyArtOverlay & ImportedPartProvenance;

function staticImport(imported: ImportedPartArt): ImportedStaticPartArt {
  if (imported.kind === 'body-detail' || imported.kind === 'body-art') {
    throw new Error(`Expected static import, received ${imported.id}`);
  }
  return imported;
}

function bodyImport(imported: ImportedPartArt): ImportedBodyPartArt {
  if (imported.kind !== 'body-art') {
    throw new Error(`Expected body-art import, received ${imported.id}`);
  }
  return imported;
}

function riggedBodyPart(id = 'body-balanced'): PartDef {
  const anchors = BODY_ARCHETYPES.find((archetype) => archetype.id === id)?.anchors
    ?? BODY_ARCHETYPES[0].anchors;
  const variant = (offset: number) => ({
    z: 10,
    shapes: [
      { d: `M${offset}-4L${offset + 4}-4 ${offset} 4Z`, fill: '$outfitPrimary' },
      { d: `M${offset - 2} 2L${offset + 2} 2 ${offset} 3Z`, fill: '#00000012', silhouette: false },
    ],
  });
  return {
    id,
    label: 'Balanced fixture',
    slot: 'body',
    anchor: 'body',
    facings: { south: variant(0), east: variant(1), north: variant(2) },
    bodyAnchors: anchors,
  };
}

function dynamicOutfit(id = 'outfit-tee'): PartDef {
  const legacy = { z: 20, shapes: [{ d: 'M-8-29Q0-22 8-29Z', fill: '$skin', silhouette: false }] };
  return {
    id,
    label: 'Crew tee',
    slot: 'outfit',
    anchor: 'body',
    facings: { south: legacy, east: legacy, north: { z: 20, shapes: [] } },
    buildVariant: (facing, context) => context.bodyAnchors && ({
      z: 20,
      shapes: [{
        d: `M${context.bodyAnchors.neck.x} ${context.bodyAnchors.neck.y}L${context.bodyAnchors.neck.x + facing.length} ${context.bodyAnchors.neck.y + 1}`,
        stroke: '#111111',
        silhouette: false,
      }],
    }),
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

function validOutfitDetailSvg(): string {
  return svg([
    '<g id="detail/neckline" fill="#FF00FF">',
    '<path d="M56 58Q64 65 72 58Z"/>',
    '</g>',
  ].join(''));
}

function validBodySvg(includeSilhouette = true): string {
  return svg([
    '<g id="art" transform="translate(64 87)">',
    includeSilhouette
      ? '<path id="art/silhouette" d="M-8-8L8-8 10 10-10 10Z" fill="#FF0000" fill-rule="nonzero"/>'
      : '',
    '<path id="detail/lower-plane" d="M-5 7L5 7 4 9-4 9Z" fill="#00000012" fill-rule="nonzero"/>',
    '</g>',
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

async function outfitSourceTree(files: Partial<Record<Facing, string>>): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'terrarium-outfit-import-'));
  roots.push(root);
  await mkdir(path.join(root, 'outfit'), { recursive: true });
  await Promise.all(Object.entries(files).map(([facing, contents]) =>
    writeFile(path.join(root, 'outfit', `tee.${facing}.svg`), contents, 'utf8')));
  return root;
}

async function bodySourceTree(
  files: Partial<Record<Facing, string>>,
  slug = 'balanced',
): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'terrarium-body-import-'));
  roots.push(root);
  await mkdir(path.join(root, 'body'), { recursive: true });
  await Promise.all(Object.entries(files).map(([facing, contents]) =>
    writeFile(path.join(root, 'body', `${slug}.${facing}.svg`), contents, 'utf8')));
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

  it('allows inherited evenodd only when each filled art path overrides to nonzero', () => {
    const path = '<path fill-rule="nonzero" d="M60 40L68 40 64 48Z" fill="#00FFFF"/>';
    expect(compilePartSvg(svg(path, 'fill-rule="evenodd"'), {
      source: 'explicit-winding.svg',
      slot: 'hair',
    })).toEqual([{ d: 'M-4-4L4-4 0 4Z', fill: '$hair' }]);
    expect(() => compilePartSvg(svg(
      '<path d="M60 40L68 40 64 48Z" fill="#00FFFF"/>',
      'fill-rule="evenodd"',
    ), { source: 'inherited-evenodd.svg', slot: 'hair' }))
      .toThrow(/filled path must resolve the nonzero fill rule/);
    expect(() => compilePartSvg(svg(path, 'fill-rule="banana"'), {
      source: 'invalid-fill-rule.svg',
      slot: 'hair',
    })).toThrow(/fill-rule declarations must be nonzero or evenodd/);
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
    ['accessory source', 'accessory/mug.south.svg', /slot must be one of body, head, hair, outfit/],
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
    const imported = staticImport(imports[0]);
    expect(imported.sourceFiles).toEqual([
      'assets/parts/hair/bob.east.svg',
      'assets/parts/hair/bob.north.svg',
      'assets/parts/hair/bob.south.svg',
    ]);
    expect(Object.keys(imported.facings)).toEqual(FACINGS);
    expect(emitImportedPartArt(imports)).toBe(emitImportedPartArt(reorderedImports));
    expect(emitImportedPartArt(imports)).not.toContain(root);
    expect(emitImportedPartArt(imports)).toContain('IMPORTED_PART_PROVENANCE');
    expect(emitImportedPartArt(imports)).toContain('sourceKind: "authored"');
  });

  it('requires valid rigged body targets and a silhouette in every facing', async () => {
    const complete = await bodySourceTree({
      south: validBodySvg(),
      east: validBodySvg(),
      north: validBodySvg(),
    });
    const target = PART_IMPORT_TARGETS.find(({ id }) => id === 'body-balanced')!;

    await expect(compilePartDirectory({
      inputDir: complete,
      sourcePathPrefix: 'assets/parts',
      catalog: [{ ...target, bodyAnchors: undefined }],
    })).rejects.toThrow(/body-art targets must be body-anchored rigged static parts/);

    const detailOnly = await bodySourceTree({
      south: validBodySvg(false),
      east: validBodySvg(false),
      north: validBodySvg(false),
    });
    await expect(compilePartDirectory({
      inputDir: detailOnly,
      sourcePathPrefix: 'assets/parts',
      catalog: [target],
    })).rejects.toThrow(/body-art south must contain silhouette geometry/);

    const transformed = await bodySourceTree({
      south: validBodySvg().replace('translate(64 87)', 'translate(64 87) scale(1.000000001)'),
      east: validBodySvg(),
      north: validBodySvg(),
    });
    await expect(compilePartDirectory({
      inputDir: transformed,
      sourcePathPrefix: 'assets/parts',
      catalog: [target],
    })).rejects.toThrow(/must keep paths directly under the canonical translate\(64 87\) group/);

    const legacy = await bodySourceTree({
      south: validBodySvg(),
      east: validBodySvg(),
      north: validBodySvg(),
    }, 'standard');
    await expect(compilePartDirectory({
      inputDir: legacy,
      sourcePathPrefix: 'assets/parts',
      catalog: PART_IMPORT_TARGETS,
    })).rejects.toThrow(/only replaces an existing selectable production part/);
  });

  it('preserves the byte-stable static overlay module shape', () => {
    const imported: ImportedPartArt = {
      id: 'hair-bob',
      slot: 'hair',
      facings: {
        south: [{ d: 'M0 0L2 0 0 2Z', fill: '$hair' }],
      },
      sourceKind: 'authored',
      sourceFiles: ['assets/parts/hair/bob.south.svg'],
    };
    expect(emitImportedPartArt([imported])).toBe([
      "import type { ImportedPartOverlay, ImportedPartProvenance } from '../importedArt';",
      '',
      '// Generated by `npm run parts:import`. Do not edit by hand.',
      'export const IMPORTED_PART_ART = [',
      '  {',
      '    id: "hair-bob",',
      '    slot: "hair",',
      '    facings: {',
      '      south: [',
      '        { d: "M0 0L2 0 0 2Z", fill: "$hair" },',
      '      ],',
      '    },',
      '  },',
      '] as const satisfies readonly ImportedPartOverlay[];',
      '',
      '// Build-time audit data; the browser imports only IMPORTED_PART_ART.',
      'export const IMPORTED_PART_PROVENANCE = [',
      '  {',
      '    id: "hair-bob",',
      '    sourceKind: "authored",',
      '    sourceFiles: [',
      '      "assets/parts/hair/bob.south.svg",',
      '    ],',
      '  },',
      '] as const satisfies readonly ImportedPartProvenance[];',
      '',
    ].join('\n'));
  });

  it('expands anchored detail art and emits production bodies in stable archetype order', async () => {
    const root = await outfitSourceTree({
      south: validOutfitDetailSvg(),
      east: validOutfitDetailSvg(),
    });
    const target = PART_IMPORT_TARGETS.find(({ id }) => id === 'outfit-tee')!;
    const imports = await compilePartDirectory({
      inputDir: root,
      sourcePathPrefix: 'assets/parts',
      catalog: [target],
    });
    expect(imports).toHaveLength(1);
    const imported = imports[0];
    if (imported.kind !== 'body-detail') throw new Error('Expected body-detail import');

    const productionIds = BODY_ARCHETYPES.map(({ id }) => id);
    expect(Object.keys(imported.bodyVariants)).toEqual(productionIds);
    for (const id of productionIds) {
      expect(Object.keys(imported.bodyVariants[id])).toEqual(['south', 'east']);
    }
    expect(imported.bodyVariants['body-balanced'].south?.[0].d).toBe('M-8-29Q0-22 8-29Z');
    expect(imported.bodyVariants['body-compact'].south?.[0].d).toBe('M-8-24Q0-17 8-24Z');
    expect(imported.bodyVariants['body-tall'].south?.[0].d).toBe('M-8-34Q0-27 8-34Z');

    const reversed: ImportedPartArt = {
      ...imported,
      bodyVariants: Object.fromEntries(
        [...productionIds].reverse().map((id) => [id, imported.bodyVariants[id]]),
      ),
    };
    const emitted = emitImportedPartArt([reversed]);
    expect(emitted).toContain('    kind: "body-detail",');
    expect(emitted).toContain('    bodyVariants: {');
    const bodyOffsets = productionIds.map((id) => emitted.indexOf(`      "${id}": {`));
    expect(bodyOffsets.every((offset) => offset >= 0)).toBe(true);
    expect(bodyOffsets).toEqual([...bodyOffsets].sort((left, right) => left - right));
  });

  it('rejects anchored variants that leave the canvas after body placement', async () => {
    const lowDetail = svg([
      '<g id="detail/neckline" fill="#FF00FF">',
      '<path d="M60 124L68 124 64 127Z"/>',
      '</g>',
    ].join(''));
    const root = await outfitSourceTree({ south: lowDetail, east: lowDetail });
    const tee = PART_IMPORT_TARGETS.find(({ id }) => id === 'outfit-tee')!;

    await expect(compilePartDirectory({
      inputDir: root,
      sourcePathPrefix: 'assets/parts',
      catalog: [{ ...tee, referenceBodyId: 'body-tall' }],
    })).rejects.toThrow(/body-compact\/south.*(?:leave the 128 canvas|paints no pixels)/);
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

  it('keeps five bodies, the bob, six human heads, and tee as thirteen deliberate authored overlays', async () => {
    const imports = await compilePartDirectory({
      inputDir: path.resolve('assets/parts'),
      sourcePathPrefix: 'assets/parts',
      catalog: PART_IMPORT_TARGETS,
    });
    expect(imports).toHaveLength(13);
    expect(imports.map(({ id }) => id)).toEqual([
      'body-balanced',
      'body-compact',
      'body-large-frame',
      'body-soft',
      'body-tall',
      'hair-bob',
      'head-angular',
      'head-boxy',
      'head-long',
      'head-oval',
      'head-round',
      'head-soft-square',
      'outfit-tee',
    ]);

    const bodyTargets = PART_IMPORT_TARGETS.filter(({ importMode }) => importMode === 'body-art');
    expect(bodyTargets.map(({ id }) => id)).toEqual(BODY_ARCHETYPES.map(({ id }) => id));
    const exactBodyPaths: string[] = [];
    for (const archetype of BODY_ARCHETYPES) {
      const body = bodyImport(imports.find(({ id }) => id === archetype.id)!);
      const slug = archetype.id.slice('body-'.length);
      expect(body).toMatchObject({
        kind: 'body-art',
        id: archetype.id,
        slot: 'body',
        sourceKind: 'authored',
        sourceFiles: [
          `assets/parts/body/${slug}.east.svg`,
          `assets/parts/body/${slug}.north.svg`,
          `assets/parts/body/${slug}.south.svg`,
        ],
      });
      for (const facing of ['south', 'east'] as const) {
        expect(body.facings[facing], `${archetype.id}/${facing}`).toHaveLength(2);
        expect(body.facings[facing]?.[0]).toMatchObject({ fill: '$outfitPrimary' });
        expect(body.facings[facing]?.[0].silhouette).not.toBe(false);
        expect(body.facings[facing]?.[1]).toMatchObject({
          fill: '#00000012',
          silhouette: false,
        });
      }
      expect(body.facings.north, `${archetype.id}/north`).toHaveLength(1);
      expect(body.facings.north?.[0]).toMatchObject({ fill: '$outfitPrimary' });
      expect(body.facings.north?.[0].silhouette).not.toBe(false);

      // Body-art mode preserves canonical local path bytes, including the
      // lower-plane arcs, so source intake cannot churn otherwise identical
      // compositor snapshots or preview SVGs.
      for (const facing of FACINGS) {
        expect(body.facings[facing], `${archetype.id}/${facing} runtime parity`)
          .toEqual(archetype.part.facings[facing]?.shapes);
        for (const shape of body.facings[facing] ?? []) {
          exactBodyPaths.push(`${archetype.id}/${facing}/${shape.d}`);
        }
      }
    }
    expect(createHash('sha256').update(exactBodyPaths.join('\n')).digest('hex'))
      .toBe('0e0eb093d932859e514f37a259f14235881502d2a4a0477138ec505df5697519');

    expect(imports.filter(({ kind }) => kind !== 'body-detail' && kind !== 'body-art').map(({ id }) => id))
      .toEqual([
        'hair-bob',
        'head-angular',
        'head-boxy',
        'head-long',
        'head-oval',
        'head-round',
        'head-soft-square',
      ]);
    const bob = staticImport(imports.find(({ id }) => id === 'hair-bob')!);
    expect(bob).toMatchObject({
      id: 'hair-bob',
      slot: 'hair',
      sourceKind: 'authored',
    });
    for (const facing of FACINGS) {
      expect(bob.facings[facing]).toHaveLength(2);
      expect(bob.facings[facing]?.[0]).toMatchObject({ fill: '$hair' });
      expect(bob.facings[facing]?.[1]).toMatchObject({
        stroke: '#00000024',
        strokeWidth: 1.6,
        silhouette: false,
      });
    }

    for (const slug of ['round', 'oval', 'boxy', 'long', 'angular', 'soft-square']) {
      const id = `head-${slug}`;
      const head = staticImport(imports.find((candidate) => candidate.id === id)!);
      expect(head).toMatchObject({
        id,
        slot: 'head',
        sourceKind: 'authored',
        sourceFiles: [
          `assets/parts/head/${slug}.east.svg`,
          `assets/parts/head/${slug}.north.svg`,
          `assets/parts/head/${slug}.south.svg`,
        ],
      });
      expect(head.facings.south, `${id}/south`).toHaveLength(3);
      expect(head.facings.east, `${id}/east`).toHaveLength(2);
      expect(head.facings.north, `${id}/north`).toHaveLength(1);
      for (const facing of FACINGS) {
        expect(head.facings[facing]?.[0], `${id}/${facing} silhouette`).toMatchObject({ fill: '$skin' });
        for (const eye of head.facings[facing]?.slice(1) ?? []) {
          expect(eye, `${id}/${facing} eye`).toMatchObject({
            fill: '#2C2C2A',
            silhouette: false,
          });
        }
      }
    }

    const tee = imports.find(({ id }) => id === 'outfit-tee')!;
    if (tee.kind !== 'body-detail') throw new Error('Expected body-detail tee import');
    expect(tee).toMatchObject({
      id: 'outfit-tee',
      slot: 'outfit',
      sourceKind: 'authored',
      sourceFiles: [
        'assets/parts/outfit/tee.east.svg',
        'assets/parts/outfit/tee.south.svg',
      ],
    });
    expect(Object.keys(tee.bodyVariants)).toEqual(BODY_ARCHETYPES.map(({ id }) => id));
    for (const archetype of BODY_ARCHETYPES) {
      for (const facing of ['south', 'east'] as const) {
        expect(tee.bodyVariants[archetype.id][facing]).toMatchObject([
          { fill: '$outfitSecondary', silhouette: false },
          { fill: '$skin', silhouette: false },
        ]);
      }
      expect(tee.bodyVariants[archetype.id].north).toBeUndefined();
    }
  });
});

describe('imported art overlay', () => {
  it('keeps static head/hair replacement cloning semantics and production order', () => {
    const head = staticPart('head-round', 'head');
    const hair = staticPart('hair-bob');
    const result = applyImportedPartArt([head, hair], [
      {
        id: 'head-round',
        slot: 'head',
        facings: { south: [{ d: 'M0 0L3 0 0 3Z', fill: '$skin' }] },
      },
      {
        id: 'hair-bob',
        slot: 'hair',
        facings: { south: [{ d: 'M0 0L2 0 0 2Z', fill: '$hair' }] },
      },
    ]);

    expect(result.map((part) => part.id)).toEqual(['head-round', 'hair-bob']);
    expect(result[0]).not.toBe(head);
    expect(result[1]).not.toBe(hair);
    expect(result[0].label).toBe(head.label);
    expect(result[0].anchor).toBe(head.anchor);
    expect(result[0].facings.south?.z).toBe(40);
    expect(result[0].facings.south?.shapes).toEqual([{ d: 'M0 0L3 0 0 3Z', fill: '$skin' }]);
    expect(result[1].label).toBe(hair.label);
    expect(result[1].anchor).toBe(hair.anchor);
    expect(result[1].facings.south?.z).toBe(50);
    expect(result[1].facings.south?.shapes).toEqual([{ d: 'M0 0L2 0 0 2Z', fill: '$hair' }]);
    expect(head.facings.south?.shapes).not.toEqual(result[0].facings.south?.shapes);
    expect(hair.facings.south?.shapes).not.toEqual(result[1].facings.south?.shapes);
  });

  it('installs complete body art in place while preserving shared rig identity, z-order, and metadata', () => {
    const head = staticPart('head-round', 'head');
    const body = riggedBodyPart();
    const hair = staticPart('hair-bob');
    const originalAnchors = body.bodyAnchors;
    const originalFacings = body.facings;
    const importedShapes = {
      south: [
        { d: 'M-9-9L9-9 11 11-11 11Z', fill: '$outfitPrimary' },
        { d: 'M-5 7A5 2 0 1 0 5 7A5 2 0 1 0-5 7Z', fill: '#00000012', silhouette: false },
      ],
      east: [
        { d: 'M-7-9L8-9 9 11-8 11Z', fill: '$outfitPrimary' },
        { d: 'M-4 7A4 2 0 1 0 4 7A4 2 0 1 0-4 7Z', fill: '#00000012', silhouette: false },
      ],
      north: [{ d: 'M-9-9L9-9 11 11-11 11Z', fill: '$outfitPrimary' }],
    } as const;

    const result = applyImportedPartArt([head, body, hair], [{
      kind: 'body-art',
      id: body.id,
      slot: 'body',
      facings: importedShapes,
    }]);

    expect(result.map(({ id }) => id)).toEqual([head.id, body.id, hair.id]);
    expect(result[0]).toBe(head);
    expect(result[1]).toBe(body);
    expect(result[2]).toBe(hair);
    expect(result[1].label).toBe('Balanced fixture');
    expect(result[1].anchor).toBe('body');
    expect(result[1].bodyAnchors).toBe(originalAnchors);
    expect(result[1].facings).not.toBe(originalFacings);

    for (const facing of FACINGS) {
      const variant = result[1].facings[facing]!;
      expect(variant.z, facing).toBe(10);
      expect(variant.shapes, facing).toEqual(importedShapes[facing]);
      expect(variant.shapes, facing).not.toBe(importedShapes[facing]);
      for (const [index, shape] of variant.shapes.entries()) {
        expect(shape, `${facing}/${index}`).not.toBe(importedShapes[facing][index]);
      }
    }
  });

  it('rejects invalid, incomplete, detail-only, and implicit-static body overlays', () => {
    const complete = {
      south: [{ d: 'M-8-8L8-8 8 8-8 8Z', fill: '$outfitPrimary' }],
      east: [{ d: 'M-7-8L7-8 7 8-7 8Z', fill: '$outfitPrimary' }],
      north: [{ d: 'M-8-8L8-8 8 8-8 8Z', fill: '$outfitPrimary' }],
    } as const;

    const missingRig = riggedBodyPart();
    delete missingRig.bodyAnchors;
    expect(() => applyImportedPartArt([missingRig], [{
      kind: 'body-art',
      id: missingRig.id,
      slot: 'body',
      facings: complete,
    }])).toThrow(/require a body-owned rig/);

    const partial = riggedBodyPart();
    expect(() => applyImportedPartArt([partial], [{
      kind: 'body-art',
      id: partial.id,
      slot: 'body',
      facings: { south: complete.south, east: complete.east },
    }])).toThrow(/north is missing body art/);

    const detailOnly = riggedBodyPart();
    expect(() => applyImportedPartArt([detailOnly], [{
      kind: 'body-art',
      id: detailOnly.id,
      slot: 'body',
      facings: {
        south: [{ ...complete.south[0], silhouette: false }],
        east: [{ ...complete.east[0], silhouette: false }],
        north: [{ ...complete.north[0], silhouette: false }],
      },
    }])).toThrow(/contains no silhouette geometry/);

    const implicitStatic = riggedBodyPart();
    expect(() => applyImportedPartArt([implicitStatic], [{
      id: implicitStatic.id,
      slot: 'body',
      facings: complete,
    }])).toThrow(/require an explicit body-art overlay/);
  });

  it('replaces known body-detail variants while preserving legacy and unknown-body fallbacks', () => {
    const outfit = dynamicOutfit();
    const importedShape = { d: 'M-9-29Q0-20 9-29Z', fill: '$skin', silhouette: false } as const;
    const [result] = applyImportedPartArt([outfit], [{
      kind: 'body-detail',
      id: outfit.id,
      slot: 'outfit',
      bodyVariants: {
        'body-balanced': { south: [importedShape] },
      },
    }]);

    expect(result).not.toBe(outfit);
    expect(result.label).toBe(outfit.label);
    expect(result.anchor).toBe(outfit.anchor);
    expect(result.facings).toBe(outfit.facings);

    const anchors = BODY_ARCHETYPES.find(({ id }) => id === 'body-balanced')!.anchors.south;
    const known = result.buildVariant?.('south', {
      bodyAnchors: anchors,
      bodyId: 'body-balanced',
    });
    expect(known).toEqual({ z: 20, shapes: [importedShape] });
    expect(known?.shapes).not.toBe(result.facings.south?.shapes);
    expect(known?.shapes[0]).not.toBe(importedShape);

    const unknown = result.buildVariant?.('south', {
      bodyAnchors: anchors,
      bodyId: 'body-future',
    });
    expect(unknown).toEqual(outfit.buildVariant?.('south', {
      bodyAnchors: anchors,
      bodyId: 'body-future',
    }));

    expect(result.buildVariant?.('south', {})).toBeUndefined();
    expect(result.facings.south).toBe(outfit.facings.south);
  });

  it('rejects body-detail overlays that could replace the conforming torso silhouette', () => {
    const outfit = dynamicOutfit();
    expect(() => applyImportedPartArt([outfit], [{
      kind: 'body-detail',
      id: outfit.id,
      slot: 'outfit',
      bodyVariants: {
        'body-balanced': {
          south: [{ d: 'M-9-29Q0-20 9-29Z', fill: '$outfitSecondary' }],
        },
      },
    }])).toThrow(/contains non-detail geometry/);
  });

  it('rejects duplicate, unknown, mismatched, and dynamic overlays', () => {
    const hair = staticPart('hair-bob');
    const importArt = {
      id: 'hair-bob',
      slot: 'hair' as const,
      facings: { south: [{ d: 'M0 0L1 1', stroke: '#000000' }] },
    };
    expect(() => applyImportedPartArt([hair], [importArt, importArt])).toThrow(/duplicate imported id/);
    expect(() => applyImportedPartArt([hair], [{ ...importArt, id: 'hair-missing' }])).toThrow(/unknown production part/);
    expect(() => applyImportedPartArt([hair], [{ ...importArt, slot: 'head' }])).toThrow(/declares slot/);
    hair.buildVariant = () => hair.facings.south;
    expect(() => applyImportedPartArt([hair], [importArt])).toThrow(/buildVariant/);
  });

  it('leaves the production library unique after applying generated overlays', () => {
    const ids = PART_LIBRARY.map((part) => part.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps the explicit import target catalog aligned with production heads and hair', () => {
    const productionTargets = PART_LIBRARY
      .filter((part) => (part.slot === 'head' || part.slot === 'hair') && part.id !== 'hair-none');
    const staticTargets = PART_IMPORT_TARGETS.filter((part) => (part.importMode ?? 'static') === 'static');
    expect(staticTargets.map((part) => part.id)).toEqual(productionTargets.map((part) => part.id));
    for (const target of staticTargets) {
      const production = productionTargets.find((part) => part.id === target.id)!;
      expect(target.slot, target.id).toBe(production.slot);
      expect(target.anchor, target.id).toBe(production.anchor);
      expect(FACINGS.filter((facing) => target.facings[facing] !== undefined), target.id)
        .toEqual(FACINGS.filter((facing) => production.facings[facing] !== undefined));
      expect(production.buildVariant, target.id).toBeUndefined();
    }

    const bodyTargets = PART_IMPORT_TARGETS.filter(({ importMode }) => importMode === 'body-art');
    expect(bodyTargets.map(({ id }) => id)).toEqual(BODY_ARCHETYPES.map(({ id }) => id));
    for (const [index, target] of bodyTargets.entries()) {
      const archetype = BODY_ARCHETYPES[index];
      expect(target).toMatchObject({
        id: archetype.id,
        slot: 'body',
        anchor: 'body',
        facings: { south: true, east: true, north: true },
        bodyAnchors: true,
        importMode: 'body-art',
      });
      expect(archetype.part.bodyAnchors).toBe(archetype.anchors);
    }

    const bodyDetailTarget = PART_IMPORT_TARGETS.find(({ importMode }) => importMode === 'anchored-detail')!;
    const productionOutfit = PART_LIBRARY.find(({ id }) => id === bodyDetailTarget.id)!;
    expect(bodyDetailTarget).toMatchObject({
      id: 'outfit-tee',
      slot: productionOutfit.slot,
      anchor: productionOutfit.anchor,
      facings: { south: true, east: true },
      buildVariant: true,
      referenceBodyId: 'body-balanced',
      placementAnchor: 'neck',
    });
    expect(productionOutfit.buildVariant).toBeTypeOf('function');
  });
});
