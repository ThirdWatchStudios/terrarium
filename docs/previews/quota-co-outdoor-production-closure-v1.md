# QuotaCo outdoor prop production closure

Status: **accepted Terrarium source and importer slice; downstream visibility
deferred**

## Promoted existing carriers

- `car`
- `lot-marking-crosswalk`
- `lamp-post`
- `sign-lot`
- `bike-rack`
- `park-bench`
- `picnic-table`
- `tree-canopy`

Each carrier now compiles from a genuine artist-editable SVG under
`assets/props/quota-co-workhorse-v1`. Existing IDs, projections, parameters,
grid footprints, pivots, navigation/collision behavior, interaction metadata,
export shape, schema, and Unity-facing registration are preserved.

## Source-only gameplay concepts

- `hvac-condenser`
- `surveillance-camera`
- `surveillance-sensor`
- `privacy-hedge`

These files remain isolated under
`assets/props/quota-co-gameplay-candidates-v1`. They do not create templates,
facility catalog entries, gameplay receivers, exports, schema fields, or Unity
registration.

## Downstream import result

The user performed a fresh bundle import on 2026-07-30 and confirmed that no
new catalog items appeared. This is the expected contract result because this
slice replaces art for existing carriers and deliberately leaves the four
candidate concepts unregistered.

The eight existing carriers do not yet appear in the current build or bare-lot
presentation, so their Unity gameplay-scale pixels could not be inspected in
world. Runtime visibility is deferred rather than inferred as visually proven.

## Terrarium verification

- Canonical SVG versus accepted-reference delta: `0`
- Maximum canonical-source versus compiled-output delta: `< 0.000031`
- Focused compatibility validation: `58` checks passed
- `npm run build`: passed with all `53` authored prop sources current
- Bundle export/import: performed by the user
- New catalog registration: none
- Unity integration changes: none
