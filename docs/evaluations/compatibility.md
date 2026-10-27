# Compatibility and evaluation evidence

Date: 2026-10-27. Version: 0.1.0-preview.1. Prompt: threadlatch-extraction-1. Sources and test projects are synthetic. No private session logs are committed.

The 30-case fixture set includes 15 EN/15 TR cases, exactly 10 flagged critical cases and six malicious inputs. Each case records initial active concepts, the expected final active concept set, forbidden promotions, source branch and correction/cancellation operation. These are semantic expectations for a future real-provider review, not exact paraphrase matching. The automated candidate-status tests exercise deterministic role/intent guards; they do not claim to run a model or verify the full expected extraction set.

## Automated local checks

Windows, Node.js 22.23.4: unit/integration tests include strict schemas, exact quotes, malformed replies, examples/suggestions, ambiguity, revisions, branches, replay, immutable sources/history, Unicode paths, symlinks, exclusive locks, full archive remapping and spawned Node process concurrency. IndexedDB unit tests use fake-indexeddb; they are supplemented by real Chromium tests.

Production Vite build served at /threadlatch/: English source → request → fixture JSON → review → save → reload → correction → handoff → JSON backup → delete → restore. Additional checks cover Turkish save/handoff, two-tab races, injected IndexedDB quota rollback, corrupt backup preservation, history restore, deletion-dialog keyboard focus, 390px layout, automated axe contrast/accessibility, plain-text HTML and no unexpected network requests during memory operations. These use fixture responses, not real model extraction.

The actual npm tarball was installed into an isolated local prefix on Windows/Node 22. Setup for both agents, repeat setup, doctor, instruction preservation, package asset allowlist and uninstall-with-memory-preserved passed. Package name lookup returned 404 on 2026-10-27; no name reservation, registry publication or trademark right is claimed.

Remote [CI run 40465377568](https://github.com/deAYS/threadlatch/actions/runs/40465377568) passed at commit 05c1963644806cee44517a9959c75ebb29000a21: clean install, typecheck, lint, 79 unit/integration tests, build and installed-package lifecycle on Ubuntu, Windows and macOS. All 8 Chromium E2E tests also passed on Ubuntu; local Windows Chromium passed separately. Other browser engines and manual accessibility sign-off remain pending.

## Real agent/provider checks

| Tool | Actual observation | Status |
| --- | --- | --- |
| Codex CLI 0.164.0-alpha.11.1, authenticated ChatGPT session | Project-local skill explicitly discovered/read. First synthetic write attempt stopped under Node 24; no archive changes. A second attempt using the supplied Node 22.23.4 executable was denied by the test host's execution sandbox before CLI startup (“Access is denied”). | Partial discovery/error-path check only; successful request/import/apply/new-session handoff **pending** |
| Claude Code | Executable not installed in this environment. Installer filesystem/process tests cover the documented destination only. | Real discovery, explicit invocation, natural selection, save/correction and handoff **pending** |
| ChatGPT | No real 30-scenario extraction run performed. | Not yet tested |
| Claude | No real extraction run performed. | Not yet tested |
| Muse | Target product still needs confirmation. | Not yet tested |
| GLM / Z.AI | No real extraction run performed. | Not yet tested |

The Codex run used its existing authenticated default model configuration; model identity was not captured as a controlled evaluation variable. It is not a completed model evaluation. The sandbox was not weakened and no global runtime/permission settings were changed to obtain a pass.

## Gates still pending

- 30 synthetic scenarios (15 EN, 15 TR), three repetitions per provider, recording valid JSON rate, valid evidence, expected item sets and critical false promotions. Threshold: at least 27/30 correct sets and no critical active-decision promotion in any repetition of the ten critical cases. Deterministic guard tests do not substitute for this.
- Real Codex/Claude Code successful memory cycle, natural and explicit selection, correction, one batch save and new-session continuation, with controlled version/model details.
- Handoff between at least two actual AI tools without reviving cancelled decisions.
- Five first-time participants with supported runtime/agent; target four useful cycles within five minutes without coaching. No participants have been tested.
- Manual keyboard/assistive-technology review and remaining first-user UX sign-off.
- Establish a private vulnerability reporting channel (GitHub reports it disabled as of 2026-10-27) and verify remote release/Pages settings before stable publication.

Until these are resolved the release remains **preview**. No provider is advertised as fully tested, and no v0.1.0 stable tag or application deployment was performed.

## Code review boundary

A separate read-only reviewer identified large-archive serialization, history budget, reanalysis recovery and false-promotion defects. Regression tests reproduced them before fixes. An account limit initially interrupted the review. The same reviewer resumed and completed it, identifying three additional workflow defects: pinned-item conflict recording, maximum-length conflict reconciliation, and overlapping delete/import operations. All seven Important findings were reproduced and fixed; the final assessment was “with fixes”, with no Critical or Minor findings. Regression tests cover the fixes; no second independent clean verdict is claimed.
