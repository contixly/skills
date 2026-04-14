#!/usr/bin/env bash
set -euo pipefail

command -v npx >/dev/null 2>&1 || {
  echo >&2 "This script requires the npx to be installed"
  exit 1
}

SCRIPT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_ROOT"/..

npx skills add obra/superpowers -a cursor -a codex --skill '*' -p -y
