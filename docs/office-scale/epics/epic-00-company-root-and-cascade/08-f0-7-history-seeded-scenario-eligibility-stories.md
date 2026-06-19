# F0.7 History-Seeded Scenario Eligibility - Stories

### S0.7.1 - Map History Kinds To Scenario Families

User story:
- As the cascade, I need a mapping from formative-event kinds to scenario-library families/templates, so the company's past points at the scenarios it should open on.

Acceptance criteria:
- A documented mapping links history kinds (reorg, layoff, founder exit, scandal, …) to scenario-library families/templates.
- Unknown/absent kinds fall back gracefully (no hard-fail), matching the free-text discipline.

Dependencies:
- F0.6, Epic 4 (F4.1).

### S0.7.2 - Bias Eligibility And Salience

User story:
- As the cascade, I need company history to bias Epic 4 scenario eligibility/salience, so the seed ships with hot, grounded opening scenarios.

Acceptance criteria:
- History biases eligibility/salience over Epic 4's export (the history-seeding seam); a recent contested promotion makes that template run hot.
- A different history surfaces different hot scenarios; biasing respects the cast/precondition coverage path (F0.10).
- Output is deterministic.

Dependencies:
- S0.7.1.
