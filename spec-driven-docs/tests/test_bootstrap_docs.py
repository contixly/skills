from __future__ import annotations

import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BOOTSTRAP_SCRIPT = ROOT / "scripts" / "bootstrap_docs.py"


class BootstrapDocsTests(unittest.TestCase):
    def test_bootstrap_output_uses_clean_heading_spacing(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            docs_dir = Path(tmp) / "docs"

            subprocess.run(
                [
                    "python3",
                    str(BOOTSTRAP_SCRIPT),
                    "--docs-dir",
                    str(docs_dir),
                    "--project-name",
                    "Spec Hub",
                    "--module",
                    "collaboration",
                ],
                check=True,
                capture_output=True,
                text=True,
            )

            readme = (docs_dir / "README.md").read_text(encoding="utf-8")
            passport = (docs_dir / "project-passport.md").read_text(encoding="utf-8")
            overview = (docs_dir / "product-overview.md").read_text(encoding="utf-8")
            current_state = (docs_dir / "current-state.md").read_text(encoding="utf-8")
            version = (docs_dir / "versions" / "mvp" / "README.md").read_text(encoding="utf-8")

            self.assertTrue(readme.startswith("# Spec Hub Docs"))
            self.assertIn("## What this folder is for\n\n", readme)
            self.assertIn("## One-line summary\n\n", passport)
            self.assertIn("## Product promise\n\n", overview)
            self.assertIn("## Summary\n\n", current_state)
            self.assertIn("## Business goal\n\n", version)


if __name__ == "__main__":
    unittest.main()
