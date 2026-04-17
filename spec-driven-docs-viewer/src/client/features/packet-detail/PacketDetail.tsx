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
import type { PacketRecord, PromptPayload } from "@/shared/contracts"

type CopyState = {
  error: string | null
  packetId: string | null
  pending: boolean
  source: PromptPayload["source"] | null
}

function formatPromptSource(source: PromptPayload["source"] | null) {
  if (source === "packet") {
    return "Copied packet prompt"
  }

  if (source === "generated") {
    return "Copied generated fallback prompt"
  }

  return null
}

function formatStatusLabel(status: string) {
  return status.replaceAll("-", " ")
}

export function PacketDetail({
  copyState,
  onCopyPrompt,
  packet,
}: {
  copyState: CopyState
  onCopyPrompt: (packet: PacketRecord) => Promise<void>
  packet: PacketRecord | null
}) {
  if (!packet) {
    return (
      <Empty className="min-h-40 border-border bg-muted/15">
        <EmptyHeader>
          <EmptyTitle>Select a packet</EmptyTitle>
          <EmptyDescription>
            Inspect packet metadata and copy the implementation prompt from here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const isPending = copyState.pending && copyState.packetId === packet.id
  const copyError = copyState.packetId === packet.id ? copyState.error : null
  const copySource =
    copyState.packetId === packet.id
      ? formatPromptSource(copyState.source)
      : null

  return (
    <Card size="sm" className="tracker-panel tracker-panel-strong">
      <CardHeader>
        <CardTitle>Packet detail</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="tracker-kicker">Packet</dt>
            <dd>{packet.title}</dd>
          </div>
          <div className="space-y-1">
            <dt className="tracker-kicker">Feature</dt>
            <dd>{packet.feature}</dd>
          </div>
          <div className="space-y-1">
            <dt className="tracker-kicker">Status</dt>
            <dd>{formatStatusLabel(packet.status)}</dd>
          </div>
          <div className="space-y-1">
            <dt className="tracker-kicker">ID</dt>
            <dd>{packet.id}</dd>
          </div>
          <div className="space-y-1">
            <dt className="tracker-kicker">Owner</dt>
            <dd>{packet.owner}</dd>
          </div>
          <div className="space-y-1">
            <dt className="tracker-kicker">Path</dt>
            <dd className="break-all">{packet.path}</dd>
          </div>
        </dl>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            className="w-fit"
            disabled={isPending}
            onClick={() => void onCopyPrompt(packet)}
          >
            {isPending ? "Copying…" : "Copy Prompt"}
          </Button>
          {copyError ? (
            <p className="text-xs text-destructive">{copyError}</p>
          ) : copySource ? (
            <p className="text-xs text-muted-foreground">{copySource}</p>
          ) : null}
          {packet.implementation_prompt ? (
            <blockquote className="rounded-md border-l-2 border-border/80 bg-muted/18 px-4 py-3 text-sm leading-6 text-foreground/92">
              {packet.implementation_prompt}
            </blockquote>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
