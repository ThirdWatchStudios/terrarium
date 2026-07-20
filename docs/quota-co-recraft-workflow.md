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
   is exclusive). Per-stem cards give base/upper/composed + 240/90/40 + dark ground; the room mock gives
   composition. A save re-renders its stem card in ~1.6s; saves under `low-profile-correction/`
   re-render the mock.
5. **Iterate on the owner's eye.** Every pass this session was improved by an owner correction —
   present honestly, name residual deltas yourself, and treat "not right yet" as a diagnosis request.
6. **Owner blesses → commit** just that piece's files, message stating the design rationale (see git log
   for the voice). Never bake an unblessed experiment into a baseline commit.

## Solved constructions (transfer these, don't reinvent)

- **Golden straight** (`full_n_straight`, commit 425e24f): the band grammar — cap plane 58–64, coral
  band 89–97 with 0.10 top-light, one-unit shell/base junction, plinth 117–120, module seams. These
  numbers are the family constants; the bible §§1–5 documents them.
- **Window** (8394eb1): cream product-bezel construction (concentric rings), dark venetian blind field +
  rail bar, dark mullion, diagonal glass sheen (the one licensed non-orthogonal mark), contact shade.
- **Door** (175f122): sliding auto-door in a **full-height break** — no wall behind the doorway; banded
  pylon wall-ends ARE the wall; slim track rail + static coral mode lens; state twins share identical
  framing, only leaves differ. Ring paths need opposite-winding hole subpaths.
- **Terminus** (d400a61): the end cap is a **monolithic post to the ground** (never stacked
  base/upper lobes — the "capital B" failure); band wraps the lit end face behind a divider seam.
- **Corner** (working diff, unblessed): NW-seat corner = the two standard upper profiles meet on the main
  diagonal and every visible feature remains an exact transpose. The hidden low bases union into one
  symmetric substrate with one rounded cap/service turn; they do not overlap translucent paths or add a
  second diagonal crack. ⚠ Never naive-mirror a corner: that flips a profile and breaks tiling with the
  straights. The committed 8ae5da0 version is the superseded NE orientation.
- **Transitions** (working diff, unblessed; ae7b155 superseded): the full run steps through the
  terminus construction as a **full-width banded junction pylon grounded through the base**. The pylon
  spans the complete 38-unit shoulder to the low wall's shared outer edge, hides the
  plain-base-to-cream-coping handoff through the joint, and lets the low arm emerge below it. The two
  useful facings are exact diagonal transposes; their concentric 12/10-unit base turns and shared
  fastener axis must remain paired. A rounded full-wall capsule or narrow post beside an exposed low
  elbow is the rejected "disconnected walls" construction.
- **Depth rules:** near-plane features shift down (E-W) or east (N-S); an engaged element that continues
  the wall's bands at the same heights will camouflage — separate by plane values (shaded wall behind,
  clean face, 0.10-lit reveal) or by construction, not by outlines.

## State at handoff (2026-07-20, branch `codex/campus-art-bundles`)

- Committed: d78a791 baseline → 425e24f straight → 8394eb1 window → 175f122 door → d400a61 terminus →
  8ae5da0 w_straight + corner(NE, superseded) → ae7b155 transitions.
- **Uncommitted, awaiting owner bless:** the NW corner re-orientation (both `full_exterior_corner`
  files); the grounded, transpose-paired root transitions (all four `transition_{n_to_e,w_to_s}-*`
  files plus their raster gates); and the room-mock/watcher corrections in `scripts/styleLoop.ts`.
- **Uncommitted session tooling** (proven, owner may commit as its own change): `scripts/styleLoop.ts`,
  the two `style:*` npm scripts in `package.json`, `docs/quota-co-style-bible.md`, `docs/reference/`,
  this doc.
- **Queued work, in rough order:** (1) low-sill regrammar — `low-profile-correction/low-{e,s}-straight`,
  `low-se-corner` still carry teal service bands and old registers, the last visible drift in the room
  mock; their own `transition-n-to-e-*` pair is superseded by the root transitions and needs an
  owner call (delete vs update); (2) the topology/ and state/ sub-kits inherit the family constants
  (batch: transplant the golden numbers exactly); (3) regenerate the official `docs/previews` sheets
  (`npm run high-oblique:a1b:preview` and siblings) for the migration plan's A-gate review; (4) the
  third reference image (`quota-co-campus-interior-study.png`) still needs exporting into
  `docs/reference/`.

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
