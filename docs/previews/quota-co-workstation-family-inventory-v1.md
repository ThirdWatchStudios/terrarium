# QuotaCo workstation-family inventory v1

Status: **review-only calibration**. No production art, source SVGs, template
wiring, exports, schema, or Unity registration changed for this family.

Fixed calibration controls:

- `desk`
- `office-chair`
- `filing-cabinet`
- completed production characters at visual scale 0.65
- accepted 112-unit office walls

Scale calibration:

- every 128-unit prop source frame is two gameplay cells at the current Unity
  128 PPU / 0.5 tile-size relationship
- each prop silhouette occupies a noun-specific portion of that frame
- current review envelopes: office chair 0.72, filing cabinet 0.76, supply
  cabinet 0.76, desk lamp 0.58; all others remain 1.0
- props do not inherit the character visual multiplier
- grid occupancy, collision, pivots, and interaction anchors remain independent
  from the visual frame

| Template | Projection | Grid footprint | Contact shadow cx,cy / rx×ry | Parameters |
|---|---:|---:|---:|---|
| `standing-desk` | plan | 2×1 | none | width 84..116 step 4 default 100; dual 0..1 step 1 default 0 |
| `cubicle-workstation` | plan | 2×2 | none | openness 0..3 step 1 default 0; clutter 0..2 step 1 default 1 |
| `reception-desk` | plan | 2×2 | none | width 72..104 step 4 default 88 |
| `conference-table` | plan | 3×2 | none | width 84..120 step 4 default 110; chairs 0..8 step 1 default 6 |
| `supply-cabinet` | elevation | 1×1 | 64,117 / 22×4.5 | height 60..84 step 2 default 72 |
| `desk-lamp` | elevation | 1×1 | 64,117 / 9×3 | size 26..40 step 2 default 32 |
| `desk-clutter` | plan | 1×1 | none | papers 1..4 step 1 default 3; phone 0..1 step 1 default 1 |

## Shared proposal grammar

- broad cream molded catalog shells
- dark-green service recesses and structural inserts
- olive writing and interaction surfaces
- coral controls, handles, bells, and employee-use tells
- continuous silhouettes before equipment detail
- personalization grouped into a subordinate, editable layer

## Review gate

Review the close comparisons, normal rooms, crowded rooms, wall context, desk
occlusion, character interaction, and far gameplay strip. If the family is
accepted, author seven standalone SVG sources and only then wire them through
the existing prop-source importer. Unity import remains deferred.
