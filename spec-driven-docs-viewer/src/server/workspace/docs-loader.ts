import { access, readdir, readFile } from "node:fs/promises"
import path from "node:path"
import type {
  DeliveryState,
  FeatureRecord,
  PacketRecord,
  Status,
  ViewerSourceDescriptor,
  WorkspaceSnapshotMeta,
  WorkspaceDocs,
} from "../../shared/contracts.js"
import { normalizeStatus } from "../../shared/status.js"

async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf-8")
  return JSON.parse(raw) as T
}

function countPacketsByStatus(packets: PacketRecord[]): Partial<Record<Status, number>> {
  return packets.reduce<Partial<Record<Status, number>>>((acc, packet) => {
    acc[packet.status] = (acc[packet.status] ?? 0) + 1
    return acc
  }, {})
}

function buildWorkspaceSnapshotMeta(args: {
  mode: "runtime" | "dev"
  revision: number
  source: ViewerSourceDescriptor
  availableSources?: ViewerSourceDescriptor[]
}): WorkspaceSnapshotMeta {
  return {
    mode: args.mode,
    revision: args.revision,
    source: args.source,
    availableSources: args.availableSources,
  }
}

async function collectPacketMarkdownPaths(workspaceRoot: string): Promise<string[]> {
  const versionsDir = path.join(workspaceRoot, "docs", "versions")

  try {
    await access(versionsDir)
  } catch {
    return []
  }

  const packetPaths: string[] = []
  const versionDirs = await readdir(versionsDir, { withFileTypes: true })
  for (const versionDir of versionDirs) {
    if (!versionDir.isDirectory()) continue

    const iterationsDir = path.join(versionsDir, versionDir.name, "iterations")
    try {
      const files = await readdir(iterationsDir)
      for (const file of files) {
        if (!file.endsWith(".md")) continue
        packetPaths.push(path.posix.join("versions", versionDir.name, "iterations", file))
      }
    } catch {
      continue
    }
  }

  return packetPaths.sort()
}

async function hasStalePacketDocs(workspaceRoot: string, taskPaths: string[]): Promise<boolean> {
  const packetMarkdownPaths = await collectPacketMarkdownPaths(workspaceRoot)
  if (packetMarkdownPaths.length === 0) {
    return taskPaths.length > 0
  }

  const indexedPacketPaths = new Set(taskPaths)
  if (packetMarkdownPaths.some((packetPath) => !indexedPacketPaths.has(packetPath))) {
    return true
  }

  const packetMarkdownSet = new Set(packetMarkdownPaths)
  return taskPaths.some((taskPath) => !packetMarkdownSet.has(taskPath))
}

export async function loadWorkspaceDocs(args: {
  workspaceRoot: string
  mode: "runtime" | "dev"
  revision: number
  source: ViewerSourceDescriptor
  availableSources?: ViewerSourceDescriptor[]
}): Promise<WorkspaceDocs> {
  const metaDir = path.join(args.workspaceRoot, "docs", "_meta")
  try {
    await access(metaDir)
  } catch {
    throw new Error(`Missing docs/_meta in ${args.workspaceRoot}. Run spec-driven docs sync first.`)
  }

  const featurePayload = await readJsonFile<{ features: FeatureRecord[] }>(
    path.join(metaDir, "feature-index.json"),
  )
  const taskPayload = await readJsonFile<{ tasks: PacketRecord[] }>(path.join(metaDir, "task-board.json"))
  const delivery = await readJsonFile<DeliveryState>(path.join(metaDir, "delivery-state.json"))

  const normalizedTasks = taskPayload.tasks.map((task) => ({
    ...task,
    status: normalizeStatus(task.status),
  }))

  const packetsByFeature = normalizedTasks.reduce<Record<string, PacketRecord[]>>((acc, packet) => {
    acc[packet.feature] ??= []
    acc[packet.feature].push(packet)
    return acc
  }, {})

  const features = featurePayload.features.map((feature) => ({
    ...feature,
    status: normalizeStatus(feature.status),
    packet_counts: countPacketsByStatus(packetsByFeature[feature.id] ?? []),
  }))
  const stalePacketDocs = await hasStalePacketDocs(
    args.workspaceRoot,
    normalizedTasks.map((task) => task.path),
  )

  return {
    features,
    packets: normalizedTasks,
    packetsByFeature,
    delivery,
    meta: buildWorkspaceSnapshotMeta(args),
    health: {
      level: stalePacketDocs ? "warning" : "ok",
      messages: stalePacketDocs
        ? ["Packet markdown exists but docs/_meta indexes are incomplete or stale."]
        : [],
    },
  }
}
