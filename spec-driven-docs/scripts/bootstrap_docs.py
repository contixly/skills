#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
from pathlib import Path
from textwrap import dedent


def write_if_missing(path: Path, content: str, force: bool) -> None:
    if path.exists() and not force:
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def docs_readme(project_name: str) -> str:
    return dedent(
        f"""
        # {project_name} Docs

        ## What this folder is for
        This folder stores business-facing project documentation for spec-driven delivery with AI agents.

        ## How to navigate it
        - `project-passport.md`: product identity, goals, and constraints
        - `product-overview.md`: user value and key flows
        - `roadmap.md`: version scope and delivery intent
        - `modules/`: module-level responsibilities
        - `versions/`: version-specific feature specs and implementation packets
        - `_meta/`: generated indexes for automation and tracker sync

        ## Current planning baseline
        Fill this section after the first documentation interview.

        ## Update workflow
        1. Update Markdown docs.
        2. Run `python3 scripts/sync_docs_index.py --docs-dir docs`.
        3. Use `_meta` JSON files for automation consumers.
        """
    )


def project_passport(project_name: str) -> str:
    return dedent(
        f"""
        # Project Passport

        ## One-line summary
        {project_name} is being documented for spec-driven delivery.

        ## Problem
        TBD

        ## Target users
        TBD

        ## Business goals
        TBD

        ## Non-goals
        TBD

        ## Constraints
        TBD

        ## Success metrics
        TBD

        ## Open questions
        - Clarify primary user and business outcome.
        """
    )


def product_overview() -> str:
    return dedent(
        """
        # Product Overview

        ## Product promise
        TBD

        ## Primary personas
        TBD

        ## Core user flows
        TBD

        ## Functional map
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
        heading = version.upper() if version == "mvp" else version.upper()
        sections.append(
            dedent(
                f"""
                ## {heading}

                ### Goal
                TBD

                ### Included modules
                TBD

                ### Key features
                TBD

                ### Exit criteria
                TBD
                """
            ).strip()
        )

    return dedent(
        """
        # Roadmap

        ## Planning assumptions
        - Version scope is business-first and may be refined as details become clearer.

        """
    ) + "\n\n".join(sections) + dedent(
        """

        ## Cross-version dependencies
        TBD
        """
    )


def module_doc(module_id: str) -> str:
    title = module_id.replace("-", " ").title()
    return dedent(
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

        ## Open questions
        - Which features belong to this module first?
        """
    )


def version_readme(version: str) -> str:
    heading = version.upper() if version == "mvp" else version.upper()
    return dedent(
        f"""
        # Version: {heading}

        ## Goal
        TBD

        ## In scope
        TBD

        ## Out of scope
        TBD

        ## Dependencies
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


if __name__ == "__main__":
    main()
