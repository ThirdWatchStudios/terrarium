# Character Silhouette Recraft

Status: **review-only pawn-plus proof v2 + Bell/Pinch decision proof v2.1 +
six-body compatibility gate v3 + locked always-on-arm decision v3.1 +
neutral-arm revision proof v3.2**

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

The five body envelopes are construction primitives, not personality or gender
labels:

- **Column** — near-parallel flanks and a tight base.
- **Block** — a low shoulder shelf and broad continuous base.
- **Wedge** — a wide shoulder slope converging on a narrow base.
- **Barrel** — fullness concentrated at the middle.
- **Bell** — a small shoulder line opening into a low outward mass.

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
