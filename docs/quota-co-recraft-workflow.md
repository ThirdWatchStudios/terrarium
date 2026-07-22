# QuotaCo kit recraft — workflow and state handoff

> **Status:** working process doc + state ledger, written 2026-07-20 at the end of the first recraft
> session. Read this together with [quota-co-style-bible.md](quota-co-style-bible.md) (the grammar and
> family constants) before touching any master. Authorities, in precedence order: the sim repo's
> `docs/design/quota-co-high-oblique-art-direction.md` (owner-locked) → `docs/quota-co-high-oblique-geometry-ask.md`
> → the kit `assets/walls/quota-co-building-system/README.md` → the style bible → this doc.

## The mission

Recraft the QuotaCo Building System masters to the owner-approved reference (mirrored in
`docs/reference/`) using the ratified family grammar, one piece at a time, each pass judged by the owner
on the live workbench and committed individually with its design rationale.

## The loop (repeat per piece)

1. **Pick the active decision.** When `Review next` is present, choose one unresolved equal-height piece from
   that lane. When every current piece is accepted, follow the named system gate instead of reopening a settled
   piece. The corridor closure, 47-mask mapping structure, and horizontal and vertical terminus families are
   accepted. No geometry proposal is currently active; isolated `mask_0` is the recommended next bounded proof,
   pending owner authorization. Never rotate the accepted horizontal source to manufacture a vertical end. Use composed evidence as
   the issue-finding surface. Historical
   mixed-profile room mocks are archived, not valid targets.
2. **Read before drawing:** the piece's current masters, the five-sheet primary wall target listed in
   `docs/reference/README.md`, the broad geometry and golden-room references, the bible's constants, and any
   already-solved construction that transfers (see ledger below). Start with
   `quota-co-wall-corners-and-ends-study.png` to verify the cardinal asset, then use the long-run orthographic
   and directional-profile sheets for projection. When a sub-kit covers the same ground (e.g.
   `low-profile-correction/`), treat its **geometry** as authoritative only where it agrees with this newer
   owner-approved target.
3. **Recraft in grammar.** Nine paints only, seam registers 0.28/0.35/0.45/0.62, overlay ladder,
   concentric radii with the r4–5 legibility floor, semantic ids, topology-generation vocabulary,
   shading as overlays never tints (recolor law). Edit masters with the file tools, not shell scripts —
   shell edits break the session harness's write tracking.
4. **Judge on the bench:** `npm run style:watch` → http://localhost:5411 (one instance only — the port
   is exclusive). Start with the active proof sheet's isolated piece and socket checks, then its compact/long
   runs and installed room. The accepted horizontal termini, 3×8 corridor, and 47-mask ledger remain system
   context while the next proposed slice is named without implying acceptance. The open page keeps accepted evidence separate from
   unresolved work; old mixed-profile gates and per-stem importer cards stay under `Archived checkpoints` and
   `Compiler diagnostics` so they cannot be mistaken for approval targets.
5. **Iterate on the owner's eye.** Every pass this session was improved by an owner correction —
   present honestly, name residual deltas yourself, and treat "not right yet" as a diagnosis request.
6. **Owner blesses → commit** just that piece's files, message stating the design rationale (see git log
   for the voice). Never bake an unblessed experiment into a baseline commit.

## Transferable constructions and rejected assumptions

> **Owner correction captured 2026-07-20:** the unified-envelope pass fixed duplicate internal caps and
> outlines, but its shared cross-section/exact-transpose assumption is rejected. Only the paint-split,
> opening, terminus, and seam-removal lessons below are transferable unchanged. Directional straight,
> corner, and transition geometry must be reworked under the handoff lock later in this document.

- **Unified straight** (`full_{n,w}_straight`, rejected directional treatment): cap plane 58–64, coral band
  89–98 with 0.10 top-light, green lower face, plinth 117–120, continuous module seams. The root base
  contributes the lower face; the upper contributes the high face. Neither owns a finished internal edge,
  and the composition has no cap-light shelf or charcoal line at the handoff. Preserve that single-envelope
  construction, but do not preserve the same/transposed cap and face proportions on both axes.
- **Window** (8394eb1): cream product-bezel construction (concentric rings), dark venetian blind field +
  rail bar, dark mullion, diagonal glass sheen (the one licensed non-orthogonal mark), contact shade.
- **Door** (175f122): sliding auto-door in a **full-height break** — no wall behind the doorway; banded
  pylon wall-ends ARE the wall; slim track rail + static coral mode lens; state twins share identical
  framing, only leaves differ. Ring paths need opposite-winding hole subpaths.
- **Terminus** (d400a61): the end cap is a **monolithic post to the ground** (never stacked
  base/upper lobes — the "capital B" failure); band wraps the lit end face behind a divider seam.
- **Corners:** the five-sheet target supersedes attempts to infer a corner from the room diagram. Use its
  cardinal orientation map first. Each turn is a tight, continuous molded wall carrying the same cap, band,
  body, and plinth around the joint; no oversized elbow, applied box, panel, or blanket patch. Preserve one cap
  and one outer silhouette while authoring the directional plane change. ⚠ Never naive-mirror or transpose a
  corner to manufacture another facing.
- **Transitions:** the targeted module-family sheet explicitly restores dedicated **height-step** and
  **step-corner** pieces as required product vocabulary. This does not revive the rejected full-width pylon or
  floating capsule. The approved unit is integrated into the wall envelope, occupies only the junction, closes
  the profile change cleanly, and continues cap/band/body/plinth into both connected runs. Preserve socket
  occupancy and authored directional planes; N→E and W→S are not exact-transpose partners.
- **Depth rules:** near-plane features shift down (E-W) or east (N-S); an engaged element that continues
  the wall's bands at the same heights will camouflage — separate by plane values (shaded wall behind,
  clean face, 0.10-lit reveal) or by construction, not by outlines.

## State at handoff (2026-07-20, branch `codex/campus-art-bundles`)

- **Checkpoint:** `9453532` captures the complete pre-integration workbench, source family, generated
  review artifacts, transition iteration, and documentation exactly as they stood before this correction.
- **Active, owner-rejected working pass:** the root nine-stem family now uses one composed envelope;
  straight, corner, window, terminus, and door joins no longer expose an independent base cap or upper
  bottom outline. N→E/W→S step into the 38-unit low profile without the former full-width pylon. The low
  E/S/SE sources share the transition utility/shading registers. Those mechanical improvements remain useful,
  but the result does not yet match the reference's directional planes or structural joints and is not an
  acceptance candidate.
- **Evidence:** the workbench now renders a composed-only structural envelope gate above the mixed-content
  room. `tests/quotaCoHighObliqueEnvelope.test.ts` rejects exposed base top-light, broad internal charcoal
  joins, incompatible edge sockets, transpose drift, and nondeterministic recompilation. Its transpose gate
  now encodes the rejected assumption and must be replaced before the next result can be accepted; the older
  A1a corner/transition transpose tests require the same review.
- **Still isolated:** no topology/state source, production registry, exporter, `CONTRACT.md`, schema, or
  Unity file has changed in this pass.
- **Queued only after owner acceptance:** (1) resolve the superseded nested
  `low-profile-correction/transition-n-to-e-*` pair; (2) transplant the accepted envelope constants into
  `topology/` and `state/`; (3) regenerate the official `docs/previews` sheets for the migration A-gate;
  (4) export the remaining campus-interior reference image.

### Historical deferred correction lock — superseded, retained for the handoff record

**Owner observation:** “north and south walls should be visibly flat, whereas east and west walls should be
flatter from the top.” The reference room separates two independent axes that the current pass collapsed:

- **Profile height:** north/west exterior room edges are full; south/east are the low/cutaway profile.
- **Directional plane:** horizontal east-west runs on north/south edges read flat/front-on with only a narrow
  coping/top reveal; vertical north-south runs on east/west edges expose the broader, flatter-from-above
  top/side plane.

The current exact-transpose construction makes both axes advertise the same cream/coral/green cross-section.
It therefore reads as axis-aligned product strips even where all edge pixels match. At N→E the squared cream
reveal and outboard green low arm read as separate pieces; W→S carries the corresponding butt-joint problem.
The NW diagonal seam does not convincingly turn between directional planes, and the low SE teal crossing
advertises the tile diagram instead of one molded perimeter.

**Historical pause state:** preserve the uncommitted working tree on branch `codex/campus-art-bundles` above checkpoint
`9453532`. Do not clean, revert, promote, or regenerate official baselines. Automated/importer checks passed
for the previous mechanical contract; they do not override this owner visual rejection.

On restart, keep the pass bounded to A1 wall geometry:

1. Establish two small straight cross-section proofs before touching another junction: one flat/front-on
   north/south treatment and one flatter-from-above east/west treatment. Judge both at 240/90/40 px over light
   and dark grounds, with the grid ignored.
2. Apply the approved horizontal treatment to `full_n_straight` and `low_s_straight`; apply the approved
   vertical treatment to `full_w_straight` and `low_e_straight`. Preserve the single composed envelope, 38/64
   profile bounds, sockets, pivot, palette, and absence of an internal base/upper shelf.
3. Redesign NW, SE, N→E, and W→S as authored structural turns between those two cross-sections. One cap/coping
   surface, lower shell, ground/plinth route, and material system must bend or terminate deliberately through
   each joint; no square tab, overlapping rail, duplicate contour, or diagrammatic teal cross may remain.
4. Replace exact-transpose assertions in `tests/quotaCoHighObliqueEnvelope.test.ts` and the older A1a
   corner/transition tests with gates for compatible occupancy, socket continuity, band endpoints, distinct
   axis plane proportions, deterministic compilation, and the absence of duplicate internal edges.
5. Re-render the envelope gate and room mock, then stop for owner review. Acceptance requires one room
   perimeter—not four joined strips—to survive at 90 and 40 px with exactly one visible cap/coping system and
   intentional high-to-low transitions.

**Historical directional checkpoint (accepted before the equal-height correction, 2026-07-21):** the
northwest full/full corner, northeast full-to-low turn, low-east straight, low-southeast corner, and southwest
full-to-low turn established the then-accepted side-wall rule. The east cross-section is a local,
reanchored X-mirror inside `82..120` around `x=101`: its coral/green fascia and contact shadow face the room,
while its cream plane faces outward. This is not permission to flip a whole tile or synthesize the facing at
runtime. The northeast and repeated east run passed the compact header and long-drop review at gameplay
distance. The low-southeast corner passed isolated, one-cell, and long-run review with the south-facing
cream/coral/green stack wrapping the foreground heel and the east coping terminating behind the shallow south
top. The southwest transition passed isolated construction, full-west ingress, low-south egress, one-cell,
and long-run review by applying the same ownership rule at the height step: the broad west plane terminates
behind the shallow south coping and the rounded south stack owns the foreground heel. Contact-shadow polish
is explicitly deferred.

**Promoted equal-height wall-direction checkpoint (owner approval, 2026-07-21):** the ordinary structural-wall
contract now uses one full 64-unit profile on every room edge. South reuses the exact
`full_n_straight-base.svg` and `full_n_straight-upper.svg` sources at the same centered pivot, with no
transform, duplicate south SVG, or new frame identity. East reuses full west through a whole-cell X mirror;
northeast reuses the accepted northwest pair through that same mirror, and their combined compact/long/room
gate is owner accepted. The polished `transition_w_to_s` base/upper pair now
owns the equal-height southwest corner: its west shaft terminates behind the full south frontage, whose
cream/coral/green/plinth stack wraps the foreground heel. Southeast reuses that pair through a whole-cell X
mirror around `x=64`; suppress only the two source boundary-seam paths so the adjoining south cell owns one
service tick. This adds no SVG, stem, or frame identity. Every derived facing remains unregistered. Former
low/full-to-low geometry survives in history and labeled comparison evidence, not
as the current ordinary perimeter target. Do not propagate any of this into topology, state, registration,
exporter, schema, or Unity without separate authorization.

**Accepted equal-height corridor checkpoint (owner approval, 2026-07-21):** the 3×8 perimeter around a 1×6
clear aisle passes at 90 and 40 px per cell using only the accepted source/reuse contracts. Its one-cell
north/south bodies stay legible, six-cell west/east runs do not drift, and all four corners close as one
manufactured envelope.

**Accepted 47-mask mapping checkpoint (owner approval, 2026-07-21):** the unchanged `mask_0` through `mask_46`
ordering and classification ledger is accepted with four direct reuses, six approved derivations, 36
proof-only synthetic assembly candidates, and one unresolved authored-geometry case. This locks the mapping
structure, not the synthetic pixels or a complete production family.

**Accepted horizontal terminus checkpoint (owner approval, 2026-07-21):** the socket-polished
`full_terminus` source passes directly for `mask_8` and through a whole-cell X mirror for `mask_2`, at 90/40 px
in 1/3/6-cell contexts and enlarged base/upper/composed socket crops. The incoming 96-unit socket inherits the
accepted straight exactly while the molded cap remains local. It does not own the separately authored vertical
termini and must never be rotated into them. Isolated `mask_0` remains its own product decision.

**Accepted vertical terminus checkpoint (owner approval, 2026-07-21):** two west-authored fixed-light source pairs
live in the external `quota-co-building-system-proofs/vertical-terminus/` bank. Both sources preserve the
ordinary wall width and turn its same cream, coral, and green registers through shallow wall-owned closures;
the separately authored south and north ends differ only in projected plane exposure. Each is also shown
through an accepted whole-cell X mirror for the east wall, and ledger rows `mask_1`/`mask_4` record both facings. The focused
sheet exposes 240/90/40 px isolates, 1/3/6-cell installed runs, exact socket crops, and two-/three-cell minimum
segments. The accepted ledger is four direct, six derived, 36 synthetic, and one unresolved.

**Still isolated after terminus acceptance:** the 36 synthetic candidate sprites and isolated `mask_0`;
`topology/` and `state/`; official/production preview
regeneration; template/catalog registration and frame identities; exporter, `CONTRACT.md`, or schema changes;
committed production atlases; prop pilots; Unity; and `production.unity` remain locked until separately
requested. No further proof slice is authorized implicitly by this checkpoint.

**Historical progress 2026-07-20 (superseded by the 2026-07-21 checkpoint):** steps 1–5 were executed and
awaited owner review. Cross-section proofs
blessed ("good enough for now"); both treatments applied to the four straights; NW/SE corners and both
transitions redesigned as authored turns (banded high-wall terminus at each profile drop, coping route
turning on the outer arc, green switching sides per the plane logic at N→E / W→S, continuous green wrap at
SE, coral fan at NW). Teal service register retired from the low family per the references. All 834 tests
green including the master-pointed directional gates; envelope gate and room mock re-rendered. The pass was
owner-corrected once ("single room, flush seams; south reads like north"), which re-registered the south/east
lows onto the full coral system, re-seated the door, and finally rebuilt both transitions as **full-height
corner turns with the profile drop on the run past the corner** (matching the golden-room structure): the
room-side stack terminates against the standing wall's inner outline, the top surface flows through the turn,
the exterior stack wraps in below the outer arc, and a terminus end face steps down onto the low section.
Committed piecewise through the corner rebuild. The 2026-07-21 checkpoint supersedes this progress snapshot;
the previously residual low-southeast corner and southwest transition are now accepted at source level, with
propagation still isolated.

### Measured reference constants (step-1 measurement pass, 2026-07-20)

> **Historical measurement record — not the current visual target.** These values were measured from the two
> older broad references before the owner restored the five targeted wall sheets on 2026-07-20. Wherever this
> section differs from `docs/reference/README.md`—especially low-wall coral, band proportions, corner identity,
> or transition construction—the five-sheet set wins. Re-measure an accepted master cross-section before
> turning any value below into a production lock or test gate.

Measured from crops of `docs/reference/quota-co-office-geometry-study.png` (row 2 col 1 full wall front-on,
row 3 low walls, row 3 col 4 high-meets-low) and `-golden-room.png` (north-wall slice, west edge, south low
edge). Proportions are of the wall's visible screen height:

- **Full wall front-on (study):** top reveal ≈5–8% — a rounded lit cap lip only, behind a definite arris
  seam. Face stack below: cream ≈35%, coral ≈22% (a true band, not a pinstripe), green ≈30%, plinth ≈7%.
- **Golden-room north wall agrees:** narrow coping edge, tall cream face dominating. (Its teal chair-rail +
  lower cream field is illustrative room dressing; the study's cream/coral/green stack is the kit-facing
  version.)
- **Golden-room west wall:** coping/top plane dominant; the face stack compresses to slivers — coral and the
  dark register read as lines, not fields.
- **Historical low-wall reading (superseded):** the two broad references suggested broad cream coping over a
  green face with no coral on low straights. The newer targeted sheets instead require a thin continuous coral
  collar across compatible full and low modules.

Proposed 128-canvas constants (full envelope 56..120, low 82..120; y for horizontal pieces, x for vertical):

| register | horizontal (N/S edge, E-W run) | vertical (E/W edge, N-S run) |
| --- | --- | --- |
| outline | 56..58 | 56..58 |
| lit top plane | 58..63 (5u reveal, white 0.30) | 58..92 (34u plane, white 0.18) |
| arris seam | at 63, 0.45 | at 92, 0.45 |
| cream face | 63..85 (22u) | 92..97 (5u sliver) |
| coral band | 85..97 (12u) | 97..105 (8u) |
| green face | 97..116 (19u) | 105..116 (11u) |
| plinth | 116..120 | 116..120 |

Historical low-wall derivation: horizontal low = coping 82..96, green 96..116; vertical low = coping 82..108,
green sliver 108..116. Its omitted coral register is superseded and must not be copied into current masters;
the targeted sheets require that collar to continue through the low family.

Depth overlays (added after the first owner pass — the unshaded vertical stack read flat): the coping lip is
always white 0.30 (the horizontal's whole 5u reveal; a 1.5u arris line on the vertical, with the broad plane
behind at 0.18); the vertical's descending face stack takes a 0.12 dark face-shade so tops stay lightest and
the axes separate by value, not just proportion; both treatments ground through a 3.5u, 0.12 contact shade
on the floor side of the plinth (window-master precedent). If 0.12 is not a sanctioned bible §4 step, clamp
to the nearest step at transplant time.

Machine gates derived from these numbers (now in `tests/quotaCoHighObliqueEnvelope.test.ts`): horizontal
reveal ≤ 8u; vertical top plane ≥ 28u; vertical top plane ≥ 3× horizontal reveal; one semantic
outside-to-room material hierarchy across treatments. The applied east facing reverses that hierarchy's
screen-space order inside its anchored socket so its fascia still faces the room. The two cross-section proofs live in
`assets/walls/quota-co-building-system-proofs/` (outside the importer's kit directory), render on the bench
as the "cross-section proofs" card, and are the first artifacts those gates run against; the gates re-point
to the masters when step 2 applies the blessed treatments.

## Gotchas (each cost a pass this session)

- The importer rejects stray files (even `.DS_Store`), gradients, masks, filters, images, text, unknown
  paint, and any single path mixing two palette tokens (fill+stroke of different colors — use
  outline-as-shape).
- Ring/hole subpaths must wind opposite to their outer path or the hole fills solid.
- Strict concentric arithmetic can produce sub-perceptual radii — the visible edge gets r4–5 minimum
  (bible §5.3).
- The bench watcher owns port 5411; kill only your own test instances by PID, never by process-name
  pattern (a broad pkill once took down the owner's live session).
- Bilinear sprite metas in the sim repo are per-asset-class policy, NOT drift — see the sim-repo memory
  before "fixing" filterMode.
