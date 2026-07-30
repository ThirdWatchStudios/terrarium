# QuotaCo floor and grass SVG calibration

Status: **review-only; no production source creation**

The current floor and ground art is SVG output generated from `src/tiles/templates.ts`. There are no standalone artist-editable floor or ground source files.

- Interior floor instances in the first slice: 12
- Grass ground instances in the first slice: 3
- FloorTemplate implementations in the shared registry: 19
- Standalone source SVGs: 0

The sheet compares Institutional Grid, Used Campus, and Maintained Hybrid at close, normal, and far gameplay reads. The derived 47-frame grass-fringe remains code-owned context until a base grass direction is accepted.

No templates, defaults, snapshots, exporter behavior, schema, bundle, Unity registration, or production art changed.
