# Implementation status

Date: 2026-10-27. Version: 0.1.0-preview.1, unreleased. This is an implementation and verification record, not a claim that every first-release gate is complete. The [original plan](superpowers/plans/2026-10-27-threadlatch.md) remains the specification.

| Plan task | Implemented | Verification / remaining work |
| --- | --- | --- |
| 1 — Protocol/foundation | Strict shared Zod types, versioned extraction prompt, 30 synthetic EN/TR scenarios, pinned npm dependencies and scripts | Schema/input tests, typecheck, lint and builds; real extraction eval remains separate |
| 2 — Import | Plain/role-tagged parser, source preview, editable roles/split/selection, Unicode preservation, branch selection and fingerprints | Parser, size, duplicate and code-fence tests |
| 3 — Analysis | Application-issued proposal IDs, request/source references, full-prompt budget, fenced JSON import and source matches | Malformed/forged/stale/ambiguous/example/suggestion tests; semantic truth still needs review |
| 4 — Merge | Explicit batch save, replacement/cancellation, replay protection, conflicts, manual edits and pins | Core regression tests and browser correction cycle |
| 5 — Persistence/history | IndexedDB and local file adapters, CAS generation/revision checks, immutable history, atomic replacement, locks, full archive validation/remapping | Unit/process tests; real browser two-tab and quota rollback; corrupted backup rejection |
| 6 — Handoff/EN/TR | Bounded escaped Markdown, explicit omissions/errors, JSON backup, EN/TR browser UI and clipboard fallback | Export/i18n tests, real browser English/Turkish workflows and responsive/axe checks |
| 7 — Node CLI | init/status/request/import/apply/export, history/edit/restore, private pending files, instruction hints, separate CLI build | Spawned Node process round-trip/race; actual host write flow remains blocked/pending |
| 8 — Skills/onboarding | One canonical skill, two project destinations, setup/doctor/install/update/uninstall, owned digests and preservation | Local package installation/lifecycle verified on Windows; real host and cross-platform gates remain |
| 9 — Validation | Automated core/process/package tests and production-build Chromium E2E | Provider 30 × 3 evaluations, first-user trials, inter-provider handoff and manual UX sign-off remain open |
| 10 — Public release | EN/TR docs, protocol, contribution/security guidance, synthetic demo and CI definition | Remote CI, verified private reporting channel, stable release and application publication remain open; manual Pages workflow unchanged |

## Technical decisions

- The v1 request envelope adds proposalIds and sourceRevisionIds so model-generated identifiers and cross-branch authority can be checked. Project generation increments for every write, including pending analyses at the same memory revision.
- Semantic interpretation cannot be proved by substring matching. Conservative example/role guards supplement user review; manual changes are visibly labeled.
- Importing an existing browser project creates a separate project and remaps identities/fingerprints. CLI archive restore refuses existing memory; no implicit merge or sync.
- The web review views are composed in one React application module for this preview; core rules and adapters remain separate. The browser has no model/backend dependency.
- Analysis scopes exclude inactive history without deleting it; current-item omissions are explicit. Source reuse/retry creates a new request. Compact archive serialization preserves backup round-trips at the size boundary; restored active provenance is validated too.

## Release gates

See [compatibility evidence](evaluations/compatibility.md) for actual results, concrete environment limitations and pending checks. Local verification currently includes 79 unit/integration tests and 8 real Chromium E2E tests, plus package lifecycle checks. The independent review resumed after a usage reset and delivered its consolidated findings. All seven Important findings were reproduced and fixed with regression tests; no Critical or Minor finding was raised. Do not mark the stable definition of done complete or publish the app while release gates remain unresolved. The public introduction and manual Pages workflow remain available separately.
