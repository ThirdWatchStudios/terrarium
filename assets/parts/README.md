# Authored character part sources

Place strict-dialect SVGs here as `<slot>/<slug>.<facing>.svg`, then run
`npm run parts:import`. The generated module is committed; builds run
`npm run parts:check` and fail if it is stale.

The current intake accepts complete facing sets for existing static production
parts in `head` and `hair`, plus the explicit `outfit-tee` anchored-detail
target. Tee is authored once on `body-balanced` in south/east; the importer
pre-expands its detail-only geometry onto the neck anchor of all five production
bodies. The conforming torso and z-order remain owned by the production part,
while legacy and future bodies retain the procedural fallback.

See `docs/part-importer.md` for the SVG dialect, sentinel palette, validation
rules, and the deferred componentized multi-piece adapter needed by Blazer.
