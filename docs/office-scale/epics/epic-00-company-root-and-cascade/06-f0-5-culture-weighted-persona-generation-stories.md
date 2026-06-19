# F0.5 Culture-Weighted Persona Generation - Stories

### S0.5.1 - Apply Culture Weighting To Template Selection

User story:
- As the cascade, I need company + department culture to bias Epic 3's persona-template selection/sampling, so generated people diverge by company character without a new persona model.

Acceptance criteria:
- A weighting layer feeds company + department culture into Epic 3's persona-template selection ("bias not lock", never a hard lock).
- No new persona model is introduced — it is a weighting layer over Epic 3.
- Determinism is preserved through the cascade seed.

Dependencies:
- F0.4, Epic 3 (F3.2 culture-weighting hook).

### S0.5.2 - Verify Population Divergence

User story:
- As a designer, I need proof that company character actually shifts the population, so the cascade is worth the complexity.

Acceptance criteria:
- The same department generated under two company archetypes yields measurably different persona distributions (a metric over drives/traits/axes).
- The divergence exceeds a documented threshold; output is reproducible.

Dependencies:
- S0.5.1.
