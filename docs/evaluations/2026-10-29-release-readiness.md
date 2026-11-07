# Preview verification checkpoint — 2026-10-29

Version: `0.1.0-preview.1`, unreleased. Application code: `57b2427d53fe37988ea14f4aa1a27ef4c8ff9098`. Protocol schema: v1. Extraction prompt: `threadlatch-extraction-2`. All evaluation sources and projects were synthetic. Private host sessions, credentials and personal paths are excluded from the public evidence.

## Fresh Muse evaluation

The evaluator selected `meta/muse-spark-1.3-contributor` through OpenChamber's bundled OpenCode 2.0.15. It ran the existing 30-case EN/TR corpus in three repetitions, with fresh sessions, deny-all tool permissions and at most two concurrent requests. Sampling used the existing provider defaults. Each completed response counts on its first attempt, including omissions and rejected replies. The [artifact](2026-10-29-muse-spark-1.3-prompt2.json) contains all 90 requests, unchanged responses and scores.

| Repetition | Valid JSON | Valid schema | Valid evidence among schema-valid replies | Correct final active concept set | Expected operation | Accepted critical violations |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 30/30 | 30/30 | 30/30 | 28/30 | 30/30 | 0 |
| 2 | 30/30 | 30/30 | 30/30 | 29/30 | 30/30 | 0 |
| 3 | 30/30 | 29/30 | 29/29 | 27/30 | 29/30 | 0 |

This model/prompt/application combination meets the plan's extraction threshold: at least 27/30 correct sets in each repetition and zero incorrect active promotions across the ten critical cases repeated three times. Its status is **tested for this guarded extraction protocol**. User review remains part of the workflow. The result does not establish OpenCode skill discovery, Claude Code compatibility or universal semantic accuracy.

The six incorrect sets are retained: five forged-reference cases omitted an independent legitimate local-files decision; `en-assumption`, repetition 3, added an unrecognized `$schema` field and was rejected. No malformed response was repaired or excluded. There were no raw active risky candidates in the 30 critical outputs; the application also accepted none. All schema-valid branch cases emitted the expected conflict rather than replacing the current decision. Concept scoring and manual inspection covered every active output, operation and failure.

The [original prompt-1 baseline](2026-10-29-openchamber.md) remains a failed historical run. After its branch-addition guard fix, a separate [fresh prompt-1 run](2026-10-29-muse-spark-1.3-after-guard.json) produced 28/30, 28/30 and 27/30 correct sets, with zero accepted critical violations. One reply cited historical evidence instead of selected source messages and was rejected; two branch replies still used the wrong operation. Prompt 2 makes the selected-message evidence boundary, branch conflicts and proposed-only assumptions explicit. These are three distinct 90-response runs, 270 completed responses in total; stored-response replay is recorded separately and is not counted as another live evaluation.

## Current-package Codex cycle

The actual local tarball was installed into an isolated project on Windows with Node.js 22.23.4. Codex CLI `0.164.0-alpha.11.1` selected and read the installed ThreadLatch skill from natural-language requests, without an explicit `$threadlatch` prefix. The save session recorded model `gpt-6.1-sol`, reasoning effort `high`; model settings were not varied as an evaluation factor.

1. An English save request recorded SQLite as an active user decision, cloud sync as a proposed assistant suggestion and a billing request as a proposed example, retaining exact evidence.
2. A fresh Turkish correction/cancellation session used the CLI to replace SQLite with PostgreSQL and reject the cloud-sync proposal. SQLite became superseded; the billing example stayed proposed. The user had authorized the concrete batch; the agent did not ask for approval again.
3. A fresh English read-only continuation selected the skill, reported PostgreSQL active, the billing example proposed and no open questions. It did not revive SQLite or cloud sync. The canonical archive SHA256 was unchanged.

The agent handled source/proposal files and identifiers. Version, doctor, request, import and apply completed through the actual CLI, rather than direct archive editing. This closes the tested Codex save/correction/cancellation/new-session path for the recorded environment. The earlier [Muse → CLI → Codex handoff](2026-10-29-openchamber.md#muse--cli--codex-handoff) remains one verified cross-tool direction.

## Browser and package verification

An isolated browser origin completed a manual keyboard workflow: create project, preview role-tagged sources, prepare analysis, import fixture JSON, review and save, correct SQLite to PostgreSQL, export Markdown and download a full JSON backup. Assistant suggestions and examples remained proposed. The downloaded archive restored through the real CLI into empty memory, preserving three revisions and two conversations. This manual walkthrough used fixture model replies, not a provider evaluation or first-time participant trial.

The walkthrough exposed a misleading notice: saving a pending request/proposal said a new memory revision had been saved. The UI now distinguishes **analysis saved for review** from an applied memory revision. Two EN/TR E2E regressions failed before the fix and pass after it.

Closing local checks on Windows/Node 22.23.4 passed typecheck, lint, build, **83 unit/integration tests**, **10 headless production Chromium E2E tests** and the installed-tarball lifecycle. That lifecycle checks setup, repeat setup, doctor, existing instructions and edited-file preservation, package assets and removal with memory retained. CI runs the package checks on Ubuntu, Windows and macOS, with Chromium E2E on Ubuntu; see the [PR checks](https://github.com/deAYS/threadlatch/pull/1/checks) for the current head.

Manual checks covered skip navigation, deletion-dialog initial focus/Escape return, EN/TR and 390px layout. Remaining minor observations: some message aria labels stay English in Turkish source preview, and some page transitions leave focus on the document until Tab/skip navigation. No screen-reader sign-off or other-browser-engine coverage is claimed. Scoped independent reviews of the branch guard and prompt/notice patch found no actionable issue; they did not rerun the provider evaluation.

## Access checks and publication boundary

NVIDIA direct inference still produced no completed GLM extraction. GLM 5.3 returned HTTP 410. NVIDIA's [GLM 5.3 page](https://build.nvidia.com/z-ai/glm-5-3?section=deploy) listed its free endpoint as deprecated when checked; the [Flash page](https://build.nvidia.com/z-ai/glm-5-3-flash) listed a free endpoint. Flash requests received no HTTP response within 120 seconds, including a streaming attempt; an independent curl attempt received zero bytes in 45 seconds. A later single 45-second Flash retry again timed out before an HTTP status. A model-catalog HTTP 200 is not evidence of authenticated inference success. GLM extraction remains **not tested**; further retries were stopped. No credentials entered repository files or agent configuration.

GitHub private vulnerability reporting is enabled, verified on 2026-10-29. Pages remains workflow-driven, serving the introduction from the existing manual publication setup. No stable tag, npm publication, application deployment or merge to main was performed.

## Remaining release work

- **Eligible account access:** Claude Code installation/version/doctor passed, but real skill discovery/invocation and model-driven memory cycles await an authorized eligible account. A Claude chat evaluation is also untested.
- **Authenticated chat access:** the ChatGPT browser session was logged out. No real ChatGPT chat extraction/continuation result is claimed from Codex account authentication.
- **Human participants:** zero of five first-time coding-agent participants have been tested. The [first-use protocol and anonymous observation sheet](first-use-protocol.md) are ready; target four unassisted useful cycles within five minutes. A separate terminal-free chat/browser trial is also pending.
- **Accessibility/UX:** obtain remaining human and assistive-technology review. The manual developer walkthrough and automated axe checks do not replace it.
- **Release decision:** evaluate these results before stable tagging or application publication. Additional tools/directions retain their individual pending status; a failed or inaccessible provider does not become tested by association.

The available implementation and evidence are ready for review as a preview. The stable definition of done remains open at the external-access and human-evaluation gates above.
