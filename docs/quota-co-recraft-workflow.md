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

1. **Pick the piece from the room mock.** The composed room at the top of the bench page is the
   issue-finding surface — tiling truth only shows composed. Anything the owner can point at in that
   image becomes a one-piece pass.
2. **Read before drawing:** the piece's current masters, the reference panels
   (`docs/reference/quota-co-office-geometry-study.png`, `-golden-room.png`), the bible's constants, and
   any already-solved construction that transfers (see ledger below). When a sub-kit covers the same
   ground (e.g. `low-profile-correction/`), treat its **geometry** as authoritative even where its
   grammar is stale.
3. **Recraft in grammar.** Nine paints only, seam registers 0.28/0.35/0.45/0.62, overlay ladder,
   concentric radii with the r4–5 legibility floor, semantic ids, topology-generation vocabulary,
   shading as overlays never tints (recolor law). Edit masters with the file tools, not shell scripts —
   shell edits break the session harness's write tracking.
4. **Judge on the bench:** `npm run style:watch` → http://localhost:5411 (one instance only — the port
   is exclusive). The composed-only envelope gate is the first acceptance surface; the room mock then adds
   opening content. Per-stem cards give base/upper/composed + 240/90/40 + dark ground. A save re-renders its
   stem card; saves under `low-profile-correction/` re-render both composition views.
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
- **Corner** (current pass rejected): the NW-seat's exact-transpose diagonal produces a neat tile but not a
  convincing turn between the flat/front-on horizontal plane and the flatter-from-above vertical plane.
  Preserve the absence of a second cap or inner outline; redesign the turn with authored, non-transposed
  plane mediation. ⚠ Never naive-mirror or transpose a corner to manufacture another facing.
- **Transitions** (current pass rejected; ae7b155 and the later pylon treatment also superseded): the high r9
  body ends at the profile change and steps directly into the low r12 shoulder. The base owns the continuous
  green/coping route; the upper stops before the outgoing low arm instead of covering it with a grounded
  pylon. Preserve socket occupancy and continuous material endpoints, but N→E and W→S are no longer
  exact-transpose partners: each junction must mediate its two authored directional planes. Coral needs one
  deliberate termination/wrap and the teal register must not form a diagrammatic crossing. A full-width pylon
  over the low wall, a floating capsule, a square cream tab/reveal, or a separately outlined elbow are all
  rejected constructions.
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

### Deferred correction lock — restart here

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

**Pause state:** preserve the uncommitted working tree on branch `codex/campus-art-bundles` above checkpoint
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

**Locked until that review passes:** the nested transition cleanup; `topology/` and `state/`; official preview
regeneration; template/catalog registration; exporter, `CONTRACT.md`, or schema changes; prop pilots; Unity;
and `production.unity`. Commit or propagate only when separately requested.

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
