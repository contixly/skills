# Architecture Overview

## System context

The viewer server loads docs workspaces from disk and exposes normalized JSON snapshots to the React app.

## Reference component map

- Top-level planning docs
- Module docs
- Version, feature, and packet docs
- Compact JSON indexes under docs/_meta

## Key integrations

The dev server reads fixture content from the local filesystem.

## Data and ownership boundaries

The fixture script owns generated markdown and JSON. The viewer treats it as read-only input.

## Repository responsibility

Provide deterministic fixture workspaces for local development and tests.

## Repository non-responsibility

Representing a real customer backlog.

## Runtime and deployment assumptions

The dev server runs locally and can switch sources without restart.

## Architecture risks and open questions

None.