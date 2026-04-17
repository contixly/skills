import { useEffect, useState } from "react"

import { FeatureBoard } from "@/client/features/feature-board/FeatureBoard"
import { WorkspaceCommandPalette } from "@/client/features/command-palette/WorkspaceCommandPalette"
import { FeatureInspector } from "@/client/features/feature-inspector/FeatureInspector"
import { useFeatureSelection } from "@/client/hooks/use-feature-selection"
import { usePromptCopy } from "@/client/hooks/use-prompt-copy"
import { useSourceSwitcher } from "@/client/hooks/use-source-switcher"
import { useWorkspaceEvents } from "@/client/hooks/use-workspace-events"
import { useWorkspaceSnapshot } from "@/client/hooks/use-workspace-snapshot"
import { SourceSwitcher } from "@/client/features/source-switcher/SourceSwitcher"
import { WorkspaceHeader } from "@/client/features/workspace-header/WorkspaceHeader"
import { WorkspaceShell } from "@/client/features/workspace-shell/WorkspaceShell"
import { WorkspaceSummary } from "@/client/features/workspace-summary/WorkspaceSummary"
import { ThemeToggle } from "@/client/features/theme-toggle/ThemeToggle"
import { ThemeProvider } from "@/components/theme-provider"

function AppContent() {
  const { isLoading, loadWorkspace, shellState, workspace, workspaceError } =
    useWorkspaceSnapshot()
  const {
    selectFeature,
    selectPacket,
    selectedFeature,
    selectedFeatureId,
    selectedPacket,
    selectedPacketId,
    selectedPackets,
  } = useFeatureSelection(workspace)
  const { copyPrompt, copyState, resetCopyState } = usePromptCopy()
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [isInspectorOpen, setInspectorOpen] = useState(false)

  const { isSwitchingSource, sourceError, switchSource } = useSourceSwitcher({
    refreshWorkspace: async () => {
      await loadWorkspace({ preserveWorkspace: true })
    },
    workspace,
  })

  useWorkspaceEvents({
    currentRevision: workspace?.meta.revision ?? null,
    isSnapshotPending: shellState === "loading",
    onRevision: () => {
      void loadWorkspace({ preserveWorkspace: true })
    },
  })

  useEffect(() => {
    if (!selectedPacket && copyState.packetId) {
      resetCopyState()
    }
  }, [copyState.packetId, resetCopyState, selectedPacket])

  useEffect(() => {
    if (!selectedFeature) {
      setInspectorOpen(false)
    }
  }, [selectedFeature])

  function handleSelectFeature(feature: NonNullable<typeof selectedFeature>) {
    selectFeature(feature)
    resetCopyState()
    setInspectorOpen(true)
  }

  function handleSelectPacket(packet: NonNullable<typeof selectedPacket>) {
    const feature =
      workspace?.features.find((candidate) => candidate.id === packet.feature) ?? null

    if (!feature) {
      return
    }

    if (selectedFeatureId !== feature.id) {
      selectFeature(feature)
    }

    selectPacket(packet)
    setInspectorOpen(true)
  }

  return (
    <WorkspaceShell
      header={
        <WorkspaceHeader
          commandPalette={
            <WorkspaceCommandPalette
              features={workspace?.features ?? []}
              open={isCommandPaletteOpen}
              packets={workspace?.packets ?? []}
              onOpenChange={setCommandPaletteOpen}
              onSelectFeature={handleSelectFeature}
              onSelectPacket={handleSelectPacket}
            />
          }
          delivery={workspace?.delivery ?? null}
          health={workspace?.health ?? null}
          meta={workspace?.meta ?? null}
          shellState={shellState}
          themeToggle={<ThemeToggle />}
          sourceSwitcher={
            <SourceSwitcher
              isSwitchingSource={isSwitchingSource}
              meta={workspace?.meta ?? null}
              onChange={switchSource}
              shellState={shellState}
              sourceError={sourceError}
            />
          }
        />
      }
      summary={
        <WorkspaceSummary
          shellState={shellState}
          workspace={workspace}
          workspaceError={workspaceError}
        />
      }
      board={
        <div
          data-testid="workspace-board-stage"
          className="tracker-board-stage"
        >
          <FeatureBoard
            error={workspaceError}
            features={workspace?.features ?? []}
            isLoading={isLoading}
            selectedFeatureId={selectedFeatureId}
            onSelectFeature={handleSelectFeature}
          />
        </div>
      }
      inspector={
        <FeatureInspector
          copyState={copyState}
          error={workspaceError}
          feature={selectedFeature}
          isLoading={isLoading}
          open={isInspectorOpen}
          packets={selectedPackets}
          selectedPacket={selectedPacket}
          selectedPacketId={selectedPacketId}
          onCopyPrompt={copyPrompt}
          onSelectPacket={handleSelectPacket}
          onOpenChange={setInspectorOpen}
        />
      }
    />
  )
}

export function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <AppContent />
    </ThemeProvider>
  )
}
