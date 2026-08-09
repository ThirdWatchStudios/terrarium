# Authored wall sources

`bevel/` is the canonical fixed-light source kit for solid wall shading. It
contains exactly twelve strict 128×128 SVGs, in runtime registry order:

1. `edge-n`, `edge-e`, `edge-s`, `edge-w`
2. `convex-ne`, `convex-se`, `convex-sw`, `convex-nw`
3. `concave-ne`, `concave-se`, `concave-sw`, `concave-nw`

The SVG paths are topology planes, not wall silhouettes. Every visible path
therefore lives under a `detail/*` group, compiles with `silhouette: false`, and
uses neutral `#FFFFFF` / `#000000` source paint plus opacity. The current five
core templates reuse those paths as actual palette material: `$primary` cap,
`$secondary` front, and `$accent` north lip/side returns/corners. The imported
crease paint is omitted. Each assembler supplies the contour as real nested
geometry: a near-black silhouette boundary begins two units inside exposed cell
edges, the palette material begins at eight, and the material faces meet that
edge. Connected sides keep the original overhang on both layers, so they never
acquire an internal seam or need a semantic room-side orientation.

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

The production build vocabulary is Office, Brick, Panel, Cubicle, and Wood
Slat. `docs/previews/quiet-wall-core-set-v4/` is the current production
validation at family, gameplay, and topology scales. Glass, Curtain, Demising,
Living, and Branded remain registered only for legacy project compatibility;
new projects, generators, and add-wall controls do not emit them. The older
`wall-bevel-office-comparison.html` and `wall-preview-opaque-walls.html` proofs
remain historical diagnostics for the source kit rather than statements of the
current build catalog.

The material-aware door openings for this five-family vocabulary live under
`quota-co-building-openings-v2/`. Their frame is part of the wall face, not a
top-surface mask; twenty internal render sources still resolve through one
player-facing `door` template.
