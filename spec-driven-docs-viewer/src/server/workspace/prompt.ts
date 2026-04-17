import type { PromptPayload, WorkspaceDocs } from "../../shared/contracts.js"

function buildImplementationPrompt(args: {
  packet: WorkspaceDocs["packets"][number]
  featurePath?: string
}): string {
  const packetPath = `docs/${args.packet.path}`
  const parts = [
    `Use the relevant skills to implement packet ${args.packet.id} (${args.packet.title}) by following the task intent in ${packetPath}.`,
  ]

  if (args.featurePath) {
    parts.push(`Start by reading docs/${args.featurePath} and ${packetPath}.`)
    parts.push(`Implement only this packet for feature ${args.packet.feature}.`)
  } else {
    parts.push(`Start by reading ${packetPath}.`)
    parts.push("Implement only this packet.")
  }

  parts.push("Do not expand scope beyond the packet.")
  return parts.join(" ")
}

function buildFallbackPrompt(workspace: WorkspaceDocs, packetId: string): string {
  const packet = workspace.packets.find((candidate) => candidate.id === packetId)
  if (!packet) throw new Error(`Unknown packet: ${packetId}`)
  const feature = workspace.features.find((candidate) => candidate.id === packet.feature)

  return buildImplementationPrompt({
    packet,
    featurePath: feature?.path,
  })
}

export async function buildPromptPayload(args: {
  workspaceRoot: string
  workspace: WorkspaceDocs
  packetId: string
}): Promise<PromptPayload> {
  const packet = args.workspace.packets.find((candidate) => candidate.id === args.packetId)
  if (!packet) throw new Error(`Unknown packet: ${args.packetId}`)

  if (packet.implementation_prompt?.trim()) {
    return {
      source: "packet",
      prompt: packet.implementation_prompt.trim(),
    }
  }

  return {
    source: "generated",
    prompt: buildFallbackPrompt(args.workspace, args.packetId),
  }
}
