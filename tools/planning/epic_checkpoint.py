#!/usr/bin/env python3
"""Render or post an epic-level checkpoint comment.

The default behavior is dry-run rendering. Passing --post writes to GitHub by
creating or updating the latest "Full epic checkpoint" comment on the epic
issue.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

from plan_github_issue_import import (
    config_int_value,
    config_path_value,
    config_str_value,
    default_source_prefix_for,
    load_config,
    roadmap_source_for,
    run_gh,
    run_gh_json,
)
from plan_github_epic_work import (
    DEFAULT_PROJECT_TITLE,
    build_work_plan,
    load_issue_plan,
    normalize_epic,
    resolve_config_relative_path,
)


CHECKPOINT_HEADER = "Full epic checkpoint"


def normalize_issue_number(value: str) -> int:
    cleaned = value.strip().lstrip("#")
    if not cleaned.isdigit():
        raise argparse.ArgumentTypeError(f"Expected issue number, got {value!r}")
    return int(cleaned)


def bullet_list(values: list[str], empty: str = "None reported.") -> list[str]:
    if not values:
        return [f"- {empty}"]
    return [f"- {value}" for value in values]


def find_feature(work_plan: dict[str, object], feature_ref: str | None) -> dict[str, object] | None:
    if feature_ref is None:
        return None
    ref = feature_ref.strip().lstrip("#")
    for feature in work_plan["features"]:
        if str(feature["code"]).lower() == ref.lower():
            return feature
        if feature["issue_number"] is not None and str(feature["issue_number"]) == ref:
            return feature
    raise ValueError(f"Feature {feature_ref!r} is not part of {work_plan['epic']['code']}")


def current_done_features(work_plan: dict[str, object]) -> list[str]:
    done: list[str] = []
    for feature in work_plan["features"]:
        if feature["decision"] == "done":
            issue = f"#{feature['issue_number']}" if feature["issue_number"] else "missing"
            done.append(f"{feature['code']} {issue} - {feature['title']}")
    return done


def blocked_or_skipped_features(work_plan: dict[str, object]) -> list[str]:
    values: list[str] = []
    for feature in work_plan["features"]:
        if feature["decision"] in {"blocked", "skip", "stop", "unknown"}:
            issue = f"#{feature['issue_number']}" if feature["issue_number"] else "missing"
            values.append(f"{feature['code']} {issue} - {feature['decision']}: {feature['reason']}")
    return values


def render_next_feature(work_plan: dict[str, object]) -> str:
    next_feature = work_plan.get("next_feature")
    if not next_feature:
        return "No dependency-valid next feature selected."
    issue = f"#{next_feature['issue_number']}" if next_feature["issue_number"] else "missing"
    return f"{next_feature['code']} {issue} - {next_feature['title']}"


def render_checkpoint_body(args: argparse.Namespace, work_plan: dict[str, object]) -> str:
    epic = work_plan["epic"]
    epic_status = work_plan["epic_status"]
    completed_feature = find_feature(work_plan, args.completed_feature)
    summary = work_plan["summary"]

    lines = [
        CHECKPOINT_HEADER,
        "",
        f"Epic: {epic['code']} - {epic['title']}",
        f"Epic issue: #{epic_status['number']}" if epic_status.get("number") else "Epic issue: missing",
        f"Feature progress: {summary['features_done']}/{summary['features_total']} done",
        "",
        "Completed in this checkpoint:",
    ]
    if completed_feature:
        issue = (
            f"#{completed_feature['issue_number']}"
            if completed_feature["issue_number"]
            else "missing"
        )
        lines.append(f"- {completed_feature['code']} {issue} - {completed_feature['title']}")
    else:
        lines.append("- None specified.")

    lines.extend(["", "Story issues completed:"])
    lines.extend(bullet_list([f"#{number}" for number in args.story]))
    lines.extend(["", "Story commit hashes:"])
    lines.extend(bullet_list(args.commit))
    lines.extend(["", "Verification performed:"])
    lines.extend(bullet_list(args.verification))
    lines.extend(["", "Verification not performed:"])
    lines.extend(bullet_list(args.verification_not_performed))
    lines.extend(["", "Current Done / closed feature set:"])
    lines.extend(bullet_list(current_done_features(work_plan)))
    lines.extend(["", "Next recommended feature:"])
    lines.append(f"- {render_next_feature(work_plan)}")
    lines.extend(["", "Blocked, deferred, ambiguous, or skipped features:"])
    lines.extend(bullet_list(blocked_or_skipped_features(work_plan)))
    lines.extend(["", "Stories not attempted and why:"])
    lines.extend(bullet_list(args.not_attempted))
    lines.extend(["", "Manual Unity checks:"])
    lines.extend(bullet_list(args.manual_check))

    if args.note:
        lines.extend(["", "Additional notes:"])
        lines.extend(bullet_list(args.note))

    return "\n".join(lines).rstrip() + "\n"


def fetch_checkpoint_comments(repo: str, issue_number: int) -> list[dict[str, object]]:
    checkpoint_comments: list[dict[str, object]] = []
    page = 1
    while True:
        raw = run_gh(
            [
                "api",
                f"repos/{repo}/issues/{issue_number}/comments?per_page=100&page={page}",
            ]
        )
        comments = json.loads(raw)
        if not comments:
            return checkpoint_comments
        checkpoint_comments.extend(
            comment
            for comment in comments
            if str(comment.get("body") or "").startswith(CHECKPOINT_HEADER)
        )
        page += 1


def upsert_checkpoint_comment(repo: str, issue_number: int, body: str) -> str:
    comments = fetch_checkpoint_comments(repo, issue_number)
    if comments:
        latest = comments[-1]
        comment_id = int(latest["id"])
        run_gh_json(
            [
                "api",
                "--method",
                "PATCH",
                f"repos/{repo}/issues/comments/{comment_id}",
                "--input",
                "-",
            ],
            {"body": body},
        )
        return str(latest.get("html_url") or f"updated comment {comment_id}")

    raw = run_gh_json(
        [
            "api",
            "--method",
            "POST",
            f"repos/{repo}/issues/{issue_number}/comments",
            "--input",
            "-",
        ],
        {"body": body},
    )
    return str(json.loads(raw).get("html_url") or f"created comment on #{issue_number}")


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
        description="Render or post a GitHub epic checkpoint comment.",
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
    parser.add_argument(
        "--completed-feature",
        help="Completed feature code or issue number for this checkpoint, such as F8.4 or 242.",
    )
    parser.add_argument("--story", action="append", type=normalize_issue_number, default=[])
    parser.add_argument("--commit", action="append", default=[])
    parser.add_argument("--verification", action="append", default=[])
    parser.add_argument("--verification-not-performed", action="append", default=[])
    parser.add_argument("--not-attempted", action="append", default=[])
    parser.add_argument("--manual-check", action="append", default=[])
    parser.add_argument("--note", action="append", default=[])
    parser.add_argument(
        "--post",
        action="store_true",
        help="Write to GitHub by creating or updating the latest epic checkpoint comment.",
    )
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()
    args.epic = normalize_epic(args.epic)
    args.roadmap_source = roadmap_source_for(args.source_prefix, args.roadmap_source)
    args.no_github = False
    args.no_project_status = False
    args.allow_project_status_unknown = False
    return args


def main() -> int:
    args = parse_args()
    try:
        csv_path, issue_plan = load_issue_plan(args)
        work_plan = build_work_plan(args, csv_path, issue_plan)
        body = render_checkpoint_body(args, work_plan)
        if not args.post:
            print(body)
            return 0

        epic_number = work_plan["epic_status"].get("number")
        if not epic_number:
            print("error: cannot post checkpoint because the epic issue is missing", file=sys.stderr)
            return 1
        url = upsert_checkpoint_comment(args.repo, int(epic_number), body)
        print(url)
        return 0
    except subprocess.CalledProcessError as error:
        print((error.stderr or str(error)).strip(), file=sys.stderr)
        return 1
    except Exception as error:
        print(f"error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
