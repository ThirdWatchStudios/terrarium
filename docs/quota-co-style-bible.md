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

The point of this page: the QuotaCo look is not a talent bar, it is a **closed grammar** — nine paints, two
line weights, four shading steps, eight radii, one projection recipe. An author who obeys the grammar produces
catalog-legitimate art on week one; taste then develops by judging results at gameplay distance, not by
expanding the grammar.

---

## 1. Canvas and projection recipe

- Every master is a strict `viewBox="0 0 128 128"` (70/70 in the tally). One canvas = one grid cell.
- Fixed high-oblique / top-down-plus: rectangular, screen-aligned, no vanishing point, no diamond grid.
- Directional plane law (owner clarification, 2026-07-20): horizontal east-west runs on the **north and
  south** room edges read visibly flat/front-on and expose only a narrow top reveal; vertical north-south
  runs on the **east and west** room edges expose the broader, flatter-from-above top/side plane. This axis
  treatment is independent of whether the wall uses the full or low profile. Author both cross-sections;
  transpose identity is not a valid geometry or material-mask gate.
- Opposing-facing law (owner approval, 2026-07-21): west and east share the vertical treatment's plane
  depth, but reverse its local cross-section handedness. Coral/green fascia and the contact shadow face the
  room; the broad cream plane recedes toward the exterior. The low-east master is a reanchored X-mirror
  **inside its existing `82..120` structural socket around `x=101` (`x′ = 202 − x`)**. Never flip the whole
  128-unit cell or use a runtime transform to manufacture the facing; either would move the socket or change
  the tile's cardinal role.
- Low-southeast ownership law (owner acceptance, 2026-07-21): at the low east-to-south outer turn, only the
  cream top and arris mediate the directional planes. The south cream/coral/green stack owns the complete
  foreground heel, while the east shaft terminates behind the shallow south coping. Never let the east top or
  fascia overpaint the south front.
- Southwest transition ownership law (owner acceptance, 2026-07-21): at the full west-to-low south height
  step, the broad west plane and its coral/green shaft terminate behind the shallow south coping. The south
  cream/coral/green stack repaints and rounds through the complete foreground heel. Never extend the west top
  or fascia across the south front.
- Vertical profiles (kit law): exposed low walls occupy the **38-unit outer profile (`82..120`)**; full
  walls occupy one **64-unit outer envelope (`56..120`)**. `base` and `upper` are technical paint passes,
  not two finished products: draw base first, then upper at the same centered pivot, and judge only their
  composed silhouette. A root full-wall base is never a substitute for a dedicated low-wall frame.
- Shallow **south (front) and east (side) faces** are authored into the sprite. Tops read lightest, vertical
  faces step darker, recesses darkest — that is a *material cue*, not a sun.
- **Never rotate a directional frame to manufacture another facing.** Facings are authored, or the asset's
  allowed rotations are narrowed.
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
Building System. The approved wall sheets reserve a thin continuous coral/rust collar across compatible full
and low modules; props and controls still use coral sparingly as tactile hardware. Floors add `#AAA38F` /
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
   re-renders base/upper/composed plus the distance proof, on light and dark ground — and the
   **composed envelope gate** and **room-context mock** at the top of the bench page: first the structural
   3x3 without opening content, then the room with a door (full N/W walls, both transitions, low E/S sills),
   because tiling truth only shows composed. Saves under
   `low-profile-correction/` re-render the mock too.
5. Gate every wall batch against the five-sheet primary wall target and the real contact sheet; use the golden
   room for whole-room feel. Keep rejects with a one-line reason each.

## 10. Provenance and regeneration

Numbers here come from a regex tally (fills, strokes, widths, opacities, arc radii, ids, groups) over every
`.svg` under `assets/walls/quota-co-building-system/` on 2026-07-20 — 70 files: 18 root pilot, 40
topology base/upper, 7 state, 5 low-profile-correction. The tally is ~80 lines of Node and takes seconds;
re-run it (or ask an agent to) whenever the kit grows a family, and update §§2–5 if the distributions move.
The live workbench loop is `scripts/styleLoop.ts` (`npm run style:watch` / `style:once`), which renders
through the same loader and atlas builders as the A1b review sheet — never a parallel pipeline.
