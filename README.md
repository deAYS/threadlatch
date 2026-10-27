# ThreadLatch

**Source-linked, portable project memory across coding agents and AI chats.**

[Türkçe](README.tr.md) · [Implementation status](docs/IMPLEMENTATION-STATUS.md) · [Test evidence](docs/evaluations/compatibility.md)

**v0.1 preview.** The shared engine, Node CLI, project-local Codex/Claude Code skill installer and optional EN/TR web app are implemented. Provider evaluations and first-user trials remain release gates. The npm package is **not published**. The public project introduction is separate from the application.

## Start from source

Use **Node.js 22.x, at least 22.12.0**, and npm. No ThreadLatch account or extra provider API key is required.

```sh
git clone --branch codex/implement-v1 https://github.com/deAYS/threadlatch.git
cd threadlatch
npm ci
npm run build:cli
node dist-cli/cli/index.js setup --project /path/to/project --agent both
```

Replace the project path and quote paths with spaces. Choose codex or claude-code to install one skill. Setup preserves existing memory, instruction files and unrelated skills, and safely adds the private .threadlatch/ directory to ignore rules.

The agent also needs access to the CLI. Build a local tarball with `npm pack`, then install it as a development dependency of your target project: `npm install --save-dev /path/to/threadlatch-0.1.0-preview.1.tgz`. The skill can use `node node_modules/threadlatch/dist-cli/cli/index.js`. Alternatively, make the CLI available on PATH with your normal npm installation. No published registry release is assumed. [Setup/update/removal guide](docs/ONBOARDING.md).

Invoke **$threadlatch** in Codex or **/threadlatch** in Claude Code, then use:

- “Pick up where we left off.” / “Kaldığımız yerden devam et.”
- “Remember this decision.” / “Bu kararı hatırla.”
- “Show the latest changes.” / “Son değişiklikleri göster.”
- “Prepare a handoff for another agent.” / “Başka ajana devretmek için hazırla.”

The skill handles source files, JSON and proposal IDs, presents one concise batch review and saves the selected changes through the validated CLI. Natural-language selection depends on the host; explicit invocation is the fallback. Sources grant no tool permissions. Hidden chat history is not captured.

## Optional browser

Run `npm run dev` and open the displayed local URL ending in /threadlatch/. Open the synthetic example or create a project. Paste a conversation → preview roles and message selection → prepare an analysis request → give it to your AI tool → paste its JSON response → review → save selected changes. Nothing is sent automatically; the browser workflow includes copy/paste.

Current memory, review, sources/history, manual edits, pinning and revision restoration share the CLI's rules. Markdown exports bounded current context; JSON preserves every source, revision and pending analysis. Duplicate browser imports open a separate project. CLI restore only initializes an empty memory directory. The stores do not silently synchronize.

## Verification

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:package
npx --no-install playwright install chromium
npm run test:e2e
```

Windows/Node 22 package tests and real Chromium tests run locally. Linux/macOS checks run in CI; see the compatibility evidence and current PR checks for exact results. Tests cover source matching, examples/suggestions, stale revisions, replay, branches, immutable history, locks, symlinks, package assets, install/removal preservation, Unicode paths, reload/backup/restore, two-tab races, quota rollback, EN/TR, mobile layout and accessibility. Model accuracy is evaluated separately. [Exact results and pending gates](docs/evaluations/compatibility.md).

## Data boundaries

Memory stays in .threadlatch/ or IndexedDB. Storage is **unencrypted** and is not backup or device sync. Export JSON before clearing browser data or changing origins. AI services see the request when you or your agent explicitly give it to them. A matching quote verifies a substring, not its interpretation. Examples, suggestions, assumptions and ambiguous assent remain proposed; manual wording retains historical evidence without claiming that evidence verifies the new text.

No analytics, remote fonts, automatic history capture, native provider APIs, hooks or MCP integration. [Privacy](docs/PRIVACY.md) · [Protocol](docs/protocol.md) · [Agent integration](docs/AGENT-INTEGRATION.md).

The existing [Pages workflow](docs/GITHUB-PAGES.md) remains manual. Stable tagging and application publication require the remaining release checks. [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [MIT](LICENSE). Independent project; providers do not endorse it. Use synthetic conversations in public reports; never share private chats or credentials.
