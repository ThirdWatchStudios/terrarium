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

`hair/` contains six complete south/east/north sets: the approved Bob, Short,
and Long straight foundations plus the Curly, Ponytail, and Coils review batch.
Their target-level byte-stable mode validates full canvas geometry while
avoiding arc normalization that would otherwise change rendered pixels. Short
and Long straight south/north preserve their prior shapes, while Curly
preserves all three facings; Long straight east, Ponytail, and Coils carry the
deliberate silhouette refinements. Bob
remains the Medium-family control; Short and Long straight received visual
approval on 2026-07-10. Curly, Ponytail, and Coils received visual approval on
2026-07-10 as well.

The approved body, head, and six-hair foundations now live in this source tree.
Current production work is the Bun/Balding/Pixie/Side-part silhouette batch.
Detail-only Tee/Blazer work and wall bevel/detail authoring resume after that
hair pass.

See `docs/part-importer.md` for the SVG dialect, sentinel palette, validation
rules, and the deferred componentized multi-piece adapter needed by Blazer.
