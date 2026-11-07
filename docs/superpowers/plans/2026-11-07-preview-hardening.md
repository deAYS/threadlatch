# Preview hardening implementation plan

> Execute inline with the debugging, test-driven-development and executing-plans skills; request one independent whole-change review at the end.

**Goal:** Preserve user scope and durable-write truth, then make the existing local review workflow easier to use.

**Architecture:** Keep shared validation, immutable requests/history, CAS generation and lock rules. Extract small UI selection/workflow helpers as needed; preserve the paper/green/serif interface and existing CLI machine output.

**Tech stack:** Existing TypeScript, React, Vitest, Playwright; process-local Node 22.23.4.

**Spec:** User-authorized 2026-11-07 development handoff, summarized here without private source paths. Existing 2026-10-27 plan still governs protocol and integration boundaries.

## Constraints

- Continue from `889bb02` / `codex/implement-v1`, coordinate with draft PR #1; no second PR, deployment, merge, publication, provider retries or global runtime changes.
- Preserve existing projects, installed agent instructions and user edits. No private conversations or credentials in public artifacts.
- Tests must fail for each reported regression before its production fix.
- Provider account and participant trials remain separate open gates.

## Review focus

- Splitting excluded messages and repeated splits must never widen selected source content.
- Explicit empty scopes must remain empty through replacement and restore; default-all remains distinct.
- Multiple alternatives for the same target require a user choice, including mixed operations.
- Auxiliary-write failure after canonical commit must not imply rollback or duplicate work on retry.
- Recovery must retain source, pasted replies and manual edits, including in Turkish and a second-tab conflict.

## Tasks

### 1. Selection and scope regressions

Files: `src/ui/App.tsx`, focused selection helper if useful, `tests/e2e/selection-scope.spec.ts`.

- [x] Add browser tests asserting final request selectedMessages after selected/excluded splits and scope contents/counts after edit, supersede and restore.
- [x] Run focused Playwright tests and record the expected failures.
- [x] Preserve split selection with index remapping; reconcile explicit scope IDs against current active/proposed IDs on commit without selecting new identities.
- [x] Run focused tests and unit suite.

### 2. Alternative selection regression

Files: `src/core/propose-diff.ts`, `src/ui/App.tsx`, core and browser regression tests.

- [x] Reproduce two validated supersede alternatives targeting one current item; assert automatic selection excludes ambiguous groups and core still refuses a conflicting batch.
- [x] Run failing tests, expose alternative IDs/grouping in diff and require explicit choice; use wording that promises no semantic correctness.
- [x] Run core/browser regressions and unit suite.

### 3. Durable CLI outcomes

Files: `src/cli/commands.ts`, `src/storage/file-projects.ts` only if needed, `tests/cli/commands.test.ts`.

- [x] Inject pending request/proposal write failures with real filesystem obstructions and verify canonical archive/generation.
- [x] Run failing tests. Return successful committed output plus explicit warning and a repair command for reconstructible auxiliary files. Keep canonical failures nonzero and replay protection unchanged.
- [x] Verify recovery and retry never duplicate proposals or applied memory; run unit suite.

### 4. Guided review and readable memory

Files: `src/ui/App.tsx`, focused UI workflow/error helpers, `src/i18n/en.ts`, `src/i18n/tr.ts`, `src/ui/styles.css`, E2E tests.

- [x] Add behavior tests for request status, partial application recovery, retained drafts, search/filter and bilingual error recovery; run before implementation.
- [x] Make source → copy request → bring reply → review/save visible with one next action, source title/date and status; keep technical data in details. Explain scope applies to the next request.
- [x] Add search/status/type filters, counts, larger critical text/touch targets and accessible mobile storage/backup information.
- [x] Reproduce superseded editing in browser; resolve only if confirmed.
- [x] Verify EN/TR with long text at 390px and 1280px and capture synthetic screenshots.

### 5. Setup and skill usability

Files: `src/agents/doctor.ts`, `src/agents/setup.ts`, `src/cli/commands.ts`, canonical skill, package-smoke and agent tests.

- [x] Test conflict-aware next actions and CLI resolution from a target project/session; run failing tests before changes.
- [x] Preserve JSON output contracts, provide an opt-in readable report and stop ready messaging on conflicts/missing CLI access.
- [x] Verify installed tarball lifecycle and target-session CLI commands without changing global settings.

### 6. Verification, review and evidence

- [x] Run typecheck, lint, tests, build, package smoke and full E2E on supported Node.
- [x] Obtain independent review; reproduce and fix important findings, then rerun affected checks.
- [x] Update implementation status, onboarding, roadmap and synthetic evaluation evidence with actual results and remaining external gates.
- [x] Leave a concrete local result coordinated with PR #1; no merge or deploy.

## Execution notes

- 2026-11-07: clean local/remote starting branch at `889bb02`; isolated local branch `codex/preview-hardening`. Node 22.23.4, 83/83 baseline tests pass.
- Ruling: proceed directly under the user's detailed spec and authorization to start; routine product choices do not require a separate design approval round. Keep all implementation in this existing checkout on a separate local branch.
