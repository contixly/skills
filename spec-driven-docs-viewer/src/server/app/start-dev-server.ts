#!/usr/bin/env node

import express, { type Response } from "express"
import { readFile } from "node:fs/promises"
import type { AddressInfo } from "node:net"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createServer as createViteServer } from "vite"
import type { ViewerSourceDescriptor, WorkspaceDocs } from "../../shared/contracts.js"
import {
  createDevSourceRegistry,
  type DevSourceRecord,
} from "../workspace/dev-source-registry.js"
import { buildPromptPayload } from "../workspace/prompt.js"
import { parseRuntimeOptions } from "../workspace/runtime-options.js"
import { createWorkspaceStore } from "../workspace/workspace-store.js"

const here = path.dirname(fileURLToPath(import.meta.url))
const viewerRoot = path.resolve(here, "../../..")
const indexHtmlPath = path.join(viewerRoot, "index.html")

function toDescriptor(source: DevSourceRecord): ViewerSourceDescriptor {
  return {
    id: source.id,
    kind: source.kind,
    label: source.label,
  }
}

function buildAvailableSources(
  registry: ReturnType<typeof createDevSourceRegistry>,
): ViewerSourceDescriptor[] {
  return registry.list().map(toDescriptor)
}

export async function startDevServer(args: {
  host: string
  port: number
  externalWorkspaceRoot: string | null
}) {
  const registry = createDevSourceRegistry({
    externalWorkspaceRoot: args.externalWorkspaceRoot,
  })
  const availableSources = buildAvailableSources(registry)
  const defaultSource = registry.get("dense-portfolio")

  if (!defaultSource) {
    throw new Error("Missing dense-portfolio fixture")
  }

  let activeSource = defaultSource
  let requestedSourceId = activeSource.id
  let store = await createWorkspaceStore({
    mode: "dev",
    workspaceRoot: activeSource.workspaceRoot,
    source: toDescriptor(activeSource),
    availableSources,
  })
  let projectedRevision = store.getSnapshot().meta.revision
  let switchQueue = Promise.resolve<void>(undefined)
  let isClosing = false

  const app = express()
  const activeEventStreams = new Set<Response>()

  function getProjectedSnapshot(): WorkspaceDocs {
    const snapshot = store.getSnapshot()
    return {
      ...snapshot,
      meta: {
        ...snapshot.meta,
        revision: projectedRevision,
      },
    }
  }

  function writeRevisionEvent(res: Response) {
    if (res.writableEnded || res.destroyed) {
      return
    }

    res.write(`data: ${JSON.stringify({ revision: projectedRevision })}\n\n`)
  }

  function broadcastRevision() {
    for (const res of activeEventStreams) {
      writeRevisionEvent(res)
    }
  }

  function subscribeToStore(currentStore: typeof store) {
    return currentStore.subscribe(() => {
      projectedRevision += 1
      broadcastRevision()
    })
  }

  let unsubscribeFromStore = subscribeToStore(store)

  async function commitSourceSwap(nextSource: DevSourceRecord) {
    if (isClosing || nextSource.id === activeSource.id) {
      return
    }

    const nextStore = await createWorkspaceStore({
      mode: "dev",
      workspaceRoot: nextSource.workspaceRoot,
      source: toDescriptor(nextSource),
      availableSources,
    })
    const previousStore = store
    const previousUnsubscribe = unsubscribeFromStore

    previousUnsubscribe()
    activeSource = nextSource
    store = nextStore
    unsubscribeFromStore = subscribeToStore(nextStore)
    projectedRevision += 1
    broadcastRevision()
    await previousStore.close()
  }

  async function syncToRequestedSource(): Promise<void> {
    while (!isClosing && activeSource.id !== requestedSourceId) {
      const nextSource = registry.get(requestedSourceId)
      if (!nextSource) {
        return
      }

      await commitSourceSwap(nextSource)
    }
  }

  function enqueueSourceSync(): Promise<void> {
    const scheduledSwap = switchQueue.then(() => syncToRequestedSource())
    switchQueue = scheduledSwap.then(
      () => undefined,
      () => undefined,
    )
    return scheduledSwap
  }

  app.use(express.json())

  app.get("/api/workspace", (_req, res) => {
    res.json(getProjectedSnapshot())
  })

  app.get("/api/events", (_req, res) => {
    res.status(200)
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8")
    res.setHeader("Cache-Control", "no-cache, no-transform")
    res.setHeader("Connection", "keep-alive")
    res.flushHeaders()
    activeEventStreams.add(res)
    writeRevisionEvent(res)

    let isTornDown = false
    const teardown = () => {
      if (isTornDown) {
        return
      }

      isTornDown = true
      activeEventStreams.delete(res)
    }

    res.on("close", teardown)
    res.on("error", teardown)
  })

  app.post("/api/dev/source", async (req, res) => {
    const sourceId = req.body?.sourceId
    if (typeof sourceId !== "string" || sourceId.length === 0) {
      res.status(400).json({ error: "Missing sourceId" })
      return
    }

    const nextSource = registry.get(sourceId)
    if (!nextSource) {
      res.status(404).json({ error: `Unknown source: ${sourceId}` })
      return
    }

    requestedSourceId = nextSource.id

    try {
      await enqueueSourceSync()
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to switch source",
      })
      return
    }

    res.status(204).end()
  })

  app.get("/api/prompt/:packetId", async (req, res) => {
    try {
      const payload = await buildPromptPayload({
        workspaceRoot: activeSource.workspaceRoot,
        workspace: getProjectedSnapshot(),
        packetId: req.params.packetId,
      })
      res.json(payload)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal Server Error"
      const status = message.startsWith("Unknown packet: ") ? 404 : 500
      res.status(status).json({ error: message })
    }
  })

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" })
  })

  const vite = await createViteServer({
    root: viewerRoot,
    server: { middlewareMode: true },
    appType: "custom",
  })

  app.use(vite.middlewares)
  app.use("*", async (req, res, next) => {
    try {
      const template = await readFile(indexHtmlPath, "utf-8")
      const html = await vite.transformIndexHtml(req.originalUrl, template)
      res.status(200).setHeader("Content-Type", "text/html; charset=utf-8")
      res.end(html)
    } catch (error) {
      vite.ssrFixStacktrace(error as Error)
      next(error)
    }
  })

  const listener = await new Promise<import("node:http").Server>((resolve) => {
    const server = app.listen(args.port, args.host, () => resolve(server))
  })
  const address = listener.address()

  if (!address || typeof address === "string") {
    await Promise.all([store.close(), vite.close()])
    throw new Error("Failed to resolve listening address")
  }

  return {
    url: `http://${args.host}:${(address as AddressInfo).port}`,
    async close() {
      isClosing = true
      await switchQueue
      unsubscribeFromStore()

      for (const stream of activeEventStreams) {
        stream.end()
        if (!stream.writableEnded) {
          stream.socket?.destroy()
        }
      }

      await Promise.all([
        store.close(),
        vite.close(),
        new Promise<void>((resolve, reject) => {
          listener.close((error) => (error ? reject(error) : resolve()))
        }),
      ])
    },
  }
}

async function main() {
  const options = parseRuntimeOptions({
    argv: process.argv,
    cwd: process.cwd(),
    mode: "dev",
  })

  const server = await startDevServer({
    host: "127.0.0.1",
    port: 5173,
    externalWorkspaceRoot: options.dev.externalWorkspaceRoot,
  })
  process.stdout.write(`Spec-driven docs viewer dev server running at ${server.url}\n`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
