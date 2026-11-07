# Preview hardening verification — 2026-11-07

Version remains `0.1.0-preview.1`, protocol v1, extraction prompt 2. Starting local and remote PR branch: `codex/implement-v1` at `889bb02aabd973b34715dd9b23ac0beb81b9a546`. PR #1 was verified open and draft. Work was developed on `codex/preview-hardening` from that commit. No application deployment, main merge, stable tag or npm publication is part of this change.

All sources, replies and filesystem faults below are synthetic. Screenshots contain only the example project and synthetic text. No private conversation or provider log is included.

## Reproductions and fixes

| Finding                                               | Observed before the fix                                                                                                                                                                                      | Result and regression coverage                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source split widens selection                         | Three browser cases split before, inside and after an excluded assistant message. Every final request incorrectly contained `Excluded synthetic message.`                                                    | Split parts inherit the original inclusion and later indices shift. Final-request assertions also cover repeated splitting.                                                                                                                                                                                                                                           |
| Scope IDs become invalid                              | After excluding cloud from analysis/handoff scopes and rejecting the selected device constraint, the handoff count stayed `2/2` instead of `1/2`.                                                            | Commit and reload intersect explicit scopes with current eligible IDs; default-all is distinct from explicit empty. Browser tests cover edit, replacement, restore, empty scopes and project switching without selecting replacement identities.                                                                                                                      |
| Automatic selection chooses incompatible alternatives | Two source-validated supersede changes targeting the same item lacked an alternative group; the core rejected their combined application.                                                                    | Diff exposes competing proposal IDs and excludes those groups from automatic selection. User selects one explicitly. Core still rejects conflicting batches. Tests cover mixed supersede/reject/resolve pairs. Selection wording makes no semantic correctness claim.                                                                                                 |
| CLI reports rollback after commit                     | A directory at the proposal-file path caused exit 3 after canonical proposal/generation had advanced. Blocking the pending directory similarly lost the returned request prompt despite a committed request. | Request/import return successful committed output plus an explicit auxiliary warning. `repair --request ID` reconstructs pending files and returns the original prompt without changing canonical bytes or generation. Duplicate import/apply remains rejected. ENOSPC injection at canonical rename verifies unchanged archive/generation on failure and safe retry. |
| Superseded editor inconsistency (candidate confirmed) | A browser status select displayed `active` while the underlying item was `superseded`.                                                                                                                       | Superseded items offer read-only historical inspection; current corrections and revision restore remain separate explicit paths.                                                                                                                                                                                                                                      |

The first four regressions were run failing before their production fixes. The additional editor finding was reproduced in the browser before the read-only behavior was finalized.

## Workflow and recovery

- Review shows source title/date when available and awaiting-reply, ready, partial, applied and needs-reanalysis states. Historical archives without an import timestamp remain supported; no timestamp is invented for them.
- Partial saves retain unselected proposals in immutable history. Remaining changes require reanalysis against the new revision. Scope controls explicitly affect the next request.
- Source edits, exclusions, selected source revision, memory scopes and pasted replies survive in-session recovery and project switching. Drafts are held in session memory; full browser reload is not advertised as draft persistence.
- Stable error codes support EN/TR JSON/schema/size/stale/quota/lock recovery. Original technical details remain accessible. Clipboard denial opens the request for manual copying.
- Search, status/type filters, counts, source links, larger controls and mobile storage/backup guidance preserve the paper/green/serif interface.

## Independent review

A separate read-only reviewer identified project draft isolation, hidden clipboard fallback and a Windows shell-based runner probe, plus runner precedence and narrower test coverage. These were addressed. A Windows marker test reproduced project-local command execution by the old diagnostic probe, then passed after resolving an absolute installed Node entry point without a shell. Doctor and the canonical skill use matching local-first runner selection and the exact reported runner.

The same reviewer checked the fixes and reported no remaining Critical or Important finding in the reviewed fixes. It inspected the added assertions but did not independently rerun the suites. This is a code review result, not stable-release approval.

## Local verification

Windows, process-local Node **22.23.4**; global runtimes and permissions unchanged:

| Check                  | Result                                                                                                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`    | Passed                                                                                                                                                               |
| `npm run lint`         | Passed                                                                                                                                                               |
| `npm test`             | 92 tests passed across 24 files                                                                                                                                      |
| `npm run build`        | CLI and production Vite build passed                                                                                                                                 |
| `npm run test:package` | Actual tarball install, setup/repeat/doctor, target-directory CLI request/import/apply/export cycle, instruction preservation and uninstall preserving memory passed |
| `npm run test:e2e`     | 24 real headless Chromium tests passed against the production build                                                                                                  |

Browser coverage includes EN/TR, 390px and 1280px long content, source-size errors, malformed JSON, unknown roles, quota rollback, stale second writers, retained drafts, alternatives, partial-save recovery, backup/restore, focus, axe checks and no unexpected external requests. Playwright emits an environment `NO_COLOR`/`FORCE_COLOR` warning without a product/test failure.

Visual inspection prompted an extra axe check on the stale-review recovery action. It reproduced a transient contrast failure while the button became primary: the background faded while the text changed immediately. Primary/secondary actions now change their background without that fade; EN/TR review axe checks pass at both widths.

Screenshots are generated by `tests/e2e/first-use.spec.ts`; synthetic evidence is retained in [assets/2026-11-07](assets/2026-11-07/). Browser automation and developer visual inspection do not substitute for participant or assistive-technology trials.

## Remaining boundaries

No new authorized ChatGPT/Claude provider runs, real Codex/Claude Code model sessions, five-participant trials or assistive-technology sign-off were performed. The target-directory package cycle verifies CLI resolution mechanically, not model discovery or sandbox permissions. GLM retries remain stopped. This session verified Windows; earlier three-platform CI remains historical until new CI runs. Preview-to-stable release gates remain open.
