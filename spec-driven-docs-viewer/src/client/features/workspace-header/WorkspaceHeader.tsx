import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type {
  DeliveryState,
  WorkspaceHealth,
  WorkspaceSnapshotMeta,
} from "@/shared/contracts"

export function WorkspaceHeader({
  commandPalette,
  delivery,
  meta,
  shellState,
  sourceSwitcher,
  themeToggle,
}: {
  commandPalette: ReactNode
  delivery: DeliveryState | null
  health: WorkspaceHealth | null
  meta: WorkspaceSnapshotMeta | null
  shellState: "loading" | "ready" | "unavailable"
  sourceSwitcher: ReactNode
  themeToggle?: ReactNode
}) {
  return (
    <Card className="tracker-panel tracker-panel-strong">
      <CardHeader className="gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex min-w-0 items-start gap-3">
          <img
            alt="Spec-Driven Docs Viewer logo"
            src="/logo.svg"
            className="mt-0.5 size-11 shrink-0 rounded-md border border-border/80 bg-background/78 p-1.5 shadow-[inset_0_1px_0_oklch(1_0_0_/_0.4)]"
          />
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="tracker-kicker">Workspace shell</div>
            <CardTitle className="truncate text-base">
              Spec-Driven Docs Viewer
            </CardTitle>
            <CardDescription>
              Calm, dense readout for the runtime workspace snapshot.
            </CardDescription>
          </div>
        </div>
        <div className="flex items-start justify-start lg:justify-end">
          <div className="tracker-header-actions">
            {commandPalette}
            {sourceSwitcher}
            {themeToggle}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {shellState === "loading" ? (
            <>
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </>
          ) : shellState === "unavailable" ? (
            <>
              <Badge variant="outline">REVISION UNAVAILABLE</Badge>
              <Badge variant="outline">MODE UNAVAILABLE</Badge>
            </>
          ) : (
            <>
              <Badge variant="outline">REVISION {meta?.revision ?? "?"}</Badge>
              <Badge variant="outline">
                MODE {(meta?.mode ?? "runtime").toUpperCase()}
              </Badge>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-end gap-3 text-xs text-muted-foreground">
          <div className="flex min-h-6 items-end gap-2">
            <span className="text-xs leading-none tracking-[0.22em] text-muted-foreground uppercase">
              Updated
            </span>
            <span className="text-xs leading-none font-medium text-foreground">
              {shellState === "loading"
                ? "Loading"
                : shellState === "unavailable"
                  ? "Unavailable"
                  : delivery?.updated_at}
            </span>
          </div>
          <div className="flex min-h-6 items-end gap-2">
            <span className="text-xs leading-none tracking-[0.22em] text-muted-foreground uppercase">
              Source
            </span>
            <span className="text-xs leading-none font-medium text-foreground">
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
