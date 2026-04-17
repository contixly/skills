import { Badge } from "@/components/ui/badge"
import type { FeatureRecord } from "@/shared/contracts"

export function renderPriorityValue(priority: string) {
  const normalized = priority.toUpperCase()

  if (normalized === "HIGH") {
    return (
      <span className="font-semibold text-[oklch(0.52_0.14_28)]">HIGH</span>
    )
  }

  return normalized
}

export function FeatureMetadataBadges({
  feature,
  includePriority = false,
}: {
  feature: FeatureRecord
  includePriority?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge
        variant="outline"
        className="font-mono tracking-[0.08em] text-[0.6rem]"
      >
        {feature.id}
      </Badge>
      <Badge
        variant="secondary"
        className="border-transparent bg-[oklch(0.92_0.012_85)] font-semibold tracking-[0.16em] text-[oklch(0.36_0.01_85)] uppercase"
      >
        {feature.version.toUpperCase()}
      </Badge>
      <Badge
        variant="secondary"
        className="border-transparent bg-muted/65 text-muted-foreground"
      >
        {feature.module}
      </Badge>
      {includePriority ? (
        <Badge
          variant="secondary"
          className="border-transparent bg-muted/65 uppercase"
        >
          {renderPriorityValue(feature.priority)}
        </Badge>
      ) : null}
    </div>
  )
}
