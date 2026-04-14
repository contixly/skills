# Spec-Driven Docs Fixtures

These fixtures are small synthetic repositories for testing `spec-driven-docs` against repeatable inputs.

## How to use them

- Do not run the skill directly against the fixture folder if you want to preserve a clean baseline.
- Copy the fixture to a temporary workspace first, then run the skill against the copied repo.
- Use the file paths listed in `evals/evals.json` as the initial context to inspect.

## Fixtures

### `bootstrap-estate-crm`

Use this fixture for bootstrap-from-zero scenarios.

- No `docs/` directory yet.
- The repository represents only part of the overall product.
- The repo contains enough business and technical context to generate PMBoK-lite docs and architecture boundaries.

### `normalize-spec-hub`

Use this fixture for normalization and feature-change scenarios.

- The repository already has scattered notes and draft roadmap files.
- Existing documentation is intentionally inconsistent.
- The repo is part of a broader application landscape, so the architecture doc should state boundaries explicitly.
