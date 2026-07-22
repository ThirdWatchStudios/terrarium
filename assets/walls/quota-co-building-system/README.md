# QuotaCo Building System — authored B pilot

This directory is the editable SVG authority for the A1 technical-split geometry
pilot from `docs/quota-co-high-oblique-geometry-ask.md`. It contains only the
nine approved comparison cases, each divided into `base` and `upper` source
components. The base is drawn first; the upper is composited at the same centered
grid pivot. The composed frame—not either component alone—is the visual product.

**Promoted ordinary-wall decision (owner approval, 2026-07-21):** every placed
ordinary structural wall occupies the full 64-unit outer profile in its cell.
South is the exact `full_n_straight-base.svg` +
`full_n_straight-upper.svg` composed source, with the same centered pivot and no
transform, duplicated south SVG, or new frame identity. The equal-height
southwest corner is the promoted `transition_w_to_s` pair: it keeps the existing
stem id while replacing the former low exit. Southeast is promoted as an exact
X-mirrored reuse of that pair, with its source-side boundary ticks omitted so
the adjoining south cell owns the single service seam. This adds no southeast
SVG or frame identity. East and northeast are owner-accepted mirror/reuse
contracts that remain unregistered. Low-wall art is no longer an ordinary
perimeter/cutaway family and may only return as a separately approved
internal-partition product.

**Accepted composition gate (owner approval, 2026-07-21):** these contracts pass
together as a 3×8 equal-height perimeter around a 1×6 clear aisle at 90 and
40 px per cell. The 18 occupied cells use accepted sources/reuse only; the
one-cell horizontal bodies remain legible, six-cell side runs remain parallel,
and all four corners close as one enclosure.

**Accepted mapping gate (owner approval, 2026-07-21):** the proof-layer ledger
locks the unchanged canonical `mask_0` through `mask_46` order and classifies
four direct reuses, six approved derivations, 36 synthetic assembly
candidates, and one explicit authored-geometry gap. This accepts the mapping
structure and provenance boundaries only. It does not accept the 36 synthetic
assembly diagrams, resolve isolated `mask_0`, or create an atlas/production family.

**Accepted horizontal terminus gate (owner approval, 2026-07-21):** `mask_8`
directly reuses the socket-polished `full_terminus` pair (connected west, cap
east), and `mask_2` reuses that same pair through the accepted whole-cell X
mirror (connected east, cap west). The first 96 source units match the accepted
horizontal body in base, upper, and composed layers; the local molded cap stays
intact. The horizontal gate does not rotate this source into vertical facings;
those directions are owned by the separate accepted vertical gate below.

**Accepted vertical terminus gate (owner approval, 2026-07-21):** the two vertical directions use an external,
proof-layer source bank at `../quota-co-building-system-proofs/vertical-terminus/`. Both accepted ends stay inside the ordinary wall
cross-section and fold its existing cream, coral, and green registers through shallow, separately authored
south- and north-facing rollovers. Their east-wall whole-cell X mirrors are accepted derivations. These files
remain intentionally absent from this strict canonical inventory, while proof-ledger rows `mask_1` and `mask_4`
record their accepted provenance. Isolated `mask_0` is now the only authored-geometry gap.

The original independently finished low-base-plus-optional-upper construction was
rejected on 2026-07-20 because its duplicate caps and contours read as one wall
placed on another. The files remain split only where their paths can contribute
complementary surfaces to one continuous wall envelope. Root `base` components
are lower-face/plinth ingredients, not standalone low walls; the dedicated
`low-profile-correction/` frames preserve the former exposed-low construction as
deterministic comparison evidence, not the current ordinary-wall target.

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
- `transition_w_to_s` — promoted equal-height southwest source and southeast mirror provenance
- `door_closed`
- `door_open`
- `window_wide`

The 18 SVGs use a strict `0 0 128 128` canvas. Paths that meet a canvas edge are
intentional connected-wall seams; any future production assembler owns clipped
overdraw. Do not rotate a directional frame to manufacture another facing.

## Art contract

- fixed orthographic high-oblique/top-down-plus over the rectangular grid;
- every ordinary structural wall cell uses one continuous 64-unit profile: the
  accepted north/south and west source spans run `56..120`, while the accepted
  whole-cell east mirror maps its X span to `8..72` without changing its size;
- horizontal north/south room-edge runs read flat/front-on with a narrow top reveal;
- vertical east/west room-edge runs expose the broader, flatter-from-above top/side plane;
- north and south use the exact `full_n_straight` base/upper pair with no transform
  or duplicate south master;
- west is the accepted full-height vertical source; east is accepted as reuse of
  that pair through a whole-cell mirror around `x=64` (`x' = 128 - x`). This is
  an owner-approved art contract, not a registered source/runtime transform;
- the former 38-unit low profile (`82..120`), local low-east mirror, and full-to-low
  turn survive only in historical/reference evidence. Any future low partition
  must be a separately named catalog family, never an ordinary perimeter wall;
- the southwest corner preserves exact full-west and shared full-north/south
  sockets; its south material stack owns the foreground heel;
- southeast reuses the southwest pair through a whole-cell X mirror around
  `x=64`; omit only `base-boundary-seam` and `upper-boundary-seam` so the
  adjoining south cell owns one service seam, while both sockets and the south
  foreground wrap remain exact;
- open thresholds remain flat and visually walkable;
- no raised floor plinth and no baked directional cast shadow;
- charcoal contour/recess `#252A28`;
- aged cream shell `#D9D0B9`;
- deep green base `#294B3C`;
- oxidized teal field/glass family `#4E7D79` / `#83A9A6`;
- restrained coral hardware `#B65F4D`;
- functional metal `#979A91`.

For every composed ordinary full-height frame:

- only the exterior silhouette receives the strong charcoal contour;
- no base cap-light, service seam, or upper bottom outline may survive at the
  internal `base`/`upper` handoff;
- coral meets the lower green face as a material boundary, not as a second ledge;
- compatible edge occupancy and band endpoints remain continuous through every
  full-height straight and corner, while each axis retains its distinct plane
  geometry; and
- legacy full-to-low pieces remain stable only as A/B evidence until an optional
  partition family is separately requested.

All visible paths live under `detail/*` groups because the charcoal contour is
authored explicitly and every component must compile without gaining a second
automatic silhouette. White/black opacity layers are neutral face cues only.
Terrarium owns this source art and any later palette-mask evidence. Unity owns
composition, cutaways, sorting application, lighting, and production acceptance.

Do not expand this directory into a complete 47-blob/opening source family. Mapping and horizontal-terminus
acceptance do not authorize another proof slice, synthetic-candidate promotion, authored topology
propagation, or production files. The earlier low-east, low-southeast, and southwest full-to-low
checkpoint remains historical directional evidence, but its low perimeter profiles and height-step corner
are superseded for ordinary walls. South, east, northeast, southwest,
southeast, and the two horizontal termini are owner-accepted equal-height art
decisions; their source reuse and mirrors remain unregistered. The southeast decision adds
no source stem or production transform. Production registration, frame identity, exporter, `CONTRACT.md`,
schema, committed atlas, and Unity changes remain deferred pending a separate owner decision.
