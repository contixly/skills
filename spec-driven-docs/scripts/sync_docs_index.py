#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

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
                key = normalize_key(match.group(1))
                metadata[key] = match.group(2).strip()
    return metadata


def split_dependencies(raw: str | None) -> list[str]:
    if not raw:
        return []
    if raw.lower() == "none":
        return []
    return [item.strip() for item in raw.split(",") if item.strip()]


def collect_features(docs_dir: Path) -> list[dict[str, object]]:
    features: list[dict[str, object]] = []
    for path in sorted((docs_dir / "versions").glob("*/features/*.md")):
        metadata = parse_metadata(path)
        if "id" not in metadata:
            continue
        features.append(
            {
                "id": metadata["id"],
                "name": path.stem,
                "module": metadata.get("module", "unknown"),
                "version": metadata.get("version", path.parent.parent.name),
                "status": metadata.get("status", "unknown"),
                "priority": metadata.get("priority", "unknown"),
                "depends_on": split_dependencies(metadata.get("depends_on")),
                "path": str(path.relative_to(docs_dir)),
            }
        )
    return features


def collect_tasks(docs_dir: Path) -> list[dict[str, object]]:
    tasks: list[dict[str, object]] = []
    for path in sorted((docs_dir / "versions").glob("*/iterations/*.md")):
        metadata = parse_metadata(path)
        if "id" not in metadata:
            continue
        tasks.append(
            {
                "id": metadata["id"],
                "title": path.stem,
                "feature": metadata.get("feature", "unknown"),
                "version": metadata.get("version", path.parent.parent.name),
                "status": metadata.get("status", "unknown"),
                "owner": metadata.get("owner", "unassigned"),
                "path": str(path.relative_to(docs_dir)),
            }
        )
    return tasks


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
    tasks = collect_tasks(docs_dir)

    feature_index = {"features": features, "generated_from": str(docs_dir)}
    task_board = {"tasks": tasks, "generated_from": str(docs_dir)}

    (meta_dir / "feature-index.json").write_text(json.dumps(feature_index, indent=2) + "\n", encoding="utf-8")
    (meta_dir / "task-board.json").write_text(json.dumps(task_board, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
