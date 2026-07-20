/**
 * Live authoring workbench for the QuotaCo Building System B pilot.
 *
 *   npm run style:watch            # watch kit, re-render on save, serve bench page
 *   npm run style:once             # single render, no watcher, no server
 *   npm run style:watch -- --input assets/walls/quota-co-building-system --out .style-loop --port 5411
 *
 * Every save re-validates the masters through the real A1b importer and
 * re-renders one card per stem: base / upper / composed plus the composed
 * frame at the close / normal / far review sizes on light and dark ground.
 * A room-context mock (real masters tiled as one room: full N/W walls, door,
 * both transitions, low E/S sills) renders every pass and sits at the top of
 * the bench page; saves under low-profile-correction/ re-render it too.
 * Output is disposable (.style-loop/ is gitignored and kept outside Vite's
 * cleared dist/ build directory); docs/previews remains the
 * reviewed contact-sheet authority via the existing preview scripts.
 */
import { watch } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import { A1bAuthoredBImportError, loadA1bAuthoredBFamily } from './highOblique/a1bAuthored';
import { A1A_PALETTE, A1A_REVIEW_SIZES } from './highOblique/a1aProof';
import {
  A1bLowCorrectionImportError,
  loadA1bLowCorrectionFamily,
} from './highOblique/a1bLowProfileCorrection';
import {
  A1B_AUTHORED_STEMS,
  a1bAuthoredAtlasDescriptor,
  a1bAuthoredAtlasSvg,
  buildA1bAuthoredFrames,
  type A1bAuthoredAtlasDescriptor,
  type A1bAuthoredFrameKind,
  type A1bAuthoredStem,
} from './highOblique/a1bAuthoredProof';

const ATLAS_SCALE = 4;
const CARD_WIDTH = 560;
const CARD_HEIGHT = 536;
const CARD_RENDER_SCALE = 2;
const PANEL = '#F6F1E5';
const INK = '#252A28';
const MUTED = '#606A64';

// The room-context mock: real masters tiled the way the game composes a room.
// Full N wall + door + NE transition across the top, full W wall down the
// left, low see-over sills on E and S meeting at the low SE corner.
const ROOM_CELLS: ReadonlyArray<readonly [number, number, string, string | null]> = [
  [0, 0, 'full_exterior_corner-base.svg', 'full_exterior_corner-upper.svg'],
  [1, 0, 'door_closed-base.svg', 'door_closed-upper.svg'],
  [2, 0, 'transition_n_to_e-base.svg', 'transition_n_to_e-upper.svg'],
  [0, 1, 'full_w_straight-base.svg', 'full_w_straight-upper.svg'],
  [2, 1, 'low-profile-correction/low-e-straight.svg', null],
  [0, 2, 'transition_w_to_s-base.svg', 'transition_w_to_s-upper.svg'],
  [1, 2, 'low-profile-correction/low-s-straight.svg', null],
  [2, 2, 'low-profile-correction/low-se-corner.svg', null],
];

interface CliOptions {
  readonly input: string;
  readonly output: string;
  readonly once: boolean;
  readonly port: number;
}

function parseArgs(args: string[], root: string): CliOptions {
  let input = path.join(root, 'assets/walls/quota-co-building-system');
  let output = path.join(root, '.style-loop');
  let once = false;
  let port = 5411;
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === '--once') {
      once = true;
      continue;
    }
    if (argument !== '--input' && argument !== '--out' && argument !== '--port') {
      throw new Error(`Unknown argument ${argument}`);
    }
    const value = args[++index];
    if (!value) throw new Error(`${argument} requires a value`);
    if (argument === '--input') input = path.resolve(root, value);
    else if (argument === '--out') output = path.resolve(root, value);
    else port = Number.parseInt(value, 10);
  }
  return { input, output, once, port };
}

function escapeText(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function text(
  x: number,
  y: number,
  value: string,
  size = 13,
  weight = 500,
  color = INK,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return (
    `<text x="${x}" y="${y}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" ` +
    `font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">` +
    `${escapeText(value)}</text>`
  );
}

function window_(
  atlas: A1bAuthoredAtlasDescriptor,
  stem: A1bAuthoredStem,
  kind: A1bAuthoredFrameKind,
  x: number,
  y: number,
  size: number,
  checkerBacked = true,
): string {
  const frame = atlas.frames[`b_${stem}_${kind}`];
  const backing = checkerBacked
    ? `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="6" fill="url(#checker)"/>`
    : '';
  return (
    backing +
    `<svg x="${x}" y="${y}" width="${size}" height="${size}" ` +
    `viewBox="${frame.x} ${frame.y} ${frame.w} ${frame.h}" preserveAspectRatio="none">` +
    '<use href="#atlasPixels"/>' +
    '</svg>'
  );
}

function stemCard(atlas: A1bAuthoredAtlasDescriptor, atlasUri: string, stem: A1bAuthoredStem): string {
  const parts: string[] = [
    `<defs><pattern id="checker" width="16" height="16" patternUnits="userSpaceOnUse">` +
      '<rect width="16" height="16" fill="#B9B9B2"/>' +
      '<rect width="8" height="8" fill="#D6D5CC"/><rect x="8" y="8" width="8" height="8" fill="#D6D5CC"/>' +
      `</pattern><image id="atlasPixels" x="0" y="0" width="${atlas.width}" height="${atlas.height}" ` +
      `href="${atlasUri}" image-rendering="auto"/></defs>`,
    `<rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="14" fill="${PANEL}"/>`,
  ];
  parts.push(text(20, 32, stem.replaceAll('_', ' '), 19, 750));
  parts.push(text(20, 49, `${stem}-base.svg + ${stem}-upper.svg`, 10, 500, MUTED));
  parts.push(text(CARD_WIDTH - 20, 32, 'compiled through the real importer', 11, 500, MUTED, 'end'));

  for (const [index, kind] of (['base', 'upper', 'composed'] as const).entries()) {
    const x = 20 + index * 185;
    parts.push(window_(atlas, stem, kind, x, 64, 150));
    parts.push(text(x + 75, 232, kind.toUpperCase(), 11, 800, kind === 'composed' ? A1A_PALETTE.green : MUTED, 'middle'));
  }

  parts.push(text(20, 256, 'distance proof — composed', 12, 750, MUTED));
  parts.push(window_(atlas, stem, 'composed', 20, 266, A1A_REVIEW_SIZES.close));
  parts.push(text(20 + A1A_REVIEW_SIZES.close / 2, 522, `${A1A_REVIEW_SIZES.close}px close`, 10, 650, MUTED, 'middle'));

  parts.push(window_(atlas, stem, 'composed', 290, 266, A1A_REVIEW_SIZES.normal));
  parts.push(text(290 + A1A_REVIEW_SIZES.normal / 2, 372, `${A1A_REVIEW_SIZES.normal}px`, 10, 650, MUTED, 'middle'));
  parts.push(window_(atlas, stem, 'composed', 290, 384, A1A_REVIEW_SIZES.far));
  parts.push(text(290 + A1A_REVIEW_SIZES.far / 2, 442, `${A1A_REVIEW_SIZES.far}px`, 10, 650, MUTED, 'middle'));

  parts.push(`<rect x="404" y="266" width="136" height="240" rx="10" fill="${A1A_PALETTE.charcoal}"/>`);
  parts.push(window_(atlas, stem, 'composed', 427, 280, A1A_REVIEW_SIZES.normal, false));
  parts.push(window_(atlas, stem, 'composed', 427, 384, A1A_REVIEW_SIZES.far, false));
  parts.push(text(472, 442, 'dark ground', 10, 650, '#A59E8F', 'middle'));
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" ` +
    `viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">${parts.join('')}</svg>`
  );
}

function benchPage(): string {
  const cards = A1B_AUTHORED_STEMS.map(
    (stem) => `<figure data-stem="${stem}"><img src="${stem}.png" alt="${stem}"></figure>`,
  ).join('');
  return (
    '<!doctype html><meta charset="utf-8"><title>QuotaCo style loop</title>' +
    '<style>html{background:#1d211f;color:#f6f1e5;font-family:-apple-system,sans-serif}' +
    'body{margin:20px}h1{font-size:17px;margin:0 0 4px}h2{font-size:13px;margin:18px 0 8px;color:#a59e8f}' +
    '#status{font-size:13px;margin-bottom:14px;color:#83a9a6}#status.bad{color:#e0836e;white-space:pre-wrap}' +
    'main{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:14px}' +
    'figure{margin:0}img{width:100%;height:auto;display:block;border-radius:10px}' +
    'figure.room{max-width:768px}</style>' +
    '<h1>QuotaCo Building System — live workbench</h1>' +
    '<div id="status">waiting for first render…</div>' +
    '<h2>room context — masters tiled as the game composes them</h2>' +
    '<figure class="room" data-stem="room-context-mock"><img src="room-context-mock.png" alt="room context mock"></figure>' +
    '<h2>per-stem cards — compiled through the importer</h2>' +
    `<main>${cards}</main>` +
    '<script>let stamp="",roomStamp="";async function tick(){try{' +
    'const s=await(await fetch("status.json",{cache:"no-store"})).json();' +
    'const el=document.getElementById("status");' +
    'if(!s.ok){el.textContent=`IMPORT FAILED\\n${s.error}`;el.className="bad";}' +
    'else if(s.roomError){el.textContent=`ROOM IMPORT FAILED\\n${s.roomError}`;el.className="bad";}' +
    'else{el.textContent=`ok · ${s.frames} frames · ${s.durationMs}ms · ${s.renderedAt}`;el.className="";}' +
    'if(s.ok&&s.renderedAt!==stamp){stamp=s.renderedAt;' +
    'for(const f of document.querySelectorAll("main figure"))f.querySelector("img").src=`${f.dataset.stem}.png?t=${Date.now()}`;}' +
    'if(s.roomRenderedAt&&s.roomRenderedAt!==roomStamp){roomStamp=s.roomRenderedAt;' +
    'const f=document.querySelector("figure.room");f.querySelector("img").src=`${f.dataset.stem}.png?t=${Date.now()}`;}' +
    '}catch{}setTimeout(tick,700)}tick()</script>'
  );
}

async function render(
  options: CliOptions,
  root: string,
  stems: readonly A1bAuthoredStem[] = A1B_AUTHORED_STEMS,
): Promise<void> {
  const started = Date.now();
  const sourcePathPrefix = path.relative(root, options.input).replaceAll(path.sep, '/');
  const family = await loadA1bAuthoredBFamily({ inputDir: options.input, sourcePathPrefix });
  const frames = buildA1bAuthoredFrames(family.components);
  const atlas = a1bAuthoredAtlasDescriptor(frames, ATLAS_SCALE);
  const atlasPng = new Resvg(a1bAuthoredAtlasSvg(frames, ATLAS_SCALE)).render().asPng();
  const atlasUri = `data:image/png;base64,${Buffer.from(atlasPng).toString('base64')}`;

  await mkdir(options.output, { recursive: true });
  for (const stem of stems) {
    const png = new Resvg(stemCard(atlas, atlasUri, stem), {
      fitTo: { mode: 'width', value: CARD_WIDTH * CARD_RENDER_SCALE },
    }).render().asPng();
    await writeFile(path.join(options.output, `${stem}.png`), png);
  }
  await renderRoomMock(options);
  const renderedAt = new Date().toISOString();
  const status = {
    ok: true,
    frames: frames.length,
    durationMs: Date.now() - started,
    renderedAt,
    roomRenderedAt: renderedAt,
  };
  await writeFile(path.join(options.output, 'status.json'), `${JSON.stringify(status)}\n`, 'utf8');
  await writeFile(path.join(options.output, 'index.html'), benchPage(), 'utf8');
  process.stdout.write(`rendered ${stems.length} card${stems.length === 1 ? '' : 's'} (${frames.length} frames validated) in ${status.durationMs}ms\n`);
}

const stripSvgShell = (svg: string): string =>
  svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

const roomCell = (content: string, col: number, row: number): string =>
  `<svg x="${col * 128}" y="${row * 128}" width="128" height="128" viewBox="0 0 128 128">${content}</svg>`;

async function renderRoomMock(options: CliOptions): Promise<void> {
  const basePass: string[] = [];
  const upperPass: string[] = [];
  for (const [col, row, baseFile, upperFile] of ROOM_CELLS) {
    basePass.push(roomCell(stripSvgShell(await readFile(path.join(options.input, baseFile), 'utf8')), col, row));
    if (upperFile) {
      upperPass.push(roomCell(stripSvgShell(await readFile(path.join(options.input, upperFile), 'utf8')), col, row));
    }
  }
  const gridLines = [1, 2]
    .map((i) => `<path d="M ${i * 128} 0 V 384 M 0 ${i * 128} H 384" stroke="${INK}" stroke-width="1"/>`)
    .join('');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="384" height="384" viewBox="0 0 384 384">` +
    `<rect width="384" height="384" fill="${A1A_PALETTE.floor}"/>` +
    `<g opacity="0.12">${gridLines}</g>` +
    basePass.join('') +
    upperPass.join('') +
    `</svg>`;
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 768 } }).render().asPng();
  await writeFile(path.join(options.output, 'room-context-mock.png'), png);
}

async function renderRoomMockSafely(options: CliOptions, root: string): Promise<void> {
  try {
    await mkdir(options.output, { recursive: true });
    const correctionDir = path.join(options.input, 'low-profile-correction');
    await loadA1bLowCorrectionFamily({
      inputDir: correctionDir,
      sourcePathPrefix: path.relative(root, correctionDir).replaceAll(path.sep, '/'),
    });
    await renderRoomMock(options);
    const statusPath = path.join(options.output, 'status.json');
    const status = JSON.parse(await readFile(statusPath, 'utf8')) as Record<string, unknown>;
    delete status.roomError;
    status.roomRenderedAt = new Date().toISOString();
    await writeFile(statusPath, `${JSON.stringify(status)}\n`, 'utf8');
    process.stdout.write('room mock re-rendered\n');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const statusPath = path.join(options.output, 'status.json');
    let status: Record<string, unknown> = { ok: true };
    try {
      status = JSON.parse(await readFile(statusPath, 'utf8')) as Record<string, unknown>;
    } catch {
      // The initial render normally creates status.json before the watcher starts.
    }
    status.roomError = message;
    status.roomRenderedAt = new Date().toISOString();
    await writeFile(statusPath, `${JSON.stringify(status)}\n`, 'utf8');
    const kind = error instanceof A1bLowCorrectionImportError ? 'room import contract' : 'room render';
    process.stdout.write(`✗ ${kind} error — last good room kept\n${message}\n`);
  }
}

async function renderSafely(
  options: CliOptions,
  root: string,
  stems?: readonly A1bAuthoredStem[],
): Promise<boolean> {
  try {
    await render(options, root, stems);
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    await mkdir(options.output, { recursive: true });
    await writeFile(
      path.join(options.output, 'status.json'),
      `${JSON.stringify({ ok: false, error: message, renderedAt: new Date().toISOString() })}\n`,
      'utf8',
    );
    const kind = error instanceof A1bAuthoredBImportError ? 'import contract' : 'render';
    process.stdout.write(`✗ ${kind} error — last good cards kept\n${message}\n`);
    return false;
  }
}

const MIME: Readonly<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
};

function serve(outputDir: string, port: number): void {
  const server = http.createServer(async (request, response) => {
    const name = path.basename(request.url?.split('?')[0] || '/') || 'index.html';
    const file = path.join(outputDir, name === '' ? 'index.html' : name);
    try {
      const body = await readFile(file);
      response.writeHead(200, {
        'content-type': MIME[path.extname(file)] ?? 'application/octet-stream',
        'cache-control': 'no-store',
      });
      response.end(body);
    } catch {
      response.writeHead(404).end('not found');
    }
  });
  server.listen(port, () => {
    process.stdout.write(`bench page: http://localhost:${port}/ — pin it beside your editor\n`);
  });
}

async function main(): Promise<void> {
  const root = process.cwd();
  const options = parseArgs(process.argv.slice(2), root);
  const initialRenderOk = await renderSafely(options, root);
  if (options.once) {
    if (!initialRenderOk) process.exitCode = 1;
    return;
  }

  serve(options.output, options.port);
  let timer: NodeJS.Timeout | undefined;
  let renderInProgress = false;
  let renderAllCards = false;
  let roomRenderPending = false;
  const pendingStems = new Set<A1bAuthoredStem>();
  let lastRootFile = '';
  let lastRoomFile = '';
  let subfamilyHinted = false;

  const flushPendingRenders = async (): Promise<void> => {
    if (renderInProgress) return;
    renderInProgress = true;
    try {
      while (renderAllCards || pendingStems.size > 0 || roomRenderPending) {
        if (renderAllCards || pendingStems.size > 0) {
          const stems = renderAllCards ? undefined : [...pendingStems];
          const label = stems ? stems.join(', ') : 'all';
          renderAllCards = false;
          pendingStems.clear();
          // A card render also rebuilds the room from the latest low-profile sources.
          roomRenderPending = false;
          process.stdout.write(`${lastRootFile} changed — re-rendering ${label}…\n`);
          await renderSafely(options, root, stems);
          continue;
        }

        roomRenderPending = false;
        process.stdout.write(`${lastRoomFile} changed — re-rendering room mock…\n`);
        await renderRoomMockSafely(options, root);
      }
    } finally {
      renderInProgress = false;
    }
  };

  const schedulePendingRenders = (): void => {
    clearTimeout(timer);
    timer = setTimeout(() => void flushPendingRenders(), 200);
  };

  watch(options.input, { recursive: true }, (_event, fileName) => {
    if (!fileName || !fileName.endsWith('.svg')) return;
    if (fileName.includes(path.sep) || fileName.includes('/')) {
      if (fileName.replaceAll(path.sep, '/').startsWith('low-profile-correction/')) {
        lastRoomFile = fileName;
        roomRenderPending = true;
        schedulePendingRenders();
      } else if (!subfamilyHinted) {
        subfamilyHinted = true;
        process.stdout.write(
          `subfamily change (${fileName}) — cards cover the root B pilot; use the matching ` +
          'high-oblique:*:preview script for that view\n',
        );
      }
      return;
    }
    const stem = fileName.replace(/-(base|upper)\.svg$/, '') as A1bAuthoredStem;
    lastRootFile = fileName;
    if (A1B_AUTHORED_STEMS.includes(stem)) pendingStems.add(stem);
    else renderAllCards = true;
    schedulePendingRenders();
  });
  process.stdout.write(`watching ${path.relative(root, options.input)} for saves (ctrl-c to stop)\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
