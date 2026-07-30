# QuotaCo prop redesign SVG-backed hybrid v5

Status: **standalone artist-editable SVG candidate sources; not production-registered**

The selected family combines Catalog Shell bodies, Service Spine functional surfaces, and Used Shell personalization. This document does not authorize production registration.

## Shared grammar

- Catalog Shell owns the silhouette: cream rollover, deep-green chassis, broad radii, and low institutional mass.
- Service Spine appears only where it explains feed, output, refill, controls, drawers, or maintenance.
- Used Shell details are optional overlays: wear, notes, repairs, papers, upholstery, and plants must disappear cleanly at far zoom.
- Each prop preserves its live authoring projection: desk and chair remain plan-projected; storage, copier, water, and plant remain elevation-projected.
- Every prop keeps its existing template identity, grid footprint, pivot, placement, projection, navigation/collision behavior, and interaction metadata.
- There is no universal prop scale multiplier; each object is calibrated inside the unchanged 128-unit authoring frame.

## Representative decisions

| Role | Prop | Projection | Consolidated decision |
| --- | --- | --- | --- |
| Work surface | `desk` | plan | Broad desktop silhouette with inset writing surface, monitor, keyboard, papers, and mug; no front-facing console modules. |
| Seating | `office-chair` | plan | Top-down backrest, seat, and paired arms dominate; three tucked caster contacts imply a rolling base without an octopus silhouette. |
| Storage | `filing-cabinet` | elevation | One rounded cabinet hull with an unmistakable vertical drawer stack, label pulls, and grounded plinth. |
| Machine | `copier` | elevation | One floor-standing copier hull organized around scanner lid, control panel, output mouth, paper drawers, and base. |
| Personalization | `office-plant` | elevation | Organic leaf canopy rises from one molded planter; the shell treatment stays below the foliage. |

## Artist-editable source workflow after approval

1. Approve or correct each representative design in this proof.
2. Create one genuine, hand-editable SVG source for the accepted prop.
3. Review that SVG at close, normal, far, crowd, wall, occlusion, and interaction scales.
4. Wire the accepted SVG deliberately into Terrarium while preserving the existing gameplay contract.
5. Verify the baked atlas and Unity registration as a separate integration step.

The five retained standalone prop SVG sources exist under `assets/props/quota-co-workhorse-v1/`. No production prop template, exporter, CONTRACT, schema, atlas, or Unity registration is changed by v5.
