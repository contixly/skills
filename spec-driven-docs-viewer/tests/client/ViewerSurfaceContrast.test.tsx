import "@testing-library/jest-dom/vitest"
import React from "react"
import { render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, test, vi } from "vitest"

import { FeatureBoard } from "@/client/features/feature-board/FeatureBoard"
import { FeatureCard } from "@/client/features/feature-board/FeatureCard"
import { FeatureInspector } from "@/client/features/feature-inspector/FeatureInspector"
import { PacketBoard } from "@/client/features/packet-board/PacketBoard"
import { PacketDetail } from "@/client/features/packet-detail/PacketDetail"
import type { FeatureRecord, PacketRecord } from "@/shared/contracts"

function createFeature(): FeatureRecord {
  return {
    id: "smart-sync",
    title: "Shared Spec Editing",
    module: "collaboration",
    version: "v1",
    status: "in-progress",
    priority: "high",
    depends_on: ["realtime-foundation"],
    path: "versions/v1/features/smart-sync.md",
    packet_counts: { ready: 1 },
  }
}

function createPacket(): PacketRecord {
  return {
    id: "v1-smart-sync-01",
    title: "Presence and Edit Locking",
    feature: "smart-sync",
    version: "v1",
    status: "ready",
    owner: "agent-a",
    path: "versions/v1/iterations/v1-smart-sync-01.md",
  }
}

function createPacketVariant(
  overrides: Partial<PacketRecord> = {}
): PacketRecord {
  return {
    ...createPacket(),
    ...overrides,
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

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("viewer surface contrast", () => {
  test("applies accent-surface only to selected feature cards", () => {
    const feature = createFeature()

    render(
      <>
        <FeatureCard
          feature={feature}
          onSelect={() => undefined}
          selected={false}
        />
        <FeatureCard feature={feature} onSelect={() => undefined} selected />
      </>
    )

    const cards = screen
      .getAllByRole("button", { name: /shared spec editing/i })
      .map((button) => button.querySelector("[data-slot='card']"))

    expect(cards[0]).not.toHaveClass("tracker-accent-surface")
    expect(
      cards[1]
    ).toHaveClass("tracker-accent-surface")
  })

  test("gives feature id, version, and module distinct badge treatments", () => {
    const feature = createFeature()

    const { container } = render(
      <FeatureCard feature={feature} onSelect={() => undefined} selected={false} />
    )

    const cardButton =
      within(container).getAllByRole("button", { name: /shared spec editing/i })[0]

    expect(
      within(cardButton).getByText("smart-sync", { selector: "[data-slot='badge']" })
    ).toHaveClass("font-mono", "tracking-[0.08em]")
    expect(
      within(cardButton).getByText("V1", { selector: "[data-slot='badge']" })
    ).toHaveClass("font-semibold", "uppercase", "border-transparent")
    expect(
      within(cardButton).getByText("collaboration", {
        selector: "[data-slot='badge']",
      })
    ).toHaveClass("bg-muted/65", "text-muted-foreground", "border-transparent")
  })

  test("sorts lane cards with unblocked high-priority features first", () => {
    stubResizeObserver()
    const feature = createFeature()

    const { container } = render(
      <FeatureBoard
        error={null}
        features={[
          {
            ...feature,
            id: "blocked-high",
            title: "Blocked High",
            status: "planned",
            priority: "high",
            depends_on: ["dep-a"],
          },
          {
            ...feature,
            id: "free-medium",
            title: "Free Medium",
            status: "planned",
            priority: "medium",
            depends_on: [],
          },
          {
            ...feature,
            id: "free-high",
            title: "Free High",
            status: "planned",
            priority: "high",
            depends_on: [],
          },
          {
            ...feature,
            id: "blocked-low",
            title: "Blocked Low",
            status: "planned",
            priority: "low",
            depends_on: ["dep-b"],
          },
        ]}
        isLoading={false}
        selectedFeatureId={null}
        onSelectFeature={() => undefined}
      />
    )

    const plannedLane = within(container)
      .getByRole("heading", { name: "planned" })
      .closest("section")

    expect(plannedLane).not.toBeNull()
    expect(
      within(plannedLane as HTMLElement)
        .getAllByRole("button")
        .map((button) => button.textContent)
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Free High"),
        expect.stringContaining("Free Medium"),
        expect.stringContaining("Blocked High"),
        expect.stringContaining("Blocked Low"),
      ])
    )
    expect(
      within(plannedLane as HTMLElement)
        .getAllByRole("button")
        .map((button) => button.textContent?.includes("Free High"))
        .indexOf(true)
    ).toBe(0)
    expect(
      within(plannedLane as HTMLElement)
        .getAllByRole("button")
        .map((button) => button.textContent?.includes("Free Medium"))
        .indexOf(true)
    ).toBe(1)
  })

  test("highlights only the HIGH priority word in the feature footer", () => {
    const feature = createFeature()

    const { container } = render(
      <FeatureCard feature={feature} onSelect={() => undefined} selected={false} />
    )

    const cardButton =
      within(container).getAllByRole("button", { name: /shared spec editing/i })[0]
    const highWord = within(cardButton).getByText("high", { exact: false })

    expect(highWord).toHaveClass("text-[oklch(0.52_0.14_28)]", "font-semibold")
    expect(highWord.parentElement?.parentElement).toHaveTextContent("Priority HIGH")
  })

  test("uses pastel status accents for board columns and feature status badges", () => {
    const feature = createFeature()
    stubResizeObserver()

    const { container } = render(
      <>
        <FeatureBoard
          error={null}
          features={[
            {
              ...feature,
              id: "planned-feature",
              status: "planned",
              title: "Planned Feature",
            },
          ]}
          isLoading={false}
          selectedFeatureId={null}
          onSelectFeature={() => undefined}
        />
        <FeatureCard feature={feature} onSelect={() => undefined} selected={false} />
      </>
    )

    const plannedColumn = within(container)
      .getByRole("heading", { name: "planned" })
      .closest("header")
    const plannedDot = plannedColumn?.querySelector("span[aria-hidden='true']")

    expect(plannedColumn).not.toBeNull()
    expect(plannedDot).not.toBeNull()
    expect(plannedDot).toHaveClass("bg-[oklch(0.78_0.04_82)]")

    const featureCard = within(container)
      .getByRole("button", { name: /shared spec editing/i })
      .querySelector("[data-slot='card']")

    expect(featureCard).not.toBeNull()
    expect(
      within(featureCard as HTMLElement).getByText("in progress", {
        selector: "[data-slot='badge']",
      })
    ).toHaveClass(
      "border-[oklch(0.74_0.03_230)]",
      "bg-[oklch(0.94_0.015_230)]",
      "text-[oklch(0.4_0.03_230)]"
    )
  })

  test("uses lightweight column dividers instead of boxed lane cards", () => {
    const feature = createFeature()
    stubResizeObserver()

    const { container } = render(
      <FeatureBoard
        error={null}
        features={[
          {
            ...feature,
            id: "planned-feature",
            status: "planned",
            title: "Planned Feature",
          },
          {
            ...feature,
            id: "ready-feature",
            status: "ready",
            title: "Ready Feature",
          },
        ]}
        isLoading={false}
        selectedFeatureId={null}
        onSelectFeature={() => undefined}
      />
    )

    const boardWithin = within(container)
    const plannedLane = boardWithin
      .getByRole("heading", { name: "planned" })
      .closest("section")
    const readyLane = boardWithin
      .getByRole("heading", { name: "ready" })
      .closest("section")

    expect(plannedLane).not.toBeNull()
    expect(readyLane).not.toBeNull()
    expect(plannedLane).not.toHaveClass("rounded-lg", "border", "bg-muted/15")
    expect(readyLane).toHaveClass("border-l", "border-border/60")
  })

  test("caps board lane width so sparse status sets do not stretch cards", () => {
    const feature = createFeature()
    stubResizeObserver()

    const { container } = render(
      <FeatureBoard
        error={null}
        features={[
          {
            ...feature,
            id: "planned-feature",
            status: "planned",
            title: "Planned Feature",
          },
          {
            ...feature,
            id: "ready-feature",
            status: "ready",
            title: "Ready Feature",
          },
        ]}
        isLoading={false}
        selectedFeatureId={null}
        onSelectFeature={() => undefined}
      />
    )

    const boardWithin = within(container)
    const plannedLane = boardWithin
      .getByRole("heading", { name: "planned" })
      .closest("section")
    const readyLane = boardWithin
      .getByRole("heading", { name: "ready" })
      .closest("section")

    expect(plannedLane).not.toBeNull()
    expect(readyLane).not.toBeNull()
    expect(plannedLane).toHaveClass("flex-none", "w-[18rem]", "max-w-[18rem]")
    expect(readyLane).toHaveClass("flex-none", "w-[18rem]", "max-w-[18rem]")
  })

  test("renders a horizontal scrollbar for wide feature boards", () => {
    const feature = createFeature()
    stubResizeObserver()

    const { container } = render(
      <FeatureBoard
        error={null}
        features={[
          { ...feature, id: "planned-feature", status: "planned", title: "Planned Feature" },
          { ...feature, id: "ready-feature", status: "ready", title: "Ready Feature" },
          { ...feature, id: "progress-feature", status: "in-progress", title: "In Progress Feature" },
          { ...feature, id: "blocked-feature", status: "blocked", title: "Blocked Feature" },
          { ...feature, id: "done-feature", status: "done", title: "Done Feature" },
        ]}
        isLoading={false}
        selectedFeatureId={null}
        onSelectFeature={() => undefined}
      />
    )

    expect(
      container.querySelector(
        '[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]'
      )
    ).not.toBeNull()
  })

  test("keeps packet selection accent-surface scoped to the selected packet", () => {
    const selectedPacket = createPacket()
    const unselectedPacket = createPacketVariant({
      id: "v1-smart-sync-02",
      title: "Conflict Resolution HUD",
      owner: "agent-b",
    })

    render(
      <PacketBoard
        packets={[selectedPacket, unselectedPacket]}
        selectedPacketId={selectedPacket.id}
        onSelectPacket={() => undefined}
      />
    )

    expect(
      screen.getByRole("button", { name: /conflict resolution hud/i })
    ).not.toHaveClass("tracker-accent-surface")
    expect(
      screen.getByRole("button", { name: /presence and edit locking/i })
    ).toHaveClass("tracker-accent-surface")
  })

  test("uses stronger panel treatment for packet group cards and packet detail", () => {
    const packet = createPacket()

    const { container } = render(
      <>
        <PacketBoard
          packets={[packet]}
          selectedPacketId={packet.id}
          onSelectPacket={() => undefined}
        />
        <PacketDetail
          copyState={{
            error: null,
            packetId: null,
            pending: false,
            source: null,
          }}
          packet={packet}
          onCopyPrompt={async () => undefined}
        />
      </>
    )

    expect(
      container.querySelector("section[aria-label='Packet board'] [data-slot='card']")
    ).toHaveClass("tracker-panel-strong")
    expect(
      screen.getByText("Packet detail").closest("[data-slot='card']")
    ).toHaveClass("tracker-panel-strong")
  })

  test("uses stronger overlay and summary surfaces inside the feature inspector", () => {
    const feature = createFeature()
    const packet = createPacket()

    render(
      <FeatureInspector
        copyState={{
          error: null,
          packetId: null,
          pending: false,
          source: null,
        }}
        error={null}
        feature={feature}
        isLoading={false}
        onCopyPrompt={async () => undefined}
        onOpenChange={() => undefined}
        onSelectPacket={() => undefined}
        open
        packets={[packet]}
        selectedPacket={packet}
        selectedPacketId={packet.id}
      />
    )

    expect(
      screen.getByText("Detail surface").closest("[data-slot='sheet-content']")
    ).toHaveClass("tracker-overlay-surface")
    expect(
      screen.getByText("Depends on realtime-foundation")
    ).toBeInTheDocument()

    const header = screen.getByText("Detail surface").closest("[data-slot='sheet-header']")

    expect(header).toBeTruthy()
    expect(
      within(header as HTMLElement).getByText("smart-sync", {
        selector: "[data-slot='badge']",
      })
    ).toHaveClass("font-mono", "tracking-[0.08em]")
    expect(
      within(header as HTMLElement).getByText("V1", {
        selector: "[data-slot='badge']",
      })
    ).toHaveClass("font-semibold", "uppercase", "border-transparent")
    expect(
      within(header as HTMLElement).getByText("collaboration", {
        selector: "[data-slot='badge']",
      })
    ).toHaveClass("bg-muted/65", "text-muted-foreground", "border-transparent")
    expect(
      within(header as HTMLElement).getByText("HIGH")
    ).toHaveClass("font-semibold")
    expect(
      within(header as HTMLElement).getByText("HIGH").closest("[data-slot='badge']")
    ).toBeTruthy()
    expect(
      screen.getByText("Depends on realtime-foundation").closest("[data-slot='card']")
    ).toBeNull()
  })
})
