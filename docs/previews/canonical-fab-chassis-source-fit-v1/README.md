# Canonical FAB chassis production validation v1

Status: **approved and promoted to canonical production source on 2026-08-02**

This validation independently compiles the three canonical SVGs through the
strict part parser and compares them with the generated `fixed-body-art`
receiver used by the real construction-worker compositor.

## Ownership boundary

- `body-large-frame`: canonical SVG body hull.
- `outfit-fab-chassis`: canonical SVG chassis, fixed to `body-large-frame`.
- `head-fab`: canonical SVG machine head.
- pose/arm layer: intentionally procedural shared rig geometry and attachments.
- Terrarium compositor: assembly, z-order, palette resolution, mirroring, and baking.
- Unity: consumes baked sheets/layers; no SVG parsing or shape generation.

## Pixel evidence (512 px)

- south: source/direct-compile 0px; direct/live 0px (max delta 0)
- east: source/direct-compile 0px; direct/live 0px (max delta 0)
- north: source/direct-compile 0px; direct/live 0px (max delta 0)

## Source SHA-256

- south: 0d0e6a6c48fd8223feaafe56ff8034d8c1441d7fc92a3cce7bcf62153a78b32d
- east: 200ab46ca22d709bd9eda38cde695a03b8dfa98c9c931cdef110dcf844fa5b80
- north: a1dbe5417cd9bf62e9400bf2f5149322730694f43e0907d958a3a82c575193ec

The former handwritten `anchoredFabChassis()` geometry has been removed.
This promotion changes character source authority only; recipe ids, export
schema, Unity registration, shared body rig, and procedural pose/arm layers
remain unchanged.
