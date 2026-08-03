# Department-era UI production design v1

Status: **approved Terrarium component source; Unity deferred**

This package creates the department-era UI in Terrarium before any Unity
implementation begins. It converts the approved UI-E0 v3 material grammar and
UI-E1a Direction B typography into structured design data and literal screen
compositions.

## Review sheets

- [Production design system](./00-production-design-system.png) ([SVG](./00-production-design-system.svg))
- [Literal department screens](./01-literal-department-screens.png) ([SVG](./01-literal-department-screens.svg))
- [Reusable component library](./02-reusable-component-library.png) ([SVG](./02-reusable-component-library.svg))
- [Purpose Catalog and handoff screens](./03-purpose-catalog-handoff-screens.png) ([SVG](./03-purpose-catalog-handoff-screens.svg))
- [Machine-readable metrics](./metrics.json)

The literal sheets contain eight exact 1280×720 compositions covering Chain,
placement, Tube Route, purpose-led All Items, focused search, People handoff,
designation management, and receipt recovery. The office remains dominant.

## Source boundaries

- Five shared UI-E1 marks are canonical production SVGs.
- Nineteen work-type, readiness, state, endpoint, wall-pass, and repair glyphs
  now resolve through canonical Terrarium production SVGs.
- Six action and world-facing marks now resolve through canonical tintable SVGs.
- Four ink-and-halo cursors now resolve through canonical literal SVGs with
  their normalized hotspots in the source manifest. PNG handoff remains later.
- Product illustrations are monochrome treatments derived from current
  canonical department-machine geometry; they are not separately redrawn SKUs.
- Panels, cards, text, state surfaces, focus placement, room highlights,
  footprints, and tube paths are compositions—not SVG assets to export.
- The embedded office image remains a visual reference, not a production master.
No Unity file, browser export, runtime implementation, or cursor texture handoff
is performed by this renderer.
