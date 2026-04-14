# Spec-Driven Docs Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an `npx`-launched, read-only local viewer for `spec-driven-docs` that reads `docs/_meta/*.json` plus packet markdown, renders a feature-status kanban with packet drilldown, and copies packet prompts with markdown-first extraction and JSON fallback.

**Architecture:** Implement an isolated npm package at `spec-driven-docs/assets/viewer/`. The package contains a small Node CLI and HTTP server plus a Vite-built React client. The CLI resolves the current working directory as the target repository, loads and normalizes `docs/_meta` data, exposes API endpoints for workspace state and prompt generation, and serves the built SPA. The SPA renders a feature board grouped by feature status and a drilldown pane with packet kanban, packet details, and `Copy Prompt`.

**Tech Stack:** TypeScript, Node 20+, React 18, Vite, Vitest, React Testing Library, `express`, `open`

---

### Task 1: Scaffold the isolated viewer package and lock the workspace data contract

**Files:**
- Create: `spec-driven-docs/assets/viewer/package.json`
- Create: `spec-driven-docs/assets/viewer/tsconfig.json`
- Create: `spec-driven-docs/assets/viewer/vite.config.ts`
- Create: `spec-driven-docs/assets/viewer/vitest.config.ts`
- Create: `spec-driven-docs/assets/viewer/index.html`
- Create: `spec-driven-docs/assets/viewer/src/test/fixture-path.ts`
- Create: `spec-driven-docs/assets/viewer/src/lib/contracts.ts`
- Create: `spec-driven-docs/assets/viewer/src/lib/docs-loader.ts`
- Create: `spec-driven-docs/assets/viewer/src/lib/docs-loader.test.ts`
- Create: `spec-driven-docs/assets/viewer/tests/fixtures/basic/docs/_meta/feature-index.json`
- Create: `spec-driven-docs/assets/viewer/tests/fixtures/basic/docs/_meta/task-board.json`
- Create: `spec-driven-docs/assets/viewer/tests/fixtures/basic/docs/_meta/delivery-state.json`

- [ ] **Step 1: Write the failing test and package scaffolding**

```json
// spec-driven-docs/assets/viewer/package.json
{
  "name": "@contixly/spec-driven-docs-viewer",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "bin": {
    "spec-driven-docs-viewer": "./dist/cli.js"
  },
  "scripts": {
    "build": "vite build && tsc -p tsconfig.json",
    "test": "vitest run",
    "dev": "vite",
    "check": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "express": "^4.21.2",
    "open": "^10.1.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/express": "^5.0.1",
    "@types/node": "^22.13.9",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^26.0.0",
    "typescript": "^5.8.2",
    "vite": "^6.2.0",
    "vitest": "^3.0.8"
  }
}
```

```ts
// spec-driven-docs/assets/viewer/src/lib/docs-loader.test.ts
import { describe, expect, test } from "vitest";
import { loadWorkspaceDocs } from "./docs-loader";
import { fixturePath } from "../test/fixture-path";

describe("loadWorkspaceDocs", () => {
  test("loads features, packets, and delivery state from docs/_meta", async () => {
    const workspace = await loadWorkspaceDocs(fixturePath("basic"));

    expect(workspace.features.map((feature) => feature.id)).toEqual([
      "smart-sync",
      "review-queue"
    ]);
    expect(workspace.packetsByFeature["smart-sync"].map((packet) => packet.id)).toEqual([
      "v1-smart-sync-01"
    ]);
    expect(workspace.delivery.branch).toBe("feature/spec-docs");
  });
});
```

```json
// spec-driven-docs/assets/viewer/tests/fixtures/basic/docs/_meta/feature-index.json
{
  "features": [
    {
      "id": "smart-sync",
      "title": "Shared Spec Editing",
      "module": "collaboration",
      "version": "v1",
      "status": "in-progress",
      "priority": "high",
      "depends_on": ["realtime-foundation"],
      "path": "versions/v1/features/smart-sync.md"
    },
    {
      "id": "review-queue",
      "title": "Review Inbox",
      "module": "operations",
      "version": "mvp",
      "status": "ready",
      "priority": "medium",
      "depends_on": [],
      "path": "versions/mvp/features/review-queue.md"
    }
  ],
  "generated_from": "docs"
}
```

```json
// spec-driven-docs/assets/viewer/tests/fixtures/basic/docs/_meta/task-board.json
{
  "tasks": [
    {
      "id": "v1-smart-sync-01",
      "title": "Presence and Edit Locking",
      "feature": "smart-sync",
      "version": "v1",
      "status": "ready",
      "owner": "agent-a",
      "path": "versions/v1/iterations/v1-smart-sync-01.md"
    }
  ],
  "generated_from": "docs"
}
```

```json
// spec-driven-docs/assets/viewer/tests/fixtures/basic/docs/_meta/delivery-state.json
{
  "branch": "feature/spec-docs",
  "updated_at": "2026-04-14",
  "implemented_versions": ["mvp"],
  "in_progress_features": ["smart-sync"],
  "ready_packets": ["v1-smart-sync-01"],
  "path": "current-state.md",
  "generated_from": "docs"
}
```

- [ ] **Step 2: Install dependencies and run the test to verify it fails**

Run:

```bash
npm --prefix spec-driven-docs/assets/viewer install
npm --prefix spec-driven-docs/assets/viewer exec vitest run src/lib/docs-loader.test.ts
```

Expected: FAIL with `Cannot find module './docs-loader'` or missing `loadWorkspaceDocs` export.

- [ ] **Step 3: Write the minimal docs loader and contract types**

```ts
// spec-driven-docs/assets/viewer/src/test/fixture-path.ts
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export function fixturePath(name: string): string {
  return path.resolve(here, "../../tests/fixtures", name);
}
```

```ts
// spec-driven-docs/assets/viewer/src/lib/contracts.ts
export type Status =
  | "planned"
  | "ready"
  | "in-progress"
  | "done"
  | "blocked"
  | "superseded"
  | "unknown";

export interface FeatureRecord {
  id: string;
  title: string;
  module: string;
  version: string;
  status: Status;
  priority: string;
  depends_on: string[];
  path: string;
}

export interface PacketRecord {
  id: string;
  title: string;
  feature: string;
  version: string;
  status: Status;
  owner: string;
  path: string;
}

export interface DeliveryState {
  branch: string;
  updated_at: string;
  implemented_versions: string[];
  in_progress_features: string[];
  ready_packets: string[];
  path: string;
  generated_from: string;
}

export interface WorkspaceDocs {
  features: FeatureRecord[];
  packets: PacketRecord[];
  packetsByFeature: Record<string, PacketRecord[]>;
  delivery: DeliveryState;
}
```

```ts
// spec-driven-docs/assets/viewer/src/lib/docs-loader.ts
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { DeliveryState, FeatureRecord, PacketRecord, WorkspaceDocs } from "./contracts";

async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

export async function loadWorkspaceDocs(workspaceRoot: string): Promise<WorkspaceDocs> {
  const metaDir = path.join(workspaceRoot, "docs", "_meta");

  const featurePayload = await readJsonFile<{ features: FeatureRecord[] }>(
    path.join(metaDir, "feature-index.json")
  );
  const taskPayload = await readJsonFile<{ tasks: PacketRecord[] }>(
    path.join(metaDir, "task-board.json")
  );
  const delivery = await readJsonFile<DeliveryState>(
    path.join(metaDir, "delivery-state.json")
  );

  const packetsByFeature = taskPayload.tasks.reduce<Record<string, PacketRecord[]>>((acc, packet) => {
    acc[packet.feature] ??= [];
    acc[packet.feature].push(packet);
    return acc;
  }, {});

  return {
    features: featurePayload.features,
    packets: taskPayload.tasks,
    packetsByFeature,
    delivery
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
npm --prefix spec-driven-docs/assets/viewer exec vitest run src/lib/docs-loader.test.ts
```

Expected: PASS with `1 passed`.

- [ ] **Step 5: Commit**

```bash
git add spec-driven-docs/assets/viewer
git commit -m "feat(spec-driven-docs): scaffold viewer package"
```

### Task 2: Add workspace health checks and normalize the UI-facing model

**Files:**
- Modify: `spec-driven-docs/assets/viewer/src/lib/contracts.ts`
- Modify: `spec-driven-docs/assets/viewer/src/lib/docs-loader.ts`
- Create: `spec-driven-docs/assets/viewer/src/lib/docs-loader.health.test.ts`
- Create: `spec-driven-docs/assets/viewer/tests/fixtures/missing-meta/`
- Create: `spec-driven-docs/assets/viewer/tests/fixtures/stale-meta/docs/versions/v1/iterations/v1-smart-sync-01.md`

- [ ] **Step 1: Write failing tests for missing `_meta` and stale packet state**

```ts
// spec-driven-docs/assets/viewer/src/lib/docs-loader.health.test.ts
import { describe, expect, test } from "vitest";
import { loadWorkspaceDocs } from "./docs-loader";
import { fixturePath } from "../test/fixture-path";

describe("loadWorkspaceDocs health", () => {
  test("reports blocking error when docs/_meta is missing", async () => {
    await expect(loadWorkspaceDocs(fixturePath("missing-meta"))).rejects.toThrow(
      "Missing docs/_meta"
    );
  });

  test("reports stale-meta warning when packet markdown exists but indexes are incomplete", async () => {
    const workspace = await loadWorkspaceDocs(fixturePath("stale-meta"));

    expect(workspace.health.level).toBe("warning");
    expect(workspace.health.messages).toContain(
      "Packet markdown exists but docs/_meta indexes are incomplete or stale."
    );
  });
});
```

- [ ] **Step 2: Run the health tests to verify they fail**

Run:

```bash
npm --prefix spec-driven-docs/assets/viewer exec vitest run src/lib/docs-loader.health.test.ts
```

Expected: FAIL because `WorkspaceDocs.health` does not exist and missing `_meta` is not surfaced with the expected message.

- [ ] **Step 3: Extend the loader with health reporting and derived packet counts**

```ts
// spec-driven-docs/assets/viewer/src/lib/contracts.ts
export interface WorkspaceHealth {
  level: "ok" | "warning" | "error";
  messages: string[];
}

export interface FeatureRecord {
  id: string;
  title: string;
  module: string;
  version: string;
  status: Status;
  priority: string;
  depends_on: string[];
  path: string;
  packet_counts?: Partial<Record<Status, number>>;
}

export interface WorkspaceDocs {
  features: FeatureRecord[];
  packets: PacketRecord[];
  packetsByFeature: Record<string, PacketRecord[]>;
  delivery: DeliveryState;
  health: WorkspaceHealth;
}
```

```ts
// spec-driven-docs/assets/viewer/src/lib/docs-loader.ts
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { DeliveryState, FeatureRecord, PacketRecord, Status, WorkspaceDocs } from "./contracts";

function countPacketsByStatus(packets: PacketRecord[]): Partial<Record<Status, number>> {
  return packets.reduce<Partial<Record<Status, number>>>((acc, packet) => {
    acc[packet.status] = (acc[packet.status] ?? 0) + 1;
    return acc;
  }, {});
}

async function packetMarkdownExists(workspaceRoot: string): Promise<boolean> {
  const versionsDir = path.join(workspaceRoot, "docs", "versions");
  try {
    await access(versionsDir);
  } catch {
    return false;
  }

  const versionDirs = await readdir(versionsDir, { withFileTypes: true });
  for (const versionDir of versionDirs) {
    if (!versionDir.isDirectory()) continue;
    const iterationsDir = path.join(versionsDir, versionDir.name, "iterations");
    try {
      const files = await readdir(iterationsDir);
      if (files.some((file) => file.endsWith(".md"))) return true;
    } catch {
      continue;
    }
  }

  return false;
}

export async function loadWorkspaceDocs(workspaceRoot: string): Promise<WorkspaceDocs> {
  const metaDir = path.join(workspaceRoot, "docs", "_meta");
  try {
    await access(metaDir);
  } catch {
    throw new Error(`Missing docs/_meta in ${workspaceRoot}. Run spec-driven docs sync first.`);
  }

  const featurePayload = await readJsonFile<{ features: FeatureRecord[] }>(
    path.join(metaDir, "feature-index.json")
  );
  const taskPayload = await readJsonFile<{ tasks: PacketRecord[] }>(
    path.join(metaDir, "task-board.json")
  );
  const delivery = await readJsonFile<DeliveryState>(
    path.join(metaDir, "delivery-state.json")
  );

  const packetsByFeature = taskPayload.tasks.reduce<Record<string, PacketRecord[]>>((acc, packet) => {
    acc[packet.feature] ??= [];
    acc[packet.feature].push(packet);
    return acc;
  }, {});

  const features = featurePayload.features.map((feature) => ({
    ...feature,
    packet_counts: countPacketsByStatus(packetsByFeature[feature.id] ?? [])
  }));

  const stalePacketDocs = (await packetMarkdownExists(workspaceRoot)) && taskPayload.tasks.length === 0;

  return {
    features,
    packets: taskPayload.tasks,
    packetsByFeature,
    delivery,
    health: {
      level: stalePacketDocs ? "warning" : "ok",
      messages: stalePacketDocs
        ? ["Packet markdown exists but docs/_meta indexes are incomplete or stale."]
        : []
    }
  };
}
```

- [ ] **Step 4: Run the loader test suite**

Run:

```bash
npm --prefix spec-driven-docs/assets/viewer exec vitest run src/lib/docs-loader.test.ts src/lib/docs-loader.health.test.ts
```

Expected: PASS with both loader specs green.

- [ ] **Step 5: Commit**

```bash
git add spec-driven-docs/assets/viewer/src/lib spec-driven-docs/assets/viewer/tests/fixtures
git commit -m "feat(spec-driven-docs): add viewer workspace health model"
```

### Task 3: Implement markdown prompt extraction and deterministic fallback prompt generation

**Files:**
- Create: `spec-driven-docs/assets/viewer/src/lib/prompt.ts`
- Create: `spec-driven-docs/assets/viewer/src/lib/prompt.test.ts`
- Create: `spec-driven-docs/assets/viewer/tests/fixtures/basic/docs/versions/v1/iterations/v1-smart-sync-01.md`
- Modify: `spec-driven-docs/assets/viewer/src/lib/contracts.ts`

- [ ] **Step 1: Write failing tests for packet prompt extraction and fallback generation**

```ts
// spec-driven-docs/assets/viewer/src/lib/prompt.test.ts
import { describe, expect, test } from "vitest";
import path from "node:path";
import { buildPromptPayload } from "./prompt";
import { loadWorkspaceDocs } from "./docs-loader";
import { fixturePath } from "../test/fixture-path";

describe("buildPromptPayload", () => {
  test("extracts the suggested prompt from packet markdown when present", async () => {
    const workspaceRoot = fixturePath("basic");
    const workspace = await loadWorkspaceDocs(workspaceRoot);

    const payload = await buildPromptPayload({
      workspaceRoot,
      workspace,
      packetId: "v1-smart-sync-01"
    });

    expect(payload.source).toBe("packet");
    expect(payload.prompt).toContain("Use $spec-driven-docs to sync documentation after implementing packet v1-smart-sync-01.");
  });

  test("generates a fallback prompt when packet markdown has no suggested prompt", async () => {
    const workspaceRoot = fixturePath("basic");
    const workspace = await loadWorkspaceDocs(workspaceRoot);

    const payload = await buildPromptPayload({
      workspaceRoot,
      workspace,
      packetId: "review-queue-01"
    });

    expect(payload.source).toBe("generated");
    expect(payload.prompt).toContain("Implement packet review-queue-01 only.");
    expect(payload.prompt).toContain("After implementation, use $spec-driven-docs to sync documentation.");
  });
});
```

- [ ] **Step 2: Run the prompt tests to verify they fail**

Run:

```bash
npm --prefix spec-driven-docs/assets/viewer exec vitest run src/lib/prompt.test.ts
```

Expected: FAIL because `buildPromptPayload` does not exist.

- [ ] **Step 3: Implement prompt extraction and fallback generation**

```ts
// spec-driven-docs/assets/viewer/src/lib/prompt.ts
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { WorkspaceDocs } from "./contracts";

export interface PromptPayload {
  source: "packet" | "generated";
  prompt: string;
}

const SUGGESTED_PROMPT_PATTERN =
  /Suggested follow-up prompt:\s*`([^`]+)`/i;

function buildFallbackPrompt(workspace: WorkspaceDocs, packetId: string): string {
  const packet = workspace.packets.find((candidate) => candidate.id === packetId);
  if (!packet) throw new Error(`Unknown packet: ${packetId}`);

  const feature = workspace.features.find((candidate) => candidate.id === packet.feature);
  if (!feature) throw new Error(`Unknown feature for packet: ${packetId}`);

  return [
    `Implement packet ${packet.id} only.`,
    `Start by reading ${feature.path} and ${packet.path}.`,
    `Respect the current repository boundary and do not expand scope beyond ${feature.id}.`,
    `Focus on the ${packet.title} slice for feature ${feature.title}.`,
    `Current branch context: ${workspace.delivery.branch}.`,
    `After implementation, use $spec-driven-docs to sync documentation.`,
    `Refresh docs/_meta indexes and update packet, feature, and current-state status if delivery state changed.`
  ].join(" ");
}

export async function buildPromptPayload(args: {
  workspaceRoot: string;
  workspace: WorkspaceDocs;
  packetId: string;
}): Promise<PromptPayload> {
  const packet = args.workspace.packets.find((candidate) => candidate.id === args.packetId);
  if (!packet) throw new Error(`Unknown packet: ${args.packetId}`);

  const packetMarkdownPath = path.join(args.workspaceRoot, "docs", packet.path);
  const packetMarkdown = await readFile(packetMarkdownPath, "utf-8").catch(() => "");
  const match = packetMarkdown.match(SUGGESTED_PROMPT_PATTERN);

  if (match) {
    return {
      source: "packet",
      prompt: match[1].trim()
    };
  }

  return {
    source: "generated",
    prompt: buildFallbackPrompt(args.workspace, args.packetId)
  };
}
```

- [ ] **Step 4: Run the docs-loader and prompt tests**

Run:

```bash
npm --prefix spec-driven-docs/assets/viewer exec vitest run src/lib/docs-loader.test.ts src/lib/docs-loader.health.test.ts src/lib/prompt.test.ts
```

Expected: PASS with all workspace and prompt specs green.

- [ ] **Step 5: Commit**

```bash
git add spec-driven-docs/assets/viewer/src/lib spec-driven-docs/assets/viewer/tests/fixtures/basic/docs/versions
git commit -m "feat(spec-driven-docs): add packet prompt extraction"
```

### Task 4: Build the CLI server and API surface for the viewer

**Files:**
- Create: `spec-driven-docs/assets/viewer/src/server.ts`
- Create: `spec-driven-docs/assets/viewer/src/cli.ts`
- Create: `spec-driven-docs/assets/viewer/src/server.test.ts`
- Modify: `spec-driven-docs/assets/viewer/package.json`
- Modify: `spec-driven-docs/assets/viewer/tsconfig.json`

- [ ] **Step 1: Write the failing server test**

```ts
// spec-driven-docs/assets/viewer/src/server.test.ts
import { afterEach, describe, expect, test } from "vitest";
import { startViewerServer } from "./server";
import { fixturePath } from "./test/fixture-path";

describe("startViewerServer", () => {
  const servers: Array<{ close: () => Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(servers.map((server) => server.close()));
    servers.length = 0;
  });

  test("serves workspace data and prompt payloads", async () => {
    const server = await startViewerServer({
      workspaceRoot: fixturePath("basic"),
      host: "127.0.0.1",
      port: 0,
      openBrowser: false
    });
    servers.push(server);

    const workspaceRes = await fetch(`${server.url}/api/workspace`);
    const workspace = await workspaceRes.json();

    const promptRes = await fetch(`${server.url}/api/prompt/v1-smart-sync-01`);
    const prompt = await promptRes.json();

    expect(workspace.delivery.branch).toBe("feature/spec-docs");
    expect(prompt.source).toBe("packet");
  });
});
```

- [ ] **Step 2: Run the server test to verify it fails**

Run:

```bash
npm --prefix spec-driven-docs/assets/viewer exec vitest run src/server.test.ts
```

Expected: FAIL because `startViewerServer` does not exist.

- [ ] **Step 3: Implement the minimal HTTP server and CLI entrypoint**

```ts
// spec-driven-docs/assets/viewer/src/server.ts
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import open from "open";
import { loadWorkspaceDocs } from "./lib/docs-loader";
import { buildPromptPayload } from "./lib/prompt";

const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(here, "../dist");

export async function startViewerServer(args: {
  workspaceRoot: string;
  host: string;
  port: number;
  openBrowser: boolean;
}) {
  const workspace = await loadWorkspaceDocs(args.workspaceRoot);
  const app = express();

  app.get("/api/workspace", async (_req, res) => {
    res.json(workspace);
  });

  app.get("/api/prompt/:packetId", async (req, res) => {
    const payload = await buildPromptPayload({
      workspaceRoot: args.workspaceRoot,
      workspace,
      packetId: req.params.packetId
    });
    res.json(payload);
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
  if (args.openBrowser) await open(url);

  return {
    url,
    async close() {
      await new Promise<void>((resolve, reject) => {
        listener.close((error) => (error ? reject(error) : resolve()));
      });
    }
  };
}
```

```ts
// spec-driven-docs/assets/viewer/src/cli.ts
import path from "node:path";
import { startViewerServer } from "./server";

const workspaceRoot = process.cwd();

startViewerServer({
  workspaceRoot,
  host: "127.0.0.1",
  port: 0,
  openBrowser: true
})
  .then((server) => {
    process.stdout.write(`Spec-driven docs viewer running at ${server.url}\n`);
  })
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
```

- [ ] **Step 4: Run server and prompt tests**

Run:

```bash
npm --prefix spec-driven-docs/assets/viewer exec vitest run src/server.test.ts src/lib/prompt.test.ts
```

Expected: PASS with API and prompt behavior green.

- [ ] **Step 5: Commit**

```bash
git add spec-driven-docs/assets/viewer/src/server.ts spec-driven-docs/assets/viewer/src/cli.ts spec-driven-docs/assets/viewer/src/server.test.ts spec-driven-docs/assets/viewer/package.json spec-driven-docs/assets/viewer/tsconfig.json
git commit -m "feat(spec-driven-docs): add viewer cli server"
```

### Task 5: Implement the React workspace UI with feature board, drilldown pane, and copy action

**Files:**
- Create: `spec-driven-docs/assets/viewer/src/main.tsx`
- Create: `spec-driven-docs/assets/viewer/src/App.tsx`
- Create: `spec-driven-docs/assets/viewer/src/styles.css`
- Create: `spec-driven-docs/assets/viewer/src/components/FeatureBoard.tsx`
- Create: `spec-driven-docs/assets/viewer/src/components/FeatureDetailPane.tsx`
- Create: `spec-driven-docs/assets/viewer/src/components/PacketBoard.tsx`
- Create: `spec-driven-docs/assets/viewer/src/components/PacketDetail.tsx`
- Create: `spec-driven-docs/assets/viewer/src/App.test.tsx`

- [ ] **Step 1: Write the failing UI test for feature selection, packet drilldown, and copy prompt**

```tsx
// spec-driven-docs/assets/viewer/src/App.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { App } from "./App";

const workspacePayload = {
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
      packet_counts: { ready: 1 }
    }
  ],
  packets: [
    {
      id: "v1-smart-sync-01",
      title: "Presence and Edit Locking",
      feature: "smart-sync",
      version: "v1",
      status: "ready",
      owner: "agent-a",
      path: "versions/v1/iterations/v1-smart-sync-01.md"
    }
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
        path: "versions/v1/iterations/v1-smart-sync-01.md"
      }
    ]
  },
  delivery: {
    branch: "feature/spec-docs",
    updated_at: "2026-04-14",
    implemented_versions: ["mvp"],
    in_progress_features: ["smart-sync"],
    ready_packets: ["v1-smart-sync-01"],
    path: "current-state.md",
    generated_from: "docs"
  },
  health: { level: "ok", messages: [] }
};

describe("App", () => {
  test("renders the feature board, drills into packet view, and copies prompt", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn();
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/api/workspace")) {
        return new Response(JSON.stringify(workspacePayload));
      }
      return new Response(JSON.stringify({
        source: "packet",
        prompt: "Implement packet v1-smart-sync-01 only."
      }));
    }));
    vi.stubGlobal("navigator", {
      clipboard: { writeText }
    });

    render(<App />);

    await screen.findByText("Shared Spec Editing");
    await user.click(screen.getByText("Shared Spec Editing"));
    await user.click(screen.getByText("Presence and Edit Locking"));
    await user.click(screen.getByRole("button", { name: "Copy Prompt" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("Implement packet v1-smart-sync-01 only.");
    });
  });
});
```

- [ ] **Step 2: Run the UI test to verify it fails**

Run:

```bash
npm --prefix spec-driven-docs/assets/viewer exec vitest run src/App.test.tsx
```

Expected: FAIL because `App` and its components do not exist.

- [ ] **Step 3: Implement the SPA and the status-first feature board**

```tsx
// spec-driven-docs/assets/viewer/src/App.tsx
import { useEffect, useState } from "react";
import type { FeatureRecord, PacketRecord, WorkspaceDocs } from "./lib/contracts";
import { FeatureBoard } from "./components/FeatureBoard";
import { FeatureDetailPane } from "./components/FeatureDetailPane";
import "./styles.css";

const FEATURE_COLUMNS = ["planned", "ready", "in-progress", "done"] as const;

export function App() {
  const [workspace, setWorkspace] = useState<WorkspaceDocs | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<FeatureRecord | null>(null);
  const [selectedPacket, setSelectedPacket] = useState<PacketRecord | null>(null);
  const [copiedPromptSource, setCopiedPromptSource] = useState<string>("");

  useEffect(() => {
    fetch("/api/workspace")
      .then((response) => response.json())
      .then((payload: WorkspaceDocs) => setWorkspace(payload));
  }, []);

  async function handleCopyPrompt(packet: PacketRecord) {
    const response = await fetch(`/api/prompt/${packet.id}`);
    const payload = await response.json();
    await navigator.clipboard.writeText(payload.prompt);
    setCopiedPromptSource(payload.source);
  }

  if (!workspace) return <div className="app-shell">Loading viewer…</div>;

  const grouped = FEATURE_COLUMNS.map((status) => ({
    status,
    items: workspace.features.filter((feature) => feature.status === status)
  }));

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Spec-Driven Docs Viewer</h1>
          <p>{workspace.delivery.branch} • {workspace.delivery.updated_at}</p>
        </div>
        <div className={`health health-${workspace.health.level}`}>{workspace.health.level}</div>
      </header>

      <main className="workspace">
        <FeatureBoard
          columns={grouped}
          selectedFeatureId={selectedFeature?.id ?? null}
          onSelectFeature={(feature) => {
            setSelectedFeature(feature);
            setSelectedPacket(null);
          }}
        />
        <FeatureDetailPane
          feature={selectedFeature}
          packets={selectedFeature ? workspace.packetsByFeature[selectedFeature.id] ?? [] : []}
          selectedPacketId={selectedPacket?.id ?? null}
          copiedPromptSource={copiedPromptSource}
          onSelectPacket={setSelectedPacket}
          onCopyPrompt={handleCopyPrompt}
        />
      </main>
    </div>
  );
}
```

```tsx
// spec-driven-docs/assets/viewer/src/components/FeatureBoard.tsx
import type { FeatureRecord } from "../lib/contracts";

export function FeatureBoard(props: {
  columns: Array<{ status: string; items: FeatureRecord[] }>;
  selectedFeatureId: string | null;
  onSelectFeature: (feature: FeatureRecord) => void;
}) {
  return (
    <section className="feature-board">
      {props.columns.map((column) => (
        <div key={column.status} className="board-column">
          <h2>{column.status}</h2>
          {column.items.map((feature) => (
            <button
              key={feature.id}
              className={`feature-card ${props.selectedFeatureId === feature.id ? "selected" : ""}`}
              onClick={() => props.onSelectFeature(feature)}
            >
              <strong>{feature.title}</strong>
              <span>{feature.id}</span>
              <span>{feature.version} • {feature.module}</span>
              <span>ready packets: {feature.packet_counts?.ready ?? 0}</span>
            </button>
          ))}
        </div>
      ))}
    </section>
  );
}
```

```tsx
// spec-driven-docs/assets/viewer/src/components/FeatureDetailPane.tsx
import type { FeatureRecord, PacketRecord } from "../lib/contracts";
import { PacketBoard } from "./PacketBoard";
import { PacketDetail } from "./PacketDetail";

export function FeatureDetailPane(props: {
  feature: FeatureRecord | null;
  packets: PacketRecord[];
  selectedPacketId: string | null;
  copiedPromptSource: string;
  onSelectPacket: (packet: PacketRecord) => void;
  onCopyPrompt: (packet: PacketRecord) => Promise<void>;
}) {
  if (!props.feature) {
    return <aside className="detail-pane empty">Select a feature to inspect packet implementation detail.</aside>;
  }

  const selectedPacket = props.packets.find((packet) => packet.id === props.selectedPacketId) ?? null;

  return (
    <aside className="detail-pane">
      <header>
        <h2>{props.feature.title}</h2>
        <p>{props.feature.id} • {props.feature.version} • {props.feature.module}</p>
      </header>
      <PacketBoard packets={props.packets} selectedPacketId={props.selectedPacketId} onSelectPacket={props.onSelectPacket} />
      <PacketDetail packet={selectedPacket} copiedPromptSource={props.copiedPromptSource} onCopyPrompt={props.onCopyPrompt} />
    </aside>
  );
}
```

- [ ] **Step 4: Run the UI test and the whole viewer suite**

Run:

```bash
npm --prefix spec-driven-docs/assets/viewer exec vitest run
```

Expected: PASS with loader, prompt, server, and UI tests all green.

- [ ] **Step 5: Commit**

```bash
git add spec-driven-docs/assets/viewer/src spec-driven-docs/assets/viewer/index.html spec-driven-docs/assets/viewer/vite.config.ts spec-driven-docs/assets/viewer/vitest.config.ts
git commit -m "feat(spec-driven-docs): add viewer workspace ui"
```

### Task 6: Wire the built package into the skill contract and verify release-ready behavior

**Files:**
- Modify: `spec-driven-docs/SKILL.md`
- Modify: `spec-driven-docs/README.md`
- Modify: `spec-driven-docs/tests/test_skill_contract.py`
- Modify: `spec-driven-docs/assets/viewer/package.json`

- [ ] **Step 1: Write the failing integration test for skill docs and package exposure**

```python
# spec-driven-docs/tests/test_skill_contract.py
from __future__ import annotations

import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class SkillContractTests(unittest.TestCase):
    def test_role_prompt_templates_exist(self) -> None:
        expected = [
            ROOT / "agents" / "analyst-prompt.md",
            ROOT / "agents" / "architect-prompt.md",
            ROOT / "agents" / "developer-prompt.md",
            ROOT / "agents" / "reviewer-prompt.md",
        ]

        missing = [str(path) for path in expected if not path.exists()]
        self.assertEqual(missing, [])

    def test_evals_json_includes_role_based_scenarios(self) -> None:
        payload = json.loads((ROOT / "evals" / "evals.json").read_text(encoding="utf-8"))
        names = {item["name"] for item in payload["evals"]}

        self.assertIn("bootstrap-with-role-based-subagents", names)
        self.assertIn("feature-update-with-role-review-loop", names)
        self.assertIn("packet-preparation-with-technical-context", names)

    def test_skill_docs_reference_the_viewer_command(self) -> None:
        skill = (ROOT / "SKILL.md").read_text(encoding="utf-8")
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        package_json = json.loads((ROOT / "assets" / "viewer" / "package.json").read_text(encoding="utf-8"))

        self.assertIn("npx @contixly/spec-driven-docs-viewer", skill)
        self.assertIn("npx @contixly/spec-driven-docs-viewer", readme)
        self.assertEqual(package_json["bin"]["spec-driven-docs-viewer"], "./dist/cli.js")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the integration tests to verify they fail**

Run:

```bash
python3 -m unittest spec-driven-docs.tests.test_skill_contract
```

Expected: FAIL because `SKILL.md` and `README.md` do not yet mention the viewer command.

- [ ] **Step 3: Update the skill docs and package metadata, then verify the production build**

```md
<!-- spec-driven-docs/SKILL.md -->
## 6. Use the viewer

When the target repository already has `spec-driven-docs` outputs and the user wants a read-only board view:

1. Run `npx @contixly/spec-driven-docs-viewer` from the target repository root.
2. Let the viewer read `docs/_meta/*.json` and packet markdown from the current repository.
3. Use the feature board to drill into packet implementation detail and copy the next agent prompt.
4. If the viewer reports stale or missing `_meta` files, run the docs sync workflow first.
```

```md
<!-- spec-driven-docs/README.md -->
## Viewer

Launch the local read-only board from any repository that already contains `spec-driven-docs` outputs:

```bash
npx @contixly/spec-driven-docs-viewer
```

The command reads `docs/_meta/*.json` and packet markdown from the current repository, opens a local viewer, and lets you inspect feature status, drill into packet state, and copy the next implementation prompt.
```

```json
// spec-driven-docs/assets/viewer/package.json
{
  "name": "@contixly/spec-driven-docs-viewer",
  "version": "0.1.0",
  "private": false,
  "type": "module",
  "files": [
    "dist",
    "README.md"
  ],
  "bin": {
    "spec-driven-docs-viewer": "./dist/cli.js"
  }
}
```

Run:

```bash
python3 -m unittest spec-driven-docs.tests.test_skill_contract
npm --prefix spec-driven-docs/assets/viewer run build
```

Expected: PASS for both the Python integration test and the viewer production build.

- [ ] **Step 4: Smoke-test the built CLI against a fixture workspace**

Run:

```bash
node spec-driven-docs/assets/viewer/dist/cli.js --help
node spec-driven-docs/assets/viewer/dist/cli.js
```

Expected:

- first command prints CLI usage or at least exits cleanly
- second command prints a localhost URL when run from a repository containing `docs/_meta`

- [ ] **Step 5: Commit**

```bash
git add spec-driven-docs/SKILL.md spec-driven-docs/README.md spec-driven-docs/tests/test_skill_contract.py spec-driven-docs/assets/viewer/package.json
git commit -m "feat(spec-driven-docs): wire viewer into skill contract"
```

## Self-Review

- **Spec coverage:** The plan covers the isolated `npx` package, read-only workspace data loading, health/error states, status-first feature board, feature drilldown into packet kanban, markdown-first prompt extraction, JSON fallback prompts, and skill-level command exposure.
- **Placeholder scan:** The only assumption made concrete is the working package name `@contixly/spec-driven-docs-viewer`; it is intentionally fixed here so execution can proceed without ambiguity.
- **Type consistency:** The same core types and status vocabulary are carried from loader to prompt service to API layer to React UI, so later tasks do not invent conflicting field names.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-14-spec-driven-docs-viewer.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
