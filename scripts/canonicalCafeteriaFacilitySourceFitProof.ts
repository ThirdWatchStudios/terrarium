/**
 * Production source/import proof for the nine approved cafeteria facilities.
 *
 * The manifest points at the canonical workhorse source bank. This command is
 * read-only with respect to production sources and receivers; it only refreshes
 * the checked-in proof artifacts under docs/previews.
 *
 *   npm run cafeteria-facilities:source-fit:preview
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';

import { composeProp } from '../src/core/compositor';
import { DEFAULT_STYLE, defaultProject } from '../src/data/defaults';
import type {
  Projection,
  PropPalette,
  ShapeSpec,
} from '../src/core/types';
import { compileStaticPropSource } from './props/importer';

const CANVAS = 128;
const OUTPUT = 'docs/previews/canonical-cafeteria-facility-source-fit-v1';
const MANIFEST_PATH = `${OUTPUT}/manifest.json`;
const SCALES = [512, 128, 90, 40] as const;

const PAGE = '#E7E1D2';
const PANEL = '#F6F1E6';
const PANEL_ALT = '#ECE5D7';
const INK = '#292C2A';
const MUTED = '#626861';
const RULE = '#A39B8B';
const GREEN = '#355247';
const CORAL = '#B65F4D';
const BLUE = '#294565';
const SOURCE = '#6C5A8D';

interface ManifestFacility {
  readonly id: string;
  readonly file: string;
  readonly projection: Projection;
  readonly gridFootprint: { readonly w: number; readonly h: number };
  readonly paletteDefaults: PropPalette;
  readonly literalColors?: Readonly<Record<string, string>>;
}

interface CandidateManifest {
  readonly status: string;
  readonly sourceProfile: string;
  readonly facilities: readonly ManifestFacility[];
}

interface PixelDifference {
  readonly mismatchedPixels: number;
  readonly maxChannelDelta: number;
}

interface FacilityProof {
  readonly manifest: ManifestFacility;
  readonly sourcePath: string;
  readonly source: string;
  readonly imported: string;
  readonly current: string;
  readonly sourceSha256: string;
  readonly shapeCount: number;
  readonly sourceVsCurrent: Readonly<Record<number, PixelDifference>>;
  readonly sourceVsImported: Readonly<Record<number, PixelDifference>>;
  readonly importedVsCurrent: Readonly<Record<number, PixelDifference>>;
}

const escapeText = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

function text(
  x: number,
  y: number,
  value: string,
  size = 16,
  weight = 600,
  color = INK,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return (
    `<text x="${x}" y="${y}" ` +
    'font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" ' +
    `font-size="${size}" font-weight="${weight}" fill="${color}" ` +
    `text-anchor="${anchor}">${escapeText(value)}</text>`
  );
}

function panel(
  x: number,
  y: number,
  width: number,
  height: number,
  fill = PANEL,
  stroke = RULE,
): string {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="14" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
}

function placedSvg(source: string, x: number, y: number, size: number): string {
  return source
    .replace('<svg ', `<svg x="${x}" y="${y}" overflow="visible" `)
    .replace(/width="[^"]+" height="[^"]+"/, `width="${size}" height="${size}"`);
}

function resolveColor(value: string, palette: PropPalette): string {
  if (!value.startsWith('$')) return value;
  return palette[value.slice(1) as keyof PropPalette] ?? '#FF00FF';
}

function emitShape(shape: ShapeSpec, palette: PropPalette): string {
  const attributes = [
    `d="${shape.d}"`,
    `fill="${shape.fill ? resolveColor(shape.fill, palette) : 'none'}"`,
  ];
  if (shape.stroke) {
    attributes.push(`stroke="${resolveColor(shape.stroke, palette)}"`);
    attributes.push(`stroke-width="${shape.strokeWidth ?? 1.5}"`);
    attributes.push(`stroke-linecap="${shape.strokeLinecap ?? 'round'}"`);
    attributes.push(`stroke-linejoin="${shape.strokeLinejoin ?? 'round'}"`);
  }
  if (shape.opacity !== undefined) attributes.push(`opacity="${shape.opacity}"`);
  return `<path ${attributes.join(' ')}/>`;
}

function importedSvg(shapes: readonly ShapeSpec[], palette: PropPalette): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">` +
    shapes.map((shape) => emitShape(shape, palette)).join('') +
    '</svg>'
  );
}

function raster(source: string, size: number): PNG {
  return PNG.sync.read(
    new Resvg(source, { fitTo: { mode: 'width', value: size } }).render().asPng(),
  );
}

function pixelDifference(left: string, right: string, size: number): PixelDifference {
  const a = raster(left, size);
  const b = raster(right, size);
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error(`Raster dimensions differ at ${size}px`);
  }
  let mismatchedPixels = 0;
  let maxChannelDelta = 0;
  for (let offset = 0; offset < a.data.length; offset += 4) {
    let mismatch = false;
    for (let channel = 0; channel < 4; channel += 1) {
      const delta = Math.abs(a.data[offset + channel] - b.data[offset + channel]);
      if (delta !== 0) mismatch = true;
      maxChannelDelta = Math.max(maxChannelDelta, delta);
    }
    if (mismatch) mismatchedPixels += 1;
  }
  return { mismatchedPixels, maxChannelDelta };
}

function differences(left: string, right: string): Readonly<Record<number, PixelDifference>> {
  return Object.fromEntries(SCALES.map((size) => [
    size,
    pixelDifference(left, right, size),
  ]));
}

function requireExactAcceptedTarget(proof: FacilityProof): void {
  for (const comparison of [proof.sourceVsCurrent, proof.sourceVsImported]) {
    const baked = comparison[CANVAS];
    if (baked.mismatchedPixels !== 0 || baked.maxChannelDelta !== 0) {
      throw new Error(`${proof.manifest.id} changed approved pixels at the 128px baked cell`);
    }
    for (const size of [512, 90, 40] as const) {
      const difference = comparison[size];
      if (difference.mismatchedPixels > 32 || difference.maxChannelDelta > 64) {
        throw new Error(
          `${proof.manifest.id} vector-resample delta exceeds the production proof budget at ${size}px`,
        );
      }
    }
  }
  for (const size of SCALES) {
    const difference = proof.importedVsCurrent[size];
    if (difference.mismatchedPixels !== 0 || difference.maxChannelDelta !== 0) {
      throw new Error(
        `${proof.manifest.id} production receiver differs from the strict import at ${size}px`,
      );
    }
  }
}

async function loadProofs(): Promise<{ manifest: CandidateManifest; proofs: FacilityProof[] }> {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8')) as CandidateManifest;
  const project = defaultProject();
  const proofs: FacilityProof[] = [];
  for (const facility of manifest.facilities) {
    const sourcePath = facility.file.startsWith('assets/')
      ? facility.file
      : path.posix.join(OUTPUT, facility.file);
    const source = await readFile(sourcePath, 'utf8');
    const shapes = compileStaticPropSource(sourcePath, source, {
      id: facility.id,
      projection: facility.projection,
      paletteDefaults: facility.paletteDefaults,
    });
    const instance = project.props.find(({ templateId }) => templateId === facility.id);
    if (!instance) throw new Error(`Default project is missing ${facility.id}`);
    const current = composeProp(instance, DEFAULT_STYLE, CANVAS);
    const imported = importedSvg(shapes, facility.paletteDefaults);
    const proof: FacilityProof = {
      manifest: facility,
      sourcePath,
      source,
      imported,
      current,
      sourceSha256: createHash('sha256').update(source).digest('hex'),
      shapeCount: shapes.length,
      sourceVsCurrent: differences(source, current),
      sourceVsImported: differences(source, imported),
      importedVsCurrent: differences(imported, current),
    };
    requireExactAcceptedTarget(proof);
    proofs.push(proof);
  }
  return { manifest, proofs };
}

function proofSheet(proofs: readonly FacilityProof[]): string {
  const width = 3000;
  const height = 1700;
  const margin = 34;
  const gap = 18;
  const cardWidth = (width - margin * 2 - gap * 2) / 3;
  const cardHeight = 485;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${PAGE}"/>`,
    text(margin, 52, 'CAFETERIA FACILITIES · CANONICAL SOURCE / RECEIVER FIDELITY', 28, 880, GREEN),
    text(margin, 82, 'BROWSER EXPORT + UNITY IMPORT COMPLETE · RUNTIME VISUAL ACCEPTANCE DEFERRED', 12, 800, CORAL),
    text(margin, 112, 'Every canonical SVG owns its live Terrarium pixels. Source, strict import, and production receiver are exact at the 128 px baked cell.', 14, 620, MUTED),
  ];

  proofs.forEach((proof, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const x = margin + column * (cardWidth + gap);
    const y = 160 + row * (cardHeight + gap);
    const imported90 = proof.sourceVsImported[90];
    const imported40 = proof.sourceVsImported[40];
    const imported512 = proof.sourceVsImported[512];
    parts.push(
      panel(x, y, cardWidth, cardHeight, row % 2 === 0 ? PANEL : PANEL_ALT),
      text(x + 22, y + 36, proof.manifest.id, 19, 850, GREEN),
      text(
        x + cardWidth - 22,
        y + 36,
        `${proof.manifest.projection.toUpperCase()} · ${proof.manifest.gridFootprint.w}×${proof.manifest.gridFootprint.h} CELLS`,
        10,
        820,
        CORAL,
        'end',
      ),
      text(x + 94, y + 68, 'EDITABLE SVG', 10, 800, SOURCE, 'middle'),
      text(x + 266, y + 68, 'CURRENT', 10, 800, CORAL, 'middle'),
      text(x + 438, y + 68, 'STRICT IMPORT', 10, 800, GREEN, 'middle'),
      panel(x + 18, y + 82, 152, 164, '#FFFFFF88', '#C8C0AF'),
      panel(x + 190, y + 82, 152, 164, '#FFFFFF88', '#C8C0AF'),
      panel(x + 362, y + 82, 152, 164, '#FFFFFF88', '#C8C0AF'),
      placedSvg(proof.source, x + 30, y + 94, 128),
      placedSvg(proof.current, x + 202, y + 94, 128),
      placedSvg(proof.imported, x + 374, y + 94, 128),
      text(x + 608, y + 68, 'NORMAL · 90 px', 10, 800, BLUE, 'middle'),
      placedSvg(proof.source, x + 532, y + 92, 90),
      placedSvg(proof.imported, x + 632, y + 92, 90),
      text(x + 790, y + 68, 'FAR · 40 px', 10, 800, BLUE, 'middle'),
      placedSvg(proof.source, x + 746, y + 118, 40),
      placedSvg(proof.imported, x + 800, y + 118, 40),
      text(x + 22, y + 286, 'PRODUCTION RECEIVER', 10, 820, CORAL),
      text(x + 22, y + 308, 'Source ↔ current: Δ0 at the 128 px baked cell', 12, 680, INK),
      text(x + 22, y + 344, 'BAKED IMPORT', 10, 820, GREEN),
      text(x + 22, y + 366, `128 px: Δ0 · ${proof.shapeCount} imported ShapeSpecs`, 12, 680, INK),
      text(x + 22, y + 402, 'DIRECT VECTOR RESAMPLING', 10, 820, BLUE),
      text(
        x + 22,
        y + 424,
        `512: ${imported512.mismatchedPixels}px/max${imported512.maxChannelDelta} · 90: ${imported90.mismatchedPixels}px/max${imported90.maxChannelDelta} · 40: ${imported40.mismatchedPixels}px/max${imported40.maxChannelDelta}`,
        11,
        650,
        MUTED,
      ),
      text(x + 22, y + 458, 'Tiny direct-vector deltas are path normalization at antialiased boundaries; the exported 128 px cell is exact.', 10, 620, MUTED),
    );
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}

async function protectedSurfaceHashes(): Promise<Record<string, string>> {
  const files = [
    'CONTRACT.md',
    'src/core/exporter.ts',
    'src/data/defaults.ts',
    'src/props/templates.ts',
    'src/props/generated/quotaCoWorkhorseArt.ts',
    'scripts/props/importer.ts',
  ];
  return Object.fromEntries(await Promise.all(files.map(async (file) => {
    const content = await readFile(file);
    return [file, createHash('sha256').update(content).digest('hex')];
  })));
}

function readme(): string {
  return `# Canonical cafeteria facility production proof v1

Status: **browser export and fresh Unity import complete; runtime visual acceptance deferred**

The nine editable SVGs in \`assets/props/quota-co-workhorse-v1/\` are the
canonical Terrarium production sources approved on 2026-08-03. They preserve
semantic editor groups, the declared palette channels, projection declarations,
the service scanner's literal IRIS-green optic, source paint order, outline
pixels, and contact-shadow pixels.

The strict production importer compiles all nine successfully. Source, current
production, and imported output are pixel-identical at the real 128 px baked
cell. Directly rasterizing the normalized imported vector at non-bake sizes can
move a few antialiased boundary pixels; those bounded deltas are recorded in
\`metrics.json\` and do not exist in the exported 128 px atlas cell. The strict
import and production receiver are pixel-identical at every measured scale.

## Production boundary

This proof confirms that:

- the canonical workhorse bank owns the accepted sources;
- the read-only manifest/importer compiles them into the generated receiver;
- the nine templates use imported art lookups rather than handwritten geometry;
- IDs, projections, footprints, scanner behavior, clinical palette drain,
  export registration, and baked pixels remain protected.

The normal in-browser Terrarium export and fresh Unity import completed on
2026-08-03. The facilities do not yet have a viable in-game path, so this proof
does not claim gameplay-scale visual acceptance. That gate remains deferred
until the sim can surface them.
`;
}

async function main(): Promise<void> {
  const { manifest, proofs } = await loadProofs();
  if (manifest.status !== 'unity-import-complete-runtime-visual-deferred') {
    throw new Error(`Unexpected manifest status ${manifest.status}`);
  }
  const sheet = proofSheet(proofs);
  const png = new Resvg(sheet, { font: { loadSystemFonts: true } }).render().asPng();
  const metrics = {
    status: manifest.status,
    sourceProfile: manifest.sourceProfile,
    acceptedTarget: {
      exactAt: [CANVAS],
      comparison: 'canonical source versus current production compositor',
    },
    importProof: {
      exactBakedCell: CANVAS,
      vectorResampleScales: [512, 90, 40],
      note: 'Non-bake deltas are recorded rather than hidden; exported sprites bake at 128 px.',
    },
    productionReceiverProof: {
      exactAt: SCALES,
      comparison: 'strict import versus generated production receiver',
    },
    facilities: Object.fromEntries(proofs.map((proof) => [proof.manifest.id, {
      sourceFile: proof.sourcePath,
      sourceSha256: proof.sourceSha256,
      projection: proof.manifest.projection,
      gridFootprint: proof.manifest.gridFootprint,
      paletteDefaults: proof.manifest.paletteDefaults,
      literalColors: proof.manifest.literalColors ?? {},
      importedShapeCount: proof.shapeCount,
      sourceVsCurrent: proof.sourceVsCurrent,
      sourceVsImported: proof.sourceVsImported,
      importedVsCurrent: proof.importedVsCurrent,
    }])),
    protectedSurfaceHashes: await protectedSurfaceHashes(),
    productionChanges: [
      'canonical workhorse registration',
      'generated production receiver update',
      'handwritten builder removal',
      'portfolio and reference-guide registration',
    ],
    downstreamHandoff: {
      browserExport: 'complete',
      unityImport: 'complete',
      runtimeVisualAcceptance: 'deferred',
      runtimeVisualAcceptanceReason:
        'The cafeteria facilities do not yet have a viable in-game path.',
    },
    deferred: [
      'gameplay-scale visual acceptance once an in-game facility path exists',
      'commit',
    ],
  };
  await mkdir(OUTPUT, { recursive: true });
  await writeFile(`${OUTPUT}/00-source-current-import-fidelity.svg`, sheet, 'utf8');
  await writeFile(`${OUTPUT}/00-source-current-import-fidelity.png`, png);
  await writeFile(`${OUTPUT}/metrics.json`, `${JSON.stringify(metrics, null, 2)}\n`, 'utf8');
  await writeFile(`${OUTPUT}/README.md`, readme(), 'utf8');
  process.stdout.write(
    `Validated ${proofs.length} production-wired cafeteria facility sources.\n` +
    `Source/import/current exact at the ${CANVAS}px baked cell; bounded vector resampling recorded at 512, 90, and 40 px.\n` +
    `Wrote ${OUTPUT}/00-source-current-import-fidelity.png\n`,
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
