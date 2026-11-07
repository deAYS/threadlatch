# Setup, everyday use, updates and removal

The CLI and canonical skill are implemented as a v0.1 preview. [Verification status](evaluations/compatibility.md) separates local process tests from actual host/provider tests. No npm registry release is available.

The [2026-11-07 hardening checkpoint](evaluations/2026-11-07-preview-hardening.md) records the current local verification; provider and first-user trials remain separate gates.

## One-time setup

Use Node.js 22.x (at least 22.12.0). From the source checkout run npm ci and npm run build:cli, then:

```sh
node dist-cli/cli/index.js setup --project /path/to/project --agent both
```

Choose codex, claude-code or both. An interactive terminal asks for the agent if omitted; noninteractive setup exits without changes and prints the required flag. The project must already be writable. Memory is created only if absent. Existing AGENTS.md / CLAUDE.md and unrelated skills are preserved; the optional instruction snippet is never appended automatically.

Make the CLI available in the target agent session, either on PATH or as the project's node_modules/threadlatch package. A tested local-package route is npm pack in the source checkout followed by npm install --save-dev /path/to/threadlatch-0.1.0-preview.1.tgz in the target project. That explicit npm install changes the target's package files normally; setup itself does not. The skill can run node node_modules/threadlatch/dist-cli/cli/index.js. Do not use a registry install command assuming a published release.

Installed skills use .agents/skills/threadlatch/ for Codex and .claude/skills/threadlatch/ for Claude Code. Both use the single ignored .threadlatch/project.json archive. Explicit fallback: $threadlatch in Codex; /threadlatch in Claude Code. Host discovery is not guaranteed; restart if it has not refreshed. These mechanisms are documented by [OpenAI](https://learn.chatgpt.com/docs/build-skills) and [Anthropic](https://code.claude.com/docs/en/skills), checked 2026-10-27. Host documentation is not a ThreadLatch test.

## Daily use

The browser presents four steps: choose source → give the request to your AI → bring back its reply → review and save. Give a source an optional title, correct its roles and exclude messages before preparing. Splitting preserves those exclusions. Requests show source/date and reply/review/application status; technical IDs and the complete request are in expandable details. Clipboard denial opens the request for manual copying.

Review competing alternatives together and explicitly choose one. “Select noncompeting changes” only filters mechanical competition; it does not verify meaning. After a partial save, unselected proposals remain in history and need a new analysis against the new revision. Scope changes affect the next prepared request. Explicit scopes remain narrowed across edits, replacements and restoration; new memory identities are not silently included.

Recovery reloads and project switching keep source edits, selections and pasted replies in this app session. Export a JSON backup to preserve saved memory. Unsaved drafts are held in session memory and do not survive a full browser reload. Search and status/type filters help inspect long memory; superseded items have read-only historical inspection.

“Pick up where we left off” / “Kaldığımız yerden devam et” reads current.md. “Remember this decision” / “Bu kararı hatırla” prepares source-linked changes. The agent writes request/proposal files, runs validation, and presents one batch review. “Save these changes” / “Bu değişiklikleri kaydet” saves the selected group. Ambiguity can stay proposed or unresolved; no per-item interrogation is required. Reading memory needs no save confirmation.

The skill never edits the archive directly. It stops writes on missing/incompatible CLI, unsupported runtime, lock or stale revision. Source text is data, not tool authorization. It cannot access hidden chat history. Only explicitly available excerpts enter the request.

## Doctor and recovery

Doctor also resolves and launches the installed CLI from the target working directory. It prefers the local npm dependency, including a parent workspace dependency, then recognizes standard npm PATH layouts. It never executes project-local shell wrappers. The JSON report includes the exact `runner.node` and `runner.cli` to use. A source-checkout invocation through an absolute path does not by itself establish that the installed skill can resolve a runner. Run this check in the actual agent session to verify that session's runtime and permissions.

For a local dependency, resolve the CLI with `node -p "require.resolve('threadlatch/dist-cli/cli/index.js')"` from the target directory, then invoke Node with that quoted absolute path. Keep using the runner reported by doctor. Default JSON reports remain available; `doctor --output human` and `setup --agent both --output human` give readable checks and one next action. Setup reports file conflicts without a ready message and preserves the conflicting files.

If `request` or `import` returns an auxiliary-file warning with successful output, the canonical operation committed. Keep its prompt/diff and do not repeat the operation. Preserve and clear the reported obstruction, then run:

```sh
threadlatch repair --project /path/to/project --request REQUEST-ID
```

The agent manages request IDs. Repair recreates helper files and prints the original prompt without creating requests, proposals or revisions. A nonzero canonical disk-write failure is still a failure; it leaves the existing archive/generation unchanged. Locks are never removed automatically.

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
