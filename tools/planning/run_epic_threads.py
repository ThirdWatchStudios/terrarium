#!/usr/bin/env python3
"""Conductor for sequential epic feature threads.

This script does not call Codex app tools directly. It emits one launch packet
for the supervising agent to create a child Codex thread, records the returned
thread id, and refuses to launch another feature while one is active.
"""

from __future__ import annotations

import argparse
import json
import shlex
import subprocess
import sys
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace

from epic_checkpoint import normalize_issue_number, render_checkpoint_body, upsert_checkpoint_comment
from plan_github_issue_import import (
    config_int_value,
    config_path_value,
    config_str_value,
    default_source_prefix_for,
    load_config,
    roadmap_source_for,
)
from plan_github_epic_work import (
    DEFAULT_PROJECT_TITLE,
    build_work_plan,
    load_issue_plan,
    normalize_epic,
    resolve_config_relative_path,
)


@dataclass
class LaunchPacket:
    action: str
    epic_code: str
    epic_title: str
    feature_code: str
    feature_issue: int
    feature_title: str
    thread_title: str
    prompt: str
    create_thread: dict[str, object] | None
    record_command: str


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def shell_command(parts: list[object]) -> str:
    return " ".join(shlex.quote(str(part)) for part in parts)


def default_state_path(state_dir: Path, epic_code: str) -> Path:
    return state_dir / f"{epic_code.lower()}-thread-run.json"


def load_state(path: Path) -> dict[str, object]:
    if not path.exists():
        return {"schemaVersion": 1, "active": None, "history": []}
    return json.loads(path.read_text(encoding="utf-8"))


def write_state(path: Path, state: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def render_thread_title(epic: dict[str, object], feature: dict[str, object]) -> str:
    return (
        f"{epic['code']} {feature['code']} "
        f"#{feature['issue_number']} - {feature['title']}"
    )


def render_prompt(epic: dict[str, object], feature: dict[str, object]) -> str:
    return (
        f"implement full feature {feature['issue_number']}\n\n"
        "Epic supervisor context:\n"
        f"- Epic: {epic['code']} - {epic['title']}\n"
        f"- Selected feature: {feature['code']} - {feature['title']}\n"
        "- Use the existing full feature workflow.\n"
        "- Re-fetch the feature issue and referenced source docs before editing.\n"
        "- Stop if the feature issue, child stories, and source docs disagree materially.\n"
        "- Return story issue numbers, commit hashes, verification, blockers, and the next recommended feature.\n"
        "- Do not start another feature from this epic; the epic supervisor will verify and route the next one."
    )


def create_thread_payload(args: argparse.Namespace, prompt: str) -> dict[str, object] | None:
    if not args.project_id:
        return None

    if args.target_environment == "worktree":
        environment: dict[str, object] = {"type": "worktree", "startingState": {"type": "working-tree"}}
    else:
        environment = {"type": "local"}

    payload: dict[str, object] = {
        "prompt": prompt,
        "target": {
            "type": "project",
            "projectId": args.project_id,
            "environment": environment,
        },
    }
    if args.model:
        payload["model"] = args.model
    if args.thinking:
        payload["thinking"] = args.thinking
    return payload


def runner_command(args: argparse.Namespace, extra: list[object] | None = None) -> str:
    parts: list[object] = ["python3", "tools/planning/run_epic_threads.py"]
    if args.config:
        parts.extend(["--config", args.config])
    parts.extend(["--epic", args.epic, "--state", args.state_path])
    if extra:
        parts.extend(extra)
    return shell_command(parts)


def verifier_command(args: argparse.Namespace, feature: dict[str, object]) -> str:
    parts: list[object] = ["python3", "tools/planning/verify_epic_step.py"]
    if args.config:
        parts.extend(["--config", args.config])
    parts.extend(["--epic", args.epic, "--feature", feature["code"]])
    return shell_command(parts)


def record_command(args: argparse.Namespace, feature: dict[str, object]) -> str:
    return runner_command(
        args,
        [
            "--record-thread",
            "<thread-id>",
            "--record-feature",
            feature["code"],
        ],
    )


def build_launch_packet(args: argparse.Namespace, work_plan: dict[str, object]) -> LaunchPacket | None:
    next_feature = work_plan.get("next_feature")
    if not next_feature:
        return None
    if next_feature.get("issue_number") is None:
        return None

    epic = work_plan["epic"]
    prompt = render_prompt(epic, next_feature)
    title = render_thread_title(epic, next_feature)
    return LaunchPacket(
        action="create_thread",
        epic_code=str(epic["code"]),
        epic_title=str(epic["title"]),
        feature_code=str(next_feature["code"]),
        feature_issue=int(next_feature["issue_number"]),
        feature_title=str(next_feature["title"]),
        thread_title=title,
        prompt=prompt,
        create_thread=create_thread_payload(args, prompt),
        record_command=record_command(args, next_feature),
    )


def build_supervisor_action(
    args: argparse.Namespace,
    work_plan: dict[str, object],
    state: dict[str, object],
    launch_packet: LaunchPacket | None,
) -> dict[str, object]:
    active = state.get("active")
    if active:
        feature = feature_by_ref(work_plan, str(active["feature_code"]))
        return {
            "action": "poll_active_thread",
            "reason": "An active child feature thread is recorded. Do not launch another feature until this one is idle, verified, and cleared.",
            "thread_id": active.get("thread_id"),
            "thread_title": active.get("thread_title"),
            "feature_code": active.get("feature_code"),
            "feature_issue": active.get("feature_issue"),
            "feature_title": active.get("feature_title"),
            "child_thread_status_source": "codex_app.read_thread",
            "if_child_is_running": "Wait for the next heartbeat or poll cycle; keep the active state unchanged.",
            "if_child_reports_blocked": "Leave the active state recorded, resolve or resume that child feature, and do not select a later feature.",
            "if_child_reports_complete": [
                "Parse the child final answer for completed story issues, commits, verification, blockers, and caveats.",
                "Run the verification command below; continue only if it passes.",
                "Run the complete-active command below to clear the active state.",
                "Run the runner command below to select the next dependency-valid feature.",
            ],
            "verification_command": verifier_command(args, feature),
            "complete_active_command": runner_command(args, ["--complete-active"]),
            "next_runner_command": runner_command(args),
        }

    if launch_packet:
        return {
            "action": "launch_next_thread",
            "reason": "No active child thread is recorded and the planner selected a dependency-valid next feature.",
            "feature_code": launch_packet.feature_code,
            "feature_issue": launch_packet.feature_issue,
            "feature_title": launch_packet.feature_title,
            "thread_title": launch_packet.thread_title,
            "prompt": launch_packet.prompt,
            "create_thread": launch_packet.create_thread,
            "record_command": launch_packet.record_command,
            "after_launch": "Record the returned thread id, then use heartbeat or polling to watch the active child thread.",
        }

    summary = work_plan["summary"]
    if summary["features_done"] == summary["features_total"]:
        action = "epic_complete"
        reason = "All planned features for this epic are done."
    else:
        action = "stop_no_launchable_feature"
        reason = "No dependency-valid next feature was selected; inspect blocked or ambiguous features before continuing."
    return {
        "action": action,
        "reason": reason,
        "features_done": summary["features_done"],
        "features_total": summary["features_total"],
    }


def feature_by_ref(work_plan: dict[str, object], feature_ref: str) -> dict[str, object]:
    ref = feature_ref.strip().lstrip("#")
    for feature in work_plan["features"]:
        if str(feature["code"]).lower() == ref.lower():
            return feature
        if feature["issue_number"] is not None and str(feature["issue_number"]) == ref:
            return feature
    raise ValueError(f"Feature {feature_ref!r} is not part of {work_plan['epic']['code']}")


def render_markdown(
    args: argparse.Namespace,
    work_plan: dict[str, object],
    state: dict[str, object],
    launch_packet: LaunchPacket | None,
    supervisor_action: dict[str, object],
) -> str:
    epic = work_plan["epic"]
    summary = work_plan["summary"]
    lines = [
        "# Epic Thread Runner",
        "",
        f"- Epic: `{epic['code']}` {epic['title']}",
        f"- State file: `{args.state_path}`",
        f"- Feature progress: `{summary['features_done']}/{summary['features_total']}`",
        "",
    ]

    active = state.get("active")
    if active:
        lines.extend(
            [
                "## Active Thread",
                "",
                f"- Feature: `{active['feature_code']}` #{active['feature_issue']} - {active['feature_title']}",
                f"- Thread id: `{active.get('thread_id', 'not recorded')}`",
                f"- Launched: `{active.get('launched_at', 'unknown')}`",
                "",
                "## Supervisor Action",
                "",
                "- Action: `poll_active_thread`",
                "- Use `codex_app.read_thread` on the active thread id.",
                "- If the child is still running, keep this state and wait for the next heartbeat or poll.",
                "- If the child reports a blocker, keep this state and resume or fix that feature; do not launch a later feature.",
                "- If the child reports completion, verify GitHub/project state before clearing this active feature.",
                "",
                "Verification command:",
                "",
                "```bash",
                str(supervisor_action["verification_command"]),
                "```",
                "",
                "After verification passes:",
                "",
                "```bash",
                str(supervisor_action["complete_active_command"]),
                "```",
                "",
                "Then select the next feature:",
                "",
                "```bash",
                str(supervisor_action["next_runner_command"]),
                "```",
            ]
        )
        return "\n".join(lines) + "\n"

    if not launch_packet:
        lines.append("No dependency-valid next feature was selected.")
        return "\n".join(lines) + "\n"

    lines.extend(
        [
            "## Launch Packet",
            "",
            "- Supervisor action: `launch_next_thread`",
            f"- Thread title: `{launch_packet.thread_title}`",
            f"- Feature: `{launch_packet.feature_code}` #{launch_packet.feature_issue} - {launch_packet.feature_title}",
            "",
            "Prompt:",
            "",
            "```text",
            launch_packet.prompt,
            "```",
            "",
            "After creating the child thread, record the returned thread id:",
            "",
            "```bash",
            launch_packet.record_command,
            "```",
        ]
    )
    if launch_packet.create_thread:
        lines.extend(["", "Codex app `create_thread` payload:", "", "```json"])
        lines.append(json.dumps(launch_packet.create_thread, indent=2))
        lines.append("```")
    else:
        lines.extend(
            [
                "",
                "No `create_thread` payload was emitted because `--project-id` was not provided.",
            ]
        )
    return "\n".join(lines) + "\n"


def record_thread(args: argparse.Namespace, work_plan: dict[str, object], state: dict[str, object]) -> None:
    if state.get("active"):
        raise ValueError("state already has an active thread; complete or clear it before recording another")

    feature = feature_by_ref(work_plan, args.record_feature) if args.record_feature else work_plan.get("next_feature")
    if not feature:
        raise ValueError("no feature available to record")
    if feature.get("decision") not in {"next", "ready"}:
        raise ValueError(f"feature {feature['code']} is not ready to launch: {feature['decision']}")

    epic = work_plan["epic"]
    prompt = render_prompt(epic, feature)
    state["active"] = {
        "feature_code": feature["code"],
        "feature_issue": feature["issue_number"],
        "feature_title": feature["title"],
        "thread_id": args.record_thread,
        "thread_title": render_thread_title(epic, feature),
        "prompt": prompt,
        "launched_at": utc_now(),
        "status": "launched",
    }
    write_state(args.state_path, state)


def complete_active(args: argparse.Namespace, work_plan: dict[str, object], state: dict[str, object]) -> str:
    active = state.get("active")
    if not active:
        raise ValueError("state has no active thread to complete")

    feature = feature_by_ref(work_plan, str(active["feature_code"]))
    if feature["decision"] != "done" or feature["story_done"] != feature["story_total"]:
        raise ValueError(
            f"{feature['code']} is not complete yet: "
            f"{feature['decision']}, stories {feature['story_done']}/{feature['story_total']}"
        )

    checkpoint_url: str | None = None
    checkpoint_body: str | None = None
    if args.render_checkpoint or args.post_checkpoint:
        checkpoint_args = SimpleNamespace(
            completed_feature=feature["code"],
            story=args.story,
            commit=args.commit,
            verification=args.verification,
            verification_not_performed=args.verification_not_performed,
            not_attempted=args.not_attempted,
            manual_check=args.manual_check,
            note=args.note,
        )
        checkpoint_body = render_checkpoint_body(checkpoint_args, work_plan)
        if args.post_checkpoint:
            epic_number = work_plan["epic_status"].get("number")
            if not epic_number:
                raise ValueError("cannot post checkpoint because the epic issue is missing")
            checkpoint_url = upsert_checkpoint_comment(args.repo, int(epic_number), checkpoint_body)

    active["completed_at"] = utc_now()
    active["completion_status"] = "verified"
    if checkpoint_url:
        active["checkpoint_url"] = checkpoint_url
    history = state.setdefault("history", [])
    if not isinstance(history, list):
        raise ValueError("state history is not a list")
    history.append(active)
    state["active"] = None
    write_state(args.state_path, state)
    return checkpoint_url or checkpoint_body or "active feature completed and state cleared"


def parse_args() -> argparse.Namespace:
    config_parser = argparse.ArgumentParser(add_help=False)
    config_parser.add_argument(
        "--config",
        type=Path,
        help="Optional JSON target config with repo, project, source, and label defaults.",
    )
    config_args, _ = config_parser.parse_known_args()
    config = load_config(config_args.config)

    configured_source_dir = config_path_value(config, "source_dir")
    default_source_dir = resolve_config_relative_path(config_args.config, configured_source_dir)
    if default_source_dir is None:
        from plan_github_issue_import import DEFAULT_SOURCE_DIR

        default_source_dir = DEFAULT_SOURCE_DIR
    default_source_prefix = config_str_value(
        config,
        "source_prefix",
        default_source_prefix_for(default_source_dir),
    )

    parser = argparse.ArgumentParser(
        parents=[config_parser],
        description="Emit and track sequential Codex child-thread launch packets for an epic.",
    )
    parser.add_argument("--epic", required=True, help="Epic code or number, for example E8 or 8.")
    parser.add_argument(
        "--csv",
        default=resolve_config_relative_path(config_args.config, config_path_value(config, "csv")),
        type=Path,
        help="Epic GitHub issue import CSV. If omitted, --epic is used to find it.",
    )
    parser.add_argument("--source-dir", default=default_source_dir, type=Path)
    parser.add_argument("--source-prefix", default=default_source_prefix)
    parser.add_argument("--roadmap-source", default=config.get("roadmap_source"))
    parser.add_argument("--repo", default=config_str_value(config, "repo", "ThirdWatchStudios/Voidwake"))
    parser.add_argument("--project-title", default=DEFAULT_PROJECT_TITLE)
    parser.add_argument("--scope-label", default=config_str_value(config, "scope_label", "prototype"))
    parser.add_argument(
        "--project-owner",
        default=config_str_value(config, "project_owner", "ThirdWatchStudios"),
        help="Accepted for config parity with the import tool; not used directly.",
    )
    parser.add_argument(
        "--project-number",
        default=config_int_value(config, "project_number", 4),
        type=int,
        help="Accepted for config parity with the import tool; not used directly.",
    )
    parser.add_argument("--state", dest="state_path", type=Path)
    parser.add_argument("--state-dir", type=Path, default=Path(".epic-runs"))
    parser.add_argument("--project-id", help="Optional Codex saved project id for create_thread payloads.")
    parser.add_argument("--target-environment", choices=("local", "worktree"), default="local")
    parser.add_argument("--model")
    parser.add_argument("--thinking", choices=("low", "medium", "high", "xhigh", "max"))
    parser.add_argument("--record-thread", help="Record the child Codex thread id after launch.")
    parser.add_argument("--record-feature", help="Feature code or issue number associated with --record-thread.")
    parser.add_argument("--complete-active", action="store_true")
    parser.add_argument("--render-checkpoint", action="store_true")
    parser.add_argument("--post-checkpoint", action="store_true")
    parser.add_argument("--story", action="append", type=normalize_issue_number, default=[])
    parser.add_argument("--commit", action="append", default=[])
    parser.add_argument("--verification", action="append", default=[])
    parser.add_argument("--verification-not-performed", action="append", default=[])
    parser.add_argument("--not-attempted", action="append", default=[])
    parser.add_argument("--manual-check", action="append", default=[])
    parser.add_argument("--note", action="append", default=[])
    parser.add_argument("--format", choices=("markdown", "json", "prompt"), default="markdown")
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    args.epic = normalize_epic(args.epic)
    args.roadmap_source = roadmap_source_for(args.source_prefix, args.roadmap_source)
    if args.state_path is None:
        args.state_path = default_state_path(args.state_dir, args.epic)
    args.no_github = False
    args.no_project_status = False
    args.allow_project_status_unknown = False
    return args


def main() -> int:
    args = parse_args()
    try:
        csv_path, issue_plan = load_issue_plan(args)
        work_plan = build_work_plan(args, csv_path, issue_plan)
        state = load_state(args.state_path)

        if args.record_thread:
            record_thread(args, work_plan, state)
            print(f"Recorded active thread {args.record_thread} in {args.state_path}")
            return 0

        if args.complete_active:
            result = complete_active(args, work_plan, state)
            print(result)
            return 0

        launch_packet = None if state.get("active") else build_launch_packet(args, work_plan)
        supervisor_action = build_supervisor_action(args, work_plan, state, launch_packet)
        if args.format == "json":
            print(
                json.dumps(
                    {
                        "state_path": str(args.state_path),
                        "state": state,
                        "supervisor_action": supervisor_action,
                        "launch_packet": asdict(launch_packet) if launch_packet else None,
                        "work_plan_summary": work_plan["summary"],
                    },
                    indent=2,
                )
            )
        elif args.format == "prompt":
            if not launch_packet:
                print("No launchable feature thread is available.", file=sys.stderr)
                return 2
            print(launch_packet.prompt)
        else:
            print(render_markdown(args, work_plan, state, launch_packet, supervisor_action))
        return 0
    except subprocess.CalledProcessError as error:
        print((error.stderr or str(error)).strip(), file=sys.stderr)
        return 1
    except Exception as error:
        print(f"error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
