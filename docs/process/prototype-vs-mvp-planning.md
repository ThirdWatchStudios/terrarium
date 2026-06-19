---
title: Prototype Vs MVP Vs Production Planning Standards
game: repo
doc_type: process
status: active
canonicality: canonical
owner: TBD
departments:
  - Production
  - Design
  - Engineering
tags:
  - planning
  - prototype
  - mvp
  - production
updated: 2026-06-01
related_docs:
  - design-decomposition-workflow.md
  - github-issue-import-workflow.md
  - enter-the-voidwake/PROJECT_STATUS.md
  - enter-the-voidwake/docs/prototype/prototype-arena-loop-01.md
  - enter-the-voidwake/docs/07-production-planning/00-roadmap/Prototype_ArenaLoop_01.md
related_issues: []
attention:
  status: clear
  needs: none
  summary: No metadata-level attention need.
---
# Prototype Vs MVP Vs Production Planning Standards

## Purpose

Use this standard before decomposing gameplay work into epics, features, stories, or implementation tasks.

The core distinction is:

```text
Prototype = prove fun
MVP = prove game
Production = scale the game
```

Recent Enter the Voidwake planning showed that AI agents can overbuild prototype epics when docs use "MVP" language too early. The resulting architecture, debug, registry, descriptor, and validation plans can be strong, but the playable game can lag behind.

Prototype planning must keep the first question concrete:

```text
Can I play the thing yet?
```

For Enter the Voidwake's current reset, the active hierarchy is:

```text
Prototype Discovery
↓
MVP
↓
Production
```

Do not treat these phases as interchangeable. When they conflict, Prototype Discovery wins until the current project status exit criteria are met.

## Definitions

### Prototype

A prototype is a fast, ugly, playable proof of fun.

It exists to answer whether a player can see, feel, decide, fail, recover, retry, and want another attempt. It may be hardcoded, fragile, visually rough, and limited to one scenario if that gets the game into hands faster.

### MVP

An MVP proves the game: a coherent, limited loop suitable for external validation.

It should preserve the proven prototype loop while making the implementation dependable enough for real playtesters, repeatable content setup, basic quality standards, and shippable slice evaluation.

### Production

Production is a scalable, maintainable implementation for real content expansion.

It exists after the fun and shippable loop have been proven. Production work optimizes, generalizes, scales, hardens workflows, and prepares the project for more content and more people.

## Prototype Rules

- Prefer playable behavior over generalized architecture.
- Hardcode fixtures when useful.
- Build the cheapest playable version first.
- Avoid registries, descriptors, generalized interfaces, and broad validation unless two implemented gameplay features require them.
- Debug exists to explain observed gameplay problems, not to replace gameplay.
- Keep diagnostic surfaces compact and subordinate to the loop being tested.
- Defer content pipelines, admin dashboards, telemetry dashboards, and broad tooling until they unblock a playable test.
- Record follow-up risks as later MVP or production work instead of hiding them inside the prototype.

## Prototype Gameplay Questions

For early Enter the Voidwake-style work, prototype planning should bias toward questions like:

```text
Can I move?
Can I dash?
Can I change colors?
Can I create matches?
Does the board refill/evolve?
Can I affect an anchor?
Do I want to play again?
```

Project-specific prototypes should rewrite this list in their own terms, but the standard remains the same: player-visible interaction comes before durable architecture.

For the current Enter the Voidwake prototype, the immediate question is:

```text
Does moving through a puzzle arena to stabilize anchors create a compelling game?
```

The loop under test is:

```text
Move
Dash
Color Manipulate
Match
Board Evolves
Anchor Stabilizes
Territory Changes
Repeat
```

## Epic Decomposition Rule

Every gameplay-facing epic must include a final feature like:

```text
Playable Validation Feature
```

or:

```text
Playable Sandbox Feature
```

The name can be project-specific, such as `Playable Operational Terrain Prototype`, but the purpose must stay explicit: integrate the epic's systems into something playable.

That feature must answer:

- what loop the player can enter
- what the player can see and act on
- what failure or pressure exists
- what retry path exists
- what later epics are allowed to assume
- what remains unproven

Non-gameplay epics may omit this only when the decomposition states why the epic is tooling, documentation, infrastructure, or import-only work.

## Estimate Rule

For future decomposition, require two estimates:

```text
Prototype estimate: cheapest playable test
MVP estimate: proper reusable implementation
```

Default to the prototype estimate during discovery. Use the MVP estimate only after the team has evidence that the loop is worth hardening.

Do not hide MVP or production work inside the prototype estimate. If a task needs reusable implementation, name it as the MVP estimate and defer it unless it is required to answer the playable prototype question.

## Prototype Architecture Rule

Before creating registries, descriptors, generalized interfaces, reusable frameworks, or broad validation layers, ask:

```text
Do at least two implemented gameplay features actively require this abstraction?
```

If not, prefer direct implementation.

## Exit Gate

Every prototype epic should answer:

```text
What can the player see, feel, decide, fail, or retry because of this work?
```

If the answer is only:

```text
New systems exist
```

the epic is not done.

## Agent Instructions

Use this instruction before decomposing any gameplay epic:

```text
Before decomposing an epic, classify it as Prototype Discovery, MVP Implementation, or Production Architecture.

For Prototype Discovery:
- prioritize playable validation
- minimize generalized systems
- allow hardcoded fixtures
- create one visible gameplay loop quickly
- only add debug/validation that helps diagnose the playable loop

For MVP Implementation:
- formalize systems proven by prototype
- add reusable contracts
- add appropriate validation
- maintain production-quality ownership boundaries

For Production Architecture:
- optimize, generalize, scale, and prepare content workflows
```

## Decomposition Template Requirements

Epic decomposition prompts, feature breakdowns, story templates, and issue-import plans must include:

- Project phase: `Prototype Discovery`, `MVP Implementation`, or `Production Architecture`
- Planning intent: one sentence explaining why that phase is correct
- Prototype estimate: cheapest playable test
- MVP estimate: proper reusable implementation
- Playable validation or playable sandbox feature for gameplay-facing epics
- What the player can experience: visible actions, feedback, decisions, failure, retry, and desire to continue
- Debug/validation guardrail: debug must explain the playable loop, not become the deliverable
- Admin/tooling guardrail: dashboards, registries, descriptors, generalized interfaces, and broad validation require evidence from at least two implemented gameplay features

## Warning

```text
A working debug surface is not a working game.
A playable game can often prove more than a perfect diagnostic layer.
```

## Applying This Standard

Apply this standard whenever a game project moves from concept into backlog, prototype, MVP, or production planning.

For the operational workflow that turns this classification into epics, features, stories, and optional import artifacts, use [Design Decomposition Workflow](design-decomposition-workflow.md).

For future projects:

- use prototype language until the loop has been played
- keep the first decomposition small enough to produce one playable test
- add the playable validation feature before import or execution
- keep debug scoped to observed play problems
- promote systems to MVP or production only after the prototype proves they are needed
