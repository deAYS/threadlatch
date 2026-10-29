# Compatibility and evaluation evidence

Updated: 2026-10-29. Version: 0.1.0-preview.1. Prompt: threadlatch-extraction-1. Sources and test projects are synthetic. No private session logs are committed. Historical checks below retain their original dates/commits; [the latest model evaluation](2026-10-29-openchamber.md) records new evidence and a guard fix.

The 30-case fixture set includes 15 EN/15 TR cases, exactly 10 flagged critical cases and six malicious inputs. Each case records initial active concepts, the expected final active concept set, forbidden promotions, source branch and correction/cancellation operation. These are semantic expectations for real-provider review, not exact paraphrase matching. Muse's first real run is recorded separately below. The automated candidate-status tests exercise deterministic role/intent guards; they do not claim to run a model or verify the full expected extraction set.

## Automated local checks

Windows, Node.js 22.23.4: unit/integration tests include strict schemas, exact quotes, malformed replies, examples/suggestions, ambiguity, revisions, branches, replay, immutable sources/history, Unicode paths, symlinks, exclusive locks, full archive remapping and spawned Node process concurrency. IndexedDB unit tests use fake-indexeddb; they are supplemented by real Chromium tests.

Production Vite build served at /threadlatch/: English source → request → fixture JSON → review → save → reload → correction → handoff → JSON backup → delete → restore. Additional checks cover Turkish save/handoff, two-tab races, injected IndexedDB quota rollback, corrupt backup preservation, history restore, deletion-dialog keyboard focus, 390px layout, automated axe contrast/accessibility, plain-text HTML and no unexpected network requests during memory operations. These use fixture responses, not real model extraction.

The actual npm tarball was installed into an isolated local prefix on Windows/Node 22. Setup for both agents, repeat setup, doctor, instruction preservation, package asset allowlist and uninstall-with-memory-preserved passed. Package name lookup returned 404 on 2026-10-27; no name reservation, registry publication or trademark right is claimed.

Remote [CI run 40465377568](https://github.com/deAYS/threadlatch/actions/runs/40465377568) passed at commit 05c1963644806cee44517a9959c75ebb29000a21: clean install, typecheck, lint, 79 unit/integration tests, build and installed-package lifecycle on Ubuntu, Windows and macOS. All 8 Chromium E2E tests also passed on Ubuntu; local Windows Chromium passed separately. Other browser engines and manual accessibility sign-off remain pending.

## Real agent/provider checks

| Tool | Actual observation | Status |
| --- | --- | --- |
| Codex CLI 0.164.0-alpha.11.1, authenticated ChatGPT session | Project-local skill discovered/read. After fixing runtime execution access, a real synthetic request/import/retry/apply cycle saved SQLite as an active user decision and cloud sync as a proposed assistant suggestion, with exact source evidence. A fresh session selected the skill from a Turkish continuation request and correctly read those distinctions without changing the archive. | Initial save, proposal retry and new-session continuation verified; cancellation, cross-tool handoff and full provider evaluation **pending** |
| Claude Code 2.1.308 | Official stable native installation completed on Windows; `--version` and `doctor` passed with no installation issues. Subscription login requires eligible account access, which is unavailable for this test session. | Installation verified; real discovery, explicit invocation, natural selection, save/correction and handoff **deferred pending eligible account access** |
| ChatGPT | No real 30-scenario extraction run performed. | Not yet tested |
| Claude | No real extraction run performed. | Not yet tested |
| Muse Spark 1.3 Contributor via OpenChamber's OpenCode 2.0.15 | `meta/muse-spark-1.3-contributor`: 30 scenarios × 3, correct sets 28/30, 28/30, 27/30; one critical baseline branch failure. Application guard fixed; stored-response replay blocks it. | **Experimental**; replay is not a fresh provider evaluation. [Report](2026-10-29-openchamber.md) |
| GLM / Z.AI via OpenChamber's OpenCode 2.0.15 | NVIDIA GLM 5.3 HTTP 410; OpenCode free GLM Flash HTTP 429; NVIDIA GLM Flash had no completed response within 90 seconds. | Access checks only; extraction not yet tested. [Report](2026-10-29-openchamber.md) |

The Codex runs used the existing authenticated default model configuration; model identity was not captured as a controlled evaluation variable. They are not a completed model evaluation. The initial blocked attempts changed no global runtime or permission settings; the later scoped runtime access correction is described below.

A subsequent user-scope Node.js 22.23.4 installation was verified against the official archive checksum. With that runtime selected for the process, ThreadLatch setup for both agent destinations and all doctor checks passed in a fresh synthetic project. The existing Node 24 installation was preserved. A fresh Codex CLI test using this installed runtime and the real npm tarball again failed at process launch under the workspace-write sandbox: both version and doctor commands returned “Access is denied”. Request/import/apply were not run and canonical memory was unchanged. At that point direct CLI installation checks passed, while the model-driven memory cycle remained blocked.

The execution blocker was subsequently diagnosed: the legacy elevated Windows sandbox runs commands under a separate sandbox account, while the user-scope Node directory initially granted access only to its owner, administrators and SYSTEM. A direct sandbox probe ran the machine-wide Node 24 but denied the user-scope Node 22. Adding read/execute access for the sandbox group to **only the installed Node 22 directory** resolved the failure; the sandbox and existing Node installations stayed enabled and unchanged. Both the runtime probe and ThreadLatch doctor then passed inside the sandbox. A real Codex session saved the two reviewed synthetic items through the CLI; all CLI commands exited zero. Its first import conservatively normalized mixed-role evidence to inference, so it used the documented retry flow with assistant-only evidence before saving the assistant suggestion. This is a successful small integration scenario, not the 30-case provider evaluation.

A separate fresh Codex session received a natural Turkish continuation request, selected ThreadLatch, passed version/doctor and correctly reported SQLite active, cloud sync proposed and no recorded open questions. The canonical archive SHA256 was unchanged after this read-only continuation.

## Gates still pending

- Complete provider evaluations: Muse's first 30 × 3 run failed the critical branch-isolation gate and remains experimental. Other providers and a fresh full Muse run remain pending. Threshold: at least 27/30 correct sets and no critical active-decision promotion in any repetition of the ten critical cases. Deterministic guard tests and stored-response replay do not substitute for a fresh model run.
- Complete the real host matrix with controlled version/model details: Codex has passed one explicit save/retry scenario and natural Turkish new-session continuation; decision replacement/cancellation and all Claude Code model-driven cycles remain pending.
- Broaden the tool handoff matrix. One Muse-generated, reviewed CLI replacement/cancellation → fresh Codex reader scenario passed without reviving cancelled decisions; other directions and host-skill paths remain pending.
- Five first-time participants with supported runtime/agent; target four useful cycles within five minutes without coaching. No participants have been tested.
- Manual keyboard/assistive-technology review and remaining first-user UX sign-off.
- Establish a private vulnerability reporting channel (GitHub reports it disabled as of 2026-10-27) and verify remote release/Pages settings before stable publication.

Until these are resolved the release remains **preview**. No provider is advertised as fully tested, and no v0.1.0 stable tag or application deployment was performed.

## Code review boundary

A separate read-only reviewer identified large-archive serialization, history budget, reanalysis recovery and false-promotion defects. Regression tests reproduced them before fixes. An account limit initially interrupted the review. The same reviewer resumed and completed it, identifying three additional workflow defects: pinned-item conflict recording, maximum-length conflict reconciliation, and overlapping delete/import operations. All seven Important findings were reproduced and fixed; the final assessment was “with fixes”, with no Critical or Minor findings. Regression tests cover the fixes; no second independent clean verdict is claimed.
