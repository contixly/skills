import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"
import type { PacketRecord, Status } from "@/shared/contracts"

const PACKET_STATUS_ORDER: Status[] = [
  "ready",
  "in-progress",
  "blocked",
  "planned",
  "done",
  "superseded",
  "unknown",
]

function formatStatusLabel(status: string) {
  return status.replaceAll("-", " ")
}

export function PacketBoard({
  onSelectPacket,
  packets,
  selectedPacketId,
}: {
  onSelectPacket: (packet: PacketRecord) => void
  packets: PacketRecord[]
  selectedPacketId: string | null
}) {
  const visibleStatuses = PACKET_STATUS_ORDER.filter((status) =>
    packets.some((packet) => packet.status === status)
  )

  if (visibleStatuses.length === 0) {
    return (
      <Empty className="min-h-32 border-border bg-muted/15">
        <EmptyHeader>
          <EmptyTitle>No packets for this feature</EmptyTitle>
          <EmptyDescription>
            Packet grouping will appear here once the selected feature exposes
            iteration records.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <section aria-label="Packet board" className="grid gap-3 xl:grid-cols-2">
      {visibleStatuses.map((status) => {
        const statusPackets = packets.filter((packet) => packet.status === status)

        return (
          <Card
            key={status}
            size="sm"
            className="tracker-panel tracker-panel-strong"
          >
            <CardHeader className="gap-2 border-b border-border/70 pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-[0.7rem] tracking-[0.2em] text-muted-foreground uppercase">
                  {formatStatusLabel(status)}
                </CardTitle>
                <Badge variant="outline">{statusPackets.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-3">
              {statusPackets.map((packet) => (
                <Button
                  key={packet.id}
                  type="button"
                  variant="outline"
                  aria-pressed={selectedPacketId === packet.id}
                  className={cn(
                    "h-auto items-start justify-start px-3 py-2 text-left",
                    selectedPacketId === packet.id && "tracker-accent-surface"
                  )}
                  onClick={() => onSelectPacket(packet)}
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <strong className="truncate text-xs font-medium">
                      {packet.title}
                    </strong>
                    <span className="text-[0.625rem] tracking-[0.18em] text-muted-foreground uppercase">
                      {packet.id}
                    </span>
                    <span className="text-[0.625rem] text-muted-foreground">
                      {packet.owner}
                    </span>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        )
      })}
    </section>
  )
}
