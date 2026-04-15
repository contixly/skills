import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturesRoot = path.resolve(here, "../tests/fixtures");
const versions = ["mvp", "v1", "v2"];
const denseModules = [
  { id: "platform", name: "Platform" },
  { id: "intake", name: "Intake" },
  { id: "review", name: "Review" },
  { id: "delivery", name: "Delivery" },
  { id: "billing", name: "Billing" },
  { id: "analytics", name: "Analytics" },
  { id: "support", name: "Support" }
];
const statuses = ["planned", "ready", "in-progress", "done", "blocked", "superseded", "unknown"];

function fixtureRoot(name) {
  return path.join(fixturesRoot, name);
}

async function writeText(filePath, content) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf-8");
}

async function writeJson(filePath, value) {
  await writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function titleFromKebab(value) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function ensureDependsOnValue(dependsOn) {
  return dependsOn.length > 0 ? dependsOn.join(", ") : "none";
}

async function resetFixture(name) {
  await rm(fixtureRoot(name), { recursive: true, force: true });
}

async function writeWorkspaceScaffold(args) {
  const docsRoot = path.join(args.root, "docs");
  const implementedVersions =
    args.delivery.implemented_versions.length > 0 ? args.delivery.implemented_versions.join(", ") : "none";
  const inProgressFeatures =
    args.delivery.in_progress_features.length > 0 ? args.delivery.in_progress_features.join(", ") : "none";
  const readyPackets =
    args.delivery.ready_packets.length > 0 ? args.delivery.ready_packets.join(", ") : "none";

  await writeText(
    path.join(docsRoot, "README.md"),
    [
      `# ${args.title} Docs`,
      "",
      "## What this folder is for",
      "",
      `${args.title} is a generated development fixture for the spec-driven docs viewer.`,
      "",
      "## How to navigate it",
      "",
      "- Start with the roadmap and current-state documents.",
      "- Use module, feature, and packet docs to inspect slice-level detail.",
      "",
      "## Current planning baseline",
      "",
      `${args.summary}`,
      "",
      "## Update workflow",
      "",
      "Generated fixture content is maintained by scripts/generate-dev-fixtures.mjs."
    ].join("\n")
  );

  await writeText(
    path.join(docsRoot, "project-passport.md"),
    [
      "# Project Passport",
      "",
      "## One-line summary",
      "",
      `${args.summary}`,
      "",
      "## Business case",
      "",
      "Provide realistic docs workspaces for viewer development and regression testing.",
      "",
      "## Objectives and success metrics",
      "",
      "- Cover the docs contract with representative metadata and markdown.",
      "- Exercise ok, warning, and minimal workspace states.",
      "",
      "## Stakeholders and decision model",
      "",
      "The fixture team owns the generated content for viewer development.",
      "",
      "## Scope",
      "",
      "Fixture markdown, packet prompts, and compact docs indexes.",
      "",
      "## Out of scope",
      "",
      "Production application logic.",
      "",
      "## Assumptions",
      "",
      "Fixtures may be regenerated at any time from the script.",
      "",
      "## Constraints",
      "",
      "Keep content deterministic and aligned to the docs contract.",
      "",
      "## Milestone snapshot",
      "",
      `Current branch snapshot: ${args.delivery.branch}.`,
      "",
      "## Risks and dependencies",
      "",
      "Consumers must treat this as fixture data, not product truth.",
      "",
      "## Open questions",
      "",
      "None."
    ].join("\n")
  );

  await writeText(
    path.join(docsRoot, "product-overview.md"),
    [
      "# Product Overview",
      "",
      "## Product promise",
      "",
      "This workspace provides realistic planning data for the viewer UI and server.",
      "",
      "## User groups and stakeholders",
      "",
      "- Viewer maintainers",
      "- QA and review agents",
      "",
      "## Current process and pain points",
      "",
      "Without fixtures, dev mode exercises only one narrow docs snapshot.",
      "",
      "## Target process and value",
      "",
      "Developers can switch between rich, stale, and minimal workspaces without restarting the app.",
      "",
      "## Core user flows",
      "",
      "- Inspect delivery state",
      "- Browse features and packets",
      "- Copy packet follow-up prompts",
      "",
      "## Capability map",
      "",
      "The fixture covers roadmap, module, feature, and packet surfaces.",
      "",
      "## Integration touchpoints",
      "",
      "The viewer server reads docs/_meta JSON and markdown packet files from disk.",
      "",
      "## Risks and assumptions",
      "",
      "The fixture content is synthetic and should stay deterministic.",
      "",
      "## Open questions",
      "",
      "None."
    ].join("\n")
  );

  await writeText(
    path.join(docsRoot, "roadmap.md"),
    [
      "# Roadmap",
      "",
      "## Planning assumptions",
      "",
      "Fixture workspaces mirror the docs contract used in real repositories.",
      "",
      "## Delivery model and priorities",
      "",
      "Prioritize contract coverage and source-switching realism over narrative depth.",
      "",
      ...versions.flatMap((version) => [
        `## ${version.toUpperCase()}`,
        "",
        "### Business goal",
        "",
        `${titleFromKebab(args.name)} coverage for ${version}.`,
        "",
        "### Scope",
        "",
        `Version README, feature docs, packet docs, and synced JSON indexes for ${version}.`,
        "",
        "### Milestones",
        "",
        `- Generate ${version} workspace content.`,
        "",
        "### Dependencies",
        "",
        "- scripts/generate-dev-fixtures.mjs",
        "",
        "### Exit criteria",
        "",
        `- ${version} docs can be loaded by the viewer.`,
        ""
      ]),
      "## Cross-version dependencies",
      "",
      "Shared packet rendering and metadata parsing rules apply to every version.",
      "",
      "## Resource and risk notes",
      "",
      "Generated fixture data must stay small enough to commit but large enough to stress the viewer.",
      "",
      "## Open questions",
      "",
      "None."
    ].join("\n")
  );

  await writeText(
    path.join(docsRoot, "architecture.md"),
    [
      "# Architecture Overview",
      "",
      "## System context",
      "",
      "The viewer server loads docs workspaces from disk and exposes normalized JSON snapshots to the React app.",
      "",
      "## Reference component map",
      "",
      "- Top-level planning docs",
      "- Module docs",
      "- Version, feature, and packet docs",
      "- Compact JSON indexes under docs/_meta",
      "",
      "## Key integrations",
      "",
      "The dev server reads fixture content from the local filesystem.",
      "",
      "## Data and ownership boundaries",
      "",
      "The fixture script owns generated markdown and JSON. The viewer treats it as read-only input.",
      "",
      "## Repository responsibility",
      "",
      "Provide deterministic fixture workspaces for local development and tests.",
      "",
      "## Repository non-responsibility",
      "",
      "Representing a real customer backlog.",
      "",
      "## Runtime and deployment assumptions",
      "",
      "The dev server runs locally and can switch sources without restart.",
      "",
      "## Architecture risks and open questions",
      "",
      "None."
    ].join("\n")
  );

  await writeText(
    path.join(docsRoot, "current-state.md"),
    [
      "# Current Delivery State",
      "",
      `- Branch: ${args.delivery.branch}`,
      `- Updated at: ${args.delivery.updated_at}`,
      `- Implemented versions: ${implementedVersions}`,
      `- In-progress features: ${inProgressFeatures}`,
      `- Ready packets: ${readyPackets}`,
      "",
      "## Summary",
      "",
      `${args.summary}`
    ].join("\n")
  );

  await mkdir(path.join(docsRoot, "modules"), { recursive: true });

  for (const moduleRecord of args.modules) {
    const moduleFeatures = args.features.filter((feature) => feature.module === moduleRecord.id);
    await writeText(
      path.join(docsRoot, "modules", `${moduleRecord.id}.md`),
      [
        `# Module: ${moduleRecord.name}`,
        "",
        `- ID: ${moduleRecord.id}`,
        "- Owner: fixture-team",
        "",
        "## Responsibility",
        "",
        `Own ${moduleRecord.name.toLowerCase()} planning slices in the ${args.title} fixture.`,
        "",
        "## User value",
        "",
        "Provide realistic module groupings for feature navigation.",
        "",
        "## Feature map by version",
        "",
        ...versions.map((version) => {
          const featureIds = moduleFeatures
            .filter((feature) => feature.version === version)
            .map((feature) => feature.id)
            .join(", ");
          return `- ${version}: ${featureIds || "none"}`;
        }),
        "",
        "## Dependencies",
        "",
        "Generated fixture content only.",
        "",
        "## Repository touchpoints",
        "",
        "- docs/modules",
        "- docs/versions/*/features",
        "",
        "## Open questions",
        "",
        "None."
      ].join("\n")
    );
  }

  for (const version of versions) {
    await writeText(
      path.join(docsRoot, "versions", version, "README.md"),
      [
        `# Version: ${version}`,
        "",
        "## Business goal",
        "",
        `${args.title} coverage for ${version}.`,
        "",
        "## Scope",
        "",
        `Feature and packet docs assigned to ${version}.`,
        "",
        "## Out of scope",
        "",
        "Live product commitments.",
        "",
        "## Milestones",
        "",
        "- Generate and load the fixture in dev mode.",
        "",
        "## Dependencies",
        "",
        "- docs/_meta indexes",
        "",
        "## Exit criteria",
        "",
        "- Viewer can render this version without errors.",
        "",
        "## Ready features",
        "",
        args.features
          .filter((feature) => feature.version === version && feature.status === "ready")
          .map((feature) => `- ${feature.id}`)
          .join("\n") || "- none",
        "",
        "## Open questions",
        "",
        "None."
      ].join("\n")
    );
    await mkdir(path.join(docsRoot, "versions", version, "features"), { recursive: true });
    await mkdir(path.join(docsRoot, "versions", version, "iterations"), { recursive: true });
  }
}

function renderFeatureMarkdown(feature) {
  return [
    `# Feature: ${feature.title}`,
    "",
    `- ID: ${feature.id}`,
    `- Module: ${feature.module}`,
    `- Version: ${feature.version}`,
    `- Status: ${feature.status}`,
    `- Priority: ${feature.priority}`,
    `- Depends on: ${ensureDependsOnValue(feature.depends_on)}`,
    "",
    "## 0. Incoming request",
    "",
    `- Source: ${feature.requestSource}`,
    `- Request summary: ${feature.requestSummary}`,
    "- Initiator: fixture-team",
    "- Stakeholders: viewer maintainers, QA",
    "- Target date: 2026-04-15",
    "- Decision owner: fixture-team",
    "",
    "## 1. Feature summary",
    "",
    feature.summary,
    "",
    "## 2. Business case",
    "",
    "### 2.1 Business goals",
    "",
    feature.businessGoal,
    "",
    "### 2.2 Problem statement",
    "",
    feature.problem,
    "",
    "### 2.3 Expected result",
    "",
    feature.expectedResult,
    "",
    "## 3. Current and target state",
    "",
    "### 3.1 As is",
    "",
    feature.currentState,
    "",
    "### 3.2 To be",
    "",
    feature.targetState,
    "",
    "## 4. Functional requirements",
    "",
    "### 4.1 User stories",
    "",
    feature.userStories,
    "",
    "### 4.2 Functional scenarios",
    "",
    feature.scenarios,
    "",
    "### 4.3 Data and content requirements",
    "",
    feature.dataRequirements,
    "",
    "### 4.4 UX and presentation notes",
    "",
    feature.uxNotes,
    "",
    "## 5. Non-functional requirements",
    "",
    feature.nonFunctional,
    "",
    "## 6. Technical considerations",
    "",
    feature.technical,
    "",
    "## 7. Acceptance criteria",
    "",
    feature.acceptance,
    "",
    "## 8. Risks and dependencies",
    "",
    feature.risks,
    "",
    "## 9. Resources and rollout notes",
    "",
    feature.rollout,
    "",
    "## 10. References and appendices",
    "",
    `- [Module doc](../../../modules/${feature.module}.md)`,
    `- [Version README](../README.md)`,
    "- [Architecture](../../../architecture.md)"
  ].join("\n");
}

function renderPacketMarkdown(packet) {
  return [
    `# Packet: ${packet.title}`,
    "",
    `- ID: ${packet.id}`,
    `- Feature: ${packet.feature}`,
    `- Version: ${packet.version}`,
    `- Status: ${packet.status}`,
    `- Owner: ${packet.owner}`,
    "",
    "## Objective",
    "",
    packet.objective,
    "",
    "## Scope included",
    "",
    packet.scopeIncluded,
    "",
    "## Scope excluded",
    "",
    packet.scopeExcluded,
    "",
    "## Done criteria",
    "",
    packet.doneCriteria,
    "",
    "## Suggested follow-up prompt",
    "",
    `Suggested follow-up prompt: \`${packet.followUpPrompt}\``,
    "",
    "## References",
    "",
    `- [Feature spec](../features/${packet.feature}.md)`,
    "- [Architecture](../../../architecture.md)",
    "- [Roadmap](../../../roadmap.md)"
  ].join("\n");
}

function denseFeatureRecords() {
  return Array.from({ length: 24 }, (_, index) => {
    const version = versions[index % versions.length];
    const moduleRecord = denseModules[index % denseModules.length];
    const featureId = `feature-${String(index + 1).padStart(2, "0")}`;

    return {
      id: featureId,
      title: `${moduleRecord.name} Capability ${index + 1}`,
      module: moduleRecord.id,
      version,
      status: statuses[index % statuses.length],
      priority: index % 3 === 0 ? "high" : index % 3 === 1 ? "medium" : "low",
      depends_on: index > 1 && index % 4 === 0 ? ["feature-01", "feature-02"] : [],
      path: `versions/${version}/features/${featureId}.md`,
      requestSource: "planning review",
      requestSummary: `Expand ${moduleRecord.name.toLowerCase()} coverage for workload ${index + 1}.`,
      summary: `Introduce ${moduleRecord.name.toLowerCase()} delivery slice ${index + 1} for the dense portfolio fixture.`,
      businessGoal: `Give the viewer realistic ${moduleRecord.name.toLowerCase()} entries with varied status and dependency metadata.`,
      problem: "Single-slice fixtures do not stress list rendering or packet grouping well enough.",
      expectedResult: "The dev fixture exposes enough variety to verify source switching and board behavior.",
      currentState: "The fixture needs synthetic docs that still respect the contract.",
      targetState: `Feature ${featureId} is indexed and linked across docs, packets, and delivery state.`,
      userStories: `- As a maintainer, I can inspect ${moduleRecord.name.toLowerCase()} feature ${index + 1} in the viewer.`,
      scenarios: `- Viewer groups packets for ${featureId} under ${version}.`,
      dataRequirements: "Feature metadata and packet counts stay aligned with docs/_meta.",
      uxNotes: "Titles should remain readable in dense lists.",
      nonFunctional: "Fixture loading must stay deterministic.",
      technical: "Packet markdown must exist for every indexed packet.",
      acceptance: `- ${featureId} appears in feature-index.json and matching markdown exists.`,
      risks: "Synthetic narratives may drift unless regenerated from script changes.",
      rollout: "Regenerate fixtures and re-run tests after any schema change."
    };
  });
}

function densePacketRecords(features) {
  return features.flatMap((feature, featureIndex) =>
    Array.from({ length: featureIndex % 4 === 0 ? 6 : 3 }, (_, packetIndex) => {
      const packetId = `${feature.version}-${feature.id}-${String(packetIndex + 1).padStart(2, "0")}`;
      const statusIndex = (featureIndex + packetIndex) % statuses.length;
      const packetStatus =
        statuses[statusIndex] === "unknown"
          ? "ready"
          : statuses[statusIndex] === "superseded"
            ? "blocked"
            : statuses[statusIndex];

      return {
        id: packetId,
        title: `Packet ${packetIndex + 1} for ${feature.title}`,
        feature: feature.id,
        version: feature.version,
        status: packetStatus,
        owner: packetIndex % 2 === 0 ? "agent-a" : "unassigned",
        path: `versions/${feature.version}/iterations/${packetId}.md`,
        objective: `Implement packet ${packetId} for the ${feature.title} slice.`,
        scopeIncluded: `- Deliver the core ${feature.module} workflow for ${packetId}.`,
        scopeExcluded: "- No cross-module redesign.",
        doneCriteria: `- ${packetId} status can move forward after implementation.`,
        followUpPrompt: `Use $spec-driven-docs to sync docs after implementing ${packetId}.`
      };
    })
  );
}

async function buildDensePortfolio() {
  const name = "dense-portfolio";
  const root = fixtureRoot(name);
  const features = denseFeatureRecords();
  const tasks = densePacketRecords(features);
  const delivery = {
    branch: "feature/dense-portfolio",
    updated_at: "2026-04-15",
    implemented_versions: ["mvp", "v1"],
    in_progress_features: features
      .filter((feature) => feature.status === "in-progress")
      .slice(0, 8)
      .map((feature) => feature.id),
    ready_packets: tasks
      .filter((task) => task.status === "ready")
      .slice(0, 12)
      .map((task) => task.id),
    path: "current-state.md",
    generated_from: "docs"
  };

  await writeWorkspaceScaffold({
    name,
    root,
    title: "Dense Portfolio",
    summary: "High-volume fixture workspace covering many modules, features, and packets.",
    modules: denseModules,
    features,
    delivery
  });

  await writeJson(path.join(root, "docs", "_meta", "feature-index.json"), {
    features: features.map(({ path: featurePath, ...feature }) => ({
      id: feature.id,
      title: feature.title,
      module: feature.module,
      version: feature.version,
      status: feature.status,
      priority: feature.priority,
      depends_on: feature.depends_on,
      path: featurePath
    })),
    generated_from: "docs"
  });
  await writeJson(path.join(root, "docs", "_meta", "task-board.json"), {
    tasks: tasks.map(({ path: taskPath, ...task }) => ({
      id: task.id,
      title: task.title,
      feature: task.feature,
      version: task.version,
      status: task.status,
      owner: task.owner,
      path: taskPath
    })),
    generated_from: "docs"
  });
  await writeJson(path.join(root, "docs", "_meta", "delivery-state.json"), delivery);

  for (const feature of features) {
    await writeText(path.join(root, "docs", feature.path), renderFeatureMarkdown(feature));
  }

  for (const task of tasks) {
    await writeText(path.join(root, "docs", task.path), renderPacketMarkdown(task));
  }
}

async function buildStaleAndBroken() {
  const name = "stale-and-broken";
  const root = fixtureRoot(name);
  const modules = denseModules.filter((moduleRecord) =>
    ["review", "support"].includes(moduleRecord.id)
  );
  const features = [
    {
      id: "review-handoff",
      title: "Review Handoff",
      module: "review",
      version: "v1",
      status: "ready",
      priority: "high",
      depends_on: [],
      path: "versions/v1/features/review-handoff.md",
      requestSource: "stale fixture planning",
      requestSummary: "Represent a source with stale packet metadata.",
      summary: "Fixture feature used to trigger stale packet warnings.",
      businessGoal: "Exercise warning state rendering in dev mode.",
      problem: "Without stale metadata, the warning path is difficult to test end to end.",
      expectedResult: "The workspace loads with a warning and still exposes usable docs.",
      currentState: "Packet indexes are intentionally inconsistent.",
      targetState: "Viewer can surface the stale warning while still loading content.",
      userStories: "- As a maintainer, I can inspect stale source behavior.",
      scenarios: "- A packet exists on disk but not in docs/_meta.",
      dataRequirements: "One indexed packet is missing its markdown counterpart.",
      uxNotes: "Warning state should remain readable.",
      nonFunctional: "The source must still load successfully.",
      technical: "Mismatch between task-board.json and packet markdown is deliberate.",
      acceptance: "- health.level becomes warning.",
      risks: "Fixture drift could remove the intended mismatch.",
      rollout: "Regenerate after any contract change."
    },
    {
      id: "empty-checklist",
      title: "Empty Checklist Recovery",
      module: "support",
      version: "mvp",
      status: "blocked",
      priority: "medium",
      depends_on: ["review-handoff"],
      path: "versions/mvp/features/empty-checklist.md",
      requestSource: "stale fixture planning",
      requestSummary: "Represent a blocked feature beside stale packets.",
      summary: "Second feature used to keep feature navigation non-empty.",
      businessGoal: "Provide a mixed-status source for dev mode.",
      problem: "A one-feature fixture is too narrow for browsing.",
      expectedResult: "The source includes multiple feature states.",
      currentState: "The docs contract is valid but packet coverage is inconsistent.",
      targetState: "Viewer shows blocked and ready features together.",
      userStories: "- As a maintainer, I can compare warning states across features.",
      scenarios: "- A blocked feature appears beside a ready one.",
      dataRequirements: "Compact JSON stays parseable.",
      uxNotes: "Do not hide blocked content.",
      nonFunctional: "The source stays small and deterministic.",
      technical: "The mismatch lives only in iterations, not feature docs.",
      acceptance: "- Feature metadata renders despite warning state.",
      risks: "If packet coverage becomes complete, the warning disappears.",
      rollout: "Regenerate fixture content from script."
    }
  ];
  const indexedTasks = [
    {
      id: "v1-review-handoff-01",
      title: "Review Handoff Baseline",
      feature: "review-handoff",
      version: "v1",
      status: "ready",
      owner: "agent-b",
      path: "versions/v1/iterations/v1-review-handoff-01.md",
      objective: "Validate the good packet path for the stale source.",
      scopeIncluded: "- Keep one valid packet markdown file.",
      scopeExcluded: "- No repair of stale metadata.",
      doneCriteria: "- Viewer can still open a prompt from the valid packet.",
      followUpPrompt: "Use $spec-driven-docs to sync docs after implementing v1-review-handoff-01."
    },
    {
      id: "mvp-empty-checklist-01",
      title: "Empty Checklist Repair",
      feature: "empty-checklist",
      version: "mvp",
      status: "planned",
      owner: "unassigned",
      path: "versions/mvp/iterations/mvp-empty-checklist-01.md",
      objective: "Intentionally missing markdown file to create stale metadata.",
      scopeIncluded: "- None.",
      scopeExcluded: "- Rendering markdown that does not exist.",
      doneCriteria: "- The stale warning remains active.",
      followUpPrompt: "Use $spec-driven-docs to sync docs after implementing mvp-empty-checklist-01."
    }
  ];
  const delivery = {
    branch: "feature/stale-and-broken",
    updated_at: "2026-04-15",
    implemented_versions: [],
    in_progress_features: [],
    ready_packets: ["v1-review-handoff-01"],
    path: "current-state.md",
    generated_from: "docs"
  };

  await writeWorkspaceScaffold({
    name,
    root,
    title: "Stale and Broken",
    summary: "Fixture workspace with intentional packet/index mismatches for warning states.",
    modules,
    features,
    delivery
  });

  await writeJson(path.join(root, "docs", "_meta", "feature-index.json"), {
    features: features.map(({ path: featurePath, ...feature }) => ({
      id: feature.id,
      title: feature.title,
      module: feature.module,
      version: feature.version,
      status: feature.status,
      priority: feature.priority,
      depends_on: feature.depends_on,
      path: featurePath
    })),
    generated_from: "docs"
  });
  await writeJson(path.join(root, "docs", "_meta", "task-board.json"), {
    tasks: indexedTasks.map(({ path: taskPath, ...task }) => ({
      id: task.id,
      title: task.title,
      feature: task.feature,
      version: task.version,
      status: task.status,
      owner: task.owner,
      path: taskPath
    })),
    generated_from: "docs"
  });
  await writeJson(path.join(root, "docs", "_meta", "delivery-state.json"), delivery);

  for (const feature of features) {
    await writeText(path.join(root, "docs", feature.path), renderFeatureMarkdown(feature));
  }

  await writeText(path.join(root, "docs", indexedTasks[0].path), renderPacketMarkdown(indexedTasks[0]));
  await writeText(
    path.join(root, "docs", "versions", "v1", "iterations", "orphan-packet.md"),
    [
      "# Packet: Orphan Packet",
      "",
      "- ID: orphan-packet",
      "- Feature: review-handoff",
      "- Version: v1",
      "- Status: ready",
      "- Owner: unassigned",
      "",
      "This packet exists only on disk to keep the warning path active."
    ].join("\n")
  );
}

async function buildEmptyOrMinimal() {
  const name = "empty-or-minimal";
  const root = fixtureRoot(name);
  const modules = denseModules.filter((moduleRecord) => moduleRecord.id === "support");
  const features = [
    {
      id: "minimal-feature",
      title: "Minimal Fixture Feature",
      module: "support",
      version: "mvp",
      status: "planned",
      priority: "low",
      depends_on: [],
      path: "versions/mvp/features/minimal-feature.md",
      requestSource: "minimal fixture planning",
      requestSummary: "Keep one feature and packet in the minimal workspace.",
      summary: "A minimal feature that preserves packet markdown coverage in the smallest fixture.",
      businessGoal: "Exercise the normal docs contract while keeping the source nearly empty.",
      problem: "A fully empty fixture leaves no packet markdown coverage for the minimal source.",
      expectedResult: "The minimal source still loads a feature, a packet, and a packet follow-up prompt.",
      currentState: "The fixture aims to stay small and predictable.",
      targetState: "One feature and one packet represent the smallest complete workspace slice.",
      userStories: "- As a maintainer, I can verify prompt loading against the smallest valid source.",
      scenarios: "- The source switcher moves to a workspace with exactly one feature and one packet.",
      dataRequirements: "The packet entry and markdown path stay aligned.",
      uxNotes: "The content should remain small enough to scan immediately.",
      nonFunctional: "Keep the source deterministic and intentionally minimal.",
      technical: "Use one packet markdown file under docs/versions/mvp/iterations.",
      acceptance: "- The packet prompt endpoint resolves for the minimal source.",
      risks: "If the packet is removed, the minimal fixture drops out of packet coverage again.",
      rollout: "Regenerate fixtures after any contract change."
    }
  ];
  const tasks = [
    {
      id: "minimal-packet-01",
      title: "Minimal Packet Coverage",
      feature: "minimal-feature",
      version: "mvp",
      status: "ready",
      owner: "unassigned",
      path: "versions/mvp/iterations/minimal-packet-01.md",
      objective: "Provide a single packet markdown file for the minimal fixture.",
      scopeIncluded: "- Keep one prompt-bearing packet in the smallest source.",
      scopeExcluded: "- Any broader feature set.",
      doneCriteria: "- /api/prompt/minimal-packet-01 returns a packet prompt.",
      followUpPrompt: "Use $spec-driven-docs to sync docs after implementing minimal-packet-01."
    }
  ];
  const delivery = {
    branch: "feature/empty-or-minimal",
    updated_at: "2026-04-15",
    implemented_versions: [],
    in_progress_features: [],
    ready_packets: ["minimal-packet-01"],
    path: "current-state.md",
    generated_from: "docs"
  };

  await writeWorkspaceScaffold({
    name,
    root,
    title: "Empty or Minimal",
    summary: "Minimal fixture workspace with one feature and one packet under the normal docs contract.",
    modules,
    features,
    delivery
  });

  await writeJson(path.join(root, "docs", "_meta", "feature-index.json"), {
    features: features.map(({ path: featurePath, ...feature }) => ({
      id: feature.id,
      title: feature.title,
      module: feature.module,
      version: feature.version,
      status: feature.status,
      priority: feature.priority,
      depends_on: feature.depends_on,
      path: featurePath
    })),
    generated_from: "docs"
  });
  await writeJson(path.join(root, "docs", "_meta", "task-board.json"), {
    tasks: tasks.map(({ path: taskPath, ...task }) => ({
      id: task.id,
      title: task.title,
      feature: task.feature,
      version: task.version,
      status: task.status,
      owner: task.owner,
      path: taskPath
    })),
    generated_from: "docs"
  });
  await writeJson(path.join(root, "docs", "_meta", "delivery-state.json"), delivery);

  for (const feature of features) {
    await writeText(path.join(root, "docs", feature.path), renderFeatureMarkdown(feature));
  }

  for (const task of tasks) {
    await writeText(path.join(root, "docs", task.path), renderPacketMarkdown(task));
  }
}

await resetFixture("dense-portfolio");
await resetFixture("stale-and-broken");
await resetFixture("empty-or-minimal");
await buildDensePortfolio();
await buildStaleAndBroken();
await buildEmptyOrMinimal();
