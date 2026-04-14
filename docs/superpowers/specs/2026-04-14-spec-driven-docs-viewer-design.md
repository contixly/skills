# Spec-Driven Docs Viewer Design

**Date:** 2026-04-14
**Skill:** `spec-driven-docs`
**Status:** approved for planning

## Goal

Add a mini web application to the `spec-driven-docs` skill that can be launched from any target repository via `npx`, reads the repository's `docs/` outputs in read-only mode, visualizes delivery state as a kanban-style board, and lets the user copy an implementation-ready prompt for a selected packet.

## Context

The `spec-driven-docs` skill already produces a compact machine-readable contract in:

- `docs/_meta/feature-index.json`
- `docs/_meta/task-board.json`
- `docs/_meta/delivery-state.json`

It also produces packet markdown files under `docs/versions/<version>/iterations/*.md`, and those packet files already include a suggested follow-up prompt. The new viewer should reuse those outputs instead of inventing a second planning source of truth.

The reference interaction model is similar to [BloopAI/vibe-kanban](https://github.com/BloopAI/vibe-kanban): fast scanning, clear status columns, shallow navigation, and a strong focus on selecting the next concrete slice of work.

## Product shape

The application is a read-only local workspace with two nested levels:

1. A top-level feature board grouped by feature status.
2. A feature drilldown that reveals the packet implementation picture for the selected feature.

The top-level board is the default entry point and uses status-first columns:

- `planned`
- `ready`
- `in-progress`
- `done`

Each feature card shows milestone and module markers directly on the card so the board still communicates roadmap placement and ownership without switching modes.

Selecting a feature opens a detail pane rather than a separate route-first experience. That pane contains:

- feature summary and metadata
- packet kanban for that feature
- delivery-state context relevant to execution
- prompt-copy controls for the selected packet

This keeps planning and execution in one workspace and avoids forcing the user through a page transition before they can act.

## Primary use cases

### 1. Scan current feature state

The user runs `npx ...` in a target repository and immediately sees which features are `planned`, `ready`, `in-progress`, or `done`, with visible module and milestone markers.

### 2. Inspect one feature deeply

The user clicks a feature and sees only the packets that belong to that feature, grouped by packet status, plus dependencies and delivery context.

### 3. Copy an implementation prompt

The user selects a packet inside the feature drilldown and clicks `Copy Prompt` to get a ready-to-paste prompt for an implementing agent.

### 4. Review delivery health without editing docs

The user uses the application as a read-only dashboard over skill-produced docs. The app never writes back to `docs/`, never mutates packet state, and never becomes a second planner.

## Distribution and launch model

The viewer is distributed with the skill, but launched from the target repository through `npx`.

Required launch behavior:

1. The user runs one command from the target repository root.
2. A packaged CLI starts a local HTTP server.
3. The CLI resolves the current working directory as the target repository.
4. The CLI reads `./docs/_meta/*.json` and packet markdown files from that repository.
5. The CLI opens or prints a localhost URL for the viewer.

Implications:

- The packaged app must be self-contained enough to run from an npm package without copying app sources into the target repository.
- The viewer must tolerate absent package installation state in the target repository.
- The runtime must not assume the target repository itself is a Node project.
- The app should fail with a clear diagnostic when `docs/_meta` is missing or stale.

## Data contract and runtime model

### Stable inputs

Treat these files as the primary contract:

- `docs/_meta/feature-index.json`
- `docs/_meta/task-board.json`
- `docs/_meta/delivery-state.json`

Treat packet markdown files as a secondary enrichment source used only for prompt extraction and packet detail context.

### Client-side normalized view model

The app should build a normalized in-memory model with:

- features by id
- packets by id
- packets grouped by feature id
- feature counts by packet status
- milestone buckets derived from feature `version`
- delivery-state overlays from `delivery-state.json`

The normalization layer is required because the three JSON files are compact exports, not a UI-oriented graph.

### Read-only rule

No data source is mutable from the viewer. The app should not offer drag-and-drop persistence, inline edits, or status toggles. Visual affordances can feel kanban-like, but interactions are inspect-and-copy, not edit-and-save.

## Information architecture

### Main screen

The main screen contains:

1. Header bar
2. Global filters
3. Feature kanban board
4. Feature detail pane

### Header bar

The header should show:

- app name
- current repository path or repository label
- current branch from `delivery-state.json`
- last update timestamp from `delivery-state.json`
- data health badge indicating whether `_meta` files were found and consistent

### Global filters

The board should support:

- free-text search
- module filter
- milestone/version filter
- priority filter if feature priority is available

Filters apply to feature cards. Packet filtering happens inside the selected feature pane.

### Feature board

Features are grouped by feature status into columns. Each feature card should show:

- title
- feature id
- module badge
- milestone badge
- priority
- depends-on summary
- packet counts by packet status

The card should make it obvious whether the feature has implementation-ready packets even before drilldown.

### Feature detail pane

When no feature is selected, the pane shows a useful empty state explaining that packet implementation detail appears after feature selection.

When a feature is selected, the pane shows:

1. Feature header and summary
2. Key metadata and dependencies
3. Packet kanban grouped by packet status
4. Packet detail area for the currently selected packet

The pane should be dismissible on narrow screens and persistent on wider screens.

### Packet kanban

Packets are grouped by packet status using the same status vocabulary from the skill:

- `planned`
- `ready`
- `in-progress`
- `done`
- `blocked`
- `superseded`
- `unknown`

Only packets belonging to the selected feature are shown here.

Each packet card should show:

- title
- packet id
- owner
- status
- version

### Packet detail and prompt pack

When a packet is selected, the packet detail area should show:

- packet title and id
- parent feature
- owner
- status
- links or paths to packet and feature docs
- prompt source indicator: `packet prompt` or `generated fallback`
- primary `Copy Prompt` action

This area is where the app shifts from passive review to execution handoff.

## Prompt copy behavior

Use a hybrid strategy:

### Priority 1: extract prompt from packet markdown

If the packet markdown contains a recognizable suggested prompt section, copy that prompt exactly after trimming formatting noise.

The extraction should be tolerant of minor markdown variation around:

- heading placement
- fenced code blocks
- inline-code formatting
- surrounding explanatory text

### Priority 2: generate a fallback prompt

If no usable prompt can be extracted, generate one from:

- selected packet data from `task-board.json`
- parent feature data from `feature-index.json`
- branch and readiness context from `delivery-state.json`

The fallback prompt should tell an implementing agent to:

- implement the selected packet only
- read the feature and packet docs first
- respect repository boundaries
- update docs with `spec-driven-docs` after implementation
- refresh `docs/_meta` indexes after changes

The generated fallback must be deterministic enough that users trust repeated copies of the same packet.

## UX and visual direction

The interface should feel closer to a developer workspace than to a marketing dashboard.

Visual direction:

- restrained, dense, readable
- low-chrome layout
- strong typographic hierarchy
- clear status colors with accessible contrast
- minimal decorative gradients
- card treatment only where cards carry interaction

The first viewport should communicate:

- what branch or repository we are looking at
- what features are ready or in progress
- that clicking a feature reveals implementation depth

The packet drilldown should feel like a reveal of operational detail, not a route change to a different product.

## Error handling and empty states

### Missing docs

If `docs/` or `_meta/` is missing, show a blocking error state with a precise message and the expected file paths.

### Stale docs

If packet markdown exists but `_meta` files are absent or inconsistent, show a warning that documentation sync is likely required.

### Empty board

If there are no features or packets, show a clear empty state explaining that the viewer expects `spec-driven-docs` outputs.

### Broken prompt extraction

If packet markdown is readable but a prompt is not extractable, the app should silently fall back to generated prompt mode and label it clearly in the UI.

## Responsiveness

Desktop and laptop widths are primary, but the app must still function on mobile.

Mobile behavior:

- feature board remains the main screen
- selecting a feature opens the detail pane as a full-screen overlay or stacked panel
- packet detail becomes a second stacked section beneath the packet board

No desktop-only split layout should be required for core use.

## Packaging inside the skill

The app should live inside the `spec-driven-docs` skill as a bundled asset and runtime package rather than as repository-wide infrastructure.

A likely shape is:

- viewer source inside the skill folder
- a small CLI entrypoint for `npx`
- minimal static asset build output bundled with the package

The design should keep a clean separation between:

- skill docs and scripts
- viewer runtime
- tests for JSON adaptation and prompt extraction

## Testing strategy

The implementation should test at least:

1. JSON normalization from `_meta` files
2. feature-to-packet joining
3. prompt extraction from packet markdown
4. fallback prompt generation
5. missing-docs and stale-docs detection
6. filter behavior for module, milestone, and search

The viewer does not need editing tests because the product is intentionally read-only.

## Out of scope

Do not include:

- editing packet or feature statuses from the UI
- drag-and-drop persistence
- writing back to markdown or JSON
- GitHub or issue-tracker synchronization from the app
- multi-repository aggregation
- authentication

## Open questions

### 1. Packaging target

The exact npm package name and release workflow are still undefined.

### 2. Command shape

The exact user-facing `npx` command name is still undefined.

### 3. Markdown prompt contract hardening

The current prompt extraction source is packet markdown prose. If extraction becomes brittle in practice, the skill may need to emit a structured prompt field into `_meta` or a separate JSON export later.

## Recommendation

Implement the first version as a single-page local workspace:

- top-level feature board grouped by feature status
- detail pane drilldown into one feature's packet board
- hybrid prompt copy with markdown-first extraction and JSON fallback
- packaged CLI launched via `npx` from any target repository

This delivers the shortest path from documentation state to agent handoff while staying faithful to the skill's existing contract and keeping the app read-only.
