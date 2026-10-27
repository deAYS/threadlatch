# ThreadLatch

**Track decisions, corrections, and open questions across coding agents and AI chats—with source-linked, portable memory.**

[Project page](https://deays.github.io/threadlatch/) · [Roadmap](docs/ROADMAP.md) · [Türkçe](README.tr.md)

> **Status: in development.** This repository currently contains the project introduction, implementation plan, and publishing infrastructure. The application and provider compatibility tests are still to be implemented.

Long conversations evolve. Decisions get replaced, examples get mistaken for requirements, and suggestions sometimes look like agreements. ThreadLatch is being built to keep the current state of a project clear—and show the messages behind it.

## Planned workflow

1. Import or paste the relevant conversation.
2. Prepare an analysis request for an AI chat you already use.
3. Paste its structured response back into ThreadLatch.
4. Review source-linked changes before saving them.
5. Export current context as Markdown, or keep a full JSON backup.

The first version is planned around a shared local core with two interfaces: a Node.js CLI for coding-agent workflows and a browser interface for reviewing changes. Coding agents will be able to read the project's memory files and produce update proposals without opening the browser. Browser chat users will use a manual request/result exchange. Your chosen AI service may require an account and may impose its own usage limits or fees.

See the [coding-agent integration design](docs/AGENT-INTEGRATION.md) for the planned Codex / Claude Code workflow. The CLI and application are not implemented yet; no install command is advertised as working.

## Compatibility targets

| Tool | Planned first-release workflow | Verification |
| --- | --- | --- |
| Codex | Local project files, CLI proposals, optional `AGENTS.md` guidance | Not yet tested |
| Claude Code | Same project memory, CLI proposals, optional `CLAUDE.md` guidance | Not yet tested |
| ChatGPT | Manual text / JSON exchange and Markdown handoff | Not yet tested |
| Claude | Same portable workflow | Not yet tested |
| Muse | Same portable workflow; exact product to be confirmed before a native adapter | Not yet tested |
| GLM / Z.AI | Same portable workflow | Not yet tested |
| Other chat tools | Generic text / JSON exchange where supported | Not yet tested |

Native API integrations, hooks, MCP, and automatic conversation capture are later milestones. The initial coding-agent interface is local files plus an explicit CLI, not automatic access to hidden chat history. ChatGPT account access and OpenAI API access are separate integrations. A source-matching quote does not guarantee a correct interpretation.

## Run the project page locally

No install or build is required for the introduction page. From the repository root:

```sh
python -m http.server 4173 --directory site
```

Open `http://localhost:4173`. Application setup instructions will be added when the application exists.

## Development and publishing

- [Implementation plan](docs/superpowers/plans/2026-10-27-threadlatch.md)
- [Implementation-session handoff](docs/SESSION-HANDOFF.md)
- [GitHub Pages deployment guide](docs/GITHUB-PAGES.md)
- [Privacy and data boundaries](docs/PRIVACY.md)

Please use synthetic conversations in public issues. Do not post private chats, API keys, or account credentials.

## License

[MIT](LICENSE). Independent project; the named providers do not endorse or sponsor ThreadLatch.
