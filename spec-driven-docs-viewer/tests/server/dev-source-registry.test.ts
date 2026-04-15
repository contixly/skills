import { describe, expect, test } from "vitest"
import { createDevSourceRegistry } from "@/server/workspace/dev-source-registry"

describe("createDevSourceRegistry", () => {
  test("lists fixture sources plus configured external workspace", () => {
    const registry = createDevSourceRegistry({
      externalWorkspaceRoot: "/tmp/customer-app",
    })

    expect(registry.list().map((source) => source.id)).toEqual([
      "dense-portfolio",
      "stale-and-broken",
      "empty-or-minimal",
      "external-workspace",
    ])
    expect(registry.get("external-workspace")?.workspaceRoot).toBe("/tmp/customer-app")
  })
})
