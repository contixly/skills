import express, { type Response } from "express"
import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import type { ViewerSourceDescriptor } from "../../shared/contracts.js"
import { buildPromptPayload } from "../workspace/prompt.js"
import { createWorkspaceStore } from "../workspace/workspace-store.js"

const here = path.dirname(fileURLToPath(import.meta.url))

function resolveRuntimeWebRoot(): string {
  const candidates = [path.resolve(here, "../../../dist"), path.resolve(here, "../..")]

  return (
    candidates.find((candidate) => existsSync(path.join(candidate, "index.html"))) ?? candidates[0]
  )
}

const webRoot = resolveRuntimeWebRoot()

export async function startViewerServer(args: {
  mode: "runtime" | "dev"
  workspaceRoot: string
  host: string
  port: number
  source?: ViewerSourceDescriptor
}) {
  const store = await createWorkspaceStore({
    workspaceRoot: args.workspaceRoot,
    mode: args.mode,
    source:
      args.source ??
      ({
        id: "workspace",
        kind: "workspace",
        label: "Workspace",
      } satisfies ViewerSourceDescriptor),
  })
  const app = express()
  const activeEventStreams = new Set<Response>()

  const writeRevisionEvent = (res: Response) => {
    if (res.writableEnded || res.destroyed) {
      return
    }

    res.write(`data: ${JSON.stringify({ revision: store.getSnapshot().meta.revision })}\n\n`)
  }

  app.get("/api/workspace", (_req, res) => {
    res.json(store.getSnapshot())
  })

  app.get("/api/events", (_req, res) => {
    res.status(200)
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8")
    res.setHeader("Cache-Control", "no-cache, no-transform")
    res.setHeader("Connection", "keep-alive")
    res.flushHeaders()
    activeEventStreams.add(res)

    writeRevisionEvent(res)

    const unsubscribe = store.subscribe(() => {
      writeRevisionEvent(res)
    })

    let isTornDown = false
    const teardown = () => {
      if (isTornDown) {
        return
      }

      isTornDown = true
      activeEventStreams.delete(res)
      unsubscribe()
    }

    res.on("close", teardown)
    res.on("error", teardown)
  })

  app.get("/api/prompt/:packetId", async (req, res) => {
    try {
      const payload = await buildPromptPayload({
        workspaceRoot: args.workspaceRoot,
        workspace: store.getSnapshot(),
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

  app.use(express.static(webRoot))
  app.get("*", (_req, res) => {
    res.sendFile(path.join(webRoot, "index.html"))
  })

  const listener = await new Promise<import("node:http").Server>((resolve) => {
    const server = app.listen(args.port, args.host, () => resolve(server))
  })

  const address = listener.address()
  if (!address || typeof address === "string") {
    throw new Error("Failed to resolve listening address")
  }

  const url = `http://${args.host}:${address.port}`

  return {
    url,
    async close() {
      for (const stream of activeEventStreams) {
        stream.end()
        if (!stream.writableEnded) {
          stream.socket?.destroy()
        }
      }

      await Promise.all([
        store.close(),
        new Promise<void>((resolve, reject) => {
          listener.close((error) => (error ? reject(error) : resolve()))
        }),
      ])
    },
  }
}
