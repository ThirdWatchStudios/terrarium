# Canonical department UI glyphs v1

Status: **Terrarium production SVG authority**

These 19 tintable glyphs are the distinctive, stateless department-era marks
approved in `docs/previews/department-era-ui-production-design-v1/`:

- three work-type marks;
- eight readiness marks;
- four state marks; and
- four route marks.

The checked-in SVGs are the editable source of truth. `npm run
ui-shared:import` compiles them with the five shared UI primitives into the
disposable `src/parts/generated/canonicalUiIconArt.ts` receiver. Ordinary
builds and asset checks use the read-only importer check.

## Source rules

- Every source uses the canonical 128 by 128 canvas and stable ID filename.
- All geometry is tintable white and remains safely inside the canvas.
- Text, scripts, external references, raster images, nested viewports, and
  transforms outside the approved centered group are forbidden.
- Amber remains Capture-only and rose remains emotion-only.

These SVGs do not own panels, cards, text, state surfaces, room highlights,
placement footprints, tube segments, or responsive layout. Those remain
Unity UI Toolkit or runtime geometry for the later joint Unity pass.
