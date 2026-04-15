import { watch, type FSWatcher } from "node:fs"
import { access, readdir } from "node:fs/promises"
import path from "node:path"
import type { ViewerSourceDescriptor, WorkspaceDocs } from "../../shared/contracts.js"
import { loadWorkspaceDocs } from "./docs-loader.js"

const WATCH_DEBOUNCE_MS = 150
type WatchFn = typeof watch

export function isWatchedWorkspaceInput(fileName: string): boolean {
  const normalized = fileName.split(path.sep).join("/")
  return (
    /^_meta\/[^/]+\.json$/u.test(normalized) ||
    /^versions\/[^/]+\/iterations\/[^/]+\.md$/u.test(normalized)
  )
}

async function listIterationWatchTargets(
  workspaceRoot: string,
): Promise<Array<{ dir: string; prefix: string }>> {
  const versionsDir = path.join(workspaceRoot, "docs", "versions")

  try {
    const versionDirs = await readdir(versionsDir, { withFileTypes: true })
    return versionDirs
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({
        dir: path.join(versionsDir, entry.name, "iterations"),
        prefix: path.posix.join("versions", entry.name, "iterations"),
      }))
  } catch {
    return []
  }
}

async function listVersionWatchTargets(
  workspaceRoot: string,
): Promise<Array<{ dir: string; prefix: string }>> {
  const versionsDir = path.join(workspaceRoot, "docs", "versions")

  try {
    const versionDirs = await readdir(versionsDir, { withFileTypes: true })
    return versionDirs
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({
        dir: path.join(versionsDir, entry.name),
        prefix: path.posix.join("versions", entry.name),
      }))
  } catch {
    return []
  }
}

export async function createFallbackWatchers(
  workspaceRoot: string,
  onRelevantChange: (isRelevant: boolean) => void,
  watchFn: WatchFn = watch,
): Promise<{ close: () => Promise<void> }> {
  const docsRoot = path.join(workspaceRoot, "docs")
  const versionsDir = path.join(docsRoot, "versions")
  const rootWatchers = new Map<string, FSWatcher>()
  const versionWatchers = new Map<string, FSWatcher>()
  const iterationWatchers = new Map<string, FSWatcher>()
  let hasCompletedInitialSync = false
  let syncInFlight: Promise<void> | null = null
  let syncRequested = false
  let isClosed = false

  const ensureWatcher = async (
    targetMap: Map<string, FSWatcher>,
    key: string,
    create: () => Promise<FSWatcher | null>,
  ) => {
    if (isClosed || targetMap.has(key)) {
      return false
    }

    const watcher = await create()
    if (isClosed) {
      watcher?.close()
      return false
    }

    if (watcher) {
      targetMap.set(key, watcher)
      return true
    }

    return false
  }

  const ensureVersionsRootWatcher = () =>
    ensureWatcher(rootWatchers, versionsDir, async () => {
      try {
        await access(versionsDir)
        return watchFn(versionsDir, () => {
          void syncWatchers()
        })
      } catch {
        return null
      }
    })

  const performSyncWatchers = async () => {
    if (isClosed) {
      return
    }

    await ensureVersionsRootWatcher()

    const versionTargets = await listVersionWatchTargets(workspaceRoot)
    const versionKeys = new Set(versionTargets.map((target) => target.dir))

    for (const [dir, watcher] of versionWatchers) {
      if (versionKeys.has(dir)) {
        continue
      }

      watcher.close()
      versionWatchers.delete(dir)
    }

    await Promise.all(
      versionTargets.map(({ dir }) =>
        ensureWatcher(versionWatchers, dir, async () => {
          try {
            await access(dir)
            return watchFn(dir, () => {
              void syncWatchers()
            })
          } catch {
            return null
          }
        }),
      ),
    )

    const iterationTargets = await listIterationWatchTargets(workspaceRoot)
    const iterationKeys = new Set(iterationTargets.map((target) => target.dir))

    for (const [dir, watcher] of iterationWatchers) {
      if (iterationKeys.has(dir)) {
        continue
      }

      watcher.close()
      iterationWatchers.delete(dir)
    }

    const attachedNewIterationWatchers = (
      await Promise.all(
        iterationTargets.map(({ dir, prefix }) =>
          ensureWatcher(iterationWatchers, dir, async () => {
            try {
              await access(dir)
              return watchFn(dir, (_eventType, fileName) => {
                if (typeof fileName !== "string") {
                  return
                }

                const relativePath = path.posix.join(prefix, fileName.split(path.sep).join("/"))
                onRelevantChange(isWatchedWorkspaceInput(relativePath))
              })
            } catch {
              return null
            }
          }),
        ),
      )
    ).some(Boolean)

    if (hasCompletedInitialSync && attachedNewIterationWatchers) {
      onRelevantChange(true)
    }

    hasCompletedInitialSync = true
  }

  const syncWatchers = async () => {
    if (syncInFlight) {
      syncRequested = true
      await syncInFlight
      return
    }

    do {
      syncRequested = false
      syncInFlight = performSyncWatchers()
      try {
        await syncInFlight
      } finally {
        syncInFlight = null
      }
    } while (syncRequested)
  }

  await ensureWatcher(rootWatchers, path.join(docsRoot, "_meta"), async () => {
    try {
      const metaDir = path.join(docsRoot, "_meta")
      await access(metaDir)
      return watchFn(metaDir, (_eventType, fileName) => {
        if (typeof fileName !== "string") {
          return
        }

        onRelevantChange(isWatchedWorkspaceInput(path.posix.join("_meta", fileName.split(path.sep).join("/"))))
      })
    } catch {
      return null
    }
  })

  await ensureWatcher(rootWatchers, docsRoot, async () => {
    try {
      await access(docsRoot)
      return watchFn(docsRoot, (_eventType, fileName) => {
        if (typeof fileName !== "string") {
          return
        }

        const normalized = fileName.split(path.sep).join("/")
        if (normalized === "versions" || normalized.startsWith("versions/")) {
          void syncWatchers()
        }
      })
    } catch {
      return null
    }
  })

  await ensureVersionsRootWatcher()

  await syncWatchers()

  return {
    async close() {
      isClosed = true
      await syncInFlight

      for (const watcher of rootWatchers.values()) {
        watcher.close()
      }

      for (const watcher of versionWatchers.values()) {
        watcher.close()
      }

      for (const watcher of iterationWatchers.values()) {
        watcher.close()
      }
    },
  }
}

async function createWatchers(
  workspaceRoot: string,
  onRelevantChange: (isRelevant: boolean) => void,
): Promise<{ close: () => Promise<void> }> {
  const docsRoot = path.join(workspaceRoot, "docs")
  try {
    const watcher = watch(docsRoot, { recursive: true }, (_eventType, fileName) => {
      if (typeof fileName !== "string") {
        return
      }

      onRelevantChange(isWatchedWorkspaceInput(fileName.split(path.sep).join("/")))
    })

    return {
      async close() {
        watcher.close()
      },
    }
  } catch {
    return createFallbackWatchers(workspaceRoot, onRelevantChange, watch)
  }
}

export async function createWorkspaceStore(args: {
  mode: "runtime" | "dev"
  source: ViewerSourceDescriptor
  workspaceRoot: string
  availableSources?: ViewerSourceDescriptor[]
}) {
  let revision = 1
  let snapshot = await loadWorkspaceDocs({
    workspaceRoot: args.workspaceRoot,
    mode: args.mode,
    revision,
    source: args.source,
    availableSources: args.availableSources,
  })
  const listeners = new Set<() => void>()
  let reloadTimer: ReturnType<typeof setTimeout> | null = null
  let reloadQueue = Promise.resolve<void>(undefined)
  let isClosed = false

  const watchController = await createWatchers(args.workspaceRoot, (isRelevant) => {
    if (isClosed || !isRelevant) {
      return
    }

    if (reloadTimer) {
      clearTimeout(reloadTimer)
    }

    reloadTimer = setTimeout(() => {
      reloadTimer = null
      if (isClosed) {
        return
      }

      void enqueueReload("watch").catch(() => {})
    }, WATCH_DEBOUNCE_MS)
  })

  async function reload(_reason: "watch" | "manual"): Promise<WorkspaceDocs> {
    if (isClosed) {
      return snapshot
    }

    try {
      const next = await loadWorkspaceDocs({
        workspaceRoot: args.workspaceRoot,
        mode: args.mode,
        revision: revision + 1,
        source: args.source,
        availableSources: args.availableSources,
      })

      if (isClosed) {
        return snapshot
      }

      revision += 1
      snapshot = next
      listeners.forEach((listener) => listener())
      return snapshot
    } catch (error) {
      if (isClosed) {
        return snapshot
      }

      const message = error instanceof Error ? error.message : "Reload failed"
      snapshot = {
        ...snapshot,
        health: {
          level: "error",
          messages: [message],
        },
      }
      listeners.forEach((listener) => listener())
      throw error
    }
  }

  function enqueueReload(reason: "watch" | "manual"): Promise<WorkspaceDocs> {
    if (isClosed) {
      return Promise.resolve(snapshot)
    }

    const scheduledReload = reloadQueue.then(() => {
      if (isClosed) {
        return snapshot
      }

      return reload(reason)
    })
    reloadQueue = scheduledReload.then(
      () => undefined,
      () => undefined,
    )
    return scheduledReload
  }

  return {
    getSnapshot(): WorkspaceDocs {
      return snapshot
    },
    reload(reason: "watch" | "manual") {
      return enqueueReload(reason)
    },
    subscribe(listener: () => void) {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
    async close() {
      isClosed = true

      if (reloadTimer) {
        clearTimeout(reloadTimer)
        reloadTimer = null
      }

      await watchController.close()
      await reloadQueue
    },
  }
}
