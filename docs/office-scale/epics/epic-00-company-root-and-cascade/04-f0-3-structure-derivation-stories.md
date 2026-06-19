# F0.3 Structure Derivation - Stories

### S0.3.1 - Derive The Department Set

User story:
- As the cascade, I need to derive the department set (count/kind) from company size + industry, writing into Epic 2's department catalog, so structure reflects the company rather than being hand-listed.

Acceptance criteria:
- A deriver produces a department set scaled to size and shaped by industry, emitted into Epic 2's catalog shape (the single department model).
- Determinism holds for `(seed, archetype, dials)`.
- Larger/older companies yield more/deeper departments than small/young ones.

Dependencies:
- F0.2, Epic 2 (F2.1).

### S0.3.2 - Derive The Org-Chart Shape

User story:
- As the cascade, I need org-chart depth/span derived from the Hierarchy↔Flat axis, written into Epic 2's org-structure artifact, so the chart matches the company's character.

Acceptance criteria:
- Reporting depth/span derive from the Hierarchy↔Flat axis into Epic 2's org-structure artifact.
- A flat company yields a shallow/wide chart; a hierarchical one yields a deep/narrow chart.
- Output is deterministic.

Dependencies:
- S0.3.1, Epic 2 (F2.2, F2.3).

### S0.3.3 - Validate The Derived Structure

User story:
- As an author, I need the derived structure validated so a generated company never produces a broken org chart.

Acceptance criteria:
- Reuses Epic 2's validation: every department resolves, every department has a head, no report dangles.
- A deliberately malformed derivation fails the check.

Dependencies:
- S0.3.2, Epic 2 (F2.5).
