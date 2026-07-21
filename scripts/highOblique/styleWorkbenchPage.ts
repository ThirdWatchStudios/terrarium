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

export function renderStyleWorkbenchPage(diagnosticStems: readonly string[]): string {
  const reviewManifest = CURRENT_WORKBENCH_BOARDS.filter((board) => board.state === 'review');
  const acceptedManifest = CURRENT_WORKBENCH_BOARDS.filter((board) => board.state === 'accepted');
  const reviewBoards = reviewManifest.map(currentBoard).join('');
  const acceptedBoards = acceptedManifest.map(currentBoard).join('');
  const reviewNames = reviewManifest.map((board) => board.title).join(' · ');
  const acceptedNames = acceptedManifest.map((board) => board.title).join(' · ');
  const reviewStatus = reviewManifest.length > 0
    ? `<div class="status-card review"><span>Review next · ${reviewManifest.length} pieces</span><strong>${escapeHtml(reviewNames)}</strong><p>These remain active proposals and are not yet in the accepted working set.</p></div>`
    : '<div class="status-card next"><span>Next system gate</span><strong>Equal-height room · Corridor · Autotiling joins</strong><p>No individual wall piece is awaiting approval. The next proof should exercise the accepted set together.</p></div>';
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
    '.status-card.review span,.board[data-state="review"] .badge{color:var(--coral)}.status-card.next span{color:var(--teal)}.status-card.accepted span,.board[data-state="accepted"] .badge{color:var(--green)}' +
    '.current-section{margin:34px 0}.section-copy{border-left:3px solid var(--line);padding-left:12px;margin-bottom:14px}.current-section.review .section-copy{border-color:var(--coral)}.current-section.accepted .section-copy{border-color:var(--green)}' +
    '.section-copy p{color:var(--muted);font-size:13px;margin-top:4px}.board{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px;margin:0 0 18px}' +
    '.board-copy{margin:0 2px 12px}.board-copy p{color:var(--muted);font-size:13px;line-height:1.45}figure{margin:0}img{display:block;width:100%;height:auto;border-radius:10px}' +
    'details{border-top:1px solid var(--line);margin-top:26px;padding-top:14px}summary{cursor:pointer;color:var(--muted);font-size:13px;font-weight:700;list-style-position:outside}' +
    'summary small{display:block;font-size:11px;font-weight:500;margin:5px 0 0 18px;color:#7e8983}details[open] summary{color:var(--ink);margin-bottom:16px}' +
    '.archive-grid,.diagnostic-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:14px}.archived-board h3{font-size:12px;color:var(--muted);margin:0 0 7px}' +
    '#archive-status{font-size:12px;margin:0 0 12px}.diagnostic-grid figure{min-width:0}' +
    '@media(max-width:700px){body{padding:18px 12px 48px}.status-grid{grid-template-columns:1fr}.archive-grid,.diagnostic-grid{grid-template-columns:1fr}.board{padding:8px}.current-section{margin:26px 0}}' +
    '</style>' +
    '<header><h1>QuotaCo Building System — current wall workbench</h1>' +
    '<p class="lede">The open page contains the current owner-accepted equal-height wall direction and the next system-level proof gate. Older low-profile evidence and technical diagnostics are separated below.</p></header>' +
    '<div id="status">waiting for first render…</div>' +
    '<section class="kit-status" aria-labelledby="kit-status-title"><h2 id="kit-status-title">Current direction status — equal-height structural walls</h2>' +
    '<div class="status-grid">' +
    reviewStatus +
    `<div class="status-card accepted"><span>Accepted working set · ${acceptedManifest.length} pieces</span><strong>${escapeHtml(acceptedNames)}</strong><p>These are the current owner-approved working contracts.</p></div>` +
    '</div></section>' +
    '<main id="current-equal-height-wall-system">' +
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
    'const groups={root:s.renderedAt,focus:s.focusRenderedAt,gate:s.gateRenderedAt,proofs:s.proofsRenderedAt,room:s.roomRenderedAt,ladder:s.ladderRenderedAt};' +
    'for(const [group,next] of Object.entries(groups)){if(next&&stamps[group]!==next){stamps[group]=next;for(const figure of document.querySelectorAll(`[data-refresh="${group}"]`)){const image=figure.querySelector("img");if(image)image.src=`${figure.dataset.stem}.png?t=${Date.now()}`;}}}' +
    '}catch(error){const status=document.getElementById("status");status.textContent=`WORKBENCH STATUS UNAVAILABLE\\n${error instanceof Error?error.message:String(error)}`;status.className="bad";}setTimeout(tick,700)}tick()</script>'
  );
}
