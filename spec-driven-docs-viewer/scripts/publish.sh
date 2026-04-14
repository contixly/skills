#!/bin/sh

set -eu

usage() {
  cat <<'EOF'
Usage: ./scripts/publish.sh [npm-publish-args...]

Publishes @contixly/spec-driven-docs-viewer from the current source checkout.

Flow:
  1. Verifies npm authentication
  2. Verifies the package version is not already published
  3. Runs test, typecheck, and build
  4. Runs npm pack --dry-run --json
  5. Runs npm publish with any forwarded arguments

Examples:
  ./scripts/publish.sh
  ./scripts/publish.sh --dry-run
  ./scripts/publish.sh --tag next

Versioning:
  Bump package.json first, for example:
    npm version patch
EOF
}

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  usage
  exit 0
fi

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
PACKAGE_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

cd "$PACKAGE_ROOT"

PACKAGE_NAME=$(node -p "require('./package.json').name")
PACKAGE_VERSION=$(node -p "require('./package.json').version")
DRY_RUN=0

for arg in "$@"; do
  if [ "$arg" = "--dry-run" ]; then
    DRY_RUN=1
  fi
done

echo "Publishing $PACKAGE_NAME@$PACKAGE_VERSION"

if [ "$DRY_RUN" -ne 1 ] && ! npm whoami >/dev/null 2>&1; then
  echo "npm authentication required. Run: npm login" >&2
  exit 1
fi

if npm view "$PACKAGE_NAME@$PACKAGE_VERSION" version >/dev/null 2>&1; then
  echo "Version already exists on npm: $PACKAGE_NAME@$PACKAGE_VERSION" >&2
  echo "Bump the version before publishing, for example: npm version patch" >&2
  exit 1
fi

npm test
npm run check
npm run build
npm pack --dry-run --json
npm publish "$@"
