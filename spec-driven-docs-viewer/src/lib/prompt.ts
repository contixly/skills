import * as fs from "node:fs/promises";
import path from "node:path";
import type { PromptPayload, WorkspaceDocs } from "./contracts";

const SUGGESTED_PROMPT_PATTERN = /Suggested follow-up prompt:\s*`([^`]+)`/i;

async function readPacketMarkdown(packetMarkdownPath: string): Promise<string | null> {
  try {
    return await fs.readFile(packetMarkdownPath, "utf-8");
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "ENOENT"
    ) {
      return null;
    }

    throw error;
  }
}

function buildFallbackPrompt(workspace: WorkspaceDocs, packetId: string): string {
  const packet = workspace.packets.find((candidate) => candidate.id === packetId);
  if (!packet) throw new Error(`Unknown packet: ${packetId}`);

  return `Use $spec-driven-docs to sync documentation after implementing packet ${packet.id}. Update packet and feature statuses, refresh current-state, update architecture if needed, and regenerate docs/_meta indexes.`;
}

export async function buildPromptPayload(args: {
  workspaceRoot: string;
  workspace: WorkspaceDocs;
  packetId: string;
}): Promise<PromptPayload> {
  const packet = args.workspace.packets.find((candidate) => candidate.id === args.packetId);
  if (!packet) throw new Error(`Unknown packet: ${args.packetId}`);

  const packetMarkdownPath = path.join(args.workspaceRoot, "docs", packet.path);
  const packetMarkdown = (await readPacketMarkdown(packetMarkdownPath)) ?? "";
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
