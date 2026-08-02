# Character Silhouette Recraft

Status: **review-only pawn-plus proof v2 + Bell/Pinch decision proof v2.1 +
six-body compatibility gate v3 + locked always-on-arm decision v3.1 +
neutral-arm revision proof v3.2 + head silhouette/body-air direction proof v4 +
hair/head fit and profile correction proof v5.1**

Production restart summary:
[character-redesign-production-handoff.md](character-redesign-production-handoff.md).

This slice reopens the visual approval of the current human silhouette
vocabulary. It does not replace production SVGs, change the character recipe
contract, add part IDs, alter the compositor, or expand the runtime animation
model.

## Decision from v1

The v1 articulated-body proof is a rejected extreme. Separate legs, feet,
resting arms, and joint gaps created useful silhouettes, but also implied a gait
system and a much larger authored-animation burden.

The RimWorld-style lesson is narrower: identity can be combinatorial. A few
strong body envelopes and rigid head-envelope anchors can create visibly
different people without giving every person bespoke anatomy.

QuotaCo should repeat. People should interrupt the repetition.

## Animation budget lock

1. **One grounded body mass.** Every body remains a single continuous hull with
   no legs, feet, knee gaps, or authored gait states.
2. **Generated arms, not body-authored limbs.** Every full-body rigged
   character includes generated arms. When no explicit pose is supplied,
   `neutral` is the intended fallback; an explicit pose replaces that arm
   configuration rather than introducing arms. The body remains one static
   hull.
3. **Rigid head attachments.** Hair and facial hair move with `headCenter`.
   They add no joints, secondary motion, or facing transitions.
4. **Existing directional model.** South, east, and north remain the authored
   facings; west remains the mirrored east rendering.
5. **No runtime expansion.** This direction adds zero animation frames, zero
   bones, and zero renderer states. It changes static part art and anchor
   placement only.

The v2 proof explicitly renders both `neutral` and `walk-approach` through the
production compositor. These are held sprite states, not a frame animation.
The v3 compatibility gate extends the provisional six-body set across all 15
poses, south/east/north plus mirrored west, all 12 compatible garment builders,
five hand accessories, and all three built-in style presets. It remains
review-only and does not exercise a true sixth production ID.

## Static silhouette vocabulary

The six body envelopes are construction primitives, not personality or gender
labels:

- **Column** — near-parallel flanks and a tight base.
- **Block** — a low shoulder shelf and broad continuous base.
- **Wedge** — a wide shoulder slope converging on a narrow base.
- **Barrel** — fullness concentrated at the middle.
- **Bell** — a small shoulder line opening into a low outward mass.
- **Pinch** — a moderate shoulder and rounded lower mass interrupted by a
  shallow waist return.

The six combined recipes test orthogonal head-envelope anchors:

- **Wide Cap** — smooth low lateral reach over Block.
- **Twin Mass** — two ear-line lobes over Column.
- **High Crown** — a stacked vertical crown over Bell.
- **Jaw Drop** — a quiet crown and rigid beard over Wedge.
- **Crest** — one vertical interruption over the same Column used by Twin Mass.
- **Cloud** — a broad scalloped crown over Barrel.

The repeated Column pair is deliberate. If Twin Mass and Crest remain distinct,
the system is demonstrating reusable combinatorics rather than six bespoke
bodies.

## Focused Bell → Pinch question

The v2.1 sheet compares two honest outcomes: evolve `body-soft` and remain at
five foundations, or retain Bell's lower-heavy axis and add Pinch as a sixth
static foundation.

- **Bell** supplies a lower-heavy mass, but its contour widens monotonically and
  can read as an A-line garment rather than a body rhythm.
- **Pinch** retains the moderate shoulder and rounded lower mass while adding a
  shallow waist return, rounded hip, and narrower continuous base.
- Pinch is shown with High Crown and with a rigid beard. The same High Crown is
  also shown on Barrel. This tests presentation as a combination of independent
  axes rather than treating one body as female-only.

Pinch remains a candidate, not an approved replacement or addition. Bell and
Pinch are deliberately compared body-only at 40 pixels because a high overlap
score can still hide a meaningful local contour difference. The focused proof
samples south/east and neutral/walk only; the other 13 poses, north facing, and
fitted-garment clearance are covered by the separate v3 compatibility gate.

## Minimum direction lock

1. **Combined identity.** A recipe must remain identifiable as one flat black
   silhouette with palette, face, outfit detail, name, and props removed.
2. **Orthogonal anchors.** Body mass, crown height, lateral reach, rear
   asymmetry, jaw depth, and contour rhythm should combine without assigning a
   job, personality, or emotional state.
3. **Upper-body responsibility.** At least five of the six recipes must remain
   reacquirable after desk-height occlusion.
4. **Pose stability.** South/east and neutral/walk renders must read as the same
   identity; a pose cannot be the identity.
5. **Controlled exaggeration.** Shapes may be emphatic at 40 pixels without
   becoming joke anatomy, role stereotypes, or different art styles.
6. **Gameplay-scale truth.** Review literal 40-pixel blind rows and 48–56-pixel
   figures in a compact room.

## Pass gate

The direction may advance only when:

- all six recipes can be matched across south and east views without labels;
- all six remain distinguishable across neutral and walk-arm states at 40
  pixels;
- at least five remain distinguishable when the lower body is hidden by a
  workstation;
- Twin Mass and Crest remain distinct despite sharing the exact same body;
- the set reads as one population and the user accepts the composed visual
  mass.

Passing scripts, builds, or raster checks cannot promote this proof.

## Proof artifacts

Generate the current review sheets with:

```bash
npx tsx scripts/characterPawnPlusPreview.ts
```

The script temporarily installs the candidates in the registered production
parts, renders them through the real compositor, restores the original object
references in `finally`, and requires a byte-identical sentinel render after
restoration. It writes the v2 system sheets:

- `docs/previews/character-pawn-plus-v2.svg`
- `docs/previews/character-pawn-plus-v2.png`
- `docs/previews/character-pawn-plus-room-v2.svg`
- `docs/previews/character-pawn-plus-room-v2.png`
- `docs/previews/character-pawn-plus-v2-metrics.json`

It also writes the focused v2.1 Bell/Pinch decision artifacts:

- `docs/previews/character-body-pinch-v2-1.svg`
- `docs/previews/character-body-pinch-v2-1.png`
- `docs/previews/character-body-pinch-v2-1-metrics.json`

The v1 articulated proof remains available as a rejected comparison:

- `docs/previews/character-silhouette-recraft-v1.png`
- `docs/previews/character-silhouette-room-v1.png`

The raster metric records pairwise silhouette overlap at a literal 40-pixel
canvas. It can catch another scaled-capsule collapse, but it cannot substitute
for visual review.

## Six-body compatibility gate

Generate the compatibility and failure sheets with:

```bash
npx tsx scripts/characterBodyCompatibilityPreview.ts
```

The script installs one candidate at a time on its proof carrier, captures the
compositor output, and restores the exact production references in `finally`.
This sequential pass allows Bell and Pinch to remain separate review bodies
despite both using `body-soft` as a process-local carrier.

The current gate writes:

- `docs/previews/character-body-compatibility-v3.svg`
- `docs/previews/character-body-compatibility-v3.png`
- `docs/previews/character-body-garment-failures-v3.svg`
- `docs/previews/character-body-garment-failures-v3.png`
- `docs/previews/character-body-compatibility-v3-metrics.json`

Observed mechanical result:

- 360 pose/facing states publish finite wrists and valid carry policy;
- 12,960 garment renders and 5,400 held-accessory renders are deterministic,
  token-clean, and canvas-safe;
- fitted-detail paint remains inside all six candidate hulls and Dress expands
  every source facing;
- none of the 675 same-pose/facing body pairs collapse to identical 40-pixel
  silhouettes;
- Bell/Pinch remains the closest pair: `notice` south/north reaches `0.951`
  intersection-over-union with 22 differing pixels.

Passing this gate does not promote the bodies. Pinch still needs a true
production body ID and an explicit Dress profile; authored body-detail variants
must be regenerated against the approved hulls during promotion.

## Always-on-arm decision proof

The v3.1 proof tests the model rule without changing production behavior:
explicit `neutral` renders stand in for the proposed unposed default. The
current armless render remains beside it only as a diagnostic control.

Generate the two sheets with:

```bash
npx tsx scripts/characterAlwaysOnArmsPreview.ts
```

The proof writes:

- `docs/previews/character-always-on-arms-v3-1.svg`
- `docs/previews/character-always-on-arms-v3-1.png`
- `docs/previews/character-always-on-arms-room-v3-1.svg`
- `docs/previews/character-always-on-arms-room-v3-1.png`
- `docs/previews/character-always-on-arms-v3-1-metrics.json`

The current renderer exposes a real continuity gap: an unposed rigged
character already places held props at the published neutral wrists, but it
does not render the connecting arms. Resolving the existing neutral
configuration as the full-body fallback closes that gap and adds zero
animation frames, bones, poses, or renderer states.

Observed v3.1 result:

- the neutral arm layer renders deterministically in all 48
  body/facing/40-or-48-pixel checks and never removes body silhouette pixels;
- it expands the silhouette in 24 of 48 checks, covering every south and north
  case, but remains wholly inside the torso hull in every east and west case;
- all 144 garment/prop/style stress renders are deterministic, geometrically
  valid, token-clean, and clear the canvas edge by at least one pixel at the
  literal 40-pixel gate;
- the 12-character crowd and held-prop comparison preserve wrist placement,
  and the proposed fallback visibly connects the currently floating mug,
  clipboard, and coffee-tray attachments;
- no body pair becomes pixel-identical, but Bell/Pinch reaches `0.943`
  intersection-over-union in south and north, up from `0.880` without arms.
  The neutral arms are filling much of the waist distinction that justified
  keeping both bodies.

The model rule is locked following v3.1 review: arms are mandatory full-body
output and poses only change their configuration. The v3.1 review initially
held the current neutral geometry because it did not add a profile cue. That
hold is superseded by v3.3: a recoverable east/west arm silhouette is not a
requirement.

Production promotion also needs an explicit surface decision. Base and mood
sheets, employee sprites, operational-unit bases, portraits, layer atlases,
scene previews, and runtime consumers currently rely on the unposed path. Arm
color layers and their outline must be added to the layer atlas atomically;
changing the flat compositor alone would create incomplete reconstructed
sprites. This v3.1 slice changes none of those production surfaces.

## Neutral-arm geometry revision — rejected v3.2 experiment

The v3.2 proof keeps the mandatory-arm rule fixed and auditions only the
generated neutral geometry. It compares:

- **Current hanging** — the v3.1 control: neutral-looking from the front, but
  profile-hidden and waist-filling.
- **Tucked cuff** — a shorter eight-unit forearm that clears the metrics but
  reads too much like a held shrug at crowd scale.
- **Outboard hang** — the then-selected review candidate: the existing 11-unit
  arm weight with neutral-only, body-aware starts and wrists. It keeps the hand
  low, moves the profile sleeve outside the torso, and does not alter the shared
  body anchors consumed by the other 14 poses.

The same generator additionally writes:

- `docs/previews/character-always-on-arms-revision-v3-2.svg`
- `docs/previews/character-always-on-arms-revision-v3-2.png`
- `docs/previews/character-always-on-arms-context-v3-2.svg`
- `docs/previews/character-always-on-arms-context-v3-2.png`
- `docs/previews/character-always-on-arms-revision-v3-2-metrics.json`

Observed v3.2 result for Outboard hang:

- all 12 authored east body/scale checks and all 12 west-mirror raster checks
  add a recoverable external arm cue; the minimum contribution is 10 pixels at
  40 pixels and 13 pixels at 48;
- Bell/Pinch south falls below the `0.93` watch at both sizes: `0.893` at 40
  pixels and `0.908` at 48;
- none of the 60 selected-neutral body/facing pairs collapse, and the maximum
  selected overlap is `0.920`;
- all 72 selected garment/prop/style stress renders are deterministic and
  token-clean, with no canvas-edge contact and a minimum one-pixel transparent
  margin at the 40-pixel gate;
- the same 12-character crowd keeps the lower neutral-arm read, and mug,
  clipboard, tray, paper, and watch placement follows the revised wrist
  metadata through the real compositor;
- the temporary proof pose is removed after every render, its current-control
  output matches production neutral byte-for-byte, and the production neutral
  sentinel is restored byte-for-byte.

Outboard hang was selected for visual review, not promoted. It was rejected on
that review: the one-sided east/west protrusion reads as though the other arm
disappeared. Its passing profile-pixel and Bell/Pinch metrics are archived
evidence for a rejected experiment, not promotion evidence. The v3.2 proof
changed no production pose generator, default routing, layer atlas, portrait,
export, or runtime animation behavior.

## Neutral-arm fallback correction

The v3.3 correction selects the existing close hanging neutral and changes the
acceptance policy rather than forcing a profile silhouette cue:

- every full-body rigged character has generated neutral-arm geometry as its
  fallback;
- south and north author two sleeve paths, two hands, and left/right wrist
  metadata; east authors the overlapping profile arm and right wrist, with west
  supplied by the real mirror path;
- east/west neutral arms may remain wholly inside the body silhouette. An
  occluded arm is not an absent arm, and profile distinction belongs primarily
  to the body and hair hull;
- explicit action poses may move arms outside the hull when the action calls for
  it;
- the fallback adds no pose, renderer state, animation frame, or bone.

The generator additionally writes:

- `docs/previews/character-neutral-arm-fallback-v3-3.svg`
- `docs/previews/character-neutral-arm-fallback-v3-3.png`
- `docs/previews/character-neutral-arm-fallback-context-v3-3.svg`
- `docs/previews/character-neutral-arm-fallback-context-v3-3.png`
- `docs/previews/character-neutral-arm-fallback-v3-3-metrics.json`

Observed v3.3 result for Close hanging:

- all 18 authored arm-model checks contain the expected sleeve/hand geometry,
  finite wrist metadata, and matching paths in the real compositor output;
- all 24 proof body/facing renders match the production explicit-neutral output
  byte-for-byte;
- all 24 east/west 40-or-48-pixel comparisons add zero pixels to the exterior
  silhouette, which is permitted for this close hanging neutral but is not a
  requirement for future neutral geometry;
- Bell/Pinch south overlap remains diagnostic rather than a profile gate:
  `0.943` at 40 pixels and `0.950` at 48;
- none of the 60 selected-neutral body/facing pairs collapse to an identical
  40-pixel silhouette;
- all 72 garment/prop/style raster-integrity renders are deterministic and
  token-clean, avoid the canvas edge, and retain at least one transparent pixel
  of margin;
- the temporary proof pose is removed after every render and the production
  neutral sentinel is restored byte-for-byte.

This correction locks the fallback and permitted-profile-occlusion policy only.
Default routing, layer-atlas sleeve/hand/outline rows, portrait policy, export
surfaces, and runtime uptake remain a separate production promotion gate.

## Head silhouette and body-air direction proof — review-only v4

The v4 proof reopens two static head decisions without reopening the animation
model:

1. **Stronger lower-face anchors.** Hair hides much of the crown, so the six
   review hulls put their distinction into width, cheek, jaw, and chin:
   **Round**, **Broad**, **Long**, **Block**, **Point**, and **Lantern**.
2. **A deliberate head/body air datum.** The neutral hair-none render targets
   at least one fully transparent outline-to-outline raster row at both literal
   40 and 48 pixels.

The head remains one rigid group. Head art, eyes, hair, face accessories, and
mood overlays still share `headCenter`; north is authored and west remains the
real mirrored east. Each accepted body candidate owns one south/north and one
east/west vertical placement, so the six heads do not require bespoke pose art
or per-recipe animation.

The current 128-unit cell is vertically tight after separation. The proof
therefore includes a fixed five-unit bake-time view-box reframe. It is a static
crop policy, not a runtime state. High-crown hair remains an explicit fitting
sentinel: long or low hair may bridge the head/body air by construction, while
hair that reaches the top of the cell may need a later static recut.

The neutral gap is a datum, not a promise that every posture remains
disconnected. `slump` deliberately drops the existing rigid head group by
seven source units and may close it; the tilt poses continue to pivot around
the existing neck. Preserving whitespace through every pose would be a
different and rejected scope.

Generate the two review sheets with:

```bash
npx tsx scripts/characterHeadGapPreview.ts
```

The generator writes:

- `docs/previews/character-head-gap-v4.svg`
- `docs/previews/character-head-gap-v4.png`
- `docs/previews/character-head-gap-context-v4.svg`
- `docs/previews/character-head-gap-context-v4.png`
- `docs/previews/character-head-gap-v4-metrics.json`

The script swaps candidate head facings through the registered imported-art
carrier, installs one body rig at a time, and restores both exact references in
`finally`. It requires byte-identical neutral, transformed-pose, and portrait
sentinels after restoration.

Current mechanical observations:

- the closest current 40-pixel head-only pair reaches roughly `0.99`
  intersection-over-union; the stronger proposed set lowers the closest pair
  to roughly `0.92`;
- all six heads use a common chin band, allowing each body to publish one
  shared head datum rather than a head-specific offset;
- the selected neutral hair-none system holds at least one transparent row at
  both 40 and 48 pixels across six bodies, six heads, and all four facings;
- the paired hair sentinels keep the deferred fitting debt visible: Bun and
  Coils touch the cell edge in some body/facing combinations, while long or
  low hair may intentionally bridge the air;
- the default and corporate-cold styles remain in-cell, while the
  `headScale: 1.12` / four-unit per-part outline of the high-contrast preset
  still exceeds this proof crop. Profile `recoil` also remains a promotion
  framing check for some wide heads;
- all animation-cost counters remain zero: no frames, bones, pose IDs,
  renderer states, or authored west facings are added.

These are diagnostic results only. Visual review of the composed 40-pixel
population remains the approval gate. Production promotion would still need
the chosen authored head SVGs, an explicit crop policy, hair fitting, portrait
and atlas checks, and the separately deferred neutral-arm runtime uptake.

Production resolution (2026-07-27): the six head hulls and static framing were
promoted, then the head datum was lowered three source units after composed
review found the initial one-row target too detached. The final gate preserves
4–8 clear pixels between the filled head and torso silhouettes at 128 px while
allowing expanded outlines to kiss at 40/48 px. The original v4 observations
above remain historical evidence rather than the current production spacing.

## Hair/head fit and profile correction — review-only v5.1

The first v5 render established six outer-mass ideas but is rejected as a fit
proof. It sized every hairstyle around the Round head and reused front-like
caps for several east facings. The result varied hair internally while making
Broad hair too small, Long hair too large, and many side views read as
front-facing.

The v5.1 correction keeps the zero-animation scope and changes the static
construction:

- every head publishes a review-only hair-fit envelope: south/north crown half
  width, crown height, east rear-skull reach, and east forehead stop;
- each hair family is generated from that envelope, so the same family widens
  for Broad and narrows for Long without becoming a different hairstyle;
- east faces screen-right. Hair must stop before the forehead/cheek/nose and
  place its rear mass on screen-left; west remains the real mirrored east;
- Bob is split into a rear curtain and narrow front strand so its face opening
  remains visible rather than becoming a filled front-view oval;
- the centered high Crown is replaced by **Knot**, an offset upper-rear mass
  that interrupts the silhouette without requiring a taller cell.

The six corrected construction families are:

- **Crop** — a tight, broken cap;
- **Sweep** — a one-sided diagonal mass;
- **Bob** — smooth jaw-level width with an open profile face;
- **Knot** — an offset compact upper-rear knot;
- **Tail** — a held rear directional drop;
- **Cloud** — a broad scalloped halo.

These labels describe construction, not personality or gender. Every candidate
is rigid art in the existing head group, uses authored south/east/north
facings, and inherits the real west mirror. Tail does not receive secondary
motion.

Four styles preserve the neutral head/body air datum. Bob and Tail may bridge
laterally by construction: their side or rear mass can meet the body while the
face and central head separation remain readable. A bridge is a static
silhouette choice, not another renderer or pose state.

Generate the three review sheets with:

```bash
npx tsx scripts/characterHairSilhouettePreview.ts
```

The generator writes:

- `docs/previews/character-hair-silhouette-v5.svg`
- `docs/previews/character-hair-silhouette-v5.png`
- `docs/previews/character-hair-silhouette-context-v5.svg`
- `docs/previews/character-hair-silhouette-context-v5.png`
- `docs/previews/character-hair-fit-matrix-v5-1.svg`
- `docs/previews/character-hair-fit-matrix-v5-1.png`
- `docs/previews/character-hair-silhouette-v5-metrics.json`

The script temporarily installs each candidate through one registered hair
carrier and restores the production facing reference in `finally`. Neutral,
transformed-pose, portrait, carrier-facing, and production-part sentinels must
remain byte-identical after the sweep.

Current mechanical observations:

- for the same Round head and Block body at literal 40 pixels, the closest
  external-hair overlap falls from `1.000` among the six current analogs to
  `0.683` among the corrected fitted anchors;
- all 72 hair/head/facing comparisons at 40 and 48 pixels stay below the
  `0.82` south/east hair-overlap gate; the closest corrected pair is
  Knot/Long at `0.766`;
- the forward 45 percent of every east head retains at least `0.382` of its
  bare skin pixels, keeping a readable forehead, cheek, and nose;
- every family adapts measurably from Broad to Long: south hair width changes
  by 9–12 pixels and east hair width changes by 5–8 pixels at 48 pixels;
- the 576 neutral body/head stress renders cover all six bodies, all six heads,
  four facings, and both 40 and 48 pixels with zero candidate cell-edge
  findings;
- all required air-preserving cases retain at least one central transparent
  raster row; Bob and Tail are audited under their explicit bridge policy;
- the 360 existing-pose renders add zero hair contacts at the cell edge. Six
  east/west `recoil` cases retain a body-foot edge contact already present in
  the corresponding hairless render;
- the current tall Bun remains visible as a height-debt control. A genuinely
  tall style still needs a later static recut or framing decision rather than
  quietly expanding the animation scope;
- all animation-cost counters remain zero: no frames, bones, pose IDs,
  renderer states, secondary-motion systems, or authored west facings are
  added.

This is a review-only correction. Production promotion must decide whether the
head-fit envelopes bake concrete hair/head variants or become static authoring
metadata. Production hair SVGs, part IDs, portraits, atlases, exports,
compositor behavior, and runtime animation remain unchanged until that separate
step.

Production resolution (2026-07-27): the first bounded carrier slice selected
Short/Crop, Bob, and Ponytail/Tail. Their stable `hair-short`, `hair-bob`, and
`hair-ponytail` recipe IDs now resolve fixed variants for all six production
heads and south/east/north during Terrarium composition/export. Flat and
reconstructable layer output share the resolver; Unity receives ordinary baked
art with no fit metadata, schema change, bones, new poses, or secondary motion.
At that promotion point, the canonical imported SVGs remained source/fallback
geometry. The remaining seven mapped hairstyles retained their prior static
facings until they passed the same fitted proof. See
`docs/previews/character-hair-fitting-pilot-v1.png` and its metrics JSON for
the promoted matrix, literal 40/48 px audit, desk check, and crowd check.

Production completion (2026-07-27): Pixie, Side-part/Sweep, Bun/Knot, Curly,
Coils, Long straight, and Balding now join that same resolver for all six
production heads and three authored facings. The original three-carrier variant
digest remains byte-identical. A new 336-cell 40/48 px audit reports zero
missing hair and zero hair edge contacts; every fitted style pair remains
distinct at 32 px across south/east/north. The recut reduces the 4,320-cell
top-overflow debt from the pre-fitting 766 cases to 467 high-contrast-only
cases, with no non-top overflow. See
`docs/previews/character-hair-fitting-completion-v2.png` and its metrics JSON.

Canonical-source follow-up (2026-08-02): Bob and Short are now the first two
fitted styles whose three SVG facings own live production geometry. The importer
applies their visually approved bounded landmark warps and emits all 18
head/facing variants per style; the resolver consumes those generated records
and both former path builders are removed. Ponytail and the seven completion
styles retain their accepted code-owned fits until migrated one style at a time.
