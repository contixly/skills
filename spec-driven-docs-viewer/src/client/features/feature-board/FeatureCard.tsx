import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { FeatureRecord } from "@/shared/contracts"
import { getStatusTheme } from "./status-theme"

function formatStatusLabel(status: string) {
  return status.replaceAll("-", " ")
}

function pluralize(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`
}

function previewList(values: string[]) {
  return values.join(", ")
}

function buildFeatureCardSubtitle(feature: FeatureRecord) {
  const readyCount = feature.packet_counts?.ready ?? 0
  const hasDependencies = feature.depends_on.length > 0

  if (readyCount > 0 && hasDependencies) {
    return `${pluralize(readyCount, "ready packet")} • depends on ${previewList(feature.depends_on)}`
  }

  if (readyCount > 0) {
    return `${pluralize(readyCount, "ready packet")} • no blocking dependencies`
  }

  if (hasDependencies) {
    return `Depends on ${previewList(feature.depends_on)}`
  }

  return "No blocking dependencies"
}

export function FeatureCard({
  feature,
  onSelect,
  selected,
}: {
  feature: FeatureRecord
  onSelect: (feature: FeatureRecord) => void
  selected: boolean
}) {
  const subtitle = buildFeatureCardSubtitle(feature)
  const statusTheme = getStatusTheme(feature.status)

  return (
    <button
      type="button"
      aria-pressed={selected}
      className="w-full text-left"
      title={subtitle}
      onClick={() => onSelect(feature)}
    >
      <Card
        size="sm"
        className={cn(
          "h-full gap-3 border border-border/70 bg-card/95 transition hover:border-primary/40 hover:bg-card",
          selected
            ? "tracker-accent-surface"
            : "ring-2 ring-transparent ring-offset-2 ring-offset-background"
        )}
      >
        <CardHeader className="gap-2">
          <CardAction>
            <Badge
              variant="outline"
              className={cn(
                "shadow-none",
                statusTheme.badgeClassName
              )}
            >
              {formatStatusLabel(feature.status)}
            </Badge>
          </CardAction>
          <CardTitle className="pr-10 leading-5">{feature.title}</CardTitle>
          <CardDescription>{subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="outline">{feature.id}</Badge>
          <Badge variant="secondary">{feature.version}</Badge>
          <Badge variant="secondary">{feature.module}</Badge>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 pt-0 text-[0.625rem] tracking-[0.18em] text-muted-foreground uppercase">
          <span>Priority {feature.priority}</span>
          <span>Ready {feature.packet_counts?.ready ?? 0}</span>
        </CardFooter>
      </Card>
    </button>
  )
}
