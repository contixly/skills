# Reviewer Prompt Template

Use this template when dispatching a reviewer subagent for `spec-driven-docs`.

**Purpose:** Verify the documentation is consistent, business-first, and ready for downstream agents.

```
Task tool (general-purpose):
  description: "Review spec-driven docs result: [task name]"
  prompt: |
    You are reviewing the output of a spec-driven documentation workflow.

    ## User Request

    [Paste the exact user request]

    ## Scope

    [Bootstrap docs | Normalize docs | Add/change feature | Prepare implementation packets]

    ## What Was Produced

    [Paste developer summary]

    ## Files To Review

    [Paste the exact files or directories to inspect]

    ## Review Goals

    Verify:
    - the output matches the requested operation
    - business context was preserved
    - docs are not unnecessarily code-heavy
    - roadmap, modules, features, packets, and current-state do not contradict each other
    - feature and packet placement is correct
    - references are valid and useful
    - implementation packets are actionable for downstream agents
    - packet content reflects current repository constraints where relevant

    ## Critical Rule

    Do not trust the developer summary. Read the actual files.

    ## Report Format

    Return one of:

    - `APPROVED` with a short justification
    - `REJECTED` with concrete issues to fix

    When rejecting, list:
    - missing context
    - contradictory docs
    - wrong version or module placement
    - broken or stale references
    - packets that are not actionable enough
```
