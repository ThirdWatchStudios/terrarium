# QuotaCo social and lounge furniture inventory v1

Status: **accepted direction and production-wired SVG family**. Seven canonical
SVG sources now compile into deterministic parameter variants. No schema,
Unity registration, Unity import, or commit changed.

Fixed calibration controls:

- accepted reception desk
- accepted office plant and water cooler
- completed production characters at visual scale 0.65
- accepted 112-unit office walls

Every prop retains its 128-unit / two-cell source frame. Art envelopes are
noun-specific and never inherit the character multiplier.

Current review envelopes:

- couch 0.90
- waiting bench 0.90
- coffee table 0.82
- break table 0.90
- lounge seating 0.90
- beanbag 0.84
- nap pod 0.90

| Template | Projection | Grid footprint | Contact shadow cx,cy / rx×ry | Parameters |
|---|---:|---:|---:|---|
| `couch` | plan | 2×1 | none | width 62..98 step 4 default 82; cushions 2..3 step 1 default 3 |
| `waiting-bench` | plan | 2×1 | none | length 76..112 step 4 default 96; seats 2..4 step 1 default 3 |
| `coffee-table` | plan | 1×1 | none | width 48..76 step 4 default 62; decor 0..2 step 1 default 2 |
| `break-table` | plan | 2×2 | none | diameter 40..64 step 4 default 52; stools 2..4 step 1 default 4 |
| `lounge-seating` | plan | 2×2 | none | seats 2..4 step 1 default 3 |
| `bean-bag` | plan | 1×1 | none | size 34..48 step 2 default 42 |
| `nap-pod` | elevation | 2×1 | 64,117 / 34×5 | visor 0..1 step 1 default 1 |

## Institutional Comfort System

- continuous cream molded perimeter shells
- replaceable dark-green and green-grey upholstery inserts
- obvious sitting, eating, low-table, and recovery surfaces
- coral maintenance tabs and small employee-use details
- magazines, mugs, throws, wear, and arrangement provide warmth
- no residential sofa language, wood-forward mid-century styling, diner chrome,
  or generic luxury lounge treatment

## Review gate

Review canonical-source versus imported-output close comparisons,
waiting/reception, break/lounge, quiet/recovery, parameter variants, counter
occlusion, seating approaches, crowded circulation, wall context, and far
gameplay zoom. Unity import remains deferred.
