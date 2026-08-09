# Authored QuotaCo prop SVG importer

The accepted QuotaCo workhorse, workstation, employee-service machine,
social-furniture, storage/support, décor/personalization, cafeteria, and
accepted exterior families are authored as sixty-two standalone SVG files under
`assets/props/quota-co-workhorse-v1`:

- `printer.svg`
- `printer-jammed.svg`
- `coffee-machine.svg`
- `coffee-machine-broken.svg`
- `water-cooler.svg`
- `water-cooler-empty.svg`
- `shredder.svg`
- `microwave.svg`
- `fridge.svg`
- `vending-machine.svg`
- `desk.svg`
- `office-chair.svg`
- `filing-cabinet.svg`
- `copier.svg`
- `office-plant.svg`
- `standing-desk.svg`
- `cubicle-workstation.svg`
- `reception-desk.svg`
- `conference-table.svg`
- `supply-cabinet.svg`
- `desk-lamp.svg`
- `desk-clutter.svg`
- `couch.svg`
- `waiting-bench.svg`
- `coffee-table.svg`
- `break-table.svg`
- `lounge-seating.svg`
- `bean-bag.svg`
- `nap-pod.svg`
- `bookshelf.svg`
- `lockers.svg`
- `open-shelving.svg`
- `pantry-shelf.svg`
- `mail-station.svg`
- `server-rack.svg`
- `coat-rack.svg`
- `potted-tree.svg`
- `hanging-plant.svg`
- `floor-lamp.svg`
- `framed-art.svg`
- `poster.svg`
- `wall-clock.svg`
- `fish-tank.svg`
- `string-lights.svg`
- `rug.svg`
- `serving-line.svg`
- `service-scanner.svg`
- `commercial-range.svg`
- `prep-table.svg`
- `dish-return.svg`
- `walk-in-front.svg`
- `dining-carrel.svg`
- `cafeteria-table.svg`
- `tray-stack.svg`
- `car.svg`
- `lot-marking-crosswalk.svg`
- `lamp-post.svg`
- `sign-lot.svg`
- `bike-rack.svg`
- `park-bench.svg`
- `picnic-table.svg`
- `tree-canopy.svg`

These are the canonical, artist-editable sources. `scripts/importQuotaCoWorkhorseProps.ts`
compiles them into `src/props/generated/quotaCoWorkhorseArt.ts`. The generated
module is an appearance layer only: handwritten `PropTemplate` definitions
continue to own IDs, labels, projections, grid footprints, pivots, contact
shadows, parameters, interaction metadata, export cells, and Unity-facing
registration.

## Commands

```bash
npm run props:import        # regenerate compiled ShapeSpec variants
npm run props:import:check  # validate sources and fail when output is stale
```

`npm run assets:check`, `npm run build`, and `npm run export` include the check.
Builds never rewrite SVG source files.

### Architectural sliding-door family

The stable `door` prop template is supplied by twenty separately authored sources under
`assets/walls/quota-co-building-openings-v2`: five retained wall materials × horizontal/vertical ×
closed/open. They use the same strict SVG dialect and source-exact compositor path as the canonical prop
families, but a dedicated importer keeps the architectural state bank explicit:

```bash
npm run doors:import        # regenerate the twenty compiled door variants
npm run doors:import:check  # validate source and fail when generated art is stale
```

The template parameters are `open=0|1`, `facing=0|1` (`0` horizontal, `1` vertical), and internal
`material=0..4` (Office, Brick, Panel, Cubicle, Wood Slat). The material parameter does not create player
catalog entries: all variants share template id `door`, and `facility-catalog.json` contains one Door item.
The receiver selects the material from the replaced wall. Vertical placement uses the separately authored
fixed-view source; Terrarium never rotates the horizontal front elevation. Open passages remain transparent
so the receiving floor shows through. `assets:check` includes the door freshness gate.

The door files also own their live grid compensation: the 112-unit wall construction is centered under a
`translate(32 32) scale(.5)` group, producing an approximately 64-unit visible wall-slot inside the normal
128-unit prop canvas. This matches the Unity person-scale grid, where wall tiles receive `tileSize = 0.5`
and props do not. Consumers use the ordinary prop scale; a door-only runtime scale is forbidden.

### Architectural office-window family

The stable `window` prop template is supplied by ten canonical sources under
`assets/walls/quota-co-building-openings-v2`: five retained wall materials across separately authored
horizontal front-facing and vertical raised top-oblique views. They follow the same strict SVG dialect,
source-exact compositor path, wall-palette inheritance, and source-owned live-grid compensation as the
sliding doors:

```bash
npm run windows:import        # regenerate the ten compiled window variants
npm run windows:import:check  # validate source and fail when generated art is stale
```

The template parameters are `facing=0|1` (`0` horizontal, `1` vertical) and internal `material=0..4`.
`prop-window` and `prop-window-vertical` remain the unsuffixed Office compatibility ids; the other eight
internal render SKUs append `-brick`, `-panel`, `-cubicle`, or `-slat`. The player still sees one Window
catalog item. The receiver derives material from the replaced wall and selects the fixed view from wall
axis; it never rotates horizontal pixels. During export, wall-owned window structure resolves from the
matching looked wall instance while frame, glazing, blinds, and mullion remain shared equipment. Floor
remains transparent and independently rendered. Neighbor-suite glass is not part of this source bank and
stays deferred until a concrete building-surround use returns.

## Source contract

- Canvas and root metadata are fixed:
  `viewBox="0 0 128 128"`, `width="128"`, `height="128"`,
  `data-prop-id`, and `data-projection`.
- Every file includes a `<title>` and `<desc>`.
- Ordinary groups, paths, rounded rectangles, ellipses, and circles are
  accepted. Every visible element and editor group has a unique semantic ID.
- Authored `shadow` groups compile as literal source art. Existing contact-shadow
  footprints remain registered for compatibility, but their compositor-owned
  shadows are disabled for authored SVG props unless restyling is explicitly
  requested.
- Source strokes are production art and compile into literal ink shapes beside
  tokenized fills. Authored SVG props ignore Terrarium's global prop outline and
  contact-shadow passes by default, so the canonical source remains visual
  truth. The legacy restyling pass remains available only through the explicit
  compositor opt-in for future experiments.
- The default authored-prop layer export is one resolved `tint:null` layer.
  This preserves source paint order and avoids turning alternating fills and
  strokes into oversized runtime atlases. The existing manifest schema and
  palette vocabulary remain intact; procedural props keep their re-tintable
  layer path.
- In the normal raw look, those tokens resolve from the SVG's declared
  canonical palette—not from a browser-persisted `PropInstance.palette`.
  Loading or exporting an older project reconciles authored-prop palette
  metadata to the source defaults, while procedural props remain project
  palette-driven. The instance palette is consulted for authored SVGs only
  through the explicit restyle path.
- `data-fill-token="primary|secondary|accent"` maps a source fill to the
  existing prop palette channel. Its visible SVG fill must equal the declared
  default palette color, so the default production render and standalone
  source cannot silently drift.
- External references, event attributes, scripts, images, foreign objects,
  rendered text, duplicate IDs, and non-128 canvases are rejected.

## Parameter variants

The compiler bakes all legal values of the existing controls rather than
shipping an SVG parser or procedural geometry to the browser:

| Prop | Retained controls |
| --- | --- |
| Printer / jammed | width |
| Coffee machine / broken | height |
| Water cooler / empty | height |
| Paper shredder | height |
| Microwave | width |
| Break-room fridge | height |
| Vending machine | height, stocked rows |
| Desk | width, monitor |
| Office chair | seat size |
| Filing cabinet | drawer count |
| Copier | height |
| Office plant | bushiness |
| Standing desk | width, dual monitor |
| Cubicle workstation | opening side, clutter |
| Reception desk | width |
| Conference table | width, chair count |
| Supply cabinet | height |
| Desk lamp | size |
| Desk clutter | paper piles, phone |
| Lobby couch | width, cushion count |
| Waiting bench | length, seat count |
| Coffee table | width, décor |
| Break-room table | diameter, stool count |
| Lounge seating | seat count |
| Beanbag | size |
| Nap pod | visor up/down |
| Bookshelf | shelf count, fill level |
| Lockers | door columns, height |
| Open shelving | shelf count, fill level |
| Pantry shelf | shelf count |
| Mail station | height, pigeonhole columns |
| Server rack | height, server-unit count |
| Coat rack | hook count |
| Potted tree | height, fullness |
| Hanging plant | vine length, fullness |
| Floor lamp | height |
| Framed art | width, scene |
| Poster | caption lines |
| Wall clock | hour hand |
| Fish tank | fish count |
| String lights | bulb count |
| Office rug | width, pattern |
| Campus fleet car | lights |
| Parking sign | panel |
| Tree canopy | crown habit, lobes, shape seed |

The nine cafeteria facilities, crosswalk marking, offset-arm street light,
low-staple bike rack, park bench, and picnic table have no editable parameters.
Their existing template IDs, projections, and placement contracts remain
unchanged.

Runtime lookup snaps malformed or off-step imported values to the nearest legal
variant. No project schema or export-contract field is added.

The redundant `water-station` prop has been retired. Gameplay water service
uses the anchored `water-cooler` template and its `water-cooler-empty` state,
both of which now compile from canonical SVG sources.

## Production status

The original forty-five-source interior bank passed consolidated close, normal,
crowded, wall-context, interaction, and far-gameplay review and was visually
accepted on 2026-07-29. The eight-source exterior family subsequently passed
accepted-reference, canonical-source, compiled-output, normal-context, and
far-gameplay validation. The nine-source cafeteria family passed its context and
source/import fidelity gates and was approved for production wiring on
2026-08-03. All sixty-two SVGs are now the Terrarium production sources for
their existing prop templates. The generated `ShapeSpec` module is a compiled
derivative and must be regenerated after an artist edits a source.

This promotion does not change template IDs, footprints, projections, pivots,
interaction anchors, facility registration, export paths, manifest shape,
schema version, or Unity registration. The accepted 128-unit prop frame retains
its native two-gameplay-cell presentation and does not inherit the character
visual multiplier.

The ordinary Terrarium bundle was exported and imported through The Water
Cooler's real Sprite Toolkit path as
`water-cooler-sprites-20260729-182010` (Unity commit `d345281b0d`). The user
confirmed the accepted geometry and canonical palette in Unity after the
stale browser-palette reconciliation. The Terrarium production source,
importer, proof artifacts, snapshots, and palette-policy regression coverage
close together in the corresponding scoped Terrarium commit.

The separate source-only candidate bank at
`assets/props/quota-co-gameplay-candidates-v1` holds the accepted HVAC
condenser, surveillance camera, surveillance sensor, and privacy hedge
concepts. Those files are deliberately outside this importer and do not create
live IDs, state art, facility entries, exports, or Unity registration.

The exterior extension received a fresh downstream bundle import on 2026-07-30.
The user confirmed that it introduced no new catalog items, which is the
expected result: the eight promoted files replace the appearance builders of
existing carriers, while the four gameplay-system concepts remain source-only.
An in-world visual smoke test remains deferred because none of the eight
existing carriers are surfaced in the current build or bare-lot presentation.
No runtime-appearance conclusion is inferred from their present absence.

The cafeteria extension completed the normal in-browser export and a fresh
Unity import on 2026-08-03. The facilities do not yet have a viable in-game
path, so gameplay-scale visual acceptance remains explicitly deferred until the
sim can surface them; it is not inferred from successful import.

Gameplay-contract and registration work for the four source-only infrastructure
concepts was explicitly deferred on 2026-07-30. Their SVGs remain reference
art, not an active production queue. Promotion requires a separately approved
receiver, observable states, placement/coverage rules, and employee
consequences.
