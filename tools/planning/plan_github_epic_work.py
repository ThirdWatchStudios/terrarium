#!/usr/bin/env python3
"""Plan epic-level implementation work from imported GitHub issue CSVs.

This tool is intentionally read-only. It helps an agent supervisor decide which
feature-level implementation thread should run next while preserving the
existing full-feature workflow as the implementation unit.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable

from plan_github_issue_import import (
    IssuePlan,
    code_sort_key,
    compact_dependency,
    config_int_value,
    config_path_value,
    config_str_value,
    default_source_prefix_for,
    epic_code_for_plan,
    epic_slug,
    expand_dependency_codes,
    fetch_existing_issues,
    load_config,
    normalize_dependency_code,
    read_issue_plan,
    roadmap_source_for,
    run_gh,
)


DEFAULT_PROJECT_TITLE = "The Water Cooler Prototype"
DONE_STATUSES = {"done"}
IN_PROGRESS_STATUSES = {"in progress", "in_progress"}
TODO_STATUSES = {"todo", "to do", "backlog", "ready"}
BLOCKED_LABEL_RE = re.compile(r"\b(blocked|deferred|paused|hold)\b", re.IGNORECASE)


@dataclass
class IssueStatus:
    code: str
    kind: str
    title: str
    issue_title: str
    number: int | None
    state: str | None
    url: str | None
    labels: list[str]
    project_status: str | None
    status: str


@dataclass
class FeatureDecision:
    code: str
    title: str
    issue_number: int | None
    state: str | None
    project_status: str | None
    story_done: int
    story_total: int
    dependencies: list[str]
    missing_dependencies: list[str]
    incomplete_dependencies: list[str]
    decision: str
    reason: str


def resolve_config_relative_path(config_path: Path | None, value: Path | None) -> Path | None:
    if value is None or value.is_absolute() or value.exists() or config_path is None:
        return value

    resolved_config = config_path.resolve()
    for parent in [resolved_config.parent, *resolved_config.parents]:
        candidate = parent / value
        if candidate.exists():
            return candidate
    return value


def normalize_epic(value: str) -> str:
    cleaned = value.strip()
    match = re.fullmatch(r"(?:Epic\s*)?E?(\d+(?:\.\d+)?)", cleaned, flags=re.IGNORECASE)
    if not match:
        raise ValueError(f"Could not parse epic value: {value!r}")
    return f"E{match.group(1)}"


def find_epic_csv(source_dir: Path, epic_code: str) -> Path:
    slug = epic_slug(epic_code)
    candidates = sorted(
        (source_dir / "epics").glob(f"epic-{slug}-*/*-epic-{slug}-github-issue-import.csv")
    )
    if not candidates:
        candidates = sorted(source_dir.glob(f"**/*-epic-{slug}-github-issue-import.csv"))
    if not candidates:
        raise FileNotFoundError(f"No GitHub issue import CSV found for {epic_code} under {source_dir}")
    if len(candidates) > 1:
        rendered = "\n".join(f"- {candidate}" for candidate in candidates)
        raise ValueError(f"Multiple CSV files matched {epic_code}; pass --csv explicitly:\n{rendered}")
    return candidates[0]


def load_issue_plan(args: argparse.Namespace) -> tuple[Path, list[IssuePlan]]:
    csv_path = args.csv or find_epic_csv(args.source_dir, args.epic)
    issue_plan = read_issue_plan(
        csv_path,
        args.source_dir,
        args.source_prefix,
        args.roadmap_source,
        args.scope_label,
    )
    if args.epic and epic_code_for_plan(issue_plan) != args.epic:
        raise ValueError(f"{csv_path} contains {epic_code_for_plan(issue_plan)}, not {args.epic}")
    return csv_path, issue_plan


def project_status_from_item(item: dict[str, object]) -> str | None:
    status = item.get("status")
    if isinstance(status, dict):
        name = status.get("name")
        return str(name) if name else None
    if isinstance(status, str):
        return status
    return None


def fetch_project_status(repo: str, number: int, project_title: str | None) -> str | None:
    raw = run_gh(["issue", "view", str(number), "--repo", repo, "--json", "projectItems"])
    data = json.loads(raw)
    project_items = data.get("projectItems") or []
    if not isinstance(project_items, list):
        return None

    fallback: str | None = None
    for item in project_items:
        if not isinstance(item, dict):
            continue
        status = project_status_from_item(item)
        if fallback is None:
            fallback = status
        if project_title and item.get("title") == project_title:
            return status
    return fallback if project_title is None else None


def repo_owner_and_name(repo: str) -> tuple[str, str]:
    if "/" not in repo:
        raise ValueError(f"Expected GitHub repo in owner/name form, got {repo!r}")
    owner, name = repo.split("/", 1)
    return owner, name


def chunks(values: list[int], size: int) -> Iterable[list[int]]:
    for index in range(0, len(values), size):
        yield values[index : index + size]


def build_project_status_query(issue_numbers: list[int]) -> str:
    issue_blocks = []
    for number in issue_numbers:
        issue_blocks.append(
            f"""
            i{number}: issue(number:{number}) {{
              number
              projectItems(first:20) {{
                nodes {{
                  project {{ title number }}
                  fieldValues(first:20) {{
                    nodes {{
                      ... on ProjectV2ItemFieldSingleSelectValue {{
                        name
                        field {{
                          ... on ProjectV2SingleSelectField {{ name }}
                        }}
                      }}
                    }}
                  }}
                }}
              }}
            }}
            """
        )
    return (
        "query($owner:String!,$name:String!){\n"
        "  repository(owner:$owner,name:$name){\n"
        + "\n".join(issue_blocks)
        + "\n  }\n"
        "}\n"
    )


def status_from_project_item(item: dict[str, object]) -> str | None:
    field_values = item.get("fieldValues")
    if not isinstance(field_values, dict):
        return None
    nodes = field_values.get("nodes")
    if not isinstance(nodes, list):
        return None
    for node in nodes:
        if not isinstance(node, dict):
            continue
        field = node.get("field")
        if isinstance(field, dict) and field.get("name") == "Status":
            name = node.get("name")
            return str(name) if name else None
    return None


def project_status_from_issue_data(
    issue_data: dict[str, object] | None,
    project_title: str | None,
) -> str | None:
    if not issue_data:
        return None
    project_items = issue_data.get("projectItems")
    if not isinstance(project_items, dict):
        return None
    nodes = project_items.get("nodes")
    if not isinstance(nodes, list):
        return None

    fallback: str | None = None
    for item in nodes:
        if not isinstance(item, dict):
            continue
        status = status_from_project_item(item)
        if fallback is None:
            fallback = status
        project = item.get("project")
        title = project.get("title") if isinstance(project, dict) else None
        if project_title and title == project_title:
            return status
    return fallback if project_title is None else None


def fetch_project_statuses_batch(
    repo: str,
    issue_numbers: list[int],
    project_title: str | None,
) -> dict[int, str | None]:
    owner, name = repo_owner_and_name(repo)
    query = build_project_status_query(issue_numbers)
    raw = run_gh(
        [
            "api",
            "graphql",
            "-f",
            f"owner={owner}",
            "-f",
            f"name={name}",
            "-f",
            f"query={query}",
        ]
    )
    repository = json.loads(raw).get("data", {}).get("repository", {})
    return {
        number: project_status_from_issue_data(repository.get(f"i{number}"), project_title)
        for number in issue_numbers
    }


def fetch_project_statuses(
    repo: str,
    issue_numbers: Iterable[int],
    project_title: str | None,
    quiet: bool,
) -> tuple[dict[int, str | None], list[str]]:
    statuses: dict[int, str | None] = {}
    errors: list[str] = []
    numbers = sorted(set(issue_numbers))
    for index, number_chunk in enumerate(chunks(numbers, 50), start=1):
        if not quiet:
            start = number_chunk[0]
            end = number_chunk[-1]
            print(
                f"[epic-work] project status batch {index}: issues #{start}-#{end}",
                file=sys.stderr,
            )
        try:
            statuses.update(fetch_project_statuses_batch(repo, number_chunk, project_title))
        except subprocess.CalledProcessError as error:
            message = (error.stderr or str(error)).strip()
            errors.append(f"batch {index}: {message}")
            for number in number_chunk:
                try:
                    statuses[number] = fetch_project_status(repo, number, project_title)
                except subprocess.CalledProcessError as item_error:
                    item_message = (item_error.stderr or str(item_error)).strip()
                    errors.append(f"#{number}: {item_message}")
                    statuses[number] = None
    return statuses, errors


def dependency_codes_for(dependencies: Iterable[str], known_codes: set[str]) -> list[str]:
    resolved: list[str] = []
    for dependency in dependencies:
        compact = compact_dependency(dependency)
        expanded = expand_dependency_codes(compact, known_codes)
        if expanded:
            resolved.extend(expanded)
            continue
        code = normalize_dependency_code(compact)
        if code:
            resolved.append(code)
    return sorted(set(resolved), key=code_sort_key)


def status_for(
    plan: IssuePlan,
    existing_by_title: dict[str, object],
    existing_by_code: dict[str, object],
    project_status_by_number: dict[int, str | None],
    github_enabled: bool,
) -> IssueStatus:
    existing = existing_by_title.get(plan.issue_title) or existing_by_code.get(plan.code)
    if existing is None:
        status = "missing" if github_enabled else "planned"
        return IssueStatus(
            code=plan.code,
            kind=plan.kind,
            title=plan.title,
            issue_title=plan.issue_title,
            number=None,
            state=None,
            url=None,
            labels=[],
            project_status=None,
            status=status,
        )

    number = int(getattr(existing, "number"))
    state = str(getattr(existing, "state") or "").upper() or None
    labels = list(getattr(existing, "labels") or [])
    project_status = project_status_by_number.get(number)
    status = normalize_runtime_status(state, project_status, labels)
    return IssueStatus(
        code=plan.code,
        kind=plan.kind,
        title=plan.title,
        issue_title=plan.issue_title,
        number=number,
        state=state,
        url=str(getattr(existing, "url") or ""),
        labels=labels,
        project_status=project_status,
        status=status,
    )


def external_status_for(
    code: str,
    existing_by_code: dict[str, object],
    project_status_by_number: dict[int, str | None],
    github_enabled: bool,
) -> IssueStatus:
    existing = existing_by_code.get(code)
    if existing is None:
        status = "missing" if github_enabled else "unverified"
        return IssueStatus(
            code=code,
            kind="dependency",
            title="",
            issue_title=code,
            number=None,
            state=None,
            url=None,
            labels=[],
            project_status=None,
            status=status,
        )
    number = int(getattr(existing, "number"))
    state = str(getattr(existing, "state") or "").upper() or None
    labels = list(getattr(existing, "labels") or [])
    project_status = project_status_by_number.get(number)
    return IssueStatus(
        code=code,
        kind="dependency",
        title=str(getattr(existing, "title") or ""),
        issue_title=str(getattr(existing, "title") or code),
        number=number,
        state=state,
        url=str(getattr(existing, "url") or ""),
        labels=labels,
        project_status=project_status,
        status=normalize_runtime_status(state, project_status, labels),
    )


def normalize_runtime_status(state: str | None, project_status: str | None, labels: list[str]) -> str:
    if any(BLOCKED_LABEL_RE.search(label) for label in labels):
        return "blocked"
    normalized_project = (project_status or "").strip().lower()
    if normalized_project in DONE_STATUSES or state == "CLOSED":
        return "done"
    if normalized_project in IN_PROGRESS_STATUSES:
        return "in_progress"
    if normalized_project in TODO_STATUSES:
        return "todo"
    if state == "OPEN":
        return "open"
    return "unknown"


def is_done(status: IssueStatus) -> bool:
    return status.status == "done"


def is_in_progress(status: IssueStatus) -> bool:
    return status.status == "in_progress"


def is_candidate(status: IssueStatus, allow_project_status_unknown: bool) -> bool:
    if status.status == "todo":
        return True
    return allow_project_status_unknown and status.status == "open"


def build_feature_decisions(
    issue_plan: list[IssuePlan],
    statuses_by_code: dict[str, IssueStatus],
    external_statuses_by_code: dict[str, IssueStatus],
    allow_project_status_unknown: bool,
) -> list[FeatureDecision]:
    plan_codes = {issue.code for issue in issue_plan}
    known_codes = set(statuses_by_code) | set(external_statuses_by_code) | plan_codes
    features = [issue for issue in issue_plan if issue.kind in {"feature", "precursor"}]
    stories_by_feature: dict[str, list[IssuePlan]] = {}
    for issue in issue_plan:
        if issue.kind == "story" and issue.parent_code:
            stories_by_feature.setdefault(issue.parent_code, []).append(issue)

    decisions: list[FeatureDecision] = []
    selected_next = False
    for feature in features:
        status = statuses_by_code[feature.code]
        stories = stories_by_feature.get(feature.code, [])
        story_statuses = [statuses_by_code[story.code] for story in stories]
        dependencies = dependency_codes_for(feature.dependencies, known_codes)
        missing_dependencies: list[str] = []
        incomplete_dependencies: list[str] = []
        for dependency_code in dependencies:
            dependency_status = statuses_by_code.get(dependency_code) or external_statuses_by_code.get(
                dependency_code
            )
            if dependency_status is None or dependency_status.status == "missing":
                missing_dependencies.append(dependency_code)
            elif not is_done(dependency_status):
                incomplete_dependencies.append(
                    render_dependency_status(dependency_code, dependency_status)
                )

        if status.status == "missing":
            decision = "stop"
            reason = "planned feature issue is missing from GitHub"
        elif status.status == "planned":
            decision = "planned"
            reason = "GitHub status disabled; live issue number and project state not checked"
        elif status.status == "blocked":
            decision = "skip"
            reason = "feature carries a blocked/deferred/paused label"
        elif is_done(status):
            decision = "done"
            reason = "feature issue is done or closed"
        elif is_in_progress(status):
            decision = "stop"
            reason = "feature is already In Progress"
        elif missing_dependencies:
            decision = "blocked"
            reason = "missing dependencies: " + ", ".join(missing_dependencies)
        elif incomplete_dependencies:
            decision = "blocked"
            reason = "dependencies not done: " + ", ".join(incomplete_dependencies)
        elif is_candidate(status, allow_project_status_unknown):
            if selected_next:
                decision = "ready"
                reason = "dependency-valid candidate after the selected next feature"
            else:
                decision = "next"
                reason = "earliest dependency-valid feature"
                selected_next = True
        else:
            decision = "unknown"
            reason = "feature is open but project status is unavailable"

        decisions.append(
            FeatureDecision(
                code=feature.code,
                title=feature.title,
                issue_number=status.number,
                state=status.state,
                project_status=status.project_status,
                story_done=sum(1 for story_status in story_statuses if is_done(story_status)),
                story_total=len(story_statuses),
                dependencies=dependencies,
                missing_dependencies=missing_dependencies,
                incomplete_dependencies=incomplete_dependencies,
                decision=decision,
                reason=reason,
            )
        )
    return decisions


def render_dependency_status(code: str, status: IssueStatus) -> str:
    if status.number is not None:
        suffix = status.project_status or status.state or status.status
        return f"{code} #{status.number} ({suffix})"
    return f"{code} ({status.status})"


def issue_counts(issue_plan: list[IssuePlan]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for issue in issue_plan:
        counts[issue.kind] = counts.get(issue.kind, 0) + 1
    return counts


def build_work_plan(
    args: argparse.Namespace,
    csv_path: Path,
    issue_plan: list[IssuePlan],
) -> dict[str, object]:
    existing_by_title: dict[str, object] = {}
    existing_by_code: dict[str, object] = {}
    project_status_by_number: dict[int, str | None] = {}
    project_status_errors: list[str] = []

    plan_codes = {issue.code for issue in issue_plan}
    known_dependency_codes = set(plan_codes)
    for issue in issue_plan:
        known_dependency_codes.update(dependency_codes_for(issue.dependencies, plan_codes))

    if not args.no_github:
        existing_issues = fetch_existing_issues(args.repo)
        existing_by_title = {issue.title: issue for issue in existing_issues}
        existing_by_code = {issue.code: issue for issue in existing_issues if issue.code}

        external_dependency_numbers = [
            int(existing_by_code[code].number)
            for code in sorted(known_dependency_codes - plan_codes, key=code_sort_key)
            if code in existing_by_code
        ]
        planned_numbers = [
            int(existing_by_title[issue.issue_title].number)
            for issue in issue_plan
            if issue.issue_title in existing_by_title
        ]
        if not args.no_project_status:
            project_status_by_number, project_status_errors = fetch_project_statuses(
                args.repo,
                [*planned_numbers, *external_dependency_numbers],
                args.project_title,
                args.quiet,
            )

    statuses_by_code = {
        issue.code: status_for(
            issue,
            existing_by_title,
            existing_by_code,
            project_status_by_number,
            not args.no_github,
        )
        for issue in issue_plan
    }
    external_statuses_by_code = {
        code: external_status_for(code, existing_by_code, project_status_by_number, not args.no_github)
        for code in sorted(known_dependency_codes - plan_codes, key=code_sort_key)
    }
    decisions = build_feature_decisions(
        issue_plan,
        statuses_by_code,
        external_statuses_by_code,
        args.allow_project_status_unknown,
    )
    next_feature = next((decision for decision in decisions if decision.decision == "next"), None)
    epic_issue = next(issue for issue in issue_plan if issue.kind == "epic")
    epic_status = statuses_by_code[epic_issue.code]

    return {
        "repo": args.repo,
        "project_title": None if args.no_project_status else args.project_title,
        "csv": str(csv_path),
        "epic": asdict(epic_issue),
        "epic_status": asdict(epic_status),
        "counts": issue_counts(issue_plan),
        "github_enabled": not args.no_github,
        "project_status_enabled": not args.no_github and not args.no_project_status,
        "project_status_errors": project_status_errors,
        "summary": {
            "planned": len(issue_plan),
            "existing": None
            if args.no_github
            else sum(1 for status in statuses_by_code.values() if status.status != "missing"),
            "missing": None
            if args.no_github
            else sum(1 for status in statuses_by_code.values() if status.status == "missing"),
            "features_done": sum(1 for decision in decisions if decision.decision == "done"),
            "features_total": len(decisions),
        },
        "features": [asdict(decision) for decision in decisions],
        "external_dependencies": [
            asdict(status) for status in external_statuses_by_code.values()
        ],
        "next_feature": asdict(next_feature) if next_feature else None,
        "next_prompt": render_next_prompt(epic_issue, next_feature) if next_feature else None,
    }


def render_next_prompt(epic_issue: IssuePlan, next_feature: FeatureDecision | None) -> str | None:
    if next_feature is None or next_feature.issue_number is None:
        return None
    return (
        f"implement full feature {next_feature.issue_number}\n\n"
        "Epic supervisor context:\n"
        f"- Epic: {epic_issue.code} - {epic_issue.title}\n"
        f"- Selected feature: {next_feature.code} - {next_feature.title}\n"
        "- Use the existing full feature workflow.\n"
        "- Re-fetch the feature issue and referenced source docs before editing.\n"
        "- Stop if the feature issue, child stories, and source docs disagree materially.\n"
        "- Return story issue numbers, commit hashes, verification, blockers, and the next recommended feature."
    )


def render_markdown(work_plan: dict[str, object]) -> str:
    epic = work_plan["epic"]
    epic_status = work_plan["epic_status"]
    summary = work_plan["summary"]
    counts = work_plan["counts"]
    lines = [
        "# GitHub Epic Work Plan",
        "",
        f"- Target repo: `{work_plan['repo']}`",
        f"- Epic: `{epic['code']}` {epic['title']}",
        f"- Epic issue: `{render_issue_ref(epic_status, bool(work_plan['github_enabled']))}`",
        f"- CSV: `{work_plan['csv']}`",
        f"- GitHub status: `{'enabled' if work_plan['github_enabled'] else 'disabled'}`",
        f"- Project status: `{'enabled' if work_plan['project_status_enabled'] else 'disabled'}`",
        f"- Planned issues: `{summary['planned']}`",
        f"- Existing planned issues: `{summary['existing'] if summary['existing'] is not None else 'not checked'}`",
        f"- Missing planned issues: `{summary['missing'] if summary['missing'] is not None else 'not checked'}`",
        f"- Feature progress: `{summary['features_done']}/{summary['features_total']}`",
        "",
        "## Counts",
        "",
        "| Kind | Count |",
        "|---|---:|",
    ]
    for kind in ("epic", "feature", "precursor", "story"):
        if kind in counts:
            lines.append(f"| {kind} | {counts[kind]} |")

    project_errors = work_plan["project_status_errors"]
    if project_errors:
        lines.extend(["", "## Project Status Warnings", ""])
        for error in project_errors:
            lines.append(f"- {error}")

    lines.extend(
        [
            "",
            "## Feature Queue",
            "",
            "| Feature | Issue | State | Project | Stories Done | Dependencies | Decision |",
            "|---|---:|---|---|---:|---|---|",
        ]
    )
    for feature in work_plan["features"]:
        issue = f"#{feature['issue_number']}" if feature["issue_number"] else (
            "missing" if work_plan["github_enabled"] else "not checked"
        )
        state = feature["state"] or ""
        project = feature["project_status"] or ""
        story_count = f"{feature['story_done']}/{feature['story_total']}"
        dependencies = ", ".join(f"`{code}`" for code in feature["dependencies"]) or "none"
        decision = f"{feature['decision']}: {feature['reason']}"
        lines.append(
            f"| `{feature['code']}` {feature['title']} | {issue} | {state} | "
            f"{project} | {story_count} | {dependencies} | {decision} |"
        )

    external_dependencies = work_plan["external_dependencies"]
    if external_dependencies:
        lines.extend(["", "## External Dependencies", ""])
        for dependency in external_dependencies:
            issue = f"#{dependency['number']}" if dependency["number"] else "missing"
            project = dependency["project_status"] or dependency["state"] or dependency["status"]
            lines.append(f"- `{dependency['code']}` {issue} - {project}")

    if work_plan["next_prompt"]:
        lines.extend(["", "## Next Feature Prompt", "", "```text", work_plan["next_prompt"], "```"])
    else:
        lines.extend(["", "## Next Feature Prompt", "", "No dependency-valid next feature was selected."])

    return "\n".join(lines) + "\n"


def render_issue_ref(issue_status: dict[str, object], github_enabled: bool) -> str:
    number = issue_status.get("number")
    if number:
        project = issue_status.get("project_status") or issue_status.get("state") or issue_status.get("status")
        return f"#{number} ({project})"
    return "missing" if github_enabled else "not checked"


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
        default_source_dir = config_path_value(config, "source_dir")
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
        description="Plan the next dependency-valid full-feature thread for a GitHub-backed epic.",
    )
    parser.add_argument(
        "--epic",
        help="Epic code or number, for example E5, Epic 5, or 5. Required unless --csv is provided.",
    )
    parser.add_argument(
        "--csv",
        default=resolve_config_relative_path(config_args.config, config_path_value(config, "csv")),
        type=Path,
        help="Epic GitHub issue import CSV. If omitted, --epic is used to find it.",
    )
    parser.add_argument(
        "--source-dir",
        default=default_source_dir,
        type=Path,
        help="Planning root used to resolve source specs.",
    )
    parser.add_argument(
        "--source-prefix",
        default=default_source_prefix,
        help="Source-spec prefix used in imported issue bodies.",
    )
    parser.add_argument(
        "--roadmap-source",
        default=config.get("roadmap_source"),
        help="Source spec for the epic issue body.",
    )
    parser.add_argument("--repo", default=config_str_value(config, "repo", "ThirdWatchStudios/Voidwake"))
    parser.add_argument("--project-title", default=DEFAULT_PROJECT_TITLE)
    parser.add_argument(
        "--project-owner",
        default=config_str_value(config, "project_owner", "ThirdWatchStudios"),
        help="Accepted for config parity with the import tool; not used by this read-only planner.",
    )
    parser.add_argument(
        "--project-number",
        default=config_int_value(config, "project_number", 4),
        type=int,
        help="Accepted for config parity with the import tool; not used by this read-only planner.",
    )
    parser.add_argument(
        "--scope-label",
        default=config_str_value(config, "scope_label", "prototype"),
        help="Top-level scope label used by the import plan.",
    )
    parser.add_argument(
        "--format",
        choices=("markdown", "json", "prompt"),
        default="markdown",
        help="Output format. prompt prints only the next child-thread prompt.",
    )
    parser.add_argument(
        "--no-github",
        action="store_true",
        help="Do not fetch live GitHub issue or project status; plan from local CSV only.",
    )
    parser.add_argument(
        "--no-project-status",
        action="store_true",
        help="Fetch REST issue inventory but skip GitHub Project item status reads.",
    )
    parser.add_argument(
        "--allow-project-status-unknown",
        action="store_true",
        help="Allow open issues without project status to be selected as candidates.",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Suppress progress messages on stderr.",
    )
    args = parser.parse_args()
    if args.epic:
        args.epic = normalize_epic(args.epic)
    if args.csv is None and args.epic is None:
        parser.error("--epic is required unless --csv is provided.")

    source_prefix_specified = (
        "source_prefix" in config
        or any(arg == "--source-prefix" or arg.startswith("--source-prefix=") for arg in sys.argv[1:])
    )
    if not source_prefix_specified:
        args.source_prefix = default_source_prefix_for(args.source_dir)
    args.roadmap_source = roadmap_source_for(args.source_prefix, args.roadmap_source)
    return args


def main() -> int:
    args = parse_args()
    try:
        csv_path, issue_plan = load_issue_plan(args)
        work_plan = build_work_plan(args, csv_path, issue_plan)
    except Exception as error:
        print(f"error: {error}", file=sys.stderr)
        return 1

    if args.format == "json":
        print(json.dumps(work_plan, indent=2))
    elif args.format == "prompt":
        prompt = work_plan.get("next_prompt")
        if not prompt:
            print("No dependency-valid next feature was selected.", file=sys.stderr)
            return 2
        print(prompt)
    else:
        print(render_markdown(work_plan))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
