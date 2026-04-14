from __future__ import annotations

import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class SkillContractTests(unittest.TestCase):
    def test_role_prompt_templates_exist(self) -> None:
        expected = [
            ROOT / "agents" / "analyst-prompt.md",
            ROOT / "agents" / "architect-prompt.md",
            ROOT / "agents" / "developer-prompt.md",
            ROOT / "agents" / "reviewer-prompt.md",
        ]

        missing = [str(path) for path in expected if not path.exists()]
        self.assertEqual(missing, [])

    def test_evals_json_includes_role_based_scenarios(self) -> None:
        payload = json.loads((ROOT / "evals" / "evals.json").read_text(encoding="utf-8"))
        names = {item["name"] for item in payload["evals"]}

        self.assertIn("bootstrap-with-role-based-subagents", names)
        self.assertIn("feature-update-with-role-review-loop", names)
        self.assertIn("packet-preparation-with-technical-context", names)


if __name__ == "__main__":
    unittest.main()
