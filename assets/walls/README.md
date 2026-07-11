# Authored wall sources

`bevel/` is the canonical fixed-light source kit for solid wall shading. It
contains exactly twelve strict 128×128 SVGs, in runtime registry order:

1. `edge-n`, `edge-e`, `edge-s`, `edge-w`
2. `convex-ne`, `convex-se`, `convex-sw`, `convex-nw`
3. `concave-ne`, `concave-se`, `concave-sw`, `concave-nw`

The SVG paths are fixed-light planes, not wall silhouettes or palette surfaces.
Every visible path therefore lives under a `detail/*` group, compiles with
`silhouette: false`, and uses only neutral `#FFFFFF` / `#000000` paint plus
opacity. The Office assembler supplies the contour as real nested geometry: a
near-black silhouette boundary begins two units inside exposed cell edges, the
palette material begins at eight, and authored faces meet that material edge.
Connected sides keep the original overhang on both layers, so they never acquire
an internal seam. The wall template still owns `$primary`, connected-side
overhang, the shared 256→47 blob mapping, material detail, atlas layout, and
export metadata.

Run:

```bash
npm run walls:import
npm run walls:import:check
npm run walls:preview
```

The importer rejects missing or extra files and emits the deterministic runtime
registry at `src/tiles/generated/importedWallBevelArt.ts`. Keep documentation in
this directory rather than inside `bevel/`; that source directory intentionally
accepts only the twelve SVG files.

The first production integration is approval-gated to `office-wall`. Other
solid wall templates retain the procedural bevel byte-for-byte, while glass and
curtain continue to bypass bevel shading entirely. The focused preview at
`docs/previews/wall-bevel-office-comparison.html` compares previous and authored
Office rendering across all 47 tiles, a complex room, palette swaps, and game
distances before the shared kit is promoted more broadly.
