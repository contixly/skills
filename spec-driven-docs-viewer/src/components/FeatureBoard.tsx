import type { FeatureRecord, Status } from "../lib/contracts";

function formatStatus(status: Status): string {
  return status.replace("-", " ");
}

export function FeatureBoard(props: {
  columns: Array<{ status: Status; items: FeatureRecord[] }>;
  selectedFeatureId: string | null;
  onSelectFeature: (feature: FeatureRecord) => void;
}) {
  return (
    <section className="feature-board" aria-label="Feature board">
      {props.columns.map((column) => (
        <section key={column.status} className="board-column" aria-labelledby={`feature-column-${column.status}`}>
          <header className="board-column-header">
            <h2 id={`feature-column-${column.status}`}>{formatStatus(column.status)}</h2>
            <span>{column.items.length}</span>
          </header>
          <div className="board-column-body">
            {column.items.map((feature) => (
              <button
                key={feature.id}
                type="button"
                className={`feature-card ${props.selectedFeatureId === feature.id ? "selected" : ""}`}
                aria-pressed={props.selectedFeatureId === feature.id}
                onClick={() => props.onSelectFeature(feature)}
              >
                <div className="feature-card-heading">
                  <strong>{feature.title}</strong>
                  <span className={`status-pill status-${feature.status}`}>{formatStatus(feature.status)}</span>
                </div>
                <div className="feature-card-meta">
                  <span>{feature.id}</span>
                  <span>
                    {feature.version} / {feature.module}
                  </span>
                </div>
                <div className="feature-card-footer">
                  <span>Priority {feature.priority}</span>
                  <span>Ready {feature.packet_counts?.ready ?? 0}</span>
                </div>
              </button>
            ))}
            {column.items.length === 0 ? <p className="empty-column">No features</p> : null}
          </div>
        </section>
      ))}
    </section>
  );
}
