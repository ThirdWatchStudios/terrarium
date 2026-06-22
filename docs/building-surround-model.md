# Building-surround model — the "floor in a tower" border

Status: **draft for sign-off.** Owner question answered: the office is **one leased
floor inside a larger office tower** — so the border is *building interior
continuation* (elevator lobby, neighbor suites, service spine), with a curtain-wall
peek to the skyline on exterior-facing edges. Not a parking lot, not a flat backdrop.

This is an **environment-art + layout** feature. It reuses the existing tile/prop
render path end to end; the only new *mechanism* is one additive contract field
(`tenantRect`) plus a generation pass. The companion implementation doc (template
stubs + the v4 contract diff) is deferred until this spec is signed off.

## Problem

When the sim renders an office, everything outside the `cols × rows` grid is the
`#181614` clear color — a literal void (`composeSceneSvg`, [scene.ts:295](../src/core/scene.ts);
Unity `OfficeLayoutSceneBuilder` `backgroundColor`). A black void reads as "the scene
didn't finish loading." We want a **non-playable border** wide enough to sell "this
place continues past the frame" but narrow enough that the player never mistakes it
for space they can use.

## Governing principle

> **The office interior is the stage; the surround is painted scenery.**
> **Scenery renders through the same tile/prop pipeline, but is inert to the sim:
> no rooms, no wings, no anchors, no pathing, no interactions.**

The "floor in a tower" fiction is what makes the boundary *feel* intentional rather
than arbitrary: you only lease this floor, so the elevator lobby and the neighbor's
frosted glass are visibly **not yours**. The player accepts the edge because the
fiction explains it. This keeps the surround decoupled from sim state the same way
[CONTRACT.md](../CONTRACT.md) keeps style decoupled from parts.

## Why the existing pipeline already fits

The renderer loops **every** grid cell and draws floors → walls → props from
`office-layout.json` arrays (`composeSceneSvg`, mirrored by Unity's
`SpriteToolkitSceneAssembler`). Three facts make the border cheap:

1. **A bigger grid renders for free.** Extra ring cells flow through the same
   floor/wall/prop code — no new render subsystem.
2. **Walls autotile by neighbor mask with a 16px `OVERHANG`** ([templates.ts:18](../src/tiles/templates.ts)),
   so runs stay seamless across seams. A *demising wall* is just `officeWall` with a
   heavier `thickness` — the autotiler handles its corners and joins.
3. **Quadrant floor-clipping has an `'out'` sentinel** ([scene.ts:330](../src/core/scene.ts))
   for out-of-bounds neighbors. Today the office's outer wall faces `'out'` (void);
   add a ring beyond it and those quadrants face building floor instead, so the office
   edge stops looking amputated — automatically.

## The tenant / building model

Author the grid slightly **larger** than the playable office and add **one field** to
the layout contract: a `tenantRect {x, y, cols, rows}` naming the playable
sub-region. Everything in the grid is rendered identically; everything **outside**
`tenantRect` is "building" and is inert to the sim.

```
┌─────────────────────────────────────────────┐  ← grid (cols × rows), all rendered
│  building ring: lobby / neighbors / service  │
│   ┌───────────────────────────────────────┐ │
│   │                                        │ │  ← tenantRect: the playable office
│   │   rooms, wings, desks, anchors,        │ │     (today's grid, unchanged)
│   │   spawns — exactly as today            │ │
│   └───────────────────────────────────────┘ │
│  curtain wall + skyline on exterior edge ▓▓▓ │  ← only "true outside" peek
└─────────────────────────────────────────────┘
        ▒▒▒ outermost ring fades to #181614 ▒▒▒
```

Chosen over the alternatives considered:

- **vs. a separate surround render layer** — would rebuild floor/wall/prop drawing
  that already exists. The grid *is* the surround mechanism.
- **vs. a flat backdrop texture** — can't render a recognizable elevator bank or
  neighbor glass; reads as wallpaper, not "we lease floor 14."

**Inertness is *mostly* free — with one verified exception.** The contract guarantees
*every interior cell belongs to a room* (§3.4.1). Building-ring cells carry **no
`roomGrid` entry, no `wing`, no `anchor`** — so every room-/wing-/anchor-keyed sim
system ignores them with no special-casing. **But walkability in the sim is
floor-based, not room-based** (`SpriteToolkitOfficeBinder.cs:3593`:
`isWalkable = hasOpenFloor && !hasWall`) — and the ring *does* carry `lobbyFloor`, so
ring cells are walkable by default. `tenantRect` is therefore load-bearing for exactly
two things that need an explicit bounds answer: **pathfinding** (clamp walkability) and
the **camera** (frame the tenant, not the grown grid). See seams below.

## The kit (~11 assets) — **BUILT**

All authored on the existing 128u tile canvas, palette-token driven (`$primary` /
`$secondary` / `$accent`). The spec's "`$building` / `$sky` token groups" are realized
through the existing per-instance `PropPalette` — every tile/prop carries its own
three-color palette, so the building shell is art-directed independently of tenant
style by seeding dedicated **tile/prop instances** (in `src/data/defaults.ts`) with
cooler, heavier greys. No new token type was needed. `$sky` = the curtain wall
instance's `$accent` slot.

### Tile templates → `src/tiles/templates.ts` (BUILT)

| Template (id) | Based on | Role |
|---|---|---|
| `demising-wall` | `officeWall` | Thicker default + a darker `$secondary` structural core seam; the hard suite/building edge. |
| `curtain-wall` | `glassPartition` | Sky-tinted glazing (`$accent` = `$sky`, flat v1) + bold mullions + frame post. The one exterior peek. |
| `lobby-stone` | new (terrazzo-adjacent) | Large polished stone slabs + grout + diagonal sheen; the shared-corridor / elevator-lobby floor. |

### Prop templates → `src/props/templates.ts` (BUILT, elevation/wall-slot, existing path)

| Prop (id) | Projection | Role |
|---|---|---|
| `elevator-bank` | elevation | 1–3 elevator doors + indicators + call panel; the arrival fiction. Anchors to the reception edge. |
| `exit-sign` | elevation | Stairwell door with a lit red EXIT sign — one-glance "real building." |
| `neighbor-glass` | plan / wall-slot | Frosted storefront w/ mullions + a name placard; `lit` param dims the suite behind. |
| `directory-placard` | plan / wall-slot | Building floor-directory signage; cheap detail. |
| `fire-extinguisher` | plan / wall-slot | Recessed red cabinet; service-spine filler. |

**Service-spine fillers reuse existing props** — `water-fountain` and `office-plant`
already exist, so the kit adds 5 new props (not 7). Props ride the existing `props[]` +
projection path with **zero new render code**. They are decor-only (see seams below —
they must not become interaction anchors).

## Generation rules (the ring pass)

**Do not hand-place the surround per map.** It is a procedural pass that runs *after*
the office footprint is generated, keyed off the tenant bounding box — so it plugs
into **Epic 0 company generation** and every generated office gets a believable
tower-floor border for free.

1. **Grow the grid** by a **2-cell ring** on all sides. `tenantRect` = the pre-grow
   `(0, 0, cols, rows)`; new grid is `(cols + 4, rows + 4)` with the office offset by
   `(2, 2)`.
2. **Classify each edge** of the tenant rect:
   - **Entrance edge** = the edge nearest the `reception` room → **elevator bank** +
     `lobbyFloor` + directory placard. Arrival fiction stays coherent (you come up the
     elevators into reception).
   - **Exterior edge** = the longest edge *not* the entrance edge → **curtain wall +
     skyline**. The "we're up high" view; at most one or two edges.
   - **Remaining edges** → alternating **neighbor-glass** + **service-spine** props
     (fountain / plant / EXIT), `lobbyFloor` underneath.
3. **Corners** → `demisingWall` corners + EXIT/stairwell at one corner.
4. **Recede (vignette).** Content, not shader: the **outermost** ring row/col uses
   darker tile variants (tints toward `#181614`) so the border fades before the void.
   Keep the ring **thin** — 2 cells — so the eye never reads it as usable space; a
   wider band weakens the non-playable contract. (A real edge-gradient shader is a
   later upgrade, not v1.)

## Contract change — `office-layout.json` v3 → v4

Additive and backward-compatible (CONTRACT.md §3.4):

- **New:** top-level `tenantRect: { x, y, cols, rows }` — the playable envelope.
  **Absent ⇒ whole grid is playable** (old exports load unchanged).
- **`cols`/`rows`** now describe the **grown** grid (tenant + ring). The §3.4.1
  invariant "every interior cell belongs to a room" is re-scoped to *cells inside
  `tenantRect`*; ring cells are intentionally room-less.
- **`floors[][]` / `walls` / `props[]`** gain ring entries — same shapes, no schema
  change to the element types.
- **`roomGrid[][]`, `wings[]`, `anchors[]`, `characterSpawns[]`** never reference ring
  cells. Unchanged shape; the generator just doesn't emit ring entries into them.

## Seams the sim must honor (Unity repo — **verified** against `The-Water-Cooler`)

All three confirmed in C#. Two need a code change; one is tool-side only.

1. **Pathfinding must clamp to `tenantRect` — REQUIRED code change.** Walkability is
   `hasOpenFloor && !hasWall` (`Assets/WaterCooler/Runtime/Phase2/SpriteToolkitOfficeBinder.cs:3593`,
   `BuildObstacleAwareWalkableGrid` ~:3518), **not** room membership. Because the ring
   carries `lobbyFloor`, ring cells are walkable by default — and a broken demising
   wall (the suite entry door) would let NPCs path straight into the lobby. Fix is a
   one-line guard: `isWalkable = hasOpenFloor && !hasWall && insideTenantRect`. More
   robust than relying on an unbroken wall. Spawns are placed at raw layout coords
   without validation (`SpriteToolkitSceneAssembler.cs:230-251`), but `characterSpawns`
   is generated tenant-only, so spawns are safe by construction — clamp is an optional
   belt-and-suspenders.
2. **Interaction-anchor exclusion — TOOL-SIDE fix, optional sim guard.** Anchors are
   read **straight from the layout JSON** by `(x,y)` and matched by `interactionType` /
   `propId` (`SpriteToolkitOfficeBinder.cs:3073-3134`), **not** re-discovered at
   runtime. So the fix lives where we control it: `computeInteractionAnchors`
   ([exporter side](../src/core/exporter.ts)) must not emit anchors for ring props, or
   a sim agent would try to "use" a neighbor's elevator. Optional defense-in-depth:
   filter anchors outside `tenantRect` on load.
3. **Camera must frame `tenantRect`, not the grown grid — REQUIRED code change.**
   `TryFrameOffice` fits to full grid bounds via `TryGetWorldBounds`
   (`ProductionCameraController.cs:237-260` → `SpriteToolkitSceneAssembler.cs:102-111`,
   which returns `Bounds(size = cols*tileSize, rows*tileSize)`). Growing the grid would
   zoom the camera out to include the ring — framing it as if playable. Add
   `TryGetTenantBounds()` (compute from `tenantRect`) and point `TryFrameOffice` at it.
   The single change that sells "non-playable surround."

**Deserialization is safe.** The importer is Newtonsoft `JObject`-based and ignores
unknown fields (`Assets/WaterCooler/Editor/Phase2/SpriteToolkitZipImporter.cs:1414`),
so adding `tenantRect` to the JSON won't break old or in-flight loaders. Mirror it in
`SpriteToolkitOfficeLayout` with a `TenantRect` accessor that **defaults to the full
grid when absent** — same backward-compat contract as the JSON side.

## Parity & test impact

- **SVG preview must mirror the game.** `composeSceneSvg` + the scene panel render the
  ring too, or the tool preview diverges from Unity (the tool↔C# render parity the
  project maintains). The recede tint reuses the existing `fill + opacity` overlay
  idiom already in scene.ts.
- **Golden fixtures** (`tests/golden/office-layout/*.json`) regenerate with the grown
  grid + `tenantRect`; the C# parity fixtures re-sync from them (per §3.4 / S1.5.1).
- **Default-bundle guard** (`tests/defaultBundle.test.ts`): MERIDIAN's exported office
  now ships a surround, so a plain export stays a complete, sim-ready baseline —
  consistent with the "every system contributes a default" principle.

## Resolved decisions (signed off)

1. **Curtain-wall fill = flat sky-gradient for v1.** No parallax/day-night layer yet,
   but author the fill as a single `$sky` token (not a baked color) so a future
   day/night tint has a seam to hook. Parallax skyline stays deferred.
2. **Ring width = fixed 2 cells.** Does not scale with office size in v1; revisit only
   if it reads cramped on wide generated offices.
3. **`$building` is its own palette token group**, not a fixed darken of `$primary` —
   the building shell is art-directable independently of tenant style. (`$sky` from
   decision 1 lives in this group.)

## Scope

**In v1:** the 11-asset kit, the ring generation pass, `tenantRect` (v4), SVG-preview
parity, golden + default-bundle updates, the three Unity seams.

**Build status:**
- ✅ **Kit (BUILT)** — 3 tile templates + 5 prop templates in
  `src/tiles/templates.ts` / `src/props/templates.ts`, registered, with default
  instances seeded in `src/data/defaults.ts`. Typecheck clean; compositor snapshots
  cover all 8 (one each); all render correctly in the tool's Assets panel.
- ✅ **Ring generation pass (BUILT)** — `src/core/buildingSurround.ts`:
  `addBuildingSurround(scene, project, opts?)` is a pure transform that grows the grid
  by a 2-cell ring, records `tenantRect` on `SceneState`, restyles the tenant perimeter
  (exterior edge → curtain wall, others → demising), fills the interior ring with lobby
  stone (exterior side left void), and places the kit per edge (elevator+directory on
  the reception-nearest edge; neighbor-glass/exit/fountain/plant/extinguisher along the
  others). `classifyEdges` + `removeBuildingSurround` round-trip. Wired as an "Add
  building surround" toggle in the scene panel's Export tools. Verified in-tool on the
  golden office: grid 50×14 → 54×18, ring + props render, no console errors.
  9 unit tests in `tests/buildingSurround.test.ts`; full suite 402 pass.
- ✅ **`tenantRect` v4 export (BUILT)** — `office-layout.json` bumped to **version 4**
  with a top-level `tenantRect` (`null` when no surround); `sceneToLayoutJson` emits it
  and the grown `cols`/`rows`. `computeInteractionAnchors` now skips props outside
  `tenantRect` (new `insideTenant` helper) so ring decor never becomes a usable anchor.
  CONTRACT §3.4 updated (additive — old loaders ignore the field). Default-bundle guard
  asserts v4 + `tenantRect: null`; 4 new export/anchor tests. Full suite 406 pass.
- ⬜ **Recede polish** (darker outer-ring tiles) · the two **Unity** code-change seams
  (walkability `&& insideTenantRect` clamp; `TryGetTenantBounds()` + camera repoint).

With the export landed, the tool→sim boundary is complete: a surrounded office now
exports a v4 `office-layout.json` the sim can consume, carrying the `tenantRect` the two
Unity seams clamp against.

> Note on perimeter: the pass overwrites the tenant's outer wall with the building
> shell (suite wall *is* the demising wall — the single-wall reading). `composeSceneSvg`
> already renders the grown grid, so **SVG-preview parity is automatic** — no separate
> work item. The recede/vignette is currently "void beyond the outer ring"; per-cell
> darker outer-ring tiles remain a polish follow-up.

**Deferred:** parallax/day-night skyline; animated elevator doors; per-tenant neighbor
branding variety beyond a name swap; a real vignette shader.
