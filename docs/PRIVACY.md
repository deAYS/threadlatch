# Privacy and data boundaries

## Project introduction page

The introduction in `site/` is a static HTML/CSS page. It has no analytics, cookies, forms, external fonts, remote embeds, JavaScript, or conversation storage. Opening a link to GitHub is a separate visit to GitHub.

GitHub serves the page and may process connection information under its own policies. A static page with no analytics does not mean its hosting provider receives no request metadata.

## Planned application

The application is not yet released. The first-release design specifies local project files for the Node.js CLI and local browser storage for the optional review interface, connected by explicit archive export/import. The application will not automatically send conversations to an AI service. When you give an analysis request to your coding agent or paste one into another service, that service processes the content according to its own policies.

The CLI's planned `.threadlatch/` directory can contain source messages and memory history. It must be excluded from Git by default. A readable Markdown projection is not permission to publish private content. Sharing memory or source excerpts is an explicit user choice; the CLI does not silently sync to the browser or cloud.

Browser storage is not encrypted backup or device synchronization. Browser cleanup, private browsing, changing origin, and storage failures can remove local data. Full JSON backups must be saved separately. Backups may contain private conversations; do not commit them to this public repository.

GitHub project sites hosted under the same `username.github.io` origin do not gain independent origin isolation from different URL paths. An application database name is not a security boundary. Use localhost or a dedicated origin for sensitive work, and review the implemented application's privacy documentation before using it.
