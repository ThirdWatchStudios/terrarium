# Canonical action and cursor marks v1

Status: **Terrarium production SVG authority**

These ten marks were approved in
`docs/previews/department-era-ui-production-design-v1/`:

- six tintable action and world-facing marks; and
- four literal ink-and-halo cursors with source-owned normalized hotspots.

The checked-in SVGs are the editable source of truth. `npm run
ui-shared:import` compiles them with the existing shared and department UI
families into the disposable
`src/parts/generated/canonicalUiIconArt.ts` receiver. Ordinary builds and
asset checks use the read-only importer check.

## Source rules

- Every source uses the canonical 128 by 128 canvas and stable ID filename.
- Tintable action geometry is white; cursors use only QuotaCo ink and a white
  visibility halo.
- Cursor hotspots are normalized manifest data and remain part of the stable
  cursor contract.
- Amber remains dormant-Capture-only and rose remains emotion-only.
- Text, scripts, external references, raster images, nested viewports, and
  transforms outside the approved centered group are forbidden.

These sources do not authorize a browser export or own Unity carriers, labels,
focus order, control behavior, responsive layout, runtime geometry, or cursor
texture import settings. Those remain downstream work for the joint Unity pass.
