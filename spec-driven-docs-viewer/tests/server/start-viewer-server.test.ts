import { cp, mkdtemp, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, test } from "vitest"
import { startViewerServer } from "@/server/app/start-viewer-server"
import { fixturePath } from "../../src/test/fixture-path"

async function copyFixture(name: string): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "viewer-server-"))
  await cp(fixturePath(name), root, { recursive: true })
  return root
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
          const dataLine = rawEvent.split("\n").find((line) => line.startsWith("data:"))

          if (!dataLine) {
            continue
          }

          return JSON.parse(dataLine.slice("data:".length).trim()) as { revision: number }
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

describe("startViewerServer", () => {
  const servers: Array<{ close: () => Promise<void> }> = []
  const roots: string[] = []

  afterEach(async () => {
    await Promise.all(servers.map((server) => server.close()))
    servers.length = 0
    await Promise.all(roots.map((root) => rm(root, { recursive: true, force: true })))
    roots.length = 0
  })

  test("serves workspace data and prompt payloads", async () => {
    const server = await startViewerServer({
      mode: "runtime",
      workspaceRoot: fixturePath("basic"),
      host: "127.0.0.1",
      port: 0,
    })
    servers.push(server)

    const workspaceRes = await fetch(`${server.url}/api/workspace`)
    const workspace = await workspaceRes.json()

    const promptRes = await fetch(`${server.url}/api/prompt/v1-smart-sync-01`)
    const prompt = await promptRes.json()

    expect(workspace.delivery.branch).toBe("feature/spec-docs")
    expect(workspace.meta.mode).toBe("runtime")
    expect(workspace.meta.source).toEqual({
      id: "workspace",
      kind: "workspace",
      label: "Workspace",
    })
    expect(prompt.source).toBe("packet")
  })

  test("returns json for unknown prompt packets", async () => {
    const server = await startViewerServer({
      mode: "runtime",
      workspaceRoot: fixturePath("basic"),
      host: "127.0.0.1",
      port: 0,
    })
    servers.push(server)

    const response = await fetch(`${server.url}/api/prompt/does-not-exist`)
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error).toContain("Unknown packet")
  })

  test("returns json for unknown api routes", async () => {
    const server = await startViewerServer({
      mode: "runtime",
      workspaceRoot: fixturePath("basic"),
      host: "127.0.0.1",
      port: 0,
    })
    servers.push(server)

    const response = await fetch(`${server.url}/api/does-not-exist`)
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error).toBe("Not found")
  })

  test("streams current and updated revisions from the workspace store", async () => {
    const root = await copyFixture("basic")
    roots.push(root)

    const server = await startViewerServer({
      mode: "runtime",
      workspaceRoot: root,
      host: "127.0.0.1",
      port: 0,
    })
    servers.push(server)

    const events = await openEventStream(`${server.url}/api/events`)

    await expect(events.nextEvent()).resolves.toEqual({ revision: 1 })

    await writeFile(
      path.join(root, "docs", "_meta", "delivery-state.json"),
      JSON.stringify({
        branch: "feature/live-events",
        updated_at: "2026-04-15",
        implemented_versions: ["mvp"],
        in_progress_features: [],
        ready_packets: ["v1-smart-sync-01"],
        path: "current-state.md",
        generated_from: "docs",
      }),
      "utf-8",
    )

    await expect(events.nextEvent()).resolves.toEqual({ revision: 2 })

    const workspaceResponse = await fetch(`${server.url}/api/workspace`)
    const workspace = await workspaceResponse.json()

    expect(workspace.meta.revision).toBe(2)
    expect(workspace.delivery.branch).toBe("feature/live-events")

    await events.close()
  })

  test("serves live store snapshots for workspace and prompt routes", async () => {
    const root = await copyFixture("basic")
    roots.push(root)

    const server = await startViewerServer({
      mode: "runtime",
      workspaceRoot: root,
      host: "127.0.0.1",
      port: 0,
    })
    servers.push(server)

    const events = await openEventStream(`${server.url}/api/events`)
    await expect(events.nextEvent()).resolves.toEqual({ revision: 1 })

    const initialPromptResponse = await fetch(`${server.url}/api/prompt/v1-smart-sync-01`)
    expect(initialPromptResponse.status).toBe(200)

    await writeFile(path.join(root, "docs", "_meta", "task-board.json"), JSON.stringify({ tasks: [] }), "utf-8")
    await writeFile(
      path.join(root, "docs", "_meta", "delivery-state.json"),
      JSON.stringify({
        branch: "feature/live-store",
        updated_at: "2026-04-15",
        implemented_versions: ["mvp"],
        in_progress_features: [],
        ready_packets: [],
        path: "current-state.md",
        generated_from: "docs",
      }),
      "utf-8",
    )

    await expect(events.nextEvent()).resolves.toEqual({ revision: 2 })

    const workspaceResponse = await fetch(`${server.url}/api/workspace`)
    const workspace = await workspaceResponse.json()

    expect(workspace.meta.revision).toBe(2)
    expect(workspace.delivery.branch).toBe("feature/live-store")

    const promptResponse = await fetch(`${server.url}/api/prompt/v1-smart-sync-01`)
    const promptBody = await promptResponse.json()

    expect(promptResponse.status).toBe(404)
    expect(promptBody.error).toContain("Unknown packet")

    await events.close()
  })

  test("closes successfully with an active event stream connection", async () => {
    const server = await startViewerServer({
      mode: "runtime",
      workspaceRoot: fixturePath("basic"),
      host: "127.0.0.1",
      port: 0,
    })

    const events = await openEventStream(`${server.url}/api/events`)
    await expect(events.nextEvent()).resolves.toEqual({ revision: 1 })

    await expect(
      Promise.race([
        server.close(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Timed out waiting for server.close()")), 500)
        }),
      ]),
    ).resolves.toBeUndefined()

    await events.close()
  })
})
