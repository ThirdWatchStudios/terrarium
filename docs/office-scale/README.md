# Company Generation — Terrarium's new-game seed (the office-scale program)

> **SUPERSEDED (2026-07-09):** this program's premises died with the sim's
> **office-builder pivot** (2026-07-05/07, sim `docs/design/the-office-builder.md`):
> the org no longer pre-exists (new game = bare lot, player-built office), fog-of-war
> org reach (sim E38–41) is deferred unbuilt, and there is no company-seed-per-new-game
> (single persistent branch; the generator now produces the *origin company* the
> carryovers transfer from). Separately, sim ADR-0003 moves behavioral identity to the
> sim/Unity side. See [`unity-rehoming-disposition.md`](unity-rehoming-disposition.md)
> for the per-epic post-pivot audit. **Do not implement E0–E4 stories in Terrarium.**
> These docs are retained as design history; any revival happens sim-side against the
> B5 "long-session depth" problem.

**Status: DRAFT for decomposition.** This is the Terrarium (authoring-studio) program behind
The Water Cooler's "office-scale" direction. Its spine is **company generation**: a first-class,
generated **company** — as rich as the personas inside it — whose culture, economy, and history
**cascade down** into the departments, people, relationships, and scenarios below. The output is
the **new-game seed**: one company seed → an entire coherent, distinct organization.

The former four office-scale work areas (layout, org structure, population, scenarios) are **not
independent epics** — they are the **tiers the company cascade fills**. The company root is built
first (its model + the cascade seams), the tiers fill in against those seams, and the root closes
out with the cascade orchestration, the company package export, and seed validation.

## Where this comes from

The Water Cooler design docs (the `game-design-docs` repo) converged on a direction for how the
office **scales over a long playthrough** to give the game momentum and escape a fixed-cast
content ceiling. Sim-side source of truth:

- `the-water-cooler/docs/prototype-scope/14_OFFICE_SCALE_DIRECTION.md` (the direction)
- sim gap epics **38–41** (org chart & reach; department population & cast growth;
  cross-department casting; structural intervention)

The sim-side spine: **the whole organization pre-exists**, and the player is *granted fog-of-war
reach* into it wing by wing — never building or staffing it. A persistent core cast grows by a
**departmental periphery**; reached wings stay always-live; departments double as **capability
unlocks**; cross-department pairings and an engineered-reorganization (transfer) tier deepen the
loop. A large share of that pre-existing organization is **authored/generated content** — which
is Terrarium's job, and is exactly what company generation produces.

## Why this is Terrarium work

Terrarium authors the **8:00 AM starting state** — "employees, departments, office layout, props,
visual identities, and starting social conditions" (see the repo README) — and exports a package
the sim loads. It never scripts behavior. Company generation does not change that boundary; it
makes the starting state Terrarium authors **generated, structured, and coherent from the top
down**: an entire company with a character of its own, instead of a flat office with one fixed
cast.

## The shift: bottom-up → top-down

Generation today is **bottom-up** — generate people, tag them with a free-text department. Two
companies can only differ by roster. This program flips it **top-down**: generate a *company*,
derive its structure, and cascade its character down into everything below.

```text
Epic 0  COMPANY ROOT  (the generated company: identity, culture, economy, mission,
   │                   history, narrative, social climate — as rich as a persona)
   ├─ Structure  → Epic 2  org chart + department catalog the cascade derives into
   │     └─ Population → Epic 3  people + relationships the cascade fills, culture-weighted
   │                            and history-seeded
   ├─ Layout     → Epic 1  multi-department wings: the physical projection of structure
   └─ Scenarios  → Epic 4  scenario eligibility the cascade history-seeds
   ▼
   Company package  (one new-game seed the sim loads)
```

**Company archetypes are the new-game presets** — the company-scale analog of the 13 persona
archetypes: *Declining Incumbent, Hypergrowth Startup, Family Business, PE Cost-Cutting Rollup,
Mission-Driven Nonprofit, Post-Merger Frankenstein, Sleepy Bureaucracy.* Pick one + a seed → a
whole living company.

## The tiers

The company root is the spine; the four former work areas are the tiers it cascades into. Numbers
**E1–E4 are unchanged** (the existing GitHub import is preserved); the company root is added as
**Epic 0**, built first.

| Tier | Epic | Doc | Role in the company cascade | Serves sim |
|---|---|---|---|---|
| **Root** | **E0** | [00](00-company-root-and-cascade.md) | The generated company + cascade orchestration + package export + validation | full-game seed |
| Structure | E2 | [02](02-org-structure-and-org-chart.md) | Department catalog + org chart the cascade **derives** from company size/age/hierarchy | E38 |
| Population | E3 | [03](03-structured-departments-and-population.md) | People + relationships the cascade **fills**, culture-weighted and history-seeded | E39 (+ E41) |
| Layout | E1 | [01](01-multi-department-office-layout.md) | Multi-department wings: the **physical projection** of generated structure | E38, E39 (+ E41) |
| Scenarios | E4 | [04](04-scenario-template-export-and-preconditions.md) | Scenario eligibility the cascade **history-seeds** | E40 (+ E30/E34) |

The lighter sim-side asks fold into their tiers: E41's *transfer* needs a **mutable structured
department** (E3) + **spare desk/anchor capacity** (E1); E38's **capability mapping** rides on the
org-structure artifact (E2).

### The cascade seams each tier must expose

The whole point of building the company root first is that the tiers are built **with the seams
the cascade drives**, rather than retrofitted:

- **E2 (Structure)** — the department catalog carries **subculture fields**, and the org-structure
  artifact is **derivable** (the cascade writes it from company character, not only hand-authored).
- **E3 (Population)** — persona generation accepts a **culture-weighting hook** (company +
  department culture bias selection, "bias not lock"); relationship generation accepts a
  **history-seeding hook** (formative company events seed concrete edges).
- **E1 (Layout)** — wings group by the **department ids the cascade produced**; spare-capacity for
  the transfer tier.
- **E4 (Scenarios)** — eligibility/salience accept a **history-seeding hook** so opening scenarios
  are caused by the company's past.

## What Terrarium does today (the baseline)

Accurate current state, so the tiers build on it rather than re-describe it:

- **Office layout generation** (`ROADMAP.md` 1.2, 2.4): a single flat office — fixed 22×14 grid,
  shared-edge room templates, all non-manager cast seated in one `cubicle-farm`. A C# runtime
  port (2.4) generates offices **at runtime in Unity**, with the tool's layout JSON as a
  debug/golden artifact.
- **Office Population Generator** (DONE 2026-06-13): department **visual** generation profiles,
  bulk `generatePopulation`, `EmployeeDefinition.metadata { department, role, agentId,
  displayName }`. Department-aware *visual* generation exists — but `department` is flat metadata,
  and it generates visual DNA, not full personas, relationships, or org structure.
- **Personas** (`CONTRACT.md` §3.2): rich `profile.json` (OCEAN + game axes, needs, drives,
  traits, **relationships**, routine, **formativeEvents**). `department` is **free-text** today.
- **Persona templates** (`docs/persona-template-model.md`, DRAFT): seeded archetypes — the model
  the population tier and the company cascade both weight.
- **Relationships** (`CONTRACT.md` §3.7): 12 relationship types, **any-to-any**, third-party
  coupling — the model is not the blocker, generation just has to populate it.
- **Scenario templates** (`CONTRACT.md` §3.8, DONE tool-side): cast-agnostic role slots +
  preconditions + emotional payload, `castTemplate`, coverage analysis.
- **No company entity, no org-chart artifact, no department→capability mapping, no multi-wing
  layout.**

## Architecture & contract notes

- **This is `modern-office` content-pack work, not engine work** (`TOOL_ARCHITECTURE.md`): the
  company model, departments, org structure, and capability tags are game-specific. Keep them out
  of the game-agnostic sprite engine.
- **Contract changes are additive** (schema currently v9; `CONTRACT.md` §7). The new `company.json`
  root and new fields (department subculture, structured/mutable department, capability tags,
  distance preconditions) bump the schema but do not break existing exports; the bundle becomes a
  **company package** with the existing payloads as children.
- The **office-as-runtime-generated decision** (`ROADMAP.md` 2.4) interacts with the "the org
  pre-exists and persists" premise — see E1's open decision on authored vs.
  runtime-generated-and-persisted offices.

## Design decisions that gate who builds what

1. **Where does the department → capability/medium mapping live** — authored in Terrarium
   (pack-portable) or sim-side config? (E2.)
2. **Is organizational distance structural or spatial** — org-chart distance, layout (wing-to-wing)
   distance, or both? (E1/E2/E4.)
3. **Generate-vs-author balance for the company** — fully procedural from `(seed, archetype)`, or
   author-key-facts-then-fill? Default: fully generated, every field overridable. (E0.)
4. **Company narrative / open-secrets home** — the company model, or folded into scenario
   `knowledge.json` start-state? (E0/E4.)

## Sequencing

All of this is **downstream of the sim proving the harvest atom is fun** (the sim-side Build 0.4
order). It is not urgent. Within the program, the build order is set by the cascade:

1. **E0 company model + cascade seams first** — define the company entity and the hooks E1–E4 must
   expose, so the tiers are built right the first time.
2. **The tiers (E1–E4)** — built against those seams. The two **parallel-safe, land-early** items
   still hold: the **structured + mutable `department` field** (E3) and the **scenario-template
   export** (E4) ride work the sim's casting epic needs regardless of company scale.
3. **E0 cascade orchestration + company package export + seed validation** — close the loop once
   the tiers exist.

## Status

DRAFT, ready for decomposition into features/stories and a refreshed GitHub import. The Epic 0
feature breakdown is in `epics/epic-00-company-root-and-cascade/`. The E1–E4 tier docs still need
their **cascade-seam re-aim** (the seams listed above). Nothing here is built yet; these docs hold
the scope and the seams.
