# 05 — Company-Level Generation (the new-game seed)

**Status: DRAFT for decomposition.** The **generative root** above the office-scale stack.
Serves the full-game "new game" seed: one company seed → a whole coherent, living organization.
Independent sibling to E1–E4 (it **consumes** their artifacts; it does not redefine them).

## Purpose

Terrarium can generate **people** (visual DNA, and — once E3 lands — full personas with
relationships). It cannot yet generate the **company they work for**. The office-scale direction
needs a long playthrough to start from a believable, distinct organization — and "distinct" has
to mean more than a different roster. A *declining cutthroat finance firm* and a *scrappy
idealistic startup* should produce different departments, different people, different tensions,
and different scenarios. Today nothing makes them diverge, because **the company is not an
entity** — `department` is the highest structured concept, and even that (E2/E3) is authored from
no unifying character.

This work area makes the **company a first-class, generated entity — as rich as the personas
inside it** — and the **generative root of a top-down cascade**: company character biases
department subcultures, which bias the personas generated within them, which seed the
relationship graph and the eligible scenarios. The output is the **new-game seed**: pick a
company archetype + a seed, get an entire coherent org.

## Where this fits

Generation today is **bottom-up**: generate people, tag them with a free-text department. This
flips it **top-down**: generate a company, derive its structure, cascade its character down into
departments and people, then wire the relationships and scenarios that its history implies. The
office-scale epics become the **tiers the cascade fills**, not independent authoring tasks:

```text
Company  (E5 — this doc: identity, culture, economy, mission, history, narrative, climate)
  └─ Structure   → reuses E2 (department catalog + org-structure / org-chart artifact)
       └─ Departments  (E5 subculture cascade over E2/E3 departments)
            └─ People   → reuses E3 (persona-template generation), culture-weighted by E5
                 └─ Relationships → reuses E3 graph wiring, history-seeded by E5
       └─ Layout    → reuses E1 (multi-department wings) as the physical projection
  └─ Scenarios → reuses E4 export, history-seeded eligibility by E5
```

## Current state in Terrarium

- **People generation exists.** Visual DNA per department (`employee.ts` `GenProfile`, "bias not
  lock"); seeded persona archetypes (`personaTemplate.ts`, DRAFT) sampling ranges over the
  catalogs. E3 couples these into full department populations + a relationship graph.
- **Department/org exists only as the E2/E3 plan.** A structured department catalog + an
  `org-structure.json` artifact + reporting lines — but authored, with **no company above them**
  and no unifying character driving how they differ.
- **Personas carry `formativeEvents`** (the per-character backstory hook). There is **no company
  analog** — no company history, no company culture, no company narrative/open-secrets, no
  org-wide social climate, no economic state.
- **No company entity, no company catalog, no company export, no cascade.**

## The company model (full richness — what makes it "as rich as a person")

The company gets the same shape a persona has — its own spine, history, drives, and beliefs:

| Persona dimension | Company analog (this epic authors/generates) |
|---|---|
| Identity (name, role, seniority) | **Identity** — name, industry, age/founding, size band, ownership (startup / public / family / PE-owned), reputation |
| Spine (OCEAN + game axes) | **Culture axes** — Hierarchy↔Flat, Transparency↔Secrecy, Stability↔Volatility, Collaboration↔Cutthroat, Mission-driven↔Mercenary, Pace/burnout, Psychological-safety↔Fear. *The load-bearing personality that biases everything below.* |
| Needs (pressure) | **Economic state / health** — financial health, trajectory (growing / flat / declining / in-crisis), org-wide morale. *The pressure the org is under.* |
| Drives + objectives | **Mission vs. reality** — the official goal and the gap between it and how the place actually runs (the hypocrisy seam) |
| Formative events | **Company history** — recent reorg, layoff round, founder's exit, merger, scandal, failed product, new CEO. *The narrative charge that explains why the tensions exist — and seeds relationships + scenarios.* |
| Relationships | **Social climate** — org-wide trust/factionalism texture + named inter-department rivalries + power centers |
| Beliefs / knowledge | **Company narrative** — org-wide open secrets, official story vs. reality (full-richness inclusion) |
| (the people) | **Departments as rich sub-entities** — each a "mini-personality": subculture (inherits + deviates from company), function, capability/medium (E38 via E2), head, morale, rivalries |

Derived company aggregates (the company analog of persona `applyDerived`) are computed, not
authored — e.g. a `factionalism` / `fear` / `volatility` climate read off the culture axes +
state + history, consumed by the cascade's weighting. Authored overrides win, as everywhere else.

## The cascade generator

`generateCompany(seed, archetype, dials)` — same seeded, override-friendly pattern the tool
already uses (`mulberry32`, ranges, "bias not lock"), run as a three-tier cascade:

1. **Company** — sample identity, culture axes, economic state, mission, history, narrative from
   the archetype's ranges (the company analog of sampling a `PersonaTemplate`).
2. **Structure** — derive department set + org-chart depth from size/age/hierarchy; emit into
   **E2's** catalog + org-structure artifact.
3. **Departments** — each gets a subculture biased by company culture + a deviation budget (a
   toxic team inside a healthy firm is allowed).
4. **People** — generate personas via **E3**, re-weighted by company + department culture.
5. **Relationships** — **E3** graph wiring, biased by factionalism + **seeded by formative
   events** (a layoff round creates resentment edges).
6. **Scenarios** — company history pre-loads/biases eligible **E4** templates.

**Company archetypes are the new-game presets** — the company-scale analog of the persona
archetypes: *Declining Incumbent, Hypergrowth Startup, Family Business, PE Cost-Cutting Rollup,
Mission-Driven Nonprofit, Post-Merger Frankenstein, Sleepy Bureaucracy.* Each is a coherent
bundle of culture ranges + likely history + structural shape + department weighting + scenario
affinity.

## Contract impact (additive)

- New project-level payload `company.json` (the cascade root: identity, culture axes, economic
  state, mission, history, narrative, climate aggregates) under a new `CONTRACT.md` §3.x.
- The export bundle is reframed as a **company package** — `company.json` at the root, with the
  existing `org-structure.json` / personas / relationships / `office-layout.json` /
  `scenario(-template).json` as its children. No existing payload changes shape.
- Schema bump; document compatibility (§7). Same free-text-with-fallback discipline for any new
  vocabularies (industry, ownership, history-event kinds).

## Dependencies & coordination (the "independent sibling" guardrail)

E5 is decoupled in scheduling but **must not fork the department/org model**. The rule:

- **Reuse, do not redefine.** Structure derivation (F5.3) emits into **E2's** department catalog
  and org-structure artifact; persona generation (F5.5) calls **E3's** persona-template path;
  relationship wiring (F5.6) extends **E3's** graph generation; scenario seeding (F5.7) consumes
  **E4's** export + the scenario-library. E5 owns the **company root + culture + history + the
  cascade logic and weighting** — nothing E1–E4 already own.
- If E1–E4 are not yet built, E5 can stub their artifacts behind the same shapes, but the shapes
  stay theirs. Two department models is the failure mode this rule exists to prevent.

## Open decisions

- **Generate-vs-author balance** — is a company fully procedural from `(seed, archetype)`, or
  author-key-facts-then-fill? Default: fully generated, every field overridable (matches the tool).
- **Company narrative / open-secrets home** — authored as company knowledge here, or folded into
  the scenario `knowledge.json` start-state? (Full-richness pulls it into the company model;
  confirm it doesn't duplicate scenario knowledge.)
- **Cascade strictness** — bias-with-deviation-budget (proposed, matches "bias not lock") vs.
  strict inheritance. Default: bias with a per-department deviation budget.
- **Economic state depth** — structured fields the sim can read as pressure, vs. flavor only.
  Full-richness includes structured fields; the sim-side consumer is a separate ask.
- **Industry as a content axis** — how many industries/archetypes ship as content vs. a generic
  spread tagged by industry (the E3 question, one tier up).

## Candidate features (decomposition seeds)

- Company model + derived climate aggregates + a hand-authored reference company.
- Company archetype library (seeded generators; the new-game presets).
- Structure derivation → E2 catalog + org-structure artifact.
- Department subculture cascade (bias + deviation budget).
- Culture-weighted persona generation (over E3).
- History-seeded relationship & climate wiring (over E3).
- History-seeded scenario eligibility (over E4 + scenario-library).
- Company package export (`company.json` + bundle repackage; contract + schema bump).
- Company authoring & preview UI (the "Company" tab; pick archetype/seed/dials, inspect cascade,
  override any field).
- Seed coverage & drama validation (playable, drama-rich, structure resolves, culture diverged).

## Status

DRAFT, ready for decomposition into features/stories. The feature breakdown is in
`epics/epic-05-company-level-generation/`. Downstream of the Build 0.4 harvest gate like the rest
of office-scale — the atom must prove fun on the small cast first.
