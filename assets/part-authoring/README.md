# Terrarium part-authoring starters

This directory contains deterministic, machine-generated starting documents
for the strict character-part SVG pipeline. Regenerate them with:

```bash
npm run parts:scaffolds
```

Do not edit files inside `scaffolds/` or `palettes/` in place; builds verify
their exact bytes. Copy a complete three-facing scaffold set to a separate
working directory, edit the copies, and place approved exports under
`assets/parts/<slot>/<slug>.<facing>.svg`.

The current supported starters are:

- `scaffolds/head/round.{south,east,north}.svg`
- `scaffolds/hair/bob.{south,east,north}.svg`
- `scaffolds/outfit/tee.{south,east}.svg` (seeded on `body-balanced`)

They are seeded with the current production geometry, so they support a true
source/edit/import proof rather than requiring a redraw. The tee starter shows
the `body-balanced` reference silhouette plus neck, chest, waist, and hem rig
guides; only its neckline detail is imported. Body and accessory starters wait
for their corresponding import adapters.

## Canonical headless workflow

1. Copy a complete scaffold set to a working directory (three facings for
   heads/hair; south and east for the tee, whose north kit is intentionally
   empty).
2. Edit only `art/*` and `detail/*` paths. Preserve unique semantic IDs, the
   `0 0 128 128` viewBox, exact sentinel paint, and explicit nonzero fill.
   Head eyes remain literal neutral-ink paths under `detail/*`, after the
   `$skin` silhouette; north-facing heads normally omit them.
3. Place all three reviewed sources under
   `assets/parts/<slot>/<slug>.<facing>.svg`.
4. Run `npm run parts:import`, then `npm run parts:check`.
5. Regenerate only the expected compositor snapshots and inspect the rendered
   result at production and zoom-strip sizes.

The gate is whether committed canonical SVG validates, compiles
deterministically, changes only intended snapshots, and passes visual review —
not whether a named editor preserves it.

## Optional visual-editor use

- Each scaffold embeds all five sentinel swatches. The ASE companion supports
  editors that import Adobe Swatch Exchange; GPL supports GIMP/Inkscape-style
  palettes; the SVG palette is the readable reference.
- Lock `guide/*`, `reference/*`, `anchors`, and `swatches` after opening if the
  editor supports layer locking. Lock state is not portable and the importer
  ignores those groups by semantic ID.
- Convert primitives to paths before export. Preserve object IDs, hexadecimal
  colors, the viewBox, and nonzero fill; disable rasterization. Supported
  transforms do not need flattening because the importer bakes them.
