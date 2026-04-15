import { useRef, useState } from "react"

import type { PacketRecord, PromptPayload } from "@/shared/contracts"

type PromptCopyState = {
  error: string | null
  packetId: string | null
  pending: boolean
  source: PromptPayload["source"] | null
}

function createEmptyCopyState(): PromptCopyState {
  return {
    error: null,
    packetId: null,
    pending: false,
    source: null,
  }
}

export function usePromptCopy() {
  const [copyState, setCopyState] = useState<PromptCopyState>(
    createEmptyCopyState
  )
  const requestVersionRef = useRef(0)

  function resetCopyState() {
    requestVersionRef.current += 1
    setCopyState(createEmptyCopyState())
  }

  async function copyPrompt(packet: PacketRecord) {
    const requestVersion = requestVersionRef.current + 1
    requestVersionRef.current = requestVersion

    setCopyState({
      error: null,
      packetId: packet.id,
      pending: true,
      source: null,
    })

    try {
      const response = await fetch(`/api/prompt/${packet.id}`)
      if (!response.ok) {
        throw new Error(`Prompt request failed with ${response.status}`)
      }

      const payload = (await response.json()) as PromptPayload
      if (requestVersion !== requestVersionRef.current) {
        return
      }

      const clipboard = navigator.clipboard?.writeText
      if (!clipboard) {
        throw new Error("Clipboard unavailable")
      }

      await clipboard(payload.prompt)
      if (requestVersion !== requestVersionRef.current) {
        return
      }

      setCopyState({
        error: null,
        packetId: packet.id,
        pending: false,
        source: payload.source,
      })
    } catch {
      if (requestVersion !== requestVersionRef.current) {
        return
      }

      setCopyState({
        error: "Unable to copy prompt.",
        packetId: packet.id,
        pending: false,
        source: null,
      })
    }
  }

  return {
    copyPrompt,
    copyState,
    resetCopyState,
  }
}
