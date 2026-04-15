import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type {
  DeliveryState,
  WorkspaceHealth,
  WorkspaceSnapshotMeta,
} from "@/shared/contracts"

function getHealthVariant(level: WorkspaceHealth["level"] | null) {
  if (level === "warning") {
    return "outline"
  }

  if (level === "error") {
    return "destructive"
  }

  return "secondary"
}

export function WorkspaceHeader({
  commandPalette,
  delivery,
  health,
  meta,
  shellState,
  sourceSwitcher,
}: {
  commandPalette: ReactNode
  delivery: DeliveryState | null
  health: WorkspaceHealth | null
  meta: WorkspaceSnapshotMeta | null
  shellState: "loading" | "ready" | "unavailable"
  sourceSwitcher: ReactNode
}) {
  return (
    <Card className="tracker-panel tracker-panel-strong">
      <CardHeader className="gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="tracker-kicker">Workspace shell</div>
          <CardTitle className="truncate text-base">
            Spec-Driven Docs Viewer
          </CardTitle>
          <CardDescription>
            Calm, dense readout for the runtime workspace snapshot.
          </CardDescription>
        </div>
        <div className="flex items-start justify-start lg:justify-end">
          <div className="tracker-header-actions">
            {commandPalette}
            {sourceSwitcher}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {shellState === "loading" ? (
            <>
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </>
          ) : shellState === "unavailable" ? (
            <>
              <Badge variant="destructive">UNAVAILABLE</Badge>
              <Badge variant="outline">REVISION UNAVAILABLE</Badge>
              <Badge variant="outline">MODE UNAVAILABLE</Badge>
            </>
          ) : (
            <>
              <Badge variant={getHealthVariant(health?.level ?? null)}>
                {health?.level.toUpperCase() ?? "UNKNOWN"}
              </Badge>
              <Badge variant="outline">REVISION {meta?.revision ?? "?"}</Badge>
              <Badge variant="outline">
                MODE {(meta?.mode ?? "runtime").toUpperCase()}
              </Badge>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="tracker-kicker">Updated</span>
            <span className="tracker-value">
              {shellState === "loading"
                ? "Loading"
                : shellState === "unavailable"
                  ? "Unavailable"
                  : delivery?.updated_at}
            </span>
          </div>
          <Separator orientation="vertical" className="hidden h-4 lg:block" />
          <div className="flex items-center gap-2">
            <span className="tracker-kicker">Source</span>
            <span className="tracker-value">
              {shellState === "loading"
                ? "Loading"
                : shellState === "unavailable"
                  ? "Unavailable"
                  : meta?.source.label}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
