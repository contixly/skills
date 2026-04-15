import type { Status } from "./contracts.js"

const KNOWN_STATUSES = new Set<Status>([
  "planned",
  "ready",
  "in-progress",
  "done",
  "blocked",
  "superseded",
  "unknown",
])

export function normalizeStatus(status: string): Status {
  return KNOWN_STATUSES.has(status as Status) ? (status as Status) : "unknown"
}
