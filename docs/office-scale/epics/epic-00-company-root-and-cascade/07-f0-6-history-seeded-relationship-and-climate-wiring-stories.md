# F0.6 History-Seeded Relationship & Climate Wiring - Stories

### S0.6.1 - Factionalism-Biased Graph Wiring

User story:
- As the cascade, I need company social-climate and factionalism to bias Epic 3's intra/inter-department relationship wiring, so the graph's shape reflects the company.

Acceptance criteria:
- Climate/factionalism aggregates bias Epic 3's relationship-graph generation (the history-seeding hook), reusing the §3.7 relationship-type catalog.
- Higher factionalism visibly skews inter-department ties (more rivalry/suspicion, fewer cross-wing alliances).
- Output is deterministic.

Dependencies:
- F0.5, Epic 3 (F3.3 history-seeding hook).

### S0.6.2 - Seed Edges From Formative Events

User story:
- As the cascade, I need formative company events to seed concrete typed edges, so a layoff round actually creates resentment edges in the start state.

Acceptance criteria:
- Each formative-event kind maps to concrete typed edges (resentment, rivalry, alliance) using the existing relationship-type catalog + third-party coupling.
- Seeded edges attach to plausible agents (by department/role) and carry the right type/secret flags.

Dependencies:
- S0.6.1.

### S0.6.3 - Verify History Is Legible In The Graph

User story:
- As a designer, I need to read the company's history and climate off the generated graph, so the seeding is doing real work.

Acceptance criteria:
- A test traces specific graph edges back to the company's history events and factionalism.
- A different history produces a different, still-coherent graph; output is reproducible.

Dependencies:
- S0.6.2.
