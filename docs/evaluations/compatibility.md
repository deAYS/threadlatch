# Compatibility and evaluation evidence

Updated: 2026-10-29. Version: 0.1.0-preview.1. Prompt: threadlatch-extraction-2, protocol schema v1. Sources and test projects are synthetic. No private session logs are committed. Historical checks below retain their original dates/commits; [the latest verification checkpoint](2026-10-29-release-readiness.md) records fresh model, current-package Codex and manual browser results.

The 30-case fixture set includes 15 EN/15 TR cases, exactly 10 flagged critical cases and six malicious inputs. Each case records initial active concepts, the expected final active concept set, forbidden promotions, source branch and correction/cancellation operation. These are semantic expectations for real-provider review, not exact paraphrase matching. Three distinct live Muse runs are recorded separately. The automated candidate-status tests exercise deterministic role/intent guards; they do not claim to run a model or verify the full expected extraction set.

## Automated local checks

Windows, Node.js 22.23.4: unit/integration tests include strict schemas, exact quotes, malformed replies, examples/suggestions, ambiguity, revisions, branches, replay, immutable sources/history, Unicode paths, symlinks, exclusive locks, full archive remapping and spawned Node process concurrency. IndexedDB unit tests use fake-indexeddb; they are supplemented by real Chromium tests.

Production Vite build served at /threadlatch/: English source → request → fixture JSON → review → save → reload → correction → handoff → JSON backup → delete → restore. Additional checks cover Turkish save/handoff, two-tab races, injected IndexedDB quota rollback, corrupt backup preservation, history restore, deletion-dialog keyboard focus, 390px layout, automated axe contrast/accessibility, plain-text HTML and no unexpected network requests during memory operations. These use fixture responses, not real model extraction.

The actual npm tarball was installed into an isolated local prefix on Windows/Node 22. Setup for both agents, repeat setup, doctor, instruction preservation, package asset allowlist and uninstall-with-memory-preserved passed. Package name lookup returned 404 on 2026-10-27; no name reservation, registry publication or trademark right is claimed.

Latest closing local checks at application commit `57b2427` passed typecheck, lint, build, **83 unit/integration tests**, **10 headless production Chromium E2E tests** and installed-package lifecycle. The two additional E2E tests distinguish a pending-analysis save from an applied memory revision in EN/TR. A manual keyboard walkthrough and browser-backup → CLI-restore cycle also passed; assistive-technology sign-off remains pending. [Details](2026-10-29-release-readiness.md#browser-and-package-verification).

Remote [CI run 40465377568](https://github.com/deAYS/threadlatch/actions/runs/40465377568) passed at commit 05c1963644806cee44517a9959c75ebb29000a21: clean install, typecheck, lint, 79 unit/integration tests, build and installed-package lifecycle on Ubuntu, Windows and macOS. All 8 Chromium E2E tests also passed on Ubuntu; local Windows Chromium passed separately. Other browser engines and manual accessibility sign-off remain pending.

## Real agent/provider checks

| Tool | Actual observation | Status |
| --- | --- | --- |
| Codex CLI 0.164.0-alpha.11.1, authenticated ChatGPT account | Installed skill selected/read from natural English save, fresh Turkish replacement/cancellation and fresh English continuation. PostgreSQL active, SQLite superseded, cloud proposal rejected, billing example proposed; reader left canonical hash unchanged. Save session model `gpt-6.1-sol`, effort `high`. | **Tested host path** in this environment; earlier explicit invocation/retry also passed. This is not a 30-case Codex-model evaluation or a ChatGPT chat test. [Details](2026-10-29-release-readiness.md#current-package-codex-cycle) |
| Claude Code 2.1.308 | Official stable native installation completed on Windows; `--version` and `doctor` passed with no installation issues. Subscription login requires eligible account access, which is unavailable for this test session. | Installation verified; real discovery, explicit invocation, natural selection, save/correction and handoff **deferred pending eligible account access** |
| ChatGPT | No real 30-scenario extraction run performed. | Not yet tested |
| Claude | No real extraction run performed. | Not yet tested |
| Muse Spark 1.3 Contributor via OpenChamber's OpenCode 2.0.15 | Fresh prompt-2 run: 30 × 3, correct sets 28/30, 29/30, 27/30; zero accepted critical violations. One extra-field reply rejected, five legitimate decisions omitted. Earlier failed baseline and follow-up are retained. | **Tested guarded extraction protocol** for the recorded combination; OpenCode skill discovery untested. [Report](2026-10-29-release-readiness.md#fresh-muse-evaluation) |
| GLM / Z.AI | Bundled OpenCode: NVIDIA GLM 5.3 HTTP 410, free Flash HTTP 429, NVIDIA Flash 90s without a completed response. Direct NVIDIA retry: GLM 5.3 HTTP 410; Flash no HTTP response within 120s, separate curl 45s zero bytes, later single 45s retry timed out. | Access checks only; extraction **not tested**, further retries stopped. [Report](2026-10-29-release-readiness.md#access-checks-and-publication-boundary) |

The initial Codex runs used the existing authenticated default model configuration without capturing model identity. The later current-package save captured model/effort as reported above; no Codex-model corpus evaluation is claimed. The initial blocked attempts changed no global runtime or permission settings; the later scoped runtime access correction is described below.

A subsequent user-scope Node.js 22.23.4 installation was verified against the official archive checksum. With that runtime selected for the process, ThreadLatch setup for both agent destinations and all doctor checks passed in a fresh synthetic project. The existing Node 24 installation was preserved. A fresh Codex CLI test using this installed runtime and the real npm tarball again failed at process launch under the workspace-write sandbox: both version and doctor commands returned “Access is denied”. Request/import/apply were not run and canonical memory was unchanged. At that point direct CLI installation checks passed, while the model-driven memory cycle remained blocked.

The execution blocker was subsequently diagnosed: the legacy elevated Windows sandbox runs commands under a separate sandbox account, while the user-scope Node directory initially granted access only to its owner, administrators and SYSTEM. A direct sandbox probe ran the machine-wide Node 24 but denied the user-scope Node 22. Adding read/execute access for the sandbox group to **only the installed Node 22 directory** resolved the failure; the sandbox and existing Node installations stayed enabled and unchanged. Both the runtime probe and ThreadLatch doctor then passed inside the sandbox. A real Codex session saved the two reviewed synthetic items through the CLI; all CLI commands exited zero. Its first import conservatively normalized mixed-role evidence to inference, so it used the documented retry flow with assistant-only evidence before saving the assistant suggestion. This is a successful small integration scenario, not the 30-case provider evaluation.

A separate fresh Codex session received a natural Turkish continuation request, selected ThreadLatch, passed version/doctor and correctly reported SQLite active, cloud sync proposed and no recorded open questions. The canonical archive SHA256 was unchanged after this read-only continuation.

## Gates still pending

- Complete remaining provider evaluations with authorized access: the fresh prompt-2 Muse run meets the scoped threshold; ChatGPT chat, Claude and GLM extraction remain untested. Threshold: at least 27/30 correct sets and no critical active-decision promotion in any repetition of the ten critical cases. Deterministic guard tests and stored-response replay do not substitute for a fresh model run.
- Complete the real host matrix: the recorded Codex save/retry, replacement/cancellation and new-session paths passed; all Claude Code model-driven cycles remain deferred for eligible account access.
- Broaden the tool handoff matrix. One Muse-generated, reviewed CLI replacement/cancellation → fresh Codex reader scenario passed without reviving cancelled decisions; other directions and host-skill paths remain pending.
- Five first-time participants with supported runtime/agent; target four useful cycles within five minutes without coaching. No participants have been tested. [Protocol and observation sheet](first-use-protocol.md).
- Assistive-technology review and remaining first-user UX sign-off. Manual keyboard and 390px checks are recorded; they do not establish full accessibility coverage.
- Evaluate release readiness before stable publication. The private vulnerability reporting channel is now enabled and verified (2026-10-29); Pages remains manual and the application has not been deployed.

Until these are resolved the release remains **preview**. Tested labels apply only to the paths above; no v0.1.0 stable tag or application deployment was performed.

## Code review boundary

A separate read-only reviewer identified large-archive serialization, history budget, reanalysis recovery and false-promotion defects. Regression tests reproduced them before fixes. An account limit initially interrupted the review. The same reviewer resumed and completed it, identifying three additional workflow defects: pinned-item conflict recording, maximum-length conflict reconciliation, and overlapping delete/import operations. All seven Important findings were reproduced and fixed; the final assessment was “with fixes”, with no Critical or Minor findings. Regression tests cover the fixes; no second independent clean verdict is claimed.
