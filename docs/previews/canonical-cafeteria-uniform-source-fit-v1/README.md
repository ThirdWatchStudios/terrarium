# Canonical cafeteria-uniform source validation v1

Status: **Direction A approved and promoted on 2026-08-02**

This proof compiles 21 complete editable overlays: 18 body/facing service-apron
SVGs and three head-center hairnet SVGs. The apron files own the tee field, bib,
skirt, straps, pocket, and waist seam. The hairnet files own the translucent cap
and mesh. Existing body and hair SVGs retain their own silhouettes.

The apron uses two separated `$outfitSecondary` runs: tee beneath the primary
apron and pocket above it. Character-layer export preserves those ordered tint
runs instead of collapsing equal-tint shapes into one layer.

The handwritten apron builder and static hairnet geometry were removed. The normal
Terrarium browser export and fresh Unity import completed on 2026-08-02.
In-action Unity visual inspection is explicitly deferred until the sim can surface
cafeteria workers; import completion is not being presented as that visual gate.
