# QuotaCo Building System — authored B pilot

This directory is the editable SVG authority for the approved split-B geometry
pilot from `docs/quota-co-high-oblique-geometry-ask.md`. It contains only the
nine approved comparison cases, each divided into a connected low `base` and an
optional `upper` component. The base is drawn first; the upper is composited at
the same centered grid pivot.

These files are source art, not a production wall family. They are deliberately
not registered in `WALL_TEMPLATES`, the exporter, the facility catalog, or the
47-blob atlas. They do not define new frame ids, projection values, metadata,
schema fields, or Unity behavior. The existing `assets/walls/bevel/` kit remains
untouched and authoritative for the shipped wall templates.

## Inventory

Each stem has one `-base.svg` and one `-upper.svg` source:

- `full_n_straight`
- `full_w_straight`
- `full_exterior_corner`
- `full_terminus`
- `transition_n_to_e`
- `transition_w_to_s`
- `door_closed`
- `door_open`
- `window_wide`

The 18 SVGs use a strict `0 0 128 128` canvas. Paths that meet a canvas edge are
intentional connected-wall seams; any future production assembler owns clipped
overdraw. Do not rotate a directional frame to manufacture another facing.

## Art contract

- fixed orthographic high-oblique/top-down-plus over the rectangular grid;
- low structural base at the approved 22-unit profile;
- full upper shell extending to the approved 60-unit profile;
- north/west full cases and south/east low transitions are explicitly authored;
- open thresholds remain flat and visually walkable;
- no raised floor plinth and no baked directional cast shadow;
- charcoal contour/recess `#252A28`;
- aged cream shell `#D9D0B9`;
- deep green base `#294B3C`;
- oxidized teal field/glass family `#4E7D79` / `#83A9A6`;
- restrained coral hardware `#B65F4D`;
- functional metal `#979A91`.

All visible paths live under `detail/*` groups because the charcoal contour is
authored explicitly and every component must compile without gaining a second
automatic silhouette. White/black opacity layers are neutral face cues only.
Terrarium owns this source art and any later palette-mask evidence. Unity owns
composition, cutaways, sorting application, lighting, and production acceptance.

Do not expand this directory to the complete 47-blob/profile/opening family until
the authored-B source gate is reviewed. Do not derive a contract or schema change
from these source files alone.
