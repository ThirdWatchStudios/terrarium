# QuotaCo Maintained Hybrid floor and grass sources v1

Status: **accepted canonical SVG sources; production-wired in Terrarium**

This bank contains the artist-editable source files accepted from the QuotaCo
Maintained Hybrid complete-family proof:

- `floors/`: all 12 existing interior floor instances;
- `ground/`: the three existing grass instances.

Every file is a strict, flat `128 × 128` SVG with:

- the existing instance ID, tile kind, and template ID on the root;
- a title and description;
- semantic `substrate`, palette-detail, and literal-detail groups;
- stable IDs on every visible element;
- explicit `primary`, `secondary`, and `accent` paint-token metadata;
- no filters, gradients, embedded images, scripts, or editor-specific effects.

These SVGs are now the editable visual source for this accepted surface slice.
They are not generated during ordinary builds and may be changed directly by an
artist. The importer validates and compiles them deterministically, retaining
the semantic group and element IDs that the live parameter resolver uses.
`FLOOR_TEMPLATES` now registers the compiled sources for the 12 floor instances
and three grass instances. Existing defaults render the canonical SVG geometry
verbatim.

Existing parameters remain contract data. Non-default values derive bounded
variants from the source-owned semantic layers; the production validation
checks every parameter at its minimum and maximum.

The derived 47-frame `grass-fringe` remains outside this bank and code-owned
until the accepted base-grass source and edge-density rules receive their
separate fringe proof.
