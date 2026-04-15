# Feature: Analytics Capability 20

- ID: feature-20
- Module: analytics
- Version: v1
- Status: superseded
- Priority: medium
- Depends on: none

## 0. Incoming request

- Source: planning review
- Request summary: Expand analytics coverage for workload 20.
- Initiator: fixture-team
- Stakeholders: viewer maintainers, QA
- Target date: 2026-04-15
- Decision owner: fixture-team

## 1. Feature summary

Introduce analytics delivery slice 20 for the dense portfolio fixture.

## 2. Business case

### 2.1 Business goals

Give the viewer realistic analytics entries with varied status and dependency metadata.

### 2.2 Problem statement

Single-slice fixtures do not stress list rendering or packet grouping well enough.

### 2.3 Expected result

The dev fixture exposes enough variety to verify source switching and board behavior.

## 3. Current and target state

### 3.1 As is

The fixture needs synthetic docs that still respect the contract.

### 3.2 To be

Feature feature-20 is indexed and linked across docs, packets, and delivery state.

## 4. Functional requirements

### 4.1 User stories

- As a maintainer, I can inspect analytics feature 20 in the viewer.

### 4.2 Functional scenarios

- Viewer groups packets for feature-20 under v1.

### 4.3 Data and content requirements

Feature metadata and packet counts stay aligned with docs/_meta.

### 4.4 UX and presentation notes

Titles should remain readable in dense lists.

## 5. Non-functional requirements

Fixture loading must stay deterministic.

## 6. Technical considerations

Packet markdown must exist for every indexed packet.

## 7. Acceptance criteria

- feature-20 appears in feature-index.json and matching markdown exists.

## 8. Risks and dependencies

Synthetic narratives may drift unless regenerated from script changes.

## 9. Resources and rollout notes

Regenerate fixtures and re-run tests after any schema change.

## 10. References and appendices

- [Module doc](../../../modules/analytics.md)
- [Version README](../README.md)
- [Architecture](../../../architecture.md)