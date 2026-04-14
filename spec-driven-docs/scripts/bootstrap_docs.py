#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
from pathlib import Path
from textwrap import dedent


def md(text: str) -> str:
    return dedent(text).strip()


def write_if_missing(path: Path, content: str, force: bool) -> None:
    if path.exists() and not force:
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.strip() + "\n", encoding="utf-8")


def docs_readme(project_name: str) -> str:
    return md(
        f"""
        # {project_name} Docs

        ## What this folder is for

        This folder stores business-facing project documentation for spec-driven delivery with AI agents.

        ## How to navigate it

        - `project-passport.md`: product identity, goals, and constraints
        - `product-overview.md`: user value and key flows
        - `roadmap.md`: version scope and delivery intent
        - `architecture.md`: reference architecture and repository scope
        - `current-state.md`: what the current branch already implements, what is in progress, and what is next
        - `modules/`: module-level responsibilities
        - `versions/`: version-specific feature specs and implementation packets
        - `_meta/`: generated indexes for automation and tracker sync

        ## Current planning baseline

        Fill this section after the first documentation interview.

        ## Update workflow

        1. Update Markdown docs.
        2. Run `python3 scripts/sync_docs_index.py --docs-dir docs`.
        3. Use `_meta/feature-index.json`, `_meta/task-board.json`, and `_meta/delivery-state.json` for automation consumers.
        """
    )


def project_passport(project_name: str) -> str:
    return md(
        f"""
        # Project Passport

        ## One-line summary

        {project_name} is being documented for spec-driven delivery.

        ## Business case

        TBD

        ## Objectives and success metrics

        TBD

        ## Stakeholders and decision model

        TBD

        ## Scope

        TBD

        ## Out of scope

        TBD

        ## Assumptions

        TBD

        ## Constraints

        TBD

        ## Milestone snapshot

        TBD

        ## Risks and dependencies

        TBD

        ## Open questions

        - Clarify primary user and business outcome.
        """
    )


def product_overview() -> str:
    return md(
        """
        # Product Overview

        ## Product promise

        TBD

        ## User groups and stakeholders

        TBD

        ## Current process and pain points

        TBD

        ## Target process and value

        TBD

        ## Core user flows

        TBD

        ## Capability map

        TBD

        ## Integration touchpoints

        TBD

        ## Risks and assumptions

        TBD

        ## Open questions

        - Which workflow matters most for the next release?
        """
    )


def roadmap(versions: list[str]) -> str:
    sections = []
    for version in versions:
        sections.append(
            md(
                f"""
                ## {version.upper()}

                ### Business goal

                TBD

                ### Scope

                TBD

                ### Milestones

                TBD

                ### Dependencies

                TBD

                ### Exit criteria

                TBD
                """
            )
        )

    return md(
        """
        # Roadmap

        ## Planning assumptions

        - Version scope is business-first and may be refined as details become clearer.

        ## Delivery model and priorities

        TBD
        """
    ) + "\n\n" + "\n\n".join(sections) + "\n\n" + md(
        """
        ## Cross-version dependencies

        TBD

        ## Resource and risk notes

        TBD

        ## Open questions

        - Which delivery assumptions still need validation?
        """
    )


def architecture_overview() -> str:
    return md(
        """
        # Architecture Overview

        ## System context

        TBD

        ## Reference component map

        TBD

        ## Key integrations

        TBD

        ## Data and ownership boundaries

        TBD

        ## Repository responsibility

        TBD

        ## Repository non-responsibility

        TBD

        ## Runtime and deployment assumptions

        TBD

        ## Architecture risks and open questions

        - Which surrounding systems are still outside this repository's visibility?
        """
    )


def current_state() -> str:
    return md(
        """
        # Current Delivery State

        - Branch: unknown
        - Updated at: unknown
        - Implemented versions: none
        - In-progress features: none
        - Ready packets: none

        ## Summary

        TBD

        ## What is already implemented in this branch

        TBD

        ## What is currently in progress

        TBD

        ## What should be implemented next

        TBD

        ## Risks and open questions

        - Which feature or packet status still needs confirmation from the team?
        """
    )


def module_doc(module_id: str) -> str:
    title = module_id.replace("-", " ").title()
    return md(
        f"""
        # Module: {title}

        - ID: {module_id}
        - Owner: unassigned

        ## Responsibility

        TBD

        ## User value

        TBD

        ## Feature map by version

        TBD

        ## Dependencies

        TBD

        ## Repository touchpoints

        TBD

        ## Open questions

        - Which features belong to this module first?
        """
    )


def version_readme(version: str) -> str:
    heading = version.upper() if version == "mvp" else version.upper()
    return md(
        f"""
        # Version: {heading}

        ## Business goal

        TBD

        ## Scope

        TBD

        ## Out of scope

        TBD

        ## Milestones

        TBD

        ## Dependencies

        TBD

        ## Exit criteria

        TBD

        ## Ready features

        TBD

        ## Open questions

        - Which features are implementation-ready for this version?
        """
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create a baseline docs/ structure for spec-driven docs.")
    parser.add_argument("--docs-dir", default="docs", help="Target docs directory. Default: docs")
    parser.add_argument("--project-name", required=True, help="Project name for generated templates")
    parser.add_argument(
        "--versions",
        nargs="+",
        default=["mvp", "v1", "v2"],
        help="Roadmap versions to scaffold. Default: mvp v1 v2",
    )
    parser.add_argument(
        "--module",
        action="append",
        dest="modules",
        default=[],
        help="Module ID to pre-create. Can be repeated.",
    )
    parser.add_argument("--force", action="store_true", help="Overwrite existing files")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    docs_dir = Path(args.docs_dir)
    force = args.force

    write_if_missing(docs_dir / "README.md", docs_readme(args.project_name), force)
    write_if_missing(docs_dir / "project-passport.md", project_passport(args.project_name), force)
    write_if_missing(docs_dir / "product-overview.md", product_overview(), force)
    write_if_missing(docs_dir / "roadmap.md", roadmap(args.versions), force)
    write_if_missing(docs_dir / "architecture.md", architecture_overview(), force)
    write_if_missing(docs_dir / "current-state.md", current_state(), force)

    for module_id in args.modules:
        write_if_missing(docs_dir / "modules" / f"{module_id}.md", module_doc(module_id), force)

    for version in args.versions:
        write_if_missing(docs_dir / "versions" / version / "README.md", version_readme(version), force)
        (docs_dir / "versions" / version / "features").mkdir(parents=True, exist_ok=True)
        (docs_dir / "versions" / version / "iterations").mkdir(parents=True, exist_ok=True)

    meta_dir = docs_dir / "_meta"
    meta_dir.mkdir(parents=True, exist_ok=True)
    write_if_missing(meta_dir / "feature-index.json", json.dumps({"features": []}, indent=2), force)
    write_if_missing(meta_dir / "task-board.json", json.dumps({"tasks": []}, indent=2), force)
    write_if_missing(
        meta_dir / "delivery-state.json",
        json.dumps(
            {
                "branch": "unknown",
                "updated_at": "unknown",
                "implemented_versions": [],
                "in_progress_features": [],
                "ready_packets": [],
                "path": "current-state.md",
            },
            indent=2,
        ),
        force,
    )


if __name__ == "__main__":
    main()
