#!/usr/bin/env node

import open from "open"
import { startViewerServer } from "./app/start-viewer-server.js"
import { parseRuntimeOptions } from "./workspace/runtime-options.js"

function parseStringFlag(argv: string[], name: string): string | null {
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]

    if (value === `--${name}`) {
      const next = argv[index + 1]
      if (!next || next.startsWith("-")) {
        throw new Error(`Missing value for --${name}.`)
      }

      return next
    }

    const prefix = `--${name}=`
    if (value.startsWith(prefix)) {
      const parsed = value.slice(prefix.length)
      if (parsed.length === 0) {
        throw new Error(`Missing value for --${name}.`)
      }

      return parsed
    }
  }

  return null
}

function parsePort(argv: string[]): number {
  const value = parseStringFlag(argv, "port")
  if (value === null) {
    return 0
  }

  const port = Number.parseInt(value, 10)
  if (!Number.isInteger(port) || port < 0) {
    throw new Error(`Invalid value for --port: ${value}`)
  }

  return port
}

function parseHost(argv: string[]): string {
  return parseStringFlag(argv, "host") ?? "127.0.0.1"
}

function shouldOpenBrowser(argv: string[]): boolean {
  return argv.includes("--open")
}

async function main() {
  const argv = process.argv.slice(2)
  const options = parseRuntimeOptions({
    argv: process.argv,
    cwd: process.cwd(),
    mode: "runtime",
  })
  const server = await startViewerServer({
    mode: "runtime",
    workspaceRoot: options.runtime.workspaceRoot,
    host: parseHost(argv),
    port: parsePort(argv),
  })

  process.stdout.write(`${server.url}\n`)
  if (shouldOpenBrowser(argv)) {
    await open(server.url)
  }
}

void main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
