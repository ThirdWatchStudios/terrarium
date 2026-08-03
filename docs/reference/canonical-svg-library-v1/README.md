# Terrarium canonical SVG library

Status: **generated reference; no production mutation**

This directory is the visual index for Terrarium's current genuine,
artist-editable SVG source library. It renders the exact source files selected
by the live import registries; it does not reconstruct the art from TypeScript.

## Open the guide

- [Complete one-sheet](./overview.svg) ([PNG](./overview.png))
- [Character sources](./characters.svg) ([PNG](./characters.png))
- [Props and surfaces](./props-surfaces.svg) ([PNG](./props-surfaces.png))
- [Wall system](./walls.svg) ([PNG](./walls.png))
- [Machine-readable manifest](./manifest.json)
- [Browser index](./index.html)

## Current inventory

- 332 exact SVG source files
- 254 production sources
- 74 live production dependencies
- 4 accepted-but-deferred concepts
- 47 composed equal-height wall frames shown for context

The four deferred gameplay concepts remain source-only. They are visible so the
library can be judged as a whole, but they have no live registration or active
production queue.

## Grass-fringe deferral

The 47-frame `grass-fringe` remains code-owned and is explicitly deferred.
This guide adds no transition SVGs and makes no exporter, schema, or Unity
change. Reopen the fringe only as a separate visual proof and approval slice.

## Deliberate exclusions

- `assets/part-authoring/scaffolds/**/*.svg` — 113: Generated artist scaffolds mirror production geometry but are not canonical source truth.
- `assets/walls/quota-co-building-system{,-proofs}/**/*.svg (inactive)` — 62: Retained technical and proof files not referenced by the live canonical 47-frame mapping.
- `assets/part-authoring/palettes/*.svg` — 1: Importer palette sentinels are authoring infrastructure, not game assets.

## Regenerate

```bash
npm run assets:reference:guide
npm run assets:reference:guide:check
```

The check command fails when a canonical source, importer selection, manifest,
sheet, or raster is stale.
