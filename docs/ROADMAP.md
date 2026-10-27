# ThreadLatch roadmap

ThreadLatch is being built to carry source-linked project memory between coding agents and AI chats. This is a public overview of intended features, not a list of released capabilities or promised dates.

## Available now

- Project introduction, English/Turkish README, and MIT license.
- Technical design and implementation plan.
- Manually triggered GitHub Pages publishing.

The application and command-line tool are not released yet. The project page shows a synthetic illustration, not a running application.

## First release

- Track current decisions, corrections, assumptions, and open questions.
- Link proposed changes to source messages and review them before saving.
- Preserve revision history and keep superseded decisions out of current context.
- Use local project files and a Node.js CLI with coding agents, without requiring a browser.
- Offer an optional browser interface to inspect and edit the same memory format.
- Export readable Markdown handoffs and full JSON backups.
- Provide English and Turkish interfaces.

Priority workflows: **Codex, Claude Code, and ChatGPT**, followed by Claude, Muse, and GLM. Each workflow will be labeled with its actual test status. There are no verified native integrations yet.

## Later, based on testing and feedback

- Reduce copying through appropriate API adapters or explicit agent hooks.
- Make conversation import easier with carefully scoped browser adapters.
- Add MCP access where client support and permission boundaries are verified.
- Consider encrypted backups, synchronization, and collaboration if users need them.

The initial design keeps data local and uses the AI tool the user already has. That tool may have its own account requirements, fees, or usage limits.

## Contribute

Follow [the repository](https://github.com/deAYS/threadlatch) or share a use case in an issue using synthetic examples. Developers can read the [technical implementation plan](superpowers/plans/2026-10-27-threadlatch.md) and [coding-agent integration design](AGENT-INTEGRATION.md).
