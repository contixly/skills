# Contixly Skills

Repository for reusable AI skills, prompt packs, and supporting tooling used to build and maintain spec-driven work.

This repo currently contains:

- `spec-driven-docs` - a skill for turning repository context into a structured `docs/` workspace for AI-assisted planning and delivery
- `spec-driven-docs-viewer` - a local read-only viewer for inspecting generated docs, feature status, and implementation packets

## Quick start

Install the main skill into a skills-compatible repository:

```bash
npx skills add https://github.com/contixly/skills --skill spec-driven-docs
```

Run the viewer locally inside a repository that already has generated `docs/_meta/*.json` files and packet markdown:

```bash
npx @contixly/spec-driven-docs-viewer
```

## What is inside

### `spec-driven-docs`

The main skill in this repository. It helps bootstrap or normalize documentation so agents can work from a stable business and delivery context instead of rediscovering the project on every pass.

Key files:

- [Skill definition](./spec-driven-docs/SKILL.md)
- [Skill README](./spec-driven-docs/README.md)
- [Reference docs contract](./spec-driven-docs/references/docs-contract.md)
- [Feature spec pattern](./spec-driven-docs/references/feature-spec-pattern.md)
- [Subagent orchestration notes](./spec-driven-docs/references/subagent-orchestration.md)

It includes helper scripts for:

- bootstrapping docs from scratch
- syncing compact JSON indexes under `docs/_meta/`
- building implementation packets

### `spec-driven-docs-viewer`

This package renders the generated documentation into a local board so humans can inspect roadmap state, feature readiness, and packet prompts without opening many markdown files by hand.

Useful commands:

```bash
npx @contixly/spec-driven-docs-viewer
```

For publishing, the package exposes a CLI entry point and includes a `publish:package` script.

## Repository layout

- `spec-driven-docs/` - skill source, references, prompts, scripts, and evaluation fixtures
- `spec-driven-docs-viewer/` - React/Vite viewer and test suite

## How to use this repo

- Add or update skills under `spec-driven-docs/` when the behavior, prompts, or references change.
- Keep the skill README aligned with the public behavior of the skill.
- Use the viewer package to inspect generated docs and handoff packets locally.
- Treat `docs/` as the source of truth for repository-level design and implementation planning.

## Publishing notes

The repository is meant to be readable on GitHub without extra context. Keep the top section current, prefer direct links over prose-heavy explanations, and update this page when new skills or tools are added.
