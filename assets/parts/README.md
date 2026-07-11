# Authored character part sources

Place strict-dialect SVGs here as `<slot>/<slug>.<facing>.svg`, then run
`npm run parts:import`. The generated module is committed; builds run
`npm run parts:check` and fail if it is stale.

The current intake accepts complete facing sets for the five production bodies
and existing static production parts in `head` and `hair`, plus the explicit
`outfit-tee` anchored-detail target. Tee is authored once on `body-balanced` in
south/east; the importer pre-expands its detail-only geometry onto the neck
anchor of all five production bodies. The conforming torso and z-order remain
owned by the production part, while legacy and future bodies retain the
procedural fallback.

`body/` contains the 15 canonical production sources for `body-compact`,
`body-balanced`, `body-large-frame`, `body-tall`, and `body-soft`. They own the
complete visible south/east/north art, including the south/east lower plane.
The dedicated `body-art` adapter installs those facings onto the one shared
production `PartDef` in place, preserving its label, order, z-order, and exact
typed body-rig identity. The rig guides in generated body scaffolds remain
TypeScript-owned context rather than source metadata.

`head/` contains complete south/east/north canonical production sets for
`head-oval`, `head-boxy`, `head-long`, `head-angular`, and
`head-soft-square`. Those 15 SVGs compile through the static-head overlay and
are the approved production source of truth. Together with `head-round`, all
six head families passed the automated compatibility matrices and user visual
approval on 2026-07-10.

The same directory also contains the three canonical machine-head sources
`fab.south.svg`, `fab.east.svg`, and `fab.north.svg` for `head-fab`. This is not
a seventh human head choice: `head-fab` and its companion
`outfit-fab-chassis` are special construction-recipe parts. Both remain in the
part library and resolve through `getPart()` so the `construction-worker` IRIS
fabrication unit and its snapshots compose normally, but `partsForSlot()`
filters them from authoring pickers and random/seeded employee generation. The
head is canonical authored SVG; the chassis remains a body-anchor-driven
builder on the approved `body-large-frame` production rig. Their current art is
mechanically complete and intentionally open to later visual polish.

`hair/` contains all ten complete south/east/north sets: the approved Bob,
Short, Long straight, Curly, Ponytail, and Coils foundations plus the Bun,
Balding, Pixie, and Side-part review batch.
Their target-level byte-stable mode validates full canvas geometry while
avoiding arc normalization that would otherwise change rendered pixels. Short
and Long straight south/north preserve their prior shapes, while Curly
preserves all three facings; Long straight east, Ponytail, and Coils carry the
first deliberate silhouette refinements. Bun is compact and clip-free,
Balding uses tapered temple and rear bands, Pixie has a cropped irregular
fringe, and Side-part includes a swept cap and parting crease. Bob remains the
Medium-family control; Short and Long straight received visual
approval on 2026-07-10. Curly, Ponytail, and Coils received visual approval on
2026-07-10 as well. Bun, Balding, Pixie, and Side-part passed automated review
and received visual approval on 2026-07-10.

The approved human body/head foundations, the special FAB head, and all ten
approved mapped hair sources now live in this tree. Detail-only Tee/Blazer work
and later asset-polish passes follow the completed hair and wall-foundation
work.

See `docs/part-importer.md` for the SVG dialect, sentinel palette, validation
rules, and the deferred componentized multi-piece adapter needed by Blazer.
