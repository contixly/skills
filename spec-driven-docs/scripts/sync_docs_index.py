#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path, PurePath

META_PATTERN = re.compile(r"^- ([A-Za-z][A-Za-z -]*):\s*(.+?)\s*$")


def normalize_key(key: str) -> str:
    return key.strip().lower().replace("-", " ").replace(" ", "_")


def to_posix_relative_path(path: PurePath, base: PurePath) -> str:
    return path.relative_to(base).as_posix()


def display_path(path: Path) -> str:
    resolved = path.resolve()
    cwd = Path.cwd().resolve()
    try:
        return str(resolved.relative_to(cwd))
    except ValueError:
        return path.name


def parse_title(path: Path, expected_prefix: str) -> str:
    with path.open(encoding="utf-8") as handle:
        for line in handle:
            stripped = line.strip()
            if not stripped:
                continue
            if not stripped.startswith("# "):
                break
            title = stripped[2:].strip()
            if title.lower().startswith(expected_prefix.lower()):
                return title[len(expected_prefix) :].strip()
            return title
    return path.stem


def parse_metadata(path: Path) -> dict[str, str]:
    metadata: dict[str, str] = {}
    with path.open(encoding="utf-8") as handle:
        for line in handle:
            stripped = line.rstrip("\n")
            if stripped.startswith("## ") and metadata:
                break
            match = META_PATTERN.match(stripped)
            if match:
                key = normalize_key(match.group(1))
                metadata[key] = match.group(2).strip()
    return metadata


def split_dependencies(raw: str | None) -> list[str]:
    if not raw:
        return []
    if raw.lower() == "none":
        return []
    return [item.strip() for item in raw.split(",") if item.strip()]


def split_values(raw: str | None) -> list[str]:
    if not raw:
        return []
    if raw.lower() in {"none", "unknown"}:
        return []
    return [item.strip() for item in raw.split(",") if item.strip()]


def build_implementation_prompt(
    *,
    packet_id: str,
    packet_title: str,
    packet_path: str,
    feature_id: str,
    feature_path: str | None,
) -> str:
    docs_packet_path = f"docs/{packet_path}"

    parts = [
        (
            f"Use the relevant skills to implement packet {packet_id} "
            f"({packet_title}) by following the task intent in {docs_packet_path}."
        )
    ]

    if feature_path:
        parts.append(f"Start by reading docs/{feature_path} and {docs_packet_path}.")
        parts.append(f"Implement only this packet for feature {feature_id}.")
    else:
        parts.append(f"Start by reading {docs_packet_path}.")
        parts.append("Implement only this packet.")

    parts.append("Do not expand scope beyond the packet.")
    return " ".join(parts)


def collect_features(docs_dir: Path) -> list[dict[str, object]]:
    features: list[dict[str, object]] = []
    for path in sorted((docs_dir / "versions").glob("*/features/*.md")):
        metadata = parse_metadata(path)
        if "id" not in metadata:
            continue
        features.append(
            {
                "id": metadata["id"],
                "title": parse_title(path, "Feature:"),
                "module": metadata.get("module", "unknown"),
                "version": metadata.get("version", path.parent.parent.name),
                "status": metadata.get("status", "unknown"),
                "priority": metadata.get("priority", "unknown"),
                "depends_on": split_dependencies(metadata.get("depends_on")),
                "path": to_posix_relative_path(path, docs_dir),
            }
        )
    return features


def collect_tasks(docs_dir: Path, feature_paths: dict[str, str]) -> list[dict[str, object]]:
    tasks: list[dict[str, object]] = []
    for path in sorted((docs_dir / "versions").glob("*/iterations/*.md")):
        metadata = parse_metadata(path)
        if "id" not in metadata:
            continue
        packet_title = parse_title(path, "Packet:")
        packet_path = to_posix_relative_path(path, docs_dir)
        feature_id = metadata.get("feature", "unknown")
        tasks.append(
            {
                "id": metadata["id"],
                "title": packet_title,
                "feature": feature_id,
                "version": metadata.get("version", path.parent.parent.name),
                "status": metadata.get("status", "unknown"),
                "owner": metadata.get("owner", "unassigned"),
                "path": packet_path,
                "implementation_prompt": build_implementation_prompt(
                    packet_id=metadata["id"],
                    packet_title=packet_title,
                    packet_path=packet_path,
                    feature_id=feature_id,
                    feature_path=feature_paths.get(feature_id),
                ),
            }
        )
    return tasks


def collect_delivery_state(
    docs_dir: Path,
    features: list[dict[str, object]],
    tasks: list[dict[str, object]],
) -> dict[str, object]:
    state_path = docs_dir / "current-state.md"
    metadata = parse_metadata(state_path) if state_path.exists() else {}

    implemented_versions = split_values(metadata.get("implemented_versions"))
    if not implemented_versions:
        implemented_versions = sorted(
            {
                str(feature["version"])
                for feature in features
                if feature.get("status") == "done"
            }
        )

    in_progress_features = split_values(metadata.get("in_progress_features"))
    if not in_progress_features:
        in_progress_features = [
            str(feature["id"])
            for feature in features
            if feature.get("status") == "in-progress"
        ]

    ready_packets = split_values(metadata.get("ready_packets"))
    if not ready_packets:
        ready_packets = [
            str(task["id"])
            for task in tasks
            if task.get("status") == "ready"
        ]

    return {
        "branch": metadata.get("branch", "unknown"),
        "updated_at": metadata.get("updated_at", "unknown"),
        "implemented_versions": implemented_versions,
        "in_progress_features": in_progress_features,
        "ready_packets": ready_packets,
        "path": to_posix_relative_path(state_path, docs_dir) if state_path.exists() else "current-state.md",
        "generated_from": display_path(docs_dir),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate compact JSON indexes from spec-driven docs.")
    parser.add_argument("--docs-dir", default="docs", help="Target docs directory. Default: docs")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    docs_dir = Path(args.docs_dir)
    meta_dir = docs_dir / "_meta"
    meta_dir.mkdir(parents=True, exist_ok=True)

    features = collect_features(docs_dir)
    feature_paths = {
        str(feature["id"]): str(feature["path"])
        for feature in features
    }
    tasks = collect_tasks(docs_dir, feature_paths)
    delivery_state = collect_delivery_state(docs_dir, features, tasks)

    feature_index = {"features": features, "generated_from": display_path(docs_dir)}
    task_board = {"tasks": tasks, "generated_from": display_path(docs_dir)}

    (meta_dir / "feature-index.json").write_text(json.dumps(feature_index, indent=2) + "\n", encoding="utf-8")
    (meta_dir / "task-board.json").write_text(json.dumps(task_board, indent=2) + "\n", encoding="utf-8")
    (meta_dir / "delivery-state.json").write_text(json.dumps(delivery_state, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
