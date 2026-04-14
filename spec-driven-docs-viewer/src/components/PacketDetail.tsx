import type { PacketRecord, PromptPayload } from "../lib/contracts";

function formatSource(source: PromptPayload["source"] | null): string {
  if (source === "packet") {
    return "Copied from packet markdown";
  }

  if (source === "generated") {
    return "Copied generated fallback prompt";
  }

  return "";
}

export function PacketDetail(props: {
  packet: PacketRecord | null;
  copyState: {
    packetId: string | null;
    source: PromptPayload["source"] | null;
    pending: boolean;
    error: string | null;
  };
  onCopyPrompt: (packet: PacketRecord) => Promise<void>;
}) {
  if (!props.packet) {
    return <p className="packet-detail-empty">Select a packet to inspect its path and copy prompt.</p>;
  }

  const packet = props.packet;
  const isPending = props.copyState.pending && props.copyState.packetId === packet.id;
  const sourceLabel =
    props.copyState.packetId === packet.id ? formatSource(props.copyState.source) : "";
  const errorLabel = props.copyState.packetId === packet.id ? props.copyState.error : null;

  return (
    <article className="packet-detail">
      <dl className="packet-detail-grid">
        <div>
          <dt>Packet</dt>
          <dd>{packet.title}</dd>
        </div>
        <div>
          <dt>ID</dt>
          <dd>{packet.id}</dd>
        </div>
        <div>
          <dt>Owner</dt>
          <dd>{packet.owner}</dd>
        </div>
        <div>
          <dt>Path</dt>
          <dd>{packet.path}</dd>
        </div>
      </dl>
      <div className="copy-bar">
        <button
          type="button"
          className="copy-button"
          disabled={isPending}
          onClick={() => void props.onCopyPrompt(packet)}
        >
          {isPending ? "Copying…" : "Copy Prompt"}
        </button>
        {errorLabel ? <p className="copy-note copy-note-error">{errorLabel}</p> : null}
        {!errorLabel && sourceLabel ? <p className="copy-note">{sourceLabel}</p> : null}
      </div>
    </article>
  );
}
