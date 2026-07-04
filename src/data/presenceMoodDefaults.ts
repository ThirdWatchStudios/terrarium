/**
 * Default mood-expression templates — the "typical" way a body physically expresses
 * each mood, as sparse presence deltas over the baseline (see CONTRACT.md §5.8 and
 * core/profile.ts `PresenceMoodMap`). These are a starting point the author stamps
 * with "fill typical" and then varies per character — the whole point of the system
 * is that the SAME mood looks different on different bodies, so these are defaults to
 * diverge from, not a contract. Like the presence presets, this is an authoring-time
 * library: NOT a project catalog and NOT exported. `normal` is the baseline (no map).
 *
 * Magnitudes are moderate (~±10–25) so a mood reads as a lean, not a slam; deltas are
 * bipolar and clamped on apply.
 */
import type { Mood } from '../core/types';
import type { PresenceChannel } from '../core/profile';

export const DEFAULT_MOOD_EXPRESSION: Record<Mood, Partial<Record<PresenceChannel, number>>> = {
  // Baseline — no modulation.
  normal: {},
  // Anxious — keyed up and self-protective: more space, jittery, scans, hesitant.
  anxious: { personalSpace: 15, restlessness: 20, attentiveness: 15, gaitControl: -10, expressiveness: -10, commitment: -10 },
  // Slighted — withdrawn and stewing: pulls back, closes off, slow to re-engage.
  slighted: { personalSpace: 15, expressiveness: -15, latency: 10, commitment: -10, restlessness: 10 },
  // Confident — open and decisive: closes distance, animated, quick, committed.
  confident: { personalSpace: -15, expressiveness: 20, latency: -10, commitment: 20, gaitControl: 10, gaitSpeed: 5 },
  // Braced and contained: more space, tighter control, less open, a little keyed up.
  defensive: { personalSpace: 20, gaitControl: 10, expressiveness: -15, restlessness: 10, commitment: -5 },
  // Reassured — settled and calm: relaxes in, steadier, warmer, quicker to commit.
  reassured: { personalSpace: -10, restlessness: -15, gaitControl: 10, expressiveness: 10, commitment: 10 },
};

/** The default deltas for a mood (a fresh object), or `{}` for the baseline / unknown. */
export function moodExpressionDefault(mood: Mood): Partial<Record<PresenceChannel, number>> {
  return { ...(DEFAULT_MOOD_EXPRESSION[mood] ?? {}) };
}
