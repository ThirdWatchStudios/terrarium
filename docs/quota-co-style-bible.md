# QuotaCo catalog style bible — the authoring grammar

> **Status:** working reference for hand-authoring reps, derived 2026-07-20 from an initial mechanical tally
> of the SVG masters in `assets/walls/quota-co-building-system/`, then amended by the unified-envelope pass.
> Counts below describe that baseline snapshot and must be re-tallied after owner acceptance. This page
> teaches the grammar; it does not create authority. When this page and an
> authority disagree, the authority wins:
> [sim art direction](../../The-Water-Cooler/docs/design/quota-co-high-oblique-art-direction.md) ·
> [geometry ask](quota-co-high-oblique-geometry-ask.md) · [kit README](../assets/walls/quota-co-building-system/README.md).
> Re-derive the numbers any time by re-running the tally (method in §10).

> **Required wall reference:** before editing a wall master, open the five owner-approved targeted sheets in
> [`docs/reference/`](reference/README.md). The cardinal corners-and-ends sheet identifies the asset; the
> long-run orthographic and directional-profile sheets govern projection; the module-family and long-run
> continuity sheets govern vocabulary and seam rhythm. This numeric grammar constrains the drawing but does
> not replace comparing it to those images.

> **Current ordinary-wall amendment (owner approval, 2026-07-21):** ordinary structural walls use the full
> 64-unit profile on every room edge. South is exact source reuse of the `full_n_straight` base/upper pair,
> without a transform or duplicated SVG. The `transition_w_to_s` pair is the promoted equal-height southwest
> corner. Southeast is promoted as its X-mirrored derived facing, with the adjoining south cell owning the
> suppressed source-side service tick. No southeast SVG is added. East and northeast are owner-accepted
> mirror/reuse contracts that remain unregistered. The measured 38-unit low family is retained below as legacy A/B evidence and is not the
> current perimeter/cutaway target.

> **Current system-gate amendment (owner approvals, 2026-07-21 through 2026-07-22):** the accepted sources close a 3×8 equal-height
> perimeter around a 1×6 clear aisle at 90 and 40 px per cell. All four turns, one-cell horizontal bodies, and
> six-cell side runs read as one manufactured enclosure without low-profile art or a new frame identity. The
> canonical `mask_0` through `mask_46` proof-layer mapping plus both terminus families, the isolated shell, and the filled-elbow family are
> also accepted: seven direct, eight derived, 32 synthetic candidates, and zero authored-geometry gaps. `mask_8` is direct and `mask_2` is
> the accepted whole-cell X mirror. The synthetic candidates are not accepted art; production topology, registration, export,
> `CONTRACT.md`, schema, committed atlases, and Unity remain deferred.

> **Accepted vertical-terminus gate (owner approval, 2026-07-21):** `mask_1` and `mask_4` use two isolated west-authored
> source pairs outside the canonical kit. Each exposed end remains within the ordinary wall width and folds
> the same cream, coral, and green registers through a shallow molded rollover. South and north are separately
> authored for projected plane exposure, not related by Y mirror. Each east presentation is an accepted whole-cell
> X-mirror derivation.

> **Accepted isolated-shell gate (owner approval, 2026-07-22):** `mask_0` directly reuses the base/upper pair in the external
> `assets/walls/quota-co-building-system-proofs/isolated-shell/` bank. It is one full-height, zero-link
> QuotaCo structural shell—not four terminus caps assembled in one cell—at 240/90/40 px and in compact
> placement. It has one fixed front-on orientation and no mirror or rotation derivation. Acceptance creates no production frame, template registration, exporter or `CONTRACT.md` field,
> schema change, committed atlas, or Unity asset.

> **Accepted thick-wall authored-family gate (owner approval, 2026-07-22):** the owner-approved composition rule for a fully
> occupied 2×2 wall block is materialized as two external fixed-light proof pairs plus two accepted whole-cell
> X-mirror derivations. Filling the elbow crook recalculates four rows (`16/20/26/34`), preserves
> their accepted exterior-edge provenance, and structurally replaces the buried inward faces with one
> continuous cream wall-top surface. The foreground source retains the standard black `0.08` fixed-light
> material shade from local `y=63..88`, so the south-facing cream plane remains dimensional above the coral
> register. No render-only block overlay is used. Rows `16/20` are accepted direct proof-source mappings and
> `26/34` are accepted derivations; the external proof SVGs remain outside production registration. Export,
> atlas, schema, and Unity surfaces remain unchanged.

The point of this page: the QuotaCo look is not a talent bar, it is a **closed grammar** — nine paints, two
line weights, four shading steps, eight radii, one projection recipe. An author who obeys the grammar produces
catalog-legitimate art on week one; taste then develops by judging results at gameplay distance, not by
expanding the grammar.

---

## 1. Canvas and projection recipe

- Every master is a strict `viewBox="0 0 128 128"` (70/70 in the tally). One canvas = one grid cell.
- Fixed high-oblique / top-down-plus: rectangular, screen-aligned, no vanishing point, no diamond grid.
- Equal-height ordinary-wall law (owner approval, 2026-07-21): every placed ordinary structural wall uses a
  **64-unit outer profile** and fully occupies its non-walkable cell. North/south and the west source span
  `56..120` on their profile axis; the accepted whole-cell east mirror maps X to `8..72` while preserving that
  64-unit size. North and south share the exact `full_n_straight` base/upper source pair at the same centered
  pivot; south introduces no transform, duplicate SVG, or additional frame identity. A 38-unit wall may only
  return as a separately approved internal-partition catalog family.
- Directional plane law (owner clarification, 2026-07-20): horizontal east-west runs on the **north and
  south** room edges read visibly flat/front-on and expose only a narrow top reveal; vertical north-south
  runs on the **east and west** room edges expose the broader, flatter-from-above top/side plane. This axis
  treatment remains distinct even though every ordinary wall now shares one full-height profile; transpose
  identity is not a valid horizontal-versus-vertical geometry gate.
- Promoted east-facing law (owner acceptance, 2026-07-21): east reuses the full-west base/upper
  pair through a whole-cell mirror around `x=64` (`x′ = 128 − x`) while preserving the centered pivot and
  64-unit occupancy. This is an accepted art-direction reuse contract, not authorization to register a new
  source, runtime transform, or production facing. The former low-east local mirror around `x=101` is retained
  only as legacy evidence.
- Promoted northeast law (owner acceptance, 2026-07-21): reuse the accepted northwest source pair through the
  same whole-cell X mirror and join it to the accepted full-east run. Its compact, long, and installed-room
  proof closes the joint East/Northeast gate without adding a northeast SVG or production registration.
- Legacy low-southeast ownership law (owner acceptance at the prior low-profile checkpoint, 2026-07-21): at
  the low east-to-south outer turn, only the cream top and arris mediate the directional planes. The south
  cream/coral/green stack owns the complete foreground heel, while the east shaft terminates behind the
  shallow south coping. Never let the east top or fascia overpaint the south front. Preserve this as
  corner-construction evidence, not the current ordinary perimeter contract.
- Legacy southwest transition ownership law (owner acceptance at the prior low-profile checkpoint,
  2026-07-21): at the full west-to-low south height step, the broad west plane and its coral/green shaft
  terminate behind the shallow south coping. The south cream/coral/green stack repaints and rounds through
  the complete foreground heel. Never extend the west top or fascia across the south front. Preserve this as
  transition evidence only; equal-height ordinary corners supersede the height step.
- Promoted southwest law (owner acceptance, 2026-07-21): the canonical `transition_w_to_s` pair now joins
  full west to full south. Its inner elbow uses concentric molded radii, its exact 64-unit sockets match both
  masters, and the full south frontage owns the foreground heel after the west shade terminates behind it.
- Promoted southeast law (owner acceptance, 2026-07-21): reuse the southwest source pair through a whole-cell
  X mirror around `x=64`. Suppress only `base-boundary-seam` and `upper-boundary-seam`; the adjoining south
  cell owns the single service tick. Preserve the exact full-east and full-south sockets and the south-owned
  foreground heel. This is an accepted derived art contract, not a duplicate source or production transform.
- Accepted corridor law (owner acceptance, 2026-07-21): a 3×8 perimeter around a 1×6 clear aisle must remain
  one continuous equal-height enclosure at both 90 and 40 px per cell. The north/south body runs are one cell,
  west/east body runs are six cells, and every join uses only the accepted source/reuse/derivation contracts.
  This is the minimum composition regression gate for any later 47-mask synthetic proof.
- Accepted mapping law (owner approvals, 2026-07-21 through 2026-07-22): preserve the canonical 47-mask order and its explicit
  resolution split—7 direct reuse, 8 approved derivation, 32 proof-only synthetic assembly, 0 unresolved.
  Mapping acceptance is not sprite or atlas acceptance. A synthetic family advances only through a separate
  named owner decision; the accepted external `mask_0` source closes the authored-geometry gap without promoting those candidates.
- Accepted horizontal terminus law (owner acceptance, 2026-07-21): `mask_8` directly reuses the
  socket-polished `full_terminus` pair and `mask_2` reuses it through a whole-cell mirror around `x=64`.
  Base, upper, and composed ingress match the horizontal straight exactly through source `x<96`; the compact
  molded cap remains local. The separately authored vertical gate owns `mask_1`/`mask_4`; never rotate this
  horizontal source into those facings.
- Accepted vertical terminus law (owner acceptance, 2026-07-21): `mask_1` and `mask_4` use separate south- and
  north-facing west-authored rollover sources, with whole-cell X mirrors accepted for east-wall presentation.
  The ends stay within the ordinary wall cross-section and pass 240/90/40 px, 1/3/6-cell, exact-socket, and
  two-/three-cell minimum-segment gates. Their external proof bank remains unregistered and unexported.
- Accepted isolated-shell law (owner acceptance, 2026-07-22): `mask_0` directly reuses one external
  `isolated_shell` pair with zero cardinal sockets, a contained rounded-square mass, and one front-on cream/coral/green
  register stack. It is authored once with no mirror or rotation and remains unregistered and unexported.
- Accepted filled-elbow law (owner acceptance, 2026-07-22): `mask_16` and `mask_20` directly reuse the external
  foreground/rear west fixed-light source pairs; `mask_26` and `mask_34` use accepted whole-cell X mirrors, with
  the southeast seam filter applied before mirroring `mask_34`. Judge the four as one 2×2 wall mass at 240/90/40 px,
  on light/dark grounds and beside a one-cell aisle. The source bank remains unregistered and unexported.
- Vertical profiles (current kit law): ordinary walls occupy one **64-unit outer profile**.
  `base` and `upper` are technical paint passes, not two finished products: draw base first, then upper at
  the same centered pivot, and judge only their composed silhouette. The former **38-unit outer profile
  (`82..120`)** remains measured legacy evidence for a possible future partition family.
- Shallow **south (front) and east (side) faces** are authored into the sprite. Tops read lightest, vertical
  faces step darker, recesses darkest — that is a *material cue*, not a sun.
- **Never rotate a directional frame to manufacture another facing.** A source-reuse mirror is allowed only
  when the facing contract explicitly approves it; the accepted full-height east and northeast mirrors, the
  southeast mirror with its named seam filter, and the horizontal `mask_2` terminus mirror are the explicit cases.
- Paths may meet the canvas edge only as intentional connected-wall seams.
- Draw on integer or half-unit coordinates. The existing masters are almost entirely `h`/`v` runs plus
  quarter-circle arcs — if you are sculpting freeform béziers, you are probably off-style.

## 2. The nine paints (and only the nine)

Tally result: **zero off-palette fills in 70 files.** Keep it that way — the importer fails unknown paint.

| Paint | Hex | Role | Tally count |
|---|---|---|---|
| Charcoal | `#252A28` | contour/outline shapes, all seam strokes, recess floors | 93 fills · 91 strokes |
| Aged cream | `#D9D0B9` | shell material, the dominant field | 63 |
| Deep green | `#294B3C` | bases, lower shells, recess insets | 51 |
| Oxidized teal | `#4E7D79` | utility fields and bands | 33 |
| Metal | `#979A91` | functional detail only — never the dominant field | 29 |
| Glass | `#83A9A6` | glazing | 4 |
| Coral / rust | `#B65F4D` | thin Building System wall collar; restrained hardware accents | 4 |
| White overlay | `#FFFFFF` @ fixed opacities | top/cap light cue | 57 |
| Black overlay | `#000000` @ fixed opacities | face/side shade cue | 39 |

The four-use coral count is a historical tally of the pre-target source family, not a scarcity target for the
Building System. The approved wall sheets reserve a thin continuous coral/rust collar across compatible
ordinary modules (and the retained legacy low comparisons); props and controls still use coral sparingly as
tactile hardware. Floors add `#AAA38F` /
`#B9B19B` from the proof palette. **Amber and rose are runtime-reserved signals (capture / emotion) and never
appear in authored art.**

## 3. Line grammar

- **Stroke color: charcoal, always** (91 of 92 strokes).
- **Weights: `2` for primary seams, `1.5` for secondary/fine seams** (47 vs 42 in the tally; a stray `1`
  exists ×3 — prefer 1.5). Nothing heavier, nothing hairline.
- `stroke-linecap="round"` and `stroke-linejoin="round"` on every stroke (92/92).
- The silhouette contour is usually **not a stroke** — it is a charcoal *shape* drawn behind the material
  fill (outline-as-shape). Every component must compile without gaining a second automatic silhouette, so
  the contour you draw is the contour the game gets.

## 4. Shading grammar — the four-step ladder

Authored shading is a restrained material cue layered as translucent overlays:

| Step | Paint | Canonical opacity | Meaning |
|---|---|---|---|
| Top/cap light | white | **0.10** subtle · **0.18–0.20** strong | horizontal plane catches room light |
| Face shade | black | **0.08** standard · **0.10** heavier | south/east vertical faces step back |
| Recess | solid paint (charcoal / deep green), not an overlay | — | control wells and sockets read deepest |
| Cast shadow | **forbidden** | — | runtime lighting owns all cast shadows |

Tally drift note: nine stray opacity values exist (`0.04, 0.05, 0.055, 0.06, 0.07, 0.09, 0.12, 0.15`), each
appearing once or twice. They are probably per-piece tuning, but new work should stay on the ladder; if a
piece truly needs an off-ladder value, that is a review-sheet conversation, not a habit.

**Glazing convention (owner-blessed on the wide window, 2026-07-20):** glass is the one material allowed
non-orthogonal marks — a diagonal sheen stroke (white, 2 wide, `0.30`, lower-left to upper-right) per pane,
over the flat `glass` fill. Blinds are deep-green slat fields with charcoal slat lines at `0.45`, a cream
rail bar, and a black `0.10` head shade under the frame; window/door bezels are cream product frames on the
concentric radius rule with a `0.20` top-plane light and a black `0.08` contact shade where they meet a
lower field.

**Why overlays instead of tinted fills (recolor law):** shading lives on separate white/black overlay paths
so every color field stays a single flat token underneath — that is what lets the export lane emit white
token-masks per surface ("palette-as-runtime-lever") and lets the engine recolor a shell without touching
its lighting. Never bake a lighter/darker *tint of a field color* into a fill (no hand-mixed "light coral"),
and never mix two palette tokens in one path — the A1b compiler rejects mixed-token shapes by design.

## 5. Radius vocabulary

Corner radii in use, by frequency: **4, 7, 3, 1.5, 9, 5, 2, 6.** Two rules fall out of the data:

1. **Concentric rule:** an inner fill inset by `n` units steps its radius down by `n` — the door jamb is
   outline `r4` over material `r3` (1-unit inset); the wall cap is outline `r9` over material `r7` (2-unit
   inset). Break this and corners visibly "pinch."
2. **Chunkiness is construction, not scale.** Weight comes from shell thickness (the 2-unit charcoal
   contour), stepped bases, and recess depth — never from drawing the object bigger.
3. **The concentric rule has a legibility floor (owner-called on the door, 2026-07-20).** When strict
   inner = outer − inset arithmetic produces r ≤ 2 on a large opening, the corner reads sharp at gameplay
   zoom and the generous-radii law wins: give the visible edge r4–5 minimum and re-derive its partner
   outward (door lip: r5 visible over r7 behind). Sub-perceptual radii are drift wearing math as a disguise.

## 6. Anatomy of a master (read one, then copy it)

`door_open-upper.svg` is the teaching file. Its layer order is the house recipe:

1. `*-outline` — charcoal contour shape (the silhouette);
2. `*-material` — cream fill inset 2 units, radius stepped down per the concentric rule;
3. `*-cap-light` — white overlay strip on the top plane;
4. `*-side-shade` — black overlay on the south/east face zone;
5. `*-seam` — charcoal strokes (2 / 1.5, round caps) for panel joints;
6. recess insets in deep green; hardware in coral, last and smallest.

First exercise of tool onboarding: rebuild this file from scratch by eye, then diff. It contains every rule
in §§1–5.

## 7. Structure and naming

- Top-level groups: `detail/base`, `detail/upper` (plus `detail/state`, `detail/low` in the newer
  sub-kits). All visible paths live under `detail/*`.
- Path ids are **semantic element-roles**, never editor junk (`Layer 3`, `Path copy 2` fail review).
- Two naming generations exist in the corpus: the root B pilot says `outline / material / cap-light /
  side-shade`; the newer, larger topology kit says `contour / shell / field / face-shade` (plus `band`,
  `fastener`, `socket`, `facet`, `coping`). **Use the topology-generation vocabulary for new work**; do not
  mass-rename the pilot without a reviewed pass.
- One stem = `<stem>-base.svg` + its declared `<stem>-upper.svg`, same pivot, base drawn first. On full/profile
  stems the pair must be complementary: no independently finished cap, outline, or shelf may survive their
  internal handoff.

## 8. Hard prohibitions (most are machine-enforced)

The importer **fails** on: gradients, masks, filters, embedded images, text elements, stray files, unknown
paint. The contracts additionally forbid: raised/plinth floors (floors are flat surface treatment), baked
directional cast shadows, rotating one oblique sprite through facings, amber/rose anywhere, and deriving
schema or contract changes from source art alone. Treat a red importer as a style critique that happens to
be automated.

## 9. The reps loop

1. Silhouette first: block the charcoal contour and judge it **at 40 px** before any interior detail —
   "one iconic silhouette before internal detail" is law, and the review sizes are 240 / 90 / 40.
2. Build from rounded rects and booleans on the 128 grid; snap everything.
3. Paint only with §2 swatches; shade only with §4 steps.
4. Keep `npm run style:watch` running (§10) — every save re-validates through the real importer and
   re-renders base/upper/composed plus the distance proof, on light and dark ground. The open bench page is a
   **current-state decision surface**: the accepted 2×2 thick-wall source family appears first; the isolated shell,
   vertical/horizontal termini, 3×8 corridor, and 47-mask ledger remain accepted proof-layer baselines. All
   32 synthetic T/cross assembly rows remain unaccepted, and accepted pieces remain the
   comparison set. Earlier low-profile
   comparisons, mixed-profile room/envelope gates, and importer cards remain available only in closed,
   explicitly archived disclosures. They must never read as the current target.
5. Gate every wall batch against the five-sheet primary wall target and the real contact sheet; use the golden
   room for whole-room feel. Keep rejects with a one-line reason each.

## 10. Provenance and regeneration

Numbers here come from a regex tally (fills, strokes, widths, opacities, arc radii, ids, groups) over every
`.svg` under `assets/walls/quota-co-building-system/` on 2026-07-20 — 70 files: 18 root pilot, 40
topology base/upper, 7 state, 5 low-profile-correction. The tally is ~80 lines of Node and takes seconds;
re-run it (or ask an agent to) whenever the kit grows a family, and update §§2–5 if the distributions move.
The live workbench loop is `scripts/styleLoop.ts` (`npm run style:watch` / `style:once`), which renders
through the same loader and atlas builders as the A1b review sheet — never a parallel pipeline.
