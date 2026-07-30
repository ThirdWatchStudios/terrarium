# QuotaCo floor and grass SVG importer

The accepted Maintained Hybrid floor and grass sources live under:

```text
assets/tiles/quota-co-maintained-hybrid-v1/
  floors/  # 12 existing interior-floor instance IDs
  ground/  # 3 existing grass instance IDs
```

These files are the canonical, artist-editable visual sources for this bounded
surface slice. Ordinary builds never regenerate or overwrite them.

## Source contract

Every source must:

- use an exact `128 × 128` canvas and `viewBox="0 0 128 128"`;
- declare the existing `data-surface-id`, `data-kind`, and
  `data-template-id`;
- declare `data-direction="maintained-hybrid"`;
- include `<title>` and `<desc>`;
- keep every visible primitive in a named semantic group;
- give every visible primitive a stable unique ID;
- explicitly identify palette-controlled fills and strokes with
  `data-fill-token` and `data-stroke-token`;
- use flat paths, rectangles, circles, or ellipses with explicit paint;
- use round caps and joins for strokes.

Scripts, embedded images, filters, gradients, event handlers, links, CSS
styles, and transforms are rejected. Seam geometry may intentionally paint
through the canvas edge; the tile viewBox clips it, unlike the stricter
contained character/prop source contract.

## Deterministic production compile

```bash
npm run surfaces:import
npm run surfaces:import:check
```

The importer writes:

```text
src/tiles/generated/quotaCoMaintainedHybridSurfaceArt.ts
```

The module contains source hashes, existing IDs/kinds/templates, default
parameters and palettes, semantic group/element ownership, and compiled
`ShapeSpec` arrays. `maintainedHybridSurfaceShapes()` resolves these sources
for the live floor templates.

## Current boundary

The accepted default geometry is production-registered in Terrarium:

- all 12 existing interior floor instances and three existing grass instances
  enter through the canonical SVG bank;
- default parameters return the compiled SVG geometry verbatim;
- non-default parameters operate on the same semantic source groups;
- all 29 per-instance minimum/maximum parameter checks are active;
- the 12 floor and three grass compositor snapshots are promoted.

No instance ID, template ID, floor/ground kind, palette, default parameter,
export contract, or schema shape changed. Bundle import and Unity registration
remain a separate user-run handoff. The derived 47-frame grass fringe remains
code-owned and deferred to its own edge-density proof.

## Deferred grass-fringe transition

As of 2026-07-30, the separate 47-frame `grass-fringe` redesign and SVG-source
conversion are explicitly deferred. The current code-owned transition remains
unchanged. No transition proof, edge/corner source kit, production promotion,
export change, schema change, or Unity integration is active.

The accepted base grass sources do not silently promote the fringe. Reopen it
only as its own bounded visual-review slice, preserving the shared mask order,
receiver rules, atlas layout, sort band, and Unity-facing contract until visual
approval.

Render the production gate with:

```bash
npm run surfaces:production:preview
```

The artifacts live at
`docs/previews/quota-co-floor-grass-production-validation-v1.*`.
