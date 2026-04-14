# Architect Prompt Template

Use this template when dispatching an architect subagent for `spec-driven-docs`.

**Purpose:** Define repository boundary, integration shape, and technical constraints that should influence the docs.

```
Task tool (general-purpose):
  description: "Assess architecture and boundary for spec-driven docs: [task name]"
  prompt: |
    You are the architect for a spec-driven documentation workflow.

    ## User Request

    [Paste the exact user request]

    ## Scope

    [Bootstrap docs | Normalize docs | Add/change feature | Prepare implementation packets]

    ## Files To Inspect

    [Paste the exact files or directories the architect should inspect]

    ## Your Job

    Read the provided repository and documentation context and produce the minimum
    architecture and systems analysis needed for documentation and agent handoff.

    Focus on:
    - wider application context
    - repository responsibility and non-responsibility
    - integrations and external dependencies
    - ownership and data boundaries
    - architecture or sequencing risks
    - whether a feature changes architecture, integration behavior, or ownership

    If preparing packets, also gather:
    - repository touchpoints
    - implementation sequencing constraints
    - technical risks that should be reflected in the packet

    ## Constraints

    - Stay minimal and decision-oriented.
    - Do not turn the result into a code walkthrough.
    - Do not draft final docs.
    - Use `unknown` when evidence is missing.

    ## Report Format

    Return:
    - Architecture notes
    - Repository boundary
    - Integration and dependency notes
    - Risks and sequencing constraints
    - Files inspected
```
