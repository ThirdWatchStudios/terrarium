# Social Theater Presentation Experiment

**Status:** protocol drafted 2026-06-30 · pre-registered before any build
**Question it settles:** does Terrarium's 2D posed-silhouette language communicate Social
Theater *transitions* well enough to keep, or is a 3D presentation backend justified?

This protocol is designed to prevent the 3D decision from becoming vibes soup. Read the
**Threats to validity** section before running — most naïve versions of this test quietly rig
themselves in favor of 3D.

---

## 1. Goal

Determine whether the 2D posed-silhouette approach can communicate a social-theater *transition
sequence* — not a frozen tableau — well enough that a 3D backend is **not** warranted.

## 2. Hypothesis (pre-registered)

- **H1 (ours):** The legibility problem is **not 2D itself**. It is (a) the armless-capsule
  renderer and (b) the absence of scheduled pose *beats*. Fix both and 2D communicates the scene.
- **H0 (null):** Even at its ceiling — posed silhouettes *plus* beat scheduling — 2D cannot
  communicate the transitions; a constrained 3D backend does, for reasons of **transition
  readability**, not aesthetics.
- **H2 (the north-star wrinkle, added 2026-06-30):** Comprehension is not the goal —
  **watchability** is (§7). Abstraction may *aid* watchability even where it costs comprehension:
  a silhouette invites the viewer to project (the RimWorld / Slay-the-Spire imagination gap),
  where a literal 3D body resolves the ambiguity and closes it. So B may score *lower* on
  comprehension and *higher* on watchability than C — and a comprehension-only rule would kill the
  better option. The protocol therefore measures both, and neither alone decides (§8).

The experiment is built to give H0 a fair chance to win and to make sure that if it wins, it
wins for the *right reason*.

## 3. The three builds

All three render the **same scene, same beat order, same dwell timing, same orthographic camera,
same workstation UI framing, same zoom.** The only thing that varies is the presentation backend.

| | Build | Ceiling requirement |
|---|---|---|
| **A** | Current capsule language | As-is. Armless capsule + head, mood/activity badges, floor overlays. This is the *control* / floor. |
| **B** | **2D posed silhouettes + beat scheduling** | **Must be built at ceiling.** Shoulders+arms pose layer (Appendix B), transitions as Director-scheduled sequences of held pose-states with per-beat dwell times, blocking shaped by Presence transition signatures (`latency`/`commitment`/`attentiveness`/exit-style). **Static poses with snap-cuts do NOT count as B** — that is a rigged test. |
| **C** | Orthographic 3D (Synty) constrained to B's information budget | Same pose vocabulary, same beats, same timing. **No** extra channels (see checklist). |

### Version C information-budget checklist (fair-test guardrail)

C exists to test *the architecture*, not *the detail budget*. A Synty model ships with hands,
fingers, a face, and a full skeleton — free information B will never have. If C uses any of it,
C wins trivially and the result tells you nothing. C must therefore obey:

- [ ] **Same orthographic camera.** No cinematic moves, no dolly, no rack-focus, no facial closeups.
- [ ] **No expressive lighting.** Flat/even light matching the floor. No spotlighting the actor.
- [ ] **No facial performance.** Faces not legible at test zoom (or removed). If viewers report
      reading the face, that exposure is **void** (budget violation — log and discard).
- [ ] **Same pose vocabulary as B.** No extra gestures, no finger detail, no weight-shift micro-animation
      that B's beat set does not also have.
- [ ] **Same staging.** Same desk/prop blocking, same who-moves-when. No extra environmental theater.
- [ ] **Same beat timing budget.** C may interpolate *between* B's beats (that is the thing under
      test), but it may not add beats B doesn't have.

C is allowed exactly one thing B is not: **continuous interpolation between the shared beats.**
That is the *only* variable the experiment is measuring. Everything else is held equal.

## 4. Test scene (one micro-scenario)

A reprimand. Chosen because its meaning lives in the *sequence*, not any single frame — a frozen
tableau tests posing (B already wins that; see the readability mockup), so the scene must force a
transition read.

**Ground truth (what a viewer should recover):** *An authority figure approached a subordinate,
confronted/reprimanded them; the subordinate registered it and shrank/withdrew; the authority then
left.* Three **transition beats** must be detectable: the **notice**, the **withdrawal**, the **exit**.

See **Appendix A** for the exact beat script and timing budget.

## 5. Design & matrix

**2 (HUD) × 3 (version) between-subjects cold read.** Six cells:

| | HUD on | HUD off |
|---|---|---|
| A | A-on | A-off |
| B | B-on | B-off |
| C | C-on | C-off |

- **The scored number is a cold read.** Each viewer's *first and only scored exposure* is one
  cell, so "what happened?" is genuinely unprimed. Do not let a viewer score two cells of the
  same scene — they'd learn the scene and inflate later cells.
- **Viewers:** naïve, **not** the dev/design team (insiders read charitably). Ideal **n ≥ 4 per
  cell** (24). Minimum viable **n = 2 per cell** (12) — directional only, flag as such.
- **Small-pool trick:** to reuse a viewer without contamination, run **isomorphic parallel
  scenes** (same beat structure, different surface: reprimand / exclusion-from-huddle /
  credit-theft). A viewer can cold-read a different scene per version.
- **Randomize** cell assignment. Counterbalance HUD condition.
- Optional secondary pass *after* the scored exposure: show a viewer all three (forced-choice
  "which reads clearest?"). Preference data only — never feeds the primary metric.

**HUD on/off is the load-bearing manipulation.** The whole thesis is "move the storytelling load
off the HUD and onto the body." HUD-off is where that gets proven or falsified.

## 6. Viewer questions (asked in order, verbatim)

1. **What happened?** (open, unprimed — do not offer options)
2. **What tipped you off?** (attribution — the single most important answer)
3. **How confident are you?** (1–5)
4. **Did you want to keep watching? What do you think that employee does next?** (the **Watchability
   Gate** — curiosity, not comprehension)

Q2 is the crux for the *body-vs-HUD* question: if viewers who understood the scene say "his
posture / he pointed / she shrank," the **body** carried it. If they say "the red badge / the
icon," the **HUD** did — and the body problem is unsolved regardless of the accuracy score.

Q4 is the **north star.** A viewer can perfectly understand *"the manager reprimanded the
employee"* and feel nothing; the Social Theater pivot is won only when they wonder *what happens
next.* Comprehension and watchability are **different axes** — measure and report them separately,
never as one blended score.

## 7. Scoring rubric

**Comprehension (0–3), from the Q1 free response, coded against ground truth:**

| Score | Criterion |
|---|---|
| 0 | Wrong or blank ("two people talking", "a meeting"). |
| 1 | Senses conflict/negative valence but cannot assign roles or direction ("an argument?"). |
| 2 | **Correct gist:** an authority figure reprimands a subordinate who backs down (roles + valence + direction). |
| 3 | Gist **plus** at least one transition beat spontaneously named (noticed / hesitated / withdrew / walked off). |

**Attribution (from Q2), code each response:** `BODY` (posture/pose/lean/point/slump) · `STAGE`
(approach/distance/orientation/who-moves) · `HUD` (badge/emote/connector/floor line) · `FACE`
(only possible in C — if it appears, that exposure is a **budget violation**, void it) · `GUESS`.

**Confidence:** Q3, 1–5, mean per cell.

**Watchability (north-star, 0–2), from Q4:** 0 = no pull ("ok", no curiosity) · 1 = mild interest
· 2 = active projection (spontaneously speculates what the employee does next, wants the next beat,
asks to see more). Report per cell **alongside** comprehension — the two are never combined into
one number.

Two coders score Q1/Q2/Q4 blind to condition; report inter-rater agreement. Disagreements adjudicated.

## 8. Decision rule (pre-registered)

Primary metric = **mean comprehension at HUD-off**, per version. Let the cell means be
`A_off, B_off, C_off` on the 0–3 scale.

- **Sanity gate (run first):** `A_off` must be lowest (≈ 0–1). If `A_off ≈ B_off`, the *scene*
  isn't communicating and the test is broken — fix the scene and re-run before reading anything else.

- **STAY 2D — invest in pose+beat language** if:
  `B_off ≥ 2.0` **AND** `(C_off − B_off) ≤ 0.5`.
  (2D communicates the transition on its own, nearly as well as constrained 3D.)

- **3D JUSTIFIED — for transition readability** if:
  `(C_off − B_off) ≥ 1.0` **AND** B's deficit is concentrated on the **transition beats** (lower
  rate of score-3 and of `notice`/`withdrawal`/`exit` attributions), not on the static tableau.
  (Constrained 3D beats ceiling-2D specifically where continuous motion between beats matters.)

- **AMBIGUOUS (gap 0.5–1.0, or `B_off` in 1.5–2.0):** **iterate B and re-test.** Do **not**
  default to 3D. This middle zone almost always means B wasn't at ceiling (weak blocking, wrong
  dwell times, too few beats). Defaulting to 3D from ambiguity is the exact vibes-soup failure
  this protocol exists to prevent.

- **Watchability co-gate (north star — can VETO the comprehension verdict):** compute mean
  watchability (0–2) at HUD-off per version. Comprehension alone does not decide. If B and C are
  within `0.5` on comprehension but B is clearly higher on watchability, **prefer B** — the
  abstraction is doing the projection work the pivot wants. A version that reads perfectly but
  scores ≤ 1 on watchability across viewers has **failed the actual goal**, whatever its
  comprehension number. And if comprehension points one way while watchability points the other, do
  **not** average them: that split *is* the finding — it means the 2D-vs-3D framing was the wrong
  question and the real one is **comprehension-vs-projection**. Escalate to a design call, not a
  threshold.

- **HUD-dependence check (secondary, per version):** `drop = mean_on − mean_off`. A large drop
  means that version leans on the HUD. Target: **B's drop is small** — the body carries it. If
  `B_on` is high but `B_off` collapses, B is HUD-dependent and the body problem is **not** solved,
  even if the 2D-vs-3D number looks fine.

## 9. Threats to validity (and how each is controlled)

| Threat | Control |
|---|---|
| C wins on free detail, not architecture | §3 information-budget checklist; `FACE` attribution voids the exposure |
| B tested static (rigged against 2D) | §3 ceiling requirement — B *is* poses+beats or it's not B |
| Scene learned across exposures | between-subjects cold read; isomorphic parallel scenes |
| Insiders read charitably | naïve viewers only |
| Testing posing, not transitions | scene meaning lives in the sequence; §8 requires the deficit to be on transition beats |
| Post-hoc rationalization | decision rule pre-registered here, before any build |
| "3D might be easier" creeping in | AMBIGUOUS → iterate B, never default to 3D |
| Optimizing comprehension, the non-goal | Watchability measured as a co-primary; can veto (§7, §8, H2) |
| Concluding "B is repetitive" from one scene | The test fixes **one** staging by design — a controlled legibility test needs a fixed scene. Staging *variety* (the anti-repetition / casting layer) is a **separate subsystem**, not measured here. Draw no repetition conclusions from this test. |

---

## Appendix A — Exact beat script

Two actors: **M** (manager/authority), **E** (employee/subordinate). Timing is the *Director's*
budget; the Presence channel column is what makes *this* M and *this* E block it differently.
Total ≈ 7.5 s. The renderer only ever draws the held pose named; nothing between beats is drawn.

| # | t (ms) | Actor | Pose (held state) | Dwell | Presence channel (shapes it) |
|---|--------|-------|-------------------|-------|------------------------------|
| 0 | 0 | M, E | both `neutral`, E facing away | 800 | — (establish) |
| 1 | 800 | M | `walk-approach` toward E | 1500 | `gaitSpeed` (pace of approach) |
| 2 | 2100 | E | `notice` (head-turn toward M) | 250 | `attentiveness` (how fast E registers) — anticipation beat |
| 3 | 2350 | M | arrive → `arms-crossed`/`hands-on-hips` (loom) | 400 settle + 600 hold | `personalSpace` (how close M plants) |
| 4 | 3350 | M | `point` (the accusation) — **KEY BEAT** | 900 hold | `expressiveness` (amplitude of the point) |
| 5 | 4250 | E | `slump`/`withdraw` + step back | 700 | `commitment`/`latency` (optional hesitation micro-beat if low commitment) |
| 6 | 4950 | M | turn → `walk-away` | 1500 | exit-style (clipped vs. lingering) |
| 7 | 6450 | E | residual `slump`, holds | 1000 | `restlessness` (idle after) |

The `commitment` hook at beat 5 is where "Carl" lives: low-commitment E inserts a reverse beat
(half-step forward, then withdraws). That branch is Director-scheduled, not animated.

## Appendix B — Required pose vocabulary (for Build B)

Eight poses cover the script. Each is an **arm-layer** authored once, style-neutral, tinted via
`$outfitPrimary`/`$skin`, exported in the layer atlas keyed `<pose>_<facing>`. Pose is a
**sim-selected state** (like mood) — never stored in the recipe. Torso/head tilt are group
*transforms* (like `headScale`/`bodyWidth`), not new art, so they can lerp without being "frame
animation."

| Pose | Reads as | New geometry vs. capsule |
|---|---|---|
| `neutral` | idle | shoulders + arms-at-side |
| `walk-approach` | purposeful advance | leg split + forward lean |
| `notice` | registering (head-turn) | head-tilt transform (anticipation) |
| `arms-crossed` | guard / authority | crossed arm silhouette |
| `hands-on-hips` | looming / dominance | akimbo arm silhouette |
| `point` | accusation (key beat) | one extended arm |
| `slump` | submission / withdrawal | rounded shoulders, arms tucked, head down |
| `walk-away` | exit (reluctant/clipped) | leg split + back-lean, mirror for direction |

Minimum anatomy confirmed sufficient by the readability mockup: **shoulders + one arm-pair.** No
elbows/hands/legs as separate rig parts required for B.

## Appendix C — Recommendation for the next repo change

**Build the pose + beat data model next — regardless of how the test later resolves.** It is not
a bet on 2D:

1. It is the thing you build to make **Version B**.
2. **Version C cannot be a fair test until it exists** — C reuses B's pose vocabulary and beat
   timing as its controlled baseline.
3. It is **renderer-agnostic authoring** (a Synty backend consumes the same pose vocabulary,
   beat schedules, and Presence transition signatures). It survives the renderer verdict.

So the next repo change is **pose + beat data modeling** (new `POSES` catalog + `shoulderLeft/
shoulderRight/hip` anchors + arm slot in the layer atlas + the **beat-schedule contract**: Terrarium
authors vocabulary + Presence signatures, the Director owns sequencing). The **3D backend spike is
gated on the test result** — specifically on a `(C_off − B_off) ≥ 1.0` outcome concentrated on the
transition beats.

There is no branch of this experiment in which building the pose+beat layer is wasted work.
