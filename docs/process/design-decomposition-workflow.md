---
title: Design Decomposition Workflow
game: repo
doc_type: process
status: active
canonicality: working_direction
owner: TBD
departments:
  - Production
  - Design
  - Engineering
  - UX
tags:
  - process
  - planning
  - decomposition
  - epics
  - features
  - stories
updated: 2026-06-08
related_docs:
  - prototype-vs-mvp-planning.md
  - github-issue-import-workflow.md
related_issues: []
attention:
  status: clear
  needs: none
  summary: Reusable decomposition workflow for turning any game design into epics, features, stories, and optional GitHub imports.
---
# Design Decomposition Workflow

## Purpose

Use this workflow when any design in this repository needs to move from concept, sketch, prototype notes, or design docs into epics, features, stories, implementation tasks, or GitHub issue import artifacts.

This workflow is design-agnostic. Project-specific decomposition docs may add examples, feature names, or constraints, but they should not replace these guardrails.

## Inputs

Before decomposing, gather:

- current project state
- current design source docs
- current prototype or playable sketch evidence, if any
- implementation repository target, if one exists
- GitHub Project target, if one exists
- current phase classification from [Prototype Vs MVP Vs Production Planning Standards](prototype-vs-mvp-planning.md)

If the project does not have an implementation repository or GitHub Project yet, decomposition can still proceed. Mark issue import as pending until the target exists.

## Step 1 - Classify The Work

Classify the work as one of:

```text
Prototype Discovery
MVP Implementation
Production Architecture
```

Record:

- project phase
- planning intent
- why this is the correct phase
- what evidence exists
- what remains unproven

For prototype discovery, the default goal is the cheapest playable proof. For MVP implementation, the goal is a dependable version of a proven loop. For production architecture, the goal is reusable scale after the game loop has enough evidence.

## Step 2 - Define The Vertical Slice Boundary

Define one narrow slice before naming epics.

The boundary should answer:

- What is the one player-facing loop or scenario?
- What can the player see?
- What can the player decide?
- What can fail or change?
- What can the player retry or compare?
- What is explicitly out of scope?

If the slice is not player-facing, state why. Examples include tooling, import workflow, documentation, build infrastructure, or repository setup.

## Step 3 - Create Epic Boundaries

Create only the epics needed for the current slice.

Each epic should include:

- epic code, such as `E1`
- title
- purpose
- project phase
- planning intent
- what the player can experience
- prototype estimate
- MVP estimate
- included scope
- not included scope
- exit question

Gameplay-facing epics must include a final playable validation or playable sandbox feature. A working debug surface is not enough.

Non-gameplay epics may omit playable validation only when they explicitly state why the epic is tooling, documentation, infrastructure, or import-only work.

## Step 4 - Define Feature Sequence

Each epic feature breakdown should include a `## Feature Sequence` table.

Recommended columns:

```text
| Order | Code | Feature | Depends On | Purpose |
```

Feature codes should be stable:

```text
F1.1
F1.2
F1.3
```

Each feature should include:

- project phase
- planning intent
- what the player can experience
- prototype estimate
- MVP estimate
- goal
- feature scope
- done when
- exit question, when useful

Keep feature scope narrow enough that it can become a few observable stories.

## Step 5 - Slice Stories By Evidence

Create story specs from feature definitions.

Prefer stories that complete one causal or playable link.

Good:

```text
When two agents overlap in the break room, the simulation creates an encounter event that the player can inspect.
```

Weak:

```text
Build conversation system.
```

Each story should include:

- story code, such as `S1.1.1`
- title
- user story or implementation outcome
- acceptance criteria
- required debug visibility, if needed
- dependencies
- placeholder or deferred notes
- out-of-scope notes

Stories should be testable through visible behavior, event output, a focused debug surface, or another clear verification artifact.

## Step 6 - Check For Overbuilt Scope

Before creating an issue import artifact, check:

- Does every gameplay-facing epic end in playable validation?
- Does every feature serve the current vertical slice?
- Does every story produce observable evidence?
- Are registries, descriptors, generalized interfaces, reusable frameworks, or broad validation justified by at least two implemented gameplay features?
- Are debug tools explaining the loop rather than becoming the deliverable?
- Are content pipelines and broad authoring tools deferred unless they unblock the current slice?

If the answer is unclear, tighten the Markdown source before issue import.

## Step 7 - Prepare Import Artifacts

Only after the Markdown source docs are coherent, generate the GitHub issue import CSV.

Use:

- [GitHub Issue Import Workflow](github-issue-import-workflow.md)
- `tools/planning/generate_github_issue_import_csv.py`
- `tools/planning/plan_github_issue_import.py`

The current import tooling expects:

- stable `E`, `F`, `P`, and `S` planning codes
- an epic feature breakdown with a `## Feature Sequence` table
- feature sections headed like `### F1.1 - Feature Title`
- story sections headed like `### S1.1.1 - Story Title`

If a design uses different source docs, adapt the docs to this import shape before generating CSVs.

## Step 8 - Keep Docs As Source

After import, GitHub issues become the execution mirror.

Do not let GitHub become the only source of design intent.

When scope changes materially:

1. Update Markdown source docs.
2. Regenerate or sync the CSV/import plan.
3. Sync GitHub issue bodies or create missing issues.
4. Update AI context and status docs when direction changes.

## Output Checklist

A decomposition pass is complete when it produces:

- phase classification
- vertical slice boundary
- epic list
- feature breakdowns
- story specs
- playable validation or documented non-gameplay exception
- deferred/out-of-scope list
- optional GitHub target config
- optional GitHub issue import CSV

Keep the first pass small enough to start implementation without turning the backlog into the full game.
