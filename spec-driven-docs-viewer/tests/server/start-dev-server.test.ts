import { afterEach, describe, expect, test, vi } from "vitest"
import { startDevServer } from "@/server/app/start-dev-server"

async function settleVite() {
  await new Promise((resolve) => setTimeout(resolve, 150))
}

async function openEventStream(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/event-stream",
    },
  })

  expect(response.status).toBe(200)
  expect(response.headers.get("content-type")).toContain("text/event-stream")

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error("Expected event stream body")
  }

  const decoder = new TextDecoder()
  let buffer = ""

  return {
    async nextEvent() {
      while (true) {
        const boundary = buffer.indexOf("\n\n")
        if (boundary >= 0) {
          const rawEvent = buffer.slice(0, boundary)
          buffer = buffer.slice(boundary + 2)
          const eventLine = rawEvent.split("\n").find((line) => line.startsWith("event:"))
          const dataLine = rawEvent.split("\n").find((line) => line.startsWith("data:"))

          if (!dataLine) {
            continue
          }

          return {
            event: eventLine ? eventLine.slice("event:".length).trim() : null,
            data: JSON.parse(dataLine.slice("data:".length).trim()) as { revision: number },
          }
        }

        const { done, value } = await reader.read()
        if (done) {
          throw new Error("Event stream closed before emitting an event")
        }

        buffer += decoder.decode(value, { stream: true })
      }
    },
    async close() {
      await reader.cancel()
    },
  }
}

describe("startDevServer", () => {
  const servers: Array<{ close: () => Promise<void> }> = []

  afterEach(async () => {
    await Promise.all(servers.map((server) => server.close()))
    servers.length = 0
    vi.doUnmock("@/server/workspace/workspace-store")
    vi.doUnmock("vite")
    vi.restoreAllMocks()
    vi.resetModules()
  })

  test("serves the app through Vite middleware in dev mode", async () => {
    const server = await startDevServer({
      host: "127.0.0.1",
      port: 0,
      externalWorkspaceRoot: null,
    })
    servers.push(server)

    const response = await fetch(server.url)
    const html = await response.text()

    expect(response.status).toBe(200)
    expect(html).toContain("/@vite/client")
    expect(html).toContain("/src/main.tsx")

    await settleVite()
  })

  test("switches workspace source through the dev api without restarting", async () => {
    const server = await startDevServer({
      host: "127.0.0.1",
      port: 0,
      externalWorkspaceRoot: null,
    })
    servers.push(server)

    const initialWorkspaceResponse = await fetch(`${server.url}/api/workspace`)
    const initialWorkspace = await initialWorkspaceResponse.json()

    const switchResponse = await fetch(`${server.url}/api/dev/source`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sourceId: "empty-or-minimal" }),
    })
    const switchedWorkspaceResponse = await fetch(`${server.url}/api/workspace`)
    const switchedWorkspace = await switchedWorkspaceResponse.json()
    const promptResponse = await fetch(`${server.url}/api/prompt/minimal-packet-01`)
    const promptPayload = await promptResponse.json()

    expect(initialWorkspace.meta.mode).toBe("dev")
    expect(initialWorkspace.meta.source.id).toBe("dense-portfolio")
    expect(initialWorkspace.meta.availableSources.map((source: { id: string }) => source.id)).toEqual([
      "dense-portfolio",
      "stale-and-broken",
      "empty-or-minimal",
    ])
    expect(initialWorkspace.features.length).toBeGreaterThan(0)

    expect(switchResponse.status).toBe(204)
    expect(switchedWorkspace.meta.mode).toBe("dev")
    expect(switchedWorkspace.meta.source.id).toBe("empty-or-minimal")
    expect(switchedWorkspace.features).toHaveLength(1)
    expect(switchedWorkspace.packets).toHaveLength(1)
    expect(switchedWorkspace.packets[0].id).toBe("minimal-packet-01")
    expect(promptResponse.status).toBe(200)
    expect(promptPayload.source).toBe("packet")

    await settleVite()
  })

  test("keeps revisions monotonic across source switches and emits runtime-compatible SSE payloads", async () => {
    const server = await startDevServer({
      host: "127.0.0.1",
      port: 0,
      externalWorkspaceRoot: null,
    })
    servers.push(server)

    const events = await openEventStream(`${server.url}/api/events`)
    const initialWorkspaceResponse = await fetch(`${server.url}/api/workspace`)
    const initialWorkspace = await initialWorkspaceResponse.json()

    await expect(events.nextEvent()).resolves.toEqual({
      event: null,
      data: { revision: 1 },
    })
    expect(initialWorkspace.meta.revision).toBe(1)

    const firstSwitchResponse = await fetch(`${server.url}/api/dev/source`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sourceId: "empty-or-minimal" }),
    })
    const firstSwitchedWorkspaceResponse = await fetch(`${server.url}/api/workspace`)
    const firstSwitchedWorkspace = await firstSwitchedWorkspaceResponse.json()

    expect(firstSwitchResponse.status).toBe(204)
    await expect(events.nextEvent()).resolves.toEqual({
      event: null,
      data: { revision: 2 },
    })
    expect(firstSwitchedWorkspace.meta.revision).toBe(2)

    const secondSwitchResponse = await fetch(`${server.url}/api/dev/source`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sourceId: "dense-portfolio" }),
    })
    const secondSwitchedWorkspaceResponse = await fetch(`${server.url}/api/workspace`)
    const secondSwitchedWorkspace = await secondSwitchedWorkspaceResponse.json()

    expect(secondSwitchResponse.status).toBe(204)
    await expect(events.nextEvent()).resolves.toEqual({
      event: null,
      data: { revision: 3 },
    })
    expect(secondSwitchedWorkspace.meta.revision).toBe(3)
    expect(secondSwitchedWorkspace.meta.source.id).toBe("dense-portfolio")

    await events.close()
    await settleVite()
  })

  test("honors the latest requested source during overlapping swaps", async () => {
    const closeOrder: string[] = []
    const createCalls: string[] = []

    vi.doMock("@/server/workspace/workspace-store", () => ({
      createWorkspaceStore: vi.fn(async (args: {
        source: { id: string; kind: "fixture" | "workspace"; label: string }
      }) => {
        createCalls.push(args.source.id)

        if (args.source.id === "stale-and-broken") {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }

        let listener: (() => void) | null = null

        return {
          getSnapshot() {
            return {
              features: [],
              packets: [],
              packetsByFeature: {},
              delivery: {
                branch: args.source.id,
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
                mode: "dev" as const,
                revision: 1,
                source: args.source,
                availableSources: [],
              },
            }
          },
          reload: vi.fn(),
          subscribe(callback: () => void) {
            listener = callback
            return () => {
              listener = null
            }
          },
          async close() {
            closeOrder.push(args.source.id)
            listener = null
          },
        }
      }),
    }))
    vi.doMock("vite", () => ({
      createServer: vi.fn(async () => ({
        middlewares: (_req: unknown, _res: unknown, next: () => void) => next(),
        transformIndexHtml: vi.fn(async (_url: string, html: string) => html),
        ssrFixStacktrace: vi.fn(),
        close: vi.fn(async () => {}),
      })),
    }))

    const { startDevServer: startMockedDevServer } = await import("@/server/app/start-dev-server")
    const server = await startMockedDevServer({
      host: "127.0.0.1",
      port: 0,
      externalWorkspaceRoot: null,
    })
    servers.push(server)

    const firstSwitch = fetch(`${server.url}/api/dev/source`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sourceId: "stale-and-broken" }),
    })
    const secondSwitch = fetch(`${server.url}/api/dev/source`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sourceId: "dense-portfolio" }),
    })

    const [firstResponse, secondResponse] = await Promise.all([firstSwitch, secondSwitch])
    const workspaceResponse = await fetch(`${server.url}/api/workspace`)
    const workspace = await workspaceResponse.json()

    expect(firstResponse.status).toBe(204)
    expect(secondResponse.status).toBe(204)
    expect(createCalls).toEqual(["dense-portfolio", "stale-and-broken", "dense-portfolio"])
    expect(closeOrder).toEqual(["dense-portfolio", "stale-and-broken"])
    expect(workspace.meta.source.id).toBe("dense-portfolio")
    expect(workspace.meta.revision).toBe(3)
  })
})
