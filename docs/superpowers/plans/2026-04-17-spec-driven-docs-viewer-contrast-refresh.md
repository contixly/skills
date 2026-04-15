# Spec-Driven Docs Viewer Contrast Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh `spec-driven-docs-viewer` so the full interface has stronger warm `Stone` contrast, clearer surface separation, a taller global search trigger, and restrained clay-accent selected states.

**Architecture:** Push the refresh from the bottom up. First establish stronger theme tokens and semantic viewer utility classes in `src/index.css`, then update shared `shadcn` primitives so most surfaces improve automatically, and finish with targeted composition changes in the viewer feature components where selection and layering still need explicit emphasis.

**Tech Stack:** TypeScript, React 18, Tailwind CSS v4, `shadcn` primitives, Radix UI, Vitest, React Testing Library

---

### Task 1: Establish Stone theme tokens and shell-level contrast utilities

**Files:**
- Create: `spec-driven-docs-viewer/tests/client/WorkspaceChromeContrast.test.tsx`
- Modify: `spec-driven-docs-viewer/src/index.css`
- Modify: `spec-driven-docs-viewer/src/client/features/workspace-header/WorkspaceHeader.tsx`
- Modify: `spec-driven-docs-viewer/src/client/features/workspace-summary/WorkspaceSummary.tsx`
- Modify: `spec-driven-docs-viewer/src/client/features/source-switcher/SourceSwitcher.tsx`

- [ ] **Step 1: Write the failing shell contrast tests**

```tsx
// spec-driven-docs-viewer/tests/client/WorkspaceChromeContrast.test.tsx
import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import { SourceSwitcher } from "@/client/features/source-switcher/SourceSwitcher"
import { WorkspaceHeader } from "@/client/features/workspace-header/WorkspaceHeader"
import { WorkspaceSummary } from "@/client/features/workspace-summary/WorkspaceSummary"
import type { WorkspaceDocs } from "@/shared/contracts"

function createWorkspace(): WorkspaceDocs {
  return {
    features: [
      {
        id: "smart-sync",
        title: "Shared Spec Editing",
        module: "collaboration",
        version: "v1",
        status: "in-progress",
        priority: "high",
        depends_on: [],
        path: "versions/v1/features/smart-sync.md",
        packet_counts: { ready: 1 },
      },
    ],
    packets: [],
    packetsByFeature: {},
    delivery: {
      branch: "feature/contrast-refresh",
      updated_at: "2026-04-17",
      implemented_versions: ["v1"],
      in_progress_features: ["smart-sync"],
      ready_packets: ["v1-smart-sync-01"],
      path: "current-state.md",
      generated_from: "docs",
    },
    health: { level: "ok", messages: [] },
    meta: {
      mode: "dev",
      revision: 7,
      source: { id: "workspace", kind: "workspace", label: "Runtime docs" },
      availableSources: [
        { id: "workspace", kind: "workspace", label: "Runtime docs" },
        { id: "dense-portfolio", kind: "fixture", label: "Dense portfolio" },
      ],
    },
  }
}

describe("viewer chrome contrast", () => {
  test("uses stronger shell classes for header and summary cards", () => {
    const workspace = createWorkspace()

    render(
      <>
        <WorkspaceHeader
          commandPalette={<button type="button">Jump to feature or packet</button>}
          delivery={workspace.delivery}
          health={workspace.health}
          meta={workspace.meta}
          shellState="ready"
          sourceSwitcher={<div>Runtime docs</div>}
        />
        <WorkspaceSummary
          shellState="ready"
          workspace={workspace}
          workspaceError={null}
        />
      </>
    )

    expect(
      screen
        .getByText("Spec-Driven Docs Viewer")
        .closest("[data-slot='card']")
    ).toHaveClass("tracker-panel-strong")

    expect(
      screen.getByText("Runtime snapshot looks consistent.").closest("[data-slot='card']")
    ).toHaveClass("tracker-metric-card")
  })

  test("keeps source switching aligned with the stronger header controls", () => {
    const workspace = createWorkspace()

    render(
      <SourceSwitcher
        meta={workspace.meta}
        shellState="ready"
        onChange={() => undefined}
      />
    )

    expect(
      screen.getByRole("combobox", { name: "Workspace source" })
    ).toHaveClass("tracker-control")
  })
})
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
cd spec-driven-docs-viewer
npx vitest run tests/client/WorkspaceChromeContrast.test.tsx
```

Expected: FAIL because the viewer shell does not yet apply `tracker-panel-strong`, `tracker-metric-card`, or `tracker-control`.

- [ ] **Step 3: Implement the Stone token layer and wire the shell components to it**

```css
/* spec-driven-docs-viewer/src/index.css */
:root {
  --background: oklch(0.952 0.007 80);
  --foreground: oklch(0.23 0.015 58);
  --card: oklch(0.986 0.004 82);
  --card-foreground: oklch(0.23 0.015 58);
  --popover: oklch(0.99 0.003 82);
  --popover-foreground: oklch(0.23 0.015 58);
  --primary: oklch(0.49 0.07 45);
  --primary-foreground: oklch(0.985 0.004 80);
  --secondary: oklch(0.93 0.01 78);
  --secondary-foreground: oklch(0.28 0.018 56);
  --muted: oklch(0.935 0.008 78);
  --muted-foreground: oklch(0.43 0.02 55);
  --accent: oklch(0.93 0.015 68);
  --accent-foreground: oklch(0.24 0.02 55);
  --border: oklch(0.79 0.015 72);
  --input: oklch(0.87 0.012 74);
  --ring: oklch(0.54 0.07 45);
}

@layer components {
  .tracker-panel {
    @apply border border-border/85 bg-card text-card-foreground shadow-[0_10px_26px_oklch(0.23_0.015_58_/_0.08)];
  }

  .tracker-panel-strong {
    @apply border-border bg-[linear-gradient(180deg,oklch(0.992_0.003_82),oklch(0.975_0.004_80))];
  }

  .tracker-metric-card {
    @apply bg-[linear-gradient(180deg,oklch(0.988_0.003_82),oklch(0.968_0.005_78))];
  }

  .tracker-control {
    @apply h-10 border-border bg-background/88 shadow-[inset_0_1px_0_oklch(1_0_0_/_0.45)];
  }

  .tracker-chip {
    @apply inline-flex items-center rounded-md border border-border bg-background px-2.5 py-1 text-[0.625rem] tracking-[0.18em] text-muted-foreground uppercase;
  }

  .tracker-overlay-surface {
    @apply border border-border bg-popover shadow-[0_20px_44px_oklch(0.23_0.015_58_/_0.16)];
  }

  .tracker-accent-surface {
    @apply border-primary/70 bg-primary/12 text-foreground shadow-[inset_0_1px_0_oklch(1_0_0_/_0.35)];
  }
}
```

```tsx
// spec-driven-docs-viewer/src/client/features/workspace-header/WorkspaceHeader.tsx
<Card className="tracker-panel tracker-panel-strong">
```

```tsx
// spec-driven-docs-viewer/src/client/features/workspace-summary/WorkspaceSummary.tsx
<Card key={metric.label} className="tracker-panel tracker-metric-card" size="sm">
```

```tsx
// spec-driven-docs-viewer/src/client/features/source-switcher/SourceSwitcher.tsx
<SelectTrigger
  size="default"
  aria-label="Workspace source"
  className="tracker-control min-w-44"
>
  <SelectValue placeholder="Select source" />
</SelectTrigger>
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run:

```bash
cd spec-driven-docs-viewer
npx vitest run tests/client/WorkspaceChromeContrast.test.tsx
```

Expected: PASS with 2 tests passed.

- [ ] **Step 5: Commit the shell token task**

```bash
git add spec-driven-docs-viewer/src/index.css \
  spec-driven-docs-viewer/src/client/features/workspace-header/WorkspaceHeader.tsx \
  spec-driven-docs-viewer/src/client/features/workspace-summary/WorkspaceSummary.tsx \
  spec-driven-docs-viewer/src/client/features/source-switcher/SourceSwitcher.tsx \
  spec-driven-docs-viewer/tests/client/WorkspaceChromeContrast.test.tsx
git commit -m "style(viewer): establish stone shell contrast"
```

### Task 2: Rebuild the global search trigger and command palette surface

**Files:**
- Modify: `spec-driven-docs-viewer/src/client/features/command-palette/WorkspaceCommandPalette.tsx`
- Modify: `spec-driven-docs-viewer/src/components/ui/command.tsx`
- Modify: `spec-driven-docs-viewer/tests/client/WorkspaceCommandPalette.test.tsx`

- [ ] **Step 1: Extend the command palette tests with the stronger trigger and overlay expectations**

```tsx
// spec-driven-docs-viewer/tests/client/WorkspaceCommandPalette.test.tsx
test("uses a taller search trigger and stronger overlay surface", async () => {
  const user = userEvent.setup()
  const workspace = createWorkspacePayload()

  stubResizeObserver()
  stubCommandDomApis()
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(workspace)))
  )

  render(<App />)
  await screen.findByText("Shared Spec Editing")

  const trigger = screen.getByRole("button", {
    name: /jump to feature or packet/i,
  })

  expect(trigger).toHaveClass("tracker-control")
  expect(within(trigger).getByText(/cmd\+k/i)).toHaveClass("tracker-chip")

  await user.click(trigger)

  expect(
    screen
      .getByPlaceholderText("Search features and packets...")
      .closest("[data-slot='command']")
  ).toHaveClass("tracker-overlay-surface")
})
```

- [ ] **Step 2: Run the focused command palette tests to verify they fail**

Run:

```bash
cd spec-driven-docs-viewer
npx vitest run tests/client/WorkspaceCommandPalette.test.tsx
```

Expected: FAIL because the trigger is still the compact outline button and the command surface does not yet expose the new classes.

- [ ] **Step 3: Implement the taller search trigger and stronger palette styling**

```tsx
// spec-driven-docs-viewer/src/client/features/command-palette/WorkspaceCommandPalette.tsx
<Button
  type="button"
  variant="outline"
  size="default"
  className="tracker-control min-w-[18rem] justify-between gap-3 px-3"
>
  <span className="flex min-w-0 items-center gap-2">
    <IconSearch />
    <span className="truncate">Jump to feature or packet</span>
  </span>
  <span aria-hidden="true" className="tracker-chip">
    {shortcutLabel}
  </span>
</Button>

<PopoverContent
  align="start"
  sideOffset={8}
  className="tracker-command-popover tracker-overlay-surface p-0"
>
```

```tsx
// spec-driven-docs-viewer/src/components/ui/command.tsx
<CommandPrimitive
  data-slot="command"
  className={cn(
    "tracker-overlay-surface flex size-full flex-col overflow-hidden rounded-xl bg-popover p-1 text-popover-foreground",
    className
  )}
  {...props}
/>

<InputGroup className="h-10! border border-border bg-background/88 shadow-[inset_0_1px_0_oklch(1_0_0_/_0.45)]">

<CommandPrimitive.Item
  data-slot="command-item"
  className={cn(
    "group/command-item relative flex min-h-9 cursor-default items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-xs/relaxed outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-selected:tracker-accent-surface data-selected:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
    className
  )}
  {...props}
>
```

- [ ] **Step 4: Run the command palette tests to verify they pass**

Run:

```bash
cd spec-driven-docs-viewer
npx vitest run tests/client/WorkspaceCommandPalette.test.tsx
```

Expected: PASS with all command palette tests green.

- [ ] **Step 5: Commit the search and palette task**

```bash
git add spec-driven-docs-viewer/src/client/features/command-palette/WorkspaceCommandPalette.tsx \
  spec-driven-docs-viewer/src/components/ui/command.tsx \
  spec-driven-docs-viewer/tests/client/WorkspaceCommandPalette.test.tsx
git commit -m "style(viewer): strengthen command palette chrome"
```

### Task 3: Strengthen shared primitives for cards, buttons, badges, inputs, and selects

**Files:**
- Create: `spec-driven-docs-viewer/tests/client/ViewerPrimitiveContrast.test.tsx`
- Modify: `spec-driven-docs-viewer/src/components/ui/button.tsx`
- Modify: `spec-driven-docs-viewer/src/components/ui/badge.tsx`
- Modify: `spec-driven-docs-viewer/src/components/ui/input.tsx`
- Modify: `spec-driven-docs-viewer/src/components/ui/select.tsx`
- Modify: `spec-driven-docs-viewer/src/components/ui/card.tsx`
- Modify: `spec-driven-docs-viewer/src/components/ui/empty.tsx`

- [ ] **Step 1: Write the failing primitive contrast tests**

```tsx
// spec-driven-docs-viewer/tests/client/ViewerPrimitiveContrast.test.tsx
import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"

describe("viewer primitive contrast", () => {
  test("uses stronger contrast defaults for outline controls", () => {
    render(
      <>
        <Button variant="outline">Inspect</Button>
        <Badge variant="outline">review-queue</Badge>
        <Input aria-label="Feature search" />
      </>
    )

    expect(screen.getByRole("button", { name: "Inspect" })).toHaveClass("bg-background/88")
    expect(screen.getByText("review-queue")).toHaveClass("border-border/90")
    expect(screen.getByRole("textbox", { name: "Feature search" })).toHaveClass("bg-background/88")
  })

  test("keeps cards and empty states visually separated from their containers", () => {
    render(
      <>
        <Card>
          <CardContent>Packet detail</CardContent>
        </Card>
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Select a packet</EmptyTitle>
            <EmptyDescription>Inspect metadata from here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </>
    )

    expect(screen.getByText("Packet detail").closest("[data-slot='card']")).toHaveClass("ring-border/70")
    expect(screen.getByText("Select a packet").closest("[data-slot='empty']")).toHaveClass("bg-muted/24")
  })
})
```

- [ ] **Step 2: Run the focused primitive test to verify it fails**

Run:

```bash
cd spec-driven-docs-viewer
npx vitest run tests/client/ViewerPrimitiveContrast.test.tsx
```

Expected: FAIL because the current primitives still use the softer pre-refresh borders and backgrounds.

- [ ] **Step 3: Update the shared primitive defaults**

```tsx
// spec-driven-docs-viewer/src/components/ui/button.tsx
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-xs/relaxed font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[inset_0_1px_0_oklch(1_0_0_/_0.28)] hover:bg-primary/92",
        outline:
          "border-border/90 bg-background/88 text-foreground shadow-[inset_0_1px_0_oklch(1_0_0_/_0.45)] hover:border-border hover:bg-secondary/72 hover:text-foreground aria-expanded:bg-secondary/80",
        secondary:
          "border border-border/75 bg-secondary/88 text-secondary-foreground hover:bg-secondary",
      },
    },
  }
)
```

```tsx
// spec-driven-docs-viewer/src/components/ui/badge.tsx
outline:
  "border-border/90 bg-background/88 text-foreground shadow-[inset_0_1px_0_oklch(1_0_0_/_0.45)] [a]:hover:bg-secondary/70 [a]:hover:text-foreground",
secondary:
  "border border-border/75 bg-secondary/82 text-secondary-foreground [a]:hover:bg-secondary",
```

```tsx
// spec-driven-docs-viewer/src/components/ui/input.tsx
className={cn(
  "h-10 w-full min-w-0 rounded-md border border-border/90 bg-background/88 px-3 py-2 text-sm shadow-[inset_0_1px_0_oklch(1_0_0_/_0.45)] transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 md:text-xs/relaxed",
  className
)}
```

```tsx
// spec-driven-docs-viewer/src/components/ui/select.tsx
className={cn(
  "flex w-fit items-center justify-between gap-1.5 rounded-md border border-border/90 bg-background/88 px-3 py-2 text-xs/relaxed whitespace-nowrap shadow-[inset_0_1px_0_oklch(1_0_0_/_0.45)] transition-colors outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-10 data-[size=sm]:h-8",
  className
)}
```

```tsx
// spec-driven-docs-viewer/src/components/ui/card.tsx
className={cn(
  "group/card flex flex-col gap-4 overflow-hidden rounded-lg border border-border/85 bg-card py-4 text-xs/relaxed text-card-foreground ring-1 ring-border/70 shadow-[0_10px_24px_oklch(0.23_0.015_58_/_0.06)] data-[size=sm]:gap-3 data-[size=sm]:py-3",
  className
)}
```

```tsx
// spec-driven-docs-viewer/src/components/ui/empty.tsx
className={cn(
  "flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/85 bg-muted/24 p-6 text-center text-balance",
  className
)}
```

- [ ] **Step 4: Run the primitive contrast test to verify it passes**

Run:

```bash
cd spec-driven-docs-viewer
npx vitest run tests/client/ViewerPrimitiveContrast.test.tsx
```

Expected: PASS with 2 tests passed.

- [ ] **Step 5: Commit the primitive contrast task**

```bash
git add spec-driven-docs-viewer/src/components/ui/button.tsx \
  spec-driven-docs-viewer/src/components/ui/badge.tsx \
  spec-driven-docs-viewer/src/components/ui/input.tsx \
  spec-driven-docs-viewer/src/components/ui/select.tsx \
  spec-driven-docs-viewer/src/components/ui/card.tsx \
  spec-driven-docs-viewer/src/components/ui/empty.tsx \
  spec-driven-docs-viewer/tests/client/ViewerPrimitiveContrast.test.tsx
git commit -m "style(viewer): strengthen shared contrast primitives"
```

### Task 4: Apply accent-surface selection states to feature, packet, and inspector surfaces

**Files:**
- Create: `spec-driven-docs-viewer/tests/client/ViewerSurfaceContrast.test.tsx`
- Modify: `spec-driven-docs-viewer/src/client/features/feature-board/FeatureCard.tsx`
- Modify: `spec-driven-docs-viewer/src/client/features/packet-board/PacketBoard.tsx`
- Modify: `spec-driven-docs-viewer/src/client/features/packet-detail/PacketDetail.tsx`
- Modify: `spec-driven-docs-viewer/src/client/features/feature-inspector/FeatureInspector.tsx`

- [ ] **Step 1: Write the failing surface contrast tests**

```tsx
// spec-driven-docs-viewer/tests/client/ViewerSurfaceContrast.test.tsx
import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"

import { FeatureCard } from "@/client/features/feature-board/FeatureCard"
import { PacketBoard } from "@/client/features/packet-board/PacketBoard"
import { PacketDetail } from "@/client/features/packet-detail/PacketDetail"

describe("viewer surface contrast", () => {
  test("uses accent surfaces for selected feature and packet states", () => {
    const packet = {
      id: "v1-smart-sync-01",
      title: "Presence and Edit Locking",
      feature: "smart-sync",
      version: "v1",
      status: "ready",
      owner: "agent-a",
      path: "versions/v1/iterations/v1-smart-sync-01.md",
    } as const

    render(
      <>
        <FeatureCard
          feature={{
            id: "smart-sync",
            title: "Shared Spec Editing",
            module: "collaboration",
            version: "v1",
            status: "in-progress",
            priority: "high",
            depends_on: [],
            path: "versions/v1/features/smart-sync.md",
            packet_counts: { ready: 1 },
          }}
          selected={true}
          onSelect={vi.fn()}
        />
        <PacketBoard
          packets={[packet]}
          selectedPacketId="v1-smart-sync-01"
          onSelectPacket={vi.fn()}
        />
      </>
    )

    expect(
      screen.getByText("Shared Spec Editing").closest("[data-slot='card']")
    ).toHaveClass("tracker-accent-surface")

    expect(
      screen.getByRole("button", { name: /presence and edit locking/i })
    ).toHaveClass("tracker-accent-surface")
  })

  test("keeps packet detail on a stronger nested surface", () => {
    render(
      <PacketDetail
        packet={{
          id: "v1-smart-sync-01",
          title: "Presence and Edit Locking",
          feature: "smart-sync",
          version: "v1",
          status: "ready",
          owner: "agent-a",
          path: "versions/v1/iterations/v1-smart-sync-01.md",
        }}
        copyState={{
          error: null,
          packetId: null,
          pending: false,
          source: null,
        }}
        onCopyPrompt={vi.fn(async () => undefined)}
      />
    )

    expect(
      screen.getByText("Packet detail").closest("[data-slot='card']")
    ).toHaveClass("tracker-panel-strong")
  })
})
```

- [ ] **Step 2: Run the focused surface test to verify it fails**

Run:

```bash
cd spec-driven-docs-viewer
npx vitest run tests/client/ViewerSurfaceContrast.test.tsx
```

Expected: FAIL because selected states still depend on subtle ring or border changes and packet detail still uses the softer muted panel.

- [ ] **Step 3: Implement stronger selected surfaces in the board and inspector**

```tsx
// spec-driven-docs-viewer/src/client/features/feature-board/FeatureCard.tsx
<Card
  size="sm"
  className={cn(
    "h-full gap-3 border border-border/85 bg-card transition hover:border-border hover:bg-card",
    selected
      ? "tracker-accent-surface ring-2 ring-primary/35 ring-offset-2 ring-offset-background"
      : "shadow-[0_10px_20px_oklch(0.23_0.015_58_/_0.04)]"
  )}
>
```

```tsx
// spec-driven-docs-viewer/src/client/features/packet-board/PacketBoard.tsx
<Card key={status} size="sm" className="tracker-panel bg-secondary/38">

<Button
  key={packet.id}
  type="button"
  variant="outline"
  aria-pressed={selectedPacketId === packet.id}
  className={cn(
    "h-auto items-start justify-start border-border/85 px-3 py-3 text-left",
    selectedPacketId === packet.id
      ? "tracker-accent-surface"
      : "bg-background/86 hover:bg-secondary/64"
  )}
  onClick={() => onSelectPacket(packet)}
>
```

```tsx
// spec-driven-docs-viewer/src/client/features/packet-detail/PacketDetail.tsx
<Card size="sm" className="tracker-panel tracker-panel-strong">
```

```tsx
// spec-driven-docs-viewer/src/client/features/feature-inspector/FeatureInspector.tsx
<SheetContent
  side="right"
  className="tracker-sheet-content tracker-overlay-surface overflow-y-auto p-0 data-[side=right]:w-[min(72rem,calc(100vw-2rem))] data-[side=right]:sm:max-w-none"
>

<Card size="sm" className="tracker-panel bg-secondary/34">
```

- [ ] **Step 4: Run the focused test, then the full viewer suite and typecheck**

Run:

```bash
cd spec-driven-docs-viewer
npx vitest run tests/client/ViewerSurfaceContrast.test.tsx
npm test
npm run check
```

Expected:

- `tests/client/ViewerSurfaceContrast.test.tsx`: PASS
- `npm test`: PASS with the full Vitest suite green
- `npm run check`: PASS with no TypeScript errors

- [ ] **Step 5: Commit the feature surface task**

```bash
git add spec-driven-docs-viewer/src/client/features/feature-board/FeatureCard.tsx \
  spec-driven-docs-viewer/src/client/features/packet-board/PacketBoard.tsx \
  spec-driven-docs-viewer/src/client/features/packet-detail/PacketDetail.tsx \
  spec-driven-docs-viewer/src/client/features/feature-inspector/FeatureInspector.tsx \
  spec-driven-docs-viewer/tests/client/ViewerSurfaceContrast.test.tsx
git commit -m "style(viewer): apply accent surfaces across board and inspector"
```

## Manual verification checklist

- Open the viewer and confirm the page field, header, summary cards, board, and inspector read as distinct layers.
- Confirm the global search trigger is visibly taller and the `Cmd+K` chip reads as an inset badge rather than part of the outer border.
- Confirm selected feature cards and selected packet rows read as active immediately, without relying on a subtle ring alone.
- Confirm the accent color appears only on primary actions, focus states, selected surfaces, and active command palette rows.
- Confirm the interface still feels warm and `Stone`-based rather than drifting into a generic gray dashboard.

## Spec coverage self-review

- `Goal` and `Visual system`: covered by Task 1 token updates and Task 3 primitive updates.
- `Global search trigger` and `Command palette popover`: covered by Task 2.
- `Header and workspace shell`, `summary`, and `source switcher`: covered by Task 1.
- `Badges, text, and controls`: covered by Task 3.
- `Feature cards`, `packet rows`, `packet detail`, and `inspector sheet`: covered by Task 4.
- `Testing and verification`: covered by focused Vitest additions in every task plus the full `npm test` and `npm run check` run in Task 4.

No spec gaps remain, and the plan keeps the work limited to visual hierarchy without changing runtime behavior or data contracts.
