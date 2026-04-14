import { useEffect, useState } from "react";
import { FeatureBoard } from "./components/FeatureBoard";
import { FeatureDetailPane } from "./components/FeatureDetailPane";
import type { FeatureRecord, PacketRecord, PromptPayload, Status, WorkspaceDocs } from "./lib/contracts";
import "./styles.css";

const FEATURE_COLUMN_ORDER: Status[] = [
  "planned",
  "ready",
  "in-progress",
  "blocked",
  "done",
  "superseded",
  "unknown"
];

function sortStatuses(features: WorkspaceDocs["features"]): Status[] {
  const seen = new Set(features.map((feature) => feature.status));
  const ordered = FEATURE_COLUMN_ORDER.filter((status) => seen.has(status));

  if (ordered.length > 0) {
    return ordered;
  }

  return FEATURE_COLUMN_ORDER.slice(0, 4);
}

export function App() {
  const [workspace, setWorkspace] = useState<WorkspaceDocs | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<FeatureRecord | null>(null);
  const [selectedPacket, setSelectedPacket] = useState<PacketRecord | null>(null);
  const [copyState, setCopyState] = useState<{
    packetId: string | null;
    source: PromptPayload["source"] | null;
    pending: boolean;
    error: string | null;
  }>({
    packetId: null,
    source: null,
    pending: false,
    error: null
  });

  async function loadWorkspace(signal?: { cancelled: boolean }) {
    try {
      setWorkspaceError(null);
      const response = await fetch("/api/workspace");
      if (!response.ok) {
        throw new Error(`Workspace request failed with ${response.status}`);
      }

      const payload = (await response.json()) as WorkspaceDocs;

      if (!signal?.cancelled) {
        setWorkspace(payload);
      }
    } catch (_error) {
      if (!signal?.cancelled) {
        setWorkspace(null);
        setWorkspaceError("Unable to load workspace.");
      }
    }
  }

  useEffect(() => {
    const signal = { cancelled: false };

    void loadWorkspace(signal);

    return () => {
      signal.cancelled = true;
    };
  }, []);

  async function handleCopyPrompt(packet: PacketRecord) {
    setCopyState({
      packetId: packet.id,
      source: null,
      pending: true,
      error: null
    });

    try {
      const response = await fetch(`/api/prompt/${packet.id}`);
      if (!response.ok) {
        throw new Error(`Prompt request failed with ${response.status}`);
      }

      const payload = (await response.json()) as PromptPayload;
      await navigator.clipboard.writeText(payload.prompt);

      setCopyState({
        packetId: packet.id,
        source: payload.source,
        pending: false,
        error: null
      });
    } catch (_error) {
      setCopyState({
        packetId: packet.id,
        source: null,
        pending: false,
        error: "Unable to copy prompt."
      });
    }
  }

  if (!workspace && !workspaceError) {
    return (
      <div className="app-shell">
        <main className="workspace-loading">Loading viewer…</main>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="app-shell">
        <main className="workspace-loading workspace-error-state">
          <div className="error-panel" role="alert">
            <p className="eyebrow">Workspace error</p>
            <h1>Unable to load workspace.</h1>
            <p>Check the local viewer server and try again.</p>
            <button type="button" className="retry-button" onClick={() => void loadWorkspace()}>
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  const featureColumns = sortStatuses(workspace.features).map((status) => ({
    status,
    items: workspace.features.filter((feature) => feature.status === status)
  }));
  const selectedPackets = selectedFeature ? workspace.packetsByFeature[selectedFeature.id] ?? [] : [];

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Read-only workspace</p>
          <h1>Spec-Driven Docs Viewer</h1>
        </div>
        <dl className="workspace-meta">
          <div>
            <dt>Branch</dt>
            <dd>{workspace.delivery.branch}</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>{workspace.delivery.updated_at}</dd>
          </div>
          <div>
            <dt>Health</dt>
            <dd className={`health health-${workspace.health.level}`}>{workspace.health.level}</dd>
          </div>
        </dl>
      </header>

      {workspace.health.messages.length > 0 ? (
        <div className={`health-banner health-banner-${workspace.health.level}`} role="status">
          {workspace.health.messages[0]}
        </div>
      ) : null}

      <main className="workspace-layout">
        <FeatureBoard
          columns={featureColumns}
          selectedFeatureId={selectedFeature?.id ?? null}
          onSelectFeature={(feature) => {
            setSelectedFeature(feature);
            setSelectedPacket(null);
            setCopyState({
              packetId: null,
              source: null,
              pending: false,
              error: null
            });
          }}
        />
        <FeatureDetailPane
          feature={selectedFeature}
          packets={selectedPackets}
          selectedPacketId={selectedPacket?.id ?? null}
          copyState={copyState}
          onSelectPacket={setSelectedPacket}
          onCopyPrompt={handleCopyPrompt}
        />
      </main>
    </div>
  );
}
