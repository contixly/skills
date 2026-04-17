import { IconAlertCircle, IconLayoutSidebarRightExpand } from "@tabler/icons-react"

import { FeatureMetadataBadges } from "@/client/features/feature-board/feature-metadata-badges"
import { PacketBoard } from "@/client/features/packet-board/PacketBoard"
import { PacketDetail } from "@/client/features/packet-detail/PacketDetail"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import type {
  FeatureRecord,
  PacketRecord,
  PromptPayload,
} from "@/shared/contracts"

type CopyState = {
  error: string | null
  packetId: string | null
  pending: boolean
  source: PromptPayload["source"] | null
}

export function FeatureInspector({
  copyState,
  error,
  feature,
  isLoading,
  onCopyPrompt,
  onOpenChange,
  onSelectPacket,
  open,
  packets,
  selectedPacket,
  selectedPacketId,
}: {
  copyState: CopyState
  error: string | null
  feature: FeatureRecord | null
  isLoading: boolean
  onCopyPrompt: (packet: PacketRecord) => Promise<void>
  onOpenChange: (open: boolean) => void
  onSelectPacket: (packet: PacketRecord) => void
  open: boolean
  packets: PacketRecord[]
  selectedPacket: PacketRecord | null
  selectedPacketId: string | null
}) {
  const inspectorDescription =
    feature?.id ?? "Choose a card to inspect packets and copy the next prompt."
  const dependencySummary = feature
    ? feature.depends_on.length > 0
      ? `Depends on ${feature.depends_on.join(", ")}`
      : "No upstream dependencies recorded."
    : inspectorDescription

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="tracker-sheet-content tracker-overlay-surface overflow-y-auto p-0 data-[side=right]:w-[min(72rem,calc(100vw-2rem))] data-[side=right]:sm:max-w-none"
      >
        <SheetHeader className="gap-3 border-b border-border/70 px-8 pt-8 pb-5">
          <div className="tracker-kicker">Detail surface</div>
          <SheetTitle>{feature?.title ?? "Select a feature"}</SheetTitle>
          {feature ? <FeatureMetadataBadges feature={feature} includePriority /> : null}
          <SheetDescription>{dependencySummary}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-5 px-8 pt-4 pb-8">
          <InspectorContent
            copyState={copyState}
            error={error}
            feature={feature}
            isLoading={isLoading}
            onCopyPrompt={onCopyPrompt}
            onSelectPacket={onSelectPacket}
            packets={packets}
            selectedPacket={selectedPacket}
            selectedPacketId={selectedPacketId}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

function InspectorContent({
  copyState,
  error,
  feature,
  isLoading,
  onCopyPrompt,
  onSelectPacket,
  packets,
  selectedPacket,
  selectedPacketId,
}: {
  copyState: CopyState
  error: string | null
  feature: FeatureRecord | null
  isLoading: boolean
  onCopyPrompt: (packet: PacketRecord) => Promise<void>
  onSelectPacket: (packet: PacketRecord) => void
  packets: PacketRecord[]
  selectedPacket: PacketRecord | null
  selectedPacketId: string | null
}) {
  if (error && !feature) {
    return (
      <Alert variant="destructive">
        <IconAlertCircle />
        <AlertTitle>Snapshot failed</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-44 w-full" />
      </div>
    )
  }

  if (!feature) {
    return (
      <Empty className="min-h-[22rem] border-border bg-muted/20">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconLayoutSidebarRightExpand />
          </EmptyMedia>
          <EmptyTitle>Selection hooks are live</EmptyTitle>
          <EmptyDescription>
            Choose a feature to reveal grouped packets and the prompt copy
            action.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <>
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="tracker-kicker">Packets</h2>
          <span className="text-xs text-muted-foreground">{packets.length}</span>
        </div>
        <PacketBoard
          packets={packets}
          selectedPacketId={selectedPacketId}
          onSelectPacket={onSelectPacket}
        />
      </section>
      <PacketDetail
        copyState={copyState}
        packet={selectedPacket}
        onCopyPrompt={onCopyPrompt}
      />
    </>
  )
}
