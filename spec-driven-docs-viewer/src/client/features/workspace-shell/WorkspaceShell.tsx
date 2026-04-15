import type { ReactNode } from "react"

export function WorkspaceShell({
  board,
  header,
  inspector,
  summary,
}: {
  board: ReactNode
  header: ReactNode
  inspector: ReactNode
  summary: ReactNode
}) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="tracker-shell">
        {header}
        {summary}
        <div className="tracker-grid">
          {board}
          {inspector}
        </div>
      </div>
    </div>
  )
}
