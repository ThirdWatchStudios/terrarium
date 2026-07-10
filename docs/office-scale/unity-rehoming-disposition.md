# Office-Scale Re-Homing Disposition (companion to sim ADR-0003)

**Status:** Revised 2026-07-09 (same day) after reconciling with the sim's
**office-builder pivot** (2026-07-05/07). Companion to the sim repo's
`docs/adr/0003-terrarium-sim-authoring-boundary.md`.

## Post-pivot revision — read this first

The audit below was drafted against the pre-pivot direction and survives as the
*where-would-it-live* analysis. The pivot changes the more basic question —
*whether* — for most of the program:

| Epic | Pre-pivot disposition (below) | Post-pivot fate |
|---|---|---|
| E0 Company root & cascade | → sim | **Mostly dead.** No company-seed-per-new-game (single persistent branch). The surviving fragment already exists sim-side: the generated **origin company** the carryovers transfer from (`founding-flow`, `OriginCompanyRecord`). The new authored surface is the **carryover handful** (people/culture worth mourning), not company packages. |
| E1 Multi-department layout | → sim (already was) | **Dead.** The player *builds* the office; new game generates a bare build site, not a finished office. Wings/fog-of-war reveal deferred unbuilt (sim E38–41, Phase E/F). |
| E2 Org structure & chart | → sim | **Deferred** with sim E38. `OrgStructureGenerator` exists sim-side for the origin company; the player-facing org chart has no current home in the builder loop. |
| E3 Departments & population | → sim | **Partially alive, sim-side.** Origin-roster generation ships (founding-flow manifest + appeals). Structured/mutable department field, department cohorts, transfer support: deferred with E39/E41. |
| E4 Scenario templates | → sim | **Deferred.** Scenarios demoted to "designed probes" in the archived phase plan; the export-split follow-up is parked tech debt (sim `scenario-cast-decoupling.md`). |

**What replaced this program as Terrarium's active work:** builder asset support
(sim `docs/design/terrarium-office-builder-assets.md` — footprints +
`facility-catalog.json` + build-site assets DONE; surveillance apparatus, IRIS
unit, QuotaCo facility variants, carryover authoring open) and the content
pipeline (`docs/content-pipeline-plan.md`). The ADR-0003 *boundary* conclusion
is unchanged and is now stated verbatim in the sim's own docs: "Terrarium
authors + bakes assets; the sim owns all generation."

---

## Pre-pivot audit (historical — the where-would-it-live analysis)

Audit of the office-scale program (E0–E4) against the ADR-0003 boundary,
epic by epic. Headline: **the program's generative spine re-homes to the sim.**
This is cheap right now — the program is DRAFT and nothing is built — and one
epic (E1) is *already* mis-aimed at code ADR-0001 deleted.

| Epic | As written targets | Disposition | Why |
|---|---|---|---|
| E0 Company root & cascade | Terrarium | **Sim** | Runtime new-game seed — the same force as ADR-0001 |
| E1 Multi-department layout | Terrarium (`layout.ts`) | **Sim** (already is) | Doc targets the generator ADR-0001 deleted; stale |
| E2 Org structure & chart | Terrarium | **Sim** | Derivable-by-cascade artifact + behavioral authoring |
| E3 Departments & population | Terrarium | **Sim**, one flagged exception | Runtime cast growth; visual-DNA question flagged below |
| E4 Scenario-template export | Terrarium (two-sided contract) | **Sim** | Single-sided: authored and consumed in one place |

## E0 — Company Root & Cascade → sim

The epic's own premise decides it: "one company seed → an entire coherent
organization" as **the new-game seed**. ADR-0001 already established that a new
game generates its office at runtime in the sim, and that runtime office
generator consumes the department ids this cascade produces (E1's seam: "wings
group by the department ids the cascade produced"). A runtime office cannot be
laid out for departments that don't exist yet — so the cascade runs at runtime,
in the sim. Building it in TypeScript first would recreate the F15 re-port cycle.

- F0.1–F0.8, F0.10 (model, archetypes, derivation, cascade, export, validation):
  sim-side C# from the start. The cascade-seam design work in these docs is
  sound and transfers as-is — only the implementation home changes.
- F0.9 (Company authoring & preview UI): a Unity editor window, not a Terrarium
  tab. Gains play-mode preview of the generated company for free.
- Company archetypes and the hand-authored reference company: JSON content in
  the sim repo, edited via the Unity tooling (JSON stays canonical per ADR-0003).
- "Company package export" reframes as **company package generation/loading** —
  there is no tool→sim export step for generated companies; the seam is
  new-game-time, not author-time.

## E1 — Multi-Department Office Layout → sim (it already is)

**This doc is stale independent of ADR-0003.** It predates ADR-0001: its
prototype estimate says "extend `src/core/layout.ts`" — the generation subtree
ADR-0001 deleted (1933 → 539 lines) — and F1.5 proposes tool↔runtime parity
golden tests, the exact two-implementation cycle ADR-0001 ended. The sim's
`OfficeLayoutGenerator` is the canonical home for all of F1.1–F1.4 (wing
grouping, per-wing desk anchors, connectivity graph, footprint scaling); F1.5
becomes ordinary sim-side golden tests, no parity dimension.

Terrarium residue (small, stays here): the scene-*reading* helpers
(`computeWings`, `computeWingConnectivity`, `sceneToLayoutJson`) must stay
conformant with the schema's wing/connectivity additions so hand-painted scenes
still export valid `office-layout.json`. That is contract-conformance work, not
generation work.

## E2 — Org Structure & Org Chart → sim

Pure behavioral identity, and its cascade seam already requires the artifact to
be *derivable* by E0 (which is now sim-side). Department catalog, org-structure
artifact, reporting lines, validation: sim-side model + Unity editors over
canonical JSON.

This disposition **resolves the program's open design decision #1** ("where does
the department → capability/medium mapping live"): sim-side. F2.4's
authored-in-Terrarium branch is dead; the capability vocabulary lives with the
sim's clearance/medium model it was always going to be consumed by.

## E3 — Structured Departments & Population → sim, one exception flagged

Persona generation, relationship-graph generation, department-tagged spawn, and
coverage validation all serve runtime cast growth (sim E39) and consume sim-side
artifacts (E1 desks, E2 catalog, the real caster). Sim-side. F3.1 (structured,
mutable `department` field) is a contract/schema change on `profile.json` —
co-owned, but driven from the sim since the sim mutates it (E41 transfers).

**Flagged exception — visual DNA.** The shipped Office Population Generator
generates *visual* identities (recipes) per department, and runtime cast growth
implies generating recipes at runtime too. That pulls toward a sim-side port of
the recipe randomizer and the small compositor (anticipated by the repo README
since the beginning). **Not decided here** — it is its own future ADR. Either
way Terrarium keeps authoring the ingredients (parts, palettes, generation
profiles); the open question is only where the *randomizer* runs.

## E4 — Scenario-Template Export & Preconditions → sim

F4.1's whole framing — "a two-sided contract, keep it synchronized with the sim
caster" — dissolves under ADR-0003: templates are authored (Unity editor),
validated (real caster), and consumed in one repo. Department/distance
preconditions (F4.2/F4.3) extend the sim's casting vocabulary directly; coverage
analysis (F4.4) runs against the real generated org. The existing Terrarium
`scenarioTemplate.ts` / `analyzeTemplateCoverage` code migrates on touch, per
ADR-0003 — no port ahead of need.

This also resolves design decision #2's *home* (organizational distance:
structural vs spatial) as a sim-side decision, since both signal sources (E1
connectivity, E2 chart) now live there.

## What Terrarium keeps

- Everything in `docs/content-pipeline-plan.md`: the visual identity compiler —
  parts/props/tiles authoring, content pipeline, readability lints, style system.
- Scene painting, near-term, as the art-direction/readability surface.
- Export of visual assets + the **cast manifest** (agentId, name, recipe,
  portrait path) that Unity authoring editors reference (ADR-0003 action item 4).
- Scene-reader conformance with layout-schema evolution (E1 residue above).
- Existing Persona/Scenario tabs in maintenance mode until retired on touch;
  the scenario dry-run preview is first to go.

## Execution notes (revised post-pivot, per AGENTS.md workflow)

1. **No replanting.** The pre-pivot plan (replant epic docs sim-side) is
   superseded: the program is dead/deferred, not relocated. The epic docs stay
   here as design history. The Terrarium-side GitHub issues (E1–E4, 66 issues
   in project 6) should be closed or labeled `superseded-by-pivot` via the
   import tools — **do not hand-edit issue bodies**.
2. Permanent stop-gate: no E0–E4 story is implemented in Terrarium (AGENTS.md
   now states this).
3. The old sequencing anchor ("downstream of the sim proving the harvest atom")
   is itself superseded — the sim's make-or-break gate is now **B2
   Build-Shapes-Behavior** (sim `roadmap.md`, re-based 2026-07-05). Any revival
   of org-scale content is a sim-side answer to the B5 "long-session depth"
   problem.
