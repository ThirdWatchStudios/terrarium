# 00 — Company Root & Cascade (the new-game seed)

**Status: DRAFT for decomposition.** The **spine** of the office-scale program (`README.md`):
the company is a first-class, generated entity — as rich as the personas inside it — and the
**generative root** of a top-down cascade into the E1–E4 tiers. The output is the **new-game
seed**: one company seed → a whole coherent, distinct organization. Built **first** (model +
cascade seams), then closed out (orchestration + export + validation) once the tiers exist.

## Purpose

Terrarium can generate **people**. It cannot yet generate the **company they work for**. A long
playthrough needs to open on a believable, *distinct* organization — and "distinct" must mean more
than a different roster. A *declining cutthroat finance firm* and a *scrappy idealistic startup*
should produce different departments, different people, different tensions, different scenarios.
Today nothing makes them diverge, because **the company is not an entity** — `department` is the
highest concept, authored from no unifying character.

This epic makes the **company a first-class, generated entity — as rich as the personas inside
it — and the root of a top-down cascade**: company character biases department subcultures, which
bias the personas generated within them, which seed the relationship graph and the eligible
scenarios. It owns the company model, the archetype library, the cascade orchestration, the
company-package export, the authoring/preview UI, and seed validation. The E1–E4 tiers own the
structures it cascades into.

## The shift: bottom-up → top-down

Generation today is bottom-up (generate people → tag a department). This flips it top-down:

```text
Company  (E0 — this doc: identity, culture, economy, mission, history, narrative, climate)
  └─ Structure   → E2 (department catalog + org-structure / org-chart), derived from company
       └─ Departments  (E0 subculture cascade over E2/E3 departments)
            └─ People   → E3 persona generation, culture-weighted by E0
                 └─ Relationships → E3 graph wiring, history-seeded by E0
       └─ Layout    → E1 multi-department wings (physical projection of structure)
  └─ Scenarios → E4 export, history-seeded eligibility by E0
```

The tiers are **built with the cascade seams** (see `README.md` → "The cascade seams each tier
must expose"), because the company root is built first. There is **one** department/org model
(E2's); the company root populates it, it does not fork it.

## Current state in Terrarium

- **People generation exists.** Visual DNA per department (`employee.ts` `GenProfile`, "bias not
  lock"); seeded persona archetypes (`personaTemplate.ts`, DRAFT) sampling ranges over the
  catalogs. E3 couples these into department populations + a relationship graph.
- **Personas carry `formativeEvents`** (the per-character backstory hook). There is **no company
  analog** — no company history, culture, narrative/open-secrets, social climate, or economic
  state.
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

**Company archetypes are the new-game presets** — *Declining Incumbent, Hypergrowth Startup,
Family Business, PE Cost-Cutting Rollup, Mission-Driven Nonprofit, Post-Merger Frankenstein,
Sleepy Bureaucracy.* Each a coherent bundle of culture ranges + likely history + structural shape
+ department weighting + scenario affinity.

## Contract impact (additive)

- New project-level payload `company.json` (the cascade root: identity, culture axes, economic
  state, mission, history, narrative, climate aggregates) under a new `CONTRACT.md` §3.x.
- The export bundle is reframed as a **company package** — `company.json` at the root, with the
  existing `org-structure.json` / personas / relationships / `office-layout.json` /
  `scenario(-template).json` as its children. No existing payload changes shape.
- Schema bump; document compatibility (§7). Same free-text-with-fallback discipline for any new
  vocabularies (industry, ownership, history-event kinds).

## Dependencies & coordination

- **E0 is the spine, built in two passes.** Pass 1 (model + seams: the company entity, the
  archetype library, and the cascade hooks E1–E4 must expose) lands **first**. Pass 2 (cascade
  orchestration, company package export, validation) lands **after** the tiers exist.
- **One department/org model.** The cascade emits into and reads E2's catalog + org-structure,
  calls E3's persona/relationship generation, consumes E4's scenario export. E0 owns the company
  root + culture + history + the cascade logic and weighting — nothing E1–E4 own.

## Open decisions

- **Generate-vs-author balance** — fully procedural from `(seed, archetype)`, or
  author-key-facts-then-fill? Default: fully generated, every field overridable.
- **Company narrative / open-secrets home** — company model here, or folded into the scenario
  `knowledge.json` start-state? (Full-richness pulls it into the company model; confirm no
  duplication with scenario knowledge.)
- **Cascade strictness** — bias-with-deviation-budget (proposed, matches "bias not lock") vs.
  strict inheritance. Default: bias with a per-department deviation budget.
- **Economic state depth** — structured sim-consumable fields vs. flavor only. Full-richness
  includes structured fields; the sim-side consumer is a separate ask.
- **Industry as a content axis** — how many industries/archetypes ship as content vs. a generic
  spread tagged by industry.

## Candidate features (decomposition seeds)

See `epics/epic-00-company-root-and-cascade/` for the full breakdown (F0.1–F0.10):
company model + reference company → archetype library → structure derivation → subculture cascade
→ culture-weighted personas → history-seeded relationships → history-seeded scenarios → company
package export → Company tab UI → seed coverage/drama validation.

## Status

DRAFT, ready for decomposition. Downstream of the Build 0.4 harvest gate like the rest of the
program — the atom must prove fun on the small cast first.
