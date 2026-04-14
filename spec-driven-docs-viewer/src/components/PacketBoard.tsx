import type { PacketRecord, Status } from "../lib/contracts";

const PACKET_STATUS_ORDER: Status[] = [
  "ready",
  "in-progress",
  "blocked",
  "planned",
  "done",
  "superseded",
  "unknown"
];

function formatStatus(status: Status): string {
  return status.replace("-", " ");
}

export function PacketBoard(props: {
  packets: PacketRecord[];
  selectedPacketId: string | null;
  onSelectPacket: (packet: PacketRecord) => void;
}) {
  const visibleStatuses = PACKET_STATUS_ORDER.filter((status) =>
    props.packets.some((packet) => packet.status === status)
  );

  return (
    <div className="packet-board" aria-label="Packet board">
      {visibleStatuses.map((status) => {
        const packets = props.packets.filter((packet) => packet.status === status);

        return (
          <section key={status} className="packet-column" aria-labelledby={`packet-column-${status}`}>
            <header className="packet-column-header">
              <h4 id={`packet-column-${status}`}>{formatStatus(status)}</h4>
              <span>{packets.length}</span>
            </header>
            <div className="packet-column-body">
              {packets.map((packet) => (
                <button
                  key={packet.id}
                  type="button"
                  className={`packet-row ${props.selectedPacketId === packet.id ? "selected" : ""}`}
                  aria-pressed={props.selectedPacketId === packet.id}
                  onClick={() => props.onSelectPacket(packet)}
                >
                  <strong>{packet.title}</strong>
                  <span>{packet.id}</span>
                  <span>{packet.owner}</span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
