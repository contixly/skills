import { cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, test, vi } from "vitest"
import { createWorkspaceStore, isWatchedWorkspaceInput } from "@/server/workspace/workspace-store"
import { fixturePath } from "../../src/test/fixture-path"

async function copyFixture(name: string): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "viewer-store-"))
  await cp(fixturePath(name), root, { recursive: true })
  return root
}

async function waitFor(assertion: () => void | Promise<void>, timeoutMs = 3000): Promise<void> {
  const start = Date.now()

  while (true) {
    try {
      await assertion()
      return
    } catch (error) {
      if (Date.now() - start >= timeoutMs) {
        throw error
      }

      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }
}

describe("createWorkspaceStore", () => {
  const roots: string[] = []

  afterEach(async () => {
    await Promise.all(roots.map((root) => rm(root, { recursive: true, force: true })))
    vi.doUnmock("@/server/workspace/docs-loader")
    vi.doUnmock("node:fs")
    vi.restoreAllMocks()
    vi.resetModules()
  })

  test("increments revision and notifies listeners after successful reload", async () => {
    const root = await copyFixture("basic")
    roots.push(root)

    const store = await createWorkspaceStore({
      mode: "runtime",
      workspaceRoot: root,
      source: {
        id: "workspace",
        kind: "workspace",
        label: "Workspace",
      },
    })

    let notifications = 0
    const unsubscribe = store.subscribe(() => {
      notifications += 1
    })

    const before = store.getSnapshot().meta.revision
    await writeFile(
      path.join(root, "docs", "_meta", "delivery-state.json"),
      JSON.stringify({
        branch: "feature/live-refresh",
        updated_at: "2026-04-15",
        implemented_versions: ["mvp"],
        in_progress_features: ["smart-sync"],
        ready_packets: ["v1-smart-sync-01"],
        path: "current-state.md",
        generated_from: "docs",
      }),
      "utf-8",
    )

    await store.reload("manual")

    expect(store.getSnapshot().meta.revision).toBe(before + 1)
    expect(store.getSnapshot().delivery.branch).toBe("feature/live-refresh")
    expect(notifications).toBe(1)

    unsubscribe()
    await store.close()
  })

  test("keeps the last valid snapshot active when reload fails", async () => {
    const root = await copyFixture("basic")
    roots.push(root)

    const store = await createWorkspaceStore({
      mode: "runtime",
      workspaceRoot: root,
      source: {
        id: "workspace",
        kind: "workspace",
        label: "Workspace",
      },
    })
    let notifications = 0
    const unsubscribe = store.subscribe(() => {
      notifications += 1
    })

    const before = store.getSnapshot()
    await writeFile(path.join(root, "docs", "_meta", "feature-index.json"), "{broken json", "utf-8")

    const reloadError = await store.reload("manual").catch((error: unknown) => error)

    expect(reloadError).toBeInstanceOf(Error)
    expect(store.getSnapshot().features).toEqual(before.features)
    expect(store.getSnapshot().delivery).toEqual(before.delivery)
    expect(store.getSnapshot().meta.revision).toBe(before.meta.revision)
    expect(store.getSnapshot().health.level).toBe("error")
    expect(store.getSnapshot().health.messages[0]).toBe((reloadError as Error).message)
    expect(notifications).toBe(1)

    unsubscribe()
    await store.close()
  })

  test("skips versions that do not have an iterations directory", async () => {
    const root = await copyFixture("basic")
    roots.push(root)
    await mkdir(path.join(root, "docs", "versions", "v2"), { recursive: true })

    const store = await createWorkspaceStore({
      mode: "runtime",
      workspaceRoot: root,
      source: {
        id: "workspace",
        kind: "workspace",
        label: "Workspace",
      },
    })

    expect(store.getSnapshot().meta.revision).toBe(1)

    await store.close()
  })

  test("reloads when a matching iteration markdown path appears after startup", async () => {
    const root = await copyFixture("basic")
    roots.push(root)

    const store = await createWorkspaceStore({
      mode: "runtime",
      workspaceRoot: root,
      source: {
        id: "workspace",
        kind: "workspace",
        label: "Workspace",
      },
    })

    await mkdir(path.join(root, "docs", "versions", "v2"), { recursive: true })
    await waitFor(async () => {
      await mkdir(path.join(root, "docs", "versions", "v2", "iterations"), { recursive: true })
    })
    await writeFile(
      path.join(root, "docs", "versions", "v2", "iterations", "v2-new-packet.md"),
      "# Packet: New Packet\n",
      "utf-8",
    )

    await waitFor(() => {
      expect(store.getSnapshot().meta.revision).toBeGreaterThan(1)
      expect(store.getSnapshot().health.level).toBe("warning")
    })

    await store.close()
  })

  test("serializes concurrent reloads to preserve revision ordering", async () => {
    let resolveFirstReload!: () => void
    const firstReloadGate = new Promise<void>((resolve) => {
      resolveFirstReload = resolve
    })
    const loaderCalls: number[] = []

    vi.doMock("@/server/workspace/docs-loader", () => ({
      loadWorkspaceDocs: vi.fn(async (args: {
        mode: "runtime" | "dev"
        revision: number
        source: { id: string; kind: "fixture" | "workspace"; label: string }
      }) => {
        loaderCalls.push(args.revision)

        if (args.revision === 2) {
          await firstReloadGate
        }

        return {
          features: [],
          packets: [],
          packetsByFeature: {},
          delivery: {
            branch:
              args.revision === 1 ? "initial" : args.revision === 2 ? "first-reload" : "second-reload",
            updated_at: "2026-04-15",
            implemented_versions: [],
            in_progress_features: [],
            ready_packets: [],
            path: "current-state.md",
            generated_from: "docs",
          },
          health: {
            level: "ok" as const,
            messages: [],
          },
          meta: {
            mode: args.mode,
            revision: args.revision,
            source: args.source,
          },
        }
      }),
    }))

    vi.resetModules()
    const { createWorkspaceStore: createMockedWorkspaceStore } = await import(
      "@/server/workspace/workspace-store"
    )
    const store = await createMockedWorkspaceStore({
      mode: "runtime",
      workspaceRoot: fixturePath("basic"),
      source: {
        id: "workspace",
        kind: "workspace",
        label: "Workspace",
      },
    })

    const firstReload = store.reload("manual")
    const secondReload = store.reload("manual")
    await Promise.resolve()

    expect(loaderCalls).toEqual([1, 2])

    resolveFirstReload()
    await Promise.all([firstReload, secondReload])

    expect(loaderCalls).toEqual([1, 2, 3])
    expect(store.getSnapshot().meta.revision).toBe(3)
    expect(store.getSnapshot().delivery.branch).toBe("second-reload")

    await store.close()
  })
})

describe("isWatchedWorkspaceInput", () => {
  test("matches only docs contract inputs", () => {
    expect(isWatchedWorkspaceInput("_meta/delivery-state.json")).toBe(true)
    expect(isWatchedWorkspaceInput("versions/v1/iterations/v1-smart-sync-01.md")).toBe(true)

    expect(isWatchedWorkspaceInput("_meta/notes.txt")).toBe(false)
    expect(isWatchedWorkspaceInput("versions/v1/README.md")).toBe(false)
    expect(isWatchedWorkspaceInput("versions/v1/features/smart-sync.md")).toBe(false)
    expect(isWatchedWorkspaceInput("modules/onboarding.md")).toBe(false)
  })
})

describe("createWorkspaceStore shutdown", () => {
  afterEach(() => {
    vi.doUnmock("@/server/workspace/docs-loader")
    vi.restoreAllMocks()
    vi.resetModules()
  })

  test("close waits for queued reload work and prevents post-close snapshot changes", async () => {
    let resolveFirstReload!: () => void
    const firstReloadGate = new Promise<void>((resolve) => {
      resolveFirstReload = resolve
    })
    const loaderCalls: number[] = []

    vi.doMock("@/server/workspace/docs-loader", () => ({
      loadWorkspaceDocs: vi.fn(async (args: {
        mode: "runtime" | "dev"
        revision: number
        source: { id: string; kind: "fixture" | "workspace"; label: string }
      }) => {
        loaderCalls.push(args.revision)

        if (args.revision === 2) {
          await firstReloadGate
        }

        return {
          features: [],
          packets: [],
          packetsByFeature: {},
          delivery: {
            branch: args.revision === 1 ? "initial" : `reload-${args.revision}`,
            updated_at: "2026-04-15",
            implemented_versions: [],
            in_progress_features: [],
            ready_packets: [],
            path: "current-state.md",
            generated_from: "docs",
          },
          health: {
            level: "ok" as const,
            messages: [],
          },
          meta: {
            mode: args.mode,
            revision: args.revision,
            source: args.source,
          },
        }
      }),
    }))

    const { createWorkspaceStore: createMockedWorkspaceStore } = await import(
      "@/server/workspace/workspace-store"
    )
    const store = await createMockedWorkspaceStore({
      mode: "runtime",
      workspaceRoot: fixturePath("basic"),
      source: {
        id: "workspace",
        kind: "workspace",
        label: "Workspace",
      },
    })

    const initialSnapshot = store.getSnapshot()
    const firstReload = store.reload("manual")
    const secondReload = store.reload("manual")
    await Promise.resolve()

    let closeResolved = false
    const closePromise = store.close().then(() => {
      closeResolved = true
    })

    await Promise.resolve()
    expect(closeResolved).toBe(false)
    expect(loaderCalls).toEqual([1, 2])

    resolveFirstReload()
    await closePromise
    await Promise.all([firstReload, secondReload])

    expect(closeResolved).toBe(true)
    expect(loaderCalls).toEqual([1, 2])
    expect(store.getSnapshot()).toEqual(initialSnapshot)
  })
})
