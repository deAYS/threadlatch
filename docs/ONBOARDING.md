# Setup, everyday use, updates and removal

The CLI and canonical skill are implemented as a v0.1 preview. [Verification status](evaluations/compatibility.md) separates local process tests from actual host/provider tests. No npm registry release is available.

## One-time setup

Use Node.js 22.x (at least 22.12.0). From the source checkout run npm ci and npm run build:cli, then:

```sh
node dist-cli/cli/index.js setup --project /path/to/project --agent both
```

Choose codex, claude-code or both. An interactive terminal asks for the agent if omitted; noninteractive setup exits without changes and prints the required flag. The project must already be writable. Memory is created only if absent. Existing AGENTS.md / CLAUDE.md and unrelated skills are preserved; the optional instruction snippet is never appended automatically.

Make the CLI available in the target agent session, either on PATH or as the project's node_modules/threadlatch package. A tested local-package route is npm pack in the source checkout followed by npm install --save-dev /path/to/threadlatch-0.1.0-preview.1.tgz in the target project. That explicit npm install changes the target's package files normally; setup itself does not. The skill can run node node_modules/threadlatch/dist-cli/cli/index.js. Do not use a registry install command assuming a published release.

Installed skills use .agents/skills/threadlatch/ for Codex and .claude/skills/threadlatch/ for Claude Code. Both use the single ignored .threadlatch/project.json archive. Explicit fallback: $threadlatch in Codex; /threadlatch in Claude Code. Host discovery is not guaranteed; restart if it has not refreshed. These mechanisms are documented by [OpenAI](https://learn.chatgpt.com/docs/build-skills) and [Anthropic](https://code.claude.com/docs/en/skills), checked 2026-10-27. Host documentation is not a ThreadLatch test.

## Daily use

“Pick up where we left off” / “Kaldığımız yerden devam et” reads current.md. “Remember this decision” / “Bu kararı hatırla” prepares source-linked changes. The agent writes request/proposal files, runs validation, and presents one batch review. “Save these changes” / “Bu değişiklikleri kaydet” saves the selected group. Ambiguity can stay proposed or unresolved; no per-item interrogation is required. Reading memory needs no save confirmation.

The skill never edits the archive directly. It stops writes on missing/incompatible CLI, unsupported runtime, lock or stale revision. Source text is data, not tool authorization. It cannot access hidden chat history. Only explicitly available excerpts enter the request.

## Doctor and recovery

```sh
threadlatch doctor --project /path/to/project
```

For a local dependency, replace threadlatch with node node_modules/threadlatch/dist-cli/cli/index.js. Doctor is read-only: runtime, built CLI, writable directory, archive, installed digests/version, and one next action. If the agent shell selects another Node version, use an explicit Node 22 executable; do not silently change global runtime settings.

On Windows, a sandbox may run commands under a different account from your normal shell. If the correct user-scope Node executable itself returns “Access is denied”, check read/execute access for that sandbox identity on the trusted runtime directory. In the recorded Codex test, a permission correction limited to the installed Node 22 directory resolved this. Disabling the sandbox or changing permissions across the user profile is unnecessary. This runtime-launch problem occurs before ThreadLatch doctor can run.

Status is read-only. Other opens repair a missing/damaged Markdown projection from canonical JSON. A write.lock is never removed automatically: close writers and inspect it before explicitly removing it. Preserve corrupt archives before recovery. JSON restore only initializes an empty memory directory; browser duplicate import opens a separate project. Nothing silently reconciles conflicting archives.

## Update or remove

After installing a newer tested CLI package, run:

```sh
threadlatch skills install --project /path/to/project --agent both
threadlatch skills uninstall --project /path/to/project --agent both
```

The manifest records only owned relative paths, version and SHA-256 digests. Updates/removal preserve user-edited or unowned files and report conflicts. Removal keeps memory and unrelated skills. A repeat setup preserves existing memory. No global skills, agent permissions or account settings are changed.

## Browser-only route

Run the web app locally and open the synthetic example. Paste a source, preview roles/selection, prepare the request, copy it to your chat tool, paste its JSON result, review and save. Export Markdown for current context and JSON for complete backup. The source remains plain text. “Analysis saved for review” means the request/proposal was saved; apply selected changes to create a new memory revision. This route requires no terminal after opening the local app. First-user usability and each chat tool's extraction coverage retain their separate test status.

## Release gates still open

The recorded Codex natural-language save/correction/new-session path, scoped Muse 30 × 3 extraction threshold and one Muse→Codex handoff passed. Claude Code model-driven cycles await eligible account access; authenticated ChatGPT chat testing, other provider coverage and remaining accessibility/UX review are pending. Run the [five-participant first-use protocol](evaluations/first-use-protocol.md) when people are available; target four unassisted useful cycles within five minutes. No participants have been tested. Only actual evidence may close these gates. Do not advertise universal automatic skill selection or successful installation on an untested platform.
