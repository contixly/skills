import { describe, expect, test } from "vitest";
import { loadWorkspaceDocs } from "../src/lib/docs-loader";
import { fixturePath } from "../src/test/fixture-path";

describe("loadWorkspaceDocs", () => {
  test("loads features, packets, and delivery state from docs/_meta", async () => {
    const workspace = await loadWorkspaceDocs(fixturePath("basic"));

    expect(workspace.features.map((feature) => feature.id)).toEqual([
      "smart-sync",
      "review-queue"
    ]);
    expect(workspace.health).toEqual({
      level: "ok",
      messages: []
    });
    expect(workspace.features.find((feature) => feature.id === "smart-sync")?.packet_counts).toEqual(
      {
        ready: 1
      }
    );
    expect(workspace.features.find((feature) => feature.id === "review-queue")?.packet_counts).toEqual(
      {
        ready: 1
      }
    );
    expect(workspace.packetsByFeature["smart-sync"].map((packet) => packet.id)).toEqual([
      "v1-smart-sync-01"
    ]);
    expect(workspace.delivery.branch).toBe("feature/spec-docs");
  });

  test("normalizes unknown statuses to unknown instead of dropping records", async () => {
    const workspace = await loadWorkspaceDocs(fixturePath("unknown-status"));

    expect(workspace.features[0]?.status).toBe("unknown");
    expect(workspace.packets[0]?.status).toBe("unknown");
    expect(workspace.features[0]?.packet_counts).toEqual({
      unknown: 1
    });
  });
});
