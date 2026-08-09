# QuotaCo department-machine SVG sources v1

Status: **canonical artist-editable source art; production-wired in Terrarium**

The SVG files in this directory are the visual authority for the live QuotaCo
department-machine templates, their baked fill/facing states, the shared work
canister, and the work-type stamp overlays.

They are not generated during ordinary builds. Edit these files directly in a
compatible SVG editor; no build, test, preview, freshness, or import command is
allowed to create, replace, or rewrite them.

`manifest.json` records the accepted proof ancestry and the source-to-receiver
mapping for human review. The live runtime contracts remain in
`src/props/departmentMachineManifest.ts`: template ids, labels, projections,
placements, footprints, parameters, state keys, prop-instance ids, interaction
types, work-type vocabulary, and export directories. Those contracts do not
move into the SVGs.

## Compile and validate

```bash
npm run department-machines:import
npm run department-machines:import:check
npm run department-machines:production:preview
```

The importer reads the canonical SVG bank and deterministically emits
`src/props/generated/quotaCoDepartmentMachineArt.ts`. That generated module is
a disposable compiled derivative and must never be hand-edited.

`npm run assets:check`, `npm run build`, and `npm run export -- ...` run the
read-only import freshness check. They fail when the generated module is stale
and direct the developer to run `department-machines:import`; they do not repair
or overwrite SVG sources.

## Source contract

- Canvas: `128 × 128`, `viewBox="0 0 128 128"`.
- Root metadata: `data-prop-id` and `data-projection`.
- Required accessible description: `<title>` and `<desc>`.
- Visible shapes and editor groups have semantic ids.
- Source paint order, fills, strokes, joins, caps, and literal colors are
  production art.
- Scripts, events, external references, rendered text, raster images, and
  `foreignObject` are forbidden.
- QuotaCo world art may not use the reserved amber status or rose social
  registers.

The production compositor uses the source-exact SVG by default and the focused
production test compares each composed state pixel-for-pixel with its canonical
source. Global prop restyling remains an explicit compatibility opt-in only.

## State and overlay coverage

- Template variants use separate canonical SVGs where fill or facing changes
  visible art.
- Work-type identity remains a separate SVG overlay over one canonical
  canister SKU.
- `src/props/departmentMachineManifest.ts` is the live coverage registry. The
  canonical-source tests require its complete variant and overlay file set to
  match this directory exactly.

The accepted proof scripts and review artifacts remain historical evidence and
may still render calibration sheets. They are not source generators and do not
own production appearance.
