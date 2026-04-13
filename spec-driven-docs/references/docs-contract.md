# Docs Contract

Use this contract for the target project's `docs/` directory.

## Folder layout

```text
docs/
  README.md
  project-passport.md
  product-overview.md
  roadmap.md
  modules/
    <module-id>.md
  versions/
    mvp/
      README.md
      features/
        <feature-id>.md
      iterations/
        <packet-id>.md
    v1/
      README.md
      features/
      iterations/
    v2/
      README.md
      features/
      iterations/
  _meta/
    feature-index.json
    task-board.json
```

## File purpose

- `docs/README.md`: entry point, navigation, and current planning rules.
- `docs/project-passport.md`: project identity, goals, non-goals, stakeholders, constraints, KPIs.
- `docs/product-overview.md`: business flows, personas, value proposition, core experience.
- `docs/roadmap.md`: versions, delivery intent, scope boundaries, dependency notes.
- `docs/modules/<module-id>.md`: module responsibility, user value, feature map, open questions.
- `docs/versions/<version>/README.md`: what this version is trying to achieve and how success is measured.
- `docs/versions/<version>/features/<feature-id>.md`: business spec for one feature.
- `docs/versions/<version>/iterations/<packet-id>.md`: one implementation-ready packet for agents.
- `docs/_meta/*.json`: compact indexes generated from Markdown for other skills and trackers.

## Metadata bullets

Feature and packet files should start with a stable metadata block directly under the title. Keep the spelling exact so the sync script can parse it.

### Feature metadata

```md
# Feature: Smart Intake Form

- ID: intake-smart-form
- Module: onboarding
- Version: mvp
- Status: ready
- Priority: high
- Depends on: customer-profile, lead-capture
```

### Packet metadata

```md
# Packet: Intake Form Happy Path

- ID: mvp-intake-01
- Feature: intake-smart-form
- Version: mvp
- Status: ready
- Owner: unassigned
```

Use comma-separated lists for `Depends on`. Use `none` when there are no dependencies.

## Linking rules

- Link docs to other docs, not to code, unless the code location is essential for a constraint.
- Every feature should link back to:
  - its module doc
  - its version README
  - relevant packets
- Every packet should link to:
  - the feature spec
  - the roadmap
  - any module or passport files needed for context

## Status model

Use only these statuses unless the user asks for a custom workflow:

- `planned`
- `ready`
- `in-progress`
- `done`
- `blocked`
- `superseded`
- `unknown`

## Naming rules

- Use kebab-case IDs.
- Keep version folder names short: `mvp`, `v1`, `v2`.
- Use packet IDs that sort naturally, for example `mvp-billing-01`, `mvp-billing-02`.
