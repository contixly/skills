# Spec-Driven Docs Viewer Dev Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real development mode to `spec-driven-docs-viewer` with source switching, high-volume fixture workspaces, and disk-backed auto-refresh without restarting the service.

**Architecture:** Keep one viewer UI over a shared normalized workspace snapshot, then split runtime responsibilities into two shells: a packaged runtime server for one workspace and a dev server that can switch between fixture workspaces and one configured external workspace. Put all file watching, reload, and revision tracking on the server side, then let the client re-fetch snapshots after SSE notifications so React stays presentation-focused.

**Tech Stack:** TypeScript, React 18, Vite, Vitest, Express, Node `fs.watch`, Server-Sent Events, `tsx`

---

### Task 1: Add source-aware runtime options and snapshot metadata

**Files:**
- Create: `spec-driven-docs-viewer/src/lib/runtime-options.ts`
- Modify: `spec-driven-docs-viewer/src/lib/contracts.ts`
- Modify: `spec-driven-docs-viewer/src/cli.ts`
- Modify: `spec-driven-docs-viewer/package.json`
- Test: `spec-driven-docs-viewer/tests/runtime-options.test.ts`

- [ ] **Step 1: Write the failing runtime options test**

```ts
// spec-driven-docs-viewer/tests/runtime-options.test.ts
import { describe, expect, test } from "vitest";
import { parseRuntimeOptions } from "../src/lib/runtime-options";

describe("parseRuntimeOptions", () => {
  test("uses fixture mode defaults for dev shell", () => {
    const options = parseRuntimeOptions({
      argv: ["node", "dev-server", "--workspace", "/tmp/demo"],
      cwd: "/repo/spec-driven-docs-viewer",
      mode: "dev"
    });

    expect(options.mode).toBe("dev");
    expect(options.dev.defaultSourceId).toBe("dense-portfolio");
    expect(options.dev.externalWorkspaceRoot).toBe("/tmp/demo");
  });

  test("uses cwd as workspace root for runtime shell", () => {
    const options = parseRuntimeOptions({
      argv: ["node", "cli"],
      cwd: "/repo/customer-app",
      mode: "runtime"
    });

    expect(options.mode).toBe("runtime");
    expect(options.runtime.workspaceRoot).toBe("/repo/customer-app");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
cd spec-driven-docs-viewer
npx vitest run tests/runtime-options.test.ts
```

Expected: FAIL with `Cannot find module '../src/lib/runtime-options'` or missing `parseRuntimeOptions`.

- [ ] **Step 3: Implement runtime options parsing and snapshot metadata**

```ts
// spec-driven-docs-viewer/src/lib/runtime-options.ts
export interface RuntimeOptions {
  mode: "runtime" | "dev";
  runtime: {
    workspaceRoot: string;
  };
  dev: {
    defaultSourceId: string;
    externalWorkspaceRoot: string | null;
  };
}

export function parseRuntimeOptions(args: {
  argv: string[];
  cwd: string;
  mode: "runtime" | "dev";
}): RuntimeOptions {
  const argv = args.argv.slice(2);
  const workspaceFlagIndex = argv.indexOf("--workspace");
  const externalWorkspaceRoot =
    workspaceFlagIndex >= 0 ? (argv[workspaceFlagIndex + 1] ?? null) : null;

  return {
    mode: args.mode,
    runtime: {
      workspaceRoot: args.cwd
    },
    dev: {
      defaultSourceId: "dense-portfolio",
      externalWorkspaceRoot
    }
  };
}
```

```ts
// spec-driven-docs-viewer/src/lib/contracts.ts
export interface ViewerSourceDescriptor {
  id: string;
  kind: "fixture" | "workspace";
  label: string;
}

export interface WorkspaceSnapshotMeta {
  mode: "runtime" | "dev";
  revision: number;
  source: ViewerSourceDescriptor;
  availableSources?: ViewerSourceDescriptor[];
}

export interface WorkspaceDocs {
  features: FeatureRecord[];
  packets: PacketRecord[];
  packetsByFeature: Record<string, PacketRecord[]>;
  delivery: DeliveryState;
  health: WorkspaceHealth;
  meta: WorkspaceSnapshotMeta;
}
```

```ts
// spec-driven-docs-viewer/src/cli.ts
#!/usr/bin/env node

import { startViewerServer } from "./server.js";
import { parseRuntimeOptions } from "./lib/runtime-options.js";

const options = parseRuntimeOptions({
  argv: process.argv,
  cwd: process.cwd(),
  mode: "runtime"
});

startViewerServer({
  mode: "runtime",
  workspaceRoot: options.runtime.workspaceRoot,
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
```

```json
// spec-driven-docs-viewer/package.json
{
  "scripts": {
    "build": "vite build && tsc -p tsconfig.build.json && chmod +x dist/cli.js",
    "test": "vitest run",
    "dev": "tsx src/dev-server.ts",
    "check": "tsc -p tsconfig.json --noEmit",
    "publish:package": "./scripts/publish.sh"
  },
  "devDependencies": {
    "tsx": "^4.19.2"
  }
}
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run:

```bash
cd spec-driven-docs-viewer
npx vitest run tests/runtime-options.test.ts
```

Expected: PASS with 2 tests passed.

- [ ] **Step 5: Commit the task**

```bash
git add spec-driven-docs-viewer/package.json \
  spec-driven-docs-viewer/src/lib/contracts.ts \
  spec-driven-docs-viewer/src/lib/runtime-options.ts \
  spec-driven-docs-viewer/src/cli.ts \
  spec-driven-docs-viewer/tests/runtime-options.test.ts
git commit -m "feat(viewer): add source-aware runtime options"
```

### Task 2: Build a watched workspace store with resilient reloads

**Files:**
- Create: `spec-driven-docs-viewer/src/lib/workspace-store.ts`
- Modify: `spec-driven-docs-viewer/src/lib/docs-loader.ts`
- Test: `spec-driven-docs-viewer/tests/workspace-store.test.ts`
- Test: `spec-driven-docs-viewer/tests/docs-loader.test.ts`

- [ ] **Step 1: Write failing tests for reload success and reload failure retention**

```ts
// spec-driven-docs-viewer/tests/workspace-store.test.ts
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { createWorkspaceStore } from "../src/lib/workspace-store";
import { fixturePath } from "../src/test/fixture-path";

async function copyFixture(name: string): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "viewer-store-"));
  const source = fixturePath(name);
  await mkdir(path.join(root, "docs"), { recursive: true });
  await cp(path.join(source, "docs"), path.join(root, "docs"), { recursive: true });

  return root;
}

describe("createWorkspaceStore", () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.map((root) => rm(root, { recursive: true, force: true })));
  });

  test("increments revision after successful reload", async () => {
    const root = await copyFixture("basic");
    roots.push(root);
    const store = await createWorkspaceStore({
      mode: "runtime",
      source: { id: "workspace", kind: "workspace", label: "Workspace" },
      workspaceRoot: root
    });

    const before = store.getSnapshot().meta.revision;
    await writeFile(
      path.join(root, "docs/_meta/delivery-state.json"),
      JSON.stringify({
        branch: "feature/live-refresh",
        updated_at: "2026-04-15",
        implemented_versions: ["mvp"],
        in_progress_features: ["smart-sync"],
        ready_packets: ["v1-smart-sync-01"],
        path: "current-state.md",
        generated_from: "docs"
      })
    );

    await store.reload("manual");
    expect(store.getSnapshot().meta.revision).toBe(before + 1);
    expect(store.getSnapshot().delivery.branch).toBe("feature/live-refresh");
  });

  test("keeps last valid snapshot when reload fails", async () => {
    const root = await copyFixture("basic");
    roots.push(root);
    const store = await createWorkspaceStore({
      mode: "runtime",
      source: { id: "workspace", kind: "workspace", label: "Workspace" },
      workspaceRoot: root
    });

    const before = store.getSnapshot();
    await writeFile(path.join(root, "docs/_meta/feature-index.json"), "{broken json", "utf-8");

    await expect(store.reload("manual")).rejects.toThrow();
    expect(store.getSnapshot().features).toEqual(before.features);
    expect(store.getSnapshot().health.level).toBe("error");
  });
});
```

- [ ] **Step 2: Run the new tests to verify they fail**

Run:

```bash
cd spec-driven-docs-viewer
npx vitest run tests/workspace-store.test.ts tests/docs-loader.test.ts
```

Expected: FAIL with missing `createWorkspaceStore` and missing `meta` on `WorkspaceDocs`.

- [ ] **Step 3: Implement the workspace store and loader metadata injection**

```ts
// spec-driven-docs-viewer/src/lib/workspace-store.ts
import { watch } from "node:fs";
import type { WorkspaceDocs, ViewerSourceDescriptor } from "./contracts";
import { loadWorkspaceDocs } from "./docs-loader";

export async function createWorkspaceStore(args: {
  mode: "runtime" | "dev";
  source: ViewerSourceDescriptor;
  workspaceRoot: string;
  availableSources?: ViewerSourceDescriptor[];
}) {
  let revision = 1;
  let snapshot = await loadWorkspaceDocs({
    workspaceRoot: args.workspaceRoot,
    mode: args.mode,
    revision,
    source: args.source,
    availableSources: args.availableSources
  });
  const listeners = new Set<() => void>();
  let reloadTimer: ReturnType<typeof setTimeout> | null = null;
  let watcher = watch(`${args.workspaceRoot}/docs`, { recursive: true }, (_event, fileName) => {
    if (!fileName?.includes("_meta") && !fileName?.includes("/iterations/")) return;
    if (reloadTimer) clearTimeout(reloadTimer);
    reloadTimer = setTimeout(() => {
      void reload("watch");
    }, 150);
  });

  async function reload(_reason: "watch" | "manual"): Promise<WorkspaceDocs> {
    try {
      const next = await loadWorkspaceDocs({
        workspaceRoot: args.workspaceRoot,
        mode: args.mode,
        revision: revision + 1,
        source: args.source,
        availableSources: args.availableSources
      });
      revision += 1;
      snapshot = next;
      listeners.forEach((listener) => listener());
      return snapshot;
    } catch (error) {
      snapshot = {
        ...snapshot,
        health: {
          level: "error",
          messages: [error instanceof Error ? error.message : "Reload failed"]
        }
      };
      throw error;
    }
  }

  return {
    getSnapshot() {
      return snapshot;
    },
    async reload(reason: "watch" | "manual") {
      return reload(reason);
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async close() {
      watcher.close();
      if (reloadTimer) clearTimeout(reloadTimer);
    }
  };
}
```

```ts
// spec-driven-docs-viewer/src/lib/docs-loader.ts
export async function loadWorkspaceDocs(args: {
  workspaceRoot: string;
  mode: "runtime" | "dev";
  revision: number;
  source: ViewerSourceDescriptor;
  availableSources?: ViewerSourceDescriptor[];
}): Promise<WorkspaceDocs> {
  const metaDir = path.join(args.workspaceRoot, "docs", "_meta");
  const featurePayload = await readJsonFile<{ features: FeatureRecord[] }>(
    path.join(metaDir, "feature-index.json")
  );
  const taskPayload = await readJsonFile<{ tasks: PacketRecord[] }>(
    path.join(metaDir, "task-board.json")
  );
  const delivery = await readJsonFile<DeliveryState>(path.join(metaDir, "delivery-state.json"));
  const normalizedTasks = taskPayload.tasks.map((task) => ({
    ...task,
    status: normalizeStatus(task.status)
  }));
  const packetsByFeature = normalizedTasks.reduce<Record<string, PacketRecord[]>>((acc, packet) => {
    acc[packet.feature] ??= [];
    acc[packet.feature].push(packet);
    return acc;
  }, {});
  const features = featurePayload.features.map((feature) => ({
    ...feature,
    status: normalizeStatus(feature.status),
    packet_counts: countPacketsByStatus(packetsByFeature[feature.id] ?? [])
  }));
  const stalePacketDocs = await hasStalePacketDocs(
    args.workspaceRoot,
    normalizedTasks.map((task) => task.path)
  );

  return {
    features,
    packets: normalizedTasks,
    packetsByFeature,
    delivery,
    health: {
      level: stalePacketDocs ? "warning" : "ok",
      messages: stalePacketDocs
        ? ["Packet markdown exists but docs/_meta indexes are incomplete or stale."]
        : []
    },
    meta: {
      mode: args.mode,
      revision: args.revision,
      source: args.source,
      availableSources: args.availableSources
    }
  };
}
```

- [ ] **Step 4: Update loader tests to assert snapshot metadata**

```ts
// spec-driven-docs-viewer/tests/docs-loader.test.ts
const workspace = await loadWorkspaceDocs({
  workspaceRoot: fixturePath("basic"),
  mode: "runtime",
  revision: 7,
  source: { id: "workspace", kind: "workspace", label: "Workspace" }
});

expect(workspace.meta).toEqual({
  mode: "runtime",
  revision: 7,
  source: { id: "workspace", kind: "workspace", label: "Workspace" },
  availableSources: undefined
});
```

- [ ] **Step 5: Run the tests and commit**

Run:

```bash
cd spec-driven-docs-viewer
npx vitest run tests/workspace-store.test.ts tests/docs-loader.test.ts
```

Expected: PASS with all workspace store and loader assertions green.

Commit:

```bash
git add spec-driven-docs-viewer/src/lib/docs-loader.ts \
  spec-driven-docs-viewer/src/lib/workspace-store.ts \
  spec-driven-docs-viewer/tests/docs-loader.test.ts \
  spec-driven-docs-viewer/tests/workspace-store.test.ts
git commit -m "feat(viewer): add watched workspace store"
```

### Task 3: Extend the runtime server with snapshot API and SSE reload notifications

**Files:**
- Modify: `spec-driven-docs-viewer/src/server.ts`
- Modify: `spec-driven-docs-viewer/tests/server.test.ts`

- [ ] **Step 1: Write failing server tests for snapshot metadata and SSE endpoint**

```ts
// spec-driven-docs-viewer/tests/server.test.ts
test("returns snapshot metadata for workspace api", async () => {
  const server = await startViewerServer({
    mode: "runtime",
    workspaceRoot: fixturePath("basic"),
    host: "127.0.0.1",
    port: 0
  });
  servers.push(server);

  const workspaceRes = await fetch(`${server.url}/api/workspace`);
  const workspace = await workspaceRes.json();

  expect(workspace.meta.mode).toBe("runtime");
  expect(workspace.meta.source.id).toBe("workspace");
});

test("serves an event stream endpoint", async () => {
  const server = await startViewerServer({
    mode: "runtime",
    workspaceRoot: fixturePath("basic"),
    host: "127.0.0.1",
    port: 0
  });
  servers.push(server);

  const response = await fetch(`${server.url}/api/events`, {
    headers: { Accept: "text/event-stream" }
  });

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("text/event-stream");
});
```

- [ ] **Step 2: Run the server tests to verify they fail**

Run:

```bash
cd spec-driven-docs-viewer
npx vitest run tests/server.test.ts
```

Expected: FAIL because `startViewerServer` does not accept `mode` and `/api/events` is missing.

- [ ] **Step 3: Implement the runtime server around the workspace store**

```ts
// spec-driven-docs-viewer/src/server.ts
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createWorkspaceStore } from "./lib/workspace-store.js";
import { buildPromptPayload } from "./lib/prompt.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(here, "../dist");

export async function startViewerServer(args: {
  mode: "runtime" | "dev";
  workspaceRoot: string;
  host: string;
  port: number;
}) {
  const store = await createWorkspaceStore({
    mode: args.mode,
    source: { id: "workspace", kind: "workspace", label: "Workspace" },
    workspaceRoot: args.workspaceRoot
  });
  const app = express();

  app.get("/api/workspace", (_req, res) => {
    res.json(store.getSnapshot());
  });

  app.get("/api/events", (_req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    res.write(`event: ready\ndata: ${JSON.stringify({ revision: store.getSnapshot().meta.revision })}\n\n`);

    const unsubscribe = store.subscribe(() => {
      res.write(
        `event: snapshot\ndata: ${JSON.stringify({ revision: store.getSnapshot().meta.revision })}\n\n`
      );
    });

    _req.on("close", () => {
      unsubscribe();
      res.end();
    });
  });

  app.get("/api/prompt/:packetId", async (req, res) => {
    try {
      const payload = await buildPromptPayload({
        workspaceRoot: args.workspaceRoot,
        workspace: store.getSnapshot(),
        packetId: req.params.packetId
      });
      res.json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal Server Error";
      res.status(message.startsWith("Unknown packet: ") ? 404 : 500).json({ error: message });
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

  return {
    url: `http://${args.host}:${(listener.address() as import("node:net").AddressInfo).port}`,
    async close() {
      await store.close();
      await new Promise<void>((resolve, reject) => {
        listener.close((error) => (error ? reject(error) : resolve()));
      });
    }
  };
}
```

- [ ] **Step 4: Run the server tests to verify they pass**

Run:

```bash
cd spec-driven-docs-viewer
npx vitest run tests/server.test.ts
```

Expected: PASS with runtime metadata and SSE endpoint covered.

- [ ] **Step 5: Commit the server changes**

```bash
git add spec-driven-docs-viewer/src/server.ts \
  spec-driven-docs-viewer/tests/server.test.ts
git commit -m "feat(viewer): add snapshot metadata and sse updates"
```

### Task 4: Add a dev server with source switching and generated fixture workspaces

**Files:**
- Create: `spec-driven-docs-viewer/src/dev-server.ts`
- Create: `spec-driven-docs-viewer/src/lib/dev-source-registry.ts`
- Create: `spec-driven-docs-viewer/scripts/generate-dev-fixtures.mjs`
- Create: `spec-driven-docs-viewer/tests/dev-source-registry.test.ts`
- Create: `spec-driven-docs-viewer/tests/dev-server.test.ts`
- Create: `spec-driven-docs-viewer/tests/fixtures/dense-portfolio/**`
- Create: `spec-driven-docs-viewer/tests/fixtures/stale-and-broken/**`
- Create: `spec-driven-docs-viewer/tests/fixtures/empty-or-minimal/**`

- [ ] **Step 1: Write the failing registry test for dev sources**

```ts
// spec-driven-docs-viewer/tests/dev-source-registry.test.ts
import { describe, expect, test } from "vitest";
import { createDevSourceRegistry } from "../src/lib/dev-source-registry";

describe("createDevSourceRegistry", () => {
  test("lists fixture sources plus configured external workspace", () => {
    const registry = createDevSourceRegistry({
      externalWorkspaceRoot: "/tmp/customer-app"
    });

    expect(registry.list().map((source) => source.id)).toEqual([
      "dense-portfolio",
      "stale-and-broken",
      "empty-or-minimal",
      "external-workspace"
    ]);
    expect(registry.get("external-workspace")?.workspaceRoot).toBe("/tmp/customer-app");
  });
});
```

```ts
// spec-driven-docs-viewer/tests/dev-server.test.ts
import { afterEach, describe, expect, test } from "vitest";
import { startDevServer } from "../src/dev-server";

describe("startDevServer", () => {
  const servers: Array<{ close: () => Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(servers.map((server) => server.close()));
    servers.length = 0;
  });

  test("switches workspace source through the dev api", async () => {
    const server = await startDevServer({
      host: "127.0.0.1",
      port: 0,
      externalWorkspaceRoot: null
    });
    servers.push(server);

    const switchRes = await fetch(`${server.url}/api/dev/source`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceId: "empty-or-minimal" })
    });
    const workspaceRes = await fetch(`${server.url}/api/workspace`);
    const workspace = await workspaceRes.json();

    expect(switchRes.status).toBe(204);
    expect(workspace.meta.mode).toBe("dev");
    expect(workspace.meta.source.id).toBe("empty-or-minimal");
  });
});
```

- [ ] **Step 2: Run the registry test to verify it fails**

Run:

```bash
cd spec-driven-docs-viewer
npx vitest run tests/dev-source-registry.test.ts
```

Expected: FAIL with missing `createDevSourceRegistry`.

- [ ] **Step 3: Implement the registry and fixture generator**

```ts
// spec-driven-docs-viewer/src/lib/dev-source-registry.ts
import path from "node:path";
import type { ViewerSourceDescriptor } from "./contracts";

export interface DevSourceRecord extends ViewerSourceDescriptor {
  workspaceRoot: string;
}

export function createDevSourceRegistry(args: {
  externalWorkspaceRoot: string | null;
}): {
  list(): DevSourceRecord[];
  get(id: string): DevSourceRecord | undefined;
} {
  const fixturesRoot = path.resolve(process.cwd(), "tests/fixtures");
  const sources: DevSourceRecord[] = [
    {
      id: "dense-portfolio",
      kind: "fixture",
      label: "Dense Portfolio",
      workspaceRoot: path.join(fixturesRoot, "dense-portfolio")
    },
    {
      id: "stale-and-broken",
      kind: "fixture",
      label: "Stale and Broken",
      workspaceRoot: path.join(fixturesRoot, "stale-and-broken")
    },
    {
      id: "empty-or-minimal",
      kind: "fixture",
      label: "Empty or Minimal",
      workspaceRoot: path.join(fixturesRoot, "empty-or-minimal")
    }
  ];

  if (args.externalWorkspaceRoot) {
    sources.push({
      id: "external-workspace",
      kind: "workspace",
      label: "External Workspace",
      workspaceRoot: args.externalWorkspaceRoot
    });
  }

  return {
    list() {
      return sources;
    },
    get(id: string) {
      return sources.find((source) => source.id === id);
    }
  };
}
```

```js
// spec-driven-docs-viewer/scripts/generate-dev-fixtures.mjs
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = new URL("../tests/fixtures/", import.meta.url);
const versions = ["mvp", "v1", "v2", "v3"];
const modules = ["platform", "intake", "review", "delivery", "billing", "analytics", "support"];
const statuses = ["planned", "ready", "in-progress", "done", "blocked", "superseded", "unknown"];

function packetStatus(index) {
  if (index % 11 === 0) return "blocked";
  if (index % 7 === 0) return "in-progress";
  if (index % 5 === 0) return "planned";
  return "ready";
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(value, null, 2) + "\n", "utf-8");
}

async function writeMarkdown(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, value, "utf-8");
}

const denseFeatures = Array.from({ length: 32 }, (_, index) => {
  const version = versions[index % versions.length];
  const moduleId = modules[index % modules.length];

  return {
    id: `feature-${String(index + 1).padStart(2, "0")}`,
    title: `Feature ${index + 1} for ${moduleId} delivery operations`,
    module: moduleId,
    version,
    status: statuses[index % statuses.length],
    priority: index % 3 === 0 ? "high" : index % 3 === 1 ? "medium" : "low",
    depends_on: index % 4 === 0 ? ["feature-01", "feature-02"] : [],
    path: `versions/${version}/features/feature-${String(index + 1).padStart(2, "0")}.md`
  };
});

const denseTasks = denseFeatures.flatMap((feature, featureIndex) =>
  Array.from({ length: featureIndex % 5 === 0 ? 12 : 3 }, (_, packetIndex) => ({
    id: `${feature.version}-${feature.id}-${String(packetIndex + 1).padStart(2, "0")}`,
    title: `Packet ${packetIndex + 1} for ${feature.title}`,
    feature: feature.id,
    version: feature.version,
    status: packetStatus(featureIndex + packetIndex),
    owner: packetIndex % 2 === 0 ? "agent-a" : "unassigned",
    path: `versions/${feature.version}/iterations/${feature.version}-${feature.id}-${String(packetIndex + 1).padStart(2, "0")}.md`
  }))
);

await writeJson(new URL("./dense-portfolio/docs/_meta/feature-index.json", root), { features: denseFeatures, generated_from: "docs" });
await writeJson(new URL("./dense-portfolio/docs/_meta/task-board.json", root), { tasks: denseTasks, generated_from: "docs" });
await writeJson(new URL("./dense-portfolio/docs/_meta/delivery-state.json", root), {
  branch: "feature/dense-portfolio",
  updated_at: "2026-04-15",
  implemented_versions: ["mvp", "v1"],
  in_progress_features: denseFeatures.filter((feature) => feature.status === "in-progress").map((feature) => feature.id),
  ready_packets: denseTasks.filter((task) => task.status === "ready").slice(0, 10).map((task) => task.id),
  path: "current-state.md",
  generated_from: "docs"
});

for (const task of denseTasks) {
  await writeMarkdown(
    new URL(`./dense-portfolio/docs/${task.path}`, root),
    `# Packet: ${task.title}\n\n- ID: ${task.id}\n- Feature: ${task.feature}\n- Version: ${task.version}\n- Status: ${task.status}\n- Owner: ${task.owner}\n\n## Suggested follow-up prompt\n\n\`Implement ${task.id} only.\`\n`
  );
}

await writeJson(new URL("./stale-and-broken/docs/_meta/feature-index.json", root), {
  features: denseFeatures.slice(0, 2),
  generated_from: "docs"
});
await writeJson(new URL("./stale-and-broken/docs/_meta/task-board.json", root), {
  tasks: denseTasks.slice(0, 2),
  generated_from: "docs"
});
await writeJson(new URL("./stale-and-broken/docs/_meta/delivery-state.json", root), {
  branch: "feature/stale-fixture",
  updated_at: "2026-04-15",
  implemented_versions: [],
  in_progress_features: [],
  ready_packets: [],
  path: "current-state.md",
  generated_from: "docs"
});
await writeMarkdown(
  new URL("./stale-and-broken/docs/versions/v1/iterations/orphan-packet.md", root),
  "# Packet: Orphan Packet\n\nThis file exists only to trigger stale index warnings.\n"
);

await writeJson(new URL("./empty-or-minimal/docs/_meta/feature-index.json", root), {
  features: [],
  generated_from: "docs"
});
await writeJson(new URL("./empty-or-minimal/docs/_meta/task-board.json", root), {
  tasks: [],
  generated_from: "docs"
});
await writeJson(new URL("./empty-or-minimal/docs/_meta/delivery-state.json", root), {
  branch: "feature/empty-fixture",
  updated_at: "2026-04-15",
  implemented_versions: [],
  in_progress_features: [],
  ready_packets: [],
  path: "current-state.md",
  generated_from: "docs"
});
```

```ts
// spec-driven-docs-viewer/src/dev-server.ts
import express from "express";
import { json } from "express";
import { createServer as createViteServer } from "vite";
import { parseRuntimeOptions } from "./lib/runtime-options.js";
import { createDevSourceRegistry } from "./lib/dev-source-registry.js";
import { createWorkspaceStore } from "./lib/workspace-store.js";

export async function startDevServer(args: {
  host: string;
  port: number;
  externalWorkspaceRoot: string | null;
}) {
  const registry = createDevSourceRegistry({
    externalWorkspaceRoot: args.externalWorkspaceRoot
  });
  let activeSource = registry.get("dense-portfolio");
  if (!activeSource) throw new Error("Missing dense-portfolio fixture");
  let store = await createWorkspaceStore({
    mode: "dev",
    source: activeSource,
    workspaceRoot: activeSource.workspaceRoot,
    availableSources: registry.list()
  });

  const app = express();
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom"
  });

  app.use(json());
  app.get("/api/workspace", (_req, res) => {
    res.json(store.getSnapshot());
  });
  app.get("/api/events", (_req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    const unsubscribe = store.subscribe(() => {
      res.write(`event: snapshot\ndata: ${JSON.stringify({ revision: store.getSnapshot().meta.revision })}\n\n`);
    });
    _req.on("close", () => {
      unsubscribe();
      res.end();
    });
  });
  app.post("/api/dev/source", async (req, res) => {
    const nextSource = registry.get(req.body.sourceId);
    if (!nextSource) {
      res.status(404).json({ error: `Unknown source: ${req.body.sourceId}` });
      return;
    }
    await store.close();
    activeSource = nextSource;
    store = await createWorkspaceStore({
      mode: "dev",
      source: activeSource,
      workspaceRoot: activeSource.workspaceRoot,
      availableSources: registry.list()
    });
    res.status(204).end();
  });
  app.use(vite.middlewares);

  const listener = await new Promise<import("node:http").Server>((resolve) => {
    const server = app.listen(args.port, args.host, () => resolve(server));
  });

  return {
    url: `http://${args.host}:${(listener.address() as import("node:net").AddressInfo).port}`,
    async close() {
      await store.close();
      await vite.close();
      await new Promise<void>((resolve, reject) => {
        listener.close((error) => (error ? reject(error) : resolve()));
      });
    }
  };
}

const options = parseRuntimeOptions({
  argv: process.argv,
  cwd: process.cwd(),
  mode: "dev"
});

startDevServer({
  host: "127.0.0.1",
  port: 5173,
  externalWorkspaceRoot: options.dev.externalWorkspaceRoot
}).then((server) => {
  process.stdout.write(`Spec-driven docs viewer dev server running at ${server.url}\n`);
});
```

- [ ] **Step 4: Generate and check in the fixture workspaces**

Run:

```bash
cd spec-driven-docs-viewer
node scripts/generate-dev-fixtures.mjs
find tests/fixtures/dense-portfolio/docs/_meta -maxdepth 1 -type f | sort
find tests/fixtures/stale-and-broken/docs/_meta -maxdepth 1 -type f | sort
find tests/fixtures/empty-or-minimal/docs/_meta -maxdepth 1 -type f | sort
```

Expected: each fixture directory contains `feature-index.json`, `task-board.json`, and `delivery-state.json`, plus generated packet markdown under `docs/versions/*/iterations/`.

- [ ] **Step 5: Run tests and commit the dev source layer**

Run:

```bash
cd spec-driven-docs-viewer
npx vitest run tests/dev-source-registry.test.ts tests/dev-server.test.ts tests/runtime-options.test.ts
```

Expected: PASS with registry and option parsing assertions green.

Commit:

```bash
git add spec-driven-docs-viewer/src/dev-server.ts \
  spec-driven-docs-viewer/src/lib/dev-source-registry.ts \
  spec-driven-docs-viewer/scripts/generate-dev-fixtures.mjs \
  spec-driven-docs-viewer/tests/dev-source-registry.test.ts \
  spec-driven-docs-viewer/tests/dev-server.test.ts \
  spec-driven-docs-viewer/tests/fixtures/dense-portfolio \
  spec-driven-docs-viewer/tests/fixtures/stale-and-broken \
  spec-driven-docs-viewer/tests/fixtures/empty-or-minimal
git commit -m "feat(viewer): add dev sources and fixture workspaces"
```

### Task 5: Update the React app for dev source switching and live refresh

**Files:**
- Create: `spec-driven-docs-viewer/src/components/DevSourceSwitcher.tsx`
- Modify: `spec-driven-docs-viewer/src/App.tsx`
- Modify: `spec-driven-docs-viewer/src/components/FeatureBoard.tsx`
- Modify: `spec-driven-docs-viewer/src/components/FeatureDetailPane.tsx`
- Modify: `spec-driven-docs-viewer/src/components/PacketDetail.tsx`
- Modify: `spec-driven-docs-viewer/src/styles.css`
- Modify: `spec-driven-docs-viewer/tests/App.test.tsx`

- [ ] **Step 1: Extend the app test for dev switcher and SSE refresh**

```ts
// spec-driven-docs-viewer/tests/App.test.tsx
test("shows dev source switcher and reloads after snapshot event", async () => {
  const user = userEvent.setup();
  const listeners = new Map<string, (event: MessageEvent) => void>();
  const EventSourceMock = vi.fn().mockImplementation(() => ({
    addEventListener: (name: string, listener: (event: MessageEvent) => void) => {
      listeners.set(name, listener);
    },
    close: vi.fn()
  }));

  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ...workspacePayload,
          meta: {
            mode: "dev",
            revision: 1,
            source: { id: "dense-portfolio", kind: "fixture", label: "Dense Portfolio" },
            availableSources: [
              { id: "dense-portfolio", kind: "fixture", label: "Dense Portfolio" },
              { id: "external-workspace", kind: "workspace", label: "External Workspace" }
            ]
          }
        })
      )
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ...workspacePayload,
          delivery: { ...workspacePayload.delivery, branch: "feature/reloaded" },
          meta: {
            mode: "dev",
            revision: 2,
            source: { id: "dense-portfolio", kind: "fixture", label: "Dense Portfolio" },
            availableSources: [
              { id: "dense-portfolio", kind: "fixture", label: "Dense Portfolio" },
              { id: "external-workspace", kind: "workspace", label: "External Workspace" }
            ]
          }
        })
      )
    );

  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("EventSource", EventSourceMock);
  vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn() } });

  render(<App />);

  await screen.findByText("Dense Portfolio");
  listeners.get("snapshot")?.(
    new MessageEvent("snapshot", { data: JSON.stringify({ revision: 2 }) })
  );

  await screen.findByText("feature/reloaded");
  await user.click(screen.getByRole("button", { name: /Dense Portfolio/i }));
});
```

- [ ] **Step 2: Run the app test to verify it fails**

Run:

```bash
cd spec-driven-docs-viewer
npx vitest run tests/App.test.tsx
```

Expected: FAIL because the app has no `EventSource` subscription and no dev switcher UI.

- [ ] **Step 3: Implement the dev switcher and SSE-driven snapshot refresh**

```tsx
// spec-driven-docs-viewer/src/components/DevSourceSwitcher.tsx
import type { ViewerSourceDescriptor } from "../lib/contracts";

export function DevSourceSwitcher(props: {
  sources: ViewerSourceDescriptor[];
  activeSourceId: string;
  onChange: (sourceId: string) => Promise<void>;
}) {
  return (
    <section className="dev-switcher" aria-label="Data source switcher">
      <label htmlFor="dev-source">Data source</label>
      <select
        id="dev-source"
        value={props.activeSourceId}
        onChange={(event) => void props.onChange(event.target.value)}
      >
        {props.sources.map((source) => (
          <option key={source.id} value={source.id}>
            {source.label}
          </option>
        ))}
      </select>
    </section>
  );
}
```

```tsx
// spec-driven-docs-viewer/src/App.tsx
import { startTransition, useEffect, useState } from "react";
import { DevSourceSwitcher } from "./components/DevSourceSwitcher";

async function fetchWorkspace(): Promise<WorkspaceDocs> {
  const response = await fetch("/api/workspace");
  if (!response.ok) throw new Error(`Workspace request failed with ${response.status}`);
  return (await response.json()) as WorkspaceDocs;
}

export function App() {
  const [workspace, setWorkspace] = useState<WorkspaceDocs | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [refreshNotice, setRefreshNotice] = useState<string>("");
  const [selectedFeature, setSelectedFeature] = useState<FeatureRecord | null>(null);
  const [selectedPacket, setSelectedPacket] = useState<PacketRecord | null>(null);
  const [copyState, setCopyState] = useState<{
    packetId: string | null;
    source: PromptPayload["source"] | null;
    pending: boolean;
    error: string | null;
  }>({
    packetId: null,
    source: null,
    pending: false,
    error: null
  });

  async function loadWorkspace() {
    const payload = await fetchWorkspace();
    startTransition(() => {
      setWorkspace(payload);
      setWorkspaceError(null);
      setSelectedFeature((current) =>
        current && payload.features.some((feature) => feature.id === current.id) ? current : null
      );
      setSelectedPacket((current) =>
        current && payload.packets.some((packet) => packet.id === current.id) ? current : null
      );
    });
  }

  useEffect(() => {
    void loadWorkspace();
    const events = new EventSource("/api/events");
    const onSnapshot = () => {
      void loadWorkspace().then(() => {
        setRefreshNotice("Updated");
        window.setTimeout(() => setRefreshNotice(""), 1200);
      });
    };

    events.addEventListener("snapshot", onSnapshot);
    return () => events.close();
  }, []);

  async function handleSourceChange(sourceId: string) {
    const response = await fetch("/api/dev/source", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceId })
    });
    if (!response.ok) throw new Error(`Source switch failed with ${response.status}`);
    await loadWorkspace();
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Read-only workspace</p>
          <h1>Spec-Driven Docs Viewer</h1>
          {refreshNotice ? <p className="refresh-note">{refreshNotice}</p> : null}
        </div>
        <div className="header-stack">
          {workspace?.meta.mode === "dev" && workspace.meta.availableSources ? (
            <DevSourceSwitcher
              sources={workspace.meta.availableSources}
              activeSourceId={workspace.meta.source.id}
              onChange={handleSourceChange}
            />
          ) : null}
          <dl className="workspace-meta">
            <div>
              <dt>Branch</dt>
              <dd>{workspace?.delivery.branch ?? "unknown"}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{workspace?.delivery.updated_at ?? "unknown"}</dd>
            </div>
            <div>
              <dt>Health</dt>
              <dd className={`health health-${workspace?.health.level ?? "warning"}`}>
                {workspace?.health.level ?? "warning"}
              </dd>
            </div>
          </dl>
        </div>
      </header>
    </div>
  );
}
```

- [ ] **Step 4: Add the dev switcher and refresh styles**

```css
/* spec-driven-docs-viewer/src/styles.css */
.header-stack {
  display: grid;
  gap: 12px;
  justify-items: end;
}

.dev-switcher {
  display: grid;
  gap: 6px;
  min-width: 220px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
  box-shadow: var(--shadow);
}

.dev-switcher label {
  color: var(--text-muted);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.dev-switcher select {
  min-height: 38px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface-strong);
  padding: 0 10px;
}

.refresh-note {
  margin: 8px 0 0;
  color: var(--status-ready);
  font-size: 0.85rem;
  font-weight: 700;
}
```

- [ ] **Step 5: Run the app tests and commit**

Run:

```bash
cd spec-driven-docs-viewer
npx vitest run tests/App.test.tsx
```

Expected: PASS with drilldown, retry, copy-failure, and dev refresh tests.

Commit:

```bash
git add spec-driven-docs-viewer/src/App.tsx \
  spec-driven-docs-viewer/src/components/DevSourceSwitcher.tsx \
  spec-driven-docs-viewer/src/components/FeatureBoard.tsx \
  spec-driven-docs-viewer/src/components/FeatureDetailPane.tsx \
  spec-driven-docs-viewer/src/components/PacketDetail.tsx \
  spec-driven-docs-viewer/src/styles.css \
  spec-driven-docs-viewer/tests/App.test.tsx
git commit -m "feat(viewer): add dev source switching ui"
```

### Task 6: Document and verify the development workflow end-to-end

**Files:**
- Create: `spec-driven-docs-viewer/README.md`
- Modify: `README.md`

- [ ] **Step 1: Write the viewer package README**

```md
<!-- spec-driven-docs-viewer/README.md -->
# Spec-Driven Docs Viewer

Local read-only viewer for `spec-driven-docs` outputs.

## Development

```bash
cd spec-driven-docs-viewer
npm install
npm run dev
npm run dev -- --workspace /absolute/path/to/target-repo
```

Dev mode starts on the `dense-portfolio` fixture by default. Use the in-app data-source switcher to move between fixtures and the configured external workspace.

## Verification

```bash
cd spec-driven-docs-viewer
npm test
npm run check
```
```

- [ ] **Step 2: Update the root README viewer section**

```md
<!-- README.md -->
### `spec-driven-docs-viewer`

This package renders generated documentation into a local board so humans can inspect roadmap state, feature readiness, packet prompts, and development fixtures for UI debugging.

Useful commands:

```bash
cd spec-driven-docs-viewer
npm run dev
npm run dev -- --workspace /absolute/path/to/repo
npm test
npm run check
```
```

- [ ] **Step 3: Run full verification**

Run:

```bash
cd spec-driven-docs-viewer
npm test
npm run check
npm run build
```

Expected:

- `npm test`: PASS
- `npm run check`: PASS
- `npm run build`: PASS and emits `dist/`

- [ ] **Step 4: Manually verify live reload in dev mode**

Run:

```bash
cd spec-driven-docs-viewer
npm run dev -- --workspace /absolute/path/to/target-repo
```

Then:

1. Open the printed localhost URL.
2. Confirm `Dense Portfolio` is selected by default.
3. Switch to `External Workspace`.
4. Edit `docs/_meta/delivery-state.json` in the external repo.
5. Confirm the header updates without restarting the viewer.
6. Break one `_meta` JSON file temporarily.
7. Confirm the last valid UI remains visible and a health error appears.

- [ ] **Step 5: Commit the docs and verification updates**

```bash
git add README.md spec-driven-docs-viewer/README.md
git commit -m "docs(viewer): describe dev mode workflow"
```
