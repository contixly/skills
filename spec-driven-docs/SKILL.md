---
name: spec-driven-docs
description: Build and maintain project documentation in `docs/` for spec-driven application development with AI agents. Use this whenever the user wants to start project docs from scratch, normalize existing product documentation, define roadmap versions such as MVP, v1, and v2, map modules and features, split features into implementation packets or user stories, align project docs to PMBoK-style structure, describe a feature in a formal business-spec pattern, or expose task and status data for other skills and trackers. Trigger even when the user talks about project context for agents, AI-ready docs, documentation-first delivery, feature planning, architecture context, or preparing the next implementation iterations without explicitly naming documentation.
---

# Spec-Driven Docs

This skill turns `docs/` into a clear source of truth for product intent, roadmap scope, minimal architecture context, and implementation-ready work packets. The goal is not to mirror the codebase. The goal is to give humans and agents enough business context to make correct delivery decisions in small iterations.

## Core principles

- Keep documentation business-first. Prefer user value, scope, acceptance, risks, and dependencies over code excerpts or file references.
- Keep top-level docs PMBoK-lite. Project passport, product overview, and roadmap should make business case, stakeholders, scope, milestones, risks, and dependencies explicit.
- Keep structure stable. Every feature belongs to a module and a roadmap version. Every implementation packet belongs to one feature.
- Keep a minimal reference architecture. Every project should explain the wider application and what part is actually represented by the current repository.
- Keep work packets small enough that one agent can pick one up and make progress without rediscovering the whole product.
- Keep the current branch state explicit. If shipped or in-progress scope is unclear, mark it as `unknown` instead of guessing.
- Update Markdown first. Refresh machine-readable indexes in `docs/_meta/` only after the human-facing docs are correct.

## Working boundaries

- Write results into the target project's `docs/` directory.
- Use JSON only for small indexes in `docs/_meta/`.
- Avoid large architecture dumps, copied code, or verbose transcripts.
- Do not create extra process documents unless they help an agent implement or plan a feature.

## Read these files first

1. Read `references/docs-contract.md` before the first edit in a target project.
2. Read `references/templates.md` when creating or normalizing Markdown files.
3. Read `references/pmbok-lite.md` when filling top-level project docs.
4. Read `references/feature-spec-pattern.md` when adding or rewriting feature specs.
5. Use the scripts in `scripts/` instead of hand-rolling repetitive scaffolding.
6. Treat `docs/current-state.md` as the human-readable source of truth for branch state and `docs/_meta/delivery-state.json` as the compact export for other skills.

## Operating modes

### 1. Bootstrap docs from zero

Use this when `docs/` is missing or the user wants a fresh documentation baseline.

1. Interview only until the core planning gaps are closed:
   - product name and one-sentence purpose
   - target users or buyers
   - business problem and desired outcome
   - main modules or domains
   - roadmap horizons: `mvp`, `v1`, `v2` by default
   - first 1-3 features that need implementation packets
2. Run `python3 scripts/bootstrap_docs.py --docs-dir <project>/docs --project-name "<name>"`.
3. Fill the generated Markdown with concrete project context using the PMBoK-lite structure from `references/pmbok-lite.md`.
4. Create `docs/architecture.md` with the application context, main parts, integrations, and repository responsibility boundary.
5. Fill `docs/current-state.md` with the current branch or stream, what is already implemented, what is in progress, and what should happen next.
6. Create the first module specs and feature specs using the numbered feature structure from `references/feature-spec-pattern.md`.
7. Generate the first implementation packets for the nearest delivery scope.
8. Run `python3 scripts/sync_docs_index.py --docs-dir <project>/docs`.

### 2. Normalize existing documentation

Use this when the project already has notes, briefs, backlog files, or fragmented docs.

1. Audit what already exists.
2. Preserve business decisions and open questions, but collapse duplicated or conflicting wording into the contract from `references/docs-contract.md`.
3. Convert scattered feature notes into:
   - roadmap versions in `docs/roadmap.md`
   - minimal architecture context in `docs/architecture.md`
   - branch delivery state in `docs/current-state.md`
   - module specs in `docs/modules/`
   - feature specs in `docs/versions/<version>/features/`
4. If requirements conflict, call out the conflict directly in the relevant file under `## Open questions` instead of hiding it.
5. Run the sync script after normalization.

### 3. Add or change a feature

Use this when the user introduces a new feature, changes scope, or reassigns a feature to another version.

1. Find the owning module and target version.
2. Update the module doc, roadmap, and feature spec together.
3. Use the numbered feature structure from `references/feature-spec-pattern.md` for the feature spec.
4. Update `docs/architecture.md` if the feature changes integration points, data ownership, or repository responsibility.
5. Update `docs/current-state.md` if the feature changes what is already implemented, what is in progress, or what should be prepared next.
6. Check for collisions:
   - overlapping user flows
   - duplicated business outcomes
   - conflicting version promises
   - packets that are now obsolete or out of order
7. If a change invalidates earlier packets, update their status to `superseded` or `blocked` and explain why.
8. Re-run the sync script.

### 4. Prepare implementation packets

Implementation packets are the handoff surface for delivery agents.

1. Start from one feature spec.
2. Split the feature into a few meaningful packets by flow, capability, or risk slice.
3. Prefer 2-5 packets per feature rather than one giant packet list.
4. Each packet should explain:
   - objective
   - scope included and excluded
   - dependencies
   - done criteria
   - which docs to read next
5. Use `python3 scripts/build_task_packet.py` when the packet mostly follows the standard template.
6. Keep packet instructions short enough to scan, but specific enough to implement.
7. Reflect newly ready packets in `docs/current-state.md` if this affects next implementation sequencing.

### 5. Sync for other skills and trackers

Other skills should not scrape every Markdown file when a small index will do.

After any meaningful doc update:

1. Run `python3 scripts/sync_docs_index.py --docs-dir <project>/docs`.
2. Treat these files as the public machine-readable interface:
   - `docs/_meta/feature-index.json`
   - `docs/_meta/task-board.json`
   - `docs/_meta/delivery-state.json`
3. When another skill needs to update documentation, it should:
   - edit the relevant Markdown files first
   - keep metadata bullets intact
   - update `docs/current-state.md` when branch-level execution state changes
   - re-run the sync script
4. When another skill needs to consume documentation state, it should:
   - read the specific Markdown docs needed for business context
   - use `_meta/*.json` for compact indexing and tracker sync
   - treat `delivery-state.json` as the stable summary of current branch reality

## Interview guidance

Ask targeted questions only for missing planning context. Prefer this order:

1. What product is being built and for whom.
2. What business result matters in the next release.
3. Which modules make up the product.
4. What is already implemented, planned, or unknown.
5. What the wider application looks like and which part is covered by the current repository.
6. Which feature should be prepared for implementation next.

If the user is short on time, make conservative defaults and mark assumptions in `## Open questions`.

## Writing rules

- Prefer short sections and stable headings from `references/templates.md`.
- Keep direct code references rare and only when they clarify a constraint.
- Use explicit statuses: `planned`, `ready`, `in-progress`, `done`, `blocked`, `superseded`, `unknown`.
- Use stable IDs for features and packets so JSON indexes stay durable.
- Keep top-level docs aligned to PMBoK-lite concepts rather than ad hoc notes.
- Keep feature specs in the numbered pattern from `references/feature-spec-pattern.md`.
- Keep `docs/architecture.md` minimal but always explicit about the repository boundary within the whole application.
- Keep `docs/current-state.md` terse, current, and branch-specific.
- When moving a feature between versions, update all inbound references in the affected packet files.

## Suggested execution flow

1. Inspect the target project's current `docs/` state.
2. Decide whether this is bootstrap, normalization, feature change, or packet preparation.
3. Read only the relevant reference file(s) from this skill.
4. Apply Markdown changes.
5. Run the appropriate helper script(s).
6. Report:
   - what changed
   - unresolved questions or conflicts
   - what the current branch now implements or still leaves unknown
   - which packets are ready for agent implementation

## Output expectations

When you finish a documentation pass, leave the project with:

- a readable `docs/` structure aligned to the contract
- PMBoK-lite top-level docs for project context and roadmap intent
- a minimal architecture document that explains the application and the repository's place in it
- a current-state document that explains what this branch already contains, what is in progress, and what is next
- roadmap and module ownership that match the feature files
- at least the next implementation-ready packets if the user asked for planning
- fresh JSON indexes for downstream automation and tracker sync

If you cannot complete the structure because core business context is missing, create the minimal skeleton, record the gaps in `## Open questions`, and say exactly what is still unknown.
