# Subagent Orchestration

Use this operating model whenever subagents are available. Follow the same spirit as `obra/superpowers`: fresh focused subagent per role, no inherited context by default, and a mandatory review gate before the documentation is considered complete.

## Core principle

Use role-based subagents to gather context, draft docs, and review output.

- Gather context first.
- Draft second.
- Review third.
- Rework if the review finds gaps.

Do not let one subagent both define and approve the same deliverable.

## Roles

### Analyst

Use for discovery and evidence gathering.

Responsibilities:

- inspect repository files, existing docs, and product notes
- extract business goals, scope, actors, and delivery pressures
- identify what is unknown or contradictory
- gather current feature and status signals from `docs/` and the repository
- for packet generation, collect the exact docs, dependencies, and recent technical constraints that the packet should reference

Expected output:

- concise findings
- open questions
- source file list
- recommended module/version placement when relevant

### Architect

Use for system boundary and impact analysis.

Responsibilities:

- identify the wider application context and repository boundary
- map integrations, ownership boundaries, and technical constraints
- assess whether a feature changes architecture, data ownership, or cross-module responsibilities
- for packet generation, identify repository touchpoints, integration risks, and implementation sequencing constraints

Expected output:

- architecture notes
- repository responsibility and non-responsibility
- change-impact summary
- risks and dependency notes

### Developer

Use for preparing or updating the documentation artifacts.

Responsibilities:

- create or update Markdown docs in the target project's `docs/`
- synthesize analyst and architect findings into the project passport, roadmap, modules, feature specs, and packets
- keep metadata bullets stable and machine-readable
- update `docs/current-state.md`
- run helper scripts after the Markdown is correct

Expected output:

- changed files
- summary of doc updates
- assumptions introduced

### Reviewer

Use for documentation QA and consistency review.

Responsibilities:

- verify the output matches the requested operation
- check that business context is preserved and the docs are not code-heavy
- check version placement, module ownership, references, packet readiness, and status consistency
- confirm that roadmap, module docs, feature docs, packets, and current-state do not contradict each other
- reject the result if critical context is missing, references are broken, or packets are not actionable

Expected output:

- pass/fail recommendation
- concrete issues to fix
- confirmation when the docs are ready for downstream agents

## Dispatch pattern

Prefer this pattern:

1. Dispatch analyst and architect in parallel when they can work independently.
2. Wait for both outputs.
3. Dispatch developer with:
   - the user request
   - analyst findings
   - architect findings
   - exact files to update
4. Dispatch reviewer on the developer result.
5. If reviewer finds issues, send the issues back to the same developer role and re-run review.

Do not dispatch multiple developer subagents in parallel against the same documentation surface unless the write sets are explicitly disjoint.

Use these prompt templates when dispatching:

- `agents/analyst-prompt.md`
- `agents/architect-prompt.md`
- `agents/developer-prompt.md`
- `agents/reviewer-prompt.md`

## Mode-specific workflows

### Bootstrap docs from zero

Use:

- analyst to read repository context and identify product, users, first features, and planning gaps
- architect to define system context, integrations, and repository boundary
- developer to scaffold and fill `docs/`
- reviewer to verify PMBoK-lite coverage, architecture clarity, and first packet readiness

Minimum outputs:

- top-level docs
- `architecture.md`
- `current-state.md`
- first module docs
- first feature specs
- first implementation packets

### Normalize existing docs

Use:

- analyst to inventory scattered notes and detect duplication/conflicts
- architect to define the correct architecture and ownership model
- developer to rewrite into the target contract
- reviewer to confirm business meaning was preserved and the normalized structure is coherent

### Add or change a feature

Use:

- analyst to locate owning module, candidate version, overlapping requirements, and affected packets
- architect to assess integration, ownership, and architecture impact
- developer to update roadmap, module docs, feature docs, packet statuses, and current-state
- reviewer to confirm there are no version conflicts or stale references

### Prepare implementation packets

Use:

- analyst to gather the parent feature, dependencies, current statuses, and existing planning context
- architect to gather implementation touchpoints, repository boundaries, and technical constraints from the repo
- developer to draft 2-5 packets with clean scope and references
- reviewer to confirm each packet is actionable for an implementation agent and does not require rediscovering the whole product

## Packet-specific rule

When preparing a packet, do not rely only on the feature spec. Also gather current technical context from the repository or surrounding docs so the packet can mention:

- integration boundaries
- relevant constraints
- ownership limits
- sequencing concerns

Keep this lightweight. The packet should still remain business-first and should not turn into a code walkthrough.

## Fallback when subagents are unavailable

If subagents are not available, perform the same roles inline in this order:

1. analyst pass
2. architect pass
3. developer pass
4. reviewer pass

State that the role workflow was executed inline rather than delegated.
