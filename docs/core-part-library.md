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
      production head/hair overlays, the all-ten head-aware hair fit resolver,
      the first body-aware tee adapter, and componentized
      Blazer/Polo/Shirt + Tie/Turtleneck detail intake)
- [x] Template scaffold SVGs for all six production bodies, all six human-head
      families plus the special fabrication-unit head, supported hair, and
      Tee/Blazer/Polo/Shirt + Tie/Turtleneck intake (128 grid, anchors,
      capsule/head guides, seeded editable art, named reference layer) with
      semantic IDs for every editable and ignored path
- [x] Sentinel color palette defined and generated as ASE, GPL, and readable
      SVG companions (`npm run parts:scaffolds`); every scaffold also embeds
      the five exact swatches
- [x] Headless bob intake proof: scaffold → deliberate three-facing SVG
      parting edit → importer → generated overlay → exactly the three expected
      compositor snapshots
- [x] Anchored-detail mechanics proof: one south/east tee source set on
      `body-balanced` → deterministic six-body pre-expansion. Visual approval
      remains part of M1 rather than an importer prerequisite.
- [x] Component-detail mechanics proof: six Blazer sources keep lapels,
      buttons, and pocket separately addressable, aggregate in manifest order,
      and fit upper/lower torso frames across all six production bodies; four
      Polo sources reuse that contract for independent upper-frame collar and
      placket pieces, and four Shirt + Tie sources reuse it for independent
      upper-frame collar and tie pieces. Three Turtleneck sources exercise the
      same frame across all authored facings, including north.
- [x] Body-art ownership proof: 18 canonical production SVGs → one in-place
      shared `PartDef` set with byte-stable visible geometry and unchanged typed
      rig identities
- [x] Semantic SVG conventions compiler-tested: slash IDs, ignored guide /
      reference groups, `detail/*`, exact sentinel colors, and nonzero fill

Optional visual-editor interoperability is useful, but it is not an M1
prerequisite and no named editor is a production gate.

Mechanical readiness and canonical-source status do not normally imply visual
approval. The six bodies and all six heads have now passed that separate human
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
- [x] Wall bevel kit (all 12 pieces) + all-opaque assembler + snapshot regen
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
- [x] 3 hairstyles (one per major family)
- [x] Tee visual approval + one more outfit detail kit (Blazer approved)
- [ ] Crowd pass + distance pass + stress test

**Exit:** a generated office screenshot reads as hand-crafted art.

### M3 — Full alphabet

- [x] Remaining hairstyles
- [x] Remaining outfit detail kits
- [x] Dress mechanics and approved per-body visual refinement
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

The canonical sources, compiler, assembler, approved Office pilot, and all-
material proof are complete. The shared kit is applied to all eight opaque wall
styles; their template-specific material detail remains procedural but bounded
inside the material surface and below the authored faces. The seven follow-on
wall snapshots were visually approved on 2026-07-10. Glass and Curtain remain
intentionally procedural, bevel-free, and byte-identical.

- [x] Edge faces: north / south (tall lit front) / west / east (4)
- [x] Convex corner miters: NW / NE / SW / SE (4)
- [x] Concave notches: NW / NE / SW / SE (4)
- [x] Assembler wired to `configForIndex` + one deliberate Office snapshot regen
- [x] All-opaque shipped-palette proof + seven deliberate snapshot updates

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

The six stable IDs now carry the accepted redesign hulls without a recipe
migration: `head-round` = Round, `head-oval` = Broad, `head-long` = Long,
`head-boxy` = Block, `head-angular` = Point, and `head-soft-square` = Lantern.
All eighteen canonical south/east/north SVGs keep literal-ink eye detail and
one rigid `headCenter` transform group. Production bodies own their lifted
head datum; legacy bodies retain the original fallback datum and frame.

The promoted datum is three source units closer to the torso than the original
one-row proof. In the complete 144-cell hairless source matrix (six heads × six
bodies × four facings), filled head and torso silhouettes retain 4–8 clear
pixels at 128 px. Expanded outlines may kiss after downsampling to 40 or 48 px;
that near-touch is intentional and avoids the detached “floating head” read.
The complete 288-cell gameplay matrix remains inside the cell. Full-body
production sprites and reconstructable layers share the fixed five-source-unit
reframe, matching external anchors and atlas pivots. Portraits use a separate
head-centered crop. The intentionally oversized high-contrast preset and the
older tall-hair extremes remain bounded calibration debt for their dedicated
passes. Run `npx tsx scripts/headSilhouettePreview.ts` to regenerate the
previous-versus-production distance sheet and representative compatibility
sheet under `docs/previews/head-silhouettes-*`.

### 2b. IRIS fabrication unit — special recipe-only parts

- [x] `head-fab`: complete south/east/north canonical SVG sources under
      `assets/parts/head/fab.*.svg`, with a machine silhouette, no human face,
      and the IRIS optic as the only green focal point.
- [x] `outfit-fab-chassis`: complete canonical south/east/north SVG sources
      under `assets/parts/outfit/fab-chassis.*.svg`, received only on the
      approved `body-large-frame` production rig. The former handwritten
      `anchoredFabChassis()` geometry has been removed.

These two ids are intentionally **resolvable but non-selectable**: the
`construction-worker` recipe and compositor snapshots resolve them through
`getPart()`, while `partsForSlot()` filters them out of character pickers and
random/seeded employee generation. They belong to IRIS's fabrication robot,
not the human part alphabet. The set is mechanically complete and received a
shared visual refinement pass on 2026-07-10. The chassis SVG source-fit
received explicit visual approval and production promotion on 2026-08-02; its
appearance remains visually iterative through those canonical files rather
than frozen final art.

### 2c. Cafeteria service staff — special recipe-only parts

- [x] `outfit-service-apron`: body-anchor-driven bib apron over a tee; the
      apron uses `$outfitPrimary` and the tee/sleeve field uses
      `$outfitSecondary` across every production body and facing.
- [x] `acc-hairnet`: translucent head-center overlay above the hair layer; its
      outline/net mesh opts out of silhouette generation so every underlying
      hairstyle remains readable.

Both ids are resolvable by the code-owned `kitchen-worker` recipe in
`KITCHEN_STAFF`, but are filtered by `NON_SELECTABLE_PART_IDS` from ordinary
pickers and random/seeded employee generation. The recipe remains outside
`DEFAULT_CAST` because cafeteria staff are non-desk occupants. This v1 adds no
poses or animation frames and does not introduce a new staff export folder;
the sim-owned campus population lane binds staff when its stable config id is
ratified.

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
sources, with Bob as the Medium-family control. Short's approved textured
front/rear edge and sculpted profile compile through the shared head-fit adapter;
Long straight remains an explicit byte-stable target. Long straight east uses
a single rear fall and short temple edge so the profile turn reads distinctly.
Run
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
goldens, distance proof, 4,320-cell hair compatibility matrix, and full
head/accessory matrices pass. Their inventory cells record user visual
approval on 2026-07-10.

All ten redesigned head-aware hairstyles are now live in production. Each
stable hair ID resolves a fixed south/east/north variant for all six production
head IDs. Resolution happens inside the compositor, so flat sprites, portraits,
operational units, and reconstructable hair layers agree while recipes keep the
same IDs. All ten mapped hairstyles now own their live geometry through approved
`head-fitted-art` adapters and six declarative envelopes; all ten former code
path builders are removed. Bun's cap and disconnected knot retain separate
declarative fit frames; Ponytail's tie and tail share one attachment transform
while its cap fits independently. Long straight retains a tall curtain with an
open south face and a two-piece east profile under one bounded frame. Balding
retains independently editable tapered temples, rear piece, and low horseshoe.
Pixie retains an independently fitted broken cap/fringe and directional side
tufts. Side-part retains its swept cap and source-owned crease independently
from its side/rear mass. Curly and Coils retain one independent center/radius
frame per editable lobe, with Coils preserving the denser 8/6/8 cloud. Every fitted pair
remains distinct at 32 px across the authored facings. The 4,320-cell
top-overflow audit improves from the pre-fitting 766 to 467 high-contrast-only
cells without non-top overflow; this promotion adds no animation or
export-schema state.

### 4. Bodies (§4b) — archetype frames, N × 3 facings

Body types are **archetypes that read from orbit**, not BMI steps. Approved set:

- [x] **Six-body redesign promoted (2026-07-27): Block, Barrel, Wedge,
      Column, Bell, and Pinch.** The first five retain the stable compact,
      balanced, large-frame, tall, and soft IDs; Pinch adds `body-pinch`.
      Standard/slim/broad remain resolvable for existing projects.
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
| pinch | [x] | [x] | [x] |

18 drawings. North is usually south minus front shading.

> **Production body set (redesign promoted 2026-07-27):** `src/parts/bodyArchetypes.ts` registers
> `body-compact`, `body-balanced`, `body-large-frame`, `body-tall`, and
> `body-soft` in their previous stable order, followed by the new independent
> `body-pinch`. Their displayed families are Block, Barrel, Wedge, Column,
> Bell, and Pinch. Pickers,
> random characters, and seeded employee generation all consume that production
> list. `body-standard`, `body-slim`, and `body-broad` remain resolvable for old
> recipes, but are never offered for new selection. The named/default cast now
> uses four distinct production hulls (`body-pinch`, `body-balanced`,
> `body-soft`, and `body-large-frame`) so an ordinary export cannot mix the
> retired pawn silhouettes back into the live cohort. Run
> `npx tsx scripts/bodyArchetypePreview.ts` to regenerate the
> character, flat-silhouette, active-sub-anchor, and rigged vertical-slice sheets
> under `docs/previews/body-archetypes-*`. The production rigs drive the head
> stack, portraits, overhead attachments, all 11 human outfits, all 15
> poses, and pose-aware wrist/carry placement while preserving exact fallback
> for legacy bodies. Watches follow every wrist; each normalized recipe may own
> one bulky held prop, which renders only when the pose publishes a free carry
> hand. The production set passes an 11,880-render body/outfit/pose/facing/style
> matrix plus a strict fitted-paint mask, while the legacy rendering digest stays
> pinned. **Dress is mechanically and visually approved;** its stronger
> waistband and skirt silhouette add no new body rig or animation surface.
>
> The six bodies now own 18 canonical files under `assets/parts/body`.
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

> **Tee anchored-detail intake (approved 2026-07-27):**
> `tee.south.svg` and `tee.east.svg` are authored over `body-balanced`, whose
> body origin is `(64, 87)` and neck is `(64, 58)`. The importer requires every
> visible path to be `detail/*`, then pre-expands that one source set onto the
> neck of all six production bodies in stable order. The dynamic body remains
> the conforming torso and owns z-order. Legacy bodies and future body IDs keep
> the procedural/static fallback. The focused review sheet is
> `character-tee-anchored-fit-v1.png`; it received visual approval across all
> six bodies, four facings, three palettes, two style presets, and literal
> 40/48 px cells. The broader scene-preview and stress gates remain open.
>
> **Blazer component-detail intake (approved 2026-07-27):** six canonical files
> keep `lapels`, `buttons`, and `pocket` as three
> independent source pieces across south/east. The manifest fixes their paint
> order and shape counts. Lapels fit through the neck/shoulder/chest frame;
> buttons and pocket fit through the chest/waist/hip frame. The complete
> aggregate replaces only known production-body variants, while north, legacy,
> and future bodies retain the handwritten fallback. The focused review sheet
> is `character-blazer-component-fit-v1.png`; broader outfit and 32/48 px
> sheets were regenerated from the same production compositor and received
> visual approval.
>
> **Polo component-detail intake (approved 2026-07-27):**
> four canonical files keep `collar` and `placket` independent across
> south/east. Both pieces fit through the neck/shoulder/chest frame and replace
> only known production-body variants; north, legacy, and future bodies retain
> the handwritten fallback. The focused review sheet is
> `character-polo-component-fit-v1.png`, which received visual approval across
> the six bodies, four facings, palette/style variants, and literal 40/48 px
> cells.
>
> **Shirt + Tie component-detail intake (approved 2026-07-27):** four
> canonical files keep `collar` and `tie` independent across
> south/east. Both fit through the neck/shoulder/chest frame and replace only
> known production-body variants. The east tie stays at the forward torso edge
> and west mirrors it rather than placing the tie through the profile center;
> north, legacy, and future bodies retain the handwritten fallback. The focused
> review sheet is `character-shirt-tie-component-fit-v1.png` and received
> visual approval after the profile tie moved to the forward torso edge.
>
> **Turtleneck component-detail intake (mechanically complete and visually
> approved):** one `neck-band` component is authored for south, east, and north.
> It fits through the neck/shoulder/chest frame on all six production bodies;
> the band rises behind the head to fill the 3 px head/torso gap rather than
> sitting as a detached chest mark. It uses `outfitPrimary`, and its widened
> profile retains comparable collar weight against the south/north view. West
> mirrors east while legacy and future bodies retain the handwritten fallback.
> The focused review sheet is
> `character-turtleneck-component-fit-v1.png`.
>
> **Cardigan component-detail intake (mechanically complete and visually
> approved):** four canonical files keep `trim` and `button-line` independent
> across south/east. The neckline trim fits through the upper-torso frame;
> the opening seam and two buttons fit through the lower-torso frame. West
> mirrors east while north, legacy, and future bodies retain the handwritten
> fallback. The focused review sheet is
> `character-cardigan-component-fit-v1.png`.
>
> **Suit Jacket component-detail intake (mechanically complete and visually
> approved):** twelve canonical files keep pocket square, lapels, buttons, pocket,
> tie, and notches independent across south/east. Each consumes the established
> upper- or lower-torso frame; the east tie stays at the forward torso edge and
> west mirrors it. North, legacy, and future bodies retain the handwritten
> fallback. The focused review sheet is
> `character-suit-jacket-component-fit-v1.png`.
>
> **Hoodie component-detail intake (mechanically complete and visually
> approved):** six canonical files keep hood, drawstrings, and pocket independent.
> The hood is authored in south/east/north; drawstrings exist in south/east;
> the pocket seam exists in south. Upper/lower torso frames fit those pieces
> across all six bodies without inventing missing directional detail. West
> mirrors east. The focused review sheet is
> `character-hoodie-component-fit-v1.png`.
>
> **Sweater Vest component-detail intake (mechanically complete and visually
> approved):** three canonical files keep the secondary-fabric panel, contrasting
> V-neck inset, and front buttons independently authorable. Panel and inset
> exist only in south, as do the buttons. Upper/lower torso frames
> fit the pieces across all six bodies while the surrounding primary fabric
> remains visible as the shirt and sleeves. East/west intentionally carry no
> vest overlay; north retains the handwritten rear fallback. The focused review sheet is
> `character-vest-component-fit-v1.png`.

| Garment | Detail pieces | south | east | north |
|---|---|---|---|---|
| tee | neckline | [x] | [x] | — |
| polo | collar, placket | [x] | [x] | — |
| shirt-tie | collar, tie | [x] | [x] | — |
| turtleneck | neck band | [x] | [x] | [x] |
| cardigan | button line, trim | [x] | [x] | — |
| blazer | lapels, buttons, pocket | [x] | [x] | — |
| suit-jacket | lapels, buttons, pocket, tie, pocket square, notches | [x] | [x] | — |
| hoodie | hood (down), pocket, drawstrings | [x] | [x] | [x] |
| vest | V, sleeve color split | [x] | — | — |

≈ 22–24 small drawings; lapels/collars/buttons are shared vocabulary across kits
where they genuinely match.

### 6. Silhouette-altering garments (§4b) — per body type

The only place the body-count multiplier is paid; kept small on purpose.

| Garment | Matrix | Status |
|---|---|---|
| dress | bodies × 3 facings | mechanically and visually approved |
| (long coat — only if added) | bodies × 3 | deferred |

> **Dress refinement v1 (visually approved):** the per-body implementation now
> uses a structured contrast waist, broader curved hems, continuous waist
> curves, front-biased profiles, and reduced skirt-seam weight. It keeps the six
> accepted upper-body rhythms and adds no
> new rig or animation surface. `character-dress-silhouette-fit-v1.png` at
> 40/48 px and `body-archetypes-dress-styles.png` in high contrast received
> visual approval on 2026-07-28.

### 7. Conditional — only if the readability lints flag them

- [ ] glasses (most likely to vanish) · [ ] headset
- Others: leave procedural.

---

### 8. Builder props (sim-requested — see plan §5b)

New prop art the office-builder pivot asks for. Default to procedural
templates (Tier 1/2 below); escalate to authored only where signature:

- [ ] Surveillance camera (wall-slot) — Tier 2 candidate (thematic accent art)
- [ ] Surveillance sensor/monitor — Tier 1/2
- [x] IRIS installation unit (weighted apparatus + centered console,
      live/dormant) — mechanically shipped and visually promoted as the
      approved R1+D3 Tier-2 signature prop; live geometry is now owned by the
      canonical SVGs in `assets/props/iris-hardware-v1/`
- [x] IRIS charging dock — mechanically shipped as non-placeable plan hardware;
      its canonical SVG now owns production geometry while visual polish
      remains iterative
- [x] IRIS fabrication crew — special `head-fab` + `outfit-fab-chassis` recipe
      on `body-large-frame`; resolvable-only parts, never general picker options
- [ ] QuotaCo-standard facility variants — per sim Q5: explicit paired
      templates only for signature facilities; the clinical lens covers
      ambient corporatization

Carryover characters need **no new part class** — they are recipes over this
alphabet, plus sim-side behavioral authoring (ADR-0003).

### 9. Exterior flora — wild-field starter kit

The first exterior review pass bakes twelve readable wild-flora silhouettes
plus five field-surface instances. Silhouette families are deliberately
authored; texture scatter, palette, and seed-level micro-variation stay
procedural. Mature trees and saplings are tall, front-facing elevation props;
shrubs and herbaceous patches are low, plan-projected field cover.

| Family | Stable exported ids | Backing template / role | Status |
|---|---|---|---|
| Mature trees | `prop-tree`, `prop-tree-b`, `prop-tree-upright`, `prop-tree-conifer` | Elevation `tree-canopy`; broad, spreading/asymmetric, upright, conifer | [x] |
| Saplings / understory | `prop-tree-sapling`, `prop-tree-sapling-b` | Elevation `tree-sapling`; single-crown and multi-stem reads | [x] |
| Wild shrubs | `prop-bush-cluster`, `prop-bush-bramble`, `prop-bush-low` | Plan `bush-cluster`; dense, loose/bramble, low-spreading | [x] |
| Herbaceous patches | `prop-wildflower-patch`, `prop-tall-grass-clump`, `prop-bracken-patch` | Plan `wildflower-patch`, `tall-grass-clump`, `bracken-patch` | [x] |
| Field ground | `ground-grass`, `ground-grass-b`, `ground-grass-c`, `ground-meadow`, `ground-meadow-b` | Curated generator instances that break large-field cadence | [x] |
| Rock accent | `prop-boulder` | Existing `boulder`; retained outside the twelve-flora count | [x] |

Stable instance ids are intentional even where several share a template:
Terrarium owns the generator's parameter/seed range, but Unity receives baked
sprites. Exporting a curated set gives runtime scatter deterministic variety
without porting the art generator.

The wild grammar is asymmetrical crowns, broken edges, irregular negative
space, and uneven clusters. The later landscaped grammar is a separate kit:
clipped masses, deliberate geometry, repeated rhythm, and explicit bed/edge
shapes. Do not turn these wild ids into garden forms; add ornamental trees,
clipped/flowering shrubs, ornamental grass, groundcover, flower beds, connected
hedges, mulch, and edging under new stable ids after this field kit is approved.

This is additive art inventory only — no payload/schema migration. Unity
scatter/import-catalog adoption is deferred until visual approval, and these
non-placeable props remain outside `facility-catalog.json`.

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
