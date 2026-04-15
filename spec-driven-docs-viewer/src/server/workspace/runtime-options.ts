export interface RuntimeOptions {
  mode: "runtime" | "dev"
  runtime: {
    workspaceRoot: string
  }
  dev: {
    defaultSourceId: string
    externalWorkspaceRoot: string | null
  }
}

function parseWorkspaceFlag(argv: string[]): string | null {
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]

    if (value === "--workspace") {
      const next = argv[index + 1]
      if (!next || next.startsWith("-")) {
        throw new Error("Missing value for --workspace.")
      }

      return next
    }

    if (value.startsWith("--workspace=")) {
      const workspaceRoot = value.slice("--workspace=".length)
      if (workspaceRoot.length === 0) {
        throw new Error("Missing value for --workspace.")
      }

      return workspaceRoot
    }
  }

  return null
}

export function parseRuntimeOptions(args: {
  argv: string[]
  cwd: string
  mode: "runtime" | "dev"
}): RuntimeOptions {
  return {
    mode: args.mode,
    runtime: {
      workspaceRoot: args.cwd,
    },
    dev: {
      defaultSourceId: "dense-portfolio",
      externalWorkspaceRoot: args.mode === "dev" ? parseWorkspaceFlag(args.argv) : null,
    },
  }
}
