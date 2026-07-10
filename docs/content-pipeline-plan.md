# Content Pipeline — from procedural appearance to compiled identity

Direction + phased plan, written 2026-07-09. Companion to
`TOOL_ARCHITECTURE.md` (the engine/content-pack split); this doc covers where
assets *come from*, while that one covers how they're *organized*. The
deliberately authored primitives are tracked by milestone in
`core-part-library.md`. Canonical character-part sources are strict SVG: they
may be written directly, generated and curated, or edited in a compatible
vector editor. No particular editor is a production dependency. Nothing here
changes the export contract except where explicitly flagged (floor variants).

---

## 1. The reframe

Terrarium's job is to procedurally generate **identity**, not **appearance**.

The identity layer — recipes (part ids + palette), slots/anchors/facings, the
5-token palette system, the 47-blob autotile contract, atlas metadata, layer
atlases, deterministic export — is stable, valuable, and stays procedural.

The appearance layer — silhouettes, shading, texture composition — is where
procedural generation stopped scaling: walls needed taste-tweaks expressed as
geometry code, characters have no small-size story, floor noise repeats on a
visible 128-unit lattice. Appearance moves toward hand-authored **source
assets** that flow through the same contracts (`$token` fills, part-local
coordinates, the `silhouette` flag), so composite-time restyling survives.

Terrarium becomes an **asset compiler**: ingredients in (hand-drawn SVG *and*
procedural generators), coherent visual language out (atlases, recipes, LOD,
palette/clinical/theme variants, Unity-ready metadata).

## 2. The decision rule

> **Only hand-author assets whose quality cannot be recovered procedurally.**
>
> Tiebreaker: if the same asset's constants have been re-tuned for taste
> reasons 3+ times (see the `BEVEL` history in `src/tiles/templates.ts`),
> it wants to be art.

Hand-author: heads, hair, outfits, the wall bevel kit, iconography, major
props. Keep procedural: composition, palettes, outlines, moods/overlays,
badges, LOD machinery, atlases, floor variation (generator + human curation),
shadows, metadata, randomization, layout.

Two input types, one compiler:
- **Authored assets** — deliberate, reviewable SVG sources produced directly
  or with an optional visual editor, then validated on import.
- **Generator programs** — code that emits candidates a human curates
  (e.g. floor speckle seeds culled in the repeat preview, winners frozen).

## 3. Phased plan

Each phase pays for itself if work stops after it. Dependencies: 0 → 1 are
independent of the rest; 2 gates 3 and 4; 3 before 4 as an art warm-up.

### Phase 0 — Measurement harness (~1–2 days)

- **Game-zoom test strip**: render cast + each part at actual in-game px
  (confirm the real number from the sim's camera) in the compare view /
  part editor loop.
- **Zoomed-out repeat preview** for floors/grounds: extend
  `composeFloorRepeat` (`src/core/exporter.ts`) to a large grid rendered
  small so lattice artifacts are visible in-tool.
- These surfaces are also where the readability lints (§4) render.

Exit: you can point at a part or floor in-tool and say what fails at game zoom.

### Phase 1 — Cheap fixes, no new pipeline (~3–5 days tool-side)

1. **Floor/ground variants**: seed becomes a template param; export 3–4
   variants per material; atlas gains a `variants` list; sim picks by
   cell-coordinate hash. Contract change → update `CONTRACT.md`; ship
   tool-side first with a single-variant compatible default.
2. **Sheen-band cleanup**: fixed-position highlights in linoleum,
   utility-vinyl, polished-concrete, lobby-stone violate the ground-surface
   rule already stated in `src/tiles/templates.ts` — convert to low-frequency
   mottle or delete, judged in the repeat preview.
3. **Outline floor at small raster sizes**: when the effective on-screen
   stroke falls below ~1px, scale the outline pass up. Keep out of the
   snapshot-tested path (snapshots render at `SIZE = CANVAS`).
4. **Value-contrast guard** in palette pools (`src/core/look.ts`): enforce
   minimum luminance separation between skin/outfit/hair tokens.

### Phase 2 — Content Pipeline, milestone 1: character parts (~1–2 weeks)

The keystone. Scope milestone 1 strictly to parts; the pipeline grows by
adding intake types later (wall pieces → Phase 3, floor-variant curation,
icons), not by upfront design.

1. **Importer** (`scripts/importParts.ts`, build-time): `svgson` to parse,
   `svgpath` to bake nested transforms into absolute 128-space path data,
   `svgo` (preserving ids/layer names) to clean. Mapping: sentinel hexes →
   `$token` fills; layer name `detail/*` → `silhouette: false`; filename
   encodes slot/id/facing (`parts/hair/ponytail.south.svg`). Emits generated
   part-data modules registered into `PART_LIBRARY` (or the ContentPack
   registry if the `TOOL_ARCHITECTURE.md` dependency inversion lands first —
   separable; don't let it gate the importer).
2. **Hard validation, fail loudly**: reject gradients, filters, masks, clip
   paths, text, images; enforce canvas bounds + the tint-purity invariant
   (`tests/contract.test.ts`). The validator, not the editor, defines what's
   acceptable — editor choice stays free.
3. **Template scaffolds**: tool command exporting per-slot guide SVGs —
   128 grid, anchor markers, body-capsule / head-radius guides, an existing
   part on a named reference layer, and sentinel swatches. Portable ASE, GPL,
   and readable SVG palette companions support optional editors. Implemented
   for current head/hair intake and the south/east tee kit under
   `assets/part-authoring` via `npm run parts:scaffolds`; semantic IDs, not
   editor-only layer state, define what the importer ignores.
4. **Headless intake proof**: derive `hair-bob` sources from the generated
   scaffolds, make a deliberate canonical-SVG detail edit, compile them through
   the importer, and regenerate compositor snapshots. Implemented 2026-07-10:
   the new three-facing parting detail changes only `hair__hair-bob.svg`,
   `janice.svg`, and `janice__moods.svg`. The rendered production-size result
   and 32/48 px strips were approved and committed in `240ee03`. The first
   follow-on promotion used the same path for `head-round`: a shaped front jaw,
   directional east profile, stable rear contour, and unchanged ink-eye
   details. Its bounded compositor surface was the round-head part plus Carl
   and Linda's facing/mood sheets; the approved promotion is `9e932eb`.
5. **Anchored outfit-detail adapter**: `outfit-tee` is the first body-aware
   intake target. Its south/east SVGs are authored once over `body-balanced`,
   with the body origin at `(64, 87)` and neck at `(64, 58)`. Every visible
   path must compile as `detail/*` / `silhouette: false`, so the selected body's
   `$outfitPrimary` silhouette remains the conforming torso. At build time the
   importer translates that kit to each production body's neck and emits the
   five variants in stable archetype order. The runtime overlay replaces only
   known production detail shapes while preserving the code builder's z-order;
   legacy bodies, future body IDs, and unauthored north keep the original
   procedural/static fallback. The adapter is mechanically complete; tee art
   approval and M1 exit remain open. Componentized Blazer intake—separate
   lapels, buttons, and pocket with explicit multi-anchor placement—is the next
   deferred outfit adapter rather than a flat whole-garment shortcut.
6. **Provenance**: each imported asset records source
   (`authored | generated | curated`) in its generated module, so lints and
   future audits know what's re-generatable. `authored` means deliberate
   canonical repo SVG regardless of authoring tool; `generated` means
   generator-owned and reproducible; `curated` means selected and frozen
   generator output.

### Phase 3 — Wall bevel piece kit (~1 week; first authoring test)

Constrained geometry, fixed light direction, existing reference — the
gentlest introduction to hand-authoring, highest tweak-pain relief.

1. Export the current 47-tile sheet as an SVG reference layer (extend
   `scripts/wallTilesetPreview.ts`).
2. Author the shared kit over it: 4 lit edge faces, 4 convex miters,
   4 concave notches (~12 pieces; fixed lighting means no rotated copies).
3. Assembler places pieces per `configForIndex` corner/edge states
   (`src/tiles/blob.ts`). Blob contract, `wallBody` fill, `OVERHANG`
   clipping untouched.
4. Per-template detail (brick courses, slats) stays procedural for now.
5. One deliberate snapshot regen; review the 47-tile sheet diff.

Fallback if the authored bevel doesn't beat procedural after ~2 days of
drawing: extract `BEVEL` into a declarative spec + live tweak panel — fixes
the tweak pain without art.

### Phase 4 — Character parts, incrementally (ongoing)

1. **LOD flag first**: detail tier on `ShapeSpec`; compositor drops interior
   detail below a threshold export size. Benefits procedural parts too.
2. Re-author by silhouette priority — heads and hair first, then bodies +
   outfits (§4b) — judged against the zoom strip. Accessories last (already
   glyph-like). Moods/badges/poses stay procedural.
3. No flag-day: imported and procedural parts coexist behind `PartDef`.

#### 4b. Distinct body types + the three-layer garment model

Decision (2026-07-09): body types are **distinct authored silhouettes** (fat /
thin / broad / etc.), not width-scaled variants of one capsule — `bodyWidth`
alone cannot express them. Outfit variety stays deliberately low (a few basic
templates per body type). Consequences:

- **Bodies own their sub-rig.** Each body part exports per-facing sub-anchors
  (neck, shoulders, waist, hem) instead of the compositor's global anchor
  constants. Outfit details, pose arm strokes, and body accessories (lanyard,
  badge) read the body's anchors. This is also a concrete step toward the
  pack-declared rig in `TOOL_ARCHITECTURE.md`.
- **Garments are three layers:**
  1. *Conforming layer — derived, free*: the body silhouette path re-filled
     with `$outfitPrimary` (minus neck opening) is the fitted torso of any
     tee/polo/shirt. Fits every body type automatically because it IS the body.
  2. *Detail kit — authored once, body-independent*: collar, lapels, tie,
     zipper, hood — small overlays placed at the body's sub-anchors.
  3. *Silhouette-altering garments — authored per body, rare*: dress hems,
     long coats, bulky vests; per-body variants
     (`outfits/dress.<bodyType>.<facing>.svg` in the import convention).
- **Marginal-cost rule**: a new fitted garment costs a detail kit (~3 drawings),
  never a wardrobe (bodyTypes × facings). Only silhouette-changers pay the
  full matrix, and the low-variety constraint keeps that matrix small.
- `PartDef` grows body-type-aware variants for slots that need them
  (outfits keyed by `(bodyType, facing)` where authored per body; single
  variant + conforming derivation otherwise).
- **Implemented fitted-detail proof (2026-07-10):** Tee now exercises the
  single-kit, neck-anchored case end to end. This does not yet solve reusable
  multi-piece aggregation or torso-frame deformation; Blazer is the bounded
  follow-up for that explicit adapter.

## 4. Readability lints (compiler warnings, not scores)

Terrarium critiques; humans judge. Ship measurable checks with thresholds and
suggested fixes — no aesthetic star ratings (an unbackable grade gets ignored).

Initial lint set (all cheap at export/preview time):

| Lint | Measure | Fires when |
|---|---|---|
| Vanishing part | silhouette pixel coverage of the part at 32px render | coverage below threshold ("this hairstyle disappears below 40px") |
| Outline dropout | effective outline stroke in screen px at game zoom | < ~1px |
| Palette collapse | luminance separation between adjacent tokens (skin/outfit/hair) | below threshold |
| Detail noise | interior (`silhouette:false`) shape density at 32px | above threshold — suggests LOD flag |
| Grid periodicity | autocorrelation of the rendered floor repeat at 128px lag | strong 128-unit peak — suggests more variants / kill fixed-position accents |

Render these in the Phase 0 surfaces (zoom strip, repeat preview) and in the
export log.

## 5. Cross-cutting rules

- **One deliberate `test:update` per phase**; review snapshot diffs as the
  regression surface, never rubber-stamp.
- **Contract changes** (floor variants only, so far) go through `CONTRACT.md`
  with a sim-compatible default.
- **Scope anchor**: "visual identity compiler" clarifies Terrarium's sprite
  identity, it does not add a fourth identity next to scenario/persona
  authoring. Compiler features exist to serve The Water Cooler's asset needs
  first; generality arrives via the ContentPack second-pack test, not
  speculation.

## 5b. Builder asset asks (sim-driven, tracked in the sim repo)

The sim's office-builder pivot (2026-07-05/07) defines what Terrarium supplies;
source of truth: sim `docs/design/terrarium-office-builder-assets.md`. Status
as of 2026-07-09:

**Done (code landed):** grid footprints `{w,h}` + sub-cell pivots on
`PropTemplate`; `facility-catalog.json` export; build-site assets (outdoor
ground kinds + clinical exemption, cars/parking decals, construction-worker
character, nature decals, grass-fringe overlays on the 47-blob contract);
warm-by-default look with sim-owned runtime drain.

**Open:**
- Surveillance apparatus props (cameras, sensors — QuotaCo "tech you place");
  new templates, B4/B5 timing.
- IRIS installation unit (server-rack facility sprite).
- QuotaCo-standard facility variants (sim Q5: mix of explicit paired templates
  for signature facilities + the clinical lens for ambient corporatization).
- Carryover-character support: the authored-and-likable handful. Visual
  identity (recipes/looks/portraits) is Terrarium work on the existing part
  alphabet; behavioral richness is sim-side authoring per ADR-0003.
- Character drain: **no new exports needed** (runtime crossfade between the
  warm and `unit` renderings, both already shipped).

These ride the same pipeline this plan builds — new props go through the same
templates/importer/lints as everything else.

## 6. Reference material

`C:\Users\tbiag\Downloads\rimworld-avatar-creator` (fan tool) contains RimWorld's
actual part textures (`data/flutter_assets/assets/sprites/`): 128×128 RGBA PNGs,
south/east/north facings, grayscale-authored for runtime tinting. **Ludeon's
copyrighted art — reference only. Never import, trace-copy, or ship it.**

What it calibrates for Phases 2–4:

- **Architecture validation**: same 128 canvas, same 3-facings-plus-mirrored-west,
  same tint-at-runtime philosophy as Terrarium's rig. The contracts are right.
- **Detail budget**: shipped-game parts are far simpler than intuition suggests —
  hair is pure silhouette + 1–2 interior creases; heads are one template with
  eye dots; shading is a single soft gradient inside a thick dark outline.
  Readability comes from outline weight + value contrast + silhouette, not detail.
- **Lint thresholds**: measure its outline px, silhouette coverage at small sizes,
  and layer value separation as empirical targets for the §4 lints.
- **Scope numbers**: ~5 bodies / ~14 heads / ~50 hairs / ~20 beards / ~70 apparel
  is a full commercial library; an office game needs a fraction.
- **Cost lesson**: RimWorld draws body apparel per body type (5×3 = 15 textures
  per garment) because its source is pixels. Terrarium's answer is not
  `bodyWidth` scaling (insufficient once body types are truly distinct
  silhouettes — decided 2026-07-09) but the three-layer garment model in §4b.
- **Facing economies**: beards ship south+east only (occluded from behind);
  Terrarium parts may likewise skip facings where occlusion allows.
- **One style gap**: RimWorld's soft airbrush shading needs gradients, which
  `ShapeSpec` doesn't support (flat fill/stroke/opacity). Decide deliberately:
  keep Terrarium's flat look (layered low-opacity shapes approximate soft
  shading), or extend `ShapeSpec` with gradient fills — don't drift into it
  per-part.

## 7. Risks

1. **Importer scope creep** — the strict-subset validator is what keeps
   milestone 1 a week, not a quarter.
2. **Authored bevel may not beat procedural** — bounded by the Phase 3
   fallback (declarative spec + tweak panel).
3. **Lint distrust** — a lint that fires wrongly gets ignored; start with the
   five objective measures above, tune thresholds against known-bad cases
   (the current lattice artifact, the vanishing accessories) before adding
   more.
4. **Snapshot churn fatigue** — mitigated by the one-regen-per-phase rule.
