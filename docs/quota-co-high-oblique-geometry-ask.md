# QuotaCo High-Oblique Geometry — Production Art Ask

**Date:** 2026-07-19 · **Requested by:** The Water Cooler · **Status:** ready for A1 visual proof

Canonical direction lives in the sim repository:

```text
The-Water-Cooler/docs/design/quota-co-high-oblique-art-direction.md
The-Water-Cooler/docs/design/quota-co-high-oblique-art-migration-plan.md
```

The owner has committed to a fixed **high-oblique / top-down-plus** office in which the manufactured building,
furniture, machines, amenities, and campus fixtures read as coordinated QuotaCo catalog products. The immediate
ask is the building geometry by itself. Do not compose a room, redraw the prop catalog, or change the export
contract before this sheet is approved.

---

## 1. The question this proof must answer

Can a small transparent geometry family make the office read as a substantial, Selectric-era QuotaCo product
while preserving the current screen-aligned rectangular grid, flat walkable cells, clear employees, and useful
ordinary-gameplay zoom?

This is a production-scale art proof, not another beauty illustration. The sheet must expose whether the forms
work as actual sprites.

## 2. Locked visual contract

- Fixed orthographic high-oblique presentation; no perspective and no diamond/isometric grid.
- **Owner clarification, 2026-07-20: wall profile height and directional plane treatment are separate
  axes.** Horizontal east-west runs on the north/south room edges must read visibly flat/front-on, with
  only a narrow top reveal. Vertical north-south runs on the east/west room edges must expose the broader,
  flatter-from-above top/side plane. Do not transpose one axis to manufacture the other; compatible sockets
  may share occupancy and band endpoints while their visible cross-sections remain intentionally different.
- Shallow south/front and east/side faces are drawn into the art.
- Floors remain visibly flat on the walkable plane—never raised product plinths.
- North and west room edges may carry full-height walls.
- South uses a permanent low sill/cutaway profile; east uses a low profile where practical and leaves any
  conditional fade behavior to Unity.
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
| Full wall | north straight, west straight, exterior corner, terminus |
| Low wall | south straight, east straight, corner, terminus |
| Profile transition | full-to-low in both useful directions |
| Door | one closed and one open state in a directional opening |
| Window | one wide opening in a full wall; one low-profile directional case if materially different |
| Internal partition | low straight and corner |
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

### A1a review artifact

Produce both:

1. a transparent frame strip/atlas using real exported pixels; and
2. a labeled contact sheet that places those frames at close, normal, and maximum-useful gameplay scale over a
   neutral checker or flat field.

The labeled sheet is presentation only. The actual atlas must have transparent padding and no card frames,
background panel, floor plinth, or concept-art cast shadows.

## 4. A1b — complete connected family, only after A1a approval

After the proportions/profile treatment is approved, extend the chosen construction through the existing
47-blob wall topology and the required full/low/opening transitions. Reuse shared authored face pieces where the
current blob compiler permits; do not create a second connectivity system.

Required exported evidence:

- deterministic frame IDs;
- declared full/low/profile/opening state completeness;
- transparent bounds and consistent grid pivots;
- palette-token masks separate from literal outline, recess, fastener, glass, and hardware detail;
- no duplicated or missing topology frames;
- a generated complete-family contact sheet at real export resolution.

This stage may propose metadata needed to identify profile/facing/state. It does not permanently add fields.
Record the smallest backward-compatible shape the real frames require, then review it with the Unity consumer
before changing `CONTRACT.md` or schema versions.

## 5. Readability gates

Reject or revise the sheet if any of these fail:

- a floor reads as raised or blocks the perceived walkable plane;
- full walls do not feel substantial at normal zoom;
- low walls hide the feet or interaction target of an employee standing immediately behind them;
- full-to-low transitions look like broken/missing art rather than designed catalog pieces;
- doorway state or walkable cell is ambiguous;
- continuous cream/green/teal product bands jump or misalign across compatible frames;
- corners require rotating a fixed-light/high-oblique image into an invalid view;
- the family reads only when enlarged, or internal detail turns to noise at normal zoom;
- baked shading implies a directional sun or duplicates Unity's runtime shadow ownership;
- the QuotaCo provenance depends on labels or readable text instead of form, materials, and construction.

## 6. Contract evidence to capture, not pre-decide

The geometry proof should make these questions concrete:

- Is a profile/facing field sufficient, or do full and low shells need distinct stable template IDs?
- Can the technical base/upper paint split preserve one composed envelope across the topology without
  reintroducing visible joins or creating a state explosion?
- Which coordinate is the grid pivot for each opening/profile family?
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
