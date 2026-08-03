# Department-era UI production design v1

Status: **approved Terrarium production-design source; Unity deferred**

This package creates the department-era UI in Terrarium before any Unity
implementation begins. It converts the approved UI-E0 v3 material grammar and
UI-E1a Direction B typography into structured design data and literal screen
compositions.

## Review sheets

- [Production design system](./00-production-design-system.png) ([SVG](./00-production-design-system.svg))
- [Literal department screens](./01-literal-department-screens.png) ([SVG](./01-literal-department-screens.svg))
- [Machine-readable metrics](./metrics.json)

The literal sheet contains four exact 1280×720 compositions: inert Chain
browsing, inert requirement selection, armed valid placement, and a 140% Tube
Route failure with one repair sentence. The office remains the dominant image.

## Source boundaries

- Five shared UI-E1 marks are canonical production SVGs.
- Nineteen work-type, readiness, state, endpoint, wall-pass, and repair glyphs
  now resolve through canonical Terrarium production SVGs.
- Product illustrations are monochrome treatments derived from current
  canonical department-machine geometry; they are not separately redrawn SKUs.
- Panels, cards, text, state surfaces, focus placement, room highlights,
  footprints, and tube paths are compositions—not SVG assets to export.
- The embedded office image remains a visual reference, not a production master.

No Unity file, browser export, runtime implementation, staging, or commit is
performed by this renderer.
