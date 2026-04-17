# Docs Contract

Use this contract for the target project's `docs/` directory.

The top-level documentation is intentionally PMBoK-lite: it should capture business case, stakeholders, scope, constraints, roadmap, and control points without turning into heavyweight process paperwork. The feature spec format follows the numbered software-development pattern from the provided PDF reference.

## Folder layout

```text
docs/
  README.md
  project-passport.md
  product-overview.md
  roadmap.md
  architecture.md
  current-state.md
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
    delivery-state.json
```

## File purpose

- `docs/README.md`: entry point, navigation, current planning baseline, and update workflow.
- `docs/project-passport.md`: PMBoK-lite charter for the project: business case, objectives, scope, stakeholders, assumptions, constraints, risks, and governance basics.
- `docs/product-overview.md`: PMBoK-aligned product description: business context, current vs target process, user groups, capabilities, and integration touchpoints.
- `docs/roadmap.md`: release roadmap with business goals, scope boundaries, milestones, dependencies, and exit criteria.
- `docs/architecture.md`: minimal reference architecture of the whole application and the exact responsibility boundary of the user's repository.
- `docs/current-state.md`: branch-facing delivery snapshot that states what is already implemented, what is in progress, what is ready next, and what is still unknown.
- `docs/modules/<module-id>.md`: module responsibility, user value, feature map, dependencies, and repository touchpoints.
- `docs/versions/<version>/README.md`: what this version is trying to achieve, in scope, out of scope, and how success is measured.
- `docs/versions/<version>/features/<feature-id>.md`: business spec for one feature using the numbered feature pattern from `references/feature-spec-pattern.md`.
- `docs/versions/<version>/iterations/<packet-id>.md`: one implementation-ready packet for agents.
- `docs/_meta/feature-index.json`: compact feature registry for other skills and trackers.
- `docs/_meta/task-board.json`: compact packet registry for other skills and trackers, including the implementation prompt used by the viewer and downstream agents.
- `docs/_meta/delivery-state.json`: compact branch-state export derived from `current-state.md` plus feature and packet statuses.

## Top-level documentation rules

- Keep `project-passport.md`, `product-overview.md`, and `roadmap.md` aligned to PMBoK-lite concepts: business case, objectives, stakeholders, scope, assumptions, constraints, milestones, risks, and dependencies.
- Keep `architecture.md` minimal and decision-oriented. It should explain the application landscape, major containers or modules, integration points, and which part is represented by the current repository.
- Keep `current-state.md` explicit about the current branch or working stream. If branch facts are unknown, write `unknown` instead of guessing.
- If the repository covers only part of a broader application, state that explicitly instead of pretending the repo is the whole system.
- When facts are unknown, mark them as `unknown` or list them under `## Open questions`.

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

### Current-state metadata

```md
# Current Delivery State

- Branch: feature/shared-editing
- Updated at: 2026-04-14
- Implemented versions: mvp
- In-progress features: spec-collaboration
- Ready packets: v1-collab-02, v1-collab-03
```

Use comma-separated lists for implemented versions, in-progress features, and ready packets. Use `none` or `unknown` if the value is not confirmed.

## Linking rules

- Link docs to other docs, not to code, unless the code location is essential for a constraint.
- Every feature should link back to:
  - its module doc
  - its version README
  - the architecture doc when architecture or repository ownership matters
  - relevant packets
- Every packet should link to:
  - the feature spec
  - the architecture doc
  - the roadmap
  - any module or passport files needed for context

## JSON metadata minimum

`docs/_meta/task-board.json` should export one compact record per packet with at least:

- `id`
- `title`
- `feature`
- `version`
- `status`
- `owner`
- `path`
- `implementation_prompt`

`implementation_prompt` should be a ready-to-paste starter prompt for an implementation agent. It should point at the packet file, point at the parent feature file when known, and make the packet scope boundary explicit.

## Feature structure

Feature specs should use the numbered sections from `references/feature-spec-pattern.md`:

0. incoming request
1. feature summary
2. business case
3. current and target state
4. functional requirements
5. non-functional requirements
6. technical considerations
7. acceptance criteria
8. risks and dependencies
9. resources and rollout notes
10. references and appendices

Do not drop sections silently. If a section is currently unknown, mark it explicitly.

## Architecture minimum

`docs/architecture.md` should cover at least:

- system context and product boundary
- major application parts or containers
- key integrations and data boundaries
- repository responsibility and non-responsibility
- deployment or runtime assumptions that affect delivery
- architecture risks and open questions

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
