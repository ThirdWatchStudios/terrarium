# UI-E1a review-only source-fit and production-font pilot

Status: **review only; stopped for explicit visual approval**

This pilot follows the approved UI-E0 v3 direction without promoting anything
to production. The source-fit sheet audits the five bounded shared-shape
candidates from the catalog. Candidate SVG files live under
`candidate-svg-review-only/`; they are evidence, not canonical source assets.

The font sheet uses actual font binaries rather than system proxies:

- Utility: IBM Plex Sans Condensed Medium headings with existing IBM Plex Sans
  Regular/Medium body copy.
- QuotaCo print: Courier Prime Regular/Bold.
- IRIS: existing IBM Plex Mono Regular. VT323 appears only as an optional
  period-forward IRIS heading accent.

The recommended production split is the middle direction: it keeps the three
voices distinct and readable at literal 100% and 140% scale. The current Unity
IBM Plex folder does not contain a bundled license file; that packaging gap
must be resolved before any font promotion.

## Source-fit recommendation

- Exact authority inversion after approval: `ui-divider`, `iris-mark`, and
  `quotaco-mark`.
- Redesign before promotion: `ui-corner` and `ui-focus`. Their review
  candidates adopt the approved square drafting/focus grammar; `ui-focus`
  drops the surveillance crosshair so Utility and IRIS do not blend.
- Stable IDs and tintable/literal modes are held in every case.

Only `iris-mark` and `quotaco-mark` have direct live stable-ID bindings in
the current Unity code. The three F-07 ornaments are present in the imported
catalog but have no direct runtime stable-ID consumer found by the pilot audit.

## Ownership boundary

- Terrarium candidate SVGs: stateless discrete marks only.
- Unity UXML/USS: all carriers, controls, text, layout, focus placement,
  accessibility, and visual states.
- Unity runtime geometry: logical footprints, spatial focus, routes, endpoints,
  placement validity, and repair anchors.

## Approval boundary

Approval of these sheets would select source-fit and font directions only. It
does not authorize canonical SVG extraction or promotion, production builder
changes, exporter/importer changes, browser export, Unity import, runtime UI
implementation, staging, or commit.
