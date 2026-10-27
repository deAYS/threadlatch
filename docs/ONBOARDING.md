# Easy-start and skill design

**Status: first-release requirements. The application, CLI, installer, and skills are not implemented or available to install yet.** This document describes the intended experience; it does not advertise a working installation command.

## Who this should work for

- Coding-agent users should be able to use project memory from Codex or Claude Code without opening a browser or editing JSON.
- Browser-chat users should have a guided copy/paste flow, an example project, and readable errors.
- Advanced users can still operate the CLI directly and inspect the open file format.

The coding-agent workflow requires a local Node.js runtime and an installed, authorized agent. The chat-only workflow should not require a terminal. A skill is not a substitute for the storage and validation code, and cannot bypass the host agent's permissions.

## Guided setup

The future CLI will offer `setup` as a convenience over project initialization and skill installation. These names are planned interfaces, not instructions to run today.

1. Check runtime, selected project, and installed agent directories.
2. Create memory only if it does not already exist. Preserve existing memory.
3. Install the ThreadLatch skill into the selected project's documented Codex or Claude Code skill location. Installing for both agents uses one canonical skill source and one shared project archive.
4. Show what was installed, how to invoke it, and whether a new agent session is required for discovery.
5. Offer a small synthetic first-run exercise and a single next action.

Default installation is project-local. Do not silently install global skills, modify agent permission settings, overwrite an existing same-named skill, or append instructions to `AGENTS.md` / `CLAUDE.md`. Existing instruction files remain authoritative. A `doctor` check explains missing prerequisites without exposing private conversation contents.

## Everyday use

| Intent | Example request | Intended result |
| --- | --- | --- |
| Continue | “Pick up where we left off.” / “Kaldığımız yerden devam et.” | Read reviewed memory and briefly report the current goal, decisions, and open questions. |
| Remember | “Remember this decision.” / “Bu kararı hatırla.” | Prepare a source-linked update and show one concise review of the changes. |
| Review | “Show the latest changes.” / “Son değişiklikleri göster.” | Show what changed, which decisions were replaced, and the supporting sources. |
| Handoff | “Prepare this for another agent.” / “Başka ajana devretmek için hazırla.” | Export the reviewed, bounded context in a readable format. |

The skill handles request files, proposal JSON, and CLI invocations. The user reviews a short change summary and can save the selected batch with a simple request such as “Save these changes.” Reading memory does not require a save confirmation. Ambiguous or conflicting changes remain pending rather than triggering a separate question for every extracted item.

Natural-language skill selection depends on the agent. Provide the host's documented explicit skill invocation as a reliable fallback; do not claim the skill always runs automatically. The skill must explain if the CLI is missing or incompatible and stop the write workflow without inventing a successful save. Automatic private-history capture and lifecycle hooks are outside the first-release skill.

## Packaging

- Canonical maintained skill source: `skills/threadlatch/SKILL.md`, with focused references only where necessary.
- Project-local Codex destination: `.agents/skills/threadlatch/`.
- Project-local Claude Code destination: `.claude/skills/threadlatch/`.
- A small install manifest records the destination, installed version, and file digests; it contains no credentials or source conversations.
- Installation, update, and removal only change files owned by ThreadLatch. If the user edited an installed file, report a conflict and preserve it.
- CLI and skill assets are packaged outside the public web build. Do not publish `.threadlatch/` memory, source messages, or local install manifests as website assets.

Public package names and registry availability must be checked before release. Publish a real tested installation command only after the package, version, included skill assets, and installation path have been verified. A manual installation fallback is documented using the same skill source.

## Usability acceptance criteria

- On Windows, macOS, and Linux, a clean test project can complete setup and the first memory cycle without hand-editing JSON or configuration files.
- Real Codex and Claude Code tests cover discovery, explicit invocation, natural-language selection, continuation, a proposed correction, one batch save, and a new-session handoff. Record any unsupported environment instead of labeling it compatible.
- Setup is repeatable; existing memory, instructions, and unrelated skills remain intact. Removal does not delete project memory.
- Missing Node, missing CLI, incompatible versions, non-writable paths, spaces/Unicode in project paths, and an edited pre-existing skill each produce a clear next action.
- Test the beginner quickstart with five first-time participants who already have a supported agent/runtime. Target at least four completing setup and one useful memory cycle within five minutes without live coaching. Report observations and improve the flow; this is a design target, not a published performance claim.
- English and Turkish requests work in the same documented workflow. No extra API key or ThreadLatch account is requested for the local skill mode.

## Documentation reviewed

- [OpenAI: build skills and local skill locations](https://learn.chatgpt.com/docs/build-skills)
- [Claude Code: skills and project-local installation](https://code.claude.com/docs/en/skills)

Reviewed 2026-10-27. These sources document host mechanisms, not ThreadLatch's unreleased integration behavior.
