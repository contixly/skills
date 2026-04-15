import { useEffect, useEffectEvent } from "react"
import { IconSearch } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { FeatureRecord, PacketRecord } from "@/shared/contracts"

export function WorkspaceCommandPalette({
  features,
  onOpenChange,
  onSelectFeature,
  onSelectPacket,
  open,
  packets,
}: {
  features: FeatureRecord[]
  onOpenChange: (open: boolean) => void
  onSelectFeature: (feature: FeatureRecord) => void
  onSelectPacket: (packet: PacketRecord) => void
  open: boolean
  packets: PacketRecord[]
}) {
  const handleShortcut = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null
    const isTypingTarget =
      target?.tagName === "INPUT" ||
      target?.tagName === "TEXTAREA" ||
      target?.isContentEditable

    if (isTypingTarget) {
      return
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault()
      onOpenChange(true)
    }
  })

  useEffect(() => {
    document.addEventListener("keydown", handleShortcut)

    return () => {
      document.removeEventListener("keydown", handleShortcut)
    }
  }, [handleShortcut])

  const shortcutLabel =
    typeof navigator !== "undefined" &&
    typeof navigator.userAgent === "string" &&
    navigator.userAgent.includes("Mac")
      ? "cmd+k"
      : "ctrl+k"

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="default"
          className="tracker-control min-w-[18rem] justify-between gap-3 px-3 h-10"
        >
          <span className="flex min-w-0 items-center gap-2">
            <IconSearch />
            <span className="truncate">Jump to feature or packet</span>
          </span>
          <span
            aria-hidden="true"
            className="tracker-chip h-7 shrink-0 px-3"
          >
            {shortcutLabel}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="tracker-command-popover tracker-overlay-surface p-0"
      >
        <Command>
          <CommandInput placeholder="Search features and packets..." />
          <CommandList>
            <CommandEmpty>No matching features or packets.</CommandEmpty>
            {features.length > 0 ? (
              <CommandGroup heading="Features">
                {features.map((feature) => (
                  <CommandItem
                    key={feature.id}
                    value={`${feature.title} ${feature.id} ${feature.module} ${feature.version}`}
                    keywords={[
                      feature.id,
                      feature.module,
                      feature.priority,
                      feature.status,
                    ]}
                    onSelect={() => {
                      onSelectFeature(feature)
                      onOpenChange(false)
                    }}
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate font-medium">{feature.title}</span>
                      <span className="truncate text-[0.625rem] text-muted-foreground">
                        {feature.id} · {feature.module} · {feature.version}
                      </span>
                    </div>
                    <CommandShortcut>feature</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            {features.length > 0 && packets.length > 0 ? <CommandSeparator /> : null}
            {packets.length > 0 ? (
              <CommandGroup heading="Packets">
                {packets.map((packet) => (
                  <CommandItem
                    key={packet.id}
                    value={`${packet.title} ${packet.id} ${packet.feature} ${packet.owner}`}
                    keywords={[
                      packet.id,
                      packet.feature,
                      packet.owner,
                      packet.status,
                    ]}
                    onSelect={() => {
                      onSelectPacket(packet)
                      onOpenChange(false)
                    }}
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate font-medium">{packet.title}</span>
                      <span className="truncate text-[0.625rem] text-muted-foreground">
                        {packet.id} · {packet.feature} · {packet.owner}
                      </span>
                    </div>
                    <CommandShortcut>packet</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
