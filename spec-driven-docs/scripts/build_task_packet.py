#!/usr/bin/env python3

from __future__ import annotations

import argparse
import re
from pathlib import Path
from textwrap import dedent

META_PATTERN = re.compile(r"^- ([A-Za-z ]+):\s*(.+?)\s*$")


def normalize_key(key: str) -> str:
    return key.strip().lower().replace(" ", "_")


def parse_metadata(path: Path) -> dict[str, str]:
    metadata: dict[str, str] = {}
    with path.open(encoding="utf-8") as handle:
        for line in handle:
            stripped = line.rstrip("\n")
            if stripped.startswith("## ") and metadata:
                break
            match = META_PATTERN.match(stripped)
            if match:
                metadata[normalize_key(match.group(1))] = match.group(2).strip()
    return metadata


def build_packet_body(packet_id: str, title: str, feature_path: Path, feature_meta: dict[str, str], status: str) -> str:
    feature_id = feature_meta.get("id", feature_path.stem)
    version = feature_meta.get("version", feature_path.parent.parent.name)
    relative_feature = Path("../features") / feature_path.name
    return dedent(
        f"""
        # Packet: {title}

        - ID: {packet_id}
        - Feature: {feature_id}
        - Version: {version}
        - Status: {status}
        - Owner: unassigned

        ## Objective
        Deliver one coherent slice of `{feature_id}` without expanding scope.

        ## Scope in this packet
        - Define the exact user-visible outcome for this slice.
        - Keep the change small enough for one implementation pass.

        ## Out of scope
        - Follow-up enhancements not required for this slice.
        - Adjacent module work unless it is a hard dependency.

        ## Inputs and dependencies
        - Review the parent feature spec before implementation.
        - Check dependencies listed in the feature metadata.

        ## Architecture and repository touchpoints
        - Confirm whether this packet changes repository responsibility or integration behavior.
        - Cross-check `docs/architecture.md` before implementation when the feature touches external systems.

        ## Delivery notes for the implementing agent
        - Prefer business behavior that can be validated from the feature spec.
        - If new questions appear, record them back in the feature doc.
        - After implementing this packet, run a documentation sync pass with `$spec-driven-docs`.

        ## Done when
        - The slice described here is implemented.
        - Relevant acceptance signals from the feature spec are satisfied.
        - The packet, parent feature, and current-state docs are updated to reflect the latest delivery state.
        - Documentation sync is complete and machine-readable indexes are refreshed.

        ## After implementation
        When this packet is implemented or materially changed:

        1. Update this packet status to `in-progress`, `done`, `blocked`, or `superseded`.
        2. Update the parent feature status if implementation changes delivery state.
        3. Update `docs/current-state.md` to reflect what is now implemented, in progress, or ready next.
        4. Update `docs/architecture.md` if repository responsibility, integrations, or ownership boundaries changed.
        5. Re-run the documentation sync workflow with `$spec-driven-docs`.

        Suggested follow-up prompt:

        `Use $spec-driven-docs to sync documentation after implementing packet {packet_id}. Update packet and feature statuses, refresh current-state, update architecture if needed, and regenerate docs/_meta indexes.`

        ## References
        - [Feature spec]({relative_feature.as_posix()})
        - [Architecture doc](../../../architecture.md)
        - [Roadmap](../../../roadmap.md)
        - [Project passport](../../../project-passport.md)
        """
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create a standard implementation packet from a feature spec.")
    parser.add_argument("--feature", required=True, help="Path to the feature markdown file")
    parser.add_argument("--packet-id", required=True, help="Stable packet ID, for example mvp-billing-01")
    parser.add_argument("--title", required=True, help="Packet title")
    parser.add_argument("--status", default="ready", help="Packet status. Default: ready")
    parser.add_argument("--force", action="store_true", help="Overwrite the packet if it already exists")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    feature_path = Path(args.feature)
    feature_meta = parse_metadata(feature_path)
    version = feature_meta.get("version", feature_path.parent.parent.name)
    target_dir = feature_path.parent.parent / "iterations"
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / f"{args.packet_id}.md"

    if target_path.exists() and not args.force:
        raise SystemExit(f"Packet already exists: {target_path}")

    content = build_packet_body(args.packet_id, args.title, feature_path, feature_meta, args.status)
    target_path.write_text(content.rstrip() + "\n", encoding="utf-8")
    print(f"Created {target_path} for version {version}")


if __name__ == "__main__":
    main()
