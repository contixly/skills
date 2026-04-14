#!/usr/bin/env node

import { startViewerServer } from "./server.js";

const workspaceRoot = process.cwd();

startViewerServer({
  workspaceRoot,
  host: "127.0.0.1",
  port: 0
})
  .then((server) => {
    process.stdout.write(`Spec-driven docs viewer running at ${server.url}\n`);
  })
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
