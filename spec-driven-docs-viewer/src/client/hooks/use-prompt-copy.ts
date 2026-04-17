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

async function copyWithFallback(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return
    }
  } catch {
    // Fall through to the legacy document copy path for restricted webviews.
  }

  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "true")
  textarea.style.position = "fixed"
  textarea.style.top = "0"
  textarea.style.left = "-9999px"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()

  const copied = document.execCommand("copy")
  document.body.removeChild(textarea)

  if (!copied) {
    throw new Error("Clipboard unavailable")
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

      await copyWithFallback(payload.prompt)
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
