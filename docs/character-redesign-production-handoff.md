# Character Redesign Production Handoff

Status: **design direction locked; bodies, neutral-arm fallback, and heads
promoted; fitted hair and runtime scale remain**

Last design review: **2026-07-27**

This is the restart document for turning the accepted character direction into
production art and runtime behavior. It records the decisions that should survive
the pause, the experiments that were rejected, the remaining implementation
choices, and the gates that must pass before the redesign is considered live.

The detailed experiment chronology remains in
[character-silhouette-recraft.md](character-silhouette-recraft.md). The closest
historical character-proof checkpoint is `5e65144`; the later world-scale
calibration was authored after that checkpoint, so verify the current worktree
instead of assuming every artifact below is committed.

## Scope boundary

The locked direction is being promoted in bounded production slices. As of
2026-07-27, the six accepted body hulls, body-owned anchors, generated
neutral-arm fallback, six redesigned head hulls, tightened head/body separation,
and static production framing are live in Terrarium. Authored SVG sources,
importer/scaffolds, picker/RNG/export registration, per-body Dress dispatch,
flat/layer/unit/portrait routes, external anchors, and atlas pivots agree.
Fitted hair and the Unity renderer scale do not use the new direction yet.

The remaining hair and scale review scripts temporarily install candidates
through real registered parts, render through the production compositor, and
restore the original references. The head-gap proof is now historical evidence
for the promoted sources and anchors; its PNGs no longer describe an
unpromoted candidate.

Prop redesign is a separate future pass. The character scale calibration held
real props at their current authored envelope specifically so that prop work would
not contaminate the character decision.

## Locked direction at a glance

| Layer | Locked decision | Production consequence |
| --- | --- | --- |
| Overall model | Animation-safe pawn-plus: one grounded body hull, a rigid head group, rigid hair, and generated arms | Do not introduce articulated legs, gait bones, hair physics, or bespoke animation sets |
| Bodies | Six construction families: Column, Block, Wedge, Barrel, Bell, and Pinch | Promoted with body-owned sub-anchors and independent `body-pinch` identity |
| Arms | Arms are always part of a rigged full-body model; `neutral` is the fallback and explicit poses replace it | Promoted across flat, layered, unit, employee, crew, scene, and portrait render routes |
| Profile arms | East/west neutral arms may disappear inside the body silhouette | Do not add an outboard arm merely to make the profile show a limb |
| Heads | Round, Broad, Long, Block, Point, and Lantern | Promote authored lower-face distinction while keeping one rigid head transform |
| Head/body air | A close, designed neck break without a detached “floating head” read | Keep filled head and torso silhouettes separate; allow expanded outlines to kiss after gameplay downsampling |
| Hair | Crop, Sweep, Bob, Knot, Tail, and Cloud, fitted to each head envelope | Author true side profiles and either bake fitted variants or carry static fit metadata |
| World scale | **−35% from the current installed character envelope** | Apply a global factor of `0.65`; keep the 128-unit authoring canvas unchanged |
| Props | Deferred to their own redesign pass | Handhelds follow character anchors; furniture, facilities, and decor do not inherit character scale blindly |

## Design objective

The original production set varied color and interior detail while sharing the
same centered head, shoulder rhythm, convex pawn hull, and rounded base. At
gameplay scale, those figures collapsed into the same silhouette.

The redesign moves identity into a small number of multiplicative outer-shape
anchors:

- body mass and contour rhythm;
- cheek, jaw, and chin;
- crown height, lateral reach, and rear hair mass;
- occasional garment outer mass;
- a stable neutral-arm model that does not become the primary identity cue.

The RimWorld reference supplied the combinatorial lesson, not a model to copy.
Always-present arms, stronger body-owned sub-rigs, QuotaCo-specific construction
language, and the existing pose vocabulary keep this system distinct.

The governing art statement is:

> QuotaCo should repeat. People should interrupt the repetition.

## Body vocabulary

The six families are construction primitives, not gender, job, personality, or
class labels.

| Family | Silhouette anchor | Proof carrier | Production note |
| --- | --- | --- | --- |
| Column | Near-parallel flanks and a tight base | `body-tall` | Promoted; stable saved-recipe ID retained |
| Block | Flat shoulder shelf and broad base | `body-compact` | Promoted; stable saved-recipe ID retained |
| Wedge | Wide shoulder slope and narrow base | `body-large-frame` | Promoted; stable saved-recipe ID retained |
| Barrel | Full middle with pinched shoulder and base | `body-balanced` | Promoted; stable saved-recipe ID retained |
| Bell | Small shoulder opening into low outward mass | `body-soft` | Promoted; stable saved-recipe ID retained |
| Pinch | Moderate shoulder, shallow waist, rounded hip | `body-pinch` | Promoted as a new independent selectable ID |

Bell and Pinch provide feminine-leaning options without assigning gender to a
body. Recognition belongs to the complete recipe.

The compatibility proof covered all six families across 15 poses, four rendered
facings, standard and silhouette-changing garments, held accessories, and all
three built-in styles: 18,360 audited renders. Passing that mechanical matrix
does not remove the need for eyes-on crowd review.

### Body production status

- The five existing production IDs retain saved-recipe compatibility while
  carrying the accepted Column, Block, Wedge, Barrel, and Bell art.
- Pinch owns the independent `body-pinch` ID, full facing art, typed body rig,
  picker/RNG/export route, authored scaffolds, and a dedicated Dress profile.
- All six bodies publish neck, head-center, shoulders, chest, waist, hip, hem,
  wrists/hand attachments, and above-head anchors through the existing typed
  rig and pose vocabulary.
- Conforming garments derive from the selected hull; body-detail intake
  pre-expands to all six bodies.
- The promoted body slice passes 11,880 body/outfit/pose/facing/style renders,
  6,480 pose/hand/style renders, fitted-paint containment, authored-source
  parity, deterministic generation, legacy-body byte stability, and reviewed
  production silhouette/Dress sheets. Legacy bodies retain their selection,
  fallback-anchor, and unposed behavior; their shared head IDs intentionally
  receive the promoted head art.

## Arm model and animation budget

The animation constraint is a design lock:

- one continuous grounded body mass;
- no separate legs, feet, knees, or gait states;
- generated arms use the existing shoulder/wrist vocabulary;
- `neutral` is the full-body fallback;
- an explicit pose replaces the neutral arm configuration rather than
  introducing arms;
- hair, facial hair, glasses, and head details remain rigid members of the head
  group;
- south, east, and north are authored; west remains mirrored east;
- this direction adds zero animation frames, bones, pose IDs, renderer states,
  secondary-motion systems, or authored west facings.

The selected neutral geometry is the existing **close hanging** configuration.
South and north contain two arm/hand paths. East contains the overlapping
profile arm and right-hand attachment; west inherits the actual mirror.

An east/west neutral arm may remain completely inside the torso silhouette. That
is accepted occlusion, not a missing model part. Action poses may expose the arm
when the action calls for it.

### Rejected arm direction

The outboard-hang experiment passed several pixel metrics but failed the actual
read. Its one-sided profile protrusion looked like the other arm had disappeared.
Do not revive it to satisfy a profile-pixel target.

### Arm production status

- Omitted pose input resolves to generated `neutral` geometry for every
  body-owned production rig. An explicit pose replaces that geometry wholesale.
- The same fallback flows through base and mood sheets, employee sprites,
  operational-unit renderings, construction/fabrication variants, scenes, and
  conversations because they share the flat compositor.
- Reconstructed/layer-atlas output carries `pose-neutral-front` (and a
  `pose-neutral-back` row if neutral art ever supplies one), split into sleeve
  and hand masks with the unified outline regenerated from the same geometry.
- Corporate portraits deliberately keep the neutral upper sleeves visible in
  their bust crop. They are crops of the identity model, not a separate armless
  drawing.
- Legacy body IDs remain resolvable and retain their fallback anchors, framing,
  and unposed behavior. Their bytes may change when a shared head ID receives
  promoted art. The neutral-arm fallback begins when a recipe uses a body-owned
  production rig.

## Head vocabulary and separation

Hair hides much of the crown, so the accepted heads place distinction in the
lower face:

| Family | Primary anchor |
| --- | --- |
| Round | Circular control |
| Broad | Low lateral reach |
| Long | Narrow vertical pull |
| Block | Parallel cheeks and flat jaw |
| Point | Wide cheek tapering to a real chin |
| Lantern | Narrow crown opening into a broad jaw |

All six heads use one rigid transform group. The body owns the vertical
head-center datum; the head does not require bespoke pose art or per-recipe
animation.

The accepted neutral hairless separation is **one fully transparent
outline-to-outline raster row at both 40 and 48 px**. Two rows felt doll-like;
three felt detached. The gap is a neutral datum, not a promise that every pose
remains disconnected. `slump` may close it, and tilt poses continue to pivot
around the existing neck.

The proof recovered the tight vertical frame with a fixed five-source-unit
view-box shift (`viewBoxY = -5`). Production implements the equivalent static
figure transform only for body-owned production rigs. The contact shadow stays
on its established floor datum. Flat sprites and reconstructable layers carry
the same transform; external anchors and normalized atlas pivots include it.
It is not a runtime state.

### Head production status and debt

- All eighteen canonical south/east/north SVGs are promoted under their stable
  IDs: `head-round` = Round, `head-oval` = Broad, `head-long` = Long,
  `head-boxy` = Block, `head-angular` = Point, and `head-soft-square` =
  Lantern.
- Each production body publishes one tightened head datum shared by all six
  hulls. Relative to the original body anchors, the final lifts are Block 15,
  Barrel 17, Wedge 16, Column 18, Bell 17, and Pinch 17 source units.
- The accepted datum is three source units closer to the torso than the initial
  promotion. Across the complete 144-cell hairless source matrix, filled head
  and torso silhouettes retain 4–8 clear pixels at 128 px. Their expanded
  outlines may kiss at 40/48 px without leaving the cell.
- Corporate portraits use an explicit head-centered crop and do not inherit the
  full-body five-unit frame. Employee crops do, because they crop the full
  framed sprite.
- The high-contrast preset remains bounded debt: its 1.12 head scale and
  four-unit per-part outline exceed the tight frame and can close the raster gap.
  Do not silently shrink the accepted heads to repair that separate style.
- Tall legacy hair remains hair-pass debt. Bun, Long straight, and Coils are the
  clearest crop-pressure sentinels.

## Hair vocabulary and fitting

The accepted static construction families are:

| Family | Primary anchor | Gap policy |
| --- | --- | --- |
| Crop | Tight broken cap | Preserve central air |
| Sweep | One-sided diagonal mass | Preserve central air |
| Bob | Smooth jaw-level width with open profile face | Lateral bridge allowed |
| Knot | Offset compact upper-rear knot | Preserve central air |
| Tail | Rear directional drop | Rear/lateral bridge allowed |
| Cloud | Broad scalloped halo | Preserve central air |

Every head publishes a fit envelope containing south/north crown half-width,
crown height, east rear-skull reach, and east forehead stop. A family widens for
Broad and narrows for Long without becoming a different hairstyle.

For east-facing art, the face points screen-right. Hair must retain visible
forehead, cheek, and nose on the right and carry its rear mass on the left. West
is the real east mirror. Do not reuse a front-facing cap as a side profile.

Bob uses a rear curtain plus a narrow front strand to keep the profile opening
visible. Knot replaced the earlier centered tall crown. Tail remains rigid; it
does not gain physics.

Bob and Tail may touch the body laterally or at the rear while the face and
central head/body separation remain readable. That bridge is a static
silhouette choice, not a pose or renderer state.

### Hair production debt

- Decide whether fit envelopes generate concrete head/hair SVG combinations at
  bake time or become static authoring metadata.
- Promote canonical fitted south/east/north sources and preserve the true
  profile rule.
- Keep tall styles as an explicit framing problem. Do not silently enlarge the
  runtime cell or add motion to accommodate them.
- Perform a later polish pass on individual hair shapes without reopening the
  body, head, arm, or world-scale locks unless a runtime crowd view reveals a
  structural failure.

## World-scale lock

The accepted QuotaCo wall system is the fixed architectural datum. Its ordinary
wall footprint occupies 112 of the 128 source units. The earlier wall proof kept
the old agent scale only to expose the mismatch.

The accepted character scale is:

```text
current installed character frame : 1.55 cells
selected multiplier               : 0.65
selected character frame          : 1.0075 cells (about 1.01)

at the 90 px cell proof:
current frame                      : 139.5 px (about 140)
selected frame                     : 90.675 px (about 91)
```

This is **−35% from the current installed character envelope**. It is not a
35-percent edit to individual body paths.

Keep the 128-unit character authoring canvas and scale the complete composed
character uniformly. Body, head, hair, neutral arms, garments, and handheld
attachments must not receive independent world multipliers.

Literal 40/48 px review remains the far-zoom screen-raster gate. The 1.01-cell
world frame and the 40/48 px screen render answer different questions and both
must pass.

Collision, navigation, selection, interaction reach, and overhead indicators
remain separate runtime concepts. Do not infer their new dimensions from the
visible sprite without checking the Unity contracts.

### Scale implementation debt

- Prefer one pack-wide/global installed agent scale over per-character recipe
  scale.
- Determine whether Unity should apply the `0.65` through renderer transform,
  importer scale/PPU, or another existing world-placement seam.
- Avoid resizing the source SVG paths unless raster inspection proves the
  128-unit bake is inadequate.
- Recheck above-head indicators, selection rings, construction tints, held
  attachments, y-sorting, and desk occlusion after scale changes.
- Validate in the actual game against the accepted 112-wall room and corridor.
  Terrarium proof pixels are design truth; Unity Play Mode is runtime truth.

## Prop boundary

Do not continue the abandoned idea of applying the character multiplier to
every prop.

- Handheld mugs, clipboards, trays, paper, and watches are rig-relative and
  follow the complete character transform.
- Chairs, desks, counters, plants, facilities, and architectural decor will be
  redesigned and calibrated separately.
- Grid occupancy remains distinct from the visible sprite envelope.
- The wall-proof room used schematic desk and plant stand-ins. Those are not a
  production prop-scale contract.
- The scale sheets use real composed props at factor `1.0` as controls. Their
  relationship to the selected smaller character is evidence for the later prop
  redesign, not an accepted prop answer.

## Rejected or superseded directions

Do not restart these without new runtime evidence:

- articulated legs, feet, joint gaps, gait bones, or bespoke animation sets;
- solving identity with palette, facial detail, names, or catalog breadth
  before the outer silhouette works;
- width-scaling one capsule into nominal body variants;
- treating Bell or Pinch as a gender-locked body;
- armless neutral models or props floating at wrists;
- forcing an east/west outboard arm cue;
- using one universal hair cap for every head;
- front-facing hair geometry reused for east/west profiles;
- giving Tail or other hair secondary motion;
- increasing character size to compete with the new walls;
- applying the selected character multiplier blindly to furniture or
  facilities;
- changing export/schema/Unity contracts during review-only proof work.

## Recommended production order

1. **Isolate the work.** Complete for the body slice: the wall checkpoint was
   clean and only character files were changed. Create a character branch
   before committing if this slice is checkpointed.
2. **Ratify IDs and migration mapping.** Body and head mapping complete. Hair
   mapping remains for its own promotion slice.
3. **Promote bodies and body-owned anchors.** Complete for all six bodies,
   including independent Pinch registration and Dress dispatch.
4. **Promote the neutral-arm fallback atomically.** Complete in Terrarium:
   default routing, hand attachments, flat sprites, layer atlases, and every
   shared exported/rendered surface now agree; portraits retain the neutral
   upper sleeves.
5. **Promote heads and the static framing policy.** Complete in Terrarium:
   eighteen authored sources, shared chin band, body-owned head offsets,
   production-only five-unit frame, portrait policy, external anchors, and
   atlas pivots agree.
6. **Promote fitted hair.** Choose bake-time generated variants versus static
   fit metadata, then author true south/east/north sources.
7. **Rebuild garment compatibility.** Regenerate conforming layers and
   body-aware detail kits; author the rare silhouette-changing variants per
   body.
8. **Implement the `0.65` world scale in the actual runtime seam.** Keep source
   geometry fixed and validate anchors/overlays in Unity.
9. **Regenerate and verify all exports.** Base, mood, pose, unit, portrait,
   employee, layer-atlas, construction/fabrication, and any other registered
   character surfaces must agree.
10. **Run the full visual and runtime gates.** Mechanical success cannot
    override a bad crowd, desk, wall, or gameplay-scale read.

## Acceptance gates

### Terrarium visual gates

- literal 64/48/40 px south/east silhouette rows with palette, names, facial
  detail, and props removed;
- north plus real mirrored west checks;
- all six bodies with representative heads and hair;
- neutral versus existing pose states;
- separated filled head/torso silhouettes at source scale, with intentional
  near-touching outlines permitted at 40 and 48 px;
- true east hair profiles with visible forward skin and rear mass;
- desk-height occlusion and held-prop attachment;
- crowded-room reacquisition on light and dark grounds;
- accepted 112-wall room and corridor at the selected `0.65` world scale;
- high-contrast framing and tall-hair sentinels.

### Mechanical and export gates

- body/garment/pose/accessory compatibility matrix;
- deterministic outputs and no unexpected canvas-edge contacts;
- exact part/reference restoration for any remaining proof tools;
- layer-atlas reconstruction parity with flat compositor output;
- portraits and operational-unit renderings included explicitly;
- `npm run build` and the relevant focused/full Vitest suites;
- no snapshot update used to hide a visual regression.

### Unity gates

- correct selected catalog and imported atlas bytes;
- the same representative six-character crowd in a real compact room;
- standing, walking, seated/desk, held-prop, and action-pose states;
- close, normal, and far zoom;
- wall occlusion, y-sort, selection/status overlays, and construction tint;
- collision, pathfinding, interaction, and selection footprints unchanged or
  intentionally recalibrated;
- explicit confirmation that `0.65` is applied exactly once.

## Proof index

### Body direction and compatibility

- [Pawn-plus body sheet](previews/character-pawn-plus-v2.png)
- [Pawn-plus room sheet](previews/character-pawn-plus-room-v2.png)
- [Body compatibility sheet](previews/character-body-compatibility-v3.png)
- [Body compatibility metrics](previews/character-body-compatibility-v3-metrics.json)
- Generator: [`characterPawnPlusPreview.ts`](../scripts/characterPawnPlusPreview.ts)
- Generator: [`characterBodyCompatibilityPreview.ts`](../scripts/characterBodyCompatibilityPreview.ts)

### Arms

- [Always-on-arm model sheet](previews/character-always-on-arms-v3-1.png)
- [Rejected outboard revision sheet](previews/character-always-on-arms-revision-v3-2.png)
- [Selected close-hanging fallback sheet](previews/character-neutral-arm-fallback-v3-3.png)
- [Selected fallback context](previews/character-neutral-arm-fallback-context-v3-3.png)
- [Selected fallback metrics](previews/character-neutral-arm-fallback-v3-3-metrics.json)
- Generator: [`characterAlwaysOnArmsPreview.ts`](../scripts/characterAlwaysOnArmsPreview.ts)

### Heads

- [Head/body-air sheet](previews/character-head-gap-v4.png)
- [Head context sheet](previews/character-head-gap-context-v4.png)
- [Head metrics](previews/character-head-gap-v4-metrics.json)
- [Promoted head source comparison](previews/head-silhouettes-preview.png)
- [Promoted head compatibility sheet](previews/head-silhouettes-compatibility.png)
- [Accepted three-pixel gap tightening](previews/character-head-gap-tightening.png)
- Generator: [`characterHeadGapPreview.ts`](../scripts/characterHeadGapPreview.ts)
- Generator: [`headSilhouettePreview.ts`](../scripts/headSilhouettePreview.ts)
- Generator: [`characterHeadGapTighteningPreview.ts`](../scripts/characterHeadGapTighteningPreview.ts)

### Hair

- [Hair silhouette sheet](previews/character-hair-silhouette-v5.png)
- [Hair context sheet](previews/character-hair-silhouette-context-v5.png)
- [Head/hair fit matrix](previews/character-hair-fit-matrix-v5-1.png)
- [Hair metrics](previews/character-hair-silhouette-v5-metrics.json)
- Generator: [`characterHairSilhouettePreview.ts`](../scripts/characterHairSilhouettePreview.ts)

### World scale

- [Round-one reduction sheet](previews/character-world-scale-calibration-v1.png)
- [Accepted-direction round-two sheet](previews/character-world-scale-calibration-v2.png)
- [Round-two metrics](previews/character-world-scale-calibration-v2-metrics.json)
- Generator: [`characterWorldScaleCalibrationPreview.ts`](../scripts/characterWorldScaleCalibrationPreview.ts)

The round-two sheet compares −25%, **−35%**, and −45%. The accepted direction
is the middle candidate: factor `0.65`, approximately one character frame per
world cell.

## Restart checklist

When production work resumes:

1. Read this document and open the round-two world-scale sheet.
2. Run `git status --short`; do not assume the historical checkpoint describes
   the current worktree.
3. Confirm the accepted 112-wall source is still the installed architectural
   reference.
4. Confirm the production IDs and Unity scale seam before changing art.
5. Start with body IDs and anchors, not hair polish or prop scale.
6. Run raster-heavy proof/test commands sequentially.
7. Keep prop redesign as a separate workstream, using the selected smaller
   character only as its human-scale reference.
