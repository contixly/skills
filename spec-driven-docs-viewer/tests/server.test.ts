import { afterEach, describe, expect, test } from "vitest";
import { startViewerServer } from "../src/server";
import { fixturePath } from "../src/test/fixture-path";

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
      port: 0
    });
    servers.push(server);

    const workspaceRes = await fetch(`${server.url}/api/workspace`);
    const workspace = await workspaceRes.json();

    const promptRes = await fetch(`${server.url}/api/prompt/v1-smart-sync-01`);
    const prompt = await promptRes.json();

    expect(workspace.delivery.branch).toBe("feature/spec-docs");
    expect(prompt.source).toBe("packet");
  });

  test("returns json for unknown prompt packets", async () => {
    const server = await startViewerServer({
      workspaceRoot: fixturePath("basic"),
      host: "127.0.0.1",
      port: 0
    });
    servers.push(server);

    const response = await fetch(`${server.url}/api/prompt/does-not-exist`);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toContain("Unknown packet");
  });

  test("returns json for unknown api routes", async () => {
    const server = await startViewerServer({
      workspaceRoot: fixturePath("basic"),
      host: "127.0.0.1",
      port: 0
    });
    servers.push(server);

    const response = await fetch(`${server.url}/api/does-not-exist`);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Not found");
  });
});
