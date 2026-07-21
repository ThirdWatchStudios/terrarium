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
 * A composed envelope gate, room-context mock, and short/long length ladder
 * render every pass and sit above the component cards. Saves under
 * low-profile-correction/ re-render all three composition views too.
 * Output is disposable (.style-loop/ is gitignored and kept outside Vite's
 * cleared dist/ build directory); docs/previews remains the
 * reviewed contact-sheet authority via the existing preview scripts.
 */
import { existsSync, watch } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
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

// Cross-section proofs: throwaway single-file SVGs (literal palette hexes,
// never imported) that live beside the kit directory so the strict importer
// never sees them. They render as their own bench card at the review sizes.
const PROOFS_DIRECTORY_NAME = 'quota-co-building-system-proofs';

const crossSectionProofsDirectory = (input: string): string =>
  path.join(path.dirname(input), PROOFS_DIRECTORY_NAME);

// The distraction-free envelope gate: one closed 3x3 wall section assembled
// only from the structural masters under review. The empty centre cell exposes
// the walkable floor; every base is painted before every upper.
const ENVELOPE_GATE_CELLS: ReadonlyArray<readonly [number, number, string, string | null]> = [
  [0, 0, 'full_exterior_corner-base.svg', 'full_exterior_corner-upper.svg'],
  [1, 0, 'full_n_straight-base.svg', 'full_n_straight-upper.svg'],
  [2, 0, 'transition_n_to_e-base.svg', 'transition_n_to_e-upper.svg'],
  [0, 1, 'full_w_straight-base.svg', 'full_w_straight-upper.svg'],
  [2, 1, 'low-profile-correction/low-e-straight.svg', null],
  [0, 2, 'transition_w_to_s-base.svg', 'transition_w_to_s-upper.svg'],
  [1, 2, 'low-profile-correction/low-s-straight.svg', null],
  [2, 2, 'low-profile-correction/low-se-corner.svg', null],
];

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

type CompositionCell = readonly [number, number, string, string | null];
type CompositionFileOverrides = Readonly<Record<string, string>>;

const TRANSITION_N_TO_E_CELL: ReadonlyArray<CompositionCell> = [
  [0, 0, 'transition_n_to_e-base.svg', 'transition_n_to_e-upper.svg'],
];

// Frozen pre-correction east-facing sources. The production masters now carry
// the owner-approved local mirror inside x82..120 (x' = 202 - x); these three
// strings keep the rejected same-order profile available only for the A/B
// evidence board.
const SAME_ORDER_LOW_E_STRAIGHT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <g id="detail/low">
    <path id="outer-contour" fill="#252A28" d="M82 0H120V128H82Z"/>
    <path id="cream-shell" fill="#D9D0B9" d="M84 0H106V128H84Z"/>
    <path id="top-plane-light" fill="#FFFFFF" opacity="0.18" d="M84 0H102V128H84Z"/>
    <path id="coping-lip" fill="#FFFFFF" opacity="0.30" d="M102 0H103.5V128H102Z"/>
    <path id="coral-band" fill="#B65F4D" d="M106 0H110V128H106Z"/>
    <path id="green-face" fill="#294B3C" d="M110 0H117V128H110Z"/>
    <path id="face-shade" fill="#000000" opacity="0.12" d="M103.5 0H117V128H103.5Z"/>
    <path id="contact-shade" fill="#000000" opacity="0.12" d="M120 0H123.5V128H120Z"/>
    <path id="arris-seam" fill="none" stroke="#252A28" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.45" d="M103.5 1V127"/>
    <path id="band-seam" fill="none" stroke="#252A28" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.35" d="M110 1V127"/>
    <path id="boundary-seam" fill="none" stroke="#252A28" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity="0.18" d="M85 126H116"/>
  </g>
</svg>`;

const SAME_ORDER_TRANSITION_N_TO_E_BASE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <g id="detail/base">
    <path id="base-contour" d="M 0 56 H 110 A 10 10 0 0 1 120 66 V 128 H 82 V 127 A 7 7 0 0 0 75 120 H 0 Z" fill="#252A28"/>
    <path id="base-shell" d="M 0 58 H 110 A 8 8 0 0 1 118 66 V 128 H 84 V 126 A 6 6 0 0 0 78 120 H 0 Z" fill="#D9D0B9"/>
    <path id="base-contact-shade" d="M 0 120 H 82 V 123.5 H 0 Z M 120 66 H 123.5 V 128 H 120 Z" fill="#000000" opacity="0.12"/>
  </g>
</svg>`;

const SAME_ORDER_TRANSITION_N_TO_E_UPPER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <g id="detail/upper">
    <path id="upper-cap-light" d="M 0 58 H 110 A 8 8 0 0 1 118 66 H 113 A 3 3 0 0 0 110 63 H 0 Z" fill="#FFFFFF" opacity="0.30"/>
    <path id="upper-east-plane-light" d="M 84 63 H 96 A 6 6 0 0 1 102 69 V 128 H 84 Z" fill="#FFFFFF" opacity="0.18"/>
    <path id="upper-east-coping-lip" d="M 102 69 H 103.5 V 128 H 102 Z" fill="#FFFFFF" opacity="0.30"/>
    <path id="upper-north-coral" d="M 0 88 H 84 V 94 H 0 Z" fill="#B65F4D"/>
    <path id="upper-band-light" d="M 0 88 H 84 V 89.5 H 0 Z" fill="#FFFFFF" opacity="0.10"/>
    <path id="upper-north-green" d="M 0 94 H 84 V 115 A 2 2 0 0 1 82 117 H 0 Z" fill="#294B3C"/>
    <path id="upper-east-coral" d="M 106 66 H 110 V 128 H 106 Z" fill="#B65F4D"/>
    <path id="upper-east-green" d="M 110 66 H 117 V 128 H 110 Z" fill="#294B3C"/>
    <path id="upper-east-face-shade" d="M 103.5 70 H 117 V 128 H 103.5 Z" fill="#000000" opacity="0.12"/>
    <path id="upper-plinth" d="M 0 117 H 82 V 120 H 0 Z M 117 66 H 120 V 128 H 117 Z" fill="#252A28"/>
    <path id="upper-arris-seam" d="M 1 63 H 96 A 7.5 7.5 0 0 1 103.5 70.5 V 127" fill="none" stroke="#252A28" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.45"/>
    <path id="upper-north-band-seam" d="M 1 94 H 83" fill="none" stroke="#252A28" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.35"/>
    <path id="upper-east-band-seam" d="M 110 67 V 127" fill="none" stroke="#252A28" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.35"/>
  </g>
</svg>`;

const SAME_ORDER_EAST_PROFILE_OVERRIDE: CompositionFileOverrides = {
  'low-profile-correction/low-e-straight.svg': SAME_ORDER_LOW_E_STRAIGHT,
  'transition_n_to_e-base.svg': SAME_ORDER_TRANSITION_N_TO_E_BASE,
  'transition_n_to_e-upper.svg': SAME_ORDER_TRANSITION_N_TO_E_UPPER,
};

// A minimum closed room deliberately made only from junction pieces. It makes
// oversized corner and transition silhouettes impossible to hide behind long
// straight runs.
const COMPACT_CORNER_ROOM_CELLS: ReadonlyArray<CompositionCell> = [
  [0, 0, 'full_exterior_corner-base.svg', 'full_exterior_corner-upper.svg'],
  [1, 0, 'transition_n_to_e-base.svg', 'transition_n_to_e-upper.svg'],
  [0, 1, 'transition_w_to_s-base.svg', 'transition_w_to_s-upper.svg'],
  [1, 1, 'low-profile-correction/low-se-corner.svg', null],
];

// A one-cell-clear corridor: four repeated full/low side-wall bodies bracketed
// by the current authored corners and full-to-low transitions.
const NARROW_CORRIDOR_CELLS: ReadonlyArray<CompositionCell> = [
  [0, 0, 'full_exterior_corner-base.svg', 'full_exterior_corner-upper.svg'],
  [1, 0, 'full_n_straight-base.svg', 'full_n_straight-upper.svg'],
  [2, 0, 'transition_n_to_e-base.svg', 'transition_n_to_e-upper.svg'],
  [0, 1, 'full_w_straight-base.svg', 'full_w_straight-upper.svg'],
  [2, 1, 'low-profile-correction/low-e-straight.svg', null],
  [0, 2, 'full_w_straight-base.svg', 'full_w_straight-upper.svg'],
  [2, 2, 'low-profile-correction/low-e-straight.svg', null],
  [0, 3, 'full_w_straight-base.svg', 'full_w_straight-upper.svg'],
  [2, 3, 'low-profile-correction/low-e-straight.svg', null],
  [0, 4, 'full_w_straight-base.svg', 'full_w_straight-upper.svg'],
  [2, 4, 'low-profile-correction/low-e-straight.svg', null],
  [0, 5, 'transition_w_to_s-base.svg', 'transition_w_to_s-upper.svg'],
  [1, 5, 'low-profile-correction/low-s-straight.svg', null],
  [2, 5, 'low-profile-correction/low-se-corner.svg', null],
];

const LENGTH_LADDER_RUNS = [1, 2, 3, 6] as const;

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
    'figure.gate,figure.room{max-width:768px}figure.proofs{max-width:900px}' +
    'figure.transition-focus{max-width:1200px}' +
    'figure.length-ladder{max-width:1100px}</style>' +
    '<h1>QuotaCo Building System — live workbench</h1>' +
    '<div id="status">waiting for first render…</div>' +
    '<h2>active family review — northwest benchmark and northeast reconciliation</h2>' +
    '<figure class="transition-focus" data-stem="east-facing-mirror-proof"><img src="east-facing-mirror-proof.png" alt="current and reanchored mirrored east-facing wall profiles"></figure>' +
    '<h2>cross-section proofs — directional plane law candidates</h2>' +
    '<figure class="proofs" data-stem="cross-section-proofs"><img src="cross-section-proofs.png" alt="cross-section proofs"></figure>' +
    '<h2>envelope gate — composed structural shell, no opening content</h2>' +
    '<figure class="gate" data-stem="envelope-gate"><img src="envelope-gate.png" alt="composed wall envelope gate"></figure>' +
    '<h2>room context — masters tiled as the game composes them</h2>' +
    '<figure class="room" data-stem="room-context-mock"><img src="room-context-mock.png" alt="room context mock"></figure>' +
    '<h2>length ladder — short and long composition gate</h2>' +
    '<figure class="length-ladder" data-stem="length-ladder"><img src="length-ladder.png" alt="one, two, three, and six cell wall runs with compact room and corridor proofs"></figure>' +
    '<h2>per-stem cards — compiled through the importer</h2>' +
    `<main>${cards}</main>` +
    '<script>let stamp="",focusStamp="",gateStamp="",roomStamp="",ladderStamp="",proofsStamp="";async function tick(){try{' +
    'const s=await(await fetch("status.json",{cache:"no-store"})).json();' +
    'const el=document.getElementById("status");' +
    'if(!s.ok){el.textContent=`IMPORT FAILED\\n${s.error}`;el.className="bad";}' +
    'else if(s.contextError){el.textContent=`COMPOSITION IMPORT FAILED\\n${s.contextError}`;el.className="bad";}' +
    'else if(s.roomError){el.textContent=`ROOM IMPORT FAILED\\n${s.roomError}`;el.className="bad";}' +
    'else if(s.proofsError){el.textContent=`PROOF RENDER FAILED\\n${s.proofsError}`;el.className="bad";}' +
    'else{el.textContent=`ok · ${s.frames} frames · ${s.durationMs}ms · ${s.renderedAt}`;el.className="";}' +
    'if(s.ok&&s.renderedAt!==stamp){stamp=s.renderedAt;' +
    'for(const f of document.querySelectorAll("main figure"))f.querySelector("img").src=`${f.dataset.stem}.png?t=${Date.now()}`;}' +
    'if(s.focusRenderedAt&&s.focusRenderedAt!==focusStamp){focusStamp=s.focusRenderedAt;' +
    'const f=document.querySelector("figure.transition-focus");f.querySelector("img").src=`${f.dataset.stem}.png?t=${Date.now()}`;}' +
    'if(s.gateRenderedAt&&s.gateRenderedAt!==gateStamp){gateStamp=s.gateRenderedAt;' +
    'const f=document.querySelector("figure.gate");f.querySelector("img").src=`${f.dataset.stem}.png?t=${Date.now()}`;}' +
    'if(s.proofsRenderedAt&&s.proofsRenderedAt!==proofsStamp){proofsStamp=s.proofsRenderedAt;' +
    'const p=document.querySelector("figure.proofs");p.querySelector("img").src=`${p.dataset.stem}.png?t=${Date.now()}`;}' +
    'if(s.roomRenderedAt&&s.roomRenderedAt!==roomStamp){roomStamp=s.roomRenderedAt;' +
    'const f=document.querySelector("figure.room");f.querySelector("img").src=`${f.dataset.stem}.png?t=${Date.now()}`;}' +
    'if(s.ladderRenderedAt&&s.ladderRenderedAt!==ladderStamp){ladderStamp=s.ladderRenderedAt;' +
    'const f=document.querySelector("figure.length-ladder");f.querySelector("img").src=`${f.dataset.stem}.png?t=${Date.now()}`;}' +
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
  await renderEnvelopeGate(options);
  await renderRoomMock(options);
  await renderLengthLadder(options);
  await renderEastFacingMirrorProof(options, root);
  const renderedAt = new Date().toISOString();
  const status = {
    ok: true,
    frames: frames.length,
    durationMs: Date.now() - started,
    renderedAt,
    gateRenderedAt: renderedAt,
    roomRenderedAt: renderedAt,
    ladderRenderedAt: renderedAt,
    focusRenderedAt: renderedAt,
  };
  await writeFile(path.join(options.output, 'status.json'), `${JSON.stringify(status)}\n`, 'utf8');
  await writeFile(path.join(options.output, 'index.html'), benchPage(), 'utf8');
  process.stdout.write(`rendered ${stems.length} card${stems.length === 1 ? '' : 's'} (${frames.length} frames validated) in ${status.durationMs}ms\n`);
}

const stripSvgShell = (svg: string): string =>
  svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

const roomCell = (content: string, col: number, row: number): string =>
  `<svg x="${col * 128}" y="${row * 128}" width="128" height="128" viewBox="0 0 128 128">${content}</svg>`;

async function compositionWindow(
  options: CliOptions,
  cells: ReadonlyArray<CompositionCell>,
  columns: number,
  rows: number,
  x: number,
  y: number,
  width: number,
  height: number,
  fileOverrides: CompositionFileOverrides = {},
): Promise<string> {
  const basePass: string[] = [];
  const upperPass: string[] = [];
  for (const [col, row, baseFile, upperFile] of cells) {
    const baseSource = fileOverrides[baseFile] ?? await readFile(path.join(options.input, baseFile), 'utf8');
    basePass.push(roomCell(stripSvgShell(baseSource), col, row));
    if (upperFile) {
      const upperSource = fileOverrides[upperFile] ?? await readFile(path.join(options.input, upperFile), 'utf8');
      upperPass.push(roomCell(stripSvgShell(upperSource), col, row));
    }
  }
  const gridLines = [
    ...Array.from({ length: Math.max(0, columns - 1) }, (_, index) =>
      `<path d="M ${(index + 1) * 128} 0 V ${rows * 128}"/>`,
    ),
    ...Array.from({ length: Math.max(0, rows - 1) }, (_, index) =>
      `<path d="M 0 ${(index + 1) * 128} H ${columns * 128}"/>`,
    ),
  ].join('');
  return (
    `<svg x="${x}" y="${y}" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${columns * 128} ${rows * 128}" preserveAspectRatio="none">` +
    `<rect width="${columns * 128}" height="${rows * 128}" fill="${A1A_PALETTE.floor}"/>` +
    `<g fill="none" stroke="${INK}" stroke-width="1" opacity="0.14">${gridLines}</g>` +
    basePass.join('') +
    upperPass.join('') +
    '</svg>'
  );
}

function straightRunCells(
  length: number,
  baseFile: string,
  upperFile: string,
  vertical: boolean,
): CompositionCell[] {
  return Array.from({ length }, (_, index) =>
    [vertical ? 0 : index, vertical ? index : 0, baseFile, upperFile] as CompositionCell,
  );
}

function terminusRunCells(bodyLength: number): CompositionCell[] {
  return [
    ...straightRunCells(
      bodyLength,
      'full_n_straight-base.svg',
      'full_n_straight-upper.svg',
      false,
    ),
    [bodyLength, 0, 'full_terminus-base.svg', 'full_terminus-upper.svg'],
  ];
}

function compactCornerHeaderCells(): CompositionCell[] {
  return [
    [0, 0, 'full_exterior_corner-base.svg', 'full_exterior_corner-upper.svg'],
    [1, 0, 'door_closed-base.svg', 'door_closed-upper.svg'],
    [2, 0, 'transition_n_to_e-base.svg', 'transition_n_to_e-upper.svg'],
    [0, 1, 'full_w_straight-base.svg', 'full_w_straight-upper.svg'],
    [2, 1, 'low-profile-correction/low-e-straight.svg', null],
  ];
}

function longCornerHeaderCells(): CompositionCell[] {
  return [
    [0, 0, 'full_exterior_corner-base.svg', 'full_exterior_corner-upper.svg'],
    [1, 0, 'full_n_straight-base.svg', 'full_n_straight-upper.svg'],
    [2, 0, 'door_closed-base.svg', 'door_closed-upper.svg'],
    [3, 0, 'full_n_straight-base.svg', 'full_n_straight-upper.svg'],
    [4, 0, 'transition_n_to_e-base.svg', 'transition_n_to_e-upper.svg'],
    [0, 1, 'full_w_straight-base.svg', 'full_w_straight-upper.svg'],
    [4, 1, 'low-profile-correction/low-e-straight.svg', null],
  ];
}

function longCornerWithEastDropCells(): CompositionCell[] {
  return [
    ...longCornerHeaderCells(),
    [4, 2, 'low-profile-correction/low-e-straight.svg', null],
    [4, 3, 'low-profile-correction/low-e-straight.svg', null],
  ];
}

async function renderEastFacingMirrorProof(options: CliOptions, root: string): Promise<void> {
  const width = 1600;
  const height = 1240;
  const panelFill = '#ECE5D5';
  const panel = (x: number, y: number, w: number, h: number): string =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${panelFill}" ` +
    `stroke="${INK}" stroke-width="1.5" opacity="0.96"/>`;
  const referenceDir = path.join(root, 'docs', 'reference');
  const cornerReference = `data:image/png;base64,${Buffer.from(
    await readFile(path.join(referenceDir, 'quota-co-wall-corners-and-ends-study.png')),
  ).toString('base64')}`;
  const referenceCrop = (
    href: string,
    x: number,
    y: number,
    width_: number,
    height_: number,
    viewBox: string,
  ): string =>
    `<svg x="${x}" y="${y}" width="${width_}" height="${height_}" viewBox="${viewBox}" ` +
    `preserveAspectRatio="xMidYMid meet"><image width="1536" height="1024" href="${href}"/></svg>`;

  const parts: string[] = [
    `<rect width="${width}" height="${height}" rx="18" fill="${PANEL}"/>`,
    text(24, 34, 'EAST PROFILE X-FLIP — SAME FOOTPRINT, OPPOSITE FACING', 21, 800),
    text(24, 58, 'Accepted correction revises the northeast join and low-east cross-section together. Northwest, door, north/west walls, and every tile socket stay fixed.', 12, 600, MUTED),
    panel(20, 76, 1560, 244),
    panel(20, 340, 760, 470),
    panel(800, 340, 780, 470),
    panel(20, 830, 1000, 390),
    panel(1040, 830, 540, 390),
    text(48, 106, 'WEST CONTROL — OUTSIDE  →  ROOM', 14, 800),
    text(550, 106, 'REJECTED EAST — ROOM  →  OUTSIDE', 14, 800),
    text(1060, 106, 'ACCEPTED EAST — ROOM  →  OUTSIDE', 14, 800),
    text(105, 298, 'cream plane  |  lip  |  coral + green face', 10, 650, MUTED),
    text(570, 298, 'cream plane  |  lip  |  face   ← same order as west', 10, 650, '#9A493D'),
    text(1080, 298, 'face  |  lip  |  cream plane   ← inward-facing', 10, 650, '#294B3C'),
    text(44, 372, 'A — BEFORE: THE VIEWPOINT FLIPPED AT THE TURN', 14, 800),
    text(44, 394, 'Both vertical profiles use the same left-to-right material order.', 11, 600, MUTED),
    text(824, 372, 'B — ACCEPTED X-MIRROR: BOTH FACES TURN INWARD', 14, 800),
    text(824, 394, 'Only the east-facing cross-section and its corner bridge change.', 11, 600, MUTED),
    text(44, 790, 'Northwest and west remain the accepted controls.', 10, 650, MUTED),
    text(824, 790, 'East solid footprint remains x82..120; mirror axis x101.', 10, 650, MUTED),
    text(44, 862, 'CORRECTED LONG HEADER + THREE-CELL EAST DROP', 14, 800),
    text(44, 884, 'The face must stay on the room side immediately after the corner and for the entire run.', 11, 600, MUTED),
    text(520, 930, 'ACCEPTANCE CUES', 12, 800),
    text(520, 958, '• coral / green face remains inside the room', 11, 600, MUTED),
    text(520, 986, '• cream plane recedes toward the exterior', 11, 600, MUTED),
    text(520, 1014, '• NE-to-straight seam is visually continuous', 11, 600, MUTED),
    text(520, 1042, '• x82..120 structural socket never moves', 11, 600, MUTED),
    text(520, 1070, '• contact shadow moves with the facing', 11, 600, MUTED),
    text(520, 1110, 'This is a local mirror—not a whole-cell flip.', 12, 750, '#294B3C'),
    text(1064, 862, 'REFERENCE / CANDIDATE SCALE CHECK', 14, 800),
    text(1139, 1118, 'REFERENCE NE', 10, 750, MUTED, 'middle'),
    text(1390, 1118, 'MIRRORED NE', 10, 750, MUTED, 'middle'),
    text(1064, 1188, 'Accepted production profile; rejected baseline remains board-only.', 10, 650, MUTED),
  ];
  parts.push(
    await compositionWindow(
      options,
      [[0, 0, 'full_w_straight-base.svg', 'full_w_straight-upper.svg']],
      1, 1, 190, 124, 170, 160,
    ),
  );
  parts.push(
    await compositionWindow(
      options,
      [[0, 0, 'low-profile-correction/low-e-straight.svg', null]],
      1, 1, 690, 124, 170, 160, SAME_ORDER_EAST_PROFILE_OVERRIDE,
    ),
  );
  parts.push(
    await compositionWindow(
      options,
      [[0, 0, 'low-profile-correction/low-e-straight.svg', null]],
      1, 1, 1200, 124, 170, 160,
    ),
  );
  parts.push(
    await compositionWindow(
      options, compactCornerHeaderCells(), 3, 2, 100, 410, 600, 400,
      SAME_ORDER_EAST_PROFILE_OVERRIDE,
    ),
  );
  parts.push(await compositionWindow(options, compactCornerHeaderCells(), 3, 2, 890, 410, 600, 400));
  parts.push(
    await compositionWindow(
      options, longCornerWithEastDropCells(), 5, 4, 105, 910, 350, 280,
    ),
  );
  parts.push(referenceCrop(cornerReference, 1065, 900, 150, 200, '420 515 325 480'));
  parts.push(
    await compositionWindow(
      options, TRANSITION_N_TO_E_CELL, 1, 1, 1250, 900, 200, 200,
    ),
  );
  parts.push(
    await compositionWindow(
      options, TRANSITION_N_TO_E_CELL, 1, 1, 1270, 1135, 90, 70,
    ),
  );
  parts.push(
    await compositionWindow(
      options, TRANSITION_N_TO_E_CELL, 1, 1, 1435, 1150, 40, 40,
    ),
  );

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * CARD_RENDER_SCALE },
  }).render().asPng();
  await writeFile(path.join(options.output, 'east-facing-mirror-proof.png'), png);
}

async function renderLengthLadder(options: CliOptions): Promise<void> {
  const width = 1400;
  const height = 1200;
  const panelFill = '#ECE5D5';
  const panel = (x: number, y: number, w: number, h: number): string =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${panelFill}" ` +
    `stroke="${INK}" stroke-width="1.5" opacity="0.96"/>`;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" rx="18" fill="${PANEL}"/>`,
    text(24, 34, 'working wall composition length ladder', 21, 800),
    text(24, 56, 'Uncommitted body, corner, and terminus proposal; high-to-low transitions remain comparison controls.', 12, 500, MUTED),
    panel(20, 76, 780, 550),
    panel(820, 76, 560, 550),
    panel(20, 646, 560, 530),
    panel(600, 646, 780, 530),
    text(40, 108, 'FULL NORTH BODY — 1 / 2 / 3 / 6 CELLS', 15, 800),
    text(840, 108, 'FULL WEST BODY — 1 / 2 / 3 / 6 CELLS', 15, 800),
  ];

  for (const [index, length] of LENGTH_LADDER_RUNS.entries()) {
    const top = 126 + index * 117;
    parts.push(text(68, top + 57, `${length}`, 18, 800, INK, 'middle'));
    parts.push(
      await compositionWindow(
        options,
        straightRunCells(length, 'full_n_straight-base.svg', 'full_n_straight-upper.svg', false),
        length,
        1,
        100,
        top,
        length * 100,
        100,
      ),
    );
  }
  parts.push(text(40, 608, 'Gate: the body must remain legible at one cell and quiet at six.', 11, 650, MUTED));

  const westXs = [856, 968, 1080, 1210];
  for (const [index, length] of LENGTH_LADDER_RUNS.entries()) {
    const left = westXs[index];
    parts.push(text(left + 37, 130, `${length}`, 18, 800, INK, 'middle'));
    parts.push(
      await compositionWindow(
        options,
        straightRunCells(length, 'full_w_straight-base.svg', 'full_w_straight-upper.svg', true),
        1,
        length,
        left,
        142,
        74,
        length * 74,
      ),
    );
  }
  parts.push(text(840, 608, 'Same cross-section, judged without a terminus hiding repetition.', 11, 650, MUTED));

  parts.push(text(40, 680, 'COMPACT CORNER ROOM', 15, 800));
  parts.push(text(40, 704, '2×2 minimum enclosure · junction geometry only', 11, 600, MUTED));
  parts.push(await compositionWindow(options, COMPACT_CORNER_ROOM_CELLS, 2, 2, 130, 732, 340, 340));
  parts.push(text(40, 1104, 'Gate: corners may finish the room, but must not become the room.', 11, 650, MUTED));
  parts.push(text(40, 1127, 'This deliberately gives oversized elbows nowhere to hide.', 11, 500, MUTED));

  parts.push(text(620, 680, 'NARROW CORRIDOR', 15, 800));
  parts.push(text(620, 704, '1-cell clear span · four repeated side-wall cells', 11, 600, MUTED));
  parts.push(await compositionWindow(options, NARROW_CORRIDOR_CELLS, 3, 6, 640, 724, 216, 432));
  parts.push(text(900, 770, 'Must preserve:', 13, 800));
  parts.push(text(900, 798, '• a readable one-cell aisle', 12, 600, MUTED));
  parts.push(text(900, 824, '• quiet service-seam repetition', 12, 600, MUTED));
  parts.push(text(900, 850, '• distinct full-west and low-east profiles', 12, 600, MUTED));
  parts.push(text(900, 876, '• compact transitions at both ends', 12, 600, MUTED));
  parts.push(text(900, 934, 'Failure is visible here before a large room can disguise it.', 11, 650, MUTED));
  parts.push(text(900, 972, 'COMPACT END — 1 / 3 BODY CELLS', 12, 800));
  parts.push(text(884, 1028, '1', 13, 800, INK, 'middle'));
  parts.push(
    await compositionWindow(options, terminusRunCells(1), 2, 1, 900, 984, 180, 90),
  );
  parts.push(text(884, 1128, '3', 13, 800, INK, 'middle'));
  parts.push(
    await compositionWindow(options, terminusRunCells(3), 4, 1, 900, 1080, 360, 90),
  );

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * CARD_RENDER_SCALE },
  }).render().asPng();
  await writeFile(path.join(options.output, 'length-ladder.png'), png);
}

async function renderCompositionMock(
  options: CliOptions,
  cells: ReadonlyArray<CompositionCell>,
  outputName: string,
  showGrid: boolean,
): Promise<void> {
  const basePass: string[] = [];
  const upperPass: string[] = [];
  for (const [col, row, baseFile, upperFile] of cells) {
    basePass.push(roomCell(stripSvgShell(await readFile(path.join(options.input, baseFile), 'utf8')), col, row));
    if (upperFile) {
      upperPass.push(roomCell(stripSvgShell(await readFile(path.join(options.input, upperFile), 'utf8')), col, row));
    }
  }
  const gridLines = showGrid
    ? [1, 2]
      .map((i) => `<path d="M ${i * 128} 0 V 384 M 0 ${i * 128} H 384" stroke="${INK}" stroke-width="1"/>`)
      .join('')
    : '';
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="384" height="384" viewBox="0 0 384 384">` +
    `<rect width="384" height="384" fill="${A1A_PALETTE.floor}"/>` +
    `<g opacity="0.12">${gridLines}</g>` +
    basePass.join('') +
    upperPass.join('') +
    `</svg>`;
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 768 } }).render().asPng();
  await writeFile(path.join(options.output, outputName), png);
}

async function renderEnvelopeGate(options: CliOptions): Promise<void> {
  await renderCompositionMock(options, ENVELOPE_GATE_CELLS, 'envelope-gate.png', false);
}

async function renderRoomMock(options: CliOptions): Promise<void> {
  await renderCompositionMock(options, ROOM_CELLS, 'room-context-mock.png', true);
}

async function renderCrossSectionProofs(options: CliOptions): Promise<void> {
  const directory = crossSectionProofsDirectory(options.input);
  const files = existsSync(directory)
    ? (await readdir(directory)).filter((name) => name.endsWith('.svg')).sort()
    : [];
  const rowHeight = 310;
  const width = 900;
  const height = files.length === 0 ? 120 : 54 + files.length * rowHeight;
  const parts: string[] = [
    `<rect width="${width}" height="${height}" rx="14" fill="${PANEL}"/>`,
    text(20, 32, 'cross-section proofs — directional plane law candidates', 19, 750),
  ];
  if (files.length === 0) {
    parts.push(text(20, 70, `no proofs present in ${PROOFS_DIRECTORY_NAME}/`, 12, 500, MUTED));
  }
  for (const [index, name] of files.entries()) {
    const top = 54 + index * rowHeight;
    const content = stripSvgShell(await readFile(path.join(directory, name), 'utf8'));
    const proof = (x: number, y: number, size: number, floorBacked = true): string =>
      (floorBacked
        ? `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="6" fill="${A1A_PALETTE.floor}"/>`
        : '') +
      `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 128 128">${content}</svg>`;
    parts.push(text(20, top + 14, name, 13, 750));
    parts.push(proof(20, top + 24, A1A_REVIEW_SIZES.close));
    parts.push(text(140, top + 280, `${A1A_REVIEW_SIZES.close}px close`, 10, 650, MUTED, 'middle'));
    parts.push(proof(290, top + 24, A1A_REVIEW_SIZES.normal));
    parts.push(text(335, top + 130, `${A1A_REVIEW_SIZES.normal}px`, 10, 650, MUTED, 'middle'));
    parts.push(proof(290, top + 154, A1A_REVIEW_SIZES.far));
    parts.push(text(310, top + 210, `${A1A_REVIEW_SIZES.far}px`, 10, 650, MUTED, 'middle'));
    parts.push(`<rect x="420" y="${top + 24}" width="150" height="240" rx="10" fill="${A1A_PALETTE.charcoal}"/>`);
    parts.push(proof(450, top + 40, A1A_REVIEW_SIZES.normal, false));
    parts.push(proof(450, top + 150, A1A_REVIEW_SIZES.far, false));
    parts.push(text(495, top + 250, 'dark ground', 10, 650, '#A59E8F', 'middle'));
  }
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * CARD_RENDER_SCALE },
  }).render().asPng();
  await writeFile(path.join(options.output, 'cross-section-proofs.png'), png);
}

async function renderProofsSafely(options: CliOptions): Promise<void> {
  const statusPath = path.join(options.output, 'status.json');
  let status: Record<string, unknown> = {};
  try {
    status = JSON.parse(await readFile(statusPath, 'utf8')) as Record<string, unknown>;
  } catch {
    // The initial render normally creates status.json before the watcher starts.
  }
  try {
    await mkdir(options.output, { recursive: true });
    await renderCrossSectionProofs(options);
    delete status.proofsError;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    status.proofsError = message;
    process.stdout.write(`✗ proof render error — last good proofs kept\n${message}\n`);
  }
  status.proofsRenderedAt = new Date().toISOString();
  await writeFile(statusPath, `${JSON.stringify(status)}\n`, 'utf8');
}

async function renderContextMocksSafely(options: CliOptions, root: string): Promise<void> {
  try {
    await mkdir(options.output, { recursive: true });
    const correctionDir = path.join(options.input, 'low-profile-correction');
    await loadA1bLowCorrectionFamily({
      inputDir: correctionDir,
      sourcePathPrefix: path.relative(root, correctionDir).replaceAll(path.sep, '/'),
    });
    await renderEnvelopeGate(options);
    await renderRoomMock(options);
    await renderLengthLadder(options);
    await renderEastFacingMirrorProof(options, root);
    const statusPath = path.join(options.output, 'status.json');
    const status = JSON.parse(await readFile(statusPath, 'utf8')) as Record<string, unknown>;
    delete status.contextError;
    delete status.roomError;
    const renderedAt = new Date().toISOString();
    status.gateRenderedAt = renderedAt;
    status.roomRenderedAt = renderedAt;
    status.ladderRenderedAt = renderedAt;
    status.focusRenderedAt = renderedAt;
    await writeFile(statusPath, `${JSON.stringify(status)}\n`, 'utf8');
    process.stdout.write('composition mocks re-rendered\n');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const statusPath = path.join(options.output, 'status.json');
    let status: Record<string, unknown> = { ok: true };
    try {
      status = JSON.parse(await readFile(statusPath, 'utf8')) as Record<string, unknown>;
    } catch {
      // The initial render normally creates status.json before the watcher starts.
    }
    status.contextError = message;
    const renderedAt = new Date().toISOString();
    status.gateRenderedAt = renderedAt;
    status.roomRenderedAt = renderedAt;
    status.ladderRenderedAt = renderedAt;
    await writeFile(statusPath, `${JSON.stringify(status)}\n`, 'utf8');
    const kind = error instanceof A1bLowCorrectionImportError ? 'composition import contract' : 'composition render';
    process.stdout.write(`✗ ${kind} error — last good mocks kept\n${message}\n`);
  }
}

async function renderSafely(
  options: CliOptions,
  root: string,
  stems?: readonly A1bAuthoredStem[],
): Promise<boolean> {
  try {
    await render(options, root, stems);
    await renderProofsSafely(options);
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
  let proofsRenderPending = false;
  const pendingStems = new Set<A1bAuthoredStem>();
  let lastRootFile = '';
  let lastRoomFile = '';
  let lastProofFile = '';
  let subfamilyHinted = false;

  const flushPendingRenders = async (): Promise<void> => {
    if (renderInProgress) return;
    renderInProgress = true;
    try {
      while (renderAllCards || pendingStems.size > 0 || roomRenderPending || proofsRenderPending) {
        if (renderAllCards || pendingStems.size > 0) {
          const stems = renderAllCards ? undefined : [...pendingStems];
          const label = stems ? stems.join(', ') : 'all';
          renderAllCards = false;
          pendingStems.clear();
          // A card render also rebuilds the room from the latest low-profile
          // sources and the proofs card from the latest proof sources.
          roomRenderPending = false;
          proofsRenderPending = false;
          process.stdout.write(`${lastRootFile} changed — re-rendering ${label}…\n`);
          await renderSafely(options, root, stems);
          continue;
        }

        if (roomRenderPending) {
          roomRenderPending = false;
          process.stdout.write(`${lastRoomFile} changed — re-rendering room mock…\n`);
          await renderContextMocksSafely(options, root);
          continue;
        }

        proofsRenderPending = false;
        process.stdout.write(`${lastProofFile} changed — re-rendering cross-section proofs…\n`);
        await renderProofsSafely(options);
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

  const proofsDirectory = crossSectionProofsDirectory(options.input);
  if (existsSync(proofsDirectory)) {
    watch(proofsDirectory, (_event, fileName) => {
      if (!fileName || !fileName.endsWith('.svg')) return;
      lastProofFile = fileName;
      proofsRenderPending = true;
      schedulePendingRenders();
    });
    process.stdout.write(`watching ${path.relative(root, proofsDirectory)} for proof saves\n`);
  }
  process.stdout.write(`watching ${path.relative(root, options.input)} for saves (ctrl-c to stop)\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
