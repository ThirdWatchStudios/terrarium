# Prop / asset variety — gap analysis for the office builder

*Mapping only — nothing authored yet. This is the review artifact before we decide what to build. Goal: enough
**type coverage** to furnish a believable office, and enough **instance variety** to keep the free-grid builder
from reading as stamped clones. Written 2026-07-05, grounded against `src/props/templates.ts` (40 prop templates),
`src/tiles/templates.ts` (7 walls, 9 floors), and the room vocabulary the office actually uses.*

Related: [game-design-docs/the-water-cooler/docs/design/terrarium-office-builder-assets.md] (§4 the grievable
"before", §5 QuotaCo convert-pairs / Q5), [the-office-builder.md] (the pivot), `src/props/templates.ts` (the
catalog this extends).

---

## 0. The one framing that matters

"Variety" is two different problems, and for a *builder* the second is the real killer:

1. **Type coverage** (believability) — do we have the KINDS of objects an office needs? Gaps here make a room feel
   *incomplete*. We're actually in decent shape; the holes cluster in decor/personality, AV, and open storage.
2. **Instance monotony** (the builder-killer) — when the player drops 20 desks, do they get 20 *identical*
   sprites? Today: **yes.** The facility catalog maps one facility → one `propId` → one baked sprite. You can add
   30 templates and a room of identical-anything still reads as a clone. This is a **systems** problem
   (variation-at-placement), not only a content problem. See §7.

Both need attention; §7 argues the monotony levers give more variety per unit of work than raw new types, while
§6 argues the warm-personality content is the highest *narrative* value for the pivot.

## 1. Current inventory (what we have)

**Props — ~31 placeable** (of 40 templates; excludes 3 tamper twins + 5 building-surround decor):

| Role | Templates |
|---|---|
| Workstation | desk, cubicle-workstation, office-chair, desk-clutter |
| Amenity / interaction | water-cooler, water-station, water-fountain, coffee-machine, printer, fridge, vending-machine, mail-station, supply-cabinet, whiteboard, kitchenette-counter |
| Meeting / social | conference-table, break-table, couch, lounge-seating |
| Storage / service | filing-cabinet, coat-rack, trash-bin |
| Reception | reception-desk |
| Decor / soft | office-plant, rug, bulletin-board, wall-calendar, nameplate |
| Architectural (wall-slot) | door, window, badge-reader, hvac-vent |

**Walls (7):** office-wall, glass-partition, cubicle-partition, brick-wall, panel-wall, demising-wall, curtain-wall.
**Floors (9):** carpet, carpet-tiles, wood-floor, linoleum, utility-vinyl, quiet-carpet, terrazzo, rubber-mat,
lobby-stone.

## 2. Coverage by room archetype

Rooms the office **actually uses today** (from the layout/scene data): `cubicle-farm`, `hallway`, `reception`,
`lobby`, `manager-office`, `conference-room`, `break-room`, `copy-room`, `storage`. The **builder pivot lets the
player construct arbitrary rooms**, so the aspirational rooms (wellness/game/IT/exec/focus) below become real prop
demand even though the generator doesn't emit them yet.

| Room | Have | Missing (believability) |
|---|---|---|
| **Cubicle-farm / open plan** | desk, cubicle-workstation, chair, plant, clutter | standing-desk; desk-item *variety* (anti-monotony); dual-monitor read |
| **Manager / executive office** | desk, chair, filing-cabinet, couch, plant | bookshelf, credenza, exec desk/chair, framed art, floor lamp |
| **Conference room** | conference-table, whiteboard, chairs | **wall TV / projector screen** (glaring), kanban/content whiteboard |
| **Break room / kitchen** | fridge, coffee-machine, vending, kitchenette-counter, break-table | microwave, snack/pantry shelf, dish rack, counter stools |
| **Reception** | reception-desk, plant, nameplate | **waiting seating** (distinct from lounge), coffee table, feature/logo wall, water feature |
| **Lobby** | lounge-seating, couch, rug, plant, directory | feature wall, art, water feature/fish tank, magazine rack |
| **Copy / mail room** | printer, mail-station, supply-cabinet, filing-cabinet | shredder, large copier/multifunction, scanner |
| **Storage / IT** | supply-cabinet | **shelving/racks, lockers, storage boxes, server rack** |
| **Hallway / circulation** | (walls, doors, plant) | wayfinding sign, bench, wall art, water fountain (have) |
| **Focus / phone booth** *(builder)* | quiet-carpet floor, couch | **phone booth / focus pod**, acoustic panel |
| **Wellness / game room** *(builder, satire)* | — | **ping-pong, foosball, bean bags, nap pod** |
| **Restroom** *(abstracted)* | — | abstracted fixture set — a **sink bank** + **stall run**, suggestive not literal; enough to read as a restroom (decided 2026-07-05) |

**Read:** functional coverage is solid for the core rooms; the sharp holes are **AV (conference/lobby)**, **open
storage (IT/storage)**, and the **decor/personality + wellness** sets that the builder's freeform rooms will want.

## 3. Cross-cutting functional gaps

- **Screens / AV** — no wall TV, projector screen, or monitor-on-wall. Conference rooms and lobbies read
  incomplete without one. *(High.)*
- **Open storage** — bookshelf, open shelving/racks, lockers, storage boxes. We only have *closed* cabinets. *(High.)*
- **Lighting** — no floor lamp, desk lamp, or pendant. Warm lighting is a cheap, high-impact "loved office" signal. *(High for warmth.)*
- **Decor / personality** — one plant, no framed art/posters, no wall clock, no personal desk items. This is the
  thinnest category and the most narratively load-bearing (§6). *(High.)*
- **Plant variety** — exactly ONE plant template. Needs tall/floor, hanging, and desktop-succulent variants. *(Medium-high, cheap.)*
- **Seating variety** — one couch, one lounge set, one chair. Waiting chairs, bench, coffee table, bean bags. *(Medium.)*
- **Wellness / game** — nothing. Pure satire fuel and the strongest "warm before" signal. *(Medium, high flavor.)*
- **Service equipment** — shredder, scanner, big copier, server rack, microwave. *(Medium.)*

## 4. Walls & floors

Reasonable spread already. Gaps tied to the warm↔clinical axis and area definition:

- **Walls:** add a **living / moss wall** (warm feature), a **branded / logo wall** (clinical corporate), maybe a
  half-height glass or pegboard. 7 → ~10.
- **Floors:** add **polished concrete** (clinical/industrial), an **accent/area tile** (defines zones — helps the
  builder read spatially), maybe **astroturf** (game room). 9 → ~12. Floor variety is a cheap, high-leverage
  anti-monotony surface because it tiles a whole room.

## 5. Warm ↔ clinical tagging (the pivot lens)

Variety isn't neutral here: the "before" must be **warm, specific, grievable**; the "after" is QuotaCo-clinical.
Tag every prop so the two ends are authorable:

- **Warm / personality** (make the inherited office loved): plant variety, framed art, lamps, bookshelf, personal
  desk items, coffee table, water feature/fish tank, pet bed, string lights, game/wellness props, round wood
  break-table.
- **Clinical / corporate** (the sterilized after): cubicle-workstation ✓, lockers, server rack, badge-reader ✓,
  standardized bench-table, branded wall, polished concrete, surveillance apparatus *(parked — new art, B4/B5)*.
- **Neutral** (both): desk, chair, printer, trash, door, window.

**Convert-pairs (terrarium doc Q5)** — signature warm→corporate swaps for the core-verb inversion. The codebase
**already supports paired-variant props** (the tamper twins: `printer` → `printer-jammed`), so a convert-pair
reuses that mechanism:

| Warm | → Corporate |
|---|---|
| round wood break-table | cafeteria bench-table |
| couch / lounge-seating | cubicle-workstation *(the core inversion)* |
| potted tree / framed art | surveillance camera / QuotaCo poster *(new art, parked)* |
| warm floor lamp | overhead fluorescent |
| bookshelf | lockers |

*Recommendation stands with the doc:* a **mix** — explicit replacement templates for signature conversions, the
`clinical` look-lens for ambient corporatization.

## 6. The highest-value CONTENT gap

For *this* game, the **warm-personality / decor set is the highest narrative value**: plants, art, lamps,
personal desk items, and game/wellness props are exactly what make the acquired company feel specific and loved —
the emotional engine of the pivot. Clinical monotony is almost the *point* of the corporatized end-state, so we
invest variety on the warm end and let the look-lens do the sterilizing.

## 7. The MONOTONY levers (systems, not content)

Even a big catalog reads as clones if placements don't vary. Ranked by variety-per-effort:

| Lever | State | Notes |
|---|---|---|
| **Palette swatches** | *substrate shipped* | The re-tint layer atlases (props/walls/floors) are exported. 1 desk × 4 swatches = 4 desks. Needs the Unity consumer + a per-placement palette-pick policy. See [environment-palette-tinting.md]. |
| **Dressing / scatter layer** | *partial* | `desk-clutter` exists as a separate overlay. A small set of "personal item" scatter props placed with per-instance variation is the cheapest way to make identical desks read as owned. The ART can be authored now even if the placement system lands later. |
| **Rotation** | *supported, underused* | Plan props already rotate in-engine; the builder should exploit it to break grids. |
| **Multiple templates per slot** | *content* | 3 desk styles + 4 chair styles is worth more than 7 unrelated new types. |
| **Per-placement parametric variation** | **parked** | Desk width, plant bushiness, table chairs — the *richest* lever, but gated on the geometry-at-runtime work (params are baked per instance today). |

**Leverage:** 3 desk templates × 4 swatches × 4 rotations × a scatter layer = dozens of distinct-looking desks
from a tiny amount of new content. This is why §7 systems beat raw new types for the "falls flat" problem.

## 7a. Direction (decided 2026-07-05)

- **Narrative-first.** Author the warm-personality set (P0) before the AV/storage functional holes.
- **Cheap levers, not more silhouettes.** For now lean on **palette swatches + a scatter/dressing layer** to break
  monotony rather than authoring multiple distinct desk/chair *shapes*. So the "multiple templates per slot" lever
  (§7) is **deferred**; new props should be authored to swatch well (clean `$primary/$secondary/$accent` usage)
  and the personal-item scatter art is in scope now.
- **Bathrooms abstracted.** Include a restroom, but as a suggestive fixture set (sink bank + stall run), not
  literal plumbing.

## 8. Proposed additions — prioritized

Concrete author list, tagged with the template conventions (`projection` plan/elevation, `placement`
floor/wall-slot, `gridFootprint`, interaction-anchor?). Footprints are first-guess; art-determined at authoring.

### P0 — highest value (warm personality + glaring holes)
| id | role | warm/clinical | proj | placement | footprint | interaction |
|---|---|---|---|---|---|---|
| potted-tree | plant variety | warm | elevation | floor | 1×1 | no |
| hanging-plant | plant variety | warm | plan | wall-slot | 1×1 | no |
| desk-succulent | scatter plant | warm | plan | floor | 1×1 | no |
| framed-art | decor | warm | plan | wall-slot | 1×1 | no |
| poster | decor (satire pair) | warm↔clinical | plan | wall-slot | 1×1 | no |
| wall-clock | decor | neutral | plan | wall-slot | 1×1 | no |
| floor-lamp | lighting | warm | elevation | floor | 1×1 | no |
| desk-lamp | lighting / scatter | warm | plan | floor | 1×1 | no |
| bookshelf | storage / personality | warm | elevation | floor | 1×1 | no |
| wall-screen (TV) | AV | neutral | plan | wall-slot | 2×1 | maybe (presentation) |
| personal-desk-items | dressing set (scatter) | warm | plan | floor | 1×1 | no |

### P1 — believability + satire
| id | role | warm/clinical | proj | placement | footprint | interaction |
|---|---|---|---|---|---|---|
| standing-desk | workstation | neutral | plan | floor | 2×1 | no |
| lockers | storage | clinical | elevation | floor | 1×1 | no |
| open-shelving | storage | neutral | elevation | floor | 1×1 | no |
| waiting-bench | seating | warm | plan | floor | 2×1 | no |
| coffee-table | lounge | warm | plan | floor | 1×1 | no |
| kanban-board | collaboration | neutral | elevation | wall-slot | 1×1 | maybe |
| phone-booth | focus pod | neutral | elevation | floor | 1×1 | yes (focus) |
| ping-pong-table | game / satire | warm | plan | floor | 3×2 | yes (recreation) |
| foosball-table | game / satire | warm | plan | floor | 2×1 | yes (recreation) |
| bean-bag | seating / satire | warm | plan | floor | 1×1 | no |
| copier | service (large) | neutral | elevation | floor | 1×1 | yes (printer-like) |
| shredder | service | clinical | elevation | floor | 1×1 | no |
| server-rack | IT | clinical | elevation | floor | 1×1 | no |
| microwave | kitchen | warm | elevation | floor | 1×1 | maybe |
| pantry-shelf | kitchen | warm | elevation | floor | 1×1 | no |
| restroom-sink | fixture (abstracted) | neutral | elevation | floor | 2×1 | no |
| restroom-stall | fixture (abstracted) | neutral | elevation | floor | 1×1 | no |

### P2 — flavor / long tail
recycling-bins (pair trash), fish-tank / water-feature (warm reception), nap-pod (satire), pet-bed (warm), string-
lights / wall-vines (warm), magazine-rack, dish-rack, A-frame floor sign, exec-credenza, bar-cart, awards-shelf,
motivational standee/easel, umbrella-stand, photo pinboard, acoustic-panel.

### Walls / floors
Walls: living-wall (warm), branded-wall (clinical), half-glass, pegboard.
Floors: polished-concrete (clinical), accent/area-tile (zone definition), astroturf (game).

## 9. Rough sizing

- P0: ~11 props + wall/floor starters. The believability + warmth core.
- P1: ~15 props. Fills AV/storage/service/satire.
- P2: long tail, author opportunistically.
- Systems (§7): swatch policy + scatter-dressing are separate work items but multiply everything above.

## 10. Decisions

**Resolved (2026-07-05):**
- **Restrooms — in, abstracted.** A suggestive fixture set (sink bank + stall run), not literal plumbing.
- **Templates-per-slot — deferred.** Lean on palette swatches + scatter-dressing to break monotony rather than
  authoring multiple distinct desk/chair silhouettes for now (§7a).
- **Priority — narrative first.** Warm-personality (P0) leads; AV/storage functional holes follow.

**Still open:**
- **Convert-pairs scope (Q5).** Which signature warm→corporate swaps get explicit paired templates vs. the look-lens.
- **Scatter / dressing system.** Author the personal-item ART now (recommended — cheap, reusable) even though the
  placement-variation SYSTEM (per-instance scatter) may lag; that half is partly Unity-side.
- **Interaction anchors.** Which new props are sim-interaction anchors (phone-booth, ping-pong, copier) vs. pure
  decor — anchors must join `INTERACTION_PROP_TYPES` + the facility catalog.
