# F0.4 Department Subculture Cascade - Stories

### S0.4.1 - Derive Per-Department Subculture

User story:
- As the cascade, I need each generated department to derive a subculture from company culture plus a bounded deviation, so a toxic team can exist inside a healthy firm.

Acceptance criteria:
- Department subculture = company culture biased + a per-department deviation sampled within a budget.
- Two departments in the same company resolve distinct subcultures within the deviation budget.
- Output is deterministic for the cascade seed.

Dependencies:
- F0.3.

### S0.4.2 - Expose Department Bias Weights

User story:
- As the persona tier (F0.5), I need the resolved per-department bias weights exposed on Epic 2's department entity, so I can weight persona generation by department.

Acceptance criteria:
- Resolved subculture is written to Epic 2's department subculture fields (the E2 seam).
- The weights are readable by F0.5 without recomputation.

Dependencies:
- S0.4.1, Epic 2 (F2.1 subculture fields).

### S0.4.3 - Seed Inter-Department Rivalries

User story:
- As a designer, I need named inter-department rivalries seeded from the company social-climate aggregates, so factionalism is concrete before the relationship graph is wired.

Acceptance criteria:
- Rivalries are seeded from the company's factionalism aggregate and attached to the structure.
- Higher factionalism yields more/stronger rivalries; output is deterministic.

Dependencies:
- S0.4.1.
