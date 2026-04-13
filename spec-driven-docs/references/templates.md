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

## Problem

## Target users

## Business goals

## Non-goals

## Constraints

## Success metrics

## Open questions
```

## `docs/product-overview.md`

```md
# Product Overview

## Product promise

## Primary personas

## Core user flows

## Functional map

## Risks and assumptions

## Open questions
```

## `docs/roadmap.md`

```md
# Roadmap

## Planning assumptions

## MVP

### Goal

### Included modules

### Key features

### Exit criteria

## V1

### Goal

### Expansion

## V2

### Goal

### Expansion

## Cross-version dependencies
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

## Open questions
```

## `docs/versions/<version>/README.md`

```md
# Version: <version>

## Goal

## In scope

## Out of scope

## Dependencies

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

## Business outcome

## User problem

## Scope

## Out of scope

## User flows

## Acceptance signals

## Risks and assumptions

## References
- [Module doc](../../../../modules/<module-id>.md)
- [Version doc](../README.md)

## Open questions
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

## Delivery notes for the implementing agent

## Done when

## References
- [Feature spec](../features/<feature-id>.md)
- [Roadmap](../../../roadmap.md)
- [Project passport](../../../project-passport.md)
```

## Writing guidance

- Keep `## Open questions` at the end.
- If a section is unknown, state that clearly instead of leaving placeholder noise.
- Prefer lists over dense paragraphs for scope and acceptance.
- If a packet can be parallelized, say so explicitly in `## Delivery notes for the implementing agent`.
