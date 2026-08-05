# QuotaCo Building Openings v2

Status: **approved canonical source art; production-wired in Terrarium**

These four hand-editable SVGs are canonical source for the approved pressure-mat sliding
auto-door direction:

- `door-horizontal-closed.svg`
- `door-horizontal-open.svg`
- `door-vertical-closed.svg`
- `door-vertical-open.svg`

They preserve the owner-directed double retracting leaves, transparent open passage, pressure
mats, coral mode lens, and handle-free operation. Their construction follows the current 112-unit
equal-height wall source, then a source-owned `0.5` calibration group centers that construction in
the 64-unit wall-slot envelope used by the live person-scale grid. Unity scales wall tiles by
`tileSize = 0.5` but deliberately leaves props at their authored size, so a wall-replacement prop
must carry this compensation in its canonical art. The vertical states are separately authored
top-oblique views; they are not rotated horizontal elevations.

The passage and surrounding floor are deliberately transparent. Review renderers may place the
SVGs over a floor for context, but no floor color belongs in the door source.

The 128×128 export canvas, centered pivot, one-cell logical footprint, and ordinary prop import
scale stay unchanged. Do not add a door-only Unity transform. The complete door remains centered
inside the approximately 64×64 structural slot.

`npm run doors:import` compiles the four sources into the existing `door` template. The template
retains the stable `door` id and wall-slot behavior while its `open` and `facing` parameters select
the four fixed-view states. Terrarium scene rendering resolves a vertical wall orientation to the
separately authored vertical state instead of rotating the horizontal elevation.

This Terrarium promotion does not itself perform browser export or Unity import. Those remain
separate handoff and runtime-verification gates.
