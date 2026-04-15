# Feature: Review Handoff

- ID: review-handoff
- Module: review
- Version: v1
- Status: ready
- Priority: high
- Depends on: none

## 0. Incoming request

- Source: stale fixture planning
- Request summary: Represent a source with stale packet metadata.
- Initiator: fixture-team
- Stakeholders: viewer maintainers, QA
- Target date: 2026-04-15
- Decision owner: fixture-team

## 1. Feature summary

Fixture feature used to trigger stale packet warnings.

## 2. Business case

### 2.1 Business goals

Exercise warning state rendering in dev mode.

### 2.2 Problem statement

Without stale metadata, the warning path is difficult to test end to end.

### 2.3 Expected result

The workspace loads with a warning and still exposes usable docs.

## 3. Current and target state

### 3.1 As is

Packet indexes are intentionally inconsistent.

### 3.2 To be

Viewer can surface the stale warning while still loading content.

## 4. Functional requirements

### 4.1 User stories

- As a maintainer, I can inspect stale source behavior.

### 4.2 Functional scenarios

- A packet exists on disk but not in docs/_meta.

### 4.3 Data and content requirements

One indexed packet is missing its markdown counterpart.

### 4.4 UX and presentation notes

Warning state should remain readable.

## 5. Non-functional requirements

The source must still load successfully.

## 6. Technical considerations

Mismatch between task-board.json and packet markdown is deliberate.

## 7. Acceptance criteria

- health.level becomes warning.

## 8. Risks and dependencies

Fixture drift could remove the intended mismatch.

## 9. Resources and rollout notes

Regenerate after any contract change.

## 10. References and appendices

- [Module doc](../../../modules/review.md)
- [Version README](../README.md)
- [Architecture](../../../architecture.md)