# Authored wall sources

`bevel/` is the canonical fixed-light source kit for solid wall shading. It
contains exactly twelve strict 128×128 SVGs, in runtime registry order:

1. `edge-n`, `edge-e`, `edge-s`, `edge-w`
2. `convex-ne`, `convex-se`, `convex-sw`, `convex-nw`
3. `concave-ne`, `concave-se`, `concave-sw`, `concave-nw`

The SVG paths are fixed-light planes, not wall silhouettes or palette surfaces.
Every visible path therefore lives under a `detail/*` group, compiles with
`silhouette: false`, and uses only neutral `#FFFFFF` / `#000000` paint plus
opacity. Every opaque-wall assembler supplies the contour as real nested geometry: a
near-black silhouette boundary begins two units inside exposed cell edges, the
palette material begins at eight, and authored faces meet that material edge.
Connected sides keep the original overhang on both layers, so they never acquire
an internal seam. The wall template still owns `$primary`, connected-side
overhang, the shared 256→47 blob mapping, material detail, atlas layout, and
export metadata. Procedural material detail is clipped to the inset surface and
painted below the authored faces, so it cannot become an exterior outline.

Run:

```bash
npm run walls:import
npm run walls:import:check
npm run walls:preview
npm run walls:materials:preview
```

The importer rejects missing or extra files and emits the deterministic runtime
registry at `src/tiles/generated/importedWallBevelArt.ts`. Keep documentation in
this directory rather than inside `bevel/`; that source directory intentionally
accepts only the twelve SVG files.

The first production integration was the approved `office-wall` pilot. The
shared kit is now promoted to all eight opaque templates: Office, Cubicle,
Brick, Panel, Living, Branded, Slat, and Demising. Glass and Curtain remain
byte-identical on their procedural no-bevel paths. The focused preview at
`docs/previews/wall-bevel-office-comparison.html` compares previous and authored
Office rendering across all 47 tiles, a complex room, palette swaps, and game
distances. `docs/previews/wall-preview-opaque-walls.html` collects the shipped-
palette 47-tile and complex-room proof for every promoted opaque material. The
index displays each native whole-sheet PNG so responsive browser scaling cannot
introduce false seams between the SVG's independently clipped tile viewports;
each caption still links to the corresponding scalable SVG source.
