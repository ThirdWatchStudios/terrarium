import type { StyleSheet } from '../core/types';

/**
 * Canonical Water Cooler palette — the single source of truth for every color
 * the tool emits as UI. World sprites tint per-recipe (skin/hair/outfit…); THIS
 * is the shared, semantic set that UI chrome (theme.uss / theme.json) and the
 * diegetic emote/icon masks both resolve, so the framing UI and the world agree
 * without sharing a pipeline. See docs/ui-art-plan.md.
 *
 * Repointed literals live here now — do not edit a hex in two places:
 *   - INK in parts/library.ts and parts/moods.ts        -> ink
 *   - GLYPH white in parts/activities.ts and parts/moods.ts -> onColor
 *   - badge bubble fills in parts/activities.ts          -> emote.*
 *   - badge bubble fills in parts/moods.ts               -> emote.*
 */

// Base hues — spread around the wheel for crowd legibility. The emote bubbles
// and the semantic status colors both draw from these, so status.info IS the
// working blue, status.danger IS the hostile red, etc. — they coincide by
// construction rather than by eye.
const BLUE = '#4C84E0';
const GREEN = '#46C07A';
const PURPLE = '#9B6CF0';
const AMBER = '#E0A03A';
const ORANGE = '#E0772F';
const GREY = '#8A9099';
const TEAL = '#2FA98F';
const SKY = '#5B8DEF';
const INDIGO = '#6E5BC4';
const AZURE = '#3E78C8';
const RED = '#CE4038';
const SLATE = '#5B6B7A';
const ROSE = '#D8638F';
const TEAL_BLUE = '#2E89A8'; // Epic 36 single institutional accent (ui_visual_design.md)
const CORAL = '#C76B3F'; // rumor pole of the belief-drift axis

export const UI_PALETTE = {
  /** Near-black ink — eyes, hardware, bubble rings, and UI text. */
  ink: '#2C2C2A',
  /** White sitting on a colored fill (glyph-on-bubble, text-on-accent). */
  onColor: '#FFFFFF',
  /** Surveillance-workstation chrome (Epic 36): desaturated charcoal base, slate
   *  raised panels, light text. Dark by design — the operator's monitor. */
  surface: '#1E2329',
  panel: '#2A323A',
  text: '#E6E9EC',
  textMuted: '#98A2AC',
  /** Single institutional accent — teal-blue (ui_visual_design.md "Visual Language"). */
  accent: TEAL_BLUE,
  /** Semantic status colors for chrome. info === the institutional accent. */
  status: {
    info: TEAL_BLUE,
    positive: GREEN,
    warning: AMBER,
    danger: RED,
    neutral: GREY,
  },
  /** Floor-overlay channel hues (Epic 36 Visual Language). Shapes draws the floor
   *  from these; overlay-style.json carries the form/weight/motion per channel.
   *  One channel per concept — colors may repeat across channels because the FORM
   *  (line vs marker-tint vs halo vs token) is what distinguishes them. */
  channel: {
    trust: TEAL_BLUE, // cool tie; line weight encodes strength
    suspicion: AMBER, // warm dashed tie
    hostility: RED, // active conflict (used rarely, so it means something)
    beliefTruth: TEAL_BLUE, // official-truth pole of the belief axis
    beliefRumor: CORAL, // rumor pole of the belief axis
    pressure: AMBER, // stress halo; pulse rate (motion) encodes intensity
    information: TEAL_BLUE, // carried rumor token
    change: '#FFFFFF', // single-pulse flash on a recent change
    surveillance: TEAL_BLUE, // scan / REC framing tint
  },
  /** Relationship-category hues — diegetic, baked into literal relationship icons. */
  relationship: {
    professional: SLATE,
    social: GREEN,
    romantic: ROSE,
    adversarial: RED,
  },
  /** Diegetic overhead-emote bubble hues (activity + mood badges). */
  emote: {
    work: BLUE,
    talking: GREEN,
    meeting: PURPLE,
    break: AMBER,
    lunch: ORANGE,
    idle: GREY,
    walk: TEAL,
    monitoring: SKY,
    moodSuspicious: INDIGO,
    moodCurious: AZURE,
    moodDefensive: AMBER,
    moodHostile: RED,
    moodConfused: TEAL,
  },
} as const;

/**
 * The exported theme as a flat `name -> hex` map. Framework-neutral, so uGUI
 * (theme.json) and UI Toolkit (theme.uss) emit the same palette. `line` is the
 * project's ACTUAL outline color, not a constant, so the theme reflects the
 * world it ships beside.
 */
export function themeColors(style: StyleSheet): Record<string, string> {
  return {
    ink: UI_PALETTE.ink,
    'on-color': UI_PALETTE.onColor,
    line: style.outline.color,
    surface: UI_PALETTE.surface,
    panel: UI_PALETTE.panel,
    text: UI_PALETTE.text,
    'text-muted': UI_PALETTE.textMuted,
    accent: UI_PALETTE.accent,
    'status-info': UI_PALETTE.status.info,
    'status-positive': UI_PALETTE.status.positive,
    'status-warning': UI_PALETTE.status.warning,
    'status-danger': UI_PALETTE.status.danger,
    'status-neutral': UI_PALETTE.status.neutral,
    trust: UI_PALETTE.channel.trust,
    suspicion: UI_PALETTE.channel.suspicion,
    hostility: UI_PALETTE.channel.hostility,
    'belief-truth': UI_PALETTE.channel.beliefTruth,
    'belief-rumor': UI_PALETTE.channel.beliefRumor,
    pressure: UI_PALETTE.channel.pressure,
    information: UI_PALETTE.channel.information,
    change: UI_PALETTE.channel.change,
    surveillance: UI_PALETTE.channel.surveillance,
    'rel-professional': UI_PALETTE.relationship.professional,
    'rel-social': UI_PALETTE.relationship.social,
    'rel-romantic': UI_PALETTE.relationship.romantic,
    'rel-adversarial': UI_PALETTE.relationship.adversarial,
    'emote-work': UI_PALETTE.emote.work,
    'emote-talking': UI_PALETTE.emote.talking,
    'emote-meeting': UI_PALETTE.emote.meeting,
    'emote-break': UI_PALETTE.emote.break,
    'emote-lunch': UI_PALETTE.emote.lunch,
    'emote-idle': UI_PALETTE.emote.idle,
    'emote-walk': UI_PALETTE.emote.walk,
    'emote-monitoring': UI_PALETTE.emote.monitoring,
    'emote-mood-suspicious': UI_PALETTE.emote.moodSuspicious,
    'emote-mood-curious': UI_PALETTE.emote.moodCurious,
    'emote-mood-defensive': UI_PALETTE.emote.moodDefensive,
    'emote-mood-hostile': UI_PALETTE.emote.moodHostile,
    'emote-mood-confused': UI_PALETTE.emote.moodConfused,
  };
}

/** UI Toolkit theme: `:root` custom properties (`--wc-<name>`). */
export function themeUss(style: StyleSheet): string {
  const vars = Object.entries(themeColors(style))
    .map(([name, hex]) => `  --wc-${name}: ${hex};`)
    .join('\n');
  return (
    '/* The Water Cooler — generated UI theme. Single source of truth: the tool\n' +
    '   palette (src/data/uiPalette.ts). Do not hand-edit; re-export from Terrarium. */\n' +
    `:root {\n${vars}\n}\n`
  );
}

/** Framework-neutral theme for uGUI / non-USS consumers. */
export function themeJson(style: StyleSheet): string {
  return JSON.stringify({ palette: themeColors(style) }, null, 2);
}
