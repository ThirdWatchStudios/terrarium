# Canonical dress production validation v1

Status: **approved and promoted to canonical production source on 2026-08-02**

This validation compiles eighteen canonical complete SVGs: six production body
rigs times three authored facings. Each file owns the entire visible dress.
The production adapter only selects the exact body/facing
source and return its compiled shapes. It would not scale, fit, redraw, or
procedurally construct dress geometry. East remains the authored source for
the compositor's west mirror.

## Evidence

- 18/18 sources compile through the strict part parser.
- 18/18 palette-resolved source rasters match their direct compiled variants at 512 px.
- 18/18 direct compiled variants match the live imported receiver at 512 px.
- The gameplay sheet exercises every body, all facings including west mirroring, six poses, and 32/48/64 px reads.

## Ownership boundary

- Canonical SVGs own all visible dress geometry for the six production bodies.
- The importer validates all 18 files as one atomic source set.
- The runtime adapter owns only exact body/facing selection and z-order.
- The compositor owns east-to-west mirroring, pose assembly, palette resolution, and baking.
- Unity consumes baked sheets and layers; it does not parse SVGs or build the dress.
- Deprecated legacy body ids retain their dormant static compatibility facings; they are outside this six-body production source matrix.

The former handwritten `anchoredDress()` geometry has been removed. Recipe
ids, export schema, body rigs, pose geometry, and Unity registration remain
unchanged.
