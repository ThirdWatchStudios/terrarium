# Authored SVG part importer

`scripts/importParts.ts` is the build-time compiler for the first character-art
intake. It accepts a deliberately small SVG dialect, validates the full source
set in memory, and emits `src/parts/generated/importedPartArt.ts` only after
every file succeeds.

The generated data is an **appearance overlay** on an existing selectable
production part. Static head/hair registration replaces matching facing
geometry. The dedicated `body-art` mode updates the already-shared production
body `PartDef` in place. The `fixed-body-art` mode installs the complete
SVG-owned `outfit-fab-chassis` overlay only when the recipe uses
`body-large-frame`; no handwritten geometry or cross-rig fallback remains.
The `body-variant-art` mode installs the complete eighteen-file
`outfit-dress` matrix and selects one exact SVG by production body id and
facing; it performs no fit, scale, translation, or geometry reconstruction and
does not fabricate an unknown-body source variant. Deprecated legacy-body
recipes retain the static compatibility facings on the base `PartDef`; those
records are outside the six-body production matrix.
The explicit `outfit-tee` adapter replaces the detail shapes returned by its
body-aware builder for known production bodies.
The `outfit-blazer` component adapter does the same after deterministically
aggregating separately authored lapels, buttons, and pocket pieces;
`outfit-polo` reuses that contract for independent collar and placket pieces.
`outfit-shirt-tie` then reuses it for independent collar and tie pieces. In
turn, `outfit-turtleneck` exercises a component with authored south/east/north
facings. `outfit-cardigan` then separates upper-torso trim from its lower-torso
opening seam and button line. `outfit-suit-jacket` extends the same component
frames to formal lapels, buttons, pocket, tie, pocket square, and notches. In
turn, `outfit-hoodie` uses a three-facing hood plus only the directional
drawstring and pocket pieces that exist. `outfit-vest` follows with a
south-only panel, V-neck inset, and buttons. In every mode labels, picker order,
seeded-generation order, anchors, z-order, body rigs, and other runtime
metadata remain code-owned; the SVGs own the imported visible art.

## Commands

```bash
npm run parts:import  # update imported art, then refresh dependent scaffolds
npm run parts:check   # validate sources and fail if the module is stale
npm run parts:scaffolds # regenerate seeded SVG starters and palette files
```

`npm run build` begins with `parts:check`; builds never rewrite source files.

The generated authoring assets live under `assets/part-authoring`: seeded
scaffolds for all six production bodies, all six human-head families,
all ten mapped hair families (`hair-short`, `hair-bob`, `hair-bun`,
`hair-curly`, `hair-balding`, `hair-side-part`, `hair-pixie`,
`hair-ponytail`, `hair-long-straight`, and `hair-coils`), and the south/east tee
starters plus six componentized Blazer, four componentized Polo, four
componentized Shirt + Tie, three Turtleneck starters, four Cardigan starters,
and twelve Suit Jacket starters plus six Hoodie and three Vest starters, plus
ASE, GPL, and readable SVG sentinel palette companions for optional editors. Their directory
README defines the canonical editor-agnostic workflow. Layer locking is only
an editing convenience; semantic IDs determine which groups the importer
ignores.

## Source convention

Sources live below `assets/parts`:

```text
assets/parts/<slot>/<slug>[.<component>].<facing>.svg
```

For example, `assets/parts/body/compact.south.svg` targets `body-compact`,
`assets/parts/hair/bob.south.svg` targets `hair-bob`, and
`assets/parts/outfit/tee.south.svg` targets `outfit-tee`.
`assets/parts/outfit/blazer.lapels.south.svg` targets the `lapels` component
of `outfit-blazer`; `assets/parts/outfit/polo.collar.east.svg` targets the
profile `collar` component of `outfit-polo`. Filenames and directories are
lowercase. Authored facings are `south`, `east`, and `north`; west is the
runtime mirror of east. Once any facing of a part or declared component is
present, its complete manifest set must be present. Body and static head/hair
targets require all three source facings. Tee and each Blazer/Polo/Shirt + Tie
or Cardigan/Suit Jacket component deliberately require south/east only; their
north detail remains on the handwritten fallback. Turtleneck explicitly
requires south/east/north. Hoodie declares its asymmetric component facings;
Vest declares south-only detail.
`fab-chassis.south.svg`, `fab-chassis.east.svg`, and
`fab-chassis.north.svg` form one complete fixed-body source set and are accepted
only for the `body-large-frame` receiver declared in the import catalog.
`dress.<body-id>.<facing>.svg` forms one atomic `body-variant-art` set: all six
production body ids and all three authored facings must be present before the
generated receiver can change.
Putting a valid complete set in this canonical directory makes it compiler
input; visual acceptance remains a separate Definition of Done gate. These
static hair overlays remain the canonical authored source and fallback
geometry even when a production composition route applies a head-aware fitted
variant.

The importer currently accepts:

- `body`, authored around canvas point `(64, 87)`, through the explicit
  complete-facing `body-art` adapter.
- `head` and `hair`, authored around canvas point `(64, 44)`.
- `outfit-fab-chassis` as complete three-facing `fixed-body-art`, authored over
  `body-large-frame` around `(64, 87)`. Its SVGs own every visible chassis
  plane, panel, seam, and optic; the adapter owns only body-id gating, facing,
  west mirroring, body anchor, and z-order.
- `outfit-dress` as complete eighteen-file `body-variant-art`, with one
  independently authored south/east/north source set for each of the six
  production body ids around `(64, 87)`. Its SVGs own the complete skirt
  silhouette, neckline/collar, waist treatment, and seams; the adapter owns
  only exact body/facing selection and z-order.
- `outfit-tee` as an anchored-detail target, authored over `body-balanced`
  around the body origin `(64, 87)`. Its neck is canvas point `(64, 58)`, and
  the canonical source set is `tee.south.svg` plus `tee.east.svg`.
- `outfit-blazer` as a component-detail target authored over the same body.
  Its canonical source is six files: south/east for each of `lapels`,
  `buttons`, and `pocket`.
- `outfit-polo` as a component-detail target authored over the same body.
  Its canonical source is four files: south/east for `collar` and `placket`.
- `outfit-shirt-tie` as a component-detail target authored over the same body.
  Its canonical source is four files: south/east for `collar` and `tie`.
- `outfit-turtleneck` as a component-detail target authored over the same
  body. Its canonical source is three `neck-band` files: south/east/north.
- `outfit-cardigan` as a component-detail target authored over the same body.
  Its canonical source is four south/east files: upper-torso `trim` and
  lower-torso `button-line`.
- `outfit-suit-jacket` as a component-detail target authored over the same
  body. Its canonical source is twelve south/east files for `pocket-square`,
  `lapels`, `buttons`, `pocket`, `tie`, and `notches`.
- `outfit-hoodie` as a component-detail target authored over the same body.
  Its canonical source is six files: three-facing `hood`, south/east
  `drawstrings`, and south-only `pocket`.
- `outfit-vest` as a component-detail target authored over the same body. Its
  canonical source is three south-only files: `panel`, `neck-inset`, and
  `buttons`.

The east-facing head placement adjustment remains compositor-owned. The
compiler always subtracts the stable `(64, 44)` authoring origin after it
validates static head/hair geometry in full 128-space. Outfit and body geometry
use `(64, 87)`, keeping canonical sources in body-local coordinates. Body art
is validated after applying that canvas translation but deliberately preserves
its established local `d` strings byte-for-byte; visible body paths must remain
directly under the canonical translation group.

Curly and Coils preserve their authored local arc paths through
`head-fitted-art`; generic arc flattening dropped Curly's 32 px separation from
Short below the accepted family-distance floor. Both targets require visible
paths directly under `translate(64 44)`. Bob, Short, Bun, Ponytail, Long
straight, Balding, Pixie, and Side-part retain the normal transform-baking path
as approved interoperability controls.

For all ten mapped hair IDs, the compositor resolves a fixed fitted variant
from the selected production head ID. All ten mapped hairstyles are complete
source-owned routes: `head-fitted-art` compiles each three-facing SVG set through six
declarative head envelopes into ordinary generated `PartVariant` records.
Editing any of these canonical source sets, then running `npm run parts:import`, changes
that style's live all-head geometry; there is no second path builder or silent
human-head fallback for any mapped hairstyle. No fit metadata,
`buildVariant`, recipe field, or export-schema field is added. Flat and
reconstructable routes share the resolver.

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
  anchored-detail imports. Byte-stable body, body-variant, and fixed-body art instead
  require the one canonical `translate(64 87)` group and no additional
  visible-path transform.
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

The six `body-art` targets own the complete visible facing shapes for
`body-compact`, `body-balanced`, `body-large-frame`, `body-tall`, and
`body-soft`, plus the independent `body-pinch`. South and east contain the
`$outfitPrimary` silhouette followed by a literal lower-plane detail; north is
silhouette-only. Installation mutates
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
`body-large-frame`, `body-tall`, `body-soft`, and `body-pinch`. Every translated path is
paint-bounds-validated again in its target canvas placement. At runtime the
overlay replaces only those known detail variants and preserves the original
builder's z-order. Legacy bodies, deliberately unauthored facings, and future
body IDs continue through the original procedural builder/static fallback.

The authored Tee received focused visual approval on 2026-07-27; the broader
scene-preview and stress gates remain open.

`outfit-blazer` is the first multi-piece adapter. The manifest fixes component
order and per-facing shape counts, so missing, flattened, or extra source
pieces fail before generated output changes. Lapels scale and translate inside
an upper-torso frame derived from neck, shoulder, and chest anchors. Buttons
and pocket use a lower-torso frame derived from chest, waist, and hip anchors.
Scale is conservatively bounded, stroke widths remain stable for distance
readability, and every fitted path is canvas-validated again. Runtime
installation still produces an ordinary `body-detail` overlay: no component
metadata enters recipes, exports, or Unity.

`outfit-polo` is the first direct reuse of that multi-piece contract. Collar
and placket remain separately authored and both consume the upper-torso frame,
so a narrow profile can move the opening without flattening the two source
roles together. South/east art replaces only known production-body variants;
north, legacy, and future bodies preserve the code-builder fallback.

`outfit-shirt-tie` is the second direct reuse. Collar and tie remain separate
sources and both consume the upper-torso frame, preserving a narrow profile tie
without flattening it into the collar. The east tie sits at the forward torso
edge and west mirrors that placement; it must not run through the profile
torso center. South/east art replaces only known production-body variants;
north, legacy, and future bodies preserve the code-builder fallback.

`outfit-turtleneck` extends that contract to a component with all three
authored facings. Its neck band and south fold remain one semantic component;
south/east/north are fitted through the upper-torso frame and rise behind the
head to bridge the 3 px head/torso gap, while west mirrors east. The band must
use `outfitPrimary`, must not collapse into a detached chest mark, and keeps a
wider profile footprint so east/west retain comparable collar weight to
south/north. Legacy and future bodies preserve the code-builder fallback.

`outfit-cardigan` returns to the south/east contract with two independent
frames. The contrasting neckline `trim` consumes the upper-torso frame, while
the opening seam and two buttons remain one `button-line` component fitted
through the lower-torso frame. West mirrors east; north, legacy, and future
bodies preserve the code-builder fallback.

`outfit-suit-jacket` reuses the approved Blazer frame split while keeping its
formal vocabulary independently authorable. Pocket square, buttons, and pocket
use the lower-torso frame; lapels, tie, and notches use the upper-torso frame.
The east tie stays at the forward torso edge and west mirrors it rather than
running through the profile center. North, legacy, and future bodies preserve
the code-builder fallback.

`outfit-hoodie` is the first asymmetric component-facing manifest after the
three-facing Turtleneck. The hood is authored in south/east/north through the
upper-torso frame; drawstrings exist only in south/east through that same
frame; the kangaroo-pocket seam exists only in south through the lower-torso
frame. West mirrors east. Missing directional components intentionally paint
nothing rather than inventing rear or profile detail.

`outfit-vest` fits the secondary-fabric torso `panel` and contrasting
`neck-inset` through the upper-torso frame, preserving the primary-fabric
sleeve field around them. Its front `buttons` use the lower-torso frame. All
three components exist only in south: east/west intentionally carry no vest
overlay, while north retains the code-builder rear fallback. Legacy and future
bodies follow the same facing rule.

## Intentionally deferred adapters

- Component manifests for the remaining conforming outfits. Tee remains one
  combined neckline kit; Blazer, Polo, Shirt + Tie, Turtleneck, Cardigan, and
  Suit Jacket, Hoodie, and Vest establish the component boundary that pockets
  and trim can reuse where their vocabulary genuinely matches.
- Further new part definitions and their labels/insertion order.
- Accessory anchors, z-order, and hand-attachment roles.
- Importing the full eleven-point body sub-rig from an anchor layer.

Those need explicit manifests/adapters. The initial headless
scaffold-to-runtime `hair-bob` proof and the first canonical head promotion
(`head-round`) are visually approved and committed. The other five head sources
are approved in the current production batch. The Tee and Blazer detail
mechanics and art are approved; Polo mechanics and art are approved as well.
Shirt + Tie mechanics and art are approved as well. The accepted six-body
redesign, including independent Pinch, has canonical SVG sources and a
shared-identity adapter. Turtleneck mechanics and art are approved. The first six
hair families are approved. Bun, Balding, Pixie, and Side-part complete the
mapped source set, pass automated production review, and received visual
approval on 2026-07-10. The remaining conforming outfits can now follow the
component-detail contract proven by Blazer and reused by Polo, Shirt + Tie,
and Turtleneck. Cardigan, Suit Jacket, and Hoodie mechanics and art are
approved. Vest mechanics and art received approval on 2026-07-28.
