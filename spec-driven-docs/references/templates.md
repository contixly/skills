# Templates

Use these templates when creating or normalizing files. Keep them concise. Add sections only if they materially help planning or handoff.

## `docs/README.md`

```md
# <Project name> Docs

## What this folder is for

## How to navigate it

## Current planning baseline

## Update workflow
```

## `docs/project-passport.md`

```md
# Project Passport

## One-line summary

## Business case

## Objectives and success metrics

## Stakeholders and decision model

## Scope

## Out of scope

## Assumptions

## Constraints

## Milestone snapshot

## Risks and dependencies

## Open questions
```

## `docs/product-overview.md`

```md
# Product Overview

## Product promise

## User groups and stakeholders

## Current process and pain points

## Target process and value

## Core user flows

## Capability map

## Integration touchpoints

## Risks and assumptions

## Open questions
```

## `docs/roadmap.md`

```md
# Roadmap

## Planning assumptions

## Delivery model and priorities

## MVP

### Business goal

### Scope

### Milestones

### Dependencies

### Exit criteria

## V1

### Business goal

### Scope

### Milestones

### Dependencies

### Exit criteria

## V2

### Business goal

### Scope

### Milestones

### Dependencies

### Exit criteria

## Cross-version dependencies

## Resource and risk notes

## Open questions
```

## `docs/architecture.md`

```md
# Architecture Overview

## System context

## Reference component map

## Key integrations

## Data and ownership boundaries

## Repository responsibility

## Repository non-responsibility

## Runtime and deployment assumptions

## Architecture risks and open questions
```

## `docs/modules/<module-id>.md`

```md
# Module: <Module name>

- ID: <module-id>
- Owner: unassigned

## Responsibility

## User value

## Feature map by version

## Dependencies

## Repository touchpoints

## Open questions
```

## `docs/versions/<version>/README.md`

```md
# Version: <version>

## Business goal

## Scope

## Out of scope

## Milestones

## Dependencies

## Exit criteria

## Ready features

## Open questions
```

## Feature spec

```md
# Feature: <Feature name>

- ID: <feature-id>
- Module: <module-id>
- Version: <version>
- Status: planned
- Priority: medium
- Depends on: none

## 0. Incoming request
- Source: unknown
- Request summary: unknown
- Initiator: unknown
- Stakeholders: unknown
- Target date: unknown
- Decision owner: unknown

## 1. Feature summary

## 2. Business case

### 2.1 Business goals

### 2.2 Problem statement

### 2.3 Expected result

## 3. Current and target state

### 3.1 As is

### 3.2 To be

## 4. Functional requirements

### 4.1 User stories

### 4.2 Functional scenarios

### 4.3 Data and content requirements

### 4.4 UX and presentation notes

## 5. Non-functional requirements

## 6. Technical considerations

## 7. Acceptance criteria

## 8. Risks and dependencies

## 9. Resources and rollout notes

## 10. References and appendices
- [Module doc](../../../modules/<module-id>.md)
- [Version doc](../README.md)
- [Architecture doc](../../../architecture.md)

## Open questions
```

## `docs/current-state.md`

```md
# Current Delivery State

- Branch: unknown
- Updated at: unknown
- Implemented versions: none
- In-progress features: none
- Ready packets: none

## Summary

## What is already implemented in this branch

## What is currently in progress

## What should be implemented next

## Risks and open questions
```

## Packet template

```md
# Packet: <Packet title>

- ID: <packet-id>
- Feature: <feature-id>
- Version: <version>
- Status: ready
- Owner: unassigned

## Objective

## Scope in this packet

## Out of scope

## Inputs and dependencies

## Architecture and repository touchpoints

## Delivery notes for the implementing agent

## Done when

## After implementation
- Update this packet status to `in-progress`, `done`, `blocked`, or `superseded`.
- Update the parent feature status if delivery state changed.
- Update `docs/current-state.md`.
- Update `docs/architecture.md` if repository boundary or integrations changed.
- Re-run doc sync with `$spec-driven-docs`.
- Example prompt: `Use $spec-driven-docs to sync documentation after implementing packet <packet-id>. Update packet and feature statuses, refresh current-state, update architecture if needed, and regenerate docs/_meta indexes.`

## References
- [Feature spec](../features/<feature-id>.md)
- [Architecture doc](../../../architecture.md)
- [Roadmap](../../../roadmap.md)
- [Project passport](../../../project-passport.md)
```

## Writing guidance

- Keep `## Open questions` at the end.
- If a section is unknown, state that clearly instead of leaving placeholder noise.
- Prefer lists over dense paragraphs for scope and acceptance.
- If a packet can be parallelized, say so explicitly in `## Delivery notes for the implementing agent`.
- Keep `current-state.md` short and decision-oriented so another agent can understand branch reality in under a minute.
- Treat the packet as not fully closed until the documentation sync pass is complete.
