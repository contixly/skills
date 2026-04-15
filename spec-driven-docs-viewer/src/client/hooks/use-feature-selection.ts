import { useEffect, useState } from "react"

import type {
  FeatureRecord,
  PacketRecord,
  WorkspaceDocs,
} from "@/shared/contracts"

export function useFeatureSelection(workspace: WorkspaceDocs | null) {
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null)
  const [selectedPacketId, setSelectedPacketId] = useState<string | null>(null)

  const selectedFeature =
    workspace?.features.find((feature) => feature.id === selectedFeatureId) ?? null
  const selectedPackets = selectedFeature
    ? workspace?.packetsByFeature[selectedFeature.id] ?? []
    : []
  const selectedPacket =
    selectedPackets.find((packet) => packet.id === selectedPacketId) ?? null

  useEffect(() => {
    if (!workspace) {
      setSelectedFeatureId(null)
      setSelectedPacketId(null)
      return
    }

    if (selectedFeatureId && !selectedFeature) {
      setSelectedFeatureId(null)
      setSelectedPacketId(null)
      return
    }

    if (selectedPacketId && !selectedPacket) {
      setSelectedPacketId(null)
    }
  }, [
    selectedFeature,
    selectedFeatureId,
    selectedPacket,
    selectedPacketId,
    workspace,
  ])

  function selectFeature(feature: FeatureRecord) {
    setSelectedFeatureId(feature.id)
    setSelectedPacketId(null)
  }

  function selectPacket(packet: PacketRecord) {
    setSelectedPacketId(packet.id)
  }

  function clearSelection() {
    setSelectedFeatureId(null)
    setSelectedPacketId(null)
  }

  return {
    clearSelection,
    selectFeature,
    selectPacket,
    selectedFeature,
    selectedFeatureId,
    selectedPacket,
    selectedPacketId,
    selectedPackets,
  }
}
