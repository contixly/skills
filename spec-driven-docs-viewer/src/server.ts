import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadWorkspaceDocs } from "./lib/docs-loader.js";
import { buildPromptPayload } from "./lib/prompt.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(here, "../dist");

export async function startViewerServer(args: {
  workspaceRoot: string;
  host: string;
  port: number;
}) {
  const workspace = await loadWorkspaceDocs(args.workspaceRoot);
  const app = express();

  app.get("/api/workspace", async (_req, res) => {
    res.json(workspace);
  });

  app.get("/api/prompt/:packetId", async (req, res) => {
    try {
      const payload = await buildPromptPayload({
        workspaceRoot: args.workspaceRoot,
        workspace,
        packetId: req.params.packetId
      });
      res.json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal Server Error";
      const status = message.startsWith("Unknown packet: ") ? 404 : 500;
      res.status(status).json({ error: message });
    }
  });

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use(express.static(webRoot));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(webRoot, "index.html"));
  });

  const listener = await new Promise<import("node:http").Server>((resolve) => {
    const server = app.listen(args.port, args.host, () => resolve(server));
  });

  const address = listener.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to resolve listening address");
  }

  const url = `http://${args.host}:${address.port}`;

  return {
    url,
    async close() {
      await new Promise<void>((resolve, reject) => {
        listener.close((error) => (error ? reject(error) : resolve()));
      });
    }
  };
}
