# Campus Bundle 2 — Cafeteria & Kitchen Art Ask (CE-22 · Sustenance Module)

**Date:** 2026-07-18 · **Requested by:** sim (The Water Cooler) · **Status:** open ·
**Series:** campus bundle 2 of 3 (see `campus-bundle1-parking-ask.md`, `campus-bundle3-quad-ask.md`)

Context: the game's narrative frame is a **corporate campus** (owner-locked 2026-07-18).
This bundle supports catalog kit CE-22 "Sustenance Module" — a cafeteria with working
kitchen. Two fiction hooks drive the art: (1) the kit's validated seating is engineered
*against* conversation (study WS-214: "conversation extends session duration without
nutritive gain") — the floor truth is people clustering anyway; (2) IRIS logs cafeteria
**attendance, not value**, at the point of service — that scanner is the module's diegetic
keystone. Kitchen staff become the game's first non-desk occupants.

Ratified constraints (owner, 2026-07-18): no animation frames — no steam, no motion; static
sprites only. No export-schema changes.

Already in the catalog and reused as-is (no work): `fridge`, `microwave`,
`kitchenette-counter` (3×1), `vending-machine`, `break-table`, `trash-bin`,
`recycling-bins`, `wall-clock`, `menu`-adjacent precedent in `bulletin-board`/`poster`
(wall-slot pattern), `acc-clipboard`, `acc-coffee-tray`.

---

## A. Props — the service line

| templateId | projection | footprint | count | notes |
|---|---|---|---|---|
| `serving-line` | elevation | 4×1 | ×1 | the spine of the module: hot wells + tray rail + sneeze-guard glass in one counter run; agents queue along its length. Static — no steam (ratified). If 4×1 strains the re-tint atlas budget (8192px ceiling, see IRIS-unit comment at `src/props/templates.ts:~1009`), split into `serving-line` 2×1 + `serving-line-end` 2×1 that tile |
| `service-scanner` | elevation | 1×1 | ×1 | the point-of-service attendance logger — small pedestal terminal at the line's exit. Visually part of the IRIS family: include the green optic accent (`iris-installation-unit` / IRIS·FAB precedent). This is where "attendance is logged" happens on the floor |
| `commercial-range` | elevation | 2×1 | ×1 | range + oven block, hood integrated into the same sprite's top edge (avoids a separate wall-slot prop and any stacking question) |
| `prep-table` | plan | 2×1 | ×1 | stainless work surface, light clutter (cutting board, pans) |
| `dish-return` | elevation | 2×1 | ×1 | return window + rack; the queue's bookend opposite the serving line |
| `walk-in-front` | elevation | 2×1 | ×1 | walk-in cooler door face — reads "industrial cold storage" vs the domestic `fridge` |

## B. Props — seating (where the joke lives)

| templateId | projection | footprint | count | notes |
|---|---|---|---|---|
| `dining-carrel` | plan | 1×1 | ×1 | **the validated seating**: single seat + small table + privacy wing, a study carrel for eating. This is what CE-22 ships — "SEATING FOR SOLITARY DINING." Deliberately a little bleak; clean, not shabby |
| `cafeteria-table` | plan | 4×2 | ×1 | long communal table with attached bench seating both sides — the **unvalidated** alternative players hand-build. Warmth lives here; contrast with the carrel is the point |
| `tray-stack` | plan | 1×1 | ×1 | small clutter/flavor prop for the line's head |
| `condiment-station` | plan | 1×1 | ×1 · optional | flavor; skip if trimming |

## C. Character parts — kitchen staff uniform

Clone the IRIS·FAB recipe-only pattern (`head-fab` + `outfit-fab-chassis` in
`NON_SELECTABLE_PART_IDS`, `src/parts/library.ts:~1714/1753`, default recipe wired in
`src/data/defaults.ts:~1405`; documented in `docs/core-part-library.md` §"special
recipe-only parts"):

- `outfit-service-apron` — bib apron over tee; apron body on `$outfitPrimary`, tee sleeves
  on `$outfitSecondary`.
- `acc-hairnet` — hairnet accessory compatible with all hair parts (worn over; keep it a
  simple translucent cap outline so any hair silhouette survives).

Recipe-only for v1 (staff are cast by the sim, not player-dressed). Both render registers
(warm + operational-unit pictogram) come free per `src/core/renderings.ts`. Existing poses
cover v1 — no new poses; carrying is approximated by `acc-coffee-tray`/`acc-paper-stack`
precedent if needed later.

## D. Classification & export

- All Bundle 2 props are **placeable** (CE-22 kit content and hand-buildable); interior
  props, normal clinical-drain behavior (they drain with the building).
- `service-scanner` should land in the facility catalog as an interaction-anchor-capable
  entry (`isInteractionAnchor` — same flagging as other anchored facilities); the
  attendance-logging behavior itself is sim-side.
- Elevation props above are wall-adjacent counters, not `wall-slot` — only a menu board
  would be wall-slot, and v1 **omits a menu board**: the existing `bulletin-board`/`poster`
  slot props cover wall dressing, and "THE MENU IS NOT A VARIABLE" (CE-22 copy) is funnier
  with no menu displayed at all. Revisit if the floor needs it.
- Export as normal prop bundles; no schema changes.

## E. Sim-side integration notes (informational — not Terrarium work)

- `serving-line`/`service-scanner` join the B2 seek-and-satisfy seam (`serves:<need>`
  mapping is sim-side); scanner is the attendance-log event source.
- Queue formation, the solitary-carrel-vs-clustering behavior, and staff casting are
  entirely sim-side.
- Kitchen staff personas use the new recipe-only parts via a default recipe, mirroring how
  the IRIS·FAB crew is instantiated.

## Out of scope for this bundle

Steam/motion of any kind (animation deferred by ratified decision); menu board (see §D);
garden space feeding the kitchen (future — catalog withholds it "pending soil review");
parking (Bundle 1); quad/pond/zen garden (Bundle 3).

**Totals: 10–11 props · 2 recipe-only character parts · 0 system work · taxonomy pass (all interior/placeable).**
