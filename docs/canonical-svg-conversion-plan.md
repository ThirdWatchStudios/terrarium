# Canonical SVG source-conversion plan

Status: **active; P0 department machines, all ten fitted hairstyles, and P1 IRIS hardware have complete source authority locally; IRIS browser handoff and Unity visual acceptance are complete**

Recorded: 2026-08-02

This plan records the remaining work required to make Terrarium's deliberately
authored appearance genuinely source-owned by checked-in SVG files. It is a
companion to:

- [`content-pipeline-plan.md`](content-pipeline-plan.md), which decides what
  appearance should be authored instead of procedural;
- [`hand-editable-svg-pipeline-plan.md`](hand-editable-svg-pipeline-plan.md),
  which defines the laptop/iPad edit, compile, review, and Unity handoff; and
- [`core-part-library.md`](core-part-library.md), which tracks the authored
  visual vocabulary.

This document captures scope and sequence. It does not approve a visual
direction, promote a proof, change a live importer, export a bundle, update
Unity, or authorize a commit. Every family remains a bounded visual and
production migration.

## 1. Objective

Move visual decisions that require human art direction out of TypeScript shape
builders and into canonical SVG sources without changing the game's behavioral
contracts.

The desired end state is not “everything is SVG.” It is:

- deliberately authored silhouettes, strokes, paint order, and signature
  details are easy to edit as source art;
- procedural code continues to own composition, metadata, bounded variation,
  and intentionally generated effects;
- every production appearance has an explicit, auditable authority; and
- an SVG described as canonical actually controls the production pixels.

## 2. Hard-backed canonical test

An asset is **hard-backed by canonical SVG** only when all of the following are
true:

1. the checked-in SVG is selected by the live production import registry;
2. editing that SVG changes the compiled production appearance;
3. no normal build, test, preview, or freshness command can overwrite it;
4. generated TypeScript/JSON contains no independent replacement geometry;
5. source paint order, strokes, token placement, and literal colors survive the
   importer unless an explicit reviewed adapter says otherwise;
6. the canonical-source guide reports the SVG as the authority for its live
   production receiver; and
7. source, compiled render, exported bundle, and Unity receiver can be traced
   to the same revision.

Having an `.svg` file in `assets/` is insufficient. A generated SVG, a source
that is ignored by the live receiver, or a source whose geometry is replaced
by a fitter remains noncanonical under this definition.

## 3. Ownership classifications

The generated source inventory should classify every visual receiver as one of
five states:

| Classification | Meaning |
| --- | --- |
| `canonical-svg` | Checked-in SVG directly owns the live appearance |
| `derived-from-svg` | Deterministic mirror/fit/variant derived only from canonical SVG plus declared data |
| `procedural-intentional` | Code owns appearance by explicit design decision |
| `source-only` | SVG exists as proof/reference but has no live production receiver |
| `false-canonical` | SVG exists but a generator, fitter, or alternate builder still owns production pixels |

`false-canonical` is a failing transitional state. The other four may all be
valid when declared accurately.

The inventory should also report:

- canonical source paths;
- production receiver ids;
- importer/adapter;
- declared mirrors, fits, states, and parameter derivations;
- whether any command writes the source path;
- compiled provenance; and
- latest source/import/Unity evidence.

## 4. Existing source-backed foundation

The current repository already contains substantial source-backed art. Preserve
and build on these systems rather than replacing them:

- the QuotaCo workhorse prop bank and its source-to-`ShapeSpec` importer;
- canonical character bodies, human heads, mapped hair bases, and the imported
  outfit-component system, subject to the hair-production exception below;
- the Maintained Hybrid floor and base-grass bank with its separate seam-aware
  importer;
- canonical bevel and equal-height wall source dependencies plus their approved
  derivation ledger; and
- accepted gameplay-candidate SVGs that are honestly marked source-only rather
  than production-wired.

Counts in generated reference guides are snapshots, not design constants.
Regenerate the inventory when work resumes and trust live import registries
over old documentation totals.

## 5. Priority backlog

### P0 — correct false-canonical ownership

#### Department machines

The checked-in department-machine SVGs are currently emitted from accepted
TypeScript proof builders by `promoteQuotaCoDepartmentMachines.ts`, and the
source freshness check is part of `assets:check`. They are therefore generated
artifacts, not visual authority.

Completion note (2026-08-02): the local ownership inversion is complete. The
code-to-SVG promoter and its normal-build freshness commands are removed. The
67 checked-in machine/state/overlay SVGs, read-only importer, source-authority
regression, and canonical reference-guide coverage now form the production
boundary for 38 templates, 54 baked prop instances, and 13 overlays. Focused
department-machine validation passed 51/51 checks, source/production pixels
remain identical for every baked state, the canonical guide is current, and
`npm run build` is clean. The safe full runner stopped at its 2 GiB watchdog on
`bodyArchetypes.test.ts`; that implicated file passed directly 25/25. Bundle
export and Unity import/Play Mode review remain separate gates.

Required migration:

1. freeze the currently accepted source files as the starting canonical bank;
2. verify that every live template/state/overlay has an explicit source entry;
3. remove the code-to-SVG generation command from ordinary source/build checks;
4. retain only SVG-to-generated-art compilation in the normal pipeline;
5. delete or quarantine obsolete proof builders after confirming no preview or
   contract still depends on them; and
6. prove source, compiled output, state/parameter coverage, normal/far context,
   export, and Unity reception as separate gates.

This is the first conversion because it validates the ownership law against a
large, current, stateful production family.

#### Head-aware hair production geometry

The hair base SVGs are checked in. All ten bounded source-authority slices
are complete for `hair-bob`, `hair-short`, `hair-bun`, `hair-ponytail`,
`hair-long-straight`, `hair-balding`, `hair-pixie`, `hair-side-part`, and
`hair-curly`, plus `hair-coils`: each three-facing canonical set
compiles through a declared `head-fitted-art` adapter into six deterministic
head variants, and the live resolver consumes those generated records without
a Bob, Short, Bun, Ponytail, Long straight, Balding, Pixie, Side-part, Curly, or
Coils path builder. No mapped hairstyle retains code-owned production geometry.

Preferred migration:

- canonical SVG owns each hair style/facing silhouette and detail;
- declarative head-fit data may position, scale, clip, or apply other explicitly
  reviewed bounded transforms;
- fit code must not redraw a replacement hairstyle; and
- per-head SVG variants are added only where a bounded transform cannot retain
  the accepted silhouette/read.

Do not create a full hair-by-head SVG matrix by default. First prove that
source-owned geometry plus declarative fitting can replace the code-owned
builders. Bob proved the mechanism; Short proved that a visually weak legacy
source can be refined before promotion; Bun proved disconnected components can
retain separate declarative frames without redrawing; Ponytail proved that its
tie and tail can share one attachment transform while the cap fits independently.
Long straight proved that a tall curtain and two-piece east profile can share a
single bounded fit frame without losing the open face. Balding proved that
independently editable tapered temples, rear piece, and horseshoe can retain
their character under declarative component fitting. Pixie proved that a broken
cap/fringe can fit independently from directional side tufts. Side-part proved
that a swept cap, separate side/rear mass, and source-owned parting crease can
share bounded declarative fitting without losing direction. Curly proved that
each editable lobe can retain its own center/radius frame while preserving a
soft cluster distinct from Coils. Coils proved the same component contract can
retain a wider, denser 8/6/8-lobe cloud distinct from Curly. All ten styles passed
six-head, three-facing, literal 48/32 px review and received visual approval on
2026-08-02. Apply the same bounded source/import/review gate
one style at a time; add a per-head source only when the reviewed transform is
insufficient.

### P1 — signature world and character identity

#### IRIS hardware

Completion note (2026-08-02): the approved three-source fit is promoted locally.
`assets/props/iris-hardware-v1/` now owns the live installation unit, dormant
installation unit, and charging dock. A read-only importer compiles the two
declared height families and static dock into the production art registry;
`PropTemplate` retains ids, parameters, footprints, and anchors but no longer
contains the handwritten `buildIrisUnit` or dock geometry. All 23 height/state/
dock renders retain exact default source/production pixels. Under the clinical
lens, both installation families remain exact and the curved dock stays within
three antialiased pixels at a maximum four-channel-value delta; the approved
source was not rewritten to erase that renderer-normalization difference. A
source-edit regression proves all declared installation heights change from the
checked-in SVG, and the canonical guide includes all three production sources.
The owner then imported the normal Terrarium in-browser **Export all (zip)**
bundle into Unity and accepted the fresh result. A second browser export from
Terrarium revision `d15851f` was checked against the timestamped Unity import
`water-cooler-sprites-20260802-152648`; every non-Unity-metadata file in all
three IRIS prop directories matched byte-for-byte. This closes the IRIS browser
handoff and Unity visual gate. Stable Candidate/Current receivers and the
revision-stamped promotion lock remain pipeline work.

Preserve:

- existing ids and live/dormant state relationship;
- 2×1 installation and 1×1 dock contracts;
- projection, pivot, console/interaction anchors, collision, facility
  registration, and export paths;
- the accepted distinction between live optic/diagnostics and dormant paint;
  and
- the currently approved visual baseline, which must be reconfirmed before
  source extraction if checkout history is ambiguous.

Live and dormant may share declared source components only if each final state
remains directly inspectable and source-owned.

#### Special character identity parts

Convert these code-owned visual parts through the character importer/adapter
system:

- [x] `outfit-dress` — promoted 2026-08-02 as eighteen complete canonical
  sources (six production bodies × three authored facings), with exact
  body/facing selection and no fit math or production-body handwritten
  geometry fallback;
- [—] `outfit-hi-vis` — retired human construction-crew art, superseded by the
  IRIS FAB recipe (`head-fab` + `outfit-fab-chassis`); retain only as dormant
  compatibility/authoring content and exclude it from canonical-source
  migration unless the human crew is explicitly reactivated;
- [x] `outfit-fab-chassis` — promoted 2026-08-02 as three canonical facings
  with a `body-large-frame`-only receiver and no handwritten geometry fallback;
- [x] `outfit-service-apron` — promoted 2026-08-02 as eighteen complete
  detail-only canonical overlays (six production bodies × three authored
  facings), with exact body/facing selection, ordered tint-run preservation,
  and no handwritten geometry fallback; and
- [x] `acc-hairnet` — promoted 2026-08-02 as three complete canonical
  head-center overlays with no remaining static handwritten geometry.

The SVG owns the visible garment/equipment art. Body rigs, facing mirrors,
body-fit frames, recipe-only/selectability policy, z-order, and anchors remain
metadata/adapter concerns.

The FAB chassis completed the fixed-body pilot, Dress completed the per-body
silhouette pilot, and the apron/hairnet pair completed the body-variant detail
and static accessory source paths. All active special character identity parts
are now source-owned; retired Hi-vis is not part of that completion set.
The cafeteria pair completed the normal browser export and fresh Unity import
on 2026-08-02. Because the sim cannot yet surface cafeteria workers in action,
its downstream gameplay-scale visual check is explicitly deferred rather than
inferred from import success.

### P2 — major gameplay facilities

Convert the cafeteria facility family:

- `serving-line`;
- `service-scanner`;
- `commercial-range`;
- `prep-table`;
- `dish-return`;
- `walk-in-front`;
- `dining-carrel`;
- `cafeteria-table`; and
- `tray-stack`.

These are multi-cell or functionally distinctive facilities, not incidental
clutter. Preserve footprints, plan/elevation projection, blocking rules,
clinical-drain behavior, service-scanner interaction and literal optic color,
registration, and export contract.

The family should receive one shared context sheet at literal employee and room
scale before source extraction, followed by per-asset source/import fidelity.

Terrarium production registration completed on 2026-08-03 after approval of
both review gates. The nine files now live in the canonical workhorse bank, the
strict importer generates their live `ShapeSpec` receiver, and the existing
templates retain only IDs, projection, footprints, placement, and behavior.
The normal browser export and fresh Unity import completed on 2026-08-03. The
facilities do not yet have a viable in-game path, so gameplay-scale visual
acceptance remains explicitly deferred until the sim can surface them; it is not
inferred from successful import.

### P3 — authored UI iconography

Move deliberately authored UI/chrome icons and cursors from code-owned
`ShapeSpec` paths to canonical SVG sources. Preserve stable catalog ids,
tint/literal-color policy, tight-crop behavior, theme readability, and the
clinical-line chrome register.

Scope includes:

- application/control and trim glyphs;
- department, need, relationship, and other catalog/chrome symbols;
- UI-state clinical line icons; and
- cursors.

Keep moods, floor bubbles, attention/emotion overlays, badges/emotes, poses,
and other explicitly procedural atlases code-owned unless a later visual review
changes that decision.

Because this is a large vocabulary, migrate it by semantic family rather than
one flag-day conversion. Add completeness tests against the exported icon
catalog after each slice.

The first UI-E1 slice entered Terrarium production source authority on
2026-08-03 after explicit approval of the UI-E1a source-fit gate. Five exact
stable IDs are now backed by checked-in SVGs under
`assets/ui/canonical-shared-primitives-v1/`: exact authority inversions for
`ui-divider`, `iris-mark`, and `quotaco-mark`, plus the approved square
`ui-corner` and four-tick `ui-focus` redesigns. The strict importer generates
the disposable `ShapeSpec` receiver, ordinary asset checks are read-only, and
pixel-parity tests cover every approved literal review size. Unity continues
to own carriers, states, typography, accessibility, interaction, and layout.
Browser export, Unity import, and the separate Direction B font-asset/USS gate
remain downstream work; this Terrarium source promotion does not claim them.

### P4 — authored exterior base silhouettes

Convert the remaining deliberate flora bases:

- `tree-sapling`;
- `bush-cluster`;
- `wildflower-patch`;
- `tall-grass-clump`; and
- `bracken-patch`.

The canonical SVG owns the recognizable base silhouette and signature internal
structure. Seeded lobe, blade, cluster, and other microvariation may remain
procedural if it derives from and does not replace that source-owned design.

Keep small ground speckles, tufts, rake marks, and similar environmental
microdetail procedural unless separately promoted.

## 6. Explicit non-conversion set

Do not mechanically convert every code-owned visual. The following remain
procedural by default:

- palette resolution, outlines, LOD machinery, atlas packing, and composition;
- moods, bubbles, badges/emotes, attention/emotion overlays, and pose
  composition;
- shadows and contact policies that are not literal authored source paint;
- minor clutter, vents, generic hardware detail, and non-signature accessories;
- floor/ground microvariation after a human-curated base;
- per-wall-template material detail where the wall plan retains it;
- topology transforms and explicitly approved mirrors/derivations; and
- the separately deferred 47-frame grass fringe until its own visual proof.

Internal renderer-only pictograms such as unit body/head placeholders need not
become standalone art assets unless they become player-visible identity.

## 7. Family migration protocol

Every family follows the same bounded sequence.

### Gate 1 — current-authority audit

- resolve live receiver ids and all states/facings/parameters;
- identify which files and functions currently own visible geometry;
- identify runtime metadata and Unity receivers that must remain unchanged;
- inspect uncommitted changes and current visual-approval status; and
- stop if docs, production state, or accepted pixels disagree.

### Gate 2 — source proposal

- render the current production appearance at its real projection and scale;
- author or extract genuine editor-safe SVG source files;
- record state/component/facing relationships in a manifest;
- keep source promotion separate from any redesign unless redesign was
  explicitly requested; and
- present the source and production control for visual approval.

### Gate 3 — deterministic importer

- compile source art into the existing production receiver;
- preserve handwritten ids, metadata, parameters, anchors, footprints, and
  registration;
- retain source strokes, paint order, token mapping, and literal colors;
- emit source-path/hash provenance with generated art; and
- ensure ordinary builds check freshness but never rewrite sources.

### Gate 4 — source/import proof

- compare standalone source and compiled output at close resolution;
- compare normal and far gameplay-scale renders;
- cover crowded/occluded and light/dark contexts where applicable;
- cover states, facings, parameter extrema, palette behavior, and mirrors/fits;
- update only intentional snapshots; and
- stop for owner visual approval.

### Gate 5 — production registration and export

- switch the live receiver from code builder to imported art;
- verify no fallback path silently restores the old geometry;
- run focused tests, full relevant asset checks, build, and deterministic
  headless export;
- verify manifest/facility/catalog completeness; and
- report browser/headless evidence separately from Unity evidence.

### Gate 6 — Unity candidate and promotion

- import a fresh revision-stamped bundle through the real Sprite Toolkit path;
- inspect the actual catalog receiver and composed Play Mode pixels;
- confirm projection, scale, anchors, navigation/collision, state changes,
  sorting, and room/employee read;
- promote only after explicit visual acceptance; and
- record source revision and bundle digest in the game-side lock.

## 8. Required regression shields

The canonical-source program should add or retain tests for:

- every declared `canonical-svg` receiver resolving to an existing checked-in
  source;
- no production check/write command targeting canonical source paths;
- no `false-canonical` entry in the generated ownership inventory;
- source file hash/provenance matching compiled output;
- deterministic compilation from a clean checkout;
- source-versus-compiled raster fidelity at defined scales;
- complete state/facing/parameter coverage;
- no unreviewed fallback to procedural geometry;
- unchanged ids, footprints, anchors, projections, registration, and export
  paths; and
- bundle provenance matching the Unity-side promoted lock.

Editor round-trip interoperability belongs to the hand-editable-pipeline gate,
but every newly converted family must conform to the qualified SVG profile.

## 9. Completion definition

An asset family is complete only when:

- its visual authority classification is accurate;
- all required canonical sources and manifests are checked in;
- ordinary builds cannot overwrite those sources;
- generated production art is reproducible and carries source provenance;
- all live receivers use the imported appearance without hidden fallback;
- focused and full relevant validation passes;
- the standard source/import and composed visual gates are accepted;
- a fresh Sprite Toolkit bundle contains the expected art/catalog entries;
- the real Unity candidate import and Play Mode check are complete; and
- production promotion, documentation, and revision lock are deliberately
  recorded.

A passing build, a good standalone SVG, a browser export, or a generated guide
entry is not sufficient on its own.

## 10. Suggested execution sequence

Run one family at a time, preserving visual approval boundaries:

1. add the ownership classifications and failing `false-canonical` audit;
2. invert department-machine ownership;
3. restore canonical authority to production hair fits;
4. convert IRIS installation/dock art — canonical source, browser handoff, and
   Unity visual acceptance complete; durable Candidate/Current promotion lock
   remains pipeline work;
5. [x] convert FAB chassis, dress, `outfit-service-apron`, and `acc-hairnet`,
   explicitly excluding the retired human Hi-vis outfit;
6. convert the cafeteria facilities;
7. migrate UI iconography by semantic family; and
8. convert the five flora base silhouettes.

After each family, leave a clean completion record before starting the next.
Do not combine unrelated families merely because they share the SVG importer.

## 11. Resume checklist

When canonical-source work resumes:

1. regenerate the live SVG reference guide and ownership inventory;
2. re-audit the current worktree rather than trusting the 2026-08-02 snapshot;
3. confirm visual approval and production registration separately;
4. select the next bounded family from the execution sequence;
5. preserve the family-specific gameplay and export contracts;
6. stop after the source/import visual gate for explicit acceptance; and
7. treat export, Unity Candidate, production promotion, and commit as distinct
   subsequent decisions.
