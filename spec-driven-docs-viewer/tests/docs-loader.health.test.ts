import { describe, expect, test } from "vitest";
import { loadWorkspaceDocs } from "../src/lib/docs-loader";
import { fixturePath } from "../src/test/fixture-path";

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

  test("reports stale-meta warning when task-board misses a packet that exists on disk", async () => {
    const workspace = await loadWorkspaceDocs(fixturePath("partial-stale"));

    expect(workspace.health.level).toBe("warning");
    expect(workspace.health.messages).toContain(
      "Packet markdown exists but docs/_meta indexes are incomplete or stale."
    );
  });

  test("reports stale-meta warning when packet index entries exist without markdown files", async () => {
    const workspace = await loadWorkspaceDocs(fixturePath("missing-packet-markdown"));

    expect(workspace.health.level).toBe("warning");
    expect(workspace.health.messages).toContain(
      "Packet markdown exists but docs/_meta indexes are incomplete or stale."
    );
  });
});
