# Spec-Driven Docs Viewer UI Refinement Design

**Date:** 2026-04-15
**Skill:** `brainstorming`
**Status:** approved for planning

## Goal

Refine the visual design of `spec-driven-docs-viewer` so it feels like a serious local tracking tool rather than a lightweight demo board:

- stricter and denser overall layout
- clearer information hierarchy for fast scanning
- stronger tracker-style readability for statuses, modules, versions, and packet readiness
- a right-side detail inspector that remains useful but does not dominate the screen

This spec is a UI refinement layer over the existing viewer design from `2026-04-14-spec-driven-docs-viewer-design.md` and the dev-mode workflow from `2026-04-15-spec-driven-docs-viewer-dev-mode-design.md`. It does not redefine the viewer's data model or read-only product shape.

## Context

The current viewer already provides the right functional shell:

- a feature board grouped by status
- a detail pane for feature and packet drilldown
- delivery-state metadata
- packet prompt copy actions

The problem is not missing capability. The problem is presentation. The current UI reads as a pleasant internal board, but not yet as a disciplined operational tool. It is too soft in a few places:

- cards are visually broader and airier than needed for dense tracking
- the top area does not provide a strong operational summary
- the right pane feels fixed rather than adaptive to board density
- chips, labels, and typography do not yet create a strong scan-first hierarchy

The user wants a strict, concise interface with informative panels and recognizable tracker ergonomics. The visual reference is [BloopAI/vibe-kanban](https://github.com/BloopAI/vibe-kanban/tree/main/packages/local-web), but the intent is not literal imitation. The viewer should borrow the reference's tool-like structure and panel discipline while staying simpler, quieter, and explicitly read-only.

## Product direction

Recommended direction: `tracker-first refinement`.

This means:

- keep the current `board + inspector` mental model
- make the board the dominant working surface
- add a denser operational summary layer above the board
- tighten typography, spacing, and label hierarchy
- let the inspector compress or collapse so the board can reclaim width

Rejected alternatives:

- `operational dashboard`: too summary-heavy for the viewer's primary workflow
- `issue-tracker emulation`: too likely to become derivative and visually noisy

## Experience principles

The refined viewer should follow these principles:

1. `Board first`
   The board is the main artifact. The inspector supports it and should never feel mandatory.

2. `Scan before read`
   The user should understand health, branch state, ready work, and active feature clusters in a few seconds, before reading any detailed text.

3. `Color as code, not decoration`
   Color should primarily communicate state. Neutral surfaces and typography should carry most of the UI.

4. `Tracker familiarity without enterprise clutter`
   The UI should feel native to users of issue trackers, but avoid overloaded enterprise chrome and excessive badge noise.

5. `Dense but calm`
   Higher information density is required, but not at the cost of stress. The interface should remain restrained and legible.

## Visual reference interpretation

The reference from `vibe-kanban` should influence the viewer in specific ways:

- a strong top control and context layer
- explicit lane headers with counts
- compact cards with meaningful metadata
- a review-like right panel that supports drilldown without route changes

The viewer should not copy:

- broad product navigation
- collaborative or editing affordances it does not actually support
- colorful issue taxonomy that exceeds the viewer's read-only needs

Target visual character:

- mostly neutral base palette
- graphites, off-whites, and muted grays as the structural layer
- measured state color for `status`, `health`, and selected contextual labels
- typography and spacing doing more work than surfaces and shadows

The closest intended feel is `Linear + a small amount of GitHub`, not a direct recreation of either.

## Layout design

### Top bar

The top bar remains the first structural band and should contain:

- viewer name
- current workspace or source context
- branch and last update context
- dev-mode source controls when applicable

The top bar should become flatter and stricter:

- less decorative separation
- tighter vertical padding
- stronger alignment between left identity and right operational controls

### Summary ribbon

Below the top bar, add a dense `A1`-style summary ribbon.

This ribbon should contain 5 to 6 compact metric panels in one line on desktop. The expected facts are:

- `health`
- `branch`
- `updated`
- `implemented versions`
- `in-progress features`
- `ready packets`

Each summary panel should use the same internal pattern:

- compact label
- primary value
- optional short secondary context

These are not decorative dashboard cards. They are operational facts designed for quick scanning.

### Main shell

The main content area stays two-pane on desktop:

- left: `feature board`
- right: `detail inspector`

The board remains the dominant column. The default width split should strongly favor the board.

The inspector must support three states:

- `open`
- `compressed`
- `collapsed`

This is a core design decision. The inspector may never consume width unconditionally on desktop. If the user needs space for the board, the UI should allow it without losing the drilldown model entirely.

## Feature board design

### Column structure

Feature columns remain grouped by status. The column shell should move closer to tracker lanes than to standalone cards:

- thinner visual framing
- clearer headers
- less soft panel treatment
- tighter spacing between cards

Each lane header should contain:

- status dot or equivalent small visual marker
- status label
- item count

### Feature card structure

Feature cards should be redesigned as balanced tracker cards with four clear zones:

1. top row
   - feature title
   - status chip
2. summary row
   - one short explanatory line or compact service summary
3. identity row
   - feature id
   - version
   - module
4. utility row
   - priority
   - ready packet count
   - optional dependency hint when materially useful

Cards should become:

- slightly shorter
- more rhythmically structured
- less rounded and less soft
- easier to compare vertically

The board should feel dense enough for real use, but not compressed into a table.

### Card copy density

Approved card density: `balanced`.

This means:

- not only title + labels
- not full kanban descriptions
- exactly one meaningful short descriptive line under the heading

The board should remain readable at a glance while still exposing enough context to distinguish similar features.

## Label and hierarchy system

The UI should use a layered label system rather than treating all badges equally.

### Status

Status gets the strongest emphasis:

- filled chip
- clear accessible contrast
- consistent color system across board, summary, and inspector

### Module and version

Module and version get lighter secondary emphasis:

- soft or outline chip treatment
- lower visual priority than status
- stable enough to support scanning ownership and roadmap placement

### Priority

Priority should be present but quiet:

- terse label or short text token
- subtle tint, not a heavy pill

### Health

Health appears in both the summary ribbon and broader workspace messaging. It may use stronger state color, but should remain integrated into the neutral shell rather than reading like a warning dashboard unless there is an actual problem.

## Detail inspector design

The inspector remains part of the main screen rather than becoming a route-first drilldown.

### Role

Its job is to:

- confirm which feature is selected
- show the packet distribution for that feature
- expose the currently selected packet
- support prompt copy without stealing focus from the board

### Internal sections

The inspector should be organized into strict sections:

1. feature summary
2. packet lanes or packet groups
3. selected packet detail
4. copy prompt action area

Each section should read as a clean internal panel with strong typography and controlled spacing, not as a large glossy card.

### Adaptive behavior

The inspector should:

- default to `open` on wide desktop screens
- allow manual compression or collapse
- enter a narrower or stacked mode on medium widths
- move below the board on narrow layouts instead of insisting on a sidebar

This ensures the viewer stays usable when feature density matters more than persistent detail visibility.

## Typography and styling

### Typography

Typography should carry more of the interface than it does now.

Recommended direction:

- one strict sans-serif UI family for operational text
- one restrained serif or display accent only if it remains useful and does not weaken the tracker feel
- stronger hierarchy between labels, body text, and card headings
- tighter letter spacing and better numeric alignment for summary values and counts

UI text should read like a tool:

- concise
- stable
- low-drama

### Surfaces and borders

Visual treatment should become flatter and more structural:

- lighter shadows or fewer shadows
- more reliance on borders, separators, and spacing
- less frosted or soft-panel feeling

Rounded corners should remain, but be more restrained than in the current UI.

### Motion

Motion should be minimal and utility-focused:

- slight hover and focus feedback
- smooth but restrained inspector expansion and collapse
- no decorative animation

All interaction motion should respect reduced-motion settings.

## Responsive behavior

### Desktop

Primary mode:

- top bar
- summary ribbon
- board
- inspector in open, compressed, or collapsed state

### Medium screens

Recommended behavior:

- summary ribbon may wrap into multiple rows
- inspector may default to compressed
- board remains primary

### Narrow screens

Recommended behavior:

- summary panels stack or wrap cleanly
- board becomes a vertical status flow if needed
- detail content moves below the board
- no forced sticky desktop sidebar behavior

The viewer should not fake a desktop tool on small screens.

## Component implications

The redesign should preserve simple React boundaries and follow the existing viewer architecture.

Recommended component structure:

- `App`
  - owns selection and inspector layout state
- `SummaryRibbon`
  - renders the operational metric row
- `SummaryMetricCard`
  - one metric panel with consistent label/value/secondary text treatment
- `FeatureBoard`
  - owns only lane grouping and board rendering
- `FeatureCard`
  - isolates the new card hierarchy and label system
- `FeatureDetailPane`
  - renders inspector sections and collapse-aware layout
- `PacketBoard`
  - keeps packet grouping local to the selected feature
- `PacketDetail`
  - renders the selected packet detail and copy area

This structure supports the visual changes without entangling data logic and presentational density.

## Quality expectations

The redesign is successful if the following are true:

1. The top of the screen communicates branch state and delivery health in under three seconds.
2. Feature cards are easier to compare vertically and horizontally than in the current UI.
3. Status, module, version, and priority are visually distinct in function, not just in color.
4. The inspector feels helpful but optional on desktop.
5. The board gains width cleanly when the inspector is compressed or collapsed.
6. The UI feels recognizably tracker-like without pretending to support editing workflows.

## Accessibility and interface rules

The refined UI should continue to satisfy current web interface expectations:

- semantic structure for major regions and headings
- visible `:focus-visible` states
- keyboard-accessible inspector controls
- robust empty states
- long text handling in cards and panes
- clear labels for icon-only controls
- no state conveyed by color alone

The visual refinement must not regress the viewer's basic keyboard and readability behavior.

## Out of scope

This redesign does not include:

- editing feature or packet state
- drag-and-drop interactions
- route-level navigation redesign
- new workflow concepts beyond board and inspector
- turning the viewer into a multi-pane planning suite

The project is a refinement of an existing read-only tool, not a product reset.

## Implementation notes for planning

The implementation plan should assume:

- layout and component refactoring in React
- a substantial rewrite of `styles.css`
- possible extraction of new presentational components from the current `App.tsx` composition
- targeted test updates for summary rendering, inspector behavior, and responsive layout states

The most important design risk is over-correcting into either:

- a dashboard that weakens the board-first workflow
- a copied issue tracker aesthetic that adds visual noise without improving clarity

The implementation should stay disciplined around the approved direction: `tracker-first refinement`.
