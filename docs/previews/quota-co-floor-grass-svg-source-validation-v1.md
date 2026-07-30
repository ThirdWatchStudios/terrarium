# QuotaCo floor and grass canonical SVG import validation

Status: **canonical SVG sources compile deterministically into the live source registry**

15 artist-editable SVG sources compile deterministically. Source hashes, close/far raster deltas, and imported 4×2 repeat reads are recorded in the metrics file.

The generated module is consumed by `maintainedHybridSurfaceShapes()` and the live floor templates. Parameter behavior and live registration are covered by the separate production validation.

This mechanical gate makes no additional defaults, exporter, contract, schema, bundle, Unity, or commit change.
