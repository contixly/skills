import { useEffect, useEffectEvent, useRef } from "react"

export function useWorkspaceEvents({
  currentRevision,
  isSnapshotPending,
  onRevision,
}: {
  currentRevision: number | null
  isSnapshotPending: boolean
  onRevision: (revision: number) => void
}) {
  const isSnapshotPendingRef = useRef(isSnapshotPending)
  const latestRevisionRef = useRef<number | null>(currentRevision)
  const pendingRevisionRef = useRef<number | null>(null)
  const handleRevision = useEffectEvent(onRevision)

  useEffect(() => {
    isSnapshotPendingRef.current = isSnapshotPending
  }, [isSnapshotPending])

  useEffect(() => {
    latestRevisionRef.current = currentRevision

    if (isSnapshotPending || pendingRevisionRef.current === null) {
      return
    }

    const pendingRevision = pendingRevisionRef.current
    pendingRevisionRef.current = null

    if (currentRevision === null || pendingRevision > currentRevision) {
      latestRevisionRef.current = pendingRevision
      handleRevision(pendingRevision)
    }
  }, [currentRevision, handleRevision, isSnapshotPending])

  useEffect(() => {
    if (typeof EventSource === "undefined") {
      return
    }

    const eventSource = new EventSource("/api/events")

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { revision?: unknown }
        if (typeof payload.revision !== "number") {
          return
        }

        const latestRevision = latestRevisionRef.current
        if (latestRevision === null) {
          if (isSnapshotPendingRef.current) {
            pendingRevisionRef.current =
              pendingRevisionRef.current === null
                ? payload.revision
                : Math.max(pendingRevisionRef.current, payload.revision)
          } else {
            latestRevisionRef.current = payload.revision
            handleRevision(payload.revision)
          }
          return
        }

        if (latestRevision !== null && payload.revision <= latestRevision) {
          return
        }

        latestRevisionRef.current = payload.revision
        handleRevision(payload.revision)
      } catch {
        return
      }
    }

    return () => {
      eventSource.close()
    }
  }, [handleRevision])
}
