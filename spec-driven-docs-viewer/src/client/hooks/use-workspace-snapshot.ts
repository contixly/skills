import { startTransition, useEffect, useRef, useState } from "react"

import type { WorkspaceDocs } from "@/shared/contracts"

type LoadWorkspaceOptions = {
  preserveWorkspace?: boolean
}

export function useWorkspaceSnapshot() {
  const [workspace, setWorkspace] = useState<WorkspaceDocs | null>(null)
  const [workspaceError, setWorkspaceError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const mountedRef = useRef(true)
  const requestVersionRef = useRef(0)
  const workspaceRef = useRef<WorkspaceDocs | null>(null)

  useEffect(() => {
    workspaceRef.current = workspace
  }, [workspace])

  async function loadWorkspace(options?: LoadWorkspaceOptions) {
    const requestVersion = requestVersionRef.current + 1
    requestVersionRef.current = requestVersion

    if (!options?.preserveWorkspace || workspaceRef.current === null) {
      startTransition(() => {
        setIsLoading(true)
      })
    }

    try {
      const response = await fetch("/api/workspace")
      if (!response.ok) {
        throw new Error(`Workspace request failed with ${response.status}`)
      }

      const payload = (await response.json()) as WorkspaceDocs
      if (!mountedRef.current || requestVersion !== requestVersionRef.current) {
        return
      }

      startTransition(() => {
        setWorkspace(payload)
        setWorkspaceError(null)
        setIsLoading(false)
      })
    } catch (error) {
      if (!mountedRef.current || requestVersion !== requestVersionRef.current) {
        return
      }

      const message =
        error instanceof Error ? error.message : "Unable to load workspace."

      startTransition(() => {
        if (options?.preserveWorkspace && workspaceRef.current !== null) {
          setWorkspaceError("Unable to refresh workspace.")
        } else {
          setWorkspace(null)
          setWorkspaceError(message)
        }
        setIsLoading(false)
      })
    }
  }

  useEffect(() => {
    mountedRef.current = true
    void loadWorkspace()

    return () => {
      mountedRef.current = false
    }
  }, [])

  return {
    isLoading,
    loadWorkspace,
    shellState: isLoading
      ? "loading"
      : workspace
        ? "ready"
        : "unavailable",
    workspace,
    workspaceError,
  }
}
