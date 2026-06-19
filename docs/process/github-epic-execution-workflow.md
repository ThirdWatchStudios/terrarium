---
title: GitHub Epic Execution Workflow
game: repo
doc_type: process
status: active
canonicality: canonical
owner: TBD
departments:
  - Production
  - Engineering
tags:
  - github
  - workflow
  - execution
  - epics
updated: 2026-06-10
related_docs:
  - docs/process/github-issue-import-workflow.md
related_issues: []
attention:
  status: clear
  needs: none
  summary: Read-only epic-level supervisor workflow for routing feature implementation threads.
---
# GitHub Epic Execution Workflow

Use this workflow when a GitHub-backed project already has imported epic, feature, and story issues, and the desired command is at epic scope, such as `work on epic 8`.

The epic layer is a supervisor. It selects the next dependency-valid feature and verifies progress between feature runs. It does not replace the story-level issue workflow or the full-feature workflow.

## Entry Command

From this repository:

```bash
python3 tools/planning/plan_github_epic_work.py \
  --config the-water-cooler/docs/prototype-scope/github-issue-import.config.json \
  --epic 8
```

To print only the child-thread prompt:

```bash
python3 tools/planning/plan_github_epic_work.py \
  --config the-water-cooler/docs/prototype-scope/github-issue-import.config.json \
  --epic 8 \
  --format prompt
```

To inspect the local CSV-derived plan without GitHub reads:

```bash
python3 tools/planning/plan_github_epic_work.py \
  --config the-water-cooler/docs/prototype-scope/github-issue-import.config.json \
  --epic 8 \
  --no-github
```

To run the thread conductor, which emits one launch packet and tracks the active child thread:

```bash
python3 tools/planning/run_epic_threads.py \
  --config the-water-cooler/docs/prototype-scope/github-issue-import.config.json \
  --epic 8
```

If the supervising agent knows the Codex saved project id, include it to emit a `create_thread` payload:

```bash
python3 tools/planning/run_epic_threads.py \
  --config the-water-cooler/docs/prototype-scope/github-issue-import.config.json \
  --epic 8 \
  --project-id <codex-project-id>
```

After the supervising agent creates the child thread, record the returned thread id:

```bash
python3 tools/planning/run_epic_threads.py \
  --config the-water-cooler/docs/prototype-scope/github-issue-import.config.json \
  --epic 8 \
  --record-thread <thread-id> \
  --record-feature F8.4
```

After a feature thread reports completion, verify that step before selecting the next feature:

```bash
python3 tools/planning/verify_epic_step.py \
  --config the-water-cooler/docs/prototype-scope/github-issue-import.config.json \
  --epic 8 \
  --feature F8.3
```

By default, dirty local implementation worktrees are reported but do not fail verification. Add `--require-clean-worktree` when automation should stop unless the implementation repo is clean.

After verification passes, clear the active child state. This command also re-checks that GitHub now marks the active feature and its stories done:

```bash
python3 tools/planning/run_epic_threads.py \
  --config the-water-cooler/docs/prototype-scope/github-issue-import.config.json \
  --epic 8 \
  --complete-active
```

To render a checkpoint while clearing state:

```bash
python3 tools/planning/run_epic_threads.py \
  --config the-water-cooler/docs/prototype-scope/github-issue-import.config.json \
  --epic 8 \
  --complete-active \
  --render-checkpoint \
  --story 243 \
  --commit <hash> \
  --verification "compile check passed"
```

Use `--post-checkpoint` instead of `--render-checkpoint` only when the checkpoint should be written to GitHub.

Render an epic checkpoint comment body:

```bash
python3 tools/planning/epic_checkpoint.py \
  --config the-water-cooler/docs/prototype-scope/github-issue-import.config.json \
  --epic 8 \
  --completed-feature F8.3 \
  --story 238 \
  --commit <hash> \
  --verification "compile check passed"
```

Post or update the latest `Full epic checkpoint` comment only when ready:

```bash
python3 tools/planning/epic_checkpoint.py \
  --config the-water-cooler/docs/prototype-scope/github-issue-import.config.json \
  --epic 8 \
  --completed-feature F8.3 \
  --story 238 \
  --commit <hash> \
  --verification "compile check passed" \
  --post
```

## Supervisor Loop

The queued epic process has two cooperating pieces:

- The local runner is the deterministic state machine. It knows the epic plan, GitHub/project state, active child thread id, and whether a next feature is dependency-valid.
- The supervising Codex thread owns app-thread lifecycle. It calls `create_thread`, records the returned id, polls child status with `read_thread`, and reruns the local runner after verification.

The thread-run state file is the queue mutex. If it has an `active` child thread, the supervisor must not launch another feature.

`run_epic_threads.py --format json` emits a `supervisor_action` object for the parent agent:

- `launch_next_thread`: create exactly one child feature thread from the launch packet, then record the returned thread id.
- `poll_active_thread`: read the recorded child thread and decide whether to wait, resume/fix that child, or verify and clear it.
- `stop_no_launchable_feature`: stop and report the blocker instead of selecting a later feature.
- `epic_complete`: stop because every planned feature is done.

Queued loop:

1. Run `run_epic_threads.py --format json`.
2. If `supervisor_action.action` is `launch_next_thread`, create the child Codex thread, record the thread id with `--record-thread`, and keep the supervisor alive through a heartbeat or equivalent poll.
3. If `supervisor_action.action` is `poll_active_thread`, call `read_thread` for the recorded child thread id.
4. If the child thread is still running, leave the state file unchanged and wait for the next heartbeat or poll.
5. If the child thread reports a blocker or partial completion, leave the active state recorded, resolve or resume that same child feature, and do not start a later feature.
6. If the child thread reports feature completion, extract the story issues, commit hashes, verification, manual-check caveats, and blockers from its final answer.
7. Run `verify_epic_step.py` for the active feature. Continue only if GitHub/project state confirms the feature and all in-scope stories are done.
8. Render or post an epic checkpoint, then clear active state with `run_epic_threads.py --complete-active`.
9. Re-run `run_epic_threads.py --format json` and repeat from step 2.
10. Stop when the action is `epic_complete` or a stop condition prevents a safe next launch.

The child thread's final answer is not itself the completion signal. Completion is recognized only when the child thread is idle, the final answer reports successful feature closeout, and `verify_epic_step.py` confirms the GitHub/project mirror.

For unattended queueing in the Codex app, attach a heartbeat automation to the supervising thread. The heartbeat prompt should tell the supervisor to run the queued loop above, inspect the active child thread, and either wait, verify/clear, or launch the next feature. The heartbeat should stay active until the runner returns `epic_complete` or a stop condition.

## Stop Conditions

Stop instead of launching another feature thread when:

- the next feature cannot be selected confidently
- a feature is already `In Progress`
- a planned issue is missing from GitHub
- dependencies are missing, not done, blocked, deferred, or ambiguous
- the source docs and GitHub mirror disagree materially
- verification failed in the previous feature thread
- the implementation worktree has unrelated changes that may overlap the next feature
- GitHub issue or project access is insufficient to verify current state
- a thread-run state file already has an active child thread

## Current Tool Boundary

`plan_github_epic_work.py` and `verify_epic_step.py` are read-only. `run_epic_threads.py` writes only its local state file unless `--post-checkpoint` is used. `epic_checkpoint.py` is dry-run by default and writes to GitHub only with `--post`.

These tools still do not call Codex app thread tools directly, move project items, or close epic issues. The supervising agent creates and polls child Codex threads using app tools. The scripts expose enough machine-readable state for that supervisor to keep a large epic queued without loading every feature into one thread.
