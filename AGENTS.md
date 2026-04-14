# AGENTS.md

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

## Commands

### Viewer (spec-driven-docs-viewer)

```bash
cd spec-driven-docs-viewer
npm run build      # Build the viewer package
npm test           # Run all tests with vitest
npm run check      # TypeScript type check (no emit)
npm run dev        # Start Vite dev server
```

Run a single test file:
```bash
cd spec-driven-docs-viewer && npx vitest run tests/App.test.tsx
```

### Skill scripts (spec-driven-docs)

```bash
cd spec-driven-docs
python3 -m unittest discover tests/            # Run all tests
python3 -m unittest tests.test_bootstrap_docs  # Run single test module
```

### Installing the skill in a target project

```bash
npx skills add https://github.com/contixly/skills --skill spec-driven-docs
```

### Running the viewer against a target project

```bash
npx @contixly/spec-driven-docs-viewer
```

## Architecture

### Skill package (spec-driven-docs/)

- `SKILL.md` - the skill definition loaded by the skills system
- `agents/*.md` - role-based prompt templates (analyst, architect, developer, reviewer)
- `references/*.md` - contracts, patterns, and templates for generated docs
- `scripts/*.py` - helper scripts for bootstrapping and syncing docs
- `tests/*.py` - Python unittest suite for script behavior
- `evals/evals.json` - evaluation fixtures for skill quality

The skill operates on a target project's `docs/` directory, creating:
- PMBoK-lite top-level docs (project-passport, product-overview, roadmap)
- Architecture and current-state documentation
- Version-scoped feature specs and implementation packets
- JSON indexes in `docs/_meta/` for downstream consumers

### Viewer package (spec-driven-docs-viewer/)

React/Vite application with Express server:
- `src/cli.ts` - CLI entry point
- `src/server.ts` - Express server that serves the viewer and API
- `src/lib/docs-loader.ts` - reads `docs/_meta/*.json` and packet markdown
- `src/components/*.tsx` - React components for feature/packet boards
- `tests/*.test.*` - vitest tests in project root tests/ directory

## Verification

Use the lightest useful verification for the change:

- `cd spec-driven-docs-viewer && npm test` for viewer changes
- `cd spec-driven-docs-viewer && npm run check` for TypeScript or API changes
- `cd spec-driven-docs && python3 -m unittest discover tests/` when changing skill scripts

If a change affects docs generation, confirm the generated markdown and `_meta/*.json` outputs still match the contract in `spec-driven-docs/references/docs-contract.md`.

## Documentation expectations

- Keep `README.md` concise and GitHub-friendly.
- Keep `AGENTS.md` operational and specific.
- Prefer direct links to the actual skill, reference, or script file instead of describing them abstractly.

## Safety

- Do not delete or rename skill files without checking for downstream references.
- Do not assume `docs/` is generic project documentation; it is part of the repo's own planning and delivery history.
- If you are unsure whether a change affects the skill contract, inspect the reference docs first and update them together.
