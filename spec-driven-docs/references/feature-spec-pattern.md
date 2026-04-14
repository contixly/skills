# Feature Spec Pattern

Use this pattern when adding or rewriting a feature specification.

## Why this pattern exists

- It preserves the incoming business request before the implementation discussion starts.
- It separates business case, current state, target state, and requirements.
- It keeps acceptance, risks, and resource needs visible in the same place.

## Section order

Use this order in every feature spec:

### `## 0. Incoming request`

Capture the raw request context.

Use bullets for:

- source ticket or request
- request summary
- initiator
- stakeholders
- target date
- decision owner

### `## 1. Feature summary`

Summarize the feature in 2-4 lines: what changes, for whom, and in which version.

### `## 2. Business case`

Use these subsections:

- `### 2.1 Business goals`
- `### 2.2 Problem statement`
- `### 2.3 Expected result`

### `## 3. Current and target state`

Use these subsections:

- `### 3.1 As is`
- `### 3.2 To be`

### `## 4. Functional requirements`

Use these subsections:

- `### 4.1 User stories`
- `### 4.2 Functional scenarios`
- `### 4.3 Data and content requirements`
- `### 4.4 UX and presentation notes`

### `## 5. Non-functional requirements`

Call out performance, reliability, compatibility, security, accessibility, or operational constraints.

### `## 6. Technical considerations`

Describe integrations, architecture impacts, data implications, or technical constraints. Link to `docs/architecture.md` if the feature changes architecture or repository boundaries.

### `## 7. Acceptance criteria`

Describe ready-to-verify conditions and test scenarios.

### `## 8. Risks and dependencies`

List delivery risks, upstream dependencies, rollout blockers, and mitigation notes.

### `## 9. Resources and rollout notes`

Capture team, rollout expectations, support implications, or migration/training needs if they matter.

### `## 10. References and appendices`

Link to:

- module doc
- version doc
- architecture doc
- related packets
- external tickets, mockups, or research if they exist

## Practical rules

- Keep metadata bullets at the top of the file unchanged so the sync script can parse them.
- Use numbered headings as written here so the structure is recognizable across projects.
- Leave one blank line after every heading so the Markdown stays lint-clean and easy to scan.
- If the user gives only rough input, fill the structure with `unknown` or explicit assumptions instead of dropping sections.
