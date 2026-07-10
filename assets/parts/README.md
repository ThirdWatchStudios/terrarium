# Authored character part sources

Place strict-dialect SVGs here as `<slot>/<slug>.<facing>.svg`, then run
`npm run parts:import`. The generated module is committed; builds run
`npm run parts:check` and fail if it is stale.

The current intake accepts complete facing sets for existing static production
parts in `head` and `hair`. See `docs/part-importer.md` for the SVG
dialect, sentinel palette, validation rules, and intentionally deferred rigs.
