from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SYNC_SCRIPT = ROOT / "scripts" / "sync_docs_index.py"


class SyncDocsIndexTests(unittest.TestCase):
    def test_exports_titles_and_delivery_state(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            docs_dir = Path(tmp) / "docs"
            (docs_dir / "versions" / "v1" / "features").mkdir(parents=True)
            (docs_dir / "versions" / "v1" / "iterations").mkdir(parents=True)

            (docs_dir / "current-state.md").write_text(
                "\n".join(
                    [
                        "# Current Delivery State",
                        "",
                        "- Branch: feature/spec-docs",
                        "- Updated at: 2026-04-14",
                        "- Implemented versions: mvp",
                        "- In-progress features: smart-sync",
                        "- Ready packets: v1-smart-sync-02",
                        "",
                        "## Summary",
                        "Current branch focuses on shared editing.",
                        "",
                    ]
                ),
                encoding="utf-8",
            )
            (docs_dir / "versions" / "v1" / "features" / "smart-sync.md").write_text(
                "\n".join(
                    [
                        "# Feature: Shared Spec Editing",
                        "",
                        "- ID: smart-sync",
                        "- Module: collaboration",
                        "- Version: v1",
                        "- Status: in-progress",
                        "- Priority: high",
                        "- Depends on: realtime-foundation, comments",
                        "",
                        "## 1. Feature summary",
                        "Business-facing collaboration editing.",
                        "",
                    ]
                ),
                encoding="utf-8",
            )
            (docs_dir / "versions" / "v1" / "iterations" / "v1-smart-sync-01.md").write_text(
                "\n".join(
                    [
                        "# Packet: Presence and Edit Locking",
                        "",
                        "- ID: v1-smart-sync-01",
                        "- Feature: smart-sync",
                        "- Version: v1",
                        "- Status: ready",
                        "- Owner: agent-a",
                        "",
                        "## Objective",
                        "Ship the first collaboration slice.",
                        "",
                    ]
                ),
                encoding="utf-8",
            )

            subprocess.run(
                ["python3", str(SYNC_SCRIPT), "--docs-dir", str(docs_dir)],
                check=True,
                capture_output=True,
                text=True,
            )

            feature_index = json.loads((docs_dir / "_meta" / "feature-index.json").read_text(encoding="utf-8"))
            task_board = json.loads((docs_dir / "_meta" / "task-board.json").read_text(encoding="utf-8"))
            delivery_state = json.loads((docs_dir / "_meta" / "delivery-state.json").read_text(encoding="utf-8"))

            self.assertEqual(feature_index["features"][0]["title"], "Shared Spec Editing")
            self.assertEqual(feature_index["features"][0]["depends_on"], ["realtime-foundation", "comments"])
            self.assertEqual(task_board["tasks"][0]["title"], "Presence and Edit Locking")
            self.assertEqual(delivery_state["branch"], "feature/spec-docs")
            self.assertEqual(delivery_state["implemented_versions"], ["mvp"])
            self.assertEqual(delivery_state["in_progress_features"], ["smart-sync"])
            self.assertEqual(delivery_state["ready_packets"], ["v1-smart-sync-02"])
            self.assertEqual(feature_index["generated_from"], "docs")
            self.assertEqual(task_board["generated_from"], "docs")
            self.assertEqual(delivery_state["generated_from"], "docs")


if __name__ == "__main__":
    unittest.main()
