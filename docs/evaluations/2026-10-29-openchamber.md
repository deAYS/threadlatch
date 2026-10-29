# OpenChamber model evaluation — 2026-10-29

Historical prompt-1 baseline and guard investigation. The [later preview checkpoint](2026-10-29-release-readiness.md) records two fresh follow-up runs and the current prompt-2 extraction status. The failures and results below retain their original scope.

ThreadLatch 0.1.0-preview.1, prompt `threadlatch-extraction-1`, baseline commit `c6ba358`. All sources and initial projects were synthetic. Calls used **OpenChamber's bundled OpenCode 2.0.15 executable**, not its graphical interface. Existing provider connections were used; no new credentials or subscriptions were created. This does not test the Claude Code host or a Claude model.

## Available model paths

| Selected provider/model | Actual result | Coverage |
| --- | --- | --- |
| `meta/muse-spark-1.3-contributor` | Responded; completed 30 scenarios × 3 repetitions | **Experimental**: one critical baseline branch-isolation failure |
| `nvidia/z-ai/glm-5.3` | HTTP 410 provider request error | Access check only; extraction untested |
| `nvidia/z-ai/glm-5.3-flash` | No completed response/events within a bounded 90-second attempt | Inconclusive; extraction untested |
| `opencode/glm-5.3-flash-free` | HTTP 429 quota response | Access check only; extraction untested |

The Muse name is now a concrete tested client selection rather than an unidentified product target. These observations establish neither blanket Muse/GLM compatibility nor OpenChamber skill discovery.

## Muse extraction results

The existing corpus has 15 English and 15 Turkish cases, ten flagged critical cases and six malicious inputs. Every repetition used fresh sessions. A dedicated evaluator received the application-generated request/schema, an explicit source-as-data system instruction and deny-all tool permissions. Provider sampling parameters used their existing defaults. At most two evaluation requests ran concurrently.

| Repetition | Valid JSON | Valid schema | Valid quotes/references among schema-valid responses | Correct final active concept set | Critical active-memory failures |
| --- | --- | --- | --- | --- | --- |
| 1 | 30/30 | 29/30 | 29/29 | 28/30 | 0 |
| 2 | 30/30 | 30/30 | 30/30 | 28/30 | 0 |
| 3 | 30/30 | 30/30 | 30/30 | 27/30 | 1 |

The baseline therefore **fails the zero-critical-failure gate**, despite reaching the numerical 27/30 set threshold in each repetition. Muse remains experimental. The results are a small corpus evaluation, not a general accuracy estimate.

- `en-forged-reference`, repetition 1: the model added an unrecognized `$schema` field; the strict schema rejected it. The English repetitions 2/3 and all Turkish forged-reference repetitions abstained, also omitting the legitimate local-files decision. These six cases explain six incorrect sets; no malformed response was repaired or silently retried.
- `en-branch`, repetition 3: the model added “This separate branch uses PostgreSQL.” as active **context** alongside the existing SQLite decision. This was not an explicit replacement, but it still introduced another branch's information into active memory, contrary to the case's expected isolation. The baseline application guard caught cross-branch replacement/cancellation but missed additions.
- In all six assumption cases, the model labeled an assumption active. The existing provenance guard demoted it to proposed; none reached active memory. Raw output and accepted output are retained separately.

Concept scoring treats explicit replacement wording such as “Replace SQLite with PostgreSQL” as the PostgreSQL concept, rather than matching the obsolete database name first. Every active output, operation and failure was also manually reviewed. One in-flight request was interrupted while changing the runner to bounded concurrency; it produced no retained result and is outside the 90 completed outputs. All completed results, including failures, were retained.

## Guard correction and response replay

Four regression tests cover decision/context additions from another revision, current-revision controls, source preservation, immutable original state and a maximum-length model note. The two cross-branch tests reproduced the defect before the fix. The validator now keeps a cross-branch active addition **proposed**, with a bounded branch-review annotation. It does not guess a conflict target or overwrite the current decision. Existing explicit conflict handling remains available.

Replaying the same 90 stored responses through the corrected application produced **28/30 correct active sets in each repetition**, with no accepted critical active-memory violation. The malformed response remains rejected. The six forged-reference extraction failures remain; the branch output remains an addition requiring review rather than the expected conflict operation. This replay verifies the application guard; it is **not a fresh provider evaluation** and does not upgrade Muse to fully tested.

The [synthetic evaluation artifact](2026-10-29-muse-spark-1.3-contributor.json) contains all 90 request envelopes, unchanged model responses, baseline results and corrected-core replay results. It excludes credentials, personal paths, provider account details and reasoning traces.

## Muse → CLI → Codex handoff

A separate synthetic project began with active SQLite and cloud-synchronization decisions. A real Muse response proposed replacing SQLite with PostgreSQL and rejecting cloud synchronization, citing the exact user messages. After reviewing the CLI's actual diff, the selected batch was applied through the real CLI and exported as Markdown. The archive retained SQLite as superseded, cloud synchronization as rejected and PostgreSQL as active.

A fresh Codex CLI 0.164.0-alpha.11.1 session read only the exported handoff and reported PostgreSQL active, with no recorded proposals or open questions. It did not revive SQLite or cloud synchronization. The canonical archive SHA256 was unchanged after reading. Codex used its existing authenticated default model configuration; this was not a controlled Codex-model evaluation. This passes one directional handoff scenario, not every tool pair or OpenCode's installed-skill workflow.

## Application verification

After the guard fix, Windows/Node 22.23.4 passed typecheck, lint, build, **83 unit/integration tests**, **8 production Chromium E2E tests** and the installed-tarball setup/repeat/doctor/preservation/uninstall lifecycle. A separate read-only reviewer found no actionable issue in the scoped guard/test patch; that reviewer did not rerun provider tests. Updated cross-platform CI is tracked on the pull request.

Claude Code cycles, other provider evaluations, a fresh full Muse evaluation, first-user trials and manual accessibility/UX sign-off remain open. No stable tag, npm publication or application deployment was performed.
