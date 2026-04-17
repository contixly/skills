import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { WorkspaceDocs } from "@/shared/contracts"

type SummaryMetric = {
  description: string
  label: string
  value: string
}

function buildSummaryMetrics(args: {
  shellState: "loading" | "ready" | "unavailable"
  workspace: WorkspaceDocs | null
  workspaceError: string | null
}): SummaryMetric[] {
  if (args.shellState === "loading") {
    return [
      { label: "HEALTH", value: "Loading", description: "Runtime snapshot" },
      { label: "BRANCH", value: "Loading", description: "Current delivery" },
      { label: "READY PACKETS", value: "0", description: "Queued next" },
      { label: "IMPLEMENTED", value: "0", description: "Release scope" },
      { label: "FEATURES", value: "0", description: "Tracked features" },
      { label: "SOURCE", value: "Workspace", description: "Active feed" },
    ]
  }

  if (args.shellState === "unavailable") {
    const errorDescription = args.workspaceError ?? "Workspace request failed."

    return [
      { label: "HEALTH", value: "UNAVAILABLE", description: errorDescription },
      { label: "BRANCH", value: "UNAVAILABLE", description: errorDescription },
      {
        label: "READY PACKETS",
        value: "UNAVAILABLE",
        description: errorDescription,
      },
      {
        label: "IMPLEMENTED",
        value: "UNAVAILABLE",
        description: errorDescription,
      },
      {
        label: "FEATURES",
        value: "UNAVAILABLE",
        description: errorDescription,
      },
      { label: "SOURCE", value: "UNAVAILABLE", description: errorDescription },
    ]
  }

  const workspace = args.workspace!

  return [
    {
      label: "HEALTH",
      value: workspace.health.level.toUpperCase(),
      description:
        workspace.health.messages[0] ?? "Runtime snapshot looks consistent.",
    },
    {
      label: "BRANCH",
      value: workspace.delivery.branch,
      description: "Current delivery branch",
    },
    {
      label: "READY PACKETS",
      value: String(workspace.delivery.ready_packets.length),
      description: "Packets queued next",
    },
    {
      label: "IMPLEMENTED",
      value:
        workspace.delivery.implemented_versions.join(", ").toUpperCase() ||
        "NONE",
      description: "Versions already recorded",
    },
    {
      label: "FEATURES",
      value: String(workspace.features.length),
      description: "Feature records in snapshot",
    },
    {
      label: "SOURCE",
      value: workspace.meta.source.label,
      description: workspace.meta.mode.toUpperCase(),
    },
  ]
}

export function WorkspaceSummary({
  shellState,
  workspace,
  workspaceError,
}: {
  shellState: "loading" | "ready" | "unavailable"
  workspace: WorkspaceDocs | null
  workspaceError: string | null
}) {
  const metrics = buildSummaryMetrics({ shellState, workspace, workspaceError })

  return (
    <section
      aria-label="Workspace summary"
      className="grid gap-3 md:grid-cols-2 2xl:grid-cols-6"
    >
      {metrics.map((metric) => (
        <Card
          key={metric.label}
          className="tracker-panel tracker-metric-card"
          size="sm"
        >
          <CardHeader>
            <div className="tracker-kicker">{metric.label}</div>
            <CardTitle className="text-sm">{metric.value}</CardTitle>
            <CardDescription>{metric.description}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </section>
  )
}
