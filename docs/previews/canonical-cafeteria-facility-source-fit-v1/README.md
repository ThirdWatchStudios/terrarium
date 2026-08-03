# Canonical cafeteria facility production proof v1

Status: **browser export and fresh Unity import complete; runtime visual acceptance deferred**

The nine editable SVGs in `assets/props/quota-co-workhorse-v1/` are the
canonical Terrarium production sources approved on 2026-08-03. They preserve
semantic editor groups, the declared palette channels, projection declarations,
the service scanner's literal IRIS-green optic, source paint order, outline
pixels, and contact-shadow pixels.

The strict production importer compiles all nine successfully. Source, current
production, and imported output are pixel-identical at the real 128 px baked
cell. Directly rasterizing the normalized imported vector at non-bake sizes can
move a few antialiased boundary pixels; those bounded deltas are recorded in
`metrics.json` and do not exist in the exported 128 px atlas cell. The strict
import and production receiver are pixel-identical at every measured scale.

## Production boundary

This proof confirms that:

- the canonical workhorse bank owns the accepted sources;
- the read-only manifest/importer compiles them into the generated receiver;
- the nine templates use imported art lookups rather than handwritten geometry;
- IDs, projections, footprints, scanner behavior, clinical palette drain,
  export registration, and baked pixels remain protected.

The normal in-browser Terrarium export and fresh Unity import completed on
2026-08-03. The facilities do not yet have a viable in-game path, so this proof
does not claim gameplay-scale visual acceptance. That gate remains deferred
until the sim can surface them.
