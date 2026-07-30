# QuotaCo employee-service machine inventory v1

Status: **accepted direction and production-wired SVG family**. Ten canonical
SVG sources and deterministic template wiring are present. Schema and Unity
registration remain unchanged; no Unity import or commit has been made.

Accepted controls:

- `copier`
- `office-plant`
- `supply-cabinet`
- completed production characters at visual scale 0.65
- accepted 112-unit office walls

All machines retain their native 128-unit / two-cell source frame. Their art
envelopes are noun-specific, scale around the y=116 ground pivot, and do not
inherit the character multiplier.

Current review envelopes:

- printer 0.84
- coffee machine 0.84
- water cooler 0.86, with a separately reduced bottle
- shredder 0.82
- microwave 0.85
- fridge 0.86
- vending machine 0.86

| Template | Grid footprint | Contact shadow cx,cy / rx×ry | Parameters |
|---|---:|---:|---|
| `printer` | 1×1 | 64,117 / 26×4 | width 44..72 step 2 default 56 |
| `printer-jammed` | 1×1 | 64,117 / 26×4 | width 44..72 step 2 default 56 |
| `coffee-machine` | 1×1 | 64,117 / 18×3.5 | height 40..56 step 2 default 48 |
| `coffee-machine-broken` | 1×1 | 64,117 / 18×3.5 | height 40..56 step 2 default 48 |
| `water-cooler` | 1×1 | 64,117 / 21×4 | height 44..68 step 2 default 56 |
| `water-cooler-empty` | 1×1 | 64,117 / 21×4 | height 44..68 step 2 default 56 |
| `shredder` | 1×1 | 64,117 / 17×4 | height 34..50 step 2 default 42 |
| `microwave` | 1×1 | 64,117 / 22×4 | width 38..52 step 2 default 44 |
| `fridge` | 1×1 | 64,117 / 21×4.5 | height 66..90 step 2 default 78 |
| `vending-machine` | 1×1 | 64,117 / 25×4.5 | height 70..94 step 2 default 84; stocked 1..3 step 1 default 3 |

## Shared proposal grammar

- broad cream molded service shells
- dark-green feed, cup, product, and retrieval recesses
- coral controls and failure-state markers
- explicit interaction faces before decorative detail
- employee notes, magnets, paper, and wear as the human counterpoint
- stable base silhouettes across jammed, broken, and empty state swaps

## Production validation gate

Review the canonical-source versus imported-output sheet at close, normal, far,
crowded, wall, failure-state, and interaction views. Unity import remains
deferred.
