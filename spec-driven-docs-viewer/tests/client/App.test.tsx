import "@testing-library/jest-dom/vitest"
import React from "react"
import { act, cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, test, vi } from "vitest"

import { App } from "@/client/app/App"
import type { WorkspaceDocs } from "@/shared/contracts"

function createWorkspacePayload(args?: {
  availableSources?: WorkspaceDocs["meta"]["availableSources"]
  features?: WorkspaceDocs["features"]
  mode?: WorkspaceDocs["meta"]["mode"]
  packets?: WorkspaceDocs["packets"]
  packetsByFeature?: WorkspaceDocs["packetsByFeature"]
  revision?: number
  source?: WorkspaceDocs["meta"]["source"]
}): WorkspaceDocs {
  return {
    features: args?.features ?? [],
    packets: args?.packets ?? [],
    packetsByFeature: args?.packetsByFeature ?? {},
    delivery: {
      branch: "feature/release-tracker",
      updated_at: "2026-04-17",
      implemented_versions: ["mvp", "v1"],
      in_progress_features: [],
      ready_packets: ["v1-packet-01", "v1-packet-02"],
      path: "current-state.md",
      generated_from: "docs",
    },
    health: { level: "warning", messages: ["Metadata is slightly stale."] },
    meta: {
      mode: args?.mode ?? "runtime",
      revision: args?.revision ?? 42,
      source:
        args?.source ?? {
          id: "workspace",
          kind: "workspace",
          label: "Runtime docs",
        },
      availableSources: args?.availableSources,
    },
  }
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, reject, resolve }
}

function stubResizeObserver() {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  vi.stubGlobal("ResizeObserver", ResizeObserver)
}

function stubPointerCapture() {
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.releasePointerCapture = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
}

class MockEventSource {
  static instances: MockEventSource[] = []

  onerror: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent<string>) => void) | null = null
  readonly url: string
  closed = false

  constructor(url: string | URL) {
    this.url = String(url)
    MockEventSource.instances.push(this)
  }

  emitMessage(data: unknown) {
    this.onmessage?.(new MessageEvent("message", { data: JSON.stringify(data) }))
  }

  close() {
    this.closed = true
  }
}

afterEach(() => {
  cleanup()
  MockEventSource.instances = []
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("App", () => {
  test("shows the workspace summary ribbon", async () => {
    const workspace = createWorkspacePayload()

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(workspace)))
    )

    render(<App />)

    expect(
      await screen.findByLabelText("Workspace summary")
    ).toBeInTheDocument()
    expect(
      await screen.findByText("feature/release-tracker")
    ).toBeInTheDocument()
    expect(screen.getAllByText("Runtime docs").length).toBeGreaterThan(0)
    expect(screen.getByText("REVISION 42")).toBeInTheDocument()
    expect(screen.getByText("HEALTH")).toBeInTheDocument()
    expect(screen.getByText("BRANCH")).toBeInTheDocument()
  })

  test("wraps the board in a dedicated full-height stage after removing the inspector rail", async () => {
    const workspace = createWorkspacePayload({
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
    })

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(workspace)))
    )

    render(<App />)

    await screen.findByText("Shared Spec Editing")

    const boardStage = screen.getByTestId("workspace-board-stage")

    expect(boardStage).toHaveClass("tracker-board-stage")
    expect(boardStage.querySelector('[data-slot="card"]')).not.toBeNull()
  })

  test("shows unavailable shell values when the workspace request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Unavailable", { status: 503 }))
    )

    render(<App />)

    expect(
      (await screen.findAllByText("Workspace request failed with 503")).length
    ).toBeGreaterThan(0)
    expect(screen.getAllByText("UNAVAILABLE").length).toBeGreaterThan(0)
    expect(screen.queryByText("Loading")).not.toBeInTheDocument()
  })

  test("retries after an initial load failure when a later SSE revision arrives", async () => {
    stubResizeObserver()

    const workspace = createWorkspacePayload({
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
      revision: 43,
    })
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("Unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(workspace)))

    vi.stubGlobal("EventSource", MockEventSource as unknown as typeof EventSource)
    vi.stubGlobal("fetch", fetchMock)

    render(<App />)

    await screen.findAllByText("Workspace request failed with 503")

    act(() => {
      MockEventSource.instances[0]?.emitMessage({ revision: 43 })
    })

    expect(await screen.findByText("Shared Spec Editing")).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  test("renders the feature board, drills into packet view, and copies prompt", async () => {
    const user = userEvent.setup()
    const writeText = vi.fn()
    stubResizeObserver()
    const workspace = createWorkspacePayload({
      features: [
        {
          id: "smart-sync",
          title: "Shared Spec Editing",
          module: "collaboration",
          version: "v1",
          status: "in-progress",
          priority: "high",
          depends_on: ["realtime-foundation"],
          path: "versions/v1/features/smart-sync.md",
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
      },
    })
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)

      if (url.endsWith("/api/workspace")) {
        return new Response(JSON.stringify(workspace))
      }

      if (url.endsWith("/api/prompt/v1-smart-sync-01")) {
        return new Response(
          JSON.stringify({
            source: "packet",
            prompt: "Implement packet v1-smart-sync-01 only.",
          })
        )
      }

      return new Response("Not found", { status: 404 })
    })

    vi.stubGlobal("fetch", fetchMock)
    vi.stubGlobal("navigator", {
      clipboard: { writeText },
    })

    render(<App />)

    await screen.findByText("Shared Spec Editing")

    await user.click(
      screen.getByRole("button", { name: /Shared Spec Editing/i })
    )
    await user.click(
      screen.getByRole("button", { name: /Presence and Edit Locking/i })
    )
    await user.click(screen.getByRole("button", { name: "Copy Prompt" }))

    expect(writeText).toHaveBeenCalledWith(
      "Implement packet v1-smart-sync-01 only."
    )
    expect(fetchMock).toHaveBeenCalledWith("/api/prompt/v1-smart-sync-01")
  })

  test("switches dev sources and reloads the workspace snapshot", async () => {
    const user = userEvent.setup()
    stubResizeObserver()
    stubPointerCapture()

    const workspaceA = createWorkspacePayload({
      availableSources: [
        { id: "workspace", kind: "workspace", label: "Runtime docs" },
        { id: "fixture-minimal", kind: "fixture", label: "Minimal fixture" },
      ],
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
      mode: "dev",
    })
    const workspaceB = createWorkspacePayload({
      availableSources: [
        { id: "workspace", kind: "workspace", label: "Runtime docs" },
        { id: "fixture-minimal", kind: "fixture", label: "Minimal fixture" },
      ],
      features: [
        {
          id: "review-queue",
          title: "Review Queue",
          module: "handoff",
          version: "v2",
          status: "ready",
          priority: "medium",
          depends_on: [],
          path: "versions/v2/features/review-queue.md",
          packet_counts: { ready: 1 },
        },
      ],
      mode: "dev",
      revision: 43,
      source: {
        id: "fixture-minimal",
        kind: "fixture",
        label: "Minimal fixture",
      },
    })
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(workspaceA)))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(workspaceB)))

    vi.stubGlobal("fetch", fetchMock)
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn() },
    })

    render(<App />)

    await screen.findByText("Shared Spec Editing")
    await user.click(screen.getByRole("combobox", { name: "Workspace source" }))
    await user.click(screen.getByRole("option", { name: "Minimal fixture" }))

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/dev/source",
      expect.objectContaining({
        body: JSON.stringify({ sourceId: "fixture-minimal" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
    )
    expect(await screen.findByText("Review Queue")).toBeInTheDocument()
    expect(screen.queryByText("Shared Spec Editing")).not.toBeInTheDocument()
  })

  test("keeps the board interactive when a preserved refresh fails", async () => {
    stubResizeObserver()

    const workspace = createWorkspacePayload({
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
    })
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(workspace)))
      .mockResolvedValueOnce(new Response("Unavailable", { status: 503 }))

    vi.stubGlobal("EventSource", MockEventSource as unknown as typeof EventSource)
    vi.stubGlobal("fetch", fetchMock)

    render(<App />)

    await screen.findByRole("button", {
      name: /Shared Spec Editing/i,
    })

    act(() => {
      MockEventSource.instances[0]?.emitMessage({ revision: 43 })
    })

    await screen.findAllByText("Unable to refresh workspace.")
    expect(
      screen.getByRole("button", { name: /Shared Spec Editing/i })
    ).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  test("clears a source switch failure after a later workspace snapshot succeeds", async () => {
    const user = userEvent.setup()
    stubResizeObserver()
    stubPointerCapture()

    const workspaceA = createWorkspacePayload({
      availableSources: [
        { id: "workspace", kind: "workspace", label: "Runtime docs" },
        { id: "fixture-minimal", kind: "fixture", label: "Minimal fixture" },
      ],
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
      mode: "dev",
    })
    const workspaceB = createWorkspacePayload({
      availableSources: [
        { id: "workspace", kind: "workspace", label: "Runtime docs" },
        { id: "fixture-minimal", kind: "fixture", label: "Minimal fixture" },
      ],
      features: [
        {
          id: "review-queue",
          title: "Review Queue",
          module: "handoff",
          version: "v2",
          status: "ready",
          priority: "medium",
          depends_on: [],
          path: "versions/v2/features/review-queue.md",
          packet_counts: { ready: 1 },
        },
      ],
      mode: "dev",
      revision: 43,
      source: {
        id: "fixture-minimal",
        kind: "fixture",
        label: "Minimal fixture",
      },
    })
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(workspaceA)))
      .mockResolvedValueOnce(new Response("Gateway timeout", { status: 504 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(workspaceB)))

    vi.stubGlobal("EventSource", MockEventSource as unknown as typeof EventSource)
    vi.stubGlobal("fetch", fetchMock)
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn() },
    })

    render(<App />)

    await screen.findByText("Shared Spec Editing")
    await user.click(screen.getByRole("combobox", { name: "Workspace source" }))
    await user.click(screen.getByRole("option", { name: "Minimal fixture" }))

    await screen.findByText("SWITCH FAILED")

    act(() => {
      MockEventSource.instances[0]?.emitMessage({ revision: 43 })
    })

    expect(await screen.findByText("Review Queue")).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByText("SWITCH FAILED")).not.toBeInTheDocument()
    })
  })

  test("suppresses the initial SSE bootstrap revision when it matches the loaded snapshot", async () => {
    stubResizeObserver()

    const workspace = createWorkspacePayload({
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
    })
    const initialWorkspace = createDeferred<Response>()
    const fetchMock = vi.fn(() => initialWorkspace.promise)

    vi.stubGlobal("EventSource", MockEventSource as unknown as typeof EventSource)
    vi.stubGlobal("fetch", fetchMock)

    render(<App />)

    expect(fetchMock).toHaveBeenCalledTimes(1)

    act(() => {
      MockEventSource.instances[0]?.emitMessage({ revision: 42 })
    })

    await act(async () => {
      initialWorkspace.resolve(new Response(JSON.stringify(workspace)))
      await initialWorkspace.promise
    })

    expect(await screen.findByText("Shared Spec Editing")).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test("replays the first SSE revision after the initial snapshot resolves when it is newer", async () => {
    stubResizeObserver()

    const workspaceA = createWorkspacePayload({
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
      revision: 42,
    })
    const workspaceB = createWorkspacePayload({
      features: [
        {
          id: "review-queue",
          title: "Review Queue",
          module: "handoff",
          version: "v2",
          status: "ready",
          priority: "medium",
          depends_on: [],
          path: "versions/v2/features/review-queue.md",
          packet_counts: { ready: 1 },
        },
      ],
      revision: 43,
    })
    const initialWorkspace = createDeferred<Response>()
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => initialWorkspace.promise)
      .mockResolvedValueOnce(new Response(JSON.stringify(workspaceB)))

    vi.stubGlobal("EventSource", MockEventSource as unknown as typeof EventSource)
    vi.stubGlobal("fetch", fetchMock)

    render(<App />)

    expect(fetchMock).toHaveBeenCalledTimes(1)

    act(() => {
      MockEventSource.instances[0]?.emitMessage({ revision: 43 })
    })

    await act(async () => {
      initialWorkspace.resolve(new Response(JSON.stringify(workspaceA)))
      await initialWorkspace.promise
    })

    expect(await screen.findByText("Review Queue")).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
