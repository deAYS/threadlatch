# Contributing

Use Node.js 22.x (at least 22.12.0) and npm. Start with `npm ci`, then run the checks listed in the README. Keep the lockfile and exact dependency versions. Add meaningful regression tests for source validation, merge semantics and data preservation; tests of prompt wording alone do not establish model accuracy.

Read the [protocol](docs/protocol.md), [implementation status](docs/IMPLEMENTATION-STATUS.md) and [agent integration](docs/AGENT-INTEGRATION.md). Shared schemas and merge rules belong in the platform-independent core. CLI output goes to dist-cli; web assets go to dist. Preserve the manual Pages workflow. Do not add automatic deployment, provider calls, analytics or history capture without a separately reviewed design.

Use synthetic sources in fixtures, screenshots, issues and PRs. Never submit private conversations, account identifiers, secrets or local machine paths. Review the staged diff before committing. Keep .threadlatch, local test workspaces and package installation manifests out of public Git history.

A PR should explain the user-visible problem, resulting behavior and actual validation. Record unsupported test environments and pending provider evaluations explicitly. Do not advertise a provider as tested from file/process tests alone. Follow the [code of conduct](CODE_OF_CONDUCT.md).
