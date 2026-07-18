# Campus Bundle 1 — Parking Lot Art Ask (CE-21 · Attendance Surface)

**Date:** 2026-07-18 · **Requested by:** sim (The Water Cooler) · **Status:** open

Context: the game's narrative frame is now a **corporate campus** (owner-locked 2026-07-18).
Campus builds arrive in three Terrarium bundles: **parking → cafeteria → quad**. This is
Bundle 1, supporting catalog kit CE-21 "Attendance Surface" — a parking lot provisioned at
one stall per authorized occupant, which the player expands (paving the wild field) as
headcount grants land.

Ratified constraints (owner, 2026-07-18): no Terrarium re-architecture — the single-building
export schema stays (the sim owns the campus site graph); no animation-frame pipeline (static
sprites; sim translates cars for arrivals). Everything below is additive templates, one new
overlay builder, and taxonomy classification.

Already in the catalog and reused as-is (no work): `car` + `car-suv` (4×2, `$primary`
body), `parking-line` (2×2 bay decal with stop-bar param — covers wheel stops, no separate
prop needed), `asphalt` + `sidewalk` ground (`PAVED_GROUND_TEMPLATE_IDS`).

---

## A. Ground-overlay builder (the one piece of system work)

**`curb-edge`** — poured-concrete curb where **paved ground (asphalt or sidewalk) borders
natural ground (grass/meadow/dirt)**. Same 47-blob autotile contract as `buildGrassFringe`
(`src/tiles/groundOverlays.ts`), derived from the paved instances, registered in
`GROUND_OVERLAY_BUILDERS`.

- Visual: a light concrete lip on the paved side with a thin gutter shadow line — clean and
  certified, not weathered. Restrained; it should read at campus zoom as "a poured edge."
- **Precedence rule (required):** where `curb-edge` renders, suppress `grass-fringe` on the
  same seam. Fresh QuotaCo asphalt does not have grass creeping over it — the curb wins.
- One builder covers both paved kinds for v1. Only split a softer `sidewalk-edge` variant
  later if the shared visual reads wrong against sidewalk.

## B. Lot markings — flat decal set, templateIds `lot-marking-*`

Plan projection, mostly-transparent painted-on-asphalt decals (same spirit as
`ground-detail-*`: terrain, not objects). `silhouette: false` throughout — these are flat
and must cast no sun shadow. Palette: one worn pale off-white; no second color.

| templateId | footprint | count | notes |
|---|---|---|---|
| `lot-marking-accessible` | 2×2 | ×1 | accessible-stall symbol centered in a bay; pairs over `parking-line` |
| `lot-marking-arrow` | 2×1 | ×1 | single directional lane arrow |
| `lot-marking-reserved` | 2×1 | ×1 | "RESERVED" stencil glyph — abstract/stencil-weight, not readable prose; flavor hook: the branch manager's stall exists before the manager's office does |
| `lot-marking-crosswalk` | 2×2 | ×1 | ladder stripes, tileable side-by-side to span lanes |

## C. Props

| templateId | projection | footprint | count | notes |
|---|---|---|---|---|
| `lamp-post` | elevation | 1×1 | ×1 | tall pole + fixture head that reads as a light source; the sim anchors a night practical by templateId (no export change needed, same mechanism as monitor glows); casts a normal sun shadow — do NOT flat-exempt |
| `sign-lot` | elevation | 1×1 | ×2 | small lot signage on a pole: (a) "P" glyph panel, (b) compliance placard (dense fine-print texture, illegible by design — QuotaCo print at 128 units) |
| `car-compact` | plan | 3×2 | ×1 | hatchback silhouette to break sedan/SUV repetition in a full lot; same `$primary` body convention as `car` |
| `bike-rack` | plan | 2×1 | ×1 · optional | flavor; skip if the bundle needs trimming |

**Car re-tint check (small but load-bearing):** confirm the `$primary` body panel of
`car`/`car-suv`/`car-compact` survives export such that the sim can vary body color per
instance (re-tint layer in the prop bundle, or a neutral base safe for `renderer.color`
tinting). A lot of identical sedans is the failure mode; per-instance color is the fix.

## D. Classification (the taxonomy pass)

- **Clinical drain:** everything in this bundle is paved-family — it **drains** with the
  building. Only the wild field it displaces stays exempt.
- **Placeability:** `lamp-post`, `sign-lot`, `bike-rack`, and all `lot-marking-*` are
  **placeable** (CE-21 kit content / player-buildable). Cars (`car`, `car-suv`,
  `car-compact`) stay in `NON_PLACEABLE_TEMPLATES` — the sim spawns them per authorized
  headcount; the player never places a car.
- **Flat-shadow set:** add `lot-marking-*` to the sim's flat-template exemption
  (`SunShadowDirector.flatTemplateIds`) code default. Known gotcha: that list is also
  serialized on the owner's scene component — the inspector list needs a manual edit, a
  code-default change alone won't propagate.
- Export as normal prop bundles (`propAtlas` + `prop.json`); facility-catalog entries come
  along automatically.

## E. Sim-side integration notes (informational — not Terrarium work)

- Assembler treats `lot-marking-*` like `ground-detail-*`: ground-overlay sort band,
  transparent to placement/erase/move.
- Curb precedence lands in `deriveGroundOverlays`; sim import consumes the overlay bundle
  as it already does for `grass-fringe`.
- Car arrivals/departures are sim-side translation of the static sprite (walk-pose-lerp
  pattern); stall assignment and the stall-per-authorized-occupant economy are entirely
  sim-side.

## Out of scope for this bundle

Water/pond ground family, gravel, zen-garden set, outdoor furniture (Bundle 3); cafeteria
service line and staff uniform parts (Bundle 2); any animation frames (deferred by
ratified decision).

**Totals: 1 overlay builder · 4 flat decals · 4–5 props · 1 re-tint verification · taxonomy pass.**
