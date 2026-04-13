# PMBoK-Lite Guidance

Use PMBoK as a structuring aid, not as bureaucracy. The output should stay concise, but it must cover the project-management basics that help both humans and agents make sound delivery decisions.

## What "PMBoK-lite" means here

- Capture why the project exists, not just what is being built.
- Make stakeholders, decisions, assumptions, and constraints visible.
- Keep scope boundaries explicit per roadmap stage.
- Record risks, dependencies, and milestone expectations early.
- Avoid ceremony that does not improve delivery decisions.

## File mapping

### `docs/project-passport.md`

Use this file as a lightweight project charter.

Cover:

- business case
- objectives and success metrics
- stakeholders and decision model
- scope and non-scope
- assumptions and constraints
- milestone snapshot
- key risks and dependencies
- governance and open questions

### `docs/product-overview.md`

Use this file as the product description and current-state assessment.

Cover:

- product promise
- user groups and stakeholders
- current process or pain points
- target process or desired outcome
- capabilities map
- business rules or critical constraints
- integration touchpoints
- open questions

### `docs/roadmap.md`

Use this file as a release and planning baseline.

For each version or horizon, cover:

- business goal
- scope
- milestones
- dependencies
- exit criteria

Also include cross-version dependencies, major risks, and resource assumptions that affect sequencing.

### `docs/architecture.md`

This is not a full technical design. It is a minimal reference architecture that lets a delivery agent understand where the repository fits.

Cover:

- application context
- high-level component breakdown
- external integrations
- data ownership boundaries
- repository responsibility and non-responsibility
- runtime or deployment assumptions

## Writing rules

- Prefer decision-ready summaries over long narrative.
- Keep business language first and implementation detail second.
- If the user gives only partial data, document assumptions and unresolved points instead of inventing certainty.
