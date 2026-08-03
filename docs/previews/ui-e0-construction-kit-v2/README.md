# UI-E0 construction kit review v2

Status: **review only; stopped for explicit visual approval**

This refinement pass preserves the approved direction while separating the
three voices more clearly, raising all literal-scale support text to the 14 px
baseline, giving disabled actions an explicit repair label, and removing tiny
duplicated footer copy from the runtime-size frames.

The official construction-kit sheet covers catalog families F-01 through F-10
and C-01 through C-12. The literal-scale sheet draws two 1280×720 viewports at
1:1 pixels, using 100% and 140% interface scale. It includes default, hover,
keyboard/gamepad focus, pressed, selected, disabled, and invalid states.

The office image in the literal-scale sheet is an approved composition reference
used only as a review backdrop. It is not a production master or canonical asset.

## Source-authority decision

- Canonical SVG candidates: discrete marks, transport/action/readiness glyphs,
  four pointer silhouettes, the QuotaCo and IRIS marks, and only those clip/bezel
  ornaments that USS cannot express cleanly.
- Unity UXML/USS: chassis, wells, sleeves, records, IRIS carriers, controls,
  state surfaces, focus placement, scroll, text, fields, and layout.
- Unity runtime geometry: footprints, room focus, facing, tube paths, endpoints,
  invalid cells, and spatial repair anchors.

## Approval boundary

Approval of these review sheets does not authorize canonical SVG extraction or
promotion, production builder changes, exporter/importer changes, browser export,
Unity import, runtime UI implementation, staging, or commit.
