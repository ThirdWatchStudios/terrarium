# Epic 0 Feature Breakdown - Company Root & Cascade

Project phase: Office-Scale Authoring (Terrarium studio) — the program spine
Planning intent: Make the **company** a first-class generated entity — as rich as the personas inside it — and the generative root of a top-down cascade (company → departments → people → relationships → scenarios), so The Water Cooler's "new game" starts from one seed that produces an entire coherent, distinct organization. This epic is the **spine**; Epics 1–4 are the tiers it cascades into.
Prototype estimate: a company model + a small archetype library + a cascade that derives structure (into Epic 2), culture-weights persona generation (over Epic 3), history-seeds the relationship graph (over Epic 3), and exports a `company.json` root.
MVP estimate: full-richness company (culture, economic state, mission, history, narrative/open-secrets, social climate), history-seeded scenario eligibility, a Company authoring/preview tab, and seed coverage/drama validation.

## Purpose

Today generation is bottom-up: generate people, tag them with a department. Two companies can only
differ by roster. The office-scale direction needs the opposite — a long playthrough that opens on
a believable, *distinct* organization whose character reaches all the way down. This epic is the
**root** that flips generation top-down: a company is sampled from an archetype + seed, its
structure is derived, and its culture/economy/history cascade into the departments, people,
relationships, and scenarios below it. It is the **new-game seed**.

Build order (the spine is built in two passes): **Pass 1 — model + cascade seams** (F0.1, F0.2,
and the seam-defining hooks) lands first, so the Epic 1–4 tiers are built against the right seams
rather than retrofitted. **Pass 2 — cascade orchestration + export + validation** (F0.3–F0.8,
F0.10) lands once the tiers exist. The Company tab (F0.9) can preview the company from Pass 1.

There is **one** department/org model — Epic 2's. The cascade emits into and reads it, calls Epic
3's persona/relationship generation, and consumes Epic 4's scenario export. This epic owns only
the company root and the cascade logic. Serves the full-game seed behind the sim's Build 0.4
harvest gate.

## Feature Sequence

| Order | Code | Feature | Depends On | Purpose | Pass |
|---:|---|---|---|---|---|
| 1 | F0.1 | Company Model & Reference Company | none | The rich, serializable company entity + derived climate aggregates + one hand-authored reference company. | 1 |
| 2 | F0.2 | Company Archetype Library | F0.1 | Seeded archetype generators — the new-game presets that sample a coherent company. | 1 |
| 3 | F0.3 | Structure Derivation | F0.2, E2 | Derive departments + org-chart shape from company character, emitted into Epic 2's artifacts. | 2 |
| 4 | F0.4 | Department Subculture Cascade | F0.3 | Each generated department gets a subculture biased by company culture + a deviation budget. | 2 |
| 5 | F0.5 | Culture-Weighted Persona Generation | F0.4, E3 | Feed company + department culture into Epic 3's persona generation so people diverge by company character. | 2 |
| 6 | F0.6 | History-Seeded Relationship & Climate Wiring | F0.5, E3 | Wire Epic 3's relationship graph from social climate + factionalism + formative-event edges. | 2 |
| 7 | F0.7 | History-Seeded Scenario Eligibility | F0.6, E4 | Company history pre-loads/biases eligible Epic 4 scenario templates. | 2 |
| 8 | F0.8 | Company Package Export | F0.1, F0.3, F0.5, F0.6, F0.7 | `company.json` root + reframe the bundle as a company package; contract + schema bump. | 2 |
| 9 | F0.9 | Company Authoring & Preview UI | F0.1, F0.2 | A "Company" tab: pick archetype/seed/dials, generate, inspect the cascade, override any field. | 1→2 |
| 10 | F0.10 | Seed Coverage & Drama Validation | F0.6, F0.7 | Validate a generated company is playable, drama-rich, structurally sound, and actually diverged. | 2 |

Epic 0 goal:

```text
Terrarium generates an entire coherent, distinct company from one seed — culture, economy,
history, structure, people, relationships, and eligible scenarios — as the new-game seed the
sim loads, with company character cascading all the way down into the Epic 1–4 tiers.
```

Epic 0 exit question:

```text
Can the studio pick a company archetype + seed and get a playable, drama-rich org whose culture,
economy, and history visibly shaped its departments, its people, their relationships, and its
scenarios — emitted as one company package, over a single department/org model?
```

## Feature Definitions

### F0.1 - Company Model & Reference Company

Project phase: Office-Scale Authoring (Terrarium studio)
Planning intent: Define the company as a first-class entity with the same richness a persona has — and prove it with one hand-authored reference company, before any generation. Pass 1: this also fixes the cascade seams the tiers build against.
Prototype estimate: a serializable `Company` type (identity, culture axes, economic state, mission-vs-reality, history/formative events, narrative/open-secrets, social-climate aggregates) + derived aggregates + one reference company.
MVP estimate: authoring ergonomics and validation for the model; documented free-text vocabularies; the seam fields E2/E3/E4 consume named explicitly.
Goal: A rich, serializable company entity that can stand beside a persona.
Feature scope:
- A `Company` model covering identity, culture axes, economic state, mission-vs-reality, company history (formative events), company narrative/open-secrets, and social-climate aggregates.
- Derived company aggregates (factionalism / fear / volatility climate) computed from culture + state + history — the company analog of persona `applyDerived`; authored overrides win.
- One hand-authored reference company exercising every field.
- Name the cascade seam fields the tiers consume (department subculture inputs, persona culture-weighting inputs, history → edge/scenario inputs).
Done when:
- The `Company` model serializes/deserializes round-trip and a reference company exercises every field.
- Derived aggregates compute deterministically and are overridable.
- The cascade seams the tiers must expose are documented.
Exit question:

```text
Is the company a serializable, override-friendly entity as rich as a persona, with the cascade seams named, proven by a reference company?
```

### F0.2 - Company Archetype Library

Project phase: Office-Scale Authoring (Terrarium studio)
Planning intent: The new-game presets — seeded generators that sample a coherent company from ranges, the company-scale analog of the persona archetypes.
Prototype estimate: a `CompanyArchetype` (ranges over culture axes / economic state / likely history) + `generateCompany(seed, archetype)` sampling one; 2–3 reference archetypes (e.g. Declining Incumbent, Hypergrowth Startup).
MVP estimate: a fuller library (Family Business, PE Rollup, Nonprofit, Post-Merger, Bureaucracy) + blend/dials.
Goal: Pick an archetype + seed → a coherent, distinct company.
Feature scope:
- A `CompanyArchetype` of ranges + likely-history weights, sampled per seed (same `mulberry32` / "bias not lock" pattern as persona templates).
- `generateCompany(seed, archetype, dials)` producing an F0.1 `Company` (no cascade yet — just the company entity).
- A starter set of archetypes; each a recognizable, coherent bundle.
- Determinism: `(seed, archetype, dials)` reproduces the same company.
Done when:
- Generating from two archetypes yields visibly distinct, coherent companies; the same inputs reproduce byte-identical output.
Exit question:

```text
Do distinct archetypes + a seed produce coherent, reproducible companies?
```

### F0.3 - Structure Derivation

Project phase: Office-Scale Authoring (Terrarium studio)
Planning intent: Turn company character into structure — derive the department set and org-chart shape from size/age/hierarchy, emitted into Epic 2's artifacts (not a second model).
Prototype estimate: a deriver that picks departments + reporting depth from the company and writes Epic 2's department catalog + org-structure artifact.
MVP estimate: industry-aware department sets; hierarchy-axis-driven chart depth/span; spare-capacity hooks for the sim's transfer tier.
Goal: A generated org structure that reflects the company, in Epic 2's shapes.
Feature scope:
- Derive department set (count/kind) from size + industry; org-chart depth/span from the Hierarchy↔Flat axis.
- Emit into **Epic 2's** department catalog + org-structure artifact — the one org model.
- Consume Epic 1's wing grouping for the physical projection (no layout logic here).
Done when:
- A generated company yields a valid Epic 2 org-structure artifact (every department resolves, every department has a head, no dangling reports), shaped by the company's size/age/hierarchy.
Exit question:

```text
Does company character produce a valid Epic 2 org structure, over the single department model?
```

### F0.4 - Department Subculture Cascade

Project phase: Office-Scale Authoring (Terrarium studio)
Planning intent: Each generated department is a mini-personality — it inherits the company culture but is allowed to deviate, so a toxic team can exist inside a healthy firm.
Prototype estimate: per-department subculture = company culture biased + a bounded deviation sampled per seed; expose department-level bias weights.
MVP estimate: department-function-aware deviation (Sales vs Engineering tilt) + named inter-department rivalries from company factionalism.
Goal: Departments that read as distinct, coherent sub-cultures under one company.
Feature scope:
- Department subculture derived from company culture + a per-department deviation budget.
- Expose the resolved department bias weights the persona generator (F0.5) consumes (the E2 subculture seam).
- Seed named inter-department rivalries from the company social-climate aggregates.
Done when:
- Two departments in the same company resolve distinct subcultures within the deviation budget; the weights are consumable downstream.
Exit question:

```text
Do departments inherit-and-deviate into distinct subcultures the persona layer can read?
```

### F0.5 - Culture-Weighted Persona Generation

Project phase: Office-Scale Authoring (Terrarium studio)
Planning intent: Make the people diverge by company character — feed company + department culture into Epic 3's persona generation as weighting, reusing its archetype path (the E3 culture-weighting seam).
Prototype estimate: a weighting layer over Epic 3 persona-template selection/sampling driven by F0.4 department bias + company culture.
MVP estimate: tuned weighting that yields legible, statistically-distinct populations per company archetype (cutthroat-finance Sales skews high-ambition/low-integrity).
Goal: Personas whose distribution visibly reflects the company they belong to.
Feature scope:
- Company + department culture bias Epic 3's persona-template selection/weighting ("bias not lock").
- No new persona model — this is a weighting layer over Epic 3.
- Determinism preserved through the cascade seed.
Done when:
- The same department generated under two company archetypes yields measurably different persona distributions; output is reproducible.
Exit question:

```text
Does company character measurably shift the generated persona distribution, reusing Epic 3?
```

### F0.6 - History-Seeded Relationship & Climate Wiring

Project phase: Office-Scale Authoring (Terrarium studio)
Planning intent: Give the relationship graph a reason to exist — wire it from the company's social climate and factionalism, and seed concrete edges from formative events (the E3 history-seeding seam).
Prototype estimate: extend Epic 3's relationship-graph generation with company factionalism bias + a formative-event → edge seeding pass.
MVP estimate: typed, sim-consumable edges (using the §3.7 relationship-type catalog + third-party coupling) tuned so history is legible in the graph.
Goal: A relationship graph whose shape is explained by the company's climate and history.
Feature scope:
- Company social-climate + factionalism bias Epic 3's intra/inter-department wiring.
- Formative company events seed concrete typed edges (resentment, rivalry, alliance) into the graph.
- Reuse the existing relationship-type catalog + third-party coupling; no new relationship model.
Done when:
- A generated company's graph contains edges traceable to its history; factionalism visibly shapes inter-department ties; output is reproducible.
Exit question:

```text
Can you read the company's history and climate off the generated relationship graph?
```

### F0.7 - History-Seeded Scenario Eligibility

Project phase: Office-Scale Authoring (Terrarium studio)
Planning intent: Ship the seed with hot, grounded scenarios — company history pre-loads/biases which Epic 4 scenario templates are eligible and salient (the E4 history-seeding seam).
Prototype estimate: map formative-event kinds → scenario-library families/templates; bias eligibility/salience accordingly over Epic 4's export.
MVP estimate: tuned salience that makes the opening scenarios feel caused by the company's past, with coverage checked against the generated cast.
Goal: A seed whose eligible scenarios are explained by the company it came from.
Feature scope:
- Company history kinds map to scenario-library families/templates; bias Epic 4 eligibility/salience.
- Consume Epic 4's export + the scenario-library; no new scenario model.
- Respect the cast/precondition coverage path (F0.10 / Epic 3/4 coverage).
Done when:
- A company with a given history surfaces grounded, castable opening scenarios; a different history surfaces different ones; output is reproducible.
Exit question:

```text
Are the seed's hot scenarios traceable to the company's history, and castable onto its cast?
```

### F0.8 - Company Package Export

Project phase: Office-Scale Authoring (Terrarium studio)
Planning intent: Make the whole cascade a single new-game seed artifact — a `company.json` root with the existing payloads as its children.
Prototype estimate: serialize `company.json`; reframe the export bundle as a company package; add `CONTRACT.md` §3.x + schema bump.
MVP estimate: headless CLI export of a full company package; determinism + round-trip tests.
Goal: One exportable company package the sim loads as a new game.
Feature scope:
- New project-level `company.json` (identity, culture, economic state, mission, history, narrative, climate aggregates).
- The bundle becomes a company package: `company.json` root + existing org-structure / personas / relationships / layout / scenario(-template) children — no existing payload changes shape.
- Additive contract change; schema bump; §7 compatibility; free-text-with-fallback for new vocabularies.
- Headless export parity with the in-app path (the existing `exportAll` discipline).
Done when:
- A generated company exports a deterministic, round-trippable company package; `npm run build`/`test` green; contract + schema updated.
Exit question:

```text
Does a generated company export as a deterministic company package the contract documents?
```

### F0.9 - Company Authoring & Preview UI

Project phase: Office-Scale Authoring (Terrarium studio)
Planning intent: A "Company" tab to drive and inspect the cascade — pick an archetype + seed + dials, generate, browse company → departments → people → relationships, and override any field.
Prototype estimate: a tab with archetype/seed/dials controls, a generate action, and a read-only company/cascade inspector (the company alone in Pass 1; the full cascade in Pass 2).
MVP estimate: per-field overrides, regenerate-subtree, and a preview that surfaces the climate/history and the resulting structure.
Goal: Author and inspect a whole company without leaving the studio.
Feature scope:
- Archetype + seed + dials controls; generate the company (Pass 1) then the full cascade (Pass 2).
- Inspect the cascade (company → departments → people → relationships); override any field with authored-wins semantics.
- Additive — does not regress the existing Characters/Persona/Scene/Employees/Scenario tabs.
Done when:
- The tab generates, inspects, and overrides a company end-to-end and feeds F0.8 export; existing tabs unaffected.
Exit question:

```text
Can a designer author, inspect, and override a whole company in the tool, then export it?
```

### F0.10 - Seed Coverage & Drama Validation

Project phase: Office-Scale Authoring (Terrarium studio)
Planning intent: Guarantee a generated seed is actually playable and dramatic — structurally sound, scenario-satisfiable, and visibly diverged by its company character.
Prototype estimate: validators for structure soundness (extends Epic 2/3 checks), scenario-precondition coverage (extends `analyzeTemplateCoverage`), and history-edge resolution.
MVP estimate: a "drama" check that confirms the company character produced measurable divergence and enough hot, castable scenarios to open on.
Goal: A go/no-go signal that a generated company is worth playing.
Feature scope:
- Structure soundness (every department resolves/has a head, no dangling reports), reusing Epic 2/3 validation.
- Scenario-precondition coverage over the generated cast, extending the Epic 3/4 coverage path.
- History-edge resolution + a divergence check (the culture actually shifted the population/graph).
Done when:
- The validator flags an unplayable or undramatic seed (too-flat population, uncastable library, dangling structure) and passes a good one; surfaced in the UI.
Exit question:

```text
Does the studio tell you, before export, whether a generated company is playable and dramatic?
```
