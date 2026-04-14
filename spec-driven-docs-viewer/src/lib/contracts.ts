export type Status =
  | "planned"
  | "ready"
  | "in-progress"
  | "done"
  | "blocked"
  | "superseded"
  | "unknown";

export interface WorkspaceHealth {
  level: "ok" | "warning" | "error";
  messages: string[];
}

export interface FeatureRecord {
  id: string;
  title: string;
  module: string;
  version: string;
  status: Status;
  priority: string;
  depends_on: string[];
  path: string;
  packet_counts?: Partial<Record<Status, number>>;
}

export interface PacketRecord {
  id: string;
  title: string;
  feature: string;
  version: string;
  status: Status;
  owner: string;
  path: string;
}

export interface DeliveryState {
  branch: string;
  updated_at: string;
  implemented_versions: string[];
  in_progress_features: string[];
  ready_packets: string[];
  path: string;
  generated_from: string;
}

export interface WorkspaceDocs {
  features: FeatureRecord[];
  packets: PacketRecord[];
  packetsByFeature: Record<string, PacketRecord[]>;
  delivery: DeliveryState;
  health: WorkspaceHealth;
}

export interface PromptPayload {
  source: "packet" | "generated";
  prompt: string;
}
