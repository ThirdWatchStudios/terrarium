# F0.10 Seed Coverage & Drama Validation - Stories

### S0.10.1 - Structure And History-Edge Soundness

User story:
- As an author, I need the generated seed validated for structural soundness and resolvable history edges, so an export is never silently broken.

Acceptance criteria:
- Reuses Epic 2/3 validation: every department resolves/has a head, no dangling reports; every history-seeded edge resolves to real agents.
- A deliberately broken seed fails; a good one passes.

Dependencies:
- F0.6.

### S0.10.2 - Scenario-Precondition Coverage

User story:
- As a designer, I need coverage analysis over the generated cast, so I know the org can satisfy enough of the scenario-template library to stay playable.

Acceptance criteria:
- Extends `analyzeTemplateCoverage` to run over the generated cast + the seeded eligibility (F0.7).
- It flags a cast/library mismatch (too few castable templates) and passes a healthy seed.

Dependencies:
- F0.7, Epic 3/4 coverage.

### S0.10.3 - Drama / Divergence Check And UI Signal

User story:
- As a designer, I need a go/no-go signal that a generated company is actually playable and dramatic, surfaced in the Company tab, so I don't export a flat seed.

Acceptance criteria:
- A divergence check confirms company character measurably shifted the population/graph (not a flat spread).
- A "drama" check confirms enough hot, castable opening scenarios exist.
- The combined go/no-go result is surfaced in the UI before export.

Dependencies:
- S0.10.1, S0.10.2.
