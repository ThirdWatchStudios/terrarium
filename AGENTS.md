# AGENTS.md

Guidance for AI coding agents working in the **Terrarium** repository
(`SpriteCharacterCreator` on disk; `ThirdWatchStudios/terrarium` on GitHub).

## Project Context

- Terrarium is the **asset authoring studio** for The Water Cooler — a TypeScript + Vite app
  that authors and bakes the game's visual identity (characters, facility/prop sprites,
  walls/floors/grounds, UI marks) plus exported behavioral catalogs (personas, behaviors,
  traits, scenario templates). Since the sim's **office-builder pivot** (2026-07-05, sim
  `docs/design/the-office-builder.md`): the game is a QuotaCo branch-builder — bare lot,
  player-built office, ratcheting quota, social sim as ambient life. Division of labor:
  *Terrarium authors + bakes assets; the sim owns all generation, rendering, and simulation*
  (sim ADR-0001/0003). The Persona/Scenario tabs are **feature-frozen** (behavioral authoring
  migrates to Unity tooling per ADR-0003).
- Unlike The Water Cooler (where design docs live in a separate `game-design-docs` repo), this
  repo is **self-contained**: the design docs, the decomposed epic/feature/story backlog, **and**
  the implementation all live here.
  - Implementation: `src/` (TypeScript). Build with `npm run build`; test with `npm run test`
    (vitest); headless export with `npm run export`.
  - Export contract: `CONTRACT.md` (authoritative tool↔sim boundary; update it when the export
    shape changes). Architecture direction: `TOOL_ARCHITECTURE.md`. Roadmap: `ROADMAP.md`.
  - Design notes: `docs/scenario-template-model.md`, `docs/persona-template-model.md`,
    `docs/scenario-library.md`.
- **Current active work: builder asset support + the content pipeline.** The sim-side statement
  of what Terrarium supplies is `the-water-cooler/docs/design/terrarium-office-builder-assets.md`
  (footprints + `facility-catalog.json` + build-site assets are DONE; open: surveillance
  apparatus art, IRIS installation unit, QuotaCo-standard facility variants, carryover-character
  authoring). The art-direction plan is `docs/content-pipeline-plan.md` +
  `docs/core-part-library.md`.
- **The office-scale backlog (`docs/office-scale/`, E0–E4) is SUPERSEDED/DEFERRED** — its
  premises (fog-of-war org reach, "the org pre-exists", company-seed-per-new-game) died with
  the pivot; see `docs/office-scale/unity-rehoming-disposition.md`. Do not implement E0–E4
  stories in this repo. Its source of truth and GitHub mirror (retained for the import
  tooling reference):

```text
Source of truth : docs/office-scale/   (overview + work-area docs + epics/)
GitHub repo     : ThirdWatchStudios/terrarium
GitHub project  : Terrarium  (project number 6)
Import config   : docs/office-scale/github-issue-import.config.json
```

- Office-scale work is mostly **`modern-office` content-pack** work (departments, org structure,
  capability tags are game-specific). Keep the game-agnostic sprite engine generic per
  `TOOL_ARCHITECTURE.md`; do not push office/department logic into the engine core.

## Design Source Of Truth

- Markdown planning docs under `docs/office-scale/` are the source of truth. GitHub issues are
  the execution mirror.
- Read the design docs before changing code, the export contract, or assets.
- If a GitHub issue and the design docs disagree materially, stop and report the conflict before
  implementing.
- Do not hand-edit GitHub issue bodies when planning scope changes. Update the Markdown source,
  regenerate the CSV, and sync from the import tools (see GitHub Issue Import Workflow).

Backlog structure (the imported office-scale epics):

```text
docs/office-scale/epics/epic-01-multi-department-office-layout/            (E1)
docs/office-scale/epics/epic-02-org-structure-and-org-chart/               (E2)
docs/office-scale/epics/epic-03-structured-departments-and-population/     (E3)
docs/office-scale/epics/epic-04-scenario-template-export-and-preconditions/(E4)
```

Each epic folder holds a `*-features.md`, per-feature `*-fX-Y-*-stories.md`, and a generated
`*-github-issue-import.csv`. The full direction is `docs/office-scale/README.md`; the sim-side
context lives in the `game-design-docs` repo (`14_OFFICE_SCALE_DIRECTION.md` + epics 38–41).

## Tooling Dependencies

- `git` for worktree inspection, staging, commits, branch state.
- `gh` authenticated for `ThirdWatchStudios/terrarium`. Issue/label/comment ops via REST;
  project status moves need the `project` scope (the active account must have it).
- `node`/`npm` for the tool itself (build, test, export).
- `python3` for the planning tools in `tools/planning/`.

## GitHub Issue Workflow

When asked to `implement issue <number>`, run the full issue workflow:

- Fetch the issue first (REST): `gh api repos/ThirdWatchStudios/terrarium/issues/<number>`.
- Read any referenced source design docs before editing.
- Summarize before changing code: title, state, project status, labels, acceptance criteria,
  and any explicit deferred / out-of-scope notes.
- Implement the scoped task only.
- Verify with appropriate checks (see Verification Expectations).
- Commit only the scoped changes, with the issue number in the message, e.g.
  `Implement issue #14 footprint scaling`.
- Write back an implementation note as an issue comment (REST):
  `gh api repos/ThirdWatchStudios/terrarium/issues/<number>/comments -f body=...` — including
  summary, files changed, verification performed, verification not performed, and any manual
  checks the user should run.
- Move the project item to `Done` if project write access is available (see Quota Discipline).
- Do not move the issue to `In progress` by default unless the user asks.

## GitHub Feature Workflow

When asked to `implement feature <number>` (a feature code like F1.3, or its issue), implement
its child stories as a bounded sequence:

- Fetch the feature issue; summarize its goal, child stories, source design doc, and deferred
  notes. Discover child stories from the feature's sub-issues and the `*-features.md` sequence.
- Default to at most three stories per run unless told otherwise.
- Process stories one at a time in dependency order; each story still uses the full
  `implement issue` workflow (scoped edit, verify, commit, comment, project move).
- Stop instead of improvising if a dependency story is missing/blocked, verification fails, the
  issue and design doc disagree, or unrelated local changes would mix into a commit.
- After the run, comment on the feature issue summarizing stories completed, commit hashes,
  verification performed/not performed, the remaining `Todo` stories, and any blockers.
- Move the feature to `Done` only after all in-scope child stories are `Done` or closed.

## GitHub Full Feature Workflow

When asked to `complete feature <number>` / `implement full feature <number>`, run the feature
workflow repeatedly in same-session batches (≤3 stories each) until the feature is complete or a
stop condition is reached. After every batch: inspect `git status --short`, confirm commits,
write/update a feature checkpoint comment, re-fetch state, recalculate progress, and select the
next dependency-valid `Todo` stories. Do not relax the per-story verification/commit discipline.

## GitHub Epic Workflow

When asked to `work on epic <number>` / `implement epic <number>` (epic code 1–4), run the
epic-level supervisor — it selects the next dependency-valid feature; each selected feature still
uses the Full Feature Workflow. Full process: `docs/process/github-epic-execution-workflow.md`.

Select the next feature (read-only):

```bash
python3 tools/planning/plan_github_epic_work.py \
  --config docs/office-scale/github-issue-import.config.json \
  --project-title "Terrarium" \
  --epic 1
```

Add `--format prompt` for the child-thread handoff prompt, or `--no-github` for the local
CSV-only plan. The thread conductor (`run_epic_threads.py`), step verifier (`verify_epic_step.py`),
and checkpoint renderer (`epic_checkpoint.py`) take the same `--config` + `--project-title` +
`--epic`. Note: `run_epic_threads.py`'s child-thread orchestration assumes the Codex app thread
tools; under Claude Code, drive child features with the Agent tool / sub-sessions instead, but
keep the runner's state file as the queue mutex and the same stop conditions.

Stop instead of launching the next feature if: the next feature is not dependency-valid, a
feature is already in progress, a planned issue is missing, dependencies are unmet, docs and the
GitHub mirror disagree, the previous feature's verification failed, or the worktree has unrelated
changes. Pass `--project-title "Terrarium"` on every epic-script invocation (the scripts default
to The Water Cooler's project title otherwise).

## GitHub Issue Import Workflow

The office-scale backlog is already imported (E1–E4 = 66 issues in project 6). Re-import only when
the design docs intentionally change and the user asks to refresh the mirror. Then: edit the
Markdown source, regenerate the CSV, and sync. Full process: `docs/process/github-issue-import-workflow.md`.

```bash
# regenerate an epic's CSV after editing its features/stories docs
python3 tools/planning/generate_github_issue_import_csv.py \
  --config docs/office-scale/github-issue-import.config.json E<n>

# reconcile bodies/links for an existing import (does not create duplicates; dedups by title)
python3 tools/planning/plan_github_issue_import.py \
  --config docs/office-scale/github-issue-import.config.json \
  --csv docs/office-scale/epics/epic-0<n>-*/*github-issue-import.csv \
  --execute --links-only --sync-existing-bodies --issue-map /tmp/terrarium-reconcile-0<n>.json
```

To create a brand-new epic's issues: decompose it under `docs/office-scale/epics/`, generate its
CSV, dry-run (`plan_github_issue_import.py --config … --csv …`), then execute. **Decouple project
adds**: run `--execute --skip-project` first, then add issues to the project in a paced pass — the
Projects v2 GraphQL secondary limit trips after ~10–14 rapid `item-add` calls.

## GitHub API Quota Discipline

- **Prefer REST (`gh api repos/…`)** for issue bodies, labels, comments, sub-issues, and all
  verification reads. REST uses the core rate limit (~5000/hr) and is far cheaper than GraphQL.
- **Do not** use `gh project item-list`, `gh project view`, or `gh issue list --json` for routine
  verification — those hit the expensive GraphQL/Projects quota. Check budget with
  `gh api rate_limit --jq '.resources.core'`.
- **GraphQL only for what REST cannot do**: Projects v2 reads/mutations (item ids, status moves,
  `gh project item-add`). Keep these minimal and paced.

Cached Terrarium project-6 constants (so we never re-read project metadata):

```text
project id        : PVT_kwDOESc9xM4BbEVQ
status field id   : PVTSSF_lADOESc9xM4BbEVQzhV3fRc
status options    : Backlog f75ad846 | Ready 08afe404 | In progress 47fc9ee4 | In review 4cc61d42 | Done 98236657
```

Move a single issue's project item to `Done` (one minimal GraphQL read for the item id, one
mutation with the cached ids):

```bash
gh api graphql -f query='mutation($project:ID!,$item:ID!,$field:ID!,$option:String!){updateProjectV2ItemFieldValue(input:{projectId:$project,itemId:$item,fieldId:$field,value:{singleSelectOptionId:$option}}){projectV2Item{id}}}' \
  -f project='PVT_kwDOESc9xM4BbEVQ' \
  -f item='<project-item-id>' \
  -f field='PVTSSF_lADOESc9xM4BbEVQzhV3fRc' \
  -f option='98236657'
```

Issue labels: every office-scale issue carries `terrarium` (scope), `planning`, `kind: epic|feature|story`,
`source: design-plan`, and `epic: E<n>`.

## Repository Rules

- TypeScript + Vite project. Keep changes **additive** where the existing tabs, export, and
  contract are concerned — do not regress the Characters/Persona/Scene/Employees tabs or the
  existing export shape.
- When the export shape changes, update `CONTRACT.md` (the §3.x payload + §7 compatibility) and
  bump the schema version (`CURRENT_SCHEMA_VERSION`). The current schema version is 9.
- Keep office/department/scenario content out of the game-agnostic engine core; it belongs in the
  `modern-office` content pack layer (`TOOL_ARCHITECTURE.md`).
- Preserve determinism contracts: seeded generation must reproduce identical output for the same
  inputs (compositor snapshots, layout golden tests, employee Visual DNA).

## Verification Expectations

- Tool-side: `npm run build` (clean) and `npm run test` (vitest green). Add or update golden
  snapshots when generation output legitimately changes; never overwrite a snapshot to hide a
  regression.
- **Cross-repo caveat (office-scale):** some stories — notably the layout C# **runtime-port
  parity** work (E1 F1.5) — land in the Unity repo `The-Water-Cooler`, not here. Do not claim
  Unity build/Play-Mode verification you cannot run; implement carefully and produce a manual
  verification checklist for the user instead.
- Report what was verified, what was not, and any manual checks the user should perform.

## Change Discipline

- Keep edits scoped to the active issue or work item.
- Do not rewrite unrelated files or revert user changes unless asked.
- Include the issue number in summaries and commit messages.
- Commit or push only when the user asks. If on the default branch (`main`), branch first.
