# Spec-Driven Docs Viewer Shadcn Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the full `spec-driven-docs-viewer` runtime, dev flow, and UI into `spec-driven-docs-viewer-shadcn`, keeping functional parity while replacing the old custom UI with a modular `shadcn` + Tailwind shell.

**Architecture:** Preserve the old viewer's normalized data contract and HTTP API, but split the new codebase into `src/server`, `src/client`, and `src/shared`. Port the runtime and store behavior first, then rebuild the React shell from small feature slices over the same contracts.

**Tech Stack:** Vite, React 19, TypeScript, Express, Vitest, Tailwind v4, shadcn/ui (`radix` base, `tabler` icons)

---

## File Map

### Package and build files

- Modify: `spec-driven-docs-viewer-shadcn/package.json`
  Make the new project the canonical package and add server, test, and CLI scripts.
- Create: `spec-driven-docs-viewer-shadcn/vitest.config.ts`
  Shared Vitest config for `jsdom` and `node` tests.
- Create: `spec-driven-docs-viewer-shadcn/tsconfig.build.json`
  Build config for CLI and server-side TypeScript output.
- Modify: `spec-driven-docs-viewer-shadcn/vite.config.ts`
  Keep the alias and Vite setup compatible with both client and dev server use.

### Shared files

- Create: `spec-driven-docs-viewer-shadcn/src/shared/contracts.ts`
  Canonical shared types copied from the old viewer contract.
- Create: `spec-driven-docs-viewer-shadcn/src/shared/status.ts`
  Shared status order, normalization, and labeling helpers.

### Server files

- Create: `spec-driven-docs-viewer-shadcn/src/server/workspace/docs-loader.ts`
  Reads `docs/_meta` and packet markdown into `WorkspaceDocs`.
- Create: `spec-driven-docs-viewer-shadcn/src/server/workspace/workspace-store.ts`
  Snapshot store, watchers, revision bumps, and subscriptions.
- Create: `spec-driven-docs-viewer-shadcn/src/server/workspace/prompt.ts`
  Prompt extraction and fallback generation.
- Create: `spec-driven-docs-viewer-shadcn/src/server/workspace/dev-source-registry.ts`
  Dev fixture and external source registry.
- Create: `spec-driven-docs-viewer-shadcn/src/server/workspace/runtime-options.ts`
  CLI/runtime option parsing.
- Create: `spec-driven-docs-viewer-shadcn/src/server/app/start-viewer-server.ts`
  Packaged runtime Express server.
- Create: `spec-driven-docs-viewer-shadcn/src/server/app/start-dev-server.ts`
  Dev-mode Express + Vite middleware server.
- Create: `spec-driven-docs-viewer-shadcn/src/server/cli.ts`
  Canonical CLI entrypoint for `spec-driven-docs-viewer`.

### Client files

- Modify: `spec-driven-docs-viewer-shadcn/src/main.tsx`
  Point to the new client app entry.
- Create: `spec-driven-docs-viewer-shadcn/src/client/app/App.tsx`
  Root app shell orchestrating hooks and feature slices.
- Create: `spec-driven-docs-viewer-shadcn/src/client/features/workspace-shell/WorkspaceShell.tsx`
  Main layout container for header, summary, board, and inspector.
- Create: `spec-driven-docs-viewer-shadcn/src/client/features/workspace-header/WorkspaceHeader.tsx`
  Top bar with title, health, branch, revision, and dev source switcher.
- Create: `spec-driven-docs-viewer-shadcn/src/client/features/workspace-summary/WorkspaceSummary.tsx`
  Summary metric row.
- Create: `spec-driven-docs-viewer-shadcn/src/client/features/source-switcher/SourceSwitcher.tsx`
  Dev-only source switch control.
- Create: `spec-driven-docs-viewer-shadcn/src/client/features/feature-board/FeatureBoard.tsx`
  Kanban board and status lanes.
- Create: `spec-driven-docs-viewer-shadcn/src/client/features/feature-board/FeatureCard.tsx`
  Feature card composition.
- Create: `spec-driven-docs-viewer-shadcn/src/client/features/feature-inspector/FeatureInspector.tsx`
  Sticky right inspector.
- Create: `spec-driven-docs-viewer-shadcn/src/client/features/packet-board/PacketBoard.tsx`
  Packet grouping by status for the inspector.
- Create: `spec-driven-docs-viewer-shadcn/src/client/features/packet-detail/PacketDetail.tsx`
  Packet metadata and copy action.
- Create: `spec-driven-docs-viewer-shadcn/src/client/features/command-palette/WorkspaceCommandPalette.tsx`
  Quick jump to features and packets.
- Create: `spec-driven-docs-viewer-shadcn/src/client/hooks/use-workspace-snapshot.ts`
- Create: `spec-driven-docs-viewer-shadcn/src/client/hooks/use-workspace-events.ts`
- Create: `spec-driven-docs-viewer-shadcn/src/client/hooks/use-feature-selection.ts`
- Create: `spec-driven-docs-viewer-shadcn/src/client/hooks/use-prompt-copy.ts`
- Create: `spec-driven-docs-viewer-shadcn/src/client/hooks/use-source-switcher.ts`
- Create: `spec-driven-docs-viewer-shadcn/src/client/hooks/use-responsive-inspector.ts`
- Modify: `spec-driven-docs-viewer-shadcn/src/index.css`
  Project theme tokens and layout utilities tuned for tracker density.

### Test files

- Create: `spec-driven-docs-viewer-shadcn/tests/server/start-viewer-server.test.ts`
- Create: `spec-driven-docs-viewer-shadcn/tests/server/start-dev-server.test.ts`
- Create: `spec-driven-docs-viewer-shadcn/tests/server/docs-loader.test.ts`
- Create: `spec-driven-docs-viewer-shadcn/tests/server/workspace-store.test.ts`
- Create: `spec-driven-docs-viewer-shadcn/tests/server/runtime-options.test.ts`
- Create: `spec-driven-docs-viewer-shadcn/tests/client/App.test.tsx`
- Create: `spec-driven-docs-viewer-shadcn/tests/client/WorkspaceCommandPalette.test.tsx`

---

### Task 1: Canonical Package and Test Scaffold

**Files:**
- Modify: `spec-driven-docs-viewer-shadcn/package.json`
- Create: `spec-driven-docs-viewer-shadcn/vitest.config.ts`
- Create: `spec-driven-docs-viewer-shadcn/tsconfig.build.json`
- Modify: `spec-driven-docs-viewer-shadcn/vite.config.ts`
- Test: `spec-driven-docs-viewer-shadcn/tests/server/start-viewer-server.test.ts`

- [ ] **Step 1: Write the failing runtime import smoke test**

```ts
// spec-driven-docs-viewer-shadcn/tests/server/start-viewer-server.test.ts
import { describe, expect, test } from "vitest"
import { startViewerServer } from "@/server/app/start-viewer-server"

describe("startViewerServer", () => {
  test("exports a callable runtime server factory", () => {
    expect(typeof startViewerServer).toBe("function")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/kroniak/Workspaces/github/contixly/skills/spec-driven-docs-viewer-shadcn && npx vitest run tests/server/start-viewer-server.test.ts`

Expected: FAIL with `Cannot find module '@/server/app/start-viewer-server'` or equivalent import error.

- [ ] **Step 3: Make the new project the canonical package and add test/build scripts**

```json
{
  "name": "@contixly/spec-driven-docs-viewer",
  "private": false,
  "scripts": {
    "dev": "vite",
    "build": "vite build && tsc -p tsconfig.build.json",
    "test": "vitest run",
    "check": "tsc -p tsconfig.json --noEmit",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "express": "^4.21.2",
    "open": "^10.1.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "jsdom": "^26.0.0",
    "tsx": "^4.19.2",
    "vitest": "^3.0.8"
  }
}
```

```ts
// spec-driven-docs-viewer-shadcn/vitest.config.ts
import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environmentMatchGlobs: [
      ["tests/client/**/*.test.tsx", "jsdom"],
      ["tests/server/**/*.test.ts", "node"]
    ]
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
})
```

```json
// spec-driven-docs-viewer-shadcn/tsconfig.build.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022"
  },
  "include": [
    "src/server/**/*.ts",
    "src/shared/**/*.ts"
  ]
}
```

- [ ] **Step 4: Add a minimal runtime export so the smoke test passes**

```ts
// spec-driven-docs-viewer-shadcn/src/server/app/start-viewer-server.ts
export async function startViewerServer() {
  throw new Error("Not implemented yet")
}
```

- [ ] **Step 5: Run the smoke test to verify the import contract passes**

Run: `cd /Users/kroniak/Workspaces/github/contixly/skills/spec-driven-docs-viewer-shadcn && npx vitest run tests/server/start-viewer-server.test.ts`

Expected: PASS with `1 passed`.

- [ ] **Step 6: Commit**

```bash
git -C /Users/kroniak/Workspaces/github/contixly/skills add \
  spec-driven-docs-viewer-shadcn/package.json \
  spec-driven-docs-viewer-shadcn/vitest.config.ts \
  spec-driven-docs-viewer-shadcn/tsconfig.build.json \
  spec-driven-docs-viewer-shadcn/src/server/app/start-viewer-server.ts \
  spec-driven-docs-viewer-shadcn/tests/server/start-viewer-server.test.ts
git -C /Users/kroniak/Workspaces/github/contixly/skills commit -m "build: bootstrap canonical shadcn viewer package"
```

### Task 2: Port Shared Contracts and Workspace Loading

**Files:**
- Create: `spec-driven-docs-viewer-shadcn/src/shared/contracts.ts`
- Create: `spec-driven-docs-viewer-shadcn/src/shared/status.ts`
- Create: `spec-driven-docs-viewer-shadcn/src/test/fixture-path.ts`
- Create: `spec-driven-docs-viewer-shadcn/src/server/workspace/docs-loader.ts`
- Create: `spec-driven-docs-viewer-shadcn/src/server/workspace/workspace-store.ts`
- Create: `spec-driven-docs-viewer-shadcn/src/server/workspace/prompt.ts`
- Create: `spec-driven-docs-viewer-shadcn/src/server/workspace/dev-source-registry.ts`
- Create: `spec-driven-docs-viewer-shadcn/src/server/workspace/runtime-options.ts`
- Create: `spec-driven-docs-viewer-shadcn/tests/fixtures/**`
- Test: `spec-driven-docs-viewer-shadcn/tests/server/docs-loader.test.ts`
- Test: `spec-driven-docs-viewer-shadcn/tests/server/workspace-store.test.ts`
- Test: `spec-driven-docs-viewer-shadcn/tests/server/runtime-options.test.ts`

- [ ] **Step 1: Copy the old contract and loader tests into the new project**

```ts
// spec-driven-docs-viewer-shadcn/tests/server/docs-loader.test.ts
import { describe, expect, test } from "vitest"
import { loadWorkspaceDocs } from "@/server/workspace/docs-loader"
import { fixturePath } from "../../src/test/fixture-path"

describe("loadWorkspaceDocs", () => {
  test("loads normalized features, packets, and health", async () => {
    const workspace = await loadWorkspaceDocs({
      workspaceRoot: fixturePath("basic"),
      mode: "runtime",
      revision: 1,
      source: { id: "workspace", kind: "workspace", label: "Workspace" }
    })

    expect(workspace.features[0]?.id).toBe("smart-sync")
    expect(workspace.meta.revision).toBe(1)
    expect(workspace.health.level).toBe("ok")
  })
})
```

- [ ] **Step 2: Run the server tests to verify they fail on missing modules**

Run: `cd /Users/kroniak/Workspaces/github/contixly/skills/spec-driven-docs-viewer-shadcn && npx vitest run tests/server/docs-loader.test.ts`

Expected: FAIL with missing imports under `@/server/workspace/*` or `@/shared/*`.

- [ ] **Step 3: Port shared contracts and status helpers first**

```ts
// spec-driven-docs-viewer-shadcn/src/shared/contracts.ts
export type Status =
  | "planned"
  | "ready"
  | "in-progress"
  | "done"
  | "blocked"
  | "superseded"
  | "unknown"

export interface WorkspaceDocs {
  features: FeatureRecord[]
  packets: PacketRecord[]
  packetsByFeature: Record<string, PacketRecord[]>
  delivery: DeliveryState
  health: WorkspaceHealth
  meta: WorkspaceSnapshotMeta
}
```

```ts
// spec-driven-docs-viewer-shadcn/src/test/fixture-path.ts
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))

export function fixturePath(name: string): string {
  return path.resolve(here, "../../tests/fixtures", name)
}
```

```ts
// spec-driven-docs-viewer-shadcn/src/shared/status.ts
import type { Status } from "./contracts"

export const FEATURE_STATUS_ORDER: Status[] = [
  "planned",
  "ready",
  "in-progress",
  "blocked",
  "done",
  "superseded",
  "unknown",
]

export function formatStatusLabel(status: string) {
  return status.replaceAll("-", " ")
}
```

- [ ] **Step 4: Copy the old fixture path helper and fixture tree before store-level test work**

Run:

```bash
cd /Users/kroniak/Workspaces/github/contixly/skills
mkdir -p spec-driven-docs-viewer-shadcn/src/test spec-driven-docs-viewer-shadcn/tests
cp spec-driven-docs-viewer/src/test/fixture-path.ts spec-driven-docs-viewer-shadcn/src/test/fixture-path.ts
cp -R spec-driven-docs-viewer/tests/fixtures spec-driven-docs-viewer-shadcn/tests/
```

Expected: `spec-driven-docs-viewer-shadcn/src/test/fixture-path.ts` exists and `spec-driven-docs-viewer-shadcn/tests/fixtures/` contains the copied workspace fixtures.

- [ ] **Step 5: Port the workspace loading, prompt, registry, and store logic with import path updates only**

```ts
// spec-driven-docs-viewer-shadcn/src/server/workspace/docs-loader.ts
import path from "node:path"
import type {
  DeliveryState,
  FeatureRecord,
  PacketRecord,
  ViewerSourceDescriptor,
  WorkspaceDocs,
} from "@/shared/contracts"
import { normalizeStatus } from "@/shared/status"
```

```ts
// spec-driven-docs-viewer-shadcn/src/server/workspace/workspace-store.ts
import { loadWorkspaceDocs } from "./docs-loader"
import type { ViewerSourceDescriptor, WorkspaceDocs } from "@/shared/contracts"

export function createWorkspaceStore(args: {
  workspaceRoot: string
  mode: "runtime" | "dev"
  source: ViewerSourceDescriptor
  availableSources?: ViewerSourceDescriptor[]
}) {
  let snapshot: WorkspaceDocs
  let revision = 0
  const listeners = new Set<() => void>()

  async function reload() {
    revision += 1
    snapshot = await loadWorkspaceDocs({ ...args, revision })
    listeners.forEach((listener) => listener())
  }

  return {
    getSnapshot() {
      return snapshot
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    async close() {
      listeners.clear()
    },
  }
}
```

- [ ] **Step 6: Run the targeted server tests until they all pass**

Run: `cd /Users/kroniak/Workspaces/github/contixly/skills/spec-driven-docs-viewer-shadcn && npx vitest run tests/server/docs-loader.test.ts tests/server/workspace-store.test.ts tests/server/runtime-options.test.ts`

Expected: PASS with all targeted server tests green.

- [ ] **Step 7: Commit**

```bash
git -C /Users/kroniak/Workspaces/github/contixly/skills add \
  spec-driven-docs-viewer-shadcn/src/shared \
  spec-driven-docs-viewer-shadcn/src/test/fixture-path.ts \
  spec-driven-docs-viewer-shadcn/src/server/workspace \
  spec-driven-docs-viewer-shadcn/tests/fixtures \
  spec-driven-docs-viewer-shadcn/tests/server/docs-loader.test.ts \
  spec-driven-docs-viewer-shadcn/tests/server/workspace-store.test.ts \
  spec-driven-docs-viewer-shadcn/tests/server/runtime-options.test.ts
git -C /Users/kroniak/Workspaces/github/contixly/skills commit -m "feat: port viewer workspace contracts and store"
```

### Task 2B: Fix NodeNext Build Compatibility For Shared Server Imports

**Files:**
- Modify: `spec-driven-docs-viewer-shadcn/src/shared/status.ts`
- Modify: `spec-driven-docs-viewer-shadcn/src/server/workspace/docs-loader.ts`
- Modify: `spec-driven-docs-viewer-shadcn/src/server/workspace/workspace-store.ts`
- Modify: `spec-driven-docs-viewer-shadcn/src/server/workspace/prompt.ts`
- Modify: `spec-driven-docs-viewer-shadcn/src/server/workspace/dev-source-registry.ts`
- Test: `spec-driven-docs-viewer-shadcn/tests/server/docs-loader.test.ts`
- Test: `spec-driven-docs-viewer-shadcn/tests/server/workspace-store.test.ts`
- Test: `spec-driven-docs-viewer-shadcn/tests/server/prompt.test.ts`
- Test: `spec-driven-docs-viewer-shadcn/tests/server/dev-source-registry.test.ts`

- [ ] **Step 1: Reproduce the build failure caused by `NodeNext` import resolution**

Run: `cd /Users/kroniak/Workspaces/github/contixly/skills/spec-driven-docs-viewer-shadcn && npm run build`

Expected: FAIL with `TS2307` errors for extensionless `@/shared/*` or `@/server/*` imports in the shared/workspace layer.

- [ ] **Step 2: Normalize the shared/workspace imports so they are `NodeNext`-compatible**

```ts
// spec-driven-docs-viewer-shadcn/src/server/workspace/docs-loader.ts
import type {
  DeliveryState,
  FeatureRecord,
  PacketRecord,
  ViewerSourceDescriptor,
  WorkspaceDocs,
} from "../../shared/contracts.js"
import { normalizeStatus } from "../../shared/status.js"
```

```ts
// spec-driven-docs-viewer-shadcn/src/server/workspace/workspace-store.ts
import type { ViewerSourceDescriptor, WorkspaceDocs } from "../../shared/contracts.js"
import { loadWorkspaceDocs } from "./docs-loader.js"
```

Use the same `.js`-specifier strategy consistently anywhere the server/shared build participates in `tsc -p tsconfig.build.json`.

- [ ] **Step 3: Re-run the targeted server tests to ensure import rewrites did not change behavior**

Run: `cd /Users/kroniak/Workspaces/github/contixly/skills/spec-driven-docs-viewer-shadcn && npx vitest run tests/server/docs-loader.test.ts tests/server/workspace-store.test.ts tests/server/prompt.test.ts tests/server/dev-source-registry.test.ts`

Expected: PASS with the targeted server tests green.

- [ ] **Step 4: Re-run the build to verify the server/shared layer now compiles**

Run: `cd /Users/kroniak/Workspaces/github/contixly/skills/spec-driven-docs-viewer-shadcn && npm run build`

Expected: either PASS, or failure moves forward into the currently in-progress Task 3 files only.

- [ ] **Step 5: Commit**

```bash
git -C /Users/kroniak/Workspaces/github/contixly/skills add \
  spec-driven-docs-viewer-shadcn/src/shared/status.ts \
  spec-driven-docs-viewer-shadcn/src/server/workspace/docs-loader.ts \
  spec-driven-docs-viewer-shadcn/src/server/workspace/workspace-store.ts \
  spec-driven-docs-viewer-shadcn/src/server/workspace/prompt.ts \
  spec-driven-docs-viewer-shadcn/src/server/workspace/dev-source-registry.ts
git -C /Users/kroniak/Workspaces/github/contixly/skills commit -m "build: fix server import compatibility for NodeNext"
```

### Task 3: Port Runtime Server, Dev Server, and CLI

**Files:**
- Modify: `spec-driven-docs-viewer-shadcn/src/server/app/start-viewer-server.ts`
- Create: `spec-driven-docs-viewer-shadcn/src/server/app/start-dev-server.ts`
- Create: `spec-driven-docs-viewer-shadcn/src/server/cli.ts`
- Modify: `spec-driven-docs-viewer-shadcn/package.json`
- Test: `spec-driven-docs-viewer-shadcn/tests/server/start-viewer-server.test.ts`
- Test: `spec-driven-docs-viewer-shadcn/tests/server/start-dev-server.test.ts`

- [ ] **Step 1: Copy the old runtime and dev server tests into the new paths**

```ts
// spec-driven-docs-viewer-shadcn/tests/server/start-dev-server.test.ts
import { afterEach, describe, expect, test } from "vitest"
import { startDevServer } from "@/server/app/start-dev-server"

describe("startDevServer", () => {
  test("serves the app through Vite middleware in dev mode", async () => {
    const server = await startDevServer({
      host: "127.0.0.1",
      port: 0,
      externalWorkspaceRoot: null,
    })

    const response = await fetch(server.url)
    const html = await response.text()

    expect(response.status).toBe(200)
    expect(html).toContain("/@vite/client")
  })
})
```

- [ ] **Step 2: Run the server tests to verify runtime and dev endpoints are still failing**

Run: `cd /Users/kroniak/Workspaces/github/contixly/skills/spec-driven-docs-viewer-shadcn && npx vitest run tests/server/start-viewer-server.test.ts tests/server/start-dev-server.test.ts`

Expected: FAIL with missing route behavior, placeholder errors, or missing exports.

- [ ] **Step 3: Port the old Express server code into the new server/app paths**

```ts
// spec-driven-docs-viewer-shadcn/src/server/app/start-viewer-server.ts
import express from "express"
import path from "node:path"
import { buildPromptPayload } from "@/server/workspace/prompt"
import { createWorkspaceStore } from "@/server/workspace/workspace-store"

export async function startViewerServer(args: {
  mode: "runtime" | "dev"
  workspaceRoot: string
  host: string
  port: number
  source?: ViewerSourceDescriptor
}) {
  const app = express()
  const store = await createWorkspaceStore({
    workspaceRoot: args.workspaceRoot,
    mode: args.mode,
    source: args.source ?? { id: "workspace", kind: "workspace", label: "Workspace" },
  })

  app.get("/api/workspace", (_req, res) => res.json(store.getSnapshot()))
  app.get("/api/events", (_req, res) => {
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8")
    res.write(`data: ${JSON.stringify({ revision: store.getSnapshot().meta.revision })}\n\n`)
  })
  app.get("/api/prompt/:packetId", async (req, res) => {
    const payload = await buildPromptPayload({
      workspaceRoot: args.workspaceRoot,
      workspace: store.getSnapshot(),
      packetId: req.params.packetId,
    })
    res.json(payload)
  })
}
```

```ts
// spec-driven-docs-viewer-shadcn/src/server/app/start-dev-server.ts
import { createServer as createViteServer } from "vite"
import { createDevSourceRegistry } from "@/server/workspace/dev-source-registry"
import { createWorkspaceStore } from "@/server/workspace/workspace-store"

export async function startDevServer(args: {
  host: string
  port: number
  externalWorkspaceRoot: string | null
}) {
  const registry = createDevSourceRegistry({ externalWorkspaceRoot: args.externalWorkspaceRoot })
  const vite = await createViteServer({
    root: process.cwd(),
    server: { middlewareMode: true },
    appType: "custom",
  })
  const activeSource = registry.get("dense-portfolio")
  const store = await createWorkspaceStore({
    workspaceRoot: activeSource.workspaceRoot,
    mode: "dev",
    source: { id: activeSource.id, kind: activeSource.kind, label: activeSource.label },
    availableSources: registry.list().map(({ id, kind, label }) => ({ id, kind, label })),
  })

  // Keep /api/workspace, /api/events, /api/prompt/:packetId, and /api/dev/source behavior aligned with the old dev server.
}
```

```ts
// spec-driven-docs-viewer-shadcn/src/server/cli.ts
#!/usr/bin/env node
import open from "open"
import { parseRuntimeOptions } from "@/server/workspace/runtime-options"
import { startViewerServer } from "@/server/app/start-viewer-server"

const options = parseRuntimeOptions(process.argv.slice(2))
const server = await startViewerServer({
  mode: "runtime",
  workspaceRoot: options.workspaceRoot,
  host: options.host,
  port: options.port,
})

console.log(server.url)
if (options.openBrowser) {
  await open(server.url)
}
```

- [ ] **Step 4: Finalize the canonical package runtime contract now that the entrypoints exist**

```json
// spec-driven-docs-viewer-shadcn/package.json
{
  "bin": {
    "spec-driven-docs-viewer": "./dist/server/cli.js"
  },
  "scripts": {
    "dev": "tsx src/server/app/start-dev-server.ts",
    "build": "vite build && tsc -p tsconfig.build.json && chmod +x dist/server/cli.js",
    "test": "vitest run",
    "check": "tsc -p tsconfig.json --noEmit",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  }
}
```

- [ ] **Step 5: Run the runtime and dev tests until parity is restored**

Run: `cd /Users/kroniak/Workspaces/github/contixly/skills/spec-driven-docs-viewer-shadcn && npx vitest run tests/server/start-viewer-server.test.ts tests/server/start-dev-server.test.ts`

Expected: PASS with runtime routes, SSE revisions, and dev source switching all green.

- [ ] **Step 6: Verify the build emits the CLI**

Run: `cd /Users/kroniak/Workspaces/github/contixly/skills/spec-driven-docs-viewer-shadcn && npm run build`

Expected: PASS with `dist/server/cli.js` created and no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git -C /Users/kroniak/Workspaces/github/contixly/skills add \
  spec-driven-docs-viewer-shadcn/src/server/app \
  spec-driven-docs-viewer-shadcn/src/server/cli.ts \
  spec-driven-docs-viewer-shadcn/package.json \
  spec-driven-docs-viewer-shadcn/tests/server/start-viewer-server.test.ts \
  spec-driven-docs-viewer-shadcn/tests/server/start-dev-server.test.ts
git -C /Users/kroniak/Workspaces/github/contixly/skills commit -m "feat: port viewer runtime and dev servers"
```

### Task 4: Install Shadcn Primitives and Build the Workspace Shell

**Files:**
- Modify: `spec-driven-docs-viewer-shadcn/src/index.css`
- Modify: `spec-driven-docs-viewer-shadcn/src/main.tsx`
- Create: `spec-driven-docs-viewer-shadcn/src/client/app/App.tsx`
- Create: `spec-driven-docs-viewer-shadcn/src/client/features/workspace-shell/WorkspaceShell.tsx`
- Create: `spec-driven-docs-viewer-shadcn/src/client/features/workspace-header/WorkspaceHeader.tsx`
- Create: `spec-driven-docs-viewer-shadcn/src/client/features/workspace-summary/WorkspaceSummary.tsx`
- Create: `spec-driven-docs-viewer-shadcn/src/client/features/source-switcher/SourceSwitcher.tsx`
- Test: `spec-driven-docs-viewer-shadcn/tests/client/App.test.tsx`

- [ ] **Step 1: Write the failing client smoke test for summary and header rendering**

```tsx
// spec-driven-docs-viewer-shadcn/tests/client/App.test.tsx
import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import { App } from "@/client/app/App"

describe("App", () => {
  test("shows the workspace summary ribbon", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      features: [],
      packets: [],
      packetsByFeature: {},
      delivery: {
        branch: "feature/spec-docs",
        updated_at: "2026-04-16",
        implemented_versions: ["mvp"],
        in_progress_features: [],
        ready_packets: [],
        path: "current-state.md",
        generated_from: "docs"
      },
      health: { level: "ok", messages: [] },
      meta: {
        mode: "runtime",
        revision: 1,
        source: { id: "workspace", kind: "workspace", label: "Workspace" }
      }
    }))))

    render(<App />)

    expect(await screen.findByLabelText("Workspace summary")).toBeInTheDocument()
    expect(screen.getByText("HEALTH")).toBeInTheDocument()
    expect(screen.getByText("BRANCH")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Install the approved shadcn component set**

Run:

```bash
cd /Users/kroniak/Workspaces/github/contixly/skills/spec-driven-docs-viewer-shadcn
npx shadcn@latest add card badge input select separator scroll-area tabs tooltip sheet skeleton alert empty dropdown-menu command popover
```

Expected: PASS with the generated component files added under `src/components/ui/`.

- [ ] **Step 3: Build the shell components before the board**

```tsx
// spec-driven-docs-viewer-shadcn/src/client/features/workspace-shell/WorkspaceShell.tsx
export function WorkspaceShell(props: {
  header: React.ReactNode
  summary: React.ReactNode
  board: React.ReactNode
  inspector: React.ReactNode
}) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex max-w-[1680px] flex-col gap-4 px-4 py-4 lg:px-6">
        {props.header}
        {props.summary}
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          {props.board}
          {props.inspector}
        </div>
      </div>
    </div>
  )
}
```

```tsx
// spec-driven-docs-viewer-shadcn/src/client/features/workspace-summary/WorkspaceSummary.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function WorkspaceSummary() {
  return (
    <section aria-label="Workspace summary" className="grid gap-3 xl:grid-cols-6">
      <Card><CardHeader><CardTitle>HEALTH</CardTitle></CardHeader><CardContent>ok</CardContent></Card>
    </section>
  )
}
```

- [ ] **Step 4: Tune the theme for a dense neutral tracker shell**

```css
/* spec-driven-docs-viewer-shadcn/src/index.css */
:root {
  --radius: 0.75rem;
  --background: oklch(0.985 0.002 95);
  --card: oklch(1 0 0 / 0.86);
  --border: oklch(0.91 0.004 70);
  --primary: oklch(0.28 0.02 250);
}

@layer base {
  body {
    @apply bg-background text-foreground antialiased;
    background-image: linear-gradient(180deg, rgb(250 250 249 / 0.92), rgb(241 245 249 / 0.96));
  }
}
```

- [ ] **Step 5: Run the client smoke test**

Run: `cd /Users/kroniak/Workspaces/github/contixly/skills/spec-driven-docs-viewer-shadcn && npx vitest run tests/client/App.test.tsx`

Expected: PASS with summary/header shell rendering.

- [ ] **Step 6: Commit**

```bash
git -C /Users/kroniak/Workspaces/github/contixly/skills add \
  spec-driven-docs-viewer-shadcn/src/index.css \
  spec-driven-docs-viewer-shadcn/src/main.tsx \
  spec-driven-docs-viewer-shadcn/src/client/app/App.tsx \
  spec-driven-docs-viewer-shadcn/src/client/features/workspace-shell \
  spec-driven-docs-viewer-shadcn/src/client/features/workspace-header \
  spec-driven-docs-viewer-shadcn/src/client/features/workspace-summary \
  spec-driven-docs-viewer-shadcn/src/client/features/source-switcher \
  spec-driven-docs-viewer-shadcn/src/components/ui \
  spec-driven-docs-viewer-shadcn/tests/client/App.test.tsx
git -C /Users/kroniak/Workspaces/github/contixly/skills commit -m "feat: add shadcn workspace shell"
```

### Task 5: Rebuild Board, Inspector, and Interaction Hooks

**Files:**
- Create: `spec-driven-docs-viewer-shadcn/src/client/hooks/use-workspace-snapshot.ts`
- Create: `spec-driven-docs-viewer-shadcn/src/client/hooks/use-workspace-events.ts`
- Create: `spec-driven-docs-viewer-shadcn/src/client/hooks/use-feature-selection.ts`
- Create: `spec-driven-docs-viewer-shadcn/src/client/hooks/use-prompt-copy.ts`
- Create: `spec-driven-docs-viewer-shadcn/src/client/hooks/use-source-switcher.ts`
- Create: `spec-driven-docs-viewer-shadcn/src/client/hooks/use-responsive-inspector.ts`
- Create: `spec-driven-docs-viewer-shadcn/src/client/features/feature-board/FeatureBoard.tsx`
- Create: `spec-driven-docs-viewer-shadcn/src/client/features/feature-board/FeatureCard.tsx`
- Create: `spec-driven-docs-viewer-shadcn/src/client/features/feature-inspector/FeatureInspector.tsx`
- Create: `spec-driven-docs-viewer-shadcn/src/client/features/packet-board/PacketBoard.tsx`
- Create: `spec-driven-docs-viewer-shadcn/src/client/features/packet-detail/PacketDetail.tsx`
- Modify: `spec-driven-docs-viewer-shadcn/src/client/app/App.tsx`
- Test: `spec-driven-docs-viewer-shadcn/tests/client/App.test.tsx`

- [ ] **Step 1: Port the old App interaction test for selection and prompt copying**

```tsx
// extend spec-driven-docs-viewer-shadcn/tests/client/App.test.tsx
test("renders the feature board, drills into packet view, and copies prompt", async () => {
  const writeText = vi.fn()
  vi.stubGlobal("navigator", { clipboard: { writeText } })

  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url.endsWith("/api/workspace")) {
      return new Response(JSON.stringify(workspacePayload))
    }
    if (url.endsWith("/api/prompt/v1-smart-sync-01")) {
      return new Response(JSON.stringify({
        source: "packet",
        prompt: "Implement packet v1-smart-sync-01 only."
      }))
    }
    return new Response("Not found", { status: 404 })
  }))

  render(<App />)
  await screen.findByText("Shared Spec Editing")
  await userEvent.click(screen.getByRole("button", { name: /Shared Spec Editing/i }))
  await userEvent.click(screen.getByRole("button", { name: /Copy Prompt/i }))

  expect(writeText).toHaveBeenCalledWith("Implement packet v1-smart-sync-01 only.")
})
```

- [ ] **Step 2: Run the client test to verify the board and copy flows are still missing**

Run: `cd /Users/kroniak/Workspaces/github/contixly/skills/spec-driven-docs-viewer-shadcn && npx vitest run tests/client/App.test.tsx`

Expected: FAIL because the app shell does not yet render features or copy actions.

- [ ] **Step 3: Split the old `App.tsx` state into hooks and compose the new board + inspector**

```ts
// spec-driven-docs-viewer-shadcn/src/client/hooks/use-workspace-snapshot.ts
export function useWorkspaceSnapshot() {
  const [workspace, setWorkspace] = useState<WorkspaceDocs | null>(null)
  const [workspaceError, setWorkspaceError] = useState<string | null>(null)

  async function loadWorkspace() {
    const response = await fetch("/api/workspace")
    if (!response.ok) throw new Error(`Workspace request failed with ${response.status}`)
    setWorkspace(await response.json())
  }

  return { workspace, workspaceError, loadWorkspace, setWorkspaceError }
}
```

```tsx
// spec-driven-docs-viewer-shadcn/src/client/features/feature-board/FeatureCard.tsx
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function FeatureCard(props: { feature: FeatureRecord; selected: boolean; onSelect: (feature: FeatureRecord) => void }) {
  return (
    <button type="button" onClick={() => props.onSelect(props.feature)} className="text-left">
      <Card className={props.selected ? "ring-2 ring-primary" : ""}>
        <CardHeader className="gap-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-sm leading-5">{props.feature.title}</CardTitle>
            <Badge>{formatStatusLabel(props.feature.status)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {buildFeatureCardSubtitle(props.feature)}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">{props.feature.id}</Badge>
          <Badge variant="secondary">{props.feature.version}</Badge>
          <Badge variant="secondary">{props.feature.module}</Badge>
        </CardFooter>
      </Card>
    </button>
  )
}
```

```tsx
// spec-driven-docs-viewer-shadcn/src/client/features/feature-inspector/FeatureInspector.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function FeatureInspector(props: { feature: FeatureRecord | null; packets: PacketRecord[] }) {
  return (
    <aside className="sticky top-4 flex flex-col gap-4">
      <Card>
        <CardHeader><CardTitle>{props.feature?.title ?? "Select a feature"}</CardTitle></CardHeader>
        <CardContent>{props.feature?.id ?? "Choose a card to inspect packets and copy the next prompt."}</CardContent>
      </Card>
    </aside>
  )
}
```

- [ ] **Step 4: Run the full client interaction test and make it pass**

Run: `cd /Users/kroniak/Workspaces/github/contixly/skills/spec-driven-docs-viewer-shadcn && npx vitest run tests/client/App.test.tsx`

Expected: PASS with summary rendering, feature selection, packet drilldown, and prompt copy all green.

- [ ] **Step 5: Run typecheck to catch hook signature drift**

Run: `cd /Users/kroniak/Workspaces/github/contixly/skills/spec-driven-docs-viewer-shadcn && npm run check`

Expected: PASS with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git -C /Users/kroniak/Workspaces/github/contixly/skills add \
  spec-driven-docs-viewer-shadcn/src/client/app/App.tsx \
  spec-driven-docs-viewer-shadcn/src/client/hooks \
  spec-driven-docs-viewer-shadcn/src/client/features/feature-board \
  spec-driven-docs-viewer-shadcn/src/client/features/feature-inspector \
  spec-driven-docs-viewer-shadcn/src/client/features/packet-board \
  spec-driven-docs-viewer-shadcn/src/client/features/packet-detail \
  spec-driven-docs-viewer-shadcn/tests/client/App.test.tsx
git -C /Users/kroniak/Workspaces/github/contixly/skills commit -m "feat: rebuild viewer board and inspector"
```

### Task 6: Add Quick Jump, Mobile Fallback, and Final Parity Verification

**Files:**
- Create: `spec-driven-docs-viewer-shadcn/src/client/features/command-palette/WorkspaceCommandPalette.tsx`
- Modify: `spec-driven-docs-viewer-shadcn/src/client/app/App.tsx`
- Modify: `spec-driven-docs-viewer-shadcn/src/client/features/feature-inspector/FeatureInspector.tsx`
- Modify: `spec-driven-docs-viewer-shadcn/src/client/features/workspace-header/WorkspaceHeader.tsx`
- Modify: `spec-driven-docs-viewer-shadcn/src/index.css`
- Modify: `spec-driven-docs-viewer-shadcn/README.md`
- Test: `spec-driven-docs-viewer-shadcn/tests/client/WorkspaceCommandPalette.test.tsx`

- [ ] **Step 1: Write the failing quick-jump test**

```tsx
// spec-driven-docs-viewer-shadcn/tests/client/WorkspaceCommandPalette.test.tsx
import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test, vi } from "vitest"
import { WorkspaceCommandPalette } from "@/client/features/command-palette/WorkspaceCommandPalette"

describe("WorkspaceCommandPalette", () => {
  test("selects a feature from command search", async () => {
    const onSelectFeature = vi.fn()
    render(
      <WorkspaceCommandPalette
        open
        onOpenChange={() => {}}
        features={[{ id: "smart-sync", title: "Shared Spec Editing", module: "collaboration", version: "v1", status: "in-progress", priority: "high", depends_on: [], path: "x" }]}
        packets={[]}
        onSelectFeature={onSelectFeature}
        onSelectPacket={() => {}}
      />
    )

    await userEvent.click(screen.getByText("Shared Spec Editing"))
    expect(onSelectFeature).toHaveBeenCalledWith("smart-sync")
  })
})
```

- [ ] **Step 2: Run the quick-jump test to verify the command palette is missing**

Run: `cd /Users/kroniak/Workspaces/github/contixly/skills/spec-driven-docs-viewer-shadcn && npx vitest run tests/client/WorkspaceCommandPalette.test.tsx`

Expected: FAIL with missing component import.

- [ ] **Step 3: Implement `Command` + `Popover` quick jump and the mobile `Sheet` inspector fallback**

```tsx
// spec-driven-docs-viewer-shadcn/src/client/features/command-palette/WorkspaceCommandPalette.tsx
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

export function WorkspaceCommandPalette(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  features: FeatureRecord[]
  packets: PacketRecord[]
  onSelectFeature: (featureId: string) => void
  onSelectPacket: (packetId: string) => void
}) {
  return (
    <Popover open={props.open} onOpenChange={props.onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline">Jump to feature or packet</Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0">
        <Command>
          <CommandInput placeholder="Search features and packets..." />
          <CommandList>
            <CommandGroup heading="Features">
              {props.features.map((feature) => (
                <CommandItem key={feature.id} onSelect={() => props.onSelectFeature(feature.id)}>
                  {feature.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
```

```tsx
// inside spec-driven-docs-viewer-shadcn/src/client/features/feature-inspector/FeatureInspector.tsx
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"

// render sticky aside on xl+, render Sheet on narrow screens
```

- [ ] **Step 4: Update the README to describe the new canonical project and commands**

```md
# Spec-Driven Docs Viewer Shadcn

Canonical implementation of `@contixly/spec-driven-docs-viewer`.

## Commands

- `npm run dev` - dev server with source switching
- `npm run build` - build client bundle and CLI output
- `npm test` - run server and client tests
- `npm run check` - typecheck
```

- [ ] **Step 5: Run the full verification sweep**

Run:

```bash
cd /Users/kroniak/Workspaces/github/contixly/skills/spec-driven-docs-viewer-shadcn
npx vitest run
npm run check
npm run build
```

Expected:

- Vitest: PASS for server and client suites
- TypeScript: PASS with no errors
- Build: PASS with `dist/cli.js` and built client assets

- [ ] **Step 6: Commit**

```bash
git -C /Users/kroniak/Workspaces/github/contixly/skills add \
  spec-driven-docs-viewer-shadcn/src/client/features/command-palette \
  spec-driven-docs-viewer-shadcn/src/client/features/feature-inspector/FeatureInspector.tsx \
  spec-driven-docs-viewer-shadcn/src/client/features/workspace-header/WorkspaceHeader.tsx \
  spec-driven-docs-viewer-shadcn/src/index.css \
  spec-driven-docs-viewer-shadcn/README.md \
  spec-driven-docs-viewer-shadcn/tests/client/WorkspaceCommandPalette.test.tsx
git -C /Users/kroniak/Workspaces/github/contixly/skills commit -m "feat: finish shadcn viewer parity and quick jump"
```

## Self-Review

### Spec coverage

- Canonical package and CLI contract: Tasks 1 and 3
- Shared/server/client boundary split: Tasks 2 through 5
- Desktop-first kanban shell: Tasks 4 and 5
- `shadcn` component install set: Task 4
- Runtime and dev parity including SSE and source switching: Tasks 2 and 3
- Command palette and mobile fallback: Task 6
- Testing and final verification: Tasks 1 through 6, especially Tasks 3, 5, and 6

### Placeholder scan

- No `TBD`
- No `TODO`
- No unnamed files
- No vague “write tests later” instructions

### Type consistency

- Shared types are defined once in `src/shared/contracts.ts`
- Server and client imports point at `@/shared/*`
- Runtime server and dev server keep the old endpoint names
