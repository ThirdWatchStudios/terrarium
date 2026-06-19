# F0.8 Company Package Export - Stories

### S0.8.1 - Serialize company.json And Update The Contract

User story:
- As the sim, I need a `company.json` root artifact (identity, culture, economic state, mission, history, narrative, climate aggregates), so a generated company is a loadable thing.

Acceptance criteria:
- `company.json` serializes the company model; a new `CONTRACT.md` §3.x documents it.
- `CURRENT_SCHEMA_VERSION` is bumped and §7 compatibility is documented; a migration step is added.
- Round-trip serialize/deserialize is unit-tested.

Dependencies:
- F0.1.

### S0.8.2 - Reframe The Bundle As A Company Package

User story:
- As the sim, I need the export bundle reframed as a company package — `company.json` at the root with the existing payloads as children — so the whole seed loads as one unit.

Acceptance criteria:
- The bundle places `company.json` at the root with org-structure / personas / relationships / `office-layout.json` / `scenario(-template).json` as children.
- No existing payload changes shape; existing single-scenario exports still load.
- The bundle layout is documented in the contract.

Dependencies:
- S0.8.1, F0.3, F0.5, F0.6, F0.7.

### S0.8.3 - Headless Export And Determinism Tests

User story:
- As the build pipeline, I need the company package to export headlessly and deterministically, so art-as-data holds at company scale.

Acceptance criteria:
- The headless CLI (`exportAll` path) emits a full company package; in-app and CLI outputs are structurally identical.
- Two runs of the same `(seed, archetype, dials)` are byte-identical (JSON); `npm run build`/`test` green.

Dependencies:
- S0.8.2.
