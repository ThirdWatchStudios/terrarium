# F0.1 Company Model & Reference Company - Stories

### S0.1.1 - Define The Company Model Types

User story:
- As an author, I need a serializable `Company` type covering identity, culture axes, economic state, mission-vs-reality, history (formative events), narrative/open-secrets, and social-climate aggregates, so the company is a first-class entity as rich as a persona.

Acceptance criteria:
- A `Company` type exists with all the listed sections; it serializes/deserializes round-trip with no loss.
- Field shapes reuse existing conventions where they apply (0–100 axes like persona spine; free-text-with-fallback vocabularies for industry/ownership/history-event kind).
- Unit coverage proves round-trip stability.

Dependencies:
- none.

### S0.1.2 - Derive Company Climate Aggregates

User story:
- As the cascade, I need derived company aggregates (factionalism / fear / volatility) computed from culture + state + history, so downstream weighting has a single climate read.

Acceptance criteria:
- A company `applyDerived` analog computes the aggregates deterministically from the model.
- Authored overrides win over derived values (same discipline as persona `applyDerived`).
- Recomputation is idempotent and unit-tested.

Dependencies:
- S0.1.1.

### S0.1.3 - Author One Reference Company

User story:
- As a designer, I need one hand-authored reference company exercising every field, so the model has a golden example and the tests have a fixture.

Acceptance criteria:
- A reference company populates every section of the model with coherent values.
- It is used as a fixture by the model's round-trip and derived-aggregate tests.
- It renders/serializes without warnings.

Dependencies:
- S0.1.1, S0.1.2.

### S0.1.4 - Document The Cascade Seam Fields

User story:
- As a tier author (E1–E4), I need the company fields each tier consumes named explicitly, so I build the tier with the right seam rather than retrofitting it.

Acceptance criteria:
- The model documents the seam fields: department-subculture inputs (E2), persona culture-weighting inputs (E3), history→edge inputs (E3), history→scenario inputs (E4), wing-grouping ids (E1).
- The doc cross-references `00-company-root-and-cascade.md` and the tier feature breakdowns.

Dependencies:
- S0.1.1.
