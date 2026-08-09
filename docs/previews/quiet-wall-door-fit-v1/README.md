# Quiet Wall Door Fit v1

Status: **approved and promoted to canonical Terrarium source; browser export and Unity import pending**

This proof refits the existing four-state sliding auto-door to the five-wall core system.
The door remains a one-cell, double-retracting wall-slot fixture with separately drawn
horizontal and vertical states. The proposed change is one of visual ownership:

- the wall material owns the aperture, lintel, jambs, front face, returns, and material detail;
- the shared door equipment is reduced to paired leaves, narrow safety glazing, and one status point;
- the pressure trigger is reduced to a quiet threshold field; oversized mats and decorative threshold hardware are removed;
- open states leave the passage transparent; no floor is baked into the candidate;
- axis remains topology-derived and does not introduce an inside-facing input.
- production wall cells are flattened and clipped in page coordinates so nested-SVG hairlines are not mistaken for source seams.

The approved geometry now owns the twenty canonical door SVGs (five wall materials × four fixed-view
states), generated registry, stable production template, and receiver-side material resolution. The
player-facing catalog still contains one Door item; the receiver chooses the internal material SKU from
the replaced wall and falls back to the unsuffixed Office bank for an older four-sprite import.

The unfinished gate is a fresh browser `Export all (zip)`, Unity import, and Play Mode review. No browser
bundle or imported Unity sprite bank was produced by this source promotion.
