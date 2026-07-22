import { EQUAL_HEIGHT_CORRIDOR_GATE } from './equalHeightCorridorGate';
import { EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE } from './equalHeightHorizontalTerminusGate';
import { EQUAL_HEIGHT_ISOLATED_SHELL_GATE } from './equalHeightIsolatedShellGate';
import { EQUAL_HEIGHT_MASK_LEDGER } from './equalHeightMaskLedger';
import { EQUAL_HEIGHT_OPEN_POCKET_T_JUNCTION_GATE } from './equalHeightOpenPocketTJunctionGate';
import { EQUAL_HEIGHT_THICK_WALL_BLOCK_GATE } from './equalHeightThickWallBlockGate';
import { EQUAL_HEIGHT_THICK_WALL_HORIZONTAL_REPEAT_GATE } from './equalHeightThickWallHorizontalRepeatGate';
import { EQUAL_HEIGHT_THICK_WALL_REPEAT_GATE } from './equalHeightThickWallRepeatGate';
import { EQUAL_HEIGHT_VERTICAL_TERMINUS_GATE } from './equalHeightVerticalTerminusGate';

export type CurrentWorkbenchBoardState = 'accepted' | 'review';

export interface CurrentWorkbenchBoard {
  readonly stem: string;
  readonly state: CurrentWorkbenchBoardState;
  readonly title: string;
  readonly summary: string;
  readonly alt: string;
}

interface ArchivedWorkbenchBoard {
  readonly stem: string;
  readonly title: string;
  readonly refreshGroup: 'focus' | 'proofs' | 'gate' | 'room' | 'ladder';
  readonly alt: string;
}

export interface AcceptedSystemGate {
  readonly stem: string;
  readonly state: 'accepted';
  readonly title: string;
  readonly summary: string;
  readonly alt: string;
}

/** Owner-accepted open-pocket T-junction source and its filtered mirror mapping. */
export const ACCEPTED_OPEN_POCKET_T_JUNCTION_GATE: AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_OPEN_POCKET_T_JUNCTION_GATE.stem,
  state: 'accepted',
  title: 'Open-pocket T-junction pair',
  summary: 'Accepted mask_7 as the authored open-west direct source and mask_13 as its approved whole-cell X mirror with the southeast boundary-seam filter.',
  alt: 'owner-accepted equal-height open-pocket T-junction pair with mask seven direct and mask thirteen as a filtered mirror',
};

/** Owner-accepted horizontal middle sources and their direct ledger mappings. */
export const ACCEPTED_THICK_WALL_HORIZONTAL_REPEAT_GATE: AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_THICK_WALL_HORIZONTAL_REPEAT_GATE.stem,
  state: 'accepted',
  title: 'N×2 thick-wall horizontal repeat unit',
  summary: 'Accepted masks 31/38 as two direct fixed-light middle sources, proven inside 3×2, 4×2, and 6×2 solid wall masses.',
  alt: 'owner-accepted equal-height horizontal thick-wall repeat family with masks thirty-one and thirty-eight as direct sources',
};

/** Owner-accepted repeatable middle source and its mirrored ledger mapping. */
export const ACCEPTED_THICK_WALL_REPEAT_GATE: AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_THICK_WALL_REPEAT_GATE.stem,
  state: 'accepted',
  title: '2×N thick-wall repeat unit',
  summary: 'Accepted mask_24 as one west-authored open-Y cream spine and mask_42 as its approved whole-cell X mirror, proven inside 2×3, 2×4, and 2×6 solid wall masses.',
  alt: 'owner-accepted equal-height two-column thick-wall repeat family with mask twenty-four direct and mask forty-two mirrored',
};

/** Owner-accepted filled-elbow source family and its four ledger mappings. */
export const ACCEPTED_THICK_WALL_BLOCK_GATE: AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_THICK_WALL_BLOCK_GATE.stem,
  state: 'accepted',
  title: '2×2 thick-wall source family',
  summary: 'Accepted masks 16/20 as direct fixed-light sources and 26/34 as approved X mirrors: one continuous cream wall top with the south-facing material shade preserving the foreground plane break.',
  alt: 'owner-accepted equal-height two by two solid wall block assembled from direct and mirrored proof sources',
};

/** Owner-accepted zero-link structural shell and its direct ledger provenance. */
export const ACCEPTED_ISOLATED_SHELL_GATE: AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_ISOLATED_SHELL_GATE.stem,
  state: 'accepted',
  title: 'mask_0 isolated structural shell',
  summary: 'Accepted direct source for one full-height zero-socket wall cell: a single molded tri-tone housing proven at 240/90/40 px and in compact floor contexts.',
  alt: 'owner-accepted mask zero isolated structural wall shell at multiple scales and compact placements',
};

/** Owner-accepted vertical closures and their whole-cell mirrored facings. */
export const ACCEPTED_VERTICAL_TERMINUS_GATE: AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_VERTICAL_TERMINUS_GATE.stem,
  state: 'accepted',
  title: 'Vertical terminus family',
  summary: 'Accepted mask_1 south-facing and mask_4 north-facing wall-owned closures, with west-authored sources and approved east mirror-X derivations proven at 240/90/40 px and short/long runs.',
  alt: 'owner-accepted equal-height vertical terminus family with tri-tone exposed wall ends at multiple sizes and run lengths',
};

/** Owner-accepted composition proof, kept separate from wall-piece acceptance. */
export const ACCEPTED_CORRIDOR_GATE: AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_CORRIDOR_GATE.stem,
  state: 'accepted',
  title: '3×8 narrow-corridor closure',
  summary: 'Accepted equal-height enclosure baseline at 90 and 40 pixels per cell.',
  alt: 'accepted equal-height wall family narrow-corridor closure gate',
};

/** Owner-accepted mapping structure; remaining synthetic candidate sprites remain unaccepted. */
export const ACCEPTED_MAPPING_GATE: AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_MASK_LEDGER.stem,
  state: 'accepted',
  title: '47-mask mapping ledger',
  summary: 'Accepted topology map: 11 direct reuses, 10 approved derivations, 26 synthetic candidates, and 0 authored-geometry gaps.',
  alt: 'owner-accepted equal-height 47-mask mapping ledger with unaccepted synthetic candidates',
};

/** Owner-accepted horizontal cap source and its whole-cell mirrored facing. */
export const ACCEPTED_HORIZONTAL_TERMINUS_GATE: AcceptedSystemGate = {
  stem: EQUAL_HEIGHT_HORIZONTAL_TERMINUS_GATE.stem,
  state: 'accepted',
  title: 'Horizontal terminus pair',
  summary: 'Accepted mask_8 direct source and mask_2 whole-cell X mirror, proven at 90/40 px and across 1/3/6-cell runs.',
  alt: 'owner-accepted equal-height horizontal terminus direct and mirrored source sheet',
};

/**
 * The current owner-accepted equal-height direction sheets.
 */
export const CURRENT_WORKBENCH_BOARDS: readonly CurrentWorkbenchBoard[] = [
  {
    stem: 'full-height-east-proof',
    state: 'accepted',
    title: 'East wall',
    summary: 'Accepted whole-cell mirror reuse of the full-height west profile.',
    alt: 'accepted full-height east wall mirror reuse',
  },
  {
    stem: 'full-height-northeast-proof',
    state: 'accepted',
    title: 'Northeast corner',
    summary: 'Accepted mirror reuse of the northwest source, proven with the east wall.',
    alt: 'accepted full-height northeast mirrored corner',
  },
  {
    stem: 'full-height-south-proof',
    state: 'accepted',
    title: 'South wall',
    summary: 'Accepted reuse of the full-height north wall source.',
    alt: 'accepted full-height south wall source reuse',
  },
  {
    stem: 'full-height-southwest-proof',
    state: 'accepted',
    title: 'Southwest corner',
    summary: 'Accepted molded turn from the west wall into the shared south profile.',
    alt: 'accepted full-height southwest molded corner',
  },
  {
    stem: 'full-height-southeast-proof',
    state: 'accepted',
    title: 'Southeast corner',
    summary: 'Accepted mirror-derived reuse of the southwest source with south-owned service seams.',
    alt: 'accepted full-height southeast mirrored corner',
  },
] as const;

/** Historical evidence stays reachable without competing with current work. */
export const ARCHIVED_WORKBENCH_BOARDS: readonly ArchivedWorkbenchBoard[] = [
  {
    stem: 'transition-w-to-s-focus',
    title: 'Superseded southwest full-to-low transition',
    refreshGroup: 'focus',
    alt: 'superseded southwest full-to-low transition and installed proofs',
  },
  {
    stem: 'cross-section-proofs',
    title: 'Directional plane-law reference controls',
    refreshGroup: 'proofs',
    alt: 'archived cross-section proofs',
  },
  {
    stem: 'envelope-gate',
    title: 'Mixed-profile envelope checkpoint',
    refreshGroup: 'gate',
    alt: 'archived composed wall envelope gate',
  },
  {
    stem: 'room-context-mock',
    title: 'Mixed-profile room checkpoint',
    refreshGroup: 'room',
    alt: 'archived room context mock',
  },
  {
    stem: 'length-ladder',
    title: 'Mixed-profile length and corridor checkpoint',
    refreshGroup: 'ladder',
    alt: 'archived short and long wall composition gate',
  },
] as const;

const escapeHtml = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const currentBoard = (board: CurrentWorkbenchBoard): string => {
  const stateLabel = board.state === 'accepted' ? 'Accepted' : 'Review next';
  return (
    `<article class="board" data-state="${board.state}">` +
    '<header class="board-copy">' +
    `<span class="badge">${stateLabel}</span>` +
    `<h3>${escapeHtml(board.title)}</h3>` +
    `<p>${escapeHtml(board.summary)}</p>` +
    '</header>' +
    `<figure data-stem="${board.stem}" data-refresh="focus">` +
    `<img src="${board.stem}.png" alt="${escapeHtml(board.alt)}">` +
    '</figure></article>'
  );
};

const archivedBoard = (board: ArchivedWorkbenchBoard): string => (
  '<article class="archived-board">' +
  `<h3>${escapeHtml(board.title)}</h3>` +
  `<figure data-stem="${board.stem}" data-refresh="${board.refreshGroup}">` +
  `<img loading="lazy" src="${board.stem}.png" alt="${escapeHtml(board.alt)}">` +
  '</figure></article>'
);

const acceptedSystemGate = (
  gate: AcceptedSystemGate,
  refreshGroup: 'open-pocket-t-junction' | 'thick-wall-horizontal-repeat' | 'thick-wall-repeat' | 'thick-wall-block' | 'isolated-shell' | 'vertical-terminus' | 'terminus' | 'mapping' | 'corridor',
  gateId: 'open-pocket-t-junction' | 'thick-wall-horizontal-repeat' | 'thick-wall-repeat' | 'thick-wall-block' | 'isolated-shell' | 'vertical-terminus' | 'terminus' | 'mapping' | 'corridor',
): string => (
  `<section class="current-section system-accepted" aria-labelledby="accepted-${gateId}-title">` +
  `<header class="section-copy"><h2 id="accepted-${gateId}-title">${gateId === 'mapping' ? 'Accepted system mapping' : gateId === 'corridor' ? 'Accepted system proof' : 'Accepted source gate'}</h2>` +
  `<p>${gateId === 'mapping' ? 'The mapping structure is locked; its remaining synthetic assembly diagrams stay proof-only and no authored-geometry gaps remain.' : gateId === 'open-pocket-t-junction' ? 'The authored open-west source, its filtered mirror, and ledger rows mask_7/mask_13 are locked at the proof layer.' : gateId === 'thick-wall-horizontal-repeat' ? 'The authored rear and foreground middle spines and ledger rows mask_31/mask_38 are locked at the proof layer.' : gateId === 'thick-wall-repeat' ? 'The authored west middle spine, its east mirror, and ledger rows mask_24/mask_42 are locked at the proof layer.' : gateId === 'thick-wall-block' ? 'The two authored filled-elbow sources, their east mirrors, and ledger rows mask_16/mask_20/mask_26/mask_34 are locked at the proof layer.' : gateId === 'isolated-shell' ? 'The fixed-view isolated shell and ledger row mask_0 are locked at the proof layer.' : gateId === 'vertical-terminus' ? 'The two authored vertical closures, their east mirrors, and ledger rows mask_1/mask_4 are locked at the proof layer.' : gateId === 'terminus' ? 'The horizontal source pair and its two ledger rows are locked at the proof layer.' : 'This remains the approved enclosure baseline for all subsequent wall-family proofs.'}</p></header>` +
  `<article class="board" data-state="system-accepted" data-gate="${gateId}">` +
  '<header class="board-copy"><span class="badge">Accepted · System gate</span>' +
  `<h3>${escapeHtml(gate.title)}</h3>` +
  `<p>${escapeHtml(gate.summary)}</p></header>` +
  `<figure data-stem="${gate.stem}" data-refresh="${refreshGroup}">` +
  `<img src="${gate.stem}.png" alt="${escapeHtml(gate.alt)}">` +
  '</figure></article></section>'
);

export function renderStyleWorkbenchPage(diagnosticStems: readonly string[]): string {
  const reviewManifest = CURRENT_WORKBENCH_BOARDS.filter((board) => board.state === 'review');
  const acceptedManifest = CURRENT_WORKBENCH_BOARDS.filter((board) => board.state === 'accepted');
  const reviewBoards = reviewManifest.map(currentBoard).join('');
  const acceptedBoards = acceptedManifest.map(currentBoard).join('');
  const reviewNames = reviewManifest.map((board) => board.title).join(' · ');
  const acceptedNames = acceptedManifest.map((board) => board.title).join(' · ');
  const reviewStatus = reviewManifest.length > 0
    ? `<div class="status-card review"><span>Review next · ${reviewManifest.length} pieces</span><strong>${escapeHtml(reviewNames)}</strong><p>These remain active proposals and are not yet in the accepted working set.</p></div>`
    : '';
  const acceptedTerminusGateStatus = '<div class="status-card accepted"><span>Accepted source gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_HORIZONTAL_TERMINUS_GATE.title)}</strong>` +
    '<p>mask_8 is direct; mask_2 is the accepted whole-cell mirror-X derivation.</p></div>';
  const acceptedVerticalTerminusGateStatus = '<div class="status-card accepted"><span>Accepted source gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_VERTICAL_TERMINUS_GATE.title)}</strong>` +
    '<p>mask_1 and mask_4 are accepted with west-authored sources and east mirror-X derivations.</p></div>';
  const acceptedIsolatedShellGateStatus = '<div class="status-card accepted"><span>Accepted source gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_ISOLATED_SHELL_GATE.title)}</strong>` +
    '<p>mask_0 is accepted as one fixed-view direct source with zero cardinal sockets.</p></div>';
  const acceptedMappingGateStatus = '<div class="status-card accepted"><span>Accepted system mapping</span>' +
    `<strong>${escapeHtml(ACCEPTED_MAPPING_GATE.title)}</strong>` +
    '<p>The 47-row topology plan is locked; its 26 synthetic candidates remain proof-only.</p></div>';
  const acceptedCorridorGateStatus = '<div class="status-card accepted"><span>Accepted system proof</span>' +
    `<strong>${escapeHtml(ACCEPTED_CORRIDOR_GATE.title)}</strong>` +
    '<p>The equal-height family reads as one enclosure at short and long extremes.</p></div>';
  const acceptedThickWallBlockGateStatus = '<div class="status-card accepted"><span>Accepted source gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_THICK_WALL_BLOCK_GATE.title)}</strong>` +
    '<p>mask_16/mask_20 are direct; mask_26/mask_34 are accepted whole-cell mirror-X derivations.</p></div>';
  const acceptedThickWallRepeatGateStatus = '<div class="status-card accepted"><span>Accepted source gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_THICK_WALL_REPEAT_GATE.title)}</strong>` +
    '<p>mask_24 is direct; mask_42 is the accepted whole-cell mirror-X derivation.</p></div>';
  const acceptedThickWallHorizontalRepeatStatus = '<div class="status-card accepted"><span>Accepted source gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_THICK_WALL_HORIZONTAL_REPEAT_GATE.title)}</strong>` +
    '<p>mask_31 and mask_38 are accepted as two direct fixed-light proof sources.</p></div>';
  const acceptedOpenPocketTJunctionStatus = '<div class="status-card accepted"><span>Accepted source gate</span>' +
    `<strong>${escapeHtml(ACCEPTED_OPEN_POCKET_T_JUNCTION_GATE.title)}</strong>` +
    '<p>mask_7 is direct; mask_13 is the approved whole-cell X mirror with the southeast boundary-seam filter.</p></div>';
  const reviewSection = reviewManifest.length > 0
    ? '<section class="current-section review" aria-labelledby="review-title"><header class="section-copy"><h2 id="review-title">Review next</h2><p>The unresolved pieces currently in play.</p></header>' + reviewBoards + '</section>'
    : '';
  const archivedBoards = ARCHIVED_WORKBENCH_BOARDS.map(archivedBoard).join('');
  const diagnostics = diagnosticStems.map((stem) => (
    `<figure data-stem="${escapeHtml(stem)}" data-refresh="root">` +
    `<img loading="lazy" src="${escapeHtml(stem)}.png" alt="compiler diagnostic for ${escapeHtml(stem)}">` +
    '</figure>'
  )).join('');

  return (
    '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>QuotaCo wall workbench</title>' +
    '<link rel="icon" href="data:,">' +
    '<style>' +
    ':root{color-scheme:dark;--ground:#1d211f;--panel:#252b28;--panel2:#303733;--ink:#f6f1e5;--muted:#a59e8f;--teal:#83a9a6;--green:#9fc7a9;--coral:#e0836e;--line:#46504b}' +
    '*{box-sizing:border-box}html{background:var(--ground);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}' +
    'body{max-width:1280px;margin:0 auto;padding:24px 20px 64px}h1{font-size:22px;margin:0 0 6px}h2{font-size:16px;margin:0}h3{font-size:16px;margin:8px 0 4px}' +
    'p{margin:0}.lede{max-width:760px;color:var(--muted);font-size:14px;line-height:1.5}' +
    '#status{font-size:13px;margin:14px 0 22px;color:var(--teal)}#status.bad,#archive-status.bad{color:var(--coral);white-space:pre-wrap}' +
    '.kit-status{border:1px solid var(--line);background:var(--panel);border-radius:14px;padding:16px;margin-bottom:28px}' +
    '.kit-status>h2{margin-bottom:12px;text-transform:uppercase;letter-spacing:.08em;font-size:12px;color:var(--muted)}' +
    '.status-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.status-card{border-radius:10px;padding:12px 14px;background:var(--panel2)}' +
    '.status-card span,.badge{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.status-card strong{display:block;margin:6px 0 3px;font-size:14px}.status-card p{font-size:12px;line-height:1.4;color:var(--muted)}' +
    '.status-card.review span,.board[data-state="review"] .badge,.board[data-state="system-review"] .badge{color:var(--coral)}.status-card.accepted span,.board[data-state="accepted"] .badge,.board[data-state="system-accepted"] .badge{color:var(--green)}' +
    '.current-section{margin:34px 0}.section-copy{border-left:3px solid var(--line);padding-left:12px;margin-bottom:14px}.current-section.review .section-copy,.current-section.system-review .section-copy{border-color:var(--coral)}.current-section.accepted .section-copy,.current-section.system-accepted .section-copy{border-color:var(--green)}' +
    '.section-copy p{color:var(--muted);font-size:13px;margin-top:4px}.board{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px;margin:0 0 18px}' +
    '.board-copy{margin:0 2px 12px}.board-copy p{color:var(--muted);font-size:13px;line-height:1.45}figure{margin:0}img{display:block;width:100%;height:auto;border-radius:10px}' +
    'details{border-top:1px solid var(--line);margin-top:26px;padding-top:14px}summary{cursor:pointer;color:var(--muted);font-size:13px;font-weight:700;list-style-position:outside}' +
    'summary small{display:block;font-size:11px;font-weight:500;margin:5px 0 0 18px;color:#7e8983}details[open] summary{color:var(--ink);margin-bottom:16px}' +
    '.archive-grid,.diagnostic-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:14px}.archived-board h3{font-size:12px;color:var(--muted);margin:0 0 7px}' +
    '#archive-status{font-size:12px;margin:0 0 12px}.diagnostic-grid figure{min-width:0}' +
    '@media(max-width:700px){body{padding:18px 12px 48px}.status-grid{grid-template-columns:1fr}.archive-grid,.diagnostic-grid{grid-template-columns:1fr}.board{padding:8px}.current-section{margin:26px 0}}' +
    '</style>' +
    '<header><h1>QuotaCo Building System — current wall workbench</h1>' +
    '<p class="lede">No proposal is currently active. The accepted open-pocket T-junction pair now leads the current proof-layer source gates.</p></header>' +
    '<div id="status">waiting for first render…</div>' +
    '<section class="kit-status" aria-labelledby="kit-status-title"><h2 id="kit-status-title">Current direction status — equal-height structural walls</h2>' +
    '<div class="status-grid">' +
    acceptedOpenPocketTJunctionStatus +
    acceptedThickWallHorizontalRepeatStatus +
    acceptedThickWallRepeatGateStatus +
    acceptedThickWallBlockGateStatus +
    acceptedIsolatedShellGateStatus +
    acceptedVerticalTerminusGateStatus +
    acceptedTerminusGateStatus +
    acceptedMappingGateStatus +
    acceptedCorridorGateStatus +
    reviewStatus +
    `<div class="status-card accepted"><span>Accepted working set · ${acceptedManifest.length} pieces</span><strong>${escapeHtml(acceptedNames)}</strong><p>These are the current owner-approved working contracts.</p></div>` +
    '</div></section>' +
    '<main id="current-equal-height-wall-system">' +
    acceptedSystemGate(ACCEPTED_OPEN_POCKET_T_JUNCTION_GATE, 'open-pocket-t-junction', 'open-pocket-t-junction') +
    acceptedSystemGate(ACCEPTED_THICK_WALL_HORIZONTAL_REPEAT_GATE, 'thick-wall-horizontal-repeat', 'thick-wall-horizontal-repeat') +
    acceptedSystemGate(ACCEPTED_THICK_WALL_REPEAT_GATE, 'thick-wall-repeat', 'thick-wall-repeat') +
    acceptedSystemGate(ACCEPTED_THICK_WALL_BLOCK_GATE, 'thick-wall-block', 'thick-wall-block') +
    acceptedSystemGate(ACCEPTED_ISOLATED_SHELL_GATE, 'isolated-shell', 'isolated-shell') +
    acceptedSystemGate(ACCEPTED_VERTICAL_TERMINUS_GATE, 'vertical-terminus', 'vertical-terminus') +
    acceptedSystemGate(ACCEPTED_HORIZONTAL_TERMINUS_GATE, 'terminus', 'terminus') +
    acceptedSystemGate(ACCEPTED_MAPPING_GATE, 'mapping', 'mapping') +
    acceptedSystemGate(ACCEPTED_CORRIDOR_GATE, 'corridor', 'corridor') +
    reviewSection +
    '<section class="current-section accepted" aria-labelledby="accepted-title"><header class="section-copy"><h2 id="accepted-title">Accepted working set</h2><p>Approved direction references; keep these as the comparison baseline.</p></header>' +
    acceptedBoards + '</section></main>' +
    '<details class="archive"><summary>Archived checkpoints — not current<small>Superseded low-profile comparisons, technical reference controls, and mixed-profile composition gates.</small></summary>' +
    '<div id="archive-status"></div><div class="archive-grid">' + archivedBoards + '</div></details>' +
    '<details class="diagnostics"><summary>Compiler diagnostics — not approval status<small>The strict source inventory remains available for importer debugging.</small></summary>' +
    '<div class="diagnostic-grid">' + diagnostics + '</div></details>' +
    '<script>const stamps={};async function tick(){try{' +
    'const response=await fetch("status.json",{cache:"no-store"});if(!response.ok)throw new Error(`status ${response.status}`);const s=await response.json();' +
    'const status=document.getElementById("status");' +
    'if(!s.ok){status.textContent=`IMPORT FAILED\\n${s.error}`;status.className="bad";}' +
    'else if(s.contextError){status.textContent=`CURRENT PROOF RENDER FAILED\\n${s.contextError}`;status.className="bad";}' +
    'else if(s.roomError){status.textContent=`CURRENT ROOM RENDER FAILED\\n${s.roomError}`;status.className="bad";}' +
    'else{status.textContent=`current proofs ok · ${s.frames} frames validated · ${s.durationMs}ms · ${s.renderedAt}`;status.className="";}' +
    'const archiveStatus=document.getElementById("archive-status");if(s.proofsError){archiveStatus.textContent=`ARCHIVED CROSS-SECTION RENDER FAILED\\n${s.proofsError}`;archiveStatus.className="bad";}else{archiveStatus.textContent="";archiveStatus.className="";}' +
    'const groups={root:s.renderedAt,focus:s.focusRenderedAt,"open-pocket-t-junction":s.openPocketTJunctionRenderedAt,"thick-wall-horizontal-repeat":s.thickWallHorizontalRepeatRenderedAt,"thick-wall-repeat":s.thickWallRepeatRenderedAt,"thick-wall-block":s.thickWallBlockRenderedAt,"isolated-shell":s.isolatedShellRenderedAt,"vertical-terminus":s.verticalTerminusRenderedAt,terminus:s.terminusRenderedAt,mapping:s.mappingRenderedAt,corridor:s.corridorRenderedAt,gate:s.gateRenderedAt,proofs:s.proofsRenderedAt,room:s.roomRenderedAt,ladder:s.ladderRenderedAt};' +
    'for(const [group,next] of Object.entries(groups)){if(next&&stamps[group]!==next){stamps[group]=next;for(const figure of document.querySelectorAll(`[data-refresh="${group}"]`)){const image=figure.querySelector("img");if(image)image.src=`${figure.dataset.stem}.png?t=${Date.now()}`;}}}' +
    '}catch(error){const status=document.getElementById("status");status.textContent=`WORKBENCH STATUS UNAVAILABLE\\n${error instanceof Error?error.message:String(error)}`;status.className="bad";}setTimeout(tick,700)}tick()</script>'
  );
}
