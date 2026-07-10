# Core Part Library — the visual alphabet

The deliberately authored primitives of `content-pipeline-plan.md`. The
canonical tool is the strict SVG source contract, not a particular
application. This is a **library**, not a batch of game assets: every head may
be worn by hundreds of employees, every hairstyle by thousands of NPCs. The
~110 pieces are the alphabet all future employees, offices, and scenarios are
written with; once it exists, Terrarium goes back to doing what it does best —
generating endless coherent variation from compact, well-designed primitives.

Tracked by **milestone**, not piece count. Inventory tables below are the
full alphabet; the milestones are what "done" means.

---

## Prerequisites (Phase 2 — before drawing anything)

- [x] Importer (`scripts/importParts.ts`) with strict validation
      (`part-importer.md`; shared-identity production body art, static
      production head/hair overlays, plus the first body-aware tee detail
      adapter)
- [x] Template scaffold SVGs for all five production bodies, all six human-head
      families, supported hair, and south/east tee intake (128 grid, anchors,
      capsule/head guides, seeded editable art, named reference layer) with
      semantic IDs for every editable and ignored path
- [x] Sentinel color palette defined and generated as ASE, GPL, and readable
      SVG companions (`npm run parts:scaffolds`); every scaffold also embeds
      the five exact swatches
- [x] Headless bob intake proof: scaffold → deliberate three-facing SVG
      parting edit → importer → generated overlay → exactly the three expected
      compositor snapshots
- [x] Anchored-detail mechanics proof: one south/east tee source set on
      `body-balanced` → deterministic five-body pre-expansion. Visual approval
      remains part of M1 rather than an importer prerequisite.
- [x] Body-art ownership proof: 15 canonical production SVGs → one in-place
      shared `PartDef` set with byte-stable visible geometry and unchanged typed
      rig identities
- [x] Semantic SVG conventions compiler-tested: slash IDs, ignored guide /
      reference groups, `detail/*`, exact sentinel colors, and nonzero fill

Optional visual-editor interoperability is useful, but it is not an M1
prerequisite and no named editor is a production gate.

Mechanical readiness and canonical-source status do not normally imply visual
approval. The five bodies and all six heads have now passed that separate human
review; later source additions still require both gates.

### Canonical SVG authoring notes

- Document: 128×128 px, one part per source (start from a scaffold SVG).
- Flat fills/strokes only. No layer effects (fx), gradients, or blend modes —
  the importer hard-rejects unsupported source features.
- Supported transforms may remain because the importer bakes them into
  128-space. Optional editors must preserve semantic IDs, hexadecimal colors,
  the viewBox, nonzero fill, and vector paths without rasterization.
- Production body paths are the byte-stable exception: keep visible art
  directly beneath the scaffold's canonical `translate(64 87)` group. The
  generated 11-point rig and `bodyOrigin` markers are ignored guides, not
  imported metadata.
- Palette-driven colors use the sentinel hexes only; literal colors only for
  style-neutral detail (per `src/parts/library.ts` conventions). The frozen
  values and exact SVG intake contract live in `part-importer.md`.

---

## Definition of Done (every part)

A part isn't finished when its source looks good; it is finished when it
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

Current production order follows visual impact rather than the section order:
the approved body and six-head source foundations are canonicalized, and all
ten mapped hair styles are approved canonical sources. Outfit or wall work can
follow. M1 and M2 remain open; this sequencing note does not pre-check
unrelated milestone gates.

### M1 — Pipeline proof

Everything flows end-to-end once, before volume work starts.

- [x] All Prerequisites above
- [ ] Wall bevel kit (all 12 pieces) + assembler + snapshot regen
- [ ] One head, one hairstyle, one body, one outfit detail kit — each through
      the full Definition of Done
- [ ] First random stress test (procedural + authored parts mixed)

**Exit:** the pipeline is proven; walls visibly better; one fully hand-crafted
character can stand next to procedural ones in the scene preview.

### M2 — Playable office

The visible core of every character is authored.

- [x] Body-type set finalized (see Bodies below), all bodies drawn with
      sub-anchors
- [x] All 6 heads
- [ ] 3 hairstyles (one per major family)
- [ ] Tee visual approval + one more outfit detail kit (Blazer recommended)
- [ ] Crowd pass + distance pass + stress test

**Exit:** a generated office screenshot reads as hand-crafted art.

### M3 — Full alphabet

- [ ] Remaining hairstyles
- [ ] Remaining outfit detail kits
- [x] Dress mechanics (the per-body matrix); dedicated visual art pass remains
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

This remains an M1 gate, but its art pass is queued behind the current
silhouette-bearing hair-family review.

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
| round | [x] | [x] | [x] |
| oval | [x] | [x] | [x] |
| boxy | [x] | [x] | [x] |
| long | [x] | [x] | [x] |
| angular | [x] | [x] | [x] |
| soft-square | [x] | [x] | [x] |

`head-round` has approved canonical authored SVG for all three facings,
committed in `9e932eb`. The south
contour adds a gentle cheek/chin treatment, east owns a readable profile, and
north remains nearly circular for rear-hair compatibility. Eyes remain
literal-ink `detail/*` paths owned by the head. Its inventory boxes record the
approved drawings; broader M1 scene/crowd gates remain open. The automated
660-cell hair / head-accessory / facing / style matrix is now strictly
clip-free, including the lowered production Bun.

The other five IDs have one complete 15-SVG approved production batch:
south/east/north sources for `head-oval`, `head-boxy`, `head-long`,
`head-angular`, and `head-soft-square`. Their generated scaffolds, importer
registration, and static overlays are production-ready. User visual approval
on 2026-07-10 follows the automated silhouette, distance, palette, portrait,
hair/accessory, and compatibility reviews. Broader M1 scene/crowd gates remain
library-level work rather than head-source blockers. Run
`npx tsx scripts/headSilhouettePreview.ts` to regenerate the previous-versus-
production distance sheet and representative compatibility sheet under
`docs/previews/head-silhouettes-*`.

### 3. Hair — organized as families (design system)

Families organize the library and guide future expansion; they are **not** a
mandate to fill every slot. Current 10 styles mapped; unfilled family slots
are future options, not scope. Pure silhouette work (1–2 interior creases
max). `none` needs no art; north matters (hair reads from behind).

| Family | Style | south | east | north |
|---|---|---|---|---|
| Short | short | [x] | [x] | [x] |
| Short | pixie | [x] | [x] | [x] |
| Short | side-part | [x] | [x] | [x] |
| Medium | bob | [x] | [x] | [x] |
| Medium | curly | [x] | [x] | [x] |
| Long | long-straight | [x] | [x] | [x] |
| Long | ponytail | [x] | [x] | [x] |
| Long | bun | [x] | [x] | [x] |
| Special | balding | [x] | [x] | [x] |
| Special | coils | [x] | [x] | [x] |
| *(future)* | *Short/military, Medium/layered, …* | — | — | — |

`hair-bob` has approved canonical authored SVG and a three-facing parting
detail, committed in `240ee03`. Its inventory boxes record the approved
drawings; broader M1 scene/crowd gates remain open.

`hair-short` and `hair-long-straight` now have six canonical south/east/north
sources, with Bob as the Medium-family control. The explicit byte-stable
targets prevent generic arc normalization from changing pixels while still
enforcing the full SVG intake contract. Short and the Long straight south/north
facings preserve their prior silhouettes exactly; Long straight east is the
one authored refinement, using a single rear fall and short temple edge so the
profile turn reads distinctly. Run
`npx tsx scripts/hairFamilyPreview.ts` to regenerate the all-head/facing
compatibility and 128/64/48/32 px distance proofs under
`docs/previews/hair-families-*`. Their inventory cells record visual approval
on 2026-07-10; broader M1 scene/crowd gates remain open.

`hair-curly`, `hair-ponytail`, and `hair-coils` now add nine canonical
south/east/north review sources. Curly preserves the established lobed
silhouette byte-for-byte. Ponytail adds a hanging tail that stays directional
at 32 px; Coils uses a denser cloud crown and rear-weighted east profile so it
does not collapse into Curly. The expanded preview and 2,160-cell matrix are
the review surface; their inventory cells record visual approval on 2026-07-10.

`hair-bun`, `hair-balding`, `hair-pixie`, and `hair-side-part` add the final 12
mapped south/east/north sources. Bun is compact and clip-free rather than a
second ponytail; Balding uses tapered temple/rear bands; Pixie owns an
irregular cropped fringe; Side-part owns a swept cap plus a non-silhouette
parting crease. Their generated scaffolds, four intentional compositor
goldens, distance proof, 3,600-cell hair compatibility matrix, and full
head/accessory matrices pass. Their inventory cells record user visual
approval on 2026-07-10.

### 4. Bodies (§4b) — archetype frames, N × 3 facings

Body types are **archetypes that read from orbit**, not BMI steps. Approved set:

- [x] **Body-type set approved (2026-07-09): compact, balanced,
      large-frame, tall, soft.** This replaces standard/slim/broad for new work;
      the legacy ids remain resolvable for existing projects.
- [x] Each body has a complete typed sub-rig (above-head, head center, neck,
      shoulders, chest, waist, hip, and hem). Generated scaffolds render all 11
      points plus `bodyOrigin` on an ignored anchor layer; TypeScript remains
      authoritative rather than importing those guides. `tall` is the proof
      case for body-owned anchors because its head center is higher.

| Body type | south | east | north |
|---|---|---|---|
| compact | [x] | [x] | [x] |
| balanced | [x] | [x] | [x] |
| large-frame | [x] | [x] | [x] |
| tall | [x] | [x] | [x] |
| soft | [x] | [x] | [x] |

≈ 12–15 drawings. North is usually south minus front shading.

> **Production body set (2026-07-10):** `src/parts/bodyArchetypes.ts` registers
> `body-compact`, `body-balanced`, `body-large-frame`, `body-tall`, and
> `body-soft` as the only selectable bodies, in that stable order. Pickers,
> random characters, and seeded employee generation all consume that production
> list. `body-standard`, `body-slim`, and `body-broad` remain resolvable for old
> recipes and the unchanged named/default cast, but are never offered for new
> selection. Run
> `npx tsx scripts/bodyArchetypePreview.ts` to regenerate the
> character, flat-silhouette, active-sub-anchor, and rigged vertical-slice sheets
> under `docs/previews/body-archetypes-*`. The production rigs drive the head
> stack, portraits, overhead attachments, all 11 human outfits, all 15
> poses, and pose-aware wrist/carry placement while preserving exact fallback
> for legacy bodies. Watches follow every wrist; each normalized recipe may own
> one bulky held prop, which renders only when the pose publishes a free carry
> hand. The production set passes a 9,900-render body/outfit/pose/facing/style
> matrix plus a strict fitted-paint mask, while the legacy rendering digest stays
> pinned. **Dress is mechanically complete but visually provisional;** its
> dedicated art pass does not block the production body, rig, or compatibility
> work.
>
> The same five bodies now own 15 canonical files under `assets/parts/body`.
> Their complete visible shapes are installed through the explicit `body-art`
> mode onto the already-shared production objects, so `BODY_ARCHETYPES`,
> `BODY_ARCHETYPE_PARTS`, `partsForSlot('body')`, and `getPart()` continue to
> resolve the same identities and rigs. The handwritten definitions remain a
> safe fallback and the source of labels, intent, order, z-order, and anchors;
> legacy bodies are untouched.

### 5. Outfit detail kits (§4b) — body-independent, ~2 facings each

The conforming torso layer is DERIVED from the body silhouette (never drawn).
Only distinguishing details are drawn, anchored to body sub-anchors. The target
model authors each reusable detail piece as its own file
(`blazer.lapels.south.svg`, `blazer.buttons.south.svg`) so pieces can later be
recombined without redrawing. Tee is the deliberately smaller first adapter:
its neckline is one combined kit file per authored facing. Componentized
multi-piece aggregation begins with Blazer rather than being hidden inside a
flat whole-garment source. North kit exists only where the garment reads from
behind.

> **Production outfit compatibility (2026-07-10):** every row below has a
> body-anchor-driven code builder, including blazer pocket and suit notch/
> pocket-square vocabulary. Review sheets are
> `body-archetypes-outfits-{south,east,north}.png` and
> `body-archetypes-outfit-distance.png`. The unchecked cells remain the optional
> authored-source SVG backlog, not a runtime compatibility gap.

> **Tee anchored-detail intake (mechanically complete, visual approval open):**
> `tee.south.svg` and `tee.east.svg` are authored over `body-balanced`, whose
> body origin is `(64, 87)` and neck is `(64, 58)`. The importer requires every
> visible path to be `detail/*`, then pre-expands that one source set onto the
> neck of all five production bodies in stable order. The dynamic body remains
> the conforming torso and owns z-order. Legacy bodies and future body IDs keep
> the procedural/static fallback. Tee's inventory cells stay open until its
> render is visually approved and the remaining Definition of Done checks pass.
> Componentized lapels/buttons/pocket placement for Blazer is the next deferred
> outfit adapter, scheduled after the current silhouette-bearing hair review
> rather than ahead of it.

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
| dress | bodies × 3 facings | mechanically complete; visual refinement deferred |
| (long coat — only if added) | bodies × 3 | deferred |

> **Dress follow-up (2026-07-09):** the per-body implementation and compatibility
> matrix are complete, but the current shape language is not approved final art.
> Revisit the waist transition, profile read, and high-contrast outline treatment
> in a dedicated visual pass.

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
