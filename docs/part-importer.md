# Authored SVG part importer

`scripts/importParts.ts` is the build-time compiler for the first character-art
intake. It accepts a deliberately small SVG dialect, validates the full source
set in memory, and emits `src/parts/generated/importedPartArt.ts` only after
every file succeeds.

The generated data is an **appearance overlay** on an existing selectable
production part. Static head/hair registration replaces matching facing
geometry. The dedicated `body-art` mode updates the already-shared production
body `PartDef` in place, while the explicit `outfit-tee` adapter replaces the
detail shapes returned by its body-aware builder for known production bodies.
In every mode labels, picker order, seeded-generation order, anchors, z-order,
body rigs, and other runtime metadata remain owned by the handwritten
`PartDef`.

## Commands

```bash
npm run parts:import  # update imported art, then refresh dependent scaffolds
npm run parts:check   # validate sources and fail if the module is stale
npm run parts:scaffolds # regenerate seeded SVG starters and palette files
```

`npm run build` begins with `parts:check`; builds never rewrite source files.

The generated authoring assets live under `assets/part-authoring`: seeded
scaffolds for all five production bodies, all six human-head families,
representative `hair-short`, `hair-bob`, and `hair-long-straight` families, and
the south/east tee starters, plus ASE, GPL, and readable SVG sentinel palette
companions for optional editors. Their directory README defines the canonical
editor-agnostic workflow. Layer locking is only an editing convenience;
semantic IDs determine which groups the importer ignores.

## Source convention

Sources live below `assets/parts`:

```text
assets/parts/<slot>/<slug>.<facing>.svg
```

For example, `assets/parts/body/compact.south.svg` targets `body-compact`,
`assets/parts/hair/bob.south.svg` targets `hair-bob`, and
`assets/parts/outfit/tee.south.svg` targets `outfit-tee`. Filenames and
directories are lowercase. Authored facings are `south`, `east`, and `north`;
west is the runtime mirror of east. Once any facing of a part is present, the
complete facing set declared by its explicit import target must be present.
Body and static head/hair targets require all three source facings. Tee
deliberately requires south and east only; its north detail remains empty.
Putting a valid complete set in this canonical directory makes it compiler
input; visual acceptance remains a separate Definition of Done gate.

The importer currently accepts:

- `body`, authored around canvas point `(64, 87)`, through the explicit
  complete-facing `body-art` adapter.
- `head` and `hair`, authored around canvas point `(64, 44)`.
- `outfit-tee` as an anchored-detail target, authored over `body-balanced`
  around the body origin `(64, 87)`. Its neck is canvas point `(64, 58)`, and
  the canonical source set is `tee.south.svg` plus `tee.east.svg`.

The east-facing head placement adjustment remains compositor-owned. The
compiler always subtracts the stable `(64, 44)` authoring origin after it
validates static head/hair geometry in full 128-space. Outfit and body geometry
use `(64, 87)`, keeping canonical sources in body-local coordinates. Body art
is validated after applying that canvas translation but deliberately preserves
its established local `d` strings byte-for-byte; visible body paths must remain
directly under the canonical translation group.

`hair-short` and `hair-long-straight` also preserve their canonical local path
strings after canvas validation. Their arc-heavy geometry measurably
changes under generic flattening even at production sizes, so those explicit
targets require visible paths directly under `translate(64 44)`. This is a
targeted migration guarantee; Bob and deliberately re-authored static parts
retain the normal transform-baking path.

## Sentinel palette

The five exact, opaque sentinel colors compile to character palette tokens:

| Authoring color | Runtime paint |
| --- | --- |
| `#FF00FF` | `$skin` |
| `#00FFFF` | `$hair` |
| `#FF0000` | `$outfitPrimary` |
| `#00FF00` | `$outfitSecondary` |
| `#0000FF` | `$accent` |

Other paint must be a literal `#RRGGBB` or `#RRGGBBAA` used for
style-neutral detail. A detail shape may use literal fill and stroke, or one
palette token (in either or both channels), but it may not mix a token with a
literal or combine two different tokens. Silhouette paths use fill or stroke,
not both, because the compositor's fill-outline branch cannot include a source
stroke width. Character layers tint one shape as one bucket, so unsupported
paint combinations cannot round-trip faithfully.

Paint buckets must also remain contiguous in document order. For example,
`$hair → literal → $hair` is rejected because the layer-atlas exporter would
coalesce both hair shapes ahead of the literal run and change overlap order.
Facing files must agree on relative bucket order for the same reason.

## Accepted SVG dialect

- One `viewBox="0 0 128 128"` root; optional width/height must be `128` or
  `128px`.
- Visible elements are groups and paths only. Convert editor primitives to
  curves before export.
- Flat fill/stroke paint via presentation attributes or inline style.
- Nested `matrix`, `translate`, `scale`, `rotate`, `skewX`, and `skewY`
  transforms. The compiler bakes them into path data for normal static and
  anchored-detail imports. Byte-stable body art instead requires the one
  canonical `translate(64 87)` group and no additional visible-path transform.
- Stroke width is unitless. Strokes must explicitly use round linecaps and
  linejoins, matching the compositor.
- Path opacity is supported from `(0, 1]`; group opacity is rejected because a
  flattened `ShapeSpec[]` cannot preserve group compositing.
- Every filled visible path must resolve the nonzero fill rule. An ancestor
  `evenodd` default is tolerated only when the visible path explicitly
  overrides it with `fill-rule="nonzero"`.

SVGO runs with an explicit conservative plugin list. Its default preset is not
used because ID cleanup, group collapse, and path merging would destroy layer
semantics and palette boundaries.

The importer rejects gradients, patterns, filters, masks, clip paths, text,
images, `use`, nested SVG viewports, CSS classes/stylesheets, event handlers,
links, unsupported attributes or units, invisible/zero-coverage paint, invalid
paths, non-finite values, and painted bounds outside the 128 canvas. Silhouette
bounds include stroke radius plus the widest shipped compositor outline.
Non-uniform scale or skew on a stroked path is also rejected
because `ShapeSpec` has only one scalar stroke width.

## Layer IDs

- `detail` and `detail/*` descendants compile with `silhouette: false`.
- `guide/*`, `reference/*`, `swatches`, and `anchors` are ignored and never
  emitted as character art. Those reference groups may be faded or hidden.
- All IDs must remain unique.

Heads own their eyes so placement can vary with the face contour. Eye paths use
literal neutral ink under `detail/*`; they remain non-silhouette shapes and
must follow the `$skin` silhouette in paint order. North-facing heads normally
omit them.

The approved human-head production batch is `head-oval`, `head-boxy`, `head-long`,
`head-angular`, and `head-soft-square`, each with south/east/north sources.
These 15 canonical sources are registered through the same static overlay as
`head-round` and passed user visual approval plus the automated distance,
palette, portrait, hair/accessory, and full compatibility reviews on
2026-07-10.

Slash-based IDs are canonical compiler input and are covered by automated
fixtures. Any optional editor must preserve them, but editor compatibility is
an interoperability smoke test rather than a production gate. The importer
does not silently infer lost detail semantics.

## Generated registration and provenance

The generated module records repository-relative source paths and a
`sourceKind`: `authored` is deliberate canonical repo SVG regardless of tool,
`generated` is generator-owned and reproducible, and `curated` is selected and
frozen generator output. That audit manifest is a separate generated export;
the browser library imports only geometry, so bundling drops source paths and
provenance. The metadata is not added to `PartDef`, recipes, layer exports, or
the tool/sim contract.

Unknown, legacy-only, and internal part IDs are rejected. Duplicate imports,
slot mismatches, missing production variants, and unadapted targets with
`buildVariant` are rejected before the generated file changes.

The five `body-art` targets own the complete visible facing shapes for
`body-compact`, `body-balanced`, `body-large-frame`, `body-tall`, and
`body-soft`. South and east contain the `$outfitPrimary` silhouette followed
by a literal lower-plane detail; north is silhouette-only. Installation mutates
only the shared production object's facing art and clones each imported shape.
The exact `PartDef`, `bodyAnchors`, label, intent, z-order, and stable selection
order are preserved. `body-standard`, `body-slim`, and `body-broad` remain
resolvable legacy fallbacks and are not import targets.

Generated body scaffolds expose all 11 typed rig points plus `bodyOrigin` as
ignored guides. This promotion does not infer rig data from SVG; the
TypeScript-owned anchors remain authoritative.

`outfit-tee` is the first explicit exception to the static-overlay rule. Every
visible tee path must live under `detail` or `detail/*`, so all compiled shapes
have `silhouette: false`: the selected body remains the conforming
`$outfitPrimary` torso. The importer treats `body-balanced` as the source
placement, translates the south/east kit from its neck to each target neck, and
emits variants in stable order for `body-compact`, `body-balanced`,
`body-large-frame`, `body-tall`, and `body-soft`. Every translated path is
paint-bounds-validated again in its target canvas placement. At runtime the
overlay replaces only those known detail variants and preserves the original
builder's z-order. Legacy bodies, deliberately unauthored facings, and future
body IDs continue through the original procedural builder/static fallback.

This is a mechanical intake proof. The authored tee still requires visual
approval and the remaining per-part Definition of Done checks.

## Intentionally deferred adapters

- Componentized multi-piece outfit aggregation and multi-anchor deformation.
  Tee is one combined neckline kit per authored facing and needs only neck
  translation. Blazer is the next adapter boundary: lapels, buttons, and pocket
  must remain separately addressable and require explicit deterministic piece
  order plus neck/chest/hip/waist placement. Do not collapse that work into one
  flat per-facing Blazer file.
- New part definitions and their labels/insertion order.
- Accessory anchors, z-order, and hand-attachment roles.
- Importing the full eleven-point body sub-rig from an anchor layer.

Those need explicit manifests/adapters. The initial headless
scaffold-to-runtime `hair-bob` proof and the first canonical head promotion
(`head-round`) are visually approved and committed. The other five head sources
are approved in the current production batch. The tee anchored-detail mechanics
are complete; its visual approval remains a separate gate, and componentized
Blazer intake remains the next outfit adapter boundary. The approved bodies
also have canonical SVG sources and a shared-identity adapter. The current
art-production priority is the representative Short/Medium/Long hair batch
before detail-only Blazer or wall work.
