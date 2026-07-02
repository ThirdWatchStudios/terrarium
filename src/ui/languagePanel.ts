import { composeAttentionPuff, composeCharacter, composeEmotionGlyph } from '../core/compositor';
import { unitRecipe } from '../core/renderings';
import type { AttentionPuff } from '../parts/attention';
import type { Pose } from '../parts/poses';
import type { PreviewScene, SceneActor, StageMark } from '../data/previewScenes';
import { REPRIMAND_SCENE } from '../data/previewScenes';
import { UI_PALETTE } from '../data/uiPalette';
import { store } from '../state';
import { button, clear, el } from './dom';

/**
 * Language › Reading Test — the scene-reading preview harness.
 *
 * NON-NORMATIVE, by law: the sim's Director owns sequencing; the canned scene
 * here is a reading-test fixture (docs/social-theater-presentation-experiment.md
 * — this panel is the Build A/B rig). Nothing in this panel exports.
 *
 * What it answers, live:
 *   - HUD OFF   → can the bodies alone carry the scene? (the experiment's
 *                 load-bearing manipulation; performance contract Article III)
 *   - Capsules  → Build A control (no pose layer — the armless-capsule floor)
 *   - Truth/IRIS layer toggles → watch the registers disagree
 *                 (register-constitution.md Article VI)
 */

const STAGE_W = 520;
const STAGE_H = 300;
const AGENT_PX = 110;
/** Feet sit at pivot y 0.09 from the sheet bottom. */
const FEET = 1 - 0.09;

interface Playback {
  t: number;
  playing: boolean;
  raf: number;
  lastTick: number;
  hud: boolean;
  truth: boolean;
  iris: boolean;
  capsules: boolean;
  /** Operational-unit rendering (Article VIII): IRIS pigment, human conduct. */
  unit: boolean;
}

/** Module-level so toggles/playhead survive store-driven re-renders. */
const pb: Playback = { t: 0, playing: false, raf: 0, lastTick: 0, hud: true, truth: true, iris: true, capsules: false, unit: true };

const scene: PreviewScene = REPRIMAND_SCENE;

// --- scene state at time t ---------------------------------------------------

interface ActorState {
  at: StageMark;
  facing: PreviewScene['start']['M']['facing'];
  pose: Pose;
  beatIndex: number; // -1 = still on the start state
}

function actorStateAt(t: number, actor: SceneActor): ActorState {
  const start = scene.start[actor];
  let state: ActorState = { at: { ...start.at }, facing: start.facing, pose: start.pose, beatIndex: -1 };
  scene.beats.forEach((beat, i) => {
    if (beat.actor !== actor || beat.t > t) return;
    const from = state.at;
    let at = beat.moveTo ? { ...beat.moveTo } : from;
    if (beat.moveTo && t < beat.t + beat.dur) {
      const k = (t - beat.t) / beat.dur;
      at = { x: from.x + (beat.moveTo.x - from.x) * k, y: from.y + (beat.moveTo.y - from.y) * k };
    }
    state = { at, facing: beat.facing, pose: beat.pose, beatIndex: i };
  });
  return state;
}

function activeBeatIndex(t: number): number {
  let idx = -1;
  scene.beats.forEach((beat, i) => {
    if (beat.t <= t && t < beat.t + beat.dur) idx = i;
  });
  return idx;
}

// --- sprite cache -------------------------------------------------------------

const spriteCache = new Map<string, string>();

function agentSprite(actor: SceneActor, state: ActorState): string {
  const characters = store.state.characters;
  const identity = actor === 'M' ? characters[0] : characters[1] ?? characters[0];
  // The floor shows IRIS's rendering of the identity, not the identity itself
  // (Article VIII) — pigment changes, conduct doesn't.
  const recipe = pb.unit ? unitRecipe(identity) : identity;
  const pose = pb.capsules ? undefined : state.pose;
  const key = `${identity.id}|${pb.unit ? 'unit' : 'warm'}|${pose ?? 'capsule'}|${state.facing}`;
  let uri = spriteCache.get(key);
  if (!uri) {
    const svg = composeCharacter(recipe, store.state.style, state.facing, AGENT_PX, 'normal', { badge: false, pose });
    uri = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    spriteCache.set(key, uri);
  }
  return uri;
}

function glyphUri(kind: 'emotion' | 'puff', id: string): string {
  const key = `glyph|${kind}|${id}`;
  let uri = spriteCache.get(key);
  if (!uri) {
    const svg = kind === 'emotion' ? composeEmotionGlyph(id, 40) : composeAttentionPuff(id as AttentionPuff, 44);
    uri = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    spriteCache.set(key, uri);
  }
  return uri;
}

// --- rendering ----------------------------------------------------------------

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

interface StageRefs {
  agents: Record<SceneActor, SVGImageElement>;
  truthLayer: SVGGElement;
  irisLayer: SVGGElement;
  claimChip: { group: SVGGElement; text: SVGTextElement; prov: SVGTextElement };
  scrub: HTMLInputElement;
  clock: HTMLElement;
  beatRows: HTMLElement[];
}

let refs: StageRefs | null = null;

function chest(a: StageMark): StageMark {
  return { x: a.x, y: a.y - AGENT_PX * 0.38 };
}

function updateStage(): void {
  if (!refs) return;
  const t = pb.t;

  for (const actor of ['M', 'E'] as SceneActor[]) {
    const state = actorStateAt(t, actor);
    const img = refs.agents[actor];
    img.setAttribute('href', agentSprite(actor, state));
    img.setAttribute('x', String(state.at.x - AGENT_PX / 2));
    img.setAttribute('y', String(state.at.y - AGENT_PX * FEET));
  }

  // Register layers — rebuilt per frame (few elements; clarity over cleverness).
  clear(refs.truthLayer as unknown as HTMLElement);
  clear(refs.irisLayer as unknown as HTMLElement);
  refs.truthLayer.setAttribute('display', pb.hud && pb.truth ? 'inline' : 'none');
  refs.irisLayer.setAttribute('display', pb.hud && pb.iris ? 'inline' : 'none');

  let claim: { text: string; prov: string } | null = null;
  for (const fx of scene.effects) {
    if (t < fx.from || (fx.until !== undefined && t >= fx.until)) continue;
    const anchor = fx.actor ? actorStateAt(t, fx.actor).at : null;
    if (fx.kind === 'emotion' && anchor) {
      const img = svgEl('image', { x: anchor.x - 20, y: anchor.y - AGENT_PX - 26, width: 40, height: 40 });
      img.setAttribute('href', glyphUri('emotion', fx.value));
      refs.truthLayer.append(img);
    } else if (fx.kind === 'puff' && anchor) {
      const img = svgEl('image', { x: anchor.x + 14, y: anchor.y - AGENT_PX - 30, width: 44, height: 44 });
      img.setAttribute('href', glyphUri('puff', fx.value));
      refs.irisLayer.append(img);
    } else if (fx.kind === 'pressure-halo' && anchor) {
      refs.irisLayer.append(
        svgEl('circle', { cx: anchor.x, cy: anchor.y - AGENT_PX * 0.42, r: 40, fill: UI_PALETTE.status.warning, opacity: 0.16 }),
        svgEl('circle', { cx: anchor.x, cy: anchor.y - AGENT_PX * 0.42, r: 40, fill: 'none', stroke: UI_PALETTE.status.warning, 'stroke-width': 1.5, opacity: 0.45 }),
      );
    } else if (fx.kind === 'conflict-arc') {
      const m = chest(actorStateAt(t, 'M').at);
      const e = chest(actorStateAt(t, 'E').at);
      const midX = (m.x + e.x) / 2;
      refs.irisLayer.append(
        svgEl('path', {
          d: `M ${m.x} ${m.y} Q ${midX} ${Math.min(m.y, e.y) - 44} ${e.x} ${e.y}`,
          fill: 'none',
          stroke: UI_PALETTE.attention.conflict,
          'stroke-width': 2.5,
          'stroke-dasharray': '7 4',
          opacity: 0.85,
        }),
      );
    } else if (fx.kind === 'claim') {
      claim = { text: fx.value, prov: fx.provenance ?? 'asserted' };
    }
  }

  refs.claimChip.group.setAttribute('display', claim && pb.hud && pb.iris ? 'inline' : 'none');
  if (claim) {
    refs.claimChip.text.textContent = claim.text;
    refs.claimChip.prov.textContent = `IRIS · ${claim.prov.toUpperCase()}`;
  }

  refs.scrub.value = String(Math.round(t));
  refs.clock.textContent = `${(t / 1000).toFixed(2)}s / ${(scene.durationMs / 1000).toFixed(2)}s`;
  const active = activeBeatIndex(t);
  refs.beatRows.forEach((row, i) => row.classList.toggle('active', i === active));
}

function stopPlayback(): void {
  pb.playing = false;
  if (pb.raf) cancelAnimationFrame(pb.raf);
  pb.raf = 0;
}

function tick(now: number): void {
  if (!pb.playing) return;
  pb.t = Math.min(scene.durationMs, pb.t + (now - pb.lastTick));
  pb.lastTick = now;
  if (pb.t >= scene.durationMs) pb.playing = false;
  updateStage();
  if (pb.playing) pb.raf = requestAnimationFrame(tick);
}

function play(): void {
  if (pb.t >= scene.durationMs) pb.t = 0;
  pb.playing = true;
  pb.lastTick = performance.now();
  pb.raf = requestAnimationFrame(tick);
}

// --- panel entry points ---------------------------------------------------------

export function renderLanguagePreview(container: HTMLElement): void {
  stopPlayback();
  spriteCache.clear(); // recipes/style may have changed under us
  clear(container);

  const svg = svgEl('svg', { viewBox: `0 0 ${STAGE_W} ${STAGE_H}`, width: '100%' });
  svg.setAttribute('style', 'background:#F4F1EA;border:1px solid #D8D2C4;border-radius:6px;max-width:760px');

  // Quiet architecture: the environment recedes so the people read (it does
  // not adopt IRIS's palette — register-constitution.md Article VIII).
  const floor = svgEl('g', {});
  floor.append(
    svgEl('rect', { x: 415, y: 118, width: 88, height: 54, fill: '#E7E1D3', stroke: '#B9B2A1', 'stroke-width': 1.5, rx: 3 }),
    svgEl('text', { x: 459, y: 149, 'text-anchor': 'middle', 'font-size': 9, fill: '#9A937F' }),
    svgEl('line', { x1: 0, y1: 40, x2: STAGE_W, y2: 40, stroke: '#D8D2C4', 'stroke-width': 2 }),
  );
  (floor.children[1] as SVGTextElement).textContent = 'DESK';

  const irisLayer = svgEl('g', {});
  const truthLayer = svgEl('g', {});
  const agentM = svgEl('image', { width: AGENT_PX, height: AGENT_PX });
  const agentE = svgEl('image', { width: AGENT_PX, height: AGENT_PX });

  // The IRIS claim chip — the cold register, deliberately chrome-styled.
  const chipG = svgEl('g', {});
  chipG.append(
    svgEl('rect', { x: STAGE_W - 322, y: 8, width: 314, height: 26, fill: '#2E3438', rx: 3, opacity: 0.92 }),
    svgEl('text', { x: STAGE_W - 314, y: 20, 'font-size': 9, fill: '#DEE5E9', 'font-family': 'ui-monospace, monospace' }),
    svgEl('text', { x: STAGE_W - 314, y: 30, 'font-size': 7, fill: '#8FA0AA', 'font-family': 'ui-monospace, monospace' }),
  );
  const chipText = chipG.children[1] as SVGTextElement;
  const chipProv = chipG.children[2] as SVGTextElement;

  svg.append(floor, irisLayer, agentM, agentE, truthLayer, chipG);

  const scrub = el('input', {
    type: 'range',
    min: 0,
    max: scene.durationMs,
    step: 10,
    value: pb.t,
    onInput: (e: Event) => {
      stopPlayback();
      pb.t = Number((e.target as HTMLInputElement).value);
      updateStage();
    },
  }) as HTMLInputElement;
  scrub.style.width = '100%';
  scrub.style.maxWidth = '760px';

  const clock = el('span', { className: 'muted' }, '0.00s');

  container.append(
    el(
      'div',
      { className: 'panel-note' },
      el('strong', {}, 'PREVIEW HARNESS — non-normative. '),
      'The sim Director owns sequencing; this canned scene is a reading-test fixture and never exports ',
      '(CONTRACT §3.16; experiment rig for docs/social-theater-presentation-experiment.md).',
    ),
    el('h2', {}, scene.title),
    svg,
    el('div', {}, scrub),
    el('div', {}, clock),
  );

  refs = {
    agents: { M: agentM, E: agentE },
    truthLayer,
    irisLayer,
    claimChip: { group: chipG, text: chipText, prov: chipProv },
    scrub,
    clock,
    beatRows: refs?.beatRows ?? [],
  };
  updateStage();
}

export function renderLanguageControls(container: HTMLElement): void {
  clear(container);

  const toggle = (label: string, key: 'hud' | 'truth' | 'iris' | 'capsules' | 'unit', hint: string) => {
    const input = el('input', {
      type: 'checkbox',
      onChange: (e: Event) => {
        pb[key] = (e.target as HTMLInputElement).checked;
        updateStage();
      },
    }) as HTMLInputElement;
    input.checked = pb[key];
    return el('label', { className: 'field' }, input, el('span', {}, ` ${label} `), el('span', { className: 'muted' }, hint));
  };

  const beatRows: HTMLElement[] = scene.beats.map((beat) =>
    el(
      'div',
      {
        className: 'beat-row',
        style: 'padding:3px 6px;border-left:3px solid transparent;cursor:pointer;font-size:12px',
        onClick: () => {
          stopPlayback();
          pb.t = beat.t + 1;
          updateStage();
        },
      },
      el('strong', {}, `${(beat.t / 1000).toFixed(2)}s · ${beat.actor} · ${beat.pose}`),
      el('div', { className: 'muted' }, `${beat.note}${beat.presence ? ` — presence: ${beat.presence}` : ''}`),
    ),
  );
  if (refs) refs.beatRows = beatRows;

  // Highlight styling for the active beat row (inline so no stylesheet edit).
  const styleTag = el('style', {}, '.beat-row.active{border-left-color:#C7502F !important;background:#F7EFE7}');

  container.append(
    styleTag,
    el('h3', {}, 'Playback'),
    el(
      'div',
      { className: 'row' },
      button('▶ Play', () => {
        if (pb.playing) stopPlayback();
        else play();
      }, 'primary'),
      button('↺ Restart', () => {
        stopPlayback();
        pb.t = 0;
        play();
      }),
    ),
    el('h3', {}, 'Read the scene as…'),
    toggle('HUD', 'hud', '— master. OFF = the experiment cell: bodies must carry it alone.'),
    toggle('Truth register', 'truth', '— what the body earns (emotion glyphs).'),
    toggle('IRIS register', 'iris', '— what the corporation claims (arcs, halos, readings). Watch it disagree.'),
    toggle('Capsules only (Build A)', 'capsules', '— strip the pose layer: the armless-capsule control.'),
    toggle('Unit rendering (IRIS floor)', 'unit', '— IRIS pigment, human conduct. Off = warm identity (pre-amendment view).'),
    el('h3', {}, 'Beat script'),
    ...beatRows,
    el(
      'details',
      { style: 'margin-top:12px' },
      el('summary', {}, 'Ground truth (spoiler — cold-read first)'),
      el('p', { className: 'muted' }, scene.groundTruth),
    ),
  );
  updateStage();
}
