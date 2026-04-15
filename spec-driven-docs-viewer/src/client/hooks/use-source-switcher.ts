import { useEffect, useRef, useState } from "react"

import type { WorkspaceDocs } from "@/shared/contracts"

export function useSourceSwitcher({
  refreshWorkspace,
  workspace,
}: {
  refreshWorkspace: () => Promise<void>
  workspace: WorkspaceDocs | null
}) {
  const [isSwitchingSource, setIsSwitchingSource] = useState(false)
  const [sourceError, setSourceError] = useState<string | null>(null)
  const attemptedSourceIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (
      sourceError &&
      attemptedSourceIdRef.current &&
      workspace?.meta.source.id === attemptedSourceIdRef.current
    ) {
      attemptedSourceIdRef.current = null
      setSourceError(null)
    }
  }, [sourceError, workspace?.meta.source.id])

  async function switchSource(sourceId: string) {
    if (
      !workspace ||
      workspace.meta.mode !== "dev" ||
      sourceId === workspace.meta.source.id
    ) {
      return
    }

    setIsSwitchingSource(true)
    setSourceError(null)
    attemptedSourceIdRef.current = sourceId

    try {
      const response = await fetch("/api/dev/source", {
        body: JSON.stringify({ sourceId }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`Source switch failed with ${response.status}`)
      }

      await refreshWorkspace()
    } catch {
      setSourceError("Unable to switch source.")
    } finally {
      setIsSwitchingSource(false)
    }
  }

  return {
    isSwitchingSource,
    sourceError,
    switchSource,
  }
}
