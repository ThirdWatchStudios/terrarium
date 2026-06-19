# F0.2 Company Archetype Library - Stories

### S0.2.1 - CompanyArchetype Type And Sampler

User story:
- As an author, I need a `CompanyArchetype` of ranges (over culture axes, economic state, likely-history weights) and `generateCompany(seed, archetype)` that samples one, so a company can be generated like a persona template.

Acceptance criteria:
- `CompanyArchetype` expresses ranges + likely-history weights; `generateCompany(seed, archetype)` returns an F0.1 `Company` (entity only, no cascade yet).
- Sampling uses the existing `mulberry32` / "bias not lock" pattern; `(seed, archetype)` reproduces byte-identical output.
- Unit coverage proves determinism.

Dependencies:
- F0.1.

### S0.2.2 - Two Reference Archetypes

User story:
- As a designer, I need two recognizable reference archetypes (e.g. Declining Incumbent, Hypergrowth Startup), so the library proves company character actually diverges.

Acceptance criteria:
- Two archetypes are authored; generating from each yields visibly distinct, coherent companies.
- A test asserts the two differ on the load-bearing culture axes and economic state.

Dependencies:
- S0.2.1.

### S0.2.3 - Dials And Blend

User story:
- As an author, I need optional dials (e.g. size, industry) and archetype blending, so I can steer generation without authoring a new archetype each time.

Acceptance criteria:
- `generateCompany(seed, archetype, dials)` honors dials; blending two archetypes produces a coherent intermediate.
- Dials/blend are deterministic and documented.

Dependencies:
- S0.2.1.
