import { describe, expect, test } from "vitest"
import { parseRuntimeOptions } from "@/server/workspace/runtime-options"

describe("parseRuntimeOptions", () => {
  test("uses fixture mode defaults for dev shell", () => {
    const options = parseRuntimeOptions({
      argv: ["node", "dev-server", "--workspace", "/tmp/demo"],
      cwd: "/repo/spec-driven-docs-viewer",
      mode: "dev",
    })

    expect(options.mode).toBe("dev")
    expect(options.dev.defaultSourceId).toBe("dense-portfolio")
    expect(options.dev.externalWorkspaceRoot).toBe("/tmp/demo")
  })

  test("uses cwd as workspace root for runtime shell", () => {
    const options = parseRuntimeOptions({
      argv: ["node", "cli"],
      cwd: "/repo/customer-app",
      mode: "runtime",
    })

    expect(options.mode).toBe("runtime")
    expect(options.runtime.workspaceRoot).toBe("/repo/customer-app")
  })

  test("rejects --workspace without a value", () => {
    expect(() =>
      parseRuntimeOptions({
        argv: ["node", "dev-server", "--workspace"],
        cwd: "/repo/spec-driven-docs-viewer",
        mode: "dev",
      }),
    ).toThrow("Missing value for --workspace.")
  })

  test("rejects --workspace= without a value", () => {
    expect(() =>
      parseRuntimeOptions({
        argv: ["node", "dev-server", "--workspace="],
        cwd: "/repo/spec-driven-docs-viewer",
        mode: "dev",
      }),
    ).toThrow("Missing value for --workspace.")
  })
})
