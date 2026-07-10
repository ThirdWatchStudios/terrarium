# Terrarium part-authoring starters

This directory contains deterministic, machine-generated starting documents
for the strict character-part SVG pipeline. Regenerate them with:

```bash
npm run parts:scaffolds
```

Do not edit files inside `scaffolds/` or `palettes/` in place; builds verify
their exact bytes. Copy a complete three-facing scaffold set to a separate
working directory, edit the copies, and place canonical review sources under
`assets/parts/<slot>/<slug>.<facing>.svg`.

The current supported starters are:

- `scaffolds/body/{compact,balanced,large-frame,tall,soft}.{south,east,north}.svg`
- `scaffolds/head/{round,oval,boxy,long,angular,soft-square}.{south,east,north}.svg`
- `scaffolds/hair/bob.{south,east,north}.svg`
- `scaffolds/outfit/tee.{south,east}.svg` (seeded on `body-balanced`)

They are seeded with the current production geometry, so they support a true
source/edit/import proof rather than requiring a redraw. The tee starter shows
the `body-balanced` reference silhouette plus neck, chest, waist, and hem rig
guides; only its neckline detail is imported. Each body starter shows its full
visible production art plus generated markers for all 11 typed rig points and
`bodyOrigin`. Those `guide/*`, `reference/*`, and `anchors` paths are context
only: the current rig remains TypeScript-owned and is never imported from the
scaffold. Accessory starters still wait for their corresponding adapter.

The oval, boxy, long, angular, and soft-square head families form one complete
15-SVG approved production batch. Their scaffolds and canonical source sets
compile through the existing static-head importer and passed the distance,
palette, portrait, hair/accessory, and full compatibility reviews on
2026-07-10.

## Canonical headless workflow

1. Copy a complete scaffold set to a working directory (three facings for
   bodies, heads, and hair; south and east for the tee, whose north kit is
   intentionally empty).
2. Edit only `art/*` and `detail/*` paths. Preserve unique semantic IDs, the
   `0 0 128 128` viewBox, exact sentinel paint, and explicit nonzero fill.
   Head eyes remain literal neutral-ink paths under `detail/*`, after the
   `$skin` silhouette; north-facing heads normally omit them.
3. Place the complete source set under
   `assets/parts/<slot>/<slug>.<facing>.svg`.
4. Run `npm run parts:import`, then `npm run parts:check`.
5. Regenerate only the expected compositor snapshots and inspect the rendered
   result at production and zoom-strip sizes.

The gate is whether committed canonical SVG validates, compiles
deterministically, changes only intended snapshots, and passes visual review —
not whether a named editor preserves it.

The approved body and head sets now have canonical sources. Silhouette work
moves next to representative hair families; detail-only Tee refinement, the
componentized Blazer adapter, and wall bevel/detail work follow that pass.

## Optional visual-editor use

- Each scaffold embeds all five sentinel swatches. The ASE companion supports
  editors that import Adobe Swatch Exchange; GPL supports GIMP/Inkscape-style
  palettes; the SVG palette is the readable reference.
- Lock `guide/*`, `reference/*`, `anchors`, and `swatches` after opening if the
  editor supports layer locking. Lock state is not portable and the importer
  ignores those groups by semantic ID.
- Convert primitives to paths before export. Preserve object IDs, hexadecimal
  colors, the viewBox, and nonzero fill; disable rasterization. Supported
  transforms normally do not need flattening because the importer bakes them.
  Body art is deliberately stricter: keep each visible path directly beneath
  the canonical `translate(64 87)` art group so its established local path data
  remains byte-stable.
