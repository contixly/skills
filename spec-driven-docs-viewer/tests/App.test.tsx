// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { App } from "../src/App";

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

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("App", () => {
  test("renders the feature board, drills into packet view, and copies prompt", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.endsWith("/api/workspace")) {
        return new Response(JSON.stringify(workspacePayload));
      }

      if (url.endsWith("/api/prompt/v1-smart-sync-01")) {
        return new Response(
          JSON.stringify({
            source: "packet",
            prompt: "Implement packet v1-smart-sync-01 only."
          })
        );
      }

      return new Response("Not found", { status: 404 });
    });

    vi.stubGlobal("fetch", fetchMock);

    vi.stubGlobal("navigator", {
      clipboard: { writeText }
    });

    render(<App />);

    await screen.findByText("Shared Spec Editing");
    await user.click(screen.getByRole("button", { name: /Shared Spec Editing/i }));
    expect(screen.getByRole("button", { name: /Shared Spec Editing/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await user.click(screen.getByRole("button", { name: /Presence and Edit Locking/i }));
    expect(screen.getByRole("button", { name: /Presence and Edit Locking/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await user.click(screen.getByRole("button", { name: "Copy Prompt" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("Implement packet v1-smart-sync-01 only.");
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/prompt/v1-smart-sync-01");
  });

  test("shows a recoverable workspace load error", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("Server exploded", { status: 500, statusText: "Server Error" }))
      .mockResolvedValueOnce(new Response(JSON.stringify(workspacePayload)));

    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn() }
    });

    render(<App />);

    await screen.findByText("Unable to load workspace.");
    await user.click(screen.getByRole("button", { name: "Retry" }));
    await screen.findByText("Shared Spec Editing");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("shows copy failure and recovers without staying pending", async () => {
    const user = userEvent.setup();
    const writeText = vi
      .fn()
      .mockRejectedValueOnce(new Error("Clipboard unavailable"))
      .mockResolvedValueOnce(undefined);

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.endsWith("/api/workspace")) {
          return new Response(JSON.stringify(workspacePayload));
        }

        if (url.endsWith("/api/prompt/v1-smart-sync-01")) {
          return new Response(
            JSON.stringify({
              source: "packet",
              prompt: "Implement packet v1-smart-sync-01 only."
            })
          );
        }

        return new Response("Not found", { status: 404 });
      })
    );

    vi.stubGlobal("navigator", {
      clipboard: { writeText }
    });

    render(<App />);

    await screen.findByText("Shared Spec Editing");
    await user.click(screen.getByRole("button", { name: /Shared Spec Editing/i }));
    await user.click(screen.getByRole("button", { name: /Presence and Edit Locking/i }));
    await user.click(screen.getByRole("button", { name: "Copy Prompt" }));

    await screen.findByText("Unable to copy prompt.");
    expect(screen.getByRole("button", { name: "Copy Prompt" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Copy Prompt" }));
    await waitFor(() => {
      expect(writeText).toHaveBeenLastCalledWith("Implement packet v1-smart-sync-01 only.");
    });
  });
});
