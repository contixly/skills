# Spec-Driven Docs Viewer Contrast Refresh Design

**Date:** 2026-04-17
**Skill:** `brainstorming`
**Status:** approved for planning

## Goal

Refresh the `spec-driven-docs-viewer` visual system so the full interface is easier to parse at a glance:

- stronger contrast across all major surfaces, not only the search control
- clearer separation between page background, panels, cards, sheets, popovers, and inputs
- a taller and better-proportioned global search trigger with a hotkey badge that no longer collapses into the control border
- a warm `Stone`-based palette with one restrained accent color for active, selected, and focus states

The work is a UI system refinement. It does not change the viewer's read-only product model, feature flow, or data contracts.

## Context

The current viewer already has the right product structure:

- workspace header with global search and source switching
- summary surfaces for runtime metadata
- feature board as the main reading surface
- feature inspector with packet grouping and packet detail drilldown
- shared UI primitives built on `shadcn`

The problem is visual readability. The current light theme is too tonally compressed:

- controls and panels sit too close to the page background
- nested surfaces often differ by too little contrast to read as separate layers
- borders are too faint to carry container boundaries on their own
- muted text is too soft for repeated operational metadata
- selected and active states rely too heavily on faint rings instead of distinct surface treatment

The global search trigger shows the issue most obviously. Its height is too small, and the `Cmd+K` badge visually merges with the outer border. But the same problem exists across the whole viewer, so the change must be systemic rather than a one-off header tweak.

## Chosen direction

Approved direction: `Option B with warm Stone neutrals and one accent color`.

This means:

- keep the viewer in a quiet, editorial, mostly neutral family
- push contrast noticeably harder than the current UI
- use stronger borders and clearer surface steps across the full shell
- add one warm accent in the `clay / rust` range for selected state, focus state, and primary action emphasis

Rejected directions:

- `minimal lift`: too small a change to solve the user's readability concerns
- `high-color dashboard`: would overstate the product and make the viewer feel noisier than necessary

## Experience principles

1. `Separation before decoration`
   Users should be able to distinguish layers by background, border, and text value before relying on shadow or motion.

2. `Warm but operational`
   The palette should stay warm and human, but still read like a serious tool rather than a soft marketing surface.

3. `Accent means state`
   Accent color is reserved for interaction meaning: selected items, active results, focus treatments, and primary actions.

4. `Nested surfaces must stay legible`
   A card inside a panel inside a sheet must still read as three different levels without forcing the user to stare.

5. `Scan-first metadata`
   Secondary details such as ids, versions, owners, and update timestamps should remain quiet, but not fade into illegibility.

## Visual system

### Base palette

The refreshed system should stay in warm `Stone` territory rather than switching to cold gray:

- `background`: parchment-like off-white with a slightly darker field behind the main shell
- `card / panel`: lighter, cleaner neutral surfaces separated from the page background
- `sheet / popover`: slightly stronger and more foregrounded than cards so overlays read immediately
- `border`: darker stone edge values that can define structure without depending on heavy shadows
- `foreground`: dark, warm charcoal rather than pure black
- `muted text`: a medium-dark stone brown that remains readable in repeated UI labels

The page may retain a subtle tonal wash in the background, but the main shell must no longer visually dissolve into it.

### Accent palette

Introduce one restrained accent in a warm `clay / rust` family.

It should be used for:

- selected feature cards
- selected packet rows
- active command palette rows
- focus rings and focus borders
- primary action buttons
- contextual emphasis such as active chips or interactive highlights

It should not be used for:

- general page decoration
- every badge in the system
- non-interactive summary facts

This keeps the UI disciplined while making state changes easy to recognize.

## Surface hierarchy

The viewer should move to a clearer four-step surface hierarchy:

1. `page background`
   The broadest field behind everything else.

2. `shell panels`
   Header card, summary panels, board columns, and inspector containers. These need clearly visible edges.

3. `nested cards and controls`
   Feature cards, packet groups, packet detail cards, inputs, buttons, and result rows.

4. `foreground overlays`
   Command palette popover and inspector sheet. These should feel closer to the user than the base shell.

Each level should have enough tonal and border separation that it can be understood without relying on hover states.

## Component decisions

### Global search trigger

The search trigger should be redesigned as a more deliberate control:

- increase overall height from the current compact button treatment
- keep enough horizontal room between title text and the shortcut badge
- give the shortcut badge its own border and background so it reads as an inset chip, not part of the outer edge
- keep the control visually aligned with adjacent header actions such as source switching

The result should feel like a primary navigation affordance, not a compressed utility button.

### Header and workspace shell

The workspace header card should become more clearly containerized:

- stronger border
- slightly stronger panel background
- darker secondary text and kicker labels
- clearer distinction between the header card and the page field behind it

Header actions should share a common control height rhythm so the search trigger and source switcher read as related controls.

### Feature cards

Feature cards should move from lightly tinted tiles to clearly separated objects:

- darker default border
- stronger selected state using both accent border and accent-surface background
- hover state that improves edge clarity, not only a subtle tint shift
- metadata chips that remain readable without competing with the title

Selection should not rely on ring-only emphasis. The card surface itself must show that it is the current item.

### Packet board and packet rows

Packet status groups need stronger internal hierarchy:

- packet-group cards should be more distinct from the sheet background
- lane headers should keep clear border separation from the packet list
- packet row buttons should have stronger default boundaries
- selected packet rows should use the accent surface treatment consistently with selected feature cards

This ensures the packet region remains readable once many rows are present.

### Packet detail and inspector sheet

The inspector sheet should gain more credible foreground weight:

- stronger left edge and overlay separation
- nested cards inside the sheet should still read as a second surface level
- field labels and values should gain contrast so metadata scanning feels easier

The packet detail surface should feel like a focused reading area, not a washed-out continuation of the shell.

### Command palette popover

The command palette should become easier to read in both closed and open states:

- stronger popover border and background
- clearer input boundary
- stronger active-row contrast using the accent surface
- better default row separation between results

The popover should read as a foreground tool surface, not as another faint panel.

### Badges, text, and controls

Common primitives need token-level refinement:

- outline badges need darker borders and clearer foreground values
- secondary badges need enough fill contrast to separate from card backgrounds
- muted labels should darken by one step to preserve scanability
- outline buttons and inputs should gain stronger default edges
- primary buttons should use the accent family, not neutral dark gray

These changes should come from shared tokens and primitives first, with local overrides only where hierarchy requires them.

## Implementation shape

The work should primarily happen through the shared theme and primitive layers, then be finished with targeted feature-level adjustments.

### Token layer

Update `src/index.css` to establish the new light-theme values:

- warmer `Stone` neutrals for `background`, `card`, `popover`, `secondary`, `muted`, and `border`
- darker `foreground` and `muted-foreground`
- accent-driven `primary`, `ring`, and related state values
- stronger sheet/popover and shell utility classes where the product needs more separation than the default primitive tokens provide

### Primitive layer

Review shared UI primitives for the new contrast model:

- `button`
- `card`
- `badge`
- `input`
- `command`
- `dialog` / `popover` / `sheet`
- `empty`

The goal is to let most feature surfaces improve automatically from better defaults.

### Feature layer

Then apply targeted changes to viewer features where component composition still needs explicit hierarchy:

- `WorkspaceHeader`
- `WorkspaceCommandPalette`
- `FeatureCard`
- `PacketBoard`
- `PacketDetail`
- `FeatureInspector`
- any summary or shell component that still looks under-separated after token updates

## Testing and verification

The refresh is visual, but it still needs regression coverage.

Required verification:

- existing viewer tests remain green
- targeted tests for the command palette still pass after the trigger and popover styling changes
- TypeScript typecheck remains green

Recommended implementation verification:

- `cd spec-driven-docs-viewer && npm test`
- `cd spec-driven-docs-viewer && npm run check`

Manual verification expectations:

- search trigger reads comfortably in the header at desktop width
- `Cmd+K` badge is visually distinct from the control border
- header, summary, board, packet groups, and inspector are distinguishable without zooming in
- selected feature and packet states are obvious immediately
- accent use feels intentional and limited rather than spreading across neutral content

## Out of scope

- changing viewer information architecture
- adding new product capabilities or editable workflows
- redesigning the board into a different interaction model
- adding more than one accent color family
- changing server, API, or docs-loading behavior unless required by styling work
