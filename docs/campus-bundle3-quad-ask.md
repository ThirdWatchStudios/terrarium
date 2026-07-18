# Campus Bundle 3 — Quad, Pond & Zen Garden Art Ask (CE-23 · Reflection Garden / CE-24 · Ornamental Water Asset)

**Date:** 2026-07-18 · **Requested by:** sim (The Water Cooler) · **Status:** open ·
**Series:** campus bundle 3 of 3 (see `campus-bundle1-parking-ask.md`, `campus-bundle2-cafeteria-ask.md`)

Context: the game's narrative frame is a **corporate campus** (owner-locked 2026-07-18).
This bundle supports two catalog kits: CE-23 "Reflection Garden" (a zen garden — rest
permitted in bounded, timed, visible doses) and CE-24 "Ornamental Water Asset" (a pond
validated *from the approach road*; "use is not a validated function of this asset" — but
occupants use it anyway, and that sincerity is the floor truth).

Ratified constraints (owner, 2026-07-18):
- **Water is a GROUND family, not a prop** — pond shapes come from the grid + autotile
  shore overlays, exactly how `grass-fringe` works. No giant multi-cell water prop (this
  also keeps re-tint atlases far from the 8192px ceiling).
- **No animation frames** — still water, baked static highlights. Constancy is the brand,
  and the catalog validated this pond at 30 meters.

Already in the catalog and reused as-is (no work): `boulder`, `tree-canopy`,
`tree-sapling`, `bush-cluster`, `wildflower-patch`, `tall-grass-clump`, `bracken-patch`,
all `ground-detail-*` scatter decals, `sidewalk` (quad paths), `waiting-bench` (interior
style — see `park-bench` below for why an outdoor sibling is asked).

---

## A. System work — water as the third ground family

1. **`pond-water` ground template** (`src/tiles/templates.ts`, alongside the ground
   families at ~:926): deep-teal still water; subtle static ripple highlights baked into
   the tile (2–3 variants within the template's tile variation if the ground system
   supports it, else one calm tile). No motion.
2. **New taxonomy constant** `WATER_TEMPLATE_IDS = ['pond-water']`, unioned into
   `GROUND_TEMPLATE_IDS` (pattern at `src/tiles/templates.ts:1114–1123`).
3. **Clinical-drain classification: exempt** (treat like the natural family in
   `src/core/look.ts`). The pond should stay alive-looking next to a drained building —
   the satire lives in the catalog copy, not in desaturating the water. *(Flagged as a
   call, not a certainty — if the exempt pond reads wrong against drained surroundings in
   practice, flip it and note why.)*
4. **`pond-shore` overlay builder** (`GROUND_OVERLAY_BUILDERS` in
   `src/tiles/groundOverlays.ts`, same 47-blob contract as `buildGrassFringe`): a soft
   earthen bank lip where `pond-water` meets any other ground. Precedence: `pond-shore`
   suppresses `grass-fringe` on the same seam. One soft-bank visual for v1; a hard
   "coping stone" edge for paved-adjacent water is a later variant if the quad design
   wants a formal pond edge.
5. **`gravel` ground template** — the zen-garden surface. Fine light-grey gravel, calm
   texture. **Classified into `PAVED_GROUND_TEMPLATE_IDS`**: it drains with the clinical
   look (this is *certified* stillness, not wild ground) and the existing `grass-fringe`
   already handles its seam against grass — no new overlay builder needed for gravel.

## B. Flat decals

All plan-projection, `silhouette: false`, flat-shadow exempt (join the
`SunShadowDirector.flatTemplateIds` set — code default **plus** the serialized inspector
list on the owner's scene component; known gotcha, a code change alone won't propagate).

| templateId | footprint | count | notes |
|---|---|---|---|
| `ground-detail-rake-arc-a/b/c` | 1×1 | ×3 | raked-gravel arc segments; scattered over `gravel` they read as a raked pattern without any authored global pattern |
| `ground-detail-lilypad-a/b` | 1×1 | ×2 | lily pads for open `pond-water` cells; static |
| `ground-detail-stepping-stone-a/b` | 1×1 | ×2 · optional | informal path stones over grass, for desire-line paths the sidewalk doesn't cover |

## C. Props

| templateId | projection | footprint | count | notes |
|---|---|---|---|---|
| `park-bench` | elevation | 2×1 | ×1 | outdoor slat bench on concrete feet — weathered-warm vs the interior `waiting-bench`; this is the bench that makes the pond sincere |
| `picnic-table` | plan | 3×2 | ×1 | table with attached benches both sides; the quad's unvalidated gathering surface |
| `stone-lantern` | elevation | 1×1 | ×1 | zen-garden lantern; fixture cavity should read as a light source — sim anchors a night practical by templateId (same mechanism as `lamp-post` in Bundle 1, no export change) |
| `boulder-arrangement` | plan | 2×1 | ×1 | grouped stones for zen composition (single `boulder` exists; the arrangement reads as *placed*, not wild) |
| `reeds-cluster` | elevation | 1×1 | ×1 | shoreline accent, joins `NATURE_PROP_TEMPLATE_IDS` (sim-scattered on pond banks, not player-placed) |

**Explicitly no fish.** Per CE-24: "Fish are not included and not warranted." If koi ever
ship, it's a deliberate content beat, not an art-bundle default.

## D. Classification & export

- **Placeable** (kit content / hand-buildable): `gravel` ground, `park-bench`,
  `picnic-table`, `stone-lantern`, `boulder-arrangement`, and `pond-water` ground itself
  (the player digs/places the pond via the build system).
- **Nature (non-placeable, sim-scattered):** `reeds-cluster` — joins the existing nature
  set with its clinical-drain exemption.
- **Clinical drain:** `gravel` and the placed props drain (certified environments);
  `pond-water` and `reeds-cluster` exempt (see §A.3).
- Ground exports ride the existing `ground/` folder band (−20000); overlays ride the
  existing `ground-overlays/` bundle; props export as normal prop bundles. No schema
  changes.

## E. Sim-side integration notes (informational — not Terrarium work)

- Water walkability (unwalkable ground kind), the six-minute stillness interval, the
  over-stay "classified as absence" event, and RECOVERY/PRESTIGE typed-quality wiring are
  all sim-side.
- The sim assembler already special-cases `ground-detail-*` (ground-overlay sort band,
  transparent to placement) — the new decals inherit that by prefix.
- `stone-lantern` night practical keys off templateId like Bundle 1's `lamp-post`.

## Out of scope for this bundle

Any water motion or fountain (animation deferred by ratified decision); fish (see §C);
formal coping-stone shore variant (later, if wanted); garden-space cultivation (catalog
withholds it "pending soil review"); parking (Bundle 1); cafeteria (Bundle 2).

**Totals: 2 ground templates + 1 taxonomy constant + 1 overlay builder · 5–7 flat decals · 5 props · taxonomy pass.**
