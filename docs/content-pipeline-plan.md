# Content Pipeline — from procedural appearance to compiled identity

Direction + phased plan, written 2026-07-09. Companion to
`TOOL_ARCHITECTURE.md` (the engine/content-pack split); this doc covers where
assets *come from*, while that one covers how they're *organized*. The
deliberately authored primitives are tracked by milestone in
`core-part-library.md`. Canonical character-part sources are strict SVG: they
may be written directly, generated and curated, or edited in a compatible
vector editor. No particular editor is a production dependency. Nothing here
changes the export contract except where explicitly flagged (floor variants).

> **Current Water Cooler art-direction amendment (owner-locked 2026-07-19):** the next environment proof is
> [QuotaCo high-oblique geometry](quota-co-high-oblique-geometry-ask.md): a transparent production-scale
> floor/equal-height-structural-wall/opening/junction sheet, followed only after approval by a minimum four-facing prop
> family and isolated Unity golden room. This preserves the content-pipeline reframe and 47-blob substrate but
> supersedes any assumption that the current strict plan presentation is the final environmental style. It does
> not pull character phases, gameplay features, or a full catalog redraw into the geometry proof.
> The 2026-07-20 connected-room review rejected independently finished base/upper wall halves. A later review
> found that the unified-envelope correction still collapsed profile height and directional plane treatment:
> north/south runs must read flat/front-on, east/west runs flatter-from-above, and their joints must mediate
> those authored cross-sections rather than enforce transpose identity. On 2026-07-21 the owner accepted the
> northwest full/full corner plus the reanchored northeast/low-east facing checkpoint: east and west now share
> plane depth while reversing local handedness so both fascias face the room. The owner subsequently accepted
> the low-southeast corner with the south cream/coral/green stack owning the foreground heel and the east coping
> terminating behind it. The southwest full-to-low transition now applies the same ownership rule at the height
> step: its broad west plane terminates behind the shallow south coping while the south stack wraps the complete
> foreground heel. The accepted source checkpoint remains isolated from production templates, topology
> propagation, schema, and Unity until that migration receives separate approval.
> **Equal-height wall decision, 2026-07-21:** ordinary structural wall cells use one full profile on
> every room edge. South is promoted as exact reuse of the full-north base/upper sources with no transform,
> duplicate SVG, or new identity. The equal-height southwest molded corner is now promoted in the existing
> `transition_w_to_s` source pair; its south frontage owns the foreground heel. Southeast is promoted as an
> exact X-mirrored reuse of that same pair, with only its source-side boundary ticks suppressed so the
> adjoining south cell owns one service seam. It adds no SVG or frame identity. East and northeast are also
> owner-accepted whole-cell mirror contracts, while remaining unregistered. The former
> low-south/east and full-to-low artifacts remain historical comparisons and may only inform a separately
> approved partition family. This decision still changes no production template, topology, exporter, schema,
> or Unity contract.
> **Latest footprint decision, 2026-07-27:** the complete accepted 47-mask proof source bank now owns one
> 112-unit ordinary-wall footprint. Direct/high profiles span `11.5..123.5`; whole-cell mirrored/low profiles
> span `4.5..116.5`. The strict 128-unit frame, centered pivot, fixed renderer scale, palette, topology, and
> 28-direct / 19-derived ledger remain unchanged. This promotes source geometry only; normal production
> export, atlas, schema, blob mapping, Unity registration/PPU/tile size, props, and agent scale remain outside
> this slice.
> **Current mapping and source-gate result, 2026-07-24:** the owner accepted the proof-layer 47-mask
> ledger structure plus the horizontal and vertical termini, isolated-shell, filled-elbow, 2×N thick-wall-repeat,
> N×2 horizontal thick-wall-repeat, vertical open-pocket T-junction, horizontal-spine open-pocket T-junction,
> both west- and east-side single-filled-pocket T-junction slices, the horizontal partial T-junction family,
> the open-pocket cross-junction `mask_15`, the northeast-filled cross-junction `mask_19`, and the
> southeast-filled cross-junction `mask_23`, the east-filled slab cross-junction `mask_25`, and its accepted
> west-filled whole-cell X-mirror companion `mask_43`, plus the accepted southwest-filled whole-cell X-mirror
> companion `mask_29` to `mask_23`, plus the separately authored east-register northwest-filled
> cross-junction `mask_37`, west-register north-filled slab cross-junction `mask_39`, and separately authored
> opposed-diagonal-filled cross-junction `mask_30`, plus its accepted filtered whole-cell X-mirror companion
> `mask_40`, the independently authored south-filled slab cross-junction `mask_32`, and the independently
> authored single-open southwest cross-junction `mask_41`, plus its accepted plain whole-cell X-mirror
> single-open southeast companion `mask_44`, the independently authored single-open northwest
> cross-junction `mask_33`, and its accepted plain whole-cell X-mirror single-open northeast companion
> `mask_45`, plus the directly authored fully filled center `mask_46`. The ledger
> now records 28 direct source mappings, 19 approved
> derivations, 0 synthetic assemblies,
> and 0 unresolved rows; all 47 masks have accepted proof-layer provenance. `mask_8`
> directly reuses the socket-polished `full_terminus` pair and `mask_2` uses its accepted whole-cell X mirror;
> both passed at 90/40 px in 1/3/6-cell contexts. This completes the proof-layer vocabulary, not a production
> atlas. `mask_1` and `mask_4` use separately authored vertical rollovers plus accepted east mirror-X
> derivations. `mask_0` directly reuses one external, fixed-view `isolated_shell` pair with zero cardinal sockets;
> mirror and rotation are prohibited. Production registration,
> frame identities, export/`CONTRACT.md`, schema, committed atlases, Unity assets, and `production.unity` remain
> outside this authorization.
> **Accepted vertical terminus slice, 2026-07-21:** the family has two separately authored external source
> pairs plus west/east, 240/90/40 px, 1/3/6-run, socket, and minimum-segment evidence. Acceptance records
> proof-layer provenance only; all production signatures remain unchanged.
> **Accepted isolated-shell slice, 2026-07-22:** one external base/upper pair passed its 240/90/40 px,
> contained-boundary, light/dark-ground, and compact-placement evidence. Acceptance records direct proof-layer
> provenance for `mask_0` only; it does not register or export a production frame.
> **Accepted filled-elbow slice, 2026-07-22:** direct external proof sources for `mask_16`/`mask_20` and
> approved X-mirror derivations for `mask_26`/`mask_34` passed as one continuous 2×2 wall mass at 240/90/40 px,
> on light/dark grounds and beside a clear aisle. Acceptance records proof-layer provenance only; exporter,
> atlas, schema, and Unity surfaces remain unchanged.
> **Accepted thick-wall repeat slice, 2026-07-22:** one external `filled_w_middle` pair directly resolves
> `mask_24`, with `mask_42` accepted as its whole-cell X mirror. The 2×3/2×4/2×6 gate reads as one cream mass
> without a middle belt or buried rail. At that checkpoint the proof-layer ledger stood at
> 8 direct / 9 derived / 30 synthetic / 0 unresolved; later source-family decisions supersede those counts.
> **Accepted horizontal thick-wall repeat slice, 2026-07-22:** the external `filled_n_middle` and
> `filled_s_middle` pairs directly resolve rear `mask_31` and foreground `mask_38`. The 3×2/4×2/6×2 gate reads
> as one continuous two-row wall mass, with the south-facing material stack owned only by the foreground row.
> At that checkpoint the proof-layer ledger stood at 10 direct / 9 derived / 28 synthetic / 0 unresolved;
> later source-family decisions supersede those counts.
> **Accepted open-pocket T-junction slice, 2026-07-22:** the external `open_w_t_junction` pair directly resolves
> open-west `mask_7`; `mask_13` is its accepted whole-cell X mirror after the southeast boundary-seam filter.
> Compact 3×3 and six-cell-arm checks preserve three continuous sockets, two open floor pockets, and one molded
> hub without a cap, post, pasted corner, or doubled seam. Acceptance records proof-layer provenance only: the
> ledger was 11 direct / 10 derived / 26 synthetic / 0 unresolved at that checkpoint. No canonical source, frame identity,
> template registration, exporter, atlas, schema, blob mapping, Unity asset, or `production.unity` surface is
> changed.
> **Accepted horizontal-spine open-pocket T-junction slice, 2026-07-22:** the external `open_s_t_junction`
> and `open_n_t_junction` pairs directly resolve `mask_11` and `mask_14` as two separately authored fixed-light
> axial sources. Compact 3×3 and six-cell horizontal/vertical checks preserve the horizontal spine, vertical
> branch, and both open pockets at 90 and 40 px per cell. X-mirrored branch registrations remain comparison
> evidence only, not accepted derivations. At that checkpoint the ledger stood at
> 13 direct / 10 derived / 24 synthetic / 0 unresolved; the later single-filled-pocket decision supersedes
> those counts.
> No canonical source, frame identity, template registration, exporter, atlas, schema, blob mapping, Unity
> asset, or `production.unity` surface is changed.
> **Accepted west-side single-filled-pocket T-junction slice, 2026-07-22:** the external
> `open_w_t_filled_ne` and `open_w_t_filled_se` pairs directly resolve foreground `mask_17` and rear `mask_21`
> as separately authored fixed-light transitions. Each preserves the north/east/south sockets while filling
> exactly one diagonal crook. At that checkpoint east-side counterparts `mask_36` and `mask_27` remained
> synthetic and no mirror derivation was approved; the ledger stood at 15 direct / 10 derived / 22 synthetic /
> 0 unresolved. The later east-side decision supersedes those totals. No
> canonical source, frame identity, template registration, exporter, atlas, schema, blob mapping, Unity asset,
> or `production.unity` surface is changed.
> **Accepted east-side single-filled-pocket T-junction slice, 2026-07-22:** `mask_36` reuses the accepted
> foreground `mask_17` source through whole-cell mirror-X after the established omission of
> `base-boundary-seam` and `upper-boundary-seam`; `mask_27` is the plain whole-cell mirror-X of the accepted
> rear `mask_21` source. Compact and long light/dark checks preserve the fixed-light roles, one open floor
> crook, and singular shared-socket seam ownership. At that checkpoint the ledger recorded 15 direct / 12 derived /
> 20 synthetic / 0 unresolved. No east SVG source bank, canonical source, frame identity, template
> registration, exporter, atlas, schema, blob mapping, Unity asset, or `production.unity` surface is added or
> changed.
> **Accepted horizontal partial T-junction slice (owner approval, 2026-07-22):** the external
> `horizontal-partial-t-junction/` proof bank supplies direct fixed-light sources `open_s_t_filled_ne` for
> `mask_18` and `open_n_t_filled_se` for `mask_22`. `mask_35` is the whole-cell X mirror of
> `mask_18` after omitting `base-boundary-seam` and `upper-boundary-seam`; `mask_28` is the plain
> whole-cell X mirror of `mask_22`. The occupancy diamonds are
> `mask_11 -> {mask_18, mask_35} -> mask_38` and `mask_14 -> {mask_22, mask_28} -> mask_31`: each accepted middle state
> fills exactly one crook between an accepted open horizontal-spine junction and an accepted fully filled
> horizontal repeat. At that checkpoint the accepted ledger stood at 17 direct / 14 derived / 16 synthetic /
> 0 collisions, and all 16 remaining synthetic rows were cross-junctions. South-facing shadow continuity remains deferred
> family-wide polish across the accepted direct and derived sources; this acceptance does not claim it is fixed.
> No canonical source, frame identity, template registration, exporter, atlas, schema, blob mapping, Unity
> asset, or `production.unity` surface is added or changed by this proof-layer promotion.
> **Accepted open-pocket cross-junction slice (owner approval, 2026-07-22):** the external
> `open-pocket-cross-junction/` proof bank supplies one direct fixed-light `open_cross_junction` source pair
> for `mask_15`. Its four cardinal sockets continue ordinary one-cell runs while all four diagonal crooks stay
> open floor. The authored union replaces the rejected stacked-T overlay, keeps the horizontal cream coping
> dominant through the hub, and passes 240/90/40 px source checks plus one-, three-, and six-cell installed
> crossings on light and dark floors. The ledger now records 18 direct / 14 derived / 15 synthetic /
> 0 collisions; all 15 remaining synthetic rows are cross-junctions. Acceptance records proof-layer source
> provenance only. It adds no canonical production source, frame identity, template registration, exporter,
> atlas, schema, blob mapping, Unity asset, or `production.unity` change.
> **Accepted single-filled cross-junction slice (owner approval, 2026-07-23):** the external
> `single-filled-cross-junction/` proof bank supplies one direct fixed-light `open_cross_filled_ne` source pair
> for `mask_19`. Its four cardinal sockets continue ordinary one-cell runs, the northeast diagonal becomes
> continuous wall mass, and the southeast, southwest, and northwest crooks remain open floor. The authored
> union preserves the fixed west socket register and replaces any stacked-T, patch, peak, or post construction.
> It passes 240/90/40 px source checks plus compact, three-cell-arm, and six-cell-arm installed crossings on
> light and dark floors. The accepted ledger now records 19 direct / 14 derived / 14 synthetic / 0 collisions;
> all 14 remaining synthetic rows are cross-junctions. Acceptance records proof-layer source provenance only.
> It adds no canonical production source, frame identity, template registration, exporter, atlas, schema, blob
> mapping, Unity asset, or `production.unity` change.
> **Accepted southeast-filled cross-junction slice (owner approval, 2026-07-23):** the external
> `single-filled-southeast-cross-junction/` proof bank supplies one direct fixed-light
> `open_cross_filled_se` source pair for `mask_23`. Its four cardinal sockets continue ordinary one-cell runs,
> the southeast diagonal becomes continuous wall mass, and the northeast, southwest, and northwest crooks
> remain open floor. The authored union preserves the fixed west socket register and applies the accepted
> rear-facing `mask_21`/`mask_22` boundary laws without stacking either T source. It passes 240/90/40 px
> source checks plus compact, three-cell-arm, and six-cell-arm installed crossings on light and dark floors.
> An owner-approved consistency polish on 2026-07-25 phases the northeast cream plane, light arris,
> dimensional shade, coral, green, and both seams through the accepted nested `mask_11` turn while preserving
> every outer contour and socket pixel. The existing plain whole-cell X derivation carries the same correction
> into `mask_29` without a filter or companion source.
> The accepted ledger now records 20 direct / 14 derived / 13 synthetic / 0 collisions; all 13 remaining
> synthetic rows are cross-junctions. Acceptance records proof-layer source provenance only. It adds no
> canonical production source, frame identity, template registration, exporter, atlas, schema, blob mapping,
> Unity asset, or `production.unity` change.
> **Accepted east-filled slab cross-junction slice (owner approval, 2026-07-23):** the external
> `double-filled-east-cross-junction/` proof bank supplies one direct fixed-light `open_cross_filled_e`
> source pair for `mask_25`. Its four cardinal sockets continue ordinary one-cell runs, the northeast and
> southeast diagonals become one continuous two-cell-wide east slab, and the southwest and northwest crooks
> remain open floor. The west branch enters the slab as one authored union rather than stacked T-junctions.
> A final source polish assigns the narrow southwest coping transition to the upper source only through
> `y=95..97`, while the base owns the south-facing shade from `y=97` onward; the compact 40 px proof therefore
> retains one clean material boundary. It passes 240/90/40 px source checks plus compact, three-cell-arm, and
> six-cell-arm installed crossings on light and dark floors. The accepted ledger now records
> 21 direct / 14 derived / 12 synthetic / 0 collisions; all 12 remaining synthetic rows are cross-junctions.
> `mask_43` remains a separate synthetic topology row. Acceptance records proof-layer source provenance only.
> It adds no canonical production source, frame identity, template registration, exporter, atlas, schema,
> blob mapping, Unity asset, or `production.unity` change.
> **Accepted west-filled slab cross-junction slice (owner approval, 2026-07-23):** `mask_43` reuses the
> accepted `open_cross_filled_e` pair from `mask_25` through one plain whole-cell X mirror. Its four cardinal
> sockets continue ordinary one-cell runs, the southwest and northwest diagonals become one continuous
> two-cell-wide west slab, and the northeast and southeast crooks remain open floor. No seam filter or new SVG
> bank is involved. It passes 240/90/40 px source checks plus compact, three-cell-arm, and six-cell-arm
> installed crossings on light and dark floors. The accepted ledger now records
> 21 direct / 15 derived / 11 synthetic / 0 collisions; all 11 remaining synthetic rows are cross-junctions.
> Acceptance records one proof-layer derivation only. It adds no canonical production source, frame identity,
> template registration, exporter, atlas, schema, blob mapping, Unity asset, or `production.unity` change.
> **Accepted southwest-filled cross-junction slice (owner approval, 2026-07-23):** `mask_29` reuses the
> accepted external `open_cross_filled_se` pair from `mask_23` through one plain whole-cell X mirror. Its four
> cardinal sockets continue ordinary one-cell runs, the southwest diagonal becomes continuous wall mass, and
> the northeast, southeast, and northwest crooks remain open floor. The derivation preserves the source's
> Y-based fixed-light ownership and uses no seam filter, companion SVG, or new SVG bank. It passes
> 240/90/40 px source checks plus compact, three-cell-arm, and six-cell-arm installed crossings on light and
> dark floors. The accepted ledger now records 21 direct / 16 derived / 10 synthetic / 0 collisions; all 10
> remaining synthetic rows are cross-junctions. Acceptance records one proof-layer derivation only. It adds no
> canonical production source, frame identity, template registration, exporter, atlas, schema, blob mapping,
> Unity asset, or `production.unity` change.
> **Accepted northwest-filled cross-junction slice (owner approval, 2026-07-23):** `mask_37` directly reuses
> the external `open_cross_filled_nw` pair as one separately authored east-register four-way union. Its four
> cardinal sockets continue ordinary one-cell runs, the northwest diagonal becomes continuous wall mass, and
> the northeast, southeast, and southwest crooks remain open floor. It is not a mirror or rotation of
> `mask_19`; no seam filter or derived companion is involved. It passes 240/90/40 px source checks plus
> compact, three-cell-arm, and six-cell-arm installed crossings on light and dark floors. The accepted ledger
> now records 22 direct / 16 derived / 9 synthetic / 0 collisions; all 9 remaining synthetic rows are
> cross-junctions. Acceptance records one direct proof-layer source only. It adds no canonical production
> source, frame identity, template registration, exporter, atlas, schema, blob mapping, Unity asset, or
> `production.unity` change.
> **Accepted north-filled slab cross-junction slice (owner approval, 2026-07-23):** `mask_39` directly reuses
> the external `open_cross_filled_n` pair as one separately authored west-register four-way union. Its four
> cardinal sockets continue ordinary one-cell runs, northeast and northwest form one continuous two-row cream
> slab, and southeast and southwest remain open floor. The cream top continues through the south socket while
> frontage shade and belts yield at the top-to-top join. `mask_19` and `mask_37` remain geometry controls only;
> the accepted source is neither stacked nor derived from them. It passes 240/90/40 px source checks plus
> compact, three-cell, and six-cell installed extents on light and dark floors. The accepted ledger now records
> 23 direct / 16 derived / 8 synthetic / 0 collisions; all 8 remaining synthetic rows are cross-junctions.
> Acceptance records one direct proof-layer source only. It adds no canonical production source, frame
> identity, template registration, exporter, atlas, schema, blob mapping, Unity asset, or `production.unity`
> change.
> **Accepted opposed-diagonal-filled cross-junction slice (owner approval, 2026-07-23):** `mask_30`
> directly reuses the external `open_cross_filled_ne_sw` pair as one separately authored fixed-light
> four-way union. Its four cardinal sockets continue ordinary one-cell runs; northeast and southwest are
> continuous solid wall while northwest and southeast remain open floor. The source keeps the west-authored
> register above the hub and hands the south outlet to the accepted east register below it, with no runtime
> transform, stacked source, or duplicate cream owner. It passes 240/90/40 px source checks plus compact,
> three-cell-arm, and six-cell-arm crossings on light and dark floors. The accepted ledger now records
> 24 direct / 16 derived / 7 synthetic / 0 collisions; all 7 remaining synthetic rows are cross-junctions.
> Acceptance records one direct proof-layer source only. It adds no canonical production source, frame
> identity, template registration, exporter, atlas, schema, blob mapping, Unity asset, or `production.unity`
> change. The X-mirrored `mask_40` topology remains a separate review decision with no implied derivation or
> promotion.
> **Accepted opposite-diagonal-filled cross-junction derivation (owner approval, 2026-07-23):** `mask_40`
> reuses the accepted `mask_30` source pair through one whole-cell X mirror after omitting only
> `base-boundary-seam` and `upper-boundary-seam`. Northwest and southeast are solid, northeast and southwest
> remain open floor, the north outlet uses the east register, and the south outlet uses the west register.
> The accepted ledger now records 24 direct / 17 derived / 6 synthetic / 0 collisions; all six remaining
> synthetic rows are cross-junctions. Acceptance adds no SVG, canonical production source, frame identity,
> template registration, exporter, atlas, schema, blob mapping, Unity asset, or `production.unity` change.
> **Accepted south-filled slab cross-junction slice (owner approval, 2026-07-23):** `mask_32` directly reuses
> the external `open_cross_filled_s` pair as one independently authored fixed-view four-way union. Southeast
> and southwest form one continuous cream south slab, northeast and northwest remain open floor, and the
> centered north spur keeps one exposed vertical register. `mask_39` is a geometry/fixed-light control only,
> never Y-mirrored provenance. The accepted ledger now records 25 direct / 17 derived / 5 synthetic /
> 0 collisions; all five remaining synthetic rows are cross-junctions. Acceptance records one direct
> proof-layer source only and adds no canonical source, frame identity, template registration, exporter,
> atlas, schema, blob mapping, Unity asset, or `production.unity` change.
> **Accepted single-open southwest cross-junction slice (owner approval, 2026-07-24):** `mask_41` directly
> reuses the external `open_cross_filled_ne_se_nw` pair as one independently authored fixed-view four-way
> union. Northeast, southeast, and northwest are one continuous solid mass; southwest remains genuine floor;
> and all four cardinal sockets stay exact. `mask_25` and `mask_39` constrain topology while `mask_40`
> constrains only the exposed southwest material return; none supplies stacked source provenance. The accepted
> ledger now records 26 direct / 17 derived / 4 synthetic / 0 collisions; all four remaining synthetic rows
> are cross-junctions. Acceptance records one direct proof-layer source only and adds no canonical source,
> frame identity, template registration, exporter, atlas, schema, blob mapping, Unity asset, or
> `production.unity` change.
> **Accepted single-open southeast cross-junction slice (owner approval, 2026-07-24):** `mask_44` reuses the
> accepted `open_cross_filled_ne_se_nw` pair from `mask_41` through one plain whole-cell X mirror around
> `x=64`. Northwest, northeast, and southwest remain one continuous solid mass; southeast remains genuine
> floor; and all four cardinal sockets stay exact. The whole pair is mirrored without a seam filter, companion
> SVG, stacked ingredient, or new cream owner, preserving the accepted Y-based light and shadow hierarchy.
> The accepted ledger now records 26 direct / 18 derived / 3 synthetic / 0 collisions; all three remaining
> synthetic rows are cross-junctions. Acceptance records one approved proof-layer derivation only and adds no
> canonical production source, frame identity, template registration, exporter, atlas, schema, blob mapping,
> Unity asset, or `production.unity` change.
> **Accepted single-open northwest cross-junction slice (owner approval, 2026-07-24):** `mask_33` directly
> reuses the external `open_cross_filled_ne_se_sw` pair as one independently authored fixed-view four-way
> union. Northeast, southeast, and southwest remain one continuous solid mass; northwest remains genuine
> floor; and all four cardinal sockets stay exact. `mask_25` and `mask_32` constrain the buried east and south
> slabs while `mask_30` constrains only the exposed northwest reveal and arris; none supplies stacked or
> transformed provenance. One cream owner spans all three filled crooks, with no local coral or green repaint
> because adjoining foreground pieces own that frontage. The accepted ledger now records 27 direct / 18
> derived / 2 synthetic / 0 collisions; the two remaining synthetic rows are cross-junctions. Acceptance
> records one direct proof-layer source only and adds no canonical production source, frame identity, template
> registration, exporter, atlas, schema, blob mapping, Unity asset, or `production.unity` change.
> **Accepted single-open northeast cross-junction slice (owner approval, 2026-07-24):** `mask_45` reuses
> the accepted external `open_cross_filled_ne_se_sw` pair from `mask_33` through one plain whole-cell X
> mirror around `x=64`. Southeast, southwest, and northwest remain one continuous solid mass; northeast
> remains genuine floor; and all four cardinal sockets stay exact. The whole pair is mirrored without a seam
> filter, companion SVG, stacked ingredient, or second cream owner, preserving the accepted Y-based light,
> reveal, arris, and contact-shadow hierarchy. The accepted ledger now records 27 direct / 19 derived /
> 1 synthetic / 0 collisions; only `mask_46` remains synthetic. Acceptance records one approved proof-layer
> derivation only and adds no canonical production source, frame identity, template registration, exporter,
> atlas, schema, blob mapping, Unity asset, or `production.unity` change.
> **Accepted fully filled cross-junction slice (owner approval, 2026-07-24):** `mask_46` directly reuses the
> external `fully-filled-cross-junction/filled_center` base/upper pair as the fully buried center of a solid
> wall mass. North, east, south, and west remain connected, while northeast, southeast, southwest, and
> northwest are all solid; no floor crook or exposed wall face remains. The source owns one full-cell
> charcoal underlay and one uninterrupted cream top field. Accepted perimeter cells retain every visible
> outline, highlight, coral/green frontage, south-facing shade, plinth, return, and service seam. It passes
> at 240/90/40 px inside solid 3×3, 4×4, and 6×6 masses on light and dark floors. The accepted ledger now
> records 28 direct / 19 derived / 0 synthetic / 0 unresolved, so all 47 masks have accepted proof-layer
> provenance. Acceptance records one direct proof-layer source only and adds no canonical production source,
> frame identity, template registration, exporter, atlas, schema, blob mapping, Unity asset, or
> `production.unity` change.

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
   for all six production bodies, all six human-head families, all ten hair
   families, the south/east Tee kit, and six separately seeded south/east
   Blazer components under `assets/part-authoring` via
   `npm run parts:scaffolds`; semantic IDs, not editor-only layer state, define
   what the importer ignores. Body starters show all 11 TypeScript-owned rig
   points as non-importing guides.
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
5. **Production body source canonicalization**: the approved
   `body-compact`, `body-balanced`, `body-large-frame`, `body-tall`, and
   `body-soft` IDs now carry the accepted Block, Barrel, Wedge, Column, and Bell
   silhouettes; the new `body-pinch` ID carries Pinch. These six bodies have 18
   canonical south/east/north SVG sources under `assets/parts/body`. A dedicated
   `body-art` adapter installs their
   complete visible shapes onto the existing shared production `PartDef`
   objects in place, preserving stable selection order, exact body-rig identity,
   z-order, and all runtime metadata. Canvas geometry is strictly validated,
   while established body-local path strings remain byte-stable. The generated
   scaffolds expose the full typed rig as ignored context; importing the rig
   itself remains a later adapter boundary.
6. **Approved human-head production batch**: `head-oval`, `head-boxy`,
   `head-long`, `head-angular`, and `head-soft-square` each have canonical
   south/east/north sources derived through the editor-agnostic scaffold
   workflow. The 15 SVGs are registered, deterministic, and production-approved
   through the static-head overlay as of 2026-07-10. Together with `head-round`,
   they pass the 3,960-cell head/hair/accessory/facing/style matrix and the
   594-cell palette/portrait matrix. `npx tsx scripts/headSilhouettePreview.ts`
   regenerates their previous-versus-production distance and hair/accessory
   compatibility references.
7. **Representative hair-family source batch**: `hair-short`, the approved
   `hair-bob` control, and `hair-long-straight` cover the Short, Medium, and
   Long families. Six new south/east/north Short and Long straight sources own
   their canonical local paths through explicit byte-stable static targets;
   canvas, paint, and semantic validation still run normally. All four Short
   shapes plus Long straight south/north remain exact. The one deliberate art
   delta is Long straight east, whose single rear fall and short temple edge
   make the profile turn explicit while preserving the open face. Generated
   scaffolds and `npx tsx scripts/hairFamilyPreview.ts` provide the visual
   review surface. Short and Long straight received visual approval on
   2026-07-10. Curly, Ponytail, and Coils now add nine more canonical sources:
   Curly preserves its established lobed geometry, Ponytail gains a hanging
   tail in all three facings, and Coils gains a denser cloud silhouette that is
   materially distinct from Curly at 32 px. Their 2,160-cell compatibility
   matrix and expanded distance proof passed visual approval on 2026-07-10.
   Bun, Balding, Pixie, and Side-part add the final 12 mapped sources. Bun is a
   compact, clip-free knot distinct from Ponytail; Balding uses tapered temple
   and rear bands; Pixie owns a cropped irregular fringe; Side-part owns a
   swept cap and non-silhouette parting crease. The expanded ten-style
   4,320-cell hair/body/head/facing/style matrix, full head-accessory matrices,
   and distance proof pass. These final four received visual approval on
   2026-07-10.
8. **Anchored outfit-detail adapter**: `outfit-tee` is the first body-aware
   intake target. Its south/east SVGs are authored once over `body-balanced`,
   with the body origin at `(64, 87)` and neck at `(64, 58)`. Every visible
   path must compile as `detail/*` / `silhouette: false`, so the selected body's
   `$outfitPrimary` silhouette remains the conforming torso. At build time the
   importer translates that kit to each production body's neck and emits the
   six variants in stable archetype order. The runtime overlay replaces only
   known production detail shapes while preserving the code builder's z-order;
   legacy bodies, future body IDs, and unauthored north keep the original
   procedural/static fallback. The adapter and art received approval on
   2026-07-27; the broader M1 exit remains open. Its focused six-body,
   four-facing, 40/48 px review sheet is
   `character-tee-anchored-fit-v1.png`.
9. **Componentized outfit-detail adapter**: `outfit-blazer` is authored as six
   independent files—south/east lapels, buttons, and pocket—rather than one
   flattened jacket overlay. An explicit manifest locks component order,
   per-facing shape counts, and the body frame each piece consumes. Lapels fit
   through the neck/shoulder/chest frame; buttons and pocket fit through
   chest/waist/hip. All fitted paths remain detail-only, are revalidated after
   placement on all six production bodies, and install through the existing
   `body-detail` runtime overlay with no recipe/export metadata. North and
   unknown bodies preserve the code builder fallback. The resulting 40/48 px
   multi-body proof received visual approval on 2026-07-27.
10. **First component-contract reuse**: `outfit-polo` keeps collar and placket
   in four independent south/east files. Both components fit through the
   upper-torso frame and install through the same ordinary `body-detail`
   overlay as Blazer. North and unknown bodies retain the code-builder
   fallback; the focused six-body, four-facing, 40/48 px proof is
   `character-polo-component-fit-v1.png` and received visual approval on
   2026-07-27.
11. **Second component-contract reuse**: `outfit-shirt-tie` keeps collar and
   tie in four independent south/east files. Both consume the upper-torso frame
   and install through the ordinary `body-detail` overlay. North and unknown
   bodies retain the code-builder fallback; the focused six-body,
   four-facing, 40/48 px proof is
   `character-shirt-tie-component-fit-v1.png` and received visual approval on
   2026-07-27 after the profile tie moved to the forward torso edge.
12. **Three-facing component intake**: `outfit-turtleneck` keeps one
   `neck-band` component in three independent south/east/north files. It fits
   through the upper-torso frame and installs through the ordinary
   `body-detail` overlay, rising behind the head to fill the 3 px head/torso
   gap rather than sitting as a mark on the chest. The band uses the shirt's
   primary fabric color, and the east profile is widened to preserve comparable
   collar weight against south/north. West mirrors east; legacy and unknown
   bodies retain the code-builder fallback. The focused six-body, four-facing,
   40/48 px proof is
   `character-turtleneck-component-fit-v1.png` and received visual approval on
   2026-07-27.
13. **Provenance**: each imported asset records source
   (`authored | generated | curated`) in its generated module, so lints and
   future audits know what's re-generatable. `authored` means deliberate
   canonical repo SVG regardless of authoring tool; `generated` means
   generator-owned and reproducible; `curated` means selected and frozen
   generator output.

The approved body and six-head sets plus all ten approved mapped hair source
sets now form the canonical silhouette foundation. The remaining outfit
manifests and the separate runtime-scale integration can follow the
componentized Blazer/Polo/Shirt + Tie/Turtleneck slices. The phase numbers
describe pipeline scope; they do not override visual-impact priority.

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

Mechanical pilot implemented 2026-07-10: the exact twelve canonical fixed-light
SVGs live under `assets/walls/bevel`, compile through
`scripts/importWallBevel.ts`, and assemble from the existing 47-blob topology.
The approved `office-wall` integration replaces its painted-on rim with a near-
black silhouette boundary and an inset palette-material body on exposed sides.
The follow-on promotion applies that shared contour and fixed-light face kit to
all eight opaque wall templates. Their brick, panel, foliage, brand, slat, and
structural details remain procedural, constrained to the material surface and
painted below the authored faces. Connected-side overhang, cell coverage, blob
topology, and export metadata remain unchanged. Glass and Curtain stay byte-
identical on their procedural no-bevel paths.

`npm run walls:preview` produces the focused previous-versus-authored Office
source/47-tile/room/palette/distance proof. `npm run walls:materials:preview`
serially produces the shipped-palette 47-tile and complex-room proofs for all
eight opaque materials plus `docs/previews/wall-preview-opaque-walls.html`.
Promotion requires exactly seven additional wall snapshot updates; no export
contract or schema change is involved.

Fallback if the authored bevel doesn't beat procedural after ~2 days of
drawing: extract `BEVEL` into a declarative spec + live tweak panel — fixes
the tweak pain without art.

### Phase 4 — Character parts, incrementally (ongoing)

1. **LOD flag first**: detail tier on `ShapeSpec`; compositor drops interior
   detail below a threshold export size. Benefits procedural parts too.
2. Re-author by silhouette priority — the approved six-body and six-head
   foundations are canonical SVG; Short, Bob, Long straight, Curly, Ponytail,
   and Coils are approved; Bun, Balding, Pixie, and Side-part completed the
   approved mapped set on 2026-07-10. Outfits (§4b) follow, judged against the
   zoom strip.
   Detail-only garment and wall passes wait behind the hair silhouettes.
   Accessories are last (already glyph-like).
   Moods/badges/poses stay procedural.
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
source of truth: sim `docs/design/terrarium-office-builder-assets.md`, amended by
sim `docs/design/iris-installation-unit-and-tutorial.md` for the locked IRIS
hardware/crew direction. Status as of 2026-07-11:

**Done (code landed):** grid footprints `{w,h}` + sub-cell pivots on
`PropTemplate`; `facility-catalog.json` export; build-site assets (outdoor
ground kinds + clinical exemption, cars/parking decals, IRIS fabrication-unit
construction crew + charging dock, nature decals, grass-fringe overlays on the
47-blob contract); IRIS installation-unit live/dormant facility sprites;
warm-by-default look with sim-owned runtime drain.

The installation unit, charging dock, and fabrication crew are mechanically
present under stable ids and received a shared sterile-chassis refinement pass
on 2026-07-10. Their current art is serviceable rather than frozen final art;
later silhouette/detail polish is an asset pass, not contract or schema work.
The locked 2026-07-08 IRIS apparatus command chain supersedes the earlier B1.5
human construction-worker art proposal: IRIS's construction crew are robots.

**Wild-field flora art slice (2026-07-11):** the outdoor vocabulary now has
twelve curated flora silhouettes rather than asking palette/seed changes to do
all of the recognition work:

- Mature trees (elevation/front-facing): `prop-tree`, `prop-tree-b`,
  `prop-tree-upright`, `prop-tree-conifer`.
- Saplings/understory (elevation/front-facing): `prop-tree-sapling`,
  `prop-tree-sapling-b`.
- Shrubs (plan-projected): `prop-bush-cluster`, `prop-bush-bramble`,
  `prop-bush-low`.
- Herbaceous patches (plan-projected): `prop-wildflower-patch`,
  `prop-tall-grass-clump`, `prop-bracken-patch`.
- Field surfaces: `ground-grass`, `ground-grass-b`, `ground-grass-c` and
  `ground-meadow`, `ground-meadow-b`. The existing `ground-dirt`, paved
  surfaces, and `prop-boulder` remain in the exterior kit.

The art split follows the wall lesson: deliberately author the silhouette
profiles, but leave small lobe/blade scatter, palette changes, and seed-derived
micro-variation procedural. Multiple stable ids may use one generator template
because Unity consumes baked sprites, not Terrarium's live parameter range;
curated exported instances are therefore the runtime variety contract.
Trees and saplings must read as tall front-facing actors in the scene — visible
trunk, crown above the ground pivot, and elevation sorting — while low shrubs,
flowers, grass, and bracken remain overhead patches that hug the field plane.

The two exterior grammars stay intentionally distinct:

- **Wild:** asymmetrical crowns, broken contours, irregular negative space,
  uneven clusters, and soft field transitions.
- **Landscaped (future):** clipped masses, deliberate geometry, repeated
  rhythm, and visible bed/edge shapes. A later garden starter kit can add the
  ornamental flowering tree, clipped/flowering shrubs, ornamental grass,
  groundcover, flower beds, connected hedge, mulch, and edging without
  weakening the wild-field read.

This slice is mechanically additive: it introduces no payload-shape change,
migration, or schema bump. Unity scatter/import-catalog adoption remains a
separate sync after visual approval; non-placeable nature props do not enter
Terrarium's `facility-catalog.json`.

**Open:**
- Surveillance apparatus props (cameras, sensors — QuotaCo "tech you place");
  new templates, B4/B5 timing.
- Landscaped garden starter kit and its bed/hedge vocabulary; keep it visually
  separate from the wild-field family above.
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
