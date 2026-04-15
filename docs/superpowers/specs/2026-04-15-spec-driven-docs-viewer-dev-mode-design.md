# Spec-Driven Docs Viewer Dev Mode Design

**Date:** 2026-04-15
**Skill:** `brainstorming`
**Status:** approved for planning

## Goal

Extend `spec-driven-docs-viewer` so it is practical for day-to-day UI development and debugging:

- run locally in a true development mode
- switch between large local fixture datasets and an external workspace
- auto-refresh when docs data changes on disk without restarting the service
- provide a realistic high-volume data set that makes board density, filtering, and detail navigation easy to evaluate visually

This design builds on the baseline viewer concept from `2026-04-14-spec-driven-docs-viewer-design.md` and narrows the scope to development workflow, fixture strategy, and live data refresh.

## Context

The current viewer already reads the `spec-driven-docs` contract and renders a feature board with packet drilldown, but the current runtime behavior is optimized for a single startup load. That is not sufficient for UI work:

- UI changes are awkward to validate without a stable local development mode
- the current test fixtures are too small to show layout stress, board density, or filter behavior
- data changes on disk only appear after restarting the service, which slows iteration and makes the viewer feel stale while docs are being edited or regenerated

The development workflow should therefore support both fast local UI iteration on fixture data and real validation against a target repository's `docs/` outputs.

## Product shape

The viewer should have two operational shells over one shared data model:

1. `runtime shell`
   - the normal read-only viewer used by the packaged CLI
   - reads one target workspace
   - exposes no development controls
2. `dev shell`
   - available through `npm run dev`
   - defaults to a large fixture scenario
   - can switch to an external workspace source
   - surfaces lightweight source and reload diagnostics needed during UI work

Both shells should render the same React application state and use the same normalized workspace model. Development mode is not a separate playground application. It is the same viewer with a dev-only operational wrapper.

## Design decisions

### 1. Separate data source concerns from UI state

Introduce a dedicated server-side data source layer with a single output contract. The data source layer is responsible for loading, validating, normalizing, and refreshing the viewer's workspace snapshot. React components should consume only the normalized snapshot, not file paths or source-specific logic.

Recommended source types:

- `fixture source`
- `external workspace source`

Both source types must produce the same normalized model so the UI does not branch on fixture vs real workspace.

### 2. Keep dev-only controls out of runtime

Development affordances should be isolated to dev mode. The packaged runtime viewer must remain a clean read-only board over one target workspace with no source switcher and no fixture-oriented controls.

Recommended behavior:

- `npm run dev` launches the dev shell
- dev shell defaults to the primary large fixture scenario
- dev shell can switch between fixture scenarios and the configured external workspace
- CLI/runtime launch continues to resolve and serve a single target workspace

### 3. Use push-based live refresh

Disk changes should trigger automatic UI refresh without restarting the service. The refresh model should be server-driven:

- server watches only the viewer contract inputs:
  - `docs/_meta/*.json`
  - `docs/versions/*/iterations/*.md`
- server debounces rapid change bursts
- server rebuilds the normalized snapshot when inputs change
- server retains the last valid snapshot if a reload fails
- server emits a revision-change event to clients
- client re-fetches `/api/workspace` after receiving the event

Recommended transport: `Server-Sent Events` on a lightweight `/api/events` endpoint.

Reasoning:

- one-way server-to-client notification is enough
- simpler than WebSocket for this read-only refresh path
- keeps reload semantics explicit: notify first, fetch snapshot second

### 4. Stress the UI with realistic large fixtures

Large fixtures should be intentionally designed to pressure the board and detail pane, not merely populate sample data. They should stay inside the same `docs/` contract as real workspaces so that fixture mode exercises the same loaders and refresh logic as runtime mode.

Recommended principle:

- fixture data must look like real `spec-driven-docs` output
- no alternate mock schema
- any fixture metadata beyond the core docs contract should live outside the workspace payload

## Architecture

### Server responsibilities

The server becomes the source-of-truth process for workspace state during both runtime and development.

Core responsibilities:

- resolve active source
- load raw docs files
- validate expected files and statuses
- normalize features, packets, counts, dependencies, and health
- expose the current workspace snapshot over HTTP
- watch the active source for changes
- emit refresh notifications when the snapshot revision changes
- preserve last valid state across transient read or parse errors

Suggested internal modules:

- `source-resolver`
  - chooses fixture or external workspace source
- `workspace-store`
  - owns current snapshot, revision, health, and reload lifecycle
- `file-watch`
  - watches only relevant docs inputs and debounces bursts
- `events`
  - exposes SSE subscriptions for client refresh notifications

### Client responsibilities

The client should remain mostly presentation-focused.

Core responsibilities:

- fetch the current workspace snapshot
- render feature board and detail pane
- subscribe to server refresh events
- re-fetch workspace snapshot after an update event
- preserve filters where possible across source switches and refreshes
- reset selection only when selected entities no longer exist

The client should not own file watching, source parsing, or source-path resolution.

## Development workflow

### Primary development mode

`npm run dev` inside `spec-driven-docs-viewer` should:

- start the dev shell
- load the `dense-portfolio` fixture by default
- expose a dev-only source switcher in the UI
- optionally accept an external workspace path at startup

Recommended source options in dev mode:

- `dense-portfolio`
- `stale-and-broken`
- `empty-or-minimal`
- `external workspace`

### External workspace in dev mode

The external workspace path should be supplied at startup, not entered freely in the browser. The UI may switch to the configured external workspace source, but it should not become a generic file-picker surface.

Reasoning:

- keeps path resolution on the server side
- avoids browser-side path validation complexity
- prevents dev UI from turning into a general workspace launcher

### Runtime mode

The packaged viewer CLI continues to:

- resolve one target workspace
- load it as the only source
- open or print the localhost URL
- auto-refresh on disk changes using the same watch-and-revision pipeline

This preserves the existing product shape while removing the current startup-only refresh limitation.

## Fixture strategy

Use a family of fixture workspaces rather than one universal sample.

### Fixture 1: `dense-portfolio`

Primary visual stress dataset for UI work.

Recommended characteristics:

- 4 versions: `mvp`, `v1`, `v2`, `v3`
- 6 to 8 modules
- 28 to 40 features
- 90 to 140 packets
- realistic status skew:
  - many `planned`, `ready`, `in-progress`
  - fewer `blocked`, `superseded`, `unknown`
- long titles on a subset of cards
- several features with 3 to 5 dependencies
- several features with 10 to 15 packets
- mixed owner and prompt-source cases

Purpose:

- stress feature-board density
- stress badge wrapping and truncation
- test filter usefulness
- exercise detail-pane scaling
- make packet-count summaries meaningful at a glance

### Fixture 2: `stale-and-broken`

Health and recovery dataset.

Recommended characteristics:

- stale `_meta` index vs packet markdown mismatch
- missing packet markdown files
- invalid or unknown statuses
- partial prompt extraction coverage

Purpose:

- verify health banners
- verify stale-index warnings
- verify error recovery and fallback behavior

### Fixture 3: `empty-or-minimal`

Empty and near-empty state dataset.

Recommended characteristics:

- minimal feature list
- no selected feature
- sparse or absent packets

Purpose:

- validate empty states
- prevent dense-data assumptions from leaking into base layout behavior

### Packet markdown coverage in fixtures

Fixture packets should intentionally cover prompt-extraction variation:

- clean prompt section
- prompt section with minor heading variation
- no prompt section, requiring generated fallback

This ensures the development environment exercises both visual UI and prompt-copy logic.

## Live refresh behavior

### Watch scope

Watch only the contract-relevant files:

- `docs/_meta/feature-index.json`
- `docs/_meta/task-board.json`
- `docs/_meta/delivery-state.json`
- `docs/versions/*/iterations/*.md`

Do not watch the entire repository.

### Reload lifecycle

Recommended sequence:

1. file watcher observes one or more relevant changes
2. server debounces the burst
3. server attempts reload of affected source
4. if reload succeeds:
   - normalized snapshot replaces current snapshot
   - revision increments
   - SSE event is emitted
5. if reload fails:
   - previous valid snapshot remains active
   - health state records the reload failure
   - UI shows non-fatal warning or error state

### Failure model

The viewer must tolerate partially written files during docs regeneration or manual edits.

Required behavior:

- no process crash on malformed intermediate JSON
- no blank-screen replacement of valid prior state
- visible health message describing the reload failure
- automatic recovery when the next reload succeeds

## UI behavior

### Runtime UI

Runtime viewer shows:

- app header
- branch and update metadata
- health status
- feature board
- feature detail pane

It does not show fixture names, source toggles, or dev diagnostics unrelated to normal viewing.

### Dev UI

Dev mode adds a compact `Data Source Switcher` in the header.

Suggested contents:

- active source name
- source type
- revision or last reload indicator
- current connection or health status

This control should remain operational and small. It should not dominate the viewer layout.

### Selection and filter behavior

Across refreshes and source switches:

- preserve global filters where possible
- preserve selected feature and packet when they still exist
- reset selection predictably when selected entities disappear
- avoid full-page reloads or abrupt layout jumps

### Refresh affordance

When a new revision is applied:

- update the rendered data without full page reload
- show a brief `Updated` signal or revision change indicator

When reload fails:

- keep rendering the last valid snapshot
- show a visible but non-blocking health banner with the reload error summary

## Testing and verification

### Automated tests

Server-side coverage should include:

- loading fixture and external workspace sources through the same contract
- auto-refresh on `_meta` changes
- auto-refresh on packet markdown changes
- debounce behavior during burst updates
- retention of last valid snapshot on reload failure

Client-side coverage should include:

- dev switcher only in dev mode
- source switching without service restart
- UI refresh after revision events
- predictable selection reset when entities disappear
- health banner behavior on reload failure and recovery

### Manual verification

Minimum expected verification flow:

1. run `npm run dev` in `spec-driven-docs-viewer`
2. confirm `dense-portfolio` loads by default
3. switch between `dense-portfolio`, `stale-and-broken`, `empty-or-minimal`, and configured external workspace
4. edit fixture files on disk and confirm UI auto-refresh without service restart
5. edit external workspace docs files and confirm the same refresh behavior
6. confirm runtime launch still behaves as a clean single-workspace viewer

## Out of scope

This design does not add:

- drag-and-drop persistence
- inline editing of feature or packet state
- browser-based workspace path picking
- separate playground application with different rendering rules
- WebSocket-based bidirectional collaboration features
- user preference persistence beyond what is already in scope for the viewer

## Risks and mitigations

### Risk: watcher noise causes excessive reloads

Mitigation:

- watch only the docs contract inputs
- debounce bursts before reload
- avoid treating every file event as an immediate full refresh

### Risk: broken intermediate files destabilize the viewer

Mitigation:

- keep last valid snapshot active
- surface reload failures through health state
- auto-recover on next valid reload

### Risk: dev-only behavior leaks into runtime

Mitigation:

- isolate dev shell from runtime shell
- keep source switcher and fixture controls dev-only
- keep shared rendering path focused on normalized workspace data

## Acceptance criteria

The design is considered satisfied when:

1. `spec-driven-docs-viewer` supports a true dev mode with fixture-first startup
2. dev mode can switch between multiple fixture scenarios and an external workspace source
3. runtime mode remains a clean read-only viewer over one workspace
4. both dev and runtime modes auto-refresh when docs data changes on disk
5. reload failures do not crash the server or discard the last valid snapshot
6. a large realistic fixture set makes UI density and filter behavior easy to inspect
7. fixture inputs use the same docs contract as real workspaces
