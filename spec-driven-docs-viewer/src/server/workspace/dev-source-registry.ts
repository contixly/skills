import path from "node:path"
import { fileURLToPath } from "node:url"
import type { ViewerSourceDescriptor } from "../../shared/contracts.js"

const here = path.dirname(fileURLToPath(import.meta.url))
const fixturesRoot = path.resolve(here, "../../../tests/fixtures")

export interface DevSourceRecord extends ViewerSourceDescriptor {
  workspaceRoot: string
}

function baseSources(): DevSourceRecord[] {
  return [
    {
      id: "dense-portfolio",
      kind: "fixture",
      label: "Dense Portfolio",
      workspaceRoot: path.join(fixturesRoot, "dense-portfolio"),
    },
    {
      id: "stale-and-broken",
      kind: "fixture",
      label: "Stale and Broken",
      workspaceRoot: path.join(fixturesRoot, "stale-and-broken"),
    },
    {
      id: "empty-or-minimal",
      kind: "fixture",
      label: "Empty or Minimal",
      workspaceRoot: path.join(fixturesRoot, "empty-or-minimal"),
    },
  ]
}

export function createDevSourceRegistry(args: {
  externalWorkspaceRoot: string | null
}): {
  list(): DevSourceRecord[]
  get(id: string): DevSourceRecord | undefined
} {
  const sources = baseSources()

  if (args.externalWorkspaceRoot) {
    sources.push({
      id: "external-workspace",
      kind: "workspace",
      label: "External Workspace",
      workspaceRoot: args.externalWorkspaceRoot,
    })
  }

  return {
    list() {
      return sources.slice()
    },
    get(id: string) {
      return sources.find((source) => source.id === id)
    },
  }
}
