# Icon expansion plan — comprehensive coverage for upcoming systems

Status: audit complete (2026-07-01); §2 verification PASSED same day (no drift —
see §2); **Family A and Family D BUILT tool-side** (2026-07-01). Families B/C/E/F
awaiting the §5 sign-offs / their gating work. Produced by a cross-repo sweep of
this tool (what is authored/exported) against The-Water-Cooler (what the sim
consumes, what its design docs specify, and what currently renders as fallback).

Companion docs: [ui-art-plan.md](ui-art-plan.md) (ownership rules + pipeline),
[epic-36-ui-assets.md](epic-36-ui-assets.md) (workstation chrome set, built).

## 1. Where coverage stands

Authored today: **74 icon ids** in [icons.ts](../src/parts/icons.ts) (chrome, QuotaOS
shell, layer toggles, interventions, pressure glyphs, needs, departments,
relationships, cursors) plus **4 overhead badge atlases** — activity (8), mood emotes
(5), prop-status (3), attention puffs (4) — all on the 128u SVG→PNG pipeline with
tintable/literal modes and per-id motion intent.

The sim consumes everything with graceful fallbacks (text labels, vector rings, red
tint on tampered props), which is why gaps are invisible at runtime: nothing breaks,
things just silently render as fallback. The gaps cluster into **six new icon
families** (§3) plus a set of **verification items that are not new art** (§2).

## 2. Not new art — verification / plumbing first

> **VERIFIED CLEAN (2026-07-01).** Fresh headless export diffed against the game's
> latest import (`Generated/SpriteToolkitImports/water-cooler-sprites-20260629-203225`):
> all 70 icon ids match `UiIconCatalog.asset` exactly (incl. the `need-*` six and
> `rel-social`); all four badge atlases have imported SOs (`attention-puffs.asset`,
> `prop-status-badges.asset`, …); all three broken-prop templates are imported
> (`Prop_printer--jammed.asset`, …). The audit's "fallback-active" items were
> older-export guards, not missing assets. No action was needed. The next re-import
> (to pick up Families A+D below) refreshes everything anyway.

These looked fallback-active in the game but were export/import drift suspicions. A
fresh `Export all` + re-import through the Unity importer, then a catalog-vs-code id
diff, settles items like these cheaply — always do this before authoring "missing" art.

| Item | Symptom in sim | Tool-side status |
|---|---|---|
| Attention-puff atlas | Vector rings drawn as fallback (`ProductionPresentationFloorBinding.cs:1611`) | Built ([attention.ts](../src/parts/attention.ts)) |
| Prop-status badge atlas | Optional-null path (older-export guard) | Built ([propStatus.ts](../src/parts/propStatus.ts)) |
| `need-*` icons (6) | Inspector renders `need-{id}`, falls back to text (`WorkstationShellController.cs:1969`) | Built ([icons.ts:171](../src/parts/icons.ts)) |
| Broken-prop sprites (`printer-jammed`, `coffee-machine-broken`, `water-cooler-empty`) | Red/amber tint placeholder on tampered props | Built ([templates.ts:141](../src/props/templates.ts)) |
| Event-feed ids (`ui-mail`, `ui-truth-belief`, `ui-capture`, `ui-alert`, `rel-social`, `intervention-*`) | Feed falls back to text per-row if id missing | Built; `rel-social` was marked "defer" in Epic 36 but the feed maps `EncounterStarted` to it — keep it in the export |

## 3. New icon families (by priority)

### Family A — Directive & capture-outcome glyphs (9 ids) — ✅ BUILT (2026-07-01)

Both consuming surfaces already exist in the sim and are stubbed: the IRIS objective
banner (directive status) and `CaptureResultPresentation.cs` (marked "E33 capture
pending"). Small set, immediate payoff. Tintable chrome icons, standard SVG+PNG path.

> Built in [icons.ts](../src/parts/icons.ts): two carrier silhouettes so the families
> triage color-blind — directives ride a RING (the objective's scope; check/X/pause/
> chasing-arrow inside; deadline is the lone hourglass), capture outcomes ride
> VIEWFINDER BRACKETS (filled dot = captured, hollow = missed, slash = invalid,
> dot + spatter = collateral). Guarded in tests/defaultBundle.test.ts.

| ID | Concept |
|---|---|
| `directive-in-progress` | Objective active |
| `directive-target-met` | Objective satisfied |
| `directive-failed` | Objective failed |
| `directive-deferred` | Objective parked/archived |
| `directive-deadline` | Time pressure (hourglass) |
| `capture-captured` | Reading captured (clean) |
| `capture-missed` | Window expired |
| `capture-invalid` | Invalid capture attempt |
| `capture-collateral` | Captured, collateral-heavy |

Grounding: The-Water-Cooler `docs/design/ui-ux-design.md` §2/§7,
`CaptureResultPresentation.cs`.

### Family B — Emotion glyphs (17 ids) — the core-loop centerpiece

The harvest loop's entire vocabulary has **zero icon coverage**. The floor overlay's
discovery layer specs "outline + emotion glyph" on acute spikes
(`ui-ux-design.md:724`), and the same vocab surfaces in the capture UI and inspector.

**This is a different vocabulary from the 5 mood emotes** — moods are dispositions
(suspicious/curious/…), emotions are the harvestable substance.

| Tier | IDs |
|---|---|
| Ambient (14, need-derived) | `emotion-resentment`, `emotion-frustration`, `emotion-jealousy`, `emotion-envy`, `emotion-anger`, `emotion-anxiety`, `emotion-fear`, `emotion-insecurity`, `emotion-loneliness`, `emotion-overwhelm`, `emotion-spite`, `emotion-ambition`, `emotion-boredom`, `emotion-pride` |
| Acute spikes (3) | `emotion-embarrassment` (flagship), `emotion-vindication`, `emotion-relief` |

Dual consumption → dual export: ship each as a **tintable icon** (SVG+PNG, chrome:
inspector/capture UI recolors via `--wc-*`) **and** as cells in a new shared
**`emotion-glyphs` atlas** (floor: blitted inside the Shapes-drawn spike outline, same
family conventions as attention puffs, `facingIndependent: true`). Same geometry, two
emissions — no re-authoring.

Design constraint: 17 glyphs must be distinguishable at ~24px **by silhouette first**
(the attention-puff rule) — group by valence/family (e.g. the envy/jealousy pair, the
fear/anxiety pair share a base form with one differentiator) rather than 17 unrelated
marks.

Grounding: The-Water-Cooler `docs/design/core-loop-emotion-harvesting.md` §1/§4.5/§9.

### Family C — Behavior icons (5 category + optionally 28 per-behavior)

The Social Theater spec wants speech bubbles carrying the behavior's icon + tone so
the player reads *what kind of thing is happening* without dialogue
(`the-active-loop.md` §6). The id contract already exists tool-side:
**28 behaviors in 5 categories** in [defaults.ts:1160](../src/data/defaults.ts)
(`DEFAULT_BEHAVIORS`, schema v13).

Recommended two-stage approach — 28 distinct glyphs at bubble scale is beyond the
24px legibility budget:

1. **Category glyphs (5, build now):** `behavior-cat-productivity`,
   `behavior-cat-social`, `behavior-cat-territorial`, `behavior-cat-coping`,
   `behavior-cat-escalation`. Tone/severity is a tint + outline treatment from the
   theme (hostile red / warm amber / neutral), not separate art — matching the
   tintable convention.
2. **Per-behavior glyphs (28, later, only if playtests need them):** `behavior-<id>`
   keyed to the catalog ids (`take_credit`, `spread_rumor`, `steal_lunch`,
   `meeting_outburst`, …). Since users can add custom behaviors, the sim must keep
   the category glyph as fallback for unknown ids (the existing unknown-id rule).

Also needed when Social Theater lands (separate asset class, not icons): the scene
bubble sprite + connector — `conversation-style.json` already owns the look
direction.

### Family D — Overhead badge extensions (6 cells) — ✅ BUILT tool-side (2026-07-01)

Slots straight into the existing overhead-badge atlas convention.

> Built: `disrupted` added to [activities.ts](../src/parts/activities.ts) (coral
> bubble, broken-loop glyph echoing `pressure-routine-interruption`); new
> `social-state-badges` atlas family in [socialStates.ts](../src/parts/socialStates.ts)
> (bubble hue = valence: rose negative / teal-blue positive; glyph = which state) +
> compositor/exporter/motion wiring + CONTRACT §3.9. **Sim wiring still open**: the
> game maps routine state → badge id and must add `disrupted`, and short-term social
> states are inspector-text-only until the sim consumes the new atlas.

| Atlas | New cells | Grounding |
|---|---|---|
| `activity-badges` | `disrupted` | Explicit hole in the sim: "e.g. disrupted — no badge yet" (`ProductionPresentationFloorBinding.cs:1779`) |
| **New family: `social-state-badges`** | `anxious`, `slighted`, `confident`, `defensive`, `reassured` | `ShortTermSocialStateLabel` enum — player-visible but text-only today |

Social-state badges are STATE (fade-in/out, no loop, salience tier 2 — same
discipline as moods). Sim-side wiring is a new consumption point (the sim currently
only surfaces these in the inspector text) — flag in CONTRACT.md when built.

### Family E — Presence & pose icons (count TBD — gated on pose+beat modeling)

The planned Presence Inspector (QuotaOS Surface 5) needs pose/beat state glyphs, a
focal-point/attention marker, and location markers. **Do not author yet**: the
pose+beat data modeling is the agreed next repo change, and the icon id list should
*be* the pose vocabulary — design the two together so pose ids and icon ids are one
contract (the Family=recipe-id precedent).

Reserve prefixes now: `pose-*`, `presence-focus`, `loc-*`.

### Family F — HUD odds-and-ends (~21 ids, already flagged in ui-art-plan.md §a)

The remaining unbuilt rows from the Layer 1/2 taxonomy, plus two new needs from the
game sweep:

| Group | IDs | Notes |
|---|---|---|
| KPI/resource (3) | `kpi-money`, `kpi-morale`, `kpi-productivity` | tintable; trend arrows already exist (`status-trend-*`) |
| Clock (1) | `ui-clock` | glyph only; widget is USS |
| Minimap markers (4) | `marker-agent`, `marker-selection`, `marker-poi`, `marker-alert` | tintable |
| Alert bubble (2) | `alert-exclaim`, `alert-question` | cells appended to the mood-emote atlas (same bubble shape) |
| Signage (4) | `sign-exit`, `sign-kitchen`, `sign-meeting`, `sign-restroom` | diegetic, monochrome on sign prop |
| Redaction (1) | `ui-redacted` | clearance/fog-of-war "something notable here" (Phase E clearance model) |
| Need pips | — | **resolved, no new art**: the 6 `need-*` icons are already legibility-tested at 24px; rasterize smaller rather than authoring pip variants. (The ui-art-plan pip list — coffee/bladder/etc. — predates the canonical 6-need catalog; supersede it.) |
| Build-menu (~8) | `build-<propId>` | reuse prop silhouettes as glyphs; needs a sprite→icon export path, defer until a build UI exists |

### Family G — Directory/org UI (mostly authored, parked)

`dept-*` (6) and `rel-*` (4) exist and stay deferred until the Employee Directory
panel (QuotaOS Surface 4) is built. When it is, expect small additions: role marker
(manager vs IC) and availability status — enumerate then, not now.

## 4. Totals & build order

Roughly **55–60 new ids now** (A 9, B 17, C 5, D 6, F ~21), with C's per-behavior 28
and E's presence set as later expansions.

1. ✅ **§2 verification pass** — fresh export + id diff ran 2026-07-01; clean (see §2).
2. ✅ **Family A** (directive/capture, 9) — built 2026-07-01.
3. **Family B** (emotions, 17 + new atlas family) — core loop; includes the
   atlas-emission pipeline addition. NEXT — needs §5 decision 4 (style grammar).
4. ✅ **Family D** (badge extensions, 6) — built tool-side 2026-07-01; sim wiring open.
5. **Family F** (HUD misc, ~21) — as the consuming UI firms up; signage/build-menu
   can trail.
6. **Family C stage 1** (behavior categories, 5) — when Social Theater work starts.
7. **Families E/G** — gated on pose+beat modeling and directory panel respectively.

After each family lands tool-side: run `Export all` (or `npm run export -- default
<dir>`) and re-import in Unity (Tools → Water Cooler) so the sim's catalogs pick up
the new ids.

CONTRACT.md additions ride each family: the `emotion-glyphs` and
`social-state-badges` atlas families need §3.x entries (id vocabulary, unknown-id
rule, motion intent), and the directive/capture ids join the icons manifest note.

## 5. Open decisions before authoring

1. **Mood vocabulary vs emotion vocabulary.** `EmployeeVisual.MoodOverlayId` maps
   directly to mood-emote cells, and the mood set is 6. Does the mood vocab stay a
   small disposition set (recommended — emotions get their own overlay channel via
   Family B), or grow toward the 17 emotions? If the latter, mood face-overlays
   (per-character) multiply too — expensive.
2. **Behavior icons: category-first confirmed?** Stage 1 = 5 category glyphs + tone
   tint; per-behavior art only if bubbles prove illegible in playtests.
3. **Unmapped event-feed types** (`RunStarted`, `RoutineAdvanced`, `OutcomeMarked`,
   `RunEnded`, `DayStarted`, `DayEnded`) — recommend these stay text-only
   (structural, not dramatic); confirm.
4. **Emotion glyph style family** — one shared base-form grammar per valence group
   (recommended, see Family B) vs 17 independent marks. Affects authoring order.
