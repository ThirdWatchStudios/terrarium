# F0.9 Company Authoring & Preview UI - Stories

### S0.9.1 - Company Tab With Generate Controls

User story:
- As a designer, I need a "Company" tab with archetype/seed/dials controls and a generate action, so I can produce a company from the studio (Pass 1: the company entity alone).

Acceptance criteria:
- A new "Company" tab exposes archetype picker, seed field, and dials, plus a generate button.
- Generating shows the resulting company (identity, culture, economic state, mission, history, narrative, climate).
- Additive — the Characters/Persona/Scene/Employees/Scenario tabs are unaffected.

Dependencies:
- F0.1, F0.2.

### S0.9.2 - Cascade Inspector

User story:
- As a designer, I need to browse the full cascade — company → departments → people → relationships — so I can see what a seed produced (Pass 2).

Acceptance criteria:
- The tab inspects the generated cascade tiers (structure, departments, personas, relationship graph).
- The view surfaces the climate/history and the resulting structure legibly.

Dependencies:
- S0.9.1, F0.3, F0.5, F0.6.

### S0.9.3 - Per-Field Overrides

User story:
- As a designer, I need to override any generated field with authored-wins semantics, so generation is a starting point, not a straitjacket.

Acceptance criteria:
- Any field is overridable; overrides survive regeneration of unrelated subtrees and win over derived values.
- Overrides flow into the F0.8 export; existing tabs remain unaffected.

Dependencies:
- S0.9.2.
