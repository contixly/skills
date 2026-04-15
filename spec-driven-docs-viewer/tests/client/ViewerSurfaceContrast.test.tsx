import "@testing-library/jest-dom/vitest"
import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

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
      screen
        .getByText("Depends on realtime-foundation")
        .closest("[data-slot='card']")
    ).toHaveClass("tracker-panel-strong")
  })
})
