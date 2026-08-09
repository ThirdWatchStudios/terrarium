# QuotaCo Building Openings v2

Status: **approved canonical source art; production-wired in Terrarium**

These thirty hand-editable SVGs are canonical source for the approved building-opening directions.
The sliding auto-door bank contains twenty internal render SKUs: five retained wall materials
(Office, Brick, Panel, Cubicle, and Wood Slat) across horizontal/vertical × closed/open. The
Office compatibility filenames remain:

- `door-horizontal-closed.svg`
- `door-horizontal-open.svg`
- `door-vertical-closed.svg`
- `door-vertical-open.svg`

The Office compatibility window filenames are:

- `window-horizontal.svg`
- `window-vertical.svg`

The other twenty-four opening files append `-brick`, `-panel`, `-cubicle`, or `-slat` before `.svg`:
sixteen door states and eight window states. All doors retain the
owner-directed double retracting leaves, transparent open passage, narrow safety glazing, subtle
threshold, one coral status point, and handle-free operation. The aperture, lintel, jambs, face,
returns, and quiet material detail now come from the wall family rather than a decorative door-only
mask. A source-owned `translate(32 32) scale(.5)` group centers the construction in the 64-unit
wall-slot envelope used by the live person-scale grid. Unity scales wall tiles by `tileSize = 0.5`
but deliberately leaves props at their authored size, so a wall-replacement prop must carry this
compensation in its canonical art. The vertical states are separately authored fixed views; they
are not rotated horizontal elevations.

The approved post-import full-cell correction widens the horizontal outer aperture to 120/128
source units and its transparent open passage to 80/128 (63% of the wall cell). The lintel is one
continuous wall-plane construction, the jamb is one quiet return, and open leaves retract behind
it instead of leaving a nested frame around a narrow slot. Vertical closed/open states carry the
same full-cell interruption in their separately authored fixed view.

Canonical SVGs retain deterministic baseline material colors, but those are no longer a second
runtime palette. During export, each internal Door SKU resolves its wall material and remaps only
the wall-owned socket, lintel, jamb, front, and return colors to the matching looked wall instance.
The leaf, safety glazing, outline, material detail, and coral status point remain source-owned door
equipment. The exported flat sprite, layer sprite, and `prop.json` palette therefore agree with the
wall atlas and `wall.json` shipped in the same bundle, including older browser-saved projects whose
wall palettes differ from current defaults.

This changes visible construction and palette ownership inside the slot, not the slot's logical or
runtime dimensions.

The passage and surrounding floor are deliberately transparent. Review renderers may place the
SVGs over a floor for context, but no floor color belongs in the door source.

The 128×128 export canvas, centered pivot, one-cell logical footprint, and ordinary prop import
scale stay unchanged. Do not add a door-only Unity transform. The complete door remains centered
inside the approximately 64×64 structural slot.

`npm run doors:import` compiles the twenty sources into the existing `door` template. The template
retains the stable `door` id and wall-slot behavior while its internal `open`, `facing`, and
`material` parameters select the render state. `facility-catalog.json` still exports exactly one
player-facing Door build item. Unity derives the material from the wall being replaced (or from the
adjacent run in a carved legacy opening), then resolves the matching internal prop id. The four
unsuffixed Office ids remain the compatibility fallback for older layouts and imports.

This Terrarium promotion does not itself perform browser export or Unity import. Those remain
separate handoff and runtime-verification gates.

The office window preserves the stable `window` template and one-cell wall-slot footprint while
supplying ten internal render SKUs: five retained wall materials across separately authored horizontal
and vertical states. The horizontal state is an integrated front-facing wall opening. The vertical
state uses wall stubs and a raised top-oblique glazed barrier; its surrounding floor is transparent.
Its blind assembly is a narrow lengthwise side band, rotated as a complete unit with the fixed view.
`npm run windows:import` compiles all ten sources.

Window lintel, sill register, wall sockets, and seam stubs inherit the matching looked wall instance
during export. Frame, glazing, blinds, and mullion remain shared window equipment. The unsuffixed Office
ids are compatibility fallbacks; Unity derives material from the replaced wall and resolves the matching
internal SKU without exposing duplicate Window entries in the player catalog.

Neighbor-suite glass is explicitly deferred. It is not a member of this canonical source bank.
