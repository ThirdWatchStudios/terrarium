# Authored SVG part importer

`scripts/importParts.ts` is the build-time compiler for the first character-art
intake. It accepts a deliberately small SVG dialect, validates the full source
set in memory, and emits `src/parts/generated/importedPartArt.ts` only after
every file succeeds.

The generated data is an **appearance overlay** on an existing selectable
production part. Registration replaces matching facing geometry in place, so
labels, picker order, seeded-generation order, anchors, z-order, body rigs, and
other runtime metadata remain owned by the handwritten `PartDef`.

## Commands

```bash
npm run parts:import  # validate sources and update the committed module
npm run parts:check   # validate sources and fail if the module is stale
```

`npm run build` begins with `parts:check`; builds never rewrite source files.

## Source convention

Sources live below `assets/parts`:

```text
assets/parts/<slot>/<slug>.<facing>.svg
```

For example, `assets/parts/hair/bob.south.svg` targets `hair-bob`. Filenames
and directories are lowercase. Authored facings are `south`, `east`, and
`north`; west is the runtime mirror of east. Once any facing of a part is
present, the complete facing set already declared by its production `PartDef`
must be present.

Importer v1 accepts existing static production targets in these slots:

- `head` and `hair`, authored around canvas point `(64, 44)`.

The east-facing head placement adjustment remains compositor-owned. The
compiler always subtracts the stable `(64, 44)` authoring origin after it
validates geometry in full 128-space.

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
  transforms. The compiler bakes them into path data.
- Stroke width is unitless. Strokes must explicitly use round linecaps and
  linejoins, matching the compositor.
- Path opacity is supported from `(0, 1]`; group opacity is rejected because a
  flattened `ShapeSpec[]` cannot preserve group compositing.
- The nonzero fill rule only.

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

Whether Affinity Designer preserves the slash-based IDs is a hard gate for the
first real round trip. The importer does not silently infer lost detail
semantics.

## Generated registration and provenance

The generated module records repository-relative source paths and a
`sourceKind` (`authored`, `generated`, or `curated`). That metadata remains
internal to Terrarium: it is not added to `PartDef`, recipes, layer exports, or
the tool/sim contract.

Unknown, legacy-only, and internal part IDs are rejected. Duplicate imports,
slot mismatches, missing production variants, and targets with `buildVariant`
are rejected before the generated file changes.

## Intentionally deferred adapters

- Body-aware outfits: every human outfit currently uses `buildVariant`, so a
  flat SVG overlay would be accepted but bypassed during production rendering.
- Body art: the public body-archetype records and selectable library currently
  share the same `PartDef` objects. A body overlay must update that single
  source of truth rather than splitting their geometry.
- Outfit detail-piece aggregation and body-anchor deformation.
- New part definitions and their labels/insertion order.
- Accessory anchors, z-order, and hand-attachment roles.
- Importing the full eleven-point body sub-rig from an anchor layer.

Those need explicit manifests/adapters. The next proof is scaffolding and a
`hair-bob` Affinity export/reimport, where only the intended bob snapshots may
change.
