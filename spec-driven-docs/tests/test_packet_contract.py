from __future__ import annotations

import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BUILD_PACKET_SCRIPT = ROOT / "scripts" / "build_task_packet.py"
SKILL_MD = ROOT / "SKILL.md"
TEMPLATES_MD = ROOT / "references" / "templates.md"


class PacketContractTests(unittest.TestCase):
    def test_generated_packet_includes_doc_sync_follow_up(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            docs_dir = Path(tmp) / "docs"
            feature_path = docs_dir / "versions" / "v1" / "features" / "shared-editing.md"
            feature_path.parent.mkdir(parents=True, exist_ok=True)
            feature_path.write_text(
                "\n".join(
                    [
                        "# Feature: Shared Editing",
                        "",
                        "- ID: shared-editing",
                        "- Module: collaboration",
                        "- Version: v1",
                        "- Status: ready",
                        "- Priority: high",
                        "- Depends on: none",
                        "",
                        "## 1. Feature summary",
                        "Enable collaborative editing.",
                        "",
                    ]
                ),
                encoding="utf-8",
            )

            subprocess.run(
                [
                    "python3",
                    str(BUILD_PACKET_SCRIPT),
                    "--feature",
                    str(feature_path),
                    "--packet-id",
                    "v1-shared-editing-01",
                    "--title",
                    "Presence and Session Coordination",
                ],
                check=True,
                capture_output=True,
                text=True,
            )

            packet = (docs_dir / "versions" / "v1" / "iterations" / "v1-shared-editing-01.md").read_text(
                encoding="utf-8"
            )

            self.assertTrue(packet.startswith("# Packet: Presence and Session Coordination"))
            self.assertIn("## After implementation", packet)
            self.assertIn("## Objective\n\nDeliver one coherent slice", packet)
            self.assertIn("## After implementation\n\nWhen this packet is implemented", packet)
            self.assertIn("Use $spec-driven-docs to sync documentation after implementing packet", packet)
            self.assertIn("Update this packet status", packet)
            self.assertIn("Update `docs/current-state.md`", packet)

    def test_templates_and_skill_require_post_implementation_doc_sync(self) -> None:
        templates = TEMPLATES_MD.read_text(encoding="utf-8")
        skill = SKILL_MD.read_text(encoding="utf-8")

        self.assertIn("## After implementation", templates)
        self.assertIn("Use $spec-driven-docs to sync documentation after implementing packet", templates)
        self.assertIn("packet is not fully closed until the documentation sync pass is complete", skill)


if __name__ == "__main__":
    unittest.main()
