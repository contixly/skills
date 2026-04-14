# Agent Instructions

This repository contains reusable skills and the tooling around them. Treat it as a product repo for documentation and agent workflows, not as a general-purpose application codebase.

## Repository map

- `spec-driven-docs/` - the main skill, plus its references, prompts, scripts, and evaluation fixtures
- `spec-driven-docs-viewer/` - the local viewer package for docs and packet inspection
- `docs/` - project specs and implementation plans for this repository

## Working rules

- Read the existing skill and reference docs before changing behavior.
- Keep changes focused on the current skill or tool you are editing.
- Do not rewrite unrelated files or revert user changes.
- Use `apply_patch` for manual file edits.
- Prefer ASCII unless a file already uses other characters.

## What to check before editing

- `README.md` for the public-facing repo summary
- `spec-driven-docs/SKILL.md` for the authoritative skill behavior
- `spec-driven-docs/README.md` for user-facing skill guidance
- `spec-driven-docs/references/docs-contract.md` for documentation structure and metadata rules
- `spec-driven-docs/references/templates.md` for file templates

## Verification

Use the lightest useful verification for the change:

- `cd spec-driven-docs-viewer && npm test` for viewer changes
- `cd spec-driven-docs-viewer && npm run check` for TypeScript or API changes
- repository-specific tests under `spec-driven-docs/tests/` when changing the skill or its scripts

If a change affects docs generation, confirm the generated markdown and `_meta/*.json` outputs still match the contract in `spec-driven-docs/references/docs-contract.md`.

## Documentation expectations

- Keep `README.md` concise and GitHub-friendly.
- Keep `AGENTS.md` operational and specific.
- Prefer direct links to the actual skill, reference, or script file instead of describing them abstractly.

## Safety

- Do not delete or rename skill files without checking for downstream references.
- Do not assume `docs/` is generic project documentation; it is part of the repo's own planning and delivery history.
- If you are unsure whether a change affects the skill contract, inspect the reference docs first and update them together.
