# Hand-editable SVG pipeline plan

Status: **ratified direction; implementation deferred**

Recorded: 2026-08-02

This plan defines the eventual laptop/iPad workflow for editing Terrarium art,
checking it into this repository, compiling it through the existing content
pipeline, and reviewing it in The Water Cooler. It is a companion to
[`content-pipeline-plan.md`](content-pipeline-plan.md), which defines which
appearance should become authored art, and
[`core-part-library.md`](core-part-library.md), which tracks the authored
primitive inventory. The separate
[`canonical-svg-conversion-plan.md`](canonical-svg-conversion-plan.md) records
which remaining production families should gain genuine SVG authority and the
bounded migration law for each family.

This document is a durable design decision, not authorization to convert an
asset family, change production registration, export a bundle, update Unity,
or commit generated art. Each family still crosses its own visual-approval and
promotion gates.

## 1. Goal

An artist should be able to:

1. find a production asset by its stable Terrarium id;
2. open its canonical SVG in a normal vector editor on macOS or iPadOS;
3. change the visible art without editing TypeScript geometry;
4. validate and preview the result through one consistent command surface;
5. check in the source from either device;
6. build an exact, revision-stamped Sprite Toolkit bundle; and
7. review that bundle in the real Unity presentation before promotion.

The pipeline must preserve the existing runtime contracts: template and
instance ids, projections, pivots, grid footprints, anchors, parameters,
collision/navigation behavior, states, export paths, facility registration,
schema, and Unity receiver behavior.

## 2. Source-of-truth decision

For every promoted authored asset:

- the checked-in SVG is the visual authority for geometry, paint order,
  strokes, literal colors, and palette-token placement;
- handwritten TypeScript/JSON remains the authority for behavior and runtime
  metadata;
- `src/**/generated/*` is deterministic compiled output, never an authoring
  surface;
- builds, tests, previews, and source-guide generation may read an SVG but may
  not create, replace, or rewrite a canonical SVG; and
- code-to-SVG promotion scripts are proof/migration tools only. They must be
  retired from ordinary build checks once their output becomes canonical.

Visible state changes normally use separate SVG sources. Bounded parameters
may continue to transform named semantic groups or bake legal variants from a
source-owned base. West-facing character art may continue to be a declared
mirror of east where that is already the production contract.

## 3. Ownership boundary

| Concern | Owner |
| --- | --- |
| Visible paths, strokes, fills, paint order | Canonical SVG |
| Palette-channel placement and literal paints | Canonical SVG |
| Asset id, label, projection and footprint | Handwritten metadata |
| Pivots, anchors, interaction and collision | Handwritten metadata |
| Parameter bounds and variant rules | Handwritten metadata/import adapter |
| Generated `ShapeSpec` and atlas inputs | Compiler output |
| Raster atlases, catalogs and Sprite Toolkit zip | Export output |
| Active game-art revision | Unity-side lock and catalog |

The importer must preserve authored strokes and detail. Global restyling,
outlines, or contact shadows are opt-in compatibility behavior and must never
silently change accepted canonical pixels.

## 4. Editor-safe SVG profile

Canonical sources use a deliberately small, editor-neutral dialect:

- a fixed declared `viewBox` and family canvas;
- vector paths and the explicitly supported basic SVG shapes;
- explicit fills, strokes, joins, caps, transforms, and nonzero fill behavior;
- stable, named top-level semantic groups such as `shadow`, `shell`,
  `structure`, `function`, `detail`, and `personalization` where applicable;
- declared palette-token colors and literal-paint exceptions; and
- source paint order as production paint order.

Rendered text, scripts, events, external references, raster images, unsupported
filters/effects, and editor-private appearance features are rejected.

The pipeline should not require a vector editor to preserve exact XML
formatting or every leaf-node id. Nonvisual contracts belong in manifests or
handwritten metadata. Where stable compiled element ids are needed, the
importer should derive them deterministically from semantic group, role, and
paint order.

Before recommending an editor, add a representative
`editor-roundtrip-control.svg` containing token fills, literal fills, strokes,
transforms, semantic layers, and paint-order dependencies. A macOS and iPadOS
open/edit/export round trip must pass structural validation and source-versus-
compiled pixel comparison. Affinity Designer is the initial candidate, but no
named editor becomes a production dependency.

## 5. One asset catalog and command surface

Extend the generated canonical SVG reference manifest into the routing index
for all production art. Each entry should expose:

- stable asset id and kind;
- canonical source path(s) and source status;
- importer/adapter;
- production template or part receiver;
- state, facing, and parameter coverage;
- standard preview command/artifact; and
- Unity export receiver.

The human-readable canonical SVG guide should display the same data and link
to the exact source files. It remains generated and may never manufacture
source art.

Provide a thin router over the existing family importers:

```bash
npm run art:open -- <asset-id>
npm run art:sync -- <asset-id|source-path|--changed>
npm run art:check -- <asset-id|source-path|--changed>
npm run art:preview -- <asset-id>
npm run art:watch -- <asset-id>
npm run art:bundle -- path/to/water-cooler-sprites.zip
npm run art:game -- path/to/water-cooler-sprites.zip
```

- `art:open` resolves and opens the canonical source in the platform-default
  SVG editor.
- `art:sync` invokes the owning importer and refreshes compiled derivatives and
  the reference guide. It never writes canonical SVGs.
- `art:check` validates source structure, rejects stale compiled output, and
  runs focused source/import fidelity checks without mutation.
- `art:preview` produces the asset's standard review sheet.
- `art:watch` reruns sync and preview after source saves on a laptop.
- Terrarium's in-browser **Export all (zip)** action is the sole standard game
  export path.
- `art:bundle` validates a browser-produced ZIP, records its source
  revision/provenance, and emits a digest sidecar. It never regenerates PNGs
  through the headless exporter.
- `art:game` accepts that verified browser bundle and imports it into the local
  Unity candidate slot.

The family-specific commands remain available for diagnosis; artists should
not need to know which one owns an asset.

## 6. Standard visual gate

Every promoted family defines a focused review sheet appropriate to its
contracts. Major world art normally includes:

- canonical source and compiled result side by side;
- close and normal gameplay scales;
- far gameplay scale;
- crowded/occluded context;
- light and dark neighboring materials where relevant;
- wall, room, employee, or interaction context;
- every visible state; and
- default plus parameter extremes.

Characters retain facing, body-fit, portrait, palette, accessory, pose, and
gameplay-scale checks. Surfaces retain their distinct seamless-edge rules.
Walls retain topology, socket, facing, run-length, and room-read gates.

Structural validation, deterministic compilation, tests, and pixel comparison
are necessary evidence. They do not replace visual acceptance of the composed
game-scale result.

## 7. Laptop workflow

1. Create or switch to an art branch.
2. Run `art:open <id>` and `art:watch <id>`.
3. Edit the canonical SVG in the qualified editor.
4. Review the refreshed standard sheet.
5. Run `art:check <id>`.
6. Commit the canonical SVG, intentional compiled derivatives, relevant
   snapshots, and no unrelated files.
7. Open Terrarium from the checked-out revision and click **Export all (zip)**.
8. Run `art:bundle <downloaded-zip>`, then `art:game <downloaded-zip>` and
   inspect the candidate in Play Mode before production promotion.

Generated derivatives remain checked in initially to minimize architectural
change. They must be reproducible exactly from committed sources and must
never contain independent visual decisions.

## 8. iPad workflow

1. Clone or fetch the art branch in Working Copy.
2. Expose the repository through Files and locate the SVG using the canonical
   catalog path.
3. Open/import it in the qualified vector editor.
4. Export it as SVG over the same Working Copy path, preserving the canvas and
   vector-only profile.
5. Review the SVG diff in Working Copy and commit/push the source-only change.
6. CI runs `art:sync`, validation, focused tests, preview rendering, and a
   headless structural export audit.
7. Automation contributes the deterministic derivative update to the branch
   or supplies an exact patch; the artist never edits generated TypeScript on
   the iPad.
8. When the branch is ready for the game, open that revision in Terrarium and
   create the handoff with **Export all (zip)** in a browser.

CI should publish the standard review sheet and headless structural audit for
every source-art pull request. It may not label a headless artifact as the game
bundle. Source-only iPad commits must be a first-class supported path, not an
exception that requires a later manual reconstruction of the edit.

## 9. Revision-stamped export

Terrarium's in-browser **Export all (zip)** action should embed or accompany:

- the normal Sprite Toolkit tree/zip;
- Terrarium git commit;
- canonical-source manifest digest;
- compiled-art digest;
- export schema version;
- build timestamp as informational metadata only; and
- a SHA-256 digest of the final bundle.

`art:bundle` verifies those fields against a browser-produced ZIP and writes a
sidecar/receipt without rerasterizing or replacing its contents. The commit and
digests provide identity. A timestamp must not be the only way to identify an
import. The headless Resvg export remains useful for CI and diagnosis, but is
never eligible for Unity Candidate or Current.

## 10. Unity candidate and promotion flow

The current timestamped Unity import remains useful for archival evidence but
is too expensive and noisy for the normal edit loop. Add two stable receivers:

- `TerrariumCandidate`: local/review-only generated assets, safe to replace
  repeatedly and excluded from production commits;
- `TerrariumCurrent`: the deliberately promoted production import, using
  stable asset paths and preserved Unity `.meta` GUIDs.

`art:game` imports into Candidate and makes the candidate catalog selectable in
the production presentation without silently promoting it. Candidate review
must exercise the real catalog, sprites, atlases, facility entries, anchors,
sorting, camera, and Play Mode scene.

Promotion copies/imports the accepted bundle into Current and writes a small
Unity-side lock containing the Terrarium commit and bundle SHA-256. It should
produce reviewable diffs and preserve stable GUIDs. It must not run merely
because CI is green.

## 11. Implementation phases

### Phase A — ownership and local loop

- invert department-machine ownership so their checked-in SVGs are canonical;
- generate the unified routing catalog from live import registries;
- add `art:open`, `art:sync`, `art:check`, `art:preview`, and `art:watch`;
- ensure import/build checks never write source files; and
- document and test source-versus-compiled stroke/paint-order fidelity.

Exit: one workhorse prop and one department machine can be edited on macOS,
compiled, previewed, reverted, and recompiled without a source generator.

### Phase B — editor and iPad qualification

- add the round-trip control asset and structural/pixel checks;
- qualify and document Affinity Designer on macOS and iPadOS;
- document Working Copy/Files overwrite and recovery steps; and
- add CI handling for source-only art branches.

Exit: an iPad-only source edit can be pushed and receive a green compiled-art
check, standard review sheet, and export bundle without hand-editing generated
files.

### Phase C — stable game loop

- add revision metadata to the Terrarium bundle;
- add Unity Candidate and Current receivers;
- preserve stable `.meta` GUIDs and remove stale generated files by manifest;
- add a one-command local Candidate refresh; and
- record the promoted Terrarium revision in the game repository.

Exit: an accepted source edit can be reproduced from its Terrarium commit,
reviewed in Play Mode, and promoted with a small, traceable Unity diff.

### Phase D — incremental source conversion

Convert code-owned visual families only through bounded, separately approved
slices. Each slice adds canonical SVGs, routing/catalog coverage, importer
coverage, its standard visual gate, and Unity proof without changing gameplay
contracts.

## 12. Deferred canonical-source audit

The source-ownership audit is recorded here so it can resume after pipeline
implementation planning. It is not authorization to convert these assets now.
The complete durable backlog and migration gates now live in
[`canonical-svg-conversion-plan.md`](canonical-svg-conversion-plan.md); the
summary below remains the hand-editing pipeline's dependency view.

Highest-priority remaining gaps:

1. department machines — present SVGs are currently regenerated from
   TypeScript proof builders and must become true source authority;
2. the durable Candidate/Current promotion lock for the already-canonical IRIS
   installation live/dormant art and charging dock;
3. major cafeteria facilities;
4. UI/chrome iconography and cursors, excluding intentionally procedural
   moods, bubbles, badges, and overlays; and
5. authored flora base silhouettes, while keeping microvariation procedural.

The production head-aware hair geometry and the active special identity set
(Dress, FAB chassis, service apron, and hairnet) completed canonical-source
promotion on 2026-08-02. The retired human Hi-vis outfit is superseded by the
FAB bots and is not an active canonical-source target.

Do not convert every code-owned prop mechanically. Minor clutter, vents,
shadows, ground microdetail, per-wall material detail, procedural overlays, and
the explicitly deferred grass fringe remain appropriate procedural candidates.

## 13. Non-goals

- No native editor file becomes production source truth.
- No SVG parser ships to Unity or the Terrarium browser runtime.
- No automatic CI result substitutes for composed-pixel approval.
- No source conversion changes gameplay ids, footprints, anchors, projection,
  registration, schema, or behavior by implication.
- No browser export, headless export, or isolated source preview is reported as
  Unity closure.
- No flag-day conversion of all art is required before the pipeline becomes
  useful.

## 14. Resume checklist

When this plan is resumed:

1. inspect the current worktree and source ownership before relying on this
   snapshot;
2. confirm the active importers and generated-output policy;
3. start with Phase A and one representative workhorse/machine pair;
4. stop for visual approval of the editor round trip and compiled fidelity;
5. qualify the iPad path before choosing an editor as the documented default;
   and
6. keep Unity Candidate proof separate from production promotion and commit.
