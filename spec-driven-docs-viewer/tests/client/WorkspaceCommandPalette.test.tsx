import "@testing-library/jest-dom/vitest"
import React from "react"
import { cleanup, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, test, vi } from "vitest"

import { App } from "@/client/app/App"
import type { WorkspaceDocs } from "@/shared/contracts"

const originalScrollIntoView = Element.prototype.scrollIntoView

function createWorkspacePayload(): WorkspaceDocs {
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
      {
        id: "review-queue",
        title: "Review Queue",
        module: "handoff",
        version: "v2",
        status: "ready",
        priority: "medium",
        depends_on: ["smart-sync"],
        path: "versions/v2/features/review-queue.md",
        packet_counts: { ready: 1 },
      },
    ],
    packets: [
      {
        id: "v1-smart-sync-01",
        title: "Presence and Edit Locking",
        feature: "smart-sync",
        version: "v1",
        status: "ready",
        owner: "agent-a",
        path: "versions/v1/iterations/v1-smart-sync-01.md",
      },
      {
        id: "v2-review-queue-01",
        title: "Approval Inbox",
        feature: "review-queue",
        version: "v2",
        status: "ready",
        owner: "agent-b",
        path: "versions/v2/iterations/v2-review-queue-01.md",
      },
    ],
    packetsByFeature: {
      "smart-sync": [
        {
          id: "v1-smart-sync-01",
          title: "Presence and Edit Locking",
          feature: "smart-sync",
          version: "v1",
          status: "ready",
          owner: "agent-a",
          path: "versions/v1/iterations/v1-smart-sync-01.md",
        },
      ],
      "review-queue": [
        {
          id: "v2-review-queue-01",
          title: "Approval Inbox",
          feature: "review-queue",
          version: "v2",
          status: "ready",
          owner: "agent-b",
          path: "versions/v2/iterations/v2-review-queue-01.md",
        },
      ],
    },
    delivery: {
      branch: "feature/release-tracker",
      updated_at: "2026-04-17",
      implemented_versions: ["v1", "v2"],
      in_progress_features: ["smart-sync"],
      ready_packets: ["v1-smart-sync-01", "v2-review-queue-01"],
      path: "current-state.md",
      generated_from: "docs",
    },
    health: { level: "ok", messages: [] },
    meta: {
      mode: "runtime",
      revision: 42,
      source: {
        id: "workspace",
        kind: "workspace",
        label: "Runtime docs",
      },
    },
  }
}

function stubResizeObserver() {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  vi.stubGlobal("ResizeObserver", ResizeObserver)
}

function stubCommandDomApis() {
  Element.prototype.scrollIntoView = vi.fn()
}

afterEach(() => {
  cleanup()
  Element.prototype.scrollIntoView = originalScrollIntoView
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("Workspace command palette", () => {
  test("jumps to a packet from the header command palette", async () => {
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

    const shortcutChip = within(trigger).getByText(/cmd\+k|ctrl\+k/i)
    expect(shortcutChip).toHaveClass("tracker-chip", "h-7", "shrink-0", "px-3")

    await user.click(trigger)

    await waitFor(() => {
      const commandSurface = document.querySelector('[data-slot="command"]')
      const popoverSurface = document.querySelector(".tracker-command-popover")

      expect(commandSurface).toBeInTheDocument()
      expect(commandSurface).not.toHaveClass("tracker-overlay-surface")
      expect(popoverSurface).toHaveClass("tracker-overlay-surface")
      expect(document.querySelectorAll(".tracker-overlay-surface")).toHaveLength(
        1
      )
    })

    expect(
      screen.getByText("Features").closest('[data-slot="command-group"]')
    ).toHaveClass(
      "overflow-hidden",
      "p-1",
      "text-foreground",
      "[&_[cmdk-group-heading]]:px-2",
      "[&_[cmdk-group-heading]]:py-1.5",
      "[&_[cmdk-group-heading]]:text-xs",
      "[&_[cmdk-group-heading]]:font-medium",
      "[&_[cmdk-group-heading]]:text-muted-foreground"
    )
    expect(
      screen.getByText("Packets").closest('[data-slot="command-group"]')
    ).toHaveClass(
      "overflow-hidden",
      "p-1",
      "text-foreground",
      "[&_[cmdk-group-heading]]:px-2",
      "[&_[cmdk-group-heading]]:py-1.5",
      "[&_[cmdk-group-heading]]:text-xs",
      "[&_[cmdk-group-heading]]:font-medium",
      "[&_[cmdk-group-heading]]:text-muted-foreground"
    )

    await user.click(screen.getByRole("option", { name: /approval inbox/i }))

    const dialog = await screen.findByRole("dialog", { name: "Review Queue" })

    expect(screen.queryByRole("complementary")).not.toBeInTheDocument()
    expect(within(dialog).getByText("Packet detail")).toBeInTheDocument()
    expect(
      within(dialog).getByRole("button", { name: "Copy Prompt" })
    ).toBeVisible()
  })

  test("opens the palette with the keyboard shortcut", async () => {
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

    await user.keyboard("{Control>}k{/Control}")

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Search features and packets...")).toBeInTheDocument()
    })
  })

  test("ignores the keyboard shortcut when typing in a text field", async () => {
    const user = userEvent.setup()
    const workspace = createWorkspacePayload()

    stubResizeObserver()
    stubCommandDomApis()
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(workspace)))
    )

    render(
      <>
        <input aria-label="workspace filter" />
        <App />
      </>
    )

    await screen.findByText("Shared Spec Editing")

    await user.click(screen.getByRole("textbox", { name: "workspace filter" }))
    await user.keyboard("{Control>}k{/Control}")

    expect(
      screen.queryByPlaceholderText("Search features and packets...")
    ).not.toBeInTheDocument()
  })

  test("opens feature detail in a sheet from the board", async () => {
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

    await user.click(screen.getByRole("button", { name: /shared spec editing/i }))

    const dialog = await screen.findByRole("dialog", {
      name: "Shared Spec Editing",
    })

    expect(screen.queryByRole("complementary")).not.toBeInTheDocument()
    expect(within(dialog).getByText("Select a packet")).toBeInTheDocument()

    await user.click(within(dialog).getByRole("button", { name: "Close" }))

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Shared Spec Editing" })
      ).not.toBeInTheDocument()
    })
  })
})
