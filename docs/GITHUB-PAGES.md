# GitHub Pages publishing

The repository contains a manually triggered workflow: `.github/workflows/pages.yml`.

## Publish the introduction

1. In repository **Settings → Pages**, select **GitHub Actions** as the source.
2. Open **Actions → Publish GitHub Pages → Run workflow**.
3. Select the default branch and `source: landing`.
4. A successful deployment provides the actual site URL in the `github-pages` environment.

Expected project URL: <https://deays.github.io/threadlatch/>. Treat the deployment result as the source of truth; an expected URL does not establish that publishing succeeded.

The landing build copies only `site/` into the published artifact. It never uploads the repository root, local planning work, or credentials. Actions are pinned to verified commit SHAs. Only the deployment job receives `pages: write` and `id-token: write`. The workflow rejects non-default branches and never publishes on PRs or pushes automatically.

## Publish the application later

Use the existing workflow; do not create a competing deployment workflow. Once the application exists and its complete release checks pass:

1. Ensure the repo root contains `package.json` and a committed `package-lock.json`.
2. Provide npm scripts `typecheck`, `lint`, `test` (non-watch), and `build`.
3. The build must accept the Vite-style `--base` flag and create `dist/index.html`. `dist/` must contain only public web assets; compile CLI code into `dist-cli/`, outside the Pages artifact.
4. Run the full application checks, including E2E, before selecting the app publication mode. This workflow's build is not a replacement for the full release checks.
5. Run the default-branch workflow with `source: app`.

Node 22 is selected for the application build. The workflow derives the base path from GitHub Pages metadata. The planned project path is `/threadlatch/`; root-absolute assets and route refreshes must be tested at that path. For a different build system, deliberately revise this contract and this document together.

Switching from the introduction to the application changes what visitors see at the project URL. Keep compatibility claims accurate. Keep manual deployment as the default unless a later instruction changes the publication policy.

## Recovery

Re-run the workflow with `source: landing` to return to the introduction. Repository permissions, plan eligibility, and environment restrictions may affect Pages availability. Never work around an access error by committing a token, SSH private key, or personal credential.
