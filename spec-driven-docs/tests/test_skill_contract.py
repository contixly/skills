from __future__ import annotations

import json
import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
VIEWER_ROOT = ROOT / "assets" / "viewer"
FIXTURE_ROOT = VIEWER_ROOT / "tests" / "fixtures" / "basic"


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

    def test_skill_docs_reference_the_viewer_command(self) -> None:
        skill = (ROOT / "SKILL.md").read_text(encoding="utf-8")
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        package_json = json.loads((VIEWER_ROOT / "package.json").read_text(encoding="utf-8"))

        self.assertIn("npx @contixly/spec-driven-docs-viewer", skill)
        self.assertIn("npx @contixly/spec-driven-docs-viewer", readme)
        self.assertEqual(package_json["name"], "@contixly/spec-driven-docs-viewer")
        self.assertEqual(package_json["bin"], {"spec-driven-docs-viewer": "./dist/cli.js"})
        self.assertEqual(package_json["files"], ["dist"])
        self.assertEqual(package_json["publishConfig"]["access"], "public")

    def test_viewer_publish_script_exists_and_supports_help(self) -> None:
        package_json = json.loads((VIEWER_ROOT / "package.json").read_text(encoding="utf-8"))

        self.assertEqual(package_json["scripts"]["publish:package"], "./scripts/publish.sh")

        result = subprocess.run(
            ["sh", "./scripts/publish.sh", "--help"],
            cwd=VIEWER_ROOT,
            check=False,
            capture_output=True,
            text=True,
        )

        self.assertEqual(result.returncode, 0, msg=result.stderr)
        self.assertIn("Usage: ./scripts/publish.sh", result.stdout)

    def test_viewer_publish_script_supports_dry_run_without_auth(self) -> None:
        result = subprocess.run(
            ["sh", "./scripts/publish.sh", "--dry-run"],
            cwd=VIEWER_ROOT,
            check=False,
            capture_output=True,
            text=True,
        )

        combined = "\n".join(part for part in [result.stdout, result.stderr] if part)
        self.assertEqual(result.returncode, 0, msg=combined)
        self.assertIn("Publishing to https://registry.npmjs.org/ with tag latest and public access (dry-run)", combined)

    def test_built_cli_starts_from_fixture_workspace(self) -> None:
        subprocess.run(
            ["npm", "run", "build"],
            cwd=VIEWER_ROOT,
            check=True,
            capture_output=True,
            text=True,
        )

        pack_result = subprocess.run(
            ["npm", "pack", "--json"],
            cwd=VIEWER_ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        tarball_name = json.loads(pack_result.stdout)[0]["filename"]
        tarball_path = VIEWER_ROOT / tarball_name

        try:
            process = subprocess.Popen(
                [
                    "npm",
                    "exec",
                    "--yes",
                    "--package",
                    str(tarball_path),
                    "--",
                    "spec-driven-docs-viewer",
                    "--help",
                ],
                cwd=FIXTURE_ROOT,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            try:
                stdout, stderr = process.communicate(timeout=10)
            except subprocess.TimeoutExpired:
                process.terminate()
                stdout, stderr = process.communicate(timeout=5)
        finally:
            tarball_path.unlink(missing_ok=True)

        combined = "\n".join(part for part in [stdout, stderr] if part)
        self.assertIn("Spec-driven docs viewer running at http://127.0.0.1:", combined)

if __name__ == "__main__":
    unittest.main()
