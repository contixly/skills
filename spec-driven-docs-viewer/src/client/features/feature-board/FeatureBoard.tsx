import { IconAlertCircle, IconColumns3 } from "@tabler/icons-react"

import { FeatureCard } from "@/client/features/feature-board/FeatureCard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import type { FeatureRecord, Status } from "@/shared/contracts"
import { getStatusTheme } from "./status-theme"

const FEATURE_COLUMN_ORDER: Status[] = [
  "planned",
  "ready",
  "in-progress",
  "blocked",
  "done",
  "superseded",
  "unknown",
]

function formatStatusLabel(status: string) {
  return status.replaceAll("-", " ")
}

function getFeatureColumns(features: FeatureRecord[]) {
  const seenStatuses = new Set(features.map((feature) => feature.status))

  return FEATURE_COLUMN_ORDER.filter((status) => seenStatuses.has(status)).map(
    (status) => ({
      items: features.filter((feature) => feature.status === status),
      status,
    })
  )
}

export function FeatureBoard({
  error,
  features,
  isLoading,
  onSelectFeature,
  selectedFeatureId,
}: {
  error: string | null
  features: FeatureRecord[]
  isLoading: boolean
  onSelectFeature: (feature: FeatureRecord) => void
  selectedFeatureId: string | null
}) {
  const columns = getFeatureColumns(features)
  const hasPreservedFeatures = columns.length > 0

  return (
    <Card className="tracker-panel min-h-[34rem]">
      <CardHeader>
        <div className="tracker-kicker">Board</div>
        <CardTitle>Feature board</CardTitle>
        <CardDescription>
          Dense status lanes for feature selection and packet drill-down.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        {error && !isLoading ? (
          <Alert variant={hasPreservedFeatures ? "default" : "destructive"}>
            <IconAlertCircle />
            <AlertTitle>
              {hasPreservedFeatures
                ? "Workspace refresh issue"
                : "Workspace unavailable"}
            </AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {isLoading ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="flex min-w-[16rem] flex-1 flex-col gap-3 rounded-lg border border-border/70 bg-muted/20 p-3"
              >
                <Skeleton className="h-4 w-24" />
                {Array.from({ length: 3 }, (_, cardIndex) => (
                  <Skeleton key={cardIndex} className="h-28 w-full rounded-lg" />
                ))}
              </div>
            ))}
          </div>
        ) : columns.length > 0 ? (
          <ScrollArea className="h-full w-full">
            <section
              aria-label="Feature board"
              className="flex w-max min-w-full gap-3 pb-3 pr-3"
            >
              {columns.map((column) => {
                const statusTheme = getStatusTheme(column.status)

                return (
                <section
                  key={column.status}
                  aria-labelledby={`feature-column-${column.status}`}
                  className="flex min-w-[17rem] flex-1 basis-0 flex-col gap-3 rounded-lg border border-border/70 bg-muted/15 p-3"
                >
                  <header className="flex items-center justify-between gap-2 border-b border-border/70 pb-2">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={`size-2 rounded-full ${statusTheme.dotClassName}`}
                      />
                      <h2
                        id={`feature-column-${column.status}`}
                        className="text-[0.7rem] tracking-[0.2em] text-muted-foreground uppercase"
                      >
                        {formatStatusLabel(column.status)}
                      </h2>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {column.items.length}
                    </span>
                  </header>
                  <div className="flex flex-col gap-3">
                    {column.items.map((feature) => (
                      <FeatureCard
                        key={feature.id}
                        feature={feature}
                        selected={selectedFeatureId === feature.id}
                        onSelect={onSelectFeature}
                      />
                    ))}
                  </div>
                </section>
                )
              })}
            </section>
          </ScrollArea>
        ) : !error ? (
          <Empty className="border-border bg-muted/20">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconColumns3 />
              </EmptyMedia>
              <EmptyTitle>No features in the runtime payload</EmptyTitle>
              <EmptyDescription>
                The workspace shell is active, but the current snapshot does not
                expose any feature records yet.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
      </CardContent>
    </Card>
  )
}
