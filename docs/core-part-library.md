# Core Part Library — the visual alphabet

The hand-authored primitives of `content-pipeline-plan.md`. Tool: **Affinity
Designer**. This is a **library**, not a batch of game assets: every head may
be worn by hundreds of employees, every hairstyle by thousands of NPCs. The
~110 pieces are the alphabet all future employees, offices, and scenarios are
written with; once it exists, Terrarium goes back to doing what it does best —
generating endless coherent variation from compact, well-designed primitives.

Tracked by **milestone**, not piece count. Inventory tables below are the
full alphabet; the milestones are what "done" means.

---

## Prerequisites (Phase 2 — before drawing anything)

- [ ] Importer (`scripts/importParts.ts`) with strict validation
- [ ] Template scaffold SVGs per slot (128 grid, anchors, capsule/head guides,
      reference part on locked layer) — the Affinity starting documents
- [ ] Sentinel color palette defined and added as an Affinity document palette
- [ ] Round-trip proof: export hair `bob` → edit in Affinity → reimport →
      snapshot diff shows only the edit
- [ ] Verify which conventions survive Affinity's SVG export (layer names as
      ids for `detail/*`; fall back to sentinel-color-only if they don't)

### Affinity setup notes

- Document: 128×128 px, one part per document (from the scaffold SVG).
- Flat fills/strokes only. No layer effects (fx), gradients, or blend modes —
  the importer hard-rejects them; Affinity rasterizes unsupported properties
  on SVG export, which the validator also catches.
- Export: SVG preset with "flatten transforms" enabled and rasterization
  disabled; confirm exact option names during the round-trip proof.
- Palette-driven colors use the sentinel hexes only; literal colors only for
  style-neutral detail (per `src/parts/library.ts` conventions).

---

## Definition of Done (every part)

A part isn't finished when it looks good in Affinity; it's finished when it
survives the whole pipeline:

- [ ] Imports cleanly; validator passes
- [ ] Snapshot regenerated and the diff reviewed
- [ ] Zoom strip approved (32 / 48 px)
- [ ] West mirror verified (east art reads mirrored)
- [ ] Palette swaps verified (≥3 random palettes; no token collapse)
- [ ] Style presets verified (incl. the clinical look)
- [ ] Portrait crop verified (heads / hair / head-adjacent parts)
- [ ] Combination render against every currently compatible part (tangent /
      collision check)
- [ ] Scene-preview screenshot approved (in-sim screenshot once the sim
      consumes the updated atlas)

## Library-level review passes (milestone gates)

Automated lints catch per-part failures; these are human passes over the
library as a whole:

- **Silhouette pass** — flat-black render of each part class: instantly
  identifiable?
- **Contrast pass** — do the palette tokens separate across the shipped pools?
- **Distance pass** — 32 / 48 / 64 / 96 px strips of the full cast.
- **Crowd pass** — scene preview with ~100 spawns: can your eye still pick one
  known character out?
- **Random stress test** — generate 500 random coworkers; review for ugly
  combinations and tangents (e.g. angular head + tall ponytail + broad body +
  suit jacket). Only Terrarium can run this pass — use it every milestone.
- **Motion pass** — sim-side once atlases land: does everything still read
  while walking? (Cannot run in-tool; schedule with sim integration.)

---

## Milestones

### M1 — Pipeline proof

Everything flows end-to-end once, before volume work starts.

- [ ] All Prerequisites above
- [ ] Wall bevel kit (all 12 pieces) + assembler + snapshot regen
- [ ] One head, one hairstyle, one body, one outfit detail kit — each through
      the full Definition of Done
- [ ] First random stress test (procedural + authored parts mixed)

**Exit:** the pipeline is proven; walls visibly better; one fully hand-crafted
character can stand next to procedural ones in the scene preview.

### M2 — Playable office

The visible core of every character is authored.

- [ ] Body-type set finalized (see Bodies below), all bodies drawn with
      sub-anchors
- [ ] All 6 heads
- [ ] 3 hairstyles (one per major family)
- [ ] 2 more outfit detail kits (tee + blazer recommended: the extremes)
- [ ] Crowd pass + distance pass + stress test

**Exit:** a generated office screenshot reads as hand-crafted art.

### M3 — Full alphabet

- [ ] Remaining hairstyles
- [ ] Remaining outfit detail kits
- [ ] Dress (the per-body matrix), after bodies are final
- [ ] LOD flags verified across the distance pass sizes

**Exit:** every recipe the randomizer can produce is fully authored.

### M4 — Polish

- [ ] Conditional accessories (only those the lints flagged)
- [ ] Tier-2 prop accents (see Props tiers) where the 3-tweak rule fired
- [ ] Final library passes (all six, including sim-side motion pass)

---

## Inventory

### 1. Wall bevel kit (Phase 3) — 12 pieces, no facings

Shared across all solid wall styles. Draw over the exported 47-tile reference
sheet. Fixed light direction — pieces are NOT rotated copies.

- [ ] Edge faces: north / south (tall lit front) / west / east (4)
- [ ] Convex corner miters: NW / NE / SW / SE (4)
- [ ] Concave notches: NW / NE / SW / SE (4)
- [ ] Assembler wired to `configForIndex` + one deliberate snapshot regen

Per-template detail (brick courses, slats, mullions) stays procedural unless
the 3-tweak rule fires.

### 2. Heads — 6 shapes × 3 facings ≈ 18 drawings

Highest recognition value at distance. North = back of head, often a cheap
derivative of south.

| Shape | south | east | north |
|---|---|---|---|
| round | [ ] | [ ] | [ ] |
| oval | [ ] | [ ] | [ ] |
| boxy | [ ] | [ ] | [ ] |
| long | [ ] | [ ] | [ ] |
| angular | [ ] | [ ] | [ ] |
| soft-square | [ ] | [ ] | [ ] |

### 3. Hair — organized as families (design system)

Families organize the library and guide future expansion; they are **not** a
mandate to fill every slot. Current 10 styles mapped; unfilled family slots
are future options, not scope. Pure silhouette work (1–2 interior creases
max). `none` needs no art; north matters (hair reads from behind).

| Family | Style | south | east | north |
|---|---|---|---|---|
| Short | short | [ ] | [ ] | [ ] |
| Short | pixie | [ ] | [ ] | [ ] |
| Short | side-part | [ ] | [ ] | [ ] |
| Medium | bob | [ ] | [ ] | [ ] |
| Medium | curly | [ ] | [ ] | [ ] |
| Long | long-straight | [ ] | [ ] | [ ] |
| Long | ponytail | [ ] | [ ] | [ ] |
| Long | bun | [ ] | [ ] | [ ] |
| Special | balding | [ ] | [ ] | [ ] |
| Special | coils | [ ] | [ ] | [ ] |
| *(future)* | *Short/military, Medium/layered, …* | — | — | — |

### 4. Bodies (§4b) — archetype frames, N × 3 facings

Body types are **archetypes that read from orbit**, not BMI steps. Candidate
set (decision required):

- [ ] **Decide the body-type set.** Candidates: **compact, average,
      large-frame, tall, soft** (replaces standard/slim/broad naming).
      Target 4–5.
- [ ] Each body drawn with **sub-anchor markers** (neck, shoulders, waist,
      hem) on an anchor layer — the importer reads these into the rig. Note:
      `tall` is the proof case for body-owned anchors (its headCenter is
      higher; nothing global can express that).

| Body type | south | east | north |
|---|---|---|---|
| compact | [ ] | [ ] | [ ] |
| average | [ ] | [ ] | [ ] |
| large-frame | [ ] | [ ] | [ ] |
| tall | [ ] | [ ] | [ ] |
| soft (optional) | [ ] | [ ] | [ ] |

≈ 12–15 drawings. North is usually south minus front shading.

### 5. Outfit detail kits (§4b) — body-independent, ~2 facings each

The conforming torso layer is DERIVED from the body silhouette (never drawn).
Only distinguishing details are drawn, anchored to body sub-anchors. **Author
each detail piece as its own file** (`blazer.lapels.south.svg`,
`blazer.buttons.south.svg`) — pieces stay individually addressable so kits can
later be recombined into new garments without redrawing. North kit only where
the garment reads from behind.

| Garment | Detail pieces | south | east | north |
|---|---|---|---|---|
| tee | neckline | [ ] | [ ] | — |
| polo | collar, placket | [ ] | [ ] | — |
| shirt-tie | collar, tie | [ ] | [ ] | — |
| turtleneck | neck band | [ ] | [ ] | [ ] |
| cardigan | button line, trim | [ ] | [ ] | — |
| blazer | lapels, buttons, pocket | [ ] | [ ] | — |
| suit-jacket | lapels, pocket square | [ ] | [ ] | — |
| hoodie | hood (down), pocket, drawstrings | [ ] | [ ] | [ ] |
| vest | V, sleeve color split | [ ] | [ ] | — |
| hi-vis | stripes overlay | [ ] | [ ] | [ ] |

≈ 25 small drawings; lapels/collars/buttons are shared vocabulary across kits
where they genuinely match.

### 6. Silhouette-altering garments (§4b) — per body type

The only place the body-count multiplier is paid; kept small on purpose.

| Garment | Matrix | Status |
|---|---|---|
| dress | bodies × 3 facings | [ ] per cell — start after bodies final |
| (long coat — only if added) | bodies × 3 | deferred |

### 7. Conditional — only if the readability lints flag them

- [ ] glasses (most likely to vanish) · [ ] hard-hat · [ ] headset
- Others: leave procedural.

---

### 8. Builder props (sim-requested — see plan §5b)

New prop art the office-builder pivot asks for. Default to procedural
templates (Tier 1/2 below); escalate to authored only where signature:

- [ ] Surveillance camera (wall-slot) — Tier 2 candidate (thematic accent art)
- [ ] Surveillance sensor/monitor — Tier 1/2
- [ ] IRIS installation unit (server rack) — Tier 2; signature prop, accent
      layer likely worth authoring
- [ ] QuotaCo-standard facility variants — per sim Q5: explicit paired
      templates only for signature facilities; the clinical lens covers
      ambient corporatization

Carryover characters need **no new part class** — they are recipes over this
alphabet, plus sim-side behavioral authoring (ADR-0003).

## Props: three tiers, not two

| Tier | Definition | Examples |
|---|---|---|
| 1 — Pure procedural | Untouched | Minor props, clutter, vents |
| 2 — Procedural + authored accents | Procedural shape/palette + hand-drawn accent layer (edge wear, highlights, branding) | Desk, water cooler, whiteboard — as the 3-tweak rule fires |
| 3 — Fully authored | Hand-drawn through the importer | Only if a Tier-2 prop still fails |

Tier 2 is the default escalation path — it preserves the parametric sliders
and palette while adding taste where taste was the missing ingredient.

## Explicitly NOT hand-crafted

Floors (generate → curate seeds → freeze), moods, poses, badges/emotes,
overlays, per-wall-template detail, Tier-1 props, shadows, portraits (derived
from parts).

## Appendix: piece counts (for scoping only — track by milestone)

| Section | Drawings | Complexity |
|---|---|---|
| Wall kit | 12 | medium (shading judgment) |
| Heads | 18 | low |
| Hair | 30 | low-medium (silhouette design) |
| Bodies | 12–15 | low |
| Outfit detail kits | ~25 | low |
| Dress (per body) | 12–15 | medium |
| **Total** | **~110–115** | mostly trivial per-piece |

Every completed part ships immediately — through the importer, validator,
zoom strip, compositor, and into the export. Procedural parts fill every gap
until their authored replacement lands.
