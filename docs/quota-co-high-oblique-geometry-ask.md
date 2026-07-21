# QuotaCo High-Oblique Geometry — Production Art Ask

**Date:** 2026-07-19 · **Requested by:** The Water Cooler · **Status:** all five current equal-height wall decisions accepted; room/corridor/autotiling gate next

Canonical direction lives in the sim repository:

```text
The-Water-Cooler/docs/design/quota-co-high-oblique-art-direction.md
The-Water-Cooler/docs/design/quota-co-high-oblique-art-migration-plan.md
```

The owner has committed to a fixed **high-oblique / top-down-plus** office in which the manufactured building,
furniture, machines, amenities, and campus fixtures read as coordinated QuotaCo catalog products. The initial
building-geometry ask is now approved at the five-piece directional level. The next proof composes those accepted
pieces at room, corridor, and autotiling joins; prop-catalog and export-contract changes remain separate work.

---

## 1. The question this proof must answer

Can a small transparent geometry family make the office read as a substantial, Selectric-era QuotaCo product
while preserving the current screen-aligned rectangular grid, flat walkable cells, clear employees, and useful
ordinary-gameplay zoom?

This is a production-scale art proof, not another beauty illustration. The sheet must expose whether the forms
work as actual sprites.

## 2. Locked visual contract

- Fixed orthographic high-oblique presentation; no perspective and no diamond/isometric grid.
- **Owner approval, 2026-07-21: every ordinary structural wall occupies its complete non-walkable cell with
  the same full 64-unit profile.** North and south use the exact `full_n_straight` base/upper source pair at
  the same centered pivot; south requires no transform, duplicated SVG, or new frame identity. The intended
  east is a whole-cell X-mirror of the accepted full-west pair around `x=64`; east and northeast are
  owner-accepted mirror contracts that remain unregistered. The promoted `transition_w_to_s` pair is the equal-height southwest
  corner, preserving exact full-west and shared full-north/south sockets. Southeast is promoted as an exact
  X-mirrored derivation of that pair: omit only its two source-side boundary-seam paths so the adjoining south
  cell owns one service seam. This creates no southeast SVG, frame identity, or production registration.
  Low/cutaway perimeter walls are superseded; a low wall may only return as a separately approved
  internal-partition catalog product.
- **Owner clarification, 2026-07-20: wall profile height and directional plane treatment are separate
  axes.** Horizontal east-west runs on the north/south room edges must read visibly flat/front-on, with
  only a narrow top reveal. Vertical north-south runs on the east/west room edges must expose the broader,
  flatter-from-above top/side plane. Do not transpose one axis to manufacture the other; compatible sockets
  may share occupancy and band endpoints while their visible cross-sections remain intentionally different.
- **Legacy low-east checkpoint, 2026-07-21:** the prior 38-unit east source used a local mirror around
  `x=101` inside its `82..120` socket. Preserve that result as comparison evidence only; it does not constrain
  the accepted full-height east whole-cell mirror or authorize a runtime transform.
- **Legacy southern-corner checkpoint, 2026-07-21:** at the former low-southeast
  outer turn and the southwest full-to-low height step, the adjoining east/west top terminates behind the
  shallow south coping. The south cream/coral/green stack wraps the heel; a side-wall top or fascia may not
  overpaint the south front. Carry that wrap/ownership lesson into the new equal-height corners, but do not
  retain the low profile or height step as ordinary perimeter vocabulary.
- **Promoted southwest checkpoint, 2026-07-21:** the canonical `transition_w_to_s` pair is now an
  equal-height full-west-to-full-south molded corner. The south cream/coral/green/plinth stack repaints the
  foreground heel after the west planes terminate, and both 64-unit sockets remain pixel-continuous.
- **Promoted southeast checkpoint, 2026-07-21:** reuse the promoted southwest pair with a whole-cell X mirror
  around `x=64`. The derived facing suppresses `base-boundary-seam` and `upper-boundary-seam`; the adjoining
  south cell owns the remaining service tick. Full-east-to-southeast and full-south-to-southeast sockets are
  pixel-identical, and the south frontage retains foreground ownership. Production delivery remains deferred.
- Shallow south/front and east/side faces are drawn into the art.
- Floors remain visibly flat on the walkable plane—never raised product plinths.
- North, south, east, and west ordinary room edges all use the full-height structural envelope. Agents cannot
  occupy the wall cell, so no low sill/cutaway is needed to preserve play visibility.
- Selectric-era administrative industrial design: substantial molded shells, generous radii, deep recesses,
  stepped bases, thick tactile hardware, visible service seams, and one clear silhouette before detail.
- Core palette: aged cream shells, deep green bases, oxidized teal fields, restrained coral/rust product
  accents, charcoal recesses, and limited functional metal. Geometry should not use capture amber or emotion
  rose.
- Authored face shading may clarify material and volume (top plane lightest, vertical planes darker, recesses
  darkest), but no directional cast shadow is baked into a frame.
- Existing 47-blob connectivity, full-cell wall occupancy, grid coordinates, and stable template identity are
  preserved.

## 3. A1a — proportion and projection strip

Author one neutral QuotaCo Building System family at the normal 128-unit design canvas and existing export
scales. The first review sheet contains only enough pieces to settle depth, height, seams, and profile changes:

| Piece | Minimum proof |
|---|---|
| Flat floor | base field plus one modular seam/inlay treatment |
| Floor transition | straight, corner, and doorway threshold |
| Ordinary structural wall | north/south shared horizontal straight; west straight; accepted mirrored east; equal-height corners and termini |
| Optional low partition | deferred separate catalog family; legacy low sources are comparison evidence only |
| Door | one closed and one open state in a directional opening |
| Window | one wide opening in a full wall; directional cases only where materially different |
| Internal partition | out of the ordinary-wall family unless separately approved |
| Structure | one T-junction/column or service-chase junction |

Try the wall as two visual concerns—a connected low structural base plus an optional upper shell—because that
may preserve the 47-blob topology while giving Unity a clean cutaway seam. Treat this as a pilot hypothesis, not
a permanent contract. If it creates visible double seams, impossible corners, or too many profile states, show
that failure on the review sheet and keep the simpler authored-frame alternative.

**Owner decision, 2026-07-20:** the independently finished base plus optional upper failed this gate: in a
connected room its duplicate cap and lower outline read as one manufactured piece sitting on another. Keep the
two source files only as a technical paint split when their composed pixels form one continuous wall envelope.
Root full-wall bases are lower-face/plinth ingredients, not standalone low walls; dedicated low-profile frames
own the exposed low construction. No topology propagation is authorized until the revised composed envelope is
reviewed at 240/90/40 px and in the room context.

**Superseding owner decision, 2026-07-21:** exposed low construction is no longer part of the ordinary
structural-wall proof. South is accepted as exact north-source reuse; east is accepted as a whole-cell mirror
of west; northeast is accepted as the matching mirrored corner; and southwest and southeast hold accepted
equal-height art contracts. Southeast is a derived facing rather than a duplicate master. All five decisions
remain proof-layer art contracts rather than production registration. Retain the former low/profile files and
review results without treating them as the current production direction.

### A1a review artifact

Produce both:

1. a transparent frame strip/atlas using real exported pixels; and
2. a labeled contact sheet that places those frames at close, normal, and maximum-useful gameplay scale over a
   neutral checker or flat field.

The labeled sheet is presentation only. The actual atlas must have transparent padding and no card frames,
background panel, floor plinth, or concept-art cast shadows.

## 4. A1b — complete connected family, only after A1a approval

After the equal-height straight and corner treatment is approved, extend the chosen construction through the
existing 47-blob wall topology and required opening/junction states. Reuse the promoted north/south source and
the eventually approved west/east relationship where the current blob compiler permits; do not create a
second connectivity system or ordinary-wall profile state.

Required exported evidence:

- deterministic frame IDs;
- declared facing/corner/opening state completeness for the one full-height ordinary-wall family;
- transparent bounds and consistent grid pivots;
- palette-token masks separate from literal outline, recess, fastener, glass, and hardware detail;
- no duplicated or missing topology frames;
- a generated complete-family contact sheet at real export resolution.

This stage may propose metadata needed to identify facing/state. It does not permanently add fields.
Record the smallest backward-compatible shape the real frames require, then review it with the Unity consumer
before changing `CONTRACT.md` or schema versions.

## 5. Readability gates

Reject or revise the sheet if any of these fail:

- a floor reads as raised or blocks the perceived walkable plane;
- full walls do not feel substantial at normal zoom;
- one-, two-, three-, and six-cell ordinary-wall runs change apparent height or expose broken seams;
- a compact room, narrow corridor, or corner-plus-straight composition reads as overlapping strips instead of
  one manufactured enclosure;
- the accepted full-height east mirror changes the pivot, 64-unit envelope, or connected-run sockets;
- doorway state or walkable cell is ambiguous;
- continuous cream/green/teal product bands jump or misalign across compatible frames;
- corners require rotating a fixed-light/high-oblique image into an invalid view;
- the family reads only when enlarged, or internal detail turns to noise at normal zoom;
- baked shading implies a directional sun or duplicates Unity's runtime shadow ownership;
- the QuotaCo provenance depends on labels or readable text instead of form, materials, and construction.

## 6. Contract evidence to capture, not pre-decide

The geometry proof should make these questions concrete:

- Can north/south exact source reuse and the accepted west/east mirror be represented without duplicate frame
  identities or a new ordinary-wall profile field?
- Can the technical base/upper paint split preserve one composed envelope across the topology without
  reintroducing visible joins or creating a state explosion?
- Which coordinate is the grid pivot for each opening/facing family?
- Which visual bounds must Unity know for picking or occlusion diagnostics, if any?
- Can existing `plan | elevation` assets remain untouched while high-oblique dimensional frames opt into a new
  cardinal-facing lookup?

The later prop pilot—not floor tiles—settles the southern ground-contact sort-baseline representation.

## 7. Explicitly out of scope

- Props, furniture, machines, characters, personal clutter, vehicles, or a composed golden room.
- A diamond grid, perspective camera, camera rotation, or revised office coordinates.
- New pathing, placement, footprint, facility, or save semantics.
- A parallel importer or Water-Cooler-specific generator in Terrarium.
- Full catalog recoloring, clinical-drain tuning, or replacing older bundles.
- Animation frames; doors use authored state swaps.

## 8. Handoff

Owner approval of the A1 transparent contact sheet unlocks the minimum product-family prop pilot. Approval of
both unlocks the isolated Unity golden room through the real exporter/importer. Nothing in this ask authorizes a
change to `production.unity`.
