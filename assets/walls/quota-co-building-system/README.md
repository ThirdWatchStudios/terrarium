# QuotaCo Building System — authored B pilot

This directory is the editable SVG authority for the A1 technical-split geometry
pilot from `docs/quota-co-high-oblique-geometry-ask.md`. It contains only the
nine approved comparison cases, each divided into `base` and `upper` source
components. The base is drawn first; the upper is composited at the same centered
grid pivot. The composed frame—not either component alone—is the visual product.

The original independently finished low-base-plus-optional-upper construction was
rejected on 2026-07-20 because its duplicate caps and contours read as one wall
placed on another. The files remain split only where their paths can contribute
complementary surfaces to one continuous wall envelope. Root `base` components
are lower-face/plinth ingredients, not standalone low walls; the dedicated
`low-profile-correction/` frames own the exposed low-wall construction.

Before editing a master, open the five owner-approved targeted wall sheets listed in
`docs/reference/README.md`. The corners-and-ends sheet is the cardinal orientation map; the
high-oblique/directional sheets govern surface exposure; the module-family and long-run sheets govern required
pieces and continuity. The current SVG is not a substitute reference for a visually rejected result.

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
- horizontal north/south room-edge runs read flat/front-on with a narrow top reveal;
- vertical east/west room-edge runs expose the broader, flatter-from-above top/side plane;
- directional plane treatment is independent of full/low profile height, so one axis must not be
  manufactured by transposing the other;
- exposed low walls use the 38-unit outer profile (`82..120`);
- full walls use one continuous 64-unit outer envelope (`56..120`);
- north/west full cases and south/east low transitions are explicitly authored;
- open thresholds remain flat and visually walkable;
- no raised floor plinth and no baked directional cast shadow;
- charcoal contour/recess `#252A28`;
- aged cream shell `#D9D0B9`;
- deep green base `#294B3C`;
- oxidized teal field/glass family `#4E7D79` / `#83A9A6`;
- restrained coral hardware `#B65F4D`;
- functional metal `#979A91`.

For every composed full/profile frame:

- only the exterior silhouette receives the strong charcoal contour;
- no base cap-light, service seam, or upper bottom outline may survive at the
  internal `base`/`upper` handoff;
- coral meets the lower green face as a material boundary, not as a second ledge;
- a full-to-low upper stops at the profile change while the base/coping continues
  through the outgoing low-wall socket; and
- compatible edge occupancy and band endpoints remain continuous across authored
  N/E and W/S junction pairs, while each axis retains its distinct plane geometry.

All visible paths live under `detail/*` groups because the charcoal contour is
authored explicitly and every component must compile without gaining a second
automatic silhouette. White/black opacity layers are neutral face cues only.
Terrarium owns this source art and any later palette-mask evidence. Unity owns
composition, cutaways, sorting application, lighting, and production acceptance.

Do not expand this directory to the complete 47-blob/profile/opening family until
the unified-envelope gate is owner-reviewed. Do not derive a contract or schema
change from these source files alone.
