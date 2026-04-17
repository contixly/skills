import { describe, expect, test } from "vitest"
import { loadWorkspaceDocs } from "@/server/workspace/docs-loader"
import { fixturePath } from "../../src/test/fixture-path"

describe("loadWorkspaceDocs", () => {
  test("loads normalized features, packets, and health", async () => {
    const workspace = await loadWorkspaceDocs({
      workspaceRoot: fixturePath("basic"),
      mode: "runtime",
      revision: 1,
      source: { id: "workspace", kind: "workspace", label: "Workspace" },
    })

    expect(workspace.features[0]?.id).toBe("smart-sync")
    expect(workspace.meta.revision).toBe(1)
    expect(workspace.health.level).toBe("ok")
  })

  test("loads features, packets, and delivery state from docs/_meta", async () => {
    const workspace = await loadWorkspaceDocs({
      workspaceRoot: fixturePath("basic"),
      mode: "runtime",
      revision: 7,
      source: {
        id: "workspace",
        kind: "workspace",
        label: "Workspace",
      },
    })

    expect(workspace.features.map((feature) => feature.id)).toEqual([
      "smart-sync",
      "review-queue",
    ])
    expect(workspace.meta).toEqual({
      mode: "runtime",
      revision: 7,
      source: {
        id: "workspace",
        kind: "workspace",
        label: "Workspace",
      },
      availableSources: undefined,
    })
    expect(workspace.health).toEqual({
      level: "ok",
      messages: [],
    })
    expect(workspace.features.find((feature) => feature.id === "smart-sync")?.packet_counts).toEqual(
      {
        ready: 1,
      },
    )
    expect(
      workspace.features.find((feature) => feature.id === "review-queue")?.packet_counts,
    ).toEqual({
      ready: 1,
    })
    expect(workspace.packetsByFeature["smart-sync"].map((packet) => packet.id)).toEqual([
      "v1-smart-sync-01",
    ])
    expect(workspace.packets.find((packet) => packet.id === "v1-smart-sync-01")?.implementation_prompt).toBe(
      "Use the relevant skills to implement packet v1-smart-sync-01 (Presence and Edit Locking) by following the task intent in docs/versions/v1/iterations/v1-smart-sync-01.md. Start by reading docs/versions/v1/features/smart-sync.md and docs/versions/v1/iterations/v1-smart-sync-01.md. Implement only this packet for feature smart-sync. Do not expand scope beyond the packet.",
    )
    expect(workspace.delivery.branch).toBe("feature/spec-docs")
  })

  test("normalizes unknown statuses to unknown instead of dropping records", async () => {
    const workspace = await loadWorkspaceDocs({
      workspaceRoot: fixturePath("unknown-status"),
      mode: "runtime",
      revision: 2,
      source: {
        id: "workspace",
        kind: "workspace",
        label: "Workspace",
      },
    })

    expect(workspace.features[0]?.status).toBe("unknown")
    expect(workspace.packets[0]?.status).toBe("unknown")
    expect(workspace.features[0]?.packet_counts).toEqual({
      unknown: 1,
    })
  })

  test("reports blocking error when docs/_meta is missing", async () => {
    await expect(
      loadWorkspaceDocs({
        workspaceRoot: fixturePath("missing-meta"),
        mode: "runtime",
        revision: 1,
        source: {
          id: "workspace",
          kind: "workspace",
          label: "Workspace",
        },
      }),
    ).rejects.toThrow("Missing docs/_meta")
  })

  test("reports stale-meta warning when packet markdown exists but indexes are incomplete", async () => {
    const workspace = await loadWorkspaceDocs({
      workspaceRoot: fixturePath("stale-meta"),
      mode: "runtime",
      revision: 1,
      source: {
        id: "workspace",
        kind: "workspace",
        label: "Workspace",
      },
    })

    expect(workspace.health.level).toBe("warning")
    expect(workspace.health.messages).toContain(
      "Packet markdown exists but docs/_meta indexes are incomplete or stale.",
    )
  })

  test("reports stale-meta warning when task-board misses a packet that exists on disk", async () => {
    const workspace = await loadWorkspaceDocs({
      workspaceRoot: fixturePath("partial-stale"),
      mode: "runtime",
      revision: 1,
      source: {
        id: "workspace",
        kind: "workspace",
        label: "Workspace",
      },
    })

    expect(workspace.health.level).toBe("warning")
    expect(workspace.health.messages).toContain(
      "Packet markdown exists but docs/_meta indexes are incomplete or stale.",
    )
  })

  test("reports stale-meta warning when packet index entries exist without markdown files", async () => {
    const workspace = await loadWorkspaceDocs({
      workspaceRoot: fixturePath("missing-packet-markdown"),
      mode: "runtime",
      revision: 1,
      source: {
        id: "workspace",
        kind: "workspace",
        label: "Workspace",
      },
    })

    expect(workspace.health.level).toBe("warning")
    expect(workspace.health.messages).toContain(
      "Packet markdown exists but docs/_meta indexes are incomplete or stale.",
    )
  })
})
