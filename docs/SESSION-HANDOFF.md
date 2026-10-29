# Implementation-session handoff

Repository: <https://github.com/deAYS/threadlatch>

## Current implementation checkpoint — 2026-10-29

The source now contains the shared protocol/merge engine, file and IndexedDB adapters, Node CLI, skill installer/setup/doctor and optional EN/TR React review app. Read [implementation status](IMPLEMENTATION-STATUS.md) and [verification evidence](evaluations/compatibility.md) before continuing. The historical readiness notes below describe the starting point, not the current code inventory. The stable release is still incomplete: real provider/host cycles and participant trials remain open; three-platform CI passed. No application deployment or stable tag has been made.

The [latest verification checkpoint](evaluations/2026-10-29-release-readiness.md) records current-package natural Codex save/replacement/cancellation/fresh continuation, a Muse→CLI→Codex handoff, manual keyboard/backup-restore checks and three distinct 90-response Muse evaluations. The original critical branch failure remains recorded; the guard fix and fresh prompt-2 evaluation meet the scoped extraction threshold. Prompt version is `threadlatch-extraction-2`; schema remains v1. GLM inference attempts, including the final single 45-second retry, did not complete and were stopped. Latest local checks passed 83 unit/integration tests, 10 headless Chromium E2E tests, typecheck/lint/build and installed-package lifecycle. Private vulnerability reporting is enabled. Claude Code model-driven tests remain deferred for eligible account access; authenticated ChatGPT chat tests and first-time human trials remain open. Use the [first-use protocol](evaluations/first-use-protocol.md) when participants become available; do not substitute developer or automated runs.

Use Node 22.x, at least 22.12.0. The local host's other Node versions must not be mistaken for tested runtime support. Keep private session/provider logs and personal work artifacts outside public commits; publish only reviewed synthetic evaluation evidence. The CLI tarball includes skill assets; the web build includes neither the CLI nor install manifests.

Read `docs/superpowers/plans/2026-10-27-threadlatch.md` before changing the implementation. This document records repository readiness and integration boundaries for contributors.

## Historical starting scope (before implementation)

- English/Turkish repository introduction and MIT license.
- `site/`: static English project introduction; an illustrative preview, not the application.
- `.github/workflows/pages.yml`: manually publish either the introduction (`landing`) or a future Vite app (`app`).
- Deployment and privacy documentation.

At the starting checkpoint, Task 10 was partially prepared: application code, CI checks, contribution/security guidance, provider evaluation and skill packaging/onboarding were still pending. The current checkpoint above supersedes that initial inventory. Stable application release remains open.

## Coordination rules

Fetch the latest default branch before starting. Do not force-push or overwrite concurrent changes. Work on a separate feature branch or isolated checkout. Preserve the initial landing and publishing workflow unless a change is needed for the actual application; explain such a change in the commit or PR.

The workflow intentionally uses `workflow_dispatch`. It does not publish partial application work on push. Publish the application only after its release checks pass. Follow `docs/GITHUB-PAGES.md` instead of adding another Pages workflow.

There are no application API keys in this repository. The first-release design uses the user's existing AI tools: a file-based Node.js CLI workflow for Codex/Claude Code, and a manual request/result exchange for chat applications. The browser is an optional review interface, not the only way to use the product. Read `docs/AGENT-INTEGRATION.md`. API-provider support and consumer chat-account integration are different capabilities. Codex, Claude Code, ChatGPT, Claude, Muse, and GLM are priorities, not already tested integrations.

The CLI and browser must use the same schemas and merge rules. Put the public web build in `dist/` and the CLI build in `dist-cli/`; Pages uploads only the former. Do not overwrite the target project's existing `AGENTS.md` or `CLAUDE.md` during initialization. No actual private conversation should enter fixtures or public issue reports.

First-release scope also includes project-local Codex and Claude Code skills and guided onboarding. Read `docs/ONBOARDING.md`; Task 8's setup/doctor/install lifecycle and skill package use Task 7's CLI. These now exist as preview implementation. Do not replace the design with a standalone prompt that bypasses source validation or revision controls.
