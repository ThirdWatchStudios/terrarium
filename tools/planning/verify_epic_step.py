#!/usr/bin/env python3
"""Verify a completed feature step before continuing an epic workflow."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

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
class CheckResult:
    name: str
    ok: bool
    detail: str


def run_git(repo: Path, args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=repo,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        check=False,
    )


def find_feature(work_plan: dict[str, object], feature_ref: str) -> dict[str, object]:
    ref = feature_ref.strip().lstrip("#")
    for feature in work_plan["features"]:
        if str(feature["code"]).lower() == ref.lower():
            return feature
        if feature["issue_number"] is not None and str(feature["issue_number"]) == ref:
            return feature
    raise ValueError(f"Feature {feature_ref!r} is not part of {work_plan['epic']['code']}")


def verify_commits(repo: Path, commits: list[str]) -> list[CheckResult]:
    results: list[CheckResult] = []
    for commit in commits:
        completed = run_git(repo, ["cat-file", "-e", f"{commit}^{{commit}}"])
        results.append(
            CheckResult(
                name=f"commit {commit}",
                ok=completed.returncode == 0,
                detail="exists in implementation repo"
                if completed.returncode == 0
                else (completed.stderr.strip() or "commit not found"),
            )
        )
    return results


def worktree_check(repo: Path, require_clean: bool) -> CheckResult:
    completed = run_git(repo, ["status", "--short"])
    if completed.returncode != 0:
        return CheckResult("implementation worktree", False, completed.stderr.strip())
    status = completed.stdout.strip()
    if not status:
        return CheckResult("implementation worktree", True, "clean")
    return CheckResult(
        "implementation worktree",
        not require_clean,
        "dirty:\n" + status,
    )


def render_next_feature(work_plan: dict[str, object]) -> str:
    next_feature = work_plan.get("next_feature")
    if not next_feature:
        return "No dependency-valid next feature selected."
    issue = f"#{next_feature['issue_number']}" if next_feature["issue_number"] else "missing"
    return f"{next_feature['code']} {issue} - {next_feature['title']}"


def build_results(
    args: argparse.Namespace,
    work_plan: dict[str, object],
    feature: dict[str, object],
) -> list[CheckResult]:
    summary = work_plan["summary"]
    results = [
        CheckResult(
            "planned issue inventory",
            summary["missing"] == 0,
            f"{summary['existing']} existing, {summary['missing']} missing",
        ),
        CheckResult(
            "project status reads",
            not work_plan["project_status_errors"],
            "; ".join(work_plan["project_status_errors"]) or "ok",
        ),
        CheckResult(
            "feature status",
            feature["decision"] == "done",
            f"{feature['code']} #{feature['issue_number']} is {feature['decision']}: {feature['reason']}",
        ),
        CheckResult(
            "feature stories",
            feature["story_done"] == feature["story_total"],
            f"{feature['story_done']}/{feature['story_total']} done",
        ),
        worktree_check(args.implementation_repo, args.require_clean_worktree),
    ]
    results.extend(verify_commits(args.implementation_repo, args.commit))
    return results


def render_markdown(
    work_plan: dict[str, object],
    feature: dict[str, object],
    results: list[CheckResult],
) -> str:
    epic = work_plan["epic"]
    lines = [
        "# Epic Step Verification",
        "",
        f"- Epic: `{epic['code']}` {epic['title']}",
        f"- Verified feature: `{feature['code']}` #{feature['issue_number']} - {feature['title']}",
        f"- Next recommended feature: {render_next_feature(work_plan)}",
        "",
        "## Checks",
        "",
        "| Check | Result | Detail |",
        "|---|---|---|",
    ]
    for result in results:
        outcome = "pass" if result.ok else "fail"
        detail = result.detail.replace("\n", "<br>")
        lines.append(f"| {result.name} | {outcome} | {detail} |")
    return "\n".join(lines) + "\n"


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
        description="Verify a completed feature before continuing an epic workflow.",
    )
    parser.add_argument("--epic", required=True, help="Epic code or number, for example E8 or 8.")
    parser.add_argument(
        "--feature",
        required=True,
        help="Feature code or issue number to verify, such as F8.3 or 237.",
    )
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
        "--implementation-repo",
        type=Path,
        default=Path("../The-Water-Cooler"),
        help="Local implementation repo used for git status and commit checks.",
    )
    parser.add_argument("--commit", action="append", default=[])
    parser.add_argument(
        "--require-clean-worktree",
        action="store_true",
        help="Fail verification when the implementation repo has any local changes.",
    )
    parser.add_argument("--format", choices=("markdown", "json"), default="markdown")
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()
    args.epic = normalize_epic(args.epic)
    args.roadmap_source = roadmap_source_for(args.source_prefix, args.roadmap_source)
    args.implementation_repo = args.implementation_repo.resolve()
    args.no_github = False
    args.no_project_status = False
    args.allow_project_status_unknown = False
    return args


def main() -> int:
    args = parse_args()
    try:
        csv_path, issue_plan = load_issue_plan(args)
        work_plan = build_work_plan(args, csv_path, issue_plan)
        feature = find_feature(work_plan, args.feature)
        results = build_results(args, work_plan, feature)
    except subprocess.CalledProcessError as error:
        print((error.stderr or str(error)).strip(), file=sys.stderr)
        return 1
    except Exception as error:
        print(f"error: {error}", file=sys.stderr)
        return 1

    ok = all(result.ok for result in results)
    if args.format == "json":
        print(
            json.dumps(
                {
                    "ok": ok,
                    "epic": work_plan["epic"],
                    "feature": feature,
                    "next_feature": work_plan.get("next_feature"),
                    "checks": [result.__dict__ for result in results],
                },
                indent=2,
            )
        )
    else:
        print(render_markdown(work_plan, feature, results))
    return 0 if ok else 2


if __name__ == "__main__":
    raise SystemExit(main())
