# Implementation-session handoff

Repository: <https://github.com/deAYS/threadlatch>

Read `docs/superpowers/plans/2026-10-27-threadlatch.md` before implementing the application. This document records repository readiness and integration boundaries for contributors.

## Scope already prepared

- English/Turkish repository introduction and MIT license.
- `site/`: static English project introduction; an illustrative preview, not the application.
- `.github/workflows/pages.yml`: manually publish either the introduction (`landing`) or a future Vite app (`app`).
- Deployment and privacy documentation.

Task 10 of the implementation plan is **partially prepared**, not complete. Application code, CI checks, contribution/security guidance, real provider evaluation, skill packaging/onboarding, and application release work remain. Read the current repository state rather than redoing completed setup or assuming every Task 10 deliverable exists.

## Coordination rules

Fetch the latest default branch before starting. Do not force-push or overwrite concurrent changes. Work on a separate feature branch or isolated checkout. Preserve the initial landing and publishing workflow unless a change is needed for the actual application; explain such a change in the commit or PR.

The workflow intentionally uses `workflow_dispatch`. It does not publish partial application work on push. Publish the application only after its release checks pass. Follow `docs/GITHUB-PAGES.md` instead of adding another Pages workflow.

There are no application API keys in this repository. The first-release design uses the user's existing AI tools: a file-based Node.js CLI workflow for Codex/Claude Code, and a manual request/result exchange for chat applications. The browser is an optional review interface, not the only way to use the product. Read `docs/AGENT-INTEGRATION.md`. API-provider support and consumer chat-account integration are different capabilities. Codex, Claude Code, ChatGPT, Claude, Muse, and GLM are priorities, not already tested integrations.

The CLI and browser must use the same schemas and merge rules. Put the public web build in `dist/` and the CLI build in `dist-cli/`; Pages uploads only the former. Do not overwrite the target project's existing `AGENTS.md` or `CLAUDE.md` during initialization. No actual private conversation should enter fixtures or public issue reports.

First-release scope also includes project-local Codex and Claude Code skills and guided onboarding. Read `docs/ONBOARDING.md`; Task 8 adds the setup/doctor/install lifecycle and skill package after Task 7's CLI. The skill, installer, CLI, and application are not yet implemented. Do not replace the design with a standalone prompt that bypasses source validation or revision controls.
