# Project Passport

## One-line summary

Fixture workspace with intentional packet/index mismatches for warning states.

## Business case

Provide realistic docs workspaces for viewer development and regression testing.

## Objectives and success metrics

- Cover the docs contract with representative metadata and markdown.
- Exercise ok, warning, and minimal workspace states.

## Stakeholders and decision model

The fixture team owns the generated content for viewer development.

## Scope

Fixture markdown, packet prompts, and compact docs indexes.

## Out of scope

Production application logic.

## Assumptions

Fixtures may be regenerated at any time from the script.

## Constraints

Keep content deterministic and aligned to the docs contract.

## Milestone snapshot

Current branch snapshot: feature/stale-and-broken.

## Risks and dependencies

Consumers must treat this as fixture data, not product truth.

## Open questions

None.