# Spec-Driven Docs

Build AI-ready project documentation in `docs/` for spec-driven development, roadmap planning, and agent handoff.

`spec-driven-docs` turns repository context and product intent into a stable documentation system that agents can use without rediscovering the business every time.

## Summary

- bootstrap project docs from zero
- normalize scattered notes into one consistent `docs/` contract
- keep roadmap, modules, features, and iterations aligned
- prepare implementation packets for delivery agents
- use role-based subagents for discovery, architecture analysis, drafting, and review
- export compact JSON indexes for downstream automation and tracker sync

## Quick Start

Install after publishing to a skills-compatible repository:

```bash
npx skills add <owner/repo> --skill spec-driven-docs
```

Invoke it with a request like:

```text
Use $spec-driven-docs to create docs/ for this repository, define MVP/V1/V2, describe the repo boundary, and prepare the first implementation packets.
```

Expected outcome:

- a business-first `docs/` workspace
- a roadmap split into versions such as `mvp`, `v1`, and `v2`
- a minimal architecture reference with repository ownership
- feature specs and implementation packets for the next delivery steps
- compact indexes in `docs/_meta/`

## Viewer

Start the local read-only board from any repository that already contains `spec-driven-docs` outputs:

```bash
npx @contixly/spec-driven-docs-viewer
```

The command reads `docs/_meta/*.json` and packet markdown from the current repository, starts a local server, and prints a URL for the viewer so you can inspect feature status, drill into packet state, and copy the next implementation prompt.

## Best Fit

Use this skill when you need to:

- start project documentation from scratch
- prepare context for agent-driven implementation
- maintain documentation as the source of execution context
- plan feature delivery in small, spec-driven iterations

## How It Works With Subagents

When subagents are available, the skill follows a role-based workflow inspired by `obra/superpowers`.

- `analyst` gathers business context, scope, gaps, and affected docs
- `architect` gathers repository boundary, integrations, and technical constraints
- `developer` creates or updates the documentation
- `reviewer` checks consistency, packet readiness, and downstream usability

Default flow:

1. analyst and architect gather context
2. developer drafts or updates the docs
3. reviewer validates the result
4. developer fixes issues if review fails

## Bootstrap Docs From Zero

This is the main initialization scenario.

Use it when:

- `docs/` does not exist yet
- the repository has only lightweight product context
- you need a first planning baseline for humans and agents

### What the skill does

1. Read the most informative repository files such as root `README.md`, service READMEs, and package manifests.
2. Ask only a few targeted questions if key planning context is still missing.
3. Scaffold the documentation structure with:

```bash
python3 scripts/bootstrap_docs.py --docs-dir <project>/docs --project-name "<Project Name>"
```

4. Fill the top-level PMBoK-lite docs with real business context.
5. Write a minimal `docs/architecture.md` that explains the wider system and the repository boundary.
6. Write `docs/current-state.md` so agents can see what is implemented, in progress, ready next, or still unknown.
7. Create the first module docs, feature specs, and implementation packets, then pass them through review.
8. Export machine-readable indexes with:

```bash
python3 scripts/sync_docs_index.py --docs-dir <project>/docs
```

### What gets created

- `docs/project-passport.md`
- `docs/product-overview.md`
- `docs/roadmap.md`
- `docs/architecture.md`
- `docs/current-state.md`
- `docs/modules/*.md`
- `docs/versions/<version>/features/*.md`
- `docs/versions/<version>/iterations/*.md`
- `docs/_meta/feature-index.json`
- `docs/_meta/task-board.json`
- `docs/_meta/delivery-state.json`

### What makes it useful for agents

- business-first specs instead of code dumps
- explicit roadmap ownership and version placement
- clear repository responsibility boundaries
- implementation packets sized for incremental delivery
- lightweight technical reality gathered before packet drafting
- stable JSON exports for other skills and automations

## Design Principles

- business-first, not code-first
- explicit unknowns instead of guesswork
- Markdown for real context, JSON only for compact indexes
- stable structure so agents do not get lost in the docs
