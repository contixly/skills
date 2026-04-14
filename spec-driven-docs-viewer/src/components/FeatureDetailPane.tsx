import type { FeatureRecord, PacketRecord, PromptPayload } from "../lib/contracts";
import { PacketBoard } from "./PacketBoard";
import { PacketDetail } from "./PacketDetail";

export function FeatureDetailPane(props: {
  feature: FeatureRecord | null;
  packets: PacketRecord[];
  selectedPacketId: string | null;
  copyState: {
    packetId: string | null;
    source: PromptPayload["source"] | null;
    pending: boolean;
    error: string | null;
  };
  onSelectPacket: (packet: PacketRecord) => void;
  onCopyPrompt: (packet: PacketRecord) => Promise<void>;
}) {
  if (!props.feature) {
    return (
      <aside className="detail-pane detail-pane-empty">
        <p className="eyebrow">Drilldown</p>
        <h2>Select a feature</h2>
        <p>Inspect packet status, open a packet, and copy the next implementation prompt.</p>
      </aside>
    );
  }

  const selectedPacket = props.packets.find((packet) => packet.id === props.selectedPacketId) ?? null;

  return (
    <aside className="detail-pane">
      <header className="detail-header">
        <p className="eyebrow">Feature detail</p>
        <h2>{props.feature.title}</h2>
        <p className="detail-subtitle">
          {props.feature.id} / {props.feature.version} / {props.feature.module}
        </p>
      </header>
      <div className="detail-stack">
        <section className="detail-section">
          <div className="section-heading">
            <h3>Packets</h3>
            <span>{props.packets.length}</span>
          </div>
          <PacketBoard
            packets={props.packets}
            selectedPacketId={props.selectedPacketId}
            onSelectPacket={props.onSelectPacket}
          />
        </section>
        <section className="detail-section">
          <div className="section-heading">
            <h3>Packet detail</h3>
          </div>
          <PacketDetail
            packet={selectedPacket}
            copyState={props.copyState}
            onCopyPrompt={props.onCopyPrompt}
          />
        </section>
      </div>
    </aside>
  );
}
