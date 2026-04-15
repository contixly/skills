# Spec-Driven Docs Viewer Shadcn Migration Design

**Date:** 2026-04-16
**Skill:** `brainstorming`
**Status:** approved for planning

## Goal

Move the full `spec-driven-docs-viewer` product into `spec-driven-docs-viewer-shadcn` and make the new project the canonical viewer implementation.

The migration must preserve the existing viewer's functionality while replacing the UI layer with a `shadcn` + Tailwind implementation and cleaning up the internal project structure so the new codebase is easier to maintain.

Required outcomes:

- preserve runtime and development behavior
- preserve the current API and CLI contract
- preserve feature and packet workflows
- redesign the UI around a denser desktop-first kanban shell
- improve maintainability through clearer server/client/shared boundaries

The old `spec-driven-docs-viewer` remains only as migration source material. After parity is reached, it can be removed.

## Context

The current viewer already does the right product work:

- reads the `spec-driven-docs` contract from `docs/_meta/*.json` and packet markdown
- renders a feature board grouped by status
- provides packet drilldown and prompt copy behavior
- exposes runtime and dev shells
- supports dev source switching and auto-refresh on data changes

The current implementation problem is not product scope. It is structure and presentation:

- the UI layer is tightly packed into a few broad files
- stateful behavior is concentrated in a large `App.tsx`
- presentation is custom CSS-heavy instead of using reusable primitives
- the visual shell is serviceable, but not yet aligned with the denser tracker-style readability the user wants

The user explicitly allows layout and navigation regrouping as long as behavior remains the same. The visual reference is [vibekanban.com](https://www.vibekanban.com/): high readability, wide board, and a persistent right-side detail area.

## Chosen product direction

Recommended and approved direction: `Option A — Layered Transplant`.

This means:

- move runtime and data logic with minimal behavioral change
- rebuild the UI in the new project as modular `shadcn` features over the same contracts
- use the migration to establish cleaner file boundaries
- avoid a full rewrite of the data model, API surface, or watcher semantics

Rejected directions:

- `UI-first shell with adapters`: too much temporary migration debt
- `clean rewrite`: too much behavior risk for a parity migration

## Scope

### In scope

- full migration of the viewer product into `spec-driven-docs-viewer-shadcn`
- transfer of runtime server, dev server, CLI flow, docs loading, prompt building, source switching, refresh behavior, and tests
- replacement of the old UI with `shadcn` + Tailwind implementation
- reorganization into clearer server/client/shared modules
- desktop-first kanban layout with a sticky right inspector
- mobile/tablet fallback that preserves behavior but can simplify layout

### Out of scope

- changing the underlying `spec-driven-docs` docs contract
- changing viewer product semantics from read-only to collaborative or editable
- introducing new server endpoints beyond parity needs
- adding large new product features unrelated to the migration
- keeping the old viewer and new viewer alive as two long-term parallel packages

## Experience principles

1. `Functional parity first`
   The migration succeeds only if the new viewer behaves like the current viewer before any optional refinement work.

2. `Board-first desktop workflow`
   The main working surface is the feature board. The inspector supports it and should not dominate width.

3. `Tracker readability`
   Typography, spacing, card rhythm, and metadata hierarchy should support fast scanning similar to a serious local tracker.

4. `Reuse primitives`
   Common UI structure should come from `shadcn` components and project-level composition, not one-off styled containers.

5. `Maintainable boundaries`
   Runtime, data normalization, client state, and UI composition should each have clear ownership.

## Target runtime and package contract

The new `spec-driven-docs-viewer-shadcn` project becomes the full runtime successor to `spec-driven-docs-viewer`.

It must inherit:

- the package role of `@contixly/spec-driven-docs-viewer`
- the CLI behavior of `spec-driven-docs-viewer`
- runtime mode over one workspace
- dev mode with fixture and external source switching

The migration target is not a parallel preview package. It is the new canonical viewer implementation.

## Data and API contract

The migration should preserve the current normalized data contract instead of redefining it.

The new client continues to consume:

- `WorkspaceDocs`
- `FeatureRecord`
- `PacketRecord`
- `PromptPayload`

The new server continues to expose:

- `GET /api/workspace`
- `GET /api/events`
- `GET /api/prompt/:packetId`
- `POST /api/dev/source`

This is a key constraint. UI and file structure may change, but the main runtime surface should stay stable during migration.

## Architecture

The new project should be split into three top-level code layers:

### 1. `src/server/`

Owns runtime-only behavior:

- Express setup
- Vite dev middleware setup
- workspace loading and normalization
- source switching
- prompt building
- file watching and revision updates
- SSE event delivery
- runtime option parsing

### 2. `src/client/`

Owns React rendering and client-side screen state:

- app shell
- feature board
- inspector
- summary row
- source switcher UI
- command palette behavior
- responsive mode selection
- packet selection and copy flows

### 3. `src/shared/`

Owns pure shared definitions:

- contracts
- status helpers
- utility types that are safe for both server and client use

This split is meant to prevent the next codebase from repeating the current pattern where a few broad files span multiple concerns at once.

## Target file structure

Recommended structure:

```text
spec-driven-docs-viewer-shadcn/
  src/
    client/
      app/
        App.tsx
        main.tsx
        providers/
      features/
        workspace-shell/
        workspace-header/
        workspace-summary/
        source-switcher/
        feature-board/
        feature-inspector/
        packet-board/
        packet-detail/
        command-palette/
      entities/
        feature/
        packet/
        workspace/
      hooks/
        use-workspace-snapshot.ts
        use-workspace-events.ts
        use-feature-selection.ts
        use-prompt-copy.ts
        use-source-switcher.ts
        use-responsive-inspector.ts
      lib/
        formatters.ts
        clipboard.ts
    server/
      app/
        start-viewer-server.ts
        start-dev-server.ts
      workspace/
        docs-loader.ts
        workspace-store.ts
        prompt.ts
        dev-source-registry.ts
        runtime-options.ts
      lib/
        paths.ts
        sse.ts
    shared/
      contracts.ts
      status.ts
    components/
      ui/
        ...
    hooks/
    index.css
```

The exact filenames may shift slightly during implementation, but the boundaries should remain the same.

## UI design direction

### Desktop shell

The approved desktop direction is a wide kanban shell with a sticky right-side inspector inspired by the readability of `vibekanban`, adapted to the viewer's read-only product model.

Desktop layout:

- top operational header
- summary metrics row
- feature board as dominant left surface
- sticky inspector on the right

The header contains:

- product title
- source switcher in dev mode
- branch and revision context
- health context

The feature board remains grouped by status and should feel more like disciplined tracker lanes than soft cards on a landing page.

The right inspector contains:

- selected feature summary
- packet status grouping
- selected packet detail
- prompt copy action area

### Mobile and tablet behavior

Desktop is the priority. Smaller screens may simplify the experience as long as functionality remains present.

Approved fallback approach:

- stacked or tabbed shell for narrow screens
- `Sheet` for inspector behavior
- no attempt to force the full desktop kanban geometry on mobile

## Shadcn component strategy

The UI should be composed from `shadcn` primitives first and only extended with local wrappers where product-specific composition is needed.

Approved initial component set:

- `card`
- `badge`
- `button`
- `input`
- `select`
- `separator`
- `scroll-area`
- `tabs`
- `tooltip`
- `sheet`
- `skeleton`
- `alert`
- `empty`
- `dropdown-menu`
- `command`
- `popover`

Intended usage:

- `Card` for feature cards, summary cards, and inspector sections
- `Badge` for status, version, module, and priority accents
- `ScrollArea` for board and inspector overflow
- `Alert` for workspace health banners
- `Empty` for empty feature or packet states
- `Command` + `Popover` for fast jump to a feature or packet

Not recommended as core layout tools for this migration:

- `data-table`
- modal-first detail flow using `Dialog`
- sidebar-heavy application chrome unrelated to the board workflow

## Feature board composition

Each feature lane remains status-based and contains compact tracker cards.

Feature cards should expose four predictable zones:

1. top row
   - title
   - status
2. summary row
   - one concise descriptive line
3. identity row
   - feature id
   - version
   - module
4. utility row
   - priority
   - ready packet count
   - dependency signal when useful

The board should be denser than the current UI, but still clearly card-based rather than tabular.

## Inspector composition

The inspector remains part of the main screen, not a route-first drilldown.

Its responsibilities are:

- confirm current feature selection
- show packet distribution for that feature
- expose selected packet details
- support `Copy Prompt`

The internal order should be stable:

1. feature summary
2. packet grouping
3. packet detail
4. copy action and feedback

## Client state strategy

The new UI should not keep all interaction logic inside one broad component.

Recommended client hooks:

- `useWorkspaceSnapshot`
- `useWorkspaceEvents`
- `useFeatureSelection`
- `usePromptCopy`
- `useSourceSwitcher`
- `useResponsiveInspector`

These hooks should preserve current behavior:

- loading the workspace snapshot
- responding to SSE revision events
- safe selection reset when source or data changes remove the selected entity
- copy state management, including source labels and error handling
- dev source switching
- inspector mode behavior across breakpoints

## Behavior parity requirements

The first migrated release is successful only if all of the following still work:

- runtime mode and dev mode
- dev fixture switching and external workspace switching
- SSE-based refresh notifications
- prompt copy flow for packet-derived and generated fallback prompts
- stale or incomplete docs health warnings
- safe feature and packet selection reset on data changes
- CLI startup and packaged viewer behavior

No behavior in this list is optional.

## Testing strategy

The current viewer already has useful server, store, and UI tests. The new project should keep that coverage model, but align it to the new file boundaries.

Recommended test groups:

- server/runtime tests
- docs loader and workspace store tests
- prompt generation tests
- dev source switching tests
- client rendering and interaction tests

The existing fixture-driven test model should stay in place. The migration should not weaken confidence by replacing realistic docs fixtures with synthetic component-level mocks alone.

## Migration sequence

Recommended implementation order:

1. prepare the new package, script, and CLI contract so the new project can become the canonical viewer
2. move shared contracts and status helpers
3. move server-side docs loading, prompt building, runtime options, and workspace store
4. move runtime server and dev server behavior
5. establish the new client app shell against live `/api/workspace`
6. install the approved `shadcn` components
7. build the new desktop shell: header, summary, board, inspector
8. restore interactive behavior: selection, prompt copy, source switching, SSE updates
9. implement mobile/tablet fallback
10. migrate and stabilize tests
11. confirm parity, then retire the old viewer folder

## Risks and controls

### Risk: watcher and SSE behavior drifts during migration

Control:

- preserve existing watcher semantics first
- keep event and revision flow equivalent before visual refinement

### Risk: UI migration turns into product redesign

Control:

- keep the current data contract and API surface
- treat layout changes as presentation and composition work, not product-scope expansion

### Risk: feature and packet behavior regresses because state is being reorganized

Control:

- split state into focused hooks
- port interaction tests early

### Risk: transitional duplication creates long-term mess

Control:

- avoid adapter-heavy parallel structures
- move directly into the new layered project structure

## Success criteria

The migration is complete when:

- `spec-driven-docs-viewer-shadcn` runs as the full viewer product
- the new project preserves current runtime and development behaviors
- the new UI uses `shadcn` + Tailwind rather than the old custom CSS shell
- the board is desktop-first, denser, and more readable
- the codebase has clear server/client/shared boundaries
- the old viewer is no longer needed as the primary implementation

