# ThreadLatch roadmap

ThreadLatch is being built to carry source-linked project memory between coding agents and AI chats. This is a public overview of intended features, not a list of released capabilities or promised dates.

## Available now

- Project introduction, English/Turkish README, and MIT license.
- Technical design and implementation plan.
- Manually triggered GitHub Pages publishing.
- Preview implementation of the shared engine, local CLI, skill installer/doctor and optional EN/TR browser review. See [implementation status](IMPLEMENTATION-STATUS.md) and [test evidence](evaluations/compatibility.md).

The preview has not been published as a stable application or npm release. The project page still shows a synthetic illustration; application publishing remains manual and gated.

## First release

- Track current decisions, corrections, assumptions, and open questions.
- Link proposed changes to source messages and review them before saving.
- Preserve revision history and keep superseded decisions out of current context.
- Use local project files and a Node.js CLI with coding agents, without requiring a browser.
- Include installable Codex and Claude Code skills, guided project setup, and readable setup checks so everyday use can happen through natural-language requests.
- Offer an optional browser interface to inspect and edit the same memory format.
- Export readable Markdown handoffs and full JSON backups.
- Provide English and Turkish interfaces.

Priority workflows: **Codex, Claude Code, and ChatGPT**, followed by Claude, Muse, and GLM. The recorded Codex skill/CLI save, correction/cancellation and fresh continuation path is tested. Muse Spark 1.3 Contributor meets the scoped prompt-2 extraction threshold through OpenChamber's bundled OpenCode. These results do not establish other host integrations; see the [exact compatibility matrix](evaluations/compatibility.md).

Ease of use is part of the first release: users should not have to edit JSON or memorize the CLI workflow. Read the [easy-start and skill design](ONBOARDING.md) for the planned setup and daily interaction. The skills and installer are not released yet.

Remaining preview-to-stable work: authorized Claude Code and ChatGPT chat tests, five first-time coding-agent participants plus a separate chat/browser trial, and remaining accessibility/UX review. The [participant kit](evaluations/first-use-protocol.md) is ready; no human results are claimed. GLM inference attempts did not complete and are stopped. The [latest checkpoint](evaluations/2026-10-29-release-readiness.md) separates these external dependencies from completed implementation/tests. Stable tagging and application publication remain gated.

## Later, based on testing and feedback

- Reduce copying through appropriate API adapters or explicit agent hooks.
- Make conversation import easier with carefully scoped browser adapters.
- Add MCP access where client support and permission boundaries are verified.
- Consider encrypted backups, synchronization, and collaboration if users need them.

The initial design keeps data local and uses the AI tool the user already has. That tool may have its own account requirements, fees, or usage limits.

## Contribute

Follow [the repository](https://github.com/deAYS/threadlatch) or share a use case in an issue using synthetic examples. Developers can read the [technical implementation plan](superpowers/plans/2026-10-27-threadlatch.md) and [coding-agent integration design](AGENT-INTEGRATION.md).
