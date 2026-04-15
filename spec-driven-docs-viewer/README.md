# Spec-Driven Docs Viewer

Canonical implementation of `@contixly/spec-driven-docs-viewer`.

This package serves the local viewer for `docs/_meta/*.json` indexes and packet markdown, with the same runtime contract used by the original viewer package while the shadcn/Tailwind shell becomes the primary implementation.

## Runtime

Run the packaged viewer inside any repository that already has generated docs metadata:

```bash
npx @contixly/spec-driven-docs-viewer
```

## Development

Install dependencies and start the dev server:

```bash
cd spec-driven-docs-viewer
npm install
npm run dev
```

To include an external workspace during local development:

```bash
cd spec-driven-docs-viewer
npm run dev -- --workspace /absolute/path/to/target-repo
```

Dev mode exposes the source switcher so you can move between bundled fixtures and the configured external workspace without restarting the server.

## Commands

- `npm run dev` starts the local dev server and source-switching flow
- `npm run build` builds the client assets and server CLI output
- `npm test` runs the full Vitest suite
- `npm run check` runs TypeScript without emitting files
- `npx vitest run` runs the same suite directly for CI-style verification
