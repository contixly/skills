# Developer Prompt Template

Use this template when dispatching a developer subagent for `spec-driven-docs`.

**Purpose:** Create or update the actual documentation artifacts from analyst and architect findings.

```
Task tool (general-purpose):
  description: "Update spec-driven docs: [task name]"
  prompt: |
    You are the developer for a spec-driven documentation workflow.

    ## User Request

    [Paste the exact user request]

    ## Scope

    [Bootstrap docs | Normalize docs | Add/change feature | Prepare implementation packets]

    ## Required Inputs

    ### Analyst Findings
    [Paste analyst output]

    ### Architect Findings
    [Paste architect output]

    ## Files To Update

    [Paste the exact documentation files the developer owns]

    ## Your Job

    Create or update the target project's `docs/` so the documentation is:
    - business-first
    - structurally consistent
    - implementation-ready for downstream agents

    Follow the relevant templates and references from the skill.

    If needed:
    - run `python3 scripts/bootstrap_docs.py`
    - run `python3 scripts/build_task_packet.py`
    - run `python3 scripts/sync_docs_index.py`

    ## Constraints

    - Edit Markdown first, then regenerate JSON indexes.
    - Keep metadata bullets stable and machine-readable.
    - Keep direct code references rare.
    - Use current repository context only to clarify constraints, not to dump technical details.
    - Keep packets short, actionable, and business-first.

    ## Before Reporting Back

    Self-check:
    - Did you update all linked docs consistently?
    - Are roadmap, modules, features, packets, and current-state aligned?
    - Are any assumptions or unknowns recorded explicitly?
    - Did you regenerate indexes after Markdown edits?

    ## Report Format

    Return:
    - Status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
    - Files changed
    - Scripts run
    - Assumptions or unknowns
    - Summary of documentation changes
```
