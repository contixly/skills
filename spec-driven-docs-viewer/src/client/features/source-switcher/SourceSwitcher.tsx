import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { WorkspaceSnapshotMeta } from "@/shared/contracts"

export function SourceSwitcher({
  isSwitchingSource,
  meta,
  onChange,
  shellState,
  sourceError,
}: {
  isSwitchingSource?: boolean
  meta: WorkspaceSnapshotMeta | null
  onChange?: (sourceId: string) => void
  shellState: "loading" | "ready" | "unavailable"
  sourceError?: string | null
}) {
  if (shellState === "loading") {
    return <Skeleton className="h-10 w-44" />
  }

  if (shellState === "unavailable") {
    return (
      <div className="flex items-center gap-2">
        <span className="tracker-kicker">Source</span>
        <Badge variant="destructive">UNAVAILABLE</Badge>
      </div>
    )
  }

  if (
    meta?.mode !== "dev" ||
    !meta.availableSources ||
    meta.availableSources.length === 0
  ) {
    return (
      <div className="flex items-center gap-2">
        <span className="tracker-kicker">Source</span>
        <Badge variant="outline">{meta?.source.label ?? "Workspace"}</Badge>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="tracker-kicker">Source</span>
      <Select
        disabled={isSwitchingSource}
        value={meta.source.id}
        onValueChange={(value) => onChange?.(value)}
      >
        <SelectTrigger
          size="default"
          aria-label="Workspace source"
          className="tracker-control min-w-44"
        >
          <SelectValue placeholder="Select source" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {meta.availableSources.map((source) => (
              <SelectItem key={source.id} value={source.id}>
                {source.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Badge variant={sourceError ? "destructive" : "secondary"}>
        {sourceError
          ? "SWITCH FAILED"
          : isSwitchingSource
            ? "SWITCHING"
            : meta.source.kind.toUpperCase()}
      </Badge>
    </div>
  )
}
