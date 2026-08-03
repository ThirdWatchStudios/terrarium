# Canonical UI foundation context review v1

Status: **review only; stopped before source extraction**

Terrarium currently exports 142 icon SVG receivers and four cursor PNG families,
but all 146 live shapes are still owned by TypeScript `ShapeSpec` builders.
There are no checked-in canonical UI or cursor SVG sources. Editing a generated
`icons/<id>.svg` cannot affect a later export.

This first bounded family contains eight foundational controls/trim glyphs and
four cursors. The sheets compare three ownership directions and show Direction A
at literal UI sizes on light and dark surfaces.

## Approval boundary

Approval chooses the source-extraction direction. It does not authorize source
creation, importer/receiver wiring, catalog changes, export, Unity import, or a
commit. Production remains unchanged until the later source/import fidelity gate
is separately approved.
