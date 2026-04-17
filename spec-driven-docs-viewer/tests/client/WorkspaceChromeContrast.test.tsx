import "@testing-library/jest-dom/vitest"
import React from "react"
import { render, screen, within } from "@testing-library/react"
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
      screen
        .getByText("Runtime snapshot looks consistent.")
        .closest("[data-slot='card']")
    ).toHaveClass("tracker-metric-card")
  })

  test("renders the viewer logo in the workspace header block", () => {
    const workspace = createWorkspace()

    const { container } = render(
      <WorkspaceHeader
        commandPalette={<button type="button">Jump to feature or packet</button>}
        delivery={workspace.delivery}
        health={workspace.health}
        meta={workspace.meta}
        shellState="ready"
        sourceSwitcher={<div>Runtime docs</div>}
      />
    )

    const headerCard = container.querySelector("[data-slot='card']")

    expect(headerCard).not.toBeNull()
    expect(
      within(headerCard as HTMLElement).getByRole("img", {
        name: "Spec-Driven Docs Viewer logo",
      })
    ).toHaveAttribute("src", "/logo.svg")
  })

  test("aligns updated and source metadata to the same baseline with matching type scale", () => {
    const workspace = createWorkspace()

    const { container } = render(
      <WorkspaceHeader
        commandPalette={<button type="button">Jump to feature or packet</button>}
        delivery={workspace.delivery}
        health={workspace.health}
        meta={workspace.meta}
        shellState="ready"
        sourceSwitcher={<div>Runtime docs</div>}
      />
    )

    const headerCard = container.querySelector("[data-slot='card']")
    const headerWithin = within(headerCard as HTMLElement)
    const updatedRow = headerWithin.getByText("Updated").closest("div")
    const sourceRow = headerWithin.getByText("Source").closest("div")

    expect(headerCard).not.toBeNull()
    expect(updatedRow).toHaveClass("items-end")
    expect(sourceRow).toHaveClass("items-end")
    expect(headerWithin.getByText("Updated")).toHaveClass("text-xs", "leading-none")
    expect(headerWithin.getByText("Source")).toHaveClass("text-xs", "leading-none")
    expect(headerWithin.getByText("2026-04-17")).toHaveClass("text-xs", "leading-none")
    expect(
      headerWithin.getByText("Runtime docs", { selector: "span" })
    ).toHaveClass("text-xs", "leading-none")
  })

  test.each([
    ["ok", "secondary"],
    ["warning", "outline"],
    ["error", "destructive"],
  ])("maps health level %s to %s badge variant in the summary", (level, variant) => {
    const workspace = createWorkspace()
    workspace.health = { level: level as "ok" | "warning" | "error", messages: [] }

    const { container } = render(
      <WorkspaceSummary
        shellState="ready"
        workspace={workspace}
        workspaceError={null}
      />
    )

    const healthCard = within(container)
      .getByText("HEALTH")
      .closest("[data-slot='card']")

    expect(healthCard).not.toBeNull()
    expect(
      within(healthCard as HTMLElement).getByText(level.toUpperCase(), {
        selector: "[data-slot='badge']",
      })
    ).toHaveAttribute("data-variant", variant)
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
