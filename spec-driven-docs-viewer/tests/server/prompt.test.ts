import { afterEach, describe, expect, test, vi } from "vitest"
import { loadWorkspaceDocs } from "@/server/workspace/docs-loader"
import { fixturePath } from "../../src/test/fixture-path"

const runtimeMeta = {
  mode: "runtime" as const,
  revision: 1,
  source: {
    id: "workspace",
    kind: "workspace" as const,
    label: "Workspace",
  },
}

async function importPromptModule() {
  return await import("@/server/workspace/prompt")
}

describe("buildPromptPayload", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  test("returns the implementation prompt from packet metadata when present", async () => {
    const workspaceRoot = fixturePath("basic")
    const workspace = await loadWorkspaceDocs({
      workspaceRoot,
      ...runtimeMeta,
    })
    const { buildPromptPayload } = await importPromptModule()

    const payload = await buildPromptPayload({
      workspaceRoot,
      workspace,
      packetId: "v1-smart-sync-01",
    })

    expect(payload.source).toBe("packet")
    expect(payload.prompt).toBe(
      "Use the relevant skills to implement packet v1-smart-sync-01 (Presence and Edit Locking) by following the task intent in docs/versions/v1/iterations/v1-smart-sync-01.md. Start by reading docs/versions/v1/features/smart-sync.md and docs/versions/v1/iterations/v1-smart-sync-01.md. Implement only this packet for feature smart-sync. Do not expand scope beyond the packet.",
    )
  })

  test("generates a fallback prompt when packet metadata has no implementation prompt", async () => {
    const workspaceRoot = fixturePath("basic")
    const workspace = await loadWorkspaceDocs({
      workspaceRoot,
      ...runtimeMeta,
    })
    const { buildPromptPayload } = await importPromptModule()

    const payload = await buildPromptPayload({
      workspaceRoot,
      workspace,
      packetId: "review-queue-01",
    })

    expect(payload.source).toBe("generated")
    expect(payload.prompt).toBe(
      "Use the relevant skills to implement packet review-queue-01 (Review Inbox Triage) by following the task intent in docs/versions/mvp/iterations/review-queue-01.md. Start by reading docs/versions/mvp/features/review-queue.md and docs/versions/mvp/iterations/review-queue-01.md. Implement only this packet for feature review-queue. Do not expand scope beyond the packet.",
    )
  })
})
