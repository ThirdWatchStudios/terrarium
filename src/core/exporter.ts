import JSZip from 'jszip';
import type { CharacterRecipe, ProjectState, PropInstance, StyleSheet, TileInstance } from './types';
import type { SceneState } from './scene';
import { CANVAS, MOODS, type Mood, type PropPaletteToken } from './types';
import {
  PALETTE_TOKENS,
  PROP_PALETTE_TOKENS,
  type TileLayer,
  characterLayers,
  propLayers,
  floorLayers,
  composeActivityBadge,
  composeCharacter,
  composeFloorTile,
  composeAttentionPuff,
  composeEmotionGlyph,
  composeIcon,
  composeMoodEmote,
  composeProp,
  composePropStatusBadge,
  composeSocialStateBadge,
  composeWallTile,
  composeGroundOverlayTile,
  composePortrait,
  employeePortraitCrop,
  layerCellSvg,
  overheadAnchor,
  poseRigAnchors,
} from './compositor';
import { ACTIVITIES, ACTIVITY_BADGES } from '../parts/activities';
import { MOOD_EMOTES } from '../parts/moods';
import { PROP_STATUSES } from '../parts/propStatus';
import { SOCIAL_STATES } from '../parts/socialStates';
import { EMOTION_DEFS, EMOTIONS } from '../parts/emotions';
import { ATTENTION_PUFFS } from '../parts/attention';
import { ACTIVITY_MOTION, MOOD_MOTION, PROP_STATUS_MOTION, SOCIAL_STATE_MOTION, EMOTION_MOTION, ATTENTION_MOTION } from '../parts/overheadMotion';
import { conversationStyleJson } from './conversation';
import { sceneToLayoutJson, facilityCatalogJson } from './layout';
import { composeSceneSvg } from './scene';
import type { EmployeeDefinition } from './employee';
import { employeeRecipe } from './employee';
import { serializeProfile } from './profile';
import { buildScenarioPackage } from './scenarioRun';
import { buildOrgStructure } from './orgStructure';
import { serializeCompany } from './company';
import { serializeScenarioTemplateLibrary, type ScenarioTemplate } from './scenarioTemplate';
import { PROP_TEMPLATES } from '../props/templates';
import { BLOB_CONFIGS, BLOB_TILE_COUNT } from '../tiles/blob';
import { deriveGroundOverlays } from '../tiles/groundOverlays';
import { themeUss, themeJson } from '../data/uiPalette';
import { ICONS, CURSORS } from '../parts/icons';
import { overlayStyleJson } from './overlayStyle';
import { symbolRegistryJson } from './registry';
import { POSES, poseCatalogJson } from '../parts/poses';
import { unitRecipe, unitRenderingSpec } from './renderings';
import { projectWithLook } from './look';
import { CONSTRUCTION_CREW, CONSTRUCTION_PROFILES } from '../data/defaults';

/** Sheet frame order. West is baked as mirrored east for engine convenience. */
const SHEET_FACINGS = ['south', 'east', 'north', 'west'] as const;

export const EXPORT_SCALES = [1, 2, 4];

function svgToImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
  });
}

function renderScale(style: StyleSheet): number {
  const value = style.render.pixelScale ?? 1;
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(8, Math.round(value)));
}

// ---------------------------------------------------------------------------
// SVG → PNG behind an interface. Every PNG the exporter produces is a "sheet":
// one or more 128-unit SVG cells composited into a grid at fixed pixel
// positions, optionally pixelated (render small, nearest-neighbor upscale).
// The browser uses a <canvas> backend (CanvasRasterizer); the headless CLI
// supplies a resvg-js backend (src/core/rasterizer-node.ts). Cell layout lives
// in pure SheetDesc builders below, so both backends render identical geometry.
// ---------------------------------------------------------------------------

/** PNG output: a Blob in the browser, raw bytes (Uint8Array/Buffer) headless. */
export type PngBytes = Blob | Uint8Array;

/** One 128-unit SVG drawn into the sheet at (dx,dy), scaled to dw×dh pixels. */
export interface RasterCell {
  /** A full <svg> whose viewBox is 0 0 128 128 (the design canvas). */
  svg: string;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

/** A complete sheet to rasterize: canvas size, pixelate factor, and its cells. */
export interface SheetDesc {
  width: number;
  height: number;
  /** >1 renders each cell small then nearest-neighbor upscales (pixelate). */
  pixelScale: number;
  cells: RasterCell[];
}

export interface Rasterizer {
  rasterizeSheet(desc: SheetDesc): Promise<PngBytes>;
}

/** Draw one cell into a 2D context, honoring the pixelate (nearest-neighbor) trick. */
function drawCell(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  pixelScale: number,
): void {
  if (pixelScale <= 1) {
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, dx, dy, dw, dh);
    return;
  }

  const small = document.createElement('canvas');
  small.width = Math.max(1, Math.round(dw / pixelScale));
  small.height = Math.max(1, Math.round(dh / pixelScale));
  const smallCtx = small.getContext('2d')!;
  smallCtx.imageSmoothingEnabled = true;
  smallCtx.drawImage(img, 0, 0, small.width, small.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(small, dx, dy, dw, dh);
  ctx.imageSmoothingEnabled = true;
}

/** Browser SVG→PNG backend: composite cells on a <canvas>, export as a Blob. */
class CanvasRasterizer implements Rasterizer {
  async rasterizeSheet(desc: SheetDesc): Promise<PngBytes> {
    const canvas = document.createElement('canvas');
    canvas.width = desc.width;
    canvas.height = desc.height;
    const ctx = canvas.getContext('2d')!;
    for (const cell of desc.cells) {
      const img = await svgToImage(cell.svg);
      drawCell(ctx, img, cell.dx, cell.dy, cell.dw, cell.dh, desc.pixelScale);
    }
    return canvasToBlob(canvas);
  }
}

let canvasRasterizer: Rasterizer | null = null;
/** The default (browser) rasterizer. Instantiated lazily so importing this
 *  module in Node (the CLI) never touches the DOM. */
export function defaultRasterizer(): Rasterizer {
  return (canvasRasterizer ??= new CanvasRasterizer());
}

const asBlob = (p: Promise<PngBytes>): Promise<Blob> => p as Promise<Blob>;

// --- Sheet descriptors (pure: cell positions only, no rasterization) ---------

function characterSheetDesc(recipe: CharacterRecipe, style: StyleSheet, scale: number): SheetDesc {
  const size = style.render.baseSize * scale;
  return {
    width: size * SHEET_FACINGS.length,
    height: size,
    pixelScale: renderScale(style),
    cells: SHEET_FACINGS.map((facing, i) => ({
      svg: composeCharacter(recipe, style, facing, size),
      dx: i * size,
      dy: 0,
      dw: size,
      dh: size,
    })),
  };
}

function moodSheetDesc(recipe: CharacterRecipe, style: StyleSheet, scale: number): SheetDesc {
  const size = style.render.baseSize * scale;
  const cells: RasterCell[] = [];
  MOODS.forEach((mood, row) => {
    SHEET_FACINGS.forEach((facing, col) => {
      cells.push({
        // The overhead mood emote is NOT baked here — it ships in the shared
        // mood-emotes atlas, placed by the sim at aboveHead (same as activity
        // badges). The sheet carries the per-character face overlay only.
        svg: composeCharacter(recipe, style, facing, size, mood, { badge: false }),
        dx: col * size,
        dy: row * size,
        dw: size,
        dh: size,
      });
    });
  });
  return { width: size * SHEET_FACINGS.length, height: size * MOODS.length, pixelScale: renderScale(style), cells };
}

function poseSheetDesc(recipe: CharacterRecipe, style: StyleSheet, scale: number): SheetDesc {
  const size = style.render.baseSize * scale;
  const cells: RasterCell[] = [];
  POSES.forEach((pose, row) => {
    SHEET_FACINGS.forEach((facing, col) => {
      cells.push({
        // Full posed character per cell (the renderer swaps whole held states —
        // `pose · orientation · hold · move`), badge-free like the mood sheet.
        svg: composeCharacter(recipe, style, facing, size, 'normal', { badge: false, pose }),
        dx: col * size,
        dy: row * size,
        dw: size,
        dh: size,
      });
    });
  });
  return { width: size * SHEET_FACINGS.length, height: size * POSES.length, pixelScale: renderScale(style), cells };
}

function layerSheetDesc(recipe: CharacterRecipe, style: StyleSheet, scale: number): SheetDesc {
  const layers = characterLayers(recipe, style);
  const size = style.render.baseSize * scale;
  const cells: RasterCell[] = [];
  layers.forEach((layer, row) => {
    SHEET_FACINGS.forEach((facing, col) => {
      const markup = layer.markup[facing];
      if (!markup) return; // empty cell: draw nothing (same as the canvas path)
      cells.push({ svg: layerCellSvg(markup, size), dx: col * size, dy: row * size, dw: size, dh: size });
    });
  });
  // Layer sheets never pixelate (re-tintable masks must stay crisp/exact).
  return { width: size * SHEET_FACINGS.length, height: size * Math.max(1, layers.length), pixelScale: 1, cells };
}

/**
 * Activity badges: a single shared strip, one cell per activity that has a
 * badge (the blank 'none' state is omitted). Character-independent — the sim
 * blits the matching cell above any agent keyed off its routine `activity`.
 */
const BADGED_ACTIVITIES = ACTIVITIES.filter((a) => ACTIVITY_BADGES[a]);

function activityBadgesDesc(style: StyleSheet, scale: number): SheetDesc {
  const size = style.render.baseSize * scale;
  return {
    width: size * BADGED_ACTIVITIES.length,
    height: size,
    pixelScale: renderScale(style),
    cells: BADGED_ACTIVITIES.map((activity, i) => ({
      svg: composeActivityBadge(activity, size),
      dx: i * size,
      dy: 0,
      dw: size,
      dh: size,
    })),
  };
}

export async function activityBadgesPng(style: StyleSheet, scale: number): Promise<Blob> {
  return asBlob(defaultRasterizer().rasterizeSheet(activityBadgesDesc(style, scale)));
}

export function activityBadgesAtlas(style: StyleSheet, scale: number) {
  const size = style.render.baseSize * scale;
  const frames: Record<string, { x: number; y: number; w: number; h: number }> = {};
  BADGED_ACTIVITIES.forEach((activity, i) => {
    frames[activity] = { x: i * size, y: 0, w: size, h: size };
  });
  return {
    kind: 'activity-badges' as const,
    frameSize: size,
    scale,
    activities: [...BADGED_ACTIVITIES],
    frames,
    // The badge bubble is centered in its cell — anchor it above an agent's head.
    pivot: { x: 0.5, y: 0.5 },
    // Where to hang the badge on the agent: the per-facing aboveHead anchor in
    // each character atlas (.anchors.aboveHead). South value inlined for convenience.
    attach: { anchor: 'aboveHead', normalizedSouth: normalizedAboveHead().south },
    // Motion intent per id (the sim owns the curves/timings; this is the recommendation).
    motion: { transient: false, byId: ACTIVITY_MOTION },
    meta: {
      generator: 'sprite-character-creator',
      shared: true,
      facingIndependent: true,
      note: 'Selected at runtime by the agent\'s routine activity; unknown ids draw nothing.',
    },
  };
}

/**
 * Mood emotes: the overhead-bubble half of a mood, as a shared strip — one cell
 * per mood that has an emote (`normal` has none). Character-independent, exactly
 * like activity badges; the sim blits the cell above an agent's head at the same
 * aboveHead anchor. The per-character *face overlay* half stays in the mood sheet.
 */
const EMOTED_MOODS = MOODS.filter((m) => MOOD_EMOTES[m]);

function moodEmotesDesc(style: StyleSheet, scale: number): SheetDesc {
  const size = style.render.baseSize * scale;
  return {
    width: size * EMOTED_MOODS.length,
    height: size,
    pixelScale: renderScale(style),
    cells: EMOTED_MOODS.map((mood, i) => ({
      svg: composeMoodEmote(mood, size),
      dx: i * size,
      dy: 0,
      dw: size,
      dh: size,
    })),
  };
}

export async function moodEmotesPng(style: StyleSheet, scale: number): Promise<Blob> {
  return asBlob(defaultRasterizer().rasterizeSheet(moodEmotesDesc(style, scale)));
}

export function moodEmotesAtlas(style: StyleSheet, scale: number) {
  const size = style.render.baseSize * scale;
  const frames: Record<string, { x: number; y: number; w: number; h: number }> = {};
  EMOTED_MOODS.forEach((mood, i) => {
    frames[mood] = { x: i * size, y: 0, w: size, h: size };
  });
  return {
    kind: 'mood-emotes' as const,
    frameSize: size,
    scale,
    moods: [...EMOTED_MOODS],
    frames,
    pivot: { x: 0.5, y: 0.5 },
    attach: { anchor: 'aboveHead', normalizedSouth: normalizedAboveHead().south },
    motion: { transient: false, byId: MOOD_MOTION },
    meta: {
      generator: 'sprite-character-creator',
      shared: true,
      facingIndependent: true,
      note: 'Overhead mood bubble; no longer baked in the mood sheet. Place above the head, stacks with the activity badge.',
    },
  };
}

/**
 * Prop-status badges: a single shared strip, one cell per tamper state, exactly
 * like the activity badges. The sim blits the matching cell above a *tampered*
 * prop, keyed off the prop's active tamper-state id. Prop-independent — a jam
 * looks the same over any printer.
 */
function propStatusBadgesDesc(style: StyleSheet, scale: number): SheetDesc {
  const size = style.render.baseSize * scale;
  return {
    width: size * PROP_STATUSES.length,
    height: size,
    pixelScale: renderScale(style),
    cells: PROP_STATUSES.map((status, i) => ({
      svg: composePropStatusBadge(status, size),
      dx: i * size,
      dy: 0,
      dw: size,
      dh: size,
    })),
  };
}

export async function propStatusBadgesPng(style: StyleSheet, scale: number): Promise<Blob> {
  return asBlob(defaultRasterizer().rasterizeSheet(propStatusBadgesDesc(style, scale)));
}

export function propStatusBadgesAtlas(style: StyleSheet, scale: number) {
  const size = style.render.baseSize * scale;
  const frames: Record<string, { x: number; y: number; w: number; h: number }> = {};
  PROP_STATUSES.forEach((status, i) => {
    frames[status] = { x: i * size, y: 0, w: size, h: size };
  });
  return {
    kind: 'prop-status-badges' as const,
    frameSize: size,
    scale,
    statuses: [...PROP_STATUSES],
    frames,
    // Bubble centered in its cell — the sim hangs it above the prop's top.
    pivot: { x: 0.5, y: 0.5 },
    // Alert state: pops in and pulses (demanding attention is the point).
    motion: { transient: false, byId: PROP_STATUS_MOTION },
    meta: {
      generator: 'sprite-character-creator',
      shared: true,
      propIndependent: true,
      note: "Selected at runtime by a prop's active tamper-state id; unknown ids draw nothing. Place above the tampered prop, like an agent's activity badge.",
    },
  };
}

/**
 * Social-state badges: a single shared strip, one cell per short-term social
 * state, exactly like the activity badges. The sim blits the matching cell at
 * the aboveHead anchor keyed off the agent's short-term social-state id
 * (mirrors ShortTermSocialStateLabel) — the interpersonal weather made legible
 * from the floor instead of inspector-text-only (docs/icon-expansion-plan.md §3.D).
 */
function socialStateBadgesDesc(style: StyleSheet, scale: number): SheetDesc {
  const size = style.render.baseSize * scale;
  return {
    width: size * SOCIAL_STATES.length,
    height: size,
    pixelScale: renderScale(style),
    cells: SOCIAL_STATES.map((state, i) => ({
      svg: composeSocialStateBadge(state, size),
      dx: i * size,
      dy: 0,
      dw: size,
      dh: size,
    })),
  };
}

export async function socialStateBadgesPng(style: StyleSheet, scale: number): Promise<Blob> {
  return asBlob(defaultRasterizer().rasterizeSheet(socialStateBadgesDesc(style, scale)));
}

export function socialStateBadgesAtlas(style: StyleSheet, scale: number) {
  const size = style.render.baseSize * scale;
  const frames: Record<string, { x: number; y: number; w: number; h: number }> = {};
  SOCIAL_STATES.forEach((state, i) => {
    frames[state] = { x: i * size, y: 0, w: size, h: size };
  });
  return {
    kind: 'social-state-badges' as const,
    frameSize: size,
    scale,
    states: [...SOCIAL_STATES],
    frames,
    pivot: { x: 0.5, y: 0.5 },
    attach: { anchor: 'aboveHead', normalizedSouth: normalizedAboveHead().south },
    // Ongoing state (minutes-scale, but still state): soft in/out, no nagging loop.
    motion: { transient: false, byId: SOCIAL_STATE_MOTION },
    meta: {
      generator: 'sprite-character-creator',
      shared: true,
      facingIndependent: true,
      note:
        "Selected at runtime by the agent's short-term social-state id; unknown ids draw " +
        'nothing. Bubble hue encodes valence (rose = negative, teal-blue = positive); the ' +
        'glyph says which state. Stacks with the mood/activity badges at aboveHead.',
    },
  };
}

/**
 * Emotion glyphs: a single shared strip, one cell per emotion in the harvest
 * vocabulary (14 ambient + 3 acute; docs/icon-expansion-plan.md §3.B). Unlike
 * the badge families these are NOT bubbles — each cell is the bare mark drawn
 * ink-on-halo, meant to sit inside the Shapes-drawn acute-spike outline (the
 * outline carries the emotion's hue; the cell stays colorless so the look is
 * tweakable post-build). The same geometry ships as tintable `emotion-<id>`
 * icons for chrome.
 */
function emotionGlyphsDesc(style: StyleSheet, scale: number): SheetDesc {
  const size = style.render.baseSize * scale;
  return {
    width: size * EMOTIONS.length,
    height: size,
    pixelScale: renderScale(style),
    cells: EMOTIONS.map((id, i) => ({
      svg: composeEmotionGlyph(id, size),
      dx: i * size,
      dy: 0,
      dw: size,
      dh: size,
    })),
  };
}

export async function emotionGlyphsPng(style: StyleSheet, scale: number): Promise<Blob> {
  return asBlob(defaultRasterizer().rasterizeSheet(emotionGlyphsDesc(style, scale)));
}

export function emotionGlyphsAtlas(style: StyleSheet, scale: number) {
  const size = style.render.baseSize * scale;
  const frames: Record<string, { x: number; y: number; w: number; h: number }> = {};
  EMOTIONS.forEach((id, i) => {
    frames[id] = { x: i * size, y: 0, w: size, h: size };
  });
  return {
    kind: 'emotion-glyphs' as const,
    frameSize: size,
    scale,
    emotions: [...EMOTIONS],
    // Grouping the sim/inspector can lean on: tier (ambient vs acute spike) and
    // the silhouette family each glyph belongs to (the §5-4 style grammar).
    byId: Object.fromEntries(EMOTION_DEFS.map((e) => [e.id, { tier: e.tier, group: e.group, label: e.label }])),
    frames,
    pivot: { x: 0.5, y: 0.5 },
    // Transient like a puff: lives for the spike, fades on decay.
    motion: { transient: true, byId: EMOTION_MOTION },
    meta: {
      generator: 'sprite-character-creator',
      shared: true,
      facingIndependent: true,
      // NOT an overhead bubble — no aboveHead attach. The floor overlay owns
      // placement (inside the acute-spike outline at the agent), intensity
      // (tracks the spike), and decay.
      placement: 'floor-overlay',
      note:
        'Bare ink-on-halo emotion marks for the discovery layer; the Shapes spike outline ' +
        'supplies the color. Selected by the sim-side emotion id; unknown ids draw nothing. ' +
        'The same geometry ships as tintable emotion-<id> chrome icons in icons/.',
    },
  };
}

/**
 * Attention puffs: a single shared strip, one cell per puff (active-loop §7). The
 * sim flashes the matching cell above an agent at the MOMENT a notable thing
 * happens, keyed off the puff's stable id. Agent-independent — a harvestable
 * beacon looks the same over anyone.
 */
function attentionPuffsDesc(style: StyleSheet, scale: number): SheetDesc {
  const size = style.render.baseSize * scale;
  return {
    width: size * ATTENTION_PUFFS.length,
    height: size,
    pixelScale: renderScale(style),
    cells: ATTENTION_PUFFS.map((puff, i) => ({
      svg: composeAttentionPuff(puff, size),
      dx: i * size,
      dy: 0,
      dw: size,
      dh: size,
    })),
  };
}

export async function attentionPuffsPng(style: StyleSheet, scale: number): Promise<Blob> {
  return asBlob(defaultRasterizer().rasterizeSheet(attentionPuffsDesc(style, scale)));
}

export function attentionPuffsAtlas(style: StyleSheet, scale: number) {
  const size = style.render.baseSize * scale;
  const frames: Record<string, { x: number; y: number; w: number; h: number }> = {};
  ATTENTION_PUFFS.forEach((puff, i) => {
    frames[puff] = { x: i * size, y: 0, w: size, h: size };
  });
  return {
    kind: 'attention-puffs' as const,
    frameSize: size,
    scale,
    puffs: [...ATTENTION_PUFFS],
    frames,
    // Cell-centered — the sim hangs it at the agent's aboveHead anchor, like the
    // mood/activity badges, so a puff can stack with the ongoing-state badges.
    pivot: { x: 0.5, y: 0.5 },
    attach: { anchor: 'aboveHead', normalizedSouth: normalizedAboveHead().south },
    // Transient events: all pop-and-fade; salienceTier is the §7 hierarchy, with
    // harvestable top (shimmer + hold until captured). Sim owns the actual flash.
    motion: { transient: true, byId: ATTENTION_MOTION },
    meta: {
      generator: 'sprite-character-creator',
      shared: true,
      facingIndependent: true,
      // §7: the set is FIXED and FEW; harvestable is the top of the salience tier.
      transient: true,
      salienceTop: 'attn-harvestable',
      note:
        'Transient event flash selected at runtime by a stable puff id; unknown ids draw ' +
        "nothing. The tool ships the static icon; the sim owns the flash/fade, the emission " +
        'budget, magnitude-gating, and salience (scale/intensity by severity × relevance).',
    },
  };
}

/**
 * One UI icon as a single-cell sheet. Icons never pixelate (pixelScale 1) — the
 * RimWorld dither is for world sprites; UI chrome wants clean edges.
 */
function iconDesc(iconId: string, style: StyleSheet, scale: number): SheetDesc {
  const size = style.render.baseSize * scale;
  return {
    width: size,
    height: size,
    pixelScale: 1,
    cells: [{ svg: composeIcon(iconId, size), dx: 0, dy: 0, dw: size, dh: size }],
  };
}

/** Index of the exported UI icons: SVG (UI Toolkit) + PNG ladder (uGUI) per id. */
export function iconsManifest() {
  return {
    kind: 'icons' as const,
    generator: 'sprite-character-creator',
    designCanvas: CANVAS,
    icons: ICONS.map((i) => ({
      id: i.id,
      label: i.label,
      mode: i.mode,
      svg: `icons/${i.id}.svg`,
      png: EXPORT_SCALES.map((s) => `icons/${i.id}@${s}x.png`),
    })),
    note:
      'tintable icons are white masks — recolor via USS unity-background-image-tint-color ' +
      'or uGUI Image.color (theme.uss --wc-*). literal icons ship final colors.',
  };
}

/** Cursors: PNG-only (USS `cursor` / uGUI need a texture), each with a hotspot. */
export function cursorsManifest() {
  return {
    kind: 'cursors' as const,
    generator: 'sprite-character-creator',
    designCanvas: CANVAS,
    cursors: CURSORS.map((c) => ({
      id: c.id,
      label: c.label,
      png: EXPORT_SCALES.map((s) => `cursors/${c.id}@${s}x.png`),
      // Normalized active pixel (0..1) — multiply by the chosen texture size.
      hotspot: c.hotspot,
    })),
    note: 'No SVG — USS `cursor` and uGUI take a texture + hotspot, not a vector.',
  };
}

function wallTilesetDesc(wall: TileInstance, style: StyleSheet, scale: number): SheetDesc {
  const size = style.render.baseSize * scale;
  const cells: RasterCell[] = [];
  for (let i = 0; i < BLOB_TILE_COUNT; i++) {
    cells.push({
      svg: composeWallTile(wall, style, BLOB_CONFIGS[i], size),
      dx: (i % 8) * size,
      dy: Math.floor(i / 8) * size,
      dw: size,
      dh: size,
    });
  }
  return { width: size * 8, height: size * 6, pixelScale: renderScale(style), cells };
}

function floorTileDesc(floor: TileInstance, style: StyleSheet, scale: number): SheetDesc {
  const size = style.render.baseSize * scale;
  return {
    width: size,
    height: size,
    pixelScale: renderScale(style),
    cells: [{ svg: composeFloorTile(floor, style, size), dx: 0, dy: 0, dw: size, dh: size }],
  };
}

function propDesc(prop: PropInstance, style: StyleSheet, scale: number): SheetDesc {
  const size = style.render.baseSize * scale;
  return {
    width: size,
    height: size,
    pixelScale: renderScale(style),
    cells: [{ svg: composeProp(prop, style, size), dx: 0, dy: 0, dw: size, dh: size }],
  };
}

/** Render a character sprite sheet (south, east, north, west) at the given scale. */
export async function characterSheetPng(
  recipe: CharacterRecipe,
  style: StyleSheet,
  scale: number,
): Promise<Blob> {
  return asBlob(defaultRasterizer().rasterizeSheet(characterSheetDesc(recipe, style, scale)));
}

/** Atlas metadata matching the sheet layout, for slicing in Unity. */
export function characterAtlas(recipe: CharacterRecipe, style: StyleSheet, scale: number) {
  const size = style.render.baseSize * scale;
  const frames: Record<string, { x: number; y: number; w: number; h: number }> = {};
  SHEET_FACINGS.forEach((facing, i) => {
    frames[facing] = { x: i * size, y: 0, w: size, h: size };
  });
  return {
    name: recipe.name,
    id: recipe.id,
    frameSize: size,
    scale,
    frames,
    /** Normalized pivot — feet sit near the bottom of the design canvas. */
    pivot: { x: 0.5, y: 0.09 },
    /**
     * Normalized attach points (same bottom-left origin as pivot). `aboveHead`
     * is where the sim hangs a *separate* overhead sprite — the shared activity
     * badge (§3.9) or a conversation-link endpoint. Moods bake their emote into
     * the sheet and don't need this; the badge/link are external and do. Body-owned
     * and shipped per character so compact/tall/soft silhouettes keep
     * their external effects attached to the same authored rig as their sprites.
     */
    anchors: { aboveHead: normalizedAboveHead(recipe) },
    meta: {
      generator: 'sprite-character-creator',
      westIsMirroredEast: true,
    },
  };
}

/** aboveHead anchor per facing, normalized bottom-left origin (Unity pivot convention). */
function normalizedAboveHead(recipe?: CharacterRecipe): Record<string, { x: number; y: number }> {
  const out: Record<string, { x: number; y: number }> = {};
  for (const facing of SHEET_FACINGS) {
    const a = overheadAnchor(facing, recipe);
    out[facing] = { x: a.x / CANVAS, y: (CANVAS - a.y) / CANVAS };
  }
  return out;
}

/**
 * Layer atlas (Phase 2.2 spike). One row per re-tintable part layer, one column
 * per facing (south, east, north, west). Token layers are white masks the engine
 * multiplies by the recipe colour; literal layers are untinted; mood layers swap
 * by the active mood. Outline-free — the engine strokes the merged silhouette.
 * Pairs with characterLayerManifest, which carries z-order + tint token + mood.
 */
export async function characterLayerSheetPng(
  recipe: CharacterRecipe,
  style: StyleSheet,
  scale: number,
): Promise<Blob> {
  return asBlob(defaultRasterizer().rasterizeSheet(layerSheetDesc(recipe, style, scale)));
}

export function characterLayerManifest(recipe: CharacterRecipe, style: StyleSheet, scale: number) {
  const layers = characterLayers(recipe, style);
  const size = style.render.baseSize * scale;
  const frames: Record<string, { x: number; y: number; w: number; h: number }> = {};
  layers.forEach((layer, row) => {
    SHEET_FACINGS.forEach((facing, col) => {
      if (layer.markup[facing]) frames[`${layer.key}__${facing}`] = { x: col * size, y: row * size, w: size, h: size };
    });
  });
  return {
    kind: 'character-layers' as const,
    family: recipe.id,
    name: recipe.name,
    frameSize: size,
    scale,
    canvas: 128,
    facings: [...SHEET_FACINGS],
    tokens: [...PALETTE_TOKENS],
    moods: [...MOODS],
    palette: recipe.palette,
    // NOTE (Article VIII): these masks are the WARM identity's geometry. IRIS's
    // operational unit is a DIFFERENT drawing (pictogram parts) and cannot be
    // produced by re-tinting them — it ships as its own layer atlas beside this
    // one (`unit-layers@Nx.png` + `unit-manifest@Nx.json`, same composer path,
    // its coding hue baked into that manifest's palette).
    pivot: { x: 0.5, y: 0.09 },
    // Composite order: stack ascending z (ties broken by order). Multiply each
    // layer by palette[tint] (skip when tint is null). Show base layers (mood
    // null) plus the one layer whose mood === the active mood.
    layers: layers.map((layer) => ({
      key: layer.key,
      slot: layer.slot,
      partId: layer.partId,
      z: layer.z,
      order: layer.order,
      tint: layer.tint,
      mood: layer.mood,
    })),
    frames,
    meta: {
      generator: 'sprite-character-creator',
      westIsMirroredEast: true,
      tintMode: 'multiply-white-mask',
      outline:
        style.outline.width > 0
          ? 'baked-silhouette-layer (layer key "outline", z -1: draw first, untinted)'
          : 'none',
    },
  };
}

/**
 * Operational-unit layer atlas (register-constitution.md Article VIII, the
 * floor rendering via Option B): the identity re-drawn as IRIS's pictogram,
 * decomposed into the SAME re-tintable layer form as the warm atlas, so the
 * sim's existing layer compositor renders it by resolving this atlas instead of
 * the warm one — no baked-sprite fork in the floor's hot path. The faceless
 * unit head carries no mood layers (characterLayers respects `noFace`), and the
 * coding hue rides in the manifest palette (unitRecipe sets `palette`).
 */
function unitLayerSheetDesc(recipe: CharacterRecipe, style: StyleSheet, scale: number): SheetDesc {
  return layerSheetDesc(unitRecipe(recipe), style, scale);
}

export function unitCharacterLayerManifest(recipe: CharacterRecipe, style: StyleSheet, scale: number) {
  const manifest = characterLayerManifest(unitRecipe(recipe), style, scale);
  return {
    ...manifest,
    meta: { ...manifest.meta, rendering: 'operational-unit', author: 'iris' },
  };
}

/**
 * Mood sheet: one row per mood (in MOODS order), one column per facing.
 * North frames are identical across moods (no face from behind) but are still
 * emitted so frame indexing stays uniform engine-side.
 */
export async function moodSheetPng(
  recipe: CharacterRecipe,
  style: StyleSheet,
  scale: number,
): Promise<Blob> {
  return asBlob(defaultRasterizer().rasterizeSheet(moodSheetDesc(recipe, style, scale)));
}

/**
 * Pose sheet: one row per pose (POSES order), one column per facing — the held
 * states of the Social Theater pipeline (CONTRACT §3.16). Full posed frames,
 * so the renderer swaps whole sprites; the pose vocabulary + presence
 * couplings ship separately in pose-catalog.json.
 */
export async function poseSheetPng(
  recipe: CharacterRecipe,
  style: StyleSheet,
  scale: number,
): Promise<Blob> {
  return asBlob(defaultRasterizer().rasterizeSheet(poseSheetDesc(recipe, style, scale)));
}

export function posesAtlas(recipe: CharacterRecipe, style: StyleSheet, scale: number) {
  const size = style.render.baseSize * scale;
  const frames: Record<string, { x: number; y: number; w: number; h: number }> = {};
  POSES.forEach((pose, row) => {
    SHEET_FACINGS.forEach((facing, col) => {
      frames[`${pose}_${facing}`] = { x: col * size, y: row * size, w: size, h: size };
    });
  });
  // The pose rig's attach points, normalized bottom-left origin (Unity pivot
  // convention) — so a runtime compositor or 3D backend binds to the same
  // skeleton the arm layers were authored against.
  const anchors: Record<string, Record<string, { x: number; y: number }>> = {};
  for (const facing of SHEET_FACINGS) {
    const rig = poseRigAnchors(facing, recipe);
    anchors[facing] = Object.fromEntries(
      Object.entries(rig).map(([name, a]) => [name, { x: a.x / CANVAS, y: (CANVAS - a.y) / CANVAS }]),
    );
  }
  return {
    name: recipe.name,
    id: recipe.id,
    frameSize: size,
    scale,
    poses: [...POSES],
    facings: [...SHEET_FACINGS],
    frames,
    pivot: { x: 0.5, y: 0.09 },
    anchors,
    meta: {
      generator: 'sprite-character-creator',
      schema: 'social-theater-presentation-experiment.md#appendix-b',
      westIsMirroredEast: true,
      catalog: 'pose-catalog.json',
      // A pose is a sim-selected held state (register: truth) — never in the recipe.
      register: 'truth',
    },
  };
}

/**
 * Operational-unit sheets: IRIS's own drawing of the identity (register-
 * constitution.md Article VIII — the floor rendering). A PICTOGRAM — coding-
 * hue figure, featureless head disc — on the same canvas, anchors and pose
 * rig, so conduct is untouched by construction (renderings.ts). Ships both
 * the 4-facing base sheet and the full pose sheet, because the floor default
 * intent is the unit rendering and the floor is where poses live.
 */
function unitSheetDesc(recipe: CharacterRecipe, style: StyleSheet, scale: number): SheetDesc {
  return characterSheetDesc(unitRecipe(recipe), style, scale);
}

function unitPoseSheetDesc(recipe: CharacterRecipe, style: StyleSheet, scale: number): SheetDesc {
  return poseSheetDesc(unitRecipe(recipe), style, scale);
}

export function unitAtlas(recipe: CharacterRecipe, style: StyleSheet, scale: number) {
  const atlas = characterAtlas(recipe, style, scale);
  return {
    ...atlas,
    meta: { ...atlas.meta, rendering: 'operational-unit', author: 'iris', warm: 'portrait@Nx.png' },
  };
}

export function unitPosesAtlas(recipe: CharacterRecipe, style: StyleSheet, scale: number) {
  const atlas = posesAtlas(recipe, style, scale);
  return {
    ...atlas,
    meta: { ...atlas.meta, rendering: 'operational-unit', author: 'iris' },
  };
}

/**
 * Corporate-identity bust (the badge photo) — one frame per scale. `mood`
 * selects the face overlay: the plain `portrait@` ships `normal`; the per-mood
 * `portrait-<mood>@` variants let a consumer (the roster row) show the same
 * expression the floor body wears for a given short-term social state.
 */
function portraitDesc(recipe: CharacterRecipe, style: StyleSheet, scale: number, mood: Mood = 'normal'): SheetDesc {
  const size = style.render.baseSize * scale;
  return {
    width: size,
    height: size,
    pixelScale: renderScale(style),
    cells: [{ svg: composePortrait(recipe, style, size, mood), dx: 0, dy: 0, dw: size, dh: size }],
  };
}

/** The non-normal moods, emitted as `portrait-<mood>@`; `normal` ships as the bare `portrait@`. */
const PORTRAIT_MOODS: Mood[] = MOODS.filter((m) => m !== 'normal');

export function moodAtlas(recipe: CharacterRecipe, style: StyleSheet, scale: number) {
  const size = style.render.baseSize * scale;
  const frames: Record<string, { x: number; y: number; w: number; h: number }> = {};
  MOODS.forEach((mood, row) => {
    SHEET_FACINGS.forEach((facing, col) => {
      frames[`${mood}_${facing}`] = { x: col * size, y: row * size, w: size, h: size };
    });
  });
  return {
    name: recipe.name,
    id: recipe.id,
    frameSize: size,
    scale,
    moods: [...MOODS],
    facings: [...SHEET_FACINGS],
    frames,
    pivot: { x: 0.5, y: 0.09 },
    meta: {
      generator: 'sprite-character-creator',
      westIsMirroredEast: true,
      northHasNoFace: true,
      // The overhead mood bubble is no longer baked into these frames; it ships
      // in the shared mood-emotes atlas, placed by the consumer at aboveHead.
      emoteBaked: false,
      overheadEmote: 'mood-emotes-atlas',
    },
  };
}

/**
 * Wall tileset: 8x6 sheet, one segment per blob tile index 0-46 in row-major
 * order (index = row * 8 + column). Indices are the shared 256→47 contract
 * (src/tiles/blob.ts + blob-index-table.json); the Unity sim computes the
 * identical table and selects frames by the same index.
 */
export async function wallTilesetPng(wall: TileInstance, style: StyleSheet, scale: number): Promise<Blob> {
  return asBlob(defaultRasterizer().rasterizeSheet(wallTilesetDesc(wall, style, scale)));
}

export function wallAtlas(wall: TileInstance, style: StyleSheet, scale: number) {
  const size = style.render.baseSize * scale;
  const frames: Record<string, { x: number; y: number; w: number; h: number; name: string }> = {};
  // Frame naming stays `mask_<i>` (D3) — "mask" now means "blob index 0..46",
  // so the sim's MaskFromFrameName parse is unchanged.
  for (let i = 0; i < BLOB_TILE_COUNT; i++) {
    frames[`mask_${i}`] = {
      x: (i % 8) * size,
      y: Math.floor(i / 8) * size,
      w: size,
      h: size,
      name: `tile_${i}`,
    };
  }
  return {
    name: wall.name,
    id: wall.id,
    templateId: wall.templateId,
    frameSize: size,
    scale,
    kind: 'wall' as const,
    bits: { N: 1, E: 2, S: 4, W: 8, NE: 16, SE: 32, SW: 64, NW: 128 },
    frames,
    pivot: { x: 0.5, y: 0.5 },
    meta: {
      generator: 'sprite-character-creator',
      autotile: '8-neighbor blob (47)',
      blobTable: 'blob-index-table.json (shared 256→47 contract; frame mask_<i> = blob index)',
      sorting: 'wall-layer',
    },
  };
}

export async function floorTilePng(floor: TileInstance, style: StyleSheet, scale: number): Promise<Blob> {
  return asBlob(defaultRasterizer().rasterizeSheet(floorTileDesc(floor, style, scale)));
}

export function floorAtlas(floor: TileInstance, style: StyleSheet, scale: number) {
  return {
    name: floor.name,
    id: floor.id,
    templateId: floor.templateId,
    frameSize: style.render.baseSize * scale,
    scale,
    kind: 'floor' as const,
    tileable: true,
    pivot: { x: 0.5, y: 0.5 },
    meta: { generator: 'sprite-character-creator', sorting: 'floor-layer (below everything)' },
  };
}

function groundOverlayTilesetDesc(overlay: TileInstance, style: StyleSheet, scale: number): SheetDesc {
  const size = style.render.baseSize * scale;
  const cells: RasterCell[] = [];
  for (let i = 0; i < BLOB_TILE_COUNT; i++) {
    cells.push({
      svg: composeGroundOverlayTile(overlay, style, BLOB_CONFIGS[i], size),
      dx: (i % 8) * size,
      dy: Math.floor(i / 8) * size,
      dw: size,
      dh: size,
    });
  }
  return { width: size * 8, height: size * 6, pixelScale: renderScale(style), cells };
}

/**
 * Ground-edge transition overlay atlas (lush-outside pass phase 3, CONTRACT
 * §3.18). Same 8x6 / 47-frame layout and `mask_<i>` naming as the wall
 * tileset — the shared blob contract — so the sim's tileset slicer and
 * frame-by-index selection are reused verbatim. Semantics differ only in what
 * a bit MEANS: for a receiving ground cell (dirt/asphalt/sidewalk), a set bit
 * says "the neighbour on that side is encroaching natural ground", and the
 * frame shows that ground's fringe bleeding over the seam. Drawn above the
 * ground layer, below the interior floor (sort band -19000).
 */
export function groundOverlayAtlas(overlay: TileInstance, style: StyleSheet, scale: number) {
  const size = style.render.baseSize * scale;
  const frames: Record<string, { x: number; y: number; w: number; h: number; name: string }> = {};
  for (let i = 0; i < BLOB_TILE_COUNT; i++) {
    frames[`mask_${i}`] = {
      x: (i % 8) * size,
      y: Math.floor(i / 8) * size,
      w: size,
      h: size,
      name: `tile_${i}`,
    };
  }
  return {
    name: overlay.name,
    id: overlay.id,
    templateId: overlay.templateId,
    frameSize: size,
    scale,
    kind: 'ground-overlay' as const,
    bits: { N: 1, E: 2, S: 4, W: 8, NE: 16, SE: 32, SW: 64, NW: 128 },
    frames,
    pivot: { x: 0.5, y: 0.5 },
    meta: {
      generator: 'sprite-character-creator',
      autotile: '8-neighbor blob (47)',
      blobTable: 'blob-index-table.json (shared 256→47 contract; frame mask_<i> = blob index)',
      maskSemantics: 'bit set = neighbour is encroaching natural ground (grass family); drawn on the receiving cell',
      sorting: 'ground-overlay-layer (above ground, below floors; sort band -19000)',
    },
  };
}

/**
 * Ground atlas — the DISTINCT ground kind (B1.5 / decision D2). Identical tile
 * geometry to a floor (rendered by the same composeFloorTile), but tagged
 * `kind: 'ground'` and carrying the ground sort band (−20000, below floors) so
 * the sim's ImportGround imports it as its own layer, drawn under the interior
 * floor and everything else, and never treated as paintable interior floor.
 */
export function groundAtlas(ground: TileInstance, style: StyleSheet, scale: number) {
  return {
    name: ground.name,
    id: ground.id,
    templateId: ground.templateId,
    frameSize: style.render.baseSize * scale,
    scale,
    kind: 'ground' as const,
    tileable: true,
    pivot: { x: 0.5, y: 0.5 },
    meta: {
      generator: 'sprite-character-creator',
      sorting: 'ground-layer (below floors; sort band -20000)',
      surface: 'outdoor',
    },
  };
}

/**
 * Prop atlas: projection drives how the engine should treat the sprite.
 * Plan props pivot at center, sit on the furniture layer below characters,
 * and rotate freely. Elevation props pivot at the base (same 9% ground
 * offset as characters), y-sort with characters, and must not rotate.
 */
export function propAtlas(prop: PropInstance, style: StyleSheet, scale: number) {
  const template = PROP_TEMPLATES.find((t) => t.id === prop.templateId);
  const projection = template?.projection ?? 'elevation';
  const placement = template?.placement ?? 'floor';
  // Whole-cell grid occupancy for the free-grid builder (office-builder pivot).
  // Unknown-template props fall back to 1×1 (single cell), pivot to footprint center.
  const gridFootprint = template?.gridFootprint ?? { w: 1, h: 1 };
  const gridPivot = template?.gridPivot ?? { x: 0.5, y: 0.5 };
  const size = style.render.baseSize * scale;
  return {
    name: prop.name,
    id: prop.id,
    templateId: prop.templateId,
    frameSize: size,
    scale,
    projection,
    placement,
    gridFootprint,
    gridPivot,
    pivot: projection === 'plan' ? { x: 0.5, y: 0.5 } : { x: 0.5, y: 0.09 },
    meta: {
      generator: 'sprite-character-creator',
      sorting: projection === 'plan' ? 'floor-layer' : 'y-sort',
      rotatable: projection === 'plan',
      wallSlot: placement === 'wall-slot',
    },
  };
}

export async function propPng(prop: PropInstance, style: StyleSheet, scale: number): Promise<Blob> {
  return asBlob(defaultRasterizer().rasterizeSheet(propDesc(prop, style, scale)));
}

// ---------------------------------------------------------------------------
// Re-tintable environment layer atlases (palette-as-runtime-lever). Each prop /
// floor also ships a `layers@Nx.png` sheet + `layers-manifest@Nx.json` (walls do
// NOT — fixed look, 47-blob plan D2)
// alongside its flat sprite: one row per re-tintable layer, token layers as white
// masks the engine multiplies by a runtime colour, mirroring the character layer
// atlas. Sheets never pixelate — re-tint masks must stay crisp/exact. The flat
// sprite stays the default; a consumer that wants runtime palette control reads
// the layer atlas instead.
// ---------------------------------------------------------------------------

type FrameRect = { x: number; y: number; w: number; h: number };

/**
 * A layer entry references its sprite BY FRAME NAME into the sheet's top-level
 * `frames` map — mirroring the character layer manifest so the sim slices every
 * sheet with the same machinery (AtlasJson + ConfigureMultipleSpriteTexture),
 * no env-layer special case. Run-based layers repeat keys (e.g. `secondary` ×3),
 * so frames are keyed by a unique index name, not the layer key.
 */
interface LayerEntry {
  key: string;
  tint: PropPaletteToken | null;
  frame: string;
}

/** Prop/floor layer atlas: a single column; frame names L0, L1, … */
function envLayerAtlas(
  layers: TileLayer[],
  size: number,
): { cells: RasterCell[]; frames: Record<string, FrameRect>; entries: LayerEntry[] } {
  const cells: RasterCell[] = [];
  const frames: Record<string, FrameRect> = {};
  const entries: LayerEntry[] = layers.map((layer, i) => {
    const name = `L${i}`;
    const y = i * size;
    cells.push({ svg: layerCellSvg(layer.markup, size), dx: 0, dy: y, dw: size, dh: size });
    frames[name] = { x: 0, y, w: size, h: size };
    return { key: layer.key, tint: layer.tint, frame: name };
  });
  return { cells, frames, entries };
}

/** Shared manifest tail — the composite rule the engine follows to re-tint. */
function layerCompositeMeta() {
  return {
    generator: 'sprite-character-creator',
    composite:
      'stack layers by ascending row; multiply each layer whose tint is non-null ' +
      'by palette[tint] (white masks preserve anti-aliasing), draw tint:null layers as-is',
  };
}

function propLayerSheetDesc(prop: PropInstance, style: StyleSheet, scale: number): SheetDesc {
  const size = style.render.baseSize * scale;
  const { cells } = envLayerAtlas(propLayers(prop, style), size);
  return { width: size, height: size * Math.max(1, cells.length), pixelScale: 1, cells };
}

export function propLayerManifest(prop: PropInstance, style: StyleSheet, scale: number) {
  const size = style.render.baseSize * scale;
  const template = PROP_TEMPLATES.find((t) => t.id === prop.templateId);
  const projection = template?.projection ?? 'elevation';
  const { frames, entries } = envLayerAtlas(propLayers(prop, style), size);
  return {
    kind: 'prop-layers' as const,
    id: prop.id,
    name: prop.name,
    templateId: prop.templateId,
    frameSize: size,
    scale,
    canvas: CANVAS,
    projection,
    placement: template?.placement ?? 'floor',
    pivot: projection === 'plan' ? { x: 0.5, y: 0.5 } : { x: 0.5, y: 0.09 },
    /** The palette tokens the engine may recolour (the runtime tint levers). */
    tokens: [...PROP_PALETTE_TOKENS],
    /** Authored default colours — an untouched import renders identically to the flat sprite. */
    palette: prop.palette,
    /** name → rect (top-down); the sim slices these like every other sheet. */
    frames,
    /** Paint order; each references its sprite by `frame` name. */
    layers: entries,
    meta: layerCompositeMeta(),
  };
}

function floorLayerSheetDesc(floor: TileInstance, style: StyleSheet, scale: number): SheetDesc {
  const size = style.render.baseSize * scale;
  const { cells } = envLayerAtlas(floorLayers(floor), size);
  return { width: size, height: size * Math.max(1, cells.length), pixelScale: 1, cells };
}

export function floorLayerManifest(floor: TileInstance, style: StyleSheet, scale: number) {
  const size = style.render.baseSize * scale;
  const { frames, entries } = envLayerAtlas(floorLayers(floor), size);
  return {
    kind: 'floor-layers' as const,
    id: floor.id,
    name: floor.name,
    templateId: floor.templateId,
    frameSize: size,
    scale,
    canvas: CANVAS,
    tileable: true,
    pivot: { x: 0.5, y: 0.5 },
    tokens: [...PROP_PALETTE_TOKENS],
    palette: floor.palette,
    frames,
    // NOTE: floor layers are coalesced per token (not paint-order runs), so the
    // stacked composite can differ imperceptibly from the flat tile where
    // translucent speckles of different tokens overlap. Acceptable for flat,
    // seamless floor patterns; run-splitting would explode the layer count.
    layers: entries,
    meta: layerCompositeMeta(),
  };
}

/** Re-tintable ground layer atlas — same tile machinery as floors (ground IS a
 *  FloorTemplate), tagged `ground-layers` so the sim keeps the distinct kind. */
export function groundLayerManifest(ground: TileInstance, style: StyleSheet, scale: number) {
  const size = style.render.baseSize * scale;
  const { frames, entries } = envLayerAtlas(floorLayers(ground), size);
  return {
    kind: 'ground-layers' as const,
    id: ground.id,
    name: ground.name,
    templateId: ground.templateId,
    frameSize: size,
    scale,
    canvas: CANVAS,
    tileable: true,
    pivot: { x: 0.5, y: 0.5 },
    tokens: [...PROP_PALETTE_TOKENS],
    palette: ground.palette,
    frames,
    layers: entries,
    meta: layerCompositeMeta(),
  };
}

// NOTE: no wall layer atlas — walls are a fixed look (47-blob plan, D2); they
// ship only the flat 47-tile autotile sheet. Floors/props keep their layer path.

export async function scenePosterPng(scene: SceneState, project: ProjectState, scale: number): Promise<Blob> {
  // Scene cells span the whole grid, so this sheet has one cell whose source
  // SVG viewBox is cols*128 × rows*128 (not the 128 the other cells use). The
  // canvas backend scales it to fill, matching the in-app poster.
  const cellSize = project.style.render.baseSize * scale;
  const width = scene.cols * cellSize;
  const height = scene.rows * cellSize;
  return asBlob(
    defaultRasterizer().rasterizeSheet({
      width,
      height,
      pixelScale: renderScale(project.style),
      cells: [{ svg: composeSceneSvg(scene, project, cellSize), dx: 0, dy: 0, dw: width, dh: height }],
    }),
  );
}

// ---------------------------------------------------------------------------
// Employee / population exports (Office Population Generator)
// ---------------------------------------------------------------------------

/** South-facing full-body sprite for an employee (no overhead badge). */
export async function employeeSpritePng(recipe: CharacterRecipe, style: StyleSheet, scale: number): Promise<Blob> {
  const size = style.render.baseSize * scale;
  const img = await svgToImage(composeCharacter(recipe, style, 'south', size, 'normal', { badge: false }));
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  canvas.getContext('2d')!.drawImage(img, 0, 0, size, size);
  return canvasToBlob(canvas);
}

/** Portrait crop (head + upper torso) for an employee profile card. */
export async function employeePortraitPng(recipe: CharacterRecipe, style: StyleSheet, scale: number): Promise<Blob> {
  const out = style.render.baseSize * scale;
  const render = 512; // render the full figure crisply, then crop
  const img = await svgToImage(composeCharacter(recipe, style, 'south', render, 'normal', { badge: false }));
  const canvas = document.createElement('canvas');
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  // Crop the 128-unit design region around this body's head+shoulders, then
  // scale to output. Legacy bodies still resolve to the exact 24/14/80/80 crop.
  const k = render / 128;
  const crop = employeePortraitCrop(recipe);
  ctx.drawImage(img, crop.x * k, crop.y * k, crop.w * k, crop.h * k, 0, 0, out, out);
  return canvasToBlob(canvas);
}

/**
 * Unity employee package: one folder per employee with sprite.png, portrait.png,
 * and employee.json, plus a roster.json. Drag a folder into Unity to use it.
 */
export async function employeePackageZip(
  employees: EmployeeDefinition[],
  style: StyleSheet,
  scale: number,
): Promise<Blob> {
  const zip = new JSZip();
  for (const emp of employees) {
    const recipe = employeeRecipe(emp);
    const dir = zip.folder(`Employee_${emp.visualSeed}`)!;
    dir.file('sprite.png', await employeeSpritePng(recipe, style, scale));
    dir.file('portrait.png', await employeePortraitPng(recipe, style, scale));
    dir.file('employee.json', JSON.stringify(emp, null, 2));
  }
  zip.file(
    'roster.json',
    JSON.stringify(
      employees.map((e) => ({ name: e.name, visualSeed: e.visualSeed, profile: e.profile })),
      null,
      2,
    ),
  );
  return zip.generateAsync({ type: 'blob' });
}

export function downloadBlob(name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  // Give the browser a beat before revoking, or the download can race it.
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function downloadJson(name: string, data: unknown): void {
  downloadBlob(name, new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unnamed';
}

/** Progress callback for exportAll — fired after each rendered PNG. */
export type ExportProgress = (done: number, total: number, label: string) => void;

/** Where exported files land. Keys are full POSIX paths ("characters/x/y.png"). */
export interface ExportSink {
  file(path: string, data: string | PngBytes): void | Promise<void>;
}

/**
 * Regenerate the entire asset set — every character sheet/moods/layers, prop,
 * wall, and floor at 1x/2x/4x with atlas JSON, the project file, and (when a
 * scene exists) office-layout.json — into a sink, rasterizing PNGs through the
 * given backend. This is the single source of truth for the export tree; both
 * the in-browser zip (canvas backend) and the headless CLI (resvg backend) call
 * it, so their outputs are structurally identical.
 */
export async function exportAll(
  rawProject: ProjectState,
  opts: { sink: ExportSink; rasterizer: Rasterizer; onProgress?: ExportProgress; scenarioTemplates?: ScenarioTemplate[] },
): Promise<void> {
  const { sink, rasterizer, onProgress } = opts;
  // Render every asset through the project's LOOK (a non-destructive lens over the
  // authored palettes — see core/look.ts). This is what makes the look reproducible:
  // it re-derives on every export instead of depending on a one-time palette sweep.
  // project.json below ships the RAW authored project (+ the look flag) so re-import
  // preserves the editable palettes and never double-applies the look.
  const project = projectWithLook(rawProject);
  const { style } = project;
  const scales = EXPORT_SCALES.length;

  // Total PNG renders (the slow part): per character sheet + moods + layers,
  // plus one per prop/wall/floor — each across every scale.
  const total =
    project.characters.length * scales * 8 +
    CONSTRUCTION_CREW.length * scales * 2 + // construction crew: base+moods, layers per scale
    project.props.length * scales +
    (project.walls?.length ?? 0) * scales +
    (project.floors?.length ?? 0) * scales +
    (project.ground?.length ?? 0) * scales + // distinct ground kind (B1.5 / D2)
    deriveGroundOverlays(project.ground).length * scales + // ground-edge transition overlays
    scales * 6 + // shared activity/mood/prop-status/social-state/emotion-glyph/attention-puff atlas per scale
    ICONS.length + // one tick per UI icon (its SVG + PNG ladder)
    CURSORS.length; // one tick per cursor (PNG ladder)
  let done = 0;
  const tick = (label: string) => {
    done += 1;
    onProgress?.(done, total, label);
  };
  const png = (desc: SheetDesc) => rasterizer.rasterizeSheet(desc);
  const write = (path: string, data: string | PngBytes) => sink.file(path, data);

  for (const recipe of project.characters) {
    // Slug off the recipe id, not the display name: the id is the engine
    // binding key (layer atlas Family = recipe id = the sim's AgentId), so the
    // exported folder name must be stable and match the consuming agent id.
    const dir = `characters/${slug(recipe.id)}`;
    for (const scale of EXPORT_SCALES) {
      await write(`${dir}/sheet@${scale}x.png`, await png(characterSheetDesc(recipe, style, scale)));
      await write(`${dir}/atlas@${scale}x.json`, JSON.stringify(characterAtlas(recipe, style, scale), null, 2));
      tick(recipe.name);
      await write(`${dir}/moods@${scale}x.png`, await png(moodSheetDesc(recipe, style, scale)));
      await write(`${dir}/moods-atlas@${scale}x.json`, JSON.stringify(moodAtlas(recipe, style, scale), null, 2));
      tick(`${recipe.name} moods`);
      await write(`${dir}/poses@${scale}x.png`, await png(poseSheetDesc(recipe, style, scale)));
      await write(`${dir}/poses-atlas@${scale}x.json`, JSON.stringify(posesAtlas(recipe, style, scale), null, 2));
      tick(`${recipe.name} poses`);
      await write(`${dir}/unit@${scale}x.png`, await png(unitSheetDesc(recipe, style, scale)));
      await write(`${dir}/unit-atlas@${scale}x.json`, JSON.stringify(unitAtlas(recipe, style, scale), null, 2));
      tick(`${recipe.name} unit`);
      await write(`${dir}/unit-poses@${scale}x.png`, await png(unitPoseSheetDesc(recipe, style, scale)));
      await write(`${dir}/unit-poses-atlas@${scale}x.json`, JSON.stringify(unitPosesAtlas(recipe, style, scale), null, 2));
      tick(`${recipe.name} unit poses`);
      await write(`${dir}/portrait@${scale}x.png`, await png(portraitDesc(recipe, style, scale)));
      // Per-mood head-cropped portraits — the roster face reads the sim's
      // short-term social state from these (portrait-<mood>@); `normal` stays the
      // bare portrait@ above. Same bust crop, so they slot into a face-sized cell.
      for (const mood of PORTRAIT_MOODS) {
        await write(`${dir}/portrait-${mood}@${scale}x.png`, await png(portraitDesc(recipe, style, scale, mood)));
      }
      tick(`${recipe.name} portrait`);
    }
    // The recipe is the IDENTITY; renderings are how each author draws it
    // (Article VIII). `renderings.unit` ships IRIS's drawing spec (pictogram
    // parts + coding palette) so any consumer can re-derive the unit exactly.
    await write(
      `${dir}/recipe.json`,
      JSON.stringify({ ...recipe, renderings: { unit: unitRenderingSpec(recipe) } }, null, 2),
    );
    // The full-game persona (sim-consumer form: derived fields resolved to plain
    // numbers). Keyed by agentId == recipe id; emitted only when authored.
    const profile = project.profiles?.find((p) => p.agentId === recipe.id);
    if (profile) await write(`${dir}/profile.json`, JSON.stringify(serializeProfile(profile), null, 2));
  }

  // Re-tintable layer atlases (Phase 2.2 / runtime NPC compositor input). Kept
  // in a separate top-level folder so the layer importer iterates it distinctly
  // from the baked character sheets above.
  for (const recipe of project.characters) {
    // Layer-atlas folder is keyed by recipe id too — this is the Family the
    // runtime NPC composer resolves by AgentId (see SPRITE_INTEGRATION.md W4).
    const dir = `character-layers/${slug(recipe.id)}`;
    for (const scale of EXPORT_SCALES) {
      await write(`${dir}/layers@${scale}x.png`, await png(layerSheetDesc(recipe, style, scale)));
      await write(`${dir}/manifest@${scale}x.json`, JSON.stringify(characterLayerManifest(recipe, style, scale), null, 2));
      tick(`${recipe.name} layers`);
      // IRIS's operational-unit rendering as a sibling layer atlas (Article VIII,
      // Option B) — the floor composes this instead of the warm one for the unit view.
      await write(`${dir}/unit-layers@${scale}x.png`, await png(unitLayerSheetDesc(recipe, style, scale)));
      await write(`${dir}/unit-manifest@${scale}x.json`, JSON.stringify(unitCharacterLayerManifest(recipe, style, scale), null, 2));
      tick(`${recipe.name} unit layers`);
    }
    await write(`${dir}/recipe.json`, JSON.stringify(recipe, null, 2));
  }

  // Construction crew (B1.5 / decision D4) — an authored construction PERSONA the
  // sim spawns the build crew from, shipped as a code-owned ingredient in its OWN
  // `construction-crew/` folder so it stays decoupled from the editable office cast
  // (never seated, never in the org chart) and never trips the 4-hero agent-id
  // lockstep. Ships the binder's essential set: baked sheet+atlas, the mood overlay
  // atlas, the re-tintable layer atlas (the NPC composer's input), and IRIS's
  // operational-unit rendering, plus the recipe + persona.
  for (const recipe of CONSTRUCTION_CREW) {
    const dir = `construction-crew/${slug(recipe.id)}`;
    for (const scale of EXPORT_SCALES) {
      await write(`${dir}/sheet@${scale}x.png`, await png(characterSheetDesc(recipe, style, scale)));
      await write(`${dir}/atlas@${scale}x.json`, JSON.stringify(characterAtlas(recipe, style, scale), null, 2));
      await write(`${dir}/moods@${scale}x.png`, await png(moodSheetDesc(recipe, style, scale)));
      await write(`${dir}/moods-atlas@${scale}x.json`, JSON.stringify(moodAtlas(recipe, style, scale), null, 2));
      tick(recipe.name);
      await write(`${dir}/layers@${scale}x.png`, await png(layerSheetDesc(recipe, style, scale)));
      await write(`${dir}/manifest@${scale}x.json`, JSON.stringify(characterLayerManifest(recipe, style, scale), null, 2));
      await write(`${dir}/unit-layers@${scale}x.png`, await png(unitLayerSheetDesc(recipe, style, scale)));
      await write(`${dir}/unit-manifest@${scale}x.json`, JSON.stringify(unitCharacterLayerManifest(recipe, style, scale), null, 2));
      tick(`${recipe.name} layers`);
    }
    await write(
      `${dir}/recipe.json`,
      JSON.stringify({ ...recipe, renderings: { unit: unitRenderingSpec(recipe) } }, null, 2),
    );
    const profile = CONSTRUCTION_PROFILES.find((p) => p.agentId === recipe.id);
    if (profile) await write(`${dir}/profile.json`, JSON.stringify(serializeProfile(profile), null, 2));
  }

  for (const prop of project.props) {
    const dir = `props/${slug(prop.name)}`;
    for (const scale of EXPORT_SCALES) {
      await write(`${dir}/sprite@${scale}x.png`, await png(propDesc(prop, style, scale)));
      await write(`${dir}/atlas@${scale}x.json`, JSON.stringify(propAtlas(prop, style, scale), null, 2));
      // Re-tintable layer atlas (palette-as-runtime-lever) beside the flat sprite.
      await write(`${dir}/layers@${scale}x.png`, await png(propLayerSheetDesc(prop, style, scale)));
      await write(`${dir}/layers-manifest@${scale}x.json`, JSON.stringify(propLayerManifest(prop, style, scale), null, 2));
      tick(prop.name);
    }
    await write(`${dir}/prop.json`, JSON.stringify(prop, null, 2));
  }

  for (const wall of project.walls ?? []) {
    const dir = `walls/${slug(wall.name)}`;
    for (const scale of EXPORT_SCALES) {
      // Flat 47-blob autotile only — no re-tintable wall layer atlas (D2).
      await write(`${dir}/tileset@${scale}x.png`, await png(wallTilesetDesc(wall, style, scale)));
      await write(`${dir}/atlas@${scale}x.json`, JSON.stringify(wallAtlas(wall, style, scale), null, 2));
      tick(wall.name);
    }
    await write(`${dir}/wall.json`, JSON.stringify(wall, null, 2));
  }

  for (const floor of project.floors ?? []) {
    const dir = `floors/${slug(floor.name)}`;
    for (const scale of EXPORT_SCALES) {
      await write(`${dir}/tile@${scale}x.png`, await png(floorTileDesc(floor, style, scale)));
      await write(`${dir}/atlas@${scale}x.json`, JSON.stringify(floorAtlas(floor, style, scale), null, 2));
      // Re-tintable layer atlas beside the flat tile.
      await write(`${dir}/layers@${scale}x.png`, await png(floorLayerSheetDesc(floor, style, scale)));
      await write(`${dir}/layers-manifest@${scale}x.json`, JSON.stringify(floorLayerManifest(floor, style, scale), null, 2));
      tick(floor.name);
    }
    await write(`${dir}/floor.json`, JSON.stringify(floor, null, 2));
  }

  // Outdoor ground (B1.5 "the build site") — the DISTINCT ground kind (decision
  // D2): its own top-level `ground/` folder, atlases tagged `kind: 'ground'` with
  // the −20000 sort band, so the sim's ImportGround pulls them in as a separate
  // layer (drawn under the interior floor) rather than as paintable floor. Same
  // flat-tile machinery as floors otherwise (ground templates ARE FloorTemplates).
  for (const g of project.ground ?? []) {
    const dir = `ground/${slug(g.name)}`;
    for (const scale of EXPORT_SCALES) {
      await write(`${dir}/tile@${scale}x.png`, await png(floorTileDesc(g, style, scale)));
      await write(`${dir}/atlas@${scale}x.json`, JSON.stringify(groundAtlas(g, style, scale), null, 2));
      // Re-tintable layer atlas beside the flat tile (kind: ground-layers).
      await write(`${dir}/layers@${scale}x.png`, await png(floorLayerSheetDesc(g, style, scale)));
      await write(`${dir}/layers-manifest@${scale}x.json`, JSON.stringify(groundLayerManifest(g, style, scale), null, 2));
      tick(g.name);
    }
    await write(`${dir}/ground.json`, JSON.stringify(g, null, 2));
  }

  // Ground-edge transition overlays (lush-outside pass phase 3) — code-owned,
  // DERIVED from the ground set (grass palette → fringe palette, so the
  // clinical-look natural-ground exemption flows through automatically). Same
  // 47-blob tileset shape as walls; the sim's fringe pass selects frames by
  // the shared blob index (CONTRACT §3.18).
  for (const overlay of deriveGroundOverlays(project.ground)) {
    const dir = `ground-overlays/${slug(overlay.name)}`;
    for (const scale of EXPORT_SCALES) {
      await write(`${dir}/tileset@${scale}x.png`, await png(groundOverlayTilesetDesc(overlay, style, scale)));
      await write(`${dir}/atlas@${scale}x.json`, JSON.stringify(groundOverlayAtlas(overlay, style, scale), null, 2));
      tick(overlay.name);
    }
    await write(`${dir}/overlay.json`, JSON.stringify(overlay, null, 2));
  }

  // Shared activity-badge atlas (one per scale, character-independent). The sim
  // blits a cell above any agent keyed off its routine `activity` string.
  for (const scale of EXPORT_SCALES) {
    await write(`activity-badges@${scale}x.png`, await png(activityBadgesDesc(style, scale)));
    await write(`activity-badges-atlas@${scale}x.json`, JSON.stringify(activityBadgesAtlas(style, scale), null, 2));
    tick('activity badges');
    await write(`mood-emotes@${scale}x.png`, await png(moodEmotesDesc(style, scale)));
    await write(`mood-emotes-atlas@${scale}x.json`, JSON.stringify(moodEmotesAtlas(style, scale), null, 2));
    tick('mood emotes');
    await write(`prop-status-badges@${scale}x.png`, await png(propStatusBadgesDesc(style, scale)));
    await write(`prop-status-badges-atlas@${scale}x.json`, JSON.stringify(propStatusBadgesAtlas(style, scale), null, 2));
    tick('prop status badges');
    await write(`social-state-badges@${scale}x.png`, await png(socialStateBadgesDesc(style, scale)));
    await write(`social-state-badges-atlas@${scale}x.json`, JSON.stringify(socialStateBadgesAtlas(style, scale), null, 2));
    tick('social state badges');
    await write(`emotion-glyphs@${scale}x.png`, await png(emotionGlyphsDesc(style, scale)));
    await write(`emotion-glyphs-atlas@${scale}x.json`, JSON.stringify(emotionGlyphsAtlas(style, scale), null, 2));
    tick('emotion glyphs');
    await write(`attention-puffs@${scale}x.png`, await png(attentionPuffsDesc(style, scale)));
    await write(`attention-puffs-atlas@${scale}x.json`, JSON.stringify(attentionPuffsAtlas(style, scale), null, 2));
    tick('attention puffs');
  }
  // UI icon set — framing-UI glyphs (docs/ui-art-plan.md). Each icon emits a
  // resolution-independent SVG (UI Toolkit VectorImage) plus a non-pixelated PNG
  // ladder (uGUI Sprite) from one definition, so assets survive the uGUI→UI
  // Toolkit migration without re-authoring. tintable icons are white masks the
  // framework recolors from theme.uss (--wc-*).
  for (const icon of ICONS) {
    await write(`icons/${icon.id}.svg`, composeIcon(icon.id));
    for (const scale of EXPORT_SCALES) {
      await write(`icons/${icon.id}@${scale}x.png`, await png(iconDesc(icon.id, style, scale)));
    }
    tick(`icon ${icon.id}`);
  }
  await write('icons/icons-manifest.json', JSON.stringify(iconsManifest(), null, 2));

  // Cursors — PNG-only (USS `cursor` / uGUI take a texture + hotspot, not a
  // vector). composeIcon renders the literal ink-on-halo glyph; the manifest
  // carries each hotspot.
  for (const cursor of CURSORS) {
    for (const scale of EXPORT_SCALES) {
      await write(`cursors/${cursor.id}@${scale}x.png`, await png(iconDesc(cursor.id, style, scale)));
    }
    tick(`cursor ${cursor.id}`);
  }
  await write('cursors/cursors-manifest.json', JSON.stringify(cursorsManifest(), null, 2));

  // Conversation style — the sim draws the connector between paired talking
  // agents from this (tool owns the look, sim owns pairing + placement).
  await write('conversation-style.json', JSON.stringify(conversationStyleJson(), null, 2));

  // Floor-overlay style spec (Epic 36) — the look the Shapes floor layer reads to
  // draw relationship arcs / pressure halos / info packets / belief tints from sim
  // state. Tool owns the look (colors → theme --wc-*); Shapes owns the drawing.
  await write('overlay-style.json', JSON.stringify(overlayStyleJson(), null, 2));

  // Symbol registry — every symbol id above resolved to its register (truth /
  // human / iris) + provenance + mirrors (register-constitution.md Article I:
  // no unregistered speech; CONTRACT.md §3.15). Derived, never hand-edited.
  await write('symbol-registry.json', JSON.stringify(symbolRegistryJson(), null, 2));

  // Pose catalog — the beat-schedule contract's tool half (CONTRACT §3.16):
  // pose ids + reads-as + presence couplings + transform hints. Sequencing
  // (beats, dwell, blocking) is the sim Director's; frames ship per character.
  await write('pose-catalog.json', JSON.stringify(poseCatalogJson(), null, 2));

  // Shared UI theme — the single palette the framing UI resolves so chrome and
  // world agree without sharing a pipeline (docs/ui-art-plan.md). theme.uss for
  // UI Toolkit, theme.json for uGUI / non-USS consumers. `--wc-line` carries the
  // project's actual outline color so the theme matches the world it ships with.
  await write('theme.uss', themeUss(style));
  await write('theme.json', themeJson(style));

  onProgress?.(total, total, 'writing');
  // Ship the RAW authored project (vivid palettes + the look flag) so a re-import
  // keeps editable colors and re-derives the look rather than double-applying it.
  await write('project.json', JSON.stringify(rawProject, null, 2));
  // The company root (Epic 0 F0.8) — present only for a generated company package.
  // company.json sits at the bundle root with the org-structure / personas /
  // relationships / office-layout / scenarios below it as its children.
  if (project.company) {
    await write('company.json', JSON.stringify(serializeCompany(project.company), null, 2));
  }
  // The reusable drive + trait catalogs personas reference by id (see CONTRACT.md).
  await write('drives.json', JSON.stringify(project.drives, null, 2));
  await write('traits.json', JSON.stringify(project.traits, null, 2));
  // The reusable relationship-type catalog edges reference by id (CONTRACT §3.7) —
  // a bundle-root sibling of drives/traits (also embedded in each scenario package).
  await write('relationshipTypes.json', JSON.stringify(project.relationshipTypes, null, 2));
  // The department catalog — the single org model the office-scale work references
  // by stable id (Epic 2 F2.1).
  await write('departments.json', JSON.stringify(project.departments, null, 2));
  // The reusable workplace-behavior catalog (CONTRACT §3.14) — observable actions the
  // sim selects for agents under pressure. Tool authors the catalog; sim owns
  // selection. A bundle-root sibling of drives/traits (also embedded per scenario).
  await write('behaviors.json', JSON.stringify(project.behaviors, null, 2));
  // The org-structure artifact — departments + members with a visible-structure /
  // fogged-contents split the sim renders as the org chart (Epic 2 F2.2).
  await write('org-structure.json', JSON.stringify(buildOrgStructure(project), null, 2));
  if (project.scene) {
    await write('office-layout.json', JSON.stringify(sceneToLayoutJson(project.scene, project), null, 2));
  }
  // The builder-facing facility catalog (office-builder pivot; terrarium-office-
  // builder-assets.md §1) — a curated subset of the prop/wall templates flagged as
  // placeable facilities, each mirroring the sim's FacilityDefinition (grid footprint,
  // placement, rotatable, blocksWalk, interaction anchor). A stable, code-derived
  // manifest (no project data), so it ships in every bundle. Schema is provisional
  // (version 0) until B1 placement is proven.
  await write('facility-catalog.json', JSON.stringify(facilityCatalogJson(), null, 2));
  // The cast-agnostic scenario-template library (Epic 4 F4.1) — the sim's runtime
  // caster binds these onto the live cast/office by precondition match (§3.8/§5.7).
  // The library is passed in (the UI supplies ROLE_TEMPLATES) so core carries no
  // `data` dependency; omitted when no library is provided.
  const scenarioTemplates = opts.scenarioTemplates ?? [];
  if (scenarioTemplates.length) {
    await write('scenario-template.json', JSON.stringify(serializeScenarioTemplateLibrary(scenarioTemplates), null, 2));
  }
  // Authored run definitions as split packages under scenarios/<id>/ — Unity can
  // load a package directly (scenario.json + employees/relationships/beliefs/
  // knowledge/interaction-anchors + office-layout). See buildScenarioPackage.
  for (const scenario of project.scenarios ?? []) {
    const dir = `scenarios/${slug(scenario.scenarioId)}`;
    const pkg = buildScenarioPackage(scenario, project);
    for (const [file, data] of Object.entries(pkg)) {
      await write(`${dir}/${file}`, JSON.stringify(data, null, 2));
    }
  }
}

/**
 * Export the whole project as a zip (browser path). Thin wrapper over exportAll
 * with the canvas rasterizer and a JSZip sink — unchanged output vs before.
 */
export async function exportAllZip(
  project: ProjectState,
  onProgress?: ExportProgress,
  scenarioTemplates?: ScenarioTemplate[],
): Promise<Blob> {
  const zip = new JSZip();
  const sink: ExportSink = { file: (path, data) => void zip.file(path, data as Blob | Uint8Array | string) };
  await exportAll(project, { sink, rasterizer: defaultRasterizer(), onProgress, scenarioTemplates });
  return zip.generateAsync({ type: 'blob' });
}
