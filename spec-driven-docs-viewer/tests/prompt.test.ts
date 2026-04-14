import { afterEach, describe, expect, test, vi } from "vitest";
import { loadWorkspaceDocs } from "../src/lib/docs-loader";
import { fixturePath } from "../src/test/fixture-path";

async function importPromptModule() {
  return await import("../src/lib/prompt");
}

describe("buildPromptPayload", () => {
  afterEach(() => {
    vi.doUnmock("node:fs/promises");
    vi.restoreAllMocks();
    vi.resetModules();
  });

  test("extracts the suggested prompt from packet markdown when present", async () => {
    const workspaceRoot = fixturePath("basic");
    const workspace = await loadWorkspaceDocs(workspaceRoot);
    const { buildPromptPayload } = await importPromptModule();

    const payload = await buildPromptPayload({
      workspaceRoot,
      workspace,
      packetId: "v1-smart-sync-01"
    });

    expect(payload.source).toBe("packet");
    expect(payload.prompt).toBe(
      "Use $spec-driven-docs to sync documentation after implementing packet v1-smart-sync-01."
    );
  });

  test("generates a fallback prompt when packet markdown has no suggested prompt", async () => {
    const workspaceRoot = fixturePath("basic");
    const workspace = await loadWorkspaceDocs(workspaceRoot);
    const { buildPromptPayload } = await importPromptModule();

    const payload = await buildPromptPayload({
      workspaceRoot,
      workspace,
      packetId: "review-queue-01"
    });

    expect(payload.source).toBe("generated");
    expect(payload.prompt).toBe(
      "Use $spec-driven-docs to sync documentation after implementing packet review-queue-01. Update packet and feature statuses, refresh current-state, update architecture if needed, and regenerate docs/_meta indexes."
    );
  });

  test("propagates unexpected markdown read failures", async () => {
    const workspaceRoot = fixturePath("basic");
    const workspace = await loadWorkspaceDocs(workspaceRoot);
    vi.resetModules();
    vi.doMock("node:fs/promises", async () => {
      const actual = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");

      return {
        ...actual,
        readFile: vi.fn().mockRejectedValueOnce(new Error("boom"))
      };
    });
    const { buildPromptPayload } = await importPromptModule();

    await expect(
      buildPromptPayload({
        workspaceRoot,
        workspace,
        packetId: "v1-smart-sync-01"
      })
    ).rejects.toThrow("boom");
  });
});
